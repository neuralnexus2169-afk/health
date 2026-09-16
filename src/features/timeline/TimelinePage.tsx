import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload,
  CalendarRange,
  FileText,
  User,
  GitCommitHorizontal,
  FileDown,
} from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TimelineSummaryBar } from '../../components/timeline/TimelineSummaryBar';
import {
  TimelineFilters,
  TimelineFilterState,
} from '../../components/timeline/TimelineFilters';
import { Timeline } from '../../components/timeline/Timeline';
import { TimelineEventDetails } from '../../components/timeline/TimelineEventDetails';
import { SourceDocumentModal } from '../../components/timeline/SourceDocumentModal';
import {
  getEnrichedTimeline,
  EnrichedMedicalEvent,
  TimelineSummary,
  DEFAULT_PATIENT_ID,
} from '../../services/patientService';
import { PatientProfile, NavigationRoute } from '../../types';

interface TimelinePageProps {
  patient?: PatientProfile;
  onNavigate: (route: NavigationRoute) => void;
  onOpenUpload: () => void;
  onOpenAddRecord?: () => void;
  onOpenExportReport?: () => void;
}

const INITIAL_FILTERS: TimelineFilterState = {
  searchQuery: '',
  selectedEventType: 'all',
  datePreset: 'all',
  customStartDate: '',
  customEndDate: '',
};

export function TimelinePage({
  patient,
  onNavigate,
  onOpenUpload,
  onOpenExportReport,
}: TimelinePageProps) {
  const patientId = patient?.id || DEFAULT_PATIENT_ID;
  const patientName = patient?.name || '';

  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<EnrichedMedicalEvent[]>([]);
  const [summary, setSummary] = useState<TimelineSummary>({
    yearsCount: 8,
    yearSpanText: '8 years of history',
    totalEvents: 0,
    providerCount: 0,
    facilityCount: 0,
    earliestYear: 2018,
    latestYear: 2026,
  });

  const [filters, setFilters] = useState<TimelineFilterState>(INITIAL_FILTERS);
  const [selectedEvent, setSelectedEvent] = useState<EnrichedMedicalEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sourceModalEvent, setSourceModalEvent] = useState<EnrichedMedicalEvent | null>(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // Fetch real data from patient service layer
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getEnrichedTimeline(patientId)
      .then((data) => {
        if (isMounted) {
          // Ensure events are sorted descending by date (newest first)
          const sorted = [...data.events].sort(
            (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
          );
          setEvents(sorted);
          setSummary(data.summary);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load enriched timeline:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  // Compute event counts per category across all events
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((evt) => {
      counts[evt.eventType] = (counts[evt.eventType] || 0) + 1;
    });
    return counts;
  }, [events]);

  // Filtered Events Pipeline
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // 1. Event Type filter
      if (filters.selectedEventType !== 'all' && evt.eventType !== filters.selectedEventType) {
        return false;
      }

      // 2. Date Filtering
      const evtDate = new Date(evt.eventDate);
      const latestYear = summary.latestYear || 2026;

      if (filters.datePreset === '1-year') {
        // Last 1 year relative to patient's latest record
        const minYear = latestYear - 1;
        if (evtDate.getFullYear() < minYear) return false;
      } else if (filters.datePreset === '3-years') {
        const minYear = latestYear - 3;
        if (evtDate.getFullYear() < minYear) return false;
      } else if (filters.datePreset === '5-years') {
        const minYear = latestYear - 5;
        if (evtDate.getFullYear() < minYear) return false;
      } else if (filters.datePreset === 'custom') {
        if (filters.customStartDate && evt.eventDate < filters.customStartDate) {
          return false;
        }
        if (filters.customEndDate && evt.eventDate > filters.customEndDate) {
          return false;
        }
      }

      // 3. Search Query Filter (case-insensitive across deep entity fields)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();

        const matchTitle = evt.title.toLowerCase().includes(query);
        const matchDesc = evt.description.toLowerCase().includes(query);
        const matchProvider = (evt.providerName || '').toLowerCase().includes(query);
        const matchFacility = (evt.facilityName || '').toLowerCase().includes(query);
        const matchDoc = (evt.documentFileName || '').toLowerCase().includes(query);

        // Check attached diagnoses
        const matchDiag = evt.diagnoses.some(
          (d) =>
            d.name.toLowerCase().includes(query) ||
            (d.category && d.category.toLowerCase().includes(query)) ||
            (d.clinicalNotes && d.clinicalNotes.toLowerCase().includes(query))
        );

        // Check attached medications
        const matchMed = evt.medications.some(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            (m.genericName && m.genericName.toLowerCase().includes(query)) ||
            (m.indication && m.indication.toLowerCase().includes(query))
        );

        // Check attached labs
        const matchLab = evt.labResults.some(
          (l) =>
            l.testName.toLowerCase().includes(query) ||
            l.parameterName.toLowerCase().includes(query) ||
            (l.interpretation && l.interpretation.toLowerCase().includes(query))
        );

        // Check source reference
        const matchSource = (evt.sourceReference?.sourceText || '').toLowerCase().includes(query);

        if (
          !matchTitle &&
          !matchDesc &&
          !matchProvider &&
          !matchFacility &&
          !matchDoc &&
          !matchDiag &&
          !matchMed &&
          !matchLab &&
          !matchSource
        ) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters, summary.latestYear]);

  const handleFilterChange = (partial: Partial<TimelineFilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  
  const handleDeleteEvent = async (id: string, type: 'event' | 'diagnosis' | 'medication' | 'lab') => {
    if (!window.confirm("Delete this manually entered record?\nThis will remove the record from your health history. This action cannot be undone.")) return;
    try {
      const { deleteRecord } = await import('../../services/patientService');
      let targetModel: 'MedicalEvent' | 'Diagnosis' | 'Medication' | 'LabResult' = 'MedicalEvent';
      if (type === 'diagnosis') targetModel = 'Diagnosis';
      else if (type === 'medication') targetModel = 'Medication';
      else if (type === 'lab') targetModel = 'LabResult';

      await deleteRecord(targetModel, id);
      
      // refresh events
      setEvents(events.filter(e => {
        if (type === 'event' && e.id === id) return false;
        if (type === 'diagnosis' && e.diagnoses && e.diagnoses.some(d => d.id === id)) return false;
        if (type === 'medication' && e.medications && e.medications.some(m => m.id === id)) return false;
        if (type === 'lab' && e.labResults && e.labResults.some(l => l.id === id)) return false;
        return true; // Simplified optimisitic update, full refresh would be better
      }));
      // Just doing a window.location.reload() or calling the fetch function would be cleaner
      window.location.reload();
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  const handleSelectEvent = (event: EnrichedMedicalEvent) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleViewSource = (event: EnrichedMedicalEvent) => {
    setSourceModalEvent(event);
    setIsSourceModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Primary Page Header */}
      <PageHeader
        title="Health Timeline"
        subtitle="Your medical history, organized chronologically."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200/80 rounded-full text-xs font-semibold text-teal-900">
            <User className="w-3.5 h-3.5 text-teal-700" />
            <span>{patientName}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              id="timeline-export-report-btn"
              variant="outline"
              size="sm"
              icon={<FileDown className="w-3.5 h-3.5 text-teal-700" />}
              onClick={onOpenExportReport}
              className="bg-white hover:bg-teal-50/60 border-teal-200 text-teal-950 font-semibold"
            >
              Export Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-3.5 h-3.5 text-zinc-600" />}
              onClick={() => onNavigate('medical-records')}
            >
              Medical records
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={onOpenUpload}
            >
              Upload record
            </Button>
          </div>
        }
      />

      {/* Summary Metrics Bar */}
      <TimelineSummaryBar
        summary={summary}
        filteredCount={filteredEvents.length}
        totalCount={events.length}
        isLoading={isLoading}
      />

      {/* Filter and Search Toolbar */}
      <TimelineFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        typeCounts={typeCounts}
        totalEventsCount={events.length}
        filteredEventsCount={filteredEvents.length}
      />

      {/* Vertical Longitudinal Timeline */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-xl border border-zinc-200/80 p-6 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <Timeline
          events={filteredEvents}
          onSelectEvent={handleSelectEvent}
          onViewSource={handleViewSource}
          onDeleteEvent={handleDeleteEvent}
          onResetFilters={handleResetFilters}
          isFiltered={
            filters.searchQuery.trim() !== '' ||
            filters.selectedEventType !== 'all' ||
            filters.datePreset !== 'all' ||
            Boolean(filters.customStartDate) ||
            Boolean(filters.customEndDate)
          }
          onOpenUpload={onOpenUpload}
        />
      )}

      {/* Slide-in Event Details Side Drawer */}
      <TimelineEventDetails
        event={selectedEvent}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onViewSource={handleViewSource}
      />

      {/* Source Document Traceability Modal */}
      <SourceDocumentModal
        event={sourceModalEvent}
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onOpenDocuments={() => onNavigate('documents')}
      />
    </div>
  );
}
