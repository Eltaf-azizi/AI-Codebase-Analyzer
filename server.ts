import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";
import fs from "fs";
import { AIService } from "./src/services/aiService.ts";
import { FileData, ProjectStats, ChatMessage } from "./src/types/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

let lastProject: { files: FileData[]; projectName: string; stats: ProjectStats } | null = null;

// Middleware
app.use(express.json({ limit: '100mb' }));

// Multer for ZIP uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// API Routes
app.post("/api/upload", upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();
    
    const files: { path: string; content: string; size: number }[] = [];
    
    // Filter out binary and large files
    const EXCLUDED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.exe', '.dll', '.pyc', '.node'];
    const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '.cache', 'venv', '__pycache__'];

    zipEntries.forEach((entry) => {
      const isExcludedDir = EXCLUDED_DIRS.some(dir => entry.entryName.includes(`${dir}/`));
      const isExcludedExt = EXCLUDED_EXTENSIONS.some(ext => entry.entryName.toLowerCase().endsWith(ext));
      
      if (!entry.isDirectory && !isExcludedDir && !isExcludedExt) {
        try {
          const content = entry.getData().toString("utf8");
          files.push({
            path: entry.entryName,
            content: content,
            size: entry.header.size
          });
        } catch (e) {
          console.warn(`Skipping binary or unreadable file: ${entry.entryName}`);
        }
      }
    });

    const projectName = req.file.originalname.replace('.zip', '');
    const stats: ProjectStats = {
      totalFiles: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0)
    };

    await AIService.initialize(files);
    const analysis = await AIService.analyzeProject(files);

    lastProject = { files, projectName, stats };

    res.json({ 
      projectName,
      files,
      stats,
      analysis
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process ZIP file" });
  }
});

app.post("/api/chat", express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { message, history } = req.body as { message: string; history: ChatMessage[] };
    if (!message) return res.status(400).json({ error: "Missing message" });
    if (!lastProject || !lastProject.files.length) {
      return res.status(400).json({ error: "No project data available for chat. Please upload a project first." });
    }

    const reply = await AIService.chat(lastProject.files, message, history || []);
    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to generate chat response" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AI Codebase Analyzer running on http://localhost:${PORT}`);
  });
}

startServer();
