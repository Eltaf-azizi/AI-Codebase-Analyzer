# Local Development Runbook

## Backend
1. `cd backend`
2. `python -m venv .venv`
3. `.venv\\Scripts\\activate` (Windows) or `source .venv/bin/activate` (Unix)
4. `pip install -r requirements.txt`
5. `uvicorn app.main:app --reload --port 8000`

## Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Docker
- `cd infra`
- `docker compose up --build`
