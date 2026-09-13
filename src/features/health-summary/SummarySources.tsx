import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Calendar,
  Building2,
  User,
  FileText,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ResolvedSourceEvent } from '../../services/healthSummaryService';
import { Badge } from '../../components/ui/Badge';
import { NavigationRoute } from '../../types';

interface SummarySourcesProps {
  sources: ResolvedSourceEvent[];
  onNavigate?: (route: NavigationRoute) => void;
  onOpenEventInTimeline?: (eventId: string) => void;
}

export function SummarySources({
  sources,
  onNavigate,
  onOpenEventInTimeline,
}: SummarySourcesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return sources;
    const q = searchQuery.toLowerCase();
    return sources.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.eventType.toLowerCase().includes(q) ||
        (s.facilityName && s.facilityName.toLowerCase().includes(q)) ||
        (s.providerName && s.providerName.toLowerCase().includes(q)) ||
        (s.documentFileName && s.documentFileName.toLowerCase().includes(q)) ||
        s.description.toLowerCase().includes(q)
    );
  }, [sources, searchQuery]);

  const displayedSources = isExpanded ? filteredSources : filteredSources.slice(0, 6);

  return (
    <div id="summary-sources-section" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Underlying Records & Sources</h3>
            <p className="text-xs text-slate-500">
              The {sources.length} confirmed database records that form the evidence base for this summary
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Clinical Event & Details</th>
                <th className="py-3 px-4">Provider / Facility</th>
                <th className="py-3 px-4">Source Document</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedSources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No confirmed records match your search filter.
                  </td>
                </tr>
              ) : (
                displayedSources.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600">
                      {new Date(evt.eventDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="secondary" className="text-[10px] font-semibold">
                        {evt.eventType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs mb-0.5">{evt.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {evt.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <div>{evt.facilityName || 'Medical Center'}</div>
                      <div className="text-[10px] text-slate-400">{evt.providerName}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {evt.documentFileName ? (
                        <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                          <FileText className="w-3 h-3 text-teal-500" />
                          <span className="truncate max-w-[120px]">{evt.documentFileName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenEventInTimeline) {
                            onOpenEventInTimeline(evt.id);
                          } else if (onNavigate) {
                            onNavigate('timeline');
                          }
                        }}
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold hover:underline cursor-pointer"
                      >
                        <span>Timeline</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* View all toggle */}
        {filteredSources.length > 6 && (
          <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              <span>
                {isExpanded
                  ? 'Show fewer sources'
                  : `Show all ${filteredSources.length} confirmed source records`}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
