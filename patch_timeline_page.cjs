const fs = require('fs');
let code = fs.readFileSync('src/features/timeline/TimelinePage.tsx', 'utf8');

const handleDeleteCode = `
  const handleDeleteEvent = async (id: string, type: 'event' | 'diagnosis' | 'medication' | 'lab') => {
    if (!window.confirm("Delete this manually entered record?\\nThis will remove the record from your health history. This action cannot be undone.")) return;
    try {
      const { deleteRecord } = await import('../../services/patientService');
      let targetModel = 'MedicalEvent';
      if (type === 'diagnosis') targetModel = 'Diagnosis';
      else if (type === 'medication') targetModel = 'Medication';
      else if (type === 'lab') targetModel = 'LabResult';

      await deleteRecord(targetModel, id);
      
      // refresh events
      setEvents(events.filter(e => {
        if (type === 'event' && e.id === id) return false;
        if (type === 'diagnosis' && e.diagnoses && e.diagnoses.some(d => d.id === id)) return false;
        if (type === 'medication' && e.medications && e.medications.some(m => m.id === id)) return false;
        if (type === 'lab' && e.labResults && e.labResults.some(l => l.id === id)) return false;
        return true; // Simplified optimisitic update, full refresh would be better
      }));
      // Just doing a window.location.reload() or calling the fetch function would be cleaner
      window.location.reload();
    } catch (err) {
      alert("Failed to delete record.");
    }
  };
`;

if (!code.includes('handleDeleteEvent')) {
  code = code.replace(/const handleSelectEvent =/, handleDeleteCode + '\n  const handleSelectEvent =');
}

code = code.replace(/onViewSource=\{handleViewSource\}/, "onViewSource={handleViewSource}\n          onDeleteEvent={handleDeleteEvent}");

fs.writeFileSync('src/features/timeline/TimelinePage.tsx', code);
