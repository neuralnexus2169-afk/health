import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  User,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileUp,
} from 'lucide-react';
import { DocumentType, DocumentStatus } from '../../types/medical';
import {
  documentStorage,
  validateDocumentFile,
  sanitizeFileName,
} from '../../lib/storage/documentStorage';
import { createDocument, DEFAULT_PATIENT_ID } from '../../services/patientService';
import { Button } from '../ui/Button';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated: () => void;
  patientId?: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'Prescription',
  'Lab Report',
  'Discharge Summary',
  'Consultation Note',
  'Imaging Report',
  'Medical Bill',
  'Vaccination Record',
  'Other',
];

const PRESET_FACILITIES = [
  'Meridian Medical Centre',
  'CityCare Hospital',
  'Lakeside Diagnostics',
  'Green Valley Specialty Clinic',
  'Other Healthcare Facility',
];

type UploadStep = 'select' | 'uploading' | 'processing' | 'complete';

export function DocumentUploadModal({
  isOpen,
  onClose,
  onDocumentCreated,
  patientId = DEFAULT_PATIENT_ID,
}: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form Fields
  const [documentType, setDocumentType] = useState<DocumentType>('Consultation Note');
  const [documentDate, setDocumentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [facilityName, setFacilityName] = useState<string>('Meridian Medical Centre');
  const [providerName, setProviderName] = useState<string>('Dr. Sarah Jenkins, MD');

  // Pipeline State
  const [step, setStep] = useState<UploadStep>('select');
  const [progress, setProgress] = useState(0);
  const [processingStatusText, setProcessingStatusText] = useState('Uploading document to secure storage...');

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setValidationError(null);
      setStep('select');
      setProgress(0);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && step !== 'uploading' && step !== 'processing') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, step]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setValidationError(null);
    const validation = validateDocumentFile(file);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid file.');
      return;
    }

    setSelectedFile(file);

    // Auto-detect type from file name if helpful
    const lower = file.name.toLowerCase();
    if (lower.includes('lab') || lower.includes('blood')) {
      setDocumentType('Lab Report');
    } else if (lower.includes('rx') || lower.includes('prescription')) {
      setDocumentType('Prescription');
    } else if (lower.includes('discharge')) {
      setDocumentType('Discharge Summary');
    } else if (lower.includes('xray') || lower.includes('mri') || lower.includes('imaging')) {
      setDocumentType('Imaging Report');
    } else if (lower.includes('vaccine') || lower.includes('immunization')) {
      setDocumentType('Vaccination Record');
    }

    // Create local preview if image
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError('Please select a medical document to upload.');
      return;
    }

    setStep('uploading');
    setProgress(20);
    setProcessingStatusText('Encrypting & storing file in document storage...');

    try {
      // 1. Store file in decoupled DocumentStorage abstraction
      const stored = await documentStorage.upload(selectedFile);
      setProgress(55);

      // 2. Set status to "Processing"
      setStep('processing');
      setProcessingStatusText('Ingesting record into clinical pipeline...');
      setProgress(75);

      const safeName = sanitizeFileName(selectedFile.name);
      const newDocId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Create Document in database/service repository
      await createDocument({
        id: newDocId,
        patientId,
        fileName: safeName,
        documentType,
        documentDate,
        facilityName: facilityName.trim() || 'Institutional Health Facility',
        providerName: providerName.trim() || undefined,
        status: 'Processing',
        pageCount: selectedFile.type === 'application/pdf' ? 2 : 1,
        fileSizeBytes: selectedFile.size,
        extractedTextSnippet: `Ingested medical record: ${safeName}. Clinical extraction and terminology normalization scheduled.`,
      });

      setProgress(90);
      setProcessingStatusText('Finalizing document index...');

      // Simulated transition to complete
      setTimeout(() => {
        setProgress(100);
        setStep('complete');
        onDocumentCreated();
      }, 1200);
    } catch (err: any) {
      console.error('Document upload error:', err);
      setValidationError(err.message || 'Failed to upload document.');
      setStep('select');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => {
          if (step !== 'uploading' && step !== 'processing') {
            onClose();
          }
        }}
        className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl border border-zinc-200 animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-50/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-50 border border-teal-200/70 text-teal-800">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Upload Medical Document
                </h3>
                <p className="text-xs text-zinc-500">
                  Securely index PDF reports, prescriptions, and lab records
                </p>
              </div>
            </div>

            {step !== 'uploading' && step !== 'processing' && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {step === 'complete' ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 animate-in zoom-in-50 duration-300">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-zinc-900">
                    Document Ingested Successfully
                  </h4>
                  <p className="text-sm text-zinc-500 max-w-sm mx-auto mt-1">
                    "{selectedFile?.name}" has been stored and registered in the patient's record vault.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-center justify-center gap-2 max-w-sm mx-auto">
                  <Clock className="w-4 h-4 text-teal-800 shrink-0" />
                  <span>Status: <strong>Processing</strong> (Indexing underway)</span>
                </div>
                <div className="pt-4">
                  <Button variant="primary" fullWidth onClick={onClose}>
                    Done
                  </Button>
                </div>
              </div>
            ) : step === 'uploading' || step === 'processing' ? (
              <div className="py-8 text-center space-y-5">
                <div className="mx-auto w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 animate-pulse">
                  <Clock className="w-7 h-7 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-zinc-900">
                    {step === 'uploading' ? 'Uploading Document...' : 'Processing Medical Record...'}
                  </h4>
                  <p className="text-xs text-zinc-500">
                    {processingStatusText}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-sm mx-auto space-y-1.5">
                  <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-700 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] font-semibold text-zinc-400">
                    {progress}%
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500 max-w-sm mx-auto flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-800 shrink-0" />
                  <span>Client-side decoupled storage abstraction</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Drag-and-drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-teal-700 bg-teal-50/50'
                      : selectedFile
                      ? 'border-teal-700/60 bg-teal-50/20'
                      : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-800 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-bold text-zinc-900 truncate">
                            {selectedFile.name}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {(selectedFile.size / 1024).toFixed(0)} KB · Ready for ingestion
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFilePreviewUrl(null);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-semibold text-zinc-800">
                        Drop a medical document here, or{' '}
                        <span className="text-teal-800 underline">browse files</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        PDF, JPG or PNG · Maximum 10 MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Validation Error Banner */}
                {validationError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Metadata Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Document Type */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Document Type
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Document Date */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Document Date
                    </label>
                    <input
                      type="date"
                      value={documentDate}
                      onChange={(e) => setDocumentDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  {/* Healthcare Facility */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Healthcare Facility
                    </label>
                    <input
                      type="text"
                      list="facility-presets"
                      placeholder="e.g. Meridian Medical Centre, CityCare Hospital..."
                      value={facilityName}
                      onChange={(e) => setFacilityName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                    <datalist id="facility-presets">
                      {PRESET_FACILITIES.map((fac) => (
                        <option key={fac} value={fac} />
                      ))}
                    </datalist>
                  </div>

                  {/* Attending Provider */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Attending Provider (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Sarah Jenkins, MD"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100">
                  <Button variant="secondary" size="sm" onClick={onClose} type="button">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={!selectedFile}
                    icon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Upload and Process
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
