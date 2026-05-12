from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from database import get_db, AsyncSessionLocal
from models import Link
from redis_client import redis, short_code_key, REDIS_TTL_SHORT_CODE

router = APIRouter()


async def _increment_clicks(code: str) -> None:
    async with AsyncSessionLocal() as db:
        await db.execute(update(Link).where(Link.code == code).values(clicks=Link.clicks + 1))
        await db.commit()


@router.get("/{code}")
async def redirect(code: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    cached = await redis.get(short_code_key(code))
    if cached:
        background_tasks.add_task(_increment_clicks, code)
        return RedirectResponse(url=cached, status_code=302)

    result = await db.execute(select(Link).where(Link.code == code))
    link = result.scalar_one_or_none()
    if not link:
        return JSONResponse(
            status_code=404,
            content={"error": "NOT_FOUND", "message": f"Short code '{code}' not found"},
        )

    await redis.set(short_code_key(code), link.original_url, ex=REDIS_TTL_SHORT_CODE)
    await db.execute(update(Link).where(Link.code == code).values(clicks=Link.clicks + 1))
    await db.commit()

    return RedirectResponse(url=link.original_url, status_code=302)
