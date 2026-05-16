from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher

from app.core.ingredients_synonyms import SYNONYMS


def _normalize(text: str) -> str:
  """Türkçe metinler için basit birleştirme + NFKC + küçük harf."""
  if not text:
    return ''
  t = text.strip().replace('İ', 'i').replace('I', 'ı')
  t = unicodedata.normalize('NFKC', t).casefold()
  t = re.sub(r'\s+', ' ', t)
  return t.strip()


def _fuzzy_ratio(a: str, b: str) -> float:
  return SequenceMatcher(None, a, b).ratio()


def _fuzzy_token_match(
  *,
  normalized_haystack: str,
  needle: str,
  min_len: int = 4,
  ratio_cutoff: float = 0.88,
) -> bool:
  """Yazım hatası / OCR için kelime bazlı benzerlik (substring yetmezse)."""
  n = _normalize(needle)
  if len(n) < min_len:
    return False
  tokens = re.findall(r'\w+', normalized_haystack, flags=re.UNICODE)
  max_delta = max(2, len(n) // 3)
  for tok in tokens:
    if len(tok) < min_len:
      continue
    if abs(len(tok) - len(n)) > max_delta:
      continue
    if _fuzzy_ratio(n, tok) >= ratio_cutoff:
      return True
  return False


def _matches_needles(*, normalized_haystack: str, needles: list[str]) -> list[str]:
  matched: list[str] = []
  for needle in needles:
    n = _normalize(needle)
    if not n:
      continue
    if n in normalized_haystack:
      matched.append(needle)
      continue
    if _fuzzy_token_match(normalized_haystack=normalized_haystack, needle=needle):
      matched.append(needle)
  return matched


def score_product_for_user(*, product_icerik: str, allergens: list[str], undesired: list[str]) -> dict:
  icerik = _normalize(product_icerik)

  allergen_hits: list[str] = []
  for allergen in allergens:
    key = _normalize(allergen)
    candidates = [allergen] + SYNONYMS.get(key, [])
    allergen_hits.extend(_matches_needles(normalized_haystack=icerik, needles=candidates))

  allergen_hits = sorted(set(allergen_hits))
  if allergen_hits:
    return {'status': 'RED', 'matched_allergens': allergen_hits, 'matched_undesired': []}

  undesired_hits = sorted(set(_matches_needles(normalized_haystack=icerik, needles=undesired)))
  if undesired_hits:
    return {'status': 'YELLOW', 'matched_allergens': [], 'matched_undesired': undesired_hits}

  return {'status': 'GREEN', 'matched_allergens': [], 'matched_undesired': []}
