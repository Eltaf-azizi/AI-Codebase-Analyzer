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

## 🧠 Architecture Overview

### Backend

- `server.ts`
  - Express server listening on port `3000`
  - Uses `multer` memory storage for file uploads
  - Extracts ZIP contents with `adm-zip`
  - Filters out excluded directories and binary extensions
  - Provides a health endpoint at `/api/health`
  - Uses Vite middleware in development and serves static files in production


### Frontend

- `src/App.tsx`
  - Main React application and page layout
  - Upload flow, analysis dashboard, file explorer, code preview, and chat interface
  - Uses `motion` for animation and `Tailwind CSS` for styling
  - Includes syntax highlighting via `react-syntax-highlighter`

- `src/components/architectureGraph.tsx`
  - Visualizes file dependency relationships using D3

### AI + Search Services

- `src/services/aiService.ts`
  - Initializes the AI model client and vector store
  - Generates structured project analysis
  - Answers chat queries using relevant context from the codebase

- `src/services/parseService.ts`
  - Splits files into code chunks by functions/classes/modules
  - Detects imports and external dependency references

- `src/services/vectorStore.ts`
  - Manages in-memory embeddings and similarity search

- `src/types/index.ts`
  - Shared TypeScript interfaces for files, analysis results, messages, and graph data


## 📁 Project Structure

```text
AI Codebase Analyzer/
├── backend/                    # FastAPI production backend
│   ├── app/
│   │   ├── api/v1/routes/      # API endpoints
│   │   │   ├── analysis.py
│   │   │   ├── chat.py
│   │   │   ├── debug.py
│   │   │   ├── docs.py
│   │   │   ├── ingestion.py
│   │   │   ├── projects.py
│   │   │   └── security.py
│   │   ├── core/               # Config & logging
│   │   ├── domain/             # Schemas
│   │   └── services/           # Business logic
│   │       ├── analysis/
│   │       ├── debugging/
│   │       ├── documentation/
│   │       ├── ingestion/
│   │       ├── parsing/
│   │       ├── rag/
│   │       └── security/
│   ├── tests/
│   │   ├── integration/
│   │   └── unit/
│   ├── requirements.txt
│   └── pytest.ini
│
├── frontend/                   # Next.js App Router UI
│   ├── app/
│   │   ├── chat/[projectId]/
│   │   ├── dashboard/[projectId]/
│   │   ├── upload/
│   │   └── visualization/[projectId]/
│   ├── components/             # Reusable UI components
│   └── lib/                   # API client & utilities
│
├── infra/                     # Docker & deployment
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
│
├── docs/                      # Documentation
│   ├── api-spec.md
│   ├── architecture.md
│   ├── prompt-library.md
│   └── runbooks/
│
├── src/                       # Legacy prototype (migration reference)
├── server.ts                  # Legacy server
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## ⚙️ Requirements

- Node.js 18 or newer
- npm
- Google Gemini API key

## 🔧 Setup

1. Install dependencies:

```bash
npm install
```

2. Configure the Gemini API key:

```powershell
$env:GEMINI_API_KEY = "your_api_key_here"
```

3. Start development mode:

```bash
npm run dev
```

4. Open your browser at:

```text
http://localhost:3000
```

## 🧪 Available Scripts

- `npm run dev` — Start the Express + Vite development server
- `npm run build` — Build the frontend for production with Vite
- `npm run preview` — Preview the production build locally
- `npm run clean` — Delete the generated `dist` folder
- `npm run lint` — Run TypeScript type checking with `tsc --noEmit`

## 💡 Usage

1. Create a `.zip` archive of the repository or codebase you want to analyze.
2. Open the app in your browser.
3. Drag and drop the ZIP or click to upload.
4. Wait for the backend to extract files and generate analysis.
5. Browse the file explorer, inspect source files, and use the AI chat for questions.

## 🧩 How It Works

- The backend loads the ZIP and extracts readable text files.
- Source files are chunked by common code boundaries (functions, classes, modules).
- Code chunks are embedded and stored for semantic similarity search.
- The AI service uses Gemini to produce a project summary and to answer user queries with relevant context.
- The frontend displays analysis, file previews, search, and dependency graph visualizations.

## 🔐 Notes

- The current upload limit is 100MB for ZIP files.
- The backend skips large binary assets and non-text files when extracting ZIP contents.
- The AI analysis uses local in-memory storage and does not persist data between sessions.

## 🛠️ Development Notes

- The repository is intentionally designed to be a local prototype / developer utility.
- To extend analysis capabilities, update `src/services/aiService.ts` with new prompts or structured schemas.
- To improve chunking, enhance `src/services/parseService.ts` with language-specific parsers.
- To persist vector data, replace the in-memory store in `src/services/vectorStore.ts`.

## 📚 Dependencies

Key runtime dependencies:

- `react`, `react-dom` — UI
- `vite`, `@vitejs/plugin-react` — build tooling
- `express` — backend server
- `adm-zip` — ZIP extraction
- `multer` — upload handling
- `@google/genai` — Gemini AI client
- `d3` — architecture graph rendering
- `react-markdown`, `react-syntax-highlighter` — code preview and markdown rendering
- `tailwindcss`, `@tailwindcss/vite` — styling
>>>>>>> ddd853cbe9ed9a47e582a81abaac2a06c5699926
