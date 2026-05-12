import uuid
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from nanoid import generate

from database import get_db
from models import Link
from schemas import ShortenRequest, ShortenResponse
from redis_client import redis, short_code_key, REDIS_TTL_SHORT_CODE
from config import config
from limiter import limiter

router = APIRouter()


@router.post("/shorten", response_model=ShortenResponse, status_code=201)
@limiter.limit("20/minute")
async def shorten(request: Request, body: ShortenRequest, db: AsyncSession = Depends(get_db)):
    url = body.url
    code = generate(size=config.short_code_length)

    link = Link(id=str(uuid.uuid4()), code=code, original_url=url)
    db.add(link)
    await db.commit()
    await db.refresh(link)

    await redis.set(short_code_key(code), url, ex=REDIS_TTL_SHORT_CODE)

    return ShortenResponse(
        code=link.code,
        short_url=f"{config.base_url}/{link.code}",
        original_url=link.original_url,
        created_at=link.created_at.isoformat(),
    )
