import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  FileCheck2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { SummaryOverview } from './SummaryOverview';
import { ConditionsSummary } from './ConditionsSummary';
import { MedicationSummary } from './MedicationSummary';
import { LabTrends } from './LabTrends';
import { HealthcareJourney } from './HealthcareJourney';
import { SummarySources } from './SummarySources';
import { SourceDetailsModal } from './SourceDetailsModal';
import {
  getHealthSummary,
  regenerateHealthSummary,
  resolveSourceEvents,
  ResolvedSourceEvent,
} from '../../services/healthSummaryService';
import { timelineRepository } from '../../lib/db/repositories';
import { StoredHealthSummary, MedicalEvent } from '../../types/medical';
import { PatientProfile, NavigationRoute } from '../../types';

interface HealthSummaryPageProps {
  patient?: PatientProfile;
  onNavigate: (route: NavigationRoute) => void;
  onOpenUpload?: () => void;
}

export function HealthSummaryPage({
  patient,
  onNavigate,
  onOpenUpload,
}: HealthSummaryPageProps) {
  const patientId = patient?.id || 'pat-arun-mathew-01';

  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<StoredHealthSummary | null>(null);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
  const [isOutdated, setIsOutdated] = useState<boolean>(false);
  const [allPatientEvents, setAllPatientEvents] = useState<MedicalEvent[]>([]);

  // Source modal state
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Verified Clinical Sources');
  const [modalClaimText, setModalClaimText] = useState<string | undefined>(undefined);
  const [modalSourceEvents, setModalSourceEvents] = useState<ResolvedSourceEvent[]>([]);

  // Load summary and events
  const loadSummaryData = useCallback(
    async (forceRegenerate: boolean = false) => {
      try {
        if (forceRegenerate) {
          setIsRegenerating(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        // Fetch events for source resolution
        const events = await timelineRepository.findByPatientId(patientId);
        setAllPatientEvents(events);

        // Fetch summary from API / repository
        const res = forceRegenerate
          ? await regenerateHealthSummary(patientId)
          : await getHealthSummary(patientId);

        if (res.success && res.summary) {
          setSummary(res.summary);
          setConfirmedCount(res.confirmedRecordCount);
          setIsOutdated(res.isOutdated);
        } else if (res.error) {
          setError(res.error);
        } else {
          // No summary yet, auto-trigger generation
          const genRes = await regenerateHealthSummary(patientId);
          if (genRes.success && genRes.summary) {
            setSummary(genRes.summary);
            setConfirmedCount(genRes.confirmedRecordCount);
            setIsOutdated(false);
          } else {
            setError(genRes.error || 'Unable to generate the health summary right now.');
          }
        }
      } catch (err: any) {
        console.error('Failed to load health summary:', err);
        setError('Unable to generate the health summary right now.');
      } finally {
        setIsLoading(false);
        setIsRegenerating(false);
      }
    },
    [patientId]
  );

  useEffect(() => {
    loadSummaryData();
  }, [loadSummaryData]);

  // Handler to open source details modal for a claim
  const handleSelectSources = (
    sourceEventIds: string[],
    contextTitle: string,
    claimText: string
  ) => {
    const resolved = resolveSourceEvents(sourceEventIds, allPatientEvents);
    setModalTitle(`Sources: ${contextTitle}`);
    setModalClaimText(claimText);
    setModalSourceEvents(resolved);
    setSourceModalOpen(true);
  };

  // Resolve all sources for bottom table
  const allResolvedSources = React.useMemo(() => {
    const ids = summary?.sourceEventIds && summary.sourceEventIds.length > 0
      ? summary.sourceEventIds
      : allPatientEvents.map((e) => e.id);
    return resolveSourceEvents(ids, allPatientEvents);
  }, [summary, allPatientEvents]);

  return (
    <div id="health-summary-page-root" className="space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        title="AI Health Summary"
        subtitle="A longitudinal view of the patient's documented medical history."
        actions={
          <div className="flex items-center gap-2">
            <Button
              id="header-view-timeline-btn"
              variant="outline"
              size="sm"
              onClick={() => onNavigate('timeline')}
              className="text-xs font-semibold gap-1.5"
            >
              <span>View Timeline</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Button>
            <Button
              id="header-regenerate-summary-btn"
              variant="primary"
              size="sm"
              onClick={() => loadSummaryData(true)}
              disabled={isLoading || isRegenerating}
              className="text-xs font-semibold gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Summary'}</span>
            </Button>
          </div>
        }
      />

      {/* Loading State */}
      {isLoading && (
        <div id="health-summary-loading-state" className="space-y-6 py-4 animate-in fade-in duration-300">
          <div className="p-6 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-center gap-3.5 text-teal-900">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-teal-700 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-950">
                Reviewing your documented health history...
              </p>
              <p className="text-xs text-teal-700">
                Synthesizing confirmed medical records, lab trajectories, and treatment events.
              </p>
            </div>
          </div>

          {/* Skeleton Sections */}
          <div className="space-y-4">
            <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-36 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-36 bg-slate-100 rounded-xl animate-pulse" />
            </div>
            <div className="h-56 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div
          id="health-summary-error-state"
          className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-950 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-900">
                Unable to generate the health summary right now.
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                {error} The rest of the application remains fully functional.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              id="try-again-summary-btn"
              variant="primary"
              size="sm"
              onClick={() => loadSummaryData(true)}
              className="text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('timeline')}
              className="text-xs font-semibold"
            >
              Explore Medical Timeline
            </Button>
          </div>
        </div>
      )}

      {/* Loaded Summary View */}
      {!isLoading && !error && summary && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Section 1: Overview Card & Outdated Banner */}
          <SummaryOverview
            summary={summary}
            confirmedRecordCount={confirmedCount}
            isOutdated={isOutdated}
            isRegenerating={isRegenerating}
            onRegenerate={() => loadSummaryData(true)}
          />

          {/* Section 2: Documented Conditions */}
          <ConditionsSummary
            conditions={summary.content.conditions}
            onSelectSources={handleSelectSources}
          />

          {/* Section 3: Medication History */}
          <MedicationSummary
            medications={summary.content.medications}
            onSelectSources={handleSelectSources}
          />

          {/* Section 4: Laboratory Trends with Interactive Chart */}
          <LabTrends
            patientId={patientId}
            labTrends={summary.content.labTrends}
            onSelectSources={handleSelectSources}
          />

          {/* Section 5: Healthcare Journey */}
          <HealthcareJourney
            journey={summary.content.healthcareJourney}
            onSelectSources={handleSelectSources}
          />

          {/* Section 6: Sources Table */}
          <SummarySources
            sources={allResolvedSources}
            onNavigate={onNavigate}
            onOpenEventInTimeline={(id) => onNavigate('timeline')}
          />
        </div>
      )}

      {/* Interactive Source Details Modal */}
      <SourceDetailsModal
        isOpen={sourceModalOpen}
        onClose={() => setSourceModalOpen(false)}
        title={modalTitle}
        claimText={modalClaimText}
        sourceEvents={modalSourceEvents}
        onNavigate={onNavigate}
      />
    </div>
  );
}
