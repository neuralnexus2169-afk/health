import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Calendar, Building2, User, FileText, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { MedicalEvent, MedicalDocument } from '../../types/medical';
import { resolveSourcesForModal } from '../../services/healthAssistantService';

interface SourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventIds: string[];
  documentIds: string[];
  initialSelectedId?: string;
  onNavigateToDocument?: (docId: string) => void;
}

export function SourceDetailModal({
  isOpen,
  onClose,
  eventIds,
  documentIds,
  initialSelectedId,
  onNavigateToDocument,
}: SourceDetailModalProps) {
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    resolveSourcesForModal(eventIds, documentIds)
      .then((res) => {
        setEvents(res.events);
        setDocuments(res.documents);
      })
      .finally(() => setLoading(false));
  }, [isOpen, eventIds, documentIds]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Documented Clinical Evidence"
      subtitle="Confirmed medical records cited to support this answer"
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Resolving confirmed source records...
          </div>
        ) : (
          <>
            {/* Cited Events */}
            {events.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Documented Encounters ({events.length})
                  </h4>
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmed In Database
                  </span>
                </div>

                <div className="space-y-3">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">
                              {evt.title}
                            </span>
                            <Badge variant="outline" className="text-[11px] py-0">
                              {evt.eventType}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {evt.eventDate}
                            </span>
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
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                        {evt.description}
                      </p>

                      {evt.documentFileName && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Source Document:</span>
                          <span className="font-mono text-slate-700">{evt.documentFileName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cited Documents */}
            {documents.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Supporting Documents ({documents.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <p className="text-xs font-medium text-slate-900 truncate" title={doc.fileName}>
                            {doc.fileName}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6">
                          {doc.documentType || 'Clinical Record'} · {doc.documentDate || 'Verified'}
                        </p>
                      </div>

                      {onNavigateToDocument && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToDocument(doc.id);
                          }}
                          className="shrink-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View document"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {events.length === 0 && documents.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                No direct record links available for this citation.
              </div>
            )}
          </>
        )}

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
