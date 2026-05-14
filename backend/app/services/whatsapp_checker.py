import asyncio
import re
import time

import httpx

from app.core.config import settings

# phone -> {lead_id, sent_at}
_pending: dict[str, dict] = {}

_MENU_PATTERNS = re.compile(
    r'(\b[1-9]\b[\.\)➡️])|'
    r'(digit|opç|opcao|menu|escolha|atendimento|agendamento|horário|servico|serviço)',
    re.IGNORECASE,
)


def _normalize_phone(phone: str) -> str:
    digits = re.sub(r'\D', '', phone)
    if not digits.startswith('55'):
        digits = '55' + digits
    return digits


def classify_response(elapsed_seconds: float, text: str) -> str:
    has_menu = bool(_MENU_PATTERNS.search(text))
    if elapsed_seconds < 30:
        return 'has_automation'
    if elapsed_seconds < 180 and has_menu:
        return 'has_automation'
    return 'human'


async def send_check_message(phone: str, lead_id: str) -> bool:
    normalized = _normalize_phone(phone)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{settings.evolution_api_url}/message/sendText/{settings.evolution_instance}",
                json={"number": normalized, "text": settings.whatsapp_test_message},
                headers={"apikey": settings.evolution_api_key},
            )
            r.raise_for_status()
        _pending[normalized] = {"lead_id": lead_id, "sent_at": time.time()}
        return True
    except Exception:
        return False


def process_incoming(phone: str, text: str) -> dict | None:
    normalized = _normalize_phone(phone)
    entry = _pending.pop(normalized, None)
    if not entry:
        return None
    elapsed = time.time() - entry["sent_at"]
    return {"lead_id": entry["lead_id"], "whatsapp_status": classify_response(elapsed, text)}


def collect_timed_out() -> list[dict]:
    now = time.time()
    expired = [
        {"lead_id": v["lead_id"], "whatsapp_status": "no_automation"}
        for k, v in _pending.items()
        if now - v["sent_at"] > settings.whatsapp_check_timeout_seconds
    ]
    for item in expired:
        # remove by lead_id
        keys_to_del = [k for k, v in _pending.items() if v["lead_id"] == item["lead_id"]]
        for k in keys_to_del:
            _pending.pop(k, None)
    return expired


async def run_batch_check(leads: list[dict]):
    for lead in leads:
        phone = lead.get("telefone") or lead.get("whatsapp")
        if not phone:
            continue
        await send_check_message(phone, lead["id"])
        await asyncio.sleep(5)
