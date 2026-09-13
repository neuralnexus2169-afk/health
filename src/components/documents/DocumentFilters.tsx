import React from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { DocumentType, DocumentStatus } from '../../types/medical';

export type DocumentSortOption = 'newest' | 'oldest';

export interface DocumentFilterState {
  searchQuery: string;
  selectedType: string; // 'all' | DocumentType
  selectedStatus: string; // 'all' | DocumentStatus
  sortBy: DocumentSortOption;
}

interface DocumentFiltersProps {
  filters: DocumentFilterState;
  onFilterChange: (partial: Partial<DocumentFilterState>) => void;
  onResetFilters: () => void;
  typeCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
}

const DOCUMENT_TYPES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Types' },
  { id: 'Prescription', label: 'Prescription' },
  { id: 'Lab Report', label: 'Lab Report' },
  { id: 'Discharge Summary', label: 'Discharge Summary' },
  { id: 'Consultation Note', label: 'Consultation Note' },
  { id: 'Imaging Report', label: 'Imaging Report' },
  { id: 'Medical Bill', label: 'Medical Bill' },
  { id: 'Vaccination Record', label: 'Vaccination Record' },
  { id: 'Other', label: 'Other' },
];

const STATUS_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Statuses' },
  { id: 'Confirmed', label: 'Confirmed' },
  { id: 'Needs Review', label: 'Needs Review' },
  { id: 'Uploaded', label: 'Ready for Extraction' },
  { id: 'Processing', label: 'Processing' },
  { id: 'Processed', label: 'Processed' },
  { id: 'Failed', label: 'Failed' },
];

export function DocumentFilters({
  filters,
  onFilterChange,
  onResetFilters,
  typeCounts,
  statusCounts,
  totalCount,
  filteredCount,
}: DocumentFiltersProps) {
  const isFiltered =
    filters.searchQuery.trim() !== '' ||
    filters.selectedType !== 'all' ||
    filters.selectedStatus !== 'all' ||
    filters.sortBy !== 'newest';

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Search & Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search documents by name, facility, provider, or clinical note..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-9 py-2 bg-zinc-50 border border-zinc-200/80 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={filters.selectedStatus}
            onChange={(e) => onFilterChange({ selectedStatus: e.target.value })}
            className="px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-lg text-xs font-medium text-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 cursor-pointer"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
                {status.id !== 'all' && statusCounts[status.id] !== undefined
                  ? ` (${statusCounts[status.id]})`
                  : ''}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-lg text-xs font-medium text-zinc-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({ sortBy: e.target.value as DocumentSortOption })
              }
              aria-label="Sort documents"
              className="bg-transparent border-none text-xs font-medium text-zinc-700 focus:outline-hidden cursor-pointer pr-1"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200/80 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Document Type Chips (Horizontal scrollable on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {DOCUMENT_TYPES.map((type) => {
          const isSelected = filters.selectedType === type.id;
          const count = type.id === 'all' ? totalCount : typeCounts[type.id] || 0;

          // Don't show chip if count is 0 and not selected, except for 'all'
          if (type.id !== 'all' && count === 0 && !isSelected) {
            return null;
          }

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onFilterChange({ selectedType: type.id })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-800 text-white shadow-2xs font-semibold'
                  : 'bg-zinc-100/90 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
              }`}
            >
              <span>{type.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? 'bg-teal-900/60 text-teal-100'
                    : 'bg-zinc-200/80 text-zinc-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Feedback Indicator */}
      {isFiltered && (
        <div className="text-xs text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-100">
          <span>
            Showing <strong className="text-zinc-800">{filteredCount}</strong> of{' '}
            {totalCount} documents
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-teal-800 hover:text-teal-900 font-medium hover:underline cursor-pointer"
          >
            Clear active filters
          </button>
        </div>
      )}
    </div>
  );
}
