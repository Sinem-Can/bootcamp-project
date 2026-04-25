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

