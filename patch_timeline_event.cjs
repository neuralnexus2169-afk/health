const fs = require('fs');
let code = fs.readFileSync('src/components/timeline/TimelineEvent.tsx', 'utf8');

if (!code.includes('Trash2')) {
  code = code.replace(/import { (.*?) } from 'lucide-react';/, "import { $1, Trash2 } from 'lucide-react';");
}

code = code.replace(/onViewSource\?: \(event: EnrichedMedicalEvent\) => void;/, "onViewSource?: (event: EnrichedMedicalEvent) => void;\n  onDeleteEvent?: (id: string, type: 'event' | 'diagnosis' | 'medication' | 'lab') => void;");
code = code.replace(/export function TimelineEvent\(\{ event, onSelect, onViewSource \}: TimelineEventProps\) \{/, "export function TimelineEvent({ event, onSelect, onViewSource, onDeleteEvent }: TimelineEventProps) {");

const manualBadge = `
          {event.isManualEntry ? (
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <span className="text-[10px] font-semibold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase">Manual Entry</span>
              {onDeleteEvent && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    let type: 'event' | 'diagnosis' | 'medication' | 'lab' = 'event';
                    if (event.eventType === 'Diagnosis') type = 'diagnosis';
                    else if (event.eventType === 'Medication') type = 'medication';
                    else if (event.eventType === 'Lab Result') type = 'lab';
                    onDeleteEvent(event.id, type);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete manual record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            (event.documentFileName || event.sourceReference) && (
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewSource) {
                      onViewSource(event);
                    } else {
                      onSelect(event);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-teal-800 bg-zinc-100 hover:bg-teal-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  title="View verified source document record"
                >
                  <FileText className="w-3 h-3 text-zinc-400" />
                  <span className="truncate max-w-[140px]">
                    {event.documentFileName || event.sourceReference?.documentFileName}
                  </span>
                  {event.sourceReference?.pageNumber && (
                    <span className="text-zinc-400">p. {event.sourceReference.pageNumber}</span>
                  )}
                </button>
              </div>
            )
          )}
`;

code = code.replace(/\{\(event\.documentFileName \|\| event\.sourceReference\) && \([\s\S]*?<\/div>\s*\)\}/, manualBadge);

fs.writeFileSync('src/components/timeline/TimelineEvent.tsx', code);
