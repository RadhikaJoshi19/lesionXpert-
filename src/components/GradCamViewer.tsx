import React, { useState } from 'react';
import { Layers, Eye, ZoomIn, ZoomOut, RotateCw, Sliders, Info } from 'lucide-react';

interface GradCamViewerProps {
  imageUrl: string;
  gradCamRegion?: {
    x: number;
    y: number;
    radius: number;
    intensity: number;
  };
  findingName?: string;
  confidence?: number;
}

export const GradCamViewer: React.FC<GradCamViewerProps> = ({
  imageUrl,
  gradCamRegion = { x: 50, y: 50, radius: 28, intensity: 0.9 },
  findingName = 'Oral Leukoplakia (OLK)',
  confidence = 94.2
}) => {
  const [opacity, setOpacity] = useState<number>(75);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [colorMap, setColorMap] = useState<'jet' | 'inferno' | 'cyan'>('jet');
  const [activeTab, setActiveTab] = useState<'overlay' | 'split' | 'original'>('overlay');

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOpacity(75);
  };

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 text-white shadow-xl flex flex-col">
      {/* Top Toolbar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200 text-xs sm:text-sm tracking-wide flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-teal-400" />
            Grad-CAM Saliency Activation Map
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] bg-teal-900/60 text-teal-300 font-mono border border-teal-700/50">
            ResNet-50 v2 Layer 4
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => { setActiveTab('overlay'); setShowHeatmap(true); }}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${activeTab === 'overlay' ? 'bg-teal-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Overlay
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('original'); setShowHeatmap(false); }}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${activeTab === 'original' ? 'bg-teal-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Clinical RGB
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden select-none">
        <div 
          className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`
          }}
        >
          {/* Base Clinical Image */}
          <img
            src={imageUrl}
            alt="Oral Mucosal Lesion"
            className="w-full h-full object-contain pointer-events-none"
            referrerPolicy="no-referrer"
          />

          {/* Grad-CAM Heatmap Simulation Overlay */}
          {showHeatmap && activeTab !== 'original' && (
            <div 
              className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-150"
              style={{ opacity: opacity / 100 }}
            >
              {/* Radial Heatmap Gradient centered on the lesion focus */}
              <div 
                className="absolute w-full h-full"
                style={{
                  background: colorMap === 'jet'
                    ? `radial-gradient(circle ${gradCamRegion.radius}% at ${gradCamRegion.x}% ${gradCamRegion.y}%, rgba(239, 68, 68, 0.95) 0%, rgba(249, 115, 22, 0.85) 30%, rgba(234, 179, 8, 0.65) 55%, rgba(16, 185, 129, 0.35) 75%, rgba(6, 182, 212, 0.1) 90%, transparent 100%)`
                    : colorMap === 'inferno'
                    ? `radial-gradient(circle ${gradCamRegion.radius}% at ${gradCamRegion.x}% ${gradCamRegion.y}%, rgba(252, 211, 77, 0.95) 0%, rgba(239, 68, 68, 0.85) 35%, rgba(147, 51, 234, 0.6) 65%, rgba(59, 130, 246, 0.2) 85%, transparent 100%)`
                    : `radial-gradient(circle ${gradCamRegion.radius}% at ${gradCamRegion.x}% ${gradCamRegion.y}%, rgba(6, 182, 212, 0.95) 0%, rgba(14, 165, 233, 0.75) 40%, rgba(99, 102, 241, 0.4) 70%, transparent 100%)`
                }}
              />

              {/* Lesion Focus Bounding Ring */}
              <div 
                className="absolute rounded-full border-2 border-dashed border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse pointer-events-none"
                style={{
                  left: `${gradCamRegion.x - gradCamRegion.radius / 1.5}%`,
                  top: `${gradCamRegion.y - gradCamRegion.radius / 1.5}%`,
                  width: `${gradCamRegion.radius * 1.33}%`,
                  height: `${gradCamRegion.radius * 1.33}%`
                }}
              />

              {/* Annotation Tag */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-full bg-slate-900/90 text-white text-[11px] px-2.5 py-1 rounded-md border border-teal-400/60 shadow-lg pointer-events-none whitespace-nowrap flex items-center gap-1.5"
                style={{
                  left: `${gradCamRegion.x}%`,
                  top: `${gradCamRegion.y - gradCamRegion.radius / 1.5 - 2}%`
                }}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Peak Attention ({confidence}%)</span>
              </div>
            </div>
          )}
        </div>

        {/* Float Controls on Canvas */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-xs">
          <button 
            type="button"
            onClick={handleZoomIn} 
            title="Zoom In"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={handleZoomOut} 
            title="Zoom Out"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={handleRotate} 
            title="Rotate 90°"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <span className="text-slate-500">|</span>
          <button 
            type="button"
            onClick={handleReset} 
            className="text-[11px] text-slate-400 hover:text-teal-300 px-1 py-0.5"
          >
            Reset ({(zoom * 100).toFixed(0)}%)
          </button>
        </div>

        {/* Heatmap Legend */}
        <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md p-2 rounded-lg border border-slate-800 text-[10px] space-y-1">
          <div className="text-slate-400 font-medium">Activation Weight</div>
          <div className="w-24 h-2.5 rounded bg-gradient-to-r from-blue-600 via-yellow-400 to-red-600 border border-slate-700"></div>
          <div className="flex justify-between text-slate-400 text-[9px]">
            <span>Low (0.0)</span>
            <span>High (1.0)</span>
          </div>
        </div>
      </div>

      {/* Bottom Configuration Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Opacity Slider */}
        <div className="flex items-center gap-3 min-w-[200px] flex-1">
          <Sliders className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span className="text-slate-300 whitespace-nowrap">Heatmap Opacity:</span>
          <input
            type="range"
            min="10"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <span className="font-mono text-teal-300 min-w-[32px] text-right">{opacity}%</span>
        </div>

        {/* Color Spectrum Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Spectrum:</span>
          <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
            {(['jet', 'inferno', 'cyan'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setColorMap(m)}
                className={`px-2 py-0.5 rounded capitalize text-[11px] ${colorMap === m ? 'bg-teal-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
