import React, { act, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldErrors, useForm } from "react-hook-form";
import { AppDispatch, RootState } from "@/state/store";
import { useDispatch, useSelector } from "react-redux";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { getAllTermsConditions } from "@/state/termsConditions";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getCompanyById, getAllCompanies } from "@/state/company-master-slice";
import { useLocation, useNavigate } from "react-router-dom";
import { createWeavingJobWorkOrder, getAllWeavingJobWorkOrders, updateWeavingJobWorkOrder } from "@/state/weavingJobWorkOrderSlice";
import { ArrowLeft, FileText, ShoppingCart, ClipboardList, Trash2 } from "lucide-react";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import apiService from "@/services/ApiService";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { documentNumberService } from "@/services/DocumentNumberService";
import { toast } from "react-toastify";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";

interface FormData {
  weavingWorkOrderNo: string;
  orderDate: string;
  taxId: string;
  vendorId: string;
  orderTypeId: string; // 1 internal, 2 external
  buyerId?: string;
  consigneeId?: string;
  gstTypeId: string; // 1/2
  termsConditionsId?: string;
  paymentTermsId?: string;
  packingTypeId: string; // Bale/Roll/Piece
  remarks?: string;
  items: WeavingWorkOrderItem[];
  fabricCodeId?: string;
  fabricQuality?: string;
  ppi: string;
  pickRate: string;
  orderQty: string;
  ratePerUnit: string;
  taxableAmount: string;
  gstPercent: string;
  totalAmount: string;
  yarnRequirements: YarnRequirement[];
  orderDetails?: OrderDetail[];
}

interface WeavingWorkOrderItem {
  id?: number; // ADD THIS
  fabricCodeId: string;
  fabricQualityId: string;
  fabricQuality?: string;
  quantity: string;
  pickCost: string;
  plannedStartDate: string;
  plannedEndDate: string;
  dailyTarget: string;
  numberOfLooms: string;
  warpLength: string;
  warpCrimpPercentage: string;
  pieceLength: string;
  numberOfPieces: string;
  ppi: string;
  ratePerUnit: string;
  uomId?: string;
  activeFlag: boolean;
  taxableAmount?: string;
  gstPercent?: string;
  totalAmount?: string;
}

interface YarnRequirement {
  id?: number;
  yarnId?: number | string;
  yarnType: string;
  yarnCount: string;
  gramsPerMeter: number;
  totalWeavingOrderQty: number;
  totalRequiredQty: number;
  totalAvailableQty: number;
  activeFlag: boolean;
}

interface OrderDetail {
  id?: number;
  fabricCodeId?: string;
  salesOrderNo: string;
  orderQuantity: string;
  plannedQuantity: string;
  totalQuantity: string;
  unit?: string;
}

interface FabricMaster {
  id: number;
  fabricType: number;
  fabricCode: string;
  fabricName: string;
  weave: number;
  fabricQuality: string;
  uom: string;
  epi: number;
  ppi: number;
  greigeCode: string;
  totalEnds: number;
  gsm: number;
  glm: number;
  igst: number;
  cgst: number;
  sgst: number;
  fabricImageUrl: string;
  warpDetails: YarnDetail[];
  weftDetails: YarnDetail[];
  procuctCategoryId: number | null;
}

interface YarnDetail {
  id: number;
  yarnId: number;
  color: number;
  shrinkagePercent: number;
  gramsPerMeter: number;
}

const hasValue = (value: unknown) => value !== undefined && value !== null && `${value}`.trim() !== '';
const toNumberOrNull = (value: unknown) => {
  if (!hasValue(value)) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};
const toIntOrNull = (value: unknown) => {
  const num = toNumberOrNull(value);
  return num === null ? null : Math.trunc(num);
};
const toFloatOrNull = (value: unknown) => toNumberOrNull(value);

type SelectOption = {
  value: string;
  label: string;
};

const PACKING_TYPE_OPTIONS: SelectOption[] = [
  { value: "1", label: "Bale" },
  { value: "2", label: "Roll" },
  { value: "3", label: "Piece" },
];

export default function WeavingJobWorkOrderEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const editData: any = location.state?.jobWorkOrder;
  const weavingWorkOrderDtl = location.state?.weavingWorkOrderDtl;

  const { termsContitionsList } = useSelector((s: RootState) => s.termsConditions);
  const { paymentTermsList } = useSelector((s: RootState) => s.paymentTerms);
  const { fabricMasterList } = useSelector((s: RootState) => s.fabricMaster);
  const { weavingContractList } = useSelector((s: RootState) => s.weavingContracts);
  const { customerList } = useSelector((s: RootState) => s.customer);
  const { consigneeList } = useSelector((s: RootState) => s.consignee);
  const { stateList } = useSelector((s: RootState) => s.state);
  const { companyMaster } = useSelector((s: RootState) => s.companyMaster as any);
  const { salesOrderList } = useSelector((s: RootState) => s.salesOrder);
  const { uomList } = useSelector((s: RootState) => s.uom);
  const { companyMasterList } = useSelector((s: RootState) => s.companyMaster as any);
  const { yarnList } = useSelector((s: RootState) => s.yarn);

  const normalizedSalesOrders = useMemo(() => {
    if (Array.isArray(salesOrderList)) return salesOrderList;
    if (Array.isArray((salesOrderList as any)?.data?.data)) return (salesOrderList as any).data.data;
    if (Array.isArray((salesOrderList as any)?.data)) return (salesOrderList as any).data;
    return [];
  }, [salesOrderList]);

  const normalizedFabricMasterList = useMemo(() => {
    if (Array.isArray(fabricMasterList)) return fabricMasterList;
    if (Array.isArray((fabricMasterList as any)?.data)) return (fabricMasterList as any).data;
    return [];
  }, [fabricMasterList]);

  const normalizedWeavingContractList = useMemo(() => {
    if (Array.isArray(weavingContractList)) return weavingContractList;
    if (Array.isArray((weavingContractList as any)?.data)) return (weavingContractList as any).data;
    return [];
  }, [weavingContractList]);

  const getSalesOrderItems = useCallback((order: any) => {
    if (!order) return [];
    const candidates = [
      order.items,
      order.salesOrderItems,
      order.orderItems,
      order.fabricItems,
      order.details,
      order.salesOrderItemDtl,
      order.products,
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length) {
        return candidate;
      }
    }
    return [];
  }, []);

  const getSalesOrderLabel = useCallback((salesOrderId?: string) => {
    if (!hasValue(salesOrderId)) return '';
    const matched = normalizedSalesOrders.find((so: any) => String(so.id) === String(salesOrderId));
    if (matched) {
      return matched.salesOrderNo || matched.orderNumber || `SO-${matched.id}`;
    }
    return `SO-${salesOrderId}`;
  }, [normalizedSalesOrders]);

  const companyDisplayName = useMemo(() => {
    try {
      const payload = localStorage.getItem('authPayload');
      if (payload) {
        const parsed: any = JSON.parse(payload);
        const name = parsed?.selectedCompany?.name ||
          parsed?.user?.selectedCompany?.name ||
          (Array.isArray(parsed?.user?.companies) ? parsed.user.companies[0]?.name : undefined);
        if (name) return String(name);
      }
    } catch { }
    const cm: any = (companyMaster as any)?.data || (companyMaster as any) || {};
    return String(cm.companyName || cm.name || '');
  }, [companyMaster]);

  const tradingCompanyId = useMemo(() => {
    if (editData?.tradingCompanyId) return Number(editData.tradingCompanyId);
    try {
      const stored = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      return stored ? Number(stored) : null;
    } catch { return null; }
  }, [editData]);

  const tradingCompanyName = useMemo(() => {
    const arr = Array.isArray(companyMasterList) ? companyMasterList : (companyMasterList as any)?.data || [];
    const cm = arr.find((c: any) => String(c.id) === String(tradingCompanyId));
    return String(cm?.companyName || cm?.name || '');
  }, [companyMasterList, tradingCompanyId]);

  const fetchYarnAvailability = useCallback(async (yarnIds: (number | string)[]) => {
    if (!yarnIds.length || !tradingCompanyId) return {};

    try {
      const uniqueIds = Array.from(new Set(yarnIds)).filter(Boolean);
      const responses = await Promise.all(
        uniqueIds.map((id) =>
          apiService.get(`/sizing-yarn-issues/yarn-inward-stock?itemId=${id}&companyId=${tradingCompanyId}`)
        )
      );

      const availabilityMap: Record<string, number> = {};
      responses.forEach((response, index) => {
        const id = uniqueIds[index];
        const data = Array.isArray(response.data) ? response.data : [];
        const total = data.reduce((sum: number, item: any) => sum + (parseFloat(item.availableQty) || 0), 0);
        availabilityMap[String(id)] = total;
      });

      return availabilityMap;
    } catch (error) {
      console.error("Error fetching yarn availability:", error);
      return {};
    }
  }, [tradingCompanyId]);

  const yarnNameById = useMemo(() => {
    const list = Array.isArray(yarnList)
      ? yarnList
      : Array.isArray((yarnList as any)?.data)
        ? (yarnList as any).data
        : [];
    return list.reduce((acc: Record<string, string>, yarn: any) => {
      if (yarn?.id != null) {
        acc[String(yarn.id)] = yarn.yarnName || yarn.countName || yarn.count || "";
      }
      return acc;
    }, {} as Record<string, string>);
  }, [yarnList]);

  const resolveYarnName = useCallback((yarnId?: number | string, fallback?: string) => {
    if (yarnId === undefined || yarnId === null) {
      return fallback || "";
    }
    const key = String(yarnId);
    return yarnNameById[key] || fallback || `Yarn ${key}`;
  }, [yarnNameById]);

  const [activeTab, setActiveTab] = useState("orderDetails");
  const [loggedUserName, setLoggedUserName] = useState<string>("");
  const [yarnRequirements, setYarnRequirements] = useState<YarnRequirement[]>([]);
  const yarnRequirementIds = useMemo(() => {
    const ids = new Set<number>();
    yarnRequirements.forEach(req => {
      const id = toIntOrNull(req.yarnId);
      if (id !== null) {
        ids.add(id);
      }
    });
    return Array.from(ids).sort((a, b) => a - b);
  }, [yarnRequirements]);
  const yarnRequirementIdsKey = yarnRequirementIds.join(',');
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [orderDetailsError, setOrderDetailsError] = useState<string>("");
  const [weavingWorkOrderItemDtl, setWeavingWorkOrderItemDtl] = useState<WeavingWorkOrderItem[]>([]);
  const [selectedFabric, setSelectedFabric] = useState<FabricMaster | null>(null);
  const [companyStateCode, setCompanyStateCode] = useState<string>('');
  const [buyerStateCode, setBuyerStateCode] = useState<string>('');
  const requiredFieldLabels: Record<string, string> = {
    orderDate: 'Date',
    orderTypeId: 'Order Type',
    buyerId: 'Buyer Name',
    consigneeId: 'Consignee Name',
    gstTypeId: 'GST Type',
    packingTypeId: 'Packing Type',
    fabricCodeId: 'Sort No',
    ppi: 'PPI',
    pickRate: 'Pick Rate',
    orderQty: 'Order Qty',
    gstPercent: 'GST %',
    uomId: 'UOM',
  };
  const handleInvalidSubmit = (formErrors: FieldErrors<FormData>) => {
    const firstKey = Object.keys(formErrors)[0];
    if (!firstKey) return;
    const label = requiredFieldLabels[firstKey] || firstKey;
    toast.error(`${label} is required`);
    const itemFields = new Set(['fabricCodeId', 'ppi', 'pickRate', 'orderQty', 'gstPercent']);
    if (itemFields.has(firstKey)) {
      setActiveTab('itemDetails');
    } else {
      setActiveTab('orderDetails');
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      weavingWorkOrderNo: (editData?.weavingWorkOrderNo || weavingWorkOrderDtl?.weavingWorkOrderNo) || 'Loading sequence...',
      orderDate: new Date().toISOString().slice(0, 10),
      taxId: '',
      orderTypeId: '2',
      fabricCodeId: '',
      fabricQuality: '',
      gstPercent: '',
    }
  });

  const initialFabricCodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (weavingWorkOrderDtl?.items?.[0]?.fabricCodeId) {
      initialFabricCodeIdRef.current = String(weavingWorkOrderDtl.items[0].fabricCodeId);
    } else if (editData?.items?.[0]?.fabricCodeId) {
      initialFabricCodeIdRef.current = String(editData.items[0].fabricCodeId);
    }
  }, [weavingWorkOrderDtl, editData]);

  const [newItem, setNewItem] = useState<WeavingWorkOrderItem>({
    fabricCodeId: '',
    fabricQualityId: '',
    fabricQuality: '',
    quantity: '',
    pickCost: '',
    plannedStartDate: '',
    plannedEndDate: '',
    dailyTarget: '',
    numberOfLooms: '',
    warpLength: '',
    warpCrimpPercentage: '',
    pieceLength: '',
    numberOfPieces: '',
    ppi: '',
    ratePerUnit: '',
    uomId: '',
    activeFlag: true
  });

  const [editingIndex, setEditingIndex]: any = useState(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const weavingJobWorkOrderId = useMemo(() => {
    const rawId = editData?.id ?? weavingWorkOrderDtl?.id;
    if (!hasValue(rawId)) return null;
    const parsed = Number(rawId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [editData?.id, weavingWorkOrderDtl?.id]);
  const mappedOrderIdFlag = useMemo(() => {
    const mappedValue = editData?.isOrderIdMapped ?? weavingWorkOrderDtl?.isOrderIdMapped;
    return mappedValue !== undefined && mappedValue !== null ? Number(mappedValue) : null;
  }, [editData, weavingWorkOrderDtl]);
  const isOrderIdMapped = mappedOrderIdFlag === 1;

  const orderTypeId = watch('orderTypeId');
  const buyerId = watch('buyerId');
  const consigneeId = watch('consigneeId');
  const packingTypeId = watch('packingTypeId');
  const fabricCodeId = watch('fabricCodeId');
  const fabricQuality = watch('fabricQuality');
  const pickRate = watch('pickRate');
  const ppi = watch('ppi');
  const orderQty = watch('orderQty');
  const gstPercent = watch('gstPercent');
  const isInternalOrder = orderTypeId === '1';
  const shouldLockBuyerConsignee = isOrderIdMapped || isInternalOrder;

  const termsOptions = useMemo<SelectOption[]>(() => {
    const list = termsContitionsList || [];
    return list
      .map((term: any) => ({
        value: String(term.id),
        label: term.termsConditionsName || `Terms ${term.id}`,
        activeFlag: term.activeFlag ?? true,
      }))
      .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
  }, [termsContitionsList]);

  const paymentOptions = useMemo<SelectOption[]>(() => {
    const list = paymentTermsList || [];
    return list
      .map((term: any) => ({
        value: String(term.id),
        label: term.termName || `Payment Term ${term.id}`,
        activeFlag: term.activeFlag ?? true,
      }))
      .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
  }, [paymentTermsList]);

  const buyerOptions = useMemo<SelectOption[]>(() => {
    const list = Array.isArray(customerList)
      ? customerList
      : Array.isArray((customerList as any)?.data)
        ? (customerList as any).data
        : [];
    return list
      .map((customer: any) => ({
        value: String(customer.id),
        label: customer.customerName || customer.name || `Buyer ${customer.id}`,
        activeFlag: customer.activeFlag ?? true,
      }))
      .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
  }, [customerList]);

  const consigneeOptions = useMemo<SelectOption[]>(() => {
    const list = Array.isArray(consigneeList)
      ? consigneeList
      : Array.isArray((consigneeList as any)?.data)
        ? (consigneeList as any).data
        : [];
    return list
      .map((consignee: any) => ({
        value: String(consignee.id),
        label: consignee.consigneeName || consignee.name || `Consignee ${consignee.id}`,
        activeFlag: consignee.activeFlag ?? true,
      }))
      .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
  }, [consigneeList]);

  const selectedBuyerLabel = useMemo(() => {
    if (!buyerId) return '';
    return buyerOptions.find((opt) => opt.value === String(buyerId))?.label || '';
  }, [buyerOptions, buyerId]);

  const selectedConsigneeLabel = useMemo(() => {
    if (!consigneeId) return '';
    return consigneeOptions.find((opt) => opt.value === String(consigneeId))?.label || '';
  }, [consigneeOptions, consigneeId]);

  const fabricOptions = useMemo<SelectOption[]>(() => {
    const map = new Map<string, string>();
    if (orderTypeId === '1') {
      const items = normalizedWeavingContractList.flatMap((wc: any) => wc.items || []);
      items.forEach((item: any) => {
        const id = String(item.fabricCodeId ?? '');
        if (!id || map.has(id)) return;
        const fabric = normalizedFabricMasterList.find((f: any) => String(f.id) === id);
        const label = fabric?.fabricCode || String(item.fabricCodeId ?? item.fabricCode) || id;
        map.set(id, label);
      });
    } else {
      normalizedFabricMasterList.forEach((fabric: any) => {
        const id = fabric?.id;
        if (id == null) return;
        const strId = String(id);
        if (map.has(strId)) return;
        map.set(strId, fabric.fabricCode || `Fabric ${strId}`);
      });
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [orderTypeId, normalizedWeavingContractList, normalizedFabricMasterList]);

  const uomOptions = useMemo<SelectOption[]>(() => {
    const list = Array.isArray(uomList)
      ? uomList
      : Array.isArray((uomList as any)?.data)
        ? (uomList as any).data
        : [];
    return list
      .map((unit: any) => ({
        value: String(unit.id),
        label: unit.uomName || unit.name || `UOM ${unit.id}`,
        activeFlag: unit.activeFlag ?? true,
      }))
      .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
  }, [uomList]);
  const editingFactoryCompanyId = useMemo(() => {
    if (editData?.factoryCompanyId) return Number(editData.factoryCompanyId);
    if (weavingWorkOrderDtl?.factoryCompanyId) return Number(weavingWorkOrderDtl.factoryCompanyId);
    return tradingCompanyId ?? undefined;
  }, [editData, weavingWorkOrderDtl, tradingCompanyId]);
  const resolvedWeavingContractId = useMemo(() => {
    const source = editData?.weavingContractId ?? weavingWorkOrderDtl?.weavingContractId;
    return source ? toIntOrNull(source) : null;
  }, [editData, weavingWorkOrderDtl]);

  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);

  // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      // Only generate for new entries (not editing existing ones)
      if (editData || weavingWorkOrderDtl || hasGeneratedNumberRef.current) {
        return;
      }

      setValue('weavingWorkOrderNo', 'Loading sequence...');

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Weaving Jobwork Order'
        });

        setValue('weavingWorkOrderNo', result.documentNumber, { shouldValidate: true });
        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate weaving work order number:', error);
        toast.error('Failed to generate weaving work order number');
      }
    };

    generateDocumentNumber();
  }, [editData, weavingWorkOrderDtl, setValue]);

  useEffect(() => {
    if (editData?.weavingWorkOrderNo || weavingWorkOrderDtl?.weavingWorkOrderNo) {
      setValue('weavingWorkOrderNo', editData?.weavingWorkOrderNo || weavingWorkOrderDtl?.weavingWorkOrderNo);
    }
  }, [editData, weavingWorkOrderDtl, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData && !weavingWorkOrderDtl) {
        documentNumberService.clearMemoryCache('Weaving Jobwork Order');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData && !weavingWorkOrderDtl) {
        documentNumberService.clearMemoryCache('Weaving Jobwork Order');
      }
    };
  }, [editData, weavingWorkOrderDtl]);


  const getSalesOrderQuantity = useCallback((salesOrderId: string, fabricId?: string) => {
    if (!salesOrderId) return null;
    const order = normalizedSalesOrders.find((so: any) => String(so.id) === String(salesOrderId));
    if (!order) return null;
    const items = getSalesOrderItems(order);
    const resolvedFabricId = String(fabricId || fabricCodeId || '');
    if (items.length) {
      const matchedItem = resolvedFabricId
        ? items.find((item: any) => {
          const ids = [
            item.fabricMasterId,
            item.fabricId,
            item.fabricCodeId,
            item.fabricCode?.id,
            item.id,
            item.itemId,
            item.product_id,
          ];
          return ids.some(id => id != null && String(id) === resolvedFabricId);
        })
        : items[0];

      if (matchedItem) {
        const qtyCandidates = [
          matchedItem.orderQuantity,
          matchedItem.quantity,
          matchedItem.totalQuantity,
          matchedItem.plannedQuantity,
          matchedItem.orderQty,
          matchedItem.qty,
          matchedItem.balanceQty,
          matchedItem.pendingQty,
        ];
        const qtyValue = qtyCandidates.find(val => val !== undefined && val !== null);
        if (qtyValue != null) {
          const qtyNumber = Number(qtyValue);
          return !Number.isNaN(qtyNumber) ? qtyNumber : null;
        }
      }
    }
    const fallbackQty = order.orderQuantity ?? order.quantity ?? order.totalQuantity ?? order.plannedQuantity ?? order.orderQty;
    const fallbackNumber = fallbackQty != null ? Number(fallbackQty) : null;
    return fallbackNumber != null && !Number.isNaN(fallbackNumber) ? fallbackNumber : null;
  }, [normalizedSalesOrders, getSalesOrderItems, fabricCodeId]);


  useEffect(() => {
    setValue('weavingWorkOrderNo', editData?.weavingWorkOrderNo || '');
  }, [editData, setValue]);

  useEffect(() => {
    dispatch(getAllCustomers({ fetchAll: true } as any));
    dispatch(getAllConsignee({ fetchAll: true } as any));
    dispatch(getAllTermsConditions({ fetchAll: true } as any));
    dispatch(getAllPaymentTerms({ fetchAll: true } as any));
    dispatch(getAllFabricMasters({ fetchAll: true } as any));
    dispatch(getAllWeavingContract({ fetchAll: true } as any));
    dispatch(getAllYarnMasters({ fetchAll: true } as any));
    dispatch(getAllUomMaster({ fetchAll: true } as any));
    dispatch(getAllCompanies({ fetchAll: true } as any));
  }, [dispatch]);

  useEffect(() => {
    if (!orderTypeId) return;
    if (orderTypeId === '1') {
      dispatch(getAllSalesOrders({ fetchAll: true }));
    } else if (orderTypeId === '2' && tradingCompanyId) {
      dispatch(getAllSalesOrders({ companyId: tradingCompanyId, fetchAll: true }));
    }
  }, [orderTypeId, tradingCompanyId, dispatch]);

  useEffect(() => {
    try {
      const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      if (storedCompanyId) {
        dispatch(getCompanyById({ id: Number(storedCompanyId) }) as any)
          .unwrap?.()
          .then((res: any) => {
            const companyData = res?.data || res;
            const addressArr = companyData?.address || companyData?.data?.address || [];
            const defaultAddr = Array.isArray(addressArr)
              ? addressArr.find((a: any) => a.isDefault) || addressArr[0]
              : null;
            const code = defaultAddr?.stateCode || '';
            setCompanyStateCode(code);
          })
          .catch(() => { });
      }
    } catch { }
    try {
      const payload = localStorage.getItem('authPayload');
      if (payload) {
        const parsed = JSON.parse(payload);
        const name = parsed?.user?.userName || parsed?.user?.name || '';
        setLoggedUserName(String(name));
      }
    } catch { }
  }, [dispatch]);

  useEffect(() => {
    if (!uomList || newItem.uomId) return;
    const meter = (uomList as any[]).find((u: any) => String(u.uomName || '').toLowerCase() === 'meter');
    if (meter) {
      setNewItem(prev => ({ ...prev, uomId: String(meter.id) }));
      setOrderDetails(prev => prev.map(d => ({ ...d, unit: d.unit || String(meter.id) })));
    }
  }, [uomList]);

  function computeRatePerUnit(pickRateValue: string, ppiValue: string) {
    const pickRateNum = parseFloat(pickRateValue || '0');
    const ppiNum = parseFloat(ppiValue || '0');

    if (!pickRateNum || !ppiNum) {
      return '';
    }

    const computed = pickRateNum * ppiNum;
    return computed.toFixed(2);
  }

  useEffect(() => {
    if (weavingWorkOrderDtl) {
      reset({
        orderDate: weavingWorkOrderDtl.contractDate ? String(weavingWorkOrderDtl.orderDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
        taxId: weavingWorkOrderDtl.taxId ? String(weavingWorkOrderDtl.taxId) : "",
        vendorId: weavingWorkOrderDtl.vendorId ? String(weavingWorkOrderDtl.vendorId) : "",
        termsConditionsId: weavingWorkOrderDtl.termsConditionsId ? String(weavingWorkOrderDtl.termsConditionsId) : "",
        paymentTermsId: weavingWorkOrderDtl.paymentTermsId ? String(weavingWorkOrderDtl.paymentTermsId) : "",
        remarks: weavingWorkOrderDtl.remarks || "",
        fabricCodeId: weavingWorkOrderDtl.items?.[0]?.fabricCodeId ? String(weavingWorkOrderDtl.items[0].fabricCodeId) : "",
        fabricQuality: weavingWorkOrderDtl.items?.[0]?.fabricQuality ? String(weavingWorkOrderDtl.items[0].fabricQuality) : "",
        gstPercent: weavingWorkOrderDtl.items?.[0]?.gstPercent != null ? String(weavingWorkOrderDtl.items[0].gstPercent) : "",
        items: [],
        yarnRequirements: [],
        orderDetails: []
      });

      // Set items table
      setWeavingWorkOrderItemDtl(
        (weavingWorkOrderDtl.items || []).map((item: any) => ({
          id: item.id,
          fabricCodeId: String(item.fabricCodeId ?? ""),
          fabricQualityId: String(item.fabricQualityId ?? ""),
          fabricQuality: item.fabricQuality || "",
          quantity: String(item.quantity ?? ""),
          pickCost: String(item.pickCost ?? ""),
          plannedStartDate: item.plannedStartDate ? item.plannedStartDate.slice(0, 10) : "",
          plannedEndDate: item.plannedEndDate ? item.plannedEndDate.slice(0, 10) : "",
          dailyTarget: String(item.dailyTarget ?? ""),
          numberOfLooms: String(item.numberOfLooms ?? ""),
          warpLength: String(item.warpLength ?? ""),
          warpCrimpPercentage: String(item.warpCrimpPercentage ?? ""),
          pieceLength: String(item.pieceLength ?? ""),
          numberOfPieces: String(item.numberOfPieces ?? ""),
          activeFlag: item.activeFlag ?? true,
          ppi: String(item.ppi ?? ""),
          ratePerUnit: String(item.ratePerUnit ?? computeRatePerUnit(String(item.pickCost ?? ""), String(item.ppi ?? ""))),
          uomId: String(item.uomId ?? item.uomId ?? item.uom ?? ''),
          taxableAmount: String(item.taxableAmount ?? (parseFloat(String(item.quantity ?? "0")) * parseFloat(String(item.ratePerUnit ?? "0"))).toFixed(2)),
          gstPercent: String(item.gstPercent ?? ""),
          totalAmount: String(item.totalAmount ?? ((parseFloat(String(item.quantity ?? "0")) * parseFloat(String(item.ratePerUnit ?? "0"))) * (1 + parseFloat(String(item.gstPercent ?? "0")) / 100)).toFixed(2)),
        }))
      );

      // Populate newItem with the first item's data INCLUDING ID
      const firstItem = weavingWorkOrderDtl.items?.[0];
      if (firstItem) {
        const pickCostStr = String(firstItem.pickCost ?? "");
        const ppiStr = String(firstItem.ppi ?? "");
        const calculatedRate = computeRatePerUnit(pickCostStr, ppiStr);
        const taxableAmt = (parseFloat(String(firstItem.quantity ?? "0")) * parseFloat(calculatedRate || "0")).toFixed(2);
        const totalAmt = (parseFloat(taxableAmt) * (1 + parseFloat(String(firstItem.gstPercent ?? "0")) / 100)).toFixed(2);

        setNewItem({
          id: firstItem.id,
          fabricCodeId: String(firstItem.fabricCodeId ?? ""),
          fabricQualityId: String(firstItem.fabricQualityId ?? ""),
          fabricQuality: firstItem.fabricQuality ? String(firstItem.fabricQuality) : '',
          quantity: String(firstItem.quantity ?? ""),
          pickCost: pickCostStr,
          plannedStartDate: firstItem.plannedStartDate ? firstItem.plannedStartDate.slice(0, 10) : "",
          plannedEndDate: firstItem.plannedEndDate ? firstItem.plannedEndDate.slice(0, 10) : "",
          dailyTarget: String(firstItem.dailyTarget ?? ""),
          numberOfLooms: String(firstItem.numberOfLooms ?? ""),
          warpLength: String(firstItem.warpLength ?? ""),
          warpCrimpPercentage: String(firstItem.warpCrimpPercentage ?? ""),
          pieceLength: String(firstItem.pieceLength ?? ""),
          numberOfPieces: String(firstItem.numberOfPieces ?? ""),
          ppi: ppiStr,
          ratePerUnit: calculatedRate || String(firstItem.ratePerUnit ?? ""),
          uomId: String(firstItem.uomId ?? firstItem.uomId ?? firstItem.uom ?? ''),
          activeFlag: firstItem.activeFlag ?? true,
          taxableAmount: taxableAmt,
          gstPercent: String(firstItem.gstPercent ?? ""),
          totalAmount: totalAmt,
        });

        const fabric = normalizedFabricMasterList.find((f: any) => f.id === firstItem.fabricCodeId);
        if (fabric) {
          setSelectedFabric(fabric);
        }
      }

      // Set order details
      setOrderDetails(
        (weavingWorkOrderDtl.orderDetails || []).map((od: any) => ({
          id: od.id,
          salesOrderNo: String(od.salesOrderId ?? ""),
          orderQuantity: String(od.orderQuantity ?? ""),
          plannedQuantity: String(od.plannedQuantity ?? ""),
          totalQuantity: String(od.plannedQuantity ?? od.totalQuantity ?? ""),
          uomId: String(od.uomId ?? od.uomId ?? od.uom ?? ''),
        }))
      );

      // Set yarn requirements
      setYarnRequirements(
        (weavingWorkOrderDtl.yarnRequirements || []).map((yarn: any) => {
          const yarnIdValue = yarn.yarnId ?? yarn.yarn_id;
          return {
            id: yarn.id,
            yarnId: yarnIdValue,
            yarnType: yarn.yarnType,
            yarnCount: resolveYarnName(yarnIdValue, yarn.yarnCount),
            gramsPerMeter: Number(yarn.gramsPerMeter ?? yarn.grams_per_meter ?? 0),
            totalWeavingOrderQty: Number(yarn.totalWeavingOrderQty ?? 0),
            totalRequiredQty: Number(yarn.totalRequiredQty ?? 0),
            totalAvailableQty: Number(yarn.totalAvailableQty ?? 0),
            activeFlag: yarn.activeFlag ?? true,
          };
        })
      );

      setIsEditing(true);
    }
  }, [weavingWorkOrderDtl, reset, fabricMasterList, resolveYarnName]);

  useEffect(() => {
    if (editData) {
      const firstItem = editData.items?.[0] || {};
      const pickCostStr = String(firstItem.pickCost ?? '');
      const ppiStr = String(firstItem.ppi ?? '');
      const computedRate = computeRatePerUnit(pickCostStr, ppiStr);
      const taxableAmt = (parseFloat(String(firstItem.quantity ?? '0')) * parseFloat(computedRate || '0')).toFixed(2);
      const totalAmt = (parseFloat(taxableAmt) * (1 + parseFloat(String(firstItem.gstPercent ?? '0')) / 100)).toFixed(2);

      reset({
        orderDate: editData.orderDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        orderTypeId: String(editData.orderTypeId || ''),
        buyerId: editData.buyerId ? String(editData.buyerId) : '',
        consigneeId: editData.consigneeId ? String(editData.consigneeId) : '',
        gstTypeId: String(editData.gstTypeId || ''),
        termsConditionsId: editData.termsConditionsId ? String(editData.termsConditionsId) : '',
        paymentTermsId: editData.paymentTermsId ? String(editData.paymentTermsId) : '',
        packingTypeId: editData.packingTypeId || '',
        remarks: editData.remarks || '',
        fabricCodeId: firstItem.fabricCodeId ? String(firstItem.fabricCodeId) : '',
        fabricQuality: firstItem.fabricQuality ? String(firstItem.fabricQuality) : '',
        ppi: ppiStr,
        pickRate: pickCostStr,
        orderQty: firstItem.quantity != null ? String(firstItem.quantity) : '',
        ratePerUnit: computedRate || '',
        taxableAmount: taxableAmt || '',
        gstPercent: firstItem.gstPercent != null ? String(firstItem.gstPercent) : '',
        totalAmount: totalAmt || '',
      });

      setWeavingWorkOrderItemDtl(
        (editData.items || []).map((item: any) => {
          const rate = computeRatePerUnit(String(item.pickCost ?? ''), String(item.ppi ?? ''));
          const taxable = (parseFloat(String(item.quantity ?? '0')) * parseFloat(rate || '0')).toFixed(2);
          const total = (parseFloat(taxable) * (1 + parseFloat(String(item.gstPercent ?? '0')) / 100)).toFixed(2);
          return {
            id: item.id,
            fabricCodeId: String(item.fabricCodeId ?? ''),
            fabricQualityId: String(item.fabricQualityId ?? ''),
            fabricQuality: item.fabricQuality || '',
            quantity: String(item.quantity ?? ''),
            pickCost: String(item.pickCost ?? ''),
            plannedStartDate: item.plannedStartDate ? String(item.plannedStartDate).slice(0, 10) : '',
            plannedEndDate: item.plannedEndDate ? String(item.plannedEndDate).slice(0, 10) : '',
            dailyTarget: String(item.dailyTarget ?? ''),
            numberOfLooms: String(item.numberOfLooms ?? ''),
            warpLength: String(item.warpLength ?? ''),
            warpCrimpPercentage: String(item.warpCrimpPercentage ?? ''),
            pieceLength: String(item.pieceLength ?? ''),
            numberOfPieces: String(item.numberOfPieces ?? ''),
            ppi: String(item.ppi ?? ''),
            ratePerUnit: rate,
            uomId: String(item.unit ?? item.uomId ?? item.uom ?? ''),
            activeFlag: item.activeFlag ?? true,
            taxableAmount: String(item.taxableAmount ?? taxable),
            gstPercent: String(item.gstPercent ?? ''),
            totalAmount: String(item.totalAmount ?? total),
          };
        })
      );

      if (firstItem.fabricCodeId) {
        const fabric: any = normalizedFabricMasterList?.find((f: any) => String(f.id) === String(firstItem.fabricCodeId));
        if (fabric) setSelectedFabric(fabric);
      }

      setNewItem({
        id: firstItem.id,
        fabricCodeId: String(firstItem.fabricCodeId ?? ''),
        fabricQualityId: String(firstItem.fabricQualityId ?? ''),
        fabricQuality: firstItem.fabricQuality ? String(firstItem.fabricQuality) : '',
        quantity: String(firstItem.quantity ?? ''),
        pickCost: pickCostStr,
        plannedStartDate: firstItem.plannedStartDate ? String(firstItem.plannedStartDate).slice(0, 10) : '',
        plannedEndDate: firstItem.plannedEndDate ? String(firstItem.plannedEndDate).slice(0, 10) : '',
        dailyTarget: String(firstItem.dailyTarget ?? ''),
        numberOfLooms: String(firstItem.numberOfLooms ?? ''),
        warpLength: String(firstItem.warpLength ?? ''),
        warpCrimpPercentage: String(firstItem.warpCrimpPercentage ?? ''),
        pieceLength: String(firstItem.pieceLength ?? ''),
        numberOfPieces: String(firstItem.numberOfPieces ?? ''),
        ppi: ppiStr,
        ratePerUnit: computedRate || '',
        uomId: String(firstItem.uomId ?? firstItem.uomId ?? firstItem.uom ?? ''),
        activeFlag: firstItem.activeFlag ?? true,
        taxableAmount: taxableAmt,
        gstPercent: String(firstItem.gstPercent ?? ''),
        totalAmount: totalAmt,
      });

      setOrderDetails(
        (editData.orderDetails || []).map((od: any) => ({
          id: od.id,
          salesOrderNo: String(od.salesOrderId ?? ''),
          orderQuantity: String(od.orderQuantity ?? ''),
          plannedQuantity: String(od.plannedQuantity ?? ''),
          totalQuantity: String(od.plannedQuantity ?? od.totalQuantity ?? ''),
          uomId: String(od.uomId ?? od.uomId ?? od.uom ?? ''),
          fabricCodeId: String(firstItem.fabricCodeId ?? ''),
        }))
      );

      setYarnRequirements(
        (editData.yarnRequirements || []).map((yarn: any) => {
          const yarnIdValue = yarn.yarnId ?? yarn.yarn_id;
          return {
            id: yarn.id,
            yarnId: yarnIdValue,
            yarnType: yarn.yarnType,
            yarnCount: resolveYarnName(yarnIdValue, yarn.yarnCount),
            gramsPerMeter: Number(yarn.gramsPerMeter ?? yarn.grams_per_meter ?? 0),
            totalWeavingOrderQty: Number(yarn.totalWeavingOrderQty ?? 0),
            totalRequiredQty: Number(yarn.totalRequiredQty ?? 0),
            totalAvailableQty: Number(yarn.totalAvailableQty ?? 0),
            activeFlag: yarn.activeFlag ?? true,
          };
        })
      );

      setIsEditing(true);
    }
  }, [editData, reset, normalizedFabricMasterList, resolveYarnName]);


  useEffect(() => {
    if (!ppi || !pickRate) return;
    const rpu = (parseFloat(ppi || '0') * parseFloat(pickRate || '0')) || 0;
    setValue('ratePerUnit', rpu.toFixed(2), { shouldValidate: true });
  }, [ppi, pickRate, setValue]);

  useEffect(() => {
    const qty = parseFloat(orderQty || '0') || 0;
    const rpu = parseFloat(watch('ratePerUnit') || '0') || 0;
    const taxable = qty * rpu;
    setValue('taxableAmount', taxable.toFixed(2), { shouldValidate: false });

    const gstPct = parseFloat(gstPercent || '0') || 0;
    const total = taxable + (taxable * gstPct / 100);
    setValue('totalAmount', total.toFixed(2), { shouldValidate: false });
  }, [orderQty, gstPercent, watch, setValue]);

  useEffect(() => {
    const nextQuantity = hasValue(orderQty) ? String(orderQty) : '';
    setNewItem(prev => {
      if (prev.quantity === nextQuantity) {
        return prev;
      }
      return { ...prev, quantity: nextQuantity };
    });
  }, [orderQty]);

  useEffect(() => {
    if (!hasValue(orderQty)) return;
    const oq = String(orderQty);
    setOrderDetails(prev => {
      let hasChanges = false;
      const next = prev.map(detail => {
        if (detail.salesOrderNo) return detail;
        const updated = { ...detail };
        if (updated.orderQuantity !== oq) {
          updated.orderQuantity = oq;
          hasChanges = true;
        }
        if (!hasValue(updated.plannedQuantity) || updated.plannedQuantity === '0') {
          updated.plannedQuantity = oq;
          hasChanges = true;
        }
        if (!hasValue(updated.totalQuantity) || updated.totalQuantity === '0') {
          updated.totalQuantity = oq;
          hasChanges = true;
        }
        return updated;
      });
      return hasChanges ? next : prev;
    });
  }, [orderQty]);

  useEffect(() => {
    setOrderDetails(prev => {
      if (!prev.length) return prev;
      let hasChanges = false;
      const next = prev.map(detail => {
        const resolvedFabricId = detail.fabricCodeId || (fabricCodeId ? String(fabricCodeId) : '');
        let updatedDetail = detail;
        if (resolvedFabricId && detail.fabricCodeId !== resolvedFabricId) {
          updatedDetail = { ...updatedDetail, fabricCodeId: resolvedFabricId };
          hasChanges = true;
        }
        if (!detail.salesOrderNo) {
          return updatedDetail;
        }
        const qty = getSalesOrderQuantity(detail.salesOrderNo, resolvedFabricId);
        if (qty == null) {
          return updatedDetail;
        }
        const qtyStr = qty.toString();
        const plannedNum = parseFloat(updatedDetail.plannedQuantity || '0');
        const adjustedPlanned = plannedNum > qty ? qtyStr : (hasValue(updatedDetail.plannedQuantity) ? updatedDetail.plannedQuantity : qtyStr);
        if (
          updatedDetail.orderQuantity === qtyStr &&
          updatedDetail.totalQuantity === qtyStr &&
          adjustedPlanned === updatedDetail.plannedQuantity
        ) {
          return updatedDetail;
        }
        hasChanges = true;
        return {
          ...updatedDetail,
          orderQuantity: qtyStr,
          totalQuantity: qtyStr,
          plannedQuantity: adjustedPlanned,
        };
      });
      return hasChanges ? next : prev;
    });
  }, [fabricCodeId, getSalesOrderQuantity]);

  useEffect(() => {
    if (!fabricCodeId || !normalizedFabricMasterList?.length) {
      if (!fabricCodeId) {
        setSelectedFabric(null);
        setValue('fabricQuality', '', { shouldValidate: false });
        setValue('gstPercent', '', { shouldValidate: false });
      }
      return;
    }

    const isInitialFabric = initialFabricCodeIdRef.current && String(fabricCodeId) === initialFabricCodeIdRef.current;

    if (orderTypeId === '1') {
      const allItems = normalizedWeavingContractList.flatMap((wc: any) => wc.items || []);
      const match = allItems.find((it: any) => String(it.fabricCodeId) === String(fabricCodeId));
      if (match) {
        if (!isInitialFabric || !getValues('ppi')) {
          setValue('ppi', String(match.ppi || ''), { shouldValidate: true });
        }
        if (!isInitialFabric || !getValues('pickRate')) {
          setValue('pickRate', String(match.pickCost || ''), { shouldValidate: true });
        }
        if (!isInitialFabric || !getValues('orderQty')) {
          setValue('orderQty', String(match.quantity || ''), { shouldValidate: true });
        }
      }
    }

    const fabric: any = normalizedFabricMasterList?.find((f: any) => String(f.id) === String(fabricCodeId));
    if (fabric) {
      setSelectedFabric(fabric);

      // ALWAYS fetch quality and GST if not present or not initial
      if (!isInitialFabric || !getValues('fabricQuality')) {
        setValue('fabricQuality', fabric.fabricQuality || '', { shouldValidate: false });
      }

      if (!isInitialFabric || !getValues('ppi')) {
        if (!orderTypeId || orderTypeId === '2') {
          setValue('ppi', String(fabric.ppi || ''), { shouldValidate: true });
        }
      }

      const calculatedGst = fabric.gstPercent || (Number(fabric.igst || 0) || (Number(fabric.cgst || 0) + Number(fabric.sgst || 0))) || 0;
      if (!isInitialFabric || !getValues('gstPercent')) {
        setValue('gstPercent', String(calculatedGst || ''), { shouldValidate: true });
      }

      // Update newItem to stay in sync with autofetched values
      setNewItem(prev => ({
        ...prev,
        fabricQuality: getValues('fabricQuality') || prev.fabricQuality || '',
        gstPercent: getValues('gstPercent') || prev.gstPercent || '',
        ppi: getValues('ppi') || prev.ppi || '',
        pickCost: getValues('pickRate') || prev.pickCost || '',
      }));
    } else {
      setSelectedFabric(null);
      if (!isInitialFabric) {
        setValue('fabricQuality', '', { shouldValidate: false });
      }
    }
  }, [fabricCodeId, normalizedFabricMasterList, setValue, getValues, orderTypeId, normalizedWeavingContractList]);

  // const totalWeavingQty = useMemo(() => parseFloat(orderQty || '0') || 0, [orderQty]);
  const totalWeavingQty = useMemo(() => {
    const savedItemsTotal = weavingWorkOrderItemDtl.reduce((sum, item) => sum + parseFloat(item.quantity || "0"), 0);
    const currentItemQty = parseFloat(newItem.quantity || "0");
    const editingItemOriginalQty = editingIndex !== null
      ? parseFloat(weavingWorkOrderItemDtl[editingIndex]?.quantity || "0")
      : 0;

    if (editingIndex !== null) {
      return savedItemsTotal + currentItemQty - editingItemOriginalQty;
    }

    if (savedItemsTotal === 0) {
      return currentItemQty;
    }

    if (isEditing) {
      return currentItemQty || savedItemsTotal;
    }

    if (newItem.fabricCodeId && currentItemQty) {
      return savedItemsTotal + currentItemQty;
    }

    return savedItemsTotal;
  }, [weavingWorkOrderItemDtl, newItem.quantity, newItem.fabricCodeId, editingIndex, isEditing]);
  const totalOrderDetailsQty = useMemo(
    () => orderDetails.reduce((sum, od) => sum + parseFloat(od.plannedQuantity || "0"), 0),
    [orderDetails]
  );

  const filteredSalesOrders = useMemo(() => {
    if (!fabricCodeId) return [] as any[];
    const normalizedFabricId = String(fabricCodeId);

    return normalizedSalesOrders.filter((so: any) => {
      const items = getSalesOrderItems(so);
      if (!items.length) return false;
      return items.some((item: any) => {
        const itemFabricId = String(item.fabricMasterId ?? item.fabricId ?? item.fabricCodeId ?? item.fabricCode?.id ?? '');
        return itemFabricId === normalizedFabricId;
      });
    });
  }, [normalizedSalesOrders, getSalesOrderItems, fabricCodeId]);

  const salesOrderOptions = useMemo<SelectOption[]>(() => {
    return (filteredSalesOrders || []).map((so: any) => ({
      value: String(so.id),
      label: so.salesOrderNo || so.orderNumber || `SO-${so.id}`,
    }));
  }, [filteredSalesOrders]);


  const isOrderDetailsValid = orderDetails.length > 0 &&
    orderDetails.every(od => {
      if (!od.salesOrderNo || !hasValue(od.plannedQuantity)) return false;
      const planned = parseFloat(od.plannedQuantity || '0');
      const order = parseFloat(od.orderQuantity || '0');
      if (!Number.isFinite(planned) || !Number.isFinite(order)) return false;
      return planned <= order;
    }) &&
    Math.abs(totalOrderDetailsQty - totalWeavingQty) < 0.01;

  const hasValidItems = weavingWorkOrderItemDtl?.length > 0 || (newItem.fabricCodeId && newItem.quantity);

  const isFormValid = isValid &&
    hasValidItems &&
    isOrderDetailsValid;

  useEffect(() => {
    if (!fabricCodeId) {
      setYarnRequirements([]);
      return;
    }
    (async () => {
      try {
        const res = await apiService.get(`fabric-master/${fabricCodeId}`);
        const warp = res.data?.warpDetails || [];
        const weft = res.data?.weftDetails || [];
        const buildRequirement = (detail: any, yarnType: string): YarnRequirement => {
          const yarnIdValue = detail.yarnId ?? detail.yarn_id;
          const fallback = detail.yarnCount ?? detail.yarnName ?? (yarnIdValue != null ? String(yarnIdValue) : "");
          return {
            yarnId: yarnIdValue,
            yarnType,
            yarnCount: resolveYarnName(yarnIdValue, fallback),
            gramsPerMeter: Number(detail.gramsPerMeter ?? detail.grams_per_meter ?? 0),
            totalWeavingOrderQty: 0,
            totalRequiredQty: 0,
            totalAvailableQty: detail.units ?? 0,
            activeFlag: true
          };
        };
        const reqs: YarnRequirement[] = [
          ...warp.map((d: any) => buildRequirement(d, "Warp")),
          ...weft.map((d: any) => buildRequirement(d, "Weft")),
        ];
        setYarnRequirements(reqs);
      } catch {
        setYarnRequirements([]);
      }
    })();
  }, [fabricCodeId, resolveYarnName]);

  useEffect(() => {
    if (!weavingJobWorkOrderId || !yarnRequirementIdsKey) return;

    let cancelled = false;

    const loadAvailability = async () => {
      const params: Record<string, any> = {
        orderId: weavingJobWorkOrderId,
        itemIds: yarnRequirementIdsKey,
        inwardTypeId: 2,
      };
      if (tradingCompanyId) {
        params.companyId = tradingCompanyId;
      }

      try {
        const response = await apiService.get("yarn-inward-stock/available-qty-by-order", params);
        if (cancelled || !response) return;

        const availability = Object.entries(response || {}).reduce<Record<string, number>>((acc, [key, value]) => {
          const num = Number(value ?? 0);
          acc[key] = Number.isFinite(num) ? num : 0;
          return acc;
        }, {});

        if (cancelled || !Object.keys(availability).length) return;

        setYarnRequirements(prev => {
          let changed = false;
          const updated = prev.map(req => {
            const key = hasValue(req.yarnId) ? String(req.yarnId) : null;
            if (!key || !Object.prototype.hasOwnProperty.call(availability, key)) {
              return req;
            }
            const normalizedQty = availability[key];
            const previousQty = Number(req.totalAvailableQty ?? 0);
            if (normalizedQty === previousQty) {
              return req;
            }
            changed = true;
            return { ...req, totalAvailableQty: normalizedQty };
          });
          return changed ? updated : prev;
        });
      } catch (error) {
        console.error("Failed to fetch yarn availability by order:", error);
      }
    };

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [weavingJobWorkOrderId, tradingCompanyId, yarnRequirementIdsKey]);

  useEffect(() => {
    if (!fabricCodeId || !orderDetails.length || !normalizedSalesOrders.length) return;

    setOrderDetails(prev => {
      let changed = false;
      const updated = prev.map(od => {
        if (od.salesOrderNo && (!hasValue(od.orderQuantity) || od.orderQuantity === '0')) {
          const fetchedQty = getSalesOrderQuantity(od.salesOrderNo, String(fabricCodeId));
          if (fetchedQty !== null && String(fetchedQty) !== od.orderQuantity) {
            changed = true;
            return {
              ...od,
              orderQuantity: String(fetchedQty)
            };
          }
        }
        return od;
      });
      return changed ? updated : prev;
    });
  }, [fabricCodeId, normalizedSalesOrders, getSalesOrderQuantity]);

  useEffect(() => {
    setYarnRequirements(prev => {
      let changed = false;
      const updated = prev.map(req => {
        const resolved = resolveYarnName(req.yarnId, req.yarnCount);
        if (resolved !== req.yarnCount) {
          changed = true;
          return { ...req, yarnCount: resolved };
        }
        return req;
      });
      return changed ? updated : prev;
    });
  }, [resolveYarnName]);

  useEffect(() => {
    if (!hasValue(orderQty) || !orderDetails.length) return;
    const mainQtyStr = String(orderQty);

    setOrderDetails(prev => {
      let changed = false;
      const updated = prev.map(od => {
        const rowUpdate = { ...od };
        let rowChanged = false;

        // Planned Quantity always syncs with main orderQty
        if (od.plannedQuantity !== mainQtyStr) {
          rowUpdate.plannedQuantity = mainQtyStr;
          rowUpdate.totalQuantity = mainQtyStr;
          rowChanged = true;
        }

        // Order Quantity only syncs with main orderQty if NO Sales Order is selected
        if (!od.salesOrderNo && od.orderQuantity !== mainQtyStr) {
          rowUpdate.orderQuantity = mainQtyStr;
          rowChanged = true;
        }

        if (rowChanged) {
          changed = true;
          return rowUpdate;
        }
        return od;
      });
      return changed ? updated : prev;
    });
  }, [orderQty]);

  const handleSalesOrderChange = (index: number, value: string) => {
    let duplicateDetected = false;
    let resolvedUnitForItem = '';
    setOrderDetails(prev => {
      const isDuplicate = prev.some((d, i) => d.salesOrderNo === value && i !== index);
      if (isDuplicate) {
        duplicateDetected = true;
        return prev;
      }
      const updated = [...prev];
      const target = { ...updated[index] };
      target.salesOrderNo = value;
      const resolvedFabricId = target.fabricCodeId || (fabricCodeId ? String(fabricCodeId) : '');
      if (resolvedFabricId) {
        target.fabricCodeId = resolvedFabricId;
      }
      const soQuantity = getSalesOrderQuantity(value, resolvedFabricId);
      const fallbackQty = hasValue(orderQty) ? Number(orderQty) : 0;
      const qtyNumber = soQuantity ?? fallbackQty;
      const qtyString = qtyNumber != null ? qtyNumber.toString() : '';
      const mainOrderQtyStr = String(orderQty || '');
      target.orderQuantity = qtyString;
      target.plannedQuantity = mainOrderQtyStr;
      target.totalQuantity = mainOrderQtyStr;
      target.unit = String(target.unit || newItem.uomId || '');
      resolvedUnitForItem = target.unit;
      updated[index] = target;
      return updated;
    });
    if (duplicateDetected) {
      setOrderDetailsError("Sales Order already selected.");
      return;
    }
    setOrderDetailsError("");
    if (resolvedUnitForItem) {
      setNewItem(prev => {
        if (hasValue(prev.uomId)) {
          return prev;
        }
        return { ...prev, uomId: resolvedUnitForItem };
      });
    }
  };

  const handlePlannedQtyChange = (index: number, value: string) => {
    const v = value === "" ? "" : String(value);
    setOrderDetails(prev => {
      const updated = [...prev];
      const target = { ...updated[index] };
      target.plannedQuantity = v;
      target.totalQuantity = v;
      updated[index] = target;
      return updated;
    });
    setOrderDetailsError("");
  };

  const deleteOrderDetail = (index: number) => {
    setOrderDetails(prev => prev.filter((_, i) => i !== index));
    setOrderDetailsError("");
  };

  const onSubmit = async (data: FormData) => {
    const orderQtyValue = toFloatOrNull(data.orderQty) ?? 0;

    const invalidQuantityDetail = orderDetails.find(detail => {
      const planned = toFloatOrNull(detail.plannedQuantity) ?? 0;
      const order = toFloatOrNull(detail.orderQuantity) ?? 0;
      return planned > order;
    });
    if (invalidQuantityDetail) {
      toast.error('Planned Quantity cannot exceed Order Quantity');
      setOrderDetailsError('Planned Quantity cannot exceed Order Quantity');
      setActiveTab('itemDetails');
      return;
    }

    if (!newItem.uomId) {
      toast.error('UOM is required');
      setActiveTab('itemDetails');
      return;
    }

    if (!shouldLockBuyerConsignee && !buyerId) {
      toast.error('Buyer Name is required');
      setActiveTab('orderDetails');
      return;
    }

    if (!shouldLockBuyerConsignee && !consigneeId) {
      toast.error('Consignee Name is required');
      setActiveTab('orderDetails');
      return;
    }

    if (!watch('packingTypeId')) {
      toast.error('Packing Type is required');
      setActiveTab('orderDetails');
      return;
    }

    const validYarnRequirements = (yarnRequirements || []).filter(r =>
      r.yarnType && r.yarnCount && r.gramsPerMeter > 0
    );

    const baseItems = weavingWorkOrderItemDtl.length > 0
      ? [...weavingWorkOrderItemDtl]
      : (hasValue(data.fabricCodeId) && hasValue(data.orderQty)
        ? [{
          id: weavingWorkOrderDtl?.items?.[0]?.id,
          fabricCodeId: String(data.fabricCodeId),
          fabricQuality: data.fabricQuality || selectedFabric?.fabricQuality || '',
          quantity: String(data.orderQty ?? '0'),
          pickCost: String(data.pickRate ?? ''),
          plannedStartDate: '',
          plannedEndDate: '',
          dailyTarget: '',
          numberOfLooms: '',
          warpLength: '',
          warpCrimpPercentage: '',
          pieceLength: '',
          numberOfPieces: '',
          ppi: String(data.ppi ?? ''),
          ratePerUnit: String(data.ratePerUnit || ''),
          uomId: String(newItem.uomId || ''),
          activeFlag: true,
          gstPercent: String(data.gstPercent ?? ''),
        }]
        : []);

    const itemsToNormalize = baseItems.map((item, index) => {
      if (!item) return item;
      if (weavingWorkOrderItemDtl.length === 0 || index !== 0) return item;
      const overrides: Partial<WeavingWorkOrderItem> = {};
      if (hasValue(data.fabricCodeId)) overrides.fabricCodeId = String(data.fabricCodeId);
      if (hasValue(data.fabricQuality)) {
        overrides.fabricQuality = data.fabricQuality;
      } else if (selectedFabric?.fabricQuality) {
        overrides.fabricQuality = selectedFabric.fabricQuality;
      }
      if (hasValue(data.orderQty)) overrides.quantity = String(data.orderQty);
      if (hasValue(data.pickRate)) overrides.pickCost = String(data.pickRate);
      if (hasValue(data.ppi)) overrides.ppi = String(data.ppi);
      if (hasValue(data.ratePerUnit)) overrides.ratePerUnit = String(data.ratePerUnit);
      if (hasValue(data.gstPercent)) overrides.gstPercent = String(data.gstPercent);
      overrides.uomId = newItem.uomId || item.uomId;
      return { ...item, ...overrides };
    });

    const draftKey = `draft-weaving-work-order-${weavingWorkOrderDtl?.id}`;
    const itemsDraftKey = `${draftKey}-items`;

    const normalizedItems = itemsToNormalize
      .map(item => {
        const fabricCodeId = toIntOrNull(item.fabricCodeId);
        if (fabricCodeId === null) return null;
        const resolvedUomId = toIntOrNull(item.uomId) ?? toIntOrNull(newItem.uomId) ?? null;
        const quantityNum = toFloatOrNull(item.quantity) ?? 0;
        const pickCostNum = toFloatOrNull(item.pickCost) ?? 0;
        const ppiNum = toFloatOrNull(item.ppi) ?? 0;
        const ratePerUnitNum = toFloatOrNull(item.ratePerUnit) ?? (pickCostNum * ppiNum);
        const taxableAmountNum = quantityNum * ratePerUnitNum;
        const gstPercentNum = toFloatOrNull(item.gstPercent) ?? toFloatOrNull(data.gstPercent) ?? 0;
        const totalAmountNum = taxableAmountNum * (1 + gstPercentNum / 100);
        return {
          id: item.id,
          fabricCodeId,
          fabricQuality: item.fabricQuality || data.fabricQuality || selectedFabric?.fabricQuality || '',
          quantity: quantityNum,
          pickCost: pickCostNum,
          plannedStartDate: item.plannedStartDate || null,
          plannedEndDate: item.plannedEndDate || null,
          dailyTarget: toFloatOrNull(item.dailyTarget),
          numberOfLooms: toIntOrNull(item.numberOfLooms),
          warpLength: toFloatOrNull(item.warpLength),
          warpCrimpPercentage: toFloatOrNull(item.warpCrimpPercentage),
          pieceLength: toFloatOrNull(item.pieceLength),
          numberOfPieces: toIntOrNull(item.numberOfPieces),
          activeFlag: item.activeFlag ?? true,
          ppi: ppiNum,
          ratePerUnit: ratePerUnitNum,
          unit: resolvedUomId,
          uomId: resolvedUomId,
          taxableAmount: taxableAmountNum,
          gstPercent: gstPercentNum,
          totalAmount: totalAmountNum,
        };
      })
      .filter(Boolean) as any[];

    const updatedYarnRequirements = validYarnRequirements.map(r => ({
      id: r.id,
      yarnType: r.yarnType,
      yarnCount: r.yarnCount,
      gramsPerMeter: r.gramsPerMeter,
      totalWeavingOrderQty: orderQtyValue,
      totalRequiredQty: orderQtyValue * Number(r.gramsPerMeter || 0),
      totalAvailableQty: r.totalAvailableQty || 0,
      activeFlag: true,
    }));

    const normalizedOrderDetails = (orderDetails || [])
      .map(d => {
        const salesOrderId = toIntOrNull(d.salesOrderNo);
        if (salesOrderId === null) return null;
        const plannedQty = toFloatOrNull(d.plannedQuantity) ?? 0;
        return {
          id: d.id,
          salesOrderId,
          fabricCodeId: toIntOrNull(d.fabricCodeId ?? data.fabricCodeId) ?? toIntOrNull(data.fabricCodeId ?? ''),
          orderQuantity: toFloatOrNull(d.orderQuantity) ?? orderQtyValue,
          plannedQuantity: plannedQty,
          totalQuantity: toFloatOrNull(d.totalQuantity) ?? plannedQty,
          unit: toIntOrNull(d.unit) ?? toIntOrNull(newItem.uomId) ?? null,
          activeFlag: true,
        };
      })
      .filter(Boolean) as any[];

    const isInternalOrder = toIntOrNull(data.orderTypeId) === 1;
    const editionIsInternal = editData?.id && Number(editData.orderTypeId) === 1;
    const resolvedOrderTypeId = editionIsInternal ? Number(editData.orderTypeId) : toIntOrNull(data.orderTypeId);

    const isEditMode = Boolean(editData?.id);
    let weavingWorkOrderNo = data.weavingWorkOrderNo || editData?.weavingWorkOrderNo || "";
    if (!editData?.id && !weavingWorkOrderNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Weaving Jobwork Order"
        });
        weavingWorkOrderNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    isSavingRef.current = true;
    const payload = {
      weavingWorkOrderNo: weavingWorkOrderNo,
      orderDate: data.orderDate,
      orderTypeId: resolvedOrderTypeId,
      weavingContractId: resolvedWeavingContractId ?? null,
      buyerId: editionIsInternal ? editData?.buyerId : (isInternalOrder ? tradingCompanyId : toIntOrNull(data.buyerId)),
      consigneeId: editionIsInternal ? editData?.consigneeId : (isInternalOrder ? tradingCompanyId : toIntOrNull(data.consigneeId)),
      gstTypeId: toIntOrNull(data.gstTypeId),
      termsConditionsId: toIntOrNull(data.termsConditionsId),
      paymentTermsId: toIntOrNull(data.paymentTermsId),
      packingTypeId: toIntOrNull(data.packingTypeId),
      remarks: data.remarks,
      items: normalizedItems,
      yarnRequirements: updatedYarnRequirements,
      orderDetails: normalizedOrderDetails,
      isCompleted: editData?.isCompleted ?? false,
      activeFlag: true,
      ...(resolvedOrderTypeId === 2 ? {
        factoryCompanyId: tradingCompanyId,
        tradingCompanyId: null
      } : {
        factoryCompanyId: editionIsInternal ? editData?.factoryCompanyId : tradingCompanyId,
        tradingCompanyId: editionIsInternal ? editData?.tradingCompanyId : null,
      })
    } as any;
    // alert(JSON.stringify(payload));
    console.log("Payload to submit:", payload);
    const targetRoute = '/transaction/weaving-jobwork-order-details';
    try {
      if (isEditMode) {
        const updatePayload = {
          id: editData.id,
          data: payload,
          factoryCompanyId: editingFactoryCompanyId ?? undefined,
        };
        await dispatch(updateWeavingJobWorkOrder(updatePayload as any)).unwrap();
      } else {
        const createPayload = {
          data: payload,
          factoryCompanyId: tradingCompanyId,
        };
        await dispatch(createWeavingJobWorkOrder(createPayload as any)).unwrap();
        documentNumberService.clearMemoryCache("Weaving Jobwork Order");
      }
      navigate(targetRoute);
    } catch (error) {
      console.error(error);
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleFormSubmit = handleSubmit(onSubmit, handleInvalidSubmit);

  const isInternal = orderTypeId === '1';


  useEffect(() => {
    if (!buyerId || orderTypeId === '1') {
      setBuyerStateCode('');
      return;
    }

    const buyer = (customerList || []).find((c: any) => String(c.id) === String(buyerId));
    if (!buyer) {
      setBuyerStateCode('');
      return;
    }

    const addr = Array.isArray(buyer?.address) ? buyer.address[0] : buyer?.address;
    const stId = addr?.stateId || addr?.stateCode;
    const mapped = (stateList || []).find((st: any) => st.id === stId || st.stateCode === stId)?.stateCode;
    const code = mapped || addr?.stateCode || '';
    setBuyerStateCode(code);
  }, [buyerId, orderTypeId, customerList, stateList]);

  useEffect(() => {
    if (!orderTypeId) return;

    if (orderTypeId === '1') {
      setValue('gstTypeId', '1', { shouldValidate: true, shouldDirty: false });
      return;
    }

    if (!companyStateCode) return;

    if (!buyerStateCode) {
      setValue('gstTypeId', '2', { shouldValidate: true, shouldDirty: false });
      return;
    }

    const newTaxId = buyerStateCode === companyStateCode ? '1' : '2';
    setValue('gstTypeId', newTaxId, { shouldValidate: true, shouldDirty: false });
  }, [orderTypeId, buyerStateCode, companyStateCode, setValue]);

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/transaction/weaving-jobwork-order-details")}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">Weaving Job Work Order</h2>
          </div>
        </div>
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('orderDetails')}
                  className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'orderDetails'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 Inward Ordershover:border-gray-300'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  Order Details
                </button>
                <button
                  onClick={() => setActiveTab('itemDetails')}
                  className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'itemDetails'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Item Details
                </button>
              </nav>
            </div>
          </div>
        </div>
        {/* Order Details */}
        {activeTab === "orderDetails" && (
          <Card>
            <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>

                  <label className="block text-sm mb-1">Weaving Work Order No</label>

                  <input type="text"
                    className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                      !watch('weavingWorkOrderNo') || watch('weavingWorkOrderNo')?.startsWith('Loading')
                        ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                        : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                    }`}
                    placeholder="Loading sequence..."
                    {...register('weavingWorkOrderNo')} readOnly />

                </div>

                <div>
                  <label className="block text-sm font-medium">Date <span className="text-red-600">*</span></label>
                  <input type="date" className="input mt-1" {...register('orderDate', { required: 'Required' })} />
                  {errors.orderDate && <p className="mt-1 text-sm text-red-600">{String(errors.orderDate.message)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Order Type <span className="text-red-600">*</span></label>
                  <input className="input mt-1 bg-gray-100" readOnly value={orderTypeId === '1' ? 'Internal' : orderTypeId === '2' ? 'External' : ''} />
                  <input type="hidden" {...register('orderTypeId', { required: 'Required' })} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Buyer Name <span className="text-red-600">*</span></label>
                  {shouldLockBuyerConsignee ? (
                    <>
                      <input type="hidden" value={buyerId || ''} {...register('buyerId')} />
                      <input
                        className="input mt-1 bg-gray-100"
                        readOnly
                        value={isInternal ? tradingCompanyName || '' : (selectedBuyerLabel || buyerId || '')}
                      />
                    </>
                  ) : (
                    <CommonSearchableSelect
                      className="mt-1"
                      placeholder="Select Buyer"
                      options={buyerOptions}
                      filterActive
                      value={watch('buyerId') || ''}
                      {...register('buyerId', { required: !shouldLockBuyerConsignee ? 'Required' : false })}
                      onValueChange={(value) => setValue('buyerId', value, { shouldValidate: true })}
                      error={errors.buyerId?.message as string}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Consignee Name <span className="text-red-600">*</span></label>
                  {shouldLockBuyerConsignee ? (
                    <>
                      <input type="hidden" value={consigneeId || ''} {...register('consigneeId')} />
                      <input
                        className="input mt-1 bg-gray-100"
                        readOnly
                        value={isInternal ? tradingCompanyName || '' : (selectedConsigneeLabel || consigneeId || '')}
                      />
                    </>
                  ) : (
                    <CommonSearchableSelect
                      className="mt-1"
                      placeholder="Select Consignee"
                      options={consigneeOptions}
                      filterActive
                      value={watch('consigneeId') || ''}
                      {...register('consigneeId', { required: !shouldLockBuyerConsignee ? 'Required' : false })}
                      onValueChange={(value) => setValue('consigneeId', value, { shouldValidate: true })}
                      error={errors.consigneeId?.message as string}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">GST Type <span className="text-red-600">*</span></label>
                  <select className="input mt-1" disabled {...register('gstTypeId', { required: 'Required' })}>
                    <option value="">Select GST Type</option>
                    <option value="1">CGST/SGST</option>
                    <option value="2">IGST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Terms & Conditions</label>
                  <CommonSearchableSelect
                    className="mt-1"
                    placeholder="Select Terms"
                    options={termsOptions}
                    filterActive
                    value={watch('termsConditionsId') || ''}
                    {...register('termsConditionsId')}
                    onValueChange={(value) => setValue('termsConditionsId', value, { shouldValidate: true })}
                    error={errors.termsConditionsId?.message as string}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Payment Terms</label>
                  <CommonSearchableSelect
                    className="mt-1"
                    placeholder="Select Payment Terms"
                    options={paymentOptions}
                    filterActive
                    value={watch('paymentTermsId') || ''}
                    {...register('paymentTermsId')}
                    onValueChange={(value) => setValue('paymentTermsId', value, { shouldValidate: true })}
                    error={errors.paymentTermsId?.message as string}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Packing Type <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    className="mt-1"
                    placeholder="Select Packing Type"
                    options={PACKING_TYPE_OPTIONS}
                    value={watch('packingTypeId') || ''}
                    {...register('packingTypeId', { required: 'Required' })}
                    onValueChange={(value) => setValue('packingTypeId', value, { shouldValidate: true })}
                    error={errors.packingTypeId?.message as string}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Remarks</label>
                  <input className="input mt-1" {...register('remarks')} placeholder="Remarks" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Item Details */}
        {activeTab === "itemDetails" && (
          <>
            <Card>
              <CardHeader><CardTitle>Item Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium">Sort No <span className="text-red-600">*</span></label>
                    <CommonSearchableSelect
                      className="mt-1"
                      placeholder="Select Sort No"
                      options={fabricOptions}
                      value={watch('fabricCodeId') || ''}
                      {...register('fabricCodeId', { required: 'Required' })}
                      onValueChange={(value) => setValue('fabricCodeId', value, { shouldValidate: true })}
                      error={errors.fabricCodeId?.message as string}
                      disabled={isInternalOrder}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Construction</label>
                    <input className="input mt-1 bg-gray-100" readOnly {...register('fabricQuality')} value={fabricQuality || ''} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">PPI <span className="text-red-600">*</span></label>
                    <input className="input mt-1" {...register('ppi', { required: 'Required' })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Pick Rate <span className="text-red-600">*</span></label>
                    <input className="input mt-1" {...register('pickRate', { required: 'Required' })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Order Qty <span className="text-red-600">*</span></label>
                    {/* <input className="input mt-1" {...register('orderQty', { required: 'Required' })} /> */}
                    <input
                      className={`input mt-1${isInternalOrder ? ' bg-gray-100' : ''}`}
                      readOnly={isInternalOrder}
                      {...register('orderQty', { required: 'Required' })}
                    />

                  </div>
                  <div>
                    <label className="block text-sm font-medium">Rate / Unit</label>
                    <input className="input mt-1 bg-gray-100" readOnly {...register('ratePerUnit')} value={watch('ratePerUnit') || ''} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Taxable Amount</label>
                    <input className="input mt-1 bg-gray-100" readOnly {...register('taxableAmount')} value={watch('taxableAmount') || ''} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">GST % <span className="text-red-600">*</span></label>
                    <input
                      className="input mt-1"
                      onKeyDown={(e) => {
                        if (!/[\d.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      {...register('gstPercent', { required: 'Required' })}
                    />

                    {/* <input className="input mt-1" {...register('gstPercent', { required: 'Required' })} /> */}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Total Amount</label>
                    <input className="input mt-1 bg-gray-100" readOnly {...register('totalAmount')} value={watch('totalAmount') || ''} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">UOM <span className="text-red-500">*</span></label>
                    <CommonSearchableSelect
                      className="mt-1"
                      placeholder="Select Unit"
                      options={uomOptions}
                      filterActive
                      value={newItem.uomId}
                      onValueChange={(value) => setNewItem({ ...newItem, uomId: value })}
                    />
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium">UOM</label>
                    <select
                      className="input mt-1"
                      disabled
                      value={watch('fabricCodeId') ? uomList?.find((u: any) => String(u.id) === String(selectedFabric?.uom ?? selectedFabric?.uom))?.uomName || 'METER' : ''}
                    >
                      <option value="">
                        {watch('fabricCodeId') ? (uomList?.find((u: any) => String(u.id) === String(selectedFabric?.uom ?? selectedFabric?.uom))?.uomName || 'METER') : 'Select fabric code first'}
                      </option>
                    </select>
                  </div> */}
                </div>
                {/* <div className="flex justify-end mt-4 gap-2">
                  <Button variant="outline" onClick={() => navigate('/transaction/weaving-jobwork-order-details')}>Cancel</Button>
                  <Button className="bg-blue-600 text-white" onClick={handleSubmit(onSubmit)}>{editData ? 'Update' : 'Save'}</Button>
                </div> */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList size={20} /> Yarn Requirement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="table-auto w-full border border-gray-300 mt-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2">Sl.No</th>
                      <th className="border px-4 py-2">Warp/Weft</th>
                      <th className="border px-4 py-2">Yarn Count</th>
                      <th className="border px-4 py-2">Grams/Mtr</th>
                      <th className="border px-4 py-2">Total Req Quantity</th>
                      <th className="border px-4 py-2">Total Available Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yarnRequirements.length > 0 ? (
                      yarnRequirements.map((req, index) => (
                        <tr key={index}>
                          <td className="border px-4 py-2 text-center">{index + 1}</td>
                          <td className="border px-4 py-2 text-center">{req.yarnType}</td>
                          <td className="border px-4 py-2 text-center">{req.yarnCount}</td>
                          <td className="border px-4 py-2 text-center">{req.gramsPerMeter}</td>
                          <td className="border px-4 py-2 text-center">{(totalWeavingQty * Number(req.gramsPerMeter || 0)).toFixed(2)}</td>
                          <td className="border px-4 py-2 text-center">{Number(req.totalAvailableQty ?? 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="border px-4 py-2 text-center text-gray-500">
                          No yarn details found for the selected fabric code
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList size={20} /> Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={() => {
                      const oq = hasValue(orderQty) ? String(orderQty) : '';
                      const defaultUnit = String(newItem.uomId || '');
                      const fc = hasValue(fabricCodeId) ? String(fabricCodeId) : '';
                      setOrderDetails(prev => [...prev, { fabricCodeId: fc, salesOrderNo: '', orderQuantity: '', plannedQuantity: oq, totalQuantity: oq || '0', unit: defaultUnit }]);
                      setOrderDetailsError('');
                    }}
                    className="bg-primary text-white"
                  >
                    Add Order Items
                  </Button>
                </div>
                <table className="w-full border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Sl.No</th>
                      <th className="border p-2">Sales Order No</th>
                      <th className="border p-2">Order Quantity</th>
                      <th className="border p-2">Planned Quantity</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.map((detail, index) => {
                      const savedSalesOrderId = detail.salesOrderNo;
                      const hasSavedSalesOrderOption =
                        orderTypeId === '1' &&
                        savedSalesOrderId &&
                        !filteredSalesOrders?.some((so: any) => String(so.id) === String(savedSalesOrderId));
                      return (
                        <tr key={index} className="border">
                          <td className="border p-2">{index + 1}</td>
                          <td className="border p-2">
                            <CommonSearchableSelect
                              className=" rounded w-full text-left"
                              value={detail.salesOrderNo || ''}
                              options={
                                [
                                  ...(hasSavedSalesOrderOption
                                    ? [{
                                      value: savedSalesOrderId,
                                      label: getSalesOrderLabel(savedSalesOrderId),
                                    }]
                                    : []),
                                  ...salesOrderOptions,
                                ]
                              }
                              placeholder={!fabricCodeId
                                ? "Select Sort No first"
                                : orderTypeId === '1'
                                  ? "Internal orders - No sales order"
                                  : "Select Sales Order"}
                              disabled={!fabricCodeId || orderTypeId === '1'}
                              onValueChange={(value) => handleSalesOrderChange(index, value)}
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              value={detail.orderQuantity}
                              className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-100"
                              placeholder="Order Qty"
                              readOnly
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              value={detail.plannedQuantity}
                              onChange={(e) => handlePlannedQtyChange(index, e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 w-full"
                              placeholder="Planned Qty"
                            />
                          </td>
                          <td className="border p-2">
                            <Button size="sm" onClick={() => deleteOrderDetail(index)} variant="destructive">
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {orderDetails.length === 0 && (
                      <tr>
                        <td colSpan={6} className="border p-2 text-gray-500">No order details added</td>
                      </tr>
                    )}
                  </tbody>
                  {/* <tfoot className="bg-blue-50 font-semibold">
                    <tr>
                      <td colSpan={3} className="border p-2 text-right">Total Planned Quantity:</td>
                      <td className="border p-2 text-center">
                        <span className={totalOrderDetailsQty === totalWeavingQty ? "text-green-600" : "text-red-600"}>
                          {totalOrderDetailsQty.toFixed(2)}
                        </span>
                      </td>
                      <td className="border p-2 text-left">
                        <span className={totalOrderDetailsQty === totalWeavingQty ? "text-green-600" : "text-red-600"}>
                          {totalOrderDetailsQty === totalWeavingQty ? "✓ Matches Item Details" : `⚠ Must equal ${totalWeavingQty.toFixed(2)}`}
                        </span>
                      </td>
                    </tr>
                  </tfoot> */}
                </table>
                {orderDetailsError && (
                  <div className="text-red-600 text-sm mt-2">{orderDetailsError}</div>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-end mt-4">
              <Button onClick={handleFormSubmit} className="bg-primary hover:bg-primary text-white px-6">{isEditing ? 'Update' : 'Save'}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}