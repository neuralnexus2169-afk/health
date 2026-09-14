import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Building2,
  User,
  Calendar,
  Pill,
  Activity,
  FlaskConical,
  Stethoscope,
  AlertOctagon,
  Edit2,
  Check,
  Trash2,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  UserCheck,
  ShieldAlert,
  FileQuestion,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  DocumentExtraction,
  StructuredExtractionData,
  MedicalDocument,
  ExtractedDiagnosis,
  ExtractedMedication,
  ExtractedLabResult,
  ExtractedProcedure,
  ExtractedAllergy,
  ExtractedPatientInfo,
  ExtractedMedicalEventItem,
  ExtractedNeedsReviewItem,
  ReviewState,
} from '../../../types/medical';
import { updateExtractionReview, confirmExtraction } from '../../../services/extractionService';
import { EditExtractedItemModal, EditableItem } from './EditExtractedItemModal';

interface ExtractionReviewModalProps {
  document: MedicalDocument;
  extraction: DocumentExtraction;
  onClose: () => void;
  onExtractionConfirmed: () => void;
  onNavigateToTimeline?: () => void;
}

export const ExtractionReviewModal: React.FC<ExtractionReviewModalProps> = ({
  document,
  extraction: initialExtraction,
  onClose,
  onExtractionConfirmed,
  onNavigateToTimeline,
}) => {
  const [extraction, setExtraction] = useState<DocumentExtraction>(initialExtraction);
  const [data, setData] = useState<StructuredExtractionData>(
    initialExtraction.reviewedData || initialExtraction.data
  );

  const [activeEditingItem, setActiveEditingItem] = useState<EditableItem | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmedSuccess, setIsConfirmedSuccess] = useState(
    initialExtraction.status === 'Confirmed'
  );
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [hasUnsavedModifications, setHasUnsavedModifications] = useState(false);

  // Calculate stats
  const totalAcceptedCount =
    data.diagnoses.filter((d) => d.accepted !== false).length +
    data.medications.filter((m) => m.accepted !== false).length +
    data.labResults.filter((l) => l.accepted !== false).length +
    data.procedures.filter((p) => p.accepted !== false).length +
    data.allergies.filter((a) => a.accepted !== false).length +
    (data.medicalEvents || []).filter((e) => e.accepted !== false).length +
    (data.needsReviewItems || []).filter((n) => n.accepted === true).length;

  const totalItemsCount =
    data.diagnoses.length +
    data.medications.length +
    data.labResults.length +
    data.procedures.length +
    data.allergies.length +
    (data.medicalEvents?.length || 0) +
    (data.needsReviewItems?.length || 0);

  // Toggle item acceptance
  const toggleDiagnosis = (index: number) => {
    setData((prev) => {
      const next = { ...prev };
      const current = next.diagnoses[index];
      next.diagnoses[index] = { ...current, accepted: current.accepted === false ? true : false };
      return next;
    });
    setHasUnsavedModifications(true);
  };

  const toggleMedication = (index: number) => {
    setData((prev) => {
      const next = { ...prev };
      const current = next.medications[index];
      next.medications[index] = { ...current, accepted: current.accepted === false ? true : false };
      return next;
    });
    setHasUnsavedModifications(true);
  };

  const toggleLabResult = (index: number) => {
    setData((prev) => {
      const next = { ...prev };
      const current = next.labResults[index];
      next.labResults[index] = { ...current, accepted: current.accepted === false ? true : false };
      return next;
    });
    setHasUnsavedModifications(true);
  };

  const toggleProcedure = (index: number) => {
    setData((prev) => {
      const next = { ...prev };
      const current = next.procedures[index];
      next.procedures[index] = { ...current, accepted: current.accepted === false ? true : false };
      return next;
    });
    setHasUnsavedModifications(true);
  };

  const toggleAllergy = (index: number) => {
    setData((prev) => {
      const next = { ...prev };
      const current = next.allergies[index];
      next.allergies[index] = { ...current, accepted: current.accepted === false ? true : false };
      return next;
    });
    setHasUnsavedModifications(true);
  };

  const toggleMedicalEvent = (index: number) => {
    setData((prev) => {
      const next = { ...prev };
      if (!next.medicalEvents) return prev;
      const current = next.medicalEvents[index];
      next.medicalEvents[index] = { ...current, accepted: current.accepted === false ? true : false };
      return next;
    });
    setHasUnsavedModifications(true);
  };

  const toggleNeedsReviewItem = (index: number) => {
    setData((prev) => {
      const next = { ...prev };
      if (!next.needsReviewItems) return prev;
      const current = next.needsReviewItems[index];
      next.needsReviewItems[index] = { ...current, accepted: current.accepted === true ? false : true };
      return next;
    });
    setHasUnsavedModifications(true);
  };

  // Convert needs review item directly into clinical entity
  const convertNeedsReviewToDiagnosis = (index: number) => {
    setData((prev) => {
      const item = prev.needsReviewItems?.[index];
      if (!item) return prev;
      const newDiag: ExtractedDiagnosis = {
        id: `conv-diag-${Date.now()}`,
        name: item.rawText,
        status: 'Active',
        confidence: 'Medium',
        reviewState: 'High Confidence',
        confidenceReason: 'Verified and converted by clinician from flagged item',
        sourceText: item.rawText,
        sourceLocation: item.sourceLocation,
        accepted: true,
      };
      const next = { ...prev };
      next.diagnoses = [...next.diagnoses, newDiag];
      if (next.needsReviewItems) {
        next.needsReviewItems[index] = {
          ...item,
          accepted: false,
          reviewState: 'High Confidence',
          confidenceReason: 'Converted into verified Diagnosis',
        };
      }
      return next;
    });
    setHasUnsavedModifications(true);
  };

  const convertNeedsReviewToMedication = (index: number) => {
    setData((prev) => {
      const item = prev.needsReviewItems?.[index];
      if (!item) return prev;
      const newMed: ExtractedMedication = {
        id: `conv-med-${Date.now()}`,
        name: item.rawText,
        dosage: 'As directed',
        frequency: 'Daily',
        status: 'Active',
        confidence: 'Medium',
        reviewState: 'High Confidence',
        confidenceReason: 'Verified and converted by clinician from flagged item',
        sourceText: item.rawText,
        sourceLocation: item.sourceLocation,
        accepted: true,
      };
      const next = { ...prev };
      next.medications = [...next.medications, newMed];
      if (next.needsReviewItems) {
        next.needsReviewItems[index] = {
          ...item,
          accepted: false,
          reviewState: 'High Confidence',
          confidenceReason: 'Converted into verified Medication',
        };
      }
      return next;
    });
    setHasUnsavedModifications(true);
  };

  // Handle saving an edited item
  const handleSaveItem = async (edited: EditableItem) => {
    setData((prev) => {
      const next = { ...prev };
      if (edited.type === 'diagnosis') {
        next.diagnoses[edited.index] = { ...edited.item, accepted: true };
      } else if (edited.type === 'medication') {
        next.medications[edited.index] = { ...edited.item, accepted: true };
      } else if (edited.type === 'labResult') {
        next.labResults[edited.index] = { ...edited.item, accepted: true };
      } else if (edited.type === 'procedure') {
        next.procedures[edited.index] = { ...edited.item, accepted: true };
      } else if (edited.type === 'allergy') {
        next.allergies[edited.index] = { ...edited.item, accepted: true };
      } else if (edited.type === 'patientInfo') {
        next.patientInfo = { ...edited.item };
      } else if (edited.type === 'medicalEvent') {
        if (!next.medicalEvents) next.medicalEvents = [];
        next.medicalEvents[edited.index] = { ...edited.item, accepted: true };
      } else if (edited.type === 'needsReview') {
        if (!next.needsReviewItems) next.needsReviewItems = [];
        next.needsReviewItems[edited.index] = { ...edited.item, accepted: true };
      }
      return next;
    });

    setActiveEditingItem(null);
    setHasUnsavedModifications(true);

    // Persist draft reviewed data
    try {
      await updateExtractionReview(extraction.id, data);
    } catch (e) {
      console.warn('Draft auto-save failed:', e);
    }
  };

  // Handle final confirmation
  const handleConfirm = async () => {
    setIsConfirming(true);
    setConfirmError(null);

    try {
      // First persist any current review edits
      await updateExtractionReview(extraction.id, data);

      // Confirm extraction and create permanent medical records
      const result = await confirmExtraction(extraction.id);
      setExtraction(result.extraction);
      setIsConfirmedSuccess(true);
      onExtractionConfirmed();
    } catch (err: any) {
      console.error('Confirmation failed:', err);
      setConfirmError(err?.message || 'Failed to confirm medical records.');
    } finally {
      setIsConfirming(false);
    }
  };

  const flaggedItemsCount = (data.needsReviewItems || []).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="extraction-review-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  Review extracted information
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Needs Review
                </span>
                {flaggedItemsCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    {flaggedItemsCount} Ambiguities Flagged
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload → Extract → Categorize → Flag uncertainty → Review → Confirm → Integrate
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close review"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Principles Callout */}
        <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200/60 flex items-center gap-2.5 text-xs text-amber-900 shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <p className="leading-snug">
            <strong className="font-semibold">Safety constraint:</strong> AI proposes → human verifies → application records. Uncertain findings or ambiguous handwriting will NOT become confirmed medical facts without explicit human verification.
          </p>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Confirmed State Alert */}
          {isConfirmedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">
                    Clinical Information Confirmed
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    The verified diagnoses, medications, and laboratory values have been added to the patient's longitudinal record and health timeline.
                  </p>
                </div>
              </div>
              {onNavigateToTimeline && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToTimeline();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                >
                  View in Timeline <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Section 1: Document Information */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Document Metadata & Attribution
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Model: {extraction.model}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">File Name</span>
                <span className="font-medium text-slate-800 break-all">{document.fileName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Document Type</span>
                <span className="font-medium text-slate-800">
                  {data.documentType || document.documentType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Clinical Date</span>
                <span className="font-medium text-slate-800">
                  {data.documentDate || document.documentDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Attending Provider</span>
                <span className="font-medium text-slate-800">
                  {data.provider || document.providerName || 'Dr. Sarah Jenkins, MD'}
                </span>
              </div>
            </div>

            {data.summarySnippet && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Document Summary: </span>
                {data.summarySnippet}
              </div>
            )}
          </div>

          {/* Section 1.5: Patient Demographics Identification */}
          {data.patientInfo && (
            <div className="bg-blue-50/50 border border-blue-200/70 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Patient Demographics Verification
                  </h3>
                  {data.patientInfo.reviewState && (
                    <ReviewStateBadge state={data.patientInfo.reviewState} reason={data.patientInfo.confidenceReason} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveEditingItem({
                      type: 'patientInfo',
                      item: data.patientInfo!,
                      index: 0,
                    })
                  }
                  className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-100/60 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3 h-3" /> Edit Demographics
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/70 p-3 rounded-lg border border-blue-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Document Name</span>
                  <span className="font-semibold text-slate-800">{data.patientInfo.name || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                  <span className="font-semibold text-slate-800">{data.patientInfo.dateOfBirth || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Gender</span>
                  <span className="font-semibold text-slate-800">{data.patientInfo.gender || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">MRN / Patient ID</span>
                  <span className="font-semibold text-slate-800">{data.patientInfo.mrn || 'Not specified'}</span>
                </div>
              </div>

              {data.patientInfo.confidenceReason && (
                <div className="text-[11px] text-blue-700 mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{data.patientInfo.confidenceReason}</span>
                  {data.patientInfo.sourceLocation && (
                    <span className="text-blue-600/70 font-mono">({data.patientInfo.sourceLocation})</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Flagged Uncertainty & Needs Review Items */}
          {data.needsReviewItems && data.needsReviewItems.length > 0 && (
            <div className="bg-amber-50/60 border-2 border-amber-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Flagged for Human Verification ({data.needsReviewItems.length})
                    </h3>
                    <p className="text-xs text-amber-800">
                      Ambiguous handwriting, unclear dosage, or incomplete lab parameters detected.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                  Clinical Caution
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {data.needsReviewItems.map((item, idx) => {
                  const isAccepted = item.accepted === true;
                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAccepted
                          ? 'bg-white border-teal-300 shadow-xs'
                          : 'bg-white/90 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                              {item.suggestedCategory}
                            </span>
                            <ReviewStateBadge state={item.reviewState || 'Ambiguous'} reason={item.confidenceReason} />
                            {item.sourceLocation && (
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {item.sourceLocation}
                              </span>
                            )}
                          </div>

                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                            "{item.rawText}"
                          </div>

                          {item.confidenceReason && (
                            <div className="text-xs text-amber-800 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Reason: {item.confidenceReason}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEditingItem({
                                type: 'needsReview',
                                item,
                                index: idx,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" /> Clarify / Edit
                          </button>

                          {item.suggestedCategory === 'Medication' && (
                            <button
                              type="button"
                              onClick={() => convertNeedsReviewToMedication(idx)}
                              className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors"
                            >
                              <Pill className="w-3 h-3" /> Add as Med
                            </button>
                          )}

                          {item.suggestedCategory === 'Diagnosis' && (
                            <button
                              type="button"
                              onClick={() => convertNeedsReviewToDiagnosis(idx)}
                              className="px-2.5 py-1 text-xs font-medium text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 flex items-center gap-1 transition-colors"
                            >
                              <Activity className="w-3 h-3" /> Add as Diag
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleNeedsReviewItem(idx)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                              isAccepted
                                ? 'text-teal-700 bg-teal-50 border-teal-300 hover:bg-teal-100'
                                : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isAccepted ? (
                              <>
                                <Check className="w-3 h-3" /> Included
                              </>
                            ) : (
                              'Keep Excluded'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Diagnoses */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                Diagnoses & Conditions ({data.diagnoses.length})
              </h3>
              <span className="text-xs text-slate-400">
                {data.diagnoses.filter((d) => d.accepted !== false).length} of {data.diagnoses.length} selected
              </span>
            </div>

            {data.diagnoses.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                No diagnoses explicitly stated in this document.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.diagnoses.map((diag, index) => {
                  const isAccepted = diag.accepted !== false;
                  return (
                    <div
                      key={diag.id || index}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAccepted
                          ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                          : 'bg-slate-50 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">
                              {diag.name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              {diag.status || 'Active'}
                            </span>
                            {diag.date && (
                              <span className="text-xs text-slate-400">
                                Documented: {diag.date}
                              </span>
                            )}
                            {diag.confidence && (
                              <ConfidenceBadge level={diag.confidence} />
                            )}
                            {diag.reviewState && (
                              <ReviewStateBadge state={diag.reviewState} reason={diag.confidenceReason} />
                            )}
                          </div>

                          {/* Source citation */}
                          <div className="text-xs text-slate-500 flex items-center gap-2 pt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              Source: {document.documentType} — Page {diag.pageNumber || 1}
                            </span>
                            {diag.sourceLocation && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {diag.sourceLocation}
                              </span>
                            )}
                          </div>

                          {diag.confidenceReason && (
                            <div className="text-[11px] text-slate-600 font-medium">
                              Evidence: {diag.confidenceReason}
                            </div>
                          )}

                          {diag.sourceQuote && (
                            <div className="text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 mt-1 font-mono">
                              "{diag.sourceQuote}"
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEditingItem({
                                type: 'diagnosis',
                                item: diag,
                                index,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleDiagnosis(index)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                              isAccepted
                                ? 'text-rose-700 bg-rose-50/60 border-rose-200 hover:bg-rose-100'
                                : 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100'
                            }`}
                          >
                            {isAccepted ? (
                              <>
                                <Trash2 className="w-3 h-3" /> Exclude
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3" /> Include
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Medications */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-600" />
                Medications ({data.medications.length})
              </h3>
              <span className="text-xs text-slate-400">
                {data.medications.filter((m) => m.accepted !== false).length} of {data.medications.length} selected
              </span>
            </div>

            {data.medications.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                No medications explicitly prescribed or documented.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.medications.map((med, index) => {
                  const isAccepted = med.accepted !== false;
                  return (
                    <div
                      key={med.id || index}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAccepted
                          ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                          : 'bg-slate-50 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">
                              {med.name}
                            </span>
                            {med.genericName && (
                              <span className="text-xs text-slate-500">
                                ({med.genericName})
                              </span>
                            )}
                            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">
                              {med.dosage} · {med.frequency}
                            </span>
                            {med.route && (
                              <span className="text-xs text-slate-500">
                                Route: {med.route}
                              </span>
                            )}
                            {med.confidence && (
                              <ConfidenceBadge level={med.confidence} />
                            )}
                            {med.reviewState && (
                              <ReviewStateBadge state={med.reviewState} reason={med.confidenceReason} />
                            )}
                          </div>

                          {/* Source citation */}
                          <div className="text-xs text-slate-500 flex items-center gap-2 pt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              Source: {document.documentType} — Page {med.pageNumber || 1}
                            </span>
                            {med.sourceLocation && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {med.sourceLocation}
                              </span>
                            )}
                          </div>

                          {med.confidenceReason && (
                            <div className="text-[11px] text-slate-600 font-medium">
                              Evidence: {med.confidenceReason}
                            </div>
                          )}

                          {med.sourceQuote && (
                            <div className="text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 mt-1 font-mono">
                              "{med.sourceQuote}"
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEditingItem({
                                type: 'medication',
                                item: med,
                                index,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMedication(index)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                              isAccepted
                                ? 'text-rose-700 bg-rose-50/60 border-rose-200 hover:bg-rose-100'
                                : 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100'
                            }`}
                          >
                            {isAccepted ? (
                              <>
                                <Trash2 className="w-3 h-3" /> Exclude
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3" /> Include
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 5: Laboratory Results */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-600" />
                Laboratory Results ({data.labResults.length})
              </h3>
              <span className="text-xs text-slate-400">
                {data.labResults.filter((l) => l.accepted !== false).length} of {data.labResults.length} selected
              </span>
            </div>

            {data.labResults.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                No laboratory values or analytes in this record.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.labResults.map((lab, index) => {
                  const isAccepted = lab.accepted !== false;
                  return (
                    <div
                      key={lab.id || index}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAccepted
                          ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                          : 'bg-slate-50 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">
                              {lab.parameterName || lab.testName}
                            </span>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-purple-50 text-purple-800 rounded border border-purple-200">
                              {lab.value} {lab.unit}
                            </span>
                            {lab.referenceRange && (
                              <span className="text-xs text-slate-500">
                                Ref: {lab.referenceRange}
                              </span>
                            )}
                            {lab.interpretation && (
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                  lab.interpretation === 'Normal' || lab.interpretation === 'Target'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {lab.interpretation}
                              </span>
                            )}
                            {lab.confidence && (
                              <ConfidenceBadge level={lab.confidence} />
                            )}
                            {lab.reviewState && (
                              <ReviewStateBadge state={lab.reviewState} reason={lab.confidenceReason} />
                            )}
                          </div>

                          {/* Source citation */}
                          <div className="text-xs text-slate-500 flex items-center gap-2 pt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              Source: {document.documentType} — Page {lab.pageNumber || 1}
                            </span>
                            {lab.sourceLocation && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {lab.sourceLocation}
                              </span>
                            )}
                          </div>

                          {lab.confidenceReason && (
                            <div className="text-[11px] text-slate-600 font-medium">
                              Evidence: {lab.confidenceReason}
                            </div>
                          )}

                          {lab.sourceQuote && (
                            <div className="text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 mt-1 font-mono">
                              "{lab.sourceQuote}"
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEditingItem({
                                type: 'labResult',
                                item: lab,
                                index,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleLabResult(index)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                              isAccepted
                                ? 'text-rose-700 bg-rose-50/60 border-rose-200 hover:bg-rose-100'
                                : 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100'
                            }`}
                          >
                            {isAccepted ? (
                              <>
                                <Trash2 className="w-3 h-3" /> Exclude
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3" /> Include
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 6: Procedures */}
          {data.procedures.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  Procedures & Interventions ({data.procedures.length})
                </h3>
              </div>

              <div className="space-y-2.5">
                {data.procedures.map((proc, index) => {
                  const isAccepted = proc.accepted !== false;
                  return (
                    <div
                      key={proc.id || index}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAccepted
                          ? 'bg-white border-slate-200 shadow-2xs'
                          : 'bg-slate-50 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">
                              {proc.name}
                            </span>
                            {proc.date && (
                              <span className="text-xs text-slate-500">
                                Date: {proc.date}
                              </span>
                            )}
                            {proc.provider && (
                              <span className="text-xs text-slate-500">
                                Provider: {proc.provider}
                              </span>
                            )}
                            {proc.reviewState && (
                              <ReviewStateBadge state={proc.reviewState} reason={proc.confidenceReason} />
                            )}
                          </div>
                          {proc.sourceLocation && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {proc.sourceLocation}
                            </span>
                          )}
                          {proc.sourceQuote && (
                            <div className="text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1 rounded border border-slate-100 font-mono">
                              "{proc.sourceQuote}"
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEditingItem({
                                type: 'procedure',
                                item: proc,
                                index,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleProcedure(index)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${
                              isAccepted
                                ? 'text-rose-700 bg-rose-50/60 border-rose-200'
                                : 'text-teal-700 bg-teal-50 border-teal-200'
                            }`}
                          >
                            {isAccepted ? 'Exclude' : 'Include'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 7: Allergies */}
          {data.allergies.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  Allergies & Adverse Reactions ({data.allergies.length})
                </h3>
              </div>

              <div className="space-y-2.5">
                {data.allergies.map((all, index) => {
                  const isAccepted = all.accepted !== false;
                  return (
                    <div
                      key={all.id || index}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAccepted
                          ? 'bg-white border-slate-200 shadow-2xs'
                          : 'bg-slate-50 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-rose-900">
                              {all.substance}
                            </span>
                            {all.reaction && (
                              <span className="text-xs text-slate-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                Reaction: {all.reaction}
                              </span>
                            )}
                            {all.severity && (
                              <span className="text-xs text-slate-500">
                                Severity: {all.severity}
                              </span>
                            )}
                            {all.confidence && (
                              <ConfidenceBadge level={all.confidence} />
                            )}
                            {all.reviewState && (
                              <ReviewStateBadge state={all.reviewState} reason={all.confidenceReason} />
                            )}
                          </div>
                          {all.sourceLocation && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {all.sourceLocation}
                            </span>
                          )}
                          {all.sourceQuote && (
                            <div className="text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1 rounded border border-slate-100 font-mono">
                              "{all.sourceQuote}"
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEditingItem({
                                type: 'allergy',
                                item: all,
                                index,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAllergy(index)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${
                              isAccepted
                                ? 'text-rose-700 bg-rose-50/60 border-rose-200'
                                : 'text-teal-700 bg-teal-50 border-teal-200'
                            }`}
                          >
                            {isAccepted ? 'Exclude' : 'Include'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 8: Medical Encounter Events */}
          {data.medicalEvents && data.medicalEvents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Medical Encounter Events ({data.medicalEvents.length})
                </h3>
              </div>

              <div className="space-y-2.5">
                {data.medicalEvents.map((evt, index) => {
                  const isAccepted = evt.accepted !== false;
                  return (
                    <div
                      key={evt.id || index}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAccepted
                          ? 'bg-white border-slate-200 shadow-2xs'
                          : 'bg-slate-50 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">
                              {evt.title}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {evt.eventType}
                            </span>
                            <span className="text-xs text-slate-500">
                              Date: {evt.date}
                            </span>
                            {evt.facility && (
                              <span className="text-xs text-slate-500">
                                Facility: {evt.facility}
                              </span>
                            )}
                            {evt.reviewState && (
                              <ReviewStateBadge state={evt.reviewState} reason={evt.confidenceReason} />
                            )}
                          </div>

                          {evt.summary && (
                            <p className="text-xs text-slate-600 mt-1">
                              {evt.summary}
                            </p>
                          )}

                          {evt.sourceLocation && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {evt.sourceLocation}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEditingItem({
                                type: 'medicalEvent',
                                item: evt,
                                index,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMedicalEvent(index)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${
                              isAccepted
                                ? 'text-rose-700 bg-rose-50/60 border-rose-200'
                                : 'text-teal-700 bg-teal-50 border-teal-200'
                            }`}
                          >
                            {isAccepted ? 'Exclude' : 'Include'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 9: Clinical Notes */}
          {data.clinicalNotes && data.clinicalNotes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Clinical Notes & Observations
              </h3>
              <ul className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 list-disc list-inside">
                {data.clinicalNotes.map((note, i) => (
                  <li key={i} className="leading-relaxed">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirm Error */}
          {confirmError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{confirmError}</span>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{totalAcceptedCount}</span> of{' '}
            <span>{totalItemsCount} items</span> selected for confirmation
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
            >
              {isConfirmedSuccess ? 'Close' : 'Cancel'}
            </button>

            {!isConfirmedSuccess && (
              <button
                type="button"
                id="btn-confirm-extraction"
                onClick={handleConfirm}
                disabled={isConfirming || totalAcceptedCount === 0}
                className="px-5 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs flex items-center gap-2 transition-colors"
              >
                {isConfirming ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Confirming records...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm extracted information
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Modal for editing an individual extracted entity */}
        <EditExtractedItemModal
          editItem={activeEditingItem}
          onClose={() => setActiveEditingItem(null)}
          onSave={handleSaveItem}
        />
      </div>
    </div>
  );
};

// Confidence indicator component
function ConfidenceBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  if (level === 'High') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        High confidence
      </span>
    );
  }
  if (level === 'Medium') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
        Medium confidence
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
      Low confidence · Verify
    </span>
  );
}

// Review State indicator component
function ReviewStateBadge({ state, reason }: { state?: ReviewState; reason?: string }) {
  if (!state) return null;

  if (state === 'High Confidence') {
    return (
      <span
        title={reason || 'High confidence extraction'}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        High Confidence
      </span>
    );
  }
  if (state === 'Review Recommended') {
    return (
      <span
        title={reason || 'Review recommended prior to integration'}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-300"
      >
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        Review Recommended
      </span>
    );
  }
  if (state === 'Ambiguous') {
    return (
      <span
        title={reason || 'Ambiguous handwriting or unclear notation'}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-300"
      >
        <HelpCircle className="w-3 h-3 text-rose-600" />
        Ambiguous · Verify
      </span>
    );
  }
  return (
    <span
      title={reason || 'Incomplete details'}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-300"
    >
      <AlertTriangle className="w-3 h-3 text-slate-500" />
      Incomplete
    </span>
  );
}
