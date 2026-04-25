from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
  pass


class User(Base):
  __tablename__ = 'users'

  id: Mapped[int] = mapped_column(Integer, primary_key=True)
  email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
  hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
  alerjenler: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
  diyet_tipi: Mapped[str | None] = mapped_column(String(64), nullable=True)
  istenmeyen_maddeler: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class Product(Base):
  __tablename__ = 'products'

  barkod: Mapped[str] = mapped_column(String(64), primary_key=True)
  ad: Mapped[str] = mapped_column(String(255), nullable=False)
  kategori: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
  fiyat_segmenti: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
  icerik: Mapped[str] = mapped_column(Text, nullable=False)


class MissingProduct(Base):
  __tablename__ = 'missing_products'

  id: Mapped[int] = mapped_column(Integer, primary_key=True)
  barkod_no: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
  image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
  status: Mapped[str] = mapped_column(String(32), default='queued', nullable=False)
  created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    server_default=func.now(),
    nullable=False,
  )
