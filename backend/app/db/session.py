from collections.abc import AsyncIterator

from sqlalchemy.engine import URL
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


def _create_engine():
  url = settings.database_url
  kwargs: dict = {'pool_pre_ping': True}
  if URL.create(url).get_backend_name() == 'sqlite':
    kwargs['connect_args'] = {'check_same_thread': False}
  return create_async_engine(url, **kwargs)


engine = _create_engine()
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncIterator[AsyncSession]:
  async with async_session() as session:
    yield session
