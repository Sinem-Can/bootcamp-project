"""Test ortamında geçici SQLite; pytest_sessionfinish sırasında engine kapatılır."""
from __future__ import annotations

import asyncio
import os
from pathlib import Path
import tempfile

_tmp = tempfile.NamedTemporaryFile(prefix="temiz_pytest_", suffix=".sqlite", delete=False)
_tmp.close()

os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{Path(_tmp.name).as_posix()}"
os.environ['ENVIRONMENT'] = 'development'
os.environ.pop('ADMIN_API_KEY', None)


def pytest_sessionfinish(session, exitstatus):  # noqa: ARG001
  try:
    from app.db.session import engine as _engine

    loop = asyncio.new_event_loop()
    try:
      loop.run_until_complete(_engine.dispose())
    finally:
      loop.close()
  except Exception:
    pass
  try:
    Path(_tmp.name).unlink(missing_ok=True)
  except OSError:
    pass


import pytest  # noqa: E402 — env önce


@pytest.fixture
def client():
  from starlette.testclient import TestClient

  import app.db.models as _models  # noqa: F401 — metadata
  from app.db.base import Base
  from app.db.session import engine
  from app.main import app

  async def _reset():
    await engine.dispose()
    async with engine.begin() as conn:
      await conn.run_sync(Base.metadata.drop_all)
    async with engine.begin() as conn:
      await conn.run_sync(Base.metadata.create_all)

  asyncio.run(_reset())

  with TestClient(app) as c:
    yield c
