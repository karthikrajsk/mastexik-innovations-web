// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// import { FileText, ShoppingCart, ClipboardList, Edit, Trash2, Save, ArrowLeft } from "lucide-react";
// import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useForm } from "react-hook-form";
// import { Checkbox } from "@/components/ui/checkbox";
// import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
// import { toast } from "react-toastify";
// import { AppDispatch, RootState } from "@/state/store";
// import { useDispatch, useSelector } from "react-redux";
// import { getAllCustomers } from "@/state/customerSlice";
// import { getAllProductCategory } from "@/state/productCategorySlice";
// import { getAllSalesOrders } from "@/state/salesOrderSlice";
// import { getAllFabricMasters } from "@/state/fabricMasterSlice";
// import { getAllVendors } from "@/state/vendorSlice";
// import { getAllTermsConditions } from "@/state/termsConditions";
// import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
// import { createWeavingContract, getAllWeavingContract, getYarnRequirementsWithAvailability, updateWeavingContract } from "@/state/weavingContractSlice";
// import apiService from "@/services/ApiService";
// import { documentNumberService } from "@/services/DocumentNumberService";
// import { useLocation, useNavigate } from "react-router-dom";
// import { getCompanyById, getAllCompanies } from "@/state/company-master-slice";
// import { getAllStates } from "@/state/stateSlice";
// import { VENDOR_TYPE_ALL, filterVendorsByTypeIds } from "@/utils/vendorFilters";
// import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
// import { useAutoDocumentNumber } from "@/components/common/useAutoDocumentNumber";
// import { getAllYarnMasters } from "@/state/yarnSlice";

// interface WeavingContractFormData {
//   contractDate: string;
//   taxId: string; // 1: CGST/SGST, 2: IGST
//   vendorId: string;
//   orderTypeId: string; // 1: Internal, 2: External
//   termsConditionsId: string;
//   paymentTermsId: string;
//   remarks: string;
//   items: WeavingContractItem[];
//   yarnRequirements: YarnRequirement[];
//   orderDetails?: OrderDetail[];
// }

// interface WeavingContractItem {
//   id?: number; // ADD THIS
//   fabricCodeId: string;
//   fabricTypeId: string;
//   fabricCategoryId: string;
//   quantity: string;
//   pickCost: string;
//   plannedStartDate: string;
//   plannedEndDate: string;
//   dailyTarget: string;
//   numberOfLooms: string;
//   warpLength: string;
//   warpCrimpPercentage: string;
//   pieceLength: string;
//   numberOfPieces: string;
//   ppi: string;
//   ratePerUnit: string;
//   activeFlag: boolean;
// }

// interface YarnRequirement {
//   id?: number; // ADD THIS
//   yarnId?: number;
//   yarnType: string;
//   yarnCount: string;
//   gramsPerMeter: number;
//   totalWeavingOrderQty: number;
//   totalRequiredQty: number;
//   totalAvailableQty: number;
//   activeFlag: boolean;
// }

// interface OrderDetail {
//   id?: number; // ADD THIS
//   fabricCodeId?: string;
//   salesOrderNo: string;
//   orderQuantity: string;
//   plannedQuantity: string;
//   totalQuantity: string;
// }

// const WEAVING_VENDOR_TYPE_IDS = [303, VENDOR_TYPE_ALL];

// interface FabricMaster {
//   id: number;
//   fabricType: number;
//   fabricCode: string;
//   fabricName: string;
//   weave: number;
//   fabricQuality: string;
//   uom: string;
//   epi: number;
//   ppi: number;
//   greigeCode: string;
//   totalEnds: number;
//   gsm: number;
//   glm: number;
//   igst: number;
//   cgst: number;
//   sgst: number;
//   fabricImageUrl: string;
//   warpDetails: YarnDetail[];
//   weftDetails: YarnDetail[];
//   procuctCategoryId: number | null;
// }

// interface YarnDetail {
//   id: number;
//   yarnId: number;
//   color: number;
//   shrinkagePercent: number;
//   gramsPerMeter: number;
// }

// type Vendor = {
//   id: number;
//   customerName: string;
//   address: {
//     id?: number;
//     line1: string;
//     line2: string;
//     countryId: number;
//     stateId: number;
//     cityId: number;
//   };
// };

// export function WeavingContractEntry() {

//   const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions);
//   const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);

//   const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
//   const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
//   const { vendorList } = useSelector((state: RootState) => state.vendor);
//   const { companyMasterList } = useSelector((state: RootState) => state.companyMaster);
//   const parseCompanyIdValue = useCallback((value: unknown) => {
//     if (value === null || value === undefined) {
//       return null;
//     }
//     const parsed = parseInt(String(value).trim(), 10);
//     return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
//   }, []);
//   const getValidCompanyId = useCallback(() => {
//     if (typeof window === "undefined") return null;
//     const storedCompanyId = parseCompanyIdValue(localStorage.getItem('selectedCompanyId'));
//     if (storedCompanyId) {
//       return storedCompanyId;
//     }
//     const legacyCompanyEntry = localStorage.getItem('selectedCompany');
//     if (legacyCompanyEntry) {
//       try {
//         const parsedLegacyCompany = JSON.parse(legacyCompanyEntry);
//         const legacyId = parseCompanyIdValue(parsedLegacyCompany?.id ?? parsedLegacyCompany?.companyId);
//         if (legacyId) {
//           return legacyId;
//         }
//       } catch {
//         const legacyId = parseCompanyIdValue(legacyCompanyEntry);
//         if (legacyId) {
//           return legacyId;
//         }
//       }
//     }
//     const authPayload = localStorage.getItem('authPayload');
//     if (authPayload) {
//       try {
//         const parsedAuthPayload = JSON.parse(authPayload);
//         const authCompanyId = parseCompanyIdValue(parsedAuthPayload?.user?.selectedCompany?.id ?? parsedAuthPayload?.user?.companyId);
//         if (authCompanyId) {
//           return authCompanyId;
//         }
//       } catch { }
//     }
//     return null;
//   }, [parseCompanyIdValue]);


//   const selectedCompanyId = useMemo(() => getValidCompanyId(), [getValidCompanyId]);
//   const companyOptions = useMemo(() => {
//     if (Array.isArray(companyMasterList)) {
//       return companyMasterList;
//     }
//     if (Array.isArray(companyMasterList?.data)) {
//       return companyMasterList.data;
//     }
//     return [];
//   }, [companyMasterList]);
//   const normalizeName = useCallback((value?: string | number | null) => {
//     if (value === undefined || value === null) {
//       return "";
//     }
//     return String(value).toLowerCase().replace(/[\s\W]+/g, "");
//   }, []);
//   const companyNameLookup = useMemo(() => {
//     const map = new Map<string, number>();
//     companyOptions.forEach((company: any) => {
//       const id = company?.id ?? company?.companyId;
//       if (!id) {
//         return;
//       }
//       const candidates = [
//         company?.companyName,
//         company?.name,
//         company?.legalName,
//         company?.displayName,
//       ];
//       candidates.forEach((name) => {
//         const key = normalizeName(name);
//         if (key && !map.has(key)) {
//           map.set(key, Number(id));
//         }
//       });
//     });
//     return map;
//   }, [companyOptions, normalizeName]);
//   const resolveFactoryCompanyId = useCallback((vendor?: any) => {
//     if (!vendor) {
//       return null;
//     }
//     const directIds = [
//       vendor?.companyId,
//       vendor?.company?.id,
//       vendor?.company?.companyId,
//     ].filter((id) => id !== undefined && id !== null);
//     for (const directId of directIds) {
//       const matched = companyOptions.find((company: any) => String(company?.id ?? company?.companyId) === String(directId));
//       if (matched) {
//         return Number(matched.id ?? matched.companyId);
//       }
//     }
//     const nameCandidates = [
//       vendor?.vendorName,
//       vendor?.customerName,
//       vendor?.companyName,
//       vendor?.name,
//     ];
//     for (const name of nameCandidates) {
//       const key = normalizeName(name);
//       if (key && companyNameLookup.has(key)) {
//         return companyNameLookup.get(key) ?? null;
//       }
//     }
//     return null;
//   }, [companyOptions, companyNameLookup, normalizeName]);
//   const fetchYarnAvailability = useCallback(async (yarnIds: (number | string)[]) => {
//     if (!yarnIds.length || !selectedCompanyId) return {};

//     try {
//       const uniqueIds = Array.from(new Set(yarnIds)).filter(Boolean);
//       const responses = await Promise.all(
//         uniqueIds.map((id) =>
//           apiService.get(`/sizing-yarn-issues/yarn-inward-stock?itemId=${id}&companyId=${selectedCompanyId}`)
//         )
//       );

//       const availabilityMap: Record<string, number> = {};
//       responses.forEach((response, index) => {
//         const id = uniqueIds[index];
//         const data = Array.isArray(response.data) ? response.data : [];
//         const total = data.reduce((sum: number, item: any) => sum + (parseFloat(item.availableQty) || 0), 0);
//         availabilityMap[String(id)] = total;
//       });

//       return availabilityMap;
//     } catch (error) {
//       console.error("Error fetching yarn availability:", error);
//       return {};
//     }
//   }, [selectedCompanyId]);

//   const [weavingContractItemDtl, setweavingContractItemDtl] = useState<WeavingContractItem[]>([]);
//   const [yarnRequirements, setYarnRequirements] = useState<YarnRequirement[]>([]);
//   const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
//   const [orderDetailsError, setOrderDetailsError] = useState<string>("");
//   const [initializedContractId, setInitializedContractId] = useState<number | null>(null);
//   const [fabricHydratedContractId, setFabricHydratedContractId] = useState<number | null>(null);
//   const [fabricOptions, setFabricOptions] = useState<{ id: string; name: string }[]>([]);
//   const [newItem, setNewItem] = useState<WeavingContractItem>({
//     fabricCodeId: '',
//     fabricTypeId: '',
//     fabricCategoryId: '',
//     quantity: '',
//     pickCost: '',
//     plannedStartDate: '',
//     plannedEndDate: '',
//     dailyTarget: '',
//     numberOfLooms: '',
//     warpLength: '',
//     warpCrimpPercentage: '',
//     pieceLength: '',
//     numberOfPieces: '',
//     ppi: '',
//     ratePerUnit: '',
//     activeFlag: true
//   });

//   const [editingIndex, setEditingIndex]: any = useState(null);
//   const [activeTab, setActiveTab] = useState("orderDetails");
//   const [isEditing, setIsEditing] = React.useState(false);
//   const [selectedFabric, setSelectedFabric] = useState<FabricMaster | null>(null);
//   const [fabricMasterDetails, setFabricMasterDetails] = useState<any>(null);
//   const dispatch = useDispatch<AppDispatch>();
//   const location = useLocation();
//   const weavingContractDtl = location.state?.weavingContractDtl;

//   // const { register, handleSubmit, reset, formState: { errors } } = useForm<WeavingContractFormData>();
//   console.log("weavingContract", weavingContractDtl)
//   const navigate = useNavigate();
//   const [fabricCodeError, setFabricCodeError] = useState("");
//   const [isItemsValid, setIsItemsValid] = useState(false);
//   const { yarnList } = useSelector((state: RootState) => state.yarn);
//   // const isFormValid = isItemsValid && weavingContractItemDtl.length > 0;
//   // Replace your current isFormValid with this:
//   const {
//     register,
//     handleSubmit,
//     reset,
//     watch,
//     setValue,
//     formState: { errors, isValid }
//   } = useForm<WeavingContractFormData>({
//     mode: 'onBlur',
//     reValidateMode: 'onBlur',
//     defaultValues: {
//       contractDate: new Date().toISOString().slice(0, 10),
//       taxId: '',
//       orderTypeId: ''
//     }
//   });

//   const orderTypeId = watch('orderTypeId');
//   const addedFabricIds = useMemo(() => weavingContractItemDtl.map(item => item.fabricCodeId), [weavingContractItemDtl]);

//   // Filter sales orders based on the selected fabric code in Item Details
//   // const filteredSalesOrders = useMemo(() => {
//   //   // If no fabric is selected in Item Details, return empty array
//   //   if (!newItem.fabricCodeId) {
//   //     return [];
//   //   }

//   //   // Filter sales orders that contain the selected fabric code
//   //   return (salesOrderList || []).filter((so: any) => {
//   //     return (so.items || []).some((item: any) =>
//   //       String(item.fabricMasterId ?? item.fabricId) === String(newItem.fabricCodeId)
//   //     );
//   //   });
//   // }, [salesOrderList, newItem.fabricCodeId]);
//   // Include the selected fabric ID and all linked finished fabrics

//   // Find all finished fabrics linked to the selected greige fabric
//   const linkedFinishedFabricIds = useMemo(() => {
//     if (!newItem.fabricCodeId) {
//       return [];
//     }

//     const selectedFabric = fabricMasterList?.find((f: any) => String(f.id) === String(newItem.fabricCodeId));

//     // If selected fabric is greige (fabricType === 1), find all finished fabrics with this greige code
//     if (selectedFabric?.fabricType === 1) {
//       return fabricMasterList
//         ?.filter((f: any) =>
//           (f.fabricType === 2 || f.fabricType === 3) &&
//           String(f.greigeCode ?? f.wovenFabricId) === String(selectedFabric.id)
//         )
//         .map((f: any) => String(f.id)) || [];
//     }

//     // If selected fabric is already finished/finished shade, return its ID
//     if (selectedFabric?.fabricType === 2 || selectedFabric?.fabricType === 3) {
//       return [String(selectedFabric.id)];
//     }

//     return [];
//   }, [newItem.fabricCodeId, fabricMasterList]);

//   const allRelevantFabricIds = useMemo(() => {
//     const ids = [String(newItem.fabricCodeId)];
//     return ids.concat(linkedFinishedFabricIds);
//   }, [newItem.fabricCodeId, linkedFinishedFabricIds]);
//   const filteredSalesOrders = useMemo(() => {
//     if (!Array.isArray(salesOrderList) || !newItem.fabricCodeId) {
//       return [];
//     }
//     const relevantIds = new Set(
//       allRelevantFabricIds
//         .filter(Boolean)
//         .map((value) => String(value)),
//     );
//     if (relevantIds.size === 0) {
//       return [];
//     }
//     return salesOrderList.filter((so: any) => {
//       const orderItems = Array.isArray(so.items)
//         ? so.items
//         : Array.isArray(so.salesOrderItems)
//           ? so.salesOrderItems
//           : Array.isArray(so.orderDetails)
//             ? so.orderDetails
//             : [];
//       return orderItems.some((item: any) => {
//         const itemFabricId = String(item.fabricCodeId ?? item.fabricMasterId ?? item.fabricId ?? item.fabricCode ?? "");
//         return itemFabricId && relevantIds.has(itemFabricId);
//       });
//     });
//   }, [salesOrderList, newItem.fabricCodeId, allRelevantFabricIds]);

//   // Calculate total from both saved items AND current form item being edited
//   const totalWeavingQty = useMemo(() => {
//     const savedItemsTotal = weavingContractItemDtl.reduce((sum, item) => sum + parseFloat(item.quantity || "0"), 0);
//     const currentItemQty = parseFloat(newItem.quantity || "0");
//     const editingItemOriginalQty = editingIndex !== null
//       ? parseFloat(weavingContractItemDtl[editingIndex]?.quantity || "0")
//       : 0;

//     if (editingIndex !== null) {
//       return savedItemsTotal + currentItemQty - editingItemOriginalQty;
//     }

//     if (savedItemsTotal === 0) {
//       return currentItemQty;
//     }

//     if (isEditing) {
//       return currentItemQty || savedItemsTotal;
//     }

//     if (newItem.fabricCodeId && currentItemQty) {
//       return savedItemsTotal + currentItemQty;
//     }

//     return savedItemsTotal;
//   }, [weavingContractItemDtl, newItem.quantity, newItem.fabricCodeId, editingIndex, isEditing]);

//   // const totalOrderDetailsQty = useMemo(() =>
//   //   orderDetails.reduce((sum, od) => sum + parseFloat(od.plannedQuantity || "0"), 0),
//   //   [orderDetails]
//   // );

//   const totalItemQuantity = useMemo(() => {
//     const savedItemsTotal = weavingContractItemDtl.reduce((sum, item) => sum + parseFloat(item.quantity || "0"), 0);
//     const currentItemQty = parseFloat(newItem.quantity || "0");
//     const editingItemOriginalQty = editingIndex !== null
//       ? parseFloat(weavingContractItemDtl[editingIndex]?.quantity || "0")
//       : 0;

//     if (editingIndex !== null) {
//       return savedItemsTotal + currentItemQty - editingItemOriginalQty;
//     }

//     if (savedItemsTotal === 0) {
//       return currentItemQty;
//     }

//     if (isEditing) {
//       return currentItemQty || savedItemsTotal;
//     }

//     if (newItem.fabricCodeId && currentItemQty) {
//       return savedItemsTotal + currentItemQty;
//     }

//     return savedItemsTotal;
//   }, [weavingContractItemDtl, newItem.quantity, newItem.fabricCodeId, editingIndex, isEditing]);

//   // const isOrderDetailsValid = orderDetails.length > 0 &&
//   //   orderDetails.every(od => od.salesOrderNo && od.plannedQuantity) &&
//   //   Math.abs(totalOrderDetailsQty - totalWeavingQty) < 0.01;

//   // Form is valid if either:
//   // 1. There are saved items with fabric codes, OR
//   // 2. There's a current item being filled with fabric code and quantity
//   const hasValidItems = weavingContractItemDtl?.length > 0 || (newItem.fabricCodeId && newItem.quantity);

//   const isFormValid = isValid &&
//     hasValidItems;
//   // const isFormValid = isValid &&
//   //   hasValidItems &&
//   //   isOrderDetailsValid;

//   // GST auto-selection based on vendor vs company state code
//   const [vendorStateCode, setVendorStateCode] = useState<string>('');
//   const [companyStateCode, setCompanyStateCode] = useState<string>('');
//   const [filteredVendorList, setFilteredVendorList] = useState<any[]>([]);
//   const { stateList } = useSelector((state: RootState) => state.state);

//   const weavingVendors = useMemo(
//     () => filterVendorsByTypeIds(vendorList, WEAVING_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null }),
//     [vendorList],
//   );

//   const selectedVendorId = watch('vendorId');
//   const [weavingContractNumber, setWeavingContractNumber] = useState<string>(
//   weavingContractDtl?.weavingContractNo || ''
// );

// const isSavingRef = useRef(false);

// useAutoDocumentNumber({
//   screenName: 'Weaving Contract',
//   detail: weavingContractDtl ? { id: weavingContractDtl.id } : undefined,
//   existingValue: weavingContractNumber,
//   onValueChange: setWeavingContractNumber,
//   isSavingRef,
// });

// useEffect(() => {
//   if (weavingContractDtl?.weavingContractNo) {
//     setWeavingContractNumber(weavingContractDtl.weavingContractNo);
//   }
// }, [weavingContractDtl]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (selectedVendorId) {
//         const vendor = vendorList.find((v: any) => v.id === parseInt(String(selectedVendorId)));
//         const vendorAddress = Array.isArray(vendor?.address) ? vendor.address[0] : vendor?.address;
//         const vendorStateId = vendorAddress?.stateId || vendorAddress?.stateCode || vendor?.stateCode;
//         const mappedStateCode = stateList.find((state: any) => state?.id === vendorStateId || state?.stateCode === vendorStateId)?.stateCode;
//         const code = mappedStateCode || vendorAddress?.stateCode || vendor?.stateCode || '';
//         setVendorStateCode(code?.toString());
//       } else {
//         setVendorStateCode('');
//       }
//     }, 100);

//     return () => clearTimeout(timer);
//   }, [selectedVendorId, vendorList, stateList]);

//   useEffect(() => {
//     try {
//       const resolvedCompanyId = getValidCompanyId();
//       if (resolvedCompanyId) {
//         dispatch(getCompanyById({ id: resolvedCompanyId }))
//           .unwrap?.()
//           .then((res: any) => {
//             const companyData = res?.data || res;
//             const addressArr = companyData?.address || companyData?.data?.address || [];
//             const defaultAddr = Array.isArray(addressArr)
//               ? addressArr.find((a: any) => a.isDefault) || addressArr[0]
//               : null;
//             const companyStateId = defaultAddr?.stateId || defaultAddr?.stateCode;
//             const mappedStateCode = stateList.find((state: any) => state?.id === companyStateId || state?.stateCode === companyStateId)?.stateCode;
//             const code = mappedStateCode || defaultAddr?.stateCode || '';
//             setCompanyStateCode(code?.toString());
//           })
//           .catch(() => { });
//       }
//     } catch { }
//   }, [dispatch, stateList, getValidCompanyId]);

//   // Auto-select GST Type (taxId) based on vendor vs company state code
//   useEffect(() => {
//     if (!vendorStateCode || !companyStateCode) return;
//     const newTaxId = vendorStateCode === companyStateCode ? '1' : '2'; // 1: CGST/SGST, 2: IGST
//     setValue('taxId', newTaxId, { shouldValidate: true, shouldDirty: false });
//   }, [vendorStateCode, companyStateCode, setValue]);

//   useEffect(() => {
//     if (stateList?.length || !dispatch) return;
//     dispatch(getAllStates({}));
//   }, [dispatch, stateList]);

//   // Debug validation
//   console.log('=== FORM VALIDATION DEBUG ===');
//   console.log('isValid (React Hook Form):', isValid);
//   console.log('Saved items count:', weavingContractItemDtl?.length);
//   console.log('Current form item:', { fabricCodeId: newItem.fabricCodeId, quantity: newItem.quantity });
//   console.log('Has valid items:', hasValidItems);
//   console.log('orderDetails.length:', orderDetails.length);
//   console.log('All order details filled:', orderDetails.every(od => od.salesOrderNo && od.plannedQuantity));
//   console.log('totalWeavingQty (includes current form):', totalWeavingQty);
//   // console.log('totalOrderDetailsQty (sum of plannedQuantity):', totalOrderDetailsQty);
//   // console.log('Quantities match:', Math.abs(totalOrderDetailsQty - totalWeavingQty) < 0.01);
//   // console.log('isOrderDetailsValid:', isOrderDetailsValid);
//   console.log('isFormValid:', isFormValid);
//   console.log('============================');


//   // Filter vendors for weaving contracts based on orderTypeId
//   useEffect(() => {
//     const scoped = weavingVendors;
//     const filtered = orderTypeId === '1'
//       ? scoped.filter((v: any) => Number(v?.isInternalVendor) === 1)
//       : orderTypeId === '2'
//         ? scoped.filter((v: any) => Number(v?.isInternalVendor) === 0)
//         : [];
//     setFilteredVendorList(filtered);
//   }, [weavingVendors, orderTypeId]);

//   useEffect(() => {
//     if (weavingContractDtl?.vendorId && Array.isArray(vendorList)) {
//       const v = vendorList.find((x: any) => x.id === weavingContractDtl.vendorId);
//       if (v) setValue('orderTypeId', Number(v?.isInternalVendor) === 1 ? '1' : '2', { shouldValidate: true });
//     }
//   }, [weavingContractDtl, vendorList, setValue]);

//   useEffect(() => {
//     dispatch(getAllFabricMasters({fetchAll: true}));
//     dispatch(getAllVendors({fetchAll: true}));
//     dispatch(getAllTermsConditions({fetchAll: true}));
//     dispatch(getAllPaymentTerms({fetchAll: true}));
//     dispatch(getAllCompanies({fetchAll: true}));
//     dispatch(getAllYarnMasters({fetchAll: true}));
//   }, [dispatch]);

//   useEffect(() => {
//     const salesOrderParams: any = selectedCompanyId
//       ? { companyId: selectedCompanyId, fetchAll: true }
//       : { fetchAll: true };
//     dispatch(getAllSalesOrders(salesOrderParams));
//   }, [dispatch, selectedCompanyId]);

//   const yarnNameById = useMemo(() => {
//     const list = Array.isArray(yarnList) ? yarnList : Array.isArray((yarnList as any)?.data) ? (yarnList as any).data : [];
//     return list.reduce((acc: Record<string, string>, yarn: any) => {
//       if (yarn?.id != null) {
//         acc[String(yarn.id)] = yarn.yarnName || yarn.countName || yarn.count || "";
//       }
//       return acc;
//     }, {} as Record<string, string>);
//   }, [yarnList]);

//   const resolveYarnName = useCallback((yarnId?: number | string, fallback?: string) => {
//     if (yarnId === undefined || yarnId === null) {
//       return fallback || "";
//     }
//     const key = String(yarnId);
//     return yarnNameById[key] || fallback || `Yarn ${key}`;
//   }, [yarnNameById]);

//   const yarnIdByName = useMemo(() => {
//     const list = Array.isArray(yarnList) ? yarnList : Array.isArray((yarnList as any)?.data) ? (yarnList as any).data : [];
//     return list.reduce((acc: Record<string, number>, yarn: any) => {
//       const name = (yarn.yarnName || yarn.countName || yarn.count || "").trim().toLowerCase();
//       if (name && yarn?.id != null) {
//         acc[name] = yarn.id;
//       }
//       return acc;
//     }, {} as Record<string, number>);
//   }, [yarnList]);

//   useEffect(() => {
//     setYarnRequirements((prev) => {
//       let changed = false;
//       const updated = prev.map((req) => {
//         const resolved = resolveYarnName(req.yarnId, req.yarnCount);
//         if (resolved !== req.yarnCount) {
//           changed = true;
//           return { ...req, yarnCount: resolved };
//         }
//         return req;
//       });
//       return changed ? updated : prev;
//     });
//   }, [resolveYarnName, yarnRequirements]);

//   useEffect(() => {
//     if (!newItem.fabricCodeId || !fabricMasterList) return;

//     const fabric = fabricMasterList.find((f: any) => String(f.id) === String(newItem.fabricCodeId));
//     if (!fabric || (!fabric.warpDetails?.length && !fabric.weftDetails?.length)) return;

//     dispatch(getYarnRequirementsWithAvailability({
//       fabricId: parseInt(String(newItem.fabricCodeId)),
//       totalWeavingQty: totalWeavingQty,
//       warpDetails: fabric.warpDetails || [],
//       weftDetails: fabric.weftDetails || []
//     })).then(async (action: any) => {
//       if (action.payload && Array.isArray(action.payload)) {
//         const yarnReqs = action.payload as YarnRequirement[];
//         const allYarnIds = yarnReqs.map(req => req.yarnId).filter((id): id is number => id !== undefined);
//         const availabilityMap = await fetchYarnAvailability(allYarnIds);

//         const resolved = yarnReqs.map((req) => ({
//           ...req,
//           yarnCount: resolveYarnName(req.yarnId, req.yarnCount),
//           totalAvailableQty: req.yarnId ? (availabilityMap[String(req.yarnId)] || 0) : req.totalAvailableQty
//         }));
//         setYarnRequirements(resolved);
//       }
//     });
//   }, [newItem.fabricCodeId, fabricMasterList, totalWeavingQty, dispatch, resolveYarnName]);

//   const getFabricMeta = useCallback((fabricId?: string) => {
//     if (!fabricId) {
//       return { fabricTypeId: '', fabricCategoryId: '' };
//     }
//     const fabric = fabricMasterList?.find((f: any) => String(f.id) === String(fabricId));
//     return {
//       fabricTypeId: fabric?.fabricType ? String(fabric.fabricType) : '',
//       fabricCategoryId: fabric?.fabricCategoryId ? String(fabric.fabricCategoryId) : ''
//     };
//   }, [fabricMasterList]);

//   useEffect(() => {
//     if (!weavingContractDtl) return;
//     const contractId = weavingContractDtl.id ?? null;
//     if (initializedContractId === contractId) return;

//     // Set form fields
//     reset({
//       contractDate: weavingContractDtl.contractDate ? String(weavingContractDtl.contractDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
//       taxId: weavingContractDtl.taxId ? String(weavingContractDtl.taxId) : "",
//       vendorId: weavingContractDtl.vendorId ? String(weavingContractDtl.vendorId) : "",
//       termsConditionsId: weavingContractDtl.termsConditionsId ? String(weavingContractDtl.termsConditionsId) : "",
//       paymentTermsId: weavingContractDtl.paymentTermsId ? String(weavingContractDtl.paymentTermsId) : "",
//       remarks: weavingContractDtl.remarks || "",
//       items: [],
//       yarnRequirements: [],
//       orderDetails: []
//     });

//     setweavingContractItemDtl(
//       (weavingContractDtl.items || []).map((item: any) => {
//         const meta = getFabricMeta(String(item.fabricCodeId ?? ""));
//         return {
//           id: item.id,
//           fabricCodeId: String(item.fabricCodeId ?? ""),
//           fabricTypeId: String(item.fabricTypeId ?? meta.fabricTypeId ?? ""),
//           fabricCategoryId: String(item.fabricCategoryId ?? meta.fabricCategoryId ?? ""),
//           quantity: String(item.quantity ?? ""),
//           pickCost: String(item.pickCost ?? ""),
//           plannedStartDate: item.plannedStartDate ? item.plannedStartDate.slice(0, 10) : "",
//           plannedEndDate: item.plannedEndDate ? item.plannedEndDate.slice(0, 10) : "",
//           dailyTarget: String(item.dailyTarget ?? ""),
//           numberOfLooms: String(item.numberOfLooms ?? ""),
//           warpLength: String(item.warpLength ?? ""),
//           warpCrimpPercentage: String(item.warpCrimpPercentage ?? ""),
//           pieceLength: String(item.pieceLength ?? ""),
//           numberOfPieces: String(item.numberOfPieces ?? ""),
//           activeFlag: item.activeFlag ?? true,
//           ppi: String(item.ppi ?? ""),
//         };
//       })
//     );
//     // Set items table
//     // setweavingContractItemDtl(
//     //   (weavingContractDtl.items || []).map((item: any) => ({
//     //     id: item.id, // Make sure ID is included
//     //     fabricCodeId: String(item.fabricCodeId ?? ""),
//     //     fabricTypeId: String(item.fabricTypeId ?? meta.fabricTypeId ?? ""),
//     //       fabricCategoryId: String(item.fabricCategoryId ?? meta.fabricCategoryId ?? ""),
//     //     quantity: String(item.quantity ?? ""),
//     //     pickCost: String(item.pickCost ?? ""),
//     //     plannedStartDate: item.plannedStartDate ? item.plannedStartDate.slice(0, 10) : "",
//     //     plannedEndDate: item.plannedEndDate ? item.plannedEndDate.slice(0, 10) : "",
//     //     dailyTarget: String(item.dailyTarget ?? ""),
//     //     numberOfLooms: String(item.numberOfLooms ?? ""),
//     //     warpLength: String(item.warpLength ?? ""),
//     //     warpCrimpPercentage: String(item.warpCrimpPercentage ?? ""),
//     //     pieceLength: String(item.pieceLength ?? ""),
//     //     numberOfPieces: String(item.numberOfPieces ?? ""),
//     //     activeFlag: item.activeFlag ?? true,
//     //     ppi: String(item.ppi ?? ""),
//     //   }))
//     // );

//     // Populate newItem with the first item's data INCLUDING ID
//     const firstItem = weavingContractDtl.items?.[0];
//     if (firstItem) {
//       const pickCostStr = String(firstItem.pickCost ?? "");
//       const ppiStr = String(firstItem.ppi ?? "");
//       const calculatedRate = computeRatePerUnit(pickCostStr, ppiStr);
//       const firstItemMeta = getFabricMeta(String(firstItem.fabricCodeId ?? ""));

//       setNewItem({
//         id: firstItem.id, // CRITICAL: Include the ID
//         fabricCodeId: String(firstItem.fabricCodeId ?? ""),
//         fabricTypeId: String(firstItem.fabricTypeId ?? firstItemMeta.fabricTypeId ?? ""),
//         fabricCategoryId: String(firstItem.fabricCategoryId ?? firstItemMeta.fabricCategoryId ?? ""),
//         quantity: String(firstItem.quantity ?? ""),
//         pickCost: pickCostStr,
//         plannedStartDate: firstItem.plannedStartDate ? firstItem.plannedStartDate.slice(0, 10) : "",
//         plannedEndDate: firstItem.plannedEndDate ? firstItem.plannedEndDate.slice(0, 10) : "",
//         dailyTarget: String(firstItem.dailyTarget ?? ""),
//         numberOfLooms: String(firstItem.numberOfLooms ?? ""),
//         warpLength: String(firstItem.warpLength ?? ""),
//         warpCrimpPercentage: String(firstItem.warpCrimpPercentage ?? ""),
//         pieceLength: String(firstItem.pieceLength ?? ""),
//         numberOfPieces: String(firstItem.numberOfPieces ?? ""),
//         ppi: ppiStr,
//         ratePerUnit: calculatedRate || String(firstItem.ratePerUnit ?? ""),
//         activeFlag: firstItem.activeFlag ?? true,
//       });

//       const fabric = fabricMasterList.find((f: any) => f.id === firstItem.fabricCodeId);
//       if (fabric) {
//         setSelectedFabric(fabric);
//       }
//     }

//     // Set order details
//     setOrderDetails(
//       (weavingContractDtl.orderDetails || []).map((od: any) => ({
//         id: od.id,
//         salesOrderNo: String(od.salesOrderId ?? ""),
//         orderQuantity: String(od.orderQuantity ?? ""),
//         plannedQuantity: String(od.plannedQuantity ?? ""),
//         totalQuantity: String(od.plannedQuantity ?? od.totalQuantity ?? ""),
//       }))
//     );

//     // Set yarn requirements
//     const rawYarnReqs = (weavingContractDtl.yarnRequirements || []).map((yarn: any) => ({
//       id: yarn.id,
//       yarnId: yarn.yarnId,
//       yarnType: yarn.yarnType,
//       yarnCount: resolveYarnName(yarn.yarnId, String(yarn.yarnCount)),
//       gramsPerMeter: Number(yarn.gramsPerMeter ?? yarn.grams_per_meter ?? 0),
//       totalWeavingOrderQty: Number(yarn.totalWeavingOrderQty ?? 0),
//       totalRequiredQty: Number(yarn.totalRequiredQty ?? 0),
//       totalAvailableQty: Number(yarn.totalAvailableQty ?? 0),
//       activeFlag: yarn.activeFlag ?? true,
//     }));

//     setYarnRequirements(rawYarnReqs);

//     // Fetch real-time availability for the loaded yarn requirements
//     const allYarnIds = rawYarnReqs.map((req: any) => req.yarnId).filter(Boolean);
//     if (allYarnIds.length > 0) {
//       fetchYarnAvailability(allYarnIds).then((availabilityMap) => {
//         setYarnRequirements((prev) =>
//           prev.map((req) => ({
//             ...req,
//             totalAvailableQty: req.yarnId ? (availabilityMap[String(req.yarnId)] || 0) : req.totalAvailableQty,
//           }))
//         );
//       });
//     }

//     setIsEditing(true);
//     setFabricHydratedContractId(null);
//     setInitializedContractId(contractId);
//   }, [weavingContractDtl, reset, fabricMasterList, getFabricMeta, initializedContractId]);

//   useEffect(() => {
//     if (!weavingContractDtl) return;
//     const contractId = weavingContractDtl.id ?? null;
//     if (contractId === null || initializedContractId !== contractId) return;
//     if (fabricHydratedContractId === contractId) return;

//     const firstFabricId = String(weavingContractDtl.items?.[0]?.fabricCodeId ?? "");
//     if (!firstFabricId) return;

//     const fabric = fabricMasterList.find((f: any) => String(f.id) === firstFabricId);
//     if (!fabric) return;

//     setSelectedFabric(fabric);
//     setNewItem((prev) => {
//       if (prev.fabricCodeId && prev.fabricCodeId !== firstFabricId) {
//         return prev;
//       }
//       return {
//         ...prev,
//         fabricTypeId: prev.fabricTypeId || String(fabric.fabricType ?? ""),
//         fabricCategoryId: prev.fabricCategoryId || String(fabric.fabricCategoryId ?? ""),
//       };
//     });
//     setFabricHydratedContractId(contractId);
//   }, [weavingContractDtl, fabricMasterList, initializedContractId, fabricHydratedContractId]);


//   function computeRatePerUnit(pickRateValue: string, ppiValue: string) {
//     const pickRateNum = parseFloat(pickRateValue || '0');
//     const ppiNum = parseFloat(ppiValue || '0');

//     if (!pickRateNum || !ppiNum) {
//       return '';
//     }

//     const computed = pickRateNum * ppiNum;
//     return computed.toFixed(2);
//   }

//   const handlePickCostChange = (value: string) => {
//     setNewItem((prevItem) => {
//       const updatedRate = computeRatePerUnit(value, prevItem.ppi);
//       if (value) {
//         setFabricCodeError('');
//       }
//       return {
//         ...prevItem,
//         pickCost: value,
//         ratePerUnit: updatedRate,
//       };
//     });
//   };

//   const parseQuantityValue = (val?: string) => {
//     const parsed = parseFloat(val ?? '0');
//     return Number.isFinite(parsed) ? parsed : 0;
//   };

//   const calculateTotalQuantityFromInput = (inputQuantity: string) => {
//     const inputValue = parseQuantityValue(inputQuantity);
//     const savedTotal = weavingContractItemDtl.reduce((sum, item) => sum + parseQuantityValue(item.quantity), 0);
//     const editingOriginal = editingIndex !== null
//       ? parseQuantityValue(weavingContractItemDtl[editingIndex]?.quantity)
//       : (newItem?.id != null
//         ? parseQuantityValue(weavingContractItemDtl.find((item) => item.id === newItem.id)?.quantity)
//         : 0);
//     return savedTotal - editingOriginal + inputValue;
//   };

//   const syncOrderDetailsWithQuantity = (totalQty: number) => {
//     if (!orderDetails.length) {
//       return;
//     }
//     setOrderDetails((prev) => prev.map((detail) => {
//       const formatted = totalQty ? totalQty.toString() : '0';
//       return {
//         ...detail,
//         plannedQuantity: formatted,
//         totalQuantity: formatted,
//       };
//     }));
//   };

//   const handleQuantityChange = (value: string) => {
//     const totalQty = calculateTotalQuantityFromInput(value);
//     syncOrderDetailsWithQuantity(totalQty);
//     setNewItem((prevItem) => ({
//       ...prevItem,
//       quantity: value,
//     }));
//   };

//   const calculateSummary = () => {
//     const netAmount = weavingContractItemDtl.reduce((sum, item) => {
//       const quantity = parseFloat(item.quantity) || 0;
//       const pickCost = parseFloat(item.pickCost) || 0;
//       return sum + (quantity * pickCost);
//     }, 0);

//     return { netAmount };
//   };

//   const { netAmount } = calculateSummary();

//   // In your handleFabricCodeChange function, update the yarn requirements calculation:
//   const handleFabricCodeChange = async (value: string) => {
//     const selectedFabric = fabricMasterList.find((f: { id: { toString: () => string; }; }) => f.id.toString() === value);
//     setSelectedFabric(selectedFabric || null);

//     if (selectedFabric) {
//       // Auto-fetch Rate/unit from fabric master
//       const ppi = selectedFabric.ppi ? String(selectedFabric.ppi) : '';

//       setNewItem((prevItem) => {
//         const updatedRate = computeRatePerUnit(prevItem.pickCost, ppi);
//         return {
//           ...prevItem,
//           fabricCodeId: value,
//           fabricQualityId: selectedFabric.id.toString(),
//           ppi,
//           ratePerUnit: updatedRate,
//         };
//       });
//       setFabricCodeError('');

//       // Clear existing order details when fabric changes
//       setOrderDetails([]);
//       setOrderDetailsError("");

//       // Fetch fabric master details
//       try {
//         const response = await apiService.get(`fabric-master/${value}`);
//         setFabricMasterDetails(response.data);

//         // Check if details exist before mapping
//         const warpDetails = response.data?.warpDetails || [];
//         const weftDetails = response.data?.weftDetails || [];

//         const allYarnIds = Array.from(new Set([
//           ...warpDetails.map((d: any) => d.yarnId),
//           ...weftDetails.map((d: any) => d.yarnId)
//         ])).filter(Boolean);

//         const availabilityMap = await fetchYarnAvailability(allYarnIds);

//         const yarnReqs = [
//           ...warpDetails.map((detail: any) => ({
//             yarnType: "Warp",
//             yarnId: detail.yarnId,
//             yarnCount: resolveYarnName(detail.yarnId, detail.yarnCount?.toString() || detail.yarnId?.toString()),
//             gramsPerMeter: Number(detail.gramsPerMeter || detail.grams_per_meter || 0),
//             totalWeavingOrderQty: totalItemQuantity,
//             totalRequiredQty: totalItemQuantity * Number(detail.gramsPerMeter || detail.grams_per_meter || 0),
//             totalAvailableQty: availabilityMap[String(detail.yarnId)] || 0,
//             activeFlag: true
//           })),
//           ...weftDetails.map((detail: any) => ({
//             yarnType: "Weft",
//             yarnId: detail.yarnId,
//             yarnCount: resolveYarnName(detail.yarnId, detail.yarnCount?.toString() || detail.yarnId?.toString()),
//             gramsPerMeter: Number(detail.gramsPerMeter || detail.grams_per_meter || 0),
//             totalWeavingOrderQty: totalItemQuantity,
//             totalRequiredQty: totalItemQuantity * Number(detail.gramsPerMeter || detail.grams_per_meter || 0),
//             totalAvailableQty: availabilityMap[String(detail.yarnId)] || 0,
//             activeFlag: true
//           }))
//         ];

//         // Only set yarn requirements if NOT in edit mode OR if yarn requirements are empty
//         if (!isEditing || yarnRequirements.length === 0) {
//           setYarnRequirements(yarnReqs);
//         }
//       } catch (error) {
//         console.error("Error fetching fabric master details:", error);
//         // Set empty array instead of empty objects
//         setYarnRequirements([]);
//       }
//     } else {
//       // Clear yarn requirements if no fabric selected
//       setYarnRequirements([]);
//     }
//   };

//   const addItem = () => {
//     if (!newItem.fabricCodeId) {
//       setFabricCodeError("Fabric Code is required");
//       setIsItemsValid(false);
//       return;
//     }
//     if (!newItem.ppi) {
//       setFabricCodeError("Rate/unit is required");
//       setIsItemsValid(false);
//       return;
//     }
//     if (!newItem.ratePerUnit) {
//       setFabricCodeError("Rate/unit is required");
//       setIsItemsValid(false);
//       return;
//     }
//     setIsItemsValid(true);
//     setFabricCodeError("");

//     if (editingIndex !== null) {
//       const updatedItems = [...weavingContractItemDtl];
//       updatedItems[editingIndex] = newItem;
//       setweavingContractItemDtl(updatedItems);
//       setEditingIndex(null);
//     } else {
//       setweavingContractItemDtl([...weavingContractItemDtl, newItem]);
//     }
//     setNewItem({
//       fabricCodeId: '',
//        fabricTypeId: '',
//       fabricCategoryId: '',
//       quantity: '',
//       pickCost: '',
//       plannedStartDate: '',
//       plannedEndDate: '',
//       dailyTarget: '',
//       numberOfLooms: '',
//       warpLength: '',
//       warpCrimpPercentage: '',
//       pieceLength: '',
//       numberOfPieces: '',
//       ppi: '',
//       ratePerUnit: '',
//       activeFlag: true
//     });
//   };

//   const handleSalesOrderChange = (index: number, value: string) => {
//     const updated = [...orderDetails];
//     updated[index].salesOrderNo = value;

//     setOrderDetailsError("");

//     const isDuplicate = updated.some((detail, detailIndex) =>
//       detail.salesOrderNo === value && detailIndex !== index
//     );
//     if (isDuplicate) {
//       setOrderDetailsError("Sales Order already selected in this contract.");
//       updated[index].salesOrderNo = "";
//       setOrderDetails(updated);
//       return;
//     }

//     const selectedOrder = filteredSalesOrders?.find((so: any) => String(so.id) === String(value));
//     const matchingOrderItem = selectedOrder?.items?.find((item: any) =>
//       allRelevantFabricIds.includes(String(item.fabricMasterId ?? item.fabricId))
//     );
//     const salesOrderQty = matchingOrderItem?.orderQty !== undefined && matchingOrderItem?.orderQty !== null
//       ? String(matchingOrderItem.orderQty)
//       : '';

//     const totalQuantityFromItems = totalItemQuantity ? totalItemQuantity.toString() : "0";

//     updated[index].orderQuantity = salesOrderQty;
//     updated[index].plannedQuantity = totalQuantityFromItems;
//     updated[index].totalQuantity = totalQuantityFromItems;

//     setOrderDetails(updated);
//   };

//   // const handleSalesOrderChange = (index: number, value: string) => {
//   //   const updated = [...orderDetails];
//   //   updated[index].salesOrderNo = value;

//   //   setOrderDetailsError("");

//   //   // Prevent duplicate sales orders
//   //   const isDuplicate = updated.some((detail, detailIndex) =>
//   //     detail.salesOrderNo === value && detailIndex !== index
//   //   );
//   //   if (isDuplicate) {
//   //     setOrderDetailsError("Sales Order already selected in this contract.");
//   //     updated[index].salesOrderNo = "";
//   //     setOrderDetails(updated);
//   //     return;
//   //   }

//   //   const totalQuantityFromItems = totalItemQuantity ? totalItemQuantity.toString() : "0";

//   //   updated[index].orderQuantity = totalQuantityFromItems;
//   //   updated[index].plannedQuantity = totalQuantityFromItems;
//   //   updated[index].totalQuantity = totalQuantityFromItems;

//   //   setOrderDetails(updated);
//   // };

//   const handlePlannedQtyChange = (index: number, value: string) => {
//     const updated = [...orderDetails];
//     const sanitizedValue = value === "" ? "" : String(value);
//     updated[index].plannedQuantity = sanitizedValue;
//     updated[index].totalQuantity = sanitizedValue;
//     setOrderDetails(updated);
//   };

//   const deleteOrderDetail = (index: number) => {
//     setOrderDetails(prev => prev.filter((_, i) => i !== index));
//   };

//   const onSubmit = async (data: WeavingContractFormData) => {
//     const resolvedCompanyId = getValidCompanyId();
//     if (!resolvedCompanyId) {
//       toast.error("Please select a company before saving the contract.");
//       return;
//     }
//     const companyId = resolvedCompanyId;
//       isSavingRef.current = true;

//     let resolvedWeavingContractNo = weavingContractDtl?.id
//     ? (weavingContractDtl?.weavingContractNo || weavingContractNumber)
//     : weavingContractNumber;

//   // Generate new number if needed (for create mode)
//   if (!weavingContractDtl?.id && !resolvedWeavingContractNo) {
//     try {
//       const docResponse = await documentNumberService.generateDocumentNumber({
//         screenName: "Weaving Contract"
//       });
//       resolvedWeavingContractNo = docResponse.documentNumber;
//       setWeavingContractNumber(resolvedWeavingContractNo);
//     } catch (error) {
//       // Fallback: generate a basic sequential number
//       resolvedWeavingContractNo = `WC/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}/001`;
//       console.warn('Failed to generate weaving contract number, using fallback:', error);
//     }
//   }


//     let allItems: WeavingContractItem[] = [];

//     if (weavingContractDtl && weavingContractDtl.id) {
//       // EDIT MODE: Use the current form item with the existing ID
//       if (newItem.fabricCodeId && newItem.quantity) {
//         // Get the first existing item ID to use for updating
//         const existingItemId = weavingContractDtl.items?.[0]?.id;
//         allItems = [{
//           ...newItem,
//           id: existingItemId // Use the existing ID
//         }];
//       }
//     } else {
//       // CREATE MODE: Combine saved items with current form item
//       allItems = [...weavingContractItemDtl];

//       if (newItem.fabricCodeId && newItem.quantity) {
//         if (editingIndex !== null) {
//           allItems[editingIndex] = newItem;
//         } else {
//           allItems.push(newItem);
//         }
//       }
//     }

//     // Filter out empty yarn requirements and calculate updated values
//     const validYarnRequirements = yarnRequirements.filter(req =>
//       req.yarnType && req.yarnCount && req.gramsPerMeter > 0
//     );

//     const updatedYarnRequirements = validYarnRequirements.map(req => {
//       const totalItemQuantity = allItems.reduce((total, item) => {
//         return total + Number(item.quantity || 0);
//       }, 0);

//       const totalWeavingOrderQty = totalItemQuantity;
//       const totalRequiredQty = totalItemQuantity * Number(req.gramsPerMeter || 0);

//       const yarnId = req.yarnId || (req.yarnCount ? yarnIdByName[req.yarnCount.trim().toLowerCase()] : undefined);

//       return {
//         id: req.id,
//         yarnId,
//         yarnType: req.yarnType,
//         yarnCount: req.yarnCount,
//         gramsPerMeter: req.gramsPerMeter,
//         totalWeavingOrderQty,
//         totalRequiredQty,
//         totalAvailableQty: req.totalAvailableQty || 0,
//         activeFlag: true
//       };
//     });

//     const vendor = vendorList?.find((v: any) => v.id === parseInt(String(data.vendorId)));
//     const tradingCompanyId = companyId;
//     const factoryCompanyId = resolveFactoryCompanyId(vendor);
//     const orderTypeIdNum = parseInt(String(data.orderTypeId || ""));
//     const effectiveFactoryCompanyId = orderTypeIdNum === 1 ? factoryCompanyId : null;

//     const payload = {
//       // weavingContractNo: weavingContractNo,
//       weavingContractNo: resolvedWeavingContractNo,
//       companyId: companyId,
//       tradingCompanyId: tradingCompanyId,
//       factoryCompanyId: effectiveFactoryCompanyId,
//       contractDate: data.contractDate,
//       taxId: parseInt(data.taxId),
//       vendorId: parseInt(data.vendorId),
//       orderTypeId: parseInt(data.orderTypeId),
//       termsConditionsId: parseInt(data.termsConditionsId),
//       paymentTermsId: parseInt(data.paymentTermsId),
//       remarks: data.remarks,
//       items: allItems.map(item => ({
//         id: item.id, // This should now have the existing ID in edit mode
//         fabricCodeId: parseInt(item.fabricCodeId),
//         // fabricQualityId: parseInt(item.fabricQualityId),
//         fabricQualityId: null,
//         fabricTypeId: item.fabricTypeId ? parseInt(item.fabricTypeId) : null,
//         fabricCategoryId: item.fabricCategoryId ? parseInt(item.fabricCategoryId) : null,
//         quantity: parseFloat(item.quantity),
//         pickCost: parseFloat(item.pickCost),
//         plannedStartDate: item.plannedStartDate || null,
//         plannedEndDate: item.plannedEndDate || null,
//         dailyTarget: item.dailyTarget ? parseFloat(item.dailyTarget) : null,
//         numberOfLooms: item.numberOfLooms ? parseInt(item.numberOfLooms) : null,
//         warpLength: item.warpLength ? parseFloat(item.warpLength) : null,
//         warpCrimpPercentage: item.warpCrimpPercentage ? parseFloat(item.warpCrimpPercentage) : null,
//         pieceLength: item.pieceLength ? parseFloat(item.pieceLength) : null,
//         numberOfPieces: item.numberOfPieces ? parseInt(item.numberOfPieces) : null,
//         activeFlag: true,
//         ppi: parseFloat(item.ppi)
//       })),
//       yarnRequirements: updatedYarnRequirements,
//       orderDetails: orderDetails.map(d => ({
//         id: d.id,
//         salesOrderId: d.salesOrderNo ? parseInt(d.salesOrderNo) : undefined,
//         fabricCodeId: newItem.fabricCodeId ? parseInt(newItem.fabricCodeId) : undefined,
//         orderQuantity: d.orderQuantity ? parseFloat(d.orderQuantity) : 0,
//         plannedQuantity: d.plannedQuantity ? parseFloat(d.plannedQuantity) : 0,
//         totalQuantity: d.plannedQuantity ? parseFloat(d.plannedQuantity) : 0,
//         activeFlag: true
//       }))
//     };

//     // alert(JSON.stringify(payload));

//     try {
//           let updatedContract;

//       // alert(JSON.stringify(payload));
//       if (weavingContractDtl && weavingContractDtl.id) {
//       updatedContract =  await dispatch(updateWeavingContract({ id: weavingContractDtl.id, data: payload })).unwrap();
//       } else {
//        updatedContract =  await dispatch(createWeavingContract(payload)).unwrap();
//            if (resolvedWeavingContractNo) {
//         const sequencePart = resolvedWeavingContractNo.split('/').pop() || resolvedWeavingContractNo;
//         documentNumberService.updateMemoryCache('Weaving Contract', sequencePart);
//       }
//       }
//       reset();
//       setweavingContractItemDtl([]);
//       setYarnRequirements([]);
//       setOrderDetails([]);

//           const targetTab = updatedContract?.isComplete === 1 ? 'completed' : 'open';
//   navigate("/transaction/weaving-contract-details", { 
//       state: { activeTab: targetTab } 
//     });
//       // navigate("/transaction/weaving-contract-details");
//     } catch (error) {
//          isSavingRef.current = false;
//     toast.error("Failed to save weaving contract");
//     console.error("Save error:", error);
//     }
//   };


//   return (
//     <div className="p-6 pt-16">
//       <div className="p-6 bg-white shadow-md rounded-lg">
//         {/* Title & Save Button */}
//         <div className="flex justify-between items-center border-b pb-4">
//           <div className="flex items-center space-x-4">
//             <Button
//               variant="outline"
//               onClick={() => navigate("/transaction/weaving-contract-details")}
//               className="mr-auto"
//             >
//               <ArrowLeft size={18} className="mr-2" />
//               Back
//             </Button>
//             <h2 className="text-2xl font-semibold">Weaving Contract Entry</h2>
//           </div>
//           <Button
//             onClick={handleSubmit(onSubmit)}
//             className="bg-primary hover:bg-primary text-white px-6 flex items-center"
//             disabled={!isFormValid}
//           >
//             <Save size={18} className="mr-2" />
//             {weavingContractDtl ? "Update Weaving Contract" : "Save Weaving Contract"}
//           </Button>
//         </div>
//         <div className="space-y-6">
//           {/* Tab Navigation */}
//           <div className="mb-8">
//             <div className="border-b border-gray-200">
//               <nav className="flex -mb-px">
//                 <button
//                   onClick={() => setActiveTab('orderDetails')}
//                   className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'orderDetails'
//                     ? 'border-red-500 text-red-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 Inward Ordershover:border-gray-300'
//                     }`}
//                 >
//                   <FileText className="w-4 h-4" />
//                   Order Details
//                 </button>
//                 <button
//                   onClick={() => setActiveTab('itemDetails')}
//                   className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'itemDetails'
//                     ? 'border-red-500 text-red-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                     }`}
//                 >
//                   <ShoppingCart className="w-4 h-4" />
//                   Item Details
//                 </button>
//               </nav>
//             </div>
//           </div>

//           {/* Order Details */}
//           {activeTab === "orderDetails" && (
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <FileText size={20} /> Order Details
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid grid-cols-3 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium">Contract Date <span className="text-red-600">*</span></label>
//                     <input type="date" className="input mt-1" {...register("contractDate", { required: "Contract Date is required" })} />
//                     {errors.contractDate && (
//                       <p className="mt-1 text-sm text-red-600">{String(errors.contractDate.message)}</p>
//                     )}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-secondary-700">Order Type <span className="text-red-600">*</span></label>
//                     <CommonSearchableSelect
//                       className="mt-1"
//                       // name="orderTypeId"
//                       placeholder="Select Order Type"
//                       value={watch('orderTypeId') || ''}
//                       options={[
//                         { value: '1', label: 'Internal' },
//                         { value: '2', label: 'External' },
//                       ]}
//                       {...register('orderTypeId', { required: 'Order Type is required' })}
//                       onValueChange={(value) => {
//                         setValue('orderTypeId', value, { shouldValidate: true });
//                         setValue('vendorId', '', { shouldValidate: true });
//                       }}
//                       error={errors.orderTypeId?.message as string}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-secondary-700">Select a Vendor <span className="text-red-600">*</span> </label>
//                     <CommonSearchableSelect
//                       className="mt-1"
//                       // name="vendorId"
//                       placeholder="Select a Vendor"
//                       value={watch('vendorId') || ''}
//                       options={(filteredVendorList || []).map((vendor: any) => ({
//                         value: String(vendor.id),
//                         label: vendor.vendorName,
//                         activeFlag: vendor.activeFlag ?? true,
//                       }))}
//                       {...register("vendorId", { required: "Vendor is required" })}
//                       onValueChange={(value) => setValue('vendorId', value, { shouldValidate: true })}
//                       error={errors.vendorId?.message as string}
//                     />

//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-secondary-700">GST Type <span className="text-red-600">*</span></label>
//                     <select
//                       {...register("taxId", { required: "GST Type is required" })}
//                       className={`input mt-1 ${errors.taxId ? 'border-red-500' : ''}`}
//                       disabled
//                     >
//                       <option value="">Select GST Type</option>
//                       <option value="1">CGST/SGST</option>
//                       <option value="2">IGST</option>
//                     </select>
//                     {errors.taxId && (
//                       <p className="mt-1 text-sm text-red-600">{String(errors.taxId.message)}</p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium">Select Terms & Conditions <span className="text-red-600">*</span> </label>
//                     <CommonSearchableSelect
//                       className="mt-1"
//                       // name="termsConditionsId"
//                       placeholder="Select Terms & Conditions"
//                       value={watch('termsConditionsId') || ''}
//                       options={(termsContitionsList || []).map((tc: any) => ({
//                         value: String(tc.id),
//                         label: tc.termsConditionsName,
//                         activeFlag: tc.activeFlag ?? true,
//                       }))}
//                       filterActive
//                       {...register("termsConditionsId", { required: "Terms & Conditions is required" })}
//                       onValueChange={(value) => setValue('termsConditionsId', value, { shouldValidate: true })}
//                       error={errors.termsConditionsId?.message as string}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium">Select Payment Terms <span className="text-red-600">*</span> </label>
//                     <CommonSearchableSelect
//                       className="mt-1"
//                       // name="paymentTermsId"
//                       placeholder="Select Payment Terms"
//                       value={watch('paymentTermsId') || ''}
//                       options={(paymentTermsList || []).map((pt: any) => ({
//                         value: String(pt.id),
//                         label: pt.termName,
//                         activeFlag: pt.activeFlag ?? true,
//                       }))}
//                       filterActive
//                       {...register("paymentTermsId", { required: "Payment Terms is required" })}
//                       onValueChange={(value) => setValue('paymentTermsId', value, { shouldValidate: true })}
//                       error={errors.paymentTermsId?.message as string}
//                     />
//                     {/* {errors.paymentTermsId && <p className="mt-1 text-sm text-red-600">{errors.paymentTermsId.message}</p>} */}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-secondary-700">Remarks</label>
//                     <input {...register("remarks")} placeholder="Remarks" className="input" />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Item Details */}
//           {activeTab === "itemDetails" && (
//             <>
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <ShoppingCart size={20} /> Item Details
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="grid grid-cols-4 gap-6">
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Fabric Code <span className="text-red-600">*</span></label>
//                       <CommonSearchableSelect
//                         className="mt-1"
//                         placeholder="Select Fabric Code"
//                         value={newItem.fabricCodeId || ''}
//                         options={(fabricMasterList || []).map((fabric: FabricMaster) => ({
//                           value: String(fabric.id),
//                           label: fabric.fabricCode,
//                         }))}
//                         onValueChange={(value) => handleFabricCodeChange(value)}
//                       />
//                       {fabricCodeError && <p className="mt-1 text-sm text-red-600">{fabricCodeError}</p>}
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Fabric Quality</label>
//                       <input
//                         value={selectedFabric?.fabricQuality || ''}
//                         readOnly
//                         className="input mt-1 bg-gray-100"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Quantity</label>
//                       <input
//                         type="number"
//                         placeholder="Enter Quantity"
//                         value={newItem.quantity}
//                         onChange={(e) => handleQuantityChange(e.target.value)}
//                         className="input  mt-1"
//                         min="0"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Pick Rate</label>
//                       <input
//                         type="number"
//                         placeholder="Enter pick rate"
//                         value={newItem.pickCost}
//                         onChange={(e) => handlePickCostChange(e.target.value)}
//                         className="input mt-1"
//                         min="0"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Rate/unit <span className="text-red-600">*</span></label>
//                       <input
//                         placeholder="Pick rate × PPI"
//                         value={newItem.ratePerUnit}
//                         readOnly
//                         className="input mt-1 bg-gray-100"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Planned Start Date</label>
//                       <input type="date" value={newItem.plannedStartDate}
//                         onChange={e => setNewItem({ ...newItem, plannedStartDate: e.target.value })} className="input mt-1" />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Planned End Date</label>
//                       <input type="date" value={newItem.plannedEndDate}
//                         onChange={e => setNewItem({ ...newItem, plannedEndDate: e.target.value })} className="input mt-1" />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Daily Target</label>
//                       <input placeholder="Enter daily target" value={newItem.dailyTarget}
//                         onChange={e => setNewItem({ ...newItem, dailyTarget: e.target.value })} className="input mt-1" />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">No of Looms</label>
//                       <input placeholder="Enter no of looms" value={newItem.numberOfLooms}
//                         onChange={e => setNewItem({ ...newItem, numberOfLooms: e.target.value })} className="input mt-1" />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Warp Length</label>
//                       <input placeholder="Enter wrap length" value={newItem.warpLength}
//                         onChange={e => setNewItem({ ...newItem, warpLength: e.target.value })} className="input" />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Warp Crimp%</label>
//                       <input placeholder="Enter warp crimp" value={newItem.warpCrimpPercentage}
//                         onChange={e => setNewItem({ ...newItem, warpCrimpPercentage: e.target.value })} className="input" />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">Piece Length</label>
//                       <input placeholder="Enter piece length" value={newItem.pieceLength}
//                         onChange={e => setNewItem({ ...newItem, pieceLength: e.target.value })} className="input" />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">No of Pieces</label>
//                       <input placeholder="Enter no of pieces" value={newItem.numberOfPieces}
//                         onChange={e => setNewItem({ ...newItem, numberOfPieces: e.target.value })} className="input" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <ClipboardList size={20} /> Yarn Requirement
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <table className="table-auto w-full border border-gray-300 mt-4">
//                     <thead>
//                       <tr className="bg-gray-100">
//                         <th className="border px-4 py-2">Sl.No</th>
//                         <th className="border px-4 py-2">Warp/Weft</th>
//                         <th className="border px-4 py-2">Yarn Count</th>
//                         <th className="border px-4 py-2">Grams/Mtr</th>
//                         <th className="border px-4 py-2">Total Req Quantity</th>
//                         <th className="border px-4 py-2">Total Available Quantity</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {yarnRequirements.length > 0 ? (
//                         yarnRequirements.map((req, index) => (
//                           <tr key={index}>
//                             <td className="border px-4 py-2 text-center">{index + 1}</td>
//                             <td className="border px-4 py-2 text-center">{req.yarnType}</td>
//                             <td className="border px-4 py-2 text-center">{req.yarnCount}</td>
//                             <td className="border px-4 py-2 text-center">{req.gramsPerMeter}</td>
//                             <td className="border px-4 py-2 text-center">
//                               {(() => {
//                                 const totalRequiredQty = totalItemQuantity * Number(req.gramsPerMeter || 0);
//                                 return Number.isFinite(totalRequiredQty) ? totalRequiredQty.toFixed(2) : "0.00";
//                               })()}
//                             </td>
//                             <td className="border px-4 py-2 text-center">
//                               {(() => {
//                                 const availableQty = Number(req.totalAvailableQty ?? 0);
//                                 return Number.isFinite(availableQty) ? availableQty.toFixed(2) : "0.00";
//                               })()}
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan={7} className="border px-4 py-2 text-center text-gray-500">
//                             No yarn details found for the selected fabric code
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </CardContent>
//               </Card>
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <ClipboardList size={20} /> Order Details
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="flex justify-end mb-4">
//                     <Button
//                       onClick={() => setOrderDetails([...orderDetails, { fabricCodeId: '', salesOrderNo: '', orderQuantity: '', plannedQuantity: '', totalQuantity: '0' }])}
//                       className="bg-primary text-white"
//                     >
//                       Add Order Items
//                     </Button>
//                   </div>
//                   <table className="w-full border-collapse border border-gray-300 text-center">
//                     <thead className="bg-gray-100">
//                       <tr>
//                         <th className="border p-2">Sl.No</th>
//                         <th className="border p-2">Sales Order No</th>
//                         <th className="border p-2">Sales Order Quantity</th>
//                         <th className="border p-2">Planned Quantity</th>
//                         <th className="border p-2">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {orderDetails.map((detail, index) => (
//                         <tr key={index} className="border">
//                           <td className="border p-2">{index + 1}</td>
//                           <td className="border p-2">
//                             <CommonSearchableSelect
//                               className="border border-gray-300 rounded px-0 py-0"
//                               value={detail.salesOrderNo || ''}
//                               options={(filteredSalesOrders || []).map((so: any) => ({
//                                 value: String(so.id),
//                                 label: [so.salesOrderNo || so.orderNumber || `SO-${so.id}`, so.buyerCustomerName].filter(Boolean).join(' - '),
//                               }))}
//                               placeholder={!newItem.fabricCodeId
//                                 ? "Select Fabric Code in Item Details first"
//                                 : "Select Sales Order"}
//                               disabled={!newItem.fabricCodeId}
//                               onValueChange={(value) => handleSalesOrderChange(index, value)}
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               value={detail.orderQuantity}
//                               className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-100"
//                               placeholder="Sales Order Qty"
//                               readOnly
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               value={detail.plannedQuantity}
//                               onChange={(e) => handlePlannedQtyChange(index, e.target.value)}
//                               className="border border-gray-300 rounded px-2 py-1 w-full"
//                               placeholder="Planned Qty"
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <Button
//                               size="sm"
//                               onClick={() => deleteOrderDetail(index)}
//                               variant="destructive"
//                             >
//                               <Trash2 size={14} />
//                             </Button>
//                           </td>
//                         </tr>
//                       ))}
//                       {orderDetails.length === 0 && (
//                         <tr>
//                           <td colSpan={6} className="border p-2 text-gray-500">No order details added</td>
//                         </tr>
//                       )}
//                     </tbody>
//                     {/* <tfoot className="bg-blue-50 font-semibold">
//                       <tr>
//                         <td colSpan={3} className="border p-2 text-right">Total Planned Quantity:</td>
//                         <td className="border p-2 text-center">
//                           <span className={totalOrderDetailsQty === totalWeavingQty ? "text-green-600" : "text-red-600"}>
//                             {totalOrderDetailsQty.toFixed(2)}
//                           </span>
//                         </td>
//                         <td colSpan={2} className="border p-2 text-left">
//                           <span className={totalOrderDetailsQty === totalWeavingQty ? "text-green-600" : "text-red-600"}>
//                             {totalOrderDetailsQty === totalWeavingQty
//                               ? "✓ Matches Item Details"
//                               : `⚠ Must equal ${totalWeavingQty.toFixed(2)}`}
//                           </span>
//                         </td>
//                       </tr>
//                     </tfoot> */}
//                   </table>
//                 </CardContent>
//               </Card>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FileText, ShoppingCart, ClipboardList, Edit, Trash2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { toast } from "react-toastify";
import { AppDispatch, RootState } from "@/state/store";
import { useDispatch, useSelector } from "react-redux";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllProductCategory } from "@/state/productCategorySlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllTermsConditions } from "@/state/termsConditions";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { createWeavingContract, getAllWeavingContract, getYarnRequirementsWithAvailability, updateWeavingContract } from "@/state/weavingContractSlice";
import apiService from "@/services/ApiService";
import { documentNumberService } from "@/services/DocumentNumberService";
import { useLocation, useNavigate } from "react-router-dom";
import { getCompanyById, getAllCompanies } from "@/state/company-master-slice";
import { getAllStates } from "@/state/stateSlice";
import { VENDOR_TYPE_ALL, filterVendorsByTypeIds } from "@/utils/vendorFilters";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { useAutoDocumentNumber } from "@/components/common/useAutoDocumentNumber";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { useMappingStatus } from "@/hooks/useMappingStatus";
import { getAllSubCategories } from "@/state/subCategorySlice";

interface WeavingContractFormData {
  contractDate: string;
  taxId: string; // 1: CGST/SGST, 2: IGST
  vendorId: string;
  orderTypeId: string; // 1: Internal, 2: External
  termsConditionsId: string;
  paymentTermsId: string;
  remarks: string;
  rpm?: string;
  efficiency?: string;
  productCalculation?: string;
  items: WeavingContractItem[];
  yarnRequirements: YarnRequirement[];
  orderDetails?: OrderDetail[];
}

interface WeavingContractItem {
  id?: number; // ADD THIS
  fabricCodeId: string;
  fabricTypeId: string;
  fabricCategoryId: string;
  quantity: string;
  pickCost: string;
  plannedStartDate: string;
  plannedEndDate: string;
  dailyTarget: string;
  numberOfLooms: string;
  warpLength: string;
  warpCrimpPercentage: string;
  pieceLength: string;
  numberOfPieces: string;
  ppi: string;
  ratePerUnit: string;
  noOfDays?: string;
  loomType?: string;
  activeFlag: boolean;
}

interface YarnRequirement {
  id?: number; // ADD THIS
  yarnId?: number;
  yarnType: string;
  yarnCount: string;
  gramsPerMeter: number;
  totalWeavingOrderQty: number;
  totalRequiredQty: number;
  totalAvailableQty: number;
  activeFlag: boolean;
}

interface OrderDetail {
  id?: number; // ADD THIS
  fabricCodeId?: string;
  salesOrderNo: string;
  orderQuantity: string;
  plannedQuantity: string;
  totalQuantity: string;
}

const WEAVING_VENDOR_TYPE_IDS = [303, VENDOR_TYPE_ALL];

interface FabricMaster {
  id: number;
  fabricType: number;
  fabricCode: string;
  fabricName: string;
  weave: number;
  fabricQuality: string;
  uom: string;
  epi: number;
  ppi: number;
  greigeCode: string;
  totalEnds: number;
  gsm: number;
  glm: number;
  igst: number;
  cgst: number;
  sgst: number;
  fabricImageUrl: string;
  warpDetails: YarnDetail[];
  weftDetails: YarnDetail[];
  procuctCategoryId: number | null;
}

interface YarnDetail {
  id: number;
  yarnId: number;
  color: number;
  shrinkagePercent: number;
  gramsPerMeter: number;
}

type Vendor = {
  id: number;
  customerName: string;
  address: {
    id?: number;
    line1: string;
    line2: string;
    countryId: number;
    stateId: number;
    cityId: number;
  };
};

export function WeavingContractEntry() {

  const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);

  const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster);
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory);
  const parseCompanyIdValue = useCallback((value: unknown) => {
    if (value === null || value === undefined) {
      return null;
    }
    const parsed = parseInt(String(value).trim(), 10);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
  }, []);
  const getValidCompanyId = useCallback(() => {
    if (typeof window === "undefined") return null;
    const storedCompanyId = parseCompanyIdValue(localStorage.getItem('selectedCompanyId'));
    if (storedCompanyId) {
      return storedCompanyId;
    }
    const legacyCompanyEntry = localStorage.getItem('selectedCompany');
    if (legacyCompanyEntry) {
      try {
        const parsedLegacyCompany = JSON.parse(legacyCompanyEntry);
        const legacyId = parseCompanyIdValue(parsedLegacyCompany?.id ?? parsedLegacyCompany?.companyId);
        if (legacyId) {
          return legacyId;
        }
      } catch {
        const legacyId = parseCompanyIdValue(legacyCompanyEntry);
        if (legacyId) {
          return legacyId;
        }
      }
    }
    const authPayload = localStorage.getItem('authPayload');
    if (authPayload) {
      try {
        const parsedAuthPayload = JSON.parse(authPayload);
        const authCompanyId = parseCompanyIdValue(parsedAuthPayload?.user?.selectedCompany?.id ?? parsedAuthPayload?.user?.companyId);
        if (authCompanyId) {
          return authCompanyId;
        }
      } catch { }
    }
    return null;
  }, [parseCompanyIdValue]);


  const selectedCompanyId = useMemo(() => getValidCompanyId(), [getValidCompanyId]);
  const companyOptions = useMemo(() => {
    if (Array.isArray(companyMasterList)) {
      return companyMasterList;
    }
    if (Array.isArray(companyMasterList?.data)) {
      return companyMasterList.data;
    }
    return [];
  }, [companyMasterList]);
  const normalizeName = useCallback((value?: string | number | null) => {
    if (value === undefined || value === null) {
      return "";
    }
    return String(value).toLowerCase().replace(/[\s\W]+/g, "");
  }, []);
  const companyNameLookup = useMemo(() => {
    const map = new Map<string, number>();
    companyOptions.forEach((company: any) => {
      const id = company?.id ?? company?.companyId;
      if (!id) {
        return;
      }
      const candidates = [
        company?.companyName,
        company?.name,
        company?.legalName,
        company?.displayName,
      ];
      candidates.forEach((name) => {
        const key = normalizeName(name);
        if (key && !map.has(key)) {
          map.set(key, Number(id));
        }
      });
    });
    return map;
  }, [companyOptions, normalizeName]);
  const resolveFactoryCompanyId = useCallback((vendor?: any) => {
    if (!vendor) {
      return null;
    }
    const directIds = [
      vendor?.companyId,
      vendor?.company?.id,
      vendor?.company?.companyId,
    ].filter((id) => id !== undefined && id !== null);
    for (const directId of directIds) {
      const matched = companyOptions.find((company: any) => String(company?.id ?? company?.companyId) === String(directId));
      if (matched) {
        return Number(matched.id ?? matched.companyId);
      }
    }
    const nameCandidates = [
      vendor?.vendorName,
      vendor?.customerName,
      vendor?.companyName,
      vendor?.name,
    ];
    for (const name of nameCandidates) {
      const key = normalizeName(name);
      if (key && companyNameLookup.has(key)) {
        return companyNameLookup.get(key) ?? null;
      }
    }
    return null;
  }, [companyOptions, companyNameLookup, normalizeName]);
  const [weavingContractItemDtl, setweavingContractItemDtl] = useState<WeavingContractItem[]>([]);
  const [yarnRequirements, setYarnRequirements] = useState<YarnRequirement[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [orderDetailsError, setOrderDetailsError] = useState<string>("");
  const [initializedContractId, setInitializedContractId] = useState<number | null>(null);
  const [fabricHydratedContractId, setFabricHydratedContractId] = useState<number | null>(null);
  const [fabricOptions, setFabricOptions] = useState<{ id: string; name: string }[]>([]);
  const [newItem, setNewItem] = useState<WeavingContractItem>({
    fabricCodeId: '',
    fabricTypeId: '',
    fabricCategoryId: '',
    quantity: '',
    pickCost: '',
    plannedStartDate: '',
    plannedEndDate: '',
    dailyTarget: '',
    numberOfLooms: '',
    warpLength: '',
    warpCrimpPercentage: '',
    pieceLength: '',
    numberOfPieces: '',
    ppi: '',
    ratePerUnit: '',
    noOfDays: '',
    loomType: '',
    activeFlag: true
  });

  const [editingIndex, setEditingIndex]: any = useState(null);
  const [activeTab, setActiveTab] = useState("orderDetails");
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedFabric, setSelectedFabric] = useState<FabricMaster | null>(null);
  const [fabricMasterDetails, setFabricMasterDetails] = useState<any>(null);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const weavingContractDtl = location.state?.weavingContractDtl;

  // const { register, handleSubmit, reset, formState: { errors } } = useForm<WeavingContractFormData>();
  console.log("weavingContract", weavingContractDtl)
  const navigate = useNavigate();
  const [fabricCodeError, setFabricCodeError] = useState("");
  const [isItemsValid, setIsItemsValid] = useState(false);
  const { yarnList } = useSelector((state: RootState) => state.yarn);
  // const isFormValid = isItemsValid && weavingContractItemDtl.length > 0;
  // Replace your current isFormValid with this:
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<WeavingContractFormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      contractDate: new Date().toISOString().slice(0, 10),
      taxId: '',
      orderTypeId: ''
    }
  });

  const orderTypeId = watch('orderTypeId');
  const rpmValue = watch('rpm');
  const efficiencyValue = watch('efficiency');
  const ppiValue = newItem.ppi;

  useEffect(() => {
    const rpm = parseFloat(rpmValue || '');
    const efficiency = parseFloat(efficiencyValue || '');
    const pick = parseFloat(ppiValue || '');

    if (!isNaN(rpm) && !isNaN(efficiency) && !isNaN(pick) && pick > 0 && efficiency > 0) {
      const calculation = (rpm * 60 * 24 * (efficiency / 100)) / (39.37 * pick);
      setValue('productCalculation', String(Number(calculation.toFixed(4))));
    } else {
      setValue('productCalculation', '');
    }
  }, [rpmValue, efficiencyValue, ppiValue, setValue]);
  const addedFabricIds = useMemo(() => weavingContractItemDtl.map(item => item.fabricCodeId), [weavingContractItemDtl]);

  // Filter sales orders based on the selected fabric code in Item Details
  // const filteredSalesOrders = useMemo(() => {
  //   // If no fabric is selected in Item Details, return empty array
  //   if (!newItem.fabricCodeId) {
  //     return [];
  //   }

  //   // Filter sales orders that contain the selected fabric code
  //   return (salesOrderList || []).filter((so: any) => {
  //     return (so.items || []).some((item: any) =>
  //       String(item.fabricMasterId ?? item.fabricId) === String(newItem.fabricCodeId)
  //     );
  //   });
  // }, [salesOrderList, newItem.fabricCodeId]);
  // Include the selected fabric ID and all linked finished fabrics

  // Find all finished fabrics linked to the selected greige fabric
  const linkedFinishedFabricIds = useMemo(() => {
    if (!newItem.fabricCodeId) {
      return [];
    }

    const selectedFabric = fabricMasterList?.find((f: any) => String(f.id) === String(newItem.fabricCodeId));

    // If selected fabric is greige (fabricType === 1), find all finished fabrics with this greige code
    if (selectedFabric?.fabricType === 1) {
      return fabricMasterList
        ?.filter((f: any) =>
          (f.fabricType === 2 || f.fabricType === 3) &&
          String(f.greigeCode ?? f.wovenFabricId) === String(selectedFabric.id)
        )
        .map((f: any) => String(f.id)) || [];
    }

    // If selected fabric is already finished/finished shade, return its ID
    if (selectedFabric?.fabricType === 2 || selectedFabric?.fabricType === 3) {
      return [String(selectedFabric.id)];
    }

    return [];
  }, [newItem.fabricCodeId, fabricMasterList]);

  const allRelevantFabricIds = useMemo(() => {
    const ids = [String(newItem.fabricCodeId)];
    return ids.concat(linkedFinishedFabricIds);
  }, [newItem.fabricCodeId, linkedFinishedFabricIds]);
  const filteredSalesOrders = useMemo(() => {
    if (!Array.isArray(salesOrderList) || !newItem.fabricCodeId) {
      return [];
    }
    const relevantIds = new Set(
      allRelevantFabricIds
        .filter(Boolean)
        .map((value) => String(value)),
    );
    if (relevantIds.size === 0) {
      return [];
    }
    return salesOrderList.filter((so: any) => {
      const orderItems = Array.isArray(so.items)
        ? so.items
        : Array.isArray(so.salesOrderItems)
          ? so.salesOrderItems
          : Array.isArray(so.orderDetails)
            ? so.orderDetails
            : [];
      return orderItems.some((item: any) => {
        const itemFabricId = String(item.fabricCodeId ?? item.fabricMasterId ?? item.fabricId ?? item.fabricCode ?? "");
        return itemFabricId && relevantIds.has(itemFabricId);
      });
    });
  }, [salesOrderList, newItem.fabricCodeId, allRelevantFabricIds]);

  // Calculate total from both saved items AND current form item being edited
  const totalWeavingQty = useMemo(() => {
    const savedItemsTotal = weavingContractItemDtl.reduce((sum, item) => sum + parseFloat(item.quantity || "0"), 0);
    const currentItemQty = parseFloat(newItem.quantity || "0");
    const editingItemOriginalQty = editingIndex !== null
      ? parseFloat(weavingContractItemDtl[editingIndex]?.quantity || "0")
      : 0;

    if (editingIndex !== null) {
      return savedItemsTotal + currentItemQty - editingItemOriginalQty;
    }

    if (savedItemsTotal === 0) {
      return currentItemQty;
    }

    if (isEditing) {
      return currentItemQty || savedItemsTotal;
    }

    if (newItem.fabricCodeId && currentItemQty) {
      return savedItemsTotal + currentItemQty;
    }

    return savedItemsTotal;
  }, [weavingContractItemDtl, newItem.quantity, newItem.fabricCodeId, editingIndex, isEditing]);

  // const totalOrderDetailsQty = useMemo(() =>
  //   orderDetails.reduce((sum, od) => sum + parseFloat(od.plannedQuantity || "0"), 0),
  //   [orderDetails]
  // );

  const totalItemQuantity = useMemo(() => {
    const savedItemsTotal = weavingContractItemDtl.reduce((sum, item) => sum + parseFloat(item.quantity || "0"), 0);
    const currentItemQty = parseFloat(newItem.quantity || "0");
    const editingItemOriginalQty = editingIndex !== null
      ? parseFloat(weavingContractItemDtl[editingIndex]?.quantity || "0")
      : 0;

    if (editingIndex !== null) {
      return savedItemsTotal + currentItemQty - editingItemOriginalQty;
    }

    if (savedItemsTotal === 0) {
      return currentItemQty;
    }

    if (isEditing) {
      return currentItemQty || savedItemsTotal;
    }

    if (newItem.fabricCodeId && currentItemQty) {
      return savedItemsTotal + currentItemQty;
    }

    return savedItemsTotal;
  }, [weavingContractItemDtl, newItem.quantity, newItem.fabricCodeId, editingIndex, isEditing]);

  // const isOrderDetailsValid = orderDetails.length > 0 &&
  //   orderDetails.every(od => od.salesOrderNo && od.plannedQuantity) &&
  //   Math.abs(totalOrderDetailsQty - totalWeavingQty) < 0.01;

  // Form is valid if either:
  // 1. There are saved items with fabric codes, OR
  // 2. There's a current item being filled with fabric code and quantity
  const hasValidItems = weavingContractItemDtl?.length > 0 || (newItem.fabricCodeId && newItem.quantity);

  const isFormValid = isValid &&
    hasValidItems;
  // const isFormValid = isValid &&
  //   hasValidItems &&
  //   isOrderDetailsValid;

  // GST auto-selection based on vendor vs company state code
  const [vendorStateCode, setVendorStateCode] = useState<string>('');
  const [companyStateCode, setCompanyStateCode] = useState<string>('');
  const [filteredVendorList, setFilteredVendorList] = useState<any[]>([]);
  const { stateList } = useSelector((state: RootState) => state.state);

  const weavingVendors = useMemo(
    () => filterVendorsByTypeIds(vendorList, WEAVING_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null }),
    [vendorList],
  );

  const selectedVendorId = watch('vendorId');
  const [weavingContractNumber, setWeavingContractNumber] = useState<string>(
    weavingContractDtl?.weavingContractNo || 'Loading sequence...'
  );

  const isSavingRef = useRef(false);

  const { isMapped: isWeavingContractMapped } = useMappingStatus({
    endpoint: '/weaving-contracts/',
    id: weavingContractDtl?.id,
    enabled: !!weavingContractDtl?.id,
  });

  useAutoDocumentNumber({
    screenName: 'Weaving Contract',
    detail: weavingContractDtl ? { id: weavingContractDtl.id } : undefined,
    existingValue: weavingContractNumber,
    onValueChange: setWeavingContractNumber,
    isSavingRef,
  });

  useEffect(() => {
    if (weavingContractDtl?.weavingContractNo) {
      setWeavingContractNumber(weavingContractDtl.weavingContractNo);
    }
  }, [weavingContractDtl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedVendorId) {
        const vendor = vendorList.find((v: any) => v.id === parseInt(String(selectedVendorId)));
        const vendorAddress = Array.isArray(vendor?.address) ? vendor.address[0] : vendor?.address;
        const vendorStateId = vendorAddress?.stateId || vendorAddress?.stateCode || vendor?.stateCode;
        const mappedStateCode = stateList.find((state: any) => state?.id === vendorStateId || state?.stateCode === vendorStateId)?.stateCode;
        const code = mappedStateCode || vendorAddress?.stateCode || vendor?.stateCode || '';
        setVendorStateCode(code?.toString());
      } else {
        setVendorStateCode('');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedVendorId, vendorList, stateList]);

  useEffect(() => {
    try {
      const resolvedCompanyId = getValidCompanyId();
      if (resolvedCompanyId) {
        dispatch(getCompanyById({ id: resolvedCompanyId }))
          .unwrap?.()
          .then((res: any) => {
            const companyData = res?.data || res;
            const addressArr = companyData?.address || companyData?.data?.address || [];
            const defaultAddr = Array.isArray(addressArr)
              ? addressArr.find((a: any) => a.isDefault) || addressArr[0]
              : null;
            const companyStateId = defaultAddr?.stateId || defaultAddr?.stateCode;
            const mappedStateCode = stateList.find((state: any) => state?.id === companyStateId || state?.stateCode === companyStateId)?.stateCode;
            const code = mappedStateCode || defaultAddr?.stateCode || '';
            setCompanyStateCode(code?.toString());
          })
          .catch(() => { });
      }
    } catch { }
  }, [dispatch, stateList, getValidCompanyId]);

  // Auto-select GST Type (taxId) based on vendor vs company state code
  useEffect(() => {
    if (!vendorStateCode || !companyStateCode) return;
    const newTaxId = vendorStateCode === companyStateCode ? '1' : '2'; // 1: CGST/SGST, 2: IGST
    setValue('taxId', newTaxId, { shouldValidate: true, shouldDirty: false });
  }, [vendorStateCode, companyStateCode, setValue]);

  useEffect(() => {
    if (stateList?.length || !dispatch) return;
    dispatch(getAllStates({}));
  }, [dispatch, stateList]);

  // Debug validation
  console.log('=== FORM VALIDATION DEBUG ===');
  console.log('isValid (React Hook Form):', isValid);
  console.log('Saved items count:', weavingContractItemDtl?.length);
  console.log('Current form item:', { fabricCodeId: newItem.fabricCodeId, quantity: newItem.quantity });
  console.log('Has valid items:', hasValidItems);
  console.log('orderDetails.length:', orderDetails.length);
  console.log('All order details filled:', orderDetails.every(od => od.salesOrderNo && od.plannedQuantity));
  console.log('totalWeavingQty (includes current form):', totalWeavingQty);
  // console.log('totalOrderDetailsQty (sum of plannedQuantity):', totalOrderDetailsQty);
  // console.log('Quantities match:', Math.abs(totalOrderDetailsQty - totalWeavingQty) < 0.01);
  // console.log('isOrderDetailsValid:', isOrderDetailsValid);
  console.log('isFormValid:', isFormValid);
  console.log('============================');


  // Filter vendors for weaving contracts based on orderTypeId
  useEffect(() => {
    const scoped = weavingVendors;
    const filtered = orderTypeId === '1'
      ? scoped.filter((v: any) => Number(v?.isInternalVendor) === 1)
      : orderTypeId === '2'
        ? scoped.filter((v: any) => Number(v?.isInternalVendor) === 0)
        : [];
    setFilteredVendorList(filtered);
  }, [weavingVendors, orderTypeId]);

  useEffect(() => {
    if (weavingContractDtl?.vendorId && Array.isArray(vendorList)) {
      const v = vendorList.find((x: any) => x.id === weavingContractDtl.vendorId);
      if (v) setValue('orderTypeId', Number(v?.isInternalVendor) === 1 ? '1' : '2', { shouldValidate: true });
    }
  }, [weavingContractDtl, vendorList, setValue]);

  useEffect(() => {
    dispatch(getAllFabricMasters({ fetchAll: true }));
    dispatch(getAllVendors({ fetchAll: true }));
    dispatch(getAllTermsConditions({ fetchAll: true }));
    dispatch(getAllPaymentTerms({ fetchAll: true }));
    dispatch(getAllCompanies({ fetchAll: true }));
    dispatch(getAllYarnMasters({ fetchAll: true }));
    dispatch(getAllSubCategories({ fetchAll: true }));
  }, [dispatch]);

  useEffect(() => {
    const salesOrderParams: any = selectedCompanyId
      ? { companyId: selectedCompanyId, fetchAll: true }
      : { fetchAll: true };
    dispatch(getAllSalesOrders(salesOrderParams));
  }, [dispatch, selectedCompanyId]);

  // Selective auto-fetch for order-entry-management navigation flow
  useEffect(() => {
    const source = location.state?.source;
    const salesOrderId = location.state?.salesOrderId;
    const salesOrderNo = location.state?.salesOrderNo;

    // Only proceed if user came from order-entry-management with sales order data
    if (source === 'order-entry-management' && salesOrderId && salesOrderNo && salesOrderList.length > 0) {

      // Find the selected sales order
      const selectedSalesOrder = salesOrderList.find((so: any) => so.id === salesOrderId);

      if (selectedSalesOrder && selectedSalesOrder.items && selectedSalesOrder.items.length > 0) {

        // Auto-populate Order Details section with Sales Order No and Order Quantity only
        const firstItem = selectedSalesOrder.items[0];
        setOrderDetails([{
          salesOrderNo: String(salesOrderId), // Use sales order ID to match dropdown options
          orderQuantity: String(firstItem.orderQty || 0),
          plannedQuantity: '', // Don't auto-fetch planned quantity
          totalQuantity: String(firstItem.orderQty || 0)
        }]);

        // Auto-populate Item Details tab with Fabric Code and Quality
        // Find fabric master by fabric code
        const fabric = fabricMasterList.find((f: any) => f.fabricCode === firstItem.fabricCode);

        if (fabric) {
          setNewItem(prev => ({
            ...prev,
            fabricCodeId: String(fabric.id),
            fabricTypeId: String(fabric.fabricType || ''),
            fabricCategoryId: String(fabric.fabricCategoryId || ''),
            ppi: String(fabric.ppi || ''),
          }));

          setSelectedFabric(fabric);
        }
      }
    }
  }, [location.state, salesOrderList, fabricMasterList]);

  const yarnNameById = useMemo(() => {
    const list = Array.isArray(yarnList) ? yarnList : Array.isArray((yarnList as any)?.data) ? (yarnList as any).data : [];
    return list.reduce((acc: Record<string, string>, yarn: any) => {
      if (yarn?.id != null) {
        acc[String(yarn.id)] = yarn.yarnName || yarn.countName || yarn.count || "";
      }
      return acc;
    }, {} as Record<string, string>);
  }, [yarnList]);

  const resolveYarnName = useCallback((yarnId?: number | string, fallback?: string) => {
    if (yarnId === undefined || yarnId === null) {
      return fallback || "";
    }
    const key = String(yarnId);
    return yarnNameById[key] || fallback || `Yarn ${key}`;
  }, [yarnNameById]);

  const yarnIdByName = useMemo(() => {
    const list = Array.isArray(yarnList) ? yarnList : Array.isArray((yarnList as any)?.data) ? (yarnList as any).data : [];
    return list.reduce((acc: Record<string, number>, yarn: any) => {
      const name = (yarn.yarnName || yarn.countName || yarn.count || "").trim().toLowerCase();
      if (name && yarn?.id != null) {
        acc[name] = yarn.id;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [yarnList]);

  useEffect(() => {
    setYarnRequirements((prev) => {
      let changed = false;
      const updated = prev.map((req) => {
        const resolved = resolveYarnName(req.yarnId, req.yarnCount);
        if (resolved !== req.yarnCount) {
          changed = true;
          return { ...req, yarnCount: resolved };
        }
        return req;
      });
      return changed ? updated : prev;
    });
  }, [resolveYarnName, yarnRequirements]);

  useEffect(() => {
    if (!newItem.fabricCodeId || !fabricMasterList) return;

    const fabric = fabricMasterList.find((f: any) => String(f.id) === String(newItem.fabricCodeId));
    if (!fabric || (!fabric.warpDetails?.length && !fabric.weftDetails?.length)) return;

    dispatch(getYarnRequirementsWithAvailability({
      fabricId: parseInt(String(newItem.fabricCodeId)),
      totalWeavingQty: totalWeavingQty,
      warpDetails: fabric.warpDetails || [],
      weftDetails: fabric.weftDetails || []
    })).then(async (action: any) => {
      if (action.payload && Array.isArray(action.payload)) {
        const yarnReqs = action.payload as YarnRequirement[];

        // Ensure availability is strictly for the selected company
        const updatedYarnReqs = await Promise.all(yarnReqs.map(async (req) => {
          let availQty = req.totalAvailableQty;
          if (req.yarnId && selectedCompanyId) {
            try {
              const availResponse = await apiService.get(`yarn-inward-stock/available-qty/${req.yarnId}/${selectedCompanyId}`);
              availQty = Number(availResponse?.data ?? availResponse ?? 0);
            } catch (err) {
              console.error(`Failed to fetch availability for yarn ${req.yarnId}`, err);
            }
          }
          return {
            ...req,
            yarnCount: resolveYarnName(req.yarnId, req.yarnCount),
            totalAvailableQty: availQty
          };
        }));

        setYarnRequirements(updatedYarnReqs);
      }
    });
  }, [newItem.fabricCodeId, fabricMasterList, totalWeavingQty, dispatch, resolveYarnName]);

  const getFabricMeta = useCallback((fabricId?: string) => {
    if (!fabricId) {
      return { fabricTypeId: '', fabricCategoryId: '' };
    }
    const fabric = fabricMasterList?.find((f: any) => String(f.id) === String(fabricId));
    return {
      fabricTypeId: fabric?.fabricType ? String(fabric.fabricType) : '',
      fabricCategoryId: fabric?.fabricCategoryId ? String(fabric.fabricCategoryId) : ''
    };
  }, [fabricMasterList]);

  useEffect(() => {
    if (!weavingContractDtl) return;
    const contractId = weavingContractDtl.id ?? null;
    if (initializedContractId === contractId) return;

    // Set form fields
    reset({
      contractDate: weavingContractDtl.contractDate ? String(weavingContractDtl.contractDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      taxId: weavingContractDtl.taxId ? String(weavingContractDtl.taxId) : "",
      vendorId: weavingContractDtl.vendorId ? String(weavingContractDtl.vendorId) : "",
      termsConditionsId: weavingContractDtl.termsConditionsId ? String(weavingContractDtl.termsConditionsId) : "",
      paymentTermsId: weavingContractDtl.paymentTermsId ? String(weavingContractDtl.paymentTermsId) : "",
      remarks: weavingContractDtl.remarks || "",
      rpm: weavingContractDtl.rpm != null ? String(weavingContractDtl.rpm) : "",
      efficiency: weavingContractDtl.efficiency != null ? String(weavingContractDtl.efficiency) : "",
      productCalculation: weavingContractDtl.productCalculation != null ? String(weavingContractDtl.productCalculation) : "",
      items: [],
      yarnRequirements: [],
      orderDetails: []
    });

    setweavingContractItemDtl(
      (weavingContractDtl.items || []).map((item: any) => {
        const meta = getFabricMeta(String(item.fabricCodeId ?? ""));
        return {
          id: item.id,
          fabricCodeId: String(item.fabricCodeId ?? ""),
          fabricTypeId: String(item.fabricTypeId ?? meta.fabricTypeId ?? ""),
          fabricCategoryId: String(item.fabricCategoryId ?? meta.fabricCategoryId ?? ""),
          quantity: String(item.quantity ?? ""),
          pickCost: String(item.pickCost ?? ""),
          plannedStartDate: item.plannedStartDate ? item.plannedStartDate.slice(0, 10) : "",
          plannedEndDate: item.plannedEndDate ? item.plannedEndDate.slice(0, 10) : "",
          dailyTarget: String(item.dailyTarget ?? ""),
          numberOfLooms: String(item.numberOfLooms ?? ""),
          warpLength: String(item.warpLength ?? ""),
          warpCrimpPercentage: String(item.warpCrimpPercentage ?? ""),
          pieceLength: String(item.pieceLength ?? ""),
          numberOfPieces: String(item.numberOfPieces ?? ""),
          activeFlag: item.activeFlag ?? true,
          ppi: String(item.ppi ?? ""),
          noOfDays: String(item.noOfDays ?? ""),
          loomType: String(item.loomType ?? ""),
        };
      })
    );
    // Set items table
    // setweavingContractItemDtl(
    //   (weavingContractDtl.items || []).map((item: any) => ({
    //     id: item.id, // Make sure ID is included
    //     fabricCodeId: String(item.fabricCodeId ?? ""),
    //     fabricTypeId: String(item.fabricTypeId ?? meta.fabricTypeId ?? ""),
    //       fabricCategoryId: String(item.fabricCategoryId ?? meta.fabricCategoryId ?? ""),
    //     quantity: String(item.quantity ?? ""),
    //     pickCost: String(item.pickCost ?? ""),
    //     plannedStartDate: item.plannedStartDate ? item.plannedStartDate.slice(0, 10) : "",
    //     plannedEndDate: item.plannedEndDate ? item.plannedEndDate.slice(0, 10) : "",
    //     dailyTarget: String(item.dailyTarget ?? ""),
    //     numberOfLooms: String(item.numberOfLooms ?? ""),
    //     warpLength: String(item.warpLength ?? ""),
    //     warpCrimpPercentage: String(item.warpCrimpPercentage ?? ""),
    //     pieceLength: String(item.pieceLength ?? ""),
    //     numberOfPieces: String(item.numberOfPieces ?? ""),
    //     activeFlag: item.activeFlag ?? true,
    //     ppi: String(item.ppi ?? ""),
    //   }))
    // );

    // Populate newItem with the first item's data INCLUDING ID
    const firstItem = weavingContractDtl.items?.[0];
    if (firstItem) {
      const pickCostStr = String(firstItem.pickCost ?? "");
      const ppiStr = String(firstItem.ppi ?? "");
      const calculatedRate = computeRatePerUnit(pickCostStr, ppiStr);
      const firstItemMeta = getFabricMeta(String(firstItem.fabricCodeId ?? ""));

      setNewItem({
        id: firstItem.id, // CRITICAL: Include the ID
        fabricCodeId: String(firstItem.fabricCodeId ?? ""),
        fabricTypeId: String(firstItem.fabricTypeId ?? firstItemMeta.fabricTypeId ?? ""),
        fabricCategoryId: String(firstItem.fabricCategoryId ?? firstItemMeta.fabricCategoryId ?? ""),
        quantity: String(firstItem.quantity ?? ""),
        pickCost: pickCostStr,
        plannedStartDate: firstItem.plannedStartDate ? firstItem.plannedStartDate.slice(0, 10) : "",
        plannedEndDate: firstItem.plannedEndDate ? firstItem.plannedEndDate.slice(0, 10) : "",
        dailyTarget: String(firstItem.dailyTarget ?? ""),
        numberOfLooms: String(firstItem.numberOfLooms ?? ""),
        warpLength: String(firstItem.warpLength ?? ""),
        warpCrimpPercentage: String(firstItem.warpCrimpPercentage ?? ""),
        pieceLength: String(firstItem.pieceLength ?? ""),
        numberOfPieces: String(firstItem.numberOfPieces ?? ""),
        ppi: ppiStr,
        ratePerUnit: calculatedRate || String(firstItem.ratePerUnit ?? ""),
        noOfDays: String(firstItem.noOfDays ?? ""),
        loomType: String(firstItem.loomType ?? ""),
        activeFlag: firstItem.activeFlag ?? true,
      });

      const fabric = fabricMasterList.find((f: any) => f.id === firstItem.fabricCodeId);
      if (fabric) {
        setSelectedFabric(fabric);
      }
    }

    // Set order details
    setOrderDetails(
      (weavingContractDtl.orderDetails || []).map((od: any) => ({
        id: od.id,
        salesOrderNo: String(od.salesOrderId ?? ""),
        orderQuantity: String(od.orderQuantity ?? ""),
        plannedQuantity: String(od.plannedQuantity ?? ""),
        totalQuantity: String(od.plannedQuantity ?? od.totalQuantity ?? ""),
      }))
    );

    // Set yarn requirements
    setYarnRequirements(
      (weavingContractDtl.yarnRequirements || []).map((yarn: any) => ({
        id: yarn.id,
        yarnId: yarn.yarnId,
        yarnType: yarn.yarnType,
        yarnCount: resolveYarnName(yarn.yarnId, String(yarn.yarnCount)),
        gramsPerMeter: Number(yarn.gramsPerMeter ?? yarn.grams_per_meter ?? 0),
        totalWeavingOrderQty: Number(yarn.totalWeavingOrderQty ?? 0),
        totalRequiredQty: Number(yarn.totalRequiredQty ?? 0),
        totalAvailableQty: Number(yarn.totalAvailableQty ?? 0),
        activeFlag: yarn.activeFlag ?? true,
      }))
    );

    setIsEditing(true);
    setFabricHydratedContractId(null);
    setInitializedContractId(contractId);
  }, [weavingContractDtl, reset, fabricMasterList, getFabricMeta, initializedContractId]);

  useEffect(() => {
    if (!weavingContractDtl) return;
    const contractId = weavingContractDtl.id ?? null;
    if (contractId === null || initializedContractId !== contractId) return;
    if (fabricHydratedContractId === contractId) return;

    const firstFabricId = String(weavingContractDtl.items?.[0]?.fabricCodeId ?? "");
    if (!firstFabricId) return;

    const fabric = fabricMasterList.find((f: any) => String(f.id) === firstFabricId);
    if (!fabric) return;

    setSelectedFabric(fabric);
    setNewItem((prev) => {
      if (prev.fabricCodeId && prev.fabricCodeId !== firstFabricId) {
        return prev;
      }
      return {
        ...prev,
        fabricTypeId: prev.fabricTypeId || String(fabric.fabricType ?? ""),
        fabricCategoryId: prev.fabricCategoryId || String(fabric.fabricCategoryId ?? ""),
      };
    });
    setFabricHydratedContractId(contractId);
  }, [weavingContractDtl, fabricMasterList, initializedContractId, fabricHydratedContractId]);


  function computeRatePerUnit(pickRateValue: string, ppiValue: string) {
    const pickRateNum = parseFloat(pickRateValue || '0');
    const ppiNum = parseFloat(ppiValue || '0');

    if (!pickRateNum || !ppiNum) {
      return '';
    }

    const computed = pickRateNum * ppiNum;
    return computed.toFixed(2);
  }

  // Track previous values to avoid unnecessary calculations
  const prevValuesRef = useRef({
    pickCost: '',
    ppi: '',
    fabricCodeId: ''
  });

  // Auto-calculate Rate/Unit whenever dependencies change
  useEffect(() => {
    const { pickCost, ppi, fabricCodeId } = newItem;
    const prev = prevValuesRef.current;

    // Only calculate if values actually changed
    if (pickCost !== prev.pickCost || ppi !== prev.ppi || fabricCodeId !== prev.fabricCodeId) {
      if (pickCost && ppi) {
        const updatedRate = computeRatePerUnit(pickCost, ppi);
        // Only update if rate has actually changed
        if (newItem.ratePerUnit !== updatedRate) {
          setNewItem((prevItem) => ({
            ...prevItem,
            ratePerUnit: updatedRate,
          }));
        }
      } else {
        // Clear ratePerUnit if either pickCost or ppi is missing
        if (newItem.ratePerUnit !== '') {
          setNewItem((prevItem) => ({
            ...prevItem,
            ratePerUnit: '',
          }));
        }
      }

      // Update previous values
      prevValuesRef.current = { pickCost, ppi, fabricCodeId };
    }
  }, [newItem.pickCost, newItem.ppi, newItem.fabricCodeId]);

  // Track previous values for auto-calculations
  const prevCalculationsRef = useRef({
    plannedStartDate: '',
    plannedEndDate: '',
    quantity: '',
    noOfDays: '',
    warpCrimpPercentage: '',
    warpLength: '',
    pieceLength: ''
  });

  // Auto-calculate noOfDays, dailyTarget, warpLength, and numberOfPieces
  useEffect(() => {
    const {
      plannedStartDate,
      plannedEndDate,
      quantity,
      noOfDays,
      warpCrimpPercentage,
      warpLength,
      pieceLength
    } = newItem;
    const prev = prevCalculationsRef.current;
    
    const updatedFields: Partial<WeavingContractItem> = {};

    // 1. Calculate No Of Days
    if (plannedStartDate !== prev.plannedStartDate || plannedEndDate !== prev.plannedEndDate) {
      if (plannedStartDate && plannedEndDate) {
        const start = new Date(plannedStartDate);
        const end = new Date(plannedEndDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const calculatedDays = diffDays >= 0 ? String(diffDays) : '0';
          if (noOfDays !== calculatedDays) {
            updatedFields.noOfDays = calculatedDays;
          }
        }
      } else {
        if (noOfDays !== '') {
          updatedFields.noOfDays = '';
        }
      }
    }

    // Determine target days for Daily Target calculation (use updated one if calculated in this tick)
    const targetDays = 'noOfDays' in updatedFields ? (updatedFields.noOfDays || '') : noOfDays;

    // 2. Calculate Daily Target
    if (quantity !== prev.quantity || targetDays !== prev.noOfDays) {
      const q = parseFloat(quantity || '0');
      const d = parseFloat(targetDays || '0');
      if (q && d) {
        const calculatedTarget = (q / d).toFixed(2);
        if (newItem.dailyTarget !== calculatedTarget) {
          updatedFields.dailyTarget = calculatedTarget;
        }
      } else {
        if (newItem.dailyTarget !== '') {
          updatedFields.dailyTarget = '';
        }
      }
    }

    // 3. Calculate Warp Length
    if (quantity !== prev.quantity || warpCrimpPercentage !== prev.warpCrimpPercentage) {
      const q = parseFloat(quantity || '0');
      const c = parseFloat(warpCrimpPercentage || '0');
      if (q) {
        const calculatedWarpLength = (q * (1 + (c / 100))).toFixed(2);
        if (warpLength !== calculatedWarpLength) {
          updatedFields.warpLength = calculatedWarpLength;
        }
      } else {
        if (warpLength !== '') {
          updatedFields.warpLength = '';
        }
      }
    }

    // Determine target warp length for Pieces calculation (use updated one if calculated in this tick)
    const targetWarpLength = 'warpLength' in updatedFields ? (updatedFields.warpLength || '') : warpLength;

    // 4. Calculate Number of Pieces
    if (targetWarpLength !== prev.warpLength || pieceLength !== prev.pieceLength) {
      const wl = parseFloat(targetWarpLength || '0');
      const pl = parseFloat(pieceLength || '0');
      if (wl && pl) {
        const calculatedPieces = String(Math.round(wl / pl));
        if (newItem.numberOfPieces !== calculatedPieces) {
          updatedFields.numberOfPieces = calculatedPieces;
        }
      } else {
        if (newItem.numberOfPieces !== '') {
          updatedFields.numberOfPieces = '';
        }
      }
    }

    if (Object.keys(updatedFields).length > 0) {
      setNewItem((prevItem) => ({
        ...prevItem,
        ...updatedFields
      }));
    }

    prevCalculationsRef.current = {
      plannedStartDate: plannedStartDate || '',
      plannedEndDate: plannedEndDate || '',
      quantity: quantity || '',
      noOfDays: targetDays || '',
      warpCrimpPercentage: warpCrimpPercentage || '',
      warpLength: targetWarpLength || '',
      pieceLength: pieceLength || ''
    };
  }, [
    newItem.plannedStartDate,
    newItem.plannedEndDate,
    newItem.quantity,
    newItem.noOfDays,
    newItem.warpCrimpPercentage,
    newItem.warpLength,
    newItem.pieceLength
  ]);

  const handlePickCostChange = (value: string) => {
    setNewItem((prevItem) => {
      if (value) {
        setFabricCodeError('');
      }
      return {
        ...prevItem,
        pickCost: value,
      };
    });
  };

  const parseQuantityValue = (val?: string) => {
    const parsed = parseFloat(val ?? '0');
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const calculateTotalQuantityFromInput = (inputQuantity: string) => {
    const inputValue = parseQuantityValue(inputQuantity);
    const savedTotal = weavingContractItemDtl.reduce((sum, item) => sum + parseQuantityValue(item.quantity), 0);
    const editingOriginal = editingIndex !== null
      ? parseQuantityValue(weavingContractItemDtl[editingIndex]?.quantity)
      : (newItem?.id != null
        ? parseQuantityValue(weavingContractItemDtl.find((item) => item.id === newItem.id)?.quantity)
        : 0);
    return savedTotal - editingOriginal + inputValue;
  };

  const syncOrderDetailsWithQuantity = (totalQty: number) => {
    if (!orderDetails.length) {
      return;
    }
    setOrderDetails((prev) => prev.map((detail) => {
      const formatted = totalQty ? totalQty.toString() : '0';
      return {
        ...detail,
        plannedQuantity: formatted,
        totalQuantity: formatted,
      };
    }));
  };

  const handleQuantityChange = (value: string) => {
    const totalQty = calculateTotalQuantityFromInput(value);
    syncOrderDetailsWithQuantity(totalQty);
    setNewItem((prevItem) => ({
      ...prevItem,
      quantity: value,
    }));
  };

  const calculateSummary = () => {
    const netAmount = weavingContractItemDtl.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const pickCost = parseFloat(item.pickCost) || 0;
      return sum + (quantity * pickCost);
    }, 0);

    return { netAmount };
  };

  const { netAmount } = calculateSummary();

  // In your handleFabricCodeChange function, update the yarn requirements calculation:
  const handleFabricCodeChange = async (value: string) => {
    const selectedFabric = fabricMasterList.find((f: { id: { toString: () => string; }; }) => f.id.toString() === value);
    setSelectedFabric(selectedFabric || null);

    if (selectedFabric) {
      // Auto-fetch PPI and crimp from fabric master
      const ppi = selectedFabric.ppi ? String(selectedFabric.ppi) : '';
      const crimp = selectedFabric.crimp ? String(selectedFabric.crimp) : '';

      setNewItem((prevItem) => {
        return {
          ...prevItem,
          fabricCodeId: value,
          fabricQualityId: selectedFabric.id.toString(),
          ppi,
          warpCrimpPercentage: crimp,
        };
      });
      setFabricCodeError('');

      // Clear existing order details when fabric changes
      setOrderDetails([]);
      setOrderDetailsError("");

      // Fetch fabric master details
      try {
        const response = await apiService.get(`fabric-master/${value}`);
        setFabricMasterDetails(response.data);

        // Check if details exist before mapping
        const warpDetails = response.data?.warpDetails || [];
        const weftDetails = response.data?.weftDetails || [];

        // Fetch company-specific availability for each yarn
        const warpReqs = await Promise.all(warpDetails.map(async (detail: any) => {
          let availQty = 0;
          if (detail.yarnId && selectedCompanyId) {
            try {
              const availResponse = await apiService.get(`yarn-inward-stock/available-qty/${detail.yarnId}/${selectedCompanyId}`);
              availQty = Number(availResponse?.data ?? availResponse ?? 0);
            } catch (err) {
              console.error(`Failed to fetch availability for yarn ${detail.yarnId}`, err);
            }
          }
          return {
            yarnType: "Warp",
            yarnId: detail.yarnId,
            yarnCount: resolveYarnName(detail.yarnId, detail.yarnCount?.toString() || detail.yarnId?.toString()),
            gramsPerMeter: Number(detail.gramsPerMeter || detail.grams_per_meter || 0),
            totalWeavingOrderQty: totalItemQuantity,
            totalRequiredQty: totalItemQuantity * Number(detail.gramsPerMeter || detail.grams_per_meter || 0),
            totalAvailableQty: availQty,
            activeFlag: true
          };
        }));

        const weftReqs = await Promise.all(weftDetails.map(async (detail: any) => {
          let availQty = 0;
          if (detail.yarnId && selectedCompanyId) {
            try {
              const availResponse = await apiService.get(`yarn-inward-stock/available-qty/${detail.yarnId}/${selectedCompanyId}`);
              availQty = Number(availResponse?.data ?? availResponse ?? 0);
            } catch (err) {
              console.error(`Failed to fetch availability for yarn ${detail.yarnId}`, err);
            }
          }
          return {
            yarnType: "Weft",
            yarnId: detail.yarnId,
            yarnCount: resolveYarnName(detail.yarnId, detail.yarnCount?.toString() || detail.yarnId?.toString()),
            gramsPerMeter: Number(detail.gramsPerMeter || detail.grams_per_meter || 0),
            totalWeavingOrderQty: totalItemQuantity,
            totalRequiredQty: totalItemQuantity * Number(detail.gramsPerMeter || detail.grams_per_meter || 0),
            totalAvailableQty: availQty,
            activeFlag: true
          };
        }));

        const yarnReqs = [...warpReqs, ...weftReqs];

        // Only set yarn requirements if NOT in edit mode OR if yarn requirements are empty
        if (!isEditing || yarnRequirements.length === 0) {
          setYarnRequirements(yarnReqs);
        }
      } catch (error) {
        console.error("Error fetching fabric master details:", error);
        // Set empty array instead of empty objects
        setYarnRequirements([]);
      }
    } else {
      // Clear yarn requirements if no fabric selected
      setYarnRequirements([]);
    }
  };

  const addItem = () => {
    if (!newItem.fabricCodeId) {
      setFabricCodeError("Sort No is required");
      setIsItemsValid(false);
      return;
    }
    if (!newItem.ppi) {
      setFabricCodeError("Rate/unit is required");
      setIsItemsValid(false);
      return;
    }
    if (!newItem.ratePerUnit) {
      setFabricCodeError("Rate/unit is required");
      setIsItemsValid(false);
      return;
    }
    setIsItemsValid(true);
    setFabricCodeError("");

    if (editingIndex !== null) {
      const updatedItems = [...weavingContractItemDtl];
      updatedItems[editingIndex] = newItem;
      setweavingContractItemDtl(updatedItems);
      setEditingIndex(null);
    } else {
      setweavingContractItemDtl([...weavingContractItemDtl, newItem]);
    }
    setNewItem({
      fabricCodeId: '',
      fabricTypeId: '',
      fabricCategoryId: '',
      quantity: '',
      pickCost: '',
      plannedStartDate: '',
      plannedEndDate: '',
      dailyTarget: '',
      numberOfLooms: '',
      warpLength: '',
      warpCrimpPercentage: '',
      pieceLength: '',
      numberOfPieces: '',
      ppi: '',
      ratePerUnit: '',
      noOfDays: '',
      loomType: '',
      activeFlag: true
    });
  };

  const handleSalesOrderChange = (index: number, value: string) => {
    const updated = [...orderDetails];
    updated[index].salesOrderNo = value;

    setOrderDetailsError("");

    const isDuplicate = updated.some((detail, detailIndex) =>
      detail.salesOrderNo === value && detailIndex !== index
    );
    if (isDuplicate) {
      setOrderDetailsError("Sales Order already selected in this contract.");
      updated[index].salesOrderNo = "";
      setOrderDetails(updated);
      return;
    }

    const selectedOrder = filteredSalesOrders?.find((so: any) => String(so.id) === String(value));
    const matchingOrderItem = selectedOrder?.items?.find((item: any) =>
      allRelevantFabricIds.includes(String(item.fabricMasterId ?? item.fabricId))
    );
    const salesOrderQty = matchingOrderItem?.orderQty !== undefined && matchingOrderItem?.orderQty !== null
      ? String(matchingOrderItem.orderQty)
      : '';

    const totalQuantityFromItems = totalItemQuantity ? totalItemQuantity.toString() : "0";

    updated[index].orderQuantity = salesOrderQty;
    updated[index].plannedQuantity = totalQuantityFromItems;
    updated[index].totalQuantity = totalQuantityFromItems;

    setOrderDetails(updated);
  };

  // const handleSalesOrderChange = (index: number, value: string) => {
  //   const updated = [...orderDetails];
  //   updated[index].salesOrderNo = value;

  //   setOrderDetailsError("");

  //   // Prevent duplicate sales orders
  //   const isDuplicate = updated.some((detail, detailIndex) =>
  //     detail.salesOrderNo === value && detailIndex !== index
  //   );
  //   if (isDuplicate) {
  //     setOrderDetailsError("Sales Order already selected in this contract.");
  //     updated[index].salesOrderNo = "";
  //     setOrderDetails(updated);
  //     return;
  //   }

  //   const totalQuantityFromItems = totalItemQuantity ? totalItemQuantity.toString() : "0";

  //   updated[index].orderQuantity = totalQuantityFromItems;
  //   updated[index].plannedQuantity = totalQuantityFromItems;
  //   updated[index].totalQuantity = totalQuantityFromItems;

  //   setOrderDetails(updated);
  // };

  const handlePlannedQtyChange = (index: number, value: string) => {
    const updated = [...orderDetails];
    const sanitizedValue = value === "" ? "" : String(value);
    updated[index].plannedQuantity = sanitizedValue;
    updated[index].totalQuantity = sanitizedValue;
    setOrderDetails(updated);
  };

  const deleteOrderDetail = (index: number) => {
    setOrderDetails(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: WeavingContractFormData) => {
    const resolvedCompanyId = getValidCompanyId();
    if (!resolvedCompanyId) {
      toast.error("Please select a company before saving the contract.");
      return;
    }
    const companyId = resolvedCompanyId;
    isSavingRef.current = true;

    let resolvedWeavingContractNo = weavingContractDtl?.id
      ? (weavingContractDtl?.weavingContractNo || weavingContractNumber)
      : weavingContractNumber;

    // Generate new number if needed (for create mode)
    if (!weavingContractDtl?.id && !resolvedWeavingContractNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Weaving Contract"
        });
        resolvedWeavingContractNo = docResponse.documentNumber;
        setWeavingContractNumber(resolvedWeavingContractNo);
      } catch (error) {
        // Fallback: generate a basic sequential number
        resolvedWeavingContractNo = `WC/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}/001`;
        console.warn('Failed to generate weaving contract number, using fallback:', error);
      }
    }


    let allItems: WeavingContractItem[] = [];

    if (weavingContractDtl && weavingContractDtl.id) {
      // EDIT MODE: Use the current form item with the existing ID
      if (newItem.fabricCodeId && newItem.quantity) {
        // Get the first existing item ID to use for updating
        const existingItemId = weavingContractDtl.items?.[0]?.id;
        allItems = [{
          ...newItem,
          id: existingItemId // Use the existing ID
        }];
      }
    } else {
      // CREATE MODE: Combine saved items with current form item
      allItems = [...weavingContractItemDtl];

      if (newItem.fabricCodeId && newItem.quantity) {
        if (editingIndex !== null) {
          allItems[editingIndex] = newItem;
        } else {
          allItems.push(newItem);
        }
      }
    }

    // Filter out empty yarn requirements and calculate updated values
    const validYarnRequirements = yarnRequirements.filter(req =>
      req.yarnType && req.yarnCount && req.gramsPerMeter > 0
    );

    const updatedYarnRequirements = validYarnRequirements.map(req => {
      const totalItemQuantity = allItems.reduce((total, item) => {
        return total + Number(item.quantity || 0);
      }, 0);

      const totalWeavingOrderQty = totalItemQuantity;
      const totalRequiredQty = totalItemQuantity * Number(req.gramsPerMeter || 0);

      const yarnId = req.yarnId || (req.yarnCount ? yarnIdByName[req.yarnCount.trim().toLowerCase()] : undefined);

      return {
        id: req.id,
        yarnId,
        yarnType: req.yarnType,
        yarnCount: req.yarnCount,
        gramsPerMeter: req.gramsPerMeter,
        totalWeavingOrderQty,
        totalRequiredQty,
        totalAvailableQty: req.totalAvailableQty || 0,
        activeFlag: true
      };
    });

    const vendor = vendorList?.find((v: any) => v.id === parseInt(String(data.vendorId)));
    const tradingCompanyId = companyId;
    const factoryCompanyId = resolveFactoryCompanyId(vendor);
    const orderTypeIdNum = parseInt(String(data.orderTypeId || ""));
    const effectiveFactoryCompanyId = orderTypeIdNum === 1 ? factoryCompanyId : null;

    const payload = {
      // weavingContractNo: weavingContractNo,
      weavingContractNo: resolvedWeavingContractNo,
      companyId: companyId,
      tradingCompanyId: tradingCompanyId,
      factoryCompanyId: effectiveFactoryCompanyId,
      contractDate: data.contractDate,
      taxId: parseInt(data.taxId),
      vendorId: parseInt(data.vendorId),
      orderTypeId: parseInt(data.orderTypeId),
      termsConditionsId: parseInt(data.termsConditionsId),
      paymentTermsId: parseInt(data.paymentTermsId),
      remarks: data.remarks,
      rpm: data.rpm ? parseInt(data.rpm, 10) : null,
      efficiency: data.efficiency ? parseFloat(data.efficiency) : null,
      productCalculation: data.productCalculation ? parseFloat(data.productCalculation) : null,
      isComplete: weavingContractDtl?.isComplete || 0,
      items: allItems.map(item => ({
        id: item.id, // This should now have the existing ID in edit mode
        fabricCodeId: parseInt(item.fabricCodeId),
        // fabricQualityId: parseInt(item.fabricQualityId),
        fabricQualityId: null,
        fabricTypeId: item.fabricTypeId ? parseInt(item.fabricTypeId) : null,
        fabricCategoryId: item.fabricCategoryId ? parseInt(item.fabricCategoryId) : null,
        quantity: parseFloat(item.quantity),
        pickCost: parseFloat(item.pickCost),
        plannedStartDate: item.plannedStartDate || null,
        plannedEndDate: item.plannedEndDate || null,
        dailyTarget: item.dailyTarget ? parseFloat(item.dailyTarget) : null,
        numberOfLooms: item.numberOfLooms ? parseInt(item.numberOfLooms) : null,
        warpLength: item.warpLength ? parseFloat(item.warpLength) : null,
        warpCrimpPercentage: item.warpCrimpPercentage ? parseFloat(item.warpCrimpPercentage) : null,
        pieceLength: item.pieceLength ? parseFloat(item.pieceLength) : null,
        numberOfPieces: item.numberOfPieces ? parseInt(item.numberOfPieces) : null,
        activeFlag: true,
        ppi: parseFloat(item.ppi),
        noOfDays: item.noOfDays ? parseInt(item.noOfDays) : null,
        loomType: item.loomType || null,
      })),
      yarnRequirements: updatedYarnRequirements,
      orderDetails: orderDetails.map(d => ({
        id: d.id,
        salesOrderId: d.salesOrderNo ? parseInt(d.salesOrderNo) : undefined,
        fabricCodeId: newItem.fabricCodeId ? parseInt(newItem.fabricCodeId) : undefined,
        orderQuantity: d.orderQuantity ? parseFloat(d.orderQuantity) : 0,
        plannedQuantity: d.plannedQuantity ? parseFloat(d.plannedQuantity) : 0,
        totalQuantity: d.plannedQuantity ? parseFloat(d.plannedQuantity) : 0,
        activeFlag: true
      }))
    };

    // alert(JSON.stringify(payload));

    try {
      let updatedContract;

      // alert(JSON.stringify(payload));
      if (weavingContractDtl && weavingContractDtl.id) {
        updatedContract = await dispatch(updateWeavingContract({ id: weavingContractDtl.id, data: payload })).unwrap();
      } else {
        updatedContract = await dispatch(createWeavingContract(payload)).unwrap();
        if (resolvedWeavingContractNo) {
          const sequencePart = resolvedWeavingContractNo.split('/').pop() || resolvedWeavingContractNo;
          documentNumberService.updateMemoryCache('Weaving Contract', sequencePart);
        }
      }

      console.log("Contract saved successfully:", updatedContract);
      reset();
      setweavingContractItemDtl([]);
      setYarnRequirements([]);
      setOrderDetails([]);

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
        const targetTab = updatedContract?.isComplete === 1 ? 'completed' : 'open';
        navigate("/transaction/weaving-contract-details", {
          state: { activeTab: targetTab }
        });
      }
    } catch (error) {
      isSavingRef.current = false;
      toast.error("Failed to save weaving contract");
      console.error("Save error:", error);
    }
  };


  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        {/* Title & Save Button */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/transaction/weaving-contract-details")}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">Weaving Contract Entry</h2>
          </div>

        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} /> Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Weaving Contract No</label>
                  <input
                    type="text"
                    value={weavingContractNumber || ''}
                    readOnly
                    className={`w-full border px-3 py-2 rounded transition-all duration-200 mt-1 ${
                      !weavingContractNumber || weavingContractNumber?.startsWith('Loading')
                        ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                        : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                    }`}
                    placeholder="Loading sequence..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Contract Date <span className="text-red-600">*</span></label>
                  <input type="date" className="input mt-1" {...register("contractDate", { required: "Contract Date is required" })} />
                  {errors.contractDate && (
                    <p className="mt-1 text-sm text-red-600">{String(errors.contractDate.message)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700">Order Type <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    className="mt-1"
                    placeholder="Select Order Type"
                    value={watch('orderTypeId') || ''}
                    options={[
                      { value: '1', label: 'Internal' },
                      { value: '2', label: 'External' },
                    ]}
                    {...register('orderTypeId', { required: 'Order Type is required' })}
                    onValueChange={(value) => {
                      if (isWeavingContractMapped) return;
                      setValue('orderTypeId', value, { shouldValidate: true });
                      setValue('vendorId', '', { shouldValidate: true });
                    }}
                    disabled={isWeavingContractMapped}
                    error={errors.orderTypeId?.message as string}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Select a Vendor <span className="text-red-600">*</span> </label>
                  <CommonSearchableSelect
                    className="mt-1"
                    placeholder="Select a Vendor"
                    value={watch('vendorId') || ''}
                    options={(filteredVendorList || []).map((vendor: any) => ({
                      value: String(vendor.id),
                      label: vendor.vendorName,
                      activeFlag: vendor.activeFlag ?? true,
                    }))}
                    {...register("vendorId", { required: "Vendor is required" })}
                    onValueChange={(value) => { if (!isWeavingContractMapped) setValue('vendorId', value, { shouldValidate: true }); }}
                    disabled={isWeavingContractMapped}
                    error={errors.vendorId?.message as string}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">GST Type <span className="text-red-600">*</span></label>
                  <select
                    {...register("taxId", { required: "GST Type is required" })}
                    className={`input mt-1 ${errors.taxId ? 'border-red-500' : ''}`}
                    disabled
                  >
                    <option value="">Select GST Type</option>
                    <option value="1">CGST/SGST</option>
                    <option value="2">IGST</option>
                  </select>
                  {errors.taxId && (
                    <p className="mt-1 text-sm text-red-600">{String(errors.taxId.message)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Select Terms & Conditions <span className="text-red-600">*</span> </label>
                  <CommonSearchableSelect
                    className="mt-1"
                    placeholder="Select Terms & Conditions"
                    value={watch('termsConditionsId') || ''}
                    options={(termsContitionsList || []).map((tc: any) => ({
                      value: String(tc.id),
                      label: tc.termsConditionsName,
                      activeFlag: tc.activeFlag ?? true,
                    }))}
                    filterActive
                    {...register("termsConditionsId", { required: "Terms & Conditions is required" })}
                    onValueChange={(value) => setValue('termsConditionsId', value, { shouldValidate: true })}
                    error={errors.termsConditionsId?.message as string}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Select Payment Terms <span className="text-red-600">*</span> </label>
                  <CommonSearchableSelect
                    className="mt-1"
                    placeholder="Select Payment Terms"
                    value={watch('paymentTermsId') || ''}
                    options={(paymentTermsList || []).map((pt: any) => ({
                      value: String(pt.id),
                      label: pt.termName,
                      activeFlag: pt.activeFlag ?? true,
                    }))}
                    filterActive
                    {...register("paymentTermsId", { required: "Payment Terms is required" })}
                    onValueChange={(value) => setValue('paymentTermsId', value, { shouldValidate: true })}
                    error={errors.paymentTermsId?.message as string}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Remarks</label>
                  <input {...register("remarks")} placeholder="Remarks" className="input mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart size={20} /> Item Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Sort No <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    className="mt-1"
                    placeholder="Select Sort No"
                    value={newItem.fabricCodeId || ''}
                    options={(fabricMasterList || []).map((fabric: FabricMaster) => ({
                      value: String(fabric.id),
                      label: fabric.fabricCode,
                    }))}
                    onValueChange={(value) => { if (!isWeavingContractMapped) handleFabricCodeChange(value); }}
                    disabled={isWeavingContractMapped}
                  />
                  {fabricCodeError && <p className="mt-1 text-sm text-red-600">{fabricCodeError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Construction</label>
                  <input
                    value={selectedFabric?.fabricQuality || ''}
                    readOnly
                    className="input mt-1 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Quantity</label>
                  <input
                    type="number"
                    placeholder="Enter Quantity"
                    value={newItem.quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="input mt-1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Pick Rate</label>
                  <input
                    type="number"
                    placeholder="Enter pick rate"
                    value={newItem.pickCost}
                    onChange={(e) => handlePickCostChange(e.target.value)}
                    className="input mt-1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Rate/unit <span className="text-red-600">*</span></label>
                  <input
                    placeholder="Pick rate × PPI"
                    value={newItem.ratePerUnit}
                    readOnly
                    className="input mt-1 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Planned Start Date</label>
                  <input type="date" value={newItem.plannedStartDate}
                    onChange={e => setNewItem({ ...newItem, plannedStartDate: e.target.value })} className="input mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Planned End Date</label>
                  <input type="date" value={newItem.plannedEndDate}
                    onChange={e => setNewItem({ ...newItem, plannedEndDate: e.target.value })} className="input mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">No of Days</label>
                  <input
                    placeholder="Auto-calculated"
                    value={newItem.noOfDays || ''}
                    readOnly
                    className="input mt-1 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Daily Target</label>
                  <input
                    placeholder="Auto-calculated"
                    value={newItem.dailyTarget || ''}
                    readOnly
                    className="input mt-1 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">No of Looms</label>
                  <input placeholder="Enter no of looms" value={newItem.numberOfLooms}
                    onChange={e => setNewItem({ ...newItem, numberOfLooms: e.target.value })} className="input mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Loom Type</label>
                  <CommonSearchableSelect
                    className="mt-1"
                    placeholder="Select Loom Type"
                    value={newItem.loomType || ''}
                    options={(subCategoryList || [])
                      .filter((sc: any) => sc.categoryName === 'Loom Type')
                      .map((sc: any) => ({
                        value: sc.subCategoryName || sc.name,
                        label: sc.subCategoryName || sc.name,
                      }))}
                    onValueChange={(value) => setNewItem({ ...newItem, loomType: value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Warp Crimp%</label>
                  <input placeholder="Enter warp crimp" value={newItem.warpCrimpPercentage}
                    onChange={e => setNewItem({ ...newItem, warpCrimpPercentage: e.target.value })} className="input mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Warp Length</label>
                  <input
                    placeholder="Auto-calculated"
                    value={newItem.warpLength || ''}
                    readOnly
                    className="input mt-1 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Piece Length</label>
                  <input placeholder="Enter piece length" value={newItem.pieceLength}
                    onChange={e => setNewItem({ ...newItem, pieceLength: e.target.value })} className="input mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">No of Pieces</label>
                  <input
                    placeholder="Auto-calculated"
                    value={newItem.numberOfPieces || ''}
                    readOnly
                    className="input mt-1 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">RPM</label>
                  <input
                    type="number"
                    placeholder="Enter RPM"
                    className="input mt-1"
                    {...register("rpm")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Efficiency %</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter Efficiency %"
                    className="input mt-1"
                    {...register("efficiency")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Production Calculation/mtr</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Auto-calculated"
                    readOnly
                    className="input mt-1 bg-gray-100 font-mono font-semibold"
                    {...register("productCalculation")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={20} /> Yarn Requirement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="table-auto w-full border border-gray-300 mt-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2">Sl.No</th>
                    <th className="border px-4 py-2">Warp/Weft</th>
                    <th className="border px-4 py-2">Yarn Count</th>
                    <th className="border px-4 py-2">Grams/Mtr</th>
                    <th className="border px-4 py-2">Total Req Quantity</th>
                    <th className="border px-4 py-2">Total Available Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {yarnRequirements.length > 0 ? (
                    yarnRequirements.map((req, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2 text-center">{index + 1}</td>
                        <td className="border px-4 py-2 text-center">{req.yarnType}</td>
                        <td className="border px-4 py-2 text-center">{req.yarnCount}</td>
                        <td className="border px-4 py-2 text-center">{req.gramsPerMeter}</td>
                        <td className="border px-4 py-2 text-center">
                          {(() => {
                            const totalRequiredQty = totalItemQuantity * Number(req.gramsPerMeter || 0);
                            return Number.isFinite(totalRequiredQty) ? totalRequiredQty.toFixed(2) : "0.00";
                          })()}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {(() => {
                            const availableQty = Number(req.totalAvailableQty ?? 0);
                            const displayQty = availableQty > 0 ? availableQty : 0;
                            return Number.isFinite(displayQty) ? displayQty.toFixed(2) : "0.00";
                          })()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="border px-4 py-2 text-center text-gray-500">
                        No yarn details found for the selected fabric code
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={20} /> Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setOrderDetails([...orderDetails, { fabricCodeId: '', salesOrderNo: '', orderQuantity: '', plannedQuantity: '', totalQuantity: '0' }])}
                  className="bg-primary text-white"
                >
                  Add Order Items
                </Button>
              </div>
              <table className="w-full border-collapse border border-gray-300 text-center">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">Sl.No</th>
                    <th className="border p-2">Sales Order No</th>
                    <th className="border p-2">Sales Order Quantity</th>
                    <th className="border p-2">Planned Quantity</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.map((detail, index) => (
                    <tr key={index} className="border">
                      <td className="border p-2">{index + 1}</td>
                      <td className="border p-2">
                        <CommonSearchableSelect
                          className="border border-gray-300 rounded px-0 py-0"
                          value={detail.salesOrderNo || ''}
                          options={(filteredSalesOrders || []).map((so: any) => ({
                            value: String(so.id),
                            label: [so.salesOrderNo || so.orderNumber || `SO-${so.id}`, so.buyerCustomerName].filter(Boolean).join(' - '),
                          }))}
                          placeholder={!newItem.fabricCodeId
                            ? "Select Sort No in Item Details first"
                            : "Select Sales Order"}
                          onValueChange={(value) => handleSalesOrderChange(index, value)}
                          disabled={isWeavingContractMapped || !newItem.fabricCodeId}
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={detail.orderQuantity}
                          className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-100"
                          placeholder="Sales Order Qty"
                          readOnly
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={detail.plannedQuantity}
                          onChange={(e) => handlePlannedQtyChange(index, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                          placeholder="Planned Qty"
                        />
                      </td>
                      <td className="border p-2">
                        <Button
                          size="sm"
                          onClick={() => deleteOrderDetail(index)}
                          variant="destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {orderDetails.length === 0 && (
                    <tr>
                      <td colSpan={6} className="border p-2 text-gray-500">No order details added</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSubmit(onSubmit)}
              className="bg-primary hover:bg-primary text-white px-6 flex items-center"
              disabled={!isFormValid}
            >
              <Save size={18} className="mr-2" />
              {weavingContractDtl ? "Update Weaving Contract" : "Save Weaving Contract"}
            </Button>
          </div>
        </div>
        <div>

          {isWeavingContractMapped && (
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
                  {["Order Type", "Vendor", "Sort No", "Sales Order No"].map(f => (
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