"""API entegrasyon testleri (geçici SQLite; conftest DATABASE_URL ve her testte sıfır şema)."""

import asyncio

import pytest

from app.db.models import Product


@pytest.fixture
def auth_headers(client):
  import uuid

  email = f'u{uuid.uuid4().hex}@example.com'
  body = {'email': email, 'password': 'StrongPass1!', 'full_name': 'Test User'}
  r = client.post('/auth/register', json=body)
  assert r.status_code == 201, r.text
  token = r.json()['access_token']
  return {'Authorization': f'Bearer {token}'}


def test_health_ok(client):
  r = client.get('/health')
  assert r.status_code == 200
  assert r.json()['ok'] is True


def test_register_then_login_conflict(client):
  body = {'email': 'dupuser@example.com', 'password': 'StrongPass1!', 'full_name': 'A'}
  r1 = client.post('/auth/register', json=body)
  assert r1.status_code == 201
  r_conflict = client.post('/auth/register', json=body)
  assert r_conflict.status_code == 409
  login = client.post(
    '/auth/login',
    data={'username': body['email'], 'password': body['password']},
  )
  assert login.status_code == 200
  assert 'access_token' in login.json()


def test_user_profile_update(client, auth_headers):
  r = client.put(
    '/user/profile',
    headers=auth_headers,
    json={
      'allergens': ['laktoz'],
      'diet': 'vegan',
      'undesired': ['palm yağı'],
    },
  )
  assert r.status_code == 200, r.text
  data = r.json()
  assert data['allergens'] == ['laktoz']
  assert data['diet'] == 'vegan'
  assert data['undesired'] == ['palm yağı']


def test_product_detail_requires_auth(client):
  r = client.get('/product/8690000111111')
  assert r.status_code == 401


def test_product_score_green(client, auth_headers):
  from app.db.session import async_session

  barkod = '8690000422201'

  async def seed():
    async with async_session() as s:
      s.add(
        Product(
          barkod=barkod,
          ad='Test ürünü',
          kategori='bakliyat',
          fiyat_segmenti=2,
          icerik='yulaf ezmesi, tuz',
        )
      )
      await s.commit()

  asyncio.run(seed())

  r = client.get(f'/product/{barkod}', headers=auth_headers)
  assert r.status_code == 200, r.text
  body = r.json()
  assert body['status'] == 'GREEN'


def test_progress_logs_after_product_scan(client, auth_headers):
  from app.db.session import async_session

  barkod = '8690000999001'

  async def seed():
    async with async_session() as s:
      s.add(
        Product(
          barkod=barkod,
          ad='Su Test',
          kategori='içecek',
          fiyat_segmenti=1,
          icerik='su',
        )
      )
      await s.commit()

  asyncio.run(seed())

  assert client.get(f'/product/{barkod}', headers=auth_headers).status_code == 200
  summary = client.get('/progress/summary', headers=auth_headers)
  assert summary.status_code == 200
  assert summary.json()['engagement']['product_analyses_recorded'] >= 1
  analyses = client.get('/progress/analyses', headers=auth_headers)
  assert analyses.status_code == 200
  assert analyses.json()[0]['barkod'] == barkod
  events = client.get('/progress/events', headers=auth_headers)
  assert events.status_code == 200
  types = {e['event_type'] for e in events.json()}
  assert 'product.scanned' in types


def test_users_requires_jwt_when_anonymous(client):
  r = client.get('/users')
  assert r.status_code == 401


def test_users_list_ok_with_valid_token(client, auth_headers):
  r = client.get('/users', headers=auth_headers)
  assert r.status_code == 200
  assert isinstance(r.json(), list)


def test_missing_product_without_r2(client, monkeypatch):
  from app.core import config

  monkeypatch.setattr(config.settings, 'r2_bucket', None, raising=False)
  files = {'photo': ('x.png', b'fake-bytes', 'image/png')}
  data = {'barcode_no': '1234567890123'}
  r = client.post('/product/missing', data=data, files=files)
  assert r.status_code == 500
  assert 'R2' in r.json().get('detail', '')
