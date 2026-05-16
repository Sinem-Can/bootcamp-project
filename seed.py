"""
Örnek kullanıcı ve ürün verisi ekler (hızlı QA / Swagger testi).

Çalıştırma (repo kökünden):
  python seed.py

Önkoşul: `backend/.env` içinde `DATABASE_URL` (varsayılan SQLite). Script `backend` klasörüne geçer.
Ortam değişkeni `DATABASE_URL` tanımlıysa `.env` yerine o kullanılır; yanlış bir yola işaret ediyorsa shell'den kaldırın.
Tüm seed kullanıcıların şifresi (geliştirme): SeedPass123!
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent / 'backend'

if not BACKEND_ROOT.is_dir():
  raise SystemExit(f'beklenen backend klasörü yok: {BACKEND_ROOT}')

sys.path.insert(0, str(BACKEND_ROOT))
os.chdir(BACKEND_ROOT)

from sqlalchemy import create_engine, inspect, select
from sqlalchemy.orm import Session, sessionmaker

import app.db.models  # noqa: F401 — tüm tablolar metadata'ya
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.models import Product, User


def _sync_engine_url() -> str:
  u = settings.database_url
  if u.startswith('sqlite+aiosqlite://'):
    return 'sqlite://' + u.removeprefix('sqlite+aiosqlite://')
  if u.startswith('postgresql+asyncpg://'):
    return 'postgresql+psycopg2://' + u.removeprefix('postgresql+asyncpg://')
  return u


def _ensure_schema(engine) -> None:
  insp = inspect(engine)
  if not insp.has_table('users'):
    Base.metadata.create_all(bind=engine)


def _seed_users(session: Session) -> int:
  common_pw = hash_password(password='SeedPass123!')
  rows = [
    User(
      email='seed.vegan@example.com',
      full_name='Seed Vegan',
      hashed_password=common_pw,
      alerjenler={'allergens': []},
      diyet_tipi='vegan',
      istenmeyen_maddeler={'undesired': ['bal', 'jelatin']},
    ),
    User(
      email='seed.laktoz@example.com',
      full_name='Seed Laktoz Duyarlı',
      hashed_password=common_pw,
      alerjenler={'allergens': ['laktoz', 'süt']},
      diyet_tipi=None,
      istenmeyen_maddeler={'undesired': []},
    ),
    User(
      email='seed.gluten@example.com',
      full_name='Seed Glutensiz',
      hashed_password=common_pw,
      alerjenler={'allergens': ['gluten', 'buğday']},
      diyet_tipi='glutensiz',
      istenmeyen_maddeler={'undesired': []},
    ),
    User(
      email='seed.karma@example.com',
      full_name='Seed Karma Profil',
      hashed_password=common_pw,
      alerjenler={'allergens': ['fındık']},
      diyet_tipi='vejetaryen',
      istenmeyen_maddeler={'undesired': ['palm yağı', 'yüksek fruktozlu mısır şurubu']},
    ),
  ]

  added = 0
  for u in rows:
    exists = session.scalar(select(User.id).where(User.email == u.email))
    if exists is not None:
      continue
    session.add(u)
    added += 1
  return added


def _seed_products(session: Session) -> int:
  rows = [
    Product(
      barkod='8690000111101',
      ad='Taslak Süre Aşımı Bisküvi',
      kategori='atıştırmalık',
      fiyat_segmenti=2,
      icerik='Buğday unu, şeker, süt tozu, margarin, kabartma tozu.',
    ),
    Product(
      barkod='8690000111102',
      ad='Taslak Yulaf Lapası',
      kategori='kahvaltılık',
      fiyat_segmenti=1,
      icerik='Yulaf ezmesi, tuz. Laktoz ve süt içermez.',
    ),
    Product(
      barkod='8690000111103',
      ad='Taslak Patates Cipsi',
      kategori='atıştırmalık',
      fiyat_segmenti=3,
      icerik='Patates, palm yağı, tuz, aromalar.',
    ),
    Product(
      barkod='8690000111104',
      ad='Taslak Glutensiz Kraker',
      kategori='atıştırmalık',
      fiyat_segmenti=2,
      icerik='Mısır nişastası, ayçiçek yağı, tuz.',
    ),
  ]

  added = 0
  for p in rows:
    exists = session.scalar(select(Product.barkod).where(Product.barkod == p.barkod))
    if exists is not None:
      continue
    session.add(p)
    added += 1
  return added


def main() -> None:
  url = _sync_engine_url()
  connect_args = {'check_same_thread': False} if url.startswith('sqlite') else {}
  engine = create_engine(url, pool_pre_ping=True, connect_args=connect_args)
  _ensure_schema(engine)

  SessionLocal = sessionmaker(bind=engine, class_=Session, expire_on_commit=False, autoflush=False, autocommit=False)

  with SessionLocal() as session:
    try:
      users_n = _seed_users(session)
      prod_n = _seed_products(session)
      session.commit()
    except Exception:
      session.rollback()
      raise

  print(f'Oturum tamam: {url.split("@")[-1] if "@" in url else url}')
  print(f'  Eklenen kullanıcı: {users_n}, eklenen ürün: {prod_n}')
  print("  Giriş: POST /auth/login (form) — username=e-posta, password='SeedPass123!'")


if __name__ == '__main__':
  main()
