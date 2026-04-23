/**
 * Input validation utilities
 */

import { EXCLUDED_EXTENSIONS, EXCLUDED_DIRS, FILE_LIMITS } from './constants';

/**
 * Validate file extension
 */
export function isValidExtension(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return !EXCLUDED_EXTENSIONS.includes(ext as any);
}

/**
 * Validate directory is not excluded
 */
export function isValidDirectory(path: string): boolean {
  return !EXCLUDED_DIRS.some(dir => path.includes(`${dir}/`));
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= FILE_LIMITS.MAX_FILE_SIZE;
}

/**
 * Validate ZIP file
 */
export function isValidZipFile(file: File): boolean {
  return file.name.endsWith('.zip') && isValidFileSize(file.size);
}

/**
 * Validate file path
 */
export function isValidPath(path: string): boolean {
  return (
    typeof path === 'string' &&
    path.length > 0 &&
    path.length < 1000 &&
    !path.includes('..') &&
    isValidExtension(path) &&
    isValidDirectory(path)
  );
}

/**
 * Sanitize string input
 */
export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').trim().slice(0, 10000);
}

/**
 * Validate JSON string
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}