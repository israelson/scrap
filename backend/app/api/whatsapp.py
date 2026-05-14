import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.database import get_db, get_session_factory
from app.db.models import Lead
from app.services.whatsapp_checker import collect_timed_out, process_incoming, run_batch_check

router = APIRouter()


class CheckRequest(BaseModel):
    lead_ids: list[str]


async def _apply_result(result: dict):
    async with get_session_factory()() as session:
        lead = await session.get(Lead, uuid.UUID(result["lead_id"]))
        if lead:
            lead.whatsapp_status = result["whatsapp_status"]
            await session.commit()


@router.post("/check")
async def trigger_check(data: CheckRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    if not settings.whatsapp_enabled:
        raise HTTPException(
            status_code=503,
            detail="Evolution API não configurado. Preencha EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE no .env.",
        )

    result = await db.execute(
        select(Lead).where(Lead.id.in_([uuid.UUID(i) for i in data.lead_ids]))
    )
    leads = result.scalars().all()
    leads_data = [{"id": str(l.id), "telefone": l.telefone or l.whatsapp} for l in leads]

    # Marca como pendente imediatamente
    for lead in leads:
        lead.whatsapp_status = "checking"
    await db.commit()

    background_tasks.add_task(run_batch_check, leads_data)
    return {"queued": len(leads_data)}


@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    body = await request.json()

    event = body.get("event", "")
    if event != "messages.upsert":
        return {"ok": True}

    data = body.get("data", {})
    key = data.get("key", {})

    if key.get("fromMe"):
        return {"ok": True}

    phone = key.get("remoteJid", "").split("@")[0]
    message = data.get("message", {})
    text = (
        message.get("conversation")
        or message.get("extendedTextMessage", {}).get("text")
        or ""
    )

    result = process_incoming(phone, text)
    if result:
        await _apply_result(result)

    for timed_out in collect_timed_out():
        await _apply_result(timed_out)

    return {"ok": True}


@router.get("/status")
async def whatsapp_status():
    return {"enabled": settings.whatsapp_enabled}
