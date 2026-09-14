import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  FileText,
  Calendar,
  Building2,
  User,
  Quote,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Info,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { MedicalContradiction } from '../../types/medical';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { NavigationRoute } from '../../types';

interface ContradictionDetailDrawerProps {
  contradiction: MedicalContradiction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateReview: (
    contradictionId: string,
    reviewStatus: 'Unreviewed' | 'Reviewed',
    notes?: string
  ) => Promise<void>;
  onNavigate: (route: NavigationRoute) => void;
  onOpenDocument?: (docId?: string) => void;
}

export function ContradictionDetailDrawer({
  contradiction,
  isOpen,
  onClose,
  onUpdateReview,
  onNavigate,
  onOpenDocument,
}: ContradictionDetailDrawerProps) {
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (contradiction) {
      setReviewNotes(contradiction.reviewNotes || '');
      setSaveSuccess(false);
    }
  }, [contradiction]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !contradiction) return null;

  const isReviewed = contradiction.reviewStatus === 'Reviewed';

  const handleToggleReview = async () => {
    setIsSaving(true);
    try {
      const nextStatus = isReviewed ? 'Unreviewed' : 'Reviewed';
      await onUpdateReview(contradiction.id, nextStatus, reviewNotes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update review status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await onUpdateReview(contradiction.id, contradiction.reviewStatus || 'Unreviewed', reviewNotes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for formatting date
  const formatDate = (d?: string) => {
    if (!d) return 'Documented date unknown';
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

  // Resolve Record A and Record B metadata
  const docA = contradiction.firstDocument || {
    documentId: contradiction.sourceA.documentId,
    documentFileName: contradiction.sourceA.documentFileName,
    documentDate: contradiction.sourceA.documentDate,
    pageNumber: contradiction.sourceA.pageNumber || 1,
    quote: contradiction.sourceA.quote,
    fact: contradiction.firstFact || 'Conflicting Fact A',
    facilityName: contradiction.firstFacility || contradiction.sourceA.facilityName || 'Medical Facility',
    providerName: contradiction.firstProvider || contradiction.sourceA.providerName || 'Attending Physician',
  };

  const docB = contradiction.secondDocument || {
    documentId: contradiction.sourceB.documentId,
    documentFileName: contradiction.sourceB.documentFileName,
    documentDate: contradiction.sourceB.documentDate,
    pageNumber: contradiction.sourceB.pageNumber || 1,
    quote: contradiction.sourceB.quote,
    fact: contradiction.secondFact || 'Conflicting Fact B',
    facilityName: contradiction.secondFacility || contradiction.sourceB.facilityName || 'Medical Facility',
    providerName: contradiction.secondProvider || contradiction.sourceB.providerName || 'Attending Physician',
  };

  const handleViewDoc = (docId?: string) => {
    if (onOpenDocument) {
      onOpenDocument(docId);
    } else {
      onNavigate('documents');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-300 font-semibold text-xs flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{contradiction.category} Inconsistency</span>
                </Badge>

                <Badge
                  variant="secondary"
                  className={
                    contradiction.severity === 'High'
                      ? 'bg-rose-50 text-rose-800 border-rose-200 font-medium'
                      : contradiction.severity === 'Moderate'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 font-medium'
                      : 'bg-slate-100 text-slate-700 border-slate-200 font-medium'
                  }
                >
                  {contradiction.severity} Priority
                </Badge>

                <Badge
                  variant={isReviewed ? 'default' : 'outline'}
                  className={
                    isReviewed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }
                >
                  {isReviewed ? '✓ Human Reviewed' : 'Needs Review'}
                </Badge>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {contradiction.title}
              </h2>
              <p className="text-xs text-slate-500">
                Identified across documented health encounters. No automatic resolution has been made.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Non-Resolution Principle Banner */}
            <div className="rounded-xl p-4 bg-amber-50/80 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-900">
                  Potential Inconsistency — Clinical and Patient Review Required
                </span>
                <p className="text-amber-800 leading-relaxed">
                  HealthTimeline highlights conflicting documentation to support clinical safety and record reconciliation.
                  The application does not determine which record is correct or overwrite documented history.
                </p>
              </div>
            </div>

            {/* Why This Was Flagged */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Detection Rationale</span>
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed">
                {contradiction.clinicalExplanation || contradiction.description}
              </div>
            </div>

            {/* Side-by-Side Evidence Comparison */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Documented Evidence Comparison
              </h4>

              <div className="grid grid-cols-1 gap-4">
                {/* Record 1 Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Record 1
                    </span>
                    <Badge variant="outline" className="text-xs font-semibold text-slate-700 bg-slate-50">
                      {docA.fact || 'Documented Fact'}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(docA.documentDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{docA.facilityName || 'Healthcare Facility'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{docA.providerName || 'Attending Clinician'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono text-[11px]">{docA.documentFileName}</span>
                    </div>
                  </div>

                  {/* Excerpt Quote */}
                  <div className="relative rounded-lg bg-slate-50 p-3 border-l-3 border-slate-400 text-xs text-slate-700 italic">
                    <Quote className="w-3.5 h-3.5 text-slate-400 absolute top-2 right-2 opacity-50" />
                    <p className="pr-4 font-serif leading-relaxed">
                      "{docA.quote}"
                    </p>
                    {docA.pageNumber && (
                      <span className="block mt-1 text-[10px] text-slate-400 not-italic">
                        Page {docA.pageNumber}
                      </span>
                    )}
                  </div>

                  {/* Document Link */}
                  <div className="pt-1 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDoc(docA.documentId)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 gap-1.5"
                    >
                      <span>View source document</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* VS Indicator */}
                <div className="relative flex items-center justify-center my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative px-3 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400 rounded-full border border-slate-200">
                    Conflicting With
                  </div>
                </div>

                {/* Record 2 Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Record 2
                    </span>
                    <Badge variant="outline" className="text-xs font-semibold text-slate-700 bg-slate-50">
                      {docB.fact || 'Documented Fact'}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(docB.documentDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{docB.facilityName || 'Healthcare Facility'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{docB.providerName || 'Attending Clinician'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono text-[11px]">{docB.documentFileName}</span>
                    </div>
                  </div>

                  {/* Excerpt Quote */}
                  <div className="relative rounded-lg bg-slate-50 p-3 border-l-3 border-slate-400 text-xs text-slate-700 italic">
                    <Quote className="w-3.5 h-3.5 text-slate-400 absolute top-2 right-2 opacity-50" />
                    <p className="pr-4 font-serif leading-relaxed">
                      "{docB.quote}"
                    </p>
                    {docB.pageNumber && (
                      <span className="block mt-1 text-[10px] text-slate-400 not-italic">
                        Page {docB.pageNumber}
                      </span>
                    )}
                  </div>

                  {/* Document Link */}
                  <div className="pt-1 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDoc(docB.documentId)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 gap-1.5"
                    >
                      <span>View source document</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Human Review Section */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Review Status & Clinical Notes
                </h4>
                {contradiction.reviewedAt && (
                  <span className="text-[11px] text-slate-400">
                    Reviewed on {formatDate(contradiction.reviewedAt)}
                  </span>
                )}
              </div>

              {/* Review Switcher Button */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {isReviewed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span>Current status: {isReviewed ? 'Reviewed' : 'Needs Review'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isReviewed
                      ? 'Marked as reviewed by clinical staff. Discrepancy remains documented for safety.'
                      : 'Pending examination by clinician or patient.'}
                  </p>
                </div>

                <Button
                  id="drawer-toggle-review-btn"
                  variant={isReviewed ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleToggleReview}
                  disabled={isSaving}
                  className="text-xs font-semibold shrink-0 cursor-pointer"
                >
                  {isReviewed ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Mark Unreviewed
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Mark as Reviewed
                    </>
                  )}
                </Button>
              </div>

              {/* Clinical Notes Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="review-notes-textarea"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Reconciliation / Clinical Notes (optional)
                </label>
                <textarea
                  id="review-notes-textarea"
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g., Reviewed with Dr. Jenkins and patient. Patient confirmed mild childhood rash to oral penicillin. Allergy referral placed."
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 italic">
                  Note: "Reviewed" indicates a human has reviewed the conflict, not that the system resolved it.
                </span>

                <Button
                  id="drawer-save-notes-btn"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSaving || reviewNotes === (contradiction.reviewNotes || '')}
                  className="text-xs font-semibold cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Saved
                    </>
                  ) : (
                    'Save Notes'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onNavigate('timeline');
                onClose();
              }}
              className="text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              <span>View in Timeline</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold px-4"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
