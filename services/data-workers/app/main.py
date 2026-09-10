from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from arq import ArqRedis, create_pool
from arq.connections import RedisSettings
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    yield
    await app.state.redis.close()


app = FastAPI(
    title="Plated Data Workers",
    description="HTTP bridge for the async ingestion pipeline: apps/api's POST /internal/ingest calls "
    "POST /enqueue here, since a Node process can't speak Arq's Python-specific job-serialisation "
    "protocol directly.",
    lifespan=lifespan,
)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


class EnqueueRequest(BaseModel):
    artefact_id: str
    branch_id: str
    channel: str = "dine_in"


class EnqueueResponse(BaseModel):
    job_id: str


@app.post("/enqueue", response_model=EnqueueResponse)
async def enqueue(req: EnqueueRequest) -> EnqueueResponse:
    """Always enqueues ingestion.run — the one and only entry point a newly
    captured artefact should start the pipeline at. Deliberately not a
    generic "enqueue any task" endpoint: other tasks (canonicalisation.run,
    freshness_scheduler.run, ...) take different argument shapes, and the
    pipeline itself is responsible for chaining stage-to-stage internally
    once each stage does real work, not an external caller picking a stage."""
    redis: ArqRedis = app.state.redis
    job = await redis.enqueue_job("ingestion.run", req.artefact_id, req.branch_id, req.channel)
    if job is None:
        # Arq returns None when a job with the same explicit job_id is
        # already queued/running - not expected here since we never pass
        # one, but fail loudly rather than lying about a job_id.
        raise HTTPException(status_code=409, detail="Job was not enqueued (duplicate job_id?).")
    return EnqueueResponse(job_id=job.job_id)
