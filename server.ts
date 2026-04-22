import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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

    zipEntries.forEach((entry: any) => {
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

    res.json({ 
      projectName: req.file.originalname.replace('.zip', ''),
      files,
      stats: {
        totalFiles: files.length,
        totalSize: files.reduce((acc, f) => acc + f.size, 0)
      }
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
