import {
  patientRepository,
  timelineRepository,
  diagnosisRepository,
  medicationRepository,
  labResultRepository,
  documentRepository,
  facilityRepository,
  providerRepository,
  sourceReferenceRepository,
  contradictionRepository,
  documentExtractionRepository,
} from '../lib/db/repositories';
import {
  Patient,
  HealthcareFacility,
  HealthcareProvider,
  MedicalEvent,
  Diagnosis,
  Medication,
  LabResult,
  MedicalDocument,
  SourceReference,
  MedicalContradiction,
  DocumentExtraction,
} from '../types/medical';
import {
  PatientProfile,
  ImportantCondition,
  CurrentMedication,
  RecentTest,
  RecentEvent,
} from '../types';

export const DEFAULT_PATIENT_ID = '';

/**
 * We no longer normalize patient IDs to a hardcoded demo patient.
 * Just return the ID.
 */
export function normalizePatientId(id?: string): string {
  if (!id) return '';
  return id;
}

/**
 * Format ISO date string into human readable format: "Month DD, YYYY"
 */
export function formatDisplayDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Compute age from birthdate ISO string
 */
export function calculateAge(dobStr: string): number {
  const birthDate = new Date(dobStr);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Retrieve patient entity
 */
export async function getPatient(patientId: string = DEFAULT_PATIENT_ID): Promise<Patient | null> {
  const normalizedId = normalizePatientId(patientId);
  return await patientRepository.findById(normalizedId);
}

/**
 * Retrieve all patients for patient switcher
 */
export async function getAllPatients(): Promise<Patient[]> {
  return await patientRepository.findAll();
}

/**
 * Retrieve patient timeline events, sorted chronologically descending
 */
export async function getPatientTimeline(patientId: string = DEFAULT_PATIENT_ID): Promise<MedicalEvent[]> {
  const normalizedId = normalizePatientId(patientId);
  return await timelineRepository.findByPatientId(normalizedId);
}

/**
 * Retrieve patient diagnoses
 */
export async function getPatientDiagnoses(patientId: string = DEFAULT_PATIENT_ID): Promise<Diagnosis[]> {
  const normalizedId = normalizePatientId(patientId);
  return await diagnosisRepository.findByPatientId(normalizedId);
}

/**
 * Retrieve patient medications
 */
export async function getPatientMedications(patientId: string = DEFAULT_PATIENT_ID): Promise<Medication[]> {
  const normalizedId = normalizePatientId(patientId);
  return await medicationRepository.findByPatientId(normalizedId);
}

/**
 * Retrieve patient lab results
 */
export async function getPatientLabResults(patientId: string = DEFAULT_PATIENT_ID): Promise<LabResult[]> {
  const normalizedId = normalizePatientId(patientId);
  return await labResultRepository.findByPatientId(normalizedId);
}

/**
 * Retrieve patient medical documents
 */
export async function getPatientDocuments(patientId: string = DEFAULT_PATIENT_ID): Promise<MedicalDocument[]> {
  const normalizedId = normalizePatientId(patientId);
  return await documentRepository.findByPatientId(normalizedId);
}

/**
 * Retrieve a specific document by its ID
 */
export async function getDocumentById(id: string): Promise<MedicalDocument | null> {
  return await documentRepository.findById(id);
}

/**
 * Create a new medical document record
 */
export async function createDocument(
  data: Omit<MedicalDocument, 'createdAt'>
): Promise<MedicalDocument> {
  return await documentRepository.create(data);
}

/**
 * Update the processing status of a medical document
 */
export async function updateDocumentStatus(
  id: string,
  status: MedicalDocument['status']
): Promise<MedicalDocument | null> {
  return await documentRepository.updateStatus(id, status);
}

/**
 * Retrieve source references for document evidence tracking
 */
export async function getSourceReferences(documentId: string): Promise<SourceReference[]> {
  return await sourceReferenceRepository.findByDocumentId(documentId);
}

export interface DocumentSummary {
  totalCount: number;
  processedCount: number;
  confirmedCount: number;
  needsReviewCount: number;
  processingCount: number;
  failedCount: number;
  uploadedCount: number;
}

export interface EnrichedDocument extends MedicalDocument {
  facility?: HealthcareFacility;
  provider?: HealthcareProvider;
  events: MedicalEvent[];
  diagnoses: Diagnosis[];
  medications: Medication[];
  labResults: LabResult[];
  sourceReferences: SourceReference[];
  extraction?: DocumentExtraction;
}

/**
 * Retrieve enriched documents for patient with counts of associated clinical entities
 */
export async function getEnrichedDocuments(
  patientId: string = DEFAULT_PATIENT_ID
): Promise<{
  documents: EnrichedDocument[];
  summary: DocumentSummary;
}> {
  const normalizedId = normalizePatientId(patientId);

  const [
    documents,
    events,
    diagnoses,
    medications,
    labResults,
    sourceReferences,
    facilities,
    providers,
  ] = await Promise.all([
    documentRepository.findByPatientId(normalizedId),
    timelineRepository.findByPatientId(normalizedId),
    diagnosisRepository.findByPatientId(normalizedId),
    medicationRepository.findByPatientId(normalizedId),
    labResultRepository.findByPatientId(normalizedId),
    sourceReferenceRepository.findAll(),
    facilityRepository.findAll(),
    providerRepository.findAll(),
  ]);

  const facilityMap = new Map(facilities.map((f) => [f.id, f]));
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  // Retrieve extractions for all documents
  const extractions = await Promise.all(
    documents.map((d) => documentExtractionRepository.getLatestByDocumentId(d.id))
  );
  const extractionMap = new Map<string, DocumentExtraction>();
  extractions.forEach((ext) => {
    if (ext) extractionMap.set(ext.documentId, ext);
  });

  const enrichedDocs: EnrichedDocument[] = documents.map((doc) => {
    const docEvents = events.filter((e) => e.documentId === doc.id);
    const docDiagnoses = diagnoses.filter((d) => d.documentId === doc.id);
    const docMeds = medications.filter((m) => m.documentId === doc.id);
    const docLabs = labResults.filter((l) => l.documentId === doc.id);
    const docSourceRefs = sourceReferences.filter((s) => s.documentId === doc.id);

    return {
      ...doc,
      facility: doc.facilityId ? facilityMap.get(doc.facilityId) : undefined,
      provider: doc.providerId ? providerMap.get(doc.providerId) : undefined,
      events: docEvents,
      diagnoses: docDiagnoses,
      medications: docMeds,
      labResults: docLabs,
      sourceReferences: docSourceRefs,
      extraction: extractionMap.get(doc.id),
    };
  });

  // Calculate summary counts
  const summary: DocumentSummary = {
    totalCount: documents.length,
    processedCount: documents.filter((d) => d.status === 'Processed' || d.status === 'Confirmed').length,
    confirmedCount: documents.filter((d) => d.status === 'Confirmed').length,
    needsReviewCount: documents.filter((d) => d.status === 'Needs Review').length,
    processingCount: documents.filter((d) => d.status === 'Processing').length,
    failedCount: documents.filter((d) => d.status === 'Failed').length,
    uploadedCount: documents.filter((d) => d.status === 'Uploaded').length,
  };

  return {
    documents: enrichedDocs,
    summary,
  };
}

/**
 * Retrieve single enriched document by ID with all linked clinical items
 */
export async function getEnrichedDocument(
  documentId: string,
  patientId: string = DEFAULT_PATIENT_ID
): Promise<EnrichedDocument | null> {
  const normalizedId = normalizePatientId(patientId);
  const doc = await documentRepository.findById(documentId);
  if (!doc) return null;

  const [
    events,
    diagnoses,
    medications,
    labResults,
    sourceReferences,
    facility,
    provider,
    extraction,
  ] = await Promise.all([
    timelineRepository.findByPatientId(normalizedId),
    diagnosisRepository.findByPatientId(normalizedId),
    medicationRepository.findByPatientId(normalizedId),
    labResultRepository.findByPatientId(normalizedId),
    sourceReferenceRepository.findByDocumentId(doc.id),
    doc.facilityId ? facilityRepository.findById(doc.facilityId) : Promise.resolve(null),
    doc.providerId ? providerRepository.findById(doc.providerId) : Promise.resolve(null),
    documentExtractionRepository.getLatestByDocumentId(doc.id),
  ]);

  return {
    ...doc,
    facility: facility || undefined,
    provider: provider || undefined,
    events: events.filter((e) => e.documentId === doc.id),
    diagnoses: diagnoses.filter((d) => d.documentId === doc.id),
    medications: medications.filter((m) => m.documentId === doc.id),
    labResults: labResults.filter((l) => l.documentId === doc.id),
    sourceReferences,
    extraction: extraction || undefined,
  };
}

export interface EnrichedMedicalEvent extends MedicalEvent {
  facility?: HealthcareFacility;
  provider?: HealthcareProvider;
  document?: MedicalDocument;
  sourceReference?: SourceReference;
  diagnoses: Diagnosis[];
  medications: Medication[];
  labResults: LabResult[];
  medicationAction?: 'started' | 'changed' | 'discontinued';
  diagnosisAction?: string;
  primaryLabSummary?: {
    testName: string;
    parameterName: string;
    value: number;
    unit: string;
    interpretation?: string;
    referenceRange?: string;
  };
}

export interface TimelineSummary {
  yearsCount: number;
  yearSpanText: string;
  totalEvents: number;
  providerCount: number;
  facilityCount: number;
  earliestYear: number;
  latestYear: number;
}

/**
 * Retrieve enriched longitudinal timeline events for a patient with all relational joins
 */
export async function getEnrichedTimeline(patientId: string = DEFAULT_PATIENT_ID): Promise<{
  events: EnrichedMedicalEvent[];
  summary: TimelineSummary;
}> {
  const normalizedId = normalizePatientId(patientId);

  const [
    events,
    facilities,
    providers,
    documents,
    diagnoses,
    medications,
    labResults,
    sourceReferences,
  ] = await Promise.all([
    timelineRepository.findByPatientId(normalizedId),
    facilityRepository.findAll(),
    providerRepository.findAll(),
    documentRepository.findByPatientId(normalizedId),
    diagnosisRepository.findByPatientId(normalizedId),
    medicationRepository.findByPatientId(normalizedId),
    labResultRepository.findByPatientId(normalizedId),
    sourceReferenceRepository.findAll(),
  ]);

  // Lookup maps for O(1) correlation
  const facilityMap = new Map(facilities.map((f) => [f.id, f]));
  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const documentMap = new Map(documents.map((d) => [d.id, d]));
  const sourceRefMap = new Map(sourceReferences.map((s) => [s.id, s]));

  const enrichedEvents: EnrichedMedicalEvent[] = events.map((event) => {
    // Linked Facility & Provider
    const facility = event.facilityId ? facilityMap.get(event.facilityId) : undefined;
    const provider = event.providerId ? providerMap.get(event.providerId) : undefined;
    const document = event.documentId ? documentMap.get(event.documentId) : undefined;

    // Linked Source Reference (by ID or fallback to first reference for document)
    let sourceReference = event.sourceReferenceId ? sourceRefMap.get(event.sourceReferenceId) : undefined;
    if (!sourceReference && event.documentId) {
      sourceReference = sourceReferences.find((sr) => sr.documentId === event.documentId);
    }

    // Linked Diagnoses
    const linkedDiagnoses = diagnoses.filter(
      (d) => d.eventId === event.id || (event.documentId && d.documentId === event.documentId)
    );

    // Linked Medications
    const linkedMedications = medications.filter(
      (m) => m.eventId === event.id || (event.documentId && m.documentId === event.documentId)
    );

    // Linked Lab Results
    const linkedLabs = labResults.filter(
      (l) => l.eventId === event.id || (event.documentId && l.documentId === event.documentId)
    );

    // Determine Medication action if applicable
    let medicationAction: 'started' | 'changed' | 'discontinued' | undefined;
    if (event.eventType === 'Medication' || linkedMedications.length > 0) {
      const titleLower = event.title.toLowerCase();
      const descLower = event.description.toLowerCase();
      if (
        titleLower.includes('discontinu') ||
        descLower.includes('discontinu') ||
        linkedMedications.some((m) => m.status === 'Discontinued')
      ) {
        medicationAction = 'discontinued';
      } else if (
        titleLower.includes('intensif') ||
        titleLower.includes('titrat') ||
        titleLower.includes('adjust') ||
        titleLower.includes('replac') ||
        descLower.includes('titrat') ||
        descLower.includes('replac')
      ) {
        medicationAction = 'changed';
      } else {
        medicationAction = 'started';
      }
    }

    // Determine Diagnosis action if applicable
    let diagnosisAction: string | undefined;
    if (event.eventType === 'Diagnosis' || linkedDiagnoses.length > 0) {
      const primaryDiag = linkedDiagnoses[0];
      if (primaryDiag) {
        diagnosisAction = primaryDiag.status === 'Resolved' ? 'Diagnosis resolved' : 'Diagnosis documented';
      } else {
        diagnosisAction = 'Diagnosis documented';
      }
    }

    // Determine Primary Lab Summary
    let primaryLabSummary: EnrichedMedicalEvent['primaryLabSummary'] | undefined;
    if (event.eventType === 'Laboratory' || linkedLabs.length > 0) {
      // Prioritize HbA1c, then glucose, then the first lab
      const a1c = linkedLabs.find((l) => l.testName.toLowerCase().includes('a1c') || l.parameterName.toLowerCase().includes('a1c'));
      const chosen = a1c || linkedLabs[0];
      if (chosen) {
        primaryLabSummary = {
          testName: chosen.testName,
          parameterName: chosen.parameterName,
          value: chosen.value,
          unit: chosen.unit,
          interpretation: chosen.interpretation || (chosen.value < 7.0 ? 'Target' : 'Elevated'),
          referenceRange: chosen.referenceRange,
        };
      }
    }

    return {
      ...event,
      facility: facility || (event.facilityName ? { id: event.facilityId || '', name: event.facilityName, type: 'Healthcare Facility', createdAt: '' } : undefined),
      provider: provider || (event.providerName ? { id: event.providerId || '', name: event.providerName, specialization: 'Clinical Provider', facilityId: event.facilityId || '', createdAt: '' } : undefined),
      document,
      sourceReference,
      diagnoses: linkedDiagnoses,
      medications: linkedMedications,
      labResults: linkedLabs,
      medicationAction,
      diagnosisAction,
      primaryLabSummary,
    };
  });

  // Calculate dynamic Summary metrics
  const years = enrichedEvents
    .map((e) => new Date(e.eventDate).getFullYear())
    .filter((y) => !isNaN(y));

  const earliestYear = years.length > 0 ? Math.min(...years) : new Date().getFullYear();
  const latestYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
  const yearSpan = Math.max(1, latestYear - earliestYear);

  // Distinct Providers count
  const providerNames = new Set<string>();
  enrichedEvents.forEach((e) => {
    if (e.providerName) providerNames.add(e.providerName);
    if (e.provider?.name) providerNames.add(e.provider.name);
  });
  documents.forEach((d) => {
    if (d.providerName) providerNames.add(d.providerName);
  });

  // Distinct Facilities count
  const facilityNames = new Set<string>();
  enrichedEvents.forEach((e) => {
    if (e.facilityName) facilityNames.add(e.facilityName);
    if (e.facility?.name) facilityNames.add(e.facility.name);
  });
  documents.forEach((d) => {
    if (d.facilityName) facilityNames.add(d.facilityName);
  });

  const summary: TimelineSummary = {
    yearsCount: yearSpan,
    yearSpanText: `${yearSpan} years of history`,
    totalEvents: enrichedEvents.length,
    providerCount: providerNames.size,
    facilityCount: facilityNames.size,
    earliestYear,
    latestYear,
  };

  return {
    events: enrichedEvents,
    summary,
  };
}

/**
 * Retrieve detected medical contradictions for patient
 */
export async function getPatientContradictions(patientId: string = DEFAULT_PATIENT_ID): Promise<MedicalContradiction[]> {
  const normalizedId = normalizePatientId(patientId);
  return await contradictionRepository.findByPatientId(normalizedId);
}

/**
 * Retrieve HbA1c trajectory specifically for longitudinal charting
 */
export async function getHbA1cTrend(patientId: string = DEFAULT_PATIENT_ID): Promise<{ year: string; date: string; value: number; status: string }[]> {
  const normalizedId = normalizePatientId(patientId);
  const results = await labResultRepository.findByTestName(normalizedId, 'HbA1c');
  return results.map((r) => ({
    year: new Date(r.testDate).getFullYear().toString(),
    date: r.testDate,
    value: r.value,
    status: r.value < 7.0 ? 'Target' : r.value < 7.5 ? 'Elevated' : 'Critical',
  }));
}

/**
 * Aggregate summary for the Overview Dashboard view
 * Maps rich domain entities cleanly to the UI Presentation DTOs
 */
export async function getPatientOverview(patientId: string = DEFAULT_PATIENT_ID): Promise<{
  profile: PatientProfile;
  conditions: ImportantCondition[];
  medications: CurrentMedication[];
  recentTests: RecentTest[];
  recentEvents: RecentEvent[];
  stats: {
    totalDocuments: number;
    totalEvents: number;
    totalActiveMedications: number;
    totalDiagnoses: number;
  };
}> {
  const normalizedId = normalizePatientId(patientId);
  const [patient, timeline, diagnoses, medications, labResults, documents, providers] = await Promise.all([
    getPatient(normalizedId),
    getPatientTimeline(normalizedId),
    getPatientDiagnoses(normalizedId),
    getPatientMedications(normalizedId),
    getPatientLabResults(normalizedId),
    getPatientDocuments(normalizedId),
    providerRepository.findAll(),
  ]);

  if (!patient) {
    throw new Error(`Patient with ID ${normalizedId} not found`);
  }

  // Build UI PatientProfile
  const profile: PatientProfile = {
    id: patient.id,
    name: patient.name,
    type: 'Demo Patient',
    age: calculateAge(patient.dateOfBirth),
    gender: patient.gender,
    dateOfBirth: formatDisplayDate(patient.dateOfBirth),
    lastUpdated: 'September 13, 2026',
    recordsCount: documents.length,
    providersCount: providers.length,
    bloodType: patient.bloodGroup || 'B+',
    allergies: patient.allergies || [],
    primaryCarePhysician: 'Dr. Sarah Jenkins, MD (Internal Medicine)',
  };

  // Map Active Conditions
  const conditions: ImportantCondition[] = diagnoses
    .filter((d) => d.status === 'Active')
    .map((d) => {
      const diagYear = new Date(d.firstDocumentedDate).getFullYear().toString();
      return {
        id: d.id,
        name: d.name,
        category: d.category || 'Clinical Diagnosis',
        diagnosedYear: diagYear,
        status: d.status === 'Active' ? 'Active' : 'Well-controlled',
        severity: d.name.toLowerCase().includes('diabetes') ? 'Chronic' : 'Moderate',
        notes: d.clinicalNotes || `Documented since ${diagYear}.`,
      };
    });

  // Map Current Active Medications
  const activeMedications: CurrentMedication[] = medications
    .filter((m) => m.status === 'Active')
    .map((m) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage,
      schedule: `${m.route || 'Oral'} · ${m.frequency}`,
      route: m.route || 'Oral Tablet',
      prescribedBy: m.prescribedBy || 'Attending Physician',
      refillStatus: m.refillNote || 'Active · In Regimen',
      status: 'Active',
    }));

  // Map Recent Tests (Latest 2 distinct test categories)
  const recentTests: RecentTest[] = labResults.slice(0, 4).map((l) => {
    let status: RecentTest['status'] = 'Normal';
    if (l.testName.toLowerCase().includes('a1c')) {
      status = l.value <= 7.0 ? 'Target' : 'Elevated';
    } else if (l.value > 100 && l.parameterName.toLowerCase().includes('ldl')) {
      status = 'Elevated';
    } else {
      status = 'Normal';
    }

    return {
      id: l.id,
      name: l.testName,
      value: `${l.value}${l.unit ? ' ' + l.unit : ''}`,
      unit: l.unit,
      status,
      date: formatDisplayDate(l.testDate),
      referenceRange: l.referenceRange || undefined,
      laboratory: l.facilityName || 'Lakeside Diagnostics',
    };
  });

  // Map Recent Events (Top 3 recent events)
  const recentEvents: RecentEvent[] = timeline.slice(0, 3).map((e) => {
    let type: RecentEvent['type'] = 'Doctor consultation';
    if (e.eventType === 'Laboratory') {
      type = 'Laboratory test';
    } else if (e.eventType === 'Hospitalization') {
      type = 'Hospital visit';
    }

    return {
      id: e.id,
      type,
      title: e.title,
      date: formatDisplayDate(e.eventDate),
      provider: e.providerName || 'Attending Clinical Staff',
      location: e.facilityName || 'Health Center',
    };
  });

  return {
    profile,
    conditions,
    medications: activeMedications,
    recentTests,
    recentEvents,
    stats: {
      totalDocuments: documents.length,
      totalEvents: timeline.length,
      totalActiveMedications: activeMedications.length,
      totalDiagnoses: diagnoses.length,
    },
  };
}

/**
 * MANUAL RECORD ENTRY
 */

export async function addManualMedicalEvent(data: Omit<MedicalEvent, 'id' | 'createdAt'>): Promise<MedicalEvent> {
  const event = await timelineRepository.create({
    id: `evt-manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...data,
    isManualEntry: true,
  });
  return event;
}

export async function addManualDiagnosis(data: Omit<Diagnosis, 'id'>): Promise<Diagnosis> {
  const diag = await diagnosisRepository.create({
    ...data,
    isManualEntry: true,
  } as Diagnosis);
  return diag;
}

export async function addManualMedication(data: Omit<Medication, 'id'>): Promise<Medication> {
  const med = await medicationRepository.create({
    ...data,
    isManualEntry: true,
  } as Medication);
  return med;
}

export async function addManualLabResult(data: Omit<LabResult, 'id'>): Promise<LabResult> {
  const lab = await labResultRepository.create({
    ...data,
    isManualEntry: true,
  } as LabResult);
  return lab;
}

export async function updateRecord(type: 'MedicalEvent' | 'Diagnosis' | 'Medication' | 'LabResult', id: string, updates: any) {
  switch (type) {
    case 'MedicalEvent': return timelineRepository.update(id, updates);
    case 'Diagnosis': return diagnosisRepository.update(id, updates);
    case 'Medication': return medicationRepository.update(id, updates);
    case 'LabResult': return labResultRepository.update(id, updates);
  }
}

export async function deleteRecord(type: 'MedicalEvent' | 'Diagnosis' | 'Medication' | 'LabResult', id: string) {
  switch (type) {
    case 'MedicalEvent': return timelineRepository.delete(id);
    case 'Diagnosis': return diagnosisRepository.delete(id);
    case 'Medication': return medicationRepository.delete(id);
    case 'LabResult': return labResultRepository.delete(id);
  }
}
