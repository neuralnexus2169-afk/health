import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  User,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { NavigationRoute, PatientProfile } from '../../types';
import {
  SearchResultCategory,
  SearchResultItem,
  SearchResultsResponse,
} from '../../types/search';
import { searchHealthRecords } from '../../services/searchService';
import { HighlightMatch } from '../../components/search/HighlightMatch';
import { formatDisplayDate } from '../../services/patientService';

interface SearchPageProps {
  patient?: PatientProfile;
  initialQuery?: string;
  onNavigate: (route: NavigationRoute, targetId?: string, extraParams?: Record<string, string>) => void;
  onAskAssistant?: (question: string) => void;
}

type SortOrder = 'relevance' | 'date';

const CATEGORY_TABS: { id: SearchResultCategory | 'all'; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Results', icon: Search },
  { id: 'medication', label: 'Medications', icon: Pill },
  { id: 'diagnosis', label: 'Diagnoses', icon: Activity },
  { id: 'lab', label: 'Lab Results', icon: FlaskConical },
  { id: 'timeline', label: 'Timeline', icon: GitCommitHorizontal },
  { id: 'document', label: 'Documents', icon: FileText },
  { id: 'allergy_inconsistency', label: 'Allergies & Inconsistencies', icon: AlertTriangle },
  { id: 'provider_facility', label: 'Providers & Facilities', icon: Building2 },
];

const POPULAR_SEARCHES = [
  'Metformin',
  'HbA1c',
  'Diabetes',
  'Penicillin',
  'Dr. Jenkins',
  'Meridian Medical',
  'Hypertension',
  'Lipid Panel',
];

export function SearchPage({
  patient,
  initialQuery = '',
  onNavigate,
  onAskAssistant,
}: SearchPageProps) {
  const patientId = patient?.id || '';
  const patientName = patient?.name || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<SearchResultCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOrder>('relevance');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResultsResponse | null>(null);

  // Read URL search param on mount if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q');
      if (q && q.trim()) {
        setSearchQuery(q.trim());
        setActiveQuery(q.trim());
      }
    }
  }, []);

  // Update when initialQuery prop changes
  useEffect(() => {
    if (initialQuery && initialQuery !== searchQuery) {
      setSearchQuery(initialQuery);
      setActiveQuery(initialQuery);
    }
  }, [initialQuery]);

  // Execute search when activeQuery changes
  const performSearch = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) {
        setSearchResponse(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchHealthRecords(patientId, queryText.trim());
        setSearchResponse(response);
      } catch (err) {
        console.error('Failed to execute search:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [patientId]
  );

  useEffect(() => {
    performSearch(activeQuery);
  }, [activeQuery, performSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    setActiveQuery(clean);

    // Update browser URL query param safely
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (clean) {
        url.searchParams.set('q', clean);
      } else {
        url.searchParams.delete('q');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setActiveQuery('');
    setSearchResponse(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleSuggestionClick = (term: string) => {
    setSearchQuery(term);
    setActiveQuery(term);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('q', term);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Filter and sort results
  const displayedResults = useMemo(() => {
    if (!searchResponse) return [];
    let list = [...searchResponse.results];

    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (sortBy === 'date') {
      list.sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return timeB - timeA;
      });
    } else {
      list.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return list;
  }, [searchResponse, selectedCategory, sortBy]);

  const getCategoryBadgeClass = (category: SearchResultCategory) => {
    switch (category) {
      case 'medication':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'diagnosis':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'lab':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'timeline':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'document':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      case 'allergy_inconsistency':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'provider_facility':
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  const getCategoryIcon = (category: SearchResultCategory) => {
    switch (category) {
      case 'medication':
        return <Pill className="w-3.5 h-3.5" />;
      case 'diagnosis':
        return <Activity className="w-3.5 h-3.5" />;
      case 'lab':
        return <FlaskConical className="w-3.5 h-3.5" />;
      case 'timeline':
        return <GitCommitHorizontal className="w-3.5 h-3.5" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5" />;
      case 'allergy_inconsistency':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'provider_facility':
        return <Building2 className="w-3.5 h-3.5" />;
    }
  };

  const handleResultClick = (item: SearchResultItem) => {
    onNavigate(item.targetRoute, item.targetId);
  };

  const handleAskAssistant = () => {
    const question = `What does my medical history say about ${activeQuery}?`;
    if (onAskAssistant) {
      onAskAssistant(question);
    } else {
      onNavigate('ai-assistant', undefined, { question });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <PageHeader
        title="Search Health Records"
        subtitle={`Unified global search across confirmed medications, diagnoses, lab results, timeline events, documents, and allergies for ${patientName}.`}
      />

      {/* Primary Search Bar */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search health records (e.g. Metformin, HbA1c, Diabetes, Penicillin, Dr. Jenkins)..."
              className="w-full pl-11 pr-10 py-3 bg-zinc-50 hover:bg-zinc-100/60 focus:bg-white text-zinc-900 placeholder-zinc-400 text-base rounded-lg border border-zinc-200 focus:border-zinc-500 focus:outline-hidden transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-200/60 transition-colors"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="primary" className="py-3 px-5 text-sm font-medium">
            Search
          </Button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">Try searching:</span>
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleSuggestionClick(term)}
              className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                activeQuery.toLowerCase() === term.toLowerCase()
                  ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200/70 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Active Search Context Bar & Filter Tabs */}
      {activeQuery && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-sm text-zinc-600">
              {isLoading ? (
                <span>Searching confirmed health records...</span>
              ) : searchResponse ? (
                <span>
                  Found <strong className="text-zinc-900 font-semibold">{searchResponse.totalCount}</strong>{' '}
                  matching record{searchResponse.totalCount === 1 ? '' : 's'} for{' '}
                  <strong className="text-zinc-900 font-semibold">"{activeQuery}"</strong>
                </span>
              ) : null}
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-zinc-500">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sort by:</span>
              <button
                type="button"
                onClick={() => setSortBy('relevance')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  sortBy === 'relevance'
                    ? 'bg-zinc-200 text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Relevance
              </button>
              <button
                type="button"
                onClick={() => setSortBy('date')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  sortBy === 'date'
                    ? 'bg-zinc-200 text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Most Recent
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const count =
                tab.id === 'all'
                  ? searchResponse?.totalCount || 0
                  : searchResponse?.countsByCategory[tab.id] || 0;

              // Hide tabs with 0 results when results exist, except for "all"
              if (searchResponse && searchResponse.totalCount > 0 && count === 0 && tab.id !== 'all') {
                return null;
              }

              const isSelected = selectedCategory === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Container */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-zinc-200/80 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full mx-auto mb-4" />
          <p className="text-zinc-600 text-sm">Searching patient health records...</p>
        </div>
      ) : !activeQuery ? (
        /* Empty State: No query entered */
        <div className="bg-white rounded-xl border border-zinc-200/80 p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Search your health history</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Find medications, diagnoses, lab results, documents, providers, and clinical observations
              instantly across your confirmed records.
            </p>
          </div>
          <div className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div
                onClick={() => handleSuggestionClick('Metformin')}
                className="p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 text-blue-600 font-medium text-xs">
                  <Pill className="w-3.5 h-3.5" />
                  Medications
                </div>
                <div className="text-xs text-zinc-700 mt-1 font-semibold">"Metformin"</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Dose, frequency, refills</div>
              </div>
              <div
                onClick={() => handleSuggestionClick('HbA1c')}
                className="p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 text-emerald-600 font-medium text-xs">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Laboratory
                </div>
                <div className="text-xs text-zinc-700 mt-1 font-semibold">"HbA1c"</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Parametric values & dates</div>
              </div>
              <div
                onClick={() => handleSuggestionClick('Penicillin')}
                className="p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 text-rose-600 font-medium text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Allergies
                </div>
                <div className="text-xs text-zinc-700 mt-1 font-semibold">"Penicillin"</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Documented inconsistencies</div>
              </div>
            </div>
          </div>
        </div>
      ) : displayedResults.length === 0 ? (
        /* Empty State: No results found */
        <div className="bg-white rounded-xl border border-zinc-200/80 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <X className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">No matching health records found</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Try another medication, diagnosis, test, provider, or document name.
            </p>
          </div>
          {/* Ask AI Assistant Fallback */}
          <div className="pt-4 border-t border-zinc-100">
            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200/80 text-left flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Can't find what you're looking for?
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Ask the Health Assistant to interpret or explain your medical journey regarding "{activeQuery}".
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAskAssistant}
                className="shrink-0 text-xs gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Ask Assistant
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Results List */
        <div className="space-y-4">
          {displayedResults.map((item) => {
            const hasInconsistency = Boolean(item.inconsistencyDetails);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border transition-all hover:shadow-xs p-4 sm:p-5 ${
                  hasInconsistency
                    ? 'border-rose-200/90 bg-rose-50/10'
                    : 'border-zinc-200/80 hover:border-zinc-300'
                }`}
              >
                {/* Header Row: Category Badge, Matched Field, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      {getCategoryIcon(item.category)}
                      {item.categoryLabel}
                    </span>

                    <span className="text-[11px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md font-medium">
                      Matched on: {item.matchedField}
                    </span>

                    {item.status && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                          item.status === 'Active' || item.status === 'Processed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    )}
                  </div>

                  {item.date && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {formatDisplayDate(item.date)}
                    </div>
                  )}
                </div>

                {/* Title & Subtitle */}
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                    <HighlightMatch text={item.title} query={activeQuery} />
                  </h4>

                  {item.subtitle && (
                    <p className="text-sm text-zinc-600">
                      <HighlightMatch text={item.subtitle} query={activeQuery} />
                    </p>
                  )}
                </div>

                {/* Evidence / Source Snippet */}
                {item.snippet && (
                  <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-xs text-zinc-600 font-sans leading-relaxed">
                    <span className="text-zinc-400 font-semibold mr-1.5 uppercase text-[10px] tracking-wider block sm:inline">
                      Clinical Evidence:
                    </span>
                    <HighlightMatch text={item.snippet} query={activeQuery} />
                  </div>
                )}

                {/* Inconsistency Side-by-Side Facts (Penicillin / Allergy conflict) */}
                {item.inconsistencyDetails && (
                  <div className="mt-3 p-3.5 bg-rose-50/60 rounded-lg border border-rose-200 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Documented Contradiction (Both records preserved below):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-white rounded-md border border-rose-200/80">
                        <div className="font-semibold text-zinc-900 mb-1">Record A:</div>
                        <div className="text-zinc-700 font-medium">
                          <HighlightMatch
                            text={item.inconsistencyDetails.firstFact}
                            query={activeQuery}
                          />
                        </div>
                        {item.inconsistencyDetails.firstSource && (
                          <div className="text-[11px] text-zinc-500 mt-1 italic">
                            Source: {item.inconsistencyDetails.firstSource}
                          </div>
                        )}
                        {item.inconsistencyDetails.firstDate && (
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            Date: {formatDisplayDate(item.inconsistencyDetails.firstDate)}
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 bg-white rounded-md border border-rose-200/80">
                        <div className="font-semibold text-zinc-900 mb-1">Record B:</div>
                        <div className="text-zinc-700 font-medium">
                          <HighlightMatch
                            text={item.inconsistencyDetails.secondFact}
                            query={activeQuery}
                          />
                        </div>
                        {item.inconsistencyDetails.secondSource && (
                          <div className="text-[11px] text-zinc-500 mt-1 italic">
                            Source: {item.inconsistencyDetails.secondSource}
                          </div>
                        )}
                        {item.inconsistencyDetails.secondDate && (
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            Date: {formatDisplayDate(item.inconsistencyDetails.secondDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer: Metadata + Navigation Link */}
                <div className="mt-3.5 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    {item.facility && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        <HighlightMatch text={item.facility} query={activeQuery} />
                      </span>
                    )}
                    {item.provider && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <HighlightMatch text={item.provider} query={activeQuery} />
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResultClick(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition-colors ml-auto cursor-pointer"
                  >
                    <span>
                      {item.category === 'medication'
                        ? 'View in Medications'
                        : item.category === 'diagnosis'
                        ? 'View in Diagnoses'
                        : item.category === 'lab'
                        ? 'View in Lab Results'
                        : item.category === 'timeline'
                        ? 'View in Timeline'
                        : item.category === 'document'
                        ? 'View Document'
                        : item.category === 'allergy_inconsistency'
                        ? 'View Inconsistencies'
                        : 'View Records'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* AI Assistant Transition Footer */}
          <div className="mt-8 p-5 bg-gradient-to-r from-zinc-50 to-zinc-100/60 rounded-xl border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Want deeper clinical context about "{activeQuery}"?
              </div>
              <p className="text-xs text-zinc-600 max-w-xl">
                The Health Assistant can summarize trends, synthesize consultation history, and answer
                conversational questions directly grounded in your confirmed medical records.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleAskAssistant}
              className="shrink-0 gap-2 text-xs font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Ask Health Assistant about "{activeQuery}"
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
