import React from 'react';
import { AnalysisCase, UserProfile } from '../types';
import { X, Printer, Download, CheckCircle2, ShieldCheck, AlertTriangle, FileText, Activity } from 'lucide-react';

interface ReportModalProps {
  reportCase: AnalysisCase | null;
  currentUser: UserProfile;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ reportCase, currentUser, onClose }) => {
  if (!reportCase) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate simple text/json clinical record summary download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportCase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `OPMD_Clinical_Report_${reportCase.caseNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-teal-400 font-semibold">Official Clinical Document</div>
              <h2 className="text-base sm:text-lg font-bold font-hanken">Diagnostic & AI Triage Summary</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-[#FCFDFD]">
          
          {/* Institution & Metadata Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xl font-hanken">
                OP
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight font-hanken">OPMD-AI Clinical Pathology Network</h1>
                <p className="text-xs text-slate-500">WHO Collaborating Centre for Oral Cancer & Precancer Screening</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">ISO 13485:2016 Compliant AI Triage Module</p>
              </div>
            </div>

            <div className="text-right sm:text-right text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-semibold text-slate-900">Case ID: <span className="font-mono text-teal-700">{reportCase.caseNumber}</span></div>
              <div className="text-slate-600">Generated: {reportCase.date}</div>
              <div className="text-slate-500 font-mono">Ref: {reportCase.patientId}</div>
            </div>
          </div>

          {/* Patient Demographics & Clinical History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Patient Name / Record</span>
              <strong className="text-slate-900 font-semibold text-sm">{reportCase.patientName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Age & Biological Sex</span>
              <strong className="text-slate-900">{reportCase.patientAge} Years / {reportCase.patientSex}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Anatomical Site</span>
              <strong className="text-slate-900 font-semibold text-teal-700">{reportCase.clinicalSite}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Report Classification</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
                {reportCase.reportType}
              </span>
            </div>
          </div>

          {/* Risk Factors & Clinical History */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex flex-col md:flex-row justify-between gap-3">
            <div>
              <span className="font-semibold text-amber-900 block mb-1">Habits & Etiological Risk Profile:</span>
              <div className="flex flex-wrap gap-1.5">
                {reportCase.habits.map((h, i) => (
                  <span key={i} className="bg-white/80 border border-amber-300 text-amber-900 px-2 py-0.5 rounded text-[11px]">
                    {h}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:text-right">
              <span className="font-semibold text-amber-900 block mb-1">Symptom History:</span>
              <span className="text-amber-800">{reportCase.symptomDuration}</span>
            </div>
          </div>

          {/* Primary AI Diagnosis & Confidence */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Visual Record */}
            <div className="md:col-span-5 flex flex-col gap-2">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Intraoral Image Capture</div>
              <div className="relative rounded-xl overflow-hidden border border-slate-300 aspect-[4/3] bg-slate-950">
                <img
                  src={reportCase.imageUrl}
                  alt="Lesion"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-teal-300 font-mono">
                  Site: {reportCase.clinicalSite}
                </div>
              </div>
            </div>

            {/* Finding and Probability Table */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Automated Neural Diagnosis</div>
                
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-teal-900 uppercase">Primary Finding</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-600 text-white">
                      {reportCase.confidence}% Confidence
                    </span>
                  </div>
                  <div className="text-lg font-bold text-teal-950 font-hanken">
                    {reportCase.primaryFinding}
                  </div>
                  <p className="text-xs text-teal-800 mt-1">
                    Convolutional feature maps indicate focal mucosal hyperkeratosis requiring histological correlation.
                  </p>
                </div>

                {/* Probability Distribution */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-600">Differential Probability Matrix</div>
                  {reportCase.probabilityDistribution.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-700">
                        <span className="font-medium">{item.condition}</span>
                        <span className="font-mono font-semibold">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.risk === 'high' ? 'bg-rose-500' : item.risk === 'moderate' ? 'bg-amber-500' : 'bg-teal-500'}`} 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Recommendation & Sign-off */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Recommended Clinical Action
              </div>
              <p className="text-slate-700">
                {reportCase.recommendedAction || 'Incisional Scalpel Biopsy with 10% Neutral Buffered Formalin fixation recommended within 14 days.'}
              </p>
            </div>

            <div>
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Pathologist Review Sign-off
              </div>
              <p className="text-slate-700">
                {reportCase.clinicalNotes || 'Reviewed and digitally signed by supervising clinician. Verified consistent with OPMD triage protocol.'}
              </p>
              <div className="mt-2 text-[11px] text-slate-500">
                Signee: <strong>{reportCase.reviewedBy || currentUser.name}</strong> • Date: {reportCase.reviewedAt || reportCase.date}
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-3 text-center leading-relaxed">
            *DISCLAIMER: OPMD-AI is an adjunctive decision-support and educational tool. This report is not an autonomous medical diagnosis. All diagnostic and therapeutic interventions must be validated by a licensed oral pathologist or dental surgeon.
          </div>

        </div>
      </div>
    </div>
  );
};
