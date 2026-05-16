from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.session import get_db
from app.deps.auth import get_current_user
from app.schemas.progress import ApplicationEventLogOut, ProductAnalysisLogOut
from app.services.application_event_log_service import list_recent_events_for_user
from app.services.product_analysis_log_service import list_recent_analyses_for_user
from app.services.progress_service import ProgressSummaryResponse, build_progress_summary

router = APIRouter(prefix='/progress', tags=['progress'])


@router.get('/summary', response_model=ProgressSummaryResponse)
async def get_progress_summary(
  db: AsyncSession = Depends(get_db),
  current_user: User = Depends(get_current_user),
) -> ProgressSummaryResponse:
  return await build_progress_summary(db, user=current_user)


@router.get('/analyses', response_model=list[ProductAnalysisLogOut])
async def list_my_product_analyses(
  db: AsyncSession = Depends(get_db),
  current_user: User = Depends(get_current_user),
  limit: int = Query(20, ge=1, le=100),
) -> list[ProductAnalysisLogOut]:
  rows = await list_recent_analyses_for_user(db, user_id=current_user.id, limit=limit)
  return [ProductAnalysisLogOut.model_validate(r) for r in rows]


@router.get('/events', response_model=list[ApplicationEventLogOut])
async def list_my_application_events(
  db: AsyncSession = Depends(get_db),
  current_user: User = Depends(get_current_user),
  limit: int = Query(50, ge=1, le=200),
  event_type: str | None = Query(None, max_length=64),
) -> list[ApplicationEventLogOut]:
  rows = await list_recent_events_for_user(
    db, user_id=current_user.id, limit=limit, event_type=event_type
  )
  return [ApplicationEventLogOut.model_validate(r) for r in rows]
