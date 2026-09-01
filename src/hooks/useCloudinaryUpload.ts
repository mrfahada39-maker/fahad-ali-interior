/**
 * useCloudinaryUpload — Reusable hook for uploading images/files to Cloudinary
 * via the serverless API at POST /api/v1/uploads/image
 *
 * Usage:
 *   const { upload, uploadMultiple, uploading, error, progress } = useCloudinaryUpload();
 *   const result = await upload(file, 'products');
 *   // result.secureUrl  → Cloudinary HTTPS URL
 *   // result.publicId   → Cloudinary public ID (for deletion)
 */

import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes: number;
}

export type CloudinaryFolder =
  | 'products'
  | 'blog'
  | 'avatars'
  | 'vendor'
  | 'banners'
  | 'categories'
  | 'gallery'
  | (string & {}); // allow any custom folder string

export interface UseCloudinaryUploadReturn {
  /** Upload a single file to Cloudinary */
  upload: (
    file: File,
    folder?: CloudinaryFolder,
  ) => Promise<CloudinaryUploadResult | null>;
  /** Upload multiple files to Cloudinary (max 10) */
  uploadMultiple: (
    files: File[],
    folder?: CloudinaryFolder,
  ) => Promise<CloudinaryUploadResult[]>;
  /** Delete a file from Cloudinary by its publicId */
  deleteFile: (
    publicId: string,
    type?: 'image' | 'video' | 'raw',
  ) => Promise<boolean>;
  /** Whether an upload is in progress */
  uploading: boolean;
  /** Upload progress percentage (0–100) */
  progress: number;
  /** Error message if upload failed */
  error: string | null;
  /** Clear the last error */
  clearError: () => void;
}

// ── Helper — parse backend response ─────────────────────────────────────────

function parseUploadResponse(body: unknown): CloudinaryUploadResult | null {
  if (!body || typeof body !== 'object') return null;

  const b = body as Record<string, unknown>;

  // Standard API wrapped response: { success: true, data: { secureUrl, ... } }
  const data = (b.data ?? b) as Record<string, unknown>;

  if (!data.secureUrl && !data.secure_url) return null;

  return {
    url:          (data.url as string)            || '',
    secureUrl:    (data.secureUrl as string)       || (data.secure_url as string) || '',
    publicId:     (data.publicId as string)        || (data.public_id as string)  || '',
    format:       (data.format as string)          || '',
    resourceType: (data.resourceType as string)    || (data.resource_type as string) || 'image',
    width:        (data.width as number)           || undefined,
    height:       (data.height as number)          || undefined,
    bytes:        (data.bytes as number)           || 0,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ── Single file upload ───────────────────────────────────────────────────
  const upload = useCallback(
    async (
      file: File,
      folder: CloudinaryFolder = 'products',
    ): Promise<CloudinaryUploadResult | null> => {
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Validate file type client-side before sending
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/webp',
          'image/gif', 'image/svg+xml',
          'video/mp4', 'video/quicktime', 'video/webm',
        ];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File type "${file.type}" is not allowed`);
        }

        // Validate file size (10MB for images, 100MB for videos)
        const isVideo  = file.type.startsWith('video/');
        const maxBytes = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxBytes) {
          const maxMB = maxBytes / 1024 / 1024;
          throw new Error(`File is too large. Max size: ${maxMB}MB`);
        }

        const formData = new FormData();
        formData.append('file', file);

        setProgress(30); // optimistic progress

        const res = await apiFetch(
          `/api/v1/uploads/image?folder=${encodeURIComponent(folder)}`,
          { method: 'POST', body: formData },
        );

        setProgress(80);

        if (!res.ok) {
          let msg = 'Upload failed';
          try {
            const errBody = await res.json() as Record<string, unknown>;
            msg = (errBody.message as string) || msg;
          } catch { /* ignore */ }
          throw new Error(msg);
        }

        const body = await res.json();
        const result = parseUploadResponse(body);

        if (!result) throw new Error('Invalid response from upload server');

        setProgress(100);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        return null;
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 600);
      }
    },
    [],
  );

  // ── Multiple files upload ────────────────────────────────────────────────
  const uploadMultiple = useCallback(
    async (
      files: File[],
      folder: CloudinaryFolder = 'products',
    ): Promise<CloudinaryUploadResult[]> => {
      if (!files.length) return [];
      if (files.length > 10) {
        setError('Maximum 10 files allowed at once');
        return [];
      }

      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));

        const res = await apiFetch(
          `/api/v1/uploads/multiple?folder=${encodeURIComponent(folder)}`,
          { method: 'POST', body: formData },
        );

        setProgress(80);

        if (!res.ok) {
          let msg = 'Upload failed';
          try {
            const errBody = await res.json() as Record<string, unknown>;
            msg = (errBody.message as string) || msg;
          } catch { /* ignore */ }
          throw new Error(msg);
        }

        const body = await res.json() as unknown;
        const list: CloudinaryUploadResult[] = [];

        if (body && typeof body === 'object') {
          const b = body as Record<string, unknown>;
          const rawList = (Array.isArray(b.data) ? b.data : Array.isArray(body) ? body : []) as unknown[];
          for (const item of rawList) {
            const parsed = parseUploadResponse(item);
            if (parsed) list.push(parsed);
          }
        }

        setProgress(100);
        return list;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        return [];
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 600);
      }
    },
    [],
  );

  // ── Delete file ──────────────────────────────────────────────────────────
  const deleteFile = useCallback(
    async (
      publicId: string,
      type: 'image' | 'video' | 'raw' = 'image',
    ): Promise<boolean> => {
      try {
        // Encode slashes in publicId for URL safety
        const encoded = encodeURIComponent(publicId);
        const res = await apiFetch(
          `/api/v1/uploads/${encoded}?type=${type}`,
          { method: 'DELETE' },
        );
        return res.ok;
      } catch {
        return false;
      }
    },
    [],
  );

  return { upload, uploadMultiple, deleteFile, uploading, progress, error, clearError };
}
