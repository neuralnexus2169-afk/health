import {
  IPatientRepository,
  IFacilityRepository,
  IProviderRepository,
  IDocumentRepository,
  ITimelineRepository,
  IDiagnosisRepository,
  IMedicationRepository,
  ILabResultRepository,
  ISourceReferenceRepository,
  IContradictionRepository,
  IDocumentExtractionRepository,
  IHealthSummaryRepository,
} from './types';
import {
  MockPatientRepository,
  MockFacilityRepository,
  MockProviderRepository,
  MockDocumentRepository,
  MockTimelineRepository,
  MockDiagnosisRepository,
  MockMedicationRepository,
  MockLabResultRepository,
  MockSourceReferenceRepository,
  MockContradictionRepository,
  MockDocumentExtractionRepository,
  MockHealthSummaryRepository,
} from './mockRepositories';

// Singleton mock repository instances
export const patientRepository: IPatientRepository = new MockPatientRepository();
export const facilityRepository: IFacilityRepository = new MockFacilityRepository();
export const providerRepository: IProviderRepository = new MockProviderRepository();
export const documentRepository: IDocumentRepository = new MockDocumentRepository();
export const timelineRepository: ITimelineRepository = new MockTimelineRepository();
export const diagnosisRepository: IDiagnosisRepository = new MockDiagnosisRepository();
export const medicationRepository: IMedicationRepository = new MockMedicationRepository();
export const labResultRepository: ILabResultRepository = new MockLabResultRepository();
export const sourceReferenceRepository: ISourceReferenceRepository = new MockSourceReferenceRepository();
export const contradictionRepository: IContradictionRepository = new MockContradictionRepository();
export const documentExtractionRepository: IDocumentExtractionRepository = new MockDocumentExtractionRepository();
export const healthSummaryRepository: IHealthSummaryRepository = new MockHealthSummaryRepository();

export * from './types';
export * from './mockRepositories';
