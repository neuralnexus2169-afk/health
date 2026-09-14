import React from 'react';
import {
  AlertTriangle,
  FileText,
  Calendar,
  Building2,
  ExternalLink,
  Check,
  RotateCcw,
  Eye,
  User,
} from 'lucide-react';
import { MedicalContradiction } from '../../types/medical';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface ContradictionCardProps {
  key?: React.Key;
  contradiction: MedicalContradiction;
  onSelect: (contradiction: MedicalContradiction) => void;
  onToggleReview: (contradiction: MedicalContradiction) => void;
  onOpenDocument?: (docId?: string) => void;
}

export function ContradictionCard({
  contradiction,
  onSelect,
  onToggleReview,
  onOpenDocument,
}: ContradictionCardProps) {
  const isReviewed = contradiction.reviewStatus === 'Reviewed';

  const formatDate = (d?: string) => {
    if (!d) return 'Date unknown';
    try {
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const docA = contradiction.firstDocument || {
    documentId: contradiction.sourceA.documentId,
    documentFileName: contradiction.sourceA.documentFileName,
    documentDate: contradiction.sourceA.documentDate,
    quote: contradiction.sourceA.quote,
    fact: contradiction.firstFact || 'Record 1 documentation',
    facilityName: contradiction.firstFacility || contradiction.sourceA.facilityName || 'Medical Facility',
    providerName: contradiction.firstProvider || contradiction.sourceA.providerName,
  };

  const docB = contradiction.secondDocument || {
    documentId: contradiction.sourceB.documentId,
    documentFileName: contradiction.sourceB.documentFileName,
    documentDate: contradiction.sourceB.documentDate,
    quote: contradiction.sourceB.quote,
    fact: contradiction.secondFact || 'Record 2 documentation',
    facilityName: contradiction.secondFacility || contradiction.sourceB.facilityName || 'Medical Facility',
    providerName: contradiction.secondProvider || contradiction.sourceB.providerName,
  };

  return (
    <div
      id={`contradiction-card-${contradiction.id}`}
      className={`rounded-2xl border transition-all duration-200 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-xs ${
        isReviewed
          ? 'border-slate-200/80 bg-slate-50/40'
          : 'border-amber-200/90 bg-linear-to-b from-amber-50/20 via-white to-white'
      }`}
    >
      <div className="space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs font-semibold flex items-center gap-1.5 ${
                contradiction.category === 'Allergy'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : contradiction.category === 'Medication'
                  ? 'bg-sky-50 text-sky-900 border-sky-300'
                  : 'bg-indigo-50 text-indigo-900 border-indigo-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{contradiction.category} Conflict</span>
            </Badge>

            <Badge
              variant="secondary"
              className={`text-xs font-medium ${
                contradiction.severity === 'High'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : contradiction.severity === 'Moderate'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {contradiction.severity} Priority
            </Badge>

            <Badge
              variant={isReviewed ? 'default' : 'outline'}
              className={`text-xs font-medium ${
                isReviewed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50/60 text-amber-800 border-amber-200'
              }`}
            >
              {isReviewed ? '✓ Reviewed' : 'Needs Review'}
            </Badge>
          </div>

          {contradiction.reviewedAt && (
            <span className="text-[11px] text-slate-400 font-medium">
              Reviewed {formatDate(contradiction.reviewedAt)}
            </span>
          )}
        </div>

        {/* Title and Description */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {contradiction.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {contradiction.description}
          </p>
        </div>

        {/* Side-by-Side Comparison Snippet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Record 1 Snippet */}
          <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Record 1
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                {docA.fact || 'Documentation'}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{formatDate(docA.documentDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{docA.facilityName || 'Healthcare Facility'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-mono text-[11px]">{docA.documentFileName}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 italic font-serif bg-white/70 p-2 rounded-md border border-slate-100 line-clamp-2">
              "{docA.quote}"
            </p>
          </div>

          {/* Record 2 Snippet */}
          <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Record 2
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                {docB.fact || 'Documentation'}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{formatDate(docB.documentDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{docB.facilityName || 'Healthcare Facility'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-mono text-[11px]">{docB.documentFileName}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 italic font-serif bg-white/70 p-2 rounded-md border border-slate-100 line-clamp-2">
              "{docB.quote}"
            </p>
          </div>
        </div>

        {/* Clinical Note if present */}
        {contradiction.reviewNotes && (
          <div className="text-xs p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900">
            <span className="font-bold mr-1">Review Note:</span>
            <span>{contradiction.reviewNotes}</span>
          </div>
        )}

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 italic">
            HealthTimeline presents conflicting documentation for review; records are not altered.
          </div>

          <div className="flex items-center gap-2">
            <Button
              id={`toggle-review-btn-${contradiction.id}`}
              variant="outline"
              size="sm"
              onClick={() => onToggleReview(contradiction)}
              className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
            >
              {isReviewed ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>Unreview</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span>Mark Reviewed</span>
                </>
              )}
            </Button>

            <Button
              id={`view-evidence-btn-${contradiction.id}`}
              variant="primary"
              size="sm"
              onClick={() => onSelect(contradiction)}
              className="text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Evidence & Details</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
