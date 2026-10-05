import React, { useState } from 'react';
import { Copy, Check, Download, RefreshCw, PlusCircle, Clock, Cpu, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import { CaptionResponse } from '../types';

interface CaptionResultProps {
  previewUrl: string;
  result: CaptionResponse;
  fileName: string;
  onRegenerate: () => void;
  onNewImage: () => void;
  isLoading: boolean;
}

export const CaptionResult: React.FC<CaptionResultProps> = ({
  previewUrl,
  result,
  fileName,
  onRegenerate,
  onNewImage,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = result.caption;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const content = `VisionCaption AI - Image Caption Report
--------------------------------------------------
File: ${fileName}
Model: ${result.model}
Inference Time: ${result.inference_time}s
Generated At: ${new Date().toLocaleString()}

CAPTION:
"${result.caption}"
--------------------------------------------------
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `caption-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-8 animate-fade-in">
      <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-indigo-950/40 overflow-hidden">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Inference Complete
            </h3>
          </div>

          {/* Model info tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono text-[11px] truncate max-w-[200px] sm:max-w-none">
                {result.model}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-cyan-300 border border-slate-700/80 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>{result.inference_time}s</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Image Container */}
          <div className="md:col-span-5 flex items-center justify-center">
            <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 shadow-inner w-full max-h-[320px] flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Source"
                className="max-h-[300px] w-auto max-w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-102"
              />
            </div>
          </div>

          {/* Right: Caption & Actions */}
          <div className="md:col-span-7 flex flex-col justify-between h-full space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <MessageSquareQuote className="w-4 h-4" />
                <span>Generated Natural-Language Caption</span>
              </div>

              {/* Caption Card */}
              <div className="relative p-5 rounded-xl bg-gradient-to-br from-slate-950 to-indigo-950/30 border border-indigo-500/20 shadow-inner">
                <p className="text-lg sm:text-xl font-medium text-white leading-relaxed tracking-normal">
                  "{result.caption}"
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-medium border border-slate-700 transition-all hover:border-slate-600 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>Copy Caption</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-medium border border-slate-700 transition-all hover:border-slate-600 active:scale-95"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-300" />
                    <span>Download</span>
                  </>
                )}
              </button>

              <button
                onClick={onRegenerate}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs sm:text-sm font-medium border border-indigo-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>

              <button
                onClick={onNewImage}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95 ml-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Generate Another</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
