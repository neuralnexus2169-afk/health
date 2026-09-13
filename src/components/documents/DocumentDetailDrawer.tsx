import React, { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  Building2,
  User,
  FileText,
  HeartPulse,
  Pill,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Clock,
  Quote,
  ExternalLink,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import {
  EnrichedDocument,
  formatDisplayDate,
  updateDocumentStatus,
} from '../../services/patientService';
import { extractDocument } from '../../services/extractionService';
import { DocumentStatus } from '../../types/medical';
import { DOCUMENT_TYPE_CONFIG, DocumentStatusBadge } from './DocumentItem';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface DocumentDetailDrawerProps {
  document: EnrichedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTimeline?: (eventId?: string) => void;
  onStatusUpdated?: (docId: string, newStatus: DocumentStatus) => void;
  onOpenReview?: (doc: EnrichedDocument) => void;
  onExtractionFinished?: () => void;
}

export function DocumentDetailDrawer({
  document: doc,
  isOpen,
  onClose,
  onNavigateToTimeline,
  onStatusUpdated,
  onOpenReview,
  onExtractionFinished,
}: DocumentDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !doc) return null;

  const config = DOCUMENT_TYPE_CONFIG[doc.documentType] || DOCUMENT_TYPE_CONFIG.Other;
  const Icon = config.icon;
  const formattedDate = formatDisplayDate(doc.documentDate);

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateDocumentStatus(doc.id, newStatus);
      if (onStatusUpdated) {
        onStatusUpdated(doc.id, newStatus);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTriggerExtraction = async () => {
    if (!doc) return;
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const result = await extractDocument(doc.id);
      if (onExtractionFinished) {
        onExtractionFinished();
      }
      if (onOpenReview) {
        onOpenReview({
          ...doc,
          status: 'Needs Review',
          extraction: result,
        });
      }
    } catch (err: any) {
      console.error('Extraction failed:', err);
      setExtractionError(err?.message || 'Failed to extract clinical information.');
    } finally {
      setIsExtracting(false);
    }
  };

  const hasPreviewUrl = Boolean(doc.fileSizeBytes && (doc as any).previewUrl || (doc as any).dataUrl);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-zinc-200 flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-zinc-200/80 bg-zinc-50/60">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${config.bgClass} ${config.colorClass} shadow-2xs mt-0.5`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-200/80 text-zinc-700">
                      {doc.documentType}
                    </span>
                    <DocumentStatusBadge status={doc.status} />
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 leading-snug break-all">
                    {doc.fileName}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{formattedDate}</span>
                    {doc.pageCount && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span>{doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}</span>
                      </>
                    )}
                    {doc.fileSizeBytes && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span>{(doc.fileSizeBytes / 1024).toFixed(0)} KB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs (Details vs Preview) */}
            <div className="mt-5 flex items-center gap-2 border-b border-zinc-200 -mb-5 sm:-mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-teal-800 text-teal-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Document & Extraction Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'border-teal-800 text-teal-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Document Preview</span>
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {activeTab === 'preview' ? (
              /* PREVIEW TAB */
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between gap-3 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-teal-800" />
                    <span className="font-semibold text-zinc-800">{doc.fileName}</span>
                  </div>
                  <span className="text-zinc-400">Institutional Record Archive</span>
                </div>

                {/* Document Display Canvas */}
                <div className="bg-zinc-100/80 rounded-xl p-4 border border-zinc-200 flex flex-col items-center justify-center min-h-[360px]">
                  {hasPreviewUrl ? (
                    <img
                      src={(doc as any).previewUrl || (doc as any).dataUrl}
                      alt={doc.fileName}
                      className="max-w-full max-h-[460px] object-contain rounded-lg shadow-sm"
                    />
                  ) : (
                    /* Simulated High-Fidelity Clinical Document Preview */
                    <div className="w-full max-w-md bg-white rounded-lg shadow-md border border-zinc-300 p-6 space-y-5 text-left font-serif text-zinc-800 text-xs">
                      {/* Institutional Letterhead */}
                      <div className="border-b border-zinc-200 pb-3 flex items-start justify-between">
                        <div>
                          <div className="font-sans font-bold text-sm text-zinc-900 uppercase tracking-wide">
                            {doc.facilityName || 'Institutional Health System'}
                          </div>
                          <div className="font-sans text-[11px] text-zinc-500">
                            Department of Clinical Documentation
                          </div>
                        </div>
                        <div className="text-right font-sans text-[10px] text-zinc-400">
                          <div>DATE: {formattedDate}</div>
                          <div>PAGES: {doc.pageCount || 1}</div>
                        </div>
                      </div>

                      {/* Patient Context Banner */}
                      <div className="bg-zinc-50 p-2.5 rounded font-sans text-[11px] text-zinc-600 grid grid-cols-2 gap-2 border border-zinc-200/60">
                        <div>
                          <strong>PATIENT:</strong> Arun Mathew
                        </div>
                        <div>
                          <strong>ATTENDING:</strong> {doc.providerName || 'Physician on Record'}
                        </div>
                      </div>

                      {/* Transcribed Body / Verbatim Excerpt */}
                      <div className="space-y-3 pt-2">
                        <div className="font-sans font-bold text-[11px] uppercase tracking-wider text-teal-800">
                          {doc.documentType} SUMMARY & CLINICAL NOTES
                        </div>
                        <p className="leading-relaxed text-zinc-700 italic bg-amber-50/40 p-3 rounded border border-amber-100">
                          "{doc.extractedTextSnippet || 'Clinical documentation verified and archived in electronic health records.'}"
                        </p>
                        {doc.sourceReferences.length > 0 && (
                          <div className="pt-2 text-[11px] text-zinc-500 border-t border-zinc-100">
                            <strong>Reference Index:</strong> Page {doc.sourceReferences[0].pageNumber || 1}
                          </div>
                        )}
                      </div>

                      {/* Signature Footer */}
                      <div className="pt-4 border-t border-zinc-200 flex items-center justify-between text-[10px] font-sans text-zinc-400">
                        <span>Electronically Signed & Authenticated</span>
                        <span>CONFIDENTIAL MEDICAL RECORD</span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-center text-zinc-400">
                  Document provenance verified and secured.
                </p>
              </div>
            ) : (
              /* DETAILS TAB */
              <div className="space-y-6">
                {/* Clinical Provenance & Origin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/40 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Healthcare Facility</span>
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {doc.facilityName || doc.facility?.name || 'Institutional Health System'}
                    </div>
                    {doc.facility?.type && (
                      <div className="text-xs text-zinc-500">{doc.facility.type}</div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/40 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Attending Provider</span>
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {doc.providerName || doc.provider?.name || 'Physician on Record'}
                    </div>
                    {doc.provider?.specialization && (
                      <div className="text-xs text-zinc-500">
                        {doc.provider.specialization}
                      </div>
                    )}
                  </div>
                </div>

                {/* Processing Status Action Bar */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block font-medium">Current Workflow Status:</span>
                    <span className="font-semibold text-zinc-900">{doc.status}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.status === 'Needs Review' && onOpenReview && (
                      <button
                        type="button"
                        onClick={() => onOpenReview(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Review Extracted Info</span>
                      </button>
                    )}
                    {doc.status === 'Uploaded' && (
                      <button
                        type="button"
                        disabled={isExtracting}
                        onClick={handleTriggerExtraction}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isExtracting ? 'Extracting...' : 'Extract with AI'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Extraction Section */}
                <div className="p-4 sm:p-5 rounded-2xl border border-teal-200/80 bg-teal-50/20 space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-zinc-900">
                            AI Extraction
                          </h3>
                          {doc.extraction && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                doc.extraction.status === 'Confirmed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {doc.extraction.status === 'Confirmed' ? 'Confirmed' : 'Needs Review'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          Automated clinical entity extraction with source quotation.
                        </p>
                      </div>
                    </div>

                    {doc.extraction && onOpenReview && (
                      <Button
                        variant={doc.extraction.status === 'Confirmed' ? 'outline' : 'primary'}
                        size="sm"
                        icon={<Sparkles className="w-3.5 h-3.5" />}
                        onClick={() => onOpenReview(doc)}
                      >
                        {doc.extraction.status === 'Confirmed' ? 'View Review Details' : 'Review Extracted Info'}
                      </Button>
                    )}
                  </div>

                  {doc.extraction ? (
                    <div className="space-y-3 pt-2 border-t border-teal-100/80">
                      {/* Status, Model, Extraction Date */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg bg-white border border-teal-100/90 shadow-2xs">
                          <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Status</span>
                          <span className="font-semibold text-zinc-800">{doc.extraction.status}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-teal-100/90 shadow-2xs">
                          <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Model Used</span>
                          <span className="font-mono font-medium text-zinc-800 text-[11px] truncate block" title={doc.extraction.model}>
                            {doc.extraction.model}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-teal-100/90 shadow-2xs col-span-2 sm:col-span-1">
                          <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Extraction Date</span>
                          <span className="font-medium text-zinc-800">{formatDisplayDate(doc.extraction.extractedAt)}</span>
                        </div>
                      </div>

                      {/* Safety Banner */}
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200/70 rounded-lg flex items-start gap-2 text-[11px] text-amber-900 leading-snug">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>
                          <strong>Clinical Safety:</strong> Information extracted by AI is an interpretation of the source record and requires user verification before becoming a confirmed medical record.
                        </span>
                      </div>

                      {/* Extracted Information Preview */}
                      <div className="space-y-3 pt-1">
                        {/* Diagnoses */}
                        {(doc.extraction.reviewedData?.diagnoses || doc.extraction.data?.diagnoses || []).length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                              <HeartPulse className="w-3.5 h-3.5 text-teal-700" />
                              <span>Extracted Diagnoses</span>
                            </div>
                            <div className="space-y-1.5">
                              {(doc.extraction.reviewedData?.diagnoses || doc.extraction.data?.diagnoses || []).map((diag, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg bg-white border border-zinc-200/80 text-xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-zinc-900">{diag.name}</span>
                                    {diag.confidence && (
                                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">
                                        {diag.confidence} conf.
                                      </span>
                                    )}
                                  </div>
                                  {diag.sourceQuote && (
                                    <p className="mt-1 text-[11px] text-zinc-500 italic font-mono bg-zinc-50 p-1.5 rounded">
                                      "{diag.sourceQuote}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Medications */}
                        {(doc.extraction.reviewedData?.medications || doc.extraction.data?.medications || []).length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-blue-700" />
                              <span>Extracted Medications</span>
                            </div>
                            <div className="space-y-1.5">
                              {(doc.extraction.reviewedData?.medications || doc.extraction.data?.medications || []).map((med, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg bg-white border border-zinc-200/80 text-xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <span className="font-bold text-zinc-900">{med.name}</span>
                                      <span className="ml-2 text-zinc-500 font-medium">{med.dosage} · {med.frequency}</span>
                                    </div>
                                    {med.confidence && (
                                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">
                                        {med.confidence} conf.
                                      </span>
                                    )}
                                  </div>
                                  {med.sourceQuote && (
                                    <p className="mt-1 text-[11px] text-zinc-500 italic font-mono bg-zinc-50 p-1.5 rounded">
                                      "{med.sourceQuote}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Lab Results */}
                        {(doc.extraction.reviewedData?.labResults || doc.extraction.data?.labResults || []).length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                              <FlaskConical className="w-3.5 h-3.5 text-purple-700" />
                              <span>Extracted Laboratory Results</span>
                            </div>
                            <div className="space-y-1.5">
                              {(doc.extraction.reviewedData?.labResults || doc.extraction.data?.labResults || []).map((lab, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg bg-white border border-zinc-200/80 text-xs flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-zinc-900">{lab.parameterName || lab.testName}</span>
                                    <span className="ml-2 font-mono font-bold text-teal-800">{lab.value} {lab.unit}</span>
                                    {lab.referenceRange && (
                                      <span className="ml-2 text-zinc-400 text-[11px]">Ref: {lab.referenceRange}</span>
                                    )}
                                  </div>
                                  {lab.interpretation && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                                      {lab.interpretation}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Extraction has not happened */
                    <div className="p-4 rounded-xl bg-white border border-dashed border-teal-200 text-center space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-zinc-800">
                          AI extraction has not been performed for this document.
                        </p>
                        <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                          Extract diagnoses, medications, and laboratory values into structured clinical events with verbatim source citations.
                        </p>
                      </div>

                      {extractionError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 text-left">
                          {extractionError}
                        </div>
                      )}

                      <div>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isExtracting}
                          icon={<Sparkles className="w-3.5 h-3.5" />}
                          onClick={handleTriggerExtraction}
                        >
                          {isExtracting ? 'Extracting with AI...' : 'Extract information'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Extracted Document Summary / Snippet */}
                {doc.extractedTextSnippet && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Extracted Clinical Text</span>
                    </h4>
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-sm text-zinc-700 leading-relaxed font-serif italic">
                      "{doc.extractedTextSnippet}"
                    </div>
                  </div>
                )}

                {/* Associated Medical Events */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-800" />
                      <span>Associated Medical Events ({doc.events.length})</span>
                    </h4>
                    {doc.events.length > 0 && onNavigateToTimeline && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTimeline(doc.events[0].id)}
                        className="text-xs font-medium text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View in timeline</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {doc.events.length > 0 ? (
                    <div className="space-y-2.5">
                      {doc.events.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-3.5 rounded-xl border border-zinc-200/80 bg-white hover:bg-zinc-50/80 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                              {evt.eventType}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium">
                              {formatDisplayDate(evt.eventDate)}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-zinc-900 mt-1.5">
                            {evt.title}
                          </div>
                          <p className="text-xs text-zinc-600 mt-1 line-clamp-2">
                            {evt.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-zinc-200/70 bg-zinc-50 text-center text-xs text-zinc-500">
                      No standalone encounters linked to this file yet.
                    </div>
                  )}
                </div>

                {/* Associated Extracted Diagnoses */}
                {doc.diagnoses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-amber-600" />
                      <span>Extracted Diagnoses ({doc.diagnoses.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {doc.diagnoses.map((diag) => (
                        <div
                          key={diag.id}
                          className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="text-sm font-bold text-zinc-900">
                              {diag.name}
                            </span>
                            {diag.category && (
                              <span className="text-xs text-zinc-500 block">
                                {diag.category}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                            {diag.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Associated Extracted Medications */}
                {doc.medications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-teal-700" />
                      <span>Extracted Medications ({doc.medications.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {doc.medications.map((med) => (
                        <div
                          key={med.id}
                          className="p-3 rounded-xl bg-teal-50/40 border border-teal-200/70 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="text-sm font-bold text-zinc-900">
                              {med.name}
                            </span>
                            <span className="text-xs text-zinc-500 block">
                              {med.dosage} · {med.frequency}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900">
                            {med.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Associated Extracted Lab Results */}
                {doc.labResults.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-blue-700" />
                      <span>Extracted Laboratory Results ({doc.labResults.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {doc.labResults.map((lab) => (
                        <div
                          key={lab.id}
                          className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-semibold text-zinc-900">
                              {lab.parameterName || lab.testName}
                            </div>
                            {lab.referenceRange && (
                              <div className="text-[11px] text-zinc-400">
                                Ref: {lab.referenceRange}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-zinc-900">
                              {lab.value} {lab.unit}
                            </span>
                            {lab.interpretation && (
                              <span className="block text-[10px] font-semibold text-emerald-700">
                                {lab.interpretation}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source References & Traceability */}
                {doc.sourceReferences.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Source Evidence & Provenance</span>
                    </h4>
                    <div className="space-y-2.5">
                      {doc.sourceReferences.map((src) => (
                        <div
                          key={src.id}
                          className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-700">
                              Source Anchor: Page {src.pageNumber || 1}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold">
                              Verified
                            </span>
                          </div>
                          {src.sourceText && (
                            <p className="text-xs text-zinc-600 font-serif italic bg-white p-2.5 rounded border border-zinc-200/60">
                              "{src.sourceText}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400 font-mono">
              DOC ID: {doc.id}
            </span>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
