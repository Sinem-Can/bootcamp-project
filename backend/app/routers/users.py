from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix='/users', tags=['users'])


@router.get('', response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)) -> list[UserResponse]:
  result = db.execute(select(User).order_by(User.created_at))
  rows = result.scalars().all()
  return [UserResponse.model_validate(r) for r in rows]


@router.post('', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
  payload: UserCreate,
  db: Session = Depends(get_db),
) -> UserResponse:
  email_normalized = str(payload.email).lower()
  existing = db.execute(select(User).where(User.email == email_normalized)).scalar_one_or_none()
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
  db.commit()
  db.refresh(user)
  return UserResponse.model_validate(user)


@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)) -> None:
  row = db.get(User, user_id)
  if not row:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
  db.delete(row)
  db.commit()
