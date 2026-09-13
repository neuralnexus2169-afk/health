import React from 'react';
import { Settings } from 'lucide-react';
import { PlaceholderView } from '../../components/ui/PlaceholderView';
import { NavigationRoute } from '../../types';

interface SettingsPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  return (
    <PlaceholderView
      title="Settings"
      subtitle="Application preferences, notification delivery channels, EHR portal connections, and export formats."
      description="User preferences and health data sync settings will appear here."
      icon={Settings}
      badgeText="Preferences"
      onNavigate={onNavigate}
      ctaLabel="Return to Overview"
      onCtaClick={() => onNavigate('overview')}
      plannedFeatures={[
        'Portal integrations (MyChart, Epic, Cerner, Quest Diagnostics, LabCorp)',
        'Emergency health profile and emergency contact configurations',
        'Notification frequency and lab abnormal alert thresholds',
        'Data export into standard JSON, CCDA, or PDF archive packages',
      ]}
    />
  );
}
