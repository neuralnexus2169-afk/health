import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Calendar,
  Search,
  CheckCircle2,
  FileText,
  History,
  ArrowRight,
  ShieldCheck,
  User,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { diagnosisRepository } from '../../lib/db/repositories';
import { Diagnosis } from '../../types/medical';
import { NavigationRoute, PatientProfile } from '../../types';

interface DiagnosesPageProps {
  patient?: PatientProfile;
  onNavigate: (route: NavigationRoute) => void;
}

export function DiagnosesPage({ patient, onNavigate }: DiagnosesPageProps) {
  const patientId = patient?.id || '';
  const patientName = patient?.name || '';

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this manually entered record?\nThis will remove the record from your health history. This action cannot be undone.")) return;
    try {
      const { deleteRecord } = await import('../../services/patientService');
      await deleteRecord('Diagnosis', id);
      setDiagnoses(diagnoses.filter(d => d.id !== id));
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    diagnosisRepository.findByPatientId(patientId).then((data) => {
      if (isMounted) {
        setDiagnoses(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const filteredDiagnoses = useMemo(() => {
    return diagnoses.filter((diag) => {
      if (statusFilter !== 'all' && diag.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = diag.name.toLowerCase().includes(q);
        const matchCode = (diag.icd10Code || '').toLowerCase().includes(q);
        const matchCategory = (diag.category || '').toLowerCase().includes(q);
        const matchNotes = (diag.clinicalNotes || '').toLowerCase().includes(q);
        return matchName || matchCode || matchCategory || matchNotes;
      }
      return true;
    });
  }, [diagnoses, statusFilter, searchQuery]);

  const activeCount = diagnoses.filter((d) => d.status === 'Active').length;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Diagnoses & Conditions"
        subtitle="Verified clinical problem list, onset timelines, and standard ICD-10 codings."
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
          <span className="text-xs font-medium text-zinc-400 block">Total Documented Conditions</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{diagnoses.length}</span>
            <span className="text-xs text-zinc-500">longitudinal diagnoses</span>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-teal-200/90 bg-teal-50/20 shadow-2xs">
          <span className="text-xs font-medium text-teal-700 block">Active Problem List</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-900">{activeCount}</span>
            <span className="text-xs text-teal-700">active management</span>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-zinc-200/90 shadow-2xs">
          <span className="text-xs font-medium text-zinc-400 block">Taxonomy Standard</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-800">ICD-10</span>
            <span className="text-xs text-zinc-500">WHO compliant</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search diagnoses, ICD-10 code, or clinical notes..."
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
            All ({diagnoses.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'Active'
                ? 'bg-teal-700 text-white'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            Active ({activeCount})
          </button>
        </div>
      </div>

      {/* Diagnoses List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-zinc-200 animate-pulse" />
          ))}
        </div>
      ) : filteredDiagnoses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-zinc-200">
          <Activity className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-800">
            {diagnoses.length === 0 ? 'No diagnoses recorded' : 'No diagnoses found'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {diagnoses.length === 0 
              ? 'Upload a medical document containing diagnoses to see them here.' 
              : 'Try adjusting your search query or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDiagnoses.map((diag) => {
            return (
              <div
                key={diag.id}
                className="p-5 bg-white rounded-xl border border-zinc-200/90 hover:border-teal-300 shadow-2xs transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-zinc-900">{diag.name}</h3>
                        <Badge variant="teal" size="sm">
                          {diag.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium">{diag.category}</p>
                    </div>
                  </div>

                  {diag.icd10Code && (
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200/60">
                      {diag.icd10Code}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Documented Onset: {new Date(diag.onsetYear || diag.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>

                                    <div className="flex items-center gap-2">
                    {diag.isManualEntry && (
                      <>
                        <span className="text-[10px] font-semibold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase">Manual Entry</span>
                        <button onClick={() => handleDelete(diag.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete manual record"><Trash2 className="w-3.5 h-3.5" /></button>
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

                {diag.clinicalNotes && (
                  <div className="mt-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60 text-xs text-zinc-600 leading-relaxed">
                    <span className="font-semibold text-zinc-700">Clinical notes: </span>
                    {diag.clinicalNotes}
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
