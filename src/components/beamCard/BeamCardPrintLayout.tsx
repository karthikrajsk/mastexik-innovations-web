import React from 'react';
import { BeamCardData, UpdateWastePayload } from '@/types/beamCard';
import { BeamCardHeader } from './BeamCardHeader';
import { BeamCardWarpDetails } from './BeamCardWarpDetails';
import { BeamCardProductionTable } from './BeamCardProductionTable';
import { BeamCardWarpWaste } from './BeamCardWarpWaste';
import { BeamCardFabricSummary } from './BeamCardFabricSummary';

interface Props {
  cardData: BeamCardData;
  onUpdateWaste?: (payload: UpdateWastePayload) => void;
  isPrintView?: boolean;
  isFactory?: boolean;
}

export const BeamCardPrintLayout: React.FC<Props> = ({
  cardData,
  onUpdateWaste,
  isPrintView = false,
  isFactory = false
}) => {
  return (
    <div className={`beam-card-container mx-auto font-mono text-slate-900 bg-white ${isPrintView ? 'p-0 w-full' : 'p-4 max-w-5xl shadow-md rounded-md my-4 border border-slate-300'}`}>
      
      {/* 1. HEADER */}
      <BeamCardHeader
        companyName={cardData.companyName}
        beamDetails={cardData.beamDetails}
      />

      {/* 2. WARP & WEAVING DETAILS */}
      <BeamCardWarpDetails
        beamDetails={cardData.beamDetails}
      />

      {/* 3. DYNAMIC DOFF / PIECE / ROLL / WEFT TABLE */}
      <BeamCardProductionTable
        productionDetails={cardData.productionDetails}
        minRows={12}
        isFactory={isFactory}
        rollWeight={cardData.rollWeight}
        rollGlm={cardData.rollGlm}
      />

      {/* 4. WARP WASTE & FABRIC SUMMARY BOTTOM GRID */}
      <div className="grid grid-cols-2 gap-0 border-x-2 border-b-2 border-slate-900 bg-white">
        <div className="border-r-2 border-slate-900">
          <BeamCardWarpWaste
            warpWaste={cardData.warpWaste}
            onUpdateWaste={onUpdateWaste}
          />
        </div>
        <div>
          <BeamCardFabricSummary
            fabricSummary={cardData.fabricSummary}
          />
        </div>
      </div>
    </div>
  );
};
