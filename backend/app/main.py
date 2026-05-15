import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from app.database import Base, SessionLocal, engine
from app.db import models as db_models  # noqa: F401 — tabloları metadata'ya kaydet
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
  Base.metadata.create_all(bind=engine)
  with SessionLocal() as session:
    count = session.scalar(select(func.count()).select_from(db_models.User)) or 0
  logging.info('TemizSepet API ready — SQLite: temizsepet.db (%d users)', count)
  yield


app = FastAPI(
  title='TemizSepet API',
  description='TemizSepet backend — SQLite + SQLAlchemy',
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


@app.get('/health', tags=['health'])
async def health() -> dict[str, bool]:
  return {'ok': True}
