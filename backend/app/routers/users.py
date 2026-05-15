from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService, get_user_service

router = APIRouter(prefix='/users', tags=['users'])


@router.get('', response_model=list[UserResponse])
async def list_users(
  service: UserService = Depends(get_user_service),
) -> list[UserResponse]:
  return [UserResponse.model_validate(user) for user in service.list_users()]


@router.post('', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
  payload: UserCreate,
  service: UserService = Depends(get_user_service),
) -> UserResponse:
  try:
    user = service.create_user(payload)
  except ValueError as exc:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
  return UserResponse.model_validate(user)


@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
  user_id: UUID,
  service: UserService = Depends(get_user_service),
) -> None:
  if not service.delete_user(user_id):
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
