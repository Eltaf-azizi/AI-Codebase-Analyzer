from fastapi import APIRouter, HTTPException
from app.domain.schemas import AnalysisResponse, TaskResponse
from app.services.registry import registry
from app.services.analysis.analyzer import AnalysisEngine

router = APIRouter(prefix="/projects", tags=["analysis"])
analysis_engine = AnalysisEngine()


@router.post("/{project_id}/analyze", response_model=TaskResponse)
def trigger_analysis(project_id: str) -> TaskResponse:
    state = registry.projects.get(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    state.analysis = analysis_engine.summarize_project(state.files, state.chunks)
    return TaskResponse(task_id=f"analysis-{project_id}", status="completed", detail="Analysis generated")


@router.get("/{project_id}/analysis", response_model=AnalysisResponse)
def get_analysis(project_id: str) -> AnalysisResponse:
    state = registry.projects.get(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    if not state.analysis:
        state.analysis = analysis_engine.summarize_project(state.files, state.chunks)
    payload = state.analysis
    return AnalysisResponse(
        project_summary=payload.get("project_summary", ""),
        architecture_summary=payload.get("architecture_summary", ""),
        dependency_insights=payload.get("dependency_insights", []),
        file_summaries=payload.get("file_summaries", {}),
    )
