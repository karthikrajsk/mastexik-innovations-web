

import React, { useEffect, useState, useMemo, useRef, act } from "react";
import { FileText, ClipboardList, Edit, Trash2, Save, Plus, ArrowLeft, FileDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllProductCategory } from "@/state/productCategorySlice";
import { getAllWeavingContract, getWeavingContractById } from "@/state/weavingContractSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { createJobworkFabricReceive, updateJobworkFabricReceive, getJobworkFabricReceiveById } from '@/state/jobFabricReceiveSlice';
import { toast } from 'react-toastify';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { useAuth } from "@/contexts/AuthContext";
import { documentNumberService } from "@/services/DocumentNumberService";
import { generateExcelTemplate, readExcelFile } from '@/lib/utils';
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import CommonSearchableSelect, { CommonSearchableSelectOption } from "@/components/ui/CommonSearchableSelect";
import { useFilteredWarehouseOptions } from "@/hooks/useFilteredWarehouseOptions";

interface SummaryGroup {
    totalPieceMeters: number;
    fabricCode: string;
    fabricDetails: string;
    cost: number;
    totalPieces: number;
    totalNetWeight: number;
    sumOfAvgWeights: number;
}

interface SummaryGroups {
    [key: string]: SummaryGroup;
}
interface WeavingContractFormData {
    weavingContractId: string;
    vendorId: string;
    jobFabricReceiveDate: string;
    dcNumber: string;
    dcDate: string;
    remarks: string;
    receiveNo: string;
    activeFlag?: boolean;
}

interface PieceEntry {
    id?: number;
    pieceNumber: string;
    quantity: number;
    weight: number;
    avgWeight?: number;
    remarks: string;
    cost: number;
    activeFlag?: boolean;
    fabricCode?: string;
    fabricDetails?: string;
    warehouseId?: number | string;
    quality?: string;
    fabricMasterId?: number;
    isInspected?: number;
}


interface FabricReceiveItem {
    id?: number;
    quantityReceived: number;
    price: number;
    activeFlag?: boolean;
    weavingContractItemId: number;
    pieceEntries: PieceEntry[];
    fabricCode?: string;
    fabricDetails?: string;
    quality?: string;
}

interface JobworkFabricReceiveData {
    id?: number;
    receiveNo: string;
    weavingContractId: number;
    weavingContractNo?: string;
    vendorId: number;
    jobFabricReceiveDate: string;
    dcNumber: string;
    dcDate: string;
    remarks: string;
    companyId?: string;
    activeFlag?: boolean;
    jobworkFabricReceiveItemsDtl: FabricReceiveItem[];
    fabricCode?: string;
    fabricDetails?: string;
    quality?: string;
}

const FABRIC_TEMPLATE_HEADERS = [
    'Warehouse Name',
    'Sort No',
    'Piece No',
    'Piece Meter',
    'Net Weight',
    'Pick Rate',
    'Remarks'
];

const EXCEL_ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

const resolveContractCompanyId = (contract: any) => {
    const candidate = contract?.companyId ?? contract?.company_id ?? contract?.company?.id;
    const parsed = Number(candidate);
    return Number.isNaN(parsed) ? undefined : parsed;
};

const JobworkFabricReceive = () => {
    const dispatch = useDispatch<AppDispatch>();
    const defaultDate = new Date().toISOString().split('T')[0];

    const methods = useForm<JobworkFabricReceiveData>({
        mode: 'onChange',
        defaultValues: {
            receiveNo: '',
            jobFabricReceiveDate: defaultDate
        }
    });

    const { register, watch, setValue, handleSubmit, formState: { errors }, trigger, reset } = methods;

    const vendorIdWatch = useWatch({ control: methods.control, name: 'vendorId' });
    const weavingContractIdWatch = useWatch({ control: methods.control, name: 'weavingContractId' });

    const [filteredItems, setFilteredItems] = useState<any[]>([]);
    const [filteredWeavingContracts, setFilteredWeavingContracts] = useState<any[]>([]);


    const weavingContractOptions = useMemo<CommonSearchableSelectOption[]>(() => {
        if (!Array.isArray(filteredWeavingContracts)) return [];
        return filteredWeavingContracts
            .map((contract: any) => {
                const id = contract?.id;
                const label = contract?.weavingContractNo || contract?.contractNo || `Contract ${id}`;
                if (!id || !label) {
                    return null;
                }
                return {
                    id,
                    value: String(id),
                    label
                };
            })
            .filter(Boolean) as CommonSearchableSelectOption[];
    }, [filteredWeavingContracts]);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [showPieceDetails, setShowPieceDetails] = useState(false);
    const [selectedItemForPieces, setSelectedItemForPieces] = useState<any>(null);
    const [pieceEntries, setPieceEntries] = useState<PieceEntry[]>([]);
    const [numberOfPieces, setNumberOfPieces] = useState<string>('0');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Auth + Company context for Piece No prefix
    const { selectedCompany } = useAuth();
    const { companyMasterList } = useSelector((state: RootState) => state.companyMaster);

    // Add these to your existing state declarations
    const [showCodeSuggestions, setShowCodeSuggestions] = useState(false);
    const [codeSuggestions, setCodeSuggestions] = useState<any[]>([]);
    const [activeCodeIndex, setActiveCodeIndex] = useState<number>(-1);
    const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(null);

    const commitActiveFabric = (rowIndex: number) => {
        if (!showCodeSuggestions || codeSuggestions.length === 0) return false;
        if (activeCodeIndex < 0 || activeCodeIndex >= codeSuggestions.length) return false;

        const selectedItem = codeSuggestions[activeCodeIndex];
        updatePieceEntry(rowIndex, 'fabricCode', selectedItem.fabricCode);
        updatePieceEntry(rowIndex, 'fabricDetails', `${selectedItem.fabricCode} - ${selectedItem.fabricQuality || ''}`);
        try {
            const fm = (fabricMasterList || []).find((f: any) => String(f.fabricCode) === String(selectedItem.fabricCode));
            if (selectedItem?.id || fm?.id) {
                updatePieceEntry(rowIndex, 'fabricMasterId', Number(selectedItem.id ?? fm?.id));
            }
            if (selectedItem?.fabricQuality || fm?.fabricQuality) {
                updatePieceEntry(rowIndex, 'quality', String(selectedItem.fabricQuality ?? fm?.fabricQuality ?? ''));
            }
        } catch { }
        setShowCodeSuggestions(false);
        setActiveCodeIndex(-1);
        return true;
    };

    useEffect(() => {
        if (!companyMasterList || companyMasterList.length === 0) {
            dispatch(getAllCompanies({ fetchAll: true }));
        }
    }, [dispatch]);

    const loggedCompanyCode = useMemo(() => {
        if (!companyMasterList || !selectedCompany) return '';
        const found = companyMasterList.find((c: any) => c.id === Number(selectedCompany));
        return found?.companyCode || '';
    }, [companyMasterList, selectedCompany]);

    const piecePrefix = useMemo(() => {
        return loggedCompanyCode ? `${loggedCompanyCode}-GFP-` : 'GFP-';
    }, [loggedCompanyCode]);

    const resolvedCompanyId = useMemo(() => {
        const storedValue = selectedCompany
            ? String(selectedCompany)
            : (typeof window !== 'undefined'
                ? (localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
                : null);
        if (!storedValue) return undefined;
        const parsed = Number(storedValue);
        return Number.isNaN(parsed) ? undefined : parsed;
    }, [selectedCompany]);

    const [pieceEntriesDraft, setPieceEntriesDraft] = useState<Partial<PieceEntry>[]>([]);
    const [fabricSuggestIndex, setFabricSuggestIndex] = useState<number | null>(null);
    const [fabricSearch, setFabricSearch] = useState<string>('');
    const [editingPieceId, setEditingPieceId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // const [displayReceiveNo, setDisplayReceiveNo] = useState<string>('');

    const [formData, setFormData] = useState<JobworkFabricReceiveData>({
        weavingContractId: 0,
        vendorId: 0,
        jobFabricReceiveDate: defaultDate,
        dcNumber: '',
        dcDate: defaultDate,
        remarks: '',
        receiveNo: '',
        companyId: selectedCompany ? String(selectedCompany) : undefined,
        activeFlag: true,
        jobworkFabricReceiveItemsDtl: []
    });

    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
    const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
    const { getWeavingContractByIdList } = useSelector((state: RootState) => state.weavingContracts);
    const { warehouseList } = useSelector((state: RootState) => state.warehouse);

    const { filteredWarehouseOptions: fabricWarehouseOptions, defaultWarehouseId: defaultFabricWarehouseId } = useFilteredWarehouseOptions(warehouseList, 'Fabric');


    const normalizedVendorList = useMemo(() => {
        if (Array.isArray(vendorList)) return vendorList;
        // Check for nested data structure as provided in requirements
        if (vendorList?.data && Array.isArray(vendorList.data.data)) {
            return vendorList.data.data;
        }
        return vendorList?.data || [];
    }, [vendorList]);
    const vendorOptions = useMemo<CommonSearchableSelectOption[]>(() => normalizedVendorList
        .filter((vendor: any) => Number(vendor?.isInternalVendor) === 0 && [307, 303].includes(Number(vendor?.vendorTypeId)))
        .map((vendor: any) => {
            const id = vendor?.id ?? vendor?.vendorId ?? vendor?.customerId;
            const label = vendor?.vendorName || vendor?.customerName || vendor?.companyName || vendor?.name;
            if (!id || !label) {
                return null;
            }
            return {
                id,
                value: String(id),
                label,
                activeFlag: vendor?.activeFlag ?? true
            };
        })
        .filter(Boolean) as CommonSearchableSelectOption[], [normalizedVendorList]);
    const location = useLocation();
    const params = useParams<{ id?: string }>();

    const fabricMastersArray = useMemo(() => {
        if (Array.isArray(fabricMasterList)) return fabricMasterList;
        return fabricMasterList?.data || [];
    }, [fabricMasterList]);

    const fabricMasterByCode = useMemo(() => {
        const map = new Map<string, any>();
        fabricMastersArray.forEach((fabric: any) => {
            const code = (fabric?.fabricCode || fabric?.fabric_code || '')
                .toString()
                .trim()
                .toLowerCase();
            if (code) {
                map.set(code, fabric);
            }
        });
        return map;
    }, [fabricMastersArray]);

    const getPickRateFromContractItems = (weavingContractId: number, sourceItem: any) => {
        if (!weavingContractId || !sourceItem) return undefined;

        const selectedContract = (weavingContractList || []).find((contract: any) => Number(contract?.id) === Number(weavingContractId));
        const contractItems = selectedContract?.items || selectedContract?.weavingContractItemDtl || [];
        if (!Array.isArray(contractItems) || contractItems.length === 0) return undefined;

        const targetItemId = Number(sourceItem?.id ?? sourceItem?.weavingContractItemId ?? 0);
        const targetFabricId = Number(sourceItem?.fabricCodeId ?? sourceItem?.fabricId ?? 0);
        const targetFabricCode = (sourceItem?.fabricCode || '')
            .toString()
            .trim()
            .toLowerCase();

        const matchedContractItem = contractItems.find((item: any) => {
            if (targetItemId && Number(item?.id) === targetItemId) {
                return true;
            }

            const itemFabricId = Number(item?.fabricCodeId ?? item?.fabricId ?? 0);
            if (targetFabricId && itemFabricId === targetFabricId) {
                return true;
            }

            if (targetFabricCode) {
                const linkedFabricCode = (item?.fabricCode || fabricMastersArray.find((fabric: any) => Number(fabric?.id) === itemFabricId)?.fabricCode || '')
                    .toString()
                    .trim()
                    .toLowerCase();
                return linkedFabricCode === targetFabricCode;
            }

            return false;
        });

        const resolvedValue = matchedContractItem?.pickCost ?? matchedContractItem?.price;
        const parsed = Number(resolvedValue);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    const [jobworkFabricReceiveDtl, setJobworkFabricReceiveDtl] = useState<any>(location.state?.record || null);
    const routeRecordId = params?.id ? Number(params.id) : null;
    const navigate = useNavigate();

    const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);


    // Generate document number for new beam inward entries
    useEffect(() => {
        const generateDocumentNumber = async () => {
            // Only generate for new entries (not editing existing ones)
            if (jobworkFabricReceiveDtl || hasGeneratedNumberRef.current) {
                return;
            }

            try {
                const result = await documentNumberService.generateDocumentNumber({
                    screenName: 'Jobwork Fabric Receive'
                });

                setValue('receiveNo', result.documentNumber, { shouldValidate: true });
                hasGeneratedNumberRef.current = true;
            } catch (error) {
                console.error('Failed to generate jobwork fabric receive number:', error);
                toast.error('Failed to generate jobwork fabric receive number');
            }
        };

        generateDocumentNumber();
    }, [jobworkFabricReceiveDtl, setValue]);

    // Cleanup document number cache if not saved
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !jobworkFabricReceiveDtl) {
                documentNumberService.clearMemoryCache('Jobwork Fabric Receive');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !jobworkFabricReceiveDtl) {
                documentNumberService.clearMemoryCache('Jobwork Fabric Receive');
            }
        };
    }, [jobworkFabricReceiveDtl]);


    useEffect(() => {
        setValue('receiveNo', jobworkFabricReceiveDtl?.receiveNo || '');
    }, [jobworkFabricReceiveDtl, setValue]);


    useEffect(() => {
        dispatch(getAllVendors({ fetchAll: true }));
        dispatch(getAllProductCategory({ fetchAll: true }));
        dispatch(getAllWeavingContract({ companyId: resolvedCompanyId }));
        dispatch(getAllFabricMasters({ fetchAll: true }));
        dispatch(getAllWarehouse({ fetchAll: true }));
    }, [dispatch, resolvedCompanyId]);

    useEffect(() => {
        if (location.state?.record) {
            setJobworkFabricReceiveDtl(location.state.record);
        }
    }, [location.state]);

    // Auto-populate vendor and weaving contract fields from navigation state
    useEffect(() => {
        if (!jobworkFabricReceiveDtl && location.state?.source === 'order-entry-management') {
            // Only auto-populate for new entries (not editing existing ones)
            const { vendorId, weavingContractId } = location.state;
            
            if (vendorId) {
                setValue('vendorId', Number(vendorId), { shouldValidate: true });
            }
            
            if (weavingContractId) {
                setValue('weavingContractId', Number(weavingContractId));
                // Trigger validation after a short delay to ensure value is set
                setTimeout(() => {
                    trigger('weavingContractId');
                }, 100);
            }
        }
    }, [location.state, jobworkFabricReceiveDtl, setValue, trigger]);

    // Auto-fetch contract item details when weaving contract is auto-populated from navigation state
    useEffect(() => {
        if (!jobworkFabricReceiveDtl && location.state?.source === 'order-entry-management' && location.state?.weavingContractId) {
            const weavingContractId = Number(location.state.weavingContractId);
            
            // Only fetch if we have a valid contract ID and fabric master list is available
            if (weavingContractId && fabricMasterList.length > 0) {
                const fetchContractDetails = async () => {
                    try {
                        const result = await dispatch(getWeavingContractById(weavingContractId));
                        const weavingContract = result?.payload;

                        if (weavingContract?.items) {
                            const itemsWithDetails = weavingContract.items.map((item: any) => {
                                const fabricId = item.fabricCodeId || item.fabricId;
                                const fabric = fabricMasterList.find((f: any) => f.id === parseInt(fabricId || '0'));
                                const code = fabric?.fabricCode || item.fabricCode || item.quality || 'N/A';
                                const quality = fabric?.fabricQuality || item.fabricQualityId || item.quality || 'N/A';
                                const details = `${code} - ${quality}`;
                                return {
                                    ...item,
                                    fabricCode: code,
                                    fabricDetails: details,
                                    quality: quality,
                                    price: getPickRateFromContractItems(weavingContractId, item) ?? item?.pickCost ?? item?.price ?? 0
                                };
                            });
                            setFilteredItems(itemsWithDetails);
                        }
                    } catch (error) {
                        console.error('Error fetching weaving contract details:', error);
                        // Don't show toast error for auto-fetch to avoid user annoyance
                    }
                };

                fetchContractDetails();
            }
        }
    }, [location.state, jobworkFabricReceiveDtl, dispatch, fabricMasterList]);

    useEffect(() => {
        if (jobworkFabricReceiveDtl || !routeRecordId) {
            return;
        }
        const storedCompanyId = selectedCompany || localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        if (!storedCompanyId) {
            return;
        }
        setIsLoading(true);

    }, [jobworkFabricReceiveDtl, routeRecordId, dispatch, selectedCompany]);


    useEffect(() => {
        const vendorIdValue = vendorIdWatch || (jobworkFabricReceiveDtl?.vendorId ? String(jobworkFabricReceiveDtl.vendorId) : '');
        if (!vendorIdValue) {
            setFilteredWeavingContracts([]);
            return;
        }

        const normalizedList = (weavingContractList || []).filter((wc: any) => {
            const matchesVendor = Number(wc.vendorId) === Number(vendorIdValue);
            const matchesOrderType = Number(wc.orderTypeId) === 2; // Filter for External (2)
            if (!matchesVendor || !matchesOrderType) return false;
            if (!resolvedCompanyId) return true;
            const contractCompanyId = resolveContractCompanyId(wc);
            return contractCompanyId === resolvedCompanyId;
        });
        const contractId = jobworkFabricReceiveDtl?.weavingContractId;
        if (contractId) {
            const hasContract = normalizedList.some((wc: any) => Number(wc.id) === Number(contractId));
            if (!hasContract) {
                const fallbackContract = (weavingContractList || []).find((wc: any) => Number(wc.id) === Number(contractId));
                if (fallbackContract) {
                    normalizedList.unshift(fallbackContract);
                } else if (jobworkFabricReceiveDtl?.weavingContractNo) {
                    normalizedList.unshift({
                        id: contractId,
                        weavingContractNo: jobworkFabricReceiveDtl.weavingContractNo,
                        contractNo: jobworkFabricReceiveDtl.weavingContractNo,
                        vendorId: jobworkFabricReceiveDtl.vendorId
                    });
                }
            }
        }

        setFilteredWeavingContracts(normalizedList);
    }, [vendorIdWatch, weavingContractList, jobworkFabricReceiveDtl, resolvedCompanyId]);

    // useEffect(() => {
    //     if (jobworkFabricReceiveDtl) {
    //         setIsEditMode(true);

    //         const editDate = jobworkFabricReceiveDtl.jobFabricReceiveDate.split('T')[0];

    //         reset({
    //             vendorId: jobworkFabricReceiveDtl.vendorId.toString(),
    //             weavingContractId: jobworkFabricReceiveDtl.weavingContractId.toString(),
    //             jobFabricReceiveDate: editDate,
    //             remarks: jobworkFabricReceiveDtl.remarks,
    //             receiveNo: jobworkFabricReceiveDtl.receiveNo || '',
    //             dcDate: jobworkFabricReceiveDtl.jobFabricReceiveDate.split('T')[0],
    //             dcNumber: jobworkFabricReceiveDtl.dcNumber
    //         });

    //         const selectedWeavingContract = weavingContractList.find((wc: any) => wc.id === jobworkFabricReceiveDtl.weavingContractId);
    //         const weavingContractNo = jobworkFabricReceiveDtl.weavingContractNo || selectedWeavingContract?.weavingContractNo || selectedWeavingContract?.contractNo || '';

    //         setFormData({
    //             id: jobworkFabricReceiveDtl.id,
    //             weavingContractId: jobworkFabricReceiveDtl.weavingContractId,
    //             weavingContractNo: weavingContractNo,
    //             vendorId: jobworkFabricReceiveDtl.vendorId,
    //             jobFabricReceiveDate: jobworkFabricReceiveDtl.jobFabricReceiveDate,
    //             dcNumber: jobworkFabricReceiveDtl.dcNumber,
    //             dcDate: jobworkFabricReceiveDtl.dcDate,
    //             remarks: jobworkFabricReceiveDtl.remarks,
    //             receiveNo: jobworkFabricReceiveDtl.receiveNo || '',
    //             companyId: jobworkFabricReceiveDtl.companyId ? String(jobworkFabricReceiveDtl.companyId) : (selectedCompany ? String(selectedCompany) : undefined),
    //             activeFlag: jobworkFabricReceiveDtl.activeFlag,
    //             fabricCode: jobworkFabricReceiveDtl.fabricCode,
    //             fabricDetails: jobworkFabricReceiveDtl.fabricDetails,
    //             quality: jobworkFabricReceiveDtl.quality,
    //             jobworkFabricReceiveItemsDtl: jobworkFabricReceiveDtl.items
    //         });

    //         if (jobworkFabricReceiveDtl.weavingContractId) {
    //             dispatch(getWeavingContractById(jobworkFabricReceiveDtl.weavingContractId))
    //                 .then((result) => {
    //                     const weavingContract = result?.payload;
    //                     if (weavingContract?.items) {
    //                         const savedItems = jobworkFabricReceiveDtl.jobworkFabricReceiveItemsDtl || jobworkFabricReceiveDtl.items || [];
    //                         const savedItemsMap = new Map<number, any>(
    //                             savedItems.map((saved: any) => [Number(saved.weavingContractItemId ?? saved.id), saved])
    //                         );

    //                         const itemsWithDetails = weavingContract.items.map((item: any) => {
    //                             const fabricId = item.fabricCodeId || item.fabricId;
    //                             const fabric = fabricMasterList.find((f: any) => f.id === parseInt(fabricId || '0'));
    //                             const code = fabric?.fabricCode || item.fabricCode || item.quality || 'N/A';
    //                             const quality = fabric?.fabricQuality || item.fabricQualityId || item.quality || 'N/A';
    //                             const details = `${code} - ${quality}`;
    //                             const saved = savedItemsMap.get(Number(item.id));
    //                             return {
    //                                 ...item,
    //                                 fabricCode: saved?.fabricCode || code,
    //                                 fabricDetails: saved?.fabricDetails || details,
    //                                 quality: saved?.quality || quality,
    //                                 price: saved?.price ?? getPickRateFromContractItems(jobworkFabricReceiveDtl.weavingContractId, item) ?? item?.pickCost ?? item?.price ?? 0,
    //                                 quantity: item.quantity,
    //                                 quantityReceived: saved?.quantityReceived ?? 0
    //                             };
    //                         });

    //                         setFilteredItems(itemsWithDetails);

    //                         if (savedItems.length > 0) {
    //                             const primaryItem = savedItems[0];
    //                             const contractItemId = primaryItem.weavingContractItemId ?? primaryItem.id;
    //                             const matchedContractItem = itemsWithDetails.find((item: any) => Number(item.id) === Number(contractItemId));
    //                             const selectedPayload = {
    //                                 ...primaryItem,
    //                                 id: contractItemId,
    //                                 quantity: matchedContractItem?.quantity || 0,
    //                                 quantityReceived: primaryItem.quantityReceived,
    //                                 price: primaryItem.price ?? matchedContractItem?.price ?? getPickRateFromContractItems(jobworkFabricReceiveDtl.weavingContractId, primaryItem) ?? 0,
    //                                 weavingContractId: jobworkFabricReceiveDtl.weavingContractId,
    //                                 vendorId: jobworkFabricReceiveDtl.vendorId,
    //                                 jobFabricReceiveDate: jobworkFabricReceiveDtl.jobFabricReceiveDate,
    //                                 weavingContractItemId: contractItemId,
    //                                 remarks: jobworkFabricReceiveDtl.remarks,
    //                                 fabricCode: primaryItem.fabricCode,
    //                                 fabricDetails: primaryItem.fabricDetails,
    //                                 dcNumber: jobworkFabricReceiveDtl.dcNumber,
    //                                 dcDate: jobworkFabricReceiveDtl.dcDate,
    //                                 quality: primaryItem.quality,
    //                                 activeFlag: true,
    //                                 jobworkFabricReceiveItemId: primaryItem.id
    //                             };

    //                             setSelectedItems([selectedPayload]);
    //                             setSelectedItemForPieces({
    //                                 ...selectedPayload,
    //                                 quantity: matchedContractItem?.quantity || 0
    //                             });

    //                             const loadedPieces = (primaryItem.pieceEntries || []).map((p: any) => {
    //                                 const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
    //                                 const codeForLookup = p.fabricCode || primaryItem.fabricCode;
    //                                 const fmMatchById = p.fabricMasterId
    //                                     ? fmArr.find((f: any) => Number(f.id) === Number(p.fabricMasterId))
    //                                     : undefined;
    //                                 const fmMatch = fmMatchById || fmArr.find((f: any) => String(f.fabricCode) === String(codeForLookup));
    //                                 const resolvedCode = fmMatch?.fabricCode || codeForLookup;
    //                                 const resolvedQuality = p.quality || fmMatch?.fabricQuality || primaryItem.quality || '';
    //                                 const resolvedDetails = p.fabricDetails
    //                                     || (fmMatch ? `${fmMatch.fabricCode || ''} - ${fmMatch.fabricQuality || ''}` : '')
    //                                     || primaryItem.fabricDetails
    //                                     || '';
    //                                 return {
    //                                     ...p,
    //                                     avgWeight: p.quantity > 0 ? p.weight / p.quantity : 0,
    //                                     warehouseId: p.warehouseId,
    //                                     fabricCode: resolvedCode,
    //                                     fabricDetails: resolvedDetails,
    //                                     quality: resolvedQuality,
    //                                     fabricMasterId: p.fabricMasterId ?? (fmMatch?.id ? Number(fmMatch.id) : undefined)
    //                                 };
    //                             });
    //                             setPieceEntries(loadedPieces);
    //                         } else {
    //                             setSelectedItems([]);
    //                             setSelectedItemForPieces(null);
    //                         }
    //                     } else {
    //                         setFilteredItems([]);
    //                         setSelectedItems([]);
    //                         setSelectedItemForPieces(null);
    //                     }
    //                 })
    //                 .catch((error) => {
    //                     console.error("Error fetching weaving contract:", error);
    //                     toast.error("Error loading weaving contract details");
    //                 });
    //         }
    //     }
    // }, [jobworkFabricReceiveDtl, reset, dispatch, fabricMasterList]);

    useEffect(() => {
        if (jobworkFabricReceiveDtl) {
            return;
        }

        if (getWeavingContractByIdList && Array.isArray(getWeavingContractByIdList)) {
            const items = getWeavingContractByIdList.flatMap((po: any) => {
                if (po.items && Array.isArray(po.items)) {
                    return po.items.map((item: any) => ({
                        ...item,
                        poDate: po.poDate,
                        quantityReceived: 0,
                        price: item?.pickCost ?? getPickRateFromContractItems(Number(po?.id), item) ?? item?.price ?? 0
                    }));
                }
                return [];
            });
            setFilteredItems(items);
        } else {
            setFilteredItems([]);
        }
    }, [getWeavingContractByIdList, jobworkFabricReceiveDtl]);

    useEffect(() => {
        const selectedContractId = Number(weavingContractIdWatch || formData.weavingContractId || 0);
        if (!selectedContractId || filteredItems.length === 0) {
            return;
        }

        setFilteredItems((prev: any[]) => {
            let changed = false;
            const updated = prev.map((item: any) => {
                const resolvedPickRate = getPickRateFromContractItems(selectedContractId, item);
                if (resolvedPickRate === undefined) {
                    return item;
                }

                const currentPrice = Number(item?.price);
                const shouldAutofill = item?.price === '' || item?.price === null || item?.price === undefined || !Number.isFinite(currentPrice) || currentPrice === 0;
                if (!shouldAutofill) {
                    return item;
                }

                if (currentPrice === resolvedPickRate && Number.isFinite(currentPrice)) {
                    return item;
                }

                changed = true;
                return { ...item, price: resolvedPickRate };
            });

            return changed ? updated : prev;
        });

        setSelectedItems((prevSelected: any[]) => prevSelected.map((selected: any) => {
            const resolvedPickRate = getPickRateFromContractItems(selectedContractId, selected);
            if (resolvedPickRate === undefined) {
                return selected;
            }
            const currentPrice = Number(selected?.price);
            const shouldAutofill = selected?.price === '' || selected?.price === null || selected?.price === undefined || !Number.isFinite(currentPrice) || currentPrice === 0;
            return shouldAutofill ? { ...selected, price: resolvedPickRate } : selected;
        }));

        setSelectedItemForPieces((prev: any) => {
            if (!prev) {
                return prev;
            }
            const resolvedPickRate = getPickRateFromContractItems(selectedContractId, prev);
            if (resolvedPickRate === undefined) {
                return prev;
            }
            const currentPrice = Number(prev?.price);
            const shouldAutofill = prev?.price === '' || prev?.price === null || prev?.price === undefined || !Number.isFinite(currentPrice) || currentPrice === 0;
            return shouldAutofill ? { ...prev, price: resolvedPickRate } : prev;
        });
    }, [weavingContractIdWatch, formData.weavingContractId, weavingContractList, fabricMastersArray, filteredItems.length]);

    const validateForm = async () => {
        const isValid = await trigger([
            'vendorId',
            'weavingContractId',
            'jobFabricReceiveDate'
        ]);
        return isValid;
    };

    const handleWContactChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const weavingContractId = parseInt(e.target.value);
        setFilteredItems([]);

        if (weavingContractId) {
            try {
                const result = await dispatch(getWeavingContractById(weavingContractId));
                const weavingContract = result?.payload;

                if (weavingContract?.items) {
                    const itemsWithDetails = weavingContract.items.map((item: any) => {
                        const fabricId = item.fabricCodeId || item.fabricId;
                        const fabric = fabricMasterList.find((f: any) => f.id === parseInt(fabricId || '0'));
                        const code = fabric?.fabricCode || item.fabricCode || item.quality || 'N/A';
                        const quality = fabric?.fabricQuality || item.fabricQualityId || item.quality || 'N/A';
                        const details = `${code} - ${quality}`;
                        return {
                            ...item,
                            fabricCode: code,
                            fabricDetails: details,
                            quality: quality,
                            price: getPickRateFromContractItems(weavingContractId, item) ?? item?.pickCost ?? item?.price ?? 0
                        };
                    });
                    setFilteredItems(itemsWithDetails);
                } else {
                    toast.warning("No items found in weaving contract.");
                }
            } catch (error) {
                toast.error("Error fetching weaving contract");
                console.error("Error fetching weaving contract:", error);
            }
        }
    };

    const handleFabricCodeChange = (index: number, value: string) => {
        const updatedItems = [...filteredItems];
        updatedItems[index].fabricCode = value;
        setFilteredItems(updatedItems);

        const fabric = fabricMasterList.find((f: any) => f.fabricCode === value);
        const quality = fabric?.fabricQuality || 'N/A';
        updatedItems[index].fabricDetails = `${value} - ${quality}`;
        updatedItems[index].fabricMasterId = fabric?.id ? Number(fabric.id) : undefined;
        setFilteredItems(updatedItems);

        setSelectedItems((prev) => prev.map((sel) => sel.id === updatedItems[index].id ? { ...sel, fabricCode: value, fabricDetails: updatedItems[index].fabricDetails, fabricMasterId: updatedItems[index].fabricMasterId } : sel));
    };

    const handleItemSelect = (item: any) => {
        const formValues = watch();

        if (!formValues.vendorId || !formValues.weavingContractId || !formValues.jobFabricReceiveDate) {
            toast.error("Please fill all required fields before selecting items");
            return;
        }

        setSelectedItems((prevSelected: any[]) => {
            const isSelected = prevSelected.some(
                (selected) => selected.id === item.id
            );

            if (isSelected) {
                return [];
            } else {
                const selectedContractId = Number(formValues.weavingContractId || 0);
                const resolvedPickRate = getPickRateFromContractItems(selectedContractId, item) ?? item?.pickCost ?? item?.price ?? 0;
                return [{
                    ...item,
                    quantityReceived: item.quantityReceived || 0,
                    price: resolvedPickRate,
                    weavingContractId: formValues.weavingContractId,
                    vendorId: formValues.vendorId,
                    jobFabricReceiveDate: new Date(formValues.jobFabricReceiveDate).toISOString(),
                    weavingContractItemId: item.id,
                    remarks: formValues.remarks || "",
                    activeFlag: true
                }];
            }
        });
    };

    const showPieceCreation = async () => {
        const isFormValid = await validateForm();

        if (!isFormValid) {
            toast.error("Please fill all required fields");
            return;
        }

        if (selectedItems.length === 0) {
            toast.error("Please select at least one item");
            return;
        }

        const selectedItem = selectedItems[0];
        const invalidItem = !selectedItem.quantityReceived ||
            Number(selectedItem.quantityReceived) <= 0 ||
            Number(selectedItem.quantityReceived) > Number(selectedItem.quantity);

        if (invalidItem) {
            toast.error("Please enter valid quantity for the selected item");
            return;
        }

        setSelectedItemForPieces(selectedItem);
        setShowPieceDetails(true);

        // Fixed: Include all required fields including receiveNo and companyId
        setFormData({
            ...formData,
            weavingContractId: Number(watch("weavingContractId")),
            vendorId: Number(watch("vendorId")),
            jobFabricReceiveDate: watch("jobFabricReceiveDate"),
            dcNumber: watch("dcNumber"),
            dcDate: watch("dcDate"),
            remarks: watch("remarks") || '',
            companyId: selectedCompany ? String(selectedCompany) : undefined,
            activeFlag: true,
            jobworkFabricReceiveItemsDtl: []
        });
    };

    const handleInputChange = (index: number, field: string, value: string) => {
        if (field === 'quantityReceived') {
            const maxQuantity = filteredItems[index].quantity;
            if (Number(value) > Number(maxQuantity)) {
                toast.warning(`Cannot receive more than ${maxQuantity}`);
                value = maxQuantity.toString();
            }
            if (Number(value) < 0) {
                value = '0';
            }
        }

        const updatedItems = [...filteredItems];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value
        };
        setFilteredItems(updatedItems);

        setSelectedItems((prevSelected: any[]) => {
            const item = filteredItems[index];
            const isSelected = prevSelected.some(
                (selected) => selected.id === item.id
            );

            if (isSelected) {
                return prevSelected.map((selected) =>
                    selected.id === item.id
                        ? { ...selected, [field]: value }
                        : selected
                );
            }
            return prevSelected;
        });
    };

    const normalizeCellValue = (value: any) => {
        if (value === null || value === undefined) return '';
        return value.toString().trim();
    };

    const parseNumericCell = (value: any) => {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) return null;
            const parsed = parseFloat(trimmed);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    };

    const normalizeRowKeys = (row: Record<string, any>) => {
        return Object.entries(row || {}).reduce<Record<string, any>>((acc, [key, value]) => {
            acc[key?.toString().trim().toLowerCase()] = value;
            return acc;
        }, {});
    };

    const updatePieceEntryMany = (index: number, updates: Partial<PieceEntry>) => {
        setPieceEntriesDraft(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const commitFabricSelection = (rowIndex: number, item: any, closeDropdown: boolean = true) => {
        const fabricWarehouses = getWarehousesForFabric(item.fabricCode);
        const defaultWarehouse = fabricWarehouses && fabricWarehouses.length > 0
            ? String(fabricWarehouses[0]?.id)
            : '';

        updatePieceEntryMany(rowIndex, {
            fabricCode: item.fabricCode,
            fabricDetails: `${item.fabricCode} - ${item.fabricQuality || ''}`,
            quality: item.fabricQuality || '',
            fabricMasterId: Number(item.id ?? item.fabricMasterId ?? 0) || undefined,
            warehouseId: defaultWarehouse
        });

        if (closeDropdown) {
            setShowCodeSuggestions(false);
            setActiveCodeIndex(-1);
        }
    };

    const updatePieceEntry = (index: number, key: keyof PieceEntry, value: any) => {
        const updated = [...pieceEntriesDraft];

        let nextValue = value;
        if (key === 'pieceNumber') {
            nextValue = value === undefined || value === null ? '' : String(value).trim();
        }

        updated[index] = { ...updated[index], [key]: nextValue } as Partial<PieceEntry>;

        if (key === 'pieceNumber' && nextValue) {
            const normalizedNext = String(nextValue).trim().toLowerCase();
            const allPieces = [...pieceEntries, ...pieceEntriesDraft.filter((_, i) => i !== index)];
            if (allPieces.some(p => {
                const existingPieceNo = (p.pieceNumber || '').trim().toLowerCase();
                return existingPieceNo && existingPieceNo === normalizedNext && p.id !== updated[index].id;
            })) {
                toast.warning("Piece number already exists");
            }
        }
        setPieceEntriesDraft(updated);
    };

    // const handleAddLot = () => {
    //     const validEntries = pieceEntriesDraft.filter(e => e.quantity && e.quantity > 0 && e.weight && e.weight >= 0);
    //     if (!validEntries.length) {
    //         toast.warning("Please enter valid quantities and weights for all pieces");
    //         return;
    //     }

    //     const entriesToAdd: PieceEntry[] = validEntries.map((entry, i) => {
    //         const codeForLookup = entry.fabricCode || selectedItemForPieces.fabricCode;
    //         const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
    //         const fmMatch = fmArr.find((f: any) => String(f.fabricCode) === String(codeForLookup));
    //         const computedFmId = entry.fabricMasterId ?? (fmMatch?.id ? Number(fmMatch.id) : undefined);
    //         return {
    //             id: editingPieceId || pieceEntries.length + i + 1,
    //             pieceNumber: entry.pieceNumber || '',
    //             quantity: entry.quantity || 0,
    //             weight: entry.weight || 0,
    //             avgWeight: (entry.quantity || 0) > 0 ? (entry.weight || 0) / (entry.quantity || 0) : 0,
    //             remarks: entry.remarks || '',
    //             cost: entry.cost || 0,
    //             fabricCode: codeForLookup,
    //             fabricDetails: entry.fabricDetails || selectedItemForPieces.fabricDetails,
    //             quality: entry.quality || selectedItemForPieces.quality,
    //             warehouseId: entry.warehouseId ? Number(entry.warehouseId) : undefined,
    //             fabricMasterId: computedFmId,
    //             activeFlag: true
    //         };
    //     });

    //     setPieceEntries([...pieceEntries, ...entriesToAdd]);
    //     setPieceEntriesDraft([]);
    //     setEditingPieceId(null);
    //     setNumberOfPieces('0');
    // };

    const handleDeleteLot = (id: number) => {
        setPieceEntries(pieceEntries.filter(entry => entry.id !== id));
    };

    const handleEditLot = (entry: PieceEntry) => {
        setEditingPieceId(entry.id || null);
        setPieceEntriesDraft([{ ...entry, avgWeight: undefined }]);
        handleDeleteLot(entry.id || 0);
    };

    // const importFabricPiecesFromRows = (rows: Record<string, any>[]) => {
    //     if (!selectedItemForPieces) {
    //         toast.error("Please select an item before importing pieces");
    //         return;
    //     }
    //     const validationErrors: string[] = [];
    //     const parsedEntries: PieceEntry[] = [];
    //     const existingPieceNumbers = new Set(
    //         [...pieceEntries, ...pieceEntriesDraft]
    //             .map(entry => entry.pieceNumber?.toString().trim().toLowerCase())
    //             .filter(Boolean) as string[]
    //     );

    //     rows.forEach((row, index) => {
    //         const normalized = normalizeRowKeys(row || {});
    //         const hasValues = Object.values(normalized).some(value => value !== undefined && value !== null && value !== '');
    //         if (!hasValues) {
    //             return;
    //         }

    //         const warehouseName = normalizeCellValue(normalized['warehouse name'] ?? normalized['warehouse']);
    //         if (!warehouseName) {
    //             validationErrors.push(`Row ${index + 2}: Warehouse Name is required`);
    //             return;
    //         }
    //         const warehouseRecord = warehouseNameLookup.get(warehouseName.toLowerCase());
    //         if (!warehouseRecord) {
    //             validationErrors.push(`Row ${index + 2}: Warehouse "${warehouseName}" not found`);
    //             return;
    //         }

    //         const fabricCodeValue = normalizeCellValue(normalized['fabric code']);
    //         if (!fabricCodeValue) {
    //             validationErrors.push(`Row ${index + 2}: Fabric Code is required`);
    //             return;
    //         }
    //         const fabricRecord = fabricMasterByCode.get(fabricCodeValue.toLowerCase());
    //         if (!fabricRecord) {
    //             validationErrors.push(`Row ${index + 2}: Fabric Code "${fabricCodeValue}" not found in master data`);
    //             return;
    //         }
    //         // const allowedContractCodes = new Set<string>();
    //         // const selectedFabricCode = normalizeCellValue(selectedItemForPieces.fabricCode);
    //         // if (selectedFabricCode) {
    //         //     allowedContractCodes.add(selectedFabricCode.toLowerCase());
    //         // }
    //         // const selectedFabricDetails = normalizeCellValue(selectedItemForPieces.fabricDetails);
    //         // if (selectedFabricDetails) {
    //         //     const codeFromDetails = selectedFabricDetails.split('-')[0]?.trim().toLowerCase();
    //         //     if (codeFromDetails) {
    //         //         allowedContractCodes.add(codeFromDetails);
    //         //     }
    //         // }
    //         // const normalizedFabricCodeValue = fabricCodeValue.toLowerCase();
    //         // if (allowedContractCodes.size && !allowedContractCodes.has(normalizedFabricCodeValue)) {
    //         //     validationErrors.push(`Row ${index + 2}: Contract does not allow fabric code "${fabricCodeValue}"`);
    //         //     return;
    //         // }

    //         let pieceNumberValue = normalizeCellValue(normalized['piece no'] ?? normalized['piece number']);
    //         if (!pieceNumberValue) {
    //             validationErrors.push(`Row ${index + 2}: Piece No is required`);
    //             return;
    //         }
    //         const normalizedPieceNumber = pieceNumberValue.toLowerCase();
    //         if (existingPieceNumbers.has(normalizedPieceNumber) || parsedEntries.some(entry => entry.pieceNumber?.toLowerCase() === normalizedPieceNumber)) {
    //             validationErrors.push(`Row ${index + 2}: Piece No "${pieceNumberValue}" already exists`);
    //             return;
    //         }

    //         const pieceMeter = parseNumericCell(normalized['piece meter']);
    //         const netWeight = parseNumericCell(normalized['net weight'] ?? normalized['net wt']);
    //         if (!pieceMeter || pieceMeter <= 0) {
    //             validationErrors.push(`Row ${index + 2}: Piece Meter must be greater than zero`);
    //             return;
    //         }
    //         if (!netWeight || netWeight <= 0) {
    //             validationErrors.push(`Row ${index + 2}: Net Weight must be greater than zero`);
    //             return;
    //         }

    //         const pickRate = parseNumericCell(normalized['pick rate']);
    //         if (pickRate === null || pickRate === undefined || !Number.isFinite(pickRate)) {
    //             validationErrors.push(`Row ${index + 2}: Pick Rate is required`);
    //             return;
    //         }
    //         const remarks = normalizeCellValue(normalized['remarks']);
    //         if (!remarks) {
    //             validationErrors.push(`Row ${index + 2}: Remarks is required`);
    //             return;
    //         }
    //         const resolvedPickRate = Number(pickRate);

    //         parsedEntries.push({
    //             id: Date.now() + index + parsedEntries.length,
    //             pieceNumber: pieceNumberValue,
    //             quantity: Number(pieceMeter),
    //             weight: Number(netWeight),
    //             avgWeight: pieceMeter > 0 ? Number((Number(netWeight) / Number(pieceMeter)).toFixed(3)) : 0,
    //             remarks,
    //             cost: resolvedPickRate,
    //             fabricCode: fabricRecord.fabricCode || fabricCodeValue,
    //             fabricDetails: fabricRecord.fabricName ? `${fabricRecord.fabricCode || fabricCodeValue} - ${fabricRecord.fabricQuality || ''}` : (fabricRecord.fabricCode || fabricCodeValue),
    //             quality: fabricRecord.fabricQuality || '',
    //             warehouseId: Number(warehouseRecord.id),
    //             fabricMasterId: fabricRecord.id ? Number(fabricRecord.id) : undefined,
    //             activeFlag: true
    //         });
    //         existingPieceNumbers.add(normalizedPieceNumber);
    //     });

    //     if (validationErrors.length) {
    //         toast.error(validationErrors.join('\n'));
    //         return;
    //     }
    //     if (!parsedEntries.length) {
    //         toast.error('No valid rows found in the uploaded file');
    //         return;
    //     }

    //     const excelQuantity = parsedEntries.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
    //     const quantityReceived = Number(selectedItemForPieces.quantityReceived) || 0;
    //     // if (quantityReceived > 0 && Math.abs(excelQuantity - quantityReceived) > 0.0001) {
    //     //     toast.error(`${excelQuantity} is not match with Received Quantity ${quantityReceived}`);
    //     //     return;
    //     // }

    //     const totalQuantity = [...pieceEntries, ...parsedEntries].reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
    //     const receivedQuantity = quantityReceived;
    //     if (receivedQuantity > 0 && totalQuantity > receivedQuantity + 0.0001) {
    //         toast.error('Imported piece meters exceed the received quantity');
    //         return;
    //     }

    //     setPieceEntries(prev => [...prev, ...parsedEntries]);
    //     toast.success(`Imported ${parsedEntries.length} ${parsedEntries.length === 1 ? 'piece' : 'pieces'}`);
    // };
    const importFabricPiecesFromRows = (rows: Record<string, any>[]) => {
        if (!selectedItemForPieces) {
            toast.error("Please select an item before uploading pieces");
            return;
        }
        const validationErrors: string[] = [];
        const parsedEntries: Partial<PieceEntry>[] = [];

        // Get existing piece numbers from current tableRows only
        const existingPieceNumbers = new Set(
            tableRows
                .map(entry => entry.pieceNumber?.toString().trim().toLowerCase())
                .filter(Boolean) as string[]
        );

        rows.forEach((row, index) => {
            const normalized = normalizeRowKeys(row || {});
            const hasValues = Object.values(normalized).some(value => value !== undefined && value !== null && value !== '');
            if (!hasValues) {
                return;
            }

            // Validate Warehouse Name
            const warehouseName = normalizeCellValue(normalized['warehouse name'] ?? normalized['warehouse']);
            if (!warehouseName) {
                validationErrors.push(`Row ${index + 2}: Warehouse Name is required`);
                return;
            }
            const warehouseRecord = warehouseNameLookup.get(warehouseName.toLowerCase());
            if (!warehouseRecord) {
                validationErrors.push(`Row ${index + 2}: Warehouse "${warehouseName}" not found`);
                return;
            }

            // Validate Fabric Code
            const fabricCodeValue = normalizeCellValue(normalized['fabric code']);
            if (!fabricCodeValue) {
                validationErrors.push(`Row ${index + 2}: Sort No is required`);
                return;
            }

            // Check if fabric code exists in fabricMasterList
            const fabricRecord = fabricMasterByCode.get(fabricCodeValue.toLowerCase());
            if (!fabricRecord) {
                validationErrors.push(`Row ${index + 2}: Sort No "${fabricCodeValue}" not found in Fabric Master List`);
                return;
            }

            // Validate Piece No
            let pieceNumberValue = normalizeCellValue(normalized['piece no'] ?? normalized['piece number']);
            if (!pieceNumberValue) {
                validationErrors.push(`Row ${index + 2}: Piece No is required`);
                return;
            }
            const normalizedPieceNumber = pieceNumberValue.toLowerCase();
            if (existingPieceNumbers.has(normalizedPieceNumber) || parsedEntries.some(entry => entry.pieceNumber?.toLowerCase() === normalizedPieceNumber)) {
                validationErrors.push(`Row ${index + 2}: Piece No "${pieceNumberValue}" already exists`);
                return;
            }

            // Validate Piece Meter
            let pieceMeter = parseNumericCell(normalized['piece meter']);
            if (pieceMeter === null || pieceMeter === undefined) {
                // Try alternative column names
                pieceMeter = parseNumericCell(normalized['piece meter (m)']);
                if (pieceMeter === null || pieceMeter === undefined) {
                    pieceMeter = parseNumericCell(normalized['meter']);
                }
            }
            if (!pieceMeter || pieceMeter <= 0) {
                validationErrors.push(`Row ${index + 2}: Piece Meter must be greater than zero. Found: ${pieceMeter}`);
                return;
            }

            // Validate Net Weight
            let netWeight = parseNumericCell(normalized['net weight'] ?? normalized['net wt']);
            if (netWeight === null || netWeight === undefined) {
                netWeight = parseNumericCell(normalized['weight']);
            }
            if (!netWeight || netWeight <= 0) {
                validationErrors.push(`Row ${index + 2}: Net Weight must be greater than zero. Found: ${netWeight}`);
                return;
            }

            // Validate Pick Rate
            let pickRate = parseNumericCell(normalized['pick rate']);
            if (pickRate === null || pickRate === undefined) {
                pickRate = parseNumericCell(normalized['rate']);
            }
            if (pickRate === null || pickRate === undefined || !Number.isFinite(pickRate)) {
                validationErrors.push(`Row ${index + 2}: Pick Rate is required`);
                return;
            }

            // Remarks is optional
            const remarks = normalizeCellValue(normalized['remarks']);
            if (!remarks) {
                validationErrors.push(`Row ${index + 2}: Remarks is required`);
                return;
            }
            const resolvedPickRate = Number(pickRate);

            // Calculate avg weight
            const avgWeight = pieceMeter > 0 ? Number((Number(netWeight) / Number(pieceMeter)).toFixed(3)) : 0;

            // Get default warehouse if not provided
            const defaultWarehouse = filteredWarehouseData && filteredWarehouseData.length > 0
                ? String(filteredWarehouseData[0]?.id)
                : String(warehouseRecord.id);

            parsedEntries.push({
                id: Date.now() + index + parsedEntries.length,
                pieceNumber: pieceNumberValue,
                quantity: Number(pieceMeter),
                weight: Number(netWeight),
                avgWeight: avgWeight,
                remarks: remarks,
                cost: resolvedPickRate,
                fabricCode: fabricRecord.fabricCode || fabricCodeValue,
                fabricDetails: `${fabricRecord.fabricCode || fabricCodeValue} - ${fabricRecord.fabricQuality || ''}`,
                quality: fabricRecord.fabricQuality || '',
                warehouseId: Number(warehouseRecord.id),
                fabricMasterId: fabricRecord.id ? Number(fabricRecord.id) : undefined,
                activeFlag: true
            });
            existingPieceNumbers.add(normalizedPieceNumber);
        });

        if (validationErrors.length) {
            toast.error(validationErrors.slice(0, 5).join('\n'));
            if (validationErrors.length > 5) {
                toast.info(`And ${validationErrors.length - 5} more errors...`);
            }
            return;
        }

        if (!parsedEntries.length) {
            toast.error('No valid rows found in the uploaded file');
            return;
        }

        // Check if total quantity exceeds received quantity
        const excelQuantity = parsedEntries.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
        const currentQuantity = tableRows.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
        const quantityReceived = Number(selectedItemForPieces.quantityReceived) || 0;
        const totalQuantity = currentQuantity + excelQuantity;

        if (quantityReceived > 0 && totalQuantity > quantityReceived + 0.0001) {
            toast.error(`Total piece meters (${totalQuantity.toFixed(3)}) exceeds received quantity (${quantityReceived})`);
            return;
        }

        // Add the parsed entries to tableRows
        setTableRows(prev => [...prev, ...parsedEntries]);
        toast.success(`Successfully imported ${parsedEntries.length} ${parsedEntries.length === 1 ? 'piece' : 'pieces'}`);
    };

    const handleDownloadTemplate = () => {
        if (!filteredWarehouseData || filteredWarehouseData.length === 0) {
            toast.error('Warehouse data not loaded.');
            return;
        }
        if (!fabricMastersArray.length) {
            toast.error('Fabric master data not loaded.');
            return;
        }
        generateExcelTemplate({
            headers: FABRIC_TEMPLATE_HEADERS,
            fileName: 'jobwork-fabric-piece-template'
        });
    };

    const handleUploadButtonClick = () => {
        if (!selectedItemForPieces) {
            toast.error('Please select an item before uploading pieces');
            return;
        }
        if (!filteredWarehouseData || filteredWarehouseData.length === 0) {
            toast.error('Warehouse data not loaded.');
            return;
        }
        if (!fabricMastersArray.length) {
            toast.error('Fabric master data not loaded.');
            return;
        }
        fileInputRef.current?.click();
    };

    // const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = event.target.files?.[0];
    //     if (!file) {
    //         return;
    //     }
    //     const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    //     if (!EXCEL_ALLOWED_EXTENSIONS.includes(extension)) {
    //         toast.error('Only Excel files (.xls, .xlsx) are supported');
    //         event.target.value = '';
    //         return;
    //     }
    //     try {
    //         setIsImporting(true);
    //         const rows = await readExcelFile<Record<string, any>>(file);
    //         if (!Array.isArray(rows) || rows.length === 0) {
    //             toast.error('No data found in the uploaded file');
    //             return;
    //         }
    //         importFabricPiecesFromRows(rows);
    //     } catch (error) {
    //         toast.error('Failed to process the uploaded file');
    //     } finally {
    //         setIsImporting(false);
    //         if (event.target) {
    //             event.target.value = '';
    //         }
    //     }
    // };
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
            // toast.info('Reading Excel file...');
            const rows = await readExcelFile<Record<string, any>>(file);

            if (!Array.isArray(rows) || rows.length === 0) {
                toast.error('No data found in the uploaded file');
                return;
            }

            // Skip header row if present (check if first row contains headers)
            let dataRows = rows;
            const firstRow = rows[0];
            const isHeaderRow = Object.values(firstRow || {}).some(value =>
                typeof value === 'string' &&
                (value.toLowerCase().includes('warehouse') ||
                    value.toLowerCase().includes('fabric') ||
                    value.toLowerCase().includes('piece'))
            );

            if (isHeaderRow && rows.length > 1) {
                dataRows = rows.slice(1);
                toast.info(`Skipping header row, processing ${dataRows.length} data rows...`);
            }

            importFabricPiecesFromRows(dataRows);
        } catch (error) {
            console.error('Error processing file:', error);
            toast.error('Failed to process the uploaded file. Please check the file format.');
        } finally {
            setIsImporting(false);
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const weavingContractRegistration = register("weavingContractId", { required: "Weaving Contract is required" });
    const { ref: weavingContractRef, onChange: weavingContractOnChange, ...weavingContractRest } = weavingContractRegistration;
    const handleWeavingContractSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        weavingContractOnChange?.(event);
        handleWContactChange(event);
    };

    // const warehouseData = useMemo(() => {
    //     if (Array.isArray(warehouseList)) return warehouseList;
    //     return warehouseList?.data || [];
    // }, [warehouseList]);

    // const filteredWarehouseData = useMemo(() => {
    //     const wcId = Number(weavingContractIdWatch || formData.weavingContractId || 0);
    //     const contract = (weavingContractList || []).find((w: any) => Number(w.id) === wcId) ||
    //         ((getWeavingContractByIdList && Number(getWeavingContractByIdList?.id) === wcId) ? getWeavingContractByIdList : null);
    //     const ids: number[] = [];
    //     if (contract) {
    //         if (Array.isArray((contract as any).warehouseIds)) ids.push(...(contract as any).warehouseIds.map((x: any) => Number(x)));
    //         if ((contract as any).warehouseId) ids.push(Number((contract as any).warehouseId));
    //         const items = (contract as any).items || (contract as any).weavingContractItemDtl || [];
    //         if (Array.isArray(items)) {
    //             items.forEach((it: any) => {
    //                 if (it?.warehouseId) ids.push(Number(it.warehouseId));
    //                 if (Array.isArray(it?.pieceEntries)) {
    //                     it.pieceEntries.forEach((p: any) => { if (p?.warehouseId) ids.push(Number(p.warehouseId)); });
    //                 }
    //             });
    //         }
    //     }
    //     const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    //     if (uniqueIds.length > 0) {
    //         return warehouseData.filter((w: any) => uniqueIds.includes(Number(w.id)));
    //     }
    //     return warehouseData;
    // }, [weavingContractIdWatch, formData.weavingContractId, weavingContractList, getWeavingContractByIdList, warehouseData]);

    // const warehouseNameLookup = useMemo(() => {
    //     const map = new Map<string, any>();
    //     const source = (filteredWarehouseData && filteredWarehouseData.length > 0) ? filteredWarehouseData : warehouseData;
    //     source.forEach((warehouse: any) => {
    //         const name = (warehouse?.warehouseName || warehouse?.name || '')
    //             .toString()
    //             .trim()
    //             .toLowerCase();
    //         if (name) {
    //             map.set(name, warehouse);
    //         }
    //     });
    //     return map;
    // }, [filteredWarehouseData, warehouseData]);
    const warehouseData = useMemo(() => {
        const fabricIds = new Set(fabricWarehouseOptions.map((w) => w.id));
        const all: any[] = Array.isArray(warehouseList) ? warehouseList : (warehouseList?.data || []);
        if (fabricIds.size === 0) return all;
        return all.filter((w: any) => fabricIds.has(w.id));
    }, [warehouseList, fabricWarehouseOptions]);

    const filteredWarehouseData = useMemo(() => {
        const wcId = Number(weavingContractIdWatch || formData.weavingContractId || 0);
        const contract = (weavingContractList || []).find((w: any) => Number(w.id) === wcId) ||
            ((getWeavingContractByIdList && Number(getWeavingContractByIdList?.id) === wcId) ? getWeavingContractByIdList : null);
        const ids: number[] = [];
        if (contract) {
            if (Array.isArray((contract as any).warehouseIds)) ids.push(...(contract as any).warehouseIds.map((x: any) => Number(x)));
            if ((contract as any).warehouseId) ids.push(Number((contract as any).warehouseId));
            const items = (contract as any).items || (contract as any).weavingContractItemDtl || [];
            if (Array.isArray(items)) {
                items.forEach((it: any) => {
                    if (it?.warehouseId) ids.push(Number(it.warehouseId));
                    if (Array.isArray(it?.pieceEntries)) {
                        it.pieceEntries.forEach((p: any) => { if (p?.warehouseId) ids.push(Number(p.warehouseId)); });
                    }
                });
            }
        }
        const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
        if (uniqueIds.length > 0) {
            return warehouseData.filter((w: any) => uniqueIds.includes(Number(w.id)));
        }
        return warehouseData;
    }, [weavingContractIdWatch, formData.weavingContractId, weavingContractList, getWeavingContractByIdList, warehouseData]);

    const warehouseNameLookup = useMemo(() => {
        const map = new Map<string, any>();
        const source = (filteredWarehouseData && filteredWarehouseData.length > 0) ? filteredWarehouseData : warehouseData;
        source.forEach((warehouse: any) => {
            const name = (warehouse?.warehouseName || warehouse?.name || '')
                .toString()
                .trim()
                .toLowerCase();
            if (name) {
                map.set(name, warehouse);
            }
        });
        return map;
    }, [filteredWarehouseData, warehouseData]);

    useEffect(() => {
        if (jobworkFabricReceiveDtl) {
            setIsEditMode(true);

            const editDate = jobworkFabricReceiveDtl.jobFabricReceiveDate.split('T')[0];

            reset({
                vendorId: jobworkFabricReceiveDtl.vendorId.toString(),
                weavingContractId: jobworkFabricReceiveDtl.weavingContractId.toString(),
                jobFabricReceiveDate: editDate,
                remarks: jobworkFabricReceiveDtl.remarks,
                receiveNo: jobworkFabricReceiveDtl.receiveNo || '',
                dcDate: jobworkFabricReceiveDtl.jobFabricReceiveDate.split('T')[0],
                dcNumber: jobworkFabricReceiveDtl.dcNumber
            });

            const selectedWeavingContract = weavingContractList.find((wc: any) => wc.id === jobworkFabricReceiveDtl.weavingContractId);
            const weavingContractNo = jobworkFabricReceiveDtl.weavingContractNo || selectedWeavingContract?.weavingContractNo || selectedWeavingContract?.contractNo || '';

            setFormData({
                id: jobworkFabricReceiveDtl.id,
                weavingContractId: jobworkFabricReceiveDtl.weavingContractId,
                weavingContractNo: weavingContractNo,
                vendorId: jobworkFabricReceiveDtl.vendorId,
                jobFabricReceiveDate: jobworkFabricReceiveDtl.jobFabricReceiveDate,
                dcNumber: jobworkFabricReceiveDtl.dcNumber,
                dcDate: jobworkFabricReceiveDtl.dcDate,
                remarks: jobworkFabricReceiveDtl.remarks,
                receiveNo: jobworkFabricReceiveDtl.receiveNo || '',
                companyId: jobworkFabricReceiveDtl.companyId ? String(jobworkFabricReceiveDtl.companyId) : (selectedCompany ? String(selectedCompany) : undefined),
                activeFlag: jobworkFabricReceiveDtl.activeFlag,
                fabricCode: jobworkFabricReceiveDtl.fabricCode,
                fabricDetails: jobworkFabricReceiveDtl.fabricDetails,
                quality: jobworkFabricReceiveDtl.quality,
                jobworkFabricReceiveItemsDtl: jobworkFabricReceiveDtl.items || jobworkFabricReceiveDtl.jobworkFabricReceiveItemsDtl || []
            });

            if (jobworkFabricReceiveDtl.weavingContractId) {
                dispatch(getWeavingContractById(jobworkFabricReceiveDtl.weavingContractId))
                    .then((result) => {
                        const weavingContract = result?.payload;
                        if (weavingContract?.items) {
                            const savedItems = jobworkFabricReceiveDtl.jobworkFabricReceiveItemsDtl || jobworkFabricReceiveDtl.items || [];
                            const savedItemsMap = new Map<number, any>(
                                savedItems.map((saved: any) => [Number(saved.weavingContractItemId ?? saved.id), saved])
                            );

                            const itemsWithDetails = weavingContract.items.map((item: any) => {
                                const fabricId = item.fabricCodeId || item.fabricId;
                                const fabric = fabricMasterList.find((f: any) => f.id === parseInt(fabricId || '0'));
                                const code = fabric?.fabricCode || item.fabricCode || item.quality || 'N/A';
                                const quality = fabric?.fabricQuality || item.fabricQualityId || item.quality || 'N/A';
                                const details = `${code} - ${quality}`;
                                const saved = savedItemsMap.get(Number(item.id));
                                return {
                                    ...item,
                                    fabricCode: saved?.fabricCode || code,
                                    fabricDetails: saved?.fabricDetails || details,
                                    quality: saved?.quality || quality,
                                    price: saved?.price ?? getPickRateFromContractItems(jobworkFabricReceiveDtl.weavingContractId, item) ?? item?.pickCost ?? item?.price ?? 0,
                                    quantity: item.quantity,
                                    quantityReceived: saved?.quantityReceived ?? 0
                                };
                            });

                            setFilteredItems(itemsWithDetails);

                            if (savedItems.length > 0) {
                                const primaryItem = savedItems[0];
                                const contractItemId = primaryItem.weavingContractItemId ?? primaryItem.id;
                                const matchedContractItem = itemsWithDetails.find((item: any) => Number(item.id) === Number(contractItemId));
                                const selectedPayload = {
                                    ...primaryItem,
                                    id: contractItemId,
                                    quantity: matchedContractItem?.quantity || 0,
                                    quantityReceived: primaryItem.quantityReceived,
                                    price: primaryItem.price ?? matchedContractItem?.price ?? getPickRateFromContractItems(jobworkFabricReceiveDtl.weavingContractId, primaryItem) ?? 0,
                                    weavingContractId: jobworkFabricReceiveDtl.weavingContractId,
                                    vendorId: jobworkFabricReceiveDtl.vendorId,
                                    jobFabricReceiveDate: jobworkFabricReceiveDtl.jobFabricReceiveDate,
                                    weavingContractItemId: contractItemId,
                                    remarks: jobworkFabricReceiveDtl.remarks,
                                    fabricCode: primaryItem.fabricCode,
                                    fabricDetails: primaryItem.fabricDetails,
                                    dcNumber: jobworkFabricReceiveDtl.dcNumber,
                                    dcDate: jobworkFabricReceiveDtl.dcDate,
                                    quality: primaryItem.quality,
                                    activeFlag: true,
                                    jobworkFabricReceiveItemId: primaryItem.id
                                };

                                setSelectedItems([selectedPayload]);
                                setSelectedItemForPieces({
                                    ...selectedPayload,
                                    quantity: matchedContractItem?.quantity || 0
                                });

                                // Load existing piece entries into tableRows for editing
                                const existingPieces = (primaryItem.pieceEntries || []).map((p: any, idx: number) => {
                                    const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
                                    const codeForLookup = p.fabricCode || primaryItem.fabricCode;
                                    const fmMatchById = p.fabricMasterId
                                        ? fmArr.find((f: any) => Number(f.id) === Number(p.fabricMasterId))
                                        : undefined;
                                    const fmMatch = fmMatchById || fmArr.find((f: any) => String(f.fabricCode) === String(codeForLookup));
                                    const resolvedCode = fmMatch?.fabricCode || codeForLookup;
                                    const resolvedQuality = p.quality || fmMatch?.fabricQuality || primaryItem.quality || '';
                                    const resolvedDetails = p.fabricDetails
                                        || (fmMatch ? `${fmMatch.fabricCode || ''} - ${fmMatch.fabricQuality || ''}` : '')
                                        || primaryItem.fabricDetails
                                        || '';

                                    // Get warehouse name for display
                                    const warehouse = warehouseData.find((w: any) => w.id === p.warehouseId);

                                    return {
                                        id: p.id,
                                        pieceNumber: p.pieceNumber,
                                        quantity: p.quantity,
                                        weight: p.weight,
                                        avgWeight: p.quantity > 0 ? p.weight / p.quantity : 0,
                                        remarks: p.remarks || '',
                                        cost: p.cost,
                                        fabricCode: resolvedCode,
                                        fabricDetails: resolvedDetails,
                                        quality: resolvedQuality,
                                        warehouseId: p.warehouseId,
                                        fabricMasterId: p.fabricMasterId ?? (fmMatch?.id ? Number(fmMatch.id) : undefined),
                                        isInspected: p.isInspected
                                    };
                                });

                                // Set the tableRows with existing pieces for editing
                                setTableRows(existingPieces);
                                setNumberOfPieces(String(existingPieces.length));
                                setPieceEntries(existingPieces); // Also keep pieceEntries for backward compatibility
                            } else {
                                setSelectedItems([]);
                                setSelectedItemForPieces(null);
                            }
                        } else {
                            setFilteredItems([]);
                            setSelectedItems([]);
                            setSelectedItemForPieces(null);
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching weaving contract:", error);
                        toast.error("Error loading weaving contract details");
                    });
            }
        }
    }, [jobworkFabricReceiveDtl, reset, dispatch, fabricMasterList, warehouseData]);

    const fabricMasterOptions = useMemo<CommonSearchableSelectOption[]>(() =>
        fabricMastersArray
            .map((f: any) => {
                const id = f?.id;
                const code = f?.fabricCode || f?.code;
                if (!id || !code) return null;
                return { id, value: String(id), label: code, activeFlag: f?.activeFlag ?? true };
            })
            .filter(Boolean) as CommonSearchableSelectOption[]
        , [fabricMastersArray]);

    // const warehouseOptions = useMemo<CommonSearchableSelectOption[]>(() => {
    //     const source = (filteredWarehouseData && filteredWarehouseData.length > 0) ? filteredWarehouseData : warehouseData;
    //     return source
    //         .map((warehouse: any) => {
    //             const id = warehouse?.id ?? warehouse?.warehouseId;
    //             const label = warehouse?.warehouseName || warehouse?.name;
    //             if (!id || !label) {
    //                 return null;
    //             }
    //             return {
    //                 id,
    //                 value: String(id),
    //                 label,
    //                 activeFlag: warehouse?.activeFlag ?? true
    //             };
    //         })
    //         .filter(Boolean) as CommonSearchableSelectOption[];
    // }, [filteredWarehouseData, warehouseData]);
    const warehouseOptions = useMemo<CommonSearchableSelectOption[]>(() => {
        const source = (filteredWarehouseData && filteredWarehouseData.length > 0) ? filteredWarehouseData : warehouseData;
        return source
            .map((warehouse: any) => {
                const id = warehouse?.id ?? warehouse?.warehouseId;
                const label = warehouse?.warehouseName || warehouse?.name;
                if (!id || !label) {
                    return null;
                }
                return {
                    id,
                    value: String(id),
                    label,
                    activeFlag: warehouse?.activeFlag ?? true
                };
            })
            .filter(Boolean) as CommonSearchableSelectOption[];
    }, [filteredWarehouseData, warehouseData]);

    // const getWarehousesForFabric = useMemo(() => {
    //     const wcId = Number(weavingContractIdWatch || formData.weavingContractId || 0);
    //     const contract = (weavingContractList || []).find((w: any) => Number(w.id) === wcId) ||
    //         ((getWeavingContractByIdList && Number((getWeavingContractByIdList as any)?.id) === wcId) ? getWeavingContractByIdList : null);

    //     const map = new Map<string, number[]>();
    //     if (contract) {
    //         const items = (contract as any).items || (contract as any).weavingContractItemDtl || [];
    //         if (Array.isArray(items)) {
    //             items.forEach((it: any) => {
    //                 const fabricId = it.fabricCodeId || it.fabricId;
    //                 const fabric = fabricMasterList.find((f: any) => f.id === parseInt(fabricId || '0'));
    //                 const code = String(fabric?.fabricCode || it.fabricCode || it.quality || '');
    //                 if (!code) return;
    //                 const ids: number[] = [];
    //                 if (it?.warehouseId) ids.push(Number(it.warehouseId));
    //                 if (Array.isArray(it?.pieceEntries)) {
    //                     it.pieceEntries.forEach((p: any) => { if (p?.warehouseId) ids.push(Number(p.warehouseId)); });
    //                 }
    //                 const prev = map.get(code) || [];
    //                 map.set(code, Array.from(new Set([...prev, ...ids])));
    //             });
    //         }
    //     }

    //     return (code?: string) => {
    //         if (!code) return warehouseData;
    //         const ids = map.get(String(code)) || [];
    //         return ids.length ? warehouseData.filter((w: any) => ids.includes(Number(w.id))) : warehouseData;
    //     };
    // }, [weavingContractIdWatch, formData.weavingContractId, weavingContractList, getWeavingContractByIdList, fabricMasterList, warehouseData]);

    const getWarehousesForFabric = useMemo(() => {
        const wcId = Number(weavingContractIdWatch || formData.weavingContractId || 0);
        const contract = (weavingContractList || []).find((w: any) => Number(w.id) === wcId) ||
            ((getWeavingContractByIdList && Number((getWeavingContractByIdList as any)?.id) === wcId) ? getWeavingContractByIdList : null);

        const map = new Map<string, number[]>();
        if (contract) {
            const items = (contract as any).items || (contract as any).weavingContractItemDtl || [];
            if (Array.isArray(items)) {
                items.forEach((it: any) => {
                    const fabricId = it.fabricCodeId || it.fabricId;
                    const fabric = fabricMasterList.find((f: any) => f.id === parseInt(fabricId || '0'));
                    const code = String(fabric?.fabricCode || it.fabricCode || it.quality || '');
                    if (!code) return;
                    const ids: number[] = [];
                    if (it?.warehouseId) ids.push(Number(it.warehouseId));
                    if (Array.isArray(it?.pieceEntries)) {
                        it.pieceEntries.forEach((p: any) => { if (p?.warehouseId) ids.push(Number(p.warehouseId)); });
                    }
                    const prev = map.get(code) || [];
                    map.set(code, Array.from(new Set([...prev, ...ids])));
                });
            }
        }

        return (code?: string) => {
            if (!code) return warehouseData;
            const ids = map.get(String(code)) || [];
            return ids.length ? warehouseData.filter((w: any) => ids.includes(Number(w.id))) : warehouseData;
        };
    }, [weavingContractIdWatch, formData.weavingContractId, weavingContractList, getWeavingContractByIdList, fabricMasterList, warehouseData]);

    const handleSave = async (data: JobworkFabricReceiveData) => {
        const isEditMode = Boolean(jobworkFabricReceiveDtl?.id);
        let receiveNo = data.receiveNo || jobworkFabricReceiveDtl?.receiveNo || "";

        if (!jobworkFabricReceiveDtl?.id && !receiveNo) {
            try {
                const docResponse = await documentNumberService.generateDocumentNumber({
                    screenName: "Jobwork Fabric Receive"
                });
                receiveNo = docResponse.documentNumber;
            } catch (error) {
                console.warn("Failed to generate document number:", error);
            }
        }
        isSavingRef.current = true;

        if (!selectedItemForPieces) return;

        if (tableRows.length === 0) {
            toast.error("Please add at least one piece entry");
            return;
        }

        // Validation: Check for empty and duplicate piece numbers
        const validRows = tableRows.filter(row => row.quantity && row.quantity > 0 && row.weight && row.weight >= 0);
        if (validRows.length !== tableRows.length) {
            toast.error("Please ensure all rows have valid Piece Meter and Net Weight");
            return;
        }

        const trimmedPieceNumbers = tableRows.map(row => (row.pieceNumber || '').trim());
        const emptyPieceNo = trimmedPieceNumbers.some(no => !no);
        if (emptyPieceNo) {
            toast.error("All piece entries must have a Piece No");
            return;
        }

        const pieceNumberPattern = /^[a-zA-Z0-9-]+$/;
        const invalidPieceNo = trimmedPieceNumbers.some(no => no && !pieceNumberPattern.test(no));
        if (invalidPieceNo) {
            toast.error("Piece No must contain only letters, numbers, or hyphens.");
            return;
        }

        const normalizedPieceNumbers = trimmedPieceNumbers.map(no => no.toLowerCase());
        const duplicatePieceNo = normalizedPieceNumbers.some((no, index) => normalizedPieceNumbers.indexOf(no) !== index);
        if (duplicatePieceNo) {
            toast.error("Duplicate Piece No found. Each piece must have a unique number.");
            return;
        }

        const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        if (!storedCompanyId) {
            toast.error("Please select a company before submitting");
            return;
        }

        let dcNumber = formData.dcNumber || "";
        if (!isEditMode && !dcNumber) {
            try {
                const docResponse = await documentNumberService.generateDocumentNumber({
                    screenName: "Jobwork Fabric Receive"
                });
                dcNumber = docResponse.documentNumber;
            } catch (error) {
                console.warn("Failed to generate document number:", error);
            }
        }

        const totalPieceQuantity = tableRows.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
        if (totalPieceQuantity !== Number(selectedItemForPieces.quantityReceived)) {
            toast.error(`Total piece quantity (${totalPieceQuantity}) must equal received quantity (${selectedItemForPieces.quantityReceived})`);
            return;
        }

        const fabricCode = selectedItemForPieces.fabricCode || '';
        const fabricDetails = selectedItemForPieces.fabricDetails || '';
        const quality = selectedItemForPieces.quality || '';
        const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
        const fm = fmArr.find((f: any) => String(f.fabricCode) === String(fabricCode));
        const fabricMasterId = fm?.id ? Number(fm.id) : undefined;

        const selectedWeavingContract = weavingContractList.find((wc: any) => wc.id === formData.weavingContractId);
        const weavingContractNo = selectedWeavingContract?.weavingContractNo || selectedWeavingContract?.contractNo || '';

        // Prepare piece entries from tableRows - preserve existing IDs for edit mode
        const pieceEntriesWithIds = tableRows.map((entry, idx) => {
            const codeForLookup = entry.fabricCode || fabricCode;
            const fmArrLocal = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
            const fmLocal = fmArrLocal.find((f: any) => String(f.fabricCode) === String(codeForLookup));
            const resolvedFmId = entry.fabricMasterId ?? (fmLocal?.id ? Number(fmLocal.id) : fabricMasterId);

            return {
                id: entry.id || undefined, // Preserve existing ID for edit mode
                pieceNumber: entry.pieceNumber,
                quantity: entry.quantity,
                weight: entry.weight,
                cost: entry.cost,
                remarks: entry.remarks,
                warehouseId: entry.warehouseId ? Number(entry.warehouseId) : 1,
                quality: entry.quality || quality,
                fabricMasterId: resolvedFmId,
                fabricId: resolvedFmId,
                fabricCode: entry.fabricCode || fabricCode,
                fabricDetails: entry.fabricDetails || fabricDetails,
                avgWeight: entry.avgWeight,
                activeFlag: true
            };
        });

        const payload: any = {
            ...formData,
            id: formData.id,
            dcNumber: dcNumber,
            receiveNo: receiveNo,
            weavingContractNo: weavingContractNo,
            fabricCode: fabricCode,
            fabricDetails: fabricDetails,
            quality: quality,
            companyId: parseInt(storedCompanyId),
            jobworkFabricReceiveItemsDtl: [{
                id: selectedItemForPieces.jobworkFabricReceiveItemId || selectedItemForPieces.id,
                quantityReceived: selectedItemForPieces.quantityReceived,
                price: selectedItemForPieces.price,
                activeFlag: true,
                weavingContractItemId: selectedItemForPieces.weavingContractItemId,
                quality: quality,
                fabricCode: fabricCode,
                fabricDetails: fabricDetails,
                pieceEntries: pieceEntriesWithIds
            }]
        };

        console.log("job-work-fabric data", payload);

        try {
            setIsLoading(true);
            if (isEditMode && formData.id) {
                await dispatch(updateJobworkFabricReceive(payload)).unwrap();
                // toast.success("Jobwork Fabric Receive updated successfully");
                
                // Check if user came from order-entry-management and redirect back if needed
                const source = location.state?.source;
                if (source === 'order-entry-management') {
                    navigate("/transaction/order-entry-management", {
                        state: {
                            source: 'order-entry-management',
                            refreshData: true,
                            activeTab: location.state?.activeTab,
                            expandedRowId: location.state?.expandedRowId,
                            salesOrderId: location.state?.salesOrderId,
                            flowType: location.state?.flowType,
                            selectedHyperlink: location.state?.selectedHyperlink
                        }
                    });
                } else {
                    navigate("/transaction/jobwork-fabric-receive-details");
                }
            } else {
                await dispatch(createJobworkFabricReceive(payload)).unwrap();
                documentNumberService.clearMemoryCache("Jobwork Fabric Receive");
                // toast.success("Jobwork Fabric Receive created successfully");
                
                // Check if user came from order-entry-management and redirect back if needed
                const source = location.state?.source;
                if (source === 'order-entry-management') {
                    navigate("/transaction/order-entry-management", {
                        state: {
                            source: 'order-entry-management',
                            refreshData: true,
                            activeTab: location.state?.activeTab,
                            expandedRowId: location.state?.expandedRowId,
                            salesOrderId: location.state?.salesOrderId,
                            flowType: location.state?.flowType,
                            selectedHyperlink: location.state?.selectedHyperlink
                        }
                    });
                } else {
                    navigate("/transaction/jobwork-fabric-receive-details");
                }
            }

            setShowPieceDetails(false);
            setTableRows([]);
            setPieceEntries([]);
            setSelectedItems([]);
            reset({ jobFabricReceiveDate: defaultDate });
        } catch (error) {
            console.error('Failed to save record:', error);
            toast.error("Failed to save record");
        } finally {
            setIsLoading(false);
        }
    };
    // const handleSave = async (data: JobworkFabricReceiveData) => {
    //     const isEditMode = Boolean(jobworkFabricReceiveDtl?.id);
    //     let receiveNo = data.receiveNo || jobworkFabricReceiveDtl?.receiveNo || "";
    //     if (!jobworkFabricReceiveDtl?.id && !receiveNo) {
    //         try {
    //             const docResponse = await documentNumberService.generateDocumentNumber({
    //                 screenName: "Jobwork Fabric Receive"
    //             });
    //             receiveNo = docResponse.documentNumber;
    //         } catch (error) {
    //             console.warn("Failed to generate document number:", error);
    //         }
    //     }
    //     isSavingRef.current = true;

    //     if (!selectedItemForPieces) return;

    //     if (pieceEntries.length === 0) {
    //         toast.error("Please add at least one piece entry");
    //         return;
    //     }

    //     // Validation: Check for empty and duplicate piece numbers
    //     const trimmedPieceNumbers = pieceEntries.map(p => (p.pieceNumber || '').trim());

    //     const emptyPieceNo = trimmedPieceNumbers.some(no => !no);
    //     if (emptyPieceNo) {
    //         toast.error("All piece entries must have a Piece No");
    //         return;
    //     }

    //     const pieceNumberPattern = /^[a-zA-Z0-9-]+$/;
    //     const invalidPieceNo = trimmedPieceNumbers.some(no => no && !pieceNumberPattern.test(no));
    //     if (invalidPieceNo) {
    //         toast.error("Piece No must contain only letters, numbers, or hyphens.");
    //         return;
    //     }

    //     const normalizedPieceNumbers = trimmedPieceNumbers.map(no => no.toLowerCase());
    //     const duplicatePieceNo = normalizedPieceNumbers.some((no, index) => normalizedPieceNumbers.indexOf(no) !== index);
    //     if (duplicatePieceNo) {
    //         toast.error("Duplicate Piece No found. Each piece must have a unique number.");
    //         return;
    //     }

    //     const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    //     if (!storedCompanyId) {
    //         toast.error("Please select a company before submitting");
    //         return;
    //     }

    //     let dcNumber = formData.dcNumber || "";
    //     if (!isEditMode && !dcNumber) {
    //         try {
    //             const docResponse = await documentNumberService.generateDocumentNumber({
    //                 screenName: "Jobwork Fabric Receive"
    //             });
    //             dcNumber = docResponse.documentNumber;
    //         } catch (error) {
    //             console.warn("Failed to generate document number:", error);
    //         }
    //     }

    //     const totalPieceQuantity = pieceEntries.reduce((sum, entry) => sum + entry.quantity, 0);
    //     if (totalPieceQuantity !== Number(selectedItemForPieces.quantityReceived)) {
    //         toast.error(`Total piece quantity (${totalPieceQuantity}) must equal received quantity (${selectedItemForPieces.quantityReceived})`);
    //         return;
    //     }

    //     const fabricCode = selectedItemForPieces.fabricCode || '';
    //     const fabricDetails = selectedItemForPieces.fabricDetails || '';
    //     const quality = selectedItemForPieces.quality || '';
    //     const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
    //     const fm = fmArr.find((f: any) => String(f.fabricCode) === String(fabricCode));
    //     const fabricMasterId = fm?.id ? Number(fm.id) : undefined;

    //     const selectedWeavingContract = weavingContractList.find((wc: any) => wc.id === formData.weavingContractId);
    //     const weavingContractNo = selectedWeavingContract?.weavingContractNo || selectedWeavingContract?.contractNo || '';

    //     // Prepare piece entries with IDs
    //     const pieceEntriesWithIds = pieceEntries.map(entry => {
    //         const codeForLookup = entry.fabricCode || fabricCode;
    //         const fmArrLocal = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
    //         const fmLocal = fmArrLocal.find((f: any) => String(f.fabricCode) === String(codeForLookup));
    //         const resolvedFmId = entry.fabricMasterId ?? (fmLocal?.id ? Number(fmLocal.id) : fabricMasterId);

    //         return {
    //             id: entry.id || undefined, // ✅ CRITICAL: Include piece ID
    //             pieceNumber: entry.pieceNumber,
    //             quantity: entry.quantity,
    //             weight: entry.weight,
    //             cost: entry.cost,
    //             remarks: entry.remarks,
    //             warehouseId: entry.warehouseId ? Number(entry.warehouseId) : 1,
    //             quality: entry.quality || quality,
    //             fabricMasterId: resolvedFmId,
    //             fabricId: resolvedFmId,
    //             fabricCode: entry.fabricCode || fabricCode,
    //             fabricDetails: entry.fabricDetails || fabricDetails,
    //             avgWeight: entry.avgWeight,
    //             activeFlag: true
    //         };
    //     });

    //     const payload: any = {
    //         ...formData,
    //         id: formData.id, // Ensure ID is included for update
    //         dcNumber: dcNumber,
    //         receiveNo: receiveNo,
    //         weavingContractNo: weavingContractNo,
    //         fabricCode: fabricCode,
    //         fabricDetails: fabricDetails,
    //         quality: quality,
    //         companyId: parseInt(storedCompanyId),
    //         jobworkFabricReceiveItemsDtl: [{
    //             id: selectedItemForPieces.jobworkFabricReceiveItemId || selectedItemForPieces.id, // Use the correct item ID
    //             quantityReceived: selectedItemForPieces.quantityReceived,
    //             price: selectedItemForPieces.price,
    //             activeFlag: true,
    //             weavingContractItemId: selectedItemForPieces.weavingContractItemId,
    //             quality: quality,
    //             fabricCode: fabricCode,
    //             fabricDetails: fabricDetails,
    //             pieceEntries: pieceEntriesWithIds
    //         }]
    //     };

    //     console.log("job-work-fabric data", payload);

    //     try {
    //         setIsLoading(true);
    //         if (isEditMode && formData.id) {
    //             // Send the complete payload (includes id and companyId)
    //             await dispatch(updateJobworkFabricReceive(payload)).unwrap();
    //             navigate("/transaction/jobwork-fabric-receive-details");
    //         } else {
    //             await dispatch(createJobworkFabricReceive(payload)).unwrap();
    //             documentNumberService.clearMemoryCache("Jobwork Fabric Receive");
    //             // documentNumberService.commitDocumentNumber('Jobwork Fabric Receive', receiveNoValue);
    //             navigate("/transaction/jobwork-fabric-receive-details");
    //         }

    //         setShowPieceDetails(false);
    //         setPieceEntries([]);
    //         setSelectedItems([]);
    //         reset({ jobFabricReceiveDate: defaultDate });
    //     } catch (error) {
    //         console.error('Failed to save record:', error);
    //         toast.error("Failed to save record");
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleBackToForm = () => {
        setShowPieceDetails(false);
    };


    const [tableRows, setTableRows] = useState<Partial<PieceEntry>[]>([]);

    // Initialize default row with fabric code from contract details
    // useEffect(() => {
    //     if (selectedItemForPieces && filteredWarehouseData.length > 0 && tableRows.length === 0) {
    //         const defaultWarehouse = filteredWarehouseData && filteredWarehouseData.length > 0
    //             ? String(filteredWarehouseData[0]?.id)
    //             : '';

    //         const defaultFabricCode = selectedItemForPieces.fabricCode || '';
    //         const defaultFabricDetails = selectedItemForPieces.fabricDetails || '';
    //         const defaultQuality = selectedItemForPieces.quality || '';

    //         // Find fabric master ID from the default fabric code
    //         const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
    //         const defaultFabricMaster = fmArr.find((f: any) => String(f.fabricCode) === String(defaultFabricCode));

    //         setTableRows([{
    //             id: Date.now(),
    //             pieceNumber: '',
    //             quantity: 0,
    //             weight: 0,
    //             cost: Number(selectedItemForPieces?.price) || 0,
    //             remarks: '',
    //             fabricMasterId: defaultFabricMaster?.id ? Number(defaultFabricMaster.id) : undefined,
    //             warehouseId: defaultWarehouse,
    //             fabricCode: defaultFabricCode,
    //             fabricDetails: defaultFabricDetails,
    //             quality: defaultQuality,
    //             avgWeight: 0
    //         }]);
    //         setNumberOfPieces('1');
    //     }
    // }, [selectedItemForPieces, filteredWarehouseData, fabricMasterList]);

    useEffect(() => {
        setNumberOfPieces(String(tableRows.length));
    }, [tableRows.length]);

    // Function to handle Add Pieces button click
    const handleAddPiecesClick = () => {
        const count = parseInt(numberOfPieces || '0', 10);
        if (isNaN(count) || count <= 0) {
            toast.warning("Please enter a valid number of pieces");
            return;
        }

        // const defaultWarehouse = filteredWarehouseData && filteredWarehouseData.length > 0
        //     ? String(filteredWarehouseData[0]?.id)
        //     : '';

        const defaultWarehouse = defaultFabricWarehouseId
            || (filteredWarehouseData && filteredWarehouseData.length > 0 ? String(filteredWarehouseData[0]?.id) : '');

        const defaultPickRate = Number(selectedItemForPieces?.price) || 0;
        const defaultFabricCode = selectedItemForPieces?.fabricCode || '';
        const defaultFabricDetails = selectedItemForPieces?.fabricDetails || '';
        const defaultQuality = selectedItemForPieces?.quality || '';

        const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
        const defaultFabricMaster = fmArr.find((f: any) => String(f.fabricCode) === String(defaultFabricCode));

        // Create exactly 'count' number of new rows
        const newRows: Partial<PieceEntry>[] = [];
        for (let i = 0; i < count; i++) {
            newRows.push({
                id: Date.now() + i,
                pieceNumber: '',
                quantity: 0,
                weight: 0,
                cost: defaultPickRate,
                remarks: '',
                fabricMasterId: defaultFabricMaster?.id ? Number(defaultFabricMaster.id) : undefined,
                warehouseId: defaultWarehouse,
                fabricCode: defaultFabricCode,
                fabricDetails: defaultFabricDetails,
                quality: defaultQuality,
                avgWeight: 0
            });
        }

        // Replace existing rows with new rows (or use setTableRows(prev => [...prev, ...newRows]) if you want to append)
        setTableRows(newRows);
        setNumberOfPieces(String(count));
    };
    // Function to add a single row (for + button)
    // const handleAddSingleRow = () => {
    //     const defaultWarehouse = filteredWarehouseData && filteredWarehouseData.length > 0
    //         ? String(filteredWarehouseData[0]?.id)
    //         : '';

    //     const defaultPickRate = Number(selectedItemForPieces?.price) || 0;
    //     const defaultFabricCode = selectedItemForPieces?.fabricCode || '';
    //     const defaultFabricDetails = selectedItemForPieces?.fabricDetails || '';
    //     const defaultQuality = selectedItemForPieces?.quality || '';

    //     const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
    //     const defaultFabricMaster = fmArr.find((f: any) => String(f.fabricCode) === String(defaultFabricCode));

    //     setTableRows(prev => [...prev, {
    //         id: Date.now(),
    //         pieceNumber: '',
    //         quantity: 0,
    //         weight: 0,
    //         cost: defaultPickRate,
    //         remarks: '',
    //         fabricMasterId: defaultFabricMaster?.id ? Number(defaultFabricMaster.id) : undefined,
    //         warehouseId: defaultWarehouse,
    //         fabricCode: defaultFabricCode,
    //         fabricDetails: defaultFabricDetails,
    //         quality: defaultQuality,
    //         avgWeight: 0
    //     }]);
    // };
    // Function to add a single row (for + button)
    const handleAddSingleRow = () => {
        const defaultWarehouse = defaultFabricWarehouseId || (filteredWarehouseData && filteredWarehouseData.length > 0
            ? String(filteredWarehouseData[0]?.id)
            : '');

        const defaultPickRate = Number(selectedItemForPieces?.price) || 0;
        const defaultFabricCode = selectedItemForPieces?.fabricCode || '';
        const defaultFabricDetails = selectedItemForPieces?.fabricDetails || '';
        const defaultQuality = selectedItemForPieces?.quality || '';

        const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
        const defaultFabricMaster = fmArr.find((f: any) => String(f.fabricCode) === String(defaultFabricCode));

        setTableRows(prev => [...prev, {
            id: Date.now(),
            pieceNumber: '',
            quantity: 0,
            weight: 0,
            cost: defaultPickRate,
            remarks: '',
            fabricMasterId: defaultFabricMaster?.id ? Number(defaultFabricMaster.id) : undefined,
            warehouseId: defaultWarehouse,
            fabricCode: defaultFabricCode,
            fabricDetails: defaultFabricDetails,
            quality: defaultQuality,
            avgWeight: 0
        }]);
    };

    // Function to remove a row
    const handleRemoveRow = (index: number) => {
        setTableRows(prev => prev.filter((_, i) => i !== index));
    };

    // Function to update a cell in the table
    const updateTableCell = (index: number, field: keyof PieceEntry, value: any) => {
        setTableRows(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            // Auto-calculate avg weight
            if (field === 'quantity' || field === 'weight') {
                const quantity = field === 'quantity' ? Number(value) : Number(updated[index].quantity || 0);
                const weight = field === 'weight' ? Number(value) : Number(updated[index].weight || 0);
                if (quantity > 0) {
                    updated[index].avgWeight = weight / quantity;
                } else {
                    updated[index].avgWeight = 0;
                }
            }

            return updated;
        });
    };

    // Updated handleAddLot function to use tableRows
    const handleAddLot = () => {
        const validEntries = tableRows.filter(e => e.quantity && e.quantity > 0 && e.weight && e.weight >= 0 && e.pieceNumber);
        if (!validEntries.length) {
            toast.warning("Please enter valid piece numbers, quantities and weights for all pieces");
            return;
        }

        // Check for duplicate piece numbers
        const pieceNumbers = validEntries.map(e => e.pieceNumber?.trim().toLowerCase());
        const hasDuplicate = pieceNumbers.some((no, idx) => pieceNumbers.indexOf(no) !== idx);
        if (hasDuplicate) {
            toast.error("Duplicate Piece Numbers found. Please ensure all piece numbers are unique.");
            return;
        }

        const entriesToAdd: PieceEntry[] = validEntries.map((entry, i) => {
            const codeForLookup = entry.fabricCode || selectedItemForPieces?.fabricCode;
            const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
            const fmMatch = fmArr.find((f: any) => String(f.fabricCode) === String(codeForLookup));
            const computedFmId = entry.fabricMasterId ?? (fmMatch?.id ? Number(fmMatch.id) : undefined);
            return {
                id: editingPieceId || pieceEntries.length + i + 1,
                pieceNumber: entry.pieceNumber || '',
                quantity: entry.quantity || 0,
                weight: entry.weight || 0,
                avgWeight: (entry.quantity || 0) > 0 ? (entry.weight || 0) / (entry.quantity || 0) : 0,
                remarks: entry.remarks || '',
                cost: entry.cost || 0,
                fabricCode: codeForLookup,
                fabricDetails: entry.fabricDetails || selectedItemForPieces?.fabricDetails,
                quality: entry.quality || selectedItemForPieces?.quality,
                warehouseId: entry.warehouseId ? Number(entry.warehouseId) : undefined,
                fabricMasterId: computedFmId,
                activeFlag: true
            };
        });

        if (editingPieceId) {
            // Replace the edited entry
            setPieceEntries(prev => prev.map(p => p.id === editingPieceId ? entriesToAdd[0] : p));
            setEditingPieceId(null);
        } else {
            setPieceEntries([...pieceEntries, ...entriesToAdd]);
        }
        setTableRows([]); // Clear the table rows
    };

    // Updated summaryData to group by fabricCode
    const summaryData = useMemo(() => {
        const fmArr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);

        const groups: { [key: string]: any } = tableRows.reduce((acc: { [key: string]: any }, entry) => {
            // Skip rows with no fabric code or invalid data
            if (!entry.fabricCode && !entry.fabricMasterId) return acc;

            const fm = fmArr.find((f: any) => String(f.id) === String(entry.fabricMasterId));
            const resolvedCode = entry.fabricCode || fm?.fabricCode || '';
            const resolvedDetails = entry.fabricDetails || (fm ? `${fm.fabricCode} - ${fm.fabricQuality ?? ''}` : '');

            if (!resolvedCode) return acc;

            const key = resolvedCode;

            if (!acc[key]) {
                acc[key] = {
                    fabricCode: resolvedCode,
                    fabricDetails: resolvedDetails,
                    totalPieces: 0,
                    totalPieceMeters: 0,
                    totalNetWeight: 0,
                    sumOfAvgWeights: 0,
                    pickRate: entry.cost || 0
                };
            }

            acc[key].totalPieces += 1;
            acc[key].totalPieceMeters += Number(entry.quantity) || 0;
            acc[key].totalNetWeight += Number(entry.weight) || 0;
            acc[key].sumOfAvgWeights += Number(entry.avgWeight) || 0;

            return acc;
        }, {} as { [key: string]: any });

        return Object.values(groups).map((group: any) => ({
            fabricCode: group.fabricCode,
            fabricDetails: group.fabricDetails,
            totalPieces: group.totalPieces,
            totalPieceMeters: group.totalPieceMeters,
            totalNetWeight: group.totalNetWeight.toFixed(3),
            avgWeight: group.totalPieces > 0 ? (group.sumOfAvgWeights / group.totalPieces).toFixed(3) : '0',
            pickRate: group.pickRate
        }));
    }, [tableRows, fabricMasterList]);

    // Add this effect to set default pick rate when selectedItemForPieces changes
    useEffect(() => {
        if (selectedItemForPieces?.price) {
            const defaultPickRate = Number(selectedItemForPieces.price);
            setTableRows(prev => prev.map(row => ({
                ...row,
                cost: defaultPickRate
            })));
        }
    }, [selectedItemForPieces?.price]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div>Loading...</div>
            </div>
        );
    }

    if (showPieceDetails) {
        const canUseTemplateActions = Boolean(filteredWarehouseData && filteredWarehouseData.length > 0 && fabricMastersArray.length > 0);
        return (
            <div className="mt-10 p-10 bg-white shadow-md rounded-lg">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xls,.xlsx"
                    onChange={handleFileUpload}
                />
                <ArrowLeft
                    onClick={handleBackToForm}
                    className="h-6 w-6 text-gray-500 hover:text-gray-600 cursor-pointer mb-4"
                />
                <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="text-2xl font-semibold">
                        {isEditMode ? 'Edit' : 'Create'} Piece Details
                    </h2>

                </div>



                <div className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText size={20} /> Contract Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Inward Date</label>
                                <input
                                    type="date"
                                    value={formData.jobFabricReceiveDate.split('T')[0]}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        jobFabricReceiveDate: e.target.value
                                    })}
                                    className="input mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Sort No</label>
                                <input
                                    value={selectedItemForPieces.fabricCode || ''}
                                    disabled
                                    className="input mt-1 bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Sort Details</label>
                                <input
                                    value={selectedItemForPieces.fabricDetails || ''}
                                    disabled
                                    className="input mt-1 bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Order Quantity (Meters)</label>
                                <input
                                    value={selectedItemForPieces.quantity}
                                    disabled
                                    className="input mt-1 bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Received Quantity (Meters)</label>
                                <input
                                    type="number"
                                    value={selectedItemForPieces.quantityReceived}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        setSelectedItemForPieces({
                                            ...selectedItemForPieces,
                                            quantityReceived: value
                                        });
                                    }}
                                    className="input mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Pick Rate</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={selectedItemForPieces.price}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        setSelectedItemForPieces({
                                            ...selectedItemForPieces,
                                            price: value
                                        });
                                        setPieceEntriesDraft(prev => prev.map(d => ({ ...d, cost: value })));
                                    }}
                                    className="input mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Remarks</label>
                                <input
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        remarks: e.target.value
                                    })}
                                    className="input mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>


                    {/* Inside the showPieceDetails return statement, replace the existing piece entry section */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardList size={20} /> Item Details (Pieces)
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleDownloadTemplate}
                                        disabled={!canUseTemplateActions}
                                        className="flex items-center"
                                    >
                                        <FileDown size={16} className="mr-2" />
                                        Download Template
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleUploadButtonClick}
                                        disabled={!canUseTemplateActions || isImporting}
                                        className="flex items-center"
                                    >
                                        <Upload size={16} className="mr-2" />
                                        {isImporting ? 'Importing...' : 'Upload Excel'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <label className="block text-sm font-medium">No of Rows (Pieces)</label>
                                        <div className="flex gap-2 items-center mt-1">
                                            <input
                                                type="number"
                                                min="0"
                                                value={numberOfPieces}
                                                onChange={(e) => {
                                                    // ONLY update the numberOfPieces state, do NOT modify tableRows
                                                    setNumberOfPieces(e.target.value);
                                                }}
                                                className="input w-32"
                                            />
                                            {/* <input
                                                type="number"
                                                min="0"
                                                value={numberOfPieces}
                                                onChange={(e) => {
                                                    const newCount = parseInt(e.target.value) || 0;
                                                    setNumberOfPieces(e.target.value);
                                                    const currentCount = tableRows.length;

                                                    if (newCount > currentCount) {
                                                        const defaultWarehouse = filteredWarehouseData && filteredWarehouseData.length > 0
                                                            ? String(filteredWarehouseData[0]?.id)
                                                            : '';
                                                        const defaultPickRate = Number(selectedItemForPieces?.price) || 0;
                                                        const defaultFabricCode = selectedItemForPieces?.fabricCode || '';
                                                        const defaultFabricDetails = selectedItemForPieces?.fabricDetails || '';
                                                        const defaultQuality = selectedItemForPieces?.quality || '';

                                                        const fmArr = Array.isArray(fabricMasterList) ? fabricMasterList : (fabricMasterList?.data || []);
                                                        const defaultFabricMaster = fmArr.find((f: any) => String(f.fabricCode) === String(defaultFabricCode));

                                                        const newRows: { id: number; pieceNumber: string; quantity: number; weight: number; cost: number; remarks: string; fabricMasterId: number | undefined; warehouseId: string; fabricCode: any; fabricDetails: any; quality: any; avgWeight: number; }[] = [];
                                                        for (let i = 0; i < newCount - currentCount; i++) {
                                                            newRows.push({
                                                                id: Date.now() + i,
                                                                pieceNumber: '',
                                                                quantity: 0,
                                                                weight: 0,
                                                                cost: defaultPickRate,
                                                                remarks: '',
                                                                fabricMasterId: defaultFabricMaster?.id ? Number(defaultFabricMaster.id) : undefined,
                                                                warehouseId: defaultWarehouse,
                                                                fabricCode: defaultFabricCode,
                                                                fabricDetails: defaultFabricDetails,
                                                                quality: defaultQuality,
                                                                avgWeight: 0
                                                            });
                                                        }
                                                        setTableRows(prev => [...prev, ...newRows]);
                                                    } else if (newCount < currentCount) {
                                                        setTableRows(prev => prev.slice(0, newCount));
                                                    }
                                                }}
                                                className="input w-32"
                                            /> */}
                                            <Button
                                                onClick={handleAddPiecesClick}
                                                className="bg-primary hover:bg-blue-600 text-white"
                                            >
                                                <Plus size={18} className="mr-2" /> Add Pieces
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table format for piece entries */}
                            <div className="border rounded overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border p-2 min-w-[150px]">Sort No</th>
                                                <th className="border p-2 min-w-[200px]">Sort Details</th>
                                                <th className="border p-2 min-w-[150px]">Piece No</th>
                                                <th className="border p-2 min-w-[120px]">Piece Meter</th>
                                                <th className="border p-2 min-w-[120px]">Net Weight</th>
                                                <th className="border p-2 min-w-[100px]">Avg Weight</th>
                                                <th className="border p-2 min-w-[100px]">Pick Rate</th>
                                                <th className="border p-2 min-w-[150px]">Warehouse</th>
                                                <th className="border p-2 min-w-[150px]">Remarks</th>
                                                <th className="border p-2 min-w-[100px]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={10} className="border p-4 text-center text-gray-500">
                                                        No rows added. Enter number of rows and click "Add Pieces" or use + button below.
                                                    </td>
                                                </tr>
                                            ) : (
                                                tableRows.map((entry, index) => (
                                                    <tr key={entry.id || index}>
                                                        <td className="border p-2">
                                                            <CommonSearchableSelect
                                                                options={fabricMasterOptions}
                                                                filterActive
                                                                value={entry.fabricMasterId ? String(entry.fabricMasterId) : ''}
                                                                onValueChange={(value) => {
                                                                    const selected = fabricMastersArray.find((f: any) => String(f.id) === value);
                                                                    if (selected) {
                                                                        const fabricWarehouses = getWarehousesForFabric(selected.fabricCode);
                                                                        const defaultWarehouse = fabricWarehouses && fabricWarehouses.length > 0
                                                                            ? String(fabricWarehouses[0]?.id)
                                                                            : entry.warehouseId || '';
                                                                        updateTableCell(index, 'fabricMasterId', Number(value));
                                                                        updateTableCell(index, 'fabricCode', selected.fabricCode);
                                                                        updateTableCell(index, 'fabricDetails', `${selected.fabricCode} - ${selected.fabricQuality || ''}`);
                                                                        updateTableCell(index, 'quality', selected.fabricQuality || '');
                                                                        if (!entry.warehouseId) {
                                                                            updateTableCell(index, 'warehouseId', defaultWarehouse);
                                                                        }
                                                                    }
                                                                }}
                                                                className="w-full"
                                                                placeholder="Select Fabric"
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                value={entry.fabricDetails || ''}
                                                                className="input w-full bg-gray-100"
                                                                readOnly
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                value={entry.pieceNumber || ''}
                                                                onChange={(e) => updateTableCell(index, 'pieceNumber', e.target.value)}
                                                                className="input w-full"
                                                                placeholder={`e.g. ${piecePrefix || 'GFP-'}0001`}
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.001"
                                                                value={entry.quantity || ''}
                                                                onChange={(e) => updateTableCell(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                                className="input w-full"
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.001"
                                                                value={entry.weight || ''}
                                                                onChange={(e) => updateTableCell(index, 'weight', parseFloat(e.target.value) || 0)}
                                                                className="input w-full"
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                value={((entry.quantity || 0) > 0 ? ((entry.weight || 0) / (entry.quantity || 0)).toFixed(3) : '0')}
                                                                disabled
                                                                className="input w-full bg-gray-100"
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={entry.cost || selectedItemForPieces?.price || ''}
                                                                onChange={(e) => updateTableCell(index, 'cost', parseFloat(e.target.value) || 0)}
                                                                className="input w-full"
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            {/* <CommonSearchableSelect
                                                                options={warehouseOptions}
                                                                filterActive
                                                                value={entry.warehouseId ? String(entry.warehouseId) : ''}
                                                                onValueChange={(value) => updateTableCell(index, 'warehouseId', value)}
                                                                className="w-full"
                                                                placeholder="Select Warehouse"
                                                            /> */}
                                                            <CommonSearchableSelect
                                                                options={warehouseOptions}
                                                                filterActive
                                                                value={entry.warehouseId ? String(entry.warehouseId) : ''}
                                                                onValueChange={(value) => updateTableCell(index, 'warehouseId', value)}
                                                                className="w-full"
                                                                placeholder={warehouseOptions.length ? "Select Warehouse" : "Loading warehouses..."}
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <input
                                                                value={entry.remarks || ''}
                                                                onChange={(e) => updateTableCell(index, 'remarks', e.target.value)}
                                                                className="input w-full"
                                                                placeholder="Remarks"
                                                            />
                                                        </td>

                                                        <td className="border p-2">
                                                            {entry.isInspected === 1 ? (
                                                                <div className="flex justify-center">
                                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                                                                        Inspected
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-center gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white"
                                                                        onClick={handleAddSingleRow}
                                                                        title="Add row"
                                                                    >
                                                                        <Plus size={14} />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="h-8 w-8 p-0 bg-red-500 text-white hover:bg-red-600"
                                                                        onClick={() => handleRemoveRow(index)}
                                                                        title="Remove row"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                        </svg>
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary Section */}
                            {summaryData.length > 0 && (
                                <Card className="mt-4">
                                    <CardHeader>
                                        <CardTitle>Fabric Inward Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-300 text-center">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border p-2">Sort No</th>
                                                        <th className="border p-2">Sort Details</th>
                                                        <th className="border p-2">Total No of Pieces</th>
                                                        <th className="border p-2">Total No of Piece Meters</th>
                                                        <th className="border p-2">Total Net Weight</th>
                                                        <th className="border p-2">Avg Weight</th>
                                                        <th className="border p-2">Pick Rate</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {summaryData.map((row, index) => (
                                                        <tr key={index}>
                                                            <td className="border p-2">{row.fabricCode}</td>
                                                            <td className="border p-2">{row.fabricDetails}</td>
                                                            <td className="border p-2">{row.totalPieces}</td>
                                                            <td className="border p-2">{row.totalPieceMeters.toFixed(3)}</td>
                                                            <td className="border p-2">{row.totalNetWeight}</td>
                                                            <td className="border p-2">{row.avgWeight}</td>
                                                            <td className="border p-2">{row.pickRate}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                    <div className="space-x-2 flex justify-end">
                        <Button
                            onClick={handleSubmit(handleSave)}
                            className="bg-primary hover:bg-primary text-white px-6 flex items-center"
                            disabled={isLoading}
                        >
                            <Save size={18} className="mr-2" />
                            {isEditMode ? 'Update' : 'Save'} Jobwork Fabric Receive
                        </Button>
                    </div>
                </div>
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
                            onClick={() => navigate("/transaction/jobwork-fabric-receive-details")}
                            className="mr-auto"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Back
                        </Button>
                        <h2 className="text-2xl font-semibold">Jobwork Fabric Receive</h2>
                    </div>

                    <div className="space-x-2">
                        <Button
                            onClick={showPieceCreation}
                            className="bg-primary hover:bg-primary text-white px-6"
                            disabled={selectedItems.length === 0}
                        >
                            {isEditMode ? 'Edit Piece' : 'Create Piece'}
                        </Button>
                    </div>
                </div>
                <div className="space-y-6 mt-10">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText size={20} /> Weaving Contract Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-4 gap-8">
                            <div>
                                <label className="block text-sm mb-1">Receive No</label>
                                <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                                    {...register('receiveNo')} readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">
                                    Vendor Name <span className="text-red-500">*</span>
                                </label>
                                <CommonSearchableSelect
                                    {...register("vendorId", { required: "Vendor is required" })}
                                    options={vendorOptions}
                                    filterActive
                                    className={` mt-1 ${errors.vendorId ? 'border-red-500' : ''}`}
                                    placeholder="Select a Vendor"
                                    value={vendorIdWatch || ''}
                                    error={errors.vendorId?.message as string}
                                />

                            </div>
                            <div>
                                <label className="block text-sm font-medium">
                                    Weaving Contract No <span className="text-red-500">*</span>
                                </label>
                                <CommonSearchableSelect
                                    {...weavingContractRest}
                                    filterActive
                                    ref={weavingContractRef}
                                    options={weavingContractOptions}
                                    className={` mt-1 ${errors.weavingContractId ? 'border-red-500' : ''}`}
                                    placeholder="Select a Weaving Contract No"
                                    value={watch('weavingContractId') || ''}
                                    error={errors.weavingContractId?.message as string}
                                    onChange={handleWeavingContractSelect}
                                />

                            </div>
                            <div>
                                <label className="block text-sm font-medium">
                                    Inward Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register("jobFabricReceiveDate", {
                                        required: "Inward Date is required",
                                    })}
                                    type="date"
                                    className={`input mt-1 ${errors.jobFabricReceiveDate ? 'border-red-500' : ''}`}
                                />
                                {errors.jobFabricReceiveDate && (
                                    <p className="mt-1 text-sm text-red-600">{errors.jobFabricReceiveDate.message}</p>
                                )}
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
                                    maxLength={255}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList size={20} /> Contract Item Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {filteredItems.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    {watch("weavingContractId") ?
                                        "No items found for selected weaving contract" :
                                        "Please select a weaving contract to view items"}
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300 text-center">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border p-2">Select</th>
                                                <th className="border p-2">Line Item No</th>
                                                <th className="border p-2">Sort No</th>
                                                <th className="border p-2">Sort Details</th>
                                                <th className="border p-2">Construction</th>
                                                <th className="border p-2">Available Quantity</th>
                                                <th className="border p-2">Quantity Received</th>
                                                <th className="border p-2">Pick Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map((item: any, index: number) => (
                                                <tr key={`${item.poId}-${item.id}`} className="border">
                                                    <td className="border p-2">
                                                        <input
                                                            type="checkbox"
                                                            onChange={() => handleItemSelect(item)}
                                                            checked={selectedItems.some(
                                                                (selected: any) =>
                                                                    selected.id === item.id
                                                            )}
                                                            className="w-4 h-4"
                                                        />
                                                    </td>
                                                    <td className="border p-2">{index + 1}</td>
                                                    <td className="border p-2">{item.fabricCode || 'N/A'}</td>
                                                    <td className="border p-2">{item.fabricDetails || 'N/A'}</td>
                                                    <td className="border p-2">{item.quality || item.fabricName || 'N/A'}</td>
                                                    <td className="border p-2">{item.quantity}</td>
                                                    <td className="border p-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.quantity}
                                                            step="0.001"
                                                            className={`w-30 border p-1 ${selectedItems.some((selected: any) =>
                                                                selected.id === item.id &&
                                                                (!selected.quantityReceived || Number(selected.quantityReceived) <= 0)
                                                            ) ? 'border-red-500' : ''}`}
                                                            value={item.quantityReceived || ''}
                                                            onChange={(e) =>
                                                                handleInputChange(index, "quantityReceived", e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                    <td className="border p-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="w-30 border p-1"
                                                            value={item.price ?? getPickRateFromContractItems(Number(watch("weavingContractId") || formData.weavingContractId || 0), item) ?? ''}
                                                            onChange={(e) => handleInputChange(index, "price", e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>


            </div>

        </div>
    );
};

export default JobworkFabricReceive;