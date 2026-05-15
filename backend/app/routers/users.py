from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.session import get_db
from app.deps.auth import get_current_user
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix='/users', tags=['users'])


@router.get('', response_model=list[UserResponse])
async def list_users(
  db: AsyncSession = Depends(get_db),
  _current_user: User = Depends(get_current_user),
) -> list[UserResponse]:
  result = await db.execute(select(User).order_by(User.created_at))
  rows = result.scalars().all()
  return [UserResponse.model_validate(r) for r in rows]


@router.post('', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
  payload: UserCreate,
  db: AsyncSession = Depends(get_db),
  _current_user: User = Depends(get_current_user),
) -> UserResponse:
  email_normalized = str(payload.email).lower()
  result = await db.execute(select(User).where(User.email == email_normalized))
  existing = result.scalar_one_or_none()
  if existing:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered')

  user = User(
    email=email_normalized,
    full_name=payload.full_name.strip(),
    hashed_password=None,
    alerjenler={'allergens': []},
    diyet_tipi=None,
    istenmeyen_maddeler={'undesired': []},
  )
  db.add(user)
  await db.commit()
  await db.refresh(user)
  return UserResponse.model_validate(user)


@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
  user_id: int,
  db: AsyncSession = Depends(get_db),
  _current_user: User = Depends(get_current_user),
) -> None:
  row = await db.get(User, user_id)
  if not row:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
  db.delete(row)
  await db.commit()
