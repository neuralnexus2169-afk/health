import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadRecordModal({ isOpen, onClose }: UploadRecordModalProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileName(e.target.files[0].name);
    }
  };

  const handleSimulatedSubmit = () => {
    if (!selectedFileName) return;
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedFileName(null);
      onClose();
    }, 1500);
  };

  const handleReset = () => {
    setSelectedFileName(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Upload Medical Record"
      subtitle="Supported formats: PDF, CCDA, DICOM summary, or high-resolution clinical scans."
      maxWidth="md"
    >
      <div className="space-y-4">
        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900">
              Record Queued for Timeline Extraction
            </h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              File &ldquo;{selectedFileName}&rdquo; received. Step 1 shell verified.
            </p>
          </div>
        ) : (
          <>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-zinc-200 hover:border-zinc-300 rounded-xl p-6 text-center transition-colors bg-zinc-50/50 cursor-pointer"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.xml"
                onChange={handleFileChange}
              />

              <div className="mx-auto w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 mb-3 shadow-2xs">
                <UploadCloud className="w-5 h-5 text-teal-700" />
              </div>

              <div className="text-xs font-semibold text-zinc-800">
                Click to select a file <span className="text-zinc-400 font-normal">or drag and drop</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Clinical summaries, discharge letters, lab reports up to 25MB
              </p>

              {selectedFileName && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200/80 text-xs font-medium text-teal-800">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{selectedFileName}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200/60 flex items-start gap-2.5 text-xs text-zinc-500">
              <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Step 1 preview: backend document parsing and HIPAA OCR will be connected in Step 2. Files are not persisted to external servers during Step 1.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedFileName}
                onClick={handleSimulatedSubmit}
              >
                Queue Record
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
