"""Yapılandırılmış uygulama olaylarını kalıcıya yazar (audit / izleme)."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ApplicationEventLog
from app.db.session import async_session

logger = logging.getLogger(__name__)


async def record_application_event(
  *,
  user_id: int | None,
  event_type: str,
  payload: dict[str, Any],
) -> None:
  row = ApplicationEventLog(user_id=user_id, event_type=event_type, payload=dict(payload))
  try:
    async with async_session() as session:
      session.add(row)
      await session.commit()
  except Exception:
    logger.exception('record_application_event failed type=%s user_id=%s', event_type, user_id)


async def count_events_for_user(session: AsyncSession, *, user_id: int) -> int:
  q = await session.scalar(
    select(func.count()).select_from(ApplicationEventLog).where(ApplicationEventLog.user_id == user_id)
  )
  return int(q or 0)


async def list_recent_events_for_user(
  session: AsyncSession, *, user_id: int, limit: int = 50, event_type: str | None = None
) -> list[ApplicationEventLog]:
  stmt = select(ApplicationEventLog).where(ApplicationEventLog.user_id == user_id)
  if event_type:
    stmt = stmt.where(ApplicationEventLog.event_type == event_type)
  stmt = stmt.order_by(ApplicationEventLog.created_at.desc()).limit(min(max(limit, 1), 200))
  result = await session.execute(stmt)
  return list(result.scalars().all())
