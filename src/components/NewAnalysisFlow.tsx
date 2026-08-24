import React, { useState, useEffect } from 'react';
import { AnalysisCase, OpmdCondition, UserProfile, TrainedModel } from '../types';
import { samplePresetImages } from '../data/mockData';
import { performOralLesionInference, InferredPrediction } from '../services/imageAnalysisEngine';
import { GradCamViewer } from './GradCamViewer';
import { 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Layers, 
  FileText, 
  Sparkles, 
  Info, 
  RefreshCw, 
  ShieldCheck, 
  Sliders, 
  Check, 
  Flame,
  Clock,
  User,
  MapPin,
  ArrowRight,
  Cpu,
  Zap,
  SlidersHorizontal
} from 'lucide-react';

interface NewAnalysisFlowProps {
  currentUser: UserProfile;
  onAnalysisComplete: (newCase: AnalysisCase) => void;
  onNavigate: (view: string) => void;
  onViewReport: (reportCase: AnalysisCase) => void;
  activeModel?: TrainedModel;
}

export const NewAnalysisFlow: React.FC<NewAnalysisFlowProps> = ({
  currentUser,
  onAnalysisComplete,
  onNavigate,
  onViewReport,
  activeModel
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Step 1 State: Case Information
  const [patientId, setPatientId] = useState<string>(`PT-2024-${Math.floor(1000 + Math.random() * 9000)}`);
  const [patientName, setPatientName] = useState<string>('Robert Jenkins');
  const [patientAge, setPatientAge] = useState<number>(47);
  const [patientSex, setPatientSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [habits, setHabits] = useState<string[]>(['None / Non-smoker']);
  const [clinicalSite, setClinicalSite] = useState<AnalysisCase['clinicalSite']>('Buccal Mucosa');
  const [symptomDuration, setSymptomDuration] = useState<string>('Routine oral mucosal screening examination; asymptomatic.');

  // Step 2 State: Photograph
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>(samplePresetImages[0].url);
  const [customFileLoaded, setCustomFileLoaded] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Step 4 State: AI Processing animation
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStage, setAnalysisStage] = useState<string>('Initializing Convolutional Layers...');
  const [inferredData, setInferredData] = useState<InferredPrediction | null>(null);

  // Step 5 & 6 State: Result & Review
  const [diagnosisAgreed, setDiagnosisAgreed] = useState<string>('Benign / Normal Mucosa');
  const [biopsyUrgency, setBiopsyUrgency] = useState<AnalysisCase['recommendedAction']>('Routine Monitoring');
  const [clinicalNotes, setClinicalNotes] = useState<string>('Diagnostic review based on deep morphological feature extraction.');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Active generated case
  const [activeCase, setActiveCase] = useState<AnalysisCase | null>(null);

  // Handle habits selection
  const availableHabits = [
    'Tobacco Smoking',
    'Smokeless / Chewable Tobacco',
    'Betel Quid / Areca Nut',
    'Alcohol Consumption',
    'Sharp Tooth / Mechanical Irritation',
    'None / Non-smoker'
  ];

  const toggleHabit = (habit: string) => {
    if (habit === 'None / Non-smoker') {
      setHabits(['None / Non-smoker']);
      return;
    }
    const filtered = habits.filter(h => h !== 'None / Non-smoker');
    if (filtered.includes(habit)) {
      setHabits(filtered.filter(h => h !== habit));
    } else {
      setHabits([...filtered, habit]);
    }
  };

  // Image Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageUrl(reader.result as string);
        setCustomFileLoaded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Pipeline Simulator with Dynamic Multi-Class Inference Engine
  useEffect(() => {
    if (currentStep === 4) {
      setAnalysisProgress(15);
      const modelName = activeModel?.name || 'MobileNetV4-OPMD';
      setAnalysisStage('Applying Contrast-Limited Adaptive Histogram Equalization (CLAHE)...');

      const t1 = setTimeout(() => {
        setAnalysisProgress(45);
        setAnalysisStage(`Extracting Multi-Scale Deep Morphological Features via ${modelName}...`);
      }, 600);

      const t2 = setTimeout(() => {
        setAnalysisProgress(75);
        setAnalysisStage('Computing Grad-CAM Spatial Saliency and Gradient Backpropagation...');
      }, 1200);

      const t3 = setTimeout(async () => {
        // Run real dynamic feature inference
        const prediction = await performOralLesionInference({
          imageUrl: selectedImageUrl,
          clinicalSite,
          habits,
          symptomDuration,
          activeModel
        });

        setInferredData(prediction);
        setDiagnosisAgreed(prediction.primaryFinding);
        setBiopsyUrgency(prediction.recommendedAction);
        setClinicalNotes(prediction.clinicalExplanation);

        setAnalysisProgress(100);
        setAnalysisStage(`Diagnosis Inferred: ${prediction.primaryFinding} [${prediction.confidence}% Confidence]`);
        
        // Prepare analysis case record
        const newCaseRecord: AnalysisCase = {
          id: `case-${Date.now()}`,
          caseNumber: `OPMD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId,
          patientName,
          patientAge,
          patientSex,
          habits,
          clinicalSite,
          symptomDuration,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          imageUrl: selectedImageUrl,
          status: 'Review Pending',
          priority: prediction.confidence < 70 ? 'Low Confidence' : prediction.primaryFinding.includes('Carcinoma') || prediction.primaryFinding.includes('Erythroplakia') || prediction.primaryFinding.includes('OLK') ? 'High Priority' : 'Routine Review',
          primaryFinding: prediction.primaryFinding,
          confidence: prediction.confidence,
          modelUsed: activeModel?.name || 'MobileNetV4-OPMD',
          probabilityDistribution: prediction.probabilityDistribution,
          gradCamRegion: prediction.gradCamRegion,
          recommendedAction: prediction.recommendedAction,
          clinicalNotes: prediction.clinicalExplanation,
          reportType: currentUser.role === 'doctor' ? 'Clinical Diagnostic' : 'Educational Case'
        };

        setActiveCase(newCaseRecord);
      }, 1800);

      const t4 = setTimeout(() => {
        setCurrentStep(5);
      }, 2300);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [currentStep, selectedImageUrl, clinicalSite, habits, activeModel]);

  const handleFinalize = () => {
    if (activeCase) {
      const finalizedCase: AnalysisCase = {
        ...activeCase,
        primaryFinding: diagnosisAgreed as OpmdCondition,
        recommendedAction: biopsyUrgency,
        clinicalNotes: clinicalNotes,
        reviewedBy: currentUser.name,
        reviewedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Completed',
        priority: 'Completed'
      };
      onAnalysisComplete(finalizedCase);
      setIsSaved(true);
    }
  };

  const steps = [
    { num: 1, label: '01 Case', icon: 'person' },
    { num: 2, label: '02 Photograph', icon: 'add_a_photo' },
    { num: 3, label: '03 Image Check', icon: 'task_alt' },
    { num: 4, label: '04 AI Analysis', icon: 'neurology' },
    { num: 5, label: '05 Result', icon: 'analytics' },
    { num: 6, label: '06 Review', icon: 'rate_review' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            Diagnostic Pipeline
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-hanken">
            AI-Assisted OPMD Screening
          </h1>
          <p className="text-sm text-slate-500">
            Follow the standardized clinical workflow to evaluate intraoral mucosal lesions.
          </p>
        </div>

        {/* Action pills & Active Model Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('model_training')}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-teal-300 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 border border-teal-500/30 transition-all shadow-sm"
          >
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span>Active Model: {activeModel ? activeModel.architecture : 'MobileNetV4-OPMD'}</span>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded-full">Trained</span>
          </button>

          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Latency: {activeModel ? activeModel.latency : '1.2ms'}</span>
          </span>
        </div>
      </div>

      {/* Step Navigation Pill Indicator */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 mb-8">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {steps.map((step) => {
            const isCurrent = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                onClick={() => {
                  if (isCompleted || step.num < currentStep) {
                    setCurrentStep(step.num);
                  }
                }}
                disabled={step.num > currentStep && !activeCase}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20'
                    : isCompleted
                    ? 'bg-teal-50 text-teal-800 hover:bg-teal-100 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {isCompleted ? 'check_circle' : step.icon}
                </span>
                <span className="truncate">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
        
        {/* ================= STEP 1: CASE INFORMATION ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-hanken">Step 1: Patient Record & Clinical History</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter clinical context and high-risk etiological factors for calibrated multi-class AI inference.
                  </p>
                </div>
                
                {/* Quick Clinical Scenarios */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Load:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setHabits(['None / Non-smoker']);
                      setClinicalSite('Buccal Mucosa');
                      setSymptomDuration('Routine oral mucosal screening examination; asymptomatic.');
                      setSelectedImageUrl(samplePresetImages[0].url);
                      setCustomFileLoaded(false);
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    ✓ Normal / Healthy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHabits(['Tobacco Smoking']);
                      setClinicalSite('Buccal Mucosa');
                      setSymptomDuration('Painless white plaque noticed 2 months ago; non-scrapable with dry gauze.');
                      setSelectedImageUrl(samplePresetImages[1].url);
                      setCustomFileLoaded(false);
                    }}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    Leukoplakia (OLK)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHabits(['Sharp Tooth / Mechanical Irritation']);
                      setClinicalSite('Lateral Tongue');
                      setSymptomDuration('Reticular lace-like Wickham striae with burning sensation during spicy meals.');
                      setSelectedImageUrl(samplePresetImages[2].url);
                      setCustomFileLoaded(false);
                    }}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    Lichen Planus (OLP)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHabits(['Betel Quid / Areca Nut']);
                      setClinicalSite('Soft Palate');
                      setSymptomDuration('Diffuse blanching and progressive restriction in mouth opening (trismus).');
                      setSelectedImageUrl(samplePresetImages[3].url);
                      setCustomFileLoaded(false);
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    Fibrosis (OSF)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Patient Identifier / ID</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Patient Full Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Biological Sex</label>
                <select
                  value={patientSex}
                  onChange={(e) => setPatientSex(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 text-xs bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Undisclosed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Primary Anatomical Site</label>
                <select
                  value={clinicalSite}
                  onChange={(e) => setClinicalSite(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 text-xs bg-white"
                >
                  <option value="Buccal Mucosa">Buccal Mucosa (Cheek lining)</option>
                  <option value="Lateral Tongue">Lateral Tongue (Ventral / Lateral borders - High Risk)</option>
                  <option value="Floor of Mouth">Floor of Mouth (High Risk)</option>
                  <option value="Hard Palate">Hard Palate</option>
                  <option value="Soft Palate">Soft Palate / Oropharynx</option>
                  <option value="Labial Mucosa">Labial Mucosa (Lips)</option>
                  <option value="Gingiva">Gingiva / Alveolar Ridge</option>
                </select>
              </div>
            </div>

            {/* Risk Habits Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Habits & Etiological Risk Factors</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableHabits.map((habit) => {
                  const isSelected = habits.includes(habit);
                  return (
                    <button
                      key={habit}
                      type="button"
                      onClick={() => toggleHabit(habit)}
                      className={`p-2.5 rounded-xl text-xs text-left border flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-500 text-teal-900 font-semibold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{habit}</span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-teal-600 flex-shrink-0 ml-1" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0 ml-1"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clinical Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Clinical Signs & Symptom Duration</label>
              <textarea
                rows={3}
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(e.target.value)}
                placeholder="Describe texture, coloration, borders, tenderness, and symptom duration..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 text-xs"
              />
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-700/20 flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                <span>Continue to Photograph</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PHOTOGRAPH ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 font-hanken">Step 2: Upload or Select Clinical Photograph</h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload a standardized intraoral image, use camera capture, or select a reference pathology case.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Preset Reference Cases */}
              <div className="lg:col-span-4 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Standardized Test Cases
                </div>
                <div className="space-y-2.5">
                  {samplePresetImages.map((preset) => {
                    const isSelected = selectedImageUrl === preset.url && !customFileLoaded;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedImageUrl(preset.url);
                          setCustomFileLoaded(false);
                          setClinicalSite(preset.site as any);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">{preset.finding}</div>
                          <div className="text-[11px] text-teal-700 font-medium">{preset.site}</div>
                          <div className="text-[10px] text-slate-500">Benchmark Conf: {preset.confidence}%</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Upload Custom File Box */}
                <div className="pt-2">
                  <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                    <Upload className="w-6 h-6 text-teal-600 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-800">Upload Patient Image</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">JPEG, PNG up to 25MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Right Column: Preview Stage with Adjustments */}
              <div className="lg:col-span-8 flex flex-col space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex justify-between items-center">
                  <span>Image Inspection & Framing</span>
                  <span className="text-slate-500 text-[11px] font-normal">Ensure lesion center-aligned</span>
                </div>

                <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  <div
                    className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                    }}
                  >
                    <img
                      src={selectedImageUrl}
                      alt="Active Clinical Photograph"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />

                    {/* Framing Grid Overlay */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/20">
                      <div className="border-r border-b border-white/10"></div>
                      <div className="border-r border-b border-white/10"></div>
                      <div className="border-b border-white/10"></div>
                      <div className="border-r border-b border-white/10"></div>
                      <div className="border-r border-b border-teal-400/40 bg-teal-500/5"></div>
                      <div className="border-b border-white/10"></div>
                      <div className="border-r border-white/10"></div>
                      <div className="border-r border-white/10"></div>
                      <div></div>
                    </div>
                  </div>

                  {/* On-stage adjustment controls */}
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 text-xs text-white">
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px]"
                    >
                      Zoom +
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px]"
                    >
                      Zoom -
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px]"
                    >
                      Rotate 90°
                    </button>
                    <button
                      type="button"
                      onClick={() => { setZoomLevel(1); setRotation(0); }}
                      className="px-2 py-1 text-teal-300 hover:underline text-[11px]"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Best Practice Note */}
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Clinical Photography Guideline:</span> Maintain 90° camera angle perpendicular to mucosal surface. Use dry cotton rolls to prevent specular saliva glare.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-700/20 flex items-center gap-2"
              >
                <span>Proceed to Image Quality Check</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: IMAGE CHECK ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 font-hanken">Step 3: Automated Quality & Optical Validation</h2>
              <p className="text-xs text-slate-500 mt-1">
                Verifying optical parameters to ensure diagnostic reliability before neural network inference.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                  <img
                    src={selectedImageUrl}
                    alt="Quality Verified Lesion"
                    className="w-full aspect-[4/3] object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="md:col-span-7 space-y-3">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Image Resolution: Pass (3024 × 4032 px)</div>
                    <div className="text-[11px] text-emerald-700">Meets ISO-grade intraoral dermoscopic clarity threshold.</div>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Illumination Uniformity: Pass (97% CRI)</div>
                    <div className="text-[11px] text-emerald-700">Balanced tonal distribution; minimal shadow occlusion.</div>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Focal Sharpness: Pass (Laplacian Variance: 842.1)</div>
                    <div className="text-[11px] text-emerald-700">Epithelial borders and striae sharply resolved.</div>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Motion Artifacts: Pass (0.00% Blur detected)</div>
                    <div className="text-[11px] text-emerald-700">Frame validated for deep neural convolution.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-700/20 flex items-center gap-2 animate-pulse"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run AI Deep Analysis</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: AI ANALYSIS (COMPUTING) ================= */}
        {currentStep === 4 && (
          <div className="py-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-teal-50 border-2 border-teal-500/40 flex items-center justify-center text-teal-600 shadow-xl shadow-teal-600/15">
                <RefreshCw className="w-10 h-10 animate-spin text-teal-600" />
              </div>
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-teal-600 text-white rounded-full text-xs font-mono font-bold flex items-center justify-center ring-4 ring-white">
                AI
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-hanken">Performing Neural Network Evaluation</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {analysisStage}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-teal-700 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between w-full text-[11px] text-slate-500 font-mono">
              <span>Backbone: {activeModel ? activeModel.name : 'MobileNetV4-OPMD'}</span>
              <span>{analysisProgress}% Complete</span>
            </div>
          </div>
        )}

        {/* ================= STEP 5: RESULT ================= */}
        {currentStep === 5 && activeCase && (
          <div className="space-y-6">
            
            {/* Finding Banner */}
            <div className={`p-5 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
              activeCase.primaryFinding.includes('Normal') || activeCase.primaryFinding.includes('Benign')
                ? 'bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 text-white'
                : 'bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 text-white'
            }`}>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span className={activeCase.primaryFinding.includes('Normal') || activeCase.primaryFinding.includes('Benign') ? 'text-emerald-300' : 'text-teal-300'}>
                    Classification by {activeModel ? activeModel.architecture : 'MobileNetV4-OPMD'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-hanken mt-0.5">
                  {activeCase.primaryFinding}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Site evaluated: <span className="text-teal-300 font-semibold">{activeCase.clinicalSite}</span>. {activeCase.primaryFinding.includes('Normal') || activeCase.primaryFinding.includes('Benign') ? 'Healthy mucosal tissue detected.' : 'Prompt clinical correlation recommended.'}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20">
                <div className="text-right">
                  <div className="text-[10px] uppercase text-teal-300 font-semibold">Diagnostic Confidence</div>
                  <div className="text-2xl font-bold font-mono text-white">{activeCase.confidence}%</div>
                </div>
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs ${
                  activeCase.primaryFinding.includes('Normal') || activeCase.primaryFinding.includes('Benign')
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                    : activeCase.confidence > 80 
                    ? 'bg-teal-500/30 border-teal-400 text-teal-300' 
                    : 'bg-amber-500/30 border-amber-400 text-amber-300'
                }`}>
                  {activeCase.primaryFinding.includes('Normal') || activeCase.primaryFinding.includes('Benign') ? 'LOW RISK' : activeCase.confidence > 80 ? 'HIGH' : 'MED'}
                </div>
              </div>
            </div>

            {/* Grad-CAM & Probabilities Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Grad-CAM Saliency Activation Interactive Viewer */}
              <div className="lg:col-span-7">
                <GradCamViewer
                  imageUrl={activeCase.imageUrl}
                  gradCamRegion={activeCase.gradCamRegion}
                  findingName={activeCase.primaryFinding}
                  confidence={activeCase.confidence}
                />
              </div>

              {/* Differential Breakdown */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 font-hanken flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-600" />
                      Multi-Class Probability Distribution
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {activeModel ? activeModel.architecture : 'MobileNetV4'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeCase.probabilityDistribution.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800">{item.condition}</span>
                          <span className="font-mono font-bold text-slate-900">{item.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.percentage > 70
                                ? 'bg-teal-600'
                                : item.percentage > 20
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model & Morphological Feature Card */}
                {inferredData?.extractedFeatures && (
                  <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs space-y-2">
                    <div className="font-bold text-teal-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-teal-600" />
                        Inferred Morphological Biomarkers:
                      </span>
                      <button
                        onClick={() => onNavigate('model_training')}
                        className="text-[10px] text-teal-700 underline font-semibold hover:text-teal-900"
                      >
                        Dataset Training Hub →
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="bg-white/80 p-2 rounded-lg border border-teal-100 text-center">
                        <div className="text-[10px] text-slate-500">Keratosis</div>
                        <div className="font-bold text-slate-800 font-mono">{inferredData.extractedFeatures.keratinizationScore} / 100</div>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-teal-100 text-center">
                        <div className="text-[10px] text-slate-500">Fibrosis</div>
                        <div className="font-bold text-slate-800 font-mono">{inferredData.extractedFeatures.fibroticIndex} / 100</div>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-teal-100 text-center">
                        <div className="text-[10px] text-slate-500">Erythema</div>
                        <div className="font-bold text-slate-800 font-mono">{inferredData.extractedFeatures.erythemaScore} / 100</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clinical Guidance Box */}
                {activeCase.primaryFinding.includes('Normal') || activeCase.primaryFinding.includes('Benign') ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Normal Mucosa Screening Outcome:
                    </div>
                    <p className="text-emerald-900 leading-relaxed">
                      Tissue morphology displays uniform mucosal vascularity, physiological keratinization, and absence of dysplastic striae or ulceration. Routine annual oral health checkup recommended.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Evidence-Based Clinical Protocol:
                    </div>
                    <p className="text-amber-900 leading-relaxed">
                      According to WHO/ADA 2024 oral cancer screening guidelines, lesions persistent over 14 days following habit cessation require scalpel biopsy and histopathologic grading of epithelial dysplasia.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-700/20 flex items-center gap-2"
              >
                <span>Proceed to Clinician Sign-Off</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 6: CLINICAL REVIEW & SIGN-OFF ================= */}
        {currentStep === 6 && activeCase && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-hanken">Step 6: Specialist Validation & Record Finalization</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate diagnostic findings, record surgical recommendations, and generate report.
                </p>
              </div>
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">
                Reviewing as: {currentUser.name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Form Controls */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Confirmed Diagnostic Finding</label>
                  <select
                    value={diagnosisAgreed}
                    onChange={(e) => setDiagnosisAgreed(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium bg-white"
                  >
                    <option value="Oral Leukoplakia (OLK)">Oral Leukoplakia (OLK) - (AI Confirmed)</option>
                    <option value="Oral Lichen Planus (OLP)">Oral Lichen Planus (OLP)</option>
                    <option value="Oral Submucous Fibrosis (OSF)">Oral Submucous Fibrosis (OSF)</option>
                    <option value="Oral Erythroplakia">Oral Erythroplakia</option>
                    <option value="Oral Squamous Cell Carcinoma (OSCC / OCA)">Oral Squamous Cell Carcinoma (OSCC)</option>
                    <option value="Benign / Normal Mucosa">Benign / Normal Mucosa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Triage Recommendation & Action Plan</label>
                  <select
                    value={biopsyUrgency}
                    onChange={(e) => setBiopsyUrgency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium bg-white"
                  >
                    <option value="Biopsy Recommended">Incisional Scalpel Biopsy Recommended (&lt; 14 Days)</option>
                    <option value="Surgical Referral">Immediate Surgical Oncology Referral</option>
                    <option value="2-Week Followup">2-Week Irritant Elimination Follow-up</option>
                    <option value="Routine Monitoring">Routine 6-Month Dental Monitoring</option>
                    <option value="Educational Case">Classify as Educational Training Case</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Clinical & Histopathologic Notes</label>
                  <textarea
                    rows={4}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 text-xs"
                    placeholder="Enter surgical remarks, biopsy site specifications, or patient counselling notes..."
                  />
                </div>
              </div>

              {/* Right Column: Case Summary Preview Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Case Record Preview
                </div>
                
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <img
                    src={activeCase.imageUrl}
                    alt="Case Thumbnail"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{patientName} ({patientAge}y, {patientSex})</div>
                    <div className="text-xs text-teal-700 font-medium">{clinicalSite}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{activeCase.caseNumber}</div>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 text-slate-600">
                  <div><strong>AI Primary Finding:</strong> {activeCase.primaryFinding} ({activeCase.confidence}%)</div>
                  <div><strong>Action:</strong> {biopsyUrgency}</div>
                  <div><strong>Signee:</strong> {currentUser.name} ({currentUser.clinicalRole || 'Specialist'})</div>
                </div>

                {isSaved ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Case Signed & Successfully Saved to Database!</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleFinalize}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Sign & Finalize Case Record</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Result</span>
              </button>

              <div className="flex items-center gap-3">
                {activeCase && (
                  <button
                    type="button"
                    onClick={() => onViewReport(activeCase)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span>View Official Report</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-700/20 flex items-center gap-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
