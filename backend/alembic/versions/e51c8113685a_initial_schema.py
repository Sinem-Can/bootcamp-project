"""initial_schema — users, products, missing_products

Revision ID: e51c8113685a
Revises:
Create Date: 2026-05-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e51c8113685a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
  conn = op.get_bind()
  insp = sa.inspect(conn)

  legacy_ready = insp.has_table('users') and insp.has_table('products') and insp.has_table('missing_products')
  if legacy_ready:
    # create_all ile oluşmuş dosya: DDL atlanır, göç yine de başarıyla "uygulanmış" işaretlenir.
    return

  op.create_table(
    'users',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('email', sa.String(length=320), nullable=False),
    sa.Column('full_name', sa.String(length=200), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('alerjenler', sa.JSON(), nullable=False),
    sa.Column('diyet_tipi', sa.String(length=64), nullable=True),
    sa.Column('istenmeyen_maddeler', sa.JSON(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
  )
  op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

  op.create_table(
    'products',
    sa.Column('barkod', sa.String(length=64), nullable=False),
    sa.Column('ad', sa.String(length=255), nullable=False),
    sa.Column('kategori', sa.String(length=128), nullable=False),
    sa.Column('fiyat_segmenti', sa.Integer(), nullable=False),
    sa.Column('icerik', sa.Text(), nullable=False),
    sa.PrimaryKeyConstraint('barkod'),
  )
  op.create_index(op.f('ix_products_kategori'), 'products', ['kategori'], unique=False)
  op.create_index(op.f('ix_products_fiyat_segmenti'), 'products', ['fiyat_segmenti'], unique=False)

  op.create_table(
    'missing_products',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('barkod_no', sa.String(length=64), nullable=False),
    sa.Column('image_url', sa.Text(), nullable=True),
    sa.Column('status', sa.String(length=32), server_default=sa.text("'queued'"), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
  )
  op.create_index(op.f('ix_missing_products_barkod_no'), 'missing_products', ['barkod_no'], unique=False)


def downgrade() -> None:
  op.drop_index(op.f('ix_missing_products_barkod_no'), table_name='missing_products')
  op.drop_table('missing_products')
  op.drop_index(op.f('ix_products_fiyat_segmenti'), table_name='products')
  op.drop_index(op.f('ix_products_kategori'), table_name='products')
  op.drop_table('products')
  op.drop_index(op.f('ix_users_email'), table_name='users')
  op.drop_table('users')
