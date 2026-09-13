import React from 'react';
import { Search, X, RotateCcw, Calendar, SlidersHorizontal } from 'lucide-react';
import { MedicalEventType } from '../../types/medical';

export type DateRangePreset = 'all' | '1-year' | '3-years' | '5-years' | 'custom';

export interface TimelineFilterState {
  searchQuery: string;
  selectedEventType: string; // 'all' or MedicalEventType
  datePreset: DateRangePreset;
  customStartDate: string;
  customEndDate: string;
}

interface TimelineFiltersProps {
  filters: TimelineFilterState;
  onFilterChange: (filters: Partial<TimelineFilterState>) => void;
  onResetFilters: () => void;
  typeCounts: Record<string, number>;
  totalEventsCount: number;
  filteredEventsCount: number;
}

const EVENT_TYPE_OPTIONS: { id: string; label: string; type?: MedicalEventType }[] = [
  { id: 'all', label: 'All Events' },
  { id: 'Consultation', label: 'Consultations', type: 'Consultation' },
  { id: 'Laboratory', label: 'Laboratory', type: 'Laboratory' },
  { id: 'Medication', label: 'Medications', type: 'Medication' },
  { id: 'Diagnosis', label: 'Diagnoses', type: 'Diagnosis' },
  { id: 'Hospitalization', label: 'Hospitalizations', type: 'Hospitalization' },
  { id: 'Imaging', label: 'Imaging', type: 'Imaging' },
  { id: 'Procedure', label: 'Procedures', type: 'Procedure' },
  { id: 'Vaccination', label: 'Vaccinations', type: 'Vaccination' },
  { id: 'Other', label: 'Other', type: 'Other' },
];

const DATE_PRESET_OPTIONS: { id: DateRangePreset; label: string }[] = [
  { id: 'all', label: 'All History' },
  { id: '1-year', label: 'Last Year' },
  { id: '3-years', label: 'Last 3 Years' },
  { id: '5-years', label: 'Last 5 Years' },
  { id: 'custom', label: 'Custom Range' },
];

export function TimelineFilters({
  filters,
  onFilterChange,
  onResetFilters,
  typeCounts,
  totalEventsCount,
  filteredEventsCount,
}: TimelineFiltersProps) {
  const isFiltered =
    filters.searchQuery.trim() !== '' ||
    filters.selectedEventType !== 'all' ||
    filters.datePreset !== 'all' ||
    Boolean(filters.customStartDate) ||
    Boolean(filters.customEndDate);

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top row: Search input + Date Preset selector + Reset */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search encounters, diagnoses, medications, labs, providers..."
            className="w-full pl-9 pr-9 py-2 bg-zinc-50 hover:bg-zinc-100/70 focus:bg-white text-sm text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 rounded-md transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Presets Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600">
            <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="hidden sm:inline text-zinc-400">Span:</span>
            <select
              value={filters.datePreset}
              onChange={(e) =>
                onFilterChange({ datePreset: e.target.value as DateRangePreset })
              }
              className="bg-transparent border-none text-zinc-800 font-medium text-xs focus:outline-none cursor-pointer pr-1"
            >
              {DATE_PRESET_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button when active */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100/70 border border-teal-200 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Inputs (when 'custom' preset is selected) */}
      {filters.datePreset === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <span className="text-zinc-500 font-medium">Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.customStartDate}
              onChange={(e) => onFilterChange({ customStartDate: e.target.value })}
              className="px-2.5 py-1 text-xs border border-zinc-200 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
            <span className="text-zinc-400">to</span>
            <input
              type="date"
              value={filters.customEndDate}
              onChange={(e) => onFilterChange({ customEndDate: e.target.value })}
              className="px-2.5 py-1 text-xs border border-zinc-200 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
          </div>
        </div>
      )}

      {/* Event Type Filter Chips */}
      <div className="pt-2 border-t border-zinc-100">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-zinc-500">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          <span>Filter by Event Type</span>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-600 font-semibold">
            {filteredEventsCount} of {totalEventsCount} shown
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {EVENT_TYPE_OPTIONS.map((opt) => {
            const count = opt.id === 'all' ? totalEventsCount : (typeCounts[opt.id] || 0);
            const isSelected = filters.selectedEventType === opt.id;

            // Only show chips with items (or 'all')
            if (opt.id !== 'all' && count === 0) return null;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onFilterChange({ selectedEventType: opt.id })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80 border border-zinc-200/60'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected ? 'bg-teal-900/60 text-teal-100' : 'bg-zinc-200/80 text-zinc-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
