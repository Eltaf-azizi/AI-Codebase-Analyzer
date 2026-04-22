/**
 * Application-wide constants
 */

export const APP_NAME = 'AI Codebase Analyzer';

export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  HEALTH: '/api/health',
  ANALYZE: '/api/analyze',
  CHAT: '/api/chat',
} as const;

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_FILES_DISPLAY: 1000,
  CHUNK_SIZE: 50000,
} as const;

export const EXCLUDED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.pdf', 
  '.zip', '.exe', '.dll', '.pyc', '.node',
  '.svg', '.ico', '.webp', '.bmp'
] as const;

export const EXCLUDED_DIRS = [
  'node_modules', '.git', 'dist', 'build', 
  '.next', '.cache', 'venv', '__pycache__',
  '.svn', '.hg', 'vendor'
] as const;

export const UI = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 4000,
  ANIMATION_DURATION: 200,
} as const;

export const AI_CONFIG = {
  MAX_TOKENS: 8192,
  TEMPERATURE: 0.7,
  MODEL: 'gemini-3-flash-preview',
} as const;