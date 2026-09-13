import React from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import { HealthAssistantPotentialInconsistency } from '../../types/medical';

interface InconsistencyBannerProps {
  inconsistency: HealthAssistantPotentialInconsistency;
  onNavigateToDocument?: (docId: string) => void;
}

export function InconsistencyBanner({
  inconsistency,
  onNavigateToDocument,
}: InconsistencyBannerProps) {
  if (!inconsistency || !inconsistency.detected) return null;

  return (
    <div className="my-3.5 p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-slate-800">
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-xs font-semibold text-amber-950 uppercase tracking-wider">
              Potential Documentation Inconsistency
            </h5>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              Needs Clinical Review
            </span>
          </div>

          <p className="text-xs text-amber-900 mt-1 leading-relaxed">
            {inconsistency.description}
          </p>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {inconsistency.records.map((rec, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-amber-200/90 bg-white/90 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                  <span>{rec.label}</span>
                  {rec.documentFileName && (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                      <FileText className="w-3 h-3 text-slate-400" />
                      {rec.documentFileName}
                    </span>
                  )}
                </div>
                <p className="text-xs font-serif italic text-slate-900 bg-amber-50/40 p-2 rounded border border-amber-100 leading-normal">
                  "{rec.details}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
