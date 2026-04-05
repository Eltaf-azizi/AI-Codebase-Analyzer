export interface FileData {
  path: string;
  content: string;
  size?: number;
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
