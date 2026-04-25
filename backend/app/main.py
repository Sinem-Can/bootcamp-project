from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine
from app.db.models import Base
from app.routers.auth import router as auth_router
from app.routers.missing_product import router as missing_product_router
from app.routers.product import router as product_router
from app.routers.user import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
  async with engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
  yield


app = FastAPI(title='TemizSepet API', lifespan=lifespan)
app.add_middleware(
  CORSMiddleware,
  allow_origins=['*'],
  allow_credentials=True,
  allow_methods=['*'],
  allow_headers=['*'],
)
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(product_router)
app.include_router(missing_product_router)


@app.get('/health')
async def health():
  return {'ok': True}

