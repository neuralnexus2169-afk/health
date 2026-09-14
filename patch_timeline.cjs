const fs = require('fs');
let code = fs.readFileSync('src/components/timeline/Timeline.tsx', 'utf8');

code = code.replace(/onViewSource: \(event: EnrichedMedicalEvent\) => void;/, "onViewSource: (event: EnrichedMedicalEvent) => void;\n  onDeleteEvent?: (id: string, type: 'event' | 'diagnosis' | 'medication' | 'lab') => void;");

code = code.replace(/onViewSource,\n  onResetFilters,/, "onViewSource,\n  onDeleteEvent,\n  onResetFilters,");

code = code.replace(/onViewSource=\{onViewSource\}/, "onViewSource={onViewSource}\n                  onDeleteEvent={onDeleteEvent}");

fs.writeFileSync('src/components/timeline/Timeline.tsx', code);
