import {
  PatientProfile,
  ImportantCondition,
  CurrentMedication,
  RecentTest,
  RecentEvent,
  NavigationItem,
} from '../types';

export const DEMO_PATIENTS: PatientProfile[] = [
  {
    id: 'pat-john-doe-01',
    name: 'John Doe',
    type: 'Demo Patient',
    age: 47,
    gender: 'Male',
    dateOfBirth: 'May 14, 1979',
    lastUpdated: 'September 13, 2026',
    recordsCount: 18,
    providersCount: 5,
    bloodType: 'B+',
    allergies: ['Penicillin (Mild rash)', 'Sulfa drugs'],
    primaryCarePhysician: 'Dr. Sarah Jenkins, MD (Internal Medicine)',
  },
  {
    id: 'pat-sarah-chen-02',
    name: 'Sarah Chen',
    type: 'Demo Patient',
    age: 39,
    gender: 'Female',
    dateOfBirth: 'November 22, 1986',
    lastUpdated: 'September 08, 2026',
    recordsCount: 12,
    providersCount: 3,
    bloodType: 'O+',
    allergies: ['No known drug allergies (NKDA)'],
    primaryCarePhysician: 'Dr. Marcus Vance, MD (Family Medicine)',
  },
];

export const PRIMARY_NAV_ITEMS: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/',
    iconName: 'LayoutGrid',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    href: '/timeline',
    iconName: 'GitCommitHorizontal',
    badge: 'Core',
  },
  {
    id: 'search',
    label: 'Global Search',
    href: '/search',
    iconName: 'Search',
  },
  {
    id: 'health-summary',
    label: 'AI Health Summary',
    href: '/health-summary',
    iconName: 'Sparkles',
    badge: 'AI',
  },
  {
    id: 'documents',
    label: 'Medical Documents',
    href: '/documents',
    iconName: 'FileText',
  },
  {
    id: 'medications',
    label: 'Medications',
    href: '/medications',
    iconName: 'Pill',
  },
  {
    id: 'diagnoses',
    label: 'Diagnoses',
    href: '/diagnoses',
    iconName: 'Activity',
  },
  {
    id: 'lab-results',
    label: 'Lab Results',
    href: '/lab-results',
    iconName: 'FlaskConical',
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    href: '/ai-assistant',
    iconName: 'Sparkles',
    badge: 'AI',
  },
  {
    id: 'contradictions',
    label: 'Inconsistencies',
    href: '/contradictions',
    iconName: 'AlertTriangle',
    badge: '1',
  },
];

export const SECONDARY_NAV_ITEMS: NavigationItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    iconName: 'Settings',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    href: '/privacy',
    iconName: 'ShieldCheck',
  },
];

export const DEMO_CONDITIONS: ImportantCondition[] = [
  {
    id: 'cond-1',
    name: 'Type 2 Diabetes',
    category: 'Endocrine & Metabolic',
    diagnosedYear: '2018',
    status: 'Active',
    severity: 'Chronic',
    notes: 'Managed with Metformin and Empagliflozin; routine HbA1c surveillance every 3 months.',
  },
  {
    id: 'cond-2',
    name: 'Hypertension',
    category: 'Cardiovascular',
    diagnosedYear: '2020',
    status: 'Well-controlled',
    severity: 'Moderate',
    notes: 'Stable blood pressure readings with Amlodipine regimen (122/78 mmHg average).',
  },
];

export const DEMO_MEDICATIONS: CurrentMedication[] = [
  {
    id: 'med-1',
    name: 'Metformin',
    dosage: '500 mg',
    schedule: 'Oral · Once daily with evening meal',
    route: 'Oral Tablet',
    prescribedBy: 'Dr. Sarah Jenkins, MD',
    refillStatus: 'Active · Refill by Nov 2026',
    status: 'Active',
  },
  {
    id: 'med-2',
    name: 'Amlodipine',
    dosage: '5 mg',
    schedule: 'Oral · Once daily in the morning',
    route: 'Oral Tablet',
    prescribedBy: 'Dr. Robert Torres, MD',
    refillStatus: 'Active · Refill by Oct 2026',
    status: 'Active',
  },
];

export const DEMO_RECENT_TESTS: RecentTest[] = [
  {
    id: 'test-1',
    name: 'HbA1c (Hemoglobin A1c)',
    value: '6.8%',
    unit: '%',
    status: 'Target',
    date: 'Aug 24, 2026',
    referenceRange: '< 7.0% (Clinical Target)',
    laboratory: 'Quest Diagnostics Regional Lab',
  },
  {
    id: 'test-2',
    name: 'Lipid Profile',
    value: 'LDL 94 mg/dL',
    unit: 'mg/dL',
    status: 'Normal',
    date: 'Aug 24, 2026',
    referenceRange: 'Total Chol 178 mg/dL · HDL 48 mg/dL · Trig 142 mg/dL',
    laboratory: 'Quest Diagnostics Regional Lab',
  },
];

export const DEMO_RECENT_EVENTS: RecentEvent[] = [
  {
    id: 'ev-1',
    type: 'Doctor consultation',
    title: 'Endocrine Follow-up & Diabetes Review',
    date: 'August 28, 2026',
    provider: 'Dr. Sarah Jenkins, MD',
    location: 'Bayview Medical Pavilion · Suite 402',
  },
  {
    id: 'ev-2',
    type: 'Laboratory test',
    title: 'Comprehensive Metabolic Panel & Glycemic Labs',
    date: 'August 24, 2026',
    provider: 'Quest Diagnostics Outpatient',
    location: 'Central Diagnostic Center',
  },
  {
    id: 'ev-3',
    type: 'Hospital visit',
    title: 'Cardiovascular Assessment & Stress Echo',
    date: 'May 12, 2026',
    provider: 'Metro General Cardiology Group',
    location: 'Metro Health Hospital · Cardiology Outpatient',
  },
];
