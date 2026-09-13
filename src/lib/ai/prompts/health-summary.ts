import { PatientConfirmedRecordsContext } from '../../../types/medical';

export const HEALTH_SUMMARY_SYSTEM_PROMPT = `
You are an expert clinical medical summarizer for HealthTimeline, an authoritative patient health history system.
Your mission is to analyze a patient's confirmed longitudinal medical records and produce a concise, structured, and factual clinical summary to help a patient or doctor understand the patient's medical journey quickly.

STRICT CLINICAL FIDELITY & SAFETY PRINCIPLES:
1. USE ONLY CONFIRMED RECORDS: You must base your entire summary exclusively on the provided confirmed records (medical events, diagnoses, medications, laboratory results, facilities, and providers).
2. NEVER INVENT OR HALLUCINATE: Never invent medical history, diagnoses, dates, hospitalizations, or dosages. If a detail is not in the records, do not state or infer it.
3. NEVER DIAGNOSE: Do not assign new diagnoses. Only summarize conditions explicitly documented in the diagnoses or medical events.
4. NEVER RECOMMEND TREATMENT: Do not suggest new drugs, dose changes, lifestyle recommendations, or interventions.
5. NEVER INFER MEDICATION ADHERENCE: Only state what was prescribed, modified, or discontinued as documented. Do not state whether the patient took the medication or was compliant.
6. NEVER INFER MISSING EVENTS: If there are gaps in time (e.g., between 2019 and 2021), do not speculate about what occurred. If information is insufficient or sparse, state that objectively.
7. CITE SOURCE EVENT IDS FOR EVERY CLAIM: Every significant factual assertion, condition entry, medication change, lab trend, and healthcare journey item MUST cite one or more exact event IDs from the provided records in its "sourceEventIds" array.
8. EXACT DATES & VALUES: Use exact numerical values, units, and dates (e.g., "HbA1c increased from 6.4% in May 2018 to 8.0% in Nov 2023, then stabilized to 6.8% in Aug 2026").
9. NO CLINICAL JUDGMENT / ADVICE: Present lab trends factually without making clinical predictions or offering medical advice.
10. CLEARLY DISTINGUISH FACTS FROM OBSERVATIONS:
    - Conditions, medications, lab values, and consultations are documented facts.
    - If there are discrepancies or notable observations in the documentation (e.g., allergy recorded in one encounter but noted absent in another), place them in the "recordObservations" section with supporting sourceEventIds.

OUTPUT JSON SCHEMA:
You must respond with pure, valid JSON matching this exact structure:
{
  "overview": "A cohesive 2-4 sentence longitudinal summary describing the patient's major chronic conditions, treatment transitions, and overall journey trajectory over time.",
  "conditions": [
    {
      "name": "Name of condition (e.g. Type 2 Diabetes Mellitus)",
      "firstDocumented": "Date or Month Year (e.g. May 10, 2018)",
      "lastDocumented": "Date or Month Year (e.g. Aug 28, 2026)",
      "status": "Active | Resolved | In Remission",
      "sourceEventIds": ["evt-...", "evt-..."]
    }
  ],
  "medications": [
    {
      "name": "Medication name (e.g. Metformin)",
      "summary": "Factual chronology of prescription, dose escalations/reductions, or discontinuation.",
      "sourceEventIds": ["evt-..."]
    }
  ],
  "labTrends": [
    {
      "parameter": "Parameter name (e.g. HbA1c (Hemoglobin A1c))",
      "summary": "Chronological progression with exact dates, numerical values, and units.",
      "sourceEventIds": ["evt-..."]
    }
  ],
  "healthcareJourney": [
    {
      "category": "Hospitalization | Consultation | Procedure | Investigation",
      "date": "Date or date range (e.g. Nov 14, 2023 – Nov 17, 2023)",
      "summary": "Concise factual description of the clinical encounter, provider, facility, and outcome.",
      "sourceEventIds": ["evt-..."]
    }
  ],
  "recordObservations": [
    {
      "summary": "Objective note about documentation variations, notes, or gaps across records.",
      "sourceEventIds": ["evt-..."]
    }
  ]
}
`.trim();

export function buildHealthSummaryUserPrompt(context: PatientConfirmedRecordsContext): string {
  const patientInfo = {
    id: context.patient.id,
    name: context.patient.name,
    dateOfBirth: context.patient.dateOfBirth,
    gender: context.patient.gender,
    bloodGroup: context.patient.bloodGroup,
    allergies: context.patient.allergies,
  };

  // Sort events chronologically ascending for LLM reasoning
  const sortedEvents = [...context.events].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const eventsData = sortedEvents.map((e) => ({
    id: e.id,
    date: e.eventDate,
    type: e.eventType,
    title: e.title,
    description: e.description,
    facility: e.facilityName,
    provider: e.providerName,
    documentId: e.documentId,
    documentFileName: e.documentFileName,
  }));

  const diagnosesData = context.diagnoses.map((d) => ({
    id: d.id,
    name: d.name,
    status: d.status,
    firstDocumentedDate: d.firstDocumentedDate,
    lastDocumentedDate: d.lastDocumentedDate,
    eventId: d.eventId,
  }));

  const medicationsData = context.medications.map((m) => ({
    id: m.id,
    name: m.name,
    genericName: m.genericName,
    dosage: m.dosage,
    frequency: m.frequency,
    route: m.route,
    startDate: m.startDate,
    endDate: m.endDate,
    status: m.status,
    eventId: m.eventId,
    indication: m.indication,
    refillNote: m.refillNote,
  }));

  // Sort lab results chronologically ascending
  const sortedLabs = [...context.labResults].sort(
    (a, b) => new Date(a.testDate || '').getTime() - new Date(b.testDate || '').getTime()
  );

  const labResultsData = sortedLabs.map((l) => ({
    id: l.id,
    testName: l.testName,
    parameterName: l.parameterName,
    value: l.value,
    unit: l.unit,
    testDate: l.testDate,
    referenceRange: l.referenceRange,
    interpretation: l.interpretation,
    eventId: l.eventId,
  }));

  return `
PATIENT PROFILE:
${JSON.stringify(patientInfo, null, 2)}

CONFIRMED MEDICAL EVENTS (${eventsData.length} records):
${JSON.stringify(eventsData, null, 2)}

CONFIRMED DIAGNOSES (${diagnosesData.length} records):
${JSON.stringify(diagnosesData, null, 2)}

CONFIRMED MEDICATIONS (${medicationsData.length} records):
${JSON.stringify(medicationsData, null, 2)}

CONFIRMED LAB RESULTS (${labResultsData.length} records):
${JSON.stringify(labResultsData, null, 2)}

Please generate the structured AI Health Summary strictly following the clinical rules and JSON format. Remember to cite sourceEventIds for every entry.
`.trim();
}
