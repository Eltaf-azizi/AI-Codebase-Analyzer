# AI Codebase Analyzer

AI Codebase Analyzer is a browser-based tool for uploading a ZIP archive of a codebase and receiving instant AI-generated insights about architecture, security, logic flow, and file relationships.

##  Features

- ZIP upload and project ingestion via a secure Express endpoint
- Searchable file tree viewer with syntax-highlighted source preview
- AI-powered project summary, architecture analysis, feature extraction, and security review
- Interactive chat interface for asking questions about the codebase
- Dependency graph visualization powered by D3
- Semantic search using Google Gemini embeddings for relevant code retrieval


##  Project Structure

- `server.ts`  Express server with Vite middleware, ZIP upload handling, and project parsing
- `src/App.tsx`  Main React UI for upload flow, analysis dashboard, chat panel, and code viewer
- `src/services/aiService.ts`  AI orchestration, analysis generation, semantic chat, and vector store initialization
- `src/services/parseService.ts`  File chunking and dependency extraction utilities
- `src/services/vectorStore.ts`  In-memory embedding index and semantic search implementation
- `src/components/architectureGraph.tsx`  D3-based architecture/dependency graph renderer
- `src/types/index.ts`  Shared TypeScript interfaces for project data and analysis output
- `src/index.css`  Tailwind CSS theme and markdown styling

