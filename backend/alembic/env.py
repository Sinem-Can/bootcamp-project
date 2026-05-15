"""Alembic ortamı: senkron sürücü ile göçler (SQLite / PostgreSQL)."""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine

from app.core.config import settings
from app.db.base import Base

# Modeller metadata'ya kayıtlı olmalı
import app.db.models  # noqa: F401

config = context.config
if config.config_file_name:
  fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
  """`alembic upgrade head --sql` gibi bağlantısız kullanımda çalışır."""
  migration_url = settings.database_sync_migration_url
  escaped = migration_url.replace('%', '%%')
  context.configure(
    url=escaped,
    target_metadata=target_metadata,
    literal_binds=True,
    dialect_opts={'paramstyle': 'named'},
    compare_type=True,
  )

  with context.begin_transaction():
    context.run_migrations()


def run_migrations_online():
  migration_url = settings.database_sync_migration_url
  escaped = migration_url.replace('%', '%%')
  connectable = create_engine(
    escaped,
    pool_pre_ping=True,
    connect_args={'check_same_thread': False} if migration_url.startswith('sqlite') else {},
  )

  with connectable.connect() as connection:
    context.configure(
      connection=connection,
      target_metadata=target_metadata,
      compare_type=True,
    )

    with context.begin_transaction():
      context.run_migrations()


if context.is_offline_mode():
  run_migrations_offline()
else:
  run_migrations_online()
