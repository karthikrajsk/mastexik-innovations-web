import React, { useEffect, useState, useMemo, useRef, act } from "react";
import { FileText, ShoppingCart, ClipboardList, Plus, Edit, Trash2, Save, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { getAllTermsConditions } from "@/state/termsConditions";
import { getAllEmptyBeamIssue } from "@/state/emptyBeamIssueSlice";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllFlanges } from "@/state/flangeSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";

import { createFactoryBeamInward, updateFactoryBeamInward } from "@/state/factoryBeamInwardSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getSizingPlanById } from "@/state/sizingPlanSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllBeamInward } from "@/state/beamInwardSlice";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { toast } from "react-toastify";
import documentNumberService from "@/services/DocumentNumberService";
import { useAutoDocumentNumber } from "@/components/common/useAutoDocumentNumber";

interface FactoryBeamInwardFormData {
    id?: number;
    beamInwardDate: string;
    sizingVendorId: string;
    weavingContractId?: string; // for Sizing Vendor Details dropdown
    weavingJobWorkOrderId?: string; // for Sizing Vendor Details dropdown
    emptyBeamNo: string;
    beamInwardNo: string;
    sizingSetNo?: string;
    fabricCodeQuality?: string;
    dcNo?: string;
    dcDate?: string;
    qualityDetails: FactoryBeamInwardQualityDetails[];
    beamDetails: FactoryBeamInwardBeamDetails[];
}

interface FactoryBeamInwardQualityDetails {
    id?: number | string;
    quality: string;
    yarnId: string;
    sordEnds: string;
    actualEnds: string;
    parts: string;
    endsPerPart: string;
    wrapMeters: string;
    fabricCode?: string;
    actualYarn?: string;
    warpEnds?: string;
    actualWarpEnds?: string;
}

interface FactoryBeamInwardBeamDetails {
    id?: number | string;
    weavingContractId: string;
    vendorId: string;
    sizedBeamNo: string;
    flangeNo?: string;
    flangeId?: string;
    wrapMeters: string;
    shrinkage: string;
    expectedFabricMeter: string;
    fabricPanelWidth?: string;
    actualEnds?: string;
    isBeamCut?: string;
    isProductionCompleted?: string;
}

type SelectOption = {
    value: string;
    label: string;
};

const FactoryBeamInwardEntry = () => {
    const [items, setItems] = useState<FactoryBeamInwardQualityDetails[]>([]);
    const [beamItems, setBeamItems] = useState<FactoryBeamInwardBeamDetails[]>([]);
    const [newItem, setNewItem] = useState<FactoryBeamInwardQualityDetails>({
        quality: "",
        yarnId: "",
        sordEnds: "",
        actualEnds: "",
        parts: "",
        endsPerPart: "",
        wrapMeters: "",
    });
    const [newBeamItem, setNewBeamItem] = useState<FactoryBeamInwardBeamDetails>({
        weavingContractId: "",
        vendorId: "",
        sizedBeamNo: "",
        flangeNo: "",
        flangeId: "",
        wrapMeters: "",
        shrinkage: "",
        expectedFabricMeter: "",
        fabricPanelWidth: "",
        actualEnds: items[0]?.actualEnds ? String(items[0].actualEnds) : "",
        isBeamCut: "0",
        isProductionCompleted: "0",
    });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [beamEditingIndex, setBeamEditingIndex] = useState<number | null>(null);
    const [showAddBeamForm, setShowAddBeamForm] = useState(false);
    const [factoryCompanyId, setFactoryCompanyId] = useState<number | null>(null);

    // const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
    const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder);
    const { customerList } = useSelector((state: RootState) => state.customer);
    const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
    const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
    const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions);
    const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
    const { emptyBeamIssueList } = useSelector((state: RootState) => state.emptyBeamIssue);
    const { yarnList } = useSelector((state: RootState) => state.yarn);
    const { flangeList } = useSelector((state: RootState) => state.flange as any);
    const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
    const { beamInwardList: masterBeamInwardList } = useSelector((state: RootState) => state.beamInward as any);

    const normalizedVendors = useMemo(() => {
        const raw: any = vendorList as any;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [] as any[];
    }, [vendorList]);

    const normalizedCustomers = useMemo(() => {
        const raw: any = customerList as any;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [] as any[];
    }, [customerList]);

    const normalizedCompanies = useMemo(() => {
        const raw: any = companyMasterList as any;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [] as any[];
    }, [companyMasterList]);

    // Normalize flange API response and filter usable flanges
    const allFlanges = useMemo(() => {
        const raw: any = flangeList as any;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [] as any[];
    }, [flangeList]);

   

    const [numberOfLots, setNumberOfLots] = useState<string>('0');


    const dispatch = useDispatch<AppDispatch>();
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FactoryBeamInwardFormData>();
    const location = useLocation();
    const beamInwardDtlFromState = location.state?.beamInwardDtl;
    const initialBeamInwardDtl = useMemo(() => {
        if (beamInwardDtlFromState) return beamInwardDtlFromState;
        try {
            const s = sessionStorage.getItem('factoryBeamInwardEdit');
            if (s) return JSON.parse(s);
        } catch {}
        return null;
    }, [beamInwardDtlFromState]);
    const [beamInwardDtl, setBeamInwardDtl] = useState<any>(initialBeamInwardDtl);
    const [orderTypeId, setOrderTypeId] = useState<string>("2");

    const filteredFlanges = useMemo(() => {
        return allFlanges.filter((f: any) => {
            if (Number(f?.isBeamGating) !== 0) return false;
            const inwardValue = f?.isInwarded;
            if (!(Number(inwardValue) === 0 || inwardValue == null)) return false;
            if (orderTypeId === "2") {
                return Number(f?.isIssued) === 1;
            }
            return true;
        });
    }, [allFlanges, orderTypeId]);
    
    const normalizeDuplicateKey = (value?: string) => String(value || "").trim().toLowerCase();

    const savedBeamFlanges = useMemo(() => {
        const rawBeamDetails: any[] = Array.isArray(beamInwardDtl?.beamDetails)
            ? beamInwardDtl?.beamDetails
            : Array.isArray(beamInwardDtl?.beamInwardBeamDetails)
                ? beamInwardDtl?.beamInwardBeamDetails
                : [];
        const map = new Map<string, any>();
        rawBeamDetails.forEach((detail: any) => {
            const flangeNo = detail?.flangeNo || detail?.flangeNumber;
            const flangeId = detail?.flangeId ?? detail?.flange?.id ?? detail?.flange_id;
            if (!flangeNo) return;
            const key = flangeId != null ? String(flangeId) : String(flangeNo);
            if (!map.has(key)) {
                map.set(key, {
                    id: flangeId != null ? String(flangeId) : String(flangeNo),
                    flangeNo: String(flangeNo),
                });
            }
        });
        return Array.from(map.values());
    }, [beamInwardDtl]);

    const flangeOptions = useMemo(() => {
        const combined: any[] = [];
        const seen = new Set<string>();
        filteredFlanges.forEach((fl: any) => {
            const id = fl?.id != null ? String(fl.id) : "";
            if (!id || seen.has(id)) return;
            combined.push(fl);
            seen.add(id);
        });
        savedBeamFlanges.forEach((fl: any) => {
            const id = fl?.id != null ? String(fl.id) : "";
            if (!id || seen.has(id)) return;
            combined.push(fl);
            seen.add(id);
        });
        return combined;
    }, [filteredFlanges, savedBeamFlanges]);

    const flangeSelectOptions = useMemo<SelectOption[]>(() => {
        return flangeOptions
            .map((fl: any) => ({
                value: String(fl.id),
                label: fl.flangeNo || `Flange ${fl.id}`,
                activeFlag: fl.activeFlag ?? true,
            }))
            .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
    }, [flangeOptions]);

    const savedFlangeSelectOptions = useMemo<SelectOption[]>(() => {
        return savedBeamFlanges
            .map((fl: any) => ({
                value: String(fl.id),
                label: fl.flangeNo || `Flange ${fl.id}`,
                activeFlag: true,
            }))
            .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
    }, [savedBeamFlanges]);

    const addBeamFlangeSelectOptions = useMemo<SelectOption[]>(() => {
        if (orderTypeId === "1") {
            return savedFlangeSelectOptions;
        }
        return flangeSelectOptions;
    }, [orderTypeId, savedFlangeSelectOptions, flangeSelectOptions]);

    const resolveFlangeSelectionValue = (flangeId?: string, flangeNo?: string) => {
        if (flangeId) return flangeId;
        const match = flangeOptions.find(
            (fl: any) =>
                String(fl.flangeNo || "").trim().toLowerCase() === String(flangeNo || "").trim().toLowerCase(),
        );
        return match ? String(match.id) : "";
    };

    const isEditMode = !!beamInwardDtl; // treat non-edit as External

    useEffect(() => {
        if (!showAddBeamForm) return;
        if (!(isEditMode && orderTypeId === "1")) return;
        if (String(newBeamItem.flangeNo || "").trim() !== "" || String(newBeamItem.flangeId || "").trim() !== "") return;

        const existingBeamDetail = beamItems.find(
            (beam) => String(beam.flangeNo || "").trim() !== "" || String(beam.flangeId || "").trim() !== "",
        );
        if (!existingBeamDetail) return;

        const resolvedFlangeId =
            resolveFlangeSelectionValue(
                String(existingBeamDetail.flangeId || ""),
                String(existingBeamDetail.flangeNo || ""),
            ) || String(existingBeamDetail.flangeId || "");

        setNewBeamItem((prev) => ({
            ...prev,
            flangeNo: String(existingBeamDetail.flangeNo || prev.flangeNo || ""),
            flangeId: resolvedFlangeId,
        }));
    }, [showAddBeamForm, isEditMode, orderTypeId, newBeamItem.flangeNo, newBeamItem.flangeId, beamItems, flangeOptions]);

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("vendorDetails");
  const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);

    
  useAutoDocumentNumber({
    screenName: 'Factory Beam Inward',
    detail: beamInwardDtl,
    existingValue: beamInwardDtl?.beamInwardNo,
    fieldName: 'beamInwardNo',
    setValue,
    isSavingRef,
  });

  useEffect(() => {
    if (beamInwardDtl?.beamInwardNo) {
      setValue('beamInwardNo', beamInwardDtl.beamInwardNo);
    }
  }, [beamInwardDtl, setValue]);


    useEffect(() => {
         const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        const parsedCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
        setFactoryCompanyId(Number.isFinite(parsedCompanyId) ? parsedCompanyId : null);
        dispatch(getAllVendors({fetchAll: true} as any));
        dispatch(getAllWeavingContract({fetchAll: true} as any));
        dispatch(getAllPaymentTerms({fetchAll: true} as any));
        dispatch(getAllTermsConditions({fetchAll: true} as any));
        dispatch(getAllEmptyBeamIssue({fetchAll: true} as any));
        // Removed sizing plan fetch for this page
        dispatch(getAllYarnMasters({fetchAll: true} as any));
        dispatch(getAllFabricMasters({fetchAll: true} as any));
        dispatch(getAllBeamInward({fetchAll: true} as any));
        dispatch(getAllCustomers({fetchAll: true} as any));
        dispatch(getAllCompanies({fetchAll: true} as any));

    }, [dispatch]);

    useEffect(() => {
        const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        const resolvedCompanyId = factoryCompanyId ?? (storedCompanyId ? Number(storedCompanyId) : null);
        
        if (orderTypeId === '2' && resolvedCompanyId != null && Number.isFinite(resolvedCompanyId)) {
              dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
                                    factoryCompanyId: resolvedCompanyId,fetchAll: true
                                  }) as any);
            // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(resolvedCompanyId));
            dispatch(getAllSalesOrders({ companyId: resolvedCompanyId, fetchAll: true }));
            return;
        }
        dispatch(getAllWeavingJobWorkOrders({fetchAll: true} as any));
        dispatch(getAllSalesOrders({ fetchAll: true }));
    }, [dispatch, orderTypeId, factoryCompanyId]);

    useEffect(() => {
        const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        const parsedCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
        const fallbackCompanyId = beamInwardDtl?.factoryCompanyId ?? beamInwardDtl?.companyId ?? parsedCompanyId;

        if (orderTypeId === "1") {
            dispatch(getAllFlanges({fetchAll: true} as any));
            return;
        }

        if (fallbackCompanyId != null && !Number.isNaN(fallbackCompanyId)) {
            dispatch(getAllFlanges({ companyId: Number(fallbackCompanyId), fetchAll: true }));
        } else {
            dispatch(getAllFlanges({fetchAll: true} as any));
        }
    }, [dispatch, orderTypeId, beamInwardDtl]);

    useEffect(() => {
        if (beamInwardDtlFromState) {
            setBeamInwardDtl(beamInwardDtlFromState);
            try { sessionStorage.setItem('factoryBeamInwardEdit', JSON.stringify(beamInwardDtlFromState)); } catch {}
        }
    }, [beamInwardDtlFromState]);

    const beamOrderTypeMap = useMemo(() => {
        const raw: any = masterBeamInwardList as any;
        const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        const map = new Map<string, string>();
        arr.forEach((r: any) => {
            if (r?.id != null && r?.orderTypeId != null) map.set(String(r.id), String(r.orderTypeId));
        });
        return map;
    }, [masterBeamInwardList]);

    useEffect(() => {
        if (beamInwardDtl) {
            let ot = String(beamInwardDtl.orderTypeId ?? '');
            const linkedId = beamInwardDtl.beamInwardId;
            if (!ot && linkedId != null) {
                const fromMap = beamOrderTypeMap.get(String(linkedId));
                if (fromMap) ot = fromMap;
            }
            if (!ot && (linkedId == null)) ot = '2';
            setOrderTypeId(ot || '1');
            reset({
                beamInwardDate: beamInwardDtl.beamInwardDate ? new Date(beamInwardDtl.beamInwardDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                sizingVendorId: String(beamInwardDtl.sizingVendorId ?? beamInwardDtl.vendorId ?? ''),
                emptyBeamNo: beamInwardDtl.emptyBeamNo || "",
                sizingSetNo: beamInwardDtl.sizingSetNo || "",
                dcNo: beamInwardDtl.dcNo || "",
                dcDate: beamInwardDtl.dcDate ? new Date(beamInwardDtl.dcDate).toISOString().split('T')[0] : "",
                weavingContractId: String(beamInwardDtl.weavingContractId ?? ''),
                weavingJobWorkOrderId: beamInwardDtl.weavingWorkOrderId ? String(beamInwardDtl.weavingWorkOrderId) : '',
                fabricCodeQuality: beamInwardDtl.fabricCodeQuality || '',
            } as any);

            const qd =
                beamInwardDtl.qualityDetails ||
                beamInwardDtl.beamInwardQualityDetails;
            if (qd && Array.isArray(qd)) {
                setItems(qd.map((item: any) => ({
                    id: item.id != null ? item.id : undefined,
                    ...item,
                    yarnId: item.yarnId != null ? String(item.yarnId) : '',
                    sordEnds: item.sordEnds != null ? String(item.sordEnds) : '',
                    actualEnds: item.actualEnds != null ? String(item.actualEnds) : '',
                    parts: item.parts != null ? String(item.parts) : '',
                    endsPerPart: item.endsPerPart != null ? String(item.endsPerPart) : '',
                    wrapMeters: item.wrapMeters != null ? String(item.wrapMeters) : '',
                    fabricCode: item.fabricCode || '',
                    actualYarn: item.actualYarn != null ? String(item.actualYarn) : '',
                    warpEnds: item.warpEnds != null ? String(item.warpEnds) : '',
                    actualWarpEnds: item.actualWarpEnds != null ? String(item.actualWarpEnds) : '',
                })));
            }

            const bd =
                beamInwardDtl.beamDetails ||
                beamInwardDtl.beamInwardBeamDetails;
            if (bd && Array.isArray(bd)) {
                setBeamItems(bd.map((beam: any) => ({
                    id: beam.id != null ? beam.id : undefined,
                    weavingContractId: String(beamInwardDtl.weavingContractId ?? beam.weavingContractId ?? ''),
                    vendorId: String(beamInwardDtl.weavingVendorId ?? beam.vendorId ?? ''),
                    sizedBeamNo: beam.sizedBeamNo != null ? String(beam.sizedBeamNo) : '',
                    flangeNo: beam.flangeNo != null ? String(beam.flangeNo) : '',
                    flangeId: beam.flangeId != null ? String(beam.flangeId) : '',
                    wrapMeters: beam.wrapMeters != null ? String(beam.wrapMeters) : '',
                    shrinkage: beam.shrinkage != null ? String(beam.shrinkage) : '',
                    expectedFabricMeter: beam.expectedFabricMeter != null ? String(beam.expectedFabricMeter) : '',
                    fabricPanelWidth: beam.fabricPanelWidth != null ? String(beam.fabricPanelWidth) : '',
                    actualEnds: beam.actualEnds != null ? String(beam.actualEnds) : '',
                    isBeamCut: beam.isBeamCut != null ? String(beam.isBeamCut) : '0',
                                        isProductionCompleted: beam.isProductionCompleted != null ? String(beam.isProductionCompleted) : '0',  // ← ADD THIS

                })));
            }
        } else {
            setValue('beamInwardDate', new Date().toISOString().split('T')[0]);
            setOrderTypeId('2');
        }
    }, [beamInwardDtl, beamOrderTypeMap, reset, setValue]);

    useEffect(() => {
        if (!isEditMode || !beamInwardDtl) return;
        
        const wcId = String(beamInwardDtl.weavingContractId ?? '') || '';
        const wjId = beamInwardDtl.weavingWorkOrderId ? String(beamInwardDtl.weavingWorkOrderId) : '';
        const vendorId = String(beamInwardDtl.sizingVendorId ?? beamInwardDtl.vendorId ?? '') || '';
        
        // Use getValues instead of watch to avoid unnecessary re-renders and potential loops
        // const currentValues = reset ? {} : {
        //     weavingContractId: String(watch('weavingContractId') || ''),
        //     weavingJobWorkOrderId: String(watch('weavingJobWorkOrderId') || ''),
        //     sizingVendorId: String(watch('sizingVendorId') || '')
        // };

        if (wcId && String(watch('weavingContractId')) !== wcId) {
            setValue('weavingContractId', wcId, { shouldValidate: true });
        }
        if (wjId && String(watch('weavingJobWorkOrderId')) !== wjId) {
            setValue('weavingJobWorkOrderId', wjId, { shouldValidate: true });
        }
        if (vendorId && String(watch('sizingVendorId')) !== vendorId) {
            setValue('sizingVendorId', vendorId, { shouldValidate: true });
        }
    }, [isEditMode, beamInwardDtl, watch, setValue]);

    const wcWatch = watch('weavingContractId');
    useEffect(() => {
        if (!isEditMode) return;
        if (orderTypeId === '1') {
            const wc = (weavingContractList || []).find((x: any) => String(x.id) === String(wcWatch));
            if (wc && wc.vendorId) setValue('sizingVendorId', String(wc.vendorId));
        }
    }, [isEditMode, orderTypeId, wcWatch, weavingContractList, setValue]);

    

    const handleSaveNewBeam = () => {
        if (!newBeamItem.flangeNo || !newBeamItem.sizedBeamNo) {
            alert("Please fill all required fields");
            return;
        }

        const flangeDup = beamItems.some(
            (b) => normalizeDuplicateKey(String(b.flangeNo)) === normalizeDuplicateKey(newBeamItem.flangeNo),
        );
        if (flangeDup) {
            toast.error(`Empty Beam No / HFPL Beam No ${newBeamItem.flangeNo} you entered already exists`);
            return;
        }

        const beamDup = beamItems.some(
            (b) => normalizeDuplicateKey(String(b.sizedBeamNo)) === normalizeDuplicateKey(newBeamItem.sizedBeamNo),
        );
        if (beamDup) {
            toast.error(`${newBeamItem.sizedBeamNo} you entered already exists`);
            return;
        }

        setBeamItems([...beamItems, newBeamItem]);
        setNewBeamItem({
            weavingContractId: "",
            vendorId: "",
            sizedBeamNo: "",
            flangeNo: "",
            flangeId: "",
            wrapMeters: "",
            shrinkage: "",
            expectedFabricMeter: "",
            fabricPanelWidth: "",
            actualEnds: items[0]?.actualEnds ? String(items[0].actualEnds) : "",
            isBeamCut: "0",
        });
        setShowAddBeamForm(false);
    };

    const handleRemoveNewBeamForm = () => {
        setNewBeamItem({
            weavingContractId: "",
            vendorId: "",
            sizedBeamNo: "",
            flangeNo: "",
            flangeId: "",
            wrapMeters: "",
            shrinkage: "",
            expectedFabricMeter: "",
            fabricPanelWidth: "",
            actualEnds: items[0]?.actualEnds ? String(items[0].actualEnds) : "",
            isBeamCut: "0",
        });
        setShowAddBeamForm(false);
    };

    const editItem = (index: number) => {
        setNewItem(items[index]);
        setEditingIndex(index);
    };

    const editBeamItem = (index: number) => {
        setNewBeamItem(beamItems[index]);
        setBeamEditingIndex(index);
        setShowAddBeamForm(false);
    };

    const deleteItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const deleteBeamItem = (index: number) => {
        setBeamItems(beamItems.filter((_, i) => i !== index));
    };

    
    const onSubmit = async (data: FactoryBeamInwardFormData) => {
        console.log('Form Data before transformation:', data);
           if (beamItems.length === 0) {
        toast.error("Cannot proceed — beam data is empty. Please add at least one item.");
        return;
    }

        const flangeSet = new Set<string>();
        const sizedBeamSet = new Set<string>();
        for (const beam of beamItems) {
            const flangeKey = normalizeDuplicateKey(beam.flangeNo);
            if (flangeKey) {
                if (flangeSet.has(flangeKey)) {
                    toast.error(`Empty Beam No ${beam.flangeNo} you entered already exists`);
                    return;
                }
                flangeSet.add(flangeKey);
            }
            const sizedBeamKey = normalizeDuplicateKey(beam.sizedBeamNo);
            if (sizedBeamKey) {
                if (sizedBeamSet.has(sizedBeamKey)) {
                    toast.error(`${beam.sizedBeamNo} you entered already exists`);
                    return;
                }
                sizedBeamSet.add(sizedBeamKey);
            }
        }

        const emptySizedBeamNos = beamItems.filter(beam => !beam.sizedBeamNo.trim());
        if (emptySizedBeamNos.length > 0) {
            alert("Please fill in all Sized Beam No fields");
            return;
        }

        // Align payload with backend entities (FactoryBeamInward, QualityDetails, BeamDetails)
        const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
        
           const isEditMode = Boolean(beamInwardDtl?.id);
               let beamInwardNo = data.beamInwardNo || beamInwardDtl?.beamInwardNo || "";
                    if (!beamInwardDtl?.id && !beamInwardNo) {
                        try {
                            const docResponse = await documentNumberService.generateDocumentNumber({
                                screenName: "Factory Beam Inward"
                            });
                            beamInwardNo = docResponse.documentNumber;
                        } catch (error) {
                            console.warn("Failed to generate document number:", error);
                        }
                    }
        isSavingRef.current = true;

        const payload = {
            beamInwardDate: data.beamInwardDate,
            beamInwardNo: beamInwardNo || beamInwardDtl?.beamInwardNo || undefined,
            orderTypeId: parseInt(orderTypeId),
            sizingVendorId: data.sizingVendorId ? parseInt(data.sizingVendorId) : undefined,
            weavingContractId: orderTypeId === "1" ? (data.weavingContractId ? String(data.weavingContractId) : null) : null,
            weavingWorkOrderId: data.weavingJobWorkOrderId ? parseInt(String(data.weavingJobWorkOrderId)) : undefined,
            sizingSetNo: data.sizingSetNo || undefined,
            dcNo: data.dcNo || undefined,
            dcDate: data.dcDate || undefined,
            fabricCodeQuality: data.fabricCodeQuality || undefined,
            isBeamPending: beamItems.length > 0 && beamItems.every((b: any) => (b.flangeNo || "").toString().trim() !== "") ? 1 : 0,
            // DTO expects beamInwardQualityDetails
            beamInwardQualityDetails: items.map((item: any) => ({
                id: item.id != null ? parseInt(String(item.id)) : undefined,
                quality: item.quality,
                yarnId: item.yarnId ? parseInt(item.yarnId) : undefined,
                sordEnds: item.sordEnds ? parseInt(item.sordEnds) : undefined,
                actualEnds: item.actualEnds ? parseInt(item.actualEnds) : undefined,
                parts: item.parts ? parseInt(item.parts) : undefined,
                endsPerPart: item.endsPerPart ? parseInt(item.endsPerPart) : undefined,
                wrapMeters: item.wrapMeters ? parseInt(item.wrapMeters) : undefined,
                fabricCode: item.fabricCode || undefined,
                actualYarn: item.actualYarn ? parseInt(item.actualYarn) : undefined,
                warpEnds: item.warpEnds ? parseInt(item.warpEnds) : undefined,
                actualWarpEnds: item.actualWarpEnds ? parseInt(item.actualWarpEnds) : undefined,
            })),
            // DTO expects beamInwardBeamDetails
            beamInwardBeamDetails: beamItems.map((beam: any) => ({
                id: beam.id != null ? parseInt(String(beam.id)) : undefined,
                sizedBeamNo: beam.sizedBeamNo,
                flangeNo: beam.flangeNo,
                flangeId: beam.flangeId ? parseInt(beam.flangeId) : undefined,
                wrapMeters: beam.wrapMeters ? parseInt(beam.wrapMeters) : undefined,
                shrinkage: beam.shrinkage ? parseInt(beam.shrinkage) : undefined,
                expectedFabricMeter: beam.expectedFabricMeter ? parseInt(beam.expectedFabricMeter) : undefined,
                fabricPanelWidth: beam.fabricPanelWidth ? parseFloat(beam.fabricPanelWidth) : undefined,
                actualEnds: beam.actualEnds ? parseInt(beam.actualEnds) : undefined,
                isBeamCut: beam.isBeamCut ? parseInt(String(beam.isBeamCut)) : undefined,
            })),
        } as any;

        if (orderTypeId === "2" && factoryCompanyId) {
            payload.factoryCompanyId = factoryCompanyId;
        }

        try {
            if (beamInwardDtl?.id) {
                await dispatch(updateFactoryBeamInward({
                    id: beamInwardDtl.id,
                    data: payload,
                    factoryCompanyId: factoryCompanyId ?? undefined
                }) as any).unwrap();
            } else {
                await dispatch(createFactoryBeamInward(factoryCompanyId ? { ...payload, factoryCompanyId } : payload) as any).unwrap();
            documentNumberService.clearMemoryCache("Factory Beam Inward");
            }
            try { sessionStorage.removeItem('factoryBeamInwardEdit'); } catch {}
            navigate("/transaction/factory-beam-inward");
        } catch (err) {
            console.error("Error submitting Beam Inward:", err);
        }
    };

    const handleAddLot = () => {
        const newItems = Array.from({ length: Number(numberOfLots) }, () => ({
            quality: "",
            yarnId: "",
            actualEnds: "",
            parts: "",
            endsPerPart: "",
            wrapMeters: "",
        }));
    };

    // Removed sizing plan change handler as sizing plan is no longer used

    // Prevent spaces in sized beam number input for new beam
    const handleSizedBeamNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\s/g, ""); // Remove all spaces
        setNewBeamItem({
            ...newBeamItem,
            sizedBeamNo: value
        });
    };

    // Handler for editing sizedBeamNo in existing beam items table
    const handleEditSizedBeamNo = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\s/g, ""); // Remove all spaces
        setBeamItems(prev => prev.map((item, i) =>
            i === index ? { ...item, sizedBeamNo: value } : item
        ));
    };

    // Handler for changing flange selection in existing beam items table
    const computeExpectedFabricMeter = (wrapMeters: string, shrinkage: string, fabricPanelWidth: string | undefined) => {
        const warp = parseFloat(wrapMeters || "");
        const shrink = parseFloat(shrinkage || "");
        const fp = parseFloat(fabricPanelWidth || "");
        if (isNaN(warp) || isNaN(shrink)) {
            return "";
        }
        const shrinkFactor = shrink / 100;
        const base = warp - (warp * shrinkFactor);
        const multiplier = !isNaN(fp) && fp > 0 ? fp : 1;
        return Number((base * multiplier).toFixed(2)).toString();
    };

    const handleEditFlangeChange = (index: number, value: string) => {
        const selected = flangeOptions.find((fl: any) => String(fl.id) === value);
        setBeamItems(prev => prev.map((item, i) =>
            i === index ? { ...item, flangeNo: selected?.flangeNo || "", flangeId: selected ? String(selected.id) : "" } : item
        ));
    };

    const normalizedWeavingContracts = useMemo(() => {
        const raw: any = weavingContractList as any;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [] as any[];
    }, [weavingContractList]);

    const weavingContractOptions = useMemo<SelectOption[]>(() => {
        return normalizedWeavingContracts
            .map((wc: any) => ({
                value: String(wc.id),
                label: wc.weavingContractNo || `Contract ${wc.id}`,
            }))
            .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
    }, [normalizedWeavingContracts]);






    // Auto-calc Expected Fabric Meter = Warp meters - (Warp meters * shrinkage%)
    useEffect(() => {
        const warp = parseFloat(newBeamItem.wrapMeters || "");
        const shrink = parseFloat(newBeamItem.shrinkage || "");
        const fp = parseFloat(newBeamItem.fabricPanelWidth || "");
        
        if (!isNaN(warp) && !isNaN(shrink)) {
            const shrinkFactor = shrink / 100;
            const base = warp - (warp * shrinkFactor);
            const multiplier = !isNaN(fp) ? fp : 1;
            const expected = Number((base * multiplier).toFixed(2));
            if (String(expected) !== String(newBeamItem.expectedFabricMeter || "")) {
                setNewBeamItem(prev => ({ ...prev, expectedFabricMeter: String(expected) }));
            }
        } else if (newBeamItem.expectedFabricMeter) {
            setNewBeamItem(prev => ({ ...prev, expectedFabricMeter: "" }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newBeamItem.wrapMeters, newBeamItem.shrinkage, newBeamItem.fabricPanelWidth]);


    // Autofetch Sizing Plan No into Sizing Set No for Internal orders
    useEffect(() => {
        const sizingPlanId = (beamInwardDtl && (beamInwardDtl.sizingPlanId || beamInwardDtl?.sizingPlan?.id)) || null;
        if ( sizingPlanId) {
            (async () => {
                try {
                    const res: any = await dispatch(getSizingPlanById(Number(sizingPlanId))).unwrap();
                    const planNo = res?.sizingPlanNo || res?.data?.sizingPlanNo || res?.data?.data?.sizingPlanNo;
                    if (planNo) setValue('sizingSetNo', String(planNo));
                } catch (e) {
                    // ignore
                }
            })();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderTypeId, beamInwardDtl?.sizingPlanId]);

    useEffect(() => {
        if (items && items.length) {
            const first = items[0];
            const txt = [first.fabricCode, first.quality].filter(Boolean).join(' - ');
            if (txt) setValue('fabricCodeQuality', txt);
        }
    }, [items, setValue]);

    // Autofetch Fabric Code - Quality for External (non-internal) when a Jobwork Order is selected and not editing
    const weavingJobWorkOrderId = watch('weavingJobWorkOrderId');
    const selectedWeavingContractId = watch('weavingContractId');
    const normalizedJobOrders = useMemo(() => {
        const raw: any = weavingJobWorkOrderList as any;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [] as any[];
    }, [weavingJobWorkOrderList]);

    const jobOrdersForMode = useMemo(() => {
        if (isEditMode) return normalizedJobOrders;
        return normalizedJobOrders.filter((wo: any) => String(wo?.orderTypeId ?? '2') === '2');
    }, [normalizedJobOrders, isEditMode]);

    const jobOrdersForDropdown = useMemo(() => {
        const savedWjId = isEditMode && beamInwardDtl?.weavingWorkOrderId
            ? String(beamInwardDtl.weavingWorkOrderId)
            : null;
        const byContract = jobOrdersForMode.filter((wo: any) => String(wo.weavingContractId) === String(selectedWeavingContractId));
        let base = byContract.length ? byContract : jobOrdersForMode;
        if (savedWjId && !base.some((wo: any) => String(wo.id) === savedWjId)) {
            const savedOrder = normalizedJobOrders.find((wo: any) => String(wo.id) === savedWjId);
            if (savedOrder) base = [...base, savedOrder];
        }
        return base;
    }, [jobOrdersForMode, selectedWeavingContractId, isEditMode, beamInwardDtl, normalizedJobOrders]);

    const resolveEntityName = (entities: any[], candidateIds: Array<string | number | null | undefined>, keys: string[]) => {
        for (const candidate of candidateIds) {
            if (candidate == null || candidate === "") continue;
            const entity = entities.find((entry: any) => String(entry.id) === String(candidate));
            if (entity) {
                for (const key of keys) {
                    const value = entity[key];
                    if (value) return value;
                }
            }
        }
        return "-";
    };

    const getBuyerNameForOrder = (wo: any) => {
        const buyerType = String(wo?.orderTypeId ?? orderTypeId ?? '');
        if (buyerType === '1') {
            return resolveEntityName(
                normalizedCompanies,
                [wo?.buyerId, wo?.companyId, wo?.factoryCompanyId, wo?.tradingCompanyId],
                ['companyName', 'name', 'customerName']
            );
        }
        return resolveEntityName(
            normalizedCustomers,
            [wo?.buyerId, wo?.customerId, wo?.consigneeId],
            ['customerName', 'buyerName', 'name', 'companyName']
        );
    };

    const jobWorkOrderOptions = useMemo<SelectOption[]>(() => {
        const savedWjId = isEditMode && beamInwardDtl?.weavingWorkOrderId
            ? String(beamInwardDtl.weavingWorkOrderId)
            : null;
        return (jobOrdersForDropdown || [])
            .filter((wo: any) => wo.isApproved === 1 || (savedWjId && String(wo.id) === savedWjId))
            .map((wo: any) => ({
                value: String(wo.id),
                label: `${wo.jobWorkOrderNo || wo.weavingWorkOrderNo || wo.orderNo || wo.id} - ${getBuyerNameForOrder(wo)}`,
            }))
            .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
    }, [jobOrdersForDropdown, getBuyerNameForOrder, isEditMode, beamInwardDtl]);

    const sizingVendorOptions = useMemo<SelectOption[]>(() => {
        const selectedWC = normalizedWeavingContracts.find((wc: any) => String(wc.id) === String(selectedWeavingContractId));
        const currentVendorId = watch('sizingVendorId');
        
        const sizingVendors = normalizedVendors.filter((vendor: any) => {
            const hasTypeIdInArray = Array.isArray(vendor.vendorTypeIds) && 
                (vendor.vendorTypeIds.includes(302) || vendor.vendorTypeIds.includes(307));
            const hasTypeIdInString = vendor.vendorTypeId != null && 
                String(vendor.vendorTypeId).split(',').map((s: string) => s.trim()).some((s: string) => s === "302" || s === "307");
            return hasTypeIdInArray || hasTypeIdInString;
        });

        let source = selectedWC
            ? sizingVendors.filter((vendor: any) => String(vendor.id) === String(selectedWC.vendorId))
            : sizingVendors;

        // In edit mode or if a vendor is already selected, ensure  it's in the options list 
        // even if it doesn't match the current weaving contract filter
        if (currentVendorId) {
            const hasSelected = source.some((v: any) => String(v.id) === String(currentVendorId));
            if (!hasSelected) {
                const selectedVendor = sizingVendors.find((v: any) => String(v.id) === String(currentVendorId));
                if (selectedVendor) {
                    source = [...source, selectedVendor];
                }
            }
        }

        return source
            .map((vendor: any) => ({
                value: String(vendor.id),
                label: vendor.vendorName || `Vendor ${vendor.id}`,
                activeFlag: vendor.activeFlag,
            }))
            .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
    }, [normalizedVendors, normalizedWeavingContracts, selectedWeavingContractId, watch('sizingVendorId')]);

    useEffect(() => {
        if (!isEditMode) {
            setOrderTypeId('2');
        }
    }, [isEditMode]);

    const fabricById = useMemo(() => {
        const map = new Map<number, any>();
        const arr: any[] = Array.isArray(fabricMasterList)
            ? fabricMasterList as any[]
            : (Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : []);
        arr.forEach((f: any) => {
            const id = Number(f?.id);
            if (!Number.isNaN(id)) map.set(id, f);
        });
        return map;
    }, [fabricMasterList]);

    const fabricByCode = useMemo(() => {
        const map = new Map<string, any>();
        const arr: any[] = Array.isArray(fabricMasterList)
            ? fabricMasterList as any[]
            : (Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : []);
        arr.forEach((f: any) => {
            const code = String(f?.fabricCode || '').trim();
            if (code) map.set(code, f);
            const greige = String(f?.greigeCode || '').trim();
            if (greige) map.set(greige, f);
        });
        return map;
    }, [fabricMasterList]);

    const fabricCodeQualityVal = watch('fabricCodeQuality');
    useEffect(() => {
        if (!showAddBeamForm) return;
        let fromFabric = "";
        const code = String(fabricCodeQualityVal || '').split(' - ')[0]?.trim();
        let rec: any = null;
        if (code) {
            rec = fabricByCode.get(code);
            const te = rec?.totalEnds;
            if (te != null && te !== "") fromFabric = String(te);
        }
        const firstActual = items[0]?.actualEnds ? String(items[0].actualEnds) : "";
        const next = fromFabric || firstActual || "";
        if ((newBeamItem.actualEnds || "") !== next) setNewBeamItem(prev => ({ ...prev, actualEnds: next }));

        if (orderTypeId !== "1" && rec) {
            const details: any[] = Array.isArray(rec.warpDetails) ? rec.warpDetails : [];
            let shrink = "";
            if (details.length === 1) {
                const sp = details[0]?.shrinkagePercent;
                if (sp != null && sp !== "") shrink = String(Number(sp));
            } else if (details.length > 1) {
                const nums = details.map((d: any) => Number(d?.shrinkagePercent)).filter((n: number) => !Number.isNaN(n));
                if (nums.length) {
                    const avg = nums.reduce((a: number, b: number) => a + b, 0) / nums.length;
                    shrink = String(Number(avg.toFixed(2)));
                }
            }
            if (shrink && String(newBeamItem.shrinkage || "") !== shrink) {
                setNewBeamItem(prev => ({ ...prev, shrinkage: shrink }));
            }
        }
    }, [fabricCodeQualityVal, fabricByCode, items, showAddBeamForm, orderTypeId, newBeamItem.shrinkage]);

    useEffect(() => {
        if (orderTypeId !== "1" && !isEditMode && weavingJobWorkOrderId) {
            const wo = normalizedJobOrders.find((w: any) => String(w.id) === String(weavingJobWorkOrderId));
            if (wo) {
                let code = '';
                let quality = '';

                if (Array.isArray(wo.items) && wo.items.length) {
                    const it = wo.items[0] || {};
                    const recCode = it.fabricCodeId != null ? fabricById.get(Number(it.fabricCodeId)) : undefined;
                    const recQual = it.fabricQualityId != null ? fabricById.get(Number(it.fabricQualityId)) : undefined;
                    if (recCode || recQual) {
                        code = recCode?.fabricCode || code;
                        quality = recQual?.fabricQuality || quality;
                    }
                    if (!code || !quality) {
                        code = code || it.fabricCode || it.fabric || '';
                        quality = quality || it.quality || it.fabricQuality || '';
                    }
                }

                if ((!code && wo.fabricCode) || (!quality && wo.quality)) {
                    code = code || wo.fabricCode || '';
                    quality = quality || wo.quality || '';
                }

                if ((!code || !quality) && wo.fabricDetails && typeof wo.fabricDetails === 'string') {
                    const parts = String(wo.fabricDetails).split(' - ');
                    code = code || parts[0] || '';
                    quality = quality || parts[1] || '';
                }

                const txt = [code, quality].filter(Boolean).join(' - ');
                if (txt) setValue('fabricCodeQuality', txt);
            }
        }
    }, [orderTypeId, isEditMode, weavingJobWorkOrderId, normalizedJobOrders, fabricById, setValue]);

    return (
        <div className="mt-10 p-6 bg-white shadow-md rounded-lg">
            <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            try { sessionStorage.removeItem('factoryBeamInwardEdit'); } catch {}
                            navigate("/transaction/factory-beam-inward");
                        }}
                        className="mr-auto"
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Back
                    </Button>
                    <h2 className="text-2xl font-semibold">Factory Beam Inward</h2>
                </div>

            </div>

            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('vendorDetails')}
                                className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'vendorDetails'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 Inward Ordershover:border-gray-300'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                Sizing Vendor Details
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Vendor Details */}
                {activeTab === "vendorDetails" && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 ">
                                    <FileText size={20} />Sizing Vendor Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-4 gap-8">
                              <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Factory Beam Inward No</label>
                                <input
                                  type="text"
                                  placeholder="Loading sequence..."
                                  
                                  className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                                    !watch('beamInwardNo') || watch('beamInwardNo')?.startsWith('Loading')
                                      ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                                      : 'text-gray-800 font-medium border-gray-300'
                                  }`}
                                  {...register('beamInwardNo')}
                                />
                              </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Beam Inward Date</label>
                                    <input
                                        type="date"
                                        {...register("beamInwardDate", { required: "Beam Inward Date is required" })}
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="input mt-1"
                                        readOnly={isEditMode}
                                    />
                                    {errors.beamInwardDate && (
                                        <p className="mt-1 text-sm text-red-600">{errors.beamInwardDate.message}</p>
                                    )}
                                </div>
                                {orderTypeId === "1" && (
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Weaving Contract No</label>
                                        <CommonSearchableSelect
                                            className="mt-1"
                                            placeholder="Select Weaving Contract"
                                            options={weavingContractOptions}
                                            value={watch('weavingContractId') || ''}
                                            {...register('weavingContractId')}
                                            disabled={isEditMode}
                                            onValueChange={(value) => {
                                                setValue('weavingContractId', value, { shouldValidate: true });
                                                if (orderTypeId === '1' && value) {
                                                    const contract = normalizedWeavingContracts.find((wc: any) => String(wc.id) === String(value));
                                                    if (contract?.vendorId) {
                                                        setValue('sizingVendorId', String(contract.vendorId), { shouldValidate: true });
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Weaving Jobwork Order No/Buyer</label>
                                    <CommonSearchableSelect
                                        className="mt-1"
                                        placeholder="Select Weaving Jobwork Order"
                                        options={jobWorkOrderOptions}
                                        value={watch('weavingJobWorkOrderId') || ''}
                                        {...register('weavingJobWorkOrderId')}
                                        disabled={isEditMode}
                                        onValueChange={(value) => setValue('weavingJobWorkOrderId', value, { shouldValidate: true })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700"> Sizing Vendor <span className="text-red-500">*</span> </label>
                                    <CommonSearchableSelect
                                        className="mt-1"
                                        placeholder="Select a Sizing Vendor"
                                        options={sizingVendorOptions}
                                        filterActive
                                        value={watch('sizingVendorId') || ''}
                                        {...register("sizingVendorId", { required: "Vendor is required" })}
                                        disabled={isEditMode}
                                        onValueChange={(value) => setValue('sizingVendorId', value, { shouldValidate: true })}
                                        error={errors.sizingVendorId?.message as string}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">DC No</label>
                                    <input {...register('dcNo')} className="input mt-1" placeholder="Enter DC No" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">DC Date</label>
                                    <input type="date" {...register('dcDate')} className="input mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Sizing Set No</label>
                                    <input
                                        {...register('sizingSetNo')}
                                        className="input mt-1"
                                        placeholder="Enter Sizing Set No"
                                        disabled={orderTypeId === "1" && isEditMode}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Sort No - Construction</label>
                                    <input
                                        {...register('fabricCodeQuality')}
                                        className="input mt-1"
                                        placeholder="FABRIC-XXXXX - QUALITY"
                                        disabled={orderTypeId === "1" && isEditMode}
                                        readOnly={isEditMode}
                                    />
                                </div>

                            </CardContent>
                        </Card>
                       
                    </>
                )}

                {/* Beam Details Section */}
                <Card>
                    <div className="flex flex-row p-6 justify-between">
                        <div className="flex items-center gap-2">
                            <ClipboardList size={20} /> Beam Details
                        </div>
                        <div className="">
                            <Button
                                type="button"
                                onClick={() => setShowAddBeamForm(true)}
                                className="bg-primary hover:bg-primary text-white"
                                disabled={showAddBeamForm}
                            >
                                <Plus size={18} className="mr-2" />
                                Add Beam
                            </Button>
                        </div>
                    </div>
                    <CardContent>
                        {/* Add New Beam Form Section */}
                        {showAddBeamForm && (
                            <div className="mt-4 p-4 border rounded-md mb-6 bg-blue-50">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">Add New Beam</h3>
                                    <Button
                                        type="button"
                                        onClick={handleRemoveNewBeamForm}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <X size={18} />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-9 gap-4 items-end">

                                    <div>
                                        <label className="block text-sm font-medium">Empty Beam No / HFPL Beam No *</label>
                                        <CommonSearchableSelect
                                            className="mt-1 bg-white"
                                            placeholder="Select"
                                            options={addBeamFlangeSelectOptions}
                                            filterActive
                                            value={resolveFlangeSelectionValue(newBeamItem.flangeId, newBeamItem.flangeNo)}
                                            // disabled={isEditMode}
                                            onValueChange={(value) => {
                                                const source = orderTypeId === "1" ? savedBeamFlanges : flangeOptions;
                                                const sel = source.find((fl: any) => String(fl.id) === String(value));
                                                setNewBeamItem({ ...newBeamItem, flangeNo: sel?.flangeNo || "", flangeId: sel ? String(sel.id) : "" });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Sized Beam No *</label>
                                        <input
                                            type="text"
                                            value={newBeamItem.sizedBeamNo}
                                            onChange={handleSizedBeamNoChange}
                                            onKeyDown={(e) => {
                                                if (e.key === ' ') e.preventDefault();
                                            }}
                                            className="input mt-1"
                                            placeholder="Enter Sized Beam No"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Warp Meters</label>
                                        <input
                                            type="number"
                                            value={newBeamItem.wrapMeters}
                                            onChange={(e) => setNewBeamItem({ ...newBeamItem, wrapMeters: e.target.value })}
                                            className="input mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Actual Ends</label>
                                        <input
                                            type="number"
                                            value={newBeamItem.actualEnds || ""}
                                            onChange={(e) => setNewBeamItem({ ...newBeamItem, actualEnds: e.target.value })}
                                            className="input mt-1"
                                            placeholder="Auto from Quality"
                                            
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Shrinkage %</label>
                                        <input
                                            type="number"
                                            value={newBeamItem.shrinkage}
                                            onChange={(e) => setNewBeamItem({ ...newBeamItem, shrinkage: e.target.value })}
                                            className="input mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Expected Fabric Meter</label>
                                        <input
                                            type="number"
                                            value={newBeamItem.expectedFabricMeter}
                                            onChange={(e) => setNewBeamItem({ ...newBeamItem, expectedFabricMeter: e.target.value })}
                                            className="input mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Fabric Panel Width</label>
                                        <input
                                            type="number"
                                            value={newBeamItem.fabricPanelWidth || ""}
                                            onChange={(e) => setNewBeamItem({ ...newBeamItem, fabricPanelWidth: e.target.value })}
                                            className="input mt-1"
                                            readOnly={newBeamItem.isBeamCut === "1" || newBeamItem.isProductionCompleted === "1"}
                                            // readOnly={newBeamItem.isBeamCut === "1"}
                                        />
                                    </div>
                                    
                                </div>
                                <div className="flex justify-end mt-4 space-x-2">
                                    {/* <Button
                                        type="button"
                                        onClick={handleRemoveNewBeamForm}
                                        variant="outline"
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Remove
                                    </Button> */}
                                    <Button
                                        type="button"
                                        onClick={handleSaveNewBeam}
                                        className="bg-primary hover:bg-primary text-white"
                                    >
                                        <Save size={18} className="mr-2" />
                                        Save Beam
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Existing Beam Summary */}
                        <table className="w-full border-collapse border border-gray-300 text-center">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2">Sl.No</th>
                                   
                                    <th className="border p-2">Empty Beam No / HFPL Beam No</th>
                                    <th className="border p-2">Sized Beam No</th>
                                    <th className="border p-2">Warp Meters</th>
                                    <th className="border p-2">Shrinkage %</th>
                                    <th className="border p-2">Expected Fabric Meter</th>
                                    <th className="border p-2">Fabric Panel Width</th>
                                    <th className="border p-2">Actual Ends</th>
                                    <th className="border p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {beamItems.map((item, index) => (
                                    <tr key={index} className="border">
                                        <td className="border p-2">{index + 1}</td>
                                        {/* <td className="border p-2">
                                            {weavingContractList?.find((wc: any) => wc.id === parseInt(item.weavingContractId))?.weavingContractNo || item.weavingContractId}
                                        </td> */}
                                        {/* <td className="border p-2">{item.beamNo || ""}</td> */}
                                         <td className="border p-2">
                                            <CommonSearchableSelect
                                                className="mt-1 w-full"
                                                placeholder="Select"
                                                options={flangeSelectOptions}
                                                value={resolveFlangeSelectionValue(item.flangeId, item.flangeNo)}
                                                disabled={isEditMode}
                                                onValueChange={(value) => handleEditFlangeChange(index, value)}
                                            />
                                        </td>
                                     
                                        <td className="border p-2">
                                            <input 
                                                // disabled={isEditMode}
                                                type="text"
                                                value={item.sizedBeamNo || ""}
                                                onChange={(e) => handleEditSizedBeamNo(index, e)}
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ') e.preventDefault();
                                                }}
                                                className="input mt-1 w-full text-center"
                                                placeholder="Enter Sized Beam No"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                            />
                                        </td>
                                        <td className="border p-2">{item.wrapMeters}</td>
                                        <td className="border p-2">{item.shrinkage}</td>
                                        <td className="border p-2">{item.expectedFabricMeter}</td>
                                  
                                        <td className="border p-2">
                                            <input
                                                type="number"
                                                value={item.fabricPanelWidth || ""}
                                                onChange={(e) => setBeamItems(prev => prev.map((beam, i) => {
                                                    if (i !== index) return beam;
                                                    const updatedFabricPanelWidth = e.target.value;
                                                    return {
                                                        ...beam,
                                                        fabricPanelWidth: updatedFabricPanelWidth,
                                                        expectedFabricMeter: computeExpectedFabricMeter(beam.wrapMeters, beam.shrinkage, updatedFabricPanelWidth),
                                                    };
                                                }))}
                                                className="input mt-1 w-full"
                                                readOnly={item.isBeamCut === "1" || item.isProductionCompleted === "1"}
                                                // readOnly={item.isBeamCut === "1"}
                                            />
                                        </td>
                                        <td className="border p-2">{item.actualEnds || ""}</td>
                                        <td className="border p-2">
                                            <Button
                                                type="button"
                                                onClick={() => deleteBeamItem(index)}
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <X size={18} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
            <div className="flex justify-end mt-4">
                <Button
                    onClick={handleSubmit(onSubmit)}
                    className="bg-primary hover:bg-primary text-white px-6 flex items-center"
                >
                    <Save size={18} className="mr-2" />
                    {beamInwardDtl?.id ? "Update Factory Beam Inward" : "Save Factory Beam Inward"}
                </Button>
                </div>
        </div>
    );
};

export default FactoryBeamInwardEntry;