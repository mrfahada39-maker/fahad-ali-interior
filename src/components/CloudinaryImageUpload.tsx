'use client';

import { useRef, useState, useCallback } from 'react';
import { UploadCloud, X, Loader2, ImageIcon, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useCloudinaryUpload, CloudinaryFolder, CloudinaryUploadResult } from '@/hooks/useCloudinaryUpload';

interface CloudinaryImageUploadProps {
  /** Called when upload succeeds — receives the full Cloudinary result */
  onUpload?: (result: CloudinaryUploadResult) => void;
  /** Direct URL callback helper */
  onUploadSuccess?: (url: string) => void;
  /** Optional current image URL to preview */
  currentImage?: string;
  /** Cloudinary folder to upload into (default: 'products') */
  folder?: CloudinaryFolder;
  /** Optional label shown above the dropzone */
  label?: string;
  /** Accept attribute for the file input */
  accept?: string;
  /** Compact mode — smaller UI */
  compact?: boolean;
  /** Allow uploading multiple files */
  multiple?: boolean;
  /** Called when multiple files are uploaded */
  onUploadMultiple?: (results: CloudinaryUploadResult[]) => void;
  /** Disable the uploader */
  disabled?: boolean;
  /** Custom CSS classes for the container */
  className?: string;
}

export default function CloudinaryImageUpload({
  onUpload,
  onUploadSuccess,
  currentImage,
  folder = 'products',
  label,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  compact = false,
  multiple = false,
  onUploadMultiple,
  disabled = false,
  className = '',
}: CloudinaryImageUploadProps) {
  const { upload, uploadMultiple, uploading, progress, error, clearError } = useCloudinaryUpload();

  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<string | null>(currentImage || null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled || uploading) return;
      clearError();

      if (multiple && files.length > 1 && onUploadMultiple) {
        const results = await uploadMultiple(Array.from(files), folder);
        if (results.length > 0) {
          onUploadMultiple(results);
          setLastSuccess(results[0].secureUrl);
          onUploadSuccess?.(results[0].secureUrl);
        }
      } else {
        const result = await upload(files[0], folder);
        if (result) {
          setLastSuccess(result.secureUrl);
          onUpload?.(result);
          onUploadSuccess?.(result.secureUrl);
        }
      }
    },
    [upload, uploadMultiple, folder, multiple, onUpload, onUploadMultiple, onUploadSuccess, disabled, uploading, clearError]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleClick = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLastSuccess(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isDisabled = disabled || uploading;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 font-sans ${className}`}>
        {lastSuccess && (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#E7DDD0] shrink-0 shadow-2xs">
            <img src={lastSuccess} alt="Uploaded" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 bg-rose-600 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer shadow-xs"
            >
              <X size={9} className="text-white" />
            </button>
          </div>
        )}

        <label
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition-all shadow-2xs
            ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed border-[#E7DDD0] text-stone-400 bg-stone-100'
                : 'border-[#B88E4B]/40 bg-[#FAF5EE] text-[#8C6239] hover:bg-[#B88E4B] hover:text-white hover:border-[#B88E4B]'
            }
          `}
        >
          {uploading ? (
            <>
              <Loader2 size={13} className="animate-spin text-[#B88E4B]" />
              <span>Uploading {progress > 0 ? `${progress}%` : ''}...</span>
            </>
          ) : (
            <>
              <UploadCloud size={14} />
              <span>Upload Photo</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
            disabled={isDisabled}
          />
        </label>

        {error && (
          <span className="text-rose-600 text-xs font-bold flex items-center gap-1">
            <AlertCircle size={12} /> {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 font-sans ${className}`}>
      {label && (
        <p className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider">{label}</p>
      )}

      {/* Drag & Drop luxury zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative rounded-[20px] border-2 border-dashed transition-all duration-200 overflow-hidden group
          ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          ${
            isDragOver
              ? 'border-[#B88E4B] bg-[#FAF5EE] scale-[1.01] shadow-md'
              : lastSuccess
              ? 'border-emerald-400/80 bg-emerald-50/20 hover:border-emerald-500'
              : 'border-[#B88E4B]/45 bg-gradient-to-b from-[#FCFAF7] to-[#FAF5EE]/60 hover:border-[#B88E4B] hover:bg-[#FAF5EE]'
          }
        `}
      >
        {/* Uploading State */}
        {uploading ? (
          <div className="relative flex flex-col items-center justify-center py-7 px-4 text-center">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center mb-2.5 shadow-2xs">
              <Loader2 size={22} className="text-[#B88E4B] animate-spin" />
            </div>
            <p className="text-xs font-black text-[#1F1612] font-serif">Uploading to Cloudinary High-Res CDN...</p>
            <div className="mt-2.5 w-44 h-2 bg-[#E7DDD0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10.5px] font-mono font-bold text-[#8C6239] mt-1">{progress}% Synchronized</p>
          </div>
        ) : lastSuccess ? (
          /* Success State with Preview */
          <div className="relative flex items-center justify-between p-3.5 bg-[#FAF5EE]/80">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E7DDD0] shrink-0 shadow-2xs bg-white">
                <img src={lastSuccess} alt="Uploaded" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Image Uploaded Successfully
                </p>
                <p className="text-[10px] text-stone-500 font-bold mt-0.5">Click anywhere to replace photo</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-[#E7DDD0] transition-colors cursor-pointer"
              title="Remove image"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          /* Default Drag & Drop View with Clear High-Contrast Luxury Typography */
          <div className="relative flex flex-col items-center justify-center py-6 px-4 text-center">
            <div
              className={`
                w-11 h-11 rounded-2xl flex items-center justify-center mb-2.5 transition-all shadow-2xs
                ${isDragOver ? 'bg-[#B88E4B] text-white scale-110' : 'bg-[#FAF5EE] text-[#8C6239] border border-[#E2D1BC] group-hover:scale-105 group-hover:bg-[#B88E4B] group-hover:text-white'}
              `}
            >
              <UploadCloud size={20} className="stroke-[2.2]" />
            </div>

            <p className="text-xs font-black text-[#1F1612] font-serif tracking-tight">
              {isDragOver ? 'Drop file to upload instantly' : 'Drag & drop or click to upload image'}
            </p>

            <p className="text-[10.5px] font-bold text-[#7A6354] mt-1 flex items-center gap-1">
              <Sparkles size={10} className="text-[#B88E4B]" />
              <span>JPG, PNG, WebP, GIF • High-Res CDN up to 10MB</span>
            </p>
          </div>
        )}

        {/* Hidden Native Input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={isDisabled}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span className="font-semibold">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="ml-auto text-rose-500 hover:text-rose-800 transition-colors cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
