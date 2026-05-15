from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import get_db


oauth2_scheme = OAuth2PasswordBearer(
  tokenUrl='/auth/login',
  scheme_name='JWT',
  description='Swagger: Authorize ile token almak için kullanıcı e-postanızı **username** alanına yazın (OAuth2 özelliği).',
  auto_error=False,
)


async def get_current_user(
  token: Annotated[str | None, Depends(oauth2_scheme)],
  db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
  if not token:
    raise HTTPException(status_code=401, detail='Could not validate credentials')

  try:
    payload = decode_access_token(token=token)
  except ValueError:
    raise HTTPException(status_code=401, detail='Could not validate credentials')

  subject = payload.get('sub')
  if not subject:
    raise HTTPException(status_code=401, detail='Could not validate credentials')

  result = await db.execute(select(User).where(User.id == int(subject)))
  user = result.scalar_one_or_none()
  if not user:
    raise HTTPException(status_code=401, detail='Could not validate credentials')

  return user
