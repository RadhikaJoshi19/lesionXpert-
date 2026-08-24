import React, { useState } from 'react';
import { AnalysisCase } from '../types';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Printer, 
  Eye, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface ReportsViewProps {
  cases: AnalysisCase[];
  onViewReport: (reportCase: AnalysisCase) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ cases, onViewReport }) => {
  const [selectedType, setSelectedType] = useState<'All' | 'Clinical Diagnostic' | 'Educational Case'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = cases.filter(c => {
    const matchesSearch = c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.primaryFinding.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || c.reportType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            Documentation & Export Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-hanken">
            Clinical Diagnostic Reports
          </h1>
          <p className="text-sm text-slate-500">
            Access, review, and print finalized pathology documentation, Grad-CAM overlays, and triage referrals.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {(['All', 'Clinical Diagnostic', 'Educational Case'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedType === type
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-xs text-slate-900"
          />
        </div>
      </div>

      {/* Report Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-teal-300 transition-all p-6 space-y-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {c.reportType}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{c.date}</span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={c.imageUrl}
                  alt={c.patientName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-hanken">{c.patientName}</h3>
                  <div className="text-[11px] text-slate-500 font-mono">{c.caseNumber}</div>
                  <div className="text-[11px] text-teal-700 font-medium">{c.clinicalSite}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Diagnostic Finding</div>
                <div className="font-bold text-slate-900">{c.primaryFinding}</div>
                <div className="flex items-center justify-between text-[11px] text-teal-800 font-semibold pt-1">
                  <span>Confidence: {c.confidence}%</span>
                  <span className="text-slate-500">{c.status}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onViewReport(c)}
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open Full Clinical PDF Document</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
