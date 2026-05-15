from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import create_access_token
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services.user_service import UserService, get_user_service

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
  payload: RegisterRequest,
  service: UserService = Depends(get_user_service),
) -> AuthResponse:
  try:
    user = service.register_user(
      email=str(payload.email),
      password=payload.password,
      full_name=payload.full_name,
    )
  except ValueError as exc:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

  token = create_access_token(subject=str(user.id))
  return AuthResponse(access_token=token)


@router.post('/login', response_model=AuthResponse)
async def login(
  payload: LoginRequest,
  service: UserService = Depends(get_user_service),
) -> AuthResponse:
  user = service.authenticate(email=str(payload.email), password=payload.password)
  if not user:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

  token = create_access_token(subject=str(user.id))
  return AuthResponse(access_token=token)
