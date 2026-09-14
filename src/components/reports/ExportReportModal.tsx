import React, { useState, useEffect } from 'react';
import {
  X,
  FileDown,
  Check,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  Layers,
  Stethoscope,
  Pill,
  Activity,
  User,
  ShieldCheck,
  Download,
  ExternalLink,
  RotateCcw,
  Building2,
} from 'lucide-react';
import {
  HealthReportConfig,
  ReportPreset,
  ReportSections,
  TimelineRangeOption,
  PRESET_CONFIGURATIONS,
} from '../../types/report';
import { generatePdfReport, GeneratedReportResponse } from '../../services/reportService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PatientProfile } from '../../types';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: PatientProfile;
  initialPreset?: ReportPreset;
}

interface SectionOption {
  key: keyof ReportSections;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'core' | 'clinical' | 'diagnostics' | 'audit';
}

const SECTION_OPTIONS: SectionOption[] = [
  {
    key: 'patientInfo',
    label: 'Patient Overview',
    description: 'Demographics, medical record number, and verified history span',
    icon: <User className="w-4 h-4 text-teal-600" />,
    category: 'core',
  },
  {
    key: 'allergies',
    label: 'Documented Allergies & Alerts',
    description: 'Documented allergy list with side-by-side discrepancy notices',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    category: 'core',
  },
  {
    key: 'healthSummary',
    label: 'AI Health Summary',
    description: 'Longitudinal clinical synthesis with AI-attribution label',
    icon: <Sparkles className="w-4 h-4 text-purple-600" />,
    category: 'core',
  },
  {
    key: 'activeDiagnoses',
    label: 'Active Problem List & Diagnoses',
    description: 'Active chronic conditions with documented onset and notes',
    icon: <Stethoscope className="w-4 h-4 text-emerald-600" />,
    category: 'clinical',
  },
  {
    key: 'diagnosisHistory',
    label: 'Diagnosis History',
    description: 'Resolved past episodes and acute admission diagnoses',
    icon: <Clock className="w-4 h-4 text-zinc-500" />,
    category: 'clinical',
  },
  {
    key: 'currentMedications',
    label: 'Current Medication Regimen',
    description: 'Active medications, exact dosages, frequencies, and routes',
    icon: <Pill className="w-4 h-4 text-blue-600" />,
    category: 'clinical',
  },
  {
    key: 'medicationHistory',
    label: 'Medication History',
    description: 'Therapy transitions, dosage adjustments, and discontinued drugs',
    icon: <RotateCcw className="w-4 h-4 text-indigo-500" />,
    category: 'clinical',
  },
  {
    key: 'labResults',
    label: 'Laboratory Results',
    description: 'Standardized biomarker values, reference ranges, and dates',
    icon: <Activity className="w-4 h-4 text-sky-600" />,
    category: 'diagnostics',
  },
  {
    key: 'labTrends',
    label: 'Laboratory Trajectories & Trends',
    description: 'Multi-year progression data for HbA1c and key markers',
    icon: <Layers className="w-4 h-4 text-teal-600" />,
    category: 'diagnostics',
  },
  {
    key: 'timeline',
    label: 'Healthcare Journey / Timeline',
    description: 'Chronological summary of encounters and clinical milestones',
    icon: <Calendar className="w-4 h-4 text-orange-600" />,
    category: 'diagnostics',
  },
  {
    key: 'providersFacilities',
    label: 'Providers & Facilities',
    description: 'Attending physicians, specialties, and clinical sites',
    icon: <Building2 className="w-4 h-4 text-slate-600" />,
    category: 'audit',
  },
  {
    key: 'contradictions',
    label: 'Potential Inconsistencies',
    description: 'Objective documentation discrepancies flagged for clinician review',
    icon: <ShieldCheck className="w-4 h-4 text-rose-600" />,
    category: 'audit',
  },
  {
    key: 'sourceReferences',
    label: 'Source Medical Documents',
    description: 'Registry of underlying consultation notes, discharge summaries, and labs',
    icon: <FileText className="w-4 h-4 text-zinc-600" />,
    category: 'audit',
  },
];

export function ExportReportModal({
  isOpen,
  onClose,
  patient,
  initialPreset = 'complete',
}: ExportReportModalProps) {
  const patientId = patient?.id || '';
  const patientName = patient?.name || 'Patient';

  const [preset, setPreset] = useState<ReportPreset>(initialPreset);
  const [sections, setSections] = useState<ReportSections>(PRESET_CONFIGURATIONS[initialPreset].sections);
  const [timelineRange, setTimelineRange] = useState<TimelineRangeOption>(
    PRESET_CONFIGURATIONS[initialPreset].timelineRange
  );
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReportResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync preset changes
  const handlePresetSelect = (selectedPreset: ReportPreset) => {
    setPreset(selectedPreset);
    if (selectedPreset !== 'custom') {
      setSections({ ...PRESET_CONFIGURATIONS[selectedPreset].sections });
      setTimelineRange(PRESET_CONFIGURATIONS[selectedPreset].timelineRange);
    }
  };

  // Toggle individual section
  const handleToggleSection = (key: keyof ReportSections) => {
    setSections((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // Switch to custom preset if user diverges
      setPreset('custom');
      return updated;
    });
  };

  // Select/Deselect all
  const handleSelectAll = (select: boolean) => {
    setSections({
      patientInfo: select,
      healthSummary: select,
      allergies: select,
      activeDiagnoses: select,
      diagnosisHistory: select,
      currentMedications: select,
      medicationHistory: select,
      labResults: select,
      labTrends: select,
      timeline: select,
      providersFacilities: select,
      contradictions: select,
      sourceReferences: select,
    });
    setPreset('custom');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const config: HealthReportConfig = {
        patientId,
        preset,
        sections,
        timelineRange,
        customStartDate: customStartDate || undefined,
        customEndDate: customEndDate || undefined,
      };

      const result = await generatePdfReport(config);
      setGeneratedReport(result);
    } catch (err: any) {
      console.error('Report generation error:', err);
      setErrorMessage(err?.message || 'Unable to generate the report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedReport) return;
    const a = document.createElement('a');
    a.href = generatedReport.blobUrl;
    a.download = generatedReport.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenPreview = () => {
    if (!generatedReport) return;
    window.open(generatedReport.blobUrl, '_blank');
  };

  const handleReset = () => {
    setGeneratedReport(null);
    setErrorMessage(null);
  };

  const selectedCount = Object.values(sections).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-report-title"
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="export-report-title" className="text-base sm:text-lg font-bold text-slate-900">
                  Export Health Report
                </h2>
                <Badge variant="teal" size="sm" className="hidden sm:inline-flex">
                  PDF Export
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{patientName}</span> ({patientId})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900 text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Generation Failed</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleGenerate}>
                Retry
              </Button>
            </div>
          )}

          {/* Success Screen with Download & Embedded Preview */}
          {generatedReport ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-5 bg-teal-50/80 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-teal-950">
                      Report generated successfully
                    </h3>
                    <p className="text-xs text-teal-800 mt-0.5 font-medium">
                      {generatedReport.fileName} · {(generatedReport.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    id="btn-download-report-pdf"
                    variant="primary"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={handleDownload}
                    className="flex-1 sm:flex-initial shadow-xs"
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={handleOpenPreview}
                    className="flex-1 sm:flex-initial"
                  >
                    Open in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw className="w-4 h-4" />}
                    onClick={handleReset}
                    className="flex-1 sm:flex-initial text-slate-600"
                  >
                    Configure Another
                  </Button>
                </div>
              </div>

              {/* In-App Live PDF Preview Frame */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-100">
                <div className="px-4 py-2.5 bg-slate-200/80 border-b border-slate-300 flex items-center justify-between text-xs text-slate-700">
                  <span className="font-semibold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-700" />
                    In-Browser Document Preview
                  </span>
                  <span>Print-ready medical history layout</span>
                </div>
                <iframe
                  id="report-preview-iframe"
                  src={generatedReport.blobUrl}
                  title="Health Report Preview"
                  className="w-full h-[460px] bg-white border-0"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Preset Selector */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    1. Choose Report Preset
                  </label>
                  <span className="text-xs text-slate-400">Select standard clinician or focused template</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(Object.keys(PRESET_CONFIGURATIONS) as ReportPreset[]).map((key) => {
                    const presetInfo = PRESET_CONFIGURATIONS[key];
                    const isSelected = preset === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePresetSelect(key)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-500 ring-1 ring-teal-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? 'text-teal-950' : 'text-slate-800'
                              }`}
                            >
                              {presetInfo.name}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-teal-600 bg-teal-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                            {presetInfo.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section Selection List */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      2. Select Sections to Include
                    </label>
                    <Badge variant="slate" size="sm">
                      {selectedCount} of {SECTION_OPTIONS.length} Selected
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(true)}
                      className="text-teal-700 hover:text-teal-900 font-medium"
                    >
                      Select all
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(false)}
                      className="text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Deselect all
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {SECTION_OPTIONS.map((opt) => {
                    const isChecked = sections[opt.key];
                    return (
                      <label
                        key={opt.key}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-white border-teal-300 shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300 opacity-75'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSection(opt.key)}
                          className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 w-4 h-4 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {opt.icon}
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {opt.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {opt.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Timeline Date Range Options */}
              {sections.timeline && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-700" />
                      3. Healthcare Journey / Timeline Scope
                    </label>
                    <span className="text-[11px] text-slate-400">Controls timeline depth</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: 'all', label: 'Entire History (2018–2026)' },
                      { key: '1yr', label: 'Recent (Last 1 Year)' },
                      { key: '3yr', label: 'Last 3 Years' },
                      { key: 'custom', label: 'Custom Range' },
                    ].map((rng) => (
                      <button
                        key={rng.key}
                        type="button"
                        onClick={() => setTimelineRange(rng.key as TimelineRangeOption)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          timelineRange === rng.key
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {rng.label}
                      </button>
                    ))}
                  </div>

                  {timelineRange === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {generatedReport ? (
              <span>Ready for printing or clinical consultation handoff</span>
            ) : (
              <span>
                Generates a print-optimized, multi-page PDF document
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isGenerating}>
              {generatedReport ? 'Close' : 'Cancel'}
            </Button>

            {!generatedReport && (
              <Button
                id="btn-generate-pdf-report"
                variant="primary"
                size="sm"
                icon={<FileDown className="w-4 h-4" />}
                onClick={handleGenerate}
                disabled={isGenerating || selectedCount === 0}
                className="shadow-xs font-semibold"
              >
                {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
