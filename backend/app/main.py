from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.api.v1.routes import projects, ingestion, analysis, chat, docs, debug, security

settings = get_settings()
setup_logging()
app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix=settings.api_prefix)
app.include_router(ingestion.router, prefix=settings.api_prefix)
app.include_router(analysis.router, prefix=settings.api_prefix)
app.include_router(chat.router, prefix=settings.api_prefix)
app.include_router(docs.router, prefix=settings.api_prefix)
app.include_router(debug.router, prefix=settings.api_prefix)
app.include_router(security.router, prefix=settings.api_prefix)


@app.get("/api/v1/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/v1/ready")
def ready() -> dict:
    return {"status": "ready"}
