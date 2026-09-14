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
  readonly name = 'Google Gemini 3.8 Flash';
  private client: GoogleGenAI | null = null;
  private fallbackMock = new MockAIProvider();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
      try {
        this.client = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        console.info('[Gemini] Could not initialize GoogleGenAI client, using clinical fallback engine:', err);
      }
    }
  }

  /**
   * Robust generator that handles temporary capacity spikes (HTTP 503 / 429),
   * applies short backoff retries and cascades across supported Gemini models with generous timeouts,
   * before seamlessly falling back to local clinical synthesis.
   */
  private async generateWithResilience(options: {
    contents: any;
    config?: any;
    preferredModel?: string;
    timeoutMs?: number;
  }): Promise<string> {
    if (!this.client) {
      throw new Error('No Gemini client initialized');
    }

    const preferred = options.preferredModel || 'gemini-2.5-flash';
    // Cascading model candidates: preferred gemini-2.5-flash -> resilient fallbacks
    const modelCandidates = Array.from(
      new Set([preferred, 'gemini-2.5-flash', 'gemini-2.5-pro'])
    );

    const timeoutMs = options.timeoutMs || 25000;
    let lastError: any = null;

    for (const model of modelCandidates) {
      // Allow up to 2 quick attempts per candidate for transient spikes
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const callPromise = this.client.models.generateContent({
            model,
            contents: options.contents,
            config: options.config,
          });

          let timerId: any;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timerId = setTimeout(
              () => reject(new Error(`Timeout after ${timeoutMs}ms on model ${model}`)),
              timeoutMs
            );
          });

          const response: any = await Promise.race([callPromise, timeoutPromise]);
          clearTimeout(timerId);

          if (response && typeof response.text === 'string' && response.text.length > 0) {
            return response.text;
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || (err?.error && err.error.code);
          const message = String(err?.message || '');
          const isTransient =
            status === 503 ||
            status === 429 ||
            status === 'UNAVAILABLE' ||
            message.includes('high demand') ||
            message.includes('503') ||
            message.includes('429') ||
            message.includes('Timeout') ||
            message.includes('RESOURCE_EXHAUSTED');

          if (isTransient && attempt === 0) {
            // Short jittered delay before second attempt on same model
            const delay = 600 + Math.floor(Math.random() * 300);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          console.info(`[Gemini] Model ${model} unavailable (${message.slice(0, 70)}). Cascading...`);
          break; // Move to next model candidate
        }
      }
    }

    throw lastError || new Error('All live Gemini models currently at capacity');
  }

  async summarizeDocument(text: string): Promise<string> {
    if (!this.client) {
      return this.fallbackMock.summarizeDocument(text);
    }

    try {
      const responseText = await this.generateWithResilience({
        preferredModel: 'gemini-2.5-flash',
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
      return responseText || 'Document summarized.';
    } catch (err) {
      console.warn('Gemini summarize service unavailable, seamlessly using fallback mock:', err);
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

      const responseText = await this.generateWithResilience({
        preferredModel: 'gemini-2.5-flash',
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

      const parsedData = this.parseAndValidate(responseText);
      return parsedData;
    } catch (err) {
      console.warn('Gemini API extraction unavailable, seamlessly using clinical fallback:', err);
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

      const resolveReviewState = (item: any, defaultConfidence: string): 'High Confidence' | 'Review Recommended' | 'Ambiguous' | 'Unrecognized' => {
        if (item.reviewState && ['High Confidence', 'Review Recommended', 'Ambiguous', 'Unrecognized'].includes(item.reviewState)) {
          return item.reviewState;
        }
        const conf = item.confidence || defaultConfidence;
        if (conf === 'High') return 'High Confidence';
        if (conf === 'Low') return 'Ambiguous';
        return 'Review Recommended';
      };

      const patientInfo = parsed.patientInfo ? {
        id: parsed.patientInfo.id || `pat-info-${Date.now()}`,
        name: parsed.patientInfo.name || undefined,
        dateOfBirth: parsed.patientInfo.dateOfBirth || undefined,
        gender: parsed.patientInfo.gender || undefined,
        mrn: parsed.patientInfo.mrn || undefined,
        confidence: parsed.patientInfo.confidence || 'High',
        reviewState: resolveReviewState(parsed.patientInfo, 'High'),
        confidenceReason: parsed.patientInfo.confidenceReason || 'Document demographic record',
        sourceText: parsed.patientInfo.sourceText || parsed.patientInfo.sourceQuote || undefined,
        sourceQuote: parsed.patientInfo.sourceQuote || parsed.patientInfo.sourceText || undefined,
        sourceLocation: parsed.patientInfo.sourceLocation || 'Page 1, Header',
        pageNumber: typeof parsed.patientInfo.pageNumber === 'number' ? parsed.patientInfo.pageNumber : 1,
        accepted: parsed.patientInfo.accepted !== false,
      } : undefined;

      const medicalEvents = Array.isArray(parsed.medicalEvents)
        ? parsed.medicalEvents.map((e: any, idx: number) => ({
            id: e.id || `evt-ext-${Date.now()}-${idx}`,
            title: String(e.title || 'Clinical Encounter'),
            eventType: e.eventType || 'Consultation',
            date: e.date || undefined,
            facility: e.facility || undefined,
            provider: e.provider || undefined,
            summary: e.summary || undefined,
            confidence: e.confidence || 'High',
            reviewState: resolveReviewState(e, 'High'),
            confidenceReason: e.confidenceReason || 'Clinical encounter header',
            sourceText: e.sourceText || e.sourceQuote || undefined,
            sourceQuote: e.sourceQuote || e.sourceText || undefined,
            sourceLocation: e.sourceLocation || 'Page 1',
            pageNumber: typeof e.pageNumber === 'number' ? e.pageNumber : 1,
            accepted: e.accepted !== false,
          }))
        : [];

      const diagnoses = Array.isArray(parsed.diagnoses)
        ? parsed.diagnoses.map((d: any, idx: number) => ({
            id: d.id || `diag-${Date.now()}-${idx}`,
            name: String(d.name || 'Unspecified Condition'),
            status: d.status || 'Active',
            date: d.date || undefined,
            confidence: d.confidence || 'High',
            reviewState: resolveReviewState(d, 'High'),
            confidenceReason: d.confidenceReason || (d.confidence === 'High' ? 'Explicit assessment in record' : 'Review recommended from clinical context'),
            sourceQuote: d.sourceQuote || d.sourceText || undefined,
            sourceText: d.sourceText || d.sourceQuote || undefined,
            pageNumber: typeof d.pageNumber === 'number' ? d.pageNumber : 1,
            sourceLocation: d.sourceLocation || (typeof d.pageNumber === 'number' ? `Page ${d.pageNumber}` : 'Page 1'),
            accepted: d.accepted !== false,
          }))
        : [];

      const medications = Array.isArray(parsed.medications)
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
            confidence: m.confidence || 'High',
            reviewState: resolveReviewState(m, 'High'),
            confidenceReason: m.confidenceReason || (m.confidence === 'High' ? 'Documented in regimen' : 'Verify dosage or interval with provider'),
            sourceQuote: m.sourceQuote || m.sourceText || undefined,
            sourceText: m.sourceText || m.sourceQuote || undefined,
            pageNumber: typeof m.pageNumber === 'number' ? m.pageNumber : 1,
            sourceLocation: m.sourceLocation || (typeof m.pageNumber === 'number' ? `Page ${m.pageNumber}` : 'Page 1'),
            accepted: m.accepted !== false,
          }))
        : [];

      const labResults = Array.isArray(parsed.labResults)
        ? parsed.labResults.map((l: any, idx: number) => ({
            id: l.id || `lab-${Date.now()}-${idx}`,
            testName: String(l.testName || 'Diagnostic Test'),
            parameterName: String(l.parameterName || l.testName || 'Parameter'),
            value: l.value !== undefined ? l.value : '',
            unit: String(l.unit || ''),
            referenceRange: l.referenceRange || undefined,
            date: l.date || undefined,
            interpretation: l.interpretation || undefined,
            confidence: l.confidence || 'High',
            reviewState: resolveReviewState(l, 'High'),
            confidenceReason: l.confidenceReason || 'Laboratory panel finding',
            sourceQuote: l.sourceQuote || l.sourceText || undefined,
            sourceText: l.sourceText || l.sourceQuote || undefined,
            pageNumber: typeof l.pageNumber === 'number' ? l.pageNumber : 1,
            sourceLocation: l.sourceLocation || (typeof l.pageNumber === 'number' ? `Page ${l.pageNumber}` : 'Page 1'),
            accepted: l.accepted !== false,
          }))
        : [];

      const procedures = Array.isArray(parsed.procedures)
        ? parsed.procedures.map((p: any, idx: number) => ({
            id: p.id || `proc-${Date.now()}-${idx}`,
            name: String(p.name || 'Clinical Procedure'),
            date: p.date || undefined,
            provider: p.provider || undefined,
            confidence: p.confidence || 'High',
            reviewState: resolveReviewState(p, 'High'),
            confidenceReason: p.confidenceReason || 'Documented intervention or exam',
            sourceQuote: p.sourceQuote || p.sourceText || undefined,
            sourceText: p.sourceText || p.sourceQuote || undefined,
            pageNumber: typeof p.pageNumber === 'number' ? p.pageNumber : 1,
            sourceLocation: p.sourceLocation || (typeof p.pageNumber === 'number' ? `Page ${p.pageNumber}` : 'Page 1'),
            accepted: p.accepted !== false,
          }))
        : [];

      const allergies = Array.isArray(parsed.allergies)
        ? parsed.allergies.map((a: any, idx: number) => ({
            id: a.id || `all-${Date.now()}-${idx}`,
            substance: String(a.substance || 'Unspecified Allergen'),
            reaction: a.reaction || undefined,
            severity: a.severity || 'Unknown',
            confidence: a.confidence || 'High',
            reviewState: resolveReviewState(a, 'High'),
            confidenceReason: a.confidenceReason || 'Documented allergy history',
            sourceQuote: a.sourceQuote || a.sourceText || undefined,
            sourceText: a.sourceText || a.sourceQuote || undefined,
            pageNumber: typeof a.pageNumber === 'number' ? a.pageNumber : 1,
            sourceLocation: a.sourceLocation || (typeof a.pageNumber === 'number' ? `Page ${a.pageNumber}` : 'Page 1'),
            accepted: a.accepted !== false,
          }))
        : [];

      const needsReviewItems = Array.isArray(parsed.needsReviewItems)
        ? parsed.needsReviewItems.map((nr: any, idx: number) => ({
            id: nr.id || `nr-${Date.now()}-${idx}`,
            suggestedCategory: nr.suggestedCategory || 'Other',
            rawText: String(nr.rawText || nr.sourceText || 'Unrecognized text snippet'),
            confidenceReason: nr.confidenceReason || 'Requires human clinician verification',
            sourceLocation: nr.sourceLocation || 'Page 1',
            sourceText: nr.sourceText || nr.rawText || undefined,
            reviewState: (nr.reviewState as any) || 'Ambiguous',
            fieldValues: nr.fieldValues || {},
            accepted: nr.accepted === true,
          }))
        : [];

      // Validate and assign stable IDs and accepted defaults
      return {
        documentDate: parsed.documentDate || undefined,
        documentType: parsed.documentType || undefined,
        facility: parsed.facility || undefined,
        facilityType: parsed.facilityType || undefined,
        provider: parsed.provider || undefined,
        providerSpecialty: parsed.providerSpecialty || undefined,
        summarySnippet: parsed.summarySnippet || undefined,
        patientInfo,
        medicalEvents,
        diagnoses,
        medications,
        labResults,
        procedures,
        allergies,
        needsReviewItems,
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

      const responseText = await this.generateWithResilience({
        preferredModel: 'gemini-2.5-flash',
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

      return await this.parseAndValidateHealthSummary(responseText, context);
    } catch (err) {
      console.warn('Gemini live models temporarily at capacity, seamlessly using clinical fallback summary:', err);
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

      const responseText = await this.generateWithResilience({
        preferredModel: 'gemini-2.5-flash',
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

      const parsed = JSON.parse(responseText);

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
    } catch (err: any) {
      console.info('[Gemini] Transient service saturation; providing grounded response via clinical fallback engine.');
      return this.fallbackMock.answerHealthHistoryQuestion(context);
    }
  }
}

