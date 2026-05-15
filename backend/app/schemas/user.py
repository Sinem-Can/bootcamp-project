from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
  email: EmailStr
  full_name: str = Field(min_length=1, max_length=200)


class UserResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  email: EmailStr
  full_name: str
  created_at: datetime
