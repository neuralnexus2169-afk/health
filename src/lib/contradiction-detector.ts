import {
  Patient,
  HealthcareFacility,
  HealthcareProvider,
  MedicalDocument,
  MedicalEvent,
  Diagnosis,
  Medication,
  SourceReference,
  DocumentExtraction,
  MedicalContradiction,
  ContradictionEvidenceItem,
} from '../types/medical';

export interface ContradictionDetectionInput {
  patient: Patient;
  documents: MedicalDocument[];
  sourceReferences: SourceReference[];
  medications: Medication[];
  diagnoses: Diagnosis[];
  facilities: HealthcareFacility[];
  providers: HealthcareProvider[];
  events: MedicalEvent[];
  extractions?: DocumentExtraction[];
}

export interface ContradictionDetectionResult {
  contradictions: MedicalContradiction[];
  totalCount: number;
  unreviewedCount: number;
  reviewedCount: number;
  countsByCategory: {
    Allergy: number;
    Medication: number;
    Diagnosis: number;
    Timeline: number;
  };
}

/**
 * Deterministic Clinical Contradiction Detector
 * Analyzes structured patient records to identify potential documentation discrepancies
 * without making clinical value judgments or asserting which record is authoritative.
 */
export class ContradictionDetector {
  /**
   * Run full deterministic contradiction detection against a patient's records
   */
  public detect(input: ContradictionDetectionInput): MedicalContradiction[] {
    const results: MedicalContradiction[] = [];

    // Helper map lookups for fast enrichment
    const facilityMap = new Map<string, HealthcareFacility>();
    input.facilities.forEach((f) => facilityMap.set(f.id, f));

    const providerMap = new Map<string, HealthcareProvider>();
    input.providers.forEach((p) => providerMap.set(p.id, p));

    const documentMap = new Map<string, MedicalDocument>();
    input.documents.forEach((d) => documentMap.set(d.id, d));

    const eventMap = new Map<string, MedicalEvent>();
    input.events.forEach((e) => eventMap.set(e.id, e));

    // 1. Detect Allergy Contradictions
    const allergyContradictions = this.detectAllergyContradictions(input, documentMap, facilityMap, providerMap);
    results.push(...allergyContradictions);

    // 2. Detect Medication Conflicts
    const medicationContradictions = this.detectMedicationConflicts(input, documentMap, facilityMap, providerMap);
    results.push(...medicationContradictions);

    // 3. Detect Diagnosis Status Conflicts
    const diagnosisContradictions = this.detectDiagnosisConflicts(input, documentMap, facilityMap, providerMap);
    results.push(...diagnosisContradictions);

    return results;
  }

  /**
   * Category A: Allergy Contradictions
   * Detects explicit disagreements such as:
   * - One record explicitly asserts "No Known Allergies" / "NKDA"
   * - Another record documents a specific active allergy (e.g., Penicillin with rash)
   */
  private detectAllergyContradictions(
    input: ContradictionDetectionInput,
    documentMap: Map<string, MedicalDocument>,
    facilityMap: Map<string, HealthcareFacility>,
    providerMap: Map<string, HealthcareProvider>
  ): MedicalContradiction[] {
    const contradictions: MedicalContradiction[] = [];

    // Allergy mentions collectors
    interface AllergyMention {
      type: 'NKDA' | 'SPECIFIC';
      allergyName?: string;
      reaction?: string;
      quote: string;
      documentId: string;
      documentFileName: string;
      date: string;
      pageNumber?: number;
      facilityName?: string;
      providerName?: string;
      sourceReferenceId?: string;
    }

    const mentions: AllergyMention[] = [];

    // Helper to get doc metadata
    const getDocMeta = (docId?: string) => {
      if (!docId) return { fileName: 'medical_record.pdf', date: '2023-01-01', facility: 'Healthcare Facility', provider: 'Healthcare Provider' };
      const doc = documentMap.get(docId);
      const facility = doc?.facilityId ? facilityMap.get(doc.facilityId)?.name : doc?.facilityName || 'Healthcare Facility';
      const provider = doc?.providerId ? providerMap.get(doc.providerId)?.name : doc?.providerName || 'Attending Physician';
      return {
        fileName: doc?.fileName || 'medical_record.pdf',
        date: doc?.documentDate || '2023-01-01',
        facility,
        provider,
      };
    };

    // 1. Inspect Source References for explicit allergy statements
    for (const ref of input.sourceReferences) {
      const text = ref.sourceText || '';
      const lower = text.toLowerCase();
      const meta = getDocMeta(ref.documentId);

      // Check for NKDA / No known allergies
      if (
        lower.includes('no known drug allergies') ||
        lower.includes('no known allergies') ||
        lower.includes('(nkda)') ||
        lower.includes('allergies: none') ||
        lower.includes('nkda')
      ) {
        mentions.push({
          type: 'NKDA',
          quote: text,
          documentId: ref.documentId,
          documentFileName: meta.fileName,
          date: meta.date,
          pageNumber: ref.pageNumber || 1,
          facilityName: meta.facility,
          providerName: meta.provider,
          sourceReferenceId: ref.id,
        });
      }

      // Check for Penicillin or other specific allergies documented
      if (
        (lower.includes('penicillin') || lower.includes('amoxicillin') || lower.includes('sulfa') || lower.includes('aspirin')) &&
        (lower.includes('allerg') || lower.includes('rash') || lower.includes('hives') || lower.includes('reaction'))
      ) {
        let allergyName = 'Penicillin';
        if (lower.includes('sulfa')) allergyName = 'Sulfa drugs';
        if (lower.includes('aspirin')) allergyName = 'Aspirin';

        let reaction = 'Rash';
        if (lower.includes('maculopapular rash')) reaction = 'Childhood maculopapular rash';
        else if (lower.includes('hives')) reaction = 'Hives (Urticaria)';

        mentions.push({
          type: 'SPECIFIC',
          allergyName,
          reaction,
          quote: text,
          documentId: ref.documentId,
          documentFileName: meta.fileName,
          date: meta.date,
          pageNumber: ref.pageNumber || 1,
          facilityName: meta.facility,
          providerName: meta.provider,
          sourceReferenceId: ref.id,
        });
      }
    }

    // 2. Also inspect document extracted snippets if not already captured from source refs
    for (const doc of input.documents) {
      const text = doc.extractedTextSnippet || '';
      const lower = text.toLowerCase();
      const meta = getDocMeta(doc.id);

      const alreadyHasDocNKDA = mentions.some((m) => m.documentId === doc.id && m.type === 'NKDA');
      const alreadyHasDocSpecific = mentions.some((m) => m.documentId === doc.id && m.type === 'SPECIFIC');

      if (!alreadyHasDocNKDA && (lower.includes('no known drug allergies') || lower.includes('(nkda)'))) {
        mentions.push({
          type: 'NKDA',
          quote: text,
          documentId: doc.id,
          documentFileName: meta.fileName,
          date: meta.date,
          pageNumber: 1,
          facilityName: meta.facility,
          providerName: meta.provider,
        });
      }

      if (!alreadyHasDocSpecific && lower.includes('penicillin') && (lower.includes('allerg') || lower.includes('rash'))) {
        mentions.push({
          type: 'SPECIFIC',
          allergyName: 'Penicillin',
          reaction: 'Documented rash',
          quote: text,
          documentId: doc.id,
          documentFileName: meta.fileName,
          date: meta.date,
          pageNumber: 1,
          facilityName: meta.facility,
          providerName: meta.provider,
        });
      }
    }

    // 3. Inspect document extractions if present
    if (input.extractions) {
      for (const ext of input.extractions) {
        const allergies = ext.data?.allergies || [];
        const meta = getDocMeta(ext.documentId);
        for (const a of allergies) {
          const substance = (a.substance || '').toLowerCase();
          if (substance.includes('no known') || substance.includes('nkda') || substance.includes('none')) {
            if (!mentions.some((m) => m.documentId === ext.documentId && m.type === 'NKDA')) {
              mentions.push({
                type: 'NKDA',
                quote: a.sourceQuote || 'Allergies: No Known Drug Allergies (NKDA)',
                documentId: ext.documentId,
                documentFileName: meta.fileName,
                date: meta.date,
                pageNumber: a.pageNumber || 1,
                facilityName: meta.facility,
                providerName: meta.provider,
              });
            }
          } else if (substance.length > 0) {
            if (!mentions.some((m) => m.documentId === ext.documentId && m.type === 'SPECIFIC')) {
              mentions.push({
                type: 'SPECIFIC',
                allergyName: a.substance,
                reaction: a.reaction || 'Hypersensitivity',
                quote: a.sourceQuote || `Documented allergy: ${a.substance}`,
                documentId: ext.documentId,
                documentFileName: meta.fileName,
                date: meta.date,
                pageNumber: a.pageNumber || 1,
                facilityName: meta.facility,
                providerName: meta.provider,
              });
            }
          }
        }
      }
    }

    
    // 3.5 Inspect manual events for Allergies
    for (const evt of input.events) {
      if (evt.eventType === 'Allergy') {
        const lower = (evt.title || '').toLowerCase();
        const reactionLower = (evt.description || '').toLowerCase();
        
        if (lower.includes('no known') || lower.includes('nkda') || lower.includes('none')) {
          if (!mentions.some((m) => m.documentId === evt.id && m.type === 'NKDA')) {
            mentions.push({
              type: 'NKDA',
              quote: 'Manual entry: ' + evt.title,
              documentId: evt.id, // Using event ID as placeholder
              documentFileName: 'Manual Entry',
              date: evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : '2023-01-01',
              pageNumber: 1,
              facilityName: evt.facilityName || 'User Entry',
              providerName: evt.providerName || 'User',
            });
          }
        } else if (lower.length > 0) {
          if (!mentions.some((m) => m.documentId === evt.id && m.type === 'SPECIFIC')) {
            mentions.push({
              type: 'SPECIFIC',
              allergyName: evt.title,
              reaction: evt.description || 'Reaction',
              quote: 'Manual entry: ' + evt.title + (evt.description ? ' - ' + evt.description : ''),
              documentId: evt.id,
              documentFileName: 'Manual Entry',
              date: evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : '2023-01-01',
              pageNumber: 1,
              facilityName: evt.facilityName || 'User Entry',
              providerName: evt.providerName || 'User',
            });
          }
        }
      }
    }

    // 3.6 Inspect patient profile allergies
    if (input.patient && input.patient.allergies) {
      for (const a of input.patient.allergies) {
        const lower = a.toLowerCase();
        if (lower.includes('no known') || lower.includes('nkda') || lower.includes('none')) {
          if (!mentions.some((m) => m.type === 'NKDA')) {
            mentions.push({
              type: 'NKDA',
              quote: 'Patient profile: ' + a,
              documentId: 'profile-allergy',
              documentFileName: 'Patient Profile',
              date: new Date().toISOString().split('T')[0],
              pageNumber: 1,
              facilityName: 'Patient Record',
              providerName: 'Self-reported',
            });
          }
        } else if (lower.length > 0) {
          if (!mentions.some((m) => m.type === 'SPECIFIC')) {
            mentions.push({
              type: 'SPECIFIC',
              allergyName: a.split('(')[0].trim(),
              reaction: a.includes('(') ? a.split('(')[1].replace(')', '').trim() : 'Documented allergy',
              quote: 'Patient profile: ' + a,
              documentId: 'profile-allergy',
              documentFileName: 'Patient Profile',
              date: new Date().toISOString().split('T')[0],
              pageNumber: 1,
              facilityName: 'Patient Record',
              providerName: 'Self-reported',
            });
          }
        }
      }
    }

    // 4. Match NKDA against Specific Allergies
    const nkdaMentions = mentions.filter((m) => m.type === 'NKDA');
    const specificMentions = mentions.filter((m) => m.type === 'SPECIFIC');

    if (nkdaMentions.length > 0 && specificMentions.length > 0) {
      // Group by specific allergy name
      const specificMap = new Map<string, AllergyMention[]>();
      specificMentions.forEach((sm) => {
        const key = (sm.allergyName || 'Penicillin').toLowerCase();
        if (!specificMap.has(key)) specificMap.set(key, []);
        specificMap.get(key)!.push(sm);
      });

      specificMap.forEach((specList, allergyKey) => {
        const bestSpec = specList[0];
        const bestNkda = nkdaMentions[0];

        // Format facts and evidence
        const capitalizedAllergy = bestSpec.allergyName || allergyKey.charAt(0).toUpperCase() + allergyKey.slice(1);
        const specFact = `${capitalizedAllergy} Allergy${bestSpec.reaction ? ` (${bestSpec.reaction})` : ''}`;
        const nkdaFact = 'No Known Drug Allergies (NKDA)';

        const firstDoc: ContradictionEvidenceItem = {
          documentId: bestNkda.documentId,
          documentFileName: bestNkda.documentFileName,
          documentDate: bestNkda.date,
          facilityName: bestNkda.facilityName,
          providerName: bestNkda.providerName,
          pageNumber: bestNkda.pageNumber || 1,
          quote: bestNkda.quote,
          fact: nkdaFact,
          sourceReferenceId: bestNkda.sourceReferenceId,
        };

        const secondDoc: ContradictionEvidenceItem = {
          documentId: bestSpec.documentId,
          documentFileName: bestSpec.documentFileName,
          documentDate: bestSpec.date,
          facilityName: bestSpec.facilityName,
          providerName: bestSpec.providerName,
          pageNumber: bestSpec.pageNumber || 1,
          quote: bestSpec.quote,
          fact: specFact,
          sourceReferenceId: bestSpec.sourceReferenceId,
        };

        contradictions.push({
          id: `contra-allergy-${allergyKey}-01`,
          patientId: input.patient.id,
          category: 'Allergy',
          title: `Discrepancy in Documented ${capitalizedAllergy} Allergy`,
          description: `Documentation mismatch between records: one record explicitly documents a ${capitalizedAllergy} allergy, whereas another record explicitly states No Known Drug Allergies (NKDA).`,
          clinicalExplanation: `These records contain conflicting allergy information. One record documents ${specFact}, while another record documents ${nkdaFact}. Review the source records to determine the current, accurate allergy status. No automatic clinical conclusion has been made.`,
          severity: 'High',
          status: 'Unreviewed',
          reviewStatus: 'Unreviewed',
          firstFact: nkdaFact,
          secondFact: specFact,
          firstDate: bestNkda.date,
          secondDate: bestSpec.date,
          firstProvider: bestNkda.providerName,
          secondProvider: bestSpec.providerName,
          firstFacility: bestNkda.facilityName,
          secondFacility: bestSpec.facilityName,
          firstSourceReference: bestNkda.quote,
          secondSourceReference: bestSpec.quote,
          firstDocument: firstDoc,
          secondDocument: secondDoc,
          sourceA: {
            documentId: bestSpec.documentId,
            documentFileName: bestSpec.documentFileName,
            documentDate: bestSpec.date,
            pageNumber: bestSpec.pageNumber || 1,
            quote: bestSpec.quote,
            facilityName: bestSpec.facilityName,
            providerName: bestSpec.providerName,
          },
          sourceB: {
            documentId: bestNkda.documentId,
            documentFileName: bestNkda.documentFileName,
            documentDate: bestNkda.date,
            pageNumber: bestNkda.pageNumber || 1,
            quote: bestNkda.quote,
            facilityName: bestNkda.facilityName,
            providerName: bestNkda.providerName,
          },
        });
      });
    }

    return contradictions;
  }

  /**
   * Category B: Medication Conflicts
   * Detects explicit conflicts such as:
   * - Same medication with contradictory status (Active vs Discontinued) during overlapping intervals
   * - Conflicting dosage or instructions documented simultaneously
   * Note: Sequential changes (prescribed 2024, discontinued 2025) are normal and NOT flagged.
   */
  private detectMedicationConflicts(
    input: ContradictionDetectionInput,
    documentMap: Map<string, MedicalDocument>,
    facilityMap: Map<string, HealthcareFacility>,
    providerMap: Map<string, HealthcareProvider>
  ): MedicalContradiction[] {
    const contradictions: MedicalContradiction[] = [];

    // Helper for normalized medication name
    const normalizeMedName = (name: string): string => {
      const lower = name.toLowerCase();
      if (lower.includes('metformin')) return 'metformin';
      if (lower.includes('glimepiride')) return 'glimepiride';
      if (lower.includes('amlodipine')) return 'amlodipine';
      if (lower.includes('empagliflozin') || lower.includes('jardiance')) return 'empagliflozin';
      if (lower.includes('lisinopril')) return 'lisinopril';
      if (lower.includes('atorvastatin') || lower.includes('lipitor')) return 'atorvastatin';
      return lower.split(' ')[0].trim();
    };

    // Group medications by normalized drug name
    const medGroups = new Map<string, Medication[]>();
    for (const med of input.medications) {
      const key = normalizeMedName(med.genericName || med.name);
      if (!medGroups.has(key)) medGroups.set(key, []);
      medGroups.get(key)!.push(med);
    }

    // Examine each group for simultaneous conflicting statuses or dosages
    medGroups.forEach((meds, drugKey) => {
      if (meds.length < 2) return;

      for (let i = 0; i < meds.length; i++) {
        for (let j = i + 1; j < meds.length; j++) {
          const medA = meds[i];
          const medB = meds[j];

          // Check if both records are from the exact same date or have identical start dates
          const sameDate = medA.startDate === medB.startDate;

          // Conflict 1: One record says 'Active' and another says 'Discontinued' on the same start date
          if (sameDate && medA.status !== medB.status && (medA.status === 'Active' || medB.status === 'Active') && (medA.status === 'Discontinued' || medB.status === 'Discontinued')) {
            const activeMed = medA.status === 'Active' ? medA : medB;
            const discontinuedMed = medA.status === 'Discontinued' ? medA : medB;

            const docA = documentMap.get(activeMed.documentId || '');
            const docB = documentMap.get(discontinuedMed.documentId || '');

            const facilityA = docA?.facilityId ? facilityMap.get(docA.facilityId)?.name : 'Primary Care';
            const facilityB = docB?.facilityId ? facilityMap.get(docB.facilityId)?.name : 'Hospital Facility';

            contradictions.push({
              id: `contra-med-${drugKey}-status-01`,
              patientId: input.patient.id,
              category: 'Medication',
              title: `Contradictory Status for ${activeMed.name}`,
              description: `Records documented on ${activeMed.startDate} disagree on medication status: one documents ${activeMed.name} as Active, while another documents it as Discontinued.`,
              clinicalExplanation: `Conflicting documentation regarding whether ${activeMed.name} was active or discontinued at the documented encounter. Review prescribing and discharge notes to verify the therapeutic plan.`,
              severity: 'Moderate',
              status: 'Unreviewed',
              reviewStatus: 'Unreviewed',
              firstFact: `${activeMed.name} ${activeMed.dosage} — Documented Active`,
              secondFact: `${discontinuedMed.name} — Documented Discontinued`,
              firstDate: activeMed.startDate,
              secondDate: discontinuedMed.startDate,
              firstProvider: activeMed.prescribedBy || 'Attending Physician',
              secondProvider: discontinuedMed.prescribedBy || 'Consulting Physician',
              firstFacility: facilityA,
              secondFacility: facilityB,
              firstSourceReference: `Rx: ${activeMed.name} ${activeMed.dosage}, status Active`,
              secondSourceReference: `Order: ${discontinuedMed.name}, status Discontinued`,
              firstDocument: {
                documentId: activeMed.documentId || 'doc-rx',
                documentFileName: activeMed.documentFileName || 'prescription.pdf',
                documentDate: activeMed.startDate,
                facilityName: facilityA,
                providerName: activeMed.prescribedBy,
                quote: `Rx: ${activeMed.name} ${activeMed.dosage}, Status: Active`,
                fact: `${activeMed.name} — Active`,
              },
              secondDocument: {
                documentId: discontinuedMed.documentId || 'doc-discharge',
                documentFileName: discontinuedMed.documentFileName || 'discharge.pdf',
                documentDate: discontinuedMed.startDate,
                facilityName: facilityB,
                providerName: discontinuedMed.prescribedBy,
                quote: `Discontinuation note: ${discontinuedMed.name}`,
                fact: `${discontinuedMed.name} — Discontinued`,
              },
              sourceA: {
                documentId: activeMed.documentId || 'doc-rx',
                documentFileName: activeMed.documentFileName || 'prescription.pdf',
                documentDate: activeMed.startDate,
                quote: `Rx: ${activeMed.name} ${activeMed.dosage}`,
                facilityName: facilityA,
                providerName: activeMed.prescribedBy,
              },
              sourceB: {
                documentId: discontinuedMed.documentId || 'doc-discharge',
                documentFileName: discontinuedMed.documentFileName || 'discharge.pdf',
                documentDate: discontinuedMed.startDate,
                quote: `Medication status: Discontinued`,
                facilityName: facilityB,
                providerName: discontinuedMed.prescribedBy,
              },
            });
          }

          // Conflict 2: Same medication active concurrently with conflicting dosages documented on same encounter date
          if (sameDate && medA.status === 'Active' && medB.status === 'Active' && medA.dosage && medB.dosage && medA.dosage.trim().toLowerCase() !== medB.dosage.trim().toLowerCase()) {
            const docA = documentMap.get(medA.documentId || '');
            const docB = documentMap.get(medB.documentId || '');

            contradictions.push({
              id: `contra-med-${drugKey}-dose-01`,
              patientId: input.patient.id,
              category: 'Medication',
              title: `Conflicting Dosages Documented for ${medA.name}`,
              description: `Two records from ${medA.startDate} document conflicting dosages for ${medA.name}: ${medA.dosage} vs ${medB.dosage}.`,
              clinicalExplanation: `Concurrent records contain differing dosage instructions for ${medA.name}. Verify the current prescription order with the prescribing clinician.`,
              severity: 'Moderate',
              status: 'Unreviewed',
              reviewStatus: 'Unreviewed',
              firstFact: `${medA.name} — ${medA.dosage} (${medA.frequency})`,
              secondFact: `${medB.name} — ${medB.dosage} (${medB.frequency})`,
              firstDate: medA.startDate,
              secondDate: medB.startDate,
              firstProvider: medA.prescribedBy || 'Physician A',
              secondProvider: medB.prescribedBy || 'Physician B',
              firstFacility: docA?.facilityName || 'Facility A',
              secondFacility: docB?.facilityName || 'Facility B',
              firstSourceReference: `Dosage: ${medA.dosage}`,
              secondSourceReference: `Dosage: ${medB.dosage}`,
              firstDocument: {
                documentId: medA.documentId || '',
                documentFileName: medA.documentFileName || 'document1.pdf',
                documentDate: medA.startDate,
                facilityName: docA?.facilityName,
                providerName: medA.prescribedBy,
                quote: `Prescription: ${medA.name} ${medA.dosage} ${medA.frequency}`,
                fact: `${medA.name} ${medA.dosage}`,
              },
              secondDocument: {
                documentId: medB.documentId || '',
                documentFileName: medB.documentFileName || 'document2.pdf',
                documentDate: medB.startDate,
                facilityName: docB?.facilityName,
                providerName: medB.prescribedBy,
                quote: `Prescription: ${medB.name} ${medB.dosage} ${medB.frequency}`,
                fact: `${medB.name} ${medB.dosage}`,
              },
              sourceA: {
                documentId: medA.documentId || '',
                documentFileName: medA.documentFileName || 'document1.pdf',
                documentDate: medA.startDate,
                quote: `${medA.name} ${medA.dosage}`,
              },
              sourceB: {
                documentId: medB.documentId || '',
                documentFileName: medB.documentFileName || 'document2.pdf',
                documentDate: medB.startDate,
                quote: `${medB.name} ${medB.dosage}`,
              },
            });
          }
        }
      }
    });

    return contradictions;
  }

  /**
   * Category C: Diagnosis Conflicts
   * Detects explicit disagreements where:
   * - Condition is documented as active in one record
   * - Condition is explicitly documented as resolved or ruled out in another record during overlapping timeframes
   */
  private detectDiagnosisConflicts(
    input: ContradictionDetectionInput,
    documentMap: Map<string, MedicalDocument>,
    facilityMap: Map<string, HealthcareFacility>,
    providerMap: Map<string, HealthcareProvider>
  ): MedicalContradiction[] {
    const contradictions: MedicalContradiction[] = [];

    const normDiag = (name: string): string => {
      const lower = name.toLowerCase();
      if (lower.includes('diabetes')) return 'diabetes';
      if (lower.includes('hypertension') || lower.includes('high blood pressure')) return 'hypertension';
      if (lower.includes('hyperlipidemia') || lower.includes('dyslipidemia')) return 'hyperlipidemia';
      return lower.trim();
    };

    const diagGroups = new Map<string, Diagnosis[]>();
    for (const d of input.diagnoses) {
      const key = normDiag(d.name);
      if (!diagGroups.has(key)) diagGroups.set(key, []);
      diagGroups.get(key)!.push(d);
    }

    diagGroups.forEach((group, key) => {
      if (group.length < 2) return;

      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const dA = group[i];
          const dB = group[j];

          // If documented on exact same date with conflicting active vs resolved status
          if (dA.firstDocumentedDate === dB.firstDocumentedDate && dA.status !== dB.status && (dA.status === 'Active' || dB.status === 'Active') && (dA.status === 'Resolved' || dB.status === 'Resolved')) {
            const activeDiag = dA.status === 'Active' ? dA : dB;
            const resolvedDiag = dA.status === 'Resolved' ? dA : dB;

            const docA = documentMap.get(activeDiag.documentId || '');
            const docB = documentMap.get(resolvedDiag.documentId || '');

            contradictions.push({
              id: `contra-diag-${key}-01`,
              patientId: input.patient.id,
              category: 'Diagnosis',
              title: `Contradictory Diagnosis Status for ${activeDiag.name}`,
              description: `Records on ${activeDiag.firstDocumentedDate} conflict regarding condition status: one record documents ${activeDiag.name} as Active, while another documents it as Resolved.`,
              clinicalExplanation: `These records contain contradictory assertions regarding clinical activity for ${activeDiag.name}. Review diagnostic evaluations and clinical notes. No automatic resolution has been made.`,
              severity: 'Moderate',
              status: 'Unreviewed',
              reviewStatus: 'Unreviewed',
              firstFact: `${activeDiag.name} — Documented Active`,
              secondFact: `${resolvedDiag.name} — Documented Resolved`,
              firstDate: activeDiag.firstDocumentedDate,
              secondDate: resolvedDiag.firstDocumentedDate,
              firstProvider: docA?.providerName || 'Physician A',
              secondProvider: docB?.providerName || 'Physician B',
              firstFacility: docA?.facilityName || 'Facility A',
              secondFacility: docB?.facilityName || 'Facility B',
              firstSourceReference: activeDiag.clinicalNotes || `Diagnosis ${activeDiag.name}: Active`,
              secondSourceReference: resolvedDiag.clinicalNotes || `Diagnosis ${resolvedDiag.name}: Resolved`,
              firstDocument: {
                documentId: activeDiag.documentId || '',
                documentFileName: activeDiag.documentFileName || 'consultation.pdf',
                documentDate: activeDiag.firstDocumentedDate,
                quote: activeDiag.clinicalNotes || `${activeDiag.name} documented Active`,
                fact: `${activeDiag.name} (Active)`,
              },
              secondDocument: {
                documentId: resolvedDiag.documentId || '',
                documentFileName: resolvedDiag.documentFileName || 'discharge.pdf',
                documentDate: resolvedDiag.firstDocumentedDate,
                quote: resolvedDiag.clinicalNotes || `${resolvedDiag.name} documented Resolved`,
                fact: `${resolvedDiag.name} (Resolved)`,
              },
              sourceA: {
                documentId: activeDiag.documentId || '',
                documentFileName: activeDiag.documentFileName || 'consultation.pdf',
                documentDate: activeDiag.firstDocumentedDate,
                quote: activeDiag.clinicalNotes || `${activeDiag.name} — Active`,
              },
              sourceB: {
                documentId: resolvedDiag.documentId || '',
                documentFileName: resolvedDiag.documentFileName || 'discharge.pdf',
                documentDate: resolvedDiag.firstDocumentedDate,
                quote: resolvedDiag.clinicalNotes || `${resolvedDiag.name} — Resolved`,
              },
            });
          }
        }
      }
    });

    return contradictions;
  }
}

export const contradictionDetector = new ContradictionDetector();
