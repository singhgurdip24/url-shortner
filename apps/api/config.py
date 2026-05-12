from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 3001
    allowed_origin: str = "http://localhost:5173"
    base_url: str = "http://localhost:3001"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/urlshortener"
    redis_url: str = "redis://localhost:6379"
    short_code_length: int = 7

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


config = Settings()
