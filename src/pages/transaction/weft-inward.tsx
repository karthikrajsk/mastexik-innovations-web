import React, { act, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { createWeftInward, updateWeftInward, getAllWeftInwards, getWeftInwardsByFactoryCompanyId } from "@/state/weftInwardSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { ArrowLeft, FileText, ShoppingCart, ClipboardList, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import documentNumberService from "@/services/DocumentNumberService";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { useYarnWarehouseOptions } from "@/hooks/useYarnWarehouseOptions";

const WEFT_INWARD_EDIT_KEY = "weftInwardEdit";

const loadWeftInwardEditCache = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(WEFT_INWARD_EDIT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const persistWeftInwardEditCache = (payload: any) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(WEFT_INWARD_EDIT_KEY, JSON.stringify(payload));
  } catch {}
};

const clearWeftInwardEditCache = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(WEFT_INWARD_EDIT_KEY);
  } catch {}
};

const getSelectedCompanyId = (): number | null => {
  if (typeof window === "undefined") return null;
  const storedId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
  if (!storedId) return null;
  const parsedId = Number(storedId);
  return Number.isNaN(parsedId) ? null : parsedId;
};

interface YarnRow {
  id?: number;
  yarnName?: string;
  yarnId?: number | null;
  actualYarn?: string;
  actualYarnId?: number | null;
  lotNo?: string;
  bags?: number | string;
  kgsPerBag?: number | string;
  totalKgs?: number;
  millId?: number | null;
  millName?: string;
  warehouseId?: number | null;
  warehouseName?: string;
}

interface FormData {
  id?: number;
  inwardNo: string;
  inwardDate: string;
  weavingContractId: string;
  orderTypeId: string;
  weavingJobWorkOrderId?: string;
  fabricCode?: string;
  dcNo?: string;
  dcDate?: string;
  yarnDetails: YarnRow[];
}

export default function WeftInwardEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as any) || {};
  const locationWeftInwardDtl = locationState.weftInwardDtl;
  const [cachedWeftInwardDtl, setCachedWeftInwardDtl] = useState<any>(null);

  useEffect(() => {
    if (locationWeftInwardDtl) return;
    const stored = loadWeftInwardEditCache();
    if (stored) {
      setCachedWeftInwardDtl(stored);
    }
  }, [locationWeftInwardDtl]);

  const resolvedWeftInwardDtl = locationWeftInwardDtl ?? cachedWeftInwardDtl;
  const isExternalMode = locationState.isExternalMode || (resolvedWeftInwardDtl && Number(resolvedWeftInwardDtl.orderTypeId) === 2) || false;

  useEffect(() => {
    if (!resolvedWeftInwardDtl) return;
    persistWeftInwardEditCache(resolvedWeftInwardDtl);
  }, [resolvedWeftInwardDtl]);

  const clearWeftInwardSession = () => {
    setCachedWeftInwardDtl(null);
    clearWeftInwardEditCache();
  };

  const { weavingContractList } = useSelector((s: RootState) => s.weavingContracts as any);
  const { weavingJobWorkOrderList } = useSelector((s: RootState) => s.weavingJobWorkOrder as any);
  const { yarnList } = useSelector((s: RootState) => s.yarn as any);
  const { vendorList } = useSelector((s: RootState) => s.vendor as any);
  const { warehouseList } = useSelector((s: RootState) => s.warehouse as any);
  const { fabricMasterList } = useSelector((s: RootState) => s.fabricMaster as any);
  const { subCategoryList } = useSelector((s: RootState) => s.subCategory as any);

  const [activeTab, setActiveTab] = useState<'order' | 'yarn'>('order');
   const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);

    
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      inwardDate: new Date().toISOString().slice(0,10),
      weavingContractId: "",
      weavingJobWorkOrderId: "",
      fabricCode: "",
      dcNo: "",
      dcDate: "",
      yarnDetails: []
    }
  });



  const selectedContractId = watch('weavingContractId');
  const yarnRows = watch('yarnDetails');
  const orderTypeId = watch('orderTypeId');
  const weavingJobWorkOrderIdValue = watch('weavingJobWorkOrderId');
  const fabricCodeValue = watch('fabricCode');
  const isInternalOrderType = Number(orderTypeId) === 1;

  // Generate document number for new beam inward entries
    useEffect(() => {
        const generateDocumentNumber = async () => {
           
            if (resolvedWeftInwardDtl || hasGeneratedNumberRef.current) {
                return;
            }

            try {
                const result = await documentNumberService.generateDocumentNumber({
                    screenName: 'Weft Inward'
                });

                setValue('inwardNo', result.documentNumber, { shouldValidate: true });
                hasGeneratedNumberRef.current = true;
            } catch (error) {
                console.error('Failed to generate weft inward number:', error);
                toast.error('Failed to generate weft inward number');
            }
        };

        generateDocumentNumber();
    }, [resolvedWeftInwardDtl, setValue]);

    // Cleanup document number cache if not saved
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !resolvedWeftInwardDtl) {
                documentNumberService.clearMemoryCache('Weft Inward');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !resolvedWeftInwardDtl) {
                documentNumberService.clearMemoryCache('Weft Inward');
            }
        };
    }, [resolvedWeftInwardDtl]);

    
  useEffect(() => {
    setValue('inwardNo', resolvedWeftInwardDtl?.inwardNo || '') ;
  }, [resolvedWeftInwardDtl, setValue]);

  useEffect(() => {
    const selectedCompanyId = getSelectedCompanyId();
    const weavingContractParams: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
    if (selectedCompanyId !== null) {
      weavingContractParams.companyId = selectedCompanyId;
    }
    dispatch(getAllWeavingContract({}));
    if (selectedCompanyId !== null) {
        dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
                              factoryCompanyId: selectedCompanyId,
                            }) as any);
      // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(selectedCompanyId));
    } else {
      dispatch(getAllWeavingJobWorkOrders({fetchAll: true} as any));
    }
    dispatch(getAllYarnMasters({fetchAll: true} as any));
    dispatch(getAllVendors({fetchAll: true} as any));
    dispatch(getAllWarehouse({fetchAll: true} as any));
    dispatch(getAllFabricMasters({fetchAll: true} as any));
    dispatch(getAllSubCategories({fetchAll: true} as any));
  }, [dispatch]);

  const yarnNameById = (id?: number | null) => (yarnList || []).find((y: any) => String(y.id) === String(id))?.yarnName || '';
  const millNameById = (id?: number | null) => (millOptions || []).find((m: any) => String(m.id) === String(id))?.subCategoryName || '';
  const warehouseNameById = (id?: number | null) => (warehouseList || []).find((w: any) => String(w.id) === String(id))?.warehouseName || (warehouseList || []).find((w: any) => String(w.id) === String(id))?.name || '';

  const normalizedYarnList = useMemo(() => {
    if (Array.isArray(yarnList)) return yarnList;
    if (Array.isArray((yarnList as any)?.data)) return (yarnList as any).data;
    return [];
  }, [yarnList]);

  const yarnSelectOptions = useMemo(() => normalizedYarnList.map((y: any) => ({
    value: String(y.id),
    label: y.yarnName || String(y.id),
    activeFlag: y.activeFlag !== undefined ? y.activeFlag : true
  })), [normalizedYarnList]);

  const normalizedWarehouseList = useMemo(() => {
    if (Array.isArray(warehouseList)) return warehouseList;
    if (Array.isArray((warehouseList as any)?.data)) return (warehouseList as any).data;
    return [];
  }, [warehouseList]);

  const { yarnWarehouseOptions: warehouseSelectOptions, defaultYarnWarehouseId } = useYarnWarehouseOptions(warehouseList);

  useEffect(() => {
    if (resolvedWeftInwardDtl) {
      reset({
        id: resolvedWeftInwardDtl.id,
        inwardDate: (resolvedWeftInwardDtl.inwardDate || new Date().toISOString()).slice(0,10),
        weavingContractId: String(resolvedWeftInwardDtl.weavingContractId || resolvedWeftInwardDtl.contractId || ''),
        weavingJobWorkOrderId: String(resolvedWeftInwardDtl.weavingJobWorkOrderId || resolvedWeftInwardDtl.weavingWorkOrderId || ''),
        fabricCode: resolvedWeftInwardDtl.fabricCode || resolvedWeftInwardDtl.quality || '',
        dcNo: resolvedWeftInwardDtl.dcNo ? String(resolvedWeftInwardDtl.dcNo) : '',
        dcDate: resolvedWeftInwardDtl.dcDate ? String(resolvedWeftInwardDtl.dcDate).slice(0,10) : '',
        yarnDetails: Array.isArray(resolvedWeftInwardDtl.yarnDetails) ? resolvedWeftInwardDtl.yarnDetails.map((y: any) => ({
          id: y.id,
          yarnId: y.yarnId || null,
          yarnName: yarnNameById(y.yarnId) || y.yarnName,
          actualYarnId: y.actualYarnId || null,
          actualYarn: yarnNameById(y.actualYarnId) || y.actualYarn,
          lotNo: y.lotNo || y.lotno || '',
          bags: y.bags,
          kgsPerBag: y.kgsPerBag,
          totalKgs: y.totalKgs || (Number(y.bags||0) * Number(y.kgsPerBag||0)),
          millId: y.millId || null,
          millName: millNameById(y.millId) || y.millName,
          warehouseId: y.warehouseId || null,
          warehouseName: warehouseNameById(y.warehouseId) || ''
        })) : []
      });
    }
  }, [resolvedWeftInwardDtl, reset]);

  // useEffect(() => {
  //   if (resolvedWeftInwardDtl?.inwardNo) {
  //     setInwardNo(String(resolvedWeftInwardDtl.inwardNo));
  //     return;
  //   }
  //   let isMounted = true;
  //   const fetchDocumentNumber = async () => {
  //     try {
  //       setIsInwardNoLoading(true);
  //       const response = await documentNumberService.generateDocumentNumber({
  //         screenName: "Weft Inward"
  //       });
  //       if (!isMounted) return;
  //       setInwardNo(response.documentNumber || '');
  //     } catch {
  //       if (!isMounted) return;
  //       setInwardNo('');
  //     } finally {
  //       if (isMounted) {
  //         setIsInwardNoLoading(false);
  //       }
  //     }
  //   };
  //   fetchDocumentNumber();
  //   return () => {
  //     isMounted = false;
  //   };
  // }, [resolvedWeftInwardDtl]);

  const selectedContract = useMemo(() => (
    (weavingContractList || []).find((wc: any) => String(wc.id) === String(selectedContractId))
  ), [weavingContractList, selectedContractId]);

  const isInternal = useMemo(
    () => Number(selectedContract?.orderTypeId) === 1 || Number(resolvedWeftInwardDtl?.orderTypeId) === 1,
    [selectedContract, resolvedWeftInwardDtl]
  );
  const yarnDetailsReadOnly = isInternalOrderType || isInternal;
  const isFabricCodeReadOnly = isInternalOrderType || isInternal;

  const normalizedWeavingContracts = useMemo(() => {
    if (Array.isArray(weavingContractList)) return weavingContractList;
    if (Array.isArray((weavingContractList as any)?.data)) return (weavingContractList as any).data;
    return [];
  }, [weavingContractList]);

  const filteredJobOrders = useMemo(() => {
    const list = Array.isArray(weavingJobWorkOrderList) ? weavingJobWorkOrderList : Array.isArray(weavingJobWorkOrderList?.data) ? weavingJobWorkOrderList.data : [];
    if (isExternalMode) {
      return list.filter((w: any) => Number(w.orderTypeId) === 2);
    }
    if (!selectedContractId) return list;
    return list.filter((w: any) => String(w.weavingContractId) === String(selectedContractId));
  }, [weavingJobWorkOrderList, selectedContractId, isExternalMode]);

  const weavingJobOrderOptions = useMemo(() => {
    return (filteredJobOrders || [])
     .filter((wo: any) => wo.isApproved === 1)
    .map((w: any) => ({
      value: String(w.id),
      label: w.weavingWorkOrderNo || w.jobWorkOrderNo || w.weavingJobWorkOrderNo || String(w.id),
    }));
  }, [filteredJobOrders]);

  const weavingContractOptions = useMemo(() => {
    return normalizedWeavingContracts.map((wc: any) => ({
      value: String(wc.id),
      label: wc.contractNo || wc.weavingContractNo || wc.contractNumber || String(wc.id),
    }));
  }, [normalizedWeavingContracts]);

  const normalizedFabricMasters = useMemo(() => {
    if (Array.isArray(fabricMasterList)) return fabricMasterList;
    if (Array.isArray((fabricMasterList as any)?.data)) return (fabricMasterList as any).data;
    return [];
  }, [fabricMasterList]);

  const fabricCodeSelectOptions = useMemo(() => {
    return normalizedFabricMasters
      .map((f: any) => {
        const parts = [f.fabricCode || '', f.fabricName || f.fabricQuality || ''].filter(Boolean);
        const label = parts.join(' - ') || String(f.fabricCode || f.id || '');
        return {
          value: String(f.fabricCode || ''),
          label,
        };
      })
      .filter((opt: any) => opt.value);
  }, [normalizedFabricMasters]);

  const selectedWeavingJobOrder = filteredJobOrders.find((w: any) => String(w.id) === String(weavingJobWorkOrderIdValue));
  const fallbackJobOrderLabel = resolvedWeftInwardDtl ? (resolvedWeftInwardDtl.jobWorkOrderNo || resolvedWeftInwardDtl.weavingWorkOrderNo || resolvedWeftInwardDtl.weavingJobWorkOrderNo || '') : '';
  const selectedWeavingJobOrderNo = selectedWeavingJobOrder ? (selectedWeavingJobOrder.jobWorkOrderNo || selectedWeavingJobOrder.weavingWorkOrderNo) : fallbackJobOrderLabel;
  const showContractField = !isExternalMode && (isInternal || !selectedContractId);
  const showWeavingJobOrderField = !isExternalMode && isInternal;

  useEffect(() => {
    const fallbackOrderTypeId = selectedContract?.orderTypeId ?? resolvedWeftInwardDtl?.orderTypeId;
    setValue('orderTypeId', fallbackOrderTypeId ? String(fallbackOrderTypeId) : '');
  }, [selectedContract, resolvedWeftInwardDtl, setValue]);

  useEffect(() => {
    if (!isExternalMode) {
      if (isInternal) {
        const first = (filteredJobOrders || [])[0];
        setValue('weavingJobWorkOrderId', first ? String(first.id) : '');
      } else {
        setValue('weavingJobWorkOrderId', '');
      }
    }
  }, [isInternal, filteredJobOrders, setValue, isExternalMode]);

  useEffect(() => {
    const wjwoId = weavingJobWorkOrderIdValue;
    if (!wjwoId) return;
    const list = Array.isArray(weavingJobWorkOrderList) ? weavingJobWorkOrderList : Array.isArray(weavingJobWorkOrderList?.data) ? weavingJobWorkOrderList.data : [];
    const order = (list || []).find((w: any) => String(w.id) === String(wjwoId));
    const fabricCodeId = order?.items?.[0]?.fabricCodeId || order?.items?.[0]?.fabricQualityId;
    if (fabricCodeId && Array.isArray(fabricMasterList)) {
      const fm = fabricMasterList.find((f: any) => String(f.id) === String(fabricCodeId));
      if (fm?.fabricCode) setValue('fabricCode', String(fm.fabricCode));
    }
  }, [weavingJobWorkOrderIdValue, weavingJobWorkOrderList, fabricMasterList, setValue]);

  useEffect(() => {
    if (!resolvedWeftInwardDtl) return;
    const resolvedFabricCode = resolvedWeftInwardDtl.fabricCode || resolvedWeftInwardDtl.quality || resolvedWeftInwardDtl.fabricQuality || "";
    if (!resolvedFabricCode || fabricCodeValue) return;
    setValue('fabricCode', resolvedFabricCode);
  }, [resolvedWeftInwardDtl, fabricCodeValue, setValue]);

  useEffect(() => {
    if (!resolvedWeftInwardDtl) return;
    const selectedFabricCode = fabricCodeValue || resolvedWeftInwardDtl.fabricCode || resolvedWeftInwardDtl.quality || resolvedWeftInwardDtl.fabricQuality || "";
    if (!selectedFabricCode) return;
    if (String(resolvedWeftInwardDtl.fabricCode || "") === String(selectedFabricCode)) return;
    const updated = { ...resolvedWeftInwardDtl, fabricCode: selectedFabricCode };
    setCachedWeftInwardDtl(updated);
    persistWeftInwardEditCache(updated);
  }, [resolvedWeftInwardDtl, fabricCodeValue]);

  const onAddRow = () => {
    const defaultWarehouseId = defaultYarnWarehouseId ? Number(defaultYarnWarehouseId) : null;
    const next: YarnRow[] = [...(yarnRows || []), { lotNo: '', bags: '', kgsPerBag: '', totalKgs: 0, actualYarnId: null, millId: null, yarnId: null, warehouseId: defaultWarehouseId }];
    setValue('yarnDetails', next as any, { shouldDirty: true, shouldValidate: true });
  };

  const onRemoveRow = (idx: number) => {
    const next = (yarnRows || []).filter((_: any, i: number) => i !== idx);
    setValue('yarnDetails', next as any, { shouldDirty: true, shouldValidate: true });
  };

  const millOptions = useMemo(() => {
    const raw: any[] = Array.isArray(subCategoryList) ? subCategoryList : Array.isArray(subCategoryList?.data) ? subCategoryList.data : [];
    return raw.filter((sc: any) => (sc?.categoryName || '').toLowerCase() === 'mill');
  }, [subCategoryList]);

  const millSelectOptions = useMemo(() => millOptions.map((m: any) => ({
    value: String(m.id),
    label: m.subCategoryName || String(m.id),
    activeFlag: m.activeFlag !== undefined ? m.activeFlag : true
  })), [millOptions]);

  const onRowChange = (idx: number, field: keyof YarnRow, value: any) => {
    const next = [...(yarnRows || [])];
    const row = { ...(next[idx] || {}) } as YarnRow;
    if (field === 'actualYarnId') {
      const y = yarnList?.find((yy: any) => String(yy.id) === String(value));
      row.actualYarnId = value ? Number(value) : null;
      row.actualYarn = y?.yarnName || '';
    } else if (field === 'yarnId') {
      const y = yarnList?.find((yy: any) => String(yy.id) === String(value));
      row.yarnId = value ? Number(value) : null;
      row.yarnName = y?.yarnName || '';
    } else if (field === 'millId') {
      const m = millOptions?.find((mm: any) => String(mm.id) === String(value));
      row.millId = value ? Number(value) : null;
      row.millName = m?.subCategoryName || '';
    } else if (field === 'warehouseId') {
      const w = warehouseList?.find((ww: any) => String(ww.id) === String(value));
      row.warehouseId = value ? Number(value) : null;
      row.warehouseName = w?.warehouseName || w?.name || '';
    } else if (field === 'bags' || field === 'kgsPerBag') {
      (row as any)[field] = value;
    } else {
      (row as any)[field] = value;
    }
    const bags = Number(row.bags || 0);
    const kpb = Number(row.kgsPerBag || 0);
    row.totalKgs = Number((bags * kpb).toFixed(3));
    next[idx] = row;
    setValue('yarnDetails', next as any, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
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
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const loggedInCompanyId = storedCompanyId ? Number(storedCompanyId) : null;

    const isEditMode = Boolean(resolvedWeftInwardDtl?.id);

    let contractOrderTypeId = 2;

    if (isEditMode && resolvedWeftInwardDtl) {
      contractOrderTypeId = Number(resolvedWeftInwardDtl.orderTypeId || 2);
    } else if (!isExternalMode && data.weavingContractId) {
      const selectedContract = (weavingContractList || []).find((wc: any) => String(wc.id) === String(data.weavingContractId));
      contractOrderTypeId = Number(selectedContract?.orderTypeId ?? 2);
    }

    // On edit: preserve original company IDs — never overwrite after creation
    // On create: derive companyId by rule (backend also enforces this)
    const factoryCompanyId = isEditMode
      ? (resolvedWeftInwardDtl?.factoryCompanyId ? Number(resolvedWeftInwardDtl.factoryCompanyId) : loggedInCompanyId)
      : loggedInCompanyId;

    const companyId = isEditMode
      ? (resolvedWeftInwardDtl?.companyId ? Number(resolvedWeftInwardDtl.companyId) : loggedInCompanyId)
      : contractOrderTypeId === 1
        ? factoryCompanyId
        : loggedInCompanyId;

    const tradingCompanyId = isEditMode
      ? (resolvedWeftInwardDtl?.tradingCompanyId ? Number(resolvedWeftInwardDtl.tradingCompanyId) : null)
      : null;

    const normalizedJobOrders = Array.isArray(weavingJobWorkOrderList)
      ? weavingJobWorkOrderList
      : Array.isArray(weavingJobWorkOrderList?.data)
        ? weavingJobWorkOrderList.data
        : [];

    const selectedWeavingJobOrder = normalizedJobOrders.find((order: any) =>
      String(order?.id) === String(data.weavingJobWorkOrderId || resolvedWeftInwardDtl?.weavingJobWorkOrderId)
    );

    const externalBuyerId = selectedWeavingJobOrder?.buyerId ?? selectedWeavingJobOrder?.buyer?.id ?? null;
    const resolvedExternalBuyerId = externalBuyerId !== null && externalBuyerId !== undefined && externalBuyerId !== ''
      ? Number(externalBuyerId)
      : null;

    const buyerId = contractOrderTypeId === 1
      ? factoryCompanyId
      : (!Number.isNaN(resolvedExternalBuyerId ?? NaN) && resolvedExternalBuyerId ? resolvedExternalBuyerId : null);

    let inwardNo = data.inwardNo || resolvedWeftInwardDtl?.inwardNo || "";
    if (!resolvedWeftInwardDtl?.id && !inwardNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Weft Inward"
        });
        inwardNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    isSavingRef.current = true;

    const payload = {
      id: data.id || 0,
      inwardNo: inwardNo,
      inwardDate: data.inwardDate,
      weavingContractId: data.weavingContractId ? Number(data.weavingContractId) : null,
      weavingJobWorkOrderId: data.weavingJobWorkOrderId ? Number(data.weavingJobWorkOrderId) : null,
      fabricCode: data.fabricCode || '',
      dcNo: data.dcNo || null,
      dcDate: data.dcDate || null,
      orderTypeId: contractOrderTypeId,
      factoryCompanyId,
      companyId,
      tradingCompanyId,
      buyerId,
      yarnDetails: (data.yarnDetails || []).map(y => ({
        id: y.id || 0,
        yarnName: y.yarnName || '',
        yarnId: y.yarnId || null,
        actualYarn: y.actualYarn || '',
        actualYarnId: y.actualYarnId || null,
        lotNo: y.lotNo || '',
        bags: Number(y.bags || 0),
        kgsPerBag: Number(y.kgsPerBag || 0),
        totalKgs: Number(y.totalKgs || 0),
        millId: y.millId || null,
        millName: y.millName || '',
        warehouseId: y.warehouseId || null,
      }))
    };

    try {
      // alert(JSON.stringify(payload));
      console.log(payload);
      if (isEditMode) {
        await dispatch(updateWeftInward(factoryCompanyId ? { id: payload.id, data: payload, factoryCompanyId } as any : { id: payload.id, data: payload } as any)).unwrap();
      } else {
        if (contractOrderTypeId === 2 && factoryCompanyId) {
          await dispatch(createWeftInward({ ...payload, factoryCompanyId } as any) as any).unwrap();
          
        } else {
          await dispatch(createWeftInward(payload) as any).unwrap();
           documentNumberService.clearMemoryCache("Weft Inward");
        }
      }
     
      
      if (factoryCompanyId) {
        await dispatch(getWeftInwardsByFactoryCompanyId(factoryCompanyId) as any);
      } else {
        await dispatch(getAllWeftInwards({} as any));
      }
      
      clearWeftInwardSession();
      setCachedWeftInwardDtl(null);
      navigate('/transaction/weft-inward-details');
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleBack = () => {
    clearWeftInwardSession();
    setCachedWeftInwardDtl(null);
    navigate('/transaction/weft-inward-details');
  };

  return (
    <div className="p-6 pt-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button onClick={handleBack} variant="outline" className="mr-auto">
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">Weft Inward</h2>
        </div>
      </div>

      <div className="space-y-6">
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('order')}
                className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'order' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <FileText className="w-4 h-4" />
                Order Details
              </button>
              <button
                onClick={() => setActiveTab('yarn')}
                className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'yarn' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <ShoppingCart className="w-4 h-4" />
                Yarn Details
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'order' && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
                <div>
                  <label className="block text-sm font-medium">Inward No</label>
               <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"

                {...register('inwardNo')} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium">Inward Date <span className="text-red-600">*</span></label>
                  <input {...register('inwardDate', { required: true })} type="date" readOnly className="input mt-1 bg-gray-100" />
                </div>
                {isExternalMode && (
                  <div>
                    <label className="block text-sm font-medium">Weaving Work Order No <span className="text-red-600">*</span></label>
                    <CommonSearchableSelect
                      className="mt-1"
                      placeholder="Select Work Order"
                      options={weavingJobOrderOptions}
                      value={weavingJobWorkOrderIdValue || ''}
                      {...register('weavingJobWorkOrderId', { required: isExternalMode })}
                      onValueChange={(value) => setValue('weavingJobWorkOrderId', value, { shouldValidate: true })}
                    />
                  </div>
                )}
                {showContractField && (
                  <div>
                    <label className="block text-sm font-medium">Weaving Contract No <span className="text-red-600">*</span></label>
                    <CommonSearchableSelect
                      className="mt-1"
                      placeholder="Select Contract"
                      options={weavingContractOptions}
                      value={selectedContractId || ''}
                      {...register('weavingContractId', { required: !isExternalMode })}
                      onValueChange={(value) => setValue('weavingContractId', value, { shouldValidate: true })}
                      disabled={isInternalOrderType}
                    />
                  </div>
                )}
                {showWeavingJobOrderField && (
                  <div>
                    <label className="block text-sm font-medium">Weaving Job Work Order No</label>
                    <input value={selectedWeavingJobOrderNo} readOnly className="input mt-1 bg-gray-100" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium">Sort No – Construction <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    className="mt-1"
                    placeholder="Select Sort No"
                    options={fabricCodeSelectOptions}
                    value={fabricCodeValue || ''}
                    {...register('fabricCode', { required: true })}
                    onValueChange={(value) => setValue('fabricCode', value, { shouldValidate: true })}
                    disabled={isFabricCodeReadOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">DC No</label>
                  <input {...register('dcNo')} type="text" className="input mt-1" placeholder="DC No" />
                </div>
                <div>
                  <label className="block text-sm font-medium">DC Date</label>
                  <input {...register('dcDate')} type="date" className="input mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'yarn' && (
          <>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList size={20} /> Yarn Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={onAddRow} className="bg-primary text-white" disabled={yarnDetailsReadOnly}>Add Row</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-center">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">S.No</th>
                        <th className="border p-2">Yarn Name</th>
                        <th className="border p-2">Actual Yarn</th>
                        <th className="border p-2">Lot No</th>
                        <th className="border p-2">No of Bags</th>
                        <th className="border p-2">Kgs/Bag</th>
                        <th className="border p-2">Total KGS</th>
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
                              className="w-full"
                              placeholder="Select Yarn"
                              options={yarnSelectOptions}
                              filterActive
                              value={row.yarnId ? String(row.yarnId) : ''}
                              onValueChange={(value) => onRowChange(idx, 'yarnId', value)}
                              disabled={yarnDetailsReadOnly}
                            />
                          </td>
                          <td className="border p-2">
                            <CommonSearchableSelect
                              className="w-full"
                              placeholder="Select Yarn"
                              options={yarnSelectOptions}
                              filterActive
                              value={row.actualYarnId ? String(row.actualYarnId) : ''}
                              onValueChange={(value) => onRowChange(idx, 'actualYarnId', value)}
                              disabled={yarnDetailsReadOnly}
                            />
                          </td>
                          <td className="border p-2">
                            <input type="text" value={row.lotNo || ''} onChange={(e) => onRowChange(idx, 'lotNo', e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" readOnly={yarnDetailsReadOnly} disabled={yarnDetailsReadOnly} />
                          </td>
                          <td className="border p-2">
                            <input type="number" value={row.bags ?? ''} onChange={(e) => onRowChange(idx, 'bags', e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                          </td>
                          <td className="border p-2">
                            <input type="number" value={row.kgsPerBag ?? ''} onChange={(e) => onRowChange(idx, 'kgsPerBag', e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                          </td>
                          <td className="border p-2 text-right">{row.totalKgs?.toFixed(3) || '0.000'}</td>
                          <td className="border p-2">
                            <CommonSearchableSelect
                              className="w-full"
                              placeholder="Select Mill"
                              options={millSelectOptions}
                              filterActive
                              value={row.millId ? String(row.millId) : ''}
                              onValueChange={(value) => onRowChange(idx, 'millId', value)}
                              disabled={yarnDetailsReadOnly}
                            />
                          </td>
                          <td className="border p-2">
                            <CommonSearchableSelect
                              className="w-full"
                              placeholder="Select Warehouse"
                              options={warehouseSelectOptions}
                              filterActive
                              value={row.warehouseId ? String(row.warehouseId) : ''}
                              onValueChange={(value) => onRowChange(idx, 'warehouseId', value)}
                              disabled={yarnDetailsReadOnly}
                            />
                          </td>
                          <td className="border p-2">
                             <Button size="sm" onClick={() => onRemoveRow(idx)} variant="destructive" disabled={yarnDetailsReadOnly}>
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
<div className="flex justify-end mt-4">
          <Button onClick={handleSubmit(onSubmit)} className="bg-primary hover:bg-primary text-white px-6">
            {resolvedWeftInwardDtl ? 'Update' : 'Save'}
          </Button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
