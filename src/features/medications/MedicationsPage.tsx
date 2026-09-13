import React from 'react';
import { Pill } from 'lucide-react';
import { PlaceholderView } from '../../components/ui/PlaceholderView';
import { NavigationRoute } from '../../types';

interface MedicationsPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export function MedicationsPage({ onNavigate }: MedicationsPageProps) {
  return (
    <PlaceholderView
      title="Medications"
      subtitle="Complete active prescriptions, dosage schedules, refill timers, and historical therapies."
      description="Active medication tracking and adherence management will appear here."
      icon={Pill}
      badgeText="2 Active Prescriptions"
      onNavigate={onNavigate}
      ctaLabel="View Health Overview"
      onCtaClick={() => onNavigate('overview')}
      plannedFeatures={[
        'Real-time prescription interaction and contraindication alerts',
        'Dosage schedule reminder log and daily administration tracking',
        'Historical medication discontinuation logs with recorded physician rationale',
        'Pharmacy integration and auto-refill status updates',
      ]}
    />
  );
}
