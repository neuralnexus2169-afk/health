import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { addManualMedicalEvent, addManualDiagnosis, addManualMedication, addManualLabResult } from '../../services/patientService';

export interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onRecordCreated: () => void;
}

export function AddRecordModal({ isOpen, onClose, patientId, onRecordCreated }: AddRecordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Select Type, 2: Form, 3: Review, 4: Success
  const [recordType, setRecordType] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectType = (type: string) => {
    setRecordType(type);
    setFormData({});
    setStep(2);
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!recordType) return false;
    if (recordType === 'Medical Event' || recordType === 'Procedure') {
      if (!formData.title || !formData.eventDate) return false;
    }
    if (recordType === 'Diagnosis') {
      if (!formData.name || !formData.date) return false;
    }
    if (recordType === 'Medication') {
      if (!formData.name || !formData.status) return false;
    }
    if (recordType === 'Lab Result') {
      if (!formData.testName || !formData.value || !formData.date) return false;
    }
    if (recordType === 'Allergy') {
      if (!formData.allergen) return false;
    }
    return true;
  };

  const handleReview = () => {
    if (validateForm()) {
      setStep(3);
    } else {
      setError("Please fill in all required fields.");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (recordType === 'Medical Event' || recordType === 'Procedure') {
        await addManualMedicalEvent({
          patientId,
          eventType: recordType === 'Procedure' ? 'Procedure' : (formData.eventType || 'Other'),
          eventDate: new Date(formData.eventDate).toISOString(),
          title: formData.title,
          description: formData.notes || '',
          facilityName: formData.facility,
          providerName: formData.provider,
        } as any);
      } else if (recordType === 'Diagnosis') {
        await addManualDiagnosis({
          patientId,
          name: formData.name,
          status: formData.status || 'Active',
          firstDocumentedDate: new Date(formData.date).toISOString(),
          lastDocumentedDate: new Date().toISOString(),
          clinicalNotes: formData.notes,
        } as any);
      } else if (recordType === 'Medication') {
        await addManualMedication({
          patientId,
          name: formData.name,
          dosage: formData.dosage || '',
          frequency: formData.frequency || '',
          route: formData.route,
          status: formData.status || 'Active',
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
          indication: formData.notes,
        } as any);
      } else if (recordType === 'Lab Result') {
        await addManualLabResult({
          patientId,
          testName: formData.testName,
          parameterName: formData.testName,
          value: parseFloat(formData.value) || 0,
          unit: formData.unit || '',
          referenceRange: formData.referenceRange,
          testDate: new Date(formData.date).toISOString(),
          facilityName: formData.laboratory,
          interpretation: 'Normal', // Basic default for manual entry if unknown
        } as any);
      } else if (recordType === 'Allergy') {
        await addManualMedicalEvent({
          patientId,
          eventType: 'Allergy',
          eventDate: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
          title: formData.allergen,
          description: formData.reaction || '',
          facilityName: formData.facility,
          providerName: formData.provider,
        } as any);
      }

      setStep(4);
      onRecordCreated();
    } catch (err: any) {
      setError(err.message || 'Unable to add record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setRecordType(null);
    setFormData({});
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={step === 4 ? '' : 'Add Health Record'} size="lg">
      <div className="p-4 sm:p-6 space-y-4 text-[var(--color-text-primary)]">
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Add information directly to your health record. You can edit or remove it later.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {['Medical Event', 'Diagnosis', 'Medication', 'Lab Result', 'Allergy', 'Procedure'].map(t => (
                <Button key={t} variant="outline" className="justify-center h-16" onClick={() => handleSelectType(t)}>
                  {t}
                </Button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && recordType && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{recordType} Details</h3>
            
            {/* Form Fields based on Type */}
            {recordType === 'Medical Event' || recordType === 'Procedure' ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Title / Procedure Name *</label>
                  <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.title || ''} onChange={e => handleFieldChange('title', e.target.value)} placeholder="e.g. Consultation with Dr. Smith" />
                </div>
                {recordType === 'Medical Event' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Event Type</label>
                    <select className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.eventType || ''} onChange={e => handleFieldChange('eventType', e.target.value)}>
                      <option value="">Select...</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Hospitalization">Hospitalization</option>
                      <option value="Emergency Visit">Emergency Visit</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date *</label>
                  <input type="date" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.eventDate || ''} onChange={e => handleFieldChange('eventDate', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Provider</label>
                  <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.provider || ''} onChange={e => handleFieldChange('provider', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Facility</label>
                  <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.facility || ''} onChange={e => handleFieldChange('facility', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.notes || ''} onChange={e => handleFieldChange('notes', e.target.value)}></textarea>
                </div>
              </>
            ) : null}

            {recordType === 'Diagnosis' ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Condition Name *</label>
                  <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.name || ''} onChange={e => handleFieldChange('name', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date *</label>
                  <input type="date" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.date || ''} onChange={e => handleFieldChange('date', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <select className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.status || 'Active'} onChange={e => handleFieldChange('status', e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Historical">Historical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.notes || ''} onChange={e => handleFieldChange('notes', e.target.value)}></textarea>
                </div>
              </>
            ) : null}

            {recordType === 'Medication' ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Medication Name *</label>
                  <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.name || ''} onChange={e => handleFieldChange('name', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Dose</label>
                    <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.dosage || ''} onChange={e => handleFieldChange('dosage', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Frequency</label>
                    <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.frequency || ''} onChange={e => handleFieldChange('frequency', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Start Date</label>
                  <input type="date" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.startDate || ''} onChange={e => handleFieldChange('startDate', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status *</label>
                  <select className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.status || 'Active'} onChange={e => handleFieldChange('status', e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Discontinued">Discontinued</option>
                    <option value="Historical">Historical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.notes || ''} onChange={e => handleFieldChange('notes', e.target.value)}></textarea>
                </div>
              </>
            ) : null}

            {recordType === 'Lab Result' ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Test Name *</label>
                  <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.testName || ''} onChange={e => handleFieldChange('testName', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Result Value *</label>
                    <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.value || ''} onChange={e => handleFieldChange('value', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Unit</label>
                    <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.unit || ''} onChange={e => handleFieldChange('unit', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date *</label>
                  <input type="date" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.date || ''} onChange={e => handleFieldChange('date', e.target.value)} />
                </div>
              </>
            ) : null}

            {recordType === 'Allergy' ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Allergen (e.g. Penicillin) *</label>
                  <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.allergen || ''} onChange={e => handleFieldChange('allergen', e.target.value)} />
                  <p className="text-xs text-[var(--color-text-tertiary)]">Enter "No known drug allergies" if applicable.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Reaction</label>
                  <input type="text" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.reaction || ''} onChange={e => handleFieldChange('reaction', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date Recorded</label>
                  <input type="date" className="w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]" value={formData.date || ''} onChange={e => handleFieldChange('date', e.target.value)} />
                </div>
              </>
            ) : null}

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" onClick={handleReview}>Review</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Review Record</h3>
            <div className="bg-[var(--color-surface-hover)] p-4 rounded-md space-y-2 text-sm">
              <p><span className="font-medium">Type:</span> {recordType}</p>
              {Object.keys(formData).map(key => formData[key] && (
                <p key={key}><span className="font-medium capitalize">{key}:</span> {formData[key]}</p>
              ))}
              <p><span className="font-medium">Source:</span> Manual entry</p>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Edit</Button>
              <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>Add to Health Record</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-xl font-semibold">Record added successfully</h3>
            <Button variant="primary" onClick={resetAndClose}>Done</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
