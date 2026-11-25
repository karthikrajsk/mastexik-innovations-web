import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Trash } from "lucide-react";
import { CommonSearchableSelect } from "../ui/CommonSearchableSelect";
import { AppDispatch, RootState } from "@/state/store";
import { getAllSizingJobWorkOrders, getAllSizingJobWorkOrdersByFactoryCompanyId } from "@/state/sizingJobWorkOrderSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllWarpingProductions } from "@/state/warpingProductionSlice";
import { getAllFlangeInwards, getFlangeInwardsByFactoryCompanyId } from "@/state/flangeInwardSlice";
import { getAllEmployees } from "@/state/employeeSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllMachines } from "@/state/machineMasterSlice";
import { getIssuedFlangeNos } from "@/state/flangeIssueSlice";
import {
  createSizingProduction,
  updateSizingProduction,
  getAllSizingProductions,
} from "@/state/sizingProductionSlice";
import {
  SizingProductionFormData,
  ProductionRow,
  createEmptyRow,
  extractArray,
  hydrateRows,
  safeNumber,
  formatNumber,
  toDateInputValue,
} from "@/pages/transaction/sizing-production-shared";
import { resolvePlanLabel } from "@/pages/transaction/sizing-beam-outward-shared";
import documentNumberService from "@/services/DocumentNumberService";

const computeTotalEndsFromWidth = (baseValue: string, widthValue: string) => {
  const base = safeNumber(baseValue);
  if (!(base > 0)) {
    return "";
  }
  const trimmedWidth = (widthValue || "").trim();
  if (!trimmedWidth) {
    return String(base);
  }
  const width = safeNumber(trimmedWidth);
  if (!(width > 0)) {
    return "0";
  }
  const total = base * width;
  return Number.isFinite(total) ? String(total) : "";
};

const parseInputNumber = (value?: string | number) => {
  if (value == null) return NaN;
  const trimmed = String(value).trim();
  if (trimmed === "") return NaN;
  return Number(trimmed);
};

const computeExpectedFabricMeterValue = (
  beamMeterValue?: string | number,
  fabricPanelValue?: string | number,
  shrinkageValue?: string | number,
) => {
  const bm = parseInputNumber(beamMeterValue);
  const fp = parseInputNumber(fabricPanelValue);
  if (Number.isNaN(bm) || Number.isNaN(fp)) return undefined;
  const shrinkage = parseInputNumber(shrinkageValue);
  const shrinkFactor = Number.isNaN(shrinkage) ? 0 : shrinkage / 100;
  const base = bm * fp;
  const result = base - base * shrinkFactor;
  return Number.isFinite(result) ? String(Number(result.toFixed(2))) : undefined;
};

const toOptionalNumber = (value?: string | number) => {
  const parsed = parseInputNumber(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const resolvePositiveNumber = (value: any) => {
  if (value == null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
};

const resolveOrderTotalEnds = (order: any) => {
  const primaryCandidates = [
    order?.totalEnds,
    order?.endsPerPart,
    order?.endsPerParts,
    order?.ends_per_part,
    order?.total_end,
    order?.totalEndsPerBeam,
    order?.totalEndsPerSet,
  ];
  for (const candidate of primaryCandidates) {
    const value = resolvePositiveNumber(candidate);
    if (value != null) {
      return value;
    }
  }
  const collections = [order?.items, order?.orderItems, order?.yarnDetails, order?.yarnRequirements];
  for (const collection of collections) {
    const entries = extractArray(collection);
    for (const entry of entries) {
      const entryCandidates = [entry?.totalEnds, entry?.endsPerPart, entry?.endsPerParts, entry?.ends];
      for (const candidate of entryCandidates) {
        const value = resolvePositiveNumber(candidate);
        if (value != null) {
          return value;
        }
      }
    }
  }
  return null;
};

const requiredProductionRowFields: Array<keyof ProductionRow> = [
  "shiftName",
  "flangeId",
  "fabricPanelWidth",
  "totalEnds",
  "sizedBeamNo",
  "beamMeters",
  "breakages",
  "rpm",
  "tareWt",
  "grossWt",
  "employeeId",
];

const getIncompleteProductionRows = (rows: ProductionRow[]) => {
  const invalid: number[] = [];
  rows.forEach((row, index) => {
    const missing = requiredProductionRowFields.some((field) => {
      const value = row[field];
      if (typeof value !== "string") return true;
      return value.trim() === "";
    });
    if (missing) {
      invalid.push(index + 1);
    }
  });
  return invalid;
};

interface SuggestionInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface SizingProductionFormProps {
  mode: "create" | "edit";
  initialRecord?: any;
  onCancel?: () => void;
  onSuccess?: () => void;
  submitLabel?: string;
  prefetchReferences?: boolean;
}

interface IssuedFlangeOption {
  value: string;
  label: string;
  orderId: string | null;
  orderTokens: string[];
  isActive: boolean;
}

const resolveSelectedCompanyId = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const resolveBuyerInfo = (order: any) => {
  const sources = [
    { id: order?.buyerId, name: order?.buyerName },
    { id: order?.customerId, name: order?.customerName },
    { id: order?.consigneeId, name: order?.consigneeName },
    { id: order?.companyId, name: order?.companyName },
    { id: order?.tradingCompanyId, name: order?.tradingCompanyName },
    { id: order?.factoryCompanyId, name: order?.factoryCompanyName },
  ];
  const resolved = sources.find((entry) => entry.name) || sources.find((entry) => entry.id != null);
  return {
    name: resolved?.name || "",
    id: resolved?.id != null ? Number(resolved.id) : null,
  };
};

const toFiniteNumber = (value: any) => {
  if (value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const resolveSizingOrderTypeId = (order: any) => {
  const candidate = order?.orderTypeId ?? order?.orderType;
  return toFiniteNumber(candidate);
};

const resolveSizingOrderBuyer = (
  order: any,
  orderTypeId: number | null,
  customerNameMap: Map<number, string>,
  companyNameMap: Map<number, string>,
) => {
  const fallback = resolveBuyerInfo(order);
  if (orderTypeId === 1) {
    const companyId =
      toFiniteNumber(order?.buyerId) ??
      toFiniteNumber(order?.companyId) ??
      toFiniteNumber(order?.factoryCompanyId) ??
      toFiniteNumber(order?.tradingCompanyId);
    if (companyId != null) {
      const name =
        companyNameMap.get(companyId) ??
        order?.buyerName ??
        order?.companyName ??
        order?.factoryCompanyName ??
        order?.tradingCompanyName ??
        fallback.name;
      return { id: companyId, name: name };
    }
  } else if (orderTypeId === 2) {
    const customerId =
      toFiniteNumber(order?.buyerId) ??
      toFiniteNumber(order?.customerId) ??
      toFiniteNumber(order?.consigneeId);
    if (customerId != null) {
      const name =
        customerNameMap.get(customerId) ??
        order?.buyerName ??
        order?.customerName ??
        order?.consigneeName ??
        fallback.name;
      return { id: customerId, name: name };
    }
  }
  return fallback;
};

const resolveYarnInfo = (order: any) => {
  const fallbackName = order?.yarnName || order?.yarnType || order?.yarnQuality || order?.yarn || "";
  const sources = [
    { id: order?.yarnId, name: order?.yarnName },
    { id: order?.warpYarnId, name: order?.warpYarnName },
    { id: order?.yarnMasterId, name: order?.yarnMasterName },
    { id: order?.yarn?.id, name: order?.yarn?.yarnName || order?.yarn?.name },
  ];
  const resolved = sources.find((entry) => entry.name) || sources.find((entry) => entry.id != null);
  if (resolved?.name || resolved?.id != null) {
    return {
      name: fallbackName || resolved?.name || "",
      id: resolved?.id != null ? Number(resolved.id) : null,
    };
  }
  const orderItems = extractArray(order?.items);
  const itemMatch = orderItems.find((item: any) => item?.yarnName || item?.yarnId != null || item?.yarn?.id != null);
  if (itemMatch) {
    const itemId = itemMatch?.yarnId ?? itemMatch?.id ?? itemMatch?.yarn?.id;
    const itemName = itemMatch?.yarnName || itemMatch?.yarn?.yarnName || itemMatch?.yarn?.name;
    return {
      name: itemName || fallbackName || (itemId != null ? `Yarn ${itemId}` : ""),
      id: itemId != null ? Number(itemId) : null,
    };
  }
  return {
    name: fallbackName || "",
    id: null,
  };
};

const resolveMachineName = (order: any) => {
  const candidates = [
    order?.machineName,
    order?.machineNo,
    order?.machine,
    order?.machine?.machineName,
    order?.machine?.machineNo,
    order?.machineMaster?.machineName,
    order?.machineMaster?.machineNo,
  ];
  const label = candidates.find((entry) => entry);
  return label ? String(label) : "";
};

const resolveMachineInfo = (order: any) => {
  const idCandidates = [
    order?.machineId,
    order?.machine?.id,
    order?.machine?.machineId,
    order?.machineMaster?.id,
    order?.machineMaster?.machineId,
  ];
  const resolvedId = idCandidates.find((entry) => entry != null);
  return {
    id: resolvedId != null ? Number(resolvedId) : null,
    name: resolveMachineName(order),
  };
};

const resolveDetailFabricPanelWidth = (detail: any) => {
  if (!detail) return undefined;
  const candidates = [
    detail?.fabricPanelWidth,
    detail?.fabric_panel_width,
    detail?.fabricPanelwidth,
    detail?.fabricWidth,
    detail?.fabric_width,
    detail?.width,
  ];
  for (const candidate of candidates) {
    const normalized = candidate != null ? String(candidate).trim() : "";
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
};

const resolvePlanFabricPanelWidth = (plan: any) => {
  if (!plan) return undefined;
  const detailSources = [
    plan?.sizingQualityDetails,
    plan?.qualityDetails,
    plan?.fabricQualityDetails,
    plan?.details,
  ];
  for (const source of detailSources) {
    const details = extractArray(source);
    for (const detail of details) {
      const width = resolveDetailFabricPanelWidth(detail);
      if (width) {
        return width;
      }
    }
  }
  const fallbackCandidates = [
    plan?.fabricPanelWidth,
    plan?.fabric_panel_width,
    plan?.fabricWidth,
    plan?.fabric_width,
    plan?.width,
  ];
  for (const candidate of fallbackCandidates) {
    const normalized = candidate != null ? String(candidate).trim() : "";
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
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

const isDetailIssuedToSizingProduction = (detail: any) => {
  const candidates = [
    detail?.isIssuedToSizingProduction,
    detail?.is_issued_to_sizing_production,
    detail?.issuedToSizingProduction,
    detail?.issued_to_sizing_production,
  ];
  const flag = candidates.find((value) => value != null);
  if (flag == null) {
    return false;
  }
  if (typeof flag === "boolean") {
    return flag;
  }
  if (typeof flag === "number") {
    return flag !== 0;
  }
  if (typeof flag === "string") {
    const normalized = flag.trim().toLowerCase();
    if (!normalized || normalized === "0" || normalized === "false" || normalized === "no") {
      return false;
    }
    return true;
  }
  const numeric = Number(flag);
  if (!Number.isNaN(numeric)) {
    return numeric !== 0;
  }
  return Boolean(flag);
};

function SuggestionInput({ value, onChange, suggestions, placeholder, className, disabled }: SuggestionInputProps) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const text = (value || "").toLowerCase();
    if (!text) return suggestions.slice(0, 8);
    return suggestions.filter((item) => item.toLowerCase().includes(text)).slice(0, 8);
  }, [value, suggestions]);

  return (
    <div className="relative">
      <input
        value={value}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.map((item) => (
            <li
              key={item}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(item);
                setOpen(false);
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SizingProductionForm({
  mode,
  initialRecord,
  onCancel,
  onSuccess,
  submitLabel = "Save",
  prefetchReferences = true,
}: SizingProductionFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const sizingState = useSelector((state: RootState) => (state as any).sizingProduction || {});
  const { sizingProductionList } = sizingState;
  const warpingState = useSelector((state: RootState) => (state as any).warpingProduction || {});
  const { warpingProductionList } = warpingState;
  const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
  const { list: flangeInwardList } = useSelector((state: RootState) => state.flangeInward);
  const { employeeList } = useSelector((state: RootState) => state.employee as any);
  const { customerList } = useSelector((state: RootState) => state.customer as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
  const { machineList } = useSelector((state: RootState) => state.machineMaster as any);
  const { issuedFlangesList } = useSelector((state: RootState) => state.flangeIssue as any);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<SizingProductionFormData>({
    defaultValues: {
      id: null,
      sizingProductionNo: "",
      sizingDate: toDateInputValue(),
      sizingOrderId: "",
      sizingPlanId: "",
      sizingPlanNo: "",
      buyerName: "",
      buyerId: "",
      manualSetNo: "",
      yarnName: "",
      yarnId: "",
      machineId: "",
      machineName: "",
    },
  });

  const [productionRows, setProductionRows] = useState<ProductionRow[]>([createEmptyRow()]);
  const [defaultTotalEnds, setDefaultTotalEnds] = useState("");
  const [productionRowError, setProductionRowError] = useState("");
  // const [documentNo, setDocumentNo] = useState("");
  // const [isDocumentNoLoading, setIsDocumentNoLoading] = useState(false);
  const sizingOrderIdValue = watch("sizingOrderId");
  const manualSetNoValue = watch("manualSetNo");
  const sizingPlanIdValue = watch("sizingPlanId") || "";
  const hasAutoTotalEnds = safeNumber(defaultTotalEnds) > 0;

  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);
  const lastAutoSetOrderIdRef = useRef<string | null>(null);
  const isMachineManuallySelectedRef = useRef(false);

  // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      // Only generate for new entries (not editing existing ones)
      if (initialRecord || hasGeneratedNumberRef.current) {
        return;
      }

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Sizing Production'
        });
        setValue('sizingProductionNo', result.documentNumber, { shouldValidate: true });
        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate Sizing Production number:', error);
        toast.error('Failed to generate Sizing Production number');
      }
    };

    generateDocumentNumber();
  }, [initialRecord, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !initialRecord) {
        documentNumberService.clearMemoryCache('Sizing Production');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !initialRecord) {
        documentNumberService.clearMemoryCache('Sizing Production');
      }
    };
  }, [initialRecord]);

  useEffect(() => {
    setValue('sizingProductionNo', initialRecord?.sizingProductionNo || '', { shouldValidate: true });
  }, [initialRecord, setValue]);

  const resolveBaseTotalEnds = useCallback(
    (row: ProductionRow) => {
      const defaultEnds = safeNumber(defaultTotalEnds);
      if (defaultEnds > 0) {
        return defaultEnds;
      }
      const width = safeNumber(row.fabricPanelWidth);
      const currentTotal = safeNumber(row.totalEnds);
      if (width > 0 && currentTotal > 0) {
        const base = currentTotal / width;
        if (base > 0) {
          return base;
        }
      }
      return 0;
    },
    [defaultTotalEnds],
  );

  const yarnIdValue = watch("yarnId");
  const machineIdValue = watch("machineId");
  const machineNameValue = watch("machineName");
  const hasPrefilledRecord = mode === "edit" && Boolean(initialRecord);
  const initialSizingOrderId = initialRecord?.sizingOrderId != null ? String(initialRecord.sizingOrderId) : "";
  const initialManualSetNo = initialRecord?.manualSetNo ? String(initialRecord.manualSetNo) : "";
  const isPrefilledOrder = hasPrefilledRecord && sizingOrderIdValue === initialSizingOrderId && initialSizingOrderId !== "";
  const hasSizingOrderChangedRef = useRef(false);
  const isReadOnly = useMemo(() => {
    return extractArray(initialRecord?.productionDetails).some((d: any) => d.isSizingBeamOutward === 1);
  }, [initialRecord]);


  useEffect(() => {
    if (!prefetchReferences) return;
    const companyId = resolveSelectedCompanyId();
    dispatch(getAllEmployees({ fetchAll: true } as any));
    dispatch(getAllCustomers({ fetchAll: true } as any));
    dispatch(getAllCompanies({ fetchAll: true } as any));
    dispatch(getAllMachines({ fetchAll: true } as any));
    if (companyId) {
      dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: companyId }));
      dispatch(getFlangeInwardsByFactoryCompanyId({ companyId, fetchAll: true } as any));
      dispatch(getAllWarpingProductions({ fetchAll: true, companyId }));
      dispatch(getAllSizingProductions({ fetchAll: true, companyId }));
      dispatch(getIssuedFlangeNos({ issuedCompanyId: companyId } as any));
      dispatch(getAllSizingPlan({ fetchAll: true} as any));
    } else {
      dispatch(getAllSizingJobWorkOrders(undefined as any));
      dispatch(getAllFlangeInwards({ fetchAll: true } as any));
      dispatch(getAllWarpingProductions({ fetchAll: true }));
      dispatch(getAllSizingProductions({ fetchAll: true }));
      dispatch(getAllSizingPlan({ fetchAll: true } as any));
    }
  }, [dispatch, prefetchReferences]);

  useEffect(() => {
    if (mode === "edit" && initialRecord) {
      const initialPlanId =
        initialRecord?.sizingPlanId ??
        initialRecord?.planId ??
        initialRecord?.sizingPlan?.id ??
        initialRecord?.plan?.id ??
        null;
      const initialPlanNo =
        initialRecord?.sizingPlanNo ??
        initialRecord?.planNo ??
        initialRecord?.planNumber ??
        resolvePlanLabel(initialRecord) ??
        "";
      reset({
        id: initialRecord?.id ?? null,
        sizingDate: toDateInputValue(initialRecord?.sizingDate),
        sizingOrderId: initialRecord?.sizingOrderId ? String(initialRecord.sizingOrderId) : "",
        sizingPlanId: initialPlanId != null ? String(initialPlanId) : "",
        sizingPlanNo: initialPlanNo,
        buyerName: initialRecord?.buyerName || "",
        buyerId: initialRecord?.buyerId != null ? String(initialRecord.buyerId) : "",
        manualSetNo: initialRecord?.manualSetNo || "",
        yarnName: initialRecord?.yarnName || "",
        yarnId: initialRecord?.yarnId != null ? String(initialRecord.yarnId) : "",
        machineId: initialRecord?.machineId != null ? String(initialRecord.machineId) : "",
        machineName: initialRecord?.machineName || "",
      });
      lastAutoSetOrderIdRef.current = initialRecord?.sizingOrderId ? String(initialRecord.sizingOrderId) : "";
      setProductionRows(hydrateRows(initialRecord));
      setProductionRowError("");
    } else {
      reset({
        id: null,
        sizingDate: toDateInputValue(),
        sizingOrderId: "",
        sizingPlanId: "",
        sizingPlanNo: "",
        buyerName: "",
        buyerId: "",
        manualSetNo: "",
        yarnName: "",
        yarnId: "",
        machineId: "",
        machineName: "",
      });
      setProductionRows([createEmptyRow()]);
      setProductionRowError("");
    }
    hasSizingOrderChangedRef.current = false;
  }, [initialRecord, mode, reset]);

  // useEffect(() => {
  //   if (mode === "edit") {
  //     const existingNumber = initialRecord?.documentNo || initialRecord?.sizingProductionNo || "";
  //     setDocumentNo(existingNumber || "");
  //     return;
  //   }
  //   setDocumentNo("");
  // }, [mode, initialRecord]);

  // useEffect(() => {
  //   if (documentNo) {
  //     return;
  //   }
  //   let isMounted = true;
  //   const generateNumber = async () => {
  //     setIsDocumentNoLoading(true);
  //     try {
  //       const { documentNumber } = await documentNumberService.generateDocumentNumber({ screenName: "Sizing Production" });
  //       if (isMounted) {
  //         setDocumentNo(documentNumber || "");
  //       }
  //     } catch (error) {
  //       console.error("Failed to generate sizing production document number", error);
  //       if (isMounted) {
  //         toast.error("Failed to generate document number");
  //       }
  //     } finally {
  //       if (isMounted) {
  //         setIsDocumentNoLoading(false);
  //       }
  //     }
  //   };
  //   generateNumber();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [documentNo]);


  const safeSizingList = useMemo(() => extractArray(sizingProductionList), [sizingProductionList]);
  const safeWarpingList = useMemo(() => extractArray(warpingProductionList), [warpingProductionList]);
  const safeFlangeList = useMemo(() => extractArray(flangeInwardList), [flangeInwardList]);
  const normalizedSizingOrders = useMemo(() => extractArray(sizingJobWorkOrderList), [sizingJobWorkOrderList]);
  const normalizedCustomers = useMemo(() => extractArray(customerList), [customerList]);
  const normalizedCompanies = useMemo(() => extractArray(companyMasterList), [companyMasterList]);

  const customerNameMap = useMemo(() => {
    const map = new Map<number, string>();
    normalizedCustomers.forEach((customer: any) => {
      const id = customer?.id ?? customer?.customerId;
      const label = customer?.customerName || customer?.name;
      if (id == null || !label) return;
      map.set(Number(id), label);
    });
    return map;
  }, [normalizedCustomers]);

  const companyNameMap = useMemo(() => {
    const map = new Map<number, string>();
    normalizedCompanies.forEach((company: any) => {
      const id = company?.id ?? company?.companyId;
      const label = company?.companyName || company?.name;
      if (id == null || !label) return;
      map.set(Number(id), label);
    });
    return map;
  }, [normalizedCompanies]);

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

  const resolvePlanFromRecord = useCallback(
    (record: any) => {
      if (!record) {
        return undefined;
      }
      if (record?.sizingPlan) {
        return record.sizingPlan;
      }
      if (record?.plan) {
        return record.plan;
      }
      const idCandidates = [
        record?.sizingPlanId,
        record?.planId,
        record?.sizingPlan?.id,
        record?.plan?.id,
      ];
      for (const candidate of idCandidates) {
        if (candidate == null) {
          continue;
        }
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
        record?.sizingPlanNumber,
      ];
      for (const candidate of numberCandidates) {
        if (candidate == null) {
          continue;
        }
        const normalized = String(candidate).trim().toLowerCase();
        if (!normalized) {
          continue;
        }
        const match = planByNumberMap.get(normalized);
        if (match) {
          return match;
        }
      }
      return undefined;
    },
    [planByIdMap, planByNumberMap],
  );

  const sizingOrderOptions = useMemo(() => {
    return normalizedSizingOrders
      .map((order: any) => {
        const resolvedId = order?.id ?? order?.sizingJobWorkOrderId ?? order?.sizingPlanId;
        if (resolvedId == null) return null;
        const label =
          order?.sizingWorkOrderNo ||
          order?.sizingJobWorkOrderNo ||
          order?.jobWorkOrderNo ||
          order?.orderNo ||
          `SO-${resolvedId}`;
        const orderTypeId = resolveSizingOrderTypeId(order);
        const buyerInfo = resolveSizingOrderBuyer(order, orderTypeId, customerNameMap, companyNameMap);
        const totalEnds = resolveOrderTotalEnds(order);
        const yarnInfo = resolveYarnInfo(order);
        const orderItems = extractArray(order?.items || order?.yarnDetails);
        let yarnOptions = orderItems
          .map((item: any) => {
            const yarnId = item?.yarnId ?? item?.id ?? item?.yarn?.id;
            const yarnLabel = item?.yarnName || item?.yarn?.yarnName || item?.yarn?.name || (yarnId != null ? `Yarn ${yarnId}` : "");
            if (!yarnLabel && yarnId == null) return null;
            return {
              value: yarnId != null ? String(yarnId) : yarnLabel,
              label: yarnLabel || "",
              numericId: yarnId != null ? Number(yarnId) : null,
            };
          })
          .filter(Boolean) as { value: string; label: string; numericId: number | null }[];
        if (!yarnOptions.length && (yarnInfo.name || yarnInfo.id != null)) {
          const fallbackValue = yarnInfo.id != null ? String(yarnInfo.id) : yarnInfo.name || `Yarn ${resolvedId}`;
          yarnOptions = [
            {
              value: fallbackValue,
              label: yarnInfo.name || fallbackValue,
              numericId: yarnInfo.id != null ? Number(yarnInfo.id) : null,
            },
          ];
        }
        const machineInfo = resolveMachineInfo(order);
        const orderTokens = buildOrderTokens(
          order?.sizingWorkOrderNo,
          order?.sizingJobWorkOrderNo,
          order?.jobWorkOrderNo,
          order?.orderNo,
          label,
        );
        return {
          value: String(resolvedId),
          label,
          meta: {
            sizingOrderId: resolvedId,
            orderTypeId,
            buyerName: buyerInfo.name || "",
            buyerId: buyerInfo.id,
            yarnName: yarnInfo.name || "",
            yarnId: yarnInfo.id,
            yarnOptions,
            machineName: machineInfo.name,
            machineId: machineInfo.id,
            totalEnds,
            orderTokens,
            sizingWorkOrderNo: order?.sizingWorkOrderNo ?? null,
          },
        };
      })
      .filter(Boolean) as { value: string; label: string; meta: any }[];
  }, [normalizedSizingOrders, customerNameMap, companyNameMap]);

  const sizingOrderRecordMap = useMemo(() => {
    const map = new Map<string, any>();
    normalizedSizingOrders.forEach((order: any) => {
      const resolvedId = order?.id ?? order?.sizingJobWorkOrderId ?? order?.sizingPlanId;
      if (resolvedId != null) {
        map.set(String(resolvedId), order);
      }
    });
    return map;
  }, [normalizedSizingOrders]);

  const selectedSizingOrder = useMemo(
    () => (sizingOrderIdValue ? sizingOrderRecordMap.get(sizingOrderIdValue) : undefined),
    [sizingOrderIdValue, sizingOrderRecordMap],
  );

  const sizingOrderMeta = useMemo(() => {
    const map = new Map<string, any>();
    sizingOrderOptions.forEach((option) => map.set(option.value, option.meta));
    return map;
  }, [sizingOrderOptions]);

  const currentSizingOrderMeta = useMemo(
    () => (sizingOrderIdValue ? sizingOrderMeta.get(sizingOrderIdValue) : undefined),
    [sizingOrderIdValue, sizingOrderMeta],
  );

  const handleSizingOrderChange = useCallback(
    (orderId: string) => {
      setValue("sizingOrderId", orderId, { shouldDirty: true, shouldValidate: true });
      if (!orderId) {
        if (!hasPrefilledRecord) {
          setValue("buyerName", "", { shouldValidate: true });
          setValue("buyerId", "", { shouldValidate: true });
          setValue("yarnName", "", { shouldValidate: true });
          setValue("yarnId", "", { shouldValidate: true });
          setValue("sizingPlanId", "", { shouldValidate: true });
          setValue("sizingPlanNo", "", { shouldValidate: true });
          setValue("machineId", "", { shouldValidate: true });
          setValue("machineName", "", { shouldValidate: true });
          setValue("manualSetNo", "", { shouldDirty: true, shouldValidate: true });
          setDefaultTotalEnds("");
        }
        return;
      }

      const meta = sizingOrderMeta.get(orderId);
      const orderRecord = sizingOrderRecordMap.get(orderId);
      if (!meta) return;

      // Update buyer info
      setValue("buyerName", meta.buyerName || "", { shouldValidate: true });
      setValue("buyerId", meta.buyerId != null ? String(meta.buyerId) : "", { shouldValidate: true });

      // Update yarn info
      const yarnOptionsList = Array.isArray(meta.yarnOptions) ? meta.yarnOptions : [];
      const defaultYarn = yarnOptionsList[0];
      if (defaultYarn) {
        setValue("yarnId", defaultYarn.value, { shouldValidate: true });
        setValue("yarnName", defaultYarn.label || "", { shouldValidate: true });
      } else {
        setValue("yarnId", meta.yarnId != null ? String(meta.yarnId) : "", { shouldValidate: true });
        setValue("yarnName", meta.yarnName || "", { shouldValidate: true });
      }

      // Update machine info
      setValue("machineId", meta.machineId != null ? String(meta.machineId) : "", { shouldValidate: true });
      setValue("machineName", meta.machineName || "", { shouldValidate: true });
      isMachineManuallySelectedRef.current = false;
      lastAutoSetOrderIdRef.current = orderId;

      // Update total ends and production rows
      const rawEndsValue = meta.totalEnds;
      const normalizedEndsValue = rawEndsValue != null ? String(rawEndsValue) : "";
      const hasOrderTotalEnds = safeNumber(normalizedEndsValue) > 0;
      setDefaultTotalEnds(hasOrderTotalEnds ? normalizedEndsValue : "");

      if (hasOrderTotalEnds) {
        setProductionRows((prev) => {
          if (hasPrefilledRecord && orderId === initialSizingOrderId && !hasSizingOrderChangedRef.current) {
            return prev;
          }
          return prev.map((row) => {
            const newEnds = computeTotalEndsFromWidth(normalizedEndsValue, row.fabricPanelWidth);
            if (row.totalEnds === newEnds) return row;
            return {
              ...row,
              totalEnds: newEnds,
            };
          });
        });
        setProductionRowError("");
      }

      // Resolve and update plan info
      const planRecord = resolvePlanFromRecord(orderRecord);
      const currentOrderTypeId = meta.orderTypeId ?? orderRecord?.orderTypeId;
      const isInternal = currentOrderTypeId === 1;

      if (isInternal) {
        const planIdCandidate =
          planRecord?.id ??
          planRecord?.sizingPlanId ??
          planRecord?.planId ??
          orderRecord?.sizingPlanId ??
          orderRecord?.planId ??
          "";
        const planNoCandidate = resolvePlanLabel(planRecord ?? orderRecord) || "";
        setValue("sizingPlanId", planIdCandidate != null ? String(planIdCandidate) : "", { shouldValidate: true });
        setValue("sizingPlanNo", planNoCandidate, { shouldValidate: true });
      } else {
        setValue("sizingPlanId", "", { shouldValidate: true });
        setValue("sizingPlanNo", "", { shouldValidate: true });
      }

      // Update manual set no
      const currentManualSetOptions: string[] = [];
      const manualSetUnique = new Set<string>();
      safeWarpingList.forEach((entry: any) => {
        const entryOrderId = entry?.sizingOrderId ?? entry?.sizingJobWorkOrderId;
        if (entryOrderId != null && String(entryOrderId) === orderId) {
          if (entry?.manualSetNo) manualSetUnique.add(String(entry.manualSetNo));
        }
      });
      if (hasPrefilledRecord && initialManualSetNo && orderId === initialSizingOrderId) {
        manualSetUnique.add(initialManualSetNo);
      }
      manualSetUnique.forEach((v) => currentManualSetOptions.push(v));

      if (currentManualSetOptions.length > 0) {
        const fallback =
          hasPrefilledRecord &&
          orderId === initialSizingOrderId &&
          initialManualSetNo &&
          currentManualSetOptions.includes(initialManualSetNo)
            ? initialManualSetNo
            : currentManualSetOptions[0];
        setValue("manualSetNo", fallback, { shouldDirty: true, shouldValidate: true });
      } else {
        setValue("manualSetNo", "", { shouldDirty: true, shouldValidate: true });
      }

      // Track order change for edit mode
      if (hasPrefilledRecord && initialSizingOrderId && orderId !== initialSizingOrderId) {
        hasSizingOrderChangedRef.current = true;
      } else if (hasPrefilledRecord && orderId === initialSizingOrderId) {
        hasSizingOrderChangedRef.current = false;
      }
    },
    [
      setValue,
      sizingOrderMeta,
      sizingOrderRecordMap,
      resolvePlanFromRecord,
      hasPrefilledRecord,
      initialSizingOrderId,
      initialManualSetNo,
      safeWarpingList,
    ],
  );

  const machineOptions = useMemo(() => {
    const list = extractArray(machineList);
    let options = list
      .map((machine: any) => {
        const id = machine?.id ?? machine?.machineId;
        if (id == null) return null;
        const label = machine?.machineName || machine?.machineNo || `Machine ${id}`;
        return { 
          value: String(id), 
          label,
          isActive: machine?.isActive !== false && machine?.activeFlag !== false 
        };
      })
      .filter(Boolean) as { value: string; label: string; isActive?: boolean }[];
    if (hasPrefilledRecord) {
      const prefId = initialRecord?.machineId != null ? String(initialRecord.machineId) : initialRecord?.machine?.id != null ? String(initialRecord.machine.id) : "";
      const prefLabel = initialRecord?.machineName || initialRecord?.machine?.machineName || initialRecord?.machine?.machineNo || initialRecord?.machineNo || initialRecord?.machine_id || (prefId ? `Machine ${prefId}` : "");
      if (prefId && !options.some((option) => option.value === prefId)) {
        options = [...options, { value: prefId, label: prefLabel || prefId }];
      }
    }
    return options;
  }, [machineList, hasPrefilledRecord, initialRecord]);

  const shiftNameSuggestions = useMemo(() => {
    const set = new Set<string>();
    safeSizingList.forEach((entry: any) => {
      const rows = extractArray(entry?.productionDetails);
      rows.forEach((detail: any) => {
        const text = detail?.shiftName;
        if (text) set.add(String(text));
      });
    });
    return Array.from(set);
  }, [safeSizingList]);

  const employeeOptions = useMemo(() => {
    const list = extractArray(employeeList).filter((employee: any) => employee?.isRelieved === false);
    return list
      .map((employee: any) => {
        const id = employee?.id ?? employee?.employeeId;
        if (id == null) return null;
        const label = employee?.employeeName || employee?.name || `Employee ${id}`;
        return { 
          value: String(id), 
          label,
          isActive: employee?.isActive !== false && employee?.activeFlag !== false 
        };
      })
      .filter(Boolean) as { value: string; label: string; isActive?: boolean }[];
  }, [employeeList]);

  const currentOrderTypeId = useMemo(() => {
    const metaValue = currentSizingOrderMeta?.orderTypeId;
    if (metaValue != null) {
      return toFiniteNumber(metaValue);
    }
    return toFiniteNumber(selectedSizingOrder?.orderTypeId);
  }, [currentSizingOrderMeta, selectedSizingOrder]);

  const isInternalOrder = currentOrderTypeId === 1;

  const selectedSizingPlan = useMemo(() => {
    if (!isInternalOrder) return undefined;
    if (!sizingPlanIdValue) return undefined;
    return planByIdMap.get(String(sizingPlanIdValue));
  }, [isInternalOrder, planByIdMap, sizingPlanIdValue]);

  const planFabricPanelWidth = useMemo(() => {
    const resolved = resolvePlanFabricPanelWidth(selectedSizingPlan);
    return resolved ? resolved.trim() : undefined;
  }, [selectedSizingPlan]);

  const planShrinkageAverage = useMemo(() => {
    if (!selectedSizingPlan) return undefined;
    const details = extractArray(selectedSizingPlan?.sizingBeamDetails ?? selectedSizingPlan?.beamDetails);
    const shrinkages = details
      .map((detail: any) => toFiniteNumber(detail?.shrinkage))
      .filter((value): value is number => value != null);
    if (!shrinkages.length) return undefined;
    return shrinkages.reduce((sum, value) => sum + value, 0) / shrinkages.length;
  }, [selectedSizingPlan]);

  const showExpectedFabricMeterColumn = isInternalOrder;

  const activeYarnOptions = useMemo(() => {
    if (!sizingOrderIdValue) return [] as { value: string; label: string }[];
    const meta = sizingOrderMeta.get(sizingOrderIdValue);
    if (!meta || !Array.isArray(meta.yarnOptions)) return [] as { value: string; label: string }[];
    return meta.yarnOptions;
  }, [sizingOrderIdValue, sizingOrderMeta]);

  useEffect(() => {
    if (!planFabricPanelWidth) {
      return;
    }
    setProductionRows((prev) => {
      let changed = false;
      const next = prev.map((row) => {
        if (row.fabricPanelWidth?.trim()) return row;
        changed = true;
        const updatedRow = { ...row, fabricPanelWidth: planFabricPanelWidth };
        if (hasAutoTotalEnds) {
          const computed = computeTotalEndsFromWidth(defaultTotalEnds, planFabricPanelWidth);
          if (computed !== updatedRow.totalEnds) {
            updatedRow.totalEnds = computed;
          }
        }
        return updatedRow;
      });
      return changed ? next : prev;
    });
  }, [planFabricPanelWidth, defaultTotalEnds, hasAutoTotalEnds]);

  const manualSetOptions = useMemo(() => {
    if (!sizingOrderIdValue) return [] as string[];
    const set = new Set<string>();
    safeWarpingList.forEach((entry: any) => {
      if (entry?.sizingOrderId != null && String(entry.sizingOrderId) === sizingOrderIdValue) {
        if (entry?.manualSetNo) set.add(String(entry.manualSetNo));
      }
    });
    if (hasPrefilledRecord && initialManualSetNo) {
      set.add(initialManualSetNo);
    }
    return Array.from(set);
  }, [safeWarpingList, sizingOrderIdValue, hasPrefilledRecord, initialManualSetNo]);

  const issuedFlangeOptions = useMemo<IssuedFlangeOption[]>(() => {
    const list = extractArray(issuedFlangesList);
    const map = new Map<string, IssuedFlangeOption>();
    list.forEach((entry: any) => {
      const labelCandidates = [entry?.flangeNo, entry?.flange_no, entry?.flangeNumber, entry?.flange_name];
      const label = labelCandidates.find((value) => value != null && value !== "");
      if (!label) return;
      const idCandidates = [entry?.flangeId, entry?.id, entry?.flange_id];
      const id = idCandidates.find((value) => value != null && value !== "");
      const value = id != null ? String(id) : String(label);
      if (map.has(value)) return;
      const orderCandidates = [entry?.sizingJobWorkOrderId, entry?.sizingOrderId, entry?.sizing_job_work_order_id];
      const orderId = orderCandidates.find((candidate) => candidate != null && candidate !== "");
      const orderTokens = buildOrderTokens(
        entry?.sizingWorkOrderNo,
        entry?.sizingJobWorkOrderNo,
        entry?.jobWorkOrderNo,
        entry?.orderNo,
        entry?.sizing_order_no,
        entry?.sizing_work_order_no,
      );
      map.set(value, {
        value,
        label: String(label),
        orderId: orderId != null ? String(orderId) : null,
        orderTokens,
        isActive: entry?.isActive !== false && entry?.activeFlag !== false,
      });
    });
    return Array.from(map.values());
  }, [issuedFlangesList]);

  const warpingMachineMeta = useMemo(() => {
    if (!sizingOrderIdValue) return null;
    const candidates = safeWarpingList.filter((entry: any) => {
      const orderId = entry?.sizingOrderId ?? entry?.sizingJobWorkOrderId;
      if (orderId == null) return false;
      return String(orderId) === sizingOrderIdValue;
    });
    if (!candidates.length) return null;
    const normalizedManual = (manualSetNoValue || "").trim().toLowerCase();
    const manualMatch = normalizedManual
      ? candidates.find((entry: any) => String(entry?.manualSetNo || "").trim().toLowerCase() === normalizedManual)
      : null;
    const target = manualMatch || candidates[0];
    const info = resolveMachineInfo(target);
    if (!info.id && !info.name) return null;
    return info;
  }, [safeWarpingList, sizingOrderIdValue, manualSetNoValue]);

  const resolvedMachineSelection = useMemo(() => {
    if (!sizingOrderIdValue) return null;
    const meta = sizingOrderMeta.get(sizingOrderIdValue);
    if (meta?.machineId != null || meta?.machineName) {
      return {
        id: meta?.machineId != null ? Number(meta.machineId) : null,
        name: meta?.machineName || "",
      };
    }
    return warpingMachineMeta;
  }, [sizingOrderIdValue, sizingOrderMeta, warpingMachineMeta]);

  useEffect(() => {
    if (!sizingOrderIdValue) {
      return;
    }

    // In edit mode, if the order hasn't changed, don't auto-set anything.
    // This preserves the machineId saved in the record even if the order defaults have changed.
    if (isPrefilledOrder && !hasSizingOrderChangedRef.current) {
      return;
    }

    if (!resolvedMachineSelection) {
      if (isPrefilledOrder) {
        return;
      }
      return;
    }
    const nextId = resolvedMachineSelection.id != null ? String(resolvedMachineSelection.id) : "";
    const nextName = resolvedMachineSelection.name || "";

    // Only auto-set if it's the first time for this order, or if values were cleared
    const isNewOrder = lastAutoSetOrderIdRef.current !== sizingOrderIdValue;
    if ((isNewOrder && !isMachineManuallySelectedRef.current) || (!machineIdValue && !machineNameValue)) {
      if (machineIdValue !== nextId) {
        setValue("machineId", nextId, { shouldDirty: false, shouldValidate: true });
      }
      if (machineNameValue !== nextName) {
        setValue("machineName", nextName, { shouldDirty: false, shouldValidate: true });
      }
      lastAutoSetOrderIdRef.current = sizingOrderIdValue;
    }
  }, [resolvedMachineSelection, setValue, sizingOrderIdValue, isPrefilledOrder, manualSetNoValue, machineIdValue, machineNameValue]);

  const allUsedFlangeIds = useMemo(() => {
    const set = new Set<string>();
    safeSizingList.forEach((prod: any) => {
      if (mode === "edit" && initialRecord?.id && String(prod.id) === String(initialRecord.id)) {
        return;
      }
      const details = extractArray(prod?.productionDetails || prod?.details);
      details.forEach((d: any) => {
        const id = d?.flangeId ?? d?.id;
        if (id != null) {
          set.add(String(id));
        }
      });
    });
    return set;
  }, [safeSizingList, mode, initialRecord]);

  const currentRecordFlangeIds = useMemo(() => {
    const set = new Set<string>();
    if (mode === "edit" && initialRecord) {
      const details = extractArray(initialRecord?.productionDetails || initialRecord?.details);
      details.forEach((d: any) => {
        const id = d?.flangeId ?? d?.id;
        if (id != null) {
          set.add(String(id));
        }
      });
    }
    return set;
  }, [initialRecord, mode]);

  const flangeOptions = useMemo(() => {
    if (!sizingOrderIdValue) return [] as { value: string; label: string }[];
    const meta = sizingOrderMeta.get(sizingOrderIdValue);
    const orderRecord = sizingOrderRecordMap.get(sizingOrderIdValue);
    const orderIdCandidates = new Set<string>();
    orderIdCandidates.add(String(sizingOrderIdValue));
    if (meta?.sizingOrderId != null) {
      orderIdCandidates.add(String(meta.sizingOrderId));
    }
    if (orderRecord?.id != null) {
      orderIdCandidates.add(String(orderRecord.id));
    }
    if (orderRecord?.sizingJobWorkOrderId != null) {
      orderIdCandidates.add(String(orderRecord.sizingJobWorkOrderId));
    }
    const targetOrderTokens = new Set<string>(Array.isArray(meta?.orderTokens) ? meta.orderTokens : []);
    const map = new Map<string, { value: string; label: string; isActive: boolean }>();

    const matchesEntryOrder = (entry: any) => {
      const entryIds = [
        entry?.sizingJobWorkOrderId,
        entry?.sizingOrderId,
        entry?.sizingPlanId,
        entry?.sizing_job_work_order_id,
        entry?.sizing_plan_id,
      ]
        .filter((value) => value != null)
        .map((value) => String(value));
      if (entryIds.some((id) => orderIdCandidates.has(id))) {
        return true;
      }
      if (!targetOrderTokens.size) return false;
      const entryTokens = buildOrderTokens(
        entry?.sizingWorkOrderNo,
        entry?.sizingJobWorkOrderNo,
        entry?.jobWorkOrderNo,
        entry?.orderNo,
        entry?.sizing_order_no,
        entry?.sizing_work_order_no,
      );
      if (!entryTokens.length) return false;
      return entryTokens.some((token) => targetOrderTokens.has(token));
    };

    safeFlangeList.forEach((entry: any) => {
      if (!matchesEntryOrder(entry)) return;
      const details = extractArray(entry?.flangeDetails || entry?.beamInwardBeamDetails);
      details.forEach((detail: any) => {
        const id = detail?.flangeId ?? detail?.id;
        if (id == null) return;
        const idStr = String(id);

        if (isDetailIssuedToSizingProduction(detail)) {
          if (!(mode === "edit" && currentRecordFlangeIds.has(idStr))) {
            return;
          }
        }

        const label = detail?.flangeNo || detail?.flange_no || detail?.flangeNumber || detail?.flange_name;
        if (label && !map.has(idStr)) {
          map.set(idStr, {
            value: idStr,
            label: String(label),
            isActive: detail?.isActive !== false && detail?.activeFlag !== false
          });
        }
      });
    });

    issuedFlangeOptions.forEach((option) => {
      const idMatch = option.orderId ? orderIdCandidates.has(option.orderId) : false;
      const tokenMatch = targetOrderTokens.size
        ? option.orderTokens.some((token) => targetOrderTokens.has(token))
        : false;
      if (!idMatch && !tokenMatch) return;

      if (!map.has(option.value)) {
        map.set(option.value, {
          value: option.value,
          label: option.label,
          isActive: true
        });
      }
    });

    productionRows.forEach((row) => {
      if (!row.flangeId) return;
      if (map.has(row.flangeId)) {
        const existing = map.get(row.flangeId);
        if (existing && !existing.isActive) {
          map.set(row.flangeId, { ...existing, isActive: true });
        }
        return;
      }
      const label = row.flangeNo && row.flangeNo.trim() ? row.flangeNo : row.flangeId;
      map.set(row.flangeId, {
        value: row.flangeId,
        label,
        isActive: true
      });
    });

    return Array.from(map.values());
  }, [safeFlangeList, sizingOrderIdValue, issuedFlangeOptions, sizingOrderMeta, sizingOrderRecordMap, productionRows, currentRecordFlangeIds, mode]);

  const getRowFlangeOptions = useCallback(
    (currentId: string, rowIndex: number) => {
      if (!flangeOptions.length) return [] as { value: string; label: string }[];
      const used = new Set<string>();
      productionRows.forEach((row, index) => {
        if (index === rowIndex) return;
        if (row.flangeId) {
          used.add(row.flangeId);
        }
      });
      return flangeOptions.filter((option) => option.value === currentId || !used.has(option.value));
    },
    [flangeOptions, productionRows],
  );

  useEffect(() => {
    if (!flangeOptions.length) {
      return;
    }
    let didChange = false;
    setProductionRows((prev) => {
      let changed = false;
      const used = new Set<string>();
      const next = prev.map((row) => {
        const matchedOption = row.flangeId ? flangeOptions.find((option) => option.value === row.flangeId) : null;
        if (matchedOption && !used.has(matchedOption.value)) {
          used.add(matchedOption.value);
          if (row.flangeNo !== matchedOption.label) {
            changed = true;
            return { ...row, flangeNo: matchedOption.label };
          }
          return row;
        }
        const fallback = flangeOptions.find((option) => !used.has(option.value));
        if (!fallback) {
          if (row.flangeId || row.flangeNo) {
            changed = true;
            return { ...row, flangeId: "", flangeNo: "" };
          }
          return row;
        }
        used.add(fallback.value);
        changed = true;
        return { ...row, flangeId: fallback.value, flangeNo: fallback.label };
      });
      if (changed) {
        didChange = true;
        return next;
      }
      return prev;
    });
    if (didChange) {
      setProductionRowError("");
    }
  }, [flangeOptions]);

  const productionSummary = useMemo(() => {
    const noOfBeams = productionRows.length;
    const totalMeters = productionRows.reduce((sum, row) => sum + safeNumber(row.beamMeters), 0);
    const totalNetWt = productionRows.reduce((sum, row) => sum + safeNumber(row.netWt), 0);
    const sizingCount = noOfBeams ? totalMeters / noOfBeams : 0;
    return { noOfBeams, totalMeters, totalNetWt, sizingCount };
  }, [productionRows]);

  const handleProductionChange = (index: number, field: keyof ProductionRow, value: string) => {
    if (productionRowError) {
      setProductionRowError("");
    }
    setProductionRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) {
          return row;
        }
        let updatedRow = { ...row, [field]: value } as ProductionRow;
        if (field === "grossWt" || field === "tareWt") {
          const gross = safeNumber(field === "grossWt" ? value : updatedRow.grossWt);
          const tare = safeNumber(field === "tareWt" ? value : updatedRow.tareWt);
          const net = gross - tare;
          updatedRow = { ...updatedRow, netWt: Number.isFinite(net) ? String(net) : "" };
        }
        if (field === "fabricPanelWidth") {
          const baseEnds = resolveBaseTotalEnds(row);
          if (baseEnds > 0) {
            updatedRow = { ...updatedRow, totalEnds: computeTotalEndsFromWidth(String(baseEnds), value) };
          } else if (!value) {
            updatedRow = { ...updatedRow, totalEnds: "" };
          }
        }
        if (field === "expectedFabricMeter") {
          updatedRow = { ...updatedRow, isExpectedFabricMeterModified: true };
        }
        if (
          showExpectedFabricMeterColumn &&
          planShrinkageAverage != null &&
          (field === "fabricPanelWidth" || field === "beamMeters") &&
          !updatedRow.isExpectedFabricMeterModified
        ) {
          const expected = computeExpectedFabricMeterValue(
            updatedRow.beamMeters,
            updatedRow.fabricPanelWidth,
            planShrinkageAverage,
          );
          if (expected != null) {
            updatedRow = { ...updatedRow, expectedFabricMeter: expected };
          }
        }
        return updatedRow;
      }),
    );
  };

  const handleFlangeSelect = (index: number, value: string) => {
    if (productionRowError) {
      setProductionRowError("");
    }
    const selected = flangeOptions.find((option) => option.value === value);
    setProductionRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, flangeId: value, flangeNo: selected?.label || "" } : row)),
    );
  };

  const handleAddRow = () => {
    if (productionRowError) {
      setProductionRowError("");
    }
    setProductionRows((prev) => {
      const row = createEmptyRow();
      const widthValue = row.fabricPanelWidth || planFabricPanelWidth || "";
      const computedTotalEnds = hasAutoTotalEnds ? computeTotalEndsFromWidth(defaultTotalEnds, widthValue) : row.totalEnds;
      const assigned = new Set(
        prev
          .map((item) => item.flangeId)
          .filter((value): value is string => Boolean(value)),
      );
      const nextOption = flangeOptions.find((option) => !assigned.has(option.value));
      return [
        ...prev,
        {
          ...row,
          fabricPanelWidth: widthValue,
          totalEnds: computedTotalEnds,
          flangeId: nextOption ? nextOption.value : "",
          flangeNo: nextOption ? nextOption.label : "",
        },
      ];
    });
  };

  const handleRemoveRow = (tempId: string) => {
    if (productionRowError) {
      setProductionRowError("");
    }
    setProductionRows((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((row) => row.tempId !== tempId);
      return next.length ? next : [createEmptyRow()];
    });
  };

  useEffect(() => {
    setProductionRows((prev) => {
      let changed = false;
      const next = prev.map((row) => {
        if (!showExpectedFabricMeterColumn) {
          if (!row.expectedFabricMeter) return row;
          changed = true;
          return { ...row, expectedFabricMeter: "" };
        }
        // If user modified it manually, don't auto-calculate in useEffect
        if (row.isExpectedFabricMeterModified) {
          return row;
        }
        if (planShrinkageAverage == null) {
          return row;
        }
        const computed = computeExpectedFabricMeterValue(
          row.beamMeters,
          row.fabricPanelWidth,
          planShrinkageAverage,
        );
        if (computed == null) {
          if (!row.expectedFabricMeter) return row;
          changed = true;
          return { ...row, expectedFabricMeter: "" };
        }
        if (computed !== row.expectedFabricMeter) {
          changed = true;
          return { ...row, expectedFabricMeter: computed };
        }
        return row;
      });
      if (!changed) {
        return prev;
      }
      return next;
    });
  }, [planShrinkageAverage, showExpectedFabricMeterColumn]);

  const onSubmit = async (values: SizingProductionFormData) => {
    const invalidRowNumbers = getIncompleteProductionRows(productionRows);
    if (invalidRowNumbers.length) {
      setProductionRowError(`Fill all Production Details for rows ${invalidRowNumbers.join(", ")}`);
      return;
    }

    const seenShifts = new Set<string>();
    const seenBeams = new Set<string>();
    for (const row of productionRows) {
      const shift = row.shiftName?.trim();
      const beam = row.sizedBeamNo?.trim();
      // if (shift && seenShifts.has(shift)) {
      //   toast.error(`Duplicate Shift Name: ${shift}`);
      //   return;
      // }
      if (beam && seenBeams.has(beam)) {
        toast.error(`Duplicate Sized Beam No: ${beam}`);
        return;
      }
      // if (shift) seenShifts.add(shift);
      if (beam) seenBeams.add(beam);
    }

    const isEditMode = Boolean(initialRecord?.id);
    let sizingProductionNo = values.sizingProductionNo || initialRecord?.sizingProductionNo || "";
    if (!initialRecord?.id && !sizingProductionNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Sizing Production",
        });
        sizingProductionNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    isSavingRef.current = true;
    setProductionRowError("");
    const companyId = resolveSelectedCompanyId();
    const selectedMeta = values.sizingOrderId ? sizingOrderMeta.get(values.sizingOrderId) : null;
    const resolvedOrderTypeId = selectedMeta?.orderTypeId;
    const includeSizingPlan = isInternalOrder;
    const payload = {
      sizingProductionNo: sizingProductionNo,
      sizingDate: values.sizingDate,
      sizingOrderId: values.sizingOrderId ? Number(values.sizingOrderId) : undefined,
      sizingPlanId: includeSizingPlan && values.sizingPlanId ? Number(values.sizingPlanId) : undefined,
      sizingPlanNo: includeSizingPlan && values.sizingPlanNo ? values.sizingPlanNo : undefined,
      orderTypeId: resolvedOrderTypeId != null ? Number(resolvedOrderTypeId) : undefined,
      buyerName: values.buyerName,
      buyerId: values.buyerId ? Number(values.buyerId) : undefined,
      manualSetNo: values.manualSetNo,
      yarnName: values.yarnName,
      yarnId: values.yarnId ? Number(values.yarnId) : undefined,
      machineId: values.machineId ? Number(values.machineId) : undefined,
      machineName: values.machineName,
      companyId: companyId ?? undefined,
      noOfBeams: productionSummary.noOfBeams,
      totalMeters: productionSummary.totalMeters,
      totalNetWeight: productionSummary.totalNetWt,
      sizingCount: productionSummary.sizingCount,
      productionDetails: productionRows.map((row) => ({
        shiftName: row.shiftName,
        flangeNo: row.flangeNo,
        flangeId: row.flangeId ? Number(row.flangeId) : undefined,
        fabricPanelWidth: Number(row.fabricPanelWidth) || 0,
        expectedFabricMeter: Number(row.expectedFabricMeter) || 0,
        totalEnds: Number(row.totalEnds) || 0,
        sizedBeamNo: row.sizedBeamNo,
        beamMeters: Number(row.beamMeters) || 0,
        sizingPickup: toOptionalNumber(row.sizingPickup),
        breakages: Number(row.breakages) || 0,
        rpm: Number(row.rpm) || 0,
        tareWt: Number(row.tareWt) || 0,
        grossWt: Number(row.grossWt) || 0,
        netWt: Number(row.netWt) || 0,
        employeeId: row.employeeId ? Number(row.employeeId) : undefined,
        orderTypeId: resolvedOrderTypeId != null ? Number(resolvedOrderTypeId) : undefined,
        isExpectedFabricMeterModified: row.isExpectedFabricMeterModified,
      })),
      summary: {
        noOfBeams: productionSummary.noOfBeams,
        totalMeters: productionSummary.totalMeters,
        totalNetWeight: productionSummary.totalNetWt,
        sizingCount: productionSummary.sizingCount,
      },
    };
    // alert(JSON.stringify(payload));  
    if (isEditMode) {
      const result = await dispatch(updateSizingProduction({ id: Number(values.id), data: payload, companyId: companyId ?? undefined }));
      if (updateSizingProduction.fulfilled.match(result)) {
        onSuccess?.();
      }
      return;
    }

    const createResult = await dispatch(createSizingProduction(payload));
    if (createSizingProduction.fulfilled.match(createResult)) {
      documentNumberService.clearMemoryCache("Sizing Production");
      onSuccess?.();
      // documentNumberService.commitDocumentNumber("Sizing Production", documentNo);
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register("buyerId")} />
      <input type="hidden" {...register("yarnName")} />
      <input type="hidden" {...register("machineName")} />
      <input type="hidden" {...register("sizingPlanId")} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">
            Sizing Production No<span className="text-red-600">*</span>
          </label>
          <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
            {...register('sizingProductionNo')} readOnly />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Sizing Date<span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            {...register("sizingDate", { required: "Sizing Date is required" })}
            className={`input mt-1 ${errors.sizingDate ? "border-red-500" : ""}`}
            readOnly={isReadOnly}
          />
          {errors.sizingDate && <p className="mt-1 text-xs text-red-600">{String(errors.sizingDate.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">
            Sizing Order No<span className="text-red-600">*</span>
          </label>
          <Controller
            control={control}
            name="sizingOrderId"
            rules={{ required: "Sizing Order No is required" }}
            render={({ field }) => (
              <CommonSearchableSelect
                {...field}
                options={sizingOrderOptions}
                placeholder="Select Order"
                className="mt-1"
                error={errors.sizingOrderId?.message as string}
                disabled={isReadOnly}
                onValueChange={(val) => {
                  field.onChange(val);
                  handleSizingOrderChange(val);
                }}
              />
            )}
          />
        </div>
        {isInternalOrder && (
          <div>
            <label className="block text-sm font-medium">Sizing Plan No</label>
            <input
              type="text"
              {...register("sizingPlanNo")}
              className="input mt-1 bg-gray-100"
              readOnly
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">
            Buyer Name<span className="text-red-600">*</span>
          </label>
          <input
            {...register("buyerName", { required: "Buyer Name is required" })}
            className={`input mt-1 ${errors.buyerName ? "border-red-500" : ""}`}
            readOnly
          />
          {errors.buyerName && <p className="mt-1 text-xs text-red-600">{String(errors.buyerName.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">
            Manual Set No<span className="text-red-600">*</span>
          </label>
          <Controller
            control={control}
            name="manualSetNo"
            rules={{ required: "Manual Set No is required" }}
            render={({ field }) => (
              <CommonSearchableSelect
                {...field}
                options={manualSetOptions.map(option => ({ value: option, label: option }))}
                placeholder="Select Manual Set"
                disabled={isReadOnly || !manualSetOptions.length}
                className="mt-1"
                error={errors.manualSetNo?.message as string}
                onValueChange={(val) => {
                  field.onChange(val);
                }}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Yarn Name<span className="text-red-600">*</span>
          </label>
          <Controller
            control={control}
            name="yarnId"
            rules={{ required: "Yarn Name is required" }}
            render={({ field }) => (
              <CommonSearchableSelect
                {...field}
                options={activeYarnOptions.map((option: any) => ({
                  value: option.value,
                  label: option.label || option.value
                }))}
                placeholder="Select Yarn"
                disabled={isReadOnly || !activeYarnOptions.length}
                className="mt-1"
                error={errors.yarnId?.message as string}
                onValueChange={(val) => {
                  const selected = activeYarnOptions.find((opt: any) => opt.value === val);
                  field.onChange(val);
                  setValue("yarnName", selected?.label || "", { shouldDirty: true });
                }}
              />
            )}
          />
          {errors.yarnId && <p className="mt-1 text-xs text-red-600">{String(errors.yarnId.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">
            Machine Name<span className="text-red-600">*</span>
          </label>
          <Controller
            control={control}
            name="machineId"
            rules={{ required: "Machine Name is required" }}
            render={({ field }) => (
              <CommonSearchableSelect
                {...field}
                options={machineOptions}
                placeholder="Select Machine"
                className="mt-1"
                error={errors.machineId?.message as string}
                disabled={isReadOnly}
                onValueChange={(val) => {
                  const selected = machineOptions.find((opt) => opt.value === val);
                  field.onChange(val);
                  setValue("machineName", selected?.label || "", { shouldDirty: true });
                  isMachineManuallySelectedRef.current = true;
                }}
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Production Details</h3>
          {!isReadOnly && (
            <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-white" onClick={handleAddRow}>
              Add Row
            </button>
          )}
        </div>
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-2">S.No</th>
                <th className="border px-2 py-2">Shift Name</th>
                <th className="border px-2 py-2">Empty Beam No</th>
                <th className="border px-2 py-2">Beam meters</th>
                <th className="border px-2 py-2">Width</th>
                {showExpectedFabricMeterColumn && <th className="border px-2 py-2">Expected Fabric Meter</th>}
                <th className="border px-2 py-2">Total Ends</th>
                <th className="border px-2 py-2">Sized Beam No</th>

                <th className="border px-2 py-2">Sizing Pickup</th>
                <th className="border px-2 py-2">Breakages</th>
                <th className="border px-2 py-2">RPM</th>
                <th className="border px-2 py-2">TARE WT</th>
                <th className="border px-2 py-2">GROSS WT</th>
                <th className="border px-2 py-2">NET WT</th>
                <th className="border px-2 py-2">Employee</th>
                <th className="border px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {productionRows.map((row, index) => {
                const rowFlangeOptions = getRowFlangeOptions(row.flangeId, index);
                return (
                  <tr key={row.tempId} className="odd:bg-white even:bg-gray-50">
                    <td className="border px-2 py-2 text-center">{index + 1}</td>
                    <td className="border px-2 py-2">
                      <SuggestionInput
                        value={row.shiftName}
                        onChange={(value) => handleProductionChange(index, "shiftName", value)}
                        suggestions={shiftNameSuggestions}
                        placeholder="Shift Name"
                        className="input"
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <CommonSearchableSelect
                        value={row.flangeId}
                        options={rowFlangeOptions}
                        placeholder="Select Flange"
                        onValueChange={(value) => handleFlangeSelect(index, value)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        value={row.beamMeters}
                        onChange={(event) => handleProductionChange(index, "beamMeters", event.target.value)}
                        className="input"
                        step="0.01"
                        readOnly={isReadOnly}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        value={row.fabricPanelWidth}
                        onChange={(event) => handleProductionChange(index, "fabricPanelWidth", event.target.value)}
                        className="input"
                        step="0.01"
                        readOnly={isReadOnly}
                      />
                    </td>
                    {showExpectedFabricMeterColumn && (
                      <td className="border px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.expectedFabricMeter}
                          onChange={(event) => handleProductionChange(index, "expectedFabricMeter", event.target.value)}
                          className="input"
                          readOnly={isReadOnly}
                        />
                      </td>
                    )}
                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        value={row.totalEnds}
                        className={`input ${hasAutoTotalEnds ? "bg-gray-50" : ""}`}
                        onChange={(event) => handleProductionChange(index, "totalEnds", event.target.value)}
                        readOnly={isReadOnly}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input
                        value={row.sizedBeamNo}
                        onChange={(event) => handleProductionChange(index, "sizedBeamNo", event.target.value)}
                        className="input"
                        readOnly={isReadOnly}
                      />
                    </td>

                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        value={row.sizingPickup}
                        onChange={(event) => handleProductionChange(index, "sizingPickup", event.target.value)}
                        className="input"
                        step="0.01"
                        readOnly={isReadOnly}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        value={row.breakages}
                        onChange={(event) => handleProductionChange(index, "breakages", event.target.value)}
                        className="input"
                        step="0.01"
                        readOnly={isReadOnly}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        value={row.rpm}
                        onChange={(event) => handleProductionChange(index, "rpm", event.target.value)}
                        className="input"
                        step="0.01"
                        readOnly={isReadOnly}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        value={row.tareWt}
                        onChange={(event) => handleProductionChange(index, "tareWt", event.target.value)}
                        className="input"
                        step="0.01"
                        readOnly={isReadOnly}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input
                        type="number"
                        value={row.grossWt}
                        onChange={(event) => handleProductionChange(index, "grossWt", event.target.value)}
                        className="input"
                        step="0.01"
                        readOnly={isReadOnly}
                      />
                    </td>
                    <td className="border px-2 py-2">
                      <input value={row.netWt} readOnly className="input" />
                    </td>
                    <td className="border px-2 py-2">
                      <CommonSearchableSelect
                        value={row.employeeId}
                        options={employeeOptions}
                        placeholder="Select Employee"
                        onValueChange={(value) => handleProductionChange(index, "employeeId", value)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="border px-2 py-2 text-center">
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.tempId)}
                          className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {productionRowError && <p className="text-sm text-red-600">{productionRowError}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">No of Beams</p>
          <p className="text-2xl font-semibold text-gray-900">{productionSummary.noOfBeams}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total meters</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(productionSummary.totalMeters)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Total Net WT</p>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(productionSummary.totalNetWt)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Sizing Count</p>
          <p className="text-2xl font-semibold text-gray-900">--</p>
          {/* <p className="text-2xl font-semibold text-gray-900">{formatNumber(productionSummary.sizingCount)}</p> */}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="rounded-lg border border-gray-300 px-4 py-2" onClick={onCancel}>
          Cancel
        </button>
        {!isReadOnly && (
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-white">
            {submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
