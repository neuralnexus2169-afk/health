import React, { useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Building2,
  FileText,
  HeartPulse,
  Pill,
  FlaskConical,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  Scan,
  Syringe,
  Quote,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { EnrichedMedicalEvent, formatDisplayDate } from '../../services/patientService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface TimelineEventDetailsProps {
  event: EnrichedMedicalEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onViewSource?: (event: EnrichedMedicalEvent) => void;
}

const EVENT_TYPE_ICONS: Record<string, React.ElementType> = {
  Consultation: Stethoscope,
  Laboratory: FlaskConical,
  Medication: Pill,
  Diagnosis: HeartPulse,
  Hospitalization: Building2,
  Imaging: Scan,
  Procedure: Syringe,
  Vaccination: ShieldCheck,
  Other: Calendar,
};

export function TimelineEventDetails({
  event,
  isOpen,
  onClose,
  onViewSource,
}: TimelineEventDetailsProps) {
  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const IconComponent = EVENT_TYPE_ICONS[event.eventType] || Calendar;
  const formattedDate = formatDisplayDate(event.eventDate);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl border-l border-zinc-200 flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-zinc-200/80 bg-zinc-50/50 flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 pr-2">
              <div className="flex items-center gap-2">
                <Badge variant="default" size="sm">
                  {event.eventType}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 leading-snug">
                {event.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Clinical Encounter Narrative */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Encounter Summary
              </h4>
              <p className="text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/60">
                {event.description}
              </p>
            </div>

            {/* Provider & Facility Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Provider Card */}
              <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-white space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Attending Provider</span>
                </div>
                <div className="text-sm font-semibold text-zinc-900">
                  {event.providerName || event.provider?.name || 'Healthcare Practitioner'}
                </div>
                {event.provider?.specialization && (
                  <div className="text-xs text-zinc-500">
                    {event.provider.specialization}
                  </div>
                )}
              </div>

              {/* Facility Card */}
              <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-white space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Clinical Facility</span>
                </div>
                <div className="text-sm font-semibold text-zinc-900">
                  {event.facilityName || event.facility?.name || 'Clinical Center'}
                </div>
                {event.facility?.type && (
                  <div className="text-xs text-zinc-500">
                    {event.facility.type}
                  </div>
                )}
              </div>
            </div>

            {/* Diagnoses documented in this encounter */}
            {event.diagnoses && event.diagnoses.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-amber-600" />
                  <span>Documented Diagnoses ({event.diagnoses.length})</span>
                </h4>
                <div className="space-y-2.5">
                  {event.diagnoses.map((diag) => (
                    <div
                      key={diag.id}
                      className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-zinc-900">
                          {diag.name}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          {diag.status}
                        </span>
                      </div>
                      {diag.category && (
                        <div className="text-xs text-zinc-500">
                          Category: {diag.category}
                        </div>
                      )}
                      {diag.clinicalNotes && (
                        <p className="text-xs text-zinc-600 italic mt-1 pt-1 border-t border-amber-200/50">
                          "{diag.clinicalNotes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medications prescribed or modified */}
            {event.medications && event.medications.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-700" />
                  <span>Medications Prescribed / Reviewed ({event.medications.length})</span>
                </h4>
                <div className="space-y-2.5">
                  {event.medications.map((med) => (
                    <div
                      key={med.id}
                      className="p-3.5 rounded-xl bg-teal-50/40 border border-teal-200/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-bold text-zinc-900">
                            {med.name}
                          </span>
                          {med.genericName && med.genericName !== med.name && (
                            <span className="text-xs text-zinc-500 block">
                              {med.genericName}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900">
                          {med.status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-600 font-medium">
                        {med.dosage} · {med.frequency} {med.route ? `(${med.route})` : ''}
                      </div>
                      {med.indication && (
                        <div className="text-xs text-zinc-500">
                          Indication: {med.indication}
                        </div>
                      )}
                      {med.refillNote && (
                        <div className="text-[11px] text-teal-800 bg-white/80 p-2 rounded-lg border border-teal-100 mt-1">
                          {med.refillNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Laboratory Results */}
            {event.labResults && event.labResults.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-blue-700" />
                  <span>Laboratory Test Values ({event.labResults.length})</span>
                </h4>
                <div className="space-y-2">
                  {event.labResults.map((lab) => (
                    <div
                      key={lab.id}
                      className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-semibold text-zinc-900">
                          {lab.parameterName || lab.testName}
                        </div>
                        {lab.referenceRange && (
                          <div className="text-[11px] text-zinc-400">
                            Ref: {lab.referenceRange}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-zinc-900">
                          {lab.value} <span className="text-xs font-normal text-zinc-500">{lab.unit}</span>
                        </div>
                        {lab.interpretation && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              lab.interpretation === 'Target' || lab.interpretation === 'Normal'
                                ? 'text-emerald-700 bg-emerald-50'
                                : lab.interpretation === 'Critical'
                                ? 'text-rose-700 bg-rose-50'
                                : 'text-amber-700 bg-amber-50'
                            }`}
                          >
                            {lab.interpretation}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verbatim Source Evidence / Document Traceability */}
            {(event.documentFileName || event.sourceReference || event.document) && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Document Evidence & Traceability</span>
                </h4>

                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <div className="p-1.5 rounded-md bg-white border border-zinc-200 text-zinc-700 shrink-0">
                        <FileText className="w-4 h-4 text-teal-800" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-zinc-900 truncate">
                          {event.documentFileName ||
                            event.sourceReference?.documentFileName ||
                            event.document?.fileName ||
                            'medical_record.pdf'}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {event.document?.documentType || 'Clinical Document'}
                          {event.sourceReference?.pageNumber && ` · Page ${event.sourceReference.pageNumber}`}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      Verified
                    </span>
                  </div>

                  {/* Verbatim snippet if available */}
                  {(event.sourceReference?.sourceText || event.document?.extractedTextSnippet) && (
                    <div className="bg-white p-3 rounded-lg border border-zinc-200/80 text-xs text-zinc-700 leading-relaxed relative">
                      <Quote className="w-3.5 h-3.5 text-zinc-300 absolute top-2 right-2" />
                      <p className="italic pr-4">
                        "{event.sourceReference?.sourceText || event.document?.extractedTextSnippet}"
                      </p>
                    </div>
                  )}

                  {/* View Source Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    icon={<ExternalLink className="w-3.5 h-3.5 text-teal-800" />}
                    onClick={() => {
                      if (onViewSource) {
                        onViewSource(event);
                      }
                    }}
                  >
                    View Source Document Record
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">
              ID: {event.id}
            </span>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
