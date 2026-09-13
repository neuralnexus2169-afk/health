import React from 'react';
import { Pill, ArrowRight, Clock } from 'lucide-react';
import { CurrentMedication, NavigationRoute } from '../../types';
import { Badge } from '../ui/Badge';

interface MedicationCardProps {
  medications: CurrentMedication[];
  onNavigate: (route: NavigationRoute) => void;
}

export function MedicationCard({ medications, onNavigate }: MedicationCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700">
              <Pill className="w-4 h-4 text-sky-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Current Medications
              </h3>
              <p className="text-[11px] text-zinc-400">
                Prescribed & active therapies
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-zinc-400">
            {medications.length} active
          </span>
        </div>

        <div className="divide-y divide-zinc-100 mt-2">
          {medications.map((item) => (
            <div key={item.id} className="py-3 first:pt-2 last:pb-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-sm font-semibold text-zinc-900">
                      {item.name}
                    </h4>
                    <span className="text-xs font-medium text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded">
                      {item.dosage}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{item.schedule}</span>
                  </div>
                </div>
                <Badge variant="teal" size="sm">
                  {item.status}
                </Badge>
              </div>

              <p className="text-[11px] text-zinc-400 mt-1.5">
                Prescribed by {item.prescribedBy}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => onNavigate('medications')}
          className="flex items-center justify-between w-full text-xs font-medium text-zinc-600 hover:text-teal-800 transition-colors cursor-pointer py-1"
        >
          <span>Manage medication regimen</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
