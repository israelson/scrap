import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Lead
from app.schemas.lead import LeadResponse, LeadUpdate

router = APIRouter()

VALID_CRM_STATUSES = {
    "not_contacted", "contacted", "interested", "closed", "no_interest", "no_response"
}
# Fechado não pode voltar para status anterior
BLOCKED_TRANSITIONS = {"closed"}


@router.get("/", response_model=list[LeadResponse])
async def list_leads(
    search_id: Optional[str] = None,
    crm_status: Optional[str] = None,
    tem_site: Optional[bool] = None,
    skip: int = 0,
    limit: int = 200,
    db: AsyncSession = Depends(get_db),
):
    query = select(Lead).order_by(Lead.created_at.desc())
    if search_id:
        query = query.where(Lead.search_id == uuid.UUID(search_id))
    if crm_status:
        query = query.where(Lead.crm_status == crm_status)
    if tem_site is not None:
        query = query.where(Lead.tem_site == tem_site)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/count")
async def count_leads(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count()).select_from(Lead))
    sem_site = await db.scalar(select(func.count()).select_from(Lead).where(Lead.tem_site == False))
    fechados = await db.scalar(select(func.count()).select_from(Lead).where(Lead.crm_status == "closed"))
    return {"total": total or 0, "sem_site": sem_site or 0, "fechados": fechados or 0}


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: str, data: LeadUpdate, db: AsyncSession = Depends(get_db)):
    lead = await db.get(Lead, uuid.UUID(lead_id))
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")

    if data.crm_status and lead.crm_status in BLOCKED_TRANSITIONS and data.crm_status != lead.crm_status:
        raise HTTPException(status_code=400, detail="Lead fechado não pode voltar para status anterior")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(lead, key, value)

    await db.commit()
    await db.refresh(lead)
    return lead
