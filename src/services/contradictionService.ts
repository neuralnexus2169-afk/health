import {
  MedicalContradiction,
  ContradictionCategory,
  ContradictionReviewStatus,
} from '../types/medical';
import {
  patientRepository,
  documentRepository,
  sourceReferenceRepository,
  medicationRepository,
  diagnosisRepository,
  facilityRepository,
  providerRepository,
  timelineRepository,
  documentExtractionRepository,
  contradictionRepository,
} from '../lib/db/repositories';
import { contradictionDetector } from '../lib/contradiction-detector';

export interface ContradictionsSummary {
  totalCount: number;
  unreviewedCount: number;
  reviewedCount: number;
  countsByCategory: Record<ContradictionCategory, number>;
  severityCounts: Record<'High' | 'Moderate' | 'Advisory', number>;
}

export interface ContradictionResponse {
  success: boolean;
  patientId: string;
  contradictions: MedicalContradiction[];
  summary: ContradictionsSummary;
  error?: string;
}

const LOCAL_STORAGE_KEY_PREFIX = 'health_timeline_contradiction_reviews_';

function getLocalReviews(patientId: string): Record<string, { reviewStatus: ContradictionReviewStatus; notes?: string; reviewedAt?: string; reviewerName?: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${patientId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalReview(
  patientId: string,
  contradictionId: string,
  reviewStatus: ContradictionReviewStatus,
  notes?: string,
  reviewerName?: string
) {
  if (typeof window === 'undefined') return;
  try {
    const reviews = getLocalReviews(patientId);
    reviews[contradictionId] = {
      reviewStatus,
      notes,
      reviewedAt: reviewStatus === 'Reviewed' ? new Date().toISOString() : undefined,
      reviewerName: reviewStatus === 'Reviewed' ? (reviewerName || 'Clinical Reviewer') : undefined,
    };
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${patientId}`, JSON.stringify(reviews));
  } catch (err) {
    console.error('Failed to save contradiction review to localStorage:', err);
  }
}

function calculateSummary(contradictions: MedicalContradiction[]): ContradictionsSummary {
  const summary: ContradictionsSummary = {
    totalCount: contradictions.length,
    unreviewedCount: 0,
    reviewedCount: 0,
    countsByCategory: {
      Allergy: 0,
      Medication: 0,
      Diagnosis: 0,
      Timeline: 0,
    },
    severityCounts: {
      High: 0,
      Moderate: 0,
      Advisory: 0,
    },
  };

  for (const c of contradictions) {
    if (c.reviewStatus === 'Reviewed') {
      summary.reviewedCount++;
    } else {
      summary.unreviewedCount++;
    }

    if (summary.countsByCategory[c.category] !== undefined) {
      summary.countsByCategory[c.category]++;
    }

    if (summary.severityCounts[c.severity] !== undefined) {
      summary.severityCounts[c.severity]++;
    }
  }

  return summary;
}

/**
 * Fetch detected contradictions for a patient, backed by deterministic detection
 * and local/server review persistence.
 */
export async function getContradictions(patientId: string = ''): Promise<ContradictionResponse> {
  try {
    // Attempt to query server endpoint first if available
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/contradictions`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.contradictions)) {
          // Merge with any local client overrides
          const localReviews = getLocalReviews(patientId);
          const merged: MedicalContradiction[] = json.contradictions.map((c: MedicalContradiction) => {
            const local = localReviews[c.id];
            if (local) {
              return {
                ...c,
                reviewStatus: local.reviewStatus,
                status: local.reviewStatus === 'Reviewed' ? 'Acknowledged' : 'Unreviewed',
                reviewNotes: local.notes,
                reviewedAt: local.reviewedAt,
                reviewedBy: local.reviewerName,
              };
            }
            return c;
          });

          return {
            success: true,
            patientId,
            contradictions: merged,
            summary: calculateSummary(merged),
          };
        }
      }
    } catch {
      // Server not reachable or network error: fallback to local repository detection
    }

    // Direct Local Structured Detection Fallback
    const [patient, docs, sourceRefs, meds, diags, facilities, providers, events, extractions, stored] = await Promise.all([
      patientRepository.findById(patientId),
      documentRepository.findByPatientId(patientId),
      sourceReferenceRepository.findByPatientId(patientId),
      medicationRepository.findByPatientId(patientId),
      diagnosisRepository.findByPatientId(patientId),
      facilityRepository.findAll(),
      providerRepository.findAll(),
      timelineRepository.findByPatientId(patientId),
      documentExtractionRepository.findByDocumentId(''),
      contradictionRepository.findByPatientId(patientId),
    ]);

    let detected: MedicalContradiction[] = [];
    if (patient) {
      detected = contradictionDetector.detect({
        patient,
        documents: docs,
        sourceReferences: sourceRefs,
        medications: meds,
        diagnoses: diags,
        facilities,
        providers,
        events,
        extractions,
      });
    }

    // Merge detected with stored (such as curated seed contradictions)
    const contradictionMap = new Map<string, MedicalContradiction>();

    // Add stored
    for (const c of stored) {
      contradictionMap.set(c.id, c);
    }

    // Add or merge detected
    for (const d of detected) {
      const existing = Array.from(contradictionMap.values()).find(
        (e) => e.category === d.category && e.title.toLowerCase() === d.title.toLowerCase()
      );
      if (existing) {
        // Keep existing ID and user review status, enrich with evidence details
        contradictionMap.set(existing.id, {
          ...d,
          id: existing.id,
          reviewStatus: existing.reviewStatus || 'Unreviewed',
          status: existing.status,
          reviewNotes: existing.reviewNotes,
          reviewedAt: existing.reviewedAt,
          reviewedBy: existing.reviewedBy,
        });
      } else {
        contradictionMap.set(d.id, d);
      }
    }

    const localReviews = getLocalReviews(patientId);
    const finalContradictions: MedicalContradiction[] = Array.from(contradictionMap.values()).map((c) => {
      const local = localReviews[c.id];
      if (local) {
        return {
          ...c,
          reviewStatus: local.reviewStatus,
          status: local.reviewStatus === 'Reviewed' ? 'Acknowledged' : 'Unreviewed',
          reviewNotes: local.notes,
          reviewedAt: local.reviewedAt,
          reviewedBy: local.reviewerName,
        };
      }
      return {
        ...c,
        reviewStatus: c.reviewStatus || 'Unreviewed',
      };
    });

    return {
      success: true,
      patientId,
      contradictions: finalContradictions,
      summary: calculateSummary(finalContradictions),
    };
  } catch (err: any) {
    console.error('Error fetching contradictions:', err);
    return {
      success: false,
      patientId,
      contradictions: [],
      summary: {
        totalCount: 0,
        unreviewedCount: 0,
        reviewedCount: 0,
        countsByCategory: { Allergy: 0, Medication: 0, Diagnosis: 0, Timeline: 0 },
        severityCounts: { High: 0, Moderate: 0, Advisory: 0 },
      },
      error: err?.message || 'Failed to detect contradictions',
    };
  }
}

/**
 * Update review status of a contradiction (human review marker, NOT clinical resolution)
 */
export async function updateContradictionReview(
  patientId: string,
  contradictionId: string,
  reviewStatus: ContradictionReviewStatus,
  notes?: string,
  reviewerName: string = 'Clinical Reviewer'
): Promise<MedicalContradiction | null> {
  // Update local client storage immediately
  setLocalReview(patientId, contradictionId, reviewStatus, notes, reviewerName);

  // Update repository in-memory
  await contradictionRepository.updateReviewStatus(contradictionId, reviewStatus, notes, reviewerName);

  // Also notify server endpoint if running
  try {
    await fetch(`/api/patients/${encodeURIComponent(patientId)}/contradictions/${encodeURIComponent(contradictionId)}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewStatus, notes, reviewerName }),
    });
  } catch {
    // Ignore server sync failure, local state is preserved
  }

  const updated = await contradictionRepository.findById(contradictionId);
  return updated;
}
