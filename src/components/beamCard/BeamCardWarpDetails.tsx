import React from 'react';
import { BeamDetails } from '@/types/beamCard';

interface Props {
  beamDetails: BeamDetails;
}

export const BeamCardWarpDetails: React.FC<Props> = ({ beamDetails }) => {
  const safeVal = (val?: string | number) => (val !== undefined && val !== null && val !== "" ? val : "-");

  return (
    <div className="border-x-2 border-b-2 border-slate-900 bg-white p-2.5 font-mono text-xs text-slate-900 leading-snug">
      <div className="grid grid-cols-3 gap-y-1.5 gap-x-4 border-b border-slate-800 pb-2">
        {/* Row 1 */}
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">WARP COUNT :</span>
          <span className="font-bold">{safeVal(beamDetails.warpCount)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">WEFT COUNT :</span>
          <span className="font-bold">{safeVal(beamDetails.weftCount)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">EPI / PPI / PLY :</span>
          <span className="font-bold">
            {safeVal(beamDetails.epi)} / {safeVal(beamDetails.ppi)} / {safeVal(beamDetails.ply)}
          </span>
        </div>

        {/* Row 2 */}
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">WIDTH :</span>
          <span className="font-bold">{safeVal(beamDetails.width)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">WEAVE :</span>
          <span className="font-bold">{safeVal(beamDetails.weave)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">DRAWING ORDER :</span>
          <span className="font-bold">{safeVal(beamDetails.drawingOrder)}</span>
        </div>

        {/* Row 3 */}
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">P.O. NO :</span>
          <span className="font-bold">{safeVal(beamDetails.poNo)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">ENDS/DENTS :</span>
          <span className="font-bold">{safeVal(beamDetails.endsDents)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">REED COUNT :</span>
          <span className="font-bold">{safeVal(beamDetails.reedCount)}</span>
        </div>

        {/* Row 4 */}
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">EXP. REED SPACE :</span>
          <span className="font-bold">{safeVal(beamDetails.expReedSpace)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">SET NO :</span>
          <span className="font-bold bg-yellow-50 px-1 border border-slate-300">{safeVal(beamDetails.setNo)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">WARP LENGTH :</span>
          <span className="font-bold">{safeVal(beamDetails.warpLength)} {beamDetails.warpLength ? 'M' : ''}</span>
        </div>

        {/* Row 5 */}
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">PICK UP % :</span>
          <span className="font-bold">{safeVal(beamDetails.pickUp)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">BEAM NO :</span>
          <span className="font-bold text-sm text-blue-900 bg-blue-50 px-1 border border-blue-200">{safeVal(beamDetails.beamNo)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">ENDS/BEAM :</span>
          <span className="font-bold">{safeVal(beamDetails.endsPerBeam)}</span>
        </div>

        {/* Row 6 */}
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">SIZER :</span>
          <span className="font-bold">{safeVal(beamDetails.sizer)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">WARP MILL NAME :</span>
          <span className="font-bold">{safeVal(beamDetails.warpMillName)}</span>
        </div>
        <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
          <span className="font-semibold text-slate-600">WARP LOT NO :</span>
          <span className="font-bold">{safeVal(beamDetails.warpLotNo)}</span>
        </div>
      </div>
    </div>
  );
};
