import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppDispatch, RootState } from "@/state/store";
import {
  createWeavingProduction,
  deleteWeavingProduction,
  getAllWeavingProductions,
  importWeavingProductionTemplate,
} from "@/state/weavingProductionSlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllBeamGaitings } from "@/state/beamGaitingSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllFlanges } from "@/state/flangeSlice";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate, generateExcelTemplate, readExcelFile } from "@/lib/utils";
import { documentNumberService } from "@/services/DocumentNumberService";

const TEMPLATE_HEADERS = [
  "Date",
  "Loom No",
  "Beam No",
  "Empty Beam No",
  "Shift",
  "Production Picks",
  "Production Meters",
  "Sort No - Construction",
];

const EXCEL_ALLOWED_EXTENSIONS = [".xls", ".xlsx"];
const DOCUMENT_SCREEN_NAME = "Weaving Production";

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const getRowValue = (row: Record<string, any>, label: string) => {
  const target = normalizeKey(label);
  const matchKey = Object.keys(row).find((key) => normalizeKey(key) === target);
  return matchKey ? row[matchKey] : undefined;
};

const stripLeadingZeros = (value?: string) => {
  if (!value) return "";
  const stripped = value.replace(/^0+/, "");
  return stripped || "0";
};

const normalizeIdentifier = (value?: string | number) => {
  if (value == null) return "";
  const raw = typeof value === "string" ? value.trim() : String(value);
  if (!raw) return "";
  const numericMatch = raw.match(/^(\d+)(?:\.0+)?$/);
  const normalizedValue = numericMatch ? numericMatch[1] : raw;
  return normalizeKey(normalizedValue);
};
const normalizeText = (value?: string) => (value ?? "").toString().trim().toLowerCase();
const matchesNormalizedValue = (source: string, target: string) => {
  if (!source || !target) return false;
  if (source === target) return true;
  if (source.endsWith(target)) return true;
  if (target.endsWith(source)) return true;
  return false;
};
const parseDateToIso = (value: any): string | null => {
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

const formatToTwoDecimals = (value: number) => {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
};

const splitFabricCodeQuality = (input?: string) => {
  const value = (input ?? "").toString().trim();
  if (!value) return { code: "", quality: "" };
  const hyphenMatch = value.match(/^(.+?)\s*-\s*(.+)$/);
  if (hyphenMatch) {
    return { code: hyphenMatch[1].trim(), quality: hyphenMatch[2].trim() };
  }
  const colonMatch = value.match(/^(.+?)\s*:\s*(.+)$/);
  if (colonMatch) {
    return { code: colonMatch[1].trim(), quality: colonMatch[2].trim() };
  }
  return { code: value, quality: "" };
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

const buildShiftLookupKey = (
  date?: string | null,
  loomValue?: string | number,
  shiftValue?: string,
): string | undefined => {
  const normalizedDate = typeof date === "string" ? date.trim() : "";
  const normalizedLoom = loomValue != null ? normalizeIdentifier(String(loomValue)) : "";
  const normalizedShift = shiftValue ? normalizeText(shiftValue) : "";
  const parts = [normalizedDate, normalizedLoom, normalizedShift].filter(Boolean);
  return parts.length ? parts.join("|") : undefined;
};

export function WeavingProduction() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { weavingProductionList, pagination, loading } = useSelector((state: RootState) => (state as any).weavingProduction || {});
  const { loomList } = useSelector((state: RootState) => (state as any).loomMaster || {});
  const { list: beamGatingList } = useSelector((state: RootState) => (state as any).beamGaiting || {});
  const { fabricMasterList } = useSelector((state: RootState) => (state as any).fabricMaster || {});
  const { flangeList } = useSelector((state: RootState) => (state as any).flange || {});
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const storedCompanyId = useResolvedCompanyId();

  const generateDocumentNumberForImport = useCallback(async (): Promise<string> => {
    try {
      const result = await documentNumberService.generateDocumentNumber({
        screenName: DOCUMENT_SCREEN_NAME,
        companyId: storedCompanyId,
      });
      const generatedNumber = result?.documentNumber;
      if (!generatedNumber) {
        throw new Error("Document number generation returned an empty value");
      }
      return generatedNumber;
    } catch (error) {
      const message = "Failed to generate weaving production document number";
      toast.error(message);
      console.error(error);
      throw error;
    }
  }, [storedCompanyId]);

  const { currentPage, itemsPerPage, handlePageChange, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });

  const fetchList = () => {
    const params: any = {
      // limit: itemsPerPage,
      // offset: getOffset(),
      fetchAll: true,
    };
    if (storedCompanyId != null) {
      params.companyId = storedCompanyId;
    }
    dispatch(getAllWeavingProductions(params));
  };

  useEffect(() => {
    fetchList();
  }, [dispatch, storedCompanyId]);

  useEffect(() => {
    const baseParams: any = {};
    if (storedCompanyId != null) {
      baseParams.companyId = storedCompanyId;
    }
    dispatch(getAllLooms(baseParams));
    dispatch(getAllBeamGaitings(baseParams));
    dispatch(getAllFabricMasters({fetchAll: true}));
    if (storedCompanyId != null) {
      dispatch(getAllFlanges({ companyId: storedCompanyId }));
    }
  }, [dispatch, storedCompanyId]);

  const normalizedWeavingList = useMemo(() => {
    if (Array.isArray(weavingProductionList)) return weavingProductionList;
    if (Array.isArray(weavingProductionList?.data)) return weavingProductionList.data;
    return [];
  }, [weavingProductionList]);

  const loomSet = useMemo(() => {
    const arr = Array.isArray(loomList) ? loomList : Array.isArray(loomList?.data) ? loomList.data : [];
    const set = new Set<string>();
    arr.forEach((loom: any) => {
      const label = loom?.loomNo || loom?.loomName || loom?.name || loom?.loomNumber || "";
      if (label) set.add(normalizeIdentifier(label));
      const fallbackId = loom?.id ?? loom?.loomId ?? loom?.loom?.id;
      if (fallbackId != null) set.add(normalizeIdentifier(String(fallbackId)));
    });
    return set;
  }, [loomList]);

  const loomLookup = useMemo(() => {
    const arr = Array.isArray(loomList) ? loomList : Array.isArray(loomList?.data) ? loomList.data : [];
    const map = new Map<string, { id?: number; label: string }>();
    arr.forEach((loom: any) => {
      const idValue = loom?.id ?? loom?.loomId ?? loom?.loom?.id;
      const labelCandidate =
        loom?.loomNo || loom?.loomName || loom?.name || loom?.loomNumber || (idValue != null ? String(idValue) : "");
      const numericId = Number(idValue);
      const entry = { id: Number.isFinite(numericId) ? numericId : undefined, label: labelCandidate || "" };
      const addKey = (value?: string | number) => {
        if (value == null) return;
        const normalized = normalizeIdentifier(String(value));
        if (normalized) {
          map.set(normalized, entry);
        }
      };
      addKey(labelCandidate);
      addKey(loom?.loomNo);
      addKey(loom?.loomName);
      addKey(loom?.name);
      addKey(loom?.loomNumber);
      addKey(idValue);
    });
    return map;
  }, [loomList]);

  const loomNoById = useMemo(() => {
    const arr = Array.isArray(loomList) ? loomList : Array.isArray(loomList?.data) ? loomList.data : [];
    const map = new Map<string, string>();
    arr.forEach((loom: any) => {
      const id = loom?.id ?? loom?.loomId ?? loom?.loom?.id;
      const label = loom?.loomNo || loom?.loomName || loom?.name || loom?.loomNumber || "";
      if (id != null && label) {
        map.set(String(id), normalizeIdentifier(label));
      }
    });
    return map;
  }, [loomList]);

  const flangeNoById = useMemo(() => {
    const arr = Array.isArray(flangeList) ? flangeList : Array.isArray(flangeList?.data) ? flangeList.data : [];
    const map = new Map<string, string>();
    arr.forEach((flange: any) => {
      const label = flange?.flangeNo || flange?.flange_no || flange?.no || "";
      if (!label) return;
      const keyCandidates = Array.from(new Set([flange?.id, flange?.flangeId, flange?.flange_id]));
      keyCandidates.forEach((key) => {
        if (key != null && key !== "") {
          map.set(String(key), label);
        }
      });
    });
    return map;
  }, [flangeList]);

  const fabricSet = useMemo(() => {
    const arr = Array.isArray(fabricMasterList)
      ? fabricMasterList
      : Array.isArray(fabricMasterList?.data)
        ? fabricMasterList.data
        : [];
    const set = new Set<string>();
    arr.forEach((fabric: any) => {
      const code = normalizeText(fabric?.fabricCode || fabric?.code || fabric?.fabric || "");
      const quality = normalizeText(fabric?.fabricQuality || fabric?.quality || fabric?.grade || "");
      if (code || quality) {
        set.add(`${code}||${quality}`);
      }
    });
    return set;
  }, [fabricMasterList]);

  const fabricMasterLookup = useMemo(() => {
    const arr = Array.isArray(fabricMasterList)
      ? fabricMasterList
      : Array.isArray(fabricMasterList?.data)
        ? fabricMasterList.data
        : [];
    const map = new Map<string, string>();
    arr.forEach((fabric: any) => {
      const idCandidate =
        fabric?.id ??
        fabric?.fabricMasterId ??
        fabric?.fabric_master_id ??
        fabric?.fabricId ??
        fabric?.fabric_id;
      if (idCandidate == null) return;
      const idValue = String(idCandidate);
      const addKey = (value?: string | number) => {
        if (value == null) return;
        const normalized = normalizeIdentifier(String(value));
        if (normalized && !map.has(normalized)) {
          map.set(normalized, idValue);
        }
      };
      addKey(fabric?.fabricCode);
      addKey(fabric?.fabricCodeQuality);
      addKey(fabric?.fabricQuality);
      addKey(fabric?.quality);
      addKey(fabric?.grade);
      addKey([fabric?.fabricCode, fabric?.fabricQuality].filter(Boolean).join(" - "));
      addKey([fabric?.fabricCode, fabric?.fabricQuality].filter(Boolean).join("-"));
    });
    return map;
  }, [fabricMasterList]);

  const beamValidationRecords = useMemo(() => {
    const arr = Array.isArray(beamGatingList)
      ? beamGatingList
      : Array.isArray((beamGatingList as any)?.data)
        ? (beamGatingList as any).data
        : [];
    const details: Array<{
      loom: string;
      beam: string;
      flange: string;
      beamNumeric: string;
      flangeNumeric: string;
      fabricKey: string;
      beamId?: string;
      flangeId?: string;
      fabricMasterId?: string;
      fabricCode?: string;
      fabricQuality?: string;
      isProductionCompleted?: number | boolean;
      isBeamCut?: number | boolean;
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
      const detailArray = Array.isArray(record?.beamGatingDetails)
        ? record.beamGatingDetails
        : Array.isArray(record?.beamDetails)
          ? record.beamDetails
          : [];
      detailArray.forEach((detail: any) => {
        const beamNo = String(detail?.beamNo || detail?.sizedBeamNo || detail?.beamNumber || "").trim();
        const flangeNo = String(detail?.flangeNo || detail?.flangeNumber || "").trim();
        const detailFabric = splitFabricCodeQuality(detail?.fabricCodeQuality?.toString());
        const fabricKey = `${normalizeIdentifier(detailFabric.code)}||${normalizeIdentifier(detailFabric.quality)}`;
        if (beamNo && flangeNo) {
          const normalizedBeam = normalizeIdentifier(beamNo);
          const normalizedFlange = normalizeIdentifier(flangeNo);
          const beamNumeric = stripLeadingZeros(normalizedBeam);
          const flangeNumeric = stripLeadingZeros(normalizedFlange);
          const beamIdCandidate = detail?.beamId ?? detail?.id ?? detail?.beamDetailId ?? detail?.beam_detail_id;
          const flangeIdCandidate =
            detail?.flangeId ?? detail?.flange?.id ?? detail?.flange_id ?? detail?.flangeDetailId ?? detail?.flange_detail_id;
          const fabricMasterIdCandidate =
            detail?.fabricMasterId ??
            detail?.fabricMaster?.id ??
            detail?.fabricId ??
            detail?.fabric_id ??
            detail?.fabric_master_id;
          // src/pages/transaction/weaving-production.tsx:386
          details.push({
            loom: loomKey,
            beam: normalizedBeam,
            flange: normalizedFlange,
            beamNumeric,
            flangeNumeric,
            fabricKey,
            beamId: beamIdCandidate != null ? String(beamIdCandidate) : undefined,
            flangeId: flangeIdCandidate != null ? String(flangeIdCandidate) : undefined,
            fabricMasterId: fabricMasterIdCandidate != null ? String(fabricMasterIdCandidate) : undefined,
            fabricCode: detailFabric.code,
            fabricQuality: detailFabric.quality,
            // Separate the two flags
            isProductionCompleted: (detail?.isProductionCompleted ?? detail?.isProductionComplete ?? 0) === 1,
            isBeamCut: (detail?.isBeamCut ?? 0) === 1,
          });

          //       details.push({
          //         loom: loomKey,
          //         beam: normalizedBeam,
          //         flange: normalizedFlange,
          //         beamNumeric,
          //         flangeNumeric,
          //         fabricKey,
          //         beamId: beamIdCandidate != null ? String(beamIdCandidate) : undefined,
          //         flangeId: flangeIdCandidate != null ? String(flangeIdCandidate) : undefined,
          //         fabricMasterId: fabricMasterIdCandidate != null ? String(fabricMasterIdCandidate) : undefined,
          //         fabricCode: detailFabric.code,
          //         fabricQuality: detailFabric.quality,
          //         isProductionCompleted: 
          // (detail?.isProductionCompleted ?? detail?.isProductionComplete ?? 0) === 1 || 
          // (detail?.isBeamCut ?? 0) === 1 ? 1 : 0, 
          //       });
        }
      });
    });
    return details;
  }, [beamGatingList]);

  const existingShiftAllocations = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const entries = Array.isArray(normalizedWeavingList) ? normalizedWeavingList : [];
    entries.forEach((record: any) => {
      const isoDate = parseDateToIso(
        record?.weavingProductionDate ?? record?.weavingDate ?? record?.date ?? record?.createdAt,
      );
      if (!isoDate) return;
      const loomValue =
        record?.loomNo ||
        record?.loom?.loomNo ||
        record?.loom?.name ||
        record?.loom?.loomNumber ||
        (record?.loomId != null ? String(record.loomId) : "");
      const beamValue =
        record?.beamNo ||
        record?.beam?.beamNo ||
        record?.beamNumber ||
        record?.sizedBeamNo ||
        "";
      const details = Array.isArray(record?.productionDetails)
        ? record.productionDetails
        : Array.isArray(record?.weavingProductionDetails)
          ? record.weavingProductionDetails
          : [];
      const mapKey = buildProductionLookupKey(isoDate, loomValue, beamValue);
      if (!mapKey) return;
      details.forEach((detail: any) => {
        const shiftValue = detail?.shift || detail?.shiftName || detail?.shiftLabel || "";
        const normalizedShift = normalizeText(shiftValue);
        if (!normalizedShift) return;
        const existingSet = map.get(mapKey) || new Set<string>();
        existingSet.add(normalizedShift);
        map.set(mapKey, existingSet);
      });
    });
    return map;
  }, [normalizedWeavingList]);

  const existingLoomShiftKeys = useMemo(() => {
    const set = new Set<string>();
    const entries = Array.isArray(normalizedWeavingList) ? normalizedWeavingList : [];
    entries.forEach((record: any) => {
      const isoDate = parseDateToIso(
        record?.weavingProductionDate ?? record?.weavingDate ?? record?.date ?? record?.createdAt,
      );
      if (!isoDate) return;
      const loomValue =
        record?.loomNo ||
        record?.loom?.loomNo ||
        record?.loom?.name ||
        record?.loom?.loomNumber ||
        (record?.loomId != null ? String(record.loomId) : "");
      const details = Array.isArray(record?.productionDetails)
        ? record.productionDetails
        : Array.isArray(record?.weavingProductionDetails)
          ? record.weavingProductionDetails
          : [];
      details.forEach((detail: any) => {
        const shiftValue = detail?.shift || detail?.shiftName || detail?.shiftLabel || "";
        const shiftKey = buildShiftLookupKey(isoDate, loomValue, shiftValue);
        if (shiftKey) {
          set.add(shiftKey);
        }
      });
    });
    return set;
  }, [normalizedWeavingList]);

  const existingEntryKeys = useMemo(() => {
    const set = new Set<string>();
    const entries = Array.isArray(normalizedWeavingList) ? normalizedWeavingList : [];
    entries.forEach((record: any) => {
      const isoDate = parseDateToIso(
        record?.weavingProductionDate ?? record?.weavingDate ?? record?.date ?? record?.createdAt,
      );
      if (!isoDate) return;
      const loomValue =
        record?.loomNo ||
        record?.loom?.loomNo ||
        record?.loom?.name ||
        record?.loom?.loomNumber ||
        (record?.loomId != null ? String(record.loomId) : "");
      const beamValue =
        record?.beamNo ||
        record?.beam?.beamNo ||
        record?.beamNumber ||
        record?.sizedBeamNo ||
        "";
      const entryKey = buildProductionLookupKey(isoDate, loomValue, beamValue);
      if (entryKey) {
        set.add(entryKey);
      }
    });
    return set;
  }, [normalizedWeavingList]);

  const existingLoomDateKeys = useMemo(() => {
    const set = new Set<string>();
    const entries = Array.isArray(normalizedWeavingList) ? normalizedWeavingList : [];
    entries.forEach((record: any) => {
      const isoDate = parseDateToIso(
        record?.weavingProductionDate ?? record?.weavingDate ?? record?.date ?? record?.createdAt,
      );
      if (!isoDate) return;
      const loomValue =
        record?.loomNo ||
        record?.loom?.loomNo ||
        record?.loom?.name ||
        record?.loom?.loomNumber ||
        (record?.loomId != null ? String(record.loomId) : "");
      const loomKey = normalizeIdentifier(loomValue);
      if (!loomKey) return;
      const beamValue =
        record?.beamNo ||
        record?.beam?.beamNo ||
        record?.beamNumber ||
        record?.sizedBeamNo ||
        "";
      const beamKey = normalizeIdentifier(beamValue);
      if (!beamKey) return;
      const key = [isoDate, loomKey, beamKey].filter(Boolean).join("|");
      if (key) {
        set.add(key);
      }
    });
    return set;
  }, [normalizedWeavingList]);

  const existingBeamDateKeys = useMemo(() => {
    const set = new Set<string>();
    const entries = Array.isArray(normalizedWeavingList) ? normalizedWeavingList : [];
    entries.forEach((record: any) => {
      const isoDate = parseDateToIso(
        record?.weavingProductionDate ?? record?.weavingDate ?? record?.date ?? record?.createdAt,
      );
      if (!isoDate) return;
      const beamValue =
        record?.beamNo ||
        record?.beam?.beamNo ||
        record?.beamNumber ||
        record?.sizedBeamNo ||
        "";
      const beamKey = normalizeIdentifier(beamValue);
      if (!beamKey) return;
      const key = [isoDate, beamKey].filter(Boolean).join("|");
      if (key) {
        set.add(key);
      }
    });
    return set;
  }, [normalizedWeavingList]);

  const tableData = useMemo(() => {
    const baseSerial = pagination?.offset || 0;
    return normalizedWeavingList.map((record: any, index: number) => {
      const details = Array.isArray(record?.productionDetails)
        ? record.productionDetails
        : Array.isArray(record?.weavingProductionDetails)
          ? record.weavingProductionDetails
          : [];
      const safeDetails = Array.isArray(details) ? details : [];
      const beamNos = safeDetails
        .map((detail) => detail?.beamNo || detail?.beamNumber || detail?.sizedBeamNo)
        .filter(Boolean);
      const flangeNos = safeDetails
        .map((detail) => detail?.flangeNo || detail?.flangeNumber)
        .filter(Boolean);
      const fallbackBeamNo =
        record?.beamNo || record?.beam?.beamNo || record?.beamNumber || record?.sizedBeamNo || "";
      const flangeIdCandidate =
        record?.flangeId ?? record?.flange?.id ?? record?.flange?.flangeId ?? record?.flange?.flange_id;
      const mappedFlangeNo =
        flangeIdCandidate != null ? flangeNoById.get(String(flangeIdCandidate)) : undefined;
      const fallbackFlangeNo =
        mappedFlangeNo || record?.flangeNo || record?.flange?.flangeNo || record?.flangeNumber || "";
      const picksFromSummary = safeDetails.reduce(
        (sum, detail) => sum + Number(detail?.productionPicks ?? detail?.picks ?? detail?.totalPicks ?? 0),
        0,
      );
      const metersFromSummary = safeDetails.reduce(
        (sum, detail) => sum + Number(detail?.productionMeters ?? detail?.meters ?? detail?.totalMeters ?? 0),
        0,
      );
      const totalPicksValue = record?.totalPicks ?? record?.summary?.totalPicks ?? picksFromSummary;
      const totalMetersValue = record?.totalMeters ?? record?.summary?.totalMeters ?? metersFromSummary;
      const loomNo = record?.loomNo || record?.loom?.loomNo || record?.loom?.name || "";
      const weavingDate = record?.weavingProductionDate || record?.weavingDate || record?.date || record?.createdAt;
      const docNumber = record?.weavingProductionNo || record?.documentNo || "-";
      return {
        ...record,
        serialNo: baseSerial + index + 1,
        weavingProductionNo: docNumber,
        weavingDate: weavingDate || "",
        loomNo: loomNo || "-",
        beamNo: beamNos.length ? Array.from(new Set(beamNos)).join(", ") : fallbackBeamNo || "-",
        flangeNo: flangeNos.length ? Array.from(new Set(flangeNos)).join(", ") : fallbackFlangeNo || "-",
        totalPicks: formatToTwoDecimals(Number(totalPicksValue ?? 0)),
        totalMeters: formatToTwoDecimals(Number(totalMetersValue ?? 0)),
      };
    });
  }, [normalizedWeavingList, pagination?.offset]);

  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: "serialNo", width: 60, disableFilters: true },
      {
        Header: "Weaving Date",
        accessor: "weavingDate",
        Cell: ({ value }: { value: string }) => (value ? formatDate(value) : "-"),
        Filter: DateRangeFilter,
      },
            { Header: "Weaving Production No", accessor: "weavingProductionNo" },

      { Header: "Loom No", accessor: "loomNo" },
      { Header: "Beam No", accessor: "beamNo" },
      { Header: "Empty Beam No", accessor: "flangeNo" },
      { Header: "Total Picks", accessor: "totalPicks" },
      { Header: "Total Meters", accessor: "totalMeters" },
    ],
    [],
  );

  const handleAdd = () => navigate("/transaction/weaving-production-form");
  const handleEdit = (row: any) => {
    if (!row?.id) return;
    navigate(`/transaction/weaving-production-form/${row.id}`);
  };
  const handleDelete = async (row: any) => {
    if (!row?.id) return;
    const confirmation = window.confirm("Are you sure you want to delete this record?");
    if (!confirmation) return;
    try {
      await dispatch(deleteWeavingProduction({ id: row.id, companyId: storedCompanyId })).unwrap();
      fetchList();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadTemplate = () => {
    generateExcelTemplate({
      headers: TEMPLATE_HEADERS,
      fileName: "weaving-production-template",
      textColumns: ["Loom No", "Beam No", "Empty Beam No"],
    });
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  type WeavingProductionImportPayload = {
    weavingProductionDate: string;
    loomId?: number;
    loomNo: string;
    beamNo: string;
    beamId?: string;
    flangeNo: string;
    flangeId?: string;
    fabricCodeQuality: string;
    fabricMasterId?: string;
    totalPicks: number;
    totalMeters: number;
    productionDetails: {
      shift: string;
      productionPicks: number;
      productionMeters: number;
    }[];
    companyId?: number;
    weavingProductionNo?: string;
    documentNo?: string;
  };

  const importRows = async (rows: Record<string, any>[]) => {
    if (!rows.length) {
      toast.error("No data found in the uploaded file");
      return;
    }
    const errors: string[] = [];
    const normalizedRows: Array<{
      date: string;
      loomKey: string;
      loomId?: number;
      loomNo: string;
      beamNo: string;
      flangeNo: string;
      shift: string;
      productionPicks: number;
      productionMeters: number;
      fabricCode: string;
      fabricQuality: string;
      fabricLabel: string;
      fabricKey: string;
      beamId?: string;
      flangeId?: string;
      fabricMasterId?: string;
    }> = [];
    const shiftTracker = new Map<string, Set<string>>();
    const importEntryKeys = new Set<string>();
    const importLoomDateKeys = new Set<string>();
    const importBeamDateKeys = new Set<string>();
    const importLoomShiftKeys = new Set<string>();

    rows.forEach((row, idx) => {
      const rowNumber = idx + 2;
      const pushError = (message: string) => {
        errors.push(`Row ${rowNumber}: ${message}`);
      };
      const isoDate = parseDateToIso(getRowValue(row, "Date"));
      if (!isoDate) {
        pushError("Date is required and must be valid");
        return;
      }
      const loomValue = getRowValue(row, "Loom No");
      const loomKey = normalizeIdentifier(loomValue?.toString());
      if (!loomKey || !loomSet.has(loomKey)) {
        pushError("Loom No must match an entry from Loom Master");
        return;
      }
      const beamValueRaw = (getRowValue(row, "Beam No") ?? "").toString().trim();
      const beamKey = normalizeIdentifier(beamValueRaw);
      const beamNumericKey = stripLeadingZeros(beamKey);
      const loomLabelForError = loomValue?.toString().trim() || "Unknown Loom";
      const beamLabelForError = beamValueRaw || "Unknown Beam";
      if (!beamKey) {
        pushError("Beam No is invalid for the selected Loom and Beam Gaiting data");
        return;
      }
      const loomDateKey = [isoDate, loomKey, beamKey].filter(Boolean).join("|");
      if (loomDateKey) {
        if (importLoomDateKeys.has(loomDateKey)) {
          pushError(`Duplicate Loom entry detected for ${loomLabelForError} (Beam ${beamLabelForError}) on ${isoDate} in the uploaded file`);
          return;
        }
        if (existingLoomDateKeys.has(loomDateKey)) {
          pushError(`Production entry already exists for ${loomLabelForError} (Beam ${beamLabelForError}) on ${isoDate}`);
          return;
        }
        importLoomDateKeys.add(loomDateKey);
      }
      const beamDateKey = [isoDate, beamKey].filter(Boolean).join("|");
      if (beamDateKey) {
        if (importBeamDateKeys.has(beamDateKey)) {
          pushError(`Duplicate Beam entry detected for Beam ${beamLabelForError} on ${isoDate} in the uploaded file`);
          return;
        }
        if (existingBeamDateKeys.has(beamDateKey)) {
          pushError(`Production entry already exists for Beam ${beamLabelForError} on ${isoDate}`);
          return;
        }
        importBeamDateKeys.add(beamDateKey);
      }
      const entryKey = [isoDate, loomKey, beamKey].filter(Boolean).join("|");
      if (entryKey) {
        if (importEntryKeys.has(entryKey)) {
          pushError(
            `Duplicate production entry detected for ${loomLabelForError} (Beam ${beamLabelForError}) on ${isoDate} in the uploaded file`,
          );
          return;
        }
        if (existingEntryKeys.has(entryKey)) {
          pushError(`Production entry already exists for ${loomLabelForError} (Beam ${beamLabelForError}) on ${isoDate}`);
          return;
        }
        importEntryKeys.add(entryKey);
      }
      const matchedBeams = beamValidationRecords.filter(
        (detail) =>
          detail.loom === loomKey &&
          (matchesNormalizedValue(detail.beam, beamKey) ||
            matchesNormalizedValue(detail.beamNumeric, beamKey) ||
            matchesNormalizedValue(detail.beam, beamNumericKey) ||
            matchesNormalizedValue(detail.beamNumeric, beamNumericKey)),
      );
      if (!matchedBeams.length) {
        pushError("Beam No is invalid for the selected Loom and Beam Gating data");
        return;
      }

      const completedMatch = matchedBeams.find((d) => d.isProductionCompleted);
      if (completedMatch) {
        pushError(`Beam ${beamLabelForError} already production completed`);
        return;
      }

      const cutMatch = matchedBeams.find((d) => d.isBeamCut);
      if (cutMatch) {
        pushError(`Beam ${beamLabelForError} already cutted`);
        return;
      }

      // const completedBeamMatch = matchedBeams.find(
      //   (detail) => detail.isProductionCompleted === 1 || detail.isProductionCompleted === true,
      // );
      // if (completedBeamMatch) {
      //   pushError(`Beam ${beamLabelForError} already production completed`);
      //   return;
      // }
      const flangeValueRaw = (getRowValue(row, "Empty Beam No") ?? "").toString().trim();
      const flangeKey = normalizeIdentifier(flangeValueRaw);
      const flangeNumericKey = stripLeadingZeros(flangeKey);
      const flapMatch = matchedBeams.some(
        (detail) =>
          matchesNormalizedValue(detail.flange, flangeKey) ||
          matchesNormalizedValue(detail.flangeNumeric, flangeKey) ||
          matchesNormalizedValue(detail.flange, flangeNumericKey) ||
          matchesNormalizedValue(detail.flangeNumeric, flangeNumericKey),
      );
      if (!flangeKey || !flapMatch) {
        pushError("Empty Beam No is invalid for the chosen Beam in Beam Gating");
        return;
      }
      const shiftValueRaw = (getRowValue(row, "Shift") ?? "").toString().trim();
      const shiftKey = shiftValueRaw ? normalizeText(shiftValueRaw) : "";
      if (!shiftKey) {
        pushError("Shift is required");
        return;
      }
      const shiftLoomKey = buildShiftLookupKey(isoDate, loomKey, shiftValueRaw);
      if (shiftLoomKey) {
        if (importLoomShiftKeys.has(shiftLoomKey)) {
          pushError(`Shift "${shiftValueRaw}" is already occupied for ${loomLabelForError} on ${isoDate} in the uploaded file`);
          return;
        }
        if (existingLoomShiftKeys.has(shiftLoomKey)) {
          pushError(`Shift "${shiftValueRaw}" already exists for ${loomLabelForError} on ${isoDate}`);
          return;
        }
        importLoomShiftKeys.add(shiftLoomKey);
      }
      const productionLookupKey = buildProductionLookupKey(isoDate, loomKey, beamKey);
      const existingShifts = productionLookupKey ? existingShiftAllocations.get(productionLookupKey) : undefined;
      if (existingShifts?.has(shiftKey)) {
        pushError(`Shift "${shiftValueRaw}" is already occupied for ${loomLabelForError} (Beam ${beamLabelForError}) on ${isoDate}`);
        return;
      }
      if (productionLookupKey) {
        const shiftSet = shiftTracker.get(productionLookupKey) || new Set<string>();
        if (shiftSet.has(shiftKey)) {
          pushError(`Shift "${shiftValueRaw}" is already occupied for ${loomLabelForError} (Beam ${beamLabelForError}) on ${isoDate}`);
          return;
        }
        shiftSet.add(shiftKey);
        shiftTracker.set(productionLookupKey, shiftSet);
      }
      const picksValue = Number(getRowValue(row, "Production Picks"));
      const metersValue = Number(getRowValue(row, "Production Meters"));
      if (!Number.isFinite(picksValue)) {
        pushError("Production Picks must be numeric");
        return;
      }
      if (!Number.isFinite(metersValue)) {
        pushError("Production Meters must be numeric");
        return;
      }
      const fabricValue = getRowValue(row, "Sort No - Construction");
      const rawFabricValue = (fabricValue ?? "").toString().trim();
      const fabricLabelForError = rawFabricValue || "blank";
      const fabricParts = splitFabricCodeQuality(rawFabricValue);
      const fabricCodeKey = normalizeIdentifier(fabricParts.code);
      const fabricQualityKey = normalizeIdentifier(fabricParts.quality);
      const fabricKey = `${fabricCodeKey}||${fabricQualityKey}`;
      const matchedDetail =
        matchedBeams.find((detail) =>
          matchesNormalizedValue(detail.flange, flangeKey) ||
          matchesNormalizedValue(detail.flangeNumeric, flangeKey) ||
          matchesNormalizedValue(detail.flange, flangeNumericKey) ||
          matchesNormalizedValue(detail.flangeNumeric, flangeNumericKey)
        ) || matchedBeams[0];
      const loomEntry = loomLookup.get(loomKey);
      let resolvedLoomId = loomEntry?.id;
      if (resolvedLoomId == null) {
        const parsedLoomId = Number(loomValue);
        if (Number.isFinite(parsedLoomId)) {
          resolvedLoomId = parsedLoomId;
        }
      }
      const resolvedLoomNo = loomEntry?.label || (loomValue ?? "").toString().trim();
      const fabricLookupCandidates = [
        normalizeIdentifier(rawFabricValue),
        normalizeIdentifier(`${fabricParts.code} - ${fabricParts.quality}`),
        normalizeIdentifier(`${fabricParts.code}-${fabricParts.quality}`),
        normalizeIdentifier(fabricParts.code),
        normalizeIdentifier(fabricParts.quality),
      ];
      const fabricMasterIdFromLookup = fabricLookupCandidates.reduce<string | undefined>((found, key) => {
        if (found) return found;
        if (!key) return undefined;
        return fabricMasterLookup.get(key);
      }, undefined);
      if (rawFabricValue && !fabricMasterIdFromLookup) {
        pushError(`"${rawFabricValue}" not present in fabric master`);
        return;
      }
      const normalizedRow = {
        date: isoDate,
        loomKey,
        loomId: resolvedLoomId,
        loomNo: resolvedLoomNo,
        beamNo: beamValueRaw,
        flangeNo: flangeValueRaw,
        shift: shiftValueRaw,
        productionPicks: Number(picksValue.toFixed(2)),
        productionMeters: Number(metersValue.toFixed(2)),
        fabricCode: fabricParts.code,
        fabricQuality: fabricParts.quality,
        fabricLabel: rawFabricValue || `${fabricParts.code} - ${fabricParts.quality}`,
        fabricKey,
        beamId: matchedDetail?.beamId,
        flangeId: matchedDetail?.flangeId,
        fabricMasterId: matchedDetail?.fabricMasterId || fabricMasterIdFromLookup,
      };
      normalizedRows.push(normalizedRow);
    });

    if (errors.length) {
      toast.error(errors.join("\n"));
      return;
    }

    if (!normalizedRows.length) {
      toast.error("No valid rows to import");
      return;
    }

    const groupedRecords = new Map<
      string,
      {
        date: string;
        loomId?: number;
        loomNo: string;
        beamNo: string;
        flangeNo: string;
        fabricCode: string;
        fabricQuality: string;
        fabricLabel: string;
        beamId?: string;
        flangeId?: string;
        fabricMasterId?: string;
        rows: { shift: string; productionPicks: number; productionMeters: number }[];
        totalPicks: number;
        totalMeters: number;
      }
    >();

    normalizedRows.forEach((record) => {
      const keySegments = [
        record.date,
        record.loomId != null ? String(record.loomId) : normalizeIdentifier(record.loomNo),
        normalizeIdentifier(record.beamNo),
        normalizeIdentifier(record.flangeNo),
        normalizeIdentifier(record.fabricCode),
        normalizeIdentifier(record.fabricQuality),
      ].filter(Boolean);
      const groupKey = keySegments.join("|");
      const shiftDetail = {
        shift: record.shift,
        productionPicks: record.productionPicks,
        productionMeters: record.productionMeters,
      };
      const existing = groupedRecords.get(groupKey);
      if (existing) {
        existing.rows.push(shiftDetail);
        existing.totalPicks += shiftDetail.productionPicks;
        existing.totalMeters += shiftDetail.productionMeters;
      } else {
        groupedRecords.set(groupKey, {
          date: record.date,
          loomId: record.loomId,
          loomNo: record.loomNo,
          beamNo: record.beamNo,
          flangeNo: record.flangeNo,
          fabricCode: record.fabricCode,
          fabricQuality: record.fabricQuality,
          fabricLabel: record.fabricLabel,
          beamId: record.beamId,
          flangeId: record.flangeId,
          fabricMasterId: record.fabricMasterId,
          rows: [shiftDetail],
          totalPicks: shiftDetail.productionPicks,
          totalMeters: shiftDetail.productionMeters,
        });
      }
    });

    const payloads: WeavingProductionImportPayload[] = Array.from(groupedRecords.values()).map((group) => {
      const fabricLabel = group.fabricLabel || [group.fabricCode, group.fabricQuality].filter(Boolean).join(" - ");
      return {
        weavingProductionDate: group.date,
        loomId: group.loomId,
        loomNo: group.loomNo,
        beamNo: group.beamNo,
        beamId: group.beamId,
        flangeNo: group.flangeNo,
        flangeId: group.flangeId,
        fabricCodeQuality: fabricLabel,
        fabricMasterId: group.fabricMasterId,
        totalPicks: Number(group.totalPicks.toFixed(2)),
        totalMeters: Number(group.totalMeters.toFixed(2)),
        productionDetails: group.rows.map((detail) => ({
          shift: detail.shift,
          productionPicks: Number(detail.productionPicks.toFixed(2)),
          productionMeters: Number(detail.productionMeters.toFixed(2)),
        })),
        companyId: storedCompanyId,
      };
    });

    if (!payloads.length) {
      toast.error("No valid import payloads could be constructed");
      return;
    }

    try {
      setIsImporting(true);
      for (const payload of payloads) {
        const documentNumber = await generateDocumentNumberForImport();
        payload.weavingProductionNo = documentNumber;
        payload.documentNo = documentNumber;
        await dispatch(createWeavingProduction(payload)).unwrap();
        documentNumberService.clearMemoryCache("Weaving Production");
      }
      fetchList();
    } catch (error) {
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!EXCEL_ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error("Only Excel files (.xls, .xlsx) are supported");
      event.target.value = "";
      return;
    }
    try {
      const rows = await readExcelFile<Record<string, any>>(file);
      await importRows(rows);
    } finally {
      event.target.value = "";
    }
  };

  const headerActions = (
    <div className="flex flex-col items-end gap-2 text-right">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
        >
          Download Template
        </button>
        <button
          type="button"
          onClick={handleUploadButtonClick}
          disabled={isImporting}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isImporting ? "Uploading..." : "Upload"}
        </button>
      </div>
      {/* <p className="text-xs text-slate-500">Selected File: {selectedFileName || "None"}</p> */}
      <input
        ref={fileInputRef}
        type="file"
        accept={EXCEL_ALLOWED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );

  return (
    <div className="p-6 pt-16 space-y-6">
      <DataTable
        columns={columns}
        data={tableData}
        title="Weaving Production"
        headerActions={headerActions}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showActions
        showColumnFilters
        filterPlaceholder="Search Weaving Production..."
        loading={loading}
        disableFullDataFetch = {true}
        //  initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
      />

      {/* <Pagination
        currentPage={currentPage}
        totalItems={pagination?.total || 0}
        itemsPerPage={itemsPerPage}
        offset={pagination?.offset || 0}
        hasNext={!!pagination?.next}
        hasPrev={!!pagination?.prev}
        onPageChange={handlePageChange}
      /> */}
    </div>
  );
}
