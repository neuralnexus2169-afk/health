import { useState, useRef, useEffect } from 'react';
import {
  Search,
  User,
  Menu,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';
import { PatientProfile, NavigationRoute } from '../../types';
import { NotificationsPopover } from '../ui/NotificationsPopover';
import { SearchDialog } from '../ui/SearchDialog';
import { ThemeToggle } from '../ui/ThemeToggle';
import { GlobalSearchInput } from '../search/GlobalSearchInput';

interface TopBarProps {
  currentRoute: NavigationRoute;
  currentPatient: PatientProfile;
  availablePatients: PatientProfile[];
  onSelectPatient: (patient: PatientProfile) => void;
  onNavigate: (route: NavigationRoute, targetId?: string, extraParams?: Record<string, string>) => void;
  onToggleMobileSidebar: () => void;
}

const ROUTE_LABELS: Record<NavigationRoute, string> = {
  overview: 'Health Overview',
  timeline: 'Timeline',
  'health-summary': 'AI Health Summary',
  'medical-records': 'Medical Records',
  medications: 'Medications',
  diagnoses: 'Diagnoses',
  'lab-results': 'Lab Results',
  'ai-assistant': 'AI Assistant',
  documents: 'Documents',
  contradictions: 'Potential Inconsistencies',
  settings: 'Settings',
  privacy: 'Privacy & Data Governance',
  search: 'Health Record Search',
};

export function TopBar({
  currentRoute,
  currentPatient,
  availablePatients,
  onSelectPatient,
  onNavigate,
  onToggleMobileSidebar,
}: TopBarProps) {
  const [isPatientMenuOpen, setIsPatientMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        patientDropdownRef.current &&
        !patientDropdownRef.current.contains(e.target as Node)
      ) {
        setIsPatientMenuOpen(false);
      }
    };
    if (isPatientMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPatientMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-xs transition-shadow">
        {/* Left: Mobile menu button + Breadcrumb / Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg lg:hidden"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center text-sm" aria-label="Breadcrumb">
            <span className="font-medium text-zinc-400 hidden sm:inline-block">
              {currentPatient.name}
            </span>
            <span className="text-zinc-300 mx-2 hidden sm:inline-block">/</span>
            <h1 className="font-semibold text-zinc-900 tracking-tight text-sm sm:text-base">
              {ROUTE_LABELS[currentRoute] || 'Overview'}
            </h1>
          </nav>
        </div>

        {/* Right: Search, Notifications, Patient Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global health search control */}
          <GlobalSearchInput
            patient={currentPatient}
            onNavigate={onNavigate}
          />

          {/* Notifications */}
          <NotificationsPopover />

          {/* Global Theme Toggle */}
          <ThemeToggle />

          <div className="h-5 w-px bg-zinc-200 hidden sm:block" />

          {/* Patient Selector Dropdown */}
          <div className="relative" ref={patientDropdownRef}>
            <button
              id="topbar-patient-menu-btn"
              type="button"
              onClick={() => setIsPatientMenuOpen(!isPatientMenuOpen)}
              className="flex items-center justify-center p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label={`Select Patient Profile: ${currentPatient.name}`}
              title={`${currentPatient.name} (${currentPatient.type})`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 font-semibold text-xs border border-zinc-200/80 hover:border-zinc-300">
                {currentPatient.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
            </button>

            {isPatientMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-zinc-200 py-1.5 z-50 animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-zinc-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Patient Profile
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Select demo health profile
                  </p>
                </div>

                <div className="py-1">
                  {availablePatients.map((patient) => {
                    const isSelected = patient.id === currentPatient.id;
                    return (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          onSelectPatient(patient);
                          setIsPatientMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-50 cursor-pointer ${
                          isSelected ? 'bg-zinc-50 text-zinc-900 font-medium' : 'text-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[11px] font-semibold text-zinc-700">
                            {patient.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div>
                            <div className="font-medium text-zinc-900">
                              {patient.name}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {patient.age} yrs · {patient.gender} · {patient.type}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-teal-700" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-zinc-100 px-3 py-2 mt-1 bg-zinc-50/50 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-zinc-400" />
                    {currentPatient.recordsCount} total records
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    Updated 2026
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
}
