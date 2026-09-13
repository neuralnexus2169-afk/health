import React from 'react';
import { FileText } from 'lucide-react';
import { PlaceholderView } from '../../components/ui/PlaceholderView';
import { NavigationRoute } from '../../types';

interface RecordsPageProps {
  onNavigate: (route: NavigationRoute) => void;
  onOpenUpload: () => void;
}

export function RecordsPage({ onNavigate, onOpenUpload }: RecordsPageProps) {
  return (
    <PlaceholderView
      title="Medical Records"
      subtitle="Standardized repository of clinical notes, discharge summaries, and specialist letters."
      description="Your 18 unified medical records will be listed and searchable here."
      icon={FileText}
      badgeText="18 Records Ready"
      onNavigate={onNavigate}
      ctaLabel="Add New Record"
      onCtaClick={onOpenUpload}
      plannedFeatures={[
        'Full-text clinical document search with keyword tagging',
        'Provider categorization (Bayview Medical, Metro Health, Quest Diagnostics)',
        'FHIR/CCDA machine-readable export integration',
        'Secure audit logging for healthcare compliance',
      ]}
    />
  );
}
