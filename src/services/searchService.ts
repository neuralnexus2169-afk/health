import { SearchResultsResponse, SearchResultCategory } from '../types/search';
import { executeGlobalHealthSearch } from '../lib/search/searchEngine';
import { DEFAULT_PATIENT_ID } from './patientService';

/**
 * Searches the confirmed medical history of the patient.
 * Calls the backend API endpoint /api/patients/:id/search, with graceful fallback.
 */
export async function searchHealthRecords(
  patientId: string = DEFAULT_PATIENT_ID,
  query: string,
  category?: SearchResultCategory
): Promise<SearchResultsResponse> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      query: '',
      patientId,
      totalCount: 0,
      countsByCategory: {
        medication: 0,
        diagnosis: 0,
        lab: 0,
        timeline: 0,
        document: 0,
        allergy_inconsistency: 0,
        provider_facility: 0,
      },
      results: [],
      groupedResults: {
        medication: [],
        diagnosis: [],
        lab: [],
        timeline: [],
        document: [],
        allergy_inconsistency: [],
        provider_facility: [],
      },
    };
  }

  try {
    const params = new URLSearchParams({ q: cleanQuery });
    if (category) {
      params.append('category', category);
    }

    const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/search?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.results) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Network search request failed, using client search engine fallback:', err);
  }

  // Graceful deterministic fallback
  return await executeGlobalHealthSearch(patientId, cleanQuery, category);
}
