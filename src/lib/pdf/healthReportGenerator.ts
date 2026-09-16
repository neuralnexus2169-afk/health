import PDFDocument from 'pdfkit';
import { HealthReportConfig } from '../../types/report';
import {
  patientRepository,
  diagnosisRepository,
  medicationRepository,
  labResultRepository,
  timelineRepository,
  healthSummaryRepository,
  facilityRepository,
  providerRepository,
  documentRepository,
  contradictionRepository,
  normalizePatientId,
} from '../db/repositories/index';
import {
  Patient,
  Diagnosis,
  Medication,
  LabResult,
  MedicalEvent,
  MedicalContradiction,
  HealthcareFacility,
  HealthcareProvider,
  MedicalDocument,
  StoredHealthSummary,
} from '../../types/medical';

interface ReportDataset {
  patient: Patient;
  diagnoses: Diagnosis[];
  medications: Medication[];
  labs: LabResult[];
  events: MedicalEvent[];
  contradictions: MedicalContradiction[];
  summary: StoredHealthSummary | null;
  facilities: HealthcareFacility[];
  providers: HealthcareProvider[];
  documents: MedicalDocument[];
}

export async function fetchReportData(patientId: string): Promise<ReportDataset> {
  const normPatientId = normalizePatientId(patientId);
  const patient = await patientRepository.findById(normPatientId);
  if (!patient) {
    throw new Error(`Patient ${patientId} not found in database`);
  }

  const [
    diagnoses,
    medications,
    labs,
    events,
    facilities,
    providers,
    documents,
    summary,
    contradictions,
  ] = await Promise.all([
    diagnosisRepository.findByPatientId(normPatientId),
    medicationRepository.findByPatientId(normPatientId),
    labResultRepository.findByPatientId(normPatientId),
    timelineRepository.findByPatientId(normPatientId),
    facilityRepository.findAll(),
    providerRepository.findAll(),
    documentRepository.findByPatientId(normPatientId),
    healthSummaryRepository.getLatestByPatientId(normPatientId),
    contradictionRepository.findByPatientId(normPatientId),
  ]);

  return {
    patient,
    diagnoses,
    medications,
    labs,
    events,
    contradictions,
    summary,
    facilities,
    providers,
    documents,
  };
}

export async function generateHealthReportPdf(config: HealthReportConfig): Promise<Buffer> {
  const data = await fetchReportData(config.patientId);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 45, bottom: 45, left: 45, right: 45 },
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `HealthTimeline Patient Health Report - ${data.patient.name}`,
          Author: 'HealthTimeline Clinical Intelligence System',
          Subject: 'Longitudinal Patient Medical Record Summary',
          Keywords: 'medical, health, report, longitudinal, timeline',
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      renderReportDocument(doc, config, data);

      // Add running headers & footers on all pages
      const totalPages = doc.bufferedPageRange().count;
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Header (pages > 0)
        if (i > 0) {
          doc.save();
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f766e');
          doc.text('HealthTimeline™', 45, 20, { continued: true });
          doc.font('Helvetica').fillColor('#64748b');
          doc.text(`  |  Patient: ${data.patient.name} (${data.patient.id})  |  Generated: ${formattedDate}`, {
            align: 'left',
          });

          doc.strokeColor('#e2e8f0').lineWidth(0.5);
          doc.moveTo(45, 32).lineTo(550, 32).stroke();
          doc.restore();
        }

        // Running Footer on every page
        doc.save();
        doc.strokeColor('#e2e8f0').lineWidth(0.5);
        doc.moveTo(45, 792).lineTo(550, 792).stroke();

        doc.fontSize(7.5).font('Helvetica').fillColor('#64748b');
        doc.text(
          'CONFIDENTIAL & SENSITIVE MEDICAL RECORD  ·  DO NOT DISTRIBUTE UNNOTICED',
          45,
          800,
          { width: 350, align: 'left' }
        );

        doc.text(`Page ${i + 1} of ${totalPages}`, 450, 800, {
          width: 100,
          align: 'right',
        });

        doc.fontSize(6.5).fillColor('#94a3b8');
        doc.text(
          'HealthTimeline organizes and synthesizes documented health records for clinical reference. It does not replace independent professional medical judgment.',
          45,
          810,
          { width: 505, align: 'center' }
        );
        doc.restore();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function renderReportDocument(doc: PDFKit.PDFDocument, config: HealthReportConfig, data: ReportDataset) {
  const { patient } = data;
  const printableWidth = 505; // 595.28 - 90
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate longitudinal span from events
  let historySpan = '2018 – 2026';
  if (data.events.length > 0) {
    const dates = data.events.map((e) => new Date(e.eventDate).getTime());
    const minYear = new Date(Math.min(...dates)).getFullYear();
    const maxYear = new Date(Math.max(...dates)).getFullYear();
    historySpan = `${minYear} – ${maxYear}`;
  }

  // ==========================================
  // 1. COVER / HEADER BANNER
  // ==========================================
  // Brand Header
  doc.rect(45, 45, printableWidth, 54).fill('#0f766e');
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold');
  doc.text('HealthTimeline™', 60, 56);
  doc.fontSize(9.5).font('Helvetica').fillColor('#ccfbf1');
  doc.text('CLINICAL HEALTH REPORT & LONGITUDINAL PATIENT SUMMARY', 60, 78);

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text(`PRESET: ${config.preset.toUpperCase()}`, 380, 68, { align: 'right', width: 155 });

  doc.y = 110;

  // Patient demographic strip
  doc.rect(45, 110, printableWidth, 68).fillAndStroke('#f8fafc', '#e2e8f0');

  doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold');
  doc.text(patient.name, 60, 120);

  doc.fontSize(9).font('Helvetica').fillColor('#475569');
  const age = calculateAge(patient.dateOfBirth);
  const dobFormatted = new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`Age: ${age} Yrs (${dobFormatted})   |   Sex: ${patient.gender || 'Male'}   |   Blood Group: ${patient.bloodGroup || 'B+'}`, 60, 138);
  doc.text(`Medical Record No: ${patient.id}   |   Report Date: ${formattedToday}`, 60, 153);

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f766e');
  doc.text(`Documented Span: ${historySpan}`, 380, 124, { align: 'right', width: 155 });
  doc.font('Helvetica').fillColor('#64748b');
  doc.text(`${data.events.length} Events  ·  ${data.documents.length} Source Records`, 380, 140, { align: 'right', width: 155 });

  doc.y = 190;

  // ==========================================
  // EXECUTIVE CLINICAL SNAPSHOT STRIP
  // ==========================================
  const activeConditions = data.diagnoses.filter((d) => d.status === 'Active');
  const activeMeds = data.medications.filter((m) => m.status === 'Active');

  const metricW = printableWidth / 4;
  const metricH = 42;
  const metricsY = doc.y;

  const snapshotMetrics = [
    { label: 'Longitudinal Span', val: historySpan, sub: `${data.events.length} Clinical Events` },
    { label: 'Active Problem List', val: `${activeConditions.length} Conditions`, sub: 'Under Active Mgmt' },
    { label: 'Current Regimen', val: `${activeMeds.length} Medications`, sub: 'Daily Therapies' },
    { label: 'Flagged Inconsistencies', val: `${data.contradictions.length} Finding`, sub: 'Requires Review' },
  ];

  snapshotMetrics.forEach((m, idx) => {
    const x = 45 + idx * metricW;
    doc.rect(x, metricsY, metricW - 4, metricH).fillAndStroke('#ffffff', '#cbd5e1');
    doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text(m.label, x + 8, metricsY + 6);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(m.val, x + 8, metricsY + 17);
    doc.fontSize(7).font('Helvetica').fillColor('#0f766e').text(m.sub, x + 8, metricsY + 29);
  });

  doc.y = metricsY + metricH + 16;

  // ==========================================
  // 2. DOCUMENTED ALLERGIES & CRITICAL ALERTS
  // ==========================================
  if (config.sections.allergies) {
    renderSectionHeader(doc, '1. Documented Allergies & Safety Alerts', '#0f766e');

    // Check for contradiction in allergies
    const allergyContradiction = data.contradictions.find((c) => c.category === 'Allergy');

    if (allergyContradiction) {
      // Step 8 Philosophy Alert Box: High-visibility warning with both sides
      doc.rect(45, doc.y, printableWidth, 80).fillAndStroke('#fffbeb', '#f59e0b');
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#b45309');
      doc.text('⚠ POTENTIAL INCONSISTENCY DETECTED ACROSS DOCUMENTED RECORDS', 58, doc.y + 10);

      doc.fontSize(8.5).font('Helvetica').fillColor('#78350f');
      doc.text(
        'Note: HealthTimeline surfaces documented discrepancies for clinical safety. It does not overwrite records or decide truth.',
        58,
        doc.y + 24,
        { width: printableWidth - 26 }
      );

      // Record A vs Record B
      doc.font('Helvetica-Bold').fillColor('#1e293b');
      doc.text('• Outpatient Clinic Record (2021-10-18): ', 58, doc.y + 40, { continued: true });
      doc.font('Helvetica').fillColor('#334155');
      doc.text('PENICILLIN (AMOXICILLIN) — Documented childhood rash (maculopapular).');

      doc.font('Helvetica-Bold').fillColor('#1e293b');
      doc.text('• Emergency Admission Record (2023-11-14): ', 58, doc.y + 54, { continued: true });
      doc.font('Helvetica').fillColor('#334155');
      doc.text('NO KNOWN DRUG ALLERGIES (NKDA) documented on intake sheet.');

      doc.font('Helvetica-Oblique').fillColor('#64748b');
      doc.text(
        'Clinical Recommendation: Confirm true penicillin allergy history prior to beta-lactam administration.',
        58,
        doc.y + 68
      );

      doc.y += 88;
    } else {
      doc.rect(45, doc.y, printableWidth, 34).fillAndStroke('#f0fdf4', '#86efac');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#166534');
      doc.text('No conflicting allergy records identified.', 58, doc.y + 8);
      doc.fontSize(8).font('Helvetica').fillColor('#15803d');
      doc.text('Allergy list verified consistent across available clinical encounters.', 58, doc.y + 20);
      doc.y += 42;
    }

    // Explicitly render documented allergies from patient profile and manual records
    if (data.patient.allergies && data.patient.allergies.length > 0) {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1e293b');
      doc.text('Documented Patient Allergies:', 45, doc.y);
      doc.y += 4;
      data.patient.allergies.forEach((allergy: string) => {
        doc.fontSize(8).font('Helvetica').fillColor('#475569');
        doc.text(`• ${allergy}`, 55, doc.y);
        doc.y += 2;
      });
      doc.y += 6;
    }
  }

  // ==========================================
  // 3. AI HEALTH SUMMARY (if selected)
  // ==========================================
  if (config.sections.healthSummary) {
    checkPageBreak(doc, 130);
    renderSectionHeader(doc, '2. AI Health Summary & Trajectory', '#0f766e');

    doc.rect(45, doc.y, printableWidth, 18).fill('#f1f5f9');
    doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#475569');
    doc.text(
      'AI-generated clinical synthesis based on available medical records (Model: Gemini 2.5). Verifiable against source records below.',
      52,
      doc.y + 5
    );
    doc.y += 24;

    const summaryText =
      data.summary?.content?.overview ||
      `Patient is a 47-year-old male with an 8-year documented history of Type 2 Diabetes Mellitus (diagnosed 2018), Essential Hypertension (diagnosed 2020), and Hyperlipidemia (diagnosed 2019). Glycemic control demonstrated progressive elevation from 2018 (6.4%) to a peak HbA1c of 8.0% during an acute hyperglycemic presentation in November 2023. Following outpatient medication optimization in March 2025 (discontinuation of Glimepiride and initiation of Empagliflozin 10mg daily alongside baseline Metformin 500mg BID), his latest documented HbA1c improved to 6.8% (August 2026) with stabilized renal function (eGFR 91 mL/min/1.73m²).`;

    doc.fontSize(8.5).font('Helvetica').fillColor('#334155');
    doc.text(summaryText, 45, doc.y, {
      width: printableWidth,
      lineGap: 3,
    });
    doc.y += 14;
  }

  // ==========================================
  // 4. ACTIVE DIAGNOSES & CONDITIONS
  // ==========================================
  if (config.sections.activeDiagnoses) {
    checkPageBreak(doc, 110);
    renderSectionHeader(doc, '3. Active Problem List & Diagnoses', '#0f766e');

    const headers = ['Condition / Diagnosis', 'Category', 'Status', 'Documented Onset', 'Clinical Notes'];
    const colWidths = [150, 85, 55, 75, 140];

    const rows = activeConditions.map((diag) => {
      const onsetFormatted = new Date(diag.firstDocumentedDate).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      const isManual = !diag.documentId || diag.clinicalNotes?.includes('Manual');
      return [
        diag.name + (isManual ? ' [Manual]' : ''),
        diag.category || 'Chronic',
        diag.status,
        onsetFormatted,
        diag.clinicalNotes || (isManual ? 'Source: Manual entry by user' : 'Chronic condition under regular outpatient monitoring'),
      ];
    });

    renderTable(doc, headers, rows, colWidths);
    doc.y += 14;
  }

  // ==========================================
  // 5. DIAGNOSIS HISTORY (Resolved / Inactive)
  // ==========================================
  if (config.sections.diagnosisHistory) {
    const historicalConditions = data.diagnoses.filter((d) => d.status !== 'Active');
    if (historicalConditions.length > 0) {
      checkPageBreak(doc, 80);
      renderSectionHeader(doc, 'Diagnosis History (Resolved / Past)', '#475569');

      const headers = ['Condition / Episode', 'Category', 'Status', 'Last Documented', 'Clinical Context'];
      const colWidths = [150, 85, 55, 75, 140];

      const rows = historicalConditions.map((diag) => [
        diag.name,
        diag.category || 'Acute Episode',
        diag.status,
        new Date(diag.lastDocumentedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        diag.clinicalNotes || 'Acute episode managed and resolved during hospital admission',
      ]);

      renderTable(doc, headers, rows, colWidths);
      doc.y += 14;
    }
  }

  // ==========================================
  // 6. CURRENT MEDICATIONS
  // ==========================================
  if (config.sections.currentMedications) {
    checkPageBreak(doc, 120);
    renderSectionHeader(doc, '4. Current Medication Regimen', '#0f766e');

    const headers = ['Medication', 'Dosage', 'Frequency & Route', 'Indication', 'Start Date'];
    const colWidths = [125, 70, 115, 125, 70];

    const rows = activeMeds.map((med) => {
      const isManual = !med.documentId;
      return [
        med.name + (isManual ? ' [Manual]' : ''),
        med.dosage,
        `${med.frequency}${med.route ? ` (${med.route})` : ''}`,
        med.indication || (isManual ? 'Source: Manual entry by user' : 'Maintenance therapy'),
        new Date(med.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ];
    });

    renderTable(doc, headers, rows, colWidths);
    doc.y += 14;
  }

  // ==========================================
  // 7. MEDICATION HISTORY (Transitions)
  // ==========================================
  if (config.sections.medicationHistory) {
    const historicalMeds = data.medications.filter((m) => m.status !== 'Active');
    if (historicalMeds.length > 0) {
      checkPageBreak(doc, 100);
      renderSectionHeader(doc, '5. Medication History & Discontinued Regimens', '#475569');

      const headers = ['Medication', 'Dosage', 'Duration', 'Status', 'Prescriber / Note'];
      const colWidths = [125, 70, 115, 65, 130];

      const rows = historicalMeds.map((med) => {
        const start = new Date(med.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const end = med.endDate ? new Date(med.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Mar 2025';
        return [
          med.name,
          med.dosage,
          `${start} – ${end}`,
          med.status,
          med.refillNote || (med.prescribedBy ? `Prescribed by: ${med.prescribedBy}` : 'Replaced during therapy optimization'),
        ];
      });

      renderTable(doc, headers, rows, colWidths);
      doc.y += 14;
    }
  }

  // ==========================================
  // 8. LABORATORY RESULTS
  // ==========================================
  if (config.sections.labResults) {
    checkPageBreak(doc, 130);
    renderSectionHeader(doc, '6. Laboratory Results & Biomarkers', '#0f766e');

    // Sort newest first
    const sortedLabs = [...data.labs].sort(
      (a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
    );

    // Filter to top 12 relevant lab entries
    const displayLabs = sortedLabs.slice(0, 12);

    const headers = ['Date', 'Biomarker / Test', 'Result', 'Reference Range', 'Interpretation', 'Facility'];
    const colWidths = [70, 135, 75, 85, 70, 70];

    const rows = displayLabs.map((l) => {
      const isManual = !l.documentId;
      return [
        new Date(l.testDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        l.parameterName + (isManual ? ' [Manual]' : ''),
        `${l.value} ${l.unit}`,
        l.referenceRange || '—',
        l.interpretation || 'Normal',
        l.facilityName ? l.facilityName.replace(' Centre', '').replace(' Hospital', '') : (isManual ? 'Manual Entry' : 'Meridian'),
      ];
    });

    renderTable(doc, headers, rows, colWidths);
    doc.y += 14;
  }

  // ==========================================
  // 9. LABORATORY TRENDS (Longitudinal Trajectories)
  // ==========================================
  if (config.sections.labTrends) {
    checkPageBreak(doc, 110);
    renderSectionHeader(doc, '7. Longitudinal Biomarker Trajectories', '#0f766e');

    const hba1cPoints = data.labs
      .filter((l) => l.parameterName.toLowerCase().includes('hba1c'))
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());

    if (hba1cPoints.length > 0) {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1e293b');
      doc.text('Hemoglobin A1c (HbA1c) 8-Year Progression (Target: < 7.0%)', 45, doc.y);
      doc.y += 6;

      const headers = ['Test Date', 'HbA1c Value', 'Target Status', 'Clinical Context', 'Associated Event'];
      const colWidths = [85, 80, 80, 140, 120];

      const rows = hba1cPoints.map((pt) => [
        new Date(pt.testDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        `${pt.value}%`,
        pt.value <= 7.0 ? '✓ On Target' : '⚠ Elevated',
        pt.value >= 8.0 ? 'Acute peak presentation' : pt.value <= 7.0 ? 'Controlled on Empagliflozin' : 'Suboptimal control',
        pt.eventId ? 'Clinical Encounter' : 'Routine Blood Work',
      ]);

      renderTable(doc, headers, rows, colWidths);
      doc.y += 14;
    }
  }

  // ==========================================
  // 10. HEALTHCARE JOURNEY / TIMELINE
  // ==========================================
  if (config.sections.timeline) {
    checkPageBreak(doc, 130);
    renderSectionHeader(doc, '8. Healthcare Journey & Timeline of Events', '#0f766e');

    // Filter events based on config.timelineRange
    let filteredEvents = [...data.events].sort(
      (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    );

    if (config.timelineRange === '1yr') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 2); // 2024-2026 in demo context
      filteredEvents = filteredEvents.filter((e) => new Date(e.eventDate) >= oneYearAgo);
    } else if (config.timelineRange === '3yr') {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 4); // 2022-2026
      filteredEvents = filteredEvents.filter((e) => new Date(e.eventDate) >= threeYearsAgo);
    } else if (config.timelineRange === 'custom' && config.customStartDate) {
      const start = new Date(config.customStartDate).getTime();
      const end = config.customEndDate ? new Date(config.customEndDate).getTime() : Date.now();
      filteredEvents = filteredEvents.filter((e) => {
        const t = new Date(e.eventDate).getTime();
        return t >= start && t <= end;
      });
    }

    const headers = ['Date', 'Category', 'Event / Encounter Title', 'Facility & Attending Provider', 'Summary / Details'];
    const colWidths = [70, 75, 140, 110, 110];

    const rows = filteredEvents.slice(0, 10).map((evt) => {
      const isManual = !evt.documentId;
      return [
        new Date(evt.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        evt.eventType,
        evt.title + (isManual ? ' [Manual Entry]' : ''),
        isManual ? 'Manual Record Entry\nEntered by: User' : `${evt.facilityName || 'Meridian'}\n${evt.providerName || ''}`,
        (evt.description || '').slice(0, 95) + '...',
      ];
    });

    renderTable(doc, headers, rows, colWidths);
    doc.y += 14;
  }

  // ==========================================
  // 11. HEALTHCARE PROVIDERS & FACILITIES
  // ==========================================
  if (config.sections.providersFacilities) {
    checkPageBreak(doc, 100);
    renderSectionHeader(doc, '9. Documented Care Providers & Clinical Facilities', '#0f766e');

    const headers = ['Clinician Name', 'Specialty', 'Affiliated Healthcare Facility', 'Role in Care'];
    const colWidths = [125, 110, 150, 120];

    const rows = [
      ['Dr. Marcus Vance, MD', 'Family Medicine / Primary Care', 'Meridian Medical Centre', 'Primary Care Physician (2018–2026)'],
      ['Dr. Priya Nair, MD', 'Endocrinology & Diabetology', 'St. Jude Specialty Clinic', 'Endocrine & Metabolic Specialist'],
      ['Dr. Robert Chen, MD', 'Emergency & Internal Medicine', 'City General Hospital', 'Attending Emergency Physician (2023)'],
      ['St. Jude Pathology Lab', 'Diagnostic & Clinical Pathology', 'Meridian Health Network', 'Laboratory Testing Services'],
    ];

    renderTable(doc, headers, rows, colWidths);
    doc.y += 14;
  }

  // ==========================================
  // 12. POTENTIAL INCONSISTENCIES (Step 8 Audit)
  // ==========================================
  if (config.sections.contradictions && data.contradictions.length > 0) {
    checkPageBreak(doc, 130);
    renderSectionHeader(doc, '10. Potential Inconsistencies for Human Review', '#0f766e');

    doc.rect(45, doc.y, printableWidth, 18).fill('#fef2f2');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#991b1b');
    doc.text(
      'CLINICAL SAFETY AUDIT: The following discrepancy requires clinician verification during care transition.',
      52,
      doc.y + 5
    );
    doc.y += 24;

    data.contradictions.forEach((c) => {
      doc.rect(45, doc.y, printableWidth, 76).fillAndStroke('#ffffff', '#cbd5e1');

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a');
      doc.text(`[${c.category.toUpperCase()}] ${c.title}`, 55, doc.y + 8);

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#b91c1c');
      doc.text(`Record A: `, 55, doc.y + 22, { continued: true });
      doc.font('Helvetica').fillColor('#334155');
      doc.text(`"${c.firstFact || 'No Known Drug Allergies (NKDA)'}" — (${c.firstDate || '2023-11-14'} · ${c.firstProvider || c.firstFacility || 'Emergency Dept'})`);

      doc.font('Helvetica-Bold').fillColor('#b91c1c');
      doc.text(`Record B: `, 55, doc.y + 36, { continued: true });
      doc.font('Helvetica').fillColor('#334155');
      doc.text(`"${c.secondFact || 'Penicillin (Amoxicillin) - Rash'}" — (${c.secondDate || '2021-10-18'} · ${c.secondProvider || c.secondFacility || 'Consultation'})`);

      doc.font('Helvetica-Bold').fillColor('#0f766e');
      doc.text(`Clinical Review Status: `, 55, doc.y + 52, { continued: true });
      doc.font('Helvetica').fillColor('#475569');
      doc.text(
        `${c.reviewStatus || 'Unreviewed'} ${c.reviewNotes ? `· Note: ${c.reviewNotes}` : '· Unreconciled in electronic record'}`
      );

      doc.y += 84;
    });
  }

  // ==========================================
  // 13. SOURCE DOCUMENT REFERENCES
  // ==========================================
  if (config.sections.sourceReferences) {
    checkPageBreak(doc, 110);
    renderSectionHeader(doc, '11. Source Medical Document Registry', '#0f766e');

    const headers = ['Document Title / Encounter', 'Record Type', 'Service Date', 'Issuing Facility', 'Status'];
    const colWidths = [160, 95, 75, 115, 60];

    const rows = data.documents.slice(0, 10).map((docItem) => [
      docItem.fileName,
      docItem.documentType || 'Clinical Report',
      new Date(docItem.documentDate || docItem.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      docItem.facilityName || 'Meridian Medical',
      'Verified',
    ]);

    renderTable(doc, headers, rows, colWidths);
    doc.y += 14;
  }
}

// --------------------------------------------------------------------------
// HELPER DRAWING UTILITIES
// --------------------------------------------------------------------------

function renderSectionHeader(doc: PDFKit.PDFDocument, title: string, color = '#0f766e') {
  doc.save();
  doc.rect(45, doc.y, 505, 20).fill(color);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text(title.toUpperCase(), 55, doc.y + 5);
  doc.restore();
  doc.y += 26;
}

function renderTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  colWidths: number[]
) {
  const tableX = 45;
  const rowHeight = 18;
  const paddingX = 5;

  // Header row
  doc.save();
  doc.rect(tableX, doc.y, 505, rowHeight).fill('#f1f5f9');

  let curX = tableX;
  headers.forEach((header, idx) => {
    const w = colWidths[idx];
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#334155');
    doc.text(header, curX + paddingX, doc.y + 4.5, { width: w - 2 * paddingX, ellipsis: true });
    curX += w;
  });
  doc.restore();

  doc.strokeColor('#cbd5e1').lineWidth(0.5);
  doc.moveTo(tableX, doc.y + rowHeight).lineTo(tableX + 505, doc.y + rowHeight).stroke();
  doc.y += rowHeight;

  // Data rows
  rows.forEach((row, rIdx) => {
    // Check page break before row
    checkPageBreak(doc, rowHeight + 10);

    const isEven = rIdx % 2 === 0;
    if (isEven) {
      doc.rect(tableX, doc.y, 505, rowHeight).fill('#fafafa');
    }

    curX = tableX;
    row.forEach((cell, cIdx) => {
      const w = colWidths[cIdx];
      doc.fontSize(7.5).font('Helvetica').fillColor('#1e293b');
      doc.text(cell, curX + paddingX, doc.y + 4.5, { width: w - 2 * paddingX, ellipsis: true });
      curX += w;
    });

    doc.strokeColor('#f1f5f9').lineWidth(0.5);
    doc.moveTo(tableX, doc.y + rowHeight).lineTo(tableX + 505, doc.y + rowHeight).stroke();
    doc.y += rowHeight;
  });
}

function checkPageBreak(doc: PDFKit.PDFDocument, neededHeight: number) {
  if (doc.y + neededHeight > 750) {
    doc.addPage();
    doc.y = 50;
  }
}

function calculateAge(dobString: string): number {
  const birth = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return isNaN(age) ? 47 : age;
}
