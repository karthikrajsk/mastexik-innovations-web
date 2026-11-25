import React, { useEffect, useState, useMemo, useRef } from "react";
import { FileText, ClipboardList, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CommonSearchableSelect, { CommonSearchableSelectOption } from "@/components/ui/CommonSearchableSelect";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { createYarnReturn, updateYarnReturn, getAllYarnReturns } from "@/state/yarnReturnSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllSizingYarnIssue } from "@/state/sizingYarnIssueSlice";
import { getAllWeavingYarnIssue } from "@/state/weavingYarnIssueSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllYarnDispatch } from "@/state/yarn-dispatch-for-dyeing-slice";
import documentNumberService from "@/services/DocumentNumberService";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { useYarnWarehouseOptions } from "@/hooks/useYarnWarehouseOptions";
import { VENDOR_TYPE_ALL, filterVendorsByTypeIds } from "@/utils/vendorFilters";
import { toast } from "react-toastify";
import { getAllFabricDispatch } from "@/state/processIssueSlice";
import { getAllDyeingWorkOrders } from "@/state/processContractSlice";

interface YarnInwardItem {
    id?: number;
    yarnId: number | null;
    yarnName: string;
    actualYarnId?: number | null;
    actualYarnName?: string;
    noOfBags: number;
    totalKgs: number;
    conesPerBag?: number;
    conesWeight?: number;
    lotNo: string;
    inwardId?: number;
    orderItemId?: number;
    greigeYarnId?: number | null;
    greigeYarnName?: string;
    finishedYarnId?: number | null;
    finishedYarnName?: string;
}

interface SummaryItem {
    yarnName: string;
    actualYarnName?: string;
    actualYarnNames?: string[];
    totalBags: number;
    totalKgs: number;
}

interface YarnRequirementDetail {
    id: number;
    yarnName: string;
    actualYarnId?: number | null;
    actualYarnName?: string;
    greigeYarnId?: number | null;
    greigeYarnName?: string;
    finishedYarnId?: number | null;
    finishedYarnName?: string;
    issuedQty: number;
}

interface YarnReturnDetailsFormData {
    inwardNumber: string;
    inwardDate: string;
    inwardType: string;
    orderNo: string;
    vendorId: number;
    vendorName: string;
    warehouseId: number | null;
    issuedQty: number;
    remarks: string;
    activeFlag: boolean;
    dcNumber: string | null;
    dcDate: string;
    yarnReturnItems: YarnInwardItem[];
    yarnReturnRequirements?: YarnRequirementDetail[];
    millId: number | null;
    companyId: number;
}

const SIZING_RETURN_VENDOR_TYPE_IDS = [302, VENDOR_TYPE_ALL];
const WEFT_RETURN_VENDOR_TYPE_IDS = [303, VENDOR_TYPE_ALL];
const PROCESS_RETURN_VENDOR_TYPE_IDS = [304, VENDOR_TYPE_ALL];

const INWARD_TYPE_OPTIONS: CommonSearchableSelectOption[] = [
    { id: 'SIZING_YARN_RETURN', value: 'SIZING_YARN_RETURN', label: 'Sizing Yarn Return' },
    { id: 'WEAVING_YARN_RETURN', value: 'WEAVING_YARN_RETURN', label: 'Weft Yarn Return' },
    { id: 'PROCESSING_YARN_RETURN', value: 'PROCESSING_YARN_RETURN', label: 'Process Yarn Return' }
];

const YarnReturn = () => {
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const navigate = useNavigate();
    const yarnReturnDtl = location.state?.yarnReturnDtl;
    const companyId = useResolvedCompanyId();

    const [isEditMode, setIsEditMode] = useState<boolean>(false);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<YarnReturnDetailsFormData>({
        mode: 'onBlur',
        defaultValues: {
            inwardNumber: '',
            inwardDate: '',
            inwardType: '',
            orderNo: '',
            vendorId: 0,
            vendorName: '',
            warehouseId: null,
            issuedQty: 0,
            remarks: '',
            activeFlag: true,
            dcNumber: null,
            dcDate: '',
            millId: null,
            yarnReturnItems: [] as YarnInwardItem[],
            companyId: companyId || 0
        }
    });

    const inwardType = watch("inwardType");
    const orderNo = watch("orderNo");
    const warehouseId = watch("warehouseId");
    const millId = watch("millId");

    const { warehouseList } = useSelector((state: RootState) => state.warehouse);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const sizingReturnVendors = useMemo(() => {
        const filtered = filterVendorsByTypeIds(vendorList, SIZING_RETURN_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null });
        if (isEditMode && yarnReturnDtl?.vendorId && inwardType === 'SIZING_YARN_RETURN') {
            const currentVendor = (Array.isArray(vendorList) ? vendorList : (vendorList as any)?.data || []).find((v: any) => v.id === yarnReturnDtl.vendorId);
            if (currentVendor && !filtered.find((v: any) => v.id === currentVendor.id)) {
                return [...filtered, currentVendor];
            }
        }
        return filtered;
    }, [vendorList, isEditMode, yarnReturnDtl, inwardType]);

    const weftReturnVendors = useMemo(() => {
        const filtered = filterVendorsByTypeIds(vendorList, WEFT_RETURN_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null });
        if (isEditMode && yarnReturnDtl?.vendorId && inwardType === 'WEAVING_YARN_RETURN') {
            const currentVendor = (Array.isArray(vendorList) ? vendorList : (vendorList as any)?.data || []).find((v: any) => v.id === yarnReturnDtl.vendorId);
            if (currentVendor && !filtered.find((v: any) => v.id === currentVendor.id)) {
                return [...filtered, currentVendor];
            }
        }
        return filtered;
    }, [vendorList, isEditMode, yarnReturnDtl, inwardType]);

    const processReturnVendors = useMemo(() => {
        const filtered = filterVendorsByTypeIds(vendorList, PROCESS_RETURN_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null });
        if (isEditMode && yarnReturnDtl?.vendorId && inwardType === 'PROCESSING_YARN_RETURN') {
            const currentVendor = (Array.isArray(vendorList) ? vendorList : (vendorList as any)?.data || []).find((v: any) => v.id === yarnReturnDtl.vendorId);
            if (currentVendor && !filtered.find((v: any) => v.id === currentVendor.id)) {
                return [...filtered, currentVendor];
            }
        }
        return filtered;
    }, [vendorList, isEditMode, yarnReturnDtl, inwardType]);
    const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
    const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts as any);
    const { sizingYarnIssuetList } = useSelector((state: RootState) => state.sizingYarnIssue as any);
    const { weavingYarnIssuetList } = useSelector((state: RootState) => state.weavingYarnIssue as any);
    const { yarnList } = useSelector((state: RootState) => state.yarn as any);
    const { subCategoryList: subCategories } = useSelector((state: RootState) => state.subCategory as any);
    const { yarnDispatchDyingList } = useSelector((state: RootState) => state.yarnDispatchForDyeing as any);
    const { fabricDispatchDyingList } = useSelector((state: RootState) => state.fabricDispatchDyeing as any);
    const { processContractList } = useSelector((state: RootState) => state.dyeingWorkOrde);

    const [yarnInwardItems, setYarnInwardItems] = useState<YarnInwardItem[]>([]);
    const [summaryItems, setSummaryItems] = useState<SummaryItem[]>([]);
    const [issuedYarns, setIssuedYarns] = useState<any[]>([]);
    const [yarnRequirementDetails, setYarnRequirementDetails] = useState<YarnRequirementDetail[]>([]);
    const [issuedQty, setIssuedQty] = useState<number>(0);
    const [availableVendors, setAvailableVendors] = useState<any[]>([]);
    const [availableOrders, setAvailableOrders] = useState<any[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
    const [selectedOrderData, setSelectedOrderData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const { yarnReturnList } = useSelector((state: RootState) => state.yarnReturn);
    const isProcessingInwardType = inwardType === "PROCESSING_YARN_RETURN";

    const { yarnWarehouseOptions: warehouseSelectOptions, defaultYarnWarehouseId } = useYarnWarehouseOptions(warehouseList);

    const getIssuedEntryKey = (entry: {
        actualYarnId?: number | null;
        inwardId?: number;
        orderItemId?: number;
        lotNo?: string;
    }) => {
        const actualYarnId = entry.actualYarnId ?? 0;
        const inwardId = entry.inwardId ?? 0;
        const orderItemId = entry.orderItemId ?? 0;
        const lotNo = (entry.lotNo || '').toString().trim().toLowerCase();
        return `${actualYarnId}-${inwardId}-${orderItemId}-${lotNo}`;
    };

    const getIssuedSelectionKey = (entry: {
        actualYarnId?: number | null;
        inwardId?: number;
        orderItemId?: number;
    }) => {
        const actualYarnId = entry.actualYarnId ?? 0;
        const inwardId = entry.inwardId ?? 0;
        const orderItemId = entry.orderItemId ?? 0;
        return `${actualYarnId}-${inwardId}-${orderItemId}`;
    };

    const orderPlaceholder = inwardType === "SIZING_YARN_RETURN"
        ? "Select Sizing Plan"
        : (inwardType === "WEAVING_YARN_RETURN" || inwardType === "WEFT_YARN_RETURN")
            ? "Select Weaving Contract"
            : inwardType === "PROCESSING_YARN_RETURN"
                ? "Select Process Contract"
                : "Select Order";

    const normalizedProcessContracts = useMemo(() => {
        if (Array.isArray(processContractList)) return processContractList;
        if (Array.isArray((processContractList as any)?.data)) return (processContractList as any).data;
        if (Array.isArray((processContractList as any)?.data?.data)) return (processContractList as any).data.data;
        return [];
    }, [processContractList]);

    const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);

    // Generate document number for new beam inward entries
    useEffect(() => {
        const generateDocumentNumber = async () => {
            if (yarnReturnDtl || hasGeneratedNumberRef.current) {
                return;
            }

            try {
                const result = await documentNumberService.generateDocumentNumber({
                    screenName: 'Yarn Return Details'
                });

                setValue('inwardNumber', result.documentNumber, { shouldValidate: true });
                hasGeneratedNumberRef.current = true;
            } catch (error) {
                console.error('Failed to generate Yarn Return Details number:', error);
                toast.error('Failed to generate Yarn Return Details number');
            }
        };

        generateDocumentNumber();
    }, [yarnReturnDtl, setValue]);

    // Cleanup document number cache if not saved
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !yarnReturnDtl) {
                documentNumberService.clearMemoryCache('Yarn Return Details');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !yarnReturnDtl) {
                documentNumberService.clearMemoryCache('Yarn Return Details');
            }
        };
    }, [yarnReturnDtl]);

    useEffect(() => {
        setValue('inwardNumber', yarnReturnDtl?.inwardNumber || '');
    }, [yarnReturnDtl, setValue]);

    useEffect(() => {
        if (!companyId) return;
        dispatch(getAllYarnReturns({ fetchAll: true, companyId }));
    }, [dispatch, companyId]);

    useEffect(() => {
        if (!yarnReturnDtl && defaultYarnWarehouseId) {
            setValue("warehouseId", Number(defaultYarnWarehouseId));
        }
    }, [defaultYarnWarehouseId, yarnReturnDtl, setValue]);


    // Returns date in YYYY-MM-DD format for HTML date input
    const getCurrentDateForInput = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Converts DD/MM/YYYY to YYYY-MM-DD for HTML date input
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return getCurrentDateForInput();
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
    };

    const calculateConesWeight = (item: Partial<YarnInwardItem>) => {
        const cones = Number(item.conesPerBag) || 0;
        const bags = Number(item.noOfBags) || 0;
        const total = Number(item.totalKgs) || 0;
        if (cones <= 0 || bags <= 0 || total <= 0) return 0;
        const kgsPerBag = total / bags;
        return Number((kgsPerBag / cones).toFixed(3));
    };

    const getYarnNameById = (yarnId?: number | null): string => {
        if (yarnId == null || !Array.isArray(yarnList)) return '';
        const yarn = yarnList.find((y: any) => Number(y?.id) === Number(yarnId));
        return yarn?.yarnName || yarn?.name || '';
    };

    const getYarnCount = (yarnId?: number | null): string => {
        if (yarnId == null || !yarnList || !Array.isArray(yarnList)) return 'N/A';
        const yarn = yarnList.find((y: any) => Number(y.id) === Number(yarnId));
        const count = yarn?.conversion || yarn?.yarnCount || yarn?.count || yarn?.countSno;
        return count ? String(count) : 'N/A';
    };

    const getYarnQuality = (yarnId?: number | null): string => {
        if (yarnId == null || !yarnList || !Array.isArray(yarnList)) return 'N/A';
        const yarn = yarnList.find((y: any) => Number(y.id) === Number(yarnId));
        const quality = yarn?.conversion || yarn?.quality || yarn?.yarnQuality || yarn?.yarnCount || yarn?.count || yarn?.countSno;
        return quality ? String(quality) : 'N/A';
    };

    const millOptions = useMemo(() => (subCategories || []).filter((sc: any) => sc.categoryName === "Mill"), [subCategories]);

    const vendorSelectOptions = useMemo<CommonSearchableSelectOption[]>(() => {
        const options: CommonSearchableSelectOption[] = [];
        (availableVendors || []).forEach((vendor) => {
            const id = vendor?.id;
            const name = vendor?.vendorName || vendor?.customerName || vendor?.name;
            if (id == null || !name) return;
            options.push({ id, value: String(id), label: name, activeFlag: vendor?.activeFlag });
        });
        return options;
    }, [availableVendors]);

    const orderSelectOptions = useMemo<CommonSearchableSelectOption[]>(() => {
        const options: CommonSearchableSelectOption[] = [];
        (availableOrders || []).forEach((order) => {
            if (!order?.id || !order?.orderNo) return;
            options.push({ id: order.id, value: String(order.id), label: order.orderNo });
        });
        return options;
    }, [availableOrders]);

    const millSelectOptions = useMemo<CommonSearchableSelectOption[]>(() => {
        const options: CommonSearchableSelectOption[] = [];
        (millOptions || []).forEach((mill: any) => {
            const id = mill?.id;
            const label = mill?.subCategoryName || mill?.name;
            if (id == null || !label) return;
            options.push({ id, value: String(id), label, activeFlag: mill?.activeFlag ?? true });
        });
        return options;
    }, [millOptions]);

    const existingLotNumbers = useMemo(() => {
        const lots = new Set<string>();
        (Array.isArray(yarnReturnList) ? yarnReturnList : []).forEach((yarnReturn: any) => {
            if (isEditMode && yarnReturnDtl?.id && yarnReturn.id === yarnReturnDtl.id) {
                return;
            }
            const items = Array.isArray(yarnReturn.yarnReturnItems) ? yarnReturn.yarnReturnItems : [];
            items.forEach((item: any) => {
                const lot = item?.lotNo?.toString()?.trim()?.toLowerCase();
                if (lot) {
                    lots.add(lot);
                }
            });
        });
        return lots;
    }, [yarnReturnList, isEditMode, yarnReturnDtl?.id]);

    // Load all required data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    dispatch(getAllWarehouse({ fetchAll: true })),
                    dispatch(getAllVendors({ fetchAll: true })),
                    dispatch(getAllSizingPlan({ companyId, fetchAll: true } as any)),
                    dispatch(getAllWeavingContract({ companyId, fetchAll: true } as any)),
                    dispatch(getAllSizingYarnIssue({ fetchAll: true })),
                    dispatch(getAllWeavingYarnIssue({ fetchAll: true })),
                    dispatch(getAllYarnMasters({ fetchAll: true })),
                    dispatch(getAllSubCategories({ fetchAll: true })),
                    dispatch(getAllYarnDispatch({ processType: "YARN" })),
                    dispatch(getAllFabricDispatch({ processType: "YARN", fetchAll: true })),
                    dispatch(getAllDyeingWorkOrders({ fetchAll: true }))
                ]);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        console.log('[YarnReturn] yarnReturnDtl:', yarnReturnDtl);
        console.log('[YarnReturn] yarnReturnDtl?.yarnReturnItems:', yarnReturnDtl?.yarnReturnItems);

        if (yarnReturnDtl) {
            setIsEditMode(true);
            console.log('[YarnReturn] Entering edit mode');
            // Set form values for edit mode
            const formData: any = {
                id: yarnReturnDtl.id ?? "",
                inwardNumber: yarnReturnDtl.inwardNumber ?? "",
                inwardDate: yarnReturnDtl.inwardDate
                    ? formatDateForInput(yarnReturnDtl.inwardDate)
                    : getCurrentDateForInput(),
                inwardType: (yarnReturnDtl.inwardType === 'WEFT_YARN_RETURN' ? 'WEAVING_YARN_RETURN' : (yarnReturnDtl.inwardType ?? "")),
                orderNo: yarnReturnDtl.orderNo ?? "",
                vendorName: yarnReturnDtl.vendorName ?? "",
                vendorId: yarnReturnDtl.vendorId ?? 0,
                warehouseId: yarnReturnDtl.warehouseId ?? null,
                millId: yarnReturnDtl.millId ?? null,
                issuedQty: yarnReturnDtl.issuedQty ?? 0,
                remarks: yarnReturnDtl.remarks ?? "",
                dcDate: yarnReturnDtl.dcDate ? formatDateForInput(yarnReturnDtl.dcDate)
                    : getCurrentDateForInput(),
                dcNumber: yarnReturnDtl.dcNumber ?? null,
                activeFlag: yarnReturnDtl.activeFlag ?? true,
            };

            // Explicitly set values to ensure they are picked up by watch() immediately
            Object.keys(formData).forEach(key => {
                setValue(key as any, formData[key]);
            });

            reset(formData);
            setIssuedQty(yarnReturnDtl.issuedQty || 0);
            setSelectedVendorId(yarnReturnDtl.vendorId || null);

            // Populate yarn items for edit mode
            if (yarnReturnDtl.yarnReturnItems) {
                const items = yarnReturnDtl.yarnReturnItems.map((item: any) => {
                    const resolvedYarnId = item.yarnId ?? null;
                    const resolvedActualYarnId = item.actualYarnId ?? item.yarnId ?? null;
                    const base: YarnInwardItem = {
                        id: item.id,
                        yarnId: resolvedYarnId,
                        yarnName: getYarnNameById(resolvedYarnId) || item.yarnName || "",
                        actualYarnId: resolvedActualYarnId,
                        actualYarnName: getYarnNameById(resolvedActualYarnId) || item.actualYarnName || item.actualYarn || item.yarnName || "",
                        greigeYarnId: item.greigeYarnId ?? resolvedActualYarnId ?? item.yarnId ?? null,
                        greigeYarnName: item.greigeYarnName || item.actualYarnName || item.actualYarn || "",
                        finishedYarnId: item.finishedYarnId ?? resolvedYarnId ?? null,
                        finishedYarnName: item.finishedYarnName || item.yarnName || "",
                        noOfBags: item.noOfBags,
                        totalKgs: item.totalKgs,
                        conesPerBag: item.conesPerBag ?? 0,
                        conesWeight: item.conesWeight ?? 0,
                        lotNo: item.lotNo || "",
                        inwardId: item.inwardId,
                        orderItemId: item.orderItemId
                    };
                    if (!base.conesWeight || base.conesWeight === 0) {
                        base.conesWeight = calculateConesWeight(base);
                    }
                    return base;
                });
                setYarnInwardItems(items);

                // Create issuedYarns from the existing items for dropdown
                const uniqueYarns = items.reduce((acc: any[], item: YarnInwardItem) => {
                    const existingMatch = acc.find((y) =>
                        getIssuedSelectionKey({
                            actualYarnId: y.actualYarnId ?? y.id,
                            inwardId: y?.inwardInfo?.[0]?.inwardId ?? y.inwardId,
                            orderItemId: y?.inwardInfo?.[0]?.orderItemId ?? y.orderItemId
                        }) === getIssuedSelectionKey({
                            actualYarnId: item.actualYarnId ?? item.yarnId,
                            inwardId: item.inwardId,
                            orderItemId: item.orderItemId
                        })
                    );
                    if (!existingMatch) {
                        acc.push({
                            id: item.yarnId,
                            yarnName: item.yarnName,
                            actualYarnId: item.actualYarnId ?? item.yarnId,
                            actualYarnName: item.actualYarnName || getYarnNameById(item.actualYarnId ?? item.yarnId),
                            greigeYarnId: item.greigeYarnId ?? item.actualYarnId ?? item.yarnId ?? null,
                            greigeYarnName: item.greigeYarnName || item.actualYarnName || "",
                            finishedYarnId: item.finishedYarnId ?? item.yarnId ?? null,
                            finishedYarnName: item.finishedYarnName || item.yarnName || "",
                            issuedQty: yarnReturnDtl.issuedQty || 0,
                            inwardInfo: [{
                                inwardId: item.inwardId,
                                orderItemId: item.orderItemId,
                                lotNo: item.lotNo,
                                issueQty: item.totalKgs
                            }]
                        });
                    }
                    return acc;
                }, []);

                console.log("Edit mode - Setting issuedYarns:", uniqueYarns);
                setIssuedYarns(uniqueYarns);

                const savedRequirements = Array.isArray((yarnReturnDtl as any)?.yarnReturnRequirements)
                    ? (yarnReturnDtl as any).yarnReturnRequirements
                    : [];
                if (savedRequirements.length > 0) {
                    setYarnRequirementDetails(savedRequirements.map((req: any, index: number) => ({
                        id: req.id ?? req.finishedYarnId ?? req.actualYarnId ?? index,
                        yarnName: req.yarnName || "",
                        actualYarnId: req.actualYarnId ?? null,
                        actualYarnName: req.actualYarnName || "",
                        greigeYarnId: req.greigeYarnId ?? null,
                        greigeYarnName: req.greigeYarnName || "",
                        finishedYarnId: req.finishedYarnId ?? null,
                        finishedYarnName: req.finishedYarnName || "",
                        issuedQty: Number(req.issuedQty ?? 0)
                    })));
                } else {
                    // Backward compatibility fallback for old records
                    setYarnRequirementDetails(uniqueYarns.map((yarn: any) => ({
                        id: yarn.id,
                        yarnName: yarn.yarnName,
                        actualYarnId: yarn.actualYarnId,
                        actualYarnName: yarn.actualYarnName,
                        greigeYarnId: yarn.greigeYarnId ?? yarn.actualYarnId ?? null,
                        greigeYarnName: yarn.greigeYarnName ?? yarn.actualYarnName ?? "",
                        finishedYarnId: yarn.finishedYarnId ?? yarn.id ?? null,
                        finishedYarnName: yarn.finishedYarnName ?? yarn.yarnName ?? "",
                        issuedQty: yarn.issuedQty
                    })));
                }
            }
        } else {
            setIsEditMode(false);
            setValue("inwardDate", getCurrentDateForInput());
            setValue("dcDate", getCurrentDateForInput());
        }
    }, [dispatch, yarnReturnDtl, reset, setValue, companyId]);

    // Update available vendors based on inward type
    useEffect(() => {
        if (!inwardType) {
            setAvailableVendors([]);
            if (!isEditMode) {
                setSelectedVendorId(null);
                setValue("orderNo", "");
                setValue("vendorName", "");
            }
            return;
        }

        const resolveVendorName = (vendor: any) =>
            vendor?.customerName ||
            vendor?.vendorName ||
            vendor?.name ||
            vendor?.vendorCompanyName ||
            vendor?.companyName ||
            "";

        const scopedVendors = inwardType === "SIZING_YARN_RETURN"
            ? sizingReturnVendors
            : (inwardType === "WEAVING_YARN_RETURN" || inwardType === "WEFT_YARN_RETURN")
                ? weftReturnVendors
                : inwardType === "PROCESSING_YARN_RETURN"
                    ? processReturnVendors
                    : [];

        const uniqueMap = new Map<number, { id: number; vendorName: string }>();
        (Array.isArray(scopedVendors) ? scopedVendors : []).forEach((vendor: any) => {
            const id = vendor?.id != null ? Number(vendor.id) : Number(vendor?.vendorId);
            if (!Number.isFinite(id) || id <= 0) return;
            const vendorName = resolveVendorName(vendor);
            if (!vendorName) return;
            if (!uniqueMap.has(id)) {
                uniqueMap.set(id, { id, vendorName });
            }
        });

        const mappedVendors = Array.from(uniqueMap.values());
        setAvailableVendors(mappedVendors);

        if (!isEditMode) {
            setSelectedVendorId(null);
            setValue("orderNo", "");
            setValue("vendorName", "");
        }
    }, [inwardType, sizingReturnVendors, weftReturnVendors, processReturnVendors, setValue, isEditMode]);

    // Set vendor when in edit mode and vendors are loaded
    useEffect(() => {
        if (isEditMode && yarnReturnDtl && availableVendors.length > 0 && !selectedVendorId) {
            console.log("Edit mode - Setting vendor:", {
                vendorId: yarnReturnDtl.vendorId,
                vendorName: yarnReturnDtl.vendorName,
                availableVendors
            });

            const vendorMatch = availableVendors.find(v =>
                v.id === yarnReturnDtl.vendorId || v.vendorName === yarnReturnDtl.vendorName
            );

            if (vendorMatch) {
                console.log("Edit mode - Found vendor match:", vendorMatch);
                setSelectedVendorId(vendorMatch.id);
                setValue("vendorName", vendorMatch.vendorName);
            }
        }
    }, [isEditMode, yarnReturnDtl, availableVendors, selectedVendorId, setValue]);

    // Update available orders based on selected vendor
    useEffect(() => {
        if (!selectedVendorId || !inwardType) {
            setAvailableOrders([]);
            return;
        }

        let orders: any[] = [];

        if (inwardType === "SIZING_YARN_RETURN" && sizingPlanList) {
            orders = sizingPlanList
                .filter((plan: any) => plan.vendorId === selectedVendorId)
                .map((plan: any) => {
                    const vendor = vendorList?.find((v: any) => v.id === plan.vendorId);
                    return {
                        id: plan.id,
                        orderNo: plan.sizingPlanNo,
                        vendorName: vendor?.customerName || vendor?.vendorName,
                        vendorId: plan.vendorId,
                        fullData: plan
                    };
                });
        } else if ((inwardType === "WEAVING_YARN_RETURN" || inwardType === "WEFT_YARN_RETURN") && weavingContractList) {
            orders = weavingContractList
                .filter((contract: any) => contract.vendorId === selectedVendorId)
                .map((contract: any) => {
                    const vendor = vendorList?.find((v: any) => v.id === contract.vendorId);
                    return {
                        id: contract.id,
                        orderNo: contract.weavingContractNo,
                        vendorName: vendor?.customerName || vendor?.vendorName,
                        vendorId: contract.vendorId,
                        fullData: contract
                    };
                });
        } else if (inwardType === "PROCESSING_YARN_RETURN" && normalizedProcessContracts) {
            orders = (normalizedProcessContracts || [])
                .filter((contract: any) =>
                    Number(contract?.vendorId) === Number(selectedVendorId) &&
                    (String(contract?.processType || "").toUpperCase() === "YARN" || Number(contract?.processTypeId) === 1)
                )
                .map((contract: any) => {
                    const vendorName =
                        contract?.vendorName ||
                        contract?.vendor?.customerName ||
                        contract?.vendor?.vendorName ||
                        contract?.vendor?.name ||
                        availableVendors.find((v) => v.id === selectedVendorId)?.vendorName ||
                        "";
                    const orderNo = contract?.dyeingWorkOrderNo || contract?.processContractNo || contract?.processContractNo || `Process ${contract?.id ?? ""}`;
                    return {
                        id: contract?.id,
                        orderNo,
                        vendorName,
                        vendorId: contract?.vendorId,
                        fullData: contract
                    };
                });
        }

        setAvailableOrders(orders);

        // Only reset order if not in edit mode
        if (!isEditMode) {
            setValue("orderNo", "");
        }
    }, [selectedVendorId, inwardType, sizingPlanList, weavingContractList, vendorList, normalizedProcessContracts, availableVendors, setValue, isEditMode]);

    // Set order when in edit mode and orders are loaded
    useEffect(() => {
        if (isEditMode && yarnReturnDtl && availableOrders.length > 0 && !selectedOrderData) {
            console.log("Edit mode - Setting order:", {
                orderNo: yarnReturnDtl.orderNo,
                availableOrders
            });

            const orderMatch = availableOrders.find(o => o.orderNo === yarnReturnDtl.orderNo);
            if (orderMatch) {
                console.log("Edit mode - Found order match:", orderMatch);
                setSelectedOrderData(orderMatch);
                setValue("orderNo", orderMatch.orderNo);

                // In edit mode, we don't need to fetch issued yarns again since we already have them
                // from the initial data loading
            }
        }
    }, [isEditMode, yarnReturnDtl, availableOrders, selectedOrderData, setValue]);

    // Derive default millId from related issue records
    const deriveMillIdFromIssues = (orderId: number, orderType: string): number | null => {
        try {
            let millIds: Array<string | number> = [];
            if (orderType === "SIZING_YARN_RETURN") {
                (Array.isArray(sizingYarnIssuetList) ? sizingYarnIssuetList : []).
                    filter((rec: any) => Number(rec.sizingPlanId) === Number(orderId)).
                    forEach((rec: any) => {
                        const level1 = Array.isArray(rec.sizingYarnIssue) ? rec.sizingYarnIssue : [];
                        level1.forEach((it: any) => { if (it?.millId != null) millIds.push(it.millId); });
                        const reqs = Array.isArray(rec.requirements) ? rec.requirements : [];
                        reqs.forEach((req: any) => {
                            const inner = Array.isArray(req.yarnIssues) ? req.yarnIssues : (Array.isArray(req.sizingYarnIssue) ? req.sizingYarnIssue : []);
                            inner.forEach((it: any) => { if (it?.millId != null) millIds.push(it.millId); });
                        });
                    });
            } else if (orderType === "WEAVING_YARN_RETURN" || orderType === "WEFT_YARN_RETURN") {
                (Array.isArray(weavingYarnIssuetList) ? weavingYarnIssuetList : []).
                    filter((rec: any) => Number(rec.weavingContractId) === Number(orderId)).
                    forEach((rec: any) => {
                        const reqs = Array.isArray(rec.requirements) ? rec.requirements : [];
                        reqs.forEach((req: any) => {
                            const inner = Array.isArray(req.yarnIssues) ? req.yarnIssues : (Array.isArray(req.weavingYarnIssue) ? req.weavingYarnIssue : []);
                            inner.forEach((it: any) => { if (it?.millId != null) millIds.push(it.millId); });
                        });
                        const flat = Array.isArray(rec.yarnIssues) ? rec.yarnIssues : [];
                        flat.forEach((it: any) => { if (it?.millId != null) millIds.push(it.millId); });
                    });
            } else if (orderType === "PROCESSING_YARN_RETURN") {
                (Array.isArray(yarnDispatchDyingList) ? yarnDispatchDyingList : []).
                    filter((rec: any) => Number(rec.dyeingWorkOrderId) === Number(orderId)).
                    forEach((rec: any) => {
                        const flat = Array.isArray(rec.yarnIssues) ? rec.yarnIssues : [];
                        flat.forEach((it: any) => { if (it?.millId != null) millIds.push(it.millId); });
                    });
            }
            if (millIds.length === 0) return null;
            const freq: Record<string, number> = {};
            millIds.forEach((id) => { const k = String(id); freq[k] = (freq[k] || 0) + 1; });
            const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
            return best != null ? Number(best) : null;
        } catch {
            return null;
        }
    };

    // Auto-select Mill based on selected order and inward type
    useEffect(() => {
        if (!selectedOrderData || !inwardType) return;
        if (isEditMode && (yarnReturnDtl?.millId || watch("millId"))) return;
        const mid = deriveMillIdFromIssues(Number(selectedOrderData.id), String(inwardType));
        if (mid) setValue("millId", mid); else setValue("millId", null);
    }, [selectedOrderData, inwardType, sizingYarnIssuetList, weavingYarnIssuetList, yarnDispatchDyingList, isEditMode, yarnReturnDtl, setValue]);

    // Update summary when yarn items change
    useEffect(() => {
        const summary: { [key: string]: SummaryItem & { _actualYarnSet?: Set<string> } } = {};

        yarnInwardItems.forEach(item => {
            const summaryKey = isProcessingInwardType
                ? `${item.yarnName || ''}__${item.actualYarnName || ''}`
                : (item.yarnName || '');
            const actualLabel = (item.actualYarnName || "").trim();
            if (summary[summaryKey]) {
                summary[summaryKey].totalBags += item.noOfBags;
                summary[summaryKey].totalKgs += item.totalKgs;
                if (actualLabel) {
                    summary[summaryKey]._actualYarnSet?.add(actualLabel);
                }
            } else {
                summary[summaryKey] = {
                    yarnName: item.yarnName,
                    actualYarnName: item.actualYarnName,
                    _actualYarnSet: new Set(actualLabel ? [actualLabel] : []),
                    totalBags: item.noOfBags,
                    totalKgs: item.totalKgs
                };
            }
        });

        setSummaryItems(
            Object.values(summary).map((item) => {
                const names = Array.from(item._actualYarnSet || []);
                return {
                    yarnName: item.yarnName,
                    actualYarnName: names.length ? names.join(", ") : (item.actualYarnName || ""),
                    actualYarnNames: names,
                    totalBags: item.totalBags,
                    totalKgs: item.totalKgs
                };
            })
        );
    }, [yarnInwardItems, isProcessingInwardType]);

    // Fetch issued yarns function (for new entries)
    const fetchIssuedYarns = (orderId: number, orderType: string) => {
    console.log("Fetching issued yarns for:", { orderId, orderType });

    const normalizedOrderId = Number(orderId);
    if (!orderType || Number.isNaN(normalizedOrderId)) {
        setIssuedYarns([]);
        setYarnRequirementDetails([]);
        setIssuedQty(0);
        return;
    }

    const yarnAggregates: { [key: string]: any } = {};

    const addIssuedEntry = (
        entry: any,
        qtyOverride?: number,
        options: { skipQuantity?: boolean } = {}
    ) => {
        if (!entry) return;

        const yarnId =
            entry.finishedYarnId ??
            entry.yarnId ??
            entry.finishedYarnCodeId ??
            entry.greigeYarnCodeId ??
            entry.yarnMasterId ??
            entry.id;

        const actualYarnId =
            entry.actualYarnId ??
            entry.greigeYarnId ??
            entry.greigeYarnCodeId ??
            entry.yarnId ??
            yarnId ??
            null;

        const yarnName =
            getYarnNameById(yarnId) ||
            entry.yarnName ||
            entry.finishedYarnName ||
            entry.greigeYarnName ||
            entry.fabricCode ||
            entry.fabricName ||
            '';

        const actualYarnName =
            getYarnNameById(actualYarnId) ||
            entry.actualYarnName ||
            entry.actualYarn ||
            entry.greigeYarnName ||
            yarnName ||
            '';

        const finishedYarnId = entry.finishedYarnId ?? entry.finishedYarnCodeId ?? yarnId ?? null;
        const greigeYarnId = entry.greigeYarnId ?? entry.greigeYarnCodeId ?? actualYarnId ?? null;
        const finishedYarnName =
            entry.finishedYarnName ||
            getYarnNameById(finishedYarnId) ||
            yarnName ||
            '';
        const greigeYarnName =
            entry.greigeYarnName ||
            getYarnNameById(greigeYarnId) ||
            actualYarnName ||
            '';

        // Skip if no valid yarn name or ID
        if ((!yarnName || yarnName.trim() === '') && !yarnId) return;

        const quantitySource = qtyOverride ?? entry.issuedQuantity ?? entry.issueQty ?? entry.totalIssuedQty ?? entry.totalIssueQty ?? entry.quantity ?? entry.noOfBags ?? 0;
        const numericQty = Number(quantitySource);
        const effectiveQty = Number.isFinite(numericQty) ? numericQty : 0;

        const inwardId = entry.inwardId ?? entry.jobInwardId ?? null;
        const orderItemId = entry.orderItemId ?? entry.jobInwardItemId ?? null;
        const lotNo = entry.lotNo || entry.lotId || entry.lotNumber || '';
        const keyParts = [
            yarnId != null ? `y:${yarnId}` : '',
            actualYarnId != null ? `a:${actualYarnId}` : '',
            inwardId != null ? `i:${inwardId}` : '',
            orderItemId != null ? `o:${orderItemId}` : '',
            lotNo ? `l:${String(lotNo).trim().toLowerCase()}` : ''
        ].filter(Boolean);
        const key = keyParts.length ? keyParts.join('|') : yarnName;
        if (!yarnAggregates[key]) {
            yarnAggregates[key] = {
                id: yarnId,
                yarnName,
                actualYarnId,
                actualYarnName,
                yarnCount: entry.yarnCount || getYarnCount(yarnId),
                quality: entry.quality || entry.yarnQuality || getYarnQuality(yarnId),
                issuedQty: 0,
                inwardInfo: [],
                inwardId: inwardId != null ? Number(inwardId) : undefined,
                orderItemId: orderItemId != null ? Number(orderItemId) : undefined,
                lotNo: lotNo ? String(lotNo) : '',
                finishedYarnId: finishedYarnId != null ? Number(finishedYarnId) : null,
                finishedYarnName,
                greigeYarnId: greigeYarnId != null ? Number(greigeYarnId) : null,
                greigeYarnName
            };
        }

        if (!options.skipQuantity && effectiveQty > 0) {
            yarnAggregates[key].issuedQty += effectiveQty;
        }

        if (inwardId && orderItemId) {
            const exists = yarnAggregates[key].inwardInfo.some(
                (info: any) =>
                    info.inwardId === inwardId &&
                    info.orderItemId === orderItemId &&
                    info.lotNo === lotNo
            );
            if (!exists) {
                yarnAggregates[key].inwardInfo.push({
                    inwardId,
                    orderItemId,
                    lotNo,
                    issueQty: effectiveQty
                });
            }
        }
    };

        const processSizingRequirement = (req: any) => {
        if (!req) return;
        let issueQtyToAdd = parseFloat(req.totalIssuedQty ?? req.totalIssueQty ?? 0) || 0;

        if (issueQtyToAdd <= 0 && Array.isArray(req.sizingYarnIssue)) {
            issueQtyToAdd = req.sizingYarnIssue.reduce(
                (sum: number, yarnIssue: any) => sum + (parseFloat(yarnIssue?.issueQty ?? 0) || 0),
                0
            );
        }

        if (issueQtyToAdd > 0) {
            addIssuedEntry(req, issueQtyToAdd);
        }

        if (Array.isArray(req.sizingYarnIssue)) {
            req.sizingYarnIssue.forEach((item: any) => addIssuedEntry(item, undefined, { skipQuantity: true }));
        }
        if (Array.isArray(req.yarnIssues)) {
            req.yarnIssues.forEach((item: any) => addIssuedEntry(item, undefined, { skipQuantity: true }));
        }
    };

        // const processWeavingRequirement = (req: any) => {
        //     if (!req) return;
        //     let issueQtyToAdd = parseFloat(req.totalIssueQty ?? req.totalIssuedQty ?? 0) || 0;

        //     if (issueQtyToAdd <= 0 && Array.isArray(req.yarnIssues)) {
        //         issueQtyToAdd = req.yarnIssues.reduce(
        //             (sum: number, yarnIssue: any) => sum + (parseFloat(yarnIssue?.issueQty ?? 0) || 0),
        //             0
        //         );
        //     }

        //     if (issueQtyToAdd > 0) {
        //         addIssuedEntry(req, issueQtyToAdd);
        //     }

        //     if (Array.isArray(req.yarnIssues)) {
        //         req.yarnIssues.forEach((item: any) => addIssuedEntry(item, undefined, { skipQuantity: true }));
        //     }
        // };
const processWeavingRequirement = (req: any) => {
        if (!req) return;
        let issueQtyToAdd = parseFloat(req.totalIssueQty ?? req.totalIssuedQty ?? 0) || 0;

        if (issueQtyToAdd <= 0 && Array.isArray(req.yarnIssues)) {
            issueQtyToAdd = req.yarnIssues.reduce(
                (sum: number, yarnIssue: any) => sum + (parseFloat(yarnIssue?.issueQty ?? 0) || 0),
                0
            );
        }

        if (issueQtyToAdd > 0) {
            addIssuedEntry(req, issueQtyToAdd);
        }

        if (Array.isArray(req.yarnIssues)) {
            req.yarnIssues.forEach((item: any) => addIssuedEntry(item, undefined, { skipQuantity: true }));
        }
    };
       
     const addNestedIssueInfo = (entry: any) => addIssuedEntry(entry, undefined, { skipQuantity: true });

    const filterList = (list: any, predicate: (item: any) => boolean) =>
        (Array.isArray(list) ? list : []).filter(predicate);

    if (orderType === "SIZING_YARN_RETURN") {
        filterList(
            sizingYarnIssuetList,
            (issue: any) => Number(issue?.sizingPlanId) === normalizedOrderId
        ).forEach((issue: any) => {
            addNestedIssueInfo(issue);
            if (Array.isArray(issue?.sizingYarnIssue)) {
                issue.sizingYarnIssue.forEach(addNestedIssueInfo);
            }
            if (Array.isArray(issue?.items)) {
                issue.items.forEach(addNestedIssueInfo);
            }
            if (Array.isArray(issue?.requirements)) {
                issue.requirements.forEach(processSizingRequirement);
            }
        });
    } else if (orderType === "WEAVING_YARN_RETURN" || orderType === "WEFT_YARN_RETURN") {
        filterList(
            weavingYarnIssuetList,
            (issue: any) => Number(issue?.weavingContractId) === normalizedOrderId
        ).forEach((issue: any) => {
            addNestedIssueInfo(issue);
            if (Array.isArray(issue?.yarnIssues)) {
                issue.yarnIssues.forEach(addNestedIssueInfo);
            }
            if (Array.isArray(issue?.requirements)) {
                issue.requirements.forEach(processWeavingRequirement);
            }
        });
    } else if (orderType === "PROCESSING_YARN_RETURN") {
        const processList = Array.isArray(yarnDispatchDyingList?.list)
            ? yarnDispatchDyingList.list
            : yarnDispatchDyingList;

        filterList(
            processList,
            (dispatch: any) =>
                Number(dispatch?.dyeingWorkOrderId ?? dispatch?.processContractId) === normalizedOrderId
        ).forEach((dispatch: any) => {
            addIssuedEntry(dispatch, dispatch?.issuedQuantity ?? dispatch?.dispatchedQuantity);
            if (Array.isArray(dispatch?.yarnIssues)) {
                dispatch.yarnIssues.forEach((yarnIssue: any) => addIssuedEntry(yarnIssue));
            }
        });

        const fabricDispatchList = Array.isArray(fabricDispatchDyingList)
            ? fabricDispatchDyingList
            : Array.isArray(fabricDispatchDyingList?.data)
                ? fabricDispatchDyingList.data
                : [];

        fabricDispatchList
            .filter((dispatch: any) => Number(dispatch?.dyeingWorkOrderId) === normalizedOrderId)
            .forEach((dispatch: any) => {
                const yarnItems = Array.isArray(dispatch?.yarnIssues) ? dispatch.yarnIssues : [];
                yarnItems.forEach((yarnIssue: any) => addIssuedEntry(yarnIssue));
            });
    }
    // const addNestedIssueInfo = (entry: any) => addIssuedEntry(entry, undefined, { skipQuantity: true });

    //     const filterList = (list: any, predicate: (item: any) => boolean) =>
    //         (Array.isArray(list) ? list : []).filter(predicate);

    //     if (orderType === "SIZING_YARN_RETURN") {
    //         filterList(
    //             sizingYarnIssuetList,
    //             (issue: any) => Number(issue?.sizingPlanId) === normalizedOrderId
    //         ).forEach((issue: any) => {
    //             addNestedIssueInfo(issue);
    //             if (Array.isArray(issue?.sizingYarnIssue)) {
    //                 issue.sizingYarnIssue.forEach(addNestedIssueInfo);
    //             }
    //             if (Array.isArray(issue?.items)) {
    //                 issue.items.forEach(addNestedIssueInfo);
    //             }
    //             if (Array.isArray(issue?.requirements)) {
    //                 issue.requirements.forEach(processSizingRequirement);
    //             }
    //         });
    //     } else if (orderType === "WEAVING_YARN_RETURN") {
    //         filterList(
    //             weavingYarnIssuetList,
    //             (issue: any) => Number(issue?.weavingContractId) === normalizedOrderId
    //         ).forEach((issue: any) => {
    //             addNestedIssueInfo(issue);
    //             if (Array.isArray(issue?.yarnIssues)) {
    //                 issue.yarnIssues.forEach(addNestedIssueInfo);
    //             }
    //             if (Array.isArray(issue?.requirements)) {
    //                 issue.requirements.forEach(processWeavingRequirement);
    //             }
    //         });
    //     } else if (orderType === "PROCESSING_YARN_RETURN") {
    //         const processList = Array.isArray(yarnDispatchDyingList?.list)
    //             ? yarnDispatchDyingList.list
    //             : yarnDispatchDyingList;

    //         filterList(
    //             processList,
    //             (dispatch: any) =>
    //                 Number(dispatch?.dyeingWorkOrderId ?? dispatch?.processContractId) === normalizedOrderId
    //         ).forEach((dispatch: any) => {
    //             addIssuedEntry(dispatch, dispatch?.issuedQuantity ?? dispatch?.dispatchedQuantity);
    //             if (Array.isArray(dispatch?.yarnIssues)) {
    //                 dispatch.yarnIssues.forEach((yarnIssue: any) => addIssuedEntry(yarnIssue));
    //             }
    //         });

    //         const fabricDispatchList = Array.isArray(fabricDispatchDyingList)
    //             ? fabricDispatchDyingList
    //             : Array.isArray(fabricDispatchDyingList?.data)
    //                 ? fabricDispatchDyingList.data
    //                 : [];

    //         fabricDispatchList
    //             .filter((dispatch: any) => Number(dispatch?.dyeingWorkOrderId) === normalizedOrderId)
    //             .forEach((dispatch: any) => {
    //                 const yarnItems = Array.isArray(dispatch?.yarnIssues) ? dispatch.yarnIssues : [];
    //                 yarnItems.forEach((yarnIssue: any) => addIssuedEntry(yarnIssue));
    //             });
    //     }

        // const yarnsIssued = Object.values(yarnAggregates);
        // const yarnsIssued = Object.values(yarnAggregates).filter(yarn =>
        //     yarn.id && yarn.id !== null && yarn.id !== undefined &&
        //     yarn.yarnName && yarn.yarnName.trim() !== ''
        // );
        // const requirementDetails: YarnRequirementDetail[] = yarnsIssued.map((yarn: any) => ({
        //     id: yarn.id,
        //     yarnName: yarn.yarnName,
        //     yarnCount: yarn.yarnCount,
        //     quality: yarn.quality,
        //     issuedQty: yarn.issuedQty
        // }));
        // Also filter requirementDetails similarly:

         const yarnsIssued = Object.values(yarnAggregates).filter((yarn: any) => {
        // Only include yarns that have both an ID and a name, and have issued quantity > 0
        // Or at least have a valid name
        const hasValidId = yarn.id && yarn.id !== null && yarn.id !== undefined;
        const hasValidName = yarn.yarnName && yarn.yarnName.trim() !== '';
        const hasQuantity = yarn.issuedQty > 0;
        
        // For add mode, only show yarns with positive issued quantity
        return hasQuantity && (hasValidId || hasValidName);
    });

    const requirementDetails: YarnRequirementDetail[] = yarnsIssued.map((yarn: any) => ({
        id: yarn.id,
        yarnName: yarn.yarnName,
        actualYarnId: yarn.actualYarnId,
        actualYarnName: yarn.actualYarnName,
        greigeYarnId: yarn.greigeYarnId ?? yarn.actualYarnId ?? null,
        greigeYarnName: yarn.greigeYarnName ?? yarn.actualYarnName ?? "",
        finishedYarnId: yarn.finishedYarnId ?? yarn.id ?? null,
        finishedYarnName: yarn.finishedYarnName ?? yarn.yarnName ?? "",
        issuedQty: yarn.issuedQty
    })).filter(req => req.yarnName && req.yarnName.trim() !== '');

        // const requirementDetails: YarnRequirementDetail[] = yarnsIssued.map((yarn: any) => ({
        //     id: yarn.id,
        //     yarnName: yarn.yarnName,
        //     yarnCount: yarn.yarnCount,
        //     quality: yarn.quality,
        //     issuedQty: yarn.issuedQty
        // })).filter(req => req.yarnName && req.yarnName.trim() !== '');
   const totalIssued = yarnsIssued.reduce((sum: number, yarn: any) => sum + (yarn.issuedQty || 0), 0);

    console.log('[fetchIssuedYarns] Fetched yarns (filtered):', yarnsIssued);
    console.log('[fetchIssuedYarns] Requirement details (filtered):', requirementDetails);

    setIssuedYarns(yarnsIssued);
    setYarnRequirementDetails(requirementDetails);
    setIssuedQty(totalIssued);
};
    //     const totalIssued = yarnsIssued.reduce((sum: number, yarn: any) => sum + (yarn.issuedQty || 0), 0);

    //     console.log('[fetchIssuedYarns] Fetched yarns:', yarnsIssued);
    //     console.log('[fetchIssuedYarns] Requirement details:', requirementDetails);

    //     setIssuedYarns(yarnsIssued);
    //     setYarnRequirementDetails(requirementDetails);
    //     setIssuedQty(totalIssued);
    // };

    // Event handlers
    const handleInwardTypeChange = (value: string) => {
        setValue("inwardType", value);
        if (!isEditMode) {
            setSelectedVendorId(null);
            setValue("orderNo", "");
            setValue("vendorName", "");
            setIssuedYarns([]);
            setYarnRequirementDetails([]);
            setIssuedQty(0);
            setYarnInwardItems([]);
        }
    };

    const handleVendorChange = (value: string) => {
        const vendorId = parseInt(value);
        if (vendorId) {
            const selectedVendor = availableVendors.find(v => v.id === vendorId);
            if (selectedVendor) {
                setSelectedVendorId(vendorId);
                setValue("vendorName", selectedVendor.vendorName || "");
            }
        } else {
            setSelectedVendorId(null);
            setValue("vendorName", "");
            setValue("orderNo", "");
            if (!isEditMode) {
                setIssuedYarns([]);
                setYarnRequirementDetails([]);
                setIssuedQty(0);
                setYarnInwardItems([]);
            }
        }
    };

    const handleOrderNoChange = (value: string) => {
        const selectedId = parseInt(value);

        if (selectedId) {
            const selectedOrder = availableOrders.find(order => order.id === selectedId);
            if (selectedOrder) {
                setValue("orderNo", selectedOrder.orderNo);
                setValue("vendorName", selectedOrder.vendorName || "");
                setSelectedOrderData(selectedOrder);
                fetchIssuedYarns(selectedId, inwardType);
                if (!isEditMode) {
                    setYarnInwardItems([]);
                }
            }
        } else {
            setValue("orderNo", "");
            setValue("vendorName", "");
            setSelectedOrderData(null);
            if (!isEditMode) {
                setIssuedYarns([]);
                setYarnRequirementDetails([]);
                setIssuedQty(0);
                setYarnInwardItems([]);
            }
        }
    };

    const getAvailableIssuedYarnsForRow = (rowIndex: number) => {
        const selectedKeys = new Set(
            yarnInwardItems
                .filter((_, index) => index !== rowIndex)
                .map((item) =>
                    getIssuedSelectionKey({
                        actualYarnId: item.actualYarnId,
                        inwardId: item.inwardId,
                        orderItemId: item.orderItemId
                    })
                )
        );
        return issuedYarns.filter((issued: any) => {
            const issuedInward = issued?.inwardInfo?.[0];
            const issuedKey = getIssuedSelectionKey({
                actualYarnId: issued?.actualYarnId ?? issued?.id,
                inwardId: issuedInward?.inwardId ?? issued?.inwardId,
                orderItemId: issuedInward?.orderItemId ?? issued?.orderItemId
            });
            return !selectedKeys.has(issuedKey);
        });
    };

    const addYarnInwardItem = () => {
        if (issuedYarns.length === 0) {
            alert("Please select an order number first to get issued yarns");
            return;
        }

        const selectedKeys = new Set(
            yarnInwardItems.map((item) =>
                getIssuedSelectionKey({
                    actualYarnId: item.actualYarnId,
                    inwardId: item.inwardId,
                    orderItemId: item.orderItemId
                })
            )
        );
        const firstYarn = issuedYarns.find((issued: any) => {
            const inward = issued?.inwardInfo?.[0];
            const key = getIssuedSelectionKey({
                actualYarnId: issued?.actualYarnId ?? issued?.id,
                inwardId: inward?.inwardId ?? issued?.inwardId,
                orderItemId: inward?.orderItemId ?? issued?.orderItemId
            });
            return !selectedKeys.has(key);
        });

        if (!firstYarn) {
            alert("All issued yarns are already added.");
            return;
        }

        const firstInwardInfo = firstYarn.inwardInfo && firstYarn.inwardInfo.length > 0 ? firstYarn.inwardInfo[0] : null;
        setYarnInwardItems(prev => [
            ...prev,
            {
                yarnId: firstYarn.id,
                yarnName: firstYarn.yarnName,
                actualYarnId: firstYarn.actualYarnId ?? firstYarn.id,
                actualYarnName: firstYarn.actualYarnName || getYarnNameById(firstYarn.actualYarnId ?? firstYarn.id),
                greigeYarnId: firstYarn.greigeYarnId ?? firstYarn.actualYarnId ?? firstYarn.id,
                greigeYarnName: firstYarn.greigeYarnName || firstYarn.actualYarnName || getYarnNameById(firstYarn.greigeYarnId ?? firstYarn.actualYarnId ?? firstYarn.id),
                finishedYarnId: firstYarn.finishedYarnId ?? firstYarn.id,
                finishedYarnName: firstYarn.finishedYarnName || firstYarn.yarnName || getYarnNameById(firstYarn.finishedYarnId ?? firstYarn.id),
                noOfBags: 0,
                totalKgs: 0,
                conesPerBag: 0,
                conesWeight: 0,
                lotNo: firstInwardInfo ? firstInwardInfo.lotNo || "" : "",
                inwardId: firstInwardInfo ? firstInwardInfo.inwardId : undefined,
                orderItemId: firstInwardInfo ? firstInwardInfo.orderItemId : undefined
            }
        ]);
    };

    const removeYarnInwardItem = (index: number) => {
        setYarnInwardItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateYarnInwardItem = (index: number, field: keyof YarnInwardItem, value: any) => {
        setYarnInwardItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const updated: YarnInwardItem = { ...item, [field]: value };
            if (['conesPerBag', 'noOfBags', 'totalKgs'].includes(field as string)) {
                updated.conesWeight = calculateConesWeight(updated);
            }
            return updated;
        }));
    };

    const handleActualYarnChange = (index: number, value: string) => {
        if (!value) {
            updateYarnInwardItem(index, 'actualYarnId', null);
            updateYarnInwardItem(index, 'actualYarnName', '');
            updateYarnInwardItem(index, 'yarnId', null);
            updateYarnInwardItem(index, 'yarnName', '');
            updateYarnInwardItem(index, 'greigeYarnId', null);
            updateYarnInwardItem(index, 'greigeYarnName', '');
            updateYarnInwardItem(index, 'finishedYarnId', null);
            updateYarnInwardItem(index, 'finishedYarnName', '');
            updateYarnInwardItem(index, 'lotNo', '');
            updateYarnInwardItem(index, 'inwardId', undefined);
            updateYarnInwardItem(index, 'orderItemId', undefined);
            return;
        }

        const availableForRow = getAvailableIssuedYarnsForRow(index);
        const selectedIssued = availableForRow.find((issued: any) => {
            const inwardInfo = issued?.inwardInfo?.[0];
            const issuedKey = getIssuedSelectionKey({
                actualYarnId: issued?.actualYarnId ?? issued?.id,
                inwardId: inwardInfo?.inwardId ?? issued?.inwardId,
                orderItemId: inwardInfo?.orderItemId ?? issued?.orderItemId
            });
            return issuedKey === value;
        });
        if (!selectedIssued) return;

        const inwardInfo = selectedIssued.inwardInfo && selectedIssued.inwardInfo.length > 0 ? selectedIssued.inwardInfo[0] : null;
        updateYarnInwardItem(index, 'actualYarnId', Number(selectedIssued.actualYarnId ?? selectedIssued.id));
        updateYarnInwardItem(index, 'actualYarnName', selectedIssued.actualYarnName || getYarnNameById(selectedIssued.actualYarnId ?? selectedIssued.id));
        updateYarnInwardItem(index, 'yarnId', selectedIssued.id != null ? Number(selectedIssued.id) : null);
        updateYarnInwardItem(index, 'yarnName', selectedIssued.yarnName || getYarnNameById(selectedIssued.id));
        updateYarnInwardItem(index, 'greigeYarnId', selectedIssued.greigeYarnId ?? selectedIssued.actualYarnId ?? selectedIssued.id);
        updateYarnInwardItem(index, 'greigeYarnName', selectedIssued.greigeYarnName || selectedIssued.actualYarnName || getYarnNameById(selectedIssued.greigeYarnId ?? selectedIssued.actualYarnId ?? selectedIssued.id));
        updateYarnInwardItem(index, 'finishedYarnId', selectedIssued.finishedYarnId ?? selectedIssued.id);
        updateYarnInwardItem(index, 'finishedYarnName', selectedIssued.finishedYarnName || selectedIssued.yarnName || getYarnNameById(selectedIssued.finishedYarnId ?? selectedIssued.id));
        updateYarnInwardItem(index, 'lotNo', inwardInfo ? inwardInfo.lotNo || '' : (selectedIssued.lotNo || ''));
        updateYarnInwardItem(index, 'inwardId', inwardInfo ? inwardInfo.inwardId : selectedIssued.inwardId);
        updateYarnInwardItem(index, 'orderItemId', inwardInfo ? inwardInfo.orderItemId : selectedIssued.orderItemId);
    };

    useEffect(() => {
        if (!yarnInwardItems.length || !issuedYarns.length) return;
        setYarnInwardItems((prev) =>
            prev.map((item) => {
                if (item.lotNo && String(item.lotNo).trim()) {
                    return item;
                }
                const selectedIssued = issuedYarns.find(
                    (issued: any) =>
                        Number(issued.actualYarnId ?? issued.id) === Number(item.actualYarnId) &&
                        (item.yarnId == null || Number(issued.id) === Number(item.yarnId))
                );
                if (!selectedIssued) return item;
                const inwardInfo = selectedIssued?.inwardInfo?.[0];
                const fallbackLotNo = inwardInfo?.lotNo || selectedIssued?.lotNo || '';
                if (!fallbackLotNo) return item;
                return {
                    ...item,
                    lotNo: String(fallbackLotNo),
                    inwardId: item.inwardId ?? inwardInfo?.inwardId ?? selectedIssued?.inwardId,
                    orderItemId: item.orderItemId ?? inwardInfo?.orderItemId ?? selectedIssued?.orderItemId
                };
            })
        );
    }, [yarnInwardItems.length, issuedYarns]);

    const validateTotalKgs = (kgs: number, currentIndex: number): boolean => {
        const totalReturnedKgs = yarnInwardItems.reduce((total, item, index) => {
            // Use the new kgs value if this is the row being edited
            const itemKgs = index === currentIndex ? kgs : item.totalKgs;
            return total + itemKgs;
        }, 0);
        return totalReturnedKgs <= issuedQty;
    };

    const onSubmit = async (data: YarnReturnDetailsFormData) => {
        if (yarnInwardItems.length === 0) {
            toast.error("Atleast add one inward item");
            return;
        }

        const totalReturnedKgs = yarnInwardItems.reduce((total, item) => total + item.totalKgs, 0);
        if (totalReturnedKgs > issuedQty) {
            alert(`Total returned quantity (${totalReturnedKgs} kgs) cannot exceed issued quantity (${issuedQty} kgs)`);
            return;
        }

        // if (yarnInwardItems.length === 0) {
        //     alert("Please add at least one yarn item");
        //     return;
        // }

        const formatDateToDDMMYYYY = (dateString: string) => {
            if (!dateString) return '';
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        };

        const selectedVendor = availableVendors.find(v => v.id === selectedVendorId);

        // if (!selectedVendor) {
        //     alert("Please select a valid vendor");
        //     return;
        // }

        // Normalize yarn items: ensure yarnId is numeric if possible (try resolving by yarnName)
        // const normalizedItems = yarnInwardItems.map(item => {
        //     let resolvedYarnId = item.yarnId;
        //     if ((!resolvedYarnId || resolvedYarnId === null) && item.yarnName) {
        //         const found = (yarnList || []).find((y: any) => (y.id === item.yarnId) || (y.yarnName && y.yarnName === item.yarnName));
        //         if (found) resolvedYarnId = found.id;
        //     }
        //     return {
        //         ...item,
        //         yarnId: resolvedYarnId != null ? Number(resolvedYarnId) : null
        //     };
        // });
        const normalizedItems = yarnInwardItems.map(item => {
            const masterYarn = (yarnList || []).find((y: any) =>
                (item.yarnName && y.yarnName === item.yarnName) || Number(y.id) === Number(item.yarnId)
            );

            const masterActualYarn = (yarnList || []).find((y: any) =>
                (item.actualYarnName && y.yarnName === item.actualYarnName) || Number(y.id) === Number(item.actualYarnId)
            );

            return {
                ...item,
                yarnId: masterYarn ? Number(masterYarn.id) : (item.yarnId != null ? Number(item.yarnId) : null),
                yarnName: getYarnNameById(masterYarn ? Number(masterYarn.id) : item.yarnId) || item.yarnName,
                actualYarnId: masterActualYarn
                    ? Number(masterActualYarn.id)
                    : (item.actualYarnId != null ? Number(item.actualYarnId) : (item.yarnId != null ? Number(item.yarnId) : null)),
                actualYarnName: getYarnNameById(masterActualYarn ? Number(masterActualYarn.id) : (item.actualYarnId ?? item.yarnId)) || item.actualYarnName || '',
                greigeYarnId: isProcessingInwardType
                    ? (item.greigeYarnId != null ? Number(item.greigeYarnId) : (item.actualYarnId != null ? Number(item.actualYarnId) : null))
                    : undefined,
                greigeYarnName: isProcessingInwardType
                    ? (item.greigeYarnName || item.actualYarnName || '')
                    : undefined,
                finishedYarnId: isProcessingInwardType
                    ? (item.finishedYarnId != null ? Number(item.finishedYarnId) : (item.yarnId != null ? Number(item.yarnId) : null))
                    : undefined,
                finishedYarnName: isProcessingInwardType
                    ? (item.finishedYarnName || item.yarnName || '')
                    : undefined
            };
        });

        // Validate all items have a yarnId
        const missingYarn = normalizedItems.find((it: any) => !it.yarnId && it.yarnId !== 0);
        if (missingYarn) {
            alert('Please select a Yarn for all items before submitting.');
            return;
        }

        const duplicateLot = normalizedItems.find((item: any) => {
            const lot = item?.lotNo?.toString()?.trim();
            return lot ? existingLotNumbers.has(lot.toLowerCase()) : false;
        });

        // if (duplicateLot) {
        //     const duplicateLotNo = duplicateLot?.lotNo?.toString()?.trim() || 'this lot';
        //     toast.error(`Lot number ${duplicateLotNo} already exists on another Yarn Return. Please choose a different lot.`);
        //     return;
        // }

        const storedCompanyId = (typeof window !== "undefined" ? (localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany')) : null);
        if (!storedCompanyId) {
            alert("Company not selected. Please select a company.");
            return;
        }
        const companyId = parseInt(storedCompanyId, 10);
        if (Number.isNaN(companyId)) {
            alert("Invalid company selection. Please reselect a company.");
            return;
        }

        const isEditMode = Boolean(yarnReturnDtl?.id);
        let inwardNumber = data.inwardNumber || yarnReturnDtl?.inwardNumber || "";
        if (!yarnReturnDtl?.id && !inwardNumber) {
            try {
                const docResponse = await documentNumberService.generateDocumentNumber({
                    screenName: "Yarn Return Details",
                });
                inwardNumber = docResponse.documentNumber;
            } catch (error) {
                console.warn("Failed to generate document number:", error);
            }
        }

        isSavingRef.current = true;

        const formData = {
            inwardNumber: inwardNumber,
            inwardDate: formatDateToDDMMYYYY(watch("inwardDate")),
            inwardType: watch("inwardType"),
            orderNo: watch("orderNo"),
            vendorId: selectedVendor.id,
            vendorName: watch("vendorName"),
            warehouseId: watch("warehouseId") || null,
            issuedQty: issuedQty,
            remarks: watch("remarks"),
            activeFlag: watch("activeFlag") ?? true,
            dcNumber: watch("dcNumber") || null,
            dcDate: formatDateToDDMMYYYY(watch("dcDate")) || null,
            yarnReturnItems: normalizedItems,
            yarnReturnRequirements: yarnRequirementDetails.map((req) => ({
                id: req.id,
                yarnName: req.yarnName,
                actualYarnId: req.actualYarnId ?? null,
                actualYarnName: req.actualYarnName ?? "",
                greigeYarnId: req.greigeYarnId ?? null,
                greigeYarnName: req.greigeYarnName ?? "",
                finishedYarnId: req.finishedYarnId ?? null,
                finishedYarnName: req.finishedYarnName ?? "",
                issuedQty: Number(req.issuedQty ?? 0)
            })),
            millId: watch("millId") || null,

            companyId
        };

        console.log("Submitting form data:", formData);

        try {
            // alert(JSON.stringify(formData));
            if (isEditMode && yarnReturnDtl) {
                await dispatch(updateYarnReturn({
                    id: yarnReturnDtl.id,
                    ...formData
                })).unwrap();
            } else {
                await dispatch(createYarnReturn(formData)).unwrap();
                documentNumberService.clearMemoryCache("Yarn Return Details");
            }

            navigate("/transaction/yarn-return-details");
        } catch (error) {
            console.error("Error saving yarn return:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 pt-16 flex justify-center items-center h-64">
                <div className="text-lg">Loading data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 pt-16">
            <div className="p-6 bg-white shadow-md rounded-lg">
                <div className="flex justify-between items-center border-b pb-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/transaction/yarn-return-details")}
                            className="mr-auto"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Back
                        </Button>
                        <h2 className="text-2xl font-semibold">
                            {isEditMode ? 'Edit Yarn Return' : 'Add Yarn Return'}
                        </h2>
                    </div>


                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-6 mt-10">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText size={20} /> Yarn Return Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium">Yarn Return No</label>
                                    <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                                        {...register('inwardNumber')} readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Inward Date <span className="text-red-500">*</span></label>
                                    <input
                                        {...register("inwardDate", { required: "Inward Date is required" })}
                                        type="date"
                                        className={`input mt-1 ${errors.inwardDate ? 'border-red-500' : ''}`}
                                    />
                                    {errors.inwardDate && (
                                        <p className="text-red-500 text-xs mt-1">{errors.inwardDate.message as string}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Inward Type <span className="text-red-500">*</span></label>
                                    <CommonSearchableSelect
                                        {...register("inwardType", { required: "Inward Type is required" })}
                                        options={INWARD_TYPE_OPTIONS}
                                        filterActive
                                        placeholder="Select Inward Type"
                                        value={inwardType || ''}
                                        onValueChange={handleInwardTypeChange}
                                        className={`mt-1 ${errors.inwardType ? 'border-red-500' : ''}`}
                                        required
                                    />
                                    {errors.inwardType && (
                                        <p className="text-red-500 text-xs mt-1">{errors.inwardType.message as string}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Vendor Name <span className="text-red-500">*</span></label>
                                    <CommonSearchableSelect
                                        options={vendorSelectOptions}
                                        filterActive
                                        placeholder="Select Vendor"
                                        value={selectedVendorId ? String(selectedVendorId) : ''}
                                        onValueChange={handleVendorChange}
                                        className={`mt-1 ${!inwardType ? 'opacity-50 cursor-not-allowed' : ''} ${errors.vendorId ? 'border-red-500' : ''}`}
                                        disabled={!inwardType}
                                        required
                                    />
                                    {availableVendors.length === 0 && inwardType && (
                                        <p className="text-red-500 text-xs mt-1">No vendors found for the selected inward type</p>
                                    )}
                                    {errors.vendorId && (
                                        <p className="text-red-500 text-xs mt-1">Vendor selection is required</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">
                                        {inwardType === 'SIZING_YARN_RETURN'
                                            ? 'Sizing Plan No'
                                            : inwardType === 'WEAVING_YARN_RETURN'
                                                ? 'Weaving Contract No'
                                                : 'Process Contract No'}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <CommonSearchableSelect
                                        options={orderSelectOptions}
                                        filterActive
                                        placeholder={orderPlaceholder}
                                        value={selectedOrderData?.id ? String(selectedOrderData.id) : ''}
                                        onValueChange={handleOrderNoChange}
                                        className={`mt-1 ${errors.orderNo ? 'border-red-500' : ''} ${!selectedVendorId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={!selectedVendorId}
                                        required
                                    />
                                    {errors.orderNo && (
                                        <p className="text-red-500 text-xs mt-1">{errors.orderNo.message as string}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Warehouse</label>
                                    <CommonSearchableSelect
                                        {...register("warehouseId")}
                                        options={warehouseSelectOptions}
                                        filterActive
                                        placeholder="Select Warehouse"
                                        value={warehouseId ? String(warehouseId) : ''}
                                        className=" mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Mill Name</label>
                                    <CommonSearchableSelect
                                        {...register("millId")}
                                        options={millSelectOptions}
                                        filterActive
                                        placeholder="Select Mill"
                                        value={millId ? String(millId) : ''}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Issued Qty <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        value={issuedQty}
                                        className="input mt-1 bg-gray-100 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">DC Number</label>
                                    <input
                                        {...register("dcNumber")}
                                        type="text"
                                        placeholder="Enter DC Number"
                                        className="input mt-1"
                                    />
                                </div>

                                {/* New DC Date Field */}
                                <div>
                                    <label className="block text-sm font-medium">DC Date</label>
                                    <input
                                        {...register("dcDate")}
                                        type="date"
                                        className="input mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Remarks</label>
                                    <input
                                        placeholder="Remarks"
                                        {...register("remarks")}
                                        className="input mt-1"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {yarnRequirementDetails.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText size={20} /> Yarn Requirement Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full divide-y divide-gray-200 border border-gray-300">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                                        {isProcessingInwardType ? "Finish Yarn" : "Yarn Name"}
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                                                        {isProcessingInwardType ? "Greige Yarn" : "Actual Yarn"}
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Issued Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {yarnRequirementDetails.map((requirement, index) => (
                                                    <tr key={`${requirement.id ?? 'req'}-${index}`} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border">
                                                            {isProcessingInwardType ? (requirement.finishedYarnName || requirement.yarnName || 'N/A') : (requirement.yarnName || 'N/A')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border">
                                                            {isProcessingInwardType ? (requirement.greigeYarnName || requirement.actualYarnName || 'N/A') : (requirement.actualYarnName || 'N/A')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border text-center">{requirement.issuedQty || 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ClipboardList size={20} /> Yarn Inward Table
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={addYarnInwardItem}
                                        className="bg-primary hover:bg-primary text-white"
                                    >
                                        <Plus size={16} className="mr-1" />
                                        Add Yarn
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {yarnInwardItems.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No yarn items added. Click 'Add Yarn' to start.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300 text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border p-2 text-xs">{isProcessingInwardType ? "Finish Yarn" : "Yarn Name"}</th>
                                                    <th className="border p-2 text-xs">{isProcessingInwardType ? "Greige Yarn" : "Actual Yarn"}</th>
                                                    <th className="border p-2 text-xs">No of Bags</th>
                                                    <th className="border p-2 text-xs">Total Kgs</th>
                                                    <th className="border p-2 text-xs">Cones/Bag</th>
                                                    <th className="border p-2 text-xs">Cones Weight</th>
                                                    <th className="border p-2 text-xs">Lot No</th>
                                                    <th className="border p-2 text-xs">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {yarnInwardItems.map((item, index) => (
                                                    <tr key={`${item.id ?? item.orderItemId ?? 'item'}-${index}`} className="border hover:bg-gray-50">
                                                        <td className="border p-2">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    isProcessingInwardType
                                                                        ? (item.finishedYarnName || item.yarnName || getYarnNameById(item.yarnId) || '')
                                                                        : (item.yarnName || getYarnNameById(item.yarnId) || '')
                                                                }
                                                                className="w-full border p-1 text-xs bg-gray-100"
                                                                readOnly
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            {(() => {
                                                                const options = getAvailableIssuedYarnsForRow(index);
                                                                return (
                                                                    <select
                                                                        value={(() => {
                                                                            const selectionKey = getIssuedSelectionKey({
                                                                                actualYarnId: item.actualYarnId,
                                                                                inwardId: item.inwardId,
                                                                                orderItemId: item.orderItemId
                                                                            });
                                                                            return selectionKey === '0-0-0' ? '' : selectionKey;
                                                                        })()}
                                                                        onChange={(e) => handleActualYarnChange(index, e.target.value)}
                                                                        className="w-full border p-1 text-xs"
                                                                    >
                                                                        <option value="">{isProcessingInwardType ? "Select Greige Yarn" : "Select Actual Yarn"}</option>
                                                                        {options.map((issued: any, yi: number) => (
                                                                            <option
                                                                                key={`${issued.id ?? issued.actualYarnId ?? 'actual'}-${yi}-${issued.actualYarnName || issued.yarnName}`}
                                                                                value={getIssuedSelectionKey({
                                                                                    actualYarnId: issued?.actualYarnId ?? issued?.id,
                                                                                    inwardId: issued?.inwardInfo?.[0]?.inwardId ?? issued?.inwardId,
                                                                                    orderItemId: issued?.inwardInfo?.[0]?.orderItemId ?? issued?.orderItemId
                                                                                })}
                                                                            >
                                                                                {isProcessingInwardType
                                                                                    ? (issued.greigeYarnName || issued.actualYarnName || getYarnNameById(issued.greigeYarnId ?? issued.actualYarnId ?? issued.id) || 'N/A')
                                                                                    : (issued.actualYarnName || issued.yarnName || getYarnNameById(issued.actualYarnId ?? issued.id) || 'N/A')}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.noOfBags}
                                                                onChange={(e) => updateYarnInwardItem(index, 'noOfBags', parseInt(e.target.value) || 0)}
                                                                className="w-full border p-1 text-center text-xs"
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                max={issuedQty}
                                                                value={item.totalKgs || ''}
                                                                onChange={(e) => {
                                                                    const kgs = parseFloat(e.target.value) || 0;
                                                                    if (kgs >= 0 && validateTotalKgs(kgs, index)) {
                                                                        updateYarnInwardItem(index, 'totalKgs', kgs);
                                                                    } else if (kgs < 0) {
                                                                        alert("Total Kgs cannot be negative");
                                                                    } else {
                                                                        alert(`Total returned quantity cannot exceed issued quantity (${issuedQty} kgs)`);
                                                                    }
                                                                }}
                                                                className="w-full border p-1 text-center text-xs"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={item.conesPerBag ?? ''}
                                                                onChange={(e) => updateYarnInwardItem(index, 'conesPerBag', parseInt(e.target.value) || 0)}
                                                                className="w-full border p-1 text-center text-xs"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                type="number"
                                                                readOnly
                                                                value={item.conesWeight ?? 0}
                                                                className="w-full border p-1 text-center text-xs bg-gray-100"
                                                            />
                                                        </td>

                                                        <td className="border p-2">
                                                            <input
                                                                type="text"
                                                                value={item.lotNo}
                                                                onChange={(e) => updateYarnInwardItem(index, 'lotNo', e.target.value)}
                                                                className="w-full border p-1 text-xs"
                                                                placeholder="Enter lot number"
                                                            />
                                                        </td>
                                                        <td className="border p-2 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => removeYarnInwardItem(index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {summaryItems.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ClipboardList size={20} /> Summary Table
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300 text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border p-2 text-xs">{isProcessingInwardType ? "Finish Yarn" : "Actual Yarn"}</th>
                                                    {isProcessingInwardType && <th className="border p-2 text-xs">Greige Yarn</th>}
                                                    <th className="border p-2 text-xs">Total Bags</th>
                                                    <th className="border p-2 text-xs">Total Kgs</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {summaryItems.map((item, index) => (
                                                    <tr key={`${item.yarnName ?? 'summary'}-${index}`} className="border hover:bg-gray-50">
                                                        <td className="border p-2 text-xs">{isProcessingInwardType ? item.yarnName : (item.actualYarnName || item.yarnName)}</td>
                                                        {isProcessingInwardType && <td className="border p-2 text-xs">{item.actualYarnName || "N/A"}</td>}
                                                        <td className="border p-2 text-center">{item.totalBags}</td>
                                                        <td className="border p-2 text-center">{item.totalKgs.toFixed(2)} kgs</td>
                                                    </tr>
                                                ))}
                                                <tr className="border bg-blue-50 font-semibold">
                                                    <td className="border p-2 text-xs">Grand Total</td>
                                                    {isProcessingInwardType && <td className="border p-2 text-xs">-</td>}
                                                    <td className="border p-2 text-center">
                                                        {summaryItems.reduce((total, item) => total + item.totalBags, 0)}
                                                    </td>
                                                    <td className="border p-2 text-center">
                                                        {summaryItems.reduce((total, item) => total + item.totalKgs, 0).toFixed(2)} kgs
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <div className="space-x-2 mt-4 flex justify-end">
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary text-white px-6"
                        >
                            {isEditMode ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default YarnReturn;