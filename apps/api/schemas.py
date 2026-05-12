import re
from pydantic import BaseModel, field_validator

_URL_RE = re.compile(r"^https?://", re.IGNORECASE)


class ShortenRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not _URL_RE.match(v):
            raise ValueError("Must be a valid URL")
        if len(v) > 2048:
            raise ValueError("URL must be 2048 characters or fewer")
        return v


class ShortenResponse(BaseModel):
    code: str
    shortUrl: str
    originalUrl: str
    createdAt: str


class StatsResponse(BaseModel):
    code: str
    originalUrl: str
    clicks: int
    createdAt: str
