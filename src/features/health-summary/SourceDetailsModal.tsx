import React from 'react';
import {
  X,
  FileText,
  Calendar,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ResolvedSourceEvent } from '../../services/healthSummaryService';
import { NavigationRoute } from '../../types';

interface SourceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  claimText?: string;
  sourceEvents: ResolvedSourceEvent[];
  onNavigate?: (route: NavigationRoute) => void;
}

export function SourceDetailsModal({
  isOpen,
  onClose,
  title = 'Verified Clinical Sources',
  claimText,
  sourceEvents,
  onNavigate,
}: SourceDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="source-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="source-details-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-medium">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
              <p className="text-xs text-slate-500">
                {sourceEvents.length} confirmed database record{sourceEvents.length === 1 ? '' : 's'} linked to this statement
              </p>
            </div>
          </div>
          <button
            id="close-source-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claim context quote if provided */}
        {claimText && (
          <div className="px-6 py-3.5 bg-teal-50/40 border-b border-teal-100/60 text-xs text-teal-900 flex items-start gap-2">
            <span className="font-semibold shrink-0 uppercase tracking-wider text-[10px] text-teal-700 mt-0.5">
              Summary claim:
            </span>
            <span className="italic leading-relaxed">"{claimText}"</span>
          </div>
        )}

        {/* Source List */}
        <div className="p-6 overflow-y-auto space-y-4 divide-y divide-slate-100">
          {sourceEvents.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-6">
              No matching records found in database for these references.
            </p>
          ) : (
            sourceEvents.map((evt, idx) => (
              <div key={evt.id} className={idx > 0 ? 'pt-4' : ''}>
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {evt.eventType}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-700">
                      ID: {evt.id}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(evt.eventDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1">{evt.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {evt.description}
                </p>

                {/* Metadata tags */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {evt.facilityName && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {evt.facilityName}
                    </span>
                  )}
                  {evt.providerName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {evt.providerName}
                    </span>
                  )}
                  {evt.documentFileName && (
                    <span className="flex items-center gap-1 text-teal-700 font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      {evt.documentFileName}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Source records authenticated via database provenance
          </div>
          <div className="flex items-center gap-2">
            {onNavigate && (
              <Button
                id="view-in-timeline-from-modal-btn"
                variant="outline"
                size="sm"
                className="text-xs font-medium gap-1.5"
                onClick={() => {
                  onClose();
                  onNavigate('timeline');
                }}
              >
                <span>View in Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              id="dismiss-source-modal-btn"
              variant="primary"
              size="sm"
              className="text-xs font-medium"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
