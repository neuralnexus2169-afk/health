import React from 'react';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import { NavigationRoute } from '../../types';

export interface PlaceholderViewProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  badgeText?: string;
  onNavigate?: (route: NavigationRoute) => void;
  plannedFeatures?: string[];
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function PlaceholderView({
  title,
  subtitle,
  description,
  icon: Icon,
  badgeText = 'Foundation Phase',
  onNavigate,
  plannedFeatures,
  ctaLabel,
  onCtaClick,
}: PlaceholderViewProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Module Placeholder
            </span>
            <Badge variant="teal" size="sm">
              {badgeText}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {subtitle}
          </p>
        </div>

        {onNavigate && (
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('overview')}
          >
            Back to Overview
          </Button>
        )}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-8 sm:p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200/60 text-teal-700 mb-5">
          <Icon className="h-7 w-7" />
        </div>

        <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
          {description}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-500 leading-relaxed">
          This area is ready for data integration and specialized record extraction. The UI foundation and routing shell are established.
        </p>

        {plannedFeatures && plannedFeatures.length > 0 && (
          <div className="mt-8 max-w-md mx-auto text-left bg-zinc-50/70 border border-zinc-200/70 rounded-lg p-4">
            <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2.5">
              Planned In Upcoming Steps:
            </p>
            <ul className="space-y-2 text-xs text-zinc-600">
              {plannedFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {ctaLabel && onCtaClick && (
            <Button variant="primary" size="md" onClick={onCtaClick}>
              {ctaLabel}
            </Button>
          )}
          {onNavigate && (
            <Button variant="outline" size="md" onClick={() => onNavigate('overview')}>
              View Overview
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
