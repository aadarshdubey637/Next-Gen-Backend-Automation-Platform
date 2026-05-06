"""
PostgreSQL connection via async SQLAlchemy.
"""
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(
    settings.POSTGRES_URL,
    echo=settings.POSTGRES_ECHO,
    pool_size=20,           # Keep up to 20 connections open
    max_overflow=10,        # Allow 10 extra connections during spikes
    pool_timeout=60,        # Increased to 60s to handle slow SQLite/disk
    pool_recycle=1800,      # Recycle connections every 30 mins to prevent timeouts
    pool_pre_ping=True,     # Check connection health before using it
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_postgres():
    """Create all tables on startup (dev convenience)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def shutdown_postgres():
    """Dispose engine on shutdown."""
    await engine.dispose()
