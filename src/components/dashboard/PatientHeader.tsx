import React from 'react';
import { PatientProfile } from '../../types';
import { User, Calendar, FileText, Building2, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface PatientHeaderProps {
  patient: PatientProfile;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Patient Identity */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-base sm:text-lg font-bold text-zinc-800 shrink-0">
            {patient.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                {patient.name}
              </h2>
              <Badge variant="teal" size="sm">
                {patient.type}
              </Badge>
              {patient.bloodType && (
                <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60">
                  Blood: {patient.bloodType}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-zinc-500 font-medium">
              {patient.age} years <span className="text-zinc-300">·</span> {patient.gender} <span className="text-zinc-300">·</span> DOB: {patient.dateOfBirth}
            </p>
          </div>
        </div>

        {/* High-level metrics: History Span, Records, Events, Providers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-zinc-100 lg:border-l lg:pl-8">
          <div>
            <span className="text-xs text-zinc-400 font-medium block">
              History span
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold text-zinc-800">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>0 Yrs</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-zinc-400 font-medium block">
              Medical events
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold text-zinc-800">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-600"></span>
              <span>0 Events</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-zinc-400 font-medium block">
              Clinical records
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold text-zinc-800">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>{patient.recordsCount} items</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-zinc-400 font-medium block">
              Care providers
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold text-zinc-800">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>{patient.providersCount} providers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Allergies / Primary Care Physician Bar */}
      {patient.allergies && patient.allergies.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-600">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-zinc-700">Documented Allergies:</span>
            <span className="text-zinc-500">{patient.allergies.join(', ')}</span>
          </div>

          {patient.primaryCarePhysician && (
            <div className="text-zinc-500">
              <span className="font-semibold text-zinc-700">Primary Care:</span> {patient.primaryCarePhysician}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
