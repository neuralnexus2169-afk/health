import React from 'react';
import { Pill, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { HealthSummaryMedication } from '../../types/medical';

interface MedicationSummaryProps {
  medications: HealthSummaryMedication[];
  onSelectSources: (sourceEventIds: string[], contextTitle: string, claimText: string) => void;
}

export function MedicationSummary({ medications, onSelectSources }: MedicationSummaryProps) {
  if (!medications || medications.length === 0) {
    return null;
  }

  return (
    <div id="medication-summary-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Pill className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Medication History</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {medications.length} regimen{medications.length === 1 ? '' : 's'} tracked
        </span>
      </div>

      <div className="space-y-3">
        {medications.map((med, idx) => {
          const sourceCount = med.sourceEventIds?.length || 0;

          return (
            <div
              key={idx}
              className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{med.name}</span>
                </h4>

                {sourceCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectSources(med.sourceEventIds, med.name, med.summary)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-medium transition-colors cursor-pointer border border-indigo-200/60 self-start sm:self-auto"
                  >
                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                    <span>{sourceCount} source{sourceCount === 1 ? '' : 's'}</span>
                    <ArrowUpRight className="w-3 h-3 text-indigo-500" />
                  </button>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {med.summary}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
