import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { AppDispatch, RootState } from "@/state/store";
import { getAllMachines } from "@/state/machineMasterSlice";
import { getAllEmployees } from "@/state/employeeSlice";
import { getAllSizingJobWorkOrders, getAllSizingJobWorkOrdersByFactoryCompanyId } from "@/state/sizingJobWorkOrderSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { createWarpingProduction, updateWarpingProduction, getAllWarpingProductions } from "@/state/warpingProductionSlice";
import { WarpingFormData, ProductionRow, createEmptyRow, extractArray, formatNumber, hydrateRows, safeNumber, toDateInputValue } from "@/pages/transaction/warping-production-shared";
import documentNumberService from "@/services/DocumentNumberService";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { Trash } from "lucide-react";

type SyncableField = "shiftName" | "endsPerPart" | "actualMeters" | "rpm";
const SYNCABLE_FIELDS: SyncableField[] = ["shiftName", "endsPerPart", "actualMeters", "rpm"];
const SYNCABLE_FIELD_SET = new Set<SyncableField>(SYNCABLE_FIELDS);

const extractSyncTemplate = (row?: ProductionRow): Partial<ProductionRow> | undefined => {
  if (!row) return undefined;
  const template: Partial<ProductionRow> = {};
  SYNCABLE_FIELDS.forEach((field) => {
    template[field] = row[field];
  });
  return template;
};

interface SuggestionInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface WarpingProductionFormProps {
  mode: "create" | "edit";
  initialRecord?: any;
  onCancel?: () => void;
  onSuccess?: () => void;
  submitLabel?: string;
  prefetchReferences?: boolean;
}

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
              key={`${item}`}
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

const resolveSelectedCompanyIdForForm = () => {
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

const resolveYarnInfo = (order: any) => {
  const fallbackName = order?.yarnName || order?.yarnType || order?.yarnQuality || order?.yarn || "";
  const sources = [
    { id: order?.yarnId, name: order?.yarnName },
    { id: order?.warpYarnId, name: order?.warpYarnName },
    { id: order?.yarnMasterId, name: order?.yarnMasterName },
    { id: order?.yarn?.id, name: order?.yarn?.yarnName || order?.yarn?.name },
  ];
  const resolved = sources.find((entry) => entry.name) || sources.find((entry) => entry.id != null);
  return {
    name: fallbackName || resolved?.name || "",
    id: resolved?.id != null ? Number(resolved.id) : null,
  };
};

const resolveWarpingDateSource = (record: any) => {
  if (!record) return null;
  return (
    record?.warpingDate ??
    record?.warping_date ??
    record?.warpingDateFormatted ??
    record?.warping_date_formatted ??
    record?.summary?.warpingDate ??
    record?.summary?.warping_date ??
    null
  );
};

export function WarpingProductionForm({
  mode,
  initialRecord,
  onCancel,
  onSuccess,
  submitLabel = "Save",
  prefetchReferences = true,
}: WarpingProductionFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const warpingState = useSelector((state: RootState) => (state as any).warpingProduction || {});
  const { warpingProductionList } = warpingState;
  const { machineList } = useSelector((state: RootState) => state.machineMaster as any);
  const { employeeList } = useSelector((state: RootState) => state.employee as any);
  const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
  const { customerList } = useSelector((state: RootState) => state.customer as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<WarpingFormData>({
    defaultValues: {
      id: null,
      warpingProductionNo: "",
      warpingDate: toDateInputValue(),
      sizingOrderId: "",
      buyerName: "",
      manualSetNo: "",
      parts: "",
      endsPerPart: "",
      machineId: "",
      yarnName: "",
      buyerId: "",
      yarnId: "",
    },
  });

  const [productionRows, setProductionRows] = useState<ProductionRow[]>([createEmptyRow()]);
  const [autoPartsSyncEnabled, setAutoPartsSyncEnabled] = useState(mode !== "edit");
  const initialPartsRef = useRef<string>("");
  const initialEndsPerPartRef = useRef<string>("");
  const [rowFieldSync, setRowFieldSync] = useState<Record<string, Record<SyncableField, boolean>>>({});
  const rowFieldSyncRef = useRef(rowFieldSync);
  // const [documentNo, setDocumentNo] = useState("");
  // const [isDocumentNoLoading, setIsDocumentNoLoading] = useState(false);
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
                            screenName: 'Warping Production'
                        });
                        setValue('warpingProductionNo', result.documentNumber, { shouldValidate: true });
                        hasGeneratedNumberRef.current = true;
                    } catch (error) {
                        console.error('Failed to generate Warping Production number:', error);
                        toast.error('Failed to generate Warping Production number');
                    }
                };
        
                generateDocumentNumber();
            }, [initialRecord, setValue]);
        
            // Cleanup document number cache if not saved
            useEffect(() => {
                const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                    if (hasGeneratedNumberRef.current && !isSavingRef.current && !initialRecord) {
                        documentNumberService.clearMemoryCache('Warping Production');
                    }
                };
        
                window.addEventListener('beforeunload', handleBeforeUnload);
        
                return () => {
                    window.removeEventListener('beforeunload', handleBeforeUnload);
                    if (hasGeneratedNumberRef.current && !isSavingRef.current && !initialRecord) {
                        documentNumberService.clearMemoryCache('Warping Production');
                    }
                };
            }, [initialRecord]);
        
          useEffect(() => {
            setValue('warpingProductionNo', initialRecord?.warpingProductionNo || '') ;
          }, [initialRecord, setValue]);

  useEffect(() => {
    rowFieldSyncRef.current = rowFieldSync;
  }, [rowFieldSync]);

  useEffect(() => {
    setRowFieldSync((prev) => {
      const next = { ...prev } as Record<string, Record<SyncableField, boolean>>;
      let changed = false;
      const defaultValue = mode !== "edit";
      productionRows.forEach((row) => {
        if (!next[row.tempId]) {
          const initialState = {} as Record<SyncableField, boolean>;
          SYNCABLE_FIELDS.forEach((field) => {
            initialState[field] = defaultValue;
          });
          next[row.tempId] = initialState;
          changed = true;
        }
      });
      Object.keys(next).forEach((key) => {
        if (!productionRows.some((row) => row.tempId === key)) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [productionRows, mode]);

  const disableRowFieldSync = useCallback((rowId: string, field: SyncableField) => {
    setRowFieldSync((prev) => {
      const rowState = prev[rowId];
      if (!rowState || !rowState[field]) {
        return prev;
      }
      return {
        ...prev,
        [rowId]: {
          ...rowState,
          [field]: false,
        },
      };
    });
  }, []);

  const propagateFirstRowValue = useCallback(
    (field: SyncableField, rows: ProductionRow[]) => {
      if (mode === "edit" || !rows.length) {
        return rows;
      }
      const firstValue = rows[0][field];
      let changed = false;
      const nextRows = rows.map((row, idx) => {
        if (idx === 0) return row;
        const syncState = rowFieldSyncRef.current[row.tempId];
        if (!syncState || !syncState[field]) {
          return row;
        }
        if (row[field] === firstValue) {
          return row;
        }
        changed = true;
        return { ...row, [field]: firstValue };
      });
      return changed ? nextRows : rows;
    },
    [mode]
  );

  const warpingDateValue = watch("warpingDate");
  const partsValue = watch("parts");
  const endsPerPartValue = watch("endsPerPart");
  const sizingOrderIdValue = watch("sizingOrderId");
  const yarnIdValue = watch("yarnId");
  const resolvedInitialWarpingDate = useMemo(() => resolveWarpingDateSource(initialRecord), [initialRecord]);
  const hasPrefilledRecord = mode === "edit" && Boolean(initialRecord);
  const initialWarpingDateRaw = hasPrefilledRecord ? resolvedInitialWarpingDate : null;
  const initialSizingOrderId = hasPrefilledRecord && initialRecord?.sizingOrderId != null ? String(initialRecord.sizingOrderId) : "";
  const initialYarnId = hasPrefilledRecord && initialRecord?.yarnId != null ? String(initialRecord.yarnId) : "";
  const [protectPrefilledOrder, setProtectPrefilledOrder] = useState(hasPrefilledRecord);
  const shouldProtectOrderAutofill = protectPrefilledOrder && sizingOrderIdValue === initialSizingOrderId;
  const shouldProtectYarnAutofill = protectPrefilledOrder && sizingOrderIdValue === initialSizingOrderId && yarnIdValue === initialYarnId;

  const buildProductionRow = useCallback(
    (template?: Partial<ProductionRow>) => {
      const row = createEmptyRow();
      if (autoPartsSyncEnabled && (endsPerPartValue ?? "") !== "") {
        row.endsPerPart = endsPerPartValue || "";
      }
      return template ? { ...row, ...template } : row;
    },
    [autoPartsSyncEnabled, endsPerPartValue]
  );

  useEffect(() => {
    if (!prefetchReferences) return;
    const companyId = resolveSelectedCompanyIdForForm();
    dispatch(getAllMachines({ fetchAll: true }));
    dispatch(getAllEmployees({ fetchAll: true }));
    dispatch(getAllCustomers({ fetchAll: true }));
    dispatch(getAllCompanies({ fetchAll: true }));
    if (companyId) {
      dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: companyId }));
      dispatch(getAllWarpingProductions({ fetchAll: true, companyId }));
    } else {
      dispatch(getAllSizingJobWorkOrders(undefined as any));
      dispatch(getAllWarpingProductions({ fetchAll: true }));
    }
  }, [dispatch, prefetchReferences]);

  useEffect(() => {
    if (mode === "edit" && initialRecord) {
      const resolvedWarpingDate = resolveWarpingDateSource(initialRecord);
      reset({
        id: initialRecord?.id ?? null,
        warpingDate: resolvedWarpingDate ? toDateInputValue(resolvedWarpingDate) : toDateInputValue(initialRecord?.warpingDate),
        sizingOrderId: initialRecord?.sizingOrderId ? String(initialRecord.sizingOrderId) : "",
        buyerName: initialRecord?.buyerName || "",
        buyerId: initialRecord?.buyerId != null ? String(initialRecord.buyerId) : "",
        manualSetNo: initialRecord?.manualSetNo || "",
        parts: initialRecord?.parts != null ? String(initialRecord.parts) : "",
        endsPerPart: initialRecord?.endsPerPart != null ? String(initialRecord.endsPerPart) : "",
        machineId: initialRecord?.machineId ? String(initialRecord.machineId) : "",
        yarnName: initialRecord?.yarnName || "",
        yarnId: initialRecord?.yarnId != null ? String(initialRecord.yarnId) : "",
      });
      const hydrated = hydrateRows(initialRecord);
      const headerEndsPerPart = initialRecord?.endsPerPart != null ? String(initialRecord.endsPerPart) : "";
      const hydratedWithEnds = headerEndsPerPart
        ? hydrated.map((row) => (!row.endsPerPart ? { ...row, endsPerPart: headerEndsPerPart } : row))
        : hydrated;
      setProductionRows(hydratedWithEnds);
      const detailCount = extractArray(initialRecord?.productionDetails).length;
      setAutoPartsSyncEnabled(detailCount === 0);
      initialPartsRef.current = initialRecord?.parts != null ? String(initialRecord.parts) : "";
      initialEndsPerPartRef.current = initialRecord?.endsPerPart != null ? String(initialRecord.endsPerPart) : "";
      setProtectPrefilledOrder(true);
    } else {
      reset({
        id: null,
        warpingDate: toDateInputValue(),
        sizingOrderId: "",
        buyerName: "",
        buyerId: "",
        manualSetNo: "",
        parts: "",
        endsPerPart: "",
        machineId: "",
        yarnName: "",
        yarnId: "",
      });
      setProductionRows([createEmptyRow()]);
      setAutoPartsSyncEnabled(true);
      initialPartsRef.current = "";
      initialEndsPerPartRef.current = "";
      if (protectPrefilledOrder) {
        setProtectPrefilledOrder(false);
      }
    }
  }, [initialRecord, mode, reset]);


  useEffect(() => {
    if (mode !== "edit" || !initialWarpingDateRaw) return;
    const resolvedDate = toDateInputValue(initialWarpingDateRaw);
    if (resolvedDate) {
      setValue("warpingDate", resolvedDate, { shouldDirty: false, shouldValidate: false });
    }
  }, [mode, initialWarpingDateRaw, setValue]);

  useEffect(() => {
    if (!protectPrefilledOrder) return;
    if (!initialSizingOrderId) return;
    if (sizingOrderIdValue !== initialSizingOrderId) {
      setProtectPrefilledOrder(false);
    }
  }, [protectPrefilledOrder, sizingOrderIdValue, initialSizingOrderId]);

  useEffect(() => {
    if (partsValue === undefined || partsValue === null || partsValue === "") {
      return;
    }
    const parsedParts = Number(partsValue);
    if (!Number.isFinite(parsedParts)) {
      return;
    }
    const desired = parsedParts > 0 ? Math.floor(parsedParts) : 1;
    setProductionRows((prev) => {
      if (prev.length === desired) return prev;
      if (prev.length < desired) {
        const template = mode !== "edit" ? extractSyncTemplate(prev[0]) : undefined;
        const additions = Array.from({ length: desired - prev.length }, () => buildProductionRow(template));
        return [...prev, ...additions];
      }
      return prev.slice(0, desired);
    });
  }, [partsValue, buildProductionRow, mode]);

  useEffect(() => {
    if (!autoPartsSyncEnabled) return;
    const value = endsPerPartValue ?? "";
    setProductionRows((prev) => {
      let changed = false;
      const next = prev.map((row) => {
        const syncState = rowFieldSyncRef.current[row.tempId];
        if (syncState && !syncState.endsPerPart) {
          return row;
        }
        if (String(row.endsPerPart) !== String(value)) {
          changed = true;
          return { ...row, endsPerPart: String(value) };
        }
        return row;
      });
      return changed ? next : prev;
    });
  }, [endsPerPartValue, autoPartsSyncEnabled]);



  useEffect(() => {
    if (autoPartsSyncEnabled) return;
    const initial = initialEndsPerPartRef.current ?? "";
    const current = endsPerPartValue ?? "";
    if (current !== "" && current !== initial) {
      setAutoPartsSyncEnabled(true);
    }
  }, [autoPartsSyncEnabled, endsPerPartValue]);

  const safeWarpingList = useMemo(() => extractArray(warpingProductionList), [warpingProductionList]);

  const machineOptions = useMemo(() => {
    const list = extractArray(machineList);
    return list
      .filter((machine: any) => {
        const id = machine?.id ?? machine?.machineId;
        const isSelected = mode === "edit" && String(id) === String(initialRecord?.machineId);
        return machine?.isActive !== false && machine?.isActive !== "false" || isSelected;
      })
      .map((machine: any) => {
        const id = machine?.id ?? machine?.machineId;
        if (id == null) return null;
        const label = machine?.machineNo || machine?.machineName || `Machine ${id}`;
        return { 
          value: String(id), 
          label,
          isActive: machine?.isActive !== false && machine?.activeFlag !== false 
        };
      })
      .filter(Boolean) as { value: string; label: string }[];
  }, [machineList, mode, initialRecord]);

  const employeeOptions = useMemo(() => {
    const list = extractArray(employeeList);
    const selectedEmployeeIds = new Set(productionRows.map(row => String(row.employeeId)).filter(id => id && id !== "null" && id !== "undefined"));
    
    return list
      .filter((employee: any) => {
        const id = employee?.id ?? employee?.employeeId;
        const isSelected = selectedEmployeeIds.has(String(id));
        return (employee?.isActive !== false && employee?.isActive !== "false" && employee?.isRelieved === false) || isSelected;
      })
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
      .filter(Boolean) as { value: string; label: string }[];
  }, [employeeList, productionRows]);

  const normalizedSizingOrders = useMemo(() => extractArray(sizingJobWorkOrderList), [sizingJobWorkOrderList]);
  const normalizedCustomers = useMemo(() => extractArray(customerList), [customerList]);
  const normalizedCompanies = useMemo(() => extractArray(companyMasterList), [companyMasterList]);

  const customerNameMap = useMemo(() => {
    const map = new Map<number, string>();
    normalizedCustomers.forEach((customer: any) => {
      if (customer?.isActive === false || customer?.isActive === "false") return;
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
      if (company?.isActive === false || company?.isActive === "false") return;
      const id = company?.id ?? company?.companyId;
      const label = company?.companyName || company?.name;
      if (id == null || !label) return;
      map.set(Number(id), label);
    });
    return map;
  }, [normalizedCompanies]);

  const sizingOrderOptions = useMemo(() => {
    return normalizedSizingOrders
      .filter((order: any) => {
        const resolvedId = order?.id ?? order?.sizingJobWorkOrderId ?? order?.sizingPlanId;
        const isSelected = mode === "edit" && String(resolvedId) === String(initialRecord?.sizingOrderId);
        return order?.isActive !== false && order?.isActive !== "false" || isSelected;
      })
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
        const resolvedSizingPlanId =
          toFiniteNumber(order?.sizingPlanId) ??
          toFiniteNumber(order?.planId) ??
          toFiniteNumber(order?.sizingPlan?.id) ??
          toFiniteNumber(order?.plan?.id);
        const buyerInfo = resolveSizingOrderBuyer(order, orderTypeId, customerNameMap, companyNameMap);
        const parts = order?.parts ?? order?.totalParts ?? order?.numberOfParts ?? order?.partsCount ?? null;
        const endsPerPart = order?.endsPerPart ?? order?.endsPerParts ?? order?.ends_per_part ?? null;
        const yarnInfo = resolveYarnInfo(order);
        const orderItems = extractArray(order?.items);
        let yarnOptions = orderItems
          .map((item: any) => {
            const yarnId = item?.yarnId ?? item?.id ?? item?.yarn?.id;
            const yarnLabel =
              item?.yarnName || item?.yarn?.yarnName || item?.yarn?.name || (yarnId != null ? `Yarn ${yarnId}` : "");
            if (!yarnLabel && yarnId == null) return null;
            const optionParts = item?.numberOfParts ?? item?.parts ?? item?.partCount ?? null;
            const optionEndsPerPart = item?.endsPerPart ?? item?.ends_per_part ?? null;
            return {
              value: yarnId != null ? String(yarnId) : yarnLabel,
              label: yarnLabel || "",
              numericId: yarnId != null ? Number(yarnId) : null,
              parts: optionParts != null ? Number(optionParts) : null,
              endsPerPart: optionEndsPerPart != null ? Number(optionEndsPerPart) : null,
            };
          })
          .filter(Boolean) as Array<{ value: string; label: string; numericId: number | null; parts: number | null; endsPerPart: number | null }>;
        if (!yarnOptions.length && (yarnInfo.name || yarnInfo.id != null)) {
          const fallbackLabel = yarnInfo.name || (yarnInfo.id != null ? `Yarn ${yarnInfo.id}` : `Yarn ${resolvedId}`);
          const fallbackValue = yarnInfo.id != null ? String(yarnInfo.id) : fallbackLabel;
          yarnOptions = [
            {
              value: fallbackValue,
              label: fallbackLabel,
              numericId: yarnInfo.id != null ? Number(yarnInfo.id) : null,
              parts: parts != null ? Number(parts) : null,
              endsPerPart: endsPerPart != null ? Number(endsPerPart) : null,
            },
          ];
        }
        const primaryYarnOption = yarnOptions[0];
        const resolvedParts = primaryYarnOption?.parts ?? (parts != null ? Number(parts) : null);
        const resolvedEndsPerPart = primaryYarnOption?.endsPerPart ?? (endsPerPart != null ? Number(endsPerPart) : null);
        const resolvedYarnName = primaryYarnOption?.label || yarnInfo.name;
        const resolvedYarnId = primaryYarnOption?.numericId ?? yarnInfo.id;
        return {
          value: String(resolvedId),
          label,
          meta: {
            sizingOrderId: resolvedId,
            orderNo: label,
            orderTypeId,
            sizingPlanId: resolvedSizingPlanId,
            buyerName: buyerInfo.name,
            buyerId: buyerInfo.id,
            parts: resolvedParts,
            endsPerPart: resolvedEndsPerPart,
            yarnName: resolvedYarnName,
            yarnId: resolvedYarnId,
            yarnOptions,
          },
        };
      })
      .filter(Boolean) as { value: string; label: string; meta: any }[];
  }, [normalizedSizingOrders, customerNameMap, companyNameMap]);

  const sizingOrderMeta = useMemo(() => {
    const map = new Map<string, any>();
    sizingOrderOptions.forEach((option) => map.set(option.value, option.meta));
    return map;
  }, [sizingOrderOptions]);

  const activeYarnOptions = useMemo(() => {
    if (!sizingOrderIdValue) return [] as any[];
    const meta = sizingOrderMeta.get(sizingOrderIdValue);
    if (!meta || !Array.isArray(meta.yarnOptions)) return [] as any[];
    return meta.yarnOptions;
  }, [sizingOrderIdValue, sizingOrderMeta]);

  useEffect(() => {
    const meta = sizingOrderIdValue ? sizingOrderMeta.get(sizingOrderIdValue) : null;
    if (!meta || shouldProtectOrderAutofill) return;
    const defaultYarnOption = Array.isArray(meta.yarnOptions) ? meta.yarnOptions[0] : null;
    const currentValues = getValues();
    
    if (currentValues.buyerName !== (meta.buyerName || "")) {
      setValue("buyerName", meta.buyerName || "");
    }
    const finalBuyerId = meta.buyerId != null ? String(meta.buyerId) : "";
    if (currentValues.buyerId !== finalBuyerId) {
      setValue("buyerId", finalBuyerId);
    }
    const resolvedYarnId = defaultYarnOption?.value ?? (meta.yarnId != null ? String(meta.yarnId) : "");
    if (currentValues.yarnId !== resolvedYarnId) {
      setValue("yarnId", resolvedYarnId);
    }
    const finalYarnName = defaultYarnOption?.label || meta.yarnName || "";
    if (currentValues.yarnName !== finalYarnName) {
      setValue("yarnName", finalYarnName);
    }
    const resolvedParts = defaultYarnOption?.parts ?? meta.parts;
    const finalParts = resolvedParts != null ? String(resolvedParts) : "";
    if (currentValues.parts !== finalParts) {
      setValue("parts", finalParts);
    }
    const resolvedEnds = defaultYarnOption?.endsPerPart ?? meta.endsPerPart;
    const finalEnds = resolvedEnds != null ? String(resolvedEnds) : "";
    if (currentValues.endsPerPart !== finalEnds) {
      setValue("endsPerPart", finalEnds);
    }
  }, [sizingOrderIdValue, sizingOrderMeta, setValue, getValues, shouldProtectOrderAutofill]);

  useEffect(() => {
    if (!sizingOrderIdValue || !yarnIdValue || shouldProtectYarnAutofill) return;
    const meta = sizingOrderMeta.get(sizingOrderIdValue);
    if (!meta || !Array.isArray(meta.yarnOptions)) return;
    const selected = meta.yarnOptions.find((option: any) => option.value === yarnIdValue);
    if (!selected) return;
    
    const currentValues = getValues();
    if (currentValues.yarnName !== (selected.label || "")) {
      setValue("yarnName", selected.label || "");
    }
    if (selected.parts != null) {
      const finalParts = String(selected.parts);
      if (currentValues.parts !== finalParts) {
        setValue("parts", finalParts);
      }
    }
    if (selected.endsPerPart != null) {
      const finalEnds = String(selected.endsPerPart);
      if (currentValues.endsPerPart !== finalEnds) {
        setValue("endsPerPart", finalEnds);
      }
    }
  }, [yarnIdValue, sizingOrderIdValue, sizingOrderMeta, shouldProtectYarnAutofill, setValue, getValues]);

  const existingManualSetNos = useMemo(() => {
    const exclude = mode === "edit" && initialRecord?.manualSetNo ? String(initialRecord.manualSetNo).toLowerCase() : "";
    return safeWarpingList
      .map((entry: any) => {
        const value = entry?.manualSetNo;
        return value ? String(value).toLowerCase() : null;
      })
      .filter((value) => value && value !== exclude) as string[];
  }, [safeWarpingList, initialRecord, mode]);

  const shiftNameSuggestions = useMemo(() => {
    const set = new Set<string>();
    safeWarpingList.forEach((entry: any) => {
      const rows = extractArray(entry?.productionDetails);
      rows.forEach((detail: any) => {
        const text = detail?.shiftName || detail?.shift;
        if (text) set.add(String(text));
      });
    });
    return Array.from(set);
  }, [safeWarpingList]);

  const warpBeamSuggestions = useMemo(() => {
    const set = new Set<string>();
    safeWarpingList.forEach((entry: any) => {
      const rows = extractArray(entry?.productionDetails);
      rows.forEach((detail: any) => {
        const text = detail?.warpBeamNo;
        if (text) set.add(String(text));
      });
    });
    return Array.from(set);
  }, [safeWarpingList]);

  const productionSummary = useMemo(() => {
    const totalActualMeters = productionRows.reduce((sum, row) => sum + safeNumber(row.actualMeters), 0);
    const averageActualMeters = productionRows.length ? totalActualMeters / productionRows.length : 0;
    const totalEnds = productionRows.reduce((sum, row) => sum + safeNumber(row.endsPerPart), 0);
    const totalNetWeight = productionRows.reduce((sum, row) => {
      if (row.netWt) return sum + safeNumber(row.netWt);
      const gross = safeNumber(row.grossWt);
      const tare = safeNumber(row.tareWt);
      return sum + (gross - tare);
    }, 0);
    const breakagesPerMillion = productionRows.reduce((sum, row) => sum + safeNumber(row.breakages), 0);
    return {
      averageActualMeters,
      totalActualMeters,
      totalEnds,
      totalNetWeight,
      breakagesPerMillion,
      warpCount: null,
    };
  }, [productionRows]);

  const adjustPartsCount = (nextCount: number) => {
    const resolved = nextCount < 1 ? 1 : nextCount;
    setValue("parts", String(resolved), { shouldValidate: true, shouldDirty: true });
  };

  const handleProductionChange = (index: number, field: keyof ProductionRow, value: string) => {
    setProductionRows((prev) => {
      let nextRows = prev.map((row, idx) => {
        if (idx !== index) return row;
        const updatedRow = { ...row, [field]: value } as ProductionRow;
        if (field === "grossWt" || field === "tareWt") {
          const gross = safeNumber(updatedRow.grossWt);
          const tare = safeNumber(updatedRow.tareWt);
          const net = gross - tare;
          updatedRow.netWt = Number.isFinite(net) ? String(net) : "";
        }
        return updatedRow;
      });

      if (SYNCABLE_FIELD_SET.has(field as SyncableField)) {
        const syncField = field as SyncableField;
        if (index === 0) {
          nextRows = propagateFirstRowValue(syncField, nextRows);
        } else {
          const targetRow = nextRows[index];
          if (targetRow) {
            disableRowFieldSync(targetRow.tempId, syncField);
          }
        }
      }

      return nextRows;
    });
  };

  const handleAddRow = () => {
    const parsed = Number(partsValue);
    const currentParts = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : productionRows.length || 1;
    setProductionRows((prev) => {
      const template = mode !== "edit" ? extractSyncTemplate(prev[0]) : undefined;
      return [...prev, buildProductionRow(template)];
    });
    adjustPartsCount(currentParts + 1);
  };

  const handleRemoveRow = (tempId: string) => {
    setProductionRows((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((row) => row.tempId !== tempId);
      const nextRows = filtered.length ? filtered : [buildProductionRow()];
      adjustPartsCount(nextRows.length);
      return nextRows;
    });
  };

  const onSubmit = async (values: WarpingFormData) => {
     const hasAnyData = productionRows.some(
    (row) =>
      row.warpBeamNo.trim() !== "" ||
      row.actualMeters.trim() !== "" ||
      row.endsPerPart.trim() !== "" ||
      row.shiftName.trim() !== "" ||
      row.employeeId.trim() !== ""
  );
    const hasFilledRow = productionRows.some(
      (row) =>
        row.warpBeamNo.trim() !== "" ||
        row.actualMeters.trim() !== "" ||
        row.endsPerPart.trim() !== "" ||
        row.shiftName.trim() !== "" ||
        row.employeeId.trim() !== ""
    );
      if (!hasAnyData) {
    toast.error("Please add at least one production detail item");
    return;
  }
    if (!hasFilledRow) {
      toast.error("Atleast add one item");
      return;
    }
      const requiredFields: (keyof ProductionRow)[] = ["warpBeamNo", "actualMeters", "endsPerPart", "shiftName", "employeeId"];
  const incompleteRows: number[] = [];
  const emptyRows: number[] = [];

  productionRows.forEach((row, index) => {
    const hasSomeData = requiredFields.some(field => row[field]?.toString().trim() !== "");
    const isComplete = requiredFields.every(field => row[field]?.toString().trim() !== "");
    
    if (hasSomeData && !isComplete) {
      incompleteRows.push(index + 1);
    }
    
    // Check if row is completely empty (no data at all)
    const isCompletelyEmpty = requiredFields.every(field => !row[field]?.toString().trim());
    if (isCompletelyEmpty && productionRows.length > 1) {
      emptyRows.push(index + 1);
    }
  });

   if (incompleteRows.length > 0) {
    const rowNumbers = incompleteRows.join(", ");
    toast.error(`Please complete all required fields in row(s): ${rowNumbers}. Required fields: Warp Beam No, Actual Meters, Ends/Part, Shift Name, and Employee`);
    return;
  }

    const isEditMode = Boolean(initialRecord?.id);
    const selectedSizingOrderMeta = values.sizingOrderId ? sizingOrderMeta.get(values.sizingOrderId) : null;
    const resolvedSizingPlanIdCandidate =
      selectedSizingOrderMeta?.sizingPlanId ?? initialRecord?.sizingPlanId ?? initialRecord?.planId ?? null;
    const resolvedSizingPlanId = toFiniteNumber(resolvedSizingPlanIdCandidate);
    let warpingProductionNo = values.warpingProductionNo || initialRecord?.warpingProductionNo || "";
    if (!initialRecord?.id && !warpingProductionNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Warping Production",
        });
        warpingProductionNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    isSavingRef.current = true;
    const summaryPayload = {
      actualMetersAverage: productionSummary.averageActualMeters,
      totalActualMeters: productionSummary.totalActualMeters,
      totalEnds: productionSummary.totalEnds,
      totalNetWeight: productionSummary.totalNetWeight,
      breakagesPerMillion: productionSummary.breakagesPerMillion,
      warpCount: productionSummary.warpCount,
    };
    const companyId = resolveSelectedCompanyIdForForm();
    const payload = {
      // documentNo,
      warpingProductionNo: warpingProductionNo,
      warpingDate: values.warpingDate,
      sizingOrderId: values.sizingOrderId ? Number(values.sizingOrderId) : undefined,
      sizingPlanId: resolvedSizingPlanId != null ? resolvedSizingPlanId : undefined,
      buyerName: values.buyerName,
      buyerId: values.buyerId ? Number(values.buyerId) : undefined,
      manualSetNo: values.manualSetNo,
      parts: Number(values.parts) || productionRows.length,
      endsPerPart: Number(values.endsPerPart) || 0,
      machineId: values.machineId ? Number(values.machineId) : undefined,
      yarnName: values.yarnName,
      yarnId: values.yarnId ? Number(values.yarnId) : undefined,
      companyId: companyId ?? undefined,
      totalMeters: summaryPayload.totalActualMeters,
      netWeight: summaryPayload.totalNetWeight,
      productionDetails: productionRows.map((row) => ({
        shift: row.shift,
        shiftName: row.shiftName,
        warpBeamNo: row.warpBeamNo,
        endsPerPart: Number(row.endsPerPart) || 0,
        startTime: row.startTime,
        endTime: row.endTime,
        actualMeters: Number(row.actualMeters) || 0,
        breakages: Number(row.breakages) || 0,
        rpm: Number(row.rpm) || 0,
        tareWt: Number(row.tareWt) || 0,
        grossWt: Number(row.grossWt) || 0,
        netWt: row.netWt ? Number(row.netWt) : Number(row.grossWt) - Number(row.tareWt) || 0,
        employeeId: row.employeeId ? Number(row.employeeId) : undefined,
      })),
      summary: summaryPayload,
    };
// alert(JSON.stringify(payload));
    if (isEditMode) {
      const result = await dispatch(updateWarpingProduction({ id: Number(values.id), data: payload, companyId: companyId ?? undefined }));
      if (updateWarpingProduction.fulfilled.match(result)) {
        onSuccess?.();
      }
      return;
    }
    const createResult = await dispatch(createWarpingProduction(payload));
    if (createWarpingProduction.fulfilled.match(createResult)) {
      documentNumberService.clearMemoryCache("Warping Production");
      onSuccess?.();
    }
  };

  const manualSetField = register("manualSetNo", {
    required: "Manual Set No is required",
    validate: (value) => {
      const trimmed = (value || "").trim().toLowerCase();
      if (!trimmed) return "Manual Set No is required";
      if (existingManualSetNos.includes(trimmed)) {
        return "Manual Set No already exists";
      }
      return true;
    },
  });

  const summaryCards = [
    { label: "Actual meters (Avg)", value: formatNumber(productionSummary.averageActualMeters) },
    { label: "Total meters", value: formatNumber(productionSummary.totalActualMeters) },
    { label: "Total ends", value: formatNumber(productionSummary.totalEnds) },
    { label: "Total net WT", value: formatNumber(productionSummary.totalNetWeight) },
    { label: "Breakages/Million", value: formatNumber(productionSummary.breakagesPerMillion) },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" defaultValue="" {...register("buyerId")} />
      <input type="hidden" defaultValue="" {...register("yarnName")} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
  <label className="block text-sm font-medium">
    Warping Production No<span className="text-red-600">*</span>
  </label>
  <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                {...register('warpingProductionNo')} readOnly />
</div>
        <div>
          <label className="block text-sm font-medium">
            Warping Date<span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            {...register("warpingDate", { required: "Warping Date is required" })}
            className={`input mt-1 ${errors.warpingDate ? "border-red-500" : ""}`}
          />
          {errors.warpingDate && <p className="mt-1 text-xs text-red-600">{String(errors.warpingDate.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">
            Sizing Order No<span className="text-red-600">*</span>
          </label>
          <CommonSearchableSelect
            {...register("sizingOrderId", { required: "Sizing Order No is required" })}
            options={sizingOrderOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            placeholder="Select Order"
            className="mt-1"
            error={errors.sizingOrderId?.message as string}
          />
        </div>
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
          <input
            {...manualSetField}
            className={`input mt-1 ${errors.manualSetNo ? "border-red-500" : ""}`}
            placeholder="Enter Manual Set No"
          />
          {errors.manualSetNo && <p className="mt-1 text-xs text-red-600">{String(errors.manualSetNo.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">
            Parts<span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            {...register("parts", { required: "Parts is required" })}
            className={`input mt-1 ${errors.parts ? "border-red-500" : ""}`}
          />
          {errors.parts && <p className="mt-1 text-xs text-red-600">{String(errors.parts.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">
            Ends Per Parts
          </label>
          <input
            type="number"
            min="0"
            step="1"
            {...register("endsPerPart", { required: "Ends Per Parts is required" })}
            className={`input mt-1 ${errors.endsPerPart ? "border-red-500" : ""}`}
            readOnly
          />
          {errors.endsPerPart && <p className="mt-1 text-xs text-red-600">{String(errors.endsPerPart.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">
            Machine Name<span className="text-red-600">*</span>
          </label>
          <CommonSearchableSelect
            {...register("machineId", { required: "Machine Name is required" })}
            options={machineOptions}
            placeholder="Select Machine"
            className="mt-1"
            error={errors.machineId?.message as string}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Yarn Name<span className="text-red-600">*</span>
          </label>
          <CommonSearchableSelect
            {...register("yarnId", { required: "Yarn Name is required" })}
            options={activeYarnOptions.map((option: any) => ({
              value: option.value,
              label: option.label || option.value,
            }))}
            placeholder="Select Yarn"
            className="mt-1"
            disabled={!activeYarnOptions.length}
            error={errors.yarnId?.message as string}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Production Details</h3>
          <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-white" onClick={handleAddRow}>
            Add Row
          </button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-2">S.No</th>
                {/* <th className="border px-2 py-2">Shift</th> */}
                <th className="border px-2 py-2">Shift Name</th>
                <th className="border px-2 py-2">Warp Beam No</th>
                <th className="border px-2 py-2">Ends/Part</th>
                <th className="border px-2 py-2">Start Time</th>
                <th className="border px-2 py-2">End Time</th>
                <th className="border px-2 py-2">Actual meters</th>
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
              {productionRows.map((row, index) => (
                <tr key={row.tempId} className="odd:bg-white even:bg-gray-50">
                  <td className="border px-2 py-2 text-center">{index + 1}</td>
                  {/* <td className="border px-2 py-2">
                    <input
                      value={row.shift}
                      onChange={(event) => handleProductionChange(index, "shift", event.target.value)}
                      className="input"
                      placeholder="Shift"
                    />
                  </td> */}
                  <td className="border px-2 py-2">
                    <SuggestionInput
                      value={row.shiftName}
                      onChange={(value) => handleProductionChange(index, "shiftName", value)}
                      suggestions={shiftNameSuggestions}
                      placeholder="Shift Name"
                      className="input"
                    />
                  </td>
                  <td className="border px-2 py-2">
                    <SuggestionInput
                      value={row.warpBeamNo}
                      onChange={(value) => handleProductionChange(index, "warpBeamNo", value)}
                      suggestions={warpBeamSuggestions}
                      placeholder="Warp Beam No"
                      className="input"
                    />
                  </td>
                  <td className="border px-2 py-2">
                    <input
                      value={row.endsPerPart}
                      onChange={(event) => handleProductionChange(index, "endsPerPart", event.target.value)}
                      className="input"
                      type="number"
                    />
                  </td>
                  <td className="border px-2 py-2">
                    <input
                      value={row.startTime}
                      onChange={(event) => handleProductionChange(index, "startTime", event.target.value)}
                      className="input"
                      type="time"
                    />
                  </td>
                  <td className="border px-2 py-2">
                    <input
                      value={row.endTime}
                      onChange={(event) => handleProductionChange(index, "endTime", event.target.value)}
                      className="input"
                      type="time"
                    />
                  </td>
                  <td className="border px-2 py-2">
                    <input
                      value={row.actualMeters}
                      onChange={(event) => handleProductionChange(index, "actualMeters", event.target.value)}
                      className="input"
                      type="number"
                      step="0.01"
                    />
                  </td>
                  <td className="border px-2 py-2">
                    <input
                      value={row.breakages}
                      onChange={(event) => handleProductionChange(index, "breakages", event.target.value)}
                      className="input"
                      type="number"
                      step="0.01"
                    />
                  </td>
                  <td className="border px-2 py-2">
                    <input
                      value={row.rpm}
                      onChange={(event) => handleProductionChange(index, "rpm", event.target.value)}
                      className="input"
                      type="number"
                      step="0.01"
                    />
                  </td>
                  <td className="border px-2 py-2">
                    <input
                      value={row.tareWt}
                      onChange={(event) => handleProductionChange(index, "tareWt", event.target.value)}
                      className="input"
                      type="number"
                      step="0.01"
                    />
                  </td>
                  <td className="border px-2 py-2">
                    <input
                      value={row.grossWt}
                      onChange={(event) => handleProductionChange(index, "grossWt", event.target.value)}
                      className="input"
                      type="number"
                      step="0.01"
                    />
                  </td>
                  <td className="border px-2 py-2">
                    <input value={row.netWt} readOnly className="input" />
                  </td>
                  <td className="border px-2 py-2">
                    <CommonSearchableSelect
                      value={row.employeeId}
                      onChange={(val) => handleProductionChange(index, "employeeId", val)}
                      options={employeeOptions}
                      placeholder="Select Employee"
                    />
                  </td>
                  <td className="border px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.tempId)}
                      className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
                      title="Delete"
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

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
          </div>
        ))}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Warp Count</p>
          <p className="text-lg text-gray-700">--</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="rounded-lg border border-gray-300 px-4 py-2" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-white">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
