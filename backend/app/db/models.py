import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class Search(Base):
    __tablename__ = "searches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nicho = Column(String, nullable=False)
    cidade = Column(String, nullable=False)
    bairro = Column(String, default="")
    raio_km = Column(Integer, default=5)
    max_results = Column(Integer, default=20)
    status = Column(String, default="pending")  # pending/running/completed/failed
    total_found = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    search_id = Column(UUID(as_uuid=True), ForeignKey("searches.id"), nullable=False)
    place_id = Column(String)

    nome = Column(String, nullable=False)
    endereco = Column(Text)
    telefone = Column(String)
    whatsapp = Column(String)
    nota = Column(Float)
    total_avaliacoes = Column(Integer, default=0)
    responde_avaliacoes = Column(Boolean, default=False)
    horario = Column(JSON)
    categoria = Column(String)
    descricao = Column(Text)
    site_url = Column(String)
    tem_site = Column(Boolean, default=False)  # True apenas se for site real (não rede social)
    site_tipo = Column(String, default="nenhum")  # nenhum/website/facebook/instagram/youtube/linkedin/twitter/tiktok/linktree/outro_social

    # Fase 2
    whatsapp_status = Column(String, default="not_tested")  # not_tested/has_automation/no_automation/human

    # Fase 3 (desabilitado)
    site_gerado_path = Column(String)

    # Origem geográfica (copiada da busca)
    cidade = Column(String)
    estado = Column(String)

    # CRM
    crm_status = Column(String, default="not_contacted")  # not_contacted/contacted/interested/closed/no_interest/no_response
    canal_contato = Column(String)
    servico_oferecido = Column(String)
    observacoes = Column(Text)
    data_contato = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), default=now_utc)
