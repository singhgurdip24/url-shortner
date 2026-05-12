import redis.asyncio as aioredis
from config import config

redis = aioredis.from_url(config.redis_url, decode_responses=True)

REDIS_TTL_SHORT_CODE = 60 * 60 * 24  # 24 hours


def short_code_key(code: str) -> str:
    return f"short:{code}"
