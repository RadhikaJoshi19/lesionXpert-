import React, { useState } from 'react';
import { AnalysisCase, UserProfile } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Search, 
  ChevronRight, 
  ExternalLink, 
  FileCheck, 
  ShieldAlert, 
  SlidersHorizontal,
  X,
  ShieldCheck
} from 'lucide-react';
import { GradCamViewer } from './GradCamViewer';

interface ClinicalReviewsViewProps {
  currentUser: UserProfile;
  cases: AnalysisCase[];
  onSignOffCase: (updatedCase: AnalysisCase) => void;
  onViewReport: (reportCase: AnalysisCase) => void;
}

export const ClinicalReviewsView: React.FC<ClinicalReviewsViewProps> = ({
  currentUser,
  cases,
  onSignOffCase,
  onViewReport
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'High Priority' | 'Routine' | 'Low Confidence'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeReviewCase, setActiveReviewCase] = useState<AnalysisCase | null>(null);

  // Review Drawer state
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [validatedCondition, setValidatedCondition] = useState<string>('');
  const [recommendedAction, setRecommendedAction] = useState<AnalysisCase['recommendedAction']>('Biopsy Recommended');

  const pendingCases = cases.filter(c => c.status !== 'Completed');

  const filteredCases = pendingCases.filter(c => {
    const matchesSearch = c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.clinicalSite.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedFilter === 'High Priority') return c.priority === 'High Priority';
    if (selectedFilter === 'Routine') return c.priority === 'Routine Review';
    if (selectedFilter === 'Low Confidence') return c.priority === 'Low Confidence';
    return true;
  });

  const handleOpenReview = (c: AnalysisCase) => {
    setActiveReviewCase(c);
    setValidatedCondition(c.primaryFinding);
    setRecommendedAction(c.recommendedAction || 'Biopsy Recommended');
    setReviewNotes(c.clinicalNotes || `Clinical evaluation performed by ${currentUser.name}. Morphology consistent with ${c.primaryFinding}.`);
  };

  const handleSaveSignOff = () => {
    if (activeReviewCase) {
      const updated: AnalysisCase = {
        ...activeReviewCase,
        primaryFinding: validatedCondition as any,
        recommendedAction: recommendedAction,
        clinicalNotes: reviewNotes,
        reviewedBy: currentUser.name,
        reviewedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Completed',
        priority: 'Completed'
      };
      onSignOffCase(updated);
      setActiveReviewCase(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
            Supervisory Triage
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-hanken">
            Clinical Review Queue
          </h1>
          <p className="text-sm text-slate-500">
            Pending AI diagnoses requiring specialist validation and digital sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingCases.length} Pending Validations</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Filter Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {(['All', 'High Priority', 'Routine', 'Low Confidence'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, ID, or site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-xs text-slate-900"
          />
        </div>
      </div>

      {/* Case Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-teal-300 transition-all group"
          >
            <div>
              {/* Card Image Banner */}
              <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                <img
                  src={c.imageUrl}
                  alt={c.primaryFinding}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white font-mono border border-slate-700">
                  {c.caseNumber}
                </div>
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                  c.priority === 'High Priority'
                    ? 'bg-rose-600 text-white'
                    : c.priority === 'Routine Review'
                    ? 'bg-teal-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {c.priority}
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm font-hanken">{c.patientName}</h3>
                    <div className="text-slate-500">{c.patientAge}y • {c.patientSex} • <span className="text-teal-700 font-semibold">{c.clinicalSite}</span></div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-teal-800 text-sm">{c.confidence}%</span>
                    <div className="text-[10px] text-slate-400">AI Confidence</div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-500">AI Classification</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{c.primaryFinding}</div>
                  <div className="text-slate-500 text-[11px] mt-1 line-clamp-1">{c.symptomDuration}</div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
              <button
                onClick={() => onViewReport(c)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-white text-xs font-semibold transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => handleOpenReview(c)}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Begin Review</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-hanken">All Clinical Reviews Completed!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No pending cases require validation at this time. All submissions have been signed off.
          </p>
        </div>
      )}

      {/* Review Drawer / Modal */}
      {activeReviewCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-teal-400" />
                <div>
                  <h2 className="text-base font-bold font-hanken">Specialist Case Validation</h2>
                  <p className="text-xs text-slate-400 font-mono">{activeReviewCase.caseNumber} • {activeReviewCase.patientName}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveReviewCase(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Grad-CAM Viewer Mini */}
              <div className="max-w-md mx-auto">
                <GradCamViewer
                  imageUrl={activeReviewCase.imageUrl}
                  gradCamRegion={activeReviewCase.gradCamRegion}
                  findingName={activeReviewCase.primaryFinding}
                  confidence={activeReviewCase.confidence}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Confirmed Diagnostic Finding</label>
                  <select
                    value={validatedCondition}
                    onChange={(e) => setValidatedCondition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium bg-white"
                  >
                    <option value="Oral Leukoplakia (OLK)">Oral Leukoplakia (OLK)</option>
                    <option value="Oral Lichen Planus (OLP)">Oral Lichen Planus (OLP)</option>
                    <option value="Oral Submucous Fibrosis (OSF)">Oral Submucous Fibrosis (OSF)</option>
                    <option value="Oral Erythroplakia">Oral Erythroplakia</option>
                    <option value="Oral Squamous Cell Carcinoma (OSCC / OCA)">Oral Squamous Cell Carcinoma (OSCC)</option>
                    <option value="Benign / Normal Mucosa">Benign / Normal Mucosa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Triage Recommendation</label>
                  <select
                    value={recommendedAction}
                    onChange={(e) => setRecommendedAction(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium bg-white"
                  >
                    <option value="Biopsy Recommended">Incisional Scalpel Biopsy Recommended (&lt; 14 Days)</option>
                    <option value="Surgical Referral">Immediate Surgical Referral</option>
                    <option value="2-Week Followup">2-Week Irritant Elimination Follow-up</option>
                    <option value="Routine Monitoring">Routine 6-Month Dental Monitoring</option>
                    <option value="Educational Case">Classify as Educational Training Case</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Pathologist Sign-off Notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReviewCase(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSignOff}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate & Sign Case</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
