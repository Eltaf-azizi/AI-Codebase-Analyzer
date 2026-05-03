from fastapi import APIRouter, HTTPException
from app.domain.schemas import SecurityScanResponse, SecurityFinding
from app.services.registry import registry
from app.services.security.scanner import SecurityScanner

router = APIRouter(prefix="/projects", tags=["security"])
scanner = SecurityScanner()


@router.post("/{project_id}/security/scan", response_model=SecurityScanResponse)
def scan_security(project_id: str) -> SecurityScanResponse:
    state = registry.projects.get(project_id)
    if not state:
        raise HTTPException(status_code=404, detail="Project not found")
    findings = [SecurityFinding(**f) for f in scanner.scan(state.files)]
    return SecurityScanResponse(findings=findings)
