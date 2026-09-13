import React, { useState } from 'react';
import { Calendar, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { SourceDetailModal } from './SourceDetailModal';

interface SourceChipsProps {
  sourceEventIds?: string[];
  sourceDocumentIds?: string[];
  onNavigateToDocument?: (docId: string) => void;
}

export function SourceChips({
  sourceEventIds = [],
  sourceDocumentIds = [],
  onNavigateToDocument,
}: SourceChipsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const totalSources = sourceEventIds.length + sourceDocumentIds.length;
  if (totalSources === 0) return null;

  return (
    <div className="mt-3.5 pt-3 border-t border-slate-100">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Sources:
        </span>

        {sourceEventIds.slice(0, 3).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSelectedId(id);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/60"
          >
            <Calendar className="w-3 h-3 text-slate-500" />
            <span className="truncate max-w-[140px] font-mono text-[11px]">{id}</span>
          </button>
        ))}

        {sourceDocumentIds.slice(0, 2).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSelectedId(id);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50/80 hover:bg-blue-100/80 text-blue-800 transition-colors border border-blue-200/60"
          >
            <FileText className="w-3 h-3 text-blue-600" />
            <span className="truncate max-w-[140px] font-mono text-[11px]">{id}</span>
          </button>
        ))}

        {totalSources > 5 && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium px-1.5 py-0.5"
          >
            +{totalSources - 5} more
          </button>
        )}

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline py-0.5"
        >
          View Evidence
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <SourceDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        eventIds={sourceEventIds}
        documentIds={sourceDocumentIds}
        initialSelectedId={selectedId}
        onNavigateToDocument={onNavigateToDocument}
      />
    </div>
  );
}
