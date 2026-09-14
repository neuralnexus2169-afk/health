import React, { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  Calendar,
  Clock,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
} from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { medicationRepository } from '../../lib/db/repositories';
import { Medication } from '../../types/medical';
import { NavigationRoute, PatientProfile } from '../../types';

interface MedicationsPageProps {
  patient?: PatientProfile;
  onNavigate: (route: NavigationRoute) => void;
}

export function MedicationsPage({ patient, onNavigate }: MedicationsPageProps) {
  const patientId = patient?.id || '';
  const patientName = patient?.name || '';

  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this manually entered record?\nThis will remove the record from your health history. This action cannot be undone.")) return;
    try {
      const { deleteRecord } = await import('../../services/patientService');
      await deleteRecord('Medication', id);
      setMedications(medications.filter(m => m.id !== id));
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Discontinued'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    medicationRepository.findByPatientId(patientId).then((data) => {
      if (isMounted) {
        setMedications(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const filteredMeds = useMemo(() => {
    return medications.filter((med) => {
      if (statusFilter !== 'all' && med.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = med.name.toLowerCase().includes(q);
        const matchGeneric = (med.genericName || '').toLowerCase().includes(q);
        const matchIndication = (med.indication || '').toLowerCase().includes(q);
        const matchNotes = (med.notes || '').toLowerCase().includes(q);
        return matchName || matchGeneric || matchIndication || matchNotes;
      }
      return true;
    });
  }, [medications, statusFilter, searchQuery]);

  const activeCount = medications.filter((m) => m.status === 'Active').length;
  const discontinuedCount = medications.filter((m) => m.status === 'Discontinued').length;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Medications"
        subtitle="Active regimens, dosage instructions, and historical therapy transitions."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200/80 rounded-full text-xs font-semibold text-teal-900">
            <User className="w-3.5 h-3.5 text-teal-700" />
            <span>{patientName}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<History className="w-3.5 h-3.5 text-teal-700" />}
              onClick={() => onNavigate('timeline')}
            >
              Timeline
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-3.5 h-3.5 text-sky-700" />}
              onClick={() => onNavigate('documents')}
            >
              Source Records
            </Button>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-zinc-200/90 shadow-2xs">
          <span className="text-xs font-medium text-zinc-400 block">Total Prescriptions Tracked</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{medications.length}</span>
            <span className="text-xs text-zinc-500">longitudinal therapies</span>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-emerald-200/90 bg-emerald-50/20 shadow-2xs">
          <span className="text-xs font-medium text-emerald-700 block">Active Regimen</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-800">{activeCount}</span>
            <span className="text-xs text-emerald-600">current medications</span>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-zinc-200/90 shadow-2xs">
          <span className="text-xs font-medium text-zinc-400 block">Discontinued / Modified</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-700">{discontinuedCount}</span>
            <span className="text-xs text-zinc-500">historical transitions</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medications, generic names, or indications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:border-teal-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All ({medications.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'Active'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Discontinued')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'Discontinued'
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Discontinued ({discontinuedCount})
          </button>
        </div>
      </div>

      {/* Medication Cards List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-zinc-200 animate-pulse" />
          ))}
        </div>
      ) : filteredMeds.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-zinc-200">
          <Pill className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-800">
            {medications.length === 0 ? 'No medications recorded' : 'No medications found'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {medications.length === 0 
              ? 'Upload a medical document containing medication details to see them here.' 
              : 'Try adjusting your search query or status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeds.map((med) => {
            const isActive = med.status === 'Active';
            return (
              <div
                key={med.id}
                className={`p-5 bg-white rounded-xl border transition-all ${
                  isActive
                    ? 'border-zinc-200/90 hover:border-teal-300 shadow-2xs'
                    : 'border-zinc-200/60 bg-zinc-50/40 opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isActive ? 'bg-teal-50 text-teal-700' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-zinc-900">{med.name}</h3>
                        <Badge variant={isActive ? 'emerald' : 'slate'} size="sm">
                          {med.status}
                        </Badge>
                      </div>
                      {med.genericName && med.genericName !== med.name && (
                        <p className="text-xs text-zinc-500 font-medium">Generic: {med.genericName}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                    {med.dosage}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block font-medium">Frequency & Route</span>
                    <span className="font-semibold text-zinc-800">{med.frequency} · {med.route}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-medium">Indication</span>
                    <span className="font-semibold text-zinc-800 truncate block" title={med.indication}>
                      {med.indication || 'Unspecified'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      Started {new Date(med.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      {med.endDate ? ` · Ended ${new Date(med.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ' · Ongoing'}
                    </span>
                  </div>

                                    <div className="flex items-center gap-2">
                    {med.isManualEntry && (
                      <>
                        <span className="text-[10px] font-semibold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase">Manual Entry</span>
                        <button onClick={() => handleDelete(med.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete manual record"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate('timeline')}
                      className="text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Timeline</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {med.notes && (
                  <div className="mt-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60 text-xs text-zinc-600 leading-relaxed">
                    <span className="font-semibold text-zinc-700">Clinical note: </span>
                    {med.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
