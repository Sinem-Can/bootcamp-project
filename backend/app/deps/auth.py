from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import get_db


async def get_current_user(
  authorization: str | None = Header(default=None),
  db: AsyncSession = Depends(get_db),
) -> User:
  if not authorization:
    raise HTTPException(status_code=401, detail='Missing Authorization header')

  prefix = 'bearer '
  if not authorization.lower().startswith(prefix):
    raise HTTPException(status_code=401, detail='Invalid Authorization scheme')

  token = authorization[len(prefix) :].strip()
  try:
    payload = decode_access_token(token=token)
  except ValueError:
    raise HTTPException(status_code=401, detail='Invalid token')

  subject = payload.get('sub')
  if not subject:
    raise HTTPException(status_code=401, detail='Invalid token')

  result = await db.execute(select(User).where(User.id == int(subject)))
  user = result.scalar_one_or_none()
  if not user:
    raise HTTPException(status_code=401, detail='User not found')

  return user
