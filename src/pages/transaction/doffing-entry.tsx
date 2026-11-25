import React, { useCallback, useEffect, useMemo, useState, useRef, act } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllBeamGaitings } from "@/state/beamGaitingSlice";
import { getAllFlanges } from "@/state/flangeSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllJobworkFabricReceive } from "@/state/jobFabricReceiveSlice";
import { getDoffingEntriesPage, createFactoryPieceEntry, updateFactoryPieceEntry } from "@/state/factoryPieceEntrySlice";
import { getAllBeamCuts } from "@/state/beamCutSlice";
import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
import { getFabricBarcodeLink, FabricBarcodePiece } from "@/lib/barcode";
import { Modal } from "@/components/ui/Modal";
import { formatDate, exportToExcel } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { DataTable } from "@/components/data/DataTable";
import { Edit, Trash2, Search, X, ChevronLeft, ChevronRight, LayoutGrid, List, Download } from "lucide-react";
import ReactDOM from "react-dom";
import { getAllCompanies } from "@/state/company-master-slice";
import { deleteFactoryPieceEntry } from "@/state/factoryPieceEntrySlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getFactoryBeamInwardsByFactoryCompanyId, getAllFactoryBeamInwards } from "@/state/factoryBeamInwardSlice";
import { documentNumberService } from "@/services/DocumentNumberService";
import { getAllWeavingYarnIssue } from "@/state/weavingYarnIssueSlice";
import { getAllGrandMaster } from "@/state/gradeMasterSlice";
import { getAllBeamStockByCompany } from "@/state/beamStockSlice";
import { useFilteredWarehouseOptions } from "@/hooks/useFilteredWarehouseOptions";
import { toast } from "react-toastify";
import apiService from "@/services/ApiService";

interface BeamContext {
  beamNo: string;
  flangeNo: string;
  flangeId: number | null;
  detail: any;
}

interface DoffingRow {
  doffingDate: string;
  loomId: string;
  beamNoFlange: string;
  fabricCodeQuality: string;
  doffingPicks: string;
  pieceNumber: string;
  pieceMeter: string;
  remainingMtr?: number | string | null;
  warehouseId: string;
  isLastPiece: string;
  noOfFabricOutput: string;
  beamContexts: BeamContext[];
  sizingSetNo?: string;
  warpMillName?: string;
  warpLotNo?: string;
  warpCount?: string;
}

interface SavedEntry extends DoffingRow {
  id: number;
  beamId?: number | null;
  doffingNo?: string;
  isInspected?: number;
  isRejected?: number;
  weftYarnLotNo?: string;
  weftYarnMillName?: string;
  weftCount?: string;
  remainingMtr?: number | string | null;
  sizingSetNo?: string;
  warpMillName?: string;
  warpLotNo?: string;
  warpCount?: string;
}

export default function DoffingEntryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { loomList } = useSelector((s: RootState) => s.loomMaster as any);
  const { list: beamGatingList } = useSelector((s: RootState) => s.beamGaiting as any);
  const { flangeList } = useSelector((s: RootState) => s.flange as any);
  const { fabricMasterList } = useSelector((s: RootState) => s.fabricMaster as any);
  const { list: pieceEntryList, pagination: doffingPagination, loading: doffingLoading } = useSelector((s: RootState) => s.factoryPieceEntry as any);
  const { companyMasterList } = useSelector((s: RootState) => s.companyMaster as any);
  const { list: beamCutList } = useSelector((s: RootState) => (s as any).beamCut || {});
  const { warehouseList } = useSelector((s: RootState) => s.warehouse as any);
  const { filteredWarehouseOptions: fabricWarehouseOptions, defaultWarehouseId: defaultFabricWarehouseId } = useFilteredWarehouseOptions(warehouseList, 'Fabric');
  const weavingContractList = useSelector((s: RootState) => (s as any).weavingContracts?.weavingContractList);
  const weavingJobWorkOrderList = useSelector((s: RootState) => (s as any).weavingJobWorkOrder?.weavingJobWorkOrderList);
  const { list: factoryBeamInwardList } = useSelector((s: RootState) => (s as any).factoryBeamInward as any);
  const { stockList: beamStockList } = useSelector((s: RootState) => s.beamStock);
  const { gradeList } = useSelector((s: RootState) => (s as any).grade as any);
  const { weavingYarnIssuetList } = useSelector((s: RootState) => (s as any).weavingYarnIssue || {});
  const [doffingHistory, setDoffingHistory] = useState<any[]>([]);
  const doffingHistoryByBeam = useMemo(() => {
    const rawPageEntries: any[] = Array.isArray(pieceEntryList)
      ? pieceEntryList
      : Array.isArray((pieceEntryList as any)?.data)
        ? (pieceEntryList as any).data
        : [];
    const entries = doffingHistory.length ? doffingHistory : rawPageEntries;
    const index = new Map<string, any[]>();
    entries.forEach((entry: any) => {
      if (Number(entry?.isFactoryFabric) !== 1) return;
      const loomId = String(entry?.loomId ?? entry?.loom_id ?? "");
      if (!loomId) return;
      const beamId = entry?.beamId ?? entry?.beam_id;
      const beamNo = String(entry?.beamNo || entry?.sizedBeamNo || "").trim().toLowerCase();
      const keys = [
        beamId != null ? `${loomId}:id:${beamId}` : "",
        beamNo ? `${loomId}:no:${beamNo}` : "",
      ].filter(Boolean);
      keys.forEach((key) => {
        const bucket = index.get(key);
        if (bucket) bucket.push(entry);
        else index.set(key, [entry]);
      });
    });
    return index;
  }, [doffingHistory, pieceEntryList]);

  const latestGatingByLoom = useMemo(() => {
    const arr: any[] = Array.isArray(beamGatingList)
      ? beamGatingList
      : Array.isArray((beamGatingList as any)?.data)
        ? (beamGatingList as any).data
        : [];
    const map = new Map<string, any>();

    const getDetails = (g: any): any[] => {
      if (!g) return [];
      return Array.isArray(g?.beamGatingDetails)
        ? g.beamGatingDetails
        : Array.isArray(g?.beamDetails)
          ? g.beamDetails
          : Array.isArray(g?.details)
            ? g.details
            : [];
    };

    const hasActiveProd = (g: any, key?: string): boolean => {
      const details = getDetails(g);
      if (details.length === 0) {
        return Number(g?.isProductionCompleted ?? g?.is_production_completed ?? 0) === 0;
      }
      const loomDetails = key
        ? details.filter((detail: any) => {
            const detailId = String(detail?.loomId ?? detail?.loom_id ?? detail?.loom?.id ?? "").trim();
            const detailNo = String(detail?.loomNo ?? detail?.loom_no ?? detail?.loom?.loomNo ?? detail?.loom?.loom_no ?? "").trim().toLowerCase();
            return detailId === key || detailNo === key.toLowerCase();
          })
        : [];
      const relevantDetails = loomDetails.length ? loomDetails : details;
      return relevantDetails.some((d: any) => Number(d?.isProductionCompleted ?? d?.is_production_completed ?? 0) === 0);
    };

    const getTime = (g: any): number => {
      const dStr = g?.effectiveDate || g?.effective_date || g?.gaitingDate || g?.gatingDate || g?.createdAt || g?.created_at || 0;
      return new Date(dStr).getTime() || 0;
    };

    const getId = (g: any): number => {
      return Number(g?.id || 0);
    };

    arr.forEach((x: any) => {
      const lid = String(x?.loomId ?? x?.loom_id ?? x?.loom?.id ?? x?.beamGatingDetails?.[0]?.loomId ?? x?.details?.[0]?.loomId ?? "").trim();
      const lno = String(x?.loomNo ?? x?.loom_no ?? x?.loom?.loomNo ?? x?.loom?.loom_no ?? "").trim().toLowerCase();
      const details = getDetails(x);
      const detailLoomIds = details.map((d: any) =>
        String(d?.loomId ?? d?.loom_id ?? d?.loom?.id ?? "").trim()
      ).filter(Boolean);
      const detailLoomNos = details.map((d: any) =>
        String(d?.loomNo ?? d?.loom_no ?? d?.loom?.loomNo ?? d?.loom?.loom_no ?? "").trim().toLowerCase()
      ).filter(Boolean);

      const processKey = (key: string) => {
        if (!key) return;
        const prev = map.get(key);
        if (!prev) {
          map.set(key, x);
          return;
        }

        const xActive = hasActiveProd(x, key);
        const prevActive = hasActiveProd(prev, key);

        if (xActive && !prevActive) {
          map.set(key, x);
          return;
        }
        if (!xActive && prevActive) {
          return;
        }

        const tX = getTime(x);
        const tPrev = getTime(prev);
        if (tX > tPrev) {
          map.set(key, x);
          return;
        }
        if (tX < tPrev) {
          return;
        }

        const idX = getId(x);
        const idPrev = getId(prev);
        if (idX >= idPrev) {
          map.set(key, x);
        }
      };

      new Set([lid, ...detailLoomIds]).forEach(processKey);
      new Set([lno, ...detailLoomNos]).forEach(processKey);
    });

    return map;
  }, [beamGatingList]);

  const getGatingDetailsForLoom = useCallback((loomId: string, activeOnly = true) => {
    const key = String(loomId ?? "").trim();
    if (!key) return [];
    const gating = latestGatingByLoom.get(key) || latestGatingByLoom.get(key.toLowerCase());
    if (!gating) return [];
    const details: any[] = Array.isArray(gating?.beamGatingDetails)
      ? gating.beamGatingDetails
      : Array.isArray(gating?.details)
        ? gating.details
        : Array.isArray(gating?.beamDetails)
          ? gating.beamDetails
          : [];
    const loomRaw: any = loomList as any;
    const looms: any[] = Array.isArray(loomRaw) ? loomRaw : Array.isArray(loomRaw?.data) ? loomRaw.data : [];
    const selectedLoom = looms.find((loom: any) => String(loom?.id ?? loom?.loomId ?? loom?.loom_id) === key);
    const selectedLoomNo = String(selectedLoom?.loomNo ?? selectedLoom?.loom_no ?? selectedLoom?.loomName ?? selectedLoom?.name ?? "").trim().toLowerCase();

    return details.filter((detail: any) => {
      const detailLoomId = String(detail?.loomId ?? detail?.loom_id ?? detail?.loom?.id ?? "").trim();
      const detailLoomNo = String(detail?.loomNo ?? detail?.loom_no ?? detail?.loom?.loomNo ?? detail?.loom?.loom_no ?? "").trim().toLowerCase();
      if (detailLoomId && detailLoomId !== key) return false;
      if (!detailLoomId && detailLoomNo && selectedLoomNo && detailLoomNo !== selectedLoomNo) return false;
      return !activeOnly || Number(detail?.isProductionCompleted ?? detail?.is_production_completed ?? 0) !== 1;
    });
  }, [latestGatingByLoom, loomList]);

  const getEffectiveWeftYarnInfo = useCallback((loomId: string, beamId?: number | null, fallbackDetail?: any) => {
    if (!loomId && !beamId) {
      return {
        weftYarnLotNo: fallbackDetail?.weftYarnLotNo || fallbackDetail?.weftLotNo || '-',
        weftYarnMillName: fallbackDetail?.weftYarnMillName || fallbackDetail?.weftMillName || '-',
        weftCount: fallbackDetail?.weftCount || fallbackDetail?.weftYarnName || fallbackDetail?.weftYarnCount || '-',
      };
    }

    const rawIssues: any = weavingYarnIssuetList as any;
    const issueList: any[] = Array.isArray(rawIssues)
      ? rawIssues
      : Array.isArray(rawIssues?.data)
        ? rawIssues.data
        : Array.isArray(rawIssues?.items)
          ? rawIssues.items
          : [];

    let switchedLotNo: string | null = null;
    let switchedMillName: string | null = null;
    let switchedCount: string | null = null;
    let latestId = -1;

    issueList.forEach((issueRec: any) => {
      (issueRec.requirements || []).forEach((req: any) => {
        (req.yarnIssues || []).forEach((issueItem: any) => {
          const isSwitched = issueItem.issueType === 'LOT_SWITCH';
          const matchesLoom = loomId && String(issueItem.loomId) === String(loomId);
          const matchesBeam = beamId != null && issueItem.beamGaitingId != null && String(issueItem.beamGaitingId) === String(beamId);
          if (isSwitched && (matchesLoom || matchesBeam)) {
            const recId = Number(issueItem.id || issueRec.id || 0);
            if (recId >= latestId) {
              latestId = recId;
              switchedLotNo = issueItem.lotNumber || issueItem.lotNo || null;
              switchedMillName = issueItem.millName || issueItem.weftYarnMillName || issueItem.mill?.millName || issueItem.mill?.name || req.millName || null;
              switchedCount = issueItem.weftCount || issueItem.yarnCount || issueItem.actualYarn || issueItem.yarnName || req.yarnCount || req.actualYarn || req.yarnName || null;
            }
          }
        });
      });
    });

    const key = String(loomId ?? "").trim();
    const gaiting = latestGatingByLoom.get(key) || latestGatingByLoom.get(key.toLowerCase());
    const fallbackLotNo = fallbackDetail?.weftYarnLotNo || fallbackDetail?.weftLotNo || gaiting?.weftYarnLotNo || gaiting?.weftLotNo || '-';
    const fallbackMill = fallbackDetail?.weftYarnMillName || fallbackDetail?.weftMillName || gaiting?.weftYarnMillName || gaiting?.weftMillName || '-';
    const fallbackCnt = fallbackDetail?.weftCount || fallbackDetail?.weftYarnName || fallbackDetail?.weftYarnCount || gaiting?.weftCount || gaiting?.weftYarnName || '-';

    return {
      weftYarnLotNo: switchedLotNo || fallbackLotNo || '-',
      weftYarnMillName: switchedMillName || fallbackMill || '-',
      weftCount: switchedCount ? String(switchedCount) : (fallbackCnt || '-'),
    };
  }, [weavingYarnIssuetList, latestGatingByLoom]);

  const getEffectiveWeftLotNo = useCallback((loomId: string, beamId?: number | null, fallbackLotNo?: string) => {
    return getEffectiveWeftYarnInfo(loomId, beamId, { weftYarnLotNo: fallbackLotNo }).weftYarnLotNo;
  }, [getEffectiveWeftYarnInfo]);

  const getLoomRemainingInfo = useCallback((loomId: string, currentPieceMeterStr?: string, editEntryId?: number | null, selectedBeamContexts?: BeamContext[]) => {
    if (!loomId) {
      return {
        expectedFabricMeter: 0,
        usedMetersOthers: 0,
        availableRemaining: 0,
        currentRemaining: 0,
        formattedCurrentRemaining: "-",
      };
    }

    const key = String(loomId ?? "").trim();
    const gating = latestGatingByLoom.get(key) || latestGatingByLoom.get(key.toLowerCase());
    if (!gating) {
      return {
        expectedFabricMeter: 0,
        usedMetersOthers: 0,
        availableRemaining: 0,
        currentRemaining: 0,
        formattedCurrentRemaining: "-",
      };
    }

    const details = getGatingDetailsForLoom(key, false);
    const activeDetails = getGatingDetailsForLoom(key);
    const selectedBeamNos = new Set((selectedBeamContexts || [])
      .map((context) => String(context.beamNo || "").trim().toLowerCase())
      .filter(Boolean));
    const selectedFlangeIds = new Set((selectedBeamContexts || [])
      .map((context) => context.flangeId != null ? String(context.flangeId) : "")
      .filter(Boolean));
    const selectedGatingDetailIds = new Set((selectedBeamContexts || [])
      .map((context) => context.detail?.id != null ? String(context.detail.id) : "")
      .filter(Boolean));
    const hasSelectedBeam = selectedBeamNos.size > 0 || selectedFlangeIds.size > 0 || selectedGatingDetailIds.size > 0;
    const selectedDetails = hasSelectedBeam
      ? activeDetails.filter((detail: any) => {
          const beamNo = String(detail?.beamNo || detail?.sizedBeamNo || detail?.sized_beam_no || detail?.beam?.beamNo || detail?.beam?.beam_no || "").trim().toLowerCase();
          const flangeId = String(detail?.flangeId ?? detail?.flange?.id ?? detail?.flange_id ?? "");
          const gatingDetailId = detail?.id != null ? String(detail.id) : "";
          return (gatingDetailId && selectedGatingDetailIds.has(gatingDetailId))
            || (beamNo && selectedBeamNos.has(beamNo))
            || (!beamNo && flangeId && selectedFlangeIds.has(flangeId));
        })
      : [];
    const contextDetails = (selectedBeamContexts || [])
      .map((context) => context.detail)
      .filter(Boolean);
    const calculationDetails = selectedDetails.length
      ? selectedDetails
      : hasSelectedBeam
        ? contextDetails
        : activeDetails.length
          ? activeDetails
          : details;

    let expectedMtr = 0;
    const detailExpectedVals = calculationDetails
      .map((d: any) => parseFloat(d?.expectedFabricMeter ?? d?.expected_fabric_meter ?? d?.expectedFabricMtr ?? d?.expected_fabric_mtr ?? 0))
      .filter((n: number) => !isNaN(n) && n > 0);

    if (detailExpectedVals.length > 0) {
      expectedMtr = Math.max(...detailExpectedVals);
    } else if (hasSelectedBeam) {
      const stockExpectedValues = (selectedBeamContexts || [])
        .map((context) => {
          const beamNo = String(context.beamNo || "").trim().toLowerCase();
          const beamId = context.detail?.beamId != null ? String(context.detail.beamId) : "";
          const flangeId = context.flangeId != null ? String(context.flangeId) : "";
          const matchingStocks = beamStockList.filter((stock: any) => {
            const stockBeamNo = String(stock?.sizedBeamNo || stock?.beamNo || "").trim().toLowerCase();
            const stockId = stock?.id != null ? String(stock.id) : "";
            const stockFlangeId = stock?.flangeId != null ? String(stock.flangeId) : "";
            return (beamId && stockId === beamId)
              || (beamNo && stockBeamNo === beamNo && (!flangeId || !stockFlangeId || flangeId === stockFlangeId));
          });
          const stock = matchingStocks.find((item: any) =>
            beamId && String(item?.id ?? "") === beamId
          ) || matchingStocks.find((item: any) =>
            flangeId && String(item?.flangeId ?? "") === flangeId
          ) || matchingStocks[0];
          const value = Number(stock?.expectedFabricMeter);
          return Number.isFinite(value) && value > 0 ? value : null;
        })
        .filter((value): value is number => value != null);
      if (stockExpectedValues.length > 0) {
        expectedMtr = Math.max(...stockExpectedValues);
      }
    }

    if (expectedMtr <= 0 && gating?.expectedFabricMeter != null) {
      const gExp = parseFloat(gating.expectedFabricMeter);
      if (!isNaN(gExp) && gExp > 0) expectedMtr = gExp;
    }

    const matchingEntries: any[] = [];
    let usedMetersOthers = 0;
    const currentCycleEntries = new Map<number, any>();
    const historyByBeam = calculationDetails.map((detail: any) => {
      const beamId = detail?.beamId != null ? String(detail.beamId) : "";
      const beamNo = String(detail?.beamNo || detail?.sizedBeamNo || detail?.sized_beam_no || "").trim().toLowerCase();
      const entriesForBeam = new Map<number, any>();
      const addEntriesForKey = (key: string, matchMissingBeamId = false) => {
        (doffingHistoryByBeam.get(key) || []).forEach((entry: any) => {
          if (matchMissingBeamId && (entry.beamId ?? entry.beam_id) != null) return;
          if (editEntryId != null && Number(entry.id) === Number(editEntryId)) return;
          entriesForBeam.set(Number(entry.id), entry);
        });
      };
      if (beamId) addEntriesForKey(`${loomId}:id:${beamId}`);
      if (beamNo) addEntriesForKey(`${loomId}:no:${beamNo}`, Boolean(beamId));
      const beamEntries = Array.from(entriesForBeam.values());
      const lastCompletedEntryId = beamEntries.reduce((latestId: number, entry: any) => (
        Number(entry.isLastPiece ?? entry.is_last_piece ?? 0) === 1
          ? Math.max(latestId, Number(entry.id) || 0)
          : latestId
      ), 0);
      return beamEntries.filter((entry: any) => Number(entry.id) > lastCompletedEntryId);
    });

    historyByBeam.flat().forEach((p: any) => {
      const entryId = Number(p.id) || 0;
      if (!currentCycleEntries.has(entryId)) {
        currentCycleEntries.set(entryId, p);
      }
    });
    matchingEntries.push(...currentCycleEntries.values());
    matchingEntries.forEach((p: any) => {
      const pm = parseFloat(p.pieceMeter ?? p.inspectedMtr ?? p.quantity ?? 0);
      if (!isNaN(pm) && pm > 0) {
        usedMetersOthers += pm;
      }
    });

    const latestCycleEntry = matchingEntries.reduce((latest: any, entry: any) => (
      !latest || Number(entry.id) > Number(latest.id) ? entry : latest
    ), null);
    const storedRemaining = latestCycleEntry?.remainingMtr ?? latestCycleEntry?.remaining_mtr;
    const parsedStoredRemaining = storedRemaining != null && storedRemaining !== ""
      ? Number(storedRemaining)
      : NaN;
    const availableRemaining = Number.isFinite(parsedStoredRemaining)
      ? Math.max(0, parsedStoredRemaining)
      : Math.max(0, expectedMtr - usedMetersOthers);

    const parsedCurrent = parseFloat(currentPieceMeterStr || "0");
    const currentPieceMeterNum = !isNaN(parsedCurrent) && parsedCurrent > 0 ? parsedCurrent : 0;
    const currentRemaining = Math.max(0, availableRemaining - currentPieceMeterNum);

    const formattedCurrentRemaining = (expectedMtr > 0 || availableRemaining > 0)
      ? (Number.isInteger(currentRemaining) ? String(currentRemaining) : currentRemaining.toFixed(3))
      : "-";

    return {
      expectedFabricMeter: expectedMtr,
      usedMetersOthers,
      availableRemaining,
      currentRemaining,
      formattedCurrentRemaining,
    };
  }, [latestGatingByLoom, doffingHistoryByBeam, getGatingDetailsForLoom, beamStockList]);

  const [rows, setRows] = useState<DoffingRow[]>([]);
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [doffingRowCache, setDoffingRowCache] = useState<Map<number, any>>(new Map());
  const [doffingPage, setDoffingPage] = useState(0);
  const doffingPageSize = 50;
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [sugRow, setSugRow] = useState<number | null>(null);
  const [duplicateError, setDuplicateError] = useState<string>("");
  const [mobileSearch, setMobileSearch] = useState<string>("");
  const [mobilePage, setMobilePage] = useState<number>(1);
  const [mobilePageSize] = useState<number>(10);
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');

  const refreshAll = useCallback((pageIndex = doffingPage) => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    dispatch(getAllLooms(cid ? { companyId: cid } as any : ({} as any)));
    dispatch(getAllBeamGaitings(cid ? { companyId: cid } as any : ({} as any)));
    dispatch(getAllBeamCuts(cid ? { companyId: cid } as any : ({} as any)));
    const search = mobileSearch.trim();
    const pageRequest = dispatch(getDoffingEntriesPage({
      companyId: cid,
      offset: pageIndex * doffingPageSize,
      limit: doffingPageSize,
      search: search || undefined,
    }));
    pageRequest.unwrap().catch((error: any) => {
      console.error("Failed to load doffing entries:", error);
      toast.error("Unable to load doffing entries.");
    });
    if (cid) dispatch(getFactoryBeamInwardsByFactoryCompanyId(cid) as any);
    else dispatch(getAllFactoryBeamInwards({} as any) as any);
    apiService.get<any[]>("/piece-entries/doffing/history", cid ? { companyId: cid } : {})
      .then((response) => {
        const history = Array.isArray(response) ? response : Array.isArray((response as any)?.data) ? (response as any).data : [];
        setDoffingHistory(history);
      })
      .catch((error) => {
        console.error("Failed to load doffing history:", error);
        toast.error("Unable to load doffing history. Please refresh the screen.");
      });
  }, [dispatch, doffingPage, mobileSearch]);

  const existingPieceNumbers = useMemo(() => {
    const pageEntries: any[] = Array.isArray(pieceEntryList)
      ? pieceEntryList
      : Array.isArray((pieceEntryList as any)?.data)
        ? (pieceEntryList as any).data
        : [];
    return new Set(
      [...doffingHistory, ...pageEntries]
        .filter((p: any) => Number(p.isFactoryFabric) === 1)
        .map((p: any) => String(p.pieceNumber || p.pieceNo || "").trim().toLowerCase())
        .filter(Boolean)
    );
  }, [doffingHistory, pieceEntryList]);

  const pieceEntryWeightLookup = useMemo(() => {
    const root: any[] = Array.isArray(pieceEntryList)
      ? pieceEntryList
      : Array.isArray((pieceEntryList as any)?.data)
        ? (pieceEntryList as any).data
        : [];

    const map = new Map<string, { netWeight?: number; weight?: number; inspectedNetWeight?: number; inspectedNtWt?: number; gradeId?: number }>();

    root.forEach((entry) => {
      const rawPiece = String(entry.pieceNumber || entry.pieceNo || "").trim();
      if (!rawPiece) return;
      const normalized = rawPiece.split(/[,\n;]/)[0].trim().toLowerCase();
      if (!normalized) return;
      map.set(normalized, {
        netWeight: entry.netWeight ?? entry.net_weight,
        weight: entry.weight,
        inspectedNetWeight: entry.inspectedNetWt ?? entry.inspected_net_weight,
        inspectedNtWt: entry.inspectedNtWt ?? entry.inspected_nt_wt,
        gradeId: entry.gradeId ?? entry.grade_id,
      });
    });

    return map;
  }, [pieceEntryList]);

  const splitPieceNumberTokens = (value: string) =>
    String(value || "")
      .split(/[\n,;]/)
      .map(token => String(token || "").trim())
      .filter(Boolean);

  const alphabetSuffix = (index: number) => {
    let counter = index + 1;
    let result = "";
    while (counter > 0) {
      counter -= 1;
      result = String.fromCharCode(65 + (counter % 26)) + result;
      counter = Math.floor(counter / 26);
    }
    return result;
  };

  const ensurePieceNumberTokens = (row: DoffingRow, beamCount: number, rowIdx: number) => {
    if (beamCount <= 1) {
      const tokens = splitPieceNumberTokens(row.pieceNumber);
      return tokens.length ? tokens : [String(row.pieceNumber || "")].filter(Boolean);
    }
    const existingTokens = splitPieceNumberTokens(row.pieceNumber);
    if (existingTokens.length >= beamCount) {
      return existingTokens;
    }
    const candidate = String(existingTokens[0] || row.pieceNumber || "").trim();
    if (!candidate) return existingTokens;
    const base = candidate.replace(/-[A-Z]+$/, "").trim() || candidate;
    const generated = Array.from({ length: beamCount }, (_, idx) => `${base}-${alphabetSuffix(idx)}`);
    const joined = generated.join(", ");
    if (row.pieceNumber !== joined) {
      setRows(prev => {
        const next = [...prev];
        next[rowIdx] = { ...next[rowIdx], pieceNumber: joined };
        return next;
      });
    }
    return generated;
  };

  const flangeNoById = useMemo(() => {
    const raw: any = flangeList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((flange: any) => {
      if (flange?.id != null) {
        map.set(String(flange.id), String(flange.flangeNo || flange.flange_no || flange.no || ""));
      }
    });
    return map;
  }, [flangeList]);

  const beamDetailLookup = useMemo(() => {
    const raw: any = factoryBeamInwardList as any;
    const parents: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, any>();
    parents.forEach((parent: any) => {
      const details: any[] = Array.isArray(parent?.beamInwardBeamDetails)
        ? parent.beamInwardBeamDetails
        : Array.isArray(parent?.beamDetails)
          ? parent.beamDetails
          : [];
      details.forEach((detail: any) => {
        if (detail?.id != null) {
          map.set(String(detail.id), detail);
        }
      });
    });
    return map;
  }, [factoryBeamInwardList]);

  const getEffectiveWarpYarnInfo = useCallback((loomId?: string, beamId?: number | null, beamNo?: string, fallbackDetail?: any) => {
    // 1. Direct from fallbackDetail if available
    const directSetNo = fallbackDetail?.sizingSetNo || fallbackDetail?.sizing_set_no || fallbackDetail?.warpSetNo || fallbackDetail?.warp_set_no;
    const directMill = fallbackDetail?.warpYarnMillName || fallbackDetail?.warp_yarn_mill_name || fallbackDetail?.warpMillName || fallbackDetail?.warp_mill_name;
    const directLot = fallbackDetail?.warpYarnLotNo || fallbackDetail?.warp_yarn_lot_no || fallbackDetail?.warpLotNo || fallbackDetail?.warp_lot_no;
    const directCount = fallbackDetail?.warpCount || fallbackDetail?.warp_count;

    // 2. From latestGatingByLoom
    const key = String(loomId ?? "").trim();
    const gating = key ? (latestGatingByLoom.get(key) || latestGatingByLoom.get(key.toLowerCase())) : undefined;
    const gatingDetails: any[] = Array.isArray(gating?.beamGatingDetails)
      ? gating.beamGatingDetails
      : Array.isArray(gating?.details)
        ? gating.details
        : Array.isArray(gating?.beamDetails)
          ? gating.beamDetails
          : [];

    const cleanBn = (bn?: string) => String(bn || "").trim().toLowerCase();
    const targetBeamNo = cleanBn(beamNo);

    // Find matching detail in gating
    const matchedGatingDetail = gatingDetails.find((d: any) => {
      if (beamId != null && (Number(d?.id) === Number(beamId) || Number(d?.beamId) === Number(beamId))) return true;
      const bn = cleanBn(d?.beamNo || d?.sizedBeamNo || d?.sized_beam_no);
      if (targetBeamNo && bn === targetBeamNo) return true;
      return false;
    }) || gatingDetails[0];

    const gatingSetNo = matchedGatingDetail?.sizingSetNo || matchedGatingDetail?.sizing_set_no || gating?.sizingSetNo || gating?.sizing_set_no;
    const gatingMill = matchedGatingDetail?.warpYarnMillName || matchedGatingDetail?.warp_yarn_mill_name || matchedGatingDetail?.warpMillName || matchedGatingDetail?.warp_mill_name;
    const gatingLot = matchedGatingDetail?.warpYarnLotNo || matchedGatingDetail?.warp_yarn_lot_no || matchedGatingDetail?.warpLotNo || matchedGatingDetail?.warp_lot_no;
    const gatingCount = matchedGatingDetail?.warpCount || matchedGatingDetail?.warp_count;

    // 3. Fallback to factoryBeamInwardList lookup
    let fiDetail: any = null;
    let fiParent: any = null;
    if (beamId != null) {
      fiDetail = beamDetailLookup.get(String(beamId));
    }
    if (!fiDetail && (targetBeamNo || matchedGatingDetail)) {
      const bnToFind = targetBeamNo || cleanBn(matchedGatingDetail?.beamNo || matchedGatingDetail?.sizedBeamNo);
      const rawFi: any = factoryBeamInwardList as any;
      const parents: any[] = Array.isArray(rawFi) ? rawFi : Array.isArray(rawFi?.data) ? rawFi.data : [];
      for (const p of parents) {
        const details: any[] = Array.isArray(p?.beamInwardBeamDetails)
          ? p.beamInwardBeamDetails
          : Array.isArray(p?.beamDetails)
            ? p.beamDetails
            : [];
        const found = details.find((d: any) => {
          const bn = cleanBn(d?.sizedBeamNo || d?.beamNo);
          return bn && bn === bnToFind;
        });
        if (found) {
          fiDetail = found;
          fiParent = p;
          break;
        }
      }
    }

    const fiSetNo = fiDetail?.sizingSetNo || fiDetail?.sizing_set_no || fiParent?.sizingSetNo || fiParent?.sizing_set_no;
    const fiMill = fiDetail?.warpYarnMillName || fiDetail?.warp_yarn_mill_name || fiDetail?.warpMillName || fiDetail?.warp_mill_name;
    const fiLot = fiDetail?.warpYarnLotNo || fiDetail?.warp_yarn_lot_no || fiDetail?.warpLotNo || fiDetail?.warp_lot_no;
    const fiCount = fiDetail?.warpCount || fiDetail?.warp_count;

    return {
      sizingSetNo: directSetNo || gatingSetNo || fiSetNo || '-',
      warpYarnMillName: directMill || gatingMill || fiMill || '-',
      warpYarnLotNo: directLot || gatingLot || fiLot || '-',
      warpCount: directCount || gatingCount || fiCount || '-',
    };
  }, [latestGatingByLoom, beamDetailLookup, factoryBeamInwardList]);

  const isDuplicatePiece = (val: string) => {
    const tokens = splitPieceNumberTokens(val);
    if (!tokens.length) return false;
    return tokens.some(token => {
      const v = String(token || "").trim().toLowerCase();
      if (!v) return false;
      const inSaved = saved.some(s => String(s.pieceNumber).trim().toLowerCase() === v);
      return inSaved || existingPieceNumbers.has(v);
    });
  };

  const [suggestionPos, setSuggestionPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const pieceInputRef = useRef<HTMLInputElement | null>(null);
  const updateSuggestionPos = () => {
    const el = pieceInputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSuggestionPos({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  useEffect(() => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    dispatch(getAllLooms(cid ? { companyId: cid } as any : ({} as any)));
    dispatch(getAllBeamGaitings(cid ? { companyId: cid } as any : ({} as any)));
    dispatch(getAllFlanges(cid ? { companyId: cid } as any : ({} as any)));
    dispatch(getAllFabricMasters({ fetchAll: true } as any));
    // dispatch(getAllJobworkFabricReceive({} as any));
    // dispatch(getAllPurchaseInwards({} as any));
    dispatch(getAllCompanies({ fetchAll: true } as any));
    dispatch(getAllWarehouse({ fetchAll: true } as any));
    if (cid) dispatch(getFactoryBeamInwardsByFactoryCompanyId(cid) as any); else dispatch(getAllFactoryBeamInwards({} as any) as any);
    dispatch(getAllBeamCuts({ companyId: cid } as any));
    dispatch(getAllBeamStockByCompany(cid ? { companyId: cid, fetchAll: true } : { fetchAll: true }) as any);
    try {
      if (cid) {
        dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
          factoryCompanyId: cid,
        }) as any);
        // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(cid) as any);
      }
      // if (cid) dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(cid) as any);
      else dispatch(getAllWeavingJobWorkOrders({ fetchAll: true } as any) as any);
    } catch (e) {
      dispatch(getAllWeavingJobWorkOrders({ fetchAll: true } as any) as any);
    }
    dispatch(getAllWeavingContract({ fetchAll: true } as any) as any);
    dispatch(getAllBeamGaitings(cid ? { companyId: cid } as any : ({} as any)) as any);
    dispatch(getAllWeavingYarnIssue({ fetchAll: true } as any) as any);
    dispatch(getAllGrandMaster({ fetchAll: true } as any) as any);
  }, [dispatch]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setRows([{ doffingDate: today, loomId: "", beamNoFlange: "", fabricCodeQuality: "", doffingPicks: "", pieceNumber: "", pieceMeter: "", warehouseId: "", isLastPiece: "0", noOfFabricOutput: "0", beamContexts: [], sizingSetNo: "", warpMillName: "", warpLotNo: "", warpCount: "" }]);
  }, []);

  useEffect(() => {
    if (!defaultFabricWarehouseId) return;
    setRows(prev =>
      prev.map(row =>
        row.warehouseId === '' ? { ...row, warehouseId: defaultFabricWarehouseId } : row
      )
    );
  }, [defaultFabricWarehouseId]);

  const selectedCompanyId = useMemo(() => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    return v ? Number(v) : undefined;
  }, []);

  useEffect(() => {
    let active = true;
    const search = mobileSearch.trim();
    const timer = window.setTimeout(() => {
      dispatch(getDoffingEntriesPage({
        companyId: selectedCompanyId,
        offset: doffingPage * doffingPageSize,
        limit: doffingPageSize,
        search: search || undefined,
      })).unwrap().catch((error) => {
        if (!active) return;
        console.error("Failed to load doffing entries:", error);
        toast.error("Unable to load doffing entries.");
      });
    }, search ? 350 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [dispatch, mobileSearch, selectedCompanyId, doffingPage]);

  useEffect(() => {
    let active = true;
    apiService.get<any[]>("/piece-entries/doffing/history", selectedCompanyId ? { companyId: selectedCompanyId } : {})
      .then((response) => {
        if (!active) return;
        const history = Array.isArray(response) ? response : Array.isArray((response as any)?.data) ? (response as any).data : [];
        setDoffingHistory(history);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load doffing history:", error);
        toast.error("Unable to load doffing history. Please refresh the screen.");
      });
    return () => {
      active = false;
    };
  }, [selectedCompanyId]);

  const selectedCompanyCode = useMemo(() => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    const list: any[] = Array.isArray(companyMasterList) ? companyMasterList : Array.isArray((companyMasterList as any)?.data) ? (companyMasterList as any).data : [];
    const found = list.find((c: any) => Number(c?.id) === cid);
    return String(found?.companyCode || localStorage.getItem("companyCode") || localStorage.getItem("selectedCompanyCode") || "XX");
  }, [companyMasterList]);

  useEffect(() => {
    if (editIndex != null) return;
    if (rows.length === 0) return;

    const code = selectedCompanyCode;
    const now = new Date();
    const yy = now.getFullYear() % 100;
    const next = (yy + 1) % 100;
    const fy = `${String(yy).padStart(2, "0")}-${String(next).padStart(2, "0")}`;
    const prefix = `${code}-F/${fy}`;

    const pageEntries: any[] = Array.isArray(pieceEntryList)
      ? pieceEntryList
      : Array.isArray((pieceEntryList as any)?.data)
        ? (pieceEntryList as any).data
        : [];
    const existingList: string[] = [...doffingHistory, ...pageEntries]
      .map((p: any) => String(p.pieceNumber || p.pieceNo || "").trim())
      .filter(Boolean);

    const seqFrom = (arr: string[]) => {
      let max = 0;
      for (const s of arr) {
        if (!s.startsWith(prefix + "/")) continue;
        const parts = s.split("/");
        const last = parts[parts.length - 1];
        const n = parseInt(last, 10);
        if (!isNaN(n)) max = Math.max(max, n);
      }
      return max;
    };

    const maxSeq = seqFrom(existingList);
    const nextSeq = String(maxSeq + 1).padStart(5, "0");
    const nextPiece = `${prefix}/${nextSeq}`;

    setRows(prev => {
      const next = [...prev];
      const cur = String(next[0]?.pieceNumber || "");
      const needsUpdate = !cur || !cur.startsWith(prefix + "/");
      if (needsUpdate) {
        next[0] = { ...next[0], pieceNumber: nextPiece } as DoffingRow;
      }
      return next;
    });

    const dup = existingList.some(s => s.toLowerCase() === nextPiece.toLowerCase());
    setDuplicateError(dup ? "This piece no already exist." : "");
  }, [doffingHistory, editIndex, rows.length, selectedCompanyCode]);

  // const loomOptions = useMemo(() => {
  //   const raw: any = loomList as any;
  //   const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  //   const bcRaw: any[] = Array.isArray(beamCutList) ? beamCutList : Array.isArray((beamCutList as any)?.data) ? (beamCutList as any).data : [];
  //   const norm = (v: any) => String(v ?? '').trim().toLowerCase();
  //   const blockedIds = new Set<string>(bcRaw.map((b: any) => norm(b?.loomId || b?.loom?.id)).filter(Boolean));
  //   const blockedNos = new Set<string>(bcRaw.map((b: any) => norm(b?.loomNo || b?.loom?.loomNo || b?.loom?.loom_no || b?.loom_no)).filter(Boolean));
  //   const filtered = arr.filter((l: any) => {
  //     if (Number(l?.isBeamGating) !== 1) return false;
  //     const idHit = blockedIds.has(norm(l?.id));
  //     const noHit = blockedNos.has(norm(l?.loomNo || l?.loomName || l?.name));
  //     return !(idHit || noHit);
  //   });
  //   return filtered.map((l: any) => ({ value: String(l.id), label: String(l.loomNo || l.loomName || l.name || l.id),activeFlag: l.activeFlag !== undefined ? l.activeFlag : true }));
  // }, [loomList, beamCutList]);

  const fabricOptions = useMemo(() => {
    const raw: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
    return raw.map((f: any) => {
      const code = String(f.fabricCode || f.fabric_code || f.code || "").trim();
      const qual = String(f.fabricQuality || f.quality || f.fabric_quality || "").trim();
      const label = [code, qual].filter(Boolean).join(" - ");
      return { value: label, label };
    });
  }, [fabricMasterList]);

  const warehouseOptions = fabricWarehouseOptions;

  const warehouseLabelMap = useMemo(() => {
    const raw: any = warehouseList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((w: any) => map.set(String(w.id), String(w.warehouseName || w.name || w.code || w.id)));
    return map;
  }, [warehouseList]);

  const loomLabelMap = useMemo(() => {
    const raw: any = loomList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((l: any) => map.set(String(l.id), String(l.loomNo || l.loomName || l.name || l.id)));
    return map;
  }, [loomList]);

  const gradeMap = useMemo(() => {
    const raw: any = gradeList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<number, string>();
    arr.forEach((g: any) => {
      if (g?.id != null) map.set(Number(g.id), String(g.gradeName || g.gradeCode || g.id));
    });
    return map;
  }, [gradeList]);

  const allPieceSuggestions = useMemo(() => {
    const pageEntries: any[] = Array.isArray(pieceEntryList)
      ? pieceEntryList
      : Array.isArray((pieceEntryList as any)?.data)
        ? (pieceEntryList as any).data
        : [];
    const filtered = [...doffingHistory, ...pageEntries].filter((p: any) => Number(p.isFactoryFabric) === 1);
    const pieces = filtered.map((p: any) => String(p.pieceNumber || p.pieceNo || '').trim()).filter(Boolean);
    return Array.from(new Set(pieces));
  }, [doffingHistory, pieceEntryList]);




  const loomOptions = useMemo(() => {
    const raw: any = loomList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const bcRaw: any[] = Array.isArray(beamCutList) ? beamCutList : Array.isArray((beamCutList as any)?.data) ? (beamCutList as any).data : [];
    const norm = (v: any) => String(v ?? '').trim().toLowerCase();
    const blockedIds = new Set<string>(bcRaw.map((b: any) => norm(b?.loomId || b?.loom?.id)).filter(Boolean));
    const blockedNos = new Set<string>(bcRaw.map((b: any) => norm(b?.loomNo || b?.loom?.loomNo || b?.loom?.loom_no || b?.loom_no)).filter(Boolean));

    const editingLoomId = editIndex != null ? String(rows[0]?.loomId || "").trim() : "";

    const filtered = arr.filter((l: any) => {
      const loomIdStr = String(l?.id ?? l?.loomId ?? l?.loom_id ?? "").trim();
      const loomNoStr = String(l?.loomNo ?? l?.loom_no ?? l?.loomName ?? l?.name ?? "").trim().toLowerCase();
      if (editingLoomId && loomIdStr === editingLoomId) return true;

      const isBeamGatingFlag = Number(l?.isBeamGating ?? l?.is_beam_gating ?? 0);
      if (isBeamGatingFlag !== 1) return false;

      const latestGating = latestGatingByLoom.get(loomIdStr) || (loomNoStr ? latestGatingByLoom.get(loomNoStr) : undefined);
      if (!latestGating) return false;

      return getGatingDetailsForLoom(loomIdStr).length > 0;
    });
    return filtered.map((l: any) => ({
      value: String(l.id ?? l.loomId ?? l.loom_id),
      label: String(l.loomNo || l.loomName || l.name || l.id),
      activeFlag: l.activeFlag !== undefined ? l.activeFlag : true
    }));
  }, [loomList, beamCutList, latestGatingByLoom, getGatingDetailsForLoom, editIndex, rows]);

  const normalizeGatingDetail = (detail: any): BeamContext => {
    const beamNo = String(detail?.beamNo || detail?.sizedBeamNo || detail?.sized_beam_no || detail?.beam?.beamNo || detail?.beam?.beam_no || "").trim();
    const flangeNo = String(detail?.flangeNo || detail?.flange?.flangeNo || detail?.flange?.flange_no || detail?.flange_no || "").trim();
    const flangeId = detail?.flangeId ?? detail?.flange?.id ?? detail?.flange_id ?? null;
    return { beamNo, flangeNo, flangeId: flangeId != null ? Number(flangeId) : null, detail };
  };

  const getBeamContextsForLoom = useCallback((loomId: string) => {
    const details = getGatingDetailsForLoom(loomId);
    return details.map(normalizeGatingDetail);
  }, [getGatingDetailsForLoom]);

  const getLatestGatingForLoom = useCallback((loomId: string) => {
    const key = String(loomId ?? "").trim();
    if (!key) return undefined;
    return latestGatingByLoom.get(key) || latestGatingByLoom.get(key.toLowerCase());
  }, [latestGatingByLoom]);

  const parseFabricOutput = (value: any) => {
    if (value == null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const getFabricOutputForLoom = useCallback((loomId: string, fallback?: number) => {
    const gating = getLatestGatingForLoom(loomId);
    if (!gating) return fallback;
    const rawValue =
      gating.noOfFabricOutput ??
      gating.no_of_fabric_output ??
      gating.noOfFabricOutputs ??
      gating.no_of_fabric_outputs ??
      gating.fabricOutput ??
      gating.fabric_output ??
      undefined;
    const parsed = parseFabricOutput(rawValue);
    return parsed != null ? parsed : fallback;
  }, [getLatestGatingForLoom]);

  const autofillForLoom = (loomId: string, dateIso: string) => {
    const normalized = getBeamContextsForLoom(loomId);
    const beams = normalized.map(ctx => ctx.beamNo).filter(Boolean);
    const flanges = normalized.map(ctx => ctx.flangeNo).filter(Boolean);
    const fabricOutputValue = getFabricOutputForLoom(loomId, beams.length);
    const outputString = fabricOutputValue != null ? String(fabricOutputValue) : String(beams.length);

    // Modified logic: Check changedFabricMasterId first, then fallback to fabricMasterId
    const codes = normalized
      .map(ctx => {
        const detail = ctx.detail;
        let fabricMasterIdToUse = null;

        // Check if changedFabricMasterId is not null
        if (detail?.changedFabricMasterId != null && detail?.changedFabricMasterId !== "") {
          fabricMasterIdToUse = detail.changedFabricMasterId;
        } else if (detail?.fabricMasterId != null && detail?.fabricMasterId !== "") {
          fabricMasterIdToUse = detail.fabricMasterId;
        }

        if (fabricMasterIdToUse != null) {
          const fmRaw: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
          const fm = fmRaw.find((f: any) => Number(f.id) === Number(fabricMasterIdToUse));
          if (fm) {
            const code = String(fm.fabricCode || fm.fabric_code || fm.code || "").trim();
            const qual = String(fm.fabricQuality || fm.quality || fm.fabric_quality || "").trim();
            return [code, qual].filter(Boolean).join(" - ");
          }
        }

        // Fallback to original logic if no fabric master found
        return String(detail?.fabricCodeQuality || "").trim();
      })
      .filter(Boolean);

    const uniq = (a: string[]) => Array.from(new Set(a));
    const beamFlange = [uniq(beams).join(", "), uniq(flanges).join(", ")].filter(Boolean).join(" / ");
    const code = uniq(codes)[0] || "";
    const picksVal = normalized.find(ctx => ctx.detail?.gatingPicks != null)?.detail?.gatingPicks;

    const warpInfos = normalized.map(ctx => getEffectiveWarpYarnInfo(loomId, ctx.flangeId, ctx.beamNo, ctx.detail));
    const sizingSetNos = uniq(warpInfos.map(w => w.sizingSetNo).filter(v => v && v !== '-'));
    const warpMills = uniq(warpInfos.map(w => w.warpYarnMillName).filter(v => v && v !== '-'));
    const warpLots = uniq(warpInfos.map(w => w.warpYarnLotNo).filter(v => v && v !== '-'));
    const warpCounts = uniq(warpInfos.map(w => w.warpCount).filter(v => v && v !== '-'));

    const fallbackWarp = (sizingSetNos.length === 0 || warpMills.length === 0)
      ? getEffectiveWarpYarnInfo(loomId)
      : null;

    const finalSizingSetNo = sizingSetNos.join(', ') || (fallbackWarp?.sizingSetNo !== '-' ? fallbackWarp?.sizingSetNo : '') || '';
    const finalWarpMill = warpMills.join(', ') || (fallbackWarp?.warpYarnMillName !== '-' ? fallbackWarp?.warpYarnMillName : '') || '';
    const finalWarpLot = warpLots.join(', ') || (fallbackWarp?.warpYarnLotNo !== '-' ? fallbackWarp?.warpYarnLotNo : '') || '';
    const finalWarpCount = warpCounts.join(', ') || (fallbackWarp?.warpCount !== '-' ? fallbackWarp?.warpCount : '') || '';

    return {
      beamNoFlange: beamFlange,
      fabricCodeQuality: code,
      doffingPicks: picksVal != null ? String(picksVal) : "",
      noOfFabricOutput: outputString,
      beamContexts: normalized,
      sizingSetNo: finalSizingSetNo,
      warpMillName: finalWarpMill,
      warpLotNo: finalWarpLot,
      warpCount: finalWarpCount,
    };
  };

  useEffect(() => {
    setRows(prev => {
      let changed = false;
      const next = prev.map(row => {
        if (!row.loomId) return row;
        const contexts = getBeamContextsForLoom(row.loomId);
        const gatingValue = getFabricOutputForLoom(row.loomId, contexts.length);
        const expected = gatingValue != null ? String(gatingValue) : String(contexts.length);
        if (row.noOfFabricOutput === expected) return row;
        changed = true;
        return { ...row, noOfFabricOutput: expected };
      });
      return changed ? next : prev;
    });
  }, [getBeamContextsForLoom, getFabricOutputForLoom]);

  const handleRowChange = (idx: number, field: keyof DoffingRow, value: string) => {
    setRows(prev => {
      const next = [...prev];
      const row = { ...next[idx], [field]: value } as DoffingRow;
      if (field === "loomId") {
        const a = autofillForLoom(value, row.doffingDate);
        row.beamNoFlange = a.beamNoFlange;
        row.fabricCodeQuality = a.fabricCodeQuality;
        row.doffingPicks = a.doffingPicks;
        row.noOfFabricOutput = a.noOfFabricOutput;
        row.beamContexts = a.beamContexts;
        row.sizingSetNo = a.sizingSetNo;
        row.warpMillName = a.warpMillName;
        row.warpLotNo = a.warpLotNo;
        row.warpCount = a.warpCount;
        row.remainingMtr = "";
      }
      if (field === "pieceNumber") {
        const dup = isDuplicatePiece(value);
        setDuplicateError(dup ? "This piece no already exist." : "");
      }
      next[idx] = row;
      return next;
    });
  };

  const onPieceInputChange = (idx: number, value: string) => {
    handleRowChange(idx, "pieceNumber", value);
    setSugRow(idx);
    const v = String(value || "").toLowerCase();
    const filtered = allPieceSuggestions.filter(s => s.toLowerCase().includes(v));
    setFilteredSuggestions(filtered.slice(0, 50));
    setActiveSuggestionIndex(filtered.length ? 0 : -1);
    setShowSuggestions(true);
    updateSuggestionPos();
  };

  useEffect(() => {
    if (!showSuggestions) return;
    const h = () => updateSuggestionPos();
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    h();
    return () => {
      window.removeEventListener('scroll', h, true);
      window.removeEventListener('resize', h);
    };
  }, [showSuggestions]);

  const handlePieceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (!showSuggestions || sugRow !== idx || filteredSuggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex(i => Math.min(filteredSuggestions.length - 1, (i < 0 ? 0 : i + 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex(i => Math.max(0, (i <= 0 ? 0 : i - 1)));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = filteredSuggestions[activeSuggestionIndex];
      if (sel) {
        handleRowChange(idx, "pieceNumber", sel);
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    }
  };

  const handleSuggestionClick = (s: string) => {
    if (sugRow == null) return;
    handleRowChange(sugRow, "pieceNumber", s);
    const dup = isDuplicatePiece(s);
    setDuplicateError(dup ? "This piece no already exist." : "");
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const save = async () => {
    const hasInvalid = rows.some(r => !r.warehouseId || !r.pieceMeter || Number(r.pieceMeter) <= 0);
    if (hasInvalid) {
      alert("Warehouse and Meter are mandatory.");
      return;
    }
    const hasInvalidRemaining = rows.some((row) => {
      const value = String(row.remainingMtr ?? "").trim();
      return value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0);
    });
    if (hasInvalidRemaining) {
      alert("Remaining Mtr must be a non-negative number.");
      return;
    }

    const validRows = rows
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => row.loomId && row.pieceMeter && Number(row.pieceMeter) > 0 && row.warehouseId);
    if (!validRows.length) return;

    const editTokens = editIndex != null
      ? new Set(
        splitPieceNumberTokens(saved[editIndex]?.pieceNumber)
          .map(token => token.toLowerCase())
          .filter(Boolean),
      )
      : null;
    const duplicateAgainstExisting = validRows.find(({ row }) =>
      splitPieceNumberTokens(row.pieceNumber).some((token) => {
        const normalized = String(token || "").trim().toLowerCase();
        if (!normalized) return false;
        if (editTokens?.has(normalized)) {
          return false;
        }
        return existingPieceNumbers.has(normalized);
      }),
    );
    if (duplicateAgainstExisting) {
      setDuplicateError("This piece no already exist.");
      return;
    }

    let payloadId = doffingHistory.length ? Math.max(...doffingHistory.map((entry: any) => Number(entry.id) || 0)) + 1 : 1;
    if (editIndex != null) {
      payloadId = saved[editIndex]?.id ?? payloadId;
    }

    let resolvedDoffingNo = editIndex != null ? String(saved[editIndex]?.doffingNo || "") : "";

    if (!resolvedDoffingNo) {
      try {
        const response = await documentNumberService.generateDocumentNumber({
          screenName: "Doffing Entry"
        });
        resolvedDoffingNo = response.documentNumber;
      } catch (error) {
        console.error("Failed to generate doffing number:", error);
      }
    }

    if (!resolvedDoffingNo) {
      const firstRow = validRows[0].row;
      resolvedDoffingNo = `DOFF-${String(firstRow.doffingDate || "").replace(/-/g, "")}-${payloadId}`;
    }

    const v2 = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid2 = v2 ? Number(v2) : undefined;

    if (editIndex != null) {
      const payload = (() => {
        const r = validRows[0].row;
        const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
        const companyId = v ? Number(v) : undefined;

        const flRaw: any = flangeList as any;
        const flArr: any[] = Array.isArray(flRaw) ? flRaw : Array.isArray(flRaw?.data) ? flRaw.data : [];
        const bf = String(r.beamNoFlange || "");
        const [beamSection, flangeSection] = bf.split("/").map(x => String(x || "").trim());
        const beamNo = beamSection ? beamSection.split(",")[0].trim() : "";
        const flangeNo = flangeSection ? flangeSection.split(",")[0].trim() : "";
        const flangeObj = flArr.find((x: any) => String(x?.flangeNo || x?.flange_no || x?.no) === flangeNo);
        const selectedFlangeId = flangeObj?.id != null ? String(flangeObj.id) : "";

        const fmRaw: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
        const entered = String(r.fabricCodeQuality || "").trim();
        const enteredCode = entered.includes(" - ") ? entered.split(" - ")[0].trim() : entered;
        const fm = fmRaw.find((f: any) => String(f.fabricCode || f.fabric_code || f.code || "").trim().toLowerCase() === enteredCode.toLowerCase());
        const fabricMasterId = fm ? Number(fm.id) : null;

        const fiRaw: any = factoryBeamInwardList as any;
        const fiArr: any[] = Array.isArray(fiRaw) ? fiRaw : Array.isArray(fiRaw?.data) ? fiRaw.data : [];
        const matchesBeamDetail = (bd: any) => {
          const sizedMatch = String(bd?.sizedBeamNo || '').trim() === beamNo;
          const flangeIdMatch = selectedFlangeId ? String(bd?.flangeId || bd?.flange_id || '') === selectedFlangeId : false;
          const flangeNoMatch = flangeNo ? String(bd?.flangeNo || bd?.flange_no || '').trim() === flangeNo : false;
          return sizedMatch && (flangeIdMatch || flangeNoMatch);
        };
        const fiParent = fiArr.find((fi: any) => Array.isArray(fi?.beamInwardBeamDetails) && fi.beamInwardBeamDetails.some(matchesBeamDetail));
        const matchedBd = fiParent?.beamInwardBeamDetails?.find(matchesBeamDetail);
        const beamId = matchedBd?.id != null ? Number(matchedBd.id) : null;
        const detailFlangeId = matchedBd?.flangeId ?? matchedBd?.flange_id ?? matchedBd?.flange?.id ?? null;
        const wcId = fiParent?.weavingContractId ?? null;
        const wjoId = fiParent?.weavingWorkOrderId ?? null;
        const orderTypeId = fiParent?.orderTypeId ?? null;
        const flangeId = detailFlangeId != null ? Number(detailFlangeId) : (flangeObj?.id != null ? Number(flangeObj.id) : null);

        const wcArr: any[] = Array.isArray((weavingContractList as any)) ? (weavingContractList as any) : Array.isArray((weavingContractList as any)?.data) ? (weavingContractList as any).data : [];
        const wjoArr: any[] = Array.isArray((weavingJobWorkOrderList as any)) ? (weavingJobWorkOrderList as any) : Array.isArray((weavingJobWorkOrderList as any)?.data) ? (weavingJobWorkOrderList as any).data : [];
        const wc = wcArr.find((x: any) => String(x?.id) === String(wcId));
        const wjo = wjoArr.find((x: any) => String(x?.id) === String(wjoId));

        const contractNoFromBeam = fiParent?.weavingContractNo ?? fiParent?.contractNo ?? fiParent?.contract_no ?? null;
        const orderNoFromBeam = fiParent?.weavingWorkOrderNo ?? fiParent?.jobWorkOrderNo ?? fiParent?.orderNo ?? null;

        const derivedOrderNo = orderNoFromBeam ?? (wjo?.weavingWorkOrderNo || wjo?.jobWorkOrderNo || wjo?.orderNo || null);
        const derivedContractNo = contractNoFromBeam ?? (wc?.weavingContractNo || wc?.contractNo || null);

        const editingSaved = editIndex != null ? saved[editIndex] : null;
        const editLot = (editingSaved?.weftYarnLotNo && editingSaved.weftYarnLotNo !== '-') ? editingSaved.weftYarnLotNo : undefined;
        const editMill = (editingSaved?.weftYarnMillName && editingSaved.weftYarnMillName !== '-') ? editingSaved.weftYarnMillName : undefined;
        const editCount = (editingSaved?.weftCount && editingSaved.weftCount !== '-') ? editingSaved.weftCount : undefined;

        const editWeftYarnInfo = getEffectiveWeftYarnInfo(String(r.loomId || ""), beamId, matchedBd || latestGatingByLoom.get(String(r.loomId || "")));
        const editWarpYarnInfo = getEffectiveWarpYarnInfo(String(r.loomId || ""), beamId, beamNo, matchedBd || latestGatingByLoom.get(String(r.loomId || "")));
        const remInfo = getLoomRemainingInfo(String(r.loomId || ""), r.pieceMeter, editIndex != null ? saved[editIndex]?.id : null, r.beamContexts);

        const finalSizingSetNo = r.sizingSetNo || (editingSaved?.sizingSetNo && editingSaved.sizingSetNo !== '-') ? (r.sizingSetNo || editingSaved?.sizingSetNo) : (editWarpYarnInfo.sizingSetNo !== '-' ? editWarpYarnInfo.sizingSetNo : (matchedBd?.sizingSetNo || fiParent?.sizingSetNo));
        const finalWarpMill = r.warpMillName || (editingSaved?.warpMillName && editingSaved.warpMillName !== '-') ? (r.warpMillName || editingSaved?.warpMillName) : (editWarpYarnInfo.warpYarnMillName !== '-' ? editWarpYarnInfo.warpYarnMillName : matchedBd?.warpYarnMillName);
        const finalWarpLot = r.warpLotNo || (editingSaved?.warpLotNo && editingSaved.warpLotNo !== '-') ? (r.warpLotNo || editingSaved?.warpLotNo) : (editWarpYarnInfo.warpYarnLotNo !== '-' ? editWarpYarnInfo.warpYarnLotNo : matchedBd?.warpYarnLotNo);
        const finalWarpCount = r.warpCount || (editingSaved?.warpCount && editingSaved.warpCount !== '-') ? (r.warpCount || editingSaved?.warpCount) : (editWarpYarnInfo.warpCount !== '-' ? editWarpYarnInfo.warpCount : matchedBd?.warpCount);

        return {
          companyId,
          sourceType: "Factory-Fabric",
          isFactoryFabric: 1,
          doffingDate: r.doffingDate,
          doffingNo: resolvedDoffingNo,
          loomId: r.loomId ? Number(r.loomId) : null,
          beamNo: beamNo || null,
          flangeId: Number(flangeId),
          fabricMasterId,
          warehouseId: r.warehouseId ? Number(r.warehouseId) : null,
          doffingPicks: r.doffingPicks ? Number(r.doffingPicks) : 0,
          pieceNumber: r.pieceNumber,
          pieceMeter: r.pieceMeter ? Number(r.pieceMeter) : 0,
          remainingMtr: r.remainingMtr != null && String(r.remainingMtr).trim() !== ""
            ? Number(r.remainingMtr)
            : remInfo.currentRemaining,
          isLastPiece: String(r.isLastPiece || "0"),
          beamId,
          orderNo: derivedOrderNo,
          orderId: wjoId != null ? Number(wjoId) : undefined,
          contractNo: derivedContractNo,
          orderTypeId: orderTypeId != null ? Number(orderTypeId) : undefined,
          noOfFabricOutput: parseFabricOutput(r.noOfFabricOutput) ?? 0,
          sizingSetNo: finalSizingSetNo || undefined,
          sizing_set_no: finalSizingSetNo || undefined,
          warpSetNo: finalSizingSetNo || undefined,
          warp_set_no: finalSizingSetNo || undefined,
          warpCount: finalWarpCount || undefined,
          warp_count: finalWarpCount || undefined,
          warpMillName: finalWarpMill || undefined,
          warpYarnMillName: finalWarpMill || undefined,
          warp_mill_name: finalWarpMill || undefined,
          warp_yarn_mill_name: finalWarpMill || undefined,
          warpLotNo: finalWarpLot || undefined,
          warpYarnLotNo: finalWarpLot || undefined,
          warp_lot_no: finalWarpLot || undefined,
          warp_yarn_lot_no: finalWarpLot || undefined,
          weftCount: editCount || (editWeftYarnInfo.weftCount !== '-' ? editWeftYarnInfo.weftCount : matchedBd?.weftCount) || undefined,
          weftYarnMillName: editMill || (editWeftYarnInfo.weftYarnMillName !== '-' ? editWeftYarnInfo.weftYarnMillName : matchedBd?.weftYarnMillName) || undefined,
          weftYarnLotNo: editLot || (editWeftYarnInfo.weftYarnLotNo !== '-' ? editWeftYarnInfo.weftYarnLotNo : matchedBd?.weftYarnLotNo) || undefined,
        };
      })();

      const existingId = saved[editIndex]?.id != null ? Number(saved[editIndex].id) : undefined;
      if (existingId != null) {
        setEditIndex(null);
        dispatch(updateFactoryPieceEntry({ id: existingId, data: payload, companyId: cid2 }) as any).then(() => {
          refreshAll();
        });
      }
    } else {
      const flRaw: any = flangeList as any;
      const flArr: any[] = Array.isArray(flRaw) ? flRaw : Array.isArray(flRaw?.data) ? flRaw.data : [];
      const fiRaw: any = factoryBeamInwardList as any;
      const fiArr: any[] = Array.isArray(fiRaw) ? fiRaw : Array.isArray(fiRaw?.data) ? fiRaw.data : [];
      const fmRaw: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
      const wcArr: any[] = Array.isArray((weavingContractList as any)) ? (weavingContractList as any) : Array.isArray((weavingContractList as any)?.data) ? (weavingContractList as any).data : [];
      const wjoArr: any[] = Array.isArray((weavingJobWorkOrderList as any)) ? (weavingJobWorkOrderList as any) : Array.isArray((weavingJobWorkOrderList as any)?.data) ? (weavingJobWorkOrderList as any).data : [];
      const normalizeValue = (value: any) => String(value || "").trim();
      const findFlangeIdByNo = (flangeNo: string) => {
        if (!flangeNo) return null;
        const found = flArr.find((x: any) => String(x?.flangeNo || x?.flange_no || x?.no || "").trim() === flangeNo);
        return found?.id != null ? Number(found.id) : null;
      };
      const resolveBeamMatch = (beamNo?: string, flangeNo?: string, flangeIdHint?: string) => {
        const normBeam = normalizeValue(beamNo);
        const normFlange = normalizeValue(flangeNo);
        const normFlangeId = normalizeValue(flangeIdHint);
        if (normBeam) {
          const matchesBeamDetail = (bd: any) => {
            const sizedMatch = String(bd?.sizedBeamNo || bd?.beamNo || bd?.beam_no || "").trim() === normBeam;
            if (!sizedMatch) return false;
            if (normFlangeId) {
              const detailFlangeId = String(bd?.flangeId ?? bd?.flange?.id ?? bd?.flange_id ?? "");
              if (detailFlangeId === normFlangeId) return true;
            }
            if (normFlange) {
              const detailFlangeNo = String(bd?.flangeNo || bd?.flange?.flangeNo || bd?.flange?.flange_no || "").trim();
              if (detailFlangeNo && detailFlangeNo === normFlange) return true;
            }
            return false;
          };
          for (const fi of fiArr) {
            const beamDetails: any[] = Array.isArray(fi?.beamInwardBeamDetails)
              ? fi.beamInwardBeamDetails
              : Array.isArray(fi?.beamDetails)
                ? fi.beamDetails
                : [];
            const matched = beamDetails.find(matchesBeamDetail);
            if (matched) {
              const detailFlangeId = matched?.flangeId ?? matched?.flange?.id ?? matched?.flange_id ?? null;
              return { beamId: matched.id != null ? Number(matched.id) : null, flangeId: detailFlangeId != null ? Number(detailFlangeId) : null, parent: fi };
            }
          }
        }
        const fallbackFlangeId = normFlangeId ? Number(normFlangeId) : findFlangeIdByNo(normFlange);
        return { beamId: null, flangeId: fallbackFlangeId, parent: undefined };
      };
      const buildMetaForRow = (row: DoffingRow, parent: any) => {
        const entered = String(row.fabricCodeQuality || "").trim();
        const enteredCode = entered.includes(" - ") ? entered.split(" - ")[0].trim() : entered;
        const fm = fmRaw.find((f: any) => String(f.fabricCode || f.fabric_code || f.code || "").trim().toLowerCase() === enteredCode.toLowerCase());
        const fabricMasterId = fm ? Number(fm.id) : null;
        const wcId = parent?.weavingContractId ?? null;
        const wjoId = parent?.weavingWorkOrderId ?? null;
        const orderTypeId = parent?.orderTypeId ?? null;
        const wc = wcArr.find((x: any) => String(x?.id) === String(wcId));
        const wjo = wjoArr.find((x: any) => String(x?.id) === String(wjoId));
        const contractNoFromBeam = parent?.weavingContractNo ?? parent?.contractNo ?? parent?.contract_no ?? null;
        const orderNoFromBeam = parent?.weavingWorkOrderNo ?? parent?.jobWorkOrderNo ?? parent?.orderNo ?? null;
        const derivedOrderNo = orderNoFromBeam ?? (wjo?.weavingWorkOrderNo || wjo?.jobWorkOrderNo || wjo?.orderNo || null);
        const derivedContractNo = contractNoFromBeam ?? (wc?.weavingContractNo || wc?.contractNo || null);
        const rawFabricOutput = String(row.noOfFabricOutput ?? "").trim();
        const parsedFabricOutput = rawFabricOutput !== "" ? Number(rawFabricOutput) : undefined;
        const normalizedFabricOutput =
          parsedFabricOutput != null && Number.isFinite(parsedFabricOutput) ? parsedFabricOutput : undefined;
        return {
          companyId: cid2,
          sourceType: "Factory-Fabric",
          isFactoryFabric: 1,
          doffingDate: row.doffingDate,
          doffingNo: resolvedDoffingNo,
          loomId: row.loomId ? Number(row.loomId) : null,
          fabricMasterId,
          warehouseId: row.warehouseId ? Number(row.warehouseId) : null,
          doffingPicks: row.doffingPicks ? Number(row.doffingPicks) : 0,
          pieceMeter: row.pieceMeter ? Number(row.pieceMeter) : 0,
          isLastPiece: String(row.isLastPiece || "0"),
          noOfFabricOutput: normalizedFabricOutput,
          orderNo: derivedOrderNo,
          orderId: wjoId != null ? Number(wjoId) : undefined,
          contractNo: derivedContractNo,
          orderTypeId: orderTypeId != null ? Number(orderTypeId) : undefined,
        };
      };

      const payloads: any[] = [];
      validRows.forEach(({ row, idx: rowIdx }) => {
        const beamNoParts = String(row.beamNoFlange || "").split("/").map(x => String(x || "").trim());
        const beamSection = beamNoParts[0] || "";
        const flangeSection = beamNoParts[1] || "";
        const fallbackBeamNo = beamSection ? beamSection.split(",")[0].trim() : "";
        const fallbackFlangeNo = flangeSection ? flangeSection.split(",")[0].trim() : "";
        const contexts = row.beamContexts?.filter(ctx => Boolean(ctx.beamNo || ctx.flangeNo)) ?? [];
        const beamList = contexts.length ? contexts : [{ beamNo: fallbackBeamNo, flangeNo: fallbackFlangeNo, flangeId: null, detail: null }];
        const contextMatches = beamList.map(ctx => resolveBeamMatch(ctx.beamNo || fallbackBeamNo, ctx.flangeNo || fallbackFlangeNo, ctx.flangeId != null ? String(ctx.flangeId) : ""));
        const metaMatch = contextMatches.find(match => !!match.parent) ?? resolveBeamMatch(fallbackBeamNo, fallbackFlangeNo, contexts[0]?.flangeId != null ? String(contexts[0].flangeId) : "");
        const meta = buildMetaForRow(row, metaMatch.parent);
        const explicitCount = meta.noOfFabricOutput != null && meta.noOfFabricOutput > 0 ? meta.noOfFabricOutput : undefined;
        const outputCount = explicitCount ?? Math.max(1, beamList.length);
        const pieceTokens = ensurePieceNumberTokens(row, outputCount, rowIdx);
        for (let entryIdx = 0; entryIdx < outputCount; entryIdx += 1) {
          const ctx = beamList[entryIdx] ?? beamList[0];
          const match = resolveBeamMatch(ctx?.beamNo || fallbackBeamNo, ctx?.flangeNo || fallbackFlangeNo, ctx?.flangeId != null ? String(ctx?.flangeId) : "");
          const detail = ctx?.detail;
          const pieceToken = pieceTokens[entryIdx] ?? (pieceTokens.length === 1 ? pieceTokens[0] : pieceTokens[entryIdx] ?? row.pieceNumber);
          const yarnInfo = getEffectiveWeftYarnInfo(row.loomId, match.beamId, detail || latestGatingByLoom.get(String(row.loomId)));
          const warpInfo = getEffectiveWarpYarnInfo(row.loomId, match.beamId, (ctx?.beamNo || fallbackBeamNo), detail || latestGatingByLoom.get(String(row.loomId)));
          const remInfo = getLoomRemainingInfo(row.loomId, row.pieceMeter, null, row.beamContexts);

          const finalSizingSetNo = row.sizingSetNo || (warpInfo.sizingSetNo !== '-' ? warpInfo.sizingSetNo : (detail?.sizingSetNo || metaMatch?.parent?.sizingSetNo));
          const finalWarpMill = row.warpMillName || (warpInfo.warpYarnMillName !== '-' ? warpInfo.warpYarnMillName : detail?.warpYarnMillName);
          const finalWarpLot = row.warpLotNo || (warpInfo.warpYarnLotNo !== '-' ? warpInfo.warpYarnLotNo : detail?.warpYarnLotNo);
          const finalWarpCount = row.warpCount || (warpInfo.warpCount !== '-' ? warpInfo.warpCount : detail?.warpCount);

          payloads.push({
            ...meta,
            beamNo: (ctx?.beamNo || fallbackBeamNo) || null,
            flangeId: match.flangeId != null ? Number(match.flangeId) : null,
            beamId: match.beamId,
            pieceNumber: pieceToken || row.pieceNumber,
            remainingMtr: row.remainingMtr != null && String(row.remainingMtr).trim() !== ""
              ? Number(row.remainingMtr)
              : remInfo.currentRemaining,
            sizingSetNo: finalSizingSetNo || undefined,
            sizing_set_no: finalSizingSetNo || undefined,
            warpSetNo: finalSizingSetNo || undefined,
            warp_set_no: finalSizingSetNo || undefined,
            warpCount: finalWarpCount || undefined,
            warp_count: finalWarpCount || undefined,
            warpMillName: finalWarpMill || undefined,
            warpYarnMillName: finalWarpMill || undefined,
            warp_mill_name: finalWarpMill || undefined,
            warp_yarn_mill_name: finalWarpMill || undefined,
            warpLotNo: finalWarpLot || undefined,
            warpYarnLotNo: finalWarpLot || undefined,
            warp_lot_no: finalWarpLot || undefined,
            warp_yarn_lot_no: finalWarpLot || undefined,
            weftCount: (yarnInfo.weftCount !== '-' ? yarnInfo.weftCount : detail?.weftCount) || undefined,
            weftYarnMillName: (yarnInfo.weftYarnMillName !== '-' ? yarnInfo.weftYarnMillName : detail?.weftYarnMillName) || undefined,
            weftYarnLotNo: (yarnInfo.weftYarnLotNo !== '-' ? yarnInfo.weftYarnLotNo : detail?.weftYarnLotNo) || undefined,
          });
        }
      });
      // alert(JSON.stringify(payloads, null, 2));
      // console.log("Prepared payloads for creation:", payloads);
      if (payloads.length) {
        Promise.all(payloads.map(payload => dispatch(createFactoryPieceEntry(payload) as any))).then(() => {
          setDoffingPage(0);
          refreshAll(0);
        });
      }
    }

    const today = new Date().toISOString().split("T")[0];
    setRows([{ doffingDate: today, loomId: "", beamNoFlange: "", fabricCodeQuality: "", doffingPicks: "", pieceNumber: "", pieceMeter: "", warehouseId: "", isLastPiece: "0", noOfFabricOutput: "0", beamContexts: [], sizingSetNo: "", warpMillName: "", warpLotNo: "", warpCount: "" }]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");
  };

  const edit = (i: number) => {
    const it = saved[i];
    setEditIndex(i);
    setRows([{
      doffingDate: it.doffingDate,
      loomId: it.loomId,
      beamNoFlange: it.beamNoFlange,
      fabricCodeQuality: it.fabricCodeQuality,
      doffingPicks: it.doffingPicks,
      pieceNumber: it.pieceNumber,
      pieceMeter: it.pieceMeter,
      remainingMtr: it.remainingMtr ?? "",
      warehouseId: String((it as any).warehouseId || ""),
      isLastPiece: (it as any).isLastPiece ?? "0",
      noOfFabricOutput: String((it as any).noOfFabricOutput || "0"),
      beamContexts: it.beamContexts || [],
      sizingSetNo: it.sizingSetNo || '',
      warpMillName: it.warpMillName || '',
      warpLotNo: it.warpLotNo || '',
      warpCount: it.warpCount || '',
    }]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const del = (i: number) => {
    const it = saved[i];
    if (!it) return;
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    dispatch(deleteFactoryPieceEntry({ id: Number(it.id), companyId: cid }) as any)
      .unwrap()
      .then(() => {
        setSaved(prev => prev.filter((_, ix) => ix !== i));
        setDoffingRowCache((current) => {
          const next = new Map(current);
          next.delete(Number(it.id));
          return next;
        });
        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(Number(it.id));
          return next;
        });
        refreshAll();
      })
      .catch(() => {
        // Error toast is handled in slice; keep current list unchanged.
      });
  };

  useEffect(() => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;

    const raw: any[] = Array.isArray(pieceEntryList)
      ? pieceEntryList
      : Array.isArray((pieceEntryList as any)?.data)
        ? (pieceEntryList as any).data
        : [];

    const flRaw: any = flangeList as any;
    const flArr: any[] = Array.isArray(flRaw) ? flRaw : Array.isArray(flRaw?.data) ? flRaw.data : [];

    const fmRaw: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];

    const mapped: SavedEntry[] = (cid ? raw.filter((x: any) => Number(x.companyId) === cid) : raw).map((p: any) => {
      const beamDetailId = p?.beamId ?? p?.beam_id;
      const detail = beamDetailId != null ? beamDetailLookup.get(String(beamDetailId)) : undefined;
      const detailFlangeNo = detail?.flangeNo ?? detail?.flange_no ?? detail?.flange?.flangeNo ?? detail?.flange?.flange_no ?? "";
      const fallbackFlangeId = p?.flangeId ?? p?.flange_id;
      const computedFlangeNo = detailFlangeNo || (fallbackFlangeId != null ? flangeNoById.get(String(fallbackFlangeId)) || "" : "");
      const fallbackBeamNo = String(p.beamNo || p.sizedBeamNo || p.beam?.beamNo || p.beam?.beam_no || "").trim();
      const normalizedDetail = detail ?? p;
      const beamContext = (() => {
        const beamNo = fallbackBeamNo;
        const flangeNo = String(computedFlangeNo || "").trim();
        const flangeId = fallbackFlangeId != null ? Number(fallbackFlangeId) : null;
        if (!beamNo && !flangeNo) return null;
        return { beamNo, flangeNo, flangeId, detail: normalizedDetail } as BeamContext;
      })();
      const beamContexts = beamContext ? [beamContext] : [];
      const fabricOutput = p.noOfFabricOutput != null ? String(p.noOfFabricOutput) : String(beamContexts.length);
      const fm = fmRaw.find((f: any) => Number(f.id) === Number(p?.fabricMasterId));
      const code = String(fm?.fabricCode || fm?.fabric_code || fm?.code || "").trim();
      const qual = String(fm?.fabricQuality || fm?.quality || fm?.fabric_quality || "").trim();
      const fabricLabel = [code, qual].filter(Boolean).join(" - ");
      const isInspected = Number(p.isInspected ?? p.is_inspected ?? 0);
      const isRejected = Number(p.isRejected ?? p.is_rejected ?? 0);
      const resolvedDoffingNo = String(p.doffingNo || p.doffing_no || "");

      const storedRemaining = p.remainingMtr ?? p.remaining_mtr;

      return {
        id: Number(p.id),
        doffingDate: String(p.doffingDate || ""),
        loomId: String(p.loomId || ""),
        warehouseId: String(p.warehouseId || ""),
        beamNoFlange: [String(p.beamNo || "").trim(), String(computedFlangeNo).trim()].filter(Boolean).join(" / "),
        fabricCodeQuality: fabricLabel || code,
        doffingPicks: String(p.doffingPicks ?? ""),
        pieceNumber: String(p.pieceNumber || p.pieceNo || ""),
        pieceMeter: String(p.pieceMeter ?? p.inspectedMtr ?? p.quantity ?? ""),
        remainingMtr: storedRemaining != null && storedRemaining !== "" ? storedRemaining : null,
        isLastPiece: String(p.isLastPiece ?? "0"),
        noOfFabricOutput: fabricOutput,
        beamContexts,
        modeId: Number((p as any).modeId ?? (p as any).mode_id) || undefined,
        beamId: (p.beamId != null ? Number(p.beamId) : null),
        isInspected,
        isRejected,
        doffingNo: resolvedDoffingNo,
        sizingSetNo: p.sizingSetNo || p.sizing_set_no || p.warpSetNo || p.warp_set_no || undefined,
        warpMillName: p.warpMillName || p.warp_mill_name || p.warpYarnMillName || p.warp_yarn_mill_name || undefined,
        warpLotNo: p.warpLotNo || p.warp_lot_no || p.warpYarnLotNo || p.warp_yarn_lot_no || undefined,
        warpCount: p.warpCount || p.warp_count || undefined,
        weftYarnLotNo: p.weftYarnLotNo || p.weft_yarn_lot_no || undefined,
        weftYarnMillName: p.weftYarnMillName || p.weft_yarn_mill_name || undefined,
        weftCount: p.weftCount || p.weft_count || undefined,
      } as SavedEntry;
    });

    setSaved(mapped);
  }, [pieceEntryList, flangeList, fabricMasterList, beamDetailLookup, flangeNoById]);

  const closedBeamIds = useMemo(() => {
    const s = new Set<number>();
    doffingHistory.forEach((x: any) => {
      if (String(x.isLastPiece || "0") === "1" && x.beamId != null) s.add(Number(x.beamId));
    });
    return s;
  }, [doffingHistory]);

  const doffingListRows = useMemo(() => {
    return saved.map((s, idx) => {
      const [beam, flange] = String(s.beamNoFlange || "").split("/").map(part => (part || "").trim());
      const loomName = loomLabelMap.get(String(s.loomId || "")) || String(s.loomId || "");
      const warehouseName = warehouseLabelMap.get(String(s.warehouseId || "")) || String(s.warehouseId || "");
      const materialCodeQuality = String(s.fabricCodeQuality || "");
      const sepIdx = materialCodeQuality.indexOf(" - ");
      const fabricCodeValue = sepIdx >= 0 ? materialCodeQuality.slice(0, sepIdx).trim() : materialCodeQuality.trim();
      const fabricQualityValue = sepIdx >= 0 ? materialCodeQuality.slice(sepIdx + 3).trim() : "";
      const barcodeValue = s.pieceNumber || s.doffingNo || `DOFF-${s.id}`;
      const meterValue = s.pieceMeter || String((s as any).quantity ?? "");
      const pieceToken = splitPieceNumberTokens(s.pieceNumber || "")[0]?.toLowerCase();
      const pieceEntryData = pieceToken ? pieceEntryWeightLookup.get(pieceToken) : undefined;
      const netWeightSource = pieceEntryData?.inspectedNtWt ?? (s as any).inspectedNtWt ?? (s as any).inspectedNetWt;
      const weightVal = pieceEntryData?.weight;
      const meterNum = parseFloat(meterValue);
      const avgWeight = (weightVal != null && !isNaN(weightVal) && meterNum > 0)
        ? (weightVal / meterNum).toFixed(3)
        : "-";
      const gradeId = pieceEntryData?.gradeId;
      const gradeName = gradeId != null ? (gradeMap.get(Number(gradeId)) ?? undefined) : undefined;
      const pieceEntry: FabricBarcodePiece = {
        barcode: barcodeValue,
        fabricCode: fabricCodeValue || materialCodeQuality || "",
        fabricQuality: fabricQualityValue || "",
        meter: meterValue || undefined,
        netWeight: netWeightSource || undefined,
        avgWeight: avgWeight !== "-" ? avgWeight : undefined,
        grade: gradeName,
        companyId: selectedCompanyId,
      };
      const link = getFabricBarcodeLink({
        barcode: barcodeValue,
        fabricCode: fabricCodeValue || materialCodeQuality || "",
        fabricQuality: fabricQualityValue,
        meter: meterValue || undefined,
        netWeight: netWeightSource || undefined,
        avgWeight: avgWeight !== "-" ? avgWeight : undefined,
        grade: gradeName,
        companyId: selectedCompanyId,
        pieceEntries: [pieceEntry],
      });
      const modeId = Number((s as any).modeId ?? (s as any).mode_id);
      const isInspected = Number((s as any).isInspected ?? (s as any).is_inspected ?? 0);
      const isRejected = Number((s as any).isRejected ?? (s as any).is_rejected ?? 0);
      const isLastPieceFlag = String((s as any).isLastPiece || "0") === "1";
      const savedLot = (s.weftYarnLotNo && s.weftYarnLotNo !== '-') ? s.weftYarnLotNo : null;
      const savedMill = (s.weftYarnMillName && s.weftYarnMillName !== '-') ? s.weftYarnMillName : null;
      const savedCount = (s.weftCount && s.weftCount !== '-') ? s.weftCount : null;

      const savedSizingSetNo = (s.sizingSetNo && s.sizingSetNo !== '-') ? s.sizingSetNo : null;
      const savedWarpMill = (s.warpMillName && s.warpMillName !== '-') ? s.warpMillName : null;
      const savedWarpLot = (s.warpLotNo && s.warpLotNo !== '-') ? s.warpLotNo : null;
      const savedWarpCount = (s.warpCount && s.warpCount !== '-') ? s.warpCount : null;

      const gating = latestGatingByLoom.get(String(s.loomId || ''));
      const fallbackDetail = s.beamContexts?.[0]?.detail;
      const fallbackEffective = (savedLot && savedMill && savedCount)
        ? null
        : getEffectiveWeftYarnInfo(String(s.loomId || ''), s.beamId, {
            weftYarnLotNo: fallbackDetail?.weftYarnLotNo || gating?.weftYarnLotNo,
            weftYarnMillName: fallbackDetail?.weftYarnMillName || gating?.weftYarnMillName,
            weftCount: fallbackDetail?.weftCount || gating?.weftCount,
          });

      const fallbackWarpEffective = (savedSizingSetNo && savedWarpMill && savedWarpLot && savedWarpCount)
        ? null
        : getEffectiveWarpYarnInfo(String(s.loomId || ''), s.beamId, beam, fallbackDetail);

      const displayWeftLotNo = savedLot || fallbackEffective?.weftYarnLotNo || '-';
      const displayWeftMillName = savedMill || fallbackEffective?.weftYarnMillName || '-';
      const displayWeftCount = savedCount || fallbackEffective?.weftCount || '-';

      const displaySizingSetNo = savedSizingSetNo || fallbackWarpEffective?.sizingSetNo || '-';
      const displayWarpMillName = savedWarpMill || fallbackWarpEffective?.warpYarnMillName || '-';
      const displayWarpLotNo = savedWarpLot || fallbackWarpEffective?.warpYarnLotNo || '-';
      const displayWarpCount = savedWarpCount || fallbackWarpEffective?.warpCount || '-';

      const storedRemStr = s.remainingMtr != null && s.remainingMtr !== ''
        ? (typeof s.remainingMtr === 'number' ? (Number.isInteger(s.remainingMtr) ? String(s.remainingMtr) : s.remainingMtr.toFixed(3)) : String(s.remainingMtr))
        : null;

      const remainingInfo = getLoomRemainingInfo(String(s.loomId || ""), s.pieceMeter, s.id, s.beamContexts);

      return {
        serialNo: (Number(doffingPagination?.offset) || 0) + idx + 1,
        doffingDate: s.doffingDate,
        doffingNo: s.doffingNo || "",
        loomName,
        warehouseName: warehouseName || "-",
        beamNo: beam || "-",
        flangeNo: flange || "-",
        sizingSetNo: displaySizingSetNo,
        warpMillName: displayWarpMillName,
        warpLotNo: displayWarpLotNo,
        warpCount: displayWarpCount,
        weftYarnLotNo: displayWeftLotNo,
        weftYarnMillName: displayWeftMillName,
        weftCount: displayWeftCount,
        fabricCodeQuality: s.fabricCodeQuality || "-",
        pieceNumber: s.pieceNumber,
        pieceMeter: s.pieceMeter,
        remainingMtr: storedRemStr || remainingInfo.formattedCurrentRemaining,
        doffingPicks: s.doffingPicks,
        isLastPiece: isLastPieceFlag ? "Yes" : "No",
        avgWeight,
        barcodeLink: link,
        isLastPieceFlag,
        modeId,
        isInspected,
        isRejected,
        originalIndex: idx,
        entryId: s.id,
        netWeight: netWeightSource || undefined,
        weightValue: weightVal,
      };
    });
  }, [saved, loomLabelMap, warehouseLabelMap, pieceEntryWeightLookup, gradeMap, selectedCompanyId, latestGatingByLoom, getEffectiveWeftYarnInfo, getEffectiveWarpYarnInfo, getLoomRemainingInfo, doffingPagination?.offset]);

  useEffect(() => {
    setDoffingRowCache((current) => {
      const next = new Map(current);
      doffingListRows.forEach((row: any) => {
        if (row.entryId != null) next.set(Number(row.entryId), row);
      });
      return next;
    });
  }, [doffingListRows]);

  const extractPieceEntriesForRow = useCallback((row: any): FabricBarcodePiece[] => {
    const barcodeValue = row.pieceNumber || row.doffingNo || (row.entryId != null ? `DOFF-${row.entryId}` : '');
    if (!barcodeValue) return [];
    const [fabricCode, fabricQuality] = String(row.fabricCodeQuality || '').split(' - ');
    const pieceToken = splitPieceNumberTokens(row.pieceNumber || '')[0]?.toLowerCase();
    const pieceEntryData = pieceToken ? pieceEntryWeightLookup.get(pieceToken) : undefined;
    const netWeight = row.netWeight ?? pieceEntryData?.inspectedNtWt ?? pieceEntryData?.netWeight;
    return [{
      barcode: barcodeValue,
      fabricCode: fabricCode || row.fabricCodeQuality || '',
      fabricQuality: fabricQuality || '',
      meter: row.pieceMeter || undefined,
      netWeight: netWeight ?? undefined,
      companyId: selectedCompanyId,
      avgWeight: row.weightValue ?? pieceEntryData?.weight ?? undefined,
    }];
  }, [pieceEntryWeightLookup, selectedCompanyId]);

  const handleToggleRow = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean, data: any[]) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      data.forEach((row: any) => {
        const id = Number(row.id);
        if (!Number.isFinite(id)) return;
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleCancelSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const cancelEdit = () => {
    const today = new Date().toISOString().split("T")[0];
    setEditIndex(null);
    setRows([{ doffingDate: today, loomId: "", beamNoFlange: "", fabricCodeQuality: "", doffingPicks: "", pieceNumber: "", pieceMeter: "", warehouseId: defaultFabricWarehouseId || "", isLastPiece: "0", noOfFabricOutput: "0", beamContexts: [], sizingSetNo: "", warpMillName: "", warpLotNo: "", warpCount: "" }]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");
  };

  const filteredMobileRows = useMemo(() => {
    if (!mobileSearch.trim()) return doffingListRows;
    const q = mobileSearch.toLowerCase().trim();
    return doffingListRows.filter((r: any) => {
      return (
        String(r.pieceNumber || '').toLowerCase().includes(q) ||
        String(r.loomName || '').toLowerCase().includes(q) ||
        String(r.doffingNo || '').toLowerCase().includes(q) ||
        String(r.fabricCodeQuality || '').toLowerCase().includes(q) ||
        String(r.beamNo || '').toLowerCase().includes(q) ||
        String(r.warehouseName || '').toLowerCase().includes(q) ||
        String(r.sizingSetNo || '').toLowerCase().includes(q) ||
        String(r.warpMillName || '').toLowerCase().includes(q) ||
        String(r.warpLotNo || '').toLowerCase().includes(q) ||
        String(r.warpCount || '').toLowerCase().includes(q) ||
        String(r.weftYarnLotNo || '').toLowerCase().includes(q) ||
        String(r.weftYarnMillName || '').toLowerCase().includes(q) ||
        String(r.weftCount || '').toLowerCase().includes(q)
      );
    });
  }, [doffingListRows, mobileSearch]);

  const totalMobilePages = Math.ceil(filteredMobileRows.length / mobilePageSize) || 1;
  const paginatedMobileRows = useMemo(() => {
    const start = (mobilePage - 1) * mobilePageSize;
    return filteredMobileRows.slice(start, start + mobilePageSize);
  }, [filteredMobileRows, mobilePage, mobilePageSize]);
  const totalDoffingPages = Math.max(1, Math.ceil((Number(doffingPagination?.total) || 0) / doffingPageSize));

  useEffect(() => {
    setMobilePage(1);
  }, [doffingPage]);

  useEffect(() => {
    const lastPage = Math.max(0, totalDoffingPages - 1);
    if (doffingPage > lastPage) setDoffingPage(lastPage);
  }, [doffingPage, totalDoffingPages]);

  const handleMobileExport = async () => {
    try {
      const endpoint = selectedCompanyId ? `/piece-entries/company/${selectedCompanyId}` : "/piece-entries";
      const response = await apiService.get<any[]>(endpoint, { isFactoryFabric: 1 });
      const entries: any[] = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];
      const rawFabricMasters: any = fabricMasterList as any;
      const fabricMasters: any[] = Array.isArray(rawFabricMasters)
        ? rawFabricMasters
        : Array.isArray(rawFabricMasters?.data)
          ? rawFabricMasters.data
          : [];
      const fabricMasterById = new Map<number, any>();
      fabricMasters.forEach((fabric: any) => fabricMasterById.set(Number(fabric?.id), fabric));
      const exportData = entries
        .filter((entry: any) => Number(entry?.isFactoryFabric ?? entry?.is_factory_fabric) === 1)
        .map((entry: any, index: number) => {
          const loomId = String(entry?.loomId ?? entry?.loom_id ?? "");
          const warehouseId = String(entry?.warehouseId ?? entry?.warehouse_id ?? "");
          const fabricMasterId = Number(entry?.fabricMasterId ?? entry?.fabric_master_id);
          const fabricMaster = fabricMasterById.get(fabricMasterId);
          const fabricCodeQuality = entry?.fabricCodeQuality || entry?.fabric_code_quality ||
            [fabricMaster?.fabricCode || fabricMaster?.fabric_code, fabricMaster?.fabricQuality || fabricMaster?.quality].filter(Boolean).join(" - ");
          const meter = Number(entry?.pieceMeter ?? entry?.piece_meter ?? 0);
          const weight = Number(entry?.weight ?? 0);
          return {
            "S.No": index + 1,
            "Doffing Date": entry?.doffingDate ? formatDate(entry.doffingDate) : "",
            "Doffing No": entry?.doffingNo || entry?.doffing_no || "",
            "Loom No": loomLabelMap.get(loomId) || loomId,
            "Warehouse": warehouseLabelMap.get(warehouseId) || warehouseId,
            "Beam No": entry?.beamNo || entry?.beam_no || "",
            "Empty Beam No": entry?.flangeNo || entry?.flange_no || "",
            "Sizing Set No": entry?.sizingSetNo || entry?.sizing_set_no || "",
            "Warp Mill Name": entry?.warpMillName || entry?.warp_mill_name || entry?.warpYarnMillName || "",
            "Warp Lot No": entry?.warpLotNo || entry?.warp_lot_no || entry?.warpYarnLotNo || "",
            "Warp Count": entry?.warpCount || entry?.warp_count || "",
            "Weft Lot No": entry?.weftYarnLotNo || entry?.weft_yarn_lot_no || "",
            "Weft Mill Name": entry?.weftYarnMillName || entry?.weft_yarn_mill_name || "",
            "Weft Count": entry?.weftCount || entry?.weft_count || "",
            "Sort No - Construction": fabricCodeQuality || "",
            "Piece No": entry?.pieceNumber || entry?.piece_number || "",
            "Piece Meter": entry?.pieceMeter || entry?.piece_meter || "",
            "Remaining Mtr": entry?.remainingMtr ?? entry?.remaining_mtr ?? "",
            "Avg Weight": meter > 0 && weight > 0 ? (weight / meter).toFixed(3) : "",
            "Doffing Picks": entry?.doffingPicks || entry?.doffing_picks || "",
            "Is Last Piece": Number(entry?.isLastPiece ?? entry?.is_last_piece) === 1 ? "Yes" : "No",
          };
        });
      if (!exportData.length) return;
      exportToExcel(exportData, `Doffing_Entries_${new Date().toISOString().split('T')[0]}`);
    } catch (error) {
      console.error("Failed to export doffing entries:", error);
      toast.error("Unable to export doffing entries.");
    }
  };

  const totalBarcodeCount = useMemo(() => {
    let count = 0;
    for (const id of selectedIds) {
      const row = doffingRowCache.get(id);
      if (row) count += extractPieceEntriesForRow(row).length;
    }
    return count;
  }, [selectedIds, doffingRowCache, extractPieceEntriesForRow]);

  const handleOpenBarcodeStickerPage = useCallback(() => {
    const allEntries: FabricBarcodePiece[] = [];
    for (const id of selectedIds) {
      const row = doffingRowCache.get(id);
      if (row) allEntries.push(...extractPieceEntriesForRow(row));
    }
    if (!allEntries.length) return;
    const link = getFabricBarcodeLink({ barcode: allEntries[0].barcode, pieceEntries: allEntries, companyId: selectedCompanyId });
    if (link) window.open(link, '_blank');
    setIsBulkPrintModalOpen(false);
  }, [selectedIds, doffingRowCache, extractPieceEntriesForRow, selectedCompanyId]);

  const checkboxColumn = useMemo(() => ({
    id: 'bulkSelect',
    Header: (
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={doffingListRows.length > 0 && doffingListRows.every((row: any) => selectedIds.has(Number(row.entryId)))}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked, doffingListRows.map((row: any) => ({ id: row.entryId })))}
          className="w-3.5 h-3.5 cursor-pointer accent-black"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
        <span className="text-xs font-semibold">All</span>
      </div>
    ),
    accessor: 'checkboxId',
    disableFilters: true,
    width: 60,
    Cell: ({ row }: { row: any }) => {
      const id = row.original.entryId;
      if (id == null) return null;
      return (
        <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <input type="checkbox" checked={selectedIds.has(id)} onChange={() => handleToggleRow(id)} className="w-3.5 h-3.5 cursor-pointer accent-black" />
        </div>
      );
    }
  }), [doffingListRows, selectedIds, handleSelectAll, handleToggleRow]);

  const doffingColumns = useMemo(() => [
    { Header: 'S.No', accessor: 'serialNo' },
    {
      Header: 'Doffing Date',
      accessor: 'doffingDate',
      Cell: ({ value }: { value: string }) => value ? formatDate(value) : ""
    },
    { Header: 'Doffing No', accessor: 'doffingNo' },
    { Header: 'Loom No', accessor: 'loomName' },
    { Header: 'Warehouse', accessor: 'warehouseName' },
    { Header: 'Beam No', accessor: 'beamNo' },
    { Header: 'Empty Beam No', accessor: 'flangeNo' },
    { Header: 'Sizing Set No', accessor: 'sizingSetNo' },
    { Header: 'Warp Mill Name', accessor: 'warpMillName' },
    { Header: 'Warp Lot No', accessor: 'warpLotNo' },
    { Header: 'Warp Count', accessor: 'warpCount' },
    { Header: 'Weft Lot No', accessor: 'weftYarnLotNo' },
    { Header: 'Weft Mill Name', accessor: 'weftYarnMillName' },
    { Header: 'Weft Count', accessor: 'weftCount' },
    { Header: 'Sort No - Construction', accessor: 'fabricCodeQuality' },
    { Header: 'Piece No', accessor: 'pieceNumber' },
    { Header: 'Piece Meter', accessor: 'pieceMeter' },
    { Header: 'Remaining Mtr', accessor: 'remainingMtr' },
    { Header: 'Avg Weight', accessor: 'avgWeight' },
    { Header: 'Doffing Picks', accessor: 'doffingPicks' },
    { Header: 'Is last piece', accessor: 'isLastPiece' },
    {
      Header: 'Barcode',
      accessor: 'barcodeLink',
      Cell: ({ row }: any) => {
        const linkValue = row.original.barcodeLink;
        if (linkValue) {
          return (
            <a
              href={linkValue}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium text-sm"
            >
              Barcode
            </a>
          );
        }
        return <span className="text-xs text-secondary-500">-</span>;
      },
    },
    {
      Header: 'Action/Status',
      accessor: 'status',
      disableFilters: true,
      width: 'auto',
      Cell: ({ row }: any) => {
        const { modeId, isInspected, isRejected, originalIndex, isLastPieceFlag } = row.original;
        return (
          <div className="flex flex-wrap items-center gap-2">
            {modeId === 1 && (
              <span className="inline-block bg-green-100 text-green-700 border border-green-300 rounded px-2 py-1 text-xs font-semibold">Splitted</span>
            )}
            {modeId === 2 && (
              <span className="inline-block bg-green-100 text-green-700 border border-green-300 rounded px-2 py-1 text-xs font-semibold">Joined</span>
            )}
            {isRejected === 1 ? (
              <span className="inline-block bg-red-100 text-red-700 border border-red-300 rounded px-2 py-1 text-xs font-semibold">Rejected</span>
            ) : isInspected === 1 ? (
              <span className="inline-block bg-green-100 text-green-700 border border-green-300 rounded px-2 py-1 text-xs font-semibold">Inspected</span>
            ) : (
              <>
                {/* <span className="inline-block bg-yellow-100 text-yellow-700 border border-yellow-300 rounded px-2 py-1 text-xs font-semibold">Not Inspected</span> */}
                <div className="flex items-center space-x-2">
                  <button onClick={() => edit(originalIndex)} className="text-blue-500">
                    <Edit size={18} />
                  </button>
                  {!isLastPieceFlag && (
                    <button onClick={() => del(originalIndex)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      },
    },
  ], [del, edit]);

  const activeDoffingColumns = useMemo(() => {
    if (!selectMode) return doffingColumns;
    const filtered = doffingColumns.filter((c: any) => c.accessor !== 'barcodeLink');
    const actionsIdx = filtered.findIndex((c: any) => c.accessor === 'status' || c.accessor === 'actions' || c.id === 'actions');
    if (actionsIdx >= 0) return [...filtered.slice(0, actionsIdx), checkboxColumn, ...filtered.slice(actionsIdx)];
    return [...filtered, checkboxColumn];
  }, [selectMode, doffingColumns, checkboxColumn]);

  return (
    <div className="p-1 sm:p-3 md:p-6 pt-0 md:pt-2 -mt-16 md:mt-0">
      {(() => {
        const r = rows[0] || {
          doffingDate: '',
          loomId: '',
          beamNoFlange: '',
          fabricCodeQuality: '',
          doffingPicks: '',
          pieceNumber: '',
          pieceMeter: '',
          warehouseId: '',
          isLastPiece: '0',
          noOfFabricOutput: '0',
          beamContexts: [],
          sizingSetNo: '',
          warpMillName: '',
          warpLotNo: '',
          warpCount: '',
        };
        const hasCustomFabric = Boolean(r.fabricCodeQuality) && !fabricOptions.some(o => o.value === r.fabricCodeQuality);
        const fabricOptionsForRow = hasCustomFabric
          ? [...fabricOptions, { value: r.fabricCodeQuality, label: r.fabricCodeQuality }]
          : fabricOptions;
        const editingSaved = editIndex != null ? saved[editIndex] : null;
        const editLot = (editingSaved?.weftYarnLotNo && editingSaved.weftYarnLotNo !== '-') ? editingSaved.weftYarnLotNo : null;
        const editMill = (editingSaved?.weftYarnMillName && editingSaved.weftYarnMillName !== '-') ? editingSaved.weftYarnMillName : null;
        const editCount = (editingSaved?.weftCount && editingSaved.weftCount !== '-') ? editingSaved.weftCount : null;

        const fallbackWeftInfo = (editLot && editMill && editCount)
          ? null
          : getEffectiveWeftYarnInfo(r.loomId, null, r.beamContexts?.[0]?.detail || latestGatingByLoom.get(String(r.loomId)));

        const weftInfo = {
          weftYarnLotNo: editLot || fallbackWeftInfo?.weftYarnLotNo || '-',
          weftYarnMillName: editMill || fallbackWeftInfo?.weftYarnMillName || '-',
          weftCount: editCount || fallbackWeftInfo?.weftCount || '-',
        };

        const editSizingSetNo = (editingSaved?.sizingSetNo && editingSaved.sizingSetNo !== '-') ? editingSaved.sizingSetNo : null;
        const editWarpMill = (editingSaved?.warpMillName && editingSaved.warpMillName !== '-') ? editingSaved.warpMillName : null;
        const editWarpLot = (editingSaved?.warpLotNo && editingSaved.warpLotNo !== '-') ? editingSaved.warpLotNo : null;
        const editWarpCount = (editingSaved?.warpCount && editingSaved.warpCount !== '-') ? editingSaved.warpCount : null;

        const [beamFromFlange] = String(r.beamNoFlange || "").split("/").map(x => String(x || "").trim());
        const fallbackWarpInfo = (editSizingSetNo && editWarpMill && editWarpLot && editWarpCount)
          ? null
          : getEffectiveWarpYarnInfo(r.loomId, editingSaved?.beamId, beamFromFlange, r.beamContexts?.[0]?.detail);

        const warpInfo = {
          sizingSetNo: r.sizingSetNo || editSizingSetNo || fallbackWarpInfo?.sizingSetNo || '-',
          warpYarnMillName: r.warpMillName || editWarpMill || fallbackWarpInfo?.warpYarnMillName || '-',
          warpYarnLotNo: r.warpLotNo || editWarpLot || fallbackWarpInfo?.warpYarnLotNo || '-',
          warpCount: r.warpCount || editWarpCount || fallbackWarpInfo?.warpCount || '-',
        };
        const editEntryId = editIndex != null ? saved[editIndex]?.id : null;
        const remainingInfo = getLoomRemainingInfo(r.loomId, r.pieceMeter, editEntryId, r.beamContexts);

        return (
          <Card className="bg-white shadow-sm border border-gray-200 mt-0">
            <CardHeader className="py-3 px-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900">
                {editIndex != null ? "Edit Doffing Entry" : "Add / Edit Doffing Entry"}
              </CardTitle>
              {editIndex != null && (
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                  Editing #{editIndex + 1}
                </span>
              )}
            </CardHeader>
            <CardContent className="p-3 sm:p-5">
              {/* Mobile / Tablet Vertical Form Fields View */}
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                  {/* Doffing Date */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Doffing Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={r.doffingDate}
                      onChange={e => handleRowChange(0, "doffingDate", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  {/* Loom No */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Loom No <span className="text-red-500">*</span>
                    </label>
                    <CommonSearchableSelect
                      className="w-full"
                      placeholder="Select Loom"
                      options={loomOptions}
                      filterActive
                      value={r.loomId || ''}
                      onValueChange={(value) => handleRowChange(0, "loomId", value)}
                    />
                  </div>

                  {/* Beam No / Empty Beam No */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Beam No / Empty Beam No
                    </label>
                    <input
                      value={r.beamNoFlange}
                      readOnly
                      placeholder="Autofilled from Loom"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 text-gray-700 font-medium"
                    />
                  </div>

                  {/* Sort No - Construction */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Sort No - Construction
                    </label>
                    <CommonSearchableSelect
                      className="w-full"
                      placeholder="Select Fabric"
                      options={fabricOptionsForRow}
                      value={r.fabricCodeQuality || ''}
                      onValueChange={(value) => handleRowChange(0, "fabricCodeQuality", value)}
                    />
                  </div>

                  {/* Warehouse * */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Warehouse <span className="text-red-500">*</span>
                    </label>
                    <CommonSearchableSelect
                      className="w-full"
                      placeholder="Select Warehouse"
                      options={warehouseOptions}
                      filterActive
                      value={r.warehouseId || ''}
                      onValueChange={(value) => handleRowChange(0, "warehouseId", value)}
                    />
                  </div>

                  {/* Doffing Picks */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Doffing Picks
                    </label>
                    <input
                      value={r.doffingPicks}
                      onChange={e => handleRowChange(0, "doffingPicks", e.target.value)}
                      placeholder="Enter doffing picks"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  {/* No. Of Fabric Output */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      No. Of Fabric Output
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={r.noOfFabricOutput}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 text-gray-700 font-medium"
                    />
                  </div>

                  {/* Piece No */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Piece No <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={pieceInputRef}
                      value={r.pieceNumber}
                      onChange={e => onPieceInputChange(0, e.target.value)}
                      onKeyDown={e => handlePieceKeyDown(e, 0)}
                      placeholder="Piece No"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && sugRow === 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg divide-y divide-gray-100">
                        {filteredSuggestions.map((sug, sIdx) => (
                          <div
                            key={sug}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSuggestionClick(sug);
                            }}
                            className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 ${activeSuggestionIndex === sIdx ? 'bg-blue-100 font-semibold text-blue-800' : 'text-gray-700'}`}
                          >
                            {sug}
                          </div>
                        ))}
                      </div>
                    )}
                    {duplicateError && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{duplicateError}</p>
                    )}
                  </div>

                  {/* Meter * */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Meter <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={r.pieceMeter}
                      onChange={e => handleRowChange(0, "pieceMeter", e.target.value)}
                      placeholder="Enter meter"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  {/* Remaining Mtr */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Remaining Mtr
                    </label>
                    <input
                      value={remainingInfo.formattedCurrentRemaining}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 font-bold text-blue-700"
                    />
                  </div>

                  {/* Sizing Set No */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Sizing Set No
                    </label>
                    <input
                      value={warpInfo.sizingSetNo}
                      readOnly
                      placeholder="Autofilled from Beam Gaiting"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 font-medium text-blue-700"
                    />
                  </div>

                  {/* Warp Mill Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Warp Mill Name
                    </label>
                    <input
                      value={warpInfo.warpYarnMillName}
                      readOnly
                      placeholder="Autofilled from Beam Gaiting"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 font-medium text-blue-700"
                    />
                  </div>

                  {/* Warp Lot No */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Warp Lot No
                    </label>
                    <input
                      value={warpInfo.warpYarnLotNo}
                      readOnly
                      placeholder="Autofilled from Beam Gaiting"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 font-medium text-blue-700"
                    />
                  </div>

                  {/* Warp Count */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Warp Count
                    </label>
                    <input
                      value={warpInfo.warpCount}
                      readOnly
                      placeholder="Autofilled from Beam Gaiting"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 font-medium text-blue-700"
                    />
                  </div>

                  {/* Weft Lot No */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Weft Lot No
                    </label>
                    <input
                      value={weftInfo.weftYarnLotNo}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 font-medium text-purple-700"
                    />
                  </div>

                  {/* Weft Mill Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Weft Mill Name
                    </label>
                    <input
                      value={weftInfo.weftYarnMillName}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 font-medium text-purple-700"
                    />
                  </div>

                  {/* Weft Count */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Weft Count
                    </label>
                    <input
                      value={weftInfo.weftCount}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 font-medium text-purple-700"
                    />
                  </div>

                  {/* Is last piece */}
                  <div className="flex items-center lg:col-span-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 w-full sm:w-auto transition">
                      <input
                        type="checkbox"
                        checked={r.isLastPiece === "1"}
                        onChange={e => handleRowChange(0, "isLastPiece", e.target.checked ? "1" : "0")}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-gray-800">Is last piece</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-gray-100">
                {editIndex != null && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={save}
                  className="px-6 py-2 bg-primary text-white text-xs font-semibold rounded-lg shadow hover:bg-primary-dark transition w-full sm:w-auto"
                >
                  {editIndex != null ? "Update" : "Save"}
                </button>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Doffing Entry Listing Section */}
      <div className="mt-6 space-y-4">
        {/* Selection Banner (Common for both mobile and desktop) */}
        {selectMode && selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-blue-100 border border-blue-300 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m14.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707" />
                <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth={2} />
              </svg>
              <span className="font-semibold">{selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'} selected</span>
              <span className="hidden sm:inline text-blue-700 text-xs">({totalBarcodeCount} {totalBarcodeCount === 1 ? 'barcode' : 'barcodes'})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium underline-offset-2 hover:underline px-1"
              >
                Clear
              </button>
              <button
                disabled={selectedIds.size === 0}
                onClick={() => setIsBulkPrintModalOpen(true)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedIds.size === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark shadow'}`}
              >
                Print Bundle of Barcodes
              </button>
            </div>
          </div>
        )}

        {/* Mobile Adaptive Listing View (< lg) */}
        <div className="lg:hidden space-y-3">
          {/* Mobile Toolbar */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Doffing Entries</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                  {filteredMobileRows.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* View Mode Toggle: Cards or Table */}
                <button
                  type="button"
                  onClick={() => setMobileViewMode(prev => prev === 'cards' ? 'table' : 'cards')}
                  className="p-1.5 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 text-xs font-medium inline-flex items-center gap-1"
                  title={mobileViewMode === 'cards' ? 'Switch to Table View' : 'Switch to Cards View'}
                >
                  {mobileViewMode === 'cards' ? <List size={14} /> : <LayoutGrid size={14} />}
                  <span className="text-[11px] font-medium">{mobileViewMode === 'cards' ? 'Table' : 'Cards'}</span>
                </button>

                {/* Excel Export Button */}
                <button
                  type="button"
                  onClick={handleMobileExport}
                  className="p-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 text-xs font-medium inline-flex items-center gap-1"
                  title="Export to Excel"
                >
                  <Download size={14} />
                  <span className="text-[11px] font-medium hidden xs:inline">Excel</span>
                </button>

                {/* Print Multiple Barcode Toggle */}
                <button
                  type="button"
                  onClick={() => selectMode ? handleCancelSelectMode() : setSelectMode(true)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition ${selectMode ? 'border-blue-600 bg-blue-600 text-white shadow' : 'border-blue-600 bg-white text-blue-700 hover:bg-blue-50'}`}
                >
                  {selectMode ? 'Cancel' : 'Select'}
                </button>
              </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search piece, loom, doffing no..."
                value={mobileSearch}
                onChange={e => {
                  setMobileSearch(e.target.value);
                  setMobilePage(1);
                  setDoffingPage(0);
                }}
                className="w-full rounded-md border border-gray-300 pl-8 pr-8 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {mobileSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearch('');
                    setMobilePage(1);
                    setDoffingPage(0);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Select Mode Quick Toggle */}
            {selectMode && (
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectAll(!doffingListRows.every((row: any) => selectedIds.has(Number(row.entryId))), doffingListRows.map((row: any) => ({ id: row.entryId })))}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  {doffingListRows.length > 0 && doffingListRows.every((row: any) => selectedIds.has(Number(row.entryId))) ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-gray-600 font-medium">
                  {doffingListRows.filter((row: any) => selectedIds.has(Number(row.entryId))).length} of {doffingListRows.length} selected
                </span>
              </div>
            )}
          </div>

          {/* If Table View is chosen on mobile */}
          {mobileViewMode === 'table' ? (
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
              <DataTable
                columns={activeDoffingColumns as any}
                data={mobileSearch.trim() ? filteredMobileRows : doffingListRows}
                title=""
                showActions={false}
                showExport={false}
                showColumnFilters={false}
                showAddActions={false}
                filterPlaceholder="Search entries..."
                disableFullDataFetch={true}
                showSearch={false}
                loading={doffingLoading}
                isShowPagination={false}
                onRowClick={selectMode ? (row: any) => { const id = row.entryId; if (id != null) handleToggleRow(id); } : undefined}
                getRowClassName={selectMode ? (row: any) => { const id = row.entryId; return id != null && selectedIds.has(id) ? 'bg-purple-50 cursor-pointer' : 'cursor-pointer'; } : undefined}
              />
            </div>
          ) : (
            /* Cards View on Mobile */
            <div className="space-y-3">
              {paginatedMobileRows.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-lg border border-gray-200 text-gray-500 text-xs">
                  No doffing entries found.
                </div>
              ) : (
                paginatedMobileRows.map((row: any) => {
                  const id = row.entryId;
                  const isSelected = id != null && selectedIds.has(id);
                  const { modeId, isInspected, isRejected, originalIndex, isLastPieceFlag } = row;

                  return (
                    <div
                      key={row.serialNo}
                      onClick={selectMode && id != null ? () => handleToggleRow(id) : undefined}
                      className={`bg-white rounded-xl border p-3.5 transition-all shadow-sm ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${selectMode ? 'cursor-pointer' : ''}`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          {selectMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => id != null && handleToggleRow(id)}
                              onClick={e => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 mr-1.5">#{row.serialNo}</span>
                            <span className="text-xs font-bold text-gray-900 truncate">{row.doffingNo || `DOFF-${id}`}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {row.doffingDate && (
                            <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                              {formatDate(row.doffingDate)}
                            </span>
                          )}
                          {isLastPieceFlag && (
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                              Last
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Loom & Warehouse banner */}
                      <div className="py-2 flex items-center justify-between text-xs text-gray-700 border-b border-gray-50">
                        <div className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {row.loomName || 'Loom -'}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[180px]" title={row.warehouseName}>
                          {row.warehouseName}
                        </div>
                      </div>

                      {/* Card Details Grid */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 py-2.5 text-xs">
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-medium">Piece No</span>
                          <span className="font-bold text-gray-900 break-all">{row.pieceNumber || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-medium">Piece Meter</span>
                          <span className="font-bold text-emerald-700">{row.pieceMeter ? `${row.pieceMeter} m` : '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-medium">Remaining Mtr</span>
                          <span className="font-bold text-blue-700">{row.remainingMtr ? `${row.remainingMtr} m` : '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-medium">Sort No - Construction</span>
                          <span className="font-medium text-gray-800 truncate block" title={row.fabricCodeQuality}>{row.fabricCodeQuality || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-medium">Beam / Empty Beam</span>
                          <span className="text-gray-700 truncate block">{row.beamNo} / {row.flangeNo}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-medium">Warp Details</span>
                          <span className="text-gray-700 truncate block" title={`Set: ${row.sizingSetNo} | Mill: ${row.warpMillName} | Lot: ${row.warpLotNo} | Count: ${row.warpCount}`}>
                            {row.sizingSetNo !== '-' ? `Set: ${row.sizingSetNo}` : ''} {row.warpLotNo !== '-' ? `| Lot: ${row.warpLotNo}` : ''} {row.warpCount !== '-' ? `(${row.warpCount})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-medium">Weft Details</span>
                          <span className="text-gray-700 truncate block" title={`Lot: ${row.weftYarnLotNo} | Mill: ${row.weftYarnMillName} | Count: ${row.weftCount}`}>
                            {row.weftYarnLotNo !== '-' ? `Lot: ${row.weftYarnLotNo}` : ''} {row.weftCount !== '-' ? `(${row.weftCount})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-medium">Doffing Picks</span>
                          <span className="text-gray-700">{row.doffingPicks || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-medium">Avg Weight</span>
                          <span className="text-gray-700">{row.avgWeight || '-'}</span>
                        </div>
                      </div>

                      {/* Card Footer: Status & Actions */}
                      <div className="pt-2 mt-1 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {modeId === 1 && (
                            <span className="bg-green-100 text-green-700 border border-green-300 rounded px-1.5 py-0.5 text-[10px] font-semibold">Splitted</span>
                          )}
                          {modeId === 2 && (
                            <span className="bg-green-100 text-green-700 border border-green-300 rounded px-1.5 py-0.5 text-[10px] font-semibold">Joined</span>
                          )}
                          {isRejected === 1 ? (
                            <span className="bg-red-100 text-red-700 border border-red-300 rounded px-1.5 py-0.5 text-[10px] font-semibold">Rejected</span>
                          ) : isInspected === 1 ? (
                            <span className="bg-green-100 text-green-700 border border-green-300 rounded px-1.5 py-0.5 text-[10px] font-semibold">Inspected</span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 ml-auto" onClick={e => e.stopPropagation()}>
                          {row.barcodeLink && (
                            <a
                              href={row.barcodeLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition"
                            >
                              Barcode
                            </a>
                          )}
                          {isRejected !== 1 && isInspected !== 1 && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => edit(originalIndex)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition"
                                title="Edit entry"
                              >
                                <Edit size={13} />
                                <span>Edit</span>
                              </button>
                              {!isLastPieceFlag && (
                                <button
                                  type="button"
                                  onClick={() => del(originalIndex)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition"
                                  title="Delete entry"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Mobile Pagination */}
              {totalMobilePages > 1 && (
                <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg border border-gray-200 text-xs">
                  <span className="text-gray-600 font-medium">
                    Page {mobilePage} of {totalMobilePages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobilePage(p => Math.max(1, p - 1))}
                      disabled={mobilePage <= 1}
                      className="px-2.5 py-1 rounded border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
                    >
                      <ChevronLeft size={14} />
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobilePage(p => Math.min(totalMobilePages, p + 1))}
                      disabled={mobilePage >= totalMobilePages}
                      className="px-2.5 py-1 rounded border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop View (Standard DataTable for lg and above) */}
        <div className="hidden lg:block">
          <DataTable
            columns={activeDoffingColumns as any}
            data={mobileSearch.trim() ? filteredMobileRows : doffingListRows}
            title="Doffing Entry List"
            showActions={false}
            showExport={false}
            showColumnFilters={true}
            showAddActions={false}
            filterPlaceholder="Search entries..."
            disableFullDataFetch={true}
            showSearch={false}
            loading={doffingLoading}
            isShowPagination={false}
            onRowClick={selectMode ? (row: any) => { const id = row.entryId; if (id != null) handleToggleRow(id); } : undefined}
            getRowClassName={selectMode ? (row: any) => { const id = row.entryId; return id != null && selectedIds.has(id) ? 'bg-purple-50 cursor-pointer' : 'cursor-pointer'; } : undefined}
            headerActions={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search all doffing entries..."
                    value={mobileSearch}
                    onChange={(event) => {
                      setMobileSearch(event.target.value);
                      setMobilePage(1);
                    }}
                    className="w-56 rounded-md border border-gray-300 py-1.5 pl-8 pr-8 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {mobileSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileSearch("");
                        setMobilePage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleMobileExport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Download size={14} /> Export All
                </button>
                <button
                  type="button"
                  onClick={() => selectMode ? handleCancelSelectMode() : setSelectMode(true)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${selectMode ? 'border-blue-600 bg-blue-600 text-white shadow' : 'border-blue-600 bg-white text-blue-700 hover:bg-blue-50'}`}
                >
                  {selectMode ? 'Cancel Selection' : 'Print Multiple Barcode'}
                </button>
              </div>
            }
          />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-3 py-3 text-xs text-gray-600">
          <span>
            Showing {(Number(doffingPagination?.offset) || 0) + (doffingListRows.length ? 1 : 0)} to{' '}
            {(Number(doffingPagination?.offset) || 0) + doffingListRows.length} of {Number(doffingPagination?.total) || 0}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDoffingPage((page) => Math.max(0, page - 1))}
              disabled={doffingPage <= 0 || doffingLoading || editIndex != null}
              className="inline-flex items-center gap-1 rounded border border-gray-200 px-2.5 py-1.5 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span>Page {Math.min(doffingPage + 1, totalDoffingPages)} of {totalDoffingPages}</span>
            <button
              type="button"
              onClick={() => setDoffingPage((page) => Math.min(totalDoffingPages - 1, page + 1))}
              disabled={doffingPage >= totalDoffingPages - 1 || doffingLoading || editIndex != null}
              className="inline-flex items-center gap-1 rounded border border-gray-200 px-2.5 py-1.5 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isBulkPrintModalOpen} onClose={() => setIsBulkPrintModalOpen(false)} title="Print Bundle of Barcodes" className="max-w-lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{totalBarcodeCount}</span> barcode sticker{totalBarcodeCount !== 1 ? 's' : ''} across{' '}
            <span className="font-semibold text-gray-800">{selectedIds.size}</span> {selectedIds.size === 1 ? 'entry' : 'entries'} will be sent to the sticker page.
          </p>
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-md bg-gray-50">
            {Array.from(selectedIds).map(id => {
              const row = doffingRowCache.get(id);
              if (!row) return null;
              const count = extractPieceEntriesForRow(row).length;
              return (
                <div key={id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{row.pieceNumber || `Doffing #${id}`}</span>
                    <span className="ml-2 text-xs text-gray-500">{row.doffingDate ? formatDate(row.doffingDate) : ''}</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                    {count} {count === 1 ? 'barcode' : 'barcodes'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setIsBulkPrintModalOpen(false)} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">Cancel</button>
            <button onClick={handleOpenBarcodeStickerPage} className="px-4 py-2 text-sm bg-primary text-white hover:bg-primary-light rounded-md transition-colors font-semibold">Open Barcode Sticker Page</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}