import React, { useState } from 'react';
import { AnalysisCase } from '../types';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  Download,
  Plus
} from 'lucide-react';

interface CaseHistoryViewProps {
  cases: AnalysisCase[];
  onViewReport: (reportCase: AnalysisCase) => void;
  onNewAnalysis: () => void;
}

export const CaseHistoryView: React.FC<CaseHistoryViewProps> = ({
  cases,
  onViewReport,
  onNewAnalysis
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const sites = ['All', 'Buccal Mucosa', 'Lateral Tongue', 'Floor of Mouth', 'Hard Palate'];

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.primaryFinding.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSite = selectedSite === 'All' || c.clinicalSite === selectedSite;
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    return matchesSearch && matchesSite && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            Patient Records & Tele-pathology Log
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-hanken">
            Diagnostic Case History
          </h1>
          <p className="text-sm text-slate-500">
            Searchable repository of all AI triaged intraoral lesion scans and histopathologic records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNewAnalysis}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-700/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, case ID, condition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white font-medium focus:ring-2 focus:ring-teal-500"
          >
            {sites.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All Anatomical Sites' : s}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 bg-white font-medium focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Review Pending">Review Pending</option>
            <option value="Requires Review">Requires Review</option>
          </select>
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Case Record & Patient</th>
                <th className="px-4 py-4">Site & Habits</th>
                <th className="px-4 py-4">Diagnosis & Confidence</th>
                <th className="px-4 py-4">Triage Action</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.imageUrl}
                        alt={c.patientName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{c.patientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{c.caseNumber}</div>
                        <div className="text-[10px] text-slate-400">{c.patientAge}y • {c.patientSex}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-semibold text-teal-800">{c.clinicalSite}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                      {c.habits.join(', ')}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">{c.primaryFinding}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-teal-600 h-full rounded-full" style={{ width: `${c.confidence}%` }}></div>
                      </div>
                      <span className="font-mono text-teal-800 font-bold text-[11px]">{c.confidence}%</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {c.recommendedAction || 'Biopsy Recommended'}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-600 font-mono text-[11px]">
                    {c.date}
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
                      className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
