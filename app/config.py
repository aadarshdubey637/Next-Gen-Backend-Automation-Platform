"""
Application configuration — loads from .env with sensible defaults.
"""
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ── App ─────────────────────────────────────────────
    APP_NAME: str = "Backend Automation Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ── JWT ─────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Database ──────────────────────────────────────
    MYSQL_URL: str = Field(
        default="mysql+aiomysql://user:password@localhost:3306/db_name",
        validation_alias=AliasChoices("MYSQL_URL", "DATABASE_URL")
    )
    POSTGRES_ECHO: bool = False

    # ── MongoDB ─────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "backend_platform"

    # ── Redis ───────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── AI Settings ─────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GROK_API_KEY: Optional[str] = None
    AI_PROVIDER: str = "gemini"  # "openai", "gemini", or "grok"
    OPENAI_MODEL: str = "gpt-4o"
    GROK_MODEL: str = "grok-2-1212"
    
    # ── Local LLM / Custom Provider ──
    CUSTOM_AI_BASE_URL: Optional[str] = None # e.g. "http://localhost:11434/v1" for Ollama
    CUSTOM_AI_MODEL: str = "llama3"

    # ── Rate Limiting ───────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60

    # ── Logging ─────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
