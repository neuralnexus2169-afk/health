import React from 'react';
import { Settings, Sun, Moon, Monitor, Check, Palette, ArrowLeft } from 'lucide-react';
import { NavigationRoute } from '../../types';
import { useTheme, Theme } from '../../lib/theme/ThemeContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface SettingsPageProps {
  onNavigate: (route: NavigationRoute) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const themeOptions: Array<{
    id: Theme;
    title: string;
    description: string;
    icon: React.ElementType;
    previewBg: string;
    previewSurface: string;
    previewText: string;
  }> = [
    {
      id: 'light',
      title: 'Light Theme',
      description: 'Clean, high-contrast daylight clinical appearance with crisp surfaces.',
      icon: Sun,
      previewBg: 'bg-slate-100',
      previewSurface: 'bg-white border-slate-200',
      previewText: 'text-slate-900',
    },
    {
      id: 'dark',
      title: 'Dark Theme',
      description: 'Sophisticated slate/charcoal palette optimized for low-light EHR reviews.',
      icon: Moon,
      previewBg: 'bg-zinc-950',
      previewSurface: 'bg-zinc-900 border-zinc-800',
      previewText: 'text-zinc-100',
    },
    {
      id: 'system',
      title: 'System Default',
      description: 'Automatically follows your operating system appearance preference.',
      icon: Monitor,
      previewBg: 'bg-gradient-to-r from-slate-100 to-zinc-950',
      previewSurface: 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800',
      previewText: 'text-slate-900 dark:text-zinc-100',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Preferences
            </span>
            <Badge variant="teal" size="sm">
              v1.2
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Settings & Appearance
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Customize visual theme, clinical display preferences, and notification channels.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={() => onNavigate('overview')}
        >
          Return to Overview
        </Button>
      </div>

      {/* Theme Selection Card */}
      <section className="bg-white rounded-xl border border-zinc-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Global Application Theme
            </h2>
            <p className="text-xs text-zinc-500">
              Powered by Tailwind CSS variables. Changes persist across sessions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`relative flex flex-col p-4 rounded-xl text-left border-2 transition-all cursor-pointer focus:outline-hidden ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/20 shadow-xs'
                    : 'border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50/50'
                }`}
              >
                {/* Visual miniature mockup */}
                <div
                  className={`w-full h-20 rounded-lg p-2.5 mb-3.5 border border-zinc-200/40 flex flex-col justify-between ${opt.previewBg}`}
                >
                  <div
                    className={`h-7 w-full rounded border px-2 flex items-center justify-between shadow-2xs ${opt.previewSurface}`}
                  >
                    <div className="h-2 w-12 rounded bg-zinc-300 dark:bg-zinc-700" />
                    <div className="h-2 w-5 rounded bg-teal-600" />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-4 flex-1 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-4 flex-1 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    <span className="text-sm font-semibold text-zinc-900">
                      {opt.title}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed">
                  {opt.description}
                </p>

                {isSelected && (
                  <div className="mt-3 pt-2 border-t border-teal-100 flex items-center gap-1.5 text-[11px] font-medium text-teal-700">
                    <span>Active mode:</span>
                    <span className="capitalize font-semibold">{resolvedTheme}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Integration & Storage Overview */}
      <section className="bg-white rounded-xl border border-zinc-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              System & Clinical Integrations
            </h2>
            <p className="text-xs text-zinc-500">
              Configured modules and downstream pipeline connections.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-lg bg-zinc-50/70 border border-zinc-200/70">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
              Active Storage Layer
            </h3>
            <p className="text-sm text-zinc-800 font-medium">
              SQLite / Prisma + In-Memory Fallback
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Local SQLite database initialized with longitudinal patient history and 21 mock clinic records.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50/70 border border-zinc-200/70">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
              Clinical AI Intelligence
            </h3>
            <p className="text-sm text-zinc-800 font-medium">
              Gemini 3.8 Flash + Resilient Fallback
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Configured with multi-model cascade, jittered backoff, and 25s adaptive timeout windows.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
