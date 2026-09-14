export type ReportPreset = 'complete' | 'doctor-visit' | 'medication-lab' | 'custom';

export type TimelineRangeOption = 'all' | '1yr' | '3yr' | 'custom';

export interface ReportSections {
  patientInfo: boolean;
  healthSummary: boolean;
  allergies: boolean;
  activeDiagnoses: boolean;
  diagnosisHistory: boolean;
  currentMedications: boolean;
  medicationHistory: boolean;
  labResults: boolean;
  labTrends: boolean;
  timeline: boolean;
  providersFacilities: boolean;
  contradictions: boolean;
  sourceReferences: boolean;
}

export interface HealthReportConfig {
  patientId: string;
  preset: ReportPreset;
  sections: ReportSections;
  timelineRange: TimelineRangeOption;
  customStartDate?: string;
  customEndDate?: string;
  reportTitle?: string;
  clinicalNotes?: string;
}

export const PRESET_CONFIGURATIONS: Record<
  ReportPreset,
  {
    name: string;
    description: string;
    sections: ReportSections;
    timelineRange: TimelineRangeOption;
  }
> = {
  complete: {
    name: 'Complete Health History',
    description: 'Comprehensive longitudinal record covering all conditions, medications, labs, events, and inconsistency reviews.',
    timelineRange: 'all',
    sections: {
      patientInfo: true,
      healthSummary: true,
      allergies: true,
      activeDiagnoses: true,
      diagnosisHistory: true,
      currentMedications: true,
      medicationHistory: true,
      labResults: true,
      labTrends: true,
      timeline: true,
      providersFacilities: true,
      contradictions: true,
      sourceReferences: true,
    },
  },
  'doctor-visit': {
    name: 'Doctor Visit Summary',
    description: 'Concise clinical handoff prioritizing active problems, current medications, recent labs, and flagged alerts.',
    timelineRange: '1yr',
    sections: {
      patientInfo: true,
      healthSummary: false,
      allergies: true,
      activeDiagnoses: true,
      diagnosisHistory: false,
      currentMedications: true,
      medicationHistory: false,
      labResults: true,
      labTrends: true,
      timeline: true,
      providersFacilities: true,
      contradictions: true,
      sourceReferences: false,
    },
  },
  'medication-lab': {
    name: 'Medication & Lab Report',
    description: 'Focused pharmacological and biomarker report with longitudinal therapy changes and HbA1c/metabolic trajectories.',
    timelineRange: '3yr',
    sections: {
      patientInfo: true,
      healthSummary: false,
      allergies: true,
      activeDiagnoses: false,
      diagnosisHistory: false,
      currentMedications: true,
      medicationHistory: true,
      labResults: true,
      labTrends: true,
      timeline: false,
      providersFacilities: false,
      contradictions: false,
      sourceReferences: false,
    },
  },
  custom: {
    name: 'Custom Report',
    description: 'Manually select which clinical sections, timeline ranges, and evidence references to include.',
    timelineRange: 'all',
    sections: {
      patientInfo: true,
      healthSummary: true,
      allergies: true,
      activeDiagnoses: true,
      diagnosisHistory: false,
      currentMedications: true,
      medicationHistory: true,
      labResults: true,
      labTrends: true,
      timeline: true,
      providersFacilities: true,
      contradictions: true,
      sourceReferences: false,
    },
  },
};
