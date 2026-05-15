from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
  email: EmailStr
  password: str = Field(min_length=8)
  full_name: str = Field(min_length=1, max_length=200)


class LoginRequest(BaseModel):
  email: EmailStr
  password: str = Field(min_length=8)


class AuthUserInfo(BaseModel):
  id: int
  email: EmailStr
  full_name: str


class AuthResponse(BaseModel):
  access_token: str
  token_type: str = 'bearer'
  user: AuthUserInfo
