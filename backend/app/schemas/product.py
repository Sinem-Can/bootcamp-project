from pydantic import BaseModel


class ProductScoreResponse(BaseModel):
  status: str
  matched_allergens: list[str]
  matched_undesired: list[str]


class AlternativeProductResponse(BaseModel):
  barkod: str
  ad: str
  kategori: str
  fiyat_segmenti: int

