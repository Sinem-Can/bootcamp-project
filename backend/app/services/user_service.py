from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.schemas.user import UserCreate


@dataclass
class UserRecord:
  id: UUID
  email: str
  full_name: str
  created_at: datetime


class UserService:
  """In-memory user store (veriler sunucu kapanınca silinir)."""

  def __init__(self) -> None:
    self._users: dict[UUID, UserRecord] = {}

  def list_users(self) -> list[UserRecord]:
    return sorted(self._users.values(), key=lambda user: user.created_at)

  def create_user(self, payload: UserCreate) -> UserRecord:
    email = payload.email.lower()
    if any(user.email == email for user in self._users.values()):
      raise ValueError('Email already registered')

    record = UserRecord(
      id=uuid4(),
      email=email,
      full_name=payload.full_name.strip(),
      created_at=datetime.now(timezone.utc),
    )
    self._users[record.id] = record
    return record

  def delete_user(self, user_id: UUID) -> bool:
    return self._users.pop(user_id, None) is not None


_user_service = UserService()


def get_user_service() -> UserService:
  return _user_service
