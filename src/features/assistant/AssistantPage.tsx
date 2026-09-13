import React, { useState, useEffect } from 'react';
import { NavigationRoute } from '../../types';
import { ChatInterface } from './ChatInterface';
import { patientRepository } from '../../lib/db/repositories';
import { Patient } from '../../types/medical';

interface AssistantPageProps {
  onNavigate: (route: NavigationRoute) => void;
  selectedPatientId?: string;
}

export function AssistantPage({ onNavigate, selectedPatientId = 'pat-arun-mathew-01' }: AssistantPageProps) {
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    patientRepository.findById(selectedPatientId).then((p) => {
      if (p) setPatient(p);
    });
  }, [selectedPatientId]);

  return (
    <div className="w-full">
      <ChatInterface
        patientId={selectedPatientId}
        patientName={patient?.name || 'Arun Mathew'}
        onNavigate={onNavigate}
        onNavigateToDocument={(docId) => {
          onNavigate('documents');
        }}
      />
    </div>
  );
}
