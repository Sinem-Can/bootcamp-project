import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.services.user_service import get_user_service

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
  service = get_user_service()
  count = len(service.list_users())
  logging.info('TemizSepet API ready — %d kullanıcı yüklü (kayıtlar: data/users.json)', count)
  yield


app = FastAPI(
  title='TemizSepet API',
  description='TemizSepet backend — in-memory kullanıcı yönetimi (MVP iskelet)',
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
