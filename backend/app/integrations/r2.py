from __future__ import annotations

import boto3

from app.core.config import settings


def get_r2_client():
  if not settings.r2_endpoint_url:
    raise ValueError('R2 is not configured')

  return boto3.client(
    's3',
    endpoint_url=settings.r2_endpoint_url,
    aws_access_key_id=settings.r2_access_key_id,
    aws_secret_access_key=settings.r2_secret_access_key,
  )


def build_public_url(*, object_key: str) -> str:
  if not settings.r2_public_base_url:
    raise ValueError('R2_PUBLIC_BASE_URL is not configured')
  base = settings.r2_public_base_url.rstrip('/')
  return f'{base}/{object_key}'


def r2_upload_configuration_blockers() -> list[str]:
  """Eksik ortam değişkenlerinin adları; boş liste ise yükleme akışı yapılandırılmış demektir."""
  missing: list[str] = []
  if not (settings.r2_endpoint_url or '').strip():
    missing.append('R2_ENDPOINT_URL')
  if not (settings.r2_access_key_id or '').strip():
    missing.append('R2_ACCESS_KEY_ID')
  if not (settings.r2_secret_access_key or '').strip():
    missing.append('R2_SECRET_ACCESS_KEY')
  if not (settings.r2_bucket or '').strip():
    missing.append('R2_BUCKET')
  if not (settings.r2_public_base_url or '').strip():
    missing.append('R2_PUBLIC_BASE_URL')
  return missing

