import React from 'react';
import {
  FileText,
  Pill,
  FlaskConical,
  Building2,
  Stethoscope,
  Scan,
  Receipt,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  User,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EnrichedDocument, formatDisplayDate } from '../../services/patientService';
import { DocumentType, DocumentStatus } from '../../types/medical';
import { Badge } from '../ui/Badge';

interface DocumentItemProps {
  key?: string;
  document: EnrichedDocument;
  onSelect: (document: EnrichedDocument) => void;
}

export const DOCUMENT_TYPE_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
    label: string;
  }
> = {
  Prescription: {
    icon: Pill,
    colorClass: 'text-teal-700',
    bgClass: 'bg-teal-50 border-teal-200/80',
    label: 'Prescription',
  },
  'Lab Report': {
    icon: FlaskConical,
    colorClass: 'text-blue-700',
    bgClass: 'bg-sky-50 border-sky-200/80',
    label: 'Lab Report',
  },
  'Discharge Summary': {
    icon: Building2,
    colorClass: 'text-rose-700',
    bgClass: 'bg-rose-50 border-rose-200/80',
    label: 'Discharge Summary',
  },
  'Consultation Note': {
    icon: Stethoscope,
    colorClass: 'text-zinc-700',
    bgClass: 'bg-zinc-100 border-zinc-200',
    label: 'Consultation Note',
  },
  'Imaging Report': {
    icon: Scan,
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50 border-purple-200/80',
    label: 'Imaging Report',
  },
  'Medical Bill': {
    icon: Receipt,
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50 border-amber-200/80',
    label: 'Medical Bill',
  },
  'Vaccination Record': {
    icon: ShieldCheck,
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200/80',
    label: 'Vaccination Record',
  },
  Other: {
    icon: FileText,
    colorClass: 'text-zinc-600',
    bgClass: 'bg-zinc-50 border-zinc-200',
    label: 'Medical Document',
  },
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  switch (status) {
    case 'Confirmed':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Confirmed</span>
        </span>
      );
    case 'Processed':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Processed</span>
        </span>
      );
    case 'Needs Review':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 whitespace-nowrap">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>Needs Review</span>
        </span>
      );
    case 'Processing':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200/70 whitespace-nowrap">
          <Clock className="w-3 h-3 text-sky-600 animate-spin" />
          <span>Processing</span>
        </span>
      );
    case 'Uploaded':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 whitespace-nowrap">
          <span>Uploaded</span>
        </span>
      );
    case 'Failed':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 whitespace-nowrap">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Failed</span>
        </span>
      );
    default:
      return null;
  }
}

interface DocumentItemProps {
  document: EnrichedDocument;
  onSelect: (document: EnrichedDocument) => void;
  onExtract?: (document: EnrichedDocument) => void;
  onReview?: (document: EnrichedDocument) => void;
}

export function DocumentItem({
  document: doc,
  onSelect,
  onExtract,
  onReview,
}: DocumentItemProps) {
  const config = DOCUMENT_TYPE_CONFIG[doc.documentType] || DOCUMENT_TYPE_CONFIG.Other;
  const Icon = config.icon;

  const formattedDate = formatDisplayDate(doc.documentDate);
  const eventsCount = doc.events.length;
  const sourcesCount = doc.sourceReferences.length;

  return (
    <div
      onClick={() => onSelect(doc)}
      className="group bg-white hover:bg-zinc-50/70 border border-zinc-200/80 hover:border-zinc-300 rounded-xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs cursor-pointer text-left"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Document Icon Box */}
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border ${config.bgClass} ${config.colorClass} shadow-2xs group-hover:scale-105 transition-transform`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Primary Document Information */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-teal-900 transition-colors truncate">
                {doc.fileName}
              </h3>
              {doc.pageCount && (
                <span className="text-[11px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.2 rounded shrink-0">
                  {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}
                </span>
              )}
            </div>

            {/* Status Badge */}
            <div className="shrink-0 self-start sm:self-center">
              <DocumentStatusBadge status={doc.status} />
            </div>
          </div>

          {/* Secondary Subtext Line: Type · Date · Facility */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-700">{doc.documentType}</span>
            <span className="text-zinc-300">·</span>
            <div className="flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3 text-zinc-400" />
              <span>{formattedDate}</span>
            </div>
            {doc.facilityName && (
              <>
                <span className="text-zinc-300">·</span>
                <div className="flex items-center gap-1 truncate font-medium text-zinc-600">
                  <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate">{doc.facilityName}</span>
                </div>
              </>
            )}
            {doc.providerName && (
              <>
                <span className="text-zinc-300">·</span>
                <div className="flex items-center gap-1 truncate text-zinc-500">
                  <User className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate">{doc.providerName}</span>
                </div>
              </>
            )}
          </div>

          {/* Snippet / preview teaser if available */}
          {doc.extractedTextSnippet && (
            <p className="mt-2 text-xs text-zinc-500 line-clamp-1 italic font-serif">
              "{doc.extractedTextSnippet}"
            </p>
          )}

          {/* Bottom Relationship Badges: Extracted events and source traces */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {eventsCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/50">
                  <Layers className="w-3 h-3 text-teal-700" />
                  <span>
                    {eventsCount} {eventsCount === 1 ? 'associated event' : 'associated events'}
                  </span>
                </span>
              ) : (
                <span className="text-[11px] text-zinc-400">
                  No timeline events linked yet
                </span>
              )}

              {sourcesCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                  <span>
                    {sourcesCount} {sourcesCount === 1 ? 'source reference' : 'source references'}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {doc.status === 'Uploaded' && onExtract && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExtract(doc);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-teal-700" />
                  <span>Extract info</span>
                </button>
              )}

              {doc.status === 'Needs Review' && onReview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReview(doc);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
                >
                  <AlertCircle className="w-3 h-3 text-amber-700" />
                  <span>Review extraction</span>
                </button>
              )}

              <div className="flex items-center gap-1 text-xs font-semibold text-teal-800 group-hover:text-teal-900">
                <span>View details</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
