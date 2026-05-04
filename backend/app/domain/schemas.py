from typing import Any, Literal
from pydantic import BaseModel, Field


class ProjectCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class ProjectResponse(BaseModel):
    project_id: str
    name: str
    status: str


class GithubIngestRequest(BaseModel):
    project_id: str
    repo_url: str
    branch: str | None = None


class ChatRequest(BaseModel):
    query: str = Field(min_length=1)


class SourceCitation(BaseModel):
    file_path: str
    symbol_name: str | None = None
    snippet: str


class ChatResponse(BaseModel):
    answer: str
    citations: list[SourceCitation]


class AnalysisResponse(BaseModel):
    project_summary: str
    architecture_summary: str
    dependency_insights: list[str]
    file_summaries: dict[str, str]


class TaskResponse(BaseModel):
    task_id: str
    status: Literal["queued", "running", "completed", "failed"]
    detail: str | None = None


class SecurityFinding(BaseModel):
    type: str
    severity: Literal["low", "medium", "high", "critical"]
    file_path: str
    detail: str


class SecurityScanResponse(BaseModel):
    findings: list[SecurityFinding]


class DebugRequest(BaseModel):
    error_message: str
    code_snippet: str | None = None


class DebugResponse(BaseModel):
    root_cause: str
    evidence: list[str]
    suggested_fixes: list[str]


class DocsGenerateRequest(BaseModel):
    project_id: str
    include_inline_comments: bool = False


class DocsGenerateResponse(BaseModel):
    readme_markdown: str
    api_docs_markdown: str
    inline_comment_suggestions: dict[str, list[str]] | None = None


class FileTreeNode(BaseModel):
    name: str
    path: str
    kind: Literal["file", "directory"]
    children: list["FileTreeNode"] = []


class FileContentResponse(BaseModel):
    file_path: str
    content: str
    summary: str | None = None
    symbols: list[dict[str, Any]] = []
