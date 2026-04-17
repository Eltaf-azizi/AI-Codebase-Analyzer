# AI Codebase Analyzer

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