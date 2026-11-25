// import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
// import { FileText, ShoppingCart, ClipboardList, Plus, Edit, Trash2, Save, ArrowLeft, X, Image as ImageIcon } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useForm } from "react-hook-form";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/state/store";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import { getAllVendors } from "@/state/vendorSlice";
// import { getAllWeavingContract } from "@/state/weavingContractSlice";
// import { getAllSalesOrders } from "@/state/salesOrderSlice";
// import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
// import { getAllTermsConditions } from "@/state/termsConditions";
// import { getAllEmptyBeamIssue } from "@/state/emptyBeamIssueSlice";
// import { getAllCompanies } from "@/state/company-master-slice";
// import { getAllFlanges } from "@/state/flangeSlice";
// import { createSizingPlan, getAllSizingPlan, updateSizingPlan } from "@/state/sizingPlanSlice";
// import { createBeamInward, updateBeamInward, getAllBeamInwardById } from "@/state/beamInwardSlice";
// import { getAllYarnMasters } from "@/state/yarnSlice";
// import { getAllFabricMasters } from "@/state/fabricMasterSlice";
// import apiService from "@/services/ApiService";
// import documentNumberService from "@/services/DocumentNumberService";
// import mediaService, { MediaDetailResponse } from "@/services/MediaUploadService";
// import { toast } from "react-toastify";
// import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
// import { useResolvedCompanyId } from "@/hooks/useCompanyContext";

// interface BeamInwardFormData {
//     id?: number;
//     beamInwardDate: string;
//     sizingVendorId: string;
//     sizingPlanId: string;
//     orderTypeId: string;
//     termsConditionsId: string;
//     paymentTermsId: string;
//     sizingRate: string;
//     emptyBeamNo: string;
//     remarks: string;
//     beamInwardNo: string;
//     dcNumber: string;
//     dcDate: string;
//     beamInwardQualityDetails: BeamInwardQualityDetails[];
//     beamInwardBeamDetails: BeamInwardBeamDetails[];
//     invoiceDetails?: InvoiceDetail[];
// }

// interface InvoiceDetail {
//     invNo: string;
//     invDate: string;
//     sizingCost: number;
//     gstAmount: number;
//     netTotal: number;
//     mediaDetailSno?: number;
//     mediaSno?: number;
//     invoiceUpload?: string;
// }


// interface BeamInwardQualityDetails {
//     quality: string;
//     yarnId: string;
//     sordEnds: string;
//     actualEnds: string;
//     parts: string;
//     endsPerPart: string;
//     wrapMeters: string;
//     fabricCode?: string;
//     fabricId?: string;
//     actualYarn?: string;
//     warpEnds?: string;
//     actualWarpEnds?: string;
//     fabricPanelWidth?: string;
//     totalEnds?: string;
//     totalEndsBase?: string;
// }

// interface BeamInwardBeamDetails {
//     fabricId?: string;
//     weavingContractId: string;
//     weavingVendorId: string;
//     salesOrderId: string;
//     sizedBeamNo: string;
//     flangeId?: string;
//     flangeNo?: string;
//     wrapMeters: string;
//     shrinkage: string;
//     expectedFabricMeter: string;
//     isBeamOutwarded: string;
//     isReturn?: string;
//     sizingPlanId?: string;
//     fabricPanelWidth?: string;
//     totalEnds?: string;
//     _tempId?: number; // Add this for temporary tracking

// }

// const safeNumber = (value: any) => {
//     if (value == null || value === "") return null;
//     const numeric = Number(value);
//     return Number.isFinite(numeric) ? numeric : null;
// };

// const computeQualityTotalEnds = (baseValue?: string, widthValue?: string) => {
//     const base = safeNumber(baseValue);
//     if (base == null) return "";
//     const width = safeNumber(widthValue);
//     if (width == null) {
//         return String(base);
//     }
//     const total = base * width;
//     return Number.isFinite(total) ? String(total) : "";
// };

// const resolveQualityBaseTotalEnds = (detail: any) => {
//     const candidates = [
//         detail?.totalEndsBase,
//         detail?.totalEndsPerUnit,
//         detail?.totalEnds,
//         detail?.warpEnds,
//         detail?.actualWarpEnds,
//         detail?.sordEnds,
//         detail?.actualEnds,
//         detail?.endsPerPart,
//     ];
//     for (const candidate of candidates) {
//         if (candidate != null && String(candidate).trim() !== "") {
//             return String(candidate);
//         }
//     }
//     const width = safeNumber(detail?.fabricPanelWidth);
//     const total = safeNumber(detail?.totalEnds);
//     if (width && total) {
//         const derived = total / width;
//         return Number.isFinite(derived) ? String(derived) : "";
//     }
//     return "";
// };

// const mapQualityDetail = (detail: any): BeamInwardQualityDetails => {
//     const fabricPanelWidth = detail?.fabricPanelWidth != null ? String(detail.fabricPanelWidth) : "";
//     const totalEndsBase = resolveQualityBaseTotalEnds(detail);
//     const computedTotalEnds = totalEndsBase
//         ? computeQualityTotalEnds(totalEndsBase, fabricPanelWidth)
//         : detail?.totalEnds != null
//             ? String(detail.totalEnds)
//             : "";
//     const fabricIdValue = detail?.fabricId != null ? String(detail.fabricId) : detail?.fabricCodeId != null ? String(detail.fabricCodeId) : "";
//     const fabricCodeValue = detail?.fabricCode != null ? String(detail.fabricCode) : (detail?.fabricCodeId != null ? String(detail.fabricCodeId) : "");
//     return {
//         quality: detail?.quality ?? "",
//         yarnId: detail?.yarnId != null ? String(detail.yarnId) : "",
//         sordEnds: String(detail?.sordEnds ?? ""),
//         actualEnds: String(detail?.actualEnds ?? ""),
//         parts: String(detail?.parts ?? ""),
//         endsPerPart: String(detail?.endsPerPart ?? ""),
//         wrapMeters: String(detail?.wrapMeters ?? detail?.warpMeters ?? ""),
//         fabricCode: fabricCodeValue,
//         fabricId: fabricIdValue,
//         actualYarn: detail?.actualYarn != null ? String(detail.actualYarn) : "",
//         warpEnds: detail?.warpEnds != null ? String(detail.warpEnds) : "",
//         actualWarpEnds: detail?.actualWarpEnds != null ? String(detail.actualWarpEnds) : "",
//         fabricPanelWidth,
//         totalEndsBase,
//         totalEnds: computedTotalEnds,
//     };
// };

// const deriveQualityRowBase = (row: BeamInwardQualityDetails) => {
//     if (row.totalEndsBase && row.totalEndsBase.trim() !== "") {
//         return row.totalEndsBase;
//     }
//     const totalNumeric = safeNumber(row.totalEnds);
//     const widthNumeric = safeNumber(row.fabricPanelWidth);
//     if (totalNumeric != null && widthNumeric != null && widthNumeric > 0) {
//         const derived = totalNumeric / widthNumeric;
//         return Number.isFinite(derived) ? String(derived) : "";
//     }
//     const fallbacks = [row.warpEnds, row.actualWarpEnds, row.sordEnds, row.actualEnds, row.endsPerPart];
//     for (const candidate of fallbacks) {
//         if (candidate && String(candidate).trim() !== "") {
//             return String(candidate);
//         }
//     }
//     return "";
// };

// const deriveDetailTotalEnds = (detail: any) => {
//     if (!detail) {
//         return "";
//     }
//     const fabricPanelWidth = detail?.fabricPanelWidth != null ? String(detail.fabricPanelWidth) : "";
//     const totalEndsBase = resolveQualityBaseTotalEnds(detail);
//     if (totalEndsBase) {
//         return computeQualityTotalEnds(totalEndsBase, fabricPanelWidth);
//     }
//     if (detail?.totalEnds != null && String(detail.totalEnds).trim() !== "") {
//         return String(detail.totalEnds);
//     }
//     return "";
// };

// const BeamInwardEntry = () => {
//     const [items, setItems] = useState<BeamInwardQualityDetails[]>([]);
//     const [beamItems, setBeamItems] = useState<BeamInwardBeamDetails[]>([]);
//     const [isEditingBeam, setIsEditingBeam] = useState(false);
//     const [editingBeamIndex, setEditingBeamIndex] = useState<number | null>(null);
//     const [newItem, setNewItem] = useState<BeamInwardQualityDetails>({
//         quality: "",
//         yarnId: "",
//         sordEnds: "",
//         actualEnds: "",
//         parts: "",
//         endsPerPart: "",
//         wrapMeters: "",
//         fabricPanelWidth: "",
//         totalEnds: "",
//         totalEndsBase: "",
//     });

//     const [newBeamItem, setNewBeamItem] = useState<BeamInwardBeamDetails>({
//         fabricId: "",
//         weavingContractId: "",
//         weavingVendorId: "",
//         salesOrderId: "",
//         sizedBeamNo: "",
//         flangeId: "",
//         flangeNo: "",
//         wrapMeters: "",
//         shrinkage: "",
//         expectedFabricMeter: "",
//         isBeamOutwarded: "0",
//         sizingPlanId: "",
//         fabricPanelWidth: "",
//         totalEnds: "",
//     });

//     const [editingIndex, setEditingIndex] = useState<number | null>(null);
//     const [beamEditingIndex, setBeamEditingIndex] = useState<number | null>(null);
//     const [showAddBeamForm, setShowAddBeamForm] = useState(false);
//     const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([]);
//     const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
//     const [existingMedia, setExistingMedia] = useState<MediaDetailResponse | null>(null);
//     const [isExtracting, setIsExtracting] = useState(false);
//     const selectedCompanyId = useResolvedCompanyId();

//     const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan);
//     const { vendorList } = useSelector((state: RootState) => state.vendor);
//     const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
//     const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
//     const { yarnList } = useSelector((state: RootState) => state.yarn);
//     const { flangeList } = useSelector((state: RootState) => state.flange as any);

//     const activeSizingPlanList = useMemo(() => (sizingPlanList || []).filter((sp: any) => sp.isActive !== false && sp.activeFlag !== false), [sizingPlanList]);
//     const activeVendorList = useMemo(() => (vendorList || []).filter((v: any) => v.isActive !== false && v.activeFlag !== false), [vendorList]);
//     const activeWeavingContractList = useMemo(() => (weavingContractList || []).filter((wc: any) => wc.isActive !== false && wc.activeFlag !== false), [weavingContractList]);
//     const activeSalesOrderList = useMemo(() => (salesOrderList || []).filter((so: any) => so.isActive !== false && so.activeFlag !== false), [salesOrderList]);
//     const activeYarnList = useMemo(() => (yarnList || []).filter((y: any) => y.isActive !== false && y.activeFlag !== false), [yarnList]);
//     const activeFlangeList = useMemo(() => {
//         const raw: any = flangeList;
//         let list = [];
//         if (Array.isArray(raw)) list = raw;
//         else if (Array.isArray(raw?.data)) list = raw.data;
//         return list.filter((f: any) => f.isActive !== false && f.activeFlag !== false);
//     }, [flangeList]);


//     const yarnNameMap = useMemo(() => {
//         if (!Array.isArray(yarnList)) return {} as Record<string, string>;
//         return yarnList.reduce((acc: Record<string, string>, yarn: any) => {
//             if (yarn?.id) {
//                 acc[String(yarn.id)] = yarn.yarnName || yarn.name || yarn.label || acc[String(yarn.id)] || "";
//             }
//             return acc;
//         }, {});
//     }, [yarnList]);
//     const normalizedFlangeList = useMemo(() => {
//         const raw: any = flangeList;
//         if (Array.isArray(raw)) return raw;
//         if (Array.isArray(raw?.data)) return raw.data;
//         return [];
//     }, [flangeList]);
//     const flangeOptions = useMemo(() => {
//         const map = new Map<string, { id: string; flangeNo: string } & Record<string, any>>();
//         normalizedFlangeList.forEach((fl: { id: string; flangeNo: string; } & Record<string, any>) => {
//             const idValue = fl?.id ?? fl?.flangeId ?? fl?.flangeNo;
//             if (idValue == null) return;
//             const key = String(idValue);
//             if (!key) return;
//             if (!map.has(key)) {
//                 map.set(key, { ...fl, id: key, flangeNo: String(fl?.flangeNo ?? fl?.flangeNumber ?? "") });
//             }
//         });

//         // ONLY include flanges from beamItems if they have a flangeId AND it's not already in normalizedFlangeList
//         // to avoid polluting the dropdown with transient or duplicate values.
//         // Actually, if we want to allow selecting what's ALREADY there (for the current row), it's tricky.
//         // But the dropdown should generally show AVAILABLE flanges.
//         beamItems.forEach((beam) => {
//             if (beam.flangeId && !map.has(String(beam.flangeId))) {
//                 map.set(String(beam.flangeId), { id: String(beam.flangeId), flangeNo: beam.flangeNo || "" });
//             }
//         });
//         return Array.from(map.values());
//     }, [normalizedFlangeList, beamItems]);

//     const resolveFlangeDisplayName = useCallback((flangeId?: string, flangeNo?: string) => {
//         const directFlangeNo = flangeNo?.toString().trim();
//         if (directFlangeNo) return directFlangeNo;
//         const idValue = flangeId ? String(flangeId).trim() : "";
//         if (!idValue) return "";
//         const match = normalizedFlangeList.find((fl: any) => String(fl.id) === idValue);
//         return match?.flangeNo || idValue;
//     }, [normalizedFlangeList]);

//     const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
//     const { companyMasterList, loading: companyLoading } = useSelector((state: RootState) => state.companyMaster as any);
//     const normalizedCompanies = useMemo(() => {
//         const raw: any = companyMasterList;
//         if (Array.isArray(raw)) return raw;
//         if (Array.isArray(raw?.data)) return raw.data;
//         return [];
//     }, [companyMasterList]);
//     const activeFabricMasterList = useMemo(() => (fabricMasterList || []).filter((f: any) => f.isActive !== false && f.activeFlag !== false), [fabricMasterList]);

//     const weaverVendorList = useMemo(() => {
//         return activeVendorList.filter((v: any) => {
//             const typeId = String(v.vendorTypeId || "");
//             const typeIds = typeId.split(",").map((t: string) => Number(t.trim()));
//             return typeIds.includes(303) || typeIds.includes(307);
//         });
//     }, [activeVendorList]);

//     const getCompanyIdForVendor = useCallback((vendorId?: string | number) => {
//         if (!vendorId) return "";
//         const vendor = (vendorList || []).find((v: any) => String(v.id) === String(vendorId));
//         const vendorName = (vendor?.vendorName || vendor?.name || "").toString().trim().toLowerCase();
//         if (!vendorName) return "";
//         const match = normalizedCompanies.find((company: any) => {
//             const companyNames = [company?.companyName, company?.name].filter(Boolean).map((value: any) => String(value).trim().toLowerCase());
//             return companyNames.some((name: string) => name === vendorName);
//         });
//         if (!match) return "";
//         return String(match.id ?? match.companyId ?? "");
//     }, [vendorList, normalizedCompanies]);
//     const weaverCompanyId = useMemo(() => getCompanyIdForVendor(newBeamItem.weavingVendorId), [getCompanyIdForVendor, newBeamItem.weavingVendorId]);
//     const [numberOfLots, setNumberOfLots] = useState<string>('0');
//     const [selectedOrderType, setSelectedOrderType] = useState<string>("2");
//     const isInternalOrder = selectedOrderType === "1";
//     const isExternalOrder = selectedOrderType === "2";

//     const dispatch = useDispatch<AppDispatch>();
//     const { id } = useParams();
//     const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BeamInwardFormData>();
//     const location = useLocation();
//     const [fetchedBeamInwardDtl, setFetchedBeamInwardDtl] = useState<any>(null);
//     const beamInwardDtl = location.state?.beamInwardDtl || fetchedBeamInwardDtl;
//     const navigate = useNavigate();
//     const isAddMode = !id;
//     const [activeTab, setActiveTab] = useState("vendorDetails");
//     const [selectedSizingPlan, setSelectedSizingPlan] = useState<any>(null);
//     const [companyId, setCompanyId] = useState<number | null>(null);
//     const [companyName, setCompanyName] = useState<string>("");
//     const [externalFlangeCache, setExternalFlangeCache] = useState<Record<string, any[]>>({});
//     const [externalFlangeLoadingMap, setExternalFlangeLoadingMap] = useState<Record<string, boolean>>({});
//     const prevWeaverCompanyIdRef = useRef<string>({} as string);
//     const [tempBeamItems, setTempBeamItems] = useState<any[]>([]);


//     const getExternalFlangeOptionsForCompany = useCallback((companyId?: string) => {
//         const key = String(companyId || "");
//         if (!key) return [];
//         const cached = externalFlangeCache[key];
//         return Array.isArray(cached) ? cached : [];
//     }, [externalFlangeCache]);
//     const externalFlangeOptions = useMemo(() => {
//         const baseOptions = getExternalFlangeOptionsForCompany(weaverCompanyId);

//         // Additional condition: if Order Type is "External" (2), include flanges from activeFlangeList
//         // where issuedToInternal is false.
//         const weavingVendor = activeVendorList.find((v: any) => String(v.id) === String(newBeamItem.weavingVendorId));
//         const isWeaverExternal = weavingVendor && Number(weavingVendor.isInternalVendor) === 0;

//         const extraOptions: any[] = [];
//         if (isExternalOrder && isWeaverExternal) {
//             activeFlangeList.forEach((fl: any) => {
//                 // Adjust property names based on your flange object structure
//                 // Assuming isIssued == 1 and issuedToInternal === false (or similar)
//                 if (fl.issuedToInternal === false && fl.isIssued == 1) {
//                     const idValue = fl.id ?? fl.flangeId;
//                     if (idValue && !baseOptions.some((bo: any) => String(bo.id) === String(idValue))) {
//                         extraOptions.push({
//                             ...fl,
//                             id: String(idValue),
//                             flangeNo: String(fl.flangeNo || fl.flangeNumber || "")
//                         });
//                     }
//                 }
//             });
//         }

//         const mergedOptions = [...baseOptions, ...extraOptions];

//         if (!newBeamItem.flangeId) {
//             return mergedOptions;
//         }
//         const exists = mergedOptions.some((fl: any) => String(fl.id) === String(newBeamItem.flangeId));
//         if (exists) {
//             return mergedOptions;
//         }
//         return [
//             ...mergedOptions,
//             { id: newBeamItem.flangeId, flangeNo: newBeamItem.flangeNo || "" },
//         ];
//     }, [getExternalFlangeOptionsForCompany, newBeamItem.flangeId, newBeamItem.flangeNo, weaverCompanyId, isExternalOrder, activeFlangeList, activeVendorList, newBeamItem.weavingVendorId]);
//     const externalFlangeLoading = weaverCompanyId ? Boolean(externalFlangeLoadingMap[weaverCompanyId]) : false;
//     const fetchExternalFlangesForCompany = useCallback(async (companyId: string) => {
//         if (!companyId) return;
//         const companyIdNumber = Number(companyId);
//         if (!Number.isFinite(companyIdNumber) || companyIdNumber <= 0) {
//             setExternalFlangeCache(prev => ({ ...prev, [companyId]: [] }));
//             setExternalFlangeLoadingMap(prev => ({ ...prev, [companyId]: false }));
//             return;
//         }
//         setExternalFlangeLoadingMap(prev => ({ ...prev, [companyId]: true }));
//         try {
//             const response = await apiService.get(`/flange/company/${companyIdNumber}?limit=10000&offset=0`);
//             const fetched = Array.isArray(response?.data?.data)
//                 ? response.data.data
//                 : Array.isArray(response?.data)
//                     ? response.data
//                     : [];
//             const filtered = fetched.filter((fl: any) => fl?.isIssued == 1);
//             setExternalFlangeCache(prev => ({ ...prev, [companyId]: filtered }));
//         } catch (error) {
//             setExternalFlangeCache(prev => ({ ...prev, [companyId]: [] }));
//         } finally {
//             setExternalFlangeLoadingMap(prev => ({ ...prev, [companyId]: false }));
//         }
//     }, [setExternalFlangeCache, setExternalFlangeLoadingMap]);

//     useEffect(() => {
//         dispatch(getAllVendors({ fetchAll: true }));
//         const weavingContractParams = selectedCompanyId ? { companyId: selectedCompanyId, fetchAll: true } : { fetchAll: true };
//         dispatch(getAllWeavingContract(weavingContractParams));
//         const salesOrderParams = selectedCompanyId ? { companyId: selectedCompanyId, fetchAll: true } : { fetchAll: true };
//         dispatch(getAllSalesOrders(salesOrderParams));
//         dispatch(getAllPaymentTerms({ fetchAll: true }));
//         dispatch(getAllTermsConditions({ fetchAll: true }));
//         dispatch(getAllEmptyBeamIssue({ fetchAll: true }));
//         dispatch(getAllYarnMasters({ fetchAll: true }));
//         dispatch(getAllFabricMasters({ fetchAll: true }));
//         if (selectedCompanyId) {
//             dispatch(getAllFlanges({ companyId: selectedCompanyId, fetchAll: true }));
//         }
//     }, [dispatch, selectedCompanyId]);

//     const isSavingRef = useRef(false);
//     const hasGeneratedNumberRef = useRef(false);
//     const invInputRef = useRef<HTMLInputElement>(null);

//     const handleInvoiceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (!file) return;
//         setInvoiceFile(file);
//         setIsExtracting(true);
//         try {
//             // Upload to media service first
//             const base64File = await mediaService.fileToBase64(file);
//             const mediaType = mediaService.getMediaType(file);

//             const mediaResponse = await mediaService.uploadMedia({
//                 base64File,
//                 fileName: file.name,
//                 contentType: file.type,
//                 mediaType,
//                 containerName: "beam_inward_invoice",
//             });
//             const mediaData = mediaResponse;
//             setExistingMedia(mediaData);

//             // Extract data using the file object
//             const extractFormData = new FormData();
//             extractFormData.append("file", file);
//             const response = await apiService.post("/invoice/extract", extractFormData, {
//                 headers: {
//                     "Content-Type": "multipart/form-data",
//                 },
//             });
//             const extracted = response;
//             const dataArray = Array.isArray(extracted) ? extracted : [extracted];

//             // Add media IDs to the extracted invoice details
//             const enrichedData = dataArray.map(inv => ({
//                 ...inv,
//                 mediaDetailSno: mediaData.mediaDetailSno,
//                 mediaSno: mediaData.mediaSno,
//                 invoiceUpload: mediaData.mediaUrl
//             }));

//             setInvoiceDetails(enrichedData);
//             toast.success("Invoice data extracted and file uploaded successfully");
//         } catch (error: any) {
//             console.error("Invoice processing failed:", error);
//             toast.error(error?.response?.data?.message || "Failed to process invoice");
//         } finally {
//             setIsExtracting(false);
//         }
//     };

//     useEffect(() => {
//         if (selectedOrderType === "2") {
//             if (selectedCompanyId) {
//                 dispatch(getAllSizingPlan({ companyId: selectedCompanyId, fetchAll: true }));
//             }
//         } else {
//             dispatch(getAllSizingPlan({ fetchAll: true }));
//         }
//     }, [dispatch, selectedOrderType, selectedCompanyId]);

//     useEffect(() => {
//         if (companyLoading) return;
//         if (normalizedCompanies.length === 0) {
//             dispatch(getAllCompanies({ fetchAll: true }));
//         }
//     }, [companyLoading, normalizedCompanies.length, dispatch]);

//     useEffect(() => {
//         try {
//             const raw = localStorage.getItem('authPayload');
//             if (raw) {
//                 const auth = JSON.parse(raw);
//                 const comp =
//                     auth?.user?.companies?.find((c: any) => c?.isCurrent) ||
//                     auth?.user?.companies?.[0] ||
//                     auth?.companies?.find((c: any) => c?.isCurrent) ||
//                     auth?.companies?.[0];
//                 if (comp) {
//                     setCompanyId(Number(comp.id));
//                     setCompanyName(String(comp.name || ""));
//                 }
//             }
//         } catch { }
//     }, []);

//     useEffect(() => {
//         if (id && !location.state?.beamInwardDtl) {
//             const fetchDtl = async () => {
//                 try {
//                     const result = await dispatch(getAllBeamInwardById({ id: Number(id), companyId: companyId || undefined })).unwrap();
//                     if (result?.data) {
//                         setFetchedBeamInwardDtl(result.data);
//                     } else if (result) {
//                         setFetchedBeamInwardDtl(result);
//                     }
//                 } catch (error) {
//                     console.error("Failed to fetch beam inward details:", error);
//                 }
//             };
//             fetchDtl();
//         }
//     }, [id, location.state?.beamInwardDtl, dispatch, companyId]);

//     useEffect(() => {
//         if (beamInwardDtl) {
//             reset({
//                 beamInwardDate: beamInwardDtl.beamInwardDate ? new Date(beamInwardDtl.beamInwardDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
//                 sizingPlanId: beamInwardDtl.sizingPlanId ? String(beamInwardDtl.sizingPlanId) : "",
//                 sizingVendorId: String(beamInwardDtl.sizingVendorId),
//                 termsConditionsId: String(beamInwardDtl.termsConditionsId),
//                 paymentTermsId: String(beamInwardDtl.paymentTermsId),
//                 sizingRate: String(beamInwardDtl.sizingRate),
//                 emptyBeamNo: beamInwardDtl.emptyBeamNo || "",
//                 remarks: beamInwardDtl.remarks || "",
//                 dcNumber: beamInwardDtl.dcNumber ? String(beamInwardDtl.dcNumber) : "",
//                 dcDate: beamInwardDtl.dcDate ? new Date(beamInwardDtl.dcDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
//             });
//             if (beamInwardDtl.sizingPlanId) {
//                 setValue("sizingPlanId", String(beamInwardDtl.sizingPlanId));
//             }
//             if (beamInwardDtl.beamInwardNo) {
//                 setValue('beamInwardNo', String(beamInwardDtl.beamInwardNo), { shouldValidate: true });
//             }
//             setTimeout(() => {
//                 if (beamInwardDtl.sizingPlanId) setValue("sizingPlanId", String(beamInwardDtl.sizingPlanId));
//                 if (beamInwardDtl.sizingVendorId) setValue("sizingVendorId", String(beamInwardDtl.sizingVendorId));
//             }, 0);

//             if (beamInwardDtl.sizingPlanId) {
//                 const plan = sizingPlanList.find((sp: any) => sp.id === Number(beamInwardDtl.sizingPlanId));
//                 if (plan) {
//                     setSelectedSizingPlan(plan);
//                     setSelectedOrderType(String(plan.orderTypeId ?? ""));
//                 }
//             }

//             if (beamInwardDtl.beamInwardQualityDetails) {
//                 setItems(beamInwardDtl.beamInwardQualityDetails.map(mapQualityDetail));
//             }

//             if (beamInwardDtl.beamInwardBeamDetails) {
//                 setBeamItems(beamInwardDtl.beamInwardBeamDetails.map((beam: any) => ({
//                     ...beam,
//                     fabricId: String(beam.fabricId ?? ""),
//                     weavingContractId: String(beam.weavingContractId),
//                     weavingVendorId: String(beam.weavingVendorId ?? beam.vendorId ?? ""),
//                     salesOrderId: String(beam.salesOrderId),
//                     sizedBeamNo: beam?.sizedBeamNo != null ? String(beam.sizedBeamNo).trim() : "",
//                     flangeId: beam?.flangeId != null ? String(beam.flangeId) : "",
//                     flangeNo: String(beam.flangeNo || ''),
//                     wrapMeters: String(beam.wrapMeters),
//                     shrinkage: String(beam.shrinkage),
//                     expectedFabricMeter: String(beam.expectedFabricMeter),
//                     isBeamOutwarded: String(beam.isBeamOutwarded ?? "0"),
//                     isReturn: String(beam.isReturn ?? "0"),
//                     sizingPlanId: String(beam.sizingPlanId ?? beamInwardDtl.sizingPlanId ?? ""),
//                     fabricPanelWidth: beam?.fabricPanelWidth != null ? String(beam.fabricPanelWidth) : "",
//                     totalEnds: beam?.totalEnds != null ? String(beam.totalEnds) : "",
//                 })));
//             }
//             if (beamInwardDtl?.orderTypeId) {
//                 setValue("orderTypeId", String(beamInwardDtl.orderTypeId));
//                 setSelectedOrderType(String(beamInwardDtl.orderTypeId));
//             }

//             if (beamInwardDtl.invoiceDetails && beamInwardDtl.invoiceDetails.length > 0) {
//                 setInvoiceDetails(beamInwardDtl.invoiceDetails);
//                 const firstInvoice = beamInwardDtl.invoiceDetails[0];
//                 if (firstInvoice.invoiceUpload) {
//                     setExistingMedia({
//                         mediaUrl: firstInvoice.invoiceUpload,
//                         mediaSno: firstInvoice.mediaSno,
//                         mediaDetailSno: firstInvoice.mediaDetailSno,
//                         originalFileName: "Invoice"
//                     } as any);
//                 }
//                 if (firstInvoice.mediaDetailSno) {
//                     mediaService.getMediaDetailByMediaDetailSno(firstInvoice.mediaDetailSno)
//                         .then(detail => {
//                             if (detail) setExistingMedia(detail);
//                         })
//                         .catch(err => console.error("Failed to fetch media detail", err));
//                 }
//             }

//         } else {
//             const today = new Date().toISOString().split('T')[0];
//             setValue('beamInwardDate', today);
//             setValue('dcDate', today);
//             setValue('dcNumber', "");
//             setValue('orderTypeId', '2');
//             setSelectedOrderType('2');
//         }
//     }, [beamInwardDtl, reset, setValue]);


//     const handleSaveNewBeam = () => {
//         if (
//             !newBeamItem.fabricId ||
//             !newBeamItem.weavingContractId ||
//             !newBeamItem.weavingVendorId ||
//             !newBeamItem.salesOrderId ||
//             !newBeamItem.sizedBeamNo
//         ) {
//             alert("Please fill all required fields");
//             return;
//         }

//         const trimmedSizedBeamNo = newBeamItem.sizedBeamNo.trim();
//         if (!trimmedSizedBeamNo) {
//             alert("Please fill all required fields");
//             return;
//         }

//         const trimmedFlangeNo = (newBeamItem.flangeNo || "").trim();

//         const normalizedSizedBeamNo = trimmedSizedBeamNo.toLowerCase();
//         const hasDuplicateSizedBeamNo = beamItems.some((beam, index) => {
//             if (beamEditingIndex !== null && index === beamEditingIndex) {
//                 return false;
//             }
//             const existing = (beam.sizedBeamNo || "").trim().toLowerCase();
//             return existing && existing === normalizedSizedBeamNo;
//         });

//         if (hasDuplicateSizedBeamNo) {
//             toast.error("Sized Beam No already exists");
//             return;
//         }

//         const normalizedFlangeNo = trimmedFlangeNo.toLowerCase();
//         if (normalizedFlangeNo) {
//             const hasDuplicateFlangeNo = beamItems.some((beam, index) => {
//                 if (beamEditingIndex !== null && index === beamEditingIndex) {
//                     return false;
//                 }
//                 const existing = (beam.flangeNo || "").trim().toLowerCase();
//                 return existing && existing === normalizedFlangeNo;
//             });

//             if (hasDuplicateFlangeNo) {
//                 toast.error("Empty Beam No already exists");
//                 return;
//             }
//         }

//         const meta = resolveFabricMeta(newBeamItem.fabricId);
//         const derivedTotalEnds = isExternalOrder ? getExternalTotalEndsForBeam(newBeamItem) : newBeamItem.totalEnds;
//         const sanitizedBeam: BeamInwardBeamDetails = {
//             ...newBeamItem,
//             sizedBeamNo: trimmedSizedBeamNo,
//             flangeNo: isExternalOrder ? trimmedFlangeNo : newBeamItem.flangeNo,
//             fabricPanelWidth: newBeamItem.fabricPanelWidth || meta?.fabricPanelWidth || "",
//             totalEnds: derivedTotalEnds || meta?.totalEnds || "",
//         };

//         if (beamEditingIndex !== null) {
//             const updated = [...beamItems];
//             updated[beamEditingIndex] = sanitizedBeam;
//             setBeamItems(updated);
//             setBeamEditingIndex(null);
//         } else {
//             setBeamItems([...beamItems, sanitizedBeam]);
//         }

//         setNewBeamItem({
//             fabricId: "",
//             weavingContractId: "",
//             weavingVendorId: "",
//             salesOrderId: "",
//             sizedBeamNo: "",
//             flangeId: "",
//             flangeNo: "",
//             wrapMeters: "",
//             shrinkage: "",
//             expectedFabricMeter: "",
//             isBeamOutwarded: "0",
//             sizingPlanId: "",
//             fabricPanelWidth: "",
//             totalEnds: "",
//         });
//         setShowAddBeamForm(false);
//     };

//     const handleRemoveNewBeamForm = () => {
//         setNewBeamItem({
//             fabricId: "",
//             weavingContractId: "",
//             weavingVendorId: "",
//             salesOrderId: "",
//             sizedBeamNo: "",
//             flangeId: "",
//             flangeNo: "",
//             wrapMeters: "",
//             shrinkage: "",
//             expectedFabricMeter: "",
//             isBeamOutwarded: "0",
//             sizingPlanId: "",
//             fabricPanelWidth: "",
//             totalEnds: "",
//         });
//         setShowAddBeamForm(false);
//     };

//     const handleQualityWidthChange = (index: number, value: string) => {
//         setItems(prev => prev.map((item, rowIndex) => {
//             if (rowIndex !== index) {
//                 return item;
//             }
//             const normalizedWidth = value;
//             const base = deriveQualityRowBase(item);
//             const computed = base ? computeQualityTotalEnds(base, normalizedWidth) : item.totalEnds;
//             return {
//                 ...item,
//                 fabricPanelWidth: normalizedWidth,
//                 totalEndsBase: base,
//                 totalEnds: computed,
//             };
//         }));
//     };

//     const editItem = (index: number) => {
//         setNewItem(items[index]);
//         setEditingIndex(index);
//     };

//     // const editBeamItem = (index: number) => {
//     //     const item = beamItems[index];
//     //     // Add to tempBeamItems to show in the "Add New Beams" section
//     //     setTempBeamItems([{ ...item, _tempId: Date.now() + Math.random() }]);
//     //     // Remove from main list while editing
//     //     setBeamItems(beamItems.filter((_, i) => i !== index));
//     //     // Also keep these for any other legacy parts of the form
//     //     setNewBeamItem(item);
//     //     setBeamEditingIndex(null); // Reset because we're using tempBeamItems
//     //     setShowAddBeamForm(true);
//     //     // Mark as populated so useEffect doesn't overwrite with defaults
//     //     setLastPopulatedIdsRef({
//     //         fabricId: String(item.fabricId || ""),
//     //         weavingContractId: String(item.weavingContractId || "")
//     //     });
//     // };

//     const editBeamItem = (index: number) => {
//         const item = beamItems[index];

//         // Set editing mode
//         setIsEditingBeam(true);
//         setEditingBeamIndex(index);

//         // Add to tempBeamItems for editing (single item for edit)
//         setTempBeamItems([{
//             ...item,
//             _tempId: Date.now() + Math.random(),
//             sizedBeamNo: item.sizedBeamNo || "",
//             wrapMeters: item.wrapMeters || "",
//             fabricId: item.fabricId || "",
//             weavingContractId: item.weavingContractId || "",
//             weavingVendorId: item.weavingVendorId || "",
//             salesOrderId: item.salesOrderId || "",
//             flangeId: item.flangeId || "",
//             flangeNo: item.flangeNo || "",
//             fabricPanelWidth: item.fabricPanelWidth || "",
//             totalEnds: item.totalEnds || "",
//             shrinkage: item.shrinkage || "",
//             expectedFabricMeter: item.expectedFabricMeter || "",
//             sizingPlanId: item.sizingPlanId || (selectedSizingPlan?.id ? String(selectedSizingPlan.id) : ""),
//         }]);

//         // Also update newBeamItem for any legacy references
//         setNewBeamItem(item);
//         setBeamEditingIndex(null);

//         // Make sure the add form is visible
//         setShowAddBeamForm(true);

//         // Mark as populated so useEffect doesn't overwrite with defaults
//         setLastPopulatedIdsRef({
//             fabricId: String(item.fabricId || ""),
//             weavingContractId: String(item.weavingContractId || "")
//         });
//     };

//     //     const editBeamItem = (index: number) => {
//     //   const item = beamItems[index];


//     //   // Check if item already exists in tempBeamItems to avoid duplicates
//     //   const alreadyInTemp = tempBeamItems.some(temp => 
//     //     temp.sizedBeamNo === item.sizedBeamNo && 
//     //     temp.sizedBeamNo !== ""
//     //   );

//     //   if (!alreadyInTemp) {
//     //     // Add to tempBeamItems for editing (keep original in main list)
//     //     setTempBeamItems([...tempBeamItems, { 
//     //       ...item, 
//     //       _tempId: Date.now() + Math.random(),
//     //       sizedBeamNo: item.sizedBeamNo || "",
//     //       wrapMeters: item.wrapMeters || "",
//     //       fabricId: item.fabricId || "",
//     //       weavingContractId: item.weavingContractId || "",
//     //       weavingVendorId: item.weavingVendorId || "",
//     //       salesOrderId: item.salesOrderId || "",
//     //       flangeId: item.flangeId || "",
//     //       flangeNo: item.flangeNo || "",
//     //       fabricPanelWidth: item.fabricPanelWidth || "",
//     //       totalEnds: item.totalEnds || "",
//     //       shrinkage: item.shrinkage || "",
//     //       expectedFabricMeter: item.expectedFabricMeter || "",
//     //       sizingPlanId: item.sizingPlanId || selectedSizingPlan?.id ? String(selectedSizingPlan.id) : "",
//     //     }]);
//     //   }

//     //   // Also update newBeamItem for any legacy references
//     //   setNewBeamItem(item);
//     //   setBeamEditingIndex(index); // Store the index being edited

//     //   // Make sure the add form is visible
//     //   setShowAddBeamForm(true);

//     //   // Mark as populated
//     //   setLastPopulatedIdsRef({
//     //     fabricId: String(item.fabricId || ""),
//     //     weavingContractId: String(item.weavingContractId || "")
//     //   });

//     //   toast.info("Edit the beam and click 'Save All Beams' to update");
//     // };

//     const deleteItem = (index: number) => {
//         setItems(items.filter((_, i) => i !== index));
//     };

//     const deleteBeamItem = (index: number) => {
//         setBeamItems(beamItems.filter((_, i) => i !== index));
//     };

//     // Generate document number for new beam inward entries
//     useEffect(() => {
//         const generateDocumentNumber = async () => {
//             // Only generate for new entries (not editing existing ones)
//             if (id || beamInwardDtl || hasGeneratedNumberRef.current) {
//                 return;
//             }

//             try {
//                 const result = await documentNumberService.generateDocumentNumber({
//                     screenName: 'Beam Inward'
//                 });

//                 setValue('beamInwardNo', result.documentNumber, { shouldValidate: true });
//                 hasGeneratedNumberRef.current = true;
//             } catch (error) {
//                 console.error('Failed to generate beam inward number:', error);
//                 toast.error('Failed to generate beam inward number');
//             }
//         };

//         generateDocumentNumber();
//     }, [beamInwardDtl, setValue]);

//     // Cleanup document number cache if not saved
//     useEffect(() => {
//         const handleBeforeUnload = (e: BeforeUnloadEvent) => {
//             if (hasGeneratedNumberRef.current && !isSavingRef.current && !id) {
//                 documentNumberService.clearMemoryCache('Beam Inward');
//             }
//         };

//         window.addEventListener('beforeunload', handleBeforeUnload);

//         return () => {
//             window.removeEventListener('beforeunload', handleBeforeUnload);
//             if (hasGeneratedNumberRef.current && !isSavingRef.current && !id) {
//                 documentNumberService.clearMemoryCache('Beam Inward');
//             }
//         };
//     }, [id]);

//     const onSubmit = async (data: BeamInwardFormData) => {
//         if (beamItems.length === 0) {
//             toast.error("Atleast add one beam in Beam Details");
//             return;
//         }
//         const isEditMode = Boolean(id);
//         let beamInwardNo = data.beamInwardNo || beamInwardDtl?.issueNo || "";
//         if (!id && !beamInwardNo) {
//             try {
//                 const docResponse = await documentNumberService.generateDocumentNumber({
//                     screenName: 'Beam Inward'
//                 });
//                 beamInwardNo = docResponse.documentNumber;
//             } catch (error) {
//                 console.warn("Failed to generate document number:", error);
//             }
//         }

//         console.log('Form Data before transformation:', data);
//         console.log('Selected Sizing Plan ID:', data.sizingPlanId);
//         const emptySizedBeamNos = beamItems.filter(beam => !(beam.sizedBeamNo || "").trim());
//         if (emptySizedBeamNos.length > 0) {
//             isSavingRef.current = false;
//             alert("Please fill in all Sized Beam No fields");
//             return;
//         }

//         const requiredBeamFields: (keyof BeamInwardBeamDetails)[] = [
//             "weavingContractId",
//             "fabricId",
//             "weavingVendorId",
//             "salesOrderId",
//             "sizedBeamNo",
//         ];
        
//         const incompleteBeamIndex = beamItems.findIndex(beam =>
//             requiredBeamFields.some(field => !(String((beam as any)[field] ?? "").trim()))
//         );
//         if (incompleteBeamIndex !== -1) {
//             toast.error(`Please fill all mandatory Beam Details fields in row ${incompleteBeamIndex + 1}`);
//             return;
//         }

//         const seenSizedBeamNos = new Set<string>();
//         const hasDuplicateSizedBeamNos = beamItems.some(beam => {
//             const key = (beam.sizedBeamNo || "").trim().toLowerCase();
//             if (!key) {
//                 return false;
//             }
//             if (seenSizedBeamNos.has(key)) {
//                 return true;
//             }
//             seenSizedBeamNos.add(key);
//             return false;
//         });

//         if (hasDuplicateSizedBeamNos) {
//             toast.error("Sized Beam No already exists");
//             return;
//         }

//         const transformedBeamDetails = beamItems.map(beam => {
//             const derivedTotal = getExternalTotalEndsForBeam(beam);
//             return {
//                 ...beam,
//                 fabricId: (beam.fabricId ? parseInt(beam.fabricId) : null) as any,
//                 weavingContractId: parseInt(beam.weavingContractId),
//                 weavingVendorId: parseInt(beam.weavingVendorId),
//                 salesOrderId: parseInt(beam.salesOrderId),
//                 sizedBeamNo: (beam.sizedBeamNo || "").trim(),
//                 flangeId: beam.flangeId ? parseInt(beam.flangeId) : null,
//                 flangeNo: (beam.flangeNo || "").trim(),
//                 wrapMeters: parseFloat(beam.wrapMeters),
//                 shrinkage: parseFloat(beam.shrinkage),
//                 expectedFabricMeter: parseFloat(beam.expectedFabricMeter),
//                 isBeamOutwarded: 0,
//                 sizingPlanId: parseInt(beam.sizingPlanId || data.sizingPlanId || "0") || null,
//                 fabricPanelWidth: parseFloat(beam.fabricPanelWidth || String(selectedSizingPlan?.sizingQualityDetails?.[0]?.fabricPanelWidth || "1")),
//                 totalEnds: derivedTotal ? parseFloat(derivedTotal) : null,
//             };
//         });

//         const seenFlangeKeys = new Set<string>();
//         let duplicateFlangeNo = "";
//         const hasDuplicateFlangeNos = transformedBeamDetails.some(beam => {
//             const key = getFlangeKey(beam.flangeId ? String(beam.flangeId) : undefined, beam.flangeNo);
//             if (!key) {
//                 return false;
//             }
//             if (seenFlangeKeys.has(key)) {
//                 duplicateFlangeNo = resolveFlangeDisplayName(beam.flangeId ? String(beam.flangeId) : undefined, beam.flangeNo);
//                 return true;
//             }
//             seenFlangeKeys.add(key);
//             return false;
//         });

//         if (hasDuplicateFlangeNos) {
//             toast.error(`Empty Beam No "${duplicateFlangeNo}" is duplicated in Beam Details`);
//             return;
//         }

//         const effectiveCompanyId = selectedCompanyId ?? companyId ?? 1;
//         isSavingRef.current = true;

//         const payload = {
//             ...data,
//             beamInwardDate: data.beamInwardDate,
//             sizingVendorId: parseInt(data.sizingVendorId),
//             sizingPlanId: data.sizingPlanId ? parseInt(data.sizingPlanId) : null,
//             termsConditionsId: parseInt(data.termsConditionsId),
//             paymentTermsId: parseInt(data.paymentTermsId),
//             sizingRate: parseFloat(data.sizingRate),
//             beamInwardNo: beamInwardNo,
//             dcNumber: data.dcNumber || "",
//             dcDate: data.dcDate || null,
//             orderTypeId: parseInt(data.orderTypeId),
//             companyId: effectiveCompanyId,
//             sourceCompanyId: effectiveCompanyId,
//             destinationCompanyId: 1,
//             totalBeams: beamItems.length,
//             beamInwardQualityDetails: items.map(item => {
//                 const { totalEndsBase, ...rest } = item;
//                 return {
//                     ...rest,
//                     yarnId: parseInt(item.yarnId),
//                     sordEnds: parseInt(item.sordEnds),
//                     actualEnds: parseInt(item.actualEnds),
//                     parts: parseInt(item.parts),
//                     endsPerPart: parseInt(item.endsPerPart),
//                     wrapMeters: parseFloat(item.wrapMeters),
//                     fabricPanelWidth: parseFloat(item.fabricPanelWidth || "1"),
//                     totalEnds: item.totalEnds ? parseFloat(item.totalEnds) : null,
//                 };
//             }),
//             beamInwardBeamDetails: transformedBeamDetails,
//             invoiceDetails: invoiceDetails.map(inv => ({
//                 invNo: inv.invNo,
//                 invDate: inv.invDate,
//                 sizingCost: Number(inv.sizingCost),
//                 gstAmount: Number(inv.gstAmount),
//                 netTotal: Number(inv.netTotal),
//                 mediaDetailSno: inv.mediaDetailSno,
//                 mediaSno: inv.mediaSno,
//                 invoiceUpload: inv.invoiceUpload
//             }))
//         };

//         try {
//             // alert(JSON.stringify(payload));
//             console.log(JSON.stringify(payload))
//             if (isEditMode) {
//                 await dispatch(updateBeamInward({
//                     id: Number(id),
//                     data: payload,
//                     companyId: effectiveCompanyId
//                 })).unwrap();
//             } else {
//                 await dispatch(createBeamInward(payload)).unwrap();
//                 documentNumberService.clearMemoryCache('Beam Inward');
//             }
//             navigate("/transaction/beam-management");
//         } catch (err) {
//             console.error("Error submitting Beam Inward:", err);
//         }
//     };

//     const handleAddLot = () => {
//         const newItems = Array.from({ length: Number(numberOfLots) }, () => ({
//             quality: "",
//             yarnId: "",
//             actualEnds: "",
//             parts: "",
//             endsPerPart: "",
//             wrapMeters: "",
//         }));
//     };

//     const handleSizingPlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//         const selectedId = e.target.value;

//         if (!selectedId) {
//             setSelectedSizingPlan(null);
//             setItems([]);
//             setBeamItems([]);
//             return;
//         }

//         const plan = sizingPlanList.find((sp: any) => sp.id === parseInt(selectedId));
//         console.log('Selected Plan:', plan);

//         if (plan) {
//             setSelectedSizingPlan(plan);

//             setValue("sizingPlanId", String(plan.id));
//             setValue("sizingVendorId", String(plan.vendorId));
//             setValue("termsConditionsId", String(plan.termsConditionsId));
//             setValue("paymentTermsId", String(plan.paymentTermsId));
//             setValue("sizingRate", String(plan.sizingRate));
//             setValue("emptyBeamNo", plan.emptyBeamNo || "");
//             setValue("remarks", plan.remarks || "");
//             setValue("orderTypeId", String(plan.orderTypeId ?? ""));
//             setSelectedOrderType(String(plan.orderTypeId ?? ""));


//             if (plan.sizingQualityDetails && plan.sizingQualityDetails.length > 0) {
//                 setItems(plan.sizingQualityDetails.map(mapQualityDetail));
//             }

//             if (plan.sizingBeamDetails && plan.sizingBeamDetails.length > 0) {
//                 const availableBeams = plan.sizingBeamDetails.filter((b: any) => {
//                     const st = b?.status;
//                     return st === 0 || st === "0" || st === undefined || st === null;
//                 });

//                 // Check for duplicate Flange Nos in the plan itself
//                 const seenFlanges = new Set<string>();
//                 const duplicateFlanges = new Set<string>();
//                 availableBeams.forEach((b: any) => {
//                     const fno = (b.flangeNo || "").trim().toLowerCase();
//                     if (fno) {
//                         if (seenFlanges.has(fno)) {
//                             duplicateFlanges.add(b.flangeNo);
//                         }
//                         seenFlanges.add(fno);
//                     }
//                 });

//                 if (duplicateFlanges.size > 0) {
//                     toast.warn(`Selected Sizing Plan contains duplicate Flange Nos: ${Array.from(duplicateFlanges).join(", ")}. Please correct them.`);
//                 }

//                 const planFPW = String(plan?.sizingQualityDetails?.[0]?.fabricPanelWidth ?? "1");
//                 setBeamItems(availableBeams.map((b: any) => {
//                     const warp = Number(b.warpMeters ?? 0) || 0;
//                     const shrink = Number(b.shrinkage ?? 0) || 0;
//                     const fpw = Number(b.fabricPanelWidth ?? planFPW) || 1;
//                     const base = warp * fpw;
//                     const efmCalc = base - (base * (shrink / 100));
//                     const meta = resolveFabricMeta(b.fabricId ?? b.fabricCodeId);
//                     const widthValue = meta?.fabricPanelWidth || String(fpw);
//                     const totalEndsValue = meta?.totalEnds || "";
//                     return {
//                         fabricId: String(b.fabricId ?? ""),
//                         weavingContractId: String(b.weavingContractId ?? ""),
//                         weavingVendorId: String(b.weavingVendorId ?? ""),
//                         salesOrderId: String(b.salesOrderId ?? ""),
//                         sizedBeamNo: "",
//                         flangeId: String(b.flangeId ?? ""),
//                         flangeNo: String(b.flangeNo ?? ""),
//                         wrapMeters: String(warp || ""),
//                         shrinkage: String(shrink || ""),
//                         expectedFabricMeter: String(b.expectedFabricMeter ?? (isNaN(efmCalc) ? "" : efmCalc)),
//                         isBeamOutwarded: "0",
//                         sizingPlanId: String(plan.id),
//                         fabricPanelWidth: widthValue,
//                         totalEnds: totalEndsValue,
//                     } as BeamInwardBeamDetails;
//                 }));
//             } else {
//                 setBeamItems([]);
//             }
//         }
//     };

//     const handleSizedBeamNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = e.target.value.replace(/\s/g, "");
//         setNewBeamItem({
//             ...newBeamItem,
//             sizedBeamNo: value
//         });
//     };

//     const handleEditSizedBeamNo = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = e.target.value.replace(/\s/g, "");
//         setBeamItems(prev => prev.map((item, i) =>
//             i === index ? { ...item, sizedBeamNo: value } : item
//         ));
//     };

//     const handleBeamFlangeNoChange = (index: number, value: string) => {
//         const trimmedValue = value.trim();
//         if (trimmedValue && isFlangeDuplicate(undefined, trimmedValue, beamItems, index)) {
//             toast.error(`Empty Beam No "${trimmedValue}" is already used in another row`);
//             return;
//         }
//         setBeamItems(prev => prev.map((item, i) =>
//             i === index ? { ...item, flangeNo: trimmedValue } : item
//         ));
//     };

//     const handleBeamFlangeSelectionChange = (index: number, flangeId: string) => {
//         const selected = flangeOptions.find((fl: any) => String(fl.id) === flangeId);
//         const selectedFlangeNo = selected ? (selected.flangeNo ?? "").trim() : "";
//         const selectedFlangeId = selected ? String(selected.id) : flangeId;

//         if (isFlangeDuplicate(selectedFlangeId, selectedFlangeNo, beamItems, index)) {
//             toast.error(`Empty Beam No "${selected?.flangeNo}" is already selected in another row`);
//             return;
//         }

//         setBeamItems(prev => prev.map((item, i) => {
//             if (i !== index) {
//                 return item;
//             }
//             return {
//                 ...item,
//                 flangeId: flangeId,
//                 flangeNo: selectedFlangeNo,
//             };
//         }));
//     };

//     const handleBeamExternalFlangeSelectionChange = (index: number, flangeId: string) => {
//         const companyId = getCompanyIdForVendor(beamItems[index].weavingVendorId);
//         const options = getExternalFlangeOptionsForCompany(companyId);
//         const selected = options.find((fl: any) => String(fl.id) === flangeId);

//         let candidateFlangeNo = "";
//         let candidateFlangeId: string | undefined = undefined;
//         if (selected) {
//             candidateFlangeNo = (selected.flangeNo ?? "").trim();
//             candidateFlangeId = String(selected.id);
//         } else if (flangeId && flangeId.startsWith(LEGACY_EXTERNAL_FLANGE_PREFIX)) {
//             candidateFlangeNo = flangeId.slice(LEGACY_EXTERNAL_FLANGE_PREFIX.length).trim();
//         }

//         if (isFlangeDuplicate(candidateFlangeId, candidateFlangeNo, beamItems, index)) {
//             toast.error(`Empty Beam No "${candidateFlangeNo}" is already selected in another row`);
//             return;
//         }

//         setBeamItems(prev => prev.map((item, i) => {
//             if (i !== index) {
//                 return item;
//             }
//             if (selected) {
//                 return {
//                     ...item,
//                     flangeId: String(selected.id),
//                     flangeNo: candidateFlangeNo,
//                 };
//             }
//             if (flangeId && flangeId.startsWith(LEGACY_EXTERNAL_FLANGE_PREFIX)) {
//                 return {
//                     ...item,
//                     flangeId: "",
//                     flangeNo: candidateFlangeNo,
//                 };
//             }
//             return {
//                 ...item,
//                 flangeId: flangeId,
//                 flangeNo: item.flangeNo || "",
//             };
//         }));
//     };

//     const handleNewBeamWidthChange = (value: string) => {
//         setNewBeamItem(prev => {
//             const fallbackBase = (() => {
//                 const totalNumeric = safeNumber(prev.totalEnds);
//                 const widthNumeric = safeNumber(prev.fabricPanelWidth);
//                 if (totalNumeric != null && widthNumeric != null && widthNumeric > 0) {
//                     const derived = totalNumeric / widthNumeric;
//                     return Number.isFinite(derived) ? String(derived) : "";
//                 }
//                 return "";
//             })();
//             const base = getFabricTotalEndsBase(prev.fabricId) || fallbackBase;
//             const computed = base ? computeQualityTotalEnds(base, value) : prev.totalEnds;
//             return {
//                 ...prev,
//                 fabricPanelWidth: value,
//                 totalEnds: base ? computed : prev.totalEnds,
//             };
//         });
//     };

//     const handleNewBeamTotalEndsChange = (value: string) => {
//         setNewBeamItem(prev => ({ ...prev, totalEnds: value }));
//     };

//     const uniqueQualities = useMemo(() => {
//         const arr = selectedSizingPlan?.sizingQualityDetails || [];
//         const map = new Map<string, any>();
//         for (const it of arr) {
//             const fid = (it.fabricId ?? it.fabricCodeId);
//             const key = String(fid ?? it.fabricCode ?? it.quality ?? "");
//             if (!map.has(key)) {
//                 map.set(key, {
//                     key,
//                     fabricId: fid ? String(fid) : "",
//                     fabricCode: it.fabricCode || "",
//                     quality: it.quality || "",
//                     fabricPanelWidth: String(it.fabricPanelWidth ?? ""),
//                     totalEnds: deriveDetailTotalEnds(it),
//                     totalEndsBase: resolveQualityBaseTotalEnds(it),
//                 });
//             }
//         }
//         return Array.from(map.values());
//     }, [selectedSizingPlan]);

//     const fabricMetaMap = useMemo(() => {
//         const map = new Map<string, { fabricPanelWidth: string; totalEnds: string; totalEndsBase: string }>();
//         uniqueQualities.forEach((entry: any) => {
//             const meta = {
//                 fabricPanelWidth: entry.fabricPanelWidth || "",
//                 totalEnds: entry.totalEnds || "",
//                 totalEndsBase: entry.totalEndsBase || "",
//             };
//             const keys = [entry.fabricId, entry.key]
//                 .map((value) => (value != null ? String(value).trim() : ""))
//                 .filter(Boolean);
//             keys.forEach((key) => {
//                 if (!map.has(key)) {
//                     map.set(key, meta);
//                 }
//                 const lower = key.toLowerCase();
//                 if (!map.has(lower)) {
//                     map.set(lower, meta);
//                 }
//             });
//         });
//         return map;
//     }, [uniqueQualities]);

//     const resolveFabricMeta = useCallback(
//         (fabricId?: string) => {
//             if (fabricId == null) return undefined;
//             const key = String(fabricId).trim();
//             if (!key) return undefined;
//             return fabricMetaMap.get(key) || fabricMetaMap.get(key.toLowerCase());
//         },
//         [fabricMetaMap]
//     );

//     const getFabricTotalEndsBase = useCallback(
//         (fabricId?: string) => {
//             const meta = resolveFabricMeta(fabricId);
//             if (!meta) {
//                 return "";
//             }
//             if (meta.totalEndsBase && meta.totalEndsBase.trim() !== "") {
//                 return meta.totalEndsBase;
//             }
//             const totalNumeric = safeNumber(meta.totalEnds);
//             const widthNumeric = safeNumber(meta.fabricPanelWidth);
//             if (totalNumeric != null && widthNumeric != null && widthNumeric > 0) {
//                 const derived = totalNumeric / widthNumeric;
//                 return Number.isFinite(derived) ? String(derived) : "";
//             }
//             return "";
//         },
//         [resolveFabricMeta]
//     );

//     const planWeavingContractIds = useMemo(() => {
//         const details = selectedSizingPlan?.sizingBeamDetails || [];
//         const ids = new Set<number>();
//         details.forEach((b: any) => { if (b && b.weavingContractId != null) ids.add(Number(b.weavingContractId)); });
//         return ids;
//     }, [selectedSizingPlan]);

//     const planWeavingContracts = useMemo(() => {
//         if (!planWeavingContractIds.size) return [] as any[];
//         return activeWeavingContractList.filter((wc: any) => planWeavingContractIds.has(Number(wc.id)));
//     }, [activeWeavingContractList, planWeavingContractIds]);

//     const filteredWeavingContracts = useMemo(() => {
//         // Contracts available in selected plan, optionally filter by chosen fabric
//         const base = planWeavingContracts;
//         const fid = parseInt(String(newBeamItem.fabricId || ""));
//         if (!fid || isNaN(fid)) return base;
//         return base.filter((wc: any) => (wc.items || []).some((it: any) => Number(it.fabricCodeId) === Number(fid)));
//     }, [planWeavingContracts, newBeamItem.fabricId]);

//     const beamFormWeavingContracts = useMemo(() => {
//         const vid = String(newBeamItem.weavingVendorId || "");
//         const fid = String(newBeamItem.fabricId || "");
//         if (vid) {
//             let base = activeWeavingContractList.filter((wc: any) => String(wc.vendorId) === vid);
//             if (fid) {
//                 const filtered = base.filter((wc: any) => (wc.items || []).some((it: any) => String(it.fabricCodeId) === fid));
//                 if (filtered.length > 0) base = filtered;
//             }
//             return base;
//         }
//         let base: any[] = activeWeavingContractList;
//         if (fid) {
//             const filtered = base.filter((wc: any) => (wc.items || []).some((it: any) => String(it.fabricCodeId) === fid));
//             if (filtered.length > 0) base = filtered;
//         }
//         return base;
//     }, [activeWeavingContractList, newBeamItem.fabricId, newBeamItem.weavingVendorId]);

//     const beamFormWeavers = useMemo(() => {
//         const wcId = String(newBeamItem.weavingContractId || "");
//         if (wcId) {
//             const wc = activeWeavingContractList.find((wc: any) => String(wc.id) === wcId);
//             if (wc?.vendorId) {
//                 return weaverVendorList.filter((v: any) => String(v.id) === String(wc.vendorId));
//             }
//         }
//         return weaverVendorList;
//     }, [weaverVendorList, newBeamItem.weavingContractId, activeWeavingContractList]);

//     useEffect(() => {
//         let desired = "";
//         if (selectedOrderType === "1") {
//             desired = companyId ? String(companyId) : "";
//         } else {
//             const wc = activeWeavingContractList.find((wc: any) => wc.id === parseInt(newBeamItem.weavingContractId));
//             desired = wc?.vendorId ? String(wc.vendorId) : "";
//         }
//         if (desired !== (newBeamItem.weavingVendorId || "")) {
//             setNewBeamItem(prev => ({ ...prev, weavingVendorId: desired }));
//         }
//     }, [selectedOrderType, newBeamItem.weavingContractId, companyId, activeWeavingContractList]);

//     useEffect(() => {
//         if (!isExternalOrder) return;
//         const companyIds = new Set<string>();
//         if (weaverCompanyId) {
//             companyIds.add(weaverCompanyId);
//         }
//         beamItems.forEach((beam) => {
//             const companyId = getCompanyIdForVendor(beam.weavingVendorId);
//             if (companyId) {
//                 companyIds.add(companyId);
//             }
//         });
//         companyIds.forEach((companyId) => {
//             if (externalFlangeCache[companyId] || externalFlangeLoadingMap[companyId]) {
//                 return;
//             }
//             void fetchExternalFlangesForCompany(companyId);
//         });
//     }, [
//         isExternalOrder,
//         weaverCompanyId,
//         beamItems,
//         getCompanyIdForVendor,
//         externalFlangeCache,
//         externalFlangeLoadingMap,
//         fetchExternalFlangesForCompany,
//     ]);

//     useEffect(() => {
//         if (!isExternalOrder) {
//             prevWeaverCompanyIdRef.current = "";
//             return;
//         }
//         if (weaverCompanyId && prevWeaverCompanyIdRef.current && prevWeaverCompanyIdRef.current !== weaverCompanyId) {
//             setNewBeamItem(prev => ({ ...prev, flangeId: "", flangeNo: "" }));
//         }
//         prevWeaverCompanyIdRef.current = weaverCompanyId;
//     }, [isExternalOrder, weaverCompanyId]);

//     useEffect(() => {
//         if (!beamItems.length) return;
//         let changed = false;
//         const updated = beamItems.map((row) => {
//             const meta = resolveFabricMeta(row.fabricId);
//             if (!meta) {
//                 return row;
//             }
//             const widthValue = row.fabricPanelWidth && String(row.fabricPanelWidth).trim() !== "" ? row.fabricPanelWidth : meta.fabricPanelWidth;
//             let totalEndsValue = row.totalEnds && String(row.totalEnds).trim() !== "" ? row.totalEnds : "";
//             if (!totalEndsValue) {
//                 const base = getFabricTotalEndsBase(row.fabricId);
//                 if (base && widthValue) {
//                     totalEndsValue = computeQualityTotalEnds(base, widthValue);
//                 } else if (meta.totalEnds) {
//                     totalEndsValue = meta.totalEnds;
//                 }
//             }
//             if ((row.fabricPanelWidth || "") === (widthValue || "") && (row.totalEnds || "") === (totalEndsValue || "")) {
//                 return row;
//             }
//             changed = true;
//             return {
//                 ...row,
//                 fabricPanelWidth: widthValue,
//                 totalEnds: totalEndsValue,
//             };
//         });
//         if (changed) {
//             setBeamItems(updated as BeamInwardBeamDetails[]);
//         }
//     }, [beamItems, getFabricTotalEndsBase, resolveFabricMeta]);


//     const filteredSalesOrders = useMemo(() => {
//         const wcId = newBeamItem.weavingContractId;
//         if (!wcId) {
//             return [];
//         }
//         const wc = activeWeavingContractList.find((w: any) => String(w.id) === String(wcId));
//         if (!wc) return [];
//         if (wc?.salesOrderNo) {
//             const matched = activeSalesOrderList.filter((so: any) => String(so.id) === String(wc.salesOrderNo));
//             if (matched.length > 0) return matched;
//         }
//         if (wc?.salesOrderId) {
//             const matched = activeSalesOrderList.filter((so: any) => String(so.id) === String(wc.salesOrderId));
//             if (matched.length > 0) return matched;
//         }
//         if (selectedSizingPlan?.sizingBeamDetails?.length) {
//             const wcIdNum = parseInt(wcId);
//             if (!isNaN(wcIdNum)) {
//                 const soIds = new Set(
//                     selectedSizingPlan.sizingBeamDetails
//                         .filter((b: any) => b.weavingContractId === wcIdNum)
//                         .map((b: any) => b.salesOrderId)
//                         .filter((id: any) => id !== undefined && id !== null)
//                 );
//                 const matched = activeSalesOrderList.filter((so: any) => soIds.has(so.id));
//                 if (matched.length > 0) return matched;
//             }
//         }
//         return [];
//     }, [selectedSizingPlan, newBeamItem.weavingContractId, activeSalesOrderList, activeWeavingContractList]);
//     const currentFlangeSelection = newBeamItem.flangeId || (flangeOptions.find((fl: any) => fl.flangeNo === newBeamItem.flangeNo)?.id) || "";
//     const getBeamFlangeLabel = (beam: BeamInwardBeamDetails) => {
//         if (beam.flangeNo) return beam.flangeNo;
//         const match = flangeOptions.find((fl: any) => String(fl.id) === String(beam.flangeId));
//         return match?.flangeNo || "";
//     };
//     const getBeamFlangeSelectionValue = (beam: BeamInwardBeamDetails) => {
//         if (beam.flangeId) {
//             return String(beam.flangeId);
//         }
//         const fallback = flangeOptions.find((fl: any) => fl.flangeNo === beam.flangeNo);
//         return fallback ? String(fallback.id) : "";
//     };

//     const LEGACY_EXTERNAL_FLANGE_PREFIX = "legacy-external-flange:";

//     const getBeamExternalFlangeSelectionValue = (beam: BeamInwardBeamDetails) => {
//         if (beam.flangeId) {
//             return String(beam.flangeId);
//         }
//         const companyId = getCompanyIdForVendor(beam.weavingVendorId);
//         const fallback = getExternalFlangeOptionsForCompany(companyId).find((fl: any) => fl.flangeNo === beam.flangeNo);
//         if (fallback) {
//             return String(fallback.id);
//         }
//         const trimmedFlangeNo = (beam.flangeNo ?? "").toString().trim();
//         return trimmedFlangeNo ? `${LEGACY_EXTERNAL_FLANGE_PREFIX}${trimmedFlangeNo}` : "";
//     };

//     const getBeamExternalFlangeOptions = (beam: BeamInwardBeamDetails, companyId?: string) => {
//         const key = companyId ?? getCompanyIdForVendor(beam.weavingVendorId);
//         const baseOptions = getExternalFlangeOptionsForCompany(key);

//         const weavingVendor = activeVendorList.find((v: any) => String(v.id) === String(beam.weavingVendorId));
//         const isWeaverExternal = weavingVendor && Number(weavingVendor.isInternalVendor) === 0;

//         const extraOptions: any[] = [];
//         if (isExternalOrder && isWeaverExternal) {
//             activeFlangeList.forEach((fl: any) => {
//                 if (fl.issuedToInternal === false && fl.isIssued == 1) {
//                     const idValue = fl.id ?? fl.flangeId;
//                     if (idValue && !baseOptions.some((bo: any) => String(bo.id) === String(idValue))) {
//                         extraOptions.push({
//                             ...fl,
//                             id: String(idValue),
//                             flangeNo: String(fl.flangeNo || fl.flangeNumber || "")
//                         });
//                     }
//                 }
//             });
//         }
//         const mergedOptions = [...baseOptions, ...extraOptions];

//         const selectionValue = getBeamExternalFlangeSelectionValue(beam);
//         if (selectionValue && !mergedOptions.some((fl: any) => String(fl.id) === selectionValue)) {
//             const fallbackFlangeNo = beam.flangeNo || (selectionValue.startsWith(LEGACY_EXTERNAL_FLANGE_PREFIX) ? selectionValue.slice(LEGACY_EXTERNAL_FLANGE_PREFIX.length) : "");
//             return [...mergedOptions, { id: selectionValue, flangeNo: fallbackFlangeNo }];
//         }
//         return mergedOptions;
//     };

//     const normalizeComparisonKey = (value?: string) => (value ?? "").toString().trim().toLowerCase();

//     const getFlangeKey = (flangeId?: string, flangeNo?: string) => {
//         const idValue = flangeId ? String(flangeId).trim() : "";
//         if (idValue) {
//             return `ID:${idValue.toLowerCase()}`;
//         }
//         const noValue = flangeNo ? String(flangeNo).trim().toLowerCase() : "";
//         return noValue ? `NO:${noValue}` : "";
//     };

//     const isFlangeDuplicateKey = (key: string, list: BeamInwardBeamDetails[], excludeIndex?: number) => {
//         if (!key) return false;
//         return list.some((beam, idx) => {
//             if (excludeIndex != null && idx === excludeIndex) return false;
//             return getFlangeKey(beam.flangeId, beam.flangeNo) === key;
//         });
//     };

//     const isFlangeDuplicate = (flangeId: string | undefined, flangeNo: string | undefined, list: BeamInwardBeamDetails[], excludeIndex?: number) => {
//         const key = getFlangeKey(flangeId, flangeNo);
//         if (!key) return false;
//         return isFlangeDuplicateKey(key, list, excludeIndex);
//     };

//     const findQualityDetailForBeam = useCallback(
//         (beam: BeamInwardBeamDetails) => {
//             if (!items.length) return undefined;
//             const beamKey = normalizeComparisonKey(beam.fabricId);
//             if (beamKey) {
//                 const match = items.find((detail) => {
//                     const detailKeys = [
//                         normalizeComparisonKey(detail.fabricId),
//                         normalizeComparisonKey(detail.fabricCode),
//                     ].filter(Boolean);
//                     return detailKeys.includes(beamKey);
//                 });
//                 if (match) {
//                     return match;
//                 }
//             }
//             return items.find((detail) => detail.actualEnds && detail.actualEnds.trim() !== "");
//         },
//         [items]
//     );

//     const getExternalTotalEndsForBeam = useCallback(
//         (beam: BeamInwardBeamDetails) => {
//             if (!isExternalOrder) {
//                 return beam.totalEnds || "";
//             }
//             const match = findQualityDetailForBeam(beam);
//             if (match?.actualEnds && match.actualEnds.trim() !== "") {
//                 return match.actualEnds;
//             }
//             return beam.totalEnds || "";
//         },
//         [findQualityDetailForBeam, isExternalOrder]
//     );

//     useEffect(() => {
//         const valid = filteredSalesOrders.some((so: any) => String(so.id) === String(newBeamItem.salesOrderId));
//         if (!valid && newBeamItem.salesOrderId) {
//             setNewBeamItem(prev => ({ ...prev, salesOrderId: "" }));
//         } else if (!newBeamItem.salesOrderId && filteredSalesOrders.length > 0) {
//             setNewBeamItem(prev => ({ ...prev, salesOrderId: String(filteredSalesOrders[0].id) }));
//         }
//     }, [filteredSalesOrders, newBeamItem.salesOrderId]);

//     useEffect(() => {
//         if (!selectedSizingPlan) return;
//         if (!newBeamItem.weavingContractId && planWeavingContracts.length === 1) {
//             setNewBeamItem(prev => ({ ...prev, weavingContractId: String(planWeavingContracts[0].id) }));
//         }
//     }, [selectedSizingPlan, planWeavingContracts, newBeamItem.weavingContractId]);

//     useEffect(() => {
//         if (!selectedSizingPlan) return;
//         const wcId = Number(newBeamItem.weavingContractId || 0);
//         if (!wcId) {
//             if (newBeamItem.weavingVendorId) setNewBeamItem(prev => ({ ...prev, weavingVendorId: "" }));
//             return;
//         }
//         const ids = Array.from(new Set((selectedSizingPlan?.sizingBeamDetails || [])
//             .filter((b: any) => Number(b.weavingContractId) === wcId && b.weavingVendorId != null)
//             .map((b: any) => String(b.weavingVendorId))));
//         if (ids.length === 1 && String(newBeamItem.weavingVendorId || "") !== ids[0]) {
//             setNewBeamItem(prev => ({ ...prev, weavingVendorId: String(ids[0]) }));
//             return;
//         }
//         if (ids.length > 0) {
//             const valid = ids.includes(String(newBeamItem.weavingVendorId || ""));
//             if (!valid && newBeamItem.weavingVendorId) setNewBeamItem(prev => ({ ...prev, weavingVendorId: "" }));
//         }
//     }, [selectedSizingPlan, newBeamItem.weavingContractId]);

//     useEffect(() => {
//         const warp = parseFloat(newBeamItem.wrapMeters || "");
//         const shrink = parseFloat(newBeamItem.shrinkage || "");
//         const fallbackWidth = parseFloat(String(
//             uniqueQualities.find((u: any) => String(u.fabricId || "") === String(newBeamItem.fabricId || ""))?.fabricPanelWidth ??
//             selectedSizingPlan?.sizingQualityDetails?.[0]?.fabricPanelWidth ??
//             "1"
//         )) || 1;
//         const widthValue = parseFloat(newBeamItem.fabricPanelWidth || "") || fallbackWidth;
//         if (!isNaN(warp) && !isNaN(shrink)) {
//             const base = warp * widthValue;
//             const expected = (base - (base * (shrink / 100)));
//             if (String(expected) !== String(newBeamItem.expectedFabricMeter || "")) {
//                 setNewBeamItem(prev => ({ ...prev, expectedFabricMeter: String(expected) }));
//             }
//         } else if (newBeamItem.expectedFabricMeter) {
//             setNewBeamItem(prev => ({ ...prev, expectedFabricMeter: "" }));
//         }
//     }, [newBeamItem.wrapMeters, newBeamItem.shrinkage, newBeamItem.fabricId, newBeamItem.fabricPanelWidth, selectedSizingPlan, uniqueQualities]);

//     useEffect(() => {
//         const fabricId = newBeamItem.fabricId;
//         const meta = resolveFabricMeta(fabricId);
//         if (!meta) {
//             return;
//         }
//         const base = getFabricTotalEndsBase(fabricId);
//         setNewBeamItem(prev => {
//             const forceUpdate = prev.fabricId !== fabricId;
//             const patch: Partial<BeamInwardBeamDetails> = {};
//             if (forceUpdate || (!prev.fabricPanelWidth && meta.fabricPanelWidth !== undefined)) {
//                 patch.fabricPanelWidth = meta.fabricPanelWidth || "";
//             }
//             const widthForTotal = patch.fabricPanelWidth ?? prev.fabricPanelWidth ?? "";
//             if (forceUpdate || !prev.totalEnds) {
//                 if (base && widthForTotal) {
//                     patch.totalEnds = computeQualityTotalEnds(base, widthForTotal);
//                 } else if (meta.totalEnds) {
//                     patch.totalEnds = meta.totalEnds;
//                 } else if (forceUpdate) {
//                     patch.totalEnds = "";
//                 }
//             }
//             if (!Object.keys(patch).length) {
//                 return prev;
//             }
//             return { ...prev, ...patch } as BeamInwardBeamDetails;
//         });
//     }, [getFabricTotalEndsBase, newBeamItem.fabricId, resolveFabricMeta]);

//     useEffect(() => {
//         if (!isExternalOrder) return;
//         const externalTotalEnds = getExternalTotalEndsForBeam(newBeamItem);
//         if (!externalTotalEnds || externalTotalEnds === newBeamItem.totalEnds) return;
//         setNewBeamItem(prev => ({
//             ...prev,
//             totalEnds: externalTotalEnds,
//         }));
//     }, [
//         isExternalOrder,
//         getExternalTotalEndsForBeam,
//         newBeamItem.fabricId,
//         newBeamItem.weavingContractId,
//         newBeamItem.totalEnds,
//     ]);

//     const [lastPopulatedIdsRef, setLastPopulatedIdsRef] = useState<{ fabricId: string; weavingContractId: string } | null>(null);

//     useEffect(() => {
//         if (!selectedSizingPlan) return;
//         const wcId = Number(newBeamItem.weavingContractId || 0);
//         if (!wcId) return;

//         // Skip if we already auto-populated for this fabric/contract combo
//         // or if we are in editing mode (unless fabric/contract changed)
//         const currentCombo = { fabricId: newBeamItem.fabricId || "", weavingContractId: newBeamItem.weavingContractId };
//         const isSameAsLast = lastPopulatedIdsRef?.fabricId === currentCombo.fabricId && lastPopulatedIdsRef?.weavingContractId === currentCombo.weavingContractId;

//         if (isSameAsLast) return;

//         const matches = (selectedSizingPlan.sizingBeamDetails || []).filter((b: any) => Number(b.weavingContractId) === wcId);
//         if (!matches.length) return;

//         // If fabric not picked, and only one fabric in plan for this contract, pick it
//         if (!newBeamItem.fabricId) {
//             const uniqFabrics: string[] = Array.from(new Set(matches.map((b: any) => String(b.fabricId)).filter(Boolean)));
//             if (uniqFabrics.length === 1) {
//                 setNewBeamItem(prev => ({ ...prev, fabricId: uniqFabrics[0] }));
//                 setLastPopulatedIdsRef({ ...currentCombo, fabricId: uniqFabrics[0] });
//                 return;
//             }
//         }

//         // When fabric is chosen, set warp/shrink/expected and default sales order from matching plan row
//         if (newBeamItem.fabricId) {
//             const fid = Number(newBeamItem.fabricId);
//             const row = matches.find((b: any) => Number(b.fabricId) === fid) || matches[0];
//             if (row) {
//                 const warp = Number(row.warpMeters ?? 0) || 0;
//                 const shrink = Number(row.shrinkage ?? 0) || 0;
//                 const fpw = Number(
//                     uniqueQualities.find((u: any) => String(u.fabricId || "") === String(row.fabricId || ""))?.fabricPanelWidth ??
//                     selectedSizingPlan?.sizingQualityDetails?.[0]?.fabricPanelWidth ??
//                     1
//                 ) || 1;
//                 const base = warp * fpw;
//                 const expected = row.expectedFabricMeter ?? (isNaN(base) ? "" : (base - (base * (shrink / 100))));
//                 const meta = resolveFabricMeta(row.fabricId ?? row.fabricCodeId);

//                 setNewBeamItem(prev => ({
//                     ...prev,
//                     wrapMeters: String(warp || ""),
//                     shrinkage: String(shrink || ""),
//                     expectedFabricMeter: String(expected || ""),
//                     fabricPanelWidth: String(fpw),
//                     totalEnds: prev.totalEnds || meta?.totalEnds || "",
//                     salesOrderId: prev.salesOrderId || (row.salesOrderId ? String(row.salesOrderId) : ""),
//                     flangeId: row?.flangeId != null ? String(row.flangeId) : (prev.flangeId || ""),
//                     flangeNo: row?.flangeNo != null ? String(row.flangeNo) : (prev.flangeNo || ""),
//                 }));
//                 setLastPopulatedIdsRef(currentCombo);
//             }
//         }
//     }, [newBeamItem.weavingContractId, newBeamItem.fabricId, selectedSizingPlan, uniqueQualities, lastPopulatedIdsRef]);

//     useEffect(() => {
//         if (!selectedSizingPlan && beamInwardDtl?.sizingPlanId && sizingPlanList?.length) {
//             const plan = sizingPlanList.find((sp: any) => sp.id === Number(beamInwardDtl.sizingPlanId));
//             if (plan) setSelectedSizingPlan(plan);
//         }
//     }, [beamInwardDtl?.sizingPlanId, sizingPlanList]);

//     useEffect(() => {
//         if (beamEditingIndex !== null) return;
//         setNewBeamItem(prev => ({ ...prev, fabricId: "", weavingContractId: "", salesOrderId: "" }));
//     }, [selectedSizingPlan, beamEditingIndex]);

//     const isTotalEndsAuto = Boolean(getFabricTotalEndsBase(newBeamItem.fabricId));

//     return (
//         <div className="mt-10 p-6 bg-white shadow-md rounded-lg">
//             <div className="flex justify-between items-center border-b pb-4 mt-5">
//                 <div className="flex items-center space-x-4">
//                     <Button
//                         variant="outline"
//                         onClick={() => navigate("/transaction/beam-management")}
//                         className="mr-auto"
//                     >
//                         <ArrowLeft size={18} className="mr-2" />
//                         Back
//                     </Button>
//                     <h2 className="text-2xl font-semibold">Beam Inward</h2>
//                 </div>

              
//             </div>

//             <div className="space-y-6">
//                 <div className="mb-8">
//                     <div className="border-b border-gray-200">
//                         <nav className="flex -mb-px">
//                             <button
//                                 onClick={() => setActiveTab('vendorDetails')}
//                                 className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'vendorDetails'
//                                     ? 'border-red-500 text-red-600'
//                                     : 'border-transparent text-gray-500 hover:text-gray-700 Inward Ordershover:border-gray-300'
//                                     }`}
//                             >
//                                 <FileText className="w-4 h-4" />
//                                 Vendor Details
//                             </button>
//                         </nav>
//                     </div>
//                 </div>

//                 {activeTab === "vendorDetails" && (
//                     <>
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2 ">
//                                     <FileText size={20} /> Vendor Details
//                                 </CardTitle>
//                             </CardHeader>
//                             <CardContent className="grid grid-cols-4 gap-8">
//                                 <div>

//                                     <label className="block text-sm mb-1">Beam Inward No</label>

//                                     <input type="text" className="w-full border px-3 py-2 h-10 rounded bg-gray-100"

//                                         {...register('beamInwardNo')} readOnly />

//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Beam Inward Date</label>
//                                     <input
//                                         type="date"
//                                         {...register("beamInwardDate", { required: "Beam Inward Date is required" })}
//                                         defaultValue={new Date().toISOString().split('T')[0]}
//                                         className="input mt-1 h-10 p-2"
//                                     />
//                                     {errors.beamInwardDate && (
//                                         <p className="mt-1 text-sm text-red-600">{errors.beamInwardDate.message}</p>
//                                     )}
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Order Type</label>
//                                     <CommonSearchableSelect
//                                         {...register("orderTypeId", {
//                                             required: "Order Type is required",
//                                         })}
//                                         options={[
//                                             { value: "1", label: "Internal" },
//                                             { value: "2", label: "External" }
//                                         ]}
//                                         placeholder="Select Order Type"
//                                         className="mt-1"
//                                         value={selectedOrderType}
//                                         onValueChange={(value: string) => {
//                                             setSelectedOrderType(value);
//                                             setSelectedSizingPlan(null);
//                                             setValue("sizingPlanId", "");
//                                             setItems([]);
//                                             setBeamItems([]);
//                                             setValue("orderTypeId", value);
//                                         }}
//                                         disabled
//                                     />
//                                     {errors.orderTypeId && (
//                                         <p className="mt-1 text-sm text-red-600">{errors.orderTypeId.message}</p>
//                                     )}
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Sizing Plan No</label>
//                                     <CommonSearchableSelect
//                                         {...register("sizingPlanId", {
//                                             required: "Sizing Plan Id is required",
//                                         })}
//                                         options={activeSizingPlanList
//                                             .filter((sp: any) => selectedOrderType && String(sp.orderTypeId) === String(selectedOrderType))
//                                             .map((sp: any) => ({
//                                                 value: String(sp.id),
//                                                 label: sp.sizingPlanNo
//                                             }))}
//                                         placeholder="Select a Sizing Plan"
//                                         className="mt-1"
//                                         value={watch("sizingPlanId")}
//                                         onValueChange={(value: string) => {
//                                             const event = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
//                                             handleSizingPlanChange(event);
//                                             setValue("sizingPlanId", value);
//                                         }}
//                                     />
//                                     {errors.sizingPlanId && (
//                                         <p className="mt-1 text-sm text-red-600">{errors.sizingPlanId.message}</p>
//                                     )}
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Sizing Vendor</label>
//                                     <CommonSearchableSelect
//                                         {...register("sizingVendorId", { required: "Vendor is required" })}
//                                         options={(selectedSizingPlan ? activeVendorList.filter((vendor: any) => vendor.id === selectedSizingPlan.vendorId) : activeVendorList).map((vendor: any) => ({
//                                             value: String(vendor.id),
//                                             label: vendor.vendorName
//                                         }))}
//                                         placeholder="Select a Sizing Vendor"
//                                         className="mt-1"
//                                         value={watch("sizingVendorId")}
//                                         onValueChange={(value: string) => setValue("sizingVendorId", value)}
//                                     />
//                                     {errors.sizingVendorId && (
//                                         <p className="mt-1 text-sm text-red-600">{errors.sizingVendorId.message}</p>
//                                     )}
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Sizing Rate</label>
//                                     <input
//                                         {...register('sizingRate')}
//                                         className="input mt-1 h-10 p-2" placeholder="Enter Sizing Rate"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">DC Number</label>
//                                     <input
//                                         {...register('dcNumber')}
//                                         className="input mt-1 h-10 p-2" placeholder="Enter DC Number"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">DC Date</label>
//                                     <input
//                                         type="date"
//                                         {...register('dcDate')}
//                                         className="input mt-1 h-10 p-2"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Remarks</label>
//                                     <input
//                                         {...register('remarks')}
//                                         className="input mt-1 h-10 p-2" placeholder="Enter Remarks"
//                                     />
//                                 </div>

//                                 {/* File Upload Section */}
//                                 <div className="col-span-2">
//                                     <label className="block text-sm font-medium mb-1">Invoice Upload</label>
//                                     <div
//                                         className={`border-2 border-dashed border-gray-300 rounded-lg ${invoiceFile ? 'p-2' : 'p-4'} flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all duration-200`}
//                                         onClick={() => invInputRef.current?.click()}
//                                     >
//                                         {!(invoiceFile || existingMedia) ? (
//                                             <>
//                                                 <ImageIcon size={24} className="text-gray-400 mb-1" />
//                                                 <span className="text-xs font-medium text-gray-700">Click to upload or drag and drop</span>
//                                                 <span className="text-[10px] text-gray-500">PNG, JPG, PDF, DOC, DOCX, XLS, XLSX</span>
//                                             </>
//                                         ) : (
//                                             <div className="flex items-center gap-3 w-full px-2">
//                                                 <div className="bg-blue-50 p-1.5 rounded text-blue-500">
//                                                     <FileText size={18} />
//                                                 </div>
//                                                 <div className="flex-1 min-w-0">
//                                                     <p className="text-xs font-medium text-gray-900 truncate">
//                                                         {invoiceFile ? invoiceFile.name : existingMedia?.originalFileName}
//                                                     </p>
//                                                     {existingMedia?.mediaUrl && !invoiceFile && (
//                                                         <a
//                                                             href={existingMedia.mediaUrl}
//                                                             target="_blank"
//                                                             rel="noopener noreferrer"
//                                                             className="text-[10px] text-blue-600 hover:underline"
//                                                             onClick={(e) => e.stopPropagation()}
//                                                         >
//                                                             View Document
//                                                         </a>
//                                                     )}
//                                                 </div>
//                                                 <button
//                                                     type="button"
//                                                     onClick={(e) => {
//                                                         e.stopPropagation();
//                                                         setInvoiceFile(null);
//                                                         setExistingMedia(null);
//                                                         setInvoiceDetails([]);
//                                                     }}
//                                                     className="text-gray-400 hover:text-red-500 transition-colors"
//                                                 >
//                                                     <X size={14} />
//                                                 </button>
//                                             </div>
//                                         )}
//                                         <input
//                                             type="file"
//                                             ref={invInputRef}
//                                             className="hidden"
//                                             onChange={handleInvoiceFileChange}
//                                             accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx"
//                                         />
//                                     </div>

//                                     {isExtracting && (
//                                         <div className="mt-1 flex items-center gap-2 text-[10px] text-blue-600">
//                                             <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
//                                             <span>Extracting data...</span>
//                                         </div>
//                                     )}

//                                     {invoiceDetails.length > 0 && !isExtracting && (
//                                         <div className="mt-1 p-1.5 bg-emerald-50 rounded border border-emerald-100 text-sm flex items-center gap-x-3">
//                                             <span className="font-semibold text-emerald-800 whitespace-nowrap">Extracted:</span>
//                                             <div className="flex flex-wrap gap-x-3">
//                                                 <span className="text-emerald-700">Inv: <strong>{invoiceDetails[0].invNo}</strong></span>
//                                                 <span className="text-emerald-700">Date: <strong>{invoiceDetails[0].invDate}</strong></span>
//                                                 <span className="text-emerald-700">Cost: <strong>{invoiceDetails[0].sizingCost}</strong></span>
//                                                 <span className="text-emerald-700">GST: <strong>{invoiceDetails[0].gstAmount}</strong></span>
//                                                 <span className="text-emerald-700">Net: <strong>{invoiceDetails[0].netTotal}</strong></span>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         <Card>
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2">
//                                     <ClipboardList size={20} /> Quality Details
//                                 </CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 <table className="w-full border-collapse border border-gray-300 text-center">
//                                     <thead className="bg-gray-100">
//                                         <tr>
//                                             <th className="border p-2">Sl.No</th>
//                                             <th className="border p-2">Fabric Code</th>
//                                             <th className="border p-2">Quality</th>
//                                             <th className="border p-2">Yarn Name</th>
//                                             <th className="border p-2">Actual Yarn</th>
//                                             <th className="border p-2">Sort Ends</th>
//                                             <th className="border p-2">Actual Ends</th>
//                                             <th className="border p-2">Fabric Panel/Width</th>
//                                             {/* <th className="border p-2">Total Ends</th> */}
//                                             <th className="border p-2">Warp Ends</th>
//                                             <th className="border p-2">Actual Warp Ends</th>
//                                             <th className="border p-2">Parts</th>
//                                             <th className="border p-2">Ends/Part</th>
//                                             <th className="border p-2">Warp Meters</th>

//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {items.map((item: any, index: any) => {
//                                             const yarnKey = item.yarnId ? String(item.yarnId) : "";
//                                             const actualYarnKey = item.actualYarn ? String(item.actualYarn) : "";
//                                             const yarnName = yarnKey ? yarnNameMap[yarnKey] || yarnKey : item.yarnId;
//                                             const actualYarnName = actualYarnKey ? yarnNameMap[actualYarnKey] || actualYarnKey : item.actualYarn;
//                                             return (
//                                                 <tr key={index} className="border">
//                                                     <td className="border p-2">{index + 1}</td>
//                                                     <td className="border p-2">{item.fabricCode || ""}</td>
//                                                     <td className="border p-2">{item.quality}</td>
//                                                     <td className="border p-2">{yarnName}</td>
//                                                     <td className="border p-2">{actualYarnName || ""}</td>
//                                                     <td className="border p-2">{item.sordEnds}</td>
//                                                     <td className="border p-2">{item.actualEnds}</td>
//                                                     <td className="border p-2">{item.fabricPanelWidth || ""}</td>
//                                                     {/* <td className="border p-2">{item.totalEnds || ""}</td> */}
//                                                     <td className="border p-2">{item.warpEnds || ""}</td>
//                                                     <td className="border p-2">{item.actualWarpEnds || ""}</td>
//                                                     <td className="border p-2">{item.parts}</td>
//                                                     <td className="border p-2">{item.endsPerPart}</td>
//                                                     <td className="border p-2">{item.wrapMeters}</td>

//                                                 </tr>
//                                             );
//                                         })}
//                                     </tbody>
//                                 </table>
//                             </CardContent>
//                         </Card>
//                     </>
//                 )}

//                 {/* <Card>
//                     <div className="flex flex-row p-6 justify-between">
//                         <div className="flex items-center gap-2">
//                             <ClipboardList size={20} /> Beam Details
//                         </div>
//                         <div className="">
//                             <Button
//                                 type="button"
//                                 onClick={() => setShowAddBeamForm(true)}
//                                 className="bg-primary hover:bg-primary text-white"
//                                 disabled={showAddBeamForm}
//                             >
//                                 <Plus size={18} className="mr-2" />
//                                 Add Beam
//                             </Button>
//                         </div>
//                     </div>
//                     <CardContent>
//                         <table className="w-full border-collapse border border-gray-300 text-center">
//                             <thead className="bg-gray-100 text-xs">
//                                 <tr>
//                                     <th className="border p-2">Sl.No</th>
//                                     <th className="border p-2 min-w-[200px]">Fabric Code/Quality</th>
//                                     <th className="border p-2 min-w-[180px]">Weaving Contract No</th>
//                                     <th className="border p-2 min-w-[180px]">Weaver</th>
//                                     <th className="border p-2 min-w-[180px]">Sales Order No</th>
//                                     <th className="border p-2 min-w-[150px]">Sized Beam No</th>
//                                     <th className="border p-2 min-w-[180px]">Empty Beam No</th>
//                                     <th className="border p-2 w-24">Width</th>
//                                     <th className="border p-2 w-24">Total Ends</th>
//                                     <th className="border p-2 w-28">Warp Meters</th>
//                                     <th className="border p-2 w-24">Shrinkage %</th>
//                                     <th className="border p-2 w-32">Expected Fabric Meter</th>
//                                     <th className="border p-2 min-w-[100px]">Actions</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="text-sm">
//                                 {showAddBeamForm && (
//                                     <tr className="bg-blue-50">
//                                         <td className="border p-2 font-medium">*</td>
//                                         <td className="border p-2 min-w-[200px]">
//                                             <CommonSearchableSelect
//                                                 value={newBeamItem.fabricId || ""}
//                                                 onValueChange={(value) => {
//                                                     const matchingContracts = activeWeavingContractList.filter((wc: any) =>
//                                                         (wc.items || []).some((it: any) => String(it.fabricCodeId) === String(value))
//                                                     );
//                                                     let newWcId = "";
//                                                     let newVendorId = "";
//                                                     if (matchingContracts.length === 1) {
//                                                         newWcId = String(matchingContracts[0].id);
//                                                         newVendorId = matchingContracts[0].vendorId ? String(matchingContracts[0].vendorId) : "";
//                                                     }
//                                                     setNewBeamItem({ ...newBeamItem, fabricId: value, weavingContractId: newWcId, weavingVendorId: newVendorId, salesOrderId: "" });
//                                                 }}
//                                                 className="w-full"
//                                                 options={(activeFabricMasterList || []).map((fm: any) => ({
//                                                     value: String(fm.id),
//                                                     label: `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}`
//                                                 }))}
//                                                 placeholder="Quality"
//                                             />
//                                         </td>
//                                         <td className="border p-2 min-w-[180px]">
//                                             <CommonSearchableSelect
//                                                 value={newBeamItem.weavingContractId}
//                                                 onValueChange={(value) => {
//                                                     const wc = activeWeavingContractList.find((w: any) => String(w.id) === value);
//                                                     const newVendorId = wc?.vendorId ? String(wc.vendorId) : newBeamItem.weavingVendorId;
//                                                     const fabricIds: string[] = Array.from(new Set((wc?.items || []).map((it: any) => String(it.fabricCodeId)).filter(Boolean)));
//                                                     const newFabricId = fabricIds.length === 1 ? fabricIds[0] : newBeamItem.fabricId;
//                                                     let newSalesOrderId = "";
//                                                     if (wc?.salesOrderNo) {
//                                                         const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderNo));
//                                                         if (matched) newSalesOrderId = String(matched.id);
//                                                     } else if (wc?.salesOrderId) {
//                                                         const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderId));
//                                                         if (matched) newSalesOrderId = String(matched.id);
//                                                     }
//                                                     setNewBeamItem({ ...newBeamItem, weavingContractId: value, weavingVendorId: newVendorId, fabricId: newFabricId, salesOrderId: newSalesOrderId });
//                                                 }}
//                                                 className="w-full"
//                                                 options={beamFormWeavingContracts.map((wc: any) => ({
//                                                     value: String(wc.id),
//                                                     label: wc.weavingContractNo
//                                                 }))}
//                                                 placeholder="Contract"
//                                             />
//                                         </td>
//                                         <td className="border p-2 min-w-[180px]">
//                                             <CommonSearchableSelect
//                                                 value={newBeamItem.weavingVendorId || ""}
//                                                 onValueChange={(value) => {
//                                                     const matchingContracts = activeWeavingContractList.filter((wc: any) => String(wc.vendorId) === String(value));
//                                                     let newWcId = "";
//                                                     let newFabricId = newBeamItem.fabricId;
//                                                     if (matchingContracts.length === 1) {
//                                                         newWcId = String(matchingContracts[0].id);
//                                                         const fabricIds: string[] = Array.from(new Set((matchingContracts[0].items || []).map((it: any) => String(it.fabricCodeId)).filter(Boolean)));
//                                                         if (fabricIds.length === 1) newFabricId = fabricIds[0];
//                                                     }
//                                                     setNewBeamItem({ ...newBeamItem, weavingVendorId: value, weavingContractId: newWcId, fabricId: newFabricId, salesOrderId: "" });
//                                                 }}
//                                                 className="w-full"
//                                                 options={beamFormWeavers.map((v: any) => ({
//                                                     value: String(v.id),
//                                                     label: v.vendorName
//                                                 }))}
//                                                 placeholder="Weaver"
//                                             />
//                                         </td>
//                                         <td className="border p-2 min-w-[180px]">
//                                             <CommonSearchableSelect
//                                                 value={newBeamItem.salesOrderId}
//                                                 onValueChange={(value) => setNewBeamItem({ ...newBeamItem, salesOrderId: value })}
//                                                 className="w-full"
//                                                 options={filteredSalesOrders?.map((so: any) => ({
//                                                     value: String(so.id),
//                                                     label: so.salesOrderNo
//                                                 }))}
//                                                 placeholder="Order"
//                                             />
//                                         </td>
//                                         <td className="border p-2 min-w-[150px]">
//                                             <input
//                                                 type="text"
//                                                 value={newBeamItem.sizedBeamNo}
//                                                 onChange={handleSizedBeamNoChange}
//                                                 onKeyDown={(e) => {
//                                                     if (e.key === ' ') e.preventDefault();
//                                                 }}
//                                                 className="input w-full p-2 h-10"
//                                                 placeholder="Sized Beam No"
//                                                 inputMode="numeric"
//                                                 pattern="[0-9]*"
//                                             />
//                                         </td>
//                                         <td className="border p-2 min-w-[180px]">
//                                             <CommonSearchableSelect
//                                                 value={isExternalOrder ? (newBeamItem.flangeId || "") : currentFlangeSelection}
//                                                 onValueChange={(value) => {
//                                                     const options = isExternalOrder ? externalFlangeOptions : flangeOptions;
//                                                     const selected = options.find((fl: any) => String(fl.id) === value);
//                                                     setNewBeamItem(prev => ({
//                                                         ...prev,
//                                                         flangeId: selected ? String(selected.id) : "",
//                                                         flangeNo: selected ? selected.flangeNo : "",
//                                                     }));
//                                                 }}
//                                                 className="w-full"
//                                                 options={(isExternalOrder ? externalFlangeOptions : flangeOptions).map((fl: any) => ({
//                                                     value: String(fl.id),
//                                                     label: fl.flangeNo
//                                                 }))}
//                                                 placeholder="Select Flange"
//                                             />
//                                         </td>
//                                         <td className="border p-2 w-24">
//                                             <input
//                                                 type="number"
//                                                 value={newBeamItem.fabricPanelWidth || ""}
//                                                 onChange={(e) => handleNewBeamWidthChange(e.target.value)}
//                                                 className="input w-full p-2 h-10"
//                                             />
//                                         </td>
//                                         <td className="border p-2 w-24">
//                                             <input
//                                                 type="number"
//                                                 value={newBeamItem.totalEnds || ""}
//                                                 onChange={(e) => handleNewBeamTotalEndsChange(e.target.value)}
//                                                 className={`input w-full p-2 h-10${isTotalEndsAuto ? " bg-gray-50" : ""}`}
//                                                 readOnly={isTotalEndsAuto}
//                                             />
//                                         </td>
//                                         <td className="border p-2 w-28">
//                                             <input
//                                                 type="number"
//                                                 value={newBeamItem.wrapMeters}
//                                                 onChange={(e) => setNewBeamItem({ ...newBeamItem, wrapMeters: e.target.value })}
//                                                 className="input w-full p-2 h-10"
//                                             />
//                                         </td>
//                                         <td className="border p-2 w-24">
//                                             <input
//                                                 type="number"
//                                                 value={newBeamItem.shrinkage}
//                                                 onChange={(e) => setNewBeamItem({ ...newBeamItem, shrinkage: e.target.value })}
//                                                 className="input w-full p-2 h-10"
//                                             />
//                                         </td>
//                                         <td className="border p-2 w-32">
//                                             <input
//                                                 type="number"
//                                                 value={newBeamItem.expectedFabricMeter}
//                                                 onChange={(e) => setNewBeamItem({ ...newBeamItem, expectedFabricMeter: e.target.value })}
//                                                 className="input w-full p-2 h-10"
//                                             />
//                                         </td>
//                                         <td className="border p-2 min-w-[100px]">
//                                             <div className="flex items-center justify-center gap-2">
//                                                 <Button
//                                                     type="button"
//                                                     onClick={handleSaveNewBeam}
//                                                     variant="ghost"
//                                                     size="sm"
//                                                     className="text-emerald-600 hover:text-emerald-800 p-2 h-10 w-10 border border-emerald-200 rounded"
//                                                 >
//                                                     <Save size={20} />
//                                                 </Button>
//                                                 <Button
//                                                     type="button"
//                                                     onClick={handleRemoveNewBeamForm}
//                                                     variant="ghost"
//                                                     size="sm"
//                                                     className="text-red-600 hover:text-red-800 p-2 h-10 w-10 border border-red-200 rounded"
//                                                 >
//                                                     <X size={20} />
//                                                 </Button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 )}
//                                 {beamItems.map((item, index) => (
//                                     <tr key={index} className="border text-sm">
//                                         <td className="border p-2">{index + 1}</td>
//                                         <td className="border p-2 w-48">
//                                             {(() => {
//                                                 const fid = String((item as any).fabricId || "");
//                                                 const u = uniqueQualities.find((u: any) => String(u.fabricId || "") === fid);
//                                                 if (u) return `${u.fabricCode} / ${u.quality}`;
//                                                 const fm = (fabricMasterList || []).find((f: any) => String(f.id) === fid || String(f.fabricCodeId) === fid);
//                                                 return fm ? `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}` : "";
//                                             })()}
//                                         </td>
//                                         <td className="border p-2">
//                                             {weavingContractList?.find((wc: any) => wc.id === parseInt(item.weavingContractId))?.weavingContractNo || item.weavingContractId}
//                                         </td>
//                                         <td className="border p-2">
//                                             {(() => {
//                                                 const ven = vendorList?.find((v: any) => v.id === parseInt(item.weavingVendorId));
//                                                 return ven?.vendorName || '';
//                                             })()}
//                                         </td>
//                                         <td className="border p-2">
//                                             {salesOrderList?.find((so: any) => so.id === parseInt(item.salesOrderId))?.salesOrderNo || item.salesOrderId}
//                                         </td>
//                                         <td className="border p-2 min-w-[150px]">
//                                             <input
//                                                 type="text"
//                                                 value={item.sizedBeamNo || ""}
//                                                 onChange={(e) => handleEditSizedBeamNo(index, e)}
//                                                 onKeyDown={(e) => {
//                                                     if (e.key === ' ') e.preventDefault();
//                                                 }}
//                                                 className="input w-full p-2 h-10 text-center"
//                                                 placeholder="Sized Beam No"
//                                                 inputMode="numeric"
//                                                 pattern="[0-9]*"
//                                                  readOnly={isInternalOrder}
//                                                 disabled={isInternalOrder}
//                                             />
//                                         </td>
//                                         <td className="border p-2 min-w-[180px]">
//                                             {isExternalOrder ? (
//                                                 (() => {
//                                                     const beamCompanyId = getCompanyIdForVendor(item.weavingVendorId);
//                                                     const beamExternalOptions = getBeamExternalFlangeOptions(item, beamCompanyId);
//                                                     const beamExternalLoading = beamCompanyId ? Boolean(externalFlangeLoadingMap[beamCompanyId]) : false;
//                                                     return (
//                                                         <select
//                                                             value={getBeamExternalFlangeSelectionValue(item)}
//                                                             onChange={(e) => handleBeamExternalFlangeSelectionChange(index, e.target.value)}
//                                                             className="input w-full p-2 h-10"
//                                                         >
//                                                             <option value="">{beamExternalLoading ? "Loading flanges..." : "Select Flange"}</option>
//                                                             {beamExternalOptions.map((fl: any) => (
//                                                                 <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
//                                                             ))}
//                                                         </select>
//                                                     );
//                                                 })()
//                                             ) : (
//                                                 <select
//                                                     value={getBeamFlangeSelectionValue(item)}
//                                                     onChange={(e) => handleBeamFlangeSelectionChange(index, e.target.value)}
//                                                     className="input w-full p-2 h-10"
//                                                     disabled={isInternalOrder}
//                                                 >
//                                                     <option value="">Select Flange</option>
//                                                     {flangeOptions.map((fl: any) => (
//                                                         <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
//                                                     ))}
//                                                 </select>
//                                             )}
//                                         </td>
//                                         <td className="border p-2">{item.fabricPanelWidth || ""}</td>
//                                         <td className="border p-2">{getExternalTotalEndsForBeam(item)}</td>
//                                         <td className="border p-2">{item.wrapMeters}</td>
//                                         <td className="border p-2">{item.shrinkage}</td>
//                                         <td className="border p-2">{item.expectedFabricMeter}</td>
//                                         <td className="border p-2">
//                                             {String(item.isReturn) === "1" ? (
//                                                 <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">Returned</span>
//                                             ) : String(item.isBeamOutwarded) === "1" ? (
//                                                 <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-700">Outwarded</span>
//                                             ) : (
//                                                 <div className="flex items-center justify-center gap-2">
//                                                     <Button
//                                                         type="button"
//                                                         onClick={() => editBeamItem(index)}
//                                                         variant="ghost"
//                                                         size="sm"
//                                                         className="text-blue-600 hover:text-blue-800 p-2 h-10 w-10 border border-blue-200 rounded"
//                                                     >
//                                                         <Edit size={20} />
//                                                     </Button>
//                                                     <Button
//                                                         type="button"
//                                                         onClick={() => deleteBeamItem(index)}
//                                                         variant="ghost"
//                                                         size="sm"
//                                                         className="text-red-600 hover:text-red-800 p-2 h-10 w-10 border border-red-200 rounded"
//                                                     >
//                                                         <X size={20} />
//                                                     </Button>
//                                                 </div>
//                                             )}
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </CardContent>
//                 </Card> */}
//                 {/* <Card>
//   <div className="flex flex-row p-6 justify-between items-center border-b">                        <div className="flex items-center gap-2">
//                             <ClipboardList size={20} className="text-gray-600" />
//                             <h3 className="text-lg font-semibold text-gray-800">Beam Details</h3>
//                         </div>
//                         <div>
//                             <Button
//                                 type="button"
//                                 onClick={() => setShowAddBeamForm(true)}
//                                 className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
//                                 disabled={showAddBeamForm}
//                             >
//                                 <Plus size={18} className="mr-2" />
//                                 Add Beam
//                             </Button>
//                         </div>
//                     </div>
//                     <CardContent className="p-0">
//                         <div className="overflow-x-auto">
//                           <table className="w-full border-collapse border border-gray-300 text-center">
//                                 <thead className="bg-gray-100">
//                                     <tr className="border border-gray-300">
//                                         <th className="border border-gray-300 p-3 text-sm font-medium">Sl.No</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[200px]">Fabric Code/Quality</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[180px]">Weaving Contract No</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[180px]">Weaver</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[180px]">Sales Order No</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[150px]">Sized Beam No</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[180px]">Empty Beam No</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-24">Width</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-24">Total Ends</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-28">Warp Meters</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-24">Shrinkage %</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-32">Expected Fabric Meter</th>
//                                         <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[120px]">Actions</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {showAddBeamForm && (
//                                         <tr className="bg-blue-50/30 hover:bg-blue-50/50 transition-colors duration-150 border border-gray-300">
//                                             <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 align-middle">*</td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <CommonSearchableSelect
//                                                     value={newBeamItem.fabricId || ""}
//                                                     onValueChange={(value: any) => setNewBeamItem({ ...newBeamItem, fabricId: value })}
//                                                     className="w-full"
//                                                     disabled={!newBeamItem.weavingContractId}
//                                                     options={(() => {
//                                                         const wcId = Number(newBeamItem.weavingContractId || 0);
//                                                         const fabricIds: string[] = Array.from(new Set((selectedSizingPlan?.sizingBeamDetails || [])
//                                                             .filter((b: any) => Number(b.weavingContractId) === wcId)
//                                                             .map((b: any) => String(b.fabricId))
//                                                             .filter(Boolean)));
//                                                         return fabricIds.map(fid => {
//                                                             const fm = (activeFabricMasterList || []).find((f: any) => String(f.id) === fid || String(f.fabricCodeId) === fid);
//                                                             const label = fm ? `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}` : fid;
//                                                             return { value: fid, label };
//                                                         });
//                                                     })()}
//                                                     placeholder="Select Quality"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <CommonSearchableSelect
//                                                     value={newBeamItem.weavingContractId}
//                                                     onValueChange={(value: any) => {
//                                                         const wc = activeWeavingContractList.find((w: any) => String(w.id) === value);
//                                                         let newSalesOrderId = "";
//                                                         if (wc?.salesOrderNo) {
//                                                             const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderNo));
//                                                             if (matched) newSalesOrderId = String(matched.id);
//                                                         } else if (wc?.salesOrderId) {
//                                                             const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderId));
//                                                             if (matched) newSalesOrderId = String(matched.id);
//                                                         }
//                                                         setNewBeamItem({ ...newBeamItem, weavingContractId: value, fabricId: "", salesOrderId: newSalesOrderId });
//                                                     }}
//                                                     className="w-full"
//                                                     disabled={!selectedSizingPlan}
//                                                     options={!selectedSizingPlan ? [] : planWeavingContracts?.map((wc: any) => ({
//                                                         value: String(wc.id),
//                                                         label: wc.weavingContractNo
//                                                     }))}
//                                                     placeholder="Select Contract"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <CommonSearchableSelect
//                                                     value={newBeamItem.weavingVendorId || ""}
//                                                     onValueChange={(value: any) => setNewBeamItem({ ...newBeamItem, weavingVendorId: value })}
//                                                     className="w-full"
//                                                     disabled={!newBeamItem.weavingContractId || !selectedSizingPlan}
//                                                     options={(!selectedSizingPlan || !newBeamItem.weavingContractId) ? [] : (() => {
//                                                         const wcId = Number(newBeamItem.weavingContractId || 0);
//                                                         const ids = Array.from(new Set((selectedSizingPlan?.sizingBeamDetails || [])
//                                                             .filter((b: any) => Number(b.weavingContractId) === wcId && b.weavingVendorId != null)
//                                                             .map((b: any) => Number(b.weavingVendorId))));
//                                                         return activeVendorList
//                                                             .filter((v: any) => ids.includes(Number(v.id)))
//                                                             .map((v: any) => ({
//                                                                 value: String(v.id),
//                                                                 label: v.vendorName
//                                                             }));
//                                                     })()}
//                                                     placeholder="Select Weaver"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <CommonSearchableSelect
//                                                     value={newBeamItem.salesOrderId}
//                                                     onValueChange={(value: any) => setNewBeamItem({ ...newBeamItem, salesOrderId: value })}
//                                                     className="w-full"
//                                                     options={filteredSalesOrders?.map((so: any) => ({
//                                                         value: String(so.id),
//                                                         label: so.salesOrderNo
//                                                     }))}
//                                                     placeholder="Select Order"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <input
//                                                     type="text"
//                                                     value={newBeamItem.sizedBeamNo}
//                                                     onChange={handleSizedBeamNoChange}
//                                                     onKeyDown={(e) => {
//                                                         if (e.key === ' ') e.preventDefault();
//                                                     }}
//                                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//                                                     placeholder="Enter Beam No"
//                                                     inputMode="numeric"
//                                                     pattern="[0-9]*"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <CommonSearchableSelect
//                                                     value={isExternalOrder ? (newBeamItem.flangeId || "") : currentFlangeSelection}
//                                                     onValueChange={(value: string) => {
//                                                         const options = isExternalOrder ? externalFlangeOptions : flangeOptions;
//                                                         const selected = options.find((fl: any) => String(fl.id) === value);
//                                                         setNewBeamItem(prev => ({
//                                                             ...prev,
//                                                             flangeId: selected ? String(selected.id) : "",
//                                                             flangeNo: selected ? selected.flangeNo : "",
//                                                         }));
//                                                     }}
//                                                     className="w-full"
//                                                     options={(isExternalOrder ? externalFlangeOptions : flangeOptions).map((fl: any) => ({
//                                                         value: String(fl.id),
//                                                         label: fl.flangeNo
//                                                     }))}
//                                                     placeholder="Select Flange"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <input
//                                                     type="number"
//                                                     value={newBeamItem.fabricPanelWidth || ""}
//                                                     onChange={(e) => handleNewBeamWidthChange(e.target.value)}
//                                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//                                                     placeholder="Width"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <input
//                                                     type="number"
//                                                     value={newBeamItem.totalEnds || ""}
//                                                     onChange={(e) => handleNewBeamTotalEndsChange(e.target.value)}
//                                                     className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${isTotalEndsAuto ? "bg-gray-50 text-gray-600" : ""}`}
//                                                     readOnly={isTotalEndsAuto}
//                                                     placeholder="Total Ends"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <input
//                                                     type="number"
//                                                     value={newBeamItem.wrapMeters}
//                                                     onChange={(e) => setNewBeamItem({ ...newBeamItem, wrapMeters: e.target.value })}
//                                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//                                                     placeholder="Warp Meters"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <input
//                                                     type="number"
//                                                     value={newBeamItem.shrinkage}
//                                                     onChange={(e) => setNewBeamItem({ ...newBeamItem, shrinkage: e.target.value })}
//                                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//                                                     placeholder="Shrinkage"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <input
//                                                     type="number"
//                                                     value={newBeamItem.expectedFabricMeter}
//                                                     onChange={(e) => setNewBeamItem({ ...newBeamItem, expectedFabricMeter: e.target.value })}
//                                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//                                                     placeholder="Expected Meter"
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 <div className="flex items-center justify-start gap-2">
//                                                     <Button
//                                                         type="button"
//                                                         onClick={handleSaveNewBeam}
//                                                         variant="ghost"
//                                                         size="sm"
//                                                         className=" bg-green-50 text-green-600 p-2 h-9 w-9 rounded-lg border border-green-600"
//                                                         title="Save"
//                                                     >
//                                                         <Save size={18} />
//                                                     </Button>
//                                                     <Button
//                                                         type="button"
//                                                         onClick={handleRemoveNewBeamForm}
//                                                         variant="ghost"
//                                                         size="sm"
//                                                         className="bg-red-50 text-red-600 p-2 h-9 w-9 rounded-lg border border-red-600"
//                                                         title="Cancel"
//                                                     >
//                                                         <X size={18} />
//                                                     </Button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     )}
//                                     {beamItems.map((item, index) => (
//                                         <tr key={index} className="hover:bg-gray-50/80 transition-colors duration-150 border border-gray-300">
//                                             <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 align-middle">{index + 1}</td>
//                                             <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">
//                                                 {(() => {
//                                                     const fid = String((item as any).fabricId || "");
//                                                     const u = uniqueQualities.find((u: any) => String(u.fabricId || "") === fid);
//                                                     if (u) return `${u.fabricCode} / ${u.quality}`;
//                                                     const fm = (fabricMasterList || []).find((f: any) => String(f.id) === fid || String(f.fabricCodeId) === fid);
//                                                     return fm ? `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}` : "-";
//                                                 })()}
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">
//                                                 {weavingContractList?.find((wc: any) => wc.id === parseInt(item.weavingContractId))?.weavingContractNo || item.weavingContractId}
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">
//                                                 {(() => {
//                                                     const ven = vendorList?.find((v: any) => v.id === parseInt(item.weavingVendorId));
//                                                     return ven?.vendorName || '-';
//                                                 })()}
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">
//                                                 {salesOrderList?.find((so: any) => so.id === parseInt(item.salesOrderId))?.salesOrderNo || item.salesOrderId}
//                                             </td>
//                                             <td className="border border-gray-300            px-4 py-3 align-middle">
//                                                 <input
//                                                     type="text"
//                                                     value={item.sizedBeamNo || ""}
//                                                     onChange={(e) => handleEditSizedBeamNo(index, e)}
//                                                     onKeyDown={(e) => {
//                                                         if (e.key === ' ') e.preventDefault();
//                                                     }}
//                                                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//                                                     placeholder="Sized Beam No"
//                                                     inputMode="numeric"
//                                                     pattern="[0-9]*"
//                                                     readOnly={isInternalOrder}
//                                                     disabled={isInternalOrder}
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 {isExternalOrder ? (
//                                                     (() => {
//                                                         const beamCompanyId = getCompanyIdForVendor(item.weavingVendorId);
//                                                         const beamExternalOptions = getBeamExternalFlangeOptions(item, beamCompanyId);
//                                                         const beamExternalLoading = beamCompanyId ? Boolean(externalFlangeLoadingMap[beamCompanyId]) : false;
//                                                         return (
//                                                             <select
//                                                                 value={getBeamExternalFlangeSelectionValue(item)}
//                                                                 onChange={(e) => handleBeamExternalFlangeSelectionChange(index, e.target.value)}
//                                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
//                                                             >
//                                                                 <option value="">{beamExternalLoading ? "Loading flanges..." : "Select Flange"}</option>
//                                                                 {beamExternalOptions.map((fl: any) => (
//                                                                     <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
//                                                                 ))}
//                                                             </select>
//                                                         );
//                                                     })()
//                                                 ) : (
//                                                     <select
//                                                         value={getBeamFlangeSelectionValue(item)}
//                                                         onChange={(e) => handleBeamFlangeSelectionChange(index, e.target.value)}
//                                                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
//                                                         disabled={isInternalOrder}
//                                                     >
//                                                         <option value="">Select Flange</option>
//                                                         {flangeOptions.map((fl: any) => (
//                                                             <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
//                                                         ))}
//                                                     </select>
//                                                 )}
//                                             </td>
//                                             <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">{item.fabricPanelWidth || "-"}</td>
//                                             <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">{getExternalTotalEndsForBeam(item) || "-"}</td>
//                                             <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">{item.wrapMeters || "-"}</td>
//                                             <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">{item.shrinkage || "-"}</td>
//                                             <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">{item.expectedFabricMeter || "-"}</td>
//                                             <td className="border border-gray-300 px-4 py-3 align-middle">
//                                                 {String(item.isReturn) === "1" ? (
//                                                     <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
//                                                         Returned
//                                                     </span>
//                                                 ) : String(item.isBeamOutwarded) === "1" ? (
//                                                     <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
//                                                         Outwarded
//                                                     </span>
//                                                 ) : (
//                                                     <div className="flex items-center justify-start gap-2">
//                                                         <Button
//                                                             type="button"
//                                                             onClick={() => editBeamItem(index)}
//                                                             variant="ghost"
//                                                             size="sm"
//                                                             className="text-blue-600 bg-blue-50 p-2 h-9 w-9 rounded-lg border border-gray-300"
//                                                             title="Edit"
//                                                         >
//                                                             <Edit size={18} />
//                                                         </Button>
//                                                         <Button
//                                                             type="button"
//                                                             onClick={() => deleteBeamItem(index)}
//                                                             variant="ghost"
//                                                             size="sm"
//                                                             className="text-red-600 bg-red-50 p-2 h-9 w-9 rounded-lg border border-gray-300"
//                                                             title="Delete"
//                                                         >
//                                                             <X size={18} />
//                                                         </Button>
//                                                     </div>
//                                                 )}
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                             {beamItems.length === 0 && !showAddBeamForm && (
//                                 <div className="text-center py-12 bg-gray-50 rounded-b-lg">
//                                     <ClipboardList size={48} className="mx-auto text-gray-400 mb-3" />
//                                     <p className="text-gray-500 text-sm">No beam details added yet</p>
//                                     <Button
//                                         type="button"
//                                         onClick={() => setShowAddBeamForm(true)}
//                                         variant="outline"
//                                         className="mt-3"
//                                     >
//                                         <Plus size={16} className="mr-2" />
//                                         Add First Beam
//                                     </Button>
//                                 </div>
//                             )}
//                         </div>
//                     </CardContent>
//                 </Card> */}
//                 <Card>
//                     <div className="flex flex-row p-6 justify-between items-center border-b">
//                         <div className="flex items-center gap-2">
//                             <ClipboardList size={20} className="text-gray-600" />
//                             <h3 className="text-lg font-semibold text-gray-800">Beam Details</h3>
//                             {beamItems.length > 0 && (
//                                 <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
//                                     {beamItems.length} {beamItems.length === 1 ? 'Beam' : 'Beams'}
//                                 </span>
//                             )}
//                         </div>
//                         <div>
//                             <Button
//                                 type="button"
//                                 onClick={() => {
//                                     // Add a new empty row to the form table
//                                     const newEmptyBeam: BeamInwardBeamDetails = {
//                                         fabricId: "",
//                                         weavingContractId: "",
//                                         weavingVendorId: "",
//                                         salesOrderId: "",
//                                         sizedBeamNo: "",
//                                         flangeId: "",
//                                         flangeNo: "",
//                                         wrapMeters: "",
//                                         shrinkage: "",
//                                         expectedFabricMeter: "",
//                                         isBeamOutwarded: "0",
//                                         sizingPlanId: selectedSizingPlan?.id ? String(selectedSizingPlan.id) : "",
//                                         fabricPanelWidth: "",
//                                         totalEnds: "",
//                                         _tempId: Date.now() + Math.random() // Add temp ID for tracking
//                                     };
//                                     setTempBeamItems([...tempBeamItems, newEmptyBeam]);
//                                 }}
//                                 className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
//                                 disabled={!selectedSizingPlan}
//                             >
//                                 <Plus size={18} className="mr-2" />
//                                 Add Beam
//                             </Button>
//                         </div>
//                     </div>

//                     <CardContent className="p-0">
//                         <div className="overflow-x-auto">
//                             {/* Add New Beam Form Section - Table Format */}
//                             {tempBeamItems.length > 0 && (
//                                 <div className="bg-blue-50/30 border-b border-gray-200 p-4 mb-4">
//                                     <div className="flex justify-between items-center mb-3">
//                                         <h4 className="text-md font-medium text-gray-700">
//                                             {isEditingBeam ? 'Edit Beam' : 'Add New Beams'}
//                                         </h4>
//                                         <Button
//                                             type="button"
//                                             onClick={() => {
//                                                 setTempBeamItems([]);
//                                                 setBeamEditingIndex(null);
//                                                 setIsEditingBeam(false);
//                                                 setEditingBeamIndex(null);
//                                             }}
//                                             variant="transparent"
//                                             size="sm"
//                                               className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
//                                         >
//                                             Cancel {isEditingBeam ? 'Edit' : 'All'}
//                                         </Button>
//                                     </div>

//                                     <table className="w-full border-collapse border border-gray-300 text-center">
//                                         <thead className="bg-gray-100">
//                                             <tr className="border border-gray-300">
//                                                 <th className="border border-gray-300 p-2">#</th>
//                                                 <th className="border border-gray-300 p-2 min-w-[200px]">Fabric Code/Quality</th>
//                                                 <th className="border border-gray-300 p-2 min-w-[180px]">Weaving Contract No</th>
//                                                 <th className="border border-gray-300 p-2 min-w-[180px]">Weaver</th>
//                                                 <th className="border border-gray-300 p-2 min-w-[180px]">Sales Order No</th>
//                                                 <th className="border border-gray-300 p-2 min-w-[150px]">Sized Beam No *</th>
//                                                 <th className="border border-gray-300 p-2 min-w-[180px]">Empty Beam No</th>
//                                                 <th className="border border-gray-300 p-2 w-24">Width</th>
//                                                 <th className="border border-gray-300 p-2 w-24">Total Ends</th>
//                                                 <th className="border border-gray-300 p-2 w-28">Warp Meters *</th>
//                                                 <th className="border border-gray-300 p-2 w-24">Shrinkage %</th>
//                                                 <th className="border border-gray-300 p-2 w-32">Expected Fabric Meter</th>
//                                                 <th className="border border-gray-300 p-2 min-w-[100px]">Actions</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {tempBeamItems.map((item, index) => (
//                                                 <tr key={item._tempId || index} className="border border-gray-300">
//                                                     <td className="border border-gray-300 p-2">{index + 1}</td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <CommonSearchableSelect
//                                                             value={item.fabricId || ""}
//                                                             onValueChange={(value) => {
//                                                                 const matchingContracts = activeWeavingContractList.filter((wc: any) =>
//                                                                     (wc.items || []).some((it: any) => String(it.fabricCodeId) === String(value))
//                                                                 );
//                                                                 let newWcId = "";
//                                                                 let newVendorId = "";
//                                                                 if (matchingContracts.length === 1) {
//                                                                     newWcId = String(matchingContracts[0].id);
//                                                                     newVendorId = matchingContracts[0].vendorId ? String(matchingContracts[0].vendorId) : "";
//                                                                 }
//                                                                 let newSalesOrderId = "";
//                                                                 if (newWcId && selectedSizingPlan?.sizingBeamDetails?.length) {
//                                                                     const wcIdNum = parseInt(newWcId);
//                                                                     const soIds = new Set(selectedSizingPlan.sizingBeamDetails.filter((b: any) => b.weavingContractId === wcIdNum).map((b: any) => b.salesOrderId).filter(Boolean));
//                                                                     const matching = activeSalesOrderList.filter((so: any) => soIds.has(so.id));
//                                                                     if (matching.length === 1) newSalesOrderId = String(matching[0].id);
//                                                                 }
//                                                                 const updated = [...tempBeamItems];
//                                                                 updated[index] = { ...item, fabricId: value, weavingContractId: newWcId, weavingVendorId: newVendorId, salesOrderId: newSalesOrderId };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             className="w-full"
//                                                             options={(activeFabricMasterList || []).map((fm: any) => ({
//                                                                 value: String(fm.id),
//                                                                 label: `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}`
//                                                             }))}
//                                                             placeholder="Select Quality"
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <CommonSearchableSelect
//                                                             value={item.weavingContractId}
//                                                             onValueChange={(value) => {
//                                                                 const wc = activeWeavingContractList.find((w: any) => String(w.id) === value);
//                                                                 const newVendorId = wc?.vendorId ? String(wc.vendorId) : item.weavingVendorId;
//                                                                 const fabricIds: string[] = Array.from(new Set((wc?.items || []).map((it: any) => String(it.fabricCodeId)).filter(Boolean)));
//                                                                 const newFabricId = fabricIds.length === 1 ? fabricIds[0] : item.fabricId;
//                                                                 let newSalesOrderId = "";
//                                                                 if (wc?.salesOrderId) {
//                                                                     const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderId));
//                                                                     if (matched) newSalesOrderId = String(matched.id);
//                                                                 } else if (wc?.salesOrderNo) {
//                                                                     const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderNo));
//                                                                     if (matched) newSalesOrderId = String(matched.id);
//                                                                 } else if (value && selectedSizingPlan?.sizingBeamDetails?.length) {
//                                                                     const wcIdNum = parseInt(value);
//                                                                     const soIds = new Set(selectedSizingPlan.sizingBeamDetails.filter((b: any) => b.weavingContractId === wcIdNum).map((b: any) => b.salesOrderId).filter(Boolean));
//                                                                     const matching = activeSalesOrderList.filter((so: any) => soIds.has(so.id));
//                                                                     if (matching.length === 1) newSalesOrderId = String(matching[0].id);
//                                                                 }
//                                                                 const updated = [...tempBeamItems];
//                                                                 updated[index] = { ...item, weavingContractId: value, weavingVendorId: newVendorId, fabricId: newFabricId, salesOrderId: newSalesOrderId };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             className="w-full"
//                                                             options={(() => {
//                                                                 const vid = String(item.weavingVendorId || "");
//                                                                 const fid = String(item.fabricId || "");
//                                                                 if (vid) {
//                                                                     let base = activeWeavingContractList.filter((wc: any) => String(wc.vendorId) === vid);
//                                                                     if (fid) {
//                                                                         const filtered = base.filter((wc: any) => (wc.items || []).some((it: any) => String(it.fabricCodeId) === fid));
//                                                                         if (filtered.length > 0) base = filtered;
//                                                                     }
//                                                                     return base.map((wc: any) => ({ value: String(wc.id), label: wc.weavingContractNo }));
//                                                                 }
//                                                                 let base: any[] = activeWeavingContractList;
//                                                                 if (fid) {
//                                                                     const filtered = base.filter((wc: any) => (wc.items || []).some((it: any) => String(it.fabricCodeId) === fid));
//                                                                     if (filtered.length > 0) base = filtered;
//                                                                 }
//                                                                 return base.map((wc: any) => ({ value: String(wc.id), label: wc.weavingContractNo }));
//                                                             })()}
//                                                             placeholder="Select Contract"
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <CommonSearchableSelect
//                                                             value={item.weavingVendorId || ""}
//                                                             onValueChange={(value) => {
//                                                                 const matchingContracts = activeWeavingContractList.filter((wc: any) => String(wc.vendorId) === String(value));
//                                                                 let newWcId = "";
//                                                                 let newFabricId = item.fabricId;
//                                                                 if (matchingContracts.length === 1) {
//                                                                     newWcId = String(matchingContracts[0].id);
//                                                                     const fabricIds: string[] = Array.from(new Set((matchingContracts[0].items || []).map((it: any) => String(it.fabricCodeId)).filter(Boolean)));
//                                                                     if (fabricIds.length === 1) newFabricId = fabricIds[0];
//                                                                 }
//                                                                 let newSalesOrderId = "";
//                                                                 if (newWcId && selectedSizingPlan?.sizingBeamDetails?.length) {
//                                                                     const wcIdNum = parseInt(newWcId);
//                                                                     const soIds = new Set(selectedSizingPlan.sizingBeamDetails.filter((b: any) => b.weavingContractId === wcIdNum).map((b: any) => b.salesOrderId).filter(Boolean));
//                                                                     const matching = activeSalesOrderList.filter((so: any) => soIds.has(so.id));
//                                                                     if (matching.length === 1) newSalesOrderId = String(matching[0].id);
//                                                                 }
//                                                                 const updated = [...tempBeamItems];
//                                                                 updated[index] = { ...item, weavingVendorId: value, weavingContractId: newWcId, fabricId: newFabricId, salesOrderId: newSalesOrderId };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             className="w-full"
//                                                             options={(() => {
//                                                                 const wcId = String(item.weavingContractId || "");
//                                                                 if (wcId) {
//                                                                     const wc = activeWeavingContractList.find((w: any) => String(w.id) === wcId);
//                                                                     if (wc?.vendorId) {
//                                                                         return weaverVendorList.filter((v: any) => String(v.id) === String(wc.vendorId)).map((v: any) => ({ value: String(v.id), label: v.vendorName }));
//                                                                     }
//                                                                 }
//                                                                 return weaverVendorList.map((v: any) => ({ value: String(v.id), label: v.vendorName }));
//                                                             })()}
//                                                             placeholder="Select Weaver"
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <CommonSearchableSelect
//                                                             value={item.salesOrderId}
//                                                             onValueChange={(value) => {
//                                                                 const updated = [...tempBeamItems];
//                                                                 updated[index] = { ...item, salesOrderId: value };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             className="w-full"
//                                                             options={(() => {
//                                                                 const wcId = item.weavingContractId;
//                                                                 if (!wcId) return [];
//                                                                 const wc = activeWeavingContractList.find((w: any) => String(w.id) === String(wcId));
//                                                                 if (!wc) return [];
//                                                                 if (wc?.salesOrderNo) {
//                                                                     const matched = activeSalesOrderList.filter((so: any) => String(so.id) === String(wc.salesOrderNo));
//                                                                     if (matched.length > 0) return matched.map((so: any) => ({ value: String(so.id), label: so.salesOrderNo }));
//                                                                 }
//                                                                 if (wc?.salesOrderId) {
//                                                                     const matched = activeSalesOrderList.filter((so: any) => String(so.id) === String(wc.salesOrderId));
//                                                                     if (matched.length > 0) return matched.map((so: any) => ({ value: String(so.id), label: so.salesOrderNo }));
//                                                                 }
//                                                                 if (selectedSizingPlan?.sizingBeamDetails?.length) {
//                                                                     const wcIdNum = parseInt(wcId);
//                                                                     if (!isNaN(wcIdNum)) {
//                                                                         const soIds = new Set(selectedSizingPlan.sizingBeamDetails.filter((b: any) => b.weavingContractId === wcIdNum).map((b: any) => b.salesOrderId).filter(Boolean));
//                                                                         const matched = activeSalesOrderList.filter((so: any) => soIds.has(so.id));
//                                                                         if (matched.length > 0) return matched.map((so: any) => ({ value: String(so.id), label: so.salesOrderNo }));
//                                                                     }
//                                                                 }
//                                                                 return [];
//                                                             })()}
//                                                             placeholder="Select Order"
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <input
//                                                             type="text"
//                                                             value={item.sizedBeamNo}
//                                                             onChange={(e) => {
//                                                                 const value = e.target.value.replace(/\s/g, "");
//                                                                 const updated = [...tempBeamItems];
//                                                                 updated[index] = { ...item, sizedBeamNo: value };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             onKeyDown={(e) => {
//                                                                 if (e.key === ' ') e.preventDefault();
//                                                             }}
//                                                             className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                                                             placeholder="Beam No"
//                                                             inputMode="numeric"
//                                                             pattern="[0-9]*"
                                                          
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <CommonSearchableSelect
//                                                             value={isExternalOrder ? getBeamExternalFlangeSelectionValue(item) : getBeamFlangeSelectionValue(item)}
//                                                             onValueChange={(value) => {
//                                                                 const beamCompanyId = getCompanyIdForVendor(item.weavingVendorId);
//                                                                 const options = isExternalOrder ? getBeamExternalFlangeOptions(item, beamCompanyId) : flangeOptions;
//                                                                 const selected = options.find((fl: any) => String(fl.id) === value);
//                                                                 const candidateFlangeNo = selected ? (selected.flangeNo ?? "").trim() : "";
//                                                                 const candidateFlangeId = selected ? String(selected.id) : "";

//                                                                 if (candidateFlangeNo || candidateFlangeId) {
//                                                                     const isDuplicateTemp = isFlangeDuplicate(candidateFlangeId || undefined, candidateFlangeNo, tempBeamItems as BeamInwardBeamDetails[], index);
//                                                                     const editExcludeIndex = isEditingBeam ? editingBeamIndex ?? undefined : undefined;
//                                                                     const isDuplicateMain = isFlangeDuplicate(candidateFlangeId || undefined, candidateFlangeNo, beamItems, editExcludeIndex);

//                                                                     if (isDuplicateTemp || isDuplicateMain) {
//                                                                         toast.error(`Empty Beam No "${selected?.flangeNo}" is already used`);
//                                                                         return;
//                                                                     }
//                                                                 }

//                                                                 const updated = [...tempBeamItems];
//                                                                 updated[index] = {
//                                                                     ...item,
//                                                                     flangeId: selected ? String(selected.id) : "",
//                                                                     flangeNo: candidateFlangeNo,
//                                                                 };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             className="w-full"
//                                                             options={(isExternalOrder ? getBeamExternalFlangeOptions(item, getCompanyIdForVendor(item.weavingVendorId)) : flangeOptions).map((fl: any) => ({
//                                                                 value: String(fl.id),
//                                                                 label: fl.flangeNo
//                                                             }))}
//                                                             placeholder="Select Flange"
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <input
//                                                             type="number"
//                                                             value={item.fabricPanelWidth || ""}
//                                                             onChange={(e) => {
//                                                                 const value = e.target.value;
//                                                                 const updated = [...tempBeamItems];
//                                                                 const base = getFabricTotalEndsBase(item.fabricId);
//                                                                 const computed = base ? computeQualityTotalEnds(base, value) : item.totalEnds;
//                                                                 updated[index] = {
//                                                                     ...item,
//                                                                     fabricPanelWidth: value,
//                                                                     totalEnds: base ? computed : item.totalEnds
//                                                                 };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                                                             placeholder="Width"
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <input
//                                                             type="number"
//                                                             value={item.totalEnds || ""}
//                                                             onChange={(e) => {
//                                                                 const updated = [...tempBeamItems];
//                                                                 updated[index] = { ...item, totalEnds: e.target.value };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             className={`w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${Boolean(getFabricTotalEndsBase(item.fabricId)) ? "bg-gray-50" : ""}`}
//                                                             readOnly={Boolean(getFabricTotalEndsBase(item.fabricId))}
//                                                             placeholder="Total Ends"
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <input
//                                                             type="number"
//                                                             value={item.wrapMeters}
//                                                             onChange={(e) => {
//                                                                 const warp = parseFloat(e.target.value);
//                                                                 const shrink = parseFloat(item.shrinkage);
//                                                                 const widthValue = parseFloat(item.fabricPanelWidth || "1");
//                                                                 const updated = [...tempBeamItems];
//                                                                 let expectedFabricMeter = item.expectedFabricMeter;
//                                                                 if (!isNaN(warp) && !isNaN(shrink)) {
//                                                                     const base = warp * widthValue;
//                                                                     expectedFabricMeter = String(base - (base * (shrink / 100)));
//                                                                 }
//                                                                 updated[index] = {
//                                                                     ...item,
//                                                                     wrapMeters: e.target.value,
//                                                                     expectedFabricMeter
//                                                                 };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                                                             placeholder="Warp Meters"
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <input
//                                                             type="number"
//                                                             value={item.shrinkage}
//                                                             onChange={(e) => {
//                                                                 const shrink = parseFloat(e.target.value);
//                                                                 const warp = parseFloat(item.wrapMeters);
//                                                                 const widthValue = parseFloat(item.fabricPanelWidth || "1");
//                                                                 const updated = [...tempBeamItems];
//                                                                 let expectedFabricMeter = item.expectedFabricMeter;
//                                                                 if (!isNaN(warp) && !isNaN(shrink)) {
//                                                                     const base = warp * widthValue;
//                                                                     expectedFabricMeter = String(base - (base * (shrink / 100)));
//                                                                 }
//                                                                 updated[index] = {
//                                                                     ...item,
//                                                                     shrinkage: e.target.value,
//                                                                     expectedFabricMeter
//                                                                 };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                                                             placeholder="Shrinkage"
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <input
//                                                             type="number"
//                                                             value={item.expectedFabricMeter}
//                                                             onChange={(e) => {
//                                                                 const updated = [...tempBeamItems];
//                                                                 updated[index] = { ...item, expectedFabricMeter: e.target.value };
//                                                                 setTempBeamItems(updated);
//                                                             }}
//                                                             className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                                                             placeholder="Expected"
//                                                         />
//                                                     </td>
//                                                     <td className="border border-gray-300 p-2">
//                                                         <div className="flex items-center justify-center gap-2">
//                                                             {/* <Button
//                                                                 type="button"
//                                                                 onClick={() => {
//                                                                     // Remove this row from temp
//                                                                     const updated = tempBeamItems.filter((_, i) => i !== index);
//                                                                     setTempBeamItems(updated);
//                                                                 }}
//                                                                 variant="ghost"
//                                                                 size="sm"
//                                                                 className="text-red-600 hover:text-red-800"
//                                                             >
//                                                                 <X size={18} />
//                                                             </Button> */}
//                                                              <Button
//                                                             type="button"
//                                                             onClick={() => {
//                                                                     // Remove this row from temp
//                                                                     const updated = tempBeamItems.filter((_, i) => i !== index);
//                                                                     setTempBeamItems(updated);
//                                                                 }}
//                                                             variant="outline"
//                                                             size="sm"
//                                                             className="text-red-600 hover:text-red-800"
//                                                         >
//                                                             <X size={18} />
//                                                         </Button>
//                                                         </div>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>

//                                     {/* <div className="flex justify-end mt-4 space-x-2">
//                                         <Button
//                                             type="button"
//                                             onClick={() => {
//                                                 // Validate all temp rows before saving
//                                                 let hasError = false;
//                                                 for (let i = 0; i < tempBeamItems.length; i++) {
//                                                     const item = tempBeamItems[i];
//                                                     if (!item.sizedBeamNo || !item.sizedBeamNo.trim()) {
//                                                         toast.error(`Row ${i + 1}: Sized Beam No is required`);
//                                                         hasError = true;
//                                                         break;
//                                                     }
//                                                     if (!item.wrapMeters || item.wrapMeters === "") {
//                                                         toast.error(`Row ${i + 1}: Warp Meters is required`);
//                                                         hasError = true;
//                                                         break;
//                                                     }
//                                                     // User requested to only keep Sized Beam No and Warp Meters mandatory
//                                                     // if (!item.fabricId || !item.weavingContractId || !item.weavingVendorId || !item.salesOrderId) {
//                                                     //   toast.error(`Row ${i + 1}: Please fill all required fields (Fabric, Contract, Weaver, Sales Order)`);
//                                                     //   hasError = true;
//                                                     //   break;
//                                                     // }
//                                                 }

//                                                 if (hasError) return;

//                                                 // Check for duplicate Sized Beam Nos in temp items
//                                                 const sizedBeamNos = new Set();
//                                                 for (let i = 0; i < tempBeamItems.length; i++) {
//                                                     const key = tempBeamItems[i].sizedBeamNo.trim().toLowerCase();
//                                                     if (sizedBeamNos.has(key)) {
//                                                         toast.error(`Duplicate Sized Beam No found in row ${i + 1}`);
//                                                         return;
//                                                     }
//                                                     sizedBeamNos.add(key);
//                                                 }

//                                                 // Check for duplicate Flange Nos in temp items
//                                                 const flangeNos = new Set();
//                                                 for (let i = 0; i < tempBeamItems.length; i++) {
//                                                     const flangeNo = (tempBeamItems[i].flangeNo || "").trim().toLowerCase();
//                                                     if (flangeNo && flangeNos.has(flangeNo)) {
//                                                         toast.error(`Duplicate Empty Beam No found in row ${i + 1}`);
//                                                         return;
//                                                     }
//                                                     if (flangeNo) flangeNos.add(flangeNo);
//                                                 }

//                                                 // Check against existing beamItems
//                                                 for (let i = 0; i < tempBeamItems.length; i++) {
//                                                     const newSizedBeamNo = tempBeamItems[i].sizedBeamNo.trim().toLowerCase();
//                                                     const existingDuplicate = beamItems.some(existing =>
//                                                         (existing.sizedBeamNo || "").trim().toLowerCase() === newSizedBeamNo
//                                                     );
//                                                     if (existingDuplicate) {
//                                                         toast.error(`Sized Beam No "${tempBeamItems[i].sizedBeamNo}" already exists`);
//                                                         return;
//                                                     }

//                                                     const newFlangeNo = (tempBeamItems[i].flangeNo || "").trim();
//                                                     const newFlangeId = tempBeamItems[i].flangeId ? String(tempBeamItems[i].flangeId) : undefined;
//                                                     if (newFlangeNo || newFlangeId) {
//                                                         if (isFlangeDuplicate(newFlangeId, newFlangeNo, beamItems)) {
//                                                             toast.error(`Empty Beam No "${tempBeamItems[i].flangeNo}" already exists`);
//                                                             return;
//                                                         }
//                                                     }
//                                                 }

//                                                 // All validations passed, add all temp items to beamItems
//                                                 const sanitizedBeams = tempBeamItems.map(item => {
//                                                     const meta = resolveFabricMeta(item.fabricId);
//                                                     const derivedTotalEnds = isExternalOrder ? getExternalTotalEndsForBeam(item) : item.totalEnds;
//                                                     return {
//                                                         ...item,
//                                                         sizedBeamNo: item.sizedBeamNo.trim(),
//                                                         fabricPanelWidth: item.fabricPanelWidth || meta?.fabricPanelWidth || "",
//                                                         totalEnds: derivedTotalEnds || meta?.totalEnds || "",
//                                                     };
//                                                 });

//                                                 setBeamItems([...beamItems, ...sanitizedBeams]);
//                                                 setTempBeamItems([]);
//                                                 setBeamEditingIndex(null);
//                                                 toast.success(`${sanitizedBeams.length} beam(s) added successfully`);
//                                             }}
//                                             className="bg-green-600 hover:bg-green-700 text-white"
//                                         >
//                                             <Save size={18} className="mr-2" />
//                                             Save All Beams ({tempBeamItems.length})
//                                         </Button>
//                                     </div> */}
//                                     <div className="flex justify-end mt-4 space-x-2">
//                                         <Button
//                                             type="button"
//                                             onClick={() => {
//                                                 if (isEditingBeam && editingBeamIndex !== null) {
//                                                     // Update existing beam
//                                                     const item = tempBeamItems[0]; // Only one item when editing
//                                                     const trimmedSizedBeamNo = item.sizedBeamNo?.trim();

//                                                     // Validate
//                                                     if (!trimmedSizedBeamNo) {
//                                                         toast.error("Sized Beam No is required");
//                                                         return;
//                                                     }
//                                                     if (!item.wrapMeters || item.wrapMeters === "") {
//                                                         toast.error("Warp Meters is required");
//                                                         return;
//                                                     }

//                                                     // Check for duplicate Sized Beam No (excluding current)
//                                                     const normalizedSizedBeamNo = trimmedSizedBeamNo.toLowerCase();
//                                                     const hasDuplicateSizedBeamNo = beamItems.some((beam, idx) => {
//                                                         if (idx === editingBeamIndex) return false;
//                                                         const existing = (beam.sizedBeamNo || "").trim().toLowerCase();
//                                                         return existing && existing === normalizedSizedBeamNo;
//                                                     });

//                                                     if (hasDuplicateSizedBeamNo) {
//                                                         toast.error("Sized Beam No already exists");
//                                                         return;
//                                                     }

//                                                     // Check for duplicate Empty Beam No (excluding current)
//                                                     const trimmedFlangeNo = (item.flangeNo || "").trim();
//                                                     const candidateFlangeId = item.flangeId ? String(item.flangeId) : undefined;
//                                                     if (trimmedFlangeNo || candidateFlangeId) {
//                                                         if (isFlangeDuplicate(candidateFlangeId, trimmedFlangeNo, beamItems, editingBeamIndex)) {
//                                                             toast.error("Empty Beam No already exists");
//                                                             return;
//                                                         }
//                                                     }

//                                                     // Update the beam
//                                                     const meta = resolveFabricMeta(item.fabricId);
//                                                     const derivedTotalEnds = isExternalOrder ? getExternalTotalEndsForBeam(item) : item.totalEnds;
//                                                     const updatedBeam: BeamInwardBeamDetails = {
//                                                         ...item,
//                                                         sizedBeamNo: trimmedSizedBeamNo,
//                                                         flangeNo: isExternalOrder ? trimmedFlangeNo : item.flangeNo,
//                                                         fabricPanelWidth: item.fabricPanelWidth || meta?.fabricPanelWidth || "",
//                                                         totalEnds: derivedTotalEnds || meta?.totalEnds || "",
//                                                     };

//                                                     const updatedBeamItems = [...beamItems];
//                                                     updatedBeamItems[editingBeamIndex] = updatedBeam;
//                                                     setBeamItems(updatedBeamItems);

//                                                     // Reset states
//                                                     setTempBeamItems([]);
//                                                     setIsEditingBeam(false);
//                                                     setEditingBeamIndex(null);

//                                                     toast.success("Beam updated successfully");
//                                                 } else {
//                                                     // Save all new beams (existing code)
//                                                     let hasError = false;
//                                                     for (let i = 0; i < tempBeamItems.length; i++) {
//                                                         const item = tempBeamItems[i];
//                                                         if (!item.sizedBeamNo || !item.sizedBeamNo.trim()) {
//                                                             toast.error(`Row ${i + 1}: Sized Beam No is required`);
//                                                             hasError = true;
//                                                             break;
//                                                         }
//                                                         if (!item.wrapMeters || item.wrapMeters === "") {
//                                                             toast.error(`Row ${i + 1}: Warp Meters is required`);
//                                                             hasError = true;
//                                                             break;
//                                                         }
//                                                     }

//                                                     if (hasError) return;

//                                                     // Check for duplicate Sized Beam Nos in temp items
//                                                     const sizedBeamNos = new Set();
//                                                     for (let i = 0; i < tempBeamItems.length; i++) {
//                                                         const key = tempBeamItems[i].sizedBeamNo.trim().toLowerCase();
//                                                         if (sizedBeamNos.has(key)) {
//                                                             toast.error(`Duplicate Sized Beam No found in row ${i + 1}`);
//                                                             return;
//                                                         }
//                                                         sizedBeamNos.add(key);
//                                                     }

//                                                     // Check for duplicate Flange Nos in temp items
//                                                     const flangeKeys = new Set<string>();
//                                                     for (let i = 0; i < tempBeamItems.length; i++) {
//                                                         const key = getFlangeKey(
//                                                             tempBeamItems[i].flangeId ? String(tempBeamItems[i].flangeId) : undefined,
//                                                             tempBeamItems[i].flangeNo
//                                                         );
//                                                         if (key && flangeKeys.has(key)) {
//                                                             toast.error(`Duplicate Empty Beam No found in row ${i + 1}`);
//                                                             return;
//                                                         }
//                                                         if (key) flangeKeys.add(key);
//                                                     }

//                                                     // Check against existing beamItems
//                                                     for (let i = 0; i < tempBeamItems.length; i++) {
//                                                         const newSizedBeamNo = tempBeamItems[i].sizedBeamNo.trim().toLowerCase();
//                                                         const existingDuplicate = beamItems.some(existing =>
//                                                             (existing.sizedBeamNo || "").trim().toLowerCase() === newSizedBeamNo
//                                                         );
//                                                         if (existingDuplicate) {
//                                                             toast.error(`Sized Beam No "${tempBeamItems[i].sizedBeamNo}" already exists`);
//                                                             return;
//                                                         }

//                                                         const newFlangeNo = (tempBeamItems[i].flangeNo || "").trim();
//                                                         const newFlangeId = tempBeamItems[i].flangeId ? String(tempBeamItems[i].flangeId) : undefined;
//                                                         if (newFlangeNo || newFlangeId) {
//                                                             if (isFlangeDuplicate(newFlangeId, newFlangeNo, beamItems)) {
//                                                                 toast.error(`Empty Beam No "${tempBeamItems[i].flangeNo}" already exists`);
//                                                                 return;
//                                                             }
//                                                         }
//                                                     }

//                                                     // All validations passed, add all temp items to beamItems
//                                                     const sanitizedBeams = tempBeamItems.map(item => {
//                                                         const meta = resolveFabricMeta(item.fabricId);
//                                                         const derivedTotalEnds = isExternalOrder ? getExternalTotalEndsForBeam(item) : item.totalEnds;
//                                                         return {
//                                                             ...item,
//                                                             sizedBeamNo: item.sizedBeamNo.trim(),
//                                                             fabricPanelWidth: item.fabricPanelWidth || meta?.fabricPanelWidth || "",
//                                                             totalEnds: derivedTotalEnds || meta?.totalEnds || "",
//                                                         };
//                                                     });

//                                                     setBeamItems([...beamItems, ...sanitizedBeams]);
//                                                     setTempBeamItems([]);
//                                                     setBeamEditingIndex(null);
//                                                     toast.success(`${sanitizedBeams.length} beam(s) added successfully`);
//                                                 }
//                                             }}
//                                             className={`${isEditingBeam ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
//                                         >
//                                             <Save size={18} className="mr-2" />
//                                             {isEditingBeam ? 'Update Beam' : `Save All Beams (${tempBeamItems.length})`}
//                                         </Button>
//                                     </div>
//                                 </div>
//                             )}

//                             {/* Main Beam Details Table */}
//                             <table className="w-full border-collapse border border-gray-300 text-center">
//                                 <thead className="bg-gray-100">
//                                     <tr className="border border-gray-300">
//                                         <th className="border border-gray-300 p-2">Sl.No</th>
//                                         <th className="border border-gray-300 p-2 min-w-[200px]">Fabric Code/Quality</th>
//                                         <th className="border border-gray-300 p-2 min-w-[180px]">Weaving Contract No</th>
//                                         <th className="border border-gray-300 p-2 min-w-[180px]">Weaver</th>
//                                         <th className="border border-gray-300 p-2 min-w-[180px]">Sales Order No</th>
//                                         <th className="border border-gray-300 p-2 min-w-[150px]">Sized Beam No</th>
//                                         <th className="border border-gray-300 p-2 min-w-[180px]">Empty Beam No</th>
//                                         <th className="border border-gray-300 p-2 w-24">Width</th>
//                                         <th className="border border-gray-300 p-2 w-24">Total Ends</th>
//                                         <th className="border border-gray-300 p-2 w-28">Warp Meters</th>
//                                         <th className="border border-gray-300 p-2 w-24">Shrinkage %</th>
//                                         <th className="border border-gray-300 p-2 w-32">Expected Fabric Meter</th>
//                                         <th className="border border-gray-300 p-2 min-w-[100px]">Actions</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {beamItems.map((item, index) => (
//                                         <tr key={index} className="border border-gray-300">
//                                             <td className="border border-gray-300 p-2">{index + 1}</td>
//                                             <td className="border border-gray-300 p-2">
//                                                 {(() => {
//                                                     const fid = String((item as any).fabricId || "");
//                                                     const u = uniqueQualities.find((u: any) => String(u.fabricId || "") === fid);
//                                                     if (u) return `${u.fabricCode} / ${u.quality}`;
//                                                     const fm = (fabricMasterList || []).find((f: any) => String(f.id) === fid || String(f.fabricCodeId) === fid);
//                                                     return fm ? `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}` : "-";
//                                                 })()}
//                                             </td>
//                                             <td className="border border-gray-300 p-2">
//                                                 {weavingContractList?.find((wc: any) => wc.id === parseInt(item.weavingContractId))?.weavingContractNo || item.weavingContractId}
//                                             </td>
//                                             <td className="border border-gray-300 p-2">
//                                                 {(() => {
//                                                     const ven = vendorList?.find((v: any) => v.id === parseInt(item.weavingVendorId));
//                                                     return ven?.vendorName || '-';
//                                                 })()}
//                                             </td>
//                                             <td className="border border-gray-300 p-2">
//                                                 {salesOrderList?.find((so: any) => so.id === parseInt(item.salesOrderId))?.salesOrderNo || item.salesOrderId}
//                                             </td>
//                                             <td className="border border-gray-300 p-2">
//                                                 <input
//                                                     type="text"
//                                                     value={item.sizedBeamNo || ""}
//                                                     onChange={(e) => handleEditSizedBeamNo(index, e)}
//                                                     onKeyDown={(e) => {
//                                                         if (e.key === ' ') e.preventDefault();
//                                                     }}
//                                                     className="input w-full text-center"
//                                                     placeholder="Enter Sized Beam No"
//                                                     inputMode="numeric"
//                                                     pattern="[0-9]*"
//                                                     readOnly
//                                                     disabled={isInternalOrder}
//                                                 />
//                                             </td>
//                                             <td className="border border-gray-300 p-2">
//                                                 {isExternalOrder ? (
//                                                     (() => {
//                                                         const beamCompanyId = getCompanyIdForVendor(item.weavingVendorId);
//                                                         const beamExternalOptions = getBeamExternalFlangeOptions(item, beamCompanyId);
//                                                         const beamExternalLoading = beamCompanyId ? Boolean(externalFlangeLoadingMap[beamCompanyId]) : false;
//                                                         return (
//                                                             <select
//                                                                 value={getBeamExternalFlangeSelectionValue(item)}
//                                                                 onChange={(e) => handleBeamExternalFlangeSelectionChange(index, e.target.value)}
//                                                                 className="input w-full"
//                                                                 disabled
//                                                             >
//                                                                 <option value="">{beamExternalLoading ? "Loading flanges..." : "Select Flange"}</option>
//                                                                 {beamExternalOptions.map((fl: any) => (
//                                                                     <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
//                                                                 ))}
//                                                             </select>
//                                                         );
//                                                     })()
//                                                 ) : (
//                                                     <select
//                                                         value={getBeamFlangeSelectionValue(item)}
//                                                         onChange={(e) => handleBeamFlangeSelectionChange(index, e.target.value)}
//                                                         className="input w-full"
//                                                         disabled={isInternalOrder}
//                                                     >
//                                                         <option value="">Select Flange</option>
//                                                         {flangeOptions.map((fl: any) => (
//                                                             <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
//                                                         ))}
//                                                     </select>
//                                                 )}
//                                             </td>
//                                             <td className="border border-gray-300 p-2">{item.fabricPanelWidth || "-"}</td>
//                                             <td className="border border-gray-300 p-2">{getExternalTotalEndsForBeam(item) || "-"}</td>
//                                             <td className="border border-gray-300 p-2">{item.wrapMeters || "-"}</td>
//                                             <td className="border border-gray-300 p-2">{item.shrinkage || "-"}</td>
//                                             <td className="border border-gray-300 p-2">{item.expectedFabricMeter || "-"}</td>
//                                             <td className="border border-gray-300 p-2">
//                                                 {String(item.isReturn) === "1" ? (
//                                                     <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">Returned</span>
//                                                 ) : String(item.isBeamOutwarded) === "1" ? (
//                                                     <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-700">Outwarded</span>
//                                                 ) : (
//                                                     <div className="flex items-center justify-center gap-2">
//                                                         <Button
//                                                             type="button"
//                                                             onClick={() => editBeamItem(index)}
//                                                             variant="outline"
//                                                             size="sm"
//                                                         >
//                                                             <Edit size={18} />
//                                                         </Button>
//                                                         <Button
//                                                             type="button"
//                                                             onClick={() => deleteBeamItem(index)}
//                                                             variant="outline"
//                                                             size="sm"
//                                                             className="text-red-600 hover:text-red-800"
//                                                         >
//                                                             <X size={18} />
//                                                         </Button>
//                                                     </div>
//                                                 )}
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>

//                             {beamItems.length === 0 && tempBeamItems.length === 0 && (
//                                 <div className="text-center py-12 bg-gray-50 rounded-b-lg">
//                                     <ClipboardList size={48} className="mx-auto text-gray-400 mb-3" />
//                                     <p className="text-gray-500 text-sm">No beam details added yet</p>
//                                     <Button
//                                         type="button"
//                                         onClick={() => {
//                                             const newEmptyBeam: BeamInwardBeamDetails = {
//                                                 fabricId: "",
//                                                 weavingContractId: "",
//                                                 weavingVendorId: "",
//                                                 salesOrderId: "",
//                                                 sizedBeamNo: "",
//                                                 flangeId: "",
//                                                 flangeNo: "",
//                                                 wrapMeters: "",
//                                                 shrinkage: "",
//                                                 expectedFabricMeter: "",
//                                                 isBeamOutwarded: "0",
//                                                 sizingPlanId: selectedSizingPlan?.id ? String(selectedSizingPlan.id) : "",
//                                                 fabricPanelWidth: "",
//                                                 totalEnds: "",
//                                                 _tempId: Date.now() + Math.random()
//                                             };
//                                             setTempBeamItems([newEmptyBeam]);
//                                         }}
//                                         variant="outline"
//                                         className="mt-3"
//                                     >
//                                         <Plus size={16} className="mr-2" />
//                                         Add First Beam
//                                     </Button>
//                                 </div>
//                             )}
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>
//             <div className="flex justify-end mt-4">
//               <Button
//                     onClick={handleSubmit(onSubmit)}
//                     className="bg-primary hover:bg-primary text-white px-6 flex items-center"
//                 >
//                     <Save size={18} className="mr-2" />
//                     {beamInwardDtl?.id ? "Update Beam Inward" : "Save Beam Inward"}
//                 </Button>
//                 </div>
//         </div>
//     );
// };

// export default BeamInwardEntry;
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { FileText, ShoppingCart, ClipboardList, Plus, Edit, Trash2, Save, ArrowLeft, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAllVendors, fetchVendorSizingRates } from "@/state/vendorSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { getAllTermsConditions } from "@/state/termsConditions";
import { getAllEmptyBeamIssue } from "@/state/emptyBeamIssueSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllFlanges } from "@/state/flangeSlice";
import { createSizingPlan, getAllSizingPlan, updateSizingPlan } from "@/state/sizingPlanSlice";
import { createBeamInward, updateBeamInward, getAllBeamInwardById, getAllBeamInward } from "@/state/beamInwardSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import apiService from "@/services/ApiService";
import documentNumberService from "@/services/DocumentNumberService";
import mediaService, { MediaDetailResponse } from "@/services/MediaUploadService";
import { toast } from "react-toastify";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { useAutoDocumentNumber } from "@/components/common/useAutoDocumentNumber";

interface BeamInwardFormData {
    id?: number;
    beamInwardDate: string;
    sizingVendorId: string;
    sizingPlanId: string;
    orderTypeId: string;
    termsConditionsId: string;
    paymentTermsId: string;
    sizingRate: string;
    emptyBeamNo: string;
    remarks: string;
    beamInwardNo: string;
    dcNumber: string;
    dcDate: string;
    sizingSetNo?: string;
    avgBeamCount?: string;
    sizingPickup?: string;
    elongation?: string;
    breaksMillion?: string;
    babyConeWt?: string;
    actualWeight?: string;
    warpingWeight?: string;
    excessShortage?: string;
    freshCone?: string;
    rewindingCone?: string;
    beamInwardQualityDetails: BeamInwardQualityDetails[];
    beamInwardBeamDetails: BeamInwardBeamDetails[];
    invoiceDetails?: InvoiceDetail[];
}


interface InvoiceDetail {
    invNo: string;
    invDate: string;
    sizingCost: number;
    gstAmount: number;
    netTotal: number;
    mediaDetailSno?: number;
    mediaSno?: number;
    invoiceUpload?: string;
}


interface BeamInwardQualityDetails {
    quality: string;
    yarnId: string;
    sordEnds: string;
    actualEnds: string;
    parts: string;
    endsPerPart: string;
    wrapMeters: string;
    fabricCode?: string;
    fabricId?: string;
    actualYarn?: string;
    warpEnds?: string;
    actualWarpEnds?: string;
    fabricPanelWidth?: string;
    totalEnds?: string;
    totalEndsBase?: string;
}

interface BeamInwardBeamDetails {
    fabricId?: string;
    weavingContractId: string;
    weavingVendorId: string;
    salesOrderId: string;
    sizedBeamNo: string;
    flangeId?: string;
    flangeNo?: string;
    wrapMeters: string;
    shrinkage: string;
    expectedFabricMeter: string;
    isBeamOutwarded: string;
    isReturn?: string;
    sizingPlanId?: string;
    fabricPanelWidth?: string;
    totalEnds?: string;
    warpCount?: string;
    warpYarnMillName?: string;
    warpYarnLotNo?: string;
    dcNumber?: string;
    dcDate?: string;
    sizingSetNo?: string;
    sizingPickupPercent?: string;
    _tempId?: number; // Add this for temporary tracking

}

const safeNumber = (value: any) => {
    if (value == null || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

const computeQualityTotalEnds = (baseValue?: string, widthValue?: string) => {
    const base = safeNumber(baseValue);
    if (base == null) return "";
    const width = safeNumber(widthValue);
    if (width == null) {
        return String(base);
    }
    const total = base * width;
    return Number.isFinite(total) ? String(total) : "";
};

const resolveQualityBaseTotalEnds = (detail: any) => {
    const candidates = [
        detail?.totalEndsBase,
        detail?.totalEndsPerUnit,
        detail?.totalEnds,
        detail?.warpEnds,
        detail?.actualWarpEnds,
        detail?.sordEnds,
        detail?.actualEnds,
        detail?.endsPerPart,
    ];
    for (const candidate of candidates) {
        if (candidate != null && String(candidate).trim() !== "") {
            return String(candidate);
        }
    }
    const width = safeNumber(detail?.fabricPanelWidth);
    const total = safeNumber(detail?.totalEnds);
    if (width && total) {
        const derived = total / width;
        return Number.isFinite(derived) ? String(derived) : "";
    }
    return "";
};

const mapQualityDetail = (detail: any): BeamInwardQualityDetails => {
    const fabricPanelWidth = detail?.fabricPanelWidth != null ? String(detail.fabricPanelWidth) : "";
    const totalEndsBase = resolveQualityBaseTotalEnds(detail);
    const computedTotalEnds = totalEndsBase
        ? computeQualityTotalEnds(totalEndsBase, fabricPanelWidth)
        : detail?.totalEnds != null
            ? String(detail.totalEnds)
            : "";
    const fabricIdValue = detail?.fabricId != null ? String(detail.fabricId) : detail?.fabricCodeId != null ? String(detail.fabricCodeId) : "";
    const fabricCodeValue = detail?.fabricCode != null ? String(detail.fabricCode) : (detail?.fabricCodeId != null ? String(detail.fabricCodeId) : "");
    return {
        quality: detail?.quality ?? "",
        yarnId: detail?.yarnId != null ? String(detail.yarnId) : "",
        sordEnds: String(detail?.sordEnds ?? ""),
        actualEnds: String(detail?.actualEnds ?? ""),
        parts: String(detail?.parts ?? ""),
        endsPerPart: String(detail?.endsPerPart ?? ""),
        wrapMeters: (() => {
            const val = detail?.wrapMeters ?? detail?.warpMeters;
            return val != null && !isNaN(Number(val)) && val !== ""
                ? Number(val).toFixed(2)
                : String(val ?? "");
        })(),
        fabricCode: fabricCodeValue,
        fabricId: fabricIdValue,
        actualYarn: detail?.actualYarn != null ? String(detail.actualYarn) : "",
        warpEnds: detail?.warpEnds != null ? String(detail.warpEnds) : "",
        actualWarpEnds: detail?.actualWarpEnds != null ? String(detail.actualWarpEnds) : "",
        fabricPanelWidth,
        totalEndsBase,
        totalEnds: computedTotalEnds,
    };
};

const deriveQualityRowBase = (row: BeamInwardQualityDetails) => {
    if (row.totalEndsBase && row.totalEndsBase.trim() !== "") {
        return row.totalEndsBase;
    }
    const totalNumeric = safeNumber(row.totalEnds);
    const widthNumeric = safeNumber(row.fabricPanelWidth);
    if (totalNumeric != null && widthNumeric != null && widthNumeric > 0) {
        const derived = totalNumeric / widthNumeric;
        return Number.isFinite(derived) ? String(derived) : "";
    }
    const fallbacks = [row.warpEnds, row.actualWarpEnds, row.sordEnds, row.actualEnds, row.endsPerPart];
    for (const candidate of fallbacks) {
        if (candidate && String(candidate).trim() !== "") {
            return String(candidate);
        }
    }
    return "";
};

const deriveDetailTotalEnds = (detail: any) => {
    if (!detail) {
        return "";
    }
    const fabricPanelWidth = detail?.fabricPanelWidth != null ? String(detail.fabricPanelWidth) : "";
    const totalEndsBase = resolveQualityBaseTotalEnds(detail);
    if (totalEndsBase) {
        return computeQualityTotalEnds(totalEndsBase, fabricPanelWidth);
    }
    if (detail?.totalEnds != null && String(detail.totalEnds).trim() !== "") {
        return String(detail.totalEnds);
    }
    return "";
};

const extractSizingPlanYarnDetails = (
    plan: any,
    yarnNameMap: Record<string, string>,
    sizingYarnIssuesList: any[] = [],
    millMap: Record<string, string> = {}
) => {
    let warpCount = "";
    let warpYarnMillName = "";
    let warpYarnLotNo = "";

    const planIdStr = plan?.id != null ? String(plan.id).trim() : (plan?.sizingPlanId != null ? String(plan.sizingPlanId).trim() : "");

    // 1. Primary source: Search in sizingYarnIssuesList by sizingPlanId
    if (planIdStr && Array.isArray(sizingYarnIssuesList) && sizingYarnIssuesList.length > 0) {
        const matchedIssueEntry = sizingYarnIssuesList.find(
            (issueEntry: any) => {
                const entryPlanId = issueEntry?.sizingPlanId != null ? String(issueEntry.sizingPlanId).trim() : "";
                return entryPlanId !== "" && entryPlanId === planIdStr;
            }
        );

        if (matchedIssueEntry) {
            const issueItems = Array.isArray(matchedIssueEntry?.sizingYarnIssue)
                ? matchedIssueEntry.sizingYarnIssue
                : Array.isArray(matchedIssueEntry?.sizingYarnIssueDetails)
                    ? matchedIssueEntry.sizingYarnIssueDetails
                    : Array.isArray(matchedIssueEntry?.sizingYarnIssues)
                        ? matchedIssueEntry.sizingYarnIssues
                        : [];

            if (issueItems.length > 0) {
                const counts: string[] = [];
                const mills: string[] = [];
                const lots: string[] = [];

                issueItems.forEach((item: any) => {
                    // Count / Yarn Name
                    const name = item.yarnName || (item.yarnId && yarnNameMap[String(item.yarnId)]) || item.actualYarn;
                    if (name) counts.push(String(name).trim());

                    // Mill Name
                    const mName = item.millName || item.mill;
                    const mIdStr = item.millId != null ? String(item.millId).trim() : "";
                    if (mName) {
                        mills.push(String(mName).trim());
                    } else if (mIdStr && millMap[mIdStr]) {
                        mills.push(String(millMap[mIdStr]).trim());
                    }

                    // Lot No
                    const lNo = item.lotNo || item.lotNumber || item.yarnLotNo;
                    if (lNo) lots.push(String(lNo).trim());
                });

                if (counts.length > 0) warpCount = Array.from(new Set(counts)).join(", ");
                if (mills.length > 0) warpYarnMillName = Array.from(new Set(mills)).join(", ");
                if (lots.length > 0) warpYarnLotNo = Array.from(new Set(lots)).join(", ");
            }

            // Fallback for warpCount from requirements if still empty
            if (!warpCount && Array.isArray(matchedIssueEntry?.requirements) && matchedIssueEntry.requirements.length > 0) {
                const firstReq = matchedIssueEntry.requirements[0];
                warpCount = firstReq.yarnName || firstReq.actualYarn || (firstReq.yarnId ? yarnNameMap[String(firstReq.yarnId)] : "") || "";
            }
        }
    }

    // 2. Secondary source: Check plan's inline yarn issue list
    if (!warpCount || !warpYarnMillName || !warpYarnLotNo) {
        const inlineIssueList = plan?.sizingYarnIssueDetails || plan?.sizingYarnIssue || plan?.yarnIssueDetails || [];
        if (Array.isArray(inlineIssueList) && inlineIssueList.length > 0) {
            const firstIssue = inlineIssueList[0];
            if (!warpCount) warpCount = firstIssue.yarnName || (firstIssue.yarnId ? yarnNameMap[String(firstIssue.yarnId)] : "") || firstIssue.count || "";
            if (!warpYarnMillName) {
                const millIdStr = firstIssue.millId != null ? String(firstIssue.millId) : "";
                warpYarnMillName = firstIssue.millName || firstIssue.mill || (millIdStr ? millMap[millIdStr] : "") || "";
            }
            if (!warpYarnLotNo) warpYarnLotNo = firstIssue.lotNo || firstIssue.lotNumber || firstIssue.yarnLotNo || "";
        }
    }

    // 3. Fallback for warpCount from plan quality details
    if (!warpCount) {
        const qualityDetails = plan?.sizingQualityDetails || plan?.qualityDetails || [];
        if (Array.isArray(qualityDetails) && qualityDetails.length > 0) {
            const firstQual = qualityDetails[0];
            const yarnIdStr = String(firstQual?.yarnId || firstQual?.actualYarn || "");
            warpCount = yarnNameMap[yarnIdStr] || (typeof firstQual?.actualYarn === 'string' ? firstQual.actualYarn : "") || firstQual?.quality || "";
        }
    }

    // 4. Direct fallbacks from plan attributes
    if (!warpCount && plan?.warpCount) warpCount = String(plan.warpCount);
    if (!warpYarnMillName && plan?.warpYarnMillName) warpYarnMillName = String(plan.warpYarnMillName);
    if (!warpYarnMillName && plan?.millName) warpYarnMillName = String(plan.millName);
    if (!warpYarnLotNo && plan?.warpYarnLotNo) warpYarnLotNo = String(plan.warpYarnLotNo);
    if (!warpYarnLotNo && plan?.lotNo) warpYarnLotNo = String(plan.lotNo);

    return {
        warpCount: String(warpCount || "").trim(),
        warpYarnMillName: String(warpYarnMillName || "").trim(),
        warpYarnLotNo: String(warpYarnLotNo || "").trim(),
    };
};

const parseIsoDateString = (val: any): string => {
    if (!val) return "";
    if (Array.isArray(val)) {
        const [y, m, d] = val;
        if (y && m && d) {
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }
    if (typeof val === 'string') {
        const clean = val.split('T')[0].trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

        const dmyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmyMatch) {
            const [, d, m, y] = dmyMatch;
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }

        const ymdMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (ymdMatch) {
            const [, y, m, d] = ymdMatch;
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }
    try {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
    } catch {}
    return "";
};

const extractList = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.content)) return res.content;
    return [];
};

const BeamInwardEntry = () => {
    const [items, setItems] = useState<BeamInwardQualityDetails[]>([]);
    const [beamItems, setBeamItems] = useState<BeamInwardBeamDetails[]>([]);
    const [isEditingBeam, setIsEditingBeam] = useState(false);
    const [editingBeamIndex, setEditingBeamIndex] = useState<number | null>(null);
    const [newItem, setNewItem] = useState<BeamInwardQualityDetails>({
        quality: "",
        yarnId: "",
        sordEnds: "",
        actualEnds: "",
        parts: "",
        endsPerPart: "",
        wrapMeters: "",
        fabricPanelWidth: "",
        totalEnds: "",
        totalEndsBase: "",
    });

    const [newBeamItem, setNewBeamItem] = useState<BeamInwardBeamDetails>({
        fabricId: "",
        weavingContractId: "",
        weavingVendorId: "",
        salesOrderId: "",
        sizedBeamNo: "",
        flangeId: "",
        flangeNo: "",
        wrapMeters: "",
        shrinkage: "",
        expectedFabricMeter: "",
        isBeamOutwarded: "0",
        sizingPlanId: "",
        fabricPanelWidth: "",
        totalEnds: "",
        dcNumber: "",
        dcDate: "",
        sizingSetNo: "",
        sizingPickupPercent: "",
    });

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [beamEditingIndex, setBeamEditingIndex] = useState<number | null>(null);
    const [showAddBeamForm, setShowAddBeamForm] = useState(false);
    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([]);
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [existingMedia, setExistingMedia] = useState<MediaDetailResponse | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const selectedCompanyId = useResolvedCompanyId();

    const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
    const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
    const { yarnList } = useSelector((state: RootState) => state.yarn);
    const { flangeList } = useSelector((state: RootState) => (state as any).flange as any);
    const { beamInwardList = [] } = useSelector((state: RootState) => (state as any).beamInward || {});

    const activeSizingPlanList = useMemo(() => (sizingPlanList || []).filter((sp: any) => sp.isActive !== false && sp.activeFlag !== false), [sizingPlanList]);
    const activeVendorList = useMemo(() => (vendorList || []).filter((v: any) => v.isActive !== false && v.activeFlag !== false), [vendorList]);
    const activeWeavingContractList = useMemo(() => (weavingContractList || []).filter((wc: any) => wc.isActive !== false && wc.activeFlag !== false), [weavingContractList]);
    const activeSalesOrderList = useMemo(() => (salesOrderList || []).filter((so: any) => so.isActive !== false && so.activeFlag !== false), [salesOrderList]);
    const activeYarnList = useMemo(() => (yarnList || []).filter((y: any) => y.isActive !== false && y.activeFlag !== false), [yarnList]);
    const activeFlangeList = useMemo(() => {
        const raw: any = flangeList;
        let list = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        return list.filter((f: any) => f.isActive !== false && f.activeFlag !== false);
    }, [flangeList]);


    const yarnNameMap = useMemo(() => {
        if (!Array.isArray(yarnList)) return {} as Record<string, string>;
        return yarnList.reduce((acc: Record<string, string>, yarn: any) => {
            if (yarn?.id) {
                acc[String(yarn.id)] = yarn.yarnName || yarn.name || yarn.label || acc[String(yarn.id)] || "";
            }
            return acc;
        }, {});
    }, [yarnList]);
    const normalizedFlangeList = useMemo(() => {
        const raw: any = flangeList;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [];
    }, [flangeList]);
    const flangeOptions = useMemo(() => {
        const map = new Map<string, { id: string; flangeNo: string } & Record<string, any>>();
        normalizedFlangeList.forEach((fl: { id: string; flangeNo: string; } & Record<string, any>) => {
            const idValue = fl?.id ?? fl?.flangeId ?? fl?.flangeNo;
            if (idValue == null) return;
            const key = String(idValue);
            if (!key) return;
            if (!map.has(key)) {
                map.set(key, { ...fl, id: key, flangeNo: String(fl?.flangeNo ?? fl?.flangeNumber ?? "") });
            }
        });

        // ONLY include flanges from beamItems if they have a flangeId AND it's not already in normalizedFlangeList
        // to avoid polluting the dropdown with transient or duplicate values.
        // Actually, if we want to allow selecting what's ALREADY there (for the current row), it's tricky.
        // But the dropdown should generally show AVAILABLE flanges.
        beamItems.forEach((beam) => {
            if (beam.flangeId && !map.has(String(beam.flangeId))) {
                map.set(String(beam.flangeId), { id: String(beam.flangeId), flangeNo: beam.flangeNo || "" });
            }
        });
        return Array.from(map.values());
    }, [normalizedFlangeList, beamItems]);

    const resolveFlangeDisplayName = useCallback((flangeId?: string, flangeNo?: string) => {
        const directFlangeNo = flangeNo?.toString().trim();
        if (directFlangeNo) return directFlangeNo;
        const idValue = flangeId ? String(flangeId).trim() : "";
        if (!idValue) return "";
        const match = normalizedFlangeList.find((fl: any) => String(fl.id) === idValue);
        return match?.flangeNo || idValue;
    }, [normalizedFlangeList]);

    const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
    const { companyMasterList, loading: companyLoading } = useSelector((state: RootState) => state.companyMaster as any);
    const normalizedCompanies = useMemo(() => {
        const raw: any = companyMasterList;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        return [];
    }, [companyMasterList]);
    const activeFabricMasterList = useMemo(() => (fabricMasterList || []).filter((f: any) => f.isActive !== false && f.activeFlag !== false), [fabricMasterList]);

    const weaverVendorList = useMemo(() => {
        return activeVendorList.filter((v: any) => {
            const typeId = String(v.vendorTypeId || "");
            const typeIds = typeId.split(",").map((t: string) => Number(t.trim()));
            return typeIds.includes(303) || typeIds.includes(307);
        });
    }, [activeVendorList]);

    const getCompanyIdForVendor = useCallback((vendorId?: string | number) => {
        if (!vendorId) return "";
        const vendor = (vendorList || []).find((v: any) => String(v.id) === String(vendorId));
        const vendorName = (vendor?.vendorName || vendor?.name || "").toString().trim().toLowerCase();
        if (!vendorName) return "";
        const match = normalizedCompanies.find((company: any) => {
            const companyNames = [company?.companyName, company?.name].filter(Boolean).map((value: any) => String(value).trim().toLowerCase());
            return companyNames.some((name: string) => name === vendorName);
        });
        if (!match) return "";
        return String(match.id ?? match.companyId ?? "");
    }, [vendorList, normalizedCompanies]);
    const weaverCompanyId = useMemo(() => getCompanyIdForVendor(newBeamItem.weavingVendorId), [getCompanyIdForVendor, newBeamItem.weavingVendorId]);
    const [numberOfLots, setNumberOfLots] = useState<string>('0');
    const [selectedOrderType, setSelectedOrderType] = useState<string>("2");
    const isInternalOrder = selectedOrderType === "1";
    const isExternalOrder = selectedOrderType === "2";

    const dispatch = useDispatch<AppDispatch>();
    const { id } = useParams();
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BeamInwardFormData>();
    const location = useLocation();
    const [fetchedBeamInwardDtl, setFetchedBeamInwardDtl] = useState<any>(null);
    const beamInwardDtl = fetchedBeamInwardDtl || location.state?.beamInwardDtl;
    const navigate = useNavigate();
    const isAddMode = !id;
    const [activeTab, setActiveTab] = useState("vendorDetails");
    const [selectedSizingPlan, setSelectedSizingPlan] = useState<any>(null);
    const [companyId, setCompanyId] = useState<number | null>(null);
    const [companyName, setCompanyName] = useState<string>("");
    const [externalFlangeCache, setExternalFlangeCache] = useState<Record<string, any[]>>({});
    const [externalFlangeLoadingMap, setExternalFlangeLoadingMap] = useState<Record<string, boolean>>({});
    const prevWeaverCompanyIdRef = useRef<string>({} as string);
    const [tempBeamItems, setTempBeamItems] = useState<any[]>([]);
    const [sizingYarnIssuesList, setSizingYarnIssuesList] = useState<any[]>([]);
    const [millMap, setMillMap] = useState<Record<string, string>>({});


    const getExternalFlangeOptionsForCompany = useCallback((companyId?: string) => {
        const key = String(companyId || "");
        if (!key) return [];
        const cached = externalFlangeCache[key];
        return Array.isArray(cached) ? cached : [];
    }, [externalFlangeCache]);
    const externalFlangeOptions = useMemo(() => {
        const baseOptions = getExternalFlangeOptionsForCompany(weaverCompanyId);

        // Additional condition: if Order Type is "External" (2), include flanges from activeFlangeList
        // where issuedToInternal is false.
        const weavingVendor = activeVendorList.find((v: any) => String(v.id) === String(newBeamItem.weavingVendorId));
        const isWeaverExternal = weavingVendor && Number(weavingVendor.isInternalVendor) === 0;

        const extraOptions: any[] = [];
        if (isExternalOrder && isWeaverExternal) {
            activeFlangeList.forEach((fl: any) => {
                // Adjust property names based on your flange object structure
                // Assuming isIssued == 1 and issuedToInternal === false (or similar)
                if (fl.issuedToInternal === false && fl.isIssued == 1) {
                    const idValue = fl.id ?? fl.flangeId;
                    if (idValue && !baseOptions.some((bo: any) => String(bo.id) === String(idValue))) {
                        extraOptions.push({
                            ...fl,
                            id: String(idValue),
                            flangeNo: String(fl.flangeNo || fl.flangeNumber || "")
                        });
                    }
                }
            });
        }

        const mergedOptions = [...baseOptions, ...extraOptions];

        if (!newBeamItem.flangeId) {
            return mergedOptions;
        }
        const exists = mergedOptions.some((fl: any) => String(fl.id) === String(newBeamItem.flangeId));
        if (exists) {
            return mergedOptions;
        }
        return [
            ...mergedOptions,
            { id: newBeamItem.flangeId, flangeNo: newBeamItem.flangeNo || "" },
        ];
    }, [getExternalFlangeOptionsForCompany, newBeamItem.flangeId, newBeamItem.flangeNo, weaverCompanyId, isExternalOrder, activeFlangeList, activeVendorList, newBeamItem.weavingVendorId]);
    const externalFlangeLoading = weaverCompanyId ? Boolean(externalFlangeLoadingMap[weaverCompanyId]) : false;
    const fetchExternalFlangesForCompany = useCallback(async (companyId: string) => {
        if (!companyId) return;
        const companyIdNumber = Number(companyId);
        if (!Number.isFinite(companyIdNumber) || companyIdNumber <= 0) {
            setExternalFlangeCache(prev => ({ ...prev, [companyId]: [] }));
            setExternalFlangeLoadingMap(prev => ({ ...prev, [companyId]: false }));
            return;
        }
        setExternalFlangeLoadingMap(prev => ({ ...prev, [companyId]: true }));
        try {
            const response = await apiService.get(`/flange/company/${companyIdNumber}?limit=10000&offset=0`);
            const fetched = Array.isArray(response?.data?.data)
                ? response.data.data
                : Array.isArray(response?.data)
                    ? response.data
                    : [];
            const filtered = fetched.filter((fl: any) => fl?.isIssued == 1);
            setExternalFlangeCache(prev => ({ ...prev, [companyId]: filtered }));
        } catch (error) {
            setExternalFlangeCache(prev => ({ ...prev, [companyId]: [] }));
        } finally {
            setExternalFlangeLoadingMap(prev => ({ ...prev, [companyId]: false }));
        }
    }, [setExternalFlangeCache, setExternalFlangeLoadingMap]);

    useEffect(() => {
        dispatch(getAllVendors({ fetchAll: true }));
        const weavingContractParams = selectedCompanyId ? { companyId: selectedCompanyId, fetchAll: true } : { fetchAll: true };
        dispatch(getAllWeavingContract(weavingContractParams));
        const salesOrderParams = selectedCompanyId ? { companyId: selectedCompanyId, fetchAll: true } : { fetchAll: true };
        dispatch(getAllSalesOrders(salesOrderParams));
        dispatch(getAllPaymentTerms({ fetchAll: true }));
        dispatch(getAllTermsConditions({ fetchAll: true }));
        dispatch(getAllEmptyBeamIssue({ fetchAll: true }));
        dispatch(getAllYarnMasters({ fetchAll: true }));
        dispatch(getAllFabricMasters({ fetchAll: true }));
        const beamInwardParams = selectedCompanyId ? { companyId: selectedCompanyId, fetchAll: true } : { fetchAll: true };
        dispatch(getAllBeamInward(beamInwardParams));
        if (selectedCompanyId) {
            dispatch(getAllFlanges({ companyId: selectedCompanyId, fetchAll: true }));
        }
    }, [dispatch, selectedCompanyId]);

    useEffect(() => {
        const fetchSizingYarnIssuesAndMills = async () => {
            try {
                const newMillMap: Record<string, string> = {};
                const processMillItem = (sc: any) => {
                    if (sc && sc.id != null) {
                        const name = sc.subCategoryName || sc.name || sc.subCategory || "";
                        if (name) {
                            newMillMap[String(sc.id)] = String(name).trim();
                        }
                    }
                };

                // Endpoint 1: Mill category specific
                const millRes1 = await apiService.get("/sub-category/by-category?categoryName=Mill&limit=10000&offset=0").catch(() => null);
                if (millRes1) {
                    const list1 = Array.isArray(millRes1)
                        ? millRes1
                        : Array.isArray(millRes1?.data?.data)
                            ? millRes1.data.data
                            : Array.isArray(millRes1?.data)
                                ? millRes1.data
                                : [];
                    list1.forEach(processMillItem);
                }

                // Endpoint 2: General sub-categories
                const millRes2 = await apiService.get("/sub-category?limit=10000&offset=0").catch(() => null);
                if (millRes2) {
                    const list2 = Array.isArray(millRes2)
                        ? millRes2
                        : Array.isArray(millRes2?.data?.data)
                            ? millRes2.data.data
                            : Array.isArray(millRes2?.data)
                                ? millRes2.data
                                : [];
                    list2.forEach(processMillItem);
                }
                setMillMap(newMillMap);

                // Fetch Sizing Yarn Issues
                let rawIssues: any[] = [];
                const url = selectedCompanyId
                    ? `/sizing-yarn-issues/company/${selectedCompanyId}?offset=0&limit=10000`
                    : `/sizing-yarn-issues?offset=0&limit=10000`;
                const issueRes = await apiService.get(url).catch(() => null);
                if (issueRes) {
                    if (Array.isArray(issueRes)) rawIssues = issueRes;
                    else if (Array.isArray(issueRes?.data)) rawIssues = issueRes.data;
                    else if (Array.isArray(issueRes?.data?.data)) rawIssues = issueRes.data.data;
                }

                if (rawIssues.length === 0 && selectedCompanyId) {
                    const genRes = await apiService.get("/sizing-yarn-issues?offset=0&limit=10000").catch(() => null);
                    if (genRes) {
                        if (Array.isArray(genRes)) rawIssues = genRes;
                        else if (Array.isArray(genRes?.data)) rawIssues = genRes.data;
                        else if (Array.isArray(genRes?.data?.data)) rawIssues = genRes.data.data;
                    }
                }
                setSizingYarnIssuesList(rawIssues);
            } catch (error) {
                console.error("Failed to fetch sizing yarn issues or mills:", error);
            }
        };
        fetchSizingYarnIssuesAndMills();
    }, [selectedCompanyId]);

    // Auto-update existing beamItems when sizingYarnIssuesList or millMap load
    useEffect(() => {
        if (beamItems.length > 0 && selectedSizingPlan) {
            const yarnInfo = extractSizingPlanYarnDetails(selectedSizingPlan, yarnNameMap, sizingYarnIssuesList, millMap);
            if (yarnInfo.warpCount || yarnInfo.warpYarnMillName || yarnInfo.warpYarnLotNo) {
                setBeamItems(prev => prev.map(item => ({
                    ...item,
                    warpCount: (item.warpCount && item.warpCount.trim() !== "") ? item.warpCount : yarnInfo.warpCount,
                    warpYarnMillName: (item.warpYarnMillName && item.warpYarnMillName.trim() !== "") ? item.warpYarnMillName : yarnInfo.warpYarnMillName,
                    warpYarnLotNo: (item.warpYarnLotNo && item.warpYarnLotNo.trim() !== "") ? item.warpYarnLotNo : yarnInfo.warpYarnLotNo,
                })));
            }
        }
    }, [sizingYarnIssuesList, millMap, selectedSizingPlan]);

    const fetchAndApplySizingRate = useCallback(async (vendorId: string | number, planObj?: any) => {
        if (!vendorId) return;
        const numericVendorId = Number(vendorId);
        if (!numericVendorId || isNaN(numericVendorId)) return;

        try {
            const ratesRes = await dispatch(fetchVendorSizingRates(numericVendorId)).unwrap();
            const rates = Array.isArray(ratesRes) ? ratesRes : (Array.isArray(ratesRes?.data) ? ratesRes.data : []);

            if (rates && rates.length > 0) {
                const activePlan = planObj || selectedSizingPlan;
                let currentYarnCount = "";
                if (activePlan) {
                    const yarnInfo = extractSizingPlanYarnDetails(activePlan, yarnNameMap, sizingYarnIssuesList, millMap);
                    currentYarnCount = yarnInfo.warpCount || "";
                }
                if (!currentYarnCount && items.length > 0) {
                    currentYarnCount = yarnNameMap[String(items[0].yarnId)] || items[0].actualYarn || items[0].quality || "";
                }

                const cleanTargetCount = currentYarnCount.trim().toLowerCase();

                let matchedRate = rates.find((r: any) => {
                    const count = (r.yarnCount || "").trim().toLowerCase();
                    return count && cleanTargetCount && (count === cleanTargetCount || cleanTargetCount.includes(count) || count.includes(cleanTargetCount));
                });

                if (!matchedRate) {
                    matchedRate = rates.find((r: any) => r.activeFlag !== false) || rates[0];
                }

                if (matchedRate && matchedRate.sizingRate != null) {
                    setValue("sizingRate", String(matchedRate.sizingRate), { shouldValidate: true, shouldDirty: true });
                }
            }
        } catch (error) {
            console.error("Failed to autofetch vendor sizing rate:", error);
        }
    }, [dispatch, selectedSizingPlan, yarnNameMap, sizingYarnIssuesList, millMap, items, setValue]);

    const watchedSizingVendorId = watch("sizingVendorId");
    const prevVendorIdRef = useRef<string>("");

    useEffect(() => {
        if (watchedSizingVendorId && watchedSizingVendorId !== prevVendorIdRef.current) {
            prevVendorIdRef.current = watchedSizingVendorId;
            if (isAddMode || !watch("sizingRate")) {
                fetchAndApplySizingRate(watchedSizingVendorId);
            }
        }
    }, [watchedSizingVendorId, isAddMode, fetchAndApplySizingRate, watch]);

    const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);
    const invInputRef = useRef<HTMLInputElement>(null);

    const handleInvoiceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setInvoiceFile(file);
        setIsExtracting(true);
        try {
            // Upload to media service first
            const base64File = await mediaService.fileToBase64(file);
            const mediaType = mediaService.getMediaType(file);

            const mediaResponse = await mediaService.uploadMedia({
                base64File,
                fileName: file.name,
                contentType: file.type,
                mediaType,
                containerName: "beam_inward_invoice",
            });
            const mediaData = mediaResponse;
            setExistingMedia(mediaData);

            // Extract data using the file object
            const extractFormData = new FormData();
            extractFormData.append("file", file);
            const response = await apiService.post("/invoice/extract", extractFormData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            const extracted = response;
            const dataArray = Array.isArray(extracted) ? extracted : [extracted];

            // Add media IDs to the extracted invoice details
            const enrichedData = dataArray.map(inv => ({
                ...inv,
                mediaDetailSno: mediaData.mediaDetailSno,
                mediaSno: mediaData.mediaSno,
                invoiceUpload: mediaData.mediaUrl
            }));

            setInvoiceDetails(enrichedData);
            toast.success("Invoice data extracted and file uploaded successfully");
        } catch (error: any) {
            console.error("Invoice processing failed:", error);
            toast.error(error?.response?.data?.message || "Failed to process invoice");
        } finally {
            setIsExtracting(false);
        }
    };

    useEffect(() => {
        if (selectedOrderType === "2") {
            if (selectedCompanyId) {
                dispatch(getAllSizingPlan({ companyId: selectedCompanyId, fetchAll: true }));
            }
        } else {
            dispatch(getAllSizingPlan({ fetchAll: true }));
        }
    }, [dispatch, selectedOrderType, selectedCompanyId]);

    const watchActualWeight = watch('actualWeight');
    const watchWarpingWeight = watch('warpingWeight');

    useEffect(() => {
        const actual = parseFloat(watchActualWeight || "");
        const warping = parseFloat(watchWarpingWeight || "");
        if (!isNaN(actual) && !isNaN(warping)) {
            const diff = (warping - actual).toFixed(2);
            setValue('excessShortage', diff);
        }
    }, [watchActualWeight, watchWarpingWeight, setValue]);

    useEffect(() => {
        if (companyLoading) return;
        if (normalizedCompanies.length === 0) {
            dispatch(getAllCompanies({ fetchAll: true }));
        }
    }, [companyLoading, normalizedCompanies.length, dispatch]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('authPayload');
            if (raw) {
                const auth = JSON.parse(raw);
                const comp =
                    auth?.user?.companies?.find((c: any) => c?.isCurrent) ||
                    auth?.user?.companies?.[0] ||
                    auth?.companies?.find((c: any) => c?.isCurrent) ||
                    auth?.companies?.[0];
                if (comp) {
                    setCompanyId(Number(comp.id));
                    setCompanyName(String(comp.name || ""));
                }
            }
        } catch { }
    }, []);

    useEffect(() => {
        if (id) {
            const fetchDtl = async () => {
                try {
                    const result = await dispatch(getAllBeamInwardById({ id: Number(id), companyId: companyId || undefined })).unwrap();
                    if (result?.data) {
                        setFetchedBeamInwardDtl(result.data);
                    } else if (result) {
                        setFetchedBeamInwardDtl(result);
                    }
                } catch (error) {
                    console.error("Failed to fetch beam inward details:", error);
                }
            };
            fetchDtl();
        }
    }, [id, dispatch, companyId]);

    useEffect(() => {
        if (beamInwardDtl) {
            reset({
                beamInwardDate: parseIsoDateString(beamInwardDtl.beamInwardDate) || new Date().toISOString().split('T')[0],
                sizingPlanId: beamInwardDtl.sizingPlanId ? String(beamInwardDtl.sizingPlanId) : "",
                sizingVendorId: String(beamInwardDtl.sizingVendorId),
                termsConditionsId: String(beamInwardDtl.termsConditionsId),
                paymentTermsId: String(beamInwardDtl.paymentTermsId),
                sizingRate: String(beamInwardDtl.sizingRate),
                emptyBeamNo: beamInwardDtl.emptyBeamNo || "",
                remarks: beamInwardDtl.remarks || "",
                dcNumber: beamInwardDtl.dcNumber ? String(beamInwardDtl.dcNumber) : "",
                dcDate: parseIsoDateString(beamInwardDtl.dcDate) || parseIsoDateString(beamInwardDtl.beamInwardDate) || new Date().toISOString().split('T')[0],
                sizingSetNo: beamInwardDtl.sizingSetNo || "",
                avgBeamCount: beamInwardDtl.avgBeamCount != null ? String(beamInwardDtl.avgBeamCount) : "",
                sizingPickup: beamInwardDtl.sizingPickup != null ? String(beamInwardDtl.sizingPickup) : "",
                elongation: beamInwardDtl.elongation != null ? String(beamInwardDtl.elongation) : "",
                breaksMillion: beamInwardDtl.breaksMillion != null ? String(beamInwardDtl.breaksMillion) : "",
                babyConeWt: beamInwardDtl.babyConeWt != null ? String(beamInwardDtl.babyConeWt) : "",
                actualWeight: beamInwardDtl.actualWeight != null ? String(beamInwardDtl.actualWeight) : "",
                warpingWeight: beamInwardDtl.warpingWeight != null ? String(beamInwardDtl.warpingWeight) : "",
                excessShortage: beamInwardDtl.excessShortage != null ? String(beamInwardDtl.excessShortage) : "",
                freshCone: beamInwardDtl.freshCone != null ? String(beamInwardDtl.freshCone) : "",
                rewindingCone: beamInwardDtl.rewindingCone != null ? String(beamInwardDtl.rewindingCone) : "",
            });

            if (beamInwardDtl.sizingPlanId) {
                setValue("sizingPlanId", String(beamInwardDtl.sizingPlanId));
            }
            if (beamInwardDtl.beamInwardNo) {
                setValue('beamInwardNo', String(beamInwardDtl.beamInwardNo), { shouldValidate: true });
            }
            setTimeout(() => {
                if (beamInwardDtl.sizingPlanId) setValue("sizingPlanId", String(beamInwardDtl.sizingPlanId));
                if (beamInwardDtl.sizingVendorId) setValue("sizingVendorId", String(beamInwardDtl.sizingVendorId));
            }, 0);

            if (beamInwardDtl.sizingPlanId) {
                const plan = sizingPlanList.find((sp: any) => sp.id === Number(beamInwardDtl.sizingPlanId));
                if (plan) {
                    setSelectedSizingPlan(plan);
                    setSelectedOrderType(String(plan.orderTypeId ?? ""));
                }
            }

            if (beamInwardDtl.beamInwardQualityDetails) {
                setItems(beamInwardDtl.beamInwardQualityDetails.map(mapQualityDetail));
            }

            if (beamInwardDtl.beamInwardBeamDetails) {
                const filteredBeams = beamInwardDtl.beamInwardBeamDetails.filter(
                    (beam: any) => String(beam?.isReturn) !== "2"
                );
                setBeamItems(filteredBeams.map((beam: any) => ({
                    ...beam,
                    fabricId: String(beam.fabricId ?? ""),
                    weavingContractId: String(beam.weavingContractId),
                    weavingVendorId: String(beam.weavingVendorId ?? beam.vendorId ?? ""),
                    salesOrderId: String(beam.salesOrderId),
                    sizedBeamNo: beam?.sizedBeamNo != null ? String(beam.sizedBeamNo).trim() : "",
                    flangeId: beam?.flangeId != null ? String(beam.flangeId) : "",
                    flangeNo: String(beam.flangeNo || ''),
                    wrapMeters: beam.wrapMeters != null && !isNaN(Number(beam.wrapMeters)) && beam.wrapMeters !== ""
                        ? Number(beam.wrapMeters).toFixed(2)
                        : String(beam.wrapMeters || ""),
                    shrinkage: String(beam.shrinkage),
                    expectedFabricMeter: beam.expectedFabricMeter != null && !isNaN(Number(beam.expectedFabricMeter)) && beam.expectedFabricMeter !== ""
                        ? Number(beam.expectedFabricMeter).toFixed(2)
                        : String(beam.expectedFabricMeter || ""),
                    isBeamOutwarded: String(beam.isBeamOutwarded ?? "0"),
                    isReturn: String(beam.isReturn ?? "0"),
                    sizingPlanId: String(beam.sizingPlanId ?? beamInwardDtl.sizingPlanId ?? ""),
                    fabricPanelWidth: beam?.fabricPanelWidth != null ? String(beam.fabricPanelWidth) : "",
                    totalEnds: beam?.totalEnds != null ? String(beam.totalEnds) : "",
                    warpCount: beam?.warpCount != null ? String(beam.warpCount) : "",
                    warpYarnMillName: beam?.warpYarnMillName != null ? String(beam.warpYarnMillName) : "",
                    warpYarnLotNo: beam?.warpYarnLotNo != null ? String(beam.warpYarnLotNo) : "",
                    sizingPickupPercent: beam?.sizingPickupPercent != null ? String(beam.sizingPickupPercent) : (beam?.sizingPickup != null ? String(beam.sizingPickup) : ""),
                })));
            }
            if (beamInwardDtl?.orderTypeId) {
                setValue("orderTypeId", String(beamInwardDtl.orderTypeId));
                setSelectedOrderType(String(beamInwardDtl.orderTypeId));
            }

            if (beamInwardDtl.invoiceDetails && beamInwardDtl.invoiceDetails.length > 0) {
                setInvoiceDetails(beamInwardDtl.invoiceDetails);
                const firstInvoice = beamInwardDtl.invoiceDetails[0];
                if (firstInvoice.invoiceUpload) {
                    setExistingMedia({
                        mediaUrl: firstInvoice.invoiceUpload,
                        mediaSno: firstInvoice.mediaSno,
                        mediaDetailSno: firstInvoice.mediaDetailSno,
                        originalFileName: "Invoice"
                    } as any);
                }
                if (firstInvoice.mediaDetailSno) {
                    mediaService.getMediaDetailByMediaDetailSno(firstInvoice.mediaDetailSno)
                        .then(detail => {
                            if (detail) setExistingMedia(detail);
                        })
                        .catch(err => console.error("Failed to fetch media detail", err));
                }
            }

        } else {
            const today = new Date().toISOString().split('T')[0];
            setValue('beamInwardDate', today);
            setValue('dcDate', "");
            setValue('dcNumber', "");
            setValue('orderTypeId', '2');
            setSelectedOrderType('2');
        }
    }, [beamInwardDtl, reset, setValue]);


    const handleSaveNewBeam = () => {
        if (
            !newBeamItem.fabricId ||
            !newBeamItem.weavingContractId ||
            !newBeamItem.weavingVendorId ||
            !newBeamItem.salesOrderId ||
            !newBeamItem.sizedBeamNo
        ) {
            alert("Please fill all required fields");
            return;
        }

        const trimmedSizedBeamNo = newBeamItem.sizedBeamNo.trim();
        if (!trimmedSizedBeamNo) {
            alert("Please fill all required fields");
            return;
        }

        const trimmedFlangeNo = (newBeamItem.flangeNo || "").trim();

        const normalizedSizedBeamNo = trimmedSizedBeamNo.toLowerCase();
        const hasDuplicateSizedBeamNo = beamItems.some((beam, index) => {
            if (beamEditingIndex !== null && index === beamEditingIndex) {
                return false;
            }
            const existing = (beam.sizedBeamNo || "").trim().toLowerCase();
            return existing && existing === normalizedSizedBeamNo;
        });

        if (hasDuplicateSizedBeamNo) {
            toast.error("Sized Beam No already exists");
            return;
        }

        const normalizedFlangeNo = trimmedFlangeNo.toLowerCase();
        if (normalizedFlangeNo) {
            const hasDuplicateFlangeNo = beamItems.some((beam, index) => {
                if (beamEditingIndex !== null && index === beamEditingIndex) {
                    return false;
                }
                const existing = (beam.flangeNo || "").trim().toLowerCase();
                return existing && existing === normalizedFlangeNo;
            });

            if (hasDuplicateFlangeNo) {
                toast.error("Empty Beam No already exists");
                return;
            }
        }

        const meta = resolveFabricMeta(newBeamItem.fabricId);
        const derivedTotalEnds = isExternalOrder ? getExternalTotalEndsForBeam(newBeamItem) : newBeamItem.totalEnds;
        const sanitizedBeam: BeamInwardBeamDetails = {
            ...newBeamItem,
            sizedBeamNo: trimmedSizedBeamNo,
            flangeNo: isExternalOrder ? trimmedFlangeNo : newBeamItem.flangeNo,
            fabricPanelWidth: newBeamItem.fabricPanelWidth || meta?.fabricPanelWidth || "",
            totalEnds: derivedTotalEnds || meta?.totalEnds || "",
            wrapMeters: newBeamItem.wrapMeters !== "" && !isNaN(Number(newBeamItem.wrapMeters))
                ? Number(newBeamItem.wrapMeters).toFixed(2)
                : newBeamItem.wrapMeters,
            expectedFabricMeter: newBeamItem.expectedFabricMeter !== "" && !isNaN(Number(newBeamItem.expectedFabricMeter))
                ? Number(newBeamItem.expectedFabricMeter).toFixed(2)
                : newBeamItem.expectedFabricMeter,
        };

        if (beamEditingIndex !== null) {
            const updated = [...beamItems];
            updated[beamEditingIndex] = sanitizedBeam;
            setBeamItems(updated);
            setBeamEditingIndex(null);
        } else {
            setBeamItems([...beamItems, sanitizedBeam]);
        }

        setNewBeamItem({
            fabricId: "",
            weavingContractId: "",
            weavingVendorId: "",
            salesOrderId: "",
            sizedBeamNo: "",
            flangeId: "",
            flangeNo: "",
            wrapMeters: "",
            shrinkage: "",
            expectedFabricMeter: "",
            isBeamOutwarded: "0",
            sizingPlanId: "",
            fabricPanelWidth: "",
            totalEnds: "",
        });
        setShowAddBeamForm(false);
    };

    const handleRemoveNewBeamForm = () => {
        setNewBeamItem({
            fabricId: "",
            weavingContractId: "",
            weavingVendorId: "",
            salesOrderId: "",
            sizedBeamNo: "",
            flangeId: "",
            flangeNo: "",
            wrapMeters: "",
            shrinkage: "",
            expectedFabricMeter: "",
            isBeamOutwarded: "0",
            sizingPlanId: "",
            fabricPanelWidth: "",
            totalEnds: "",
        });
        setShowAddBeamForm(false);
    };

    const handleQualityWidthChange = (index: number, value: string) => {
        setItems(prev => prev.map((item, rowIndex) => {
            if (rowIndex !== index) {
                return item;
            }
            const normalizedWidth = value;
            const base = deriveQualityRowBase(item);
            const computed = base ? computeQualityTotalEnds(base, normalizedWidth) : item.totalEnds;
            return {
                ...item,
                fabricPanelWidth: normalizedWidth,
                totalEndsBase: base,
                totalEnds: computed,
            };
        }));
    };

    const editItem = (index: number) => {
        setNewItem(items[index]);
        setEditingIndex(index);
    };

    // const editBeamItem = (index: number) => {
    //     const item = beamItems[index];
    //     // Add to tempBeamItems to show in the "Add New Beams" section
    //     setTempBeamItems([{ ...item, _tempId: Date.now() + Math.random() }]);
    //     // Remove from main list while editing
    //     setBeamItems(beamItems.filter((_, i) => i !== index));
    //     // Also keep these for any other legacy parts of the form
    //     setNewBeamItem(item);
    //     setBeamEditingIndex(null); // Reset because we're using tempBeamItems
    //     setShowAddBeamForm(true);
    //     // Mark as populated so useEffect doesn't overwrite with defaults
    //     setLastPopulatedIdsRef({
    //         fabricId: String(item.fabricId || ""),
    //         weavingContractId: String(item.weavingContractId || "")
    //     });
    // };

    const editBeamItem = (index: number) => {
        const item = beamItems[index];

        // Set editing mode
        setIsEditingBeam(true);
        setEditingBeamIndex(index);

        // Add to tempBeamItems for editing (single item for edit)
        setTempBeamItems([{
            ...item,
            _tempId: Date.now() + Math.random(),
            sizedBeamNo: item.sizedBeamNo || "",
            wrapMeters: item.wrapMeters || "",
            fabricId: item.fabricId || "",
            weavingContractId: item.weavingContractId || "",
            weavingVendorId: item.weavingVendorId || "",
            salesOrderId: item.salesOrderId || "",
            flangeId: item.flangeId || "",
            flangeNo: item.flangeNo || "",
            fabricPanelWidth: item.fabricPanelWidth || "",
            totalEnds: item.totalEnds || "",
            shrinkage: item.shrinkage || "",
            expectedFabricMeter: item.expectedFabricMeter || "",
            sizingPickupPercent: item.sizingPickupPercent || "",
            sizingPlanId: item.sizingPlanId || (selectedSizingPlan?.id ? String(selectedSizingPlan.id) : ""),
        }]);

        // Also update newBeamItem for any legacy references
        setNewBeamItem(item);
        setBeamEditingIndex(null);

        // Make sure the add form is visible
        setShowAddBeamForm(true);

        // Mark as populated so useEffect doesn't overwrite with defaults
        setLastPopulatedIdsRef({
            fabricId: String(item.fabricId || ""),
            weavingContractId: String(item.weavingContractId || "")
        });
    };

    //     const editBeamItem = (index: number) => {
    //   const item = beamItems[index];


    //   // Check if item already exists in tempBeamItems to avoid duplicates
    //   const alreadyInTemp = tempBeamItems.some(temp => 
    //     temp.sizedBeamNo === item.sizedBeamNo && 
    //     temp.sizedBeamNo !== ""
    //   );

    //   if (!alreadyInTemp) {
    //     // Add to tempBeamItems for editing (keep original in main list)
    //     setTempBeamItems([...tempBeamItems, { 
    //       ...item, 
    //       _tempId: Date.now() + Math.random(),
    //       sizedBeamNo: item.sizedBeamNo || "",
    //       wrapMeters: item.wrapMeters || "",
    //       fabricId: item.fabricId || "",
    //       weavingContractId: item.weavingContractId || "",
    //       weavingVendorId: item.weavingVendorId || "",
    //       salesOrderId: item.salesOrderId || "",
    //       flangeId: item.flangeId || "",
    //       flangeNo: item.flangeNo || "",
    //       fabricPanelWidth: item.fabricPanelWidth || "",
    //       totalEnds: item.totalEnds || "",
    //       shrinkage: item.shrinkage || "",
    //       expectedFabricMeter: item.expectedFabricMeter || "",
    //       sizingPlanId: item.sizingPlanId || selectedSizingPlan?.id ? String(selectedSizingPlan.id) : "",
    //     }]);
    //   }

    //   // Also update newBeamItem for any legacy references
    //   setNewBeamItem(item);
    //   setBeamEditingIndex(index); // Store the index being edited

    //   // Make sure the add form is visible
    //   setShowAddBeamForm(true);

    //   // Mark as populated
    //   setLastPopulatedIdsRef({
    //     fabricId: String(item.fabricId || ""),
    //     weavingContractId: String(item.weavingContractId || "")
    //   });

    //   toast.info("Edit the beam and click 'Save All Beams' to update");
    // };

    const deleteItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const deleteBeamItem = (index: number) => {
        setBeamItems(beamItems.filter((_, i) => i !== index));
    };

    // Auto generate document number with loading state and cleanup
    useAutoDocumentNumber({
        screenName: 'Beam Inward',
        detail: beamInwardDtl || (id ? { id: Number(id) } : undefined),
        existingValue: beamInwardDtl?.beamInwardNo,
        fieldName: 'beamInwardNo',
        setValue,
        isSavingRef,
    });

    const onSubmit = async (data: BeamInwardFormData) => {
        if (beamItems.length === 0) {
            toast.error("Atleast add one beam in Beam Details");
            return;
        }
        const isEditMode = Boolean(id);
        let beamInwardNo = data.beamInwardNo || beamInwardDtl?.beamInwardNo || "";
        if (!id && (!beamInwardNo || beamInwardNo.startsWith("Loading"))) {
            try {
                const docResponse = await documentNumberService.generateDocumentNumber({
                    screenName: 'Beam Inward'
                });
                beamInwardNo = docResponse.documentNumber;
            } catch (error) {
                console.warn("Failed to generate document number:", error);
            }
        }

        console.log('Form Data before transformation:', data);
        console.log('Selected Sizing Plan ID:', data.sizingPlanId);
        const emptySizedBeamNos = beamItems.filter(beam => !(beam.sizedBeamNo || "").trim());
        if (emptySizedBeamNos.length > 0) {
            isSavingRef.current = false;
            alert("Please fill in all Sized Beam No fields");
            return;
        }

        const requiredBeamFields: (keyof BeamInwardBeamDetails)[] = [
            "weavingContractId",
            "fabricId",
            "weavingVendorId",
            "salesOrderId",
            "sizedBeamNo",
        ];
        
        const incompleteBeamIndex = beamItems.findIndex(beam =>
            requiredBeamFields.some(field => !(String((beam as any)[field] ?? "").trim()))
        );
        if (incompleteBeamIndex !== -1) {
            toast.error(`Please fill all mandatory Beam Details fields in row ${incompleteBeamIndex + 1}`);
            return;
        }

        const seenSizedBeamNos = new Set<string>();
        const hasDuplicateSizedBeamNos = beamItems.some(beam => {
            const key = (beam.sizedBeamNo || "").trim().toLowerCase();
            if (!key) {
                return false;
            }
            if (seenSizedBeamNos.has(key)) {
                return true;
            }
            seenSizedBeamNos.add(key);
            return false;
        });

        if (hasDuplicateSizedBeamNos) {
            toast.error("Sized Beam No already exists");
            return;
        }

        let currentIssues = sizingYarnIssuesList;
        let currentMillMap = millMap;

        if (Object.keys(currentMillMap).length === 0) {
            const newMap: Record<string, string> = {};
            const processItem = (sc: any) => {
                if (sc && sc.id != null) {
                    const name = sc.subCategoryName || sc.name || sc.subCategory || "";
                    if (name) newMap[String(sc.id)] = String(name).trim();
                }
            };
            const mRes1 = await apiService.get("/sub-category/by-category?categoryName=Mill&limit=10000&offset=0").catch(() => null);
            if (mRes1) {
                const list1 = Array.isArray(mRes1) ? mRes1 : Array.isArray(mRes1?.data?.data) ? mRes1.data.data : Array.isArray(mRes1?.data) ? mRes1.data : [];
                list1.forEach(processItem);
            }
            const mRes2 = await apiService.get("/sub-category?limit=10000&offset=0").catch(() => null);
            if (mRes2) {
                const list2 = Array.isArray(mRes2) ? mRes2 : Array.isArray(mRes2?.data?.data) ? mRes2.data.data : Array.isArray(mRes2?.data) ? mRes2.data : [];
                list2.forEach(processItem);
            }
            if (Object.keys(newMap).length > 0) {
                currentMillMap = newMap;
                setMillMap(newMap);
            }
        }

        if (currentIssues.length === 0) {
            let list: any[] = [];
            const url = selectedCompanyId
                ? `/sizing-yarn-issues/company/${selectedCompanyId}?offset=0&limit=10000`
                : `/sizing-yarn-issues?offset=0&limit=10000`;
            const res = await apiService.get(url).catch(() => null);
            if (res) {
                if (Array.isArray(res)) list = res;
                else if (Array.isArray(res?.data)) list = res.data;
                else if (Array.isArray(res?.data?.data)) list = res.data.data;
            }
            if (list.length === 0 && selectedCompanyId) {
                const genRes = await apiService.get("/sizing-yarn-issues?offset=0&limit=10000").catch(() => null);
                if (genRes) {
                    if (Array.isArray(genRes)) list = genRes;
                    else if (Array.isArray(genRes?.data)) list = genRes.data;
                    else if (Array.isArray(genRes?.data?.data)) list = genRes.data.data;
                }
            }
            if (list.length > 0) {
                currentIssues = list;
                setSizingYarnIssuesList(list);
            }
        }

        const yarnInfoOnSubmit = selectedSizingPlan
            ? extractSizingPlanYarnDetails(selectedSizingPlan, yarnNameMap, currentIssues, currentMillMap)
            : { warpCount: "", warpYarnMillName: "", warpYarnLotNo: "" };

        const transformedBeamDetails = beamItems.map(beam => {
            const derivedTotal = getExternalTotalEndsForBeam(beam);
            const planForBeam = beam.sizingPlanId
                ? sizingPlanList.find((sp: any) => String(sp.id) === String(beam.sizingPlanId)) || selectedSizingPlan
                : selectedSizingPlan;
            const beamYarnInfo = planForBeam
                ? extractSizingPlanYarnDetails(planForBeam, yarnNameMap, currentIssues, currentMillMap)
                : yarnInfoOnSubmit;

            return {
                ...beam,
                fabricId: (beam.fabricId ? parseInt(beam.fabricId) : null) as any,
                weavingContractId: parseInt(beam.weavingContractId),
                weavingVendorId: parseInt(beam.weavingVendorId),
                salesOrderId: parseInt(beam.salesOrderId),
                sizedBeamNo: (beam.sizedBeamNo || "").trim(),
                flangeId: beam.flangeId ? parseInt(beam.flangeId) : null,
                flangeNo: (beam.flangeNo || "").trim(),
                wrapMeters: beam.wrapMeters !== "" && beam.wrapMeters != null && !isNaN(Number(beam.wrapMeters)) ? Number(parseFloat(String(beam.wrapMeters)).toFixed(2)) : null,
                shrinkage: beam.shrinkage !== "" && beam.shrinkage != null && !isNaN(Number(beam.shrinkage)) ? parseFloat(String(beam.shrinkage)) : null,
                expectedFabricMeter: beam.expectedFabricMeter !== "" && beam.expectedFabricMeter != null && !isNaN(Number(beam.expectedFabricMeter)) ? Number(parseFloat(String(beam.expectedFabricMeter)).toFixed(2)) : null,
                isBeamOutwarded: 0,
                sizingPlanId: parseInt(beam.sizingPlanId || data.sizingPlanId || "0") || null,
                fabricPanelWidth: parseFloat(beam.fabricPanelWidth || String(selectedSizingPlan?.sizingQualityDetails?.[0]?.fabricPanelWidth || "1")),
                totalEnds: derivedTotal ? parseFloat(derivedTotal) : null,
                warpCount: (beam.warpCount && beam.warpCount.trim() !== "") ? beam.warpCount : (beamYarnInfo.warpCount || ""),
                warpYarnMillName: (beam.warpYarnMillName && beam.warpYarnMillName.trim() !== "") ? beam.warpYarnMillName : (beamYarnInfo.warpYarnMillName || ""),
                warpYarnLotNo: (beam.warpYarnLotNo && beam.warpYarnLotNo.trim() !== "") ? beam.warpYarnLotNo : (beamYarnInfo.warpYarnLotNo || ""),
                dcNumber: beam.dcNumber || data.dcNumber || "",
                dcDate: beam.dcDate || data.dcDate || null,
                sizingSetNo: beam.sizingSetNo || data.sizingSetNo || "",
                sizingPickupPercent: beam.sizingPickupPercent && String(beam.sizingPickupPercent).trim() !== "" 
                    ? parseFloat(String(beam.sizingPickupPercent)) 
                    : (data.sizingPickup && String(data.sizingPickup).trim() !== "" ? parseFloat(String(data.sizingPickup)) : null),
            };
        });

        const seenFlangeKeys = new Set<string>();
        let duplicateFlangeNo = "";
        const hasDuplicateFlangeNos = transformedBeamDetails.some(beam => {
            const key = getFlangeKey(beam.flangeId ? String(beam.flangeId) : undefined, beam.flangeNo);
            if (!key) {
                return false;
            }
            if (seenFlangeKeys.has(key)) {
                duplicateFlangeNo = resolveFlangeDisplayName(beam.flangeId ? String(beam.flangeId) : undefined, beam.flangeNo);
                return true;
            }
            seenFlangeKeys.add(key);
            return false;
        });

        if (hasDuplicateFlangeNos) {
            toast.error(`Empty Beam No "${duplicateFlangeNo}" is duplicated in Beam Details`);
            return;
        }

        const effectiveCompanyId = selectedCompanyId ?? companyId ?? 1;
        isSavingRef.current = true;

        const payload = {
            ...data,
            beamInwardDate: data.beamInwardDate,
            sizingVendorId: parseInt(data.sizingVendorId),
            sizingPlanId: data.sizingPlanId ? parseInt(data.sizingPlanId) : null,
            termsConditionsId: parseInt(data.termsConditionsId),
            paymentTermsId: parseInt(data.paymentTermsId),
            sizingRate: parseFloat(data.sizingRate),
            beamInwardNo: beamInwardNo,
            dcNumber: data.dcNumber || "",
            dcDate: data.dcDate || null,
            orderTypeId: parseInt(data.orderTypeId),
            companyId: effectiveCompanyId,
            sourceCompanyId: effectiveCompanyId,
            destinationCompanyId: 1,
            totalBeams: beamItems.length,
            sizingSetNo: data.sizingSetNo || null,
            avgBeamCount: data.avgBeamCount ? parseFloat(data.avgBeamCount) : null,
            sizingPickup: data.sizingPickup ? parseFloat(data.sizingPickup) : null,
            elongation: data.elongation ? parseFloat(data.elongation) : null,
            breaksMillion: data.breaksMillion ? parseFloat(data.breaksMillion) : null,
            babyConeWt: data.babyConeWt ? parseFloat(data.babyConeWt) : null,
            actualWeight: data.actualWeight ? parseFloat(data.actualWeight) : null,
            warpingWeight: data.warpingWeight ? parseFloat(data.warpingWeight) : null,
            excessShortage: data.excessShortage ? parseFloat(data.excessShortage) : null,
            freshCone: data.freshCone ? parseFloat(data.freshCone) : null,
            rewindingCone: data.rewindingCone ? parseFloat(data.rewindingCone) : null,

            beamInwardQualityDetails: items.map(item => {
                const { totalEndsBase, ...rest } = item;
                return {
                    ...rest,
                    yarnId: parseInt(item.yarnId),
                    sordEnds: parseInt(item.sordEnds),
                    actualEnds: parseInt(item.actualEnds),
                    parts: parseInt(item.parts),
                    endsPerPart: parseInt(item.endsPerPart),
                    wrapMeters: Number(parseFloat(item.wrapMeters).toFixed(2)),
                    fabricPanelWidth: parseFloat(item.fabricPanelWidth || "1"),
                    totalEnds: item.totalEnds ? parseFloat(item.totalEnds) : null,
                };
            }),
            beamInwardBeamDetails: transformedBeamDetails,
            invoiceDetails: invoiceDetails.map(inv => ({
                invNo: inv.invNo,
                invDate: inv.invDate,
                sizingCost: Number(inv.sizingCost),
                gstAmount: Number(inv.gstAmount),
                netTotal: Number(inv.netTotal),
                mediaDetailSno: inv.mediaDetailSno,
                mediaSno: inv.mediaSno,
                invoiceUpload: inv.invoiceUpload
            }))
        };

        try {
            // alert(JSON.stringify(payload));
            console.log(JSON.stringify(payload))
            if (isEditMode) {
                await dispatch(updateBeamInward({
                    id: Number(id),
                    data: payload,
                    companyId: effectiveCompanyId
                })).unwrap();
            } else {
                await dispatch(createBeamInward(payload)).unwrap();
                documentNumberService.clearMemoryCache('Beam Inward');
            }
            navigate("/transaction/beam-management");
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

    const handleSizingPlanChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;

        // Reset previous plan state and clear autofetched fields
        setSelectedSizingPlan(null);
        setItems([]);
        setBeamItems([]);
        setValue("dcNumber", "", { shouldValidate: true, shouldDirty: true });
        setValue("dcDate", "", { shouldValidate: true, shouldDirty: true });
        setValue("sizingSetNo", "", { shouldValidate: true, shouldDirty: true });
        setValue("sizingPickup", "", { shouldValidate: true, shouldDirty: true });
        setValue("sizingVendorId", "");
        setValue("sizingRate", "");
        setValue("emptyBeamNo", "");
        setValue("remarks", "");

        if (!selectedId) {
            return;
        }

        const plan = sizingPlanList.find((sp: any) => sp.id === parseInt(selectedId));
        console.log('Selected Plan:', plan);

        if (plan) {
            setSelectedSizingPlan(plan);

            setValue("sizingPlanId", String(plan.id));
            setValue("sizingVendorId", String(plan.vendorId));
            setValue("termsConditionsId", String(plan.termsConditionsId));
            setValue("paymentTermsId", String(plan.paymentTermsId));
            setValue("sizingRate", String(plan.sizingRate));
            setValue("emptyBeamNo", plan.emptyBeamNo || "");
            setValue("remarks", plan.remarks || "");
            setValue("orderTypeId", String(plan.orderTypeId ?? ""));
            setSelectedOrderType(String(plan.orderTypeId ?? ""));

            if (plan.vendorId) {
                fetchAndApplySizingRate(plan.vendorId, plan);
            }

            // History autofetch logic for DC Number, DC Date, Sizing Set No, and Sizing Pickup
            let historyDCNumber = "";
            let historyDCDate = "";
            let historySizingSetNo = "";
            let historySizingPickup = "";
            try {
                let historyList: any[] = [];
                if (selectedCompanyId) {
                    const historyRes = await apiService.get(`/beam-inward/company/${selectedCompanyId}?limit=10000`).catch(() => null);
                    historyList = extractList(historyRes);
                }
                
                if (historyList.length === 0) {
                    const genHistoryRes = await apiService.get(`/beam-inward?limit=10000`).catch(() => null);
                    historyList = extractList(genHistoryRes);
                }

                if (historyList.length === 0 && Array.isArray(beamInwardList)) {
                    historyList = beamInwardList;
                }

                const targetId = String(selectedId).trim();
                const targetNo = (plan?.sizingPlanNo || "").toString().trim().toLowerCase();

                const matchingEntries = historyList.filter((entry: any) => {
                    const entryPlanId = entry.sizingPlanId != null ? String(entry.sizingPlanId).trim() : "";
                    const entryPlanNo = (entry.sizingPlanNo || entry.sizingPlan?.sizingPlanNo || "").toString().trim().toLowerCase();

                    if (entryPlanId && entryPlanId === targetId) return true;
                    if (targetNo && entryPlanNo && entryPlanNo === targetNo) return true;

                    if (Array.isArray(entry.beamInwardBeamDetails)) {
                        return entry.beamInwardBeamDetails.some((b: any) => {
                            const bPlanId = b.sizingPlanId != null ? String(b.sizingPlanId).trim() : "";
                            const bPlanNo = (b.sizingPlanNo || b.sizingPlan?.sizingPlanNo || "").toString().trim().toLowerCase();
                            if (bPlanId && bPlanId === targetId) return true;
                            if (targetNo && bPlanNo && bPlanNo === targetNo) return true;
                            return false;
                        });
                    }
                    return false;
                });

                // Sort descending by ID so latest saved entries are checked first
                matchingEntries.sort((a: any, b: any) => Number(b.id || 0) - Number(a.id || 0));

                for (const entry of matchingEntries) {
                    // 1. Prioritize dcDate from beamInwardBeamDetails over parent entry dcDate
                    if (!historyDCDate) {
                        let candidateDate: any = null;
                        if (Array.isArray(entry.beamInwardBeamDetails)) {
                            const foundBeam = entry.beamInwardBeamDetails.find((b: any) => b.dcDate);
                            if (foundBeam) candidateDate = foundBeam.dcDate;
                        }
                        if (!candidateDate) {
                            candidateDate = entry.dcDate;
                        }
                        if (candidateDate) {
                            const parsed = parseIsoDateString(candidateDate);
                            if (parsed) historyDCDate = parsed;
                        }
                    }

                    // 2. Prioritize dcNumber from beamInwardBeamDetails over parent entry dcNumber
                    if (!historyDCNumber) {
                        let candidateNum: any = null;
                        if (Array.isArray(entry.beamInwardBeamDetails)) {
                            const foundBeam = entry.beamInwardBeamDetails.find((b: any) => b.dcNumber && String(b.dcNumber).trim());
                            if (foundBeam) candidateNum = foundBeam.dcNumber;
                        }
                        if (!candidateNum) {
                            candidateNum = entry.dcNumber;
                        }
                        if (candidateNum && String(candidateNum).trim()) {
                            historyDCNumber = String(candidateNum).trim();
                        }
                    }

                    // 3. Prioritize sizingSetNo from beamInwardBeamDetails over parent entry sizingSetNo
                    if (!historySizingSetNo) {
                        let candidateSet: any = null;
                        if (Array.isArray(entry.beamInwardBeamDetails)) {
                            const foundBeam = entry.beamInwardBeamDetails.find((b: any) => b.sizingSetNo && String(b.sizingSetNo).trim());
                            if (foundBeam) candidateSet = foundBeam.sizingSetNo;
                        }
                        if (!candidateSet) {
                            candidateSet = entry.sizingSetNo;
                        }
                        if (candidateSet && String(candidateSet).trim()) {
                            historySizingSetNo = String(candidateSet).trim();
                        }
                    }

                    // 4. Prioritize sizingPickupPercent from beamInwardBeamDetails over parent entry sizingPickup
                    if (!historySizingPickup) {
                        let candidatePickup: any = null;
                        if (Array.isArray(entry.beamInwardBeamDetails)) {
                            const foundBeam = entry.beamInwardBeamDetails.find((b: any) => 
                                (b.sizingPickupPercent != null && String(b.sizingPickupPercent).trim() !== "") ||
                                (b.sizingPickup != null && String(b.sizingPickup).trim() !== "")
                            );
                            if (foundBeam) candidatePickup = foundBeam.sizingPickupPercent ?? foundBeam.sizingPickup;
                        }
                        if (candidatePickup == null || String(candidatePickup).trim() === "") {
                            candidatePickup = entry.sizingPickup;
                        }
                        if (candidatePickup != null && String(candidatePickup).trim() !== "") {
                            historySizingPickup = String(candidatePickup).trim();
                        }
                    }

                    if (historyDCDate && historyDCNumber && historySizingSetNo && historySizingPickup) break;
                }
            } catch (err) {
                console.error("Error fetching history entries for sizing plan:", err);
            }

            // Set saved dc date from previous entry if found, else set empty date (current date fallback removed)
            const effectiveDCDate = historyDCDate ? historyDCDate : "";

            setValue("dcDate", effectiveDCDate, { shouldValidate: true, shouldDirty: true });
            if (historyDCNumber) setValue("dcNumber", historyDCNumber, { shouldValidate: true, shouldDirty: true });
            if (historySizingSetNo) setValue("sizingSetNo", historySizingSetNo, { shouldValidate: true, shouldDirty: true });
            if (historySizingPickup) setValue("sizingPickup", historySizingPickup, { shouldValidate: true, shouldDirty: true });

            setNewBeamItem(prev => ({
                ...prev,
                dcNumber: historyDCNumber || prev.dcNumber || "",
                dcDate: effectiveDCDate,
                sizingSetNo: historySizingSetNo || prev.sizingSetNo || "",
                sizingPickupPercent: historySizingPickup || prev.sizingPickupPercent || "",
            }));

            let currentIssues = sizingYarnIssuesList;
            if (!currentIssues || currentIssues.length === 0) {
                try {
                    const url = selectedCompanyId
                        ? `/sizing-yarn-issues/company/${selectedCompanyId}?offset=0&limit=10000`
                        : `/sizing-yarn-issues?offset=0&limit=10000`;
                    const res = await apiService.get(url).catch(() => null);
                    currentIssues = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : (res?.data?.data || []);
                    if (currentIssues.length > 0) {
                        setSizingYarnIssuesList(currentIssues);
                    }
                } catch (err) {
                    console.error("Failed to fetch yarn issues in plan change:", err);
                }
            }

            const yarnInfo = extractSizingPlanYarnDetails(plan, yarnNameMap, currentIssues, millMap);

            if (plan.sizingQualityDetails && plan.sizingQualityDetails.length > 0) {
                setItems(plan.sizingQualityDetails.map(mapQualityDetail));
            }

            if (plan.sizingBeamDetails && plan.sizingBeamDetails.length > 0) {
                let availableBeams = plan.sizingBeamDetails.filter((b: any) => {
                    const st = b?.status;
                    return st === 0 || st === "0" || st === undefined || st === null;
                });

                if (availableBeams.length === 0) {
                    const hasActiveInwardForPlan = Array.isArray(beamInwardList) && beamInwardList.some((bi: any) => 
                        String(bi.sizingPlanId) === String(plan.id) && (!id || String(bi.id) !== String(id))
                    );
                    if (!hasActiveInwardForPlan) {
                        availableBeams = plan.sizingBeamDetails;
                    }
                }

                // Check for duplicate Flange Nos in the plan itself
                const seenFlanges = new Set<string>();
                const duplicateFlanges = new Set<string>();
                availableBeams.forEach((b: any) => {
                    const fno = (b.flangeNo || "").trim().toLowerCase();
                    if (fno) {
                        if (seenFlanges.has(fno)) {
                            duplicateFlanges.add(b.flangeNo);
                        }
                        seenFlanges.add(fno);
                    }
                });

                if (duplicateFlanges.size > 0) {
                    toast.warn(`Selected Sizing Plan contains duplicate Flange Nos: ${Array.from(duplicateFlanges).join(", ")}. Please correct them.`);
                }

                const planFPW = String(plan?.sizingQualityDetails?.[0]?.fabricPanelWidth ?? "1");
                setBeamItems(availableBeams.map((b: any) => {
                    const warp = Number(b.warpMeters ?? 0) || 0;
                    const shrink = Number(b.shrinkage ?? 0) || 0;
                    const fpw = Number(b.fabricPanelWidth ?? planFPW) || 1;
                    const base = warp * fpw;
                    const efmCalc = base - (base * (shrink / 100));
                    const meta = resolveFabricMeta(b.fabricId ?? b.fabricCodeId);
                    const widthValue = meta?.fabricPanelWidth || String(fpw);
                    const totalEndsValue = meta?.totalEnds || "";
                    return {
                        fabricId: String(b.fabricId ?? ""),
                        weavingContractId: String(b.weavingContractId ?? ""),
                        weavingVendorId: String(b.weavingVendorId ?? ""),
                        salesOrderId: String(b.salesOrderId ?? ""),
                        sizedBeamNo: "",
                        flangeId: String(b.flangeId ?? ""),
                        flangeNo: String(b.flangeNo ?? ""),
                        wrapMeters: warp ? Number(warp).toFixed(2) : "",
                        shrinkage: String(shrink || ""),
                        expectedFabricMeter: b.expectedFabricMeter != null && !isNaN(Number(b.expectedFabricMeter))
                            ? Number(b.expectedFabricMeter).toFixed(2)
                            : (isNaN(efmCalc) ? "" : Number(efmCalc).toFixed(2)),
                        isBeamOutwarded: "0",
                        sizingPlanId: String(plan.id),
                        fabricPanelWidth: widthValue,
                        totalEnds: totalEndsValue,
                        warpCount: b.warpCount || yarnInfo.warpCount || "",
                        warpYarnMillName: b.warpYarnMillName || yarnInfo.warpYarnMillName || "",
                        warpYarnLotNo: b.warpYarnLotNo || yarnInfo.warpYarnLotNo || "",
                        dcNumber: historyDCNumber || b.dcNumber || watch("dcNumber") || "",
                        dcDate: effectiveDCDate,
                        sizingSetNo: historySizingSetNo || b.sizingSetNo || watch("sizingSetNo") || "",
                        sizingPickupPercent: b.sizingPickupPercent != null && String(b.sizingPickupPercent).trim() !== ""
                            ? String(b.sizingPickupPercent)
                            : (historySizingPickup || watch("sizingPickup") || ""),
                    } as BeamInwardBeamDetails;
                }));
            } else {
                setBeamItems([]);
            }
        }
    };

    const handleSizedBeamNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\s/g, "");
        setNewBeamItem({
            ...newBeamItem,
            sizedBeamNo: value
        });
    };

    const handleEditSizedBeamNo = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\s/g, "");
        setBeamItems(prev => prev.map((item, i) =>
            i === index ? { ...item, sizedBeamNo: value } : item
        ));
    };

    const handleBeamFlangeNoChange = (index: number, value: string) => {
        const trimmedValue = value.trim();
        if (trimmedValue && isFlangeDuplicate(undefined, trimmedValue, beamItems, index)) {
            toast.error(`Empty Beam No "${trimmedValue}" is already used in another row`);
            return;
        }
        setBeamItems(prev => prev.map((item, i) =>
            i === index ? { ...item, flangeNo: trimmedValue } : item
        ));
    };

    const handleBeamFlangeSelectionChange = (index: number, flangeId: string) => {
        const selected = flangeOptions.find((fl: any) => String(fl.id) === flangeId);
        const selectedFlangeNo = selected ? (selected.flangeNo ?? "").trim() : "";
        const selectedFlangeId = selected ? String(selected.id) : flangeId;

        if (isFlangeDuplicate(selectedFlangeId, selectedFlangeNo, beamItems, index)) {
            toast.error(`Empty Beam No "${selected?.flangeNo}" is already selected in another row`);
            return;
        }

        setBeamItems(prev => prev.map((item, i) => {
            if (i !== index) {
                return item;
            }
            return {
                ...item,
                flangeId: flangeId,
                flangeNo: selectedFlangeNo,
            };
        }));
    };

    const handleBeamExternalFlangeSelectionChange = (index: number, flangeId: string) => {
        const companyId = getCompanyIdForVendor(beamItems[index].weavingVendorId);
        const options = getExternalFlangeOptionsForCompany(companyId);
        const selected = options.find((fl: any) => String(fl.id) === flangeId);

        let candidateFlangeNo = "";
        let candidateFlangeId: string | undefined = undefined;
        if (selected) {
            candidateFlangeNo = (selected.flangeNo ?? "").trim();
            candidateFlangeId = String(selected.id);
        } else if (flangeId && flangeId.startsWith(LEGACY_EXTERNAL_FLANGE_PREFIX)) {
            candidateFlangeNo = flangeId.slice(LEGACY_EXTERNAL_FLANGE_PREFIX.length).trim();
        }

        if (isFlangeDuplicate(candidateFlangeId, candidateFlangeNo, beamItems, index)) {
            toast.error(`Empty Beam No "${candidateFlangeNo}" is already selected in another row`);
            return;
        }

        setBeamItems(prev => prev.map((item, i) => {
            if (i !== index) {
                return item;
            }
            if (selected) {
                return {
                    ...item,
                    flangeId: String(selected.id),
                    flangeNo: candidateFlangeNo,
                };
            }
            if (flangeId && flangeId.startsWith(LEGACY_EXTERNAL_FLANGE_PREFIX)) {
                return {
                    ...item,
                    flangeId: "",
                    flangeNo: candidateFlangeNo,
                };
            }
            return {
                ...item,
                flangeId: flangeId,
                flangeNo: item.flangeNo || "",
            };
        }));
    };

    const handleNewBeamWidthChange = (value: string) => {
        setNewBeamItem(prev => {
            const fallbackBase = (() => {
                const totalNumeric = safeNumber(prev.totalEnds);
                const widthNumeric = safeNumber(prev.fabricPanelWidth);
                if (totalNumeric != null && widthNumeric != null && widthNumeric > 0) {
                    const derived = totalNumeric / widthNumeric;
                    return Number.isFinite(derived) ? String(derived) : "";
                }
                return "";
            })();
            const base = getFabricTotalEndsBase(prev.fabricId) || fallbackBase;
            const computed = base ? computeQualityTotalEnds(base, value) : prev.totalEnds;
            return {
                ...prev,
                fabricPanelWidth: value,
                totalEnds: base ? computed : prev.totalEnds,
            };
        });
    };

    const handleNewBeamTotalEndsChange = (value: string) => {
        setNewBeamItem(prev => ({ ...prev, totalEnds: value }));
    };

    const uniqueQualities = useMemo(() => {
        const arr = selectedSizingPlan?.sizingQualityDetails || [];
        const map = new Map<string, any>();
        for (const it of arr) {
            const fid = (it.fabricId ?? it.fabricCodeId);
            const key = String(fid ?? it.fabricCode ?? it.quality ?? "");
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    fabricId: fid ? String(fid) : "",
                    fabricCode: it.fabricCode || "",
                    quality: it.quality || "",
                    fabricPanelWidth: String(it.fabricPanelWidth ?? ""),
                    totalEnds: deriveDetailTotalEnds(it),
                    totalEndsBase: resolveQualityBaseTotalEnds(it),
                });
            }
        }
        return Array.from(map.values());
    }, [selectedSizingPlan]);

    const fabricMetaMap = useMemo(() => {
        const map = new Map<string, { fabricPanelWidth: string; totalEnds: string; totalEndsBase: string }>();
        uniqueQualities.forEach((entry: any) => {
            const meta = {
                fabricPanelWidth: entry.fabricPanelWidth || "",
                totalEnds: entry.totalEnds || "",
                totalEndsBase: entry.totalEndsBase || "",
            };
            const keys = [entry.fabricId, entry.key]
                .map((value) => (value != null ? String(value).trim() : ""))
                .filter(Boolean);
            keys.forEach((key) => {
                if (!map.has(key)) {
                    map.set(key, meta);
                }
                const lower = key.toLowerCase();
                if (!map.has(lower)) {
                    map.set(lower, meta);
                }
            });
        });
        return map;
    }, [uniqueQualities]);

    const resolveFabricMeta = useCallback(
        (fabricId?: string) => {
            if (fabricId == null) return undefined;
            const key = String(fabricId).trim();
            if (!key) return undefined;
            return fabricMetaMap.get(key) || fabricMetaMap.get(key.toLowerCase());
        },
        [fabricMetaMap]
    );

    const getFabricTotalEndsBase = useCallback(
        (fabricId?: string) => {
            const meta = resolveFabricMeta(fabricId);
            if (!meta) {
                return "";
            }
            if (meta.totalEndsBase && meta.totalEndsBase.trim() !== "") {
                return meta.totalEndsBase;
            }
            const totalNumeric = safeNumber(meta.totalEnds);
            const widthNumeric = safeNumber(meta.fabricPanelWidth);
            if (totalNumeric != null && widthNumeric != null && widthNumeric > 0) {
                const derived = totalNumeric / widthNumeric;
                return Number.isFinite(derived) ? String(derived) : "";
            }
            return "";
        },
        [resolveFabricMeta]
    );

    const planWeavingContractIds = useMemo(() => {
        const details = selectedSizingPlan?.sizingBeamDetails || [];
        const ids = new Set<number>();
        details.forEach((b: any) => { if (b && b.weavingContractId != null) ids.add(Number(b.weavingContractId)); });
        return ids;
    }, [selectedSizingPlan]);

    const planWeavingContracts = useMemo(() => {
        if (!planWeavingContractIds.size) return [] as any[];
        return activeWeavingContractList.filter((wc: any) => planWeavingContractIds.has(Number(wc.id)));
    }, [activeWeavingContractList, planWeavingContractIds]);

    const filteredWeavingContracts = useMemo(() => {
        // Contracts available in selected plan, optionally filter by chosen fabric
        const base = planWeavingContracts;
        const fid = parseInt(String(newBeamItem.fabricId || ""));
        if (!fid || isNaN(fid)) return base;
        return base.filter((wc: any) => (wc.items || []).some((it: any) => Number(it.fabricCodeId) === Number(fid)));
    }, [planWeavingContracts, newBeamItem.fabricId]);

    const beamFormWeavingContracts = useMemo(() => {
        const vid = String(newBeamItem.weavingVendorId || "");
        const fid = String(newBeamItem.fabricId || "");
        if (vid) {
            let base = activeWeavingContractList.filter((wc: any) => String(wc.vendorId) === vid);
            if (fid) {
                const filtered = base.filter((wc: any) => (wc.items || []).some((it: any) => String(it.fabricCodeId) === fid));
                if (filtered.length > 0) base = filtered;
            }
            return base;
        }
        let base: any[] = activeWeavingContractList;
        if (fid) {
            const filtered = base.filter((wc: any) => (wc.items || []).some((it: any) => String(it.fabricCodeId) === fid));
            if (filtered.length > 0) base = filtered;
        }
        return base;
    }, [activeWeavingContractList, newBeamItem.fabricId, newBeamItem.weavingVendorId]);

    const beamFormWeavers = useMemo(() => {
        const wcId = String(newBeamItem.weavingContractId || "");
        if (wcId) {
            const wc = activeWeavingContractList.find((wc: any) => String(wc.id) === wcId);
            if (wc?.vendorId) {
                return weaverVendorList.filter((v: any) => String(v.id) === String(wc.vendorId));
            }
        }
        return weaverVendorList;
    }, [weaverVendorList, newBeamItem.weavingContractId, activeWeavingContractList]);

    useEffect(() => {
        let desired = "";
        if (selectedOrderType === "1") {
            desired = companyId ? String(companyId) : "";
        } else {
            const wc = activeWeavingContractList.find((wc: any) => wc.id === parseInt(newBeamItem.weavingContractId));
            desired = wc?.vendorId ? String(wc.vendorId) : "";
        }
        if (desired !== (newBeamItem.weavingVendorId || "")) {
            setNewBeamItem(prev => ({ ...prev, weavingVendorId: desired }));
        }
    }, [selectedOrderType, newBeamItem.weavingContractId, companyId, activeWeavingContractList]);

    useEffect(() => {
        if (!isExternalOrder) return;
        const companyIds = new Set<string>();
        if (weaverCompanyId) {
            companyIds.add(weaverCompanyId);
        }
        beamItems.forEach((beam) => {
            const companyId = getCompanyIdForVendor(beam.weavingVendorId);
            if (companyId) {
                companyIds.add(companyId);
            }
        });
        companyIds.forEach((companyId) => {
            if (externalFlangeCache[companyId] || externalFlangeLoadingMap[companyId]) {
                return;
            }
            void fetchExternalFlangesForCompany(companyId);
        });
    }, [
        isExternalOrder,
        weaverCompanyId,
        beamItems,
        getCompanyIdForVendor,
        externalFlangeCache,
        externalFlangeLoadingMap,
        fetchExternalFlangesForCompany,
    ]);

    useEffect(() => {
        if (!isExternalOrder) {
            prevWeaverCompanyIdRef.current = "";
            return;
        }
        if (weaverCompanyId && prevWeaverCompanyIdRef.current && prevWeaverCompanyIdRef.current !== weaverCompanyId) {
            setNewBeamItem(prev => ({ ...prev, flangeId: "", flangeNo: "" }));
        }
        prevWeaverCompanyIdRef.current = weaverCompanyId;
    }, [isExternalOrder, weaverCompanyId]);

    useEffect(() => {
        if (!beamItems.length) return;
        let changed = false;
        const updated = beamItems.map((row) => {
            const meta = resolveFabricMeta(row.fabricId);
            if (!meta) {
                return row;
            }
            const widthValue = row.fabricPanelWidth && String(row.fabricPanelWidth).trim() !== "" ? row.fabricPanelWidth : meta.fabricPanelWidth;
            let totalEndsValue = row.totalEnds && String(row.totalEnds).trim() !== "" ? row.totalEnds : "";
            if (!totalEndsValue) {
                const base = getFabricTotalEndsBase(row.fabricId);
                if (base && widthValue) {
                    totalEndsValue = computeQualityTotalEnds(base, widthValue);
                } else if (meta.totalEnds) {
                    totalEndsValue = meta.totalEnds;
                }
            }
            if ((row.fabricPanelWidth || "") === (widthValue || "") && (row.totalEnds || "") === (totalEndsValue || "")) {
                return row;
            }
            changed = true;
            return {
                ...row,
                fabricPanelWidth: widthValue,
                totalEnds: totalEndsValue,
            };
        });
        if (changed) {
            setBeamItems(updated as BeamInwardBeamDetails[]);
        }
    }, [beamItems, getFabricTotalEndsBase, resolveFabricMeta]);


    const filteredSalesOrders = useMemo(() => {
        const wcId = newBeamItem.weavingContractId;
        if (!wcId) {
            return [];
        }
        const wc = activeWeavingContractList.find((w: any) => String(w.id) === String(wcId));
        if (!wc) return [];
        if (wc?.salesOrderNo) {
            const matched = activeSalesOrderList.filter((so: any) => String(so.id) === String(wc.salesOrderNo));
            if (matched.length > 0) return matched;
        }
        if (wc?.salesOrderId) {
            const matched = activeSalesOrderList.filter((so: any) => String(so.id) === String(wc.salesOrderId));
            if (matched.length > 0) return matched;
        }
        if (selectedSizingPlan?.sizingBeamDetails?.length) {
            const wcIdNum = parseInt(wcId);
            if (!isNaN(wcIdNum)) {
                const soIds = new Set(
                    selectedSizingPlan.sizingBeamDetails
                        .filter((b: any) => b.weavingContractId === wcIdNum)
                        .map((b: any) => b.salesOrderId)
                        .filter((id: any) => id !== undefined && id !== null)
                );
                const matched = activeSalesOrderList.filter((so: any) => soIds.has(so.id));
                if (matched.length > 0) return matched;
            }
        }
        return [];
    }, [selectedSizingPlan, newBeamItem.weavingContractId, activeSalesOrderList, activeWeavingContractList]);
    const currentFlangeSelection = newBeamItem.flangeId || (flangeOptions.find((fl: any) => fl.flangeNo === newBeamItem.flangeNo)?.id) || "";
    const getBeamFlangeLabel = (beam: BeamInwardBeamDetails) => {
        if (beam.flangeNo) return beam.flangeNo;
        const match = flangeOptions.find((fl: any) => String(fl.id) === String(beam.flangeId));
        return match?.flangeNo || "";
    };
    const getBeamFlangeSelectionValue = (beam: BeamInwardBeamDetails) => {
        if (beam.flangeId) {
            return String(beam.flangeId);
        }
        const fallback = flangeOptions.find((fl: any) => fl.flangeNo === beam.flangeNo);
        return fallback ? String(fallback.id) : "";
    };

    const LEGACY_EXTERNAL_FLANGE_PREFIX = "legacy-external-flange:";

    const getBeamExternalFlangeSelectionValue = (beam: BeamInwardBeamDetails) => {
        if (beam.flangeId) {
            return String(beam.flangeId);
        }
        const companyId = getCompanyIdForVendor(beam.weavingVendorId);
        const fallback = getExternalFlangeOptionsForCompany(companyId).find((fl: any) => fl.flangeNo === beam.flangeNo);
        if (fallback) {
            return String(fallback.id);
        }
        const trimmedFlangeNo = (beam.flangeNo ?? "").toString().trim();
        return trimmedFlangeNo ? `${LEGACY_EXTERNAL_FLANGE_PREFIX}${trimmedFlangeNo}` : "";
    };

    const getBeamExternalFlangeOptions = (beam: BeamInwardBeamDetails, companyId?: string) => {
        const key = companyId ?? getCompanyIdForVendor(beam.weavingVendorId);
        const baseOptions = getExternalFlangeOptionsForCompany(key);

        const weavingVendor = activeVendorList.find((v: any) => String(v.id) === String(beam.weavingVendorId));
        const isWeaverExternal = weavingVendor && Number(weavingVendor.isInternalVendor) === 0;

        const extraOptions: any[] = [];
        if (isExternalOrder && isWeaverExternal) {
            activeFlangeList.forEach((fl: any) => {
                if (fl.issuedToInternal === false && fl.isIssued == 1) {
                    const idValue = fl.id ?? fl.flangeId;
                    if (idValue && !baseOptions.some((bo: any) => String(bo.id) === String(idValue))) {
                        extraOptions.push({
                            ...fl,
                            id: String(idValue),
                            flangeNo: String(fl.flangeNo || fl.flangeNumber || "")
                        });
                    }
                }
            });
        }
        const mergedOptions = [...baseOptions, ...extraOptions];

        const selectionValue = getBeamExternalFlangeSelectionValue(beam);
        if (selectionValue && !mergedOptions.some((fl: any) => String(fl.id) === selectionValue)) {
            const fallbackFlangeNo = beam.flangeNo || (selectionValue.startsWith(LEGACY_EXTERNAL_FLANGE_PREFIX) ? selectionValue.slice(LEGACY_EXTERNAL_FLANGE_PREFIX.length) : "");
            return [...mergedOptions, { id: selectionValue, flangeNo: fallbackFlangeNo }];
        }
        return mergedOptions;
    };

    const normalizeComparisonKey = (value?: string) => (value ?? "").toString().trim().toLowerCase();

    const getFlangeKey = (flangeId?: string, flangeNo?: string) => {
        const idValue = flangeId ? String(flangeId).trim() : "";
        if (idValue) {
            return `ID:${idValue.toLowerCase()}`;
        }
        const noValue = flangeNo ? String(flangeNo).trim().toLowerCase() : "";
        return noValue ? `NO:${noValue}` : "";
    };

    const isFlangeDuplicateKey = (key: string, list: BeamInwardBeamDetails[], excludeIndex?: number) => {
        if (!key) return false;
        return list.some((beam, idx) => {
            if (excludeIndex != null && idx === excludeIndex) return false;
            return getFlangeKey(beam.flangeId, beam.flangeNo) === key;
        });
    };

    const isFlangeDuplicate = (flangeId: string | undefined, flangeNo: string | undefined, list: BeamInwardBeamDetails[], excludeIndex?: number) => {
        const key = getFlangeKey(flangeId, flangeNo);
        if (!key) return false;
        return isFlangeDuplicateKey(key, list, excludeIndex);
    };

    const findQualityDetailForBeam = useCallback(
        (beam: BeamInwardBeamDetails) => {
            if (!items.length) return undefined;
            const beamKey = normalizeComparisonKey(beam.fabricId);
            if (beamKey) {
                const match = items.find((detail) => {
                    const detailKeys = [
                        normalizeComparisonKey(detail.fabricId),
                        normalizeComparisonKey(detail.fabricCode),
                    ].filter(Boolean);
                    return detailKeys.includes(beamKey);
                });
                if (match) {
                    return match;
                }
            }
            return items.find((detail) => detail.actualEnds && detail.actualEnds.trim() !== "");
        },
        [items]
    );

    const getExternalTotalEndsForBeam = useCallback(
        (beam: BeamInwardBeamDetails) => {
            if (!isExternalOrder) {
                return beam.totalEnds || "";
            }
            const match = findQualityDetailForBeam(beam);
            if (match?.actualEnds && match.actualEnds.trim() !== "") {
                return match.actualEnds;
            }
            return beam.totalEnds || "";
        },
        [findQualityDetailForBeam, isExternalOrder]
    );

    useEffect(() => {
        const valid = filteredSalesOrders.some((so: any) => String(so.id) === String(newBeamItem.salesOrderId));
        if (!valid && newBeamItem.salesOrderId) {
            setNewBeamItem(prev => ({ ...prev, salesOrderId: "" }));
        } else if (!newBeamItem.salesOrderId && filteredSalesOrders.length > 0) {
            setNewBeamItem(prev => ({ ...prev, salesOrderId: String(filteredSalesOrders[0].id) }));
        }
    }, [filteredSalesOrders, newBeamItem.salesOrderId]);

    useEffect(() => {
        if (!selectedSizingPlan) return;
        if (!newBeamItem.weavingContractId && planWeavingContracts.length === 1) {
            setNewBeamItem(prev => ({ ...prev, weavingContractId: String(planWeavingContracts[0].id) }));
        }
    }, [selectedSizingPlan, planWeavingContracts, newBeamItem.weavingContractId]);

    useEffect(() => {
        if (!selectedSizingPlan) return;
        const wcId = Number(newBeamItem.weavingContractId || 0);
        if (!wcId) {
            if (newBeamItem.weavingVendorId) setNewBeamItem(prev => ({ ...prev, weavingVendorId: "" }));
            return;
        }
        const ids = Array.from(new Set((selectedSizingPlan?.sizingBeamDetails || [])
            .filter((b: any) => Number(b.weavingContractId) === wcId && b.weavingVendorId != null)
            .map((b: any) => String(b.weavingVendorId))));
        if (ids.length === 1 && String(newBeamItem.weavingVendorId || "") !== ids[0]) {
            setNewBeamItem(prev => ({ ...prev, weavingVendorId: String(ids[0]) }));
            return;
        }
        if (ids.length > 0) {
            const valid = ids.includes(String(newBeamItem.weavingVendorId || ""));
            if (!valid && newBeamItem.weavingVendorId) setNewBeamItem(prev => ({ ...prev, weavingVendorId: "" }));
        }
    }, [selectedSizingPlan, newBeamItem.weavingContractId]);

    useEffect(() => {
        const warp = parseFloat(newBeamItem.wrapMeters || "");
        const shrink = parseFloat(newBeamItem.shrinkage || "");
        const fallbackWidth = parseFloat(String(
            uniqueQualities.find((u: any) => String(u.fabricId || "") === String(newBeamItem.fabricId || ""))?.fabricPanelWidth ??
            selectedSizingPlan?.sizingQualityDetails?.[0]?.fabricPanelWidth ??
            "1"
        )) || 1;
        const widthValue = parseFloat(newBeamItem.fabricPanelWidth || "") || fallbackWidth;
        if (!isNaN(warp) && !isNaN(shrink)) {
            const base = warp * widthValue;
            const expected = Number(base - (base * (shrink / 100))).toFixed(2);
            if (expected !== String(newBeamItem.expectedFabricMeter || "")) {
                setNewBeamItem(prev => ({ ...prev, expectedFabricMeter: expected }));
            }
        } else if (newBeamItem.expectedFabricMeter) {
            setNewBeamItem(prev => ({ ...prev, expectedFabricMeter: "" }));
        }
    }, [newBeamItem.wrapMeters, newBeamItem.shrinkage, newBeamItem.fabricId, newBeamItem.fabricPanelWidth, selectedSizingPlan, uniqueQualities]);

    useEffect(() => {
        const fabricId = newBeamItem.fabricId;
        const meta = resolveFabricMeta(fabricId);
        if (!meta) {
            return;
        }
        const base = getFabricTotalEndsBase(fabricId);
        setNewBeamItem(prev => {
            const forceUpdate = prev.fabricId !== fabricId;
            const patch: Partial<BeamInwardBeamDetails> = {};
            if (forceUpdate || (!prev.fabricPanelWidth && meta.fabricPanelWidth !== undefined)) {
                patch.fabricPanelWidth = meta.fabricPanelWidth || "";
            }
            const widthForTotal = patch.fabricPanelWidth ?? prev.fabricPanelWidth ?? "";
            if (forceUpdate || !prev.totalEnds) {
                if (base && widthForTotal) {
                    patch.totalEnds = computeQualityTotalEnds(base, widthForTotal);
                } else if (meta.totalEnds) {
                    patch.totalEnds = meta.totalEnds;
                } else if (forceUpdate) {
                    patch.totalEnds = "";
                }
            }
            if (!Object.keys(patch).length) {
                return prev;
            }
            return { ...prev, ...patch } as BeamInwardBeamDetails;
        });
    }, [getFabricTotalEndsBase, newBeamItem.fabricId, resolveFabricMeta]);

    useEffect(() => {
        if (!isExternalOrder) return;
        const externalTotalEnds = getExternalTotalEndsForBeam(newBeamItem);
        if (!externalTotalEnds || externalTotalEnds === newBeamItem.totalEnds) return;
        setNewBeamItem(prev => ({
            ...prev,
            totalEnds: externalTotalEnds,
        }));
    }, [
        isExternalOrder,
        getExternalTotalEndsForBeam,
        newBeamItem.fabricId,
        newBeamItem.weavingContractId,
        newBeamItem.totalEnds,
    ]);

    const [lastPopulatedIdsRef, setLastPopulatedIdsRef] = useState<{ fabricId: string; weavingContractId: string } | null>(null);

    useEffect(() => {
        if (!selectedSizingPlan) return;
        const wcId = Number(newBeamItem.weavingContractId || 0);
        if (!wcId) return;

        // Skip if we already auto-populated for this fabric/contract combo
        // or if we are in editing mode (unless fabric/contract changed)
        const currentCombo = { fabricId: newBeamItem.fabricId || "", weavingContractId: newBeamItem.weavingContractId };
        const isSameAsLast = lastPopulatedIdsRef?.fabricId === currentCombo.fabricId && lastPopulatedIdsRef?.weavingContractId === currentCombo.weavingContractId;

        if (isSameAsLast) return;

        const matches = (selectedSizingPlan.sizingBeamDetails || []).filter((b: any) => Number(b.weavingContractId) === wcId);
        if (!matches.length) return;

        // If fabric not picked, and only one fabric in plan for this contract, pick it
        if (!newBeamItem.fabricId) {
            const uniqFabrics: string[] = Array.from(new Set(matches.map((b: any) => String(b.fabricId)).filter(Boolean)));
            if (uniqFabrics.length === 1) {
                setNewBeamItem(prev => ({ ...prev, fabricId: uniqFabrics[0] }));
                setLastPopulatedIdsRef({ ...currentCombo, fabricId: uniqFabrics[0] });
                return;
            }
        }

        // When fabric is chosen, set warp/shrink/expected and default sales order from matching plan row
        if (newBeamItem.fabricId) {
            const fid = Number(newBeamItem.fabricId);
            const row = matches.find((b: any) => Number(b.fabricId) === fid) || matches[0];
            if (row) {
                const warp = Number(row.warpMeters ?? 0) || 0;
                const shrink = Number(row.shrinkage ?? 0) || 0;
                const fpw = Number(
                    uniqueQualities.find((u: any) => String(u.fabricId || "") === String(row.fabricId || ""))?.fabricPanelWidth ??
                    selectedSizingPlan?.sizingQualityDetails?.[0]?.fabricPanelWidth ??
                    1
                ) || 1;
                const base = warp * fpw;
                const expected = row.expectedFabricMeter != null && !isNaN(Number(row.expectedFabricMeter))
                    ? Number(row.expectedFabricMeter).toFixed(2)
                    : (isNaN(base) ? "" : Number(base - (base * (shrink / 100))).toFixed(2));
                const meta = resolveFabricMeta(row.fabricId ?? row.fabricCodeId);

                setNewBeamItem(prev => ({
                    ...prev,
                    wrapMeters: warp ? Number(warp).toFixed(2) : "",
                    shrinkage: String(shrink || ""),
                    expectedFabricMeter: String(expected || ""),
                    fabricPanelWidth: String(fpw),
                    totalEnds: prev.totalEnds || meta?.totalEnds || "",
                    salesOrderId: prev.salesOrderId || (row.salesOrderId ? String(row.salesOrderId) : ""),
                    flangeId: row?.flangeId != null ? String(row.flangeId) : (prev.flangeId || ""),
                    flangeNo: row?.flangeNo != null ? String(row.flangeNo) : (prev.flangeNo || ""),
                }));
                setLastPopulatedIdsRef(currentCombo);
            }
        }
    }, [newBeamItem.weavingContractId, newBeamItem.fabricId, selectedSizingPlan, uniqueQualities, lastPopulatedIdsRef]);

    useEffect(() => {
        if (!selectedSizingPlan && beamInwardDtl?.sizingPlanId && sizingPlanList?.length) {
            const plan = sizingPlanList.find((sp: any) => sp.id === Number(beamInwardDtl.sizingPlanId));
            if (plan) setSelectedSizingPlan(plan);
        }
    }, [beamInwardDtl?.sizingPlanId, sizingPlanList]);

    useEffect(() => {
        if (beamEditingIndex !== null) return;
        setNewBeamItem(prev => ({ ...prev, fabricId: "", weavingContractId: "", salesOrderId: "" }));
    }, [selectedSizingPlan, beamEditingIndex]);

    const isTotalEndsAuto = Boolean(getFabricTotalEndsBase(newBeamItem.fabricId));

    return (
        <div className="mt-10 p-6 bg-white shadow-md rounded-lg">
            <div className="flex justify-between items-center border-b pb-4 mt-5">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/transaction/beam-management")}
                        className="mr-auto"
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Back
                    </Button>
                    <h2 className="text-2xl font-semibold">Beam Inward</h2>
                </div>

              
            </div>

            <div className="space-y-6">
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
                                Vendor Details
                            </button>
                        </nav>
                    </div>
                </div>

                {activeTab === "vendorDetails" && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 ">
                                    <FileText size={20} /> Vendor Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-5 gap-8">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Beam Inward No</label>
                                    <input
                                        type="text"
                                        placeholder="Loading sequence..."
                                        
                                        className={`w-full border px-3 py-2 h-10 rounded transition-all duration-200 ${
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
                                        className="input mt-1 h-10 p-2"
                                    />
                                    {errors.beamInwardDate && (
                                        <p className="mt-1 text-sm text-red-600">{errors.beamInwardDate.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Order Type</label>
                                    <CommonSearchableSelect
                                        {...register("orderTypeId", {
                                            required: "Order Type is required",
                                        })}
                                        options={[
                                            { value: "1", label: "Internal" },
                                            { value: "2", label: "External" }
                                        ]}
                                        placeholder="Select Order Type"
                                        className="mt-1"
                                        value={selectedOrderType}
                                        onValueChange={(value: string) => {
                                            setSelectedOrderType(value);
                                            setSelectedSizingPlan(null);
                                            setValue("sizingPlanId", "");
                                            setItems([]);
                                            setBeamItems([]);
                                            setValue("orderTypeId", value);
                                        }}
                                        disabled
                                    />
                                    {errors.orderTypeId && (
                                        <p className="mt-1 text-sm text-red-600">{errors.orderTypeId.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Sizing Plan No</label>
                                    <CommonSearchableSelect
                                        {...register("sizingPlanId", {
                                            required: "Sizing Plan Id is required",
                                        })}
                                        options={activeSizingPlanList
                                            .filter((sp: any) => selectedOrderType && String(sp.orderTypeId) === String(selectedOrderType))
                                            .map((sp: any) => ({
                                                value: String(sp.id),
                                                label: sp.sizingPlanNo
                                            }))}
                                        placeholder="Select a Sizing Plan"
                                        className="mt-1"
                                        value={watch("sizingPlanId")}
                                        onValueChange={(value: string) => {
                                            const event = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
                                            handleSizingPlanChange(event);
                                            setValue("sizingPlanId", value);
                                        }}
                                    />
                                    {errors.sizingPlanId && (
                                        <p className="mt-1 text-sm text-red-600">{errors.sizingPlanId.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Sizing Vendor</label>
                                    <CommonSearchableSelect
                                        {...register("sizingVendorId", { required: "Vendor is required" })}
                                        options={(selectedSizingPlan ? activeVendorList.filter((vendor: any) => vendor.id === selectedSizingPlan.vendorId) : activeVendorList).map((vendor: any) => ({
                                            value: String(vendor.id),
                                            label: vendor.vendorName
                                        }))}
                                        placeholder="Select a Sizing Vendor"
                                        className="mt-1"
                                        value={watch("sizingVendorId")}
                                        onValueChange={(value: string) => {
                                            setValue("sizingVendorId", value);
                                            fetchAndApplySizingRate(value);
                                        }}
                                    />
                                    {errors.sizingVendorId && (
                                        <p className="mt-1 text-sm text-red-600">{errors.sizingVendorId.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Sizing Rate</label>
                                    <input
                                        {...register('sizingRate')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Sizing Rate"
                                    />
                                </div>
                                {/* <div>
                                    <label className="block text-sm font-medium text-secondary-700">DC Number</label>
                                    <input
                                        {...register('dcNumber')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter DC Number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">DC Date</label>
                                    <input
                                        type="date"
                                        {...register('dcDate')}
                                        className="input mt-1 h-10 p-2"
                                    />
                                </div> */}
                             
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Sizing Set No</label>
                                    <input
                                        {...register('sizingSetNo')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Sizing Set No"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Avg Beam Count</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('avgBeamCount')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Avg Beam Count"
                                    />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-secondary-700">Actual Warp Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('actualWeight')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Actual Weight"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Warping Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('warpingWeight')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Warping Weight"
                                    />
                                </div>
                                 
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Excess/Shortage (Kgs)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('excessShortage')}
                                        className="input mt-1 h-10 p-2 font-bold text-indigo-700 bg-indigo-50/50" placeholder="Auto-calculated (Warping - Actual)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Sizing Pickup (%)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('sizingPickup')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Sizing Pickup"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Elongation (%)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('elongation')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Elongation"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Breaks/Million</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('breaksMillion')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Breaks/Million"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Baby Cone Wt (kg)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('babyConeWt')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Baby Cone Wt"
                                    />
                                </div>
{/*                               
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Fresh Cone (kg)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('freshCone')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Fresh Cone"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Rewinding Cone (kg)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('rewindingCone')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Rewinding Cone"
                                    />
                                </div> */}
   <div>
                                    <label className="block text-sm font-medium text-secondary-700">Remarks</label>
                                    <input
                                        {...register('remarks')}
                                        className="input mt-1 h-10 p-2" placeholder="Enter Remarks"
                                    />
                                </div>

                                {/* File Upload Section */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Invoice Upload</label>
                                    <div
                                        className={`border-2 border-dashed border-gray-300 rounded-lg ${invoiceFile ? 'p-2' : 'p-4'} flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all duration-200`}
                                        onClick={() => invInputRef.current?.click()}
                                    >
                                        {!(invoiceFile || existingMedia) ? (
                                            <>
                                                <ImageIcon size={24} className="text-gray-400 mb-1" />
                                                <span className="text-xs font-medium text-gray-700">Click to upload or drag and drop</span>
                                                <span className="text-[10px] text-gray-500">PNG, JPG, PDF, DOC, DOCX, XLS, XLSX</span>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-3 w-full px-2">
                                                <div className="bg-blue-50 p-1.5 rounded text-blue-500">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-900 truncate">
                                                        {invoiceFile ? invoiceFile.name : existingMedia?.originalFileName}
                                                    </p>
                                                    {existingMedia?.mediaUrl && !invoiceFile && (
                                                        <a
                                                            href={existingMedia.mediaUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-blue-600 hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            View Document
                                                        </a>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setInvoiceFile(null);
                                                        setExistingMedia(null);
                                                        setInvoiceDetails([]);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={invInputRef}
                                            className="hidden"
                                            onChange={handleInvoiceFileChange}
                                            accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx"
                                        />
                                    </div>

                                    {isExtracting && (
                                        <div className="mt-1 flex items-center gap-2 text-[10px] text-blue-600">
                                            <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
                                            <span>Extracting data...</span>
                                        </div>
                                    )}

                                    {invoiceDetails.length > 0 && !isExtracting && (
                                        <div className="mt-1 p-1.5 bg-emerald-50 rounded border border-emerald-100 text-sm flex items-center gap-x-3">
                                            <span className="font-semibold text-emerald-800 whitespace-nowrap">Extracted:</span>
                                            <div className="flex flex-wrap gap-x-3">
                                                <span className="text-emerald-700">Inv: <strong>{invoiceDetails[0].invNo}</strong></span>
                                                <span className="text-emerald-700">Date: <strong>{invoiceDetails[0].invDate}</strong></span>
                                                <span className="text-emerald-700">Cost: <strong>{invoiceDetails[0].sizingCost}</strong></span>
                                                <span className="text-emerald-700">GST: <strong>{invoiceDetails[0].gstAmount}</strong></span>
                                                <span className="text-emerald-700">Net: <strong>{invoiceDetails[0].netTotal}</strong></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardList size={20} /> Quality Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full border-collapse border border-gray-300 text-center">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border p-2">Sl.No</th>
                                            <th className="border p-2">Sort No</th>
                                            <th className="border p-2">Construction</th>
                                            <th className="border p-2">Yarn Name</th>
                                            <th className="border p-2">Actual Yarn</th>
                                            <th className="border p-2">Sort Ends</th>
                                            <th className="border p-2">Actual Ends</th>
                                            <th className="border p-2">Fabric Panel/Width</th>
                                            {/* <th className="border p-2">Total Ends</th> */}
                                            <th className="border p-2">Warp Ends</th>
                                            <th className="border p-2">Actual Warp Ends</th>
                                            <th className="border p-2">Parts</th>
                                            <th className="border p-2">Ends/Part</th>
                                            <th className="border p-2">Warp Meters</th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item: any, index: any) => {
                                            const yarnKey = item.yarnId ? String(item.yarnId) : "";
                                            const actualYarnKey = item.actualYarn ? String(item.actualYarn) : "";
                                            const yarnName = yarnKey ? yarnNameMap[yarnKey] || yarnKey : item.yarnId;
                                            const actualYarnName = actualYarnKey ? yarnNameMap[actualYarnKey] || actualYarnKey : item.actualYarn;
                                            return (
                                                <tr key={index} className="border">
                                                    <td className="border p-2">{index + 1}</td>
                                                    <td className="border p-2">{item.fabricCode || ""}</td>
                                                    <td className="border p-2">{item.quality}</td>
                                                    <td className="border p-2">{yarnName}</td>
                                                    <td className="border p-2">{actualYarnName || ""}</td>
                                                    <td className="border p-2">{item.sordEnds}</td>
                                                    <td className="border p-2">{item.actualEnds}</td>
                                                    <td className="border p-2">{item.fabricPanelWidth || ""}</td>
                                                    {/* <td className="border p-2">{item.totalEnds || ""}</td> */}
                                                    <td className="border p-2">{item.warpEnds || ""}</td>
                                                    <td className="border p-2">{item.actualWarpEnds || ""}</td>
                                                    <td className="border p-2">{item.parts}</td>
                                                    <td className="border p-2">{item.endsPerPart}</td>
                                                    <td className="border p-2">
                                                        {item.wrapMeters != null && !isNaN(Number(item.wrapMeters))
                                                            ? Number(item.wrapMeters).toFixed(2)
                                                            : item.wrapMeters}
                                                    </td>

                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* <Card>
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
                        <table className="w-full border-collapse border border-gray-300 text-center">
                            <thead className="bg-gray-100 text-xs">
                                <tr>
                                    <th className="border p-2">Sl.No</th>
                                    <th className="border p-2 min-w-[200px]">Fabric Code/Quality</th>
                                    <th className="border p-2 min-w-[180px]">Weaving Contract No</th>
                                    <th className="border p-2 min-w-[180px]">Weaver</th>
                                    <th className="border p-2 min-w-[180px]">Sales Order No</th>
                                    <th className="border p-2 min-w-[150px]">Sized Beam No</th>
                                    <th className="border p-2 min-w-[180px]">Empty Beam No</th>
                                    <th className="border p-2 w-24">Width</th>
                                    <th className="border p-2 w-24">Total Ends</th>
                                    <th className="border p-2 w-28">Warp Meters</th>
                                    <th className="border p-2 w-24">Shrinkage %</th>
                                    <th className="border p-2 w-32">Expected Fabric Meter</th>
                                    <th className="border p-2 min-w-[100px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {showAddBeamForm && (
                                    <tr className="bg-blue-50">
                                        <td className="border p-2 font-medium">*</td>
                                        <td className="border p-2 min-w-[200px]">
                                            <CommonSearchableSelect
                                                value={newBeamItem.fabricId || ""}
                                                onValueChange={(value) => {
                                                    const matchingContracts = activeWeavingContractList.filter((wc: any) =>
                                                        (wc.items || []).some((it: any) => String(it.fabricCodeId) === String(value))
                                                    );
                                                    let newWcId = "";
                                                    let newVendorId = "";
                                                    if (matchingContracts.length === 1) {
                                                        newWcId = String(matchingContracts[0].id);
                                                        newVendorId = matchingContracts[0].vendorId ? String(matchingContracts[0].vendorId) : "";
                                                    }
                                                    setNewBeamItem({ ...newBeamItem, fabricId: value, weavingContractId: newWcId, weavingVendorId: newVendorId, salesOrderId: "" });
                                                }}
                                                className="w-full"
                                                options={(activeFabricMasterList || []).map((fm: any) => ({
                                                    value: String(fm.id),
                                                    label: `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}`
                                                }))}
                                                placeholder="Quality"
                                            />
                                        </td>
                                        <td className="border p-2 min-w-[180px]">
                                            <CommonSearchableSelect
                                                value={newBeamItem.weavingContractId}
                                                onValueChange={(value) => {
                                                    const wc = activeWeavingContractList.find((w: any) => String(w.id) === value);
                                                    const newVendorId = wc?.vendorId ? String(wc.vendorId) : newBeamItem.weavingVendorId;
                                                    const fabricIds: string[] = Array.from(new Set((wc?.items || []).map((it: any) => String(it.fabricCodeId)).filter(Boolean)));
                                                    const newFabricId = fabricIds.length === 1 ? fabricIds[0] : newBeamItem.fabricId;
                                                    let newSalesOrderId = "";
                                                    if (wc?.salesOrderNo) {
                                                        const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderNo));
                                                        if (matched) newSalesOrderId = String(matched.id);
                                                    } else if (wc?.salesOrderId) {
                                                        const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderId));
                                                        if (matched) newSalesOrderId = String(matched.id);
                                                    }
                                                    setNewBeamItem({ ...newBeamItem, weavingContractId: value, weavingVendorId: newVendorId, fabricId: newFabricId, salesOrderId: newSalesOrderId });
                                                }}
                                                className="w-full"
                                                options={beamFormWeavingContracts.map((wc: any) => ({
                                                    value: String(wc.id),
                                                    label: wc.weavingContractNo
                                                }))}
                                                placeholder="Contract"
                                            />
                                        </td>
                                        <td className="border p-2 min-w-[180px]">
                                            <CommonSearchableSelect
                                                value={newBeamItem.weavingVendorId || ""}
                                                onValueChange={(value) => {
                                                    const matchingContracts = activeWeavingContractList.filter((wc: any) => String(wc.vendorId) === String(value));
                                                    let newWcId = "";
                                                    let newFabricId = newBeamItem.fabricId;
                                                    if (matchingContracts.length === 1) {
                                                        newWcId = String(matchingContracts[0].id);
                                                        const fabricIds: string[] = Array.from(new Set((matchingContracts[0].items || []).map((it: any) => String(it.fabricCodeId)).filter(Boolean)));
                                                        if (fabricIds.length === 1) newFabricId = fabricIds[0];
                                                    }
                                                    setNewBeamItem({ ...newBeamItem, weavingVendorId: value, weavingContractId: newWcId, fabricId: newFabricId, salesOrderId: "" });
                                                }}
                                                className="w-full"
                                                options={beamFormWeavers.map((v: any) => ({
                                                    value: String(v.id),
                                                    label: v.vendorName
                                                }))}
                                                placeholder="Weaver"
                                            />
                                        </td>
                                        <td className="border p-2 min-w-[180px]">
                                            <CommonSearchableSelect
                                                value={newBeamItem.salesOrderId}
                                                onValueChange={(value) => setNewBeamItem({ ...newBeamItem, salesOrderId: value })}
                                                className="w-full"
                                                options={filteredSalesOrders?.map((so: any) => ({
                                                    value: String(so.id),
                                                    label: so.salesOrderNo
                                                }))}
                                                placeholder="Order"
                                            />
                                        </td>
                                        <td className="border p-2 min-w-[150px]">
                                            <input
                                                type="text"
                                                value={newBeamItem.sizedBeamNo}
                                                onChange={handleSizedBeamNoChange}
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ') e.preventDefault();
                                                }}
                                                className="input w-full p-2 h-10"
                                                placeholder="Sized Beam No"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                            />
                                        </td>
                                        <td className="border p-2 min-w-[180px]">
                                            <CommonSearchableSelect
                                                value={isExternalOrder ? (newBeamItem.flangeId || "") : currentFlangeSelection}
                                                onValueChange={(value) => {
                                                    const options = isExternalOrder ? externalFlangeOptions : flangeOptions;
                                                    const selected = options.find((fl: any) => String(fl.id) === value);
                                                    setNewBeamItem(prev => ({
                                                        ...prev,
                                                        flangeId: selected ? String(selected.id) : "",
                                                        flangeNo: selected ? selected.flangeNo : "",
                                                    }));
                                                }}
                                                className="w-full"
                                                options={(isExternalOrder ? externalFlangeOptions : flangeOptions).map((fl: any) => ({
                                                    value: String(fl.id),
                                                    label: fl.flangeNo
                                                }))}
                                                placeholder="Select Flange"
                                            />
                                        </td>
                                        <td className="border p-2 w-24">
                                            <input
                                                type="number"
                                                value={newBeamItem.fabricPanelWidth || ""}
                                                onChange={(e) => handleNewBeamWidthChange(e.target.value)}
                                                className="input w-full p-2 h-10"
                                            />
                                        </td>
                                        <td className="border p-2 w-24">
                                            <input
                                                type="number"
                                                value={newBeamItem.totalEnds || ""}
                                                onChange={(e) => handleNewBeamTotalEndsChange(e.target.value)}
                                                className={`input w-full p-2 h-10${isTotalEndsAuto ? " bg-gray-50" : ""}`}
                                                readOnly={isTotalEndsAuto}
                                            />
                                        </td>
                                        <td className="border p-2 w-28">
                                            <input
                                                type="number"
                                                value={newBeamItem.wrapMeters}
                                                onChange={(e) => setNewBeamItem({ ...newBeamItem, wrapMeters: e.target.value })}
                                                className="input w-full p-2 h-10"
                                            />
                                        </td>
                                        <td className="border p-2 w-24">
                                            <input
                                                type="number"
                                                value={newBeamItem.shrinkage}
                                                onChange={(e) => setNewBeamItem({ ...newBeamItem, shrinkage: e.target.value })}
                                                className="input w-full p-2 h-10"
                                            />
                                        </td>
                                        <td className="border p-2 w-32">
                                            <input
                                                type="number"
                                                value={newBeamItem.expectedFabricMeter}
                                                onChange={(e) => setNewBeamItem({ ...newBeamItem, expectedFabricMeter: e.target.value })}
                                                className="input w-full p-2 h-10"
                                            />
                                        </td>
                                        <td className="border p-2 min-w-[100px]">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    type="button"
                                                    onClick={handleSaveNewBeam}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-emerald-600 hover:text-emerald-800 p-2 h-10 w-10 border border-emerald-200 rounded"
                                                >
                                                    <Save size={20} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={handleRemoveNewBeamForm}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-800 p-2 h-10 w-10 border border-red-200 rounded"
                                                >
                                                    <X size={20} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {beamItems.map((item, index) => (
                                    <tr key={index} className="border text-sm">
                                        <td className="border p-2">{index + 1}</td>
                                        <td className="border p-2 w-48">
                                            {(() => {
                                                const fid = String((item as any).fabricId || "");
                                                const u = uniqueQualities.find((u: any) => String(u.fabricId || "") === fid);
                                                if (u) return `${u.fabricCode} / ${u.quality}`;
                                                const fm = (fabricMasterList || []).find((f: any) => String(f.id) === fid || String(f.fabricCodeId) === fid);
                                                return fm ? `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}` : "";
                                            })()}
                                        </td>
                                        <td className="border p-2">
                                            {weavingContractList?.find((wc: any) => wc.id === parseInt(item.weavingContractId))?.weavingContractNo || item.weavingContractId}
                                        </td>
                                        <td className="border p-2">
                                            {(() => {
                                                const ven = vendorList?.find((v: any) => v.id === parseInt(item.weavingVendorId));
                                                return ven?.vendorName || '';
                                            })()}
                                        </td>
                                        <td className="border p-2">
                                            {salesOrderList?.find((so: any) => so.id === parseInt(item.salesOrderId))?.salesOrderNo || item.salesOrderId}
                                        </td>
                                        <td className="border p-2 min-w-[150px]">
                                            <input
                                                type="text"
                                                value={item.sizedBeamNo || ""}
                                                onChange={(e) => handleEditSizedBeamNo(index, e)}
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ') e.preventDefault();
                                                }}
                                                className="input w-full p-2 h-10 text-center"
                                                placeholder="Sized Beam No"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                 readOnly={isInternalOrder}
                                                disabled={isInternalOrder}
                                            />
                                        </td>
                                        <td className="border p-2 min-w-[180px]">
                                            {isExternalOrder ? (
                                                (() => {
                                                    const beamCompanyId = getCompanyIdForVendor(item.weavingVendorId);
                                                    const beamExternalOptions = getBeamExternalFlangeOptions(item, beamCompanyId);
                                                    const beamExternalLoading = beamCompanyId ? Boolean(externalFlangeLoadingMap[beamCompanyId]) : false;
                                                    return (
                                                        <select
                                                            value={getBeamExternalFlangeSelectionValue(item)}
                                                            onChange={(e) => handleBeamExternalFlangeSelectionChange(index, e.target.value)}
                                                            className="input w-full p-2 h-10"
                                                        >
                                                            <option value="">{beamExternalLoading ? "Loading flanges..." : "Select Flange"}</option>
                                                            {beamExternalOptions.map((fl: any) => (
                                                                <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
                                                            ))}
                                                        </select>
                                                    );
                                                })()
                                            ) : (
                                                <select
                                                    value={getBeamFlangeSelectionValue(item)}
                                                    onChange={(e) => handleBeamFlangeSelectionChange(index, e.target.value)}
                                                    className="input w-full p-2 h-10"
                                                    disabled={isInternalOrder}
                                                >
                                                    <option value="">Select Flange</option>
                                                    {flangeOptions.map((fl: any) => (
                                                        <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td className="border p-2">{item.fabricPanelWidth || ""}</td>
                                        <td className="border p-2">{getExternalTotalEndsForBeam(item)}</td>
                                        <td className="border p-2">{item.wrapMeters}</td>
                                        <td className="border p-2">{item.shrinkage}</td>
                                        <td className="border p-2">{item.expectedFabricMeter}</td>
                                        <td className="border p-2">
                                            {String(item.isReturn) === "1" ? (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">Returned</span>
                                            ) : String(item.isBeamOutwarded) === "1" ? (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-700">Outwarded</span>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() => editBeamItem(index)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 hover:text-blue-800 p-2 h-10 w-10 border border-blue-200 rounded"
                                                    >
                                                        <Edit size={20} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() => deleteBeamItem(index)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-800 p-2 h-10 w-10 border border-red-200 rounded"
                                                    >
                                                        <X size={20} />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card> */}
                {/* <Card>
  <div className="flex flex-row p-6 justify-between items-center border-b">                        <div className="flex items-center gap-2">
                            <ClipboardList size={20} className="text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Beam Details</h3>
                        </div>
                        <div>
                            <Button
                                type="button"
                                onClick={() => setShowAddBeamForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
                                disabled={showAddBeamForm}
                            >
                                <Plus size={18} className="mr-2" />
                                Add Beam
                            </Button>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300 text-center">
                                <thead className="bg-gray-100">
                                    <tr className="border border-gray-300">
                                        <th className="border border-gray-300 p-3 text-sm font-medium">Sl.No</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[200px]">Fabric Code/Quality</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[180px]">Weaving Contract No</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[180px]">Weaver</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[180px]">Sales Order No</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[150px]">Sized Beam No</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[180px]">Empty Beam No</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-24">Width</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-24">Total Ends</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-28">Warp Meters</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-24">Shrinkage %</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider w-32">Expected Fabric Meter</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider min-w-[120px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {showAddBeamForm && (
                                        <tr className="bg-blue-50/30 hover:bg-blue-50/50 transition-colors duration-150 border border-gray-300">
                                            <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 align-middle">*</td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <CommonSearchableSelect
                                                    value={newBeamItem.fabricId || ""}
                                                    onValueChange={(value: any) => setNewBeamItem({ ...newBeamItem, fabricId: value })}
                                                    className="w-full"
                                                    disabled={!newBeamItem.weavingContractId}
                                                    options={(() => {
                                                        const wcId = Number(newBeamItem.weavingContractId || 0);
                                                        const fabricIds: string[] = Array.from(new Set((selectedSizingPlan?.sizingBeamDetails || [])
                                                            .filter((b: any) => Number(b.weavingContractId) === wcId)
                                                            .map((b: any) => String(b.fabricId))
                                                            .filter(Boolean)));
                                                        return fabricIds.map(fid => {
                                                            const fm = (activeFabricMasterList || []).find((f: any) => String(f.id) === fid || String(f.fabricCodeId) === fid);
                                                            const label = fm ? `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}` : fid;
                                                            return { value: fid, label };
                                                        });
                                                    })()}
                                                    placeholder="Select Quality"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <CommonSearchableSelect
                                                    value={newBeamItem.weavingContractId}
                                                    onValueChange={(value: any) => {
                                                        const wc = activeWeavingContractList.find((w: any) => String(w.id) === value);
                                                        let newSalesOrderId = "";
                                                        if (wc?.salesOrderNo) {
                                                            const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderNo));
                                                            if (matched) newSalesOrderId = String(matched.id);
                                                        } else if (wc?.salesOrderId) {
                                                            const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderId));
                                                            if (matched) newSalesOrderId = String(matched.id);
                                                        }
                                                        setNewBeamItem({ ...newBeamItem, weavingContractId: value, fabricId: "", salesOrderId: newSalesOrderId });
                                                    }}
                                                    className="w-full"
                                                    disabled={!selectedSizingPlan}
                                                    options={!selectedSizingPlan ? [] : planWeavingContracts?.map((wc: any) => ({
                                                        value: String(wc.id),
                                                        label: wc.weavingContractNo
                                                    }))}
                                                    placeholder="Select Contract"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <CommonSearchableSelect
                                                    value={newBeamItem.weavingVendorId || ""}
                                                    onValueChange={(value: any) => setNewBeamItem({ ...newBeamItem, weavingVendorId: value })}
                                                    className="w-full"
                                                    disabled={!newBeamItem.weavingContractId || !selectedSizingPlan}
                                                    options={(!selectedSizingPlan || !newBeamItem.weavingContractId) ? [] : (() => {
                                                        const wcId = Number(newBeamItem.weavingContractId || 0);
                                                        const ids = Array.from(new Set((selectedSizingPlan?.sizingBeamDetails || [])
                                                            .filter((b: any) => Number(b.weavingContractId) === wcId && b.weavingVendorId != null)
                                                            .map((b: any) => Number(b.weavingVendorId))));
                                                        return activeVendorList
                                                            .filter((v: any) => ids.includes(Number(v.id)))
                                                            .map((v: any) => ({
                                                                value: String(v.id),
                                                                label: v.vendorName
                                                            }));
                                                    })()}
                                                    placeholder="Select Weaver"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <CommonSearchableSelect
                                                    value={newBeamItem.salesOrderId}
                                                    onValueChange={(value: any) => setNewBeamItem({ ...newBeamItem, salesOrderId: value })}
                                                    className="w-full"
                                                    options={filteredSalesOrders?.map((so: any) => ({
                                                        value: String(so.id),
                                                        label: so.salesOrderNo
                                                    }))}
                                                    placeholder="Select Order"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <input
                                                    type="text"
                                                    value={newBeamItem.sizedBeamNo}
                                                    onChange={handleSizedBeamNoChange}
                                                    onKeyDown={(e) => {
                                                        if (e.key === ' ') e.preventDefault();
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                    placeholder="Enter Beam No"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <CommonSearchableSelect
                                                    value={isExternalOrder ? (newBeamItem.flangeId || "") : currentFlangeSelection}
                                                    onValueChange={(value: string) => {
                                                        const options = isExternalOrder ? externalFlangeOptions : flangeOptions;
                                                        const selected = options.find((fl: any) => String(fl.id) === value);
                                                        setNewBeamItem(prev => ({
                                                            ...prev,
                                                            flangeId: selected ? String(selected.id) : "",
                                                            flangeNo: selected ? selected.flangeNo : "",
                                                        }));
                                                    }}
                                                    className="w-full"
                                                    options={(isExternalOrder ? externalFlangeOptions : flangeOptions).map((fl: any) => ({
                                                        value: String(fl.id),
                                                        label: fl.flangeNo
                                                    }))}
                                                    placeholder="Select Flange"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <input
                                                    type="number"
                                                    value={newBeamItem.fabricPanelWidth || ""}
                                                    onChange={(e) => handleNewBeamWidthChange(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                    placeholder="Width"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <input
                                                    type="number"
                                                    value={newBeamItem.totalEnds || ""}
                                                    onChange={(e) => handleNewBeamTotalEndsChange(e.target.value)}
                                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${isTotalEndsAuto ? "bg-gray-50 text-gray-600" : ""}`}
                                                    readOnly={isTotalEndsAuto}
                                                    placeholder="Total Ends"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <input
                                                    type="number"
                                                    value={newBeamItem.wrapMeters}
                                                    onChange={(e) => setNewBeamItem({ ...newBeamItem, wrapMeters: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                    placeholder="Warp Meters"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <input
                                                    type="number"
                                                    value={newBeamItem.shrinkage}
                                                    onChange={(e) => setNewBeamItem({ ...newBeamItem, shrinkage: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                    placeholder="Shrinkage"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <input
                                                    type="number"
                                                    value={newBeamItem.expectedFabricMeter}
                                                    onChange={(e) => setNewBeamItem({ ...newBeamItem, expectedFabricMeter: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                    placeholder="Expected Meter"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                <div className="flex items-center justify-start gap-2">
                                                    <Button
                                                        type="button"
                                                        onClick={handleSaveNewBeam}
                                                        variant="ghost"
                                                        size="sm"
                                                        className=" bg-green-50 text-green-600 p-2 h-9 w-9 rounded-lg border border-green-600"
                                                        title="Save"
                                                    >
                                                        <Save size={18} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={handleRemoveNewBeamForm}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="bg-red-50 text-red-600 p-2 h-9 w-9 rounded-lg border border-red-600"
                                                        title="Cancel"
                                                    >
                                                        <X size={18} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {beamItems.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50/80 transition-colors duration-150 border border-gray-300">
                                            <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 align-middle">{index + 1}</td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">
                                                {(() => {
                                                    const fid = String((item as any).fabricId || "");
                                                    const u = uniqueQualities.find((u: any) => String(u.fabricId || "") === fid);
                                                    if (u) return `${u.fabricCode} / ${u.quality}`;
                                                    const fm = (fabricMasterList || []).find((f: any) => String(f.id) === fid || String(f.fabricCodeId) === fid);
                                                    return fm ? `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}` : "-";
                                                })()}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">
                                                {weavingContractList?.find((wc: any) => wc.id === parseInt(item.weavingContractId))?.weavingContractNo || item.weavingContractId}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">
                                                {(() => {
                                                    const ven = vendorList?.find((v: any) => v.id === parseInt(item.weavingVendorId));
                                                    return ven?.vendorName || '-';
                                                })()}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">
                                                {salesOrderList?.find((so: any) => so.id === parseInt(item.salesOrderId))?.salesOrderNo || item.salesOrderId}
                                            </td>
                                            <td className="border border-gray-300            px-4 py-3 align-middle">
                                                <input
                                                    type="text"
                                                    value={item.sizedBeamNo || ""}
                                                    onChange={(e) => handleEditSizedBeamNo(index, e)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === ' ') e.preventDefault();
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                    placeholder="Sized Beam No"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    readOnly={isInternalOrder}
                                                    disabled={isInternalOrder}
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                {isExternalOrder ? (
                                                    (() => {
                                                        const beamCompanyId = getCompanyIdForVendor(item.weavingVendorId);
                                                        const beamExternalOptions = getBeamExternalFlangeOptions(item, beamCompanyId);
                                                        const beamExternalLoading = beamCompanyId ? Boolean(externalFlangeLoadingMap[beamCompanyId]) : false;
                                                        return (
                                                            <select
                                                                value={getBeamExternalFlangeSelectionValue(item)}
                                                                onChange={(e) => handleBeamExternalFlangeSelectionChange(index, e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                                                            >
                                                                <option value="">{beamExternalLoading ? "Loading flanges..." : "Select Flange"}</option>
                                                                {beamExternalOptions.map((fl: any) => (
                                                                    <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
                                                                ))}
                                                            </select>
                                                        );
                                                    })()
                                                ) : (
                                                    <select
                                                        value={getBeamFlangeSelectionValue(item)}
                                                        onChange={(e) => handleBeamFlangeSelectionChange(index, e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                                                        disabled={isInternalOrder}
                                                    >
                                                        <option value="">Select Flange</option>
                                                        {flangeOptions.map((fl: any) => (
                                                            <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">{item.fabricPanelWidth || "-"}</td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">{getExternalTotalEndsForBeam(item) || "-"}</td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">{item.wrapMeters || "-"}</td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">{item.shrinkage || "-"}</td>
                                            <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-middle">{item.expectedFabricMeter || "-"}</td>
                                            <td className="border border-gray-300 px-4 py-3 align-middle">
                                                {String(item.isReturn) === "1" ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                        Returned
                                                    </span>
                                                ) : String(item.isBeamOutwarded) === "1" ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                        Outwarded
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center justify-start gap-2">
                                                        <Button
                                                            type="button"
                                                            onClick={() => editBeamItem(index)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-600 bg-blue-50 p-2 h-9 w-9 rounded-lg border border-gray-300"
                                                            title="Edit"
                                                        >
                                                            <Edit size={18} />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            onClick={() => deleteBeamItem(index)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 bg-red-50 p-2 h-9 w-9 rounded-lg border border-gray-300"
                                                            title="Delete"
                                                        >
                                                            <X size={18} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {beamItems.length === 0 && !showAddBeamForm && (
                                <div className="text-center py-12 bg-gray-50 rounded-b-lg">
                                    <ClipboardList size={48} className="mx-auto text-gray-400 mb-3" />
                                    <p className="text-gray-500 text-sm">No beam details added yet</p>
                                    <Button
                                        type="button"
                                        onClick={() => setShowAddBeamForm(true)}
                                        variant="outline"
                                        className="mt-3"
                                    >
                                        <Plus size={16} className="mr-2" />
                                        Add First Beam
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card> */}
                <Card>
                    <div className="flex flex-row p-6 justify-between items-center border-b">
                        <div className="flex items-center gap-2">
                            <ClipboardList size={20} className="text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Beam Details</h3>
                            {beamItems.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    {beamItems.length} {beamItems.length === 1 ? 'Beam' : 'Beams'}
                                </span>
                            )}
                        </div>
                        <div>
                            <Button
                                type="button"
                                onClick={() => {
                                    // Add a new empty row to the form table
                                    const newEmptyBeam: BeamInwardBeamDetails = {
                                        fabricId: "",
                                        weavingContractId: "",
                                        weavingVendorId: "",
                                        salesOrderId: "",
                                        sizedBeamNo: "",
                                        flangeId: "",
                                        flangeNo: "",
                                        wrapMeters: "",
                                        shrinkage: "",
                                        expectedFabricMeter: "",
                                        isBeamOutwarded: "0",
                                        sizingPlanId: selectedSizingPlan?.id ? String(selectedSizingPlan.id) : "",
                                        fabricPanelWidth: "",
                                        totalEnds: "",
                                        dcNumber: watch("dcNumber") || "",
                                        dcDate: watch("dcDate") || "",
                                        sizingSetNo: watch("sizingSetNo") || "",
                                        sizingPickupPercent: watch("sizingPickup") || (selectedSizingPlan?.sizingPickup ? String(selectedSizingPlan.sizingPickup) : ""),
                                        _tempId: Date.now() + Math.random() // Add temp ID for tracking
                                    };
                                    setTempBeamItems([...tempBeamItems, newEmptyBeam]);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
                                disabled={!selectedSizingPlan}
                            >
                                <Plus size={18} className="mr-2" />
                                Add Beam
                            </Button>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            {/* Add New Beam Form Section - Table Format */}
                            {tempBeamItems.length > 0 && (
                                <div className="bg-blue-50/30 border-b border-gray-200 p-4 mb-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-md font-medium text-gray-700">
                                            {isEditingBeam ? 'Edit Beam' : 'Add New Beams'}
                                        </h4>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setTempBeamItems([]);
                                                setBeamEditingIndex(null);
                                                setIsEditingBeam(false);
                                                setEditingBeamIndex(null);
                                            }}
                                            variant="transparent"
                                            size="sm"
                                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
                                        >
                                            Cancel {isEditingBeam ? 'Edit' : 'All'}
                                        </Button>
                                    </div>

                                    <table className="w-full border-collapse border border-gray-300 text-center">
                                        <thead className="bg-gray-100">
                                            <tr className="border border-gray-300">
                                                <th className="border border-gray-300 p-2">#</th>
                                                <th className="border border-gray-300 p-2 min-w-[200px]">Sort No/Construction</th>
                                                <th className="border border-gray-300 p-2 min-w-[180px]">Weaving Contract No</th>
                                                <th className="border border-gray-300 p-2 min-w-[180px]">Weaver</th>
                                                <th className="border border-gray-300 p-2 min-w-[180px]">Sales Order No</th>
                                                <th className="border border-gray-300 p-2 min-w-[150px]">Sized Beam No *</th>
                                                <th className="border border-gray-300 p-2 min-w-[180px]">Empty Beam No</th>
                                                <th className="border border-gray-300 p-2 min-w-[130px]">DC Number</th>
                                                <th className="border border-gray-300 p-2 min-w-[130px]">DC Date</th>
                                                <th className="border border-gray-300 p-2 min-w-[130px]">Sizing Set No</th>
                                                <th className="border border-gray-300 p-2 min-w-[140px]">Sizing Pickup (%)</th>
                                                <th className="border border-gray-300 p-2 w-24">Width</th>
                                                <th className="border border-gray-300 p-2 w-24">Total Ends</th>
                                                <th className="border border-gray-300 p-2 w-28">Warp Meters *</th>
                                                <th className="border border-gray-300 p-2 w-24">Shrinkage %</th>
                                                <th className="border border-gray-300 p-2 w-32">Expected Fabric Meter</th>
                                                <th className="border border-gray-300 p-2 min-w-[100px]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tempBeamItems.map((item, index) => (
                                                <tr key={index} className="border border-gray-300">
                                                    <td className="border border-gray-300 p-2">{index + 1}</td>
                                                    <td className="border border-gray-300 p-2">
                                                        <CommonSearchableSelect
                                                            value={item.fabricId}
                                                            onValueChange={(value) => {
                                                                const matchingContracts = activeWeavingContractList.filter((wc: any) =>
                                                                    (wc.items || []).some((it: any) => String(it.fabricCodeId) === value)
                                                                );
                                                                let newWcId = "";
                                                                let newVendorId = item.weavingVendorId;
                                                                if (matchingContracts.length === 1) {
                                                                    newWcId = String(matchingContracts[0].id);
                                                                    newVendorId = matchingContracts[0].vendorId ? String(matchingContracts[0].vendorId) : "";
                                                                }
                                                                let newSalesOrderId = "";
                                                                if (newWcId && selectedSizingPlan?.sizingBeamDetails?.length) {
                                                                    const wcIdNum = parseInt(newWcId);
                                                                    const soIds = new Set(selectedSizingPlan.sizingBeamDetails.filter((b: any) => b.weavingContractId === wcIdNum).map((b: any) => b.salesOrderId).filter(Boolean));
                                                                    const matching = activeSalesOrderList.filter((so: any) => soIds.has(so.id));
                                                                    if (matching.length === 1) newSalesOrderId = String(matching[0].id);
                                                                }
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, fabricId: value, weavingContractId: newWcId, weavingVendorId: newVendorId, salesOrderId: newSalesOrderId };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full"
                                                            options={(activeFabricMasterList || []).map((fm: any) => ({
                                                                value: String(fm.id),
                                                                label: `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}`
                                                            }))}
                                                            placeholder="Select Quality"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <CommonSearchableSelect
                                                            value={item.weavingContractId}
                                                            onValueChange={(value) => {
                                                                const wc = activeWeavingContractList.find((w: any) => String(w.id) === value);
                                                                const newVendorId = wc?.vendorId ? String(wc.vendorId) : item.weavingVendorId;
                                                                const fabricIds: string[] = Array.from(new Set((wc?.items || []).map((it: any) => String(it.fabricCodeId)).filter(Boolean)));
                                                                const newFabricId = fabricIds.length === 1 ? fabricIds[0] : item.fabricId;
                                                                let newSalesOrderId = "";
                                                                if (wc?.salesOrderId) {
                                                                    const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderId));
                                                                    if (matched) newSalesOrderId = String(matched.id);
                                                                } else if (wc?.salesOrderNo) {
                                                                    const matched = activeSalesOrderList.find((so: any) => String(so.id) === String(wc.salesOrderNo));
                                                                    if (matched) newSalesOrderId = String(matched.id);
                                                                } else if (value && selectedSizingPlan?.sizingBeamDetails?.length) {
                                                                    const wcIdNum = parseInt(value);
                                                                    const soIds = new Set(selectedSizingPlan.sizingBeamDetails.filter((b: any) => b.weavingContractId === wcIdNum).map((b: any) => b.salesOrderId).filter(Boolean));
                                                                    const matching = activeSalesOrderList.filter((so: any) => soIds.has(so.id));
                                                                    if (matching.length === 1) newSalesOrderId = String(matching[0].id);
                                                                }
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, weavingContractId: value, weavingVendorId: newVendorId, fabricId: newFabricId, salesOrderId: newSalesOrderId };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full"
                                                            options={(() => {
                                                                const vid = String(item.weavingVendorId || "");
                                                                const fid = String(item.fabricId || "");
                                                                if (vid) {
                                                                    let base = activeWeavingContractList.filter((wc: any) => String(wc.vendorId) === vid);
                                                                    if (fid) {
                                                                        const filtered = base.filter((wc: any) => (wc.items || []).some((it: any) => String(it.fabricCodeId) === fid));
                                                                        if (filtered.length > 0) base = filtered;
                                                                    }
                                                                    return base.map((wc: any) => ({ value: String(wc.id), label: wc.weavingContractNo }));
                                                                }
                                                                let base: any[] = activeWeavingContractList;
                                                                if (fid) {
                                                                    const filtered = base.filter((wc: any) => (wc.items || []).some((it: any) => String(it.fabricCodeId) === fid));
                                                                    if (filtered.length > 0) base = filtered;
                                                                }
                                                                return base.map((wc: any) => ({ value: String(wc.id), label: wc.weavingContractNo }));
                                                            })()}
                                                            placeholder="Select Contract"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <CommonSearchableSelect
                                                            value={item.weavingVendorId || ""}
                                                            onValueChange={(value) => {
                                                                const matchingContracts = activeWeavingContractList.filter((wc: any) => String(wc.vendorId) === String(value));
                                                                let newWcId = "";
                                                                let newFabricId = item.fabricId;
                                                                if (matchingContracts.length === 1) {
                                                                    newWcId = String(matchingContracts[0].id);
                                                                    const fabricIds: string[] = Array.from(new Set((matchingContracts[0].items || []).map((it: any) => String(it.fabricCodeId)).filter(Boolean)));
                                                                    if (fabricIds.length === 1) newFabricId = fabricIds[0];
                                                                }
                                                                let newSalesOrderId = "";
                                                                if (newWcId && selectedSizingPlan?.sizingBeamDetails?.length) {
                                                                    const wcIdNum = parseInt(newWcId);
                                                                    const soIds = new Set(selectedSizingPlan.sizingBeamDetails.filter((b: any) => b.weavingContractId === wcIdNum).map((b: any) => b.salesOrderId).filter(Boolean));
                                                                    const matching = activeSalesOrderList.filter((so: any) => soIds.has(so.id));
                                                                    if (matching.length === 1) newSalesOrderId = String(matching[0].id);
                                                                }
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, weavingVendorId: value, weavingContractId: newWcId, fabricId: newFabricId, salesOrderId: newSalesOrderId };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full"
                                                            options={(() => {
                                                                const wcId = String(item.weavingContractId || "");
                                                                if (wcId) {
                                                                    const wc = activeWeavingContractList.find((w: any) => String(w.id) === wcId);
                                                                    if (wc?.vendorId) {
                                                                        return weaverVendorList.filter((v: any) => String(v.id) === String(wc.vendorId)).map((v: any) => ({ value: String(v.id), label: v.vendorName }));
                                                                    }
                                                                }
                                                                return weaverVendorList.map((v: any) => ({ value: String(v.id), label: v.vendorName }));
                                                            })()}
                                                            placeholder="Select Weaver"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <CommonSearchableSelect
                                                            value={item.salesOrderId}
                                                            onValueChange={(value) => {
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, salesOrderId: value };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full"
                                                            options={(() => {
                                                                const wcId = item.weavingContractId;
                                                                if (!wcId) return [];
                                                                const wc = activeWeavingContractList.find((w: any) => String(w.id) === String(wcId));
                                                                if (!wc) return [];
                                                                if (wc?.salesOrderNo) {
                                                                    const matched = activeSalesOrderList.filter((so: any) => String(so.id) === String(wc.salesOrderNo));
                                                                    if (matched.length > 0) return matched.map((so: any) => ({ value: String(so.id), label: so.salesOrderNo }));
                                                                }
                                                                if (wc?.salesOrderId) {
                                                                    const matched = activeSalesOrderList.filter((so: any) => String(so.id) === String(wc.salesOrderId));
                                                                    if (matched.length > 0) return matched.map((so: any) => ({ value: String(so.id), label: so.salesOrderNo }));
                                                                }
                                                                if (selectedSizingPlan?.sizingBeamDetails?.length) {
                                                                    const wcIdNum = parseInt(wcId);
                                                                    if (!isNaN(wcIdNum)) {
                                                                        const soIds = new Set(selectedSizingPlan.sizingBeamDetails.filter((b: any) => b.weavingContractId === wcIdNum).map((b: any) => b.salesOrderId).filter(Boolean));
                                                                        const matched = activeSalesOrderList.filter((so: any) => soIds.has(so.id));
                                                                        if (matched.length > 0) return matched.map((so: any) => ({ value: String(so.id), label: so.salesOrderNo }));
                                                                    }
                                                                }
                                                                return [];
                                                            })()}
                                                            placeholder="Select Order"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <input
                                                            type="text"
                                                            value={item.sizedBeamNo}
                                                            onChange={(e) => {
                                                                const value = e.target.value.replace(/\s/g, "");
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, sizedBeamNo: value };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === ' ') e.preventDefault();
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="Beam No"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                          
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <CommonSearchableSelect
                                                            value={isExternalOrder ? getBeamExternalFlangeSelectionValue(item) : getBeamFlangeSelectionValue(item)}
                                                            onValueChange={(value) => {
                                                                const beamCompanyId = getCompanyIdForVendor(item.weavingVendorId);
                                                                const options = isExternalOrder ? getBeamExternalFlangeOptions(item, beamCompanyId) : flangeOptions;
                                                                const selected = options.find((fl: any) => String(fl.id) === value);
                                                                const candidateFlangeNo = selected ? (selected.flangeNo ?? "").trim() : "";
                                                                const candidateFlangeId = selected ? String(selected.id) : "";

                                                                if (candidateFlangeNo || candidateFlangeId) {
                                                                    const isDuplicateTemp = isFlangeDuplicate(candidateFlangeId || undefined, candidateFlangeNo, tempBeamItems as BeamInwardBeamDetails[], index);
                                                                    const editExcludeIndex = isEditingBeam ? editingBeamIndex ?? undefined : undefined;
                                                                    const isDuplicateMain = isFlangeDuplicate(candidateFlangeId || undefined, candidateFlangeNo, beamItems, editExcludeIndex);

                                                                    if (isDuplicateTemp || isDuplicateMain) {
                                                                        toast.error(`Empty Beam No "${selected?.flangeNo}" is already used`);
                                                                        return;
                                                                    }
                                                                }

                                                                const updated = [...tempBeamItems];
                                                                updated[index] = {
                                                                    ...item,
                                                                    flangeId: selected ? String(selected.id) : "",
                                                                    flangeNo: candidateFlangeNo,
                                                                };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full"
                                                            options={(isExternalOrder ? getBeamExternalFlangeOptions(item, getCompanyIdForVendor(item.weavingVendorId)) : flangeOptions).map((fl: any) => ({
                                                                value: String(fl.id),
                                                                label: fl.flangeNo
                                                            }))}
                                                            placeholder="Select Flange"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <input
                                                            type="text"
                                                            value={item.dcNumber || watch("dcNumber") || ""}
                                                            onChange={(e) => {
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, dcNumber: e.target.value };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="DC Number"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <input
                                                            type="date"
                                                            value={item.dcDate || watch("dcDate") || ""}
                                                            onChange={(e) => {
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, dcDate: e.target.value };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <input
                                                            type="text"
                                                            value={item.sizingSetNo || watch("sizingSetNo") || ""}
                                                            onChange={(e) => {
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, sizingSetNo: e.target.value };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="Sizing Set No"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={item.sizingPickupPercent !== undefined && item.sizingPickupPercent !== "" ? item.sizingPickupPercent : (watch("sizingPickup") || "")}
                                                            onChange={(e) => {
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, sizingPickupPercent: e.target.value };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="Sizing Pickup %"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <input
                                                            type="number"
                                                            value={item.fabricPanelWidth || ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const updated = [...tempBeamItems];
                                                                const base = getFabricTotalEndsBase(item.fabricId);
                                                                const computed = base ? computeQualityTotalEnds(base, value) : item.totalEnds;
                                                                updated[index] = {
                                                                    ...item,
                                                                    fabricPanelWidth: value,
                                                                    totalEnds: base ? computed : item.totalEnds
                                                                };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="Width"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <input
                                                            type="number"
                                                            value={item.totalEnds || ""}
                                                            onChange={(e) => {
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, totalEnds: e.target.value };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className={`w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${Boolean(getFabricTotalEndsBase(item.fabricId)) ? "bg-gray-50" : ""}`}
                                                            readOnly={Boolean(getFabricTotalEndsBase(item.fabricId))}
                                                            placeholder="Total Ends"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <input
                                                            type="number"
                                                            value={item.wrapMeters}
                                                            onChange={(e) => {
                                                                const warp = parseFloat(e.target.value);
                                                                const shrink = parseFloat(item.shrinkage);
                                                                const widthValue = parseFloat(item.fabricPanelWidth || "1");
                                                                const updated = [...tempBeamItems];
                                                                let expectedFabricMeter = item.expectedFabricMeter;
                                                                if (!isNaN(warp) && !isNaN(shrink)) {
                                                                    const base = warp * widthValue;
                                                                    expectedFabricMeter = Number(base - (base * (shrink / 100))).toFixed(2);
                                                                }
                                                                updated[index] = {
                                                                    ...item,
                                                                    wrapMeters: e.target.value,
                                                                    expectedFabricMeter
                                                                };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="Warp Meters"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <input
                                                            type="number"
                                                            value={item.shrinkage}
                                                            onChange={(e) => {
                                                                const shrink = parseFloat(e.target.value);
                                                                const warp = parseFloat(item.wrapMeters);
                                                                const widthValue = parseFloat(item.fabricPanelWidth || "1");
                                                                const updated = [...tempBeamItems];
                                                                let expectedFabricMeter = item.expectedFabricMeter;
                                                                if (!isNaN(warp) && !isNaN(shrink)) {
                                                                    const base = warp * widthValue;
                                                                    expectedFabricMeter = Number(base - (base * (shrink / 100))).toFixed(2);
                                                                }
                                                                updated[index] = {
                                                                    ...item,
                                                                    shrinkage: e.target.value,
                                                                    expectedFabricMeter
                                                                };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="Shrinkage"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <input
                                                            type="number"
                                                            value={item.expectedFabricMeter}
                                                            onChange={(e) => {
                                                                const updated = [...tempBeamItems];
                                                                updated[index] = { ...item, expectedFabricMeter: e.target.value };
                                                                setTempBeamItems(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="Expected"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-300 p-2">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {/* <Button
                                                                type="button"
                                                                onClick={() => {
                                                                    // Remove this row from temp
                                                                    const updated = tempBeamItems.filter((_, i) => i !== index);
                                                                    setTempBeamItems(updated);
                                                                }}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <X size={18} />
                                                            </Button> */}
                                                             <Button
                                                            type="button"
                                                            onClick={() => {
                                                                    // Remove this row from temp
                                                                    const updated = tempBeamItems.filter((_, i) => i !== index);
                                                                    setTempBeamItems(updated);
                                                                }}
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <X size={18} />
                                                        </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* <div className="flex justify-end mt-4 space-x-2">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                // Validate all temp rows before saving
                                                let hasError = false;
                                                for (let i = 0; i < tempBeamItems.length; i++) {
                                                    const item = tempBeamItems[i];
                                                    if (!item.sizedBeamNo || !item.sizedBeamNo.trim()) {
                                                        toast.error(`Row ${i + 1}: Sized Beam No is required`);
                                                        hasError = true;
                                                        break;
                                                    }
                                                    if (!item.wrapMeters || item.wrapMeters === "") {
                                                        toast.error(`Row ${i + 1}: Warp Meters is required`);
                                                        hasError = true;
                                                        break;
                                                    }
                                                    // User requested to only keep Sized Beam No and Warp Meters mandatory
                                                    // if (!item.fabricId || !item.weavingContractId || !item.weavingVendorId || !item.salesOrderId) {
                                                    //   toast.error(`Row ${i + 1}: Please fill all required fields (Fabric, Contract, Weaver, Sales Order)`);
                                                    //   hasError = true;
                                                    //   break;
                                                    // }
                                                }

                                                if (hasError) return;

                                                // Check for duplicate Sized Beam Nos in temp items
                                                const sizedBeamNos = new Set();
                                                for (let i = 0; i < tempBeamItems.length; i++) {
                                                    const key = tempBeamItems[i].sizedBeamNo.trim().toLowerCase();
                                                    if (sizedBeamNos.has(key)) {
                                                        toast.error(`Duplicate Sized Beam No found in row ${i + 1}`);
                                                        return;
                                                    }
                                                    sizedBeamNos.add(key);
                                                }

                                                // Check for duplicate Flange Nos in temp items
                                                const flangeNos = new Set();
                                                for (let i = 0; i < tempBeamItems.length; i++) {
                                                    const flangeNo = (tempBeamItems[i].flangeNo || "").trim().toLowerCase();
                                                    if (flangeNo && flangeNos.has(flangeNo)) {
                                                        toast.error(`Duplicate Empty Beam No found in row ${i + 1}`);
                                                        return;
                                                    }
                                                    if (flangeNo) flangeNos.add(flangeNo);
                                                }

                                                // Check against existing beamItems
                                                for (let i = 0; i < tempBeamItems.length; i++) {
                                                    const newSizedBeamNo = tempBeamItems[i].sizedBeamNo.trim().toLowerCase();
                                                    const existingDuplicate = beamItems.some(existing =>
                                                        (existing.sizedBeamNo || "").trim().toLowerCase() === newSizedBeamNo
                                                    );
                                                    if (existingDuplicate) {
                                                        toast.error(`Sized Beam No "${tempBeamItems[i].sizedBeamNo}" already exists`);
                                                        return;
                                                    }

                                                    const newFlangeNo = (tempBeamItems[i].flangeNo || "").trim();
                                                    const newFlangeId = tempBeamItems[i].flangeId ? String(tempBeamItems[i].flangeId) : undefined;
                                                    if (newFlangeNo || newFlangeId) {
                                                        if (isFlangeDuplicate(newFlangeId, newFlangeNo, beamItems)) {
                                                            toast.error(`Empty Beam No "${tempBeamItems[i].flangeNo}" already exists`);
                                                            return;
                                                        }
                                                    }
                                                }

                                                // All validations passed, add all temp items to beamItems
                                                const sanitizedBeams = tempBeamItems.map(item => {
                                                    const meta = resolveFabricMeta(item.fabricId);
                                                    const derivedTotalEnds = isExternalOrder ? getExternalTotalEndsForBeam(item) : item.totalEnds;
                                                    return {
                                                        ...item,
                                                        sizedBeamNo: item.sizedBeamNo.trim(),
                                                        fabricPanelWidth: item.fabricPanelWidth || meta?.fabricPanelWidth || "",
                                                        totalEnds: derivedTotalEnds || meta?.totalEnds || "",
                                                    };
                                                });

                                                setBeamItems([...beamItems, ...sanitizedBeams]);
                                                setTempBeamItems([]);
                                                setBeamEditingIndex(null);
                                                toast.success(`${sanitizedBeams.length} beam(s) added successfully`);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Save size={18} className="mr-2" />
                                            Save All Beams ({tempBeamItems.length})
                                        </Button>
                                    </div> */}
                                    <div className="flex justify-end mt-4 space-x-2">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (isEditingBeam && editingBeamIndex !== null) {
                                                    // Update existing beam
                                                    const item = tempBeamItems[0]; // Only one item when editing
                                                    const trimmedSizedBeamNo = item.sizedBeamNo?.trim();

                                                    // Validate
                                                    if (!trimmedSizedBeamNo) {
                                                        toast.error("Sized Beam No is required");
                                                        return;
                                                    }
                                                    if (!item.wrapMeters || item.wrapMeters === "") {
                                                        toast.error("Warp Meters is required");
                                                        return;
                                                    }

                                                    // Check for duplicate Sized Beam No (excluding current)
                                                    const normalizedSizedBeamNo = trimmedSizedBeamNo.toLowerCase();
                                                    const hasDuplicateSizedBeamNo = beamItems.some((beam, idx) => {
                                                        if (idx === editingBeamIndex) return false;
                                                        const existing = (beam.sizedBeamNo || "").trim().toLowerCase();
                                                        return existing && existing === normalizedSizedBeamNo;
                                                    });

                                                    if (hasDuplicateSizedBeamNo) {
                                                        toast.error("Sized Beam No already exists");
                                                        return;
                                                    }

                                                    // Check for duplicate Empty Beam No (excluding current)
                                                    const trimmedFlangeNo = (item.flangeNo || "").trim();
                                                    const candidateFlangeId = item.flangeId ? String(item.flangeId) : undefined;
                                                    if (trimmedFlangeNo || candidateFlangeId) {
                                                        if (isFlangeDuplicate(candidateFlangeId, trimmedFlangeNo, beamItems, editingBeamIndex)) {
                                                            toast.error("Empty Beam No already exists");
                                                            return;
                                                        }
                                                    }

                                                    // Update the beam
                                                    const meta = resolveFabricMeta(item.fabricId);
                                                    const derivedTotalEnds = isExternalOrder ? getExternalTotalEndsForBeam(item) : item.totalEnds;
                                                    const updatedBeam: BeamInwardBeamDetails = {
                                                        ...item,
                                                        sizedBeamNo: trimmedSizedBeamNo,
                                                        flangeNo: isExternalOrder ? trimmedFlangeNo : item.flangeNo,
                                                        fabricPanelWidth: item.fabricPanelWidth || meta?.fabricPanelWidth || "",
                                                        totalEnds: derivedTotalEnds || meta?.totalEnds || "",
                                                        wrapMeters: item.wrapMeters !== "" && !isNaN(Number(item.wrapMeters))
                                                            ? Number(item.wrapMeters).toFixed(2)
                                                            : item.wrapMeters,
                                                        expectedFabricMeter: item.expectedFabricMeter !== "" && !isNaN(Number(item.expectedFabricMeter))
                                                            ? Number(item.expectedFabricMeter).toFixed(2)
                                                            : item.expectedFabricMeter,
                                                        sizingPickupPercent: item.sizingPickupPercent || watch("sizingPickup") || "",
                                                    };

                                                    const updatedBeamItems = [...beamItems];
                                                    updatedBeamItems[editingBeamIndex] = updatedBeam;
                                                    setBeamItems(updatedBeamItems);

                                                    // Reset states
                                                    setTempBeamItems([]);
                                                    setIsEditingBeam(false);
                                                    setEditingBeamIndex(null);

                                                    toast.success("Beam updated successfully");
                                                } else {
                                                    // Save all new beams (existing code)
                                                    let hasError = false;
                                                    for (let i = 0; i < tempBeamItems.length; i++) {
                                                        const item = tempBeamItems[i];
                                                        if (!item.sizedBeamNo || !item.sizedBeamNo.trim()) {
                                                            toast.error(`Row ${i + 1}: Sized Beam No is required`);
                                                            hasError = true;
                                                            break;
                                                        }
                                                        if (!item.wrapMeters || item.wrapMeters === "") {
                                                            toast.error(`Row ${i + 1}: Warp Meters is required`);
                                                            hasError = true;
                                                            break;
                                                        }
                                                    }

                                                    if (hasError) return;

                                                    // Check for duplicate Sized Beam Nos in temp items
                                                    const sizedBeamNos = new Set();
                                                    for (let i = 0; i < tempBeamItems.length; i++) {
                                                        const key = tempBeamItems[i].sizedBeamNo.trim().toLowerCase();
                                                        if (sizedBeamNos.has(key)) {
                                                            toast.error(`Duplicate Sized Beam No found in row ${i + 1}`);
                                                            return;
                                                        }
                                                        sizedBeamNos.add(key);
                                                    }

                                                    // Check for duplicate Flange Nos in temp items
                                                    const flangeKeys = new Set<string>();
                                                    for (let i = 0; i < tempBeamItems.length; i++) {
                                                        const key = getFlangeKey(
                                                            tempBeamItems[i].flangeId ? String(tempBeamItems[i].flangeId) : undefined,
                                                            tempBeamItems[i].flangeNo
                                                        );
                                                        if (key && flangeKeys.has(key)) {
                                                            toast.error(`Duplicate Empty Beam No found in row ${i + 1}`);
                                                            return;
                                                        }
                                                        if (key) flangeKeys.add(key);
                                                    }

                                                    // Check against existing beamItems
                                                    for (let i = 0; i < tempBeamItems.length; i++) {
                                                        const newSizedBeamNo = tempBeamItems[i].sizedBeamNo.trim().toLowerCase();
                                                        const existingDuplicate = beamItems.some(existing =>
                                                            (existing.sizedBeamNo || "").trim().toLowerCase() === newSizedBeamNo
                                                        );
                                                        if (existingDuplicate) {
                                                            toast.error(`Sized Beam No "${tempBeamItems[i].sizedBeamNo}" already exists`);
                                                            return;
                                                        }

                                                        const newFlangeNo = (tempBeamItems[i].flangeNo || "").trim();
                                                        const newFlangeId = tempBeamItems[i].flangeId ? String(tempBeamItems[i].flangeId) : undefined;
                                                        if (newFlangeNo || newFlangeId) {
                                                            if (isFlangeDuplicate(newFlangeId, newFlangeNo, beamItems)) {
                                                                toast.error(`Empty Beam No "${tempBeamItems[i].flangeNo}" already exists`);
                                                                return;
                                                            }
                                                        }
                                                    }

                                                    // All validations passed, add all temp items to beamItems
                                                    const sanitizedBeams = tempBeamItems.map(item => {
                                                        const meta = resolveFabricMeta(item.fabricId);
                                                        const derivedTotalEnds = isExternalOrder ? getExternalTotalEndsForBeam(item) : item.totalEnds;
                                                        return {
                                                            ...item,
                                                            sizedBeamNo: item.sizedBeamNo.trim(),
                                                            fabricPanelWidth: item.fabricPanelWidth || meta?.fabricPanelWidth || "",
                                                            totalEnds: derivedTotalEnds || meta?.totalEnds || "",
                                                            wrapMeters: item.wrapMeters !== "" && !isNaN(Number(item.wrapMeters))
                                                                ? Number(item.wrapMeters).toFixed(2)
                                                                : item.wrapMeters,
                                                            expectedFabricMeter: item.expectedFabricMeter !== "" && !isNaN(Number(item.expectedFabricMeter))
                                                                ? Number(item.expectedFabricMeter).toFixed(2)
                                                                : item.expectedFabricMeter,
                                                            sizingPickupPercent: item.sizingPickupPercent || watch("sizingPickup") || "",
                                                        };
                                                    });

                                                    setBeamItems([...beamItems, ...sanitizedBeams]);
                                                    setTempBeamItems([]);
                                                    setBeamEditingIndex(null);
                                                    toast.success(`${sanitizedBeams.length} beam(s) added successfully`);
                                                }
                                            }}
                                            className={`${isEditingBeam ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                                        >
                                            <Save size={18} className="mr-2" />
                                            {isEditingBeam ? 'Update Beam' : `Save All Beams (${tempBeamItems.length})`}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Main Beam Details Table */}
                            <table className="w-full border-collapse border border-gray-300 text-center">
                                <thead className="bg-gray-100">
                                    <tr className="border border-gray-300">
                                        <th className="border border-gray-300 p-2">Sl.No</th>
                                        <th className="border border-gray-300 p-2 min-w-[200px]">Sort No/Construction</th>
                                        <th className="border border-gray-300 p-2 min-w-[180px]">Weaving Contract No</th>
                                        <th className="border border-gray-300 p-2 min-w-[180px]">Weaver</th>
                                        <th className="border border-gray-300 p-2 min-w-[180px]">Sales Order No</th>
                                        <th className="border border-gray-300 p-2 min-w-[150px]">Sized Beam No</th>
                                        <th className="border border-gray-300 p-2 min-w-[180px]">Empty Beam No</th>
                                        <th className="border border-gray-300 p-2 min-w-[130px]">DC Number</th>
                                        <th className="border border-gray-300 p-2 min-w-[130px]">DC Date</th>
                                        <th className="border border-gray-300 p-2 min-w-[130px]">Sizing Set No</th>
                                        <th className="border border-gray-300 p-2 min-w-[140px]">Sizing Pickup (%)</th>
                                        <th className="border border-gray-300 p-2 w-24">Width</th>
                                        <th className="border border-gray-300 p-2 w-24">Total Ends</th>
                                        <th className="border border-gray-300 p-2 w-28">Warp Meters</th>
                                        <th className="border border-gray-300 p-2 w-24">Shrinkage %</th>
                                        <th className="border border-gray-300 p-2 w-32">Expected Fabric Meter</th>
                                        <th className="border border-gray-300 p-2 min-w-[100px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {beamItems.map((item, index) => (
                                        <tr key={index} className="border border-gray-300">
                                            <td className="border border-gray-300 p-2">{index + 1}</td>
                                            <td className="border border-gray-300 p-2">
                                                {(() => {
                                                    const fid = String((item as any).fabricId || "");
                                                    const u = uniqueQualities.find((u: any) => String(u.fabricId || "") === fid);
                                                    if (u) return `${u.fabricCode} / ${u.quality}`;
                                                    const fm = (fabricMasterList || []).find((f: any) => String(f.id) === fid || String(f.fabricCodeId) === fid);
                                                    return fm ? `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}` : "-";
                                                })()}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {weavingContractList?.find((wc: any) => wc.id === parseInt(item.weavingContractId))?.weavingContractNo || item.weavingContractId}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {(() => {
                                                    const ven = vendorList?.find((v: any) => v.id === parseInt(item.weavingVendorId));
                                                    return ven?.vendorName || '-';
                                                })()}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {salesOrderList?.find((so: any) => so.id === parseInt(item.salesOrderId))?.salesOrderNo || item.salesOrderId}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                <input
                                                    type="text"
                                                    value={item.sizedBeamNo || ""}
                                                    onChange={(e) => handleEditSizedBeamNo(index, e)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === ' ') e.preventDefault();
                                                    }}
                                                    className="input w-full text-center"
                                                    placeholder="Enter Sized Beam No"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    
                                                    disabled={isInternalOrder}
                                                />
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {isExternalOrder ? (
                                                    (() => {
                                                        const beamCompanyId = getCompanyIdForVendor(item.weavingVendorId);
                                                        const beamExternalOptions = getBeamExternalFlangeOptions(item, beamCompanyId);
                                                        const beamExternalLoading = beamCompanyId ? Boolean(externalFlangeLoadingMap[beamCompanyId]) : false;
                                                        return (
                                                            <select
                                                                value={getBeamExternalFlangeSelectionValue(item)}
                                                                onChange={(e) => handleBeamExternalFlangeSelectionChange(index, e.target.value)}
                                                                className="input w-full"
                                                                disabled
                                                            >
                                                                <option value="">{beamExternalLoading ? "Loading flanges..." : "Select Flange"}</option>
                                                                {beamExternalOptions.map((fl: any) => (
                                                                    <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
                                                                ))}
                                                            </select>
                                                        );
                                                    })()
                                                ) : (
                                                    <select
                                                        value={getBeamFlangeSelectionValue(item)}
                                                        onChange={(e) => handleBeamFlangeSelectionChange(index, e.target.value)}
                                                        className="input w-full"
                                                        disabled={isInternalOrder}
                                                    >
                                                        <option value="">Select Flange</option>
                                                        {flangeOptions.map((fl: any) => (
                                                            <option key={String(fl.id)} value={String(fl.id)}>{fl.flangeNo}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            <td className="border border-gray-300 p-2 min-w-[120px]">
                                                <input
                                                    type="text"
                                                    value={item.dcNumber || watch("dcNumber") || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setBeamItems(prev => prev.map((b, i) => i === index ? { ...b, dcNumber: val } : b));
                                                    }}
                                                    className="input w-full text-center"
                                                    placeholder="DC Number"
                                                />
                                            </td>
                                            <td className="border border-gray-300 p-2 min-w-[130px]">
                                                <input
                                                    type="date"
                                                    value={item.dcDate || watch("dcDate") || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setBeamItems(prev => prev.map((b, i) => i === index ? { ...b, dcDate: val } : b));
                                                    }}
                                                    className="input w-full text-center"
                                                />
                                            </td>
                                            <td className="border border-gray-300 p-2 min-w-[130px]">
                                                <input
                                                    type="text"
                                                    value={item.sizingSetNo || watch("sizingSetNo") || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setBeamItems(prev => prev.map((b, i) => i === index ? { ...b, sizingSetNo: val } : b));
                                                    }}
                                                    className="input w-full text-center"
                                                    placeholder="Sizing Set No"
                                                />
                                            </td>
                                            <td className="border border-gray-300 p-2 min-w-[130px]">
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={item.sizingPickupPercent !== undefined && item.sizingPickupPercent !== "" ? item.sizingPickupPercent : (watch("sizingPickup") || "")}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setBeamItems(prev => prev.map((b, i) => i === index ? { ...b, sizingPickupPercent: val } : b));
                                                    }}
                                                    className="input w-full text-center"
                                                    placeholder="Sizing Pickup %"
                                                />
                                            </td>
                                            <td className="border border-gray-300 p-2">{item.fabricPanelWidth || "-"}</td>
                                            <td className="border border-gray-300 p-2">{getExternalTotalEndsForBeam(item) || "-"}</td>
                                            <td className="border border-gray-300 p-2">
                                                {item.wrapMeters != null && !isNaN(Number(item.wrapMeters))
                                                    ? Number(item.wrapMeters).toFixed(2)
                                                    : item.wrapMeters || "-"}
                                            </td>
                                            <td className="border border-gray-300 p-2">{item.shrinkage || "-"}</td>
                                            <td className="border border-gray-300 p-2">
                                                {item.expectedFabricMeter != null && !isNaN(Number(item.expectedFabricMeter))
                                                    ? Number(item.expectedFabricMeter).toFixed(2)
                                                    : item.expectedFabricMeter || "-"}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {String(item.isReturn) === "1" ? (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">Returned</span>
                                                ) : String(item.isBeamOutwarded) === "1" ? (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-700">Outwarded</span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            type="button"
                                                            onClick={() => editBeamItem(index)}
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Edit size={18} />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            onClick={() => deleteBeamItem(index)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <X size={18} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {beamItems.length === 0 && tempBeamItems.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 rounded-b-lg">
                                    <ClipboardList size={48} className="mx-auto text-gray-400 mb-3" />
                                    <p className="text-gray-500 text-sm">No beam details added yet</p>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const newEmptyBeam: BeamInwardBeamDetails = {
                                                fabricId: "",
                                                weavingContractId: "",
                                                weavingVendorId: "",
                                                salesOrderId: "",
                                                sizedBeamNo: "",
                                                flangeId: "",
                                                flangeNo: "",
                                                wrapMeters: "",
                                                shrinkage: "",
                                                expectedFabricMeter: "",
                                                isBeamOutwarded: "0",
                                                sizingPlanId: selectedSizingPlan?.id ? String(selectedSizingPlan.id) : "",
                                                fabricPanelWidth: "",
                                                totalEnds: "",
                                                dcNumber: watch("dcNumber") || "",
                                                dcDate: watch("dcDate") || "",
                                                sizingSetNo: watch("sizingSetNo") || "",
                                                sizingPickupPercent: watch("sizingPickup") || "",
                                                _tempId: Date.now() + Math.random()
                                            };
                                            setTempBeamItems([newEmptyBeam]);
                                        }}
                                        variant="outline"
                                        className="mt-3"
                                    >
                                        <Plus size={16} className="mr-2" />
                                        Add First Beam
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                    onClick={handleSubmit(onSubmit)}
                    className="bg-primary hover:bg-primary text-white px-6 flex items-center"
                >
                    <Save size={18} className="mr-2" />
                    {beamInwardDtl?.id ? "Update Beam Inward" : "Save Beam Inward"}
                </Button>
                </div>
        </div>
    );
};

export default BeamInwardEntry;
