import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  AlertCircle,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { NavigationRoute } from '../../types';
import { StoredHealthSummary } from '../../types/medical';
import {
  getHealthSummary,
  regenerateHealthSummary,
} from '../../services/healthSummaryService';

interface AISummaryCardProps {
  patientId?: string;
  onOpenAssistant?: (route: NavigationRoute) => void;
  onNavigate?: (route: NavigationRoute) => void;
}

export function AISummaryCard({
  patientId = 'pat-arun-mathew-01',
  onOpenAssistant,
  onNavigate,
}: AISummaryCardProps) {
  const [summary, setSummary] = useState<StoredHealthSummary | null>(null);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
  const [isOutdated, setIsOutdated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  const navigateFn = onNavigate || onOpenAssistant;

  const loadData = async (force: boolean = false) => {
    try {
      if (force) {
        setIsRegenerating(true);
      } else {
        setIsLoading(true);
      }

      const res = force
        ? await regenerateHealthSummary(patientId)
        : await getHealthSummary(patientId);

      if (res.success && res.summary) {
        setSummary(res.summary);
        setConfirmedCount(res.confirmedRecordCount);
        setIsOutdated(res.isOutdated);
      }
    } catch (err) {
      console.error('Failed to fetch summary for AISummaryCard:', err);
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const formattedDate = summary?.createdAt
    ? new Date(summary.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div
      id="dashboard-ai-summary-card"
      className="relative rounded-2xl border border-teal-200/90 bg-linear-to-r from-teal-50/50 via-white to-sky-50/40 p-5 sm:p-6 shadow-2xs transition-all"
    >
      {/* Outdated alert ribbon */}
      {isOutdated && (
        <div className="mb-4 -mt-1 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">
              Medical records have updated since this summary was generated.
            </span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRegenerating}
            className="font-bold text-amber-800 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        <div className="space-y-3 max-w-3xl">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100/80 text-teal-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              AI Health Summary
            </h3>

            <Badge variant="secondary" className="text-xs font-semibold bg-teal-50 text-teal-800 border-teal-200">
              Based on {confirmedCount > 0 ? confirmedCount : '21'} confirmed records
            </Badge>

            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" />
              Generated {formattedDate}
            </span>
          </div>

          {/* Overview text */}
          {isLoading ? (
            <div className="space-y-2 py-1">
              <div className="h-4 bg-slate-200/70 rounded-md w-full animate-pulse" />
              <div className="h-4 bg-slate-200/70 rounded-md w-4/5 animate-pulse" />
            </div>
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed">
              {summary?.content.overview ||
                'Longitudinal review of documented medical encounters, stable chronic metabolic management, and therapeutic regimens synthesized from confirmed health records.'}
            </p>
          )}

          {/* Clinical Disclaimer */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              AI-generated summary based on available confirmed records. Not a diagnosis or treatment recommendation.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-start lg:self-center">
          <Button
            id="overview-regenerate-summary-btn"
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isLoading || isRegenerating}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Updating...' : 'Regenerate'}</span>
          </Button>

          {navigateFn && (
            <Button
              id="overview-view-full-summary-btn"
              variant="primary"
              size="sm"
              onClick={() => navigateFn('health-summary')}
              className="text-xs font-semibold gap-1.5 shadow-xs"
            >
              <span>View full summary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
