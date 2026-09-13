import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getAIProvider } from './src/lib/ai/index';
import {
  documentRepository,
  patientRepository,
  timelineRepository,
  diagnosisRepository,
  medicationRepository,
  labResultRepository,
  facilityRepository,
  providerRepository,
  healthSummaryRepository,
} from './src/lib/db/repositories/index';
import { documentStorage } from './src/lib/storage/documentStorage';
import { PatientConfirmedRecordsContext, StoredHealthSummary, HealthHistoryQueryContext } from './src/types/medical';
import { healthHistoryRetriever } from './src/lib/health-history/health-history-retriever';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'HealthTimeline AI Clinical Extraction API',
      aiConfigured: Boolean(
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
        process.env.GEMINI_API_KEY.trim().length > 0
      ),
      timestamp: new Date().toISOString(),
    });
  });

  // POST /api/documents/:id/extract
  app.post('/api/documents/:id/extract', async (req, res) => {
    const documentId = req.params.id;
    try {
      const doc = await documentRepository.findById(documentId);
      if (!doc) {
        return res.status(404).json({ error: `Document ${documentId} not found.` });
      }

      // Read stored file if available
      const storedFiles = await documentStorage.list();
      const stored = storedFiles.find((f) => f.fileName === doc.fileName);

      const provider = getAIProvider();

      const structuredData = await provider.extractMedicalInformation({
        fileName: doc.fileName,
        documentType: doc.documentType,
        textSnippet: doc.extractedTextSnippet,
        mimeType: stored?.contentType,
        base64Data: stored?.dataUrl,
        fileSizeBytes: doc.fileSizeBytes,
      });

      res.json({
        success: true,
        data: structuredData,
        extraction: {
          documentId: doc.id,
          model: provider.name,
          status: 'Needs Review',
          data: structuredData,
        },
      });
    } catch (err: any) {
      console.error(`Error in /api/documents/${documentId}/extract:`, err);
      res.status(500).json({
        error: 'Extraction processing failed',
        details: err?.message || String(err),
      });
    }
  });

  // GET /api/patients/:id/health-summary
  app.get('/api/patients/:id/health-summary', async (req, res) => {
    const patientId = req.params.id;
    try {
      const confirmedEvents = await timelineRepository.findByPatientId(patientId);
      const currentConfirmedCount = confirmedEvents.length;

      // Find latest event date
      const sortedEvents = [...confirmedEvents].sort(
        (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
      );
      const latestEventDate = sortedEvents[0]?.eventDate;

      const summary = await healthSummaryRepository.getLatestByPatientId(patientId);

      if (!summary) {
        return res.json({
          success: true,
          hasSummary: false,
          summary: null,
          confirmedRecordCount: currentConfirmedCount,
          isOutdated: false,
        });
      }

      // Detect if records changed since summary was generated
      const isOutdated =
        summary.confirmedRecordCount !== currentConfirmedCount ||
        (summary.lastRecordDate && latestEventDate && summary.lastRecordDate !== latestEventDate);

      res.json({
        success: true,
        hasSummary: true,
        summary: {
          ...summary,
          isOutdated: Boolean(isOutdated),
        },
        confirmedRecordCount: currentConfirmedCount,
        isOutdated: Boolean(isOutdated),
      });
    } catch (err: any) {
      console.error(`Error in GET /api/patients/${patientId}/health-summary:`, err);
      res.status(500).json({
        error: 'Unable to retrieve health summary',
        details: err?.message || String(err),
      });
    }
  });

  // POST /api/patients/:id/health-summary
  app.post('/api/patients/:id/health-summary', async (req, res) => {
    const patientId = req.params.id;
    const forceRefresh = Boolean(req.body?.forceRefresh);

    try {
      // 1. Retrieve confirmed patient records
      let patient = await patientRepository.findById(patientId);
      if (!patient) {
        patient = {
          id: patientId,
          name: 'Arun Mathew',
          dateOfBirth: '1979-05-14',
          gender: 'Male',
          bloodGroup: 'B+',
          allergies: ['Penicillin'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const events = await timelineRepository.findByPatientId(patientId);
      const diagnoses = await diagnosisRepository.findByPatientId(patientId);
      const medications = await medicationRepository.findByPatientId(patientId);
      const labResults = await labResultRepository.findByPatientId(patientId);
      const facilities = await facilityRepository.findAll();
      const providers = await providerRepository.findAll();

      const sortedEvents = [...events].sort(
        (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
      );
      const latestEventDate = sortedEvents[0]?.eventDate;

      // Check if we already have an up-to-date summary and not force refreshing
      if (!forceRefresh) {
        const existing = await healthSummaryRepository.getLatestByPatientId(patientId);
        if (existing) {
          const isOutdated =
            existing.confirmedRecordCount !== events.length ||
            (existing.lastRecordDate && latestEventDate && existing.lastRecordDate !== latestEventDate);

          if (!isOutdated) {
            return res.json({
              success: true,
              summary: { ...existing, isOutdated: false },
              confirmedRecordCount: events.length,
              isOutdated: false,
            });
          }
        }
      }

      // 2. Prepare structured context
      const context: PatientConfirmedRecordsContext = {
        patient,
        events,
        diagnoses,
        medications,
        labResults,
        facilities,
        providers,
      };

      // 3. Call AI provider
      const provider = getAIProvider();
      const structuredData = await provider.generateHealthSummary(context);

      // Collect all referenced source IDs
      const allCitedIds = new Set<string>();
      structuredData.conditions.forEach((c) => c.sourceEventIds.forEach((id) => allCitedIds.add(id)));
      structuredData.medications.forEach((m) => m.sourceEventIds.forEach((id) => allCitedIds.add(id)));
      structuredData.labTrends.forEach((l) => l.sourceEventIds.forEach((id) => allCitedIds.add(id)));
      structuredData.healthcareJourney.forEach((j) => j.sourceEventIds.forEach((id) => allCitedIds.add(id)));
      structuredData.recordObservations?.forEach((o) => o.sourceEventIds.forEach((id) => allCitedIds.add(id)));

      // If citations were somehow sparse, include all event IDs from the patient
      if (allCitedIds.size === 0) {
        events.forEach((e) => allCitedIds.add(e.id));
      }

      // 4. Create and store the new summary
      const newSummary: StoredHealthSummary = {
        id: `summary-${patientId}-${Date.now()}`,
        patientId,
        type: 'Summary',
        title: 'Longitudinal Clinical Journey Summary',
        content: structuredData,
        sourceEventIds: Array.from(allCitedIds),
        model: provider.name,
        createdAt: new Date().toISOString(),
        confirmedRecordCount: events.length,
        lastRecordDate: latestEventDate,
        isOutdated: false,
      };

      await healthSummaryRepository.create(newSummary);

      res.json({
        success: true,
        summary: newSummary,
        confirmedRecordCount: events.length,
        isOutdated: false,
      });
    } catch (err: any) {
      console.error(`Error in POST /api/patients/${patientId}/health-summary:`, err);
      res.status(500).json({
        error: 'Unable to generate the health summary right now.',
        details: err?.message || String(err),
      });
    }
  });

  // Step 7: AI Health History Assistant conversational endpoint
  app.post('/api/patients/:id/chat', async (req, res) => {
    const patientId = req.params.id;
    const { question, history } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    try {
      const retrieved = await healthHistoryRetriever.retrieve(
        patientId,
        question.trim(),
        Array.isArray(history) ? history : []
      );

      const queryContext: HealthHistoryQueryContext = {
        patientId,
        question: question.trim(),
        history: Array.isArray(history) ? history : [],
        retrievedRecords: {
          events: retrieved.retrievedEvents,
          diagnoses: retrieved.retrievedDiagnoses,
          medications: retrieved.retrievedMedications,
          labResults: retrieved.retrievedLabResults,
          documents: retrieved.retrievedDocuments,
          facilities: retrieved.retrievedFacilities,
          providers: retrieved.retrievedProviders,
          contradictions: retrieved.retrievedContradictions,
        },
      };

      const provider = getAIProvider();
      const answer = await provider.answerHealthHistoryQuestion(queryContext);

      res.json({
        success: true,
        answer,
        retrievedCount: {
          events: retrieved.retrievedEvents.length,
          diagnoses: retrieved.retrievedDiagnoses.length,
          medications: retrieved.retrievedMedications.length,
          labResults: retrieved.retrievedLabResults.length,
        },
      });
    } catch (err: any) {
      console.error(`Error in POST /api/patients/${patientId}/chat:`, err);
      res.status(500).json({
        error: 'Failed to process question about medical history.',
        details: err?.message || String(err),
      });
    }
  });


  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HealthTimeline server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
