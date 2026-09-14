import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Pill,
  Activity,
  FlaskConical,
  GitCommitHorizontal,
  FileText,
  AlertTriangle,
  Building2,
  ArrowRight,
  Sparkles,
  CornerDownLeft,
} from 'lucide-react';
import { NavigationRoute, PatientProfile } from '../../types';
import { SearchResultCategory, SearchResultItem, SearchResultsResponse } from '../../types/search';
import { searchHealthRecords } from '../../services/searchService';
import { HighlightMatch } from './HighlightMatch';
import { formatDisplayDate } from '../../services/patientService';

interface GlobalSearchInputProps {
  patient?: PatientProfile;
  onNavigate: (route: NavigationRoute, targetId?: string, extraParams?: Record<string, string>) => void;
  className?: string;
}

const QUICK_SUGGESTIONS = ['Blood pressure', 'Cholesterol', 'Allergy', 'Vaccination', 'Prescription'];

export function GlobalSearchInput({
  patient,
  onNavigate,
  className = '',
}: GlobalSearchInputProps) {
  const patientId = patient?.id || '';

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resultsResponse, setResultsResponse] = useState<SearchResultsResponse | null>(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener (Cmd+K or Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          setIsMobileModalOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
          setIsOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  const performSearch = useCallback(
    async (searchText: string) => {
      if (!searchText.trim()) {
        setResultsResponse(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchHealthRecords(patientId, searchText.trim());
        setResultsResponse(response);
      } catch (err) {
        console.error('Error fetching global search live results:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [patientId]
  );

  const handleInputChange = (val: string) => {
    setQuery(val);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setResultsResponse(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 200);
  };

  const handleNavigateToFullSearch = (searchQueryToUse?: string) => {
    const q = searchQueryToUse ?? query;
    setIsOpen(false);
    setIsMobileModalOpen(false);
    onNavigate('search', undefined, { q });
  };

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    setIsMobileModalOpen(false);
    onNavigate(item.targetRoute, item.targetId);
  };

  const handleSelectSuggestion = (term: string) => {
    setQuery(term);
    handleInputChange(term);
  };

  const getCategoryIcon = (category: SearchResultCategory) => {
    switch (category) {
      case 'medication':
        return <Pill className="w-3.5 h-3.5 text-blue-600" />;
      case 'diagnosis':
        return <Activity className="w-3.5 h-3.5 text-amber-600" />;
      case 'lab':
        return <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />;
      case 'timeline':
        return <GitCommitHorizontal className="w-3.5 h-3.5 text-purple-600" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-zinc-600" />;
      case 'allergy_inconsistency':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      case 'provider_facility':
        return <Building2 className="w-3.5 h-3.5 text-teal-600" />;
    }
  };

  return (
    <>
      {/* Mobile search trigger button */}
      <button
        type="button"
        onClick={() => {
          setIsMobileModalOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        }}
        className="flex items-center justify-center p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg lg:hidden cursor-pointer"
        aria-label="Search records"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Desktop Search Bar with Live Preview Dropdown */}
      <div ref={containerRef} className={`relative hidden lg:block ${className}`}>
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleNavigateToFullSearch();
              } else if (e.key === 'Escape') {
                setIsOpen(false);
                inputRef.current?.blur();
              }
            }}
            placeholder="Search health records..."
            className="w-64 xl:w-80 pl-9 pr-16 py-1.5 bg-zinc-50 hover:bg-zinc-100/70 focus:bg-white text-zinc-900 placeholder-zinc-400 text-xs rounded-lg border border-zinc-200/90 focus:border-zinc-500 focus:outline-hidden transition-all"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResultsResponse(null);
                  inputRef.current?.focus();
                }}
                className="p-0.5 text-zinc-400 hover:text-zinc-600 rounded cursor-pointer"
                aria-label="Clear query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-white border border-zinc-200 rounded shadow-2xs pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Live Results Dropdown */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-96 xl:w-[450px] bg-white rounded-xl border border-zinc-200/90 shadow-lg z-50 overflow-hidden text-xs">
            {isLoading ? (
              <div className="p-6 text-center text-zinc-500">
                <div className="animate-spin w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full mx-auto mb-2" />
                <span>Searching health records...</span>
              </div>
            ) : query.trim() && resultsResponse ? (
              <div>
                {/* Header Summary */}
                <div className="px-3.5 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                  <span className="font-semibold text-zinc-700">
                    {resultsResponse.totalCount} result{resultsResponse.totalCount === 1 ? '' : 's'} for "{query}"
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNavigateToFullSearch()}
                    className="text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    View all results <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Categorized Quick Results */}
                {resultsResponse.totalCount === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-zinc-500">No confirmed health records found.</p>
                    <p className="text-[11px] text-zinc-400">
                      Try searching for a medication, lab test, diagnosis, or provider.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100/70 p-1">
                    {resultsResponse.results.slice(0, 6).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectResult(item)}
                        className="w-full text-left p-2.5 hover:bg-zinc-50 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer group"
                      >
                        <div className="mt-0.5 p-1 rounded-md bg-zinc-100 group-hover:bg-white border border-zinc-200/70">
                          {getCategoryIcon(item.category)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-zinc-900 truncate">
                              <HighlightMatch text={item.title} query={query} />
                            </span>
                            {item.date && (
                              <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                                {formatDisplayDate(item.date)}
                              </span>
                            )}
                          </div>

                          {item.subtitle && (
                            <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                              <HighlightMatch text={item.subtitle} query={query} />
                            </div>
                          )}

                          {item.snippet && (
                            <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 italic">
                              <HighlightMatch text={item.snippet} query={query} />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Dropdown Footer */}
                <div className="p-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    Press <CornerDownLeft className="w-3 h-3 text-zinc-400" /> for full search page
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNavigateToFullSearch()}
                    className="font-medium text-zinc-800 hover:text-black cursor-pointer"
                  >
                    Open dedicated search →
                  </button>
                </div>
              </div>
            ) : (
              /* Empty Query Suggestions */
              <div className="p-3.5 space-y-2">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Quick searches
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTIONS.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSelectSuggestion(term)}
                      className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 rounded-md border border-zinc-200/80 text-xs transition-colors cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
                <div className="pt-2 text-[11px] text-zinc-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Searches confirmed medications, labs, events, documents & allergies.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Search Modal Overlay */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
          {/* Header Bar */}
          <div className="flex items-center gap-2 p-3 border-b border-zinc-200">
            <Search className="w-5 h-5 text-zinc-400 ml-1" />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleNavigateToFullSearch();
                }
              }}
              placeholder="Search health records..."
              className="flex-1 py-1.5 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResultsResponse(null);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMobileModalOpen(false)}
              className="px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              Cancel
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500">
                <div className="animate-spin w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full mx-auto mb-2" />
                <span>Searching health records...</span>
              </div>
            ) : query.trim() && resultsResponse ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-100 pb-2">
                  <span>{resultsResponse.totalCount} results for "{query}"</span>
                  <button
                    type="button"
                    onClick={() => handleNavigateToFullSearch()}
                    className="font-semibold text-zinc-900"
                  >
                    View all →
                  </button>
                </div>

                {resultsResponse.results.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500 text-xs">
                    No confirmed health records found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resultsResponse.results.slice(0, 10).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectResult(item)}
                        className="w-full text-left p-3 bg-zinc-50 hover:bg-zinc-100 rounded-lg flex items-start gap-2.5"
                      >
                        <div className="mt-0.5 p-1 bg-white rounded border border-zinc-200">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-zinc-900 truncate">
                            <HighlightMatch text={item.title} query={query} />
                          </div>
                          {item.subtitle && (
                            <div className="text-xs text-zinc-600 truncate mt-0.5">
                              <HighlightMatch text={item.subtitle} query={query} />
                            </div>
                          )}
                          {item.date && (
                            <div className="text-[11px] text-zinc-400 mt-1">
                              {formatDisplayDate(item.date)}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Popular Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SUGGESTIONS.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSelectSuggestion(term)}
                      className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
