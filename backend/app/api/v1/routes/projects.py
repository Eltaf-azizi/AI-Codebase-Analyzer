from fastapi import APIRouter, HTTPException
from app.domain.schemas import ProjectCreateRequest, ProjectResponse, FileContentResponse
from app.services.registry import registry

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse)
def create_project(payload: ProjectCreateRequest) -> ProjectResponse:
    state = registry.create_project(payload.name)
    return ProjectResponse(project_id=state.project_id, name=state.name, status=state.status)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str) -> ProjectResponse:
    state = registry.projects.get(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(project_id=state.project_id, name=state.name, status=state.status)


@router.get("/{project_id}/tree")
def get_project_tree(project_id: str) -> dict:
    state = registry.projects.get(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"paths": sorted(state.files.keys())}


@router.get("/{project_id}/files/{file_path:path}", response_model=FileContentResponse)
def get_file(project_id: str, file_path: str) -> FileContentResponse:
    state = registry.projects.get(project_id)
    if not state or file_path not in state.files:
        raise HTTPException(status_code=404, detail="File not found")
    return FileContentResponse(file_path=file_path, content=state.files[file_path], summary=None, symbols=[])
