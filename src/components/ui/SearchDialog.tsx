import React, { useState, useEffect } from 'react';
import { Search, FileText, Pill, Activity, Calendar, ArrowRight, X } from 'lucide-react';
import { NavigationRoute } from '../../types';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: NavigationRoute) => void;
}

export function SearchDialog({ isOpen, onClose, onNavigate }: SearchDialogProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { title: 'Type 2 Diabetes', category: 'Condition', route: 'diagnoses' as NavigationRoute, icon: Activity },
    { title: 'Metformin 500 mg', category: 'Medication', route: 'medications' as NavigationRoute, icon: Pill },
    { title: 'HbA1c Lab Panel (Aug 24)', category: 'Lab Result', route: 'lab-results' as NavigationRoute, icon: FileText },
    { title: 'Cardiology Follow-up', category: 'Event', route: 'timeline' as NavigationRoute, icon: Calendar },
  ];

  const filteredLinks = query.trim()
    ? quickLinks.filter(item => item.title.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()))
    : quickLinks;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search records, diagnoses, medications, or labs..."
            className="w-full bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-3 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {query ? 'Quick Links' : 'Suggested Health Items'}
            </span>
            {query.trim() && (
              <button
                type="button"
                onClick={() => {
                  onNavigate('search');
                  onClose();
                }}
                className="text-xs text-zinc-600 hover:text-zinc-900 font-medium cursor-pointer"
              >
                Open Full Search →
              </button>
            )}
          </div>

          {filteredLinks.length === 0 ? (
            <div className="py-6 text-center text-sm text-zinc-500 space-y-2">
              <p>No matching quick links found for &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                onClick={() => {
                  onNavigate('search');
                  onClose();
                }}
                className="text-xs font-semibold text-zinc-900 underline cursor-pointer"
              >
                Search all confirmed health records for &ldquo;{query}&rdquo;
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLinks.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onNavigate(item.route);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-zinc-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-zinc-100 text-zinc-600 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900">
                          {item.title}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {item.category}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
