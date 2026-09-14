import { HealthReportConfig, ReportPreset, ReportSections, TimelineRangeOption } from '../types/report';

export interface GeneratedReportResponse {
  blob: Blob;
  blobUrl: string;
  fileName: string;
  sizeBytes: number;
}

export interface ReportPreviewMetadata {
  patient: any;
  eventCount: number;
  diagnosisCount: number;
  medicationCount: number;
  labCount: number;
  documentCount: number;
  contradictionCount: number;
}

/**
 * Calls POST /api/reports/health to generate and download a customized PDF report
 */
export async function generatePdfReport(config: HealthReportConfig): Promise<GeneratedReportResponse> {
  const response = await fetch('/api/reports/health', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    let errorMessage = 'Unable to generate the report. Please try again.';
    try {
      const errJson = await response.json();
      if (errJson?.details) {
        errorMessage = `${errJson.error} (${errJson.details})`;
      } else if (errJson?.error) {
        errorMessage = errJson.error;
      }
    } catch {
      // fallback
    }
    throw new Error(errorMessage);
  }

  const contentDisposition = response.headers.get('Content-Disposition') || '';
  const customHeader = response.headers.get('X-Report-Filename') || '';
  let fileName = customHeader;

  if (!fileName && contentDisposition) {
    const match = contentDisposition.match(/filename="?([^";]+)"?/);
    if (match?.[1]) {
      fileName = match[1];
    }
  }

  if (!fileName) {
    fileName = 'HealthTimeline_Patient_Health_Report.pdf';
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  return {
    blob,
    blobUrl,
    fileName,
    sizeBytes: blob.size,
  };
}

/**
 * Fetches lightweight preview counts for the patient
 */
export async function getReportPreviewMetadata(patientId: string): Promise<ReportPreviewMetadata> {
  const response = await fetch(`/api/reports/preview/${encodeURIComponent(patientId)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch preview metadata');
  }
  return response.json();
}
