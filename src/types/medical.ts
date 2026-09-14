/**
 * Core Medical Data Model Types for HealthTimeline
 * Designed for longitudinal health tracking, source/evidence tracking,
 * and future AI contradiction detection & clinical QA.
 */

export type Gender = 'Male' | 'Female' | 'Other' | 'Allergy';

export type DocumentType =
  | 'Prescription'
  | 'Lab Report'
  | 'Discharge Summary'
  | 'Consultation Note'
  | 'Imaging Report'
  | 'Medical Bill'
  | 'Vaccination Record'
  | 'Other'
  | 'Allergy';

export type DocumentStatus =
  | 'Uploaded'
  | 'Processing'
  | 'Needs Review'
  | 'Confirmed'
  | 'Processed'
  | 'Failed';

export type ExtractionStatus =
  | 'Pending'
  | 'Completed'
  | 'Needs Review'
  | 'Confirmed'
  | 'Rejected';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export type ReviewState = 'High Confidence' | 'Review Recommended' | 'Ambiguous' | 'Unrecognized';

export interface ExtractedPatientInfo {
  id?: string;
  name?: string;
  dateOfBirth?: string;
  gender?: string;
  mrn?: string;
  confidence?: ConfidenceLevel;
  reviewState?: ReviewState;
  confidenceReason?: string;
  sourceText?: string;
  sourceQuote?: string;
  sourceLocation?: string;
  pageNumber?: number;
  accepted?: boolean;
}

export interface ExtractedMedicalEventItem {
  id: string;
  title: string;
  eventType: MedicalEventType;
  date?: string;
  facility?: string;
  provider?: string;
  summary?: string;
  confidence?: ConfidenceLevel;
  reviewState?: ReviewState;
  confidenceReason?: string;
  sourceText?: string;
  sourceQuote?: string;
  sourceLocation?: string;
  pageNumber?: number;
  accepted?: boolean;
}

export interface ExtractedDiagnosis {
  id: string;
  name: string;
  status: DiagnosisStatus;
  date?: string;
  confidence?: ConfidenceLevel;
  reviewState?: ReviewState;
  confidenceReason?: string;
  sourceQuote?: string;
  sourceText?: string;
  pageNumber?: number;
  sourceLocation?: string;
  accepted?: boolean;
}

export interface ExtractedMedication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route?: string;
  startDate?: string;
  endDate?: string;
  status: MedicationStatus;
  confidence?: ConfidenceLevel;
  reviewState?: ReviewState;
  confidenceReason?: string;
  sourceQuote?: string;
  sourceText?: string;
  pageNumber?: number;
  sourceLocation?: string;
  accepted?: boolean;
}

export interface ExtractedLabResult {
  id: string;
  testName: string;
  parameterName: string;
  value: number | string;
  unit: string;
  referenceRange?: string;
  date?: string;
  interpretation?: 'Normal' | 'Elevated' | 'Low' | 'Target' | 'Critical';
  confidence?: ConfidenceLevel;
  reviewState?: ReviewState;
  confidenceReason?: string;
  sourceQuote?: string;
  sourceText?: string;
  pageNumber?: number;
  sourceLocation?: string;
  accepted?: boolean;
}

export interface ExtractedProcedure {
  id: string;
  name: string;
  date?: string;
  provider?: string;
  confidence?: ConfidenceLevel;
  reviewState?: ReviewState;
  confidenceReason?: string;
  sourceQuote?: string;
  sourceText?: string;
  pageNumber?: number;
  sourceLocation?: string;
  accepted?: boolean;
}

export interface ExtractedAllergy {
  id: string;
  substance: string;
  reaction?: string;
  severity?: 'Mild' | 'Moderate' | 'Severe' | 'Unknown';
  confidence?: ConfidenceLevel;
  reviewState?: ReviewState;
  confidenceReason?: string;
  sourceQuote?: string;
  sourceText?: string;
  pageNumber?: number;
  sourceLocation?: string;
  accepted?: boolean;
}

export interface ExtractedNeedsReviewItem {
  id: string;
  suggestedCategory: 'Diagnosis' | 'Medication' | 'Lab Result' | 'Procedure' | 'Allergy' | 'Patient Info' | 'Medical Event' | 'Other' | 'Unrecognized';
  rawText: string;
  confidenceReason: string;
  sourceLocation?: string;
  sourceText?: string;
  reviewState: ReviewState;
  fieldValues?: Record<string, any>;
  accepted?: boolean;
}

export interface StructuredExtractionData {
  documentDate?: string;
  documentType?: DocumentType;
  facility?: string;
  facilityType?: string;
  provider?: string;
  providerSpecialty?: string;
  patientInfo?: ExtractedPatientInfo;
  diagnoses: ExtractedDiagnosis[];
  medications: ExtractedMedication[];
  labResults: ExtractedLabResult[];
  procedures: ExtractedProcedure[];
  allergies: ExtractedAllergy[];
  medicalEvents?: ExtractedMedicalEventItem[];
  needsReviewItems?: ExtractedNeedsReviewItem[];
  clinicalNotes: string[];
  summarySnippet?: string;
}

export interface DocumentExtraction {
  id: string;
  documentId: string;
  model: string;
  status: ExtractionStatus;
  rawExtraction?: string;
  data: StructuredExtractionData;
  reviewedData?: StructuredExtractionData;
  extractedAt: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MedicalEventType =
  | 'Consultation'
  | 'Diagnosis'
  | 'Medication'
  | 'Laboratory'
  | 'Imaging'
  | 'Procedure'
  | 'Hospitalization'
  | 'Vaccination'
  | 'Other'
  | 'Allergy';

export type DiagnosisStatus =
  | 'Active'
  | 'Resolved'
  | 'Historical'
  | 'Unknown';

export type MedicationStatus =
  | 'Active'
  | 'Discontinued'
  | 'Historical'
  | 'Unknown';

export type InsightType =
  | 'Trend'
  | 'Potential Inconsistency'
  | 'Missing Information'
  | 'Summary'
  | 'Other'
  | 'Allergy';

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string; // ISO date string e.g. "1979-05-14"
  gender: Gender;
  bloodGroup?: string;
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  type: string; // 'General Hospital' | 'Specialty Clinic' | 'Diagnostic Laboratory' | etc.
  address?: string;
  createdAt: string;
}

export interface HealthcareProvider {
  id: string;
  name: string;
  specialization: string;
  facilityId: string;
  facilityName?: string;
  createdAt: string;
}

export interface SourceReference {
  id: string;
  documentId: string;
  documentFileName?: string;
  pageNumber?: number;
  sourceText?: string;
  createdAt: string;
}

export interface MedicalDocument {
  id: string;
  patientId: string;
  fileName: string;
  documentType: DocumentType;
  documentDate: string; // ISO date string e.g. "2023-11-14"
  facilityId?: string;
  facilityName?: string;
  providerId?: string;
  providerName?: string;
  status: DocumentStatus;
  pageCount?: number;
  fileSizeBytes?: number;
  extractedTextSnippet?: string;
  createdAt: string;
}

export interface MedicalEvent {
  id: string;
  patientId: string;
  eventType: MedicalEventType;
  eventDate: string; // ISO date string e.g. "2023-11-14"
  title: string;
  description: string;
  facilityId?: string;
  facilityName?: string;
  providerId?: string;
  providerName?: string;
  documentId?: string;
  documentFileName?: string;
  sourceReferenceId?: string;
  isManualEntry?: boolean;
  createdAt: string;
}

export interface Diagnosis {
  id: string;
  patientId: string;
  name: string;
  status: DiagnosisStatus;
  firstDocumentedDate: string; // ISO date string
  lastDocumentedDate: string;  // ISO date string
  eventId?: string;
  documentId?: string;
  documentFileName?: string;
  clinicalNotes?: string;
  category?: string;
  sourceReferenceId?: string;
  isManualEntry?: boolean;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route?: string;
  startDate: string; // ISO date string
  endDate?: string;  // ISO date string
  status: MedicationStatus;
  eventId?: string;
  documentId?: string;
  documentFileName?: string;
  prescribedBy?: string;
  indication?: string;
  refillNote?: string;
  sourceReferenceId?: string;
  isManualEntry?: boolean;
}

export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  parameterName: string;
  value: number;
  unit: string;
  referenceRange?: string;
  testDate: string; // ISO date string
  facilityId?: string;
  facilityName?: string;
  documentId?: string;
  documentFileName?: string;
  eventId?: string;
  interpretation?: 'Normal' | 'Elevated' | 'Low' | 'Target' | 'Critical';
  sourceReferenceId?: string;
  isManualEntry?: boolean;
}

export interface AIInsight {
  id: string;
  patientId: string;
  type: InsightType;
  title: string;
  content: string;
  confidence?: number;
  createdAt: string;
}

export type ContradictionCategory = 'Allergy' | 'Medication' | 'Diagnosis' | 'Timeline';
export type ContradictionSeverity = 'High' | 'Moderate' | 'Advisory';
export type ContradictionReviewStatus = 'Unreviewed' | 'Reviewed';

export interface ContradictionEvidenceItem {
  documentId: string;
  documentFileName: string;
  documentDate: string;
  facilityName?: string;
  providerName?: string;
  pageNumber?: number;
  quote: string;
  fact: string;
  sourceReferenceId?: string;
  eventId?: string;
}

export interface MedicalContradiction {
  id: string;
  patientId: string;
  category: ContradictionCategory;
  title: string;
  description: string;
  clinicalExplanation?: string;
  severity: ContradictionSeverity;
  status: 'Unresolved' | 'Acknowledged' | 'Dismissed' | 'Unreviewed' | 'Reviewed';
  reviewStatus?: ContradictionReviewStatus;
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  firstFact?: string;
  secondFact?: string;
  firstDate?: string;
  secondDate?: string;
  firstProvider?: string;
  secondProvider?: string;
  firstFacility?: string;
  secondFacility?: string;
  firstSourceReference?: string;
  secondSourceReference?: string;
  firstDocument?: ContradictionEvidenceItem;
  secondDocument?: ContradictionEvidenceItem;
  sourceA: {
    documentId: string;
    documentFileName: string;
    documentDate: string;
    pageNumber?: number;
    quote: string;
    facilityName?: string;
    providerName?: string;
  };
  sourceB: {
    documentId: string;
    documentFileName: string;
    documentDate: string;
    pageNumber?: number;
    quote: string;
    facilityName?: string;
    providerName?: string;
  };
}

/**
 * Structured AI Health Summary data types (Step 6)
 */
export interface HealthSummaryCondition {
  name: string;
  firstDocumented: string;
  lastDocumented: string;
  status: string;
  sourceEventIds: string[];
}

export interface HealthSummaryMedication {
  name: string;
  summary: string;
  sourceEventIds: string[];
}

export interface HealthSummaryLabTrend {
  parameter: string; // e.g., 'HbA1c', 'Fasting Plasma Glucose', 'Renal Function (Creatinine / eGFR)'
  summary: string;
  sourceEventIds: string[];
}

export interface HealthSummaryJourneyItem {
  category: 'Hospitalization' | 'Consultation' | 'Procedure' | 'Investigation';
  date: string;
  summary: string;
  sourceEventIds: string[];
}

export interface HealthSummaryRecordObservation {
  summary: string;
  sourceEventIds: string[];
}

export interface HealthSummaryStructuredData {
  overview: string;
  conditions: HealthSummaryCondition[];
  medications: HealthSummaryMedication[];
  labTrends: HealthSummaryLabTrend[];
  healthcareJourney: HealthSummaryJourneyItem[];
  recordObservations?: HealthSummaryRecordObservation[];
}

export interface StoredHealthSummary {
  id: string;
  patientId: string;
  type: 'Summary';
  title: string;
  content: HealthSummaryStructuredData;
  sourceEventIds: string[];
  model: string;
  createdAt: string;
  confirmedRecordCount: number;
  lastRecordDate?: string;
  isOutdated?: boolean;
}

export interface PatientConfirmedRecordsContext {
  patient: Patient;
  events: MedicalEvent[];
  diagnoses: Diagnosis[];
  medications: Medication[];
  labResults: LabResult[];
  facilities?: HealthcareFacility[];
  providers?: HealthcareProvider[];
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface StructuredChartPoint {
  date: string;
  value: number;
  unit: string;
  interpretation?: string;
  eventId?: string;
}

export interface HealthAssistantStructuredData {
  type: 'table' | 'chart' | 'none';
  title?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  chartData?: {
    parameter: string;
    unit: string;
    points: StructuredChartPoint[];
  };
}

export interface HealthAssistantPotentialInconsistency {
  detected: boolean;
  description: string;
  records: {
    label: string;
    details: string;
    sourceEventId?: string;
    sourceDocumentId?: string;
    documentFileName?: string;
  }[];
}

export interface HealthHistoryAnswer {
  answer: string;
  sourceEventIds: string[];
  sourceDocumentIds: string[];
  confidence: 'high' | 'medium' | 'low';
  safetyNotice?: string;
  potentialInconsistency?: HealthAssistantPotentialInconsistency;
  structuredData?: HealthAssistantStructuredData;
  suggestedFollowUps?: string[];
}

export interface HealthAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sourceEventIds?: string[];
  sourceDocumentIds?: string[];
  confidence?: 'high' | 'medium' | 'low';
  safetyNotice?: string;
  potentialInconsistency?: HealthAssistantPotentialInconsistency;
  structuredData?: HealthAssistantStructuredData;
  suggestedFollowUps?: string[];
}

export interface HealthHistoryQueryContext {
  patientId: string;
  question: string;
  history: ConversationTurn[];
  retrievedRecords: {
    events: MedicalEvent[];
    diagnoses: Diagnosis[];
    medications: Medication[];
    labResults: LabResult[];
    documents: MedicalDocument[];
    facilities: HealthcareFacility[];
    providers: HealthcareProvider[];
    contradictions?: MedicalContradiction[];
  };
}

