from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db.base import Base


class User(Base):
  __tablename__ = 'users'

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
  full_name: Mapped[str] = mapped_column(String(200), nullable=False, default='')
  hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
  created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    server_default=func.now(),
    nullable=False,
  )
  alerjenler: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
  diyet_tipi: Mapped[str | None] = mapped_column(String(64), nullable=True)
  istenmeyen_maddeler: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class Product(Base):
  __tablename__ = 'products'

  barkod: Mapped[str] = mapped_column(String(64), primary_key=True)
  ad: Mapped[str] = mapped_column(String(255), nullable=False)
  kategori: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
  fiyat_segmenti: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
  icerik: Mapped[str] = mapped_column(Text, nullable=False)


class MissingProduct(Base):
  __tablename__ = 'missing_products'

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  barkod_no: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
  image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
  status: Mapped[str] = mapped_column(String(32), default='queued', nullable=False)
  created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    server_default=func.now(),
    nullable=False,
  )


class ProductAnalysisLog(Base):
  """Ürün skorlama (analiz) sonuçlarının kalıcı kaydı — router'dan ayrı servis yazar."""

  __tablename__ = 'product_analysis_logs'

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False)
  barkod: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
  product_ad: Mapped[str | None] = mapped_column(String(255), nullable=True)
  status: Mapped[str] = mapped_column(String(16), index=True, nullable=False)
  matched_allergens: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
  matched_undesired: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
  created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    server_default=func.now(),
    nullable=False,
  )


class ApplicationEventLog(Base):
  """Genel olay / denetim logu (profil güncelleme, tarama vb.)."""

  __tablename__ = 'application_event_logs'

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'), index=True, nullable=True)
  event_type: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
  payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
  created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    server_default=func.now(),
    nullable=False,
  )
