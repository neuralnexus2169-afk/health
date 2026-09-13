import React from 'react';
import { Activity } from 'lucide-react';
import { PlaceholderView } from '../../components/ui/PlaceholderView';
import { NavigationRoute } from '../../types';

interface DiagnosesPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export function DiagnosesPage({ onNavigate }: DiagnosesPageProps) {
  return (
    <PlaceholderView
      title="Diagnoses"
      subtitle="Chronic conditions, clinical problem list, differential diagnoses, and resolved conditions."
      description="Your verified clinical problem list will appear here."
      icon={Activity}
      badgeText="ICD-10 Mapped"
      onNavigate={onNavigate}
      ctaLabel="View Health Overview"
      onCtaClick={() => onNavigate('overview')}
      plannedFeatures={[
        'Longitudinal condition evolution tracking (e.g. Type 2 Diabetes onset 2021)',
        'SNOMED-CT and ICD-10 standardized diagnostic taxonomy mapping',
        'Physician-verified diagnostic notes and resolved health episodes',
        'Direct linkage between conditions and corresponding diagnostic lab tests',
      ]}
    />
  );
}
