import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload,
  FileText,
  User,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { DocumentSummaryBar } from '../../components/documents/DocumentSummaryBar';
import {
  DocumentFilters,
  DocumentFilterState,
} from '../../components/documents/DocumentFilters';
import { DocumentList } from '../../components/documents/DocumentList';
import { DocumentDetailDrawer } from '../../components/documents/DocumentDetailDrawer';
import { DocumentUploadModal } from '../../components/documents/DocumentUploadModal';
import { ExtractionReviewModal } from './extraction/ExtractionReviewModal';
import { extractDocument } from '../../services/extractionService';
import {
  getEnrichedDocuments,
  EnrichedDocument,
  DocumentSummary,
  DEFAULT_PATIENT_ID,
} from '../../services/patientService';
import { PatientProfile, NavigationRoute } from '../../types';
import { DocumentStatus, DocumentExtraction } from '../../types/medical';

interface DocumentsPageProps {
  patient?: PatientProfile;
  onNavigate: (route: NavigationRoute) => void;
  onOpenUpload?: () => void;
  initialSelectedDocId?: string;
}

const INITIAL_FILTERS: DocumentFilterState = {
  searchQuery: '',
  selectedType: 'all',
  selectedStatus: 'all',
  sortBy: 'newest',
};

export function DocumentsPage({
  patient,
  onNavigate,
  onOpenUpload,
  initialSelectedDocId,
}: DocumentsPageProps) {
  const patientId = patient?.id || DEFAULT_PATIENT_ID;
  const patientName = patient?.name || '';

  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<EnrichedDocument[]>([]);
  const [summary, setSummary] = useState<DocumentSummary>({
    totalCount: 0,
    processedCount: 0,
    needsReviewCount: 0,
    processingCount: 0,
    failedCount: 0,
    uploadedCount: 0,
  });

  const [filters, setFilters] = useState<DocumentFilterState>(INITIAL_FILTERS);
  const [selectedDoc, setSelectedDoc] = useState<EnrichedDocument | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // AI Extraction Review Modal State
  const [reviewModalState, setReviewModalState] = useState<{
    isOpen: boolean;
    document: EnrichedDocument | null;
    extraction: DocumentExtraction | null;
  }>({
    isOpen: false,
    document: null,
    extraction: null,
  });
  const [extractingDocId, setExtractingDocId] = useState<string | null>(null);
  const [extractionNotification, setExtractionNotification] = useState<string | null>(null);

  // Load documents from service
  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await getEnrichedDocuments(patientId);
      setDocuments(data.documents);
      setSummary(data.summary);
      setIsLoading(false);

      // Auto-select if requested or update current selectedDoc
      if (selectedDoc) {
        const updated = data.documents.find((d) => d.id === selectedDoc.id);
        if (updated) {
          setSelectedDoc(updated);
        }
      } else if (initialSelectedDocId) {
        const match = data.documents.find((d) => d.id === initialSelectedDocId);
        if (match) {
          setSelectedDoc(match);
          setIsDrawerOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [patientId, initialSelectedDocId]);

  const handleExtractDocument = async (doc: EnrichedDocument) => {
    setExtractingDocId(doc.id);
    setExtractionNotification(`Extracting medical facts with AI from ${doc.fileName}...`);
    try {
      const extraction = await extractDocument(doc.id);
      await loadDocuments();
      setExtractionNotification(null);
      // Immediately open review modal for clinical verification
      setReviewModalState({
        isOpen: true,
        document: doc,
        extraction,
      });
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractionNotification(`Extraction error: ${err?.message || 'Unable to extract information'}`);
      setTimeout(() => setExtractionNotification(null), 5000);
    } finally {
      setExtractingDocId(null);
    }
  };

  const handleReviewDocument = (doc: EnrichedDocument) => {
    if (!doc.extraction) return;
    setReviewModalState({
      isOpen: true,
      document: doc,
      extraction: doc.extraction,
    });
  };

  // Compute category counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((d) => {
      counts[d.documentType] = (counts[d.documentType] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((d) => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return counts;
  }, [documents]);

  // Filtered and Sorted Documents
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        // 1. Type filter
        if (filters.selectedType !== 'all' && doc.documentType !== filters.selectedType) {
          return false;
        }

        // 2. Status filter
        if (filters.selectedStatus !== 'all' && doc.status !== filters.selectedStatus) {
          return false;
        }

        // 3. Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchName = doc.fileName.toLowerCase().includes(q);
          const matchType = doc.documentType.toLowerCase().includes(q);
          const matchFacility = (doc.facilityName || '').toLowerCase().includes(q);
          const matchProvider = (doc.providerName || '').toLowerCase().includes(q);
          const matchSnippet = (doc.extractedTextSnippet || '').toLowerCase().includes(q);

          // Also match attached clinical items
          const matchEvents = doc.events.some(
            (e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
          );
          const matchDiags = doc.diagnoses.some((d) => d.name.toLowerCase().includes(q));
          const matchMeds = doc.medications.some((m) => m.name.toLowerCase().includes(q));
          const matchLabs = doc.labResults.some((l) => l.testName.toLowerCase().includes(q));

          if (
            !matchName &&
            !matchType &&
            !matchFacility &&
            !matchProvider &&
            !matchSnippet &&
            !matchEvents &&
            !matchDiags &&
            !matchMeds &&
            !matchLabs
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.documentDate).getTime();
        const timeB = new Date(b.documentDate).getTime();
        return filters.sortBy === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [documents, filters]);

  const handleFilterChange = (partial: Partial<DocumentFilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleSelectDocument = (doc: EnrichedDocument) => {
    setSelectedDoc(doc);
    setIsDrawerOpen(true);
  };

  const handleStatusUpdated = (docId: string, newStatus: DocumentStatus) => {
    // Update local state smoothly
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
    );
    if (selectedDoc && selectedDoc.id === docId) {
      setSelectedDoc({ ...selectedDoc, status: newStatus });
    }
    // Refresh summary
    loadDocuments();
  };

  const handleNavigateToTimeline = () => {
    setIsDrawerOpen(false);
    onNavigate('timeline');
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Medical Documents"
        subtitle="Your source records, organized in one place."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200/80 rounded-full text-xs font-semibold text-teal-900">
            <User className="w-3.5 h-3.5 text-teal-700" />
            <span>{patientName}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={<ExternalLink className="w-3.5 h-3.5 text-zinc-600" />}
              onClick={() => onNavigate('timeline')}
            >
              View timeline
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => {
                if (onOpenUpload) {
                  onOpenUpload();
                } else {
                  setIsUploadModalOpen(true);
                }
              }}
            >
              Upload document
            </Button>
          </div>
        }
      />

      {/* Document Summary Bar */}
      <DocumentSummaryBar
        summary={summary}
        filteredCount={filteredDocuments.length}
        isLoading={isLoading}
      />

      {/* Live Extraction Processing Notification */}
      {extractionNotification && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-3 text-sm text-teal-900 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-700 animate-spin" />
            <span className="font-medium">{extractionNotification}</span>
          </div>
          <span className="text-xs text-teal-700 font-semibold bg-teal-100/60 px-2 py-0.5 rounded-full">
            AI Ingestion Active
          </span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <DocumentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        typeCounts={typeCounts}
        statusCounts={statusCounts}
        totalCount={documents.length}
        filteredCount={filteredDocuments.length}
      />

      {/* Document List / Cards */}
      <DocumentList
        documents={filteredDocuments}
        onSelectDocument={handleSelectDocument}
        onExtractDocument={handleExtractDocument}
        onReviewDocument={handleReviewDocument}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onResetFilters={handleResetFilters}
        isFiltered={
          filters.searchQuery.trim() !== '' ||
          filters.selectedType !== 'all' ||
          filters.selectedStatus !== 'all' ||
          filters.sortBy !== 'newest'
        }
        isLoading={isLoading}
      />

      {/* Document Detail Side Drawer */}
      <DocumentDetailDrawer
        document={selectedDoc}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigateToTimeline={handleNavigateToTimeline}
        onStatusUpdated={handleStatusUpdated}
        onOpenReview={handleReviewDocument}
        onExtractionFinished={loadDocuments}
      />

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentCreated={loadDocuments}
        patientId={patientId}
      />

      {/* Extraction Review and Confirmation Modal */}
      {reviewModalState.isOpen && reviewModalState.document && reviewModalState.extraction && (
        <ExtractionReviewModal
          document={reviewModalState.document}
          extraction={reviewModalState.extraction}
          onClose={() =>
            setReviewModalState({
              isOpen: false,
              document: null,
              extraction: null,
            })
          }
          onExtractionConfirmed={async () => {
            await loadDocuments();
            setReviewModalState({
              isOpen: false,
              document: null,
              extraction: null,
            });
          }}
          onNavigateToTimeline={handleNavigateToTimeline}
        />
      )}
    </div>
  );
}
