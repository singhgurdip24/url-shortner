import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config import config
from limiter import limiter
from redis_client import redis
from routes.shorten import router as shorten_router
from routes.stats import router as stats_router
from routes.redirect import router as redirect_router


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await redis.aclose()


app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.allowed_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shorten_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(redirect_router)
