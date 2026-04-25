from app.core.ingredients_synonyms import SYNONYMS


def _normalize(text: str) -> str:
  return (text or '').lower().strip()


def _contains_any(*, haystack: str, needles: list[str]) -> list[str]:
  normalized = _normalize(haystack)
  matched: list[str] = []
  for needle in needles:
    n = _normalize(needle)
    if n and n in normalized:
      matched.append(needle)
  return matched


def score_product_for_user(*, product_icerik: str, allergens: list[str], undesired: list[str]) -> dict:
  icerik = _normalize(product_icerik)

  allergen_hits: list[str] = []
  for allergen in allergens:
    candidates = [allergen] + SYNONYMS.get(_normalize(allergen), [])
    allergen_hits.extend(_contains_any(haystack=icerik, needles=candidates))

  allergen_hits = sorted(set(allergen_hits))
  if allergen_hits:
    return {'status': 'RED', 'matched_allergens': allergen_hits, 'matched_undesired': []}

  undesired_hits = sorted(set(_contains_any(haystack=icerik, needles=undesired)))
  if undesired_hits:
    return {'status': 'YELLOW', 'matched_allergens': [], 'matched_undesired': undesired_hits}

  return {'status': 'GREEN', 'matched_allergens': [], 'matched_undesired': []}

