"""product_analysis_logs + application_event_logs

Revision ID: 3c9f1e2a8b45
Revises: e51c8113685a
Create Date: 2026-05-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '3c9f1e2a8b45'
down_revision: Union[str, Sequence[str], None] = 'e51c8113685a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
  conn = op.get_bind()
  insp = sa.inspect(conn)

  if not insp.has_table('product_analysis_logs'):
    op.create_table(
      'product_analysis_logs',
      sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
      sa.Column('user_id', sa.Integer(), nullable=False),
      sa.Column('barkod', sa.String(length=64), nullable=False),
      sa.Column('product_ad', sa.String(length=255), nullable=True),
      sa.Column('status', sa.String(length=16), nullable=False),
      sa.Column('matched_allergens', sa.JSON(), nullable=False),
      sa.Column('matched_undesired', sa.JSON(), nullable=False),
      sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
      sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
      sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_product_analysis_logs_barkod', 'product_analysis_logs', ['barkod'], unique=False)
    op.create_index('ix_product_analysis_logs_created_at', 'product_analysis_logs', ['created_at'], unique=False)
    op.create_index('ix_product_analysis_logs_status', 'product_analysis_logs', ['status'], unique=False)
    op.create_index('ix_product_analysis_logs_user_id', 'product_analysis_logs', ['user_id'], unique=False)

  if not insp.has_table('application_event_logs'):
    op.create_table(
      'application_event_logs',
      sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
      sa.Column('user_id', sa.Integer(), nullable=True),
      sa.Column('event_type', sa.String(length=64), nullable=False),
      sa.Column('payload', sa.JSON(), nullable=False),
      sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
      sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
      sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_application_event_logs_created_at', 'application_event_logs', ['created_at'], unique=False)
    op.create_index('ix_application_event_logs_event_type', 'application_event_logs', ['event_type'], unique=False)
    op.create_index('ix_application_event_logs_user_id', 'application_event_logs', ['user_id'], unique=False)


def downgrade() -> None:
  conn = op.get_bind()
  insp = sa.inspect(conn)
  if insp.has_table('application_event_logs'):
    op.drop_index('ix_application_event_logs_user_id', table_name='application_event_logs')
    op.drop_index('ix_application_event_logs_event_type', table_name='application_event_logs')
    op.drop_index('ix_application_event_logs_created_at', table_name='application_event_logs')
    op.drop_table('application_event_logs')

  if insp.has_table('product_analysis_logs'):
    op.drop_index('ix_product_analysis_logs_user_id', table_name='product_analysis_logs')
    op.drop_index('ix_product_analysis_logs_status', table_name='product_analysis_logs')
    op.drop_index('ix_product_analysis_logs_created_at', table_name='product_analysis_logs')
    op.drop_index('ix_product_analysis_logs_barkod', table_name='product_analysis_logs')
    op.drop_table('product_analysis_logs')
