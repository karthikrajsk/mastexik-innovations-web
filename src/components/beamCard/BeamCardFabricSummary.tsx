import React from 'react';
import { FabricSummary } from '@/types/beamCard';

interface Props {
  fabricSummary: FabricSummary;
}

export const BeamCardFabricSummary: React.FC<Props> = ({ fabricSummary }) => {
  return (
    <div className="bg-white font-mono text-xs text-slate-900 h-full">
      <div className="bg-slate-200/90 p-1.5 text-center font-extrabold tracking-wider border-b border-slate-800 uppercase">
        FABRIC SUMMARY
      </div>
      <div className="p-3 space-y-2">
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1.5">
          <span className="font-semibold text-slate-700">TOTAL NO. OF PIECES :</span>
          <span className="font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-300">
            {fabricSummary.totalPieces !== undefined ? fabricSummary.totalPieces : 0}
          </span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1.5">
          <span className="font-semibold text-slate-700">TOTAL ROLL MTRS :</span>
          <span className="font-extrabold text-sm text-blue-900 bg-blue-50 px-2 py-0.5 border border-blue-200">
            {fabricSummary.totalRollMtrs !== undefined ? fabricSummary.totalRollMtrs.toFixed(2) : '0.00'} M
          </span>
        </div>
        <div className="flex justify-between items-center pb-1">
          <div>
            <span className="font-semibold text-slate-700 block">CRIMP % :</span>
            <span className="text-3xs text-slate-400 font-sans block print:hidden">
              ((Warp Mtrs - Doff Mtrs) / Doff Mtrs) * 100
            </span>
          </div>
          <span className="font-bold text-sm bg-amber-100 text-amber-950 px-2.5 py-1 border border-amber-400 rounded-xs shadow-2xs font-mono">
            {fabricSummary.crimpPercentage || '0.00%'}
          </span>
        </div>
      </div>
    </div>
  );
};
