import React from 'react';
import { ShieldCheck, Stethoscope } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-bold font-hanken">
            LX
          </div>
          <span className="font-bold text-slate-800 font-hanken">LesionXpert AI</span>
          <span>•</span>
          <span>AI-Assisted Oral Lesion Screening</span>
        </div>

        <div className="flex items-center gap-6 text-[11px]">
          <span className="flex items-center gap-1 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            ISO 13485:2016 Compliant
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="text-slate-500">Clinical Decision Support System</span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span>© {new Date().getFullYear()} LesionXpert AI Research Consortium</span>
        </div>

      </div>
    </footer>
  );
};
