import React from 'react';
import { ProductionDetail } from '@/types/beamCard';
import { formatDateDisplay } from '@/services/beamCardService';

interface Props {
  productionDetails: ProductionDetail[];
  minRows?: number;
  isFactory?: boolean;
  rollWeight?: number | null;
  rollGlm?: number | null;
}

export const BeamCardProductionTable: React.FC<Props> = ({
  productionDetails,
  minRows = 12,
  isFactory = false,
  rollWeight,
  rollGlm
}) => {
  const totalRollLength = productionDetails.reduce((sum, item) => {
    const effectiveRoll = item.isInspected && item.inspectedMtr !== undefined ? item.inspectedMtr : Number(item.rollLength) || 0;
    return sum + effectiveRoll;
  }, 0);

  const totalRollWeight = productionDetails.reduce((sum, item) => {
    return sum + (Number(item.rollWeight) || 0);
  }, 0);

  const avgRollGlm = totalRollLength > 0 && totalRollWeight > 0
    ? (totalRollWeight * 1000) / totalRollLength
    : (productionDetails.filter(p => Number(p.rollGlm) > 0).length > 0
      ? productionDetails.reduce((s, p) => s + (Number(p.rollGlm) || 0), 0) / productionDetails.filter(p => Number(p.rollGlm) > 0).length
      : 0);

  const displayRollWeight = rollWeight != null && rollWeight > 0 ? rollWeight : totalRollWeight;
  const displayRollGlm = rollGlm != null && rollGlm > 0 ? rollGlm : avgRollGlm;

  const displayRowsCount = Math.max(productionDetails.length, minRows);
  const tableRows = Array.from({ length: displayRowsCount }).map((_, index) => {
    return productionDetails[index] || null;
  });

  return (
    <div className="border-x-2 border-b-2 border-slate-900 bg-white font-mono text-xs text-slate-900 overflow-visible">
      {/* Factory Additional Fields Banner in Roll Doff & Fabric Details Section */}
      {isFactory && (
        <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs print:text-2xs">
          <div className="flex items-center space-x-2 font-bold text-slate-800">
            <span className="text-3xs font-extrabold bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded border border-indigo-300">
              FACTORY TYPE
            </span>
            <span className="uppercase tracking-wider text-2xs">ROLL DOFF & FABRIC DETAILS:</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-600">ROLL WEIGHT:</span>
              <span className="font-bold text-blue-900 bg-white px-2 py-0.5 border border-slate-300 rounded-xs">
                {displayRollWeight > 0 ? `${displayRollWeight.toFixed(2)} KG` : '-'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-600">ROLL GLM:</span>
              <span className="font-bold text-blue-900 bg-white px-2 py-0.5 border border-slate-300 rounded-xs">
                {displayRollGlm > 0 ? `${displayRollGlm.toFixed(2)}` : '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      <table className="common-table w-full text-left border-collapse">
        <thead>
          {/* Super Header Section Row */}
          <tr className="bg-slate-200/90 border-b border-slate-800 text-center font-extrabold text-xs uppercase tracking-wider">
            <th colSpan={isFactory ? 8 : 6} className="p-1.5 border-r-2 border-slate-900 text-slate-900 bg-slate-200">
              ROLL DOFF & FABRIC DETAILS
            </th>
            <th colSpan={3} className="p-1.5 text-slate-900 bg-slate-300/80">
              WEFT DETAILS
            </th>
          </tr>

          {/* Sub Header for Columns */}
          <tr className="bg-slate-100 border-b-2 border-slate-900 text-center font-bold text-2xs uppercase">
            <th className="p-1.5 border-r border-slate-800 w-10">Sl. No.</th>
            <th className="p-1.5 border-r border-slate-800 w-22">DATE</th>
            <th className="p-1.5 border-r border-slate-800 w-24">PIECE No.</th>
            <th className="p-1.5 border-r border-slate-800 w-24">DOFF LENGTH</th>
            <th className="p-1.5 border-r border-slate-800 w-20">Roll No</th>
            <th className={`p-1.5 ${isFactory ? 'border-r border-slate-800' : 'border-r-2 border-slate-900'} w-28`}>ROLL LENGTH</th>
            {isFactory && (
              <>
                <th className="p-1.5 border-r border-slate-800 w-24">ROLL WEIGHT</th>
                <th className="p-1.5 border-r-2 border-slate-900 w-24">ROLL GLM</th>
              </>
            )}
            <th className="p-1.5 border-r border-slate-800 w-22">DATE</th>
            <th className="p-1.5 border-r border-slate-800">MILL NAME</th>
            <th className="p-1.5 w-24">LOT No.</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-400">
          {tableRows.map((row, index) => {
            const slNo = index + 1;
            if (!row) {
              return (
                <tr key={`empty-${index}`} className="h-7 hover:bg-slate-50/50">
                  <td className="p-1 text-center border-r border-slate-400 text-slate-400">{slNo}</td>
                  <td className="p-1 border-r border-slate-400"></td>
                  <td className="p-1 border-r border-slate-400"></td>
                  <td className="p-1 border-r border-slate-400"></td>
                  <td className="p-1 border-r border-slate-400"></td>
                  <td className={`p-1 ${isFactory ? 'border-r border-slate-400' : 'border-r-2 border-slate-900'}`}></td>
                  {isFactory && (
                    <>
                      <td className="p-1 border-r border-slate-400"></td>
                      <td className="p-1 border-r-2 border-slate-900"></td>
                    </>
                  )}
                  <td className="p-1 border-r border-slate-400"></td>
                  <td className="p-1 border-r border-slate-400"></td>
                  <td className="p-1"></td>
                </tr>
              );
            }

            const weftItems = row.weftDetails && row.weftDetails.length > 0
              ? row.weftDetails
              : [{ date: '-', millName: '-', lotNo: '-' }];

            const displayRollLength = row.isInspected && row.inspectedMtr !== undefined
              ? row.inspectedMtr
              : row.rollLength;

            const rollNoDisplay = row.rollNo || `R-${String(slNo).padStart(2, '0')}`;

            return (
              <tr key={row.id || index} className="hover:bg-amber-50/30 transition-colors">
                <td className="p-1.5 text-center font-bold border-r border-slate-400 bg-slate-50/60">
                  {slNo}
                </td>
                <td className="p-1.5 text-center border-r border-slate-400 whitespace-nowrap">
                  {formatDateDisplay(row.date)}
                </td>
                <td className="p-1.5 text-center font-bold text-slate-900 border-r border-slate-400">
                  {row.pieceNo || '-'}
                </td>
                <td className="p-1.5 text-right font-medium border-r border-slate-400 pr-3">
                  {row.doffLength != null && String(row.doffLength).trim() !== '' ? row.doffLength : '-'}
                </td>
                <td className="p-1.5 text-center font-mono text-slate-700 border-r border-slate-400">
                  {rollNoDisplay}
                </td>
                <td className={`p-1.5 text-right font-bold ${isFactory ? 'border-r border-slate-400' : 'border-r-2 border-slate-900'} pr-3`}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>
                      {typeof displayRollLength === 'number' ? displayRollLength.toFixed(2) : (displayRollLength || '-')}
                    </span>
                    {row.isInspected && (
                      <span className="text-3xs bg-emerald-100 text-emerald-800 px-1 border border-emerald-400 rounded-2xs font-sans" title="Inspected Length">
                        ✓
                      </span>
                    )}
                  </div>
                </td>

                {/* Conditional Factory Columns: Roll Weight and Roll GLM */}
                {isFactory && (
                  <>
                    <td className="p-1.5 text-right font-medium border-r border-slate-400 pr-3">
                      {row.rollWeight != null && String(row.rollWeight).trim() !== ''
                        ? (typeof row.rollWeight === 'number' ? row.rollWeight.toFixed(2) : row.rollWeight)
                        : '-'}
                    </td>
                    <td className="p-1.5 text-right font-medium border-r-2 border-slate-900 pr-3">
                      {row.rollGlm != null && String(row.rollGlm).trim() !== ''
                        ? (typeof row.rollGlm === 'number' ? row.rollGlm.toFixed(2) : row.rollGlm)
                        : '-'}
                    </td>
                  </>
                )}
                
                {/* Weft Details Columns */}
                <td className="p-1.5 text-center border-r border-slate-400 text-xs">
                  {weftItems.map((w, wIdx) => (
                    <div key={wIdx}>{formatDateDisplay(w.date)}</div>
                  ))}
                </td>
                <td className="p-1.5 border-r border-slate-400 text-xs font-semibold">
                  {weftItems.map((w, wIdx) => (
                    <div key={wIdx}>{w.millName || '-'}</div>
                  ))}
                </td>
                <td className="p-1.5 text-center font-bold text-xs">
                  {weftItems.map((w, wIdx) => (
                    <div key={wIdx}>{w.lotNo || '-'}</div>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* Table Footer Summary Row */}
        {productionDetails.length > 0 && (
          <tfoot>
            <tr className="bg-slate-200/90 font-bold border-t-2 border-slate-900">
              <td colSpan={5} className="p-2 text-right border-r border-slate-800 uppercase font-black">
                {isFactory ? 'TOTALS :' : 'TOTAL ROLL MTRS :'}
              </td>
              <td className={`p-2 text-right font-black text-sm text-blue-900 underline decoration-double ${isFactory ? 'border-r border-slate-800' : 'border-r-2 border-slate-900'} pr-3`}>
                {totalRollLength.toFixed(2)}
              </td>
              {isFactory && (
                <>
                  <td className="p-2 text-right font-black text-sm text-indigo-900 underline decoration-double border-r border-slate-800 pr-3" title="Total Roll Weight">
                    {totalRollWeight > 0 ? totalRollWeight.toFixed(2) : '-'}
                  </td>
                  <td className="p-2 text-right font-black text-sm text-indigo-900 underline decoration-double border-r-2 border-slate-900 pr-3" title="Average Roll GLM">
                    {avgRollGlm > 0 ? avgRollGlm.toFixed(2) : '-'}
                  </td>
                </>
              )}
              <td colSpan={3} className="p-2 text-center text-slate-600 text-2xs italic">
                ({productionDetails.length} Rolls / Pieces Doffed)
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};
