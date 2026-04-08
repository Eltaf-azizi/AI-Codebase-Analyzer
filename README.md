# AI Codebase Analyzer

An AI-powered tool for instant codebase analysis and understanding. Upload your project as a ZIP file and get comprehensive insights into architecture, logic flow, security vulnerabilities, and interactive Q&A about your code.

## Features

- **Instant Analysis**: Upload a ZIP file and get immediate AI-powered analysis
- **Architecture Visualization**: Interactive graph showing file dependencies and relationships
- **Security Scanning**: Automated detection of potential security vulnerabilities
- **Interactive Chat**: Ask questions about your codebase and get contextual answers
- **Code Explorer**: Browse and search through your project files
- **Multi-language Support**: Works with various programming languages

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **AI**: Google Gemini 1.5 Flash with RAG (Retrieval-Augmented Generation)
- **Visualization**: D3.js for architecture graphs
- **File Processing**: Adm-Zip for ZIP extraction

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000 in your browser

## Usage

1. Upload a ZIP file containing your codebase
2. Wait for the AI analysis to complete
3. Explore the analysis dashboard with summary, architecture, and security insights
4. Use the interactive chat to ask questions about specific files or logic
5. Browse files in the code explorer and view syntax-highlighted code

## API Endpoints

- `POST /api/upload`: Upload and process ZIP files
- `GET /api/health`: Health check endpoint

## Development

- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Type check with TypeScript

## Security Notes

- Files are processed in memory and not stored permanently
- Large files (>50KB) are truncated for analysis
- Binary files and common build artifacts are excluded
- API keys should be kept secure and not committed to version control
