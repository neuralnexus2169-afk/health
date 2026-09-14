import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  FileCheck2,
  Info,
  Pill,
  HeartPulse,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ContradictionCard } from './ContradictionCard';
import { ContradictionDetailDrawer } from './ContradictionDetailDrawer';
import {
  getContradictions,
  updateContradictionReview,
  ContradictionResponse,
  ContradictionsSummary,
} from '../../services/contradictionService';
import { MedicalContradiction, ContradictionCategory } from '../../types/medical';
import { PatientProfile, NavigationRoute } from '../../types';

interface ContradictionsPageProps {
  patient?: PatientProfile;
  onNavigate: (route: NavigationRoute) => void;
  onOpenUpload?: () => void;
}

type FilterCategory = 'all' | 'Allergy' | 'Medication' | 'Diagnosis';
type FilterReviewStatus = 'all' | 'unreviewed' | 'reviewed';
type FilterSeverity = 'all' | 'High' | 'Moderate' | 'Advisory';

export function ContradictionsPage({
  patient,
  onNavigate,
  onOpenUpload,
}: ContradictionsPageProps) {
  const patientId = patient?.id || '';

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [contradictions, setContradictions] = useState<MedicalContradiction[]>([]);
  const [summary, setSummary] = useState<ContradictionsSummary>({
    totalCount: 0,
    unreviewedCount: 0,
    reviewedCount: 0,
    countsByCategory: {
      Allergy: 0,
      Medication: 0,
      Diagnosis: 0,
      Timeline: 0,
    },
    severityCounts: {
      High: 0,
      Moderate: 0,
      Advisory: 0,
    },
  });

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<FilterReviewStatus>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<FilterSeverity>('all');

  // Selected for Drawer
  const [selectedContradiction, setSelectedContradiction] = useState<MedicalContradiction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: ContradictionResponse = await getContradictions(patientId);
      if (res.success) {
        setContradictions(res.contradictions);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load contradictions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Review Update
  const handleUpdateReview = async (
    contradictionId: string,
    reviewStatus: 'Unreviewed' | 'Reviewed',
    notes?: string
  ) => {
    try {
      const updated = await updateContradictionReview(
        patientId,
        contradictionId,
        reviewStatus,
        notes
      );

      // Refresh data locally
      setContradictions((prev) =>
        prev.map((c) => {
          if (c.id === contradictionId) {
            return updated || {
              ...c,
              reviewStatus,
              status: reviewStatus === 'Reviewed' ? 'Acknowledged' : 'Unreviewed',
              reviewNotes: notes !== undefined ? notes : c.reviewNotes,
              reviewedAt: reviewStatus === 'Reviewed' ? new Date().toISOString() : undefined,
            };
          }
          return c;
        })
      );

      // Recompute summary
      setSummary((prev) => {
        const wasReviewed = contradictions.find((c) => c.id === contradictionId)?.reviewStatus === 'Reviewed';
        const isNowReviewed = reviewStatus === 'Reviewed';
        if (wasReviewed === isNowReviewed) return prev;
        return {
          ...prev,
          unreviewedCount: isNowReviewed ? Math.max(0, prev.unreviewedCount - 1) : prev.unreviewedCount + 1,
          reviewedCount: isNowReviewed ? prev.reviewedCount + 1 : Math.max(0, prev.reviewedCount - 1),
        };
      });

      // Update selected drawer item if currently open
      if (selectedContradiction && selectedContradiction.id === contradictionId) {
        setSelectedContradiction((prev) =>
          prev
            ? {
                ...prev,
                reviewStatus,
                status: reviewStatus === 'Reviewed' ? 'Acknowledged' : 'Unreviewed',
                reviewNotes: notes !== undefined ? notes : prev.reviewNotes,
                reviewedAt: reviewStatus === 'Reviewed' ? new Date().toISOString() : undefined,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Error updating review:', err);
    }
  };

  const handleQuickToggleReview = (item: MedicalContradiction) => {
    const nextStatus = item.reviewStatus === 'Reviewed' ? 'Unreviewed' : 'Reviewed';
    handleUpdateReview(item.id, nextStatus, item.reviewNotes);
  };

  const handleOpenDetails = (item: MedicalContradiction) => {
    setSelectedContradiction(item);
    setIsDrawerOpen(true);
  };

  // Filtered contradictions
  const filteredContradictions = useMemo(() => {
    return contradictions.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Review status filter
      if (selectedReviewStatus === 'unreviewed' && item.reviewStatus === 'Reviewed') {
        return false;
      }
      if (selectedReviewStatus === 'reviewed' && item.reviewStatus !== 'Reviewed') {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'all' && item.severity !== selectedSeverity) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesFact1 = (item.firstFact || '').toLowerCase().includes(q);
        const matchesFact2 = (item.secondFact || '').toLowerCase().includes(q);
        const matchesDoc1 = (item.firstDocument?.documentFileName || '').toLowerCase().includes(q);
        const matchesDoc2 = (item.secondDocument?.documentFileName || '').toLowerCase().includes(q);
        const matchesFacility =
          (item.firstFacility || '').toLowerCase().includes(q) ||
          (item.secondFacility || '').toLowerCase().includes(q);

        if (
          !matchesTitle &&
          !matchesDesc &&
          !matchesCategory &&
          !matchesFact1 &&
          !matchesFact2 &&
          !matchesDoc1 &&
          !matchesDoc2 &&
          !matchesFacility
        ) {
          return false;
        }
      }

      return true;
    });
  }, [contradictions, selectedCategory, selectedReviewStatus, selectedSeverity, searchQuery]);

  return (
    <div id="contradictions-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Potential Inconsistencies"
        subtitle="HealthTimeline identifies conflicting or differing information across documented records for clinical and patient review. Records are not automatically altered or resolved."
        actions={
          <div className="flex items-center gap-2">
            <Button
              id="refresh-contradictions-btn"
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={loadData}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Safety & Non-Resolution Notice */}
      <div className="rounded-2xl p-4 sm:p-5 bg-amber-50/60 border border-amber-200/80 text-amber-950 text-xs sm:text-sm flex items-start gap-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">
            Clinical Safety & Reconciliation Protocol
          </p>
          <p className="text-amber-800 leading-relaxed text-xs">
            HealthTimeline cross-references clinical records to flag discrepancies (such as allergy status or medication instructions).
            The application does NOT make automated decisions about which record is correct.
            "Reviewed" indicates that a human reviewer has examined the discrepancy, not that the system has resolved or altered the documented history.
          </p>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Inconsistencies */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Flagged
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {summary.totalCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">findings</span>
          </div>
        </div>

        {/* Needs Review */}
        <div className="p-4 rounded-xl border border-amber-200/90 bg-amber-50/30 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Needs Review
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">
              {summary.unreviewedCount}
            </span>
            <span className="text-xs text-amber-700 font-medium">unreviewed</span>
          </div>
        </div>

        {/* Allergy Conflicts */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Allergy
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {summary.countsByCategory.Allergy}
            </span>
            <span className="text-xs text-slate-400 font-medium">discrepancies</span>
          </div>
        </div>

        {/* Medication Conflicts */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Pill className="w-3 h-3 text-slate-400" />
            Medication
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {summary.countsByCategory.Medication}
            </span>
            <span className="text-xs text-slate-400 font-medium">conflicts</span>
          </div>
        </div>

        {/* Diagnoses Conflicts */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <HeartPulse className="w-3 h-3 text-slate-400" />
            Diagnosis
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {summary.countsByCategory.Diagnosis}
            </span>
            <span className="text-xs text-slate-400 font-medium">status mismatches</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="contradictions-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by allergy, drug, condition, clinic, doctor..."
              className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Review Status Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setSelectedReviewStatus('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedReviewStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({summary.totalCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedReviewStatus('unreviewed')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedReviewStatus === 'unreviewed'
                  ? 'bg-white text-amber-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Review ({summary.unreviewedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedReviewStatus('reviewed')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedReviewStatus === 'reviewed'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reviewed ({summary.reviewedCount})
            </button>
          </div>
        </div>

        {/* Secondary Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Category:
            </span>

            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Categories
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('Allergy')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === 'Allergy'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Allergies ({summary.countsByCategory.Allergy})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('Medication')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === 'Medication'
                  ? 'bg-sky-100 text-sky-900 border-sky-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Medications ({summary.countsByCategory.Medication})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('Diagnosis')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === 'Diagnosis'
                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Diagnoses ({summary.countsByCategory.Diagnosis})
            </button>
          </div>

          <span className="text-slate-400 font-medium">
            Showing {filteredContradictions.length} of {contradictions.length} findings
          </span>
        </div>
      </div>

      {/* Contradictions List or Empty State */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
          <span className="text-sm font-medium text-slate-500">
            Cross-referencing medical encounters and checking records...
          </span>
        </div>
      ) : filteredContradictions.length === 0 ? (
        <div
          id="contradictions-empty-state"
          className="rounded-2xl border border-slate-200/90 bg-white p-10 sm:p-12 text-center shadow-2xs space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              No potential inconsistencies
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {searchQuery.trim() || selectedCategory !== 'all' || selectedReviewStatus !== 'all'
                ? 'No discrepancies match your current search or category filters. Clear filters to see all findings.'
                : 'No discrepancies detected. Upload medical records to automatically check for inconsistencies.'}
            </p>
          </div>

          {(searchQuery.trim() || selectedCategory !== 'all' || selectedReviewStatus !== 'all') && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedReviewStatus('all');
                  setSelectedSeverity('all');
                }}
                className="text-xs font-semibold"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContradictions.map((contra) => (
            <ContradictionCard
              key={contra.id}
              contradiction={contra}
              onSelect={handleOpenDetails}
              onToggleReview={handleQuickToggleReview}
              onOpenDocument={(docId) => {
                onNavigate('documents');
              }}
            />
          ))}
        </div>
      )}

      {/* Slide-over Evidence Detail Drawer */}
      <ContradictionDetailDrawer
        contradiction={selectedContradiction}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedContradiction(null);
        }}
        onUpdateReview={handleUpdateReview}
        onNavigate={onNavigate}
        onOpenDocument={(docId) => {
          onNavigate('documents');
        }}
      />
    </div>
  );
}
