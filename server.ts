import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";
import fs from "fs";

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
