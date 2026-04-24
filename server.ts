import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";
import { AIService } from "./src/services/aiService";
import { EXCLUDED_DIRS, EXCLUDED_EXTENSIONS } from "./src/lib/constants";
import { ChatRequest, FileData, UploadDiagnostics } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
type SkipReason = NonNullable<UploadDiagnostics["skippedDetails"]>[number]["reason"];
const MAX_EXTRACTED_FILE_SIZE = 2 * 1024 * 1024; // 2MB text file cap
const MAX_EXTRACTED_FILES = 3000;
const ALLOWED_ZIP_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]);

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

    if (!req.file.originalname?.toLowerCase().endsWith(".zip") || !ALLOWED_ZIP_MIME_TYPES.has(req.file.mimetype)) {
      return res.status(400).json({ error: "Only ZIP archives are accepted." });
    }

    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();
    
    const files: FileData[] = [];
    const skippedByReason: Record<string, number> = {};
    const skippedDetails: UploadDiagnostics["skippedDetails"] = [];

    const incrementReason = (reason: SkipReason, pathName: string) => {
      skippedByReason[reason] = (skippedByReason[reason] ?? 0) + 1;
      if ((skippedDetails?.length ?? 0) < 200) {
        skippedDetails?.push({ path: pathName, reason });
      }
    };

    const isPathSafe = (entryPath: string) => {
      return (
        !!entryPath &&
        !entryPath.includes("..") &&
        !path.isAbsolute(entryPath) &&
        !entryPath.includes("\\")
      );
    };

    zipEntries.forEach((entry: any) => {
      if (files.length >= MAX_EXTRACTED_FILES) {
        incrementReason("too_large", entry.entryName);
        return;
      }

      const normalizedPath = String(entry.entryName || "").replace(/^\/+/, "");
      const isExcludedDir = EXCLUDED_DIRS.some(dir => normalizedPath.includes(`${dir}/`));
      const isExcludedExt = EXCLUDED_EXTENSIONS.some(ext => normalizedPath.toLowerCase().endsWith(ext));
      
      if (entry.isDirectory) return;
      if (!isPathSafe(normalizedPath)) {
        incrementReason("path_not_allowed", normalizedPath);
        return;
      }
      if (isExcludedDir) {
        incrementReason("excluded_directory", normalizedPath);
        return;
      }
      if (isExcludedExt) {
        incrementReason("excluded_extension", normalizedPath);
        return;
      }
      if ((entry.header?.size ?? 0) > MAX_EXTRACTED_FILE_SIZE) {
        incrementReason("too_large", normalizedPath);
        return;
      }

      try {
        const content = entry.getData().toString("utf8");
        if (!content.trim()) {
          incrementReason("empty", normalizedPath);
          return;
        }
        files.push({
          path: normalizedPath,
          content,
          size: entry.header.size
        });
      } catch (e) {
        incrementReason("binary_or_unreadable", normalizedPath);
        console.warn(`Skipping binary or unreadable file: ${normalizedPath}`);
      }
    });

    if (files.length === 0) {
      return res.status(400).json({ error: "No readable source files found in archive." });
    }

    let analysis;
    try {
      analysis = await AIService.analyzeProject(files);
    } catch (analysisError) {
      console.warn("Analysis generation failed, returning upload payload only:", analysisError);
    }

    const diagnostics: UploadDiagnostics = {
      processedFiles: files.length,
      skippedFiles: Object.values(skippedByReason).reduce((acc, value) => acc + value, 0),
      skippedByReason,
      skippedDetails,
    };

    res.json({ 
      projectName: req.file.originalname.replace('.zip', ''),
      files,
      stats: {
        totalFiles: files.length,
        totalSize: files.reduce((acc, f) => acc + (f.size ?? 0), 0)
      },
      diagnostics,
      analysis,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process ZIP file" });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const files = (req.body?.files as FileData[]) ?? [];
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "files[] is required" });
    }
    const analysis = await AIService.analyzeProject(files);
    return res.json({ analysis });
  } catch (error) {
    console.error("Analyze error:", error);
    return res.status(500).json({ error: "Failed to analyze codebase" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const body = (req.body ?? {}) as Partial<ChatRequest>;
    const files = Array.isArray(body.files) ? body.files : [];
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];
    if (!message) return res.status(400).json({ error: "message is required" });
    if (!files.length) return res.status(400).json({ error: "files[] is required" });

    const reply = await AIService.chat(files, message, history);
    return res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ error: "Failed to generate chat response" });
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
