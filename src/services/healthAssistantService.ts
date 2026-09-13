import {
  HealthHistoryAnswer,
  ConversationTurn,
  MedicalEvent,
  MedicalDocument,
} from '../types/medical';
import { timelineRepository, documentRepository } from '../lib/db/repositories';
import { healthHistoryRetriever } from '../lib/health-history/health-history-retriever';
import { MockAIProvider } from '../lib/ai/mock-provider';

const mockFallbackProvider = new MockAIProvider();

export interface ResolvedAssistantSource {
  event?: MedicalEvent;
  document?: MedicalDocument;
}

/**
 * Sends a natural language clinical question to the backend AI Assistant endpoint,
 * with graceful fallback to local retrieval and clinical mock provider.
 */
export async function askHealthHistoryAssistant(
  patientId: string,
  question: string,
  history: ConversationTurn[] = []
): Promise<HealthHistoryAnswer> {
  try {
    const response = await fetch(`/api/patients/${patientId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        history,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.answer) {
        return data.answer;
      }
    }
  } catch (err) {
    console.warn('POST /api/patients/:id/chat error, using client fallback:', err);
  }

  // Standalone client fallback using retriever + mock engine
  try {
    const retrieved = await healthHistoryRetriever.retrieve(patientId, question, history);
    const answer = await mockFallbackProvider.answerHealthHistoryQuestion({
      patientId,
      question,
      history,
      retrievedRecords: {
        events: retrieved.retrievedEvents,
        diagnoses: retrieved.retrievedDiagnoses,
        medications: retrieved.retrievedMedications,
        labResults: retrieved.retrievedLabResults,
        documents: retrieved.retrievedDocuments,
        facilities: retrieved.retrievedFacilities,
        providers: retrieved.retrievedProviders,
        contradictions: retrieved.retrievedContradictions,
      },
    });
    return answer;
  } catch (fallbackErr) {
    console.error('Fallback answering error:', fallbackErr);
    return {
      answer: 'Unable to retrieve records for this query at this time. Please try again.',
      sourceEventIds: [],
      sourceDocumentIds: [],
      confidence: 'low',
      suggestedFollowUps: [
        'When was diabetes first documented?',
        'What medications has this patient taken?',
      ],
    };
  }
}

/**
 * Resolves event IDs and document IDs into actual database records for modal viewing.
 */
export async function resolveSourcesForModal(
  eventIds: string[] = [],
  documentIds: string[] = []
): Promise<{ events: MedicalEvent[]; documents: MedicalDocument[] }> {
  const eventPromises = eventIds.map((id) => timelineRepository.findById(id));
  const docPromises = documentIds.map((id) => documentRepository.findById(id));

  const [resolvedEventsRaw, resolvedDocsRaw] = await Promise.all([
    Promise.all(eventPromises),
    Promise.all(docPromises),
  ]);

  const events: MedicalEvent[] = resolvedEventsRaw.filter(
    (e): e is MedicalEvent => e !== null && e !== undefined
  );
  const documents: MedicalDocument[] = resolvedDocsRaw.filter(
    (d): d is MedicalDocument => d !== null && d !== undefined
  );

  // Also include documents linked by the resolved events if not already present
  for (const evt of events) {
    if (evt.documentId && !documents.some((d) => d.id === evt.documentId)) {
      const linkedDoc = await documentRepository.findById(evt.documentId);
      if (linkedDoc) {
        documents.push(linkedDoc);
      }
    }
  }

  return {
    events,
    documents,
  };
}
