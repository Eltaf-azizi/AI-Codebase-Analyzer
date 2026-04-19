<h1 align="center">AI Codebase Analyzer</h1>

AI Codebase Analyzer is a local developer tool that turns a ZIP archive of a codebase into instant architecture, security, and logic insights using AI. It combines a React frontend, an Express backend, Google Gemini embeddings, and a semantic search/chat interface to help engineers understand unknown repositories faster.

## 🚀 What This Project Does

- Accepts a `.zip` archive of a source code repository through a browser upload
- Extracts text-based source files while excluding common binary and dependency folders
- Builds an in-memory vector store of code chunks for semantic search
- Generates a structured project analysis with architecture, feature detection, security observations, and improvement recommendations
- Provides an interactive file explorer, syntax-highlighted preview, and visual dependency graph
- Supports conversational codebase queries using AI-powered retrieval augmented generation (RAG)

## 📦 Features

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
.
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components
│   │   └── architectureGraph.tsx
│   ├── services
│   │   ├── aiService.ts
│   │   ├── parseService.ts
│   │   └── vectorStore.ts
│   └── types
│       └── index.ts
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

