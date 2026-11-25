import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllBeamGaitings } from "@/state/beamGaitingSlice";
import { getAllFlanges, getFlangeById } from "@/state/flangeSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllFactoryBeamInwards, getFactoryBeamInwardsByFactoryCompanyId } from "@/state/factoryBeamInwardSlice";
import { getAllFactoryPieceEntries, getFactoryPieceEntriesByCompany } from "@/state/factoryPieceEntrySlice";
import { clearBeamCutCurrent, createBeamCut, getBeamCutById, updateBeamCut } from "@/state/beamCutSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { ArrowLeft } from "lucide-react";
import { documentNumberService } from "@/services/DocumentNumberService";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { toast } from "react-toastify";

interface FormData {
  id?: number;
  beamCutNo: string;
  beamCutDate: string;
  loomId: string;
  beamNoFlange: string;
  fabricCodeQuality: string;
  usedMeters: string;
  remainingMeters: string;
  remarks?: string;
}

interface DetailRowData {
  id: string;
  beamDetailId?: number;
  beamId?: number;
  flangeId?: number;
  fabricMasterId?: number;
  beamNo: string;
  flangeNo: string;
  fabricCode: string;
  fabricQuality: string;
  fabricLabel: string;
  beamMeter: number;
  shrinkage: number;
  usedMeters: number;
  remainingMeters: number;
  width: string;
  totalEnds: number;
}

export default function BeamCutEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state as any;
  const isEditMode = !!editData?.id;

  const { loomList } = useSelector((s: RootState) => s.loomMaster as any);
  const { list: beamGatingList } = useSelector((s: RootState) => s.beamGaiting as any);
  const { flangeList } = useSelector((s: RootState) => s.flange as any);
  const { fabricMasterList } = useSelector((s: RootState) => s.fabricMaster as any);
  const { list: factoryBeamInwardList } = useSelector((s: RootState) => s.factoryBeamInward as any);
  const { list: pieceEntryList } = useSelector((s: RootState) => s.factoryPieceEntry as any);
  const { current: beamCutCurrent } = useSelector((s: RootState) => (s as any).beamCut || {});

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>();

  const [detailRows, setDetailRows] = useState<DetailRowData[]>([]);
  const [savedBeamCutDetails, setSavedBeamCutDetails] = useState<DetailRowData[]>([]);
  const formatDecimal = useCallback((value: number) => Number.isFinite(value) ? value.toFixed(2) : '0.00', []);
  const normalizeFabricCodeKey = useCallback((value: string) => value.trim().toUpperCase(), []);
  const extractFabricCodeCandidate = useCallback((value: string) => {
    if (!value) return '';
    const raw = String(value).trim();
    const [candidate] = raw.split(/–|—|-|_/);
    return candidate ? candidate.trim() : '';
  }, []);
  const formatFabricLabel = useCallback((code?: string, quality?: string) => {
    const trimmedCode = String(code ?? '').trim();
    const trimmedQuality = String(quality ?? '').trim();
    if (trimmedCode && trimmedQuality) return `${trimmedCode} – ${trimmedQuality}`;
    if (trimmedCode) return trimmedCode;
    if (trimmedQuality) return trimmedQuality;
    return '';
  }, []);

  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);
  const appliedSavedDetailsRef = useRef(false);
  const requestedFlangeIdsRef = useRef<Set<string>>(new Set());

  const flangeNameMap = useMemo(() => {
    const raw: any = flangeList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((f: any) => {
      const id = f?.id ?? f?.flangeId ?? f?.flange_id;
      if (id != null) {
        map.set(String(id), String(f.flangeNo || f.flange_no || f.flangeNumber || f.name || f.number || ''));
      }
    });
    return map;
  }, [flangeList]);

  useEffect(() => {
    const idsToFetch = new Set<number>();
    detailRows.forEach((row: any) => {
      const flangeId = row?.flangeId;
      if (flangeId == null) return;
      const key = String(flangeId);
      if (!key || flangeNameMap.has(key) || requestedFlangeIdsRef.current.has(key)) {
        return;
      }
      const parsedId = Number(flangeId);
      if (!Number.isNaN(parsedId)) {
        idsToFetch.add(parsedId);
      } else {
        requestedFlangeIdsRef.current.add(key);
      }
    });
    idsToFetch.forEach((id) => {
      const key = String(id);
      requestedFlangeIdsRef.current.add(key);
      dispatch(getFlangeById({ id }));
    });
  }, [dispatch, flangeNameMap, detailRows]);

  const skipAutoDetailLoad = useMemo(() => Boolean(isEditMode && beamCutCurrent?.beamDetails?.length), [beamCutCurrent, isEditMode]);
  const savedLoomId = isEditMode ? (beamCutCurrent?.loomId ?? editData?.loomId) : undefined;


  // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      // Only generate for new entries (not editing existing ones)
      if (editData || hasGeneratedNumberRef.current) {
        return;
      }

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Beam Cut'
        });

        setValue('beamCutNo', result.documentNumber, { shouldValidate: true });
        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate beam cut number:', error);
        toast.error('Failed to generate beam cut number');
      }
    };

    generateDocumentNumber();
  }, [editData, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData) {
        documentNumberService.clearMemoryCache('Beam Cut');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData) {
        documentNumberService.clearMemoryCache('Beam Cut');
      }
    };
  }, [editData]);

  useEffect(() => {
    setValue('beamCutNo', editData?.beamCutNo || '');
  }, [editData, setValue]);


  useEffect(() => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    
    // Looms
    dispatch(getAllLooms(cid ? { companyId: cid } as any : ({} as any)));
    
    // Beam Gaitings
    dispatch(getAllBeamGaitings({ fetchAll: true } as any));
    
    // Flanges - fetch all without company restriction
    dispatch(getAllFlanges({ fetchAll: true } as any));
    
    // Fabric Masters
    dispatch(getAllFabricMasters({ fetchAll: true } as any));
    
    // Factory Beam Inwards
    if (cid) dispatch(getFactoryBeamInwardsByFactoryCompanyId(cid) as any);
    else dispatch(getAllFactoryBeamInwards({ fetchAll: true } as any) as any);
    
    // Factory Piece Entries
    if (cid) dispatch(getFactoryPieceEntriesByCompany({ companyId: cid, isFactoryFabric: 1 }) as any);
    else dispatch(getAllFactoryPieceEntries({ fetchAll: true } as any));
  }, [dispatch]);

  useEffect(() => {
    if (!isEditMode || !editData?.id) return;
    dispatch(getBeamCutById(editData.id) as any);
    return () => {
      dispatch(clearBeamCutCurrent());
    };
  }, [dispatch, editData?.id, isEditMode]);

  useEffect(() => {
    if (beamCutCurrent) return;
    if (isEditMode) {
      reset({
        beamCutDate: editData?.beamCutDate ? new Date(editData.beamCutDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        loomId: String(editData?.loomId ?? ""),
        beamNoFlange: String(editData?.beamNoFlange ?? ""),
        fabricCodeQuality: String(editData?.fabricCodeQuality ?? ""),
        usedMeters: String(editData?.usedMeters ?? ""),
        remainingMeters: String(editData?.remainingMeters ?? ""),
        remarks: String(editData?.remarks ?? ""),
      } as any);
      // setBeamCutNo(String(editData?.beamCutNo ?? ""));
    } else {
      reset({
        beamCutDate: new Date().toISOString().split("T")[0],
        loomId: "",
        beamNoFlange: "",
        fabricCodeQuality: "",
        usedMeters: "",
        remainingMeters: "",
        remarks: "",
      } as any);
      // setBeamCutNo("");
    }
  }, [isEditMode, editData, reset, beamCutCurrent]);

  useEffect(() => {
    if (!beamCutCurrent) {
      setSavedBeamCutDetails([]);
      appliedSavedDetailsRef.current = false;
      return;
    }
    const details = Array.isArray(beamCutCurrent.beamDetails) ? beamCutCurrent.beamDetails : [];
    setSavedBeamCutDetails(details);
    appliedSavedDetailsRef.current = false;
    reset({
      beamCutNo: String(beamCutCurrent.beamCutNo ?? editData?.beamCutNo ?? ""),
      beamCutDate: beamCutCurrent.beamCutDate ? new Date(beamCutCurrent.beamCutDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      loomId: String(beamCutCurrent.loomId ?? editData?.loomId ?? ""),
      beamNoFlange: String(beamCutCurrent.beamNoFlange ?? editData?.beamNoFlange ?? ""),
      fabricCodeQuality: String(beamCutCurrent.fabricCodeQuality ?? editData?.fabricCodeQuality ?? ""),
      usedMeters: String(beamCutCurrent.usedMeters ?? editData?.usedMeters ?? ""),
      remainingMeters: String(beamCutCurrent.remainingMeters ?? editData?.remainingMeters ?? ""),
      remarks: String(beamCutCurrent.remarks ?? editData?.remarks ?? ""),
    } as any);
  }, [beamCutCurrent, editData, reset]);

  const loomOptions = useMemo(() => {
    const raw: any[] = Array.isArray(loomList) ? loomList as any : Array.isArray((loomList as any)?.data) ? (loomList as any).data : [];
    const filtered = raw.filter((l: any) => Number(l?.isBeamGating) === 1);
    const buildOption = (l: any) => ({ value: String(l.id), label: String(l.loomNo || l.loomName || l.name || l.id), activeFlag: l.activeFlag !== undefined ? l.activeFlag : true });
    const baseOptions = filtered.map(buildOption);
    if (isEditMode && savedLoomId != null) {
      const targetValue = String(savedLoomId);
      if (!baseOptions.some(o => o.value === targetValue)) {
        const savedLoom = raw.find((l: any) => String(l.id) === targetValue);
        if (savedLoom) return [...baseOptions, buildOption(savedLoom)];
      }
    }
    return baseOptions;
  }, [loomList, isEditMode, savedLoomId]);

  const fabricDetailsById = useMemo(() => {
    const raw: any = fabricMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, { code: string; quality: string; label: string; totalEnds: number; width: string }>();
    arr.forEach((fabric: any) => {
      const code = String(fabric?.fabricCode || fabric?.code || fabric?.fabric_code || '').trim();
      const quality = String(fabric?.fabricQuality || fabric?.quality || fabric?.fabric_quality || '').trim();
      const label = formatFabricLabel(code, quality);
      const totalEnds = Number(fabric?.totalEnds ?? 0);
      const width = String(fabric?.fabricWidth ?? fabric?.width ?? fabric?.cutWidth ?? fabric?.reedspace ?? fabric?.fabric_width ?? '').trim();
      if (fabric?.id != null) map.set(String(fabric.id), { code, quality, label, totalEnds, width });
    });
    return map;
  }, [fabricMasterList, formatFabricLabel]);

  const fabricDetailsByCode = useMemo(() => {
    const raw: any = fabricMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, { id?: number; code: string; quality: string; label: string; totalEnds: number; width: string }>();
    arr.forEach((fabric: any) => {
      const codeRaw = String(fabric?.fabricCode || fabric?.code || fabric?.fabric_code || '').trim();
      const quality = String(fabric?.fabricQuality || fabric?.quality || fabric?.fabric_quality || '').trim();
      const label = formatFabricLabel(codeRaw, quality);
      const totalEnds = Number(fabric?.totalEnds ?? 0);
      const width = String(fabric?.fabricWidth ?? fabric?.width ?? fabric?.cutWidth ?? fabric?.reedspace ?? fabric?.fabric_width ?? '').trim();
      if (codeRaw) map.set(normalizeFabricCodeKey(codeRaw), { id: fabric?.id, code: codeRaw, quality, label, totalEnds, width });
    });
    return map;
  }, [fabricMasterList, normalizeFabricCodeKey, formatFabricLabel]);

  const getActiveGatingDetails = (gating?: any): any[] => {
    const raw: any[] = Array.isArray(gating?.beamGatingDetails)
      ? gating.beamGatingDetails
      : Array.isArray(gating?.details)
        ? gating.details
        : Array.isArray(gating?.beamDetails)
          ? gating.beamDetails
          : []; 
    return raw.filter((detail: any) =>
      Number(detail?.isBeamCut) === 0 && Number(detail?.isProductionCompleted) === 0
    );
  };

  const latestGatingByLoom = useMemo(() => {
    const arr: any[] = Array.isArray(beamGatingList) ? beamGatingList : Array.isArray((beamGatingList as any)?.data) ? (beamGatingList as any).data : [];
    const map = new Map<string, any>();
    arr.forEach((x: any) => {
      const lid = String(x?.loomId ?? "");
      if (!lid) return;
      const prev = map.get(lid);
      const dNew = new Date(x?.gaitingDate || x?.createdAt || 0).getTime();
      const dPrev = prev ? new Date(prev?.gaitingDate || prev?.createdAt || 0).getTime() : -1;
      if (dNew >= dPrev) map.set(lid, x);
    });
    return map;
  }, [beamGatingList]);

  const beamMeterByBeamId = useMemo(() => {
    const raw: any[] = Array.isArray(beamGatingList)
      ? beamGatingList as any[]
      : Array.isArray((beamGatingList as any)?.data)
        ? (beamGatingList as any).data
        : [];
    const map = new Map<string, number>();
    raw.forEach((gating: any) => {
      const details: any[] = Array.isArray(gating?.beamGatingDetails)
        ? gating.beamGatingDetails
        : Array.isArray(gating?.details)
          ? gating.details
          : Array.isArray(gating?.beamDetails)
            ? gating.beamDetails
            : [];
      details
        .filter((detail: any) => Number(detail?.isBeamCut) === 0 && Number(detail?.isProductionCompleted) === 0)
        .forEach((detail: any) => {
          const beamId = detail?.beamId ?? detail?.id;
          const meterValue = Number(detail?.beamMeter ?? detail?.meter ?? 0);
          if (beamId != null && Number.isFinite(meterValue)) {
            map.set(String(beamId), meterValue);
          }
        });
    });
    return map;
  }, [beamGatingList]);

  const beamMetersByFlange = useMemo(() => {
    const raw: any = factoryBeamInwardList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, number>();
    arr.forEach((fi: any) => {
      (fi.beamInwardBeamDetails || []).forEach((bd: any) => {
        const fid = bd?.flangeId != null ? String(bd.flangeId) : '';
        const wm = Number(bd?.wrapMeters || 0);
        if (fid) map.set(fid, (map.get(fid) || 0) + (Number.isNaN(wm) ? 0 : wm));
      });
    });
    return map;
  }, [factoryBeamInwardList]);

  const calculatePieceMetersForBeam = useCallback((
    targetLoomId: string | number,
    targetBeamId?: string | number | null,
    targetBeamDetailId?: string | number | null,
    targetBeamNo?: string | null,
    targetFlangeId?: string | number | null,
    targetFlangeNo?: string | null,
  ): number => {
    const raw: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
    const targetLoomStr = String(targetLoomId ?? '').trim();
    if (!targetLoomStr) return 0;
    const targetBeamIdStr = targetBeamId != null ? String(targetBeamId).trim() : '';
    const targetBeamDetailIdStr = targetBeamDetailId != null ? String(targetBeamDetailId).trim() : '';
    const targetBeamNoStr = targetBeamNo ? String(targetBeamNo).trim().toLowerCase() : '';
    const targetFlangeIdStr = targetFlangeId != null ? String(targetFlangeId).trim() : '';
    const targetFlangeNoStr = targetFlangeNo ? String(targetFlangeNo).trim().toLowerCase() : '';

    let sum = 0;
    raw.forEach((p: any) => {
      const pLoomStr = String(p?.loomId ?? p?.loom_id ?? '').trim();
      if (pLoomStr !== targetLoomStr) return;

      const pBeamIdStr = p?.beamId != null ? String(p.beamId).trim() : '';
      const pBeamNoStr = String(p?.beamNo || p?.sizedBeamNo || '').trim().toLowerCase();
      const pFlangeIdStr = p?.flangeId != null ? String(p.flangeId).trim() : '';
      const pFlangeNoStr = String(p?.flangeNo || p?.flange_no || '').trim().toLowerCase();

      let matched = false;
      // 1. Match by beamId / beamDetailId
      if (targetBeamIdStr && pBeamIdStr && (pBeamIdStr === targetBeamIdStr || pBeamIdStr === targetBeamDetailIdStr)) {
        matched = true;
      } else if (targetBeamNoStr && pBeamNoStr) {
        // 2. Match by beamNo
        if (pBeamNoStr === targetBeamNoStr || pBeamNoStr.includes(targetBeamNoStr) || targetBeamNoStr.includes(pBeamNoStr)) {
          matched = true;
        }
      } else if (targetFlangeIdStr && pFlangeIdStr && targetFlangeIdStr === pFlangeIdStr) {
        // 3. Fallback match by flangeId
        matched = true;
      } else if (!targetBeamIdStr && !targetBeamNoStr) {
        // 4. Fallback if loom matches and no beam identifiers specified
        matched = true;
      }

      // Check flange conflict if both provide flange
      if (matched && targetFlangeIdStr && pFlangeIdStr && targetFlangeIdStr !== pFlangeIdStr) {
        matched = false;
      }
      if (matched && targetFlangeNoStr && pFlangeNoStr && targetFlangeNoStr !== pFlangeNoStr) {
        matched = false;
      }

      if (matched) {
        const meterVal = Number(p?.pieceMeter ?? p?.inspectedMtr ?? p?.quantity ?? 0);
        if (Number.isFinite(meterVal) && meterVal > 0) {
          sum += meterVal;
        }
      }
    });

    return sum;
  }, [pieceEntryList]);

  
  const widthAndEndsByFlangeId = useMemo(() => {
    const raw: any = factoryBeamInwardList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, { width: string; totalEnds: number }>();
    arr.forEach((fi: any) => {
      (fi.beamInwardBeamDetails || []).forEach((bd: any) => {
        const fid = bd?.flangeId != null ? String(bd.flangeId) : '';
        if (fid) {
          map.set(fid, {
            width: String(bd?.fabricPanelWidth ?? ''),
            totalEnds: Number(bd?.actualEnds ?? 0),
          });
        }
      });
    });
    return map;
  }, [factoryBeamInwardList]);
  
  const mapSavedBeamDetailToRow = useCallback((detail: any, index: number): DetailRowData => {
    const beamKey = detail?.beamDetailId ?? detail?.id ?? `saved-${index}`;
    const beamId = detail?.beamId ?? detail?.beam?.id;
    const flangeId = detail?.flangeId ?? detail?.flange_id ?? detail?.flange?.id ?? detail?.flange?.flangeId;
    
    // Attempt to get flange number from map, then from various fallback properties
    const flangeNo = (flangeId != null && flangeNameMap.has(String(flangeId)))
      ? (flangeNameMap.get(String(flangeId)) ?? "")
      : String(detail?.flangeNo ?? detail?.flange?.flangeNo ?? detail?.flange_no ?? detail?.flange?.flange_no ?? detail?.sizedFlangeNo ?? detail?.flangeNumber ?? '');
      
    // Check for changed fabric columns first, then fall back to original columns
    const changedFabricId = detail?.changedFabricMasterId;
    const changedFabricCode = detail?.changedFabricCodeQuality;
    
    let fabricMasterId, fabricCode, fabricQuality, fabricLabel, fabricInfo;
    
    if (changedFabricId != null || changedFabricCode != null) {
      // Use changed fabric data if available
      fabricMasterId = changedFabricId;
      fabricInfo = changedFabricId != null ? fabricDetailsById.get(String(changedFabricId)) : undefined;
      
      if (fabricInfo) {
        fabricCode = fabricInfo.code;
        fabricQuality = fabricInfo.quality;
        fabricLabel = fabricInfo.label;
      } else {
        // Fall back to changed fabric code if fabric master lookup fails
        const rawChangedCode = String(changedFabricCode || '').trim();
        const extractedChangedCode = extractFabricCodeCandidate(rawChangedCode);
        const normalizedChangedCode = extractedChangedCode ? normalizeFabricCodeKey(extractedChangedCode) : '';
        const fabricFromChangedCode = normalizedChangedCode ? fabricDetailsByCode.get(normalizedChangedCode) : undefined;
        
        fabricInfo = fabricFromChangedCode;
        fabricMasterId = fabricFromChangedCode?.id || changedFabricId;
        fabricCode = fabricFromChangedCode?.code || extractedChangedCode || rawChangedCode;
        fabricQuality = fabricFromChangedCode?.quality || '';
        fabricLabel = fabricFromChangedCode?.label || formatFabricLabel(fabricCode, fabricQuality);
      }
    } else {
      // Use original fabric data if changed columns are null
      fabricMasterId = detail?.fabricMasterId ?? detail?.fabric?.id;
      fabricInfo = fabricMasterId != null ? fabricDetailsById.get(String(fabricMasterId)) : undefined;
      
      // Robust fabric code and quality selection
      fabricCode = fabricInfo?.code || String(detail?.fabricCode || detail?.fabricCodeQuality || detail?.fabric?.fabricCode || detail?.fabric_code || '').trim();
      fabricQuality = fabricInfo?.quality || String(detail?.fabricQuality || detail?.fabric?.fabricQuality || detail?.fabric_quality || '').trim();
      fabricLabel = fabricInfo?.label || formatFabricLabel(fabricCode, fabricQuality);
    }
    
    const beamMeter = Number(detail?.beamMeter ?? detail?.beam_meter ?? detail?.meter ?? detail?.beam?.beamMeter ?? 0);
    const usedMeters = Number(detail?.usedMeters ?? detail?.used_meter ?? detail?.beam?.usedMeters ?? 0);
    const remainingMeters = Number(detail?.remainingMeters ?? detail?.remaining_meter ?? detail?.beam?.remainingMeters ?? 0);
    const shrinkagePercent = Number(detail?.shrinkage ?? detail?.shrinkagePercent ?? 0);
    const shrinkage = Number.isFinite(shrinkagePercent) ? shrinkagePercent / 100 : 0;
    const widthEnds = flangeId != null ? widthAndEndsByFlangeId.get(String(flangeId)) : undefined;

    
    return {
      id: String(beamKey),
      beamDetailId: detail?.beamDetailId ?? detail?.id ?? undefined,
      beamId: beamId ?? undefined,
      flangeId: flangeId != null ? Number(flangeId) : undefined,
      fabricMasterId: fabricMasterId != null ? Number(fabricMasterId) : undefined,
      beamNo: String(detail?.beamNo || detail?.beam?.beamNo || detail?.beam?.beamNumber || detail?.beam?.name || detail?.sizedBeamNo || ''),
      flangeNo,
      fabricCode,
      fabricQuality,
      fabricLabel,
      beamMeter: Number.isFinite(beamMeter) ? beamMeter : 0,
      shrinkage,
      usedMeters: Number.isFinite(usedMeters) ? usedMeters : 0,
      remainingMeters: Number.isFinite(remainingMeters) ? remainingMeters : 0,
      width: String(detail?.width ?? fabricInfo?.width ?? widthEnds?.width ?? ''),
      totalEnds: Number(detail?.totalEnds ?? fabricInfo?.totalEnds ?? widthEnds?.totalEnds ?? 0),
    };
  }, [fabricDetailsById, flangeNameMap, formatFabricLabel, widthAndEndsByFlangeId]);

  useEffect(() => {
    if (!beamCutCurrent?.beamDetails?.length) return;
    setDetailRows(beamCutCurrent.beamDetails.map(mapSavedBeamDetailToRow));
  }, [beamCutCurrent, mapSavedBeamDetailToRow]);

  const onLoomChange = useCallback((loomId: string) => {
    const gating = latestGatingByLoom.get(String(loomId));
    const details: any[] = getActiveGatingDetails(gating);
    if (!details.length) {
      setDetailRows([]);
      return;
    }

    const selectedLoomIdValue = Number(loomId);
    const hasValidLoomId = !Number.isNaN(selectedLoomIdValue);

    const rows: DetailRowData[] = details.map((detail, index) => {
      const keySource = detail?.id ?? detail?.beamDetailId ?? detail?.beamId ?? `row-${index}`;
      const beamKey = String(keySource);
      const detailBeamId = detail?.beamId;
      const rawDetailMeter = Number(detail?.beamMeter ?? detail?.meter ?? 0);
      const beamMeterSource = rawDetailMeter > 0
        ? rawDetailMeter
        : (detailBeamId != null ? (beamMeterByBeamId.get(String(detailBeamId)) ?? rawDetailMeter) : rawDetailMeter);
      const beamMeter = Number.isFinite(beamMeterSource) ? beamMeterSource : 0;
      const shrinkagePercent = Number(detail?.shrinkage ?? 0);
      const shrinkage = Number.isFinite(shrinkagePercent) ? shrinkagePercent / 100 : 0;
      const flangeId = detail?.flangeId ?? detail?.flange_id ?? detail?.flange?.id ?? detail?.flange?.flangeId;
      const flangeLabel = (flangeId != null && flangeNameMap.has(String(flangeId)))
        ? (flangeNameMap.get(String(flangeId)) ?? "")
        : String(detail?.flangeNo ?? detail?.flange?.flangeNo ?? detail?.flange_no ?? detail?.flange?.flange_no ?? detail?.sizedFlangeNo ?? detail?.flangeNumber ?? '');
      const beamNo = String(detail?.beamNo || detail?.sizedBeamNo || detail?.beamNumber || '');

      const totalPieceMeter = calculatePieceMetersForBeam(
        loomId,
        detailBeamId,
        detail?.id,
        beamNo,
        flangeId,
        flangeLabel,
      );
      const rawDetailUsedMeter = Number(detail?.usedMeters ?? detail?.used_meter ?? detail?.usedMeter ?? 0);
      const usedRaw = totalPieceMeter > 0
        ? totalPieceMeter + (totalPieceMeter * shrinkage)
        : (rawDetailUsedMeter > 0 ? rawDetailUsedMeter : 0);
      const usedValue = Number(Math.max(usedRaw, 0).toFixed(2));
      const remainingValue = Number(Math.max(beamMeter - usedValue, 0).toFixed(2));
      
      // Check for changed fabric columns first, then fall back to original columns
      const changedFabricId = detail?.changedFabricMasterId;
      const changedFabricCode = detail?.changedFabricCodeQuality;
      
      let fabricMasterId, fabricCodeDisplay, fabricQualityDisplay, fabricLabel, resolvedFabricDetails;
      
      if (changedFabricId != null || changedFabricCode != null) {
        // Use changed fabric data if available
        fabricMasterId = changedFabricId;
        const changedFabric = changedFabricId != null ? fabricDetailsById.get(String(changedFabricId)) : undefined;
        
        if (changedFabric) {
          fabricCodeDisplay = changedFabric.code;
          fabricQualityDisplay = changedFabric.quality;
          fabricLabel = changedFabric.label;
          resolvedFabricDetails = changedFabric;
        } else {
          // Fall back to changed fabric code if fabric master lookup fails
          const rawChangedCode = String(changedFabricCode || '').trim();
          const extractedChangedCode = extractFabricCodeCandidate(rawChangedCode);
          const normalizedChangedCode = extractedChangedCode ? normalizeFabricCodeKey(extractedChangedCode) : '';
          const fabricFromChangedCode = normalizedChangedCode ? fabricDetailsByCode.get(normalizedChangedCode) : undefined;
          
          resolvedFabricDetails = fabricFromChangedCode;
          fabricMasterId = fabricFromChangedCode?.id || changedFabricId;
          fabricCodeDisplay = fabricFromChangedCode?.code || extractedChangedCode || rawChangedCode;
          fabricQualityDisplay = fabricFromChangedCode?.quality || '';
          fabricLabel = fabricFromChangedCode?.label || formatFabricLabel(fabricCodeDisplay, fabricQualityDisplay);
        }
      } else {
        // Use original fabric data if changed columns are null
        const baseFabricId = detail?.fabricMasterId ?? detail?.fabricId;
        const baseFabric = baseFabricId != null ? fabricDetailsById.get(String(baseFabricId)) : undefined;
        
        const rawFabricCode = String(detail?.fabricCode || detail?.fabricCodeQuality || detail?.fabric?.fabricCode || detail?.fabric_code || '').trim();
        const extractedCode = extractFabricCodeCandidate(rawFabricCode);
        const normalizedCode = extractedCode ? normalizeFabricCodeKey(extractedCode) : '';
        const fabricFromCode = normalizedCode ? fabricDetailsByCode.get(normalizedCode) : undefined;
        
        resolvedFabricDetails = fabricFromCode || baseFabric;
        fabricMasterId = baseFabricId ?? fabricFromCode?.id;
        
        fabricCodeDisplay = resolvedFabricDetails?.code || extractedCode || String(detail?.fabricCode || detail?.fabric?.fabricCode || detail?.fabric_code || '').trim();
        fabricQualityDisplay = resolvedFabricDetails?.quality || String(detail?.fabricQuality || detail?.fabric?.fabricQuality || detail?.fabric_quality || '').trim();
        fabricLabel = resolvedFabricDetails?.label || formatFabricLabel(fabricCodeDisplay, fabricQualityDisplay);
      }
      const resolvedFabric = fabricMasterId != null
        ? fabricDetailsById.get(String(fabricMasterId))
        : resolvedFabricDetails;
      const widthEnds = flangeId != null ? widthAndEndsByFlangeId.get(String(flangeId)) : undefined;
      const rowWidth = String(resolvedFabric?.width || widthEnds?.width || detail?.width || '');
      const fabricBaseTotalEnds = fabricMasterId != null ? (fabricDetailsById.get(String(fabricMasterId))?.totalEnds ?? 0) : 0;
      const baseTotalEnds = fabricBaseTotalEnds || resolvedFabric?.totalEnds || (widthEnds?.totalEnds ?? 0) || Number(detail?.totalEnds ?? 0);
      return {
        id: beamKey,
        beamDetailId: detail?.id ?? detail?.beamDetailId,
        beamId: detail?.beamId,
        flangeId,
        fabricMasterId,
        beamNo,
        flangeNo: flangeLabel,
        fabricCode: fabricCodeDisplay,
        fabricQuality: fabricQualityDisplay,
        fabricLabel,
        beamMeter,
        shrinkage,
        usedMeters: Number(usedValue.toFixed(2)),
        remainingMeters: Number(remainingValue.toFixed(2)),
        width: rowWidth,
        totalEnds: baseTotalEnds,
      };
    });

    setDetailRows(rows);
  }, [
    latestGatingByLoom,
    beamMeterByBeamId,
    calculatePieceMetersForBeam,
    flangeNameMap,
    fabricDetailsById,
    fabricDetailsByCode,
    extractFabricCodeCandidate,
    normalizeFabricCodeKey,
    formatFabricLabel,
    widthAndEndsByFlangeId,
  ]);

  const loomId = watch('loomId');

  useEffect(() => {
    if (!isEditMode || savedLoomId == null) return;
    const targetValue = String(savedLoomId);
    if (loomId === targetValue) return;
    if (!loomOptions.some(o => o.value === targetValue)) return;
    setValue('loomId', targetValue);
  }, [isEditMode, savedLoomId, loomId, loomOptions, setValue]);

  useEffect(() => {
    if (loomId && !skipAutoDetailLoad) onLoomChange(loomId);
  }, [loomId, skipAutoDetailLoad, onLoomChange]);

  useEffect(() => {
    if (!loomId) {
      setDetailRows([]);
    }
  }, [loomId]);

  useEffect(() => {
    const cur = watch('loomId');
    if (cur && !skipAutoDetailLoad) onLoomChange(cur);
  }, [skipAutoDetailLoad, onLoomChange, watch]);

  useEffect(() => {
    if (!detailRows.length) {
      setValue('beamNoFlange', '');
      setValue('fabricCodeQuality', '');
      setValue('usedMeters', '');
      setValue('remainingMeters', '');
      return;
    }
    const aggregatedLabel = Array.from(new Set(detailRows
      .map(row => [row.beamNo, row.flangeNo].filter(Boolean).join(' / '))
      .filter(Boolean))).join(', ');
    const fabricLabel = detailRows.map(row => row.fabricLabel).find(Boolean) || '';
    const totalUsedMeters = detailRows.reduce((sum, row) => sum + row.usedMeters, 0);
    const totalRemainingMeters = detailRows.reduce((sum, row) => sum + row.remainingMeters, 0);
    setValue('beamNoFlange', aggregatedLabel);
    setValue('fabricCodeQuality', fabricLabel);
    setValue('usedMeters', formatDecimal(totalUsedMeters));
    setValue('remainingMeters', formatDecimal(totalRemainingMeters));
  }, [detailRows, formatDecimal, setValue]);


  const fabricOptions = useMemo(() => {
    const raw: any = fabricMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    return arr.map((fabric: any) => ({
      value: String(fabric.id),
      label: formatFabricLabel(
        String(fabric?.fabricCode || fabric?.code || '').trim(),
        String(fabric?.fabricQuality || fabric?.quality || '').trim()
      ),
    }));
  }, [fabricMasterList, formatFabricLabel]);

  const updateRowFabric = useCallback((rowId: string, fabricMasterIdStr: string) => {
    const fabricInfo = fabricDetailsById.get(fabricMasterIdStr);
    setDetailRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const resolvedWidth = fabricInfo?.width || row.width || '';
      const resolvedTotalEnds = fabricInfo?.totalEnds || row.totalEnds || 0;
      return {
        ...row,
        fabricMasterId: fabricMasterIdStr ? Number(fabricMasterIdStr) : undefined,
        fabricCode: fabricInfo?.code ?? '',
        fabricQuality: fabricInfo?.quality ?? '',
        fabricLabel: fabricInfo?.label ?? '',
        width: resolvedWidth,
        totalEnds: resolvedTotalEnds,
      };
    }));
  }, [fabricDetailsById]);

  // Synchronize width, totalEnds and fabric info if fabricMasterList loads after rows are initialized
  useEffect(() => {
    if (!detailRows.length || !fabricDetailsById.size) return;
    setDetailRows(prev => {
      let changed = false;
      const updated = prev.map(row => {
        if (!row.fabricMasterId) return row;
        const fabricInfo = fabricDetailsById.get(String(row.fabricMasterId));
        if (!fabricInfo) return row;
        const newWidth = row.width || fabricInfo.width || '';
        const newTotalEnds = row.totalEnds || fabricInfo.totalEnds || 0;
        const newCode = row.fabricCode || fabricInfo.code || '';
        const newQuality = row.fabricQuality || fabricInfo.quality || '';
        const newLabel = row.fabricLabel || fabricInfo.label || '';
        if (
          newWidth !== row.width ||
          newTotalEnds !== row.totalEnds ||
          newCode !== row.fabricCode ||
          newQuality !== row.fabricQuality ||
          newLabel !== row.fabricLabel
        ) {
          changed = true;
          return {
            ...row,
            width: newWidth,
            totalEnds: newTotalEnds,
            fabricCode: newCode,
            fabricQuality: newQuality,
            fabricLabel: newLabel,
          };
        }
        return row;
      });
      return changed ? updated : prev;
    });
  }, [fabricDetailsById]);

  const updateRowValue = (rowId: string, field: "usedMeters" | "remainingMeters", rawValue: string) => {
    const parsed = parseFloat(rawValue);
    const value = Number.isNaN(parsed) ? 0 : Number(parsed.toFixed(2));
    setDetailRows(prevRows => prevRows.map(row => {
      if (row.id !== rowId) return row;
      if (field === "usedMeters") {
        const usedValue = Number(Math.max(value, 0).toFixed(2));
        const remainingValue = Number(Math.max(row.beamMeter - usedValue, 0).toFixed(2));
        return { ...row, usedMeters: usedValue, remainingMeters: remainingValue };
      }
      const remainingValue = Number(Math.max(value, 0).toFixed(2));
      const usedValue = Number(Math.max(row.beamMeter - remainingValue, 0).toFixed(2));
      return { ...row, usedMeters: usedValue, remainingMeters: remainingValue };
    }));
  };

  const onSubmit = async (data: FormData) => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const companyId = v ? Number(v) : undefined;

    const gating = latestGatingByLoom.get(String(data.loomId || ''));
    const details: any[] = getActiveGatingDetails(gating);
    const firstDtl: any = Array.isArray(details) && details.length > 0 ? details[0] : undefined;

    const fabricCode = String(data.fabricCodeQuality || '').trim();
    const fm = Array.isArray(fabricMasterList)
      ? (fabricMasterList as any[]).find((f: any) => String(f.fabricCode || '') === fabricCode)
      : Array.isArray((fabricMasterList as any)?.data)
        ? ((fabricMasterList as any).data as any[]).find((f: any) => String(f.fabricCode || '') === fabricCode)
        : undefined;

        
 const isEditMode = Boolean(editData?.id);
       let beamCutNo = data.beamCutNo || editData?.beamCutNo || "";
            if (!editData?.id && !beamCutNo) {
                try {
                    const docResponse = await documentNumberService.generateDocumentNumber({
                        screenName: "Beam Cut",
                    });
                    beamCutNo = docResponse.documentNumber;
                } catch (error) {
                    console.warn("Failed to generate document number:", error);
                }
            }
isSavingRef.current = true;
    const payload = {
      beamCutNo: beamCutNo,
      beamCutDate: data.beamCutDate,
      loomId: data.loomId ? parseInt(data.loomId) : undefined,
      remarks: data.remarks || "",
      beamDetails: detailRows.map(row => ({
        beamDetailId: row.beamDetailId,
        beamId: row.beamId,
        beamNo: row.beamNo,
        flangeId: row.flangeId,
        fabricMasterId: row.fabricMasterId,
        usedMeters: row.usedMeters,
        remainingMeters: row.remainingMeters,
        width: row.width,
        totalEnds: row.totalEnds,
      })),
      companyId,
    } as any;

    // alert(JSON.stringify(payload, null, 2));
    console.log("Beam cut payload data"+JSON.stringify(payload));
    if (isEditMode) {
      await dispatch(updateBeamCut({ id: editData.id, data: payload, companyId }) as any).unwrap();
    } else {
      await dispatch(createBeamCut(payload) as any).unwrap();
 documentNumberService.clearMemoryCache("Beam Cut");
    }
    navigate('/transaction/beam-cut-details');
  };

  
  const cancel = () => navigate('/transaction/beam-cut-details');

  return (
    <div className="p-6 pt-16">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate("/transaction/beam-cut-details")}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold mb-4">{isEditMode ? 'Edit' : 'Add'} Beam Cut</h1>
      </div>
      <div className=" mx-auto">
        <Card className="p-6 bg-white">
          {/* <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Beam Cut' : 'Beam Cut'}</CardTitle>
          </CardHeader> */}
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm mb-1">Beam Cut No</label>
                  <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100" {...register('beamCutNo')} readOnly />
                </div>
                <div>
                  <label className="block text-sm mb-1">Beam Cut Date</label>
                  <input type="date" className="w-full input input-bordered" {...register('beamCutDate', { required: true })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Loom No</label>
                  <CommonSearchableSelect
                    className="w-full  input-bordered"
                    placeholder="Select Loom"
                    options={loomOptions}
                    filterActive
                    value={watch('loomId') || ''}
                    {...register('loomId', { required: true })}
                    onValueChange={(value) => setValue('loomId', value, { shouldValidate: true })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Remarks</label>
                  <input
                    type="text"
                    placeholder="Enter remarks"
                    className="w-full input input-bordered"
                    {...register('remarks')}
                  />
                </div>
              </div>
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Beam Details</p>
                  <p className="text-xs text-slate-500">{detailRows.length ? `${detailRows.length} row${detailRows.length === 1 ? '' : 's'}` : 'Select a loom to load data'}</p>
                </div>
                <div className="overflow-x-auto border border-gray-200 bg-white rounded-lg shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Beam No</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Empty Beam No</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort No – Construction</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Width</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Ends</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Used Meters</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining Meters</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Select a loom that has active beam details to view the table</td>
                        </tr>
                      ) : (
                        detailRows.map(row => (
                          <tr key={row.id} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-medium text-center">{row.beamNo || '-'}</td>
                            <td className="px-4 py-3 text-center">{row.flangeNo || ''}</td>
                            <td className="px-4 py-3 text-center min-w-[200px]">
                              <CommonSearchableSelect
                                placeholder="Select Fabric"
                                options={fabricOptions}
                                value={row.fabricMasterId ? String(row.fabricMasterId) : ''}
                                onValueChange={(val) => updateRowFabric(row.id, val)}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="text"
                                readOnly
                                value={row.width}
                                className="w-24 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-sm font-medium text-slate-800 text-center"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                readOnly
                                value={row.totalEnds}
                                className="w-24 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-sm font-medium text-slate-800 text-center"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={String(row.usedMeters)}
                                onChange={(e) => updateRowValue(row.id, "usedMeters", e.target.value)}
                                className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                              />
                              {row.shrinkage ? (
                                <p className="text-[11px] text-blue-500">Shrink {Number((row.shrinkage * 100).toFixed(2))}%</p>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={String(row.remainingMeters)}
                                onChange={(e) => updateRowValue(row.id, "remainingMeters", e.target.value)}
                                className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                              />
                              {row.beamMeter > 0 ? (
                                <p className="text-[11px] text-slate-500">Beam {row.beamMeter} m</p>
                              ) : null}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <input type="hidden" {...register('beamNoFlange', { required: true })} />
              <input type="hidden" {...register('fabricCodeQuality', { required: true })} />
              <input type="hidden" {...register('usedMeters', { required: true })} />
              <input type="hidden" {...register('remainingMeters', { required: true })} />
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2 border rounded" onClick={cancel}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{isEditMode ? 'Update' : 'Save'}</button>
              </div>
              {/* <div className="flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={cancel}>Cancel</Button>
                <Button type="submit">{isEditMode ? 'Update' : 'Save'}</Button>
              </div> */}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
