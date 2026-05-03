from fastapi import APIRouter, HTTPException
from app.domain.schemas import DocsGenerateRequest, DocsGenerateResponse
from app.services.registry import registry
from app.services.documentation.generator import DocumentationGenerator

router = APIRouter(prefix="/projects", tags=["docs"])
doc_generator = DocumentationGenerator()


@router.post("/{project_id}/docs/generate", response_model=DocsGenerateResponse)
def generate_docs(project_id: str, payload: DocsGenerateRequest) -> DocsGenerateResponse:
    state = registry.projects.get(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    analysis = state.analysis or {}
    readme = doc_generator.generate_readme(state.name, analysis)
    api_docs = doc_generator.generate_api_docs()
    inline = doc_generator.inline_comment_suggestions(state.files) if payload.include_inline_comments else None
    return DocsGenerateResponse(
        readme_markdown=readme,
        api_docs_markdown=api_docs,
        inline_comment_suggestions=inline,
    )
