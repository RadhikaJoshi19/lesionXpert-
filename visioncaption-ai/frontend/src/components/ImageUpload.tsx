import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, Sparkles, Loader2, FileCheck } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  onReset: () => void;
  onGenerate: () => void;
  isLoading: boolean;
  error: string | null;
  backendReady: boolean;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const LOADING_MESSAGES = [
  'Reading image & validating visual tensors...',
  'Preprocessing input for Vision Transformer (ViT)...',
  'Extracting rich multi-scale visual embeddings...',
  'Decoding tokens with BLIP natural-language decoder...',
  'Applying beam search to craft the best caption...',
];

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  selectedFile,
  previewUrl,
  onReset,
  onGenerate,
  isLoading,
  error,
  backendReady,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycle loading messages when generating caption
  useEffect(() => {
    if (!isLoading) {
      setLoadingMsgIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isLoading]);

  const validateAndHandleFile = (file: File) => {
    setLocalError(null);

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setLocalError('Unsupported format. Please upload a JPG, JPEG, or PNG image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller image.`);
      return;
    }

    onImageSelected(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const displayError = localError || error;

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-slate-950/60 transition-all">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white">
              {selectedFile ? 'Image Loaded' : 'Upload Image'}
            </h2>
          </div>

          {selectedFile && !isLoading && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded-md hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Upload Zone or Preview */}
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer group relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300 ${
              isDragging
                ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                : 'border-slate-700/70 hover:border-indigo-500/60 hover:bg-slate-800/40 bg-slate-950/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 transition-all duration-300">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <p className="text-base font-medium text-slate-200 group-hover:text-white transition-colors">
                  <span className="text-indigo-400 font-semibold underline underline-offset-2">Click to browse</span> or drag and drop your image here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPG, JPEG, and PNG (Up to {MAX_FILE_SIZE_MB}MB)
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Processed securely on server via PyTorch</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/70">
            {/* Image Preview Box */}
            <div className="relative flex items-center justify-center min-h-[260px] max-h-[440px] bg-slate-950 p-2">
              <img
                src={previewUrl}
                alt="Selected to caption"
                className="max-h-[400px] w-auto object-contain rounded-lg shadow-md"
              />

              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                  <div className="relative mb-4">
                    <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                    <Sparkles className="w-5 h-5 text-cyan-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">
                    Generating Natural-Language Caption
                  </h3>
                  <div className="px-4 py-2 rounded-lg bg-slate-900 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-medium animate-pulse">
                    {LOADING_MESSAGES[loadingMsgIndex]}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    BLIP Transformer is analyzing image features...
                  </p>
                </div>
              )}
            </div>

            {/* File info bar */}
            {selectedFile && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2 truncate max-w-[260px] sm:max-w-md">
                  <span className="font-medium text-slate-200 truncate">{selectedFile.name}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400 uppercase">
                  {selectedFile.type.replace('image/', '')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Notification Alert */}
        {displayError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5 text-xs sm:text-sm text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-rose-300">Error: </span>
              {displayError}
            </div>
            <button
              onClick={() => setLocalError(null)}
              className="text-rose-400 hover:text-rose-200 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Button */}
        {previewUrl && (
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onReset}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Choose Different Image
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={isLoading || !backendReady}
              className="relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Generate Caption</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
