import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { NavigationRoute } from '../../types';
import { MedicalContradiction } from '../../types/medical';
import { getContradictions, ContradictionResponse } from '../../services/contradictionService';

interface ContradictionsCardProps {
  patientId?: string;
  onNavigate: (route: NavigationRoute) => void;
}

export function ContradictionsCard({
  patientId = '',
  onNavigate,
}: ContradictionsCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [unreviewedCount, setUnreviewedCount] = useState<number>(0);
  const [topContradiction, setTopContradiction] = useState<MedicalContradiction | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res: ContradictionResponse = await getContradictions(patientId);
      if (res.success) {
        setTotalCount(res.summary.totalCount);
        setUnreviewedCount(res.summary.unreviewedCount);
        setTopContradiction(res.contradictions[0] || null);
      }
    } catch (err) {
      console.error('Failed to load contradictions for dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  return (
    <div
      id="dashboard-contradictions-card"
      className={`rounded-2xl border p-5 sm:p-6 shadow-2xs transition-all ${
        totalCount > 0
          ? unreviewedCount > 0
            ? 'border-amber-200/90 bg-linear-to-r from-amber-50/40 via-white to-amber-50/20'
            : 'border-slate-200/90 bg-white'
          : 'border-slate-200/90 bg-white'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                totalCount > 0 && unreviewedCount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {totalCount > 0 && unreviewedCount > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Potential Inconsistencies
            </h3>

            {isLoading ? (
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-400">
                Checking records...
              </Badge>
            ) : totalCount > 0 ? (
              <Badge
                variant="outline"
                className={`text-xs font-semibold ${
                  unreviewedCount > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
              >
                {unreviewedCount > 0 ? `${unreviewedCount} Needs Review` : 'All Reviewed'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-300">
                ✓ Consistent
              </Badge>
            )}
          </div>

          {/* Body description */}
          {isLoading ? (
            <div className="h-4 bg-slate-200/60 rounded-md w-3/4 animate-pulse" />
          ) : totalCount > 0 ? (
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">
                  {totalCount === 1 ? '1 potential discrepancy' : `${totalCount} potential discrepancies`}
                </span>{' '}
                detected across documented encounters ({topContradiction?.category.toLowerCase()} documentation mismatch).
                Clinical review recommended to reconcile records.
              </p>
              {topContradiction && (
                <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 pt-0.5">
                  <span className="text-amber-800 font-bold">•</span>
                  <span className="truncate">{topContradiction.title}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              No conflicting records detected. Documented allergies, active medications, and diagnostic statuses are consistent across all encounters.
            </p>
          )}
        </div>

        {/* Action button */}
        <div className="shrink-0">
          <Button
            id="overview-review-contradictions-btn"
            variant={totalCount > 0 && unreviewedCount > 0 ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onNavigate('contradictions')}
            className="text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>{totalCount > 0 ? 'Review Inconsistencies' : 'View Inconsistency Tool'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
