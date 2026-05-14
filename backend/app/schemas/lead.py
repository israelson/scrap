from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LeadUpdate(BaseModel):
    crm_status: Optional[str] = None
    canal_contato: Optional[str] = None
    servico_oferecido: Optional[str] = None
    observacoes: Optional[str] = None
    data_contato: Optional[datetime] = None


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    search_id: UUID
    nome: str
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    nota: Optional[float] = None
    total_avaliacoes: int = 0
    categoria: Optional[str] = None
    descricao: Optional[str] = None
    site_url: Optional[str] = None
    tem_site: bool = False
    whatsapp_status: str = "not_tested"
    crm_status: str = "not_contacted"
    canal_contato: Optional[str] = None
    servico_oferecido: Optional[str] = None
    observacoes: Optional[str] = None
    data_contato: Optional[datetime] = None
    created_at: datetime
