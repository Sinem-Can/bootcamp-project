from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(*, password: str) -> str:
  digest = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
  return digest.decode('utf-8')


def verify_password(*, plain_password: str, hashed_password: str) -> bool:
  return bcrypt.checkpw(
    plain_password.encode('utf-8'),
    hashed_password.encode('utf-8'),
  )


def create_access_token(*, subject: str) -> str:
  expires_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_expires_min)
  payload = {'sub': subject, 'exp': expires_at}
  return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_access_token(*, token: str) -> dict:
  try:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
  except JWTError as exc:
    raise ValueError('Invalid token') from exc
