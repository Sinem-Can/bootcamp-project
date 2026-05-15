from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  model_config = SettingsConfigDict(env_file='.env', extra='ignore')

  environment: Literal['development', 'production'] = 'development'
  admin_api_key: str | None = None

  database_url: str = 'sqlite+aiosqlite:///./temizsepet.db'
  jwt_secret: str = 'dev-secret-change-in-production'
  jwt_alg: str = 'HS256'
  jwt_access_token_expires_min: int = 60 * 24 * 7

  r2_endpoint_url: str | None = None
  r2_access_key_id: str | None = None
  r2_secret_access_key: str | None = None
  r2_bucket: str | None = None
  r2_public_base_url: str | None = None


settings = Settings()
