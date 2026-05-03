from fastapi import APIRouter
from app.domain.schemas import DebugRequest, DebugResponse
from app.services.debugging.assistant import DebugAssistant

router = APIRouter(prefix="/projects", tags=["debug"])
assistant = DebugAssistant()


@router.post("/{project_id}/debug", response_model=DebugResponse)
def debug_error(project_id: str, payload: DebugRequest) -> DebugResponse:
    result = assistant.analyze(payload.error_message, payload.code_snippet)
    return DebugResponse(**result)
