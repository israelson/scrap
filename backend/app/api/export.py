import uuid
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Lead
from app.services.export_service import leads_to_csv

router = APIRouter()


@router.get("/leads")
async def export_leads(
    search_id: Optional[str] = None,
    crm_status: Optional[str] = None,
    tem_site: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Lead).order_by(Lead.created_at.desc())
    if search_id:
        query = query.where(Lead.search_id == uuid.UUID(search_id))
    if crm_status:
        query = query.where(Lead.crm_status == crm_status)
    if tem_site is not None:
        query = query.where(Lead.tem_site == tem_site)

    result = await db.execute(query)
    leads = result.scalars().all()
    csv_content = leads_to_csv(leads)

    return StreamingResponse(
        iter([csv_content.encode("utf-8-sig")]),  # utf-8-sig para abrir corretamente no Excel
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )
