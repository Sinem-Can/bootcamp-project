from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProductAnalysisLogOut(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  barkod: str
  product_ad: str | None
  status: str
  matched_allergens: list
  matched_undesired: list
  created_at: datetime


class ApplicationEventLogOut(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: int
  event_type: str
  payload: dict
  created_at: datetime
