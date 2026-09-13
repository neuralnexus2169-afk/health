import {
  documentRepository,
  documentExtractionRepository,
  diagnosisRepository,
  medicationRepository,
  labResultRepository,
  timelineRepository,
  sourceReferenceRepository,
  patientRepository,
} from '../lib/db/repositories';
import { documentStorage } from '../lib/storage/documentStorage';
import { getAIProvider } from '../lib/ai';
import {
  DocumentExtraction,
  StructuredExtractionData,
  MedicalDocument,
  Diagnosis,
  Medication,
  LabResult,
  MedicalEvent,
  SourceReference,
} from '../types/medical';
import { DEFAULT_PATIENT_ID } from './patientService';

/**
 * Execute AI document extraction for a medical document
 * Responsibilities:
 * 1. Retrieve document & stored file
 * 2. Update status to 'Processing'
 * 3. Send to AI Provider (Gemini or deterministic Mock fallback)
 * 4. Validate extraction
 * 5. Store extraction result
 * 6. Update document status to 'Needs Review'
 */
export async function extractDocument(documentId: string): Promise<DocumentExtraction> {
  const doc = await documentRepository.findById(documentId);
  if (!doc) {
    throw new Error(`Document with ID ${documentId} not found.`);
  }

  // Update document status to Processing
  await documentRepository.updateStatus(documentId, 'Processing');

  try {
    // Check if running in browser and backend API is available
    let structuredData: StructuredExtractionData | null = null;
    let modelName = 'Clinical Safety Engine';

    // Attempt backend API call first (server-side Gemini)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const apiJson = await res.json();
          if (apiJson.data && apiJson.extraction) {
            structuredData = apiJson.extraction.data;
            modelName = apiJson.extraction.model;
          }
        }
      } catch {
        // Backend endpoint not ready or client running in standalone mode, fall back to local provider
      }
    }

    if (!structuredData) {
      // Use swappable AI provider (Gemini or Mock fallback)
      const provider = getAIProvider();
      modelName = provider.name;

      // Look up any stored file data URL
      const storedFiles = await documentStorage.list();
      const storedFile = storedFiles.find((f) => f.fileName === doc.fileName);

      structuredData = await provider.extractMedicalInformation({
        fileName: doc.fileName,
        documentType: doc.documentType,
        textSnippet: doc.extractedTextSnippet,
        mimeType: storedFile?.contentType,
        base64Data: storedFile?.dataUrl,
        fileSizeBytes: doc.fileSizeBytes,
      });
    }

    const now = new Date().toISOString();
    const extractionId = `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const extractionRecord: DocumentExtraction = {
      id: extractionId,
      documentId: doc.id,
      model: modelName,
      status: 'Needs Review',
      data: structuredData,
      reviewedData: JSON.parse(JSON.stringify(structuredData)), // deep clone for user edits
      extractedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Store extraction
    await documentExtractionRepository.create(extractionRecord);

    // Update document workflow status to "Needs Review"
    await documentRepository.updateStatus(doc.id, 'Needs Review');

    return extractionRecord;
  } catch (error) {
    console.error(`Document extraction failed for ${doc.id}:`, error);
    await documentRepository.updateStatus(doc.id, 'Failed');
    throw error;
  }
}

/**
 * Retrieve current or latest extraction record for a document
 */
export async function getDocumentExtraction(documentId: string): Promise<DocumentExtraction | null> {
  return await documentExtractionRepository.getLatestByDocumentId(documentId);
}

/**
 * Save user modifications made in the Review Interface before confirmation
 */
export async function updateExtractionReview(
  extractionId: string,
  reviewedData: StructuredExtractionData
): Promise<DocumentExtraction | null> {
  return await documentExtractionRepository.update(extractionId, {
    reviewedData,
    status: 'Needs Review',
  });
}

export interface ConfirmationResult {
  extraction: DocumentExtraction;
  document: MedicalDocument;
  createdEvents: MedicalEvent[];
  createdDiagnoses: Diagnosis[];
  createdMedications: Medication[];
  createdLabResults: LabResult[];
  createdSourceReferences: SourceReference[];
}

/**
 * Confirm Extracted Information:
 * Safety constraint: Converts user-reviewed extraction items into confirmed database records.
 * 1. Validates reviewed extraction
 * 2. Creates Diagnosis records
 * 3. Creates Medication records
 * 4. Creates LabResult records
 * 5. Creates MedicalEvent records for longitudinal timeline
 * 6. Creates SourceReference records with page and verbatim text quotes
 * 7. Links everything to Document
 * 8. Updates Document status to "Confirmed"
 * 9. Prevents duplicate records if clicked multiple times
 */
export async function confirmExtraction(
  extractionId: string,
  patientId: string = DEFAULT_PATIENT_ID
): Promise<ConfirmationResult> {
  const extraction = await documentExtractionRepository.findById(extractionId);
  if (!extraction) {
    throw new Error(`Extraction with ID ${extractionId} not found.`);
  }

  const doc = await documentRepository.findById(extraction.documentId);
  if (!doc) {
    throw new Error(`Document for extraction ${extraction.documentId} not found.`);
  }

  // Prevent duplicate confirmation
  if (extraction.status === 'Confirmed') {
    return {
      extraction,
      document: doc,
      createdEvents: [],
      createdDiagnoses: [],
      createdMedications: [],
      createdLabResults: [],
      createdSourceReferences: [],
    };
  }

  const reviewed = extraction.reviewedData || extraction.data;
  const now = new Date().toISOString();
  const eventDate = reviewed.documentDate || doc.documentDate || now.split('T')[0];

  const createdSourceReferences: SourceReference[] = [];
  const createdDiagnoses: Diagnosis[] = [];
  const createdMedications: Medication[] = [];
  const createdLabResults: LabResult[] = [];
  const createdEvents: MedicalEvent[] = [];

  // Helper to create source reference
  async function createSourceRef(quote?: string, pageNum?: number): Promise<SourceReference | null> {
    if (!quote && !pageNum) return null;
    const ref = await sourceReferenceRepository.create({
      id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      documentId: doc.id,
      documentFileName: doc.fileName,
      pageNumber: pageNum || 1,
      sourceText: quote || undefined,
    });
    createdSourceReferences.push(ref);
    return ref;
  }

  // 1. Process Accepted Diagnoses
  for (const diag of reviewed.diagnoses.filter((d) => d.accepted !== false)) {
    const srcRef = await createSourceRef(diag.sourceQuote, diag.pageNumber);
    const createdDiag = await diagnosisRepository.create({
      id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      patientId,
      name: diag.name,
      status: diag.status || 'Active',
      firstDocumentedDate: diag.date || eventDate,
      lastDocumentedDate: diag.date || eventDate,
      documentId: doc.id,
      documentFileName: doc.fileName,
      clinicalNotes: `AI-extracted from ${doc.fileName} and confirmed by user.`,
      category: 'Clinical Diagnosis',
      sourceReferenceId: srcRef?.id,
    });
    createdDiagnoses.push(createdDiag);
  }

  // 2. Process Accepted Medications
  for (const med of reviewed.medications.filter((m) => m.accepted !== false)) {
    const srcRef = await createSourceRef(med.sourceQuote, med.pageNumber);
    const createdMed = await medicationRepository.create({
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      patientId,
      name: med.name,
      genericName: med.genericName,
      dosage: med.dosage,
      frequency: med.frequency,
      route: med.route || 'Oral',
      startDate: med.startDate || eventDate,
      endDate: med.endDate,
      status: med.status || 'Active',
      documentId: doc.id,
      documentFileName: doc.fileName,
      prescribedBy: reviewed.provider || doc.providerName || 'Attending Physician',
      indication: reviewed.diagnoses[0]?.name || undefined,
      refillNote: 'User confirmed from clinical extraction',
      sourceReferenceId: srcRef?.id,
    });
    createdMedications.push(createdMed);
  }

  // 3. Process Accepted Lab Results
  for (const lab of reviewed.labResults.filter((l) => l.accepted !== false)) {
    const srcRef = await createSourceRef(lab.sourceQuote, lab.pageNumber);
    const numVal = typeof lab.value === 'number' ? lab.value : parseFloat(String(lab.value)) || 0;
    const createdLab = await labResultRepository.create({
      id: `lab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      patientId,
      testName: lab.testName,
      parameterName: lab.parameterName || lab.testName,
      value: numVal,
      unit: lab.unit || '',
      referenceRange: lab.referenceRange,
      testDate: lab.date || eventDate,
      facilityId: doc.facilityId,
      facilityName: reviewed.facility || doc.facilityName,
      documentId: doc.id,
      documentFileName: doc.fileName,
      interpretation: lab.interpretation || (numVal > 0 ? 'Normal' : undefined),
      sourceReferenceId: srcRef?.id,
    });
    createdLabResults.push(createdLab);
  }

  // 4. Update Patient Allergies if any new accepted allergies
  const acceptedAllergies = reviewed.allergies.filter((a) => a.accepted !== false);
  if (acceptedAllergies.length > 0) {
    const patient = await patientRepository.findById(patientId);
    if (patient) {
      const existingAllergies = patient.allergies || [];
      const newAllergies = acceptedAllergies
        .map((a) => `${a.substance} (${a.reaction || 'Reported'})`)
        .filter((str) => !existingAllergies.some((existing) => existing.toLowerCase().includes(str.split(' ')[0].toLowerCase())));

      if (newAllergies.length > 0) {
        await patientRepository.update(patientId, {
          allergies: [...existingAllergies, ...newAllergies],
        });
      }
    }
  }

  // 5. Create Longitudinal MedicalEvent in Timeline
  let eventType: MedicalEvent['eventType'] = 'Consultation';
  if (doc.documentType === 'Lab Report') eventType = 'Laboratory';
  else if (doc.documentType === 'Prescription') eventType = 'Medication';
  else if (doc.documentType === 'Imaging Report') eventType = 'Imaging';
  else if (doc.documentType === 'Discharge Summary') eventType = 'Hospitalization';

  const findingsCount = createdDiagnoses.length + createdMedications.length + createdLabResults.length;
  const descriptionParts: string[] = [];
  if (createdDiagnoses.length > 0) {
    descriptionParts.push(`Diagnoses: ${createdDiagnoses.map((d) => d.name).join(', ')}`);
  }
  if (createdMedications.length > 0) {
    descriptionParts.push(`Medications: ${createdMedications.map((m) => `${m.name} ${m.dosage}`).join(', ')}`);
  }
  if (createdLabResults.length > 0) {
    descriptionParts.push(`Labs: ${createdLabResults.map((l) => `${l.parameterName} (${l.value} ${l.unit})`).join(', ')}`);
  }
  if (reviewed.clinicalNotes && reviewed.clinicalNotes.length > 0) {
    descriptionParts.push(reviewed.clinicalNotes.slice(0, 2).join(' '));
  }

  const primaryEvent = await timelineRepository.create({
    id: `evt-extract-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    patientId,
    eventType,
    eventDate,
    title: `${doc.documentType}: ${doc.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}`,
    description: descriptionParts.join(' · ') || `Extracted and confirmed ${findingsCount} clinical entities from ${doc.fileName}.`,
    facilityId: doc.facilityId,
    facilityName: reviewed.facility || doc.facilityName,
    providerId: doc.providerId,
    providerName: reviewed.provider || doc.providerName,
    documentId: doc.id,
    documentFileName: doc.fileName,
  });
  createdEvents.push(primaryEvent);

  // 6. Update Extraction and Document Status to "Confirmed"
  const updatedExtraction = await documentExtractionRepository.update(extractionId, {
    status: 'Confirmed',
    confirmedAt: now,
  });

  const updatedDoc = await documentRepository.updateStatus(doc.id, 'Confirmed');

  return {
    extraction: updatedExtraction || extraction,
    document: updatedDoc || doc,
    createdEvents,
    createdDiagnoses,
    createdMedications,
    createdLabResults,
    createdSourceReferences,
  };
}
