export type NavigationRoute =
  | 'overview'
  | 'timeline'
  | 'health-summary'
  | 'contradictions'
  | 'medical-records'
  | 'medications'
  | 'diagnoses'
  | 'lab-results'
  | 'ai-assistant'
  | 'documents'
  | 'settings'
  | 'privacy'
  | 'search';

export interface NavigationItem {
  id: NavigationRoute;
  label: string;
  href: string;
  iconName: string;
  badge?: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  type: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  lastUpdated: string;
  recordsCount: number;
  providersCount: number;
  bloodType?: string;
  allergies?: string[];
  primaryCarePhysician?: string;
}

export interface ImportantCondition {
  id: string;
  name: string;
  category: string;
  diagnosedYear: number | string;
  status: 'Active' | 'Well-controlled' | 'Monitoring' | 'Resolved';
  severity?: 'Mild' | 'Moderate' | 'Chronic';
  notes?: string;
}

export interface CurrentMedication {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  route: string;
  prescribedBy: string;
  refillStatus: string;
  status: 'Active' | 'Paused' | 'As Needed';
}

export interface RecentTest {
  id: string;
  name: string;
  value: string;
  unit?: string;
  status: 'Normal' | 'Optimal' | 'Target' | 'Elevated' | 'Review';
  date: string;
  referenceRange?: string;
  laboratory: string;
}

export interface RecentEvent {
  id: string;
  type: 'Doctor consultation' | 'Laboratory test' | 'Hospital visit';
  title: string;
  date: string;
  provider: string;
  location: string;
  badgeColor?: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  actionRoute: NavigationRoute;
}
