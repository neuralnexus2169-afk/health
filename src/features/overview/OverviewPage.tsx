import React, { useState, useEffect } from 'react';
import { PatientProfile, NavigationRoute } from '../../types';
import {
  getPatientOverview,
  getEnrichedDocuments,
  EnrichedDocument,
} from '../../services/patientService';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { PatientHeader } from '../../components/dashboard/PatientHeader';
import { AISummaryCard } from '../../components/dashboard/AISummaryCard';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { ConditionCard } from '../../components/dashboard/ConditionCard';
import { MedicationCard } from '../../components/dashboard/MedicationCard';
import { RecentTestsCard } from '../../components/dashboard/RecentTestsCard';
import { RecentEventsCard } from '../../components/dashboard/RecentEventsCard';
import { RecentDocumentsCard } from '../../components/dashboard/RecentDocumentsCard';
import { ContradictionsCard } from '../../components/dashboard/ContradictionsCard';

interface OverviewPageProps {
  patient: PatientProfile;
  onNavigate: (route: NavigationRoute) => void;
  onOpenUpload: () => void;
  onOpenAddRecord?: () => void;
  onOpenExportReport?: () => void;
}

export function OverviewPage({
  patient,
  onNavigate,
  onOpenUpload,
  onOpenAddRecord,
  onOpenExportReport,
}: OverviewPageProps) {
  const [overviewData, setOverviewData] = useState<{
    profile: PatientProfile;
    conditions: any[];
    medications: any[];
    recentTests: any[];
    recentEvents: any[];
  } | null>(null);

  const [recentDocuments, setRecentDocuments] = useState<EnrichedDocument[]>([]);
  const [totalDocCount, setTotalDocCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getPatientOverview(patient.id)
      .then((data) => {
        if (isMounted) {
          setOverviewData(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load patient overview from service:', err);
      });

    getEnrichedDocuments(patient.id)
      .then((res) => {
        if (isMounted) {
          setRecentDocuments(res.documents);
          setTotalDocCount(res.summary.totalCount);
        }
      })
      .catch((err) => {
        console.error('Failed to load patient documents:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [patient.id]);

  // Use dynamically loaded data from service layer with fallback to current patient prop
  const currentProfile = overviewData?.profile || patient;
  const conditions = overviewData?.conditions || [];
  const medications = overviewData?.medications || [];
  const recentTests = overviewData?.recentTests || [];
  const recentEvents = overviewData?.recentEvents || [];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Primary Page Header */}
      <PageHeader
        title="Health Overview"
        subtitle="A clear view of your medical history."
      />

      {/* Patient Profile Section */}
      <PatientHeader patient={currentProfile} />

      {/* AI Health Summary Card */}
      <AISummaryCard onOpenAssistant={onNavigate} />

      {/* Potential Inconsistencies / Contradictions Alert Card */}
      <ContradictionsCard patientId={patient.id} onNavigate={onNavigate} />

      {/* Quick Actions */}
      <QuickActions
        onNavigate={onNavigate}
        onUploadClick={onOpenUpload}
        onAddRecordClick={onOpenAddRecord}
        onExportReportClick={onOpenExportReport}
      />

      {/* 4 Dashboard Cards in Responsive 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Important Conditions */}
        <ConditionCard
          conditions={conditions}
          onNavigate={onNavigate}
        />

        {/* 2. Current Medications */}
        <MedicationCard
          medications={medications}
          onNavigate={onNavigate}
        />

        {/* 3. Recent Tests */}
        <RecentTestsCard
          tests={recentTests}
          onNavigate={onNavigate}
        />

        {/* 4. Recent Healthcare Events */}
        <RecentEventsCard
          events={recentEvents}
          onNavigate={onNavigate}
        />
      </div>

      {/* Recent Medical Documents Section */}
      <RecentDocumentsCard
        documents={recentDocuments}
        onNavigate={onNavigate}
        totalCount={totalDocCount}
      />
    </div>
  );
}

