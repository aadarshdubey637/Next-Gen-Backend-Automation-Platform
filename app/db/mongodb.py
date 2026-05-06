"""
MongoDB connection via Motor (async driver).
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None


async def init_mongodb():
    """Initialize Motor client on app startup."""
    global _client, _database
    _client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=5000, # 5s timeout instead of default 30s
        connectTimeoutMS=5000,
        maxPoolSize=50
    )
    _database = _client[settings.MONGODB_DB_NAME]


async def shutdown_mongodb():
    """Close Motor client on app shutdown."""
    global _client
    if _client:
        _client.close()


def get_mongodb() -> AsyncIOMotorDatabase:
    """Return the database instance."""
    if _database is None:
        raise RuntimeError("MongoDB not initialized. Call init_mongodb() first.")
    return _database


def get_collection(name: str):
    """Shortcut to get a collection by name."""
    return get_mongodb()[name]
