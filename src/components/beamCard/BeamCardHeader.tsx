import React from 'react';
import { BeamDetails } from '@/types/beamCard';
import { formatDateDisplay } from '@/services/beamCardService';

interface Props {
  companyName: string;
  beamDetails: BeamDetails;
}

const cleanLoomDisplay = (val: string) => {
  if (!val) return '-';
  let str = String(val).trim();
  if (str.toLowerCase().startsWith('loom no -')) {
    str = str.substring(9).trim();
  } else if (str.toLowerCase().startsWith('loom no')) {
    str = str.substring(7).trim();
  } else if (str.toLowerCase().startsWith('loom')) {
    str = str.substring(4).trim();
  }
  str = str.replace(/^[:-]/, '').trim();
  return str || val;
};

export const BeamCardHeader: React.FC<Props> = ({ companyName, beamDetails }) => {
  const activeProcess = (beamDetails.process || 'GAITING').toUpperCase();

  return (
    <div className="border-2 border-slate-900 bg-amber-50/20 text-slate-900 p-2.5 text-xs font-mono uppercase rounded-t shadow-xs">
      {/* Top Banner Row */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2 gap-2">
        <div className="font-bold text-xs tracking-wide">
          <span className="text-slate-500 font-normal">SORT CODE : </span>
          <span className="underline decoration-slate-400 font-semibold">{beamDetails.sortCode || '-'}</span>
        </div>
        <div className="text-center font-bold">
          {beamDetails.circleNo && (
            <span className="inline-block border border-slate-900 rounded-full px-2 py-0.5 text-xs mr-2 bg-yellow-100/80">
              {beamDetails.circleNo}
            </span>
          )}
          <span className="text-base tracking-wider font-extrabold uppercase text-slate-900">
            BEAM CARD
          </span>
        </div>
        <div className="font-semibold text-slate-700 text-right text-xs">
          {beamDetails.materialDescription || '100% EGYPTIAN COTTON'}
        </div>
      </div>

      {/* Company Name Banner */}
      <div className="text-center font-black text-sm tracking-wider border-b border-slate-900 pb-2 mb-2 uppercase text-slate-900">
        {companyName || 'HAYAGREEVAS FABRICS PRIVATE LIMITED'}
      </div>

      {/* Loom / Process / Date / Shift Row */}
      <div className="grid grid-cols-4 gap-2 items-center text-xs font-semibold bg-slate-100/50 p-2 border border-slate-800 rounded-xs">
        <div>
          <span className="text-slate-600">LOOM NO : </span>
          <span className="text-xs font-bold text-slate-900 bg-amber-100 px-2 py-0.5 border border-slate-700 rounded-xs">
            {cleanLoomDisplay(beamDetails.loomNo)}
          </span>
        </div>

        {/* Process checklist */}
        <div className="col-span-2 flex items-center justify-center space-x-3 text-xs">
          {['KNOTTING', 'GAITING', 'SORT CHANGE'].map((p) => {
            const isSelected = activeProcess.includes(p);
            return (
              <label key={p} className="flex items-center space-x-1 cursor-default">
                <span className={`w-3.5 h-3.5 border border-slate-900 flex items-center justify-center font-bold ${isSelected ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                  {isSelected ? '✓' : ''}
                </span>
                <span className={isSelected ? 'font-bold underline text-slate-900' : 'text-slate-600'}>
                  {p}
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end space-x-3">
          <div>
            <span className="text-slate-600">DATE : </span>
            <span className="font-bold underline">{formatDateDisplay(beamDetails.date)}</span>
          </div>
          <div>
            <span className="text-slate-600">SHIFT : </span>
            <span className="font-bold bg-white px-1.5 py-0.5 border border-slate-700">{beamDetails.shift || 'A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
