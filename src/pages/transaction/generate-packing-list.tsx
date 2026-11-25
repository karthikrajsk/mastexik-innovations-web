import React, { useEffect, useState, useMemo, useRef } from "react";
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllCities } from "@/state/citySlice";
import { getAllStates } from "@/state/stateSlice";
import { getAllCountries } from "@/state/countrySlice";
import { getAllBrushingReceivesByCompany } from "@/state/brushingSlice";
import { getAllBaleRollPackings } from "@/state/baleRollPackingSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId, getWeavingJobWorkOrderById } from "@/state/weavingJobWorkOrderSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllTransports } from "@/state/transportSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import CommonSearchableSelect, { CommonSearchableSelectOption } from "@/components/ui/CommonSearchableSelect";
import { 
  createGeneratePacking, 
  updateGeneratePacking,
  getAllGeneratePacking  
} from "@/state/generatePackingSlice";
import { documentNumberService } from "@/services/DocumentNumberService";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { useFilteredWarehouseOptions } from "@/hooks/useFilteredWarehouseOptions";
import { PopupDataTable, PopupColumn } from "@/components/data/PopupDataTable";

interface BaleRoll {
  id: number;
  rollNo: string;
  pieceNo: string;
  meters: number;
  yards: number;
  netWeight: number;
  avgWt: number;
  grossWt: number;
  fabricCode: string;
  warehouse: number;
  grade?: string;
  uomId?: number | null;
  invoiceNo?: string;
  hfplRollNo?: string;
  remarks?: string;
  construction?: string;
}

interface SelectedBale {
  id?: number | string | null;
  rollNo: string;
  pieceNo: string;
  meters: number;
  yards: number;
  netWeight: number;
  avgWt: number;
  grossWt: number;
  uomId?: number | null;
  hfplRollNo?: string;
  invoiceNo?: string;
  remarks?: string;
}

interface PackingDetailsFormData {
  // Form state fields from the Packing Details section
  clothDate: string;
  orderType: string;
  orderTypeId: number | null;
  isJobwork: boolean;
  isJobworkChecked: boolean;
  orderNo: string;
  buyerName: string;
  buyerId: string;
  deliveryAt: string;
  selectedConsigneeId: number | null;
  fabricCode: string;
  fabricCodeId: number | null;
  fabricQuality: string;
  remarks: string;
  warehouse: string;
  hasManualWarehouseSelection: boolean;
  packingSlipNo?: string; // Uncomment if you're using this field
  isBrushChecked?: boolean;
  poNo?: string;
  poDate?: string;
  dcNo?: string;
  transportId: number | null;
  truckNo: string;
  lrNo: string;
  lrDate: string;
  invoiceNo: string;
  invoiceDate: string;
}

// Helper function to convert meters to yards
const toYards = (meters: number) => Number(((meters || 0) * 1.094).toFixed(3));

const resolvePositiveNumber = (value: any) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

const resolvePackingOrderTypeId = (packing: any) => {
  const numeric = resolvePositiveNumber(packing?.orderTypeId ?? packing?.orderType ?? packing?.order_type_id);
  if (numeric) return numeric;
  const text = String(packing?.orderType ?? packing?.order_type ?? '').toLowerCase();
  if (text.includes('export')) return 2;
  if (text.includes('domestic')) return 1;
  return null;
};

const resolvePackingWeavingOrderId = (packing: any) => resolvePositiveNumber(
  packing?.weavingWorkOrderId ??
  packing?.weaving_work_order_id ??
  packing?.weavingOrderId ??
  packing?.jobWorkOrderId
);

const resolvePackingSalesOrderId = (packing: any) => resolvePositiveNumber(
  packing?.salesOrderId ??
  packing?.sales_order_id ??
  packing?.orderId ??
  packing?.order_id
);

const resolvePackingWeavingOrderNumber = (source: any) => {
  const value = source?.weavingWorkOrderNo ??
    source?.jobWorkOrderNo ??
    source?.orderNo ??
    source?.weaving_work_order_no ??
    source?.job_work_order_no ??
    source?.order_no ?? '';
  return String(value ?? '').trim();
};

const resolvePackingSalesOrderNumber = (source: any) => {
  const value = source?.salesOrderNo ??
    source?.internalOrderNo ??
    source?.orderNo ??
    source?.sales_order_no ??
    source?.internal_order_no ??
    source?.order_no ?? '';
  return String(value ?? '').trim();
};

const resolvePackingCompanyId = (packing: any) => resolvePositiveNumber(
  packing?.companyId ??
  packing?.factoryCompanyId ??
  packing?.factory?.companyId ??
  packing?.company?.id ??
  packing?.factoryCompany?.id
);

const resolveIsPackingJobwork = (packing: any) => Number(packing?.isJobwork ?? packing?.is_jobwork ?? 0) === 1;

const extractPackingItems = (packing: any) => {
  const candidates = [
    packing?.items,
    packing?.items?.data,
    packing?.items?.rows,
    packing?.packingItems,
    packing?.packingItems?.data,
    packing?.packingItems?.rows,
    packing?.generatePackingItems,
    packing?.generatePackingItems?.data,
    packing?.generatePackingItems?.rows,
    packing?.selectedPieces,
    packing?.selectedBales,
    packing?.pieceDetails,
    packing?.piece_details
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const mapPackingItemsToSelectedBales = (packing: any): SelectedBale[] => {
  const isBrushChecked = Number(packing?.isBrushChecked ?? 0) === 1;
  const rollNumber = packing?.rollOrBaleNo ?? '';
  const rawItems = extractPackingItems(packing);
  return rawItems.map((item: any) => {
    const meters = Number(item.length ?? item.meters ?? item.meter ?? item.quantity ?? 0) || 0;
    const yardsValue = item.yards ?? item.yard ?? item.quantityInYards ?? null;
    const yards = yardsValue != null && yardsValue !== ''
      ? Number(yardsValue) || 0
      : (meters ? toYards(meters) : 0);
    const netWeight = Number(
      item.pounds ??
      item.netWeight ??
      item.net_weight ??
      item.actualNetWeight ??
      item.actual_net_weight ??
      item.weight ??
      0
    ) || 0;
    const avgWeightRaw = item.avgWt ?? item.avg_weight ?? item.avgWeight ?? item.avgwt ?? null;
    const avgWt = avgWeightRaw != null && avgWeightRaw !== ''
      ? Number(avgWeightRaw) || 0
      : (meters ? Number((netWeight / meters).toFixed(3)) : 0);
    const grossWt = Number(item.grossWt ?? item.gross_weight ?? item.grossWeight ?? 0) || 0;
    const uomId = item.uomId ?? item.uom_id ?? packing?.uomId ?? null;
    const invoiceNo = item.invoiceNo || item.invoice_no || item.refInvoiceNo || item.ref_invoice_no || packing?.refInvoiceNo || packing?.invoiceNo || '';
    return {
      id: isBrushChecked ? (item.pieceId ?? item.piece_id ?? null) : (item.id || null),
      rollNo: isBrushChecked ? "" : (item.rollNo || item.roll_no || item.baleNo || rollNumber),
      pieceNo: item.pieceNo || item.piece_no || item.pieceNumber || item.piece_number || '',
      meters,
      yards,
      netWeight,
      avgWt,
      grossWt,
      uomId: uomId != null ? Number(uomId) : null,
      hfplRollNo: isBrushChecked ? (item.rollNo || item.roll_no || '') : '',
      invoiceNo,
      remarks: item.remarks || item.remarksText || ''
    };
  });
};

const findRollNoForPiece = (pieceNo: string, balePackings: any[]) => {
  if (!pieceNo) return "";
  const cleanPiece = pieceNo.trim().toLowerCase();
  for (const packing of balePackings) {
    const items = extractPackingItems(packing);
    const hasPiece = items.some((item: any) => {
      const pNo = item.pieceNo || item.piece_no || item.pieceNumber || item.piece_number || "";
      return pNo.trim().toLowerCase() === cleanPiece;
    });
    if (hasPiece) {
      return packing.rollOrBaleNo || packing.roll_or_bale_no || "";
    }
  }
  return "";
};

const isPieceSelected = (id: number | string, rollNo: string, pieceNo: string, selectedBales: SelectedBale[], isBrushChecked?: boolean) => {
  if (isBrushChecked) {
    if (id == null) return false;
    return selectedBales.some(sb => sb.id != null && String(sb.id) === String(id));
  }
  if (!rollNo || !pieceNo) return false;
  const cleanRoll = rollNo.trim().toLowerCase();
  const cleanPiece = pieceNo.trim().toLowerCase();
  
  return selectedBales.some(sb => {
    if ((sb.rollNo || '').trim().toLowerCase() !== cleanRoll) return false;
    const pieces = sb.pieceNo ? sb.pieceNo.split(',').map(p => p.trim().toLowerCase()) : [];
    return pieces.includes(cleanPiece);
  });
};

const PackingList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const packingFromState = location.state?.packing;
  const fabricInspectionSelection = location.state?.fabricInspectionSelection;
  
  // Redux state
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const normalizedWarehouseList = useMemo(() => {
    const raw = (warehouseList?.data ?? warehouseList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [warehouseList]);
  const { filteredWarehouseOptions: warehouseSelectOptions, defaultWarehouseId } = useFilteredWarehouseOptions(warehouseList, "Fabric");
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { cityList } = useSelector((state: RootState) => state.city);
  const { stateList } = useSelector((state: RootState) => state.state);
  const { countryList } = useSelector((state: RootState) => state.country);
  const { list: baleRollPackingList } = useSelector((state: RootState) => state.baleRollPacking as any);
  const { generatePackingList } = useSelector((state: RootState) => state.generatePacking as any);
  const { consigneeList } = useSelector((state: RootState) => state.consignee as any);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { brushingReceivesList = [] } = useSelector((state: RootState) => state.brushing || {});
  const { transportList } = useSelector((state: RootState) => state.transport);
  const { selectedCompany, user } = useAuth();
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
  
  // Component states
  const [showBalePopup, setShowBalePopup] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(packingFromState?.id ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  // Form states - now using PackingDetailsFormData interface
  const [formData, setFormData] = useState<PackingDetailsFormData>({
    clothDate: new Date().toISOString().split('T')[0],
    orderType: "",
    orderTypeId: null,
    isJobwork: false,
    isJobworkChecked: false,
    orderNo: "",
    buyerName: "",
    buyerId: "",
    deliveryAt: "",
    selectedConsigneeId: null,
    fabricCode: "",
    fabricCodeId: null,
    fabricQuality: "",
    remarks: "",
    warehouse: "",
    hasManualWarehouseSelection: false,
    // packingSlipNo: "",
    isBrushChecked: false,
    poNo: "",
    poDate: "",
    dcNo: "",
    transportId: null,
    truckNo: "",
    lrNo: "",
    lrDate: "",
    invoiceNo: "",
    invoiceDate: "",
  });

  // Update individual form fields
  const updateFormField = <K extends keyof PackingDetailsFormData>(
    field: K,
    value: PackingDetailsFormData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Convenience getters for form data
  const {
    clothDate,
    orderType,
    orderTypeId,
    isJobwork,
    isJobworkChecked,
    orderNo,
    buyerName,
    buyerId,
    deliveryAt,
    selectedConsigneeId,
    fabricCode,
    fabricCodeId,
    fabricQuality,
    remarks,
    warehouse,
    hasManualWarehouseSelection,
    // packingSlipNo,
    isBrushChecked,
    poNo,
    poDate,
    dcNo,
    transportId,
    truckNo,
    lrNo,
    lrDate,
    invoiceNo,
    invoiceDate,
  } = formData;

  const handleBrushCheckedChange = (checked: boolean) => {
    updateFormField('isBrushChecked', checked);
    if (checked) {
      updateFormField('warehouse', "");
      updateFormField('hasManualWarehouseSelection', false);
      updateFormField('isJobworkChecked', false);
      updateFormField('isJobwork', false);
      updateFormField('orderNo', "");
    } else {
      updateFormField('dcNo', "");
    }
  };

  // Automatically sync brushing based on user role during creation
  useEffect(() => {
    if (!editingId && user?.role === 'Brushing') {
      updateFormField('isBrushChecked', true);
      updateFormField('warehouse', "");
      updateFormField('hasManualWarehouseSelection', false);
      updateFormField('isJobworkChecked', false);
      updateFormField('isJobwork', false);
      updateFormField('orderNo', "");
    }
  }, [user, editingId]);

  const methods = useForm<PackingDetailsFormData>({
          mode: 'onChange',
          defaultValues: {
              packingSlipNo: '',
          }
      });
  // Add separate state for jobwork checkbox
  // [Removed - now part of formData]
    const { register, watch, setValue, handleSubmit, formState: { errors }, trigger, reset } = methods;
  // Selected bales/rolls
  const [selectedBales, setSelectedBales] = useState<SelectedBale[]>([]);
  const [tempSelectedBales, setTempSelectedBales] = useState<number[]>([]);
  const [availableBaleRolls, setAvailableBaleRolls] = useState<BaleRoll[]>([]);
  const [popupRollNoFilter, setPopupRollNoFilter] = useState('');
  const [popupFabricCodeFilter, setPopupFabricCodeFilter] = useState('');
  const [popupInvoiceNoFilter, setPopupInvoiceNoFilter] = useState('');
  const [popupSearchQuery, setPopupSearchQuery] = useState('');
  
  // Available options for dropdowns
  const [availableFabricCodes, setAvailableFabricCodes] = useState<any[]>([]);
  const [selectedWeavingOrder, setSelectedWeavingOrder] = useState<any>(null);
  const [fetchedWeavingOrder, setFetchedWeavingOrder] = useState<any>(null);

  const uniqueRollNoOptions = useMemo<CommonSearchableSelectOption[]>(() => {
    const uniqueRolls = new Set<string>();
    availableBaleRolls.forEach((bale) => {
      const val = bale.rollNo;
      if (val) {
        uniqueRolls.add(val);
      }
    });
    return Array.from(uniqueRolls).map((roll) => ({
      id: roll,
      value: roll,
      label: roll
    }));
  }, [availableBaleRolls]);

  const uniqueFabricCodeOptions = useMemo<CommonSearchableSelectOption[]>(() => {
    const uniqueCodes = new Set<string>();
    const raw = (fabricMasterList?.data ?? fabricMasterList) || [];
    const list = Array.isArray(raw) ? raw : [];
    list.forEach((f: any) => {
      if (f.fabricCode) {
        uniqueCodes.add(f.fabricCode);
      }
    });
    return Array.from(uniqueCodes).map((code) => ({
      id: code,
      value: code,
      label: code
    }));
  }, [fabricMasterList]);

  const uniqueInvoiceNoOptions = useMemo<CommonSearchableSelectOption[]>(() => {
    const uniqueInvoices = new Set<string>();
    availableBaleRolls.forEach((bale) => {
      if (bale.invoiceNo) {
        uniqueInvoices.add(bale.invoiceNo);
      }
    });
    return Array.from(uniqueInvoices).map((inv) => ({
      id: inv,
      value: inv,
      label: inv
    }));
  }, [availableBaleRolls]);

  const filteredAvailableBaleRolls = useMemo(() => {
    let result = availableBaleRolls;
    if (popupRollNoFilter) {
      result = result.filter((bale) => String(bale.rollNo) === popupRollNoFilter);
    }
    if (popupFabricCodeFilter) {
      result = result.filter((bale) => String(bale.fabricCode) === popupFabricCodeFilter);
    }
    if (popupInvoiceNoFilter) {
      result = result.filter((bale) => String(bale.invoiceNo || '') === popupInvoiceNoFilter);
    }
    if (popupSearchQuery) {
      const query = popupSearchQuery.toLowerCase().trim();
      result = result.filter((bale) => {
        return (
          String(bale.hfplRollNo || '').toLowerCase().includes(query) ||
          String(bale.rollNo || '').toLowerCase().includes(query) ||
          String(bale.pieceNo || '').toLowerCase().includes(query) ||
          String(bale.construction || '').toLowerCase().includes(query) ||
          String(bale.invoiceNo || '').toLowerCase().includes(query) ||
          String(bale.remarks || '').toLowerCase().includes(query)
        );
      });
    }
    return result;
  }, [availableBaleRolls, popupRollNoFilter, popupFabricCodeFilter, popupInvoiceNoFilter, popupSearchQuery]);

  const brushedColumns = useMemo<PopupColumn[]>(() => [
    {
      id: 'select',
      disableFilters: true,
      Header: (
        <Checkbox
        className="cursor-pointer bg-white border-gray-300 text-primary hover:bg-primary hover:text-white focus:ring-2 focus:ring-offset-0 focus:ring-primary"
          checked={
            filteredAvailableBaleRolls.length > 0 &&
            filteredAvailableBaleRolls.every(b => tempSelectedBales.includes(b.id))
          }
          onCheckedChange={(checked) => {
            if (checked) {
              const visibleIds = filteredAvailableBaleRolls.map(b => b.id);
              setTempSelectedBales(prev => Array.from(new Set([...prev, ...visibleIds])));
            } else {
              const visibleIds = new Set(filteredAvailableBaleRolls.map(b => b.id));
              setTempSelectedBales(prev => prev.filter(id => !visibleIds.has(id)));
            }
          }}
        />
      ),
      Cell: ({ row }) => (
        <Checkbox
          checked={tempSelectedBales.includes(row.id)}
          onCheckedChange={() => handleBaleCheckbox(row.id)}
          className="cursor-pointer bg-white border-gray-300 text-primary hover:bg-primary hover:text-white focus:ring-2 focus:ring-offset-0 focus:ring-primary"
        />
      )
    },
    {
      id: 'serialNo',
      Header: 'S.No',
      disableFilters: true,
      Cell: ({ index }) => index + 1
    },
    {
      id: 'hfplRollNo',
      Header: 'HFPL Roll No',
      accessor: 'hfplRollNo',
      Cell: ({ value }) => value || '-'
    },
    {
      id: 'construction',
      Header: 'Construction',
      accessor: (row) => [row.fabricCode, row.construction].filter(Boolean).join(' - ') || '-',
    },
    {
      id: 'pieceNo',
      Header: 'Piece No',
      accessor: 'pieceNo',
      Cell: ({ value }) => value || '-'
    },
    {
      id: 'passMtr',
      Header: 'Pass Mtr',
      accessor: (row) => row.meters,
      Cell: ({ value }) => (Number(value) || 0).toFixed(2)
    },
    {
      id: 'grossWt',
      Header: 'Gross Wt',
      accessor: (row) => row.grossWt,
      Cell: ({ value }) => (Number(value) || 0).toFixed(2)
    },
    {
      id: 'netWeight',
      Header: 'Net Wt',
      accessor: (row) => row.netWeight,
      Cell: ({ value }) => (Number(value) || 0).toFixed(2)
    },
    {
      id: 'invoiceNo',
      Header: 'Ref.Inv.No',
      accessor: 'invoiceNo',
      Cell: ({ value }) => value || '-'
    },
    {
      id: 'remarks',
      Header: 'Remarks',
      accessor: 'remarks',
      Cell: ({ row }) => (
        <input
          type="text"
          value={row.remarks || ""}
          onChange={(e) => handleRemarkChange(row.id, e.target.value)}
          className="w-full border px-2 py-1 rounded text-sm"
          placeholder="Enter remark"
        />
      )
    }
  ], [filteredAvailableBaleRolls, tempSelectedBales]);

  const normalColumns = useMemo<PopupColumn[]>(() => [
    {
      id: 'select',
      disableFilters: true,
      Header: (
        <Checkbox
          checked={
            filteredAvailableBaleRolls.length > 0 &&
            filteredAvailableBaleRolls.every(b => tempSelectedBales.includes(b.id))
          }
          onCheckedChange={(checked) => {
            if (checked) {
              const visibleIds = filteredAvailableBaleRolls.map(b => b.id);
              setTempSelectedBales(prev => Array.from(new Set([...prev, ...visibleIds])));
            } else {
              const visibleIds = new Set(filteredAvailableBaleRolls.map(b => b.id));
              setTempSelectedBales(prev => prev.filter(id => !visibleIds.has(id)));
            }
          }}
        />
      ),
      Cell: ({ row }) => (
        <Checkbox
          checked={tempSelectedBales.includes(row.id)}
          onCheckedChange={() => handleBaleCheckbox(row.id)}
        />
      )
    },
    {
      id: 'serialNo',
      Header: 'S.No',
      disableFilters: true,
      Cell: ({ index }) => index + 1
    },
    {
      id: 'rollNo',
      Header: 'Roll No',
      accessor: 'rollNo',
      Cell: ({ value }) => value || '-'
    },
    {
      id: 'pieceNo',
      Header: 'Piece No',
      accessor: 'pieceNo',
      Cell: ({ value }) => value || '-'
    },
    {
      id: 'meters',
      Header: 'Meters',
      accessor: (row) => row.meters,
      Cell: ({ value }) => (Number(value) || 0).toFixed(2)
    },
    {
      id: 'yards',
      Header: 'Yards',
      accessor: (row) => row.yards,
      Cell: ({ value }) => (Number(value) || 0).toFixed(2)
    },
    {
      id: 'netWeight',
      Header: 'Net Weight',
      accessor: (row) => row.netWeight,
      Cell: ({ value }) => (Number(value) || 0).toFixed(2)
    },
    {
      id: 'avgWt',
      Header: 'Avg Wt',
      accessor: (row) => row.avgWt,
      Cell: ({ value }) => (Number(value) || 0).toFixed(3)
    },
    {
      id: 'grossWt',
      Header: 'Gross Wt',
      accessor: (row) => row.grossWt,
      Cell: ({ value }) => Number(value) > 0 ? (Number(value) || 0).toFixed(2) : '-'
    }
  ], [filteredAvailableBaleRolls, tempSelectedBales]);

  const applyWarehouseFromPackings = (packings: any[] = []) => {
    if (!packings.length) return;
    const firstPacking = packings[0];
    const packingWarehouseId = resolvePositiveNumber(firstPacking?.warehouseId ?? firstPacking?.warehouse_id);
    if (packingWarehouseId) {
      updateFormField('warehouse', String(packingWarehouseId));
      updateFormField('hasManualWarehouseSelection', false);
    }
  };

  const deriveWarehouseIdFromPackings = (packings: any[] = []) => {
    for (const packing of packings) {
      const packingWarehouseId = resolvePositiveNumber(
        packing?.warehouseId ??
        packing?.warehouse_id ??
        packing?.warehouse?.id ??
        packing?.warehouse?.warehouseId
      );
      if (packingWarehouseId) {
        return String(packingWarehouseId);
      }
    }
    return "";
  };

  // Helper function to get consignee name by ID
  const getConsigneeNameById = (consigneeId: number | null): string => {
    if (!consigneeId || !consigneeList) return "";
    const consignee = consigneeList.find((c: any) => c.id === consigneeId);
    return consignee ? (consignee.consigneeName || consignee.name || "") : "";
  };

  // Helper function to get consignee details by ID
  const getConsigneeById = (consigneeId: number | null): any => {
    if (!consigneeId || !consigneeList) return null;
    return consigneeList.find((c: any) => c.id === consigneeId);
  };

  const consigneeSelectOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (consigneeList || []).map((consignee: any) => ({
      id: String(consignee.id),
      value: String(consignee.id),
      label: `${consignee.consigneeName || consignee.name}${consignee.city ? ` - ${consignee.city}` : ''}`,
      activeFlag: consignee.activeFlag ?? true
    })),
    [consigneeList]
  );

  // Force refresh data when entering edit mode
  useEffect(() => {
    if (!editingId) {
      return;
    }

    if (resolvedCompanyId) {
           dispatch( getAllWeavingJobWorkOrdersByFactoryCompanyId({
                      factoryCompanyId: resolvedCompanyId,
                    }) as any);
      // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(resolvedCompanyId) as any);
      dispatch(getAllSalesOrders({ companyId: resolvedCompanyId }) as any);
    } else {
      dispatch(getAllWeavingJobWorkOrders({fetchAll: true}) as any);
      dispatch(getAllSalesOrders({fetchAll: true}) as any);
    }
  }, [editingId, resolvedCompanyId, dispatch]);

  useEffect(() => {
    if (orderTypeId === 2 && resolvedCompanyId) {
      dispatch(getAllSalesOrders({ companyId: resolvedCompanyId, fetchAll: true }) as any);
    } else if (orderTypeId === 1 || orderTypeId === null) {
      dispatch(getAllSalesOrders({ fetchAll: true }) as any);
    }
  }, [orderTypeId, resolvedCompanyId, dispatch]);



  useEffect(() => {
    if (!editingId && defaultWarehouseId && !hasManualWarehouseSelection && !warehouse) {
      updateFormField('warehouse', defaultWarehouseId);
    }
  }, [defaultWarehouseId, editingId, hasManualWarehouseSelection, warehouse]);


  const weavingOrders = useMemo(() => {
    const raw = (weavingJobWorkOrderList?.data ?? weavingJobWorkOrderList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [weavingJobWorkOrderList]);
  
// Fetch missing weaving order during edit if not in list
useEffect(() => {
  if (!editingId || !packingFromState?.weavingWorkOrderId || Number(packingFromState?.isJobwork ?? 0) !== 1) {
    return;
  }
  
  const exists = weavingOrders.some((wo: any) => String(wo.id) === String(packingFromState.weavingWorkOrderId));
  if (exists) {
    setFetchedWeavingOrder(null);
    return;
  }
  
  if (fetchedWeavingOrder && String(fetchedWeavingOrder.id) === String(packingFromState.weavingWorkOrderId)) {
    return;
  }
  
  const id = Number(packingFromState.weavingWorkOrderId);
  if (!id) return;
  
  console.log("Fetching missing weaving order:", id);
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
}, [editingId, packingFromState, weavingOrders, dispatch, fetchedWeavingOrder]);

  const handleOrderTypeChange = (value: string, options?: { skipReset?: boolean }) => {
    updateFormField('orderType', value);
    if (options?.skipReset) return;
    updateFormField('hasManualWarehouseSelection', false);
    updateFormField('isJobwork', false);
    updateFormField('isJobworkChecked', false);
    updateFormField('orderNo', "");
    updateFormField('buyerId', "");
    updateFormField('buyerName', "");
    updateFormField('selectedConsigneeId', null);
    updateFormField('deliveryAt', "");
    updateFormField('orderTypeId', null);
    setSelectedWeavingOrder(null);
    setFetchedWeavingOrder(null);
  };

  const handleJobworkChange = (checked: boolean, options?: { skipReset?: boolean }) => {
    updateFormField('isJobworkChecked', checked);
    updateFormField('isJobwork', checked);
    
    if (options?.skipReset) return;
    
    updateFormField('hasManualWarehouseSelection', false);
    updateFormField('orderNo', "");
    updateFormField('selectedConsigneeId', null);
    updateFormField('deliveryAt', "");
    updateFormField('buyerId', "");
    updateFormField('buyerName', "");
    updateFormField('fabricCode', "");
    updateFormField('fabricCodeId', null);
    updateFormField('fabricQuality', "");
    setSelectedWeavingOrder(null);
    setFetchedWeavingOrder(null);
  };

  const applyWeavingOrderSelection = (order: any | null) => {
    if (!order) {
      setSelectedWeavingOrder(null);
      updateFormField('orderNo', "");
      updateFormField('buyerId', "");
      updateFormField('buyerName', "");
      updateFormField('fabricCode', "");
      updateFormField('fabricCodeId', null);
      updateFormField('fabricQuality', "");
      updateFormField('deliveryAt', "");
      updateFormField('selectedConsigneeId', null);
      updateFormField('orderTypeId', null);
      return;
    }

    setSelectedWeavingOrder(order);
    updateFormField('orderNo', String(order.id ?? ""));
    
    // Set orderTypeId from the weaving order
    const typeId = order.orderTypeId ?? null;
    updateFormField('orderTypeId', typeId);

    const rawBuyerId = order.buyerId ?? order.buyerCustomerId ?? null;
    let resolvedBuyerName = "";
    if (rawBuyerId != null) {
      const buyerNumber = Number(rawBuyerId);
      if (!Number.isNaN(buyerNumber)) {
        updateFormField('buyerId', String(buyerNumber));
      } else {
        updateFormField('buyerId', "");
      }
      
      if (typeId === 1) {
        const matchedBuyer = customerArr.find((c: any) => c.id === buyerNumber);
        resolvedBuyerName = matchedBuyer ? (matchedBuyer.customerName || matchedBuyer.name || "") : (order.buyerName || "");
      } else {
        const matchedBuyer = customerArr.find((c: any) => c.id === buyerNumber);
        resolvedBuyerName = matchedBuyer ? (matchedBuyer.customerName || matchedBuyer.name || "") : (order.buyerName || "");
      }
      updateFormField('buyerName', resolvedBuyerName);
    } else {
      updateFormField('buyerId', "");
      resolvedBuyerName = order.buyerName || "";
      updateFormField('buyerName', resolvedBuyerName);
    }

    if (typeId === 1) {
      updateFormField('selectedConsigneeId', rawBuyerId != null ? Number(rawBuyerId) : null);
      updateFormField('deliveryAt', resolvedBuyerName);
    } else {
      updateFormField('selectedConsigneeId', null);
      updateFormField('deliveryAt', resolvedBuyerName);
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const firstItem = items[0];
    if (firstItem) {
      const fabricIdCandidate = firstItem.fabricMasterId ?? firstItem.fabricId ?? firstItem.fabricCodeId ?? null;
      const fabricId = fabricIdCandidate != null ? Number(fabricIdCandidate) : null;
      const matchedFabric = fabricMasterList.find((f: any) => {
        if (fabricId != null && !Number.isNaN(fabricId)) {
          return Number(f.id) === fabricId;
        }
        const codeFromItem = firstItem.fabricCode || firstItem.fabricCodeName;
        if (codeFromItem) {
          return f.fabricCode === codeFromItem || f.fabricName === codeFromItem;
        }
        return false;
      });

      if (matchedFabric) {
        updateFormField('fabricCode', matchedFabric.fabricCode || matchedFabric.fabricName || "");
        updateFormField('fabricCodeId', matchedFabric.id);
        updateFormField('fabricQuality', matchedFabric.fabricQuality || matchedFabric.fabricName || "");
      } else {
        const codeFromItem = firstItem.fabricCode || firstItem.fabricCodeName || "";
        updateFormField('fabricCode', codeFromItem);
        updateFormField('fabricCodeId', !Number.isNaN(fabricId ?? NaN) ? fabricId : null);
        updateFormField('fabricQuality', firstItem.fabricQuality || "");
      }
    } else {
      updateFormField('fabricCode', "");
      updateFormField('fabricCodeId', null);
      updateFormField('fabricQuality', "");
    }
  };

  // Helper function to build full address (kept for reference, but we'll use consignee names)
  const buildFullAddress = (customer: any): string => {
    if (!customer || !customer.address) return "";
    
    const addr = customer.address;
    const addressParts: string[] = [];
    
    // Add address lines
    if (addr.line1) addressParts.push(addr.line1);
    if (addr.line2) addressParts.push(addr.line2);
    
    // Add city name
    if (addr.cityId && cityList.length > 0) {
      const city = cityList.find((c: any) => c.id === addr.cityId);
      if (city) addressParts.push(city.cityName || city.name);
    }
    
    // Add state name
    if (addr.stateId && stateList.length > 0) {
      const state = stateList.find((s: any) => s.id === addr.stateId);
      if (state) addressParts.push(state.stateName || state.name);
    }
    
    // Add country name
    if (addr.countryId && countryList.length > 0) {
      const country = countryList.find((c: any) => c.id === addr.countryId);
      if (country) addressParts.push(country.countryName || country.name);
    }
    
    // Add pin code
    if (addr.pinCode) addressParts.push(addr.pinCode.toString());
    
    return addressParts.join(", ");
  };


  const extendedWeavingOrders = useMemo(() => {
    if (fetchedWeavingOrder && fetchedWeavingOrder.id) {
      const exists = weavingOrders.some((wo: any) => String(wo.id) === String(fetchedWeavingOrder.id));
      if (!exists) {
        return [...weavingOrders, fetchedWeavingOrder];
      }
    }
    return weavingOrders;
  }, [weavingOrders, fetchedWeavingOrder]);

  const jobworkOrders = useMemo(() => {
    const typeId = Number(orderType || 0) || 0;
    const list = extendedWeavingOrders;
    if (!typeId) return list;
    return list.filter((wo: any) => Number(wo.orderTypeId) === typeId);
  }, [extendedWeavingOrders, orderType]);

  useEffect(() => {
    if (fetchedWeavingOrder && weavingOrders.some((wo: any) => String(wo.id) === String(fetchedWeavingOrder.id))) {
      setFetchedWeavingOrder(null);
    }
  }, [weavingOrders, fetchedWeavingOrder]);

  const salesOrdersArr = useMemo(() => {
    const raw = (salesOrderList?.data?.data ?? salesOrderList?.data ?? salesOrderList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [salesOrderList]);

  const fabricMasterArr = useMemo(() => {
    const raw = (fabricMasterList?.data ?? fabricMasterList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [fabricMasterList]);

  // Filter sales orders against the selected Sort No (fabricMasterId / fabricCode) from salesOrderList items
  const salesOrdersForSelectedFabric = useMemo(() => {
    const selectedFabricId = resolvePositiveNumber(fabricCodeId);
    const selectedCodeStr = String(fabricCode || '').trim();
    const hasFabricFilter = Boolean(selectedFabricId || selectedCodeStr);

    // If no Sort No is selected, return all sales orders so user can select an order first
    if (!hasFabricFilter) {
      return salesOrdersArr;
    }

    // Resolve matching fabric master object to extract all possible IDs, codes and quality
    const matchedMaster = fabricMasterArr.find((f: any) => {
      const fId = resolvePositiveNumber(f.id ?? f.fabricMasterId ?? f.fabricId);
      if (selectedFabricId && fId && fId === selectedFabricId) return true;
      if (selectedCodeStr) {
        const cLower = selectedCodeStr.toLowerCase();
        const fCode = String(f.fabricCode ?? '').trim().toLowerCase();
        const fName = String(f.fabricName ?? '').trim().toLowerCase();
        const fC = String(f.code ?? '').trim().toLowerCase();
        return fCode === cLower || fName === cLower || fC === cLower;
      }
      return false;
    });

    const candidateFabricIds = new Set<number>();
    if (selectedFabricId) candidateFabricIds.add(selectedFabricId);
    if (matchedMaster) {
      const mId = resolvePositiveNumber(matchedMaster.id ?? matchedMaster.fabricMasterId ?? matchedMaster.fabricId);
      if (mId) candidateFabricIds.add(mId);
    }

    const candidateFabricCodes = new Set<string>();
    if (selectedCodeStr) {
      candidateFabricCodes.add(selectedCodeStr.toLowerCase());
    }
    if (matchedMaster) {
      [matchedMaster.fabricCode, matchedMaster.fabricName, matchedMaster.code]
        .filter(Boolean)
        .forEach((c: any) => {
          const s = String(c).trim().toLowerCase();
          if (s) candidateFabricCodes.add(s);
        });
    }

    const candidateQuality = String(fabricQuality || matchedMaster?.fabricQuality || matchedMaster?.quality || '').trim().toLowerCase();

    return salesOrdersArr.filter((so: any) => {
      const items = Array.isArray(so.items)
        ? so.items
        : Array.isArray(so.salesOrderItems)
          ? so.salesOrderItems
          : Array.isArray(so.orderItems)
            ? so.orderItems
            : [];

      if (items.length > 0) {
        return items.some((item: any) => {
          // 1. Match against item fabricMasterId / fabricId / fabricCodeId
          if (candidateFabricIds.size > 0) {
            const itemFabricId = resolvePositiveNumber(
              item.fabricMasterId ?? item.fabricId ?? item.fabricCodeId ?? item.fabric_master_id ?? item.fabric_id
            );
            if (itemFabricId && candidateFabricIds.has(itemFabricId)) {
              return true;
            }
          }

          // 2. Match against item fabricCode
          if (candidateFabricCodes.size > 0) {
            const itemCodes = [
              item.fabricCode,
              item.fabric_code,
              item.fabricCodeName,
              item.code,
              item.fabricName
            ]
              .filter(Boolean)
              .map((c: any) => String(c).trim().toLowerCase());

            const matchesCode = itemCodes.some((ic) => {
              for (const tc of candidateFabricCodes) {
                if (ic === tc) return true;
                if (ic.length >= 3 && tc.length >= 3 && (ic.includes(tc) || tc.includes(ic))) return true;
              }
              return false;
            });
            if (matchesCode) return true;
          }

          // 3. Fallback: match by quality/construction if present
          if (candidateQuality) {
            const itemQualities = [item.quality, item.fabricQuality, item.buyerProduct]
              .filter(Boolean)
              .map((q: any) => String(q).trim().toLowerCase());
            if (itemQualities.some((iq) => iq === candidateQuality)) {
              return true;
            }
          }

          return false;
        });
      }

      // Check top-level fabric attributes if items array is empty
      if (candidateFabricIds.size > 0) {
        const soFabricId = resolvePositiveNumber(so.fabricMasterId ?? so.fabricCodeId ?? so.fabricId);
        if (soFabricId && candidateFabricIds.has(soFabricId)) return true;
      }
      if (candidateFabricCodes.size > 0) {
        const soCodes = [so.fabricCode, so.fabricName, so.code]
          .filter(Boolean)
          .map((c: any) => String(c).trim().toLowerCase());
        const matchesSoCode = soCodes.some((sc) => {
          for (const tc of candidateFabricCodes) {
            if (sc === tc || (sc.length >= 3 && tc.length >= 3 && (sc.includes(tc) || tc.includes(sc)))) {
              return true;
            }
          }
          return false;
        });
        if (matchesSoCode) return true;
      }

      return false;
    });
  }, [salesOrdersArr, fabricCodeId, fabricCode, fabricQuality, fabricMasterArr]);

  const filteredSalesOrders = useMemo(() => {
    const typeId = Number(orderType || 0);
    if (!typeId) return salesOrdersArr;
    return salesOrdersArr.filter((so: any) => Number(so.orderTypeId) === typeId);
  }, [salesOrdersArr, orderType]);
  
  const balePackingsArr = useMemo(() => {
    if (Array.isArray(baleRollPackingList)) return baleRollPackingList;
    if (Array.isArray((baleRollPackingList as any)?.data?.data)) return (baleRollPackingList as any).data.data;
    if (Array.isArray((baleRollPackingList as any)?.data)) return (baleRollPackingList as any).data;
    return [];
  }, [baleRollPackingList]);

  const jobworkPackingsByOrder = useMemo(() => {
    const map = new Map<string, any[]>();
    balePackingsArr.forEach((packing: any) => {
      if (!resolveIsPackingJobwork(packing)) return;
      const weavingId = resolvePackingWeavingOrderId(packing);
      if (!weavingId) return;
      const key = String(weavingId);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(packing);
    });
    return map;
  }, [balePackingsArr]);

  const salesPackingsByOrder = useMemo(() => {
    const map = new Map<string, any[]>();
    balePackingsArr.forEach((packing: any) => {
      if (resolveIsPackingJobwork(packing)) return;
      const salesId = resolvePackingSalesOrderId(packing);
      if (!salesId) return;
      const key = String(salesId);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(packing);
    });
    return map;
  }, [balePackingsArr]);

  const jobworkOrderOptions = useMemo(() => {
  const options: { id: string; label: string }[] = [];
  jobworkPackingsByOrder.forEach((packings, key) => {
    const order = extendedWeavingOrders.find((wo: any) => String(wo.id) === key);
    if (!order) return;
    
    const orderCompanyId = order?.factoryCompanyId ?? order?.companyId ?? null;
    if (resolvedCompanyId && orderCompanyId && Number(orderCompanyId) !== resolvedCompanyId) {
      return;
    }
    
    const label = order?.weavingWorkOrderNo || order?.weavingJobWorkOrderNo || order?.jobWorkOrderNo || resolvePackingWeavingOrderNumber(packings[0]) || `WO-${key}`;
    options.push({ id: key, label });
  });
  return options;
}, [jobworkPackingsByOrder, extendedWeavingOrders, resolvedCompanyId]);

  const orderTypeOptions = useMemo<CommonSearchableSelectOption[]>(() => [
    { id: '1', value: '1', label: 'Domestic' },
    { id: '2', value: '2', label: 'Export' }
  ], []);

  const salesOrderOptions = useMemo(() => {
    const numericOrderType = resolvePositiveNumber(orderType);
    if (!numericOrderType) return [];
    const options: { id: string; label: string }[] = [];
    salesOrdersForSelectedFabric.forEach((order: any) => {
      const orderTypeValue = resolvePackingOrderTypeId(order);
      if (orderTypeValue && orderTypeValue !== numericOrderType) return;
      if (resolvedCompanyId) {
        const orderCompanyId = resolvePositiveNumber(
          order?.companyId ??
          order?.tradingCompanyId ??
          order?.factoryCompanyId ??
          order?.company?.id
        );
        if (orderCompanyId && orderCompanyId !== resolvedCompanyId) {
          return;
        }
      }
      const orderId = order?.id ?? order?.salesOrderId ?? order?.orderId;
      if (!orderId) return;
      const label =
        order?.salesOrderNo ||
        order?.internalOrderNo ||
        order?.orderNo ||
        `SO-${orderId}`;
      options.push({ id: String(orderId), label });
    });
    return options;
  }, [salesOrdersForSelectedFabric, orderType, resolvedCompanyId]);

  const resolvedJobworkOrderOptions = useMemo(() => {
    if (!orderNo || !isJobworkChecked) return jobworkOrderOptions;
    if (jobworkOrderOptions.some((option) => option.id === orderNo)) return jobworkOrderOptions;
    const source = selectedWeavingOrder || fetchedWeavingOrder || packingFromState;
    const fallbackLabel = source
      ? (source.weavingWorkOrderNo || source.jobWorkOrderNo || source.orderNo || `WO-${orderNo}`)
      : `WO-${orderNo}`;
    return [...jobworkOrderOptions, { id: orderNo, label: fallbackLabel }];
  }, [jobworkOrderOptions, orderNo, isJobworkChecked, selectedWeavingOrder, fetchedWeavingOrder, packingFromState]);

  const resolvedSalesOrderOptions = useMemo(() => {
    if (!orderNo || isJobworkChecked) return salesOrderOptions;
    if (salesOrderOptions.some((option) => option.id === orderNo)) return salesOrderOptions;
    if (resolvePositiveNumber(fabricCodeId) || (fabricCode && String(fabricCode).trim())) return salesOrderOptions;
    const order = salesOrdersArr.find((so: any) => String(so.id) === String(orderNo));
    const fallbackLabel = order?.salesOrderNo || order?.internalOrderNo || fabricInspectionSelection?.salesOrderNo || resolvePackingSalesOrderNumber(packingFromState || {}) || `SO-${orderNo}`;
    return [...salesOrderOptions, { id: orderNo, label: fallbackLabel }];
  }, [salesOrderOptions, orderNo, isJobworkChecked, salesOrdersArr, packingFromState, fabricInspectionSelection, fabricCodeId]);

  const jobworkOrderSelectOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    resolvedJobworkOrderOptions.map((option) => ({
      id: option.id,
      value: String(option.id),
      label: option.label
    })),
    [resolvedJobworkOrderOptions]
  );

  const salesOrderSelectOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    resolvedSalesOrderOptions.map((option) => ({
      id: option.id,
      value: String(option.id),
      label: option.label
    })),
    [resolvedSalesOrderOptions]
  );

  useEffect(() => {
    if (!orderNo) return;
    if (hasManualWarehouseSelection) return;
    const packings = isJobwork ? jobworkPackingsByOrder.get(orderNo) : salesPackingsByOrder.get(orderNo);
    const derivedWarehouseId = deriveWarehouseIdFromPackings(packings ?? []);
    if (!derivedWarehouseId) return;
    if (warehouse === derivedWarehouseId) return;
    updateFormField('warehouse', derivedWarehouseId);
  }, [orderNo, isJobwork, jobworkPackingsByOrder, salesPackingsByOrder, hasManualWarehouseSelection, warehouse]);
  
  const companyMasterArr = useMemo(() => {
    const raw = (companyMasterList?.data ?? companyMasterList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [companyMasterList]);

  const customerArr = useMemo(() => {
    const raw = (customerList?.data ?? customerList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [customerList]);
  const jobworkBuyerOption = useMemo(() => {
    if (!isJobworkChecked) return null;
    const source = selectedWeavingOrder || (orderNo ? jobworkOrders.find((wo: any) => String(wo.id) === String(orderNo)) : null) || fetchedWeavingOrder || null;
    if (!source) return null;
    const buyerIdCandidate = resolvePositiveNumber(source.buyerId ?? source.buyerCustomerId ?? source.customerId);
    if (!buyerIdCandidate) return null;
    const numericOrderTypeForBuyer = resolvePositiveNumber(source.orderTypeId ?? orderTypeId ?? Number(orderType));
    let label = "";
    if (numericOrderTypeForBuyer === 1) {
      const buyer = companyMasterArr.find((c: any) => Number(c.id) === buyerIdCandidate);
      label = buyer ? (buyer.companyName || buyer.name || "") : "";
    } else {
      const buyer = customerArr.find((c: any) => Number(c.id) === buyerIdCandidate);
      label = buyer ? (buyer.customerName || buyer.name || "") : "";
    }
    if (!label) {
      label = source.buyerName || source.customerName || "";
    }
    return {
      id: String(buyerIdCandidate),
      label: label || `Buyer-${buyerIdCandidate}`
    };
  }, [isJobworkChecked, selectedWeavingOrder, orderNo, jobworkOrders, fetchedWeavingOrder, companyMasterArr, customerArr, orderTypeId, orderType]);

  const buyerSelectOptions = useMemo(() => {
    if (isJobworkChecked) {
      if (jobworkBuyerOption) {
        return [jobworkBuyerOption];
      }
      return [];
    }
    // Always use customer master for buyer dropdown
    return customerArr.map((buyer: any) => ({
      id: String(buyer.id),
      label: buyer.customerName || buyer.name || `Customer-${buyer.id}`,
      activeFlag: buyer.activeFlag ?? true
    }));
  }, [isJobworkChecked, jobworkBuyerOption, customerArr]);

  const buyerDropdownOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    buyerSelectOptions.map((buyer:any) => ({
      id: buyer.id,
      value: buyer.id,
      label: buyer.label,
      activeFlag: buyer.activeFlag ?? true
    })),
    [buyerSelectOptions]
  );

  const transportOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (transportList || []).map((t: any) => ({
      id: String(t.id),
      value: String(t.id),
      label: t.transportName || t.name || "",
      activeFlag: t.activeFlag ?? true
    })),
    [transportList]
  );

  const handleBuyerChange = (value: string) => {
    const selectedId = value || "";
    updateFormField('buyerId', selectedId);
    if (selectedId) {
      if (isJobworkChecked && jobworkBuyerOption && jobworkBuyerOption.id === selectedId) {
        updateFormField('buyerName', jobworkBuyerOption.label);
        return;
      }
      const buyer = customerArr.find((c: any) => String(c.id) === selectedId);
      updateFormField('buyerName', buyer ? (buyer.customerName || buyer.name || "") : "");
    } else {
      updateFormField('buyerName', "");
    }
  };

  useEffect(() => {
    setAvailableFabricCodes(fabricMasterArr);
  }, [fabricMasterArr]);

  const fabricDropdownOptions = availableFabricCodes.length > 0 ? availableFabricCodes : fabricMasterArr;

  const fabricOptions = useMemo(() => {
    if (!fabricCode) return fabricDropdownOptions;

    const isIncluded = fabricDropdownOptions.some((fabric: any) => (fabric.fabricCode || fabric.fabricName) === fabricCode);
    if (isIncluded) return fabricDropdownOptions;

    return [
      ...fabricDropdownOptions,
      {
        id: fabricCodeId ?? fabricCode,
        fabricCode,
        fabricName: fabricQuality || fabricCode,
        fabricQuality: fabricQuality || ""
      }
    ];
  }, [fabricDropdownOptions, fabricCode, fabricCodeId, fabricQuality]);

  const fabricSelectOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    fabricOptions
      .map((fabric: any) => {
        const codeValue = fabric.fabricCode || fabric.fabricName || fabric.code || "";
        if (!codeValue) return null;
        const displayName = fabric.fabricName && fabric.fabricName !== codeValue
          ? `${codeValue} - ${fabric.fabricName}`
          : codeValue;
        return {
          id: fabric.id ?? fabric.fabricCodeId ?? codeValue,
          value: codeValue,
          label: displayName
        } as CommonSearchableSelectOption;
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [fabricOptions]
  );

  const fabricCodeMetadata = useMemo(() => {
    const map: Record<string, { id: number | null; quality: string }> = {};
    fabricOptions.forEach((fabric: any) => {
      const codeValue = fabric.fabricCode || fabric.fabricName || fabric.code || "";
      if (!codeValue) return;
      const parsedId = fabric.id ?? fabric.fabricCodeId ?? fabric.fabricId ?? null;
      const resolvedId = parsedId != null && !Number.isNaN(Number(parsedId)) ? Number(parsedId) : null;
      const quality = fabric.fabricQuality || fabric.quality || fabric.fabricName || "";
      map[codeValue] = { id: resolvedId, quality };
    });
    return map;
  }, [fabricOptions]);


  // NEW: Function to get all used bale/roll identifiers from existing packing lists
  const getUsedBaleRollIdentifiers = useMemo(() => {
    const usedIdentifiers = new Set<string>();
    
    const packingLists = Array.isArray(generatePackingList) ? generatePackingList : [];
    
    packingLists.forEach((packing: any) => {
      // Skip current packing if editing (allow re-selection of own items)
      if (editingId && packing.id === editingId) {
        return;
      }
      
      const isPackingBrushChecked = Number(packing.isBrushChecked ?? 0) === 1;
      
      if (packing.items && Array.isArray(packing.items)) {
        packing.items.forEach((item: any) => {
          if (isPackingBrushChecked) {
            const pieceId = item.pieceId ?? item.piece_id;
            if (pieceId != null && String(pieceId).trim()) {
              usedIdentifiers.add(`brush:${String(pieceId).trim()}`);
            }
          } else {
            usedIdentifiers.add(`${item.rollNo}|${item.pieceNo}`);
          }
        });
      }
    });
    
    return usedIdentifiers;
  }, [generatePackingList, editingId]);

  // Load initial data
  useEffect(() => {
    dispatch(getAllCustomers({fetchAll: true}) as any);
    dispatch(getAllWarehouse({fetchAll: true}) as any);
    dispatch(getAllFabricMasters({fetchAll: true}) as any);
    dispatch(getAllCities({fetchAll: true}) as any);
    dispatch(getAllStates({fetchAll: true}) as any);
    dispatch(getAllCountries({fetchAll: true}) as any);
    dispatch(getAllBaleRollPackings(resolvedCompanyId ? { companyId: resolvedCompanyId } : {}) as any);
    dispatch(getAllGeneratePacking(resolvedCompanyId ? { companyId: resolvedCompanyId } : {}) as any);
    dispatch(getAllConsignee({fetchAll: true}) as any);
    dispatch(getAllCompanies({fetchAll: true}) as any);
    dispatch(getAllTransports({fetchAll: true}) as any);
    if (resolvedCompanyId) {
      dispatch(getAllBrushingReceivesByCompany(resolvedCompanyId) as any);
    }

         dispatch(getAllSalesOrders({fetchAll: true}) as any);
      dispatch(getAllWeavingJobWorkOrders({fetchAll: true}) as any);
  }, [dispatch, resolvedCompanyId]);

   const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);


 // Generate document number for new beam inward entries
    useEffect(() => {
        const generateDocumentNumber = async () => {
            if (packingFromState || hasGeneratedNumberRef.current) {
                return;
            }

            try {
                const result = await documentNumberService.generateDocumentNumber({
                    screenName: 'Packing List Management'
                });
                setValue('packingSlipNo', result.documentNumber, { shouldValidate: true });
           
                hasGeneratedNumberRef.current = true;
            } catch (error) {
                console.error('Failed to generate packing list number:', error);
                toast.error('Failed to generate packing list number');
            }
        };

        generateDocumentNumber();
    }, [packingFromState,setValue]);

    // Cleanup document number cache if not saved
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !packingFromState) {
                documentNumberService.clearMemoryCache('Packing List Management');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !packingFromState) {
                documentNumberService.clearMemoryCache('Packing List Management');
            }
        };
    }, [packingFromState]);

 useEffect(() => {
    setValue('packingSlipNo', packingFromState?.packingSlipNo || '') ;
  }, [packingFromState, setValue]);

  // Handle editing from location state
  useEffect(() => {
    if (packingFromState) {
      handleEditFromState(packingFromState);
    }
  }, [packingFromState]);

  const handleEditFromState = async (packing: any) => {
  console.log("=== EDIT MODE DEBUG ===");
  console.log("Packing data:", packing);
  
  setEditingId(packing.id);
  updateFormField('clothDate', packing.packingDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
  updateFormField('warehouse', packing.warehouseId?.toString() || "");
  updateFormField('remarks', packing.remarks || "");
  const brushChecked = Number(packing.isBrushChecked ?? 0) === 1;
  updateFormField('isBrushChecked', brushChecked);
  updateFormField('poNo', packing.poNo || "");
  updateFormField('poDate', packing.poDate ? packing.poDate.toString().split('T')[0] : "");
  updateFormField('dcNo', packing.dcNo || "");
  updateFormField('transportId', packing.transportId ? Number(packing.transportId) : null);
  updateFormField('truckNo', packing.truckNo || "");
  updateFormField('lrNo', packing.lrNo || "");
  updateFormField('lrDate', packing.lrDate ? packing.lrDate.split('T')[0] : "");
  updateFormField('invoiceNo', packing.invoiceNo || "");
  updateFormField('invoiceDate', packing.invoiceDate ? packing.invoiceDate.split('T')[0] : "");
  // updateFormField('packingSlipNo', packing.packingSlipNo || "");
  
  // Set order type using orderTypeId (not orderType)
  const orderTypeValue = packing.orderTypeId ?? packing.orderType ?? "";
  console.log("Setting orderType:", orderTypeValue);
  handleOrderTypeChange(orderTypeValue ? String(orderTypeValue) : "", { skipReset: true });
  updateFormField('orderTypeId', orderTypeValue ? Number(orderTypeValue) : null);

  // Set jobwork state
  const isJobworkPacking = Number(packing.isJobwork ?? 0) === 1;
  console.log("Setting jobwork:", isJobworkPacking, "from packing.isJobwork:", packing.isJobwork);
  
  updateFormField('isJobworkChecked', isJobworkPacking);
  updateFormField('isJobwork', isJobworkPacking);

  // Handle order number based on jobwork status
  if (isJobworkPacking && packing.weavingWorkOrderId) {
    console.log("Looking for weaving order:", packing.weavingWorkOrderId);
    
    // Try to find in existing orders first
    const weavingOrder = jobworkOrders.find((wo: any) => wo.id === packing.weavingWorkOrderId);
    if (weavingOrder) {
      console.log("Found weaving order in list:", weavingOrder);
      applyWeavingOrderSelection(weavingOrder);
    } else {
      console.log("Weaving order not found in list, fetching...");
      try {
        const fetchedOrder = await dispatch(getWeavingJobWorkOrderById(packing.weavingWorkOrderId)).unwrap();
        if (fetchedOrder) {
          console.log("Fetched weaving order:", fetchedOrder);
          setFetchedWeavingOrder(fetchedOrder);
          applyWeavingOrderSelection(fetchedOrder);
        } else {
          console.log("No weaving order found, setting manually");
          updateFormField('orderNo', packing.weavingWorkOrderId?.toString() || "");
          updateFormField('buyerId', packing.buyerId?.toString() || "");
          const buyer = companyMasterArr.find((c: any) => c.id === packing.buyerId);
          const buyerName = buyer ? (buyer.companyName || buyer.name || "") : "";
          updateFormField('buyerName', buyerName);
          updateFormField('deliveryAt', buyerName);
          updateFormField('selectedConsigneeId', null);
        }
      } catch (error) {
        console.error("Failed to fetch weaving work order:", error);
        updateFormField('orderNo', packing.weavingWorkOrderId?.toString() || "");
        updateFormField('buyerId', packing.buyerId?.toString() || "");
        const buyer = companyMasterArr.find((c: any) => c.id === packing.buyerId);
        const buyerName = buyer ? (buyer.companyName || buyer.name || "") : "";
        updateFormField('buyerName', buyerName);
        updateFormField('deliveryAt', buyerName);
        updateFormField('selectedConsigneeId', null);
      }
    }
  } else {
    console.log("Not jobwork or no weaving order ID");
    setFetchedWeavingOrder(null);
    setSelectedWeavingOrder(null);
    const salesOrderIdStr = packing.salesOrderId ? String(packing.salesOrderId) : "";
    console.log("Setting sales order:", salesOrderIdStr);
    applySalesOrderSelection(salesOrderIdStr, packing);
  }

  // Handle fabric code
  if (packing.fabricCode) {
    updateFormField('fabricCode', packing.fabricCode);
    updateFormField('fabricQuality', packing.fabricQuality || "");
    const fabric = fabricMasterList.find((f: any) => f.fabricCode === packing.fabricCode);
    if (fabric) {
      updateFormField('fabricCodeId', fabric.id);
    }
  } else if (packing.fabricCodeId) {
    updateFormField('fabricCodeId', packing.fabricCodeId);
    const fabric = fabricMasterList.find((f: any) => f.id === packing.fabricCodeId);
    if (fabric) {
      updateFormField('fabricCode', fabric.fabricCode || "");
      updateFormField('fabricQuality', fabric.fabricQuality || "");
    }
  } else {
    updateFormField('fabricCode', "");
    updateFormField('fabricCodeId', null);
    updateFormField('fabricQuality', "");
  }

  // Handle consignee/delivery
  if (!isJobworkPacking) {
    if (packing.consigneeId) {
      updateFormField('selectedConsigneeId', packing.consigneeId);
      updateFormField('deliveryAt', getConsigneeNameById(packing.consigneeId));
    } else {
      updateFormField('deliveryAt', packing.deliveryAt || "");
    }
  }

  // Handle items
  const mappedBales = mapPackingItemsToSelectedBales(packing);
  setSelectedBales(mappedBales);
  
  console.log("=== EDIT MODE COMPLETE ===");
};

  // Calculate summary
  const summary = useMemo(() => {
    if (selectedBales.length === 0) {
      return {
        noOfBalesRolls: 0,
        totalPieces: 0,
        totalMeters: 0,
        totalYards: 0,
        totalNetWt: 0,
        totalAvgWt: 0,
        totalGrossWt: 0
      };
    }

    return {
      noOfBalesRolls: selectedBales.length,
      totalPieces: selectedBales.reduce((sum, bale) => {
        const pieceList = bale.pieceNo ? bale.pieceNo.split(',').map(p => p.trim()).filter(Boolean) : [];
        return sum + pieceList.length;
      }, 0),
      totalMeters: selectedBales.reduce((sum, b) => sum + b.meters, 0),
      totalYards: selectedBales.reduce((sum, b) => sum + b.yards, 0),
      totalNetWt: selectedBales.reduce((sum, b) => sum + b.netWeight, 0),
      totalAvgWt: selectedBales.reduce((sum, b) => sum + b.avgWt, 0) / selectedBales.length,
      totalGrossWt: selectedBales.reduce((sum, b) => sum + b.grossWt, 0)
    };
  }, [selectedBales]);

  const handleOrderNoChange = async (value: string) => {
    const orderId = value;
    updateFormField('hasManualWarehouseSelection', false);
    if (!orderType) {
      updateFormField('orderNo', "");
      return;
    }

    if (!orderId) {
      updateFormField('orderNo', "");
      setSelectedWeavingOrder(null);
      updateFormField('buyerId', "");
      updateFormField('buyerName', "");
      updateFormField('selectedConsigneeId', null);
      updateFormField('deliveryAt', "");
      updateFormField('fabricCode', "");
      updateFormField('fabricCodeId', null);
      updateFormField('fabricQuality', "");
      return;
    }

    if (isJobwork) {
      const weavingOrder = jobworkOrders.find((wo: any) => String(wo.id) === orderId);
      if (weavingOrder) {
        applyWeavingOrderSelection(weavingOrder);
        const associatedPackings = jobworkPackingsByOrder.get(orderId) || [];
        applyWarehouseFromPackings(associatedPackings);
        return;
      }
      try {
        const fetchedOrder = await dispatch(getWeavingJobWorkOrderById(Number(orderId))).unwrap();
        if (fetchedOrder) {
          setFetchedWeavingOrder(fetchedOrder);
          applyWeavingOrderSelection(fetchedOrder);
          const associatedPackings = jobworkPackingsByOrder.get(orderId) || [];
          applyWarehouseFromPackings(associatedPackings);
        } else {
          applyWeavingOrderSelection(null);
        }
      } catch (error) {
        console.error("Failed to fetch weaving order:", error);
        applyWeavingOrderSelection(null);
      }
      return;
    }

    applySalesOrderSelection(orderId);
    const associatedPackings = salesPackingsByOrder.get(orderId) || [];
    applyWarehouseFromPackings(associatedPackings);
  };

  const applySalesOrderSelection = (orderId: string, fallback?: any) => {
    const so = orderId ? salesOrdersArr.find((x: any) => String(x.id) === String(orderId)) : null;
    updateFormField('orderNo', orderId || "");
    setSelectedWeavingOrder(null);
    if (!so) {
      const fallbackBuyerId = fallback?.buyerId ?? fallback?.buyerCustomerId ?? null;
      const fallbackBuyerIdNumber = fallbackBuyerId != null ? Number(fallbackBuyerId) : null;
      updateFormField('buyerId', fallbackBuyerIdNumber != null && !Number.isNaN(fallbackBuyerIdNumber) ? String(fallbackBuyerIdNumber) : "");
      const effectiveOrderType = String(
        fallback?.orderTypeId ?? fallback?.orderType ?? orderTypeId ?? (orderType ? Number(orderType) : "")
      );
      let resolvedBuyerName = fallback?.buyerName || fallback?.buyerCustomerName || "";
      if (!resolvedBuyerName && fallbackBuyerIdNumber != null && !Number.isNaN(fallbackBuyerIdNumber)) {
        if (effectiveOrderType === "1") {
          const matchedBuyer = companyMasterArr.find((c: any) => Number(c.id) === fallbackBuyerIdNumber);
          resolvedBuyerName = matchedBuyer ? (matchedBuyer.companyName || matchedBuyer.name || "") : "";
        } else {
          const matchedBuyer = customerArr.find((c: any) => Number(c.id) === fallbackBuyerIdNumber);
          resolvedBuyerName = matchedBuyer ? (matchedBuyer.customerName || matchedBuyer.name || "") : "";
        }
      }
      updateFormField('buyerName', resolvedBuyerName);
      if (fallback?.consigneeId != null) {
        const resolvedConsigneeId = Number(fallback.consigneeId);
        updateFormField('selectedConsigneeId', Number.isNaN(resolvedConsigneeId) ? null : resolvedConsigneeId);
      } else {
        updateFormField('selectedConsigneeId', null);
      }
      updateFormField('deliveryAt', fallback?.deliveryAt || resolvedBuyerName || "");
      updateFormField('fabricCode', fallback?.fabricCode || "");
      updateFormField('fabricCodeId', fallback?.fabricCodeId ?? null);
      updateFormField('fabricQuality', fallback?.fabricQuality || "");
      const fallbackPo = fallback?.buyerPoNo || fallback?.buyer_po_no || fallback?.poNo || fallback?.po_no || "";
      if (fallbackPo && (!fallback?.id || !fallback?.poNo)) {
        updateFormField('poNo', fallbackPo);
      }
      return;
    }

    const soTypeId = so.orderTypeId != null ? Number(so.orderTypeId) : null;
    updateFormField('orderTypeId', Number.isNaN(soTypeId) ? null : soTypeId);

    const buyerNumber = Number(so.buyerCustomerId ?? so.buyerId ?? NaN);
    if (!Number.isNaN(buyerNumber)) {
      updateFormField('buyerId', String(buyerNumber));
      const matchedBuyer = customerArr.find((c: any) => c.id === buyerNumber);
      updateFormField('buyerName', matchedBuyer ? (matchedBuyer.customerName || matchedBuyer.name || "") : (so.buyerCustomerName || ""));
    } else {
      updateFormField('buyerId', "");
      updateFormField('buyerName', so.buyerCustomerName || "");
    }

    const consigneeIdValue = so.consigneeId ?? so.deliverToId ?? null;
    if (consigneeIdValue != null) {
      const resolvedId = Number(consigneeIdValue);
      if (!Number.isNaN(resolvedId)) {
        updateFormField('selectedConsigneeId', resolvedId);
        const matchedConsignee = getConsigneeById(resolvedId);
        updateFormField('deliveryAt', matchedConsignee ? (matchedConsignee.consigneeName || matchedConsignee.name || "") : (so.consigneeName || so.deliveryAt || ""));
      } else {
        updateFormField('selectedConsigneeId', null);
        updateFormField('deliveryAt', so.consigneeName || so.deliveryAt || "");
      }
    } else {
      updateFormField('selectedConsigneeId', null);
      updateFormField('deliveryAt', so.consigneeName || so.deliveryAt || "");
    }

    const resolvedBuyerPoNo = so.buyerPoNo || so.buyer_po_no || so.poNo || so.po_no || "";
    if (!fallback?.id || !fallback?.poNo) {
      updateFormField('poNo', resolvedBuyerPoNo);
    }

    const firstItem = Array.isArray(so.items) ? so.items[0] : null;
    if (firstItem) {
      const fabricIdCandidate = firstItem.fabricMasterId ?? firstItem.fabricId ?? firstItem.fabricCodeId ?? null;
      const fabricId = fabricIdCandidate != null ? Number(fabricIdCandidate) : null;
      const matchedFabric = fabricMasterList.find((f: any) => Number(f.id) === fabricId);
      if (matchedFabric) {
        updateFormField('fabricCode', matchedFabric.fabricCode || matchedFabric.fabricName || "");
        updateFormField('fabricCodeId', matchedFabric.id);
        updateFormField('fabricQuality', matchedFabric.fabricQuality || matchedFabric.fabricName || "");
      } else {
        updateFormField('fabricCode', firstItem.fabricCode || firstItem.fabricCodeName || "");
        updateFormField('fabricCodeId', !Number.isNaN(fabricId ?? NaN) ? fabricId : null);
        updateFormField('fabricQuality', firstItem.fabricQuality || "");
      }
    }
  };

  const applySalesOrderSelectionRef = useRef(applySalesOrderSelection);
  applySalesOrderSelectionRef.current = applySalesOrderSelection;

  useEffect(() => {
    if (!orderNo || isJobworkChecked) return;
    if (poNo) return;
    const so = salesOrdersArr.find((x: any) => String(x.id) === String(orderNo));
    if (so) {
      const resolvedBuyerPoNo = so.buyerPoNo || so.buyer_po_no || so.poNo || so.po_no || "";
      if (resolvedBuyerPoNo) {
        updateFormField('poNo', resolvedBuyerPoNo);
      }
    }
  }, [salesOrdersArr, orderNo, isJobworkChecked, poNo]);
  const fabricInspectionSelectionAppliedRef = useRef(false);
  useEffect(() => {
    const salesOrderId = fabricInspectionSelection?.salesOrderId;
    const orderTypeId = Number(fabricInspectionSelection?.orderTypeId);
    if (!salesOrderId || !orderTypeId || Number.isNaN(orderTypeId)) return;

    if (orderType !== String(orderTypeId)) {
      updateFormField('orderType', String(orderTypeId));
      updateFormField('orderTypeId', orderTypeId);
      updateFormField('isJobwork', false);
      updateFormField('isJobworkChecked', false);
    }

    if (fabricInspectionSelectionAppliedRef.current) return;
    const selectedSalesOrder = salesOrdersArr.find(
      (salesOrder) => String(salesOrder?.id) === String(salesOrderId)
    );
    if (!selectedSalesOrder) {
      updateFormField('orderNo', String(salesOrderId));
      return;
    }

    fabricInspectionSelectionAppliedRef.current = true;
    applySalesOrderSelectionRef.current(String(salesOrderId), selectedSalesOrder);
  }, [fabricInspectionSelection, orderType, salesOrdersArr]);

  const handleFabricCodeChange = (value: string) => {
    const code = value;
    const meta = fabricCodeMetadata[code] || { id: null, quality: "" };
    let resolvedId: number | null = meta.id;
    let resolvedQuality = meta.quality;

    if (!resolvedId) {
      const matchedFabric = fabricMasterArr.find((fabric: any) => fabric.fabricCode === code || fabric.fabricName === code);
      if (matchedFabric) {
        resolvedId = matchedFabric.id;
        if (!resolvedQuality) {
          resolvedQuality = matchedFabric.fabricQuality || matchedFabric.fabricName || "";
        }
      }
    }

    const sortChanged = String(fabricCodeId ?? '') !== String(resolvedId ?? '');
    updateFormField('fabricCode', code);
    updateFormField('fabricCodeId', resolvedId);
    updateFormField('fabricQuality', resolvedQuality);
    if (sortChanged && orderNo && !isJobworkChecked) {
      updateFormField('orderNo', "");
      updateFormField('buyerId', "");
      updateFormField('buyerName', "");
      updateFormField('selectedConsigneeId', null);
      updateFormField('deliveryAt', "");
      updateFormField('hasManualWarehouseSelection', false);
    }
  };

  // Handle consignee selection for Delivery At (manual override)
  const handleConsigneeChange = (value: string) => {
    const consigneeId = value ? parseInt(value) : null;
    updateFormField('selectedConsigneeId', consigneeId);
    
    if (consigneeId) {
      const consigneeName = getConsigneeNameById(consigneeId);
      updateFormField('deliveryAt', consigneeName);
    }
  };

  // Rest of your existing functions (handleOpenBalePopup, handleBaleCheckbox, handleSubmitBales, handleRemoveBale, handleSave, handleCancel) remain the same...
  const handleOpenBalePopup = async () => {
    
    if (!fabricCode) {
      toast.error("Please select Sort No first");
      return;
    }
    
    if (!isBrushChecked && !warehouse) {
      toast.error("Please select Warehouse first");
      return;
    }
    
    const requiresJobworkOrder = isJobwork;
    const selectedWeavingOrderId = requiresJobworkOrder
      ? resolvePositiveNumber(selectedWeavingOrder?.id ?? orderNo)
      : null;

    if (requiresJobworkOrder && !selectedWeavingOrderId) {
      toast.error("Please select a Weaving Work Order first");
      return;
    }

    let packingsForOrder: any[] = [];
    if (requiresJobworkOrder) {
      packingsForOrder = jobworkPackingsByOrder.get(String(selectedWeavingOrderId)) || [];
      if (packingsForOrder.length === 0) {
        toast.error("No Bale/Roll packings found for the selected order");
        return;
      }
    } else {
      packingsForOrder = balePackingsArr.filter((packing: any) => {
        if (resolveIsPackingJobwork(packing)) return false;
        if (resolvedCompanyId) {
          const packingCompanyId = resolvePackingCompanyId(packing);
          if (packingCompanyId && packingCompanyId !== resolvedCompanyId) {
            return false;
          }
        }
        return true;
      });
    }
    
    // If fabricCodeId is null, try to find it
    let actualFabricCodeId = fabricCodeId;
    if (!actualFabricCodeId && fabricCode) {
      const fabric = fabricMasterList.find((f: any) => f.fabricCode === fabricCode);
      if (fabric) {
        actualFabricCodeId = fabric.id;
        updateFormField('fabricCodeId', fabric.id);
      } else if (!isBrushChecked) {
        toast.error(`Fabric code "${fabricCode}" not found in fabric master`);
        return;
      }
    }
    
    if (!isBrushChecked && !actualFabricCodeId) {
      toast.error(`Could not find fabric ID for code: ${fabricCode}`);
      return;
    }

    let filteredPackings: any[] = [];
    let bales: BaleRoll[] = [];

    if (isBrushChecked) {
      const candidates: BaleRoll[] = [];

      (brushingReceivesList || []).forEach((receive: any) => {
        // Match company if company filter applies
        const receiveCompanyId = resolvePositiveNumber(receive.companyId);
        if (resolvedCompanyId && receiveCompanyId && receiveCompanyId !== resolvedCompanyId) {
          return;
        }

        if (Array.isArray(receive.details)) {
          receive.details.forEach((detail: any) => {
            const isPackedFlag = Number(detail.isPacked ?? 0) === 1;
            const isDispatchedFlag = Number(detail.isDispatched ?? 0) === 1;

            if (isPackedFlag && !isDispatchedFlag) {
              const detailFabricCodeId = resolvePositiveNumber(detail.fabricMasterId ?? receive.fabricMasterId);
              const matchedFabric = fabricMasterList.find((f: any) => Number(f.id) === detailFabricCodeId);
              const detailFabricCode = matchedFabric ? (matchedFabric.fabricCode || matchedFabric.fabricName || "") : "";
              const detailInvoiceNo = detail.invoiceNo || receive.refInvoiceNo || "";
              const detailConstruction = matchedFabric ? (matchedFabric.fabricQuality || matchedFabric.fabricName || "") : "";

              const meters = Number(
                detail.passMtr !== null && detail.passMtr !== undefined
                  ? detail.passMtr
                  : (detail.brushedMeters !== null && detail.brushedMeters !== undefined
                      ? detail.brushedMeters
                      : detail.greigeMeters ?? 0)
              );
              const netWeight = Number(
                detail.brushedWeight !== null && detail.brushedWeight !== undefined
                  ? detail.brushedWeight
                  : (detail.greigeWeight ?? 0)
              );
              const grossWt = Number(
                detail.brushedGrossWt !== null && detail.brushedGrossWt !== undefined
                  ? detail.brushedGrossWt
                  : (detail.greigeGrossWt ?? 0)
              );
              const avgWt = meters > 0 ? Number((netWeight / meters).toFixed(3)) : 0;

              candidates.push({
                id: detail.id,
                rollNo: detail.pieceNumber || "",
                pieceNo: detail.pieceNumber || "",
                meters,
                yards: toYards(meters),
                netWeight,
                avgWt,
                grossWt,
                fabricCode: detailFabricCode || fabricCode || "",
                warehouse: 0,
                grade: "A",
                uomId: null,
                invoiceNo: detailInvoiceNo,
                hfplRollNo: detail.hfplRollNo || "",
                construction: detailConstruction,
                remarks: detail.unwindRemarks || ""
              });
            }
          });
        }
      });

      bales = candidates;
    } else {
      filteredPackings = packingsForOrder.filter((packing: any) => {
        if (Number(packing?.isDispatched) === 1) return false;
        const packingFabricCodeId = resolvePositiveNumber(packing?.fabricCodeId ?? packing?.fabric_id);
        const selectedFabricCodeId = resolvePositiveNumber(actualFabricCodeId);
        if (packingFabricCodeId && selectedFabricCodeId && packingFabricCodeId !== selectedFabricCodeId) {
          return false;
        }
        const numericOrderType = resolvePositiveNumber(orderType);
        if (numericOrderType) {
          const packingOrderType = resolvePackingOrderTypeId(packing);
          if (packingOrderType && packingOrderType !== numericOrderType) {
            return false;
          }
        }
        if (warehouse) {
          const packingWarehouseId = resolvePositiveNumber(packing?.warehouseId ?? packing?.warehouse_id);
          if (packingWarehouseId && packingWarehouseId !== Number(warehouse)) {
            return false;
          }
        }
        return true;
      });

      if (filteredPackings.length === 0) {
        toast.error("No Bale/Roll packings match the selected filters");
        return;
      }

      bales = filteredPackings.flatMap((packing: any, packIdx: number) => {
        const items = extractPackingItems(packing);
        
        return items.map((item: any, itemIdx: number) => {
          const meters = Number(item.meters ?? item.length ?? item.meter ?? 0);
          const netWeight = Number(item.netWeight ?? item.pounds ?? item.net_weight ?? item.weight ?? 0);
          const avgWt = Number(item.avgWeight ?? item.avgWt ?? item.avg_weight ?? 0);
          const grossWt = Number(item.grossWeight ?? item.grossWt ?? item.gross_weight ?? 0);
          
          return {
            id: item.id || `${packing.id}-${itemIdx}`,
            rollNo: packing.rollOrBaleNo,
            pieceNo: item.pieceNo || item.piece_no || item.pieceNumber || `Piece-${itemIdx + 1}`,
            meters,
            yards: Number(item.yards ?? toYards(meters)),
            netWeight,
            avgWt: avgWt || (meters ? Number((netWeight / meters).toFixed(3)) : 0),
            grossWt,
            fabricCode: fabricCode,
            warehouse: warehouse ? parseInt(warehouse) : (packing.warehouseId ? Number(packing.warehouseId) : 0),
            grade: packing.gradeId ? String(packing.gradeId) : "A",
            uomId: item.uomId ?? item.uom_id ?? packing.uomId ?? null,
            invoiceNo: packing.refInvoiceNo || packing.invoiceNo || "",
            construction: fabricQuality || ""
          };
        });
      });
    }

    // Filter out already used bales/rolls
    const availableBales = bales.filter((bale) => {
      const identifier = isBrushChecked ? `brush:${bale.id}` : `${bale.rollNo}|${bale.pieceNo}`;
      const isUsed = getUsedBaleRollIdentifiers.has(identifier);
      
      if (isUsed) {
        console.log(`Excluding already used bale: ${identifier}`);
      }
      
      return !isUsed;
    }).map((bale) => {
      const existingSelected = selectedBales.find((sb) => 
        isBrushChecked 
          ? sb.id != null && String(sb.id) === String(bale.id)
          : sb.rollNo === bale.rollNo && sb.pieceNo === bale.pieceNo
      );
      if (existingSelected) {
        return { ...bale, remarks: existingSelected.remarks || bale.remarks };
      }
      return bale;
    });

    console.log("Total bales found:", bales.length);
    console.log("Available bales (excluding used):", availableBales.length);
    console.log("Already used bales:", bales.length - availableBales.length);

    if (availableBales.length === 0 && bales.length > 0) {
      toast.warning(`All ${bales.length} bales/rolls for this fabric are already used in other packing lists`);
    }

    setAvailableBaleRolls(availableBales);
    const initialSelectedIds = availableBales
      .filter(bale => isPieceSelected(bale.id, bale.rollNo, bale.pieceNo, selectedBales, isBrushChecked))
      .map(bale => bale.id);
    setTempSelectedBales(initialSelectedIds);
    setPopupRollNoFilter('');
    
    // Default the fabric code filter selectively if there is any candidate matching the main fabricCode
    const hasMatchingFabricCode = availableBales.some(b => b.fabricCode === fabricCode);
    setPopupFabricCodeFilter(hasMatchingFabricCode ? (fabricCode || '') : '');
    
    setPopupInvoiceNoFilter('');
    setPopupSearchQuery('');
    setShowBalePopup(true);
  };

  const handleRemarkChange = (baleId: number | string, value: string) => {
    setAvailableBaleRolls(prev =>
      prev.map(b => (b.id === baleId ? { ...b, remarks: value } : b))
    );
  };

  const handleBaleCheckbox = (baleId: number) => {
    setTempSelectedBales(prev => 
      prev.includes(baleId) 
        ? prev.filter(id => id !== baleId)
        : [...prev, baleId]
    );
  };

  const handleSubmitBales = () => {
    const newlySelected = availableBaleRolls
      .filter(bale => tempSelectedBales.includes(bale.id));
      
    const combined = newlySelected.map(bale => ({
      id: bale.id,
      rollNo: bale.rollNo,
      pieceNo: bale.pieceNo,
      meters: bale.meters,
      yards: bale.yards,
      netWeight: bale.netWeight,
      avgWt: bale.avgWt,
      grossWt: bale.grossWt,
      uomId: bale.uomId ?? null,
      hfplRollNo: bale.hfplRollNo,
      invoiceNo: bale.invoiceNo,
      remarks: bale.remarks
    }));

    if (isBrushChecked) {
      setSelectedBales(combined);
    } else {
      // Grouping logic: if multiple pieces have the same Roll No, merge them
      const groupedMap = new Map<string, SelectedBale>();

      combined.forEach(item => {
        const key = item.rollNo;
        if (groupedMap.has(key)) {
          const existing = groupedMap.get(key)!;
          // Merge piece numbers, comma-separated
          const existingPieces = existing.pieceNo ? existing.pieceNo.split(',').map(p => p.trim()) : [];
          const newPieces = item.pieceNo ? item.pieceNo.split(',').map(p => p.trim()) : [];
          
          // Combine and filter out empty strings and duplicates
          const allPieces = Array.from(new Set([...existingPieces, ...newPieces])).filter(p => p);
          existing.pieceNo = allPieces.join(', ');
          
          existing.meters += item.meters;
          existing.yards += item.yards;
          existing.netWeight += item.netWeight;
          existing.grossWt += item.grossWt;
          // Recalculate average weight for the group
          existing.avgWt = existing.meters > 0 ? Number((existing.netWeight / existing.meters).toFixed(3)) : 0;
        } else {
          groupedMap.set(key, { ...item });
        }
      });

      const groupedList = Array.from(groupedMap.values());
      setSelectedBales(groupedList);
    }
    setShowBalePopup(false);
    toast.success(`Piece selection updated successfully (${newlySelected.length} selected)`);
  };

  const handleRemoveBale = (index: number) => {
    setSelectedBales(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectedBaleRemarkChange = (index: number, value: string) => {
    setSelectedBales(prev =>
      prev.map((bale, i) => (i === index ? { ...bale, remarks: value } : bale))
    );
  };

  const handleSave = async (data: PackingDetailsFormData) => {
     const isEditMode = Boolean(packingFromState?.id);
           let packingSlipNo = data.packingSlipNo || packingFromState?.packingSlipNo || "";
                if (!packingFromState?.id && !packingSlipNo) {
                    try {
                        const docResponse = await documentNumberService.generateDocumentNumber({
                            screenName: "Packing List Management"
                        });
                        packingSlipNo = docResponse.documentNumber;
                    } catch (error) {
                        console.warn("Failed to generate document number:", error);
                    }
                }
    isSavingRef.current = true;
    // Validation
    const requiresOrderSelection = isJobwork;
    const isWarehouseMandatory = !isBrushChecked;
    
    if (
      !clothDate || 
      !orderType || 
      (requiresOrderSelection && !orderNo) || 
      !buyerId || 
      !deliveryAt || 
      !fabricCode || 
      (isWarehouseMandatory && !warehouse)
    ) {
      toast.error("Please fill all mandatory fields");
      return;
    }

    if (selectedBales.length === 0) {
      toast.error("Please select at least one bale/roll");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const companyId = resolvedCompanyId;

      const payload = {
        id: editingId || 0,
        packingDate: clothDate,
        salesOrderId: isJobwork ? null : (orderNo ? parseInt(orderNo) : null),
        weavingWorkOrderId: isJobwork ? (orderNo ? parseInt(orderNo) : null) : null,
        warehouseId: isBrushChecked ? null : (warehouse ? parseInt(warehouse) : null),
        tareWeight: "",
        grossWeight: summary.totalGrossWt.toString(),
        packingSlipNo: packingSlipNo, // Add packingSlipNo here if using it
        fabricCode: fabricCode,
        fabricQuality: fabricQuality,
        remarks: remarks,
        buyerId: parseInt(buyerId) || 0,
        buyerName: buyerName,
        orderType: parseInt(orderType),
        orderTypeId: orderTypeId || (orderType ? parseInt(orderType) : null),
        // @ts-ignore
        isJobwork: isJobwork ? 1 : 0,
        deliveryAt: deliveryAt,
        consigneeId: selectedConsigneeId,
        companyId: companyId,
        isBrushChecked: isBrushChecked ? 1 : 0,
        poNo: poNo,
        poDate: poDate,
        dcNo: dcNo,
        transportId: transportId || null,
        truckNo: truckNo || null,
        lrNo: lrNo || null,
        lrDate: lrDate || null,
        invoiceNo: invoiceNo || null,
        invoiceDate: invoiceDate || null,
        items: selectedBales.map((bale) => ({
          id: 0,
          ...(isBrushChecked && bale.id != null ? { pieceId: bale.id } : {}),
          rollNo: isBrushChecked ? (bale.hfplRollNo || "") : bale.rollNo,
          pieceNo: bale.pieceNo,
          length: bale.meters,
          yards: isBrushChecked ? null : bale.yards,
          uomId: bale.uomId ?? null,
          pounds: bale.netWeight,
          avgWt: isBrushChecked ? null : bale.avgWt,
          grossWt: bale.grossWt,
          lotId: null,
          remarks: bale.remarks || "",
          invoiceNo: bale.invoiceNo || null
        }))
      };

      if (editingId) {
        await dispatch(updateGeneratePacking(payload)).unwrap();
      } else {
        await dispatch(createGeneratePacking(payload)).unwrap();
      
 documentNumberService.clearMemoryCache("Packing List Management");
      }
      
      navigate("/transaction/packing-list-mamagement");
      // navigate("/transaction/generate-packing-list-details");
      
    } catch (error: any) {
      toast.error(error.message || "Failed to save packing list");
      console.error("Save error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/transaction/packing-list-mamagement");
  };

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">
              {editingId ? "Edit Packing List" : "Create Packing List"}
            </h2>
          </div>

        </div>

        {/* Form Fields */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Packing Details</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Brushing checkbox visible for Admin, hidden for other roles */}
            {user?.role === 'Admin' && (
              <div className="flex items-center gap-2 mb-4 justify-end">
                <input
                  type="checkbox"
                  checked={isBrushChecked || false}
                  onChange={(e) => handleBrushCheckedChange(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="text-sm font-semibold">Brushed Pieces Only</label>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* <div>
                <label className="block text-sm font-medium mb-1">
                  Packing List No
                </label>
                <input
                  className="w-full px-3 py-2 border rounded bg-gray-100"
                  value={packingSlipNo}
                  readOnly
                  placeholder={isPackingListNoLoading ? "Generating..." : "Auto-generated"}
                />
              </div> */}
              {/* Cloth Date */}
              <div>

              <label className="block text-sm mb-1">Packing No</label>

              <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"

                {...register('packingSlipNo')} readOnly />

            </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cloth Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={clothDate}
                  onChange={(e) => updateFormField('clothDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Order Type <span className="text-red-500">*</span>
                </label>
                <CommonSearchableSelect
                  className="mt-1"
                  options={orderTypeOptions}
                  filterActive
                  placeholder="Select Order Type"
                  value={orderType || ''}
                  onValueChange={(value) => handleOrderTypeChange(value)}
                />
              </div>

              {orderType && !isBrushChecked && (
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={isJobworkChecked}
                    onChange={(e) => handleJobworkChange(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">Is Jobwork</label>
                </div>
              )}

              {/* Order No */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isJobworkChecked ? 'Weaving Order No' : 'Sales Order No'}
                  {isJobworkChecked && <span className="text-red-500"> *</span>}
                </label>
                {!orderType ? (
                  <CommonSearchableSelect
                    className="mt-1"
                    options={[]}
                    placeholder="Select Order Type First"
                    value=""
                    disabled
                  />
                ) : isJobworkChecked ? (
                  <CommonSearchableSelect
                    className="mt-1"
                    options={jobworkOrderSelectOptions}
                    filterActive
                    placeholder="Select Weaving Work Order"
                    value={orderNo || ''}
                    onValueChange={(value) => handleOrderNoChange(value)}
                  />
                ) : (
                  <CommonSearchableSelect
                    className="mt-1"
                    options={salesOrderSelectOptions}
                    filterActive
                    placeholder="Select Sales Order"
                    value={orderNo || ''}
                    onValueChange={(value) => handleOrderNoChange(value)}
                  />
                )}
              </div>
              {/* Buyer Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Buyer Name <span className="text-red-500">*</span>
                </label>
                {orderNo ? (
                  <input
                    type="text"
                    value={buyerName}
                    readOnly
                    className="w-full px-3 py-2 border rounded bg-gray-50 cursor-not-allowed"
                    placeholder="Auto-filled from Order"
                  />
                ) : (
                  <>
                    <CommonSearchableSelect
                      className="mt-1"
                      options={buyerDropdownOptions}
                      filterActive
                      placeholder={isJobworkChecked && !jobworkBuyerOption ? 'Select weaving order to load buyer' : 'Select Buyer'}
                      value={buyerId || ''}
                      onValueChange={(value) => handleBuyerChange(value)}
                      disabled={isJobworkChecked && buyerDropdownOptions.length === 0}
                    />
                    {isJobworkChecked && !jobworkBuyerOption && (
                      <p className="text-xs text-gray-500 mt-1">Select weaving order to load buyer</p>
                    )}
                  </>
                )}
              </div>

              {/* Delivery At */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Delivery At <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">
                    (Select from Consignee Master)
                  </span>
                </label>
                <div className="flex flex-col gap-2">
                  <CommonSearchableSelect
                    className="mt-1"
                    options={consigneeSelectOptions}
                    filterActive
                    placeholder="Select Consignee"
                    value={selectedConsigneeId ? String(selectedConsigneeId) : ''}
                    onValueChange={(value) => handleConsigneeChange(value)}
                  />
                </div>
              </div>
              {/* Fabric Code */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sort No <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">
                    {editingId
                      ? "(Read Only)"
                      : selectedWeavingOrder
                        ? "(Filtered by selected weaving work order)"
                        : "(Choose from Fabric Master)"}
                  </span>
                </label>
                <CommonSearchableSelect
                  className="mt-1"
                  options={fabricSelectOptions}
                  filterActive
                  placeholder="Select sort no"
                  value={fabricCode || ''}
                  onValueChange={(value) => handleFabricCodeChange(value)}
                  disabled={Boolean(editingId)}
                />
              </div>

              {/* Rest of your form fields remain the same... */}
              {/* Fabric Quality */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Construction <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">(from Sort Master)</span>
                </label>
                <input
                  type="text"
                  value={fabricQuality}
                  onChange={(e) => updateFormField('fabricQuality', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-populated from Sort Master"
                />
              </div>

              {/* Warehouse */}
              {!isBrushChecked && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Warehouse <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">(from Warehouse Master)</span>
                  </label>
                  <CommonSearchableSelect
                    className="mt-1"
                    options={warehouseSelectOptions}
                    filterActive
                    placeholder="Select Warehouse"
                    value={warehouse || ''}
                    onValueChange={(value) => {
                      updateFormField('warehouse', value);
                      updateFormField('hasManualWarehouseSelection', true);
                    }}
                  />
                </div>
              )}

             

                <div>
                  <label className="block text-sm font-medium mb-1">
                    PO No
                  </label>
                  <input
                    type="text"
                    value={poNo || ''}
                    onChange={(e) => updateFormField('poNo', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PO No"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    PO Date
                  </label>
                  <input
                    type="date"
                    value={poDate || ''}
                    onChange={(e) => updateFormField('poDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    DC No
                  </label>
                  <input
                    type="text"
                    value={dcNo || ''}
                    onChange={(e) => updateFormField('dcNo', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter DC No"
                  />
                </div>
         
                <>
                  {/* Transport Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Transport Name
                    </label>
                    <CommonSearchableSelect
                      className="mt-1"
                      options={transportOptions}
                      filterActive
                      placeholder="Select Transport"
                      value={transportId ? String(transportId) : ''}
                      onValueChange={(value) => updateFormField('transportId', value ? Number(value) : null)}
                    />
                  </div>

                  {/* Truck No */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Truck No
                    </label>
                    <input
                      type="text"
                      value={truckNo || ''}
                      onChange={(e) => updateFormField('truckNo', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Truck No"
                    />
                  </div>

                  {/* LR No */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      LR No
                    </label>
                    <input
                      type="text"
                      value={lrNo || ''}
                      onChange={(e) => updateFormField('lrNo', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter LR No"
                    />
                  </div>

                  {/* LR Date */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      LR Date
                    </label>
                    <input
                      type="date"
                      value={lrDate || ''}
                      onChange={(e) => updateFormField('lrDate', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Product Description */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Product Description
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => updateFormField('remarks', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter product description"
                    />
                  </div>
                </>
             

              {/* Remarks (Normal Flow) */}
              {!isBrushChecked && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => updateFormField('remarks', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter remarks"
                  />
                </div>
              )}

              {/* Select Bale/Roll Button */}
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleOpenBalePopup}
                  className="bg-primary hover:bg-primary text-white w-full"
                  disabled={!fabricCode || (!isBrushChecked && !warehouse)}
                >
                  <Plus size={18} className="mr-2" />
                  Select Bale/Roll
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rest of your component remains the same... */}
        {/* Selected Bales/Rolls Table */}
        {selectedBales.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle>Piece Details</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenBalePopup}
                className="text-xs flex items-center"
              >
                <Plus size={14} className="mr-1" />
                Edit Pieces
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead className="bg-gray-100">
                    {isBrushChecked ? (
                      <tr>
                        <th className="border p-2 text-left">S.No</th>
                        <th className="border p-2 text-left">HFPL Roll No</th>
                        <th className="border p-2 text-left">Piece No</th>
                        <th className="border p-2 text-left">Pass Mtr</th>
                        <th className="border p-2 text-left">Gross Wt</th>
                        <th className="border p-2 text-left">Net Wt</th>
                        <th className="border p-2 text-left">Ref.Inv.No</th>
                        <th className="border p-2 text-left">Remarks</th>
                        <th className="border p-2 text-left">Action</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="border p-2 text-left">S.No</th>
                        <th className="border p-2 text-left">Roll No</th>
                        <th className="border p-2 text-left">Piece No</th>
                        <th className="border p-2 text-left">Meters</th>
                        <th className="border p-2 text-left">Yards</th>
                        <th className="border p-2 text-left">Net Weight</th>
                        <th className="border p-2 text-left">Avg Wt</th>
                        <th className="border p-2 text-left">Gross Wt</th>
                        <th className="border p-2 text-left">Action</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {selectedBales.map((bale, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-2">{index + 1}</td>
                        {isBrushChecked ? (
                          <>
                            <td className="border p-2">{bale.hfplRollNo || "-"}</td>
                            <td className="border p-2">{bale.pieceNo}</td>
                            <td className="border p-2">{bale.meters.toFixed(2)}</td>
                            <td className="border p-2">{bale.grossWt.toFixed(2)}</td>
                            <td className="border p-2">{bale.netWeight.toFixed(2)}</td>
                            <td className="border p-2">{bale.invoiceNo || "-"}</td>
                            <td className="border p-2">
                              <input
                                type="text"
                                value={bale.remarks || ""}
                                onChange={(e) => handleSelectedBaleRemarkChange(index, e.target.value)}
                                className="w-full border px-2 py-1 rounded text-sm"
                                placeholder="Enter remark"
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border p-2">{bale.rollNo}</td>
                            <td className="border p-2">{bale.pieceNo}</td>
                            <td className="border p-2">{bale.meters.toFixed(2)}</td>
                            <td className="border p-2">{bale.yards.toFixed(2)}</td>
                            <td className="border p-2">{bale.netWeight.toFixed(2)}</td>
                            <td className="border p-2">{bale.avgWt.toFixed(3)}</td>
                            <td className="border p-2">{bale.grossWt > 0 ? bale.grossWt.toFixed(2) : "-"}</td>
                          </>
                        )}
                        <td className="border p-2 text-center">
                          <button
                            onClick={() => handleRemoveBale(index)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Piece"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Piece Details Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Piece Details Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {!isBrushChecked && (
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-xs text-gray-600 mb-1">No of Bales/Rolls</p>
                  <p className="text-lg font-bold">{summary.noOfBalesRolls}</p>
                </div>
              )}
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">Total Pieces</p>
                <p className="text-lg font-bold">{summary.totalPieces}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">{isBrushChecked ? "Total Pass Mtrs" : "Total Meters"}</p>
                <p className="text-lg font-bold">{summary.totalMeters.toFixed(2)}</p>
              </div>
              {!isBrushChecked && (
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-xs text-gray-600 mb-1">Total Yards</p>
                  <p className="text-lg font-bold">{summary.totalYards.toFixed(2)}</p>
                </div>
              )}
              <div className="bg-yellow-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">{isBrushChecked ? "Total Net Wt (Kgs)" : "Total Net Wt"}</p>
                <p className="text-lg font-bold">{summary.totalNetWt.toFixed(2)}</p>
              </div>
              {!isBrushChecked && (
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-xs text-gray-600 mb-1">Total Avg Wt</p>
                  <p className="text-lg font-bold">{summary.totalAvgWt.toFixed(3)}</p>
                </div>
              )}
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">{isBrushChecked ? "Total Gross Wt (Kgs)" : "Total Gross Wt"}</p>
                <p className="text-lg font-bold">{summary.totalGrossWt.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <Button
            onClick={handleSubmit(handleSave)}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary text-white px-6 flex items-center"
          >
            <Save size={18} className="mr-2" />
            {isSubmitting ? "Saving..." : (editingId ? "Update" : "Save")}
          </Button>
        </div>
      </div>

      {/* Bale/Roll Selection Popup */}
      <Dialog open={showBalePopup} onOpenChange={setShowBalePopup}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-visible flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Bale/Roll</DialogTitle>
          </DialogHeader>

          {/* Search/Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end ">
            {/* Sort No Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Sort No</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CommonSearchableSelect
                    options={uniqueFabricCodeOptions}
                    filterActive
                    disablePortal
                    placeholder="All Fabric Codes"
                    value={popupFabricCodeFilter}
                    onValueChange={(val) => setPopupFabricCodeFilter(val || '')}
                  />
                </div>
                {popupFabricCodeFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPopupFabricCodeFilter('')}
                    className="px-2 bg-primary text-white hover:bg-primary"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Invoice No Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Invoice No</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CommonSearchableSelect
                    options={uniqueInvoiceNoOptions}
                    filterActive
                    disablePortal
                    placeholder="All Invoices"
                    value={popupInvoiceNoFilter}
                    onValueChange={(val) => setPopupInvoiceNoFilter(val || '')}
                  />
                </div>
                {popupInvoiceNoFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPopupInvoiceNoFilter('')}
                    className="px-2 bg-primary text-white hover:bg-primary"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Roll No Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">{isBrushChecked ? "Piece No" : "Roll No"}</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CommonSearchableSelect
                    options={uniqueRollNoOptions}
                    filterActive
                    disablePortal
                    placeholder={isBrushChecked ? "All Pieces" : "All Roll Nos"}
                    value={popupRollNoFilter}
                    onValueChange={(val) => setPopupRollNoFilter(val || '')}
                  />
                </div>
                {popupRollNoFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPopupRollNoFilter('')}
                     className="px-2 bg-primary text-white hover:bg-primary"
                  >
                    Clear
                  </Button>
                )}
              </div>
          </div>
</div>
          {/* <div>
            <input
              type="text"
              placeholder="Search by Roll No, piece no, construction, invoice no, remarks..."
              value={popupSearchQuery}
              onChange={(e) => setPopupSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div> */}

          <div className="max-h-[60vh] overflow-y-auto">
            <PopupDataTable
              columns={isBrushChecked ? brushedColumns : normalColumns}
              data={filteredAvailableBaleRolls}
              emptyMessage="No bales/rolls match the selected filters."
            />
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBalePopup(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitBales}
                disabled={tempSelectedBales.length === 0}
                className="bg-primary hover:bg-primary"
              >
                Submit ({tempSelectedBales.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PackingList;