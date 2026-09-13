import React from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StoredHealthSummary } from '../../types/medical';

interface SummaryOverviewProps {
  summary: StoredHealthSummary | null;
  confirmedRecordCount: number;
  isOutdated: boolean;
  isRegenerating: boolean;
  onRegenerate: () => void;
}

export function SummaryOverview({
  summary,
  confirmedRecordCount,
  isOutdated,
  isRegenerating,
  onRegenerate,
}: SummaryOverviewProps) {
  const formattedDate = summary?.createdAt
    ? new Date(summary.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return (
    <div
      id="summary-overview-card"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
    >
      {/* Outdated Notice Banner */}
      {isOutdated && (
        <div
          id="summary-outdated-alert"
          className="bg-amber-50 border-b border-amber-200/80 px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-full bg-amber-100 text-amber-700 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-amber-950">
                Your health history has changed since this summary was generated.
              </p>
              <p className="text-xs text-amber-700">
                New confirmed medical events or clinical data are available.
              </p>
            </div>
          </div>
          <Button
            id="regenerate-outdated-summary-btn"
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100/60 text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate summary'}
          </Button>
        </div>
      )}

      {/* Main Content Body */}
      <div className="p-6 sm:p-7">
        {/* Top metadata row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Based on {confirmedRecordCount} confirmed records</span>
            </div>

            {summary?.model && (
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {summary.model}
              </span>
            )}

            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Generated {formattedDate}
            </span>
          </div>

          {!isOutdated && (
            <Button
              id="regenerate-summary-btn"
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="text-xs text-slate-700 hover:text-slate-900 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          )}
        </div>

        {/* Overview text */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Longitudinal Clinical Journey
          </h2>
          <p
            id="summary-overview-paragraph"
            className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-4xl"
          >
            {summary?.content.overview ||
              'Analyzing confirmed clinical records to provide a longitudinal synthesis of diagnoses, therapies, and trajectory...'}
          </p>
        </div>

        {/* Record Observations if any */}
        {summary?.content.recordObservations && summary.content.recordObservations.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Documentation Observations</span>
            </div>
            {summary.content.recordObservations.map((obs, idx) => (
              <p key={idx} className="leading-relaxed text-slate-600">
                • {obs.summary}
              </p>
            ))}
          </div>
        )}

        {/* Subtle Disclaimer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p>
            AI-generated summary based on available confirmed records. It is not a medical diagnosis or treatment recommendation.
          </p>
        </div>
      </div>
    </div>
  );
}
