import React, { useState } from 'react';
import {
  FileImage,
  Sliders,
  Cpu,
  Binary,
  BookOpen,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  Info,
  CheckCircle,
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const pipelineSteps = [
    {
      id: 1,
      title: 'Image Input',
      badge: 'Input',
      icon: FileImage,
      color: 'from-blue-500 to-cyan-500',
      shortDesc: 'Image uploaded in JPG, JPEG, or PNG format',
      fullDesc:
        'The user selects or drags-and-drops an image. The client validates the file size (under 10MB) and format before streaming it to the FastAPI backend over HTTP multipart/form-data.',
    },
    {
      id: 2,
      title: 'Preprocessing',
      badge: 'Validation',
      icon: Sliders,
      color: 'from-cyan-500 to-teal-500',
      shortDesc: 'Pillow validation & RGB normalization',
      fullDesc:
        'The backend validates file bytes in memory (avoiding temp disk leakage), verifies image integrity using Pillow, and standardizes color space into a 3-channel RGB matrix (converting alpha transparency or palette modes).',
    },
    {
      id: 3,
      title: 'Vision Encoder',
      badge: 'BLIP ViT',
      icon: Cpu,
      color: 'from-indigo-500 to-blue-500',
      shortDesc: 'Vision Transformer tokenizes image patches',
      fullDesc:
        'The BLIP Processor resizes the image to 384x384, normalizes pixels, and passes it into a Vision Transformer (ViT). The ViT splits the picture into 16x16 pixel patches and computes multi-head self-attention across spatial dimensions.',
    },
    {
      id: 4,
      title: 'Visual Features',
      badge: 'Latent Space',
      icon: Binary,
      color: 'from-purple-500 to-indigo-500',
      shortDesc: 'Dense visual embeddings representation',
      fullDesc:
        'The visual encoder produces continuous high-dimensional vector representations (hidden states). These compact tensors represent visual semantics like objects, textures, spatial relations, and backgrounds.',
    },
    {
      id: 5,
      title: 'Text Decoder',
      badge: 'Causal LM',
      icon: BookOpen,
      color: 'from-pink-500 to-purple-500',
      shortDesc: 'Autoregressive multi-modal decoder',
      fullDesc:
        'BLIP employs a multi-modal text decoder that uses cross-attention layers to align language vocabulary with visual embeddings. It predicts next token probabilities conditioned on both previously generated words and visual features.',
    },
    {
      id: 6,
      title: 'Generated Caption',
      badge: 'Output',
      icon: MessageSquare,
      color: 'from-amber-500 to-pink-500',
      shortDesc: 'Natural language description via Beam Search',
      fullDesc:
        'Using beam search (num_beams=4) with repetition penalty, the decoder outputs the highest probability sentence. The output tokens are decoded to a string, capitalized, and returned to the UI with inference timing.',
    },
  ];

  return (
    <section id="how-it-works" className="w-full max-w-6xl mx-auto px-4 py-16 scroll-mt-20">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-3">
          <Info className="w-3.5 h-3.5" />
          <span>Deep Learning Architecture</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          How VisionCaption AI Works
        </h2>
        <p className="text-sm sm:text-base text-slate-400 mt-3">
          An end-to-end vision-language pipeline powered by Salesforce BLIP (Bootstrapping Language-Image Pre-training)
        </p>
      </div>

      {/* Visual Pipeline Chain Diagram */}
      <div className="mb-12 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>Neural Pipeline Flow</span>
          <span className="text-slate-600 font-normal">| Click any stage to inspect</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative">
          {pipelineSteps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`flex flex-col items-center text-center p-3.5 rounded-xl border transition-all duration-200 relative ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/80 shadow-lg shadow-indigo-500/15 scale-102 ring-1 ring-indigo-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${step.color} p-[1px] mb-2 shadow-sm`}
                >
                  <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-0.5">
                  Stage 0{step.id}
                </div>
                <div className="text-xs font-bold text-white truncate max-w-full">
                  {step.title}
                </div>

                {idx < pipelineSteps.length - 1 && (
                  <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-600">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Detailed Breakdown Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${pipelineSteps[activeStep].color} p-[1.5px]`}
            >
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                {React.createElement(pipelineSteps[activeStep].icon, {
                  className: 'w-6 h-6 text-white',
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-indigo-400 tracking-wider">
                  Stage {activeStep + 1} of 6
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {pipelineSteps[activeStep].badge}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                {pipelineSteps[activeStep].title}
              </h3>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Architecture: Salesforce BLIP Base
          </div>
        </div>

        <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4">
              {pipelineSteps[activeStep].fullDesc}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Optimized with <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">torch.inference_mode()</code> without gradient backpropagation overhead</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300">
            <div className="text-slate-500 mb-2">// Pipeline Stage Summary</div>
            <div className="space-y-1.5">
              <div><span className="text-cyan-400">Step:</span> {pipelineSteps[activeStep].id}/6</div>
              <div><span className="text-purple-400">Role:</span> {pipelineSteps[activeStep].shortDesc}</div>
              <div><span className="text-emerald-400">Device:</span> GPU (CUDA) or CPU</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
