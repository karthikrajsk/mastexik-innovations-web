import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ClipboardList, FileText, Trash2, Plus, Save, Edit } from "lucide-react";
import { toast } from "react-toastify";
import { AppDispatch, RootState } from "@/state/store";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllCompanies, getCompanyById } from "@/state/company-master-slice";
import { createSizingJobWorkOrder, updateSizingJobWorkOrder } from "@/state/sizingJobWorkOrderSlice";
import { documentNumberService } from "@/services/DocumentNumberService";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
};

const hasValue = (value: unknown) => value !== undefined && value !== null && `${value}`.trim() !== "";
const toIntOrNull = (value: unknown) => {
  if (!hasValue(value)) return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : null;
};
const toFloatOrNull = (value: unknown) => {
  if (!hasValue(value)) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const formatToMaxThreeDecimals = (value: unknown) => {
  if (!hasValue(value)) return "";
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return "";
  const fixed = numericValue.toFixed(3);
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
};

const calculateEndsPerPart = (totalEnds: unknown, numberOfParts: unknown) => {
  if (!hasValue(totalEnds) || !hasValue(numberOfParts)) return "";
  const total = Number(totalEnds);
  const parts = Number(numberOfParts);
  if (!Number.isFinite(total) || !Number.isFinite(parts) || parts === 0) return "";
  const result = total / parts;
  return Number.isFinite(result) ? formatToMaxThreeDecimals(result) : "";
};

const isNumericInput = (value: string) => value === "" || /^\d*\.?\d*$/.test(value);

interface FormData {
  sizingWorkOrderNo: string;
  orderDate: string;
  orderTypeId: string;
  buyerId?: string;
  gstTypeId: string;
  sizingPlanId?: string;
  sizingRatePerKg: string;
}

interface SizingOrderItem {
  id?: number;
  planDetailId?: string;
  yarnId: string;
  yarnName: string;
  totalEnds: string;
  numberOfParts: string;
  endsPerPart: string;
  warpMeters: string;
  clientKey?: string;
}

const numericItemFields: Array<keyof SizingOrderItem> = ["totalEnds", "numberOfParts", "endsPerPart", "warpMeters"];

interface InternalYarnOption {
  value: string;
  yarnId: string;
  label: string;
  totalEnds: string;
  parts: string;
  endsPerPart: string;
  warpMeters: string;
}

const generateClientKey = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createEmptyItem = (): SizingOrderItem => ({
  planDetailId: "",
  yarnId: "",
  yarnName: "",
  totalEnds: "",
  numberOfParts: "",
  endsPerPart: "",
  warpMeters: "",
  clientKey: generateClientKey(),
});

const getItemKey = (item: SizingOrderItem) => item.clientKey || (item.id != null ? `persisted-${item.id}` : "");

const withClientKey = (item: SizingOrderItem): SizingOrderItem => {
  const key = getItemKey(item);
  if (key) return { ...item, clientKey: key };
  return { ...item, clientKey: generateClientKey() };
};

const isRowValid = (row: SizingOrderItem) =>
  hasValue(row.yarnId) &&
  hasValue(row.totalEnds) &&
  hasValue(row.numberOfParts) &&
  hasValue(row.endsPerPart) &&
  hasValue(row.warpMeters);

export default function SizingJobWorkOrderEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = (location.state as any)?.jobWorkOrder;
  const sizingPlanContext = (location.state as any)?.sizingPlan;
  const defaultOrderType = sizingPlanContext ? "1" : "2";

  const { customerList } = useSelector((s: RootState) => s.customer);
  const { sizingPlanList } = useSelector((s: RootState) => s.sizingPlan as any);
  const { yarnList } = useSelector((s: RootState) => s.yarn as any);
  const { companyMasterList } = useSelector((s: RootState) => s.companyMaster as any);
  const { companyMaster } = useSelector((s: RootState) => s.companyMaster as any);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      orderDate: new Date().toISOString().slice(0, 10),
      orderTypeId: defaultOrderType,
      buyerId: "",
      gstTypeId: "",
      sizingPlanId: sizingPlanContext?.id ? String(sizingPlanContext.id) : "",
      sizingRatePerKg: sizingPlanContext?.sizingRate ? String(sizingPlanContext.sizingRate) : "",
    },
  });

  const orderTypeId = watch("orderTypeId");
  const buyerId = watch("buyerId");
  const sizingPlanId = watch("sizingPlanId");
  const gstTypeIdValue = watch("gstTypeId");

  const customers = useMemo(() => toArray(customerList).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [customerList]);
  const plans = useMemo(() => toArray(sizingPlanList).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [sizingPlanList]);
  const yarns = useMemo(() => toArray(yarnList).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [yarnList]);
  const companies = useMemo(() => toArray(companyMasterList).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [companyMasterList]);

  const resolveYarnName = useCallback(
    (id: string | number | null) => {
      if (!id) return "";
      const match = yarns.find((y: any) => String(y.id) === String(id));
      return match?.yarnName || match?.name || `Yarn ${id}`;
    },
    [yarns]
  );

  const [tradingCompanyId, setTradingCompanyId] = useState<number | null>(() => {
    if (editData?.tradingCompanyId) return Number(editData.tradingCompanyId);
    try {
      const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
      if (!stored) return null;
      const numeric = Number(stored);
      if (!Number.isNaN(numeric)) return numeric;
      const parsed = JSON.parse(stored);
      return parsed?.id ?? parsed?.companyId ?? null;
    } catch {
      return null;
    }
  });

  const tradingCompanyName = useMemo(() => {
    const company = companies.find((c: any) => String(c.id) === String(tradingCompanyId));
    if (company) return company.companyName || company.name || "";
    const fallback = (companyMaster as any)?.data || companyMaster || {};
    return fallback.companyName || fallback.name || "";
  }, [companies, tradingCompanyId, companyMaster]);

  const selectedPlan = useMemo(() => plans.find((p: any) => String(p.id) === String(sizingPlanId)), [plans, sizingPlanId]);
  const internalPlanDetails = useMemo(
    () => (orderTypeId === "1" ? toArray(selectedPlan?.sizingQualityDetails) : []),
    [orderTypeId, selectedPlan]
  );

  const internalYarnOptions = useMemo<InternalYarnOption[]>(
    () =>
      internalPlanDetails.map((detail: any) => {
        const yarnIdentifier = detail.actualYarn ?? detail.yarnId ?? detail.id;
        return {
          value: String(detail.id ?? yarnIdentifier ?? ""),
          yarnId: String(yarnIdentifier ?? ""),
          label: detail.actualYarnName || detail.yarnName || resolveYarnName(yarnIdentifier),
          totalEnds: formatToMaxThreeDecimals(detail.actualWarpEnds ?? detail.warpEnds ?? ""),
          parts: String(detail.parts ?? ""),
          endsPerPart: formatToMaxThreeDecimals(detail.endsPerPart ?? ""),
          warpMeters: String(detail.warpMeters ?? ""),
        };
      }),
    [internalPlanDetails, resolveYarnName]
  );

  const [activeTab, setActiveTab] = useState<"orderDetails" | "itemDetails">("orderDetails");
  // const [sizingWorkOrderNo, setSizingWorkOrderNo] = useState<string>("");
  // const [isWorkOrderNoLoading, setIsWorkOrderNoLoading] = useState(false);
  const [companyStateCode, setCompanyStateCode] = useState<string>("");
  const [buyerStateCode, setBuyerStateCode] = useState<string>("");
  const [itemSummary, setItemSummary] = useState<SizingOrderItem[]>([]);
  const [itemRows, setItemRows] = useState<SizingOrderItem[]>([createEmptyItem()]);
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);

  const resetItemForm = () => {
    setItemRows([createEmptyItem()]);
    setEditingItemKey(null);
  };

  const isInternal = orderTypeId === "1";

  const isOrderIdMapped = useMemo(() => {
    const mappedValue = editData?.isOrderIdMapped;
    return mappedValue !== undefined && mappedValue !== null ? Number(mappedValue) === 1 : false;
  }, [editData]);

  const shouldLockBuyer = isOrderIdMapped || isInternal;

  const selectedBuyerLabel = useMemo(() => {
    if (!buyerId) return "";
    return customers.find((opt: any) => String(opt.id) === String(buyerId))?.customerName || "";
  }, [customers, buyerId]);

  const selectedPlanLabel = useMemo(() => {
    if (!sizingPlanId) return "";
    const p = plans.find((opt: any) => String(opt.id) === String(sizingPlanId));
    return p?.sizingPlanNo || p?.planNo || `Plan ${sizingPlanId}`;
  }, [plans, sizingPlanId]);

  useEffect(() => {
    dispatch(getAllCustomers({fetchAll: true} as any));
    dispatch(getAllSizingPlan({ fetchAll: true } as any));
    dispatch(getAllYarnMasters({ fetchAll: true } as any));
    dispatch(getAllCompanies({} as any));
  }, [dispatch]);

     const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);

    
 // Generate document number for new beam inward entries
    useEffect(() => {
        const generateDocumentNumber = async () => {
            // Only generate for new entries (not editing existing ones)
            if (editData || hasGeneratedNumberRef.current) {
                return;
            }

            setValue('sizingWorkOrderNo', 'Loading sequence...');

            try {
                const result = await documentNumberService.generateDocumentNumber({
                    screenName: 'Sizing Jobwork Order'
                });

                setValue('sizingWorkOrderNo', result.documentNumber, { shouldValidate: true });
                hasGeneratedNumberRef.current = true;
            } catch (error) {
                console.error('Failed to generate sizing jobwork order number:', error);
                toast.error('Failed to generate sizing jobwork order number');
            }
        };

        generateDocumentNumber();
    }, [editData, setValue]);

    // Cleanup document number cache if not saved
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData) {
                documentNumberService.clearMemoryCache('Sizing Jobwork Order');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData) {
                documentNumberService.clearMemoryCache('Sizing Jobwork Order');
            }
        };
    }, [editData]);

  useEffect(() => {
    if (editData?.sizingWorkOrderNo) {
      setValue('sizingWorkOrderNo', editData.sizingWorkOrderNo);
    }
  }, [editData, setValue]);


  useEffect(() => {
    if (!tradingCompanyId) return;
    dispatch(getCompanyById({ id: tradingCompanyId }) as any)
      .unwrap?.()
      .then((res: any) => {
        const companyData = res?.data || res;
        const addressArr = companyData?.address || companyData?.data?.address || [];
        const defaultAddr = Array.isArray(addressArr) ? addressArr.find((a: any) => a.isDefault) || addressArr[0] : null;
        setCompanyStateCode(defaultAddr?.stateCode || "");
      })
      .catch(() => setCompanyStateCode(""));
  }, [dispatch, tradingCompanyId]);

  useEffect(() => {
    if (!buyerId || isInternal) {
      setBuyerStateCode("");
      return;
    }
    const buyer = customers.find((c: any) => String(c.id) === String(buyerId));
    const address = Array.isArray(buyer?.address) ? buyer?.address?.[0] : buyer?.address;
    const code = address?.stateCode || address?.state?.stateCode || "";
    setBuyerStateCode(code || "");
  }, [buyerId, isInternal, customers]);

  useEffect(() => {
    if (isInternal) {
      if (gstTypeIdValue !== "1") {
        setValue("gstTypeId", "1", { shouldDirty: false, shouldValidate: true });
      }
      return;
    }
    if (!buyerStateCode || !companyStateCode) {
      if (gstTypeIdValue !== "") {
        setValue("gstTypeId", "", { shouldDirty: false, shouldValidate: true });
      }
      return;
    }
    const computedGstType = buyerStateCode === companyStateCode ? "1" : "2";
    if (gstTypeIdValue !== computedGstType) {
      setValue("gstTypeId", computedGstType, { shouldDirty: false, shouldValidate: true });
    }
  }, [isInternal, buyerStateCode, companyStateCode, gstTypeIdValue, setValue]);


  useEffect(() => {
    if (!sizingPlanContext) return;
    setValue("orderTypeId", "1", { shouldDirty: true, shouldValidate: true });
    setValue("sizingPlanId", String(sizingPlanContext.id), { shouldDirty: true, shouldValidate: true });
    if (hasValue(sizingPlanContext.sizingRate)) {
      setValue("sizingRatePerKg", String(sizingPlanContext.sizingRate), { shouldDirty: true, shouldValidate: true });
    }
  }, [sizingPlanContext, setValue]);

  useEffect(() => {
    if (!editData) return;
    reset({
      orderDate: editData.orderDate ? String(editData.orderDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      orderTypeId: String(editData.orderTypeId ?? defaultOrderType),
      buyerId: Number(editData.orderTypeId) === 2 ? String(editData.buyerId ?? "") : "",
      gstTypeId: String(editData.gstTypeId ?? ""),
      sizingPlanId: editData.sizingPlanId ? String(editData.sizingPlanId) : "",
      sizingRatePerKg: editData.sizingRatePerKg ? String(editData.sizingRatePerKg) : "",
    });
    const savedItems = toArray(editData.items)
      .map((item: any) => ({
        id: item.id,
        planDetailId: item.planDetailId ? String(item.planDetailId) : "",
        yarnId: String(item.yarnId ?? ""),
        yarnName: item.yarnName || resolveYarnName(item.yarnId),
        totalEnds: formatToMaxThreeDecimals(item.totalEnds),
        numberOfParts: hasValue(item.numberOfParts) ? String(item.numberOfParts) : "",
        endsPerPart: formatToMaxThreeDecimals(item.endsPerPart),
        warpMeters: hasValue(item.warpMeters) ? String(item.warpMeters) : "",
      }))
      .map(withClientKey);
    setItemSummary(savedItems);
    setItemRows([createEmptyItem()]);
    if (editData.tradingCompanyId) setTradingCompanyId(Number(editData.tradingCompanyId));
  }, [editData, reset, resolveYarnName, defaultOrderType]);

  useEffect(() => {
    if (!isInternal) return;
    setItemSummary([]);
    resetItemForm();
  }, [isInternal, sizingPlanId]);

  const handleInternalYarnSelect = (value: string, rowIndex: number) => {
    const option = internalYarnOptions.find((o) => o.value === value);
    if (!option) return;
    const updatedRows = [...itemRows];
    const derivedEndsPerPart = hasValue(option.endsPerPart)
      ? formatToMaxThreeDecimals(option.endsPerPart)
      : calculateEndsPerPart(option.totalEnds, option.parts);
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      planDetailId: option.value,
      yarnId: option.yarnId,
      yarnName: option.label,
      totalEnds: formatToMaxThreeDecimals(option.totalEnds),
      numberOfParts: option.parts,
      endsPerPart: derivedEndsPerPart,
      warpMeters: option.warpMeters,
    };
    setItemRows(updatedRows);
    setEditingItemKey(null);
  };

  const handleExternalYarnSelect = (value: string, rowIndex: number) => {
    const yarn = yarns.find((y: any) => String(y.id) === value);
    const updatedRows = [...itemRows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      planDetailId: "",
      yarnId: value,
      yarnName: yarn?.yarnName || yarn?.name || "",
    };
    setItemRows(updatedRows);
  };

  const handleItemFieldChange = (rowIndex: number, field: keyof SizingOrderItem, value: string) => {
    if (numericItemFields.includes(field) && !isNumericInput(value)) {
      return;
    }
    const updatedRows = [...itemRows];
    const nextValue = field === "totalEnds" || field === "endsPerPart" ? formatToMaxThreeDecimals(value) : value;
    const updatedRow = { ...updatedRows[rowIndex], [field]: nextValue };
    if (field === "totalEnds" || field === "numberOfParts") {
      updatedRow.endsPerPart = calculateEndsPerPart(updatedRow.totalEnds, updatedRow.numberOfParts);
    }
    updatedRows[rowIndex] = updatedRow;
    setItemRows(updatedRows);
  };

  const persistRows = (rows: SizingOrderItem[], emptyMessage: string, onSuccess?: () => void) => {
    const validRows = rows.filter(isRowValid);
    if (!validRows.length) {
      toast.error(emptyMessage);
      return;
    }

    if (editingItemKey) {
      const updatedRow = { ...validRows[0], clientKey: editingItemKey };
      const duplicate = itemSummary.some(
        (item) => item.clientKey !== editingItemKey && item.yarnId === updatedRow.yarnId
      );
      if (duplicate) {
        toast.error("Duplicate yarn found. Each yarn should be unique.");
        return;
      }
      setItemSummary((prev) => prev.map((item) => (item.clientKey === editingItemKey ? updatedRow : item)));
      toast.success("Item updated successfully");
      if (onSuccess) onSuccess();
      else resetItemForm();
      return;
    }

    const stagedRows = validRows.map(withClientKey);
    const stagedYarnIds = stagedRows.map((row) => row.yarnId);
    if (stagedYarnIds.length !== new Set(stagedYarnIds).size) {
      toast.error("Duplicate yarn found. Each yarn should be unique.");
      return;
    }

    const existingYarnIds = new Set(itemSummary.map((item) => item.yarnId));
    if (stagedRows.some((row) => existingYarnIds.has(row.yarnId))) {
      toast.error("Duplicate yarns found. Each yarn should be unique per order.");
      return;
    }

    setItemSummary((prev) => [...prev, ...stagedRows]);
    toast.success(stagedRows.length > 1 ? "Items saved successfully" : "Item added successfully");
    if (onSuccess) onSuccess();
    else resetItemForm();
  };

  const addNewRow = () => {
    const lastRow = itemRows[itemRows.length - 1];
    if (!isRowValid(lastRow)) {
      toast.error("Please fill all required fields in current row before adding new row");
      return;
    }

    const duplicate = itemRows.slice(0, -1).some((row) => row.yarnId === lastRow.yarnId);
    if (duplicate) {
      toast.error("Duplicate yarn found. Each yarn should be unique.");
      return;
    }

    setItemRows([...itemRows, createEmptyItem()]);
  };

  const removeRow = (rowIndex: number) => {
    if (itemRows.length === 1) {
      resetItemForm();
      return;
    }
    const updatedRows = itemRows.filter((_, index) => index !== rowIndex);
    setItemRows(updatedRows.length > 0 ? updatedRows : [createEmptyItem()]);
  };

  const handleSaveItems = () => {
    const pendingRows = itemRows.filter((row) => !isRowValid(row)).map((row) => ({ ...row }));
    persistRows(
      itemRows,
      "At least one valid row is required",
      editingItemKey
        ? undefined
        : () => {
            if (pendingRows.length) {
              setItemRows(pendingRows);
            } else {
              resetItemForm();
            }
          }
    );
  };

  const handleEditItem = (item: SizingOrderItem) => {
    const keyedItem = withClientKey(item);
    setItemSummary((prev) => prev.map((entry) => (entry.clientKey === keyedItem.clientKey ? keyedItem : entry)));
    setItemRows([{ ...keyedItem }]);
    setEditingItemKey(keyedItem.clientKey || null);
    setActiveTab("itemDetails");
  };

  const handleUpdateSingleItem = (rowIndex: number) => {
    persistRows([itemRows[rowIndex]], "Please fill all required fields");
  };

  const handleRemoveItem = (itemToRemove: SizingOrderItem) => {
    const key = getItemKey(itemToRemove);
    setItemSummary((prev) => prev.filter((item) => getItemKey(item) !== key));
    if (key && editingItemKey === key) {
      resetItemForm();
    }
  };

  const handleCancelEdit = () => {
    resetItemForm();
  };

  const onSubmit =async (data: FormData) => {

 const isEditMode = Boolean(editData?.id);
       let sizingWorkOrderNo = data.sizingWorkOrderNo || editData?.sizingWorkOrderNo || "";
            if (!editData?.id && !sizingWorkOrderNo) {
                try {
                    const docResponse = await documentNumberService.generateDocumentNumber({
                        screenName: "Sizing Jobwork Order"
                    });
                    sizingWorkOrderNo = docResponse.documentNumber;
                } catch (error) {
                    console.warn("Failed to generate document number:", error);
                }
            }
isSavingRef.current = true;
    
    if (isInternal && !hasValue(data.sizingPlanId)) {
      toast.error("Select a sizing plan");
      setActiveTab("orderDetails");
      return;
    }
    
    // Use itemSummary for submission
    if (itemSummary.length === 0) {
      toast.error("Add at least one item");
      setActiveTab("itemDetails");
      return;
    }

    const normalizedBuyer = isInternal ? tradingCompanyId : toIntOrNull(data.buyerId);
    if (!normalizedBuyer) {
      toast.error("Select a buyer");
      setActiveTab("orderDetails");
      return;
    }

    const normalizedItems = itemSummary.map((item) => ({
      id: item.id,
      planDetailId: toIntOrNull(item.planDetailId),
      yarnId: toIntOrNull(item.yarnId),
      yarnName: item.yarnName,
      totalEnds: toFloatOrNull(item.totalEnds) ?? 0,
      numberOfParts: toFloatOrNull(item.numberOfParts) ?? 0,
      endsPerPart: toFloatOrNull(item.endsPerPart) ?? 0,
      warpMeters: toFloatOrNull(item.warpMeters) ?? 0,
    }));

    const payload: any = {
      // sizingWorkOrderNo,
      sizingWorkOrderNo: sizingWorkOrderNo,
      orderDate: data.orderDate,
      orderTypeId: toIntOrNull(data.orderTypeId),
      buyerId: normalizedBuyer,
      consigneeId: normalizedBuyer,
      gstTypeId: toIntOrNull(data.gstTypeId),
      sizingPlanId: toIntOrNull(data.sizingPlanId),
      sizingRatePerKg: toFloatOrNull(data.sizingRatePerKg),
      items: normalizedItems,
      activeFlag: true,
    };

    const storedCompanyId = (() => {
      try {
        const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
        if (!stored) return null;
        const numeric = Number(stored);
        if (!Number.isNaN(numeric)) return numeric;
        const parsed = JSON.parse(stored);
        return Number(parsed?.id ?? parsed?.companyId ?? null);
      } catch {
        return null;
      }
    })();
    if (isEditMode) {
      const updatePayload = storedCompanyId ? { id: editData.id, data: payload, factoryCompanyId: storedCompanyId } : { id: editData.id, data: payload };
      dispatch(updateSizingJobWorkOrder(updatePayload as any)).then(() => navigate("/transaction/sizing-jobwork-order-details"));
    } else {
      if (storedCompanyId) payload.factoryCompanyId = storedCompanyId;
      dispatch(createSizingJobWorkOrder(payload as any)).then(() => navigate("/transaction/sizing-jobwork-order-details"));
 documentNumberService.clearMemoryCache("Sizing Jobwork Order");
    }
  };

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/transaction/sizing-jobwork-order-details")}
              className="flex items-center"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">Sizing Job Work Order</h2>
          </div>
         
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("orderDetails")}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === "orderDetails" ? "border-red-500 text-red-600" : "border-transparent text-gray-500"}`}
            >
              <FileText className="w-4 h-4" /> Order Details
            </button>
            <button
              onClick={() => setActiveTab("itemDetails")}
              className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === "itemDetails" ? "border-red-500 text-red-600" : "border-transparent text-gray-500"}`}
            >
              <ClipboardList className="w-4 h-4" /> Item Details
            </button>
          </nav>
        </div>

        {activeTab === "orderDetails" && (
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Sizing Order No</label>
                  <input type="text"
                    className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                      !watch('sizingWorkOrderNo') || watch('sizingWorkOrderNo')?.startsWith('Loading')
                        ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                        : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                    }`}
                    placeholder="Loading sequence..."
                    {...register('sizingWorkOrderNo')} readOnly />

                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Order Date <span className="text-red-600">*</span></label>
                  <input type="date" className="input mt-1 bg-gray-100" readOnly {...register("orderDate", { required: "Required" })} />
                  {errors.orderDate && <p className="text-sm text-red-600 mt-1">{String(errors.orderDate.message)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Order Type</label>
                  <input className="input mt-1 bg-gray-100" readOnly value={isInternal ? "Internal" : "External"} />
                  <input type="hidden" {...register("orderTypeId", { required: true })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Buyer Name <span className="text-red-600">*</span></label>
                  {shouldLockBuyer ? (
                    <>
                      <input type="hidden" value={buyerId || ""} {...register("buyerId")} />
                      <input
                        className="input mt-1 bg-gray-100"
                        readOnly
                        value={isInternal ? tradingCompanyName || "" : (selectedBuyerLabel || buyerId || "")}
                      />
                    </>
                  ) : (
                    <CommonSearchableSelect
                      {...register("buyerId", { required: !shouldLockBuyer ? "Buyer is required" : false })}
                      options={customers.map((customer: any) => ({
                        value: String(customer.id),
                        label: customer.customerName || customer.name,
                      }))}
                      placeholder="Select Buyer"
                      className="mt-1"
                      onValueChange={(value) => setValue("buyerId", value, { shouldValidate: true })}
                      error={errors.buyerId?.message as string}
                    />
                  )}
                  {errors.buyerId && <p className="text-sm text-red-600 mt-1">{String(errors.buyerId.message)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">GST Type <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...register("gstTypeId", { required: "GST Type is required" })}
                    options={[
                      { value: "1", label: "CGST/SGST" },
                      { value: "2", label: "IGST" },
                    ]}
                    placeholder="Select GST Type"
                    className="mt-1"
                    disabled
                    error={errors.gstTypeId?.message as string}
                  />
                </div>
                {isInternal && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      Sizing Plan No {isInternal && <span className="text-red-600">*</span>}
                    </label>
                    {isOrderIdMapped ? (
                      <>
                        <input type="hidden" value={sizingPlanId || ""} {...register("sizingPlanId")} />
                        <input className="input mt-1 bg-gray-100" readOnly value={selectedPlanLabel || ""} />
                      </>
                    ) : (
                      <CommonSearchableSelect
                        {...register("sizingPlanId", { required: isInternal ? "Sizing Plan is required" : false })}
                        options={plans.map((plan: any) => ({
                          value: String(plan.id),
                          label: plan.sizingPlanNo || plan.planNo || `Plan ${plan.id}`,
                        }))}
                        placeholder="Select Sizing Plan"
                        className="mt-1"
                        onValueChange={(value) => setValue("sizingPlanId", value, { shouldValidate: true })}
                        error={errors.sizingPlanId?.message as string}
                      />
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Sizing Rate / KG <span className="text-red-600">*</span></label>
                  <input className="input mt-1" {...register("sizingRatePerKg", { required: "Required" })} placeholder="Enter rate" />
                  {errors.sizingRatePerKg && <p className="text-sm text-red-600 mt-1">{String(errors.sizingRatePerKg.message)}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "itemDetails" && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingItemKey !== null ? "Edit Item" : "Add New Items"}
                </CardTitle>
                {editingItemKey !== null && (
                  <Button variant="outline" onClick={handleCancelEdit} className="text-sm">
                    Cancel Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-4 py-2 text-left">Sl.No</th>
                        <th className="border px-4 py-2 text-left">Yarn Name <span className="text-red-600">*</span></th>
                        <th className="border px-4 py-2 text-center">Total Ends <span className="text-red-600">*</span></th>
                        <th className="border px-4 py-2 text-center">No of Parts <span className="text-red-600">*</span></th>
                        <th className="border px-4 py-2 text-center">Ends / Part <span className="text-red-600">*</span></th>
                        <th className="border px-4 py-2 text-center">Warp Meters <span className="text-red-600">*</span></th>
                        <th className="border px-4 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemRows.map((item, rowIndex) => (
                        <tr key={`item-row-${rowIndex}`} className="border">
                          <td className="border px-4 py-2 text-center">{rowIndex + 1}</td>
                          <td className="border px-4 py-2">
                            {isInternal ? (
                              <CommonSearchableSelect
                                value={item.planDetailId}
                                options={internalYarnOptions.map((option) => ({
                                  value: option.value,
                                  label: option.label,
                                }))}
                                onValueChange={(value) => handleInternalYarnSelect(value, rowIndex)}
                                placeholder="Select Yarn"
                                disabled={editingItemKey !== null && item.clientKey !== editingItemKey}
                                className="w-full"
                              />
                            ) : (
                              <CommonSearchableSelect
                                value={item.yarnId}
                                options={yarns.map((yarn: any) => ({
                                  value: String(yarn.id),
                                  label: yarn.yarnName || yarn.name,
                                }))}
                                onValueChange={(value) => handleExternalYarnSelect(value, rowIndex)}
                                placeholder="Select Yarn"
                                disabled={editingItemKey !== null && item.clientKey !== editingItemKey}
                                className="w-full"
                              />
                            )}
                          </td>
                          <td className="border px-4 py-2">
                            <input 
                              className="input w-full text-center" 
                              value={item.totalEnds} 
                              onChange={(e) => handleItemFieldChange(rowIndex, "totalEnds", e.target.value)}
                              disabled={editingItemKey !== null && item.clientKey !== editingItemKey}
                            />
                          </td>
                          <td className="border px-4 py-2">
                            <input 
                              className="input w-full text-center" 
                              value={item.numberOfParts} 
                              onChange={(e) => handleItemFieldChange(rowIndex, "numberOfParts", e.target.value)}
                              disabled={editingItemKey !== null && item.clientKey !== editingItemKey}
                            />
                          </td>
                          <td className="border px-4 py-2">
                            <input 
                              className="input w-full text-center" 
                              value={item.endsPerPart} 
                              onChange={(e) => handleItemFieldChange(rowIndex, "endsPerPart", e.target.value)}
                              disabled={editingItemKey !== null && item.clientKey !== editingItemKey}
                            />
                          </td>
                          <td className="border px-4 py-2">
                            <input 
                              className="input w-full text-center" 
                              value={item.warpMeters} 
                              onChange={(e) => handleItemFieldChange(rowIndex, "warpMeters", e.target.value)}
                              disabled={editingItemKey !== null && item.clientKey !== editingItemKey}
                            />
                          </td>
                          <td className="border px-4 py-2">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                size="icon" 
                                variant="outline" 
                                onClick={() => removeRow(rowIndex)}
                                disabled={itemRows.length === 1 || (editingItemKey !== null && item.clientKey === editingItemKey)}
                              >
                                <Trash2 size={14} />
                              </Button>
                              {/* <Button 
                                size="icon" 
                                variant="outline" 
                                onClick={() => handleUpdateSingleItem(rowIndex)}
                                disabled={!item.yarnId || !item.totalEnds || !item.numberOfParts || !item.endsPerPart || !item.warpMeters}
                              >
                                <Save size={14} />
                              </Button> */}
                              {rowIndex === itemRows.length - 1 && editingItemKey === null && (
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  onClick={addNewRow}
                                >
                                  <Plus size={14} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    className="bg-primary text-white" 
                    onClick={handleSaveItems}
                  >
                    {editingItemKey !== null ? "Update All" : "Save All Items"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved Items ({itemSummary.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-4 py-2 text-left">Sl.No</th>
                        <th className="border px-4 py-2 text-left">Yarn Name</th>
                        <th className="border px-4 py-2 text-center">Total Ends</th>
                        <th className="border px-4 py-2 text-center">No of Parts</th>
                        <th className="border px-4 py-2 text-center">Ends / Part</th>
                        <th className="border px-4 py-2 text-center">Warp Meters</th>
                        <th className="border px-4 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemSummary.length === 0 && (
                        <tr>
                          <td colSpan={7} className="border px-4 py-4 text-center text-gray-500">No items saved yet</td>
                        </tr>
                      )}
                      {itemSummary.map((item, index) => (
                        <tr key={`saved-${item.id || item.yarnId}-${index}`} className="border">
                          <td className="border px-4 py-2 text-center">{index + 1}</td>
                          <td className="border px-4 py-2">{item.yarnName}</td>
                          <td className="border px-4 py-2 text-center">{item.totalEnds}</td>
                          <td className="border px-4 py-2 text-center">{item.numberOfParts}</td>
                          <td className="border px-4 py-2 text-center">{item.endsPerPart}</td>
                          <td className="border px-4 py-2 text-center">{item.warpMeters}</td>
                          <td className="border px-4 py-2">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                size="icon" 
                                variant="outline" 
                                onClick={() => handleEditItem(item)}
                              >
                                 <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="destructive" 
                                onClick={() => handleRemoveItem(item)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
<div className="flex justify-end">
             <Button onClick={handleSubmit(onSubmit)} className="bg-primary text-white px-6">
            {editData ? "Update" : "Save"}
          </Button>
          </div>
          </>

        )}
      </div>
      
    </div>
  );
}




