# AI Codebase Analyzer

A Vite + React application that analyzes a ZIP-packed codebase, extracts file content, and performs architecture and chat-based analysis using Google Gemini on the server.

## Features

- Upload a `.zip` repository and preview file contents.
- Server-side Gemini analysis to avoid exposing API keys in the browser.
- Interactive AI chat about project architecture, files, and logic.
- Dependency graph visualization and code explorer.

## Setup

1. Copy `.env.example` to `.env`.
2. Add your Gemini API key to `.env`:

```env
GEMINI_API_KEY="your_api_key_here"
```

3. Install dependencies:

```bash
npm install
```

4. Run the app locally:

```bash
npm run dev
```

5. Open the app in your browser:

```bash
http://localhost:3000
```

## Notes

- The backend loads `GEMINI_API_KEY` from `.env` and serves analysis/chat endpoints.
- The client uploads ZIP files to `/api/upload` and sends chat requests to `/api/chat`.
