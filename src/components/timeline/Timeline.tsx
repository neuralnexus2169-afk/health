import React, { useMemo } from 'react';
import { CalendarX2, RotateCcw } from 'lucide-react';
import { EnrichedMedicalEvent } from '../../services/patientService';
import { TimelineYear } from './TimelineYear';
import { TimelineEvent } from './TimelineEvent';
import { Button } from '../ui/Button';

interface TimelineProps {
  events: EnrichedMedicalEvent[];
  onSelectEvent: (event: EnrichedMedicalEvent) => void;
  onViewSource: (event: EnrichedMedicalEvent) => void;
  onResetFilters?: () => void;
  isFiltered?: boolean;
}

export function Timeline({
  events,
  onSelectEvent,
  onViewSource,
  onResetFilters,
  isFiltered = false,
}: TimelineProps) {
  // Group events by Year in descending chronological order
  const groupedEvents = useMemo(() => {
    const map = new Map<number, EnrichedMedicalEvent[]>();

    // Events are assumed sorted descending by eventDate
    events.forEach((evt) => {
      const year = new Date(evt.eventDate).getFullYear();
      if (!isNaN(year)) {
        if (!map.has(year)) {
          map.set(year, []);
        }
        map.get(year)!.push(evt);
      }
    });

    // Sort years descending
    const sortedYears = Array.from(map.keys()).sort((a, b) => b - a);

    return sortedYears.map((year) => ({
      year,
      events: map.get(year)!,
    }));
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
          <CalendarX2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900">
          No medical events found
        </h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
          {isFiltered
            ? 'No healthcare encounters or laboratory results match your current search query or active filters.'
            : 'There are no documented events in this health timeline.'}
        </p>
        {isFiltered && onResetFilters && (
          <div className="mt-5">
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={onResetFilters}
            >
              Reset all filters
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Continuous Vertical Timeline Line
          Positioned behind all event node icons (left offset ~16px or 1rem) */}
      <div className="absolute top-4 bottom-8 left-4 sm:left-4 w-0.5 bg-zinc-200/80 -translate-x-1/2 pointer-events-none" />

      {/* Grouped Years and Events */}
      <div className="space-y-8">
        {groupedEvents.map(({ year, events: yearEvents }) => (
          <div key={year} className="relative">
            {/* Year Header Anchor */}
            <TimelineYear year={year} eventCount={yearEvents.length} />

            {/* Events for this Year */}
            <div className="space-y-4 pt-3">
              {yearEvents.map((evt) => (
                <TimelineEvent
                  key={evt.id}
                  event={evt}
                  onSelect={onSelectEvent}
                  onViewSource={onViewSource}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
