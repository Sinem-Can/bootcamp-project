from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
  existing = await db.execute(select(User).where(User.email == payload.email))
  if existing.scalar_one_or_none():
    raise HTTPException(status_code=409, detail='Email already registered')

  user = User(
    email=payload.email,
    hashed_password=hash_password(password=payload.password),
    alerjenler={'allergens': []},
    diyet_tipi=None,
    istenmeyen_maddeler={'undesired': []},
  )
  db.add(user)
  await db.commit()
  await db.refresh(user)

  token = create_access_token(subject=str(user.id))
  return AuthResponse(access_token=token)


@router.post('/login', response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
  result = await db.execute(select(User).where(User.email == payload.email))
  user = result.scalar_one_or_none()
  if not user:
    raise HTTPException(status_code=401, detail='Invalid credentials')

  if not verify_password(plain_password=payload.password, hashed_password=user.hashed_password):
    raise HTTPException(status_code=401, detail='Invalid credentials')

  token = create_access_token(subject=str(user.id))
  return AuthResponse(access_token=token)
