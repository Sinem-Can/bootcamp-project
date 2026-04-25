# TemizSepet Backend (FastAPI)

## Kurulum

```bash
cd backend
python -m uv sync
copy .env.example .env
```

## PostgreSQL (lokal)

Backend açılışta DB'ye bağlanır; Postgres çalışmıyorsa şu hatayı alırsın: `Connect call failed ('127.0.0.1', 5432)`.

### Seçenek A: Docker ile (önerilen)

```bash
cd backend
docker compose up -d
```

`.env` içinde `DATABASE_URL` şu formatta olmalı:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/temizsepet
```

## Çalıştırma

```bash
python -m uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoint'ler (MVP)
- `POST /auth/register`
- `POST /auth/login`
- `PUT /user/profile`
- `GET /product/{barcode}`
- `GET /product/alternatives/{barcode}`
- `POST /product/missing` (Cloudflare R2, background upload)
