import React from 'react';
import { FileX2, Upload, RotateCcw } from 'lucide-react';
import { EnrichedDocument } from '../../services/patientService';
import { DocumentItem } from './DocumentItem';
import { Button } from '../ui/Button';

interface DocumentListProps {
  documents: EnrichedDocument[];
  onSelectDocument: (doc: EnrichedDocument) => void;
  onExtractDocument?: (doc: EnrichedDocument) => void;
  onReviewDocument?: (doc: EnrichedDocument) => void;
  onOpenUpload: () => void;
  onResetFilters: () => void;
  isFiltered: boolean;
  isLoading?: boolean;
}

export function DocumentList({
  documents,
  onSelectDocument,
  onExtractDocument,
  onReviewDocument,
  onOpenUpload,
  onResetFilters,
  isFiltered,
  isLoading = false,
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-28 bg-white rounded-xl border border-zinc-200/80 p-5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center shadow-2xs">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
          <FileX2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-zinc-900">
          {isFiltered ? 'No matching documents found' : 'No medical documents'}
        </h3>

        <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
          {isFiltered
            ? 'No records match your selected document type, status, or search query. Try adjusting your filters.'
            : 'Upload your first medical document.'}
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          {isFiltered ? (
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={onResetFilters}
            >
              Reset all filters
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={onOpenUpload}
            >
              Upload document
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <DocumentItem
          key={doc.id}
          document={doc}
          onSelect={onSelectDocument}
          onExtract={onExtractDocument}
          onReview={onReviewDocument}
        />
      ))}
    </div>
  );
}
