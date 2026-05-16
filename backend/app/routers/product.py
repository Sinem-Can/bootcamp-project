from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Product
from app.db.session import get_db
from app.deps.auth import get_current_user
from app.core.event_types import PRODUCT_ALTERNATIVES_VIEWED, PRODUCT_SCANNED
from app.schemas.product import AlternativeProductResponse, ProductScoreResponse
from app.services.application_event_log_service import record_application_event
from app.services.product_analysis_log_service import persist_product_analysis_log
from app.services.progress_service import safe_event_payload
from app.services.scoring import score_product_for_user

router = APIRouter(prefix='/product', tags=['product'])


async def _record_scan_and_log(user_id: int, product: Product, scored: dict) -> None:
  await persist_product_analysis_log(
    user_id=user_id,
    barkod=product.barkod,
    product_ad=product.ad,
    status=scored['status'],
    matched_allergens=list(scored.get('matched_allergens') or []),
    matched_undesired=list(scored.get('matched_undesired') or []),
  )
  await record_application_event(
    user_id=user_id,
    event_type=PRODUCT_SCANNED,
    payload=safe_event_payload(
      {
        'barkod': product.barkod,
        'ad': product.ad,
        'status': scored['status'],
        'icerik': product.icerik,
      }
    ),
  )


@router.get('/{barcode}', response_model=ProductScoreResponse)
async def get_product_score(
  barcode: str,
  db: AsyncSession = Depends(get_db),
  current_user=Depends(get_current_user),
) -> ProductScoreResponse:
  result = await db.execute(select(Product).where(Product.barkod == barcode))
  product = result.scalar_one_or_none()
  if not product:
    raise HTTPException(status_code=404, detail='Product not found')

  allergens = (current_user.alerjenler or {}).get('allergens', [])
  undesired = (current_user.istenmeyen_maddeler or {}).get('undesired', [])
  scored = score_product_for_user(product_icerik=product.icerik, allergens=allergens, undesired=undesired)
  await _record_scan_and_log(current_user.id, product, scored)
  return ProductScoreResponse(**scored)


@router.get('/alternatives/{barcode}', response_model=list[AlternativeProductResponse])
async def get_alternatives(
  barcode: str,
  db: AsyncSession = Depends(get_db),
  current_user=Depends(get_current_user),
) -> list[AlternativeProductResponse]:
  scanned_result = await db.execute(select(Product).where(Product.barkod == barcode))
  scanned = scanned_result.scalar_one_or_none()
  if not scanned:
    raise HTTPException(status_code=404, detail='Product not found')

  result = await db.execute(
    select(Product).where(
      Product.kategori == scanned.kategori,
      Product.fiyat_segmenti <= scanned.fiyat_segmenti,
      Product.barkod != scanned.barkod,
    )
  )
  candidates = result.scalars().all()

  allergens = (current_user.alerjenler or {}).get('allergens', [])
  undesired = (current_user.istenmeyen_maddeler or {}).get('undesired', [])

  green: list[AlternativeProductResponse] = []
  for product in candidates:
    scored = score_product_for_user(product_icerik=product.icerik, allergens=allergens, undesired=undesired)
    if scored['status'] == 'GREEN':
      green.append(
        AlternativeProductResponse(
          barkod=product.barkod,
          ad=product.ad,
          kategori=product.kategori,
          fiyat_segmenti=product.fiyat_segmenti,
        )
      )

  if not green:
    raise HTTPException(status_code=404, detail='No alternatives found')

  await record_application_event(
    user_id=current_user.id,
    event_type=PRODUCT_ALTERNATIVES_VIEWED,
    payload={
      'source_barcode': barcode,
      'alternatives_count': len(green),
      'scanned_kategori': scanned.kategori,
    },
  )

  return green

