import React from 'react';
import {
  LayoutGrid,
  GitCommitHorizontal,
  FileText,
  Pill,
  Activity,
  FlaskConical,
  Sparkles,
  FolderArchive,
  Settings,
  ShieldCheck,
  X,
  HeartPulse,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { NavigationRoute } from '../../types';
import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '../../lib/demo-data';

interface AppSidebarProps {
  currentRoute: NavigationRoute;
  onNavigate: (route: NavigationRoute) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutGrid,
  GitCommitHorizontal,
  FileText,
  Pill,
  Activity,
  FlaskConical,
  Sparkles,
  FolderArchive,
  Settings,
  ShieldCheck,
  AlertTriangle,
  Search,
};

export function AppSidebar({
  currentRoute,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  const handleNavClick = (route: NavigationRoute) => {
    onNavigate(route);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-zinc-200/80">
      {/* Top Brand & Logo */}
      <div className="flex flex-col">
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-100">
          <button
            type="button"
            onClick={() => handleNavClick('overview')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-800 text-white shadow-xs group-hover:bg-teal-900 transition-colors">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-zinc-900 leading-none">
                HealthTimeline
              </span>
              <span className="block text-[10px] font-medium text-zinc-400 mt-0.5 tracking-wider uppercase">
                Longitudinal EHR
              </span>
            </div>
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-4">
          <div className="px-3 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Record Navigation
            </span>
          </div>

          <nav className="space-y-1">
            {PRIMARY_NAV_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.iconName] || LayoutGrid;
              const isActive = currentRoute === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive
                          ? 'text-teal-700'
                          : 'text-zinc-400 group-hover:text-zinc-700'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium tracking-tight ${
                        item.id === 'ai-assistant'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200/50'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Secondary Navigation */}
      <div className="border-t border-zinc-100 p-3">
        <div className="px-3 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            System & Security
          </span>
        </div>

        <nav className="space-y-1">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.iconName] || Settings;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive
                      ? 'text-teal-700'
                      : 'text-zinc-400 group-hover:text-zinc-700'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Foundation Status Tag */}
        <div className="mt-4 px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
            <span className="text-[11px] font-medium text-zinc-700">
              Foundation Active
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
            Step 1 · Frontend shell & verified architecture
          </p>
        </div>

        {/* Developer Tool: Reset Database */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to completely reset the application state? This will delete all your records and patient data.')) {
              fetch('/api/testing/reset', { method: 'POST' })
                .then(() => window.location.reload())
                .catch((err) => console.error(err));
            }
          }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
        >
          Reset Environment
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-40">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 transform transition-transform duration-200 ease-in-out lg:hidden shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>
    </>
  );
}
