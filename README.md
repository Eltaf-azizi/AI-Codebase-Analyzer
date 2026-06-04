# AI Codebase Analyzer

Production-oriented AI platform for deep repository understanding with FastAPI backend and Next.js frontend.

## Stack
- Backend: FastAPI, Celery-ready modular services, Gemini + FAISS retrieval.
- Frontend: Next.js App Router with upload/dashboard/chat/visualization pages.
- Parsing: Python AST and multi-language parser layer for symbols/chunking.

## Key Directories
- `backend/` production API and core AI services.
- `frontend/` production UI app.
- `infra/` Docker and deployment assets.
- `docs/` architecture, API spec, prompt strategy, runbooks.
- `src/` and `server.ts` legacy prototype retained for migration reference.

## Run Locally
1. Backend:
   - `cd backend`
   - `pip install -r requirements.txt`
   - `uvicorn app.main:app --reload --port 8000`
2. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

<<<<<<< HEAD
## Core API
- `POST /api/v1/projects`
- `POST /api/v1/ingestion/zip`
- `POST /api/v1/ingestion/github`
- `GET /api/v1/projects/{project_id}/analysis`
- `POST /api/v1/projects/{project_id}/chat`
- `POST /api/v1/projects/{project_id}/docs/generate`
- `POST /api/v1/projects/{project_id}/debug`
- `POST /api/v1/projects/{project_id}/security/scan`
=======
- ZIP upload and backend ingestion via `POST /api/upload`
- File filtering for `node_modules`, `.git`, `dist`, common binaries, and unreadable files
- Intelligent file chunking for functions, classes, and modules
- Dependency extraction from import/require statements
- Google Gemini model integration for summary and chat
- Semantic search using cosine similarity over embedded code chunks
- Interactive UI with drag-and-drop upload, file search, and chat history
- D3-based architecture dependency graph visualization

