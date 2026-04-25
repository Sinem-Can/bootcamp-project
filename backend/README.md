# TemizSepet Backend (FastAPI)

## Kurulum

```bash
cd backend
python -m uv sync
copy .env.example .env
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
