import React from 'react';
import { AnalysisCase, StudyModule, UserProfile } from '../types';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  PlayCircle, 
  ArrowRight, 
  Sparkles, 
  Award, 
  Clock, 
  FileText, 
  ChevronRight,
  HelpCircle,
  TrendingUp,
  Brain
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: UserProfile;
  modules: StudyModule[];
  cases: AnalysisCase[];
  onNavigate: (view: string) => void;
  onOpenModule: (module: StudyModule) => void;
  onViewReport: (reportCase: AnalysisCase) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  modules,
  cases,
  onNavigate,
  onOpenModule,
  onViewReport
}) => {
  const completedCount = modules.filter(m => m.completed).length;
  const overallProgress = Math.round((modules.reduce((acc, m) => acc + m.progress, 0) / (modules.length * 100)) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Learning Pathway Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-teal-900/50">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-teal-400" />
            Educational Learning Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-hanken">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            {currentUser.program} • {currentUser.university} ({currentUser.yearOfStudy})
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-teal-300">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>You're making great progress in mastering OPMD diagnostic identification!</span>
          </div>
        </div>

        {/* Progress Radial Widget */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-teal-400 transition-all duration-1000"
                strokeDasharray={`${overallProgress}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono font-bold text-sm text-white">{overallProgress}%</span>
          </div>
          <div className="text-left">
            <div className="text-xs font-bold uppercase text-teal-300">Curriculum</div>
            <div className="text-sm font-semibold text-white">{completedCount} of {modules.length} Completed</div>
            <div className="text-[11px] text-slate-300">Curriculum Tier: Advanced</div>
          </div>
        </div>
      </div>

      {/* 3 Academic Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Self-Guided Modules</div>
            <div className="text-2xl font-black text-slate-900 font-hanken mt-0.5">{modules.length} Active</div>
            <div className="text-xs text-teal-700 font-medium mt-1">WHO 2024 Criteria Included</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Diagnostic Accuracy</div>
            <div className="text-2xl font-black text-slate-900 font-hanken mt-0.5">91.8%</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">+6.4% on Quiz 3</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Interactive Case Triage</div>
            <div className="text-2xl font-black text-slate-900 font-hanken mt-0.5">18 Scans</div>
            <div className="text-xs text-slate-500 mt-1">AI vs Pathologist comparison</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-hanken">Curriculum Learning Modules</h2>
            <p className="text-xs text-slate-500">Interactive clinical training with Grad-CAM heatmaps and histological correlation</p>
          </div>
          <button
            onClick={() => onNavigate('study_resources')}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <span>Open Study Center</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => onOpenModule(mod)}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {mod.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{mod.readTime}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 font-hanken group-hover:text-teal-700 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>

              {/* Progress & Action */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mod.completed ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">
                      {mod.progress}% Progress
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>{mod.completed ? 'Review' : 'Continue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Cases + Practice Triage CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Practice Triage Challenge */}
        <div className="lg:col-span-6 bg-gradient-to-br from-teal-900 to-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold font-hanken">Test Your Skills: Clinical Triage Sandbox</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upload any intraoral photograph or test standardized pre-malignant cases to compare your preliminary clinical judgment against deep learning Grad-CAM feature activations.
            </p>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onNavigate('new_analysis')}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>Launch Sandbox Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Case Quiz CTA */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-hanken">OPMD Board Examination Prep Quiz</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              5 standardized clinical vignette questions covering differential diagnosis of leukoplakia, erythroplakia, lichen planus, and high-risk anatomical transformation zones.
            </p>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onNavigate('study_resources')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2"
            >
              <span>Start Diagnostic Quiz</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
