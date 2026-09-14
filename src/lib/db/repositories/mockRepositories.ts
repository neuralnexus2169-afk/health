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
  StoredHealthSummary,
} from '../../../types/medical';
import {
  SEED_PATIENTS,
  SEED_FACILITIES,
  SEED_PROVIDERS,
  SEED_DOCUMENTS,
  SEED_MEDICAL_EVENTS,
  SEED_DIAGNOSES,
  SEED_MEDICATIONS,
  SEED_LAB_RESULTS,
  SEED_SOURCE_REFERENCES,
  SEED_CONTRADICTIONS,
} from '../seed-data';
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

export function normalizePatientId(id?: string): string {
  if (!id) return '';
  return id;
}


export class MockPatientRepository implements IPatientRepository {
  public patients: Patient[] = [];

  async findById(id: string): Promise<Patient | null> {
    const targetId = normalizePatientId(id);
    return this.patients.find((p) => p.id === targetId || p.id === id) || null;
  }

  async findAll(): Promise<Patient[]> {
    return [...this.patients];
  }

  async create(data: Omit<Patient, 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const now = new Date().toISOString();
    const newPatient: Patient = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.patients.push(newPatient);
    return newPatient;
  }

  async update(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    const targetId = normalizePatientId(id);
    const index = this.patients.findIndex((p) => p.id === targetId || p.id === id);
    if (index === -1) return null;
    this.patients[index] = {
      ...this.patients[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.patients[index];
  }
}

export class MockFacilityRepository implements IFacilityRepository {
  public facilities: HealthcareFacility[] = [];

  async findById(id: string): Promise<HealthcareFacility | null> {
    return this.facilities.find((f) => f.id === id) || null;
  }

  async findAll(): Promise<HealthcareFacility[]> {
    return [...this.facilities];
  }

  async create(data: Omit<HealthcareFacility, 'createdAt'>): Promise<HealthcareFacility> {
    const facility: HealthcareFacility = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.facilities.push(facility);
    return facility;
  }
}

export class MockProviderRepository implements IProviderRepository {
  public providers: HealthcareProvider[] = [];

  async findById(id: string): Promise<HealthcareProvider | null> {
    return this.providers.find((p) => p.id === id) || null;
  }

  async findAll(): Promise<HealthcareProvider[]> {
    return [...this.providers];
  }

  async findByFacilityId(facilityId: string): Promise<HealthcareProvider[]> {
    return this.providers.filter((p) => p.facilityId === facilityId);
  }

  async create(data: Omit<HealthcareProvider, 'createdAt'>): Promise<HealthcareProvider> {
    const provider: HealthcareProvider = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.providers.push(provider);
    return provider;
  }
}

export class MockDocumentRepository implements IDocumentRepository {
  public documents: MedicalDocument[] = [];

  async findById(id: string): Promise<MedicalDocument | null> {
    return this.documents.find((d) => d.id === id) || null;
  }

  async findByPatientId(patientId: string): Promise<MedicalDocument[]> {
    const targetId = normalizePatientId(patientId);
    return this.documents
      .filter((d) => d.patientId === targetId || d.patientId === patientId)
      .sort((a, b) => new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime());
  }

  async create(data: Omit<MedicalDocument, 'createdAt'>): Promise<MedicalDocument> {
    const doc: MedicalDocument = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.documents.push(doc);
    return doc;
  }

  async updateStatus(id: string, status: MedicalDocument['status']): Promise<MedicalDocument | null> {
    const doc = this.documents.find((d) => d.id === id);
    if (!doc) return null;
    doc.status = status;
    return doc;
  }
}

export class MockTimelineRepository implements ITimelineRepository {
  public events: MedicalEvent[] = [];

  async findByPatientId(patientId: string): Promise<MedicalEvent[]> {
    const targetId = normalizePatientId(patientId);
    return this.events
      .filter((e) => e.patientId === targetId || e.patientId === patientId)
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }

  async findById(id: string): Promise<MedicalEvent | null> {
    return this.events.find((e) => e.id === id) || null;
  }

  async create(data: Omit<MedicalEvent, 'createdAt'>): Promise<MedicalEvent> {
    const event: MedicalEvent = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  async update(id: string, updates: Partial<MedicalEvent>): Promise<MedicalEvent | null> {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.events[index] = { ...this.events[index], ...updates };
    return this.events[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.events.splice(index, 1);
    return true;
  }
}

export class MockDiagnosisRepository implements IDiagnosisRepository {
  public diagnoses: Diagnosis[] = [];

  async findByPatientId(patientId: string): Promise<Diagnosis[]> {
    const targetId = normalizePatientId(patientId);
    return this.diagnoses
      .filter((d) => d.patientId === targetId || d.patientId === patientId)
      .sort((a, b) => new Date(b.lastDocumentedDate).getTime() - new Date(a.lastDocumentedDate).getTime());
  }

  async findById(id: string): Promise<Diagnosis | null> {
    return this.diagnoses.find((d) => d.id === id) || null;
  }

  async create(diagnosis: Diagnosis): Promise<Diagnosis> {
    this.diagnoses.push(diagnosis);
    return diagnosis;
  }

  async update(id: string, updates: Partial<Diagnosis>): Promise<Diagnosis | null> {
    const index = this.diagnoses.findIndex(d => d.id === id);
    if (index === -1) return null;
    this.diagnoses[index] = { ...this.diagnoses[index], ...updates };
    return this.diagnoses[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.diagnoses.findIndex(d => d.id === id);
    if (index === -1) return false;
    this.diagnoses.splice(index, 1);
    return true;
  }
}

export class MockMedicationRepository implements IMedicationRepository {
  public medications: Medication[] = [];

  async findByPatientId(patientId: string): Promise<Medication[]> {
    const targetId = normalizePatientId(patientId);
    return this.medications
      .filter((m) => m.patientId === targetId || m.patientId === patientId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  async findById(id: string): Promise<Medication | null> {
    return this.medications.find((m) => m.id === id) || null;
  }

  async create(medication: Medication): Promise<Medication> {
    this.medications.push(medication);
    return medication;
  }

  async update(id: string, updates: Partial<Medication>): Promise<Medication | null> {
    const index = this.medications.findIndex(m => m.id === id);
    if (index === -1) return null;
    this.medications[index] = { ...this.medications[index], ...updates };
    return this.medications[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.medications.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.medications.splice(index, 1);
    return true;
  }
}

export class MockLabResultRepository implements ILabResultRepository {
  private labResults: LabResult[] = [];

  async findByPatientId(patientId: string): Promise<LabResult[]> {
    const targetId = normalizePatientId(patientId);
    return this.labResults
      .filter((l) => l.patientId === targetId || l.patientId === patientId)
      .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
  }

  async findByTestName(patientId: string, testName: string): Promise<LabResult[]> {
    const targetId = normalizePatientId(patientId);
    return this.labResults
      .filter(
        (l) =>
          (l.patientId === targetId || l.patientId === patientId) &&
          (l.testName.toLowerCase().includes(testName.toLowerCase()) ||
           l.parameterName.toLowerCase().includes(testName.toLowerCase()))
      )
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
  }

  async findById(id: string): Promise<LabResult | null> {
    return this.labResults.find((l) => l.id === id) || null;
  }

  async create(labResult: LabResult): Promise<LabResult> {
    this.labResults.push(labResult);
    return labResult;
  }

  async update(id: string, updates: Partial<LabResult>): Promise<LabResult | null> {
    const index = this.labResults.findIndex(l => l.id === id);
    if (index === -1) return null;
    this.labResults[index] = { ...this.labResults[index], ...updates };
    return this.labResults[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.labResults.findIndex(l => l.id === id);
    if (index === -1) return false;
    this.labResults.splice(index, 1);
    return true;
  }
}

export class MockSourceReferenceRepository implements ISourceReferenceRepository {
  public references: SourceReference[] = [];

  async findById(id: string): Promise<SourceReference | null> {
    return this.references.find((r) => r.id === id) || null;
  }

  async findByDocumentId(documentId: string): Promise<SourceReference[]> {
    return this.references.filter((r) => r.documentId === documentId);
  }

  async findByPatientId(patientId: string): Promise<SourceReference[]> {
    const targetId = normalizePatientId(patientId);
    const patientDocIds = SEED_DOCUMENTS.filter((d) => d.patientId === targetId || d.patientId === patientId).map((d) => d.id);
    return this.references.filter((r) => patientDocIds.includes(r.documentId));
  }

  async findAll(): Promise<SourceReference[]> {
    return [...this.references];
  }

  async create(data: Omit<SourceReference, 'createdAt'>): Promise<SourceReference> {
    const ref: SourceReference = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.references.push(ref);
    return ref;
  }
}

export class MockContradictionRepository implements IContradictionRepository {
  public contradictions: MedicalContradiction[] = [];
  private reviewStates: Map<
    string,
    { reviewStatus: 'Unreviewed' | 'Reviewed'; notes?: string; reviewedAt?: string; reviewerName?: string }
  > = new Map();

  async findById(id: string): Promise<MedicalContradiction | null> {
    const contra = this.contradictions.find((c) => c.id === id);
    if (!contra) return null;
    const review = this.reviewStates.get(contra.id);
    if (review) {
      return {
        ...contra,
        reviewStatus: review.reviewStatus,
        status: review.reviewStatus === 'Reviewed' ? 'Acknowledged' : 'Unreviewed',
        reviewNotes: review.notes,
        reviewedAt: review.reviewedAt,
        reviewedBy: review.reviewerName,
      };
    }
    return contra;
  }

  async create(contradiction: MedicalContradiction): Promise<MedicalContradiction> {
    const existingIndex = this.contradictions.findIndex((c) => c.id === contradiction.id);
    if (existingIndex >= 0) {
      this.contradictions[existingIndex] = contradiction;
    } else {
      this.contradictions.push(contradiction);
    }
    return contradiction;
  }

  async updateReviewStatus(
    id: string,
    reviewStatus: 'Unreviewed' | 'Reviewed',
    notes?: string,
    reviewerName: string = 'Clinical Reviewer'
  ): Promise<MedicalContradiction | null> {
    const contra = this.contradictions.find((c) => c.id === id);
    if (!contra) return null;

    contra.reviewStatus = reviewStatus;
    contra.status = reviewStatus === 'Reviewed' ? 'Acknowledged' : 'Unreviewed';
    if (notes !== undefined) contra.reviewNotes = notes;
    contra.reviewedAt = reviewStatus === 'Reviewed' ? new Date().toISOString() : undefined;
    contra.reviewedBy = reviewStatus === 'Reviewed' ? reviewerName : undefined;

    this.reviewStates.set(id, {
      reviewStatus,
      notes: contra.reviewNotes,
      reviewedAt: contra.reviewedAt,
      reviewerName: contra.reviewedBy,
    });

    return { ...contra };
  }

  async findByPatientId(patientId: string): Promise<MedicalContradiction[]> {
    const targetId = normalizePatientId(patientId);
    return this.contradictions
      .filter((c) => c.patientId === targetId || c.patientId === patientId)
      .map((c) => {
        const review = this.reviewStates.get(c.id);
        if (review) {
          return {
            ...c,
            reviewStatus: review.reviewStatus,
            status: review.reviewStatus === 'Reviewed' ? 'Acknowledged' : 'Unreviewed',
            reviewNotes: review.notes,
            reviewedAt: review.reviewedAt,
            reviewedBy: review.reviewerName,
          };
        }
        return c;
      });
  }
}

export class MockDocumentExtractionRepository implements IDocumentExtractionRepository {
  public extractions: DocumentExtraction[] = [];

  async findById(id: string): Promise<DocumentExtraction | null> {
    return this.extractions.find((e) => e.id === id) || null;
  }

  async findByDocumentId(documentId: string): Promise<DocumentExtraction[]> {
    return this.extractions
      .filter((e) => e.documentId === documentId)
      .sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime());
  }

  async getLatestByDocumentId(documentId: string): Promise<DocumentExtraction | null> {
    const docs = await this.findByDocumentId(documentId);
    return docs.length > 0 ? docs[0] : null;
  }

  async create(extraction: DocumentExtraction): Promise<DocumentExtraction> {
    const existingIndex = this.extractions.findIndex((e) => e.id === extraction.id);
    if (existingIndex >= 0) {
      this.extractions[existingIndex] = extraction;
      return extraction;
    }
    this.extractions.unshift(extraction);
    return extraction;
  }

  async update(id: string, updates: Partial<DocumentExtraction>): Promise<DocumentExtraction | null> {
    const index = this.extractions.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.extractions[index] = {
      ...this.extractions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.extractions[index];
  }
}

export class MockHealthSummaryRepository implements IHealthSummaryRepository {
  public summaries: StoredHealthSummary[] = [];

  async getLatestByPatientId(patientId: string): Promise<StoredHealthSummary | null> {
    const targetId = normalizePatientId(patientId);
    const matches = this.summaries.filter((s) => s.patientId === targetId || s.patientId === patientId);
    if (matches.length === 0) return null;
    return matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  async create(summary: StoredHealthSummary): Promise<StoredHealthSummary> {
    this.summaries = this.summaries.filter((s) => s.id !== summary.id);
    this.summaries.unshift(summary);
    return summary;
  }

  async deleteByPatientId(patientId: string): Promise<void> {
    const targetId = normalizePatientId(patientId);
    this.summaries = this.summaries.filter((s) => s.patientId !== targetId && s.patientId !== patientId);
  }
}

