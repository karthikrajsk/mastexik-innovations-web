import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getAllLooms } from '@/state/loomMasterSlice';
import { getAllFactoryPieceEntries, getFactoryPieceEntriesByCompany, updateFactoryPieceEntry } from '@/state/factoryPieceEntrySlice';
import { getSubCategoryByCategory } from '@/state/subCategorySlice';
import { getAllBaleRollPackings, getAllBaleRollPackingsByCompanyId } from '@/state/baleRollPackingSlice';
import { RootState, AppDispatch } from '@/state/store';
import { BeamCardData, BeamSummary, NewProductionPayload, UpdateWastePayload } from '@/types/beamCard';
import { fetchBeamsList, fetchBeamCardData, saveBeamCardData, addProductionRecord, updateWarpWaste, formatDateDisplay } from '@/services/beamCardService';
import apiService from '@/services/ApiService';
import { toast } from 'react-toastify';
import { BeamCardPrintLayout } from '@/components/beamCard/BeamCardPrintLayout';
import { ProductionEntryModal } from '@/components/beamCard/ProductionEntryModal';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Printer,
  RotateCw,
  Search,
  Plus,
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
  Layers,
  CheckCircle2,
  Save,
  Receipt,
  Eye
} from 'lucide-react';

export const BeamCardPage: React.FC = () => {
  const params = useParams<{ beamNo?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { loomList } = useSelector((state: RootState) => (state as any).loomMaster || { loomList: [] });
  const { list: pieceEntryList } = useSelector((state: RootState) => (state as any).factoryPieceEntry || { list: [] });
  const { subCategoryByCategoryList } = useSelector((state: RootState) => (state as any).subCategory || {});
  const { list: baleRollPackingList } = useSelector((state: RootState) => (state as any).baleRollPacking || { list: [] });

  useEffect(() => {
    if (!loomList || loomList.length === 0) {
      dispatch(getAllLooms({ fetchAll: true }));
    }
  }, [dispatch, loomList.length]);

  useEffect(() => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    if (cid) {
      dispatch(getFactoryPieceEntriesByCompany({ companyId: cid, isFactoryFabric: 1 }) as any);
      dispatch(getAllBaleRollPackingsByCompanyId(cid));
    } else {
      dispatch(getAllFactoryPieceEntries({}) as any);
      dispatch(getAllBaleRollPackings({}));
    }
  }, [dispatch]);

  // Fetch BeamCardType subcategory options (e.g. Egypt, Factory)
  useEffect(() => {
    dispatch(getSubCategoryByCategory({ categoryName: "BeamCardType", fetchAll: true }));
  }, [dispatch]);

  const getLoomNoDisplay = useCallback((loomVal: any) => {
    if (!loomVal) return '-';
    const strVal = String(loomVal);
    if (loomList && Array.isArray(loomList) && loomList.length > 0) {
      const found = loomList.find((l: any) => String(l.id) === strVal || String(l.loomId) === strVal);
      if (found && (found.loomNo || found.loom_no)) {
        return String(found.loomNo || found.loom_no);
      }
    }
    return strVal;
  }, [loomList]);

  const formatLoomLabel = useCallback((loomVal: any) => {
    const display = getLoomNoDisplay(loomVal);
    if (!display || display === '-') return '';
    let str = display.trim();
    if (str.toLowerCase().startsWith('loom no -')) {
      str = str.substring(9).trim();
    } else if (str.toLowerCase().startsWith('loom no')) {
      str = str.substring(7).trim();
    } else if (str.toLowerCase().startsWith('loom')) {
      str = str.substring(4).trim();
    }
    str = str.replace(/^[:-]/, '').trim() || str;
    return `Loom ${str}`;
  }, [getLoomNoDisplay]);

  const [beamsList, setBeamsList] = useState<BeamSummary[]>([]);
  const [selectedBeamNo, setSelectedBeamNo] = useState<string>(params.beamNo || "37180/158");
  const [cardData, setCardData] = useState<BeamCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingProduction, setIsAddingProduction] = useState<boolean>(false);
  const [isClosingBeamCard, setIsClosingBeamCard] = useState<boolean>(false);
  const [isSavingBeamCard, setIsSavingBeamCard] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');

  // SubCategory Type options mapping
  const subCategoryOptions = useMemo(() => {
    const rawList: any[] = Array.isArray(subCategoryByCategoryList)
      ? subCategoryByCategoryList
      : Array.isArray((subCategoryByCategoryList as any)?.data)
      ? (subCategoryByCategoryList as any).data
      : [];

    if (rawList.length > 0) {
      return rawList.map((item: any) => ({
        id: item.id ?? item.subCategoryId,
        name: String(item.subCategoryName ?? item.subcategoryName ?? item.name ?? '').trim()
      })).filter(item => item.name);
    }

    return [
      { id: 1, name: "Egypt" },
      { id: 2, name: "Factory" }
    ];
  }, [subCategoryByCategoryList]);

  const typeDropdownOptions = useMemo(() => {
    return subCategoryOptions.map(opt => ({
      value: String(opt.id),
      label: opt.name
    }));
  }, [subCategoryOptions]);

  // Selected Type State (Egypt vs Factory)
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedTypeName, setSelectedTypeName] = useState<string>("Egypt");

  // Helper to extract items array from various BaleRollPacking shapes
  const extractPackingItems = useCallback((packing: any) => {
    const candidates = [
      packing?.items,
      packing?.items?.data,
      packing?.items?.rows,
      packing?.packingItems,
      packing?.packingItems?.data,
      packing?.packingItems?.rows,
      packing?.baleRollPackingItems,
      packing?.baleRollPackingItems?.data,
      packing?.pieceDetails,
      packing?.piece_details,
      packing?.selectedPieces,
      packing?.selectedBales
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
    return [];
  }, []);

  // Map piece identifiers to BaleRollPacking fields: rollNo, rollLength, netWeight (rollWeight), grossWeight (rollGlm)
  const balePackingPieceMap = useMemo(() => {
    const map = new Map<string, { rollNo?: string; rollLength?: number; netWeight?: number; grossWeight?: number }>();
    const rawList: any[] = Array.isArray(baleRollPackingList)
      ? baleRollPackingList
      : Array.isArray((baleRollPackingList as any)?.data)
      ? (baleRollPackingList as any).data
      : [];

    rawList.forEach((packing: any) => {
      const pRollNo = packing.rollOrBaleNo || packing.rollNo || packing.baleNo || packing.packingNo || '';
      const items = extractPackingItems(packing);
      items.forEach((item: any) => {
        const pNoStr = String(item.pieceNo || item.piece_no || item.pieceNumber || item.piece_number || '').trim().toLowerCase();
        const pIdStr = String(item.pieceId || item.pieceEntryId || item.id || '').trim();

        const netWt = Number(item.netWeight ?? item.net_weight ?? item.pounds ?? 0) || 0;
        const grossWt = Number(item.grossWeight ?? item.gross_weight ?? 0) || 0;
        const meters = Number(item.meters ?? item.length ?? 0) || 0;
        const rNo = item.rollNo || item.roll_no || pRollNo;

        const data = {
          rollNo: rNo,
          rollLength: meters,
          netWeight: netWt,
          grossWeight: grossWt
        };

        if (pNoStr) {
          map.set(pNoStr, data);
          if (pNoStr.includes('/')) {
            const parts = pNoStr.split('/');
            const lastPart = parts[parts.length - 1].trim();
            if (lastPart) map.set(lastPart, data);
          }
        }
        if (pIdStr) map.set(`id_${pIdStr}`, data);
      });
    });

    return map;
  }, [baleRollPackingList, extractPackingItems]);

  // Synchronize Type when cardData loads or subCategoryOptions become available
  useEffect(() => {
    if (cardData) {
      const typeId = cardData.beamCardTypeId ?? (cardData as any).data?.beamCardTypeId;
      const typeName = cardData.beamCardTypeName ?? (cardData as any).data?.beamCardTypeName;
      if (typeId != null) {
        setSelectedTypeId(Number(typeId));
        const found = subCategoryOptions.find(o => String(o.id) === String(typeId));
        if (found) {
          setSelectedTypeName(found.name);
        }
      } else if (typeName) {
        setSelectedTypeName(typeName);
        const found = subCategoryOptions.find(o => o.name.toLowerCase() === typeName.toLowerCase());
        if (found) {
          setSelectedTypeId(Number(found.id));
        }
      } else if (!selectedTypeId && subCategoryOptions.length > 0) {
        const egyptOpt = subCategoryOptions.find(o => o.name.toLowerCase().includes("egypt")) || subCategoryOptions[0];
        setSelectedTypeId(Number(egyptOpt.id));
        setSelectedTypeName(egyptOpt.name);
      }
    } else if (!selectedTypeId && subCategoryOptions.length > 0) {
      const egyptOpt = subCategoryOptions.find(o => o.name.toLowerCase().includes("egypt")) || subCategoryOptions[0];
      setSelectedTypeId(Number(egyptOpt.id));
      setSelectedTypeName(egyptOpt.name);
    }
  }, [cardData, subCategoryOptions, selectedTypeId]);

  const handleTypeChange = (val: string) => {
    const found = subCategoryOptions.find(o => String(o.id) === String(val));
    if (found) {
      setSelectedTypeId(Number(found.id));
      setSelectedTypeName(found.name);
    }
  };

  const isFactory = useMemo(() => {
    return selectedTypeName.toLowerCase().includes("factory");
  }, [selectedTypeName]);

  // Load available active beams list from Beam Gaiting API
  const loadBeams = useCallback(async () => {
    try {
      const beams = await fetchBeamsList();
      setBeamsList(beams);
      
      // If current selection is not valid or fallback default, select first active beam from Gaiting
      if (beams.length > 0 && (!selectedBeamNo || selectedBeamNo === "Unknown" || selectedBeamNo.includes("Unknown"))) {
        setSelectedBeamNo(beams[0].beamNo);
      }
    } catch (err) {
      console.error("Failed to load active gaited beams list:", err);
    }
  }, [selectedBeamNo]);

  // Fetch target Beam Card data
  const loadBeamCard = useCallback(async (beamNo: string) => {
    if (!beamNo) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBeamCardData(beamNo);
      setCardData(data);
    } catch (err: any) {
      console.error("Error loading beam card:", err);
      setError(err.message || "Failed to load Beam Card details.");
      setCardData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBeams();
  }, [loadBeams]);

  useEffect(() => {
    if (params.beamNo && params.beamNo !== selectedBeamNo) {
      setSelectedBeamNo(params.beamNo);
    }
  }, [params.beamNo]);

  useEffect(() => {
    if (selectedBeamNo) {
      loadBeamCard(selectedBeamNo);
    }
  }, [selectedBeamNo, loadBeamCard]);

  const handleSelectBeam = (beamNo: string) => {
    setSelectedBeamNo(beamNo);
    navigate(`/transaction/beam-card/${encodeURIComponent(beamNo)}`, { replace: true });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      handleSelectBeam(searchInput.trim());
    }
  };

  const handleRefresh = () => {
    loadBeams();
    if (selectedBeamNo) {
      loadBeamCard(selectedBeamNo);
    }
    dispatch(getSubCategoryByCategory({ categoryName: "BeamCardType", fetchAll: true }));
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    if (cid) {
      dispatch(getFactoryPieceEntriesByCompany({ companyId: cid, isFactoryFabric: 1 }) as any);
      dispatch(getAllBaleRollPackingsByCompanyId(cid));
    } else {
      dispatch(getAllFactoryPieceEntries({}) as any);
      dispatch(getAllBaleRollPackings({}));
    }
  };

  const handleAddProduction = async (payload: NewProductionPayload) => {
    if (!selectedBeamNo) return;
    try {
      const updated = await addProductionRecord(selectedBeamNo, payload);
      setCardData(updated);
      setIsAddingProduction(false);
    } catch (err: any) {
      alert(`Error adding production record: ${err.message}`);
    }
  };

  const handleUpdateWaste = async (payload: UpdateWastePayload) => {
    if (!selectedBeamNo) return;
    try {
      const updated = await updateWarpWaste(selectedBeamNo, payload);
      setCardData(updated);
    } catch (err: any) {
      alert(`Error updating waste: ${err.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveBeamCard = async () => {
    if (!displayCardData) return;
    setIsSavingBeamCard(true);
    try {
      const payload: BeamCardData = {
        ...displayCardData,
        beamCardTypeId: selectedTypeId,
        beamCardTypeName: selectedTypeName,
        rollWeight: displayCardData.rollWeight,
        rollGlm: displayCardData.rollGlm
      };
      const saved = await saveBeamCardData(payload);
      setCardData(saved);
      toast.success(`Beam Card #${saved.beamDetails.beamNo} saved successfully!`);
    } catch (err: any) {
      console.error("Error saving Beam Card:", err);
      toast.error(`Failed to save Beam Card: ${err.message || err}`);
    } finally {
      setIsSavingBeamCard(false);
    }
  };

  // Filter piece entries from doffing-entry / factoryPieceEntrySlice matching selected beam & loom up to isLastPiece === 1
  const activePieceEntries = useMemo(() => {
    if (!selectedBeamNo) return [];
    const rawList: any[] = Array.isArray(pieceEntryList)
      ? pieceEntryList
      : Array.isArray((pieceEntryList as any)?.data)
      ? (pieceEntryList as any).data
      : [];

    const cleanSelBeam = selectedBeamNo.toLowerCase().trim();

    const matchingPieces = rawList.filter((p: any) => {
      const pBeam = String(
        p.beamNoFlange ||
        p.beamNo ||
        p.beam_no ||
        p.sizedBeamNo ||
        p.sized_beam_no ||
        p.beamNumber ||
        ''
      ).toLowerCase().trim();
      if (!pBeam) return false;
      const cleanBeamCode = cleanSelBeam.split('/')[0].split(' ')[0].trim();
      return pBeam.includes(cleanSelBeam) || cleanSelBeam.includes(pBeam.split('/')[0].split(' ')[0]) || pBeam.includes(cleanBeamCode);
    });

    if (matchingPieces.length === 0) return [];

    matchingPieces.sort((a: any, b: any) => {
      const idA = Number(a.id || 0);
      const idB = Number(b.id || 0);
      if (idA && idB) return idA - idB;
      return new Date(a.doffingDate || a.date || a.createdAt || 0).getTime() - new Date(b.doffingDate || b.date || b.createdAt || 0).getTime();
    });

    const truncatedPieces: any[] = [];
    for (const piece of matchingPieces) {
      truncatedPieces.push(piece);
      const isLast = piece.isLastPiece === 1 || piece.isLastPiece === '1' || piece.isLastPiece === true || piece.is_last_piece === 1;
      if (isLast) {
        break;
      }
    }

    return truncatedPieces;
  }, [pieceEntryList, selectedBeamNo]);

  const mappedProductionDetails = useMemo(() => {
    const listToMap = activePieceEntries.length > 0 ? activePieceEntries : (cardData?.productionDetails || []);

    return listToMap.map((p: any, idx: number) => {
      const pieceNoStr = String(p.pieceNumber || p.pieceNo || p.piece_no || `-`);
      const cleanPieceNo = pieceNoStr.toLowerCase().trim();
      const pieceCodeSuffix = cleanPieceNo.includes('/') ? cleanPieceNo.split('/').pop()?.trim() || '' : '';

      // Match against BaleRollPacking list by full piece number, suffix, or ID
      const matchedBale = balePackingPieceMap.get(cleanPieceNo) ||
        (pieceCodeSuffix ? balePackingPieceMap.get(pieceCodeSuffix) : undefined) ||
        (p.id ? balePackingPieceMap.get(`id_${p.id}`) : undefined) ||
        (p.pieceEntryId ? balePackingPieceMap.get(`id_${p.pieceEntryId}`) : undefined);

      const doffMtr = Number(p.pieceMeter || p.piece_meter || p.doffLength || p.length || 0);
      
      // Roll length: from BaleRollPacking or passMtr/inspectedMtr
      const passMtrVal = (matchedBale?.rollLength && matchedBale.rollLength > 0)
        ? matchedBale.rollLength
        : (p.passMtr ?? p.pass_mtr ?? p.passMtrs ?? p.pass_mtrs ?? p.inspectedMtr);
      const rollMtr = Number(passMtrVal) || (matchedBale?.rollLength ? Number(matchedBale.rollLength) : 0);

      // Roll No: from BaleRollPacking or hfplRollNo / rollNo
      const rollNo = matchedBale?.rollNo || p.hfplRollNo || p.hfpl_roll_no || p.hfplRollNoStr || p.rollNo || p.roll_no;
      const rollNoVal = rollNo || "--";

      // ROLL WEIGHT: netWeight from BaleRollPacking (grossWeight = rollGlm, netWeight = rollWeight)
      const rWeight = (matchedBale?.netWeight != null && matchedBale.netWeight > 0)
        ? matchedBale.netWeight
        : (p.rollWeight ?? p.roll_weight ?? p.actualNetWeight ?? p.actual_net_weight ?? p.inspectedNtWt ?? p.inspected_nt_wt ?? p.netWeight ?? p.net_weight ?? p.weight);
      const numWeight = rWeight != null && rWeight !== '' && !isNaN(Number(rWeight)) ? Number(rWeight) : undefined;

      // ROLL GLM: grossWeight from BaleRollPacking (grossWeight = rollGlm, netWeight = rollWeight)
      let numGlm: number | undefined = (matchedBale?.grossWeight != null && matchedBale.grossWeight > 0)
        ? matchedBale.grossWeight
        : undefined;

      if (numGlm === undefined) {
        let rGlm = p.rollGlm ?? p.roll_glm ?? p.glm ?? p.avgWeight ?? p.avg_weight ?? p.inspectedAvgWt ?? p.inspected_avg_wt;
        numGlm = rGlm != null && rGlm !== '' && !isNaN(Number(rGlm)) ? Number(rGlm) : undefined;
      }

      if (numGlm === undefined && numWeight !== undefined && numWeight > 0) {
        const effectiveLength = rollMtr > 0 ? rollMtr : doffMtr;
        if (effectiveLength > 0) {
          numGlm = Number(((numWeight * 1000) / effectiveLength).toFixed(2));
        }
      }

      let weftDetails: any[] = [];
      if (Array.isArray(p.weftDetails) && p.weftDetails.length > 0) {
        weftDetails = p.weftDetails;
      } else if (p.weftYarnMillName || p.weftYarnLotNo || p.weftMillName || p.weftLotNo) {
        weftDetails.push({
          id: `w-${p.id || idx}`,
          date: formatDateDisplay(p.doffingDate || p.date || p.createdAt),
          millName: String(p.weftYarnMillName || p.weftMillName || '-'),
          lotNo: String(p.weftYarnLotNo || p.weftLotNo || '-')
        });
      }

      return {
        slNo: idx + 1,
        id: String(p.id || `p-${idx}`),
        date: formatDateDisplay(p.doffingDate || p.date || p.createdAt || p.rollingDate),
        pieceNo: pieceNoStr,
        doffLength: doffMtr,
        rollNo: String(rollNoVal),
        rollLength: rollMtr,
        rollWeight: numWeight,
        rollGlm: numGlm,
        inspectedMtr: rollMtr,
        isInspected: Boolean(p.isInspected || p.is_inspected || p.passMtr || p.pass_mtr || rollMtr > 0),
        weftDetails
      };
    });
  }, [activePieceEntries, cardData?.productionDetails, balePackingPieceMap]);

  // Overall aggregate Roll Weight and Roll GLM for Factory Type
  const totalRollWeight = useMemo(() => {
    return Number(mappedProductionDetails.reduce((sum, p) => sum + (Number(p.rollWeight) || 0), 0).toFixed(2));
  }, [mappedProductionDetails]);

  const avgRollGlm = useMemo(() => {
    const totalRollMtrs = Number(mappedProductionDetails.reduce((sum, p) => sum + (Number(p.rollLength) || 0), 0).toFixed(2));
    if (totalRollMtrs > 0 && totalRollWeight > 0) {
      return Number(((totalRollWeight * 1000) / totalRollMtrs).toFixed(2));
    }
    const withGlm = mappedProductionDetails.filter(p => Number(p.rollGlm) > 0);
    if (withGlm.length > 0) {
      return Number((withGlm.reduce((sum, p) => sum + (Number(p.rollGlm) || 0), 0) / withGlm.length).toFixed(2));
    }
    return 0;
  }, [mappedProductionDetails, totalRollWeight]);

  const isBeamClosed = useMemo(() => {
    if (!cardData) return false;
    if (cardData.beamDetails.status === 'CLOSED' || cardData.beamDetails.status === 'COMPLETED') return true;
    const hasLastPiece = activePieceEntries.some((p: any) =>
      p.isLastPiece === 1 || p.isLastPiece === '1' || p.isLastPiece === true || p.is_last_piece === 1
    );
    return hasLastPiece;
  }, [cardData, activePieceEntries]);

  const dynamicFabricSummary = useMemo(() => {
    if (!cardData) return null;
    const warpLen = Number(cardData.beamDetails.warpLength) || 3250;
    const totalPieces = mappedProductionDetails.length;
    const totalDoffMtrs = mappedProductionDetails.reduce((sum, p) => sum + (Number(p.doffLength) || 0), 0);
    const totalRollMtrs = Number(mappedProductionDetails.reduce((sum, p) => sum + (Number(p.rollLength) || 0), 0).toFixed(2));
    
    let crimpPercentage = cardData.fabricSummary?.crimpPercentage || "0.00%";
    if (warpLen > 0 && totalDoffMtrs > 0) {
      const val = ((warpLen - totalDoffMtrs) / totalDoffMtrs) * 100;
      crimpPercentage = `${val.toFixed(2)}%`;
    }

    return {
      totalPieces,
      totalDoffMtrs,
      totalRollMtrs,
      crimpPercentage
    };
  }, [cardData, mappedProductionDetails]);

  const handleCloseBeamCard = async () => {
    if (!selectedBeamNo || !cardData) return;

    const confirmClose = window.confirm(`Are you sure you want to close Beam Card #${selectedBeamNo}?`);
    if (!confirmClose) return;

    setIsClosingBeamCard(true);
    try {
      const encodedBeamNo = encodeURIComponent(selectedBeamNo);

      try {
        await apiService.post(`/beam-card/${encodedBeamNo}/close`, { status: "CLOSED" });
      } catch (e) {
        console.warn("API /beam-card/close call fallback:", e);
      }

      if (activePieceEntries.length > 0) {
        const lastPiece = activePieceEntries[activePieceEntries.length - 1];
        if (lastPiece && lastPiece.id && !(lastPiece.isLastPiece === 1 || lastPiece.isLastPiece === '1' || lastPiece.isLastPiece === true)) {
          try {
            await dispatch(updateFactoryPieceEntry({
              id: lastPiece.id,
              data: { ...lastPiece, isLastPiece: 1 }
            }) as any);
          } catch (e) {
            console.warn("Could not update last piece isLastPiece flag:", e);
          }
        }
      }

      setCardData(prev => prev ? {
        ...prev,
        beamDetails: {
          ...prev.beamDetails,
          status: "CLOSED"
        }
      } : prev);

      toast.success(`Beam Card #${selectedBeamNo} closed successfully!`);
    } catch (err: any) {
      console.error("Error closing Beam Card:", err);
      alert(`Failed to close Beam Card: ${err.message || err}`);
    } finally {
      setIsClosingBeamCard(false);
    }
  };

  // Build searchable dropdown options dynamically from active Beam Gaiting entries
  const beamOptions = useMemo(() => {
    return beamsList.map(b => {
      const loomLbl = formatLoomLabel(b.loomNo);
      const loomPart = loomLbl ? ` (${loomLbl} - Sort ${b.sortCode})` : ` (Sort ${b.sortCode})`;
      return {
        value: b.beamNo,
        label: `Beam ${b.beamNo}${loomPart}`
      };
    });
  }, [beamsList, formatLoomLabel]);

  const displayCardData = useMemo(() => {
    if (!cardData) return null;
    const rawLoom = cardData.beamDetails.loomNo;
    const resolvedLoomNo = getLoomNoDisplay(rawLoom);
    const statusStr = isBeamClosed ? 'CLOSED' : (cardData.beamDetails.status || 'RUNNING');

    return {
      ...cardData,
      beamCardTypeId: selectedTypeId,
      beamCardTypeName: selectedTypeName,
      rollWeight: totalRollWeight > 0 ? totalRollWeight : (cardData.rollWeight || null),
      rollGlm: avgRollGlm > 0 ? avgRollGlm : (cardData.rollGlm || null),
      beamDetails: {
        ...cardData.beamDetails,
        loomNo: resolvedLoomNo,
        status: statusStr
      },
      productionDetails: mappedProductionDetails,
      fabricSummary: dynamicFabricSummary || cardData.fabricSummary
    };
  }, [cardData, getLoomNoDisplay, isBeamClosed, mappedProductionDetails, dynamicFabricSummary, selectedTypeId, selectedTypeName, totalRollWeight, avgRollGlm]);

  return (
    <div className="space-y-4 p-2 sm:p-4 font-sans">
      {/* Top Header & Toolbar (Hidden in Print) */}
      <Card className="print:hidden border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-3">
            {/* Filter Dropdowns: Beam No & Type */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="min-w-[260px] md:min-w-[300px]">
                <label className="block text-2xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                  SELECT ACTIVE BEAM NUMBER (From Beam Gaiting)
                </label>
                <CommonSearchableSelect
                  options={beamOptions}
                  value={selectedBeamNo}
                  onChange={(val) => handleSelectBeam(val)}
                  placeholder="Search or Select Beam No..."
                />
              </div>

              {/* Type Filter Dropdown: Egypt / Factory from subCategorySlice */}
              <div className="min-w-[160px] md:min-w-[200px]">
                <label className="block text-2xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                  TYPE (Egypt / Factory)
                </label>
                <CommonSearchableSelect
                  options={typeDropdownOptions}
                  value={String(selectedTypeId || '')}
                  onChange={(val) => handleTypeChange(val)}
                  placeholder="Select Type..."
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setIsAddingProduction(true)}
                disabled={!cardData || isBeamClosed}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 font-medium disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Production Record</span>
              </Button>

              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                title="Refresh Beam Gaiting & Production Data"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </Button>

              {isBeamClosed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>BEAM CARD CLOSED</span>
                </span>
              ) : (
                <Button
                  onClick={handleCloseBeamCard}
                  disabled={!cardData || isClosingBeamCard}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 h-8 font-semibold disabled:opacity-50"
                  title="Close Beam Card and save entry"
                >
                  {isClosingBeamCard ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>Close Beam Card</span>
                </Button>
              )}

              <Button
                onClick={handleSaveBeamCard}
                disabled={!displayCardData || isSavingBeamCard}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-8 font-semibold disabled:opacity-50"
                title="Save Beam Card data to backend"
              >
                {isSavingBeamCard ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Beam Card</span>
              </Button>

              <Button
                onClick={() => {
                  if (selectedBeamNo) {
                    navigate(`/transaction/beam-card-report/${encodeURIComponent(selectedBeamNo)}`);
                  } else {
                    navigate('/transaction/beam-card-report');
                  }
                }}
                disabled={!selectedBeamNo}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 h-8 font-semibold disabled:opacity-50"
                title="View Inward & Sizing Invoice Report for this Beam"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>View Report</span>
              </Button>

              <Button
                onClick={handlePrint}
                disabled={!cardData}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span>Print Beam Card</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Beam Card Display Area */}
      <div className="w-full">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-background rounded-lg border border-border shadow-2xs">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="font-mono text-sm text-foreground font-semibold">Loading Beam Card...</p>
            <p className="text-xs text-muted-foreground mt-1">Fetching active beam gaiting, piece roll details & weft lot history</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="max-w-2xl mx-auto my-10 bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-md shadow-2xs flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Unable to load Beam Card details</h3>
              <p className="text-xs mt-1">{error}</p>
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="destructive"
                className="mt-3 text-xs h-7"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !cardData && (
          <div className="flex flex-col items-center justify-center py-20 bg-background rounded-lg border border-border shadow-2xs">
            <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-bold text-foreground text-sm">No Beam Card data available</h3>
            <p className="text-xs text-muted-foreground mt-1">Select a valid Beam Number from the dropdown above.</p>
          </div>
        )}

        {/* Dynamic Printable Beam Card Layout */}
        {!loading && !error && displayCardData && (
          <BeamCardPrintLayout
            cardData={displayCardData}
            onUpdateWaste={handleUpdateWaste}
            isFactory={isFactory}
          />
        )}
      </div>

      {/* Production & Inspection Entry Modal */}
      {isAddingProduction && (
        <ProductionEntryModal
          isOpen={isAddingProduction}
          onClose={() => setIsAddingProduction(false)}
          onSubmit={handleAddProduction}
          beamNo={selectedBeamNo}
          isFactory={isFactory}
        />
      )}
    </div>
  );
};

export default BeamCardPage;
