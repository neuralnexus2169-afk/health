import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PlaceholderView } from '../../components/ui/PlaceholderView';
import { NavigationRoute } from '../../types';

interface PrivacyPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export function PrivacyPage({ onNavigate }: PrivacyPageProps) {
  return (
    <PlaceholderView
      title="Privacy & Data Governance"
      subtitle="HIPAA-aligned security protocols, patient access controls, cryptographic encryption, and access logs."
      description="Privacy audits, granular consent permissions, and data retention policies will appear here."
      icon={ShieldCheck}
      badgeText="HIPAA & Zero-Trust"
      onNavigate={onNavigate}
      ctaLabel="Return to Overview"
      onCtaClick={() => onNavigate('overview')}
      plannedFeatures={[
        'End-to-end cryptographic encryption status overview (AES-256 GCM)',
        'Granular doctor-level sharing permissions and revocable time-limited tokens',
        'Comprehensive immutable audit trail of every record viewed or exported',
        'Right to be forgotten and full medical data sanitization controls',
      ]}
    />
  );
}
