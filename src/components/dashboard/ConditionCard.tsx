import React from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { ImportantCondition, NavigationRoute } from '../../types';
import { Badge } from '../ui/Badge';

interface ConditionCardProps {
  conditions: ImportantCondition[];
  onNavigate: (route: NavigationRoute) => void;
}

export function ConditionCard({ conditions, onNavigate }: ConditionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700">
              <Activity className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Important Conditions
              </h3>
              <p className="text-[11px] text-zinc-400">
                Primary active diagnoses
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-zinc-400">
            {conditions.length} active
          </span>
        </div>

        <div className="divide-y divide-zinc-100 mt-2">
          {conditions.map((item) => (
            <div key={item.id} className="py-3 first:pt-2 last:pb-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">
                    {item.name}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Diagnosed {item.diagnosedYear} <span className="text-zinc-300">·</span> {item.category}
                  </p>
                </div>
                <Badge
                  variant={item.status === 'Well-controlled' ? 'emerald' : 'teal'}
                  size="sm"
                >
                  {item.status}
                </Badge>
              </div>

              {item.notes && (
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  {item.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => onNavigate('diagnoses')}
          className="flex items-center justify-between w-full text-xs font-medium text-zinc-600 hover:text-teal-800 transition-colors cursor-pointer py-1"
        >
          <span>View all diagnoses & history</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
