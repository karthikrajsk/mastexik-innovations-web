// export default BarcodeStickerFabricItemsPage;
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { BarcodeSticker } from '@/components/templates/BarcodeSticker';
import { FabricBarcodePiece } from '@/lib/barcode';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { getAllCompanies } from '@/state/company-master-slice';
import { getAllFabricMastersForDropdown } from '@/state/fabricMasterSlice';
import { AppDispatch, RootState } from '@/state/store';

const BarcodeStickerFabricItemsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { companyName: contextCompanyName } = useCompanyContext();
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster);
  const { fabricMasterFullList } = useSelector((state: RootState) => state.fabricMaster);
  const [searchParams] = useSearchParams();

  const barcode = searchParams.get('barcode') || '';
  const fabricQualityParam = searchParams.get('fabricQuality') || '';
  const fabricQualityId = searchParams.get('fabricQualityId') || '';
  const fabricCodeParam = searchParams.get('fabricCode') || '';
  const fabricCodeId = searchParams.get('fabricCodeId') || '';
  const meters = searchParams.get('meter') || '';
  const yards = searchParams.get('yards') || '';
  const netWeight = searchParams.get('netWeight') || '';
  const avgWeight = searchParams.get('avgWeight') || '';
  const grossWeight = searchParams.get('grossWeight') || '';
  const gradeParam = searchParams.get('grade') || '';
  const companyId = searchParams.get('companyId') || '';
  const pieceEntriesParam = searchParams.get('pieceEntries');

  const showCompany = Boolean(companyId || contextCompanyName);

  const [resolvedFabricCode, setResolvedFabricCode] = useState(fabricCodeParam || '');
  const [resolvedFabricQuality, setResolvedFabricQuality] = useState(fabricQualityParam || '');
  const [resolvedGrade, setResolvedGrade] = useState(gradeParam || '');
  const [displayCompanyName, setDisplayCompanyName] = useState(contextCompanyName || '');

  const parsedPieceEntries = useMemo<FabricBarcodePiece[]>(() => {
    if (!pieceEntriesParam) return [];

    try {
      const parsed = JSON.parse(pieceEntriesParam);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((entry: any) => entry && entry.barcode)
        .map((entry: any) => ({
          barcode: String(entry.barcode || ''),
          fabricCode: entry.fabricCode,
          fabricQuality: entry.fabricQuality,
          grade: entry.grade,
          meter: entry.meter,
          netWeight: entry.netWeight,
          avgWeight: entry.avgWeight,
          yards: entry.yards,
          grossWeight: entry.grossWeight,
        }));
    } catch (error) {
      console.error('Error parsing pieceEntries payload for barcode sticker:', error);
      return [];
    }
  }, [pieceEntriesParam]);

  // ──────────────────────────────────────────────
  //   Your existing useEffect blocks remain unchanged
  // ──────────────────────────────────────────────
  useEffect(() => {
    if ((fabricCodeId || fabricQualityId) && (!fabricMasterFullList || fabricMasterFullList.length === 0)) {
      dispatch(getAllFabricMastersForDropdown());
    }
  }, [fabricCodeId, fabricQualityId, dispatch, fabricMasterFullList]);

  useEffect(() => {
    let newCode = fabricCodeParam;
    let newQuality = fabricQualityParam;

    if (fabricMasterFullList && fabricMasterFullList.length > 0) {
      if (fabricCodeId) {
        const fabric = fabricMasterFullList.find((f: any) => String(f.id) === fabricCodeId);
        if (fabric) {
          newCode = fabric.fabricCode || '';
          if (!fabricQualityParam && !fabricQualityId) {
            newQuality = fabric.fabricQuality || '';
          }
        }
      }

      if (fabricQualityId) {
        const fabric = fabricMasterFullList.find((f: any) => String(f.id) === fabricQualityId);
        if (fabric) {
          newQuality = fabric.fabricQuality || fabric.fabricCode || '';
        }
      }
    }

    setResolvedFabricCode(newCode);
    setResolvedFabricQuality(newQuality);
  }, [fabricMasterFullList, fabricCodeId, fabricQualityId, fabricCodeParam, fabricQualityParam]);

  useEffect(() => {
    if (!showCompany) {
      setDisplayCompanyName('');
      return;
    }
    if (companyId && companyMasterList && companyMasterList.length > 0) {
      const company = companyMasterList.find((c: any) => String(c.id) === companyId);
      setDisplayCompanyName(company?.name || company?.companyName || contextCompanyName || '');
    } else if (contextCompanyName) {
      setDisplayCompanyName(contextCompanyName);
    }
  }, [companyMasterList, companyId, showCompany, contextCompanyName]);

  useEffect(() => {
    if (showCompany && companyId && (!companyMasterList || companyMasterList.length === 0)) {
      dispatch(getAllCompanies({ fetchAll: true }));
    }
  }, [showCompany, companyId, dispatch, companyMasterList]);

  useEffect(() => {
    setResolvedGrade(gradeParam || '');
  }, [gradeParam]);

  const hasBarcodeSource = Boolean(barcode || parsedPieceEntries.length > 0);

  if (!hasBarcodeSource) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">No barcode data provided in the URL parameters.</p>
        </div>
      </div>
    );
  }

  const fallbackSticker: FabricBarcodePiece = {
    barcode,
    fabricCode: resolvedFabricCode || undefined,
    fabricQuality: resolvedFabricQuality || undefined,
    grade: resolvedGrade || undefined,
    meter: meters || undefined,
    yards: yards || undefined,
    netWeight: netWeight || undefined,
    avgWeight: avgWeight || undefined,
    grossWeight: grossWeight || undefined,
  };

  const stickersToRender = parsedPieceEntries.length > 0 ? parsedPieceEntries : [fallbackSticker];

  return (
<div 
    className="
      min-h-screen 
      bg-gray-100 
      print:bg-white 
      flex 
      flex-col 
      justify-center 
      items-center 
      py-6 sm:py-8 lg:py-10
      print:py-4 print:min-h-0
    "
  >    
<div className="
      flex 
      flex-col 
      items-center 
      gap-10 
      sm:gap-12 
      print:gap-14
      w-full 
      max-w-md 
      print:max-w-none 
      print:w-auto
    ">        {stickersToRender.map((sticker, index) => (
      <div 
          key={`${sticker.barcode}-${index}`}
          className="flex justify-center w-full print:w-auto"
        >
          <BarcodeSticker
            key={`${sticker.barcode}-${index}`}
            barcode={sticker.barcode}
            companyName={displayCompanyName}
            fabricQuality={sticker.fabricQuality || resolvedFabricQuality}
            fabricCode={sticker.fabricCode || resolvedFabricCode}
            grade={sticker.grade || resolvedGrade}
            meter={sticker.meter}
            yards={sticker.yards}
            netWeight={sticker.netWeight}
            avgWeight={sticker.avgWeight}
            grossWeight={sticker.grossWeight}
            showMeter={true}
            showGross={Boolean(sticker.grossWeight)}
            showYards={Boolean(sticker.yards)}
            showNet={true}
            showAvg={Boolean(sticker.avgWeight)}
            showCompany={Boolean(displayCompanyName)}
          />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarcodeStickerFabricItemsPage;