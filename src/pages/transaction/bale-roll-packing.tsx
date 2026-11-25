import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Save, Plus, Trash2, ArrowLeft, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CommonSearchableSelect, { CommonSearchableSelectOption } from '@/components/ui/CommonSearchableSelect';
import { AppDispatch, RootState } from '@/state/store';
import { createBaleRollPacking, updateBaleRollPacking } from '@/state/baleRollPackingSlice';
import { toast } from 'react-toastify';

// masters thunks
import { getAllUomMaster } from '@/state/uomMasterSlice';
import { getAllWarehouse } from '@/state/warehouseSlice';
import { getAllCustomers } from '@/state/customerSlice';
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId, getWeavingJobWorkOrderById } from '@/state/weavingJobWorkOrderSlice';
import { getAllSalesOrders } from '@/state/salesOrderSlice';
import { getAllFabricMasters, getAllFabricMasterDetails } from '@/state/fabricMasterSlice';
import { getAllGrandMaster } from '@/state/gradeMasterSlice';
import { getAllFabricInspection } from '@/state/fabricInspectionsSlice';
import { getAllCompanies } from '@/state/company-master-slice';
import { getFactoryPieceEntriesByCompany } from '@/state/factoryPieceEntrySlice';
import { getAllVendors } from '@/state/vendorSlice';
import { useAuth } from '@/contexts/AuthContext';
import documentNumberService from '@/services/DocumentNumberService';
import { useFilteredWarehouseOptions } from '@/hooks/useFilteredWarehouseOptions';
import { Input } from '@/components/ui/input';

// Conversion helper
const toYards = (meters: number) => Number(((meters || 0) * 1.094).toFixed(3));

// Mock pieces for Add Piece Details dropdown (dummy data)
const MOCK_PIECES: any[] = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  pieceNo: `P${String(i + 1).padStart(3, '0')}`,
  meters: 50 + i * 2,
  netWeight: 10 + i,
  avgWeight: 10 + i,
}));

const resolvePieceGradeId = (entry: any) => entry?.gradeId ?? entry?.grade_id ?? entry?.gradeMasterId ?? entry?.grandMasterId ?? null;
const resolvePieceOrderNumber = (entry: any) => {
  const value = entry?.orderNo ?? entry?.order_no ?? entry?.weavingWorkOrderNo ?? entry?.weaving_work_order_no ?? entry?.contractNo ?? entry?.contract_no ?? '';
  return String(value ?? '').trim();
};
const resolveWeavingOrderNumber = (order: any) => {
  const value = order?.weavingWorkOrderNo ?? order?.jobWorkOrderNo ?? order?.orderNo ?? order?.order_no ?? order?.contractNo ?? order?.contract_no ?? '';
  return String(value ?? '').trim();
};
const resolveIsFactoryFabricFlag = (entry: any) => {
  const value = entry?.isFactoryFabric ?? entry?.is_factory_fabric ?? entry?.factoryFabric ?? entry?.isFactory;
  return value == null ? null : Number(value);
};
const resolveBuyerOptionId = (buyer: any) => {
  const value = buyer?.id ?? buyer?.customerId ?? buyer?.companyId;
  return value == null ? null : value;
};

const extractPackingItems = (packing: any) => {
  const candidates = [
    packing?.items,
    packing?.items?.data,
    packing?.items?.rows,
    packing?.packingItems,
    packing?.packingItems?.data,
    packing?.packingItems?.rows,
    packing?.baleRollPackingItems,
    packing?.baleRollPackingItems?.data,
    packing?.pieceDetails,
    packing?.piece_details,
    packing?.selectedPieces,
    packing?.selectedBales
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const transformEditDataItems = (editData: any): FormPiece[] => {
  if (!editData) return [];
  const rawItems = extractPackingItems(editData);
  return rawItems.map((item: any) => {
    const pieceNo = item.pieceNo || item.piece_no || item.pieceNumber || item.piece_number || '';
    const meters = Number(item.meters ?? item.length ?? 0) || 0;
    const yardsValue = item.yards ?? item.yard ?? null;
    const yards = yardsValue != null && yardsValue !== '' ? Number(yardsValue) || 0 : (meters ? toYards(meters) : 0);
    const netWeight = Number(item.netWeight ?? item.net_weight ?? item.pounds ?? 0) || 0;
    const avgWeightRaw = item.avgWeight ?? item.avg_weight ?? item.avgWt ?? null;
    const avgWeight = avgWeightRaw != null && avgWeightRaw !== '' ? Number(avgWeightRaw) || 0 : (meters ? Number((netWeight / meters).toFixed(3)) : 0);
    const grossWeight = Number(item.grossWeight ?? item.gross_weight ?? 0) || 0;
    return {
      pieceNo,
      meters,
      yards,
      netWeight,
      avgWeight,
      grossWeight,
      fabricCodeId: item.fabricCodeId || item.fabric_code_id || editData.fabricCodeId || editData.fabricId || null
    };
  });
};

interface FormPiece {
  pieceNo: string;
  meters: number;
  yards: number;
  netWeight: number;
  avgWeight: number;
  grossWeight?: number;
  fabricCodeId?: number | string | null;
}

interface FormData {
  id?: number;
  packingDate: string;
  packingType: 'Roll' | 'Bale';
  orderTypeId: string; // 1=Internal, 2=External
  buyerId: string;
  weavingWorkOrderId?: string;
  salesOrderId?: string;
  isJobwork?: number;
  fabricCodeId: string;
  fabricQuality?: string;
  uomId: string;
  warehouseId: string;
  gradeId: string;
  remarks?: string;
  rollOrBaleNo?: string;
  totalPieces?: number;
  totalMeters?: number;
  totalYards?: number;
  totalNet?: number;
  totalAvg?: number;
  totalGross?: number;
  items: FormPiece[];
  isBrushChecked?: number;
  vendorId?: string;
}

interface FormRow {
  id: string;
  pieceNo: string;
  meters: number;
  yards: number;
  netWeight: number;
  avgWeight: number;
  grossWeight: string;
  fabricCodeId?: number | string | null;
}

const createEmptyFormRow = (): FormRow => ({
  id: `row-${Date.now()}-${Math.random()}`,
  pieceNo: '',
  meters: 0,
  yards: 0,
  netWeight: 0,
  avgWeight: 0,
  grossWeight: ''
});

const createDefaultDialogFilters = () => ({ pieceNo: '', fabricCodeId: '', fabricQuality: '', warehouseId: '', gradeId: '', refInvoiceNo: '' });

const ensureOrderArray = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.rows)) return value.rows;
    if (Array.isArray(value.items)) return value.items;
  }
  return [];
};

const ORDER_UOM_GETTERS: Array<(entry: any) => any> = [
  (entry) => entry?.uomId,
  (entry) => entry?.uom?.id,
  (entry) => entry?.uomMasterId,
  (entry) => entry?.uomMaster?.id,
  (entry) => entry?.orderUomId,
  (entry) => entry?.orderUom?.id,
  (entry) => entry?.unitOfMeasurementId,
  (entry) => entry?.unitOfMeasurement?.id,
  (entry) => entry?.defaultUomId,
  (entry) => entry?.packingUomId,
  (entry) => entry?.fabric?.uomId,
  (entry) => entry?.fabric?.uom?.id,
  (entry) => entry?.prodUomId,
  (entry) => entry?.uom_id,
  (entry) => entry?.uom_master_id
];

const resolveOrderUomId = (order: any): string | null => {
  if (!order) return null;
  for (const getter of ORDER_UOM_GETTERS) {
    const candidate = getter(order);
    if (candidate != null && candidate !== '') {
      return String(candidate);
    }
  }
  const itemSources = [
    order?.items,
    order?.orderItems,
    order?.soItems,
    order?.yarnRequirements,
    order?.jobWorkOrderDetails,
    order?.pieces
  ];
  for (const source of itemSources) {
    const entries = ensureOrderArray(source);
    for (const entry of entries) {
      for (const getter of ORDER_UOM_GETTERS) {
        const candidate = getter(entry);
        if (candidate != null && candidate !== '') {
          return String(candidate);
        }
      }
    }
  }
  return null;
};

export default function BaleRollPacking() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.packing;
  const { uomList = [], loading: uomLoading } = useSelector((state: RootState) => state.uom || {});
  const { warehouseList } = useSelector((s: RootState) => s.warehouse);
  const { companyMasterList } = useSelector((s: RootState) => s.companyMaster as any);
  const { customerList } = useSelector((s: RootState) => s.customer as any);
  const { vendorList } = useSelector((s: RootState) => s.vendor || {});
  const { weavingJobWorkOrderList } = useSelector((s: RootState) => s.weavingJobWorkOrder as any);
  const { fabricMasterList, fabricMasterDetailList } = useSelector((s: RootState) => s.fabricMaster as any);
  const { gradeList } = useSelector((s: RootState) => s.grade as any);
  const { fabricInspectionList } = useSelector((s: RootState) => s.fabricInspections as any);
  const { list: pieceEntryList } = useSelector((s: RootState) => s.factoryPieceEntry as any);
  const { salesOrderList } = useSelector((s: RootState) => s.salesOrder as any);
  const [isJobworkChecked, setIsJobworkChecked] = useState(false);



  const { selectedCompany } = useAuth();
  const resolvedCompanyId = useMemo(() => {
    if (selectedCompany != null && !Number.isNaN(Number(selectedCompany))) {
      return Number(selectedCompany);
    }
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = window.localStorage.getItem('selectedCompanyId') || window.localStorage.getItem('selectedCompany');
    if (!stored) {
      return null;
    }
    const parsed = Number(stored);
    return Number.isNaN(parsed) ? null : parsed;
  }, [selectedCompany]);

  const { register, handleSubmit, reset, formState: { isValid, errors }, watch, setValue, trigger, clearErrors } = useForm<FormData>({
    mode: 'all',
    defaultValues: {
      packingDate: new Date().toISOString().slice(0, 10),
      packingType: 'Roll',
      orderTypeId: '',
      items: [],
      isJobwork: 0,
      salesOrderId: '',
      uomId: '',
      rollOrBaleNo: '',
      isBrushChecked: 0,
      vendorId: ''
    }
  });



  const watchId = watch('id');
  const isEdit = !!editData || !!watchId;

  const [items, setItems] = useState<FormPiece[]>(() => transformEditDataItems(editData));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availablePieces, setAvailablePieces] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [grossDraft, setGrossDraft] = useState<Record<string, string>>({});

  // Dialog filters state
  const [dialogFilters, setDialogFilters] = useState(createDefaultDialogFilters());
  const [commonSearch, setCommonSearch] = useState('');
  const [mainSearch, setMainSearch] = useState('');

  const [formRows, setFormRows] = useState<FormRow[]>([
    createEmptyFormRow()
  ]);
  const [dialogPieceList, setDialogPieceList] = useState<any[]>([]);

  // Select/View Pieces Dialog state
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [selectedPiecesCheckbox, setSelectedPiecesCheckbox] = useState<Record<string, boolean>>({});
  const [fetchedWeavingOrder, setFetchedWeavingOrder] = useState<any>(null);
  // const [rollOrBaleNoValue, setRollOrBaleNoValue] = useState('');
  // const [isRollOrBaleNoLoading, setIsRollOrBaleNoLoading] = useState(false);
  const [autoFilledOrderMeta, setAutoFilledOrderMeta] = useState<{ orderId: string; uomId: string } | null>(null);

  const getConstructionByFabricId = useCallback((fabricId: any) => {
    if (!fabricId) return '-';
    const fabricsRaw = (fabricMasterList?.data ?? fabricMasterList) || [];
    const fabricsArr: any[] = Array.isArray(fabricsRaw) ? fabricsRaw : [];
    const fabric = fabricsArr.find((f: any) => String(f.id) === String(fabricId));
    if (!fabric) return '-';
    return fabric.fabricCode || fabric.code || '-';
  }, [fabricMasterList]);

  const dependentResetSnapshotRef = useRef<{
    fabricCodeId: string;
    warehouseId: string;
    gradeId: string;
    orderTypeId: string;
    isJobwork: string;
    salesOrderId: string;
    weavingWorkOrderId: string;
  } | null>(null);
  const skipDependentResetRef = useRef(true);

  const resetPieceDependentState = useCallback(() => {
    setItems([]);
    setSelected({});
    setGrossDraft({});
    setAvailablePieces([]);
    setDialogPieceList([]);
    setFormRows([createEmptyFormRow()]);
    setSelectedPiecesCheckbox({});
    setDialogFilters(createDefaultDialogFilters());
    setCommonSearch('');
    setMainSearch('');
    setIsDialogOpen(false);
    setIsSelectDialogOpen(false);
  }, []);

  // CRITICAL: Ensure items are always synced in edit mode (safety net)
  useEffect(() => {
    if (isEdit && editData && items.length === 0) {
      const transformed = transformEditDataItems(editData);
      if (transformed.length > 0) {
        setItems(transformed);
        setDialogPieceList(transformed);
        const mappedRows = transformed.map((item, idx) => ({
          id: `edit-row-${idx}-${item.pieceNo}`,
          pieceNo: item.pieceNo,
          meters: item.meters,
          yards: item.yards,
          netWeight: item.netWeight,
          avgWeight: item.avgWeight,
          grossWeight: item.grossWeight != null ? String(item.grossWeight) : '',
          fabricCodeId: item.fabricCodeId || null
        }));
        if (mappedRows.length > 0) {
          setFormRows(mappedRows);
        }
      }
    }
  }, [isEdit, editData, items.length]);

  // Load masters on mount
  useEffect(() => {
    dispatch(getAllCustomers({ fetchAll: true }) as any);
    dispatch(getAllFabricMasters({ fetchAll: true }) as any);
    dispatch(getAllVendors({ fetchAll: true } as any));
    dispatch(getAllUomMaster({ fetchAll: true }) as any);
    dispatch(getAllWarehouse({ fetchAll: true }) as any);
    dispatch(getAllGrandMaster({ fetchAll: true }) as any);
    dispatch(getAllFabricInspection({}) as any);
    dispatch(getAllCompanies({ fetchAll: true }) as any);

    if (resolvedCompanyId) {
      dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
        factoryCompanyId: resolvedCompanyId,
      }) as any);
      // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(resolvedCompanyId) as any);
      dispatch(getFactoryPieceEntriesByCompany({ companyId: resolvedCompanyId }) as any);
      dispatch(getAllSalesOrders({ fetchAll: true, companyId: resolvedCompanyId }) as any);
    } else {
      dispatch(getAllWeavingJobWorkOrders({}) as any);
      dispatch(getAllSalesOrders({ fetchAll: true }) as any);
    }
  }, [dispatch, resolvedCompanyId]);

  // Populate edit data
  // Improved edit data population
  useEffect(() => {
    if (isEdit && editData) {
      const jobworkValue = Number(editData.isJobwork ?? 0) === 1;

      const formData = {
        id: editData.id,
        packingDate: editData.packingDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        packingType: editData.packingType,
        orderTypeId: String(editData.orderTypeId ?? editData.orderType ?? ''),
        buyerId: String(editData.buyerId ?? editData.customerId ?? ''),
        weavingWorkOrderId: editData.weavingWorkOrderId ? String(editData.weavingWorkOrderId) : '',
        salesOrderId: editData.salesOrderId ? String(editData.salesOrderId) : '',
        isJobwork: jobworkValue ? 1 : 0,
        fabricCodeId: String(editData.fabricCodeId ?? editData.fabricId ?? ''),
        fabricQuality: String(editData.fabricQuality ?? ''),
        uomId: editData.uomId != null ? String(editData.uomId) : (editData.uom?.id != null ? String(editData.uom.id) : ''),
        warehouseId: String(editData.warehouseId ?? ''),
        gradeId: String(editData.gradeId ?? ''),
        remarks: editData.remarks || '',
        rollOrBaleNo: editData.rollOrBaleNo || '',
        isBrushChecked: 0,
        vendorId: editData.vendorId ? String(editData.vendorId) : ''
      };

      reset(formData);
      setIsJobworkChecked(jobworkValue);

      // Trigger validation in edit mode to enable Update button
      setTimeout(() => trigger(), 100);

      const transformedItems = transformEditDataItems(editData);

      setItems(transformedItems);
      setDialogPieceList(transformedItems);

      const mappedRows: FormRow[] = transformedItems.map((item, idx) => ({
        id: `edit-row-${idx}-${item.pieceNo}`,
        pieceNo: item.pieceNo,
        meters: item.meters,
        yards: item.yards,
        netWeight: item.netWeight,
        avgWeight: item.avgWeight,
        grossWeight: item.grossWeight != null ? String(item.grossWeight) : ''
      }));

      // In edit mode, if we have items, replace the default empty row with mappedRows
      if (mappedRows.length > 0) {
        setFormRows(mappedRows);
      }

      // setRollOrBaleNoValue(formData.rollOrBaleNo || '');
      setValue('rollOrBaleNo', formData.rollOrBaleNo || '');

      dependentResetSnapshotRef.current = {
        fabricCodeId: String(formData.fabricCodeId || ''),
        warehouseId: String(formData.warehouseId || ''),
        gradeId: String(formData.gradeId || ''),
        orderTypeId: String(formData.orderTypeId || ''),
        isJobwork: String(formData.isJobwork || 0),
        salesOrderId: String(formData.salesOrderId || ''),
        weavingWorkOrderId: String(formData.weavingWorkOrderId || '')
      };
      skipDependentResetRef.current = false;
    }
  }, [isEdit, editData, reset, setValue, trigger]);

  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);
  // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      // Only generate for new entries (not editing existing ones)
      if (editData || hasGeneratedNumberRef.current) {
        return;
      }

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Bale/Roll Packing'
        });
        setValue('rollOrBaleNo', result.documentNumber, { shouldValidate: true });
        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate bale/roll packing number:', error);
        toast.error('Failed to generate bale/roll packing number');
      }
    };

    generateDocumentNumber();
  }, [editData, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData) {
        documentNumberService.clearMemoryCache('Bale/Roll Packing');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData) {
        documentNumberService.clearMemoryCache('Bale/Roll Packing');
      }
    };
  }, [editData]);

  useEffect(() => {
    setValue('rollOrBaleNo', editData?.rollOrBaleNo || '');
  }, [editData, setValue]);

  const handleJobworkChange = (checked: boolean) => {
    setIsJobworkChecked(checked);
    setValue('isJobwork', checked ? 1 : 0);

    // Clear the other order field
    if (checked) {
      setValue('salesOrderId', '');
    } else {
      setValue('weavingWorkOrderId', '');
    }

    // Reset buyer and fabric fields
    setValue('buyerId', '');
    setValue('fabricCodeId', '');
    setValue('fabricQuality', '');
  };
  // Watchers
  const orderTypeId = watch('orderTypeId');
  const formFabricCodeId = watch('fabricCodeId');
  const formFabricQualityId = watch('fabricQuality');
  const selectedWeavingWorkOrderId = watch('weavingWorkOrderId');
  const packingWarehouseId = watch('warehouseId');
  const selectedGradeId = watch('gradeId');
  const isJobworkVal = watch('isJobwork');
  const selectedSalesOrderId = watch('salesOrderId');
  const selectedUomId = watch('uomId');
  const formWeaverId = watch('vendorId');

  const packingTypeRegistration = register('packingType', { required: true });
  const { ref: packingTypeRef, onChange: packingTypeOnChange, ...packingTypeRest } = packingTypeRegistration;
  const orderTypeRegistration = register('orderTypeId', { required: true });
  const { ref: orderTypeRef, onChange: orderTypeOnChange, ...orderTypeRest } = orderTypeRegistration;
  const weavingOrderRegistration = register('weavingWorkOrderId');
  const { ref: weavingOrderRef, onChange: weavingOrderOnChange, ...weavingOrderRest } = weavingOrderRegistration;
  const salesOrderRegistration = register('salesOrderId');
  const { ref: salesOrderRef, onChange: salesOrderOnChange, ...salesOrderRest } = salesOrderRegistration;
  const buyerRegistration = register('buyerId');
  const { ref: buyerRef, onChange: buyerOnChange, ...buyerRest } = buyerRegistration;
  const fabricCodeRegistration = register('fabricCodeId', { required: true });
  const { ref: fabricCodeRef, onChange: fabricCodeOnChange, ...fabricCodeRest } = fabricCodeRegistration;
  const uomRegistration = register('uomId', { required: "UOM is required" });
  const { ref: uomRef, onChange: uomOnChange, ...uomRest } = uomRegistration;
  const warehouseRegistration = register('warehouseId', { required: true });
  const { ref: warehouseRef, onChange: warehouseOnChange, ...warehouseRest } = warehouseRegistration;
  const gradeRegistration = register('gradeId', { required: true });
  const { ref: gradeRef, onChange: gradeOnChange, ...gradeRest } = gradeRegistration;

  const weaverRegistration = register('vendorId');
  const { ref: weaverRef, onChange: weaverOnChange, ...weaverRest } = weaverRegistration;

  const isWeaver = (v: any) => {
    if (v.vendorTypeIds && Array.isArray(v.vendorTypeIds)) {
      return v.vendorTypeIds.includes(303) || v.vendorTypeIds.includes("303");
    }
    if (v.vendorTypeId) {
      return String(v.vendorTypeId) === "303" || String(v.vendorTypeId).split(',').map((s: any) => s.trim()).includes("303");
    }
    return false;
  };

  const weaverOptions = useMemo<CommonSearchableSelectOption[]>(() => {
    const list = Array.isArray(vendorList) 
        ? vendorList 
        : (vendorList?.data && Array.isArray(vendorList.data.data)) 
            ? vendorList.data.data 
            : (vendorList?.data && Array.isArray(vendorList.data))
                ? vendorList.data
                : [];
    const filtered = list.filter((v: any) => isWeaver(v));
    return filtered.map((v: any) => ({
        id: v.id,
        value: String(v.id),
        label: v.vendorName,
        activeFlag: v.activeFlag ?? true
    }));
  }, [vendorList]);

  const packingTypeOptions = useMemo<CommonSearchableSelectOption[]>(() => [
    { id: 'Roll', value: 'Roll', label: 'Roll' },
    { id: 'Bale', value: 'Bale', label: 'Bale' }
  ], []);
  const orderTypeOptions = useMemo<CommonSearchableSelectOption[]>(() => [
    { id: '1', value: '1', label: 'Domestic' },
    { id: '2', value: '2', label: 'Export' }
  ], []);

  const syncFormFieldFromDialog = useCallback((field: 'warehouseId' | 'gradeId' | 'fabricCodeId', value: string) => {
    skipDependentResetRef.current = true;
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
    Promise.resolve().then(() => {
      skipDependentResetRef.current = false;
    });
  }, [setValue]);

  useEffect(() => {
    setDialogFilters((prev) => {
      const next = String(packingWarehouseId || '');
      if (prev.warehouseId === next) return prev;
      return { ...prev, warehouseId: next };
    });
  }, [packingWarehouseId]);

  useEffect(() => {
    setDialogFilters((prev) => {
      const next = String(selectedGradeId || '');
      if (prev.gradeId === next) return prev;
      return { ...prev, gradeId: next };
    });
  }, [selectedGradeId]);

  useEffect(() => {
    // Don't reset pieces in edit mode - they're pre-populated
    if (isEdit) {
      return;
    }


    const snapshot = {
      fabricCodeId: String(formFabricCodeId || ''),
      warehouseId: String(packingWarehouseId || ''),
      gradeId: String(selectedGradeId || ''),
      orderTypeId: String(orderTypeId || ''),
      isJobwork: String(isJobworkVal || ''),
      salesOrderId: String(selectedSalesOrderId || ''),
      weavingWorkOrderId: String(selectedWeavingWorkOrderId || '')
    };

    if (skipDependentResetRef.current) {
      dependentResetSnapshotRef.current = snapshot;
      return;
    }

    const prev = dependentResetSnapshotRef.current;
    const hasChanged = prev
      ? prev.fabricCodeId !== snapshot.fabricCodeId ||
      prev.warehouseId !== snapshot.warehouseId ||
      prev.gradeId !== snapshot.gradeId ||
      prev.orderTypeId !== snapshot.orderTypeId ||
      prev.isJobwork !== snapshot.isJobwork ||
      prev.salesOrderId !== snapshot.salesOrderId ||
      prev.weavingWorkOrderId !== snapshot.weavingWorkOrderId
      : false;

    if (hasChanged) {
      resetPieceDependentState();
    }

    dependentResetSnapshotRef.current = snapshot;
  }, [isEdit, formFabricCodeId, packingWarehouseId, selectedGradeId, orderTypeId, isJobworkVal, selectedSalesOrderId, selectedWeavingWorkOrderId, resetPieceDependentState]);

  useEffect(() => {
    if (!isEdit) {
      skipDependentResetRef.current = false;
    }
  }, [isEdit]);

  const normalizedUomList: any[] = useMemo(() => {
    if (Array.isArray(uomList)) return uomList;
    if (Array.isArray((uomList as any)?.data?.data)) return (uomList as any).data.data;
    if (Array.isArray((uomList as any)?.data)) return (uomList as any).data;
    return [];
  }, [uomList]);

  // const uomPrefilledRef = useRef(false);

  // Normalize lists and resolve selected SO
  const companyArr = useMemo(() => {
    const raw = (companyMasterList?.data ?? companyMasterList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [companyMasterList]);
  const customerArr = useMemo(() => {
    const raw = (customerList?.data ?? customerList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [customerList]);
  const buyerOptions = useMemo(() => {
    const map = new Map<string, any>();
    [...companyArr, ...customerArr].forEach((entry: any) => {
      const id = resolveBuyerOptionId(entry);
      if (id == null) return;
      const key = String(id);
      if (!map.has(key)) {
        map.set(key, entry);
      }
    });
    return Array.from(map.values());
  }, [companyArr, customerArr]);
  const warehouseArr = useMemo(() => {
    const raw = (warehouseList?.data ?? warehouseList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [warehouseList]);

  const { filteredWarehouseOptions: warehouseSelectOptions, defaultWarehouseId } = useFilteredWarehouseOptions(warehouseList, "Fabric");

  const gradeArr = useMemo(() => {
    const raw = (gradeList?.data ?? gradeList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [gradeList]);

  const gradeSelectOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    gradeArr
      .map((grade: any) => {
        const id = grade?.id;
        const label = grade?.gradeName || grade?.grade || grade?.name;
        if (id == null || !label) return null;
        return {
          id,
          value: String(id),
          label,
          activeFlag: grade?.activeFlag ?? grade?.isActive ?? 1
        } as CommonSearchableSelectOption;
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [gradeArr]
  );

  const uomSelectOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    normalizedUomList
      .map((item: any) => {
        const id = item?.id;
        const label = item?.uomName || item?.name || 'UOM';
        if (id == null || !label) return null;
        return {
          id,
          value: String(id),
          label,
          activeFlag: item?.activeFlag ?? item?.isActive ?? 1
        } as CommonSearchableSelectOption;
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [normalizedUomList]
  );

  // Ensure warehouseId is applied after warehouse list loads in edit mode
  useEffect(() => {
    if (isEdit && editData?.warehouseId != null) {
      setValue('warehouseId', String(editData.warehouseId));
    }
  }, [isEdit, editData, warehouseArr, setValue]);

  useEffect(() => {
    if (!isEdit && defaultWarehouseId && !packingWarehouseId) {
      setValue('warehouseId', defaultWarehouseId, { shouldValidate: true });
    }
  }, [defaultWarehouseId, isEdit, packingWarehouseId, setValue]);

  useEffect(() => {
    if (!isEdit || !editData) return;
    const resolvedUomId = editData?.uomId ?? editData?.uom?.id;
    if (resolvedUomId == null) return;
    if (normalizedUomList.length === 0) return;
    setValue('uomId', String(resolvedUomId));
  }, [isEdit, editData, normalizedUomList, setValue]);

  // useEffect(() => {
  //   if (!isEdit) return;
  //   if (uomPrefilledRef.current) return;
  //   const resolvedUomId = editData?.uomId ?? editData?.uom?.id;
  //   if (resolvedUomId == null) return;
  //   if (selectedUomId) {
  //     uomPrefilledRef.current = true;
  //     return;
  //   }
  //   setValue('uomId', String(resolvedUomId));
  //   uomPrefilledRef.current = true;
  // }, [isEdit, editData, selectedUomId, setValue]);

  const weavingOrdersArr: any[] = useMemo(() => {
    const raw = (weavingJobWorkOrderList?.data ?? weavingJobWorkOrderList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [weavingJobWorkOrderList]);

  const extendedWeavingOrders = useMemo(() => {
    if (fetchedWeavingOrder && fetchedWeavingOrder.id) {
      const exists = weavingOrdersArr.some((wo: any) => String(wo.id) === String(fetchedWeavingOrder.id));
      if (!exists) {
        return [...weavingOrdersArr, fetchedWeavingOrder];
      }
    }
    return weavingOrdersArr;
  }, [weavingOrdersArr, fetchedWeavingOrder]);

  const selectedWO = useMemo(() => {
    if (!selectedWeavingWorkOrderId) return null;
    return extendedWeavingOrders.find((wo: any) => String(wo.id) === String(selectedWeavingWorkOrderId)) || null;
  }, [extendedWeavingOrders, selectedWeavingWorkOrderId]);

  const jobworkOrderNumber = useMemo(() => {
    if (Number(isJobworkVal) !== 1) return '';
    if (!selectedWO) return '';
    return resolveWeavingOrderNumber(selectedWO);
  }, [isJobworkVal, selectedWO]);

  const salesOrdersArr: any[] = useMemo(() => {
    const raw = (salesOrderList?.data ?? salesOrderList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [salesOrderList]);

  const filteredSalesOrders = useMemo(() => {
    const arr = salesOrdersArr;
    const typeId = Number(orderTypeId || 0);
    if (!typeId) return arr;
    return arr.filter((so: any) => Number(so.orderTypeId) === typeId);
  }, [salesOrdersArr, orderTypeId]);

  const salesOrderOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    filteredSalesOrders
      .map((so: any) => {
        const id = so?.id;
        const label = so?.salesOrderNo || so?.internalOrderNo || `Order ${id}`;
        if (id == null || !label) return null;
        return {
          id,
          value: String(id),
          label
        } as CommonSearchableSelectOption;
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [filteredSalesOrders]
  );



  const selectedSO = useMemo(() => {
    if (!selectedSalesOrderId) return null;
    return salesOrdersArr.find((so: any) => String(so.id) === String(selectedSalesOrderId)) || null;
  }, [salesOrdersArr, selectedSalesOrderId]);

  useEffect(() => {
    if (isEdit) return;

    const isJobworkOrder = Number(isJobworkVal) === 1;
    const currentOrderId = isJobworkOrder ? selectedWeavingWorkOrderId : selectedSalesOrderId;
    if (!currentOrderId) {
      if (autoFilledOrderMeta) {
        setAutoFilledOrderMeta(null);
      }
      return;
    }

    const currentOrder = isJobworkOrder ? selectedWO : selectedSO;
    if (!currentOrder) {
      return;
    }

    const resolvedUomId = resolveOrderUomId(currentOrder);
    if (!resolvedUomId) {
      return;
    }

    const manualOverride =
      autoFilledOrderMeta?.orderId === currentOrderId &&
      selectedUomId &&
      selectedUomId !== autoFilledOrderMeta.uomId;

    if (manualOverride) {
      return;
    }

    const shouldApply =
      !autoFilledOrderMeta ||
      autoFilledOrderMeta.orderId !== currentOrderId ||
      autoFilledOrderMeta.uomId !== resolvedUomId ||
      selectedUomId === '';

    if (!shouldApply) {
      return;
    }

    setValue('uomId', resolvedUomId, { shouldDirty: true, shouldValidate: true });
    setAutoFilledOrderMeta({ orderId: currentOrderId, uomId: resolvedUomId });
  }, [
    isEdit,
    isJobworkVal,
    selectedSalesOrderId,
    selectedWeavingWorkOrderId,
    selectedSO,
    selectedWO,
    selectedUomId,
    autoFilledOrderMeta,
    setValue
  ]);

  const normalizedPieceEntries = useMemo(() => {
    if (Array.isArray(pieceEntryList)) return pieceEntryList;
    if (Array.isArray((pieceEntryList as any)?.data?.data)) return (pieceEntryList as any).data.data;
    if (Array.isArray((pieceEntryList as any)?.data)) return (pieceEntryList as any).data;
    if (Array.isArray((pieceEntryList as any)?.rows)) return (pieceEntryList as any).rows;
    return [];
  }, [pieceEntryList]);

  const shouldUseFactoryPieces = useMemo(() => Number(isJobworkVal) === 1 || Boolean(selectedWeavingWorkOrderId), [isJobworkVal, selectedWeavingWorkOrderId]);

  const buildPieceCandidates = useCallback((overrides?: { fabricId?: number; fabricQuality?: string; warehouseId?: string; gradeId?: string }) => {
    const resolvedFabricId = overrides?.fabricId ?? (Number(formFabricCodeId) || 0);
    const resolvedFabricQuality = overrides?.fabricQuality ?? String(formFabricQualityId || '');
    const resolvedWarehouseId = overrides?.warehouseId ?? String(packingWarehouseId || '');
    const gradeFilterId = overrides?.gradeId ?? String(selectedGradeId || '');
    const isJobworkSelected = Number(isJobworkVal) === 1;


    if (!resolvedFabricId || !resolvedWarehouseId || !gradeFilterId) {
      return [];
    }

    if (isJobworkSelected && !jobworkOrderNumber) {
      return [];
    }

    const desiredFactoryFlag = shouldUseFactoryPieces ? 1 : 0;

    return normalizedPieceEntries
      .filter((entry: any) => Number(entry.isInspected ?? entry.is_inspected ?? 0) === 1)
      .filter((entry: any) => Number(entry.isPacked ?? entry.is_packed ?? 0) === 0)
      .filter((entry: any) => Number(entry.isDispatched ?? entry.is_dispatched ?? 0) === 0)
      .filter((entry: any) => Number(entry.operationId ?? entry.operation_id ?? 0) === 0)
      .filter((entry: any) => Number(entry.fabricMasterId ?? entry.fabricId ?? entry.fabricCodeId) === resolvedFabricId)
      .filter((entry: any) => (resolvedWarehouseId ? String(entry.warehouseId ?? '') === resolvedWarehouseId : true))
      .filter((entry: any) => {
        const entryGrade = resolvePieceGradeId(entry);
        return entryGrade != null && String(entryGrade) === gradeFilterId;
      })
      .filter((entry: any) => {
        const entryFactoryFlag = resolveIsFactoryFabricFlag(entry);
        // If Internal (isJobwork 0), allow both factory produced pieces (1) and regular pieces (0)
        if (!isJobworkSelected) {
          return entryFactoryFlag === 0 || entryFactoryFlag === 1;
        }
        // If Jobwork, maintain strict filtering for factory pieces
        return entryFactoryFlag === desiredFactoryFlag;
      })
      .filter((entry: any) => {
        if (!isJobworkSelected) return true;
        const entryOrder = resolvePieceOrderNumber(entry);
        if (!entryOrder) return false;
        return jobworkOrderNumber ? entryOrder.toLowerCase() === jobworkOrderNumber.toLowerCase() : false;
      })
      .map((entry: any) => {
        const meters = Number(entry.inspectedMtr ?? entry.pieceMeter ?? 0);
        const netWeight = Number(entry.inspectedNtWt ?? entry.netWeight ?? 0);
        const avgWeight = entry.inspectedAvgWt != null ? Number(entry.inspectedAvgWt) : meters ? Number((netWeight / meters).toFixed(6)) : 0;
        return {
          id: entry.id,
          pieceNo: String(entry.pieceNumber || entry.pieceNumberComputed || entry.pieceNo),
          meters,
          netWeight,
          avgWeight,
          fabricCodeId: resolvedFabricId,
          fabricQuality: resolvedFabricQuality,
          warehouseId: entry.warehouseId ?? '',
          gradeId: resolvePieceGradeId(entry),
        };
      });
  }, [normalizedPieceEntries, formFabricCodeId, formFabricQualityId, packingWarehouseId, selectedGradeId, shouldUseFactoryPieces, isJobworkVal, jobworkOrderNumber, formWeaverId]);

  // const shouldUseFactoryPieces = useMemo(() => Number(isJobworkVal) === 1 || Boolean(selectedWeavingWorkOrderId), [isJobworkVal, selectedWeavingWorkOrderId]);

  // const buildPieceCandidates = useCallback((overrides?: { fabricId?: number; fabricQuality?: string; warehouseId?: string }) => {
  //   const resolvedFabricId = overrides?.fabricId ?? (Number(formFabricCodeId) || 0);
  //   const resolvedFabricQuality = overrides?.fabricQuality ?? String(formFabricQualityId || '');
  //   const resolvedWarehouseId = overrides?.warehouseId ?? String(packingWarehouseId || '');
  //   const gradeFilterId = String(selectedGradeId || '');
  //   const isJobworkSelected = Number(isJobworkVal) === 1;
  //   if (!resolvedFabricId || !resolvedWarehouseId || !gradeFilterId) {
  //     return [];
  //   }
  //   if (isJobworkSelected && !jobworkOrderNumber) {
  //     return [];
  //   }
  //   const desiredFactoryFlag = shouldUseFactoryPieces ? 1 : 0;
  //   return normalizedPieceEntries
  //     .filter((entry: any) => Number(entry.isInspected ?? entry.is_inspected ?? 0) === 1)
  //     .filter((entry: any) => Number(entry.isPacked ?? entry.is_packed ?? 0) === 0)
  //     .filter((entry: any) => Number(entry.isDispatched ?? entry.is_dispatched ?? 0) === 0)
  //     .filter((entry: any) => Number(entry.operationId ?? entry.operation_id ?? 0) === 0)
  //     .filter((entry: any) => Number(entry.fabricMasterId ?? entry.fabricId ?? entry.fabricCodeId) === resolvedFabricId)
  //     .filter((entry: any) => (resolvedWarehouseId ? String(entry.warehouseId ?? '') === resolvedWarehouseId : true))
  //     .filter((entry: any) => {
  //       const entryGrade = resolvePieceGradeId(entry);
  //       return entryGrade != null && String(entryGrade) === gradeFilterId;
  //     })
  //     .filter((entry: any) => resolveIsFactoryFabricFlag(entry) === desiredFactoryFlag)
  //     .filter((entry: any) => {
  //       if (!isJobworkSelected) return true;
  //       const entryOrder = resolvePieceOrderNumber(entry);
  //       if (!entryOrder) return false;
  //       return jobworkOrderNumber ? entryOrder.toLowerCase() === jobworkOrderNumber.toLowerCase() : false;
  //     })
  //     .map((entry: any) => {
  //       const meters = Number(entry.inspectedMtr ?? entry.pieceMeter ?? 0);
  //       const netWeight = Number(entry.inspectedNtWt ?? entry.netWeight ?? 0);
  //       const avgWeight = entry.inspectedAvgWt != null ? Number(entry.inspectedAvgWt) : meters ? Number((netWeight / meters).toFixed(6)) : 0;
  //       return {
  //         id: entry.id,
  //         pieceNo: String(entry.pieceNumber || entry.pieceNumberComputed || entry.pieceNo),
  //         meters,
  //         netWeight,
  //         avgWeight,
  //         fabricCodeId: resolvedFabricId,
  //         fabricQuality: resolvedFabricQuality,
  //         warehouseId: entry.warehouseId ?? '',
  //         gradeId: resolvePieceGradeId(entry),
  //       };
  //     });
  // }, [normalizedPieceEntries, formFabricCodeId, formFabricQualityId, packingWarehouseId, selectedGradeId, shouldUseFactoryPieces, isJobworkVal, jobworkOrderNumber]);

  useEffect(() => {
    if (!isEdit || !editData?.weavingWorkOrderId || Number(editData?.isJobwork ?? editData?.isJobWork ?? 0) !== 1) {
      setFetchedWeavingOrder(null);
      return;
    }
    const exists = weavingOrdersArr.some((wo: any) => String(wo.id) === String(editData.weavingWorkOrderId));
    if (exists) {
      setFetchedWeavingOrder(null);
      return;
    }
    if (fetchedWeavingOrder && String(fetchedWeavingOrder.id) === String(editData.weavingWorkOrderId)) {
      return;
    }
    const id = Number(editData.weavingWorkOrderId);
    if (!id) return;

    console.log("Fetching missing weaving order for edit mode:", id);
    dispatch(getWeavingJobWorkOrderById(id) as any)
      .unwrap()
      .then((res: any) => {
        if (res) {
          console.log("Fetched weaving order:", res);
          setFetchedWeavingOrder(res);
        }
      })
      .catch((err: any) => {
        console.error("Failed to fetch weaving order:", err);
      });
  }, [isEdit, editData, weavingOrdersArr, dispatch, fetchedWeavingOrder]);

  // Ensure form value is set after weaving order is fetched or becomes available
  useEffect(() => {
    if (!isEdit || !editData?.weavingWorkOrderId) return;

    const woId = String(editData.weavingWorkOrderId);
    const currentFormValue = watch('weavingWorkOrderId');

    // Check if the weaving order is now available in the extended list
    const isAvailable = extendedWeavingOrders.some((wo: any) => String(wo.id) === woId);

    if (isAvailable && currentFormValue !== woId) {
      console.log("Setting weavingWorkOrderId to:", woId);
      setValue('weavingWorkOrderId', woId);
    }
  }, [isEdit, editData, extendedWeavingOrders, setValue, watch]);

  // Ensure salesOrderId is set for non-jobwork packings
  useEffect(() => {
    if (!isEdit || !editData?.salesOrderId || Number(editData?.isJobwork ?? 0) === 1) return;

    const soId = String(editData.salesOrderId);
    const currentFormValue = watch('salesOrderId');

    // Check if the sales order is available in the list
    const isAvailable = salesOrdersArr.some((so: any) => String(so.id) === soId);

    if (isAvailable && currentFormValue !== soId) {
      console.log("Setting salesOrderId to:", soId);
      setValue('salesOrderId', soId);
    }
  }, [isEdit, editData, salesOrdersArr, setValue, watch]);

  const filteredBuyers = useMemo(() => {
    const jobworkOrder = Number(isJobworkVal) === 1;
    const currentOrder = jobworkOrder ? selectedWO : selectedSO;
    const orderTypeId = Number(currentOrder?.orderTypeId ?? currentOrder?.orderType ?? 0);
    const jobworkOrderIsExternal = jobworkOrder && orderTypeId === 2;
    const sourceOptions = jobworkOrder
      ? jobworkOrderIsExternal
        ? customerArr
        : companyArr
      : customerArr;
    if (!currentOrder) {
      return sourceOptions.length ? sourceOptions : buyerOptions;
    }
    const targetId = jobworkOrder
      ? jobworkOrderIsExternal
        ? currentOrder.buyerId
        : currentOrder.tradingCompanyId ?? currentOrder.buyerId
      : currentOrder.buyerCustomerId ?? currentOrder.customerId ?? currentOrder.buyerId;
    if (targetId == null) {
      return sourceOptions.length ? sourceOptions : buyerOptions;
    }
    const candidateKey = String(targetId);
    const matched = sourceOptions.filter((entry: any) => String(resolveBuyerOptionId(entry)) === candidateKey);
    if (matched.length > 0) {
      return matched;
    }
    const fallback = buyerOptions.filter((entry: any) => String(resolveBuyerOptionId(entry)) === candidateKey);
    return fallback.length > 0 ? fallback : sourceOptions.length ? sourceOptions : buyerOptions;
  }, [buyerOptions, companyArr, customerArr, selectedWO, selectedSO, isJobworkVal]);

  const buyerSelectOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    filteredBuyers
      .map((entry: any) => {
        const id = resolveBuyerOptionId(entry);
        const label = entry?.customerName || entry?.companyName || entry?.name || 'Buyer';
        if (id == null || !label) return null;
        return {
          id,
          value: String(id),
          label,
          activeFlag: entry.activeFlag ?? entry.isActive ?? 0
        } as CommonSearchableSelectOption;
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [filteredBuyers]
  );

  const filteredFabricCodes = useMemo(() => {
    const fabricsRaw = (fabricMasterList?.data ?? fabricMasterList) || [];
    const fabricsArr: any[] = Array.isArray(fabricsRaw) ? fabricsRaw : [];
    return fabricsArr;
  }, [fabricMasterList]);

  const fabricTareWeight = useMemo(() => {
    if (!formFabricCodeId) return 0;
    const fabric = filteredFabricCodes.find((f: any) => String(f.id) === String(formFabricCodeId));
    if (!fabric) return 0;
    return Number(fabric.paperTuberTareWeight ?? 0) + Number(fabric.hdpeWeight ?? 0);
  }, [formFabricCodeId, filteredFabricCodes]);

  const fabricCodeOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    filteredFabricCodes
      .map((fabric: any) => {
        const id = fabric?.id;
        const code = fabric?.fabricCode || fabric?.fabricName || fabric?.code || fabric?.name;
        if (id == null || !code) return null;
        const quality = fabric?.fabricQuality || fabric?.quality || '';
        return {
          id,
          value: String(id),
          label: quality ? `${code} — ${quality}` : code
        } as CommonSearchableSelectOption;
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [filteredFabricCodes]
  );

  useEffect(() => {
    const jobworkOrder = Number(isJobworkVal) === 1;
    if (jobworkOrder && selectedWO) {
      const resolvedBuyerId = selectedWO.tradingCompanyId ?? selectedWO.buyerId;
      if (resolvedBuyerId != null) {
        setValue('buyerId', String(resolvedBuyerId));
      }
      return;
    }
    if (!jobworkOrder && selectedSO) {
      const resolvedBuyerId = selectedSO.buyerCustomerId ?? selectedSO.customerId ?? selectedSO.buyerId;
      if (resolvedBuyerId != null) {
        setValue('buyerId', String(resolvedBuyerId));
      }
    }
  }, [selectedWO, selectedSO, setValue, isJobworkVal]);

  useEffect(() => {
    if (!selectedWO && !selectedSO) return;

    if (isEdit && editData?.fabricCodeId != null) return;

    const order = selectedWO || selectedSO;
    const itemsRaw = (order.items?.data ?? order.items) || [];
    const items: any[] = Array.isArray(itemsRaw) ? itemsRaw : [];

    if (items.length > 0) {
      const firstItem = items[0];
      const fabricIdCandidate = firstItem.fabricMasterId ?? firstItem.fabricId ?? firstItem.fabricCodeId ?? null;
      if (fabricIdCandidate != null) {
        setValue('fabricCodeId', String(fabricIdCandidate));
      }
    }
  }, [selectedWO, selectedSO, setValue, isEdit, editData]);

  // When Fabric Code changes, fetch its qualities and clear quality field
  useEffect(() => {
    if (formFabricCodeId) {
      dispatch(getAllFabricMasterDetails({ id: Number(formFabricCodeId) }) as any);
      if (!skipDependentResetRef.current) {
        setValue('fabricQuality', '');
      }
    }
  }, [dispatch, formFabricCodeId, setValue]);

  // Recalculate grossWeight for all existing items when fabric code changes (user-driven)
  useEffect(() => {
    if (skipDependentResetRef.current) return;
    if (items.length === 0) return;
    if (!formFabricCodeId) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        grossWeight: Number((Number(item.netWeight || 0) + fabricTareWeight).toFixed(3)),
      }))
    );
  }, [formFabricCodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prebuild pieces for Add Piece Details when main Fabric Code/Quality changes
  // useEffect(() => {
  //   const basePieces = buildPieceCandidates();
  //   const currentQualityId = String(formFabricQualityId || '');
  //   const selectedWarehouseId = String(packingWarehouseId || '');

  //   let merged = [...basePieces];

  //   if (isEdit && editData?.items) {
  //     const editItemsMapped = (editData.items || []).map((item: any) => ({
  //       id: item.id || `edit-${item.pieceNo}`,
  //       pieceNo: item.pieceNo,
  //       meters: Number(item.meters || 0),
  //       yards: Number(item.yards || 0),
  //       netWeight: Number(item.netWeight || 0),
  //       avgWeight: Number(item.avgWeight || 0),
  //       fabricCodeId: Number(formFabricCodeId) || 0,
  //       fabricQuality: currentQualityId,
  //       warehouseId: selectedWarehouseId,
  //       gradeId: String(editData.gradeId || ''),
  //     }));

  //     const seen = new Set(merged.map((p: any) => p.pieceNo));

  //     editItemsMapped.forEach((p: any) => {
  //       if (!seen.has(p.pieceNo)) {
  //         merged.push(p);
  //         seen.add(p.pieceNo);
  //       }
  //     });
  //   }

  //   setAvailablePieces(merged);
  //   setDialogPieceList(merged);
  // }, [buildPieceCandidates, isEdit, editData, formFabricCodeId, formFabricQualityId, packingWarehouseId]);
// Prebuild pieces for Add Piece Details when main Fabric Code/Quality changes
useEffect(() => {
  const basePieces = buildPieceCandidates();
  const currentQualityId = String(formFabricQualityId || '');
  const selectedWarehouseId = String(packingWarehouseId || '');

  let merged = [...basePieces];


  if (isEdit && editData?.items) {
    const editItemsMapped = (editData.items || []).map((item: any) => ({
      id: item.id || `edit-${item.pieceNo}`,
      pieceNo: item.pieceNo,
      meters: Number(item.meters || 0),
      yards: Number(item.yards || 0),
      netWeight: Number(item.netWeight || 0),
      avgWeight: Number(item.avgWeight || 0),
      fabricCodeId: Number(formFabricCodeId) || 0,
      fabricQuality: currentQualityId,
      warehouseId: selectedWarehouseId,
      gradeId: String(editData.gradeId || ''),
    }));

    const seen = new Set(merged.map((p: any) => p.pieceNo));

    editItemsMapped.forEach((p: any) => {
      if (!seen.has(p.pieceNo)) {
        merged.push(p);
        seen.add(p.pieceNo);
      }
    });
  }

  setAvailablePieces(merged);
  setDialogPieceList(merged);
}, [buildPieceCandidates, isEdit, editData, formFabricCodeId, formFabricQualityId, packingWarehouseId]);

  const filteredWeavingOrders = useMemo(() => {
    return extendedWeavingOrders.filter((wo: any) => Number(wo.orderTypeId) === 2);
  }, [extendedWeavingOrders]);

  const weavingOrderOptions = useMemo<CommonSearchableSelectOption[]>(() => {
    return filteredWeavingOrders
      .map((wo: any) => {
        const id = wo?.id;
        const label = resolveWeavingOrderNumber(wo) || `Order ${id}`;
        if (id == null || !label) return null;
        return {
          id,
          value: String(id),
          label
        } as CommonSearchableSelectOption;
      })
      .filter(Boolean) as CommonSearchableSelectOption[];
  }, [filteredWeavingOrders]);

  // Ensure proper toggling between jobwork and sales order
  useEffect(() => {
    if (!orderTypeId) {
      setValue('isJobwork', 0);
      setValue('weavingWorkOrderId', '');
      setValue('salesOrderId', '');
      return;
    }
    if (String(orderTypeId) === '2') {
      setValue('isJobwork', 0);
      setValue('weavingWorkOrderId', '');
    }
  }, [orderTypeId, setValue]);

  useEffect(() => {
    if (Number(isJobworkVal) === 1) {
      setValue('salesOrderId', '');
    } else {
      setValue('weavingWorkOrderId', '');
    }
  }, [isJobworkVal, setValue]);

  // Auto-set Grade based on Fabric Code/Quality matching inspection's grade (if available)
  useEffect(() => {
    // Don't auto-fetch grade during edit mode initialization - preserve the saved gradeId
    if (isEdit && skipDependentResetRef.current) {
      return;
    }

    const currentFabricId = Number(formFabricCodeId) || 0;
    if (!currentFabricId) return;

    const inspectionsRaw = (fabricInspectionList?.data ?? fabricInspectionList) || [];
    const inspectionsArr: any[] = Array.isArray(inspectionsRaw) ? inspectionsRaw : [];
    const fabricsArr: any[] = ((fabricMasterList?.data ?? fabricMasterList) || []);
    const selectedFabric = fabricsArr.find((f: any) => String(f.id) === String(currentFabricId));
    const selectedFabricCodeStr = selectedFabric?.fabricCode || selectedFabric?.code || selectedFabric?.name || '';

    const filteredIns = inspectionsArr.filter((ins: any) => {
      const codeMatches = selectedFabricCodeStr ? String(ins.fabricCode) === String(selectedFabricCodeStr) : true;
      return codeMatches;
    });

    if (!filteredIns.length) return;
    const det = Array.isArray(filteredIns[0]?.inspectionDetails) && filteredIns[0].inspectionDetails.length > 0 ? filteredIns[0].inspectionDetails[0] : null;
    const gradeLabel = det?.grade;
    if (!gradeLabel) return;

    const allGrades: any[] = ((gradeList?.data ?? gradeList) || []);
    const found = allGrades.find((g: any) => [g.gradeName, g.grade, g.name].some((n: any) => n && String(n).toLowerCase() === String(gradeLabel).toLowerCase()));
    if (found?.id) setValue('gradeId', String(found.id));
  }, [formFabricCodeId, formFabricQualityId, fabricInspectionList, fabricMasterList, gradeList, setValue]);

  const isSaveDisabled = !isValid || items.length === 0;

  // Piece dialog behavior (now using API data from fabric inspections slice)
  // const openPieceDialog = async () => {
  //   if (resolvedCompanyId) {
  //     try {
  //       await dispatch(getFactoryPieceEntriesByCompany({ companyId: resolvedCompanyId }) as any).unwrap();
  //       await dispatch(getAllBrushingReceivesByCompany(resolvedCompanyId) as any).unwrap();
  //     } catch (error) {
  //       console.error('Failed to fetch piece entries:', error);
  //     }
  //   }

  //   const currentFabricId = Number(formFabricCodeId) || 0;
  //   const currentQualityId = String(formFabricQualityId || '');
  //   const selectedWarehouseId = String(packingWarehouseId || '');
  //   const currentGradeId = String(selectedGradeId || '');

  //   // const refreshedPieces = buildPieceCandidates();
  //   // setAvailablePieces(refreshedPieces);
  //   // setDialogPieceList(refreshedPieces);
  //   // Line 884-898: Replace with:
  //   const refreshedPieces = buildPieceCandidates();
  //   setAvailablePieces(refreshedPieces);
  //   setDialogPieceList(refreshedPieces);
  //   if (!isEdit || items.length === 0) {
  //     setFormRows([createEmptyFormRow()]);
  //   }

  //   setDialogFilters((prev) => ({
  //     ...prev,
  //     fabricCodeId: String(currentFabricId || ''),
  //     fabricQuality: currentQualityId,
  //     warehouseId: selectedWarehouseId,
  //     gradeId: currentGradeId,
  //   }));

  //   // Reset any previous selections and gross weight drafts when opening the dialog
  //   setSelected({});
  //   setGrossDraft({});

  //   setIsDialogOpen(true);
  // };
  const openPieceDialog = async () => {
  if (resolvedCompanyId) {
    try {
      await dispatch(getFactoryPieceEntriesByCompany({ companyId: resolvedCompanyId }) as any).unwrap();
    } catch (error) {
      console.error('Failed to fetch piece entries:', error);
    }
  }

  const currentFabricId = Number(formFabricCodeId) || 0;
  const currentQualityId = String(formFabricQualityId || '');
  const selectedWarehouseId = String(packingWarehouseId || '');
  const currentGradeId = String(selectedGradeId || '');

  const refreshedPieces = buildPieceCandidates();
  
  setAvailablePieces(refreshedPieces);
  setDialogPieceList(refreshedPieces);
  
  if (!isEdit || items.length === 0) {
    setFormRows([createEmptyFormRow()]);
  }

  setDialogFilters((prev) => ({
    ...prev,
    fabricCodeId: String(currentFabricId || ''),
    fabricQuality: currentQualityId,
    warehouseId: selectedWarehouseId,
    gradeId: currentGradeId,
    refInvoiceNo: '',
  }));

  // Reset any previous selections and gross weight drafts when opening the dialog
  setSelected({});
  setGrossDraft({});
  setCommonSearch('');

  setIsDialogOpen(true);
};

  useEffect(() => {
    if (!isDialogOpen) return;
    const selectedId = Number(dialogFilters.fabricCodeId || formFabricCodeId || 0);
    if (!selectedId) return;
    const effectiveWarehouse = dialogFilters.warehouseId || String(packingWarehouseId || '');
    const effectiveQuality = dialogFilters.fabricQuality || String(formFabricQualityId || '');
    const pieces = buildPieceCandidates({
      fabricId: selectedId,
      fabricQuality: effectiveQuality,
      warehouseId: effectiveWarehouse,
      gradeId: dialogFilters.gradeId || String(selectedGradeId || ''),
    });
    setAvailablePieces(pieces);
    setDialogPieceList(pieces);
  }, [isDialogOpen, dialogFilters, buildPieceCandidates, formFabricCodeId, formFabricQualityId, packingWarehouseId, isEdit, items.length, formWeaverId]);

  // Add a new empty row to the form
  const addFormRow = () => {
    setFormRows((prev) => [...prev, createEmptyFormRow()]);
  };

  // Remove a row by id
  const removeFormRow = (id: string) => {
    setFormRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Handle piece selection - fetch details from dialogPieceList and auto-populate
  const handlePieceSelect = (rowId: string, selectedPieceNo: string) => {
    let piece: any = (dialogPieceList || []).find((p: any) => p.pieceNo === selectedPieceNo);

    if (!piece) return;

    const netWt = Number(piece.netWeight || 0);
    const autoGross = (piece.grossWeight != null && piece.grossWeight > 0
        ? piece.grossWeight
        : Number((netWt + fabricTareWeight).toFixed(3)));

    // Resolve the fabricCodeId to store in the row
    const rowFabricCodeId = (piece.fabricCodeId ?? null);

    // Update the specific row with the selected piece details
    setFormRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              pieceNo: piece.pieceNo,
              meters: Number(piece.meters || 0),
              yards: toYards(Number(piece.meters || 0)),
              netWeight: netWt,
              avgWeight: Number(piece.avgWeight || 0),
              grossWeight: String(autoGross),
              fabricCodeId: rowFabricCodeId
            }
          : row
      )
    );
  };

  // Update grossWeight (with 3dp validation)
  const updateGrossWeight = (rowId: string, value: string) => {
    if (!/^\d*(?:\.\d{0,3})?$/.test(value)) return;
    setFormRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, grossWeight: value } : r
      )
    );
  };

  // Confirm and add all form rows to items
  const confirmFormAddPieces = () => {
    if (formRows.length === 0 || formRows.every((r) => !r.pieceNo)) {
      toast.warning('Please add at least one piece');
      return;
    }

    // Filter out empty rows and prevent duplicates
    const validRows = formRows.filter((r) => r.pieceNo);
    const existing = new Set(items.map((x) => x.pieceNo));
    const newPieces: FormPiece[] = validRows
      .filter((r) => !existing.has(r.pieceNo))
      .map((r) => ({
        pieceNo: r.pieceNo,
        meters: r.meters,
        yards: r.yards,
        netWeight: r.netWeight,
        avgWeight: r.avgWeight,
        grossWeight: Number(r.grossWeight || '0'),
        fabricCodeId: r.fabricCodeId || null
      }));

    if (newPieces.length === 0) {
      toast.warning('No new pieces to add (all already exist)');
      return;
    }

    setItems((prev) => [...prev, ...newPieces]);
    setIsDialogOpen(false);
    setFormRows([]);
    setDialogPieceList([]);
    toast.success(`Added ${newPieces.length} piece(s)`);
  };

  const toggleSelect = (piece: any) => {
    setSelected((prev) => ({ ...prev, [piece.pieceNo]: !prev[piece.pieceNo] }));
    setGrossDraft((prev) => {
      if (prev[piece.pieceNo] !== undefined) return prev;
      const netWt = Number(piece.netWeight || 0);
      const autoGross = (piece.grossWeight != null && piece.grossWeight > 0 
            ? piece.grossWeight.toFixed(3) 
            : (netWt + fabricTareWeight).toFixed(3));
      return { ...prev, [piece.pieceNo]: autoGross };
    });
  };

const confirmAddPieces = () => {
  // Gather selected piece numbers from the dialog
  const selectedPieceNos = Object.keys(selected).filter((k) => selected[k]);
  if (selectedPieceNos.length === 0) {
    toast.warning('Please select at least one piece');
    setIsDialogOpen(false);
    return;
  }

  let piecesToAdd: any[] = (availablePieces || []).filter((p) => selected[p.pieceNo]);

  if (piecesToAdd.length === 0) {
    toast.warning('Selected pieces not found in available list');
    return;
  }

  // Prevent duplicates
  const existing = new Set(items.map((x) => x.pieceNo));
  const newPieces = piecesToAdd.filter((p) => !existing.has(p.pieceNo));

  const merged: FormPiece[] = [
    ...items,
    ...newPieces.map((p) => {
      const netWt = Number(p.netWeight || 0);
      const autoGross = (p.grossWeight != null && p.grossWeight > 0
          ? p.grossWeight
          : Number((netWt + fabricTareWeight).toFixed(3)));
      const draftVal = grossDraft[p.pieceNo];
      const resolvedFabricCodeId = (p.fabricCodeId ?? null);
      return {
        pieceNo: p.pieceNo,
        meters: Number(p.meters || 0),
        yards: toYards(Number(p.meters || 0)),
        netWeight: netWt,
        avgWeight: Number(p.avgWeight || 0),
        grossWeight: draftVal !== undefined ? Number(draftVal) : autoGross,
        fabricCodeId: resolvedFabricCodeId
      };
    })
  ];

  // Guard against dependent-reset effect firing during the subsequent auto-fill setValue calls
  skipDependentResetRef.current = true;

  setItems(merged);
  setIsDialogOpen(false);
  setSelected({});
  setGrossDraft({});

  // Release the guard after microtask queue flushes
  Promise.resolve().then(() => { skipDependentResetRef.current = false; });

  toast.success(`Added ${newPieces.length} piece(s)`);
};

  const handleRefreshPieces = useCallback(() => {
    if (resolvedCompanyId) {
      dispatch(getFactoryPieceEntriesByCompany({ companyId: resolvedCompanyId }) as any);

      dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
        factoryCompanyId: resolvedCompanyId,
      }) as any);
      dispatch(getAllSalesOrders({ fetchAll: true, companyId: resolvedCompanyId }) as any);
      // toast.info('Refreshing piece entries...');
    }
  }, [dispatch, resolvedCompanyId]);

  const removePiece = (pieceNo: string) => setItems((prev) => prev.filter((x) => x.pieceNo !== pieceNo));

  // Open Select/View Pieces Dialog
  const openSelectPiecesDialog = () => {
    // Initialize checkboxes - all pieces checked by default
    const initialChecked: Record<string, boolean> = {};
    items.forEach((item) => {
      initialChecked[item.pieceNo] = true;
    });
    setSelectedPiecesCheckbox(initialChecked);
    setIsSelectDialogOpen(true);
  };

  // Toggle checkbox in Select Pieces dialog
  const toggleSelectPiece = (pieceNo: string) => {
    setSelectedPiecesCheckbox((prev) => ({
      ...prev,
      [pieceNo]: !prev[pieceNo],
    }));
  };

  // Delete selected pieces from Select Pieces dialog
  const deleteSelectedPieces = () => {
    const toDelete = Object.keys(selectedPiecesCheckbox).filter((k) => selectedPiecesCheckbox[k]);
    if (toDelete.length === 0) {
      toast.warning('Please select at least one piece to delete');
      return;
    }
    setItems((prev) => prev.filter((item) => !toDelete.includes(item.pieceNo)));
    setSelectedPiecesCheckbox({});
    toast.success(`Deleted ${toDelete.length} piece(s)`);
    setIsSelectDialogOpen(false);
  };

  // Select all pieces in the dialog
  const selectAllPieces = () => {
    const allChecked: Record<string, boolean> = {};
    items.forEach((item) => {
      allChecked[item.pieceNo] = true;
    });
    setSelectedPiecesCheckbox(allChecked);
  };

  // Deselect all pieces in the dialog
  const deselectAllPieces = () => {
    setSelectedPiecesCheckbox({});
  };

  const totals = useMemo(() => {
    const totalPieces = items.length;
    const totalMeters = items.reduce((a, x) => a + (Number(x.meters) || 0), 0);
    const totalYards = items.reduce((a, x) => a + (Number(x.yards) || 0), 0);
    const totalNet = items.reduce((a, x) => a + (Number(x.netWeight) || 0), 0);
    const totalAvg = items.length ? items.reduce((a, x) => a + (Number(x.avgWeight) || 0), 0) / items.length : 0;
    const totalGross = items.reduce((a, x) => a + (Number(x.grossWeight) || 0), 0);
    return { totalPieces, totalMeters, totalYards, totalNet, totalAvg, totalGross };
  }, [items]);

  const onSubmit = async (data: FormData, stayOnPage: boolean = false) => {
    if (items.length === 0) {
      toast.error('Please select at least one piece');
      return;
    }


    const isEditMode = Boolean(editData?.id);
    let rollOrBaleNo = data.rollOrBaleNo || editData?.rollOrBaleNo || "";
    if (!editData?.id && !rollOrBaleNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Bale/Roll Packing"
        });
        rollOrBaleNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    isSavingRef.current = true;

    const payload = {
      id: data.id || 0,
      companyId: resolvedCompanyId ?? 0,
      packingDate: data.packingDate,
      packingType: data.packingType || null,
      orderTypeId: data.orderTypeId ? Number(data.orderTypeId) : null,
      buyerId: data.buyerId ? Number(data.buyerId) : null,
      weavingWorkOrderId: (String(orderTypeId) === '1' && Number(isJobworkVal) === 1 && data.weavingWorkOrderId) ? Number(data.weavingWorkOrderId) : 0,
      salesOrderId: ((String(orderTypeId) === '2' || (String(orderTypeId) === '1' && Number(isJobworkVal) !== 1)) && data.salesOrderId) ? Number(data.salesOrderId) : 0,
      isJobwork: data.isJobwork != null ? (Number(isJobworkVal) === 1 ? 1 : 0) : 0,
      fabricCodeId: data.fabricCodeId ? Number(data.fabricCodeId) : null,
      fabricQuality: data.fabricQuality ? String(data.fabricQuality) : null,
      uomId: data.uomId || null,
      warehouseId: data.warehouseId ? Number(data.warehouseId) : null,
      gradeId: data.gradeId ? Number(data.gradeId) : null,
      remarks: data.remarks || null,
      rollOrBaleNo: rollOrBaleNo,
      totalPieces: totals.totalPieces,
      totalMeters: Number(totals.totalMeters.toFixed(3)),
      totalYards: Number(totals.totalYards.toFixed(3)),
      totalNet: Number(totals.totalNet.toFixed(3)),
      totalAvg: Number(totals.totalAvg.toFixed(3)),
      totalGross: Number(totals.totalGross.toFixed(3)),
      isFactoryRoll: 1,
      isBrushChecked: 0,
      vendorId: data.vendorId ? Number(data.vendorId) : null,
      items: items.map((x) => ({
        pieceNo: x.pieceNo,
        meters: Number(x.meters),
        yards: Number(x.yards),
        netWeight: Number(x.netWeight),
        avgWeight: Number(x.avgWeight),
        grossWeight: Number(x.grossWeight || 0),
      }))
    } as any;

    try {
      let action: any;
      if (isEdit && data.id) {
        action = await dispatch(updateBaleRollPacking({ ...(payload as any), id: Number(data.id) }) as any);
      } else {
        action = await dispatch(createBaleRollPacking(payload as any) as any);
        documentNumberService.clearMemoryCache("Bale/Roll Packing");
      }
      if (action?.type?.endsWith('/fulfilled')) {
        if (stayOnPage) {
          const newId = action.payload?.data?.id || action.payload?.id;
          setItems([]); // Refresh (clear) Piece Details and Totals Summary
          setFormRows([createEmptyFormRow()]); // Refresh Add Piece Details
          handleRefreshPieces(); // Re-fetch available pieces from server
        } else {
          reset();
          setItems([]);
          navigate(-1);
        }
      }
    } catch (e) {
    }
  };

  // Dialog filtered list
  // const dialogFilteredPieces = useMemo(() => {
  //   const effectiveFabricId = dialogFilters.fabricCodeId || formFabricCodeId;
  //   const effectiveWarehouseId = dialogFilters.warehouseId || packingWarehouseId;
  //   const effectiveGradeId = dialogFilters.gradeId || selectedGradeId;

  //   if (showBrushedOnly) {
  //     const addedPieceNumbers = new Set(items.map((item) => item.pieceNo));
  //     const currentWeaverId = watch('vendorId');
  //     return (availablePieces || [])
  //       .filter((p: any) => !addedPieceNumbers.has(p.pieceNo))
  //       .filter((p: any) => (dialogFilters.pieceNo ? String(p.pieceNo).toLowerCase().includes(dialogFilters.pieceNo.toLowerCase()) : true))
  //       .filter((p: any) => (dialogFilters.fabricCodeId ? String(p.fabricCodeId) === String(dialogFilters.fabricCodeId) : true))
  //       .filter((p: any) => (dialogFilters.fabricQuality ? String(p.fabricQuality) === String(dialogFilters.fabricQuality) : true))
  //       .filter((p: any) => (currentWeaverId ? String(p.weaverId) === String(currentWeaverId) || String(p.vendorId) === String(currentWeaverId) : true));
  //   }

  //   if (!effectiveFabricId || !effectiveWarehouseId || !effectiveGradeId) {
  //     return [];
  //   }

  //   const addedPieceNumbers = new Set(items.map((item) => item.pieceNo));

  //   return (availablePieces || [])
  //     .filter((p: any) => !addedPieceNumbers.has(p.pieceNo))
  //     .filter((p: any) => (dialogFilters.pieceNo ? String(p.pieceNo).toLowerCase().includes(dialogFilters.pieceNo.toLowerCase()) : true))
  //     .filter((p: any) => (dialogFilters.fabricCodeId ? String(p.fabricCodeId) === String(dialogFilters.fabricCodeId) : true))
  //     .filter((p: any) => (dialogFilters.fabricQuality ? String(p.fabricQuality) === String(dialogFilters.fabricQuality) : true))
  //     .filter((p: any) => (dialogFilters.warehouseId ? String(p.warehouseId ?? '') === String(dialogFilters.warehouseId) : true))
  //     .filter((p: any) => (dialogFilters.gradeId ? String(p.gradeId ?? '') === String(dialogFilters.gradeId) : true));
  // }, [availablePieces, dialogFilters, formFabricCodeId, packingWarehouseId, selectedGradeId, items, showBrushedOnly, watch]);

  const dialogFilteredPieces = useMemo(() => {
    let filtered = [];
    // Original logic for non-brushed mode
    const effectiveFabricId = dialogFilters.fabricCodeId || formFabricCodeId;
    const effectiveWarehouseId = dialogFilters.warehouseId || packingWarehouseId;
    const effectiveGradeId = dialogFilters.gradeId || selectedGradeId;

    if (!effectiveFabricId || !effectiveWarehouseId || !effectiveGradeId) {
      return [];
    }

    const addedPieceNumbers = new Set(items.map((item) => item.pieceNo));

    filtered = (availablePieces || [])
      .filter((p: any) => !addedPieceNumbers.has(p.pieceNo))
      .filter((p: any) => (dialogFilters.pieceNo ? String(p.pieceNo).toLowerCase().includes(dialogFilters.pieceNo.toLowerCase()) : true))
      .filter((p: any) => (dialogFilters.fabricCodeId ? String(p.fabricCodeId) === String(dialogFilters.fabricCodeId) : true))
      .filter((p: any) => (dialogFilters.fabricQuality ? String(p.fabricQuality) === String(dialogFilters.fabricQuality) : true))
      .filter((p: any) => (dialogFilters.warehouseId ? String(p.warehouseId ?? '') === String(dialogFilters.warehouseId) : true))
      .filter((p: any) => (dialogFilters.gradeId ? String(p.gradeId ?? '') === String(dialogFilters.gradeId) : true));

    // Apply common search filter across multiple fields
    if (commonSearch.trim()) {
      const searchLower = commonSearch.trim().toLowerCase();
      filtered = filtered.filter((p: any) => {
        const pieceNo = String(p.pieceNo || '').toLowerCase();
        const fabricCode = String(getConstructionByFabricId(p.fabricCodeId)).toLowerCase();
        const warehouse = String(warehouseArr.find(w => String(w.id) === String(p.warehouseId))?.warehouseName || '').toLowerCase();
        const grade = String(gradeArr.find(g => String(g.id) === String(p.gradeId))?.gradeName || '').toLowerCase();

        return pieceNo.includes(searchLower) ||
               fabricCode.includes(searchLower) ||
               warehouse.includes(searchLower) ||
               grade.includes(searchLower);
      });
    }

    return filtered;
  }, [availablePieces, dialogFilters, formFabricCodeId, packingWarehouseId, selectedGradeId, items, watch, commonSearch, getConstructionByFabricId, warehouseArr, gradeArr]);

  const filteredMainItems = useMemo(() => {
    if (!mainSearch.trim()) return items;
    const searchLower = mainSearch.trim().toLowerCase();
    return items.filter((it) => {
      const pieceNo = String(it.pieceNo || '').toLowerCase();
      const construction = String(getConstructionByFabricId(it.fabricCodeId || watch('fabricCodeId')) || '').toLowerCase();
      const meters = String(it.meters || '');
      const yards = String(it.yards || '');
      const netWeight = String(it.netWeight || '');
      const avgWeight = String(it.avgWeight || '');
      const grossWeight = String(it.grossWeight || '');

      return pieceNo.includes(searchLower) ||
             construction.includes(searchLower) ||
             meters.includes(searchLower) ||
             yards.includes(searchLower) ||
             netWeight.includes(searchLower) ||
             avgWeight.includes(searchLower) ||
             grossWeight.includes(searchLower);
    });
  }, [items, mainSearch, getConstructionByFabricId, watch]);

  // const uniquePieceOptions = useMemo(() => {
  //   if (showBrushedOnly) {
  //     const seen = new Set<string>();
  //     const addedPieceNumbers = new Set(items.map((item) => item.pieceNo));
  //     const formRowPieceNos = new Set(formRows.map(r => r.pieceNo).filter(Boolean));

  //     return (allGlobalBrushedPieces || [])
  //       .filter((p: any) => !addedPieceNumbers.has(p.pieceNo) || formRowPieceNos.has(p.pieceNo))
  //       .filter((p: any) => {
  //         const key = String(p.pieceNo);
  //         if (seen.has(key)) return false;
  //         seen.add(key);
  //         return true;
  //       });
  //   }

  //   const effectiveFabricId = formFabricCodeId;
  //   const effectiveWarehouseId = packingWarehouseId;
  //   const effectiveGradeId = selectedGradeId;

  //   if (!effectiveFabricId || !effectiveWarehouseId || !effectiveGradeId) {
  //     return [];
  //   }

  //   const seen = new Set<string>();
  //   const addedPieceNumbers = new Set(items.map((item) => item.pieceNo));
  //   const formRowPieceNos = new Set(formRows.map(r => r.pieceNo).filter(Boolean));

  //   return (dialogPieceList || [])
  //     .filter((p: any) => !addedPieceNumbers.has(p.pieceNo) || formRowPieceNos.has(p.pieceNo))
  //     .filter((p: any) => {
  //       const key = String(p.pieceNo);
  //       if (seen.has(key)) return false;
  //       seen.add(key);
  //       return true;
  //     });
  // }, [dialogPieceList, allGlobalBrushedPieces, formFabricCodeId, packingWarehouseId, selectedGradeId, items, formRows, showBrushedOnly]);
const uniquePieceOptions = useMemo(() => {
  const effectiveFabricId = formFabricCodeId;
  const effectiveWarehouseId = packingWarehouseId;
  const effectiveGradeId = selectedGradeId;

  if (!effectiveFabricId || !effectiveWarehouseId || !effectiveGradeId) {
    return [];
  }

  const seen = new Set<string>();
  const addedPieceNumbers = new Set(items.map((item) => item.pieceNo));
  const formRowPieceNos = new Set(formRows.map(r => r.pieceNo).filter(Boolean));

  return (dialogPieceList || [])
    .filter((p: any) => !addedPieceNumbers.has(p.pieceNo) || formRowPieceNos.has(p.pieceNo))
    .filter((p: any) => {
      const key = String(p.pieceNo);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}, [dialogPieceList, formFabricCodeId, packingWarehouseId, selectedGradeId, items, formRows]);

  const pieceSelectOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    uniquePieceOptions
      .map((piece: any) => {
        const pieceNo = piece?.pieceNo;
        if (!pieceNo) return null;
        return {
          id: pieceNo,
          value: pieceNo,
          label: pieceNo
        } as CommonSearchableSelectOption;
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [uniquePieceOptions]
  );

  // Get fabricQuality from selected fabric master
  const fabricQualityValue = useMemo(() => {
    if (!formFabricCodeId || !fabricMasterList) return '';
    const selectedFabric = fabricMasterList.find((f: any) => String(f.id) === String(formFabricCodeId));
    return selectedFabric?.fabricQuality || '';
  }, [formFabricCodeId, fabricMasterList]);

  // Sync the quality value from fabric master
  useEffect(() => {
    if (fabricQualityValue) {
      setValue('fabricQuality', fabricQualityValue);
    }
  }, [fabricQualityValue, setValue]);

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/transaction/bale-roll-packing-details')} className="mr-auto">
              <ArrowLeft size={18} className="mr-2" /> Back
            </Button>
            <h2 className="text-2xl font-semibold">{isEdit ? 'Bale/Roll Packing Edit' : 'Bale/Roll Packing Add'}</h2>
          </div>

        </div>

        {/* Meta form */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText size={20} />Packing Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
           
            <div>
              <label className="block text-sm mb-1 font-medium">Bale/Roll No</label>
              <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                {...register('rollOrBaleNo')} readOnly />
            </div>
              <div>
              <label className="block text-sm font-medium">Packing Date <span className="text-red-600">*</span></label>
              <input type="date" className="input mt-1" {...register('packingDate', { required: true })} />
            </div>
                 <div>
                  <label className="block text-sm font-medium">Packing Type <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...packingTypeRest}
                    ref={packingTypeRef}
                    options={packingTypeOptions}
                    filterActive
                    placeholder="Select Packing Type"
                    value={watch('packingType') || ''}
                    onValueChange={(value) => packingTypeOnChange?.({
                      target: { name: 'packingType', value },
                      currentTarget: { name: 'packingType', value },
                      preventDefault: () => { },
                      stopPropagation: () => { }
                    } as any)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Order Type <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...orderTypeRest}
                    ref={orderTypeRef}
                    options={orderTypeOptions}
                    filterActive
                    placeholder="Select Order Type"
                    value={watch('orderTypeId') || ''}
                    onValueChange={(value) => orderTypeOnChange?.({
                      target: { name: 'orderTypeId', value },
                      currentTarget: { name: 'orderTypeId', value },
                      preventDefault: () => { },
                      stopPropagation: () => { }
                    } as any)}
                    className="mt-1"
                    required
                  />
                </div>
               
                {/* {String(orderTypeId) === '1' && (
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={Number(isJobworkVal) === 1}
                      onChange={(e) => setValue('isJobwork', e.target.checked ? 1 : 0)}
                    />
                    <label className="text-sm font-medium">Is Jobwork</label>
                  </div>
                )} */}
                {String(orderTypeId) === '1' && (
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={isJobworkChecked}
                      onChange={(e) => handleJobworkChange(e.target.checked)}
                    />
                    <label className="text-sm font-medium">Is Jobwork</label>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium">Order No</label>
                  {!orderTypeId ? (
                    <CommonSearchableSelect
                      options={[]}
                      placeholder="Select Order Type First"
                      value=""
                      disabled
                      className="mt-1"
                    />
                  ) : String(orderTypeId) === '1' && isJobworkChecked ? (
                    <CommonSearchableSelect
                      {...weavingOrderRest}
                      ref={weavingOrderRef}
                      options={weavingOrderOptions}
                      filterActive
                      placeholder="Select Weaving Work Order"
                      value={selectedWeavingWorkOrderId || ''}
                      onValueChange={(value) => weavingOrderOnChange?.({
                        target: { name: 'weavingWorkOrderId', value },
                        currentTarget: { name: 'weavingWorkOrderId', value },
                        preventDefault: () => { },
                        stopPropagation: () => { }
                      } as any)}
                      className="mt-1"
                    />
                  ) : (
                    <CommonSearchableSelect
                      {...salesOrderRest}
                      ref={salesOrderRef}
                      options={salesOrderOptions}
                      filterActive
                      placeholder="Select Sales Order"
                      value={selectedSalesOrderId || ''}
                      onValueChange={(value) => salesOrderOnChange?.({
                        target: { name: 'salesOrderId', value },
                        currentTarget: { name: 'salesOrderId', value },
                        preventDefault: () => { },
                        stopPropagation: () => { }
                      } as any)}
                      className="mt-1"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Buyer Name</label>
                  <CommonSearchableSelect
                    {...buyerRest}
                    ref={buyerRef}
                    options={buyerSelectOptions}
                    filterActive
                    placeholder="Select Buyer"
                    value={watch('buyerId') || ''}
                    onValueChange={(value) => buyerOnChange?.({
                      target: { name: 'buyerId', value },
                      currentTarget: { name: 'buyerId', value },
                      preventDefault: () => { },
                      stopPropagation: () => { }
                    } as any)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">{selectedWO ? 'Filtered by selected Order No' : 'Auto-populated when Order No is selected'}</p>
                </div>
    
                {/* Fabric Code (master) */}
                <div>
                  <label className="block text-sm font-medium">Sort No <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...fabricCodeRest}
                    ref={fabricCodeRef}
                    options={fabricCodeOptions}
                    filterActive
                    placeholder="Select Sort No"
                    value={watch('fabricCodeId') || ''}
                    onValueChange={(value) => fabricCodeOnChange?.({
                      target: { name: 'fabricCodeId', value },
                      currentTarget: { name: 'fabricCodeId', value },
                      preventDefault: () => { },
                      stopPropagation: () => { }
                    } as any)}
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{selectedWO ? 'Showing fabric codes from selected Order' : 'Showing all fabric codes'}</p>
                </div>
                {/* Construction (editable field from Sort Master) */}
                <div>
                  <label className="block text-sm font-medium">Construction</label>
                  <input
                    type="text"
                    className="input mt-1"
                    {...register('fabricQuality')}
                    placeholder="Construction fetched from Sort No"
                  />
                  <p className="text-xs text-gray-500">Fetched from selected Sort No. Editable.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UOM <span className="text-red-500">*</span>
                  </label>
                  <CommonSearchableSelect
                    {...uomRest}
                    ref={uomRef}
                    options={uomSelectOptions}
                    filterActive
                    placeholder="Select UOM"
                    value={watch('uomId') || ''}
                    onValueChange={(value) => uomOnChange?.({
                      target: { name: 'uomId', value },
                      currentTarget: { name: 'uomId', value },
                      preventDefault: () => { },
                      stopPropagation: () => { }
                    } as any)}
                    className="mt-1"
                    disabled={uomLoading}
                    error={errors.uomId?.message as string}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Warehouse <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...warehouseRest}
                    ref={warehouseRef}
                    options={warehouseSelectOptions}
                    filterActive
                    placeholder="Select Warehouse"
                    value={watch('warehouseId') || ''}
                    onValueChange={(value) => warehouseOnChange?.({
                      target: { name: 'warehouseId', value },
                      currentTarget: { name: 'warehouseId', value },
                      preventDefault: () => { },
                      stopPropagation: () => { }
                    } as any)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Grade <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...gradeRest}
                    ref={gradeRef}
                    options={gradeSelectOptions}
                    filterActive
                    placeholder="Select Grade"
                    value={watch('gradeId') || ''}
                    onValueChange={(value) => gradeOnChange?.({
                      target: { name: 'gradeId', value },
                      currentTarget: { name: 'gradeId', value },
                      preventDefault: () => { },
                      stopPropagation: () => { }
                    } as any)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Remarks</label>
                  <textarea className="input mt-1" {...register('remarks')} placeholder="Enter additional remarks (optional)" rows={2} />
                </div>
            <div className="flex items-center gap-4">
              <Button onClick={openPieceDialog} className="bg-primary hover:bg-primary text-white px-4 flex items-center"><Plus size={18} className="mr-2" /> Multiple Pieces</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg"><FileText size={20} />Add Piece Details</CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={confirmFormAddPieces} className="bg-primary hover:bg-primary text-white px-3 py-1 text-xs flex items-center"><Plus size={14} className="mr-1" /> Confirm & Add Pieces</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">S.No</th>
                    <th className="px-3 py-2 text-left font-semibold">Piece No</th>
                    <th className="px-3 py-2 text-left font-semibold">Construction</th>
                    <th className="px-3 py-2 text-left font-semibold">Meters</th>
                    <th className="px-3 py-2 text-left font-semibold">Yards</th>
                    <th className="px-3 py-2 text-left font-semibold">Net Wt</th>
                    <th className="px-3 py-2 text-left font-semibold">Avg Wt</th>
                    <th className="px-3 py-2 text-left font-semibold">Gross Wt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <CommonSearchableSelect
                          options={pieceSelectOptions}
                          filterActive
                          disablePortal
                          placeholder="-- Select Piece --"
                          value={row.pieceNo || ''}
                          onValueChange={(value) => handlePieceSelect(row.id, value)}
                          className="text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm">{getConstructionByFabricId(row.fabricCodeId || watch('fabricCodeId'))}</td>
                      <td className="px-3 py-2 text-sm">{row.meters.toFixed(3)}</td>
                      <td className="px-3 py-2 text-sm">{row.yards.toFixed(3)}</td>
                      <td className="px-3 py-2 text-sm">{row.netWeight.toFixed(3)}</td>
                      <td className="px-3 py-2 text-sm">{row.avgWeight.toFixed(3)}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.001"
                          className="input text-sm w-full"
                          placeholder="0.000"
                          value={row.grossWeight}
                          onChange={(e) => updateGrossWeight(row.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FileText size={20} /> Piece Details</CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshPieces}
                  className="flex items-center gap-2"
                >
                  <RotateCw size={16} /> Refresh Entries
                </Button>
                {items.length > 0 && (
                  <Button onClick={openSelectPiecesDialog} className="bg-purple-600 hover:bg-purple-700 text-white px-4 flex items-center"><FileText size={18} className="mr-2" /> View Selected ({items.length})</Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {items.length > 0 && (
              <div className="mb-4 flex justify-end">
                <div className="relative w-full md:w-72">
                  <Input
                    type="text"
                    placeholder="Search added pieces..."
                    value={mainSearch}
                    onChange={(e) => setMainSearch(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 border rounded text-sm"
                  />
                  {mainSearch && (
                    <button
                      onClick={() => setMainSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs animate-none"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">S.No</th>
                    <th className="px-3 py-2 text-left">Piece No</th>
                    <th className="px-3 py-2 text-left">Construction</th>
                    <th className="px-3 py-2 text-left">Meters</th>
                    <th className="px-3 py-2 text-left">Yards</th>
                    <th className="px-3 py-2 text-left">Net Wt</th>
                    <th className="px-3 py-2 text-left">Avg Wt</th>
                    <th className="px-3 py-2 text-left">Gross Wt</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMainItems.map((it, i) => {
                    const barcodeParams = new URLSearchParams({
                      barcode: it.pieceNo,
                      fabricQuality: watch('fabricQuality') || '',
                      meter: String(it.meters || ''),
                      yards: String(it.yards || ''),
                      netWeight: String(it.netWeight || ''),
                      avgWeight: String(it.avgWeight || ''),
                      grossWeight: String(it.grossWeight || ''),
                      companyId: String(resolvedCompanyId || '')
                    }).toString();

                    return (
                      <tr key={`${it.pieceNo}-${i}`}>
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2">{it.pieceNo}</td>
                        <td className="px-3 py-2">{getConstructionByFabricId(it.fabricCodeId || watch('fabricCodeId'))}</td>
                        <td className="px-3 py-2">{it.meters}</td>
                        <td className="px-3 py-2">{it.yards}</td>
                        <td className="px-3 py-2">{it.netWeight}</td>
                        <td className="px-3 py-2">{it.avgWeight}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.001"
                            className="input"
                            value={it.grossWeight ?? 0}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!/^\d*(?:\.\d{0,3})?$/.test(val)) return;
                              const num = Number(val || '0');
                              setItems((prev) => prev.map((p) => p.pieceNo === it.pieceNo ? { ...p, grossWeight: num } : p));
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 gap-3 ">
                          <div className='flex items-center gap-3'>
                            <a
                              href={`#/transaction/barcode-sticker?${barcodeParams}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              title="Print Barcode"
                            >
                              <FileText size={16} />
                            </a>
                            <button className="text-red-600 hover:underline" onClick={() => removePiece(it.pieceNo)} title="Remove">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FileText size={20} /> Totals Summary</CardTitle>
             
            </div>
          </CardHeader>
          <CardContent>
            {/* Totals Summary Table (horizontal like piece table) */}
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Total Pieces</th>
                    <th className="px-3 py-2 text-left">Total Meters</th>
                    <th className="px-3 py-2 text-left">Total Yards</th>
                    <th className="px-3 py-2 text-left">Total Net Wt</th>
                    <th className="px-3 py-2 text-left">Total Avg Wt</th>
                    <th className="px-3 py-2 text-left">Total Gross Wt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 font-medium">{totals.totalPieces}</td>
                    <td className="px-3 py-2">{totals.totalMeters.toFixed(3)}</td>
                    <td className="px-3 py-2">{totals.totalYards.toFixed(3)}</td>
                    <td className="px-3 py-2">{totals.totalNet.toFixed(3)}</td>
                    <td className="px-3 py-2">{totals.totalAvg.toFixed(3)}</td>
                    <td className="px-3 py-2 font-semibold">{totals.totalGross.toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-2">All totals update live when rows change.</p>
            </div>
          </CardContent>
        </Card>
        <div className='flex justify-end mt-10 gap-3'>
          <Button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, true))}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 flex items-center"
            disabled={isSaveDisabled}
          >
            <Plus size={18} className="mr-2" /> Add and Continue
          </Button>
          <Button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, false))}
            className="bg-primary hover:bg-primary text-white px-6 flex items-center"
            disabled={isSaveDisabled}
          >
            <Save size={18} className="mr-2" /> {isEdit ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Select/View Pieces Dialog with Checkboxes */}
      <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View & Manage Selected Pieces</DialogTitle>
          </DialogHeader>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No pieces added yet. Click "Add Pieces" to add pieces.</p>
            </div>
          ) : (
            <>
              {/* Control Buttons */}
              <div className="flex gap-2 mb-4 pb-4 border-b">
                <button
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded text-sm font-medium"
                  onClick={selectAllPieces}
                >
                  Select All
                </button>
                <button
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded text-sm font-medium"
                  onClick={deselectAllPieces}
                >
                  Deselect All
                </button>
                <div className="flex-1"></div>
                <span className="text-sm text-gray-600 py-2">
                  {Object.values(selectedPiecesCheckbox).filter(Boolean).length} / {items.length} selected
                </span>
              </div>

              {/* Pieces Table with Checkboxes */}
              <div className="overflow-x-auto border rounded mb-4">
                <table className="min-w-full text-sm">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-3 py-2 text-left w-10">
                        <input
                          type="checkbox"
                          checked={items.length > 0 && items.every((item) => selectedPiecesCheckbox[item.pieceNo])}
                          onChange={(e) => (e.target.checked ? selectAllPieces : deselectAllPieces)()}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">S.No</th>
                      <th className="px-3 py-2 text-left font-semibold">Piece No</th>
                      <th className="px-3 py-2 text-left font-semibold">Construction</th>
                      <th className="px-3 py-2 text-left font-semibold">Meters</th>
                      <th className="px-3 py-2 text-left font-semibold">Yards</th>
                      <th className="px-3 py-2 text-left font-semibold">Net Wt</th>
                      <th className="px-3 py-2 text-left font-semibold">Avg Wt</th>
                      <th className="px-3 py-2 text-left font-semibold">Gross Wt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr key={`${item.pieceNo}-${idx}`} className={selectedPiecesCheckbox[item.pieceNo] ? 'bg-purple-50' : 'hover:bg-gray-50'}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedPiecesCheckbox[item.pieceNo] || false}
                            onChange={() => toggleSelectPiece(item.pieceNo)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium">{item.pieceNo}</td>
                        <td className="px-3 py-2">{getConstructionByFabricId(item.fabricCodeId || watch('fabricCodeId'))}</td>
                        <td className="px-3 py-2">{Number(item.meters).toFixed(3)}</td>
                        <td className="px-3 py-2">{Number(item.yards).toFixed(3)}</td>
                        <td className="px-3 py-2">{Number(item.netWeight).toFixed(3)}</td>
                        <td className="px-3 py-2">{Number(item.avgWeight).toFixed(3)}</td>
                        <td className="px-3 py-2 font-medium">{Number(item.grossWeight || 0).toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs bg-purple-50 p-3 rounded mb-4 border">
                <div><span className="text-gray-600">Total Pieces:</span> <span className="font-medium">{items.length}</span></div>
                <div><span className="text-gray-600">Total Meters:</span> <span className="font-medium">{items.reduce((a, x) => a + Number(x.meters), 0).toFixed(3)}</span></div>
                <div><span className="text-gray-600">Total Yards:</span> <span className="font-medium">{items.reduce((a, x) => a + Number(x.yards), 0).toFixed(3)}</span></div>
                <div><span className="text-gray-600">Total Net Wt:</span> <span className="font-medium">{items.reduce((a, x) => a + Number(x.netWeight), 0).toFixed(3)}</span></div>
                <div><span className="text-gray-600">Total Avg Wt:</span> <span className="font-medium">{items.length ? (items.reduce((a, x) => a + Number(x.avgWeight), 0) / items.length).toFixed(3) : '0.000'}</span></div>
                <div><span className="text-gray-600">Total Gross Wt:</span> <span className="font-medium">{items.reduce((a, x) => a + Number(x.grossWeight || 0), 0).toFixed(3)}</span></div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-2 pt-4 border-t">
                <button
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded font-medium"
                  onClick={() => setIsSelectDialogOpen(false)}
                >
                  Close
                </button>
                <button
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium flex items-center gap-2"
                  onClick={deleteSelectedPieces}
                  disabled={Object.values(selectedPiecesCheckbox).every((v) => !v)}
                >
                  <Trash2 size={16} /> Delete Selected
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-5xl max-h-[85vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Select Pieces</DialogTitle>
          </DialogHeader>

          {/* Filters: Piece No search + Fabric Code. Weaver filter removed from popup. */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <CommonSearchableSelect
              options={pieceSelectOptions}
              filterActive
              disablePortal
              placeholder="Search by Piece No"
              value={dialogFilters.pieceNo || ''}
              onValueChange={(value) => setDialogFilters((p) => ({ ...p, pieceNo: value }))}
            />
            <CommonSearchableSelect
              options={fabricCodeOptions}
              filterActive
              disablePortal
              placeholder="Sort No"
              value={dialogFilters.fabricCodeId || ''}
              onValueChange={(value) => {
                const nextValue = value || '';
                setDialogFilters((p) => ({ ...p, fabricCodeId: nextValue, fabricQuality: '' }));
                syncFormFieldFromDialog('fabricCodeId', nextValue);
                if (nextValue) dispatch(getAllFabricMasterDetails({ id: Number(nextValue) }) as any);
              }}
            />
            <CommonSearchableSelect
              options={warehouseSelectOptions}
              filterActive
              disablePortal
              placeholder="All Warehouses"
              value={dialogFilters.warehouseId || ''}
              onValueChange={(value) => {
                const nextValue = value || '';
                setDialogFilters((p) => ({ ...p, warehouseId: nextValue }));
                syncFormFieldFromDialog('warehouseId', nextValue);
              }}
            />
            <CommonSearchableSelect
              options={gradeSelectOptions}
              filterActive
              disablePortal
              placeholder="All Grades"
              value={dialogFilters.gradeId || ''}
              onValueChange={(value) => {
                const nextValue = value || '';
                setDialogFilters((p) => ({ ...p, gradeId: nextValue }));
                syncFormFieldFromDialog('gradeId', nextValue);
              }}
            />
          </div>

          {/* Common Search Box */}
          <div className="mb-3 flex justify-end">
            <div className="relative w-full md:w-72">
              <Input
                type="text"
                placeholder="Search pieces..."
                value={commonSearch}
                onChange={(e) => setCommonSearch(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border rounded text-sm"
              />
              {commonSearch && (
                <button
                  onClick={() => setCommonSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs animate-none"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border rounded">
            {(!formFabricCodeId || !packingWarehouseId) ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium mb-2">
                  Please select Sort No and Warehouse first
                </p>
                <p className="text-sm">
                  Pieces will be displayed once you select both Sort No and Warehouse from the form above.
                </p>
              </div>
            )
              : dialogFilteredPieces.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium mb-2">No pieces available</p>
                  <p className="text-sm">
                    {availablePieces.length === 0
                      ? 'There are no inspected pieces matching the selected criteria.'
                      : 'All available pieces have already been added to the packing list.'}
                  </p>
                </div>
              ) :
                (
                   <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="checkbox" 
                              checked={dialogFilteredPieces.length > 0 && dialogFilteredPieces.every((p: any) => !!selected[p.pieceNo])}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const nextSelected = { ...selected };
                                const nextGrossDraft = { ...grossDraft };
                                dialogFilteredPieces.forEach((p: any) => {
                                  nextSelected[p.pieceNo] = checked;
                                  if (checked && nextGrossDraft[p.pieceNo] === undefined) {
                                    const netWt = Number(p.netWeight || 0);
                                    const autoGross = (p.grossWeight != null && p.grossWeight > 0 
                                          ? p.grossWeight.toFixed(3) 
                                          : (netWt + fabricTareWeight).toFixed(3));
                                    nextGrossDraft[p.pieceNo] = autoGross;
                                  }
                                });
                                setSelected(nextSelected);
                                setGrossDraft(nextGrossDraft);
                              }}
                              className="w-[18px] h-[18px] cursor-pointer"
                            />
                            <span>Select</span>
                          </div>
                        </th>
                        <th className="px-3 py-2 text-left">S.No</th>
                        <th className="px-3 py-2 text-left">Piece No</th>
                        <th className="px-3 py-2 text-left">Construction</th>
                        <th className="px-3 py-2 text-left">Meters</th>
                        <th className="px-3 py-2 text-left">Yards</th>
                        <th className="px-3 py-2 text-left">Net Weight</th>
                        <th className="px-3 py-2 text-left">Avg Wt</th>
                        <th className="px-3 py-2 text-left">Gross Wt</th>
                      </tr>
                    </thead>
                     <tbody className="divide-y divide-gray-200">
                      {dialogFilteredPieces.map((p: any, idx: number) => (
                        <tr key={p.id ?? `${p.pieceNo}-${idx}`}>
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={!!selected[p.pieceNo]} onChange={() => toggleSelect(p)} className='w-[25px] h-[25px]' />
                          </td>
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{p.pieceNo}</td>
                          <td className="px-3 py-2">{getConstructionByFabricId(p.fabricCodeId)}</td>
                          <td className="px-3 py-2">{p.meters}</td>
                          <td className="px-3 py-2">{toYards(p.meters)}</td>
                          <td className="px-3 py-2">{p.netWeight}</td>
                          <td className="px-3 py-2">{p.avgWeight}</td>
                          <td className="px-3 py-2">
                            <span className="text-sm">
                              {grossDraft[p.pieceNo] ?? 
                               (p.grossWeight != null && p.grossWeight > 0 
                                   ? p.grossWeight.toFixed(3) 
                                   : (Number(p.netWeight || 0) + fabricTareWeight).toFixed(3))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
          </div>

          <div className="flex justify-between mt-4">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => { setSelected({}); setGrossDraft({}); }}>Clear Selection</button>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setIsDialogOpen(false)}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={confirmAddPieces}>Add Selected</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}