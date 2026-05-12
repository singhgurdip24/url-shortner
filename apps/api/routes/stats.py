from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Link
from schemas import StatsResponse

router = APIRouter()


@router.get("/stats/{code}", response_model=StatsResponse)
async def stats(code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Link).where(Link.code == code))
    link = result.scalar_one_or_none()
    if not link:
        return JSONResponse(
            status_code=404,
            content={"error": "NOT_FOUND", "message": f"Short code '{code}' not found"},
        )

    return StatsResponse(
        code=link.code,
        originalUrl=link.original_url,
        clicks=link.clicks,
        createdAt=link.created_at.isoformat(),
    )
