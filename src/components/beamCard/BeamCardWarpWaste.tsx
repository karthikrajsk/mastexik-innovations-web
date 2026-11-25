import React, { useState } from 'react';
import { WarpWaste, UpdateWastePayload } from '@/types/beamCard';
import { Edit2, Check, X } from 'lucide-react';

interface Props {
  warpWaste: WarpWaste;
  onUpdateWaste?: (payload: UpdateWastePayload) => void;
  readOnly?: boolean;
}

export const BeamCardWarpWaste: React.FC<Props> = ({ warpWaste, onUpdateWaste, readOnly = false }) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [kgsInput, setKgsInput] = useState<string>('');
  const [mtrsInput, setMtrsInput] = useState<string>('');

  const startEdit = (cat: "KNOTTING" | "RE-KNOTTING" | "R/O WASTE", currentKgs: number, currentMtrs: number) => {
    if (readOnly) return;
    setEditingCategory(cat);
    setKgsInput(currentKgs ? currentKgs.toString() : '');
    setMtrsInput(currentMtrs ? currentMtrs.toString() : '');
  };

  const saveEdit = (cat: "KNOTTING" | "RE-KNOTTING" | "R/O WASTE") => {
    if (onUpdateWaste) {
      onUpdateWaste({
        category: cat,
        kgs: parseFloat(kgsInput) || 0,
        mtrs: parseFloat(mtrsInput) || 0
      });
    }
    setEditingCategory(null);
  };

  const categories: Array<{ label: string; key: "KNOTTING" | "RE-KNOTTING" | "R/O WASTE"; val: { kgs: number; mtrs: number } }> = [
    { label: "KNOTTING", key: "KNOTTING", val: warpWaste.knotting || { kgs: 0, mtrs: 0 } },
    { label: "RE-KNOTTING", key: "RE-KNOTTING", val: warpWaste.reKnotting || { kgs: 0, mtrs: 0 } },
    { label: "R/O WASTE", key: "R/O WASTE", val: warpWaste.roWaste || { kgs: 0, mtrs: 0 } },
  ];

  return (
    <div className="bg-white font-mono text-xs text-slate-900 h-full">
      <div className="bg-slate-200/90 p-1.5 text-center font-extrabold tracking-wider border-b border-slate-800 uppercase">
        WARP WASTE DETAILS
      </div>
      <table className="common-table w-full border-collapse text-left">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-800 text-center font-bold text-2xs">
            <th className="p-1 border-r border-slate-800">Details</th>
            <th className="p-1 border-r border-slate-800 w-24">Kgs</th>
            <th className="p-1 border-r border-slate-800 w-24">Mtrs</th>
            {!readOnly && <th className="p-1 w-10 print:hidden">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {categories.map((c) => {
            const isEditing = editingCategory === c.key;

            return (
              <tr key={c.key} className="hover:bg-slate-50">
                <td className="p-1.5 font-semibold border-r border-slate-400 pl-3">
                  {c.label}
                </td>
                
                {isEditing ? (
                  <>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={kgsInput}
                        onChange={(e) => setKgsInput(e.target.value)}
                        className="w-full px-1 border border-blue-500 rounded text-right font-mono"
                        placeholder="0.00"
                        autoFocus
                      />
                    </td>
                    <td className="p-1 border-r border-slate-400">
                      <input
                        type="number"
                        step="0.01"
                        value={mtrsInput}
                        onChange={(e) => setMtrsInput(e.target.value)}
                        className="w-full px-1 border border-blue-500 rounded text-right font-mono"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1 text-center print:hidden">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => saveEdit(c.key)}
                          className="text-emerald-700 hover:text-emerald-900 p-0.5"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="text-red-600 hover:text-red-800 p-0.5"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-1.5 text-right font-medium border-r border-slate-400 pr-3">
                      {c.val.kgs ? c.val.kgs.toFixed(2) : '-'}
                    </td>
                    <td className="p-1.5 text-right font-medium border-r border-slate-400 pr-3">
                      {c.val.mtrs ? c.val.mtrs.toFixed(2) : '-'}
                    </td>
                    {!readOnly && (
                      <td className="p-1 text-center print:hidden">
                        <button
                          onClick={() => startEdit(c.key, c.val.kgs, c.val.mtrs)}
                          className="text-slate-500 hover:text-slate-900 p-0.5"
                          title="Edit waste values"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-200/90 font-extrabold border-t-2 border-slate-900">
            <td className="p-1.5 border-r border-slate-800 pl-3 uppercase">TOTAL</td>
            <td className="p-1.5 text-right border-r border-slate-800 pr-3 underline">
              {warpWaste.total.kgs ? warpWaste.total.kgs.toFixed(2) : '0.00'}
            </td>
            <td className="p-1.5 text-right border-r border-slate-800 pr-3 underline">
              {warpWaste.total.mtrs ? warpWaste.total.mtrs.toFixed(2) : '0.00'}
            </td>
            {!readOnly && <td className="print:hidden"></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
