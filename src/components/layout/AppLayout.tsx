import React, { useState, useEffect } from 'react';
import { NavigationRoute, PatientProfile } from '../../types';
import { DEMO_PATIENTS } from '../../lib/demo-data';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { DocumentUploadModal } from '../documents/DocumentUploadModal';
import { ExportReportModal } from '../reports/ExportReportModal';
import { OnboardingPage } from '../../features/onboarding/OnboardingPage';
import { AddRecordModal } from '../documents/AddRecordModal';

interface AppLayoutProps {
  children: (props: {
    currentRoute: NavigationRoute;
    currentPatient: PatientProfile;
    onNavigate: (route: NavigationRoute, targetId?: string, extraParams?: Record<string, string>) => void;
    onOpenUpload: () => void;
    onOpenAddRecord: () => void;
    onOpenExportReport: () => void;
    searchQuery: string;
    assistantInitialQuestion: string;
  }) => React.ReactNode;
}

const ROUTE_PATH_MAP: Record<NavigationRoute, string> = {
  overview: '/',
  timeline: '/timeline',
  'health-summary': '/health-summary',
  'medical-records': '/medical-records',
  medications: '/medications',
  diagnoses: '/diagnoses',
  'lab-results': '/lab-results',
  'ai-assistant': '/ai-assistant',
  documents: '/documents',
  contradictions: '/contradictions',
  settings: '/settings',
  privacy: '/privacy',
  search: '/search',
};

const PATH_TO_ROUTE: Record<string, NavigationRoute> = {
  '/': 'overview',
  '/overview': 'overview',
  '/timeline': 'timeline',
  '/health-summary': 'health-summary',
  '/medical-records': 'medical-records',
  '/medications': 'medications',
  '/diagnoses': 'diagnoses',
  '/lab-results': 'lab-results',
  '/ai-assistant': 'ai-assistant',
  '/documents': 'documents',
  '/contradictions': 'contradictions',
  '/settings': 'settings',
  '/privacy': 'privacy',
  '/search': 'search',
};

export function AppLayout({ children }: AppLayoutProps) {
  const [currentPatient, setCurrentPatient] = useState<PatientProfile | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  
  const fetchPatient = async () => {
    try {
      const { getAllPatients, getPatientOverview } = await import('../../services/patientService');
      const patients = await getAllPatients();
      if (patients.length > 0) {
        const overview = await getPatientOverview(patients[0].id);
        setCurrentPatient(overview.profile);
      } else {
        setCurrentPatient(null);
      }
    } catch (err) {
      console.error('Failed to fetch patient:', err);
      setCurrentPatient(null);
    } finally {
      setIsLoadingPatient(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, []);

  const [currentRoute, setCurrentRoute] = useState<NavigationRoute>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return PATH_TO_ROUTE[path] || 'overview';
    }
    return 'overview';
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('q') || '';
    }
    return '';
  });

  const [assistantInitialQuestion, setAssistantInitialQuestion] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [isExportReportModalOpen, setIsExportReportModalOpen] = useState(false);

  // Sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const matchedRoute = PATH_TO_ROUTE[path] || 'overview';
      setCurrentRoute(matchedRoute);
      if (matchedRoute === 'search') {
        const urlParams = new URLSearchParams(window.location.search);
        setSearchQuery(urlParams.get('q') || '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (
    route: NavigationRoute,
    targetId?: string,
    extraParams?: Record<string, string>
  ) => {
    setCurrentRoute(route);
    setIsMobileSidebarOpen(false);

    let targetPath = ROUTE_PATH_MAP[route] || '/';
    if (extraParams && Object.keys(extraParams).length > 0) {
      const searchParams = new URLSearchParams(extraParams);
      targetPath += `?${searchParams.toString()}`;
    }

    if (route === 'search' && extraParams?.q !== undefined) {
      setSearchQuery(extraParams.q);
    } else if (route === 'ai-assistant' && extraParams?.question) {
      setAssistantInitialQuestion(extraParams.question);
    }

    if (typeof window !== 'undefined') {
      window.history.pushState({ route, targetId, extraParams }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoadingPatient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-app)] text-[var(--color-text-primary)]">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!currentPatient) {
    return <OnboardingPage onComplete={(patient) => setCurrentPatient(patient)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-app)] text-[var(--color-text-primary)] transition-colors duration-200 flex">
      {/* Fixed Sidebar for Desktop + Drawer for Mobile */}
      <AppSidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navigation */}
        <TopBar
          currentRoute={currentRoute}
          currentPatient={currentPatient}
          availablePatients={[currentPatient]}
          onSelectPatient={setCurrentPatient}
          onNavigate={handleNavigate}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children({
            currentRoute,
            currentPatient,
            onNavigate: handleNavigate,
            onOpenUpload: () => setIsUploadModalOpen(true),
            onOpenAddRecord: () => setIsAddRecordModalOpen(true),
            onOpenExportReport: () => setIsExportReportModalOpen(true),
            searchQuery,
            assistantInitialQuestion,
          })}
        </main>
      </div>

      {/* Upload Record Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentCreated={fetchPatient}
        patientId={currentPatient?.id}
      />

      <AddRecordModal
        isOpen={isAddRecordModalOpen}
        onClose={() => setIsAddRecordModalOpen(false)}
        onRecordCreated={fetchPatient}
        patientId={currentPatient?.id}
      />

      {/* Export Health Report Modal */}
      <ExportReportModal
        isOpen={isExportReportModalOpen}
        onClose={() => setIsExportReportModalOpen(false)}
        patient={currentPatient}
      />
    </div>
  );
}
