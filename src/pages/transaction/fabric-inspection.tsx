import React, { act, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, ShoppingCart, ClipboardList, Edit, Trash2, Save, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CommonSearchableSelect, { CommonSearchableSelectOption } from "@/components/ui/CommonSearchableSelect";
import { useForm } from "react-hook-form";
import { createFabricInspection, updateFabricInspection } from "@/state/fabricInspectionsSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllCustomers } from "@/state/customerSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllDefectMaster } from "@/state/defectMasterSlice";
import { getAllGrandMaster } from "@/state/gradeMasterSlice";
import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
import { getAllJobworkFabricReceive } from "@/state/jobFabricReceiveSlice";
import { getAllFabricInspection } from "@/state/fabricInspectionsSlice";
import { getAllEmployees } from "@/state/employeeSlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllFlanges } from "@/state/flangeSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllFactoryPieceEntries, getFactoryPieceEntriesByCompany } from "@/state/factoryPieceEntrySlice";
import { getFactoryBeamInwardsByFactoryCompanyId } from "@/state/factoryBeamInwardSlice";
import { getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllSubCategories, getSubCategoryByCategory } from "@/state/subCategorySlice";
import documentNumberService from "@/services/DocumentNumberService";
import apiService from "@/services/ApiService";
import { toast } from 'react-toastify';
import { MeterDefectSheetModal } from "@/components/inspection/MeterDefectSheetModal";

const normalizeList = (value: any) => {
    if (Array.isArray(value)) return value;
    if (value?.data && Array.isArray(value.data)) return value.data;
    if (value?.data?.data && Array.isArray(value.data.data)) return value.data.data;
    return [];
};

interface FabricInspectionFormData {
    id?: number | null;
    inspectionDate: string;
    loomNo: string;
    vendorId: string;
    fabricQuality: string;
    pieceMeters: string;
    netWeight: string;
    totalPoints?: string;
    pointsPer100Mtr?: string;
    doffDate?: string;
    poNo?: string;
    warpLotNo?: string;
    weftLotNo?: string;
    warpSetNo?: string;
    selvedgeThread?: string;
    warpCount?: string;
    weftCount?: string;
    selvedgeWidthPs?: string;
    selvedgeWidthRs?: string;
    fringeWidthPs?: string;
    fringeWidthRs?: string;
    weave?: string;
    epi?: string;
    ppi?: string;
    width?: string;
    inspected_epi?: string;
    inspected_ppi?: string;
    inspected_width?: string;
    inspectedEpi?: string;
    inspectedPpi?: string;
    inspectedWidth?: string;
    buyerInspectorId?: string;
    buyerInspector?: string;
    buyerInspectorName?: string;
    activeFlag: boolean;
    sourceType: string;
    purchaseInwardId?: number;
    jobworkFabricReceiveId?: number;
    pieceNo: string;
    fabricCode: string;
    beamNo?: string;
    flangeNo?: string;
    jobWorkOrderNo?: string;
    buyerName?: string;
    inspectorId?: string;
    inspectionDetails: InspectionDetails[];
    inspectionEntries: InspectionEntries[];
}

interface InspectionDetails {
    id?: number;
    fabricInspectionId: string;
    pieceNo: string;
    pieceEntryId?: number;
    pieceMeters: string;
    rollDoffMeters?: string;
    inspectedMeters: string;
    actualNetWeight: string;
    avgWeight?: string;
    totalDefectPoints: string;
    totalPoints?: string;
    pointsPer100Mtr?: string;
    defectCounts: string;
    grade: string;
    activeFlag: boolean;
}

interface InspectionEntries {
    id?: number;
    fabricInspectionId: string;
    defectedMeters: string;
    fromMeters: string;
    toMeters: string;
    defectTypeId: string;
    defectPoints: string;
    activeFlag: boolean;
}

interface DefectMaster {
    id: number;
    defectName: string;
    defectPoint: number;
}

interface PieceDetail {
    pieceNumber: string;
    pieceEntryId?: number;
    quantity: number;
    weight: number;
    cost: number;
}

export function FactoryFabricInspection() {
 const { defectMasterList } = useSelector((state: RootState) => state.defect);    const { gradeList } = useSelector((state: RootState) => state.grade);
    const { loomList } = useSelector((state: RootState) => (state as any).loomMaster as any);
    const { list: factoryBeamInwardList } = useSelector((state: RootState) => (state as any).factoryBeamInward as any);
    const { weavingJobWorkOrderList } = useSelector((state: RootState) => (state as any).weavingJobWorkOrder as any);
    const { flangeList } = useSelector((state: RootState) => (state as any).flange as any);
    const { list: pieceEntryList } = useSelector((state: RootState) => (state as any).factoryPieceEntry as any);
    const { companyMasterList } = useSelector((state: RootState) => (state as any).companyMaster as any);
    const { fabricInspectionList } = useSelector((state: RootState) => (state as any).fabricInspections as any);
    const { employeeList } = useSelector((state: RootState) => (state as any).employee as any);
    const { fabricMasterList } = useSelector((state: RootState) => (state as any).fabricMaster as any);
    const { customerList } = useSelector((state: RootState) => (state as any).customer as any);
    const { subCategoryList, subCategoryByCategoryList } = useSelector((state: RootState) => (state as any).subCategory || {});

    const fabricMasterArray = useMemo<any[]>(() => {
        if (Array.isArray((fabricMasterList as any)?.data)) return (fabricMasterList as any).data;
        if (Array.isArray(fabricMasterList)) return fabricMasterList as any;
        return [];
    }, [fabricMasterList]);

    const fabricCodeOptions = useMemo<CommonSearchableSelectOption[]>(() =>
        fabricMasterArray
            .map((f: any) => {
                const id = f?.id;
                const code = f?.fabricCode || f?.code;
                if (!id || !code) return null;
                return { id, value: String(id), label: code, activeFlag: f?.activeFlag ?? true };
            })
            .filter(Boolean) as CommonSearchableSelectOption[]
    , [fabricMasterArray]);

    const normalizedEmployeeList = useMemo(() => {
        const list = Array.isArray(employeeList) ? employeeList : (employeeList as any)?.data || [];
        return list.filter((employee: any) => employee?.isRelieved === false);
    }, [employeeList]);

    const inspectorOptions = useMemo<CommonSearchableSelectOption[]>(() => normalizedEmployeeList
        .map((employee: any) => {
            const id = employee?.id ?? employee?.employeeId;
            const label = employee?.employeeName || employee?.name;
            if (!id || !label) {
                return null;
            }
            return {
                id,
                value: String(id),
                label,
                activeFlag: employee?.activeFlag ?? true
            };
        })
        .filter(Boolean) as CommonSearchableSelectOption[], [normalizedEmployeeList]);
        
      const normalizedDefectList = useMemo(() => normalizeList(defectMasterList), [defectMasterList]);

    const defectTypeOptions = useMemo<CommonSearchableSelectOption[]>(() => normalizedDefectList
        .map((defect: any) => {
            const id = defect?.id;
            const label = defect?.defectName;
            if (!id || !label) {
                return null;
            }
            return {
                id,
                value: String(id),
                label,
                activeFlag: defect?.activeFlag ?? true
            };
        })
        .filter(Boolean) as CommonSearchableSelectOption[], [normalizedDefectList]);
    const normalizedCustomerList = useMemo(() => normalizeList(customerList), [customerList]);
    const buyerInspectorOptions = useMemo<CommonSearchableSelectOption[]>(
        () => normalizedCustomerList
            .map((customer: any) => {
                const id = customer?.id ?? customer?.customerId;
                const label = customer?.customerName || customer?.name || customer?.companyName;
                if (!id || !label) return null;
                return {
                    id,
                    value: String(id),
                    label,
                    activeFlag: customer?.activeFlag ?? true
                };
            })
            .filter(Boolean) as CommonSearchableSelectOption[],
        [normalizedCustomerList]
    );
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const navigate = useNavigate();

    // Get source data from location state
    const sourceData = (location.state as any)?.sourceData;
    const sourceType = (location.state as any)?.sourceType;
    const editData: FabricInspectionFormData | undefined = (location.state as any)?.fabricInspDtl;
    const mode = (location.state as any)?.mode;
    const returnTab = (location.state as any)?.returnTab || 'factory';
    const returnStatus = (location.state as any)?.returnStatus || 'pending';
    const isEdit = mode === 'edit' && editData?.id;

    const [inspectionEntries, setInspectionEntries] = useState<InspectionEntries[]>(editData?.inspectionEntries || []);
    const [inspectionDetails, setInspectionDetails] = useState<InspectionDetails[]>(editData?.inspectionDetails || []);
    const [newItem, setNewItem] = useState<Partial<InspectionEntries>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isDetailsValid, setIsDetailsValid] = useState(false);
    const [defectsLoaded, setDefectsLoaded] = useState(false);
    const [availablePieces, setAvailablePieces] = useState<PieceDetail[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { uomList } = useSelector((state: RootState) => (state as any).uom || {});
    const { warehouseList } = useSelector((state: RootState) => (state as any).warehouse || {});

    const [packingOption, setPackingOption] = useState<string>("PACK_IMMEDIATELY");
    const [packingType, setPackingType] = useState<string>("Roll");
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
    const [selectedUomId, setSelectedUomId] = useState<string>("");
    const [packingRemarks, setPackingRemarks] = useState<string>("");
    const [rejectedReason, setRejectedReason] = useState<string>("");
    const [packLaterReason, setPackLaterReason] = useState<string>("");
    const [selectedSalesOrderId, setSelectedSalesOrderId] = useState<string>("");
    const [fetchedPiece, setFetchedPiece] = useState<any>(null);
    const [fetchedSalesOrder, setFetchedSalesOrder] = useState<any>(null);
    const { salesOrderList } = useSelector((state: RootState) => (state as any).salesOrder || {});

    const normalizedUomList = useMemo(() => {
        const raw = uomList?.data?.data ?? uomList?.data ?? uomList ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [uomList]);

    const uomOptions = useMemo<CommonSearchableSelectOption[]>(() => normalizedUomList
        .map((uom: any) => {
            const id = uom?.id;
            const label = String(uom?.uomName || uom?.name || uom?.unitName || uom?.uomCode || uom?.code || uom?.uom_name || '').trim() || 'UOM';
            if (id == null || !label) return null;

            return { id, value: String(id), label, activeFlag: uom?.activeFlag ?? true };
        })
        .filter(Boolean) as CommonSearchableSelectOption[], [normalizedUomList]);

    const normalizedWarehouseList = useMemo(() => {
        const raw = warehouseList?.data?.data ?? warehouseList?.data ?? warehouseList ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [warehouseList]);

    const warehouseOptions = useMemo<CommonSearchableSelectOption[]>(() => normalizedWarehouseList
        .map((w: any) => {
            const id = w?.id;
            const label = w?.warehouseName || w?.name;
            if (id == null || !label) return null;

            return { id, value: String(id), label, activeFlag: w?.activeFlag ?? true };
        })
        .filter(Boolean) as CommonSearchableSelectOption[], [normalizedWarehouseList]);

    // Prefill default warehouse and UOM
    useEffect(() => {
        if (warehouseOptions.length > 0 && !selectedWarehouseId) {
            const fabricWh = warehouseOptions.find(w => w.label.toLowerCase().includes("fabric"));
            setSelectedWarehouseId(fabricWh ? fabricWh.value : warehouseOptions[0].value);
        }
    }, [warehouseOptions, selectedWarehouseId]);

    const userSelectedUomRef = useRef(false);

    const defaultMeterUom = useMemo(() => {
        if (!uomOptions || uomOptions.length === 0) return null;

        // 1. Exact match priority
        const exact = uomOptions.find((u) => {
            const l = (u.label || "").trim().toLowerCase();
            return l === "meters" || l === "meter" || l === "mtr" || l === "mtrs" || l === "metre" || l === "metres";
        });
        if (exact) return exact;

        // 2. Contains match priority
        const contains = uomOptions.find((u) => {
            const l = (u.label || "").trim().toLowerCase();
            return l.includes("meter") || l.includes("metre") || l.includes("mtr");
        });
        if (contains) return contains;

        // 3. Raw normalized list search
        const rawMatch = normalizedUomList.find((u: any) => {
            const names = [u?.uomName, u?.uomCode, u?.name, u?.unitName, u?.code, u?.uom_name, u?.uom_code]
                .filter(Boolean)
                .map((n: any) => String(n).trim().toLowerCase());
            return names.some((n) => n === "meters" || n === "meter" || n === "mtr" || n === "mtrs" || n.includes("meter") || n.includes("mtr"));
        });
        if (rawMatch && rawMatch.id != null) {
            const match = uomOptions.find((opt) => String(opt.id) === String(rawMatch.id) || opt.value === String(rawMatch.id));
            if (match) return match;
        }

        return uomOptions[0] || null;
    }, [uomOptions, normalizedUomList]);

    useEffect(() => {
        const hasSavedUom = isEdit && Boolean((editData as any)?.uomId);
        if (hasSavedUom) return;
        if (defaultMeterUom && (!selectedUomId || !userSelectedUomRef.current)) {
            // Default to Meters UOM
            setSelectedUomId(defaultMeterUom.value);
        }
    }, [defaultMeterUom, selectedUomId, isEdit, editData]);

    const normalizedSalesOrderList = useMemo(() => {
        const raw = salesOrderList?.data?.data ?? salesOrderList?.data ?? salesOrderList ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [salesOrderList]);

    const unusedSalesOrderDummy = [].map(() => {
        return null;





        })


    const [noDefected, setNoDefected] = useState(false);
    const [isMeterSheetModalOpen, setIsMeterSheetModalOpen] = useState(false);
    const [weavingWorkOrderNo, setWeavingWorkOrderNo] = useState<string>("");
    const [buyerName, setBuyerName] = useState<string>("");
    const [selectedFabricMasterId, setSelectedFabricMasterId] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FabricInspectionFormData>({
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: !isEdit ? {
            inspectionDate: new Date().toISOString().split('T')[0]
        } : undefined
    });

    const watchPieceNo = watch('pieceNo');
    const watchJobWorkOrderNo = watch('jobWorkOrderNo');
    const watchNetWeight = watch('netWeight');
    const watchPieceMeters = watch('pieceMeters');

    const targetPieceEntryId = useMemo(() => {
        const sd: any = sourceData || {};
        const ed: any = editData || {};
        const inspDetailPieceId = (inspectionDetails as any)?.[0]?.pieceEntryId;
        return (
            inspDetailPieceId ||
            sd?.pieceEntryId ||
            sd?.selectedPieces?.[0]?.pieceEntryId ||
            sd?.selectedPieces?.[0]?.id ||
            ed?.pieceEntryId ||
            ed?.piece_entry_id ||
            (!isEdit ? (ed?.id ?? null) : null) ||
            null
        );
    }, [sourceData, editData, inspectionDetails, isEdit]);

    const rawPieces: any[] = useMemo(() => {
        return Array.isArray(pieceEntryList)
            ? pieceEntryList
            : Array.isArray((pieceEntryList as any)?.data)
                ? (pieceEntryList as any).data
                : [];
    }, [pieceEntryList]);

    const respectivePiece = useMemo(() => {
        const pno = (watchPieceNo || (editData as any)?.pieceNo || (sourceData as any)?.pieceNo || '').trim().toLowerCase();
        let found = rawPieces.find((x: any) => {
            const pieceNum = String(x.pieceNumber || x.pieceNo || '').trim().toLowerCase();
            if (pno !== '') {
                return pieceNum === pno;
            }
            return targetPieceEntryId != null && String(x.id || x.pieceEntryId) === String(targetPieceEntryId);
        });
        if (!found && targetPieceEntryId != null) {
            found = rawPieces.find((x: any) => String(x.id || x.pieceEntryId) === String(targetPieceEntryId));
        }
        if (!found) {
            found = (editData as any)?.rawData || editData;
        }
        return found;
    }, [rawPieces, watchPieceNo, targetPieceEntryId, editData, sourceData]);

    const resolvedPieceId = useMemo(() => {
        return (
            respectivePiece?.id ??
            respectivePiece?.pieceEntryId ??
            targetPieceEntryId ??
            null
        );
    }, [respectivePiece, targetPieceEntryId]);

    // Fetch piece entry from API if orderId / orderNo is not yet available on respectivePiece
    useEffect(() => {
        let isMounted = true;
        const pid = resolvedPieceId;
        if (!pid) return;

        const hasOrderId = respectivePiece?.orderId != null || respectivePiece?.order_id != null;
        const hasOrderNo = Boolean(respectivePiece?.orderNo || respectivePiece?.order_no);

        if (hasOrderId && hasOrderNo) {
            return;
        }

        const fetchPiece = async () => {
            try {
                const res: any = await apiService.get(`/piece-entries/${pid}`);
                const data = res?.data ?? res;
                if (isMounted && data) {
                    setFetchedPiece(data);
                }
            } catch (err) {
                console.error("Failed to fetch piece entry for piece ID:", pid, err);
            }
        };

        fetchPiece();
        return () => {
            isMounted = false;
        };
    }, [resolvedPieceId, respectivePiece]);

    const effectiveOrderId = useMemo(() => {
        const id =
            respectivePiece?.orderId ??
            respectivePiece?.order_id ??
            fetchedPiece?.orderId ??
            fetchedPiece?.order_id ??
            (editData as any)?.salesOrderId ??
            (editData as any)?.orderId ??
            (editData as any)?.order_id ??
            (sourceData as any)?.orderId ??
            null;
        return id != null && id !== "" ? String(id) : null;
    }, [respectivePiece, fetchedPiece, editData, sourceData]);

    const effectiveOrderNo = useMemo(() => {
        return (
            respectivePiece?.orderNo ??
            respectivePiece?.order_no ??
            fetchedPiece?.orderNo ??
            fetchedPiece?.order_no ??
            (editData as any)?.orderNo ??
            (editData as any)?.order_no ??
            (sourceData as any)?.orderNo ??
            fetchedSalesOrder?.salesOrderNo ??
            fetchedSalesOrder?.orderNo ??
            ""
        );
    }, [respectivePiece, fetchedPiece, editData, sourceData, fetchedSalesOrder]);

    // Fetch sales order if effectiveOrderId exists but effectiveOrderNo is missing
    useEffect(() => {
        let isMounted = true;
        if (!effectiveOrderId || effectiveOrderNo) return;

        const fetchSalesOrder = async () => {
            try {
                const res: any = await apiService.get(`/sales-orders/${effectiveOrderId}`);
                const data = res?.data ?? res;
                if (isMounted && data) {
                    setFetchedSalesOrder(data);
                }
            } catch (err) {
                console.error("Failed to fetch sales order for order ID:", effectiveOrderId, err);
            }
        };

        fetchSalesOrder();
        return () => {
            isMounted = false;
        };
    }, [effectiveOrderId, effectiveOrderNo]);

    const salesOrderOptions = useMemo<CommonSearchableSelectOption[]>(() => {
        const baseOptions: CommonSearchableSelectOption[] = normalizedSalesOrderList
            .map((so: any) => {
                const id = so?.id;
                const label = so?.salesOrderNo || so?.orderNo || so?.name;
                if (id == null || !label) return null;
                return { id, value: String(id), label, activeFlag: so?.activeFlag ?? true };
            })
            .filter(Boolean) as CommonSearchableSelectOption[];

        const orderIdToAdd = effectiveOrderId || selectedSalesOrderId;
        if (orderIdToAdd) {
            const orderIdStr = String(orderIdToAdd);
            const existingIdx = baseOptions.findIndex(
                (opt) => String(opt.id) === orderIdStr || String(opt.value) === orderIdStr
            );
            const label = effectiveOrderNo || (existingIdx >= 0 ? baseOptions[existingIdx].label : `Order #${orderIdStr}`);

            if (existingIdx >= 0) {
                if (effectiveOrderNo && baseOptions[existingIdx].label !== effectiveOrderNo) {
                    baseOptions[existingIdx] = { ...baseOptions[existingIdx], label: effectiveOrderNo };
                }
            } else {
                baseOptions.unshift({
                    id: Number(orderIdStr) || orderIdStr,
                    value: orderIdStr,
                    label: label,
                    activeFlag: true,
                });
            }
        }

        return baseOptions;
    }, [normalizedSalesOrderList, effectiveOrderId, effectiveOrderNo, selectedSalesOrderId]);

    // Auto-select sales order id from piece entry if not set
    useEffect(() => {
        if (effectiveOrderId && !selectedSalesOrderId) {
            setSelectedSalesOrderId(effectiveOrderId);
        }
    }, [effectiveOrderId, selectedSalesOrderId]);

    const customerMap = useMemo(() => {
        const raw = Array.isArray((customerList as any)?.data?.data)
            ? (customerList as any).data.data
            : Array.isArray((customerList as any)?.data)
                ? (customerList as any).data
                : Array.isArray(customerList)
                    ? customerList
                    : [];
        const map = new Map<string, string>();
        raw.forEach((customer: any) => {
            const id = customer?.id ?? customer?.customerId;
            if (id == null) {
                return;
            }
            const name = customer?.customerName || customer?.name || customer?.companyName || customer?.buyerName || '';
            if (!name) {
                return;
            }
            map.set(String(id), String(name));
        });
        return map;
    }, [customerList]);

    const companyNameMap = useMemo(() => {
        const raw = Array.isArray((companyMasterList as any)?.data?.data)
            ? (companyMasterList as any).data.data
            : Array.isArray((companyMasterList as any)?.data)
                ? (companyMasterList as any).data
                : Array.isArray(companyMasterList)
                    ? companyMasterList
                    : [];
        const map = new Map<string, string>();
        raw.forEach((company: any) => {
            if (company?.id == null) {
                return;
            }
            const name = company?.companyName || company?.name || '';
            if (!name) {
                return;
            }
            map.set(String(company.id), String(name));
        });
        return map;
    }, [companyMasterList]);

    const resolveBuyerName = useCallback((order?: any) => {
        if (!order) {
            return '';
        }
        const direct = [
            order.buyerName,
            order.buyerCustomerName,
            order.buyer?.customerName,
            order.buyer?.buyerName,
            order.buyer?.name,
        ].find(Boolean);
        if (direct) {
            return String(direct);
        }
        const candidates = [
            order.buyerCustomerId,
            order.buyerId,
            order.customerId,
            order.buyer?.id,
            order.buyer?.customerId,
        ];
        for (const candidate of candidates) {
            if (candidate == null) {
                continue;
            }
            const key = String(candidate);
            const customerName = customerMap.get(key);
            if (customerName) {
                return customerName;
            }
            const companyName = companyNameMap.get(key);
            if (companyName) {
                return companyName;
            }
        }
        return '';
    }, [customerMap, companyNameMap]);

    // Check if inspection details are valid
    const isInspectionValid = !!watch('inspectorId') && inspectionDetails.length > 0 &&
        inspectionDetails.every(detail =>
            detail.pieceMeters &&
            detail.inspectedMeters !== undefined && detail.inspectedMeters !== '' &&
            detail.actualNetWeight &&
            detail.totalDefectPoints !== undefined
        );

    // Extract pieces from source data - correctly handles pieceEntries
    const extractPiecesFromSource = (data: any, type: string): PieceDetail[] => {
        const pieces: PieceDetail[] = [];
        if (!data) return pieces;
        let allPieces: any[] = [];
        if (data.selectedPieces && Array.isArray(data.selectedPieces)) {
            allPieces = data.selectedPieces;
        } else if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: any) => {
                if (item.pieceEntries && Array.isArray(item.pieceEntries)) {
                    allPieces.push(...item.pieceEntries);
                }
            });
        }
        allPieces.forEach((piece: any) => {
            if (piece.pieceNumber) {
                pieces.push({
                    pieceNumber: piece.pieceNumber,
                    pieceEntryId: piece.id || piece.pieceEntryId,
                    quantity: piece.quantity || 0,
                    weight: piece.weight || 0,
                    cost: piece.cost || 0
                });
            }
        });
        return pieces;
    };

    useEffect(() => {
        const loadData = async () => {
            await dispatch(getAllCustomers({fetchAll: true} as any));
            await dispatch(getAllVendors({fetchAll: true} as any));
            await dispatch(getAllDefectMaster({fetchAll: true} as any));
            await dispatch(getAllGrandMaster({fetchAll: true} as any));
            await dispatch(getAllEmployees({fetchAll: true}) as any);
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = v ? Number(v) : undefined;
            await dispatch(getAllLooms(companyId ? ({ companyId } as any) : ({} as any)) as any);
            await dispatch(getAllFlanges(companyId ? ({ companyId } as any) : ({} as any)) as any);
            await dispatch(getAllFabricMasters({fetchAll: true} as any) as any);
            await dispatch(getAllCompanies({fetchAll: true} as any) as any);
            await dispatch(getAllWarehouse({fetchAll: true} as any));
            await dispatch(getAllUomMaster({fetchAll: true} as any));
            await dispatch(getAllSalesOrders({fetchAll: true} as any));
            await dispatch(getSubCategoryByCategory({ categoryName: 'Weave', fetchAll: true }) as any);
            await dispatch(getAllSubCategories({ fetchAll: true }) as any);
            await dispatch(getAllFabricInspection({ companyId }) as any);
            if (companyId) {
                await dispatch(getFactoryBeamInwardsByFactoryCompanyId(companyId) as any);
                 dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
                  factoryCompanyId: companyId,
                }) as any);
                // await dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(companyId) as any);
                await dispatch(getFactoryPieceEntriesByCompany(companyId) as any);
            } else {
                await dispatch(getAllFactoryPieceEntries({fetchAll: true} as any) as any);
            }
            setDefectsLoaded(true);
        };
        loadData();

        if (isEdit && editData) {
            const convertToString = (value: any) => value !== null && value !== undefined ? String(value) : '';
            const rawDetails: any[] = (editData as any).inspectionDetails || (editData as any).inspection_details || (editData as any).fabricInspectionDetails || [];
            const rawEntries: any[] = (editData as any).inspectionEntries || (editData as any).inspection_entries || [];
            const editPieceEntryId = (editData as any).pieceEntryId || (editData as any).piece_entry_id;
            const processedDetails = (rawDetails || []).map((detail: any) => {
                const tp = (detail as any).totalPoints ?? (detail as any).total_points ?? (detail as any).totalDefectPoints ?? (detail as any).total_defect_points ?? 0;
                const rawRollDoff = (detail as any).rollDoffMeters ?? (detail as any).roll_doff_meters ?? (detail as any).pieceMeters ?? (detail as any).piece_meters ?? 0;
                const rawInspected = (detail as any).inspectedMeters ?? (detail as any).inspected_meters;
                const mtr = Number(rawInspected !== undefined && rawInspected !== null ? rawInspected : (Number(rawRollDoff) > 0 ? rawRollDoff : 0));
                const pts100 = (detail as any).pointsPer100Mtr ?? (detail as any).points_per_100mtr ?? (mtr > 0 ? ((Number(tp) * 100) / mtr).toFixed(2) : "0");
                return {
                    ...detail,
                    fabricInspectionId: convertToString((detail as any).fabricInspectionId ?? (detail as any).fabric_inspection_id),
                    pieceEntryId: (detail as any).pieceEntryId ?? (detail as any).piece_entry_id ?? editPieceEntryId,
                    pieceMeters: convertToString((detail as any).pieceMeters ?? (detail as any).piece_meters),
                    rollDoffMeters: convertToString(rawRollDoff),
                    inspectedMeters: convertToString(rawInspected ?? "0"),
                    actualNetWeight: convertToString((detail as any).actualNetWeight ?? (detail as any).actual_net_weight),
                    avgWeight: (detail as any).avgWeight ? convertToString((detail as any).avgWeight) : (detail as any).avg_weight ? convertToString((detail as any).avg_weight) : undefined,
                    totalDefectPoints: convertToString((detail as any).totalDefectPoints ?? (detail as any).total_defect_points ?? 0),
                    totalPoints: convertToString(tp),
                    pointsPer100Mtr: convertToString(pts100),
                    defectCounts: convertToString((detail as any).defectCounts ?? (detail as any).defect_counts ?? 0),
                    pieceNo: convertToString((detail as any).pieceNo ?? (detail as any).piece_no ?? (detail as any).pieceNumber ?? (detail as any).piece_number),
                    grade: convertToString((detail as any).grade ?? ''),
                };
            });
            const processedEntries = (rawEntries || []).map((entry: any) => ({
                ...entry,
                fabricInspectionId: convertToString((entry as any).fabricInspectionId ?? (entry as any).fabric_inspection_id),
                defectedMeters: convertToString((entry as any).defectedMeters ?? (entry as any).defected_meters),
                fromMeters: convertToString((entry as any).fromMeters ?? (entry as any).from_meters),
                toMeters: convertToString((entry as any).toMeters ?? (entry as any).to_meters),
                defectTypeId: convertToString((entry as any).defectTypeId ?? (entry as any).defect_type_id),
                defectPoints: convertToString((entry as any).defectPoints ?? (entry as any).defect_points),
            }));
            const fmList: any[] = Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : Array.isArray(fabricMasterList) ? fabricMasterList as any : [];
            const fabricId = (editData as any).fabricMasterId ?? (editData as any).fabricCodeId ?? (editData as any).fabric_id ?? (editData as any).fabric_code_id;
            const fabric = fabricId != null ? fmList.find((f: any) => String(f.id) === String(fabricId)) : undefined;
            const resolvedFabricCode = (editData as any).fabricCode || (fabric ? (fabric.fabricCode || fabric.code || '') : '');
            const resolvedFabricQuality = (editData as any).fabricQuality || (fabric ? (fabric.fabricQuality || fabric.quality || fabric.name || '') : '');
            const firstDetail = (processedDetails && processedDetails[0]) || {} as any;
            const pieceMeters = convertToString((editData as any).pieceMeters ?? (editData as any).piece_meters ?? firstDetail.pieceMeters);
            const netWeight = convertToString((editData as any).netWeight ?? (editData as any).net_weight ?? firstDetail.actualNetWeight);
            const pieceNo = convertToString((editData as any).pieceNo ?? (editData as any).piece_no ?? firstDetail.pieceNo);
            let finalDetails = processedDetails;
            if ((!finalDetails || finalDetails.length === 0) && editData) {
                const pieces = extractPiecesFromSource(editData as any, String((editData as any).sourceType || ''));
                if (pieces.length > 0) {
                    finalDetails = pieces.map(piece => ({
                        fabricInspectionId: "",
                        pieceNo: piece.pieceNumber,
                        pieceEntryId: piece.pieceEntryId,
                        pieceMeters: String(piece.quantity || ''),
                        rollDoffMeters: String(piece.quantity || ''),
                        inspectedMeters: "0",
                        actualNetWeight: String(piece.weight || ''),
                        avgWeight: piece.quantity > 0 ? (Number(piece.weight || 0) / Number(piece.quantity || 1)).toFixed(2) : "0",
                        totalDefectPoints: "0",
                        totalPoints: "0",
                        pointsPer100Mtr: "0",
                        defectCounts: "0",
                        grade: "",
                        activeFlag: true
                    }));
                }
            }
            const headerTotalPoints = convertToString((editData as any).totalPoints ?? (editData as any).total_points ?? (editData as any).totalDefectPoints ?? (editData as any).total_defect_points ?? firstDetail.totalPoints ?? firstDetail.totalDefectPoints ?? 0);
            const headerMtr = Number(pieceMeters || firstDetail.inspectedMeters || firstDetail.pieceMeters || 0);
            const headerPointsPer100Mtr = convertToString((editData as any).pointsPer100Mtr ?? (editData as any).points_per_100mtr ?? firstDetail.pointsPer100Mtr ?? (headerMtr > 0 ? ((Number(headerTotalPoints) * 100) / headerMtr).toFixed(2) : "0"));

            reset({
                id: (editData as any).id ?? (editData as any).inspectionId,
                inspectionDate: (() => { const raw = (editData as any).inspectionDate ?? (editData as any).createdDate ?? (editData as any).created_at; if (!raw) return ''; const s = typeof raw === 'string' ? raw : new Date(raw).toISOString(); return s.includes('T') ? s.split('T')[0] : s; })(),
                loomNo: (editData as any).loomNo || '',
                vendorId: convertToString((editData as any).vendorId),
                fabricQuality: convertToString(resolvedFabricQuality),
                pieceMeters: pieceMeters,
                netWeight: netWeight,
                totalPoints: headerTotalPoints,
                pointsPer100Mtr: headerPointsPer100Mtr,
                activeFlag: (editData as any).activeFlag,
                sourceType: (editData as any).sourceType,
                purchaseInwardId: (editData as any).purchaseInwardId,
                jobworkFabricReceiveId: (editData as any).jobworkFabricReceiveId,
                pieceNo: pieceNo,
                fabricCode: convertToString(resolvedFabricCode),
                beamNo: (editData as any).beamNo || '',
                flangeNo: (editData as any).flangeNo || '',
                jobWorkOrderNo: (editData as any).jobWorkOrderNo || (editData as any).orderNo || '',
                buyerName: (editData as any).buyerName || '',
                inspectorId: convertToString((editData as any).inspectorId),
                epi: convertToString((editData as any).epi ?? (editData as any).fabric_epi ?? fabric?.epi ?? fabric?.onTableEpi ?? ''),
                ppi: convertToString((editData as any).ppi ?? (editData as any).fabric_ppi ?? fabric?.ppi ?? ''),
                width: convertToString((editData as any).width ?? (editData as any).fabricWidth ?? (editData as any).fabric_width ?? fabric?.fabricWidth ?? fabric?.width ?? ''),
                inspected_epi: convertToString((editData as any).inspected_epi ?? (editData as any).inspectedEpi ?? ''),
                inspected_ppi: convertToString((editData as any).inspected_ppi ?? (editData as any).inspectedPpi ?? ''),
                inspected_width: convertToString((editData as any).inspected_width ?? (editData as any).inspectedWidth ?? ''),
                inspectedEpi: convertToString((editData as any).inspected_epi ?? (editData as any).inspectedEpi ?? ''),
                inspectedPpi: convertToString((editData as any).inspected_ppi ?? (editData as any).inspectedPpi ?? ''),
                inspectedWidth: convertToString((editData as any).inspected_width ?? (editData as any).inspectedWidth ?? ''),
                buyerInspectorId: convertToString((editData as any).buyerInspectorId ?? (editData as any).buyer_inspector_id ?? ''),
                buyerInspector: convertToString((editData as any).buyerInspector ?? (editData as any).buyer_inspector ?? ''),
                buyerInspectorName: convertToString((editData as any).buyerInspectorName ?? (editData as any).buyer_inspector_name ?? ''),
                doffDate: (() => { const raw = (editData as any).doffDate ?? (editData as any).doff_date; if (!raw) return ''; const s = typeof raw === 'string' ? raw : new Date(raw).toISOString(); return s.includes('T') ? s.split('T')[0] : s; })(),
                poNo: (editData as any).poNo || (editData as any).po_no || '',
                warpLotNo: (editData as any).warpLotNo || (editData as any).warp_lot_no || '',
                weftLotNo: (editData as any).weftLotNo || (editData as any).weft_lot_no || '',
                warpSetNo: (editData as any).warpSetNo || (editData as any).warp_set_no || '',
                selvedgeThread: (editData as any).selvedgeThread || (editData as any).selvedge_thread || '',
                warpCount: (editData as any).warpCount || (editData as any).warp_count || '',
                weftCount: (editData as any).weftCount || (editData as any).weft_count || '',
                selvedgeWidthPs: (editData as any).selvedgeWidthPs || (editData as any).selvedge_width_ps || '',
                selvedgeWidthRs: (editData as any).selvedgeWidthRs || (editData as any).selvedge_width_rs || '',
                fringeWidthPs: (editData as any).fringeWidthPs || (editData as any).fringe_width_ps || '',
                fringeWidthRs: (editData as any).fringeWidthRs || (editData as any).fringe_width_rs || '',
                weave: (editData as any).weave || '',
                inspectionDetails: finalDetails,
                inspectionEntries: processedEntries,
            });
            setInspectionDetails(finalDetails);
            setInspectionEntries(processedEntries);
            const savedNoDef = Number((editData as any).isNoDefectedPieces ?? 0) === 1 || String((editData as any).isNoDefectedPieces || '') === 'true';
            setNoDefected(savedNoDef);

            if ((editData as any).packingOption) {
                setPackingOption((editData as any).packingOption);
            }
            if ((editData as any).packingType) {
                setPackingType((editData as any).packingType);
            }
            if ((editData as any).warehouseId) {
                setSelectedWarehouseId(String((editData as any).warehouseId));
            }
            if ((editData as any).uomId) {
                setSelectedUomId(String((editData as any).uomId));
            }
            if ((editData as any).packingRemarks) {
                setPackingRemarks((editData as any).packingRemarks);
            }
            if ((editData as any).rejectedReason) {
                setRejectedReason((editData as any).rejectedReason);
            } else if ((editData as any).pieceEntries?.[0]?.rejectedReason) {
                setRejectedReason((editData as any).pieceEntries[0].rejectedReason);
            }
            if ((editData as any).packLaterReason) {
                setPackLaterReason((editData as any).packLaterReason);
            } else if ((editData as any).pieceEntries?.[0]?.packLaterReason) {
                setPackLaterReason((editData as any).pieceEntries[0].packLaterReason);
            }
            if ((editData as any).salesOrderId) {
                setSelectedSalesOrderId(String((editData as any).salesOrderId));
            }
        } else if (!isEdit && editData && mode === 'add') {
            const currentDate = new Date().toISOString().split('T')[0];
            const pno = String((editData as any)?.pieceNo || '').trim();
            const pieceEntryId = (editData as any)?.id || (editData as any)?.pieceEntryId;
            const qty = (editData as any)?.pieceMeters || (editData as any)?.quantity || (editData as any)?.pieceMeter || '';
            const wt = (editData as any)?.netWeight || (editData as any)?.weight || '';
            const fmList: any[] = Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : Array.isArray(fabricMasterList) ? fabricMasterList as any : [];
            const fabricId = (editData as any)?.fabricMasterId ?? (editData as any)?.fabricCodeId;
            const fabric = fabricId != null ? fmList.find((f: any) => String(f.id) === String(fabricId)) : undefined;
            const fabricCode = String(fabric?.fabricCode || fabric?.code || (editData as any)?.fabricCode || '').trim();
            const fabricQuality = String(fabric?.fabricQuality || fabric?.quality || (editData as any)?.fabricQuality || '').trim();
            const avg = qty && wt && Number(qty) > 0 ? (Number(wt) / Number(qty)).toFixed(2) : "0";
            reset({
                inspectionDate: currentDate,
                loomNo: (editData as any)?.loomNo || '',
                vendorId: String((editData as any)?.vendorId || ''),
                fabricQuality: fabricQuality,
                pieceMeters: String(qty || ''),
                netWeight: String(wt || ''),
                activeFlag: true,
                sourceType: 'FACTORY_PIECE',
                pieceNo: pno,
                fabricCode: fabricCode,
                beamNo: (editData as any)?.beamNo || '',
                flangeNo: (editData as any)?.flangeNo || '',
                jobWorkOrderNo: (editData as any)?.jobWorkOrderNo || '',
                buyerName: (editData as any)?.buyerName || '',
                inspectorId: '',
                epi: String(fabric?.epi || fabric?.onTableEpi || fabric?.onLoomEpi || ''),
                ppi: String(fabric?.ppi || ''),
                width: String(fabric?.fabricWidth || fabric?.width || fabric?.cutWidth || ''),
                inspected_epi: String((editData as any)?.inspected_epi ?? (editData as any)?.inspectedEpi ?? ''),
                inspected_ppi: String((editData as any)?.inspected_ppi ?? (editData as any)?.inspectedPpi ?? ''),
                inspected_width: String((editData as any)?.inspected_width ?? (editData as any)?.inspectedWidth ?? ''),
                inspectedEpi: String((editData as any)?.inspected_epi ?? (editData as any)?.inspectedEpi ?? ''),
                inspectedPpi: String((editData as any)?.inspected_ppi ?? (editData as any)?.inspectedPpi ?? ''),
                inspectedWidth: String((editData as any)?.inspected_width ?? (editData as any)?.inspectedWidth ?? ''),
                buyerInspectorId: String((editData as any)?.buyerId || ''),
                buyerInspector: (editData as any)?.buyerName || '',
                buyerInspectorName: String((editData as any)?.buyerInspectorName ?? (editData as any)?.buyer_inspector_name ?? ''),
                inspectionDetails: [],
                inspectionEntries: [],
            } as any);
            setInspectionDetails([{
                fabricInspectionId: "",
                pieceNo: pno,
                pieceEntryId: pieceEntryId,
                pieceMeters: String(qty || ''),
                rollDoffMeters: String(qty || ''),
                inspectedMeters: "0",
                actualNetWeight: String(wt || ''),
                avgWeight: avg,
                totalDefectPoints: "0",
                defectCounts: "0",
                grade: "",
                activeFlag: true
            } as any]);
        } else if (sourceData) {
            const currentDate = new Date().toISOString().split('T')[0];
            const pieces = extractPiecesFromSource(sourceData, sourceType);
            setAvailablePieces(pieces);
            const firstItem = (sourceData as any).selectedItem || ((sourceData as any).items && (sourceData as any).items[0]);
            const firstPiece = pieces && pieces[0];
            if (sourceType === 'Purchase Inward') {
                const fabricQuality = (firstItem as any)?.quantityReceived?.toString() || '';
                const fabricCode = (sourceData as any).fabricCode || (firstItem as any)?.fabricCode || '';
                const matchingFabric = fabricMasterArray.find((f: any) =>
                    (fabricCode && String(f?.fabricCode || f?.code || '').trim().toLowerCase() === String(fabricCode).trim().toLowerCase()) ||
                    ((sourceData as any)?.fabricMasterId && String(f?.id) === String((sourceData as any).fabricMasterId))
                );
                reset({
                    inspectionDate: currentDate,
                    loomNo: '',
                    vendorId: (sourceData as any).vendorId?.toString() || '',
                    fabricQuality: fabricQuality,
                    pieceMeters: firstPiece?.quantity?.toString() || '',
                    netWeight: firstPiece?.weight?.toString() || '',
                    activeFlag: true,
                    sourceType: 'PURCHASE_INWARD',
                    purchaseInwardId: (sourceData as any).id,
                    pieceNo: firstPiece?.pieceNumber || '',
                    fabricCode: fabricCode,
                    inspectorId: '',
                    epi: String(matchingFabric?.epi || matchingFabric?.onTableEpi || matchingFabric?.onLoomEpi || ''),
                    ppi: String(matchingFabric?.ppi || ''),
                    width: String(matchingFabric?.fabricWidth || matchingFabric?.width || matchingFabric?.cutWidth || ''),
                    inspected_epi: '',
                    inspected_ppi: '',
                    inspected_width: '',
                    buyerInspectorId: '',
                    buyerInspector: '',
                    buyerInspectorName: '',
                    inspectionDetails: [],
                    inspectionEntries: [],
                });
                const details = pieces.map(piece => ({
                    fabricInspectionId: "",
                    pieceNo: piece.pieceNumber,
                    pieceEntryId: piece.pieceEntryId,
                    pieceMeters: piece.quantity.toString(),
                    rollDoffMeters: piece.quantity.toString(),
                    inspectedMeters: "0",
                    actualNetWeight: piece.weight.toString(),
                    avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(2) : "0",
                    totalDefectPoints: "0",
                    defectCounts: "0",
                    grade: "",
                    activeFlag: true
                }));
                setInspectionDetails(details);
            } else if (sourceType === 'Jobwork Fabric') {
                const fabricQuality = (sourceData as any).quality || (firstItem as any)?.quality || '';
                const fabricCode = (sourceData as any).fabricCode || (firstItem as any)?.fabricCode || '';
                const matchingFabric = fabricMasterArray.find((f: any) =>
                    (fabricCode && String(f?.fabricCode || f?.code || '').trim().toLowerCase() === String(fabricCode).trim().toLowerCase()) ||
                    ((sourceData as any)?.fabricMasterId && String(f?.id) === String((sourceData as any).fabricMasterId))
                );
                reset({
                    inspectionDate: currentDate,
                    loomNo: '',
                    vendorId: (sourceData as any).vendorId?.toString() || '',
                    fabricQuality: fabricQuality,
                    pieceMeters: firstPiece?.quantity?.toString() || '',
                    netWeight: firstPiece?.weight?.toString() || '',
                    activeFlag: true,
                    sourceType: 'JOBWORK_FABRIC',
                    jobworkFabricReceiveId: (sourceData as any).id,
                    pieceNo: firstPiece?.pieceNumber || '',
                    fabricCode: fabricCode,
                    inspectorId: '',
                    epi: String(matchingFabric?.epi || matchingFabric?.onTableEpi || matchingFabric?.onLoomEpi || ''),
                    ppi: String(matchingFabric?.ppi || ''),
                    width: String(matchingFabric?.fabricWidth || matchingFabric?.width || matchingFabric?.cutWidth || ''),
                    inspected_epi: '',
                    inspected_ppi: '',
                    inspected_width: '',
                    buyerInspectorId: '',
                    buyerInspector: '',
                    buyerInspectorName: '',
                    inspectionDetails: [],
                    inspectionEntries: [],
                });
                const details = pieces.map(piece => ({
                    fabricInspectionId: "",
                    pieceNo: piece.pieceNumber,
                    pieceEntryId: piece.pieceEntryId,
                    pieceMeters: piece.quantity.toString(),
                    rollDoffMeters: piece.quantity.toString(),
                    inspectedMeters: "0",
                    actualNetWeight: piece.weight.toString(),
                    avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(2) : "0",
                    totalDefectPoints: "0",
                    defectCounts: "0",
                    grade: "",
                    activeFlag: true
                }));
                setInspectionDetails(details);
            } else {
                const pno = (sourceData as any)?.pieceNo || firstPiece?.pieceNumber || '';
                const qty = (sourceData as any)?.pieceMeters || (sourceData as any)?.quantity || firstPiece?.quantity || '';
                const wt = (sourceData as any)?.netWeight || (sourceData as any)?.weight || firstPiece?.weight || '';
                const fabricCode = (sourceData as any)?.fabricCode || '';
                const fabricQuality = (sourceData as any)?.fabricQuality || '';
                const avg = qty && wt && Number(qty) > 0 ? (Number(wt) / Number(qty)).toFixed(2) : "0";
                reset({
                    inspectionDate: currentDate,
                    loomNo: '',
                    vendorId: (sourceData as any)?.vendorId?.toString() || '',
                    fabricQuality: String(fabricQuality || ''),
                    pieceMeters: String(qty || ''),
                    netWeight: String(wt || ''),
                    activeFlag: true,
                    sourceType: String(sourceType || 'FACTORY_PIECE'),
                    pieceNo: String(pno || ''),
                    fabricCode: String(fabricCode || ''),
                    inspectorId: '',
                    epi: '',
                    ppi: '',
                    width: '',
                    inspected_epi: '',
                    inspected_ppi: '',
                    inspected_width: '',
                    buyerInspectorId: '',
                    buyerInspector: '',
                    buyerInspectorName: '',
                    inspectionDetails: [],
                    inspectionEntries: [],
                } as any);
                setInspectionDetails([{
                    fabricInspectionId: "",
                    pieceNo: String(pno || ''),
                    pieceMeters: String(qty || ''),
                    rollDoffMeters: String(qty || ''),
                    inspectedMeters: "0",
                    actualNetWeight: String(wt || ''),
                    avgWeight: String(avg || '0'),
                    totalDefectPoints: "0",
                    defectCounts: "0",
                    grade: "",
                    activeFlag: true
                } as any]);
            }
        } else {
            reset({
                inspectionDate: new Date().toISOString().split('T')[0],
                activeFlag: true,
                inspectorId: '',
                inspected_epi: '',
                inspected_ppi: '',
                inspected_width: '',
                inspectionDetails: [],
                inspectionEntries: [],
            });
        }
    }, [dispatch, isEdit, editData, sourceData, sourceType]);

    // Autofetch Loom No by loomId if present in edit/source and loom list loaded
    useEffect(() => {
        const raw: any = loomList as any;
        const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        const findLoomNo = (id: any) => {
            const lid = id != null ? String(id) : '';
            if (!lid) return '';
            const lm = arr.find((l: any) => String(l?.id) === lid);
            return lm?.loomNo || lm?.loomName || lm?.name || '';
        };
        const eid = (editData as any)?.loomId || (sourceData as any)?.loomId;
        if (eid) {
            const no = findLoomNo(eid);
            if (no) setValue('loomNo', String(no));
        }
        const pno = (watchPieceNo || '').trim();
        if (pno) {
            const rawList: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
            const p = rawList.find((x: any) => String(x.pieceNumber || x.pieceNo || '').trim() === pno);
            if (p) {
                const ln = findLoomNo(p.loomId);
                if (ln) setValue('loomNo', String(ln));
            }
        }
    }, [loomList, editData, sourceData, pieceEntryList, watchPieceNo]);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (isEdit && editData) {
            const raw = (editData as any).inspectionDate ?? (editData as any).createdDate ?? (editData as any).created_at;
            if (raw) {
                const s = typeof raw === 'string' ? raw : new Date(raw).toISOString();
                setValue('inspectionDate', s.includes('T') ? s.split('T')[0] : s);
            } else {
                setValue('inspectionDate', today);
            }
        } else {
            setValue('inspectionDate', today);
        }
    }, [isEdit, editData]);

    useEffect(() => {
        const rawList: any = factoryBeamInwardList as any;
        const fbiArr: any[] = Array.isArray(rawList) ? rawList : (Array.isArray(rawList?.data) ? rawList.data : []);
        const sd: any = sourceData || {};
        const ed: any = editData || {};
        const pno = (watchPieceNo || '').trim();
        const rawPieces: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
        const targetPieceEntryId = sd?.pieceEntryId || sd?.selectedPieces?.[0]?.pieceEntryId || sd?.selectedPieces?.[0]?.id || ed?.pieceEntryId || ed?.piece_entry_id || (inspectionDetails as any)?.[0]?.pieceEntryId;

        const fromPiece = rawPieces.find((x: any) => {
            const pieceNum = String(x.pieceNumber || x.pieceNo || '').trim().toLowerCase();
            if (pno !== '') {
                return pieceNum === pno.toLowerCase();
            }
            return targetPieceEntryId != null && String(x.id || x.pieceEntryId) === String(targetPieceEntryId);
        });

        if (fromPiece) {
            if (fromPiece.warpSetNo || fromPiece.sizingSetNo) setValue('warpSetNo', String(fromPiece.warpSetNo || fromPiece.sizingSetNo));
            if (fromPiece.warpCount) setValue('warpCount', String(fromPiece.warpCount));
            if (fromPiece.weftCount) setValue('weftCount', String(fromPiece.weftCount));
            if (fromPiece.warpYarnLotNo || fromPiece.warpLotNo) setValue('warpLotNo', String(fromPiece.warpYarnLotNo || fromPiece.warpLotNo));
            if (fromPiece.weftYarnLotNo || fromPiece.weftLotNo) setValue('weftLotNo', String(fromPiece.weftYarnLotNo || fromPiece.weftLotNo));
            if (fromPiece.doffingDate || fromPiece.doffDate || fromPiece.entryDate || fromPiece.createdDate) {
                const rawD = fromPiece.doffingDate || fromPiece.doffDate || fromPiece.entryDate || fromPiece.createdDate;
                const dStr = typeof rawD === 'string' ? rawD : new Date(rawD).toISOString();
                setValue('doffDate', dStr.includes('T') ? dStr.split('T')[0] : dStr);
            }
            if (fromPiece.orderNo || fromPiece.poNo || fromPiece.customerPoNo) {
                setValue('poNo', String(fromPiece.orderNo || fromPiece.poNo || fromPiece.customerPoNo));
            }
        }

        const beamId = sd?.beamId || sd?.selectedItem?.beamId || (Array.isArray(sd?.selectedPieces) ? sd.selectedPieces[0]?.beamId : undefined) || ed?.beamId || fromPiece?.beamId;
        if (!beamId || !fbiArr.length) return;
        const parent = fbiArr.find((it: any) => Array.isArray(it?.beamInwardBeamDetails) && it.beamInwardBeamDetails.some((bd: any) => String(bd?.id) === String(beamId)));
        if (!parent) return;
        if (parent?.sizingVendorId != null) setValue('vendorId', String(parent.sizingVendorId));
        const fcq = String(parent?.fabricCodeQuality || '').trim();
        if (fcq) {
            const [code, ...rest] = fcq.split(' - ');
            const quality = rest.join(' - ');
            setValue('fabricCode', String(code || '').trim());
            if (quality) setValue('fabricQuality', String(quality).trim());
        }
        if (parent?.sizingSetNo && !watch('warpSetNo')) setValue('warpSetNo', String(parent.sizingSetNo));
        if ((parent as any)?.warpLotNo && !watch('warpLotNo')) setValue('warpLotNo', String((parent as any).warpLotNo));
        if ((parent as any)?.weftLotNo && !watch('weftLotNo')) setValue('weftLotNo', String((parent as any).weftLotNo));
        const wId = parent?.weavingWorkOrderId;
        if (wId != null) {
            const listRaw: any = weavingJobWorkOrderList as any;
            const wArr: any[] = Array.isArray(listRaw) ? listRaw : (Array.isArray(listRaw?.data) ? listRaw.data : []);
            const w = wArr.find((x: any) => String(x?.id) === String(wId));
            const wno = w?.jobWorkOrderNo || w?.weavingJobWorkOrderNo || w?.weavingWorkOrderNo || '';
            if (wno) {
                setWeavingWorkOrderNo(String(wno));
                setValue('jobWorkOrderNo', String(wno));
            }
            if ((w?.poNo || (w as any)?.customerPoNo || (w as any)?.orderNo) && !watch('poNo')) {
                setValue('poNo', String(w.poNo || (w as any).customerPoNo || (w as any).orderNo));
            }
            const bname = resolveBuyerName(w);
            if (bname) {
                setBuyerName(String(bname));
                setValue('buyerName', String(bname));
            }
        }
    }, [factoryBeamInwardList, weavingJobWorkOrderList, sourceData, editData, pieceEntryList, resolveBuyerName, watchPieceNo, inspectionDetails, setValue, watch]);

    const resolveWeaveName = useCallback((fabric: any) => {
        if (!fabric) return '';
        const weaveIdOrVal = fabric?.weave ?? fabric?.weaveId ?? fabric?.weave_id;
        if (weaveIdOrVal == null || weaveIdOrVal === '') return '';
        const rawCat: any[] = Array.isArray(subCategoryByCategoryList) ? subCategoryByCategoryList : Array.isArray((subCategoryByCategoryList as any)?.data) ? (subCategoryByCategoryList as any).data : [];
        const rawList: any[] = Array.isArray(subCategoryList) ? subCategoryList : Array.isArray((subCategoryList as any)?.data) ? (subCategoryList as any).data : [];
        const allSubs = [...rawCat, ...rawList];
        const matchSub = allSubs.find((s: any) => String(s?.id) === String(weaveIdOrVal));
        if (matchSub) {
            return matchSub.subCategoryName || matchSub.name || matchSub.subCategory || '';
        }
        return isNaN(Number(weaveIdOrVal)) ? String(weaveIdOrVal) : '';
    }, [subCategoryList, subCategoryByCategoryList]);

    useEffect(() => {
        if (!fabricMasterArray.length) return;
        const targetId = selectedFabricMasterId ?? (editData as any)?.fabricMasterId ?? (editData as any)?.fabricCodeId ?? (sourceData as any)?.fabricMasterId;
        let matchedFabric = targetId != null ? fabricMasterArray.find((f: any) => String(f?.id) === String(targetId)) : undefined;
        if (!matchedFabric) {
            const fabricCodeVal = String((editData as any)?.fabricCode || (sourceData as any)?.fabricCode || '').trim().toLowerCase();
            if (fabricCodeVal) {
                matchedFabric = fabricMasterArray.find((f: any) => String(f?.fabricCode || f?.code || '').trim().toLowerCase() === fabricCodeVal);
            }
        }
        if (matchedFabric) {
            if (!selectedFabricMasterId) setSelectedFabricMasterId(matchedFabric.id);
            if (matchedFabric.fabricQuality || matchedFabric.quality) {
                setValue('fabricQuality', matchedFabric.fabricQuality || matchedFabric.quality || '', { shouldValidate: true });
            }
            const wName = resolveWeaveName(matchedFabric);
            if (wName) setValue('weave', wName);
            if (!watch('epi')) setValue('epi', String(matchedFabric.epi || matchedFabric.onTableEpi || matchedFabric.onLoomEpi || ''));
            if (!watch('ppi')) setValue('ppi', String(matchedFabric.ppi || ''));
            if (!watch('width')) setValue('width', String(matchedFabric.fabricWidth || matchedFabric.width || matchedFabric.cutWidth || ''));
        }
    }, [fabricMasterArray, selectedFabricMasterId, editData, sourceData, resolveWeaveName, setValue]);

    // Create a validation function
    const calculateAvgWeight = (weight?: string | number, meters?: string | number) => {
        const w = weight !== undefined && weight !== null ? Number(weight) : NaN;
        const m = meters !== undefined && meters !== null ? Number(meters) : NaN;
        if (!isFinite(w) || !isFinite(m) || m === 0) {
            return "";
        }
        return (w / m).toFixed(2);
    };

    const deriveDetailAvgWeight = (detail: InspectionDetails, fallbackWeight?: string, fallbackMeters?: string) => {
        const weightValue = detail.actualNetWeight || fallbackWeight;
        const meterValue = (Number(detail.inspectedMeters) > 0 ? detail.inspectedMeters : detail.rollDoffMeters || detail.pieceMeters) || fallbackMeters;
        return calculateAvgWeight(weightValue, meterValue);
    };

    const validateDetails = () => {
        const values = watch([
            "inspectionDate",
            "vendorId",
            "fabricQuality",
            "pieceMeters",
            "netWeight"
        ]);
        return values.every(value => !!value);
    };

    useEffect(() => {
        const pno = (watchPieceNo || '').trim();
        if (!pno) return;
        const rawList: any = fabricInspectionList as any;
        const arr: any[] = Array.isArray(rawList) ? rawList : Array.isArray(rawList?.data) ? rawList.data : [];
        const p = arr.find((x: any) => String(x.pieceNo || '').trim().toLowerCase() === pno.toLowerCase());
        if (!p) return;
        if (p.pieceMeters != null) setValue('pieceMeters', String(p.pieceMeters));
        const ntw = (p as any).netWeight ?? (p as any).actualNetWeight;
        if (ntw != null) setValue('netWeight', String(ntw));
        if (p.beamNo) setValue('beamNo', String(p.beamNo));
        const rawD = (p as any).inspectionDate;
        if (rawD) {
            const d = typeof rawD === 'string' ? rawD : new Date(rawD as any).toISOString();
            const ymd = d.includes('T') ? d.split('T')[0] : d;
            setValue('inspectionDate', ymd);
        }
        const flArr: any[] = Array.isArray(flangeList) ? flangeList : Array.isArray((flangeList as any)?.data) ? (flangeList as any).data : [];
        const fno = (p as any).flangeNo;
        if (fno) {
            setValue('flangeNo', String(fno));
        } else if (p.flangeId != null) {
            const fl = flArr.find((f: any) => Number(f.id) === Number(p.flangeId));
            const fno2 = fl?.flangeNo || fl?.flange_no || fl?.no;
            if (fno2) setValue('flangeNo', String(fno2));
        }
        const code = String((p as any).fabricCode || '').trim();
        const qual = String((p as any).fabricQuality || '').trim();
        if (code) setValue('fabricCode', code);
        if (qual) setValue('fabricQuality', qual);
        if (!inspectionDetails.length) {
            const meters = String(p.pieceMeters ?? '').trim();
            const wt = String(((p as any).netWeight ?? (p as any).actualNetWeight) ?? '').trim();
            const avg = meters && wt && Number(meters) > 0 ? (Number(wt) / Number(meters)).toFixed(2) : '';
            const detailsFromP = Array.isArray((p as any).inspectionDetails) && (p as any).inspectionDetails.length > 0
                ? (p as any).inspectionDetails.map((d: any) => ({
                    ...d,
                    fabricInspectionId: d?.fabricInspectionId != null ? String(d.fabricInspectionId) : '',
                    pieceNo: d?.pieceNo != null ? String(d.pieceNo) : pno,
                    pieceMeters: d?.pieceMeters != null ? String(d.pieceMeters) : meters,
                    rollDoffMeters: d?.rollDoffMeters != null ? String(d.rollDoffMeters) : (d?.pieceMeters != null ? String(d.pieceMeters) : meters),
                    inspectedMeters: d?.inspectedMeters != null ? String(d.inspectedMeters) : "0",
                    actualNetWeight: d?.actualNetWeight != null ? String(d.actualNetWeight) : wt,
                    avgWeight: d?.avgWeight != null ? String(d.avgWeight) : avg,
                    totalDefectPoints: d?.totalDefectPoints != null ? String(d.totalDefectPoints) : '0',
                    defectCounts: d?.defectCounts != null ? String(d.defectCounts) : '0',
                    grade: d?.grade || (noDefected ? 'Grade A' : ''),
                    activeFlag: true,
                }))
                : [{
                    fabricInspectionId: '',
                    pieceNo: pno,
                    pieceMeters: meters,
                    rollDoffMeters: meters,
                    inspectedMeters: "0",
                    actualNetWeight: wt,
                    avgWeight: avg,
                    totalDefectPoints: '0',
                    defectCounts: '0',
                    grade: noDefected ? 'Grade A' : '',
                    activeFlag: true,
                    id: undefined
                } as any];
            setInspectionDetails(detailsFromP as any);
        }
    }, [fabricInspectionList, flangeList, inspectionDetails.length, noDefected, watchPieceNo]);
    // Update the validation effect
    useEffect(() => {
        setIsDetailsValid(validateDetails());
        const subscription = watch(() => {
            setIsDetailsValid(validateDetails());
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!inspectionDetails.length) return;
        let updated = false;
        const refreshed = inspectionDetails.map(detail => {
            const avg = deriveDetailAvgWeight(detail, watchNetWeight, watchPieceMeters);
            if (avg !== detail.avgWeight) {
                updated = true;
                return { ...detail, avgWeight: avg };
            }
            return detail;
        });
        if (updated) {
            setInspectionDetails(refreshed);
        }
    }, [inspectionDetails, watchNetWeight, watchPieceMeters]);

    useEffect(() => {
        const jno = (watchJobWorkOrderNo || '').trim();
        if (!jno) return;
        const listRaw: any = weavingJobWorkOrderList as any;
        const arr: any[] = Array.isArray(listRaw) ? listRaw : (Array.isArray(listRaw?.data) ? listRaw.data : []);
        const w = arr.find((x: any) => [x?.jobWorkOrderNo, x?.weavingJobWorkOrderNo, x?.weavingWorkOrderNo].some((k: any) => String(k || '').trim() === jno));
        if (w) {
            const bname = resolveBuyerName(w);
            if (bname) {
                setBuyerName(String(bname));
                setValue('buyerName', String(bname));
            }
        }
    }, [weavingJobWorkOrderList, resolveBuyerName, watchJobWorkOrderNo]);

    // Auto-set defect points when defect type is selected
    const handleDefectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const defectId = e.target.value;
        if (defectsLoaded && Array.isArray(defectMasterList)) {
            const selectedDefect = (defectMasterList as any).find((defect: DefectMaster) =>
                defect.id.toString() === defectId
            );
            setNewItem({
                ...newItem,
                defectTypeId: defectId,
                defectPoints: selectedDefect ? selectedDefect.defectPoint.toString() : ""
            });
        }
    };

    // Calculate total defect points and set grade
    useEffect(() => {
        if (!inspectionDetails.length) return;

        if (noDefected) {
            const needsUpdate = inspectionDetails.some(d => d.totalDefectPoints !== "0" || d.defectCounts !== "0" || d.grade !== "Grade A");
            if (needsUpdate) {
                setInspectionDetails(inspectionDetails.map(d => ({ ...d, totalDefectPoints: "0", defectCounts: "0", grade: "Grade A" })));
            }
            return;
        }

        if (inspectionEntries.length > 0) {
            const totalPoints = inspectionEntries.reduce((sum, entry) => sum + (parseFloat(entry.defectPoints) || 0), 0);
            const matchedGrade = (() => {
                if (!Array.isArray(gradeList) || gradeList.length === 0) return "";
                const g = (gradeList as any).find((gg: any) => {
                    const minPt = parseFloat(gg.minPoint) || 0;
                    const maxPt = parseFloat(gg.maxPoint) || 0;
                    return totalPoints >= minPt && totalPoints <= maxPt;
                });
                return g ? g.gradeName : "";
            })();
            const tp = totalPoints.toString();
            const inspectedMtr = Number(inspectionDetails[0]?.inspectedMeters) > 0
                ? Number(inspectionDetails[0]?.inspectedMeters)
                : Number(inspectionDetails[0]?.rollDoffMeters || watch('pieceMeters') || 0);
            if (inspectedMtr > 0) {
                setValue('pointsPer100Mtr', ((totalPoints * 100) / inspectedMtr).toFixed(2));
            }
            setValue('totalPoints', tp);
            const needsUpdate = inspectionDetails.some(d => d.totalDefectPoints !== tp || d.grade !== matchedGrade);
            if (needsUpdate) {
                setInspectionDetails(inspectionDetails.map(detail => ({
                    ...detail,
                    totalDefectPoints: tp,
                    grade: matchedGrade
                })));
            }
        } else {
            const needsUpdate = inspectionDetails.some(d => d.grade);
            if (needsUpdate) {
                setInspectionDetails(inspectionDetails.map(d => ({ ...d, grade: "" })));
            }
        }
    }, [noDefected, inspectionEntries, gradeList, inspectionDetails]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewItem({ ...newItem, [e.target.name]: e.target.value });
    };

    const addItem = () => {
        if (!newItem.defectedMeters || !newItem.fromMeters || !newItem.toMeters || !newItem.defectTypeId) return;
        if (noDefected) setNoDefected(false);
        if (editingIndex !== null) {
            const updated = [...inspectionEntries];
            updated[editingIndex] = { ...newItem, activeFlag: true } as InspectionEntries;
            setInspectionEntries(updated);
            setEditingIndex(null);
        } else {
            setInspectionEntries([...inspectionEntries, { ...newItem, activeFlag: true } as InspectionEntries]);
        }
        setNewItem({});
    };

    const editItem = (index: number) => {
        setNewItem(inspectionEntries[index]);
        setEditingIndex(index);
    };

    const deleteItem = (index: number) => {
        setInspectionEntries(inspectionEntries.filter((_, i) => i !== index));
    };

 // In FactoryFabricInspection.tsx - Update the onSubmit function

// const onSubmit = async (data: FabricInspectionFormData) => {
//     const payload = {
//         ...data,
//         inspectionDetails,
//         inspectionEntries,
//         activeFlag: true,
//     };

//     try {
//         if (isEdit && data.id) {
//             await dispatch(updateFabricInspection({ id: data.id, data: payload })).unwrap();
//         } else {
//             await dispatch(createFabricInspection(payload)).unwrap();
//         }
        
//         // After successful save, refresh the data
//         // This will re-fetch purchase inwards and jobwork receives with updated inspection_status
//         await dispatch(getAllPurchaseInwards({}));
//         await dispatch(getAllJobworkFabricReceive({}));
//         await dispatch(getAllFabricInspection({}));
        
//         // Now navigate
//         navigate('/transaction/fabric-inspection-details', { 
//             state: { activeTab: 'completed' }
//         });
//         reset();
//         setInspectionEntries([]);
//         setInspectionDetails([]);
//     } catch (error) {
//         console.error('Error saving inspection:', error);
//         // Show error message to user
//     }
// };
// fabric-inspection.tsx:415-449 replace onSubmit with companyId in payload and update call
const onSubmit = async (data: FabricInspectionFormData) => {
    if (!selectedFabricMasterId) {
        toast.warning('Please select a Sort No');
        return;
    }
    if (packingOption === "REJECT" && !rejectedReason?.trim()) {
        toast.warning('Please enter Rejected Reason');
        return;
    }
    if (packingOption === "PACK_LATER" && !packLaterReason?.trim()) {
        toast.warning('Please enter Reason for Packing Later');
        return;
    }
    if (isSubmitting) return;
    const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = v ? Number(v) : undefined;

    const { flangeNo, jobWorkOrderNo, buyerName, ...base } = data as any;

    const rawPieces: any[] = Array.isArray(pieceEntryList) ? (pieceEntryList as any) : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
    const pno = (data.pieceNo || '').toString().trim();
    const p = rawPieces.find((x: any) => String(x.pieceNumber || x.pieceNo || '').trim() === pno);

    const loomId = p?.loomId ?? (() => {
        const raw: any = loomList as any;
        const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        const ln = (data.loomNo || '').toString().trim();
        const lm = arr.find((l: any) => [l?.loomNo, l?.loomName, l?.name].some((v: any) => String(v || '').trim() === ln));
        return lm?.id;
    })();
    const flangeId = p?.flangeId;
    const fabricMasterId = selectedFabricMasterId ?? p?.fabricMasterId;
    const beamId = p?.beamId;

    const rawFbi: any = factoryBeamInwardList as any;
    const fbiArr: any[] = Array.isArray(rawFbi) ? rawFbi : Array.isArray(rawFbi?.data) ? rawFbi.data : [];
    const parent = beamId != null ? fbiArr.find((it: any) => Array.isArray(it?.beamInwardBeamDetails) && it.beamInwardBeamDetails.some((bd: any) => String(bd?.id) === String(beamId))) : undefined;
    const weavingWorkOrderId = parent?.weavingWorkOrderId;

    const rawWjo: any = weavingJobWorkOrderList as any;
    const wArr: any[] = Array.isArray(rawWjo) ? rawWjo : Array.isArray(rawWjo?.data) ? rawWjo.data : [];
    const w = weavingWorkOrderId != null ? wArr.find((x: any) => String(x?.id) === String(weavingWorkOrderId)) : undefined;
    const buyerId = w?.buyerId;

    const grades: any[] = Array.isArray(gradeList) ? (gradeList as any) : Array.isArray((gradeList as any)?.data) ? (gradeList as any).data : [];
    const normalizeGradeName = (value: any) => String(value || '').trim().toLowerCase();
    const defaultGrade = grades.find((gg: any) => normalizeGradeName(gg?.gradeName || gg?.name || '') === 'grade a');
    const detailsPayload = (inspectionDetails || []).map((d: any) => {
        const normalizedGrade = normalizeGradeName(d.grade);
        const matchedGrade = normalizedGrade ? grades.find((gg: any) => normalizeGradeName(gg?.gradeName || gg?.name || '') === normalizedGrade) : undefined;
        const resolvedGradeId = d.gradeId ?? matchedGrade?.id ?? defaultGrade?.id;
        const { grade, gradeId, ...rest } = d;
        const tp = d.totalPoints ?? d.total_points ?? d.totalDefectPoints ?? d.total_defect_points ?? 0;
        const mtr = Number(d.inspectedMeters) > 0 ? Number(d.inspectedMeters) : Number(d.rollDoffMeters || d.pieceMeters || 0);
        const pts100 = d.pointsPer100Mtr ?? d.points_per_100mtr ?? (mtr > 0 ? ((Number(tp) * 100) / mtr).toFixed(2) : "0");
        return {
            ...rest,
            rollDoffMeters: d.rollDoffMeters ?? d.pieceMeters ?? "0",
            inspectedMeters: d.inspectedMeters ?? "0",
            totalPoints: tp,
            pointsPer100Mtr: pts100,
            gradeId: resolvedGradeId
        };
    });

    let rollOrBaleNo = "";
    if (packingOption === "PACK_IMMEDIATELY") {
        try {
            const docResponse = await documentNumberService.generateDocumentNumber({
                screenName: "Bale/Roll Packing"
            });
            rollOrBaleNo = docResponse.documentNumber;
        } catch (error) {
            console.error("Failed to generate bale/roll number:", error);
        }
    }

    const selectedBuyer = normalizedCustomerList.find(
        (c: any) => String(c?.id ?? c?.customerId) === String(data.buyerInspectorId)
    );
    const buyerInspectorName = selectedBuyer?.customerName || selectedBuyer?.name || data.buyerInspector || null;

    const payload = {
        ...base,
        epi: data.epi || null,
        ppi: data.ppi || null,
        width: data.width || null,
        inspected_epi: data.inspected_epi || data.inspectedEpi || null,
        inspected_ppi: data.inspected_ppi || data.inspectedPpi || null,
        inspected_width: data.inspected_width || data.inspectedWidth || null,
        inspectedEpi: data.inspectedEpi || data.inspected_epi || null,
        inspectedPpi: data.inspectedPpi || data.inspected_ppi || null,
        inspectedWidth: data.inspectedWidth || data.inspected_width || null,
        buyerInspectorId: data.buyerInspectorId ? Number(data.buyerInspectorId) : null,
        buyerInspector: buyerInspectorName,
        buyerInspectorName: data.buyerInspectorName?.trim() ?? '',
        beamNo: data.beamNo,
        doffDate: data.doffDate || null,
        poNo: data.poNo || null,
        warpLotNo: data.warpLotNo || null,
        weftLotNo: data.weftLotNo || null,
        warpSetNo: data.warpSetNo || null,
        selvedgeThread: data.selvedgeThread || null,
        warpCount: data.warpCount || null,
        weftCount: data.weftCount || null,
        selvedgeWidthPs: data.selvedgeWidthPs || null,
        selvedgeWidthRs: data.selvedgeWidthRs || null,
        fringeWidthPs: data.fringeWidthPs || null,
        fringeWidthRs: data.fringeWidthRs || null,
        weave: data.weave || null,
        inspectionDetails: detailsPayload,
        inspectionEntries,
        activeFlag: true,
        companyId,
        loomId,
        flangeId,
        weavingWorkOrderId,
        buyerId,
        fabricMasterId,
        isNoDefectedPieces: noDefected ? 1 : 0,
        isFactoryFabric: 1,
        fabricTypeId: 1,
        
        packingOption,
        packingType: packingOption === "PACK_IMMEDIATELY" ? packingType : undefined,
        warehouseId: packingOption === "PACK_IMMEDIATELY" ? Number(selectedWarehouseId) : undefined,
        uomId: packingOption === "PACK_IMMEDIATELY" ? Number(selectedUomId) : undefined,
        packingRemarks: packingOption === "PACK_IMMEDIATELY" ? packingRemarks : undefined,
        rollOrBaleNo: packingOption === "PACK_IMMEDIATELY" ? rollOrBaleNo : undefined,
        rejectedReason: packingOption === "REJECT" ? rejectedReason : undefined,
        packLaterReason: packingOption === "PACK_LATER" ? packLaterReason : undefined,
        salesOrderId: packingOption === "PACK_IMMEDIATELY" && selectedSalesOrderId ? Number(selectedSalesOrderId) : undefined
    };

    setIsSubmitting(true);
    try {
// alert(JSON.stringify(payload));
//       console.log('Payload to be sent:', payload);
        if (isEdit && data.id) {
            await dispatch(updateFabricInspection({ id: data.id, data: payload, companyId }) as any).unwrap();
        } else {
            await dispatch(createFabricInspection(payload) as any).unwrap();
            if (packingOption === "PACK_IMMEDIATELY") {
                documentNumberService.clearMemoryCache("Bale/Roll Packing");
            }
        }
        await dispatch(getAllPurchaseInwards(companyId ? { companyId } : {} as any));
        await dispatch(getAllJobworkFabricReceive(companyId ? { companyId } : {} as any));
        await dispatch(getAllFabricInspection({ companyId }) as any);

        if (packingOption === "PACK_IMMEDIATELY") {
            const selectedSalesOrder = normalizedSalesOrderList.find(
                (salesOrder) => String(salesOrder?.id) === String(selectedSalesOrderId)
            );
            navigate('/transaction/generate-packing-list', {
                state: {
                    fabricInspectionSelection: selectedSalesOrderId
                        ? {
                            salesOrderId: selectedSalesOrderId,
                            salesOrderNo: selectedSalesOrder?.salesOrderNo || selectedSalesOrder?.orderNo || '',
                            orderTypeId: selectedSalesOrder?.orderTypeId ?? selectedSalesOrder?.orderType ?? null
                        }
                        : undefined
                }
            });
        } else {
            navigate('/transaction/trading-fabric-inspection-management', {
                state: { activeTab: returnStatus, returnTab: 'factory' }
            });
        }
        
        reset();
        setInspectionEntries([]);
        setInspectionDetails([]);
    } catch (error) {
        console.error('Error saving inspection:', error);
    } finally {
        setIsSubmitting(false);
    }
};

    const handleBack = () => {
           navigate('/transaction/trading-fabric-inspection-management', { 
                state: { activeTab: returnStatus,returnTab: 'factory'} 
            });
    };

    return (
        <div className="mt-10 p-6 bg-white shadow-md rounded-lg">
            {/* Title & Save Button */}
            <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        className="mr-auto"
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Back
                    </Button>
                    <h2 className="text-2xl font-semibold">{isEdit ? "Edit Fabric Inspection" : "Fabric Inspection"}</h2>
                </div>
            
            </div>

            <div className="space-y-6 mt-6">
                {/* Order Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText size={20} /> Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-6 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Inspection Date <span className="text-red-500">*</span></label>
                            <input
                                {...register('inspectionDate', { required: true })}
                                type="date"
                                className="input mt-1"
                                required
                            />
                            {errors.inspectionDate && <p className="text-red-500 text-xs mt-1">Date is required</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Inspector <span className="text-red-500">*</span></label>
                            <CommonSearchableSelect
                                {...register('inspectorId', { required: true })}
                                options={inspectorOptions}
                                filterActive
                                className="mt-1"
                                placeholder="Select Inspector"
                                value={watch('inspectorId') || ''}
                                error={errors.inspectorId?.message as string}
                            />
                            {errors.inspectorId && <p className="text-red-500 text-xs mt-1">Inspector is required</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Buyer Inspector</label>
                            <CommonSearchableSelect
                                options={buyerInspectorOptions}
                                filterActive
                                placeholder="Select Buyer Inspector"
                                value={watch('buyerInspectorId') || ''}
                                onValueChange={(val) => {
                                    setValue('buyerInspectorId', val);
                                    const matched = normalizedCustomerList.find((c: any) => String(c?.id ?? c?.customerId) === String(val));
                                    if (matched) {
                                        setValue('buyerInspector', matched.customerName || matched.name || '');
                                    }
                                }}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Buyer Inspector Name</label>
                            <input
                                {...register('buyerInspectorName')}
                                type="text"
                                className="input mt-1"
                                placeholder="Enter Buyer Inspector Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Inspected EPI</label>
                            <input
                                {...register('inspected_epi')}
                                className="input mt-1"
                                placeholder="Inspected EPI"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Inspected PPI</label>
                            <input
                                {...register('inspected_ppi')}
                                className="input mt-1"
                                placeholder="Inspected PPI"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Inspected Width</label>
                            <input
                                {...register('inspected_width')}
                                className="input mt-1"
                                placeholder="Inspected Width"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Total Points</label>
                            <input
                                {...register('totalPoints')}
                                className="input mt-1"
                                placeholder="Total Points"
                                type="number"
                                step="any"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setValue('totalPoints', val);
                                    const mtr = Number(inspectionDetails?.[0]?.inspectedMeters || watch('pieceMeters')) || 0;
                                    if (mtr > 0 && val !== '') {
                                        setValue('pointsPer100Mtr', ((Number(val) * 100) / mtr).toFixed(2));
                                    }
                                }}
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-secondary-700">Selvedge Thread</label>
                            <input
                                {...register('selvedgeThread')}
                                className="input mt-1"
                                placeholder="Selvedge Thread"
                                type="text"
                            />
                        </div>

 <div>
                            <label className="block text-sm font-medium text-secondary-700">Selvedge Width P/S</label>
                            <input
                                {...register('selvedgeWidthPs')}
                                className="input mt-1"
                                placeholder="Selvedge Width P/S"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Selvedge Width R/S</label>
                            <input
                                {...register('selvedgeWidthRs')}
                                className="input mt-1"
                                placeholder="Selvedge Width R/S"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Fringe Width P/S</label>
                            <input
                                {...register('fringeWidthPs')}
                                className="input mt-1"
                                placeholder="Fringe Width P/S"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Fringe Width R/S</label>
                            <input
                                {...register('fringeWidthRs')}
                                className="input mt-1"
                                placeholder="Fringe Width R/S"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Loom No</label>
                            <input
                                {...register('loomNo')}
                                className="input mt-1"
                                placeholder="Loom No"
                                type="text"
                                readOnly
                            />
                        </div>
                       
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Piece No</label>
                            <input
                                {...register('pieceNo')}
                                className="input mt-1 bg-gray-100"
                                placeholder="Piece No"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Beam No</label>
                            <input
                                {...register('beamNo')}
                                className="input mt-1 bg-gray-100"
                                placeholder="Beam No"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Empty Beam No</label>
                            <input
                                {...register('flangeNo')}
                                className="input mt-1 bg-gray-100"
                                placeholder="Empty Beam No"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">JobWork Order No</label>
                            <input
                                {...register('jobWorkOrderNo')}
                                className="input mt-1 bg-gray-100"
                                placeholder="JobWork Order No"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Buyer Name</label>
                            <input
                                {...register('buyerName')}
                                className="input mt-1 bg-gray-100"
                                placeholder="Buyer Name"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Sort No <span className="text-red-500">*</span></label>
                            <input type="hidden" {...register('fabricCode', { required: 'Sort No is required' })} />
                            <CommonSearchableSelect
                                options={fabricCodeOptions}
                                value={selectedFabricMasterId ? String(selectedFabricMasterId) : ''}
                                onChange={(val) => {
                                    const fabric = fabricMasterArray.find((f: any) => String(f.id) === val);
                                    if (fabric) {
                                        setSelectedFabricMasterId(fabric.id);
                                        setValue('fabricCode', fabric.fabricCode || fabric.code || '', { shouldValidate: true });
                                        setValue('fabricQuality', fabric.fabricQuality || fabric.quality || '', { shouldValidate: true });
                                        const wName = resolveWeaveName(fabric);
                                        if (wName) setValue('weave', wName);
                                        setValue('epi', String(fabric.epi || fabric.onTableEpi || fabric.onLoomEpi || ''));
                                        setValue('ppi', String(fabric.ppi || ''));
                                        setValue('width', String(fabric.fabricWidth || fabric.width || fabric.cutWidth || ''));
                                        if (!watch('inspected_epi')) {
                                            setValue('inspected_epi', String(fabric.epi || fabric.onTableEpi || fabric.onLoomEpi || ''));
                                        }
                                        if (!watch('inspected_ppi')) {
                                            setValue('inspected_ppi', String(fabric.ppi || ''));
                                        }
                                        if (!watch('inspected_width')) {
                                            setValue('inspected_width', String(fabric.fabricWidth || fabric.width || fabric.cutWidth || ''));
                                        }
                                    }
                                }}
                                placeholder="Select Sort No"
                                required
                                error={errors.fabricCode?.message as string}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Construction <span className="text-red-500">*</span></label>
                            <input
                                {...register('fabricQuality', { required: true })}
                                className="input mt-1"
                                placeholder="Construction"
                                type="text"
                            />
                            {errors.fabricQuality && <p className="text-red-500 text-xs mt-1">Construction is required</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Actual EPI</label>
                            <input
                                {...register('epi')}
                                className="input mt-1 bg-gray-100"
                                placeholder="EPI"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Actual PPI</label>
                            <input
                                {...register('ppi')}
                                className="input mt-1 bg-gray-100"
                                placeholder="PPI"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Actual Width</label>
                            <input
                                {...register('width')}
                                className="input mt-1 bg-gray-100"
                                placeholder="Width"
                                type="text"
                                readOnly
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Doffing Meter <span className="text-red-500">*</span></label>
                            <input
                                {...register('pieceMeters', { required: true })}
                                className="input mt-1 bg-gray-100"
                                placeholder="Piece Meters"
                                type="number"
                                readOnly
                                required
                            />
                            {errors.pieceMeters && <p className="text-red-500 text-xs mt-1">Doffing Meters is required</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Net Weight <span className="text-red-500">*</span></label>
                            <input
                                {...register('netWeight', { required: true })}
                                className="input mt-1 bg-gray-100"
                                placeholder="Net Weight"
                                type="number"
                                readOnly
                                required
                            />
                            {errors.netWeight && <p className="text-red-500 text-xs mt-1">Net Weight is required</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Points/100mtr</label>
                            <input
                                {...register('pointsPer100Mtr')}
                                className="input mt-1 bg-gray-100"
                                placeholder="Points/100mtr"
                                type="number"
                                step="any"
                                readOnly
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Doff Date</label>
                            <input
                                {...register('doffDate')}
                                type="date"
                                className="input mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">PO No</label>
                            <input
                                {...register('poNo')}
                                className="input mt-1"
                                placeholder="PO No"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Warp Lot No</label>
                            <input
                                {...register('warpLotNo')}
                                className="input mt-1"
                                placeholder="Warp Lot No"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Weft Lot No</label>
                            <input
                                {...register('weftLotNo')}
                                className="input mt-1"
                                placeholder="Weft Lot No"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Warp Set No</label>
                            <input
                                {...register('warpSetNo')}
                                className="input mt-1"
                                placeholder="Warp Set No"
                                type="text"
                            />
                        </div>
                       
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Warp Count</label>
                            <input
                                {...register('warpCount')}
                                className="input mt-1"
                                placeholder="Warp Count"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Weft Count</label>
                            <input
                                {...register('weftCount')}
                                className="input mt-1"
                                placeholder="Weft Count"
                                type="text"
                            />
                        </div>
                       
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Weave</label>
                            <input
                                {...register('weave')}
                                className="input mt-1"
                                placeholder="Weave"
                                type="text"
                            />
                        </div>
                        
                    </CardContent>
                </Card>
 {/* Inspection Entry */}
                <Card>
                    <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart size={20} /> Inspection Entry
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {!noDefected && (
                        <Button
                          type="button"
                          onClick={() => setIsMeterSheetModalOpen(true)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-md shadow-sm"
                        >
                          <FileText size={15} /> 500-Meter Inspection Sheet (Defect Grid)
                        </Button>
                      )}
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={noDefected}
                          onChange={(e) => {
                            const v = e.target.checked;
                            setNoDefected(v);
                            if (v) {
                              setInspectionEntries([]);
                              if (inspectionDetails.length > 0) {
                                setInspectionDetails(inspectionDetails.map(d => ({ ...d, totalDefectPoints: "0", defectCounts: "0", grade: "Grade A" })));
                              }
                            } else {
                              if (inspectionDetails.length > 0) {
                                setInspectionDetails(inspectionDetails.map(d => ({ ...d, grade: "" })));
                              }
                            }
                          }}
                        />
                        No Defected Pieces
                      </label>
                    </div>
                  </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-5 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">Defected Meters</label>
                                <input
                                    name="defectedMeters"
                                    value={newItem.defectedMeters || ''}
                                    onChange={handleChange}
                                    className="input mt-1"
                                    type="number"
                                    placeholder="Defected Meters"
                                    disabled={noDefected}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">From Meter</label>
                                <input
                                    name="fromMeters"
                                    value={newItem.fromMeters || ''}
                                    onChange={handleChange}
                                    className="input mt-1"
                                    type="number"
                                    placeholder="From Meters"
                                    disabled={noDefected}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">To Meter</label>
                                <input
                                    name="toMeters"
                                    value={newItem.toMeters || ''}
                                    onChange={handleChange}
                                    className="input mt-1"
                                    type="number"
                                    placeholder="To Meters"
                                    disabled={noDefected}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Defect Type</label>
                                <CommonSearchableSelect
                                    name="defectTypeId"
                                    value={newItem.defectTypeId || ''}
                                    onChange={handleDefectTypeChange}
                                    options={defectTypeOptions}
                                    filterActive
                                    className="mt-1"
                                    placeholder="Select a Defect Type"
                                    disabled={noDefected}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">Defect Points</label>
                                <input
                                    name="defectPoints"
                                    value={newItem.defectPoints || ''}
                                    className="input mt-1 bg-gray-100"
                                    type="number"
                                    placeholder="Defect Points"
                                    readOnly
                                />
                            </div>
                        </div>

                        <Button onClick={addItem} className="mt-4 ml-auto flex items-center" disabled={noDefected}>
                            <Plus size={18} className="mr-2" />
                            {editingIndex !== null ? "Update Item" : "Add Item"}
                        </Button>
                    </CardContent>
                </Card>

                
{/* Item Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList size={20} /> Item Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full border-collapse border border-gray-300 text-center">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2">Sl.No</th>
                                    <th className="border p-2">Defected Meters</th>
                                    <th className="border p-2">From Meters</th>
                                    <th className="border p-2">To Meters</th>
                                    <th className="border p-2">Defect Type</th>
                                    <th className="border p-2">Defect Points</th>
                                    <th className="border p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspectionEntries.map((item, index) => {
                                    const defectType = (defectMasterList as any)?.find((defect: any) =>
                                        defect.id.toString() === item.defectTypeId
                                    );
                                    return (
                                        <tr key={index} className="border">
                                            <td className="border p-2">{index + 1}</td>
                                            <td className="border p-2">{item.defectedMeters}</td>
                                            <td className="border p-2">{item.fromMeters}</td>
                                            <td className="border p-2">{item.toMeters}</td>
                                            <td className="border p-2">{defectType?.defectName || item.defectTypeId}</td>
                                            <td className="border p-2">{item.defectPoints}</td>
                                            <td className="border p-2">
                                                <Button size="sm" onClick={() => editItem(index)} className="mr-2">
                                                    <Edit size={14} />
                                                </Button>
                                                <Button size="sm" onClick={() => deleteItem(index)} variant="destructive">
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
               
                {/* Inspection Summary */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart size={20} /> Inspection Summary
                            </CardTitle>
                            
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-200 border border-gray-300">
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">S.No</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Piece No</th>
                                        {/* <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Piece Meters</th> */}
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Roll Doff Meter</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Inspected Meter</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actual Net Weight</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Avg Weight</th>
                                        {/* <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Points</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Points/100mtr</th> */}
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inspectionDetails.length > 0 ? (
                                        inspectionDetails.map((field, index) => (
                                            <tr key={index} className="border border-gray-300 hover:bg-gray-50">
                                                <td className="border border-gray-300 px-4 py-2">
                                                  {index + 1}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={field.pieceNo}
                                                        onChange={e => {
                                                            const details = [...inspectionDetails];
                                                            details[index].pieceNo = e.target.value;
                                                            setInspectionDetails(details);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Piece No"
                                                        readOnly
                                                    />
                                                </td>
                                                {/* <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={field.pieceMeters}
                                                        onChange={e => {
                                                            const details = [...inspectionDetails];
                                                            details[index].pieceMeters = e.target.value;
                                                            setInspectionDetails(details);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Piece Meters"
                                                    />
                                                </td> */}
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={field.rollDoffMeters ?? field.pieceMeters ?? ''}
                                                        onChange={e => {
                                                            const v = e.target.value;
                                                            const details = [...inspectionDetails];
                                                            details[index].rollDoffMeters = v;
                                                            setInspectionDetails(details);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Roll Doff Meter"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={field.inspectedMeters}
                                                        onChange={e => {
                                                            const metersValue = e.target.value;
                                                            const details = [...inspectionDetails];
                                                            details[index].inspectedMeters = metersValue;
                                                            const weightBase = details[index].actualNetWeight || watchNetWeight;
                                                            const meterBase = (Number(metersValue) > 0 ? metersValue : details[index].rollDoffMeters || details[index].pieceMeters) || watchPieceMeters;
                                                            const avg = calculateAvgWeight(weightBase, meterBase);
                                                            details[index].avgWeight = avg;
                                                            const pts = Number(watch('totalPoints') || details[index].totalPoints || details[index].totalDefectPoints || 0);
                                                            const mtr = Number(metersValue || 0) > 0 ? Number(metersValue) : Number(details[index].rollDoffMeters || details[index].pieceMeters || 0);
                                                            if (mtr > 0 && pts >= 0) {
                                                                const pts100 = ((pts * 100) / mtr).toFixed(2);
                                                                details[index].pointsPer100Mtr = pts100;
                                                                setValue('pointsPer100Mtr', pts100);
                                                            }
                                                            setInspectionDetails(details);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Inspected Meters"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={field.actualNetWeight}
                                                        onChange={e => {
                                                            const v = e.target.value;
                                                            const details = [...inspectionDetails];
                                                            details[index].actualNetWeight = v;
                                                            const meterBase = (Number(details[index].inspectedMeters) > 0 ? details[index].inspectedMeters : details[index].rollDoffMeters || details[index].pieceMeters) || watchPieceMeters;
                                                            const avg = calculateAvgWeight(v, meterBase);
                                                            details[index].avgWeight = avg;
                                                            setInspectionDetails(details);
                                                            if ((watch('netWeight') || '').toString() !== v) setValue('netWeight', v);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Net Weight"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        value={field.avgWeight || ''}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-50"
                                                        placeholder="Avg Weight"
                                                        readOnly
                                                    />
                                                </td>
                                                {/* <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={field.totalPoints ?? field.totalDefectPoints ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const details = [...inspectionDetails];
                                                            details[index].totalPoints = val;
                                                            details[index].totalDefectPoints = val;
                                                            const mtr = Number(details[index].inspectedMeters || details[index].pieceMeters || 0);
                                                            if (mtr > 0 && val !== '') {
                                                                details[index].pointsPer100Mtr = ((Number(val) * 100) / mtr).toFixed(2);
                                                            }
                                                            setInspectionDetails(details);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Total Points"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={field.pointsPer100Mtr || ''}
                                                        onChange={e => {
                                                            const details = [...inspectionDetails];
                                                            details[index].pointsPer100Mtr = e.target.value;
                                                            setInspectionDetails(details);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-50"
                                                        placeholder="Points/100mtr"
                                                        readOnly
                                                    />
                                                </td> */}
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={field.grade}
                                                        className="w-full px-2 py-1 bg-gray-100 border border-gray-300 rounded"
                                                        placeholder="Grade"
                                                        readOnly
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                                                No inspection details available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Post-Inspection Action */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList size={20} /> Post-Inspection Action
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-8">
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="PACK_IMMEDIATELY"
                                    checked={packingOption === "PACK_IMMEDIATELY"}
                                    onChange={() => setPackingOption("PACK_IMMEDIATELY")}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium">Pack Immediately</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="PACK_LATER"
                                    checked={packingOption === "PACK_LATER"}
                                    onChange={() => setPackingOption("PACK_LATER")}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium">Pack Later (Default Flow)</span>
                            </label>
                           
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="REJECT"
                                    checked={packingOption === "REJECT"}
                                    onChange={() => setPackingOption("REJECT")}
                                    className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-red-600">Reject Piece</span>
                            </label>
                        </div>

                        {packingOption === "PACK_IMMEDIATELY" && (
                            <div className="grid grid-cols-5 gap-6 pt-4 border-t border-gray-100">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Sales Order No</label>
                                    <CommonSearchableSelect
                                        options={salesOrderOptions}
                                        placeholder="Select Sales Order"
                                        value={selectedSalesOrderId}
                                        onChange={(val) => setSelectedSalesOrderId(val)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Packing Type <span className="text-red-500">*</span></label>
                                    <select
                                        value={packingType}
                                        onChange={(e) => setPackingType(e.target.value)}
                                        className="select mt-1 w-full border rounded p-2 bg-white"
                                    >
                                        <option value="Roll">Roll</option>
                                        <option value="Bale">Bale</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Target Warehouse <span className="text-red-500">*</span></label>
                                    <CommonSearchableSelect
                                        options={warehouseOptions}
                                        placeholder="Select Warehouse"
                                        value={selectedWarehouseId}
                                        onChange={(val) => setSelectedWarehouseId(val)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">UOM <span className="text-red-500">*</span></label>
                                    <CommonSearchableSelect
                                        options={uomOptions}
                                        placeholder="Select UOM"
                                        value={selectedUomId}
                                        onChange={(val) => {
                                            userSelectedUomRef.current = true;
                                            setSelectedUomId(val);
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Packing Remarks</label>
                                    <textarea
                                        value={packingRemarks}
                                        onChange={(e) => setPackingRemarks(e.target.value)}
                                        placeholder="Optional remarks for Bale/Roll Packing"
                                        className="input mt-1 w-full h-11 border rounded p-2 bg-white resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {packingOption === "PACK_LATER" && (
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-amber-700 font-semibold">Reason for Packing Later <span className="text-red-500">*</span></label>
                                <textarea
                                    value={packLaterReason}
                                    onChange={(e) => setPackLaterReason(e.target.value)}
                                    placeholder="Enter reason for packing later"
                                    className="input mt-1 w-full h-20 border rounded p-2 bg-white border-amber-300 focus:ring-amber-500 focus:border-amber-500"
                                    required
                                />
                            </div>
                        )}

                        {packingOption === "REJECT" && (
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-red-600 font-semibold">Rejected Reason <span className="text-red-500">*</span></label>
                                <textarea
                                    value={rejectedReason}
                                    onChange={(e) => setRejectedReason(e.target.value)}
                                    placeholder="Enter reason for rejecting this piece"
                                    className="input mt-1 w-full h-20 border rounded p-2 bg-white border-red-300 focus:ring-red-500 focus:border-red-500"
                                    required
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="flex justify-end mt-4">
                <Button
                    onClick={handleSubmit(onSubmit)}
                    className="bg-primary hover:bg-primary text-white px-6 flex items-center"
                    disabled={isSubmitting || !isInspectionValid || (!noDefected && inspectionEntries.length === 0)}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={18} className="mr-2 animate-spin" />
                            {isEdit ? "Updating..." : "Saving..."}
                        </>
                    ) : (
                        <>
                            <Save size={18} className="mr-2" />
                            {isEdit ? "Update Fabric Inspect" : "Save Fabric Inspect"}
                        </>
                    )}
                </Button>
                </div>
            <MeterDefectSheetModal
              isOpen={isMeterSheetModalOpen}
              onClose={() => setIsMeterSheetModalOpen(false)}
              maxMeters={Number(watch('pieceMeters') || 500)}
              inspectionEntries={inspectionEntries}
              onChangeEntries={(updated: any[]) => {
                setInspectionEntries(updated);
                if (noDefected && updated.length > 0) setNoDefected(false);
              }}
              defectTypeOptions={defectTypeOptions}
              defectMasterList={normalizedDefectList}
            />
        </div>
    );
}
