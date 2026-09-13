import React from 'react';
import { CalendarRange, Activity, UserCheck, Building2 } from 'lucide-react';
import { TimelineSummary } from '../../services/patientService';

interface TimelineSummaryBarProps {
  summary: TimelineSummary;
  filteredCount: number;
  totalCount: number;
  isLoading?: boolean;
}

export function TimelineSummaryBar({
  summary,
  filteredCount,
  totalCount,
  isLoading = false,
}: TimelineSummaryBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 bg-white rounded-xl border border-zinc-200/80 p-4 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const isFiltered = filteredCount !== totalCount;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Years of History */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50 border border-teal-100/60 text-teal-800 shrink-0">
            <CalendarRange className="w-4 h-4 text-teal-800" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">
              Years of History
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                {summary.yearsCount}
              </span>
              <span className="text-xs text-zinc-500 font-normal">
                years ({summary.earliestYear}–{summary.latestYear})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Events */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-100 border border-zinc-200/60 text-zinc-700 shrink-0">
            <Activity className="w-4 h-4 text-zinc-700" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">
              Total Medical Events
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                {isFiltered ? filteredCount : summary.totalEvents}
              </span>
              <span className="text-xs text-zinc-500 font-normal">
                {isFiltered ? `of ${totalCount} events` : 'events documented'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Healthcare Providers */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-100 border border-zinc-200/60 text-zinc-700 shrink-0">
            <UserCheck className="w-4 h-4 text-zinc-700" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">
              Healthcare Providers
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                {summary.providerCount}
              </span>
              <span className="text-xs text-zinc-500 font-normal">
                physicians & specialists
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Facilities */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-100 border border-zinc-200/60 text-zinc-700 shrink-0">
            <Building2 className="w-4 h-4 text-zinc-700" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">
              Clinical Facilities
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                {summary.facilityCount}
              </span>
              <span className="text-xs text-zinc-500 font-normal">
                hospitals, labs & clinics
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
