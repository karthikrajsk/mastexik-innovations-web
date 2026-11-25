// import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
// import { FileText, ShoppingCart, ClipboardList, Plus, Edit, Trash2, Save, ArrowLeft } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { toast } from "react-toastify";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useForm } from "react-hook-form";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/state/store";
// import { useLocation, useNavigate } from "react-router-dom";
// import { getAllFabricMasters } from "@/state/fabricMasterSlice";
// import { getAllVendors } from "@/state/vendorSlice";
// import { getAllYarnMasters } from "@/state/yarnSlice";
// import { getAllWeavingContract } from "@/state/weavingContractSlice";
// import { getAllSalesOrders } from "@/state/salesOrderSlice";
// import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
// import { getAllTermsConditions } from "@/state/termsConditions";
// import { getAllCompanies } from "@/state/company-master-slice";
// import { useAuth } from "@/contexts/AuthContext";
// import { VENDOR_TYPE_ALL, filterVendorsByTypeIds } from "@/utils/vendorFilters";
// import documentNumberService from "@/services/DocumentNumberService";
// import { createSizingPlan, updateSizingPlan } from "@/state/sizingPlanSlice";
// import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
// import { useMappingStatus } from "@/hooks/useMappingStatus";

// // Interface Definitions
// interface SizingPlanEntryFormData {
//     id?: number;
//     vendorId: string;
//     orderTypeId: string;
//     termsConditionsId: string;
//     paymentTermsId: string;
//     sizingRate: string;
//     emptyBeamNo: string;
//     remarks: string;
//     sizingPlanNo: string;
//     sizingPlanDate: string;
//     sizingQualityDetails: SizingQualityDetails[];
//     sizingBeamDetails: SizingBeamDetails[];
// }

// interface SizingQualityDetails {
//     id?: number | null;
//     fabricId?: string;
//     quality: string;
//     fabricCode: string;
//     yarnId: string;
//     actualYarn: string;
//     sordEnds: string;
//     actualEnds: string;
//     warpEnds: string;
//     actualWarpEnds: string;
//     parts: string;
//     endsPerPart: string;
//     warpMeters: string;
//     fabricPanelWidth?: string;
// }

// interface SizingBeamDetails {
//     id?: number | null;
//     weavingContractId: string;
//     salesOrderId: string;
//     weavingVendorId: string;
//     warpMeters: string;
//     shrinkage: string;
//     expectedFabricMeter: string;
//     fabricPanelWidth?: string;
//     fabricId?: string;
// }

// interface SummaryRow {
//     yarnKey: string;
//     yarnLabel: string;
//     actualEnds: number;
//     parts: number;
//     endsPerPart: number;
//     rawWarpMeters: number;
//     warpMetersAfterShrink: number;
// }

// interface FabricMaster {
//     id: number;
//     fabricCode: string;
//     fabricName: string;
//     fabricQuality: string;
//     totalEnds: number;
//     warpDetails?: Array<{
//         yarnId: number;
//         epi?: number;
//         warpMeters?: number;
//         gramsPerMeter?: number;
//     }>;
// }

// interface YarnMaster {
//     id: number;
//     yarnName: string;
// }

// interface WeavingContract {
//     id: number;
//     weavingContractNo: string;
//     salesOrderNo: number;
//     vendorId?: number;
//     items?: Array<{
//         fabricCodeId: number;
//     }>;
// }

// interface NewQuality {
//     fabricId: string;
//     quality: string;
//     fabricCode: string;
//     sordEnds: string;
//     actualEnds: string;
//     fabricPanelWidth: string;
// }

// interface LayerData {
//     yarnId: string;
//     yarnName: string;
//     warpEnds: string;
//     warpMeters: string;
//     actualYarn: string;
//     actualWarpEnds: string;
//     parts: string;
//     endsPerPart: string;
// }

// const SIZING_VENDOR_TYPE_ID = 302;
// const SIZING_VENDOR_TYPE_IDS = [SIZING_VENDOR_TYPE_ID, VENDOR_TYPE_ALL];

// const SizingPlanEntry = () => {
//     const [items, setItems] = useState<SizingQualityDetails[]>([]);
//     const [beamItems, setBeamItems] = useState<SizingBeamDetails[]>([]);
//     const [newQuality, setNewQuality] = useState<NewQuality>({
//         fabricId: "",
//         quality: "",
//         fabricCode: "",
//         sordEnds: "",
//         actualEnds: "",
//         fabricPanelWidth: "1",
//     });
//     const [layerData, setLayerData] = useState<LayerData[]>([]);
//     const [editingIndex, setEditingIndex] = useState<number | null>(null);
//     const [editingFabricId, setEditingFabricId] = useState<string | null>(null);
//     const [currentWarpDetails, setCurrentWarpDetails] = useState<any[]>([]);
//     const [formError, setFormError] = useState("");

//     const { vendorList } = useSelector((state: RootState) => state.vendor);

//     const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
//     const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
//     const { yarnList } = useSelector((state: RootState) => state.yarn);
//     const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
//     const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions);
//     const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
//     const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);

//     const dispatch = useDispatch<AppDispatch>();
//     const location = useLocation();
//     const sizingPlanDtl = location.state?.sizingPlanDtl;
//     const fromOrderEntry = location.state?.source === "order-entry-management";
//     const navigate = useNavigate();
//     const [activeTab, setActiveTab] = useState("vendorDetails");
//     const [numberOfBeams, setNumberOfBeams] = useState<string>('0');
//     const [beamInputs, setBeamInputs] = useState<SizingBeamDetails[]>([]);
//     const [filteredVendorList, setFilteredVendorList] = useState<any[]>([]);
//     const { selectedCompany } = useAuth();

//     const { isMapped: isPlanMapped } = useMappingStatus({
//         endpoint: "/sizing-plan/",
//         id: sizingPlanDtl?.id,
//         enabled: !!sizingPlanDtl?.id,
//     });

//     const isSavingRef = useRef(false);
//     const hasGeneratedNumberRef = useRef(false);
//     const {
//         register,
//         handleSubmit,
//         reset,
//         watch,
//         setValue,
//         getValues,
//         formState: { errors, isValid }
//     } = useForm<SizingPlanEntryFormData>({
//         mode: 'onBlur',
//         reValidateMode: 'onBlur'
//     });

//     const orderTypeId = watch('orderTypeId');
//     const vendorIdVal = watch('vendorId');

//     const normalizedFabricMasters = useMemo(() => {
//         let list = [];
//         if (Array.isArray(fabricMasterList)) list = fabricMasterList;
//         else if (Array.isArray((fabricMasterList as any)?.data)) list = (fabricMasterList as any).data;
//         return list.filter((f: any) => f.isActive !== false && f.activeFlag !== false);
//     }, [fabricMasterList]);

//     const normalizedYarnMasters = useMemo(() => {
//         let list = [];
//         if (Array.isArray(yarnList)) list = yarnList;
//         else if (Array.isArray((yarnList as any)?.data)) list = (yarnList as any).data;
//         return list.filter((y: any) => y.isActive !== false && y.activeFlag !== false);
//     }, [yarnList]);

//     const normalizedWeavingContracts = useMemo(() => {
//         let list = [];
//         if (Array.isArray(weavingContractList)) list = weavingContractList;
//         else if (Array.isArray((weavingContractList as any)?.data)) list = (weavingContractList as any).data;
//         return list.filter((c: any) => c.isActive !== false && c.activeFlag !== false);
//     }, [weavingContractList]);

//     const normalizedSalesOrders = useMemo(() => {
//         let list = [];
//         if (Array.isArray(salesOrderList)) list = salesOrderList;
//         else if (Array.isArray((salesOrderList as any)?.data)) list = (salesOrderList as any).data;
//         return list.filter((s: any) => s.isActive !== false && s.activeFlag !== false);
//     }, [salesOrderList]);

//     const normalizedTermsConditions = useMemo(() => {
//         let list = [];
//         if (Array.isArray(termsContitionsList)) list = termsContitionsList;
//         else if (Array.isArray((termsContitionsList as any)?.data)) list = (termsContitionsList as any).data;
//         return list.filter((t: any) => t.isActive !== false && t.activeFlag !== false);
//     }, [termsContitionsList]);

//     const normalizedPaymentTerms = useMemo(() => {
//         let list = [];
//         if (Array.isArray(paymentTermsList)) list = paymentTermsList;
//         else if (Array.isArray((paymentTermsList as any)?.data)) list = (paymentTermsList as any).data;
//         return list.filter((p: any) => p.isActive !== false && p.activeFlag !== false);
//     }, [paymentTermsList]);

//     const normalizedVendors = useMemo(() => {
//         let list = [];
//         if (Array.isArray(vendorList)) list = vendorList;
//         else if (Array.isArray((vendorList as any)?.data)) list = (vendorList as any).data;
//         return list.filter((v: any) => v.isActive !== false && v.activeFlag !== false);
//     }, [vendorList]);

//     const sizingVendors = useMemo(
//         () => filterVendorsByTypeIds(vendorList, SIZING_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null }),
//         [vendorList]
//     );

//     const weaverVendorList = useMemo(
//         () => filterVendorsByTypeIds(vendorList, [303, VENDOR_TYPE_ALL], { includeAllVendorTypeId: null }),
//         [vendorList]
//     );
//     // Generate document number for new entries
//     useEffect(() => {
//         const generateDocNo = async () => {
//             if (sizingPlanDtl || hasGeneratedNumberRef.current) return;

//             try {
//                 const res = await documentNumberService.generateDocumentNumber({
//                     screenName: "Sizing Plan",
//                 });
//                 setValue('sizingPlanNo', res.documentNumber);
//                 hasGeneratedNumberRef.current = true;
//             } catch (err) {
//                 console.error("Failed to generate sizing plan number:", err);
//             }
//         };
//         generateDocNo();
//     }, [sizingPlanDtl, setValue]);

//     // Cleanup on unmount or beforeunload
//     useEffect(() => {
//         const handleBeforeUnload = () => {
//             if (hasGeneratedNumberRef.current && !isSavingRef.current && !sizingPlanDtl) {
//                 documentNumberService.clearMemoryCache('Sizing Plan');
//             }
//         };
//         window.addEventListener('beforeunload', handleBeforeUnload);
//         return () => {
//             window.removeEventListener('beforeunload', handleBeforeUnload);
//             if (hasGeneratedNumberRef.current && !isSavingRef.current && !sizingPlanDtl) {
//                 documentNumberService.clearMemoryCache('Sizing Plan');
//             }
//         };
//     }, [sizingPlanDtl]);

//     const resolvedCompanyId = useMemo(() => {
//         if (selectedCompany != null && !Number.isNaN(Number(selectedCompany))) {
//             return Number(selectedCompany);
//         }
//         const stored = window.localStorage.getItem('selectedCompanyId') || window.localStorage.getItem('selectedCompany');
//         if (!stored) return undefined;
//         const parsed = Number(stored);
//         return Number.isNaN(parsed) ? undefined : parsed;
//     }, [selectedCompany]);

//     const selectedVendor = useMemo(() => {
//         if (!vendorIdVal) return null;
//         const base = Array.isArray(vendorList) ? vendorList : [];
//         return base.find((v: any) => String(v?.id) === String(vendorIdVal)) || null;
//     }, [vendorList, vendorIdVal]);

//     const selectedVendorInFiltered = useMemo(() => {
//         if (!selectedVendor) return false;
//         return filteredVendorList.some((v: any) => Number(v?.id) === Number(selectedVendor.id));
//     }, [filteredVendorList, selectedVendor]);

//     const allBeams = useMemo(() => {
//         const validInputs = beamInputs.filter(beam =>
//             beam.weavingContractId && beam.salesOrderId && beam.weavingVendorId && beam.warpMeters && beam.shrinkage
//         );
//         return [...beamItems, ...validInputs];
//     }, [beamItems, beamInputs]);



//     const normalizeName = useCallback((value?: string | number | null) => {
//         if (value === undefined || value === null) {
//             return "";
//         }
//         return String(value).toLowerCase().replace(/[\s\W]+/g, "");
//     }, []);

//     const companyOptions = useMemo(() => {
//         if (Array.isArray(companyMasterList)) return companyMasterList;
//         if (Array.isArray(companyMasterList?.data)) return companyMasterList.data;
//         return [];
//     }, [companyMasterList]);

//     const companyNameLookup = useMemo(() => {
//         const map = new Map<string, number>();
//         companyOptions.forEach((company: any) => {
//             const id = company?.id ?? company?.companyId;
//             if (!id) return;
//             const candidates = [company?.companyName, company?.name, company?.legalName, company?.displayName];
//             candidates.forEach((name) => {
//                 const key = normalizeName(name);
//                 if (key && !map.has(key)) {
//                     map.set(key, Number(id));
//                 }
//             });
//         });
//         return map;
//     }, [companyOptions, normalizeName]);


//     const resolveFactoryCompanyId = useCallback(
//         (vendor?: any) => {
//             if (!vendor) return null;
//             const directIds = [vendor?.companyId, vendor?.company?.id, vendor?.company?.companyId].filter(
//                 (id) => id !== undefined && id !== null
//             );
//             for (const directId of directIds) {
//                 const matched = companyOptions.find(
//                     (company: any) => String(company?.id ?? company?.companyId) === String(directId)
//                 );
//                 if (matched) {
//                     return Number(matched.id ?? matched.companyId);
//                 }
//             }
//             const nameCandidates = [vendor?.vendorName, vendor?.customerName, vendor?.companyName, vendor?.name];
//             for (const name of nameCandidates) {
//                 const key = normalizeName(name);
//                 if (key && companyNameLookup.has(key)) {
//                     return companyNameLookup.get(key) ?? null;
//                 }
//             }
//             return null;
//         },
//         [companyOptions, companyNameLookup, normalizeName]
//     );


//     const isFormValid = isValid &&
//         items.length > 0 &&
//         items.every((item: SizingQualityDetails) =>
//             item.quality && item.yarnId && item.sordEnds
//         ) &&
//         allBeams.length > 0;

//     // const isFormValid = isValid &&
//     //     items.length > 0 &&
//     //     items.every((item: SizingQualityDetails) =>
//     //         item.quality && item.yarnId && item.sordEnds
//     //     );

//     const collectMissingMandatoryFields = useCallback(() => {
//         const values = getValues();
//         const missing = new Set<string>();
//         const flagEmpty = (value: any, label: string) => {
//             if (value == null || (typeof value === "string" && value.trim() === "")) {
//                 missing.add(label);
//             }
//         };

//         flagEmpty(values.sizingPlanDate, "Sizing Plan Date");
//         flagEmpty(values.orderTypeId, "Order Type");
//         flagEmpty(values.vendorId, "Sizing Vendor");
//         flagEmpty(values.sizingRate, "Sizing Rate/KG");
//         flagEmpty(values.termsConditionsId, "Terms & Conditions");
//         flagEmpty(values.paymentTermsId, "Payment Terms");

//         if (items.length === 0) {
//             missing.add("Quality Details (Fabric Code/Quality + Beam Ends)");
//         } else {
//             const needsFabricCode = items.some((item) => {
//                 const hasCode = (item.fabricCode && item.fabricCode.trim()) || item.fabricId;
//                 return !hasCode;
//             });
//             if (needsFabricCode) {
//                 missing.add("Fabric Code/Quality for each quality row");
//             }

//             const needsActualEnds = items.some((item) => {
//                 const value = item.actualEnds;
//                 return value == null || value.toString().trim() === "";
//             });
//             if (needsActualEnds) {
//                 missing.add("Beam Ends for each quality row");
//             }

//             const needsActualYarn = items.some((item) => {
//                 const value = item.actualYarn;
//                 return value == null || value.toString().trim() === "";
//             });
//             if (needsActualYarn) {
//                 missing.add("Actual Yarn for each yarn row");
//             }

//             const needsActualWarpEnds = items.some((item) => {
//                 const value = item.actualWarpEnds;
//                 return value == null || value.toString().trim() === "";
//             });
//             if (needsActualWarpEnds) {
//                 missing.add("Actual Warp Ends for each yarn row");
//             }

//             const needsParts = items.some((item) => {
//                 const value = item.parts;
//                 return value == null || value.toString().trim() === "";
//             });
//             if (needsParts) {
//                 missing.add("Parts (Warp Beam) for each yarn row");
//             }
//         }

//         return Array.from(missing);
//     }, [getValues, items]);


//     useEffect(() => {
//         const filtered = orderTypeId === '1'
//             ? sizingVendors.filter((v: any) => Number(v?.isInternalVendor) === 1)
//             : orderTypeId === '2'
//                 ? sizingVendors.filter((v: any) => Number(v?.isInternalVendor) === 0)
//                 : [];
//         setFilteredVendorList(filtered);
//     }, [sizingVendors, orderTypeId]);

//     useEffect(() => {
//         setValue('sizingPlanNo', sizingPlanDtl?.sizingPlanNo || "", { shouldValidate: true });
//         if (sizingPlanDtl?.vendorId && Array.isArray(vendorList)) {
//             const v = vendorList.find((x: any) => x.id === sizingPlanDtl.vendorId);
//             if (v) setValue('orderTypeId', Number(v?.isInternalVendor) === 1 ? '1' : '2', { shouldValidate: true });
//             // Ensure vendor dropdown preselects saved vendor
//             setValue('vendorId', String(sizingPlanDtl.vendorId), { shouldValidate: true });
//         }
//     }, [sizingPlanDtl, vendorList, setValue]);

//     useEffect(() => {
//         const scopedParams = resolvedCompanyId ? { companyId: resolvedCompanyId,fetchAll: true } : {fetchAll: true};
//         dispatch(getAllVendors(scopedParams));
//         dispatch(getAllYarnMasters({ fetchAll: true }));
//         dispatch(getAllWeavingContract(scopedParams));
//         dispatch(getAllSalesOrders(scopedParams));
//         dispatch(getAllPaymentTerms({ fetchAll: true }));
//         dispatch(getAllTermsConditions({ fetchAll: true }));
//         dispatch(getAllFabricMasters({ fetchAll: true }));
//         dispatch(getAllCompanies({fetchAll: true}));
//     }, [dispatch, resolvedCompanyId]);

//     useEffect(() => {
//         if (sizingPlanDtl) {
//             reset({
//                 vendorId: sizingPlanDtl.vendorId ? String(sizingPlanDtl.vendorId) : "",
//                 orderTypeId: sizingPlanDtl.orderTypeId ? String(sizingPlanDtl.orderTypeId) : "",
//                 termsConditionsId: sizingPlanDtl.termsConditionsId ? String(sizingPlanDtl.termsConditionsId) : "",
//                 paymentTermsId: sizingPlanDtl.paymentTermsId ? String(sizingPlanDtl.paymentTermsId) : "",
//                 sizingRate: sizingPlanDtl.sizingRate ? String(sizingPlanDtl.sizingRate) : "",
//                 emptyBeamNo: sizingPlanDtl.emptyBeamNo || "",
//                 remarks: sizingPlanDtl.remarks || "",
//                 sizingPlanDate: sizingPlanDtl.sizingPlanDate || new Date().toISOString().split('T')[0],
//             });

//             if (Array.isArray(sizingPlanDtl.sizingQualityDetails)) {
//                 setItems(sizingPlanDtl.sizingQualityDetails.map((item: any) => {
//                     let resolvedFabricId: string = item.fabricId ? String(item.fabricId) : "";
//                     if (!resolvedFabricId && item.fabricCode && Array.isArray(normalizedFabricMasters)) {
//                         const fm = normalizedFabricMasters.find((f: any) => String(f.fabricCode) === String(item.fabricCode));
//                         if (fm?.id != null) resolvedFabricId = String(fm.id);
//                     }
//                     const latestFabric = resolvedFabricId ? normalizedFabricMasters.find((f: any) => String(f.id) === resolvedFabricId) : null;
//                     return {
//                         id: item.id || null,
//                         fabricId: resolvedFabricId,
//                         quality: latestFabric ? latestFabric.fabricQuality : (item.quality || ""),
//                         fabricCode: latestFabric ? latestFabric.fabricCode : (item.fabricCode || ""),
//                         yarnId: item.yarnId ? String(item.yarnId) : "",
//                         actualYarn: item.actualYarn ? String(item.actualYarn) : "",
//                         sordEnds: item.sordEnds ? String(item.sordEnds) : "",
//                         actualEnds: item.actualEnds ? String(item.actualEnds) : "",
//                         warpEnds: item.warpEnds ? String(item.warpEnds) : "",
//                         actualWarpEnds: item.actualWarpEnds ? String(item.actualWarpEnds) : "",
//                         parts: item.parts ? String(item.parts) : "",
//                         endsPerPart: item.endsPerPart ? String(item.endsPerPart) : "",
//                         warpMeters: item.warpMeters ? String(item.warpMeters) : "",
//                         fabricPanelWidth: String(item.fabricPanelWidth || "1")
//                     } as SizingQualityDetails;
//                 }));
//             } else {
//                 setItems([]);
//             }

//             if (Array.isArray(sizingPlanDtl.sizingBeamDetails)) {
//                 const planWidthLocal = String((Array.isArray(sizingPlanDtl.sizingQualityDetails) && sizingPlanDtl.sizingQualityDetails.find((i: any) => i?.fabricPanelWidth != null && i.fabricPanelWidth !== "")?.fabricPanelWidth) || "1");
//                 setBeamItems(sizingPlanDtl.sizingBeamDetails.map((beam: any) => ({
//                     id: beam.id || null,
//                     weavingContractId: beam.weavingContractId ? String(beam.weavingContractId) : "",
//                     salesOrderId: beam.salesOrderId ? String(beam.salesOrderId) : "",
//                     weavingVendorId: beam.weavingVendorId ? String(beam.weavingVendorId) : (beam.vendorId ? String(beam.vendorId) : ""),
//                     warpMeters: beam.warpMeters ? String(beam.warpMeters) : "",
//                     shrinkage: beam.shrinkage != null ? String(beam.shrinkage) : "7.5",
//                     expectedFabricMeter: beam.expectedFabricMeter != null ? String(beam.expectedFabricMeter) : "",
//                     fabricPanelWidth: String(beam.fabricPanelWidth ?? planWidthLocal),
//                     fabricId: beam.fabricId ? String(beam.fabricId) : "",
//                 })));
//             } else {
//                 setBeamItems([]);
//             }
//         } else {
//             reset({
//                 sizingPlanDate: new Date().toISOString().split('T')[0]
//             });
//         }
//     }, [sizingPlanDtl, reset, fabricMasterList]);

//     const handleFabricSelection = useCallback((fabricId: string) => {
//         setFormError("");
//         const fabric = fabricMasterList.find((f: FabricMaster) => f.id === parseInt(fabricId));
//         if (fabric) {
//             const warpDetails = fabric.warpDetails || [];
//             setNewQuality({
//                 fabricId,
//                 quality: fabric.fabricQuality,
//                 fabricCode: fabric.fabricCode,
//                 sordEnds: fabric.totalEnds ? String(fabric.totalEnds) : "",
//                 actualEnds: fabric.totalEnds ? String(Math.round((fabric.totalEnds || 0) * (parseFloat("1") || 1))) : "",
//                 fabricPanelWidth: "1",
//             });
//             const layers: LayerData[] = warpDetails.map((wd: any) => {
//                 const yarnName = yarnList.find((y: YarnMaster) => y.id === wd.yarnId)?.yarnName || "";
//                 const epi = wd.epi ? Math.round(wd.epi) : 0;
//                 const warpMetersNum = wd.warpMeters ? Math.round(wd.warpMeters) : 0;
//                 return {
//                     yarnId: String(wd.yarnId),
//                     yarnName,
//                     warpEnds: String(epi),
//                     warpMeters: String(warpMetersNum),
//                     actualYarn: String(wd.yarnId),
//                     actualWarpEnds: String(epi),
//                     parts: "",
//                     endsPerPart: "",
//                 };
//             });
//             setLayerData(layers);
//             setCurrentWarpDetails(warpDetails);
//         } else {
//             setNewQuality({
//                 fabricId,
//                 quality: "",
//                 fabricCode: "",
//                 sordEnds: "",
//                 actualEnds: "",
//                 fabricPanelWidth: "1",
//             });
//             setLayerData([]);
//             setCurrentWarpDetails([]);
//         }
//     }, [fabricMasterList, yarnList]);

//     useEffect(() => {
//         if (sizingPlanDtl || !fromOrderEntry) return;

//         const state = (location.state || {}) as any;
//         const selectedSalesOrderNo = state?.salesOrderNo ?? state?.salesOrderData?.salesOrderNo;
//         const selectedSalesOrderId = state?.salesOrderId;

//         const matchedSalesOrder = normalizedSalesOrders.find((order: any) => {
//             if (!order) return false;
//             if (selectedSalesOrderId && String(order?.id) === String(selectedSalesOrderId)) return true;
//             if (selectedSalesOrderNo && String(order?.salesOrderNo) === String(selectedSalesOrderNo)) return true;
//             return false;
//         });

//         const firstOrderItem = matchedSalesOrder?.items?.[0];
//         const stateFabricCode = state?.salesOrderData?.fabricCode;
//         const stateQuality = state?.salesOrderData?.quality;
//         const orderFabricCode = firstOrderItem?.fabricCode;
//         const orderFabricId = firstOrderItem?.fabricCodeId;
//         const orderQuality = firstOrderItem?.quality || firstOrderItem?.buyerProduct;

//         const matchedFabric = normalizedFabricMasters.find((fabric: FabricMaster) => {
//             if (orderFabricId && String(fabric?.id) === String(orderFabricId)) return true;
//             if (orderFabricCode && String(fabric?.fabricCode) === String(orderFabricCode)) return true;
//             if (stateFabricCode && String(fabric?.fabricCode) === String(stateFabricCode)) return true;
//             if (orderQuality && String(fabric?.fabricQuality) === String(orderQuality)) return true;
//             if (stateQuality && String(fabric?.fabricQuality) === String(stateQuality)) return true;
//             return false;
//         });

//         if (matchedFabric?.id) {
//             handleFabricSelection(String(matchedFabric.id));
//         }
//     }, [fromOrderEntry, handleFabricSelection, location.state, normalizedFabricMasters, normalizedSalesOrders, sizingPlanDtl]);

//     const updateLayerField = (idx: number, field: keyof LayerData, value: string) => {
//         setLayerData((prev) => {
//             const newData = prev.map((l, i) =>
//                 i === idx ? { ...l, [field]: value } : l
//             );
//             if (field === "actualWarpEnds" || field === "parts") {
//                 const aw = parseFloat(newData[idx].actualWarpEnds) || 0;
//                 const p = parseFloat(newData[idx].parts) || 0;
//                 const epp = p > 0 ? Math.round(aw / p) : 0;
//                 newData[idx].endsPerPart = String(epp);
//             }
//             return newData;
//         });
//     };

//     useEffect(() => {
//         const fpw = parseFloat(newQuality.fabricPanelWidth || "1") || 1;
//         const se = parseFloat(newQuality.sordEnds || "0") || 0;
//         const newAE = Math.round(se * fpw);
//         if (String(newAE) !== newQuality.actualEnds) {
//             setNewQuality((prev) => ({ ...prev, actualEnds: String(newAE) }));
//         }
//         setLayerData((prev) => {
//             if (!prev.length) return prev;
//             return prev.map((l, idx) => {
//                 const baseEpi = currentWarpDetails[idx]?.epi != null
//                     ? Math.round(currentWarpDetails[idx].epi)
//                     : (parseFloat(l.warpEnds) || 0);
//                 const newWarpEnds = Math.round(baseEpi * fpw);
//                 const newActualWarpEnds = newWarpEnds;
//                 const partsNum = parseFloat(l.parts) || 0;
//                 const newEpp = partsNum > 0 ? String(Math.round(newActualWarpEnds / partsNum)) : "";
//                 return { ...l, warpEnds: String(newWarpEnds), actualWarpEnds: String(newActualWarpEnds), endsPerPart: newEpp };
//             });
//         });
//     }, [newQuality.fabricPanelWidth, newQuality.sordEnds, currentWarpDetails]);

//     const addAllItems = () => {
//         setFormError("");
//         if (!newQuality.fabricId || !newQuality.actualEnds) {
//             setFormError("Fabric Code and Beam Ends are required");
//             return;
//         }

//         let hasLayerError = false;
//         layerData.forEach((layer) => {
//             if (!layer.actualYarn || !layer.actualWarpEnds || !layer.parts) {
//                 hasLayerError = true;
//             }
//         });

//         if (hasLayerError) {
//             setFormError("All Yarn and Actual Yarn details are required for each layer");
//             return;
//         }

//         const newItems: SizingQualityDetails[] = layerData.map((layer) => ({
//             fabricId: newQuality.fabricId,
//             quality: newQuality.quality,
//             fabricCode: newQuality.fabricCode,
//             yarnId: layer.yarnId,
//             actualYarn: layer.actualYarn,
//             sordEnds: newQuality.sordEnds,
//             actualEnds: newQuality.actualEnds,
//             warpEnds: layer.warpEnds,
//             actualWarpEnds: layer.actualWarpEnds,
//             parts: layer.parts,
//             endsPerPart: layer.endsPerPart,
//             warpMeters: layer.warpMeters,
//             fabricPanelWidth: newQuality.fabricPanelWidth,
//         }));

//         if (editingFabricId) {
//             setItems((prev) => {
//                 const filtered = prev.filter((it) => String(it.fabricId || "") !== String(editingFabricId));
//                 return [...filtered, ...newItems];
//             });
//             setEditingFabricId(null);
//             setEditingIndex(null);
//         } else if (editingIndex !== null) {
//             setItems((prev) =>
//                 prev.map((item, idx) => (idx === editingIndex ? newItems[0] : item))
//             );
//             setEditingIndex(null);
//         } else {
//             setItems((prev) => [...prev, ...newItems]);
//         }

//         setNewQuality({
//             fabricId: "",
//             quality: "",
//             fabricCode: "",
//             sordEnds: "",
//             actualEnds: "",
//             fabricPanelWidth: "1",
//         });
//         setLayerData([]);
//         setCurrentWarpDetails([]);
//     };

//     const editItem = (index: number) => {
//         const item = items[index];
//         let fabric = fabricMasterList.find((f: FabricMaster) => f.id === parseInt(item.fabricId || ""));
//         if (!fabric && item.fabricCode) {
//             fabric = fabricMasterList.find((f: FabricMaster) => f.fabricCode === item.fabricCode);
//         }
//         const fabricId = fabric?.id ? String(fabric.id) : (item.fabricId || "");
//         const yarnName = yarnList.find((y: YarnMaster) => y.id === parseInt(item.yarnId))?.yarnName || item.yarnId || "";

//         // Reflect updated fabric master data for single item
//         setNewQuality({
//             fabricId,
//             quality: fabric?.fabricQuality || item.quality || "",
//             fabricCode: fabric?.fabricCode || item.fabricCode || "",
//             sordEnds: fabric?.totalEnds != null ? String(fabric.totalEnds) : (item.sordEnds || ""),
//             actualEnds: item.actualEnds || "",
//             fabricPanelWidth: item.fabricPanelWidth || "1",
//         });

//         // Try to find matching warp detail from master to get latest epi/warpMeters
//         const masterWd = fabric?.warpDetails?.find((wd: any) => String(wd.yarnId) === String(item.yarnId));

//         setLayerData([{
//             yarnId: item.yarnId || "",
//             yarnName,
//             warpEnds: masterWd?.epi ? String(Math.round(masterWd.epi)) : (item.warpEnds || ""),
//             warpMeters: masterWd?.warpMeters ? String(Math.round(masterWd.warpMeters)) : (item.warpMeters || ""),
//             actualYarn: item.actualYarn || "",
//             actualWarpEnds: item.actualWarpEnds || "",
//             parts: item.parts || "",
//             endsPerPart: item.endsPerPart || "",
//         }]);

//         if (fabric?.warpDetails) {
//             const wd = fabric.warpDetails.find((w: any) => w.yarnId === parseInt(item.yarnId));
//             if (wd) {
//                 setCurrentWarpDetails([wd]);
//             } else {
//                 setCurrentWarpDetails(fabric.warpDetails);
//             }
//         } else {
//             setCurrentWarpDetails([]);
//         }
//         setEditingIndex(index);
//         setTimeout(() => {
//             const element = document.querySelector('[data-section="quality-details"]');
//             if (element) {
//                 (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
//             }
//         }, 0);
//     };

//     const deleteItem = (index: number) => {
//         setItems(items.filter((_, i) => i !== index));
//     };

//     const editQualityRow = (key: string) => {
//         const qItems = items.filter((it) => {
//             const k = String(it.fabricId || it.fabricCode || "");
//             return k === String(key);
//         });
//         if (!qItems.length) return;
//         const first = qItems[0];
//         let fabric: FabricMaster | undefined = undefined;
//         if (first.fabricId) {
//             fabric = fabricMasterList.find((f: FabricMaster) => f.id === parseInt(first.fabricId || ""));
//         }
//         if (!fabric && first.fabricCode) {
//             fabric = fabricMasterList.find((f: FabricMaster) => f.fabricCode === first.fabricCode);
//         }
//         const fabricId = fabric?.id ? String(fabric.id) : (first.fabricId || "");

//         // Reflect updated fabric master data for quality row
//         setNewQuality({
//             fabricId: fabricId,
//             quality: fabric?.fabricQuality || first.quality || "",
//             fabricCode: fabric?.fabricCode || first.fabricCode || "",
//             sordEnds: fabric?.totalEnds != null ? String(fabric.totalEnds) : (first.sordEnds || ""),
//             actualEnds: first.actualEnds || "",
//             fabricPanelWidth: first.fabricPanelWidth || "1",
//         });

//         const masterWarpDetails = fabric?.warpDetails || [];

//         if (masterWarpDetails.length > 0) {
//             // Rebuild layerData from master but preserve parts/actualYarn if yarns match
//             const layers: LayerData[] = masterWarpDetails.map((wd: any) => {
//                 const yarnName = yarnList.find((y: YarnMaster) => y.id === wd.yarnId)?.yarnName || "";
//                 const existingItem = qItems.find(it => String(it.yarnId) === String(wd.yarnId));

//                 return {
//                     yarnId: String(wd.yarnId),
//                     yarnName,
//                     warpEnds: String(Math.round(wd.epi || 0)),
//                     warpMeters: String(Math.round(wd.warpMeters || 0)),
//                     actualYarn: existingItem?.actualYarn || String(wd.yarnId),
//                     actualWarpEnds: existingItem?.actualWarpEnds || String(Math.round(wd.epi || 0)),
//                     parts: existingItem?.parts || "",
//                     endsPerPart: existingItem?.endsPerPart || "",
//                 };
//             });
//             setLayerData(layers);
//             setCurrentWarpDetails(masterWarpDetails);
//         } else {
//             // Fallback to existing items if master has no warp details
//             const layers: LayerData[] = qItems.map((it) => {
//                 const yarnName = yarnList.find((y: YarnMaster) => y.id === parseInt(it.yarnId))?.yarnName || it.yarnId || "";
//                 return {
//                     yarnId: it.yarnId || "",
//                     yarnName,
//                     warpEnds: it.warpEnds || "",
//                     warpMeters: it.warpMeters || "",
//                     actualYarn: it.actualYarn || "",
//                     actualWarpEnds: it.actualWarpEnds || "",
//                     parts: it.parts || "",
//                     endsPerPart: it.endsPerPart || "",
//                 };
//             });
//             setLayerData(layers);
//             setCurrentWarpDetails([]);
//         }

//         setEditingFabricId(fabricId);
//         setActiveTab('vendorDetails');
//         setTimeout(() => {
//             const element = document.querySelector('[data-section="quality-details"]');
//             if (element) {
//                 (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
//             }
//         }, 0);
//     };

//     // const handleAddBeams = () => {
//     //     const num = parseInt(numberOfBeams) || 0;
//     //     if (num > 0) {
//     //         const totalWarpMeters = items.reduce((sum: number, item: SizingQualityDetails) => {
//     //             return sum + (parseFloat(item.warpMeters) || 0);
//     //         }, 0);
//     //         const warpMetersPerBeam = num > 0 ? totalWarpMeters / num : 0;
//     //         const newBeams: SizingBeamDetails[] = Array(num).fill(0).map(() => {
//     //             const fpw = parseFloat(planFabricPanelWidth || "1") || 1;
//     //             const base = warpMetersPerBeam * fpw;
//     //             const shrink = 0.075;
//     //             return {
//     //                 weavingContractId: "",
//     //                 salesOrderId: "",
//     //                 weavingVendorId: orderTypeId === '1' ? String(companyId || '') : "",
//     //                 warpMeters: warpMetersPerBeam.toFixed(2),
//     //                 shrinkage: "7.5",
//     //                 expectedFabricMeter: (base - (base * shrink)).toFixed(2),
//     //                 fabricPanelWidth: String(planFabricPanelWidth || "1"),
//     //             } as SizingBeamDetails;
//     //         });
//     //         setBeamInputs(newBeams);
//     //     }
//     // };
//     const parseNumericInput = (value?: string | number) => {
//         if (value == null) return NaN;
//         const trimmed = typeof value === "number" ? value : String(value).trim();
//         if (trimmed === "") return NaN;
//         return Number(trimmed);
//     };

//     const calculateExpectedFabricMeter = (warpMetersValue?: string | number, fabricPanelValue?: string | number, shrinkageValue?: string | number) => {
//         const warpMeters = parseNumericInput(warpMetersValue);
//         const fabricPanel = parseNumericInput(fabricPanelValue);
//         if (Number.isNaN(warpMeters) || Number.isNaN(fabricPanel)) return undefined;
//         const shrinkage = parseNumericInput(shrinkageValue);
//         const shrinkFactor = Number.isNaN(shrinkage) ? 0 : shrinkage / 100;
//         const base = warpMeters * fabricPanel;
//         const result = base - (base * shrinkFactor);
//         return Number.isFinite(result) ? String(result) : undefined;
//     };

//     const resolveShrinkageFromFabric = useCallback((fabricId?: string) => {
//         if (!fabricId) return undefined;
//         const raw: any = fabricMasterList as any;
//         const fabrics: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
//         const fabric = fabrics.find((f: any) => String(f?.id) === String(fabricId));
//         if (!fabric) return undefined;
//         const warpDetails: any[] = Array.isArray(fabric?.warpDetails) ? fabric.warpDetails : [];
//         const shrinkValues = warpDetails
//             .map((wd: any) => Number(wd?.shrinkagePercent))
//             .filter((val: number) => !Number.isNaN(val));
//         if (shrinkValues.length === 0) return undefined;
//         const avg = shrinkValues.reduce((sum: number, val: number) => sum + val, 0) / shrinkValues.length;
//         return String(Number(avg.toFixed(2)));
//     }, [fabricMasterList]);

//     // const handleAddBeams = () => {
//     //     const num = parseInt(numberOfBeams) || 0;
//     //     if (num > 0) {
//     //         const totalWarpMeters = items.reduce((sum: number, item: SizingQualityDetails) => {
//     //             return sum + (parseFloat(item.warpMeters) || 0);
//     //         }, 0);
//     //         const warpMetersPerBeam = num > 0 ? totalWarpMeters / num : 0;
//     //         const shrinkageSource = beamInputs.find(b => b.shrinkage && b.shrinkage.trim() !== "")?.shrinkage
//     //             || beamItems.find(b => b.shrinkage && b.shrinkage.trim() !== "")?.shrinkage
//     //             || items.map(item => resolveShrinkageFromFabric(item.fabricId)).find(Boolean)
//     //             || "7.5";
//     //         const expectedFabricMeter = calculateExpectedFabricMeter(warpMetersPerBeam, planFabricPanelWidth || "1", shrinkageSource);
//     //         const newBeams: SizingBeamDetails[] = Array(num).fill(0).map(() => ({
//     //             weavingContractId: "",
//     //             salesOrderId: "",
//     //             weavingVendorId: "",
//     //             warpMeters: String(warpMetersPerBeam),
//     //             shrinkage: shrinkageSource,
//     //             expectedFabricMeter: expectedFabricMeter || "",
//     //             fabricPanelWidth: String(planFabricPanelWidth || "1"),
//     //         } as SizingBeamDetails));
//     //         setBeamInputs(newBeams);
//     //     }
//     // };
//     const handleAddBeams = () => {
//         const num = parseInt(numberOfBeams) || 0;
//         if (num > 0) {
//             const totalWarpMeters = items.reduce((sum: number, item: SizingQualityDetails) => {
//                 return sum + (parseFloat(item.warpMeters) || 0);
//             }, 0);
//             const warpMetersPerBeam = num > 0 ? totalWarpMeters / num : 0;
//             const newBeams: SizingBeamDetails[] = Array(num).fill(0).map(() => {
//                 const fpw = parseFloat(planFabricPanelWidth || "1") || 1;
//                 const base = warpMetersPerBeam * fpw;
//                 const shrink = 0.075;
//                 const expectedFabricMeter = base - (base * shrink);
//                 const beam: SizingBeamDetails = {
//                     weavingContractId: "",
//                     salesOrderId: "",
//                     weavingVendorId: "",
//                     warpMeters: String(warpMetersPerBeam),
//                     shrinkage: "7.5",
//                     expectedFabricMeter: String(expectedFabricMeter),
//                     fabricPanelWidth: String(planFabricPanelWidth || "1"),
//                 };

//                 if (uniqueQualities.length === 1) {
//                     const onlyQuality = uniqueQualities[0];
//                     beam.fabricId = String(onlyQuality.fabricId || "");
//                     if (onlyQuality.fabricPanelWidth) {
//                         beam.fabricPanelWidth = String(onlyQuality.fabricPanelWidth);
//                     }
//                     const candidates = weavingContractList.filter((wc: WeavingContract) => {
//                         const fabricMatch = wc.items?.some((it: any) => it.fabricCodeId === parseInt(String(beam.fabricId)));
//                         if (!fabricMatch) return false;
//                         const wcCompanyId = (wc as any)?.companyId;
//                         return wcCompanyId === resolvedCompanyId;
//                     });
//                     if (candidates.length === 1) {
//                         const wc = candidates[0];
//                         beam.weavingContractId = String(wc.id);
//                         beam.salesOrderId = String((wc as any).salesOrderNo || "");
//                         if ((wc as any).vendorId != null) {
//                             beam.weavingVendorId = String((wc as any).vendorId);
//                         }
//                     }
//                 }

//                 return beam;
//             });
//             setBeamInputs(newBeams);
//         }
//     };


//     const resolvedSalesOrderList = useMemo(() => {
//         if (Array.isArray(salesOrderList)) return salesOrderList;
//         if (Array.isArray((salesOrderList as any)?.data)) return (salesOrderList as any).data;
//         return [];
//     }, [salesOrderList]);

//     const salesOrderLabelById = useMemo(() => {
//         const map = new Map<string, string>();
//         resolvedSalesOrderList.forEach((order: any) => {
//             if (!order) return;
//             const idCandidates = [order?.id, order?.salesOrderId, order?.salesOrder?.id]
//                 .filter((val) => val !== undefined && val !== null);
//             const labelCandidates = [
//                 order?.salesOrderNo,
//                 order?.orderNo,
//                 order?.salesOrderNumber,
//                 order?.salesOrder?.salesOrderNo,
//                 order?.salesOrderCode
//             ].filter((val) => val !== undefined && val !== null && val !== "");
//             const label = labelCandidates.length > 0 ? String(labelCandidates[0]) : undefined;
//             idCandidates.forEach((candidate) => {
//                 const key = String(candidate);
//                 if (!map.has(key)) {
//                     map.set(key, label || key);
//                 } else if (label) {
//                     map.set(key, label);
//                 }
//             });
//             if (label && !map.has(label)) {
//                 map.set(label, label);
//             }
//         });
//         return map;
//     }, [resolvedSalesOrderList]);

//     const resolveSalesOrderLabel = useCallback(
//         (value?: string | number | null) => {
//             if (value === undefined || value === null || value === "") return "";
//             const key = String(value);
//             return salesOrderLabelById.get(key) || "";
//         },
//         [salesOrderLabelById]
//     );

//     const salesOrdersByContract = useMemo(() => {
//         const map = new Map<string, any[]>();
//         const contracts = Array.isArray(weavingContractList) ? weavingContractList : [];
//         contracts.forEach((wc: any) => {
//             if (!wc?.id) return;
//             const key = String(wc.id);
//             const matches = resolvedSalesOrderList.filter((order: any) => {
//                 if (!order) return false;
//                 const directContractIds = [order.weavingContractId, order.weavingContract?.id, order.contractId].filter((val) => val !== undefined && val !== null);
//                 if (directContractIds.some((val) => String(val) === key)) return true;
//                 if (wc.salesOrderId && String(order.id) === String(wc.salesOrderId)) return true;
//                 if (wc.salesOrderNo && String(order.salesOrderNo) === String(wc.salesOrderNo)) return true;
//                 return false;
//             });
//             map.set(key, matches);
//         });
//         return map;
//     }, [resolvedSalesOrderList, weavingContractList]);

//     const getSalesOrdersForContract = useCallback(
//         (contractId?: string | number | null) => {
//             if (!contractId) return [];
//             return salesOrdersByContract.get(String(contractId)) || [];
//         },
//         [salesOrdersByContract]
//     );


//     // const handleBeamInputChange = (index: number, field: keyof SizingBeamDetails, value: string) => {
//     //     const updatedBeams = [...beamInputs];
//     //     updatedBeams[index] = {
//     //         ...updatedBeams[index],
//     //         [field]: value
//     //     };

//     //     if (field === 'weavingContractId') {
//     //         const selectedWc = value ? weavingContractList.find((wc: WeavingContract) => wc.id === parseInt(value)) : undefined;
//     //         updatedBeams[index].salesOrderId = "";
//     //         if (selectedWc) {
//     //             const contractOrders = getSalesOrdersForContract(selectedWc.id);
//     //             if (contractOrders.length === 1) {
//     //                 const firstOrder = contractOrders[0];
//     //                 updatedBeams[index].salesOrderId = String(firstOrder?.id ?? firstOrder?.salesOrderNo ?? "");
//     //             } else if (!contractOrders.length && selectedWc.salesOrderNo) {
//     //                 updatedBeams[index].salesOrderId = String(selectedWc.salesOrderNo);
//     //             }
//     //             if (selectedWc.vendorId != null) {
//     //                 updatedBeams[index].weavingVendorId = String(selectedWc.vendorId);
//     //             }
//     //         }
//     //     }

//     //     if (field === 'fabricId') {
//     //         updatedBeams[index].fabricId = value;
//     //         // reset dependent fields
//     //         updatedBeams[index].weavingContractId = "";
//     //         updatedBeams[index].salesOrderId = "";
//     //         const q = uniqueQualities.find((u: any) => String(u.fabricId || "") === String(value));
//     //         if (q?.fabricPanelWidth) {
//     //             updatedBeams[index].fabricPanelWidth = String(q.fabricPanelWidth);
//     //         }
//     //         // autofill shrinkage% from fabricMasterList.warpDetails (average if multiple)
//     //         const fabric = fabricMasterList?.find((f: any) => Number(f?.id) === Number(value));
//     //         if (fabric?.warpDetails && Array.isArray(fabric.warpDetails)) {
//     //             const vals = fabric.warpDetails
//     //                 .map((wd: any) => Number(wd?.shrinkagePercent))
//     //                 .filter((v: number) => !Number.isNaN(v));
//     //             if (vals.length > 0) {
//     //                 const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
//     //                 updatedBeams[index].shrinkage = String(Number(avg.toFixed(2)));
//     //             }
//     //         }

//     //         // MODIFIED: Filter weaving contracts based on order type
//     //         const currentOrderType = parseInt(orderTypeId || "0");

//     //         // Get all weaving contracts that have this fabric in items
//     //         const allMatchingContracts = weavingContractList.filter((wc: WeavingContract) =>
//     //             wc.items?.some((it: any) => it.fabricCodeId === parseInt(String(value)))
//     //         );

//     //         // Filter based on order type
//     //         let candidates = allMatchingContracts;
//     //         if (currentOrderType === 2) { // External
//     //             // For External orders, filter by companyId
//     //             candidates = allMatchingContracts.filter((wc: WeavingContract) => {
//     //                 // Check if the weaving contract has the same companyId
//     //                 const wcCompanyId = (wc as any)?.companyId;
//     //                 return wcCompanyId === resolvedCompanyId;
//     //             });
//     //         }
//     //         // For Internal (orderTypeId === 1), show all matching contracts without company filter

//     //         if (candidates.length === 1) {
//     //             const wc = candidates[0];
//     //             updatedBeams[index].weavingContractId = String(wc.id);
//     //             updatedBeams[index].salesOrderId = String(wc.salesOrderNo);
//     //             if (wc.vendorId != null) {
//     //                 updatedBeams[index].weavingVendorId = String(wc.vendorId);
//     //             }
//     //         }
//     //         if (updatedBeams[index].warpMeters && updatedBeams[index].shrinkage) {
//     //             const warpMeters = parseFloat(updatedBeams[index].warpMeters);
//     //             const shrinkage = parseFloat(updatedBeams[index].shrinkage) / 100;
//     //             const fpw = parseFloat(updatedBeams[index].fabricPanelWidth || planFabricPanelWidth || "1") || 1;
//     //             const base = warpMeters * fpw;
//     //             const expectedFabricMeter = base - (base * shrinkage);
//     //             updatedBeams[index].expectedFabricMeter = String(expectedFabricMeter);
//     //         }
//     //     }

//     //     if (orderTypeId === '1' && field === 'weavingVendorId') {
//     //         // For internal orders, you might want to keep the weavingVendorId as selected
//     //         // Or set it to companyId if needed
//     //     }

//     //     // Calculate expected fabric meter without rounding - keep exact decimal values
//     //     if ((field === 'warpMeters' || field === 'shrinkage' || field === 'fabricPanelWidth') &&
//     //         updatedBeams[index].warpMeters && updatedBeams[index].shrinkage) {

//     //         const warpMeters = parseFloat(updatedBeams[index].warpMeters);
//     //         const shrinkage = parseFloat(updatedBeams[index].shrinkage) / 100;
//     //         const fpw = parseFloat(updatedBeams[index].fabricPanelWidth || planFabricPanelWidth || "1") || 1;

//     //         // Exact calculation without rounding
//     //         const base = warpMeters * fpw;
//     //         const expectedFabricMeter = base - (base * shrinkage);
//     //         updatedBeams[index].expectedFabricMeter = String(expectedFabricMeter);

//     //         if (!updatedBeams[index].fabricPanelWidth) {
//     //             updatedBeams[index].fabricPanelWidth = String(planFabricPanelWidth || "1");
//     //         }
//     //     }

//     //     setBeamInputs(updatedBeams);
//     // };
//     // Update the handleBeamInputChange function:

//     const handleBeamInputChange = (index: number, field: keyof SizingBeamDetails, value: string) => {
//         const updatedBeams = [...beamInputs];
//         updatedBeams[index] = {
//             ...updatedBeams[index],
//             [field]: value
//         };

//         if (field === 'weavingContractId') {
//             const selectedWc = value ? weavingContractList.find((wc: WeavingContract) => wc.id === parseInt(value)) : undefined;
//             updatedBeams[index].salesOrderId = "";
//             if (selectedWc) {
//                 const contractOrders = getSalesOrdersForContract(selectedWc.id);
//                 if (contractOrders.length === 1) {
//                     const firstOrder = contractOrders[0];
//                     updatedBeams[index].salesOrderId = String(firstOrder?.id ?? firstOrder?.salesOrderNo ?? "");
//                 } else if (!contractOrders.length && selectedWc.salesOrderNo) {
//                     updatedBeams[index].salesOrderId = String(selectedWc.salesOrderNo);
//                 }
//                 if (selectedWc.vendorId != null) {
//                     updatedBeams[index].weavingVendorId = String(selectedWc.vendorId);
//                 }
//             }
//         }

//         if (field === 'fabricId') {
//             updatedBeams[index].fabricId = value;
//             // reset dependent fields
//             updatedBeams[index].weavingContractId = "";
//             updatedBeams[index].salesOrderId = "";
//             const q = uniqueQualities.find((u: any) => String(u.fabricId || "") === String(value));
//             if (q?.fabricPanelWidth) {
//                 updatedBeams[index].fabricPanelWidth = String(q.fabricPanelWidth);
//             }
//             // autofill shrinkage% from fabricMasterList.warpDetails (average if multiple)
//             const fabric = fabricMasterList?.find((f: any) => Number(f?.id) === Number(value));
//             if (fabric?.warpDetails && Array.isArray(fabric.warpDetails)) {
//                 const vals = fabric.warpDetails
//                     .map((wd: any) => Number(wd?.shrinkagePercent))
//                     .filter((v: number) => !Number.isNaN(v));
//                 if (vals.length > 0) {
//                     const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
//                     updatedBeams[index].shrinkage = String(Number(avg.toFixed(2)));
//                 }
//             }

//             // MODIFIED: Always filter weaving contracts by companyId regardless of order type
//             const candidates = weavingContractList.filter((wc: WeavingContract) => {
//                 // First check if fabric matches
//                 const fabricMatch = wc.items?.some((it: any) => it.fabricCodeId === parseInt(String(value)));
//                 if (!fabricMatch) return false;

//                 // Then check companyId match
//                 const wcCompanyId = (wc as any)?.companyId;
//                 return wcCompanyId === resolvedCompanyId;
//             });

//             if (candidates.length === 1) {
//                 const wc = candidates[0];
//                 updatedBeams[index].weavingContractId = String(wc.id);
//                 updatedBeams[index].salesOrderId = String(wc.salesOrderNo);
//                 if (wc.vendorId != null) {
//                     updatedBeams[index].weavingVendorId = String(wc.vendorId);
//                 }
//             }
//             if (updatedBeams[index].warpMeters && updatedBeams[index].shrinkage) {
//                 const expectedFabricMeter = calculateExpectedFabricMeter(
//                     updatedBeams[index].warpMeters,
//                     updatedBeams[index].fabricPanelWidth || planFabricPanelWidth || "1",
//                     updatedBeams[index].shrinkage
//                 );
//                 if (expectedFabricMeter != null) {
//                     updatedBeams[index].expectedFabricMeter = expectedFabricMeter;
//                 }
//             }
//         }

//         if (orderTypeId === '1' && field === 'weavingVendorId') {
//             // For internal orders, you might want to keep the weavingVendorId as selected
//             // Or set it to companyId if needed
//         }

//         // Calculate expected fabric meter without rounding - keep exact decimal values
//         if ((field === 'warpMeters' || field === 'shrinkage' || field === 'fabricPanelWidth') &&
//             updatedBeams[index].warpMeters && updatedBeams[index].shrinkage) {

//             const expectedFabricMeter = calculateExpectedFabricMeter(
//                 updatedBeams[index].warpMeters,
//                 updatedBeams[index].fabricPanelWidth || planFabricPanelWidth || "1",
//                 updatedBeams[index].shrinkage
//             );
//             if (expectedFabricMeter != null) {
//                 updatedBeams[index].expectedFabricMeter = expectedFabricMeter;
//             }

//             if (!updatedBeams[index].fabricPanelWidth) {
//                 updatedBeams[index].fabricPanelWidth = String(planFabricPanelWidth || "1");
//             }
//         }

//         setBeamInputs(updatedBeams);
//     };

//     const addBeamItems = () => {
//         const validBeams = beamInputs.filter(beam =>
//             beam.weavingContractId ||
//             beam.salesOrderId ||
//             beam.warpMeters ||
//             beam.shrinkage ||
//             beam.expectedFabricMeter
//         );
//         if (validBeams.length > 0) {
//             setBeamItems([...beamItems, ...validBeams]);
//             setBeamInputs([]);
//             setNumberOfBeams('0');
//         }
//     };

//     const editBeamItem = (index: number) => {
//         setBeamInputs([beamItems[index]]);
//         setBeamItems(beamItems.filter((_, i) => i !== index));
//     };

//     const deleteBeamItem = (index: number) => {
//         setBeamItems(beamItems.filter((_, i) => i !== index));
//     };

//     const summaryRows = useMemo<SummaryRow[]>(() => {
//         if (items.length === 0) {
//             return [];
//         }
//         return items.map((item: SizingQualityDetails): SummaryRow => {
//             const yarnKey =
//                 (item.actualYarn && item.actualYarn.trim()) ||
//                 (item.yarnId && item.yarnId.trim()) ||
//                 "__missing__";
//             const parsedId = parseInt(yarnKey, 10);
//             const yarnName = Number.isNaN(parsedId)
//                 ? undefined
//                 : yarnList?.find((y: YarnMaster) => y.id === parsedId)?.yarnName;
//             const label = yarnName || (yarnKey === "__missing__" ? "Not Selected" : yarnKey);
//             const actualWarpEndsValue = parseFloat(item.actualWarpEnds) || 0;
//             const partsValue = parseFloat(item.parts) || 0;
//             const rawWarpMetersValue = parseFloat(item.warpMeters) || 0;
//             const warpMetersAfterShrink = rawWarpMetersValue * (1 - 0.075);
//             return {
//                 yarnKey,
//                 yarnLabel: label,
//                 actualEnds: Math.round(actualWarpEndsValue),
//                 parts: Math.round(partsValue),
//                 endsPerPart: partsValue > 0 ? Math.round(actualWarpEndsValue / partsValue) : 0,
//                 rawWarpMeters: Math.round(rawWarpMetersValue),
//                 warpMetersAfterShrink: Math.round(warpMetersAfterShrink)
//             };
//         });
//     }, [items, yarnList]);

//     const uniqueQualities = useMemo(() => {
//         const fabricMap = new Map<string, any>();
//         items.forEach(item => {
//             const key = String(item.fabricId || item.fabricCode || "");
//             if (!fabricMap.has(key)) {
//                 fabricMap.set(key, {
//                     key,
//                     fabricId: item.fabricId,
//                     fabricCode: item.fabricCode,
//                     quality: item.quality,
//                     sordEnds: item.sordEnds,
//                     actualEnds: item.actualEnds,
//                     fabricPanelWidth: item.fabricPanelWidth,
//                 });
//             }
//         });
//         return Array.from(fabricMap.values());
//     }, [items]);

//     const usedFabricIdsInBeams = useMemo(() => {
//         const arr: string[] = [];
//         beamInputs.forEach((b) => { if (b.fabricId) arr.push(String(b.fabricId)); });
//         beamItems.forEach((b) => { if (b.fabricId) arr.push(String(b.fabricId)); });
//         return new Set(arr);
//     }, [beamInputs, beamItems]);

//     const selectedFabricIds = useMemo(() =>
//         new Set(items.map((item: SizingQualityDetails) => item.fabricId).filter(Boolean)),
//         [items]
//     );

//     const filteredWeavingContracts = useMemo(
//         () =>
//             weavingContractList.filter((wc: WeavingContract) =>
//                 Array.from(selectedFabricIds).some((fabricId) =>
//                     wc.items?.some(
//                         (item: any) => item.fabricCodeId === parseInt(fabricId as string, 10)
//                     )
//                 )
//             ),
//         [weavingContractList, selectedFabricIds]
//     );

//     const planFabricPanelWidth = useMemo(() => {
//         const first = items.find((i) => (i.fabricPanelWidth && i.fabricPanelWidth !== ""));
//         return first?.fabricPanelWidth || "1";
//     }, [items]);



//     const onSubmit = async (data: SizingPlanEntryFormData) => {
//         const isEditMode = Boolean(sizingPlanDtl?.id);
//         let sizingPlanNo = data.sizingPlanNo || sizingPlanDtl?.sizingPlanNo || "";
//         if (!sizingPlanDtl?.id && !sizingPlanNo) {
//             try {
//                 const docResponse = await documentNumberService.generateDocumentNumber({
//                     screenName: "Sizing Management",
//                     tabName: "sizingPlan"
//                 });
//                 sizingPlanNo = docResponse.documentNumber;
//             } catch (error) {
//                 console.warn("Failed to generate document number:", error);
//             }
//         }

//         const vendor = Array.isArray(vendorList)
//             ? vendorList.find((v: any) => String(v?.id) === String(data.vendorId))
//             : null;
//         const tradingCompanyId = resolvedCompanyId ?? null;
//         const factoryCompanyId = resolveFactoryCompanyId(vendor || undefined);
//         const orderTypeIdNum = parseInt(String(data.orderTypeId || ""), 10) || 0;
//         const effectiveFactoryCompanyId = orderTypeIdNum === 1 ? factoryCompanyId : null;
//         isSavingRef.current = true;
//         const payload = {
//             vendorId: parseInt(data.vendorId),
//             orderTypeId: parseInt(data.orderTypeId),
//             termsConditionsId: parseInt(data.termsConditionsId),
//             paymentTermsId: parseInt(data.paymentTermsId),
//             sizingRate: parseFloat(data.sizingRate),
//             emptyBeamNo: data.emptyBeamNo,
//             remarks: data.remarks,
//             sizingPlanDate: data.sizingPlanDate,
//             sizingPlanNo: sizingPlanNo,
//             companyId: resolvedCompanyId,
//             tradingCompanyId,
//             factoryCompanyId: effectiveFactoryCompanyId,
//             sizingQualityDetails: items.map((item: SizingQualityDetails) => ({
//                 id: item.id || undefined,
//                 quality: item.quality,
//                 fabricCode: item.fabricCode,
//                 fabricId: item.fabricId ? parseInt(item.fabricId) : undefined,
//                 yarnId: parseInt(item.yarnId),
//                 actualYarn: parseInt(item.actualYarn) || parseInt(item.yarnId),
//                 sordEnds: parseInt(item.sordEnds),
//                 actualEnds: parseInt(item.actualEnds),
//                 warpEnds: parseInt(item.warpEnds),
//                 actualWarpEnds: parseInt(item.actualWarpEnds),
//                 parts: parseInt(item.parts),
//                 endsPerPart: parseInt(item.endsPerPart),
//                 warpMeters: parseFloat(item.warpMeters),
//                 fabricPanelWidth: parseFloat(item.fabricPanelWidth || "1")
//             })),
//             sizingBeamDetails: allBeams.map((beamItem: SizingBeamDetails) => ({
//                 // sizingBeamDetails: beamItems.map((beamItem: SizingBeamDetails) => ({
//                 id: beamItem.id || undefined,
//                 weavingContractId: parseInt(beamItem.weavingContractId),
//                 salesOrderId: parseInt(beamItem.salesOrderId),
//                 weavingVendorId: parseInt(beamItem.weavingVendorId),
//                 warpMeters: parseFloat(beamItem.warpMeters),
//                 shrinkage: parseFloat(beamItem.shrinkage),
//                 expectedFabricMeter: parseFloat(beamItem.expectedFabricMeter),
//                 fabricPanelWidth: parseFloat(beamItem.fabricPanelWidth || String(planFabricPanelWidth || "1")),
//                 fabricId: beamItem.fabricId ? parseInt(beamItem.fabricId) : undefined,
//                 noOfBeams: allBeams.length,
//             }))
//         };
//         try {
//             // alert(JSON.stringify(payload));
//             // console.log("payload",JSON.stringify(payload));
//             let savedSizingPlan;
//             if (isEditMode) {
//                 const result = await dispatch(updateSizingPlan({
//                     id: sizingPlanDtl.id,
//                     data: payload
//                 })).unwrap();
//                 savedSizingPlan = result?.data || result;
//             } else {
//                 const result = await dispatch(createSizingPlan(payload)).unwrap();
//                 savedSizingPlan = result?.data || result;
//                 documentNumberService.clearMemoryCache('Sizing Plan');
//             }
            
//             const fallbackSalesOrderId =
//                 location.state?.salesOrderId ||
//                 allBeams.find((beam: SizingBeamDetails) => beam?.salesOrderId)?.salesOrderId;

//             // Keep user in sizing flow: open Sizing Yarn Issue add screen directly.
//             // Pass plan context so Sizing Plan Number and Vendor are auto-selected there.
//             navigate("/transaction/sizing-yarn-issue", {
//                 state: {
//                     newlyCreatedSizingPlan: savedSizingPlan,
//                     autoSelectPlan: true,
//                     source: fromOrderEntry ? "order-entry-management" : "sizing-plan-entry",
//                     salesOrderId: fallbackSalesOrderId ? Number(fallbackSalesOrderId) : undefined,
//                     activeTab: location.state?.activeTab,
//                     expandedRowId: location.state?.expandedRowId || (fallbackSalesOrderId ? Number(fallbackSalesOrderId) : undefined),
//                     flowType: "sizing",
//                     selectedHyperlink: "sizingPlan"
//                 }
//             });
//         } catch (err) {
//             console.error("Error submitting sizing plan:", err);
//         }
//     };

//     const handleSaveClick = () => {
//         const missingFields = collectMissingMandatoryFields();
//         if (missingFields.length > 0) {
//             toast.error(`Please fill the required fields: ${missingFields.join(", ")}`);
//             return;
//         }
//         handleSubmit(onSubmit)();
//     };

//     const isSaveDisabled = !isFormValid;
//     const saveButtonClassName = `bg-primary text-white px-6 flex items-center ${isSaveDisabled ? "opacity-60 cursor-not-allowed" : "hover:bg-primary"}`;

//     return (
//         <div className="p-6 pt-16">
//             <div className="p-6 bg-white shadow-md rounded-lg">
//                 <div className="flex justify-between items-center border-b pb-4">
//                     <div className="flex items-center space-x-4">
//                         <Button
//                             variant="outline"
//                             onClick={() => navigate("/transaction/sizing-plan-details")}
//                             className="mr-auto"
//                         >
//                             <ArrowLeft size={18} className="mr-2" />
//                             Back
//                         </Button>
//                         <h2 className="text-2xl font-semibold">Sizing Plan Entry</h2>
//                     </div>
                  
//                 </div>
//                 <div className="space-y-6">
//                     <div className="mb-8">
//                         <div className="border-b border-gray-200">
//                             <nav className="flex -mb-px">
//                                 <button
//                                     onClick={() => setActiveTab('vendorDetails')}
//                                     className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'vendorDetails'
//                                         ? 'border-red-500 text-red-600'
//                                         : 'border-transparent text-gray-500 hover:text-gray-700 Inward Ordershover:border-gray-300'
//                                         }`}
//                                 >
//                                     <FileText className="w-4 h-4" />
//                                     Vendor Details
//                                 </button>
//                                 <button
//                                     onClick={() => setActiveTab('beamDetails')}
//                                     className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'beamDetails'
//                                         ? 'border-red-500 text-red-600'
//                                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                                         }`}
//                                 >
//                                     <ShoppingCart className="w-4 h-4" />
//                                     Beam Details
//                                 </button>
//                             </nav>
//                         </div>
//                     </div>

//                     {activeTab === "vendorDetails" && (
//                         <>
//                             <Card>
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2 ">
//                                         <FileText size={20} /> Vendor Details
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="grid grid-cols-4 gap-8">
//                                     <div>

//                                         <label className="block text-sm mb-1">Sizing Plan No</label>

//                                         <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"

//                                             {...register('sizingPlanNo')} readOnly />

//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Sizing Plan Date <span className="text-red-600">*</span></label>
//                                         <input
//                                             type="date"
//                                             {...register("sizingPlanDate", { required: "Sizing Plan Date is required" })}
//                                             className="input mt-1"
//                                         />
//                                         {errors.sizingPlanDate && (
//                                             <p className="mt-1 text-sm text-red-600">{errors.sizingPlanDate.message}</p>
//                                         )}
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Order Type <span className="text-red-600">*</span></label>
//                                         <CommonSearchableSelect
//                                             {...register("orderTypeId", { required: "Order Type is required" })}
//                                             options={[
//                                                 { value: "1", label: "Internal" },
//                                                 { value: "2", label: "External" }
//                                             ]}
//                                             placeholder="Select Order Type"
//                                             className="mt-1"
//                                             error={errors.orderTypeId?.message}
//                                             disabled={isPlanMapped}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Sizing Vendor <span className="text-red-600">*</span></label>
//                                         <CommonSearchableSelect
//                                             {...register("vendorId", { required: "Sizing Vendor is required" })}
//                                             options={[
//                                                 ...(!selectedVendorInFiltered && selectedVendor ? [{
//                                                     value: String(selectedVendor.id),
//                                                     label: selectedVendor.customerName || selectedVendor.vendorName
//                                                 }] : []),
//                                                 ...filteredVendorList.map((vendor: any) => ({
//                                                     value: String(vendor.id),
//                                                     label: vendor.customerName || vendor.vendorName
//                                                 }))
//                                             ]}
//                                             placeholder="Select a Sizing Vendor"
//                                             className="mt-1"
//                                             error={errors.vendorId?.message}
//                                             disabled={isPlanMapped}
//                                         />
//                                     </div>

//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Sizing Rate/KG <span className="text-red-600">*</span></label>
//                                         <input
//                                             type="number"
//                                             inputMode="decimal"
//                                             step="0.01"
//                                             min="0"
//                                             {...register('sizingRate', {
//                                                 required: "Sizing Rate is required",
//                                                 pattern: {
//                                                     value: /^\d+(\.\d+)?$/,
//                                                     message: "Sizing Rate must be numeric"
//                                                 }
//                                             })}
//                                             className="input mt-1"
//                                             placeholder="Enter Sizing Rate/KG"
//                                         />
//                                         {errors.sizingRate && (
//                                             <p className="mt-1 text-sm text-red-600">{errors.sizingRate.message}</p>
//                                         )}
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Select Terms & Conditions <span className="text-red-600">*</span></label>
//                                         <CommonSearchableSelect
//                                             {...register("termsConditionsId", { required: "Terms & Conditions is required" })}
//                                             options={normalizedTermsConditions.map((tc: any) => ({
//                                                 value: String(tc.id),
//                                                 label: tc.termsConditionsName,
//                                             }))}
//                                             placeholder="Select Terms & Conditions"
//                                             className="mt-1"
//                                             error={errors.termsConditionsId?.message}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Select Payment Terms <span className="text-red-600">*</span></label>
//                                         <CommonSearchableSelect
//                                             {...register("paymentTermsId", { required: "Payment Terms is required" })}
//                                             options={normalizedPaymentTerms.map((pt: any) => ({
//                                                 value: String(pt.id),
//                                                 label: pt.termName,
//                                             }))}
//                                             placeholder="Select Payment Terms"
//                                             className="mt-1"
//                                             error={errors.paymentTermsId?.message}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Remarks</label>
//                                         <input
//                                             {...register('remarks')}
//                                             className="input mt-1"
//                                             placeholder="Enter Remarks"
//                                         />
//                                     </div>
//                                 </CardContent>
//                             </Card>

//                             {/* <Card data-section="quality-details">
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2">
//                                         <ShoppingCart size={20} /> Summary Details
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent>
//                                     <div className="space-y-4">
//                                         <div>
//                                             <h3 className="text-lg font-medium text-secondary-700 mb-2">Quality Details</h3>
//                                             <div className="grid grid-cols-2 gap-6">
//                                                 <div>
//                                                     <label className="block text-sm font-medium text-secondary-700">Fabric Code/Quality <span className="text-red-600">*</span></label>
//                                                     <CommonSearchableSelect
//                                                         value={newQuality.fabricId}
//                                                         onValueChange={(val) => handleFabricSelection(val)}
//                                                         options={normalizedFabricMasters?.map((fabric: FabricMaster) => ({
//                                                             value: String(fabric.id),
//                                                             label: `${fabric.fabricCode} - ${fabric.fabricQuality}`
//                                                         }))}
//                                                         placeholder="Select Fabric"
//                                                         className="mt-1"
//                                                         disabled={isPlanMapped}
//                                                     />
//                                                 </div>
//                                                 <div>
//                                                     <label className="block text-sm font-medium text-secondary-700">Quality</label>
//                                                     <input
//                                                         value={newQuality.quality}
//                                                         className="input mt-1"
//                                                         readOnly
//                                                     />
//                                                 </div>
//                                                 <div>
//                                                     <label className="block text-sm font-medium text-secondary-700">Sort Ends</label>
//                                                     <input
//                                                         value={newQuality.sordEnds}
//                                                         className="input mt-1"
//                                                         readOnly
//                                                     />
//                                                 </div>
//                                                 <div>
//                                                     <label className="block text-sm font-medium text-secondary-700">Fabric Panel/Width</label>
//                                                     <input
//                                                         type="number"
//                                                         value={newQuality.fabricPanelWidth}
//                                                         onChange={(e) => {
//                                                             const fpw = e.target.value;
//                                                             const se = parseFloat(newQuality.sordEnds || "0") || 0;
//                                                             const prod = se * (parseFloat(fpw || "1") || 1);
//                                                             setNewQuality({ ...newQuality, fabricPanelWidth: fpw, actualEnds: String(Math.round(prod)) });
//                                                         }}
//                                                         className="input mt-1"
//                                                         min="0"
//                                                         step="0.01"
//                                                     />
//                                                 </div>
//                                                 <div>
//                                                     <label className="block text-sm font-medium text-secondary-700">Beam Ends <span className="text-red-600">*</span></label>
//                                                     <input
//                                                         type="number"
//                                                         value={newQuality.actualEnds}
//                                                         className="input mt-1"
//                                                         min="0"
//                                                         step="1"
//                                                         readOnly
//                                                     />
//                                                 </div>
//                                             </div>
//                                         </div>
//                                         {layerData.length > 0 && (
//                                             <div>
//                                                 <h3 className="text-lg font-medium text-secondary-700 mb-2">Yarn and Actual Yarn Details</h3>
//                                                 <div className="overflow-x-auto">
//                                                     <table className="w-full border-collapse border border-gray-300 text-center">
//                                                         <thead className="bg-gray-100">
//                                                             <tr>
//                                                                 <th className="border p-2">Layer</th>
//                                                                 <th className="border p-2">Yarn</th>
//                                                                 <th className="border p-2">Actual Yarn <span className="text-red-600">*</span></th>
//                                                                 <th className="border p-2">Warp Ends</th>
//                                                                 <th className="border p-2">Actual Warp Ends <span className="text-red-600">*</span></th>
//                                                                 <th className="border p-2">Parts (Warp Beam) <span className="text-red-600">*</span></th>
//                                                                 <th className="border p-2">Ends Per Part</th>
//                                                                 <th className="border p-2">Warp Meters</th>
//                                                             </tr>
//                                                         </thead>
//                                                         <tbody>
//                                                             {layerData.map((layer, idx) => (
//                                                                 <tr key={idx} className="border">
//                                                                     <td className="border p-2">{idx + 1}</td>
//                                                                     <td className="border p-2">
//                                                                         <input
//                                                                             value={layer.yarnName}
//                                                                             className="input mt-1 w-full bg-gray-50"
//                                                                             readOnly
//                                                                         />
//                                                                     </td>
//                                                                     <td className="border p-2">
//                                                                         <CommonSearchableSelect
//                                                                             value={layer.actualYarn}
//                                                                             onValueChange={(val) => updateLayerField(idx, 'actualYarn', val)}
//                                                                             options={normalizedYarnMasters?.map((yarn: YarnMaster) => ({
//                                                                                 value: String(yarn.id),
//                                                                                 label: yarn.yarnName
//                                                                             }))}
//                                                                             placeholder="Select Actual Yarn"
//                                                                             className="mt-1 w-full"
//                                                                              disabled={isPlanMapped}
//                                                                         />
//                                                                     </td>
//                                                                     <td className="border p-2">
//                                                                         <input
//                                                                             value={layer.warpEnds}
//                                                                             className="input mt-1 w-full bg-gray-50"
//                                                                             readOnly
//                                                                         />
//                                                                     </td>
//                                                                     <td className="border p-2">
//                                                                         <input
//                                                                             type="number"
//                                                                             value={layer.actualWarpEnds}
//                                                                             onChange={(e) => updateLayerField(idx, 'actualWarpEnds', e.target.value)}
//                                                                             className="input mt-1 w-full"
//                                                                             min="0"
//                                                                             step="1"
//                                                                         />
//                                                                     </td>
//                                                                     <td className="border p-2">
//                                                                         <input
//                                                                             type="number"
//                                                                             value={layer.parts}
//                                                                             onChange={(e) => updateLayerField(idx, 'parts', e.target.value)}
//                                                                             className="input mt-1 w-full"
//                                                                             min="1"
//                                                                             step="1"
//                                                                         />
//                                                                     </td>
//                                                                     <td className="border p-2">
//                                                                         <input
//                                                                             value={layer.endsPerPart}
//                                                                             className="input mt-1 w-full bg-gray-50"
//                                                                             readOnly
//                                                                         />
//                                                                     </td>
//                                                                     <td className="border p-2">
//                                                                         <input
//                                                                             type="number"
//                                                                             value={layer.warpMeters}
//                                                                             onChange={(e) => updateLayerField(idx, 'warpMeters', e.target.value)}
//                                                                             className="input mt-1 w-full"
//                                                                             min="0"
//                                                                             step="0.01"
//                                                                         />
//                                                                     </td>
//                                                                 </tr>
//                                                             ))}
//                                                         </tbody>
//                                                     </table>
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                     {formError && <p className="mt-1 text-sm text-red-600">{formError}</p>}
//                                     <Button onClick={addAllItems} className="mt-4 ml-auto flex items-center" disabled={layerData.length === 0}>
//                                         <Plus size={18} className="mr-2" />
//                                         {editingIndex !== null ? "Update Item" : "Add All Items"}
//                                     </Button>
//                                 </CardContent>
//                             </Card> */}
//                             {/* <CardHeader>
//                                     <CardTitle className="flex items-center gap-2">
//                                         <ShoppingCart size={20} /> Summary Details
//                                     </CardTitle>
//                                 </CardHeader> */}
//                             <div>
//                                 <h1 className="text-xl font-bold my-4">Sizing Plan Summary</h1>
//                                 <div className="grid grid-cols-4 gap-6 my-4">
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">
//                                             Fabric Code/Quality <span className="text-red-600">*</span>
//                                         </label>
//                                         <CommonSearchableSelect
//                                             value={newQuality.fabricId}
//                                             onValueChange={(val) => handleFabricSelection(val)}
//                                             options={normalizedFabricMasters?.map((fabric: FabricMaster) => ({
//                                                 value: String(fabric.id),
//                                                 label: `${fabric.fabricCode} - ${fabric.fabricQuality}`
//                                             }))}
//                                             placeholder="Select Fabric"
//                                             className="mt-1"
//                                             // disabled={isPlanMapped}
//                                         />
//                                     </div>

//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">
//                                             Sort Ends
//                                         </label>
//                                         <input
//                                             value={newQuality.sordEnds}
//                                             className="input mt-1"
//                                             readOnly
//                                         />
//                                     </div>

//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">
//                                             Fabric Panel/Width
//                                         </label>
//                                         <input
//                                             type="number"
//                                             value={newQuality.fabricPanelWidth}
//                                             onChange={(e) => {
//                                                 const fpw = e.target.value;
//                                                 const se = parseFloat(newQuality.sordEnds || "0") || 0;
//                                                 const prod = se * (parseFloat(fpw || "1") || 1);
//                                                 setNewQuality({
//                                                     ...newQuality,
//                                                     fabricPanelWidth: fpw,
//                                                     actualEnds: String(Math.round(prod))
//                                                 });
//                                             }}
//                                             className="input mt-1"
//                                             min="0"
//                                             step="0.01"
//                                         />
//                                     </div>

//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">
//                                             Beam Ends <span className="text-red-600">*</span>
//                                         </label>
//                                         <input
//                                             type="number"
//                                             value={newQuality.actualEnds}
//                                             className="input mt-1"
//                                             min="0"
//                                             step="1"
//                                             readOnly
//                                         />
//                                     </div>
//                                 </div>
//                                 <div className="my-4">
//                                 {layerData.length > 0 && (
//                                     <div>
//                                         <h3 className="text-lg font-medium text-secondary-700 mb-2">Yarn and Actual Yarn Details</h3>
//                                         <div className="overflow-x-auto">
//                                             <table className="w-full border-collapse border border-gray-300 text-center">
//                                                 <thead className="bg-gray-100">
//                                                     <tr>
//                                                         <th className="border p-2">Layer</th>
//                                                         <th className="border p-2">Yarn</th>
//                                                         <th className="border p-2">Actual Yarn <span className="text-red-600">*</span></th>
//                                                         <th className="border p-2">Warp Ends</th>
//                                                         <th className="border p-2">Actual Warp Ends <span className="text-red-600">*</span></th>
//                                                         <th className="border p-2">Parts (Warp Beam) <span className="text-red-600">*</span></th>
//                                                         <th className="border p-2">Ends Per Part</th>
//                                                         <th className="border p-2">Warp Meters</th>
//                                                     </tr>
//                                                 </thead>
//                                                 <tbody>
//                                                     {layerData.map((layer, idx) => (
//                                                         <tr key={idx} className="border">
//                                                             <td className="border p-2">{idx + 1}</td>
//                                                             <td className="border p-2">
//                                                                 <input
//                                                                     value={layer.yarnName}
//                                                                     className="input mt-1 w-full bg-gray-50"
//                                                                     readOnly
//                                                                 />
//                                                             </td>
//                                                             <td className="border p-2">
//                                                                 <CommonSearchableSelect
//                                                                     value={layer.actualYarn}
//                                                                     onValueChange={(val) => updateLayerField(idx, 'actualYarn', val)}
//                                                                     options={normalizedYarnMasters?.map((yarn: YarnMaster) => ({
//                                                                         value: String(yarn.id),
//                                                                         label: yarn.yarnName
//                                                                     }))}
//                                                                     placeholder="Select Actual Yarn"
//                                                                     className="mt-1 w-full"
//                                                                     // disabled={isPlanMapped}
//                                                                 />
//                                                             </td>
//                                                             <td className="border p-2">
//                                                                 <input
//                                                                     value={layer.warpEnds}
//                                                                     className="input mt-1 w-full bg-gray-50"
//                                                                     readOnly
//                                                                 />
//                                                             </td>
//                                                             <td className="border p-2">
//                                                                 <input
//                                                                     type="number"
//                                                                     value={layer.actualWarpEnds}
//                                                                     onChange={(e) => updateLayerField(idx, 'actualWarpEnds', e.target.value)}
//                                                                     className="input mt-1 w-full"
//                                                                     min="0"
//                                                                     step="1"
//                                                                 />
//                                                             </td>
//                                                             <td className="border p-2">
//                                                                 <input
//                                                                     type="number"
//                                                                     value={layer.parts}
//                                                                     onChange={(e) => updateLayerField(idx, 'parts', e.target.value)}
//                                                                     className="input mt-1 w-full"
//                                                                     min="1"
//                                                                     step="1"
//                                                                 />
//                                                             </td>
//                                                             <td className="border p-2">
//                                                                 <input
//                                                                     value={layer.endsPerPart}
//                                                                     className="input mt-1 w-full bg-gray-50"
//                                                                     readOnly
//                                                                 />
//                                                             </td>
//                                                             <td className="border p-2">
//                                                                 <input
//                                                                     type="number"
//                                                                     value={layer.warpMeters}
//                                                                     onChange={(e) => updateLayerField(idx, 'warpMeters', e.target.value)}
//                                                                     className="input mt-1 w-full"
//                                                                     min="0"
//                                                                     step="0.01"
//                                                                 />
//                                                             </td>
//                                                         </tr>
//                                                     ))}
//                                                 </tbody>
//                                             </table>
//                                         </div>
//                                     </div>
//                                 )}
//                                 </div>
//                                 <div>
//                                      {formError && <p className="mt-1 text-sm text-red-600">{formError}</p>}
//                                     <Button onClick={addAllItems} className="mt-4 ml-auto flex items-center" disabled={layerData.length === 0}>
//                                         <Plus size={18} className="mr-2" />
//                                         {editingIndex !== null ? "Update Item" : "Add All Items"}
//                                     </Button>
//                                 </div>
//                             </div>

//                             {/* Summary Table */}
//                             {summaryRows.length > 0 && (
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="flex items-center gap-2">
//                                             <ClipboardList size={20} /> Summary Table
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent>
//                                         <div className="overflow-x-auto">
//                                             <table className="w-full border-collapse border border-gray-300 text-center">
//                                                 <thead className="bg-gray-100">
//                                                     <tr>
//                                                         <th className="border p-2">Actual Yarn</th>
//                                                         <th className="border p-2">Parts (Warp Beam)</th>
//                                                         <th className="border p-2">Actual Warp Ends</th>
//                                                         <th className="border p-2">Ends Per Part</th>
//                                                         <th className="border p-2">Warp Meters</th>
//                                                         <th className="border p-2">Warp Meters - Shrinkage</th>
//                                                     </tr>
//                                                 </thead>
//                                                 <tbody>
//                                                     {summaryRows.map((row: SummaryRow, index: number) => (
//                                                         <tr key={index} className="border">
//                                                             <td className="border p-2">{row.yarnLabel}</td>
//                                                             <td className="border p-2">{row.parts}</td>
//                                                             <td className="border p-2">{row.actualEnds}</td>
//                                                             <td className="border p-2">{row.endsPerPart}</td>
//                                                             <td className="border p-2">{row.rawWarpMeters}</td>
//                                                             <td className="border p-2">{row.warpMetersAfterShrink}</td>
//                                                         </tr>
//                                                     ))}
//                                                 </tbody>
//                                             </table>
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             )}

//                             <Card>
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2">
//                                         <ClipboardList size={20} /> Quality Details
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent>
//                                     <div className="overflow-x-auto">
//                                         <table className="w-full border-collapse border border-gray-300 text-center">
//                                             <thead className="bg-gray-100">
//                                                 <tr>
//                                                     <th className="border p-2">Sl.No</th>
//                                                     <th className="border p-2">Fabric Code/Quality</th>
//                                                     <th className="border p-2">Sort Ends</th>
//                                                     <th className="border p-2">Fabric Panel/Width</th>
//                                                     <th className="border p-2">Beam Ends</th>
//                                                     <th className="border p-2">Actions</th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody>
//                                                 {uniqueQualities.map((q: any, index: number) => (
//                                                     <tr key={index} className="border">
//                                                         <td className="border p-2">{index + 1}</td>
//                                                         <td className="border p-2">{q.fabricCode} / {q.quality}</td>
//                                                         <td className="border p-2">{q.sordEnds}</td>
//                                                         <td className="border p-2">{q.fabricPanelWidth}</td>
//                                                         <td className="border p-2">{q.actualEnds}</td>
//                                                         <td className="border p-2">
//                                                             <button onClick={() => editQualityRow(String(q.key || q.fabricId || ""))} className="text-blue-500">
//                                                                 <Edit size={18} />
//                                                             </button>
//                                                         </td>
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </div>
//                                 </CardContent>
//                             </Card>

//                             <Card>
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2">
//                                         <ClipboardList size={20} /> Yarn Details
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent>
//                                     <div className="overflow-x-auto">
//                                         <table className="w-full border-collapse border border-gray-300 text-center">
//                                             <thead className="bg-gray-100">
//                                                 <tr>
//                                                     <th className="border p-2">Sl.No</th>
//                                                     <th className="border p-2">Yarn</th>
//                                                     <th className="border p-2">Actual Yarn</th>
//                                                     <th className="border p-2">Warp Ends</th>
//                                                     <th className="border p-2">Actual Warp Ends</th>
//                                                     <th className="border p-2">Parts</th>
//                                                     <th className="border p-2">Ends/Part</th>
//                                                     <th className="border p-2">Warp Meters</th>
//                                                     <th className="border p-2">Actions</th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody>
//                                                 {items.map((item: SizingQualityDetails, index: number) => (
//                                                     <tr key={index} className="border">
//                                                         <td className="border p-2">{index + 1}</td>
//                                                         <td className="border p-2">
//                                                             {yarnList.find((y: YarnMaster) => y.id === parseInt(item.yarnId))?.yarnName || item.yarnId}
//                                                         </td>
//                                                         <td className="border p-2">
//                                                             {yarnList.find((y: YarnMaster) => y.id === parseInt(item.actualYarn))?.yarnName || item.actualYarn}
//                                                         </td>
//                                                         <td className="border p-2">{item.warpEnds}</td>
//                                                         <td className="border p-2">{item.actualWarpEnds}</td>
//                                                         <td className="border p-2">{Math.round(parseFloat(item.parts) || 0)}</td>
//                                                         <td className="border p-2">{Math.round(parseFloat(item.endsPerPart) || 0)}</td>
//                                                         <td className="border p-2">{item.warpMeters}</td>
//                                                         <td className="border p-2">
//                                                             <button onClick={() => editItem(index)} className="mr-2 text-blue-500">
//                                                                 <Edit size={18} />
//                                                             </button>
//                                                             <button onClick={() => deleteItem(index)} className="text-red-500">
//                                                                 <Trash2 size={18} />
//                                                             </button>
//                                                         </td>
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         </>
//                     )}

//                     {activeTab === "beamDetails" && (
//                         <>
//                             <div className="flex flex-col sm:flex-row items-center justify-start gap-4 mb-4">
//                                 <div className="flex flex-col">
//                                     <label className="block text-sm font-medium text-gray-700">No of Beams</label>
//                                     <input
//                                         type="number"
//                                         min="0"
//                                         value={numberOfBeams}
//                                         onChange={(e) => setNumberOfBeams(e.target.value)}
//                                         className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
//                                     />
//                                 </div>
//                                 <Button
//                                     onClick={handleAddBeams}
//                                     className="bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center mt-5"
//                                 >
//                                     <Plus size={18} className="mr-2" /> Generate Beams
//                                 </Button>
//                             </div>

//                             {beamInputs.length > 0 && (
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="flex items-center gap-2">
//                                             <ClipboardList size={20} /> Add Beam Details
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent>
//                                         <table className="w-full border-collapse border border-gray-300 text-center">
//                                             <thead className="bg-gray-100">
//                                                 <tr>
//                                                     <th className="border p-2">Sl.No</th>
//                                                     <th className="border p-2">Fabric Code/Quality</th>
//                                                     <th className="border p-2">Weaving Contract No</th>
//                                                     <th className="border p-2">Weaver</th>
//                                                     <th className="border p-2">Sales Order No</th>
//                                                     <th className="border p-2">Fabric Panel/Width</th>
//                                                     <th className="border p-2">Warp Meters</th>
//                                                     <th className="border p-2">Shrinkage %</th>
//                                                     <th className="border p-2">Expected Fabric Meter</th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody>
//                                                 {beamInputs.map((beam: SizingBeamDetails, index: number) => {
//                                                     const contractSalesOrders = getSalesOrdersForContract(beam.weavingContractId);
//                                                     const fallbackSalesOrderNeeded = !!(
//                                                         beam.salesOrderId &&
//                                                         !contractSalesOrders.some(
//                                                             (so: any) =>
//                                                                 String(so?.id ?? so?.salesOrderNo ?? so?.orderNo ?? "") ===
//                                                                 String(beam.salesOrderId)
//                                                         )
//                                                     );
//                                                     return (
//                                                         <tr key={index} className="border">
//                                                             <td className="border p-2">{index + 1}</td>
//                                                             <td className="border p-2">
//                                                                 <CommonSearchableSelect
//                                                                     value={beam.fabricId || ""}
//                                                                     onValueChange={(val) => handleBeamInputChange(index, 'fabricId', val)}
//                                                                     options={uniqueQualities.map((u: any) => ({
//                                                                         value: String(u.fabricId || ""),
//                                                                         label: `${u.fabricCode} / ${u.quality}`
//                                                                     }))}
//                                                                     placeholder="Select"
//                                                                     className="mt-1"
//                                                                     // disabled={isPlanMapped}
//                                                                 />
//                                                             </td>
//                                                             {/* In the JSX where the weaving contract dropdown is rendered */}
//                                                             {/* In the JSX where the weaving contract dropdown is rendered */}
//                                                             <td className="border p-2">
//                                                                 <CommonSearchableSelect
//                                                                     value={beam.weavingContractId}
//                                                                     onValueChange={(val) => handleBeamInputChange(index, 'weavingContractId', val)}
//                                                                     disabled={!beam.fabricId}
//                                                                     placeholder={!beam.fabricId ? "Select Fabric first" : "Select"}
//                                                                     options={normalizedWeavingContracts
//                                                                         .filter((wc: WeavingContract) => {
//                                                                             const fabricMatch = wc.items?.some((it: any) => it.fabricCodeId === parseInt(String(beam.fabricId)));
//                                                                             if (!fabricMatch) return false;
//                                                                             const wcCompanyId = (wc as any)?.companyId;
//                                                                             return wcCompanyId === resolvedCompanyId;
//                                                                         })
//                                                                         .map((wc: WeavingContract) => ({
//                                                                             value: String(wc.id),
//                                                                             label: wc.weavingContractNo
//                                                                         }))}
//                                                                     className="mt-1"
//                                                                 />
//                                                             </td>
//                                                             {/* <td className="border p-2">
//                                                                 <select
//                                                                     value={beam.weavingContractId}
//                                                                     onChange={(e) => handleBeamInputChange(index, 'weavingContractId', e.target.value)}
//                                                                     className="input mt-1 w-full"
//                                                                     disabled={!beam.fabricId}
//                                                                 >
//                                                                     {!beam.fabricId ? (
//                                                                         <option value="">Select Fabric first</option>
//                                                                     ) : (
//                                                                         <>
//                                                                             <option value="">Select</option>
//                                                                             {(() => {
//                                                                                 const currentOrderType = parseInt(orderTypeId || "0");
//                                                                                 let filteredContracts = weavingContractList
//                                                                                     .filter((wc: WeavingContract) =>
//                                                                                         wc.items?.some((it: any) => it.fabricCodeId === parseInt(String(beam.fabricId)))
//                                                                                     );

//                                                                                 // Apply order type based filtering
//                                                                                 if (currentOrderType === 2) { // External
//                                                                                     filteredContracts = filteredContracts.filter((wc: WeavingContract) => {
//                                                                                         const wcCompanyId = (wc as any)?.companyId;
//                                                                                         return wcCompanyId === resolvedCompanyId;
//                                                                                     });
//                                                                                 }
//                                                                                 // For Internal (orderTypeId === 1), show all filtered contracts

//                                                                                 return filteredContracts.map((wc: WeavingContract) => (
//                                                                                     <option key={wc.id} value={wc.id}>{wc.weavingContractNo}</option>
//                                                                                 ));
//                                                                             })()}
//                                                                         </>
//                                                                     )}
//                                                                 </select>
//                                                             </td> */}
//                                                             <td className="border p-2">
//                                                                 <CommonSearchableSelect
//                                                                     value={beam.weavingVendorId}
//                                                                     onValueChange={(val) => handleBeamInputChange(index, 'weavingVendorId', val)}
//                                                                     options={weaverVendorList.map((v: any) => ({
//                                                                         value: String(v.id),
//                                                                         label: v.vendorName
//                                                                     }))}
//                                                                     placeholder="Select"
//                                                                     className="mt-1"
//                                                                     // disabled={isPlanMapped}
//                                                                 />
//                                                             </td>
//                                                             <td className="border p-2">
//                                                                 <CommonSearchableSelect
//                                                                     value={beam.salesOrderId || ""}
//                                                                     onValueChange={(val) => handleBeamInputChange(index, 'salesOrderId', val)}
//                                                                     disabled={!beam.weavingContractId}
//                                                                     placeholder={!beam.weavingContractId ? "Select Weaving Contract first" : "Select"}
//                                                                     options={[
//                                                                         ...contractSalesOrders.map((so: any) => {
//                                                                             const val = so?.id ?? so?.salesOrderNo ?? so?.orderNo;
//                                                                             return {
//                                                                                 value: String(val || ""),
//                                                                                 label: resolveSalesOrderLabel(val) || String(val || "")
//                                                                             };
//                                                                         }).filter(opt => opt.value !== "" && opt.label !== ""),
//                                                                         ...(fallbackSalesOrderNeeded && resolveSalesOrderLabel(beam.salesOrderId) ? [{
//                                                                             value: String(beam.salesOrderId),
//                                                                             label: resolveSalesOrderLabel(beam.salesOrderId)
//                                                                         }] : [])
//                                                                     ]}
//                                                                     className="mt-1"
//                                                                 />
//                                                             </td>

//                                                             <td className="border p-2">
//                                                                 <input
//                                                                     value={beam.fabricPanelWidth || planFabricPanelWidth}
//                                                                     className="input mt-1 w-full bg-gray-50"
//                                                                     readOnly
//                                                                 />
//                                                             </td>
//                                                             <td className="border p-2">
//                                                                 <input
//                                                                     type="number"
//                                                                     step="0.01"
//                                                                     value={beam.warpMeters}
//                                                                     onChange={(e) => handleBeamInputChange(index, 'warpMeters', e.target.value)}
//                                                                     className="input mt-1 w-full"
//                                                                     placeholder="Enter"
//                                                                 />
//                                                             </td>
//                                                             <td className="border p-2">
//                                                                 <input
//                                                                     type="number"
//                                                                     step="0.1"
//                                                                     value={beam.shrinkage}
//                                                                     onChange={(e) => handleBeamInputChange(index, 'shrinkage', e.target.value)}
//                                                                     className="input mt-1 w-full"
//                                                                     placeholder="Enter"
//                                                                 />
//                                                             </td>
//                                                             <td className="border p-2">
//                                                                 <input
//                                                                     value={beam.expectedFabricMeter}
//                                                                     className="input mt-1 w-full bg-gray-50"
//                                                                     readOnly
//                                                                 />
//                                                             </td>
//                                                         </tr>
//                                                     );
//                                                 })}
//                                             </tbody>
//                                         </table>
//                                         <Button
//                                             onClick={addBeamItems}
//                                             className="mt-4 ml-auto flex items-center"
//                                             disabled={beamInputs.length === 0}
//                                         >
//                                             <Plus size={18} className="mr-2" />
//                                             Add Beam Items
//                                         </Button>
//                                     </CardContent>
//                                 </Card>
//                             )}

//                             {beamItems.length > 0 && (
//                                 <Card>
//                                     <CardHeader>
//                                         <CardTitle className="flex items-center gap-2">
//                                             <ClipboardList size={20} /> Beam Summary
//                                         </CardTitle>
//                                     </CardHeader>
//                                     <CardContent>
//                                         <table className="w-full border-collapse border border-gray-300 text-center">
//                                             <thead className="bg-gray-100">
//                                                 <tr>
//                                                     <th className="border p-2">Sl.No</th>
//                                                     <th className="border p-2">Fabric Code/Quality</th>
//                                                     <th className="border p-2">Weaving Contract No</th>
//                                                     <th className="border p-2">Weaver Name</th>
//                                                     <th className="border p-2">Sales Order No</th>

//                                                     <th className="border p-2">Warp Meters</th>
//                                                     <th className="border p-2">Shrinkage %</th>
//                                                     <th className="border p-2">Fabric Panel/Width</th>
//                                                     <th className="border p-2">Expected Fabric Meter</th>
//                                                     <th className="border p-2">Actions</th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody>
//                                                 {beamItems.map((item: SizingBeamDetails, index: number) => (
//                                                     <tr key={index} className="border">
//                                                         <td className="border p-2">{index + 1}</td>
//                                                         <td className="border p-2">
//                                                             {(() => {
//                                                                 const u = uniqueQualities.find((u: any) => String(u.fabricId || "") === String(item.fabricId || ""));
//                                                                 return u ? `${u.fabricCode} / ${u.quality}` : "";
//                                                             })()}
//                                                         </td>
//                                                         <td className="border p-2">
//                                                             {weavingContractList?.find((wc: WeavingContract) => wc.id === parseInt(item.weavingContractId))?.weavingContractNo || item.weavingContractId}
//                                                         </td>
//                                                         <td className="border p-2">
//                                                             {(() => {
//                                                                 const id = item.weavingVendorId ? parseInt(item.weavingVendorId) : (weavingContractList?.find((wc: WeavingContract) => wc.id === parseInt(item.weavingContractId))?.vendorId);
//                                                                 return vendorList?.find((v: any) => v.id === id)?.vendorName || item.weavingVendorId || "";
//                                                             })()}
//                                                         </td>
//                                                         <td className="border p-2">
//                                                             {resolveSalesOrderLabel(item.salesOrderId)}
//                                                         </td>

//                                                         <td className="border p-2">{item.warpMeters}</td>
//                                                         <td className="border p-2">{item.shrinkage}%</td>
//                                                         <td className="border p-2">{item.fabricPanelWidth || planFabricPanelWidth}</td>
//                                                         <td className="border p-2">{item.expectedFabricMeter}</td>
//                                                         <td className="border p-2">
//                                                             <button
//                                                                 onClick={() => editBeamItem(index)}
//                                                                 className="mr-2 text-blue-500"
//                                                             >
//                                                                 <Edit size={18} />
//                                                             </button>
//                                                             <button
//                                                                 onClick={() => deleteBeamItem(index)}
//                                                                 className="text-red-500"
//                                                             >
//                                                                 <Trash2 size={18} />
//                                                             </button>
//                                                         </td>
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </CardContent>
//                                 </Card>
//                             )}

                             
//                         </>
//                     )}
//                 </div>
//                 <div className="flex justify-end mt-4">
//                  <Button
//                         onClick={handleSaveClick}
//                         disabled={isSaveDisabled}
//                         // className={saveButtonClassName}
//                         aria-disabled={isSaveDisabled}
//                         className="text-white"
//                     >
//                         <Save size={18} className="mr-2" />
//                         {sizingPlanDtl?.id ? "Update Sizing Plan" : "Save Sizing Plan"}
//                     </Button>
//                     </div>
//                 <div>

//                     {isPlanMapped && (
//                         <div className="mt-4 flex gap-3.5 items-center bg-orange-50 border border-orange-300 rounded-xl px-4 py-3.5">
//                             <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
//                                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C05621" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                     <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
//                                 </svg>
//                             </div>
//                             <div>
//                                 <p className="text-[13px] font-medium text-orange-900 m-0 mb-0.5">Record is linked to other modules</p>
//                                 <p className="text-xs text-orange-700 m-0 mb-1.5">The fields below are locked and cannot be modified.</p>
//                                 <div className="flex flex-wrap gap-1.5">
//                                     {["Order Type", "Sizing Vendor", "Fabric Code/Quality", "Actual Yarn", "Weaving Contract No", "Weaver", "Sales Order No"].map(f => (
//                                         <span key={f} className="text-[11px] font-medium bg-orange-200 text-orange-900 rounded-full px-2.5 py-0.5">{f}</span>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                     {/* <p>{isWeavingContractMapped ? "This weaving contract is mapped and cannot be modified." : ""}</p> */}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default SizingPlanEntry;
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { FileText, ShoppingCart, ClipboardList, Plus, Edit, Trash2, Save, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { getAllTermsConditions } from "@/state/termsConditions";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllPoTypes } from "@/state/purchaseOrderSlice";
import { useAuth } from "@/contexts/AuthContext";
import { VENDOR_TYPE_ALL, filterVendorsByTypeIds } from "@/utils/vendorFilters";
import documentNumberService from "@/services/DocumentNumberService";
import { createSizingPlan, updateSizingPlan, getAllSizingPlan } from "@/state/sizingPlanSlice";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { useMappingStatus } from "@/hooks/useMappingStatus";
import { useAutoDocumentNumber } from "@/components/common/useAutoDocumentNumber";

// Yarn Issue slice and components imports
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllTransports } from "@/state/transportSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { createSizingYarnIssue, updateSizingYarnIssue } from "@/state/sizingYarnIssueSlice";
import apiService from "@/services/ApiService";
import { PopupDataTable, PopupColumn } from "@/components/data/PopupDataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CodesAPI } from "@/services/codes_api";
import { CodeDetail } from "@/types/codes";
import { CodesUtil } from "@/utils/codesUtil";


// Interface Definitions
interface SizingPlanEntryFormData {
    id?: number;
    vendorId: string;
    orderTypeId: string;
    termsConditionsId: string;
    paymentTermsId: string;
    sizingRate: string;
    emptyBeamNo: string;
    noOfCreels?: string;
    remarks: string;
    sizingPlanNo: string;
    sizingPlanDate: string;
    sizingQualityDetails: SizingQualityDetails[];
    sizingBeamDetails: SizingBeamDetails[];
}

interface SizingQualityDetails {
    id?: number | null;
    fabricId?: string;
    quality: string;
    fabricCode: string;
    yarnId: string;
    yarnName?: string;
    actualYarn: string;
    sordEnds: string;
    actualEnds: string;
    warpEnds: string;
    actualWarpEnds: string;
    parts: string;
    endsPerPart: string;
    noReqCones?: number | string;
    warpMeters: string;
    fabricPanelWidth?: string;
    noOfCreels?: number | string;
}

interface SizingBeamDetails {
    id?: number | null;
    weavingContractId: string;
    salesOrderId: string;
    weavingVendorId: string;
    warpMeters: string;
    shrinkage: string;
    expectedFabricMeter: string;
    fabricPanelWidth?: string;
    fabricId?: string;
    beamTypeId?: string;
}

interface LotDetail {
  id: number | string;
  uniqueId?: number | string;
  yarnId?: number;
  yarnName: string;
  yarnType?: 'original' | 'actual';
  originalYarnName?: string;
  lotNumber: string;
  lotNo?: string;
  availableQty: number;
  actualQty?: number;
  issueQty?: number;
  alternateYarn?: string;
  millId?: number | string | null;
  millName?: string;
  warehouseId?: number | string | null;
  warehouseName?: string;
  baseLotId?: number | string;
  lotYarnId?: number | string;
  availableBags?: number;
  lotAvailableBags?: number;
  lotAvailableQty?: number;
  inwardBags?: number;
  noOfBags?: number;
  kgsPerBag?: number;
  conesPerBag?: number;
  conesWeight?: number;
  activeFlag?: boolean;
  acceptedQty?: number;
  issuedQty?: number;
  inwardId?: number | null;
  orderItemId?: number | null;
  yarnInwardStockDetailsId?: number | null;
  inwardTypeId?: number | null;
  inwardType?: string;
  inwardNo?: string;
  millInvNo?: string;
  millDate?: string;
  uomId?: number | null;
  issuedBags?: number | null;
  outwardTypeId?: number | null;
  poCategoryId?: number | null;
  issuingCones?: number | string;
  availableCones?: number;
  perBabyConeWeight?: number | string;
}

interface YarnRequirementDetail {
  id?: number;
  fabricDetails: string;
  yarnName: string;
  actualYarn: string;
  actualYarnId: number;
  yarnId: number;
  warpMeters: number;
  warpGramsPerMeter: number;
  warpRequirement: number;
  totalIssuedQty: number;
  balanceToIssue: number;
  historicalIssuedQty?: number;
}

interface SummaryRow {
    yarnKey: string;
    yarnLabel: string;
    actualEnds: number;
    parts: number;
    endsPerPart: number;
    rawWarpMeters: number;
    warpMetersAfterShrink: number;
}

interface FabricMaster {
    id: number;
    fabricCode: string;
    fabricName: string;
    fabricQuality: string;
    totalEnds: number;
    warpDetails?: Array<{
        yarnId: number;
        epi?: number;
        warpMeters?: number;
        gramsPerMeter?: number;
    }>;
}

interface YarnMaster {
    id: number;
    yarnName: string;
}

interface WeavingContract {
    id: number;
    weavingContractNo: string;
    salesOrderNo: number;
    vendorId?: number;
    items?: Array<{
        fabricCodeId: number;
    }>;
}

interface NewQuality {
    fabricId: string;
    quality: string;
    fabricCode: string;
    sordEnds: string;
    actualEnds: string;
    fabricPanelWidth: string;
}

interface LayerData {
    yarnId: string;
    yarnName: string;
    warpEnds: string;
    warpMeters: string;
    actualYarn: string;
    actualWarpEnds: string;
    parts: string;
    endsPerPart: string;
    noOfCreels?: string;
}

const SIZING_VENDOR_TYPE_ID = 302;
const SIZING_VENDOR_TYPE_IDS = [SIZING_VENDOR_TYPE_ID, VENDOR_TYPE_ALL];

const SizingPlanEntry = () => {
    const [items, setItems] = useState<SizingQualityDetails[]>([]);
    const [beamItems, setBeamItems] = useState<SizingBeamDetails[]>([]);
    const [newQuality, setNewQuality] = useState<NewQuality>({
        fabricId: "",
        quality: "",
        fabricCode: "",
        sordEnds: "",
        actualEnds: "",
        fabricPanelWidth: "1",
    });
    const [layerData, setLayerData] = useState<LayerData[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingFabricId, setEditingFabricId] = useState<string | null>(null);
    const [currentWarpDetails, setCurrentWarpDetails] = useState<any[]>([]);
    const [formError, setFormError] = useState("");

    // Sizing Yarn Issue Integrated States
    const [selectedLots, setSelectedLots] = useState<LotDetail[]>([]);
    const [popupSelectedLots, setPopupSelectedLots] = useState<LotDetail[]>([]);
    const [availableLots, setAvailableLots] = useState<LotDetail[]>([]);
    const [showLotDialog, setShowLotDialog] = useState(false);
    const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
    const [isDraftSaved, setIsDraftSaved] = useState(false);
    const [sizingYarnIssueDtl, setSizingYarnIssueDtl] = useState<any>(null);
    const [yarnIssueChallanNo, setYarnIssueChallanNo] = useState<string>("");
    const [yarnIssueDate, setYarnIssueDate] = useState<string>("");
    const [grossWt, setGrossWt] = useState<string | number>("");
    const [vehicleNo, setVehicleNo] = useState<string>("");
    const [remark, setRemark] = useState<string>("");
    const [transportationDetails, setTransportationDetails] = useState<string>("");
    const [transportId, setTransportId] = useState<string>("");
    const [inwardTypes, setInwardTypes] = useState<CodeDetail[]>([]);
    const [historicalIssuesByYarn, setHistoricalIssuesByYarn] = useState<Record<string, number>>({});


    const { vendorList } = useSelector((state: RootState) => state.vendor);

    const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
    const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
    const { yarnList } = useSelector((state: RootState) => state.yarn);
    const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
    const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions);
    const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
    const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
    const { warehouseList } = useSelector((state: RootState) => state.warehouse);
    const { transportList } = useSelector((state: RootState) => state.transport);
    const { subCategoryList } = useSelector((state: RootState) => state.subCategory);
    const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan);
    const { purchaseOrderTypeList } = useSelector((state: RootState) => state.purchaseOrder);

    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const sizingPlanDtl = location.state?.sizingPlanDtl;
    const fromOrderEntry = location.state?.source === "order-entry-management";
    const navigate = useNavigate();
    const [numberOfBeams, setNumberOfBeams] = useState<string>('0');
    const [beamInputs, setBeamInputs] = useState<SizingBeamDetails[]>([]);
    const [filteredVendorList, setFilteredVendorList] = useState<any[]>([]);
    const { selectedCompany } = useAuth();

    const { isMapped: isPlanMapped } = useMappingStatus({
        endpoint: "/sizing-plan/",
        id: sizingPlanDtl?.id,
        enabled: !!sizingPlanDtl?.id,
    });

    const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        getValues,
        formState: { errors, isValid }
    } = useForm<SizingPlanEntryFormData>({
        mode: 'onBlur',
        reValidateMode: 'onBlur'
    });

    const orderTypeId = watch('orderTypeId');
    const vendorIdVal = watch('vendorId');

    const normalizedFabricMasters = useMemo(() => {
        let list = [];
        if (Array.isArray(fabricMasterList)) list = fabricMasterList;
        else if (Array.isArray((fabricMasterList as any)?.data)) list = (fabricMasterList as any).data;
        return list.filter((f: any) => f.isActive !== false && f.activeFlag !== false);
    }, [fabricMasterList]);

    const normalizedYarnMasters = useMemo(() => {
        let list = [];
        if (Array.isArray(yarnList)) list = yarnList;
        else if (Array.isArray((yarnList as any)?.data)) list = (yarnList as any).data;
        return list.filter((y: any) => y.isActive !== false && y.activeFlag !== false);
    }, [yarnList]);

    const normalizedWeavingContracts = useMemo(() => {
        let list = [];
        if (Array.isArray(weavingContractList)) list = weavingContractList;
        else if (Array.isArray((weavingContractList as any)?.data)) list = (weavingContractList as any).data;
        return list.filter((c: any) => c.isActive !== false && c.activeFlag !== false);
    }, [weavingContractList]);

    const normalizedSalesOrders = useMemo(() => {
        let list = [];
        if (Array.isArray(salesOrderList)) list = salesOrderList;
        else if (Array.isArray((salesOrderList as any)?.data)) list = (salesOrderList as any).data;
        return list.filter((s: any) => s.isActive !== false && s.activeFlag !== false);
    }, [salesOrderList]);

    const normalizedTermsConditions = useMemo(() => {
        let list = [];
        if (Array.isArray(termsContitionsList)) list = termsContitionsList;
        else if (Array.isArray((termsContitionsList as any)?.data)) list = (termsContitionsList as any).data;
        return list.filter((t: any) => t.isActive !== false && t.activeFlag !== false);
    }, [termsContitionsList]);

    const normalizedPaymentTerms = useMemo(() => {
        let list = [];
        if (Array.isArray(paymentTermsList)) list = paymentTermsList;
        else if (Array.isArray((paymentTermsList as any)?.data)) list = (paymentTermsList as any).data;
        return list.filter((p: any) => p.isActive !== false && p.activeFlag !== false);
    }, [paymentTermsList]);

    const normalizedVendors = useMemo(() => {
        let list = [];
        if (Array.isArray(vendorList)) list = vendorList;
        else if (Array.isArray((vendorList as any)?.data)) list = (vendorList as any).data;
        return list.filter((v: any) => v.isActive !== false && v.activeFlag !== false);
    }, [vendorList]);

    const sizingVendors = useMemo(
        () => filterVendorsByTypeIds(vendorList, SIZING_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null }),
        [vendorList]
    );

    const weaverVendorList = useMemo(
        () => filterVendorsByTypeIds(vendorList, [303, VENDOR_TYPE_ALL], { includeAllVendorTypeId: null }),
        [vendorList]
    );

    const beamTypeOptions = useMemo(() => {
        let list = [];
        if (Array.isArray(subCategoryList)) list = subCategoryList;
        else if (Array.isArray((subCategoryList as any)?.data)) list = (subCategoryList as any).data;
        return list.filter((sc: any) =>
            sc.categoryName === "Beam Type" && sc.isActive !== false && sc.activeFlag !== false
        );
    }, [subCategoryList]);
    // Generate document number for new entries with loading state & cleanup
    useAutoDocumentNumber({
        screenName: "Sizing Plan",
        detail: sizingPlanDtl,
        existingValue: sizingPlanDtl?.sizingPlanNo,
        fieldName: "sizingPlanNo",
        setValue,
        isSavingRef,
    });

    const resolvedCompanyId = useMemo(() => {
        if (selectedCompany != null && !Number.isNaN(Number(selectedCompany))) {
            return Number(selectedCompany);
        }
        const stored = window.localStorage.getItem('selectedCompanyId') || window.localStorage.getItem('selectedCompany');
        if (!stored) return undefined;
        const parsed = Number(stored);
        return Number.isNaN(parsed) ? undefined : parsed;
    }, [selectedCompany]);

    const selectedVendor = useMemo(() => {
        if (!vendorIdVal) return null;
        const base = Array.isArray(vendorList) ? vendorList : [];
        return base.find((v: any) => String(v?.id) === String(vendorIdVal)) || null;
    }, [vendorList, vendorIdVal]);

    const selectedVendorInFiltered = useMemo(() => {
        if (!selectedVendor) return false;
        return filteredVendorList.some((v: any) => Number(v?.id) === Number(selectedVendor.id));
    }, [filteredVendorList, selectedVendor]);

    const allBeams = useMemo(() => {
        const validInputs = beamInputs.filter(beam =>
            beam.weavingContractId && beam.salesOrderId && beam.weavingVendorId && beam.warpMeters && beam.shrinkage
        );
        return [...beamItems, ...validInputs];
    }, [beamItems, beamInputs]);



    const normalizeName = useCallback((value?: string | number | null) => {
        if (value === undefined || value === null) {
            return "";
        }
        return String(value).toLowerCase().replace(/[\s\W]+/g, "");
    }, []);

    const companyOptions = useMemo(() => {
        if (Array.isArray(companyMasterList)) return companyMasterList;
        if (Array.isArray(companyMasterList?.data)) return companyMasterList.data;
        return [];
    }, [companyMasterList]);

    const companyNameLookup = useMemo(() => {
        const map = new Map<string, number>();
        companyOptions.forEach((company: any) => {
            const id = company?.id ?? company?.companyId;
            if (!id) return;
            const candidates = [company?.companyName, company?.name, company?.legalName, company?.displayName];
            candidates.forEach((name) => {
                const key = normalizeName(name);
                if (key && !map.has(key)) {
                    map.set(key, Number(id));
                }
            });
        });
        return map;
    }, [companyOptions, normalizeName]);


    const resolveFactoryCompanyId = useCallback(
        (vendor?: any) => {
            if (!vendor) return null;
            const directIds = [vendor?.companyId, vendor?.company?.id, vendor?.company?.companyId].filter(
                (id) => id !== undefined && id !== null
            );
            for (const directId of directIds) {
                const matched = companyOptions.find(
                    (company: any) => String(company?.id ?? company?.companyId) === String(directId)
                );
                if (matched) {
                    return Number(matched.id ?? matched.companyId);
                }
            }
            const nameCandidates = [vendor?.vendorName, vendor?.customerName, vendor?.companyName, vendor?.name];
            for (const name of nameCandidates) {
                const key = normalizeName(name);
                if (key && companyNameLookup.has(key)) {
                    return companyNameLookup.get(key) ?? null;
                }
            }
            return null;
        },
        [companyOptions, companyNameLookup, normalizeName]
    );


    const isFormValid = isValid &&
        items.length > 0 &&
        items.every((item: SizingQualityDetails) =>
            item.quality && item.yarnId && item.sordEnds
        ) &&
        allBeams.length > 0;

    // const isFormValid = isValid &&
    //     items.length > 0 &&
    //     items.every((item: SizingQualityDetails) =>
    //         item.quality && item.yarnId && item.sordEnds
    //     );

    const collectMissingMandatoryFields = useCallback(() => {
        const values = getValues();
        const missing = new Set<string>();
        const flagEmpty = (value: any, label: string) => {
            if (value == null || (typeof value === "string" && value.trim() === "")) {
                missing.add(label);
            }
        };

        flagEmpty(values.sizingPlanDate, "Sizing Plan Date");
        flagEmpty(values.orderTypeId, "Order Type");
        flagEmpty(values.vendorId, "Sizing Vendor");
        flagEmpty(values.sizingRate, "Sizing Rate/KG");
        flagEmpty(values.termsConditionsId, "Terms & Conditions");
        flagEmpty(values.paymentTermsId, "Payment Terms");

        if (items.length === 0) {
            missing.add("Quality Details (Sort No/Construction + Beam Ends)");
        } else {
            const needsFabricCode = items.some((item) => {
                const hasCode = (item.fabricCode && item.fabricCode.trim()) || item.fabricId;
                return !hasCode;
            });
            if (needsFabricCode) {
                missing.add("Sort No/Construction for each quality row");
            }

            const needsActualEnds = items.some((item) => {
                const value = item.actualEnds;
                return value == null || value.toString().trim() === "";
            });
            if (needsActualEnds) {
                missing.add("Beam Ends for each quality row");
            }

            const needsActualYarn = items.some((item) => {
                const value = item.actualYarn;
                return value == null || value.toString().trim() === "";
            });
            if (needsActualYarn) {
                missing.add("Actual Yarn for each yarn row");
            }

            const needsActualWarpEnds = items.some((item) => {
                const value = item.actualWarpEnds;
                return value == null || value.toString().trim() === "";
            });
            if (needsActualWarpEnds) {
                missing.add("Actual Warp Ends for each yarn row");
            }

            const needsParts = items.some((item) => {
                const value = item.parts;
                return value == null || value.toString().trim() === "";
            });
            if (needsParts) {
                missing.add("Parts (Warp Beam) for each yarn row");
            }
        }

        return Array.from(missing);
    }, [getValues, items]);


    useEffect(() => {
        const filtered = orderTypeId === '1'
            ? sizingVendors.filter((v: any) => Number(v?.isInternalVendor) === 1)
            : orderTypeId === '2'
                ? sizingVendors.filter((v: any) => Number(v?.isInternalVendor) === 0)
                : [];
        setFilteredVendorList(filtered);
    }, [sizingVendors, orderTypeId]);

    useEffect(() => {
        if (sizingPlanDtl?.sizingPlanNo) {
            setValue('sizingPlanNo', sizingPlanDtl.sizingPlanNo, { shouldValidate: true });
        }
        if (sizingPlanDtl?.vendorId && Array.isArray(vendorList)) {
            const v = vendorList.find((x: any) => x.id === sizingPlanDtl.vendorId);
            if (v) setValue('orderTypeId', Number(v?.isInternalVendor) === 1 ? '1' : '2', { shouldValidate: true });
            // Ensure vendor dropdown preselects saved vendor
            setValue('vendorId', String(sizingPlanDtl.vendorId), { shouldValidate: true });
        }
    }, [sizingPlanDtl, vendorList, setValue]);

    useEffect(() => {
        const scopedParams = resolvedCompanyId ? { companyId: resolvedCompanyId,fetchAll: true } : {fetchAll: true};
        dispatch(getAllVendors(scopedParams));
        dispatch(getAllYarnMasters({ fetchAll: true }));
        dispatch(getAllWeavingContract(scopedParams));
        dispatch(getAllSalesOrders(scopedParams));
        dispatch(getAllPaymentTerms({ fetchAll: true }));
        dispatch(getAllTermsConditions({ fetchAll: true }));
        dispatch(getAllFabricMasters({ fetchAll: true }));
        dispatch(getAllCompanies({fetchAll: true}));
        dispatch(getAllSizingPlan(scopedParams));
        
        // Dispatch actions for yarn issue resources
        dispatch(getAllWarehouse({ fetchAll: true } as any));
        dispatch(getAllTransports({ fetchAll: true }));
        dispatch(getAllSubCategories({ fetchAll: true } as any));
    }, [dispatch, resolvedCompanyId]);

    useEffect(() => {
        if (sizingPlanDtl) {
            reset({
                vendorId: sizingPlanDtl.vendorId ? String(sizingPlanDtl.vendorId) : "",
                orderTypeId: sizingPlanDtl.orderTypeId ? String(sizingPlanDtl.orderTypeId) : "",
                termsConditionsId: sizingPlanDtl.termsConditionsId ? String(sizingPlanDtl.termsConditionsId) : "",
                paymentTermsId: sizingPlanDtl.paymentTermsId ? String(sizingPlanDtl.paymentTermsId) : "",
                sizingRate: sizingPlanDtl.sizingRate ? String(sizingPlanDtl.sizingRate) : "",
                emptyBeamNo: sizingPlanDtl.emptyBeamNo || "",
                noOfCreels: sizingPlanDtl.noOfCreels ? String(sizingPlanDtl.noOfCreels) : "1",
                remarks: sizingPlanDtl.remarks || "",
                sizingPlanDate: sizingPlanDtl.sizingPlanDate || new Date().toISOString().split('T')[0],
            });

            if (Array.isArray(sizingPlanDtl.sizingQualityDetails)) {
                setItems(sizingPlanDtl.sizingQualityDetails.map((item: any) => {
                    let resolvedFabricId: string = item.fabricId ? String(item.fabricId) : "";
                    if (!resolvedFabricId && item.fabricCode && Array.isArray(normalizedFabricMasters)) {
                        const fm = normalizedFabricMasters.find((f: any) => String(f.fabricCode) === String(item.fabricCode));
                        if (fm?.id != null) resolvedFabricId = String(fm.id);
                    }
                    const latestFabric = resolvedFabricId ? normalizedFabricMasters.find((f: any) => String(f.id) === resolvedFabricId) : null;
                    return {
                        id: item.id || null,
                        fabricId: resolvedFabricId,
                        quality: latestFabric ? latestFabric.fabricQuality : (item.quality || ""),
                        fabricCode: latestFabric ? latestFabric.fabricCode : (item.fabricCode || ""),
                        yarnId: item.yarnId ? String(item.yarnId) : "",
                        actualYarn: item.actualYarn ? String(item.actualYarn) : "",
                        sordEnds: item.sordEnds ? String(item.sordEnds) : "",
                        actualEnds: item.actualEnds ? String(item.actualEnds) : "",
                        warpEnds: item.warpEnds ? String(item.warpEnds) : "",
                        actualWarpEnds: item.actualWarpEnds ? String(item.actualWarpEnds) : "",
                        parts: item.parts ? String(item.parts) : "",
                        endsPerPart: item.endsPerPart ? String(item.endsPerPart) : "",
                        warpMeters: item.warpMeters ? String(item.warpMeters) : "",
                        fabricPanelWidth: String(item.fabricPanelWidth || "1"),
                        noOfCreels: item.noOfCreels ? Number(item.noOfCreels) : 1
                    } as SizingQualityDetails;
                }));
            } else {
                setItems([]);
            }

            if (Array.isArray(sizingPlanDtl.sizingBeamDetails)) {
                const planWidthLocal = String((Array.isArray(sizingPlanDtl.sizingQualityDetails) && sizingPlanDtl.sizingQualityDetails.find((i: any) => i?.fabricPanelWidth != null && i.fabricPanelWidth !== "")?.fabricPanelWidth) || "1");
                setBeamItems(sizingPlanDtl.sizingBeamDetails.map((beam: any) => ({
                    id: beam.id || null,
                    weavingContractId: beam.weavingContractId ? String(beam.weavingContractId) : "",
                    salesOrderId: beam.salesOrderId ? String(beam.salesOrderId) : "",
                    weavingVendorId: beam.weavingVendorId ? String(beam.weavingVendorId) : (beam.vendorId ? String(beam.vendorId) : ""),
                    warpMeters: beam.warpMeters != null && !isNaN(Number(beam.warpMeters))
                        ? Number(beam.warpMeters).toFixed(2)
                        : String(beam.warpMeters || ""),
                    shrinkage: beam.shrinkage != null ? String(beam.shrinkage) : "7.5",
                    expectedFabricMeter: beam.expectedFabricMeter != null && !isNaN(Number(beam.expectedFabricMeter))
                        ? Number(beam.expectedFabricMeter).toFixed(2)
                        : String(beam.expectedFabricMeter || ""),
                    fabricPanelWidth: String(beam.fabricPanelWidth ?? planWidthLocal),
                    fabricId: beam.fabricId ? String(beam.fabricId) : "",
                    beamTypeId: beam.beamTypeId ? String(beam.beamTypeId) : "",
                })));
            } else {
                setBeamItems([]);
            }
        } else {
            reset({
                sizingPlanDate: new Date().toISOString().split('T')[0],
                noOfCreels: "1"
            });
        }
    }, [sizingPlanDtl, reset, fabricMasterList]);



    useEffect(() => {
        const loadExistingYarnIssue = async () => {
            if (!sizingPlanDtl?.id) {
                // Initialize default date for new entries
                setYarnIssueDate(new Date().toISOString().split('T')[0]);
                return;
            }
            try {
                const url = resolvedCompanyId ? `/sizing-yarn-issues/company/${resolvedCompanyId}?offset=0&limit=100` : `/sizing-yarn-issues?offset=0&limit=100`;
                const response = await apiService.get(url);
                const allIssues = response?.data || response || [];
                const issuesList = Array.isArray(allIssues) ? allIssues : (allIssues.content || allIssues.data || []);
                const existingIssue = issuesList.find((issue: any) => Number(issue.sizingPlanId) === Number(sizingPlanDtl.id));
                if (existingIssue) {
                    setSizingYarnIssueDtl(existingIssue);
                    setYarnIssueChallanNo(existingIssue.yarnIssueChallanNo || "");
                    setYarnIssueDate(existingIssue.sizingYarnIssueDate?.slice(0, 10) || new Date().toISOString().split('T')[0]);
                    setGrossWt(existingIssue.grossWt || "");
                    setVehicleNo(existingIssue.vehicleNo || "");
                    setRemark(existingIssue.remark || "");
                    setTransportationDetails(existingIssue.transportationDetails || "");
                    setTransportId(existingIssue.transportId ? String(existingIssue.transportId) : "");
                    
                    if (existingIssue.sizingYarnIssue) {
                        setSelectedLots(existingIssue.sizingYarnIssue.map((issue: any) => {
                            let originalYarnName = issue.yarnName;
                            if (existingIssue.requirements) {
                                const matchedReq = existingIssue.requirements.find((req: any) =>
                                    req.yarnId === issue.yarnId || req.yarnName === issue.yarnName
                                );
                                if (matchedReq) {
                                    originalYarnName = matchedReq.yarnName;
                                }
                            }
                            const conesPerBag = Number(issue.conesPerBag ?? issue.noOfConesPerBag ?? 0);
                            const kgsPerBag = Number(issue.kgsPerBag ?? 0);
                            const conesWeight = issue.conesWeight != null
                              ? Number(issue.conesWeight)
                              : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);

                            const availableBagsVal = Number(issue.availableBags ?? issue.lotAvailableBags ?? 0);
                            const availableCones = availableBagsVal * conesPerBag;
                            let issuingCones = Number(issue.issuingCones ?? issue.noOfCones ?? 0);
                            if (!issuingCones) {
                              if (issue.issueQty && conesWeight > 0) {
                                issuingCones = Math.round(Number(issue.issueQty) / conesWeight);
                              } else if (issue.noOfBags && conesPerBag > 0) {
                                issuingCones = Number(issue.noOfBags) * conesPerBag;
                              }
                            }

                             let reqBagsVal = Number(issue.noOfBags ?? issue.issuedBags ?? 0);
                             if (reqBagsVal === 0 && issuingCones > 0 && conesPerBag > 0) {
                                 reqBagsVal = Number((issuingCones / conesPerBag).toFixed(3));
                             }

                             return {
                                id: issue.id,
                                yarnName: issue.yarnName,
                                originalYarnName: originalYarnName,
                                yarnId: issue.yarnId || undefined,
                                alternateYarn: issue.alternateYarn || issue.yarnName,
                                lotNumber: issue.lotNo || '',
                                availableQty: Number(issue.availableReqQty ?? issue.lotAvailableQty ?? 0),
                                lotAvailableQty: Number(issue.lotAvailableQty ?? issue.availableReqQty ?? 0),
                                actualQty: issue.actualQty || 0,
                                issueQty: issue.issueQty || 0,
                                millId: issue.millId ?? null,
                                warehouseId: issue.warehouseId ?? null,
                                noOfBags: reqBagsVal,
                                kgsPerBag,
                                conesPerBag,
                                conesWeight,
                                issuingCones: issuingCones || '',
                                availableCones: availableCones,
                                perBabyConeWeight: (issue.perBabyConeWeight !== null && issue.perBabyConeWeight !== undefined && Number(issue.perBabyConeWeight) > 0) ? Number(issue.perBabyConeWeight) : 0.01,
                                availableBags: availableBagsVal,
                                lotAvailableBags: availableBagsVal,
                                activeFlag: issue.activeFlag !== false,
                                acceptedQty: issue.actualQty || 0,
                                issuedQty: issue.issueQty || 0,
                                inwardId: issue.inwardId ?? null,
                                orderItemId: issue.orderItemId ?? null,
                                yarnInwardStockDetailsId: issue.yarnInwardStockDetailsId ?? null,
                                inwardTypeId: issue.inwardTypeId ?? null,
                                inwardType: issue.inwardType || 'N/A',
                                inwardNo: issue.inwardNo || 'N/A',
                                millInvNo: issue.millInvNo || 'N/A',
                                millDate: issue.millDate ? String(issue.millDate) : 'N/A',
                                uomId: issue.uomId ?? null,
                                issuedBags: reqBagsVal,
                                uniqueId: issue.yarnInwardStockDetailsId 
                                    ? `stock_${issue.yarnInwardStockDetailsId}` 
                                    : (issue.id ? `issue_${issue.id}` : `${issue.orderItemId ?? ''}_${issue.inwardId ?? ''}_${issue.inwardNo || ''}_${issue.lotNo || ''}`)
                            };
                        }));
                    }
                } else {
                    setYarnIssueDate(new Date().toISOString().split('T')[0]);
                }
            } catch (err) {
                console.error("Failed to load existing yarn issue:", err);
            }
        };
        loadExistingYarnIssue();
    }, [sizingPlanDtl, resolvedCompanyId]);

    const handleFabricSelection = useCallback((fabricId: string) => {
        setFormError("");
        const fabric = fabricMasterList.find((f: FabricMaster) => f.id === parseInt(fabricId));
        if (fabric) {
            // Auto-fetch previous sizing rate for this fabric from history
            const rawPlans = Array.isArray(sizingPlanList)
                ? sizingPlanList
                : (Array.isArray((sizingPlanList as any)?.data)
                    ? (sizingPlanList as any).data
                    : (Array.isArray((sizingPlanList as any)?.items) ? (sizingPlanList as any).items : []));
            if (rawPlans && rawPlans.length > 0) {
                const matchingPlans = rawPlans.filter((sp: any) => {
                    const details = sp.sizingQualityDetails || sp.qualityDetails || [];
                    return Array.isArray(details) && details.some((sqd: any) =>
                        (sqd.fabricId != null && String(sqd.fabricId) === String(fabricId)) ||
                        (sqd.fabricCode && fabric.fabricCode && String(sqd.fabricCode) === String(fabric.fabricCode))
                    );
                });
                if (matchingPlans.length > 0) {
                    const sorted = [...matchingPlans].sort((a: any, b: any) => (Number(b.id) || 0) - (Number(a.id) || 0));
                    const latestWithRate = sorted.find((sp: any) => sp.sizingRate != null && sp.sizingRate !== "" && Number(sp.sizingRate) > 0);
                    if (latestWithRate) {
                        setValue('sizingRate', String(latestWithRate.sizingRate), { shouldValidate: true });
                    }
                }
            }

            const warpDetails = fabric.warpDetails || [];
            setNewQuality({
                fabricId,
                quality: fabric.fabricQuality,
                fabricCode: fabric.fabricCode,
                sordEnds: fabric.totalEnds ? String(fabric.totalEnds) : "",
                actualEnds: fabric.totalEnds ? String(Math.round((fabric.totalEnds || 0) * (parseFloat("1") || 1))) : "",
                fabricPanelWidth: "1",
            });
            const currentCreels = watch('noOfCreels') || "1";
            const layers: LayerData[] = warpDetails.map((wd: any) => {
                const yarnName = yarnList.find((y: YarnMaster) => y.id === wd.yarnId)?.yarnName || "";
                const epi = wd.epi ? Math.round(wd.epi) : 0;
                return {
                    yarnId: String(wd.yarnId),
                    yarnName,
                    warpEnds: String(epi),
                    warpMeters: "",
                    actualYarn: String(wd.yarnId),
                    actualWarpEnds: String(epi),
                    parts: "",
                    endsPerPart: "",
                    noOfCreels: currentCreels,
                };
            });
            setLayerData(layers);
            setCurrentWarpDetails(warpDetails);
        } else {
            setNewQuality({
                fabricId,
                quality: "",
                fabricCode: "",
                sordEnds: "",
                actualEnds: "",
                fabricPanelWidth: "1",
            });
            setLayerData([]);
            setCurrentWarpDetails([]);
        }
    }, [fabricMasterList, yarnList, sizingPlanList, setValue, watch]);

    useEffect(() => {
        if (sizingPlanDtl || !fromOrderEntry) return;

        const state = (location.state || {}) as any;
        const selectedSalesOrderNo = state?.salesOrderNo ?? state?.salesOrderData?.salesOrderNo;
        const selectedSalesOrderId = state?.salesOrderId;

        const matchedSalesOrder = normalizedSalesOrders.find((order: any) => {
            if (!order) return false;
            if (selectedSalesOrderId && String(order?.id) === String(selectedSalesOrderId)) return true;
            if (selectedSalesOrderNo && String(order?.salesOrderNo) === String(selectedSalesOrderNo)) return true;
            return false;
        });

        const firstOrderItem = matchedSalesOrder?.items?.[0];
        const stateFabricCode = state?.salesOrderData?.fabricCode;
        const stateQuality = state?.salesOrderData?.quality;
        const orderFabricCode = firstOrderItem?.fabricCode;
        const orderFabricId = firstOrderItem?.fabricCodeId;
        const orderQuality = firstOrderItem?.quality || firstOrderItem?.buyerProduct;

        const matchedFabric = normalizedFabricMasters.find((fabric: FabricMaster) => {
            if (orderFabricId && String(fabric?.id) === String(orderFabricId)) return true;
            if (orderFabricCode && String(fabric?.fabricCode) === String(orderFabricCode)) return true;
            if (stateFabricCode && String(fabric?.fabricCode) === String(stateFabricCode)) return true;
            if (orderQuality && String(fabric?.fabricQuality) === String(orderQuality)) return true;
            if (stateQuality && String(fabric?.fabricQuality) === String(stateQuality)) return true;
            return false;
        });

        if (matchedFabric?.id) {
            handleFabricSelection(String(matchedFabric.id));
        }
    }, [fromOrderEntry, handleFabricSelection, location.state, normalizedFabricMasters, normalizedSalesOrders, sizingPlanDtl]);

    const calculateWarpMeters = useCallback((
        targetYarnId: string,
        partsStr: string,
        coneWeightInput?: number | string,
        noOfCreelsInput?: number | string,
        babyConeWtInput?: number | string
    ): string => {
        const partsNum = parseFloat(partsStr) || 0;
        const coneWeightNum = typeof coneWeightInput === 'number'
            ? coneWeightInput
            : parseFloat(coneWeightInput || "") || 0;
        const babyConeWtNum = typeof babyConeWtInput === 'number'
            ? babyConeWtInput
            : (parseFloat(String(babyConeWtInput ?? "")) || 0.01);
        const creelsNum = parseFloat(String(noOfCreelsInput || "1")) || 1;

        if (partsNum <= 0 || coneWeightNum <= 0 || !targetYarnId) return "";

        const yarnObj = normalizedYarnMasters.find((y: any) =>
            String(y.id) === String(targetYarnId) ||
            y.yarnName === targetYarnId ||
            (y.yarnName && String(y.yarnName).toLowerCase() === String(targetYarnId).toLowerCase())
        );
        if (!yarnObj) return "";

        let countVal = 0;
        if (yarnObj.conversion != null && Number(yarnObj.conversion) > 0) {
            countVal = Number(yarnObj.conversion);
        } else if (yarnObj.countSno) {
            const rawList = Array.isArray(subCategoryList)
                ? subCategoryList
                : Array.isArray((subCategoryList as any)?.data)
                    ? (subCategoryList as any).data
                    : [];
            const countItem = rawList.find((sc: any) => String(sc.id) === String(yarnObj.countSno));
            if (countItem) {
                if (countItem.conversion != null && Number(countItem.conversion) > 0) {
                    countVal = Number(countItem.conversion);
                } else {
                    const nameStr = String(countItem.subCategoryName || countItem.name || "");
                    if (nameStr.includes("/")) {
                        const parts = nameStr.split("/");
                        const n1 = parseFloat(parts[0].replace(/[^0-9.]/g, ''));
                        const n2 = parseFloat(parts[1].replace(/[^0-9.]/g, ''));
                        if (!isNaN(n1) && !isNaN(n2) && n1 > 0 && n2 > 0) {
                            countVal = n2 / n1;
                        }
                    }
                    if (!countVal) {
                        const match = nameStr.match(/\d+(\.\d+)?/);
                        if (match) {
                            countVal = parseFloat(match[0]);
                        }
                    }
                }
            }
        }

        if (countVal > 0) {
            const constantFactor = (840 * 2.205) / 1.0936;
            const effectiveConeWeight = Math.max(0, coneWeightNum - babyConeWtNum);
            const result = effectiveConeWeight * countVal * constantFactor;
            const meters = Math.round((result / partsNum) * creelsNum);
            return meters > 0 ? String(meters) : "";
        }

        return "";
    }, [normalizedYarnMasters, subCategoryList]);

    const updateLayerField = (idx: number, field: keyof LayerData, value: string) => {
        setLayerData((prev) => {
            const newData = prev.map((l, i) =>
                i === idx ? { ...l, [field]: value } : l
            );
            if (field === "actualWarpEnds" || field === "parts") {
                const aw = parseFloat(newData[idx].actualWarpEnds) || 0;
                const p = parseFloat(newData[idx].parts) || 0;
                const epp = p > 0 ? Math.round(aw / p) : 0;
                newData[idx].endsPerPart = String(epp);
            }

            if (field === "parts" || field === "actualYarn" || field === "yarnId" || field === "noOfCreels") {
                const layer = newData[idx];
                const targetYarnId = layer.actualYarn || layer.yarnId;
                const yarnNameVal = layer.yarnName || yarnList.find((y: YarnMaster) => String(y.id) === String(layer.yarnId))?.yarnName || "";
                const matchingLot = selectedLots.find((lot) => {
                    if (lot.yarnId && (String(lot.yarnId) === String(layer.actualYarn) || String(lot.yarnId) === String(layer.yarnId))) return true;
                    if (lot.originalYarnName && (lot.originalYarnName === yarnNameVal || lot.originalYarnName === layer.actualYarn)) return true;
                    if (lot.yarnName && (lot.yarnName === yarnNameVal || lot.yarnName === layer.actualYarn)) return true;
                    if (lot.alternateYarn && (lot.alternateYarn === layer.actualYarn || lot.alternateYarn === yarnNameVal)) return true;
                    return false;
                });
                const coneWeight = matchingLot?.conesWeight ? Number(matchingLot.conesWeight) : 0;
                const babyConeWt = matchingLot?.perBabyConeWeight != null ? matchingLot.perBabyConeWeight : 0.01;
                const creelsVal = layer.noOfCreels || watch('noOfCreels') || '1';
                const calculated = calculateWarpMeters(targetYarnId, layer.parts, coneWeight, creelsVal, babyConeWt);
                if (calculated) {
                    newData[idx].warpMeters = calculated;
                }
            }
            return newData;
        });
    };

    const selectedLotsKey = useMemo(() => {
        return (selectedLots || [])
            .map((l) => `${l.yarnId ?? ''}_${l.yarnName ?? ''}_${l.originalYarnName ?? ''}_${l.alternateYarn ?? ''}_${l.conesWeight ?? 0}_${l.perBabyConeWeight ?? 0.01}_${l.issuingCones ?? 0}_${l.issueQty ?? 0}`)
            .join('|');
    }, [selectedLots]);

    // Recalculate warpMeters in layerData & items for each warp detail/layer individually
    useEffect(() => {
        setLayerData((prevLayerData) => {
            let changed = false;
            const updated = prevLayerData.map((layer) => {
                const targetYarnId = layer.actualYarn || layer.yarnId;
                const yarnNameVal = layer.yarnName || yarnList.find((y: YarnMaster) => String(y.id) === String(layer.yarnId))?.yarnName || "";
                const matchingLot = (selectedLots || []).find((lot) => {
                    if (lot.yarnId && (String(lot.yarnId) === String(layer.actualYarn) || String(lot.yarnId) === String(layer.yarnId))) return true;
                    if (lot.originalYarnName && (lot.originalYarnName === yarnNameVal || lot.originalYarnName === layer.actualYarn)) return true;
                    if (lot.yarnName && (lot.yarnName === yarnNameVal || lot.yarnName === layer.actualYarn)) return true;
                    if (lot.alternateYarn && (lot.alternateYarn === layer.actualYarn || lot.alternateYarn === yarnNameVal)) return true;
                    return false;
                });
                const coneWeight = matchingLot?.conesWeight ? Number(matchingLot.conesWeight) : 0;
                const babyConeWt = matchingLot?.perBabyConeWeight != null ? matchingLot.perBabyConeWeight : 0.01;
                const creelsVal = layer.noOfCreels || watch('noOfCreels') || '1';
                const newMeters = calculateWarpMeters(targetYarnId, layer.parts, coneWeight, creelsVal, babyConeWt) || "";
                if (newMeters !== (layer.warpMeters || "")) {
                    changed = true;
                    return { ...layer, warpMeters: newMeters };
                }
                return layer;
            });
            return changed ? updated : prevLayerData;
        });

        setItems((prevItems) => {
            let changed = false;
            const updated = prevItems.map((item) => {
                const targetYarnId = item.actualYarn || item.yarnId;
                const yarnNameVal = item.yarnName || yarnList.find((y: YarnMaster) => String(y.id) === String(item.yarnId))?.yarnName || "";
                const matchingLot = (selectedLots || []).find((lot) => {
                    if (lot.yarnId && (String(lot.yarnId) === String(item.actualYarn) || String(lot.yarnId) === String(item.yarnId))) return true;
                    if (lot.originalYarnName && (lot.originalYarnName === yarnNameVal || lot.originalYarnName === item.actualYarn)) return true;
                    if (lot.yarnName && (lot.yarnName === yarnNameVal || lot.yarnName === item.actualYarn)) return true;
                    if (lot.alternateYarn && (lot.alternateYarn === item.actualYarn || lot.alternateYarn === yarnNameVal)) return true;
                    return false;
                });
                const coneWeight = matchingLot?.conesWeight ? Number(matchingLot.conesWeight) : 0;
                const babyConeWt = matchingLot?.perBabyConeWeight != null ? matchingLot.perBabyConeWeight : 0.01;
                const creelsVal = item.noOfCreels != null ? String(item.noOfCreels) : (watch('noOfCreels') || '1');
                const newMeters = calculateWarpMeters(targetYarnId, item.parts, coneWeight, creelsVal, babyConeWt) || "";
                if (newMeters !== (item.warpMeters || "")) {
                    changed = true;
                    return { ...item, warpMeters: newMeters };
                }
                return item;
            });
            return changed ? updated : prevItems;
        });
    }, [selectedLotsKey, selectedLots, calculateWarpMeters, items.length, yarnList, watch]);

    const totalQualityWarpMeters = useMemo(() => {
        return items.reduce((sum: number, item: SizingQualityDetails) => {
            return sum + (parseFloat(item.warpMeters) || 0);
        }, 0);
    }, [items]);

    useEffect(() => {
        if (totalQualityWarpMeters === 0) {
            setBeamItems((prev) => (prev.length > 0 ? [] : prev));
            setBeamInputs((prev) => (prev.length > 0 ? [] : prev));
            setNumberOfBeams((prev) => (prev !== '0' ? '0' : prev));
        }
    }, [totalQualityWarpMeters]);

    useEffect(() => {
        const fpw = parseFloat(newQuality.fabricPanelWidth || "1") || 1;
        const se = parseFloat(newQuality.sordEnds || "0") || 0;
        const newAE = Math.round(se * fpw);
        if (String(newAE) !== newQuality.actualEnds) {
            setNewQuality((prev) => ({ ...prev, actualEnds: String(newAE) }));
        }
        setLayerData((prev) => {
            if (!prev.length) return prev;
            return prev.map((l, idx) => {
                const baseEpi = currentWarpDetails[idx]?.epi != null
                    ? Math.round(currentWarpDetails[idx].epi)
                    : (parseFloat(l.warpEnds) || 0);
                const newWarpEnds = Math.round(baseEpi * fpw);
                const newActualWarpEnds = newWarpEnds;
                const partsNum = parseFloat(l.parts) || 0;
                const newEpp = partsNum > 0 ? String(Math.round(newActualWarpEnds / partsNum)) : "";
                return { ...l, warpEnds: String(newWarpEnds), actualWarpEnds: String(newActualWarpEnds), endsPerPart: newEpp };
            });
        });
    }, [newQuality.fabricPanelWidth, newQuality.sordEnds, currentWarpDetails]);

    const addAllItems = () => {
        setFormError("");
        if (!newQuality.fabricId || !newQuality.actualEnds) {
            setFormError("Sort No and Beam Ends are required");
            return;
        }

        let hasLayerError = false;
        layerData.forEach((layer) => {
            if (!layer.actualYarn || !layer.actualWarpEnds || !layer.parts) {
                hasLayerError = true;
            }
        });

        if (hasLayerError) {
            setFormError("All Yarn and Actual Yarn details are required for each layer");
            return;
        }

        let partsValidationError = "";
        for (let idx = 0; idx < layerData.length; idx++) {
            const layer = layerData[idx];
            const p = parseInt(layer.parts, 10);
            const creels = parseInt(layer.noOfCreels || watch('noOfCreels') || '1', 10);
            if (isNaN(p) || p <= 0) {
                partsValidationError = `Layer ${idx + 1}: Parts (Warp Beam) must be a positive integer.`;
                break;
            } else if (creels > 1 && p % creels !== 0) {
                partsValidationError = `Layer ${idx + 1}: When No. of creels is ${creels}, Parts (Warp Beam) must be divisible by ${creels}.`;
                break;
            }
        }

        if (partsValidationError) {
            setFormError(partsValidationError);
            return;
        }

        const newItems: SizingQualityDetails[] = layerData.map((layer) => {
            const epp = Math.round(parseFloat(layer.endsPerPart) || 0);
            const creels = layer.noOfCreels ? parseInt(layer.noOfCreels, 10) : parseInt(watch('noOfCreels') || '1', 10);
            const computedReqCones = epp * creels;
            return {
                fabricId: newQuality.fabricId,
                quality: newQuality.quality,
                fabricCode: newQuality.fabricCode,
                yarnId: layer.yarnId,
                actualYarn: layer.actualYarn,
                sordEnds: newQuality.sordEnds,
                actualEnds: newQuality.actualEnds,
                warpEnds: layer.warpEnds,
                actualWarpEnds: layer.actualWarpEnds,
                parts: layer.parts,
                endsPerPart: layer.endsPerPart,
                noReqCones: computedReqCones,
                warpMeters: layer.warpMeters,
                fabricPanelWidth: newQuality.fabricPanelWidth,
                noOfCreels: creels,
            };
        });

        if (editingFabricId) {
            setItems((prev) => {
                const filtered = prev.filter((it) => String(it.fabricId || "") !== String(editingFabricId));
                return [...filtered, ...newItems];
            });
            setEditingFabricId(null);
            setEditingIndex(null);
        } else if (editingIndex !== null) {
            setItems((prev) =>
                prev.map((item, idx) => (idx === editingIndex ? newItems[0] : item))
            );
            setEditingIndex(null);
        } else {
            setItems((prev) => [...prev, ...newItems]);
        }

        setNewQuality({
            fabricId: "",
            quality: "",
            fabricCode: "",
            sordEnds: "",
            actualEnds: "",
            fabricPanelWidth: "1",
        });
        setLayerData([]);
        setCurrentWarpDetails([]);
    };

    const editItem = (index: number) => {
        const item = items[index];
        let fabric = fabricMasterList.find((f: FabricMaster) => f.id === parseInt(item.fabricId || ""));
        if (!fabric && item.fabricCode) {
            fabric = fabricMasterList.find((f: FabricMaster) => f.fabricCode === item.fabricCode);
        }
        const fabricId = fabric?.id ? String(fabric.id) : (item.fabricId || "");
        const yarnName = yarnList.find((y: YarnMaster) => y.id === parseInt(item.yarnId))?.yarnName || item.yarnId || "";

        // Reflect updated fabric master data for single item
        setNewQuality({
            fabricId,
            quality: fabric?.fabricQuality || item.quality || "",
            fabricCode: fabric?.fabricCode || item.fabricCode || "",
            sordEnds: fabric?.totalEnds != null ? String(fabric.totalEnds) : (item.sordEnds || ""),
            actualEnds: item.actualEnds || "",
            fabricPanelWidth: item.fabricPanelWidth || "1",
        });

        // Try to find matching warp detail from master to get latest epi/warpMeters
        const masterWd = fabric?.warpDetails?.find((wd: any) => String(wd.yarnId) === String(item.yarnId));

        setLayerData([{
            yarnId: item.yarnId || "",
            yarnName,
            warpEnds: masterWd?.epi ? String(Math.round(masterWd.epi)) : (item.warpEnds || ""),
            warpMeters: masterWd?.warpMeters ? String(Math.round(masterWd.warpMeters)) : (item.warpMeters || ""),
            actualYarn: item.actualYarn || "",
            actualWarpEnds: item.actualWarpEnds || "",
            parts: item.parts || "",
            endsPerPart: item.endsPerPart || "",
            noOfCreels: item.noOfCreels != null ? String(item.noOfCreels) : "1",
        }]);

        if (fabric?.warpDetails) {
            const wd = fabric.warpDetails.find((w: any) => w.yarnId === parseInt(item.yarnId));
            if (wd) {
                setCurrentWarpDetails([wd]);
            } else {
                setCurrentWarpDetails(fabric.warpDetails);
            }
        } else {
            setCurrentWarpDetails([]);
        }
        setEditingIndex(index);
        setTimeout(() => {
            const element = document.querySelector('[data-section="quality-details"]');
            if (element) {
                (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 0);
    };

    const deleteItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const editQualityRow = (key: string) => {
        const qItems = items.filter((it) => {
            const k = String(it.fabricId || it.fabricCode || "");
            return k === String(key);
        });
        if (!qItems.length) return;
        const first = qItems[0];
        let fabric: FabricMaster | undefined = undefined;
        if (first.fabricId) {
            fabric = fabricMasterList.find((f: FabricMaster) => f.id === parseInt(first.fabricId || ""));
        }
        if (!fabric && first.fabricCode) {
            fabric = fabricMasterList.find((f: FabricMaster) => f.fabricCode === first.fabricCode);
        }
        const fabricId = fabric?.id ? String(fabric.id) : (first.fabricId || "");

        // Reflect updated fabric master data for quality row
        setNewQuality({
            fabricId: fabricId,
            quality: fabric?.fabricQuality || first.quality || "",
            fabricCode: fabric?.fabricCode || first.fabricCode || "",
            sordEnds: fabric?.totalEnds != null ? String(fabric.totalEnds) : (first.sordEnds || ""),
            actualEnds: first.actualEnds || "",
            fabricPanelWidth: first.fabricPanelWidth || "1",
        });

        const masterWarpDetails = fabric?.warpDetails || [];

        if (masterWarpDetails.length > 0) {
            // Rebuild layerData from master but preserve parts/actualYarn if yarns match
            const layers: LayerData[] = masterWarpDetails.map((wd: any) => {
                const yarnName = yarnList.find((y: YarnMaster) => y.id === wd.yarnId)?.yarnName || "";
                const existingItem = qItems.find(it => String(it.yarnId) === String(wd.yarnId));

                return {
                    yarnId: String(wd.yarnId),
                    yarnName,
                    warpEnds: String(Math.round(wd.epi || 0)),
                    warpMeters: String(Math.round(wd.warpMeters || 0)),
                    actualYarn: existingItem?.actualYarn || String(wd.yarnId),
                    actualWarpEnds: existingItem?.actualWarpEnds || String(Math.round(wd.epi || 0)),
                    parts: existingItem?.parts || "",
                    endsPerPart: existingItem?.endsPerPart || "",
                    noOfCreels: existingItem?.noOfCreels != null ? String(existingItem.noOfCreels) : "1",
                };
            });
            setLayerData(layers);
            setCurrentWarpDetails(masterWarpDetails);
        } else {
            // Fallback to existing items if master has no warp details
            const layers: LayerData[] = qItems.map((it) => {
                const yarnName = yarnList.find((y: YarnMaster) => y.id === parseInt(it.yarnId))?.yarnName || it.yarnId || "";
                return {
                    yarnId: it.yarnId || "",
                    yarnName,
                    warpEnds: it.warpEnds || "",
                    warpMeters: it.warpMeters || "",
                    actualYarn: it.actualYarn || "",
                    actualWarpEnds: it.actualWarpEnds || "",
                    parts: it.parts || "",
                    endsPerPart: it.endsPerPart || "",
                    noOfCreels: it.noOfCreels != null ? String(it.noOfCreels) : "1",
                };
            });
            setLayerData(layers);
            setCurrentWarpDetails([]);
        }

        setEditingFabricId(fabricId);
        setTimeout(() => {
            const element = document.querySelector('[data-section="quality-details"]');
            if (element) {
                (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 0);
    };

    // const handleAddBeams = () => {
    //     const num = parseInt(numberOfBeams) || 0;
    //     if (num > 0) {
    //         const totalWarpMeters = items.reduce((sum: number, item: SizingQualityDetails) => {
    //             return sum + (parseFloat(item.warpMeters) || 0);
    //         }, 0);
    //         const warpMetersPerBeam = num > 0 ? totalWarpMeters / num : 0;
    //         const newBeams: SizingBeamDetails[] = Array(num).fill(0).map(() => {
    //             const fpw = parseFloat(planFabricPanelWidth || "1") || 1;
    //             const base = warpMetersPerBeam * fpw;
    //             const shrink = 0.075;
    //             return {
    //                 weavingContractId: "",
    //                 salesOrderId: "",
    //                 weavingVendorId: orderTypeId === '1' ? String(companyId || '') : "",
    //                 warpMeters: warpMetersPerBeam.toFixed(2),
    //                 shrinkage: "7.5",
    //                 expectedFabricMeter: (base - (base * shrink)).toFixed(2),
    //                 fabricPanelWidth: String(planFabricPanelWidth || "1"),
    //             } as SizingBeamDetails;
    //         });
    //         setBeamInputs(newBeams);
    //     }
    // };
    const parseNumericInput = (value?: string | number) => {
        if (value == null) return NaN;
        const trimmed = typeof value === "number" ? value : String(value).trim();
        if (trimmed === "") return NaN;
        return Number(trimmed);
    };

    const calculateExpectedFabricMeter = (warpMetersValue?: string | number, fabricPanelValue?: string | number, shrinkageValue?: string | number) => {
        const warpMeters = parseNumericInput(warpMetersValue);
        const fabricPanel = parseNumericInput(fabricPanelValue);
        if (Number.isNaN(warpMeters) || Number.isNaN(fabricPanel)) return undefined;
        const shrinkage = parseNumericInput(shrinkageValue);
        const shrinkFactor = Number.isNaN(shrinkage) ? 0 : shrinkage / 100;
        const base = warpMeters * fabricPanel;
        const result = base - (base * shrinkFactor);
        return Number.isFinite(result) ? Number(result).toFixed(2) : undefined;
    };

    const resolveShrinkageFromFabric = useCallback((fabricId?: string) => {
        if (!fabricId) return undefined;
        const raw: any = fabricMasterList as any;
        const fabrics: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        const fabric = fabrics.find((f: any) => String(f?.id) === String(fabricId));
        if (!fabric) return undefined;
        const warpDetails: any[] = Array.isArray(fabric?.warpDetails) ? fabric.warpDetails : [];
        const shrinkValues = warpDetails
            .map((wd: any) => Number(wd?.shrinkagePercent))
            .filter((val: number) => !Number.isNaN(val));
        if (shrinkValues.length === 0) return undefined;
        const avg = shrinkValues.reduce((sum: number, val: number) => sum + val, 0) / shrinkValues.length;
        return String(Number(avg.toFixed(2)));
    }, [fabricMasterList]);

    // const handleAddBeams = () => {
    //     const num = parseInt(numberOfBeams) || 0;
    //     if (num > 0) {
    //         const totalWarpMeters = items.reduce((sum: number, item: SizingQualityDetails) => {
    //             return sum + (parseFloat(item.warpMeters) || 0);
    //         }, 0);
    //         const warpMetersPerBeam = num > 0 ? totalWarpMeters / num : 0;
    //         const shrinkageSource = beamInputs.find(b => b.shrinkage && b.shrinkage.trim() !== "")?.shrinkage
    //             || beamItems.find(b => b.shrinkage && b.shrinkage.trim() !== "")?.shrinkage
    //             || items.map(item => resolveShrinkageFromFabric(item.fabricId)).find(Boolean)
    //             || "7.5";
    //         const expectedFabricMeter = calculateExpectedFabricMeter(warpMetersPerBeam, planFabricPanelWidth || "1", shrinkageSource);
    //         const newBeams: SizingBeamDetails[] = Array(num).fill(0).map(() => ({
    //             weavingContractId: "",
    //             salesOrderId: "",
    //             weavingVendorId: "",
    //             warpMeters: String(warpMetersPerBeam),
    //             shrinkage: shrinkageSource,
    //             expectedFabricMeter: expectedFabricMeter || "",
    //             fabricPanelWidth: String(planFabricPanelWidth || "1"),
    //         } as SizingBeamDetails));
    //         setBeamInputs(newBeams);
    //     }
    // };
    const handleAddBeams = () => {
        const num = parseInt(numberOfBeams) || 0;
        if (num <= 0) return;

        if (selectedLots.length === 0) {
            toast.error("Cant proceed adding beam without issuing yarn from yarn issue section");
            return;
        }

        const hasIncompleteYarnIssue = selectedLots.some((lot) => {
            const babyConeWt = Number(lot.perBabyConeWeight ?? 0);
            const issuingCones = Number(lot.issuingCones ?? 0);
            const requiredBags = Number(lot.noOfBags ?? 0);
            const issueQty = Number(lot.issueQty ?? lot.issuedQty ?? 0);

            return babyConeWt <= 0 || issuingCones <= 0 || requiredBags <= 0 || issueQty <= 0;
        });

        if (hasIncompleteYarnIssue) {
            toast.error("Cant proceed adding beam without issuing yarn from yarn issue section");
            return;
        }

        const totalWarpMeters = items.reduce((sum: number, item: SizingQualityDetails) => {
            return sum + (parseFloat(item.warpMeters) || 0);
        }, 0);
        const warpMetersPerBeam = num > 0 ? Number((totalWarpMeters / num).toFixed(2)) : 0;
        const newBeams: SizingBeamDetails[] = Array(num).fill(0).map(() => {
            const fpw = parseFloat(planFabricPanelWidth || "1") || 1;
            const base = warpMetersPerBeam * fpw;
            const shrink = 0.075;
            const expectedFabricMeter = Number(base - (base * shrink)).toFixed(2);
            const beam: SizingBeamDetails = {
                weavingContractId: "",
                salesOrderId: "",
                weavingVendorId: "",
                beamTypeId: "",
                warpMeters: Number(warpMetersPerBeam).toFixed(2),
                shrinkage: "7.5",
                expectedFabricMeter: expectedFabricMeter,
                fabricPanelWidth: String(planFabricPanelWidth || "1"),
            };

            if (uniqueQualities.length === 1) {
                const onlyQuality = uniqueQualities[0];
                beam.fabricId = String(onlyQuality.fabricId || "");
                if (onlyQuality.fabricPanelWidth) {
                    beam.fabricPanelWidth = String(onlyQuality.fabricPanelWidth);
                }
                const candidates = weavingContractList.filter((wc: WeavingContract) => {
                    const fabricMatch = wc.items?.some((it: any) => it.fabricCodeId === parseInt(String(beam.fabricId)));
                    if (!fabricMatch) return false;
                    const wcCompanyId = (wc as any)?.companyId;
                    return wcCompanyId === resolvedCompanyId;
                });
                if (candidates.length === 1) {
                    const wc = candidates[0];
                    beam.weavingContractId = String(wc.id);
                    beam.salesOrderId = String((wc as any).salesOrderNo || "");
                    if ((wc as any).vendorId != null) {
                        beam.weavingVendorId = String((wc as any).vendorId);
                    }
                }
            }

            return beam;
        });
        setBeamInputs(newBeams);
    };


    const resolvedSalesOrderList = useMemo(() => {
        if (Array.isArray(salesOrderList)) return salesOrderList;
        if (Array.isArray((salesOrderList as any)?.data)) return (salesOrderList as any).data;
        return [];
    }, [salesOrderList]);

    const salesOrderLabelById = useMemo(() => {
        const map = new Map<string, string>();
        resolvedSalesOrderList.forEach((order: any) => {
            if (!order) return;
            const idCandidates = [order?.id, order?.salesOrderId, order?.salesOrder?.id]
                .filter((val) => val !== undefined && val !== null);
            const labelCandidates = [
                order?.salesOrderNo,
                order?.orderNo,
                order?.salesOrderNumber,
                order?.salesOrder?.salesOrderNo,
                order?.salesOrderCode
            ].filter((val) => val !== undefined && val !== null && val !== "");
            const label = labelCandidates.length > 0 ? String(labelCandidates[0]) : undefined;
            idCandidates.forEach((candidate) => {
                const key = String(candidate);
                if (!map.has(key)) {
                    map.set(key, label || key);
                } else if (label) {
                    map.set(key, label);
                }
            });
            if (label && !map.has(label)) {
                map.set(label, label);
            }
        });
        return map;
    }, [resolvedSalesOrderList]);

    const resolveSalesOrderLabel = useCallback(
        (value?: string | number | null) => {
            if (value === undefined || value === null || value === "") return "";
            const key = String(value);
            return salesOrderLabelById.get(key) || "";
        },
        [salesOrderLabelById]
    );

    const salesOrdersByContract = useMemo(() => {
        const map = new Map<string, any[]>();
        const contracts = Array.isArray(weavingContractList) ? weavingContractList : [];
        contracts.forEach((wc: any) => {
            if (!wc?.id) return;
            const key = String(wc.id);
            const matches = resolvedSalesOrderList.filter((order: any) => {
                if (!order) return false;
                const directContractIds = [order.weavingContractId, order.weavingContract?.id, order.contractId].filter((val) => val !== undefined && val !== null);
                if (directContractIds.some((val) => String(val) === key)) return true;
                if (wc.salesOrderId && String(order.id) === String(wc.salesOrderId)) return true;
                if (wc.salesOrderNo && String(order.salesOrderNo) === String(wc.salesOrderNo)) return true;
                return false;
            });
            map.set(key, matches);
        });
        return map;
    }, [resolvedSalesOrderList, weavingContractList]);

    const getSalesOrdersForContract = useCallback(
        (contractId?: string | number | null) => {
            if (!contractId) return [];
            return salesOrdersByContract.get(String(contractId)) || [];
        },
        [salesOrdersByContract]
    );


    // const handleBeamInputChange = (index: number, field: keyof SizingBeamDetails, value: string) => {
    //     const updatedBeams = [...beamInputs];
    //     updatedBeams[index] = {
    //         ...updatedBeams[index],
    //         [field]: value
    //     };

    //     if (field === 'weavingContractId') {
    //         const selectedWc = value ? weavingContractList.find((wc: WeavingContract) => wc.id === parseInt(value)) : undefined;
    //         updatedBeams[index].salesOrderId = "";
    //         if (selectedWc) {
    //             const contractOrders = getSalesOrdersForContract(selectedWc.id);
    //             if (contractOrders.length === 1) {
    //                 const firstOrder = contractOrders[0];
    //                 updatedBeams[index].salesOrderId = String(firstOrder?.id ?? firstOrder?.salesOrderNo ?? "");
    //             } else if (!contractOrders.length && selectedWc.salesOrderNo) {
    //                 updatedBeams[index].salesOrderId = String(selectedWc.salesOrderNo);
    //             }
    //             if (selectedWc.vendorId != null) {
    //                 updatedBeams[index].weavingVendorId = String(selectedWc.vendorId);
    //             }
    //         }
    //     }

    //     if (field === 'fabricId') {
    //         updatedBeams[index].fabricId = value;
    //         // reset dependent fields
    //         updatedBeams[index].weavingContractId = "";
    //         updatedBeams[index].salesOrderId = "";
    //         const q = uniqueQualities.find((u: any) => String(u.fabricId || "") === String(value));
    //         if (q?.fabricPanelWidth) {
    //             updatedBeams[index].fabricPanelWidth = String(q.fabricPanelWidth);
    //         }
    //         // autofill shrinkage% from fabricMasterList.warpDetails (average if multiple)
    //         const fabric = fabricMasterList?.find((f: any) => Number(f?.id) === Number(value));
    //         if (fabric?.warpDetails && Array.isArray(fabric.warpDetails)) {
    //             const vals = fabric.warpDetails
    //                 .map((wd: any) => Number(wd?.shrinkagePercent))
    //                 .filter((v: number) => !Number.isNaN(v));
    //             if (vals.length > 0) {
    //                 const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
    //                 updatedBeams[index].shrinkage = String(Number(avg.toFixed(2)));
    //             }
    //         }

    //         // MODIFIED: Filter weaving contracts based on order type
    //         const currentOrderType = parseInt(orderTypeId || "0");

    //         // Get all weaving contracts that have this fabric in items
    //         const allMatchingContracts = weavingContractList.filter((wc: WeavingContract) =>
    //             wc.items?.some((it: any) => it.fabricCodeId === parseInt(String(value)))
    //         );

    //         // Filter based on order type
    //         let candidates = allMatchingContracts;
    //         if (currentOrderType === 2) { // External
    //             // For External orders, filter by companyId
    //             candidates = allMatchingContracts.filter((wc: WeavingContract) => {
    //                 // Check if the weaving contract has the same companyId
    //                 const wcCompanyId = (wc as any)?.companyId;
    //                 return wcCompanyId === resolvedCompanyId;
    //             });
    //         }
    //         // For Internal (orderTypeId === 1), show all matching contracts without company filter

    //         if (candidates.length === 1) {
    //             const wc = candidates[0];
    //             updatedBeams[index].weavingContractId = String(wc.id);
    //             updatedBeams[index].salesOrderId = String(wc.salesOrderNo);
    //             if (wc.vendorId != null) {
    //                 updatedBeams[index].weavingVendorId = String(wc.vendorId);
    //             }
    //         }
    //         if (updatedBeams[index].warpMeters && updatedBeams[index].shrinkage) {
    //             const warpMeters = parseFloat(updatedBeams[index].warpMeters);
    //             const shrinkage = parseFloat(updatedBeams[index].shrinkage) / 100;
    //             const fpw = parseFloat(updatedBeams[index].fabricPanelWidth || planFabricPanelWidth || "1") || 1;
    //             const base = warpMeters * fpw;
    //             const expectedFabricMeter = base - (base * shrinkage);
    //             updatedBeams[index].expectedFabricMeter = String(expectedFabricMeter);
    //         }
    //     }

    //     if (orderTypeId === '1' && field === 'weavingVendorId') {
    //         // For internal orders, you might want to keep the weavingVendorId as selected
    //         // Or set it to companyId if needed
    //     }

    //     // Calculate expected fabric meter without rounding - keep exact decimal values
    //     if ((field === 'warpMeters' || field === 'shrinkage' || field === 'fabricPanelWidth') &&
    //         updatedBeams[index].warpMeters && updatedBeams[index].shrinkage) {

    //         const warpMeters = parseFloat(updatedBeams[index].warpMeters);
    //         const shrinkage = parseFloat(updatedBeams[index].shrinkage) / 100;
    //         const fpw = parseFloat(updatedBeams[index].fabricPanelWidth || planFabricPanelWidth || "1") || 1;

    //         // Exact calculation without rounding
    //         const base = warpMeters * fpw;
    //         const expectedFabricMeter = base - (base * shrinkage);
    //         updatedBeams[index].expectedFabricMeter = String(expectedFabricMeter);

    //         if (!updatedBeams[index].fabricPanelWidth) {
    //             updatedBeams[index].fabricPanelWidth = String(planFabricPanelWidth || "1");
    //         }
    //     }

    //     setBeamInputs(updatedBeams);
    // };
    // Update the handleBeamInputChange function:

    const handleBeamInputChange = (index: number, field: keyof SizingBeamDetails, value: string) => {
        const updatedBeams = [...beamInputs];
        updatedBeams[index] = {
            ...updatedBeams[index],
            [field]: value
        };

        if (field === 'weavingContractId') {
            const selectedWc = value ? weavingContractList.find((wc: WeavingContract) => wc.id === parseInt(value)) : undefined;
            updatedBeams[index].salesOrderId = "";
            if (selectedWc) {
                const contractOrders = getSalesOrdersForContract(selectedWc.id);
                if (contractOrders.length === 1) {
                    const firstOrder = contractOrders[0];
                    updatedBeams[index].salesOrderId = String(firstOrder?.id ?? firstOrder?.salesOrderNo ?? "");
                } else if (!contractOrders.length && selectedWc.salesOrderNo) {
                    updatedBeams[index].salesOrderId = String(selectedWc.salesOrderNo);
                }
                if (selectedWc.vendorId != null) {
                    updatedBeams[index].weavingVendorId = String(selectedWc.vendorId);
                }
            }
        }

        if (field === 'fabricId') {
            updatedBeams[index].fabricId = value;
            // reset dependent fields
            updatedBeams[index].weavingContractId = "";
            updatedBeams[index].salesOrderId = "";
            const q = uniqueQualities.find((u: any) => String(u.fabricId || "") === String(value));
            if (q?.fabricPanelWidth) {
                updatedBeams[index].fabricPanelWidth = String(q.fabricPanelWidth);
            }
            // autofill shrinkage% from fabricMasterList.warpDetails (average if multiple)
            const fabric = fabricMasterList?.find((f: any) => Number(f?.id) === Number(value));
            if (fabric?.warpDetails && Array.isArray(fabric.warpDetails)) {
                const vals = fabric.warpDetails
                    .map((wd: any) => Number(wd?.shrinkagePercent))
                    .filter((v: number) => !Number.isNaN(v));
                if (vals.length > 0) {
                    const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
                    updatedBeams[index].shrinkage = String(Number(avg.toFixed(2)));
                }
            }

            // MODIFIED: Always filter weaving contracts by companyId regardless of order type
            const candidates = weavingContractList.filter((wc: WeavingContract) => {
                // First check if fabric matches
                const fabricMatch = wc.items?.some((it: any) => it.fabricCodeId === parseInt(String(value)));
                if (!fabricMatch) return false;

                // Then check companyId match
                const wcCompanyId = (wc as any)?.companyId;
                return wcCompanyId === resolvedCompanyId;
            });

            if (candidates.length === 1) {
                const wc = candidates[0];
                updatedBeams[index].weavingContractId = String(wc.id);
                updatedBeams[index].salesOrderId = String(wc.salesOrderNo);
                if (wc.vendorId != null) {
                    updatedBeams[index].weavingVendorId = String(wc.vendorId);
                }
            }
            if (updatedBeams[index].warpMeters && updatedBeams[index].shrinkage) {
                const expectedFabricMeter = calculateExpectedFabricMeter(
                    updatedBeams[index].warpMeters,
                    updatedBeams[index].fabricPanelWidth || planFabricPanelWidth || "1",
                    updatedBeams[index].shrinkage
                );
                if (expectedFabricMeter != null) {
                    updatedBeams[index].expectedFabricMeter = expectedFabricMeter;
                }
            }
        }

        if (orderTypeId === '1' && field === 'weavingVendorId') {
            // For internal orders, you might want to keep the weavingVendorId as selected
            // Or set it to companyId if needed
        }

        // Calculate expected fabric meter without rounding - keep exact decimal values
        if ((field === 'warpMeters' || field === 'shrinkage' || field === 'fabricPanelWidth') &&
            updatedBeams[index].warpMeters && updatedBeams[index].shrinkage) {

            const expectedFabricMeter = calculateExpectedFabricMeter(
                updatedBeams[index].warpMeters,
                updatedBeams[index].fabricPanelWidth || planFabricPanelWidth || "1",
                updatedBeams[index].shrinkage
            );
            if (expectedFabricMeter != null) {
                updatedBeams[index].expectedFabricMeter = expectedFabricMeter;
            }

            if (!updatedBeams[index].fabricPanelWidth) {
                updatedBeams[index].fabricPanelWidth = String(planFabricPanelWidth || "1");
            }
        }

        setBeamInputs(updatedBeams);
    };

    const validateBeamWarpMeterTolerance = (beamsToCheck: SizingBeamDetails[], existingBeams: SizingBeamDetails[] = []): boolean => {
        const allCombined = [...existingBeams, ...beamsToCheck];
        const totalBeamCount = allCombined.length;
        if (totalBeamCount <= 0) return true;

        const totalQualityWarpMeters = items.reduce((sum: number, item: SizingQualityDetails) => {
            return sum + (parseFloat(item.warpMeters) || 0);
        }, 0);

        if (totalQualityWarpMeters <= 0) return true;

        const TOLERANCE_METERS = 100;
        const hasFabricGrouping = allCombined.some(b => b.fabricId) && items.some(i => i.fabricId);

        if (hasFabricGrouping) {
            const qualityByFabric = new Map<string, number>();
            items.forEach(item => {
                const fid = String(item.fabricId || "");
                qualityByFabric.set(fid, (qualityByFabric.get(fid) || 0) + (parseFloat(item.warpMeters) || 0));
            });

            const beamsByFabric = new Map<string, SizingBeamDetails[]>();
            allCombined.forEach(beam => {
                const fid = String(beam.fabricId || "");
                if (!beamsByFabric.has(fid)) beamsByFabric.set(fid, []);
                beamsByFabric.get(fid)!.push(beam);
            });

            for (const [fid, fabricBeams] of beamsByFabric.entries()) {
                const targetQualityWarpMeters = qualityByFabric.get(fid) || totalQualityWarpMeters;
                const fabricBeamSum = fabricBeams.reduce((sum, beam) => sum + (parseFloat(beam.warpMeters) || 0), 0);
                const minAllowedTotal = Math.max(0, targetQualityWarpMeters - TOLERANCE_METERS);
                const maxAllowedTotal = targetQualityWarpMeters + TOLERANCE_METERS;

                if (fabricBeamSum < minAllowedTotal) {
                    toast.error(`Total beam warp meters (${fabricBeamSum.toFixed(2)} meters) cannot be less than 100 meters from allocated warp meters (${targetQualityWarpMeters.toFixed(2)} meters). Minimum allowed total: ${minAllowedTotal.toFixed(2)} meters`);
                    return false;
                }
                if (fabricBeamSum > maxAllowedTotal) {
                    toast.error(`Total beam warp meters (${fabricBeamSum.toFixed(2)} meters) cannot exceed 100 meters from allocated warp meters (${targetQualityWarpMeters.toFixed(2)} meters). Maximum allowed total: ${maxAllowedTotal.toFixed(2)} meters`);
                    return false;
                }
            }
        } else {
            const totalBeamWarpMeters = allCombined.reduce((sum, beam) => sum + (parseFloat(beam.warpMeters) || 0), 0);
            const minAllowedTotal = Math.max(0, totalQualityWarpMeters - TOLERANCE_METERS);
            const maxAllowedTotal = totalQualityWarpMeters + TOLERANCE_METERS;

            if (totalBeamWarpMeters < minAllowedTotal) {
                toast.error(`Total beam warp meters (${totalBeamWarpMeters.toFixed(2)} meters) cannot be less than 100 meters from total allocated warp meters (${totalQualityWarpMeters.toFixed(2)} meters). Minimum allowed total: ${minAllowedTotal.toFixed(2)} meters`);
                return false;
            }
            if (totalBeamWarpMeters > maxAllowedTotal) {
                toast.error(`Total beam warp meters (${totalBeamWarpMeters.toFixed(2)} meters) cannot exceed 100 meters from total allocated warp meters (${totalQualityWarpMeters.toFixed(2)} meters). Maximum allowed total: ${maxAllowedTotal.toFixed(2)} meters`);
                return false;
            }
        }

        return true;
    };

    const addBeamItems = () => {
        const validBeams = beamInputs.filter(beam =>
            beam.weavingContractId ||
            beam.salesOrderId ||
            beam.warpMeters ||
            beam.shrinkage ||
            beam.expectedFabricMeter
        ).map(beam => ({
            ...beam,
            warpMeters: beam.warpMeters !== "" && !isNaN(Number(beam.warpMeters))
                ? Number(beam.warpMeters).toFixed(2)
                : beam.warpMeters,
            expectedFabricMeter: beam.expectedFabricMeter !== "" && !isNaN(Number(beam.expectedFabricMeter))
                ? Number(beam.expectedFabricMeter).toFixed(2)
                : beam.expectedFabricMeter,
        }));

        if (validBeams.length > 0) {
            if (!validateBeamWarpMeterTolerance(validBeams, beamItems)) {
                return;
            }
            setBeamItems([...beamItems, ...validBeams]);
            setBeamInputs([]);
            setNumberOfBeams('0');
        }
    };

    const editBeamItem = (index: number) => {
        setBeamInputs([beamItems[index]]);
        setBeamItems(beamItems.filter((_, i) => i !== index));
    };

    const deleteBeamItem = (index: number) => {
        setBeamItems(beamItems.filter((_, i) => i !== index));
    };

    const summaryRows = useMemo<SummaryRow[]>(() => {
        if (items.length === 0) {
            return [];
        }
        return items.map((item: SizingQualityDetails): SummaryRow => {
            const yarnKey =
                (item.actualYarn && item.actualYarn.trim()) ||
                (item.yarnId && item.yarnId.trim()) ||
                "__missing__";
            const parsedId = parseInt(yarnKey, 10);
            const yarnName = Number.isNaN(parsedId)
                ? undefined
                : yarnList?.find((y: YarnMaster) => y.id === parsedId)?.yarnName;
            const label = yarnName || (yarnKey === "__missing__" ? "Not Selected" : yarnKey);
            const actualWarpEndsValue = parseFloat(item.actualWarpEnds) || 0;
            const partsValue = parseFloat(item.parts) || 0;
            const rawWarpMetersValue = parseFloat(item.warpMeters) || 0;
            const warpMetersAfterShrink = rawWarpMetersValue * (1 - 0.075);
            return {
                yarnKey,
                yarnLabel: label,
                actualEnds: Math.round(actualWarpEndsValue),
                parts: Math.round(partsValue),
                endsPerPart: partsValue > 0 ? Math.round(actualWarpEndsValue / partsValue) : 0,
                rawWarpMeters: Math.round(rawWarpMetersValue),
                warpMetersAfterShrink: Math.round(warpMetersAfterShrink)
            };
        });
    }, [items, yarnList]);

    const currentSizingRate = watch('sizingRate');
    const uniqueQualities = useMemo(() => {
        const fabricMap = new Map<string, any>();
        items.forEach(item => {
            const key = String(item.fabricId || item.fabricCode || "");
            if (!fabricMap.has(key)) {
                fabricMap.set(key, {
                    key,
                    fabricId: item.fabricId,
                    fabricCode: item.fabricCode,
                    quality: item.quality,
                    sordEnds: item.sordEnds,
                    actualEnds: item.actualEnds,
                    fabricPanelWidth: item.fabricPanelWidth,
                    sizingRate: currentSizingRate || "",
                });
            }
        });
        return Array.from(fabricMap.values());
    }, [items, currentSizingRate]);

    const usedFabricIdsInBeams = useMemo(() => {
        const arr: string[] = [];
        beamInputs.forEach((b) => { if (b.fabricId) arr.push(String(b.fabricId)); });
        beamItems.forEach((b) => { if (b.fabricId) arr.push(String(b.fabricId)); });
        return new Set(arr);
    }, [beamInputs, beamItems]);

    const selectedFabricIds = useMemo(() =>
        new Set(items.map((item: SizingQualityDetails) => item.fabricId).filter(Boolean)),
        [items]
    );

    const filteredWeavingContracts = useMemo(
        () =>
            weavingContractList.filter((wc: WeavingContract) =>
                Array.from(selectedFabricIds).some((fabricId) =>
                    wc.items?.some(
                        (item: any) => item.fabricCodeId === parseInt(fabricId as string, 10)
                    )
                )
            ),
        [weavingContractList, selectedFabricIds]
    );

    const planFabricPanelWidth = useMemo(() => {
        const first = items.find((i) => (i.fabricPanelWidth && i.fabricPanelWidth !== ""));
        return first?.fabricPanelWidth || "1";
    }, [items]);

    const normalizeDetailsResponse = (raw: any): any[] => {
        if (Array.isArray(raw)) return raw;
        if (raw?.data && Array.isArray(raw.data)) return raw.data;
        if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
        return [];
    };

    const normalizeHeadersResponse = (raw: any): any[] => {
        if (Array.isArray(raw)) return raw;
        if (raw?.data && Array.isArray(raw.data)) return raw.data;
        if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
        return [];
    };

    const [poCategories, setPoCategories] = useState<CodeDetail[]>([]);

    useEffect(() => {
        const fetchInwardTypes = async () => {
            try {
                let headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());
                if (!headers.length) {
                    try {
                        await CodesUtil.loadOnce(async () => normalizeHeadersResponse(await CodesAPI.getCodesHeader()));
                        headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());
                    } catch (error) {
                        console.error("Failed to preload inward type headers", error);
                    }
                }
                if (!headers.length) {
                    try {
                        const apiHeaders = await CodesAPI.getCodesHeader();
                        headers = normalizeHeadersResponse(apiHeaders);
                    } catch (error) {
                        console.error("Failed to fetch inward type headers", error);
                    }
                }

                const inwardHeader = headers.find((h: any) =>
                    String(h.id) === "1" || String(h.hdr_id) === "1" || String(h.hdrId) === "1"
                );

                if (inwardHeader && Array.isArray(inwardHeader.details)) {
                    setInwardTypes(inwardHeader.details);
                } else if (inwardHeader?.id) {
                    const response = await CodesAPI.getCodeDetailsByHeader(inwardHeader.code_group || inwardHeader.codeGroup);
                    setInwardTypes(normalizeDetailsResponse(response));
                } else {
                    const response = await CodesAPI.getCodeDetailsByHeader("1");
                    setInwardTypes(normalizeDetailsResponse(response));
                }
            } catch (error) {
                console.error("Failed to fetch inward types:", error);
            }
        };

        const fetchPoCategories = async () => {
            try {
                const details = await CodesAPI.getCodeDetailsByHeader("7");
                setPoCategories(details || []);
            } catch (err) {
                console.error("Failed to fetch PO Categories in sizing plan entry:", err);
            }
        };

        fetchInwardTypes();
        fetchPoCategories();
        dispatch(getAllPoTypes({ fetchAll: true }));
    }, [dispatch]);

    const poCategoryMap = useMemo(() => {
        return poCategories.reduce((acc: Record<number, string>, category: any) => {
            acc[category.id] = category.value;
            return acc;
        }, {}) || {};
    }, [poCategories]);

    const getDetailOptionValue = (detail: CodeDetail) => {
        if (detail.id != null) return String(detail.id);
        if (detail.code) return detail.code;
        if (detail.value) return detail.value;
        return "";
    };

    const getDetailOptionLabel = (detail: CodeDetail) => detail.code || detail.value || `Code ${detail.id ?? ""}`;

    const inwardTypeLabelById = useMemo(() => {
        const map = new Map<string, string>();
        inwardTypes.forEach((detail: any) => {
            const key = getDetailOptionValue(detail);
            if (!key) return;
            map.set(key, getDetailOptionLabel(detail));
        });
        if (Array.isArray(purchaseOrderTypeList)) {
            purchaseOrderTypeList.forEach((poType: any) => {
                const key = String(poType.id);
                if (key && !map.has(key)) {
                    map.set(key, poType.poTypeName || poType.name || poType.code || "");
                }
            });
        }
        return map;
    }, [inwardTypes, purchaseOrderTypeList]);

    const calculateIssueQty = useCallback((bags?: number | string, kgs?: number | string) => {
        const bagValue = Number(bags || 0);
        const kgValue = Number(kgs || 0);
        return Number((bagValue * kgValue).toFixed(3));
    }, []);

    // Load historical issues for this plan to accurately calculate balanceToIssue
    useEffect(() => {
        const fetchHistoricalIssues = async () => {
            if (!sizingPlanDtl?.id) return;
            try {
                const response = await apiService.get('/sizing-yarn-issues?offset=0&limit=100');
                const allIssues = response?.data || response || [];
                const issuesList = Array.isArray(allIssues) ? allIssues : (allIssues.content || allIssues.data || []);
                
                const issuesByYarnName: Record<string, number> = {};
                issuesList
                    .filter((issue: any) => Number(issue.sizingPlanId) === Number(sizingPlanDtl.id))
                    .forEach((issue: any) => {
                        // Skip currently loaded issue to avoid double counting it
                        if (sizingYarnIssueDtl && Number(issue.id) === Number(sizingYarnIssueDtl.id)) {
                            return;
                        }
                        if (issue.sizingYarnIssue && Array.isArray(issue.sizingYarnIssue)) {
                            issue.sizingYarnIssue.forEach((lot: any) => {
                                const yarnName = lot.yarnName || '';
                                const issuedQty = Number(lot.issuedQty || lot.issueQty || 0);
                                issuesByYarnName[yarnName] = (issuesByYarnName[yarnName] || 0) + issuedQty;
                            });
                        }
                    });
                setHistoricalIssuesByYarn(issuesByYarnName);
            } catch (error) {
                console.error("Failed to fetch historical sizing yarn issues:", error);
            }
        };
        fetchHistoricalIssues();
    }, [sizingPlanDtl, sizingYarnIssueDtl]);

    // Calculate requirements dynamically from items (which holds sizingQualityDetails layers)
    const yarnRequirementDetails = useMemo(() => {
        if (!items || items.length === 0) return [];
        return items.map((item: SizingQualityDetails) => {
            const fabric = fabricMasterList.find((f: FabricMaster) =>
                f.fabricCode === item.fabricCode
            );

            const yarn = yarnList.find((y: YarnMaster) => String(y.id) === String(item.yarnId));
            const actualYarnObj = yarnList.find((y: YarnMaster) => String(y.id) === String(item.actualYarn) || y.yarnName === item.actualYarn) || yarn;

            const wd = fabric?.warpDetails?.find((d: { yarnId: any; }) => String(d.yarnId) === String(item.yarnId));
            
            const rawGramsPerMeter = wd?.gramsPerMeter != null 
                ? parseFloat(String(wd.gramsPerMeter)) 
                : (fabric?.warpDetails?.[0]?.gramsPerMeter ? parseFloat(String(fabric.warpDetails[0].gramsPerMeter)) : 0);

            let warpGramsPerMeter = rawGramsPerMeter;

            const shrinkagePct = wd?.shrinkagePercent != null ? parseFloat(String(wd.shrinkagePercent)) : 0;
            const epiVal = parseFloat(item.warpEnds) || (wd?.epi ? parseFloat(String(wd.epi)) : 0);
            const yarnObj = yarnList.find((y: YarnMaster) => String(y.id) === String(item.yarnId));
            const countVal = yarnObj?.conversion != null && Number(yarnObj.conversion) > 0
                ? Number(yarnObj.conversion) 
                : (yarnObj?.count != null && Number(yarnObj.count) > 0 ? Number(yarnObj.count) : 0);

            if (epiVal > 0 && countVal > 0) {
                // Calculate warpGramsPerMeter directly without shrinkage
                warpGramsPerMeter = (epiVal * 0.000591) / countVal;
            } else if (shrinkagePct > 0 && rawGramsPerMeter > 0) {
                // Convert fabric master's shrunk gramsPerMeter to un-shrunk gramsPerMeter
                warpGramsPerMeter = rawGramsPerMeter / (1 + shrinkagePct / 100);
            }

            const warpRequirement = warpGramsPerMeter * (parseFloat(item.warpMeters) || 0);

            const fabricDetails = fabric
                ? `${fabric.fabricCode} - ${fabric.fabricQuality || fabric.fabricName}`
                : `${item.fabricCode} - ${item.quality}`;

            return {
                id: item.id || undefined,
                fabricDetails,
                yarnName: yarn?.yarnName || 'N/A',
                actualYarn: actualYarnObj?.yarnName || yarn?.yarnName || 'N/A',
                actualYarnId: actualYarnObj?.id || Number(item.actualYarn) || Number(item.yarnId),
                yarnId: Number(item.yarnId),
                warpMeters: parseFloat(item.warpMeters) || 0,
                warpGramsPerMeter: warpGramsPerMeter,
                warpRequirement: warpRequirement,
                totalIssuedQty: 0,
                balanceToIssue: warpRequirement
            };
        });
    }, [items, fabricMasterList, yarnList]);

    // Apply totals from selected lots and history
    const yarnRequirementDetailsWithTotals = useMemo(() => {
        const currentSessionByActual: Record<string, number> = {};
        selectedLots.forEach((lot) => {
            const qty = Number(lot.issueQty ?? lot.issuedQty ?? 0);
            if (!qty || qty <= 0) return;
            const key = lot.yarnId != null ? `id-${lot.yarnId}` : `name-${lot.yarnName}`;
            currentSessionByActual[key] = (currentSessionByActual[key] || 0) + qty;
        });

        return yarnRequirementDetails.map((req) => {
            const key = req.actualYarnId != null ? `id-${req.actualYarnId}` : `name-${req.yarnName}`;
            const currentSessionQty = currentSessionByActual[key] || 0;
            const historicalQty = historicalIssuesByYarn[req.yarnName] || 0;
            const totalIssued = Number((historicalQty + currentSessionQty).toFixed(3));
            const balance = Number((req.warpRequirement - totalIssued).toFixed(3));
            return {
                ...req,
                totalIssuedQty: totalIssued,
                balanceToIssue: Math.max(0, balance)
            };
        });
    }, [yarnRequirementDetails, selectedLots, historicalIssuesByYarn]);

    const requirementTotals = useMemo(() => {
        return yarnRequirementDetailsWithTotals.reduce((acc, req) => ({
            warpRequirement: acc.warpRequirement + (req.warpRequirement || 0),
            totalIssuedQty: acc.totalIssuedQty + (req.totalIssuedQty || 0),
            balanceToIssue: acc.balanceToIssue + (req.balanceToIssue || 0)
        }), { warpRequirement: 0, totalIssuedQty: 0, balanceToIssue: 0 });
    }, [yarnRequirementDetailsWithTotals]);

    const activeYarnOptions = useMemo(() => {
        let list = [];
        if (Array.isArray(yarnList)) list = yarnList;
        else if (Array.isArray((yarnList as any)?.data)) list = (yarnList as any).data;
        return list.filter((y: any) => y.isActive !== false && y.activeFlag !== false);
    }, [yarnList]);

    const activeTransportOptions = useMemo(() => {
        let list = [];
        if (Array.isArray(transportList)) list = transportList;
        else if (Array.isArray((transportList as any)?.data)) list = (transportList as any).data;
        return list.filter((t: any) => t.isActive !== false && t.activeFlag !== false);
    }, [transportList]);

    const millOptions = useMemo(() => (subCategoryList || []).filter((sc: any) =>
        sc.categoryName === "Mill" && sc.isActive !== false && sc.activeFlag !== false
    ), [subCategoryList]);

    const warehouseOptions = useMemo(() => {
        let list: any[] = [];
        if (Array.isArray(warehouseList)) list = warehouseList;
        else if (Array.isArray((warehouseList as any)?.data)) list = (warehouseList as any).data;
        else if (Array.isArray((warehouseList as any)?.items)) list = (warehouseList as any).items;
        return list.filter((w: any) => w.isActive !== false && w.activeFlag !== false);
    }, [warehouseList]);

    const resolveWarehouseName = useCallback((warehouseId?: string | number | null) => {
        if (warehouseId === undefined || warehouseId === null || warehouseId === '') {
            return '';
        }
        const match = warehouseOptions.find((warehouse: any) => {
            const id = warehouse?.id ?? warehouse?.warehouseId;
            return id != null && String(id) === String(warehouseId);
        });
        return match?.warehouseName || match?.name || match?.label || '';
    }, [warehouseOptions]);

    const handleWarehouseChange = useCallback((index: number, value: string) => {
        setSelectedLots((prev) => {
            const updated = [...prev];
            if (!updated[index]) return prev;
            const normalized = value ? Number(value) : null;
            updated[index] = {
                ...updated[index],
                warehouseId: normalized,
                warehouseName: normalized != null ? resolveWarehouseName(normalized) : undefined,
            };
            return updated;
        });
        setIsDraftSaved(false);
    }, [resolveWarehouseName]);

    const [lotMeta, setLotMeta] = useState<any>({});

    const handleMetaChange = (uniqueId: string, field: 'millId' | 'warehouseId' | 'noOfBags' | 'kgsPerBag', value: string) => {
        setLotMeta((prev: any) => {
            const parsed = (field === 'noOfBags' || field === 'kgsPerBag') ? Number(value) || 0 : value;
            const next = { ...prev, [uniqueId]: { ...(prev[uniqueId] || {}), [field]: parsed } } as any;
            return next;
        });
        setSelectedLots((prev) => prev.map((l) => {
            if (l.uniqueId !== uniqueId) return l;
            const parsedValue = (field === 'noOfBags' || field === 'kgsPerBag') ? Number(value) || 0 : value;
            const updated: any = { ...l, [field]: parsedValue };
            if (field === 'noOfBags') {
                updated.issuedBags = parsedValue;
                const recalculatedQty = calculateIssueQty(parsedValue, updated.kgsPerBag);
                updated.issueQty = recalculatedQty;
                updated.issuedQty = recalculatedQty;
            }
            if (field === 'kgsPerBag' && (updated.conesPerBag ?? 0) > 0) {
                const conesPerBag = Number(updated.conesPerBag) || 0;
                const kgsPerBagValue = Number(parsedValue) || 0;
                updated.conesWeight = conesPerBag > 0 ? Number((kgsPerBagValue / conesPerBag).toFixed(3)) : updated.conesWeight;
            }
            return updated;
        }));
        setIsDraftSaved(false);
    };

    const handleAlternateYarnChange = (index: number, value: string) => {
        const updatedLots = [...selectedLots];
        updatedLots[index].alternateYarn = value;
        setSelectedLots(updatedLots);
        setIsDraftSaved(false);
    };

    const handleDeleteLot = (index: number) => {
        setSelectedLots(selectedLots.filter((_, i) => i !== index));
        setIsDraftSaved(false);
    };

    const handleEditRow = (index: number) => {
        setEditingRowIndex(index);
    };

    const handleSaveRow = (index: number) => {
        const lot = selectedLots[index];
        if (!lot.alternateYarn || lot.alternateYarn.trim() === '') {
            alert('Please enter alternate yarn');
            return;
        }
        setEditingRowIndex(null);
        setIsDraftSaved(false);
    };

    const handleSaveDraft = () => {
        if (selectedLots.length === 0) {
            toast.error('Please select at least one lot');
            return;
        }

        for (const lot of selectedLots) {
            if (!lot.alternateYarn || lot.alternateYarn.trim() === '') {
                toast.error('Please fill alternate yarn for all lots');
                return;
            }
            const cones = Number(lot.issuingCones ?? 0);
            const availBags = Number(lot.lotAvailableBags ?? lot.availableBags ?? 0);
            const conesPerBag = Number(lot.conesPerBag ?? 0);
            const maxCones = availBags > 0 && conesPerBag > 0 ? availBags * conesPerBag : (conesPerBag > 0 ? conesPerBag : 0);

            const baseCones = getBaseRequiredConesForLot(lot);
            const maxAllowedCones = baseCones > 0 ? baseCones + 2 : 0;

            if (maxCones > 0 && cones > maxCones) {
                toast.error(`Issuing No. of Cones (${cones}) cannot exceed stock available cones (${maxCones}) for lot ${lot.lotNumber || lot.yarnName || ''}`);
                return;
            }
            if (maxAllowedCones > 0 && cones > maxAllowedCones) {
                toast.error(`Issuing No. of Cones (${cones}) cannot exceed max allowed limit of ${maxAllowedCones} cones for lot ${lot.lotNumber || lot.yarnName || ''}`);
                return;
            }
        }

        setIsDraftSaved(true);
        setEditingRowIndex(null);
    };

    const totalNetWt = useMemo(() => {
        return selectedLots.reduce((sum, lot) => sum + (lot.issueQty || 0), 0);
    }, [selectedLots]);

    useEffect(() => {
        if (totalNetWt > 0 && (!grossWt || Number(grossWt) === 0)) {
            setGrossWt(totalNetWt.toFixed(3));
        }
    }, [totalNetWt]);

    const buildYarnInwardStockUrl = (itemIds: string, companyId?: string | number | null) => {
        const query = new URLSearchParams();
        if (itemIds) query.append('itemId', itemIds);
        if (companyId != null) query.append('companyId', String(companyId));
        return `/sizing-yarn-issues/yarn-inward-stock?${query.toString()}`;
    };

    const handleYarnIssue = async () => {
        const itemIds = [...new Set(yarnRequirementDetailsWithTotals.map((req: any) => req.actualYarnId).filter(Boolean))].join(',');
        if (!itemIds) {
            alert('No actual yarns found in requirement details. Add items first.');
            return;
        }

        try {
            const response = await apiService.get(
                buildYarnInwardStockUrl(itemIds, resolvedCompanyId)
            );

            if (response && response.length > 0) {
                const seenUniqueIds = new Set<string>();
                const transformedLots: LotDetail[] = response.reduce((acc: LotDetail[], stock: any) => {
                    const yarn = yarnList.find((y: YarnMaster) => y.id === stock.itemId);
                    const yarnName = yarn?.yarnName || `Yarn-${stock.itemId}`;
                    const requirement = yarnRequirementDetailsWithTotals.find(req => req.actualYarnId === stock.itemId || req.yarnId === stock.itemId);

                    const acceptedQty = Number(stock.acceptedQty) || 0;
                    const availableQty = Number(stock.availableQty) || 0;
                    const conesPerBag = Number(stock.conesPerBag ?? stock.noOfConesPerBag ?? 0);
                    const kgsPerBag = Number(stock.kgsPerBag || 0);
                    const conesWeight = stock.conesWeight != null
                        ? Number(stock.conesWeight)
                        : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);
                    const lotNumber = stock.lotNo || 'N/A';
                    const inwardTypeId = stock.inwardTypeId;
                    const inwardType = inwardTypes.find((t: any) => String(t.id) === String(inwardTypeId))?.code || 'N/A';

                    const stockDetailId = stock.id ?? stock.yarnInwardStockDetailsId;
                    const uniqueId = stockDetailId ? `stock_${stockDetailId}` : `${stock.orderItemId}_${stock.inwardId}_${stock.inwardNo}_${lotNumber}`;
                    if (seenUniqueIds.has(uniqueId)) return acc;
                    seenUniqueIds.add(uniqueId);
                    acc.push({
                        id: stockDetailId || stock.orderItemId,
                        uniqueId,
                        yarnId: stock.itemId,
                        yarnName: yarnName,
                        originalYarnName: requirement?.yarnName || yarnName,
                        lotNumber,
                        availableQty: availableQty,
                        lotAvailableQty: availableQty,
                        actualQty: acceptedQty,
                        issueQty: 0,
                        alternateYarn: requirement?.actualYarn || yarnName,
                        millId: stock.millId || null,
                        warehouseId: stock.warehouseId ?? null,
                        inwardId: stock.inwardId,
                        orderItemId: stock.orderItemId,
                        yarnInwardStockDetailsId: stockDetailId ?? null,
                        inwardTypeId,
                        inwardType,
                        inwardNo: stock.inwardNo || 'N/A',  
                        millInvNo: stock.millInvNo || 'N/A',
                        millDate: stock.millDate ? String(stock.millDate) : 'N/A',
                        poCategoryId: stock.poCategoryId,
                        uomId: stock.uomId,
                        issuedBags: 0,
                        availableBags: Number(stock.availableBags || 0),
                        lotAvailableBags: Number(stock.availableBags || 0),
                        availableCones: stock.availableCones != null ? Number(stock.availableCones) : (Number(stock.availableBags || 0) * conesPerBag),
                        issuingCones: '',
                        inwardBags: Number(stock.inwardBags || 0),
                        noOfBags: 0,
                        kgsPerBag: kgsPerBag,
                        conesPerBag,
                        conesWeight,
                    });
                    return acc;
                }, []);

                const validAvailableLots = transformedLots.filter((lot) => {
                    return Number(lot.availableQty ?? 0) > 0 || Number(lot.availableBags ?? 0) > 0;
                });

                setAvailableLots(validAvailableLots);
                setPopupSelectedLots([...selectedLots]);
                setShowLotDialog(true);
            } else {
                alert('No available lots found for the selected yarn requirement.');
                setAvailableLots([]);
            }
        } catch (error) {
            console.error('Error fetching yarn inward stock:', error);
            setAvailableLots([]);
        }
    };

    const lotColumns = useMemo<PopupColumn[]>(() => [
        {
            Header: 'Select',
            id: 'selected',
            disableFilters: true,
            Cell: ({ row }) => {
                const isSelected = popupSelectedLots.some(selected => 
                    (selected.uniqueId && row.uniqueId && selected.uniqueId === row.uniqueId) || 
                    (selected.yarnInwardStockDetailsId && row.yarnInwardStockDetailsId && selected.yarnInwardStockDetailsId === row.yarnInwardStockDetailsId) || 
                    (selected.id === row.id)
                );
                const handleSelect = () => {
                    if (isSelected) {
                        setPopupSelectedLots(prev => prev.filter(item => 
                            !((item.uniqueId && row.uniqueId && item.uniqueId === row.uniqueId) || 
                              (item.yarnInwardStockDetailsId && row.yarnInwardStockDetailsId && item.yarnInwardStockDetailsId === row.yarnInwardStockDetailsId) || 
                              (item.id === row.id))
                        ));
                    } else {
                        const lotConesPerBag = Number(row.conesPerBag ?? 0);
                        const lotAvailableBags = Number(row.availableBags ?? row.lotAvailableBags ?? 0);
                        const availableCones = lotAvailableBags * lotConesPerBag;
                        const lotConesWeight = row.conesWeight != null
                            ? Number(row.conesWeight)
                            : (lotConesPerBag > 0 && Number(row.kgsPerBag ?? 0) > 0
                                ? Number((Number(row.kgsPerBag ?? 0) / lotConesPerBag).toFixed(3))
                                : 0);
                        const newLot: LotDetail = {
                            ...row,
                            alternateYarn: row.yarnName,
                            availableCones: availableCones,
                            issuingCones: '',
                            noOfBags: 0,
                            issuedBags: 0,
                            issueQty: 0,
                            millId: row.millId ?? null,
                            warehouseId: row.warehouseId ?? null,
                            warehouseName: resolveWarehouseName(row.warehouseId) || row.warehouseName,
                            issuedQty: 0,
                            conesPerBag: lotConesPerBag,
                            conesWeight: lotConesWeight,
                            perBabyConeWeight: row.perBabyConeWeight || 0.01
                        };
                        setPopupSelectedLots(prev => [...prev, newLot]);
                    }
                };

                return (
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleSelect}
                        className="w-4 h-4 cursor-pointer"
                    />
                );
            },
        },
        {
            Header: 'Yarn Count',
            accessor: 'yarnName',
            id: 'yarnName',
        },
        {
            Header: 'Inward No',
            accessor: (row: any) => row.inwardNo && row.inwardNo !== 'N/A' ? row.inwardNo : 'N/A',
            id: 'inwardNo',
        },
         {
            Header: 'Warehouse',
            accessor: (row: any) => resolveWarehouseName(row.warehouseId) || 'N/A',
            id: 'warehouse',
        },
          {
            Header: 'Mill',
            accessor: (row: any) => millOptions.find((m: any) => String(m.id) === String(row.millId))?.subCategoryName || 'N/A',
            id: 'mill',
        },
       {
            Header: 'Lot No',
            accessor: 'lotNumber',
            id: 'lotNumber',
        },
        {
            Header: 'Available Bags',
            accessor: 'availableBags',
            id: 'availableBags',
        },
        {
            Header: 'No of Cones',
            accessor: (row: any) => Number(row.availableBags ?? row.lotAvailableBags ?? 0) * Number(row.conesPerBag ?? 0),
            id: 'noOfCones',
        },
        {
            Header: 'Yarn Mill Inv Date',
            accessor: (row: any) => row.millDate && row.millDate !== 'N/A' ? row.millDate : 'N/A',
            id: 'millDate',
        },
        {
            Header: 'Yarn Mill Inv No',
            accessor: (row: any) => row.millInvNo && row.millInvNo !== 'N/A' ? row.millInvNo : 'N/A',
            id: 'millInvNo',
        },
        {
            Header: 'PO Category',
            accessor: (row: any) => row.poCategoryId != null ? poCategoryMap[Number(row.poCategoryId)] || `Category ${row.poCategoryId}` : 'N/A',
            id: 'poCategory',
        },
        {
            Header: 'Inward Bags',
            accessor: 'inwardBags',
            id: 'inwardBags',
            Cell: ({ row }) => (
                <Input
                    type="number"
                    value={Number(row.inwardBags ?? 0)}
                    readOnly
                    className="w-full p-1 border rounded bg-gray-100 cursor-not-allowed text-right text-black font-semibold"
                />
            ),
        },
        {
            Header: 'Kgs/Bag',
            accessor: 'kgsPerBag',
            id: 'kgsPerBag',
            Cell: ({ row }) => (
                <Input
                    type="number"
                    value={Number(row.kgsPerBag ?? 0)}
                    readOnly
                    className="w-full p-1 border rounded bg-gray-100 cursor-not-allowed text-right text-black font-semibold"
                />
            ),
        },
        {
            Header: 'Cones/Bag',
            accessor: 'conesPerBag',
            id: 'conesPerBag',
        },
        {
            Header: 'Cones Weight',
            accessor: (row: any) => Number(row.conesWeight ?? 0).toFixed(3),
            id: 'conesWeight',
        },
        {
            Header: 'Available Qty',
            accessor: (row: any) => Number(row.availableQty ?? 0).toFixed(3),
            id: 'availableQty',
        },
      
    ], [popupSelectedLots, millOptions, resolveWarehouseName, inwardTypeLabelById, poCategoryMap]);

    const inwardIndex = useMemo(() => {
        const map = new Map<string, { millId?: number | string; warehouseId?: number | string; inwardId?: number | string; orderItemId?: number | string }>();
        availableLots.forEach((lot: LotDetail) => {
            const stockDetailId = lot.yarnInwardStockDetailsId || lot.id;
            if (stockDetailId && lot.yarnId) {
                const key = `${stockDetailId}|${lot.yarnId}`;
                map.set(key, {
                    millId: lot.millId ?? undefined,
                    warehouseId: lot.warehouseId ?? undefined,
                    inwardId: lot.inwardId ?? undefined,
                    orderItemId: lot.orderItemId ?? undefined
                });
            }
        });
        return map;
    }, [availableLots]);

    useEffect(() => {
        if (showLotDialog && availableLots.length > 0) {
            setLotMeta((prev: any) => {
                const next = { ...prev } as any;
                availableLots.forEach((lot) => {
                    const stockDetailId = lot.yarnInwardStockDetailsId || lot.id;
                    const originalUniqueId = `original_${stockDetailId}_${lot.yarnId || ''}`;
                    const actualUniqueId = `actual_${stockDetailId}_${lot.yarnId || ''}`;
                    const key = `${stockDetailId}|${lot.yarnId || ''}`;
                    const pref = inwardIndex.get(key);
                    if (pref) {
                        if (!next[originalUniqueId]) next[originalUniqueId] = { millId: pref.millId ?? '', warehouseId: pref.warehouseId ?? '' };
                        if (!next[actualUniqueId]) next[actualUniqueId] = { millId: pref.millId ?? '', warehouseId: pref.warehouseId ?? '' };
                    }
                });
                return next;
            });
            setSelectedLots((prev) => prev.map((s) => {
                const lot = availableLots.find(al => 
                    (s.uniqueId && al.uniqueId === s.uniqueId) ||
                    (s.yarnInwardStockDetailsId && al.yarnInwardStockDetailsId === s.yarnInwardStockDetailsId) ||
                    (s.inwardNo && al.inwardNo && s.inwardNo !== 'N/A' && al.inwardNo === s.inwardNo && al.lotNumber === s.lotNumber)
                );
                if (!lot) return s;
                const stockDetailId = lot.yarnInwardStockDetailsId || lot.id;
                const origId = `original_${stockDetailId}_${lot.yarnId || ''}`;
                const actId = `actual_${stockDetailId}_${lot.yarnId || ''}`;
                if (!s.uniqueId) {
                    if (s.alternateYarn === (lot.originalYarnName || lot.yarnName)) return { ...s, uniqueId: origId };
                    if (s.alternateYarn === lot.yarnName) return { ...s, uniqueId: actId };
                }
                return s;
            }));
            setPopupSelectedLots((prev) => prev.map((s) => {
                const lot = availableLots.find(al => 
                    (s.uniqueId && al.uniqueId === s.uniqueId) ||
                    (s.yarnInwardStockDetailsId && al.yarnInwardStockDetailsId === s.yarnInwardStockDetailsId) ||
                    (s.inwardNo && al.inwardNo && s.inwardNo !== 'N/A' && al.inwardNo === s.inwardNo && al.lotNumber === s.lotNumber)
                );
                if (!lot) return s;
                const stockDetailId = lot.yarnInwardStockDetailsId || lot.id;
                const origId = `original_${stockDetailId}_${lot.yarnId || ''}`;
                const actId = `actual_${stockDetailId}_${lot.yarnId || ''}`;
                if (!s.uniqueId) {
                    if (s.alternateYarn === (lot.originalYarnName || lot.yarnName)) return { ...s, uniqueId: origId };
                    if (s.alternateYarn === lot.yarnName) return { ...s, uniqueId: actId };
                }
                return s;
            }));
        }
    }, [showLotDialog, availableLots, inwardIndex]);

    const resolveAlternateYarnValue = (lot: LotDetail) => {
        if (lot.alternateYarn !== undefined) return lot.alternateYarn;
        return lot.yarnName || "";
    };

    const getBaseRequiredConesForLot = useCallback((lot: LotDetail): number => {
        const matchingItem = items.find((it) => {
            if (lot.yarnId && (String(it.actualYarn) === String(lot.yarnId) || String(it.yarnId) === String(lot.yarnId))) return true;
            if (lot.originalYarnName && (it.yarnName === lot.originalYarnName || it.quality === lot.originalYarnName)) return true;
            if (lot.yarnName && (it.yarnName === lot.yarnName || it.quality === lot.yarnName)) return true;
            if (lot.alternateYarn && (it.actualYarn === lot.alternateYarn || it.yarnName === lot.alternateYarn)) return true;
            return false;
        }) || layerData.find((layer) => {
            if (lot.yarnId && (String(layer.actualYarn) === String(lot.yarnId) || String(layer.yarnId) === String(lot.yarnId))) return true;
            if (lot.originalYarnName && (layer.yarnName === lot.originalYarnName)) return true;
            if (lot.yarnName && (layer.yarnName === lot.yarnName)) return true;
            if (lot.alternateYarn && (layer.actualYarn === lot.alternateYarn || layer.yarnName === lot.alternateYarn)) return true;
            return false;
        });

        const endsPerPart = matchingItem ? (Number(matchingItem.endsPerPart) || (Number(matchingItem.parts) > 0 ? Math.round(Number(matchingItem.actualWarpEnds) / Number(matchingItem.parts)) : 0)) : 0;
        const creelsNum = matchingItem ? (Number(matchingItem.noOfCreels) || Number(watch('noOfCreels') || '1') || 1) : (Number(watch('noOfCreels') || '1') || 1);
        return endsPerPart > 0 && creelsNum > 0 ? endsPerPart * creelsNum : 0;
    }, [items, layerData, watch]);

    const handleAddSelectedLots = () => {
        if (popupSelectedLots.length === 0) {
            toast.error("Please select at least one lot");
            return;
        }

        const currentVendorId = watch('vendorId') || sizingPlanDtl?.vendorId;
        if (!currentVendorId) {
            toast.error("Please select a Sizing Vendor first in Vendor Details section");
            return;
        }

        // 1. Validate Same Mill Name and Same Lot Number across popupSelectedLots
        const firstMillId = popupSelectedLots[0]?.millId != null ? String(popupSelectedLots[0].millId) : '';
        const firstMillName = millOptions.find((m: any) => String(m.id) === firstMillId)?.subCategoryName || popupSelectedLots[0]?.millName || '';
        const firstLotNo = (popupSelectedLots[0]?.lotNumber || popupSelectedLots[0]?.lotNo || '').trim();

        for (let i = 0; i < popupSelectedLots.length; i++) {
            const lot = popupSelectedLots[i];
            const lotMillId = lot.millId != null ? String(lot.millId) : '';
            const lotMillName = millOptions.find((m: any) => String(m.id) === lotMillId)?.subCategoryName || lot.millName || '';
            const lotNo = (lot.lotNumber || lot.lotNo || '').trim();

            const isSameMill = firstMillId && lotMillId ? (firstMillId === lotMillId) : (firstMillName === lotMillName);
            if (!isSameMill || firstLotNo !== lotNo) {
                toast.error("Please select stock lots with the same Mill Name and Lot Number.");
                return;
            }
        }

        // 2. Validate Warehouse Name matching Sizing Vendor (Name-based & Rithik prefix matching)
        const norm = (s?: string | null) => String(s || '').toLowerCase().replace(/[\s\W]+/g, "");
        const allVendors = Array.isArray(vendorList)
            ? vendorList
            : (Array.isArray((vendorList as any)?.data) ? (vendorList as any).data : []);

        const activeVendor = selectedVendor
            || allVendors.find((v: any) => String(v?.id) === String(currentVendorId))
            || (filteredVendorList || []).find((v: any) => String(v?.id) === String(currentVendorId));

        const isWarehouseMatchingVendor = (lotWarehouseName: string): boolean => {
            const lotWH = (lotWarehouseName || '').trim();
            if (!lotWH) return false;

            const lotNorm = norm(lotWH);
            const lotLower = lotWH.toLowerCase();

            // Explicit rule: if warehouse name starts with "Rithik" (case insensitive), allow those lots
            if (lotLower.startsWith("rithik")) {
                return true;
            }

            if (!activeVendor) return false;

            const vendorNamesSet = new Set<string>();
            const vendorRawNamesSet = new Set<string>();

            const fields = [
                activeVendor.customerName,
                activeVendor.vendorName,
                activeVendor.name,
                activeVendor.companyName,
                activeVendor.displayName,
                activeVendor.tradeName,
                activeVendor.shortName,
                activeVendor.label,
                activeVendor.warehouseName
            ];

            fields.forEach(f => {
                if (f) {
                    vendorRawNamesSet.add(String(f).trim().toLowerCase());
                    vendorNamesSet.add(norm(f));
                }
            });

            const vendorNorms = Array.from(vendorNamesSet).filter(Boolean);
            const vendorRawNames = Array.from(vendorRawNamesSet).filter(Boolean);

            // 1. Direct inclusion match
            for (const vNorm of vendorNorms) {
                if (vNorm === lotNorm || vNorm.includes(lotNorm) || lotNorm.includes(vNorm)) {
                    return true;
                }
            }

            // 2. First-word match (e.g. "Rithik" === "Rithik", "Sri" === "Sri")
            const lotFirstWord = lotLower.split(/[\s\W]+/)[0];
            if (lotFirstWord && lotFirstWord.length >= 3) {
                for (const rawName of vendorRawNames) {
                    const vFirstWord = rawName.split(/[\s\W]+/)[0];
                    if (vFirstWord && vFirstWord.length >= 3 && vFirstWord === lotFirstWord) {
                        return true;
                    }
                }
            }

            return false;
        };

        for (const lot of popupSelectedLots) {
            const lotWarehouseName = (lot.warehouseName || resolveWarehouseName(lot.warehouseId) || '').trim();
            const isMatch = isWarehouseMatchingVendor(lotWarehouseName);

            if (!isMatch) {
                toast.error(`Transfer the ${lotWarehouseName || 'warehouse'} first then start issue`);
                return;
            }
        }

        setSelectedLots(popupSelectedLots);
        setIsDraftSaved(true);
        setEditingRowIndex(null);
        setShowLotDialog(false);
    };

    const onSubmit = async (data: SizingPlanEntryFormData) => {
        const isEditMode = Boolean(sizingPlanDtl?.id);
        let sizingPlanNo = data.sizingPlanNo || sizingPlanDtl?.sizingPlanNo || "";
        if (!sizingPlanDtl?.id && (!sizingPlanNo || sizingPlanNo.startsWith("Loading"))) {
            try {
                const docResponse = await documentNumberService.generateDocumentNumber({
                    screenName: "Sizing Plan"
                });
                sizingPlanNo = docResponse.documentNumber;
            } catch (error) {
                console.warn("Failed to generate document number:", error);
            }
        }

        const vendor = Array.isArray(vendorList)
            ? vendorList.find((v: any) => String(v?.id) === String(data.vendorId))
            : null;
        const tradingCompanyId = resolvedCompanyId ?? null;
        const factoryCompanyId = resolveFactoryCompanyId(vendor || undefined);
        const orderTypeIdNum = parseInt(String(data.orderTypeId || ""), 10) || 0;
        const effectiveFactoryCompanyId = orderTypeIdNum === 1 ? factoryCompanyId : null;
        isSavingRef.current = true;
        const payload = {
            vendorId: parseInt(data.vendorId),
            orderTypeId: parseInt(data.orderTypeId),
            termsConditionsId: parseInt(data.termsConditionsId),
            paymentTermsId: parseInt(data.paymentTermsId),
            sizingRate: parseFloat(data.sizingRate),
            emptyBeamNo: data.emptyBeamNo,
            noOfCreels: items[0]?.noOfCreels ? parseInt(String(items[0].noOfCreels), 10) : 1,
            remarks: data.remarks,
            sizingPlanDate: data.sizingPlanDate,
            sizingPlanNo: sizingPlanNo,
            companyId: resolvedCompanyId,
            tradingCompanyId,
            factoryCompanyId: effectiveFactoryCompanyId,
            sizingQualityDetails: items.map((item: SizingQualityDetails) => {
                const epp = parseInt(String(item.endsPerPart || '0'), 10) || 0;
                const creels = item.noOfCreels ? parseInt(String(item.noOfCreels), 10) : 1;
                const reqCones = item.noReqCones != null ? parseInt(String(item.noReqCones), 10) : (epp * creels);
                return {
                    id: item.id || undefined,
                    quality: item.quality,
                    fabricCode: item.fabricCode,
                    fabricId: item.fabricId ? parseInt(item.fabricId) : undefined,
                    yarnId: parseInt(item.yarnId),
                    actualYarn: parseInt(item.actualYarn) || parseInt(item.yarnId),
                    sordEnds: parseInt(item.sordEnds),
                    actualEnds: parseInt(item.actualEnds),
                    warpEnds: parseInt(item.warpEnds),
                    actualWarpEnds: parseInt(item.actualWarpEnds),
                    parts: parseInt(item.parts),
                    endsPerPart: parseInt(item.endsPerPart),
                    noReqCones: reqCones,
                    warpMeters: parseFloat(item.warpMeters),
                    fabricPanelWidth: parseFloat(item.fabricPanelWidth || "1"),
                    noOfCreels: creels
                };
            }),
            sizingBeamDetails: allBeams.map((beamItem: SizingBeamDetails) => ({
                id: beamItem.id || undefined,
                weavingContractId: parseInt(beamItem.weavingContractId),
                salesOrderId: parseInt(beamItem.salesOrderId),
                weavingVendorId: parseInt(beamItem.weavingVendorId),
                warpMeters: Number(parseFloat(beamItem.warpMeters).toFixed(2)),
                shrinkage: parseFloat(beamItem.shrinkage),
                expectedFabricMeter: Number(parseFloat(beamItem.expectedFabricMeter).toFixed(2)),
                fabricPanelWidth: parseFloat(beamItem.fabricPanelWidth || String(planFabricPanelWidth || "1")),
                fabricId: beamItem.fabricId ? parseInt(beamItem.fabricId) : undefined,
                beamTypeId: beamItem.beamTypeId ? parseInt(beamItem.beamTypeId) : undefined,
                noOfBeams: allBeams.length,
            }))
        };
        // Validate beam warp meter tolerance BEFORE saving sizing plan
        if (allBeams.length > 0) {
            if (!validateBeamWarpMeterTolerance(allBeams, [])) {
                isSavingRef.current = false;
                return;
            }
        }

        // Validate selected lots BEFORE saving sizing plan
        if (selectedLots.length > 0) {
            for (const lot of selectedLots) {
                if (!resolveAlternateYarnValue(lot) || resolveAlternateYarnValue(lot).trim() === '') {
                    toast.error(`Please fill alternate yarn for lot ${lot.lotNumber || lot.yarnName || ''}`);
                    isSavingRef.current = false;
                    return;
                }
                const cones = Number(lot.issuingCones ?? 0);
                const availBags = Number(lot.lotAvailableBags ?? lot.availableBags ?? 0);
                const conesPerBag = Number(lot.conesPerBag ?? 0);
                const availCones = lot.availableCones != null ? Number(lot.availableCones) : (availBags > 0 && conesPerBag > 0 ? availBags * conesPerBag : 0);

                if (cones <= 0) {
                    toast.error(`Issuing No. of Cones must be greater than 0 for lot ${lot.lotNumber || lot.yarnName || ''}`);
                    isSavingRef.current = false;
                    return;
                }
                if (availCones > 0 && cones > availCones) {
                    toast.error(`Issuing No. of Cones (${cones}) cannot exceed Available Cones (${availCones}) for lot ${lot.lotNumber || lot.yarnName || ''}`);
                    isSavingRef.current = false;
                    return;
                }
                if (Number(lot.noOfBags ?? 0) > availBags) {
                    toast.error(`Issuing No of Bags cannot exceed Available Bags for lot ${lot.lotNumber || lot.yarnName || ''}`);
                    isSavingRef.current = false;
                    return;
                }
                if (Number(lot.issueQty ?? lot.issuedQty ?? 0) > Number(lot.lotAvailableQty ?? lot.availableQty ?? 0)) {
                    toast.error(`Issue Qty cannot exceed Available Qty for lot ${lot.lotNumber || lot.yarnName || ''}`);
                    isSavingRef.current = false;
                    return;
                }
            }
        }


        try {
            let savedSizingPlan;
            if (isEditMode) {
                const result = await dispatch(updateSizingPlan({
                    id: sizingPlanDtl.id,
                    data: payload
                })).unwrap();
                savedSizingPlan = result?.data || result;
            } else {
                const result = await dispatch(createSizingPlan(payload)).unwrap();
                savedSizingPlan = result?.data || result;
                documentNumberService.clearMemoryCache('Sizing Plan');
            }
            
            const fallbackSalesOrderId =
                location.state?.salesOrderId ||
                allBeams.find((beam: SizingBeamDetails) => beam?.salesOrderId)?.salesOrderId;

            // Save sizing yarn issue concurrently if lots are selected
            if (selectedLots.length > 0) {

                let issueNo = sizingYarnIssueDtl?.issueNo || "";
                if (!sizingYarnIssueDtl?.id && !issueNo) {
                    try {
                        const docResponse = await documentNumberService.generateDocumentNumber({
                            screenName: "Sizing Management",
                            tabName: "sizingYarnIssue"
                        });
                        issueNo = docResponse.documentNumber;
                    } catch (error) {
                        console.warn("Failed to generate document number for sizing yarn issue:", error);
                    }
                }

                const fabricDetailsSummary = yarnRequirementDetailsWithTotals
                    .map((req: any) => req.fabricDetails?.trim())
                    .filter((detail: any): detail is string => Boolean(detail))
                    .filter((detail: any, index: any, array: any) => array.indexOf(detail) === index)
                    .join(", ");

                const yarnIssuePayload = {
                    vendorId: parseInt(data.vendorId),
                    sizingPlanId: savedSizingPlan.id || savedSizingPlan.sizingPlanId,
                    sizingPlanNo: savedSizingPlan.sizingPlanNo || sizingPlanNo,
                    outwardTypeId: 53,
                    transportationDetails: transportationDetails,
                    transportId: transportId ? parseInt(transportId) : null,
                    transportName: transportationDetails,
                    termsConditionsId: data.termsConditionsId ? parseInt(data.termsConditionsId) : 0,
                    fabricDetails: fabricDetailsSummary,
                    sizingYarnIssueDate: yarnIssueDate || new Date().toISOString().split('T')[0],
                    yarnIssueChallanNo: yarnIssueChallanNo,
                    activeFlag: true,
                    issueNo: issueNo,
                    companyId: resolvedCompanyId,
                    orderTypeId: orderTypeIdNum,
                    tradingCompanyId: resolvedCompanyId,
                    factoryCompanyId: effectiveFactoryCompanyId,
                    grossWt: Number(grossWt) || Number(totalNetWt.toFixed(3)),
                    totalNetWt: Number(totalNetWt.toFixed(3)),
                    remark: remark || '',
                    vehicleNo: vehicleNo || '',
                    requirements: yarnRequirementDetailsWithTotals.map((req: any) => {
                        const existingReqs = Array.isArray(sizingYarnIssueDtl?.requirements) ? sizingYarnIssueDtl.requirements : [];
                        const matchedExistingReq = existingReqs.find((er: any) =>
                            (er.yarnId != null && Number(er.yarnId) === Number(req.yarnId)) ||
                            (er.actualYarnId != null && Number(er.actualYarnId) === Number(req.actualYarnId)) ||
                            (er.yarnName && er.yarnName === req.yarnName)
                        );
                        const resolvedReqId = matchedExistingReq?.id ? Number(matchedExistingReq.id) : 0;
                        return {
                            id: resolvedReqId,
                            fabricDetails: req.fabricDetails,
                            yarnName: req.yarnName,
                            actualYarn: req.actualYarn,
                            yarnId: req.yarnId,
                            actualYarnId: req.actualYarnId,
                            warpMeters: req.warpMeters,
                            warpGramsPerMeter: req.warpGramsPerMeter,
                            warpRequirement: req.warpRequirement,
                            totalIssuedQty: req.totalIssuedQty,
                            balanceToIssue: req.balanceToIssue,
                            inwardId: 0,
                            orderItemId: 0,
                            activeFlag: true
                        };
                    }),
                    sizingYarnIssue: selectedLots.map((lot: LotDetail) => ({
                        id: lot.id || 0,
                        sizingYarnIssueEntryId: sizingYarnIssueDtl?.id || 0,
                        yarnName: lot.yarnName,
                        yarnId: Number(lot.yarnId),
                        millId: lot.millId ? Number(lot.millId) : 0,
                        warehouseId: lot.warehouseId ? Number(lot.warehouseId) : 0,
                        inwardId: lot.inwardId ?? 0,
                        orderItemId: lot.orderItemId ?? 0,
                        yarnInwardStockDetailsId: lot.yarnInwardStockDetailsId ?? null,
                        actualItemId: lot.yarnId,
                        uomId: lot.uomId ?? 0,
                        issuedQty: lot.issueQty || 0,
                        availableQty: Number(lot.availableQty ?? lot.lotAvailableQty ?? 0),
                        lotAvailableQty: Number(lot.lotAvailableQty ?? lot.availableQty ?? 0),
                        noOfBags: Number(lot.noOfBags ?? 0),
                        availableBags: Number(lot.availableBags ?? lot.lotAvailableBags ?? 0),
                        lotAvailableBags: Number(lot.lotAvailableBags ?? lot.availableBags ?? 0),
                        kgsPerBag: lot.kgsPerBag ?? 0,
                        conesPerBag: lot.conesPerBag ?? 0,
                        conesWeight: lot.conesWeight ?? 0,
                        issuedBags: lot.issuedBags ?? 0,
                        perBabyConeWeight: Number(lot.perBabyConeWeight ?? 0.01),
                        noOfCones: Number(lot.issuingCones ?? 0),
                        availableCones: Number(lot.availableCones ?? (Number(lot.availableBags ?? lot.lotAvailableBags ?? 0) * Number(lot.conesPerBag ?? 0))),
                        inwardTypeId: lot.inwardTypeId ?? 0,
                        lotNo: lot.lotNumber,
                        activeFlag: true
                    }))
                };

                if (sizingYarnIssueDtl?.id) {
                    await dispatch(updateSizingYarnIssue({
                        id: sizingYarnIssueDtl.id,
                        data: yarnIssuePayload
                    })).unwrap();
                } else {
                    await dispatch(createSizingYarnIssue(yarnIssuePayload)).unwrap();
                    documentNumberService.clearMemoryCache('Sizing Yarn Issue');
                }
            }

            if (!isEditMode && selectedLots.length === 0) {
                navigate("/transaction/sizing-yarn-issue", {
                    state: {
                        newlyCreatedSizingPlan: savedSizingPlan,
                        autoSelectPlan: true,
                        source: fromOrderEntry ? "order-entry-management" : "sizing-plan-entry",
                        salesOrderId: fallbackSalesOrderId ? Number(fallbackSalesOrderId) : undefined,
                        activeTab: location.state?.activeTab,
                        expandedRowId: location.state?.expandedRowId || (fallbackSalesOrderId ? Number(fallbackSalesOrderId) : undefined),
                        flowType: "sizing",
                        selectedHyperlink: "sizingPlan"
                    }
                });
            } else {
                if (fromOrderEntry) {
                    const targetSalesOrderId =
                        location.state?.salesOrderId ||
                        allBeams.find((beam: SizingBeamDetails) => beam?.salesOrderId)?.salesOrderId;
                    navigate("/transaction/order-entry-management", {
                        state: {
                            source: "order-entry-management",
                            salesOrderId: targetSalesOrderId ? Number(targetSalesOrderId) : undefined,
                            expandedRowId: targetSalesOrderId ? Number(targetSalesOrderId) : undefined,
                            activeTab: location.state?.activeTab,
                            flowType: "sizing",
                            selectedHyperlink: location.state?.selectedHyperlink || "sizingPlan",
                            fromOrderEntry: true,
                            expandView: "true",
                            refreshData: true
                        }
                    });
                } else {
                    navigate("/transaction/sizing-plan-details");
                }
            }
        } catch (err) {
            console.error("Error submitting sizing plan:", err);
        }
    };

    const handleSaveClick = () => {
        const missingFields = collectMissingMandatoryFields();
        if (missingFields.length > 0) {
            toast.error(`Please fill the required fields: ${missingFields.join(", ")}`);
            return;
        }
        handleSubmit(onSubmit)();
    };

    const isSaveDisabled = !isFormValid;
    const saveButtonClassName = `bg-primary text-white px-6 flex items-center ${isSaveDisabled ? "opacity-60 cursor-not-allowed" : "hover:bg-primary"}`;

    return (
        <div className="p-6 pt-16">
            <div className="p-6 bg-white shadow-md rounded-lg">
                <div className="flex justify-between items-center border-b pb-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/transaction/sizing-plan-details")}
                            className="mr-auto"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Back
                        </Button>
                        <h2 className="text-2xl font-semibold">Sizing Plan Entry</h2>
                    </div>
                  
                </div>
                <div className="space-y-6">
                    <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 ">
                                        <FileText size={20} /> Vendor Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-4 gap-8">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">Sizing Plan No</label>
                                        <input
                                            type="text"
                                            placeholder="Loading sequence..."
                                            
                                            className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                                                !watch('sizingPlanNo') || watch('sizingPlanNo')?.startsWith('Loading')
                                                    ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                                                    : ' text-gray-800 font-medium border-gray-300'
                                            }`}
                                            {...register('sizingPlanNo')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Sizing Plan Date <span className="text-red-600">*</span></label>
                                        <input
                                            type="date"
                                            {...register("sizingPlanDate", { required: "Sizing Plan Date is required" })}
                                            className="input mt-1"
                                        />
                                        {errors.sizingPlanDate && (
                                            <p className="mt-1 text-sm text-red-600">{errors.sizingPlanDate.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Order Type <span className="text-red-600">*</span></label>
                                        <CommonSearchableSelect
                                            {...register("orderTypeId", { required: "Order Type is required" })}
                                            options={[
                                                { value: "1", label: "Internal" },
                                                { value: "2", label: "External" }
                                            ]}
                                            placeholder="Select Order Type"
                                            className="mt-1"
                                            error={errors.orderTypeId?.message}
                                            disabled={isPlanMapped}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Sizing Vendor <span className="text-red-600">*</span></label>
                                        <CommonSearchableSelect
                                            {...register("vendorId", { required: "Sizing Vendor is required" })}
                                            options={[
                                                ...(!selectedVendorInFiltered && selectedVendor ? [{
                                                    value: String(selectedVendor.id),
                                                    label: selectedVendor.customerName || selectedVendor.vendorName
                                                }] : []),
                                                ...filteredVendorList.map((vendor: any) => ({
                                                    value: String(vendor.id),
                                                    label: vendor.customerName || vendor.vendorName
                                                }))
                                            ]}
                                            placeholder="Select a Sizing Vendor"
                                            className="mt-1"
                                            error={errors.vendorId?.message}
                                            disabled={isPlanMapped}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Select Terms & Conditions <span className="text-red-600">*</span></label>
                                        <CommonSearchableSelect
                                            {...register("termsConditionsId", { required: "Terms & Conditions is required" })}
                                            options={normalizedTermsConditions.map((tc: any) => ({
                                                value: String(tc.id),
                                                label: tc.termsConditionsName,
                                            }))}
                                            placeholder="Select Terms & Conditions"
                                            className="mt-1"
                                            error={errors.termsConditionsId?.message}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Select Payment Terms <span className="text-red-600">*</span></label>
                                        <CommonSearchableSelect
                                            {...register("paymentTermsId", { required: "Payment Terms is required" })}
                                            options={normalizedPaymentTerms.map((pt: any) => ({
                                                value: String(pt.id),
                                                label: pt.termName,
                                            }))}
                                            placeholder="Select Payment Terms"
                                            className="mt-1"
                                            error={errors.paymentTermsId?.message}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Remarks</label>
                                        <input
                                            {...register('remarks')}
                                            className="input mt-1"
                                            placeholder="Enter Remarks"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div>
                                <h1 className="text-xl font-bold my-4">Sizing Plan Summary</h1>
                                <div className="grid grid-cols-5 gap-6 my-4">
                                     <div>
                                         <label className="block text-sm font-medium text-secondary-700">
                                             Sort No/Construction <span className="text-red-600">*</span>
                                         </label>
                                         <CommonSearchableSelect
                                             value={newQuality.fabricId}
                                             onValueChange={(val) => handleFabricSelection(val)}
                                             options={normalizedFabricMasters?.map((fabric: FabricMaster) => ({
                                                 value: String(fabric.id),
                                                 label: `${fabric.fabricCode} - ${fabric.fabricQuality}`
                                             }))}
                                             placeholder="Select Fabric"
                                             className="mt-1"
                                             // disabled={isPlanMapped}
                                         />
                                     </div>

                                     <div>
                                         <label className="block text-sm font-medium text-secondary-700">
                                             Sort Ends
                                         </label>
                                         <input
                                             value={newQuality.sordEnds}
                                             className="input mt-1"
                                             readOnly
                                         />
                                     </div>

                                     <div>
                                         <label className="block text-sm font-medium text-secondary-700">
                                             Fabric Panel/Width
                                         </label>
                                         <input
                                             type="number"
                                             value={newQuality.fabricPanelWidth}
                                             onChange={(e) => {
                                                 const fpw = e.target.value;
                                                 const se = parseFloat(newQuality.sordEnds || "0") || 0;
                                                 const prod = se * (parseFloat(fpw || "1") || 1);
                                                 setNewQuality({
                                                     ...newQuality,
                                                     fabricPanelWidth: fpw,
                                                     actualEnds: String(Math.round(prod))
                                                 });
                                             }}
                                             className="input mt-1"
                                             min="0"
                                             step="0.01"
                                         />
                                     </div>

                                     <div>
                                         <label className="block text-sm font-medium text-secondary-700">
                                             Beam Ends <span className="text-red-600">*</span>
                                         </label>
                                         <input
                                             type="number"
                                             value={newQuality.actualEnds}
                                             className="input mt-1"
                                             min="0"
                                             step="1"
                                             readOnly
                                         />
                                     </div>

                                     <div>
                                         <label className="block text-sm font-medium text-secondary-700">
                                             Sizing Rate/KG <span className="text-red-600">*</span>
                                         </label>
                                         <input
                                             type="number"
                                             inputMode="decimal"
                                             step="0.01"
                                             min="0"
                                             {...register('sizingRate', {
                                                 required: "Sizing Rate is required",
                                                 pattern: {
                                                     value: /^\d+(\.\d+)?$/,
                                                     message: "Sizing Rate must be numeric"
                                                 }
                                             })}
                                             className="input mt-1"
                                             placeholder="Enter Sizing Rate/KG"
                                         />
                                         {errors.sizingRate && (
                                             <p className="mt-1 text-sm text-red-600">{errors.sizingRate.message}</p>
                                         )}
                                     </div>
                                 </div>
                                <div className="my-4">
                                {layerData.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-medium text-secondary-700 mb-2">Yarn and Actual Yarn Details</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-300 text-center">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border p-2">Layer</th>
                                                        <th className="border p-2">Yarn</th>
                                                        <th className="border p-2">Actual Yarn <span className="text-red-600">*</span></th>
                                                        <th className="border p-2">Warp Ends</th>
                                                        <th className="border p-2">Actual Warp Ends <span className="text-red-600">*</span></th>
                                                        <th className="border p-2">No. of Creels <span className="text-red-600">*</span></th>
                                                        <th className="border p-2">Parts (Warp Beam) <span className="text-red-600">*</span></th>
                                                        <th className="border p-2">Ends Per Part</th>
                                                        <th className="border p-2">Warp Meters</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {layerData.map((layer, idx) => (
                                                        <tr key={idx} className="border">
                                                            <td className="border p-2">{idx + 1}</td>
                                                            <td className="border p-2">
                                                                <input
                                                                    value={layer.yarnName}
                                                                    className="input mt-1 w-full bg-gray-50"
                                                                    readOnly
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <CommonSearchableSelect
                                                                    value={layer.actualYarn}
                                                                    onValueChange={(val) => updateLayerField(idx, 'actualYarn', val)}
                                                                    options={normalizedYarnMasters?.map((yarn: YarnMaster) => ({
                                                                        value: String(yarn.id),
                                                                        label: yarn.yarnName
                                                                    }))}
                                                                    placeholder="Select Actual Yarn"
                                                                    className="mt-1 w-full"
                                                                    // disabled={isPlanMapped}
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <input
                                                                    value={layer.warpEnds}
                                                                    className="input mt-1 w-full bg-gray-50"
                                                                    readOnly
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <input
                                                                    type="number"
                                                                    value={layer.actualWarpEnds}
                                                                    onChange={(e) => updateLayerField(idx, 'actualWarpEnds', e.target.value)}
                                                                    className="input mt-1 w-full"
                                                                    min="0"
                                                                    step="1"
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <input
                                                                    type="number"
                                                                    value={layer.noOfCreels || "1"}
                                                                    onChange={(e) => updateLayerField(idx, 'noOfCreels', e.target.value)}
                                                                    className="input mt-1 w-full"
                                                                    min="1"
                                                                    step="1"
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <input
                                                                    type="number"
                                                                    value={layer.parts}
                                                                    onChange={(e) => updateLayerField(idx, 'parts', e.target.value)}
                                                                    className="input mt-1 w-full"
                                                                    min="1"
                                                                    step="1"
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <input
                                                                    value={layer.endsPerPart}
                                                                    className="input mt-1 w-full bg-gray-50"
                                                                    readOnly
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <input
                                                                    type="number"
                                                                    value={layer.warpMeters}
                                                                    onChange={(e) => updateLayerField(idx, 'warpMeters', e.target.value)}
                                                                    className="input mt-1 w-full"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                </div>
                                <div>
                                     {formError && <p className="mt-1 text-sm text-red-600">{formError}</p>}
                                    <Button onClick={addAllItems} className="mt-4 ml-auto flex items-center" disabled={layerData.length === 0}>
                                        <Plus size={18} className="mr-2" />
                                        {editingIndex !== null ? "Update Item" : "Add All Items"}
                                    </Button>
                                </div>
                            </div>

                            {/* Summary Table */}
                            {summaryRows.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardList size={20} /> Summary Table
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-300 text-center">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border p-2">Actual Yarn</th>
                                                        <th className="border p-2">Parts (Warp Beam)</th>
                                                        <th className="border p-2">Actual Warp Ends</th>
                                                        <th className="border p-2">Ends Per Part</th>
                                                        <th className="border p-2">Warp Meters</th>
                                                        <th className="border p-2">Warp Meters - Shrinkage</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {summaryRows.map((row: SummaryRow, index: number) => (
                                                        <tr key={index} className="border">
                                                            <td className="border p-2">{row.yarnLabel}</td>
                                                            <td className="border p-2">{row.parts}</td>
                                                            <td className="border p-2">{row.actualEnds}</td>
                                                            <td className="border p-2">{row.endsPerPart}</td>
                                                            <td className="border p-2">{row.rawWarpMeters}</td>
                                                            <td className="border p-2">{row.warpMetersAfterShrink}</td>
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
                                    <CardTitle className="flex items-center gap-2">
                                        <ClipboardList size={20} /> Quality Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                         <table className="w-full border-collapse border border-gray-300 text-center">
                                             <thead className="bg-gray-100">
                                                 <tr>
                                                     <th className="border p-2">Sl.No</th>
                                                     <th className="border p-2">Sort No/Construction</th>
                                                     <th className="border p-2">Sort Ends</th>
                                                     <th className="border p-2">Fabric Panel/Width</th>
                                                     <th className="border p-2">Beam Ends</th>
                                                     <th className="border p-2">Sizing Rate/KG</th>
                                                     <th className="border p-2">Actions</th>
                                                 </tr>
                                             </thead>
                                             <tbody>
                                                 {uniqueQualities.map((q: any, index: number) => (
                                                     <tr key={index} className="border">
                                                         <td className="border p-2">{index + 1}</td>
                                                         <td className="border p-2">{q.fabricCode} / {q.quality}</td>
                                                         <td className="border p-2">{q.sordEnds}</td>
                                                         <td className="border p-2">{q.fabricPanelWidth}</td>
                                                         <td className="border p-2">{q.actualEnds}</td>
                                                         <td className="border p-2">{watch('sizingRate') || q.sizingRate || "-"}</td>
                                                         <td className="border p-2">
                                                             <button onClick={() => editQualityRow(String(q.key || q.fabricId || ""))} className="text-blue-500">
                                                                 <Edit size={18} />
                                                             </button>
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ClipboardList size={20} /> Yarn Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300 text-center">
                                            <thead className="bg-gray-100">
                                                 <tr>
                                                    <th className="border p-2">Sl.No</th>
                                                    <th className="border p-2">Yarn</th>
                                                    <th className="border p-2">Actual Yarn</th>
                                                    <th className="border p-2">Warp Ends</th>
                                                    <th className="border p-2">Actual Warp Ends</th>
                                                    <th className="border p-2">No. of Creels</th>
                                                    <th className="border p-2">No. of Warp Beams</th>
                                                    <th className="border p-2">Ends/Warp Beams</th>
                                                    <th className="border p-2">No. Req Cones</th>
                                                    <th className="border p-2">Warp Meters</th>
                                                    <th className="border p-2">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item: SizingQualityDetails, index: number) => {
                                                    const epp = Math.round(parseFloat(item.endsPerPart) || 0);
                                                    const creels = parseFloat(String(item.noOfCreels || watch('noOfCreels') || '1')) || 1;
                                                    const noReqConesVal = item.noReqCones != null ? Number(item.noReqCones) : (epp * creels);
                                                    return (
                                                        <tr key={index} className="border">
                                                            <td className="border p-2">{index + 1}</td>
                                                            <td className="border p-2">
                                                                {yarnList.find((y: YarnMaster) => y.id === parseInt(item.yarnId))?.yarnName || item.yarnId}
                                                            </td>
                                                            <td className="border p-2">
                                                                {yarnList.find((y: YarnMaster) => y.id === parseInt(item.actualYarn))?.yarnName || item.actualYarn}
                                                            </td>
                                                            <td className="border p-2">{item.warpEnds}</td>
                                                            <td className="border p-2">{item.actualWarpEnds}</td>
                                                            <td className="border p-2">{item.noOfCreels || "1"}</td>
                                                            <td className="border p-2">{Math.round(parseFloat(item.parts) || 0)}</td>
                                                            <td className="border p-2">{epp}</td>
                                                            <td className="border p-2">{noReqConesVal}</td>
                                                            <td className="border p-2">{item.warpMeters}</td>
                                                            <td className="border p-2">
                                                                <button onClick={() => editItem(index)} className="mr-2 text-blue-500">
                                                                    <Edit size={18} />
                                                                </button>
                                                                <button onClick={() => deleteItem(index)} className="text-red-500">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Integrated Sizing Yarn Issue Section */}
                            <Card className="mt-6 border-t-4 border-red-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                        <ClipboardList size={20} /> Sizing Yarn Issue
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Issue Header Fields */}
                                    <div className="grid grid-cols-4 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 font-semibold">Yarn Issue Challan No</label>
                                            <Input
                                                value={yarnIssueChallanNo}
                                                onChange={(e) => setYarnIssueChallanNo(e.target.value)}
                                                className="input mt-1"
                                                placeholder="Enter Challan No"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 font-semibold">Yarn Issue Date</label>
                                            <input
                                                type="date"
                                                value={yarnIssueDate}
                                                onChange={(e) => setYarnIssueDate(e.target.value)}
                                                className="input mt-1 w-full border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 font-semibold">Gross Weight (Kgs)</label>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                value={grossWt}
                                                onChange={(e) => setGrossWt(e.target.value)}
                                                className="input mt-1"
                                                placeholder="Enter Gross Wt"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 font-semibold">Vehicle No</label>
                                            <Input
                                                value={vehicleNo}
                                                onChange={(e) => setVehicleNo(e.target.value)}
                                                className="input mt-1"
                                                placeholder="Enter Vehicle No"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 font-semibold">Transportation Details</label>
                                            <CommonSearchableSelect
                                                value={transportId}
                                                onValueChange={(val) => {
                                                    setTransportId(String(val));
                                                    const match = activeTransportOptions.find((t: any) => String(t.id) === String(val));
                                                    if (match) {
                                                        setTransportationDetails(match.transportName || match.name || "");
                                                    }
                                                }}
                                                options={activeTransportOptions.map((t: any) => ({
                                                    value: String(t.id),
                                                    label: t.transportName || t.name,
                                                }))}
                                                placeholder="Select Transporter"
                                                className="mt-1 w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 font-semibold">Remarks</label>
                                            <Input
                                                value={remark}
                                                onChange={(e) => setRemark(e.target.value)}
                                                className="input mt-1"
                                                placeholder="Enter Remarks"
                                            />
                                        </div>
                                    </div>

                                    {/* Yarn Requirement Details Table */}
                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold mb-2">Yarn Requirement Details</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-300 text-center">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border p-2">Sl.No</th>
                                                        <th className="border p-2 text-left">Fabric Details</th>
                                                        <th className="border p-2">Yarn Count</th>
                                                        <th className="border p-2">Actual Yarn Count</th>
                                                        <th className="border p-2 text-right">Requirement Qty (Kgs)</th>
                                                        <th className="border p-2 text-right">Total Issued Qty (Kgs)</th>
                                                        <th className="border p-2 text-right">Balance to Issue (Kgs)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {yarnRequirementDetailsWithTotals.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="border p-4 text-gray-500">No requirements loaded. Please configure quality/yarn details above.</td>
                                                        </tr>
                                                    ) : (
                                                        yarnRequirementDetailsWithTotals.map((req: any, index: number) => (
                                                            <tr key={index} className="border hover:bg-gray-50">
                                                                <td className="border p-2">{index + 1}</td>
                                                                <td className="border p-2 text-left">{req.fabricDetails}</td>
                                                                <td className="border p-2">{req.yarnName}</td>
                                                                <td className="border p-2">{req.actualYarn}</td>
                                                                <td className="border p-2 text-right font-semibold">{req.warpRequirement.toFixed(3)}</td>
                                                                <td className="border p-2 text-right text-green-600 font-semibold">{req.totalIssuedQty.toFixed(3)}</td>
                                                                <td className="border p-2 text-right text-red-600 font-semibold">{req.balanceToIssue.toFixed(3)}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                    {yarnRequirementDetailsWithTotals.length > 0 && (
                                                        <tr className="bg-gray-50 font-bold">
                                                            <td colSpan={4} className="border p-2 text-right">Total:</td>
                                                            <td className="border p-2 text-right">{requirementTotals.warpRequirement.toFixed(3)}</td>
                                                            <td className="border p-2 text-right text-green-600">{requirementTotals.totalIssuedQty.toFixed(3)}</td>
                                                            <td className="border p-2 text-right text-red-600">{requirementTotals.balanceToIssue.toFixed(3)}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Yarn Issue Details Section */}
                                    <div className="mt-8">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-lg font-semibold">Yarn Issue Details</h3>
                                            <Button
                                                type="button"
                                                onClick={handleYarnIssue}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2"
                                            >
                                                <Plus size={16} className="mr-1.5" /> YARN ISSUE
                                            </Button>
                                        </div>

                                        <div className="overflow-x-auto">
                                             <table className="w-full border-collapse border border-gray-300 text-center">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border p-2">Sl.No</th>
                                                        <th className="border p-2">Yarn Count</th>
                                                        <th className="border p-2">Inward No</th>
                                                        <th className="border p-2">Yarn Mill Inv Date</th>
                                                        <th className="border p-2">Yarn Mill Inv No</th>
                                                        <th className="border p-2">Alternate Yarn</th>
                                                        <th className="border p-2">Mill</th>
                                                        <th className="border p-2">Warehouse</th>
                                                        <th className="border p-2 text-right">Available Bags</th>
                                                        <th className="border p-2 text-right">Kgs/Bag</th>
                                                        <th className="border p-2 text-right">Cones/Bag</th>
                                                        <th className="border p-2 text-right">Cones Weight</th>
                                                        <th className="border p-2 text-right">Per Baby Cone Wt (Kg)</th>
                                                         <th className="border p-2 text-right">Available Qty</th>
                                                         <th className="border p-2 text-right">Available Cones</th>
                                                         <th className="border p-2 text-right">Issuing No. of Cones <span className="text-red-500">*</span></th>
                                                         <th className="border p-2 text-right">Required Bags</th>
                                                         <th className="border p-2 text-right">Issue Qty (Kgs)</th>
                                                         <th className="border p-2">Lot No</th>
                                                         <th className="border p-2">Actions</th>
                                                     </tr>
                                                 </thead>
                                                 <tbody>
                                                     {selectedLots.length === 0 ? (
                                                         <tr>
                                                             <td colSpan={20} className="border p-4 text-gray-500">No lots selected. Click YARN ISSUE to add lots from stock.</td>
                                                         </tr>
                                                     ) : (
                                                         selectedLots.map((lot: LotDetail, index: number) => {
                                                             const isEditing = !isDraftSaved || editingRowIndex === index;
                                                             const alternateDisplay = resolveAlternateYarnValue(lot);
                                                             const availBags = Number(lot.lotAvailableBags ?? lot.availableBags ?? 0);
                                                             const conesPerBag = Number(lot.conesPerBag ?? 0);
                                                             const conesWeight = Number(lot.conesWeight ?? 0);
                                                             const issuingConesVal = lot.issuingCones === 0 ? '' : (lot.issuingCones ?? '');
                                                             const noOfBagsVal = (lot.noOfBags !== undefined && lot.noOfBags !== null && lot.noOfBags !== 0 && (lot.noOfBags as any) !== '')
                                                                 ? lot.noOfBags
                                                                 : (lot.issuingCones && conesPerBag > 0 ? Number((Number(lot.issuingCones) / conesPerBag).toFixed(3)) : '');
                                                             const issueQtyVal = lot.issueQty === 0 ? '' : (lot.issueQty ?? '');
                                                             const perBabyConeWtVal = (lot.perBabyConeWeight !== undefined && lot.perBabyConeWeight !== null && (lot.perBabyConeWeight as any) !== '') ? lot.perBabyConeWeight : 0.01;

                                                             return (
                                                                 <tr key={index} className="border hover:bg-gray-50">
                                                                     <td className="border p-2 text-center">{index + 1}</td>
                                                                     <td className="border p-2 text-left">{lot.originalYarnName || lot.yarnName || '-'}</td>
                                                                     <td className="border p-2 text-left">{lot.inwardNo && lot.inwardNo !== 'N/A' ? lot.inwardNo : '-'}</td>
                                                                     <td className="border p-2 text-center">{lot.millDate && lot.millDate !== 'N/A' ? String(lot.millDate) : '-'}</td>
                                                                     <td className="border p-2 text-left">{lot.millInvNo && lot.millInvNo !== 'N/A' ? lot.millInvNo : '-'}</td>
                                                                     <td className="border p-2 text-left">{alternateDisplay || '-'}</td>
                                                                     <td className="border p-2 text-left">
                                                                         {millOptions.find((m: any) => String(m.id) === String(lot.millId))?.subCategoryName || '-'}
                                                                     </td>
                                                                     <td className="border p-2 text-left">
                                                                         {lot.warehouseName || resolveWarehouseName(lot.warehouseId) || '-'}
                                                                     </td>
                                                                     <td className="border p-2 text-right">{availBags}</td>
                                                                     <td className="border p-2 text-right">{Number(lot.kgsPerBag ?? 0)}</td>
                                                                     <td className="border p-2 text-right">{conesPerBag}</td>
                                                                     <td className="border p-2 text-right">{conesWeight.toFixed(3)}</td>
                                                                     <td className="border p-2 text-right">
                                                                         <Input
                                                                             type="number"
                                                                             step="0.01"
                                                                             placeholder="0.010"
                                                                             value={perBabyConeWtVal}
                                                                             onChange={(e) => {
                                                                                 const val = e.target.value;
                                                                                 const babyConeWt = val === '' ? 0.01 : Number(val);
                                                                                 setSelectedLots((prev) => {
                                                                                     const updated = [...prev];
                                                                                     if (!updated[index]) return prev;
                                                                                     const targetLot = updated[index];
                                                                                     const cWeight = Number(targetLot.conesWeight ?? 0);
                                                                                     const conesNum = Number(targetLot.issuingCones ?? 0);
                                                                                     const computedQty = conesNum > 0 ? Number((conesNum * cWeight).toFixed(3)) : (targetLot.issueQty ?? 0);
                                                                                     updated[index] = {
                                                                                         ...targetLot,
                                                                                         perBabyConeWeight: val === '' ? '' : babyConeWt,
                                                                                         issueQty: computedQty,
                                                                                         issuedQty: computedQty
                                                                                     };
                                                                                     return updated;
                                                                                 });
                                                                                 setIsDraftSaved(false);
                                                                             }}
                                                                             disabled={!isEditing}
                                                                             className={`w-full text-right ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                         />
                                                                     </td>
                                                                     <td className="border p-2 text-right">{Number(lot.lotAvailableQty ?? 0)}</td>
                                                                     <td className="border p-2 text-right">
                                                                         {lot.availableCones != null ? Number(lot.availableCones) : (availBags > 0 && conesPerBag > 0 ? availBags * conesPerBag : 0)}
                                                                     </td>
                                                                     <td className="border p-2 text-right">
                                                                         <Input
                                                                             type="number"
                                                                             inputMode="numeric"
                                                                             min="1"
                                                                             placeholder="Enter cones"
                                                                             value={issuingConesVal}
                                                                             onChange={(e) => {
                                                                                 const rawVal = e.target.value;
                                                                                 const cones = rawVal === '' ? '' : Number(rawVal);
                                                                                 const availBags = Number(lot.lotAvailableBags ?? lot.availableBags ?? 0);
                                                                                 const cPerBag = Number(lot.conesPerBag ?? 0);
                                                                                 const availCones = lot.availableCones != null ? Number(lot.availableCones) : (availBags > 0 && cPerBag > 0 ? availBags * cPerBag : 0);

                                                                                 if (typeof cones === 'number' && availCones > 0 && cones > availCones) {
                                                                                     toast.error(`Issuing No. of Cones (${cones}) cannot exceed Available Cones (${availCones}) for lot ${lot.lotNumber || lot.yarnName || ''}`);
                                                                                     return;
                                                                                 }
                                                                                 setSelectedLots((prev) => {
                                                                                     const updated = [...prev];
                                                                                     if (!updated[index]) return prev;
                                                                                     const targetLot = updated[index];
                                                                                     const cPerBag = Number(targetLot.conesPerBag ?? 0);
                                                                                     const cWeight = Number(targetLot.conesWeight ?? 0);
                                                                                     const conesNum = typeof cones === 'number' ? cones : 0;
                                                                                     const reqBags = cPerBag > 0 && conesNum > 0 ? Number((conesNum / cPerBag).toFixed(3)) : 0;
                                                                                     const computedQty = Number((conesNum * cWeight).toFixed(3));
                                                                                     updated[index] = {
                                                                                         ...targetLot,
                                                                                         issuingCones: cones,
                                                                                         noOfBags: reqBags,
                                                                                         issuedBags: reqBags,
                                                                                         issueQty: computedQty,
                                                                                         issuedQty: computedQty
                                                                                     };
                                                                                     return updated;
                                                                                 });
                                                                                setIsDraftSaved(false);
                                                                            }}
                                                                            disabled={!isEditing}
                                                                            className={`w-full text-right ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                        />
                                                                    </td>
                                                                    <td className="border p-2 text-right">
                                                                        <Input
                                                                            type="number"
                                                                            inputMode="numeric"
                                                                            min="0"
                                                                            placeholder="Bags"
                                                                            value={noOfBagsVal}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                const bagsNum = val === '' ? 0 : Number(val);
                                                                                setSelectedLots((prev) => {
                                                                                    const updated = [...prev];
                                                                                    if (!updated[index]) return prev;
                                                                                    updated[index] = {
                                                                                        ...updated[index],
                                                                                        noOfBags: bagsNum,
                                                                                        issuedBags: bagsNum
                                                                                    };
                                                                                    return updated;
                                                                                });
                                                                                setIsDraftSaved(false);
                                                                            }}
                                                                            disabled={!isEditing}
                                                                            className={`w-full text-right ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                        />
                                                                    </td>
                                                                    <td className="border p-2 text-right">
                                                                        <Input
                                                                            type="number"
                                                                            step="0.001"
                                                                            placeholder="0.000"
                                                                            value={issueQtyVal}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                const qtyNum = val === '' ? 0 : Number(val);
                                                                                setSelectedLots((prev) => {
                                                                                    const updated = [...prev];
                                                                                    if (!updated[index]) return prev;
                                                                                    updated[index] = {
                                                                                        ...updated[index],
                                                                                        issueQty: qtyNum,
                                                                                        issuedQty: qtyNum
                                                                                    };
                                                                                    return updated;
                                                                                });
                                                                                setIsDraftSaved(false);
                                                                            }}
                                                                            disabled={!isEditing}
                                                                            className={`w-full text-right ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                        />
                                                                    </td>
                                                                    <td className="border p-2">{lot.lotNumber}</td>
                                                                    <td className="border p-2 text-center">
                                                                        <div className="flex gap-2 justify-center">
                                                                            {isDraftSaved && editingRowIndex !== index && (
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    onClick={() => handleEditRow(index)}
                                                                                    className="bg-primary hover:bg-primary"
                                                                                >
                                                                                    <Edit size={14} />
                                                                                </Button>
                                                                            )}
                                                                            {isDraftSaved && editingRowIndex === index && (
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    onClick={() => handleSaveRow(index)}
                                                                                    className="bg-primary hover:bg-primary"
                                                                                >
                                                                                    <Check size={14} />
                                                                                </Button>
                                                                            )}
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                onClick={() => handleDeleteLot(index)}
                                                                                className="bg-red-600 hover:bg-red-700"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                             );
                                                         })
                                                     )}
                                                     {selectedLots.length > 0 && (
                                                         <tr className="bg-gray-50 font-bold">
                                                             <td colSpan={17} className="border p-2 text-right">Total Net Weight:</td>
                                                             <td className="border p-2 text-right text-blue-600">{totalNetWt.toFixed(3)}</td>
                                                             <td colSpan={2} className="border p-2"></td>
                                                         </tr>
                                                     )}
                                                 </tbody>
                                             </table>
                                         </div>
                                     </div>
                                 </CardContent>
                             </Card>

                            {/* Lot Selection Dialog */}
                            <Dialog open={showLotDialog} onOpenChange={setShowLotDialog}>
                                <DialogContent className="max-w-[96vw] w-[95vw] xl:max-w-[95vw] max-h-[90vh] overflow-y-auto p-6">
                                    <DialogHeader>
                                        <DialogTitle>Select Stock Lots to Issue</DialogTitle>
                                    </DialogHeader>
                                    <div className="p-4 w-full overflow-x-auto">
                                        <PopupDataTable
                                            columns={lotColumns}
                                            data={availableLots}
                                        />
                                        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowLotDialog(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddSelectedLots}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                Add Selected Lots
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Beam Details Section */}
                            <Card className="mt-6 border-t-4 border-blue-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                        <ShoppingCart size={20} /> Beam Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700">No of Beams</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={numberOfBeams}
                                        onChange={(e) => setNumberOfBeams(e.target.value)}
                                        className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                                    />
                                </div>
                                <Button
                                    onClick={handleAddBeams}
                                    className="bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center mt-5"
                                >
                                    <Plus size={18} className="mr-2" /> Generate Beams
                                </Button>
                            </div>

                            {beamInputs.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardList size={20} /> Add Beam Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <table className="w-full border-collapse border border-gray-300 text-center">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border p-2">Sl.No</th>
                                                    <th className="border p-2">Beam Type</th>
                                                    <th className="border p-2">Sort No/Construction</th>
                                                    <th className="border p-2">Weaving Contract No</th>
                                                    <th className="border p-2">Weaver</th>
                                                    <th className="border p-2">Sales Order No</th>
                                                    <th className="border p-2">Fabric Panel/Width</th>
                                                    <th className="border p-2">Warp Meters</th>
                                                    <th className="border p-2">Shrinkage %</th>
                                                    <th className="border p-2">Expected Fabric Meter</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {beamInputs.map((beam: SizingBeamDetails, index: number) => {
                                                    const contractSalesOrders = getSalesOrdersForContract(beam.weavingContractId);
                                                    const fallbackSalesOrderNeeded = !!(
                                                        beam.salesOrderId &&
                                                        !contractSalesOrders.some(
                                                            (so: any) =>
                                                                String(so?.id ?? so?.salesOrderNo ?? so?.orderNo ?? "") ===
                                                                String(beam.salesOrderId)
                                                        )
                                                    );
                                                    return (
                                                        <tr key={index} className="border">
                                                            <td className="border p-2">{index + 1}</td>
                                                            <td className="border p-2">
                                                                <CommonSearchableSelect
                                                                    value={beam.beamTypeId || ""}
                                                                    onValueChange={(val) => handleBeamInputChange(index, 'beamTypeId', val)}
                                                                    options={beamTypeOptions.map((sc: any) => ({
                                                                        value: String(sc.id),
                                                                        label: sc.subCategoryName || sc.name || ""
                                                                    }))}
                                                                    placeholder="Select"
                                                                    className="mt-1"
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <CommonSearchableSelect
                                                                    value={beam.fabricId || ""}
                                                                    onValueChange={(val) => handleBeamInputChange(index, 'fabricId', val)}
                                                                    options={uniqueQualities.map((u: any) => ({
                                                                        value: String(u.fabricId || ""),
                                                                        label: `${u.fabricCode} / ${u.quality}`
                                                                    }))}
                                                                    placeholder="Select"
                                                                    className="mt-1"
                                                                    // disabled={isPlanMapped}
                                                                />
                                                            </td>
                                                            {/* In the JSX where the weaving contract dropdown is rendered */}
                                                            {/* In the JSX where the weaving contract dropdown is rendered */}
                                                            <td className="border p-2">
                                                                <CommonSearchableSelect
                                                                    value={beam.weavingContractId}
                                                                    onValueChange={(val) => handleBeamInputChange(index, 'weavingContractId', val)}
                                                                    disabled={!beam.fabricId}
                                                                    placeholder={!beam.fabricId ? "Select Fabric first" : "Select"}
                                                                    options={normalizedWeavingContracts
                                                                        .filter((wc: WeavingContract) => {
                                                                            const fabricMatch = wc.items?.some((it: any) => it.fabricCodeId === parseInt(String(beam.fabricId)));
                                                                            if (!fabricMatch) return false;
                                                                            const wcCompanyId = (wc as any)?.companyId;
                                                                            return wcCompanyId === resolvedCompanyId;
                                                                        })
                                                                        .map((wc: WeavingContract) => ({
                                                                            value: String(wc.id),
                                                                            label: wc.weavingContractNo
                                                                        }))}
                                                                    className="mt-1"
                                                                />
                                                            </td>
                                                            {/* <td className="border p-2">
                                                                <select
                                                                    value={beam.weavingContractId}
                                                                    onChange={(e) => handleBeamInputChange(index, 'weavingContractId', e.target.value)}
                                                                    className="input mt-1 w-full"
                                                                    disabled={!beam.fabricId}
                                                                >
                                                                    {!beam.fabricId ? (
                                                                        <option value="">Select Fabric first</option>
                                                                    ) : (
                                                                        <>
                                                                            <option value="">Select</option>
                                                                            {(() => {
                                                                                const currentOrderType = parseInt(orderTypeId || "0");
                                                                                let filteredContracts = weavingContractList
                                                                                    .filter((wc: WeavingContract) =>
                                                                                        wc.items?.some((it: any) => it.fabricCodeId === parseInt(String(beam.fabricId)))
                                                                                    );

                                                                                // Apply order type based filtering
                                                                                if (currentOrderType === 2) { // External
                                                                                    filteredContracts = filteredContracts.filter((wc: WeavingContract) => {
                                                                                        const wcCompanyId = (wc as any)?.companyId;
                                                                                        return wcCompanyId === resolvedCompanyId;
                                                                                    });
                                                                                }
                                                                                // For Internal (orderTypeId === 1), show all filtered contracts

                                                                                return filteredContracts.map((wc: WeavingContract) => (
                                                                                    <option key={wc.id} value={wc.id}>{wc.weavingContractNo}</option>
                                                                                ));
                                                                            })()}
                                                                        </>
                                                                    )}
                                                                </select>
                                                            </td> */}
                                                            <td className="border p-2">
                                                                <CommonSearchableSelect
                                                                    value={beam.weavingVendorId}
                                                                    onValueChange={(val) => handleBeamInputChange(index, 'weavingVendorId', val)}
                                                                    options={weaverVendorList.map((v: any) => ({
                                                                        value: String(v.id),
                                                                        label: v.vendorName
                                                                    }))}
                                                                    placeholder="Select"
                                                                    className="mt-1"
                                                                    // disabled={isPlanMapped}
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <CommonSearchableSelect
                                                                    value={beam.salesOrderId || ""}
                                                                    onValueChange={(val) => handleBeamInputChange(index, 'salesOrderId', val)}
                                                                    disabled={!beam.weavingContractId}
                                                                    placeholder={!beam.weavingContractId ? "Select Weaving Contract first" : "Select"}
                                                                    options={[
                                                                        ...contractSalesOrders.map((so: any) => {
                                                                            const val = so?.id ?? so?.salesOrderNo ?? so?.orderNo;
                                                                            return {
                                                                                value: String(val || ""),
                                                                                label: resolveSalesOrderLabel(val) || String(val || "")
                                                                            };
                                                                        }).filter(opt => opt.value !== "" && opt.label !== ""),
                                                                        ...(fallbackSalesOrderNeeded && resolveSalesOrderLabel(beam.salesOrderId) ? [{
                                                                            value: String(beam.salesOrderId),
                                                                            label: resolveSalesOrderLabel(beam.salesOrderId)
                                                                        }] : [])
                                                                    ]}
                                                                    className="mt-1"
                                                                />
                                                            </td>

                                                            <td className="border p-2">
                                                                <input
                                                                    value={beam.fabricPanelWidth || planFabricPanelWidth}
                                                                    className="input mt-1 w-full bg-gray-50"
                                                                    readOnly
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={beam.warpMeters}
                                                                    onChange={(e) => handleBeamInputChange(index, 'warpMeters', e.target.value)}
                                                                    className="input mt-1 w-full"
                                                                    placeholder="Enter"
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={beam.shrinkage}
                                                                    onChange={(e) => handleBeamInputChange(index, 'shrinkage', e.target.value)}
                                                                    className="input mt-1 w-full"
                                                                    placeholder="Enter"
                                                                />
                                                            </td>
                                                            <td className="border p-2">
                                                                <input
                                                                    value={beam.expectedFabricMeter != null && !isNaN(Number(beam.expectedFabricMeter))
                                                                         ? Number(beam.expectedFabricMeter).toFixed(2)
                                                                         : beam.expectedFabricMeter || ""}
                                                                    className="input mt-1 w-full bg-gray-50"
                                                                    readOnly
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        <Button
                                            onClick={addBeamItems}
                                            className="mt-4 ml-auto flex items-center"
                                            disabled={beamInputs.length === 0}
                                        >
                                            <Plus size={18} className="mr-2" />
                                            Add Beam Items
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {beamItems.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ClipboardList size={20} /> Beam Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <table className="w-full border-collapse border border-gray-300 text-center">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border p-2">Sl.No</th>
                                                    <th className="border p-2">Beam Type</th>
                                                    <th className="border p-2">Sort No/Construction</th>
                                                    <th className="border p-2">Weaving Contract No</th>
                                                    <th className="border p-2">Weaver Name</th>
                                                    <th className="border p-2">Sales Order No</th>

                                                    <th className="border p-2">Warp Meters</th>
                                                    <th className="border p-2">Shrinkage %</th>
                                                    <th className="border p-2">Fabric Panel/Width</th>
                                                    <th className="border p-2">Expected Fabric Meter</th>
                                                    <th className="border p-2">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {beamItems.map((item: SizingBeamDetails, index: number) => (
                                                    <tr key={index} className="border">
                                                        <td className="border p-2">{index + 1}</td>
                                                        <td className="border p-2">
                                                            {beamTypeOptions.find((sc: any) => String(sc.id) === String(item.beamTypeId))?.subCategoryName || item.beamTypeId || "-"}
                                                        </td>
                                                        <td className="border p-2">
                                                            {(() => {
                                                                const u = uniqueQualities.find((u: any) => String(u.fabricId || "") === String(item.fabricId || ""));
                                                                return u ? `${u.fabricCode} / ${u.quality}` : "";
                                                            })()}
                                                        </td>
                                                        <td className="border p-2">
                                                            {weavingContractList?.find((wc: WeavingContract) => wc.id === parseInt(item.weavingContractId))?.weavingContractNo || item.weavingContractId}
                                                        </td>
                                                        <td className="border p-2">
                                                            {(() => {
                                                                const id = item.weavingVendorId ? parseInt(item.weavingVendorId) : (weavingContractList?.find((wc: WeavingContract) => wc.id === parseInt(item.weavingContractId))?.vendorId);
                                                                return vendorList?.find((v: any) => v.id === id)?.vendorName || item.weavingVendorId || "";
                                                            })()}
                                                        </td>
                                                        <td className="border p-2">
                                                            {resolveSalesOrderLabel(item.salesOrderId)}
                                                        </td>

                                                        <td className="border p-2">
                                                             {item.warpMeters != null && !isNaN(Number(item.warpMeters))
                                                                 ? Number(item.warpMeters).toFixed(2)
                                                                 : item.warpMeters}
                                                         </td>
                                                         <td className="border p-2">{item.shrinkage}%</td>
                                                         <td className="border p-2">{item.fabricPanelWidth || planFabricPanelWidth}</td>
                                                         <td className="border p-2">
                                                             {item.expectedFabricMeter != null && !isNaN(Number(item.expectedFabricMeter))
                                                                 ? Number(item.expectedFabricMeter).toFixed(2)
                                                                 : item.expectedFabricMeter}
                                                         </td>
                                                        <td className="border p-2">
                                                            <button
                                                                onClick={() => editBeamItem(index)}
                                                                className="mr-2 text-blue-500"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteBeamItem(index)}
                                                                className="text-red-500"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            )}
                                </CardContent>
                            </Card>
                </div>
                <div className="flex justify-end mt-4">
                 <Button
                        onClick={handleSaveClick}
                        disabled={isSaveDisabled}
                        // className={saveButtonClassName}
                        aria-disabled={isSaveDisabled}
                        className="text-white"
                    >
                        <Save size={18} className="mr-2" />
                        {sizingPlanDtl?.id ? "Update Sizing Plan" : "Save Sizing Plan"}
                    </Button>
                    </div>
                <div>

                    {isPlanMapped && (
                        <div className="mt-4 flex gap-3.5 items-center bg-orange-50 border border-orange-300 rounded-xl px-4 py-3.5">
                            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C05621" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[13px] font-medium text-orange-900 m-0 mb-0.5">Record is linked to other modules</p>
                                <p className="text-xs text-orange-700 m-0 mb-1.5">The fields below are locked and cannot be modified.</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {["Order Type", "Sizing Vendor", "Sort No/Construction", "Actual Yarn", "Weaving Contract No", "Weaver", "Sales Order No"].map(f => (
                                        <span key={f} className="text-[11px] font-medium bg-orange-200 text-orange-900 rounded-full px-2.5 py-0.5">{f}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* <p>{isWeavingContractMapped ? "This weaving contract is mapped and cannot be modified." : ""}</p> */}
                </div>
            </div>
        </div>
    );
};

export default SizingPlanEntry;
