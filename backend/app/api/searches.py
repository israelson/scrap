import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db, get_session_factory
from app.db.models import Lead, Search
from app.schemas.search import SearchCreate, SearchResponse

router = APIRouter()


async def run_search_task(search_id: uuid.UUID, nicho: str, cidade: str, max_results: int):
    from app.services.gmaps_scraper import scrape_businesses

    async with get_session_factory()() as session:
        search = await session.get(Search, search_id)
        search.status = "running"
        await session.commit()

    businesses = []
    error = None
    try:
        businesses = await scrape_businesses(nicho, cidade, max_results)
    except Exception as e:
        error = str(e)

    async with get_session_factory()() as session:
        search = await session.get(Search, search_id)
        if error:
            search.status = "failed"
        else:
            for biz in businesses:
                session.add(Lead(search_id=search_id, **biz))
            search.status = "completed"
            search.total_found = len(businesses)
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
    background_tasks.add_task(run_search_task, search.id, search.nicho, search.cidade, search.max_results)
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
