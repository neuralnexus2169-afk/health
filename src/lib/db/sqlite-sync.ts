import { prisma } from './prisma';
import fs from 'fs';
import path from 'path';

/**
 * Maps string gender to Prisma Gender enum safely
 */
function toPrismaGender(gender?: string): 'MALE' | 'FEMALE' | 'OTHER' {
  const g = (gender || '').toUpperCase();
  if (g === 'FEMALE') return 'FEMALE';
  if (g === 'OTHER') return 'OTHER';
  return 'MALE';
}

/**
 * Maps document status string to Prisma DocumentStatus enum safely
 */
function toPrismaDocStatus(status?: string): any {
  switch ((status || '').toUpperCase().replace(/\s+/g, '_')) {
    case 'UPLOADED': return 'UPLOADED';
    case 'PROCESSING': return 'PROCESSING';
    case 'NEEDS_REVIEW': return 'NEEDS_REVIEW';
    case 'FAILED': return 'FAILED';
    case 'CONFIRMED':
    case 'PROCESSED':
    default:
      return 'PROCESSED';
  }
}

/**
 * Maps document type string to Prisma enum safely
 */
function toPrismaDocType(type?: string): any {
  switch (type) {
    case 'Prescription': return 'PRESCRIPTION';
    case 'Lab Report': return 'LAB_REPORT';
    case 'Discharge Summary': return 'DISCHARGE_SUMMARY';
    case 'Consultation Note': return 'CONSULTATION_NOTE';
    case 'Imaging Report': return 'IMAGING_REPORT';
    case 'Medical Bill': return 'MEDICAL_BILL';
    case 'Vaccination Record': return 'VACCINATION_RECORD';
    default: return 'OTHER';
  }
}

/**
 * Maps event type string to Prisma enum safely
 */
function toPrismaEventType(type?: string): any {
  switch (type) {
    case 'Consultation': return 'CONSULTATION';
    case 'Diagnosis': return 'DIAGNOSIS';
    case 'Medication': return 'MEDICATION';
    case 'Laboratory': return 'LABORATORY';
    case 'Imaging': return 'IMAGING';
    case 'Procedure': return 'PROCEDURE';
    case 'Hospitalization': return 'HOSPITALIZATION';
    case 'Vaccination': return 'VACCINATION';
    case 'Allergy': return 'ALLERGY';
    default: return 'OTHER';
  }
}

/**
 * Synchronize state from memory to SQLite database (dev.db)
 */
export async function syncStateToSqlite(state: {
  patients?: any[];
  facilities?: any[];
  providers?: any[];
  documents?: any[];
  sources?: any[];
  events?: any[];
  diagnoses?: any[];
  medications?: any[];
  labs?: any[];
  contradictions?: any[];
  extractions?: any[];
  summaries?: any[];
}) {
  if (!prisma) return;

  try {
    // 1. Facilities
    for (const f of state.facilities || []) {
      await prisma.healthcareFacility.upsert({
        where: { id: f.id },
        update: { name: f.name, type: f.type || 'General', address: f.address || null },
        create: {
          id: f.id,
          name: f.name,
          type: f.type || 'General',
          address: f.address || null,
          createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
        },
      }).catch(() => {});
    }

    // 2. Providers
    for (const p of state.providers || []) {
      if (p.facilityId) {
        await prisma.healthcareProvider.upsert({
          where: { id: p.id },
          update: { name: p.name, specialization: p.specialization || 'General' },
          create: {
            id: p.id,
            name: p.name,
            specialization: p.specialization || 'General',
            facilityId: p.facilityId,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          },
        }).catch(() => {});
      }
    }

    // 3. Patients
    for (const p of state.patients || []) {
      await prisma.patient.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          dateOfBirth: new Date(p.dateOfBirth || '1980-01-01'),
          gender: toPrismaGender(p.gender),
          bloodGroup: p.bloodGroup || null,
          allergies: JSON.stringify(p.allergies || []),
        },
        create: {
          id: p.id,
          name: p.name,
          dateOfBirth: new Date(p.dateOfBirth || '1980-01-01'),
          gender: toPrismaGender(p.gender),
          bloodGroup: p.bloodGroup || null,
          allergies: JSON.stringify(p.allergies || []),
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        },
      }).catch(() => {});
    }

    // 4. Documents
    for (const d of state.documents || []) {
      const docStatus = toPrismaDocStatus(d.status);
      await prisma.document.upsert({
        where: { id: d.id },
        update: {
          fileName: d.fileName,
          documentType: toPrismaDocType(d.documentType),
          documentDate: new Date(d.documentDate || '2026-01-01'),
          status: docStatus,
          facilityId: d.facilityId || null,
          providerId: d.providerId || null,
        },
        create: {
          id: d.id,
          patientId: d.patientId,
          fileName: d.fileName,
          documentType: toPrismaDocType(d.documentType),
          documentDate: new Date(d.documentDate || '2026-01-01'),
          status: docStatus,
          facilityId: d.facilityId || null,
          providerId: d.providerId || null,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
        },
      }).catch(async (e) => {
        // Retry without facility/provider if FK constraint failed
        await prisma.document.upsert({
          where: { id: d.id },
          update: {
            fileName: d.fileName,
            documentType: toPrismaDocType(d.documentType),
            documentDate: new Date(d.documentDate || '2026-01-01'),
            status: docStatus,
            facilityId: null,
            providerId: null,
          },
          create: {
            id: d.id,
            patientId: d.patientId,
            fileName: d.fileName,
            documentType: toPrismaDocType(d.documentType),
            documentDate: new Date(d.documentDate || '2026-01-01'),
            status: docStatus,
            facilityId: null,
            providerId: null,
            createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
          },
        }).catch(() => {});
      });
    }

    // 5. Source References
    for (const s of state.sources || []) {
      await prisma.sourceReference.upsert({
        where: { id: s.id },
        update: {
          pageNumber: s.pageNumber || 1,
          sourceText: s.sourceText || s.quote || null,
        },
        create: {
          id: s.id,
          documentId: s.documentId,
          pageNumber: s.pageNumber || 1,
          sourceText: s.sourceText || s.quote || null,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        },
      }).catch(() => {});
    }

    // 6. Medical Events
    for (const e of state.events || []) {
      await prisma.medicalEvent.upsert({
        where: { id: e.id },
        update: {
          title: e.title,
          description: e.description || '',
          eventType: toPrismaEventType(e.eventType),
          eventDate: new Date(e.eventDate || '2026-01-01'),
          facilityId: e.facilityId || null,
          providerId: e.providerId || null,
          documentId: e.documentId || null,
          isManualEntry: !!e.isManualEntry,
        },
        create: {
          id: e.id,
          patientId: e.patientId,
          eventType: toPrismaEventType(e.eventType),
          eventDate: new Date(e.eventDate || '2026-01-01'),
          title: e.title,
          description: e.description || '',
          facilityId: e.facilityId || null,
          providerId: e.providerId || null,
          documentId: e.documentId || null,
          isManualEntry: !!e.isManualEntry,
          createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
        },
      }).catch(() => {});
    }

    // 7. Diagnoses
    for (const d of state.diagnoses || []) {
      await prisma.diagnosis.upsert({
        where: { id: d.id },
        update: {
          name: d.name,
          status: (d.status?.toUpperCase() as any) || 'ACTIVE',
          firstDocumentedDate: new Date(d.firstDocumentedDate || '2026-01-01'),
          lastDocumentedDate: new Date(d.lastDocumentedDate || '2026-01-01'),
          eventId: d.eventId || null,
          documentId: d.documentId || null,
          isManualEntry: !!d.isManualEntry,
        },
        create: {
          id: d.id,
          patientId: d.patientId,
          name: d.name,
          status: (d.status?.toUpperCase() as any) || 'ACTIVE',
          firstDocumentedDate: new Date(d.firstDocumentedDate || '2026-01-01'),
          lastDocumentedDate: new Date(d.lastDocumentedDate || '2026-01-01'),
          eventId: d.eventId || null,
          documentId: d.documentId || null,
          isManualEntry: !!d.isManualEntry,
        },
      }).catch(() => {});
    }

    // 8. Medications
    for (const m of state.medications || []) {
      await prisma.medication.upsert({
        where: { id: m.id },
        update: {
          name: m.name,
          genericName: m.genericName || null,
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          route: m.route || null,
          startDate: new Date(m.startDate || '2026-01-01'),
          endDate: m.endDate ? new Date(m.endDate) : null,
          status: (m.status?.toUpperCase() as any) || 'ACTIVE',
          eventId: m.eventId || null,
          documentId: m.documentId || null,
          isManualEntry: !!m.isManualEntry,
        },
        create: {
          id: m.id,
          patientId: m.patientId,
          name: m.name,
          genericName: m.genericName || null,
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          route: m.route || null,
          startDate: new Date(m.startDate || '2026-01-01'),
          endDate: m.endDate ? new Date(m.endDate) : null,
          status: (m.status?.toUpperCase() as any) || 'ACTIVE',
          eventId: m.eventId || null,
          documentId: m.documentId || null,
          isManualEntry: !!m.isManualEntry,
        },
      }).catch(() => {});
    }

    // 9. Lab Results
    for (const l of state.labs || []) {
      await prisma.labResult.upsert({
        where: { id: l.id },
        update: {
          testName: l.testName,
          parameterName: l.parameterName || l.testName,
          value: typeof l.value === 'number' ? l.value : parseFloat(String(l.value)) || 0,
          unit: l.unit || '',
          referenceRange: l.referenceRange || null,
          testDate: new Date(l.testDate || '2026-01-01'),
          facilityId: l.facilityId || null,
          documentId: l.documentId || null,
          eventId: l.eventId || null,
          isManualEntry: !!l.isManualEntry,
        },
        create: {
          id: l.id,
          patientId: l.patientId,
          testName: l.testName,
          parameterName: l.parameterName || l.testName,
          value: typeof l.value === 'number' ? l.value : parseFloat(String(l.value)) || 0,
          unit: l.unit || '',
          referenceRange: l.referenceRange || null,
          testDate: new Date(l.testDate || '2026-01-01'),
          facilityId: l.facilityId || null,
          documentId: l.documentId || null,
          eventId: l.eventId || null,
          isManualEntry: !!l.isManualEntry,
        },
      }).catch(() => {});
    }

    // 10. Contradictions
    for (const c of state.contradictions || []) {
      await (prisma as any).medicalContradiction.upsert({
        where: { id: c.id },
        update: {
          category: c.category,
          title: c.title,
          description: c.description,
          clinicalExplanation: c.clinicalExplanation || null,
          severity: c.severity || 'Moderate',
          status: c.status || 'Unresolved',
          reviewStatus: c.reviewStatus || null,
          reviewNotes: c.reviewNotes || null,
          reviewedAt: c.reviewedAt ? new Date(c.reviewedAt) : null,
          reviewedBy: c.reviewedBy || null,
          firstFact: c.firstFact || null,
          secondFact: c.secondFact || null,
          firstDate: c.firstDate || null,
          secondDate: c.secondDate || null,
          firstProvider: c.firstProvider || null,
          secondProvider: c.secondProvider || null,
          firstFacility: c.firstFacility || null,
          secondFacility: c.secondFacility || null,
          firstSourceReference: c.firstSourceReference || null,
          secondSourceReference: c.secondSourceReference || null,
          sourceAJson: c.sourceA ? JSON.stringify(c.sourceA) : null,
          sourceBJson: c.sourceB ? JSON.stringify(c.sourceB) : null,
        },
        create: {
          id: c.id,
          patientId: c.patientId,
          category: c.category,
          title: c.title,
          description: c.description,
          clinicalExplanation: c.clinicalExplanation || null,
          severity: c.severity || 'Moderate',
          status: c.status || 'Unresolved',
          reviewStatus: c.reviewStatus || null,
          reviewNotes: c.reviewNotes || null,
          reviewedAt: c.reviewedAt ? new Date(c.reviewedAt) : null,
          reviewedBy: c.reviewedBy || null,
          firstFact: c.firstFact || null,
          secondFact: c.secondFact || null,
          firstDate: c.firstDate || null,
          secondDate: c.secondDate || null,
          firstProvider: c.firstProvider || null,
          secondProvider: c.secondProvider || null,
          firstFacility: c.firstFacility || null,
          secondFacility: c.secondFacility || null,
          firstSourceReference: c.firstSourceReference || null,
          secondSourceReference: c.secondSourceReference || null,
          sourceAJson: c.sourceA ? JSON.stringify(c.sourceA) : null,
          sourceBJson: c.sourceB ? JSON.stringify(c.sourceB) : null,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        },
      }).catch(() => {});
    }

    // 11. Extractions
    for (const ex of state.extractions || []) {
      await prisma.documentExtraction.upsert({
        where: { id: ex.id },
        update: {
          model: ex.model || 'gemini-2.5-flash',
          status: ex.status || 'Completed',
          rawExtraction: ex.rawExtraction || null,
          dataJson: typeof ex.data === 'string' ? ex.data : JSON.stringify(ex.data || {}),
          extractedAt: ex.extractedAt ? new Date(ex.extractedAt) : new Date(),
          confirmedAt: ex.confirmedAt ? new Date(ex.confirmedAt) : null,
        },
        create: {
          id: ex.id,
          documentId: ex.documentId,
          model: ex.model || 'gemini-2.5-flash',
          status: ex.status || 'Completed',
          rawExtraction: ex.rawExtraction || null,
          dataJson: typeof ex.data === 'string' ? ex.data : JSON.stringify(ex.data || {}),
          extractedAt: ex.extractedAt ? new Date(ex.extractedAt) : new Date(),
          confirmedAt: ex.confirmedAt ? new Date(ex.confirmedAt) : null,
          createdAt: ex.createdAt ? new Date(ex.createdAt) : new Date(),
          updatedAt: ex.updatedAt ? new Date(ex.updatedAt) : new Date(),
        },
      }).catch(() => {});
    }

    // 12. Summaries
    for (const s of state.summaries || []) {
      await (prisma as any).healthSummary.upsert({
        where: { id: s.id },
        update: {
          title: s.title || 'Health Summary',
          contentJson: typeof s.content === 'string' ? s.content : JSON.stringify(s.content || {}),
          generatedAt: s.generatedAt ? new Date(s.generatedAt) : new Date(),
        },
        create: {
          id: s.id,
          patientId: s.patientId,
          title: s.title || 'Health Summary',
          contentJson: typeof s.content === 'string' ? s.content : JSON.stringify(s.content || {}),
          generatedAt: s.generatedAt ? new Date(s.generatedAt) : new Date(),
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        },
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Error syncing state to SQLite:', err);
  }
}

/**
 * Load complete dataset from SQLite into in-memory structure
 */
export async function loadStateFromSqlite(): Promise<{
  patients: any[];
  facilities: any[];
  providers: any[];
  documents: any[];
  sources: any[];
  events: any[];
  diagnoses: any[];
  medications: any[];
  labs: any[];
  contradictions: any[];
  extractions: any[];
  summaries: any[];
} | null> {
  if (!prisma) return null;

  try {
    const patientCount = await prisma.patient.count();
    if (patientCount === 0) return null;

    const [
      patients,
      facilities,
      providers,
      documents,
      sources,
      events,
      diagnoses,
      medications,
      labs,
      contradictions,
      extractions,
      summaries,
    ] = await Promise.all([
      prisma.patient.findMany(),
      prisma.healthcareFacility.findMany(),
      prisma.healthcareProvider.findMany(),
      prisma.document.findMany(),
      prisma.sourceReference.findMany(),
      prisma.medicalEvent.findMany({ orderBy: { eventDate: 'desc' } }),
      prisma.diagnosis.findMany(),
      prisma.medication.findMany(),
      prisma.labResult.findMany({ orderBy: { testDate: 'desc' } }),
      (prisma as any).medicalContradiction.findMany(),
      prisma.documentExtraction.findMany(),
      (prisma as any).healthSummary.findMany(),
    ]);

    return {
      patients: patients.map((p) => ({
        id: p.id,
        name: p.name,
        dateOfBirth: p.dateOfBirth.toISOString().split('T')[0],
        gender: p.gender === 'FEMALE' ? 'Female' : p.gender === 'OTHER' ? 'Other' : 'Male',
        bloodGroup: p.bloodGroup || undefined,
        allergies: p.allergies ? JSON.parse(p.allergies) : [],
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      facilities: facilities.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        address: f.address || undefined,
        createdAt: f.createdAt.toISOString(),
      })),
      providers: providers.map((pr) => ({
        id: pr.id,
        name: pr.name,
        specialization: pr.specialization,
        facilityId: pr.facilityId,
        createdAt: pr.createdAt.toISOString(),
      })),
      documents: documents.map((d) => ({
        id: d.id,
        patientId: d.patientId,
        fileName: d.fileName,
        documentType: d.documentType === 'PRESCRIPTION' ? 'Prescription' :
                      d.documentType === 'LAB_REPORT' ? 'Lab Report' :
                      d.documentType === 'DISCHARGE_SUMMARY' ? 'Discharge Summary' :
                      d.documentType === 'CONSULTATION_NOTE' ? 'Consultation Note' :
                      d.documentType === 'IMAGING_REPORT' ? 'Imaging Report' :
                      d.documentType === 'MEDICAL_BILL' ? 'Medical Bill' :
                      d.documentType === 'VACCINATION_RECORD' ? 'Vaccination Record' : 'Other',
        documentDate: d.documentDate.toISOString().split('T')[0],
        facilityId: d.facilityId || undefined,
        providerId: d.providerId || undefined,
        status: d.status === 'UPLOADED' ? 'Uploaded' :
                d.status === 'PROCESSING' ? 'Processing' :
                d.status === 'NEEDS_REVIEW' ? 'Needs Review' :
                d.status === 'FAILED' ? 'Failed' : 'Processed',
        createdAt: d.createdAt.toISOString(),
      })),
      sources: sources.map((s) => ({
        id: s.id,
        documentId: s.documentId,
        pageNumber: s.pageNumber || undefined,
        sourceText: s.sourceText || undefined,
        createdAt: s.createdAt.toISOString(),
      })),
      events: events.map((e) => ({
        id: e.id,
        patientId: e.patientId,
        eventType: e.eventType === 'CONSULTATION' ? 'Consultation' :
                   e.eventType === 'DIAGNOSIS' ? 'Diagnosis' :
                   e.eventType === 'MEDICATION' ? 'Medication' :
                   e.eventType === 'LABORATORY' ? 'Laboratory' :
                   e.eventType === 'IMAGING' ? 'Imaging' :
                   e.eventType === 'PROCEDURE' ? 'Procedure' :
                   e.eventType === 'HOSPITALIZATION' ? 'Hospitalization' :
                   e.eventType === 'VACCINATION' ? 'Vaccination' :
                   e.eventType === 'ALLERGY' ? 'Allergy' : 'Other',
        eventDate: e.eventDate.toISOString().split('T')[0],
        title: e.title,
        description: e.description,
        facilityId: e.facilityId || undefined,
        providerId: e.providerId || undefined,
        documentId: e.documentId || undefined,
        isManualEntry: e.isManualEntry,
        createdAt: e.createdAt.toISOString(),
      })),
      diagnoses: diagnoses.map((diag) => ({
        id: diag.id,
        patientId: diag.patientId,
        name: diag.name,
        status: diag.status === 'RESOLVED' ? 'Resolved' :
                diag.status === 'HISTORICAL' ? 'Historical' : 'Active',
        firstDocumentedDate: diag.firstDocumentedDate.toISOString().split('T')[0],
        lastDocumentedDate: diag.lastDocumentedDate.toISOString().split('T')[0],
        eventId: diag.eventId || undefined,
        documentId: diag.documentId || undefined,
        isManualEntry: diag.isManualEntry,
      })),
      medications: medications.map((m) => ({
        id: m.id,
        patientId: m.patientId,
        name: m.name,
        genericName: m.genericName || undefined,
        dosage: m.dosage,
        frequency: m.frequency,
        route: m.route || undefined,
        startDate: m.startDate.toISOString().split('T')[0],
        endDate: m.endDate ? m.endDate.toISOString().split('T')[0] : undefined,
        status: m.status === 'DISCONTINUED' ? 'Discontinued' :
                m.status === 'HISTORICAL' ? 'Historical' : 'Active',
        eventId: m.eventId || undefined,
        documentId: m.documentId || undefined,
        isManualEntry: m.isManualEntry,
      })),
      labs: labs.map((l) => ({
        id: l.id,
        patientId: l.patientId,
        testName: l.testName,
        parameterName: l.parameterName,
        value: l.value,
        unit: l.unit,
        referenceRange: l.referenceRange || undefined,
        testDate: l.testDate.toISOString().split('T')[0],
        facilityId: l.facilityId || undefined,
        documentId: l.documentId || undefined,
        eventId: l.eventId || undefined,
        isManualEntry: l.isManualEntry,
      })),
      contradictions: contradictions.map((c: any) => ({
        id: c.id,
        patientId: c.patientId,
        category: c.category,
        title: c.title,
        description: c.description,
        clinicalExplanation: c.clinicalExplanation || undefined,
        severity: c.severity,
        status: c.status,
        reviewStatus: c.reviewStatus || undefined,
        reviewNotes: c.reviewNotes || undefined,
        reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : undefined,
        reviewedBy: c.reviewedBy || undefined,
        firstFact: c.firstFact || undefined,
        secondFact: c.secondFact || undefined,
        firstDate: c.firstDate || undefined,
        secondDate: c.secondDate || undefined,
        firstProvider: c.firstProvider || undefined,
        secondProvider: c.secondProvider || undefined,
        firstFacility: c.firstFacility || undefined,
        secondFacility: c.secondFacility || undefined,
        firstSourceReference: c.firstSourceReference || undefined,
        secondSourceReference: c.secondSourceReference || undefined,
        sourceA: c.sourceAJson ? JSON.parse(c.sourceAJson) : undefined,
        sourceB: c.sourceBJson ? JSON.parse(c.sourceBJson) : undefined,
      })),
      extractions: extractions.map((ex) => ({
        id: ex.id,
        documentId: ex.documentId,
        model: ex.model,
        status: ex.status,
        rawExtraction: ex.rawExtraction || undefined,
        data: ex.dataJson ? JSON.parse(ex.dataJson) : {},
        extractedAt: ex.extractedAt.toISOString(),
        confirmedAt: ex.confirmedAt ? ex.confirmedAt.toISOString() : undefined,
        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString(),
      })),
      summaries: summaries.map((s: any) => ({
        id: s.id,
        patientId: s.patientId,
        title: s.title,
        content: s.contentJson ? JSON.parse(s.contentJson) : {},
        generatedAt: s.generatedAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    };
  } catch (err) {
    console.warn('Error loading state from SQLite:', err);
    return null;
  }
}
