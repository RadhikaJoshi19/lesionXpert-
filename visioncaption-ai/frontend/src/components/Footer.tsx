import React from 'react';
import { Eye, Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm sm:text-base text-white">
              VisionCaption AI
            </span>
            <p className="text-xs text-slate-400">
              Natural-Language Deep Learning Image Caption Generator
            </p>
          </div>
        </div>

        {/* Tech Stack Mention */}
        <div className="text-xs text-slate-400">
          Powered by{' '}
          <span className="text-slate-200 font-medium">Salesforce BLIP</span>,{' '}
          <span className="text-slate-200 font-medium">PyTorch</span>,{' '}
          <span className="text-slate-200 font-medium">FastAPI</span>, and{' '}
          <span className="text-slate-200 font-medium">React + TypeScript</span>
        </div>

        {/* Note */}
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Final Year Project • AI & Deep Learning</span>
        </div>
      </div>
    </footer>
  );
};
