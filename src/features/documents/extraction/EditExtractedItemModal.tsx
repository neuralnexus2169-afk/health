import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import {
  ExtractedDiagnosis,
  ExtractedMedication,
  ExtractedLabResult,
  ExtractedProcedure,
  ExtractedAllergy,
  DiagnosisStatus,
  MedicationStatus,
} from '../../../types/medical';

export type EditableItem =
  | { type: 'diagnosis'; item: ExtractedDiagnosis; index: number }
  | { type: 'medication'; item: ExtractedMedication; index: number }
  | { type: 'labResult'; item: ExtractedLabResult; index: number }
  | { type: 'procedure'; item: ExtractedProcedure; index: number }
  | { type: 'allergy'; item: ExtractedAllergy; index: number };

interface EditExtractedItemModalProps {
  editItem: EditableItem | null;
  onClose: () => void;
  onSave: (updatedItem: EditableItem) => void;
}

export const EditExtractedItemModal: React.FC<EditExtractedItemModalProps> = ({
  editItem,
  onClose,
  onSave,
}) => {
  if (!editItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Edit {editItem.type === 'labResult' ? 'Lab Result' : editItem.type}
            </div>
            <h3 className="text-base font-semibold text-slate-900 mt-0.5">
              Verify and correct clinical details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* Source context reminder */}
          {editItem.item.sourceQuote && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-lg text-xs">
              <div className="font-medium text-amber-900 flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                Original Document Text (Page {editItem.item.pageNumber || 1}):
              </div>
              <p className="text-amber-800 italic font-mono text-[11px] leading-relaxed">
                "{editItem.item.sourceQuote}"
              </p>
            </div>
          )}

          {editItem.type === 'diagnosis' && (
            <DiagnosisForm item={editItem.item} onSave={(val) => onSave({ ...editItem, item: val })} onCancel={onClose} />
          )}

          {editItem.type === 'medication' && (
            <MedicationForm item={editItem.item} onSave={(val) => onSave({ ...editItem, item: val })} onCancel={onClose} />
          )}

          {editItem.type === 'labResult' && (
            <LabResultForm item={editItem.item} onSave={(val) => onSave({ ...editItem, item: val })} onCancel={onClose} />
          )}

          {editItem.type === 'procedure' && (
            <ProcedureForm item={editItem.item} onSave={(val) => onSave({ ...editItem, item: val })} onCancel={onClose} />
          )}

          {editItem.type === 'allergy' && (
            <AllergyForm item={editItem.item} onSave={(val) => onSave({ ...editItem, item: val })} onCancel={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-form for Diagnosis
function DiagnosisForm({
  item,
  onSave,
  onCancel,
}: {
  item: ExtractedDiagnosis;
  onSave: (item: ExtractedDiagnosis) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [status, setStatus] = useState<DiagnosisStatus>(item.status || 'Active');
  const [date, setDate] = useState(item.date || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...item,
      name,
      status,
      date: date || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Diagnosis / Condition Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Clinical Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DiagnosisStatus)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="Active">Active</option>
            <option value="Resolved">Resolved</option>
            <option value="Historical">Historical</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Documented Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Check className="w-4 h-4" /> Save Corrections
        </button>
      </div>
    </form>
  );
}

// Sub-form for Medication
function MedicationForm({
  item,
  onSave,
  onCancel,
}: {
  item: ExtractedMedication;
  onSave: (item: ExtractedMedication) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [genericName, setGenericName] = useState(item.genericName || '');
  const [dosage, setDosage] = useState(item.dosage || '');
  const [frequency, setFrequency] = useState(item.frequency || '');
  const [route, setRoute] = useState(item.route || 'Oral');
  const [status, setStatus] = useState<MedicationStatus>(item.status || 'Active');
  const [startDate, setStartDate] = useState(item.startDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...item,
      name,
      genericName: genericName || undefined,
      dosage,
      frequency,
      route,
      status,
      startDate: startDate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Medication Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Generic Name (optional)
        </label>
        <input
          type="text"
          value={genericName}
          onChange={(e) => setGenericName(e.target.value)}
          placeholder="e.g. Metformin Hydrochloride"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Dosage *
          </label>
          <input
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 500 mg"
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Frequency *
          </label>
          <input
            type="text"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="e.g. Twice daily with meals"
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Route
          </label>
          <input
            type="text"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            placeholder="e.g. Oral"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MedicationStatus)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="Active">Active</option>
            <option value="Discontinued">Discontinued</option>
            <option value="Historical">Historical</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Check className="w-4 h-4" /> Save Corrections
        </button>
      </div>
    </form>
  );
}

// Sub-form for LabResult
function LabResultForm({
  item,
  onSave,
  onCancel,
}: {
  item: ExtractedLabResult;
  onSave: (item: ExtractedLabResult) => void;
  onCancel: () => void;
}) {
  const [testName, setTestName] = useState(item.testName);
  const [parameterName, setParameterName] = useState(item.parameterName || item.testName);
  const [value, setValue] = useState(String(item.value));
  const [unit, setUnit] = useState(item.unit || '');
  const [referenceRange, setReferenceRange] = useState(item.referenceRange || '');
  const [date, setDate] = useState(item.date || '');
  const [interpretation, setInterpretation] = useState(item.interpretation || 'Normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...item,
      testName,
      parameterName,
      value: isNaN(Number(value)) ? value : Number(value),
      unit,
      referenceRange: referenceRange || undefined,
      date: date || undefined,
      interpretation: interpretation as any,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Test / Panel Name *
          </label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Parameter / Analyte *
          </label>
          <input
            type="text"
            value={parameterName}
            onChange={(e) => setParameterName(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Value *
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 6.8"
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Unit *
          </label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. % or mg/dL"
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reference Range
          </label>
          <input
            type="text"
            value={referenceRange}
            onChange={(e) => setReferenceRange(e.target.value)}
            placeholder="e.g. 4.0 - 5.6 %"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Interpretation
          </label>
          <select
            value={interpretation}
            onChange={(e) => setInterpretation(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="Normal">Normal</option>
            <option value="Target">Target</option>
            <option value="Elevated">Elevated</option>
            <option value="Low">Low</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Check className="w-4 h-4" /> Save Corrections
        </button>
      </div>
    </form>
  );
}

// Sub-form for Procedure
function ProcedureForm({
  item,
  onSave,
  onCancel,
}: {
  item: ExtractedProcedure;
  onSave: (item: ExtractedProcedure) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [date, setDate] = useState(item.date || '');
  const [provider, setProvider] = useState(item.provider || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...item,
      name,
      date: date || undefined,
      provider: provider || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Procedure Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Procedure Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Performing Provider
          </label>
          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g. Dr. Jane Smith"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Check className="w-4 h-4" /> Save Corrections
        </button>
      </div>
    </form>
  );
}

// Sub-form for Allergy
function AllergyForm({
  item,
  onSave,
  onCancel,
}: {
  item: ExtractedAllergy;
  onSave: (item: ExtractedAllergy) => void;
  onCancel: () => void;
}) {
  const [substance, setSubstance] = useState(item.substance);
  const [reaction, setReaction] = useState(item.reaction || '');
  const [severity, setSeverity] = useState(item.severity || 'Unknown');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...item,
      substance,
      reaction: reaction || undefined,
      severity: severity as any,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Allergen / Substance *
        </label>
        <input
          type="text"
          value={substance}
          onChange={(e) => setSubstance(e.target.value)}
          required
          placeholder="e.g. Penicillin"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Observed Reaction
          </label>
          <input
            type="text"
            value={reaction}
            onChange={(e) => setReaction(e.target.value)}
            placeholder="e.g. Rash, Hives, Anaphylaxis"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Severity
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Check className="w-4 h-4" /> Save Corrections
        </button>
      </div>
    </form>
  );
}
