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

export class MockPatientRepository implements IPatientRepository {
  private patients: Patient[] = [...SEED_PATIENTS];

  async findById(id: string): Promise<Patient | null> {
    return this.patients.find((p) => p.id === id) || null;
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
    const index = this.patients.findIndex((p) => p.id === id);
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
  private facilities: HealthcareFacility[] = [...SEED_FACILITIES];

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
  private providers: HealthcareProvider[] = [...SEED_PROVIDERS];

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
  private documents: MedicalDocument[] = [...SEED_DOCUMENTS];

  async findById(id: string): Promise<MedicalDocument | null> {
    return this.documents.find((d) => d.id === id) || null;
  }

  async findByPatientId(patientId: string): Promise<MedicalDocument[]> {
    return this.documents
      .filter((d) => d.patientId === patientId)
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
  private events: MedicalEvent[] = [...SEED_MEDICAL_EVENTS];

  async findByPatientId(patientId: string): Promise<MedicalEvent[]> {
    return this.events
      .filter((e) => e.patientId === patientId)
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
}

export class MockDiagnosisRepository implements IDiagnosisRepository {
  private diagnoses: Diagnosis[] = [...SEED_DIAGNOSES];

  async findByPatientId(patientId: string): Promise<Diagnosis[]> {
    return this.diagnoses
      .filter((d) => d.patientId === patientId)
      .sort((a, b) => new Date(b.lastDocumentedDate).getTime() - new Date(a.lastDocumentedDate).getTime());
  }

  async findById(id: string): Promise<Diagnosis | null> {
    return this.diagnoses.find((d) => d.id === id) || null;
  }

  async create(diagnosis: Diagnosis): Promise<Diagnosis> {
    this.diagnoses.push(diagnosis);
    return diagnosis;
  }
}

export class MockMedicationRepository implements IMedicationRepository {
  private medications: Medication[] = [...SEED_MEDICATIONS];

  async findByPatientId(patientId: string): Promise<Medication[]> {
    return this.medications
      .filter((m) => m.patientId === patientId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  async findById(id: string): Promise<Medication | null> {
    return this.medications.find((m) => m.id === id) || null;
  }

  async create(medication: Medication): Promise<Medication> {
    this.medications.push(medication);
    return medication;
  }
}

export class MockLabResultRepository implements ILabResultRepository {
  private labResults: LabResult[] = [...SEED_LAB_RESULTS];

  async findByPatientId(patientId: string): Promise<LabResult[]> {
    return this.labResults
      .filter((l) => l.patientId === patientId)
      .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
  }

  async findByTestName(patientId: string, testName: string): Promise<LabResult[]> {
    return this.labResults
      .filter(
        (l) =>
          l.patientId === patientId &&
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
}

export class MockSourceReferenceRepository implements ISourceReferenceRepository {
  private references: SourceReference[] = [...SEED_SOURCE_REFERENCES];

  async findById(id: string): Promise<SourceReference | null> {
    return this.references.find((r) => r.id === id) || null;
  }

  async findByDocumentId(documentId: string): Promise<SourceReference[]> {
    return this.references.filter((r) => r.documentId === documentId);
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
  private contradictions: MedicalContradiction[] = [...SEED_CONTRADICTIONS];

  async findByPatientId(patientId: string): Promise<MedicalContradiction[]> {
    return this.contradictions.filter((c) => c.patientId === patientId);
  }
}

export class MockDocumentExtractionRepository implements IDocumentExtractionRepository {
  private extractions: DocumentExtraction[] = [];

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
  private summaries: StoredHealthSummary[] = [
    {
      id: 'summary-arun-mathew-01',
      patientId: 'pat-arun-mathew-01',
      type: 'Summary',
      title: 'Longitudinal Clinical Journey Summary',
      createdAt: '2026-09-13T09:30:00Z',
      confirmedRecordCount: 21,
      lastRecordDate: '2026-08-28',
      model: 'Google Gemini 2.5 Flash',
      sourceEventIds: [
        'evt-2018-01',
        'evt-2018-02',
        'evt-2018-03',
        'evt-2019-01',
        'evt-2020-02',
        'evt-2020-03',
        'evt-2021-01',
        'evt-2021-02',
        'evt-2022-01',
        'evt-2022-02',
        'evt-2023-01',
        'evt-2023-02',
        'evt-2023-03',
        'evt-2024-01',
        'evt-2024-02',
        'evt-2025-01',
        'evt-2025-03',
        'evt-2026-01',
        'evt-2026-02',
        'evt-2026-03',
        'evt-2026-04',
      ],
      content: {
        overview:
          'This patient has documented Type 2 Diabetes Mellitus since May 2018, essential hypertension since September 2020, and hyperlipidemia since October 2021. Glycemic management began with Metformin monotherapy, underwent escalation during an acute inpatient hospitalization for hyperglycemic decompensation in November 2023, and transitioned to dual oral therapy with Metformin and Empagliflozin in March 2025 after Glimepiride was discontinued. Longitudinal glycemic indicators show HbA1c rising from 6.4% in 2018 to an 8.0% peak in 2023, followed by sustained improvement to 6.8% in August 2026.',
        conditions: [
          {
            name: 'Type 2 Diabetes Mellitus',
            firstDocumented: 'May 10, 2018',
            lastDocumented: 'Aug 28, 2026',
            status: 'Active',
            sourceEventIds: ['evt-2018-02', 'evt-2023-01', 'evt-2025-01', 'evt-2026-01'],
          },
          {
            name: 'Essential Hypertension',
            firstDocumented: 'Sep 22, 2020',
            lastDocumented: 'Aug 28, 2026',
            status: 'Active (Well-controlled)',
            sourceEventIds: ['evt-2020-02', 'evt-2026-01'],
          },
          {
            name: 'Hyperlipidemia',
            firstDocumented: 'Oct 15, 2021',
            lastDocumented: 'Aug 24, 2026',
            status: 'Active',
            sourceEventIds: ['evt-2021-02', 'evt-2026-04'],
          },
          {
            name: 'Acute Hyperglycemic Decompensation',
            firstDocumented: 'Nov 14, 2023',
            lastDocumented: 'Nov 17, 2023',
            status: 'Resolved',
            sourceEventIds: ['evt-2023-01', 'evt-2023-02'],
          },
        ],
        medications: [
          {
            name: 'Metformin',
            summary:
              'Initiated at 500 mg daily in May 2018, temporarily escalated to 1000 mg twice daily in November 2023 post-hospitalization, and adjusted back to 500 mg ER twice daily in March 2025 as continuous baseline therapy.',
            sourceEventIds: ['evt-2018-03', 'evt-2023-03', 'evt-2025-03'],
          },
          {
            name: 'Amlodipine',
            summary:
              'Documented since September 2020 at 5 mg once daily for essential hypertension, with consistent blood pressure stability through August 2026.',
            sourceEventIds: ['evt-2020-03', 'evt-2026-01'],
          },
          {
            name: 'Empagliflozin (Jardiance)',
            summary:
              'Initiated at 10 mg once daily in March 2025 as second-line agent for diabetes and cardio-renal protection, remaining active in current regimen.',
            sourceEventIds: ['evt-2025-03', 'evt-2026-01'],
          },
          {
            name: 'Glimepiride',
            summary:
              'Initiated at 1 mg daily in November 2023 during hospital discharge; discontinued in March 2025 after patient reported recurrent hypoglycemia.',
            sourceEventIds: ['evt-2023-03', 'evt-2025-01'],
          },
        ],
        labTrends: [
          {
            parameter: 'HbA1c (Hemoglobin A1c)',
            summary:
              'HbA1c measured 6.4% in May 2018, 6.6% in June 2019, 7.1% in October 2021, and 7.6% in October 2022. It reached an inpatient peak of 8.0% in November 2023 before steadily improving to 7.5% in September 2024 and 6.8% in August 2026 under dual therapy.',
            sourceEventIds: [
              'evt-2018-01',
              'evt-2019-01',
              'evt-2021-02',
              'evt-2022-02',
              'evt-2023-02',
              'evt-2024-02',
              'evt-2026-04',
            ],
          },
          {
            parameter: 'Fasting Plasma Glucose',
            summary:
              'Initial fasting glucose recorded at 134 mg/dL in 2018, peaked at 218 mg/dL during acute 2023 hospitalization, and normalized to 118 mg/dL in August 2026.',
            sourceEventIds: ['evt-2018-01', 'evt-2023-02', 'evt-2026-04'],
          },
          {
            parameter: 'Renal Function (Creatinine & eGFR)',
            summary:
              'Serum creatinine has remained stable between 0.95 mg/dL (2018) and 0.98 mg/dL (2026), with estimated GFR preserved above 90 mL/min/1.73m².',
            sourceEventIds: ['evt-2018-01', 'evt-2022-02', 'evt-2026-04'],
          },
          {
            parameter: 'Lipid Profile (LDL & Triglycerides)',
            summary:
              'Total cholesterol was 214 mg/dL and LDL 138 mg/dL in October 2021; latest August 2026 panel documented LDL at 94 mg/dL and Triglycerides at 130 mg/dL.',
            sourceEventIds: ['evt-2021-02', 'evt-2026-04'],
          },
        ],
        healthcareJourney: [
          {
            category: 'Consultation',
            date: 'May 10, 2018',
            summary:
              'Baseline Internal Medicine evaluation by Dr. Sarah Jenkins at Meridian Medical Centre establishing diagnosis of Type 2 Diabetes.',
            sourceEventIds: ['evt-2018-02'],
          },
          {
            category: 'Consultation',
            date: 'Sep 22, 2020',
            summary:
              'Cardiovascular risk and blood pressure assessment by Dr. Robert Torres at Meridian Medical Centre diagnosing Stage 1 Essential Hypertension.',
            sourceEventIds: ['evt-2020-02', 'evt-2020-03'],
          },
          {
            category: 'Hospitalization',
            date: 'Nov 14, 2023 – Nov 17, 2023',
            summary:
              'Emergency acute inpatient admission to CityCare Hospital under Dr. Robert Torres for acute hyperglycemic decompensation; treated with IV hydration and discharge medication escalation.',
            sourceEventIds: ['evt-2023-01', 'evt-2023-02', 'evt-2023-03'],
          },
          {
            category: 'Consultation',
            date: 'Mar 10, 2025',
            summary:
              'Specialist endocrine review with Dr. Sarah Jenkins addressing hypoglycemia episodes; Glimepiride stopped and SGLT2 inhibitor Empagliflozin initiated.',
            sourceEventIds: ['evt-2025-01', 'evt-2025-03'],
          },
          {
            category: 'Investigation',
            date: 'Aug 20, 2026',
            summary:
              'Renal Doppler Ultrasound and Echocardiogram at Meridian Medical Centre showing normal bilateral renal blood flow and preserved LV ejection fraction (62%).',
            sourceEventIds: ['evt-2026-03'],
          },
          {
            category: 'Consultation',
            date: 'Aug 28, 2026',
            summary:
              'Comprehensive longitudinal review with Dr. Sarah Jenkins confirming improved glycemic control (HbA1c 6.8%) and stable ambulatory blood pressure.',
            sourceEventIds: ['evt-2026-01'],
          },
        ],
        recordObservations: [
          {
            summary:
              'Penicillin allergy with childhood maculopapular rash was recorded in initial 2018 consultation note, while 2023 hospital admission orders noted "No active drug allergies listed" before being re-verified.',
            sourceEventIds: ['evt-2018-02', 'evt-2023-01'],
          },
        ],
      },
    },
  ];

  async getLatestByPatientId(patientId: string): Promise<StoredHealthSummary | null> {
    const matches = this.summaries.filter((s) => s.patientId === patientId);
    if (matches.length === 0) return null;
    return matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  async create(summary: StoredHealthSummary): Promise<StoredHealthSummary> {
    this.summaries = this.summaries.filter((s) => s.id !== summary.id);
    this.summaries.unshift(summary);
    return summary;
  }

  async deleteByPatientId(patientId: string): Promise<void> {
    this.summaries = this.summaries.filter((s) => s.patientId !== patientId);
  }
}

