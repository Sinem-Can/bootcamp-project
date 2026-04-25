from pydantic import BaseModel


class UserProfileUpdateRequest(BaseModel):
  allergens: list[str] = []
  diet: str | None = None
  undesired: list[str] = []


class UserProfileResponse(BaseModel):
  allergens: list[str]
  diet: str | None
  undesired: list[str]
