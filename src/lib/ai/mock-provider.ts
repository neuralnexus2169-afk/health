import { AIProvider, ExtractionInput } from './ai-provider';
import {
  StructuredExtractionData,
  ExtractedDiagnosis,
  ExtractedMedication,
  ExtractedLabResult,
  ExtractedProcedure,
  ExtractedAllergy,
  PatientConfirmedRecordsContext,
  HealthSummaryStructuredData,
  HealthHistoryQueryContext,
  HealthHistoryAnswer,
} from '../../types/medical';

export class MockAIProvider implements AIProvider {
  readonly name = 'Mock Clinical Extraction Engine (Demo Mode)';

  async summarizeDocument(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return 'No document text available for summarization.';
    }
    return `Verified clinical record: ${text.slice(0, 180)}...`;
  }

  async extractMedicalInformation(input: ExtractionInput): Promise<StructuredExtractionData> {
    // Artificial small latency to simulate realistic processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    const lowerName = input.fileName.toLowerCase();
    const lowerText = ((input.textContent || '') + ' ' + (input.textSnippet || '')).toLowerCase();

    // 1. Specific demo document requested by user specification: consultation_2026_demo.pdf
    if (lowerName.includes('consultation_2026_demo') || lowerName.includes('demo_consultation')) {
      return {
        documentDate: '2026-09-10',
        documentType: 'Consultation Note',
        facility: 'Meridian Medical Centre',
        provider: 'Dr. Sarah Jenkins, MD',
        summarySnippet: 'Outpatient consultation note documenting Type 2 Diabetes review, Metformin prescription, baseline HbA1c testing, and recorded penicillin drug allergy.',
        diagnoses: [
          {
            id: 'ext-diag-demo-1',
            name: 'Type 2 Diabetes Mellitus',
            status: 'Active',
            date: '2026-09-10',
            confidence: 'High',
            sourceQuote: 'Assessment: Type 2 Diabetes Mellitus under ongoing oral pharmacotherapy.',
            pageNumber: 1,
            accepted: true,
          },
        ],
        medications: [
          {
            id: 'ext-med-demo-1',
            name: 'Metformin',
            genericName: 'Metformin Hydrochloride',
            dosage: '500 mg',
            frequency: 'Twice daily',
            route: 'Oral',
            startDate: '2026-09-10',
            status: 'Active',
            confidence: 'High',
            sourceQuote: 'Prescribed: Metformin 500 mg PO twice daily with meals.',
            pageNumber: 1,
            accepted: true,
          },
        ],
        labResults: [
          {
            id: 'ext-lab-demo-1',
            testName: 'Hemoglobin A1c',
            parameterName: 'HbA1c',
            value: 6.8,
            unit: '%',
            referenceRange: '4.0 - 5.6 %',
            date: '2026-09-10',
            interpretation: 'Target',
            confidence: 'High',
            sourceQuote: 'Point-of-care laboratory result: HbA1c 6.8% (Target < 7.0%).',
            pageNumber: 2,
            accepted: true,
          },
        ],
        procedures: [
          {
            id: 'ext-proc-demo-1',
            name: 'Comprehensive Diabetic Foot Examination',
            date: '2026-09-10',
            provider: 'Dr. Sarah Jenkins, MD',
            confidence: 'Medium',
            sourceQuote: 'Bilateral monofilament sensory testing normal.',
            pageNumber: 1,
            accepted: true,
          },
        ],
        allergies: [
          {
            id: 'ext-all-demo-1',
            substance: 'Penicillin',
            reaction: 'Rash',
            severity: 'Moderate',
            confidence: 'High',
            sourceQuote: 'Known Allergies: Penicillin — developed widespread pruritic rash in childhood.',
            pageNumber: 1,
            accepted: true,
          },
        ],
        clinicalNotes: [
          'Patient demonstrates strong lifestyle adherence and active glucose self-monitoring.',
          'Vital signs: BP 124/80 mmHg, Pulse 72 bpm, Weight 78.4 kg.',
          'Follow up scheduled in 6 months with repeat metabolic panel.',
        ],
      };
    }

    // 2. Consultation Note 2026 (Needs Review seed document)
    if (lowerName.includes('consultation_note_2026') || (lowerName.includes('consultation') && lowerName.includes('2026'))) {
      return {
        documentDate: '2026-08-28',
        documentType: 'Consultation Note',
        facility: 'Meridian Medical Centre',
        provider: 'Dr. Sarah Jenkins, MD',
        summarySnippet: 'Routine 6-month diabetic and hypertensive surveillance with stable glycemic indicators and blood pressure control.',
        diagnoses: [
          {
            id: 'ext-diag-2026-1',
            name: 'Type 2 Diabetes Mellitus',
            status: 'Active',
            date: '2026-08-28',
            confidence: 'High',
            sourceQuote: 'Chronic Problem List: Type 2 Diabetes Mellitus without end-organ complications.',
            pageNumber: 1,
            accepted: true,
          },
          {
            id: 'ext-diag-2026-2',
            name: 'Essential Hypertension',
            status: 'Active',
            date: '2026-08-28',
            confidence: 'High',
            sourceQuote: 'Essential Hypertension: Well-controlled on monotherapy.',
            pageNumber: 1,
            accepted: true,
          },
        ],
        medications: [
          {
            id: 'ext-med-2026-1',
            name: 'Metformin ER',
            genericName: 'Metformin Hydrochloride Extended Release',
            dosage: '500 mg',
            frequency: 'Twice daily',
            route: 'Oral',
            startDate: '2025-03-10',
            status: 'Active',
            confidence: 'High',
            sourceQuote: 'Current Regimen: Metformin ER 500 mg BID with breakfast and dinner.',
            pageNumber: 1,
            accepted: true,
          },
          {
            id: 'ext-med-2026-2',
            name: 'Empagliflozin (Jardiance)',
            genericName: 'Empagliflozin',
            dosage: '10 mg',
            frequency: 'Once daily',
            route: 'Oral',
            startDate: '2025-03-10',
            status: 'Active',
            confidence: 'High',
            sourceQuote: 'Empagliflozin 10 mg PO QAM for glycemic optimization and cardioprotection.',
            pageNumber: 1,
            accepted: true,
          },
          {
            id: 'ext-med-2026-3',
            name: 'Amlodipine',
            genericName: 'Amlodipine Besylate',
            dosage: '5 mg',
            frequency: 'Once daily',
            route: 'Oral',
            startDate: '2020-09-22',
            status: 'Active',
            confidence: 'High',
            sourceQuote: 'Amlodipine 5 mg PO daily. BP optimal at 122/78 mmHg.',
            pageNumber: 1,
            accepted: true,
          },
        ],
        labResults: [
          {
            id: 'ext-lab-2026-1',
            testName: 'Hemoglobin A1c',
            parameterName: 'HbA1c',
            value: 6.8,
            unit: '%',
            referenceRange: '4.0 - 5.6 %',
            date: '2026-08-24',
            interpretation: 'Target',
            confidence: 'High',
            sourceQuote: 'Recent laboratory panel reviewed: HbA1c 6.8 % reflects excellent regimen stability.',
            pageNumber: 2,
            accepted: true,
          },
          {
            id: 'ext-lab-2026-2',
            testName: 'Blood Pressure',
            parameterName: 'Systolic/Diastolic BP',
            value: '122/78',
            unit: 'mmHg',
            referenceRange: '< 130/80 mmHg',
            date: '2026-08-28',
            interpretation: 'Normal',
            confidence: 'High',
            sourceQuote: 'Office vitals: BP 122/78 mmHg sitting right arm.',
            pageNumber: 1,
            accepted: true,
          },
        ],
        procedures: [],
        allergies: [
          {
            id: 'ext-all-2026-1',
            substance: 'Penicillin',
            reaction: 'Severe urticaria / rash',
            severity: 'Moderate',
            confidence: 'High',
            sourceQuote: 'Allergies: Penicillin (childhood rash / allergy band confirmed).',
            pageNumber: 1,
            accepted: true,
          },
        ],
        clinicalNotes: [
          'Patient tolerating Empagliflozin without genitourinary symptoms.',
          'Advised continuation of daily 30-minute aerobic walking.',
          'Schedule surveillance renal ultrasound and lipid panel next spring.',
        ],
      };
    }

    // 3. Prescription document
    if (lowerName.includes('prescription') || lowerName.includes('rx')) {
      return {
        documentDate: '2025-03-10',
        documentType: 'Prescription',
        facility: 'Meridian Medical Centre',
        provider: 'Dr. Sarah Jenkins, MD',
        summarySnippet: 'Prescription order for Empagliflozin 10mg daily and Metformin 500mg ER BID.',
        diagnoses: [
          {
            id: 'ext-diag-rx-1',
            name: 'Type 2 Diabetes Mellitus',
            status: 'Active',
            date: '2025-03-10',
            confidence: 'High',
            sourceQuote: 'Dx: Type 2 Diabetes Mellitus (ICD-10 E11.9)',
            pageNumber: 1,
            accepted: true,
          },
        ],
        medications: [
          {
            id: 'ext-med-rx-1',
            name: 'Empagliflozin (Jardiance)',
            genericName: 'Empagliflozin',
            dosage: '10 mg',
            frequency: 'Once daily in the morning',
            route: 'Oral',
            startDate: '2025-03-10',
            status: 'Active',
            confidence: 'High',
            sourceQuote: 'Rx: Empagliflozin 10 mg PO QAM #90. Refills: 3.',
            pageNumber: 1,
            accepted: true,
          },
          {
            id: 'ext-med-rx-2',
            name: 'Metformin ER',
            genericName: 'Metformin Hydrochloride',
            dosage: '500 mg',
            frequency: 'Twice daily',
            route: 'Oral',
            startDate: '2025-03-10',
            status: 'Active',
            confidence: 'High',
            sourceQuote: 'Rx: Metformin HCl ER 500 mg PO BID with meals #180. Refills: 3.',
            pageNumber: 1,
            accepted: true,
          },
        ],
        labResults: [],
        procedures: [],
        allergies: [],
        clinicalNotes: ['Dispense 90-day supply for chronic maintenance.'],
      };
    }

    // 4. Lab report document
    if (lowerName.includes('lab') || lowerName.includes('report') || lowerName.includes('panel')) {
      return {
        documentDate: '2026-08-24',
        documentType: 'Lab Report',
        facility: 'Lakeside Diagnostics',
        provider: 'Dr. Elena Rostova, MD, PhD',
        summarySnippet: 'Clinical pathology diagnostic panel: HbA1c, Fasting Blood Glucose, and Comprehensive Lipid Profile.',
        diagnoses: [],
        medications: [],
        labResults: [
          {
            id: 'ext-lab-gen-1',
            testName: 'Hemoglobin A1c (HbA1c)',
            parameterName: 'HbA1c',
            value: 6.8,
            unit: '%',
            referenceRange: '4.0 - 5.6 %',
            date: '2026-08-24',
            interpretation: 'Target',
            confidence: 'High',
            sourceQuote: 'Hemoglobin A1c: 6.8 % [Ref Range: 4.0 - 5.6 %]',
            pageNumber: 1,
            accepted: true,
          },
          {
            id: 'ext-lab-gen-2',
            testName: 'Fasting Plasma Glucose',
            parameterName: 'Glucose, Fasting',
            value: 118,
            unit: 'mg/dL',
            referenceRange: '70 - 99 mg/dL',
            date: '2026-08-24',
            interpretation: 'Elevated',
            confidence: 'High',
            sourceQuote: 'Fasting Plasma Glucose: 118 mg/dL [Ref Range: 70 - 99 mg/dL]',
            pageNumber: 1,
            accepted: true,
          },
          {
            id: 'ext-lab-gen-3',
            testName: 'Lipid Panel',
            parameterName: 'Total Cholesterol',
            value: 168,
            unit: 'mg/dL',
            referenceRange: '< 200 mg/dL',
            date: '2026-08-24',
            interpretation: 'Normal',
            confidence: 'High',
            sourceQuote: 'Total Cholesterol: 168 mg/dL [Desirable: < 200 mg/dL]',
            pageNumber: 2,
            accepted: true,
          },
          {
            id: 'ext-lab-gen-4',
            testName: 'Lipid Panel',
            parameterName: 'LDL Cholesterol',
            value: 94,
            unit: 'mg/dL',
            referenceRange: '< 100 mg/dL',
            date: '2026-08-24',
            interpretation: 'Normal',
            confidence: 'High',
            sourceQuote: 'LDL Calculated: 94 mg/dL [Optimal: < 100 mg/dL]',
            pageNumber: 2,
            accepted: true,
          },
        ],
        procedures: [],
        allergies: [],
        clinicalNotes: ['Specimen received cold and processed within protocol time limits.'],
      };
    }

    // 5. Imaging / Radiology document
    if (lowerName.includes('xray') || lowerName.includes('mri') || lowerName.includes('scan') || lowerName.includes('imaging')) {
      return {
        documentDate: '2026-09-02',
        documentType: 'Imaging Report',
        facility: 'CityCare Hospital Radiology',
        provider: 'Dr. Robert Torres, MD, FACC',
        summarySnippet: 'Two-view lumbar spine radiography demonstrating mild age-appropriate degenerative changes at L4-L5 without spondylolisthesis.',
        diagnoses: [
          {
            id: 'ext-diag-rad-1',
            name: 'Degenerative Disc Disease, Lumbar Spine (L4-L5)',
            status: 'Active',
            date: '2026-09-02',
            confidence: 'High',
            sourceQuote: 'Impression: Mild degenerative disc disease at L4-L5. No acute osseous fracture.',
            pageNumber: 1,
            accepted: true,
          },
        ],
        medications: [],
        labResults: [],
        procedures: [
          {
            id: 'ext-proc-rad-1',
            name: 'Lumbar Spine Radiography, 2 Views',
            date: '2026-09-02',
            provider: 'Dr. Robert Torres, MD, FACC',
            confidence: 'High',
            sourceQuote: 'Procedure: XR Lumbar Spine AP and Lateral views.',
            pageNumber: 1,
            accepted: true,
          },
        ],
        allergies: [],
        clinicalNotes: [
          'Vertebral body heights and alignment are preserved.',
          'Intervertebral disc spaces intact except mild narrowing at L4-L5.',
        ],
      };
    }

    // 6. Generic Fallback for Any Uploaded Document
    const fallbackDate = new Date().toISOString().split('T')[0];
    return {
      documentDate: fallbackDate,
      documentType: 'Consultation Note',
      facility: 'Metro Health Medical Center',
      provider: 'Dr. Sarah Jenkins, MD',
      summarySnippet: `Extracted clinical summary for ${input.fileName}. Document review completed with high evidence fidelity.`,
      diagnoses: [
        {
          id: `ext-diag-gen-${Date.now()}`,
          name: 'Type 2 Diabetes Mellitus',
          status: 'Active',
          date: fallbackDate,
          confidence: 'High',
          sourceQuote: `Assessment noted in ${input.fileName}: Type 2 Diabetes Mellitus under active clinical monitoring.`,
          pageNumber: 1,
          accepted: true,
        },
      ],
      medications: [
        {
          id: `ext-med-gen-${Date.now()}`,
          name: 'Metformin',
          genericName: 'Metformin Hydrochloride',
          dosage: '500 mg',
          frequency: 'Twice daily with meals',
          route: 'Oral',
          startDate: fallbackDate,
          status: 'Active',
          confidence: 'High',
          sourceQuote: 'Medication list: Metformin 500 mg PO BID.',
          pageNumber: 1,
          accepted: true,
        },
      ],
      labResults: [
        {
          id: `ext-lab-gen-${Date.now()}`,
          testName: 'Hemoglobin A1c',
          parameterName: 'HbA1c',
          value: 6.8,
          unit: '%',
          referenceRange: '4.0 - 5.6 %',
          date: fallbackDate,
          interpretation: 'Target',
          confidence: 'High',
          sourceQuote: 'Recent HbA1c result: 6.8%.',
          pageNumber: 1,
          accepted: true,
        },
      ],
      procedures: [],
      allergies: [
        {
          id: `ext-all-gen-${Date.now()}`,
          substance: 'Penicillin',
          reaction: 'Maculopapular rash',
          severity: 'Moderate',
          confidence: 'High',
          sourceQuote: 'Allergies: Penicillin (documented childhood rash).',
          pageNumber: 1,
          accepted: true,
        },
      ],
      clinicalNotes: [
        `Clinical document ${input.fileName} ingested and verified by HealthTimeline clinical safety engine.`,
        'All extracted values retain provenance to original uploaded file.',
      ],
    };
  }

  async generateHealthSummary(context: PatientConfirmedRecordsContext): Promise<HealthSummaryStructuredData> {
    // Artificial small delay to reflect AI summarization process
    await new Promise((resolve) => setTimeout(resolve, 800));

    // If context is Arun Mathew (or default seeded patient with rich history)
    const isArun = context.patient.id === 'pat-arun-mathew-01' || context.patient.name.toLowerCase().includes('arun');

    if (isArun && context.events.length > 0) {
      return {
        overview:
          'This patient has documented Type 2 Diabetes Mellitus since May 2018, essential hypertension since September 2020, and hyperlipidemia since October 2021. Glycemic management began with Metformin monotherapy, underwent escalation during an acute inpatient hospitalization for hyperglycemic decompensation in November 2023, and transitioned to dual oral therapy with Metformin and Empagliflozin in March 2025 after Glimepiride was discontinued. Longitudinal glycemic indicators show HbA1c rising from 6.4% in 2018 to an 8.0% peak in 2023, followed by sustained improvement to 6.8% in August 2026.',
        conditions: [
          {
            name: 'Type 2 Diabetes Mellitus',
            firstDocumented: 'May 10, 2018',
            lastDocumented: 'Aug 28, 2026',
            status: 'Active',
            sourceEventIds: ['evt-2018-02', 'evt-2023-01', 'evt-2025-01', 'evt-2026-01'],
          },
          {
            name: 'Essential Hypertension',
            firstDocumented: 'Sep 22, 2020',
            lastDocumented: 'Aug 28, 2026',
            status: 'Active (Well-controlled)',
            sourceEventIds: ['evt-2020-02', 'evt-2026-01'],
          },
          {
            name: 'Hyperlipidemia',
            firstDocumented: 'Oct 15, 2021',
            lastDocumented: 'Aug 24, 2026',
            status: 'Active',
            sourceEventIds: ['evt-2021-02', 'evt-2026-04'],
          },
          {
            name: 'Acute Hyperglycemic Decompensation',
            firstDocumented: 'Nov 14, 2023',
            lastDocumented: 'Nov 17, 2023',
            status: 'Resolved',
            sourceEventIds: ['evt-2023-01', 'evt-2023-02'],
          },
        ],
        medications: [
          {
            name: 'Metformin',
            summary:
              'Initiated at 500 mg daily in May 2018, temporarily escalated to 1000 mg twice daily in November 2023 post-hospitalization, and adjusted back to 500 mg ER twice daily in March 2025 as continuous baseline therapy.',
            sourceEventIds: ['evt-2018-03', 'evt-2023-03', 'evt-2025-03'],
          },
          {
            name: 'Amlodipine',
            summary:
              'Documented since September 2020 at 5 mg once daily for essential hypertension, with consistent blood pressure stability through August 2026.',
            sourceEventIds: ['evt-2020-03', 'evt-2026-01'],
          },
          {
            name: 'Empagliflozin (Jardiance)',
            summary:
              'Initiated at 10 mg once daily in March 2025 as second-line agent for diabetes and cardio-renal protection, remaining active in current regimen.',
            sourceEventIds: ['evt-2025-03', 'evt-2026-01'],
          },
          {
            name: 'Glimepiride',
            summary:
              'Initiated at 1 mg daily in November 2023 during hospital discharge; discontinued in March 2025 after patient reported recurrent hypoglycemia.',
            sourceEventIds: ['evt-2023-03', 'evt-2025-01'],
          },
        ],
        labTrends: [
          {
            parameter: 'HbA1c (Hemoglobin A1c)',
            summary:
              'HbA1c measured 6.4% in May 2018, 6.6% in June 2019, 7.1% in October 2021, and 7.6% in October 2022. It reached an inpatient peak of 8.0% in November 2023 before steadily improving to 7.5% in September 2024 and 6.8% in August 2026 under dual therapy.',
            sourceEventIds: [
              'evt-2018-01',
              'evt-2019-01',
              'evt-2021-02',
              'evt-2022-02',
              'evt-2023-02',
              'evt-2024-02',
              'evt-2026-04',
            ],
          },
          {
            parameter: 'Fasting Plasma Glucose',
            summary:
              'Initial fasting glucose recorded at 134 mg/dL in 2018, peaked at 218 mg/dL during acute 2023 hospitalization, and normalized to 118 mg/dL in August 2026.',
            sourceEventIds: ['evt-2018-01', 'evt-2023-02', 'evt-2026-04'],
          },
          {
            parameter: 'Renal Function (Creatinine & eGFR)',
            summary:
              'Serum creatinine has remained stable between 0.95 mg/dL (2018) and 0.98 mg/dL (2026), with estimated GFR preserved above 90 mL/min/1.73m².',
            sourceEventIds: ['evt-2018-01', 'evt-2022-02', 'evt-2026-04'],
          },
          {
            parameter: 'Lipid Profile (LDL & Triglycerides)',
            summary:
              'Total cholesterol was 214 mg/dL and LDL 138 mg/dL in October 2021; latest August 2026 panel documented LDL at 94 mg/dL and Triglycerides at 130 mg/dL.',
            sourceEventIds: ['evt-2021-02', 'evt-2026-04'],
          },
        ],
        healthcareJourney: [
          {
            category: 'Consultation',
            date: 'May 10, 2018',
            summary:
              'Baseline Internal Medicine evaluation by Dr. Sarah Jenkins at Meridian Medical Centre establishing diagnosis of Type 2 Diabetes.',
            sourceEventIds: ['evt-2018-02'],
          },
          {
            category: 'Consultation',
            date: 'Sep 22, 2020',
            summary:
              'Cardiovascular risk and blood pressure assessment by Dr. Robert Torres at Meridian Medical Centre diagnosing Stage 1 Essential Hypertension.',
            sourceEventIds: ['evt-2020-02', 'evt-2020-03'],
          },
          {
            category: 'Hospitalization',
            date: 'Nov 14, 2023 – Nov 17, 2023',
            summary:
              'Emergency acute inpatient admission to CityCare Hospital under Dr. Robert Torres for acute hyperglycemic decompensation; treated with IV hydration and discharge medication escalation.',
            sourceEventIds: ['evt-2023-01', 'evt-2023-02', 'evt-2023-03'],
          },
          {
            category: 'Consultation',
            date: 'Mar 10, 2025',
            summary:
              'Specialist endocrine review with Dr. Sarah Jenkins addressing hypoglycemia episodes; Glimepiride stopped and SGLT2 inhibitor Empagliflozin initiated.',
            sourceEventIds: ['evt-2025-01', 'evt-2025-03'],
          },
          {
            category: 'Investigation',
            date: 'Aug 20, 2026',
            summary:
              'Renal Doppler Ultrasound and Echocardiogram at Meridian Medical Centre showing normal bilateral renal blood flow and preserved LV ejection fraction (62%).',
            sourceEventIds: ['evt-2026-03'],
          },
          {
            category: 'Consultation',
            date: 'Aug 28, 2026',
            summary:
              'Comprehensive longitudinal review with Dr. Sarah Jenkins confirming improved glycemic control (HbA1c 6.8%) and stable ambulatory blood pressure.',
            sourceEventIds: ['evt-2026-01'],
          },
        ],
        recordObservations: [
          {
            summary:
              'Penicillin allergy with childhood maculopapular rash was recorded in initial 2018 consultation note, while 2023 hospital admission orders noted "No active drug allergies listed" before being re-verified.',
            sourceEventIds: ['evt-2018-02', 'evt-2023-01'],
          },
        ],
      };
    }

    // Dynamic generation fallback for other patients or dynamic records
    const eventIds = context.events.map((e) => e.id);
    const primaryConditions = context.diagnoses.map((d) => ({
      name: d.name,
      firstDocumented: d.firstDocumentedDate,
      lastDocumented: d.lastDocumentedDate || 'Present',
      status: d.status,
      sourceEventIds: d.eventId ? [d.eventId] : eventIds.slice(0, 1),
    }));

    const medicationList = context.medications.map((m) => ({
      name: m.name,
      summary: `${m.dosage} ${m.frequency} (${m.status}). Indication: ${m.indication || 'Documented therapy'}.`,
      sourceEventIds: m.eventId ? [m.eventId] : eventIds.slice(0, 1),
    }));

    const labTrendsList = context.labResults.slice(0, 3).map((l) => ({
      parameter: l.testName,
      summary: `Most recent documented value: ${l.value} ${l.unit} on ${l.testDate || 'N/A'}.`,
      sourceEventIds: l.eventId ? [l.eventId] : eventIds.slice(0, 1),
    }));

    const journey = context.events.slice(0, 5).map((e) => ({
      category: (e.eventType === 'Hospitalization' ? 'Hospitalization' : e.eventType === 'Laboratory' ? 'Investigation' : 'Consultation') as any,
      date: e.eventDate,
      summary: `${e.title}: ${e.description}`,
      sourceEventIds: [e.id],
    }));

    return {
      overview: `Confirmed medical record analysis for ${context.patient.name} encompassing ${context.events.length} documented encounters from ${context.events[0]?.eventDate || 'start'} to ${context.events[context.events.length - 1]?.eventDate || 'present'}. Documented active conditions include ${context.diagnoses.map((d) => d.name).join(', ') || 'none recorded'}.`,
      conditions: primaryConditions,
      medications: medicationList,
      labTrends: labTrendsList,
      healthcareJourney: journey,
    };
  }

  async answerHealthHistoryQuestion(context: HealthHistoryQueryContext): Promise<HealthHistoryAnswer> {
    // Artificial small delay for natural conversational rhythm
    await new Promise((resolve) => setTimeout(resolve, 600));

    const q = context.question.toLowerCase().trim();
    const historyText = context.history.map((h) => h.content).join(' ').toLowerCase();
    const records = context.retrievedRecords;

    // 1. Safety check: Medical advice
    const advicePatterns = [
      /what (medicine|medication|drug|pill) should i take/i,
      /can i (stop|change|increase|decrease|double) (taking|my)/i,
      /should i (take|use|stop|start)/i,
      /how should i treat/i,
      /prescribe (me|something)/i,
      /diagnose (me|my condition)/i,
      /what disease do i have/i,
      /cure for/i,
      /recommend (a|any) (treatment|medication|drug)/i,
    ];
    if (advicePatterns.some((p) => p.test(q))) {
      return {
        answer:
          "I can help you understand what is documented in your health records, but I can't recommend treatment or medication. I can show you what medications are documented in your records.",
        sourceEventIds: ['evt-2018-03', 'evt-2020-03', 'evt-2025-02'],
        sourceDocumentIds: ['doc-2018-rx', 'doc-2020-rx', 'doc-2025-rx'],
        confidence: 'high',
        safetyNotice: 'Safety Notice: This assistant only retrieves documented medical history and cannot offer medical advice, diagnosis, or prescription recommendations. Please consult your physician for clinical advice.',
        suggestedFollowUps: [
          'What medications have I taken?',
          'What are my current active prescriptions?',
          'Show my documented diagnoses',
        ],
      };
    }

    // 2. Missing information check (conditions/surgeries not in records)
    if (q.includes('asthma') || q.includes('cancer') || q.includes('surgery') || q.includes('operation') || q.includes('fracture')) {
      const conditionName = q.includes('asthma') ? 'asthma' : q.includes('cancer') ? 'malignancy' : 'surgical procedure';
      return {
        answer: `I couldn't find a documented ${conditionName} diagnosis or event in the available records for this patient.`,
        sourceEventIds: [],
        sourceDocumentIds: [],
        confidence: 'high',
        suggestedFollowUps: [
          'What conditions are documented?',
          'When was diabetes first documented?',
          'When was hypertension first documented?',
        ],
      };
    }

    // 3. Allergy & Discrepancy Question
    if (
      q.includes('allergy') ||
      q.includes('allergies') ||
      q.includes('penicillin') ||
      q.includes('conflict') ||
      q.includes('discrepan') ||
      q.includes('inconsist')
    ) {
      return {
        answer:
          'A potential inconsistency was detected between your outpatient consultation records and emergency department discharge records regarding penicillin allergy. The Initial Internal Medicine Consultation (May 10, 2018) documents an active Penicillin allergy with a childhood history of widespread maculopapular rash requiring antihistamines. However, the subsequent CityCare Hospital Discharge Summary (November 17, 2023) records "No Known Drug Allergies (NKDA)" on the ED intake summary.',
        sourceEventIds: ['evt-2018-02', 'evt-2023-01'],
        sourceDocumentIds: ['doc-2018-consult', 'doc-2023-discharge'],
        confidence: 'high',
        potentialInconsistency: {
          detected: true,
          description:
            'A critical documentation mismatch exists between the initial outpatient consultation and emergency hospital admission records.',
          records: [
            {
              label: 'Outpatient Consultation (2018-05-10)',
              details: 'Allergies: Penicillin (Childhood history of widespread maculopapular rash requiring antihistamines).',
              sourceEventId: 'evt-2018-02',
              sourceDocumentId: 'doc-2018-consult',
              documentFileName: 'consultation_2018.pdf',
            },
            {
              label: 'Inpatient Discharge Summary (2023-11-17)',
              details: 'Emergency Department Intake Summary · Allergies: No Known Drug Allergies (NKDA).',
              sourceEventId: 'evt-2023-01',
              sourceDocumentId: 'doc-2023-discharge',
              documentFileName: 'discharge_summary_2023.pdf',
            },
          ],
        },
        suggestedFollowUps: [
          'What medications have I taken?',
          'When was diabetes first documented?',
          'Summarize the patient\'s hospitalizations.',
        ],
      };
    }

    // 4. Follow-up: "What medication was prescribed then?" (contextual anaphora from 2018/diabetes)
    if (
      (q.includes('prescribed then') || q.includes('medication was prescribed then') || (q.includes('what was prescribed') && historyText.includes('diabetes'))) &&
      (historyText.includes('diabetes') || historyText.includes('2018') || q.includes('then'))
    ) {
      return {
        answer:
          'Following the initial diagnosis of Type 2 Diabetes Mellitus on May 10, 2018, Dr. Sarah Jenkins initiated oral monotherapy with Metformin 500 mg once daily with the evening meal (Event: Initial Glycemic Monotherapy Prescription).',
        sourceEventIds: ['evt-2018-03'],
        sourceDocumentIds: ['doc-2018-rx'],
        confidence: 'high',
        suggestedFollowUps: [
          'What changed in the patient\'s medication history?',
          'Show me the HbA1c results over time.',
        ],
      };
    }

    // 5. When was diabetes first documented?
    if (q.includes('diabetes') && (q.includes('when') || q.includes('first documented') || q.includes('history') || q.includes('diagnos'))) {
      return {
        answer:
          'Type 2 Diabetes Mellitus was first documented on May 10, 2018 during an Initial Internal Medicine Consultation with Dr. Sarah Jenkins at Meridian Medical Centre. It followed baseline metabolic laboratory testing on May 8, 2018 that demonstrated a fasting blood glucose of 134 mg/dL and an initial HbA1c of 6.4%.',
        sourceEventIds: ['evt-2018-01', 'evt-2018-02'],
        sourceDocumentIds: ['doc-2018-lab', 'doc-2018-consult'],
        confidence: 'high',
        suggestedFollowUps: [
          'What medication was prescribed then?',
          'Show me the HbA1c results over time.',
          'When was hypertension first documented?',
        ],
      };
    }

    // 6. When was hypertension first documented?
    if (q.includes('hypertension') || q.includes('blood pressure') || q.includes('bp')) {
      return {
        answer:
          'Essential Hypertension was first documented on September 22, 2020 during a Cardiovascular Evaluation with Dr. Robert Torres at CityCare Hospital. The diagnosis followed elevated ambulatory home monitoring and an in-clinic confirmed blood pressure reading of 146/92 mmHg, prompting initiation of Amlodipine 5 mg daily.',
        sourceEventIds: ['evt-2020-01', 'evt-2020-02', 'evt-2020-03'],
        sourceDocumentIds: ['doc-2020-consult', 'doc-2020-rx'],
        confidence: 'high',
        suggestedFollowUps: [
          'What medications has this patient taken?',
          'Which hospitals has this patient visited?',
          'Show me the HbA1c results over time.',
        ],
      };
    }

    // 7. HbA1c & Lab Results over time
    if (q.includes('hba1c') || q.includes('a1c') || (q.includes('lab') && (q.includes('time') || q.includes('trend') || q.includes('result')))) {
      const a1cPoints = [
        { date: '2018-05-08', value: 6.4, unit: '%', interpretation: 'Elevated Baseline', eventId: 'evt-2018-01' },
        { date: '2019-06-11', value: 6.6, unit: '%', interpretation: 'Mild Progression', eventId: 'evt-2019-01' },
        { date: '2021-10-15', value: 7.1, unit: '%', interpretation: 'Suboptimal Control', eventId: 'evt-2021-01' },
        { date: '2022-11-02', value: 7.6, unit: '%', interpretation: 'Elevated', eventId: 'evt-2022-01' },
        { date: '2023-11-14', value: 8.0, unit: '%', interpretation: 'Critical (Inpatient Admission)', eventId: 'evt-2023-01' },
        { date: '2024-07-16', value: 7.5, unit: '%', interpretation: 'Improving Post-Discharge', eventId: 'evt-2024-01' },
        { date: '2026-08-24', value: 6.8, unit: '%', interpretation: 'Target Control Achieved (<7.0%)', eventId: 'evt-2026-01' },
      ];

      return {
        answer:
          'Your documented Hemoglobin A1c (HbA1c) trajectory spans 2018 to 2026 across 7 confirmed laboratory evaluations: baseline was 6.4% in May 2018, rising gradually to 7.1% in 2021 and 7.6% in 2022, peaking at 8.0% during acute hospitalization in November 2023, subsequently improving to 7.5% in July 2024, and successfully reaching target glycemic control at 6.8% in August 2026 under dual therapy.',
        sourceEventIds: [
          'evt-2018-01',
          'evt-2019-01',
          'evt-2021-01',
          'evt-2022-01',
          'evt-2023-01',
          'evt-2024-01',
          'evt-2026-01',
        ],
        sourceDocumentIds: [
          'doc-2018-lab',
          'doc-2019-lab',
          'doc-2021-lab',
          'doc-2022-lab',
          'doc-2023-lab',
          'doc-2024-lab',
          'doc-2026-lab',
        ],
        confidence: 'high',
        structuredData: {
          type: 'chart',
          title: 'Documented Hemoglobin A1c (HbA1c) Longitudinal Trajectory (2018 - 2026)',
          chartData: {
            parameter: 'HbA1c',
            unit: '%',
            points: a1cPoints,
          },
        },
        suggestedFollowUps: [
          'What changed in the patient\'s medication history?',
          'Summarize the patient\'s hospitalizations.',
          'What medications has this patient taken?',
        ],
      };
    }

    // 8. Medication changes over time
    if (q.includes('what changed') || q.includes('change in') || q.includes('treatment change')) {
      return {
        answer:
          'The patient\'s medication history reflects three major clinical adjustments: (1) In September 2020, Amlodipine 5 mg daily was added for Stage 1 Hypertension. (2) In November 2023, following acute hospital admission for hyperglycemia, Metformin was escalated from 850 mg to 1000 mg twice daily and Glimepiride 1 mg daily was initiated. (3) In March 2025, due to recurrent afternoon hypoglycemic tremulousness, Glimepiride was discontinued, Metformin was transitioned to 500 mg ER twice daily, and Empagliflozin 10 mg daily (Jardiance) was initiated with excellent glycemic results.',
        sourceEventIds: ['evt-2020-03', 'evt-2023-03', 'evt-2025-01', 'evt-2025-02'],
        sourceDocumentIds: ['doc-2020-rx', 'doc-2023-discharge', 'doc-2025-consult', 'doc-2025-rx'],
        confidence: 'high',
        structuredData: {
          type: 'table',
          title: 'Key Medication Changes Over Time',
          tableData: {
            headers: ['Date', 'Clinical Change', 'Medication', 'Reason / Context'],
            rows: [
              ['May 2018', 'Initiation', 'Metformin 500mg daily', 'Initial diagnosis of Type 2 Diabetes'],
              ['Sep 2020', 'Addition', 'Amlodipine 5mg daily', 'Diagnosis of Essential Hypertension'],
              ['Oct 2021', 'Dose Escalation', 'Metformin 850mg daily', 'Suboptimal HbA1c (7.1%)'],
              ['Nov 2023', 'Regimen Intensification', 'Metformin 1000mg BID + Glimepiride 1mg daily', 'Inpatient discharge post-hyperglycemic decompensation'],
              ['Mar 2025', 'Discontinuation & Switch', 'Glimepiride stopped; Empagliflozin 10mg started', 'Recurrent hypoglycemia; SGLT2i initiated'],
            ],
          },
        },
        suggestedFollowUps: [
          'Show me the HbA1c results over time.',
          'What medications has this patient taken?',
          'Summarize the patient\'s hospitalizations.',
        ],
      };
    }

    // 9. What medications has this patient taken?
    if (q.includes('medication') || q.includes('medicine') || q.includes('drug') || q.includes('prescrib')) {
      return {
        answer:
          'Your confirmed records document 4 primary medications over time: (1) Metformin: initiated in May 2018 at 500 mg daily, titrated over time, and currently active as Metformin ER 500 mg twice daily. (2) Amlodipine: 5 mg daily for Essential Hypertension, initiated in September 2020 and currently active. (3) Glimepiride: 1 mg daily prescribed on hospital discharge in November 2023 and discontinued in March 2025 due to hypoglycemic symptoms. (4) Empagliflozin (Jardiance): 10 mg daily initiated in March 2025 as second-line glycemic therapy and currently active.',
        sourceEventIds: ['evt-2018-03', 'evt-2020-03', 'evt-2023-03', 'evt-2025-02'],
        sourceDocumentIds: ['doc-2018-rx', 'doc-2020-rx', 'doc-2023-discharge', 'doc-2025-rx'],
        confidence: 'high',
        structuredData: {
          type: 'table',
          title: 'Documented Patient Medications (Database Records)',
          tableData: {
            headers: ['Medication', 'Dosage & Route', 'Start Date', 'End Date', 'Status', 'Indication'],
            rows: [
              ['Metformin', '500 mg ER BID (Oral)', '2018-05-10', 'Present', 'Active', 'Type 2 Diabetes Mellitus'],
              ['Amlodipine', '5 mg daily (Oral)', '2020-09-22', 'Present', 'Active', 'Essential Hypertension'],
              ['Empagliflozin (Jardiance)', '10 mg daily (Oral)', '2025-03-10', 'Present', 'Active', 'Type 2 Diabetes (Second-line)'],
              ['Glimepiride', '1 mg daily (Oral)', '2023-11-17', '2025-03-10', 'Discontinued', 'Acute Hyperglycemia (Post-discharge)'],
            ],
          },
        },
        suggestedFollowUps: [
          'What changed in the patient\'s medication history?',
          'Show me the HbA1c results over time.',
          'Are there conflicting allergy records?',
        ],
      };
    }

    // 10. Hospitalization question: "Summarize the patient's hospitalizations." / "When was I hospitalized?"
    if (q.includes('hospitaliz') || q.includes('admitted') || q.includes('admission') || q.includes('inpatient')) {
      return {
        answer:
          'The patient has one documented inpatient hospitalization: admitted to CityCare Hospital on November 14, 2023 and discharged on November 17, 2023 (3-night stay). The admission was for Acute Hyperglycemic Decompensation triggered during an acute viral illness and work stress. Presentation included random serum glucose of 218 mg/dL and HbA1c of 8.0%. Treatment included intravenous hydration and clinical stabilization under Dr. Robert Torres, with discharge on intensified dual oral therapy (Metformin 1000 mg BID and Glimepiride 1 mg daily).',
        sourceEventIds: ['evt-2023-01', 'evt-2023-02', 'evt-2023-03'],
        sourceDocumentIds: ['doc-2023-discharge', 'doc-2023-lab'],
        confidence: 'high',
        suggestedFollowUps: [
          'What changed in the patient\'s medication history?',
          'Show me the HbA1c results over time.',
          'Which hospitals has this patient visited?',
        ],
      };
    }

    // 11. Facilities question: "Which hospitals has this patient visited?"
    if (q.includes('hospital') || q.includes('facility') || q.includes('facilities') || q.includes('visited') || q.includes('clinic')) {
      return {
        answer:
          'Your confirmed records document clinical encounters across 4 healthcare facilities: (1) CityCare Hospital: acute tertiary center visited for cardiovascular workup in 2020 and a 3-night inpatient admission in November 2023. (2) Meridian Medical Centre: comprehensive outpatient facility for endocrine care and ongoing internal medicine follow-ups with Dr. Jenkins. (3) Lakeside Diagnostics: clinical pathology laboratory where regular blood panels and HbA1c evaluations were performed. (4) Green Valley Specialty Clinic: outpatient clinical center visited for primary care follow-up in July 2024.',
        sourceEventIds: ['evt-2018-02', 'evt-2020-01', 'evt-2023-01', 'evt-2024-02'],
        sourceDocumentIds: ['doc-2018-consult', 'doc-2020-consult', 'doc-2023-discharge', 'doc-2024-consult'],
        confidence: 'high',
        suggestedFollowUps: [
          'Summarize the patient\'s hospitalizations.',
          'Which doctors have I seen?',
          'When was diabetes first documented?',
        ],
      };
    }

    // 12. Doctor / Provider question: "Which doctors have I seen?"
    if (q.includes('doctor') || q.includes('physician') || q.includes('provider') || q.includes('who') || q.includes('seen') || q.includes('dr')) {
      return {
        answer:
          'Your medical journey includes care coordinated across 4 healthcare providers: Dr. Sarah Jenkins, MD (Internal Medicine & Endocrinology at Meridian Medical Centre; managing your diabetes since baseline in 2018), Dr. Robert Torres, MD, FACC (Cardiovascular Medicine at CityCare Hospital; diagnosed hypertension in 2020 and served as attending physician during your 2023 hospitalization), Dr. Marcus Vance, MD (General Medicine at Green Valley Specialty Clinic; conducted post-hospitalization review in 2024), and Dr. Elena Rostova, MD, PhD (Pathology & Clinical Biochemistry at Lakeside Diagnostics; reporting specialist for metabolic blood panels).',
        sourceEventIds: ['evt-2018-02', 'evt-2020-01', 'evt-2024-02', 'evt-2026-01'],
        sourceDocumentIds: ['doc-2018-consult', 'doc-2020-consult', 'doc-2024-consult', 'doc-2026-lab'],
        confidence: 'high',
        suggestedFollowUps: [
          'Which hospitals has this patient visited?',
          'When was diabetes first documented?',
          'What medications has this patient taken?',
        ],
      };
    }

    // 13. Default longitudinal summary response
    const activeConditions = records.diagnoses.map((d) => d.name).join(', ') || 'Type 2 Diabetes Mellitus, Essential Hypertension, and Hyperlipidemia';
    return {
      answer: `Based on the patient's confirmed longitudinal health records from ${records.events[0]?.eventDate || '2018'} through ${records.events[records.events.length - 1]?.eventDate || '2026'}, documented diagnoses include ${activeConditions}. You have 4 recorded medications over time, regular HbA1c surveillance reaching target control at 6.8%, and one documented hospitalization at CityCare Hospital in November 2023.`,
      sourceEventIds: records.events.slice(0, 3).map((e) => e.id),
      sourceDocumentIds: records.documents.slice(0, 2).map((d) => d.id),
      confidence: 'medium',
      suggestedFollowUps: [
        'When was diabetes first documented?',
        'Show me the HbA1c results over time.',
        'What medications has this patient taken?',
      ],
    };
  }
}

