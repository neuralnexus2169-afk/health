import React from 'react';
import { ThemeProvider } from './lib/theme/ThemeContext';
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
import { ContradictionsPage } from './features/contradictions/ContradictionsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { PrivacyPage } from './features/privacy/PrivacyPage';
import { SearchPage } from './features/search/SearchPage';

export default function App() {
  return (
    <ThemeProvider>
      <AppLayout>
        {({
          currentRoute,
          currentPatient,
          onNavigate,
          onOpenUpload,
          onOpenAddRecord,
          onOpenExportReport,
          searchQuery,
          assistantInitialQuestion,
        }) => {
          switch (currentRoute) {
            case 'overview':
              return (
                <OverviewPage
                  patient={currentPatient}
                  onNavigate={onNavigate}
                  onOpenUpload={onOpenUpload}
                  onOpenAddRecord={onOpenAddRecord}
                  onOpenExportReport={onOpenExportReport}
                />
              );
            case 'timeline':
              return (
                <TimelinePage
                  patient={currentPatient}
                  onNavigate={onNavigate}
                  onOpenUpload={onOpenUpload}
                  onOpenAddRecord={onOpenAddRecord}
                  onOpenExportReport={onOpenExportReport}
                />
              );
            case 'health-summary':
              return (
                <HealthSummaryPage
                  patient={currentPatient}
                  onNavigate={onNavigate}
                  onOpenUpload={onOpenUpload}
                  onOpenAddRecord={onOpenAddRecord}
                  onOpenExportReport={onOpenExportReport}
                />
              );
            case 'medical-records':
            case 'documents':
              return (
                <DocumentsPage
                  patient={currentPatient}
                  onNavigate={onNavigate}
                  onOpenUpload={onOpenUpload}
                  onOpenAddRecord={onOpenAddRecord}
                />
              );
            case 'medications':
              return <MedicationsPage patient={currentPatient} onNavigate={onNavigate} />;
            case 'diagnoses':
              return <DiagnosesPage patient={currentPatient} onNavigate={onNavigate} />;
            case 'lab-results':
              return <LabsPage patient={currentPatient} onNavigate={onNavigate} />;
            case 'ai-assistant':
              return (
                <AssistantPage
                  onNavigate={onNavigate}
                  selectedPatientId={currentPatient?.id || ''}
                  initialQuestion={assistantInitialQuestion}
                />
              );
            case 'search':
              return (
                <SearchPage
                  patient={currentPatient}
                  initialQuery={searchQuery}
                  onNavigate={onNavigate}
                  onAskAssistant={(q) => onNavigate('ai-assistant', undefined, { question: q })}
                />
              );
            case 'contradictions':
              return (
                <ContradictionsPage
                  patient={currentPatient}
                  onNavigate={onNavigate}
                  onOpenUpload={onOpenUpload}
                  onOpenAddRecord={onOpenAddRecord}
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
                  onOpenAddRecord={onOpenAddRecord}
                  onOpenExportReport={onOpenExportReport}
                />
              );
          }
        }}
      </AppLayout>
    </ThemeProvider>
  );
}
