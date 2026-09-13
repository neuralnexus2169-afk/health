import React from 'react';
import { Stethoscope, Calendar, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { HealthSummaryCondition } from '../../types/medical';

interface ConditionsSummaryProps {
  conditions: HealthSummaryCondition[];
  onSelectSources: (sourceEventIds: string[], contextTitle: string, claimText: string) => void;
}

export function ConditionsSummary({ conditions, onSelectSources }: ConditionsSummaryProps) {
  if (!conditions || conditions.length === 0) {
    return null;
  }

  const getStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('active')) return 'default';
    if (s.includes('resolved') || s.includes('remission')) return 'secondary';
    return 'outline';
  };

  return (
    <div id="conditions-summary-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Documented Conditions</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {conditions.length} condition{conditions.length === 1 ? '' : 's'} recorded
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {conditions.map((cond, idx) => {
          const sourceCount = cond.sourceEventIds?.length || 0;

          return (
            <div
              key={idx}
              className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-teal-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {cond.name}
                  </h4>
                  <Badge
                    variant={getStatusVariant(cond.status) as any}
                    className="text-[11px] font-semibold shrink-0"
                  >
                    {cond.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">First:</span>
                    <strong className="text-slate-700 font-medium">{cond.firstDocumented}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">Latest:</span>
                    <strong className="text-slate-700 font-medium">{cond.lastDocumented}</strong>
                  </span>
                </div>
              </div>

              {/* Source button */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Clinical evidence:</span>
                {sourceCount > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      onSelectSources(
                        cond.sourceEventIds,
                        cond.name,
                        `${cond.name} documented from ${cond.firstDocumented} through ${cond.lastDocumented} (${cond.status}).`
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 font-medium transition-colors cursor-pointer border border-teal-200/60"
                  >
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    <span>{sourceCount} source{sourceCount === 1 ? '' : 's'}</span>
                    <ArrowUpRight className="w-3 h-3 text-teal-500" />
                  </button>
                ) : (
                  <span className="text-slate-400 italic">Confirmed record</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
