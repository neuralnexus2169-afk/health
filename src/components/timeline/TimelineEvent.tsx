import React from 'react';
import {
  Stethoscope,
  HeartPulse,
  Pill,
  FlaskConical,
  Building2,
  Scan,
  Syringe,
  ShieldCheck,
  Calendar,
  FileText,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { EnrichedMedicalEvent, formatDisplayDate } from '../../services/patientService';
import { Badge } from '../ui/Badge';

interface TimelineEventProps {
  key?: React.Key;
  event: EnrichedMedicalEvent;
  onSelect: (event: EnrichedMedicalEvent) => void;
  onViewSource?: (event: EnrichedMedicalEvent) => void;
  onDeleteEvent?: (id: string, type: 'event' | 'diagnosis' | 'medication' | 'lab') => void;
}

const EVENT_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    badgeVariant: 'default' | 'teal' | 'amber' | 'blue' | 'purple' | 'red' | 'outline';
    label: string;
    markerColor: string;
  }
> = {
  Consultation: {
    icon: Stethoscope,
    badgeVariant: 'default',
    label: 'Consultation',
    markerColor: 'bg-zinc-700 text-white',
  },
  Laboratory: {
    icon: FlaskConical,
    badgeVariant: 'blue',
    label: 'Laboratory',
    markerColor: 'bg-blue-600 text-white',
  },
  Medication: {
    icon: Pill,
    badgeVariant: 'teal',
    label: 'Medication',
    markerColor: 'bg-teal-700 text-white',
  },
  Diagnosis: {
    icon: HeartPulse,
    badgeVariant: 'amber',
    label: 'Diagnosis',
    markerColor: 'bg-amber-600 text-white',
  },
  Hospitalization: {
    icon: Building2,
    badgeVariant: 'red',
    label: 'Hospitalization',
    markerColor: 'bg-rose-600 text-white',
  },
  Imaging: {
    icon: Scan,
    badgeVariant: 'purple',
    label: 'Imaging',
    markerColor: 'bg-purple-600 text-white',
  },
  Procedure: {
    icon: Syringe,
    badgeVariant: 'default',
    label: 'Procedure',
    markerColor: 'bg-zinc-800 text-white',
  },
  Vaccination: {
    icon: ShieldCheck,
    badgeVariant: 'teal',
    label: 'Vaccination',
    markerColor: 'bg-emerald-600 text-white',
  },
  Other: {
    icon: Calendar,
    badgeVariant: 'outline',
    label: 'Event',
    markerColor: 'bg-zinc-500 text-white',
  },
};

export function TimelineEvent({ event, onSelect, onViewSource, onDeleteEvent }: TimelineEventProps) {
  const config = EVENT_CONFIG[event.eventType] || EVENT_CONFIG.Other;
  const IconComponent = config.icon;

  const formattedDate = formatDisplayDate(event.eventDate);

  // Quick specific rendering helpers
  const isLab = event.eventType === 'Laboratory' || (event.labResults && event.labResults.length > 0);
  const isMed = event.eventType === 'Medication' || (event.medications && event.medications.length > 0);
  const isDiag = event.eventType === 'Diagnosis' || (event.diagnoses && event.diagnoses.length > 0);

  return (
    <div className="relative flex items-start gap-3 sm:gap-4 group">
      {/* Timeline Node Icon (positioned over the vertical line) */}
      <div
        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${config.markerColor} shadow-xs shrink-0 mt-2 transition-transform group-hover:scale-105`}
      >
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Main Event Card */}
      <div
        onClick={() => onSelect(event)}
        className="flex-1 bg-white hover:bg-zinc-50/70 border border-zinc-200/80 hover:border-zinc-300 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer text-left"
      >
        {/* Top Header Row: Date + Category Badge + Encounter Context */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={config.badgeVariant} size="sm">
              {config.label}
            </Badge>

            {/* Dynamic Clinical Sub-Badges */}
            {isMed && event.medicationAction && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  event.medicationAction === 'started'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : event.medicationAction === 'discontinued'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {event.medicationAction === 'started' && 'Medication started'}
                {event.medicationAction === 'changed' && 'Medication changed'}
                {event.medicationAction === 'discontinued' && 'Medication discontinued'}
              </span>
            )}

            {isDiag && event.diagnosisAction && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {event.diagnosisAction}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Event Title */}
        <div className="mt-2.5 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-900 group-hover:text-teal-900 transition-colors">
            {event.title}
          </h3>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
        </div>

        {/* Narrative Description */}
        <p className="mt-1 text-sm text-zinc-600 leading-relaxed line-clamp-2">
          {event.description}
        </p>

        {/* Specific In-Card Embed: Lab Result highlight */}
        {isLab && event.primaryLabSummary && (
          <div className="mt-3 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span className="text-xs font-medium text-zinc-800">
                {event.primaryLabSummary.parameterName || event.primaryLabSummary.testName}:
              </span>
              <span className="text-sm font-bold text-zinc-900">
                {event.primaryLabSummary.value} {event.primaryLabSummary.unit}
              </span>
            </div>
            {event.primaryLabSummary.interpretation && (
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  event.primaryLabSummary.interpretation === 'Target' || event.primaryLabSummary.interpretation === 'Normal'
                    ? 'bg-emerald-100 text-emerald-800'
                    : event.primaryLabSummary.interpretation === 'Critical'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {event.primaryLabSummary.interpretation}
              </span>
            )}
          </div>
        )}

        {/* Specific In-Card Embed: Medication highlight */}
        {isMed && event.medications.length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-teal-50/60 border border-teal-100/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Pill className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="font-semibold text-zinc-900">
                {event.medications[0].name}
              </span>
              <span className="text-zinc-500">
                {event.medications[0].dosage} · {event.medications[0].frequency}
              </span>
            </div>
            <span className="text-[11px] text-teal-800 font-medium">
              {event.medications[0].status}
            </span>
          </div>
        )}

        {/* Specific In-Card Embed: Diagnosis highlight */}
        {isDiag && event.diagnoses.length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-50/70 border border-amber-100/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <HeartPulse className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="font-semibold text-zinc-900">
                {event.diagnoses[0].name}
              </span>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-500">
                Documented: {formatDisplayDate(event.diagnoses[0].firstDocumentedDate)}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800">
              {event.diagnoses[0].status}
            </span>
          </div>
        )}

        {/* Footer Row: Healthcare Provider, Facility, and Source Evidence */}
        <div className="mt-3.5 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2 truncate">
            {event.providerName && (
              <span className="font-medium text-zinc-700 truncate">
                {event.providerName}
              </span>
            )}
            {event.providerName && event.facilityName && (
              <span className="text-zinc-300">·</span>
            )}
            {event.facilityName && (
              <span className="text-zinc-500 truncate">
                {event.facilityName}
              </span>
            )}
          </div>

          {/* Linked Source Evidence */}
          
          {event.isManualEntry ? (
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <span className="text-[10px] font-semibold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase">Manual Entry</span>
              {onDeleteEvent && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    let type: 'event' | 'diagnosis' | 'medication' | 'lab' = 'event';
                    if (event.eventType === 'Diagnosis') type = 'diagnosis';
                    else if (event.eventType === 'Medication') type = 'medication';
                    else if (event.eventType === 'Lab Result') type = 'lab';
                    onDeleteEvent(event.id, type);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete manual record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            (event.documentFileName || event.sourceReference) && (
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewSource) {
                      onViewSource(event);
                    } else {
                      onSelect(event);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-teal-800 bg-zinc-100 hover:bg-teal-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  title="View verified source document record"
                >
                  <FileText className="w-3 h-3 text-zinc-400" />
                  <span className="truncate max-w-[140px]">
                    {event.documentFileName || event.sourceReference?.documentFileName}
                  </span>
                  {event.sourceReference?.pageNumber && (
                    <span className="text-zinc-400">p. {event.sourceReference.pageNumber}</span>
                  )}
                </button>
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}
