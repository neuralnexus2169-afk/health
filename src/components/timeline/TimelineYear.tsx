import React from 'react';
import { Calendar } from 'lucide-react';

interface TimelineYearProps {
  year: number;
  eventCount: number;
}

export function TimelineYear({ year, eventCount }: TimelineYearProps) {
  return (
    <div className="relative flex items-center gap-4 pt-6 pb-3 first:pt-0">
      {/* Year badge circle */}
      <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 text-white font-bold text-sm tracking-tight shadow-sm shrink-0">
        {year.toString().slice(-2)}
      </div>

      {/* Year title and count */}
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">
          {year}
        </h2>
        <span className="text-xs font-medium text-zinc-500">
          {eventCount} {eventCount === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Decorative horizontal divider line linking to the timeline column */}
      <div className="flex-1 h-px bg-zinc-200/80 ml-2" />
    </div>
  );
}
