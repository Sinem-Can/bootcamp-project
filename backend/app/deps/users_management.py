from secrets import compare_digest

from fastapi import Header, HTTPException, status

from app.core.config import settings


async def require_users_management_access(
  x_admin_api_key: str | None = Header(default=None, alias='X-Admin-Api-Key'),
) -> None:
  """PRD dışı /users CRUD: production'da kapalı; isteğe bağlı admin anahtarı ile her ortamda kısıtlanabilir."""
  if settings.admin_api_key:
    if not x_admin_api_key:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin API key required')
    if len(x_admin_api_key) != len(settings.admin_api_key) or not compare_digest(
      x_admin_api_key, settings.admin_api_key
    ):
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Invalid admin API key')
    return

  if settings.environment == 'production':
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail='User management is disabled in production (set ADMIN_API_KEY to enable)',
    )
