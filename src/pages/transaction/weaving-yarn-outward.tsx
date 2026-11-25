import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppDispatch, RootState } from "@/state/store";
import { documentNumberService } from "@/services/DocumentNumberService";
import { toast } from "react-toastify";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import {
  getAllWeavingJobWorkOrders,
  getAllWeavingJobWorkOrdersByFactoryCompanyId,
} from "@/state/weavingJobWorkOrderSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllWeftInwards, getWeftInwardsByFactoryCompanyId } from "@/state/weftInwardSlice";
import { createWeavingYarnOutward, updateWeavingYarnOutward, getAllWeavingYarnOutward } from "@/state/weavingYarnOutwardSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllTransports } from "@/state/transportSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";

interface FormValues {
  outwardNo: string;
  outwardDate: string;
  orderTypeId: string;
  weavingJobWorkOrderId: string;
  weavingContractId: string;
  buyerName: string;
  yarnId: string;
  yarnName: string;
  vehicleNo: string;
  remarks: string;
  transportId: string;
}

interface InwardDetailOption {
  value: string;
  label: string;
  inwardId: number;
  inwardNo: string;
  yarnId?: number | null;
  yarnName: string;
  inwardBags: number;
  inwardQuantity: number;
  kgsPerBag: number;
  coneWeight: number;
  millName?: string;
  millId?: number | null;
  warehouseId?: number | null;
  warehouseName?: string;
  lotNo?: string;
  yarnStockDetails?: any[];
}

interface IssueRow {
  selectionId: string;
  id?: number | null;
  weftInwardId: number | null;
  weftInwardNo: string;
  yarnId?: number | null;
  yarnName: string;
  inwardBags: number;
  inwardQuantity: number;
  kgsPerBag: number;
  coneWeight: number;
  issuingBags: number | null;
  issuedQuantity: number | null;
  millId?: number | null;
  millName?: string;
  warehouseId?: number | null;
  warehouseName?: string;
  lotNo?: string;
  yarnStockDetails?: any[];
}

interface YarnOption {
  value: string;
  label: string;
  yarnId: number | null;
}

const ORDER_TYPE_OPTIONS = [
  { value: "1", label: "Internal" },
  { value: "2", label: "External" },
];

const resolveSelectedCompanyId = (): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    if (!stored) return null;
    const numeric = Number(stored);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = JSON.parse(stored);
    const parsedId = parsed?.id ?? parsed?.companyId;
    if (parsedId == null) return null;
    const parsedNumber = Number(parsedId);
    return Number.isFinite(parsedNumber) ? parsedNumber : null;
  } catch {
    return null;
  }
};

const extractArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.data) return extractArray(payload.data);
  return [];
};

const resolveJobWorkOrderLabel = (record: any) => {
  const candidates = [
    record?.weavingWorkOrderNo,
    record?.jobWorkOrderNo,
    record?.orderNo,
    record?.sizingOrderNo,
    record?.sizingJobWorkOrderNo,
  ];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  return match ? String(match) : "";
};

const resolveContractLabel = (record: any, fallbackId?: string | number) => {
  const pickLabel = (source: any) => {
    if (!source || typeof source !== "object") return "";
    const candidates = [
      source?.weavingContractNo,
      source?.weavingContractNumber,
      source?.contractNo,
      source?.contractNumber,
      source?.contractCode,
      source?.referenceNo,
      source?.documentNo,
      source?.label,
      source?.name,
    ];
    const match = candidates.find((value) => value != null && String(value).trim() !== "");
    return match ? String(match) : "";
  };
  const resolved = pickLabel(record) || pickLabel(record?.weavingContract) || pickLabel(record?.contract);
  if (resolved) return resolved;
  const fallback =
    fallbackId ??
    record?.weavingContractId ??
    record?.contractId ??
    record?.id ??
    (typeof record === "string" || typeof record === "number" ? record : null);
  return fallback != null ? `Contract ${fallback}` : "";
};

const resolveRecordBuyerName = (record: any, fallback = "") => {
  const candidates = [
    record?.buyerName,
    record?.customerName,
    record?.consigneeName,
    record?.companyName,
    record?.tradingCompanyName,
  ];
  const match = candidates.find((value) => value != null && String(value).trim() !== "");
  return match ? String(match) : fallback;
};

interface MultiSelectDropdownProps {
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (value: string[]) => void;
  labelLookup: Map<string, string>;
  placeholder?: string;
  disabled?: boolean;
}

function MultiSelectDropdown({ options, value, onChange, labelLookup, placeholder = "Select...", disabled }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        !disabled &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, disabled]);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((entry) => entry !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const filteredOptions = useMemo(() => {
    const term = search.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, search]);

  const selectedChips = value.map((entry) => ({
    value: entry,
    label: labelLookup.get(entry) || entry,
  }));

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-left text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={selectedChips.length ? "text-gray-900" : "text-gray-500"}>
            {selectedChips.length ? `${selectedChips.length} selected` : placeholder}
          </span>
        </button>
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
            <div className="border-b px-3 py-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1 text-sm">
              {filteredOptions.length ? (
                filteredOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={value.includes(option.value)}
                      onChange={() => toggleOption(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))
              ) : (
                <div className="px-3 py-2 text-center text-gray-500">No options</div>
              )}
            </div>
          </div>
        )}
      </div>
      {selectedChips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedChips.map((chip) => (
            <span
              key={chip.value}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
            >
              {chip.label}
              <button type="button" className="text-red-500" onClick={() => toggleOption(chip.value)}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WeavingYarnOutward() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const weavingYarnOutwardDtl = (location.state as any)?.weavingYarnOutwardDtl ?? null;
  const isEditMode = Boolean(weavingYarnOutwardDtl?.id);

  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts as any);
  const weftInwardState = useSelector((state: RootState) => state.weftInward as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory as any);
  const { customerList } = useSelector((state: RootState) => state.customer as any);
  const { transportList } = useSelector((state: RootState) => state.transport as any);
  const { vendorList } = useSelector((state: RootState) => state.vendor as any);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse as any);

  // const [outwardNo, setOutwardNo] = useState<string>("");
  const [isNumberLoading, setIsNumberLoading] = useState(false);
  const [issueRows, setIssueRows] = useState<IssueRow[]>([]);
  const [selectedDetailIds, setSelectedDetailIds] = useState<string[]>([]);
  const [initializedFromRecord, setInitializedFromRecord] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCompanyId = useMemo(() => resolveSelectedCompanyId(), []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      outwardNo: weavingYarnOutwardDtl?.outwardNo || 'Loading sequence...',
      outwardDate: new Date().toISOString().slice(0, 10),
      orderTypeId: "",
      weavingJobWorkOrderId: "",
      weavingContractId: "",
      buyerName: "",
      yarnId: "",
      yarnName: "",
      vehicleNo: "",
      remarks: "",
      transportId: "",
    },
  });

  const orderTypeField = register("orderTypeId", { required: "Order type is required" });
  const weavingOrderField = register("weavingJobWorkOrderId", { required: "Weaving jobwork order is required" });

  const watchOrderTypeId = watch("orderTypeId");
  const watchOrderId = watch("weavingJobWorkOrderId");
  const watchContractId = watch("weavingContractId");
  const watchYarnId = watch("yarnId");
  const watchYarnName = watch("yarnName");
  const watchOutwardDate = watch("outwardDate");
  const watchTransportId = watch("transportId");

  useEffect(() => {
    const companyId = selectedCompanyId;
    if (companyId) {
        dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
                              factoryCompanyId: companyId,
                            }) as any);
      // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(companyId));
      dispatch(getWeftInwardsByFactoryCompanyId({ companyId, fetchAll: true } as any));
    } else {
      dispatch(getAllWeavingJobWorkOrders({} as any));
      dispatch(getAllWeftInwards({ fetchAll: true } as any));
    }
    dispatch(getAllWeavingContract({ fetchAll: true } as any));
    dispatch(getAllCompanies({ fetchAll: true } as any));
    dispatch(getAllSubCategories({ fetchAll: true } as any));
    dispatch(getAllCustomers({ fetchAll: true } as any));
    dispatch(getAllTransports({ fetchAll: true } as any));
    dispatch(getAllVendors({ fetchAll: true } as any));
    dispatch(getAllWarehouse({ fetchAll: true } as any));
  }, [dispatch, selectedCompanyId]);

   const isSavingRef = useRef(false);
          const hasGeneratedNumberRef = useRef(false);
      
       // Generate document number for new beam inward entries
          useEffect(() => {
              const generateDocumentNumber = async () => {
                  // Only generate for new entries (not editing existing ones)
                  if (weavingYarnOutwardDtl || hasGeneratedNumberRef.current) {
                      return;
                  }

                  setValue('outwardNo', 'Loading sequence...');
      
                  try {
                      const result = await documentNumberService.generateDocumentNumber({
                          screenName: 'Weaving Yarn Outward'
                      });
                      setValue('outwardNo', result.documentNumber, { shouldValidate: true });
                      hasGeneratedNumberRef.current = true;
                  } catch (error) {
                      console.error('Failed to generate Weaving Yarn Outward number:', error);
                      toast.error('Failed to generate Weaving Yarn Outward number');
                  }
              };
      
              generateDocumentNumber();
          }, [weavingYarnOutwardDtl, setValue]);
      
          // Cleanup document number cache if not saved
          useEffect(() => {
              const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                  if (hasGeneratedNumberRef.current && !isSavingRef.current && !weavingYarnOutwardDtl) {
                      documentNumberService.clearMemoryCache('Weaving Yarn Outward');
                  }
              };
      
              window.addEventListener('beforeunload', handleBeforeUnload);
      
              return () => {
                  window.removeEventListener('beforeunload', handleBeforeUnload);
                  if (hasGeneratedNumberRef.current && !isSavingRef.current && !weavingYarnOutwardDtl) {
                      documentNumberService.clearMemoryCache('Weaving Yarn Outward');
                  }
              };
          }, [weavingYarnOutwardDtl]);
      
        useEffect(() => {
          if (weavingYarnOutwardDtl?.outwardNo) {
            setValue('outwardNo', weavingYarnOutwardDtl.outwardNo);
          }
        }, [weavingYarnOutwardDtl, setValue]);

  const normalizedOrders = useMemo(() => extractArray(weavingJobWorkOrderList), [weavingJobWorkOrderList]);
  const normalizedContracts = useMemo(() => extractArray(weavingContractList), [weavingContractList]);
  const normalizedInwardList = useMemo(() => {
    const candidate =
      weftInwardState?.list ??
      weftInwardState?.data ??
      weftInwardState?.items ??
      weftInwardState?.rows ??
      weftInwardState;
    return extractArray(candidate);
  }, [weftInwardState]);
  const normalizedVendors = useMemo(() => extractArray(vendorList), [vendorList]);
  const companyNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    extractArray(companyMasterList).forEach((company: any) => {
      const id = company?.id ?? company?.companyId;
      if (id != null) {
        map.set(String(id), company?.companyName || company?.name || `Company ${id}`);
      }
    });
    return map;
  }, [companyMasterList]);

  const customerNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    extractArray(customerList).forEach((customer: any) => {
      const id = customer?.id ?? customer?.customerId;
      if (id != null) {
        map.set(String(id), customer?.customerName || customer?.name || `Customer ${id}`);
      }
    });
    return map;
  }, [customerList]);
  const companyNameToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    extractArray(companyMasterList).forEach((company: any) => {
      const id = company?.id ?? company?.companyId;
      const label = company?.companyName || company?.name;
      if (id != null && label) {
        const normalized = String(label).trim().toLowerCase();
        if (normalized) {
          map.set(normalized, Number(id));
        }
      }
    });
    return map;
  }, [companyMasterList]);

  const vendorNameById = useMemo(() => {
    const map = new Map<string, string>();
    normalizedVendors.forEach((vendor: any) => {
      const vendorId = vendor?.id ?? vendor?.vendorId;
      const label = vendor?.vendorName || vendor?.name || vendor?.companyName;
      if (vendorId != null && label) {
        map.set(String(vendorId), String(label));
      }
    });
    return map;
  }, [normalizedVendors]);

  const millNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    extractArray(subCategoryList).forEach((entry: any) => {
      const category = String(entry?.categoryName || entry?.category || "").toLowerCase();
      if (category === "mill" && entry?.id != null) {
        map.set(
          String(entry.id),
          entry?.subCategoryName || entry?.name || entry?.label || `Mill ${entry.id}`,
        );
      }
    });
    return map;
  }, [subCategoryList]);

  const warehouseOptions = useMemo(() => {
    if (Array.isArray(warehouseList)) return warehouseList;
    if (Array.isArray((warehouseList as any)?.data)) return (warehouseList as any).data;
    if (Array.isArray((warehouseList as any)?.items)) return (warehouseList as any).items;
    return [];
  }, [warehouseList]);

  const transportSelectOptions = useMemo(() =>
    extractArray(transportList)
      .map((transport: any) => {
        const id = transport?.id ?? transport?.transportId;
        if (id == null) return null;
        return {
          value: String(id),
          label: transport?.transportName || transport?.name || `Transport ${id}`,
        };
      })
      .filter((option) => option !== null) as { value: string; label: string }[],
  [transportList]);

  const resolveWarehouseName = useCallback((warehouseId?: string | number | null) => {
    if (warehouseId === undefined || warehouseId === null || warehouseId === "") {
      return "";
    }
    const match = warehouseOptions.find((warehouse: any) => {
      const id = warehouse?.id ?? warehouse?.warehouseId;
      return id != null && String(id) === String(warehouseId);
    });
    return match?.warehouseName || match?.name || match?.label || "";
  }, [warehouseOptions]);

  const contractLookup = useMemo(() => {
    const map = new Map<string, string>();
    normalizedContracts.forEach((contract: any) => {
      const contractId = contract?.id ?? contract?.weavingContractId ?? contract?.contractId;
      if (contractId == null) return;
      map.set(String(contractId), resolveContractLabel(contract, contractId));
    });
    return map;
  }, [normalizedContracts]);

  const resolveFactoryCompanyIdFromContract = useCallback(
    (contractIdentifier?: string | number | null) => {
      if (contractIdentifier == null) return null;
      const target = normalizedContracts.find((contract: any) => {
        const identifier = contract?.id ?? contract?.weavingContractId ?? contract?.contractId;
        return identifier != null && String(identifier) === String(contractIdentifier);
      });
      if (!target) return null;
      const vendorIds = [
        target?.vendorId,
        target?.weavingVendorId,
        target?.vendor?.id,
        target?.vendor?.vendorId,
      ];
      const vendorNames: string[] = [];
      vendorIds.forEach((id) => {
        if (id != null) {
          const label = vendorNameById.get(String(id));
          if (label) {
            vendorNames.push(label);
          }
        }
      });
      vendorNames.push(
        target?.vendorName,
        target?.weavingVendorName,
        target?.vendor?.vendorName,
        target?.vendor?.name,
      );
      for (const name of vendorNames) {
        if (typeof name !== "string") continue;
        const normalized = name.trim().toLowerCase();
        if (!normalized) continue;
        const mapped = companyNameToIdMap.get(normalized);
        if (mapped != null) {
          return mapped;
        }
      }
      return null;
    },
    [normalizedContracts, vendorNameById, companyNameToIdMap],
  );

  const resolveVendorInfoFromContract = useCallback(
    (contractIdentifier?: string | number | null) => {
      if (contractIdentifier == null) {
        return { vendorId: null, vendorName: null };
      }
      const target = normalizedContracts.find((contract: any) => {
        const identifier = contract?.id ?? contract?.weavingContractId ?? contract?.contractId;
        return identifier != null && String(identifier) === String(contractIdentifier);
      });
      if (!target) {
        return { vendorId: null, vendorName: null };
      }
      const vendorIds = [
        target?.vendorId,
        target?.weavingVendorId,
        target?.vendor?.id,
        target?.vendor?.vendorId,
      ];
      let resolvedVendorId: number | null = null;
      for (const id of vendorIds) {
        if (id == null) continue;
        const numeric = Number(id);
        if (Number.isFinite(numeric)) {
          resolvedVendorId = numeric;
          break;
        }
      }
      const vendorNameCandidates = [
        target?.vendorName,
        target?.weavingVendorName,
        target?.vendor?.vendorName,
        target?.vendor?.name,
        resolvedVendorId != null ? vendorNameById.get(String(resolvedVendorId)) : undefined,
      ];
      const resolvedVendorName =
        vendorNameCandidates.find((entry) => typeof entry === "string" && entry.trim())?.trim() || null;
      return { vendorId: resolvedVendorId, vendorName: resolvedVendorName };
    },
    [normalizedContracts, vendorNameById],
  );

  const orderOptions = useMemo(() => {
    return normalizedOrders
      .map((order: any) => {
        const orderId = order?.id ?? order?.weavingJobWorkOrderId ?? order?.jobWorkOrderId;
        if (orderId == null) return null;
        const orderTypeId = Number(order?.orderTypeId ?? order?.orderType) === 2 ? 2 : 1;
        const contractId = order?.weavingContractId ?? order?.contractId ?? order?.weavingContract?.id ?? null;
        const buyerId =
          orderTypeId === 2
            ? order?.buyerId ?? order?.customerId ?? order?.consigneeId
            : order?.tradingCompanyId ?? order?.factoryCompanyId ?? order?.buyerCompanyId;
        const buyerLabel =
          resolveRecordBuyerName(order) ||
          (buyerId != null ? (orderTypeId === 2 ? customerNameLookup.get(String(buyerId)) : companyNameLookup.get(String(buyerId))) : "") ||
          "";
        const firstItem = extractArray(order?.items)[0];
        const fallbackYarnName =
          firstItem?.yarnName ??
          firstItem?.actualYarn ??
          firstItem?.yarnCount ??
          firstItem?.yarn?.yarnName ??
          firstItem?.yarn?.name ??
          "";
        const fallbackYarnId = firstItem?.yarnId ?? firstItem?.yarn?.id ?? null;
        const yarnLabel = order?.yarnName || order?.warpYarnName || fallbackYarnName || "";
        const yarnId = order?.yarnId ?? order?.warpYarnId ?? fallbackYarnId ?? null;
        return {
          id: String(orderId),
          orderTypeId,
          label: resolveJobWorkOrderLabel(order) || `Order ${orderId}`,
          contractId: contractId != null ? String(contractId) : "",
          contractLabel:
            (contractId != null ? contractLookup.get(String(contractId)) : "") ||
            resolveContractLabel(order?.weavingContract ?? {}, contractId),
          buyerLabel,
          buyerId: buyerId != null ? Number(buyerId) : null,
          yarnLabel,
          yarnId: yarnId != null ? Number(yarnId) : null,
          tradingCompanyId: order?.tradingCompanyId ?? order?.factoryCompanyId ?? null,
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        orderTypeId: number;
        label: string;
        contractId: string;
        contractLabel?: string;
        buyerLabel?: string;
        buyerId: number | null;
        yarnLabel?: string;
        yarnId: number | null;
        tradingCompanyId: number | null;
      }>;
  }, [normalizedOrders, contractLookup, companyNameLookup]);

  const filteredOrderOptions = useMemo(() => {
    if (!watchOrderTypeId) return orderOptions;
    return orderOptions.filter((option) => String(option.orderTypeId) === watchOrderTypeId);
  }, [orderOptions, watchOrderTypeId]);

  const weavingJobSelectOptions = useMemo(() =>
    filteredOrderOptions.map((option) => ({
      value: option.id,
      label: option.label,
    })),
  [filteredOrderOptions]);

  const selectedOrderMeta = useMemo(() => {
    return orderOptions.find((option) => option.id === watchOrderId) || null;
  }, [orderOptions, watchOrderId]);

  const selectedOrderRecord = useMemo(() => {
    if (!watchOrderId) return null;
    return (
      normalizedOrders.find((order: any) => {
        const identifier =
          order?.id ?? order?.sizingJobWorkOrderId ?? order?.orderId ?? order?.sizingOrderId;
        return identifier != null && String(identifier) === String(watchOrderId);
      }) || null
    );
  }, [normalizedOrders, watchOrderId]);

  const contractOptions = useMemo(() => {
    return normalizedContracts
      .map((contract: any) => {
        const contractId = contract?.id ?? contract?.weavingContractId ?? contract?.contractId;
        if (contractId == null) return null;
        const optionOrderType = Number(contract?.orderTypeId ?? contract?.orderType);
        return {
          value: String(contractId),
          label: contractLookup.get(String(contractId)) || resolveContractLabel(contract, contractId),
          orderTypeId: Number.isFinite(optionOrderType) ? optionOrderType : null,
        };
      })
      .filter(Boolean) as Array<{ value: string; label: string; orderTypeId: number | null }>;
  }, [normalizedContracts, contractLookup]);

  const detailOptions = useMemo(() => {
    if (!watchOrderId) return [] as InwardDetailOption[];
    const targetOrderId = String(watchOrderId);
    const options: InwardDetailOption[] = [];

    normalizedInwardList.forEach((inward: any) => {
      const identifiers = [
        inward?.weavingJobWorkOrderId,
        inward?.weavingWorkOrderId,
        inward?.jobWorkOrderId,
        inward?.jobWorkOrder?.id,
        inward?.sizingJobWorkOrderId,
        inward?.orderId,
      ];
      const matchesOrder = identifiers.some((identifier) => identifier != null && String(identifier) === targetOrderId);
      if (!matchesOrder) return;

      const inwardId = Number(inward?.id ?? inward?.weftInwardId ?? inward?.inwardId ?? options.length + 1);
      const inwardNo = inward?.inwardNo || inward?.weftInwardNo || inward?.documentNo || `IN-${inwardId}`;
      const detailCollection =
        inward?.yarnDetails ??
        inward?.weftYarnDetails ??
        inward?.details ??
        inward?.yarnDetail ??
        inward?.yarn_items ??
        [];

      extractArray(detailCollection).forEach((detail: any, idx: number) => {
        const resolvedYarnId =
          detail?.yarnId ??
          detail?.actualYarnId ??
          detail?.yarn?.id ??
          detail?.yarn?.yarnId ??
          detail?.yarnMaster?.id ??
          null;
        const resolvedYarnName =
          detail?.yarnName ??
          detail?.actualYarn ??
          detail?.yarn?.yarnName ??
          detail?.yarn?.name ??
          detail?.yarnMaster?.yarnName ??
          "";
        const resolvedMillId = detail?.millId ?? detail?.mill?.id ?? detail?.millMaster?.id ?? null;
        const resolvedMillName =
          detail?.millName ??
          detail?.mill?.subCategoryName ??
          detail?.mill?.millName ??
          detail?.mill?.name ??
          detail?.millMaster?.millName ??
          (resolvedMillId != null ? millNameLookup.get(String(resolvedMillId)) ?? "" : "");
        const resolvedLotNo = detail?.lotNo ?? detail?.lotNumber ?? detail?.lotno ?? "";
        const resolvedWarehouseId = detail?.warehouseId ?? detail?.warehouse?.id ?? detail?.warehouseMaster?.id ?? detail?.godownId ?? null;
        const resolvedWarehouseName =
          detail?.warehouseName ??
          detail?.warehouse?.warehouseName ??
          detail?.warehouse?.name ??
          detail?.warehouseMaster?.warehouseName ??
          detail?.warehouseMaster?.name ??
          detail?.godownName ??
          (resolvedWarehouseId != null ? resolveWarehouseName(resolvedWarehouseId) : "");
        const rawBags = Number(detail?.bags ?? detail?.noOfBags ?? detail?.availableBags ?? detail?.inwardBags ?? 0);
        const rawQuantity = Number(
          detail?.totalKgs ??
            detail?.totalQty ??
            detail?.quantity ??
            detail?.inwardQuantity ??
            detail?.issueQty ??
            detail?.issuedQuantity ??
            0,
        );
        const kgsPerBag = Number(
          detail?.kgsPerBag ??
            detail?.kgs_per_bag ??
            detail?.kgsPerbundle ??
            (rawBags ? rawQuantity / rawBags : 0),
        );
        const resolvedConeWeight = Number(detail?.coneWeight ?? detail?.conesWeight ?? detail?.cone_weight ?? 0);
        const resolvedYarnStockDetails = extractArray(
          detail?.yarnStockDetails ??
            detail?.stockDetails ??
            detail?.lotDetails ??
            detail?.lots ??
            detail?.yarnLots ??
            detail?.yarnStock ??
            detail?.yarnStockDetail,
        );
        const uniqueValue = `${inwardId}-${detail?.id ?? idx}`;
        options.push({
          value: uniqueValue,
          label: `${inwardNo} - ${resolvedYarnName || "Yarn"}`,
          inwardId,
          inwardNo,
          yarnId: resolvedYarnId,
          yarnName: resolvedYarnName || "",
          inwardBags: Number.isFinite(rawBags) ? rawBags : 0,
          inwardQuantity: Number.isFinite(rawQuantity) ? rawQuantity : 0,
          kgsPerBag: Number.isFinite(kgsPerBag) ? Number(kgsPerBag.toFixed(3)) : 0,
          coneWeight: Number.isFinite(resolvedConeWeight) ? resolvedConeWeight : 0,
          millName: resolvedMillName,
          millId: resolvedMillId,
          warehouseId: resolvedWarehouseId,
          warehouseName: resolvedWarehouseName,
          lotNo: resolvedLotNo,
          yarnStockDetails: resolvedYarnStockDetails.length ? resolvedYarnStockDetails.map((entry: any) => ({ ...entry })) : undefined,
        });
      });
    });

    return options;
  }, [normalizedInwardList, watchOrderId, millNameLookup]);

  const detailOptionMap = useMemo(() => {
    const map = new Map<string, InwardDetailOption>();
    detailOptions.forEach((option) => map.set(option.value, option));
    return map;
  }, [detailOptions]);

  const yarnOptions = useMemo(() => {
    if (!watchOrderId) return [];
    const options = new Map<string, YarnOption>();
    const addOption = (id: any, label: any) => {
      const resolvedLabel = label != null && String(label).trim() !== "" ? String(label) : "";
      if (!resolvedLabel) return;
      const numericId = Number(id);
      const hasNumericId = id != null && id !== "" && Number.isFinite(numericId);
      const key = hasNumericId ? `id:${numericId}` : `label:${resolvedLabel}`;
      if (!options.has(key)) {
        options.set(key, {
          value: key,
          label: resolvedLabel,
          yarnId: hasNumericId ? numericId : null,
        });
      }
    };
    const addFromCollection = (collection: any) => {
      extractArray(collection).forEach((item: any) => {
        const optionId = item?.yarnId ?? item?.id ?? item?.yarn?.id;
        const optionLabel =
          item?.yarnName ??
          item?.name ??
          item?.label ??
          item?.actualYarn ??
          item?.yarnCount ??
          "";
        addOption(optionId, optionLabel);
      });
    };
    if (selectedOrderRecord) {
      addFromCollection(selectedOrderRecord?.items);
      addFromCollection(selectedOrderRecord?.yarnDetails);
      addFromCollection(selectedOrderRecord?.yarnRequirements);
      addOption(
        selectedOrderRecord?.yarnId ?? selectedOrderRecord?.warpYarnId,
        selectedOrderRecord?.yarnName ?? selectedOrderRecord?.warpYarnName,
      );
    } else if (selectedOrderMeta) {
      addOption(selectedOrderMeta.yarnId, selectedOrderMeta.yarnLabel);
    }
    return Array.from(options.values());
  }, [selectedOrderRecord, selectedOrderMeta, watchOrderId]);

  useEffect(() => {
    if (!yarnOptions.length) {
      if (watchYarnId || watchYarnName) {
        setValue("yarnId", "", { shouldValidate: false });
        setValue("yarnName", "", { shouldValidate: false });
      }
      return;
    }
    const matchById = watchYarnId
      ? yarnOptions.find((option) => option.yarnId != null && String(option.yarnId) === watchYarnId)
      : null;
    const matchByName = !matchById && watchYarnName
      ? yarnOptions.find((option) => option.label === watchYarnName)
      : null;
    if (!matchById && !matchByName) {
      const first = yarnOptions[0];
      setValue("yarnName", first.label, { shouldValidate: false });
      setValue("yarnId", first.yarnId != null ? String(first.yarnId) : "", { shouldValidate: false });
    }
  }, [yarnOptions, watchYarnId, watchYarnName, setValue]);

  const yarnSelectValue = useMemo(() => {
    if (!yarnOptions.length) return "";
    if (watchYarnId) {
      const match = yarnOptions.find((option) => option.yarnId != null && String(option.yarnId) === watchYarnId);
      if (match) return match.value;
    }
    if (watchYarnName) {
      const match = yarnOptions.find((option) => option.label === watchYarnName);
      if (match) return match.value;
    }
    return yarnOptions[0].value;
  }, [yarnOptions, watchYarnId, watchYarnName]);

  useEffect(() => {
    if (selectedOrderMeta) {
      const nextOrderType = String(selectedOrderMeta.orderTypeId);
      if (watchOrderTypeId !== nextOrderType) {
        setValue("orderTypeId", nextOrderType, { shouldValidate: true });
      }
      setValue("weavingContractId", selectedOrderMeta.contractId || "", { shouldValidate: false });
      setValue("buyerName", selectedOrderMeta.buyerLabel || "", { shouldValidate: false });
      setValue("yarnId", selectedOrderMeta.yarnId != null ? String(selectedOrderMeta.yarnId) : "", { shouldValidate: false });
      setValue("yarnName", selectedOrderMeta.yarnLabel || "", { shouldValidate: false });
    } else if (watchOrderId === "") {
      setValue("weavingContractId", "", { shouldValidate: false });
      setValue("buyerName", "", { shouldValidate: false });
      setValue("yarnId", "", { shouldValidate: false });
      setValue("yarnName", "", { shouldValidate: false });
    }
  }, [selectedOrderMeta, setValue, watchOrderId, watchOrderTypeId]);

  const handleOrderTypeChange = (_nextValue: string) => {
    setValue("weavingJobWorkOrderId", "", { shouldValidate: true });
    setValue("weavingContractId", "", { shouldValidate: false });
    setValue("buyerName", "", { shouldValidate: false });
    setValue("yarnId", "", { shouldValidate: false });
    setValue("yarnName", "", { shouldValidate: false });
    setIssueRows([]);
    setSelectedDetailIds([]);
  };

  const handleWeavingOrderChange = (_nextValue: string) => {
    setSelectedDetailIds([]);
    setIssueRows([]);
    setValue("weavingContractId", "", { shouldValidate: false });
    setValue("buyerName", "", { shouldValidate: false });
    setValue("yarnId", "", { shouldValidate: false });
    setValue("yarnName", "", { shouldValidate: false });
  };

  const handleYarnSelection = (nextValue: string) => {
    const option = yarnOptions.find((entry) => entry.value === nextValue);
    setValue("yarnName", option?.label || "", { shouldValidate: false });
    setValue("yarnId", option?.yarnId != null ? String(option.yarnId) : "", { shouldValidate: false });
  };

  useEffect(() => {
    if (watchOrderId) {
      clearErrors("weavingJobWorkOrderId");
    }
  }, [watchOrderId, clearErrors]);

  useEffect(() => {
    if (!watchOrderId && issueRows.length) {
      setIssueRows([]);
      setSelectedDetailIds([]);
    }
  }, [watchOrderId, issueRows.length]);


  const handleSelectionChange = (values: string[]) => {
    setSelectedDetailIds(values);
    setIssueRows((prev) => {
      const next: IssueRow[] = [];
      values.forEach((value) => {
        const existing = prev.find((row) => row.selectionId === value);
        if (existing) {
          next.push(existing);
        } else {
          const option = detailOptionMap.get(value);
          if (!option) return;
          next.push({
            selectionId: value,
            weftInwardId: option.inwardId,
            weftInwardNo: option.inwardNo,
            yarnId: option.yarnId ?? null,
            yarnName: option.yarnName || "",
            inwardBags: option.inwardBags,
            inwardQuantity: option.inwardQuantity,
            kgsPerBag: option.kgsPerBag,
            coneWeight: option.coneWeight,
            issuingBags: null,
            issuedQuantity: null,
            millId: option.millId ?? null,
            millName: option.millName || "",
            warehouseId: option.warehouseId ?? null,
            warehouseName: option.warehouseName || resolveWarehouseName(option.warehouseId),
            lotNo: option.lotNo || "",
            yarnStockDetails: option.yarnStockDetails ? option.yarnStockDetails.map((entry: any) => ({ ...entry })) : undefined,
          });
        }
      });
      return next;
    });
  };

  const handleRowChange = (selectionId: string, field: keyof IssueRow, value: string) => {
    const parseNumericInput = (input: string): number | null => {
      if (input == null) return null;
      const trimmed = String(input).trim();
      if (trimmed === "") return null;
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : null;
    };
    setIssueRows((prev) =>
      prev.map((row) => {
        if (row.selectionId !== selectionId) return row;
        const nextRow = { ...row };
        if (field === "issuingBags") {
          const numeric = parseNumericInput(value);
          if (numeric === null) {
            nextRow.issuingBags = null;
            nextRow.issuedQuantity = null;
          } else {
            nextRow.issuingBags = numeric;
            const computed = Number(((numeric ?? 0) * (nextRow.kgsPerBag || 0)).toFixed(3));
            nextRow.issuedQuantity = Number.isFinite(computed) ? computed : nextRow.issuedQuantity;
          }
        } else if (field === "issuedQuantity") {
          const numeric = parseNumericInput(value);
          if (numeric === null) {
            nextRow.issuedQuantity = null;
          } else {
            nextRow.issuedQuantity = numeric;
          }
        } else if (field === "millName") {
          nextRow.millName = value;
        } else if (field === "lotNo") {
          nextRow.lotNo = value;
        } else if (field === "warehouseId") {
          const normalized = value ? Number(value) : null;
          nextRow.warehouseId = normalized;
          nextRow.warehouseName = normalized != null ? resolveWarehouseName(normalized) : "";
        }
        return nextRow;
      }),
    );
  };

  const handleRemoveRow = (selectionId: string) => {
    setIssueRows((prev) => prev.filter((row) => row.selectionId !== selectionId));
    setSelectedDetailIds((prev) => prev.filter((value) => value !== selectionId));
  };

  const rowErrorMap = useMemo(() => {
    const map = new Map<string, string>();
    issueRows.forEach((row) => {
      if (!row.issuingBags || row.issuingBags <= 0) {
        map.set(row.selectionId, "Issuing bags is required");
        return;
      }
      if (row.issuingBags > row.inwardBags) {
        map.set(row.selectionId, "Issuing bags cannot exceed inward bags");
        return;
      }
      if (row.issuedQuantity != null && row.issuedQuantity > row.inwardQuantity) {
        map.set(row.selectionId, "Issued quantity exceeds available quantity");
        return;
      }
    });
    return map;
  }, [issueRows]);

  const summary = useMemo(() => {
    return issueRows.reduce(
      (acc, row) => {
        const bags = Number(row.issuingBags ?? 0);
        const qty = Number(row.issuedQuantity ?? 0);
        return {
          bags: acc.bags + (Number.isFinite(bags) ? bags : 0),
          qty: acc.qty + (Number.isFinite(qty) ? qty : 0),
        };
      },
      { bags: 0, qty: 0 },
    );
  }, [issueRows]);

  const summaryYarnName = useMemo(() => {
    const unique = new Set<string>();
    issueRows.forEach((row) => {
      const name = row.yarnName?.trim();
      if (name) unique.add(name);
    });
    if (unique.size) {
      return Array.from(unique).join(", ");
    }
    const fallback = watchYarnName?.trim();
    return fallback || "";
  }, [issueRows, watchYarnName]);

  useEffect(() => {
    if (!weavingYarnOutwardDtl || initializedFromRecord) return;
    setValue("outwardDate", weavingYarnOutwardDtl?.outwardDate?.slice(0, 10) || weavingYarnOutwardDtl?.documentDate || new Date().toISOString().slice(0, 10));
    const inferredOrderType = weavingYarnOutwardDtl?.orderTypeId ?? (String(weavingYarnOutwardDtl?.orderType || "").toLowerCase().includes("external") ? 2 : 1);
    setValue("orderTypeId", inferredOrderType ? String(inferredOrderType) : "", { shouldValidate: true });
    const resolvedOrderId =
      weavingYarnOutwardDtl?.weavingJobWorkOrderId ??
      weavingYarnOutwardDtl?.sizingOrderId ??
      weavingYarnOutwardDtl?.orderId ??
      null;
    if (resolvedOrderId != null) {
      setValue("weavingJobWorkOrderId", String(resolvedOrderId), { shouldValidate: true });
    }
    const resolvedContractId =
      weavingYarnOutwardDtl?.weavingContractId ??
      weavingYarnOutwardDtl?.contractId ??
      null;
    setValue("weavingContractId", resolvedContractId != null ? String(resolvedContractId) : "", { shouldValidate: false });
    setValue("buyerName", resolveRecordBuyerName(weavingYarnOutwardDtl) || "", { shouldValidate: false });
    setValue("yarnName", weavingYarnOutwardDtl?.yarnName || "", { shouldValidate: false });
    setValue("vehicleNo", weavingYarnOutwardDtl?.vehicleNo || "", { shouldValidate: false });
    setValue("remarks", weavingYarnOutwardDtl?.remarks || "", { shouldValidate: false });
    setValue("transportId", weavingYarnOutwardDtl?.transportId ? String(weavingYarnOutwardDtl.transportId) : "", { shouldValidate: false });

    const details = extractArray(weavingYarnOutwardDtl?.yarnIssueDetails || weavingYarnOutwardDtl?.items || weavingYarnOutwardDtl?.details);
    const preparedRows: IssueRow[] = details.map((detail: any, idx: number) => {
      const selectionId = `${weavingYarnOutwardDtl.id || "row"}-${detail?.id ?? idx}`;
      const issuingBags = Number(detail?.issuingBags ?? detail?.issuedBags ?? detail?.issueBags ?? 0);
      const kgsPerBag = Number(detail?.kgsPerBag ?? detail?.kgs_per_bag ?? 0);
      const issuedQuantity = Number(detail?.issuedQuantity ?? detail?.issueQty ?? detail?.issuedQty ?? issuingBags * kgsPerBag);
      const resolvedYarnStockDetails = extractArray(
        detail?.yarnStockDetails ??
          detail?.stockDetails ??
          detail?.lotDetails ??
          detail?.lots ??
          detail?.yarnLots ??
          detail?.yarnStock ??
          detail?.yarnStockDetail,
      );
      return {
        selectionId,
        id: detail?.id ?? null,
        weftInwardId: detail?.weftInwardId ?? detail?.inwardId ?? null,
        weftInwardNo: detail?.weftInwardNo || detail?.inwardNo || "-",
        yarnId: detail?.yarnId ?? null,
        yarnName: detail?.yarnName || detail?.actualYarn || "",
        inwardBags: Number(detail?.inwardBags ?? detail?.availableBags ?? detail?.noOfBags ?? 0),
        inwardQuantity: Number(detail?.inwardQuantity ?? detail?.availableQty ?? detail?.quantity ?? detail?.issuedQuantity ?? 0),
        kgsPerBag,
        coneWeight: Number(detail?.coneWeight ?? detail?.conesWeight ?? 0),
        issuingBags,
        issuedQuantity,
        millId: detail?.millId ?? detail?.mill?.id ?? null,
        millName: detail?.millName || detail?.mill?.subCategoryName || detail?.mill?.name || "",
        warehouseId: detail?.warehouseId ?? detail?.warehouse?.id ?? detail?.warehouseMaster?.id ?? detail?.godownId ?? null,
        warehouseName:
          detail?.warehouseName ||
          detail?.warehouse?.warehouseName ||
          detail?.warehouse?.name ||
          detail?.warehouseMaster?.warehouseName ||
          detail?.warehouseMaster?.name ||
          detail?.godownName ||
          "",
        lotNo: detail?.lotNo || "",
        yarnStockDetails: resolvedYarnStockDetails.length
          ? resolvedYarnStockDetails.map((entry: any) => ({ ...entry }))
          : undefined,
      };
    });
    setIssueRows(preparedRows);
    setSelectedDetailIds(preparedRows.map((row) => row.selectionId));
    setInitializedFromRecord(true);
  }, [weavingYarnOutwardDtl, initializedFromRecord, setValue]);

  const labelLookup = useMemo(() => {
    const map = new Map<string, string>();
    detailOptions.forEach((option) => map.set(option.value, option.label));
    issueRows.forEach((row) => {
      const fallbackLabel = `${row.weftInwardNo || "Inward"} - ${row.yarnName || "Yarn"}`;
      if (!map.has(row.selectionId)) {
        map.set(row.selectionId, fallbackLabel);
      }
    });
    return map;
  }, [detailOptions, issueRows]);

  const canSubmit = Boolean(
      watchOutwardDate &&
      watchOrderTypeId &&
      watchOrderId &&
      issueRows.length > 0 &&
      rowErrorMap.size === 0 &&
      !isSubmitting,
      
  );

  const onSubmit = async (formValues: FormValues) => {
     const isEditMode = Boolean(weavingYarnOutwardDtl?.id);
           let outwardNo = formValues.outwardNo || weavingYarnOutwardDtl?.outwardNo || "";
                if (!weavingYarnOutwardDtl?.id && !outwardNo) {
                    try {
                        const docResponse = await documentNumberService.generateDocumentNumber({
                            screenName: "Weaving Yarn Outward",
                        });
                        outwardNo = docResponse.documentNumber;
                    } catch (error) {
                        console.warn("Failed to generate document number:", error);
                    }
                }
    isSavingRef.current = true;
    if (!watchOrderId) {
      toast.error("Select weaving jobwork order");
      return;
    }
    if (!issueRows.length) {
      toast.error("Add at least one yarn inward reference");
      return;
    }
    if (rowErrorMap.size > 0) {
      toast.error("Resolve validation errors in yarn issue details");
      return;
    }

    const parsedYarnId = Number(formValues.yarnId);
    const resolvedYarnId = formValues.yarnId && Number.isFinite(parsedYarnId) ? parsedYarnId : null;
    const resolvedOrderTypeId = Number(formValues.orderTypeId) || (selectedOrderMeta?.orderTypeId ?? 0);
    const contractIdentifier = formValues.weavingContractId || selectedOrderMeta?.contractId || null;
    const { vendorId: resolvedContractVendorId, vendorName: resolvedContractVendorName } =
      resolveVendorInfoFromContract(contractIdentifier);
    const derivedFactoryCompanyId = resolveFactoryCompanyIdFromContract(contractIdentifier);

    const payload: any = {
      id: weavingYarnOutwardDtl?.id ?? 0,
      outwardNo: outwardNo,
      outwardDate: formValues.outwardDate,
      orderTypeId: resolvedOrderTypeId,
      weavingJobWorkOrderId: Number(watchOrderId),
      weavingContractId: formValues.weavingContractId ? Number(formValues.weavingContractId) : null,
      buyerId: resolvedOrderTypeId === 2 ? selectedOrderMeta?.buyerId :selectedOrderMeta?.tradingCompanyId,
      tradingCompanyId:
        resolvedOrderTypeId === 1
          ? selectedOrderMeta?.tradingCompanyId ?? selectedOrderMeta?.buyerId ?? null
          : null,
      buyerName: formValues.buyerName,
      yarnId: resolvedYarnId,
      yarnName: formValues.yarnName,
      vehicleNo: formValues.vehicleNo,
      remarks: formValues.remarks,
      transportId: formValues.transportId ? Number(formValues.transportId) : null,
      summary: {
        issuedBags: summary.bags,
        issuedQuantity: summary.qty,
      },
      yarnIssueDetails: issueRows.map((row) => {
        const detailPayload: any = {
          id: row.id ?? 0,
          weftInwardId: row.weftInwardId,
          weftInwardNo: row.weftInwardNo,
          yarnId: row.yarnId,
          yarnName: row.yarnName,
          inwardBags: row.inwardBags,
          inwardQuantity: row.inwardQuantity,
          kgsPerBag: row.kgsPerBag,
          coneWeight: row.coneWeight,
          issuingBags: Number(row.issuingBags ?? 0),
          issuedQuantity: Number(row.issuedQuantity ?? 0),
          millId: row.millId ?? null,
          millName: row.millName,
          warehouseId: row.warehouseId ?? null,
          warehouseName: row.warehouseName,
          lotNo: row.lotNo,
        };
        const stockDetails = extractArray(row.yarnStockDetails);
        if (stockDetails.length) {
          detailPayload.yarnStockDetails = stockDetails.map((entry: any) => ({ ...entry }));
        }
        return detailPayload;
      }),
    };

    if (resolvedContractVendorId != null) {
      payload.vendorId = resolvedContractVendorId;
    }
    if (resolvedContractVendorName) {
      payload.vendorName = resolvedContractVendorName;
    }

    let mappedFactoryCompanyId = derivedFactoryCompanyId;
    if (mappedFactoryCompanyId == null && resolvedContractVendorName) {
      const normalizedVendorName = resolvedContractVendorName.trim().toLowerCase();
      if (normalizedVendorName) {
        const matchedCompanyId = companyNameToIdMap.get(normalizedVendorName) ?? null;
        if (matchedCompanyId != null) {
          mappedFactoryCompanyId = matchedCompanyId;
        }
      }
    }

    if (mappedFactoryCompanyId != null) {
      payload.factoryCompanyId = mappedFactoryCompanyId;
    } else if (selectedCompanyId != null) {
      payload.factoryCompanyId = selectedCompanyId;
    }

    setIsSubmitting(true);
    try {
      // alert("Form submitted with payload:\n" + JSON.stringify(payload)); 
      if (isEditMode) {
        await dispatch(updateWeavingYarnOutward({ id: weavingYarnOutwardDtl.id, data: payload, companyId: selectedCompanyId ?? undefined })).unwrap();
      } else {
        await dispatch(createWeavingYarnOutward(payload)).unwrap();
       documentNumberService.clearMemoryCache("Weaving Yarn Outward");
      }
      await dispatch(getAllWeavingYarnOutward({ offset: 0, limit: 10, companyId: selectedCompanyId ?? undefined }));
      navigate("/transaction/weaving-yarn-outward-details");
    } catch (error) {
      console.error("Failed to save weaving yarn outward", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const orderTypeForDisplay = watchOrderTypeId || (selectedOrderMeta ? String(selectedOrderMeta.orderTypeId) : "");
  const showContractDropdown = orderTypeForDisplay === "1";
  const filteredContractOptions = useMemo(() => {
    if (!showContractDropdown) return [];
    const orderContractId = selectedOrderMeta?.contractId;
    if (orderContractId) {
      return [
        {
          value: orderContractId,
          label: contractLookup.get(String(orderContractId)) || selectedOrderMeta?.contractLabel || `Contract ${orderContractId}`,
          orderTypeId: 1,
        },
      ];
    }
    const internalOptions = contractOptions.filter((option) => option.orderTypeId === 1 || option.orderTypeId == null);
    const nextOptions = [...internalOptions];
    if (watchContractId && !nextOptions.some((option) => option.value === watchContractId)) {
      nextOptions.unshift({
        value: watchContractId,
        label: contractLookup.get(String(watchContractId)) || selectedOrderMeta?.contractLabel || `Contract ${watchContractId}`,
        orderTypeId: 1,
      });
    }
    return nextOptions;
  }, [showContractDropdown, contractOptions, watchContractId, contractLookup, selectedOrderMeta]);

  return (
    <div className="p-6 pt-16 space-y-6 mt-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/transaction/weaving-yarn-outward-details")}> 
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{isEditMode ? "Edit" : "Add"} Weaving Yarn Outward</h1>
            <p className="text-sm text-gray-500">Capture issuance details for weaving yarn outward transactions</p>
          </div>
        </div>
      
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="hidden" {...register("yarnId")} />
          <input type="hidden" {...register("yarnName")} />
          <input type="hidden" {...register("weavingContractId")} />
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Outward No</label>
              <input type="text"
                className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                  !watch('outwardNo') || watch('outwardNo')?.startsWith('Loading')
                    ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                    : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                }`}
                placeholder="Loading sequence..."
                {...register('outwardNo')} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium">Outward Date</label>
              <input
                {...register("outwardDate")}
                type="date"
                readOnly
                className="input mt-1 w-full rounded-md border bg-gray-100 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Order Type <span className="text-red-500">*</span></label>
              <CommonSearchableSelect
                className="mt-1 w-full rounded-md text-sm"
                placeholder="Select Order Type"
                options={ORDER_TYPE_OPTIONS}
                value={watchOrderTypeId || ""}
                {...orderTypeField}
                onValueChange={(value) => {
                  setValue("orderTypeId", value, { shouldValidate: true });
                  handleOrderTypeChange(value);
                }}
              />
              {errors.orderTypeId && <p className="text-sm text-red-600">{String(errors.orderTypeId.message)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Weaving Jobwork Order No <span className="text-red-500">*</span></label>
              <CommonSearchableSelect
                className="mt-1 w-full rounded-md text-sm"
                placeholder="Select Jobwork Order"
                options={weavingJobSelectOptions}
                value={watchOrderId || ""}
                {...weavingOrderField}
                onValueChange={(value) => {
                  setValue("weavingJobWorkOrderId", value, { shouldValidate: true });
                  handleWeavingOrderChange(value);
                }}
              />
              {errors.weavingJobWorkOrderId && <p className="text-sm text-red-600">{String(errors.weavingJobWorkOrderId.message)}</p>}
            </div>
            {showContractDropdown && (
              <div>
                <label className="block text-sm font-medium">Weaving Contract No</label>
                <CommonSearchableSelect
                  className="mt-1 w-full rounded-md text-sm"
                  placeholder="Select Weaving Contract"
                  options={filteredContractOptions.map((option) => ({ value: option.value, label: option.label }))}
                  value={watchContractId || ""}
                  onValueChange={(value) => setValue("weavingContractId", value, { shouldValidate: false })}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium">Buyer Name</label>
              <input
                {...register("buyerName")}
                className="input mt-1 w-full rounded-md border bg-gray-100 px-3 py-2 text-sm"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Yarn Name</label>
              {yarnOptions.length > 1 ? (
                <CommonSearchableSelect
                  className="mt-1 w-full rounded-md text-sm"
                  placeholder="Select Yarn"
                  options={yarnOptions.map((option) => ({ value: option.value, label: option.label }))}
                  value={yarnSelectValue}
                  onValueChange={(value) => handleYarnSelection(value)}
                />
              ) : (
                <input
                  className="input mt-1 w-full rounded-md border bg-gray-100 px-3 py-2 text-sm"
                  value={watchYarnName}
                  readOnly
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Vehicle No</label>
              <input
                {...register("vehicleNo")}
                className="input mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Enter vehicle number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Transport Name</label>
              <CommonSearchableSelect
                className="mt-1 w-full rounded-md text-sm"
                placeholder="Select Transport"
                options={transportSelectOptions}
                value={watchTransportId || ""}
                {...register("transportId")}
                onValueChange={(value) => setValue("transportId", value, { shouldValidate: false })}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium">Remarks</label>
              <textarea
                {...register("remarks")}
                rows={2}
                className="input mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Enter remarks"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Yarn Issue Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
         <div className="max-w-md">
            <label className="block text-sm font-medium">Weft Inward No <span className="text-red-500">*</span></label>
            <MultiSelectDropdown
              options={detailOptions.map((option) => ({ value: option.value, label: option.label }))}
              value={selectedDetailIds}
              onChange={handleSelectionChange}
              labelLookup={labelLookup}
              placeholder="Select weft inward references"
              disabled={!watchOrderId}
            />
            {!watchOrderId && <p className="mt-1 text-xs text-gray-500">Select a jobwork order to load inward references</p>}
          </div>

          <div className="overflow-auto">
            <table className="w-full border-collapse border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2">S.No</th>
                  <th className="border px-3 py-2">Weft Inward No</th>
                  <th className="border px-3 py-2">Yarn Name</th>
                  <th className="border px-3 py-2">Inward Bags</th>
                  <th className="border px-3 py-2">Inward Qty</th>
                  <th className="border px-3 py-2">Kgs/Bag</th>
                  <th className="border px-3 py-2">Cone Wt</th>
                  <th className="border px-3 py-2">Issuing Bags</th>
                  <th className="border px-3 py-2">Issued Qty</th>
                  <th className="border px-3 py-2">Mill Name</th>
                  <th className="border px-3 py-2">Warehouse</th>
                  <th className="border px-3 py-2">Lot No</th>
                  <th className="border px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {issueRows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="border px-4 py-4 text-center text-gray-500">No yarn issue details added</td>
                  </tr>
                ) : (
                  issueRows.map((row, index) => (
                    <tr key={row.selectionId} className="odd:bg-white even:bg-gray-50">
                      <td className="border px-3 py-2 text-center">{index + 1}</td>
                      <td className="border px-3 py-2">{row.weftInwardNo}</td>
                      <td className="border px-3 py-2">{row.yarnName}</td>
                      <td className="border px-3 py-2 text-center">{row.inwardBags.toFixed(3)}</td>
                      <td className="border px-3 py-2 text-center">{row.inwardQuantity.toFixed(3)}</td>
                      <td className="border px-3 py-2 text-center">{row.kgsPerBag.toFixed(3)}</td>
                      <td className="border px-3 py-2 text-center">{row.coneWeight.toFixed(3)}</td>
                      <td className="border px-3 py-2">
                        <input
                          type="number"
                          className="w-full rounded-md border px-2 py-1"
                          value={row.issuingBags ?? ""}
                          onChange={(e) => handleRowChange(row.selectionId, "issuingBags", e.target.value)}
                          min={0}
                          step={0.001}
                        />
                      </td>
                      <td className="border px-3 py-2">
                        <input
                          type="number"
                          className="w-full rounded-md border px-2 py-1"
                          value={row.issuedQuantity ?? ""}
                          onChange={(e) => handleRowChange(row.selectionId, "issuedQuantity", e.target.value)}
                          min={0}
                          step={0.001}
                        />
                      </td>
                      <td className="border px-3 py-2">
                        <input
                          className="w-full rounded-md border px-2 py-1"
                          value={row.millName || ""}
                          onChange={(e) => handleRowChange(row.selectionId, "millName", e.target.value)}
                        />
                      </td>
                      <td className="border px-3 py-2">
                        <select
                          className="w-full rounded-md border px-2 py-1"
                          value={row.warehouseId != null ? String(row.warehouseId) : ""}
                          onChange={(e) => handleRowChange(row.selectionId, "warehouseId", e.target.value)}
                        >
                          <option value="">Select warehouse</option>
                          {warehouseOptions.map((warehouse: any) => {
                            const optionId = warehouse?.id ?? warehouse?.warehouseId;
                            if (optionId == null) {
                              return null;
                            }
                            return (
                              <option key={optionId} value={optionId}>
                                {warehouse?.warehouseName || warehouse?.name || `Warehouse ${optionId}`}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="border px-3 py-2">
                        <input
                          className="w-full rounded-md border px-2 py-1"
                          value={row.lotNo || ""}
                          onChange={(e) => handleRowChange(row.selectionId, "lotNo", e.target.value)}
                        />
                      </td>
                      <td className="border px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.selectionId)}
                          className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {issueRows.map((row) => (
            rowErrorMap.has(row.selectionId) && (
              <p key={row.selectionId} className="text-sm text-red-600">Row {row.weftInwardNo}: {rowErrorMap.get(row.selectionId)}</p>
            )
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Yarn Name</p>
              <p className="text-lg font-semibold text-gray-900">{summaryYarnName || "-"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Issued Bags</p>
              <p className="text-lg font-semibold text-gray-900">{summary.bags.toFixed(3)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Issued Quantity</p>
              <p className="text-lg font-semibold text-gray-900">{summary.qty.toFixed(3)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button disabled={!canSubmit} onClick={handleSubmit(onSubmit)} className="bg-primary text-white">
          {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Save"}
        </Button>
        </div>
    </div>
  );
}
