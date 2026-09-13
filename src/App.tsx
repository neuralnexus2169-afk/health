import React from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './features/overview/OverviewPage';
import { TimelinePage } from './features/timeline/TimelinePage';
import { RecordsPage } from './features/records/RecordsPage';
import { MedicationsPage } from './features/medications/MedicationsPage';
import { DiagnosesPage } from './features/diagnoses/DiagnosesPage';
import { LabsPage } from './features/labs/LabsPage';
import { AssistantPage } from './features/assistant/AssistantPage';
import { DocumentsPage } from './features/documents/DocumentsPage';
import { HealthSummaryPage } from './features/health-summary/HealthSummaryPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { PrivacyPage } from './features/privacy/PrivacyPage';

export default function App() {
  return (
    <AppLayout>
      {({ currentRoute, currentPatient, onNavigate, onOpenUpload }) => {
        switch (currentRoute) {
          case 'overview':
            return (
              <OverviewPage
                patient={currentPatient}
                onNavigate={onNavigate}
                onOpenUpload={onOpenUpload}
              />
            );
          case 'timeline':
            return (
              <TimelinePage
                patient={currentPatient}
                onNavigate={onNavigate}
                onOpenUpload={onOpenUpload}
              />
            );
          case 'health-summary':
            return (
              <HealthSummaryPage
                patient={currentPatient}
                onNavigate={onNavigate}
                onOpenUpload={onOpenUpload}
              />
            );
          case 'medical-records':
          case 'documents':
            return (
              <DocumentsPage
                patient={currentPatient}
                onNavigate={onNavigate}
                onOpenUpload={onOpenUpload}
              />
            );
          case 'medications':
            return <MedicationsPage onNavigate={onNavigate} />;
          case 'diagnoses':
            return <DiagnosesPage onNavigate={onNavigate} />;
          case 'lab-results':
            return <LabsPage onNavigate={onNavigate} />;
          case 'ai-assistant':
            return (
              <AssistantPage
                onNavigate={onNavigate}
                selectedPatientId={currentPatient?.id || 'pat-arun-mathew-01'}
              />
            );
          case 'settings':
            return <SettingsPage onNavigate={onNavigate} />;
          case 'privacy':
            return <PrivacyPage onNavigate={onNavigate} />;
          default:
            return (
              <OverviewPage
                patient={currentPatient}
                onNavigate={onNavigate}
                onOpenUpload={onOpenUpload}
              />
            );
        }
      }}
    </AppLayout>
  );
}
