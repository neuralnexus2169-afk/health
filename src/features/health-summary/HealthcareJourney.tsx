import React from 'react';
import {
  Compass,
  Building2,
  Calendar,
  ShieldCheck,
  ArrowUpRight,
  AlertTriangle,
  FileCheck,
  Stethoscope,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { HealthSummaryJourneyItem } from '../../types/medical';

interface HealthcareJourneyProps {
  journey: HealthSummaryJourneyItem[];
  onSelectSources: (sourceEventIds: string[], contextTitle: string, claimText: string) => void;
}

export function HealthcareJourney({ journey, onSelectSources }: HealthcareJourneyProps) {
  if (!journey || journey.length === 0) {
    return null;
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Hospitalization':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Hospitalization
          </span>
        );
      case 'Investigation':
      case 'Procedure':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <FileCheck className="w-3 h-3 text-emerald-600" />
            {category}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Stethoscope className="w-3 h-3 text-blue-600" />
            Consultation
          </span>
        );
    }
  };

  return (
    <div id="healthcare-journey-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
            <Compass className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Healthcare Journey</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {journey.length} clinical milestone{journey.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-3.5 pl-6 space-y-6">
        {journey.map((item, idx) => {
          const sourceCount = item.sourceEventIds?.length || 0;

          return (
            <div key={idx} className="relative group">
              {/* Timeline point dot */}
              <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-teal-600 shadow-2xs group-hover:scale-125 transition-transform" />

              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-teal-200 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(item.category)}
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.date}
                    </span>
                  </div>

                  {sourceCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onSelectSources(
                          item.sourceEventIds,
                          `${item.category} (${item.date})`,
                          item.summary
                        )
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-medium transition-colors cursor-pointer border border-teal-200/60 self-start sm:self-auto"
                    >
                      <ShieldCheck className="w-3 h-3 text-teal-600" />
                      <span>{sourceCount} source{sourceCount === 1 ? '' : 's'}</span>
                      <ArrowUpRight className="w-3 h-3 text-teal-500" />
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
