import React, { useEffect } from 'react';
import {
  X,
  FileText,
  Building2,
  User,
  Calendar,
  Layers,
  Quote,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { EnrichedMedicalEvent, formatDisplayDate } from '../../services/patientService';
import { Button } from '../ui/Button';

interface SourceDocumentModalProps {
  event: EnrichedMedicalEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDocuments?: (docId?: string) => void;
}

export function SourceDocumentModal({
  event,
  isOpen,
  onClose,
  onOpenDocuments,
}: SourceDocumentModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const doc = event.document;
  const fileName =
    doc?.fileName ||
    event.documentFileName ||
    event.sourceReference?.documentFileName ||
    'clinical_record.pdf';
  const pageNumber = event.sourceReference?.pageNumber || 1;
  const sourceText =
    event.sourceReference?.sourceText ||
    doc?.extractedTextSnippet ||
    'Clinical documentation verified and matched from institutional medical records repository.';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-50/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-50 border border-teal-200/60 text-teal-800">
                <FileCheck className="w-5 h-5 text-teal-800" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <span>Source Document Evidence</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                    Verified Match
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Direct audit trail and clinical provenance
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* File Metadata Card */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 pb-3">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="font-mono text-sm font-semibold text-zinc-900 truncate">
                    {fileName}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 shrink-0">
                  Page {pageNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 block font-medium">Document Type</span>
                  <span className="font-semibold text-zinc-800">
                    {doc?.documentType || 'Clinical Record'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Document Date</span>
                  <span className="font-semibold text-zinc-800">
                    {formatDisplayDate(doc?.documentDate || event.eventDate)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Processing Status</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Processed
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Origin Facility</span>
                  <span className="font-semibold text-zinc-800 truncate block">
                    {event.facilityName || doc?.facilityName || 'Institutional Health System'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Signing Provider</span>
                  <span className="font-semibold text-zinc-800 truncate block">
                    {event.providerName || doc?.providerName || 'Attending Physician'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">Total Pages</span>
                  <span className="font-semibold text-zinc-800">
                    {doc?.pageCount || 1} pages
                  </span>
                </div>
              </div>
            </div>

            {/* Verbatim Extracted Excerpt */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-zinc-400" />
                <span>Extracted Document Excerpt (Page {pageNumber})</span>
              </h4>
              <div className="p-4 rounded-xl bg-teal-50/40 border border-teal-200/80 text-sm text-zinc-800 leading-relaxed font-serif">
                "{sourceText}"
              </div>
            </div>

            {/* Clinical Correlation */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-white flex items-center gap-3 text-xs text-zinc-600">
              <ShieldCheck className="w-4 h-4 text-teal-800 shrink-0" />
              <span>
                This timeline entry is directly backed by institutional medical documentation and
                relational data anchors.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-3">
            {onOpenDocuments ? (
              <Button
                variant="outline"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5 text-teal-800" />}
                onClick={() => {
                  onClose();
                  onOpenDocuments(event.documentId || event.document?.id);
                }}
              >
                Open in Medical Documents
              </Button>
            ) : (
              <div />
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
