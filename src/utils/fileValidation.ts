// Safe file validation and sanitization utility
export interface ValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export const DEFAULT_ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const DEFAULT_ALLOWED_DOC_TYPES = [
  ...DEFAULT_ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function validateUploadedFile(
  file: File,
  options: ValidationOptions = {}
): { valid: boolean; error?: string } {
  const maxSizeMB = options.maxSizeMB || 5;
  const maxBytes = maxSizeMB * 1024 * 1024;
  const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_DOC_TYPES;

  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size > maxBytes) {
    return { valid: false, error: `File size exceeds the ${maxSizeMB}MB limit.` };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format (${file.type || 'unknown'}). Allowed: images and PDF documents.`,
    };
  }

  return { valid: true };
}

export function sanitizeFileName(originalName: string): string {
  const parts = originalName.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase()?.replace(/[^a-z0-9]/g, '') : 'bin';
  const base = parts.join('_').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  return `${base || 'upload'}_${randomSuffix}.${ext}`;
}
