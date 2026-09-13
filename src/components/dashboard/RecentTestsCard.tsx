import React from 'react';
import { FlaskConical, ArrowRight, Calendar } from 'lucide-react';
import { RecentTest, NavigationRoute } from '../../types';
import { Badge } from '../ui/Badge';

interface RecentTestsCardProps {
  tests: RecentTest[];
  onNavigate: (route: NavigationRoute) => void;
}

export function RecentTestsCard({ tests, onNavigate }: RecentTestsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700">
              <FlaskConical className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Recent Tests
              </h3>
              <p className="text-[11px] text-zinc-400">
                Diagnostic & metabolic panels
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-zinc-400">
            Latest Aug 2026
          </span>
        </div>

        <div className="divide-y divide-zinc-100 mt-2">
          {tests.map((item) => (
            <div key={item.id} className="py-3 first:pt-2 last:pb-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">
                    {item.name}
                  </h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-bold text-zinc-900">
                      {item.value}
                    </span>
                    {item.referenceRange && (
                      <span className="text-[11px] text-zinc-400">
                        ({item.referenceRange})
                      </span>
                    )}
                  </div>
                </div>
                <Badge
                  variant={item.status === 'Normal' || item.status === 'Target' ? 'emerald' : 'amber'}
                  size="sm"
                >
                  {item.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.date}
                </span>
                <span>{item.laboratory}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => onNavigate('lab-results')}
          className="flex items-center justify-between w-full text-xs font-medium text-zinc-600 hover:text-teal-800 transition-colors cursor-pointer py-1"
        >
          <span>Explore all lab reports</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
