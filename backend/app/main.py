from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router

app = FastAPI(
  title='TemizSepet API',
  description='TemizSepet backend — in-memory kullanıcı yönetimi (MVP iskelet)',
  version='0.1.0',
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
