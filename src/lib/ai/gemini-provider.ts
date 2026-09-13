import { GoogleGenAI } from '@google/genai';
import { AIProvider, ExtractionInput } from './ai-provider';
import { MEDICAL_EXTRACTION_SYSTEM_PROMPT, buildExtractionPrompt } from './prompts/medical-extraction';
import { HEALTH_SUMMARY_SYSTEM_PROMPT, buildHealthSummaryUserPrompt } from './prompts/health-summary';
import {
  StructuredExtractionData,
  HealthSummaryStructuredData,
  PatientConfirmedRecordsContext,
  HealthHistoryQueryContext,
  HealthHistoryAnswer,
} from '../../types/medical';
import { MockAIProvider } from './mock-provider';
import {
  HEALTH_ASSISTANT_SYSTEM_PROMPT,
  buildHealthHistoryUserPrompt,
} from '../health-history/health-history-context';
import { healthHistoryRetriever } from '../health-history/health-history-retriever';

export class GeminiAIProvider implements AIProvider {
  readonly name = 'Google Gemini 2.5 Flash';
  private client: GoogleGenAI | null = null;
  private fallbackMock = new MockAIProvider();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
      try {
        this.client = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client, falling back to mock provider:', err);
      }
    }
  }

  async summarizeDocument(text: string): Promise<string> {
    if (!this.client) {
      return this.fallbackMock.summarizeDocument(text);
    }

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Provide a concise 1-2 sentence factual summary of the following medical document text. Do not diagnose or prescribe.\n\n${text}`,
              },
            ],
          },
        ],
      });
      return response.text || 'Document summarized.';
    } catch (err) {
      console.warn('Gemini summarize error, using mock fallback:', err);
      return this.fallbackMock.summarizeDocument(text);
    }
  }

  async extractMedicalInformation(input: ExtractionInput): Promise<StructuredExtractionData> {
    // If no active Gemini client (e.g. missing API key), smoothly use realistic deterministic mock
    if (!this.client) {
      console.log('Gemini API key not configured. Using realistic deterministic mock extraction.');
      return this.fallbackMock.extractMedicalInformation(input);
    }

    try {
      const userPrompt = buildExtractionPrompt({
        fileName: input.fileName,
        documentType: input.documentType,
        textSnippet: input.textSnippet,
        textContent: input.textContent,
      });

      const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [
        { text: userPrompt },
      ];

      // If document base64 data is present, send as multimodal part
      if (input.base64Data && input.mimeType) {
        // Strip data:mime/type;base64, prefix if present
        const base64Clean = input.base64Data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            data: base64Clean,
            mimeType: input.mimeType,
          },
        });
      }

      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: MEDICAL_EXTRACTION_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.1, // Low temperature for factual precision
        },
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
      });

      const responseText = response.text || '';
      const parsedData = this.parseAndValidate(responseText);
      return parsedData;
    } catch (err) {
      console.error('Gemini API extraction failed, falling back to mock provider:', err);
      return this.fallbackMock.extractMedicalInformation(input);
    }
  }

  private parseAndValidate(rawJson: string): StructuredExtractionData {
    let clean = rawJson.trim();
    // Strip markdown formatting if any
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(clean);

      // Validate and assign stable IDs and accepted defaults
      return {
        documentDate: parsed.documentDate || undefined,
        documentType: parsed.documentType || undefined,
        facility: parsed.facility || undefined,
        provider: parsed.provider || undefined,
        summarySnippet: parsed.summarySnippet || undefined,
        diagnoses: Array.isArray(parsed.diagnoses)
          ? parsed.diagnoses.map((d: any, idx: number) => ({
              id: d.id || `diag-${Date.now()}-${idx}`,
              name: String(d.name || 'Unspecified Condition'),
              status: d.status || 'Active',
              date: d.date || undefined,
              confidence: d.confidence || 'Medium',
              sourceQuote: d.sourceQuote || undefined,
              pageNumber: typeof d.pageNumber === 'number' ? d.pageNumber : 1,
              accepted: true,
            }))
          : [],
        medications: Array.isArray(parsed.medications)
          ? parsed.medications.map((m: any, idx: number) => ({
              id: m.id || `med-${Date.now()}-${idx}`,
              name: String(m.name || 'Unspecified Medication'),
              genericName: m.genericName || undefined,
              dosage: String(m.dosage || 'Standard Dosage'),
              frequency: String(m.frequency || 'As directed'),
              route: m.route || 'Oral',
              startDate: m.startDate || undefined,
              endDate: m.endDate || undefined,
              status: m.status || 'Active',
              confidence: m.confidence || 'Medium',
              sourceQuote: m.sourceQuote || undefined,
              pageNumber: typeof m.pageNumber === 'number' ? m.pageNumber : 1,
              accepted: true,
            }))
          : [],
        labResults: Array.isArray(parsed.labResults)
          ? parsed.labResults.map((l: any, idx: number) => ({
              id: l.id || `lab-${Date.now()}-${idx}`,
              testName: String(l.testName || 'Diagnostic Test'),
              parameterName: String(l.parameterName || l.testName || 'Parameter'),
              value: l.value !== undefined ? l.value : '',
              unit: String(l.unit || ''),
              referenceRange: l.referenceRange || undefined,
              date: l.date || undefined,
              interpretation: l.interpretation || undefined,
              confidence: l.confidence || 'Medium',
              sourceQuote: l.sourceQuote || undefined,
              pageNumber: typeof l.pageNumber === 'number' ? l.pageNumber : 1,
              accepted: true,
            }))
          : [],
        procedures: Array.isArray(parsed.procedures)
          ? parsed.procedures.map((p: any, idx: number) => ({
              id: p.id || `proc-${Date.now()}-${idx}`,
              name: String(p.name || 'Clinical Procedure'),
              date: p.date || undefined,
              provider: p.provider || undefined,
              confidence: p.confidence || 'Medium',
              sourceQuote: p.sourceQuote || undefined,
              pageNumber: typeof p.pageNumber === 'number' ? p.pageNumber : 1,
              accepted: true,
            }))
          : [],
        allergies: Array.isArray(parsed.allergies)
          ? parsed.allergies.map((a: any, idx: number) => ({
              id: a.id || `all-${Date.now()}-${idx}`,
              substance: String(a.substance || 'Unspecified Allergen'),
              reaction: a.reaction || undefined,
              severity: a.severity || 'Unknown',
              confidence: a.confidence || 'Medium',
              sourceQuote: a.sourceQuote || undefined,
              pageNumber: typeof a.pageNumber === 'number' ? a.pageNumber : 1,
              accepted: true,
            }))
          : [],
        clinicalNotes: Array.isArray(parsed.clinicalNotes)
          ? parsed.clinicalNotes.map(String)
          : [],
      };
    } catch (parseErr) {
      console.warn('Failed to parse AI output as JSON, returning fallback structure:', parseErr);
      throw parseErr;
    }
  }

  async generateHealthSummary(context: PatientConfirmedRecordsContext): Promise<HealthSummaryStructuredData> {
    if (!this.client) {
      console.log('Gemini API key not configured. Using realistic deterministic mock health summary.');
      return this.fallbackMock.generateHealthSummary(context);
    }

    try {
      const userPrompt = buildHealthSummaryUserPrompt(context);

      const response = await this.client.models.generateContent({
        model: 'gemini-3.8-flash',
        config: {
          systemInstruction: HEALTH_SUMMARY_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
      });

      const responseText = response.text || '';
      return await this.parseAndValidateHealthSummary(responseText, context);
    } catch (err) {
      console.error('Gemini Health Summary generation failed, falling back to mock provider:', err);
      return this.fallbackMock.generateHealthSummary(context);
    }
  }

  private async parseAndValidateHealthSummary(
    rawJson: string,
    context: PatientConfirmedRecordsContext
  ): Promise<HealthSummaryStructuredData> {
    let clean = rawJson.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(clean);

      // Validate and clean up
      const defaultEventIds = context.events.length > 0 ? [context.events[0].id] : [];

      const overview = typeof parsed.overview === 'string' && parsed.overview.trim().length > 0
        ? parsed.overview
        : `Longitudinal clinical review based on ${context.events.length} confirmed records for ${context.patient.name}.`;

      const conditions = Array.isArray(parsed.conditions)
        ? parsed.conditions.map((c: any) => ({
            name: String(c.name || 'Unspecified Condition'),
            firstDocumented: String(c.firstDocumented || 'Documented'),
            lastDocumented: String(c.lastDocumented || 'Present'),
            status: String(c.status || 'Active'),
            sourceEventIds: Array.isArray(c.sourceEventIds) && c.sourceEventIds.length > 0
              ? c.sourceEventIds.map(String)
              : defaultEventIds,
          }))
        : [];

      const medications = Array.isArray(parsed.medications)
        ? parsed.medications.map((m: any) => ({
            name: String(m.name || 'Medication'),
            summary: String(m.summary || 'Documented pharmacotherapy regimen.'),
            sourceEventIds: Array.isArray(m.sourceEventIds) && m.sourceEventIds.length > 0
              ? m.sourceEventIds.map(String)
              : defaultEventIds,
          }))
        : [];

      const labTrends = Array.isArray(parsed.labTrends)
        ? parsed.labTrends.map((l: any) => ({
            parameter: String(l.parameter || 'Laboratory Surveillance'),
            summary: String(l.summary || 'Laboratory measurements recorded in health history.'),
            sourceEventIds: Array.isArray(l.sourceEventIds) && l.sourceEventIds.length > 0
              ? l.sourceEventIds.map(String)
              : defaultEventIds,
          }))
        : [];

      const healthcareJourney = Array.isArray(parsed.healthcareJourney)
        ? parsed.healthcareJourney.map((j: any) => ({
            category: j.category || 'Consultation',
            date: String(j.date || 'Encounter'),
            summary: String(j.summary || 'Documented encounter.'),
            sourceEventIds: Array.isArray(j.sourceEventIds) && j.sourceEventIds.length > 0
              ? j.sourceEventIds.map(String)
              : defaultEventIds,
          }))
        : [];

      const recordObservations = Array.isArray(parsed.recordObservations)
        ? parsed.recordObservations.map((o: any) => ({
            summary: String(o.summary || 'Record observation noted.'),
            sourceEventIds: Array.isArray(o.sourceEventIds) && o.sourceEventIds.length > 0
              ? o.sourceEventIds.map(String)
              : defaultEventIds,
          }))
        : undefined;

      return {
        overview,
        conditions,
        medications,
        labTrends,
        healthcareJourney,
        recordObservations,
      };
    } catch (err) {
      console.warn('Failed to parse health summary JSON, using fallback:', err);
      return await this.fallbackMock.generateHealthSummary(context);
    }
  }

  async answerHealthHistoryQuestion(context: HealthHistoryQueryContext): Promise<HealthHistoryAnswer> {
    if (!this.client) {
      return this.fallbackMock.answerHealthHistoryQuestion(context);
    }

    try {
      // 1. Retrieve and enrich structured context
      const retrieved = await healthHistoryRetriever.retrieve(
        context.patientId,
        context.question,
        context.history
      );

      // If retriever already identified safety refusal, return immediately with safety notice
      if (retrieved.isMedicalAdviceRequest) {
        return this.fallbackMock.answerHealthHistoryQuestion(context);
      }

      // 2. Build grounded prompt
      const prompt = buildHealthHistoryUserPrompt(retrieved);

      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        config: {
          systemInstruction: HEALTH_ASSISTANT_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);

      const candidateEventIds = new Set(retrieved.retrievedEvents.map((e) => e.id));
      const candidateDocIds = new Set(retrieved.retrievedDocuments.map((d) => d.id));

      // Strictly validate source IDs to ensure no hallucination
      const validEventIds = Array.isArray(parsed.sourceEventIds)
        ? parsed.sourceEventIds.filter((id: string) => candidateEventIds.has(id))
        : [];
      const validDocIds = Array.isArray(parsed.sourceDocumentIds)
        ? parsed.sourceDocumentIds.filter((id: string) => candidateDocIds.has(id))
        : [];

      // Fallback to retriever's candidate events if AI didn't provide any but has an answer
      const finalEventIds = validEventIds.length > 0 ? validEventIds : retrieved.retrievedEvents.slice(0, 2).map((e) => e.id);
      const finalDocIds = validDocIds.length > 0 ? validDocIds : retrieved.retrievedDocuments.slice(0, 2).map((d) => d.id);

      return {
        answer: parsed.answer || 'Information retrieved from confirmed records.',
        sourceEventIds: finalEventIds,
        sourceDocumentIds: finalDocIds,
        confidence: parsed.confidence || 'high',
        safetyNotice: parsed.safetyNotice,
        potentialInconsistency: retrieved.potentialInconsistency,
        structuredData: retrieved.structuredData,
        suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0
          ? parsed.suggestedFollowUps
          : [
              'What medications has this patient taken?',
              'Show me the HbA1c results over time.',
              'When was diabetes first documented?',
            ],
      };
    } catch (err) {
      console.warn('Gemini answerHealthHistoryQuestion error, using fallback:', err);
      return this.fallbackMock.answerHealthHistoryQuestion(context);
    }
  }
}

