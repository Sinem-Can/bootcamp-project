"""Alembic programatik çalıştırma (lifespan başlatma)."""

from pathlib import Path

from alembic import command
from alembic.config import Config

from app.core.config import settings


def upgrade_to_head_sync() -> None:
  ini = Path(__file__).resolve().parent.parent.parent / 'alembic.ini'
  cfg = Config(str(ini))
  escaped = settings.database_sync_migration_url.replace('%', '%%')
  cfg.set_main_option('sqlalchemy.url', escaped)
  command.upgrade(cfg, 'head')
