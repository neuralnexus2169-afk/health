import {
  Patient,
  HealthcareFacility,
  HealthcareProvider,
  MedicalDocument,
  MedicalEvent,
  Diagnosis,
  Medication,
  LabResult,
  SourceReference,
  MedicalContradiction,
  DocumentExtraction,
} from '../../../types/medical';

export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findAll(): Promise<Patient[]>;
  create(patient: Omit<Patient, 'createdAt' | 'updatedAt'>): Promise<Patient>;
  update(id: string, updates: Partial<Patient>): Promise<Patient | null>;
}

export interface IFacilityRepository {
  findById(id: string): Promise<HealthcareFacility | null>;
  findAll(): Promise<HealthcareFacility[]>;
  create(facility: Omit<HealthcareFacility, 'createdAt'>): Promise<HealthcareFacility>;
}

export interface IProviderRepository {
  findById(id: string): Promise<HealthcareProvider | null>;
  findAll(): Promise<HealthcareProvider[]>;
  findByFacilityId(facilityId: string): Promise<HealthcareProvider[]>;
  create(provider: Omit<HealthcareProvider, 'createdAt'>): Promise<HealthcareProvider>;
}

export interface IDocumentRepository {
  findById(id: string): Promise<MedicalDocument | null>;
  findByPatientId(patientId: string): Promise<MedicalDocument[]>;
  create(document: Omit<MedicalDocument, 'createdAt'>): Promise<MedicalDocument>;
  updateStatus(id: string, status: MedicalDocument['status']): Promise<MedicalDocument | null>;
}

export interface ITimelineRepository {
  findByPatientId(patientId: string): Promise<MedicalEvent[]>;
  findById(id: string): Promise<MedicalEvent | null>;
  create(event: Omit<MedicalEvent, 'createdAt'>): Promise<MedicalEvent>;
}

export interface IDiagnosisRepository {
  findByPatientId(patientId: string): Promise<Diagnosis[]>;
  findById(id: string): Promise<Diagnosis | null>;
  create(diagnosis: Diagnosis): Promise<Diagnosis>;
}

export interface IMedicationRepository {
  findByPatientId(patientId: string): Promise<Medication[]>;
  findById(id: string): Promise<Medication | null>;
  create(medication: Medication): Promise<Medication>;
}

export interface ILabResultRepository {
  findByPatientId(patientId: string): Promise<LabResult[]>;
  findByTestName(patientId: string, testName: string): Promise<LabResult[]>;
  findById(id: string): Promise<LabResult | null>;
  create(labResult: LabResult): Promise<LabResult>;
}

export interface ISourceReferenceRepository {
  findById(id: string): Promise<SourceReference | null>;
  findByDocumentId(documentId: string): Promise<SourceReference[]>;
  findAll(): Promise<SourceReference[]>;
  create(ref: Omit<SourceReference, 'createdAt'>): Promise<SourceReference>;
}

export interface IContradictionRepository {
  findByPatientId(patientId: string): Promise<MedicalContradiction[]>;
}

export interface IDocumentExtractionRepository {
  findById(id: string): Promise<DocumentExtraction | null>;
  findByDocumentId(documentId: string): Promise<DocumentExtraction[]>;
  getLatestByDocumentId(documentId: string): Promise<DocumentExtraction | null>;
  create(extraction: DocumentExtraction): Promise<DocumentExtraction>;
  update(id: string, updates: Partial<DocumentExtraction>): Promise<DocumentExtraction | null>;
}

export interface IHealthSummaryRepository {
  getLatestByPatientId(patientId: string): Promise<import('../../../types/medical').StoredHealthSummary | null>;
  create(summary: import('../../../types/medical').StoredHealthSummary): Promise<import('../../../types/medical').StoredHealthSummary>;
  deleteByPatientId(patientId: string): Promise<void>;
}

