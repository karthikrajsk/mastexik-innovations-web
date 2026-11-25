import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllSizingJobWorkOrders, getAllSizingJobWorkOrdersByFactoryCompanyId } from "@/state/sizingJobWorkOrderSlice";
import { getAllSizingPlan, getSizingPlanById } from "@/state/sizingPlanSlice";
import { getAllSizingProductions } from "@/state/sizingProductionSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllCustomers } from "@/state/customerSlice";
import { createSizingBeamOutward, updateSizingBeamOutward, getAllSizingBeamOutward } from "@/state/sizingBeamOutwardSlice";
import {
  BeamDetailRow,
  SizingBeamOutwardFormData,
  createEmptyBeamRow,
  extractArray,
  hydrateBeamRows,
  summarizeBeamRows,
  resolveOrderType,
  resolvePlanLabel,
  resolveOrderLabel,
  resolveBuyerName,
  resolveBuyerId,
  resolveDeliveryNames,
  formatNumber,
  calculateExpectedFabricMeter,
} from "@/pages/transaction/sizing-beam-outward-shared";
import { X } from "lucide-react";
import { CommonSearchableSelect } from "../ui/CommonSearchableSelect";
import { Button } from "../ui/button";
import { toast } from "react-toastify";
import documentNumberService from "@/services/DocumentNumberService";

interface SizingBeamOutwardFormProps {
  mode: "create" | "edit";
  initialRecord?: any;
  onCancel?: () => void;
  onSuccess?: () => void;
  submitLabel?: string;
  prefetchReferences?: boolean;
}

const resolveSelectedCompanyId = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    if (!stored) return null;
    const numeric = Number(stored);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = JSON.parse(stored);
    if (parsed?.id != null && Number.isFinite(Number(parsed.id))) {
      return Number(parsed.id);
    }
    return null;
  } catch {
    return null;
  }
};

const getCurrentDate = () => new Date().toISOString().slice(0, 10);

const normalizeDateValue = (value?: string | null) => {
  if (!value) return "";
  const normalized = String(value).trim();
  return normalized.includes("T") ? normalized.slice(0, 10) : normalized;
};

const toFiniteNumber = (value: any) => {
  if (value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const resolveInternalBuyerFromRecord = (record: any, companyMap: Map<number, string>) => {
  if (!record) return null;
  const companyId =
    toFiniteNumber(record?.buyerId) ??
    toFiniteNumber(record?.companyId) ??
    toFiniteNumber(record?.factoryCompanyId) ??
    toFiniteNumber(record?.tradingCompanyId);
  if (companyId == null) return null;
  const buyerName =
    companyMap.get(companyId) ??
    record?.buyerName ??
    record?.companyName ??
    record?.factoryCompanyName ??
    record?.tradingCompanyName ??
    "";
  return { buyerId: companyId, buyerName };
};

const resolveExternalBuyerFromRecord = (record: any, customerMap: Map<number, string>) => {
  if (!record) return null;
  const customerId =
    toFiniteNumber(record?.buyerId) ??
    toFiniteNumber(record?.customerId) ??
    toFiniteNumber(record?.consigneeId);
  if (customerId == null) return null;
  const buyerName =
    customerMap.get(customerId) ??
    record?.buyerName ??
    record?.customerName ??
    record?.consigneeName ??
    "";
  return { buyerId: customerId, buyerName };
};

const buildDeliveryBadges = (items: string[]) => {
  if (!items || !items.length) {
    return <span className="text-gray-400">No delivery names</span>;
  }
  return items.map((item) => (
    <span key={item} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {item}
    </span>
  ));
};

const ORDER_TYPE_OPTIONS = [
  { label: "Internal", value: "Internal", id: 1 },
  { label: "External", value: "External", id: 2 },
];

const resolveOrderTypeId = (order: any) => {
  const numeric = Number(order?.orderTypeId ?? order?.orderType);
  if (Number.isFinite(numeric)) return numeric;
  const resolved = resolveOrderType(order, "Internal");
  return resolved === "External" ? 2 : 1;
};

const buildOrderTokens = (...values: Array<string | number | null | undefined>) => {
  const set = new Set<string>();
  values.forEach((value) => {
    if (value == null) return;
    const normalized = String(value).trim().toLowerCase();
    if (normalized) {
      set.add(normalized);
    }
  });
  return Array.from(set);
};

const collectOrderIdentifiers = (order: any, plan: any, selectedOrderId?: string) => {
  const orderIdCandidates = new Set<string>();
  const pushId = (value: any) => {
    if (value == null) return;
    const normalized = String(value).trim();
    if (normalized) {
      orderIdCandidates.add(normalized);
    }
  };
  pushId(selectedOrderId);
  if (order) {
    pushId(order.id);
    pushId(order.sizingOrderId);
    pushId(order.sizingJobWorkOrderId);
    pushId(order.sizingPlanId);
    pushId(order.sizingOrder?.id);
    pushId(order.sizingOrder?.sizingJobWorkOrderId);
  }
  if (plan) {
    pushId(plan.id);
    pushId(plan.sizingPlanId);
    pushId(plan.sizingOrderId);
    pushId(plan.sizingJobWorkOrderId);
  }
  const orderTokens = new Set(
    buildOrderTokens(
      order?.sizingOrderNo,
      order?.sizingWorkOrderNo,
      order?.sizingJobWorkOrderNo,
      order?.jobWorkOrderNo,
      order?.orderNo,
      order?.sizingOrder?.sizingOrderNo,
      order?.sizingOrder?.orderNo,
    ),
  );
  return { orderIdCandidates, orderTokens };
};

const isPendingSizingBeamOutward = (value: any) => {
  if (value == null) return true;
  if (typeof value === "boolean") {
    return value === false;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric === 0;
  }
  return true;
};

const filterPendingProductionDetails = (production: any) => {
  if (!production) return null;
  if (!isPendingSizingBeamOutward(production?.isSizingBeamOutward)) {
    return null;
  }
  const details = extractArray(production?.productionDetails);
  if (!details.length) {
    return production;
  }
  const pendingDetails = details.filter((detail: any) => isPendingSizingBeamOutward(detail?.isSizingBeamOutward));
  if (!pendingDetails.length) {
    return null;
  }
  if (pendingDetails.length === details.length) {
    return production;
  }
  return { ...production, productionDetails: pendingDetails };
};

const beamRowHasValues = (row: BeamDetailRow) => {
  return [
    row.sizedBeamNo,
    row.width,
    row.totalEnds,
    row.beamMeters,
    row.flangeNo,
    row.flangeId,
    row.weavingContractNo,
    row.salesOrderNo,
  ].some((value) => value.trim() !== "");
};

export function SizingBeamOutwardForm({
  mode,
  initialRecord,
  onCancel,
  onSuccess,
  submitLabel = "Save",
  prefetchReferences = true,
}: SizingBeamOutwardFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const sizingBeamOutwardState = useSelector((state: RootState) => (state as any).sizingBeamOutward || {});
  const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
  const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
  const sizingProductionState = useSelector((state: RootState) => (state as any).sizingProduction || {});
  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts as any);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder as any);
  const { vendorList } = useSelector((state: RootState) => state.vendor as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { customerList } = useSelector((state: RootState) => state.customer as any);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<SizingBeamOutwardFormData>({
    defaultValues: {
      id: null,
      outwardDate: getCurrentDate(),
      orderType: "",
      sizingOrderId: "",
      sizingOrderNo: "",
      sizingPlanId: "",
      sizingPlanNo: "",
      buyerName: "",
      buyerId: "",
      deliveryAt: [],
      yarnName: "",
      yarnId: "",
    },
  });

  const orderTypeField = register("orderType", { required: "Order Type is required" });
  const yarnIdField = register("yarnId", { required: "Yarn Name is required" });

  const orderTypeValue = (watch("orderType") as "Internal" | "External" | "") || "";
  const sizingOrderIdValue = watch("sizingOrderId") || "";
  const sizingPlanIdValue = watch("sizingPlanId") || "";
  const sizingPlanNoValue = watch("sizingPlanNo") || "";
  const deliveryValues = watch("deliveryAt");
  const buyerNameValue = watch("buyerName") || "";
  const yarnIdValue = watch("yarnId") || "";
  const yarnNameValue = watch("yarnName") || "";
  const selectedOrderTypeId = orderTypeValue === "External" ? 2 : orderTypeValue === "Internal" ? 1 : null;

  useEffect(() => {
    register("deliveryAt");
  }, [register]);

  const [beamRows, setBeamRows] = useState<BeamDetailRow[]>([createEmptyBeamRow()]);
  const [beamRowError, setBeamRowError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasBeamData = useMemo(() => beamRows.some(beamRowHasValues), [beamRows]);
  const selectedCompanyId = useMemo(() => resolveSelectedCompanyId(), []);
  const resetKeyRef = useRef<{ mode: "create" | "edit"; record: any } | null>(null);
  const lastAutoPopulatedOrderIdRef = useRef<string | null>(null);
  const [fetchedPlanCache, setFetchedPlanCache] = useState<Record<string, any>>({});


  useEffect(() => {
    if (!prefetchReferences) return;
    const companyId = selectedCompanyId;
    if (companyId) {
      dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: selectedCompanyId }));
      dispatch(getAllSizingPlan({ fetchAll: true, companyId } as any));
      dispatch(getAllSizingProductions({ fetchAll: true, companyId }));
      // dispatch(getAllWeavingContract({ fetchAll: true, companyId } as any));
      dispatch(getAllSalesOrders({ fetchAll: true } as any));
      dispatch(getAllVendors({ fetchAll: true, companyId } as any));
    } else {
      dispatch(getAllSizingJobWorkOrders(undefined as any));
      dispatch(getAllSizingPlan({ fetchAll: true } as any));
      dispatch(getAllSizingProductions({ fetchAll: true }));
      // dispatch(getAllWeavingContract({ fetchAll: true } as any));
      dispatch(getAllSalesOrders({ fetchAll: true } as any));
      dispatch(getAllVendors({ fetchAll: true } as any));
    }
    dispatch(getAllWeavingContract({ fetchAll: true } as any));
    dispatch(getAllCompanies({ fetchAll: true } as any));
    dispatch(getAllCustomers({ fetchAll: true } as any));
  }, [dispatch, prefetchReferences, selectedCompanyId]);

    const salesOrderOptions = useMemo(() => {
    return extractArray(salesOrderList)
      .map((order: any) => {
        const id = order?.id ?? order?.salesOrderId;
        if (id == null) return null;
        const label = order?.salesOrderNo || order?.salesOrderNumber || order?.orderNo || `SO-${id}`;
        return { value: String(id), label };
      })
      .filter(Boolean) as { value: string; label: string }[];
  }, [salesOrderList]);

  const salesOrderLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    salesOrderOptions.forEach((option) => map.set(option.value, option.label));
    return map;
  }, [salesOrderOptions]);

  const normalizedVendorList = useMemo(() => {
    if (!vendorList) return [] as any[];
    if (Array.isArray(vendorList)) return vendorList;
    if (Array.isArray(vendorList?.data?.data)) return vendorList.data.data;
    if (Array.isArray(vendorList?.data)) return vendorList.data;
    if (Array.isArray(vendorList?.items)) return vendorList.items;
    return extractArray(vendorList);
  }, [vendorList]);

  const vendorLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    normalizedVendorList.forEach((vendor: any) => {
      const id = vendor?.id ?? vendor?.vendorId;
      const label = vendor?.vendorName || vendor?.name || vendor?.companyName;
      if (id == null || !label) return;
      map.set(String(id), label);
    });
    return map;
  }, [normalizedVendorList]);

  const vendorNameIdMap = useMemo(() => {
    const map = new Map<string, string>();
    normalizedVendorList.forEach((vendor: any) => {
      const id = vendor?.id ?? vendor?.vendorId;
      if (id == null) {
        return;
      }
      const pushName = (value: any) => {
        const normalized = value != null ? String(value).trim().toLowerCase() : "";
        if (normalized && !map.has(normalized)) {
          map.set(normalized, String(id));
        }
      };
      pushName(vendor?.vendorName);
      pushName(vendor?.name);
      pushName(vendor?.companyName);
    });
    return map;
  }, [normalizedVendorList]);

  const normalizedCompanyList = useMemo(() => extractArray(companyMasterList), [companyMasterList]);

  const companyIdNameMap = useMemo(() => {
    const map = new Map<number, string>();
    normalizedCompanyList.forEach((company: any) => {
      const id = company?.id ?? company?.companyId;
      const label = company?.companyName ?? company?.name ?? company?.shortName ?? company?.tradingCompanyName;
      if (id == null || !label) return;
      map.set(Number(id), label);
    });
    return map;
  }, [normalizedCompanyList]);

  const normalizedCustomers = useMemo(() => extractArray(customerList), [customerList]);

  const customerIdNameMap = useMemo(() => {
    const map = new Map<number, string>();
    normalizedCustomers.forEach((customer: any) => {
      const id = customer?.id ?? customer?.customerId;
      const label = customer?.customerName || customer?.name;
      if (id == null || !label) return;
      map.set(Number(id), label);
    });
    return map;
  }, [normalizedCustomers]);

  const companyNameIdMap = useMemo(() => {
    const map = new Map<string, number>();
    normalizedCompanyList.forEach((company: any) => {
      const id = company?.id ?? company?.companyId;
      if (id == null) {
        return;
      }
      const pushName = (value: any) => {
        const normalized = value != null ? String(value).trim().toLowerCase() : "";
        if (normalized) {
          map.set(normalized, Number(id));
        }
      };
      pushName(company?.companyName);
      pushName(company?.name);
      pushName(company?.tradingCompanyName);
      pushName(company?.shortName);
    });
    return map;
  }, [normalizedCompanyList]);

  
  const weavingContractOptions = useMemo(() => {
    return extractArray(weavingContractList)
      .map((contract: any) => {
        const id = contract?.id ?? contract?.weavingContractId;
        if (id == null) return null;
        const label =
          contract?.weavingContractNo ||
          contract?.contractNo ||
          contract?.weavingContractNumber ||
          `WC-${id}`;
        return { value: String(id), label };
      })
      .filter(Boolean) as { value: string; label: string }[];
  }, [weavingContractList]);

  const weavingContractLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    weavingContractOptions.forEach((option) => map.set(option.value, option.label));
    return map;
  }, [weavingContractOptions]);

  const weavingContractDisplayMap = useMemo(() => {
    const map = new Map<string, { label: string; vendorName: string; vendorId: string | null }>();
    extractArray(weavingContractList).forEach((contract: any) => {
      const id = contract?.id ?? contract?.weavingContractId;
      if (id == null) {
        return;
      }
      const contractLabel =
        contract?.weavingContractNo ||
        contract?.contractNo ||
        contract?.weavingContractNumber ||
        `WC-${id}`;
      const vendorIdRaw = contract?.weavingVendorId ?? contract?.vendorId ?? contract?.vendor?.id;
      const vendorName =
        (vendorIdRaw != null ? vendorLabelMap.get(String(vendorIdRaw)) : "") ||
        contract?.vendorName ||
        contract?.weaverName ||
        contract?.vendor?.vendorName ||
        "";
      map.set(String(id), {
        label: contractLabel,
        vendorName,
        vendorId: vendorIdRaw != null ? String(vendorIdRaw) : null,
      });
    });
    return map;
  }, [weavingContractList, vendorLabelMap]);

  const resolveContractVendorLabel = useCallback(
    (
      contractId?: any,
      vendorId?: any,
      fallbackContract?: any,
      fallbackVendor?: any,
    ) => {
      const id = contractId != null ? String(contractId) : "";
      const contractMeta = id ? weavingContractDisplayMap.get(id) : undefined;
      const vendorLabel =
        (vendorId != null ? vendorLabelMap.get(String(vendorId)) : "") ||
        (fallbackVendor != null ? String(fallbackVendor).trim() : "");
      if (vendorLabel) {
        return vendorLabel;
      }
      const contractLabel =
        contractMeta?.label ||
        (fallbackContract != null ? String(fallbackContract).trim() : "");
      return contractLabel;
    },
    [weavingContractDisplayMap, vendorLabelMap],
  );

  const resolveContractLabel = useCallback(
    (contractId?: any, fallbackContract?: any) => {
      if (contractId == null || contractId === "") {
        return fallbackContract ? String(fallbackContract).trim() : "";
      }
      const key = String(contractId);
      return (
        weavingContractDisplayMap.get(key)?.label ||
        weavingContractLabelMap.get(key) ||
        (fallbackContract ? String(fallbackContract).trim() : "")
      );
    },
    [weavingContractDisplayMap, weavingContractLabelMap],
  );

  const resolvePlanVendorName = useCallback(
    (plan: any) => {
      if (!plan) {
        return "";
      }
      const idCandidates = [
        plan?.sizingVendorId,
        plan?.vendorId,
        plan?.vendor?.id,
        plan?.sizingVendor?.id,
      ];
      for (const candidate of idCandidates) {
        if (candidate == null) {
          continue;
        }
        const label = vendorLabelMap.get(String(candidate));
        if (label && label.trim()) {
          return label.trim();
        }
      }
      const nameCandidates = [
        plan?.vendorName,
        plan?.sizingVendorName,
        plan?.vendor?.vendorName,
        plan?.vendor?.name,
        plan?.vendor?.companyName,
      ];
      const match = nameCandidates.find((value) => value != null && String(value).trim() !== "");
      return match ? String(match).trim() : "";
    },
    [vendorLabelMap],
  );





  const jobOrderOptions = useMemo(() => {
    return extractArray(sizingJobWorkOrderList)
      .filter((order: any) => Number(order?.isReturn) !== 1)
      .map((order: any) => {
        const id = order?.id ?? order?.sizingJobWorkOrderId ?? order?.sizingPlanId;
        if (id == null) return null;
        const label = resolveOrderLabel(order) || `Order ${id}`;
        const orderTypeId = resolveOrderTypeId(order);
        return {
          id,
          label,
          value: String(id),
          orderTypeId,
          payload: order,
        };
      })
      .filter(Boolean) as { id: number; label: string; value: string; payload: any; orderTypeId: number }[];
  }, [sizingJobWorkOrderList]);

  const jobOrderMap = useMemo(() => {
    const map = new Map<string, any>();
    jobOrderOptions.forEach((option) => {
      map.set(option.value, option.payload);
    });
    return map;
  }, [jobOrderOptions]);

  const { planByIdMap, planByNumberMap } = useMemo(() => {
    const byId = new Map<string, any>();
    const byNumber = new Map<string, any>();
    extractArray(sizingPlanList).forEach((plan: any) => {
      const id = plan?.id ?? plan?.sizingPlanId;
      if (id != null) {
        byId.set(String(id), plan);
      }
      const planNumber = resolvePlanLabel(plan);
      if (planNumber) {
        byNumber.set(planNumber.trim().toLowerCase(), plan);
      }
    });
    return { planByIdMap: byId, planByNumberMap: byNumber };
  }, [sizingPlanList]);

  const filteredJobOrderOptions = useMemo(() => {
    if (!selectedOrderTypeId) return jobOrderOptions;
    return jobOrderOptions.filter((option) => Number(option.orderTypeId) === selectedOrderTypeId);
  }, [jobOrderOptions, selectedOrderTypeId]);

  const selectedOrder = sizingOrderIdValue ? jobOrderMap.get(sizingOrderIdValue) : undefined;
  const selectedPlanId =
    selectedOrder?.sizingPlanId ?? selectedOrder?.planId ?? selectedOrder?.sizingPlan?.id ?? null;
  const selectedPlanNumber = useMemo(() => {
    if (!selectedOrder) return "";
    const candidates = [
      selectedOrder?.sizingPlanNo,
      selectedOrder?.planNo,
      selectedOrder?.planNumber,
      selectedOrder?.sizingPlan?.sizingPlanNo,
    ];
    const match = candidates.find((value) => value != null && String(value).trim() !== "");
    return match ? String(match) : "";
  }, [selectedOrder]);

  const selectedPlanRecord = useMemo(() => {
    if (selectedPlanId != null) {
      const matchById = planByIdMap.get(String(selectedPlanId));
      if (matchById) {
        return matchById;
      }
    }
    if (selectedPlanNumber) {
      const normalized = selectedPlanNumber.trim().toLowerCase();
      const matchByNumber = planByNumberMap.get(normalized);
      if (matchByNumber) {
        return matchByNumber;
      }
    }
    return undefined;
  }, [planByIdMap, planByNumberMap, selectedPlanId, selectedPlanNumber]);

  const planRecordFromFields = useMemo(() => {
    if (sizingPlanIdValue) {
      const matchById = planByIdMap.get(String(sizingPlanIdValue));
      if (matchById) {
        return matchById;
      }
    }
    if (sizingPlanNoValue) {
      const normalized = sizingPlanNoValue.trim().toLowerCase();
      if (normalized) {
        const matchByNumber = planByNumberMap.get(normalized);
        if (matchByNumber) {
          return matchByNumber;
        }
      }
    }
    return undefined;
  }, [planByIdMap, planByNumberMap, sizingPlanIdValue, sizingPlanNoValue]);

  const fetchedPlanRecord = selectedPlanId != null ? fetchedPlanCache[String(selectedPlanId)] : undefined;

  useEffect(() => {
    if (selectedPlanId == null) return;
    const cacheKey = String(selectedPlanId);
    if (planByIdMap.has(cacheKey) || fetchedPlanRecord) return;
    let isMounted = true;
    (async () => {
      try {
        const response: any = await dispatch(getSizingPlanById(Number(selectedPlanId))).unwrap();
        const payload = response?.data?.data ?? response?.data?.items ?? response?.data ?? response;
        const planEntry = Array.isArray(payload) ? payload[0] : payload;
        if (planEntry && isMounted) {
          setFetchedPlanCache((prev) => ({ ...prev, [cacheKey]: planEntry }));
        }
      } catch {
        if (isMounted) {
          setFetchedPlanCache((prev) => ({ ...prev, [cacheKey]: null }));
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [dispatch, selectedPlanId, planByIdMap, fetchedPlanRecord]);

  

  const resolvePlanFromRecord = useCallback(
    (record: any) => {
      if (!record) {
        return undefined;
      }
      if (record?.sizingPlan) {
        return record.sizingPlan;
      }
      const idCandidates = [record?.sizingPlanId, record?.planId, record?.sizingPlan?.id, record?.plan?.id];
      for (const candidate of idCandidates) {
        if (candidate == null) continue;
        const match = planByIdMap.get(String(candidate));
        if (match) {
          return match;
        }
      }
      const numberCandidates = [
        record?.sizingPlanNo,
        record?.planNo,
        record?.planNumber,
        record?.sizingPlan?.sizingPlanNo,
        record?.plan?.planNo,
      ];
      for (const candidate of numberCandidates) {
        if (candidate == null) continue;
        const normalized = String(candidate).trim().toLowerCase();
        if (!normalized) continue;
        const match = planByNumberMap.get(normalized);
        if (match) {
          return match;
        }
      }
      return undefined;
    },
    [planByIdMap, planByNumberMap],
  );

  const inferredPlanRecord = useMemo(() => resolvePlanFromRecord(selectedOrder), [resolvePlanFromRecord, selectedOrder]);
  const activePlanRecord = selectedPlanRecord ?? inferredPlanRecord ?? fetchedPlanRecord ?? planRecordFromFields;

  const extendedSalesOrderLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    salesOrderLabelMap.forEach((label, key) => {
      if (label && String(label).trim()) {
        map.set(key, label);
      }
    });
    const register = (idValue: any, labelValue: any) => {
      const key = idValue != null ? String(idValue).trim() : "";
      const normalizedLabel = labelValue != null ? String(labelValue).trim() : "";
      if (!key || !normalizedLabel) {
        return;
      }
      if (!map.has(key)) {
        map.set(key, normalizedLabel);
      }
    };
    const visited = new WeakSet<object>();
    const harvest = (node: any, depth = 0) => {
      if (!node || depth > 3) {
        return;
      }
      if (Array.isArray(node)) {
        node.forEach((entry) => harvest(entry, depth));
        return;
      }
      if (typeof node !== "object") {
        return;
      }
      if (visited.has(node)) {
        return;
      }
      visited.add(node);
      const labelCandidates = [
        node?.salesOrderNo,
        node?.salesOrderNumber,
        node?.orderNo,
        node?.salesOrderCode,
        node?.salesOrder?.salesOrderNo,
        node?.salesOrder?.orderNo,
      ];
      const label = labelCandidates.find((value) => value != null && String(value).trim() !== "");
      if (label) {
        [
          node?.salesOrderId,
          node?.salesId,
          node?.salesOrder?.id,
          node?.salesOrderDetail?.salesOrderId,
          node?.orderId,
        ].forEach((candidate) => register(candidate, label));
      }
      Object.values(node).forEach((value) => {
        if (depth >= 3) return;
        if (value && (Array.isArray(value) || typeof value === "object")) {
          harvest(value, depth + 1);
        }
      });
    };
    harvest(activePlanRecord);
    harvest(selectedOrder);
    return map;
  }, [salesOrderLabelMap, activePlanRecord, selectedOrder]);

  const resolveSalesOrderLabelById = useCallback(
    (id?: string | number | null) => {
      if (id == null) return "";
      const key = String(id).trim();
      if (!key) return "";
      return extendedSalesOrderLabelMap.get(key) || "";
    },
    [extendedSalesOrderLabelMap],
  );

  
  const applyReferenceLabels = useCallback(
    (rows: BeamDetailRow[]): BeamDetailRow[] => {
      if (!Array.isArray(rows) || !rows.length) {
        return rows;
      }
      return rows.map((row) => {
        let updatedRow = row;
        const contractKey = row.weavingContractId != null ? String(row.weavingContractId) : "";
        if (contractKey) {
          const label = weavingContractLabelMap.get(contractKey);
          if (label && label !== row.weavingContractNo) {
            updatedRow = updatedRow === row ? { ...row } : updatedRow;
            updatedRow.weavingContractNo = label;
          }
        }
        const resolvedSalesOrderLabel = resolveSalesOrderLabelById(row.salesOrderId);
        if (resolvedSalesOrderLabel && resolvedSalesOrderLabel !== row.salesOrderNo) {
          updatedRow = updatedRow === row ? { ...row } : updatedRow;
          updatedRow.salesOrderNo = resolvedSalesOrderLabel;
        }
        return updatedRow;
      });
    },
    [resolveSalesOrderLabelById, weavingContractLabelMap],
  );

  const extractPendingBeamDetails = (details: any) =>
    extractArray(details).filter((detail: any) => isPendingSizingBeamOutward(detail?.isBeamOutward));

  const activePlanBeamDetails = useMemo(() => {
    return extractPendingBeamDetails(activePlanRecord?.sizingBeamDetails);
  }, [activePlanRecord]);
  const { planContractOptions, planContractMetaMap } = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const meta = new Map<
      string,
      { label: string; vendorId: string; vendorName: string; salesOrderId: string; salesOrderNo: string }
    >();
    const seen = new Set<string>();
    const registerContract = (source: any) => {
      const rawId = source?.weavingContractId ?? source?.contractId ?? source?.weavingContract?.id;
      if (rawId == null) {
        return;
      }
      const value = String(rawId);
      if (seen.has(value)) {
        return;
      }
      const displayMeta = weavingContractDisplayMap.get(value);
      const label =
        source?.weavingContractNo ||
        source?.contractNo ||
        source?.weavingContractNumber ||
        displayMeta?.label ||
        weavingContractLabelMap.get(value) ||
        `WC-${value}`;
      const vendorIdRaw = source?.weavingVendorId ?? source?.vendorId ?? source?.vendor?.id;
      const vendorId = vendorIdRaw != null ? String(vendorIdRaw) : displayMeta?.vendorId || "";
      const vendorName =
        (vendorId && vendorLabelMap.get(vendorId)) ||
        source?.weaverName ||
        source?.vendorName ||
        source?.weavingVendorName ||
        displayMeta?.vendorName ||
        "";
      const salesOrderIdRaw = source?.salesOrderId ?? source?.salesId ?? source?.salesOrder?.id;
      const salesOrderId = salesOrderIdRaw != null ? String(salesOrderIdRaw) : "";
      const inlineSalesOrder = source?.salesOrder || source?.salesOrderDetail || {};
      const salesOrderNo =
        resolveSalesOrderLabelById(salesOrderId) ||
        source?.salesOrderNo ||
        source?.salesOrderNumber ||
        source?.orderNo ||
        inlineSalesOrder?.salesOrderNo ||
        inlineSalesOrder?.salesOrderNumber ||
        inlineSalesOrder?.orderNo ||
        "";
      options.push({ value, label });
      meta.set(value, {
        label,
        vendorId,
        vendorName,
        salesOrderId,
        salesOrderNo,
      });
      seen.add(value);
    };

    activePlanBeamDetails.forEach((detail: any) => registerContract(detail));
    // Edit mode can contain already-outward rows whose contract ids are not in pending plan details.
    // Include contracts from current rows as fallback so dropdown can display existing selected values.
    beamRows.forEach((row) => registerContract(row));
    return { planContractOptions: options, planContractMetaMap: meta };
  }, [
    activePlanBeamDetails,
    beamRows,
    salesOrderLabelMap,
    vendorLabelMap,
    weavingContractDisplayMap,
    weavingContractLabelMap,
    resolveSalesOrderLabelById,
  ]);

  const planVendorName = useMemo(() => resolvePlanVendorName(activePlanRecord), [activePlanRecord, resolvePlanVendorName]);

  

  const applyPlanContractMeta = useCallback(
    (rows: BeamDetailRow[]): BeamDetailRow[] => {
      if (!planContractMetaMap.size || !Array.isArray(rows) || !rows.length) {
        return rows;
      }
      let hasChanges = false;
      const updatedRows = rows.map((row) => {
        if (!row.weavingContractId) {
          return row;
        }
        const contractKey = String(row.weavingContractId);
        const meta = contractKey ? planContractMetaMap.get(contractKey) : undefined;
        if (!meta) {
          return row;
        }
        let draft = row;
        const assign = (field: keyof BeamDetailRow, value: string) => {
          const normalized = value ?? "";
          if (draft[field] === normalized) {
            return;
          }
          draft = draft === row ? { ...row } : draft;
          draft[field] = normalized;
          hasChanges = true;
        };
        assign("weavingContractNo", meta.label || "");
        assign("weavingVendorId", meta.vendorId || "");
        assign("weavingVendorName", meta.vendorName || "");
        assign("salesOrderId", meta.salesOrderId || "");
        assign("salesOrderNo", resolveSalesOrderLabelById(meta.salesOrderId) || meta.salesOrderNo || "");
        return draft;
      });
      return hasChanges ? updatedRows : rows;
    },
    [planContractMetaMap, resolveSalesOrderLabelById],
  );

  const enrichRowsWithMetadata = useCallback(
    (rows: BeamDetailRow[]): BeamDetailRow[] => applyPlanContractMeta(applyReferenceLabels(rows)),
    [applyPlanContractMeta, applyReferenceLabels],
  );

  const setRowsWithReferences = useCallback(
    (updater: BeamDetailRow[] | ((prev: BeamDetailRow[]) => BeamDetailRow[])) => {
      if (typeof updater === "function") {
        setBeamRows((prev) => enrichRowsWithMetadata((updater as (rows: BeamDetailRow[]) => BeamDetailRow[])(prev)));
      } else {
        setBeamRows(enrichRowsWithMetadata(updater));
      }
    },
    [enrichRowsWithMetadata],
  );

  const issuedTradingCompanyId = useMemo(() => {
    const normalized = planVendorName.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    const id = companyNameIdMap.get(normalized);
    return id != null ? Number(id) : null;
  }, [planVendorName, companyNameIdMap]);

  const beamRowVendors = useMemo(() => {
    const ids = new Set<string>();
    const labels = new Set<string>();
    beamRows.forEach((row) => {
      if (!row.weavingContractId && !row.weavingVendorId && !row.weavingVendorName) {
        return;
      }
      const resolvedVendorId = (row.weavingVendorId || "").trim();
      if (resolvedVendorId) {
        ids.add(resolvedVendorId);
      }
      const vendorLabel = resolveContractVendorLabel(
        row.weavingContractId,
        resolvedVendorId,
        row.weavingContractNo,
        row.weavingVendorName,
      );
      if (vendorLabel) {
        labels.add(vendorLabel);
      }
    });
    return { ids: Array.from(ids), labels: Array.from(labels) };
  }, [beamRows, resolveContractVendorLabel]);

  const shouldAllowContractSelection = orderTypeValue === "Internal" && planContractOptions.length > 1;

  const handleContractSelection = useCallback(
    (tempId: string, contractId: string) => {
      setRowsWithReferences((rows) =>
        rows.map((row) => {
          if (row.tempId !== tempId) {
            return row;
          }
          const meta = contractId ? planContractMetaMap.get(contractId) : undefined;
          return {
            ...row,
            weavingContractId: contractId,
            weavingContractNo: meta?.label || "",
            weavingVendorId: meta?.vendorId || "",
            weavingVendorName: meta?.vendorName || "",
            salesOrderId: meta?.salesOrderId || "",
            salesOrderNo: meta?.salesOrderNo || "",
          };
        }),
      );
    },
    [planContractMetaMap, setRowsWithReferences],
  );

  const deliveryVendorIds = useMemo(() => {
    const ids = new Set<string>(beamRowVendors.ids);
    const pushId = (value: any) => {
      if (value == null) {
        return;
      }
      const normalized = String(value).trim();
      if (!normalized) {
        return;
      }
      const numeric = Number(normalized);
      if (!Number.isFinite(numeric)) {
        return;
      }
      ids.add(String(numeric));
    };
    const pushLabel = (label?: string) => {
      const normalized = label ? String(label).trim().toLowerCase() : "";
      if (!normalized) {
        return;
      }
      const mapped = vendorNameIdMap.get(normalized);
      if (mapped) {
        ids.add(mapped);
      }
    };
    if (!ids.size) {
      const collectFromDetails = (details: any) => {
        extractPendingBeamDetails(details).forEach((detail: any) => {
          pushId(detail?.weavingVendorId ?? detail?.vendorId ?? detail?.vendor?.id);
          pushLabel(detail?.weaverName ?? detail?.vendorName ?? detail?.weavingVendorName);
        });
      };
      const collectFromRecord = (record: any) => {
        if (!record) {
          return;
        }
        pushId(record?.weavingVendorId ?? record?.vendorId ?? record?.vendor?.id);
        pushLabel(record?.vendorName ?? record?.weaverName ?? record?.vendor?.vendorName);
        collectFromDetails(record?.sizingBeamDetails);
        collectFromDetails(record?.beamDetails);
        collectFromDetails(record?.productionDetails);
      };
      collectFromRecord(activePlanRecord);
      collectFromRecord(selectedOrder);
      const normalizedDeliveries = Array.isArray(deliveryValues) ? deliveryValues : [];
      normalizedDeliveries.forEach((entry) => {
        pushId(entry);
        if (!Number.isFinite(Number(entry))) {
          pushLabel(String(entry));
        }
      });
    }
    return Array.from(ids);
  }, [beamRowVendors.ids, activePlanRecord, selectedOrder, deliveryValues, vendorNameIdMap]);

  const deliveryBadgeValues = useMemo(() => {
    const normalizeValues = (values: any) => {
      if (!Array.isArray(values)) {
        return [] as string[];
      }
      return values
        .map((value) => {
          const normalized = String(value).trim();
          if (!normalized) {
            return "";
          }
          return vendorLabelMap.get(normalized) || normalized;
        })
        .filter((value) => value !== "");
    };
    if (orderTypeValue !== "Internal") {
      return normalizeValues(deliveryValues);
    }
    const labels: string[] = [];
    const seen = new Set<string>();
    const addLabel = (label?: string) => {
      const normalized = label ? String(label).trim() : "";
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      labels.push(normalized);
    };
    beamRowVendors.labels.forEach(addLabel);
    if (labels.length) {
      return labels;
    }
    const appendFromContract = (contractId?: any, vendorId?: any, fallbackContract?: any, fallbackVendor?: any) => {
      const label = resolveContractVendorLabel(contractId, vendorId, fallbackContract, fallbackVendor);
      if (label) {
        addLabel(label);
      }
    };
    activePlanBeamDetails.forEach((detail: any) => {
      appendFromContract(
        detail?.weavingContractId ?? detail?.contractId ?? detail?.weavingContract?.id,
        detail?.weavingVendorId ?? detail?.vendorId ?? detail?.vendor?.id,
        detail?.weavingContractNo ?? detail?.contractNo ?? detail?.weavingContractNumber,
        detail?.weaverName ?? detail?.vendorName ?? detail?.weavingVendorName,
      );
    });
    if (!labels.length) {
      beamRows.forEach((row) => {
        appendFromContract(row.weavingContractId, row.weavingVendorId, row.weavingContractNo, row.weavingVendorName);
      });
    }
    if (!labels.length) {
      normalizeValues(deliveryValues).forEach(addLabel);
    }
    return labels;
  }, [orderTypeValue, deliveryValues, activePlanRecord, beamRows, resolveContractVendorLabel, vendorLabelMap, beamRowVendors.labels]);

  const yarnOptions = useMemo(() => {
    const options = new Map<string, string>();
    const addOption = (id: any, label: any) => {
      if (id == null) return;
      const value = String(id);
      if (!value) return;
      const resolvedLabel = label != null && String(label).trim() !== "" ? String(label) : `Yarn ${value}`;
      if (!options.has(value)) {
        options.set(value, resolvedLabel);
      }
    };
    const addFromCollection = (collection: any) => {
      extractArray(collection).forEach((item: any) => {
        addOption(item?.yarnId ?? item?.id, item?.yarnName ?? item?.name ?? item?.label);
      });
    };
    if (selectedOrder) {
      addFromCollection(selectedOrder.items);
      addFromCollection(selectedOrder.yarnRequirements);
      addFromCollection(selectedOrder.yarnDetails);
      addOption(selectedOrder.yarnId ?? selectedOrder.warpYarnId, selectedOrder.yarnName ?? selectedOrder.warpYarnName);
    }
    if (activePlanRecord) {
      addFromCollection(activePlanRecord.items);
      addFromCollection(activePlanRecord.yarnDetails);
      addOption(activePlanRecord.yarnId, activePlanRecord.yarnName);
    }
    return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
  }, [selectedOrder, activePlanRecord]);

  const handleOrderTypeSelect = useCallback(
    (_nextValue: "Internal" | "External" | "") => {
      if (mode === "edit") return;
      setValue("sizingOrderId", "");
      setValue("sizingOrderNo", "");
      setValue("sizingPlanId", "");
      setValue("sizingPlanNo", "");
      setValue("buyerName", "");
      setValue("buyerId", "");
      setValue("deliveryAt", []);
      setValue("yarnName", "");
      setValue("yarnId", "");
      setBeamRowError("");
      setRowsWithReferences([createEmptyBeamRow()]);
    },
    [mode, setValue, setBeamRowError, setRowsWithReferences],
  );

  const handleYarnSelection = useCallback(
    (nextValue: string) => {
      const option = yarnOptions.find((item) => item.value === nextValue);
      setValue("yarnName", option?.label || "");
    },
    [setValue, yarnOptions],
  );

  const canSelectYarn = Boolean(selectedOrder && yarnOptions.length);


  const deriveInternalDeliveryNames = useCallback(
    (planRecord: any, fallbackName: string) => {
      if (!planRecord) {
        return fallbackName ? [fallbackName] : [];
      }
      const resolvedDeliveries = resolveDeliveryNames(planRecord, fallbackName).filter(Boolean);
      if (resolvedDeliveries.length) {
        return resolvedDeliveries;
      }
      const badges = new Set<string>();
      const pushBadge = (
        contractId?: any,
        vendorId?: any,
        fallbackContract?: any,
        fallbackVendor?: any,
      ) => {
        const label = resolveContractVendorLabel(contractId, vendorId, fallbackContract, fallbackVendor);
        if (label) {
          badges.add(label);
        }
      };
      const beamDetails = extractPendingBeamDetails(planRecord?.sizingBeamDetails);
      beamDetails.forEach((detail: any) => {
        pushBadge(
          detail?.weavingContractId ?? detail?.contractId ?? detail?.weavingContract?.id,
          detail?.weavingVendorId ?? detail?.vendorId ?? detail?.vendor?.id,
          detail?.weavingContractNo ?? detail?.contractNo ?? detail?.weavingContractNumber,
          detail?.weaverName ?? detail?.vendorName ?? detail?.weavingVendorName,
        );
      });
      pushBadge(
        planRecord?.weavingContractId ?? planRecord?.contractId ?? planRecord?.weavingContract?.id,
        planRecord?.weavingVendorId ?? planRecord?.vendorId,
        planRecord?.weavingContractNo ?? planRecord?.contractNo,
        planRecord?.weaverName ?? planRecord?.vendorName,
      );
      if (badges.size) {
        return Array.from(badges);
      }
      return fallbackName ? [fallbackName] : [];
    },
    [resolveContractVendorLabel],
  );

  useEffect(() => {
    const guardValue = mode === "edit" ? initialRecord : initialRecord || "__create__";
    if (resetKeyRef.current && resetKeyRef.current.mode === mode && resetKeyRef.current.record === guardValue) {
      return;
    }
    resetKeyRef.current = { mode, record: guardValue };
    const resolvedOutwardDate =
      normalizeDateValue(initialRecord?.outwardDate ?? initialRecord?.date ?? initialRecord?.createdAt) ||
      getCurrentDate();

    if (mode === "edit" && initialRecord) {
      const resolvedBuyerName = initialRecord?.buyerName || resolveBuyerName(initialRecord, "");
      const resolvedBuyerId = resolveBuyerId(initialRecord);
      const resolvedOrderType = resolveOrderType(initialRecord, initialRecord?.orderType || "");
      const planRecordForInitial = resolvePlanFromRecord(initialRecord);
      const vendorDeliveries = resolvedOrderType === "Internal"
        ? deriveInternalDeliveryNames(planRecordForInitial, resolvedBuyerName)
        : [];
      const storedDeliveryValues = Array.isArray(initialRecord?.deliveryAt)
        ? initialRecord.deliveryAt.map((item: any) => String(item)).filter(Boolean)
        : [];
      let resolvedDeliveryAt = storedDeliveryValues;
      if (
        resolvedOrderType === "Internal" &&
        vendorDeliveries.length &&
        (!resolvedDeliveryAt.length || resolvedDeliveryAt.every((entry:any) => entry === resolvedBuyerName))
      ) {
        resolvedDeliveryAt = vendorDeliveries;
      }
      if (!resolvedDeliveryAt.length) {
        resolvedDeliveryAt = resolveDeliveryNames(initialRecord, resolvedBuyerName);
      }
      reset({
        id: initialRecord?.id ?? null,
        outwardDate: resolvedOutwardDate,
        orderType: resolvedOrderType,
        sizingOrderId: initialRecord?.sizingOrderId != null ? String(initialRecord.sizingOrderId) : "",
        sizingOrderNo: initialRecord?.sizingOrderNo || resolveOrderLabel(initialRecord) || "",
        sizingPlanId: initialRecord?.sizingPlanId != null ? String(initialRecord.sizingPlanId) : "",
        sizingPlanNo: initialRecord?.sizingPlanNo || resolvePlanLabel(initialRecord) || "",
        buyerName: resolvedBuyerName,
        buyerId: resolvedBuyerId != null ? String(resolvedBuyerId) : "",
        deliveryAt: resolvedDeliveryAt,
        yarnName: initialRecord?.yarnName || "",
        yarnId: initialRecord?.yarnId != null ? String(initialRecord.yarnId) : "",
      });
      setRowsWithReferences(hydrateBeamRows(initialRecord, initialRecord?.orderType, true));
      return;
    }

    reset({
      id: null,
      outwardDate: resolvedOutwardDate,
      orderType: "",
      sizingOrderId: "",
      sizingOrderNo: "",
      sizingPlanId: "",
      sizingPlanNo: "",
      buyerName: "",
      buyerId: "",
      deliveryAt: [],
      yarnName: "",
      yarnId: "",
    });
    setRowsWithReferences([createEmptyBeamRow()]);
  }, [initialRecord, mode, reset, setRowsWithReferences, deriveInternalDeliveryNames, resolvePlanFromRecord]);

  useEffect(() => {
    setBeamRows((rows) => enrichRowsWithMetadata(rows));
  }, [enrichRowsWithMetadata]);

  const sizingProductionList = useMemo(() => {
    const raw = sizingProductionState?.sizingProductionList;
    if (!raw) return [];
    if (Array.isArray(raw?.data?.data)) return raw.data.data;
    if (Array.isArray(raw?.data?.items)) return raw.data.items;
    if (Array.isArray(raw?.data)) return raw.data;
    return extractArray(raw);
  }, [sizingProductionState?.sizingProductionList]);

  const matchSizingProductions = useCallback(
    (order: any, plan: any, selectedOrderId?: string) => {
      const { orderIdCandidates, orderTokens } = collectOrderIdentifiers(order, plan, selectedOrderId);
      if (!orderIdCandidates.size && !orderTokens.size) {
        return [];
      }
      return sizingProductionList.filter((production: any) => {
        const productionIds = [
          production?.sizingOrderId,
          production?.sizingJobWorkOrderId,
          production?.sizingOrder?.id,
          production?.sizingOrder?.sizingJobWorkOrderId,
        ]
          .map((value) => (value == null ? "" : String(value).trim()))
          .filter(Boolean);
        if (productionIds.some((value) => orderIdCandidates.has(value))) {
          return true;
        }
        if (!orderTokens.size) {
          return false;
        }
        const productionTokens = buildOrderTokens(
          production?.sizingOrderNo,
          production?.sizingJobWorkOrderNo,
          production?.jobWorkOrderNo,
          production?.orderNo,
          production?.sizingOrder?.sizingOrderNo,
          production?.sizingOrder?.orderNo,
        );
        if (!productionTokens.length) {
          return false;
        }
        return productionTokens.some((token) => orderTokens.has(token));
      });
    },
    [sizingProductionList],
  );

  const enrichRowsWithPlanDetails = useCallback((rows: BeamDetailRow[], planRecord: any) => {
    const planDetails = extractPendingBeamDetails(planRecord?.sizingBeamDetails);
    if (!planDetails.length || !Array.isArray(rows) || !rows.length) {
      return rows;
    }
    let hasChanges = false;
    const fallbackDetail = planDetails[planDetails.length - 1];
    const updatedRows = rows.map((row, index) => {
      const detail = planDetails[index] || fallbackDetail;
      if (!detail) {
        return row;
      }
      let rowDraft = row;
      const assignValue = (field: keyof BeamDetailRow, value: any) => {
        if (value == null) {
          return;
        }
        const normalized = String(value).trim();
        if (!normalized) {
          return;
        }
        const existing = rowDraft[field];
        if (existing && String(existing).trim()) {
          return;
        }
        if (rowDraft === row) {
          rowDraft = { ...row };
        }
        rowDraft[field] = normalized;
        hasChanges = true;
      };
      assignValue("weavingContractId", detail?.weavingContractId ?? detail?.contractId);
      assignValue("weavingContractNo", detail?.weavingContractNo || detail?.contractNo || detail?.weavingContractNumber);
      assignValue("weavingVendorId", detail?.weavingVendorId ?? detail?.vendorId ?? detail?.vendor?.id);
      assignValue("weavingVendorName", detail?.weaverName ?? detail?.vendorName ?? detail?.vendor?.vendorName);
      const detailSalesOrderId = detail?.salesOrderId ?? detail?.salesId;
      const detailSalesOrderNo =
        resolveSalesOrderLabelById(detailSalesOrderId) ||
        detail?.salesOrderNo ||
        detail?.salesOrderNumber ||
        detail?.orderNo;
      assignValue("salesOrderId", detailSalesOrderId);
      assignValue("salesOrderNo", detailSalesOrderNo);
      const shrinkageCandidate = detail?.shrinkage ?? detail?.shrinkagePercent ?? detail?.shrinkageValue;
      assignValue("shrinkage", shrinkageCandidate);
      const beamMetersSource =
        rowDraft.beamMeters ||
        detail?.beamMeters ||
        detail?.beamMeter ||
        detail?.meters ||
        detail?.warpMeters;
      const widthSource =
        rowDraft.width ||
        detail?.width ||
        detail?.fabricPanelWidth ||
        detail?.beamWidth;
      const shrinkageForCalculation = shrinkageCandidate ?? rowDraft.shrinkage;
      const expectedValue = calculateExpectedFabricMeter(beamMetersSource, widthSource, shrinkageForCalculation);
      assignValue("expectedFabricMeter", expectedValue);
      return rowDraft;
    });
    return hasChanges ? updatedRows : rows;
  }, [resolveSalesOrderLabelById]);

  const buildBeamRows = useCallback(
    (orderTypeResolved: string, order: any, plan: any, selectedOrderId?: string, matchingProductions?: any[]) => {
      const productionMatches = matchingProductions ?? matchSizingProductions(order, plan, selectedOrderId);
      const productionRows = productionMatches.flatMap((production: any) => {
        const normalizedProduction = filterPendingProductionDetails(production);
        if (!normalizedProduction) {
          return [];
        }
        return hydrateBeamRows(normalizedProduction, orderTypeResolved, orderTypeResolved === "External");
      });
      if (orderTypeResolved === "External") {
        return productionRows.length ? productionRows : [createEmptyBeamRow()];
      }
      if (!productionRows.length) {
        return [createEmptyBeamRow()];
      }
      const resolvedRows = plan ? enrichRowsWithPlanDetails(productionRows, plan) : productionRows;
      return resolvedRows;
    },
    [enrichRowsWithPlanDetails, matchSizingProductions],
  );

  useEffect(() => {
    if (orderTypeValue === "External") return;
    if (!activePlanRecord) return;
    setRowsWithReferences((rows) => enrichRowsWithPlanDetails(rows, activePlanRecord));
  }, [enrichRowsWithPlanDetails, orderTypeValue, activePlanRecord, setRowsWithReferences]);

  useEffect(() => {
    if (!sizingOrderIdValue) return;
    if (!selectedOrder) return;
    const planRecordForOrder = activePlanRecord;
    const matchingProductions = matchSizingProductions(selectedOrder, planRecordForOrder, sizingOrderIdValue);
    const fallbackType = orderTypeValue || (planRecordForOrder ? "Internal" : "External");
    const resolvedType = resolveOrderType(selectedOrder, fallbackType) || fallbackType;
    if (orderTypeValue !== resolvedType) {
      setValue("orderType", resolvedType as any);
    }
    setValue("sizingOrderNo", resolveOrderLabel(selectedOrder) || "");
    const planIdCandidate =
      planRecordForOrder?.id ??
      planRecordForOrder?.sizingPlanId ??
      (selectedPlanId != null && Number.isFinite(Number(selectedPlanId)) ? Number(selectedPlanId) : null);
    const planNoCandidate = resolvePlanLabel(planRecordForOrder) || selectedPlanNumber || "";
    if (resolvedType === "Internal" && (planIdCandidate != null || planNoCandidate)) {
      setValue("sizingPlanId", planIdCandidate != null ? String(planIdCandidate) : "");
      setValue("sizingPlanNo", planNoCandidate);
    } else {
      setValue("sizingPlanId", "");
      setValue("sizingPlanNo", "");
    }
    const productionFallback = matchingProductions[0];
    const orderBuyerName = resolveBuyerName(selectedOrder, "");
    const planBuyerName = resolveBuyerName(planRecordForOrder, orderBuyerName);
    const productionBuyerName = resolveBuyerName(productionFallback, orderBuyerName);
    const internalBuyerName = planBuyerName || orderBuyerName || productionBuyerName;
    const fallbackBuyerName = resolvedType === "External" ? productionBuyerName || orderBuyerName || planBuyerName : internalBuyerName;
    const fallbackBuyerId = resolvedType === "External"
      ? resolveBuyerId(productionFallback) ?? resolveBuyerId(selectedOrder) ?? resolveBuyerId(planRecordForOrder)
      : resolveBuyerId(planRecordForOrder) ?? resolveBuyerId(selectedOrder) ?? resolveBuyerId(productionFallback);
    const candidateRecords = [productionFallback, selectedOrder, planRecordForOrder];
    const derivedBuyer =
      resolvedType === "External"
        ? candidateRecords
            .map((record) => resolveExternalBuyerFromRecord(record, customerIdNameMap))
            .find((entry) => entry?.buyerId != null)
        : candidateRecords
            .map((record) => resolveInternalBuyerFromRecord(record, companyIdNameMap))
            .find((entry) => entry?.buyerId != null);
    const finalBuyerName = derivedBuyer?.buyerName || fallbackBuyerName;
    const finalBuyerId = derivedBuyer?.buyerId ?? fallbackBuyerId;

    const currentValues = getValues();
    if (currentValues.buyerName !== finalBuyerName) {
      setValue("buyerName", finalBuyerName);
    }
    const finalBuyerIdStr = finalBuyerId != null ? String(finalBuyerId) : "";
    if (currentValues.buyerId !== finalBuyerIdStr) {
      setValue("buyerId", finalBuyerIdStr);
    }

    const deliveryNames = resolvedType === "External"
      ? finalBuyerName
        ? [finalBuyerName]
        : []
      : deriveInternalDeliveryNames(planRecordForOrder, finalBuyerName);
    
    if (JSON.stringify(currentValues.deliveryAt) !== JSON.stringify(deliveryNames)) {
      setValue("deliveryAt", deliveryNames);
    }

    if (mode === "create") {
      const derivedRows = buildBeamRows(resolvedType, selectedOrder, planRecordForOrder, sizingOrderIdValue, matchingProductions);
      if (lastAutoPopulatedOrderIdRef.current !== sizingOrderIdValue) {
        setRowsWithReferences(derivedRows);
        lastAutoPopulatedOrderIdRef.current = sizingOrderIdValue;
      }
    }
  }, [
    sizingOrderIdValue,
    selectedOrder,
    activePlanRecord,
    selectedPlanId,
    selectedPlanNumber,
    orderTypeValue,
    setValue,
    getValues,
    mode,
    buildBeamRows,
    matchSizingProductions,
    customerIdNameMap,
    companyIdNameMap,
    deriveInternalDeliveryNames,
    setRowsWithReferences,
  ]);

  useEffect(() => {
    if (orderTypeValue !== "Internal") return;
    if (!activePlanRecord) return;
    const vendorDeliveries = deriveInternalDeliveryNames(activePlanRecord, buyerNameValue).filter(Boolean);
    if (!vendorDeliveries.length) {
      return;
    }
    const currentDeliveries = Array.isArray(deliveryValues) ? deliveryValues : [];
    const hasSameValues =
      vendorDeliveries.length === currentDeliveries.length &&
      vendorDeliveries.every((value, index) => value === currentDeliveries[index]);
    if (!hasSameValues) {
      setValue("deliveryAt", vendorDeliveries);
    }
  }, [
    orderTypeValue,
    activePlanRecord,
    deriveInternalDeliveryNames,
    buyerNameValue,
    deliveryValues,
    setValue,
  ]);

  useEffect(() => {
    if (sizingOrderIdValue || mode === "edit") return;
    setValue("sizingOrderNo", "");
    setValue("sizingPlanId", "");
    setValue("sizingPlanNo", "");
    setValue("buyerName", "");
    setValue("buyerId", "");
    setValue("deliveryAt", []);
    setValue("yarnName", "");
    setValue("yarnId", "");
    setBeamRowError("");
    setRowsWithReferences([createEmptyBeamRow()]);
  }, [sizingOrderIdValue, mode, setValue, setRowsWithReferences]);

  useEffect(() => {
    if (!selectedOrder) return;
    if (yarnOptions.length) {
      const existing = yarnOptions.find((option) => option.value === yarnIdValue);
      if (existing) {
        if (yarnNameValue !== existing.label) {
          setValue("yarnName", existing.label);
        }
        return;
      }
      const fallback = yarnOptions[0];
      setValue("yarnId", fallback.value);
      setValue("yarnName", fallback.label);
      return;
    }
    if (!yarnIdValue) {
      const fallbackId = selectedOrder?.yarnId ?? selectedOrder?.warpYarnId ?? selectedPlanRecord?.yarnId ?? null;
      const fallbackName = selectedOrder?.yarnName || selectedOrder?.warpYarnName || selectedPlanRecord?.yarnName || "";
      setValue("yarnId", fallbackId != null ? String(fallbackId) : "");
      setValue("yarnName", fallbackName);
    }
  }, [selectedOrder, selectedPlanRecord, yarnOptions, yarnIdValue, yarnNameValue, setValue]);

  const updateBeamRow = (tempId: string, updates: Partial<BeamDetailRow>) => {
    setBeamRowError("");
    setRowsWithReferences((rows) => rows.map((row) => (row.tempId === tempId ? { ...row, ...updates } : row)));
  };

  const handleRemoveRow = (tempId: string) => {
    setBeamRowError("");
    setRowsWithReferences((rows) => {
      if (rows.length <= 1) {
        return [createEmptyBeamRow()];
      }
      const filtered = rows.filter((row) => row.tempId !== tempId);
      return filtered.length ? filtered : [createEmptyBeamRow()];
    });
  };

  const handleAddRow = () => {
    setBeamRowError("");
    setRowsWithReferences((prev) => [...prev, createEmptyBeamRow()]);
  };

  const summary = useMemo(() => summarizeBeamRows(hasBeamData ? beamRows : []), [beamRows, hasBeamData]);

  const isSavingRef = useRef(false);
              const hasGeneratedNumberRef = useRef(false);
          
           // Generate document number for new beam inward entries
              useEffect(() => {
                  const generateDocumentNumber = async () => {
                      // Only generate for new entries (not editing existing ones)
                      if (initialRecord || hasGeneratedNumberRef.current) {
                          return;
                      }
                      try {
                          const result = await documentNumberService.generateDocumentNumber({
                              screenName: 'Sizing Beam Outward'
                          });
                          setValue('sizingBeamOutwardNo', result.documentNumber, { shouldValidate: true });
                          hasGeneratedNumberRef.current = true;
                      } catch (error) {
                          console.error('Failed to generate Sizing Beam Outward number:', error);
                          toast.error('Failed to generate Sizing Beam Outward number');
                      }
                  };
          
                  generateDocumentNumber();
              }, [initialRecord, setValue]);
          
              // Cleanup document number cache if not saved
              useEffect(() => {
                  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                      if (hasGeneratedNumberRef.current && !isSavingRef.current && !initialRecord) {
                          documentNumberService.clearMemoryCache('Sizing Beam Outward');
                      }
                  };
          
                  window.addEventListener('beforeunload', handleBeforeUnload);
          
                  return () => {
                      window.removeEventListener('beforeunload', handleBeforeUnload);
                      if (hasGeneratedNumberRef.current && !isSavingRef.current && !initialRecord) {
                          documentNumberService.clearMemoryCache('Sizing Beam Outward');
                      }
                  };
              }, [initialRecord]);
          
            useEffect(() => {
              setValue('sizingBeamOutwardNo', initialRecord?.sizingBeamOutwardNo || '') ;
            }, [initialRecord, setValue]);
            
  const onSubmit = async (formData: SizingBeamOutwardFormData) => {

     const isEditMode = Boolean(initialRecord?.id);
       let sizingBeamOutwardNo = formData.sizingBeamOutwardNo || initialRecord?.sizingBeamOutwardNo || "";
            if (!initialRecord?.id && !sizingBeamOutwardNo) {
                try {
                    const docResponse = await documentNumberService.generateDocumentNumber({
                        screenName: "Sizing Beam Outward"
                    });
                    sizingBeamOutwardNo = docResponse.documentNumber;
                } catch (error) {
                    console.warn("Failed to generate document number:", error);
                }
            }
isSavingRef.current = true;

    const resolvedOrderTypeId = selectedOrder ? resolveOrderTypeId(selectedOrder) : selectedOrderTypeId;
    const payloadIssuedTradingCompanyId = resolvedOrderTypeId === 2 ? null : issuedTradingCompanyId;
    const parseOptionalNumber = (value?: string | number) => {
      if (value == null) return null;
      const normalized = String(value).trim();
      if (!normalized) return null;
      const numeric = Number(normalized);
      return Number.isFinite(numeric) ? numeric : null;
    };
    const payloadRows = beamRows
      .filter((row) => row.sizedBeamNo || row.width || row.totalEnds || row.beamMeters || row.weavingContractId || row.salesOrderId)
      .map((row) => {
        const weavingContractIdValue = row.weavingContractId ? Number(row.weavingContractId) : null;
        const resolvedContractNo = resolveContractLabel(row.weavingContractId, row.weavingContractNo);
        const shrinkageValue = parseOptionalNumber(row.shrinkage);
        const expectedFabricMeterValue = resolvedOrderTypeId === 2 ? null : parseOptionalNumber(row.expectedFabricMeter);
        return {
          sizedBeamNo: row.sizedBeamNo,
          width: Number(row.width || 0),
          totalEnds: Number(row.totalEnds || 0),
          beamMeters: Number(row.beamMeters || 0),
          shrinkage: shrinkageValue,
          expectedFabricMeter: expectedFabricMeterValue,
          flangeNo: row.flangeNo,
          flangeId: row.flangeId ? Number(row.flangeId) : null,
          weavingContractNo: resolvedContractNo,
          salesOrderNo: row.salesOrderNo,
          weavingContractId: weavingContractIdValue,
          salesOrderId: row.salesOrderId ? Number(row.salesOrderId) : null,
          weavingVendorId:
            row.weavingVendorId && Number.isFinite(Number(row.weavingVendorId)) ? Number(row.weavingVendorId) : null,
          issuedTradingCompanyId: payloadIssuedTradingCompanyId != null ? Number(payloadIssuedTradingCompanyId) : null,
          orderTypeId: resolvedOrderTypeId != null ? Number(resolvedOrderTypeId) : null,
        };
      });
    if (!payloadRows.length) {
      setBeamRowError("At least one beam detail is required");
      return;
    }
    setBeamRowError("");

    
    const normalizedOutwardDate = normalizeDateValue(formData.outwardDate);
    const outwardDateForPayload = normalizedOutwardDate || null;
    const requestBody = {
      ...formData,
      sizingBeamOutwardNo: sizingBeamOutwardNo,
      outwardDate: outwardDateForPayload,
      orderTypeId: resolvedOrderTypeId != null ? Number(resolvedOrderTypeId) : null,
      buyerId: formData.buyerId ? Number(formData.buyerId) : null,
      yarnId: formData.yarnId ? Number(formData.yarnId) : null,
      sizingOrderId: formData.sizingOrderId ? Number(formData.sizingOrderId) : null,
      sizingPlanId: formData.sizingPlanId ? Number(formData.sizingPlanId) : null,
      deliveryAt: deliveryVendorIds.length ? deliveryVendorIds : formData.deliveryAt || [],
      companyId: selectedCompanyId != null ? Number(selectedCompanyId) : null,
     
      beamDetails: payloadRows,
      summary: {
        noOfBeams: summary.noOfBeams,
        totalBeamMeters: summary.totalBeamMeters,
        totalEnds: summary.totalEnds,
      },
    };
    setIsSubmitting(true);
    try {
      // alert(JSON.stringify(requestBody));
      // alert("Submitting Sizing Beam Outward:" + JSON.stringify(requestBody));
      // console.log("Submitting Sizing Beam Outward:", requestBody);
      if (isEditMode) {
        await dispatch(
          updateSizingBeamOutward({ id: Number(formData.id), data: requestBody, companyId: selectedCompanyId ?? undefined }),
        ).unwrap();
      } else {
        await dispatch(createSizingBeamOutward(requestBody)).unwrap();
 documentNumberService.clearMemoryCache("Sizing Beam Outward");
      }
      await dispatch(getAllSizingBeamOutward({ offset: 0, limit: 10, companyId: selectedCompanyId ?? undefined }));
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvedOrderTypeIdForRender = useMemo(() => {
    if (selectedOrder) {
      return resolveOrderTypeId(selectedOrder);
    }
    return selectedOrderTypeId;
  }, [selectedOrder, selectedOrderTypeId]);
  const isExternalOrder = resolvedOrderTypeIdForRender === 2 || orderTypeValue === "External";
  const showOrderReferenceColumns = !isExternalOrder;
  const showFlangeColumn = !isExternalOrder;
  const showExpectedFabricMeterColumn = !isExternalOrder;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register("id")} />
      <input type="hidden" {...register("sizingOrderNo")} />
      <input type="hidden" {...register("sizingPlanId")} />
      <input type="hidden" {...register("buyerId")} />
      <input type="hidden" {...register("yarnName")} />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
           <div>
              <label className="block text-sm mb-1">Beam Outward No</label>
              <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                {...register('sizingBeamOutwardNo')} readOnly />
            </div>

           <div>
            <label className="block text-sm font-medium text-gray-700">
              Outward Date<span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              className={`input mt-1 ${errors.outwardDate ? "border-red-500" : ""}`}
              {...register("outwardDate", { required: "Outward Date is required" })}
            />
            {errors.outwardDate && (
              <p className="mt-1 text-xs text-red-500">{String(errors.outwardDate.message)}</p>
            )}
          </div>

           <div>
            <label className="block text-sm font-medium text-gray-700">
              Order Type<span className="text-red-600">*</span>
            </label>
            <CommonSearchableSelect
              {...orderTypeField}
              value={orderTypeValue}
              onValueChange={(value) => {
                handleOrderTypeSelect(value as "Internal" | "External" | "");
              }}
              options={ORDER_TYPE_OPTIONS}
              placeholder="Select Order Type"
              className="mt-1"
              disabled={mode === "edit"}
              error={errors.orderType?.message as string}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sizing Order No<span className="text-red-600">*</span>
            </label>
            <CommonSearchableSelect
              {...register("sizingOrderId", { required: "Sizing Order is required" })}
              options={filteredJobOrderOptions}
              placeholder={orderTypeValue ? "Select Sizing Order" : "Select Order Type First"}
              className="mt-1"
              disabled={mode === "edit" || !orderTypeValue}
              error={errors.sizingOrderId?.message as string}
            />
          
          </div>
         
          {orderTypeValue !== "External" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Sizing Plan No</label>
              <input readOnly {...register("sizingPlanNo")} className="input mt-1 bg-gray-50" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Buyer Name<span className="text-red-600">*</span>
            </label>
            <input
              readOnly
              {...register("buyerName", { required: "Buyer Name is required" })}
              className={`input mt-1 ${errors.buyerName ? "border-red-500" : ""}`}
            />
            {errors.buyerName && <p className="mt-1 text-xs text-red-500">{String(errors.buyerName.message)}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Yarn Name<span className="text-red-600">*</span>
            </label>
            <CommonSearchableSelect
              {...yarnIdField}
              value={yarnIdValue}
              onValueChange={(value) => {
                handleYarnSelection(value);
              }}
              options={yarnOptions}
              placeholder={canSelectYarn ? "Select Yarn" : "Select Sizing Order"}
              className="mt-1"
              disabled={!canSelectYarn}
              error={errors.yarnId?.message as string}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Delivery At</label>
            <div className="mt-1 flex min-h-[44px] flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              {buildDeliveryBadges(deliveryBadgeValues)}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Beam Details</h2>
          {/* <Button type="button" onClick={handleAddRow} className="bg-primary text-white">
            Add Row
          </Button> */}
        </div>
        {hasBeamData ? (
          <div className="overflow-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-2">S.No</th>
                  <th className="border px-2 py-2">Sized Beam No</th>
                  <th className="border px-2 py-2">Width</th>
                  {showExpectedFabricMeterColumn && <th className="border px-2 py-2">Expected Fabric Meter</th>}
                  <th className="border px-2 py-2">Total Ends</th>
                  <th className="border px-2 py-2">Beam Meters</th>
                  <th className="border px-2 py-2">Empty Beam No</th>
                  {showOrderReferenceColumns && (
                    <>
                      <th className="border px-2 py-2">Weaving Contract No</th>
                      <th className="border px-2 py-2">Delivery At</th>
                      <th className="border px-2 py-2">Sales Order No</th>
                    </>
                  )}
                  <th className="border px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {beamRows.map((row, index) => (
                  <tr key={row.tempId} className="odd:bg-white even:bg-gray-50">
                    <td className="border px-2 py-2 text-center">{index + 1}</td>
                    <td className="border px-2 py-2">
                      <input
                        className="input bg-gray-50"
                        value={row.sizedBeamNo}
                        readOnly
                        onChange={(event) => updateBeamRow(row.tempId, { sizedBeamNo: event.target.value })}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        className="input bg-gray-50"
                        value={row.width}
                        readOnly
                        onChange={(event) => updateBeamRow(row.tempId, { width: event.target.value })}
                      />
                    </td>
                    {showExpectedFabricMeterColumn && (
                      <td className="border px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input bg-gray-50"
                          value={row.expectedFabricMeter}
                          readOnly
                        />
                      </td>
                    )}
                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        className="input bg-gray-50"
                        value={row.totalEnds}
                        readOnly
                        onChange={(event) => updateBeamRow(row.tempId, { totalEnds: event.target.value })}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        className="input bg-gray-50"
                        value={row.beamMeters}
                        readOnly
                        onChange={(event) => updateBeamRow(row.tempId, { beamMeters: event.target.value })}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input
                        className="input bg-gray-50"
                        value={row.flangeNo}
                        readOnly
                        onChange={(event) => updateBeamRow(row.tempId, { flangeNo: event.target.value })}
                      />
                    </td>
                    {showOrderReferenceColumns && (
                      <td className="border px-2 py-2">
                        {shouldAllowContractSelection ? (
                          <CommonSearchableSelect
                            value={row.weavingContractId}
                            options={planContractOptions}
                            placeholder="Select Contract"
                            onValueChange={(value) => handleContractSelection(row.tempId, value)}
                          />
                        ) : (
                          <input className="input bg-gray-50" value={row.weavingContractNo} readOnly />
                        )}
                      </td>
                    )}
                    {showOrderReferenceColumns && (
                      <td className="border px-2 py-2">
                        <input
                          className="input bg-gray-50"
                          value={
                            resolveContractVendorLabel(
                              row.weavingContractId,
                              row.weavingVendorId,
                              row.weavingContractNo,
                              row.weavingVendorName,
                            ) || ""
                          }
                          readOnly
                        />
                      </td>
                    )}
                    {showOrderReferenceColumns && (
                      <td className="border px-2 py-2">
                        <input className="input bg-gray-50" value={row.salesOrderNo} readOnly />
                      </td>
                    )}
                    <td className="border px-2 py-2 text-center">
                      <Button
                        type="button"
                        onClick={() => handleRemoveRow(row.tempId)}
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            No data found
          </div>
        )}
        {beamRowError && <p className="text-sm text-red-600">{beamRowError}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">No Of Beams</p>
          <p className="text-2xl font-semibold text-gray-900">{summary.noOfBeams}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total Beam Meters</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(summary.totalBeamMeters)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total Ends</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(summary.totalEnds)}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="rounded-lg border border-gray-300 px-4 py-2" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-white" disabled={isSubmitting || sizingBeamOutwardState.loading}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
