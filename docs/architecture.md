# AI Codebase Analyzer Architecture

## Core Flow
1. User creates a project.
2. User ingests GitHub repo or ZIP.
3. Parsing pipeline extracts symbols and chunks.
4. Embeddings are generated and indexed in FAISS.
5. Chat/analysis endpoints retrieve relevant chunks and generate grounded responses.

## Services
- Ingestion: Git and ZIP loading.
- Parsing: Python AST + multi-language parser layer.
- RAG: embedding, vector search, context assembly, answer generation.
- Analysis: project, file, and architecture summarization.
- Productivity: docs generation, debug assistant, security scanning.
