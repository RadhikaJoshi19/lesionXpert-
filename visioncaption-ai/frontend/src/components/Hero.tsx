import React from 'react';
import { Sparkles, Brain, Cpu, Layers, Server, Code2 } from 'lucide-react';

export const Hero: React.FC = () => {
  const techBadges = [
    { name: 'Salesforce BLIP', icon: Brain, color: 'text-purple-400 border-purple-500/20 bg-purple-500/10' },
    { name: 'PyTorch 2.x', icon: Cpu, color: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
    { name: 'Hugging Face Transformers', icon: Layers, color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' },
    { name: 'FastAPI Backend', icon: Server, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
    { name: 'React + TypeScript', icon: Code2, color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10' },
  ];

  return (
    <div className="relative pt-8 pb-6 sm:pt-12 sm:pb-8 text-center max-w-4xl mx-auto px-4">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-inner mb-4">
        <Sparkles className="w-4 h-4 text-indigo-400 animate-spin-slow" />
        <span className="text-xs font-medium text-slate-300">
          Powered by Deep Learning Vision-Language Modeling
        </span>
      </div>

      {/* Main Title & Tagline */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
        Turn images into meaningful words with{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
          Deep Learning
        </span>
      </h1>

      <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
        Upload any photograph or graphic. Our backend runs a state-of-the-art{' '}
        <strong className="text-slate-200 font-medium">Salesforce BLIP</strong> neural network that encodes visual features and decodes natural-language descriptions in real time.
      </p>

      {/* Tech Stack Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {techBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.name}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-all hover:scale-105 ${badge.color}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{badge.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
