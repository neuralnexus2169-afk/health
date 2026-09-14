import {
  patientRepository,
  timelineRepository,
  diagnosisRepository,
  medicationRepository,
  labResultRepository,
  documentRepository,
  facilityRepository,
  providerRepository,
  sourceReferenceRepository,
  contradictionRepository,
  normalizePatientId,
} from '../db/repositories';
import {
  SearchResultItem,
  SearchResultsResponse,
  SearchResultCategory,
} from '../../types/search';

/**
 * Calculates deterministic relevance score for a search result item.
 * 1. Exact entity/name match: 100
 * 2. Prefix match: 80
 * 3. Partial match in primary title: 65
 * 4. Match in secondary field (dosage, parameter, description): 45
 * 5. Source text / extracted snippet match: 35
 * 6. Provider / facility match: 20
 * Plus subtle recency boost (0-10 pts).
 */
function calculateRelevance(
  query: string,
  primaryTitle: string,
  secondaryText?: string,
  sourceSnippet?: string,
  metaText?: string,
  dateStr?: string
): { score: number; matchedField: string } {
  const q = query.toLowerCase().trim();
  const titleLower = primaryTitle.toLowerCase();
  let score = 0;
  let matchedField = 'General';

  if (titleLower === q) {
    score = 100;
    matchedField = 'Name (Exact match)';
  } else if (titleLower.startsWith(q)) {
    score = 80;
    matchedField = 'Name (Prefix match)';
  } else if (titleLower.includes(q)) {
    score = 65;
    matchedField = 'Name (Partial match)';
  } else if (secondaryText && secondaryText.toLowerCase().includes(q)) {
    score = 45;
    matchedField = 'Clinical Details';
  } else if (sourceSnippet && sourceSnippet.toLowerCase().includes(q)) {
    score = 35;
    matchedField = 'Source Document Evidence';
  } else if (metaText && metaText.toLowerCase().includes(q)) {
    score = 20;
    matchedField = 'Provider / Facility';
  }

  // Add recency boost if date is available
  if (dateStr && score > 0) {
    try {
      const timestamp = new Date(dateStr).getTime();
      const base2015 = new Date('2015-01-01').getTime();
      const yearsSince2015 = Math.max(0, (timestamp - base2015) / (1000 * 60 * 60 * 24 * 365));
      const recencyBoost = Math.min(10, Math.round(yearsSince2015 * 0.8));
      score += recencyBoost;
    } catch {
      // Ignore date parsing issues
    }
  }

  return { score, matchedField };
}

/**
 * Sanitizes and validates a search query.
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  // Limit length to 150 characters to prevent ReDoS / excessive queries
  const trimmed = query.trim().slice(0, 150);
  return trimmed;
}

/**
 * Executes a deterministic, privacy-safe global health search across the patient's confirmed records.
 */
export async function executeGlobalHealthSearch(
  rawPatientId: string,
  rawQuery: string,
  categoryFilter?: SearchResultCategory
): Promise<SearchResultsResponse> {
  const patientId = normalizePatientId(rawPatientId);
  const query = sanitizeSearchQuery(rawQuery);

  const emptyResponse: SearchResultsResponse = {
    query,
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

  if (!query || query.length === 0) {
    return emptyResponse;
  }

  const q = query.toLowerCase();

  // Retrieve confirmed patient records concurrently
  const [
    patient,
    medications,
    diagnoses,
    events,
    labResults,
    documents,
    sourceReferences,
    contradictions,
    facilities,
    providers,
  ] = await Promise.all([
    patientRepository.findById(patientId),
    medicationRepository.findByPatientId(patientId),
    diagnosisRepository.findByPatientId(patientId),
    timelineRepository.findByPatientId(patientId),
    labResultRepository.findByPatientId(patientId),
    documentRepository.findByPatientId(patientId),
    sourceReferenceRepository.findByPatientId(patientId),
    contradictionRepository.findByPatientId(patientId),
    facilityRepository.findAll(),
    providerRepository.findAll(),
  ]);

  const facilityMap = new Map(facilities.map((f) => [f.id, f.name]));
  const providerMap = new Map(providers.map((p) => [p.id, p.name]));

  const allResults: SearchResultItem[] = [];

  // ==========================================
  // 1. MEDICATIONS
  // ==========================================
  for (const med of medications) {
    const medName = med.name;
    const generic = med.genericName || '';
    const details = `${med.dosage} ${med.frequency} ${med.route || ''}`.trim();
    const facilityName = med.documentId ? documents.find((d) => d.id === med.documentId)?.facilityName : undefined;
    const providerName = med.documentId ? documents.find((d) => d.id === med.documentId)?.providerName : undefined;
    const metaText = `${facilityName || ''} ${providerName || ''}`;

    const textToMatch = `${medName} ${generic} ${details} ${med.status} ${metaText}`.toLowerCase();
    if (textToMatch.includes(q)) {
      const { score, matchedField } = calculateRelevance(
        query,
        medName,
        `${generic} ${details} ${med.status}`,
        undefined,
        metaText,
        med.startDate
      );

      allResults.push({
        id: `search-med-${med.id}`,
        category: 'medication',
        categoryLabel: 'Medication',
        title: med.name,
        subtitle: `${med.dosage} · ${med.frequency}${generic ? ` (${generic})` : ''}`,
        date: med.startDate,
        status: med.status,
        provider: providerName,
        facility: facilityName,
        matchedField,
        relevanceScore: score,
        targetRoute: 'medications',
        targetId: med.id,
        metadata: {
          dosage: med.dosage,
          frequency: med.frequency,
          route: med.route,
          endDate: med.endDate,
        },
      });
    }
  }

  // ==========================================
  // 2. DIAGNOSES
  // ==========================================
  for (const diag of diagnoses) {
    const diagName = diag.name;
    const linkedEvent = diag.eventId ? events.find((e) => e.id === diag.eventId) : undefined;
    const facilityName = linkedEvent?.facilityName;
    const providerName = linkedEvent?.providerName;
    const metaText = `${facilityName || ''} ${providerName || ''} ${diag.status}`;

    const textToMatch = `${diagName} ${metaText}`.toLowerCase();
    if (textToMatch.includes(q)) {
      const { score, matchedField } = calculateRelevance(
        query,
        diagName,
        diag.status,
        undefined,
        metaText,
        diag.firstDocumentedDate
      );

      allResults.push({
        id: `search-diag-${diag.id}`,
        category: 'diagnosis',
        categoryLabel: 'Diagnosis',
        title: diag.name,
        subtitle: `Status: ${diag.status}`,
        date: diag.firstDocumentedDate,
        status: diag.status,
        provider: providerName,
        facility: facilityName,
        matchedField,
        relevanceScore: score,
        targetRoute: 'diagnoses',
        targetId: diag.id,
        metadata: {
          firstDocumentedDate: diag.firstDocumentedDate,
          lastDocumentedDate: diag.lastDocumentedDate,
        },
      });
    }
  }

  // ==========================================
  // 3. LAB RESULTS
  // Values come directly from database
  // ==========================================
  for (const lab of labResults) {
    const testTitle = lab.testName;
    const param = lab.parameterName;
    const valString = `${lab.value} ${lab.unit}`;
    const refRange = lab.referenceRange ? `Ref: ${lab.referenceRange}` : '';
    const facilityName = lab.facilityId ? facilityMap.get(lab.facilityId) : undefined;
    const metaText = `${facilityName || ''} ${param} ${valString} ${refRange}`;

    const textToMatch = `${testTitle} ${param} ${valString} ${refRange} ${facilityName || ''}`.toLowerCase();
    if (textToMatch.includes(q)) {
      const { score, matchedField } = calculateRelevance(
        query,
        testTitle,
        `${param}: ${valString} ${refRange}`,
        undefined,
        metaText,
        lab.testDate
      );

      allResults.push({
        id: `search-lab-${lab.id}`,
        category: 'lab',
        categoryLabel: 'Lab Result',
        title: `${lab.testName}${lab.parameterName && lab.parameterName !== lab.testName ? ` (${lab.parameterName})` : ''}`,
        subtitle: `Result: ${lab.value} ${lab.unit}${lab.referenceRange ? ` (Normal: ${lab.referenceRange})` : ''}`,
        date: lab.testDate,
        facility: facilityName,
        status: 'Recorded',
        matchedField: matchedField === 'General' ? 'Lab Value / Parameter' : matchedField,
        relevanceScore: score,
        targetRoute: 'lab-results',
        targetId: lab.id,
        metadata: {
          value: lab.value,
          unit: lab.unit,
          referenceRange: lab.referenceRange,
          testName: lab.testName,
          parameterName: lab.parameterName,
        },
      });
    }
  }

  // ==========================================
  // 4. TIMELINE (MEDICAL EVENTS)
  // ==========================================
  for (const evt of events) {
    const title = evt.title;
    const desc = evt.description;
    const type = evt.eventType;
    const facility = evt.facilityName || (evt.facilityId ? facilityMap.get(evt.facilityId) : undefined);
    const provider = evt.providerName || (evt.providerId ? providerMap.get(evt.providerId) : undefined);
    const metaText = `${facility || ''} ${provider || ''} ${type}`;

    const textToMatch = `${title} ${desc} ${type} ${metaText}`.toLowerCase();
    if (textToMatch.includes(q)) {
      const { score, matchedField } = calculateRelevance(
        query,
        title,
        type,
        desc,
        metaText,
        evt.eventDate
      );

      allResults.push({
        id: `search-evt-${evt.id}`,
        category: 'timeline',
        categoryLabel: 'Timeline Event',
        title: evt.title,
        subtitle: evt.eventType,
        snippet: evt.description,
        date: evt.eventDate,
        provider,
        facility,
        matchedField: matchedField === 'Source Document Evidence' ? 'Event Description' : matchedField,
        relevanceScore: score,
        targetRoute: 'timeline',
        targetId: evt.id,
        metadata: {
          eventType: evt.eventType,
          documentId: evt.documentId,
        },
      });
    }
  }

  // ==========================================
  // 5. DOCUMENTS & EXTRACTED TEXT
  // Note: Only confirmed / processed documents; no raw file paths exposed!
  // ==========================================
  for (const doc of documents) {
    // Only search safe, confirmed documents
    const docName = doc.fileName;
    const docType = doc.documentType;
    const snippet = doc.extractedTextSnippet || '';
    const facility = doc.facilityName;
    const provider = doc.providerName;
    const metaText = `${facility || ''} ${provider || ''} ${docType}`;

    const textToMatch = `${docName} ${docType} ${snippet} ${metaText}`.toLowerCase();
    if (textToMatch.includes(q)) {
      const { score, matchedField } = calculateRelevance(
        query,
        docName,
        docType,
        snippet,
        metaText,
        doc.documentDate
      );

      allResults.push({
        id: `search-doc-${doc.id}`,
        category: 'document',
        categoryLabel: 'Document',
        title: doc.fileName,
        subtitle: doc.documentType,
        snippet: doc.extractedTextSnippet,
        date: doc.documentDate,
        provider,
        facility,
        status: doc.status,
        matchedField,
        relevanceScore: score,
        targetRoute: 'documents',
        targetId: doc.id,
        metadata: {
          documentType: doc.documentType,
          pageCount: doc.pageCount,
        },
      });
    }
  }

  // ==========================================
  // 6. SOURCE REFERENCES (Specific quotes / extraction sources)
  // E.g., searching "rash" finds source reference with Penicillin rash
  // ==========================================
  for (const srcRef of sourceReferences) {
    const text = srcRef.sourceText || '';
    if (text.toLowerCase().includes(q)) {
      const parentDoc = documents.find((d) => d.id === srcRef.documentId);
      const isAlreadyInDocList = allResults.some(
        (r) => r.category === 'document' && r.targetId === srcRef.documentId
      );

      // If document is not already represented, or this is a rich quotation match, add as source evidence
      if (!isAlreadyInDocList) {
        const { score } = calculateRelevance(
          query,
          parentDoc?.fileName || 'Source Document',
          parentDoc?.documentType,
          text,
          undefined,
          parentDoc?.documentDate
        );

        allResults.push({
          id: `search-srcref-${srcRef.id}`,
          category: 'document',
          categoryLabel: 'Document Evidence',
          title: parentDoc?.fileName || 'Clinical Source Reference',
          subtitle: `Page ${srcRef.pageNumber || 1} Reference · ${parentDoc?.documentType || 'Clinical Record'}`,
          snippet: srcRef.sourceText,
          date: parentDoc?.documentDate,
          provider: parentDoc?.providerName,
          facility: parentDoc?.facilityName,
          matchedField: 'Source Document Quote',
          relevanceScore: score,
          targetRoute: 'documents',
          targetId: srcRef.documentId,
        });
      }
    }
  }

  // ==========================================
  // 7. ALLERGIES & INCONSISTENCIES / CONTRADICTIONS
  // Search patient confirmed allergies + contradictions.
  // When conflicting info is found (e.g. Penicillin), show both facts!
  // ==========================================
  if (patient && Array.isArray(patient.allergies)) {
    for (const allergy of patient.allergies) {
      if (allergy.toLowerCase().includes(q) || 'allergy'.includes(q) || 'allergies'.includes(q)) {
        allResults.push({
          id: `search-allergy-${allergy.slice(0, 15).replace(/\s+/g, '-')}`,
          category: 'allergy_inconsistency',
          categoryLabel: 'Documented Allergy',
          title: allergy,
          subtitle: `Confirmed Patient Allergy Record (${patient.name})`,
          snippet: `Patient medical profile indicates: ${allergy}`,
          matchedField: 'Documented Allergy',
          relevanceScore: allergy.toLowerCase().includes(q) ? 90 : 50,
          targetRoute: 'overview',
        });
      }
    }
  }

  // Search contradictions
  for (const contra of contradictions) {
    const textToMatch = `${contra.title} ${contra.description} ${contra.firstFact} ${contra.secondFact} ${contra.firstSourceReference || ''} ${contra.secondSourceReference || ''} ${contra.category}`.toLowerCase();
    if (textToMatch.includes(q)) {
      const { score } = calculateRelevance(
        query,
        contra.title,
        `${contra.firstFact} vs ${contra.secondFact}`,
        contra.description,
        contra.category,
        contra.secondDate || contra.firstDate
      );

      allResults.push({
        id: `search-contra-${contra.id}`,
        category: 'allergy_inconsistency',
        categoryLabel: 'Potential Inconsistency',
        title: contra.title,
        subtitle: `${contra.category} Discrepancy (${contra.severity} Priority)`,
        snippet: contra.description,
        date: contra.secondDate || contra.firstDate,
        status: contra.status,
        matchedField: 'Conflicting Clinical Evidence',
        relevanceScore: Math.max(score, 75), // Inconsistencies are high priority to surface
        targetRoute: 'contradictions',
        targetId: contra.id,
        inconsistencyDetails: {
          firstFact: contra.firstFact,
          secondFact: contra.secondFact,
          firstSource: contra.firstSourceReference,
          secondSource: contra.secondSourceReference,
          firstDate: contra.firstDate,
          secondDate: contra.secondDate,
          severity: contra.severity,
        },
      });
    }
  }

  // ==========================================
  // 8. PROVIDERS & FACILITIES
  // ==========================================
  for (const prov of providers) {
    const provName = prov.name;
    const spec = prov.specialization;
    const facName = prov.facilityName || facilityMap.get(prov.facilityId) || '';
    const textToMatch = `${provName} ${spec} ${facName}`.toLowerCase();

    if (textToMatch.includes(q)) {
      const { score, matchedField } = calculateRelevance(
        query,
        provName,
        spec,
        facName,
        undefined
      );

      allResults.push({
        id: `search-prov-${prov.id}`,
        category: 'provider_facility',
        categoryLabel: 'Healthcare Provider',
        title: prov.name,
        subtitle: `${prov.specialization} · ${facName}`,
        matchedField: matchedField === 'General' ? 'Provider Profile' : matchedField,
        relevanceScore: score,
        targetRoute: 'timeline',
        metadata: {
          specialization: prov.specialization,
          facilityName: facName,
        },
      });
    }
  }

  for (const fac of facilities) {
    const facName = fac.name;
    const type = fac.type;
    const addr = fac.address || '';
    const textToMatch = `${facName} ${type} ${addr}`.toLowerCase();

    if (textToMatch.includes(q)) {
      const { score, matchedField } = calculateRelevance(
        query,
        facName,
        type,
        addr,
        undefined
      );

      allResults.push({
        id: `search-fac-${fac.id}`,
        category: 'provider_facility',
        categoryLabel: 'Healthcare Facility',
        title: fac.name,
        subtitle: `${fac.type}${fac.address ? ` · ${fac.address}` : ''}`,
        matchedField: matchedField === 'General' ? 'Facility Profile' : matchedField,
        relevanceScore: score,
        targetRoute: 'timeline',
        metadata: {
          type: fac.type,
          address: fac.address,
        },
      });
    }
  }

  // Filter by category if requested
  const filtered = categoryFilter
    ? allResults.filter((r) => r.category === categoryFilter)
    : allResults;

  // Sort by relevance score descending (tie-breaker by date descending)
  filtered.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  });

  // Calculate counts by category
  const countsByCategory: Record<SearchResultCategory, number> = {
    medication: 0,
    diagnosis: 0,
    lab: 0,
    timeline: 0,
    document: 0,
    allergy_inconsistency: 0,
    provider_facility: 0,
  };

  const groupedResults: Record<SearchResultCategory, SearchResultItem[]> = {
    medication: [],
    diagnosis: [],
    lab: [],
    timeline: [],
    document: [],
    allergy_inconsistency: [],
    provider_facility: [],
  };

  for (const item of filtered) {
    countsByCategory[item.category]++;
    groupedResults[item.category].push(item);
  }

  return {
    query,
    patientId,
    totalCount: filtered.length,
    countsByCategory,
    results: filtered,
    groupedResults,
  };
}
