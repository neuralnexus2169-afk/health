import React from 'react';
import { Upload, GitCommitHorizontal, FileText, Sparkles, FileDown, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { NavigationRoute } from '../../types';

interface QuickActionsProps {
  onNavigate: (route: NavigationRoute) => void;
  onUploadClick: () => void;
  onAddRecordClick?: () => void;
  onExportReportClick?: () => void;
}

export function QuickActions({ onNavigate, onUploadClick, onAddRecordClick, onExportReportClick }: QuickActionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Quick actions
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <Button
          id="qa-export-report-btn"
          variant="outline"
          size="md"
          icon={<FileDown className="w-4 h-4 text-teal-700" />}
          onClick={onExportReportClick}
          className="justify-start py-2.5 px-4 bg-teal-50/50 hover:bg-teal-50 border-teal-200 text-teal-950 text-xs sm:text-sm font-semibold"
        >
          Export report
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={<Plus className="w-4 h-4 text-indigo-700" />}
          onClick={onAddRecordClick}
          className="justify-start py-2.5 px-4 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200 text-indigo-950 text-xs sm:text-sm font-semibold"
        >
          Add record
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={<Upload className="w-4 h-4 text-zinc-700" />}
          onClick={onUploadClick}
          className="justify-start py-2.5 px-4 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 text-xs sm:text-sm font-medium"
        >
          Upload record
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={<GitCommitHorizontal className="w-4 h-4 text-teal-700" />}
          onClick={() => onNavigate('timeline')}
          className="justify-start py-2.5 px-4 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 text-xs sm:text-sm font-medium"
        >
          View timeline
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={<FileText className="w-4 h-4 text-sky-700" />}
          onClick={() => onNavigate('documents')}
          className="justify-start py-2.5 px-4 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 text-xs sm:text-sm font-medium"
        >
          Medical documents
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={<Sparkles className="w-4 h-4 text-amber-600" />}
          onClick={() => onNavigate('ai-assistant')}
          className="justify-start py-2.5 px-4 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800 text-xs sm:text-sm font-medium"
        >
          Ask AI history
        </Button>
      </div>
    </div>
  );
}
