import {
  StructuredExtractionData,
  HealthSummaryStructuredData,
  PatientConfirmedRecordsContext,
  HealthHistoryQueryContext,
  HealthHistoryAnswer,
} from '../../types/medical';

export interface ExtractionInput {
  fileName: string;
  documentType?: string;
  mimeType?: string;
  textContent?: string;
  textSnippet?: string;
  base64Data?: string;
  fileSizeBytes?: number;
}

export interface AIProvider {
  /**
   * The identifier or name of the AI provider (e.g., 'Gemini 2.5 Flash', 'Mock Clinical Engine')
   */
  readonly name: string;

  /**
   * Extracts structured clinical entities from a medical document
   */
  extractMedicalInformation(input: ExtractionInput): Promise<StructuredExtractionData>;

  /**
   * Produces a concise, factual summary of a document
   */
  summarizeDocument(text: string): Promise<string>;

  /**
   * Analyzes confirmed patient records to generate an AI Health Summary (Step 6)
   */
  generateHealthSummary(context: PatientConfirmedRecordsContext): Promise<HealthSummaryStructuredData>;

  /**
   * Answers a natural language clinical question grounded in the patient's confirmed records (Step 7)
   */
  answerHealthHistoryQuestion(context: HealthHistoryQueryContext): Promise<HealthHistoryAnswer>;
}

