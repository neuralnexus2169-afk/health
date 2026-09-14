import React, { useState } from 'react';
import { PatientProfile } from '../../types';
import { patientRepository } from '../../lib/db/repositories';

interface OnboardingPageProps {
  onComplete: (patient: PatientProfile) => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob) return;
    
    setIsSubmitting(true);
    try {
      const newPatient = await patientRepository.create({
        id: `pat-${Date.now()}`,
        name,
        dateOfBirth: dob,
        gender: gender as any,
        bloodGroup: 'Unknown',
        allergies: [],
      });
      
      const profile: PatientProfile = {
        id: newPatient.id,
        name: newPatient.name,
        type: 'User Patient',
        age: new Date().getFullYear() - new Date(newPatient.dateOfBirth).getFullYear(),
        gender: newPatient.gender,
        dateOfBirth: newPatient.dateOfBirth,
        lastUpdated: new Date().toLocaleDateString(),
        recordsCount: 0,
        providersCount: 0,
        bloodType: 'Unknown',
        allergies: [],
        primaryCarePhysician: 'Unassigned',
      };
      
      onComplete(profile);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-app)] p-4">
      <div className="max-w-md w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-emerald-950 dark:text-emerald-50">Welcome to HealthTimeline</h1>
          <p className="text-sm text-emerald-700/80 dark:text-emerald-200/70 mt-2">
            Build your personal longitudinal health record. Add your basic information to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Full Name <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-surface-elevated)] border border-emerald-200/50 dark:border-emerald-800/50 rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-shadow"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Date of Birth <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <input
              id="dob"
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-surface-elevated)] border border-emerald-200/50 dark:border-emerald-800/50 rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Sex (Optional)
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-surface-elevated)] border border-emerald-200/50 dark:border-emerald-800/50 rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-shadow"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !name || !dob}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm shadow-emerald-900/20"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Set up my health profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
