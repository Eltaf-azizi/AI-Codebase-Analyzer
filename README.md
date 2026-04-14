# AI Codebase Analyzer

AI Codebase Analyzer is a local web application for uploading a ZIP archive of a codebase and receiving instant AI-generated insights into architecture, security, logic flow, and file relationships.

## Features

- Upload a codebase ZIP and ingest files through an Express API
- Interactive UI for browsing the repository structure and previewing source files
- AI-powered overall project analysis with architecture summary, feature detection, improvement suggestions, and security review
- Semantic search and chat interface for asking questions about the uploaded codebase
- Visual dependency graph powered by D3
- File chunking and embeddings using Google Gemini for RAG-style code search

## Architecture Overview

The application is split into a frontend React UI and a backend Express server.

- `server.ts`
  - Runs an Express server on port `3000`
  - Accepts `.zip` uploads via `/api/upload`
  - Extracts project files while excluding binary assets and common ignore directories
  - Serves Vite middleware in development or static files in production

- `src/App.tsx`
  - Provides upload flow, analysis dashboard, file explorer, code preview, and chat interface
  - Uses Tailwind CSS and motion animations for a polished developer experience

- `src/services/aiService.ts`
  - Initializes embeddings and RAG search context
  - Generates high-level analysis using Google Gemini
  - Handles interactive chat queries with project-specific context

- `src/services/parseService.ts`
  - Splits files into code chunks for embedding
  - Detects imports/dependencies from source files

- `src/services/vectorStore.ts`
  - Stores in-memory embeddings for semantic search
  - Performs cosine similarity search for query relevance

- `src/components/architectureGraph.tsx`
  - Renders the codebase dependency graph using D3

- `src/types/index.ts`
  - Defines shared TypeScript models used across the app
