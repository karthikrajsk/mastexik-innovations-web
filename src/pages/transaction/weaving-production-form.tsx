import { ArrowLeft, Trash } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AppDispatch, RootState } from "@/state/store";
import {
  clearCurrentRecord,
  createWeavingProduction,
  getAllWeavingProductions,
  getWeavingProductionById,
  updateWeavingProduction,
} from "@/state/weavingProductionSlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllBeamGaitings } from "@/state/beamGaitingSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { Button } from "@/components/ui/button";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import documentNumberService from "@/services/DocumentNumberService";

interface FormValues {
  id?: number;
  weavingProductionNo: string;
  weavingDate: string;
  loomId: string;
}

interface RowDetail {
  tempId: string;
  shift: string;
  productionPicks: string;
  productionMeters: string;
}

interface BeamSummary {
  beams: Set<string>;
  flanges: Set<string>;
  fabrics: Set<string>;
  beamIds: Set<string>;
  flangeIds: Set<string>;
  fabricMasterIds: Set<string>;
}

const normalizeText = (value?: string) => (value ?? "").toString().trim().toLowerCase();
const normalizeKey = (value?: string) =>
  (value ?? "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const normalizeIdentifier = (value?: string | number) => {
  if (value == null) return "";
  const raw = typeof value === "string" ? value.trim() : String(value);
  if (!raw) return "";
  const numericMatch = raw.match(/^(\d+)(?:\.0+)?$/);
  const normalizedValue = numericMatch ? numericMatch[1] : raw;
  return normalizeKey(normalizedValue);
};

const stripLeadingZeros = (value?: string) => {
  if (!value) return "";
  const stripped = value.replace(/^0+/, "");
  return stripped || "0";
};

const matchesNormalizedValue = (source: string, target: string) => {
  if (!source || !target) return false;
  if (source === target) return true;
  if (source.endsWith(target)) return true;
  if (target.endsWith(source)) return true;
  return false;
};

const buildProductionLookupKey = (
  date?: string | null,
  loomValue?: string | number,
  beamValue?: string | number,
): string | undefined => {
  const normalizedDate = typeof date === "string" ? date.trim() : "";
  const normalizedLoom = loomValue != null ? normalizeIdentifier(String(loomValue)) : "";
  const normalizedBeam = beamValue != null ? normalizeIdentifier(String(beamValue)) : "";
  const parts = [normalizedDate, normalizedLoom, normalizedBeam].filter(Boolean);
  return parts.length ? parts.join("|") : undefined;
};

const resolveLoomSelectValue = (record: any, options: Array<{ value: string; label: string }>): string => {
  if (!record || !options?.length) return "";

  const valueCandidates: string[] = [];
  const labelCandidates = new Set<string>();

  const pushValue = (value: any) => {
    if (value == null) return;
    const text = String(value).trim();
    if (text && !valueCandidates.includes(text)) {
      valueCandidates.push(text);
    }
  };

  const pushLabel = (value: any) => {
    const normalized = normalizeText(value);
    if (normalized) {
      labelCandidates.add(normalized);
    }
  };

  pushValue(record?.loomId);
  pushValue(record?.loom?.id);
  pushValue(record?.loom?.loomId);
  pushValue(record?.loomNo);
  pushValue(record?.loom?.loomNo);
  pushValue(record?.loom?.name);
  pushValue(record?.loom?.loomNumber);
  pushLabel(record?.loomNo);
  pushLabel(record?.loom?.loomNo);
  pushLabel(record?.loomNumber);
  pushLabel(record?.loom?.name);

  for (const option of options) {
    const optionValue = option?.value?.toString().trim();
    if (!optionValue) continue;
    if (valueCandidates.includes(optionValue)) {
      return optionValue;
    }
    const normalizedLabel = normalizeText(option.label);
    if (normalizedLabel && labelCandidates.has(normalizedLabel)) {
      return optionValue;
    }
  }

  return valueCandidates[0] ?? "";
};
const parseDateToIso = (value: any): string => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const excelStartDate = new Date(Date.UTC(1899, 11, 30));
    const ms = Number(value) * 24 * 60 * 60 * 1000;
    if (Number.isFinite(ms)) {
      const computed = new Date(excelStartDate.getTime() + ms);
      if (!Number.isNaN(computed.getTime())) {
        return computed.toISOString().slice(0, 10);
      }
    }
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
};

const parseDateToIsoOrNull = (value: any): string | null => {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const excelStartDate = new Date(Date.UTC(1899, 11, 30));
    const ms = Number(value) * 24 * 60 * 60 * 1000;
    if (!Number.isFinite(ms)) return null;
    const computed = new Date(excelStartDate.getTime() + ms);
    if (!Number.isNaN(computed.getTime())) {
      return computed.toISOString().slice(0, 10);
    }
  }
  if (typeof value === "string") {
    const europeanPattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    const match = value.trim().match(europeanPattern);
    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]);
      let year = Number(match[3]);
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      const computed = new Date(Date.UTC(year, month - 1, day));
      if (!Number.isNaN(computed.getTime())) {
        return computed.toISOString().slice(0, 10);
      }
    }
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
};

const getPrimarySetValue = (set?: Set<string>) => {
  if (!set || set.size === 0) return undefined;
  return Array.from(set)[0];
};

const getStoredCompanyId = () => {
  const raw = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const createEmptyRow = (): RowDetail => ({
  tempId: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  shift: "",
  productionPicks: "",
  productionMeters: "",
});

const sanitizeDecimalInput = (value: string) => {
  const sanitized = value.replace(/[^0-9.]/g, "");
  if (!sanitized) return "";
  const [integerPart, decimalPart] = sanitized.split(".");
  const trimmed = decimalPart ? decimalPart.slice(0, 2) : "";
  return trimmed ? `${integerPart}.${trimmed}` : integerPart;
};

export function WeavingProductionFormPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const params = useParams();
  const isEditMode = Boolean(params.id);
  const storedCompanyId = useMemo(() => getStoredCompanyId(), []);

  const { register, handleSubmit,setValue, reset, watch, formState: { errors } } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      weavingDate: new Date().toISOString().slice(0, 10),
      loomId: "",
    },
  });

  const [rows, setRows] = useState<RowDetail[]>([createEmptyRow()]);

  const { loomList } = useSelector((state: RootState) => (state as any).loomMaster || {});
  const { list: beamGatingList } = useSelector((state: RootState) => (state as any).beamGaiting || {});
  const { fabricMasterList } = useSelector((state: RootState) => (state as any).fabricMaster || {});
  const { weavingProductionList, currentRecord } = useSelector((state: RootState) => (state as any).weavingProduction || {});

  const isSavingRef = useRef(false);
              const hasGeneratedNumberRef = useRef(false);
          
           // Generate document number for new beam inward entries
              useEffect(() => {
                  const generateDocumentNumber = async () => {
                      if (currentRecord || hasGeneratedNumberRef.current) {
                          return;
                      }
                      try {
                          const result = await documentNumberService.generateDocumentNumber({
                              screenName: 'Weaving Production'
                          });
                          setValue('weavingProductionNo', result.documentNumber, { shouldValidate: true });
                          hasGeneratedNumberRef.current = true;
                      } catch (error) {
                          console.error('Failed to generate Weaving Production number:', error);
                          toast.error('Failed to generate Weaving Production number');
                      }
                  };
          
                  generateDocumentNumber();
              }, [currentRecord, setValue]);
          
              // Cleanup document number cache if not saved
              useEffect(() => {
                  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                      if (hasGeneratedNumberRef.current && !isSavingRef.current && !currentRecord) {
                          documentNumberService.clearMemoryCache('Weaving Production');
                      }
                  };
          
                  window.addEventListener('beforeunload', handleBeforeUnload);
          
                  return () => {
                      window.removeEventListener('beforeunload', handleBeforeUnload);
                      if (hasGeneratedNumberRef.current && !isSavingRef.current && !currentRecord) {
                          documentNumberService.clearMemoryCache('Weaving Production');
                      }
                  };
              }, [currentRecord]);
          
            useEffect(() => {
              setValue('weavingProductionNo', currentRecord?.weavingProductionNo || '') ;
            }, [currentRecord, setValue]);


  const fabricMasterLookup = useMemo(() => {
    const rawList = Array.isArray(fabricMasterList)
      ? fabricMasterList
      : Array.isArray(fabricMasterList?.data)
        ? fabricMasterList.data
        : [];
    const map = new Map<string, string>();
    const addKey = (key: string, value: string) => {
      const normalized = normalizeText(key);
      if (!normalized || map.has(normalized)) return;
      map.set(normalized, value);
    };
    rawList.forEach((fabric: any) => {
      const idCandidate = fabric?.id ?? fabric?.fabricMasterId ?? fabric?.fabric_master_id ?? fabric?.fabricId ?? fabric?.fabric_id;
      if (idCandidate == null) return;
      const idValue = String(idCandidate);
      const code = String(fabric?.fabricCode ?? fabric?.fabric_code ?? fabric?.code ?? "");
      const quality = String(fabric?.fabricQuality ?? fabric?.fabric_quality ?? fabric?.quality ?? "");
      addKey(code, idValue);
      addKey(quality, idValue);
      addKey([code, quality].filter(Boolean).join(" - "), idValue);
      addKey([code, quality].filter(Boolean).join("-"), idValue);
    });
    return map;
  }, [fabricMasterList]);

  useEffect(() => {
    dispatch(getAllLooms({ companyId: storedCompanyId }));
    dispatch(getAllBeamGaitings({ companyId: storedCompanyId }));
    dispatch(getAllFabricMasters({}));
  }, [dispatch, storedCompanyId]);

  useEffect(() => {
    if (isEditMode && params.id) {
      dispatch(getWeavingProductionById(Number(params.id)));
    }
  }, [dispatch, isEditMode, params.id]);

  useEffect(() => {
    const params: any = { fetchAll: true };
    if (storedCompanyId != null) {
      params.companyId = storedCompanyId;
    }
    dispatch(getAllWeavingProductions(params));
  }, [dispatch, storedCompanyId]);

  useEffect(() => {
    if (!isEditMode) {
      dispatch(clearCurrentRecord());
      reset({
        weavingDate: new Date().toISOString().slice(0, 10),
        loomId: "",
      });
      setRows([createEmptyRow()]);
    }
  }, [dispatch, isEditMode, reset]);

  const normalizedWeavingList = useMemo(() => {
    if (Array.isArray(weavingProductionList)) return weavingProductionList;
    if (Array.isArray(weavingProductionList?.data)) return weavingProductionList.data;
    return [];
  }, [weavingProductionList]);

  const existingShiftAllocations = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const entries = Array.isArray(normalizedWeavingList) ? normalizedWeavingList : [];
    entries.forEach((record: any) => {
      if (isEditMode && currentRecord && String(currentRecord.id) === String(record?.id)) {
        return;
      }
      const isoDate = parseDateToIsoOrNull(
        record?.weavingProductionDate ?? record?.weavingDate ?? record?.date ?? record?.createdAt,
      );
      if (!isoDate) return;
      const loomValue =
        record?.loomNo ??
        record?.loom?.loomNo ??
        record?.loom?.name ??
        record?.loom?.loomNumber ??
        (record?.loomId != null ? String(record.loomId) : "");
      const beamValue =
        record?.beamNo ??
        record?.beam?.beamNo ??
        record?.beamNumber ??
        record?.sizedBeamNo ??
        "";
      const mapKey = buildProductionLookupKey(isoDate, loomValue, beamValue);
      if (!mapKey) return;
      const details = Array.isArray(record?.productionDetails)
        ? record.productionDetails
        : Array.isArray(record?.weavingProductionDetails)
          ? record.weavingProductionDetails
          : [];
      details.forEach((detail: any) => {
        const shiftValue = detail?.shift || detail?.shiftName || detail?.shiftLabel || "";
        const normalizedShift = normalizeText(shiftValue);
        if (!normalizedShift) return;
        const existing = map.get(mapKey) || new Set<string>();
        existing.add(normalizedShift);
        map.set(mapKey, existing);
      });
    });
    return map;
  }, [currentRecord, isEditMode, normalizedWeavingList]);

  const existingEntryKeys = useMemo(() => {
    const set = new Set<string>();
    const entries = Array.isArray(normalizedWeavingList) ? normalizedWeavingList : [];
    entries.forEach((record: any) => {
      if (isEditMode && currentRecord && String(currentRecord.id) === String(record?.id)) {
        return;
      }
      const isoDate = parseDateToIsoOrNull(
        record?.weavingProductionDate ?? record?.weavingDate ?? record?.date ?? record?.createdAt,
      );
      if (!isoDate) return;
      const loomValue =
        record?.loomNo ??
        record?.loom?.loomNo ??
        record?.loom?.name ??
        record?.loom?.loomNumber ??
        (record?.loomId != null ? String(record.loomId) : "");
      const beamValue =
        record?.beamNo ??
        record?.beam?.beamNo ??
        record?.beamNumber ??
        record?.sizedBeamNo ??
        "";
      const entryKey = buildProductionLookupKey(isoDate, loomValue, beamValue);
      if (entryKey) {
        set.add(entryKey);
      }
    });
    return set;
  }, [currentRecord, isEditMode, normalizedWeavingList]);

  const loomOptions = useMemo(() => {
    const arr = Array.isArray(loomList) ? loomList : Array.isArray(loomList?.data) ? loomList.data : [];
    return arr.map((loom: any) => ({
      value: String(loom.id ?? loom.loomId ?? loom.loomNo ?? loom.loomNumber ?? loom.name ?? ""),
      label: String(loom.loomNo || loom.loomName || loom.name || loom.loomNumber || loom.id || ""),
    }));
  }, [loomList]);

  const resolvedEditLoomId = useMemo(() => {
    if (!currentRecord) return "";
    return resolveLoomSelectValue(currentRecord, loomOptions);
  }, [currentRecord, loomOptions]);

  useEffect(() => {
    if (!isEditMode || !currentRecord) return;
    const fallbackLoomId = currentRecord.loomId
      ? String(currentRecord.loomId)
      : currentRecord.loomNo
        ? String(currentRecord.loomNo)
        : "";
    const resolvedLoomId = resolvedEditLoomId || fallbackLoomId;
    reset({
      id: currentRecord.id,
      weavingDate: parseDateToIso(currentRecord.weavingProductionDate || currentRecord.weavingDate || currentRecord.date),
      loomId: resolvedLoomId,
    });
    const details = Array.isArray(currentRecord.productionDetails)
      ? currentRecord.productionDetails
      : Array.isArray(currentRecord.weavingProductionDetails)
        ? currentRecord.weavingProductionDetails
        : [];
    if (details.length) {
      setRows(
        details.map((detail: any) => ({
          tempId: `edit-${detail.id || Math.random()}`,
          shift: detail.shift || detail.shiftName || "",
          productionPicks: detail.productionPicks != null ? String(detail.productionPicks) : (detail.picks != null ? String(detail.picks) : ""),
          productionMeters: detail.productionMeters != null ? String(detail.productionMeters) : (detail.meters != null ? String(detail.meters) : ""),
        })),
      );
    } else {
      setRows([createEmptyRow()]);
    }
  }, [currentRecord, isEditMode, resolvedEditLoomId, reset]);

  const beamSummaryMaps = useMemo(() => {
    const arr = Array.isArray(beamGatingList)
      ? beamGatingList
      : Array.isArray((beamGatingList as any)?.data)
        ? (beamGatingList as any).data
        : [];
    const createSummary = (): BeamSummary => ({
      beams: new Set<string>(),
      flanges: new Set<string>(),
      fabrics: new Set<string>(),
      beamIds: new Set<string>(),
      flangeIds: new Set<string>(),
      fabricMasterIds: new Set<string>(),
    });
    const addDetailToSummary = (summary: BeamSummary, detail: any) => {
      const beamRaw = String(detail?.beamNo || detail?.beamNumber || detail?.sizedBeamNo || "").trim();
      const flangeRaw = String(detail?.flangeNo || detail?.flangeNumber || "").trim();
      const hasChangedFabric = detail?.changedFabricMasterId != null;
      let fabricLabel = hasChangedFabric
        ? (detail?.changedFabricCodeQuality || detail?.changedFabricCode || "")
        : (detail?.fabricCodeQuality || detail?.fabricCode || "");
      if (!fabricLabel && !hasChangedFabric && detail?.fabricCode && detail?.fabricQuality) {
        fabricLabel = `${detail.fabricCode} - ${detail.fabricQuality}`;
      }
      if (!fabricLabel && !hasChangedFabric && detail?.fabricQuality) {
        fabricLabel = detail.fabricQuality;
      }
      const beamIdCandidates = [detail?.beamId, detail?.id, detail?.beamDetailId, detail?.beam_detail_id];
      const beamId = beamIdCandidates.find((candidate) => candidate != null);
      const flangeIdCandidates = [detail?.flangeId, detail?.flange_id, detail?.flange?.id];
      const flangeId = flangeIdCandidates.find((candidate) => candidate != null);
      const fabricMasterIdCandidate = hasChangedFabric
        ? detail.changedFabricMasterId
        : [detail?.fabricMasterId, detail?.fabric_master_id, detail?.fabricId, detail?.fabric_id, detail?.fabricMaster?.id].find(
            (candidate) => candidate != null,
          );
      const normalizedFabricLabel = fabricLabel ? normalizeText(fabricLabel) : "";
      const fabricMasterIdFromLookup = normalizedFabricLabel ? fabricMasterLookup.get(normalizedFabricLabel) : undefined;
      const resolvedFabricMasterId = fabricMasterIdCandidate != null ? String(fabricMasterIdCandidate) : fabricMasterIdFromLookup;
      if (beamRaw) summary.beams.add(beamRaw);
      if (flangeRaw) summary.flanges.add(flangeRaw);
      if (fabricLabel) summary.fabrics.add(fabricLabel);
      if (beamId != null) summary.beamIds.add(String(beamId));
      if (flangeId != null) summary.flangeIds.add(String(flangeId));
      if (resolvedFabricMasterId) summary.fabricMasterIds.add(resolvedFabricMasterId);
    };
    const addDetailToMap = (map: Map<string, BeamSummary>, key: string, detail: any) => {
      if (!key) return;
      let summary = map.get(key);
      if (!summary) {
        summary = createSummary();
        map.set(key, summary);
      }
      addDetailToSummary(summary, detail);
    };
    const valueMap = new Map<string, BeamSummary>();
    const labelMap = new Map<string, BeamSummary>();
    arr.forEach((record: any) => {
      const detailArray = Array.isArray(record?.beamGatingDetails)
        ? record.beamGatingDetails
        : Array.isArray(record?.beamDetails)
          ? record.beamDetails
          : [];
      const valueCandidates = new Set<string>();
      const pushValue = (value: any) => {
        const str = value != null ? String(value).trim() : "";
        if (str) valueCandidates.add(str);
      };
      pushValue(record?.loomId);
      pushValue(record?.loom?.loomId);
      pushValue(record?.loomNo);
      pushValue(record?.loom?.loomNo);
      pushValue(record?.loomNumber);
      pushValue(record?.loom?.loomNumber);
      pushValue(record?.loomName);
      pushValue(record?.loom?.name);
      const labelCandidates = new Set<string>();
      const pushLabel = (value: any) => {
        const normalized = normalizeText(value);
        if (normalized) labelCandidates.add(normalized);
      };
      pushLabel(record?.loomNo);
      pushLabel(record?.loom?.loomNo);
      pushLabel(record?.loomNumber);
      pushLabel(record?.loom?.loomNumber);
      pushLabel(record?.loomName);
      pushLabel(record?.loom?.name);
      detailArray.forEach((detail: any) => {
        valueCandidates.forEach((candidate) => addDetailToMap(valueMap, candidate, detail));
        labelCandidates.forEach((candidate) => addDetailToMap(labelMap, candidate, detail));
      });
    });
    return { byValue: valueMap, byLabel: labelMap };
  }, [beamGatingList, fabricMasterLookup]);

  const loomNoById = useMemo(() => {
    const arr = Array.isArray(loomList) ? loomList : Array.isArray(loomList?.data) ? loomList.data : [];
    const map = new Map<string, string>();
    arr.forEach((loom: any) => {
      const idValue = loom?.id ?? loom?.loomId ?? loom?.loom?.id;
      const label = loom?.loomNo || loom?.loomName || loom?.name || loom?.loomNumber || "";
      if (idValue != null && label) {
        map.set(String(idValue), normalizeIdentifier(label));
      }
    });
    return map;
  }, [loomList]);

  const beamValidationRecords = useMemo(() => {
    const arr = Array.isArray(beamGatingList)
      ? beamGatingList
      : Array.isArray((beamGatingList as any)?.data)
        ? (beamGatingList as any).data
        : [];
    const details: Array<{
      loom: string;
      beam: string;
      beamNumeric: string;
      isProductionCompleted?: boolean;
      isBeamCut?: boolean;
    }> = [];
    arr.forEach((record: any) => {
      const loomId = record?.loomId ?? record?.loom?.id ?? record?.loom?.loomId;
      const fallbackLoom =
        record?.loomNo ??
        record?.loom?.loomNo ??
        record?.loom?.name ??
        record?.loomName ??
        "";
      const normalizedFromId = loomId != null ? loomNoById.get(String(loomId)) : undefined;
      const loomKey = normalizedFromId || normalizeIdentifier(fallbackLoom);
      if (!loomKey) return;
      const detailArray = Array.isArray(record?.beamGatingDetails)
        ? record.beamGatingDetails
        : Array.isArray(record?.beamDetails)
          ? record.beamDetails
          : [];
      detailArray.forEach((detail: any) => {
        const beamNo = String(detail?.beamNo || detail?.sizedBeamNo || detail?.beamNumber || "").trim();
        if (!beamNo) return;
        const normalizedBeam = normalizeIdentifier(beamNo);
        if (!normalizedBeam) return;
        details.push({
          loom: loomKey,
          beam: normalizedBeam,
          beamNumeric: stripLeadingZeros(normalizedBeam),
          isProductionCompleted: (detail?.isProductionCompleted ?? detail?.isProductionComplete ?? 0) === 1,
          isBeamCut: (detail?.isBeamCut ?? 0) === 1,
        });
      });
    });
    return details;
  }, [beamGatingList, loomNoById]);

  const selectedLoomId = watch("loomId");
  const selectedLoomOption = loomOptions.find((option:any) => option.value === selectedLoomId);
  const selectedLoomKey = normalizeText(selectedLoomOption?.label);
  const derivedBeamSummary =
    (selectedLoomId ? beamSummaryMaps.byValue.get(selectedLoomId) : undefined) ??
    (selectedLoomKey ? beamSummaryMaps.byLabel.get(selectedLoomKey) : undefined);
  const derivedBeamDisplay = derivedBeamSummary ? Array.from(derivedBeamSummary.beams).join(", ") : "-";
  const derivedFlangeDisplay = derivedBeamSummary ? Array.from(derivedBeamSummary.flanges).join(", ") : "-";
  const derivedFabricDisplay = derivedBeamSummary ? Array.from(derivedBeamSummary.fabrics).join(", ") : "-";
  const joinSet = (set?: Set<string>) => {
    if (!set || set.size === 0) return undefined;
    return Array.from(set).join(", ");
  };
  const derivedBeamIdDisplay = joinSet(derivedBeamSummary?.beamIds);
  const derivedFlangeIdDisplay = joinSet(derivedBeamSummary?.flangeIds);
  const derivedFabricMasterIdDisplay = joinSet(derivedBeamSummary?.fabricMasterIds);
  const stringifyValue = (value: any) => (value != null ? String(value) : undefined);
  const recordBeamNo = isEditMode
    ? currentRecord?.beamNo ||
      currentRecord?.beam?.beamNo ||
      currentRecord?.beamNumber ||
      currentRecord?.sizedBeamNo ||
      ""
    : "";
  const recordFlangeNo = isEditMode
    ? currentRecord?.flangeNo ||
      currentRecord?.flange?.flangeNo ||
      currentRecord?.flangeNumber ||
      ""
    : "";
  const recordFabricLabel = isEditMode
    ? currentRecord?.fabricCodeQuality ||
      ([currentRecord?.fabricCode, currentRecord?.fabricQuality].filter(Boolean).join(" - ")) ||
      currentRecord?.fabricLabel ||
      ""
    : "";
  const recordBeamId = isEditMode
    ? stringifyValue(
        currentRecord?.beamId ??
          currentRecord?.beam?.id ??
          currentRecord?.beamDetailId ??
          currentRecord?.beam_detail_id,
      )
    : undefined;
  const recordFlangeId = isEditMode
    ? stringifyValue(
        currentRecord?.flangeId ??
          currentRecord?.flange?.id ??
          currentRecord?.flangeDetailId ??
          currentRecord?.flange_detail_id,
      )
    : undefined;
  const recordFabricMasterId = isEditMode
    ? stringifyValue(
        currentRecord?.fabricMasterId ??
          currentRecord?.fabricMaster?.id ??
          currentRecord?.fabricId ??
          currentRecord?.fabric_id ??
          currentRecord?.fabric_master_id,
      )
    : undefined;
  const beamDisplay = recordBeamNo || derivedBeamDisplay;
  const flangeDisplay = recordFlangeNo || derivedFlangeDisplay;
  const fabricDisplay = recordFabricLabel || derivedFabricDisplay;
  const beamIdDisplay = recordBeamId || derivedBeamIdDisplay;
  const flangeIdDisplay = recordFlangeId || derivedFlangeIdDisplay;
  const fabricMasterIdDisplay = recordFabricMasterId || derivedFabricMasterIdDisplay;
  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);
  const removeRow = (tempId: string) => {
    setRows((prev) => {
      const filtered = prev.filter((row) => row.tempId !== tempId);
      return filtered.length ? filtered : [createEmptyRow()];
    });
  };

  const updateRow = (tempId: string, field: keyof RowDetail, value: string) => {
    setRows((prev) => prev.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row)));
  };

  const totalPicks = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.productionPicks || 0), 0),
    [rows],
  );
  const totalMeters = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.productionMeters || 0), 0),
    [rows],
  );

  const onSubmit = async (values: FormValues) => {
    if (!values.loomId) {
      return;
    }
    const isoDate = values.weavingDate;
    const loomLabelForKey = selectedLoomOption?.label || selectedLoomId || "";
    const beamKeyCandidate = getPrimarySetValue(derivedBeamSummary?.beams) ?? (beamDisplay !== "-" ? beamDisplay : "");
    const normalizedLoomKey = normalizeIdentifier(selectedLoomOption?.label || selectedLoomId || "");
    const normalizedBeamKey = beamKeyCandidate ? normalizeIdentifier(beamKeyCandidate) : "";
    if (normalizedLoomKey && normalizedBeamKey) {
      const normalizedBeamNumericKey = stripLeadingZeros(normalizedBeamKey);
      const beamLabelForError =
        beamDisplay && beamDisplay !== "-" ? beamDisplay : beamKeyCandidate || normalizedBeamKey || "selected beam";
      const matchedBeams = beamValidationRecords.filter(
        (detail) =>
          detail.loom === normalizedLoomKey &&
          (matchesNormalizedValue(detail.beam, normalizedBeamKey) ||
            matchesNormalizedValue(detail.beamNumeric, normalizedBeamKey) ||
            (normalizedBeamNumericKey && matchesNormalizedValue(detail.beamNumeric, normalizedBeamNumericKey))),
      );
      if (!matchedBeams.length) {
        toast.error("Beam No is invalid for the selected Loom and Beam Gaiting data");
        return;
      }
      const completedMatch = matchedBeams.find((detail) => detail.isProductionCompleted);
      if (completedMatch) {
        toast.error(`Beam ${beamLabelForError} already production completed`);
        return;
      }
      const cutMatch = matchedBeams.find((detail) => detail.isBeamCut);
      if (cutMatch) {
        toast.error(`Beam ${beamLabelForError} already cutted`);
        return;
      }
    }
    const flangeKeyCandidate = getPrimarySetValue(derivedBeamSummary?.flanges) ?? (flangeDisplay !== "-" ? flangeDisplay : "");
    const entryKey = buildProductionLookupKey(isoDate, loomLabelForKey, beamKeyCandidate);
    if (entryKey && existingEntryKeys.has(entryKey)) {
      toast.error("Weaving production already exists for the selected date, loom, and beam.");
      return;
    }
    const existingShifts = entryKey ? existingShiftAllocations.get(entryKey) : undefined;
    const shiftSet = new Set<string>();
    for (const row of rows) {
      if (!row.shift) {
        toast.error("Each row must have a shift selected.");
        return;
      }
      const normalizedShift = normalizeText(row.shift);
      if (existingShifts?.has(normalizedShift)) {
        const loomLabelForError = selectedLoomOption?.label || selectedLoomId || "Selected Loom";
        const beamLabelForError = beamKeyCandidate || "Unknown Beam";
        const flangeLabelForError = flangeKeyCandidate || "Unknown Flange";
        toast.error(
          `Shift "${row.shift}" is already occupied for ${loomLabelForError} (Beam ${beamLabelForError}, Flange ${flangeLabelForError}) on ${isoDate}`,
        );
        return;
      }
      if (shiftSet.has(normalizedShift)) {
        toast.error("Shift cannot repeat for the same date.");
        return;
      }
      shiftSet.add(normalizedShift);
    }
    if (rows.length === 0) {
      toast.error("Please add at least one production detail.");
      return;
    }
 const isEditMode = Boolean(currentRecord?.id);
              let weavingProductionNo = values.weavingProductionNo || currentRecord?.weavingProductionNo || "";
                   if (!currentRecord?.id && !weavingProductionNo) {
                       try {
                           const docResponse = await documentNumberService.generateDocumentNumber({
                               screenName: "Weaving Production",
                           });
                           weavingProductionNo = docResponse.documentNumber;
                       } catch (error) {
                           console.warn("Failed to generate document number:", error);
                       }
                   }
       isSavingRef.current = true;

    const productionDetails = rows.map((row) => ({
      shift: row.shift,
      productionPicks: Number(Number(row.productionPicks || 0).toFixed(2)),
      productionMeters: Number(Number(row.productionMeters || 0).toFixed(2)),
    }));
    const payload = {
      weavingProductionNo: weavingProductionNo,
      weavingProductionDate: values.weavingDate,
      loomId: Number(values.loomId),
      loomNo: selectedLoomOption?.label || "",
      beamNo: beamDisplay !== "-" ? beamDisplay : "",
      beamId: beamIdDisplay,
      flangeNo: flangeDisplay !== "-" ? flangeDisplay : "",
      flangeId: flangeIdDisplay,
      fabricCodeQuality: fabricDisplay !== "-" ? fabricDisplay : "",
      fabricMasterId: fabricMasterIdDisplay,
      totalPicks: Number(totalPicks.toFixed(2)),
      totalMeters: Number(totalMeters.toFixed(2)),
      productionDetails,
      companyId: storedCompanyId,
    };

    try {
      if (isEditMode && params.id) {
        await dispatch(updateWeavingProduction({ id: Number(params.id), data: payload, companyId: storedCompanyId })).unwrap();
      } else {
        await dispatch(createWeavingProduction(payload)).unwrap();
          documentNumberService.clearMemoryCache("Weaving Production");
      }
     
      navigate("/transaction/weaving-production");
    } catch (error) {
      console.error(error);
    }
  };

    const handleCancel = () => {
    navigate("/transaction/weaving-production");
  };

  //  const pageTitle = isEditMode ? "Edit Weaving Production" : "Add Weaving Production";
  // const pageSubtitle = isEditMode
  //   ? "Update the selected Weaving Production details."
  //   : "Capture Weaving Production details with synchronized row controls.";
  // const submitLabel = isEditMode ? "Update" : "Save";
  // const recordReady = !isEditMode || (numericId != null && currentRecord && Number(currentRecord.id) === numericId);


  return (
    <div className="p-6 pt-16">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-10">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleCancel} className="mr-auto">
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Weaving Production</h1>
            {/* <p className="text-sm text-gray-500">{pageSubtitle}</p> */}
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
             <div>
  <label className="block text-sm font-medium mb-1">
    Weaving Production No<span className="text-red-600">*</span>
  </label>
  <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                {...register('weavingProductionNo')} readOnly />
</div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Weaving Production Date</label>
            <input
              type="date"
              {...register("weavingDate", { required: "Date is required" })}
              className="input mt-1 w-full"
            />
            {errors.weavingDate && <p className="mt-1 text-xs text-red-600">{errors.weavingDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Loom No <span className="text-red-600">*</span></label>
            <CommonSearchableSelect
              {...register("loomId", { required: "Loom No is required" })}
              options={loomOptions}
              placeholder="Select Loom"
              error={errors.loomId?.message}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Beam No</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Empty Beam No</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sort No / Construction</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-slate-600">{beamDisplay || "-"}</td>
                <td className="px-4 py-3 font-medium text-slate-600">{flangeDisplay || "-"}</td>
                <td className="px-4 py-3 font-medium text-slate-600">{fabricDisplay || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Production Rows</h3>
            <button
              type="button"
              onClick={addRow}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Add Row
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-slate-500">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">S.No</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Shift</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Production Picks</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Production Meters</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.tempId} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                    <td className="border-b border-slate-100 px-3 py-2 align-top text-slate-600">{index + 1}</td>
                    <td className="border-b border-slate-100 px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.shift}
                        onChange={(event) => updateRow(row.tempId, "shift", event.target.value)}
                        className="input w-full text-sm"
                      />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 align-top">
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={row.productionPicks}
                        onChange={(event) => updateRow(row.tempId, "productionPicks", sanitizeDecimalInput(event.target.value))}
                        className="input w-full text-sm"
                      />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 align-top">
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={row.productionMeters}
                        onChange={(event) => updateRow(row.tempId, "productionMeters", sanitizeDecimalInput(event.target.value))}
                        className="input w-full text-sm"
                      />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 align-top text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(row.tempId)}
                        className="inline-flex items-center justify-center rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
                        title="Remove row"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200  p-4  bg-white">
            <p className="text-sm text-slate-500">Total Picks</p>
            <p className="text-2xl font-semibold text-slate-900">{totalPicks.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200  bg-white p-4">
            <p className="text-sm text-slate-500">Total Meters</p>
            <p className="text-2xl font-semibold text-slate-900">{totalMeters.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/transaction/weaving-production")}
            className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            {isEditMode ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
