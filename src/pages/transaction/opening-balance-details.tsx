import React, { act, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Save, ArrowLeft, Edit, Trash2, FileDown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CommonSearchableSelect, { CommonSearchableSelectOption } from '@/components/ui/CommonSearchableSelect';
import { generateExcelTemplate, readExcelFile } from '@/lib/utils';
import { AppDispatch, RootState } from '@/state/store';
import { toast } from 'react-toastify';
import { getAllGrandMaster } from '@/state/gradeMasterSlice';
import { getAllWarehouse } from '@/state/warehouseSlice';
import { getAllYarnMasters } from '@/state/yarnSlice';
import { getAllSubCategories } from '@/state/subCategorySlice';
import { getAllFabricMasters } from '@/state/fabricMasterSlice';
import { createOpeningBalance, updateOpeningBalance } from '@/state/openingBalanceSlice';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';
import { getAllUomMaster } from '@/state/uomMasterSlice';
import documentNumberService from '@/services/DocumentNumberService';
import { useFilteredWarehouseOptions } from '@/hooks/useFilteredWarehouseOptions';
import { getAllItemMasters } from '@/state/itemSlice';
import { getAllVendors } from '@/state/vendorSlice';
import { filterVendorsByTypeIds } from '@/utils/vendorFilters';


const globalStyles = `
  /* Hide default date picker icon in Chrome, Safari, Edge */
  input[type="date"]::-webkit-calendar-picker-indicator {
    background: transparent;
    cursor: pointer;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    z-index: 1;
  }
  
  /* For Firefox */
  input[type="date"] {
    -moz-appearance: textfield;
  }
  
  input[type="date"]::-moz-calendar-picker-indicator {
    display: none;
  }
  
  /* For IE/Edge */
  input[type="date"]::-ms-clear {
    display: none;
  }
`;

const GOODS_TYPE_OPTIONS = [
  { value: 'Fabric', label: 'Fabric' },
  { value: 'Yarn', label: 'Yarn' },
  { value: 'Item', label: 'Item' },
];

const FABRIC_TEMPLATE_HEADERS = [
  'Sort No',
  'Is_inspected',
  'Piece No',
  'Piece meter',
  'Net WT',
  'Grade'
];

const YARN_TEMPLATE_HEADERS = [
  'Yarn Name',
  'Mill Name',
  'Yarn Type',
  'No Of Carton/Pallet',
  'Kgs/Bag',
  'Cones/Bag',
  'Cones Weight',
  'Total Qty',
  'Lot No',
  'Supplier/Vendor',
  'DC Number',
  'DC Date',
  'Yarn Mill Inv. No',
  'Yarn Mill Date',
  'ICIL Inv. No',
  'ICIL Inv. Date'
];

const YARN_TYPE_OPTIONS: CommonSearchableSelectOption[] = [
  { value: '1', label: 'Warp' },
  { value: '2', label: 'Weft' },
  { value: '3', label: 'Both' },
];

const EXCEL_ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

const YES_NO_OPTIONS = ['Yes', 'No'];
const YES_NO_SELECT_OPTIONS: CommonSearchableSelectOption[] = YES_NO_OPTIONS.map((option) => ({ value: option, label: option }));

const normalizeList = (raw: any): any[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  if (Array.isArray(raw?.rows)) return raw.rows;
  return [];
};

const normalizeExcelHeader = (header: string) => header.trim().toLowerCase();

const excelDateToIso = (value: any): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86400000));
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  const text = String(value ?? '').trim();
  if (!text) return '';

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const localMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  let year = 0;
  let month = 0;
  let day = 0;

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (localMatch) {
    day = Number(localMatch[1]);
    month = Number(localMatch[2]);
    year = Number(localMatch[3]);
  } else {
    return null;
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

interface FabricItem {
  id: string;
  fabricCodeId: number | '';
  fabricCode: string;
  quality: string;
  packingNo: string;
  isInspected: string;
  pieceNo: string;
  pieceMeter: number;
  netWeight: number;
  avgWeight: number;
  gradeId: number | '';
  gradeName: string;
  fabricTypeId?: number | '';
}

interface YarnItem {
  id: string;
  yarnId: number | '';
  yarnName: string;
  millId: number | '';
  millName: string;
  yarnTypeId: number | '';
  noOfBags: number;
  kgsPerBag: number;
  conesPerBag: number;
  conesWeight: number;
  totalKg: number;
  lotNumber: string;
  uomId: number | '';
  uomName: string;
}

interface ItemGoodsItem {
  id: string;
  itemId: number | '';
  itemName: string;
  noOfBags: number;
  kgsPerBag: number;
  acceptedQty: number;
  lotNo: string;
}

interface FormData {
  openingBalanceNo: string;
  goodsType: string;
  isPacked: string;
  warehouseId: number | '';
  uomId: number | '';
  openingBalanceDate: string;
  vendorId: number | '';
  dcNumber: string;
  dcDate: string;
  millInvNo: string;
  millDate: string;
  icilInvNo: string;
  icilInvDate: string;
  fabricItems?: FabricItem[];
  yarnItems?: YarnItem[];
}

export default function OpeningBalanceDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const editData = location.state?.openingBalance;
  const isEdit = !!editData;

  const { gradeList } = useSelector((state: RootState) => state.grade as any);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse as any);
  const { yarnList } = useSelector((state: RootState) => state.yarn as any);
  const { subCategoryList }: any = useSelector((state: RootState) => state.subCategory as any);
  const { fabricMasterList }: any = useSelector((state: RootState) => state.fabricMaster as any);
   const { uomList }: any = useSelector((state: RootState) => state.uom as any);
  const { itemList }: any = useSelector((state: RootState) => state.itemMaster as any);
   const { vendorList, loading: vendorLoading } = useSelector((state: RootState) => state.vendor);
  const loggedInCompanyId = useResolvedCompanyId();
  const resolvedCompanyId = editData?.companyId != null ? Number(editData.companyId) : loggedInCompanyId;

    const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);

    const getCurrentDateForApi = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { control, handleSubmit, watch, register, setValue, formState: { errors } } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      goodsType: editData?.goodsType || 'Fabric',
      isPacked: editData?.isPacked ? 'Yes' : 'No',
      warehouseId: editData?.warehouse || '',
      uomId: editData?.uomId || '',
      openingBalanceDate: editData?.date || getCurrentDateForApi(),
      vendorId: editData?.vendorId || '',
      dcNumber: editData?.dcNumber || '',
      dcDate: editData?.dcDate || '',
      millInvNo: editData?.millInvNo || '',
      millDate: editData?.millDate || '',
      icilInvNo: editData?.icilInvNo || '',
      icilInvDate: editData?.icilInvDate || '',
    },
  });
  
    useEffect(() => {

        const generateDocumentNumber = async () => {
          // Only generate for new entries (not editing existing ones)
          if (editData || hasGeneratedNumberRef.current) {
            return;
          }
    
          try {
            const result = await documentNumberService.generateDocumentNumber({
              screenName: 'Opening Balance'
            });
            setValue('openingBalanceNo', result.documentNumber, { shouldValidate: true });
            hasGeneratedNumberRef.current = true;
          } catch (error) {
            console.error('Failed to generate Opening Balance number:', error);
            toast.error('Failed to generate Opening Balance number');
          }
        };
    
        generateDocumentNumber();
      }, [editData, setValue]);
    
      // Cleanup document number cache if not saved
      useEffect(() => {
     
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData) {
            documentNumberService.clearMemoryCache('Opening Balance');
          }
        };
    
        window.addEventListener('beforeunload', handleBeforeUnload);
    
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData) {
            documentNumberService.clearMemoryCache('Opening Balance');
          }
        };
      }, [editData]);
    
      useEffect(() => {
        setValue('openingBalanceNo', editData?.openingBalanceNo || '');
      }, [editData, setValue]);

  const fabricMasterMap = useMemo(() => {
    if (!Array.isArray(fabricMasterList)) return {};
    return fabricMasterList.reduce((acc: Record<number, any>, fabric: any) => {
      if (fabric?.id != null) {
        acc[Number(fabric.id)] = fabric;
      }
      return acc;
    }, {} as Record<number, any>);
  }, [fabricMasterList]);

  const normalizedWarehouseList = useMemo(() => normalizeList(warehouseList), [warehouseList]);
  const normalizedUomList = useMemo(() => normalizeList(uomList), [uomList]);
  const normalizedFabricMasterList = useMemo(() => normalizeList(fabricMasterList), [fabricMasterList]);
  const normalizedYarnList = useMemo(() => normalizeList(yarnList), [yarnList]);
  const normalizedSubCategoryList = useMemo(() => normalizeList(subCategoryList), [subCategoryList]);
  const normalizedVendorList = useMemo(() => normalizeList(vendorList), [vendorList]);
  const activeVendorList = useMemo(
    () => filterVendorsByTypeIds(normalizedVendorList, [301]),
    [normalizedVendorList]
  );
  const vendorOptions = useMemo<CommonSearchableSelectOption[]>(
    () => activeVendorList
      .map((vendor: any) => {
        if (vendor?.id == null || !vendor?.vendorName) return null;
        return {
          id: vendor.id,
          value: String(vendor.id),
          label: vendor.vendorName,
          activeFlag: true
        };
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [activeVendorList]
  );

  const uomOptions = useMemo<CommonSearchableSelectOption[]>(
    () => normalizedUomList
      .map((uom: any) => {
        const id = uom?.id;
        const label = uom?.uomName || uom?.name;
        if (id == null || !label) return null;
        return {
          id,
          value: String(id),
          label,
          activeFlag: uom?.activeFlag ?? true
        };
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [normalizedUomList]
  );

  const fabricOptions = useMemo<CommonSearchableSelectOption[]>(
    () => normalizedFabricMasterList
      .map((fabric: any) => {
        const id = fabric?.id;
        if (id == null) return null;
        const code = fabric?.fabricCode || fabric?.fabric_code || '';
        const quality = fabric?.fabricQuality || fabric?.quality || '';
        const label = code && quality ? `${code} — ${quality}` : code || `Fabric ${id}`;
        return {
          id,
          value: String(id),
          label
        };
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [normalizedFabricMasterList]
  );

  const gradeSelectOptions = useMemo<CommonSearchableSelectOption[]>(
    () => (Array.isArray(gradeList) ? gradeList : [])
      .map((grade: any) => {
        const id = grade?.id;
        const label = grade?.name || grade?.gradeName;
        if (id == null || !label) return null;
        return {
          id,
          value: String(id),
          label,
          activeFlag: grade?.activeFlag ?? true
        };
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [gradeList]
  );

  const yarnOptions = useMemo<CommonSearchableSelectOption[]>(
    () => normalizedYarnList
      .map((yarn: any) => {
        const id = yarn?.id;
        const label = yarn?.yarnName || yarn?.name;
        if (id == null || !label) return null;
        return {
          id,
          value: String(id),
          label,
          activeFlag: yarn?.activeFlag ?? true
        };
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [normalizedYarnList]
  );

  const millOptions = useMemo(() => {
    if (!Array.isArray(normalizedSubCategoryList)) return [];
    return normalizedSubCategoryList.filter((subCat: any) => {
      const categoryName = subCat?.categoryName;
      if (!categoryName) return false;
      return categoryName.toString().trim().toLowerCase() === 'mill';
    });
  }, [normalizedSubCategoryList]);

  const millSelectOptions = useMemo<CommonSearchableSelectOption[]>(
    () => millOptions
      .map((mill: any) => {
        const id = mill?.id;
        const label = mill?.subCategoryName;
        if (id == null || !label) return null;
        return {
          id,
          value: String(id),
          label
        };
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [millOptions]
  );

  const millMapByName = useMemo(() => {
    return millOptions.reduce((acc: Record<string, any>, mill: any) => {
      const name = mill?.subCategoryName;
      if (typeof name === 'string' && name.trim() !== '') {
        acc[name.trim().toLowerCase()] = mill;
      }
      return acc;
    }, {} as Record<string, any>);
  }, [millOptions]);

  const gradeOptions = useMemo(() => {
    if (!Array.isArray(gradeList)) return [];
    const values = gradeList
      .map((grade: any) => grade?.name || grade?.gradeName || '')
      .filter((value: string) => value !== '');
    return Array.from(new Set(values));
  }, [gradeList]);

  const normalizedItemList = useMemo(() => normalizeList(itemList), [itemList]);

  const itemOptions = useMemo<CommonSearchableSelectOption[]>(
    () => normalizedItemList
      .map((item: any) => {
        const id = item?.id;
        const label = item?.itemName || item?.name;
        if (id == null || !label) return null;
        return {
          id,
          value: String(id),
          label,
          activeFlag: item?.activeFlag ?? true
        };
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [normalizedItemList]
  );

  const getFabricSummaryLabel = (item: FabricItem) => {
    if (!item) return '';
    const fabricId = item.fabricCodeId ? Number(item.fabricCodeId) : undefined;
    const master = fabricId != null ? fabricMasterMap[fabricId] : undefined;
    const fabricCode = item.fabricCode || master?.fabricCode || master?.fabric_code || (fabricId != null ? `Fabric ${fabricId}` : '');
    const fabricQuality = item.quality || master?.fabricQuality || master?.quality || '';
    if (fabricCode && fabricQuality) {
      return `${fabricCode} - ${fabricQuality}`;
    }
    return fabricCode || fabricQuality || '';
  };

  const selectedGoodsType = watch('goodsType');
  const isPacked = watch('isPacked');
  const warehouseIdValue = watch('warehouseId');
  const selectedUomId = watch('uomId');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fabricMastersReady = Array.isArray(fabricMasterList) && fabricMasterList.length > 0;
  const gradeMastersReady = gradeOptions.length > 0;
  const yarnMastersReady = Array.isArray(yarnList) && yarnList.length > 0;
  const millMastersReady = millOptions.length > 0;
  const templateMandatoryFieldsFilled = Boolean(warehouseIdValue) && Boolean(selectedUomId) && (selectedGoodsType !== 'Fabric' || Boolean(isPacked));
    
  const { filteredWarehouseOptions: warehouseOptions, defaultWarehouseId } = useFilteredWarehouseOptions(warehouseList, selectedGoodsType);

  const canUseTemplateActions = selectedGoodsType === 'Fabric'
    ? templateMandatoryFieldsFilled && fabricMastersReady && gradeMastersReady
    : selectedGoodsType === 'Yarn'
      ? templateMandatoryFieldsFilled && yarnMastersReady && millMastersReady && !vendorLoading
      : false;

  const [fabricItems, setFabricItems] = useState<FabricItem[]>([]);
  const [yarnItems, setYarnItems] = useState<YarnItem[]>([]);
  const [itemGoodsItems, setItemGoodsItems] = useState<ItemGoodsItem[]>([]);
  const [fabricDraft, setFabricDraft] = useState<Partial<FabricItem>>({});
  const [yarnDraft, setYarnDraft] = useState<Partial<YarnItem>>({});
  const [itemGoodsDraft, setItemGoodsDraft] = useState<Partial<ItemGoodsItem>>({});
  
  const fabricSummaryRows = useMemo(() => {
    if (!fabricItems.length) {
      return [] as Array<{ key: string; label: string; pieces: number; totalPieceMeter: number }>;
    }
    const groups = new Map<string, { label: string; pieces: number; totalPieceMeter: number }>();
    fabricItems.forEach((item) => {
      const baseKey = item.fabricCodeId ? `id-${item.fabricCodeId}` : (item.fabricCode ? `code-${item.fabricCode.toLowerCase()}` : item.id);
      const label = getFabricSummaryLabel(item) || item.fabricCode || (item.fabricCodeId ? `Fabric ${item.fabricCodeId}` : 'Fabric');
      const current = groups.get(baseKey) || { label, pieces: 0, totalPieceMeter: 0 };
      current.pieces += 1;
      current.totalPieceMeter += Number(item.pieceMeter || 0);
      groups.set(baseKey, current);
    });
    return Array.from(groups.entries()).map(([key, value]) => ({
      key,
      label: value.label || key,
      pieces: value.pieces,
      totalPieceMeter: Number(value.totalPieceMeter.toFixed(3))
    }));
  }, [fabricItems, fabricMasterMap]);

  const yarnSummaryRows = useMemo(() => {
  if (!yarnItems.length) {
    return [] as Array<{ key: string; label: string; totalKg: number; totalBags: number; pieces: number }>;
  }
  
  // Group by yarn name instead of by id/name combination
  const groups = new Map<string, { 
    label: string; 
    totalKg: number; 
    totalBags: number; 
    pieces: number;
    yarnId?: number | '';
  }>();
  
  yarnItems.forEach((item) => {
    // Use yarnName as the grouping key (case-insensitive)
    const yarnName = item.yarnName?.toString().trim().toLowerCase() || 'unknown';
    
    const current = groups.get(yarnName) || { 
      label: item.yarnName || (item.yarnId ? `Yarn ${item.yarnId}` : 'Yarn'), 
      totalKg: 0, 
      totalBags: 0, 
      pieces: 0,
      yarnId: item.yarnId
    };
    
    current.totalKg += Number(item.totalKg || 0);
    current.totalBags += Number(item.noOfBags || 0);
    current.pieces += 1;
    
    groups.set(yarnName, current);
  });
  
  return Array.from(groups.entries()).map(([key, value]) => ({
    key,
    label: value.label || key,
    totalKg: Number(value.totalKg.toFixed(3)),
    totalBags: Number(value.totalBags),
    pieces: value.pieces,
    yarnId: value.yarnId
  }));
}, [yarnItems]);

  const itemGoodsSummaryRows = useMemo(() => {
    if (!itemGoodsItems.length) {
      return [] as Array<{ key: string; label: string; totalAcceptedQty: number; noOfBags: number; pieces: number }>;
    }
    const groups = new Map<string, { label: string; totalAcceptedQty: number; noOfBags: number; pieces: number }>();
    itemGoodsItems.forEach((item) => {
      const key = item.itemId ? `id-${item.itemId}` : `name-${(item.itemName || '').toLowerCase()}`;
      const label = item.itemName || (item.itemId ? `Item ${item.itemId}` : 'Item');
      const current = groups.get(key) || { label, totalAcceptedQty: 0, noOfBags: 0, pieces: 0 };
      current.totalAcceptedQty += Number(item.acceptedQty || 0);
      current.noOfBags += Number(item.noOfBags || 0);
      current.pieces += 1;
      groups.set(key, current);
    });
    return Array.from(groups.entries()).map(([key, value]) => ({
      key,
      label: value.label || key,
      totalAcceptedQty: Number(value.totalAcceptedQty.toFixed(3)),
      noOfBags: Number(value.noOfBags),
      pieces: value.pieces,
    }));
  }, [itemGoodsItems]);

  
   const selectedUomLabel = useMemo(() => {
    if (!selectedUomId || !uomList) return 'kg';
    const selectedUom = uomList.find((uom: any) => String(uom.id) === String(selectedUomId));
    return selectedUom?.uomName || selectedUom?.name || 'kg';
  }, [selectedUomId, uomList]);

  useEffect(() => {
    dispatch(getAllGrandMaster({fetchAll: true}));
    dispatch(getAllWarehouse({fetchAll: true}));
    dispatch(getAllYarnMasters({fetchAll: true}));
    dispatch(getAllSubCategories({fetchAll: true}));
    dispatch(getAllFabricMasters({fetchAll: true}));
    dispatch(getAllUomMaster({ fetchAll: true }));
    dispatch(getAllItemMasters({ fetchAll: true }));
    dispatch(getAllVendors({
      fetchAll: true,
      ...(resolvedCompanyId != null ? { companyId: resolvedCompanyId } : {})
    }));
  }, [dispatch, resolvedCompanyId]);

  useEffect(() => {
    if (!isEdit) {
      setValue('warehouseId', defaultWarehouseId ? Number(defaultWarehouseId) : '');
    }
  }, [defaultWarehouseId, isEdit, setValue]);

  useEffect(() => {
    if (!editData) return;

    setValue('goodsType', editData.goodsType || 'Fabric');
    setValue('isPacked', editData.isPacked ? 'Yes' : 'No');
    setValue('warehouseId', editData.warehouse || '');
    setValue('uomId', editData.uomId || '');
    setValue('openingBalanceDate', editData.date || getCurrentDateForApi());
    setValue('vendorId', editData.vendorId || '');
    setValue('dcNumber', editData.dcNumber || '');
    setValue('dcDate', editData.dcDate || '');
    setValue('millInvNo', editData.millInvNo || '');
    setValue('millDate', editData.millDate || '');
    setValue('icilInvNo', editData.icilInvNo || '');
    setValue('icilInvDate', editData.icilInvDate || '');

    if (editData.goodsType === 'Item') {
      const itemSource = editData.itemGoods || editData.items || [];
      const itemData: ItemGoodsItem[] = itemSource.map((item: any) => {
        const matchedItem = normalizedItemList.find((i: any) => String(i?.id) === String(item.itemId));
        return {
          id: item.id?.toString() || Date.now().toString(),
          itemId: item.itemId || '',
          itemName: matchedItem?.itemName || matchedItem?.name || item.itemName || '',
          noOfBags: item.noOfBags || 0,
          kgsPerBag: item.kgsPerBag || 0,
          acceptedQty: item.acceptedQty || 0,
          lotNo: item.lotNo || '',
        };
      });
      setItemGoodsItems(itemData);
    } else if (editData.goodsType === 'Fabric') {
      const fabricSource = editData.fabricItems || editData.items || [];
      const isPackedFromPayload = Boolean(
        editData.isPacked === true ||
        editData.isPacked === 1 ||
        editData.isPacked === '1' ||
        editData.isPacked === 'Yes'
      );
      const fabricData: FabricItem[] = fabricSource.map((item: any) => {
        const grade = gradeList.find((g: any) => g.id === item.grade);
        const master = fabricMasterMap[item.fabricCodeId ?? item.fabric_code_id ?? item.fabricMasterId];
        const resolvedFabricCode = master?.fabricCode || master?.fabric_code || item.fabricCode || '';
        const resolvedQuality = item.quality || master?.fabricQuality || master?.quality || '';
        return {
          id: item.id?.toString() || Date.now().toString(),
          fabricCodeId: item.fabricCodeId || '',
          fabricCode: resolvedFabricCode,
          quality: resolvedQuality,
          packingNo: item.packingNo || '',
          isInspected: isPackedFromPayload ? 'Yes' : (item.isInspected ? 'Yes' : 'No'),
          pieceNo: item.pieceNo || '',
          pieceMeter: item.pieceMeter || 0,
          netWeight: item.netWeight || 0,
          avgWeight: item.avgWeight || (item.pieceMeter && item.netWeight ?
            parseFloat((item.netWeight / item.pieceMeter).toFixed(4)) : 0),
          gradeId: item.grade || '',
          gradeName: grade?.name || grade?.gradeName || '',
          fabricTypeId: item.fabricTypeId || master?.fabricType || master?.fabricTypeId || master?.fabric_type_id || '',
        };
      });
      setFabricItems(fabricData);
    }  else {
      const yarnSource = editData.yarnItems || editData.items || [];
      const yarnData: YarnItem[] = yarnSource.map((item: any) => {
        const uom = uomList?.find((u: any) => u.id === item.uomId);
        return {
          id: item.id?.toString() || Date.now().toString(),
          yarnId: item.yarnId || '',
          yarnName: item.yarnName || '',
          millId: item.millId || '',
          millName: item.millName || '',
          yarnTypeId: item.yarnTypeId ?? '',
          noOfBags: item.noOfBags || 0,
          kgsPerBag: item.kgsPerBag || 0,
          conesPerBag: item.conesPerBag || 0,
          conesWeight: item.conesWeight || 0,
          totalKg: item.totalKg || 0,
          lotNumber: item.lotNumber || '',
          uomId: item.uomId || '',
          uomName: uom?.uomName || uom?.name || '',
        };
      });
      setYarnItems(yarnData);
      
      if (yarnData.length > 0 && yarnData[0].uomId) {
        setValue('uomId', yarnData[0].uomId);
      }
    }
  }, [editData, setValue, gradeList, fabricMasterMap, uomList, normalizedItemList]);

  const handleDownloadTemplate = () => {
    if (!canUseTemplateActions) {
      toast.error('Please fill mandatory fields before downloading template');
      return;
    }
    if (selectedGoodsType === 'Fabric') {
      if (!fabricMastersReady) {
        toast.error('Fabric master data not loaded. Please try again.');
        return;
      }
      if (!gradeMastersReady) {
        toast.error('Grade master data not loaded. Please try again.');
        return;
      }
      generateExcelTemplate({
        headers: FABRIC_TEMPLATE_HEADERS,
        fileName: 'opening-balance-fabric-template',
        dropdowns: [
          { header: 'Is_inspected', values: YES_NO_OPTIONS },
          { header: 'Grade', values: gradeOptions }
        ]
      });
      return;
    }
    if (selectedGoodsType === 'Yarn') {
      if (!yarnMastersReady) {
        toast.error('Yarn master data not loaded. Please try again.');
        return;
      }
      if (!millMastersReady) {
        toast.error('Mill master data not loaded. Please try again.');
        return;
      }
      generateExcelTemplate({
        headers: YARN_TEMPLATE_HEADERS,
        fileName: 'opening-balance-yarn-template',
        dropdowns: [
          { header: 'Yarn Type', values: YARN_TYPE_OPTIONS.map((option) => option.label) },
          ...(vendorOptions.length
            ? [{ header: 'Supplier/Vendor', values: vendorOptions.map((option) => option.label) }]
            : [])
        ]
      });
    }
  };

  const handleUploadButtonClick = () => {
    if (!canUseTemplateActions) {
      toast.error('Please fill mandatory fields before uploading');
      return;
    }
    if (selectedGoodsType === 'Fabric') {
      if (!fabricMastersReady) {
        toast.error('Fabric master data not loaded. Please try again.');
        return;
      }
      if (!gradeMastersReady) {
        toast.error('Grade master data not loaded. Please try again.');
        return;
      }
    } else if (selectedGoodsType === 'Yarn') {
      if (!yarnMastersReady) {
        toast.error('Yarn master data not loaded. Please try again.');
        return;
      }
      if (!millMastersReady) {
        toast.error('Mill master data not loaded. Please try again.');
        return;
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!EXCEL_ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error('Only Excel files (.xls, .xlsx) are supported');
      event.target.value = '';
      return;
    }
    try {
      setIsImporting(true);
      const rows = await readExcelFile<Record<string, any>>(file);
      if (selectedGoodsType === 'Fabric') {
        if (!fabricMastersReady) {
          toast.error('Fabric master data not loaded. Please try again.');
          return;
        }
        if (!gradeMastersReady) {
          toast.error('Grade master data not loaded. Please try again.');
          return;
        }
        const parsedItems: FabricItem[] = [];
        const safeFabricMasters = Array.isArray(fabricMasterList) ? fabricMasterList : [];
        const safeGradeList = Array.isArray(gradeList) ? gradeList : [];
        const seenPieceNos = new Set<string>();
        const validationErrors: string[] = [];
        for (let index = 0; index < rows.length; index += 1) {
          const row = rows[index] || {};
          const normalized = Object.entries(row || {}).reduce<Record<string, any>>((acc, [key, value]) => {
            acc[key?.toString().trim().toLowerCase()] = value;
            return acc;
          }, {});
          const fabricCodeCell = normalized['fabric code'] ?? normalized['fabric_code'];
          const pieceNoCell = normalized['piece no'] ?? normalized['piece number'];
          const pieceMeterCell = normalized['piece meter'];
          const netWeightCell = normalized['net wt'] ?? normalized['net weight'];
          if (!fabricCodeCell || !pieceNoCell) {
            continue;
          }
          const pieceNoValue = pieceNoCell.toString().trim();
          if (!pieceNoValue) {
            continue;
          }
          const normalizedPieceNo = pieceNoValue.toLowerCase();
          if (seenPieceNos.has(normalizedPieceNo)) {
            validationErrors.push(`Duplicate piece number ${pieceNoValue}`);
            continue;
          }
          seenPieceNos.add(normalizedPieceNo);
          const normalizedFabricCode = fabricCodeCell.toString().trim();
          const pieceMeter = typeof pieceMeterCell === 'number' ? pieceMeterCell : parseFloat(pieceMeterCell);
          const netWeight = typeof netWeightCell === 'number' ? netWeightCell : parseFloat(netWeightCell);
          if (!normalizedFabricCode || !Number.isFinite(pieceMeter) || pieceMeter <= 0 || !Number.isFinite(netWeight) || netWeight <= 0) {
            continue;
          }
          const fabricMatch = safeFabricMasters.find((fabric: any) => {
            const codes = [fabric?.fabricCode, fabric?.fabric_code];
            return codes.some((code) => code && code.toString().trim().toLowerCase() === normalizedFabricCode.toLowerCase());
          });
          if (!fabricMatch) {
            validationErrors.push(`Fabric code ${normalizedFabricCode} is not matched with master data.`);
            continue;
          }
          const gradeCell = normalized['grade'];
          const gradeValue = gradeCell ? gradeCell.toString().trim() : '';
          const gradeMatch = gradeValue
            ? safeGradeList.find((grade: any) => {
                const name = grade?.name || grade?.gradeName;
                return name && name.toString().trim().toLowerCase() === gradeValue.toLowerCase();
              })
            : undefined;
          if (gradeValue && !gradeMatch) {
            validationErrors.push(`Grade ${gradeValue} is mismatched.`);
            continue;
          }
          const avgWeightCell = normalized['avg wt'];
          let avgWeight = typeof avgWeightCell === 'number' ? avgWeightCell : parseFloat(avgWeightCell);
          if (!Number.isFinite(avgWeight) || avgWeight <= 0) {
            avgWeight = pieceMeter > 0 ? parseFloat((netWeight / pieceMeter).toFixed(4)) : 0;
          }
          const isInspectedCell = normalized['is_inspected'];
          const normalizedIsInspected = isInspectedCell && isInspectedCell.toString().trim().toLowerCase() === 'yes' ? 'Yes' : 'No';
          parsedItems.push({
            id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
            fabricCodeId: fabricMatch.id || '',
            fabricCode: fabricMatch.fabricCode || fabricMatch.fabric_code || normalizedFabricCode,
            quality: fabricMatch.fabricQuality || fabricMatch.quality || '',
            packingNo: isPacked === 'Yes' ? (isInspectedCell ?? '').toString() : '',
            isInspected: isPacked === 'Yes' ? 'No' : normalizedIsInspected,
            pieceNo: pieceNoValue,
            pieceMeter,
            netWeight,
            avgWeight,
            gradeId: gradeMatch?.id || '',
            gradeName: gradeMatch?.name || gradeMatch?.gradeName || '',
            fabricTypeId: fabricMatch.fabricType || fabricMatch.fabricTypeId || fabricMatch.fabric_type_id || '',
          });
        }
        if (validationErrors.length) {
          toast.error(validationErrors.join('\n'));
          return;
        }
        if (!parsedItems.length) {
          toast.error('No valid rows found in the uploaded file');
          return;
        }
        setFabricItems((prev) => [...prev, ...parsedItems]);
        toast.success(`Imported ${parsedItems.length} fabric ${parsedItems.length === 1 ? 'item' : 'items'}`);
        return;
      }
      if (selectedGoodsType === 'Yarn') {
        if (!yarnMastersReady) {
          toast.error('Yarn master data not loaded. Please try again.');
          return;
        }
        if (!millMastersReady) {
          toast.error('Mill master data not loaded. Please try again.');
          return;
        }
        const parsedItems: YarnItem[] = [];
        const safeYarnMasters = Array.isArray(yarnList) ? yarnList : [];
        const safeMillMap = millMapByName;
        const validationErrors: string[] = [];
        const normalizedRows = rows.map((row) =>
          Object.entries(row || {}).reduce<Record<string, any>>((acc, [key, value]) => {
            acc[normalizeExcelHeader(key)] = value;
            return acc;
          }, {})
        );
        const resolveSharedColumn = (
          headerNames: string[],
          label: string,
          transform: (value: any) => string | null
        ) => {
          const present = normalizedRows.some((row) =>
            headerNames.some((header) => Object.prototype.hasOwnProperty.call(row, header))
          );
          const rawValues = normalizedRows.flatMap((row) =>
            headerNames
              .filter((header) => Object.prototype.hasOwnProperty.call(row, header))
              .map((header) => row[header])
              .filter((value) => value != null && String(value).trim() !== '')
          );
          const values = rawValues.map(transform);
          if (values.some((value) => value == null)) {
            validationErrors.push(`${label} contains an invalid or unknown value.`); } /*
          }


          );


          }
          return {
            */ return { present,
            value: values.find((value): value is string => value != null) || ''
          };
        };
        const importedVendor = resolveSharedColumn(
          ['supplier/vendor', 'supplier', 'vendor'],
          'Supplier/Vendor',
          (value) => {
            const name = String(value).trim().toLowerCase();
            const vendor = activeVendorList.find(
              (entry: any) => entry?.vendorName?.toString().trim().toLowerCase() === name
            );
            return vendor ? String(vendor.id) : null;
          }
        );
        const importedDcNumber = resolveSharedColumn(
          ['dc number', 'dc_number'],
          'DC Number',
          (value) => String(value).trim()
        );
        const importedDcDate = resolveSharedColumn(
          ['dc date', 'dc_date'],
          'DC Date',
          excelDateToIso
        );
        const importedMillInvNo = resolveSharedColumn(
          ['yarn mill inv. no', 'yarn mill inv no', 'mill inv no', 'mill_inv_no'],
          'Yarn Mill Inv. No',
          (value) => String(value).trim()
        );
        const importedMillDate = resolveSharedColumn(
          ['yarn mill date', 'mill date', 'mill_date'],
          'Yarn Mill Date',
          excelDateToIso
        );
        const importedIcilInvNo = resolveSharedColumn(
          ['icil inv. no', 'icil inv no', 'icil_inv_no'],
          'ICIL Inv. No',
          (value) => String(value).trim()
        );
        const importedIcilInvDate = resolveSharedColumn(
          ['icil inv. date', 'icil inv date', 'icil_inv_date'],
          'ICIL Inv. Date',
          excelDateToIso
        );
        for (let index = 0; index < rows.length; index += 1) {
          const normalized = normalizedRows[index] || {};
          const yarnNameCell = normalized['yarn name'] ?? normalized['yarn_name'];
          if (!yarnNameCell) {
            continue;
          }
          const normalizedYarnName = yarnNameCell.toString().trim();
          if (!normalizedYarnName) {
            continue;
          }
          const millNameCell = normalized['mill name'] ?? normalized['mill_name'] ?? normalized['mill'];
          const normalizedMillName = millNameCell ? millNameCell.toString().trim() : '';
          if (!normalizedMillName) {
            validationErrors.push('Mill name is required.');
            continue;
          }
          const normalizedYarnNameLower = normalizedYarnName.toLowerCase();
          const yarnMatch = safeYarnMasters.find((yarn: any) => {
            const yarnNames = [
              yarn?.yarnName,
              yarn?.name,
              yarn?.yarn_name,
              yarn?.data?.yarnName,
              yarn?.yarn?.yarnName
            ];
            return yarnNames.some((name) => name && name.toString().trim().toLowerCase() === normalizedYarnNameLower);
          });
          if (!yarnMatch) {
            validationErrors.push(`Yarn name ${normalizedYarnName} does not matched with yarn master data.`);
            continue;
          }
          const normalizedMillNameLower = normalizedMillName.toLowerCase();
          const millMatch = safeMillMap[normalizedMillNameLower];
          if (!millMatch) {
            validationErrors.push(`Mill name ${normalizedMillName} does not matched with mill master data.`);
            continue;
          }
          const yarnTypeCell = normalized['yarn type'] ?? normalized['yarn_type'];
          const yarnTypeValue = yarnTypeCell?.toString().trim().toLowerCase() || '';
          const yarnTypeId = yarnTypeValue
            ? ({ warp: 1, weft: 2, both: 3, '1': 1, '2': 2, '3': 3 } as Record<string, number>)[yarnTypeValue]
            : '';
          if (yarnTypeValue && yarnTypeId === undefined) {
            validationErrors.push(`Yarn type ${yarnTypeCell} is invalid. Use Warp, Weft, or Both.`);
            continue;
          }
          const bagsCell = normalized['no of carton/pallet']
            ?? normalized['no of carton pallet']
            ?? normalized['no of bags']
            ?? normalized['no_of_bags']
            ?? normalized['noofbags'];
          const noOfBags = typeof bagsCell === 'number' ? bagsCell : parseFloat(bagsCell);
          const kgsCell = normalized['kgs/bag'] ?? normalized['kgs per bag'] ?? normalized['kgsperbag'];
          const kgsPerBag = typeof kgsCell === 'number' ? kgsCell : parseFloat(kgsCell);
          const conesPerBagCell = normalized['cones/bag'] ?? normalized['cones per bag'] ?? normalized['conesperbag'];
          const conesPerBag = conesPerBagCell === '' || conesPerBagCell == null
            ? 0
            : typeof conesPerBagCell === 'number' ? conesPerBagCell : parseFloat(conesPerBagCell);
          const conesWeightCell = normalized['cones weight'] ?? normalized['cones_weight'] ?? normalized['conesweight'];
          const conesWeight = conesWeightCell === '' || conesWeightCell == null
            ? 0
            : typeof conesWeightCell === 'number' ? conesWeightCell : parseFloat(conesWeightCell);
          if (!Number.isFinite(conesPerBag) || conesPerBag < 0) {
            validationErrors.push(`Row ${index + 2}: Cones/Bag must be a non-negative number.`);
            continue;
          }
          if (!Number.isFinite(conesWeight) || conesWeight < 0) {
            validationErrors.push(`Row ${index + 2}: Cones Weight must be a non-negative number.`);
            continue;
          }
          const totalQtyCell = normalized['total qty'] ?? normalized['total quantity'] ?? normalized['total kg'] ?? normalized['totalkg'];
          let totalQty = typeof totalQtyCell === 'number' ? totalQtyCell : parseFloat(totalQtyCell);
          if ((!Number.isFinite(totalQty) || totalQty <= 0) && Number.isFinite(noOfBags) && Number.isFinite(kgsPerBag) && noOfBags > 0 && kgsPerBag > 0) {
            totalQty = parseFloat((noOfBags * kgsPerBag).toFixed(4));
          }
          if (!Number.isFinite(totalQty) || totalQty <= 0) {
            continue;
          }
          const lotNumberCell = normalized['lot no'] ?? normalized['lot number'] ?? normalized['lot'];
          parsedItems.push({
            id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
            yarnId: yarnMatch.id || '',
            yarnName: yarnMatch.yarnName || yarnMatch.name || normalizedYarnName,
            millId: millMatch.id || '',
            millName: millMatch.subCategoryName || normalizedMillName,
            yarnTypeId,
            noOfBags: Number.isFinite(noOfBags) && noOfBags > 0 ? Number(noOfBags) : 0,
            kgsPerBag: Number.isFinite(kgsPerBag) && kgsPerBag > 0 ? Number(kgsPerBag) : 0,
            conesPerBag: Number(conesPerBag),
            conesWeight: Number(conesWeight),
            totalKg: Number(totalQty),
            lotNumber: lotNumberCell ? lotNumberCell.toString() : '',
            uomId: selectedUomId ? Number(selectedUomId) : '',
            uomName: selectedUomLabel,
          });
        }
        if (validationErrors.length) {
          toast.error(validationErrors.join('\n'));
          return;
        }
        if (!parsedItems.length) {
          toast.error('No valid rows found in the uploaded file');
          return;
        }
        if (importedVendor.value) {
          setValue('vendorId', Number(importedVendor.value), { shouldDirty: true });
        }
        if (importedDcNumber.value) setValue('dcNumber', importedDcNumber.value, { shouldDirty: true });
        if (importedDcDate.value) setValue('dcDate', importedDcDate.value, { shouldDirty: true });
        if (importedMillInvNo.value) setValue('millInvNo', importedMillInvNo.value, { shouldDirty: true });
        if (importedMillDate.value) setValue('millDate', importedMillDate.value, { shouldDirty: true });
        if (importedIcilInvNo.value) setValue('icilInvNo', importedIcilInvNo.value, { shouldDirty: true });
        if (importedIcilInvDate.value) setValue('icilInvDate', importedIcilInvDate.value, { shouldDirty: true });
        setYarnItems((prev) => [...prev, ...parsedItems]);
        toast.success(`Imported ${parsedItems.length} yarn ${parsedItems.length === 1 ? 'item' : 'items'}`);
        return;
      }
      toast.error('Upload is available only for supported goods');
    } catch (error: any) {
      toast.error('Failed to process the uploaded file');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  // Add Fabric Item
  const handleAddFabricItem = () => {
    if (!fabricDraft.fabricCodeId || !fabricDraft.pieceNo) {
      toast.error('Please fill required fields');
      return;
    }

    const normalizedPieceNo = fabricDraft.pieceNo.toString().trim().toLowerCase();
    const hasDuplicatePiece = fabricItems.some((item) => item.pieceNo?.toString().trim().toLowerCase() === normalizedPieceNo);
    if (hasDuplicatePiece) {
      toast.error('Duplicate pieces not allowed');
      return;
    }

    const fabricId = fabricDraft.fabricCodeId ? Number(fabricDraft.fabricCodeId) : undefined;
    const selectedFabric = fabricId != null ? fabricMasterMap[fabricId] : undefined;
    const selectedGrade = gradeList?.find((g: any) => g.id === fabricDraft.gradeId);
    const avgWeight = fabricDraft.netWeight && fabricDraft.pieceMeter ?
      parseFloat((fabricDraft.netWeight / fabricDraft.pieceMeter).toFixed(4)) : 0;

    const newItem: FabricItem = {
      id: Date.now().toString(),
      fabricCodeId: fabricDraft.fabricCodeId || '',
      fabricCode: selectedFabric?.fabricCode || selectedFabric?.fabric_code || '',
      quality: selectedFabric?.fabricQuality || selectedFabric?.quality || '',
      packingNo: fabricDraft.packingNo || '',
      isInspected: fabricDraft.isInspected || 'No',
      pieceNo: fabricDraft.pieceNo || '',
      pieceMeter: fabricDraft.pieceMeter || 0,
      netWeight: fabricDraft.netWeight || 0,
      avgWeight,
      gradeId: fabricDraft.gradeId || '',
      gradeName: selectedGrade?.name || selectedGrade?.gradeName || '',
      fabricTypeId: selectedFabric?.fabricType || selectedFabric?.fabricTypeId || selectedFabric?.fabric_type_id || '',
    };

    setFabricItems([...fabricItems, newItem]);
    setFabricDraft({});
    toast.success('Fabric item added');
  };

  // Add Yarn Item
  const handleAddYarnItem = () => {
    if (!yarnDraft.yarnName || !yarnDraft.lotNumber) {
      toast.error('Please fill required fields (Yarn Name and Lot Number)');
      return;
    }

    const selectedYarn = yarnList.find((y: any) => y.yarnName === yarnDraft.yarnName);
    const selectedMill = subCategoryList.find((s: any) => s.subCategoryName === yarnDraft.millName);

    const newItem: YarnItem = {
      id: Date.now().toString(),
      yarnId: selectedYarn ? selectedYarn.id : '',
      yarnName: yarnDraft.yarnName || '',
      millId: selectedMill ? selectedMill.id : '',
      millName: yarnDraft.millName || '',
      yarnTypeId: yarnDraft.yarnTypeId ?? '',
      noOfBags: yarnDraft.noOfBags || 0,
      kgsPerBag: yarnDraft.kgsPerBag || 0,
      conesPerBag: yarnDraft.conesPerBag || 0,
      conesWeight: yarnDraft.conesWeight || 0,
      totalKg: yarnDraft.totalKg || (yarnDraft.noOfBags || 0) * (yarnDraft.kgsPerBag || 0),
      lotNumber: yarnDraft.lotNumber || '',
       uomId: '',
      uomName: '',
    };

    setYarnItems([...yarnItems, newItem]);
    setYarnDraft({});
    toast.success('Yarn item added');
  };

  // Delete handlers
  const handleDeleteFabricItem = (id: string) => setFabricItems(fabricItems.filter((i) => i.id !== id));
  const handleDeleteYarnItem = (id: string) => setYarnItems(yarnItems.filter((i) => i.id !== id));

  // Edit handlers
  const handleEditFabricItem = (item: FabricItem) => {
    const fabricId = item.fabricCodeId ? Number(item.fabricCodeId) : undefined;
    const selectedFabric = fabricId != null ? fabricMasterMap[fabricId] : undefined;
    const selectedGrade = gradeList.find((g: any) => g.id === item.gradeId);

    setFabricDraft({
      id: item.id,
      fabricCodeId: item.fabricCodeId,
      fabricCode: item.fabricCode,
      quality: item.quality,
      packingNo: item.packingNo,
      isInspected: item.isInspected,
      pieceNo: item.pieceNo,
      pieceMeter: item.pieceMeter,
      netWeight: item.netWeight,
      avgWeight: item.avgWeight,
      gradeId: item.gradeId,
      gradeName: item.gradeName,
      fabricTypeId: item.fabricTypeId,
      ...(selectedFabric && {
        fabricCode: selectedFabric.fabricCode,
        quality: selectedFabric.fabricQuality || selectedFabric.quality
      }),
      ...(selectedGrade && {
        gradeName: selectedGrade.name || selectedGrade.gradeName
      })
    });

    handleDeleteFabricItem(item.id);
  };

  const handleEditYarnItem = (item: YarnItem) => {
  setYarnDraft({
      ...item,
      uomId: item.uomId || '',
      uomName: item.uomName || '',
    });

    handleDeleteYarnItem(item.id);
  };

  const handleAddItemGoodsItem = () => {
    if (!itemGoodsDraft.acceptedQty) {
      toast.error('Please fill required fields (Accepted Qty)');
      return;
    }
    const selectedItem = normalizedItemList.find((i: any) => String(i?.id) === String(itemGoodsDraft.itemId));
    const newItem: ItemGoodsItem = {
      id: Date.now().toString(),
      itemId: itemGoodsDraft.itemId || '',
      itemName: selectedItem?.itemName || selectedItem?.name || '',
      noOfBags: itemGoodsDraft.noOfBags || 0,
      kgsPerBag: itemGoodsDraft.kgsPerBag || 0,
      acceptedQty: itemGoodsDraft.acceptedQty || 0,
      lotNo: itemGoodsDraft.lotNo || '',
    };
    setItemGoodsItems([...itemGoodsItems, newItem]);
    setItemGoodsDraft({});
    toast.success('Item added');
  };

  const handleDeleteItemGoodsItem = (id: string) => setItemGoodsItems(itemGoodsItems.filter((i) => i.id !== id));

  const handleEditItemGoodsItem = (item: ItemGoodsItem) => {
    setItemGoodsDraft({ ...item });
    handleDeleteItemGoodsItem(item.id);
  };

  // Submit
  const onSubmit = async (data: FormData) => {
    try {
      const items = selectedGoodsType === 'Fabric' ? fabricItems : selectedGoodsType === 'Yarn' ? yarnItems : itemGoodsItems;
      if (!items.length) {
        toast.error('Please add at least one item');
        return;
      }

      // Fabric Validation
      if (selectedGoodsType === 'Fabric') {
        for (let i = 0; i < fabricItems.length; i++) {
          const item = fabricItems[i];
          if (!item.fabricCodeId || !item.pieceNo || !item.netWeight || !item.pieceMeter) {
            toast.error(`Fabric item ${i + 1} is missing required fields`);
            return;
          }
        }
      }

      // Yarn Validation
      if (selectedGoodsType === 'Yarn') {
        for (let i = 0; i < yarnItems.length; i++) {
          const item = yarnItems[i];
          if (!item.yarnName || !item.lotNumber) {
            toast.error(`Yarn item ${i + 1} is missing required fields`);
            return;
          }
        }
      }

      // Item Goods Validation
      if (selectedGoodsType === 'Item') {
        for (let i = 0; i < itemGoodsItems.length; i++) {
          const item = itemGoodsItems[i];
          if (!item.acceptedQty) {
            toast.error(`Item ${i + 1} is missing required fields (Accepted Qty)`);
            return;
          }
        }
      }

      // Construct Payload
      const summaryItemsForPayload = selectedGoodsType === 'Fabric'
        ? fabricSummaryRows.map((row) => ({
            itemName: row.label,
            quantity: Number(row.totalPieceMeter || 0),
            value: 'm',
            noOfPieces: row.pieces,
          }))
        : selectedGoodsType === 'Yarn'
        ? yarnSummaryRows.map((row) => ({
            itemName: row.label,
            quantity: Number(row.totalKg || 0),
            value: 'kg',
            noOfPieces: row.pieces,
            noOfBags: Number(row.totalBags || 0),
          }))
        : itemGoodsSummaryRows.map((row) => ({
            itemName: row.label,
            quantity: Number(row.totalAcceptedQty || 0),
            noOfPieces: row.pieces,
            noOfBags: Number(row.noOfBags || 0),
          }));

              let openingBalanceNo = data.openingBalanceNo || editData?.openingBalanceNo || "";
              if (!editData && !openingBalanceNo) {
                try {
                  const docResponse = await documentNumberService.generateDocumentNumber({
                    screenName: "Opening Balance",
                  });
                  openingBalanceNo = docResponse.documentNumber;
                } catch (error) {
                  console.warn("Failed to generate document number:", error);
                }
              }
              isSavingRef.current = true;

      const payload: any = {
        slNo: 1,
        openingBalanceNo: openingBalanceNo,
        date: data.openingBalanceDate || getCurrentDateForApi(),
        goodsType: selectedGoodsType,
        isPacked: data.isPacked === 'Yes',
        warehouse: data.warehouseId ? Number(data.warehouseId) : 0,
        companyId: resolvedCompanyId ?? 0,
        uomId: data.uomId ? Number(data.uomId) : null,
          //  uomId: selectedGoodsType === 'Yarn' ? (data.uomId ? Number(data.uomId) : null) : null,
      };

      // Add items based on goods type
      if (selectedGoodsType === 'Fabric') {
        payload.fabricItems = fabricItems.map((item, index) => ({
          sNo: index + 1,
          fabricCodeId: Number(item.fabricCodeId),
          fabricCode: item.fabricCode || '',
          quality: item.quality || '',
          packingNo: data.isPacked === 'Yes' ? item.packingNo || '' : '',
          isInspected:data.isPacked === 'Yes'? true : item.isInspected === 'Yes',
          pieceNo: item.pieceNo,
          pieceMeter: Number(item.pieceMeter),
          netWeight: Number(item.netWeight),
          avgWeight: Number(item.avgWeight || (item.netWeight / item.pieceMeter).toFixed(4)),
          grade: item.gradeId ? Number(item.gradeId) : 0,
          fabricTypeId: item.fabricTypeId || null,
          fabricMasterId: Number(item.fabricCodeId),
        }));
        // payload.items = payload.fabricItems;
      } else if (selectedGoodsType === 'Yarn') {
        payload.vendorId = data.vendorId ? Number(data.vendorId) : null;
        payload.dcNumber = data.dcNumber.trim() || null;
        payload.dcDate = data.dcDate || null;
        payload.millInvNo = data.millInvNo.trim() || null;
        payload.millDate = data.millDate || null;
        payload.icilInvNo = data.icilInvNo.trim() || null;
        payload.icilInvDate = data.icilInvDate || null;
        payload.yarnItems = yarnItems.map((item, index) => {
          const mill = subCategoryList.find((s: any) => s.subCategoryName === item.millName);
          return {
            sNo: index + 1,
            yarnId: Number(item.yarnId),
            yarnName: item.yarnName,
            millId: mill?.id || null,
            millName: item.millName,
            yarnTypeId: item.yarnTypeId ? Number(item.yarnTypeId) : null,
            noOfBags: Number(item.noOfBags),
            kgsPerBag: Number(item.kgsPerBag),
            conesPerBag: Number(item.conesPerBag || 0),
            conesWeight: Number(item.conesWeight || 0),
            totalKg: Number(item.totalKg),
            lotNumber: item.lotNumber.trim(),
            uomId: data.uomId ? Number(data.uomId) : null,
          };
        });
        // payload.items = payload.yarnItems;
      } else if (selectedGoodsType === 'Item') {
        payload.itemGoods = itemGoodsItems.map((item, index) => ({
          sNo: index + 1,
          itemId: item.itemId ? Number(item.itemId) : null,
          itemName: item.itemName || '',
          noOfBags: Number(item.noOfBags),
          kgsPerBag: Number(item.kgsPerBag),
          acceptedQty: Number(item.acceptedQty),
          lotNo: item.lotNo || '',
        }));
        payload.items = payload.itemGoods;
      }

      if (summaryItemsForPayload.length) {
        payload.openingBalanceSummaryItems = summaryItemsForPayload;
      }

      if (isEdit) {
        payload.id = editData.id;
      }
// alert(JSON.stringify(payload));
//       console.log('🚀 Payload being sent to API:', JSON.stringify(payload, null, 2));

      if (isEdit) {
        await dispatch(updateOpeningBalance(payload)).unwrap();
        // toast.success('Updated successfully');
      } else {
        await dispatch(createOpeningBalance(payload)).unwrap();
         documentNumberService.clearMemoryCache("Opening Balance");
        // toast.success('Created successfully');
      }

      navigate('/transaction/opening-balance');
    } catch (error: any) {
      console.error('API Error:', error?.response?.data || error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save');
    }
  };

  return (
    <div className="space-y-6 mt-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
             <Button
                        variant="outline"
                        onClick={() => navigate("/transaction/opening-balance")}
                        className="mr-auto"
                      >
                        <ArrowLeft size={18} className="mr-2" />
                        Back
                      </Button>
        
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit' : 'Add'} Opening Balance
          </h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Top Section - Goods Type, Warehouse, etc */}
        <Card>
          <CardHeader>
            <CardTitle>Opening Balance Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               <div className="space-y-2">
                  <label className="block text-sm">Opening Balance No</label>
                  <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                {...register('openingBalanceNo')} readOnly />

                </div>
              <div>
                <label className="block text-sm font-medium">Opening Balance Date <span className="text-red-600">*</span></label>
                <input
                  {...register("openingBalanceDate", { required: "Opening Balance Date is required" })}
                  type="date"
                  className="input mt-1"
                />
                {errors.openingBalanceDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.openingBalanceDate.message}</p>
                )}
              </div>
              {/* Goods Type */}
              <div className="space-y-2">
                <Label htmlFor="goodsType">Goods Type *</Label>
                <Controller
                  name="goodsType"
                  control={control}
                  rules={{ required: "Goods Type is required" }}
                  render={({ field }) => (
                    // <div>
                    //   <select
                    //     {...field}
                    //     className={`w-full border rounded px-3 py-2 ${errors.goodsType ? 'border-red-500' : ''}`}
                    //     id="goodsType"
                    //   >
                    //     {GOODS_TYPE_OPTIONS.map((option) => (
                    //       <option key={option.value} value={option.value}>
                    //         {option.label}
                    //       </option>
                    //     ))}
                    //   </select>
                    //   {errors.goodsType && (
                    //     <p className="text-red-500 text-xs mt-1">{errors.goodsType.message}</p>
                    //   )}
                    // </div>
                    <div>
                      <CommonSearchableSelect
                        placeholder="Select Goods Type"
                        options={GOODS_TYPE_OPTIONS.map(opt => ({
                          value: opt.value,
                          label: opt.label
                        }))}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                        className={errors.goodsType ? 'border-red-500' : ''}
                      />
                      {errors.goodsType && (
                        <p className="text-red-500 text-xs mt-1">{errors.goodsType.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Is Packed - Only show for Fabric */}
              {selectedGoodsType === 'Fabric' && (
                <div className="space-y-2">
                  <Label htmlFor="isPacked">Is Packed *</Label>
                  <Controller
                    name="isPacked"
                    control={control}
                    rules={{ required: "Is Packed is required" }}
                    render={({ field }) => (
                      // <div>
                      //   <select
                      //     {...field}
                      //     className={`w-full border rounded px-3 py-2 ${errors.isPacked ? 'border-red-500' : ''}`}
                      //     id="isPacked"
                      //   >
                      //     <option value="Yes">Yes</option>
                      //     <option value="No">No</option>
                      //   </select>
                      //   {errors.isPacked && (
                      //     <p className="text-red-500 text-xs mt-1">{errors.isPacked.message}</p>
                      //   )}
                      // </div>
                       <div>
                        <CommonSearchableSelect
                          placeholder="Select Option"
                          options={[
                            { value: 'Yes', label: 'Yes' },
                            { value: 'No', label: 'No' }
                          ]}
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                          className={errors.isPacked ? 'border-red-500' : ''}
                        />
                        {errors.isPacked && (
                          <p className="text-red-500 text-xs mt-1">{errors.isPacked.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Warehouse */}
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse *</Label>
                <Controller
                  name="warehouseId"
                  control={control}
                  rules={{ required: "Warehouse is required" }}
                  render={({ field }) => (
                    // <div>
                    //   <select
                    //     {...field}
                    //     className={`w-full border rounded px-3 py-2 ${errors.warehouseId ? 'border-red-500' : ''}`}
                    //     id="warehouse"
                    //   >
                    //     <option value="">Select Warehouse</option>
                    //     {warehouseList && warehouseList.map((warehouse: any) => (
                    //       <option key={warehouse.id} value={warehouse.id}>
                    //         {warehouse.name || warehouse.warehouseName}
                    //       </option>
                    //     ))}
                    //   </select>
                    //   {errors.warehouseId && (
                    //     <p className="text-red-500 text-xs mt-1">{errors.warehouseId.message}</p>
                    //   )}
                    // </div>
                     <div>
                      <CommonSearchableSelect
                        placeholder="Select Warehouse"
                        options={warehouseOptions}
                        filterActive
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(value) => {
                          field.onChange(value ? Number(value) : '');
                        }}
                        className={errors.warehouseId ? 'border-red-500' : ''}
                        error={errors.warehouseId?.message as string}
                      />
                      {errors.warehouseId && (
                        <p className="text-red-500 text-xs mt-1">{errors.warehouseId.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
                  <div className="space-y-2">
                <Label htmlFor="uom">UOM *</Label>
                <Controller
                  name="uomId"
                  control={control}
                  rules={{ required: "UOM is required" }}
                  render={({ field }) => {
                    const { onChange, value, ...rest } = field;
                    return (
                      <div>
                        <CommonSearchableSelect
                          {...rest}
                          options={uomOptions}
                          filterActive
                          placeholder="Select UOM"
                          value={value ? String(value) : ''}
                          onValueChange={(val) => onChange(val ? Number(val) : '')}
                          className={`w-full rounded ${errors.uomId ? 'border-red-500' : ''}`}
                      error={errors.uomId?.message as string}
                        />
                        
                      </div>
                    );
                  }}
                />
              </div>
              {selectedGoodsType === 'Yarn' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="vendorId">Supplier/Vendor</Label>
                    <Controller
                      name="vendorId"
                      control={control}
                      render={({ field }) => (
                        <CommonSearchableSelect
                          options={vendorOptions}
                          filterActive
                          placeholder="Select a Vendor"
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(value) => field.onChange(value ? Number(value) : '')}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dcNumber">DC Number</Label>
                    <Input id="dcNumber" {...register('dcNumber')} placeholder="Enter DC Number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dcDate">DC Date</Label>
                    <input
                      id="dcDate"
                      {...register('dcDate')}
                      type="date"
                      className="input mt-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="millInvNo">Yarn Mill Inv. No</Label>
                    <Input id="millInvNo" {...register('millInvNo')} placeholder="Enter Yarn Mill Inv. No" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="millDate">Yarn Mill Date</Label>
                    <input
                      id="millDate"
                      {...register('millDate')}
                      type="date"
                      className="input mt-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icilInvNo">ICIL Inv. No</Label>
                    <Input id="icilInvNo" {...register('icilInvNo')} placeholder="Enter ICIL Inv. No" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icilInvDate">ICIL Inv. Date</Label>
                    <input
                      id="icilInvDate"
                      {...register('icilInvDate')}
                      type="date"
                      className="input mt-1"
                    />
                  </div>
                </>
              )}
              <div className={`flex flex-wrap gap-2 ${selectedGoodsType === 'Yarn' ? 'col-span-full' : ''}`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={EXCEL_ALLOWED_EXTENSIONS.join(',')}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canUseTemplateActions}
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2"
                >
                  <FileDown size={16} />
                  Template
                </Button>
                <Button
                  type="button"
                  disabled={!canUseTemplateActions || isImporting}
                  onClick={handleUploadButtonClick}
                  className="flex items-center gap-2"
                >
                  <Upload size={16} />
                  {isImporting ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
                 {/* UOM - Only show for Yarn */}
              {/* {selectedGoodsType === 'Yarn' && (
                <div className="space-y-2">
                  <Label htmlFor="uom">UOM *</Label>
                  <Controller
                    name="uomId"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full border rounded px-3 py-2"
                        id="uom"
                      >
                        <option value="">Select UOM</option>
                        {uomList && uomList.map((uom: any) => (
                          <option key={uom.id} value={uom.id}>
                            {uom.uomName || uom.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              )} */}
            </div>
          </CardContent>
        </Card>

        {/* FABRIC ITEMS TABLE */}
        {selectedGoodsType === 'Fabric' && (
          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>Fabric Items</CardTitle>
              
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Sort No *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">
                        {isPacked === 'Yes' ? 'Roll/Bale Packing no' : 'Is Inspected'}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Piece No *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Piece Meter *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Net Weight *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Avg Weight</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Grade</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Existing Fabric Items */}
                    {fabricItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">
                          <CommonSearchableSelect
                            options={fabricOptions}
                            placeholder="Select Fabric"
                            value={item.fabricCodeId ? String(item.fabricCodeId) : ''}
                            onValueChange={(value) => {
                              const updatedItems = [...fabricItems];
                              const selected = normalizedFabricMasterList.find((fabric: any) => String(fabric.id) === value);
                              updatedItems[index] = {
                                ...updatedItems[index],
                                fabricCodeId: value ? Number(value) : '',
                                fabricCode: selected?.fabricCode || '',
                                quality: selected?.fabricQuality || selected?.quality || '',
                                fabricTypeId: selected?.fabricType || selected?.fabricTypeId || selected?.fabric_type_id || ''
                              };
                              setFabricItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>

                        <td className="border border-gray-300 px-3 py-2">
                          {isPacked === 'Yes' ? (
                            <Input
                              placeholder="Packing no"
                              value={item.packingNo || ''}
                              onChange={(e) => {
                                const updatedItems = [...fabricItems];
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  packingNo: e.target.value
                                };
                                setFabricItems(updatedItems);
                              }}
                              className="w-full"
                            />
                          ) : (
                            <CommonSearchableSelect
                              options={YES_NO_SELECT_OPTIONS}
                              placeholder="Select"
                              value={item.isInspected || 'No'}
                              onValueChange={(value) => {
                                const updatedItems = [...fabricItems];
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  isInspected: value
                                };
                                setFabricItems(updatedItems);
                              }}
                              className="w-full"
                            />
                          )}
                        </td>

                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            placeholder="Piece no"
                            value={item.pieceNo || ''}
                            onChange={(e) => {
                              const updatedItems = [...fabricItems];
                              updatedItems[index] = {
                                ...updatedItems[index],
                                pieceNo: e.target.value
                              };
                              setFabricItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>

                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            type="number"
                            placeholder="Meters"
                            value={item.pieceMeter || ''}
                            onChange={(e) => {
                              const updatedItems = [...fabricItems];
                              const pieceMeter = parseFloat(e.target.value);
                              const netWeight = updatedItems[index].netWeight;
                              const avgWeight = pieceMeter && netWeight ? parseFloat((netWeight / pieceMeter).toFixed(4)) : 0;

                              updatedItems[index] = {
                                ...updatedItems[index],
                                pieceMeter: pieceMeter,
                                avgWeight: avgWeight
                              };
                              setFabricItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>

                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            type="number"
                            placeholder="Net weight"
                            value={item.netWeight || ''}
                            onChange={(e) => {
                              const updatedItems = [...fabricItems];
                              const netWeight = parseFloat(e.target.value);
                              const pieceMeter = updatedItems[index].pieceMeter;
                              const avgWeight = pieceMeter && netWeight ? parseFloat((netWeight / pieceMeter).toFixed(4)) : 0;

                              updatedItems[index] = {
                                ...updatedItems[index],
                                netWeight: netWeight,
                                avgWeight: avgWeight
                              };
                              setFabricItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>

                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            type="number"
                            placeholder="Auto"
                            disabled
                            value={item.avgWeight || ''}
                            className="w-full bg-gray-100"
                          />
                        </td>

                        <td className="border border-gray-300 px-3 py-2">
                          <CommonSearchableSelect
                            options={gradeSelectOptions}
                            filterActive
                            placeholder="Select Grade"
                            value={item.gradeId ? String(item.gradeId) : ''}
                            onValueChange={(value) => {
                              const updatedItems = [...fabricItems];
                              const selectedGrade = gradeList.find((g: any) => String(g.id) === value);
                              updatedItems[index] = {
                                ...updatedItems[index],
                                gradeId: value ? parseInt(value) : '',
                                gradeName: selectedGrade?.name || selectedGrade?.gradeName || ''
                              };
                              setFabricItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>

                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {item.isInspected === 'Yes' ? (
                            <div className="flex justify-center">
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                                Inspected
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditFabricItem(item)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFabricItem(item.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Input Row for New Fabric Item */}
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">
                        <CommonSearchableSelect
                          options={fabricOptions}
                          placeholder="Select Fabric"
                          value={fabricDraft.fabricCodeId ? String(fabricDraft.fabricCodeId) : ''}
                          onValueChange={(value) => {
                            const selected = normalizedFabricMasterList.find((fabric: any) => String(fabric.id) === value);
                            setFabricDraft({
                              ...fabricDraft,
                              fabricCodeId: value ? Number(value) : '',
                              fabricCode: selected?.fabricCode || '',
                              quality: selected?.fabricQuality || selected?.quality || ''
                            });
                          }}
                          className="w-full"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        {isPacked === 'Yes' ? (
                          <Input
                            placeholder="Packing no"
                            value={fabricDraft.packingNo || ''}
                            onChange={(e) =>
                              setFabricDraft({ ...fabricDraft, packingNo: e.target.value })
                            }
                            className="w-full input"
                          />
                        ) : (
                          <CommonSearchableSelect
                            options={YES_NO_SELECT_OPTIONS}
                            placeholder="Select"
                            value={fabricDraft.isInspected || 'No'}
                            onValueChange={(value) =>
                              setFabricDraft({ ...fabricDraft, isInspected: value })
                            }
                            className="w-full"
                          />
                        )}
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          placeholder="Piece no"
                          value={fabricDraft.pieceNo || ''}
                          onChange={(e) =>
                            setFabricDraft({ ...fabricDraft, pieceNo: e.target.value })
                          }
                          className="w-full input"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          placeholder="Meters"
                          value={fabricDraft.pieceMeter || ''}
                          onChange={(e) =>
                            setFabricDraft({ ...fabricDraft, pieceMeter: parseFloat(e.target.value) })
                          }
                          className="w-full input"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          placeholder="Net weight"
                          value={fabricDraft.netWeight || ''}
                          onChange={(e) =>
                            setFabricDraft({ ...fabricDraft, netWeight: parseFloat(e.target.value) })
                          }
                          className="w-full input"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          placeholder="Auto"
                          disabled
                          value={
                            (fabricDraft.netWeight && fabricDraft.pieceMeter)
                              ? (fabricDraft.netWeight / fabricDraft.pieceMeter).toFixed(4)
                              : (fabricDraft.avgWeight || '')
                          }
                          className="w-full bg-gray-100 input"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <CommonSearchableSelect
                          options={gradeSelectOptions}
                          filterActive
                          placeholder="Select Grade"
                          value={fabricDraft.gradeId ? String(fabricDraft.gradeId) : ''}
                          onValueChange={(value) =>
                            setFabricDraft({
                              ...fabricDraft,
                              gradeId: value ? parseInt(value) : '',
                              gradeName: gradeList.find((g: any) => String(g.id) === value)?.name || ''
                            })
                          }
                          className="w-full"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <Button
                          type="button"
                          onClick={handleAddFabricItem}
                          size="sm"
                        >
                          <Plus size={16} />
                        </Button>
                      </td>
                    </tr>


                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* YARN ITEMS TABLE */}
        {selectedGoodsType === 'Yarn' && (
          <Card>
            <CardHeader>
              <CardTitle>Yarn Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Yarn Name *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Mill Name</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Yarn Type</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">No. of Carton/Pallet</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Kgs/Bag </th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Cones/Bag</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Cones Weight</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Total Kg*</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Lot No *</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Existing Yarn Items */}
                    {yarnItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">{item.yarnName}</td>
                        <td className="border border-gray-300 px-3 py-2">{item.millName}</td>
                        <td className="border border-gray-300 px-3 py-2">
                          {YARN_TYPE_OPTIONS.find((option) => option.value === String(item.yarnTypeId))?.label || '—'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">{item.noOfBags}</td>
                        <td className="border border-gray-300 px-3 py-2">{item.kgsPerBag}</td>
                        <td className="border border-gray-300 px-3 py-2">{item.conesPerBag || 0}</td>
                        <td className="border border-gray-300 px-3 py-2">{item.conesWeight || 0}</td>
                        {/* <td className="border border-gray-300 px-3 py-2">{item.totalKg}</td> */}
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            type="number"
                            placeholder="Total Kg"
                            value={item.totalKg || ''}
                            onChange={(e) => {
                              const updatedItems = [...yarnItems];
                              updatedItems[index] = {
                                ...updatedItems[index],
                                totalKg: parseFloat(e.target.value) || 0
                              };
                              setYarnItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">{item.lotNumber}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditYarnItem(item)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteYarnItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Input Row for New Yarn */}
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">
                        <CommonSearchableSelect
                          options={yarnOptions}
                          filterActive
                          placeholder="Select Yarn"
                          value={yarnDraft.yarnId ? String(yarnDraft.yarnId) : ''}
                          onValueChange={(value) => {
                            const selectedYarn = normalizedYarnList.find((y: any) => String(y.id) === value);
                            setYarnDraft({
                              ...yarnDraft,
                              yarnId: value ? Number(value) : '',
                              yarnName: selectedYarn ? (selectedYarn.yarnName || selectedYarn.name || '') : ''
                            });
                          }}
                          className="w-full"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <CommonSearchableSelect
                          options={millSelectOptions}
                          placeholder="Select Mill"
                          value={yarnDraft.millId ? String(yarnDraft.millId) : ''}
                          onValueChange={(value) => {
                            const selectedMill = millOptions.find((mill: any) => String(mill.id) === value);
                            setYarnDraft({
                              ...yarnDraft,
                              millId: value ? Number(value) : '',
                              millName: selectedMill?.subCategoryName || ''
                            });
                          }}
                          className="w-full"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <CommonSearchableSelect
                          options={YARN_TYPE_OPTIONS}
                          placeholder="Select Type"
                          value={yarnDraft.yarnTypeId ? String(yarnDraft.yarnTypeId) : ''}
                          onValueChange={(value) => setYarnDraft({
                            ...yarnDraft,
                            yarnTypeId: value ? Number(value) : ''
                          })}
                          className="w-full"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          placeholder="Carton/Pallet"
                          value={yarnDraft.noOfBags || ''}
                          onChange={(e) => {
                            const noOfBags = parseFloat(e.target.value) || 0;
                            setYarnDraft({
                              ...yarnDraft,
                              noOfBags
                              // Remove the auto-calculation: totalKg: noOfBags * kgsPerBag
                            });
                          }}
                          className="w-full input"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          placeholder="Kgs/Bag"
                          value={yarnDraft.kgsPerBag || ''}
                          onChange={(e) => {
                            const kgsPerBag = parseFloat(e.target.value) || 0;
                            const noOfBags = yarnDraft.noOfBags || 0;
                            setYarnDraft({
                              ...yarnDraft,
                              kgsPerBag,
                              totalKg: noOfBags * kgsPerBag
                            });
                          }}
                          className="w-full input"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          placeholder="Cones/Bag"
                          value={yarnDraft.conesPerBag || ''}
                          onChange={(e) => setYarnDraft({
                            ...yarnDraft,
                            conesPerBag: parseFloat(e.target.value) || 0
                          })}
                          className="w-full input"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          placeholder="Cones Weight"
                          value={yarnDraft.conesWeight || ''}
                          onChange={(e) => setYarnDraft({
                            ...yarnDraft,
                            conesWeight: parseFloat(e.target.value) || 0
                          })}
                          className="w-full input"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          placeholder="Total Kg"
                          value={yarnDraft.totalKg || ''}
                          onChange={(e) => setYarnDraft({ ...yarnDraft, totalKg: parseFloat(e.target.value) })}
                          className="w-full input"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          placeholder="Lot Number"
                          value={yarnDraft.lotNumber || ''}
                          onChange={(e) => setYarnDraft({ ...yarnDraft, lotNumber: e.target.value })}
                          className="w-full input"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <Button type="button" onClick={handleAddYarnItem} size="sm">
                          <Plus size={16} />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ITEM GOODS TABLE */}
        {selectedGoodsType === 'Item' && (
          <Card>
            <CardHeader>
              <CardTitle>Item Goods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Item Name *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">No of Bags</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Kgs/Bag</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Accepted Qty *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Lot No</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemGoodsItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">
                          <CommonSearchableSelect
                            options={itemOptions}
                            filterActive
                            placeholder="Select Item"
                            value={item.itemId ? String(item.itemId) : ''}
                            onValueChange={(value) => {
                              const updatedItems = [...itemGoodsItems];
                              const selected = normalizedItemList.find((i: any) => String(i?.id) === value);
                              updatedItems[index] = { ...updatedItems[index], itemId: value ? Number(value) : '', itemName: selected?.itemName || selected?.name || '' };
                              setItemGoodsItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            type="number"
                            placeholder="No of Bags"
                            value={item.noOfBags || ''}
                            onChange={(e) => {
                              const updatedItems = [...itemGoodsItems];
                              updatedItems[index] = { ...updatedItems[index], noOfBags: parseFloat(e.target.value) || 0 };
                              setItemGoodsItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            type="number"
                            placeholder="Kgs/Bag"
                            value={item.kgsPerBag || ''}
                            onChange={(e) => {
                              const updatedItems = [...itemGoodsItems];
                              updatedItems[index] = { ...updatedItems[index], kgsPerBag: parseFloat(e.target.value) || 0 };
                              setItemGoodsItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            type="number"
                            placeholder="Accepted Qty"
                            value={item.acceptedQty || ''}
                            onChange={(e) => {
                              const updatedItems = [...itemGoodsItems];
                              updatedItems[index] = { ...updatedItems[index], acceptedQty: parseFloat(e.target.value) || 0 };
                              setItemGoodsItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            placeholder="Lot No"
                            value={item.lotNo || ''}
                            onChange={(e) => {
                              const updatedItems = [...itemGoodsItems];
                              updatedItems[index] = { ...updatedItems[index], lotNo: e.target.value };
                              setItemGoodsItems(updatedItems);
                            }}
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button type="button" onClick={() => handleEditItemGoodsItem(item)} className="text-blue-600 hover:text-blue-800" title="Edit">
                              <Edit size={18} />
                            </button>
                            <button type="button" onClick={() => handleDeleteItemGoodsItem(item.id)} className="text-red-600 hover:text-red-800" title="Delete">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Input Row for New Item */}
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">
                        <CommonSearchableSelect
                          options={itemOptions}
                          filterActive
                          placeholder="Select Item"
                          value={itemGoodsDraft.itemId ? String(itemGoodsDraft.itemId) : ''}
                          onValueChange={(value) => {
                            const selected = normalizedItemList.find((i: any) => String(i?.id) === value);
                            setItemGoodsDraft({ ...itemGoodsDraft, itemId: value ? Number(value) : '', itemName: selected?.itemName || selected?.name || '' });
                          }}
                          className="w-full"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          placeholder="No of Bags"
                          value={itemGoodsDraft.noOfBags || ''}
                          onChange={(e) => setItemGoodsDraft({ ...itemGoodsDraft, noOfBags: parseFloat(e.target.value) || 0 })}
                          className="w-full input"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          placeholder="Kgs/Bag"
                          value={itemGoodsDraft.kgsPerBag || ''}
                          onChange={(e) => setItemGoodsDraft({ ...itemGoodsDraft, kgsPerBag: parseFloat(e.target.value) || 0 })}
                          className="w-full input"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          placeholder="Accepted Qty"
                          value={itemGoodsDraft.acceptedQty || ''}
                          onChange={(e) => setItemGoodsDraft({ ...itemGoodsDraft, acceptedQty: parseFloat(e.target.value) || 0 })}
                          className="w-full input"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          placeholder="Auto-generated if empty"
                          value={itemGoodsDraft.lotNo || ''}
                          onChange={(e) => setItemGoodsDraft({ ...itemGoodsDraft, lotNo: e.target.value })}
                          className="w-full input"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <Button type="button" onClick={handleAddItemGoodsItem} size="sm">
                          <Plus size={16} />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Section */}
        {(fabricItems.length > 0 || yarnItems.length > 0 || itemGoodsItems.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">S.No</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">
                        {selectedGoodsType === 'Fabric' ? 'Fabric Name' : selectedGoodsType === 'Yarn' ? 'Yarn Name' : 'Item Name'}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left">
                        {selectedGoodsType === 'Fabric' ? 'No. of Pieces' : 'No. of Bags'}
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGoodsType === 'Fabric' ? (
                      fabricSummaryRows.map((row, index) => (
                        <tr key={row.key} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.label}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.pieces}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.totalPieceMeter} m</td>
                        </tr>
                      ))
                    ) : selectedGoodsType === 'Yarn' ? (
                      yarnSummaryRows.map((row, index) => (
                        <tr key={row.key} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.label}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.totalBags}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.totalKg}</td>
                        </tr>
                      ))
                    ) : (
                      itemGoodsSummaryRows.map((row, index) => (
                        <tr key={row.key} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.label}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.noOfBags}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.totalAcceptedQty}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/transaction/opening-balance')}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex items-center gap-2">
            <Save size={18} />
            {isEdit ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}