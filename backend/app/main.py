from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import database as db_module
from app.db.models import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_module.init_db(settings.database_url)
    async with db_module.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="ProspectorPRO API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import searches, leads, export  # noqa: E402

app.include_router(searches.router, prefix="/api/searches", tags=["searches"])
app.include_router(leads.router, prefix="/api/leads", tags=["leads"])
app.include_router(export.router, prefix="/api/export", tags=["export"])


@app.get("/health")
async def health():
    return {"status": "ok"}
