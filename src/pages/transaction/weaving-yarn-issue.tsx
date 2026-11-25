

// weaving-yarn-issue.tsx - UPDATED WITH SIZING-STYLE FUNCTIONALITY
import React, { act, useEffect, useMemo, useRef, useState } from "react";

import { FileText, ShoppingCart, ClipboardList, Edit, Trash2, Save, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { PopupDataTable, PopupColumn } from "@/components/data/PopupDataTable";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { createPurchaseOrder, getAllPoTypes, getAllPurchaseOrders, updatePurchaseOrder } from "@/state/purchaseOrderSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useDispatch, useSelector } from "react-redux";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllProductCategory } from "@/state/productCategorySlice";
import { DataTable } from "@/components/data/DataTable";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllWeavingContract, getWeavingContractById } from "@/state/weavingContractSlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllMachines } from "@/state/machineMasterSlice";
import { getAllBeamGaitings } from "@/state/beamGaitingSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createWeavingYarnIssue, updateWeavingYarnIssue, getAllWeavingYarnIssue, deleteWeavingYarnIssue } from "@/state/weavingYarnIssueSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
import { getAllTermsConditions } from "@/state/termsConditions";
import { getAllTransports } from "@/state/transportSlice";
import apiService from "@/services/ApiService";
import documentNumberService from "@/services/DocumentNumberService";
import { toast } from "react-toastify";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VENDOR_TYPE_ALL, filterVendorsByTypeIds } from "@/utils/vendorFilters";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { useAutoDocumentNumber } from "@/components/common/useAutoDocumentNumber";
import { useMappingStatus } from "@/hooks/useMappingStatus";
import { CodeDetail, CodeHeader } from "@/types/codes";
import { CodesAPI } from "@/services/codes_api";
import { CodesUtil } from "@/utils/codesUtil";

interface YarnIssueDetail {
  actualYarn: string;
  alternateYarn: string;
  id?: number;
  yarnName: string;
  yarnCount: string;
  availableReqQty: number;
  issueQty: number;
  lotId: string;
  activeFlag?: boolean;
}

interface YarnRequirementDetail {
  id?: number;
  yarnName: string;
  yarnCount: string;
  actualYarn: string;
  actualYarnId: number;
  gramsPerMeter: string;
  totalwarpReq: string;
  totalWarpIssued: string;
  balanceWarpToIssue: string;
}

interface WeavingYarnIssueFormData {
  id?: number;
  vendorId: string;
  weavingContractId: string;
  transportationDetails: string;
  transportId?: string;
  termsConditionsId: string;
  fabricDetails: string;
  yarnIssueDate: string;
  yarnIssueChallanNo: string;
  vehicleNo?: string;
  remarks?: string;
  grossWt?: number;
  totalNetWt?: number;
  activeFlag: boolean;
  requirements: YarnRequirementDetail[];
}

interface LotDetail {
  id?: number;
  uniqueId?: string;
  weavingYarnRequirementId?: number | null;
  yarnName?: string;
  yarnCount: string;
  actualYarn: string;
  alternateYarn: string;
  lotId?: number | string;
  issuedQty?: number | string;
  availableQty: number;
  lotAvailableQty?: number;
  lotNumber?: string;
  issueQty?: number | string;
  activeFlag?: boolean;
  isEditing?: boolean;
  yarnType?: 'original' | 'actual';
  originalYarnName?: string;
  millId?: number | string | null;
  warehouseId?: number | string | null;
  baseLotId?: number | string;
  lotYarnId?: number | string;
  yarnId?: number | string | null;
  orderItemId?: number | string | null;
  actualYarnId?: number | null;
  availableBags?: number;
  lotAvailableBags?: number;
  inwardBags?: number;
  noOfBags?: number | string;
  kgsPerBag?: number;
  conesPerBag?: number;
  conesWeight?: number;
  inwardId?: number | string | null;
  yarnInwardStockDetailsId?: number | string | null;
  inwardTypeId?: number | null;
  inwardType?: string;
  inwardNo?: string;
  poCategoryId?: number | null;
  loomId?: number | string | null;
  machineId?: number | string | null;
  beamGaitingId?: number | string | null;
  issueType?: 'INITIAL' | 'LOT_SWITCH';
}

interface YarnMaster {
  id: number;
  yarnName: string;
  activeFlag?: boolean;
}

type SelectOption = {
  value: string;
  label: string;
};

const buildYarnInwardStockUrl = (itemIds: string, companyId?: number | null) => {
  const params: string[] = [];
  if (itemIds) {
    params.push(`itemId=${itemIds}`);
  }
  if (companyId != null) {
    params.push(`companyId=${companyId}`);
  }
  return params.length
    ? `/sizing-yarn-issues/yarn-inward-stock?${params.join("&")}`
    : `/sizing-yarn-issues/yarn-inward-stock`;
};

const calculateIssueQty = (bags?: number | string | undefined, kgs?: number | string | undefined) => {
  if (bags === "" || kgs === "" || bags == null || kgs == null) {
    return "";
  }
  const bagValue = Number(bags);
  const kgValue = Number(kgs);
  return Number((bagValue * kgValue).toFixed(3));
};

const buildActualYarnKey = (actualYarnId?: number | null, actualYarn?: string, yarnCount?: string) => {
  if (actualYarnId !== null && actualYarnId !== undefined) {
    return `id_${actualYarnId}`;
  }

  if (actualYarn) {
    return `name_${actualYarn}`;
  }

  return `count_${yarnCount ?? ''}`;
};

const toNullableId = (val: any): number | null => {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str === '' || str === '0' || str === 'null' || str === 'undefined' || str.indexOf('original') !== -1) return null;
  const num = Number(str);
  return (isNaN(num) || num === 0) ? null : num;
};

const normalizeWeavingLotNumber = (lotNumber?: string | number) => String(lotNumber ?? '').replace(/\s+/g, '');

const buildWeavingLotSelectionKey = (
  lot: Partial<LotDetail> & {
    itemId?: number | string;
    yarnId?: number | string | null;
    inwardId?: number | string | null;
    yarnInwardStockDetailsId?: number | string | null;
    lotNo?: string;
    lotNumber?: string;
    issueType?: string;
  },
  fallbackIssueType?: string
) => {
  const primaryId = lot.yarnInwardStockDetailsId ?? lot.inwardId ?? lot.orderItemId ?? lot.baseLotId ?? lot.lotId ?? lot.id ?? '';
  const yarnId = lot.itemId ?? lot.lotYarnId ?? lot.yarnId ?? lot.actualYarnId ?? '';
  const lotNumber = normalizeWeavingLotNumber(lot.lotNumber || lot.lotNo);
  const type = lot.issueType || fallbackIssueType || 'INITIAL';
  return `weaving_sel_${type}_${primaryId}_${yarnId}_${lotNumber}`;
};

const buildWeavingLotUniqueId = (
  lot: Partial<LotDetail> & {
    itemId?: number | string;
    yarnId?: number | string | null;
    inwardId?: number | string | null;
    yarnInwardStockDetailsId?: number | string | null;
    lotNo?: string;
    lotNumber?: string;
    issueType?: string;
  },
  index: number,
  fallbackIssueType?: string
) => {
  const baseId = lot.yarnInwardStockDetailsId ?? lot.inwardId ?? lot.orderItemId ?? lot.baseLotId ?? lot.id ?? index;
  const yarnId = lot.itemId ?? lot.lotYarnId ?? lot.yarnId ?? '';
  const lotNumber = normalizeWeavingLotNumber(lot.lotNumber || lot.lotNo) || index;
  const type = lot.issueType || fallbackIssueType || 'INITIAL';
  return `weaving_${type}_${baseId}_${yarnId}_${lotNumber}`;
};

const WEAVING_VENDOR_TYPE_IDS = [303, VENDOR_TYPE_ALL];

export function WeavingYarnIssue() {
  const { weavingContractList, loading: weavingContractsLoading } = useSelector((state: RootState) => state.weavingContracts);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const weavingVendors = useMemo(
    () => filterVendorsByTypeIds(vendorList, WEAVING_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null }),
    [vendorList]
  );
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { yarnList } = useSelector((state: RootState) => state.yarn);
  const { weavingYarnIssuetList } = useSelector((state: RootState) => state.weavingYarnIssue);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { subCategoryList: subCategories } = useSelector((state: RootState) => state.subCategory);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions);
  const { transportList } = useSelector((state: RootState) => state.transport as any);
  const { loomList } = useSelector((state: RootState) => (state.loomMaster as any) || {});
  const { machineList } = useSelector((state: RootState) => (state.machineMaster as any) || {});
  const { list: beamGatingList } = useSelector((state: RootState) => (state.beamGaiting as any) || {});

  const [newItem, setNewItem]: any = useState({ fabricDetails: '' });
  const [activeTab, setActiveTab] = useState("orderDetails");
  const [selectedSwitchLoomId, setSelectedSwitchLoomId] = useState<string>("");
  const [switchLoomGaiting, setSwitchLoomGaiting] = useState<any>(null);
  const [selectedJobWork, setSelectedJobWork]: any = useState([]);
  const [yarnRequirementDetails, setYarnRequirementDetails]: any = useState<YarnRequirementDetail[]>([]);
  const [showLotDialog, setShowLotDialog] = useState(false);
  const [yarnIssueDetails, setYarnIssueDetails] = useState<LotDetail[]>([]);
  const [selectedLot, setSelectedLot]: any = useState<LotDetail[]>([]);
  const [issueErrors, setIssueErrors] = useState<{ [id: number]: string | null }>({});
  const dispatch = useDispatch<AppDispatch>();
  const [isItemsValid, setIsItemsValid] = useState(false);
  const location = useLocation();
  const weavingYarnIssueDtl = location.state?.weavingYarnIssueDtl;
  const navigate = useNavigate();
  const [tempIssueSum, setTempIssueSum] = useState<{ [key: string]: number }>({});
  const [isYarnIssueEnabled, setIsYarnIssueEnabled] = useState(false);
  const [lotNumberMap, setLotNumberMap] = useState<{ [key: number]: string }>({});
  const [dialogSelectedIds, setDialogSelectedIds] = useState<string[]>([]);
  const [lotSearchTerm, setLotSearchTerm] = useState("");
  const { purchaseInwardList } = useSelector((state: RootState) => state.purchaseInward as any);
  const resolvedCompanyId = useResolvedCompanyId();
  const [isDropdownDataLoading, setIsDropdownDataLoading] = useState(false);
  const isInitialized = useRef(false);
  const loadedDetailIdRef = useRef<number | null>(null);

  //   const documentNumberHook = useDocumentNumber({
  //   screenName: 'Weaving Yarn Issue',
  //   existingNumber: location.state?.weavingYarnIssueDtl?.yarnIssueChallanNo,
  //   shouldGenerateOnMount: !location.state?.weavingYarnIssueDtl?.yarnIssueChallanNo
  // });

  const [inwardTypes, setInwardTypes] = useState<CodeDetail[]>([]);

  const normalizeDetailsResponse = (raw: any): CodeDetail[] => {
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
    return [];
  };

  const normalizeHeadersResponse = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
    return [];
  };

  useEffect(() => {
    const fetchInwardTypes = async () => {
      try {
        // First try to get headers from storage or load them once
        let headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());

        if (!headers.length) {
          try {
            await CodesUtil.loadOnce(async () => normalizeHeadersResponse(await CodesAPI.getCodesHeader()));
            headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());
          } catch (error) {
            console.error("Failed to preload inward type headers", error);
          }
        }

        // If headers are still empty, fetch them directly
        if (!headers.length) {
          try {
            const apiHeaders = await CodesAPI.getCodesHeader();
            headers = normalizeHeadersResponse(apiHeaders);
          } catch (error) {
            console.error("Failed to fetch inward type headers", error);
          }
        }

        // Find the header for inward types (hdr_id: 1)
        const inwardHeader = headers.find((h: CodeHeader) =>
          String(h.id) === "1" || String(h.hdr_id) === "1" || String(h.hdrId) === "1"
        );

        if (inwardHeader && Array.isArray(inwardHeader.details)) {
          setInwardTypes(inwardHeader.details);
        } else if (inwardHeader?.id) {
          // Fallback if details are not included in headers
          const response = await CodesAPI.getCodeDetailsByHeader(inwardHeader.code_group || inwardHeader.codeGroup);
          setInwardTypes(normalizeDetailsResponse(response));
        } else {
          // Final fallback - try by numeric ID as string if group name is unknown
          const response = await CodesAPI.getCodeDetailsByHeader("1");
          setInwardTypes(normalizeDetailsResponse(response));
        }
      } catch (error) {
        console.error("Failed to fetch inward types:", error);
      }
    };
    fetchInwardTypes();
  }, []);

  const [poCategories, setPoCategories] = useState<CodeDetail[]>([]);

  useEffect(() => {
    const fetchPoCategories = async () => {
      try {
        const details = await CodesAPI.getCodeDetailsByHeader("7");
        setPoCategories(details || []);
      } catch (err) {
        console.error("Failed to fetch PO Categories in weaving yarn issue:", err);
      }
    };
    fetchPoCategories();
  }, []);

  const poCategoryMap = useMemo(() => {
    return poCategories.reduce((acc: Record<number, string>, category: any) => {
      acc[category.id] = category.value;
      return acc;
    }, {}) || {};
  }, [poCategories]);


  const getDetailOptionValue = (detail: CodeDetail) => {
    if (detail.id != null) return String(detail.id);
    if (detail.code) return detail.code;
    if (detail.value) return detail.value;
    return "";
  };

  const getDetailOptionLabel = (detail: CodeDetail) => detail.code || detail.value || `Code ${detail.id ?? ""}`;

  const inwardTypeLabelById = useMemo(() => {
    const map = new Map<string, string>();
    inwardTypes.forEach((detail) => {
      const key = getDetailOptionValue(detail);
      if (!key) return;
      map.set(key, getDetailOptionLabel(detail));
    });
    return map;
  }, [inwardTypes]);

  const [yarnIssueChallanNo, setYarnIssueChallanNo] = useState<string>(
    weavingYarnIssueDtl?.yarnIssueChallanNo || 'Loading sequence...'
  );
  const isSavingRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid }
  } = useForm<WeavingYarnIssueFormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      yarnIssueDate: new Date().toISOString().slice(0, 10),
      yarnIssueChallanNo: weavingYarnIssueDtl?.yarnIssueChallanNo || 'Loading sequence...',
    }
  });

  const activeFormId = watch("id") || getValues("id") || weavingYarnIssueDtl?.id;

  const { isMapped: isWeavingIssueMapped } = useMappingStatus({
    endpoint: '/weaving-yarn-issues/',
    id: activeFormId,
    enabled: !!activeFormId,
  });

  useAutoDocumentNumber({
    screenName: 'Weaving Yarn Issue',
    detail: activeFormId ? { id: activeFormId } : undefined,
    existingValue: getValues('yarnIssueChallanNo') || weavingYarnIssueDtl?.yarnIssueChallanNo,
    onValueChange: (val) => {
      setYarnIssueChallanNo(val);
      setValue('yarnIssueChallanNo', val);
    },
    setValue,
    fieldName: 'yarnIssueChallanNo',
    isSavingRef,
  });

  useEffect(() => {
    if (weavingYarnIssueDtl?.yarnIssueChallanNo) {
      setYarnIssueChallanNo(weavingYarnIssueDtl.yarnIssueChallanNo);
      setValue('yarnIssueChallanNo', weavingYarnIssueDtl.yarnIssueChallanNo);
    }
  }, [weavingYarnIssueDtl, setValue]);

  const transportIdValue = watch('transportId');
  const transportationNameValue = watch("transportationDetails");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // const existingNames = useMemo(
  //   () => weavingYarnIssuetList.map((w: any) => (w?.transportationDetails ?? "")).filter(Boolean),
  //   [weavingYarnIssuetList]
  // );

  // const filteredSuggestions = useMemo(() => {
  //   const q = (transportationNameValue || "").toLowerCase();
  //   if (!q) return [] as string[];
  //   return existingNames
  //     .filter((name: string) => name.toLowerCase().includes(q))
  //     .slice(0, 8);
  // }, [transportationNameValue, existingNames]);

  const millOptions = useMemo(() => (subCategories || []).filter((sc: any) => sc.categoryName === "Mill"), [subCategories]);

  const selectedVendorId = watch('vendorId');
  const filteredWeavingContracts = useMemo(() => {
    return (weavingContractList || []).filter((wc: any) => String(wc.vendorId) === String(selectedVendorId));
  }, [weavingContractList, selectedVendorId]);

  const vendorOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = (weavingVendors || []).map((vendor: any) => ({
      value: String(vendor.id),
      label: vendor.vendorName || `Vendor ${vendor.id}`,
      activeFlag: vendor.activeFlag ?? true,
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [weavingVendors]);

  const weavingContractOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = (filteredWeavingContracts || []).map((contract: any) => ({
      value: String(contract.id),
      label: contract.weavingContractNo || `Contract ${contract.id}`
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredWeavingContracts]);


  // const transportOptions = useMemo<SelectOption[]>(() => {
  //   const options: SelectOption[] = (transportList || []).map((transport: any) => ({
  //     value: String(transport.id),
  //     label: transport.transportName || transport.name || `Transport ${transport.id}`,
  //     activeFlag: transport.activeFlag ?? true,
  //   }));
  //   return options.sort((a, b) => a.label.localeCompare(b.label));
  // }, [transportList]);

  // const transportLabelMap = useMemo(() => {
  //   const map = new Map<string, string>();
  //   transportOptions.forEach(option => map.set(option.value, option.label));
  //   return map;
  // }, [transportOptions]);

  const termsOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = (termsContitionsList || []).map((term: any) => ({
      value: String(term.id),
      label: term.termsConditionsName || `Terms ${term.id}`,
      activeFlag: term.activeFlag ?? true,
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [termsContitionsList]);

  const transportOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = (transportList || []).map((transport: any) => ({
      value: String(transport.id),
      label: transport.transportName || transport.name || `Transport ${transport.id}`,
      activeFlag: transport.activeFlag ?? true,
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [transportList]);

  const yarnOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = (yarnList || []).map((yarn: YarnMaster) => ({
      value: String(yarn.id),
      label: yarn.yarnName || `Yarn ${yarn.id}`,
      activeFlag: yarn.activeFlag ?? true,
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [yarnList]);

  const millSelectOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = (millOptions || []).map((mill: any) => ({
      value: String(mill.id),
      label: mill.subCategoryName || `Mill ${mill.id}`
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [millOptions]);

  const warehouseOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = (warehouseList || []).map((wh: any) => ({
      value: String(wh.id),
      label: wh.warehouseName || `Warehouse ${wh.id}`
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [warehouseList]);

  const loomOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = (loomList || []).map((loom: any) => ({
      value: String(loom.id),
      label: loom.loomNo || loom.name || `Loom ${loom.id}`,
      activeFlag: loom.activeFlag ?? true,
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [loomList]);

  const activeGaitedLoomIds = useMemo(() => {
    const set = new Set<string>();
    const arr = Array.isArray(beamGatingList) ? beamGatingList : Array.isArray((beamGatingList as any)?.data) ? (beamGatingList as any).data : [];
    arr.forEach((gating: any) => {
      const lid = gating?.loomId ?? gating?.loom_id ?? gating?.loom?.id;
      if (!lid) return;

      const isTopLevelCompleted = Number(gating?.isProductionCompleted ?? gating?.is_production_completed ?? gating?.isCompleted ?? 0) === 1;
      if (isTopLevelCompleted) {
        return;
      }

      const details: any[] = Array.isArray(gating?.beamGatingDetails)
        ? gating.beamGatingDetails
        : Array.isArray(gating?.details)
          ? gating.details
          : Array.isArray(gating?.beamDetails)
            ? gating.beamDetails
            : [];

      if (details.length > 0) {
        const hasActiveDetail = details.some((d: any) => Number(d?.isProductionCompleted ?? d?.is_production_completed ?? 0) === 0);
        if (hasActiveDetail) {
          set.add(String(lid));
        }
      } else {
        set.add(String(lid));
      }
    });
    return set;
  }, [beamGatingList]);

  const activeLoomOptions = useMemo<SelectOption[]>(() => {
    const list = Array.isArray(loomList) ? loomList : Array.isArray((loomList as any)?.data) ? (loomList as any).data : [];
    const filtered = list.filter((l: any) =>
      Number(l.isBeamGating ?? 0) === 1 ||
      l.isBeamGating === true ||
      activeGaitedLoomIds.has(String(l.id))
    );
    const sourceList = filtered.length > 0 ? filtered : list;
    return sourceList.map((loom: any) => ({
      value: String(loom.id),
      label: loom.loomNo || loom.name || `Loom ${loom.id}`,
      activeFlag: loom.activeFlag ?? true,
    })).sort((a: any, b: any) => a.label.localeCompare(b.label));
  }, [loomList, activeGaitedLoomIds]);

  const machineOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = (machineList || []).map((m: any) => ({
      value: String(m.id),
      label: m.machineName || m.machineNo || m.name || `Machine ${m.id}`,
      activeFlag: m.activeFlag ?? true,
    }));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [machineList]);

  useEffect(() => {
    // If we have weavingYarnIssueDtl, only clear if the vendor actually changed 
    // from the record's vendor. During initialization, selectedVendorId might 
    // be temporarily different until reset() settles.
    if (weavingYarnIssueDtl) {
      if (selectedVendorId && String(selectedVendorId) !== String(weavingYarnIssueDtl.vendorId)) {
        setValue('weavingContractId', '');
        setYarnRequirementDetails([]);
        setSelectedLot([]);
      }
      return;
    }

    if (String(selectedVendorId) !== '') {
      // Don't clear if we are still loading contracts or if we are in the middle of
      // auto-initialization from navigation state.
      if (weavingContractsLoading) return;
      if (location.state?.source === 'order-entry-management' && !isInitialized.current) return;

      // Check if the current contract still belongs to the selected vendor
      // This prevents clearing when both are set during auto-population
      const currentContractId = getValues('weavingContractId');
      const isContractValid = weavingContractList.some(
        (wc: any) => String(wc.id) === String(currentContractId) && String(wc.vendorId) === String(selectedVendorId)
      );

      if (!isContractValid) {
        setValue('weavingContractId', '');
        setYarnRequirementDetails([]);
        setSelectedLot([]);
      }
    }
  }, [selectedVendorId, setValue, weavingYarnIssueDtl, weavingContractList, getValues, weavingContractsLoading, location.state?.source]);

  useEffect(() => {
    if (weavingYarnIssueDtl && selectedVendorId && filteredWeavingContracts.length > 0) {
      const exists = filteredWeavingContracts.some((wc: any) => String(wc.id) === String(weavingYarnIssueDtl.weavingContractId));
      if (exists) {
        setValue('weavingContractId', String(weavingYarnIssueDtl.weavingContractId));
      }
    }
  }, [weavingYarnIssueDtl, selectedVendorId, filteredWeavingContracts, setValue]);

  // Ensure Weaving Contract is auto-selected when navigating from order-entry-management
  // even if options load later than the initial reset()
  useEffect(() => {
    const locationState = location.state;
    if (locationState?.source === 'order-entry-management' && locationState?.weavingContractId) {
      const targetId = String(locationState.weavingContractId);
      const currentId = getValues('weavingContractId');

      if (weavingContractOptions.length > 0) {
        const hasOption = weavingContractOptions.some(opt => opt.value === targetId);
        if (hasOption && (!currentId || currentId !== targetId)) {
          setValue('weavingContractId', targetId, { shouldValidate: true });
          // Trigger the fetch to be sure requirements are loaded
          loadYarnRequirementsForContract(targetId, String(locationState.vendorId));
        }
      }
    }
  }, [weavingContractOptions, location.state?.source, location.state?.weavingContractId, location.state?.vendorId, setValue, getValues]);

  useEffect(() => {
    const list = Array.isArray(purchaseInwardList?.data) ? purchaseInwardList.data : purchaseInwardList;
    const lotMap: { [key: number]: string } = {};
    (list || []).forEach((pi: any) => {
      (pi.purchaseInwardItemsDtl || []).forEach((item: any) => {
        (item.lotEntries || []).forEach((lot: any) => {
          if (lot.id && lot.lotNumber) {
            lotMap[Number(lot.id)] = lot.lotNumber;
          }
        });
      });
    });
    setLotNumberMap(lotMap);
  }, [purchaseInwardList]);

  // useEffect(() => {
  //   if (!transportList) return;
  //   if (!weavingYarnIssueDtl) {
  //     setValue('transportationDetails', '', { shouldValidate: true });
  //     return;
  //   }


  //   const resolvedTransportId = weavingYarnIssueDtl.transportId;
  //   if (resolvedTransportId) {
  //     const idStr = String(resolvedTransportId);
  //     setValue('transportId', idStr, { shouldValidate: true });
  //     const matchedTransport = transportList.find((t: any) => String(t.id) === idStr);
  //     const label = matchedTransport ? (matchedTransport.transportName || matchedTransport.name || '') : (weavingYarnIssueDtl.transportationDetails || '');
  //     setValue('transportationDetails', label, { shouldValidate: true });
  //     return;
  //   }

  //   if (weavingYarnIssueDtl.transportationDetails) {
  //     const match = transportList.find((t: any) => (t.transportName || t.name) === weavingYarnIssueDtl.transportationDetails);
  //     if (match) {
  //       setValue('transportId', String(match.id), { shouldValidate: true });
  //       setValue('transportationDetails', match.transportName || match.name || '', { shouldValidate: true });
  //       return;
  //     }
  //     setValue('transportationDetails', weavingYarnIssueDtl.transportationDetails, { shouldValidate: true });
  //     return;
  //   }

  //   setValue('transportationDetails', '', { shouldValidate: true });
  // }, [transportList, weavingYarnIssueDtl, setValue]);

  useEffect(() => {
    if (!transportIdValue) {
      setValue('transportationDetails', '', { shouldValidate: true });
      return;
    }
    const matched = transportOptions.find(t => String(t.value) === String(transportIdValue));
    if (matched) {
      setValue('transportationDetails', matched.label, { shouldValidate: true });
    }
  }, [transportIdValue, transportOptions, setValue]);


  useEffect(() => {
    setIsDropdownDataLoading(true);
    const purchaseOrderParams: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
    if (resolvedCompanyId) {
      purchaseOrderParams.companyId = resolvedCompanyId;
    }
    dispatch(getAllPurchaseOrders(purchaseOrderParams));
    dispatch(getAllPoTypes({ fetchAll: true }));
    dispatch(getAllVendors({ fetchAll: true }));
    dispatch(getAllProductCategory({ fetchAll: true }));
    const weavingContractParams: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
    if (resolvedCompanyId) {
      weavingContractParams.companyId = resolvedCompanyId;
    }
    dispatch(getAllWeavingContract(weavingContractParams));
    dispatch(getAllFabricMasters({ fetchAll: true }));
    dispatch(getAllYarnMasters({ fetchAll: true }));
    const weavingYarnIssueParams: { companyId?: number } = {};
    if (resolvedCompanyId) {
      weavingYarnIssueParams.companyId = resolvedCompanyId;
    }
    dispatch(getAllWeavingYarnIssue(weavingYarnIssueParams));
    dispatch(getAllSubCategories({ fetchAll: true } as any));
    dispatch(getAllWarehouse({ fetchAll: true } as any));
    dispatch(getAllTermsConditions({ fetchAll: true } as any));
    dispatch(getAllLooms({ fetchAll: true } as any));
    dispatch(getAllMachines({ fetchAll: true } as any));
    dispatch(getAllBeamGaitings({ fetchAll: true } as any));
    dispatch(getAllTransports({ fetchAll: true } as any)).finally(() => {
      setIsDropdownDataLoading(false);
    });
  }, [dispatch, resolvedCompanyId]);

  // Additional useEffect to ensure dropdown data is loaded when navigating from order-entry-management
  useEffect(() => {
    if (location.state?.source === 'order-entry-management') {
      // Ensure dropdown data is available
      if ((!termsContitionsList || termsContitionsList.length === 0) || (!transportList || transportList.length === 0)) {
        setIsDropdownDataLoading(true);
        Promise.all([
          dispatch(getAllTermsConditions({ fetchAll: true } as any)),
          dispatch(getAllTransports({ fetchAll: true } as any))
        ]).finally(() => {
          setIsDropdownDataLoading(false);
        });
      }
    }
  }, [location.state?.source, termsContitionsList?.length, transportList?.length, dispatch]);

  // Calculate Total Net Weight based on Selected Lot Issue Qty
  useEffect(() => {
    const total = selectedLot.reduce((sum: any, lot: any) => sum + (Number(lot.issueQty) || 0), 0);
    setValue("totalNetWt", Number(total.toFixed(3)));

    // Auto-fill gross weight if it's empty or equal to previous total
    const currentGrossWt = getValues("grossWt");
    if (!currentGrossWt || currentGrossWt === 0) {
      setValue("grossWt", Number(total.toFixed(3)));
    }
  }, [selectedLot, setValue, getValues]);

  const getYarnNameFromFabricMaster = (fabricCode: string): string => {
    const fabric = fabricMasterList.find((f: any) => f.fabricCode === fabricCode);
    const fabricYarnId = (fabric?.weftDetails?.[0]?.yarnId ?? fabric?.yarnId) as number | undefined;
    if (fabricYarnId) {
      const yarnMaster = yarnList.find((y: YarnMaster) => y.id === Number(fabricYarnId));
      return yarnMaster?.yarnName || 'N/A';
    }
    return 'N/A';
  };

  const getYarnIdFromFabricMaster = (fabricCode: string): number | null => {
    const fabric = fabricMasterList.find((f: any) => f.fabricCode === fabricCode);
    const fabricYarnId = (fabric?.weftDetails?.[0]?.yarnId ?? fabric?.yarnId) as number | undefined;
    return fabricYarnId ? Number(fabricYarnId) : null;
  };


  const isFormValid = selectedLot.length > 0;

  const switchLoomInfo = useMemo(() => {
    if (!selectedSwitchLoomId) {
      return {
        machineName: '-',
        activeBeamNos: 'N/A',
        beamMeter: 'N/A',
        initialWeftLotNo: 'N/A',
        weftYarnName: 'N/A',
        warpSetNo: 'N/A',
        weftYarnMillName: 'N/A',
        activeGating: null
      };
    }

    const gatingsForLoom = (beamGatingList || []).filter((b: any) => String(b.loomId) === String(selectedSwitchLoomId));

    const activeDetails: any[] = [];
    let primaryGating: any = null;

    gatingsForLoom.forEach((gating: any) => {
      const details = gating.beamGatingDetails || gating.beamDetails || gating.details || [];
      if (details.length > 0) {
        details.forEach((d: any) => {
          const isCompleted = Number(d.isProductionCompleted ?? d.is_production_completed ?? 0) === 1;
          if (!isCompleted) {
            activeDetails.push({ ...d, parentGating: gating });
            if (!primaryGating) primaryGating = gating;
          }
        });
      } else {
        activeDetails.push({ ...gating, parentGating: gating });
        if (!primaryGating) primaryGating = gating;
      }
    });

    const beamNos = Array.from(new Set(
      activeDetails.map((d: any) => {
        const bNo = d.beamNo || d.sizedBeamNo || d.beam_no || d.gaitingNo;
        return bNo ? String(bNo).trim() : null;
      }).filter(Boolean)
    )).join(', ');

    const beamMeters = Array.from(new Set(
      activeDetails.map((d: any) => {
        const bM = d.beamMeter ?? d.wrapMeters ?? d.parentGating?.beamMeter ?? d.parentGating?.wrapMeters;
        return bM !== undefined && bM !== null && String(bM).trim() !== '' ? String(bM).trim() : null;
      }).filter(Boolean)
    )).join(', ');

    const weftLots = Array.from(new Set(
      activeDetails.map((d: any) => {
        const wLot = d.weftYarnLotNo || d.weftLotNo || d.parentGating?.weftYarnLotNo;
        return wLot ? String(wLot).trim() : null;
      }).filter(Boolean)
    )).join(', ');

    const weftYarns = Array.from(new Set(
      activeDetails.map((d: any) => d.weftCount || d.parentGating?.weftYarnName || d.weftYarnName).filter(Boolean)
    )).join(', ');

    const warpSets = Array.from(new Set(
      activeDetails.map((d: any) => d.sizingSetNo || d.parentGating?.sizingSetNo).filter(Boolean)
    )).join(', ');

    const mills = Array.from(new Set(
      activeDetails.map((d: any) => d.weftYarnMillName || d.parentGating?.weftYarnMillName).filter(Boolean)
    )).join(', ');

    const fabrics = Array.from(new Set(
      activeDetails.map((d: any) => d.fabricCodeQuality || d.changedFabricCodeQuality || d.parentGating?.fabricCodeQuality).filter(Boolean)
    )).join(', ');

    const lotForLoom = (selectedLot || []).find((l: any) => String(l.loomId) === String(selectedSwitchLoomId) && l.machineId);
    const lotMachineId = lotForLoom?.machineId;

    const savedIssueForLoom = (weavingYarnIssuetList || []).flatMap((item: any) =>
      (item.requirements || []).flatMap((r: any) =>
        (r.yarnIssues || []).map((yi: any) => ({ ...yi, parentItem: item }))
      )
    ).filter((yi: any) => String(yi.loomId) === String(selectedSwitchLoomId) && yi.machineId)
     .pop();

    const savedMachineId = savedIssueForLoom?.machineId;

    const loomObj = (loomList || []).find((l: any) => String(l.id) === String(selectedSwitchLoomId));
    const machineId = lotMachineId ||
      savedMachineId ||
      primaryGating?.machineId ||
      primaryGating?.machine_id ||
      primaryGating?.beamGatingDetails?.[0]?.machineId ||
      loomObj?.machineId ||
      loomObj?.machine_id;

    const machineObj = (machineList || []).find((m: any) =>
      String(m.id) === String(machineId) ||
      String(m.value) === String(machineId) ||
      String(m.machineNo) === String(machineId) ||
      String(m.machineName) === String(machineId)
    );

    const machineName = machineObj?.machineName ||
      machineObj?.machineNo ||
      machineObj?.name ||
      machineObj?.label ||
      primaryGating?.machineName ||
      primaryGating?.machineNo ||
      primaryGating?.machine?.machineName ||
      loomObj?.machineName ||
      loomObj?.machineNo ||
      loomObj?.machine?.machineName ||
      (typeof machineId === 'string' && isNaN(Number(machineId)) ? machineId : '-');

    return {
      machineName: machineName || '-',
      machineId: machineId ? String(machineId) : null,
      activeBeamNos: beamNos || (primaryGating?.sizedBeamNo || primaryGating?.gaitingNo || 'N/A'),
      beamMeter: beamMeters || (primaryGating?.beamMeter || primaryGating?.wrapMeters || 'N/A'),
      initialWeftLotNo: weftLots || (primaryGating?.weftYarnLotNo || 'N/A'),
      weftYarnName: weftYarns || primaryGating?.weftYarnName || 'N/A',
      warpSetNo: warpSets || primaryGating?.sizingSetNo || 'N/A',
      weftYarnMillName: mills || primaryGating?.weftYarnMillName || 'N/A',
      fabricDetails: fabrics || primaryGating?.fabricCodeQuality || 'N/A',
      activeGating: primaryGating
    };
  }, [selectedSwitchLoomId, beamGatingList, loomList, machineList, selectedLot, weavingYarnIssuetList]);



  useEffect(() => {
    if (selectedSwitchLoomId && switchLoomInfo.machineId) {
      setSelectedLot((prev: LotDetail[]) => {
        let hasChanges = false;
        const next = prev.map((lot) => {
          if (String(lot.loomId) === String(selectedSwitchLoomId) && !lot.machineId) {
            hasChanges = true;
            return { ...lot, machineId: switchLoomInfo.machineId };
          }
          return lot;
        });
        return hasChanges ? next : prev;
      });
    }
  }, [selectedSwitchLoomId, switchLoomInfo.machineId]);

  useEffect(() => {
    if (activeTab === 'switchLot' && selectedSwitchLoomId && yarnRequirementDetails.length === 0) {
      const weftYarnName = switchLoomInfo.weftYarnName;
      if (weftYarnName && weftYarnName !== 'N/A') {
        const matchedYarn = (yarnList || []).find((y: YarnMaster) =>
          y.yarnName?.toLowerCase().trim() === weftYarnName.toLowerCase().trim() ||
          y.yarnName?.toLowerCase().includes(weftYarnName.toLowerCase()) ||
          weftYarnName.toLowerCase().includes(y.yarnName?.toLowerCase() || '')
        );

        const yarnId = matchedYarn?.id || null;
        setYarnRequirementDetails([
          {
            id: 1,
            yarnName: weftYarnName,
            yarnCount: weftYarnName,
            actualYarn: weftYarnName,
            actualYarnId: yarnId,
            gramsPerMeter: '0',
            totalwarpReq: '999999',
            totalWarpIssued: '0',
            historicalTotal: 0,
            balanceWarpToIssue: '999999'
          }
        ]);
      }
    }
  }, [activeTab, selectedSwitchLoomId, switchLoomInfo.weftYarnName, yarnRequirementDetails.length, yarnList]);

  const orderEntrySums = useMemo(() => {
    const sums: { [key: number]: number } = {};
    selectedLot.filter((lot: any) => lot.issueType !== 'LOT_SWITCH').forEach((lot: any) => {
      const yarnId = Number(lot.actualYarnId || lot.yarnId);
      const qty = Number(lot.issueQty) || 0;
      if (yarnId) {
        sums[yarnId] = (sums[yarnId] || 0) + qty;
      }
    });
    return sums;
  }, [selectedLot]);

  const switchEntrySums = useMemo(() => {
    const sums: { [key: number]: number } = {};
    selectedLot.filter((lot: any) => lot.issueType === 'LOT_SWITCH').forEach((lot: any) => {
      const yarnId = Number(lot.actualYarnId || lot.yarnId);
      const qty = Number(lot.issueQty) || 0;
      if (yarnId) {
        sums[yarnId] = (sums[yarnId] || 0) + qty;
      }
    });
    return sums;
  }, [selectedLot]);

  const currentEntrySums = useMemo(() => {
    if (activeTab === 'switchLot') return switchEntrySums;
    return orderEntrySums;
  }, [activeTab, switchEntrySums, orderEntrySums]);

  const displayedSelectedLots = useMemo(() => {
    if (activeTab === 'switchLot') {
      return selectedLot.filter((lot: LotDetail) => lot.issueType === 'LOT_SWITCH');
    }
    return selectedLot.filter((lot: LotDetail) => lot.issueType !== 'LOT_SWITCH');
  }, [selectedLot, activeTab]);

  const handleActualYarnChange = (index: number, newYarnId: string) => {
    const yarnId = parseInt(newYarnId);
    const selectedYarn = yarnList.find((y: YarnMaster) => y.id === yarnId);

    const updatedRequirements = yarnRequirementDetails.map((req: any, idx: number) =>
      idx === index
        ? {
          ...req,
          actualYarn: selectedYarn?.yarnName || '',
          actualYarnId: yarnId
        }
        : req
    );

    setYarnRequirementDetails(updatedRequirements);

    const changedRequirement = updatedRequirements[index];
    if (changedRequirement) {
      setSelectedLot((prevLots: LotDetail[]) =>
        prevLots.map((lot) => {
          if (lot.yarnName === changedRequirement.yarnName && lot.yarnType === 'actual') {
            return {
              ...lot,
              alternateYarn: changedRequirement.actualYarn,
              yarnName: changedRequirement.actualYarn
            };
          }
          return lot;
        })
      );
    }
  };

  // Reusable function to load yarn requirements for a weaving contract
  const loadYarnRequirementsForContract = async (contractId: string, vendorId: string) => {

    const id = Number(contractId);
    if (!contractId || Number.isNaN(id) || id <= 0) {
      return;
    }

    try {
      const result = await dispatch(getWeavingContractById(id));
      const weavingContract = result?.payload;

      if (weavingContract) {
        let fabricCodes: string[] = [];
        if (weavingContract.items && weavingContract.items.length > 0) {
          const resolvedFabricDetails = weavingContract.items.map((item: any) => {
            const fabric = fabricMasterList.find((f: any) => f.id === parseInt(item.fabricCodeId));

            // If we can't find the fabric in the master list yet, use null as a signal
            if (!fabric && fabricMasterList.length > 0) {
              return `${item.fabricCodeId} - ${item.fabricQualityId}`;
            } else if (!fabric) {
              return null;
            }

            const fabricCode = fabric.fabricCode || item.fabricCodeId;
            const fabricQuality = fabric.fabricQuality || item.fabricQualityId;

            if (fabricCode && !fabricCodes.includes(fabricCode)) {
              fabricCodes.push(fabricCode);
            }

            return `${fabricCode} - ${fabricQuality}`;
          });

          // Only update if we successfully resolved the details or if we don't have them yet
          const hasResolvedAll = !resolvedFabricDetails.includes(null);
          if (hasResolvedAll) {
            const fabricDetailsString = resolvedFabricDetails.join(', ');
            setNewItem((prev: any) => ({ ...prev, fabricDetails: fabricDetailsString }));
            setValue('fabricDetails', fabricDetailsString);
          } else {
            // If we couldn't resolve from master list, but we have a value already (e.g. from navigation state),
            // we keep the existing value. If we have NO value, we use the IDs as fallback.
            const currentValue = getValues('fabricDetails') || newItem.fabricDetails;
            if (!currentValue) {
              const fallbackDetails = resolvedFabricDetails.map((d: any) => d || 'Loading...').join(', ');
              setNewItem((prev: any) => ({ ...prev, fabricDetails: fallbackDetails }));
              setValue('fabricDetails', fallbackDetails);
            }
          }
        }

        // Fetch overall totals for each yarn across all weaving yarn issues for this vendor and contract
        const overallTotalsByItemId: { [key: string]: number } = {};

        try {
          const issuesResponse = await apiService.get(`/weaving-yarn-issues?offset=0&limit=1000&vendorId=${vendorId}&weavingContractId=${id}`);
          const allIssues = issuesResponse?.data || issuesResponse || [];
          const filteredIssues = allIssues.filter((issue: any) =>
            String(issue.vendorId) === String(vendorId) &&
            String(issue.weavingContractId) === String(id)
          );

          filteredIssues.forEach((issue: any) => {
            if (issue.requirements && Array.isArray(issue.requirements)) {
              issue.requirements.forEach((req: any) => {
                const itemId = req.actualYarnId || req.yarnId;
                if (req.yarnIssues && Array.isArray(req.yarnIssues)) {
                  req.yarnIssues.forEach((yi: any) => {
                    const issueQty = Number(yi.issueQty) || 0;
                    if (itemId) {
                      overallTotalsByItemId[String(itemId)] = (overallTotalsByItemId[String(itemId)] || 0) + issueQty;
                    }
                  });
                }
              });
            }
          });
        } catch (error) {
          console.error("Failed to fetch overall totals for contract change:", error);
        }

        if (weavingContract?.yarnRequirements && weavingContract.yarnRequirements.length > 0) {
          const weftReqs = weavingContract.yarnRequirements.filter((yr: any) =>
            String(yr.yarnType).toLowerCase() === 'weft'
          );

          const requirementsToUse = weftReqs.length > 0 ? weftReqs : weavingContract.yarnRequirements;

          const requirements = requirementsToUse.map((weftReq: any, index: number) => {
            const code = fabricCodes[index] || fabricCodes[0];

            let finalYarnName = 'N/A';
            let actualYarnId = weftReq?.yarnId;

            if (weftReq?.yarnId) {
              const yarnFromList = yarnList.find((y: YarnMaster) => Number(y.id) === Number(weftReq.yarnId));
              if (yarnFromList?.yarnName) {
                finalYarnName = yarnFromList.yarnName;
              }
            }

            if (finalYarnName === 'N/A' && code) {
              const fabric = fabricMasterList.find((f: any) => f.fabricCode === code);
              const matchingWeft = fabric?.weftDetails?.find((wd: any) => Number(wd.yarnId) === Number(weftReq?.yarnId))
                || fabric?.weftDetails?.[index]
                || fabric?.weftDetails?.[0];
              if (matchingWeft?.yarnId) {
                actualYarnId = matchingWeft.yarnId;
                const yarnFromList = yarnList.find((y: YarnMaster) => Number(y.id) === Number(matchingWeft.yarnId));
                if (yarnFromList?.yarnName) {
                  finalYarnName = yarnFromList.yarnName;
                }
              }
            }

            if (finalYarnName === 'N/A' && weftReq?.yarnName) {
              finalYarnName = weftReq.yarnName;
            }

            const gramsPerMeterRaw = weftReq.gramsPerMeter ?? '';
            const gramsPerMeterValue = Number(weftReq.gramsPerMeter) || 0;
            const orderQuantity = weftReq.totalWeavingOrderQty || 0;
            const totalRequired = gramsPerMeterValue * orderQuantity;

            // Use derived historical total
            const historicalTotal = overallTotalsByItemId[String(actualYarnId)] || 0;
            const balanceToIssue = totalRequired - historicalTotal;

            return {
              id: weftReq.id,
              yarnName: finalYarnName,
              yarnCount: weftReq.yarnCount,
              actualYarn: finalYarnName,
              actualYarnId,
              gramsPerMeter: String(gramsPerMeterRaw),
              totalwarpReq: String(totalRequired),
              totalWarpIssued: String(0), // No issue yet in this entry
              historicalTotal: historicalTotal,
              balanceWarpToIssue: String(balanceToIssue.toFixed(2))
            };
          });

          setYarnRequirementDetails(requirements);
        } else {
          console.warn('No yarn requirements found in weaving contract');
          setYarnRequirementDetails([]);
        }

        setSelectedJobWork(weavingContract);
      }
    } catch (error) {
      console.error("Error fetching weaving contract by ID:", error);
      setYarnRequirementDetails([]);
    }
  };

  // Auto-fetch functionality when navigating from order-entry-management hyperlink
  useEffect(() => {
    if (isInitialized.current) return;

    const locationState = location.state;
    if (locationState?.source === 'order-entry-management' && locationState?.salesOrderId) {

      // If we have direct IDs from the state, use them immediately without waiting for weavingContractList
      if (locationState.weavingContractId && locationState.vendorId) {
        // Set initialized to true BEFORE reset() to prevent sync effects from clearing the data
        isInitialized.current = true;

        const fabricDetails = locationState.fabricDetails || '';

        reset({
          vendorId: String(locationState.vendorId),
          weavingContractId: String(locationState.weavingContractId),
          fabricDetails: fabricDetails,
          yarnIssueDate: new Date().toISOString().slice(0, 10),
          yarnIssueChallanNo: '',
          transportId: '',
          termsConditionsId: '',
          activeFlag: true
        });

        // Update local state for fabric details display
        setNewItem((prev: any) => ({ ...prev, fabricDetails }));

        loadYarnRequirementsForContract(String(locationState.weavingContractId), String(locationState.vendorId));
        return;
      }

      // Fallback: If no direct IDs, wait for weavingContractList to load and find them
      if (weavingContractList.length === 0 && weavingContractsLoading) return;

      const relatedContracts = weavingContractList.filter((wc: any) =>
        String(wc.salesOrderId) === String(locationState.salesOrderId) ||
        Number(wc.salesOrderId) === Number(locationState.salesOrderId) ||
        String(wc.salesOrderNo) === String(locationState.salesOrderNo)
      );

      if (relatedContracts.length > 0) {
        const selectedContract = relatedContracts[0];
        isInitialized.current = true;

        // Auto-populate form fields
        reset({
          vendorId: String(selectedContract.vendorId),
          weavingContractId: String(selectedContract.id),
          fabricDetails: '', // Will be populated by loadYarnRequirementsForContract
          yarnIssueDate: new Date().toISOString().slice(0, 10),
          yarnIssueChallanNo: '',
          transportId: '',
          termsConditionsId: '',
          activeFlag: true
        });

        loadYarnRequirementsForContract(String(selectedContract.id), String(selectedContract.vendorId));
      }
    }
  }, [location.state?.source, location.state?.salesOrderId, location.state?.weavingContractId, location.state?.vendorId, location.state?.fabricDetails, weavingContractList, reset, weavingContractsLoading]);

  // Separate effect to handle loadYarnRequirementsForContract when vendor and contract are selected
  useEffect(() => {
    const selectedVendorIdValue = watch('vendorId');
    const selectedContractIdValue = watch('weavingContractId');
    if (selectedVendorIdValue && selectedContractIdValue) {
      // If we are in edit mode and the values match the existing record, 
      // let the initialization effect handle loading the requirements to avoid overwriting IDs.
      if (weavingYarnIssueDtl && isInitialized.current &&
        selectedVendorIdValue === String(weavingYarnIssueDtl.vendorId) &&
        selectedContractIdValue === String(weavingYarnIssueDtl.weavingContractId)) {
        return;
      }
      loadYarnRequirementsForContract(selectedContractIdValue, selectedVendorIdValue);
    }
  }, [watch('vendorId'), watch('weavingContractId')]);

  useEffect(() => {
    if (weavingYarnIssueDtl && weavingYarnIssueDtl.id !== loadedDetailIdRef.current) {
      isInitialized.current = false;
    }
  }, [weavingYarnIssueDtl]);

  useEffect(() => {
    if (isInitialized.current) return;

    if (weavingYarnIssueDtl) {
      loadedDetailIdRef.current = weavingYarnIssueDtl.id ?? null;
      reset({
        id: weavingYarnIssueDtl.id,
        vendorId: String(weavingYarnIssueDtl.vendorId),
        weavingContractId: String(weavingYarnIssueDtl.weavingContractId),
        transportId: weavingYarnIssueDtl.transportId ? String(weavingYarnIssueDtl.transportId) : '',
        transportationDetails: weavingYarnIssueDtl.transportationDetails || '',
        termsConditionsId: weavingYarnIssueDtl.termsConditionsId ? String(weavingYarnIssueDtl.termsConditionsId) : '',
        vehicleNo: weavingYarnIssueDtl.vehicleNo || '',
        remarks: weavingYarnIssueDtl.remarks || '',
        grossWt: weavingYarnIssueDtl.grossWt || 0,
        fabricDetails: weavingYarnIssueDtl.fabricDetails || '',
        yarnIssueDate: weavingYarnIssueDtl.yarnIssueDate ? weavingYarnIssueDtl.yarnIssueDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        yarnIssueChallanNo: weavingYarnIssueDtl.yarnIssueChallanNo || '',
        activeFlag: weavingYarnIssueDtl.activeFlag !== false
      });

      setNewItem((prev: any) => ({ ...prev, fabricDetails: weavingYarnIssueDtl.fabricDetails || '' }));

      const allIssuesInDtl = (weavingYarnIssueDtl.requirements || []).flatMap((r: any) => r.yarnIssues || []);
      const hasSwitch = allIssuesInDtl.some((yi: any) => String(yi.issueType || '').toUpperCase() === 'LOT_SWITCH');
      if (hasSwitch) {
        setActiveTab('switchLot');
        const switchIssue = allIssuesInDtl.find((yi: any) => String(yi.issueType || '').toUpperCase() === 'LOT_SWITCH' && yi.loomId);
        if (switchIssue?.loomId) {
          setSelectedSwitchLoomId(String(switchIssue.loomId));
        }
      } else {
        setActiveTab('orderDetails');
      }

      if (weavingYarnIssueDtl.requirements || (weavingYarnIssueDtl as any).weavingYarnRequirementDtl) {
        const rawRequirements = weavingYarnIssueDtl.requirements || (weavingYarnIssueDtl as any).weavingYarnRequirementDtl || [];
        setYarnRequirementDetails(rawRequirements.map((req: any) => {
          let actualYarnId = req.yarnId;
          if (req.actualYarn && typeof req.actualYarn === 'string') {
            const matchedYarn = yarnList.find((y: YarnMaster) => y.yarnName === req.actualYarn);
            if (matchedYarn) {
              actualYarnId = matchedYarn.id;
            }
          }

          return {
            id: req.id,
            yarnName: req.yarnName,
            yarnCount: String(req.yarnCount),
            actualYarn: req.actualYarn || req.yarnName,
            actualYarnId: actualYarnId,
            gramsPerMeter: String(req.gramsPerMeter),
            totalwarpReq: String(req.totalReqQty),
            totalWarpIssued: String(req.totalIssueQty),
            balanceWarpToIssue: String(req.balanceToIssue)
          };
        }));
      }

      let initialRequirements = weavingYarnIssueDtl.requirements || (weavingYarnIssueDtl as any).weavingYarnRequirementDtl || [];
      const contract = weavingContractList.find((c: any) => String(c.id) === String(weavingYarnIssueDtl.weavingContractId));

      // Fallback: If no requirements but we have outward details, derive them
      if ((!initialRequirements || initialRequirements.length === 0) && weavingYarnIssueDtl.yarnOutwardStockDetails?.length > 0) {
        const derivedMap = new Map();
        weavingYarnIssueDtl.yarnOutwardStockDetails.forEach((out: any) => {
          const itemId = out.actualItemId || out.yarnId;
          if (!itemId) return;

          if (!derivedMap.has(String(itemId))) {
            const yarn = yarnList.find((y: any) => String(y.id) === String(itemId));

            // Try to find requirement details from the contract
            const contractReq = contract?.yarnRequirements?.find((cr: any) =>
              String(cr.yarnId) === String(itemId) ||
              (cr.yarnName === yarn?.yarnName && cr.yarnCount === yarn?.yarnCount)
            );

            derivedMap.set(String(itemId), {
              id: 0,
              actualItemId: itemId,
              yarnId: itemId,
              yarnName: yarn?.yarnName || contractReq?.yarnName || `Yarn ${itemId}`,
              actualYarn: yarn?.yarnName || contractReq?.yarnName || `Yarn ${itemId}`,
              yarnCount: yarn?.yarnCount || contractReq?.yarnCount || '',
              gramsPerMeter: contractReq?.gramsPerMeter || 0,
              totalReqQty: contractReq?.totalReqQty || 0,
              totalIssueQty: 0,
              balanceToIssue: contractReq?.totalReqQty || 0,
              yarnIssues: []
            });
          }
          const entry = derivedMap.get(String(itemId));
          entry.totalIssueQty += Number(out.issuedQty) || 0;
          entry.balanceToIssue = Math.max(0, (entry.totalReqQty || 0) - entry.totalIssueQty);
        });
        initialRequirements = Array.from(derivedMap.values());
      }

      // Transform requirements data with actual yarn - filtered to show only weft
      if (initialRequirements.length > 0) {
        const filteredReqs = initialRequirements.filter((req: any) => {
          if (!contract || !contract.yarnRequirements) return true;
          const contractReq = contract.yarnRequirements.find((cr: any) =>
            (String(cr.yarnId) === String(req.yarnId) || String(cr.yarnId) === String(req.actualItemId)) &&
            String(cr.yarnCount) === String(req.yarnCount)
          );
          return !contractReq || contractReq.yarnType === 'Weft';
        });

        const transformedReqs = filteredReqs.map((req: any) => {
          let actualYarnId = req.yarnId || req.actualItemId;
          if (req.actualYarn && typeof req.actualYarn === 'string') {
            const matchedYarn = yarnList.find((y: YarnMaster) => y.yarnName === req.actualYarn);
            if (matchedYarn) {
              actualYarnId = matchedYarn.id;
            }
          }

          // Calculate "This Entry" total from yarnIssues for accuracy
          const thisEntryTotal = (req.yarnIssues || [])
            .reduce((sum: number, yi: any) => sum + (Number(yi.issueQty) || 0), 0);

          // Fallback for Total Required Qty from contract if 0 or missing
          let totalRequired = Number(req.totalReqQty) || 0;
          if (totalRequired === 0 && contract?.yarnRequirements) {
            const contractReq = contract.yarnRequirements.find((cr: any) =>
              String(cr.yarnId) === String(actualYarnId) ||
              (cr.yarnName === req.yarnName && String(cr.yarnCount) === String(req.yarnCount))
            );
            if (contractReq) {
              totalRequired = Number(contractReq.totalReqQty) || 0;
            }
          }

          return {
            id: req.id,
            yarnName: req.yarnName,
            yarnCount: String(req.yarnCount || ''),
            yarnId: req.yarnId || req.actualItemId,
            actualYarn: req.actualYarn || req.yarnName,
            actualYarnId: actualYarnId,
            gramsPerMeter: String(req.gramsPerMeter || 0),
            totalwarpReq: String(totalRequired),
            totalWarpIssued: String(thisEntryTotal),
            overallTotalIssued: Number(req.overallTotalIssueQty || thisEntryTotal),
            historicalTotal: Math.max(0, Number(req.overallTotalIssueQty || thisEntryTotal) - thisEntryTotal),
            overallTotalIssueQty: req.overallTotalIssueQty
          };
        });

        const fetchOverallTotals = async () => {
          try {
            const contractId = Number(weavingYarnIssueDtl.weavingContractId);
            const vendorId = Number(weavingYarnIssueDtl.vendorId);
            const issuesResponse = await apiService.get(`/weaving-yarn-issues?offset=0&limit=1000&vendorId=${vendorId}&weavingContractId=${contractId}`);
            const allIssues = issuesResponse?.data || issuesResponse || [];

            const filteredIssues = allIssues.filter((issue: any) =>
              String(issue.vendorId) === String(vendorId) &&
              String(issue.weavingContractId) === String(contractId)
            );
            const overallTotalsByItemId: { [key: string]: number } = {};

            filteredIssues.forEach((issue: any) => {
              if (issue.requirements && Array.isArray(issue.requirements)) {
                issue.requirements.forEach((req: any) => {
                  const itemId = req.actualYarnId || req.yarnId;
                  if (req.yarnIssues && Array.isArray(req.yarnIssues)) {
                    req.yarnIssues.forEach((yi: any) => {
                      const issueQty = Number(yi.issueQty) || 0;
                      if (itemId) {
                        overallTotalsByItemId[String(itemId)] = (overallTotalsByItemId[String(itemId)] || 0) + issueQty;
                      }
                    });
                  }
                });
              }
            });

            const finalReqs = transformedReqs.map((req: any) => {
              const thisEntryTotal = Number(req.totalWarpIssued) || 0;
              const overallTotal = overallTotalsByItemId[String(req.actualYarnId)] || thisEntryTotal;
              const historicalTotal = Math.max(0, overallTotal - thisEntryTotal);
              const balance = Math.max(0, Number(req.totalwarpReq) - overallTotal);

              return {
                ...req,
                historicalTotal: historicalTotal,
                overallTotalIssued: overallTotal,
                balanceWarpToIssue: String(balance.toFixed(2))
              };
            });
            setYarnRequirementDetails(finalReqs);
          } catch (error) {
            console.error("Failed to fetch overall totals:", error);
            setYarnRequirementDetails(transformedReqs);
          }
        };
        fetchOverallTotals();
      }

      const finalRequirementsForLots = weavingYarnIssueDtl.requirements || (weavingYarnIssueDtl as any).weavingYarnRequirementDtl || initialRequirements || [];

      if (finalRequirementsForLots && finalRequirementsForLots.length > 0) {
        const allLots = finalRequirementsForLots.flatMap((req: any) =>
          (req.yarnIssues || []).map((issue: any, index: number) => {
            const yarnType = issue.alternateYarn && issue.alternateYarn !== req.yarnName ? 'actual' : 'original';
            const baseLotId = issue.orderItemId ?? issue.lotId ?? issue.inwardId ?? issue.id;
            const resolvedLotNumber = lotNumberMap?.[Number(issue.lotId)] || issue.lotNumber || issue.lotNo || '';
            const lotYarnId = issue.yarnId ?? req.actualYarnId ?? issue.actualYarnId ?? null;
            const issueType = issue.issueType || 'INITIAL';

            const effectiveLoomId = issue.loomId != null ? String(issue.loomId) : null;
            let effectiveMachineId = issue.machineId != null ? String(issue.machineId) : null;
            if (effectiveLoomId && !effectiveMachineId) {
              const loomObj = (loomList || []).find((l: any) => String(l.id) === String(effectiveLoomId));
              if (loomObj?.machineId || loomObj?.machine_id) {
                effectiveMachineId = String(loomObj.machineId || loomObj.machine_id);
              }
            }

            const uniqueId = buildWeavingLotUniqueId({
              yarnInwardStockDetailsId: issue.inwardId ?? null,
              orderItemId: issue.orderItemId ?? baseLotId,
              baseLotId,
              id: issue.inwardId ?? issue.id ?? index,
              itemId: lotYarnId,
              lotNumber: resolvedLotNumber,
              issueType,
            }, index, issueType);
            const conesPerBag = Number(issue.conesPerBag ?? 0);
            const kgsPerBag = Number(issue.kgsPerBag ?? 0);
            const conesWeight = issue.conesWeight != null
              ? Number(issue.conesWeight)
              : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);
            return {
              id: issue.id,
              uniqueId,
              weavingYarnRequirementId: issue.weavingYarnRequirementId,
              yarnName: issue.yarnName || req.yarnName,
              originalYarnName: req.yarnName,
              actualYarn: req.actualYarn || issue.actualYarn || req.yarnName,
              alternateYarn: issue.alternateYarn || req.actualYarn || issue.actualYarn || req.yarnName,
              actualYarnId: req.actualYarnId ?? issue.actualYarnId ?? null,
              yarnCount: req.yarnCount,
              availableQty: Number(issue.availableReqQty ?? issue.lotAvailableQty ?? 0),
              lotAvailableQty: Number(issue.lotAvailableQty ?? issue.availableReqQty ?? 0),
              issueQty: issue.issueQty,
              lotId: issue.lotId,
              baseLotId,
              lotNumber: resolvedLotNumber,
              yarnType,
              millId: issue.millId ?? null,
              warehouseId: issue.warehouseId ?? null,
              noOfBags: (issue.noOfBags !== null && issue.noOfBags !== undefined && String(issue.noOfBags) !== "") ? issue.noOfBags : "",
              kgsPerBag,
              conesPerBag,
              conesWeight,
              availableBags: Number(issue.availableBags ?? issue.lotAvailableBags ?? 0),
              lotAvailableBags: Number(issue.lotAvailableBags ?? issue.availableBags ?? 0),
              lotYarnId,
              orderItemId: issue.orderItemId ?? null,
              inwardId: issue.inwardId ?? null,
              yarnInwardStockDetailsId: issue.inwardId ?? null,
              inwardTypeId: issue.inwardTypeId ?? null,
              inwardNo: issue.inwardNo || 'N/A',
              loomId: effectiveLoomId,
              machineId: effectiveMachineId,
              beamGaitingId: issue.beamGaitingId != null ? String(issue.beamGaitingId) : null,
              issueType: issueType as 'INITIAL' | 'LOT_SWITCH',
              isEditing: true,
            };
          })
        );
        setSelectedLot(allLots);
      }

      // Mark as initialized only after all state has been set
      isInitialized.current = true;
      if (location.state?.weavingYarnIssueDtl) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [weavingYarnIssueDtl, reset, yarnList, fabricMasterList, lotNumberMap, location.pathname, navigate]);

  const handleSaveYarnIssue = () => {
    // 1. Calculate "Issued Qty (This Entry)" grouped by yarnCount
    const totalsByCount: { [count: string]: number } = selectedLot.reduce((acc: any, lot: LotDetail) => {
      const key = String(lot.yarnCount);
      const qty = Number(lot.issueQty) || 0;
      acc[key] = (acc[key] || 0) + qty;
      return acc;
    }, {});

    const totalsByActual: { [key: string]: number } = selectedLot.reduce((acc: any, lot: LotDetail) => {
      const key = buildActualYarnKey(lot.actualYarnId, lot.actualYarn ?? lot.yarnName, lot.yarnCount);
      const qty = Number(lot.issueQty) || 0;
      acc[key] = (acc[key] || 0) + qty;
      return acc;
    }, {});

    const updatedRequirements = yarnRequirementDetails.map((req: any) => {
      const reqKey = buildActualYarnKey(req.actualYarnId, req.actualYarn, req.yarnCount);
      const totalIssued = Number((totalsByActual[reqKey] || 0).toFixed(2));
      const totalRequired = Number(req.totalwarpReq) || 0;
      // const totalRequired = Number(req.totalwarpReq) || 0;
      // const balanceToIssue = Number(Math.max(0, totalRequired - totalIssued).toFixed(2));
      const countKey = String(req.yarnCount);
      const thisEntryIssued = Number((totalsByCount[countKey] || 0).toFixed(2)); // "This Entry"
      const historicalTotal = Number(req.historicalTotal) || 0;
      const overallTotal = historicalTotal + thisEntryIssued;
      const balanceToIssue = Number(Math.max(0, totalRequired - overallTotal).toFixed(2));

      return {
        ...req,
        totalWarpIssued: String(totalIssued),
        balanceWarpToIssue: String(balanceToIssue),
        overallTotalIssued: overallTotal
      };
    });

    setYarnRequirementDetails(updatedRequirements);

    const updatedLots = selectedLot.map((lot: LotDetail) => ({
      ...lot,
      isEditing: false
    }));
    setSelectedLot(updatedLots);

    console.log("Yarn issue saved successfully! Totals by actual yarn:", totalsByActual);
    console.log("Updated Requirements:", updatedRequirements);
  };

  const onSubmit = async (data: WeavingYarnIssueFormData) => {
    const yarnTotalsById: { [key: number]: number } = {};
    let resolvedYarnIssueChallanNo = yarnIssueChallanNo || data.yarnIssueChallanNo || weavingYarnIssueDtl?.yarnIssueChallanNo || '';

    // Generate new number if needed (for create mode)
    if (!weavingYarnIssueDtl?.id && !resolvedYarnIssueChallanNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Weaving Yarn Issue"
        });
        resolvedYarnIssueChallanNo = docResponse.documentNumber;
        setYarnIssueChallanNo(resolvedYarnIssueChallanNo);
      } catch (error) {
        console.warn("Failed to generate weaving yarn issue number:", error);
        // Fallback: generate a basic sequential number
        resolvedYarnIssueChallanNo = `WYI/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}/001`;
      }
    }

    const yarnTotals: { [key: string]: number } = {};
    selectedLot.forEach((lot: LotDetail) => {
      const issuedQty = Number(lot.issueQty) || 0;
      const itemId = Number(lot.actualYarnId || lot.yarnId);
      const key = buildActualYarnKey(lot.actualYarnId, lot.actualYarn ?? lot.yarnName, lot.yarnCount);

      if (itemId) {
        yarnTotalsById[itemId] = (yarnTotalsById[itemId] || 0) + issuedQty;
      }
      yarnTotals[key] = (yarnTotals[key] || 0) + issuedQty;
    });
    // selectedLot.forEach((lot: LotDetail) => {
    //   const key = buildActualYarnKey(lot.actualYarnId, lot.actualYarn ?? lot.yarnName, lot.yarnName ?? lot.yarnCount);
    //   const issuedQty = Number(lot.issueQty) || 0;
    //   yarnTotals[key] = (yarnTotals[key] || 0) + issuedQty;
    //    const itemId = Number(lot.actualYarnId || lot.yarnId);

    //   if (itemId) {
    //     yarnTotalsById[itemId] = (yarnTotalsById[itemId] || 0) + issuedQty;
    //   }
    // });

    const activeGating = switchLoomInfo?.activeGating;
    const selectedContractIdVal = watch('weavingContractId') || data.weavingContractId || activeGating?.weavingContractId || activeGating?.beamGatingDetails?.[0]?.weavingContractId;
    const selectedContract = (weavingContractList || []).find((wc: any) => String(wc.id) === String(selectedContractIdVal));

    const vendor = vendorList?.find((v: any) => v.id === parseInt(String(data.vendorId)));
    const vendorName = String(vendor?.vendorName || "").trim().toLowerCase();
    const companies = Array.isArray(companyMasterList) ? companyMasterList : (companyMasterList?.data || []);
    const matchedCompany = companies?.find((c: any) => String(c?.companyName || c?.name || "").trim().toLowerCase() === vendorName);
    const tradingCompanyId = resolvedCompanyId ?? null;
    const factoryCompanyId = matchedCompany?.id || null;
    const contractOrderTypeId = Number(selectedContract?.orderTypeId ?? 0);
    const effectiveFactoryCompanyId = contractOrderTypeId === 1 ? factoryCompanyId : null;

    const jobOrders: any[] = Array.isArray(weavingJobWorkOrderList) ? weavingJobWorkOrderList : Array.isArray(weavingJobWorkOrderList?.data) ? weavingJobWorkOrderList.data : [];
    const matchedJobOrder = (jobOrders || []).find((wo: any) => String(wo?.weavingContractId) === String(data.weavingContractId));
    const weavingJobWorkOrderId = matchedJobOrder?.id ?? null;

    const invalidBagsLot = selectedLot.find((lot: LotDetail) => Number(lot.noOfBags ?? 0) > Number(lot.availableBags ?? lot.lotAvailableBags ?? 0));
    if (invalidBagsLot) {
      toast.error(`Issuing No of Bags cannot exceed Available Bags for lot ${invalidBagsLot.lotNumber || invalidBagsLot.yarnName || ''}`);
      return;
    }

    const invalidQtyLot = selectedLot.find((lot: LotDetail) => Number(lot.issueQty ?? 0) > Number(lot.availableQty ?? lot.lotAvailableQty ?? 0));
    if (invalidQtyLot) {
      toast.error(`Issue Qty cannot exceed Available Qty for lot ${invalidQtyLot.lotNumber || invalidQtyLot.yarnName || ''}`);
      return;
    }

    const rawVendorId = watch('vendorId') ||
      data.vendorId ||
      activeGating?.vendorId ||
      activeGating?.beamGatingDetails?.[0]?.vendorId ||
      selectedContract?.vendorId ||
      selectedLot.find((l: any) => l.vendorId)?.vendorId ||
      weavingYarnIssueDtl?.vendorId;

    const resolvedVendorId = rawVendorId ? Number(rawVendorId) : null;

    if (!resolvedVendorId) {
      toast.error("Vendor is required. Please select an Active Loom or Vendor.");
      return;
    }

    const rawContractId = watch('weavingContractId') ||
      data.weavingContractId ||
      activeGating?.weavingContractId ||
      activeGating?.beamGatingDetails?.[0]?.weavingContractId ||
      selectedContract?.id ||
      selectedLot.find((l: any) => l.weavingContractId)?.weavingContractId ||
      weavingYarnIssueDtl?.weavingContractId;

    const resolvedContractId = rawContractId ? Number(rawContractId) : null;
    const resolvedTermsId = watch('termsConditionsId') || data.termsConditionsId || termsContitionsList?.[0]?.id;

    const isExistingHeader = Boolean(toNullableId(weavingYarnIssueDtl?.id));

    const payload = {
      id: toNullableId(weavingYarnIssueDtl?.id),
      vendorId: resolvedVendorId,
      weavingContractId: resolvedContractId,
      weavingContractNo: selectedContract?.weavingContractNo || activeGating?.weavingContractNo || '',
      transportationDetails: data.transportationDetails || '',
      transportId: toNullableId(data.transportId),
      termsConditionsId: toNullableId(resolvedTermsId),
      fabricDetails: data.fabricDetails || newItem.fabricDetails || switchLoomInfo.fabricDetails || '',
      yarnIssueDate: data.yarnIssueDate || new Date().toISOString().slice(0, 10),
      yarnIssueChallanNo: resolvedYarnIssueChallanNo,
      vehicleNo: data.vehicleNo || '',
      remarks: data.remarks || '',
      grossWt: Number(data.grossWt || getValues('totalNetWt') || 0),
      totalNetWt: Number(data.totalNetWt || 0),
      orderTypeId: contractOrderTypeId,
      weavingJobWorkOrderId: weavingJobWorkOrderId,
      tradingCompanyId: tradingCompanyId,
      factoryCompanyId: effectiveFactoryCompanyId,
      companyId: resolvedCompanyId,
      activeFlag: true,
      requirements: yarnRequirementDetails.map((req: any) => {
        const reqKey = buildActualYarnKey(req.actualYarnId, req.actualYarn, req.yarnCount);
        const totalIssued = yarnTotals[reqKey] || 0;
        const totalRequired = Number(req.totalwarpReq) || 0;
        // const balanceToIssue = Math.max(0, totalRequired - totalIssued);
        const itemId = Number(req.actualYarnId || req.yarnId);
        const thisEntryIssued = yarnTotalsById[itemId] || 0;
        const historicalTotal = Number(req.historicalTotal) || 0;
        const balanceToIssue = Math.max(0, totalRequired - (historicalTotal + thisEntryIssued));
        const hasReqId = Boolean(toNullableId(req.id));

        return {
          id: isExistingHeader ? toNullableId(req.id) : null,
          yarnName: req.yarnName,
          yarnCount: Number(req.yarnCount),
          actualYarn: req.actualYarn,
          actualYarnId: toNullableId(req.actualYarnId),
          yarnId: toNullableId(req.actualYarnId),
          gramsPerMeter: Number(req.gramsPerMeter),
          totalReqQty: Number(req.totalwarpReq),
          totalIssueQty: totalIssued,
          overallTotalIssueQty: historicalTotal + thisEntryIssued,
          balanceToIssue: balanceToIssue,
          activeFlag: true,
          yarnIssues: selectedLot
            .filter((lot: any) => {
              const lotKey = buildActualYarnKey(lot.actualYarnId, lot.actualYarn ?? lot.yarnName, lot.yarnCount);
              return lotKey === reqKey;
            })
            .map((lot: any) => ({
              id: (isExistingHeader && hasReqId) ? toNullableId(lot.id) : null,
              weavingYarnRequirementId: isExistingHeader ? toNullableId(req.id) : null,
              yarnName: lot.yarnType === 'original' ? (req.yarnName || lot.yarnName) : (req.actualYarn || lot.actualYarn || lot.yarnName),
              actualYarn: req.actualYarn || lot.actualYarn || lot.yarnName,
              yarnId: toNullableId(lot.lotYarnId),
              actualYarnId: toNullableId(req.actualYarnId),
              millId: toNullableId(lot.millId),
              warehouseId: toNullableId(lot.warehouseId),
              availableReqQty: Number(lot.availableQty ?? lot.lotAvailableQty ?? 0),
              conesPerBag: Number(lot.conesPerBag ?? 0),
              conesWeight: Number(lot.conesWeight ?? 0),
              issueQty: Number(lot.issueQty) || 0,
              noOfBags: Number(lot.noOfBags ?? 0),
              kgsPerBag: Number(lot.kgsPerBag ?? 0),
              lotNumber: lot.lotNumber || '',
              lotAvailableBags: Number(lot.lotAvailableBags ?? lot.availableBags ?? 0),
              activeFlag: lot.activeFlag !== false,
              inwardId: toNullableId(lot.inwardId ?? lot.yarnInwardStockDetailsId),
              orderItemId: toNullableId(lot.orderItemId),
              inwardTypeId: toNullableId(lot.inwardTypeId),
              loomId: toNullableId(lot.loomId),
              machineId: toNullableId(lot.machineId),
              beamGaitingId: toNullableId(lot.beamGaitingId),
              issueType: lot.issueType || 'INITIAL',
            }))
        };
      })
    };

    try {
      const currentEditingId = getValues("id") || watch("id") || weavingYarnIssueDtl?.id;
      if (currentEditingId) {
        await dispatch(updateWeavingYarnIssue({ id: Number(currentEditingId), data: payload, companyId: resolvedCompanyId })).unwrap();
        toast.success("Weaving Yarn Issue updated successfully!");
      } else {
        await dispatch(createWeavingYarnIssue(payload)).unwrap();
        if (resolvedYarnIssueChallanNo) {
          const sequencePart = resolvedYarnIssueChallanNo.split('/').pop() || resolvedYarnIssueChallanNo;
          documentNumberService.updateMemoryCache('Weaving Yarn Issue', sequencePart);
        }
        toast.success("Weaving Yarn Issue saved successfully!");
      }

      const allBalanceZero = payload.requirements.length > 0 &&
        payload.requirements.every((req: any) => Number(req.balanceToIssue ?? 0) <= 0);
      if (allBalanceZero) {
        const contractNo = payload.weavingContractNo || '';
        toast.info(`You have issued all remaining quantities for this${contractNo ? ' ' + contractNo : ''}.`);
      }

      // Refresh weaving yarn issues in store to update list at bottom of page
      const listParams: { companyId?: number; isFetchAll?: boolean } = { isFetchAll: true };
      if (resolvedCompanyId) listParams.companyId = resolvedCompanyId;
      dispatch(getAllWeavingYarnIssue(listParams as any));
      dispatch(getAllBeamGaitings({ fetchAll: true } as any));

      // Check if user came from order-entry-management and redirect back if needed
      const source = location.state?.source;
      if (source === 'order-entry-management') {
        navigate("/transaction/order-entry-management", {
          state: {
            source: 'order-entry-management',
            refreshData: true,
            activeTab: location.state?.activeTab,
            expandedRowId: location.state?.expandedRowId,
            salesOrderId: location.state?.salesOrderId,
            flowType: location.state?.flowType,
            selectedHyperlink: location.state?.selectedHyperlink
          }
        });
      } else {
        // Reset form and all state to allow putting another yarn issue immediately
        reset({
          yarnIssueDate: new Date().toISOString().slice(0, 10),
          yarnIssueChallanNo: '',
          vendorId: '',
          weavingContractId: '',
          transportId: '',
          transportationDetails: '',
          termsConditionsId: '',
          vehicleNo: '',
          remarks: '',
          grossWt: 0,
          totalNetWt: 0,
          activeFlag: true
        });

        setSelectedSwitchLoomId("");
        setSwitchLoomGaiting(null);
        setSelectedJobWork([]);
        setYarnRequirementDetails([]);
        setSelectedLot([]);
        setTempIssueSum({});
        setNewItem({ fabricDetails: '' });
        setIssueErrors({});

        // Clear location state if editing so form returns to clean entry mode
        if (location.state?.weavingYarnIssueDtl) {
          navigate("/transaction/weaving-yarn-issue", { replace: true, state: {} });
        }
      }
    } catch (error: any) {
      const message = error?.message || 'Failed to save Weaving Yarn Issue';
      toast.error(message);
    }
  };


  const handleJobWorkChange = async (value: string) => {
    setSelectedJobWork([]);
    setYarnRequirementDetails([]);
    setNewItem((prev: any) => ({ ...prev, fabricDetails: '' }));
    setValue('weavingContractId', value, { shouldValidate: true });

    const vendorId = getValues('vendorId');
    await loadYarnRequirementsForContract(value, vendorId);
  };

  // const handleYarnIssue = async () => {
  //   setShowLotDialog(true);
  //   try {
  //     const list = Array.isArray(purchaseInwardList?.data) ? purchaseInwardList.data : purchaseInwardList;
  //     const lots = (list || []).flatMap((pi: any) =>
  //       (pi.purchaseInwardItemsDtl || []).flatMap((item: any) =>
  //         (item.lotEntries || []).map((le: any) => ({
  //           ...le
  //         }))
  //       )
  //     );

  //     if (lots && lots.length > 0) {
  //       const availableYarnCounts = yarnRequirementDetails.map((req: any) => ({
  //         yarnCount: req.yarnCount,
  //         originalYarnName: req.yarnName,
  //         actualYarn: req.actualYarn,
  //         actualYarnId: req.actualYarnId
  //       }));

  //       const transformedLots: LotDetail[] = [];

  //       availableYarnCounts.forEach((yarnReq: any, yarnIndex: number) => {
  //         lots
  //           .filter((lot: any) => Number(lot.quantity) > 0 && lot.activeFlag !== false)
  //           .forEach((lot: any, lotIndex: number) => {
  //             if (lotIndex % availableYarnCounts.length === yarnIndex) {
  //               const pref = inwardIndex.get(`${lot.id}|${lot.yarnId}`);
  //               const rawMillId = pref?.millId;
  //               const normalizedMill = millOptions.find((m: any) => String(m.id) === String(rawMillId) || String(m.subCategoryId) === String(rawMillId));
  //               const defaultMillId = normalizedMill ? String(normalizedMill.id) : '';
  //               const defaultWarehouseId = pref?.warehouseId != null ? String(pref.warehouseId) : '';

  //               transformedLots.push({
  //                 id: lot.id,
  //                 uniqueId: `original_${lot.id}_${yarnIndex}`,
  //                 yarnName: yarnReq.originalYarnName,
  //                 originalYarnName: yarnReq.originalYarnName,
  //                 yarnCount: yarnReq.yarnCount,
  //                 actualYarn: yarnReq.actualYarn,
  //                 alternateYarn: yarnReq.originalYarnName,
  //                 lotNumber: lot.lotNumber || `LOT-${lot.id}`,
  //                 availableQty: Number(lot.quantity) - Number(lot.rejectedQuantity || 0),
  //                 yarnType: 'original',
  //                 millId: defaultMillId,
  //                 warehouseId: defaultWarehouseId,
  //                 activeFlag: lot.activeFlag !== false,
  //                 baseLotId: lot.id,
  //                 lotYarnId: lot.yarnId,
  //                 noOfBags: Number(lot.noOfBags) || 0,
  //                 kgsPerBag: Number(lot.kgsPerBag) || 0
  //               });

  //               transformedLots.push({
  //                 id: lot.id,
  //                 uniqueId: `actual_${lot.id}_${yarnIndex}`,
  //                 yarnName: yarnReq.actualYarn,
  //                 originalYarnName: yarnReq.originalYarnName,
  //                 yarnCount: yarnReq.yarnCount,
  //                 actualYarn: yarnReq.actualYarn,
  //                 alternateYarn: yarnReq.actualYarn,
  //                 lotNumber: lot.lotNumber || `LOT-${lot.id}`,
  //                 availableQty: Number(lot.quantity) - Number(lot.rejectedQuantity || 0),
  //                 yarnType: 'actual',
  //                 millId: defaultMillId,
  //                 warehouseId: defaultWarehouseId,
  //                 activeFlag: lot.activeFlag !== false,
  //                 baseLotId: lot.id,
  //                 lotYarnId: lot.yarnId,
  //                 noOfBags: Number(lot.noOfBags) || 0,
  //                 kgsPerBag: Number(lot.kgsPerBag) || 0
  //               });
  //             }
  //           });
  //       });

  //       if (transformedLots.length === 0 && availableYarnCounts.length > 0) {
  //         lots
  //           .filter((lot: any) => Number(lot.quantity) > 0 && lot.activeFlag !== false)
  //           .forEach((lot: any, index: number) => {
  //             const yarnReq = availableYarnCounts[index % availableYarnCounts.length];

  //             const pref = inwardIndex.get(`${lot.id}|${lot.yarnId}`);
  //             const rawMillId = pref?.millId;
  //             const normalizedMill = millOptions.find((m: any) => String(m.id) === String(rawMillId) || String(m.subCategoryId) === String(rawMillId));
  //             const defaultMillId = normalizedMill ? String(normalizedMill.id) : '';
  //             const defaultWarehouseId = pref?.warehouseId != null ? String(pref.warehouseId) : '';

  //             transformedLots.push({
  //               id: lot.id,
  //               uniqueId: `original_${lot.id}_${index}`,
  //               yarnName: yarnReq.originalYarnName,
  //               originalYarnName: yarnReq.originalYarnName,
  //               yarnCount: yarnReq.yarnCount,
  //               actualYarn: yarnReq.actualYarn,
  //               alternateYarn: yarnReq.originalYarnName,
  //               lotNumber: lot.lotNumber || `LOT-${lot.id}`,
  //               availableQty: Number(lot.quantity) - Number(lot.rejectedQuantity || 0),
  //               yarnType: 'original',
  //               millId: defaultMillId,
  //               warehouseId: defaultWarehouseId,
  //               activeFlag: lot.activeFlag !== false,
  //               baseLotId: lot.id,
  //               lotYarnId: lot.yarnId,
  //               noOfBags: Number(lot.noOfBags) || 0,
  //               kgsPerBag: Number(lot.kgsPerBag) || 0
  //             });

  //             transformedLots.push({
  //               id: lot.id,
  //               uniqueId: `actual_${lot.id}_${index}`,
  //               yarnName: yarnReq.actualYarn,
  //               originalYarnName: yarnReq.originalYarnName,
  //               yarnCount: yarnReq.yarnCount,
  //               actualYarn: yarnReq.actualYarn,
  //               alternateYarn: yarnReq.actualYarn,
  //               lotNumber: lot.lotNumber || `LOT-${lot.id}`,
  //               availableQty: Number(lot.quantity) - Number(lot.rejectedQuantity || 0),
  //               yarnType: 'actual',
  //               millId: defaultMillId,
  //               warehouseId: defaultWarehouseId,
  //               activeFlag: lot.activeFlag !== false,
  //               baseLotId: lot.id,
  //               lotYarnId: lot.yarnId,
  //               noOfBags: Number(lot.noOfBags) || 0,
  //               kgsPerBag: Number(lot.kgsPerBag) || 0
  //             });
  //           });
  //       }

  //       const mergedLots = transformedLots.map((lot: any) => {
  //         const match = (selectedLot || []).find((sel: any) => {
  //           const selLotId = String(sel.lotId ?? sel.baseLotId ?? sel.id ?? '');
  //           const lotBaseId = String(lot.baseLotId ?? lot.id ?? '');
  //           if (selLotId !== lotBaseId) return false;
  //           if (sel.yarnType) {
  //             if (String(sel.yarnType) !== String(lot.yarnType)) return false;
  //           } else {
  //             const lotYarnName = lot.yarnType === 'original' ? lot.originalYarnName : lot.yarnName;
  //             if (String(sel.yarnName) !== String(lotYarnName)) return false;
  //           }
  //           return true;
  //         });
  //         if (!match) return lot;
  //         return {
  //           ...lot,
  //           millId: match.millId ?? lot.millId,
  //           warehouseId: match.warehouseId ?? lot.warehouseId,
  //           noOfBags: match.noOfBags ?? lot.noOfBags,
  //           kgsPerBag: match.kgsPerBag ?? lot.kgsPerBag,
  //         };
  //       });
  //       setYarnIssueDetails(mergedLots);

  //       const preselectedIds = mergedLots
  //         .filter((lot: any) =>
  //           (selectedLot || []).some((sel: any) => {
  //             const selLotId = String(sel.lotId ?? sel.baseLotId ?? sel.id ?? '');
  //             const lotBaseId = String(lot.baseLotId ?? lot.id ?? '');
  //             const idMatch = selLotId && selLotId === lotBaseId;
  //             const lotNoMatch = String(sel.lotNumber ?? '').trim() !== '' && String(sel.lotNumber).trim() === String(lot.lotNumber ?? '').trim();
  //             if (!(idMatch || lotNoMatch)) return false;
  //             if (sel.yarnType) return String(sel.yarnType) === String(lot.yarnType);
  //             const lotYarnName = lot.yarnType === 'original' ? (lot.originalYarnName ?? lot.yarnName) : lot.yarnName;
  //             const selAlt = String(sel.alternateYarn ?? '');
  //             const selOrig = String(sel.originalYarnName ?? '');
  //             const selYarn = String(sel.yarnName ?? '');
  //             return selYarn === String(lotYarnName) || selAlt === String(lot.yarnName) || selOrig === String(lot.originalYarnName ?? lot.yarnName);
  //           })
  //         )
  //         .map((l: any) => l.uniqueId || '');
  //       setDialogSelectedIds(preselectedIds);
  //     } else {
  //       setYarnIssueDetails([]);
  //     }
  //   } catch (error) {
  //     setYarnIssueDetails([]);
  //   }
  // };

  const handleYarnIssue = async () => {
    if (yarnRequirementDetails.length === 0) {
      alert('Please select a weaving contract first to load requirements.');
      return;
    }

    setShowLotDialog(true);
    try {
      const itemIds = yarnRequirementDetails.map((req: any) => req.actualYarnId).join(',');
      const response = await apiService.get(
        buildYarnInwardStockUrl(itemIds, resolvedCompanyId)
      );

      if (response && Array.isArray(response)) {
        const currentTabIssueType = activeTab === 'switchLot' ? 'LOT_SWITCH' : 'INITIAL';

        const transformedLots: LotDetail[] = response.map((lot: any, index: number) => {
          const yarnName = yarnList.find((y: any) => String(y.id) === String(lot.itemId))?.yarnName || `Yarn-${lot.itemId}`;
          const yarnId = Number(lot.itemId);
          const resolvedStockDetailId = lot.yarnInwardStockDetailsId ?? lot.stockDetailsId ?? null;
          const uniqueId = buildWeavingLotUniqueId({ ...lot, yarnInwardStockDetailsId: resolvedStockDetailId }, index, currentTabIssueType);
          const conesPerBag = Number(lot.conesPerBag ?? 0);
          const kgsPerBag = Number(lot.kgsPerBag ?? 0);
          const conesWeight = lot.conesWeight != null
            ? Number(lot.conesWeight)
            : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);
          const matchingReq = yarnRequirementDetails.find((r: any) => String(r.actualYarnId) === String(yarnId));
          const inwardTypeId = lot.inwardTypeId;
          const inwardType = inwardTypes.find((t: any) => String(t.id) === String(inwardTypeId))?.code || 'N/A';
          return {
            id: lot.id || index,
            lotId: lot.lotId ?? lot.orderItemId ?? lot.baseLotId ?? index,
            uniqueId: uniqueId,
            baseLotId: lot.orderItemId ?? lot.baseLotId,
            yarnName: yarnName,
            originalYarnName: yarnName,
            actualYarn: yarnName,
            yarnCount: matchingReq ? String(matchingReq.yarnCount) : '0',
            lotNumber: lot.lotNo || lot.lotNumber || `LOT-${lot.orderItemId ?? index}`,
            availableQty: Number(lot.availableQty || 0),
            lotAvailableQty: Number(lot.availableQty || 0),
            issueQty: "",
            alternateYarn: yarnName,
            activeFlag: lot.activeFlag !== false,
            millId: lot.millId ?? null,
            warehouseId: lot.warehouseId ?? null,
            availableBags: Number(lot.availableBags || 0),
            lotAvailableBags: Number(lot.availableBags || 0),
            inwardBags: Number(lot.inwardBags ?? 0),
            noOfBags: "",
            kgsPerBag,
            conesPerBag,
            conesWeight,
            yarnType: 'original',
            lotYarnId: yarnId,
            orderItemId: lot.orderItemId,
            inwardId: resolvedStockDetailId ?? lot.inwardId ?? (lot.id ? Number(lot.id) : null),
            yarnInwardStockDetailsId: resolvedStockDetailId ?? lot.inwardId ?? (lot.id ? Number(lot.id) : null),
            inwardTypeId,
            inwardType,
            inwardNo: lot.inwardNo || 'N/A',
            poCategoryId: lot.poCategoryId,
            issueType: currentTabIssueType as any,
          };
        });

        const selectedLotKeys = new Set<string>(
          (selectedLot || [])
            .filter((lot: LotDetail) =>
              activeTab === 'switchLot' ? lot.issueType === 'LOT_SWITCH' : lot.issueType !== 'LOT_SWITCH'
            )
            .map((lot: LotDetail) => buildWeavingLotSelectionKey(lot, currentTabIssueType))
        );

        const mergedLots = transformedLots.map((lot: LotDetail) => {
          const lotKey = buildWeavingLotSelectionKey(lot, currentTabIssueType);
          const match = (selectedLot || []).find((sel: LotDetail) =>
            (activeTab === 'switchLot' ? sel.issueType === 'LOT_SWITCH' : sel.issueType !== 'LOT_SWITCH') &&
            buildWeavingLotSelectionKey(sel, currentTabIssueType) === lotKey
          );

          if (match) {
            return {
              ...lot,
              id: match.id,
              weavingYarnRequirementId: match.weavingYarnRequirementId,
              orderItemId: lot.orderItemId ?? match.orderItemId,
              inwardId: lot.inwardId ?? match.inwardId ?? match.yarnInwardStockDetailsId ?? null,
              yarnInwardStockDetailsId: lot.yarnInwardStockDetailsId ?? match.yarnInwardStockDetailsId ?? match.inwardId ?? null,
              millId: (match.millId !== null && match.millId !== undefined && String(match.millId) !== "") ? match.millId : lot.millId,
              warehouseId: (match.warehouseId !== null && match.warehouseId !== undefined && String(match.warehouseId) !== "") ? match.warehouseId : lot.warehouseId,
              noOfBags: (match.noOfBags !== null && match.noOfBags !== undefined && String(match.noOfBags) !== "") ? match.noOfBags : lot.noOfBags,
              kgsPerBag: (match.kgsPerBag !== null && match.kgsPerBag !== undefined && String(match.kgsPerBag) !== "") ? match.kgsPerBag : lot.kgsPerBag,
              issueQty: (match.issueQty !== null && match.issueQty !== undefined && String(match.issueQty) !== "") ? match.issueQty : lot.issueQty,
              alternateYarn: match.alternateYarn || lot.alternateYarn,
              yarnType: match.yarnType || lot.yarnType,
              loomId: match.loomId ?? lot.loomId ?? null,
              machineId: match.machineId ?? lot.machineId ?? null,
              beamGaitingId: match.beamGaitingId ?? lot.beamGaitingId ?? null,
              issueType: match.issueType || currentTabIssueType,
            };
          }
          return lot;
        });

        const purchaseInwardMergedLots = mergedLots.filter((lot: LotDetail) => {
          const typeId = Number(lot.inwardTypeId);
          const typeStr = String(lot.inwardType || '').toLowerCase();
          return typeId === 1 || typeStr.includes('purchase');
        });

        setYarnIssueDetails(purchaseInwardMergedLots);

        const preselectedIds = purchaseInwardMergedLots.reduce<string[]>((acc, lot: LotDetail) => {
          const id = lot.uniqueId;
          if (id && selectedLotKeys.has(buildWeavingLotSelectionKey(lot, currentTabIssueType))) {
            acc.push(id);
          }
          return acc;
        }, []);

        setDialogSelectedIds(preselectedIds);
      } else {
        setYarnIssueDetails([]);
        setDialogSelectedIds([]);
      }
    } catch (error) {
      console.error('Error in handleYarnIssue:', error);
      setYarnIssueDetails([]);
      setDialogSelectedIds([]);
    }
  };

  const handleLotSelect = (uniqueId: string) => {
    const isCurrentlySelected = dialogSelectedIds.includes(uniqueId);
    if (!isCurrentlySelected) {
      const lotObj = yarnIssueDetails.find((l: any) => l.uniqueId === uniqueId);
      const assignedWeftCount = (switchLoomInfo?.weftYarnName && switchLoomInfo.weftYarnName !== 'N/A') ? switchLoomInfo.weftYarnName : '';
      const assignedWeftLotNo = (switchLoomInfo?.initialWeftLotNo && switchLoomInfo.initialWeftLotNo !== 'N/A') ? switchLoomInfo.initialWeftLotNo : '';

      if (lotObj) {
        const lotYarn = (lotObj.yarnName || lotObj.actualYarn || '').toLowerCase().replace(/\s+/g, '');
        const reqCount = assignedWeftCount.toLowerCase().replace(/\s+/g, '');
        const lotNo = normalizeWeavingLotNumber(lotObj.lotNumber);
        const reqLotNo = normalizeWeavingLotNumber(assignedWeftLotNo);

        const countMatches = !reqCount || lotYarn.includes(reqCount) || reqCount.includes(lotYarn);

        if (activeTab === 'switchLot') {
          // Switch Lot tab: User CAN select other lots, but NOT the current initial lot
          if (reqLotNo && lotNo === reqLotNo) {
            toast.warning(`Cannot select Current Initial Lot No "${lotObj.lotNumber}" in Switch Lot tab. Please select a different lot for lot switch.`);
            return;
          }
          if (!countMatches) {
            toast.warning(`Validation Alert: Selected Loom requires Weft Count "${assignedWeftCount}". Selected lot count/yarn is "${lotObj.yarnName}".`);
            return;
          }
        } else {
          // Order Details tab (Initial Lot entry)
          const lotMatches = !reqLotNo || lotNo === reqLotNo;
          if (!countMatches || !lotMatches) {
            toast.warning(`Validation Alert: Selected Loom requires Weft Count "${assignedWeftCount || 'N/A'}" and Lot No "${assignedWeftLotNo || 'N/A'}". Cannot select non-matching lot "${lotObj.lotNumber}".`);
            return;
          }
        }
      }
    }

    setDialogSelectedIds((prev) => {
      if (prev.includes(uniqueId)) {
        return prev.filter(id => id !== uniqueId);
      } else {
        return [...prev, uniqueId];
      }
    });
  };

  const handleAlternateYarnChange = (index: number, value: string) => {
    const updatedLots = [...selectedLot];
    updatedLots[index].alternateYarn = value;

    if (updatedLots[index].yarnType === 'actual') {
      updatedLots[index].yarnName = value;
    }

    setSelectedLot(updatedLots);
  };

  const handleSavedEdit = (item: any) => {
    loadedDetailIdRef.current = null;
    isInitialized.current = false;
    const allIssues = (item.requirements || []).flatMap((r: any) => r.yarnIssues || []);
    const hasSwitch = allIssues.some((yi: any) => String(yi.issueType || '').toUpperCase() === 'LOT_SWITCH');
    if (hasSwitch) {
      setActiveTab('switchLot');
      const switchIssue = allIssues.find((yi: any) => String(yi.issueType || '').toUpperCase() === 'LOT_SWITCH' && yi.loomId);
      if (switchIssue?.loomId) {
        setSelectedSwitchLoomId(String(switchIssue.loomId));
      }
    } else {
      setActiveTab('orderDetails');
    }
    navigate("/transaction/weaving-yarn-issue", { state: { weavingYarnIssueDtl: item } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavedDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this Weaving Yarn Issue?")) {
      try {
        await dispatch(deleteWeavingYarnIssue({ id, companyId: resolvedCompanyId })).unwrap();
        toast.success("Weaving Yarn Issue deleted successfully!");

        const currentEditingId = getValues("id") || watch("id") || weavingYarnIssueDtl?.id;
        if (currentEditingId && String(currentEditingId) === String(id)) {
          reset({
            id: undefined,
            yarnIssueDate: new Date().toISOString().slice(0, 10),
            yarnIssueChallanNo: '',
            vendorId: '',
            weavingContractId: '',
            transportId: '',
            transportationDetails: '',
            termsConditionsId: '',
            vehicleNo: '',
            remarks: '',
            grossWt: 0,
            totalNetWt: 0,
            activeFlag: true
          });
          setSelectedSwitchLoomId("");
          setSwitchLoomGaiting(null);
          setSelectedJobWork([]);
          setYarnRequirementDetails([]);
          setSelectedLot([]);
          setTempIssueSum({});
          setNewItem({ fabricDetails: '' });
          setIssueErrors({});
          loadedDetailIdRef.current = null;
          isInitialized.current = false;
          navigate("/transaction/weaving-yarn-issue", { replace: true, state: {} });
        }

        const listParams: { companyId?: number; isFetchAll?: boolean } = { isFetchAll: true };
        if (resolvedCompanyId) listParams.companyId = resolvedCompanyId;
        dispatch(getAllWeavingYarnIssue(listParams as any));
      } catch (err: any) {
        const msg = typeof err === 'string' ? err : err?.message || "Failed to delete Weaving Yarn Issue";
        toast.error(msg);
      }
    }
  };

  const displayedLotRows = useMemo(() => {
    if (activeTab === 'switchLot') {
      const currentInitialLotNo = normalizeWeavingLotNumber(switchLoomInfo.initialWeftLotNo);
      if (currentInitialLotNo && currentInitialLotNo !== 'na' && currentInitialLotNo !== 'n/a') {
        return yarnIssueDetails.filter((lot: LotDetail) => {
          const lotNo = normalizeWeavingLotNumber(lot.lotNumber);
          return lotNo !== currentInitialLotNo;
        });
      }
    }
    return yarnIssueDetails;
  }, [yarnIssueDetails, activeTab, switchLoomInfo.initialWeftLotNo]);

  const lotColumns = useMemo<PopupColumn[]>(() => [
    {
      Header: 'Select',
      id: 'selected',
      disableFilters: true,
      Cell: ({ row }) => {
        const isSelected = dialogSelectedIds.includes(row.uniqueId || '');
        return (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleLotSelect(row.uniqueId || '')}
          />
        );
      },
    },
    {
      Header: 'Yarn Name',
      accessor: (row: any) => row.yarnType === 'original' ? row.originalYarnName : row.yarnName,
      id: 'yarnName',
    },
    {
      Header: 'Inward No',
      accessor: 'inwardNo',
      id: 'inwardNo',
    },
    {
      Header: 'Inward Type',
      accessor: (row: any) => row.inwardTypeId ? inwardTypeLabelById.get(String(row.inwardTypeId)) || row.inwardType || 'N/A' : 'N/A',
      id: 'inwardType',
    },
    {
      Header: 'PO Category',
      accessor: (row: any) => row.poCategoryId ? poCategoryMap[row.poCategoryId] || `Category ${row.poCategoryId}` : 'N/A',
      id: 'poCategory',
    },
    {
      Header: 'Lot Number',
      accessor: 'lotNumber',
      id: 'lotNumber',
    },
    {
      Header: 'Available Qty',
      accessor: (row: any) => Number(row.availableQty).toFixed(3),
      id: 'availableQty',
    },
    {
      Header: 'Mill',
      accessor: (row: any) => millSelectOptions.find((o) => o.value === String(row.millId ?? ''))?.label || '-',
      id: 'mill',
    },
    {
      Header: 'Warehouse',
      accessor: (row: any) => warehouseOptions.find((o) => o.value === String(row.warehouseId ?? ''))?.label || '-',
      id: 'warehouse',
    },
    {
      Header: 'Available Bags',
      accessor: 'availableBags',
      id: 'availableBags',
      Cell: ({ row }) => (
        <input
          type="number"
          value={Number(row.availableBags ?? 0)}
          readOnly
          className="w-full p-1 border rounded cursor-not-allowed text-right text-black font-semibold bg-gray-50/50"
        />
      ),
    },
    {
      Header: 'Kgs/Bag',
      accessor: 'kgsPerBag',
      id: 'kgsPerBag',
      Cell: ({ row }) => (
        <Input
          type="number"
          step="0.001"
          value={row.kgsPerBag ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            setYarnIssueDetails((prev: any) => prev.map((l: any) => {
              if (l.uniqueId !== row.uniqueId) return l;
              const kgs = val === "" ? "" : Number(val);
              const bags = (l.noOfBags !== null && l.noOfBags !== undefined && String(l.noOfBags) !== "") ? l.noOfBags : "";
              return { ...l, kgsPerBag: kgs, issueQty: calculateIssueQty(bags as any, kgs as any) };
            }));
          }}
          className="w-full p-1 border rounded bg-gray-50/50 text-right"
          readOnly
        />
      ),
    },
    {
      Header: 'Cones Per Bag',
      accessor: 'conesPerBag',
      id: 'conesPerBag',
    },
    {
      Header: 'Cones Weight',
      accessor: (row: any) => Number(row.conesWeight ?? 0).toFixed(3),
      id: 'conesWeight',
    },
  ], [dialogSelectedIds, millSelectOptions, warehouseOptions, inwardTypeLabelById, poCategoryMap]);

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            {/* <Button
              variant="outline"
              onClick={() => navigate("/transaction/weaving-issue-details")}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button> */}
            <h2 className="text-2xl font-semibold">Weft Yarn Issue</h2>
          </div>

        </div>
        <div className="space-y-6">
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px gap-2">
                <button
                  onClick={() => setActiveTab('orderDetails')}
                  className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'orderDetails'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  Order Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('switchLot')}
                  className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'switchLot'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Switch Lot (Mid-Production)
                </button>
              </nav>
            </div>
          </div>

          {activeTab === "switchLot" && (
            <Card className="border-blue-200 bg-blue-50/20 mb-6">
              <CardHeader className="bg-blue-50/50 pb-3">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  Switch Lot Selection for Running Loom
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-4 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Select Running Loom <span className="text-red-600">*</span>
                    </label>
                    <CommonSearchableSelect
                      className="w-full bg-white"
                      placeholder="Select Loom"
                      options={activeLoomOptions}
                      value={selectedSwitchLoomId}
                      onValueChange={async (val) => {
                        setSelectedSwitchLoomId(val);
                        const gatings = (beamGatingList || []).filter((b: any) => String(b.loomId) === String(val));
                        const gating = gatings[0] || null;
                        setSwitchLoomGaiting(gating || null);

                        const details = gating?.beamGatingDetails || gating?.beamDetails || gating?.details || [];

                        const savedIssue = (weavingYarnIssuetList || []).find((item: any) =>
                          (item.requirements || []).some((r: any) =>
                            (r.yarnIssues || []).some((yi: any) => String(yi.loomId) === String(val))
                          )
                        );

                        const wcId = gating?.weavingContractId || details?.[0]?.weavingContractId || savedIssue?.weavingContractId;
                        const wcObj = (weavingContractList || []).find((c: any) => String(c.id) === String(wcId));
                        const vId = gating?.vendorId || details?.[0]?.vendorId || savedIssue?.vendorId || wcObj?.vendorId;

                        if (vId) setValue('vendorId', String(vId), { shouldValidate: true });
                        if (wcId) {
                          setValue('weavingContractId', String(wcId), { shouldValidate: true });
                          await loadYarnRequirementsForContract(String(wcId), String(vId || getValues('vendorId') || ''));
                        } else {
                          setYarnRequirementDetails([]);
                        }
                      }}
                      disabled={Boolean(weavingYarnIssueDtl?.id) || isWeavingIssueMapped}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Machine</label>
                    <input
                      type="text"
                      readOnly
                      value={switchLoomInfo.machineName}
                      className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Active Beam Gaiting / Sized Beam</label>
                    <input
                      type="text"
                      readOnly
                      value={switchLoomInfo.activeBeamNos}
                      className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm font-medium text-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Current Initial Weft Lot No</label>
                    <input
                      type="text"
                      readOnly
                      value={switchLoomInfo.initialWeftLotNo}
                      className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm font-semibold text-green-700"
                    />
                  </div>
                </div>

                {selectedSwitchLoomId && (
                  <div className="p-3 bg-blue-100/60 rounded-md border border-blue-200 mb-2 flex items-center justify-between">
                    <div className="text-xs text-blue-900 space-x-4">
                      <span><strong>Weft Yarn:</strong> {switchLoomInfo.weftYarnName}</span>
                      <span><strong>Warp Set No:</strong> {switchLoomInfo.warpSetNo}</span>
                      <span><strong>Mill:</strong> {switchLoomInfo.weftYarnMillName}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600 text-white">Active Loom Gaiting</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "orderDetails" && (
            <Card className="border-blue-200 bg-blue-50/20 mb-6">
              {/* <CardHeader className="bg-blue-50/50 pb-3">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    Active Loom & Beam Gating Auto-Mapping
                  </span>
                  <span className="text-xs font-normal text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                    Auto-fetches Fabric, Beam, Set No, Machine & Weft Lot
                  </span>
                </CardTitle>
              </CardHeader> */}
              <CardContent className="pt-4">
                <div className="grid grid-cols-4 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Weaving Yarn Issue Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      {...register("yarnIssueDate", { required: "Weaving Yarn Issue Date is required" })}
                      className="input w-full bg-white mt-1"
                    />
                    {errors.yarnIssueDate && <p className="mt-1 text-sm text-red-600">{errors.yarnIssueDate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Select Active Loom <span className="text-red-600">*</span>
                    </label>
                    <CommonSearchableSelect
                      className="w-full bg-white mt-1"
                      placeholder="Select Active Loom"
                      options={activeLoomOptions}
                      value={selectedSwitchLoomId}
                      onValueChange={(val) => {
                        setSelectedSwitchLoomId(val);
                        const gating = (beamGatingList || []).find((b: any) => String(b.loomId) === String(val));
                        setSwitchLoomGaiting(gating || null);
                        if (gating) {
                          const wcId = gating.weavingContractId || gating.beamGatingDetails?.[0]?.weavingContractId;
                          const wcObj = (weavingContractList || []).find((c: any) => String(c.id) === String(wcId));
                          const vId = gating.vendorId || gating.beamGatingDetails?.[0]?.vendorId || wcObj?.vendorId;
                          if (vId) setValue('vendorId', String(vId), { shouldValidate: true });
                          if (wcId) {
                            setValue('weavingContractId', String(wcId), { shouldValidate: true });
                            loadYarnRequirementsForContract(String(wcId), String(vId || getValues('vendorId') || ''));
                          }
                        }
                      }}
                      disabled={Boolean(weavingYarnIssueDtl?.id) || isWeavingIssueMapped}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Active Beam Gaiting / Sized Beam</label>
                    <input
                      type="text"
                      readOnly
                      value={switchLoomInfo.activeBeamNos}
                      className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm font-medium text-blue-700 mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">Beam Meter (Mtrs)</label>
                    <input
                      type="text"
                      readOnly
                      value={switchLoomInfo.beamMeter}
                      className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm font-medium text-blue-700 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-6 mb-2">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Fabric Details</label>
                    <input
                      type="text"
                      readOnly
                      value={switchLoomInfo.fabricDetails}
                      className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm font-medium mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Sizing Set No</label>
                    <input
                      type="text"
                      readOnly
                      value={switchLoomInfo.warpSetNo}
                      className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm font-medium mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Weft Count</label>
                    <input
                      type="text"
                      readOnly
                      value={switchLoomInfo.weftYarnName}
                      className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm font-medium text-blue-700 mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Weft Mill Name</label>
                    <input
                      type="text"
                      readOnly
                      value={switchLoomInfo.weftYarnMillName}
                      className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm font-medium mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Weft Lot No</label>
                    <input
                      type="text"
                      readOnly
                      value={switchLoomInfo.initialWeftLotNo}
                      className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-800 text-sm font-semibold text-green-700 mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {selectedJobWork && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Yarn Requirement Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2">Yarn Name</th>
                        <th className="border p-2">Actual Yarn</th>
                        <th className="border p-2">Grams/Mtr</th>
                        <th className="border p-2">Total Required Qty</th>
                        <th className="border p-2">Issued Qty (Selected Date: {watch('yarnIssueDate') || 'This Entry'})</th>
                        <th className="border p-2">Total Issued Qty (overall)</th> {/* <-- This is what you asked for */}
                        <th className="border p-2">Balance to Issue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yarnRequirementDetails.length > 0 ? (
                        yarnRequirementDetails.map((detail: any, index: any) => {
                          const thisEntryQty = currentEntrySums[detail.actualYarnId || detail.yarnId] || 0;
                          const historicalTotal = detail.historicalTotal || 0;
                          const overallTotal = historicalTotal + thisEntryQty;
                          const balance = Number(detail.totalwarpReq) - overallTotal;
                          return (
                            <tr key={index}>
                              <td className="border p-2 font-medium">{detail.yarnName}</td>

                              <td className=" p-2">
                                <CommonSearchableSelect
                                  className="w-full"
                                  placeholder="Select Actual Yarn"
                                  options={yarnOptions}
                                  filterActive
                                  value={detail.actualYarnId ? String(detail.actualYarnId) : ''}

                                  onValueChange={(value) => {
                                    // if (!isWeavingIssueMapped) {

                                    // }
                                    handleActualYarnChange(index, value);
                                  }}
                                // disabled={isWeavingIssueMapped}
                                />

                              </td>

                              <td className="border p-2">{detail.gramsPerMeter}</td>
                              <td className="border p-2">{Number(detail.totalwarpReq).toFixed(2)}</td>
                              <td className="border p-2 font-semibold text-blue-600">
                                {thisEntryQty.toFixed(2)}
                              </td>
                              <td className="border p-2 font-semibold text-green-600">
                                {overallTotal.toFixed(2)}
                              </td>
                              <td className="border p-2 font-semibold">
                                {balance.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="border p-2 text-center text-gray-500">
                            {selectedJobWork ? 'No yarn requirements found for this contract' : 'Select a Weaving Contract Number to view yarn requirements'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Yarn Issue Details</span>
                    <Button
                      onClick={handleYarnIssue}
                      disabled={!isValid || yarnRequirementDetails.length === 0}
                      className={
                        !isValid || yarnRequirementDetails.length === 0
                          ? "bg-gray-400 cursor-not-allowed text-white px-6"
                          : "bg-primary hover:bg-primary text-white px-6"
                      }
                    >
                      YARN ISSUE
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2">Yarn Name</th>
                        <th className="border p-2">Actual Yarn Name</th>
                        <th className="border p-2">Lot Number</th>
                        <th className="border p-2">Loom</th>
                        <th className="border p-2">Machine</th>
                        <th className="border p-2">Issue Mode</th>
                        <th className="border p-2">Available Bags</th>
                        <th className="border p-2">Available Qty</th>
                        <th className="border p-2">Mill</th>
                        <th className="border p-2">Warehouse</th>
                        <th className="border p-2">Issuing No of Bags</th>
                        <th className="border p-2">Kgs/Bag</th>
                        <th className="border p-2">Cones/Bag</th>
                        <th className="border p-2">Cones Weight</th>
                        <th className="border p-2">Issued Qty</th>
                        <th className="border p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedSelectedLots.length > 0 ? (
                        displayedSelectedLots.map((detail: LotDetail) => {
                          const targetLoomId = selectedSwitchLoomId || detail.loomId;
                          const filteredOptions = targetLoomId
                            ? loomOptions.filter(l => String(l.value) === String(targetLoomId))
                            : (detail.issueType === 'LOT_SWITCH'
                                ? loomOptions
                                : loomOptions.filter(l => (detail.loomId && String(l.value) === String(detail.loomId)) || !activeGaitedLoomIds.has(String(l.value))));
                          const availableLoomOptions = (targetLoomId && filteredOptions.length === 0)
                            ? [{ value: String(targetLoomId), label: (loomList || []).find((l: any) => String(l.id) === String(targetLoomId))?.loomNo || `Loom ${targetLoomId}` }]
                            : filteredOptions;

                          return (
                            <tr key={detail.uniqueId || detail.id}>
                              <td className="border p-2">{detail.originalYarnName || detail.yarnName}</td>
                              <td className="border p-2">{detail.actualYarn}</td>
                              <td className="border p-2">{detail.lotNumber}</td>
                              <td className="border p-2 min-w-[130px]">
                                <CommonSearchableSelect
                                  className="w-full text-xs"
                                  placeholder="Select Loom"
                                  options={availableLoomOptions}
                                  value={detail.loomId ? String(detail.loomId) : ''}
                                  onValueChange={(value) => {
                                    setSelectedLot((prev: any[]) =>
                                      prev.map((lot) => {
                                        if (lot.uniqueId !== detail.uniqueId) return lot;
                                        const activeGaiting = (beamGatingList || []).find((b: any) => String(b.loomId) === String(value));
                                        const loomObj = (loomList || []).find((l: any) => String(l.id) === String(value));
                                        const derivedMachineId = activeGaiting?.machineId ?? loomObj?.machineId ?? loomObj?.machine_id ?? lot.machineId;
                                        let updatedIssueType = lot.issueType;
                                        let updatedGaitingId = lot.beamGaitingId;
                                        if (activeGaiting) {
                                          updatedGaitingId = activeGaiting.id;
                                          if (activeGaiting.weftYarnLotNo && String(activeGaiting.weftYarnLotNo) !== String(detail.lotNumber)) {
                                            updatedIssueType = 'LOT_SWITCH';
                                          } else {
                                            updatedIssueType = 'INITIAL';
                                          }
                                        }
                                        return {
                                          ...lot,
                                          loomId: value,
                                          machineId: derivedMachineId ? String(derivedMachineId) : lot.machineId,
                                          beamGaitingId: updatedGaitingId,
                                          issueType: updatedIssueType,
                                        };
                                      })
                                    );
                                  }}
                                  disabled={!detail.isEditing}
                                />
                              </td>
                              <td className="border p-2 min-w-[130px]">
                                <CommonSearchableSelect
                                  className="w-full text-xs"
                                  placeholder="Select Machine"
                                  options={machineOptions}
                                  value={detail.machineId ? String(detail.machineId) : ''}
                                  onValueChange={(value) => {
                                    setSelectedLot((prev: any[]) =>
                                      prev.map((lot) =>
                                        lot.uniqueId === detail.uniqueId ? { ...lot, machineId: value } : lot
                                      )
                                    );
                                  }}
                                  disabled={!detail.isEditing}
                                />
                              </td>
                              <td className="border p-2 min-w-[120px]">
                                <select
                                  value={detail.issueType || 'INITIAL'}
                                  onChange={(e) => {
                                    const val = e.target.value as 'INITIAL' | 'LOT_SWITCH';
                                    setSelectedLot((prev: any[]) =>
                                      prev.map((lot) =>
                                        lot.uniqueId === detail.uniqueId ? { ...lot, issueType: val } : lot
                                      )
                                    );
                                  }}
                                  disabled={!detail.isEditing}
                                  className={`w-full p-1 border rounded text-xs bg-white ${!detail.isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                  <option value="INITIAL">Initial Lot</option>
                                  <option value="LOT_SWITCH">Lot Switch (Mid-Prod)</option>
                                </select>
                              </td>
                              <td className="border p-2">{detail.availableBags}</td>
                              <td className="border p-2">{detail.availableQty}</td>
                              <td className="border p-2">{(millOptions.find((m: any) => String(m.id) === String(detail.millId))?.subCategoryName) || '-'}</td>
                              <td className="border p-2">{(warehouseList.find((w: any) => String(w.id) === String(detail.warehouseId))?.warehouseName) || '-'}</td>
                              <td className="border p-2">
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  value={detail.noOfBags ?? ''}
                                  onChange={(e) => {
                                    const bagsValue = e.target.value;
                                    const bags = bagsValue === '' ? '' : Number(bagsValue);
                                    const kgs = Number(detail.kgsPerBag ?? 0) || 0;
                                    const computedQty = calculateIssueQty(bags, kgs);
                                    setSelectedLot((prev: any[]) =>
                                      prev.map((lot) =>
                                        lot.uniqueId === detail.uniqueId
                                          ? { ...lot, noOfBags: bags as any, issueQty: computedQty }
                                          : lot
                                      )
                                    );
                                  }}
                                  disabled={!detail.isEditing}
                                  className={`${!detail.isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                              </td>
                              <td className="border p-2">{Number(detail.kgsPerBag ?? 0)}</td>
                              <td className="border p-2">{detail.conesPerBag ?? 0}</td>
                              <td className="border p-2">{Number(detail.conesWeight ?? 0).toFixed(3)}</td>
                              <td className="border p-2">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={detail.issueQty ?? ''}
                                  onChange={(e) => {
                                    const raw = e.target.value || '';
                                    const sanitized = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                    setSelectedLot((prev: any[]) =>
                                      prev.map((lot) =>
                                        lot.uniqueId === detail.uniqueId ? { ...lot, issueQty: sanitized } : lot
                                      )
                                    );
                                    setIssueErrors((prev) => ({ ...prev, [Number(detail.id)]: null }));
                                  }}
                                  disabled={!detail.isEditing}
                                  className={`${!detail.isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                {issueErrors[Number(detail.id)] && (
                                  <div className="text-red-600 text-xs mt-1">{issueErrors[Number(detail.id)]}</div>
                                )}
                              </td>
                              <td className="border p-2 whitespace-nowrap text-center align-middle min-w-[130px]">
                                <div className="flex gap-2 justify-center items-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedLot((prev: any[]) =>
                                        prev.map((lot) =>
                                          lot.uniqueId === detail.uniqueId ? { ...lot, isEditing: !lot.isEditing } : lot
                                        )
                                      );
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedLot((prev: any[]) =>
                                        prev.filter((lot) => lot.uniqueId !== detail.uniqueId)
                                      );
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={16} className="border p-2 text-center text-gray-500">
                            No lots selected for this section. Click "YARN ISSUE" to select yarn lots.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* {selectedLot.length > 0 && (
                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={handleSaveYarnIssue}
                        className="bg-primary hover:bg-primary text-white px-6 flex items-center"
                      // disabled={isWeavingIssueMapped}
                      >
                        <Save size={18} className="mr-2" />
                        Save Yarn Issue
                      </Button>
                    </div>
                  )} */}
                  {isWeavingIssueMapped && (
                    <div className="mt-4 flex gap-3.5 items-center bg-orange-50 border border-orange-300 rounded-xl px-4 py-3.5">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C05621" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-orange-900 m-0 mb-0.5">Record is linked to other modules</p>
                        <p className="text-xs text-orange-700 m-0 mb-1.5">The fields below are locked and cannot be modified.</p>
                        <div className="flex flex-wrap gap-1.5">
                          {["Vendor", "Weaving Contract", "Fabric Details", "Actual Yarn", "Issuing No of Bags", "Issued Qty"].map(f => (
                            <span key={f} className="text-[11px] font-medium bg-orange-200 text-orange-900 rounded-full px-2.5 py-0.5">{f}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* {isWeavingIssueMapped && <p className="mt-1 text-sm text-amber-600">Read-only: This weaving yarn issue is already mapped to other modules.so can't able to edit Vendor,Weaving Contract,Fabric Details,Actual Yarn,Issuing No of Bags and Issued Qty </p>} */}
                </CardContent>

              </Card>
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit(onSubmit)}
                  className="bg-primary hover:bg-primary text-white px-6 flex items-center"
                  disabled={!isFormValid}

                >
                  <Save size={18} className="mr-2" />
                  {(Boolean(watch("id") || getValues("id") || weavingYarnIssueDtl?.id))
                    ? "Update Weaving Yarn Issue"
                    : "Save Weaving Yarn Issue"}
                </Button>
              </div>

              <Card className="mt-8 mb-6">
                <CardHeader className="bg-gray-50 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Saved Weaving Yarn Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="border p-2 text-center w-12">S.No</th>
                        <th className="border p-2 text-left">Yarn Issue Date</th>
                        <th className="border p-2 text-left">Loom No</th>
                        <th className="border p-2 text-left">Beam No</th>
                        <th className="border p-2 text-left">Weft Count</th>
                        <th className="border p-2 text-left">Weft Lot No</th>
                        <th className="border p-2 text-left">Weft Mill Name</th>
                        <th className="border p-2 text-center">Issue Type</th>
                        <th className="border p-2 text-right">Issued Qty</th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weavingYarnIssuetList && (Array.isArray(weavingYarnIssuetList) ? weavingYarnIssuetList : (weavingYarnIssuetList as any)?.data || []).length > 0 ? (
                        (Array.isArray(weavingYarnIssuetList) ? weavingYarnIssuetList : (weavingYarnIssuetList as any)?.data || []).map((item: any, idx: number) => {
                          const allIssues = (item.requirements || []).flatMap((r: any) =>
                            (r.yarnIssues || []).map((yi: any) => ({ ...yi, parentReq: r }))
                          );

                          const looms: string[] = [];
                          const beams: string[] = [];
                          const counts: string[] = [];
                          const lots: string[] = [];
                          const mills: string[] = [];
                          const issueTypes: string[] = [];

                          (item.requirements || []).forEach((req: any) => {
                            const c = req.yarnCount || req.actualYarn || req.yarnName;
                            if (c) counts.push(String(c).trim());
                          });

                          if (allIssues.length > 0) {
                            allIssues.forEach((issue: any) => {
                              const typeStr = String(issue.issueType || '').toUpperCase();
                              if (typeStr === 'LOT_SWITCH' || typeStr === 'LOT SWITCH' || typeStr === 'SWITCH') {
                                issueTypes.push('Lot Switch');
                              } else {
                                issueTypes.push('Initial Lot');
                              }

                              const loomId = issue.loomId;
                              if (loomId != null) {
                                const loomObj = (loomList || []).find((l: any) => String(l.id) === String(loomId));
                                const lNo = loomObj?.loomNo || loomObj?.name;
                                if (lNo) looms.push(String(lNo).trim());
                              }

                              const gaitingId = issue.beamGaitingId;
                              let matchingGating = (beamGatingList || []).find((b: any) => String(b.id) === String(gaitingId));
                              if (!matchingGating && loomId != null) {
                                matchingGating = (beamGatingList || []).find((b: any) => String(b.loomId) === String(loomId));
                              }
                              if (!matchingGating && item.weavingContractId) {
                                matchingGating = (beamGatingList || []).find((b: any) => String(b.weavingContractId) === String(item.weavingContractId));
                              }

                              if (matchingGating) {
                                const details = matchingGating.beamGatingDetails || matchingGating.beamDetails || matchingGating.details || [];
                                const bNo = details?.[0]?.beamNo || details?.[0]?.sizedBeamNo || matchingGating.beamNo || matchingGating.beamGatingNo;
                                if (bNo) beams.push(String(bNo).trim());

                                if (looms.length === 0 && matchingGating.loomId) {
                                  const loomObj = (loomList || []).find((l: any) => String(l.id) === String(matchingGating.loomId));
                                  if (loomObj?.loomNo) looms.push(String(loomObj.loomNo).trim());
                                }
                              }

                              const lNum = issue.lotNumber || issue.lotNo || issue.lotId || issue.parentReq?.lotNumber;
                              if (lNum) lots.push(String(lNum).trim());

                              const cnt = issue.yarnCount || issue.actualYarn || issue.yarnName || issue.parentReq?.yarnCount || issue.parentReq?.actualYarn;
                              if (cnt) counts.push(String(cnt).trim());

                              const millId = issue.millId;
                              if (millId != null) {
                                const matchedMill = (subCategories || []).find((sc: any) => String(sc.id) === String(millId) || String(sc.subCategoryId) === String(millId));
                                if (matchedMill?.subCategoryName) {
                                  mills.push(String(matchedMill.subCategoryName).trim());
                                }
                              }
                              if (issue.millName || issue.weftYarnMillName) {
                                mills.push(String(issue.millName || issue.weftYarnMillName).trim());
                              }
                            });
                          }

                          const loomNoStr = Array.from(new Set(looms.filter(Boolean))).join(', ') || '-';
                          const beamNoStr = Array.from(new Set(beams.filter(Boolean))).join(', ') || '-';
                          const countStr = Array.from(new Set(counts.filter(Boolean))).join(', ') || '-';
                          const lotNoStr = Array.from(new Set(lots.filter(Boolean))).join(', ') || '-';
                          const millStr = Array.from(new Set(mills.filter(Boolean))).join(', ') || '-';
                          const issueTypeStr = Array.from(new Set(issueTypes.filter(Boolean))).join(', ') || 'Initial Lot';
                          const totalQty = (item.requirements || []).reduce(
                            (sum: number, r: any) => sum + (Number(r.totalIssueQty) || (r.yarnIssues || []).reduce((s: number, yi: any) => s + (Number(yi.issueQty) || 0), 0)), 0
                          );

                          return (
                            <tr key={item.id || idx} className="hover:bg-gray-50">
                              <td className="border p-2 text-center font-medium">{idx + 1}</td>
                              <td className="border p-2">{item.yarnIssueDate ? String(item.yarnIssueDate).slice(0, 10) : '-'}</td>
                              <td className="border p-2 font-medium text-gray-800">{loomNoStr}</td>
                              <td className="border p-2 text-blue-700 font-medium">{beamNoStr}</td>
                              <td className="border p-2 text-blue-700 font-medium">{countStr}</td>
                              <td className="border p-2 font-semibold text-green-700">{lotNoStr}</td>
                              <td className="border p-2">{millStr}</td>
                              <td className="border p-2 text-center font-medium">
                                {issueTypeStr.includes('Lot Switch') ? (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
                                    Lot Switch
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 border border-blue-300">
                                    Initial Lot
                                  </span>
                                )}
                              </td>
                              <td className="border p-2 text-right font-semibold text-green-700">{totalQty.toFixed(2)}</td>
                              <td className="border p-2 text-center">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSavedEdit(item)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" /> Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleSavedDelete(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      localStorage.setItem('yarnReturnPrintData', JSON.stringify({ ...item, type: 'weaving' }));
                                      window.open(`/#/transaction/yarn-delivery-challan-print?id=${item.id}`, '_blank');
                                    }}
                                  >
                                    Print
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} className="border p-4 text-center text-gray-500">
                            No saved weaving yarn issues found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              {/* <Dialog open={showLotDialog} onOpenChange={setShowLotDialog}>
                <DialogContent className="max-w-[95vw] w-fit max-h-[95vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Select Lots for Yarn Issue</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-end mb-3">
                    {dialogSelectedIds.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setShowSelectedLotsOnly((prev) => !prev)}
                      >
                        {showSelectedLotsOnly ? 'Show All Lots' : 'Show Selected Lots'}
                      </Button>
                    )}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full border-collapse border border-black-900">
                      <thead className="bg-primary text-xs font-semibold uppercase tracking-[0.2em] text-white sticky top-0 z-10">
                        <tr>
                          <th className="border p-2">Select</th>
                          <th className="border p-2">Yarn Name</th>
                          <th className="border p-2">Inward Type</th>
                          <th className="border p-2">Lot Number</th>
                          <th className="border p-2">Available Qty</th>
                          <th className="border p-2">Mill</th>
                          <th className="border p-2">Warehouse</th>
                          <th className="border p-2">Available Bags</th>
                          <th className="border p-2">Kgs/Bag</th>
                          <th className="border p-2">Cones Per Bags</th>
                          <th className="border p-2">Cones Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedLotRows.map((lot: LotDetail) => {
                          const isSelected = dialogSelectedIds.includes(lot.uniqueId || '');

                          return (
                            <tr key={lot.uniqueId} className={isSelected ? "bg-blue-50" : ""}>
                              <td className="border p-2 text-center">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleLotSelect(lot.uniqueId || '')}
                                />
                              </td>

                              <td className="border p-2">
                                {lot.yarnType === 'original' ? lot.originalYarnName : lot.yarnName}
                              </td>
                              <td className="border p-2">
                                {lot.inwardTypeId ? inwardTypeLabelById.get(String(lot.inwardTypeId)) || lot.inwardType || 'N/A' : 'N/A'}
                              </td>
                              <td className="border p-2">{lot.lotNumber}</td>
                              <td className="border p-2">{lot.availableQty}</td>
                              <td className="border p-2">
                                <CommonSearchableSelect
                                  className="mt-1"
                                  placeholder="Select Mill"
                                  options={millSelectOptions}
                                  value={String(lot.millId ?? '')}
                                  onValueChange={(value) => {
                                    setYarnIssueDetails((prev: any) => prev.map((l: any) => l.uniqueId === lot.uniqueId ? { ...l, millId: value } : l));
                                  }}
                                />
                              </td>
                              <td className="border p-2">
                                <CommonSearchableSelect
                                  className="mt-1"
                                  placeholder="Select Warehouse"
                                  options={warehouseOptions}
                                  value={String(lot.warehouseId ?? '')}
                                  onValueChange={(value) => {
                                    setYarnIssueDetails((prev: any) => prev.map((l: any) => l.uniqueId === lot.uniqueId ? { ...l, warehouseId: value } : l));
                                  }}
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={Number(lot.availableBags ?? 0)}
                                  readOnly
                                  className="input mt-1 bg-gray-100 cursor-not-allowed"
                                />
                              </td>
                              <td className="border p-2">
                                <Input
                                  type="number"
                                  value={lot.kgsPerBag ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setYarnIssueDetails((prev: any) => prev.map((l: any) => {
                                      if (l.uniqueId !== lot.uniqueId) return l;
                                      const kgs = val === "" ? "" : Number(val);
                                      const bags = (l.noOfBags !== null && l.noOfBags !== undefined && String(l.noOfBags) !== "") ? l.noOfBags : "";
                                      return { ...l, kgsPerBag: kgs, issueQty: calculateIssueQty(bags as any, kgs as any) };
                                    }));
                                  }}
                                  className="input mt-1"
                                />
                              </td>
                              <td className="border p-2">{lot.conesPerBag}</td>
                              <td className="border p-2">{lot.conesWeight}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {displayedLotRows.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        {yarnIssueDetails.length === 0 ? 'No lots available for issue.' : 'No selected lots to display.'}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-4 px-2 pb-2">
                    <Button variant="outline" onClick={() => { setShowLotDialog(false); setDialogSelectedIds([]); }}>
                      Cancel
                    </Button>
                    <Button variant="outline" className="btn bg-primary hover:bg-primary text-white"
                      onClick={() => {
                        const selectedRows = yarnIssueDetails.filter((lot: LotDetail) => {
                          const id = lot.uniqueId;
                          return id ? dialogSelectedIds.includes(id) : false;
                        });

                        setSelectedLot((prev: any[]) => {
                          const next = [...prev];
                          selectedRows.forEach((lot: LotDetail) => {
                            if (!lot.uniqueId) return;
                            const matchingReq = yarnRequirementDetails.find((req: any) =>
                              String(req.actualYarnId) === String(lot.lotYarnId)
                            );

                            const bags = (lot.noOfBags !== null && lot.noOfBags !== undefined && String(lot.noOfBags) !== "") ? lot.noOfBags : "";
                            const kgs = (lot.kgsPerBag !== null && lot.kgsPerBag !== undefined && String(lot.kgsPerBag) !== "") ? lot.kgsPerBag : "";
                            const computedQty = (lot.issueQty !== null && lot.issueQty !== undefined && String(lot.issueQty) !== "")
                              ? lot.issueQty
                              : calculateIssueQty(bags as any, kgs as any);
                            const defaultLoomId = lot.loomId || (selectedSwitchLoomId ? selectedSwitchLoomId : null);
                            const defaultMachineId = lot.machineId || (switchLoomInfo.machineId ? switchLoomInfo.machineId : null);
                            const defaultGaitingId = lot.beamGaitingId || (switchLoomInfo.activeGating?.id ? switchLoomInfo.activeGating.id : null);

                            const preparedLot = {
                              ...lot,
                              loomId: defaultLoomId,
                              machineId: defaultMachineId,
                              beamGaitingId: defaultGaitingId,
                              yarnCount: matchingReq?.yarnCount ?? lot.yarnCount ?? '0',
                              actualYarnId: matchingReq?.actualYarnId ?? lot.actualYarnId ?? null,
                              noOfBags: bags,
                              kgsPerBag: kgs,
                              issueQty: computedQty,
                              issuedQty: computedQty,
                              alternateYarn: lot.alternateYarn || lot.yarnName,
                              yarnType: lot.yarnType ?? 'original',
                              originalYarnName: lot.originalYarnName || lot.yarnName,
                              lotId: lot.lotId ?? lot.baseLotId ?? lot.id,
                              isEditing: true,
                              activeFlag: lot.activeFlag !== false
                            } as LotDetail;

                            const existingIndex = next.findIndex((entry: any) => entry.uniqueId && entry.uniqueId === lot.uniqueId);
                            if (existingIndex >= 0) {
                              const existing = next[existingIndex];
                              next[existingIndex] = {
                                ...existing,
                                ...preparedLot,
                                noOfBags: existing.noOfBags ?? preparedLot.noOfBags,
                                kgsPerBag: existing.kgsPerBag ?? preparedLot.kgsPerBag,
                                issueQty: existing.issueQty ?? preparedLot.issueQty,
                                issuedQty: existing.issuedQty ?? preparedLot.issuedQty
                              };
                            } else {
                              next.push(preparedLot);
                            }
                          });
                          return next;
                        });

                        setShowLotDialog(false);
                        setDialogSelectedIds([]);
                      }}>
                      Confirm Selection ({dialogSelectedIds.length} selected)
                    </Button>

                  </div>
                </DialogContent>
              </Dialog> */}
              <Dialog open={showLotDialog} onOpenChange={setShowLotDialog}>
                <DialogContent className="max-w-[95vw] w-fit min-w-[70vw] max-h-[90vh] flex flex-col p-4">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Select Lots for Yarn Issue</DialogTitle>
                    {selectedSwitchLoomId && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex justify-between items-center mt-2">
                        <div>
                          <span className="font-semibold text-blue-800">Assigned Active Loom:</span> {(loomList || []).find((l: any) => String(l.id) === String(selectedSwitchLoomId))?.loomNo || `Loom ${selectedSwitchLoomId}`}
                          {switchLoomInfo.weftYarnName && switchLoomInfo.weftYarnName !== 'N/A' && (
                            <span className="ml-4 font-semibold text-blue-800">Required Weft Count: <span className="font-normal text-blue-900">{switchLoomInfo.weftYarnName}</span></span>
                          )}
                          {switchLoomInfo.initialWeftLotNo && switchLoomInfo.initialWeftLotNo !== 'N/A' && (
                            <span className="ml-4 font-semibold text-amber-800">
                              {activeTab === 'switchLot' ? 'Current Lot (Excluded): ' : 'Assigned Lot No: '}
                              <span className="font-normal text-amber-900">{switchLoomInfo.initialWeftLotNo}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded">
                          {activeTab === 'switchLot' ? 'Switch Lot Mode' : 'Validation Enforced'}
                        </span>
                      </div>
                    )}
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <PopupDataTable
                      columns={lotColumns}
                      data={displayedLotRows}
                      emptyMessage={
                        yarnIssueDetails.length === 0
                          ? 'No lots available for issue.'
                          : 'No lots match your search.'
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowLotDialog(false);
                        setDialogSelectedIds([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-primary hover:bg-primary text-white"
                      onClick={() => {
                        const selectedRows = yarnIssueDetails.filter((lot: LotDetail) => {
                          const id = lot.uniqueId;
                          return id ? dialogSelectedIds.includes(id) : false;
                        });

                        const targetIssueType = activeTab === 'switchLot' ? 'LOT_SWITCH' : 'INITIAL';
                        const targetLoomObj = (loomList || []).find((l: any) => String(l.id) === String(selectedSwitchLoomId));
                        const targetMachineId = switchLoomInfo.machineId ?? switchLoomGaiting?.machineId ?? targetLoomObj?.machineId ?? targetLoomObj?.machine_id ?? null;

                        setSelectedLot((prev: LotDetail[]) => {
                          const otherTabLots = prev.filter((entry: LotDetail) =>
                            targetIssueType === 'LOT_SWITCH' ? entry.issueType !== 'LOT_SWITCH' : entry.issueType === 'LOT_SWITCH'
                          );
                          const currentTabPrevLots = prev.filter((entry: LotDetail) =>
                            targetIssueType === 'LOT_SWITCH' ? entry.issueType === 'LOT_SWITCH' : entry.issueType !== 'LOT_SWITCH'
                          );

                          const updatedCurrentTabLots: LotDetail[] = [];

                          selectedRows.forEach((lot: LotDetail, idx: number) => {
                            const matchingReq = yarnRequirementDetails.find((req: any) =>
                              String(req.actualYarnId) === String(lot.lotYarnId)
                            );

                            const bags = (lot.noOfBags !== null && lot.noOfBags !== undefined && String(lot.noOfBags) !== "") ? lot.noOfBags : "";
                            const kgs = (lot.kgsPerBag !== null && lot.kgsPerBag !== undefined && String(lot.kgsPerBag) !== "") ? lot.kgsPerBag : "";
                            const computedQty = (lot.issueQty !== null && lot.issueQty !== undefined && String(lot.issueQty) !== "")
                              ? lot.issueQty
                              : calculateIssueQty(bags as any, kgs as any);

                            const newUniqueId = buildWeavingLotUniqueId(lot, idx, targetIssueType);
                            const preparedLot = {
                              ...lot,
                              uniqueId: newUniqueId,
                              weavingYarnRequirementId: matchingReq?.id ?? lot.weavingYarnRequirementId,
                              yarnCount: matchingReq?.yarnCount ?? lot.yarnCount ?? '0',
                              actualYarnId: matchingReq?.actualYarnId ?? lot.actualYarnId ?? null,
                              noOfBags: bags,
                              kgsPerBag: kgs,
                              issueQty: computedQty,
                              issuedQty: computedQty,
                              alternateYarn: lot.alternateYarn || lot.yarnName,
                              yarnType: lot.yarnType ?? 'original',
                              originalYarnName: lot.originalYarnName || lot.yarnName,
                              lotId: lot.lotId ?? lot.baseLotId ?? lot.id,
                              isEditing: true,
                              activeFlag: lot.activeFlag !== false,
                              loomId: selectedSwitchLoomId || lot.loomId || null,
                              machineId: (targetMachineId ? String(targetMachineId) : lot.machineId) || null,
                              beamGaitingId: (switchLoomGaiting?.id || switchLoomInfo.activeGating?.id || lot.beamGaitingId) || null,
                              issueType: targetIssueType as 'INITIAL' | 'LOT_SWITCH',
                            } as LotDetail;

                            const existingMatch = currentTabPrevLots.find((e: LotDetail) =>
                              buildWeavingLotSelectionKey(e, targetIssueType) === buildWeavingLotSelectionKey(preparedLot, targetIssueType) ||
                              (e.uniqueId && e.uniqueId === newUniqueId)
                            );

                            if (existingMatch) {
                              updatedCurrentTabLots.push({
                                ...existingMatch,
                                ...preparedLot,
                                noOfBags: (existingMatch.noOfBags !== null && existingMatch.noOfBags !== undefined && String(existingMatch.noOfBags) !== "") ? existingMatch.noOfBags : preparedLot.noOfBags,
                                kgsPerBag: (existingMatch.kgsPerBag !== null && existingMatch.kgsPerBag !== undefined && String(existingMatch.kgsPerBag) !== "") ? existingMatch.kgsPerBag : preparedLot.kgsPerBag,
                                issueQty: (existingMatch.issueQty !== null && existingMatch.issueQty !== undefined && String(existingMatch.issueQty) !== "") ? existingMatch.issueQty : preparedLot.issueQty,
                                issuedQty: (existingMatch.issuedQty !== null && existingMatch.issuedQty !== undefined && String(existingMatch.issuedQty) !== "") ? existingMatch.issuedQty : preparedLot.issuedQty,
                              });
                            } else {
                              updatedCurrentTabLots.push(preparedLot);
                            }
                          });

                          return [...otherTabLots, ...updatedCurrentTabLots];
                        });

                        setShowLotDialog(false);
                        setDialogSelectedIds([]);
                      }}
                    >
                      Confirm Selection ({dialogSelectedIds.length} selected)
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}