"""Örnek ürün kayıtları — mobil / QA için sabit barkodlar.

Çalıştırma (backend klasöründen):

  uv run python -m scripts.seed_products

Mevcut barkodlar güncellenir; yoksa eklenir (idempotent upsert).
"""

from __future__ import annotations

import asyncio
import logging

from sqlalchemy import select

from app.db.models import Product
from app.db.session import async_session

logger = logging.getLogger(__name__)

# Demo barkodlar — GET /product/{barcode} ile doğrulanabilir.
SAMPLE_PRODUCTS: list[dict[str, str | int]] = [
  {
    'barkod': '8680701400123',
    'ad': 'Örnek Tam Buğday Kraker',
    'kategori': 'atıştırmalık',
    'fiyat_segmenti': 2,
    'icerik': 'Tam buğday unu, ayçiçek yağı, tuz. İçerir: gluten.',
  },
  {
    'barkod': '8680701400456',
    'ad': 'Örnek Süt İçecek',
    'kategori': 'içecek',
    'fiyat_segmenti': 3,
    'icerik': 'Süt (%3,5 yağ), şeker, kakao tozu, stabilizör (karagenan).',
  },
  {
    'barkod': '8680701400789',
    'ad': 'Örnek Meyve Barı',
    'kategori': 'atıştırmalık',
    'fiyat_segmenti': 1,
    'icerik': 'Kuru üzüm, yulaf, bal, ayçiçek çekirdeği.',
  },
  {
    'barkod': '8680701400999',
    'ad': 'Örnek Fıstıklı Bar',
    'kategori': 'atıştırmalık',
    'fiyat_segmenti': 3,
    'icerik': 'Yer fıstığı, glukoz şurubu, pirinç patlağı, tuz.',
  },
]


async def seed_products() -> int:
  """Upsert SAMPLE_PRODUCTS; dönen değer işlenen satır sayısı."""
  async with async_session() as session:
    count = 0
    for row in SAMPLE_PRODUCTS:
      barkod = str(row['barkod'])
      result = await session.execute(select(Product).where(Product.barkod == barkod))
      existing = result.scalar_one_or_none()
      if existing:
        existing.ad = str(row['ad'])
        existing.kategori = str(row['kategori'])
        existing.fiyat_segmenti = int(row['fiyat_segmenti'])
        existing.icerik = str(row['icerik'])
      else:
        session.add(
          Product(
            barkod=barkod,
            ad=str(row['ad']),
            kategori=str(row['kategori']),
            fiyat_segmenti=int(row['fiyat_segmenti']),
            icerik=str(row['icerik']),
          )
        )
      count += 1
    await session.commit()
  return count


def main() -> None:
  logging.basicConfig(level=logging.INFO)
  n = asyncio.run(seed_products())
  logger.info('Seed tamam: %d ürün upsert edildi.', n)
  for p in SAMPLE_PRODUCTS:
    logger.info('  barkod=%s — %s', p['barkod'], p['ad'])


if __name__ == '__main__':
  main()
