export interface FileData {
  path: string;
  content: string;
  size?: number;
  language?: string;
}

export interface ProjectStats {
  totalFiles: number;
  totalSize: number;
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

export interface UploadDiagnostics {
  skippedByDirectory: number;
  skippedByExtension: number;
  skippedBySize: number;
  skippedUnreadable: number;
  accepted: number;
}

export interface UploadResponse {
  projectName: string;
  files: FileData[];
  stats: ProjectStats;
  diagnostics?: UploadDiagnostics;
  analysis?: AnalysisResult;
}

export interface ChatResponse {
  reply: string;
}
