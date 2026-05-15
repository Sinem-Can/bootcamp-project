from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.core.security import hash_password, verify_password
from app.schemas.user import UserCreate


@dataclass
class UserRecord:
  id: UUID
  email: str
  full_name: str
  created_at: datetime
  hashed_password: str | None = None


class UserService:
  """In-memory user store (veriler sunucu kapanınca silinir)."""

  def __init__(self) -> None:
    self._users: dict[UUID, UserRecord] = {}

  def _find_by_email(self, email: str) -> UserRecord | None:
    normalized = email.lower()
    return next((user for user in self._users.values() if user.email == normalized), None)

  def list_users(self) -> list[UserRecord]:
    return sorted(self._users.values(), key=lambda user: user.created_at)

  def create_user(self, payload: UserCreate) -> UserRecord:
    email = payload.email.lower()
    if self._find_by_email(email):
      raise ValueError('Email already registered')

    record = UserRecord(
      id=uuid4(),
      email=email,
      full_name=payload.full_name.strip(),
      created_at=datetime.now(timezone.utc),
    )
    self._users[record.id] = record
    return record

  def register_user(self, *, email: str, password: str, full_name: str) -> UserRecord:
    normalized_email = email.lower()
    if self._find_by_email(normalized_email):
      raise ValueError('Email already registered')

    record = UserRecord(
      id=uuid4(),
      email=normalized_email,
      full_name=full_name.strip(),
      created_at=datetime.now(timezone.utc),
      hashed_password=hash_password(password=password),
    )
    self._users[record.id] = record
    return record

  def authenticate(self, *, email: str, password: str) -> UserRecord | None:
    user = self._find_by_email(email)
    if not user or not user.hashed_password:
      return None
    if not verify_password(plain_password=password, hashed_password=user.hashed_password):
      return None
    return user

  def delete_user(self, user_id: UUID) -> bool:
    return self._users.pop(user_id, None) is not None


_user_service = UserService()


def get_user_service() -> UserService:
  return _user_service
