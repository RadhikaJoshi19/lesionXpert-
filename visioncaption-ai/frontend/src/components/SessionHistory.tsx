import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, Copy, Check, X, Image as ImageIcon, Sparkles } from 'lucide-react';

interface SessionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  isOpen,
  onClose,
  history,
  onDeleteItem,
  onClearHistory,
  onSelectHistoryItem,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (id: string, caption: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Recent Captions</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                title="Clear all stored items"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-300">No session history yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Generated image captions will appear here and persist in local storage.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectHistoryItem(item)}
                className="group relative p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-950 transition-all cursor-pointer shadow-sm"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center">
                    <img
                      src={item.thumbnail}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="truncate max-w-[120px] font-medium text-slate-300">
                        {item.fileName}
                      </span>
                      <span>{item.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-200 line-clamp-2 font-normal leading-relaxed group-hover:text-indigo-200 transition-colors">
                      "{item.caption}"
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                      <span>{item.inference_time}s</span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleCopy(item.id, item.caption, e)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Copy caption"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-center text-xs text-slate-400">
          Saved in browser LocalStorage
        </div>
      </div>
    </div>
  );
};
