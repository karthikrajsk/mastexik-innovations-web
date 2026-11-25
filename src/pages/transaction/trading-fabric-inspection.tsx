import React, { act, useCallback, useEffect, useMemo, useState } from "react";
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
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllFactoryPieceEntries, getFactoryPieceEntriesByCompany } from "@/state/factoryPieceEntrySlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllSubCategories, getSubCategoryByCategory } from "@/state/subCategorySlice";
import documentNumberService from "@/services/DocumentNumberService";
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
    buyerInspectorId?: string;
    buyerInspector?: string;
    activeFlag: boolean;
    sourceType: string;
    purchaseInwardId?: number;
    jobworkFabricReceiveId?: number;
     openingBalanceId?: number;
    pieceNo: string;
    fabricCode: string;
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

const NO_DEFECT_GRADE_INDICATORS = new Set<string>(["1", "grade 1", "grade1", "grade a", "gradea"]);

const matchesNoDefectedGrade = (...values: any[]) =>
    values.some(value => NO_DEFECT_GRADE_INDICATORS.has(String(value ?? "").trim().toLowerCase()));

const hasNoDefectedGradeInDetails = (details?: any[]) =>
    Array.isArray(details) && details.some(detail =>
        matchesNoDefectedGrade(
            detail?.grade,
            detail?.gradeName,
            detail?.grade_name,
            detail?.gradeId,
            detail?.grade_id
        )
    );

export function TradingFabricInspection() {
    const { customerList } = useSelector((state: RootState) => state.customer);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { defectMasterList } = useSelector((state: RootState) => state.defect);
    const { gradeList } = useSelector((state: RootState) => state.grade);
    const { employeeList } = useSelector((state: RootState) => state.employee);
    const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
    const fabricMasterArray = useMemo(() => {
        const candidate = (fabricMasterList as any)?.data;
        if (Array.isArray(candidate)) {
            return candidate;
        }
        if (Array.isArray(fabricMasterList)) {
            return fabricMasterList;
        }
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
    const normalizedEmployeeList = useMemo(() => normalizeList(employeeList).filter((employee: any) => employee?.isRelieved === false), [employeeList]);
    const inspectorOptions = useMemo<CommonSearchableSelectOption[]>(
        () => normalizedEmployeeList
            .map((employee: any) => {
                const id = employee?.id ?? employee?.employeeId;
                const label = employee?.employeeName || employee?.name;
                if (!id || !label) return null;
                return {
                    id,
                    value: String(id),
                    label,
                    activeFlag: employee?.activeFlag ?? true
                };
            })
            .filter(Boolean) as CommonSearchableSelectOption[],
        [normalizedEmployeeList]
    );
    const normalizedDefectList = useMemo(() => normalizeList(defectMasterList), [defectMasterList]);
    const defectTypeOptions = useMemo<CommonSearchableSelectOption[]>(
        () => normalizedDefectList
            .map((defect: any) => {
                const id = defect?.id;
                const label = defect?.defectName;
                if (!id || !label) return null;
                return {
                    id,
                    value: String(id),
                    label,
                    activeFlag: defect?.activeFlag ?? true
                };
            })
            .filter(Boolean) as CommonSearchableSelectOption[],
        [normalizedDefectList]
    );
    const normalizedVendorList = useMemo(() => normalizeList(vendorList), [vendorList]);
    const vendorOptions = useMemo<CommonSearchableSelectOption[]>(
        () => normalizedVendorList
            .map((vendor: any) => {
                const id = vendor?.id ?? vendor?.vendorId;
                const label = vendor?.vendorName || vendor?.name || vendor?.companyName;
                if (!id || !label) return null;
                return {
                    id,
                    value: String(id),
                    label,
                    activeFlag: vendor?.activeFlag ?? true
                };
            })
            .filter(Boolean) as CommonSearchableSelectOption[],
        [normalizedVendorList]
    );
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
    const resolveFabricQualityFromMaster = useCallback((fabricCode?: string) => {
        const normalizedCode = String(fabricCode || '').trim().toLowerCase();
        if (!normalizedCode) {
            return '';
        }
        const match = fabricMasterArray.find((entry: any) => {
            const entryCode = String(entry?.fabricCode || entry?.code || entry?.fabric_code || '').trim().toLowerCase();
            return entryCode && entryCode === normalizedCode;
        });
        return match?.fabricQuality || match?.quality || '';
    }, [fabricMasterArray]);
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const navigate = useNavigate();
    const { companyMasterList } = useSelector((state: RootState) => (state as any).companyMaster);
    const companyId = useResolvedCompanyId();
    const companyName = useMemo(() => {
        const list = Array.isArray(companyMasterList) ? companyMasterList : (companyMasterList?.data || []);
        const found = list.find((c: any) => Number(c.id) === companyId);
        return found?.companyName || found?.name || '';
    }, [companyMasterList, companyId]);

    // Get source data from location state
    const sourceData = location.state?.sourceData;
    const sourceType = location.state?.sourceType;
    const editData: FabricInspectionFormData | undefined = location.state?.fabricInspDtl;
    const mode = (location.state as any)?.mode;
    const returnTab = (location.state as any)?.returnTab || 'trading';
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

    const [packingOption, setPackingOption] = useState<string>("PACK_LATER");
    const [packingType, setPackingType] = useState<string>("Roll");
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
    const [selectedUomId, setSelectedUomId] = useState<string>("");
    const [packingRemarks, setPackingRemarks] = useState<string>("");
    const [rejectedReason, setRejectedReason] = useState<string>("");
    const [packLaterReason, setPackLaterReason] = useState<string>("");
    const [buyerName, setBuyerName] = useState<string>("");
    const [orderNo, setOrderNo] = useState<string>("");
    const [selectedSalesOrderId, setSelectedSalesOrderId] = useState<string>("");
    const { salesOrderList } = useSelector((state: RootState) => (state as any).salesOrder || {});
    const { list: pieceEntryList } = useSelector((state: RootState) => (state as any).factoryPieceEntry || {});
    const { loomList } = useSelector((state: RootState) => (state as any).loomMaster || {});
    const { subCategoryList, subCategoryByCategoryList } = useSelector((state: RootState) => (state as any).subCategory || {});

    useEffect(() => {
        if (sourceData) {
            setOrderNo(sourceData.orderNo || sourceData.purchaseOrderNo || sourceData.jobWorkOrderNo || sourceData.weavingWorkOrderNo || "");
            const buyerVal = sourceData.buyerName || sourceData.customerName;
            if (buyerVal) {
                setBuyerName(buyerVal);
            } else if (sourceData.buyerId) {
                const buyerObj = customerList?.find((c: any) => c.id === sourceData.buyerId);
                setBuyerName(buyerObj?.customerName || "");
            }
        } else if (editData) {
            setOrderNo((editData as any).orderNo || "");
            const buyerVal = (editData as any).buyerName || (editData as any).customerName;
            if (buyerVal) {
                setBuyerName(buyerVal);
            } else if ((editData as any).buyerId) {
                const buyerObj = customerList?.find((c: any) => c.id === (editData as any).buyerId);
                setBuyerName(buyerObj?.customerName || "");
            }
        }
    }, [sourceData, editData, customerList]);

    const normalizedUomList = useMemo(() => {
        const raw = uomList?.data?.data ?? uomList?.data ?? uomList ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [uomList]);

    const uomOptions = useMemo<CommonSearchableSelectOption[]>(() => normalizedUomList
        .map((uom: any) => {
            const id = uom?.id;
            const label = uom?.uomName || uom?.name || 'UOM';
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

    useEffect(() => {
        if (uomOptions.length > 0 && !selectedUomId) {
            const metersUom = uomOptions.find(u => u.label.toLowerCase().includes("meter") || u.label.toLowerCase() === "mtr" || u.label.toLowerCase() === "mtrs");
            setSelectedUomId(metersUom ? metersUom.value : uomOptions[0].value);
        }
    }, [uomOptions, selectedUomId]);

    const normalizedSalesOrderList = useMemo(() => {
        const raw = salesOrderList?.data?.data ?? salesOrderList?.data ?? salesOrderList ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [salesOrderList]);

    const salesOrderOptions = useMemo<CommonSearchableSelectOption[]>(() => normalizedSalesOrderList
        .map((so: any) => {
            const id = so?.id;
            const label = so?.salesOrderNo || so?.orderNo || so?.name;
            if (id == null || !label) return null;
            return { id, value: String(id), label, activeFlag: so?.activeFlag ?? true };
        })
        .filter(Boolean) as CommonSearchableSelectOption[], [normalizedSalesOrderList]);

    const [noDefected, setNoDefected] = useState(false);
    const [isMeterSheetModalOpen, setIsMeterSheetModalOpen] = useState(false);
    const [selectedFabricMasterId, setSelectedFabricMasterId] = useState<number | null>(null);
     const normalizedSourceType = String(sourceType ?? '').trim().toLowerCase().replace(/[_\s]+/g, ' ');

   const isOpeningBalanceSource = normalizedSourceType === 'opening balance';

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
        defaultValues: {
            inspectionDate: new Date().toISOString().split('T')[0],
            loomNo: '',
        }
    });
    const inspectorRegistration = register('inspectorId', { required: true });
    const { ref: inspectorRef, onChange: inspectorOnChange, ...inspectorRest } = inspectorRegistration;
    const vendorRegistration = register('vendorId', { required: true });
    const { ref: vendorRef, onChange: vendorOnChange, ...vendorRest } = vendorRegistration;
    const watchNetWeight = watch('netWeight');
    const watchPieceMeters = watch('pieceMeters');

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

        // Handle both direct pieceEntries and nested items with pieceEntries
        let allPieces: any[] = [];

        if (data.selectedPieces && Array.isArray(data.selectedPieces)) {
            // Already selected pieces from details page
            allPieces = data.selectedPieces;
        } else if (data.items && Array.isArray(data.items)) {
            // Need to extract from items -> pieceEntries
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

    const calculateAvgWeight = (weight?: string | number, meters?: string | number) => {
        const w = weight !== undefined && weight !== null ? Number(weight) : NaN;
        const m = meters !== undefined && meters !== null ? Number(meters) : NaN;
        if (!isFinite(w) || !isFinite(m) || m === 0) {
            return "";
        }
        return (w / m).toFixed(3);
    };

    const deriveDetailAvgWeight = (detail: InspectionDetails, fallbackWeight?: string, fallbackMeters?: string) => {
        const weightValue = detail.actualNetWeight || fallbackWeight;
        const meterValue = (Number(detail.inspectedMeters) > 0 ? detail.inspectedMeters : detail.rollDoffMeters || detail.pieceMeters) || fallbackMeters;
        return calculateAvgWeight(weightValue, meterValue);
    };

    useEffect(() => {
        const loadData = async () => {
            await dispatch(getAllCustomers({fetchAll:true}));
            await dispatch(getAllVendors({fetchAll:true}));
            await dispatch(getAllDefectMaster({fetchAll:true}));
            await dispatch(getAllGrandMaster({fetchAll:true}));
            await dispatch(getAllEmployees({fetchAll:true}));
            await dispatch(getAllFabricMasters({fetchAll:true}));
            await dispatch(getAllWarehouse({fetchAll:true}));
            await dispatch(getAllUomMaster({fetchAll:true}));
            await dispatch(getAllSalesOrders({fetchAll:true}));
            await dispatch(getSubCategoryByCategory({ categoryName: 'Weave', fetchAll: true }) as any);
            await dispatch(getAllSubCategories({ fetchAll: true }) as any);
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = v ? Number(v) : undefined;
            await dispatch(getAllFabricInspection({ companyId }));
            if (companyId) {
                await dispatch(getFactoryPieceEntriesByCompany(companyId) as any);
                await dispatch(getAllLooms({ companyId } as any) as any);
            } else {
                await dispatch(getAllFactoryPieceEntries({ fetchAll: true } as any) as any);
                await dispatch(getAllLooms({} as any) as any);
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
                    pieceNo: convertToString((detail as any).pieceNo ?? (detail as any).piece_no ?? (detail as any).pieceNumber ?? (detail as any).piece_number)
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
            const fmList: any[] = fabricMasterArray;
            const fabricId = (editData as any).fabricMasterId ?? (editData as any).fabricCodeId ?? (editData as any).finishedFabricCodeId ?? (editData as any).fabric_id ?? (editData as any).fabric_code_id;
            const fabric = fabricId != null ? fmList.find((f: any) => String(f.id) === String(fabricId)) : undefined;
            const resolvedFabricCode = (editData as any).fabricCode || (editData as any).finishedFabricCode || (fabric ? (fabric.fabricCode || fabric.code || '') : '');
            const resolvedFabricQuality = (editData as any).fabricQuality || (editData as any).quality || (editData as any).finishedFabricName || (fabric ? (fabric.fabricQuality || fabric.quality || fabric.name || '') : '');
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
                        avgWeight: piece.quantity > 0 ? (Number(piece.weight || 0) / Number(piece.quantity || 1)).toFixed(3) : "0",
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
                id: (editData as any).fabricInspectionId ?? (editData as any).id ?? (editData as any).inspectionId,
                inspectionDate: ((editData as any).inspectionDate ?? (editData as any).createdDate ?? (editData as any).created_at ?? '').slice(0, 10) || new Date().toISOString().split('T')[0],
                loomNo: (editData as any).loomNo || '',
                vendorId: /opening.?balance/i.test(String((editData as any).sourceType ?? ''))
                    ? (companyId ? companyId.toString() : convertToString((editData as any).vendorId))
                    : convertToString((editData as any).vendorId),
                fabricQuality: convertToString(resolvedFabricQuality),
                pieceMeters: pieceMeters,
                netWeight: netWeight,
                totalPoints: headerTotalPoints,
                pointsPer100Mtr: headerPointsPer100Mtr,
                activeFlag: (editData as any).activeFlag,
                sourceType: (editData as any).sourceType,
                purchaseInwardId: (editData as any).purchaseInwardId,
                jobworkFabricReceiveId: (editData as any).jobworkFabricReceiveId,
                openingBalanceId: (editData as any).openingBalanceId,
                pieceNo: pieceNo,
                fabricCode: convertToString(resolvedFabricCode),
                inspectorId: convertToString((editData as any).inspectorId),
                epi: convertToString((editData as any).epi ?? (editData as any).fabric_epi ?? fabric?.epi ?? fabric?.onTableEpi ?? ''),
                ppi: convertToString((editData as any).ppi ?? (editData as any).fabric_ppi ?? fabric?.ppi ?? ''),
                width: convertToString((editData as any).width ?? (editData as any).fabricWidth ?? (editData as any).fabric_width ?? fabric?.fabricWidth ?? fabric?.width ?? ''),
                buyerInspectorId: convertToString((editData as any).buyerInspectorId ?? (editData as any).buyer_inspector_id ?? ''),
                buyerInspector: convertToString((editData as any).buyerInspector ?? (editData as any).buyer_inspector ?? ''),
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
            const hasOpeningBalanceGrade = hasNoDefectedGradeInDetails(finalDetails) && (String((editData as any).sourceType || sourceType || '').toLowerCase() === 'opening balance');
            setNoDefected(savedNoDef || hasOpeningBalanceGrade);

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
            
        } else if (sourceData) {
            const currentDate = new Date().toISOString().split('T')[0];
            const pieces = extractPiecesFromSource(sourceData, sourceType);
            setAvailablePieces(pieces);

            // Get fabric code and quality from the first item
            const firstItem = sourceData.selectedItem || (sourceData.items && sourceData.items[0]);
            const firstPiece = pieces && pieces[0];

            if (sourceType === 'Purchase Inward') {
                // For Purchase Inward:
                // fabricQuality comes from quantityReceived
                // fabricCode comes from the poItemMap that was passed or from item directly
                const fabricCode = sourceData.fabricCode || firstItem?.fabricCode || '';
                const manualFabricQuality = sourceData.quality || firstItem?.quality || '';
                const resolvedFabricQuality = manualFabricQuality || resolveFabricQualityFromMaster(fabricCode);
                const matchingFabric = fabricMasterArray.find((f: any) =>
                    (fabricCode && String(f?.fabricCode || f?.code || '').trim().toLowerCase() === String(fabricCode).trim().toLowerCase()) ||
                    (sourceData?.fabricMasterId && String(f?.id) === String(sourceData.fabricMasterId))
                );
                
                reset({
                    inspectionDate: currentDate,
                    loomNo: '',
                    vendorId: sourceData.vendorId?.toString() || '',
                    fabricQuality: resolvedFabricQuality,
                    pieceMeters: firstPiece?.quantity?.toString() || '',
                    netWeight: firstPiece?.weight?.toString() || '',
                    activeFlag: true,
                    sourceType: 'PURCHASE_INWARD',
                    purchaseInwardId: sourceData.purchaseInwardId || sourceData.id,
                    pieceNo: firstPiece?.pieceNumber || '',
                    fabricCode: fabricCode,
                    inspectorId: '',
                    epi: String(matchingFabric?.epi || matchingFabric?.onTableEpi || matchingFabric?.onLoomEpi || ''),
                    ppi: String(matchingFabric?.ppi || ''),
                    width: String(matchingFabric?.fabricWidth || matchingFabric?.width || matchingFabric?.cutWidth || ''),
                    buyerInspectorId: String(sourceData.buyerId || sourceData.customerId || ''),
                    buyerInspector: sourceData.buyerName || sourceData.customerName || '',
                    inspectionDetails: [],
                    inspectionEntries: [],
                });

                // Create inspection details for all pieces
                const details = pieces.map(piece => ({
                    fabricInspectionId: "",
                    pieceNo: piece.pieceNumber,
                    pieceEntryId: piece.pieceEntryId,
                    pieceMeters: piece.quantity.toString(),
                    rollDoffMeters: piece.quantity.toString(),
                    inspectedMeters: "0",
                    actualNetWeight: piece.weight.toString(),
                    avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(3) : "0",
                    totalDefectPoints: "0",
                    defectCounts: "0",
                    grade: "",
                    activeFlag: true
                }));
                setInspectionDetails(details);
            } else if (sourceType === 'Jobwork Fabric') {
                // For Jobwork Fabric:
                // fabricQuality comes from quality field (at root level or item level)
                // fabricCode comes from fabricCode field
                const fabricQuality = sourceData.quality || firstItem?.quality || '';
                const fabricCode = sourceData.fabricCode || firstItem?.fabricCode || '';
                const matchingFabric = fabricMasterArray.find((f: any) =>
                    (fabricCode && String(f?.fabricCode || f?.code || '').trim().toLowerCase() === String(fabricCode).trim().toLowerCase()) ||
                    (sourceData?.fabricMasterId && String(f?.id) === String(sourceData.fabricMasterId))
                );
                
                reset({
                    inspectionDate: currentDate,
                    loomNo: '',
                    vendorId: sourceData.vendorId?.toString() || '',
                    fabricQuality: fabricQuality,
                    pieceMeters: firstPiece?.quantity?.toString() || '',
                    netWeight: firstPiece?.weight?.toString() || '',
                    activeFlag: true,
                    sourceType: 'JOBWORK_FABRIC',
                    jobworkFabricReceiveId: sourceData.jobworkFabricReceiveId || sourceData.id,
                    pieceNo: firstPiece?.pieceNumber || '',
                    fabricCode: fabricCode,
                    inspectorId: '',
                    epi: String(matchingFabric?.epi || matchingFabric?.onTableEpi || matchingFabric?.onLoomEpi || ''),
                    ppi: String(matchingFabric?.ppi || ''),
                    width: String(matchingFabric?.fabricWidth || matchingFabric?.width || matchingFabric?.cutWidth || ''),
                    buyerInspectorId: String(sourceData.buyerId || sourceData.customerId || ''),
                    buyerInspector: sourceData.buyerName || sourceData.customerName || '',
                    inspectionDetails: [],
                    inspectionEntries: [],
                });

                // Create inspection details for all pieces
                const details = pieces.map(piece => ({
                    fabricInspectionId: "",
                    pieceNo: piece.pieceNumber,
                    pieceEntryId: piece.pieceEntryId,
                    pieceMeters: piece.quantity.toString(),
                    rollDoffMeters: piece.quantity.toString(),
                    inspectedMeters: "0",
                    actualNetWeight: piece.weight.toString(),
                    avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(3) : "0",
                    totalDefectPoints: "0",
                    defectCounts: "0",
                    grade: "",
                    activeFlag: true
                }));
                setInspectionDetails(details);
            } else if (sourceType === 'Opening Balance') {

                const fabricQuality = sourceData.quality || firstItem?.quality || '';
                const fabricCode = sourceData.fabricCode || firstItem?.fabricCode || '';
                const matchingFabric = fabricMasterArray.find((f: any) =>
                    (fabricCode && String(f?.fabricCode || f?.code || '').trim().toLowerCase() === String(fabricCode).trim().toLowerCase()) ||
                    (sourceData?.fabricMasterId && String(f?.id) === String(sourceData.fabricMasterId))
                );
                
                reset({
                    inspectionDate: currentDate,
                    loomNo: '',
                    vendorId: companyId ? companyId.toString() : sourceData.vendorId?.toString() || '',
                    fabricQuality: fabricQuality,
                    pieceMeters: firstPiece?.quantity?.toString() || '',
                    netWeight: firstPiece?.weight?.toString() || '',
                    activeFlag: true,
                    sourceType: 'OPENING_BALANCE',
                    openingBalanceId: sourceData.openingBalanceId || sourceData.id,
                    pieceNo: firstPiece?.pieceNumber || '',
                    fabricCode: fabricCode,
                    inspectorId: '',
                    epi: String(matchingFabric?.epi || matchingFabric?.onTableEpi || matchingFabric?.onLoomEpi || ''),
                    ppi: String(matchingFabric?.ppi || ''),
                    width: String(matchingFabric?.fabricWidth || matchingFabric?.width || matchingFabric?.cutWidth || ''),
                    buyerInspectorId: String(sourceData.buyerId || sourceData.customerId || ''),
                    buyerInspector: sourceData.buyerName || sourceData.customerName || '',
                    inspectionDetails: [],
                    inspectionEntries: []
                });

                const details = pieces.map(piece => ({
                    fabricInspectionId: "",
                    pieceNo: piece.pieceNumber,
                    pieceMeters: piece.quantity.toString(),
                    rollDoffMeters: piece.quantity.toString(),
                    inspectedMeters: "0",
                    actualNetWeight: piece.weight.toString(),
                    avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(3) : "0",
                    totalDefectPoints: "0",
                    defectCounts: "0",
                    grade:"",
                    activeFlag: true
                }));
                setInspectionDetails(details);
            } else if (sourceType === 'Piece Split' || sourceType === 'Piece Join') {
                const fabricQuality = sourceData.quality || sourceData.fabricQuality || '';
                const fabricCode = sourceData.fabricCode || '';
                const matchingFabric = fabricMasterArray.find((f: any) =>
                    (fabricCode && String(f?.fabricCode || f?.code || '').trim().toLowerCase() === String(fabricCode).trim().toLowerCase()) ||
                    (sourceData?.fabricMasterId && String(f?.id) === String(sourceData.fabricMasterId))
                );

                reset({
                    inspectionDate: currentDate,
                    loomNo: '',
                    vendorId: companyId ? companyId.toString() : '',
                    fabricQuality: fabricQuality,
                    pieceMeters: firstPiece?.quantity?.toString() || '',
                    netWeight: firstPiece?.weight?.toString() || '',
                    activeFlag: true,
                    sourceType: sourceType === 'Piece Split' ? 'PIECE_SPLIT' : 'PIECE_JOIN',
                    pieceNo: firstPiece?.pieceNumber || '',
                    fabricCode: fabricCode,
                    inspectorId: '',
                    epi: String(matchingFabric?.epi || matchingFabric?.onTableEpi || matchingFabric?.onLoomEpi || ''),
                    ppi: String(matchingFabric?.ppi || ''),
                    width: String(matchingFabric?.fabricWidth || matchingFabric?.width || matchingFabric?.cutWidth || ''),
                    buyerInspectorId: String(sourceData.buyerId || sourceData.customerId || ''),
                    buyerInspector: sourceData.buyerName || sourceData.customerName || '',
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
                    avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(3) : "0",
                    totalDefectPoints: "0",
                    defectCounts: "0",
                    grade: "",
                    activeFlag: true
                }));
                setInspectionDetails(details);
            }

        } else {
            reset({
                inspectionDate: new Date().toISOString().split('T')[0],
                activeFlag: true,
                inspectorId: '',
                inspectionDetails: [],
                inspectionEntries: [],
            });
        }
    }, [dispatch, isEdit, editData, sourceData, sourceType, reset]);

    // Autofetch piece entry details against pieceEntryId / pieceNo
    useEffect(() => {
        const rawPieces: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
        const sd: any = sourceData || {};
        const ed: any = editData || {};
        const pno = (watch('pieceNo') || '').trim();
        const targetPieceEntryId = sd?.pieceEntryId || sd?.selectedPieces?.[0]?.pieceEntryId || sd?.selectedPieces?.[0]?.id || ed?.pieceEntryId || ed?.piece_entry_id || (inspectionDetails as any)?.[0]?.pieceEntryId;

        if (!targetPieceEntryId && !pno) return;

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
            if (fromPiece.loomId) {
                const rawLoom: any = loomList as any;
                const loomArr: any[] = Array.isArray(rawLoom) ? rawLoom : Array.isArray(rawLoom?.data) ? rawLoom.data : [];
                const lm = loomArr.find((l: any) => String(l?.id) === String(fromPiece.loomId));
                const lno = lm?.loomNo || lm?.loomName || lm?.name || '';
                if (lno) setValue('loomNo', String(lno));
            }
        }
    }, [pieceEntryList, loomList, sourceData, editData, inspectionDetails, watch('pieceNo'), setValue]);

    // Create a validation function
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

    // Update the validation effect
    useEffect(() => {
        setIsDetailsValid(validateDetails());
        const subscription = watch(() => {
            setIsDetailsValid(validateDetails());
        });

        return () => subscription.unsubscribe();
    }, [watch]);

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
        if (sourceType === 'Opening Balance' || sourceType === 'Piece Split' || sourceType === 'Piece Join') {
            setValue('vendorId', companyId ? companyId.toString() : '');
        }
    }, [companyId, setValue, sourceType]);

    // Auto-set defect points when defect type is selected
    const handleDefectTypeChange = (defectId: string) => {
        if (!defectId) {
            setNewItem({
                ...newItem,
                defectTypeId: '',
                defectPoints: ''
            });
            return;
        }

        if (defectsLoaded && Array.isArray(defectMasterList)) {
            const selectedDefect = defectMasterList.find((defect: DefectMaster) =>
                defect.id.toString() === defectId
            );

            setNewItem({
                ...newItem,
                defectTypeId: defectId,
                defectPoints: selectedDefect ? selectedDefect.defectPoint.toString() : ""
            });
        }
    };

    // Helper function to calculate grade based on total defect points
    const calculateGradeForPoints = (totalPoints: number): string => {
        if (!Array.isArray(gradeList) || gradeList.length === 0) {
            return "";
        }

        // Find grade where totalPoints falls between minPoint and maxPoint
        const matchedGrade = gradeList.find((g: any) => {
            const minPt = parseFloat(g.minPoint) || 0;
            const maxPt = parseFloat(g.maxPoint) || 0;
            return totalPoints >= minPt && totalPoints <= maxPt;
        });

        return matchedGrade ? matchedGrade.gradeName : "";
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
            const gradeName = calculateGradeForPoints(totalPoints);
            const tp = totalPoints.toString();
            const inspectedMtr = Number(inspectionDetails[0]?.inspectedMeters) > 0
                ? Number(inspectionDetails[0]?.inspectedMeters)
                : Number(inspectionDetails[0]?.rollDoffMeters || watch('pieceMeters') || 0);
            if (inspectedMtr > 0) {
                setValue('pointsPer100Mtr', ((totalPoints * 100) / inspectedMtr).toFixed(2));
            }
            setValue('totalPoints', tp);
            const needsUpdate = inspectionDetails.some(d => d.totalDefectPoints !== tp || d.grade !== gradeName);
            if (needsUpdate) {
                setInspectionDetails(inspectionDetails.map(detail => ({
                    ...detail,
                    totalDefectPoints: tp,
                    grade: gradeName
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

        const directFabricMasterId =
            selectedFabricMasterId ??
            (editData as any)?.fabricMasterId ??
            (editData as any)?.fabricCodeId ??
            (editData as any)?.fabric_master_id ??
            (sourceData as any)?.fabricMasterId ??
            (sourceData as any)?.fabricCodeId;

        let directMatch = directFabricMasterId != null ? fabricMasterArray.find((f: any) => String(f?.id) === String(directFabricMasterId)) : undefined;
        if (!directMatch) {
            const fabricCodeVal = String((editData as any)?.fabricCode || (sourceData as any)?.fabricCode || '').trim().toLowerCase();
            if (fabricCodeVal) {
                directMatch = fabricMasterArray.find((f: any) => String(f?.fabricCode || f?.code || '').trim().toLowerCase() === fabricCodeVal);
            }
        }
        if (directMatch) {
            if (!selectedFabricMasterId) setSelectedFabricMasterId(directMatch.id);
            if (directMatch.fabricQuality || directMatch.quality) {
                setValue('fabricQuality', directMatch.fabricQuality || directMatch.quality || '', { shouldValidate: true });
            }
            const wName = resolveWeaveName(directMatch);
            if (wName) setValue('weave', wName);
            if (!watch('epi')) setValue('epi', String(directMatch.epi || directMatch.onTableEpi || directMatch.onLoomEpi || ''));
            if (!watch('ppi')) setValue('ppi', String(directMatch.ppi || ''));
            if (!watch('width')) setValue('width', String(directMatch.fabricWidth || directMatch.width || directMatch.cutWidth || ''));
        }
    }, [fabricMasterArray, selectedFabricMasterId, editData, sourceData, resolveWeaveName, setValue]);

    const editItem = (index: number) => {
        setNewItem(inspectionEntries[index]);
        setEditingIndex(index);
    };

    const deleteItem = (index: number) => {
        setInspectionEntries(inspectionEntries.filter((_, i) => i !== index));
    };

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

    const resolvedVendorId = (data.sourceType === 'OPENING_BALANCE' || data.sourceType === 'PIECE_SPLIT' || data.sourceType === 'PIECE_JOIN')
        ? companyId?.toString() ?? data.vendorId
        : data.vendorId;

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
        ...data,
        epi: data.epi || null,
        ppi: data.ppi || null,
        width: data.width || null,
        buyerInspectorId: data.buyerInspectorId ? Number(data.buyerInspectorId) : null,
        buyerInspector: buyerInspectorName,
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
        vendorId: resolvedVendorId,
        inspectionDetails: detailsPayload,
        inspectionEntries,
        activeFlag: true,
        companyId,
        isNoDefectedPieces: noDefected ? 1 : 0,
        isFactoryFabric: 0,
        fabricTypeId: returnTab === 'finish' ? 2 : 1,
        fabricMasterId: selectedFabricMasterId,
        
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
        console.log('Submitting payload:', payload);
        
        if (isEdit && data.id) {
            await dispatch(updateFabricInspection({ id: data.id, data: payload, companyId }) as any).unwrap();
        } else {
            await dispatch(createFabricInspection(payload) as any).unwrap();
            if (packingOption === "PACK_IMMEDIATELY") {
                documentNumberService.clearMemoryCache("Bale/Roll Packing");
            }
        }
        
        await dispatch(getAllPurchaseInwards({}));
        await dispatch(getAllJobworkFabricReceive(companyId ? { companyId } : {}));
        await dispatch(getAllFabricInspection({ companyId }) as any);
        
        // Navigate based on returnTab
        if (returnTab === 'finish') {
            navigate('/transaction/trading-fabric-inspection-management', { 
                state: { tab: 'finishedFabricInspection', activeTab: returnStatus }
            });
        } else {
             navigate('/transaction/trading-fabric-inspection-management', { 
                state: { activeTab: returnStatus,returnTab: 'trading'} 
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
                state: { activeTab: returnStatus,returnTab: 'trading'} 
            });
    };
    // const handleBack = () => {
    //     navigate('/transaction/trading-fabric-inspection-management', {
    //         state: { tab: 'greigeFabricInspection', activeTab: returnStatus }
    //     });
    // };

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
                    <CardContent className="grid grid-cols-3 gap-8">
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
                            <label className="block text-sm font-medium text-secondary-700">Loom No</label>
                            <input
                                {...register('loomNo')}
                                className="input mt-1"
                                placeholder="Loom No"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Vendor <span className="text-red-500">*</span></label>
                            {isOpeningBalanceSource ? (
                                <>
                                    <input type="hidden" {...vendorRegistration} />
                                    <input
                                        className="input mt-1 bg-gray-100"
                                        type="text"
                                        value={companyName || 'Own'}
                                        readOnly
                                        placeholder="Company"
                                    />
                                </>
                            ) : (
                                <CommonSearchableSelect
                                    {...vendorRest}
                                    ref={vendorRef}
                                    options={vendorOptions}
                                    filterActive
                                    placeholder="Select a Vendor"
                                    value={watch('vendorId') || ''}
                                    onValueChange={(value) => vendorOnChange?.({
                                        target: { name: 'vendorId', value },
                                        currentTarget: { name: 'vendorId', value },
                                        preventDefault: () => {},
                                        stopPropagation: () => {}
                                    } as any)}
                                    className=" mt-1"
                                    error={errors.vendorId?.message as string}
                                    required
                                />
                            )}
                            {errors.vendorId && <p className="text-red-500 text-xs mt-1">Vendor is required</p>}
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
                            <label className="block text-sm font-medium text-secondary-700">EPI</label>
                            <input
                                {...register('epi')}
                                className="input mt-1 bg-gray-100"
                                placeholder="EPI"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">PPI</label>
                            <input
                                {...register('ppi')}
                                className="input mt-1 bg-gray-100"
                                placeholder="PPI"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Width</label>
                            <input
                                {...register('width')}
                                className="input mt-1 bg-gray-100"
                                placeholder="Width"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Piece Meters <span className="text-red-500">*</span></label>
                            <input
                                {...register('pieceMeters', { required: true })}
                                className="input mt-1 bg-gray-100"
                                placeholder="Piece Meters"
                                type="number"
                                readOnly
                                required
                            />
                            {errors.pieceMeters && <p className="text-red-500 text-xs mt-1">Piece Meters is required</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Inspector <span className="text-red-500">*</span></label>
                            <CommonSearchableSelect
                                {...inspectorRest}
                                ref={inspectorRef}
                                options={inspectorOptions}
                                filterActive
                                placeholder="Select Inspector"
                                value={watch('inspectorId') || ''}
                                onValueChange={(value) => inspectorOnChange?.({
                                    target: { name: 'inspectorId', value },
                                    currentTarget: { name: 'inspectorId', value },
                                    preventDefault: () => {},
                                    stopPropagation: () => {}
                                } as any)}
                                className=" mt-1"
                                error={errors.inspectorId?.message as string}
                                required
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
                            <label className="block text-sm font-medium text-secondary-700">Selvedge Thread</label>
                            <input
                                {...register('selvedgeThread')}
                                className="input mt-1"
                                placeholder="Selvedge Thread"
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

                {/* Inspection Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart size={20} /> Inspection Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-200 border border-gray-300">
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">S.No</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Piece No</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Roll Doff Meter</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Inspected Meter</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actual Net Weight</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Avg Weight</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Total Points</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Points/100mtr</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inspectionDetails.length > 0 ? (
                                        inspectionDetails.map((field, index) => (
                                            <tr key={index} className="border border-gray-300 hover:bg-gray-50">
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={index + 1}
                                                        className="w-full px-2 py-1 bg-gray-100 border border-gray-300 rounded"
                                                        readOnly
                                                    />
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
                                                            const mtrVal = e.target.value;
                                                            const details = [...inspectionDetails];
                                                            details[index].inspectedMeters = mtrVal;
                                                            const pts = Number(watch('totalPoints') || details[index].totalPoints || details[index].totalDefectPoints || 0);
                                                            const mtr = Number(mtrVal || 0) > 0 ? Number(mtrVal) : Number(details[index].rollDoffMeters || details[index].pieceMeters || 0);
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
                                                        onChange={e => {
                                                            const details = [...inspectionDetails];
                                                            details[index].avgWeight = e.target.value;
                                                            setInspectionDetails(details);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Avg Weight"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={field.totalPoints ?? field.totalDefectPoints ?? ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const details = [...inspectionDetails];
                                                            details[index].totalPoints = val;
                                                            details[index].totalDefectPoints = val;
                                                            const mtr = Number(details[index].inspectedMeters) > 0 ? Number(details[index].inspectedMeters) : Number(details[index].rollDoffMeters || details[index].pieceMeters || 0);
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
                                                </td>
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
                        <div className="grid grid-cols-4 gap-6">
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
                                    options={defectTypeOptions}
                                    filterActive
                                    placeholder="Select a Defect Type"
                                    value={newItem.defectTypeId || ''}
                                    onValueChange={handleDefectTypeChange}
                                    className=" mt-1"
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
                                    const defectType = defectMasterList?.find((defect: any) =>
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
                                    value="REJECT"
                                    checked={packingOption === "REJECT"}
                                    onChange={() => setPackingOption("REJECT")}
                                    className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-red-600">Reject Piece</span>
                            </label>
                        </div>

                        {packingOption === "PACK_IMMEDIATELY" && (
                            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-100">
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
                                        onChange={(val) => setSelectedUomId(val)}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
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