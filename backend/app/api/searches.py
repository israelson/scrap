import re
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db, get_session_factory
from app.db.models import Lead, Search
from app.schemas.search import SearchCreate, SearchResponse

router = APIRouter()


def _extract_estado(cidade: str) -> str:
    m = re.search(r'\b([A-Z]{2})\s*$', cidade.strip())
    return m.group(1) if m else ""


async def _is_duplicate(session: AsyncSession, biz: dict) -> bool:
    telefone = (biz.get("telefone") or "").strip()
    if telefone:
        count = await session.scalar(
            select(func.count()).select_from(Lead).where(Lead.telefone == telefone)
        )
        if count:
            return True
    nome = (biz.get("nome") or "").strip()
    endereco = (biz.get("endereco") or "").strip()
    if nome and endereco:
        count = await session.scalar(
            select(func.count()).select_from(Lead)
            .where(Lead.nome == nome, Lead.endereco == endereco)
        )
        if count:
            return True
    return False


async def run_search_task(search_id: uuid.UUID, nicho: str, cidade: str, bairro: str, max_results: int):
    from app.services.gmaps_scraper import scrape_businesses

    async with get_session_factory()() as session:
        search = await session.get(Search, search_id)
        search.status = "running"
        await session.commit()

    businesses = []
    error = None
    try:
        local = f"{bairro}, {cidade}" if bairro else cidade
    businesses = await scrape_businesses(nicho, local, max_results)
    except Exception as e:
        error = str(e)

    async with get_session_factory()() as session:
        search = await session.get(Search, search_id)
        if error:
            search.status = "failed"
        else:
            new_count = 0
            estado = _extract_estado(cidade)
            for biz in businesses:
                if not await _is_duplicate(session, biz):
                    session.add(Lead(search_id=search_id, cidade=cidade, estado=estado, **biz))
                    new_count += 1
            search.status = "completed"
            search.total_found = new_count
        await session.commit()


@router.post("/", response_model=SearchResponse, status_code=201)
async def create_search(
    data: SearchCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    search = Search(**data.model_dump())
    db.add(search)
    await db.commit()
    await db.refresh(search)
    background_tasks.add_task(run_search_task, search.id, search.nicho, search.cidade, search.bairro or "", search.max_results)
    return search


@router.get("/", response_model=list[SearchResponse])
async def list_searches(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Search).order_by(Search.created_at.desc()).limit(50))
    return result.scalars().all()


@router.get("/{search_id}", response_model=SearchResponse)
async def get_search(search_id: str, db: AsyncSession = Depends(get_db)):
    search = await db.get(Search, uuid.UUID(search_id))
    if not search:
        raise HTTPException(status_code=404, detail="Busca não encontrada")
    return search


@router.delete("/all", status_code=200)
async def clear_all(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Lead))
    await db.execute(delete(Search))
    await db.commit()
    return {"ok": True}
