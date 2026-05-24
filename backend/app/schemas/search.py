from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SearchCreate(BaseModel):
    nicho: str
    cidade: str
    bairro: str = ""
    raio_km: int = 5
    max_results: int = 20


class SearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nicho: str
    cidade: str
    bairro: str = ""
    raio_km: int
    max_results: int
    status: str
    total_found: int
    created_at: datetime
