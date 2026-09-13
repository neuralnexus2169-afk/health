import React from 'react';
import {
  Calendar,
  Pill,
  Activity,
  Building2,
  AlertTriangle,
  History,
  Shield,
  Stethoscope,
} from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

interface QuestionCard {
  category: string;
  icon: React.ElementType;
  question: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const SUGGESTED_CARDS: QuestionCard[] = [
  {
    category: 'Diagnostic Timeline',
    icon: Calendar,
    question: 'When was diabetes first documented?',
    description: 'Pinpoint the initial clinical encounter, provider, and baseline laboratory findings.',
    badge: 'Timeline',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    category: 'Medication History',
    icon: Pill,
    question: 'What medications has this patient taken?',
    description: 'Review active and historic prescriptions, dosages, and documented indications.',
    badge: 'Prescriptions',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    category: 'Laboratory Trajectory',
    icon: Activity,
    question: 'Show me the HbA1c results over time.',
    description: 'Plot confirmed longitudinal HbA1c values with target control thresholds.',
    badge: 'Lab Trend',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    category: 'Treatment Changes',
    icon: History,
    question: "What changed in the patient's medication history?",
    description: 'Trace therapy titration, inpatient intensification, and SGLT2i switch.',
    badge: 'Regimen',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    category: 'Facilities Visited',
    icon: Building2,
    question: 'Which hospitals has this patient visited?',
    description: 'Summarize encounters across inpatient, diagnostic, and specialty clinics.',
    badge: 'Encounters',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    category: 'Inpatient Hospitalizations',
    icon: Stethoscope,
    question: "Summarize the patient's hospitalizations.",
    description: 'Review the November 2023 acute hyperglycemic inpatient stay.',
    badge: 'Inpatient',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    category: 'Document Inconsistency',
    icon: AlertTriangle,
    question: 'Are there conflicting allergy records?',
    description: 'Examine penicillin allergy documentation discrepancy across encounters.',
    badge: 'Safety Check',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  {
    category: 'Hypertension Timeline',
    icon: Calendar,
    question: 'When was hypertension first documented?',
    description: 'Identify 2020 cardiology consultation and initial Amlodipine initiation.',
    badge: 'Cardiovascular',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
  },
];

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium mb-3">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          Confirmed Clinical Records Only · Zero Hallucination
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          Ask About Your Health History
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto mt-2 leading-relaxed">
          Ask questions about documented diagnoses, medication adjustments, lab trends, hospital admissions, and care facilities. Answers are strictly grounded in your confirmed database records.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {SUGGESTED_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(card.question)}
              className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {card.category}
                    </span>
                  </div>
                  {card.badge && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                  "{card.question}"
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-blue-600">
                <span>Click to ask</span>
                <span className="font-mono text-xs">→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Safety Policy Notice */}
      <div className="mt-6 p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs text-center">
        <strong>Safety Rule:</strong> This assistant is a medical history retrieval and summarization tool. It will not diagnose, prescribe, or provide medical advice. If you have questions about medical advice, please consult your physician.
      </div>
    </div>
  );
}
