"""İlerleme / özet: saf iş kuralları + okuma için DB yardımcıları (router içinde hesaplanmaz)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.services.application_event_log_service import count_events_for_user
from app.services.product_analysis_log_service import count_analyses_for_user


class ProfileMatrixSummary(BaseModel):
  allergen_count: int = Field(ge=0)
  undesired_count: int = Field(ge=0)
  diet: str | None = None
  diet_configured: bool = False


class EngagementSummary(BaseModel):
  product_analyses_recorded: int = Field(ge=0)
  application_events_recorded: int = Field(ge=0)


class ProgressSummaryResponse(BaseModel):
  profile: ProfileMatrixSummary
  engagement: EngagementSummary


def build_profile_matrix_summary(user: User) -> ProfileMatrixSummary:
  allergens = (user.alerjenler or {}).get('allergens') or []
  undesired = (user.istenmeyen_maddeler or {}).get('undesired') or []
  diet = user.diyet_tipi
  return ProfileMatrixSummary(
    allergen_count=len(allergens),
    undesired_count=len(undesired),
    diet=diet,
    diet_configured=bool(diet and str(diet).strip()),
  )


async def build_progress_summary(session: AsyncSession, *, user: User) -> ProgressSummaryResponse:
  uid = user.id
  analyses = await count_analyses_for_user(session, user_id=uid)
  events = await count_events_for_user(session, user_id=uid)
  return ProgressSummaryResponse(
    profile=build_profile_matrix_summary(user),
    engagement=EngagementSummary(
      product_analyses_recorded=analyses,
      application_events_recorded=events,
    ),
  )


def safe_event_payload(payload: dict[str, Any]) -> dict[str, Any]:
  out = dict(payload)
  text = out.pop('icerik', None)
  if isinstance(text, str) and len(text) > 400:
    out['icerik_preview'] = text[:400] + '…'
  elif text is not None:
    out['icerik_preview'] = str(text)[:400]
  return out
