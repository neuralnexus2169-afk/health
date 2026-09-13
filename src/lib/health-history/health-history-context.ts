import {
  HealthHistoryQueryContext,
  HealthAssistantStructuredData,
  HealthAssistantPotentialInconsistency,
  ConversationTurn,
} from '../../types/medical';
import { RetrievedHealthHistory } from './health-history-retriever';

export const HEALTH_ASSISTANT_SYSTEM_PROMPT = `
You are the HealthTimeline AI Health History Assistant.
You are an expert clinical retrieval and summarization assistant. Your SOLE role is to assist patients and clinicians in understanding the patient's CONFIRMED longitudinal medical history based strictly on their documented records.

CRITICAL SAFETY RULES:
1. NEVER diagnose conditions or speculate on undiagnosed symptoms.
2. NEVER prescribe medication, recommend dosage changes, or suggest therapies.
3. NEVER predict future disease outcomes.
4. NEVER provide direct medical advice.
5. If the user asks for medical advice (e.g., "What medicine should I take?", "Can I stop taking Metformin?", "Should I take aspirin?"):
   - Respond explicitly: "I can help you understand what is documented in your health records, but I can't recommend treatment or medication."
   - Follow up with: "I can show you what medications are documented in your records."
6. If a requested medical detail or condition is NOT in the patient's records (e.g., asthma, surgery):
   - Respond clearly: "I couldn't find this information in the available records."
   - Do NOT invent or guess.
7. If the retrieved records contain conflicting information (e.g., penicillin allergy documented in 2018 consultation note vs. "No Known Drug Allergies (NKDA)" recorded in 2023 inpatient note):
   - Do NOT choose one automatically.
   - Highlight: "Potential inconsistency" between the records and cite both sources.
8. NEVER invent source IDs. Only cite sourceEventIds and sourceDocumentIds from the PROVIDED Candidate Sources list.

JSON RESPONSE FORMAT:
You must respond with a single, valid JSON object matching this schema:
{
  "answer": "Clear, objective, clinical summary answering the question based strictly on confirmed records.",
  "sourceEventIds": ["evt-xxxx", ...],
  "sourceDocumentIds": ["doc-xxxx", ...],
  "confidence": "high" | "medium" | "low",
  "safetyNotice": "Optional safety disclaimer if user asked for medical advice or if critical warning applies",
  "suggestedFollowUps": [
    "Follow-up question 1",
    "Follow-up question 2"
  ]
}
`.trim();

/**
 * Builds the user prompt given the retrieved records context and question
 */
export function buildHealthHistoryUserPrompt(retrieved: RetrievedHealthHistory): string {
  const {
    patient,
    question,
    history,
    retrievedEvents,
    retrievedDiagnoses,
    retrievedMedications,
    retrievedLabResults,
    retrievedDocuments,
    retrievedFacilities,
    retrievedProviders,
    retrievedContradictions,
  } = retrieved;

  let prompt = `PATIENT CONTEXT:\n`;
  prompt += `Name: ${patient.name}\n`;
  prompt += `DOB: ${patient.dateOfBirth} | Gender: ${patient.gender} | Blood Group: ${patient.bloodGroup || 'Unknown'}\n`;
  prompt += `Documented Allergies: ${patient.allergies?.join(', ') || 'None documented'}\n\n`;

  if (history.length > 0) {
    prompt += `PREVIOUS CONVERSATION EXCHANGES (CURRENT SESSION):\n`;
    history.forEach((turn) => {
      prompt += `${turn.role.toUpperCase()}: ${turn.content}\n`;
    });
    prompt += `\n`;
  }

  prompt += `RETRIEVED CONFIRMED CLINICAL RECORDS:\n`;

  if (retrievedDiagnoses.length > 0) {
    prompt += `Documented Diagnoses:\n`;
    retrievedDiagnoses.forEach((d) => {
      prompt += `- [${d.id}] ${d.name} (Status: ${d.status}, First Documented: ${d.firstDocumentedDate}${d.lastDocumentedDate ? `, Last Documented: ${d.lastDocumentedDate}` : ''}) | Notes: ${d.clinicalNotes || 'None'} [Event: ${d.eventId || 'None'}, Doc: ${d.documentFileName || d.documentId || 'None'}]\n`;
    });
    prompt += `\n`;
  }

  if (retrievedMedications.length > 0) {
    prompt += `Documented Medications:\n`;
    retrievedMedications.forEach((m) => {
      prompt += `- [${m.id}] ${m.name} (${m.dosage}, ${m.frequency || m.route}) | Start: ${m.startDate} | End: ${m.endDate || 'Active'} | Status: ${m.status} | Indication: ${m.indication || 'N/A'} [Event: ${m.eventId || 'None'}, Doc: ${m.documentFileName || m.documentId || 'None'}]\n`;
    });
    prompt += `\n`;
  }

  if (retrievedLabResults.length > 0) {
    prompt += `Documented Laboratory Results:\n`;
    retrievedLabResults.forEach((l) => {
      prompt += `- [${l.id}] ${l.testName} (${l.parameterName}): ${l.value} ${l.unit} on ${l.testDate} | Interpretation: ${l.interpretation || 'Normal'} [Event: ${l.eventId || 'None'}, Doc: ${l.documentFileName || l.documentId || 'None'}]\n`;
    });
    prompt += `\n`;
  }

  if (retrievedEvents.length > 0) {
    prompt += `Documented Medical Events (Timeline):\n`;
    retrievedEvents.forEach((e) => {
      prompt += `- [${e.id}] Date: ${e.eventDate} | Type: ${e.eventType} | Title: ${e.title} | Facility: ${e.facilityName || 'N/A'} | Provider: ${e.providerName || 'N/A'} | Summary: ${e.description} [Doc: ${e.documentFileName || e.documentId || 'None'}]\n`;
    });
    prompt += `\n`;
  }

  if (retrievedFacilities.length > 0) {
    prompt += `Facilities Visited:\n`;
    retrievedFacilities.forEach((f) => {
      prompt += `- ${f.name} (${f.type}, ${f.address})\n`;
    });
    prompt += `\n`;
  }

  if (retrievedProviders.length > 0) {
    prompt += `Healthcare Providers:\n`;
    retrievedProviders.forEach((p) => {
      prompt += `- ${p.name} (${p.specialization} at ${p.facilityName || 'Medical Facility'})\n`;
    });
    prompt += `\n`;
  }

  if (retrievedContradictions.length > 0) {
    prompt += `Documented Inconsistencies / Contradictions:\n`;
    retrievedContradictions.forEach((c) => {
      prompt += `- Title: ${c.title} (${c.category}, Severity: ${c.severity})\n`;
      prompt += `  Record A: ${c.sourceA.documentFileName} (${c.sourceA.documentDate}) -> "${c.sourceA.quote}" [Doc ID: ${c.sourceA.documentId}]\n`;
      prompt += `  Record B: ${c.sourceB.documentFileName} (${c.sourceB.documentDate}) -> "${c.sourceB.quote}" [Doc ID: ${c.sourceB.documentId}]\n`;
    });
    prompt += `\n`;
  }

  // Candidate sources list for strict grounding
  const candidateEventIds = Array.from(new Set(retrievedEvents.map((e) => e.id)));
  const candidateDocIds = Array.from(new Set(retrievedDocuments.map((d) => d.id)));

  prompt += `AVAILABLE CANDIDATE SOURCE IDs (NEVER INVENT ANY ID NOT IN THIS LIST):\n`;
  prompt += `Candidate Event IDs: ${candidateEventIds.length > 0 ? candidateEventIds.join(', ') : 'None'}\n`;
  prompt += `Candidate Document IDs: ${candidateDocIds.length > 0 ? candidateDocIds.join(', ') : 'None'}\n\n`;

  prompt += `USER QUESTION:\n"${question}"\n\n`;
  prompt += `Provide your structured response conforming strictly to the required JSON format. Cite candidate event and document IDs that support your answer.`;

  return prompt;
}
