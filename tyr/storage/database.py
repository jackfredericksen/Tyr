"""SQLite database connection via SQLAlchemy async."""
from __future__ import annotations

from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from tyr.core.logging import get_logger
from tyr.storage.models_db import Base

logger = get_logger(__name__)

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


async def init_db(db_path: str = "data/db/tyr.db") -> None:
    """Initialize the database, creating tables if needed."""
    global _engine, _session_factory

    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    url = f"sqlite+aiosqlite:///{db_path}"

    _engine = create_async_engine(url, echo=False)
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database initialized: %s", db_path)


def get_session() -> AsyncSession:
    if _session_factory is None:
        raise RuntimeError("Database not initialized — call init_db() first")
    return _session_factory()


async def close_db() -> None:
    global _engine
    if _engine:
        await _engine.dispose()
        _engine = None
    logger.info("Database connection closed")
