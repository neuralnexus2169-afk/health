import {
  StoredHealthSummary,
  HealthSummaryStructuredData,
  MedicalEvent,
  LabResult,
} from '../types/medical';
import { healthSummaryRepository, timelineRepository, labResultRepository } from '../lib/db/repositories';

export interface HealthSummaryApiResponse {
  success: boolean;
  hasSummary?: boolean;
  summary: StoredHealthSummary | null;
  confirmedRecordCount: number;
  isOutdated: boolean;
  error?: string;
  details?: string;
}

export interface ResolvedSourceEvent {
  id: string;
  title: string;
  eventDate: string;
  eventType: string;
  facilityName?: string;
  providerName?: string;
  documentFileName?: string;
  documentId?: string;
  description: string;
}

/**
 * Fetches the health summary from the server, with fallback to local repository.
 */
export async function getHealthSummary(
  patientId: string,
  forceRefresh: boolean = false
): Promise<HealthSummaryApiResponse> {
  try {
    const url = `/api/patients/${patientId}/health-summary`;
    const response = forceRefresh
      ? await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forceRefresh: true }),
        })
      : await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('API /api/patients/:id/health-summary failed, falling back to local repository:', err);
  }

  // Fallback to local repository
  const confirmedEvents = await timelineRepository.findByPatientId(patientId);
  const currentCount = confirmedEvents.length;
  const sorted = [...confirmedEvents].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );
  const latestEventDate = sorted[0]?.eventDate;

  const existing = await healthSummaryRepository.getLatestByPatientId(patientId);

  if (!existing) {
    return {
      success: true,
      hasSummary: false,
      summary: null,
      confirmedRecordCount: currentCount,
      isOutdated: false,
    };
  }

  const isOutdated =
    existing.confirmedRecordCount !== currentCount ||
    (existing.lastRecordDate && latestEventDate && existing.lastRecordDate !== latestEventDate);

  return {
    success: true,
    hasSummary: true,
    summary: {
      ...existing,
      isOutdated: Boolean(isOutdated),
    },
    confirmedRecordCount: currentCount,
    isOutdated: Boolean(isOutdated),
  };
}

/**
 * Triggers re-generation of the health summary on the server.
 */
export async function regenerateHealthSummary(
  patientId: string
): Promise<HealthSummaryApiResponse> {
  return getHealthSummary(patientId, true);
}

/**
 * Resolves an array of sourceEventIds into human-readable event objects.
 */
export function resolveSourceEvents(
  sourceEventIds: string[],
  allEvents: MedicalEvent[]
): ResolvedSourceEvent[] {
  if (!sourceEventIds || sourceEventIds.length === 0) return [];

  const idMap = new Map<string, MedicalEvent>();
  allEvents.forEach((evt) => idMap.set(evt.id, evt));

  const resolved: ResolvedSourceEvent[] = [];
  sourceEventIds.forEach((id) => {
    const found = idMap.get(id);
    if (found) {
      resolved.push({
        id: found.id,
        title: found.title,
        eventDate: found.eventDate,
        eventType: found.eventType,
        facilityName: found.facilityName,
        providerName: found.providerName,
        documentFileName: found.documentFileName,
        documentId: found.documentId,
        description: found.description,
      });
    }
  });

  return resolved;
}

export interface LabTrendPoint {
  date: string;
  year: number;
  value: number;
  unit: string;
  testName: string;
  referenceRange?: string;
  interpretation?: string;
  eventId?: string;
}

/**
 * Extracts and sorts real longitudinal laboratory values from confirmed records.
 */
export async function getLabTrendSeries(
  patientId: string,
  parameterQuery: string = 'HbA1c'
): Promise<LabTrendPoint[]> {
  const allLabs = await labResultRepository.findByPatientId(patientId);
  const q = parameterQuery.toLowerCase();

  const filtered = allLabs.filter((lab) => {
    const nameMatch = (lab.testName || '').toLowerCase().includes(q);
    const paramMatch = (lab.parameterName || '').toLowerCase().includes(q);
    return nameMatch || paramMatch;
  });

  const points: LabTrendPoint[] = filtered
    .filter((l) => typeof l.value === 'number' && !isNaN(l.value) && l.testDate)
    .map((l) => ({
      date: l.testDate!,
      year: new Date(l.testDate!).getFullYear(),
      value: l.value,
      unit: l.unit,
      testName: l.testName,
      referenceRange: l.referenceRange,
      interpretation: l.interpretation,
      eventId: l.eventId,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return points;
}
