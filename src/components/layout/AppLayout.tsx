import React, { useState, useEffect } from 'react';
import { NavigationRoute, PatientProfile } from '../../types';
import { DEMO_PATIENTS } from '../../lib/demo-data';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { UploadRecordModal } from '../dashboard/UploadRecordModal';

interface AppLayoutProps {
  children: (props: {
    currentRoute: NavigationRoute;
    currentPatient: PatientProfile;
    onNavigate: (route: NavigationRoute) => void;
    onOpenUpload: () => void;
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
  settings: '/settings',
  privacy: '/privacy',
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
  '/settings': 'settings',
  '/privacy': 'privacy',
};

export function AppLayout({ children }: AppLayoutProps) {
  const [currentPatient, setCurrentPatient] = useState<PatientProfile>(DEMO_PATIENTS[0]);
  const [currentRoute, setCurrentRoute] = useState<NavigationRoute>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return PATH_TO_ROUTE[path] || 'overview';
    }
    return 'overview';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const matchedRoute = PATH_TO_ROUTE[path] || 'overview';
      setCurrentRoute(matchedRoute);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (route: NavigationRoute) => {
    setCurrentRoute(route);
    setIsMobileSidebarOpen(false);
    const targetPath = ROUTE_PATH_MAP[route] || '/';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ route }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 flex">
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
          availablePatients={DEMO_PATIENTS}
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
          })}
        </main>
      </div>

      {/* Upload Record Modal */}
      <UploadRecordModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
