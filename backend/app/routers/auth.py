from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import AuthResponse, AuthUserInfo, RegisterRequest

router = APIRouter(prefix='/auth', tags=['auth'])

_LOGIN_DESCRIPTION = """OAuth 2 uyumlu form gövdesi.

- **username**: kayıtlı **e-posta** adresiniz (OAuth2 alanı olduğu için isim olarak `username` kullanılıyor).
- **password**: şifreniz.

Swagger’daki yeşil **Authorize** ile de aynı uç kullanılabilir."""

_LOGIN_SUMMARY = 'Giriş (OAuth2 password form — username alanında e-posta)'


@router.post('/register', response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
  email_normalized = str(payload.email).lower()
  result = await db.execute(select(User).where(User.email == email_normalized))
  existing = result.scalar_one_or_none()
  if existing:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered')

  user = User(
    email=email_normalized,
    full_name=payload.full_name.strip(),
    hashed_password=hash_password(password=payload.password),
    alerjenler={'allergens': []},
    diyet_tipi=None,
    istenmeyen_maddeler={'undesired': []},
  )
  db.add(user)
  await db.commit()
  await db.refresh(user)

  token = create_access_token(subject=str(user.id))
  return AuthResponse(
    access_token=token,
    user=AuthUserInfo(id=user.id, email=user.email, full_name=user.full_name),
  )


@router.post(
  '/login',
  response_model=AuthResponse,
  summary=_LOGIN_SUMMARY,
  description=_LOGIN_DESCRIPTION,
)
async def login(
  form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
  db: AsyncSession = Depends(get_db),
) -> AuthResponse:
  email_normalized = str(form_data.username).strip().lower()
  row_result = await db.execute(select(User).where(User.email == email_normalized))
  row = row_result.scalar_one_or_none()
  if not row or not row.hashed_password:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

  if not verify_password(plain_password=form_data.password, hashed_password=row.hashed_password):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

  token = create_access_token(subject=str(row.id))
  return AuthResponse(
    access_token=token,
    user=AuthUserInfo(id=row.id, email=row.email, full_name=row.full_name),
  )
