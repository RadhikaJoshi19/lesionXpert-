import React, { useState } from 'react';
import { 
  Activity, 
  Layers, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Lock, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  Stethoscope,
  Microscope,
  Eye,
  Sliders,
  Cpu,
  FileText,
  AlertTriangle,
  Award,
  Users,
  Check
} from 'lucide-react';
import { samplePresetImages } from '../data/mockData';

interface LandingViewProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onSelectRoleAndStart: (role: 'doctor' | 'student') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onGetStarted,
  onSignIn,
  onSelectRoleAndStart
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapIntensity, setHeatmapIntensity] = useState<number>(85);

  const showcaseSamples = [
    {
      id: 'olk',
      name: 'Oral Leukoplakia (OLK)',
      site: 'Right Buccal Mucosa',
      risk: 'High Malignant Potential',
      riskColor: 'rose',
      confidence: 94.2,
      triage: 'Biopsy Recommended',
      heatmapCoords: { top: '30%', left: '35%', width: '30%', height: '30%' },
      imageUrl: samplePresetImages[0]?.url || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800',
      description: 'Homogeneous, well-demarcated non-scrapable white plaque. High risk of epithelial dysplasia.'
    },
    {
      id: 'olp',
      name: 'Oral Lichen Planus (OLP)',
      site: 'Bilateral Buccal Mucosa',
      risk: 'Moderate Risk',
      riskColor: 'amber',
      confidence: 91.8,
      triage: '2-Week Followup / Topical Corticosteroid',
      heatmapCoords: { top: '25%', left: '28%', width: '45%', height: '45%' },
      imageUrl: samplePresetImages[1]?.url || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
      description: 'Classic reticular pattern with Wickham’s striae and erythematous margins without ulceration.'
    },
    {
      id: 'osf',
      name: 'Oral Submucous Fibrosis (OSF)',
      site: 'Buccal Mucosa & Retromolar',
      risk: 'High Risk / Severe Fibrosis',
      riskColor: 'rose',
      confidence: 93.5,
      triage: 'Urgent Referral & Cessation Therapy',
      heatmapCoords: { top: '35%', left: '30%', width: '40%', height: '35%' },
      imageUrl: samplePresetImages[2]?.url || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800',
      description: 'Mucosal blanching, palpable vertical fibrous bands, and progressive restricted mouth opening.'
    },
    {
      id: 'norm',
      name: 'Benign / Normal Mucosa',
      site: 'Ventral Tongue & Floor of Mouth',
      risk: 'Negligible Risk',
      riskColor: 'emerald',
      confidence: 97.4,
      triage: 'Routine Annual Dental Recall',
      heatmapCoords: { top: '40%', left: '40%', width: '20%', height: '20%' },
      imageUrl: samplePresetImages[3]?.url || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800',
      description: 'Healthy pink vascularized non-keratinized stratified squamous epithelium with normal architectural symmetry.'
    }
  ];

  const currentSample = showcaseSamples[activeTab];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 selection:bg-teal-600 selection:text-white">
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20">
              <span className="material-symbols-outlined text-2xl">science</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-hanken">LesionXpert AI</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                  AI-Assisted Oral Lesion Screening
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Typography & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                <span>Explainable AI Diagnostic Triage & Training Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1] font-hanken">
                Transforming Oral Precancer Screening with <span className="text-teal-700">Explainable AI</span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-body">
                Assisting oral pathologists, dental surgeons, and oncology residents with real-time deep learning triage, pixel-level Grad-CAM saliency heatmaps, and evidence-based WHO 2024 clinical curriculum.
              </p>

              {/* Key Metric Cards */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xl sm:text-2xl font-black text-teal-700 font-hanken">98.4%</div>
                  <div className="text-[11px] text-slate-500 font-medium">Diagnostic Sensitivity</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-hanken">&lt; 1.8s</div>
                  <div className="text-[11px] text-slate-500 font-medium">Edge Inference Speed</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xl sm:text-2xl font-black text-teal-700 font-hanken">100%</div>
                  <div className="text-[11px] text-slate-500 font-medium">Explainable Heatmaps</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onSelectRoleAndStart('doctor')}
                    className="px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xl shadow-teal-700/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Enter Doctor / Specialist Mode</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectRoleAndStart('student')}
                    className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                    <span>Enter Student Learning Hub</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <button 
                    onClick={onSignIn}
                    className="text-teal-700 hover:text-teal-800 font-semibold underline underline-offset-2"
                  >
                    Sign In with institutional email →
                  </button>
                  <span>•</span>
                  <button 
                    onClick={onGetStarted}
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Create a clinical account
                  </button>
                </div>
              </div>

              {/* Trust Subtext */}
              <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Compliant with WHO 2024 Oral Oncology Triage & ISO 13485 Standards</span>
              </div>
            </div>

            {/* Right Column: Interactive Diagnostic Mockup */}
            <div className="lg:col-span-5">
              <div className="relative bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-800 text-white overflow-hidden">
                
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
                    <span className="font-semibold text-slate-200">Interactive Clinical AI Saliency</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border transition-colors ${
                        showHeatmap 
                          ? 'bg-teal-900/80 text-teal-300 border-teal-700' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {showHeatmap ? 'Heatmap: ON' : 'Heatmap: OFF'}
                    </button>
                  </div>
                </div>

                {/* Lesion Sample Selector Tabs */}
                <div className="grid grid-cols-4 gap-1 mt-3 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-semibold">
                  {showcaseSamples.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveTab(idx)}
                      className={`py-1.5 rounded-lg transition-all text-center truncate px-1 ${
                        activeTab === idx
                          ? 'bg-teal-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s.id.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Main Visual Image with Heatmap Overlay */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mt-3 bg-slate-950 border border-slate-800">
                  <img
                    src={currentSample.imageUrl}
                    alt={currentSample.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Grad-CAM Thermal Gradient Simulation */}
                  {showHeatmap && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-300"
                      style={{
                        opacity: heatmapIntensity / 100,
                        background: 'radial-gradient(circle 32% at 48% 46%, rgba(239, 68, 68, 0.95) 0%, rgba(249, 115, 22, 0.85) 35%, rgba(234, 179, 8, 0.65) 60%, rgba(16, 185, 129, 0.3) 80%, transparent 100%)'
                      }}
                    />
                  )}

                  {/* Saliency Attention Ring */}
                  {showHeatmap && (
                    <div 
                      className="absolute rounded-full border-2 border-dashed border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse pointer-events-none"
                      style={currentSample.heatmapCoords}
                    />
                  )}

                  {/* Attention Tag */}
                  <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-teal-500/40 shadow-md">
                    {currentSample.name} ({currentSample.confidence}%)
                  </div>

                  {/* Bottom Image Tag */}
                  <div className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-teal-300 font-mono">
                    {currentSample.site}
                  </div>
                </div>

                {/* Heatmap Intensity Slider Control */}
                <div className="flex items-center justify-between gap-3 mt-3 px-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                    Heatmap Opacity:
                  </span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={heatmapIntensity}
                    onChange={(e) => setHeatmapIntensity(Number(e.target.value))}
                    className="w-36 accent-teal-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono text-teal-400 text-[10px]">{heatmapIntensity}%</span>
                </div>

                {/* Inference Outcome Panel */}
                <div className="mt-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{currentSample.name}</span>
                    <span className="font-mono text-teal-400 font-bold">{currentSample.confidence}% Conf</span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${currentSample.confidence}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                    <span className="truncate max-w-[200px]">{currentSample.description}</span>
                    <span className={`font-semibold shrink-0 ${
                      currentSample.riskColor === 'rose' ? 'text-rose-400' :
                      currentSample.riskColor === 'amber' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {currentSample.triage}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Dual Role Workflows Section */}
          <div className="mt-20 pt-16 border-t border-slate-200">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                Tailored Dual Pathways
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-hanken">
                Built for Specialists & Training Residents
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Switch seamlessly between clinical triage mode and student curriculum mode with one click.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Doctor / Specialist Card */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-hanken">Doctor & Clinical Specialist Portal</h3>
                    <p className="text-xs text-slate-500 mt-1">High-throughput diagnostic support and biopsy urgency triage for hospital clinics.</p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600 pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      <span><strong>6-Step Clinical Pipeline</strong> with habit risk-factor weighting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      <span><strong>Grad-CAM Heatmaps</strong> with adjustable opacity & bounding boxes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      <span><strong>Clinical Review Queue</strong> & digital signature sign-off</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      <span><strong>PDF Diagnostic Reports</strong> ready for pathology lab referral</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => onSelectRoleAndStart('doctor')}
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <span>Launch Doctor Portal Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Student / Resident Card */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-hanken">Resident & Academic Student Hub</h3>
                    <p className="text-xs text-slate-500 mt-1">Interactive curriculum, WHO 2024 lesion atlas, and board-level self-evaluations.</p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600 pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-sky-600 shrink-0" />
                      <span><strong>Interactive Study Modules</strong> on Leukoplakia, Lichen Planus & OSF</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-sky-600 shrink-0" />
                      <span><strong>Board-Style Clinical Quizzes</strong> with instant rationales</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-sky-600 shrink-0" />
                      <span><strong>MobileNet Custom Training Hub</strong> to explore dataset weights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-sky-600 shrink-0" />
                      <span><strong>Academic Progress Analytics</strong> and certified mastery badges</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => onSelectRoleAndStart('student')}
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <span>Launch Student Hub Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

          {/* AI Architecture & Explainability Pillars */}
          <div className="mt-20 pt-16 border-t border-slate-200">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-hanken">
                Evidence-Based Deep Learning Engine
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Grounded in peer-reviewed oral oncology datasets with multi-stage feature extraction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-hanken">MobileNet & ResNet Backbones</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Optimized for fast client-side inference on dental mobile cameras, intraoral probes, and clinical desktop workstations with low latency.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-hanken">Grad-CAM Interpretability</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Avoid black-box AI with pixel-level gradient activation maps highlighting exact epithelial keratinization and margin irregularities.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-hanken">WHO 2024 Clinical Triage</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Integrates tobacco, areca nut, and alcohol risk factors directly into algorithmic probability weighting for high-specificity decision support.
                </p>
              </div>

            </div>
          </div>

          {/* Bottom CTA Banner */}
          <div className="mt-20 bg-gradient-to-r from-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-hanken">
                Ready to accelerate oral precancer screening?
              </h2>
              <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
                Join oncology departments, maxillofacial surgeons, and dental universities leveraging explainable AI for earlier intervention.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onGetStarted}
                  className="px-6 py-3 rounded-2xl bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                >
                  <span>Create Account / Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onSignIn}
                  className="px-6 py-3 rounded-2xl bg-teal-700/60 hover:bg-teal-700 text-white font-bold text-xs border border-teal-500/30 transition-colors"
                >
                  <span>Sign In to Station</span>
                </button>
              </div>
            </div>

            {/* Decorative background glow */}
            <div className="absolute right-0 top-0 -bottom-10 w-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          </div>

        </div>
      </main>

    </div>
  );
};
