from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.db.models import User
from app.schemas.auth import AuthResponse, AuthUserInfo, LoginRequest, RegisterRequest

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
  payload: RegisterRequest,
  db: Session = Depends(get_db),
) -> AuthResponse:
  email_normalized = str(payload.email).lower()
  existing = db.execute(select(User).where(User.email == email_normalized)).scalar_one_or_none()
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
  db.commit()
  db.refresh(user)

  token = create_access_token(subject=str(user.id))
  return AuthResponse(
    access_token=token,
    user=AuthUserInfo(id=user.id, email=user.email, full_name=user.full_name),
  )


@router.post('/login', response_model=AuthResponse)
def login(
  payload: LoginRequest,
  db: Session = Depends(get_db),
) -> AuthResponse:
  email_normalized = str(payload.email).lower()
  row = db.execute(select(User).where(User.email == email_normalized)).scalar_one_or_none()
  if not row or not row.hashed_password:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

  if not verify_password(plain_password=payload.password, hashed_password=row.hashed_password):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

  token = create_access_token(subject=str(row.id))
  return AuthResponse(
    access_token=token,
    user=AuthUserInfo(id=row.id, email=row.email, full_name=row.full_name),
  )
