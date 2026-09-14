const fs = require('fs');
let code = fs.readFileSync('src/features/diagnoses/DiagnosesPage.tsx', 'utf8');

if (!code.includes('Trash2')) {
  code = code.replace(/import { (.*?) } from 'lucide-react';/, "import { $1, Trash2 } from 'lucide-react';");
}

const handleDeleteCode = `
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this manually entered record?\\nThis will remove the record from your health history. This action cannot be undone.")) return;
    try {
      const { deleteRecord } = await import('../../services/patientService');
      await deleteRecord('Diagnosis', id);
      setDiagnoses(diagnoses.filter(d => d.id !== id));
    } catch (err) {
      alert("Failed to delete record.");
    }
  };
`;

if (!code.includes('handleDelete')) {
  code = code.replace(/const \[statusFilter, setStatusFilter\] = useState/, handleDeleteCode + '\n  const [statusFilter, setStatusFilter] = useState');
}

const actionButtonsCode = `                  <div className="flex items-center gap-2">
                    {diag.isManualEntry && (
                      <>
                        <span className="text-[10px] font-semibold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase">Manual Entry</span>
                        <button onClick={() => handleDelete(diag.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete manual record"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate('timeline')}
                      className="text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Timeline</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>`;

code = code.replace(/<button\s+type="button"\s+onClick=\{\(\) => onNavigate\('timeline'\)\}[\s\S]*?<\/button>/, actionButtonsCode);

fs.writeFileSync('src/features/diagnoses/DiagnosesPage.tsx', code);
