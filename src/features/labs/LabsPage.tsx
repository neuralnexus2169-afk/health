import React from 'react';
import { FlaskConical } from 'lucide-react';
import { PlaceholderView } from '../../components/ui/PlaceholderView';
import { NavigationRoute } from '../../types';

interface LabsPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export function LabsPage({ onNavigate }: LabsPageProps) {
  return (
    <PlaceholderView
      title="Lab Results"
      subtitle="Standardized laboratory panels, numeric biomarkers, reference intervals, and temporal trendlines."
      description="Your historical diagnostic panels and metabolic charts will appear here."
      icon={FlaskConical}
      badgeText="Biomarker Engine"
      onNavigate={onNavigate}
      ctaLabel="View Health Overview"
      onCtaClick={() => onNavigate('overview')}
      plannedFeatures={[
        'Longitudinal biomarker line charts (e.g. HbA1c trajectory across 5 years)',
        'Reference interval comparison bands with abnormal flags',
        'Direct PDF original report attachment viewer with highlighted values',
        'Organ-system biomarker clustering (Metabolic, Lipid, Renal, Liver, CBC)',
      ]}
    />
  );
}
