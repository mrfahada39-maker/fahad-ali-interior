/**
 * Enterprise Image File and Magic Bytes Validator
 *
 * Requirements:
 * - Allow only image/jpeg, image/png, image/webp, image/avif
 * - Enforce maximum file size (5 MB)
 * - Verify magic bytes at the byte level to prevent disguised malicious file uploads
 */

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
  error?: string;
}

export function validateImageBuffer(buffer: Buffer, declaredType?: string): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file provided' };
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds maximum allowed limit of 5 MB.' };
  }

  // Optional check against declared MIME type if present
  if (declaredType) {
    const cleanType = declaredType.toLowerCase().trim();
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(cleanType)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and AVIF images are permitted.',
      };
    }
  }

  // 1. JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mimeType: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mimeType: 'image/png' };
  }

  // 3. WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { valid: true, mimeType: 'image/webp' };
  }

  // 4. AVIF: ....ftypavif or ftypavis or ftypmif1
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (brand === 'avif' || brand === 'avis' || brand === 'mif1') {
      return { valid: true, mimeType: 'image/avif' };
    }
  }

  return {
    valid: false,
    error: 'Invalid image format. Magic bytes do not match JPEG, PNG, WebP, or AVIF.',
  };
}
