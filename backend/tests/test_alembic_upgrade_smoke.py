"""Boş SQLite dosyasında göçlemenin başarısı (integration)."""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

from sqlalchemy import create_engine

import app.db.models  # noqa: F401 — metadata
from app.db.base import Base


def test_alembic_upgrade_on_empty_database():
  backend_root = Path(__file__).resolve().parents[1]

  fd, path = tempfile.mkstemp(prefix='temiz_al_', suffix='.sqlite')
  os.close(fd)
  posix_path = Path(path).as_posix()

  try:
    env = os.environ.copy()
    env['DATABASE_URL'] = f'sqlite+aiosqlite:///{posix_path}'
    env['RUN_MIGRATIONS_ON_STARTUP'] = 'false'
    env.setdefault('PYTHONPATH', str(backend_root))

    subprocess.run(
      [sys.executable, '-m', 'alembic', 'upgrade', 'head'],
      cwd=str(backend_root),
      env=env,
      check=True,
      capture_output=True,
      text=True,
    )
  finally:
    Path(path).unlink(missing_ok=True)


def test_alembic_upgrade_noop_when_tables_from_create_all():
  """Önce metadata.create_all ile tablolar varken upgrade hata vermeden başarıyla 'head' yazmalı."""
  backend_root = Path(__file__).resolve().parents[1]

  fd, path = tempfile.mkstemp(prefix='temiz_al_legacy_', suffix='.sqlite')
  os.close(fd)
  posix_path = Path(path).as_posix()
  sqlite_sync = 'sqlite:///' + posix_path

  try:
    engine = create_engine(sqlite_sync, connect_args={'check_same_thread': False})
    Base.metadata.create_all(bind=engine)
    engine.dispose()

    env = os.environ.copy()
    env['DATABASE_URL'] = 'sqlite+aiosqlite:///' + posix_path
    env['RUN_MIGRATIONS_ON_STARTUP'] = 'false'
    env.setdefault('PYTHONPATH', str(backend_root))

    subprocess.run(
      [sys.executable, '-m', 'alembic', 'upgrade', 'head'],
      cwd=str(backend_root),
      env=env,
      check=True,
      capture_output=True,
      text=True,
    )
    result = subprocess.run(
      [sys.executable, '-m', 'alembic', 'current'],
      cwd=str(backend_root),
      env=env,
      capture_output=True,
      text=True,
      check=False,
    )
    assert result.returncode == 0
    out = result.stdout or ''
    assert 'head' in out
    assert '3c9f1e2a8b45' in out
  finally:
    Path(path).unlink(missing_ok=True)
