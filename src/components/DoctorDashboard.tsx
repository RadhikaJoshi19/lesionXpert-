import React from 'react';
import { AnalysisCase, UserProfile } from '../types';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  PlusCircle, 
  FileText, 
  Search, 
  Filter, 
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';

interface DoctorDashboardProps {
  currentUser: UserProfile;
  cases: AnalysisCase[];
  onNavigate: (view: string) => void;
  onViewReport: (reportCase: AnalysisCase) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  currentUser,
  cases,
  onNavigate,
  onViewReport
}) => {
  const pendingCases = cases.filter(c => c.status === 'Review Pending' || c.status === 'Requires Review');
  const completedCases = cases.filter(c => c.status === 'Completed');
  const highPriorityCases = cases.filter(c => c.priority === 'High Priority');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
            Clinical Diagnostic Station
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-hanken">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            {currentUser.clinicalRole || 'Senior Oral Pathologist'} • {currentUser.institution}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('new_analysis')}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-lg shadow-teal-700/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-lg">add_a_photo</span>
            <span>New Patient Analysis</span>
          </button>

          <button
            onClick={() => onNavigate('model_training')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-lg text-teal-400">model_training</span>
            <span>MobileNet Training Hub</span>
          </button>
          
          <button
            onClick={() => onNavigate('clinical_reviews')}
            className="px-5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">fact_check</span>
            <span>Review Queue ({pendingCases.length})</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Cases Screened</span>
            <div className="text-3xl font-black text-slate-900 font-hanken">1,248</div>
            <div className="flex items-center text-xs text-emerald-600 font-semibold gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% from last month</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">science</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Clinical Sign-offs</span>
            <div className="text-3xl font-black text-amber-600 font-hanken">{pendingCases.length}</div>
            <div className="text-xs text-slate-500">
              {highPriorityCases.length} flagged as high priority
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Diagnostic Sensitivity</span>
            <div className="text-3xl font-black text-teal-700 font-hanken">98.4%</div>
            <div className="text-xs text-teal-700 font-medium">
              Verified against WHO gold standard
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
        </div>

      </div>

      {/* Main Section: Recent Cases Table & Quick Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Cases (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-hanken">Recent Diagnostic Cases</h2>
              <p className="text-xs text-slate-500">Live feed of patient evaluations and AI triage classifications</p>
            </div>
            <button
              onClick={() => onNavigate('case_history')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <span>View All Records</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Patient / Case ID</th>
                  <th className="px-4 py-3.5">Anatomical Site</th>
                  <th className="px-4 py-3.5">AI Primary Finding</th>
                  <th className="px-4 py-3.5">Confidence</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.imageUrl}
                          alt="Thumbnail"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{c.patientName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.caseNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">
                      {c.clinicalSite}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-slate-900 block">{c.primaryFinding}</span>
                      <span className="text-[10px] text-slate-500">{c.symptomDuration.slice(0, 24)}...</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-800">{c.confidence}%</span>
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-teal-600 h-full rounded-full" style={{ width: `${c.confidence}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.priority === 'High Priority'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewReport(c)}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <span>Report</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Quick Insights & Educational Highlights (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-hanken">Clinical Quick Actions</h3>
            
            <button
              onClick={() => onNavigate('new_analysis')}
              className="w-full p-3 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200/80 text-teal-900 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4 text-teal-600" />
                <span>Upload Single Image Case</span>
              </div>
              <ChevronRight className="w-4 h-4 text-teal-600" />
            </button>

            <button
              onClick={() => onNavigate('clinical_reviews')}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Review Pending Queue ({pendingCases.length})</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Download Batch Reports (PDF)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* OPMD Epidemiology Distribution Mini-Widget */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-teal-400 tracking-wider">Classification Breakdown</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Current Month</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Oral Leukoplakia (OLK)</span>
                  <span className="font-mono text-teal-400 font-bold">54%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: '54%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Oral Lichen Planus (OLP)</span>
                  <span className="font-mono text-teal-400 font-bold">28%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Submucous Fibrosis (OSF)</span>
                  <span className="font-mono text-amber-400 font-bold">14%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '14%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Oral Erythroplakia / OCA</span>
                  <span className="font-mono text-rose-400 font-bold">4%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '4%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              *Trained on 12,000+ histopathologically annotated intraoral images.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
