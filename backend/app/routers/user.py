from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.event_types import PROFILE_UPDATED
from app.db.session import get_db
from app.deps.auth import get_current_user
from app.schemas.user import UserProfileResponse, UserProfileUpdateRequest
from app.services.application_event_log_service import record_application_event

router = APIRouter(prefix='/user', tags=['user'])


@router.put('/profile', response_model=UserProfileResponse)
async def update_profile(
  payload: UserProfileUpdateRequest,
  db: AsyncSession = Depends(get_db),
  current_user=Depends(get_current_user),
) -> UserProfileResponse:
  current_user.alerjenler = {'allergens': payload.allergens}
  current_user.diyet_tipi = payload.diet
  current_user.istenmeyen_maddeler = {'undesired': payload.undesired}
  db.add(current_user)
  await db.commit()
  await db.refresh(current_user)

  await record_application_event(
    user_id=current_user.id,
    event_type=PROFILE_UPDATED,
    payload={
      'allergen_count': len(payload.allergens),
      'undesired_count': len(payload.undesired),
      'diet': payload.diet,
    },
  )

  return UserProfileResponse(
    allergens=current_user.alerjenler.get('allergens', []),
    diet=current_user.diyet_tipi,
    undesired=current_user.istenmeyen_maddeler.get('undesired', []),
  )
