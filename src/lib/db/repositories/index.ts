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

const isServer = typeof window === 'undefined';

function createClientProxy(repoName: string) {
  return new Proxy({}, {
    get(target, prop) {
      if (typeof prop === 'string') {
        return async (...args: any[]) => {
          const res = await fetch(`/api/db/${repoName}/${prop}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ args }),
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`DB RPC Error (${repoName}.${prop}): ${errText}`);
          }
          const json = await res.json();
          return json.result;
        };
      }
    },
  });
}

// Singleton mock repository instances
export const patientRepository: IPatientRepository = isServer ? new MockPatientRepository() : createClientProxy('patientRepository') as any;
export const facilityRepository: IFacilityRepository = isServer ? new MockFacilityRepository() : createClientProxy('facilityRepository') as any;
export const providerRepository: IProviderRepository = isServer ? new MockProviderRepository() : createClientProxy('providerRepository') as any;
export const documentRepository: IDocumentRepository = isServer ? new MockDocumentRepository() : createClientProxy('documentRepository') as any;
export const timelineRepository: ITimelineRepository = isServer ? new MockTimelineRepository() : createClientProxy('timelineRepository') as any;
export const diagnosisRepository: IDiagnosisRepository = isServer ? new MockDiagnosisRepository() : createClientProxy('diagnosisRepository') as any;
export const medicationRepository: IMedicationRepository = isServer ? new MockMedicationRepository() : createClientProxy('medicationRepository') as any;
export const labResultRepository: ILabResultRepository = isServer ? new MockLabResultRepository() : createClientProxy('labResultRepository') as any;
export const sourceReferenceRepository: ISourceReferenceRepository = isServer ? new MockSourceReferenceRepository() : createClientProxy('sourceReferenceRepository') as any;
export const contradictionRepository: IContradictionRepository = isServer ? new MockContradictionRepository() : createClientProxy('contradictionRepository') as any;
export const documentExtractionRepository: IDocumentExtractionRepository = isServer ? new MockDocumentExtractionRepository() : createClientProxy('documentExtractionRepository') as any;
export const healthSummaryRepository: IHealthSummaryRepository = isServer ? new MockHealthSummaryRepository() : createClientProxy('healthSummaryRepository') as any;

export * from './types';
export * from './mockRepositories';
