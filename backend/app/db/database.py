from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


engine = None
async_session_factory = None


def init_db(database_url: str):
    global engine, async_session_factory
    async_url = (
        database_url
        .replace("postgresql://", "postgresql+asyncpg://")
        .replace("postgres://", "postgresql+asyncpg://")
    )
    engine = create_async_engine(async_url, echo=False)
    async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


def get_session_factory():
    if async_session_factory is None:
        raise RuntimeError("Banco de dados não inicializado.")
    return async_session_factory


async def get_db() -> AsyncSession:
    async with get_session_factory()() as session:
        yield session
