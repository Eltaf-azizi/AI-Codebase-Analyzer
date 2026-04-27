import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";
import { AIService } from "./src/services/aiService";
import type { ChatMessage, FileData, UploadDiagnostics } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const MAX_EXTRACTED_FILES = 5000;
const MAX_TEXT_FILE_SIZE = 500_000;
const ZIP_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "multipart/x-zip",
]);
let latestFiles: FileData[] = [];

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
    const originalName = String(req.file.originalname || "");
    const mimeType = String(req.file.mimetype || "");
    if (!originalName.toLowerCase().endsWith(".zip") || (!ZIP_MIME_TYPES.has(mimeType) && mimeType !== "application/octet-stream")) {
      return res.status(400).json({ error: "Only ZIP archives are allowed." });
    }

    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();
    
    const files: { path: string; content: string; size: number }[] = [];
    const diagnostics: UploadDiagnostics = {
      skippedByDirectory: 0,
      skippedByExtension: 0,
      skippedBySize: 0,
      skippedUnreadable: 0,
      accepted: 0,
    };
    
    // Filter out binary and large files
    const EXCLUDED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.exe', '.dll', '.pyc', '.node'];
    const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '.cache', 'venv', '__pycache__'];

    if (zipEntries.length > MAX_EXTRACTED_FILES) {
      return res.status(413).json({ error: `Archive contains too many files. Max allowed is ${MAX_EXTRACTED_FILES}.` });
    }

    zipEntries.forEach((entry: AdmZip.IZipEntry) => {
      const isExcludedDir = EXCLUDED_DIRS.some(dir => entry.entryName.includes(`${dir}/`));
      const isExcludedExt = EXCLUDED_EXTENSIONS.some(ext => entry.entryName.toLowerCase().endsWith(ext));
      const isTooLarge = entry.header.size > MAX_TEXT_FILE_SIZE;

      if (isExcludedDir) {
        diagnostics.skippedByDirectory += 1;
        return;
      }
      if (isExcludedExt) {
        diagnostics.skippedByExtension += 1;
        return;
      }
      if (isTooLarge) {
        diagnostics.skippedBySize += 1;
        return;
      }
      
      if (!entry.isDirectory && !isExcludedDir && !isExcludedExt) {
        try {
          const content = entry.getData().toString("utf8");
          if (!content.trim()) {
            diagnostics.skippedUnreadable += 1;
            return;
          }
          files.push({
            path: entry.entryName,
            content: content,
            size: entry.header.size
          });
          diagnostics.accepted += 1;
        } catch (e) {
          diagnostics.skippedUnreadable += 1;
          console.warn(`Skipping binary or unreadable file: ${entry.entryName}`);
        }
      }
    });

    latestFiles = files;
    await AIService.initialize(files);
    const analysis = await AIService.analyzeProject(files);

    res.json({ 
      projectName: req.file.originalname.replace('.zip', ''),
      files,
      stats: {
        totalFiles: files.length,
        totalSize: files.reduce((acc, f) => acc + f.size, 0)
      },
      diagnostics,
      analysis,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process ZIP file" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body as { message?: string; history?: ChatMessage[] };
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }
    if (latestFiles.length === 0) {
      return res.status(400).json({ error: "No project uploaded yet." });
    }

    const reply = await AIService.chat(latestFiles, message, history ?? []);
    return res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ error: "Failed to process chat request." });
  }
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
