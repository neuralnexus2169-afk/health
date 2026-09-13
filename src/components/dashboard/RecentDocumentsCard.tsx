import React from 'react';
import {
  FileText,
  Calendar,
  Building2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { EnrichedDocument, formatDisplayDate } from '../../services/patientService';
import { DOCUMENT_TYPE_CONFIG, DocumentStatusBadge } from '../documents/DocumentItem';
import { NavigationRoute } from '../../types';

interface RecentDocumentsCardProps {
  documents: EnrichedDocument[];
  onNavigate: (route: NavigationRoute, docId?: string) => void;
  totalCount?: number;
}

export function RecentDocumentsCard({
  documents,
  onNavigate,
  totalCount,
}: RecentDocumentsCardProps) {
  // Show up to 4 recent documents
  const recentDocs = documents.slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-200/70 text-teal-800">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Recent Documents</h3>
            <span className="text-[11px] text-zinc-400">Institutional source records</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('documents')}
          className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>View all {totalCount ? `(${totalCount})` : ''}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recentDocs.length === 0 ? (
        <div className="text-center py-6 text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
          No medical documents indexed yet.
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {recentDocs.map((doc) => {
            const config = DOCUMENT_TYPE_CONFIG[doc.documentType] || DOCUMENT_TYPE_CONFIG.Other;
            const Icon = config.icon;

            return (
              <div
                key={doc.id}
                onClick={() => onNavigate('documents')}
                className="py-2.5 flex items-center justify-between gap-3 group cursor-pointer hover:bg-zinc-50/70 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${config.bgClass} ${config.colorClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 group-hover:text-teal-900 truncate">
                      {doc.fileName}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 truncate">
                      <span>{doc.documentType}</span>
                      <span className="text-zinc-300">·</span>
                      <span>{formatDisplayDate(doc.documentDate)}</span>
                      {doc.facilityName && (
                        <>
                          <span className="text-zinc-300">·</span>
                          <span className="truncate">{doc.facilityName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <DocumentStatusBadge status={doc.status} />
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
