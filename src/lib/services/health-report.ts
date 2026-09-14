import { HealthReportConfig, PRESET_CONFIGURATIONS, ReportPreset } from '../../types/report';
import { generateHealthReportPdf, fetchReportData } from '../pdf/healthReportGenerator';
import { patientRepository, normalizePatientId } from '../db/repositories/index';

export interface GenerateReportResult {
  pdfBuffer: Buffer;
  fileName: string;
  contentType: string;
  patientName: string;
}

export class HealthReportService {
  /**
   * Generates a customized PDF health report using validated server-side medical data
   */
  public async generateReport(config: Partial<HealthReportConfig>): Promise<GenerateReportResult> {
    const rawPatientId = config.patientId || '';
    const patientId = normalizePatientId(rawPatientId);

    // Verify patient exists
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found.`);
    }

    const preset: ReportPreset = config.preset || 'complete';
    const presetDefaults = PRESET_CONFIGURATIONS[preset];

    // Merge sections with preset defaults
    const finalSections = {
      ...presetDefaults.sections,
      ...(config.sections || {}),
    };

    const finalConfig: HealthReportConfig = {
      patientId,
      preset,
      sections: finalSections,
      timelineRange: config.timelineRange || presetDefaults.timelineRange || 'all',
      customStartDate: config.customStartDate,
      customEndDate: config.customEndDate,
      reportTitle: config.reportTitle || `${patient.name} - Health Report`,
    };

    const pdfBuffer = await generateHealthReportPdf(finalConfig);

    // Sanitize patient name for filename
    const safeName = patient.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `HealthTimeline_${safeName}_Health_Report.pdf`;

    return {
      pdfBuffer,
      fileName,
      contentType: 'application/pdf',
      patientName: patient.name,
    };
  }

  /**
   * Quick preview summary of report data before generation
   */
  public async getReportPreviewData(patientId: string) {
    return fetchReportData(normalizePatientId(patientId));
  }
}

export const healthReportService = new HealthReportService();
