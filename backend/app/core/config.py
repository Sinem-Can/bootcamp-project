from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  model_config = SettingsConfigDict(env_file='.env', extra='ignore')

  database_url: str = 'sqlite+aiosqlite:///./temizsepet.db'
  # PostgreSQL prod: göçleri ayrı adımda (CI/render hook) çalıştırın; çok worker'da başlangıçta migrate yapmayın.
  run_migrations_on_startup: bool = False
  jwt_secret: str = 'dev-secret-change-in-production'
  jwt_alg: str = 'HS256'
  jwt_access_token_expires_min: int = 60 * 24 * 7

  r2_endpoint_url: str | None = None
  r2_access_key_id: str | None = None
  r2_secret_access_key: str | None = None
  r2_bucket: str | None = None
  r2_public_base_url: str | None = None

  @property
  def database_sync_migration_url(self) -> str:
    """Alembic senkron sürücü URL'si."""
    url = self.database_url
    if url.startswith('sqlite+aiosqlite://'):
      return 'sqlite://' + url.removeprefix('sqlite+aiosqlite://')
    if url.startswith('postgresql+asyncpg://'):
      return 'postgresql+psycopg2://' + url.removeprefix('postgresql+asyncpg://')
    return url


settings = Settings()
