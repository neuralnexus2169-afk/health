import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Bot,
  Loader2,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { HealthAssistantMessage, ConversationTurn } from '../../types/medical';
import { askHealthHistoryAssistant } from '../../services/healthAssistantService';
import { ChatMessageItem } from './ChatMessageItem';
import { SuggestedQuestions } from './SuggestedQuestions';
import { NavigationRoute } from '../../types';

interface ChatInterfaceProps {
  patientId: string;
  patientName?: string;
  initialQuestion?: string;
  onNavigate?: (route: NavigationRoute) => void;
  onNavigateToDocument?: (docId: string) => void;
}

export function ChatInterface({
  patientId,
  patientName = '',
  initialQuestion,
  onNavigate,
  onNavigateToDocument,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<HealthAssistantMessage[]>([]);
  const [inputText, setInputText] = useState(initialQuestion || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuestion) {
      setInputText(initialQuestion);
    }
  }, [initialQuestion]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputText).trim();
    if (!question || isLoading) return;

    setError(null);
    setInputText('');

    // Format current conversation history
    const history: ConversationTurn[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const userMsg: HealthAssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const answer = await askHealthHistoryAssistant(patientId, question, history);

      const assistantMsg: HealthAssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceEventIds: answer.sourceEventIds,
        sourceDocumentIds: answer.sourceDocumentIds,
        confidence: answer.confidence,
        safetyNotice: answer.safetyNotice,
        potentialInconsistency: answer.potentialInconsistency,
        structuredData: answer.structuredData,
        suggestedFollowUps: answer.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Failed to get answer:', err);
      setError('Unable to retrieve records right now. Please try asking again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setInputText('');
  };

  const quickPills = [
    'When was my earliest diagnosis?',
    'What medications am I taking?',
    'Show me my recent lab results.',
    'Which hospitals have I visited?',
    'Are there conflicting allergy records?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto bg-slate-50/50">
      {/* Top Clinical Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-900 text-blue-100 flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold text-slate-900">
                AI Health History Assistant
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Confirmed Records RAG
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Patient: <span className="font-medium text-slate-700">{patientName}</span> · Longitudinal Q&A Grounding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <SuggestedQuestions onSelect={(q) => handleSendMessage(q)} />
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                onSelectSuggestion={(suggestion) => handleSendMessage(suggestion)}
                onNavigateToDocument={onNavigateToDocument}
              />
            ))}

            {isLoading && (
              <div className="flex items-start gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-blue-900 text-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-xs bg-white border border-slate-200 shadow-2xs text-slate-700 text-xs flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Reviewing documented health records & generating grounded response...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input Dock */}
      <div className="bg-white border-t border-slate-200 p-3 sm:p-4 shrink-0 shadow-xs">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick prompt pills if in conversation */}
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[11px] text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Quick ask:
              </span>
              {quickPills.map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(pill)}
                  disabled={isLoading}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 text-xs transition-colors disabled:opacity-50"
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="relative flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask a question about your documented medical history (e.g., 'When was diabetes first documented?')"
              className="flex-1 max-h-32 min-h-[44px] py-3 pl-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent resize-none focus:outline-hidden disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-2xs"
              title="Send question (Enter)"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>
              Strict medical-history retrieval tool · Grounded in confirmed records
            </span>
            <span className="hidden sm:inline">Press Enter to send · Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
