import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db import database as db_module
from app.db.models import Base


async def _timeout_worker():
    """Verifica a cada 60s se algum lead ficou sem resposta e marca como no_automation."""
    from app.services.whatsapp_checker import collect_timed_out
    from app.db.database import get_session_factory
    from app.db.models import Lead
    import uuid

    while True:
        await asyncio.sleep(60)
        timed_out = collect_timed_out()
        if not timed_out:
            continue
        async with get_session_factory()() as session:
            for item in timed_out:
                lead = await session.get(Lead, uuid.UUID(item["lead_id"]))
                if lead:
                    lead.whatsapp_status = item["whatsapp_status"]
            await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_module.init_db(settings.database_url)
    for attempt in range(10):
        try:
            async with db_module.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            break
        except Exception as e:
            if attempt == 9:
                raise
            await asyncio.sleep(3)
    task = asyncio.create_task(_timeout_worker())
    yield
    task.cancel()


app = FastAPI(title="ProspectorPRO API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import searches, leads, export, whatsapp  # noqa: E402

app.include_router(searches.router, prefix="/api/searches", tags=["searches"])
app.include_router(leads.router, prefix="/api/leads", tags=["leads"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["whatsapp"])


@app.get("/health")
async def health():
    return {"status": "ok"}


_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(_static_dir):
    app.mount("/", StaticFiles(directory=_static_dir, html=True), name="static")
