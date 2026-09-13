import React from 'react';
import { Bot, User, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
import { HealthAssistantMessage } from '../../types/medical';
import { SourceChips } from './SourceChips';
import { InconsistencyBanner } from './InconsistencyBanner';
import { LabResultVisualization } from './LabResultVisualization';
import { MedicationTableVisualization } from './MedicationTableVisualization';

interface ChatMessageItemProps {
  key?: React.Key;
  message: HealthAssistantMessage;
  onSelectSuggestion?: (question: string) => void;
  onNavigateToDocument?: (docId: string) => void;
}

export function ChatMessageItem({
  message,
  onSelectSuggestion,
  onNavigateToDocument,
}: ChatMessageItemProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="px-4 py-2.5 rounded-2xl rounded-tr-xs bg-slate-900 text-white shadow-xs text-sm leading-relaxed">
            <p>{message.content}</p>
            <span className="block text-[10px] text-slate-400 mt-1 text-right">
              {message.timestamp}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start gap-3 max-w-[92%] sm:max-w-[85%]">
        {/* Assistant Avatar */}
        <div className="w-8 h-8 rounded-xl bg-blue-900 text-blue-100 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          <Bot className="w-4 h-4" />
        </div>

        {/* Assistant Content Box */}
        <div className="flex-1 min-w-0">
          <div className="p-4 sm:p-5 rounded-2xl rounded-tl-xs bg-white border border-slate-200/90 shadow-2xs text-slate-800 text-sm leading-relaxed">
            {/* Header tag */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span>Health History Assistant</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-normal text-slate-500">Confirmed Records</span>
              </div>
              <span className="text-[10px] text-slate-400">{message.timestamp}</span>
            </div>

            {/* Safety Notice Banner if user asked for medical advice */}
            {message.safetyNotice && (
              <div className="mb-3 p-3 rounded-lg border border-amber-200 bg-amber-50/80 text-amber-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Safety & Regulatory Notice</strong>
                  <p>{message.safetyNotice}</p>
                </div>
              </div>
            )}

            {/* Inconsistency / Conflict Banner */}
            {message.potentialInconsistency && (
              <InconsistencyBanner
                inconsistency={message.potentialInconsistency}
                onNavigateToDocument={onNavigateToDocument}
              />
            )}

            {/* Main Response Text */}
            <div className="text-slate-800 space-y-2 whitespace-pre-line leading-relaxed">
              {message.content}
            </div>

            {/* Structured Lab Chart Visualization */}
            {message.structuredData?.type === 'chart' && message.structuredData.chartData && (
              <LabResultVisualization
                title={message.structuredData.title}
                chartData={message.structuredData.chartData}
              />
            )}

            {/* Structured Medication Table Visualization */}
            {message.structuredData?.type === 'table' && message.structuredData.tableData && (
              <MedicationTableVisualization
                title={message.structuredData.title}
                tableData={message.structuredData.tableData}
              />
            )}

            {/* Grounded Source Citations */}
            <SourceChips
              sourceEventIds={message.sourceEventIds}
              sourceDocumentIds={message.sourceDocumentIds}
              onNavigateToDocument={onNavigateToDocument}
            />
          </div>

          {/* Suggested Follow-up Prompts */}
          {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
            <div className="mt-2.5 pl-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Suggested:
              </span>
              {message.suggestedFollowUps.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectSuggestion?.(suggestion)}
                  className="px-2.5 py-1 text-xs rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 border border-slate-200/80 transition-all text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
