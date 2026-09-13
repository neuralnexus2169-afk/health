/**
 * Document Storage Abstraction for HealthTimeline
 * Provides clean decoupling between file storage and business logic.
 * Designed to be swappable with S3, Google Cloud Storage, Supabase Storage, or Azure Blob Storage.
 */

export interface StoredFile {
  key: string;
  fileName: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  dataUrl?: string;
  uploadedAt: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface IDocumentStorage {
  upload(
    file: File | { name: string; type: string; size: number; dataUrl?: string }
  ): Promise<StoredFile>;
  get(key: string): Promise<StoredFile | null>;
  delete(key: string): Promise<boolean>;
  list(): Promise<StoredFile[]>;
  validate(file: { name: string; type?: string; size: number }): FileValidationResult;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

/**
 * Sanitize filename to prevent directory traversal and invalid characters
 */
export function sanitizeFileName(rawName: string): string {
  // Strip null bytes and control chars
  let clean = rawName.replace(/[\x00-\x1f\x80-\x9f]/g, '');

  // Strip path traversal patterns like ../ or ..\
  clean = clean.replace(/(\.\.[\/\\])+/g, '');

  // Keep only alphanumeric characters, underscores, dashes, dots, and spaces
  clean = clean.replace(/[^a-zA-Z0-9._\-\s]/g, '_');

  // Collapse multiple spaces/underscores
  clean = clean.trim().replace(/\s+/g, '_');

  // Prevent dotfile
  if (clean.startsWith('.')) {
    clean = 'doc' + clean;
  }

  // Ensure it has a valid extension or fallback
  const hasExt = ALLOWED_EXTENSIONS.some((ext) => clean.toLowerCase().endsWith(ext));
  if (!hasExt) {
    clean += '.pdf';
  }

  return clean || 'medical_document.pdf';
}

/**
 * Validate file type and size constraints
 */
export function validateDocumentFile(file: {
  name: string;
  type?: string;
  size: number;
}): FileValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file provided.' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 10 MB.`,
    };
  }

  if (file.size <= 0) {
    return {
      isValid: false,
      error: 'File appears to be empty (0 bytes).',
    };
  }

  // Check file extension
  const lowerName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasValidMime = file.type ? ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) : false;

  if (!hasValidExt && !hasValidMime) {
    return {
      isValid: false,
      error: 'Unsupported file format. Please upload a PDF, PNG, or JPG document.',
    };
  }

  return { isValid: true };
}

/**
 * Local Development Storage implementation
 * Persists file metadata and data URLs in memory and session cache.
 * Large files are handled via object URLs or base64 data URLs without touching database blobs.
 */
class LocalDocumentStorage implements IDocumentStorage {
  private filesMap: Map<string, StoredFile> = new Map();

  validate(file: { name: string; type?: string; size: number }): FileValidationResult {
    return validateDocumentFile(file);
  }

  async upload(
    file: File | { name: string; type: string; size: number; dataUrl?: string }
  ): Promise<StoredFile> {
    const validation = this.validate(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'File validation failed.');
    }

    const safeName = sanitizeFileName(file.name);
    const key = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${safeName}`;

    let dataUrl: string | undefined = undefined;

    if ('dataUrl' in file && file.dataUrl) {
      dataUrl = file.dataUrl;
    } else if (file instanceof File) {
      try {
        dataUrl = await this.readAsDataUrl(file);
      } catch (err) {
        console.warn('Could not read file preview dataUrl, continuing with storage record:', err);
      }
    }

    const storedFile: StoredFile = {
      key,
      fileName: safeName,
      originalName: file.name,
      contentType: file.type || (safeName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      sizeBytes: file.size,
      dataUrl,
      uploadedAt: new Date().toISOString(),
    };

    this.filesMap.set(key, storedFile);
    return storedFile;
  }

  async get(key: string): Promise<StoredFile | null> {
    return this.filesMap.get(key) || null;
  }

  async delete(key: string): Promise<boolean> {
    return this.filesMap.delete(key);
  }

  async list(): Promise<StoredFile[]> {
    return Array.from(this.filesMap.values());
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file as data URL'));
      reader.readAsDataURL(file);
    });
  }
}

export const documentStorage: IDocumentStorage = new LocalDocumentStorage();
