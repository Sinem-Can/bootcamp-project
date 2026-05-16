"""Ürün skoru analiz kayıtlarını kalıcıya yazar; scoring ve HTTP katmanından ayrı tutulur."""

from __future__ import annotations

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ProductAnalysisLog
from app.db.session import async_session

logger = logging.getLogger(__name__)


async def persist_product_analysis_log(
  *,
  user_id: int,
  barkod: str,
  product_ad: str | None,
  status: str,
  matched_allergens: list[str],
  matched_undesired: list[str],
) -> None:
  entry = ProductAnalysisLog(
    user_id=user_id,
    barkod=barkod,
    product_ad=product_ad,
    status=status,
    matched_allergens=list(matched_allergens),
    matched_undesired=list(matched_undesired),
  )
  try:
    async with async_session() as session:
      session.add(entry)
      await session.commit()
  except Exception:
    logger.exception('persist_product_analysis_log failed user_id=%s barkod=%s', user_id, barkod)


async def count_analyses_for_user(session: AsyncSession, *, user_id: int) -> int:
  q = await session.scalar(select(func.count()).select_from(ProductAnalysisLog).where(ProductAnalysisLog.user_id == user_id))
  return int(q or 0)


async def list_recent_analyses_for_user(
  session: AsyncSession, *, user_id: int, limit: int = 20
) -> list[ProductAnalysisLog]:
  stmt = (
    select(ProductAnalysisLog)
    .where(ProductAnalysisLog.user_id == user_id)
    .order_by(ProductAnalysisLog.created_at.desc())
    .limit(min(max(limit, 1), 100))
  )
  result = await session.execute(stmt)
  return list(result.scalars().all())
