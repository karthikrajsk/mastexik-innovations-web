import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Save, ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getAllInvoices, getAllInvoicesByCompanyId } from "@/state/invoiceSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllYarnSalesOrders } from "@/state/yarnSalesSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllYarnChallan } from "@/state/yarnChallanSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { useFilteredWarehouseOptions } from "@/hooks/useFilteredWarehouseOptions";
import { getAllFactoryPieceEntries } from "@/state/factoryPieceEntrySlice";
import { getAllGeneratePacking } from "@/state/generatePackingSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllBeamInward } from "@/state/beamInwardSlice";
import { documentNumberService } from "@/services/DocumentNumberService";
import { Button } from "@/components/ui/button";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PopupDataTable, PopupColumn } from "@/components/data/PopupDataTable";
import { CodesAPI } from "@/services/codes_api";
import { CodeDetail, CodeHeader } from "@/types/codes";
import { CodesUtil } from "@/utils/codesUtil";
import apiService from "@/services/ApiService";

import { useForm } from "react-hook-form";
// import { EditNoteField } from "@/components/ui/edit-note-field";
import { getAllSalesReturn, createSalesReturn, updateSalesReturn } from "@/state/salesReturnSlice";
import { getBeamOutwardByBeamInwardId, getAllBeamOutward } from "@/state/beamOutwardSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllSizingBeamOutward } from "@/state/sizingBeamOutwardSlice";

interface AvailableFabric {
  id: number;
  fabricCode: string;
  fabricQuality: string;
  displayLabel: string;
  yarnId?: number;
  fabricMasterId?: number;
}

interface SelectedFabric {
  id?: number;
  rollNo: string;
  pieceNo: string;
  meter: number;
  netWeight: number;
  yarnId?: number;
  millId?: number;
  millName?: string;
  warehouseId?: number;
  lotNumber?: string;
  availableBags?: number;
  availableQty?: number;
  issueQty?: number;
  packingListNo?: string;
  // Beam specific fields
  beamOutwardNo?: string;
  outwardDate?: string;
  weavingContractNo?: string;
  weaverName?: string;
  sizingPlanNo?: string;
  salesOrderNo?: string;
  flangeNo?: string;
  sizedBeamNo?: string;
  beamMeters?: number;
  originalBeamMeters?: number;
  expectedFabricMeter?: number;
  weaverId?: number;
  totalBeams?: number;
  buyerName?: string;
  fabricCode?: string;
  fabricPanelWidth?: string | number;
  shrinkage?: number;
  width?: number | string;
  totalEnds?: number | string;
  beamOutwardId?: number;
  beamInwardId?: number;
  inwardTypeId?: number;
}

interface SalesReturnInformationFormData {
  salesReturnNo: string;
  returnDate: string;
  invoiceType: string;
  invoiceId: number | null;
  invoiceNo: string;
  packingSlipNo: string;
  orderNo: string;
  orderId: number | null;
  customerId: number | null;
  buyerName: string;
  fabricCode: string;
  remarks: string;
  warehouseId: number | null;
}

const TRADE_TYPE_GROUP_KEY = 'TRADE_TYPE';
const TRADE_TYPE_HEADER_ID = 2;
const CODES_STORAGE_KEY = 'codes_header';

const normalizeCodeValue = (value?: string | number | null) => String(value ?? '').trim().toUpperCase();

const getDetailLabel = (detail: CodeDetail) => detail.value || detail.code || `Code ${detail.id}`;

const isBeamTypeLabel = (value?: string | number | null) => {
  const normalized = normalizeCodeValue(value);
  return (
    normalized === 'BEAM' ||
    normalized === 'JOB WORK BEAM' ||
    normalized === 'JOBWORK BEAM' ||
    normalized === 'JOBWORKBEAM'
  );
};

const normalizeHeadersResponse = (raw: any): CodeHeader[] => {
  if (Array.isArray(raw)) return raw;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
  return [];
};

const getCodeValueById = (id: number | string | null): string => {
  if (id === null || id === undefined) return "";
  try {
    let headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());
    if (!headers || headers.length === 0) {
      const stored = localStorage.getItem("codes_header");
      if (stored) {
        headers = JSON.parse(stored);
      }
    }
    if (!headers) return "";
    for (const hdr of headers) {
      if (hdr.details) {
        const detail = hdr.details.find((d: any) => String(d.id) === String(id));
        if (detail) {
          return detail.value || detail.code || "";
        }
      }
    }
  } catch (error) {
    console.error("Error looking up code value by ID:", error);
  }
  return "";
};

const cacheHeadersToStorage = (headers: CodeHeader[]) => {
  if (!Array.isArray(headers) || !headers.length) return;
  try {
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(headers));
  } catch (error) {
    console.warn('Failed to cache codes headers', error);
  }
};

const readHeadersFromStorage = (): CodeHeader[] => {
  try {
    const stored = localStorage.getItem(CODES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return normalizeHeadersResponse(parsed);
    }
  } catch (error) {
    console.error('Failed to parse codes header from storage:', error);
  }
  return [];
};

const extractInvoiceTypeDetails = (headers: CodeHeader[]): CodeDetail[] => {
  if (!Array.isArray(headers)) return [];
  const tradeHeader = headers.find((h: any) => normalizeCodeValue(h?.code_group ?? h?.codeGroup) === TRADE_TYPE_GROUP_KEY)
    || headers.find((h: any) => Number(h?.id) === TRADE_TYPE_HEADER_ID);
  if (!tradeHeader || !Array.isArray(tradeHeader.details)) return [];
  return tradeHeader.details;
};

const normalizeResponseArray = (raw: any): any[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.data?.data)) return raw.data.data;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.results)) return raw.results;
  return [];
};

const getPackingIdentifier = (record: any): string => {
  if (!record) return "";
  const identifier = record.packingListNo || record.packingSlipNo || record.packingNo || "";
  return String(identifier).trim();
};

const mapPackingOption = (record: any) => {
  const identifier = getPackingIdentifier(record);
  if (!identifier) return null;
  return {
    ...record,
    packingListNo: identifier,
    packingSlipNo: identifier,
  };
};

const isInvoicePackingRecord = (record: any) => {
  if (!record) return false;
  if (Number(record.isInvoice ?? record.is_invoice ?? 0) === 1) return true;
  const items = Array.isArray(record.items) ? record.items : [];
  return items.some((item: any) => Number(item.isInvoice ?? item.is_invoice ?? 0) === 1);
};

const matchesInvoiceNumber = (record: any, invoiceNo: string) => {
  if (!record || !invoiceNo) return false;
  const normalizedInvoice = invoiceNo.trim();
  if (!normalizedInvoice) return false;
  const values: any[] = [
    record.invoiceNo,
    record.invoice_no,
    record.invoiceNumber,
    record.invoice_number,
  ];
  const items = Array.isArray(record.items) ? record.items : [];
  items.forEach((item: any) => {
    values.push(item.invoiceNo, item.invoice_no, item.invoiceNumber, item.invoice_number);
  });
  return values.some((value) => value && String(value).trim() === normalizedInvoice);
};

const filterInvoicePackingRecords = (records: any[], invoiceNo?: string, salesOrderId?: number | null, weavingOrderId?: number | null, invoiceId?: number | null) => {
  const invoiceFilter = invoiceNo?.trim();
  return records.filter((record) => {
    if (!isInvoicePackingRecord(record)) return false;

    // If we have an invoice number, try to match it
    if (invoiceFilter && matchesInvoiceNumber(record, invoiceFilter)) return true;

    // Match by Invoice ID if provided
    if (invoiceId && (Number(record.invoiceId) === Number(invoiceId) || record.items?.some((item: any) => Number(item.invoiceId) === Number(invoiceId)))) return true;

    // Fallback: Match by Order IDs if provided
    if (salesOrderId && (String(record.salesOrderId) === String(salesOrderId) || String(record.orderId) === String(salesOrderId))) return true;
    if (weavingOrderId && (String(record.weavingWorkOrderId) === String(weavingOrderId) || String(record.weavingJobWorkOrderId) === String(weavingOrderId))) return true;

    // If no specific filter matched but we have no invoice filter, keep it
    if (!invoiceFilter && !invoiceId) return true;

    return false;
  });
};

const getWeavingOrderLabel = (order: any): string => {
  if (!order) return "";
  return (
    order.weavingContractNo ||
    order.weavingWorkOrderNo ||
    order.weavingOrderNo ||
    order.jobWorkOrderNo ||
    order.weavingJobWorkOrderNo ||
    order.orderNo ||
    ""
  );
};

const resolveMillIdFromRecord = (record?: any): number | undefined => {
  if (!record) return undefined;
  const candidates = [
    record.millId,
    record.mill_id,
    record.millNameId,
    record.mill_name_id,
    record.vendorId,
    record.vendor_id,
  ];
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      const parsed = Number(candidate);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return undefined;
};

const resolveMillIdByName = (millName: string | undefined, subCats: any[]): number | undefined => {
  if (!millName || millName === "-" || !Array.isArray(subCats) || !subCats.length) return undefined;
  const mills = subCats.filter((sc: any) => (sc.categoryName || "").toLowerCase() === "mill");
  const normalized = millName.trim().toLowerCase();
  const match = mills.find((m: any) =>
    (m.subCategoryName || m.name || "").toLowerCase() === normalized
  );
  if (match?.id) {
    const parsed = Number(match.id);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return undefined;
};

const resolveMillIdFromYarnSalesOrder = (
  yarnId: number | string | undefined,
  soId: number | string | null | undefined,
  salesOrders: any[]
): number | undefined => {
  if (!yarnId || !soId || !Array.isArray(salesOrders) || !salesOrders.length) return undefined;
  const so = salesOrders.find((s: any) => String(s.id) === String(soId));
  if (!so || !Array.isArray(so.items)) return undefined;
  const item = so.items.find((i: any) => String(i.yarnId) === String(yarnId));
  if (!item) return undefined;
  const mid = item.millId;
  if (mid !== undefined && mid !== null && mid !== "") {
    const parsed = Number(mid);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return undefined;
};

export function SalesReturnForm() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const salesReturnDetail = location.state?.salesReturn;
  const queryParams = new URLSearchParams(location.search);
  const returnId = queryParams.get("id");

  const { invoiceList } = useSelector((state: RootState) => state.invoice);
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { yarnSalesOrderList } = useSelector((state: RootState) => (state as any).yarnSales);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { yarnChallanList } = useSelector((state: RootState) => (state as any).yarnChallan);
  const { yarnList } = useSelector((state: RootState) => (state as any).yarn);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => (state as any).weavingJobWorkOrder);
  const { weavingContractList } = useSelector((state: RootState) => (state as any).weavingContracts);
  const { sizingPlanList } = useSelector((state: RootState) => (state as any).sizingPlan);
  const { beamInwardList } = useSelector((state: RootState) => (state as any).beamInward);
  const { beamOutwardList } = useSelector((state: RootState) => (state as any).beamOutward);
  const { salesReturnList } = useSelector((state: RootState) => state.salesReturn);
  const { fabricMasterList } = useSelector((state: RootState) => (state as any).fabricMaster);
  const { sizingBeamOutwardList } = useSelector((state: RootState) => (state as any).sizingBeamOutward || {});
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory);
  // Add this state near your other state declarations
  const [isInEditMode, setIsInEditMode] = useState<boolean>(false);
  const [savedFabricRolls, setSavedFabricRolls] = useState<SelectedFabric[]>([]);
  const companyId = useResolvedCompanyId();
  const weavingJobWorkOrders = useMemo(
    () => normalizeResponseArray(weavingJobWorkOrderList),
    [weavingJobWorkOrderList],
  );
  const weavingContracts = useMemo(
    () => normalizeResponseArray(weavingContractList),
    [weavingContractList],
  );
  const sizingPlans = useMemo(
    () => normalizeResponseArray(sizingPlanList),
    [sizingPlanList],
  );
  const beamInwards = useMemo(
    () => normalizeResponseArray(beamInwardList),
    [beamInwardList],
  );
  const beamOutwardsAll = useMemo(
    () => normalizeResponseArray(beamOutwardList),
    [beamOutwardList],
  );
  const yarnSalesOrders = useMemo(
    () => normalizeResponseArray(yarnSalesOrderList),
    [yarnSalesOrderList],
  );
  const yarnChallans = useMemo(
    () => normalizeResponseArray(yarnChallanList),
    [yarnChallanList],
  );
  const invoices = useMemo(
    () => normalizeResponseArray(invoiceList),
    [invoiceList],
  );
  const customers = useMemo(
    () => normalizeResponseArray(customerList),
    [customerList],
  );
  const salesOrders = useMemo(
    () => normalizeResponseArray(salesOrderList),
    [salesOrderList],
  );
  const warehouses = useMemo(
    () => normalizeResponseArray(warehouseList),
    [warehouseList],
  );
  const { filteredWarehouseOptions: yarnWarehouseOptions, defaultWarehouseId: defaultYarnWarehouseId } =
    useFilteredWarehouseOptions(warehouseList, 'Yarn');
  const vendors = useMemo(
    () => normalizeResponseArray(vendorList),
    [vendorList],
  );
  const yarns = useMemo(
    () => normalizeResponseArray(yarnList),
    [yarnList],
  );
  const subCategories = useMemo(
    () => normalizeResponseArray(subCategoryList),
    [subCategoryList],
  );

  const activeSalesReturn = useMemo(() => {
    if (salesReturnDetail) return salesReturnDetail;
    if (returnId && Array.isArray(salesReturnList)) {
      return salesReturnList.find((r: any) => String(r.id) === String(returnId));
    }
    return null;
  }, [salesReturnDetail, returnId, salesReturnList]);

  const resolveWeavingOrderNo = useCallback(
    (id?: number | string) => {
      if (!id) return "";
      const match = weavingJobWorkOrders.find(
        (order) => String(order?.id) === String(id),
      );
      return match ? getWeavingOrderLabel(match) : "";
    },
    [weavingJobWorkOrders],
  );

  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [orderNo, setOrderNo] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [fabricCode, setFabricCode] = useState("");
  const [fabricQuality, setFabricQuality] = useState("");
  const [remarks, setRemarks] = useState("");
  const [dcNo, setDcNo] = useState("");
  const [dcDate, setDcDate] = useState("");
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [warehouseName, setWarehouseName] = useState("");
  const [packingSlipNo, setPackingSlipNo] = useState("");
  const [packingListOptions, setPackingListOptions] = useState<any[]>([]);
  const [generatePackingData, setGeneratePackingData] = useState<any[]>([]);
  const [invoiceType, setInvoiceType] = useState("");
  const [weavingOrderId, setWeavingOrderId] = useState<number | null>(null);
  const [weavingContractNo, setWeavingContractNo] = useState("");
  const [invoiceTypeOptions, setInvoiceTypeOptions] = useState<CodeDetail[]>([]);
  const [selectedFabricRolls, setSelectedFabricRolls] = useState<
    SelectedFabric[]
  >([]);
  const [isSummaryVisible, setIsSummaryVisible] = useState(!!returnId);
  const [fetchedShrinkage, setFetchedShrinkage] = useState<number>(0);

  // Beam Flow states
  const [sizingVendorId, setSizingVendorId] = useState<number | null>(null);
  const [sizingPlanNo, setSizingPlanNo] = useState("");
  const [weaverName, setWeaverName] = useState("");
  const [weaverId, setWeaverId] = useState<number | null>(null);
  const [beamInwardNo, setBeamInwardNo] = useState("");
  const [sizingPlanId, setSizingPlanId] = useState<number | null>(null);
  const [sizingBeamOutwardNo, setSizingBeamOutwardNo] = useState("");

  const hydratePackingOptions = (data: any, invoiceNo?: string, salesOrderId?: number | null, weavingOrderId?: number | null, invoiceId?: number | null): any[] => {
    const rawOptions = normalizeResponseArray(data);
    const filteredRaw = filterInvoicePackingRecords(rawOptions, invoiceNo, salesOrderId, weavingOrderId, invoiceId);
    setGeneratePackingData(filteredRaw);
    return filteredRaw
      .map((opt: any) => mapPackingOption(opt))
      .filter((opt: any): opt is any => Boolean(opt));
  };

  const [showFabricModal, setShowFabricModal] = useState(false);
  const [fabricPopupSearch, setFabricPopupSearch] = useState("");
  const [availableFabrics, setAvailableFabrics] = useState<AvailableFabric[]>([]);
  const [availableFabricRolls, setAvailableFabricRolls] = useState<
    SelectedFabric[]
  >([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const isYarnSales = useMemo(() => {
    // 1. Check current state against options (most reliable for active selection)
    if (invoiceType && invoiceTypeOptions.length > 0) {
      const selectedType = invoiceTypeOptions.find(opt => String(opt.id) === String(invoiceType));
      if (selectedType) {
        const label = normalizeCodeValue(selectedType.code || selectedType.value);
        if (label === 'YARN SALES' || Number(selectedType.id) === 205) return true;
      }
    }

    // 2. Check by selected rolls
    if (selectedFabricRolls.some(r => !!r.yarnId || !!r.lotNumber || !!r.millId)) {
      return true;
    }

    // 3. Fallback for raw state values
    const normType = normalizeCodeValue(invoiceType);
    if (normType === 'YARN SALES' || normType === '205') return true;

    // 4. Check initial data if available
    if (salesReturnDetail) {
      const detailType = salesReturnDetail.invoiceType;
      const typeLabel = detailType && typeof detailType === 'object'
        ? (detailType.value || detailType.code || detailType.id)
        : detailType;
      const typeId = detailType && typeof detailType === 'object'
        ? detailType.id
        : detailType;

      if (normalizeCodeValue(typeLabel) === 'YARN SALES' || String(typeId) === '205') return true;
      if (salesReturnDetail.yarnItems && Array.isArray(salesReturnDetail.yarnItems) && salesReturnDetail.yarnItems.length > 0) return true;
      if (salesReturnDetail.items?.some((r: any) => r.yarnId || r.lotNumber || r.millId)) return true;
    }

    return false;
  }, [invoiceType, invoiceTypeOptions, selectedFabricRolls, salesReturnDetail]);

  useEffect(() => {
    if (!isYarnSales || !defaultYarnWarehouseId) return;
    if (activeSalesReturn) return;
    setWarehouseId(Number(defaultYarnWarehouseId));
    const found = warehouses.find((w: any) => String(w.id) === defaultYarnWarehouseId);
    setWarehouseName(found?.warehouseName || found?.name || "");
  }, [isYarnSales, defaultYarnWarehouseId, activeSalesReturn, warehouses]);

  const isBeam = useMemo(() => {
    if (invoiceType && invoiceTypeOptions.length > 0) {
      const selectedType = invoiceTypeOptions.find(opt => String(opt.id) === String(invoiceType));
      if (selectedType) {
        return isBeamTypeLabel(selectedType.code || selectedType.value);
      }
    }
    return isBeamTypeLabel(invoiceType);
  }, [invoiceType, invoiceTypeOptions]);

  const isWeavingJobwork = useMemo(() => {
    if (invoiceType && invoiceTypeOptions.length > 0) {
      const selectedType = invoiceTypeOptions.find(opt => String(opt.id) === String(invoiceType));
      if (selectedType) {
        const label = normalizeCodeValue(selectedType.code || selectedType.value);
        if (label === 'WEAVING JOBWORK' || label === 'WEAVING_JOBWORK' || Number(selectedType.id) === 203) return true;
      }
    }
    const normType = normalizeCodeValue(invoiceType);
    if (normType === 'WEAVING JOBWORK' || normType === 'WEAVING_JOBWORK' || normType === '203') return true;
    return false;
  }, [invoiceType, invoiceTypeOptions]);

  const isSizingSales = useMemo(() => {
    if (invoiceType && invoiceTypeOptions.length > 0) {
      const selectedType = invoiceTypeOptions.find(opt => String(opt.id) === String(invoiceType));
      if (selectedType) {
        const label = normalizeCodeValue(selectedType.code || selectedType.value);
        if (label === 'SIZING SALES' || label === 'SIZING_SALES' || Number(selectedType.id) === 204) return true;
      }
    }
    const normType = normalizeCodeValue(invoiceType);
    if (normType === 'SIZING SALES' || normType === 'SIZING_SALES' || normType === '204') return true;
    return false;
  }, [invoiceType, invoiceTypeOptions]);

  const isDomestic = useMemo(() => {
    if (invoiceType && invoiceTypeOptions.length > 0) {
      const selectedType = invoiceTypeOptions.find(opt => String(opt.id) === String(invoiceType));
      if (selectedType) {
        const label = normalizeCodeValue(selectedType.code || selectedType.value);
        return label === 'DOMESTIC' || Number(selectedType.id) === 201;
      }
    }
    const normType = normalizeCodeValue(invoiceType);
    return normType === 'DOMESTIC' || normType === '201';
  }, [invoiceType, invoiceTypeOptions]);

  const isExport = useMemo(() => {
    if (invoiceType && invoiceTypeOptions.length > 0) {
      const selectedType = invoiceTypeOptions.find(opt => String(opt.id) === String(invoiceType));
      if (selectedType) {
        const label = normalizeCodeValue(selectedType.code || selectedType.value);
        return label === 'EXPORT' || Number(selectedType.id) === 202;
      }
    }
    const normType = normalizeCodeValue(invoiceType);
    return normType === 'EXPORT' || normType === '202';
  }, [invoiceType, invoiceTypeOptions]);

  const weaverNameOptions = useMemo(() => {
    if (!isBeam) return [];
    const names = new Set<string>();
    beamInwards.forEach((bi: any) => {
      bi.beamInwardBeamDetails?.forEach((detail: any) => {
        const wId = detail.weavingVendorId || detail.weaving_vendor_id || detail.weaverId || detail.weaver_id;
        const v = vendors.find((vend: any) => String(vend.id) === String(wId));
        const name = v?.vendorName || v?.name || v?.companyName || detail.weavingVendorName || detail.weaverName || "";
        if (name) names.add(name.trim());
      });
    });

    // Add current weaver from salesReturnDetail if in edit mode to ensure it's selectable
    if (salesReturnDetail?.weaverName || (salesReturnDetail?.beamItems?.[0]?.weaverName)) {
      const wName = salesReturnDetail.weaverName || salesReturnDetail.beamItems?.[0]?.weaverName;
      if (wName) names.add(wName.trim());
    }

    return Array.from(names);
  }, [beamInwards, vendors, isBeam, salesReturnDetail]);

  const fabricOptionsForBeam = useMemo(() => {
    if (!isBeam || !weaverName) return [];
    const fabrics = new Map<string, any>();
    const normalizedWeaver = weaverName.trim().toUpperCase();

    // Helper to get quality from fabricMasterList
    const getFabricQualityFromMaster = (code: string) => {
      if (!Array.isArray(fabricMasterList)) return "";
      const fm = fabricMasterList.find(f => (f.fabricCode || f.code) === code);
      return fm ? (fm.fabricQuality || fm.quality || "") : "";
    };

    const addFabricOption = (code: string, quality?: string) => {
      const trimmedCode = (code || "").trim();
      if (!trimmedCode) return;

      const resolvedQuality = (quality || getFabricQualityFromMaster(trimmedCode) || "").trim();
      const key = `${trimmedCode}|${resolvedQuality}`;

      if (!fabrics.has(key)) {
        fabrics.set(key, {
          code: trimmedCode,
          quality: resolvedQuality,
          display: (!resolvedQuality || resolvedQuality === trimmedCode || resolvedQuality === "-")
            ? trimmedCode
            : `${trimmedCode} - ${resolvedQuality}`
        });
      }
    };

    beamInwards.forEach((bi: any) => {
      const hasWeaver = bi.beamInwardBeamDetails?.some((detail: any) => {
        const wId = detail.weavingVendorId || detail.weaving_vendor_id || detail.weaverId || detail.weaver_id;
        const v = vendors.find((vend: any) => String(vend.id) === String(wId));
        const name = (v?.vendorName || v?.name || v?.companyName || detail.weavingVendorName || detail.weaverName || "").trim().toUpperCase();
        return name === normalizedWeaver;
      });

      if (!hasWeaver) return;

      bi.beamInwardQualityDetails?.forEach((q: any) => {
        addFabricOption(q.fabricCode || q.quality, q.fabricQuality || q.qualityName);
      });

      bi.beamInwardBeamDetails?.forEach((d: any) => {
        addFabricOption(d.fabricCode || d.quality, d.fabricQuality || d.qualityName);
      });
    });

    // Also check beam outwards for fabrics
    beamOutwardsAll.forEach((bo: any) => {
      const vId = bo.weavingVendorId || bo.weaverId || bo.weaving_vendor_id || bo.weaver_id;
      const v = vendors.find((vend: any) => String(vend.id) === String(vId));
      const bWeaverName = (v?.vendorName || v?.name || v?.companyName || bo.weavingVendorName || bo.weaverName || "").trim().toUpperCase();

      if (bWeaverName === normalizedWeaver) {
        addFabricOption(bo.fabricCode || bo.quality, bo.fabricQuality || bo.qualityName);
      }
    });

    // Add the current fabric from activeSalesReturn if in edit mode to ensure it's selectable
    if (activeSalesReturn?.fabricCode) {
      addFabricOption(activeSalesReturn.fabricCode, activeSalesReturn.fabricQuality);
    }

    return Array.from(fabrics.values());
  }, [beamInwards, beamOutwardsAll, vendors, isBeam, weaverName, activeSalesReturn, fabricMasterList]);

  const weavingContractOptions = useMemo(() => {
    if (!isBeam || !weaverName || !fabricCode) return [];
    const contracts = new Map<string, any>();
    const normalizedWeaver = weaverName.trim().toUpperCase();
    const normalizedFabric = fabricCode.trim().toUpperCase();

    beamInwards.forEach((bi: any) => {
      const hasWeaver = bi.beamInwardBeamDetails?.some((detail: any) => {
        const wId = detail.weavingVendorId || detail.weaving_vendor_id || detail.weaverId || detail.weaver_id;
        const v = vendors.find((vend: any) => String(vend.id) === String(wId));
        const name = (v?.vendorName || v?.name || v?.companyName || detail.weavingVendorName || detail.weaverName || "").trim().toUpperCase();
        return name === normalizedWeaver;
      });

      if (!hasWeaver) return;

      const hasFabric = bi.beamInwardQualityDetails?.some((q: any) => (q.fabricCode || q.quality || "").trim().toUpperCase() === normalizedFabric) ||
        bi.beamInwardBeamDetails?.some((d: any) => (d.fabricCode || d.quality || "").trim().toUpperCase() === normalizedFabric);

      if (!hasFabric) return;

      bi.beamInwardBeamDetails?.forEach((detail: any) => {
        const contractId = detail.weavingContractId || detail.weaving_contract_id ||
          detail.contractId || detail.contract_id ||
          detail.weavingWorkOrderId || detail.weaving_work_order_id;
        if (contractId) {
          const contract = weavingContracts.find((c: any) => String(c.id) === String(contractId));
          if (contract) {
            const label = contract.weavingContractNo || contract.contractNo || contract.wcNo || contract.weavingContractNumber || "";
            if (label && !contracts.has(label)) {
              contracts.set(label, { id: contractId, no: label });
            }
          } else {
            const label = detail.weaving_contract_no || detail.contractNo || "";
            if (label && !contracts.has(label)) {
              contracts.set(label, { id: contractId, no: label });
            }
          }
        }
      });
    });

    // Add current contract from activeSalesReturn if in edit mode to ensure it's selectable
    if (activeSalesReturn?.weavingContractNo || (activeSalesReturn?.beamItems?.[0]?.weavingContractNo)) {
      const cNo = activeSalesReturn.weavingContractNo || activeSalesReturn.beamItems?.[0]?.weavingContractNo;
      if (cNo && !contracts.has(cNo)) {
        contracts.set(cNo, { id: activeSalesReturn.weavingContractId || 0, no: cNo });
      }
    }

    return Array.from(contracts.values());
  }, [beamInwards, vendors, weavingJobWorkOrders, weavingContracts, isBeam, weaverName, fabricCode, activeSalesReturn]);

  // Beam Flow dependent dropdown logic - removed as per new beam flow

  // Auto-select cascading Beam dropdowns - removed as per new beam flow

  const [tempSelectedRolls, setTempSelectedRolls] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editNote, setEditNote] = useState("");
  const [dcUploadMediaSno, setDcUploadMediaSno] = useState<number | null>(null);
  const [dcUploadFileName, setDcUploadFileName] = useState<string>("");
  const [invoiceUploadMediaSno, setInvoiceUploadMediaSno] = useState<number | null>(null);
  const [invoiceUploadFileName, setInvoiceUploadFileName] = useState<string>("");
  // useForm({
  //   defaultValues: {
  //     salesReturnNo:'',
  //     editNote: salesReturnDetail?.editNote || '',
  //   }
  // });

  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);

  const { register, handleSubmit, setValue, watch, reset } = useForm<SalesReturnInformationFormData>({
    defaultValues: {
      salesReturnNo: salesReturnDetail?.salesReturnNo || 'Loading sequence...'
    }
  });

  const isManualChangeRef = useRef(false);
  const invoiceIdRef = useRef<number | null>(null);

  useEffect(() => {
    const generateDocumentNumber = async () => {
      if (salesReturnDetail || hasGeneratedNumberRef.current || returnId) {
        return;
      }

      setValue('salesReturnNo', 'Loading sequence...');

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Sales Beam/Jobwork Return'
        });
        setValue('salesReturnNo', result.documentNumber, { shouldValidate: true });
        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate Sales Beam/Jobwork Return number:', error);
        toast.error('Failed to generate Sales Beam/Jobwork Return number');
      }
    };

    generateDocumentNumber();
  }, [salesReturnDetail, returnId, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !salesReturnDetail) {
        documentNumberService.clearMemoryCache('Sales Beam/Jobwork Return');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !salesReturnDetail) {
        documentNumberService.clearMemoryCache('Sales Beam/Jobwork Return');
      }
    };
  }, [salesReturnDetail]);

  useEffect(() => {
    if (salesReturnDetail?.salesReturnNo) {
      setValue('salesReturnNo', salesReturnDetail.salesReturnNo);
    }
  }, [salesReturnDetail, setValue]);

  const getYarnName = (id?: number) => {
    return yarns.find((y: any) => y.id === id)?.yarnName || id || "-";
  };

  const getMillName = (id?: number) => {
    const mills = (subCategories || []).filter((sc: any) => sc.categoryName === "Mill");
    return mills.find((m: any) => m.id === id)?.subCategoryName || id || "-";
  };

  const getWarehouseName = (id?: number) => {
    return warehouses.find((w: any) => w.id === id)?.warehouseName || id || "-";
  };

  useEffect(() => {
    if (companyId) {
      dispatch(getAllInvoicesByCompanyId(companyId));
      dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
        factoryCompanyId: companyId,
      }) as any);
      // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(companyId));
    } else {
      dispatch(getAllInvoices({}));
      dispatch(getAllWeavingJobWorkOrders({}));
    }
    dispatch(getAllCustomers({ fetchAll: true }));
    dispatch(getAllSalesOrders({ fetchAll: true }));
    dispatch(getAllYarnSalesOrders(companyId ? { companyId } : {}));
    dispatch(getAllWarehouse({ fetchAll: true }));
    dispatch(getAllYarnChallan(companyId ? { companyId } : {}));
    dispatch(getAllYarnMasters({ fetchAll: true }));
    dispatch(getAllVendors({ fetchAll: true }));
    dispatch(getAllSizingPlan({ fetchAll: true }));
    dispatch(getAllBeamInward({ fetchAll: true }));
    dispatch(getAllBeamOutward({ companyId: companyId ?? undefined }));
    dispatch(getAllSizingBeamOutward({ fetchAll: true, companyId: companyId ?? undefined }));
    dispatch(getAllWeavingContract({ fetchAll: true, companyId: companyId ?? undefined }));
    dispatch(getAllFabricMasters({ fetchAll: true }));
    dispatch(getAllSubCategories({ fetchAll: true }));
    dispatch(getAllSalesReturn(companyId ? { companyId, fetchAll: true } : { fetchAll: true }));
  }, [dispatch, companyId]);

  useEffect(() => {
    if (returnId && activeSalesReturn && !isManualChangeRef.current) {
      setReturnDate(activeSalesReturn.date);
      // setSalesReturnNo(activeSalesReturn.salesReturnNo || "");
      setInvoiceNo(activeSalesReturn.invoiceNo);
      setInvoiceId(activeSalesReturn.invoiceId ?? null);
      setOrderNo(activeSalesReturn.orderNo);
      setOrderId(activeSalesReturn.orderId ?? null);
      setBuyerName(activeSalesReturn.buyerName);
      setCustomerId(activeSalesReturn.customerId ?? null);

      setFabricCode(activeSalesReturn.fabricCode || "");
      setFabricQuality(activeSalesReturn.fabricQuality || "");

      // Extract invoice type ID or label robustly first to decide hydration path
      const rawType = activeSalesReturn.invoiceType || activeSalesReturn.invoiceTypeId;
      let typeToSet = "";

      if (rawType && typeof rawType === 'object') {
        typeToSet = String(rawType.id || rawType.value || rawType.code || "");
      } else if (rawType) {
        typeToSet = String(rawType);
      }

      // If it's a label, try to find the ID from options
      if (typeToSet && !/^\d+$/.test(typeToSet) && invoiceTypeOptions.length > 0) {
        const found = invoiceTypeOptions.find(opt =>
          normalizeCodeValue(opt.code || opt.value) === normalizeCodeValue(typeToSet)
        );
        if (found) typeToSet = String(found.id);
      }

      // If it's the specific "Beam" label, find its actual ID from options and use it
      let currentInvoiceType = typeToSet;
      if (isBeamTypeLabel(typeToSet) && invoiceTypeOptions.length > 0) {
        const beamOption = invoiceTypeOptions.find(opt => isBeamTypeLabel(opt.code || opt.value));
        if (beamOption) {
          currentInvoiceType = String(beamOption.id);
        }
      }
      setInvoiceType(currentInvoiceType);

      const selectedTypeOpt = invoiceTypeOptions.find(opt => String(opt.id) === String(currentInvoiceType));
      const isBeamType = (selectedTypeOpt && isBeamTypeLabel(selectedTypeOpt.code || selectedTypeOpt.value)) ||
        isBeamTypeLabel(currentInvoiceType) ||
        currentInvoiceType === "206" ||
        currentInvoiceType === "204" ||
        normalizeCodeValue(currentInvoiceType) === "SIZING SALES";
      const isYarnSalesType = currentInvoiceType === "205" || normalizeCodeValue(currentInvoiceType) === "YARN SALES";
      const isWJobworkType = currentInvoiceType === "203" || normalizeCodeValue(currentInvoiceType) === "WEAVING JOBWORK";
      const isSizingSalesType = currentInvoiceType === "204" || normalizeCodeValue(currentInvoiceType) === "SIZING SALES";

      // Set weavingOrderId for Weaving Jobwork if present or can be resolved
      const wOrderId = activeSalesReturn.weavingOrderId || activeSalesReturn.weavingWorkOrderId || activeSalesReturn.weavingJobWorkOrderId;
      if (wOrderId) {
        setWeavingOrderId(Number(wOrderId));
      } else if (activeSalesReturn.orderNo && isWJobworkType) {
        const foundOrder = weavingJobWorkOrders.find(o => getWeavingOrderLabel(o) === activeSalesReturn.orderNo);
        if (foundOrder) setWeavingOrderId(Number(foundOrder.id));
      }

      // Set weaverId for Weaving Jobwork if present
      if (activeSalesReturn.weaverId) {
        setWeaverId(Number(activeSalesReturn.weaverId));
        const v = vendors.find(vend => String(vend.id) === String(activeSalesReturn.weaverId));
        if (v) setWeaverName(v.vendorName || v.name || "");
      }

      if (isBeamType && (activeSalesReturn.beamItems || activeSalesReturn.sizingItems)) {
        const itemsToMap = isSizingSalesType && activeSalesReturn.sizingItems ? activeSalesReturn.sizingItems : (activeSalesReturn.beamItems || []);
        const mappedBeamItems = itemsToMap.map((b: any) => ({
          id: b.id,
          rollNo: b.sizedBeamNo || b.sized_beam_no || b.beamNo || b.beam_no || "",
          pieceNo: "1",
          meter: Number(b.beamMeter || b.beamMeters || b.beam_meters || b.wrapMeters || b.wrap_meters || b.totalBeamMeters || 0),
          netWeight: Number(b.netWeight || b.beamMeter || b.beamMeters || b.beam_meters || b.wrapMeters || b.wrap_meters || b.totalBeamMeters || 0),
          beamOutwardNo: b.beamOutwardNo || b.outwardNo || b.beam_outward_no || b.outward_no || "",
          beamOutwardId: b.beamOutwardId || 0,
          beamInwardId: b.beamInwardId || 0,
          outwardDate: b.outwardDate || b.date || b.outward_date || "",
          weavingContractNo: b.weavingContractNo || b.contractNo || b.weaving_contract_no || b.weavingWorkOrderNo || "",
          weaverName: b.weaverName || b.weavingVendorName || b.weaver_name || b.vendorName || "",
          sizingPlanNo: b.sizingPlanNo || b.planNo || b.sizing_plan_no || b.plan_no || "",
          salesOrderNo: b.salesOrderNo || b.orderNo || b.sales_order_no || b.order_no || "",
          flangeNo: b.flangeNo || b.flange_no || "",
          sizedBeamNo: b.sizedBeamNo || b.sized_beam_no || b.beamNo || b.beam_no || "",
          beamMeters: Number(b.beamMeter || b.beamMeters || b.beam_meters || b.wrapMeters || b.wrap_meters || b.totalBeamMeters || 0),
          originalBeamMeters: Number(b.beamMeter || b.beamMeters || b.beam_meters || b.wrapMeters || b.wrap_meters || b.totalBeamMeters || 0),
          expectedFabricMeter: calculateExpectedFabricMeter(
            Number(b.beamMeter || b.beamMeters || b.beam_meters || b.wrapMeters || b.wrap_meters || b.totalBeamMeters || 0),
            Number(b.shrinkage || 0),
            Number(b.fabricPanelWidth || 0),
            b.width || 0
          ),
          totalBeams: b.totalBeams || b.totalNoOfBeams || b.noOfBeams || 0,
          weaverId: b.weaverId || b.weavingVendorId || b.weaver_id || b.weaving_vendor_id,
          buyerName: activeSalesReturn.buyerName || "",
          fabricCode: activeSalesReturn.fabricCode || "",
          fabricPanelWidth: b.fabricPanelWidth || "",
          shrinkage: Number(b.shrinkage || 0),
          width: b.width || "",
          totalEnds: b.totalEnds || ""
        }));
        setSelectedFabricRolls(mappedBeamItems);
        setSavedFabricRolls(mappedBeamItems); // Also set saved rolls
        setIsInEditMode(false); // Start in saved mode for edit
        setIsSummaryVisible(true);

        // Populate Beam-specific dropdown states from the first beam item
        const firstBeam = itemsToMap[0];
        if (firstBeam) {
          setSizingPlanNo(firstBeam.sizingPlanNo || firstBeam.sizing_plan_no || firstBeam.planNo || firstBeam.plan_no || "");
          setWeaverName(firstBeam.weaverName || firstBeam.weavingVendorName || firstBeam.weaver_name || firstBeam.vendorName || "");
          setWeavingContractNo(firstBeam.weavingContractNo || firstBeam.contractNo || firstBeam.weaving_contract_no || firstBeam.weavingWorkOrderNo || "");

          if (isSizingSalesType) {
            setSizingBeamOutwardNo(firstBeam.beamOutwardNo || firstBeam.outwardNo || "");

            // Fallback: If beamOutwardNo is missing in item, try to get it from invoice if invoices are loaded
            if (!(firstBeam.beamOutwardNo || firstBeam.outwardNo) && invoiceId && invoices.length > 0) {
              const inv = invoices.find(i => Number(i.id) === Number(invoiceId));
              if (inv && Array.isArray(inv.sizingSalesItems) && inv.sizingSalesItems.length > 0) {
                setSizingBeamOutwardNo(inv.sizingSalesItems[0].beamOutwardNo || "");
              }
            }
          }

          const wId = firstBeam.weaverId || firstBeam.weavingVendorId || firstBeam.weaver_id || firstBeam.weaving_vendor_id;
          if (wId) setWeaverId(Number(wId));

          // Try to find the sizing vendor and plan ID from sizing plans using sizingPlanNo
          const sPlanNo = firstBeam.sizingPlanNo || firstBeam.sizing_plan_no || firstBeam.planNo || firstBeam.plan_no;
          if (sPlanNo && sizingPlans.length > 0) {
            const plan = sizingPlans.find((p: any) => {
              const pNo = p.sizingPlanNo || p.planNo || p.sizingPlanNumber || p.sizing_plan_no || p.plan_no;
              return pNo === sPlanNo;
            });
            if (plan) {
              const vId = plan.sizingVendorId || plan.sizing_vendor_id || plan.vendorId || plan.vendor_id;
              if (vId) setSizingVendorId(Number(vId));
              if (plan.id) setSizingPlanId(Number(plan.id));
            }
          }
        }
      } else if (isYarnSalesType && activeSalesReturn.yarnItems && Array.isArray(activeSalesReturn.yarnItems) && activeSalesReturn.yarnItems.length > 0) {
        const mappedYarnItems = activeSalesReturn.yarnItems.map((y: any) => ({
          id: y.id,
          rollNo: y.lotNo || "N/A",
          pieceNo: String(y.issuedBags || 0),
          meter: Number(y.issuedQty || 0),
          netWeight: Number(y.issuedQty || 0),
          yarnId: y.yarnId || yarns.find((yarn: any) => yarn.yarnName === y.yarnName)?.id,
          millId: resolveMillIdFromRecord(y) || resolveMillIdByName(y.millName, subCategories) || resolveMillIdFromYarnSalesOrder(y.yarnId || yarns.find((yarn: any) => yarn.yarnName === y.yarnName)?.id, orderId, yarnSalesOrders),
          millName: y.millName || "",
          warehouseId: y.warehouseId,
          lotNumber: y.lotNo,
          availableBags: (Number(y.noOfBags) || 0) + (Number(y.issuedBags) || 0),
          availableQty: (Number(y.availableQty) || 0) + (Number(y.issuedQty) || 0),
          issueQty: Number(y.issuedQty || 0),
        }));
        setSelectedFabricRolls(mappedYarnItems);
        setSavedFabricRolls(mappedYarnItems);
        setIsInEditMode(false);
        setIsSummaryVisible(true);
      } else if (activeSalesReturn.items && Array.isArray(activeSalesReturn.items) && activeSalesReturn.items.length > 0) {
        setSelectedFabricRolls(activeSalesReturn.items);
        setSavedFabricRolls(activeSalesReturn.items);
        setIsInEditMode(false);
        setIsSummaryVisible(true);
      } else {
        setSelectedFabricRolls([]);
      }

      setRemarks(activeSalesReturn.remarks || "");
      setWarehouseId(activeSalesReturn.warehouseId ?? null);
      setWarehouseName(activeSalesReturn.warehouseName ?? "");
      setPackingSlipNo(activeSalesReturn.packingListNo || activeSalesReturn.packingSlipNo || "");

      // Fetch packing lists for the selected invoice in edit mode
      if (activeSalesReturn.invoiceNo && !isManualChangeRef.current) {
        dispatch(getAllGeneratePacking({
          invoiceNo: activeSalesReturn.invoiceNo,
          companyId,
          salesOrderId: activeSalesReturn.orderId,
          weavingWorkOrderId: activeSalesReturn.weavingOrderId || activeSalesReturn.weavingWorkOrderId || activeSalesReturn.weavingJobWorkOrderId
        })).unwrap().then((data: any) => {
          if (isManualChangeRef.current) return;
          const options = hydratePackingOptions(
            data,
            activeSalesReturn.invoiceNo,
            activeSalesReturn.orderId,
            activeSalesReturn.weavingOrderId || activeSalesReturn.weavingWorkOrderId || activeSalesReturn.weavingJobWorkOrderId,
            activeSalesReturn.invoiceId
          );
          setPackingListOptions(options);
          if (options.length === 1) {
            setPackingSlipNo(options[0].packingSlipNo);
          }
        }).catch((err: any) => {
          console.error("Failed to fetch packing lists in edit mode:", err);
        });
      }

      setEditNote(activeSalesReturn.editNote || "");
      setDcNo(activeSalesReturn.dcNo || "");
      setDcDate(activeSalesReturn.dcDate || "");

      if (activeSalesReturn.dcUpload) {
        setDcUploadMediaSno(activeSalesReturn.dcUpload);
        if (activeSalesReturn.dcUploadDetail?.originalFileName) {
          setDcUploadFileName(activeSalesReturn.dcUploadDetail.originalFileName);
        }
      }
      if (activeSalesReturn.invoiceUpload) {
        setInvoiceUploadMediaSno(activeSalesReturn.invoiceUpload);
        if (activeSalesReturn.invoiceUploadDetail?.originalFileName) {
          setInvoiceUploadFileName(activeSalesReturn.invoiceUploadDetail.originalFileName);
        }
      }
      setDataLoaded(true);
    } else {
      setDataLoaded(true);
    }
  }, [
    returnId,
    activeSalesReturn,
    yarns,
    sizingPlans,
    invoiceTypeOptions,
    invoices,
    salesOrders,
    vendors,
    subCategories,
    yarnSalesOrders,
    yarnChallans,
    companyId
  ]);

  // Hydrate sizingBeamOutwardNo from invoices once they load (fallback for edit mode)
  useEffect(() => {
    if (returnId && isSizingSales && invoiceId && invoices.length > 0 && !sizingBeamOutwardNo) {
      const inv = invoices.find(i => Number(i.id) === Number(invoiceId));
      if (inv && Array.isArray(inv.sizingSalesItems) && inv.sizingSalesItems.length > 0) {
        setSizingBeamOutwardNo(inv.sizingSalesItems[0].beamOutwardNo || "");
      }
    }
  }, [returnId, isSizingSales, invoiceId, invoices, sizingBeamOutwardNo]);

  useEffect(() => {
    const generateReturnNumber = async () => {
      if (returnId) {
        return;
      }

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Sales Beam/Jobwork Return'
        });

        setValue("salesReturnNo", result.documentNumber);
      } catch (error) {
        console.error('Failed to generate return number:', error);
      }
    };

    generateReturnNumber();
  }, [returnId]);

  useEffect(() => {
    let isMounted = true;

    const loadInvoiceTypes = async () => {
      let headers: CodeHeader[] = readHeadersFromStorage();

      if (!headers.length) {
        const cachedHeaders = normalizeHeadersResponse(CodesUtil.getHeaders?.());
        if (cachedHeaders.length) {
          headers = cachedHeaders;
        }
      }

      if (!headers.length) {
        try {
          await CodesUtil.loadOnce(async () => normalizeHeadersResponse(await CodesAPI.getCodesHeader()));
          const loadedHeaders = normalizeHeadersResponse(CodesUtil.getHeaders?.());
          if (loadedHeaders.length) {
            headers = loadedHeaders;
          }
        } catch (error) {
          console.error('Failed to load invoice types:', error);
        }
      }

      if (!headers.length) {
        try {
          const apiHeaders = await CodesAPI.getCodesHeader();
          headers = normalizeHeadersResponse(apiHeaders);
        } catch (error) {
          console.error('Failed to load invoice types from API:', error);
        }
      }

      if (headers.length) {
        cacheHeadersToStorage(headers);
      }

      if (!isMounted) return;
      const invoiceTypes = extractInvoiceTypeDetails(headers);

      // Add Beam fallback only when no Beam-like option exists
      if (!invoiceTypes.some(opt => isBeamTypeLabel(opt.code || opt.value))) {
        invoiceTypes.push({
          id: 206,
          code: 'BEAM',
          value: 'Beam',
          activeFlag: true
        } as CodeDetail);
      }

      setInvoiceTypeOptions(invoiceTypes);
    };

    loadInvoiceTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  // Resolve invoiceType label to ID if it's a string
  useEffect(() => {
    if (invoiceType && invoiceTypeOptions.length > 0) {
      const isId = /^\d+$/.test(String(invoiceType));
      if (!isId) {
        const found = invoiceTypeOptions.find(opt =>
          normalizeCodeValue(opt.code || opt.value) === normalizeCodeValue(invoiceType)
        );
        if (found) {
          setInvoiceType(String(found.id));
        }
      }
    }
  }, [invoiceType, invoiceTypeOptions]);

  // Derive invoiceType from invoiceId if it's missing (important for edit mode)
  useEffect(() => {
    if (returnId && !invoiceType && invoiceId && invoices.length > 0) {
      const invoice = invoices.find((inv: any) => inv.id === invoiceId);
      if (invoice) {
        const typeId = invoice.invoiceTypeId || invoice.invoiceType?.id;
        if (typeId) {
          setInvoiceType(String(typeId));
        }
      }
    }
  }, [returnId, invoiceType, invoiceId, invoices]);

  useEffect(() => {
    if (!returnId || !salesReturnDetail || isManualChangeRef.current) {
      if (isManualChangeRef.current && !invoiceId && !orderId && !weavingOrderId) {
        setAvailableFabrics([]);
      }
      return;
    }

    const invoice = invoices.find((inv: any) => inv.id === (salesReturnDetail.invoiceId ?? null));
    const order = salesOrders.find((so: any) => so.id === (salesReturnDetail.orderId ?? null));

    let fabricItems: AvailableFabric[] = [];

    if (invoice?.items?.length > 0) {
      fabricItems = invoice.items.map((item: any) => {
        const fmId = item.fabricMasterId || item.fabricId;
        let code = "";
        let quality = "";

        if (fmId && Array.isArray(fabricMasterList)) {
          const fm = fabricMasterList.find((f: any) => String(f.id) === String(fmId));
          if (fm) {
            code = fm.fabricCode || fm.code || "";
            quality = fm.fabricQuality || fm.quality || "";
          }
        }

        if (!code) {
          const productName = item.productName || "";
          const parts = productName.split(" - ");
          code = parts[0]?.trim() || "";
          quality = parts.slice(1).join(" - ").trim() || "";

          if (quality === code) {
            quality = "";
          } else if (quality.startsWith(`${code} - `)) {
            quality = quality.replace(`${code} - `, "");
          }
        }

        return {
          id: item.id,
          fabricCode: code,
          fabricQuality: quality,
          displayLabel: code && quality && quality !== "-" ? `${code} - ${quality}` : (code || item.productName || "Unknown Fabric"),
          yarnId: item.yarnId || item.itemId,
          fabricMasterId: fmId,
        };
      });
    } else if (order?.items?.length > 0) {
      fabricItems = order.items.map((item: any) => {
        const fmId = item.fabricMasterId || item.fabricId;
        let code = item.fabricCode || item.code || "";
        let quality = item.fabricQuality || item.quality || "";

        if (fmId && Array.isArray(fabricMasterList)) {
          const fm = fabricMasterList.find((f: any) => String(f.id) === String(fmId));
          if (fm) {
            code = fm.fabricCode || fm.code || code;
            quality = fm.fabricQuality || fm.quality || quality;
          }
        }

        return {
          id: item.id,
          fabricCode: code,
          fabricQuality: quality,
          displayLabel: (!quality || quality === code || quality === "-") ? code : `${code} - ${quality}`,
          yarnId: item.yarnId || item.itemId,
          fabricMasterId: fmId,
        };
      });
    }

    if (salesReturnDetail.fabricCode) {
      const exists = fabricItems.some((fab: AvailableFabric) => fab.fabricCode === salesReturnDetail.fabricCode);
      if (!exists) {
        const code = salesReturnDetail.fabricCode;
        const quality = salesReturnDetail.fabricQuality;
        fabricItems = [
          ...fabricItems,
          {
            id: salesReturnDetail.fabricCodeId || 0,
            fabricCode: code,
            fabricQuality: quality,
            displayLabel: (!quality || quality === code || quality === "-") ? code : `${code} - ${quality}`,
            yarnId: salesReturnDetail.yarnId,
          },
        ];
      }
    }

    if (fabricItems.length > 0) {
      setAvailableFabrics(fabricItems);
    }
  }, [returnId, salesReturnDetail, salesOrders, invoices, fabricMasterList, invoiceId, orderId, weavingOrderId]);

  // Enrich selected rolls with yarn details in edit mode
  useEffect(() => {
    if (returnId && isYarnSales && selectedFabricRolls.length > 0 && yarnChallans.length > 0) {
      // Enrich if missing yarn info OR if we have basic roll data that needs mapping
      const needsEnrichment = selectedFabricRolls.some(roll =>
        !roll.yarnId || !roll.millId || !roll.warehouseId || !roll.lotNumber || (roll.rollNo === "1" && !roll.lotNumber)
      );

      if (needsEnrichment) {
        const challan = yarnChallans.find(
          (c: any) => (Number(c.yarnSalesOrderId) === Number(orderId) || (invoiceId && Number(c.invoiceId) === Number(invoiceId)))
        );

        if (challan && Array.isArray(challan.yarnIssueDetails)) {
          const enrichedRolls = selectedFabricRolls.map(roll => {
            // Try to find matching yarn issue detail by lotNumber (stored in rollNo or lotNumber)
            const detail = challan.yarnIssueDetails.find((d: any) =>
              d.id === roll.id ||
              (roll.lotNumber && d.lotNumber === roll.lotNumber) ||
              (roll.rollNo && roll.rollNo !== "1" && d.lotNumber === roll.rollNo)
            );

            if (detail) {
              return {
                ...roll,
                yarnId: roll.yarnId || detail.yarnId,
                millId: roll.millId || resolveMillIdFromRecord(detail) || resolveMillIdByName(detail.millName, subCategories) || resolveMillIdFromYarnSalesOrder(detail.yarnId || roll.yarnId, orderId, yarnSalesOrders),
                warehouseId: roll.warehouseId || detail.warehouseId,
                lotNumber: roll.lotNumber || detail.lotNumber,
                availableBags: roll.availableBags !== undefined ? roll.availableBags : detail.availableBags,
                availableQty: roll.availableQty !== undefined ? roll.availableQty : detail.availableQty,
                issueQty: roll.issueQty !== undefined ? roll.issueQty : detail.issueQty,
                // Update rollNo to lotNumber if it was "1" or generic
                rollNo: (roll.rollNo && roll.rollNo !== "1" && roll.rollNo !== "N/A") ? roll.rollNo : (detail.lotNumber || roll.rollNo),
              };
            }
            return roll;
          });

          // Check if enrichment actually changed anything
          const changed = JSON.stringify(enrichedRolls) !== JSON.stringify(selectedFabricRolls);
          if (changed) {
            setSelectedFabricRolls(enrichedRolls);
          }
        }
      }
    }
  }, [returnId, isYarnSales, yarnChallanList, selectedFabricRolls, orderId, invoiceId]);

  const invoiceOptions = useMemo(() => {
    if (isYarnSales) {
      let list = yarnChallans.filter((challan: any) => Number(challan.isInvoice) === 1);
      if (customerId) {
        list = list.filter((challan: any) => {
          const invCustomerId = challan.customerId || challan.buyerId;
          return Number(invCustomerId) === Number(customerId);
        });
      }
      return list.map((challan: any) => ({
        id: challan.id,
        invoiceNo: challan.yarnChallanNo || challan.challanNo || `CH-${challan.id}`,
        salesOrderId: challan.yarnSalesOrderId || challan.orderId,
        customerId: challan.customerId || challan.buyerId,
        soNo: challan.yarnSalesNo || challan.yarnSalesOrderNo || challan.orderNo || "",
      }));
    }

    let list = invoices;

    if (invoiceType) {
      list = list.filter((invoice: any) => {
        const typeId = invoice.invoiceTypeId || invoice.invoiceType?.id;
        const typeValue = invoice.invoiceType?.value || invoice.invoiceType?.code || invoice.invoiceType;

        return String(typeId) === String(invoiceType) ||
          normalizeCodeValue(typeValue) === normalizeCodeValue(invoiceType);
      });
    }

    if (isWeavingJobwork || isSizingSales || isDomestic || isExport) {
      if (!customerId) return [];
      list = list.filter((invoice: any) => {
        const invCustomerId = invoice.customerId || invoice.customer?.id;
        return Number(invCustomerId) === Number(customerId);
      });
    }

    const mappedOptions = list.map(
      (invoice: any) => ({
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        salesOrderId: invoice.salesOrderId,
        customerId: invoice.customerId,
        soNo: invoice.soNo,
      })
    );

    // Ensure currently selected invoice is in the options in edit mode
    if (returnId && invoiceId && !mappedOptions.some(opt => Number(opt.id) === Number(invoiceId))) {
      const currentInvoice = invoices.find(inv => Number(inv.id) === Number(invoiceId));
      if (currentInvoice) {
        mappedOptions.push({
          id: currentInvoice.id,
          invoiceNo: currentInvoice.invoiceNo,
          salesOrderId: currentInvoice.salesOrderId,
          customerId: currentInvoice.customerId,
          soNo: currentInvoice.soNo,
        });
      }
    }

    return mappedOptions;
  }, [invoices, invoiceType, isYarnSales, yarnChallans, isWeavingJobwork, customerId, isSizingSales, returnId, invoiceId]);

  const sizingBeamOutwardOptions = useMemo(() => {
    if (!isSizingSales || !invoiceId) return [];
    return beamOutwardsAll.filter((bo: any) => {
      return Number(bo.invoiceId) === Number(invoiceId) || bo.invoiceNo === invoiceNo;
    }).map((bo: any) => ({
      id: bo.id,
      outwardNo: bo.outwardNo || bo.beamOutwardNo || bo.beam_outward_no || `BO-${bo.id}`
    }));
  }, [isSizingSales, invoiceId, invoiceNo, beamOutwardsAll]);

  const handleInvoiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    isManualChangeRef.current = true;
    invoiceIdRef.current = null;
    setInvoiceType(e.target.value);
    setInvoiceId(null);
    setInvoiceNo("");
    setOrderNo("");
    setOrderId(null);
    setBuyerName("");
    setCustomerId(null);
    setFabricCode("");
    setFabricQuality("");
    setAvailableFabrics([]);
    setSelectedFabricRolls([]);
    setSavedFabricRolls([]);
    setAvailableFabricRolls([]);
    setPackingListOptions([]);
    setPackingSlipNo("");
    setWeavingOrderId(null);
    setSizingVendorId(null);
    setSizingPlanNo("");
    setWeaverName("");
    setWeaverId(null);
    setBeamInwardNo("");
    setSizingBeamOutwardNo("");
    setWeavingContractNo("");
    setSizingPlanId(null);
    setWarehouseId(null);
    setWarehouseName("");
    setRemarks("");
    setIsSummaryVisible(!!returnId);
    setFetchedShrinkage(0);
    setGeneratePackingData([]);
    setTempSelectedRolls([]);

    // Clear react-hook-form
    setValue("invoiceId", null);
    setValue("invoiceNo", "");
    setValue("orderNo", "");
    setValue("orderId", null);
    setValue("customerId", null);
    setValue("buyerName", "");
    setValue("fabricCode", "");
    setValue("packingSlipNo", "");
    setValue("remarks", "");
    setValue("warehouseId", null);
  };

  const handleBuyerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    isManualChangeRef.current = true;
    invoiceIdRef.current = null;
    const selectedId = e.target.value;
    if (!selectedId) {
      setCustomerId(null);
      setBuyerName("");
      setInvoiceId(null);
      setInvoiceNo("");
      setOrderNo("");
      setAvailableFabrics([]);
      setPackingListOptions([]);
      setPackingSlipNo("");
      setSizingBeamOutwardNo("");
      return;
    }
    const customer = customers.find((c: any) => String(c.id) === String(selectedId));
    if (customer) {
      setCustomerId(Number(customer.id));
      setBuyerName(customer.customerName || customer.name || "");
      setInvoiceId(null);
      setInvoiceNo("");
      setOrderNo("");
      setAvailableFabrics([]);
      setPackingListOptions([]);
      setPackingSlipNo("");
      setSizingBeamOutwardNo("");
    }
  };

  useEffect(() => {
    if (!invoiceId) {
      setAvailableFabrics([]);
      setPackingListOptions([]);
      setFabricCode("");
      setPackingSlipNo("");
      setFabricQuality("");
    }
  }, [invoiceId]);

  useEffect(() => {
    if (beamInwards.length > 0 || sizingPlans.length > 0 || invoices.length > 0) {
      setDataLoaded(true);
    }
  }, [beamInwards, sizingPlans, invoices]);

  const handleBeamInwardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Deprecated - using new beam flow logic
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    isManualChangeRef.current = true;
    const selectedId = e.target.value;
    if (!selectedId) {
      invoiceIdRef.current = null;
      setInvoiceId(null);
      setInvoiceNo("");
      setOrderNo("");
      setOrderId(null);
      setBuyerName("");
      setCustomerId(null);
      setFabricCode("");
      setFabricQuality("");
      setAvailableFabrics([]);
      setPackingListOptions([]);
      setPackingSlipNo("");
      setSizingBeamOutwardNo("");
      setWeavingOrderId(null);
      return;
    }
    setWeavingOrderId(null);
    setSizingBeamOutwardNo("");

    const selected = invoiceOptions.find((inv) => String(inv.id) === String(selectedId));

    let selectedInvoice: any;
    if (isYarnSales) {
      selectedInvoice = yarnChallans.find((yc: any) => String(yc.id) === String(selectedId));
    } else {
      selectedInvoice = invoices.find((inv: any) => String(inv.id) === String(selectedId));
    }

    if (selected && selectedInvoice) {
      const currentInvoiceId = Number(selected.id);
      invoiceIdRef.current = currentInvoiceId;
      setInvoiceId(currentInvoiceId);
      setInvoiceNo(selected.invoiceNo);
      setOrderId(selected.salesOrderId ? Number(selected.salesOrderId) : null);
      setCustomerId(selected.customerId ? Number(selected.customerId) : null);

      if (!isYarnSales) {
        const weavingId =
          selectedInvoice.weavingWorkOrderId ??
          selectedInvoice.weavingJobWorkOrderId ??
          selectedInvoice.weavingWorkOrder?.id ??
          null;
        setWeavingOrderId(weavingId ? Number(weavingId) : null);
        // Set invoice type if not already set or if it differs from current
        const typeId = selectedInvoice.invoiceTypeId || selectedInvoice.invoiceType?.id;
        if (typeId && String(typeId) !== String(invoiceType)) {
          setInvoiceType(String(typeId));
        }
      }

      const salesOrder = salesOrders.find((so: any) => String(so.id) === String(selected.salesOrderId));

      const customer = customers.find((c: any) => String(c.id) === String(selected.customerId));

      let resolvedOrderNo = "";

      const selectedInvoiceTypeId = selectedInvoice.invoiceTypeId ?? (typeof selectedInvoice.invoiceType === 'object' ? selectedInvoice.invoiceType?.id : selectedInvoice.invoiceType);
      const isSelectedWeavingJobwork = isWeavingJobwork || String(selectedInvoiceTypeId) === "203" || normalizeCodeValue(String(selectedInvoiceTypeId ?? '')) === "WEAVING JOBWORK" || normalizeCodeValue(String(selectedInvoiceTypeId ?? '')) === "WEAVING_JOBWORK";

      if (isYarnSales) {
        const yso = yarnSalesOrders.find(
          (o: any) => String(o.id) === String(selected.salesOrderId)
        );
        resolvedOrderNo = selectedInvoice.yarnSalesNo || selectedInvoice.yarnSalesOrderNo || selectedInvoice.orderNo || yso?.yarnSalesNo || yso?.yarnSalesOrderNo || yso?.orderNo || selected.soNo || "";

        // If it's just an ID (numeric), try to see if we can get a better label from yso
        if (resolvedOrderNo && /^\d+$/.test(String(resolvedOrderNo)) && yso) {
          resolvedOrderNo = yso.yarnSalesNo || yso.yarnSalesOrderNo || yso.orderNo || resolvedOrderNo;
        }
      } else if (isSelectedWeavingJobwork) {
        const weavingId =
          selectedInvoice.weavingWorkOrderId ??
          selectedInvoice.weavingJobWorkOrderId ??
          selectedInvoice.weavingWorkOrder?.id;
        if (weavingId) {
          const wOrder = weavingJobWorkOrders.find((o: any) => String(o.id) === String(weavingId));
          if (wOrder) {
            resolvedOrderNo = wOrder.weavingWorkOrderNo || wOrder.woNo || wOrder.weavingOrderNo || wOrder.jobWorkOrderNo || wOrder.weavingJobWorkOrderNo || wOrder.orderNo || "";
          }
        }
        if (!resolvedOrderNo) {
          resolvedOrderNo =
            selectedInvoice.weavingWorkOrderNo ||
            selectedInvoice.weavingOrderNo ||
            selectedInvoice.jobWorkOrderNo ||
            selectedInvoice.weavingJobWorkOrderNo ||
            resolveWeavingOrderNo(weavingId) ||
            selectedInvoice.orderNo ||
            "";
        }
      } else if (salesOrder) {
        resolvedOrderNo = salesOrder.salesOrderNo || salesOrder.orderNo || "";
      }

      if (!resolvedOrderNo && selected.soNo) {
        resolvedOrderNo = selected.soNo;
      }

      if (!resolvedOrderNo && !isYarnSales) {
        const weavingOrderId =
          selectedInvoice.weavingWorkOrderId ??
          selectedInvoice.weavingJobWorkOrderId ??
          selectedInvoice.weavingWorkOrder?.id;
        resolvedOrderNo =
          selectedInvoice.weavingWorkOrderNo ||
          selectedInvoice.weavingOrderNo ||
          selectedInvoice.jobWorkOrderNo ||
          selectedInvoice.weavingJobWorkOrderNo ||
          resolveWeavingOrderNo(weavingOrderId) ||
          selectedInvoice.orderNo ||
          "";
      }

      setOrderNo(resolvedOrderNo);

      if (customer) {
        setBuyerName(customer.customerName || customer.name || "");
      } else if (isYarnSales && selectedInvoice.buyerName) {
        setBuyerName(selectedInvoice.buyerName);
      }

      let fabricItems: AvailableFabric[] = [];

      if (isYarnSales) {
        // For Yarn Sales, extract items from yarnIssueDetails
        if (Array.isArray(selectedInvoice.yarnIssueDetails)) {
          const uniqueYarns = new Map();
          selectedInvoice.yarnIssueDetails.forEach((detail: any) => {
            const yId = detail.yarnId || detail.itemId;
            if (yId && !uniqueYarns.has(yId)) {
              const yarnName = getYarnName(yId);
              uniqueYarns.set(yId, {
                id: yId,
                fabricCode: yarnName,
                fabricQuality: "",
                displayLabel: yarnName,
                yarnId: yId,
              });
            }
          });
          fabricItems = Array.from(uniqueYarns.values());
        }
      } else if (selectedInvoice.items?.length > 0) {
        fabricItems = selectedInvoice.items.map((item: any) => {
          const fmId = item.fabricMasterId || item.fabricId;
          let code = "";
          let quality = "";

          if (fmId && Array.isArray(fabricMasterList)) {
            const fm = fabricMasterList.find((f: any) => String(f.id) === String(fmId));
            if (fm) {
              code = fm.fabricCode || fm.code || "";
              quality = fm.fabricQuality || fm.quality || "";
            }
          }

          if (!code) {
            const productName = item.productName || "";
            const parts = productName.split(" - ");
            code = parts[0]?.trim() || "";
            quality = parts.slice(1).join(" - ").trim() || "";

            if (quality === code) {
              quality = "";
            } else if (quality.startsWith(`${code} - `)) {
              quality = quality.replace(`${code} - `, "");
            }
          }

          return {
            id: item.id,
            fabricCode: code,
            fabricQuality: quality,
            displayLabel: code && quality && quality !== "-" ? `${code} - ${quality}` : (code || item.productName || "Unknown Fabric"),
            yarnId: item.yarnId || item.itemId,
            fabricMasterId: fmId,
          };
        });
      } else if (salesOrder?.items?.length > 0) {
        fabricItems = salesOrder.items.map((item: any) => {
          const fmId = item.fabricMasterId || item.fabricId;
          let code = item.fabricCode || item.code || "";
          let quality = item.fabricQuality || item.quality || "";

          if (fmId && Array.isArray(fabricMasterList)) {
            const fm = fabricMasterList.find((f: any) => String(f.id) === String(fmId));
            if (fm) {
              code = fm.fabricCode || fm.code || code;
              quality = fm.fabricQuality || fm.quality || quality;
            }
          }

          return {
            id: item.id,
            fabricCode: code,
            fabricQuality: quality,
            displayLabel: (!quality || quality === code || quality === "-") ? code : `${code} - ${quality}`,
            yarnId: item.yarnId || item.itemId,
            fabricMasterId: fmId,
          };
        });
      }

      setAvailableFabrics(fabricItems);

      // Autofetch sizing/beam details
      const typeId = selectedInvoice.invoiceTypeId || (selectedInvoice.invoiceType && typeof selectedInvoice.invoiceType === 'object' ? selectedInvoice.invoiceType.id : selectedInvoice.invoiceType);
      const isSizing = String(typeId) === "204" || (typeof selectedInvoice.invoiceType === 'string' && normalizeCodeValue(selectedInvoice.invoiceType) === 'SIZING SALES');
      const isBeamType = (typeof selectedInvoice.invoiceType === 'string' && isBeamTypeLabel(selectedInvoice.invoiceType)) ||
        String(typeId) === "206" ||
        invoiceTypeOptions.some(opt => String(opt.id) === String(typeId) && isBeamTypeLabel(opt.code || opt.value));

      if (isSizing && Array.isArray(selectedInvoice.sizingSalesItems)) {
        if (selectedInvoice.sizingSalesItems.length > 0) {
          setSizingBeamOutwardNo(selectedInvoice.sizingSalesItems[0].beamOutwardNo || "");
        }
      }

      if ((isSizing || isBeamType) && fabricItems.length === 0) {
        const uniqueFabrics = new Map();
        const qDetails = selectedInvoice.sizingSalesItems || selectedInvoice.beamInwardQualityDetails || selectedInvoice.qualityDetails || [];
        const bDetails = selectedInvoice.beamInwardBeamDetails || selectedInvoice.beamDetails || [];

        [...qDetails, ...bDetails].forEach((item: any) => {
          const fmId = item.fabricMasterId || item.fabricId;
          let code = item.fabricCode || item.code || item.quality || "";
          let quality = item.fabricQuality || item.qualityName || "";

          if (fmId && Array.isArray(fabricMasterList)) {
            const fm = fabricMasterList.find((f: any) => String(f.id) === String(fmId));
            if (fm) {
              code = fm.fabricCode || fm.code || code;
              quality = fm.fabricQuality || fm.quality || quality;
            }
          }

          if (code && !uniqueFabrics.has(code)) {
            uniqueFabrics.set(code, {
              id: item.id,
              fabricCode: code,
              fabricQuality: quality,
              displayLabel: (!quality || quality === code || quality === "-") ? code : `${code} - ${quality}`,
              yarnId: item.yarnId || item.itemId,
              fabricMasterId: fmId,
            });
          }
        });

        if (uniqueFabrics.size > 0) {
          fabricItems = Array.from(uniqueFabrics.values());
          setAvailableFabrics(fabricItems);
          if (fabricItems.length === 1) {
            setFabricCode(fabricItems[0].fabricCode);
            setFabricQuality(fabricItems[0].fabricQuality);
          }
        }
      }

      if (isBeamType) {
        const wId = selectedInvoice.weavingVendorId || selectedInvoice.weaverId;
        if (wId) {
          const v = vendors.find((vend: any) => String(vend.id) === String(wId));
          const name = v?.vendorName || v?.name || v?.companyName || selectedInvoice.weavingVendorName || selectedInvoice.weaverName || "";
          if (name) setWeaverName(name);
          setWeaverId(Number(wId));
        }
      }

      // Fetch packing lists for the selected invoice
      if (selected.invoiceNo) {
        const packingParams: any = {
          invoiceNo: selected.invoiceNo,
          companyId: companyId ?? undefined
        };

        if (selected.salesOrderId) {
          packingParams.salesOrderId = selected.salesOrderId;
        }

        const weavingId =
          selectedInvoice.weavingWorkOrderId ??
          selectedInvoice.weavingJobWorkOrderId ??
          selectedInvoice.weavingWorkOrder?.id;

        if (weavingId) {
          packingParams.weavingWorkOrderId = weavingId;
        }

        dispatch(getAllGeneratePacking(packingParams)).unwrap().then((data: any) => {
          if (invoiceIdRef.current !== currentInvoiceId) return;
          const options = hydratePackingOptions(data, selected.invoiceNo, selected.salesOrderId ? Number(selected.salesOrderId) : null, weavingId ? Number(weavingId) : null, currentInvoiceId);
          setPackingListOptions(options);
          if (options.length === 1) {
            setPackingSlipNo(options[0].packingSlipNo);
          } else {
            // For invoiceType 205 (YARN SALES), set packingListNo to invoiceNo when no packing options available
            if (invoiceType === "205" || normalizeCodeValue(invoiceType) === "YARN SALES") {
              setPackingSlipNo(selected.invoiceNo);
            } else {
              setPackingSlipNo("");
            }
          }
        }).catch((err: any) => {
          if (invoiceIdRef.current !== currentInvoiceId) return;
          console.error("Failed to fetch packing lists:", err);
          setPackingListOptions([]);
          // For invoiceType 205 (YARN SALES), set packingListNo to invoiceNo even on error
          if (invoiceType === "205" || normalizeCodeValue(invoiceType) === "YARN SALES") {
            setPackingSlipNo(selected.invoiceNo);
          } else {
            setPackingSlipNo("");
          }
        });
      }

      if (fabricItems.length === 1) {
        setFabricCode(fabricItems[0].fabricCode);
        setFabricQuality(fabricItems[0].fabricQuality);
      } else {
        setFabricCode("");
        setFabricQuality("");
      }
    }
  };

  const handleFabricCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setFabricCode(code);

    const selected = availableFabrics.find((f) => f.fabricCode === code);
    if (selected) {
      setFabricQuality(selected.fabricQuality);

      // Fetch shrinkage from FabricMaster
      if (Array.isArray(fabricMasterList)) {
        const fm = fabricMasterList.find(f =>
          (f.fabricCode || f.code) === code &&
          (f.fabricQuality || f.quality || "") === (selected.fabricQuality || "")
        );
        if (fm) {
          const shrinkageVal = Number(fm.shrinkage || 0);
          setFetchedShrinkage(shrinkageVal);
        } else {
          setFetchedShrinkage(0);
        }
      }
    } else {
      setFetchedShrinkage(0);
    }
  };

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setWarehouseId(null);
      setWarehouseName("");
      return;
    }

    const selected = warehouses.find(
      (w: any) => String(w.id) === String(selectedId)
    );

    if (selected) {
      setWarehouseId(Number(selected.id));
      setWarehouseName(selected.warehouseName || selected.name || "");
    } else {
      setWarehouseId(null);
      setWarehouseName("");
    }
  };

  const handleOpenFabricModal = async () => {
    if (!invoiceNo && !isBeam) {
      toast.error("Please select an invoice first");
      return;
    }

    if (!fabricCode && !isBeam) {
      toast.error("Please select a fabric code first");
      return;
    }

    try {
      if (isSizingSales) {
        const selectedInvoice = invoices.find((inv: any) => String(inv.id) === String(invoiceId));
        const sizingSalesItem = Array.isArray(selectedInvoice?.sizingSalesItems)
          ? selectedInvoice.sizingSalesItems.find((item: any) => item.beamOutwardNo === sizingBeamOutwardNo)
          : null;

        // Try to find the sizing beam record from the list using sizingBeamOutwardNo
        const sizingOutward = normalizeResponseArray(sizingBeamOutwardList).find(
          (bo: any) => bo.sizingBeamOutwardNo === sizingBeamOutwardNo
        );

        if (sizingOutward && Array.isArray(sizingOutward.beamDetails)) {
          const sizingBeams: SelectedFabric[] = sizingOutward.beamDetails.map((item: any) => {
            const beamMeters = Number(item.beamMeters || 0);
            const shrinkage = Number(item.shrinkage || 0);
            const fabricPanelWidth = Number(item.fabricPanelWidth || 0);

            return {
              id: item.id,
              rollNo: String(item.sizedBeamNo || ""),
              pieceNo: "1",
              meter: beamMeters,
              netWeight: Number(item.netWeight || sizingSalesItem?.netWeight || 0),
              beamOutwardNo: sizingBeamOutwardNo,
              beamOutwardId: item.beamOutwardId || item.beam_outward_id || item.id || 0,
              beamInwardId: item.beamInwardId || 0,
              sizedBeamNo: item.sizedBeamNo,
              beamMeters: beamMeters,
              originalBeamMeters: beamMeters,
              fabricCode: sizingOutward.yarnName,
              buyerName: buyerName,
              shrinkage: shrinkage,
              width: item.width,
              totalEnds: item.totalEnds,
              expectedFabricMeter: calculateExpectedFabricMeter(beamMeters, shrinkage, fabricPanelWidth, item.width),
              flangeNo: item.flangeNo
            };
          });
          setAvailableFabricRolls(sizingBeams);

          const alreadySelectedIds = selectedFabricRolls
            .map(r => r.id)
            .filter((id): id is number => id !== undefined);
          setTempSelectedRolls(alreadySelectedIds);
          setShowFabricModal(true);
          return;
        }
        // Fallback to previous logic if not found in sizingBeamOutwardList
        if (selectedInvoice && Array.isArray(selectedInvoice.sizingSalesItems)) {
          const sizingBeams: SelectedFabric[] = selectedInvoice.sizingSalesItems.map((item: any) => ({
            id: item.id,
            rollNo: String(item.beamOutwardNo || ""),
            pieceNo: "1",
            meter: Number(item.beamMeters || 0),
            netWeight: Number(item.netWeight || 0),
            beamOutwardNo: item.beamOutwardNo,
            beamOutwardId: item.beamOutwardId || item.beam_outward_id || item.id || 0,
            beamInwardId: item.beamInwardId || 0,
            sizedBeamNo: item.beamOutwardNo,
            beamMeters: Number(item.beamMeters || 0),
            originalBeamMeters: Number(item.beamMeters || 0),
            fabricCode: item.yarnName,
            buyerName: buyerName,
            shrinkage: 0,
            width: item.width || 0,
            expectedFabricMeter: calculateExpectedFabricMeter(Number(item.beamMeters || 0), 0, 0, item.width || 0)
          }));
          setAvailableFabricRolls(sizingBeams);

          const alreadySelectedIds = selectedFabricRolls
            .map(r => r.id)
            .filter((id): id is number => id !== undefined);
          setTempSelectedRolls(alreadySelectedIds);
          setShowFabricModal(true);
          return;
        }
      }

      if (isBeam) {
        if (!weaverName || !fabricCode || !weavingContractNo) {
          toast.error("Please select Weaver, Fabric and Contract first");
          return;
        }

        // Filter from all beam outwards based on form selection
        const normalizedWeaver = weaverName?.trim().toUpperCase() || "";
        const normalizedFabric = fabricCode?.trim().toUpperCase() || "";
        const normalizedContract = weavingContractNo?.trim().toUpperCase() || "";

        const beams: SelectedFabric[] = [];

        beamOutwardsAll.forEach((bo: any) => {
          const details = Array.isArray(bo.outwardDetails) ? bo.outwardDetails : [bo];

          details.forEach((detail: any) => {
            // 1. Match Weaver
            const vId = detail.weavingVendorId || detail.weaverId || bo.weavingVendorId || bo.weaverId || detail.weaving_vendor_id || detail.weaver_id || bo.weaving_vendor_id || bo.weaver_id;
            const v = vendors.find((vend: any) => String(vend.id) === String(vId));
            const bWeaverName = (v?.vendorName || v?.name || v?.companyName || detail.weavingVendorName || detail.weaverName || bo.weavingVendorName || bo.weaverName || "").trim().toUpperCase();
            if (bWeaverName !== normalizedWeaver) return;

            // 2. Match Fabric Code
            const relatedBI = beamInwards.find((bi: any) =>
              String(bi.id) === String(detail.beamInwardId || bo.beamInwardId) ||
              (bi.beamInwardNo && bi.beamInwardNo === (detail.beamInwardNo || bo.beamInwardNo))
            );
            let bHasFabric = false;
            if (relatedBI) {
              bHasFabric = (relatedBI.beamInwardQualityDetails || []).some((q: any) => (q.fabricCode || q.quality || "").trim().toUpperCase() === normalizedFabric) ||
                (relatedBI.beamInwardBeamDetails || []).some((d: any) => (d.fabricCode || d.quality || "").trim().toUpperCase() === normalizedFabric);
            }
            if (!bHasFabric) {
              bHasFabric = ((detail.fabricCode || bo.fabricCode || "").trim().toUpperCase() === normalizedFabric) ||
                ((detail.quality || bo.quality || "").trim().toUpperCase() === normalizedFabric);
            }
            if (!bHasFabric) return;

            // 3. Match Weaver Contract Number
            const cId = detail.weavingContractId || detail.weaving_contract_id || detail.weavingWorkOrderId || detail.weaving_work_order_id ||
              bo.weavingContractId || bo.weaving_contract_id || bo.weavingWorkOrderId || bo.weaving_work_order_id;
            const contract = weavingContracts.find((c: any) => String(c.id) === String(cId)) ||
              weavingJobWorkOrders.find((o: any) => String(o.id) === String(cId));
            const bContractNo = (contract ? getWeavingOrderLabel(contract) : (detail.weavingContractNo || detail.weavingWorkOrderNo || detail.contractNo || detail.orderNo || bo.weavingContractNo || bo.weavingWorkOrderNo || bo.contractNo || bo.orderNo || "")).trim().toUpperCase();

            if (bContractNo !== normalizedContract) return;

            const isFactoryInwardVal = detail.isFactoryInward ?? detail.is_factory_inward ?? bo.isFactoryInward ?? bo.is_factory_inward ?? 0;
            if (Number(isFactoryInwardVal) === 1) return;

            // 4. Check if beam is already returned (isReturn = 1)
            const isAlreadyReturned = (salesReturnList || []).some((returnItem: any) => {
              if (!returnItem.beamItems || !Array.isArray(returnItem.beamItems)) return false;

              return returnItem.beamItems.some((beam: any) => {
                const beamOutwardMatch = beam.beamOutwardNo === (detail.outwardNo || detail.beamOutwardNo || bo.outwardNo || bo.beamOutwardNo);
                const sizedBeamMatch = beam.sizedBeamNo === (detail.sizedBeamNo || detail.beamNo || bo.sizedBeamNo || bo.beamNo);
                return (beamOutwardMatch || sizedBeamMatch) && Number(beam.isReturn || 0) === 1;
              });
            });

            const beamIsReturned = Number(detail.isReturn || detail.is_return || bo.isReturn || bo.is_return || 0) === 1;
            if (isAlreadyReturned || beamIsReturned) return;

            // Map to SelectedFabric
            const cIdMapped = detail.weavingContractId || detail.weaving_contract_id || detail.weavingWorkOrderId || detail.weaving_work_order_id || bo.weavingContractId || bo.weaving_contract_id;
            const contractMapped = weavingContracts.find((c: any) => String(c.id) === String(cIdMapped)) ||
              weavingJobWorkOrders.find((o: any) => String(o.id) === String(cIdMapped));

            const beamMeters = Number(detail.wrapMeters || detail.totalBeamMeters || detail.beamMeters || bo.wrapMeters || bo.totalBeamMeters || bo.beamMeters || 0);
            const shrinkage = Number(detail.shrinkage || bo.shrinkage || 0);
            const fabricPanelWidth = Number(detail.fabricPanelWidth || bo.fabricPanelWidth || 0);
            const width = detail.width || bo.width || detail.fabricWidth || bo.fabricWidth || 0;

            // Find matching inward detail to get inwardTypeId
            const targetBeamNo = String(detail.sizedBeamNo || detail.beamNo || bo.sizedBeamNo || bo.beamNo || "").trim().toUpperCase();
            const matchedInwardDetail = relatedBI?.beamInwardBeamDetails?.find((d: any) => {
              const dBeamNo = String(d.sizedBeamNo || d.beamNo || "").trim().toUpperCase();
              const normDBeamNo = dBeamNo.endsWith("-R") ? dBeamNo.substring(0, dBeamNo.length - 2) : dBeamNo;
              const normTargetBeamNo = targetBeamNo.endsWith("-R") ? targetBeamNo.substring(0, targetBeamNo.length - 2) : targetBeamNo;
              return normDBeamNo === normTargetBeamNo;
            });
            const inwardTypeId = matchedInwardDetail?.inwardTypeId || null;

            beams.push({
              id: detail.id || bo.id,
              rollNo: String(detail.sizedBeamNo || detail.beamNo || bo.sizedBeamNo || bo.beamNo || ""),
              pieceNo: "1",
              meter: beamMeters,
              netWeight: beamMeters,
              warehouseId: detail.warehouseId || bo.warehouseId,
              availableQty: beamMeters,
              issueQty: beamMeters,
              beamOutwardNo: detail.outwardNo || detail.beamOutwardNo || bo.outwardNo || bo.beamOutwardNo || "",
              beamOutwardId: detail.beamOutwardId || bo.id || 0,
              beamInwardId: detail.beamInwardId || bo.beamInwardId || 0,
              outwardDate: detail.outwardDate || bo.outwardDate || detail.date || bo.date || "",
              weavingContractNo: contractMapped ? getWeavingOrderLabel(contractMapped) : (detail.weavingContractNo || bo.weavingContractNo || ""),
              weaverName: weaverName,
              sizingPlanNo: detail.sizingPlanNo || bo.sizingPlanNo || (sizingPlans.find((p: any) => String(p.id) === String(detail.sizingPlanId || bo.sizingPlanId))?.sizingPlanNo) || sizingPlanNo,
              salesOrderNo: detail.salesOrderNo || bo.salesOrderNo || "",
              flangeNo: detail.flangeNo || bo.flangeNo || "",
              sizedBeamNo: detail.sizedBeamNo || detail.beamNo || bo.sizedBeamNo || bo.beamNo || "",
              beamMeters: beamMeters,
              originalBeamMeters: beamMeters,
              expectedFabricMeter: calculateExpectedFabricMeter(beamMeters, shrinkage, fabricPanelWidth, width),
              weaverId: vId || 0,
              totalBeams: bo.totalNoOfBeams || bo.noOfBeams || 1,
              buyerName: buyerName,
              fabricCode: fabricCode,
              fabricPanelWidth: fabricPanelWidth || "",
              shrinkage: shrinkage,
              width: width || "",
              inwardTypeId: inwardTypeId
            });
          });
        });

        if (beams.length === 0) {
          toast.info("No outwarded beams found for this selection or all beams have already been returned");
        }

        setAvailableFabricRolls(beams);

        const alreadySelectedIds = selectedFabricRolls
          .map(r => r.id)
          .filter((id): id is number => id !== undefined);
        setTempSelectedRolls(alreadySelectedIds);
      }

      else if (isYarnSales) {
        const selectedFabric = availableFabrics.find(f => f.fabricCode === fabricCode);
        const yarnId = selectedFabric?.yarnId;

        // Find yarn challan for the current order/invoice
        const challan = yarnChallans.find(
          (c: any) => (Number(c.id) === Number(invoiceId) || Number(c.yarnSalesOrderId) === Number(orderId))
        )


        if (challan && Array.isArray(challan.yarnIssueDetails)) {
          const yarnRolls: SelectedFabric[] = challan.yarnIssueDetails
            .filter((detail: any) => !yarnId || Number(detail.yarnId) === Number(yarnId))
            .map((detail: any) => ({
              id: detail.id,
              rollNo: detail.lotNumber || "N/A",
              pieceNo: String(detail.availableBags || 0),
              meter: Number(detail.availableQty || 0),
              netWeight: Number(detail.availableQty || 0),
              yarnId: detail.yarnId,
              millId: resolveMillIdFromRecord(detail) || resolveMillIdByName(detail.millName, subCategories) || resolveMillIdFromYarnSalesOrder(detail.yarnId, challan.yarnSalesOrderId || orderId, yarnSalesOrders),
              millName: detail.millName || "",
              warehouseId: detail.warehouseId,
              lotNumber: detail.lotNumber,
              availableBags: detail.availableBags,
              availableQty: detail.availableQty,
              issueQty: detail.issueQty,
              buyerName: buyerName,
              fabricCode: fabricCode,
              shrinkage: fetchedShrinkage
            }));
          setAvailableFabricRolls(yarnRolls);

          // Pre-select already selected items in the modal
          const alreadySelectedIds = selectedFabricRolls
            .map(r => r.id)
            .filter((id): id is number => id !== undefined);
          setTempSelectedRolls(alreadySelectedIds);
        } else {
          // Fallback to API if not found in list or no details
          const companyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
          let url = `/sizing-yarn-issues/yarn-inward-stock`;
          const params = [];
          if (yarnId) params.push(`itemId=${yarnId}`);
          if (companyId) params.push(`companyId=${companyId}`);
          if (params.length > 0) url += `?${params.join('&')}`;

          const response = await apiService.get(url);
          const yarnRolls: SelectedFabric[] = (Array.isArray(response) ? response : []).map((stock: any) => ({
            id: stock.orderItemId,
            rollNo: stock.lotNo || "N/A",
            pieceNo: String(stock.availableBags || 0),
            meter: Number(stock.availableQty || 0),
            netWeight: Number(stock.availableQty || 0),
            yarnId: stock.yarnId || yarnId,
            millId: resolveMillIdFromRecord(stock) || resolveMillIdByName(stock.millName || stock.mill_name, subCategories) || resolveMillIdFromYarnSalesOrder(stock.yarnId || stock.itemId, orderId, yarnSalesOrders),
            millName: stock.millName || stock.mill_name || "",
            warehouseId: stock.warehouseId,
            lotNumber: stock.lotNo,
            availableBags: stock.availableBags,
            availableQty: stock.availableQty,
            issueQty: 0,
            buyerName: buyerName,
            fabricCode: fabricCode,
            shrinkage: fetchedShrinkage
          }));
          setAvailableFabricRolls(yarnRolls);

          // Pre-select already selected items in the modal
          const alreadySelectedIds = selectedFabricRolls
            .map(r => r.id)
            .filter((id): id is number => id !== undefined);
          setTempSelectedRolls(alreadySelectedIds);
        }
      }
      //     else {
      //       let fabricRolls: SelectedFabric[] = [];

      //       const orderFilters = [orderId, weavingOrderId]
      //         .filter((value): value is number => value !== null && value !== undefined)
      //         .map((value) => String(value));

      //       if (generatePackingData.length > 0) {
      //         const filteredPackings = generatePackingData.filter((packing) => {
      //           if (!packing) return false;
      //           const identifier = getPackingIdentifier(packing);
      //           if (!identifier) return false;
      //           if (packingSlipNo && identifier !== packingSlipNo) return false;
      //           if (warehouseId && packing.warehouseId && Number(packing.warehouseId) !== Number(warehouseId)) return false;

      //           if (orderFilters.length > 0) {
      //             const packingOrderIds = [
      //               packing.salesOrderId,
      //               packing.orderId,
      //               packing.weavingWorkOrderId,
      //               packing.weavingJobWorkOrderId,
      //             ]
      //               .filter((id) => id !== null && id !== undefined)
      //               .map((id) => String(id));
      //             if (!packingOrderIds.some((id) => orderFilters.includes(id))) {
      //               return false;
      //             }
      //           }

      //           return true;
      //         });

      //         fabricRolls = filteredPackings.flatMap((packing) => {
      //           const items = Array.isArray(packing.items) ? packing.items : [];
      //           return items
      //             .filter((item: any) => Number(item.isInvoice) === 1 || item.isInvoice === true)
      //             .filter((item: any) => {
      //               const itemId = item.id || item.generatedPackingId;
      //               return (
      //                 itemId &&
      //                 !selectedFabricRolls.some((selected) => selected.id === itemId)
      //               );
      //             })
      //             .map((item: any) => ({
      //               id: item.id || item.generatedPackingId,
      //               rollNo: item.rollNo || item.lotId || "",
      //               pieceNo: item.pieceNo || item.pieceNumber || "",
      //               meter: Number(item.length ?? item.yards ?? 0),
      //               netWeight: Number(item.pounds ?? item.grossWt ?? item.grossWeight ??  0),
      //               packingListNo: getPackingIdentifier(packing) || packingSlipNo,
      //               warehouseId: packing.warehouseId,
      //               buyerName: buyerName,
      //               fabricCode: fabricCode
      //             }));
      //         });
      //       }

      //       if (fabricRolls.length === 0) {
      //         const result = await dispatch(getAllFactoryPieceEntries({ companyId: companyId ?? undefined })).unwrap();
      //         const allPieceEntries = normalizeResponseArray(result);

      //         const selectedFabric = availableFabrics.find(f => f.fabricCode === fabricCode);

      //         fabricRolls = allPieceEntries
      //           .filter((entry: any) => 
      //             (entry.isInspected === 1 || entry.inspectionStatus === "COMPLETED") &&
      //             entry.isPacked === 1 &&
      //             (
      //               (entry.invoiceNo && entry.invoiceNo === invoiceNo) || 
      //               (entry.invoiceId && entry.invoiceId === invoiceId) || 
      //               (entry.orderNo && entry.orderNo === orderNo) ||
      //               (entry.salesOrderNo && entry.salesOrderNo === orderNo) ||
      //               (orderId && (
      //                  (entry.salesOrderId && String(entry.salesOrderId) === String(orderId)) ||
      //                  (entry.orderId && String(entry.orderId) === String(orderId))
      //               )) ||
      //               (weavingOrderId && (
      //                  (entry.weavingWorkOrderId && String(entry.weavingWorkOrderId) === String(weavingOrderId)) ||
      //                  (entry.weavingJobWorkOrderId && String(entry.weavingJobWorkOrderId) === String(weavingOrderId))
      //               ))
      //             ) &&
      //             // Filter by item name (fabric)
      //             (
      //               !fabricCode || 
      //               (entry.fabricCode && entry.fabricCode === fabricCode) || 
      //               (entry.itemName && entry.itemName === fabricCode) ||
      //               (selectedFabric?.fabricMasterId && Number(entry.fabricMasterId) === Number(selectedFabric.fabricMasterId))
      //             ) &&
      //             (!warehouseId || Number(entry.warehouseId) === Number(warehouseId)) &&
      //             (!packingSlipNo || entry.packingSlipNo === packingSlipNo || entry.packingListNo === packingSlipNo || entry.packingNo === packingSlipNo) &&
      //             !selectedFabricRolls.some((selected) => selected.id === entry.id)
      //           )
      //           .map((entry: any) => ({
      //             id: entry.id,
      //             rollNo: entry.rollNo || "",
      //             pieceNo: entry.pieceNumber || "",
      //             meter: entry.quantity || 0,
      //             netWeight: entry.weight || 0,
      //             packingListNo: getPackingIdentifier(entry),
      //           }));
      //       }

      //       setAvailableFabricRolls(fabricRolls);
      //     }
      //     setTempSelectedRolls([]);
      //     setShowFabricModal(true);
      //   } catch (error) {
      //     console.error("Failed to fetch items:", error);
      //     toast.error("Failed to fetch items");
      //   }
      // };

      else {
        let fabricRolls: SelectedFabric[] = [];

        const orderFilters = [orderId, weavingOrderId]
          .filter((value): value is number => value !== null && value !== undefined)
          .map((value) => String(value));

        // FIX: Apply packing slip filter to Generate Packing data
        if (generatePackingData.length > 0) {
          const filteredPackings = generatePackingData.filter((packing) => {
            if (!packing) return false;
            const identifier = getPackingIdentifier(packing);
            if (!identifier) return false;

            // ✅ FIX: Add packing slip filter here
            if (packingSlipNo && identifier !== packingSlipNo) return false;

            if (warehouseId && packing.warehouseId && Number(packing.warehouseId) !== Number(warehouseId)) return false;

            if (orderFilters.length > 0) {
              const packingOrderIds = [
                packing.salesOrderId,
                packing.orderId,
                packing.weavingWorkOrderId,
                packing.weavingJobWorkOrderId,
              ]
                .filter((id) => id !== null && id !== undefined)
                .map((id) => String(id));
              if (!packingOrderIds.some((id) => orderFilters.includes(id))) {
                return false;
              }
            }

            return true;
          });

          fabricRolls = filteredPackings.flatMap((packing) => {
            const items = Array.isArray(packing.items) ? packing.items : [];
            return items
              .filter((item: any) => {
                if (isWeavingJobwork) return true; // Be more lenient for jobwork
                return Number(item.isInvoice) === 1 || item.isInvoice === true;
              })
              .filter((item: any) => {
                // Match fabric code if available on packing or item
                if (!fabricCode) return true;
                const pFabric = String(packing.fabricCode || packing.fabric_code || "").trim().toUpperCase();
                const iFabric = String(item.fabricCode || item.fabric_code || item.itemName || item.item_name || "").trim().toUpperCase();
                const selectedFabric = String(fabricCode).trim().toUpperCase();
                return pFabric === selectedFabric || iFabric === selectedFabric || pFabric.includes(selectedFabric) || iFabric.includes(selectedFabric);
              })
              .filter((item: any) => {
                const itemId = item.id || item.generatedPackingId;
                return (
                  itemId &&
                  !selectedFabricRolls.some((selected) => selected.id === itemId)
                );
              })
              .map((item: any) => ({
                id: item.id || item.generatedPackingId,
                rollNo: item.rollNo || item.lotId || "",
                pieceNo: item.pieceNo || item.pieceNumber || "",
                meter: Number(item.length ?? item.yards ?? 0),
                netWeight: Number(item.pounds ?? item.grossWt ?? item.grossWeight ?? 0),
                packingListNo: getPackingIdentifier(packing) || packingSlipNo,
                warehouseId: packing.warehouseId,
                buyerName: buyerName,
                fabricCode: fabricCode
              }));
          });
        }

        // Fallback to Factory Piece Entries if no Generate Packing data found
        if (fabricRolls.length === 0) {
          const result = await dispatch(getAllFactoryPieceEntries({ companyId: companyId ?? undefined })).unwrap();
          const allPieceEntries = normalizeResponseArray(result);

          const selectedFabric = availableFabrics.find(f => f.fabricCode === fabricCode);

          fabricRolls = allPieceEntries
            .filter((entry: any) =>
              (entry.isInspected === 1 || entry.inspectionStatus === "COMPLETED") &&
              entry.isPacked === 1 &&
              (
                (entry.invoiceNo && entry.invoiceNo === invoiceNo) ||
                (entry.invoiceId && entry.invoiceId === invoiceId) ||
                (entry.orderNo && entry.orderNo === orderNo) ||
                (entry.salesOrderNo && entry.salesOrderNo === orderNo) ||
                (orderId && (
                  (entry.salesOrderId && String(entry.salesOrderId) === String(orderId)) ||
                  (entry.orderId && String(entry.orderId) === String(orderId))
                )) ||
                (weavingOrderId && (
                  (entry.weavingWorkOrderId && String(entry.weavingWorkOrderId) === String(weavingOrderId)) ||
                  (entry.weavingJobWorkOrderId && String(entry.weavingJobWorkOrderId) === String(weavingOrderId)) ||
                  (entry.orderId && String(entry.orderId) === String(weavingOrderId)) ||
                  (entry.orderNo && String(entry.orderNo) === String(resolveWeavingOrderNo(weavingOrderId)))
                ))
              ) &&
              (
                !fabricCode ||
                (entry.fabricCode && entry.fabricCode === fabricCode) ||
                (entry.itemName && entry.itemName === fabricCode) ||
                (selectedFabric?.fabricMasterId && Number(entry.fabricMasterId) === Number(selectedFabric.fabricMasterId))
              ) &&
              (!warehouseId || Number(entry.warehouseId) === Number(warehouseId)) &&
              // ✅ This filter already exists for factory piece entries
              (!packingSlipNo || entry.packingSlipNo === packingSlipNo || entry.packingListNo === packingSlipNo || entry.packingNo === packingSlipNo) &&
              !selectedFabricRolls.some((selected) => selected.id === entry.id)
            )
            .map((entry: any) => ({
              id: entry.id,
              rollNo: entry.rollNo || "",
              pieceNo: entry.pieceNumber || "",
              meter: entry.quantity || 0,
              netWeight: entry.weight || 0,
              packingListNo: getPackingIdentifier(entry),
            }));
        }

        setAvailableFabricRolls(fabricRolls);
      }

      setTempSelectedRolls([]);
      setShowFabricModal(true);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast.error("Failed to fetch items");
    }
  };

  const handleRollCheckbox = (rollId: number) => {
    setTempSelectedRolls((prev) =>
      prev.includes(rollId) ? prev.filter((id) => id !== rollId) : [...prev, rollId]
    );
  };

  const handleSubmitFabricRolls = () => {
    try {
      const newSelectedRolls = availableFabricRolls
        .filter((roll) => tempSelectedRolls.includes(roll.id || 0))
        .map((roll) => ({
          id: roll.id,
          rollNo: roll.rollNo,
          pieceNo: roll.pieceNo,
          meter: roll.meter,
          netWeight: roll.netWeight,
          yarnId: roll.yarnId,
          millId: roll.millId,
          millName: roll.millName,
          warehouseId: roll.warehouseId,
          lotNumber: roll.lotNumber,
          availableBags: roll.availableBags,
          availableQty: roll.availableQty,
          issueQty: roll.issueQty,
          packingListNo: roll.packingListNo,
          // Preserve beam fields
          beamOutwardNo: roll.beamOutwardNo,
          beamOutwardId: roll.beamOutwardId,
          beamInwardId: roll.beamInwardId,
          outwardDate: roll.outwardDate,
          weavingContractNo: roll.weavingContractNo,
          weaverName: roll.weaverName,
          sizingPlanNo: roll.sizingPlanNo,
          salesOrderNo: roll.salesOrderNo,
          flangeNo: roll.flangeNo,
          sizedBeamNo: roll.sizedBeamNo,
          beamMeters: roll.beamMeters,
          originalBeamMeters: roll.originalBeamMeters,
          expectedFabricMeter: roll.expectedFabricMeter,
          weaverId: roll.weaverId,
          totalBeams: roll.totalBeams,
          buyerName: roll.buyerName,
          fabricCode: roll.fabricCode,
          fabricPanelWidth: roll.fabricPanelWidth,
          shrinkage: roll.shrinkage,
          width: roll.width,
          totalEnds: roll.totalEnds
        }));

      setSelectedFabricRolls((prev) => {
        // Filter out items that are already in the new selection to avoid duplicates
        // Use more robust comparison than just ID as IDs can come from different source tables
        const filteredPrev = prev.filter(p => !newSelectedRolls.some(n => {
          if (isBeam || isSizingSales) {
            return (n.sizedBeamNo && p.rollNo && String(n.sizedBeamNo) === String(p.rollNo)) ||
              (n.beamOutwardNo && p.beamOutwardNo && String(n.beamOutwardNo) === String(p.beamOutwardNo));
          } else if (isYarnSales) {
            return n.yarnId === p.yarnId && n.lotNumber === p.lotNumber;
          } else {
            return n.rollNo === p.rollNo && n.pieceNo === p.pieceNo && n.packingListNo === p.packingListNo;
          }
        }));
        const updated = [...filteredPrev, ...newSelectedRolls];

        // Safety net for Beam Mode: ensure invoiceNo is set if we have items
        if ((isBeam || isSizingSales) && updated.length > 0 && !invoiceNo) {
          const firstRoll = updated[0];
          // Try to find the beam inward no for this beam outward from the source data
          const bo = beamOutwardsAll.find(b => String(b.id) === String(firstRoll.id));
          if (bo) {
            const bNo = bo.beamInwardNo || bo.beam_inward_no || bo.invoiceNo || bo.invoice_no;
            if (bNo) {
              setInvoiceNo(bNo);
              setBeamInwardNo(bNo);
              setInvoiceId(bo.beamInwardId || bo.beam_inward_id);
            }
          }
        }

        return updated;
      });

      setIsInEditMode(true);
      setIsSummaryVisible(false);

      // Close the modal after submitting
      setShowFabricModal(false);

      toast.success(`${newSelectedRolls.length} item(s) added successfully`);
    } catch (error) {
      console.error("Error submitting fabric rolls:", error);
      toast.error("Failed to add items");
    } finally {
      // Always close the modal
      setShowFabricModal(false);
    }
  };

  const handleRemoveRoll = (index: number) => {
    setSelectedFabricRolls((prev) => prev.filter((_, i) => i !== index));
    setIsInEditMode(true);
    setIsSummaryVisible(false);
  };
  const calculateExpectedFabricMeter = (beamMeters: number, shrinkage: number, fabricPanelWidth: number, width: number | string): number => {
    if (!beamMeters || beamMeters <= 0) return 0;

    const beamMtr = Number(beamMeters) || 0;
    const shrink = Number(shrinkage) || 0;
    const panelWidth = Number(fabricPanelWidth) || 0;
    const w = Number(width) || 1; // Default to 1 to avoid division by zero

    // expected fabric mt = beam meter - ((beam meter * (shrinkage/100)) * (fabricPanelWidth / width))
    const expected = beamMtr - ((beamMtr * (shrink / 100)) * (panelWidth / w));

    // Return with 2 decimal places
    return Number(expected.toFixed(2));
  };
  const handleUpdateRoll = (index: number, field: keyof SelectedFabric, value: any) => {
    setSelectedFabricRolls((prev) => {
      const updated = [...prev];
      const existingRoll = updated[index];

      // Validation for Beam mode: beamMeters cannot exceed originalBeamMeters
      if ((isBeam || isSizingSales) && field === "beamMeters") {
        const newValue = Number(value || 0);
        const maxValue = Number(existingRoll.originalBeamMeters || 0);
        if (newValue > maxValue) {
          toast.error(`Beam Meter cannot be greater than the original value (${maxValue})`);
          return prev;
        }
      }

      const roll = { ...existingRoll, [field]: value };

      // Auto-calculate expectedFabricMeter for Beam mode when relevant fields change
      if ((isBeam || isSizingSales)) {
        // Trigger calculation on changes to beamMeters, shrinkage, or fabricPanelWidth or width
        if (field === "beamMeters" || field === "shrinkage" || field === "fabricPanelWidth" || field === "width") {
          const beamMeters = Number(roll.beamMeters || 0);
          const shrinkage = Number(roll.shrinkage || 0);
          const fabricPanelWidth = Number(roll.fabricPanelWidth || 0);
          const width = roll.width || 0;

          // Calculate expected fabric meter
          roll.expectedFabricMeter = calculateExpectedFabricMeter(beamMeters, shrinkage, fabricPanelWidth, width);
        }
      }

      updated[index] = roll;
      return updated;
    });
    setIsInEditMode(true);
    setIsSummaryVisible(false);
  };

  const getPiecesCountForRoll = (roll: any): number => {
    const raw = roll?.pieceNo;
    if (raw == null) return 0;

    if (typeof raw === "number") {
      return Number.isFinite(raw) && raw > 0 ? raw : 0;
    }

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) return 0;
      if (trimmed.includes(",")) {
        return trimmed
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean).length;
      }
      const asNum = Number(trimmed);
      if (!Number.isNaN(asNum) && asNum > 0) {
        return asNum;
      }
      return 1;
    }

    return 0;
  };

  const summary = useMemo(() => {
    const rollsToUse = isInEditMode ? selectedFabricRolls : savedFabricRolls;

    if (rollsToUse.length === 0) {
      return {
        totalRolls: 0,
        totalPieces: 0,
        totalMeter: 0,
        totalNetWeight: 0,
      };
    }

    return {
      totalRolls: rollsToUse.length,
      // For fabric returns, Total Pieces = total number of piece numbers (Piece No's)
      totalPieces: rollsToUse.reduce((sum, r) => sum + getPiecesCountForRoll(r), 0),
      totalMeter: rollsToUse.reduce(
        (sum, r) =>
          sum +
          (isBeam || isSizingSales
            ? Number(r.beamMeters) || 0
            : Number(r.meter) || 0),
        0
      ),
      totalNetWeight: rollsToUse.reduce(
        (sum, r) => sum + (Number(r.netWeight) || 0),
        0
      ),
    };
  }, [selectedFabricRolls, savedFabricRolls, isInEditMode, isBeam, isSizingSales]);

  const rollColumns = useMemo<PopupColumn[]>(() => {
    const cols: PopupColumn[] = [
      {
        Header: (
          <Checkbox
            checked={
              tempSelectedRolls.length === availableFabricRolls.length &&
              availableFabricRolls.length > 0
            }
            onCheckedChange={(checked) => {
              if (checked) {
                setTempSelectedRolls(
                  availableFabricRolls.map((r) => r.id || 0)
                );
              } else {
                setTempSelectedRolls([]);
              }
            }}
          />
        ),
        id: 'selected',
        disableFilters: true,
        Cell: ({ row }) => (
          <Checkbox
            checked={tempSelectedRolls.includes(row.id || 0)}
            onCheckedChange={() => handleRollCheckbox(row.id || 0)}
          />
        ),
      },
      {
        Header: 'S.No',
        id: 'serialNo',
        disableFilters: true,
        Cell: ({ index }) => <span>{index + 1}</span>,
      },
    ];

    if (isBeam) {
      cols.push(
        { Header: 'Beam Outward No', accessor: 'beamOutwardNo', id: 'beamOutwardNo' },
        { Header: 'Outward Date', accessor: 'outwardDate', id: 'outwardDate' },
        { Header: 'Inward Type', accessor: (row: any) => getCodeValueById(row.inwardTypeId) || "", id: 'inwardType' },
        { Header: 'Weaving Contract No', accessor: 'weavingContractNo', id: 'weavingContractNo' },
        { Header: 'Empty Beam No', accessor: 'flangeNo', id: 'flangeNo' },
        { Header: 'Sized Beam No', accessor: 'sizedBeamNo', id: 'sizedBeamNo' },
        { Header: 'Fabric Panel Width', accessor: 'fabricPanelWidth', id: 'fabricPanelWidth' },
        { Header: 'Shrinkage %', accessor: 'shrinkage', id: 'shrinkage' },
        {
          Header: 'Beam Meters',
          accessor: (row: any) => row.beamMeters?.toFixed(2),
          id: 'beamMeters',
        },
        {
          Header: 'Expected Fabric Meter',
          accessor: (row: any) => row.expectedFabricMeter?.toFixed(2),
          id: 'expectedFabricMeter',
        }
      );
    } else if (isSizingSales) {
      cols.push(
        { Header: 'Sized Beam No', accessor: 'sizedBeamNo', id: 'sizedBeamNo' },
        { Header: 'Empty Beam No', accessor: 'flangeNo', id: 'flangeNo' },
        { Header: 'Beam Meter', accessor: 'beamMeters', id: 'beamMeters' },
        { Header: 'Net Weight', accessor: 'netWeight', id: 'netWeight' },
        { Header: 'Width', accessor: 'width', id: 'width' },
        { Header: 'Expected Fabric Meter', accessor: (row: any) => row.expectedFabricMeter ?? 0, id: 'expectedFabricMeter' },
        { Header: 'Total Ends', accessor: 'totalEnds', id: 'totalEnds' }
      );
    } else if (isYarnSales) {
      cols.push(
        { Header: 'Yarn', accessor: (row: any) => getYarnName(row.yarnId), id: 'yarn' },
        { Header: 'Mill', accessor: (row: any) => getMillName(row.millId), id: 'mill' },
        { Header: 'Warehouse', accessor: (row: any) => getWarehouseName(row.warehouseId), id: 'warehouse' },
        { Header: 'Lot No', accessor: 'rollNo', id: 'rollNo' },
        { Header: 'Received Qty', accessor: (row: any) => (row.availableQty || 0).toFixed(2), id: 'availableQty' },
        { Header: 'Received Bags', accessor: (row: any) => (row.availableBags || 0).toFixed(2), id: 'availableBags' }
      );
    } else {
      cols.push(
        { Header: 'Packing List No', accessor: () => packingSlipNo || "-", id: 'packingListNo' },
        { Header: 'Roll No', accessor: 'rollNo', id: 'rollNo' },
        { Header: 'Piece No', accessor: 'pieceNo', id: 'pieceNo' },
        { Header: 'Meter', accessor: (row: any) => row.meter?.toFixed(2), id: 'meter' },
        { Header: 'Net Weight', accessor: (row: any) => row.netWeight?.toFixed(2), id: 'netWeight' }
      );
    }

    return cols;
  }, [
    isBeam,
    isSizingSales,
    isYarnSales,
    tempSelectedRolls,
    availableFabricRolls,
    packingSlipNo,
    getMillName,
    getWarehouseName,
    getYarnName,
  ]);

  const handleSave = async (data: SalesReturnInformationFormData) => {
    const isEditMode = Boolean(salesReturnDetail?.id);

    let salesReturnNo = data.salesReturnNo || salesReturnDetail?.salesReturnNo || "";
    if (!salesReturnDetail && !salesReturnNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Sales Beam/Jobwork Return",
        });
        salesReturnNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    isSavingRef.current = true;

    const isBeamMode = isBeam || isSizingSales || invoiceType === "204";
    const validationPass = isBeamMode
      ? (invoiceNo && (isSizingSales ? !!sizingBeamOutwardNo : true) && selectedFabricRolls.length > 0)
      : (invoiceNo && orderNo && buyerName && fabricCode && selectedFabricRolls.length > 0);

    if (!validationPass) {
      toast.error(isBeamMode ? "Please select Beam and add beam items" : "Please fill all required fields and select items");
      return;
    }

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) {
      toast.error("Please select a company before submitting");
      return;
    }

    const companyId = parseInt(storedCompanyId);
    const rollsToSave = isInEditMode ? selectedFabricRolls : savedFabricRolls;

    if (isYarnSales) {
      let qtyError = false;
      let bagsError = false;

      rollsToSave.forEach((roll) => {
        const issuedQty = roll.meter || roll.issueQty || 0;
        const issuedBags = Number(roll.pieceNo) || 0;
        const availableQty = roll.availableQty || 0;
        const availableBags = roll.availableBags || 0;

        if (issuedQty > availableQty) qtyError = true;
        if (issuedBags > availableBags) bagsError = true;
      });

      if (qtyError && bagsError) {
        toast.error("Received bags is greater than available bags and Received Qty is greater than available Qty");
        return;
      } else if (qtyError) {
        toast.error("Received Qty is greater than available Qty");
        return;
      } else if (bagsError) {
        toast.error("Received bags is greater than available bags");
        return;
      }
    }

    setIsSubmitting(true);
    const payload = {
      id: returnId ? parseInt(returnId) : 0,
      date: returnDate,
      salesReturnNo,
      invoiceNo,
      invoiceId,
      orderNo,
      orderId,
      buyerName,
      customerId,
      fabricCode,
      fabricQuality,
      invoiceType: String(invoiceType),
      remarks,
      activeFlag: true,
      companyId,
      warehouseId,
      editNote: editNote || "",
      dcNo: dcNo || "",
      dcDate: dcDate || null,
      packingListNo: packingSlipNo,
      sizingVendorId: sizingVendorId || 0,
      sizingPlanId: sizingPlanId || 0,
      weaverId: weaverId || 0,
      beamInwardNo: beamInwardNo || "",
      sizingBeamOutwardNo: isSizingSales ? sizingBeamOutwardNo : null,
      dcUpload: dcUploadMediaSno || 0,
      invoiceUpload: invoiceUploadMediaSno || 0,
      totalRolls: summary.totalRolls,
      items: (!isYarnSales && !isBeam && !isSizingSales) ? rollsToSave.map(roll => ({
        id: roll.id || 0,
        rollNo: roll.rollNo,
        pieceNo: roll.pieceNo,
        packingListNo: roll.packingListNo || packingSlipNo,
        meter: roll.meter,
        netWeight: roll.netWeight
      })) : [],
      yarnItems: isYarnSales ? rollsToSave.map(roll => ({
        id: roll.id || 0,
        yarnName: getYarnName(roll.yarnId),
        // availableQty: roll.availableQty || 0,
        issuedQty: roll.meter || roll.issueQty || 0,
        lotNo: roll.lotNumber || roll.rollNo,
        millId: roll.millId || resolveMillIdByName(roll.millName, subCategories) || resolveMillIdFromYarnSalesOrder(roll.yarnId, orderId, yarnSalesOrders) || 0,
        millName: roll.millName || getMillName(roll.millId || resolveMillIdByName(roll.millName, subCategories) || resolveMillIdFromYarnSalesOrder(roll.yarnId, orderId, yarnSalesOrders)),
        warehouseId: roll.warehouseId || warehouseId || 0,
        noOfBags: roll.availableBags || 0,
        issuedBags: Number(roll.pieceNo) || 0,
        conesPerBag: 0,
        conesWeight: 0
      })) : [],
      beamItems: (isBeam || isSizingSales) ? rollsToSave.map(roll => ({
        id: roll.id || 0,
        beamOutwardNo: roll.beamOutwardNo,
        outwardDate: roll.outwardDate,
        weavingContractNo: roll.weavingContractNo,
        weaverName: roll.weaverName,
        sizingPlanNo: roll.sizingPlanNo,
        salesOrderNo: roll.salesOrderNo,
        flangeNo: roll.flangeNo,
        sizedBeamNo: roll.sizedBeamNo ? (roll.sizedBeamNo.endsWith("-R") ? roll.sizedBeamNo : `${roll.sizedBeamNo}-R`) : "",
        beamMeters: roll.beamMeters || 0,
        expectedFabricMeter: roll.expectedFabricMeter || 0,
        totalBeams: selectedFabricRolls.length,
        weaverId: roll.weaverId,
        fabricPanelWidth: roll.fabricPanelWidth,
        isReturn: 0,
        shrinkage: roll.shrinkage,
        beamOutwardId: roll.beamOutwardId || 0,
        beamInwardId: roll.beamInwardId || 0
      })) : [],
      sizingItems: isSizingSales ? rollsToSave.map(roll => ({
        id: roll.id || 0,
        beamOutwardNo: roll.beamOutwardNo || sizingBeamOutwardNo,
        sizedBeamNo: roll.sizedBeamNo ? (roll.sizedBeamNo.endsWith("-R") ? roll.sizedBeamNo : `${roll.sizedBeamNo}-R`) : "",
        flangeNo: roll.flangeNo,
        beamMeter: roll.beamMeters || roll.meter || 0,
        netWeight: roll.netWeight || 0,
        width: Number(roll.width) || 0,
        expectedFabricMeter: roll.expectedFabricMeter || 0,
        totalEnds: Number(roll.totalEnds) || 0
      })) : []
    } as any;
    console.log("payload", payload);
    try {
      // alert(JSON.stringify(payload));
      console.log("Submitting payload:", payload);
      if (isEditMode) {
        await dispatch(updateSalesReturn({ id: salesReturnDetail.id, data: payload, companyId })).unwrap();
      } else {
        await dispatch(createSalesReturn(payload) as any).unwrap();
        documentNumberService.clearMemoryCache("Sales Beam/Jobwork Return");
      }
      navigate("/transaction/sales-return-management");
    } catch (error) {
      console.error("Error saving sales return:", error);
      toast.error("Failed to save sales return");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    isManualChangeRef.current = true;
    invoiceIdRef.current = null;
    setInvoiceId(null);
    setInvoiceNo("");
    setOrderNo("");
    setOrderId(null);
    setBuyerName("");
    setCustomerId(null);
    setFabricCode("");
    setFabricQuality("");
    setAvailableFabrics([]);
    setSelectedFabricRolls([]);
    setSavedFabricRolls([]);
    setAvailableFabricRolls([]);
    setPackingListOptions([]);
    setPackingSlipNo("");
    setWeavingOrderId(null);
    setSizingVendorId(null);
    setSizingPlanNo("");
    setWeaverName("");
    setWeaverId(null);
    setBeamInwardNo("");
    setSizingBeamOutwardNo("");
    setWeavingContractNo("");
    setSizingPlanId(null);
    setWarehouseId(null);
    setWarehouseName("");
    setRemarks("");
    setDcNo("");
    setDcDate("");
    setIsSummaryVisible(!!returnId);
    setFetchedShrinkage(0);
    setGeneratePackingData([]);
    setTempSelectedRolls([]);
    setInvoiceType("");

    // Reset react-hook-form
    reset({
      salesReturnNo: watch("salesReturnNo"), // keep the generated number
      returnDate: new Date().toISOString().split("T")[0],
      invoiceType: "",
      invoiceId: null,
      packingSlipNo: "",
      orderNo: "",
      orderId: null,
      customerId: null,
      buyerName: "",
      fabricCode: "",
      remarks: "",
      warehouseId: null,
    });
  };

  const handleCancel = () => {
    navigate("/transaction/sales-return-management");
  };

  return (
    <div className="p-6 pt-16 mt-5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/transaction/sales-return-management")}
            className="mr-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>

          <h1 className="text-2xl font-semibold">
            {returnId ? "Edit Sales Beam/Jobwork Return" : "Create Sales Beam/Jobwork Return"}
          </h1>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          {/* Sales Beam/Jobwork Return Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Beam/Jobwork Return Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Return Date */}
                <div>
                  <label className="block text-sm font-medium  mb-1">Sales Return No</label>
                  <input type="text"
                    className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                      !watch('salesReturnNo') || watch('salesReturnNo')?.startsWith('Loading')
                        ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                        : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                    }`}
                    placeholder="Loading sequence..."
                    {...register('salesReturnNo')} readOnly />

                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    disabled
                    className="w-full px-3 py-2 border rounded bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">System date (Read-only)</p>
                </div>
                {/* Invoice Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Return Type <span className="text-red-500">*</span>
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select Return Type"
                    value={invoiceType}
                    onChange={handleInvoiceTypeChange}
                    name="invoiceType"
                    options={invoiceTypeOptions.map((type) => ({
                      value: String(type.id),
                      label: getDetailLabel(type),
                    }))}
                    filterActive
                  />
                </div>

                {(isWeavingJobwork || isSizingSales || isYarnSales || isDomestic || isExport) && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Buyer Name <span className="text-red-500">*</span>
                    </label>
                    <CommonSearchableSelect
                      placeholder="Select Buyer"
                      value={customerId || ""}
                      onChange={handleBuyerChange}
                      name="customerId"
                      options={customers.map((customer: any) => ({
                        value: String(customer.id),
                        label: customer.customerName || customer.name,
                        activeFlag: customer.activeFlag ?? true,
                      }))}
                      filterActive
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isBeam ? "Weaver Name" : "Invoice No"} <span className="text-red-500">*</span>
                  </label>
                  {isBeam ? (
                    <CommonSearchableSelect
                      placeholder="Select Weaver"
                      value={weaverName}
                      onValueChange={(val) => {
                        setWeaverName(val);
                        const weaver = vendors.find((v: any) => (v.vendorName || v.name || v.companyName) === val);
                        if (weaver) setWeaverId(weaver.id);
                        else setWeaverId(null);
                        setFabricCode("");
                        setFabricQuality("");
                        setWeavingContractNo("");
                        setBeamInwardNo("");
                        setInvoiceId(null);
                      }}
                      options={weaverNameOptions.map((name: string) => ({
                        value: name,
                        label: name,
                      }))}
                      filterActive
                    />
                  ) : (
                    <CommonSearchableSelect
                      placeholder="Select Invoice"
                      value={invoiceId || ""}
                      onChange={handleInvoiceChange}
                      name="invoiceId"
                      options={invoiceOptions.map((inv) => ({
                        value: String(inv.id),
                        label: inv.invoiceNo,
                      }))}
                      filterActive
                    />
                  )}
                </div>

                {isSizingSales && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Sizing Beam Outward No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sizingBeamOutwardNo}
                      readOnly
                      placeholder="Autofilled from Invoice"
                      className="w-full px-3 py-2 border rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {isBeam && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Sort No - Construction <span className="text-red-500">*</span>
                      </label>
                      <CommonSearchableSelect
                        placeholder="Select Sort No"
                        value={fabricCode ? `${fabricCode}|${fabricQuality}` : ""}
                        onValueChange={(val) => {
                          if (!val) {
                            setFabricCode("");
                            setFabricQuality("");
                          } else {
                            const [code, quality] = val.split("|");
                            setFabricCode(code);
                            setFabricQuality(quality || "");

                            // Fetch shrinkage from FabricMaster for Beam mode
                            if (Array.isArray(fabricMasterList)) {
                              const fm = fabricMasterList.find(f =>
                                (f.fabricCode || f.code) === code &&
                                (f.fabricQuality || f.quality || "") === (quality || "")
                              );
                              if (fm) {
                                setFetchedShrinkage(Number(fm.shrinkage || 0));
                              } else {
                                setFetchedShrinkage(0);
                              }
                            }
                          }
                          setWeavingContractNo("");
                          setBeamInwardNo("");
                          setInvoiceId(null);
                        }}
                        options={fabricOptionsForBeam.map((fab) => ({
                          value: `${fab.code}|${fab.quality}`,
                          label: fab.display,
                        }))}
                        filterActive
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Weaver Contract Number <span className="text-red-500">*</span>
                      </label>
                      <CommonSearchableSelect
                        placeholder="Select Contract"
                        value={weavingContractNo}
                        onValueChange={(val) => {
                          setWeavingContractNo(val);

                          // Find selected contract from either list
                          const selectedContract = weavingContracts.find(c => getWeavingOrderLabel(c) === val) ||
                            weavingJobWorkOrders.find(o => getWeavingOrderLabel(o) === val);

                          if (selectedContract) {
                            const contractId = selectedContract.id;
                            setWeavingOrderId(contractId);

                            // Find associated beam inward by contract label or ID
                            const bi = beamInwards.find(bi =>
                              bi.beamInwardBeamDetails?.some((d: any) => {
                                const dLabel = getWeavingOrderLabel(d);
                                const dContractId = d.weavingContractId || d.weaving_contract_id || d.contractId || d.contract_id || d.weavingWorkOrderId || d.weaving_work_order_id;
                                return dLabel === val || String(dContractId) === String(contractId);
                              })
                            );

                            if (bi) {
                              const bNo = bi.beamInwardNo || bi.beam_inward_no || bi.invoiceNo || bi.invoice_no;
                              setBeamInwardNo(bNo);
                              setInvoiceNo(bNo);
                              setInvoiceId(bi.id);

                              // Set customer info from beam inward if available
                              const biCustomerId = bi.customerId || bi.customer_id;
                              if (biCustomerId) {
                                setCustomerId(Number(biCustomerId));
                                const customer = customers.find((c: any) => String(c.id) === String(biCustomerId));
                                if (customer) setBuyerName(customer.customerName || customer.name || "");
                              }
                            }
                          }
                        }}
                        options={weavingContractOptions.map((opt) => ({
                          value: opt.no,
                          label: opt.no,
                        }))}
                        filterActive
                      />
                    </div>
                  </>
                )}



                {/* Packing List No */}
                {!isBeam && !isYarnSales && !isSizingSales && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Packing List No
                    </label>
                    {packingListOptions.length > 1 ? (
                      <CommonSearchableSelect
                        placeholder="Select Packing List"
                        value={packingSlipNo}
                        onValueChange={(val) => setPackingSlipNo(val)}
                        options={packingListOptions.map((opt: any) => ({
                          value: opt.packingSlipNo,
                          label: opt.packingSlipNo,
                        }))}
                        filterActive
                      />
                    ) : packingListOptions.length === 1 ? (
                      <input
                        type="text"
                        value={packingListOptions[0].packingSlipNo}
                        readOnly
                        className="w-full px-3 py-2 border rounded bg-gray-50"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={invoiceNo ? "No packing lists found" : "Select invoice first"}
                        disabled
                        className="w-full px-3 py-2 border rounded bg-gray-50 cursor-not-allowed"
                      />
                    )}
                  </div>
                )}

                {/* Order No */}
                {!isBeam && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Order No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={orderNo}
                      readOnly
                      className="w-full px-3 py-2 border rounded bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-fetched (Read-only)</p>
                  </div>
                )}

                {/* Buyer Name */}
                {!isBeam && !isWeavingJobwork && !isSizingSales && !isYarnSales && !isDomestic && !isExport && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Buyer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      readOnly
                      className="w-full px-3 py-2 border rounded bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-fetched (Read-only)</p>
                  </div>
                )}

                {/* Fabric Code */}
                {(!isBeam || isSizingSales) && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    {availableFabrics.length > 1 ? (
                      <CommonSearchableSelect
                        placeholder="Select Fabric"
                        value={fabricCode}
                        onChange={handleFabricCodeChange}
                        name="fabricCode"
                        options={availableFabrics.map((fab) => ({
                          value: String(fab.fabricCode),
                          label: fab.displayLabel,
                        }))}
                        filterActive
                      />
                    ) : availableFabrics.length === 1 ? (
                      <input
                        type="text"
                        value={availableFabrics[0].displayLabel}
                        readOnly
                        className="w-full px-3 py-2 border rounded bg-gray-50"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Select invoice first"
                        disabled
                        className="w-full px-3 py-2 border rounded bg-gray-50 cursor-not-allowed"
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter remarks"
                  />
                </div>

                {/* Warehouse */}
                {!isBeam && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Warehouse
                    </label>
                    <CommonSearchableSelect
                      placeholder="Select Warehouse"
                      value={warehouseId || ""}
                      onChange={handleWarehouseChange}
                      name="warehouseId"
                      options={
                        isYarnSales
                          ? yarnWarehouseOptions
                          : (Array.isArray(warehouseList) ? warehouseList : []).map(
                            (warehouse: any) => ({
                              value: String(warehouse.id),
                              label: warehouse.warehouseName || warehouse.name,
                              activeFlag: warehouse.activeFlag ?? true,
                            })
                          )
                      }
                      filterActive
                    />
                    {/* <p className="text-xs text-gray-500 mt-1">Optional</p> */}
                  </div>
                )}
                {/* DC Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    DC Number
                  </label>
                  <input
                    type="text"
                    value={dcNo}
                    onChange={(e) => setDcNo(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter DC Number"
                  />
                </div>

                {/* DC Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    DC Date
                  </label>
                  <input
                    type="date"
                    value={dcDate}
                    onChange={(e) => setDcDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Add Fabric Button */}
                <div className="items-center mt-2">
                  <Button
                    type="button"
                    onClick={handleOpenFabricModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    disabled={(!fabricCode && !isBeam && !isSizingSales) || (isSizingSales && !invoiceNo)}
                  >
                    <Plus size={18} className="mr-2" />
                    {(isBeam || isSizingSales) ? "Select Beam" : "Select Items"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Added Beam/Fabric Table */}
          {dataLoaded && selectedFabricRolls.length > 0 && isInEditMode && (
            <Card>
              <CardHeader>
                <CardTitle>{(isBeam || isSizingSales) ? "Added Beam" : isYarnSales ? "Added Yarn Lots" : "Added Fabric"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-left">S.No</th>
                        {(isBeam || isSizingSales) ? (
                          <>
                            {isSizingSales ? (
                              <>
                                <th className="border p-2 text-left">Sized Beam No</th>
                                <th className="border p-2 text-left">Empty Beam No</th>
                                <th className="border p-2 text-left">Beam Meters</th>
                                <th className="border p-2 text-left">Net Weight</th>
                                <th className="border p-2 text-left">Width</th>
                                <th className="border p-2 text-left">Expected Fabric Meter</th>
                                <th className="border p-2 text-left">Total Ends</th>
                              </>
                            ) : (
                              <>
                                <th className="border p-2 text-left">Beam Outward No</th>
                                <th className="border p-2 text-left">Outward Date</th>
                                {/* <th className="border p-2 text-left">Inward Type</th> */}
                                <th className="border p-2 text-left">Weaving Contract No</th>
                                <th className="border p-2 text-left">Sizing Plan No</th>
                                <th className="border p-2 text-left">Empty Beam No</th>
                                <th className="border p-2 text-left">Sized Beam No</th>
                                <th className="border p-2 text-left">Fabric Panel Width</th>
                                <th className="border p-2 text-left">Shrinkage %</th>
                                <th className="border p-2 text-left">Beam Meters</th>
                                <th className="border p-2 text-left">Expected Fabric Meter</th>
                              </>
                            )}
                          </>
                        ) : isYarnSales ? (
                          <>
                            <th className="border p-2 text-left">Yarn</th>
                            <th className="border p-2 text-left">Mill</th>
                            <th className="border p-2 text-left">Warehouse</th>
                            <th className="border p-2 text-left">Lot No</th>
                            <th className="border p-2 text-left">Received Bags</th>
                            <th className="border p-2 text-left">Received Qty</th>
                          </>
                        ) : (
                          <>
                            <th className="border p-2 text-left">Packing List No</th>
                            {/* <th className="border p-2 text-left">Buyer Name</th>
                            <th className="border p-2 text-left">Item Name</th> */}
                            <th className="border p-2 text-left">Roll No</th>
                            <th className="border p-2 text-left">Piece No</th>
                            <th className="border p-2 text-left">Meter</th>
                            <th className="border p-2 text-left">Net Weight</th>
                          </>
                        )}
                        <th className="border p-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFabricRolls.map((roll, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border p-2">{index + 1}</td>
                          {isSizingSales ? (
                            <>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.sizedBeamNo || ""}
                                  onChange={(e) => handleUpdateRoll(index, "sizedBeamNo", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.flangeNo || ""}
                                  onChange={(e) => handleUpdateRoll(index, "flangeNo", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.beamMeters || 0}
                                  onChange={(e) => handleUpdateRoll(index, "beamMeters", Number(e.target.value))}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.netWeight || 0}
                                  onChange={(e) => handleUpdateRoll(index, "netWeight", Number(e.target.value))}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.width || ""}
                                  onChange={(e) => handleUpdateRoll(index, "width", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.expectedFabricMeter || 0}
                                  onChange={(e) => handleUpdateRoll(index, "expectedFabricMeter", Number(e.target.value))}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.totalEnds || ""}
                                  onChange={(e) => handleUpdateRoll(index, "totalEnds", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                            </>
                          ) : isBeam ? (
                            <>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.beamOutwardNo || ""}
                                  onChange={(e) => handleUpdateRoll(index, "beamOutwardNo", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="date"
                                  value={roll.outwardDate || ""}
                                  onChange={(e) => handleUpdateRoll(index, "outwardDate", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                               {/* <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.inwardType || ""}
                                  onChange={(e) => handleUpdateRoll(index, "inwardType", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td> */}
                           
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.weavingContractNo || ""}
                                  onChange={(e) => handleUpdateRoll(index, "weavingContractNo", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.sizingPlanNo || ""}
                                  onChange={(e) => handleUpdateRoll(index, "sizingPlanNo", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.flangeNo || ""}
                                  onChange={(e) => handleUpdateRoll(index, "flangeNo", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.sizedBeamNo || ""}
                                  onChange={(e) => handleUpdateRoll(index, "sizedBeamNo", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.fabricPanelWidth || ""}
                                  onChange={(e) => handleUpdateRoll(index, "fabricPanelWidth", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.shrinkage || 0}
                                  onChange={(e) => handleUpdateRoll(index, "shrinkage", Number(e.target.value))}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.beamMeters || 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    handleUpdateRoll(index, "beamMeters", val);
                                    handleUpdateRoll(index, "meter", val);
                                    handleUpdateRoll(index, "netWeight", val);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.expectedFabricMeter || 0}
                                  onChange={(e) => handleUpdateRoll(index, "expectedFabricMeter", Number(e.target.value))}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              {/* <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.totalBeams || 0}
                                  onChange={(e) => handleUpdateRoll(index, "totalBeams", Number(e.target.value))}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td> */}
                            </>
                          ) : isYarnSales ? (
                            <>
                              <td className="border p-2">{getYarnName(roll.yarnId)}</td>
                              <td className="border p-2">{getMillName(roll.millId)}</td>
                              <td className="border p-2">{getWarehouseName(roll.warehouseId)}</td>
                              <td className="border p-2">{roll.rollNo}</td>
                              {/* <td className="border p-2">{(roll.availableBags || 0).toFixed(2)}</td> */}
                              {/* <td className="border p-2">{(roll.availableQty || 0).toFixed(2)}</td> */}
                              {/* <td className="border p-2">{(roll.issueQty || 0).toFixed(2)}</td> */}
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.pieceNo || 0}
                                  onChange={(e) => handleUpdateRoll(index, "pieceNo", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.meter || 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    handleUpdateRoll(index, "meter", val);
                                    handleUpdateRoll(index, "netWeight", val);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="border p-2">{roll.packingListNo || packingSlipNo || "-"}</td>
                              {/* <td className="border p-2">{roll.buyerName || buyerName || "-"}</td> */}
                              {/* <td className="border p-2">{roll.fabricCode || fabricCode || "-"}</td> */}
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.rollNo || ""}
                                  onChange={(e) => handleUpdateRoll(index, "rollNo", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="text"
                                  value={roll.pieceNo || ""}
                                  onChange={(e) => handleUpdateRoll(index, "pieceNo", e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.meter || 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    handleUpdateRoll(index, "meter", val);
                                    handleUpdateRoll(index, "netWeight", val);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <input
                                  type="number"
                                  value={roll.netWeight || 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    handleUpdateRoll(index, "netWeight", val);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              </td>
                            </>
                          )}
                          <td className="border p-2 text-center">
                            <button
                              onClick={() => handleRemoveRoll(index)}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      setSavedFabricRolls([...selectedFabricRolls]);
                      setIsInEditMode(false);
                      setIsSummaryVisible(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save size={18} className="mr-2" />
                    {(isBeam || isSizingSales) ? "Save Beam" : isYarnSales ? "Save Yarn Lots" : "Save Fabric"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Card */}
          {dataLoaded && savedFabricRolls.length > 0 && isSummaryVisible && !isInEditMode && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border mb-4">
                    <thead className="bg-gray-100 text-xs">
                      <tr>
                        <th className="border p-2 text-left">S.No</th>
                        {(isBeam || isSizingSales) ? (
                          <>
                            {isSizingSales ? (
                              <>
                                <th className="border p-2 text-left">Sized Beam No </th>
                                <th className="border p-2 text-left">Empty Beam No</th>
                                <th className="border p-2 text-left">Beam Meters</th>
                                <th className="border p-2 text-left">Net Weight</th>
                                <th className="border p-2 text-left">Width</th>
                                <th className="border p-2 text-left">Expected Fabric Meter</th>
                                <th className="border p-2 text-left">Total Ends</th>
                              </>
                            ) : (
                              <>
                                <th className="border p-2 text-left">Beam Outward No</th>
                                <th className="border p-2 text-left">Outward Date</th>
                                <th className="border p-2 text-left">Weaving Contract No</th>
                                <th className="border p-2 text-left">Sizing Plan No</th>
                                <th className="border p-2 text-left">Empty Beam No</th>
                                <th className="border p-2 text-left">Sized Beam No</th>
                                <th className="border p-2 text-left">Fabric Panel Width</th>
                                <th className="border p-2 text-left">Shrinkage %</th>
                                <th className="border p-2 text-left">Beam Meters</th>
                                <th className="border p-2 text-left">Expected Fabric Meter</th>
                              </>
                            )}
                          </>
                        ) : isYarnSales ? (
                          <>
                            <th className="border p-2 text-left">Yarn</th>
                            <th className="border p-2 text-left">Mill</th>
                            <th className="border p-2 text-left">Warehouse</th>
                            <th className="border p-2 text-left">Lot No</th>

                            <th className="border p-2 text-left">Received Bags</th>
                            <th className="border p-2 text-left">Received Qty</th>


                            {/* <th className="border p-2 text-left">Kgs</th> */}
                          </>
                        ) : (
                          <>
                            <th className="border p-2 text-left">Packing List No</th>
                            {/* <th className="border p-2 text-left">Buyer Name</th> */}
                            {/* <th className="border p-2 text-left">Item Name</th> */}
                            <th className="border p-2 text-left">Roll No</th>
                            <th className="border p-2 text-left">Piece No</th>
                            <th className="border p-2 text-left">Meter</th>
                            <th className="border p-2 text-left">Net Weight</th>
                          </>
                        )}
                        <th className="border p-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {selectedFabricRolls.map((roll, index) => (
                        <tr key={index}>
                          <td className="border p-2">{index + 1}</td>
                          {(isBeam || isSizingSales) ? (
                            <>
                              {isSizingSales ? (
                                <>
                                  <td className="border p-2">{roll.sizedBeamNo}</td>
                                  <td className="border p-2">{roll.flangeNo}</td>
                                  <td className="border p-2">{roll.beamMeters}</td>
                                  <td className="border p-2">{roll.netWeight}</td>
                                  <td className="border p-2">{roll.width}</td>
                                  <td className="border p-2">{roll.expectedFabricMeter}</td>
                                  <td className="border p-2">{roll.totalEnds}</td>
                                </>
                              ) : (
                                <>
                                  <td className="border p-2">{roll.beamOutwardNo}</td>
                                  <td className="border p-2">{roll.outwardDate}</td>
                                  <td className="border p-2">{roll.weavingContractNo}</td>
                                  <td className="border p-2">{roll.sizingPlanNo}</td>
                                  <td className="border p-2">{roll.flangeNo}</td>
                                  <td className="border p-2">{roll.sizedBeamNo}</td>
                                  <td className="border p-2">{roll.fabricPanelWidth}</td>
                                  <td className="border p-2">{roll.shrinkage}</td>
                                  <td className="border p-2">{roll.beamMeters}</td>
                                  <td className="border p-2">{roll.expectedFabricMeter}</td>
                                  {/* <td className="border p-2">{roll.totalBeams}</td> */}
                                </>
                              )}
                            </>
                          ) : isYarnSales ? (
                            <>
                              <td className="border p-2">{getYarnName(roll.yarnId)}</td>
                              <td className="border p-2">{getMillName(roll.millId)}</td>
                              <td className="border p-2">{getWarehouseName(roll.warehouseId)}</td>
                              <td className="border p-2">{roll.lotNumber}</td>
                              <td className="border p-2">{roll.pieceNo}</td>
                              <td className="border p-2">{roll.meter}</td>
                            </>
                          ) : (
                            <>
                              <td className="border p-2">{roll.packingListNo || packingSlipNo}</td>
                              {/* <td className="border p-2">{roll.buyerName || buyerName}</td> */}
                              {/* <td className="border p-2">{roll.fabricCode || fabricCode}</td> */}
                              <td className="border p-2">{roll.rollNo}</td>
                              <td className="border p-2">{roll.pieceNo}</td>
                              <td className="border p-2">{roll.meter}</td>
                              <td className="border p-2">{roll.netWeight}</td>
                            </>
                          )}
                          <td className="border p-2 text-center">
                            <button
                              onClick={() => {
                                setSelectedFabricRolls([...savedFabricRolls]);
                                setIsInEditMode(true);
                                setIsSummaryVisible(false);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {!(isBeam || isSizingSales) && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Total Rolls</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {summary.totalRolls}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-600 font-medium">
                      {(isBeam || isSizingSales) ? "Total Beams" : isYarnSales ? "Total Bags" : "Total Pieces"}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {(isBeam || isSizingSales) ? summary.totalRolls : isYarnSales ? savedFabricRolls.reduce((sum, r) => sum + Number(r.pieceNo || 0), 0) : summary.totalPieces}
                    </p>
                  </div>


                  <div>
                    <p className="text-xs text-gray-600 font-medium">
                      {isYarnSales ? "Total Received Qty" : (isBeam || isSizingSales) ? "Total Beam Meters" : "Total Meter"}
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {summary.totalMeter.toFixed(2)}
                    </p>
                  </div>

                  {(isBeam || isSizingSales) && (
                    <>
                      {!isBeam && (
                        <div>
                          <p className="text-xs text-gray-600 font-medium">
                            Total Net Weight
                          </p>
                          <p className="text-2xl font-bold text-red-600">
                            {summary.totalNetWeight.toFixed(2)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Total Expected Meter
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {savedFabricRolls.reduce((sum, r) => sum + Number(r.expectedFabricMeter || 0), 0).toFixed(2)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-5">
            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(handleSave)}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save size={18} className="mr-2" />
              {isSubmitting ? (returnId ? "Updating..." : "Saving...") : (returnId ? "Update" : "Save")}
            </Button>

            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>      {/* Fabric Roll Selection Dialog */}
      <Dialog open={showFabricModal} onOpenChange={setShowFabricModal}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              {isBeam ? "Select Beam" :
                isYarnSales ? "Select Yarn Lots" : "Select Fabric Rolls"}
              {!isBeam && ` - ${fabricCode}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto">
              <PopupDataTable
                columns={rollColumns}
                data={availableFabricRolls}
                emptyMessage={
                  isBeam ? "No beams available" : isYarnSales ? "No yarn lots available" : "No fabric rolls available"
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowFabricModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition text-black font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFabricRolls}
                disabled={tempSelectedRolls.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
              >
                Submit ({tempSelectedRolls.length} selected)
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}