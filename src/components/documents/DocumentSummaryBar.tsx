import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  Layers,
} from 'lucide-react';
import { DocumentSummary } from '../../services/patientService';

interface DocumentSummaryBarProps {
  summary: DocumentSummary;
  filteredCount?: number;
  isLoading?: boolean;
}

export function DocumentSummaryBar({
  summary,
  filteredCount,
  isLoading = false,
}: DocumentSummaryBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 bg-white rounded-xl border border-zinc-200/80 p-4 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const isFiltered = filteredCount !== undefined && filteredCount !== summary.totalCount;

  const cards = [
    {
      label: 'Total Documents',
      value: summary.totalCount,
      subtext: isFiltered ? `${filteredCount} matching filters` : 'Institutional records',
      icon: FileText,
      iconColor: 'text-zinc-600',
      iconBg: 'bg-zinc-100',
      badge: isFiltered ? 'Filtered' : undefined,
    },
    {
      label: 'Confirmed',
      value: (summary.confirmedCount ?? 0) + (summary.processedCount - (summary.confirmedCount ?? 0)),
      subtext: 'Verified into timeline',
      icon: CheckCircle2,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-50',
    },
    {
      label: 'Needs Review',
      value: summary.needsReviewCount,
      subtext: 'Clinical check required',
      icon: AlertCircle,
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-50',
      highlight: summary.needsReviewCount > 0,
    },
    {
      label: 'Ready for AI',
      value: summary.uploadedCount || summary.processingCount,
      subtext: 'Awaiting extraction',
      icon: Clock,
      iconColor: 'text-teal-700',
      iconBg: 'bg-teal-50',
      pulse: summary.processingCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`bg-white border rounded-xl p-4 sm:p-4.5 shadow-2xs transition-all ${
              card.highlight
                ? 'border-amber-200/90 bg-amber-50/20'
                : 'border-zinc-200/80 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-500 truncate">
                {card.label}
              </span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg} ${card.iconColor}`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${card.pulse ? 'animate-spin' : ''}`}
                />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-tabular">
                {card.value}
              </span>
              {card.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/60">
                  {card.badge}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-zinc-400 font-medium truncate">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
