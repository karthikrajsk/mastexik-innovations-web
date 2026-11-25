import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { createSizingYarnInward, updateSizingYarnInward, getAllSizingYarnInwards, getSizingYarnInwardsByFactoryCompanyId } from "@/state/sizingYarnInwardSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { ArrowLeft, FileText, ShoppingCart, ClipboardList, Trash2 } from "lucide-react";
import { documentNumberService } from "@/services/DocumentNumberService";
import { toast } from "react-toastify";
import { getAllSizingJobWorkOrders, getAllSizingJobWorkOrdersByFactoryCompanyId } from "@/state/sizingJobWorkOrderSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { useYarnWarehouseOptions } from "@/hooks/useYarnWarehouseOptions";

interface YarnRow {
  id?: number;
  yarnName?: string;
  yarnId?: number | null;
  lotNo?: string;
  bags?: number | string;
  kgsPerBag?: number | string;
  conesPerBag?: number | string;
  coneWeight?: number | string;
  quantity?: number | string;
  millId?: number | null;
  millName?: string;
  warehouseId?: number | null;
  warehouseName?: string;
}

interface FormData {
  id?: number;
  inwardNo?: string;
  inwardDate: string;
  sizingJobWorkOrderId: string;
  buyerKey: string;
  yarnDetails: YarnRow[];
}

const extractArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  return [];
};

const resolveStoredCompanyId = (): number | null => {
  const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
  if (!stored) return null;
  const numeric = Number(stored);
  if (!Number.isNaN(numeric)) return numeric;
  try {
    const parsed = JSON.parse(stored);
    const parsedId = parsed?.id ?? parsed?.companyId;
    return typeof parsedId === "number" ? parsedId : Number(parsedId) || null;
  } catch {
    return null;
  }
};

const computeConeWeight = (kgsPerBag?: number | string, conesPerBag?: number | string) => {
  const cones = Number(conesPerBag || 0);
  const kgs = Number(kgsPerBag || 0);
  if (!cones) return "";
  return Number((kgs / cones).toFixed(3));
};

const computeQuantity = (bags?: number | string, kgsPerBag?: number | string) => {
  const bagsNum = Number(bags || 0);
  const kgs = Number(kgsPerBag || 0);
  return Number((bagsNum * kgs).toFixed(3));
};

export default function SizingYarnInwardEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const sizingYarnInwardDtl = (location.state as any)?.sizingYarnInwardDtl;
  const isExternalMode = (location.state as any)?.isExternalMode || (sizingYarnInwardDtl && Number(sizingYarnInwardDtl.orderTypeId) === 2) || false;

  const { sizingJobWorkOrderList } = useSelector((s: RootState) => s.sizingJobWorkOrder as any);
  const { yarnList } = useSelector((s: RootState) => s.yarn as any);
  const { warehouseList } = useSelector((s: RootState) => s.warehouse as any);
  const { subCategoryList } = useSelector((s: RootState) => s.subCategory as any);
  const { customerList } = useSelector((s: RootState) => s.customer as any);
  const { companyMasterList } = useSelector((s: RootState) => s.companyMaster as any);

  const [activeTab, setActiveTab] = useState<"order" | "yarn">("order");
  // const [inwardNo, setInwardNo] = useState("");
  // const [isInwardNoLoading, setIsInwardNoLoading] = useState(false);
  const [orderTypeId, setOrderTypeId] = useState<string>(() => {
    if (sizingYarnInwardDtl?.orderTypeId) return String(sizingYarnInwardDtl.orderTypeId);
    if (isExternalMode) return "2";
    return "";
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      inwardNo: sizingYarnInwardDtl?.inwardNo || 'Loading sequence...',
      inwardDate: new Date().toISOString().slice(0, 10),
      sizingJobWorkOrderId: "",
      buyerKey: "",
      yarnDetails: [],
    },
  });

  const sizingOrderWatch = watch("sizingJobWorkOrderId");
  const buyerKeyWatch = watch("buyerKey");
  const yarnRows = watch("yarnDetails");
  const inwardDateWatch = watch("inwardDate");

  useEffect(() => {
    const companyId = resolveStoredCompanyId();
    if (companyId) {
      dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: companyId }) as any);
    } else {
      dispatch(getAllSizingJobWorkOrders({} as any));
    }
    dispatch(getAllYarnMasters({ fetchAll: true }) as any);
    dispatch(getAllWarehouse({ fetchAll: true } as any));
    dispatch(getAllSubCategories({ fetchAll: true }) as any);
    dispatch(getAllCustomers({ fetchAll: true }) as any);
    dispatch(getAllCompanies({ fetchAll: true }) as any);
  }, [dispatch]);

  const yarnNameById = useCallback(
    (id?: number | null) => (yarnList || []).find((y: any) => String(y.id) === String(id))?.yarnName || "",
    [yarnList]
  );
  const millOptions = useMemo(() => {
    const raw: any[] = Array.isArray(subCategoryList) ? subCategoryList : Array.isArray(subCategoryList?.data) ? subCategoryList.data : [];
    return raw.filter((sc: any) => (sc?.categoryName || "").toLowerCase() === "mill");
  }, [subCategoryList]);
  const activeMillOptions = useMemo(() => millOptions.filter((sc: any) => sc.isActive !== false && sc.activeFlag !== false), [millOptions]);
  const millNameById = useCallback(
    (id?: number | null) => millOptions.find((m: any) => String(m.id) === String(id))?.subCategoryName || "",
    [millOptions]
  );
  const warehouseNameById = useCallback(
    (id?: number | null) => (warehouseList || []).find((w: any) => String(w.id) === String(id))?.warehouseName || "",
    [warehouseList]
  );

  useEffect(() => {
    if (!sizingYarnInwardDtl) return;
    const details = Array.isArray(sizingYarnInwardDtl.yarnDetails) ? sizingYarnInwardDtl.yarnDetails : [];
    reset({
      inwardDate: sizingYarnInwardDtl.inwardDate ? new Date(sizingYarnInwardDtl.inwardDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      sizingJobWorkOrderId: sizingYarnInwardDtl.sizingJobWorkOrderId ? String(sizingYarnInwardDtl.sizingJobWorkOrderId) : "",
      buyerKey: sizingYarnInwardDtl.buyerCustomerId ? `customer-${sizingYarnInwardDtl.buyerCustomerId}` : sizingYarnInwardDtl.buyerCompanyId ? `company-${sizingYarnInwardDtl.buyerCompanyId}` : "",
      yarnDetails: details.map((d: any) => ({
        yarnId: d.yarnId != null ? String(d.yarnId) : "",
        millId: d.millId != null ? String(d.millId) : "",
        lotNo: d.lotNo || "",
        deliveryChallanNo: d.deliveryChallanNo || "",
        vehicleNo: d.vehicleNo || "",
        noOfBagsBales: d.noOfBagsBales != null ? String(d.noOfBagsBales) : "",
        yarnWeightLbs: d.yarnWeightLbs != null ? String(d.yarnWeightLbs) : "",
        netWeightKgs: d.netWeightKgs != null ? String(d.netWeightKgs) : "",
        warehouseId: d.warehouseId != null ? String(d.warehouseId) : "",
        remarks: d.remarks || "",
        yarnName: d.yarnName || yarnNameById(d.yarnId),
        millName: d.millName || millNameById(d.millId),
        warehouseName: d.warehouseName || warehouseNameById(d.warehouseId),
      })),
    });
    setOrderTypeId(String(sizingYarnInwardDtl.orderTypeId || (isExternalMode ? 2 : "")));
  }, [sizingYarnInwardDtl, reset, yarnNameById, millNameById, warehouseNameById, isExternalMode]);


  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);


  // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      // Only generate for new entries (not editing existing ones)
      if (sizingYarnInwardDtl || hasGeneratedNumberRef.current) {
        return;
      }

      setValue('inwardNo', 'Loading sequence...');

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Sizing Yarn Inward'
        });

        setValue('inwardNo', result.documentNumber, { shouldValidate: true });
        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate Sizing Yarn Inward number:', error);
        toast.error('Failed to generate Sizing Yarn Inward number');
      }
    };

    generateDocumentNumber();
  }, [sizingYarnInwardDtl, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !sizingYarnInwardDtl) {
        documentNumberService.clearMemoryCache('Sizing Yarn Inward');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !sizingYarnInwardDtl) {
        documentNumberService.clearMemoryCache('Sizing Yarn Inward');
      }
    };
  }, [sizingYarnInwardDtl]);

  useEffect(() => {
    if (sizingYarnInwardDtl?.inwardNo) {
      setValue('inwardNo', sizingYarnInwardDtl.inwardNo);
    }
  }, [sizingYarnInwardDtl, setValue]);


  const normalizedSizingOrders = useMemo(() => extractArray(sizingJobWorkOrderList).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [sizingJobWorkOrderList]);
  const normalizedCustomers = useMemo(() => extractArray(customerList).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [customerList]);
  const normalizedCompanies = useMemo(() => extractArray(companyMasterList).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [companyMasterList]);
  // const normalizedYarn = useMemo(() => extractArray(yarnList).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [yarnList]);
  const yarns = useMemo(() => extractArray(yarnList).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [yarnList]);
  const normalizedWarehouses = useMemo(() => extractArray(warehouseList).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [warehouseList]);
  const { yarnWarehouseOptions, defaultYarnWarehouseId } = useYarnWarehouseOptions(warehouseList);

  const companyNameMap = useMemo(() => {
    const map = new Map<string, string>();
    normalizedCompanies.forEach((company: any) => {
      const id = company?.id ?? company?.companyId;
      if (id != null) {
        map.set(String(id), company?.companyName || company?.name || company?.legalName || `Company ${id}`);
      }
    });
    return map;
  }, [normalizedCompanies]);

  const yarnNameMap = useMemo(() => {
    const map = new Map<string, string>();
    yarns.forEach((company: any) => {
      const id = company?.id ?? company?.companyId;
      if (id != null) {
        map.set(String(id), company?.companyName || company?.name || company?.legalName || `Company ${id}`);
      }
    });
    return map;
  }, [yarns]);

  const customerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    normalizedCustomers.forEach((customer: any) => {
      const id = customer?.id ?? customer?.customerId;
      if (id != null) {
        map.set(String(id), customer?.customerName || customer?.name || `Customer ${id}`);
      }
    });
    return map;
  }, [normalizedCustomers]);

  const sizingOrderOptions = useMemo(() => {
    return normalizedSizingOrders
      .map((order: any) => {
        const orderId = order?.id ?? order?.sizingJobWorkOrderId;
        if (orderId == null) return null;
        const resolvedType = Number(order?.orderTypeId) === 1 ? 1 : 2;
        const orderNo = order?.sizingWorkOrderNo || order?.sizingJobWorkOrderNo || order?.jobWorkOrderNo || order?.orderNo || `SO-${orderId}`;
        const buyers: { key: string; label: string; numericId: number; typeId: number }[] = [];
        if (resolvedType === 1) {
          const candidates = [order?.tradingCompanyId, order?.factoryCompanyId, order?.buyerCompanyId].filter((value) => value != null);
          const seen = new Set<string>();
          candidates.forEach((candidate) => {
            const key = `1-${candidate}`;
            if (seen.has(key)) return;
            seen.add(key);
            const label = companyNameMap.get(String(candidate)) || order?.buyerName || order?.customerName || `Company ${candidate}`;
            buyers.push({ key, label, numericId: Number(candidate), typeId: 1 });
          });
        } else {
          const candidates = [order?.buyerId, order?.customerId, order?.consigneeId].filter((value) => value != null);
          const seen = new Set<string>();
          candidates.forEach((candidate) => {
            const key = `2-${candidate}`;
            if (seen.has(key)) return;
            seen.add(key);
            const label = customerNameMap.get(String(candidate)) || order?.buyerName || order?.customerName || `Customer ${candidate}`;
            buyers.push({ key, label, numericId: Number(candidate), typeId: 2 });
          });
        }
        return { id: orderId, orderNo, orderTypeId: resolvedType, buyers };
      })
      .filter(Boolean) as Array<{ id: number; orderNo: string; orderTypeId: number; buyers: { key: string; label: string; numericId: number; typeId: number }[] }>;
  }, [normalizedSizingOrders, companyNameMap, customerNameMap, yarnNameMap]);

  const lockedOrderTypeId = useMemo(() => {
    if (sizingYarnInwardDtl?.orderTypeId) return String(sizingYarnInwardDtl.orderTypeId);
    if (isExternalMode) return "2";
    return null;
  }, [sizingYarnInwardDtl, isExternalMode]);

  const sizingOrderChoices = useMemo(() => {
    if (!lockedOrderTypeId) return sizingOrderOptions;
    return sizingOrderOptions.filter((option) => String(option.orderTypeId) === lockedOrderTypeId);
  }, [sizingOrderOptions, lockedOrderTypeId]);

  const selectedSizingOrder = useMemo(() => {
    return sizingOrderOptions.find((option) => String(option.id) === String(sizingOrderWatch || "")) || null;
  }, [sizingOrderOptions, sizingOrderWatch]);

  const buyerOptions = useMemo(() => selectedSizingOrder?.buyers || [], [selectedSizingOrder]);

  useEffect(() => {
    if (selectedSizingOrder) {
      const nextType = String(selectedSizingOrder.orderTypeId);
      setOrderTypeId((prev) => (prev === nextType ? prev : nextType));
      if (selectedSizingOrder.buyers.length === 1 && selectedSizingOrder.buyers[0].key !== buyerKeyWatch) {
        setValue("buyerKey", selectedSizingOrder.buyers[0].key, { shouldValidate: true });
      } else if (!selectedSizingOrder.buyers.length && buyerKeyWatch) {
        setValue("buyerKey", "", { shouldValidate: true });
      }
    } else if (!sizingOrderWatch) {
      const fallbackType = lockedOrderTypeId || (isExternalMode ? "2" : "");
      setOrderTypeId((prev) => (prev === fallbackType ? prev : fallbackType));
      if (buyerKeyWatch) {
        setValue("buyerKey", "", { shouldValidate: true });
      }
    }
  }, [selectedSizingOrder, setValue, buyerKeyWatch, sizingOrderWatch, lockedOrderTypeId, isExternalMode]);

  const handleSizingOrderChange = (value: string) => {
    setValue("sizingJobWorkOrderId", value, { shouldValidate: true });
    if (!value) {
      setOrderTypeId(lockedOrderTypeId || (isExternalMode ? "2" : ""));
      setValue("buyerKey", "", { shouldValidate: true });
    }
  };

  const onAddRow = () => {
    const next: YarnRow[] = [...(yarnRows || []), { lotNo: "", bags: "", kgsPerBag: "", conesPerBag: "", coneWeight: "", quantity: 0, millId: null, yarnId: null, warehouseId: defaultYarnWarehouseId ? Number(defaultYarnWarehouseId) : null }];
    setValue("yarnDetails", next as any, { shouldDirty: true, shouldValidate: true });
  };

  const onRemoveRow = (idx: number) => {
    const next = (yarnRows || []).filter((_: any, index: number) => index !== idx);
    setValue("yarnDetails", next as any, { shouldDirty: true, shouldValidate: true });
  };

  const onRowChange = (idx: number, field: keyof YarnRow, value: any) => {
    const next = [...(yarnRows || [])];
    const row = { ...(next[idx] || {}) } as YarnRow;
    if (field === "yarnId") {
      const yarn = yarnList?.find((entry: any) => String(entry.id) === String(value));
      row.yarnId = value ? Number(value) : null;
      row.yarnName = yarn?.yarnName || "";
    } else if (field === "millId") {
      const mill = millOptions.find((entry: any) => String(entry.id) === String(value));
      row.millId = value ? Number(value) : null;
      row.millName = mill?.subCategoryName || "";
    } else if (field === "warehouseId") {
      const warehouse = warehouseList?.find((entry: any) => String(entry.id) === String(value));
      row.warehouseId = value ? Number(value) : null;
      row.warehouseName = warehouse?.warehouseName || warehouse?.name || "";
    } else {
      (row as any)[field] = value;
    }
    const bagsNum = Number(row.bags || 0);
    const kgsPerBagNum = Number(row.kgsPerBag || 0);
    const conesPerBagNum = Number(row.conesPerBag || 0);
    if (field !== "coneWeight") {
      row.coneWeight = conesPerBagNum > 0 ? Number((kgsPerBagNum / conesPerBagNum).toFixed(3)) : "";
    }
    if (field !== "quantity") {
      row.quantity = Number((bagsNum * kgsPerBagNum).toFixed(3));
    }
    next[idx] = row;
    setValue("yarnDetails", next as any, { shouldDirty: true, shouldValidate: true });
  };

  const parseBuyerKey = (value: string) => {
    if (!value) return { typeId: null, id: null };
    const separatorIndex = value.indexOf("-");
    if (separatorIndex <= 0) return { typeId: null, id: null };
    const prefix = value.slice(0, separatorIndex);
    const idPart = value.slice(separatorIndex + 1);
    const numericId = Number(idPart);
    if (!Number.isFinite(numericId)) return { typeId: null, id: null };
    return { typeId: prefix === "1" ? 1 : 2, id: numericId };
  };

  const onSubmit = async (data: FormData) => {
    if (!data.sizingJobWorkOrderId) {
      toast.error("Select a sizing order");
      return;
    }
    if (!data.yarnDetails || data.yarnDetails.length === 0) {
      toast.error("Yarn Details cannot be empty. Please add at least one item to continue");
      setActiveTab("yarn");
      return;
    }
    const hasValidRow = data.yarnDetails.some(row => row.yarnId && Number(row.bags || 0) > 0);
    if (!hasValidRow) {
      toast.error("Please fill in the Yarn Details for at least one row before saving.");
      setActiveTab("yarn");
      return;
    }
    const storedCompanyId = resolveStoredCompanyId();
    const buyerMeta = parseBuyerKey(data.buyerKey);
    if (!buyerMeta.id) {
      toast.error("Select a buyer");
      return;
    }

    const resolvedOrderType = orderTypeId ? Number(orderTypeId) : buyerMeta.typeId || 2;

    const isEditMode = Boolean(sizingYarnInwardDtl?.id);
    let inwardNo = data.inwardNo || sizingYarnInwardDtl?.inwardNo || "";
    if (!sizingYarnInwardDtl?.id && !inwardNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Sizing Yarn Inward"
        });
        inwardNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    isSavingRef.current = true;
    const payload: any = {
      id: data.id || 0,
      inwardNo: inwardNo,
      inwardDate: data.inwardDate,
      orderTypeId: resolvedOrderType,
      sizingJobWorkOrderId: data.sizingJobWorkOrderId ? Number(data.sizingJobWorkOrderId) : null,
      buyerId: resolvedOrderType === 2 ? buyerMeta.id : null,
      tradingCompanyId: resolvedOrderType === 1 ? buyerMeta.id : null,
      yarnDetails: (data.yarnDetails || []).map((y) => ({
        id: y.id || 0,
        yarnName: y.yarnName || "",
        yarnId: y.yarnId || null,
        noOfBags: Number(y.bags || 0),
        kgsPerBag: Number(y.kgsPerBag || 0),
        conesPerBag: Number(y.conesPerBag || 0),
        coneWeight: Number(y.coneWeight || 0),
        issueQty: Number(y.quantity || 0),
        lotNo: y.lotNo || "",
        millId: y.millId || null,
        millName: y.millName || "",
        warehouseId: y.warehouseId || null,
      })),
    };
    if (storedCompanyId) {
      payload.factoryCompanyId = storedCompanyId;
      if (resolvedOrderType === 2) {
        payload.companyId = storedCompanyId;
      }
    }

    const isCreate = !payload.id;

    try {
      if (isEditMode) {
        await dispatch(updateSizingYarnInward(storedCompanyId ? { id: payload.id, data: payload, factoryCompanyId: storedCompanyId } as any : { id: payload.id, data: payload } as any)).unwrap();
      } else {
        await dispatch((payload.factoryCompanyId ? createSizingYarnInward(payload as any) : createSizingYarnInward(payload)) as any).unwrap();
        documentNumberService.clearMemoryCache("Sizing Yarn Inward");

      }

      if (storedCompanyId) {
        await dispatch(getSizingYarnInwardsByFactoryCompanyId({ companyId: storedCompanyId, limit: 10, offset: 0 }) as any);
      } else {
        await dispatch(getAllSizingYarnInwards({ limit: 10, offset: 0 } as any));
      }

      navigate("/transaction/sizing-yarn-inward-details");
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  return (
    <div className="p-6 pt-16 mt-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/transaction/sizing-yarn-inward-details")} variant="outline" className="mr-auto">
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">Sizing Yarn Inward</h2>
        </div>

      </div>

      <div className="space-y-6">
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("order")}
                className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === "order" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                <FileText className="w-4 h-4" />
                Order Details
              </button>
              <button
                onClick={() => setActiveTab("yarn")}
                className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === "yarn" ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                <ShoppingCart className="w-4 h-4" />
                Yarn Details
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "order" && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Inward No</label>
                  <input type="text"
                    className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                      !watch('inwardNo') || watch('inwardNo')?.startsWith('Loading')
                        ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                        : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                    }`}
                    placeholder="Loading sequence..."
                    {...register('inwardNo')} readOnly />

                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Inward Date <span className="text-red-600">*</span></label>
                  <input {...register("inwardDate", { required: true })} type="date" readOnly className="input mt-1 bg-gray-100" value={inwardDateWatch || ""} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Order Type</label>
                  <input className="input mt-1 bg-gray-100" readOnly value={orderTypeId === "1" ? "Internal" : orderTypeId === "2" ? "External" : ""} placeholder="Auto" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Sizing Order No <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...register("sizingJobWorkOrderId", { required: "Sizing Order No is required" })}
                    options={sizingOrderChoices.map((order) => ({
                      value: String(order.id),
                      label: order.orderNo,
                    }))}
                    placeholder="Select Sizing Order"
                    className="mt-1"
                    value={sizingOrderWatch || ""}
                    onValueChange={(value) => handleSizingOrderChange(value)}
                    disabled={orderTypeId === "1"}
                    error={errors.sizingJobWorkOrderId?.message as string}
                  />
                  {errors.sizingJobWorkOrderId && <p className="text-sm text-red-600 mt-1">{String(errors.sizingJobWorkOrderId.message)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Buyer Name <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...register("buyerKey", { required: "Buyer Name is required" })}
                    options={buyerOptions.map((option) => ({
                      value: option.key,
                      label: option.label,
                    }))}
                    placeholder="Select Buyer"
                    className="mt-1"
                    value={buyerKeyWatch || ""}
                    onValueChange={(value) => setValue("buyerKey", value, { shouldValidate: true })}
                    disabled={!sizingOrderWatch || orderTypeId === "1"}
                    error={errors.buyerKey?.message as string}
                  />
                  {errors.buyerKey && <p className="text-sm text-red-600 mt-1">{String(errors.buyerKey.message)}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "yarn" && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={20} /> Yarn Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button onClick={onAddRow} className="bg-primary text-white">Add Row</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">S.No</th>
                      <th className="border p-2">Yarn Name</th>
                      <th className="border p-2">Lot No</th>
                      <th className="border p-2">No of Bags</th>
                      <th className="border p-2">Kgs/Bag</th>
                      <th className="border p-2">Cones/Bag</th>
                      <th className="border p-2">Cone Wt</th>
                      <th className="border p-2">Quantity</th>
                      <th className="border p-2">Mill Name</th>
                      <th className="border p-2">Warehouse</th>
                      <th className="border p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(yarnRows || []).map((row: YarnRow, idx: number) => (
                      <tr key={idx} className="border">
                        <td className="border p-2">{idx + 1}</td>
                        <td className="border p-2">
                          <CommonSearchableSelect
                            value={row.yarnId || ""}
                            options={yarns.map((y: any) => ({
                              value: String(y.id),
                              label: y.yarnName,
                            }))}
                            onValueChange={(value) => onRowChange(idx, "yarnId", value)}
                            placeholder="Select Yarn"
                            className="w-full"
                            disabled={!!row.id}
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            value={row.lotNo ?? ""}
                            onChange={(e) => onRowChange(idx, "lotNo", e.target.value)}
                            className={`border border-gray-300 rounded px-2 py-1 w-full ${row.id ? "bg-gray-100 cursor-not-allowed" : ""}`}
                            readOnly={!!row.id}
                          />
                        </td>
                        <td className="border p-2">
                          <input type="number" value={row.bags ?? ""} onChange={(e) => onRowChange(idx, "bags", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                        </td>
                        <td className="border p-2">
                          <input type="number" value={row.kgsPerBag ?? ""} onChange={(e) => onRowChange(idx, "kgsPerBag", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                        </td>
                        <td className="border p-2">
                          <input type="number" value={row.conesPerBag ?? ""} onChange={(e) => onRowChange(idx, "conesPerBag", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                        </td>
                        <td className="border p-2">
                          <input type="number" value={row.coneWeight ?? ""} onChange={(e) => onRowChange(idx, "coneWeight", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                        </td>
                        <td className="border p-2">
                          <input type="number" value={row.quantity ?? ""} onChange={(e) => onRowChange(idx, "quantity", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                        </td>
                        <td className="border p-2">
                          <CommonSearchableSelect
                            value={row.millId || ""}
                            options={(activeMillOptions || []).map((m: any) => ({
                              value: String(m.id),
                              label: m.subCategoryName,
                            }))}
                            onValueChange={(value) => onRowChange(idx, "millId", value)}
                            placeholder="Select Mill"
                            className="w-full"
                            disabled={!!row.id}
                          />
                        </td>
                        <td className="border p-2">
                          <CommonSearchableSelect
                            value={row.warehouseId || ""}
                            options={yarnWarehouseOptions}
                            onValueChange={(value) => onRowChange(idx, "warehouseId", value)}
                            placeholder="Select Warehouse"
                            className="w-full"
                            disabled={!!row.id}
                          />
                        </td>
                        <td className="border p-2">
                          <Button size="sm" onClick={() => onRemoveRow(idx)} variant="destructive">
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-end">
          <Button onClick={handleSubmit(onSubmit)} className="bg-primary hover:bg-primary text-white px-6">
            {sizingYarnInwardDtl ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
