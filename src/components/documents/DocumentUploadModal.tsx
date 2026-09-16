import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileUp,
  Trash2,
} from 'lucide-react';
import { DocumentType } from '../../types/medical';
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

type FileStatus = 'pending' | 'uploading' | 'processing' | 'ready' | 'error';

interface SelectedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  documentType: DocumentType;
  documentDate: string;
  facilityName: string;
  providerName: string;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  onDocumentCreated,
  patientId = DEFAULT_PATIENT_ID,
}: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setGlobalError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const detectDocumentType = (fileName: string): DocumentType => {
    const lower = fileName.toLowerCase();
    if (lower.includes('lab') || lower.includes('blood')) return 'Lab Report';
    if (lower.includes('rx') || lower.includes('prescription')) return 'Prescription';
    if (lower.includes('discharge')) return 'Discharge Summary';
    if (lower.includes('xray') || lower.includes('mri') || lower.includes('imaging')) return 'Imaging Report';
    if (lower.includes('vaccine') || lower.includes('immunization')) return 'Vaccination Record';
    return 'Consultation Note';
  };

  const handleFilesSelect = (files: FileList | File[]) => {
    setGlobalError(null);
    const newSelectedFiles: SelectedFile[] = [];

    Array.from(files).forEach((file) => {
      const validation = validateDocumentFile(file);
      
      const newFile: SelectedFile = {
        id: Math.random().toString(36).substring(2, 9),
        file,
        status: validation.isValid ? 'pending' : 'error',
        progress: 0,
        error: validation.isValid ? undefined : validation.error || 'Unsupported file type or size.',
        documentType: detectDocumentType(file.name),
        documentDate: new Date().toISOString().split('T')[0],
        facilityName: 'Meridian Medical Centre',
        providerName: '',
      };
      
      newSelectedFiles.push(newFile);
    });

    setSelectedFiles((prev) => [...prev, ...newSelectedFiles]);
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
      handleFilesSelect(e.dataTransfer.files);
    }
  };
  
  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };
  
  const handleUpdateFileMetadata = (id: string, updates: Partial<SelectedFile>) => {
    setSelectedFiles((prev) => 
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const pendingFiles = selectedFiles.filter(f => f.status === 'pending' || f.status === 'error');
    const validPendingFiles = selectedFiles.filter(f => f.status === 'pending');
    
    if (validPendingFiles.length === 0) {
      setGlobalError('Please select at least one valid medical document to upload.');
      return;
    }

    setIsSubmitting(true);
    
    // Process files with limited concurrency (e.g., 2 at a time)
    const concurrency = 2;
    let index = 0;
    
    const processNext = async (): Promise<void> => {
      if (index >= validPendingFiles.length) return;
      
      const fileToUpload = validPendingFiles[index++];
      
      // Update status to uploading
      handleUpdateFileMetadata(fileToUpload.id, { status: 'uploading', progress: 20 });
      
      try {
        // 1. Store file in decoupled DocumentStorage abstraction
        const storedFile = await documentStorage.upload(fileToUpload.file);
        handleUpdateFileMetadata(fileToUpload.id, { progress: 55, status: 'processing' });

        const safeName = sanitizeFileName(fileToUpload.file.name);
        const newDocId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // Create Document in database/service repository
        await createDocument({
          id: newDocId,
          patientId,
          fileName: safeName,
          documentType: fileToUpload.documentType,
          documentDate: fileToUpload.documentDate,
          facilityName: fileToUpload.facilityName.trim() || 'Institutional Health Facility',
          providerName: fileToUpload.providerName.trim() || undefined,
          status: 'Processing',
          pageCount: fileToUpload.file.type === 'application/pdf' ? 2 : 1, // Estimate for now
          fileSizeBytes: fileToUpload.file.size,
          extractedTextSnippet: `Ingested medical record: ${safeName}. Clinical extraction and terminology normalization scheduled.`,
        });

        // Trigger AI Extraction with base64 data
        try {
          await fetch(`/api/documents/${newDocId}/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data: storedFile?.dataUrl,
              mimeType: storedFile?.contentType,
              fileName: safeName,
              documentType: fileToUpload.documentType,
            }),
          });
        } catch (extractErr) {
          console.error('Extraction trigger error for', newDocId, extractErr);
        }

        handleUpdateFileMetadata(fileToUpload.id, { progress: 100, status: 'ready' });
      } catch (err: any) {
        console.error(`Document upload error for ${fileToUpload.file.name}:`, err);
        handleUpdateFileMetadata(fileToUpload.id, { 
          status: 'error', 
          error: err.message || 'Failed to upload document.' 
        });
      }
      
      await processNext();
    };
    
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
      workers.push(processNext());
    }
    
    await Promise.all(workers);
    
    // Check if any uploads succeeded to trigger parent refresh
    const anySuccess = selectedFiles.some(f => f.status === 'ready') || validPendingFiles.some(f => f.status === 'ready' || !f.error); // We don't check state since it might lag
    if (anySuccess) {
       onDocumentCreated();
    }
    
    setIsSubmitting(false);
  };
  
  const hasPendingOrErrorFiles = selectedFiles.some(f => f.status === 'pending' || f.status === 'error');
  const allComplete = selectedFiles.length > 0 && selectedFiles.every(f => f.status === 'ready');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
        className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-50/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-50 border border-teal-200/70 text-teal-800">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Upload Medical Records
                </h3>
                <p className="text-xs text-zinc-500">
                  Upload one or more medical documents. HealthTimeline will extract the information and let you review it before adding it to your record.
                </p>
              </div>
            </div>

            {!isSubmitting && (
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
            {allComplete && !isSubmitting ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 animate-in zoom-in-50 duration-300">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-zinc-900">
                    Documents Queued Successfully
                  </h4>
                  <p className="text-sm text-zinc-500 max-w-sm mx-auto mt-1">
                    Your documents have been stored securely and are being processed.
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="primary" fullWidth onClick={onClose}>
                    Done
                  </Button>
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
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-teal-700 bg-teal-50/50'
                      : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFilesSelect(e.target.files);
                        if (fileInputRef.current) {
                           fileInputRef.current.value = ''; // Reset input so same file can be selected again
                        }
                      }
                    }}
                  />

                  <div className="space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-semibold text-zinc-800">
                      Click to select files or drag and drop
                    </div>
                    <p className="text-xs text-zinc-400">
                      Supported formats: PDF, JPG, JPEG, PNG
                    </p>
                  </div>
                </div>

                {/* Validation Error Banner */}
                {globalError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{globalError}</span>
                  </div>
                )}
                
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-zinc-800">
                      Selected documents ({selectedFiles.length})
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {selectedFiles.map((f) => (
                        <div key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-zinc-200 bg-white shadow-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                              f.status === 'ready' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              f.status === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                              'bg-zinc-50 border-zinc-200 text-zinc-500'
                            }`}>
                              {f.status === 'ready' ? <CheckCircle2 className="w-5 h-5" /> : 
                               f.status === 'error' ? <AlertCircle className="w-5 h-5" /> : 
                               <FileText className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-zinc-900 truncate" title={f.file.name}>
                                {f.file.name}
                              </div>
                              <div className="text-xs flex items-center gap-2">
                                <span className="text-zinc-500">{(f.file.size / 1024).toFixed(0)} KB</span>
                                {f.status === 'error' ? (
                                  <span className="text-rose-600 font-medium truncate">{f.error}</span>
                                ) : f.status === 'ready' ? (
                                  <span className="text-emerald-600 font-medium">Ready</span>
                                ) : f.status === 'uploading' || f.status === 'processing' ? (
                                  <span className="text-teal-600 font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3 animate-spin" /> {f.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400">Pending</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* File metadata overrides (only editable when pending or error) */}
                          {(f.status === 'pending' || f.status === 'error') && !f.error && (
                             <div className="flex items-center gap-2 w-full sm:w-auto">
                               <select 
                                 className="text-xs bg-zinc-50 border border-zinc-200 rounded px-2 py-1 max-w-[120px]"
                                 value={f.documentType}
                                 onChange={(e) => handleUpdateFileMetadata(f.id, { documentType: e.target.value as DocumentType })}
                               >
                                  {DOCUMENT_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                               </select>
                               <input 
                                  type="date"
                                  className="text-xs bg-zinc-50 border border-zinc-200 rounded px-2 py-1 max-w-[120px]"
                                  value={f.documentDate}
                                  onChange={(e) => handleUpdateFileMetadata(f.id, { documentDate: e.target.value })}
                               />
                             </div>
                          )}
                          
                          <div className="flex items-center shrink-0 ml-auto sm:ml-0">
                             {(f.status === 'pending' || f.status === 'error') && !isSubmitting && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(f.id)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>Processed locally & stored securely</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="secondary" size="sm" onClick={onClose} type="button" disabled={isSubmitting}>
                      Cancel
                    </Button>
                    {hasPendingOrErrorFiles && (
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        disabled={isSubmitting || selectedFiles.filter(f => f.status === 'pending').length === 0}
                        icon={isSubmitting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      >
                        {isSubmitting ? 'Processing...' : `Upload ${selectedFiles.filter(f => !f.error && f.status === 'pending').length} Document(s)`}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
