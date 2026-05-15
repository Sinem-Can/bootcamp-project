from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
  email: EmailStr
  full_name: str = Field(min_length=1, max_length=200)


class UserProfileUpdateRequest(BaseModel):
  allergens: list[str] = Field(default_factory=list)
  diet: str | None = Field(default=None, max_length=64)
  undesired: list[str] = Field(default_factory=list)


class UserProfileResponse(BaseModel):
  allergens: list[str]
  diet: str | None
  undesired: list[str]


class UserResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  email: EmailStr
  full_name: str
  created_at: datetime
