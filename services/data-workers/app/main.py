from arq import create_pool
from arq.connections import RedisSettings
from fastapi import FastAPI
from pydantic import BaseModel

from app.config import settings

app = FastAPI(title="Plated Data Workers", description="Local-dev entry point for the async ingestion pipeline.")


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


class EnqueueRequest(BaseModel):
    artefact_id: str
    task: str = "ingestion.run"


@app.post("/enqueue")
async def enqueue(req: EnqueueRequest) -> dict[str, str]:
    """Local-only helper: push a job onto the Arq queue directly, so the
    worker pipeline can be exercised without going through apps/api's
    POST /internal/ingest during development."""
    redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    job = await redis.enqueue_job(req.task, req.artefact_id)
    await redis.close()
    return {"job_id": job.job_id if job else "unknown"}
