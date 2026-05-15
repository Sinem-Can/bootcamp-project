import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from app.core.config import settings
from app.db import models as db_models  # noqa: F401 — tabloları metadata'ya kaydet
from app.db.migration import upgrade_to_head_sync
from app.db.session import async_session
from app.routers.auth import router as auth_router
from app.routers.missing_product import router as missing_product_router
from app.routers.product import router as product_router
from app.routers.user import router as user_router
from app.routers.users import router as users_router

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
  if settings.run_migrations_on_startup:
    logging.info('DB: alembic upgrade head (RUN_MIGRATIONS_ON_STARTUP)')
    await asyncio.to_thread(upgrade_to_head_sync)
  else:
    logging.info('DB migrations skipped; set RUN_MIGRATIONS_ON_STARTUP=true or run: alembic upgrade head')

  async with async_session() as session:
    count = await session.scalar(select(func.count()).select_from(db_models.User)) or 0

  logging.info('TemizSepet API ready (%d users)', count)
  yield


app = FastAPI(
  title='TemizSepet API',
  description='TemizSepet backend — FastAPI + SQLAlchemy (async)',
  version='0.1.0',
  lifespan=lifespan,
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=['*'],
  allow_credentials=True,
  allow_methods=['*'],
  allow_headers=['*'],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(user_router)
app.include_router(missing_product_router)
app.include_router(product_router)


@app.get('/health', tags=['health'])
async def health() -> dict[str, bool]:
  return {'ok': True}
