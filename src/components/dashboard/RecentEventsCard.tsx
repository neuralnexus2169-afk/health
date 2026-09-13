import React from 'react';
import { Calendar, ArrowRight, Stethoscope, FlaskConical, Building2 } from 'lucide-react';
import { RecentEvent, NavigationRoute } from '../../types';
import { Badge } from '../ui/Badge';

interface RecentEventsCardProps {
  events: RecentEvent[];
  onNavigate: (route: NavigationRoute) => void;
}

const EVENT_ICON_MAP = {
  'Doctor consultation': Stethoscope,
  'Laboratory test': FlaskConical,
  'Hospital visit': Building2,
};

export function RecentEventsCard({ events, onNavigate }: RecentEventsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700">
              <Calendar className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Recent Healthcare Events
              </h3>
              <p className="text-[11px] text-zinc-400">
                Encounters, labs & hospitalizations
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-zinc-400">
            {events.length} encounters
          </span>
        </div>

        <div className="divide-y divide-zinc-100 mt-2">
          {events.map((item) => {
            const IconComponent = EVENT_ICON_MAP[item.type] || Calendar;
            return (
              <div key={item.id} className="py-3 first:pt-2 last:pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-md bg-zinc-50 border border-zinc-200/60 text-zinc-600 mt-0.5 shrink-0">
                      <IconComponent className="w-3.5 h-3.5 text-zinc-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {item.provider} <span className="text-zinc-300">·</span> {item.location}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" size="sm">
                    {item.type}
                  </Badge>
                </div>

                <div className="text-[11px] text-zinc-400 mt-1 pl-8">
                  {item.date}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => onNavigate('timeline')}
          className="flex items-center justify-between w-full text-xs font-medium text-zinc-600 hover:text-teal-800 transition-colors cursor-pointer py-1"
        >
          <span>View full chronological timeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
