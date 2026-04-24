export interface FileData {
  path: string;
  content: string;
  size?: number;
}

export interface ProjectStats {
  totalFiles: number;
  totalSize: number;
}

export interface SkippedFileInfo {
  path: string;
  reason: 'excluded_directory' | 'excluded_extension' | 'path_not_allowed' | 'too_large' | 'binary_or_unreadable' | 'empty';
}

export interface UploadDiagnostics {
  processedFiles: number;
  skippedFiles: number;
  skippedByReason: Record<string, number>;
  skippedDetails?: SkippedFileInfo[];
}

export interface ArchitectureNode {
  id: string;
  type: 'file' | 'dependency';
  group: number;
}

export interface ArchitectureLink {
  source: string;
  target: string;
  value: number;
}

export interface AnalysisResult {
  summary: string;
  architecture: string;
  features: string[];
  improvements: string[];
  security: string[];
  indexing?: {
    attempted: number;
    indexed: number;
    failed: number;
  };
  architectureData?: {
    nodes: ArchitectureNode[];
    links: ArchitectureLink[];
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface UploadResponse {
  projectName: string;
  files: FileData[];
  stats: ProjectStats;
  diagnostics?: UploadDiagnostics;
}

export interface ChatRequest {
  files: FileData[];
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
}
