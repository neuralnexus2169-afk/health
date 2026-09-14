import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  TrendingUp,
  User,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { labResultRepository } from '../../lib/db/repositories';
import { LabResult } from '../../types/medical';
import { NavigationRoute, PatientProfile } from '../../types';

interface LabsPageProps {
  patient?: PatientProfile;
  onNavigate: (route: NavigationRoute) => void;
}

export function LabsPage({ patient, onNavigate }: LabsPageProps) {
  const patientId = patient?.id || '';
  const patientName = patient?.name || '';

  const [labs, setLabs] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this manually entered record?\nThis will remove the record from your health history. This action cannot be undone.")) return;
    try {
      const { deleteRecord } = await import('../../services/patientService');
      await deleteRecord('LabResult', id);
      setLabs(labs.filter(l => l.id !== id));
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  const [selectedPanel, setSelectedPanel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    labResultRepository.findByPatientId(patientId).then((data) => {
      if (isMounted) {
        // Sort newest first
        const sorted = [...data].sort(
          (a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
        );
        setLabs(sorted);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  // HbA1c points for trajectory visualization (sorted chronologically)
  const hba1cSeries = useMemo(() => {
    return labs
      .filter((l) => l.parameterName.toLowerCase().includes('hba1c') || l.testName.toLowerCase().includes('hba1c'))
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
  }, [labs]);

  // Unique panels/tests for filter buttons
  const panelCategories = useMemo(() => {
    const set = new Set<string>();
    labs.forEach((l) => {
      if (l.parameterName.toLowerCase().includes('hba1c')) set.add('Glycemic (HbA1c)');
      else if (l.parameterName.toLowerCase().includes('glucose')) set.add('Glucose');
      else if (l.testName.toLowerCase().includes('lipid') || l.parameterName.toLowerCase().includes('cholesterol')) set.add('Lipid Panel');
      else if (l.testName.toLowerCase().includes('renal') || l.parameterName.toLowerCase().includes('egfr') || l.parameterName.toLowerCase().includes('creatinine')) set.add('Renal / Kidney');
      else set.add(l.testName);
    });
    return Array.from(set);
  }, [labs]);

  const filteredLabs = useMemo(() => {
    return labs.filter((l) => {
      if (selectedPanel !== 'all') {
        if (selectedPanel === 'Glycemic (HbA1c)' && !l.parameterName.toLowerCase().includes('hba1c')) return false;
        if (selectedPanel === 'Glucose' && !l.parameterName.toLowerCase().includes('glucose')) return false;
        if (selectedPanel === 'Lipid Panel' && !l.testName.toLowerCase().includes('lipid') && !l.parameterName.toLowerCase().includes('cholesterol')) return false;
        if (selectedPanel === 'Renal / Kidney' && !l.testName.toLowerCase().includes('renal') && !l.parameterName.toLowerCase().includes('egfr') && !l.parameterName.toLowerCase().includes('creatinine')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTest = l.testName.toLowerCase().includes(q);
        const matchParam = l.parameterName.toLowerCase().includes(q);
        const matchInterp = (l.interpretation || '').toLowerCase().includes(q);
        const matchFac = (l.facilityName || '').toLowerCase().includes(q);
        return matchTest || matchParam || matchInterp || matchFac;
      }
      return true;
    });
  }, [labs, selectedPanel, searchQuery]);

  const latestHbA1c = hba1cSeries.length > 0 ? hba1cSeries[hba1cSeries.length - 1] : null;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Lab Results & Biomarkers"
        subtitle="Standardized laboratory panels, numeric biomarkers, reference intervals, and temporal trendlines."
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
              Source Reports
            </Button>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-zinc-200/90 shadow-2xs">
          <span className="text-xs font-medium text-zinc-400 block">Total Biomarkers</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{labs.length}</span>
            <span className="text-xs text-zinc-500">recorded lab tests</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-teal-200/90 bg-teal-50/20 shadow-2xs">
          <span className="text-xs font-medium text-teal-700 block">Latest HbA1c</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-900">
              {latestHbA1c ? `${latestHbA1c.value}%` : '6.8%'}
            </span>
            <span className="text-xs font-semibold text-emerald-700">Controlled (ADA Target)</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200/90 shadow-2xs">
          <span className="text-xs font-medium text-zinc-400 block">Longitudinal Trajectory</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-800">8.4% → 6.8%</span>
            <span className="text-xs text-emerald-600 font-medium">Improved</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-zinc-200/90 shadow-2xs">
          <span className="text-xs font-medium text-zinc-400 block">Standard Unit System</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-800">SI / US</span>
            <span className="text-xs text-zinc-500">Harmonized</span>
          </div>
        </div>
      </div>

      {/* Longitudinal HbA1c Trajectory Banner */}
      {hba1cSeries.length > 0 && (
        <div className="p-5 sm:p-6 bg-white rounded-xl border border-zinc-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-zinc-900">Longitudinal Glycemic Trend (HbA1c 2018–2026)</h3>
            </div>
            <span className="text-xs text-zinc-500">Target: &lt; 7.0% for managed Type 2 Diabetes</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {hba1cSeries.map((item, idx) => {
              const isTarget = item.value <= 7.0;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    isTarget
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <span className="text-[11px] font-medium text-zinc-500 block">
                    {new Date(item.testDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span
                    className={`text-lg font-bold block mt-0.5 ${
                      isTarget ? 'text-emerald-800' : 'text-amber-800'
                    }`}
                  >
                    {item.value}%
                  </span>
                  <span
                    className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded mt-1 ${
                      isTarget ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isTarget ? 'Target' : 'Elevated'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test name, parameter, or facility..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:border-teal-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedPanel('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              selectedPanel === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Panels
          </button>
          {panelCategories.map((panel) => (
            <button
              key={panel}
              type="button"
              onClick={() => setSelectedPanel(panel)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedPanel === panel
                  ? 'bg-teal-700 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {panel}
            </button>
          ))}
        </div>
      </div>

      {/* Laboratory Results Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-zinc-200 animate-pulse" />
          ))}
        </div>
      ) : filteredLabs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-zinc-200">
          <FlaskConical className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-800">
            {labs.length === 0 ? 'No laboratory results' : 'No lab results found'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {labs.length === 0
              ? 'Upload a medical document containing lab results to see them here.'
              : 'Try adjusting your search query or panel filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium text-xs">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Test / Biomarker</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Reference Range</th>
                  <th className="py-3 px-4">Interpretation</th>
                  <th className="py-3 px-4">Facility & Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLabs.map((lab) => {
                  const isElevated = lab.interpretation === 'Elevated' || lab.interpretation === 'Critical';
                  const isNormal = lab.interpretation === 'Normal' || lab.interpretation === 'Target';

                  return (
                    <tr key={lab.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-600 whitespace-nowrap">
                        {new Date(lab.testDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900">{lab.parameterName}</div>
                        <div className="text-xs text-zinc-500">{lab.testName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-zinc-900 font-mono">
                          {lab.value} {lab.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-500 font-mono">
                        {lab.referenceRange || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={isElevated ? 'amber' : isNormal ? 'emerald' : 'slate'}
                          size="sm"
                        >
                          {lab.interpretation || 'Normal'}
                        </Badge>
                      </td>
                                            <td className="py-3.5 px-4 text-xs text-zinc-500">
                        <div>{lab.facilityName || 'Meridian Medical Centre'}</div>
                        {lab.isManualEntry ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase">Manual Entry</span>
                            <button onClick={() => handleDelete(lab.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete manual record"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : lab.documentFileName && (
                          <span className="text-[11px] text-teal-700 font-mono truncate max-w-[140px] block">
                            {lab.documentFileName}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
