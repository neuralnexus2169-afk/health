const fs = require('fs');
let code = fs.readFileSync('src/features/labs/LabsPage.tsx', 'utf8');

if (!code.includes('Trash2')) {
  code = code.replace(/import { (.*?) } from 'lucide-react';/, "import { $1, Trash2 } from 'lucide-react';");
}

const handleDeleteCode = `
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this manually entered record?\\nThis will remove the record from your health history. This action cannot be undone.")) return;
    try {
      const { deleteRecord } = await import('../../services/patientService');
      await deleteRecord('LabResult', id);
      setLabs(labs.filter(l => l.id !== id));
    } catch (err) {
      alert("Failed to delete record.");
    }
  };
`;

if (!code.includes('handleDelete')) {
  code = code.replace(/const \[selectedPanel, setSelectedPanel\] = useState/, handleDeleteCode + '\n  const [selectedPanel, setSelectedPanel] = useState');
}

const actionsCode = `                      <td className="py-3.5 px-4 text-xs text-zinc-500">
                        <div>{lab.facilityName || 'Meridian Medical Centre'}</div>
                        {lab.isManualEntry ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase">Manual Entry</span>
                            <button onClick={() => handleDelete(lab.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete manual record"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : lab.documentFileName && (
                          <span className="text-[11px] text-teal-700 font-mono truncate max-w-[140px] block">
                            {lab.documentFileName}
                          </span>
                        )}
                      </td>`;

code = code.replace(/<td className="py-3.5 px-4 text-xs text-zinc-500">\s*<div>\{lab\.facilityName \|\| 'Meridian Medical Centre'\}<\/div>\s*\{lab\.documentFileName && \(\s*<span className="text-\[11px\] text-teal-700 font-mono truncate max-w-\[140px\] block">\s*\{lab\.documentFileName\}\s*<\/span>\s*\)\}\s*<\/td>/m, actionsCode);

fs.writeFileSync('src/features/labs/LabsPage.tsx', code);
