from __future__ import annotations

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import MissingProduct
from app.db.session import async_session, get_db
from app.integrations.r2 import build_public_url, get_r2_client

router = APIRouter(prefix='/product', tags=['missing-product'])


async def _upload_and_persist(
  *,
  missing_id: int,
  object_key: str,
  content_type: str | None,
  file_bytes: bytes,
):
  client = get_r2_client()
  client.put_object(
    Bucket=settings.r2_bucket,
    Key=object_key,
    Body=file_bytes,
    ContentType=content_type or 'application/octet-stream',
  )

  image_url = build_public_url(object_key=object_key)
  async with async_session() as db:
    missing = await db.get(MissingProduct, missing_id)
    if missing:
      missing.image_url = image_url
      missing.status = 'uploaded'
      db.add(missing)
      await db.commit()


@router.post('/missing', status_code=status.HTTP_202_ACCEPTED)
async def report_missing_product(
  background_tasks: BackgroundTasks,
  barcode_no: str = Form(...),
  photo: UploadFile = File(...),
  db: AsyncSession = Depends(get_db),
):
  if not settings.r2_bucket:
    raise HTTPException(status_code=500, detail='R2 is not configured')

  missing = MissingProduct(barkod_no=barcode_no, status='queued')
  db.add(missing)
  await db.commit()
  await db.refresh(missing)

  file_bytes = await photo.read()
  object_key = f'missing-products/{barcode_no}/{uuid.uuid4().hex}'

  background_tasks.add_task(
    _upload_and_persist,
    missing_id=missing.id,
    object_key=object_key,
    content_type=photo.content_type,
    file_bytes=file_bytes,
  )

  return {'id': missing.id, 'status': 'queued'}

