import React from 'react';
import { Eye, Cpu, Zap, Activity, Clock, ShieldCheck } from 'lucide-react';
import { HealthStatus } from '../types';

interface NavbarProps {
  health: HealthStatus;
  historyCount: number;
  onOpenHistory: () => void;
  onScrollToHowItWorks: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  historyCount,
  onOpenHistory,
  onScrollToHowItWorks,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Eye className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                VisionCaption <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                BLIP Vision
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions & Health Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onScrollToHowItWorks}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800/60"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Architecture</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800/60 border border-slate-800"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-semibold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Backend / Model Health Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              health.status === 'healthy'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                : health.status === 'degraded'
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
            }`}
            title={`Backend: ${health.status.toUpperCase()} | Device: ${health.device.toUpperCase()}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health.status === 'healthy'
                  ? 'bg-emerald-400 animate-pulse'
                  : health.status === 'degraded'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="hidden sm:inline">
              {health.status === 'healthy'
                ? `Online (${health.device.toUpperCase()})`
                : health.status === 'degraded'
                ? 'Degraded'
                : 'Backend Offline'}
            </span>
            <span className="sm:hidden uppercase">{health.device}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
