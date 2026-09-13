import React from 'react';
import { Pill } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

interface MedicationTableVisualizationProps {
  title?: string;
  tableData: {
    headers: string[];
    rows: string[][];
  };
}

export function MedicationTableVisualization({
  title,
  tableData,
}: MedicationTableVisualizationProps) {
  if (!tableData || !tableData.rows || tableData.rows.length === 0) return null;

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center gap-2">
        <Pill className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-semibold text-slate-800">
          {title || 'Documented Medications'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              {tableData.headers.map((header, idx) => (
                <th key={idx} className="px-3.5 py-2.5 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableData.rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                {row.map((cell, cIdx) => {
                  const isStatusCol = tableData.headers[cIdx]?.toLowerCase().includes('status');
                  const isDateCol = tableData.headers[cIdx]?.toLowerCase().includes('date');

                  return (
                    <td key={cIdx} className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap">
                      {isStatusCol ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            cell.toLowerCase() === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {cell}
                        </span>
                      ) : isDateCol ? (
                        <span className="font-mono text-[11px] text-slate-600">{cell}</span>
                      ) : cIdx === 0 ? (
                        <strong className="font-semibold text-slate-900">{cell}</strong>
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
