from fastapi import APIRouter, HTTPException, UploadFile, File
from app.core.config import get_settings
from app.domain.schemas import GithubIngestRequest, TaskResponse
from app.services.registry import registry
from app.services.ingestion.zip_ingestor import ZipIngestor
from app.services.ingestion.github_ingestor import GithubIngestor
from app.services.parsing.pipeline import ParsingPipeline

router = APIRouter(prefix="/ingestion", tags=["ingestion"])
zip_ingestor = ZipIngestor()
github_ingestor = GithubIngestor()
parsing_pipeline = ParsingPipeline()


@router.post("/zip", response_model=TaskResponse)
async def ingest_zip(project_id: str, upload: UploadFile = File(...)) -> TaskResponse:
    state = registry.projects.get(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    settings = get_settings()
    state.status = "running"
    file_bytes = await upload.read()
    state.files = zip_ingestor.ingest(file_bytes, settings.max_file_size_bytes)
    state.chunks = parsing_pipeline.parse_and_chunk(project_id, state.files)
    state.status = "completed"
    return TaskResponse(task_id=f"zip-{project_id}", status="completed", detail=f"Ingested {len(state.files)} files")


@router.post("/github", response_model=TaskResponse)
def ingest_github(payload: GithubIngestRequest) -> TaskResponse:
    state = registry.projects.get(payload.project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    state.status = "running"
    state.files = github_ingestor.ingest(payload.repo_url, payload.branch)
    state.chunks = parsing_pipeline.parse_and_chunk(payload.project_id, state.files)
    state.status = "completed"
    return TaskResponse(task_id=f"github-{payload.project_id}", status="completed", detail=f"Ingested {len(state.files)} files")
