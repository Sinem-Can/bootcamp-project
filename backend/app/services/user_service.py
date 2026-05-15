import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from app.core.security import hash_password, verify_password
from app.schemas.user import UserCreate

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parents[2] / 'data'
_STORE_FILE = _DATA_DIR / 'users.json'


@dataclass
class UserRecord:
  id: UUID
  email: str
  full_name: str
  created_at: datetime
  hashed_password: str | None = None


class UserService:
  """Kullanıcılar bellekte tutulur; geliştirme için data/users.json'a yazılır."""

  def __init__(self) -> None:
    self._users: dict[UUID, UserRecord] = {}
    self._load()

  def _load(self) -> None:
    if not _STORE_FILE.exists():
      return
    try:
      payload = json.loads(_STORE_FILE.read_text(encoding='utf-8'))
      for item in payload:
        record = UserRecord(
          id=UUID(item['id']),
          email=item['email'],
          full_name=item['full_name'],
          created_at=datetime.fromisoformat(item['created_at']),
          hashed_password=item.get('hashed_password'),
        )
        self._users[record.id] = record
      logger.info('Loaded %d users from %s', len(self._users), _STORE_FILE)
    except (OSError, json.JSONDecodeError, KeyError, ValueError) as exc:
      logger.warning('Could not load user store: %s', exc)

  def _persist(self) -> None:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = [
      {
        'id': str(user.id),
        'email': user.email,
        'full_name': user.full_name,
        'created_at': user.created_at.isoformat(),
        'hashed_password': user.hashed_password,
      }
      for user in self._users.values()
    ]
    _STORE_FILE.write_text(
      json.dumps(payload, ensure_ascii=False, indent=2),
      encoding='utf-8',
    )

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
    self._persist()
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
    self._persist()
    logger.info('Registered %s (total users: %d)', record.email, len(self._users))
    return record

  def authenticate(self, *, email: str, password: str) -> UserRecord | None:
    user = self._find_by_email(email)
    if not user or not user.hashed_password:
      return None
    if not verify_password(plain_password=password, hashed_password=user.hashed_password):
      return None
    return user

  def delete_user(self, user_id: UUID) -> bool:
    removed = self._users.pop(user_id, None)
    if removed:
      self._persist()
      return True
    return False


_user_service = UserService()


def get_user_service() -> UserService:
  return _user_service
