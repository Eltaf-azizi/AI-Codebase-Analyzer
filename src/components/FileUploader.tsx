import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, FileArchive, Loader2, Layout, ShieldAlert, Zap } from 'lucide-react';
import { UploadResponse } from '../types';
import { API_ENDPOINTS } from '../lib/constants';

interface FileUploaderProps {
  onUpload: (data: UploadResponse) => void;
}

export function FileUploader({ onUpload }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Ready to analyze your repository.');

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please upload a .zip file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusText('Uploading archive and validating files...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((data?.error as string) || 'Failed to upload file');
      }

      setStatusText('Repository accepted. Building project view...');
      onUpload(data as UploadResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing ZIP file. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

}
