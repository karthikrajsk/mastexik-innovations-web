// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { FileText, ShoppingCart, ClipboardList, Edit, Trash2, Save, Plus, Loader2, ArrowLeft } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useForm } from "react-hook-form";
// import { Checkbox } from "@/components/ui/checkbox";
// import { createPurchaseOrder, getAllPoTypes, getAllPurchaseOrders, updatePurchaseOrder } from "@/state/purchaseOrderSlice";
// import { AppDispatch, RootState } from "@/state/store";
// import { useDispatch, useSelector } from "react-redux";
// import { getAllCustomers } from "@/state/customerSlice";
// import { getAllProductCategory } from "@/state/productCategorySlice";
// import { DataTable } from "@/components/data/DataTable";
// import { getAllVendors } from "@/state/vendorSlice";
// import { getAllTermsConditions } from "@/state/termsConditions";
// import { getAllWeavingContract, getWeavingContractById } from "@/state/weavingContractSlice";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { CodeSandboxLogoIcon } from "@radix-ui/react-icons";
// import { createWeavingYarnIssue } from "@/state/weavingYarnIssueSlice";
// import { getAllDyeingWorkOrdersByType } from "@/state/processContractSlice";
// import { getSubCategoryByCategory, getAllSubCategories } from "@/state/subCategorySlice";
// import { getAllShipmentModes } from "@/state/shipmentModeSlice";
// import { useLocation, useNavigate } from "react-router-dom";
// import { getAllSalesOrders } from "@/state/salesOrderSlice";
// import { createYarnDispatch, updateYarnDispatch, getAllYarnDispatch } from "@/state/yarn-dispatch-for-dyeing-slice";
// import { getAllYarnMasters } from "@/state/yarnSlice";
// import { getAllFinishFabricReceivesByType } from "@/state/finishFabricReceiveSlice";
// import { getAllWarehouse } from "@/state/warehouseSlice";
// import { getAllTransports } from "@/state/transportSlice";
// import { toast } from "react-toastify";
// import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
// import apiService from "@/services/ApiService";
// import documentNumberService from "@/services/DocumentNumberService";
// import { resolveCompanyId } from "@/hooks/useCompanyContext";
// import { VENDOR_TYPE_ALL, filterVendorsByTypeIds } from "@/utils/vendorFilters";
// import type { ApiState as SubCategoryState } from "@/state/subCategorySlice";
// import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
// import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";

// interface YarnIssueDetail {
//     id?: number;
//     yarnName: string;
//     availableReqQty: number;
//     issueQty: number;
//     lotId: string;
//     activeFlag?: boolean;
//     availableBags?: number;
//     kgsPerBag?: number;
//     conesPerBag?: number;
//     conesWeight?: number;
//     lotNumber?: string;
//     millId?: number | string | null;
//     millName?: string;
//     warehouseId?: number | string | null;
//     warehouseName?: string;
//     inwardId?: number | null;
//     orderItemId?: number | null;
//     itemId?: number | null;
// }

// // For Yarn Requirement Details Table
// interface YarnRequirementDetail {
//     yarnName: string;
//     yarnCount: string;
//     gramsPerMeter: string;
//     totalwarpReq: string;
//     totalWarpIssued: string;
//     balanceWarpToIssue: string;
//     activeFlag: boolean;
// }

// // For Yarn Issue Details Table
// // In your ProcessingYarnIssue component
// interface YarnDispatchDyeingFormData {
//     id?: number;
//     fabricDispatchDate: string;
//     vendorId: string;
//     dyeingWorkOrderId: string;
//     lotNumber: string;
//     orderQuantity: string;
//     dispatchedQuantity: string;
//     receivedQuantity: string;
//     balanceQuantity: string;
//     costPerPound: string;
//     totalAmount: string;
//     colorId: string;
//     pantone: string;
//     finishingId: string;
//     salesOrderId: string;
//     shipmentModeId: string;
//     lotId: string | null;
//     remarks: string;
//     transportId?: string;
//     transportName: string;
//     vehicleNo?: string;
//     grossWt: string | number;
//     activeFlag: boolean; // Changed from 'true' to 'boolean'
//     processType: string;
//     fabricDispatchId?: string;
// }

// interface LotDetail {
//     id?: string;
//     lotId?: string | number;
//     yarnName: string;
//     availableQty: number;
//     lotNumber?: string;
//     issueQty?: number | null;
//     activeFlag?: boolean;
//     millId?: number | string;
//     millName?: string;
//     warehouseId?: number | string;
//     warehouseName?: string;
//     inwardId?: number | null;
//     orderItemId?: number | null;
//     itemId?: number | null;
//     availableBags?: number;
//     noOfBags?: number | null;
//     kgsPerBag?: number;
//     conesPerBag?: number;
//     conesWeight?: number;
//     finishedYarnId?: string | number; // Added
//     finishedYarnName?: string; // Added
// }

// const getFinishedYarnIdentifier = (item: any) => String(item?.finishedYarnId ?? item?.finishedYarnCodeId ?? item?.greigeYarnCodeId ?? item?.yarnId ?? item?.itemId ?? item?.finishedFabricCode ?? item?.id ?? "");

// // const getFinishedYarnIdentifier = (item: any) => String(item?.id ?? item?.yarnId ?? item?.greigeYarnCodeId ?? item?.finishedYarnCodeId ?? "");

// const buildYarnInwardStockUrl = (itemIds: string) => {
//     const params: string[] = [];
//     if (itemIds) {
//         params.push(`itemId=${itemIds}`);
//     }
//     const companyId = resolveCompanyId();
//     if (companyId !== null) {
//         params.push(`companyId=${companyId}`);
//     }
//     return params.length
//         ? `/sizing-yarn-issues/yarn-inward-stock?${params.join("&")}`
//         : `/sizing-yarn-issues/yarn-inward-stock`;
// };

// const calculateIssueQty = (bags?: number | string, kgs?: number | string) => {
//     if (bags === "" || kgs === "" || bags == null || kgs == null) {
//         return "";
//     }
//     const bagValue = Number(bags);
//     const kgValue = Number(kgs);
//     return Number((bagValue * kgValue).toFixed(3));
// };

// const PROCESS_VENDOR_TYPE_IDS = [304, VENDOR_TYPE_ALL];

// export function ProcessingYarnIssue() {

//     const [isFormValid, setIsFormValid] = useState(false);
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const { processContractList } = useSelector((state: RootState) => state.dyeingWorkOrde);
//     const { shipmentModesList } = useSelector((state: RootState) => state.shipmentMode);
//     const { vendorList } = useSelector((state: RootState) => state.vendor);
//     const processVendors = useMemo(
//         () => filterVendorsByTypeIds(vendorList, PROCESS_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null }),
//         [vendorList]
//     );
//     const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
//     const { finishFabricReceiveList } = useSelector((state: RootState) => state.finishFabricReceive as any);
//     const { transportList } = useSelector((state: RootState) => state.transport);
//     const { yarnDispatchDyingList } = useSelector((state: RootState) => state.yarnDispatchForDyeing as any);
//     const { subCategoryList: subCategories, subCategoryByCategoryList } = useSelector(
//         (state: RootState) => state.subCategory as SubCategoryState
//     );
//     const { warehouseList } = useSelector((state: RootState) => state.warehouse);
//     const { yarnList } = useSelector((state: RootState) => state.yarn);
//     const [weavingContractItemDtl, setweavingContractItemDtl]: any = useState([]);
//     const [newItem, setNewItem]: any = useState({});
//     const [editingIndex, setEditingIndex]: any = useState(null);
//     const [activeTab, setActiveTab] = useState("orderDetails");
//     const [selectedJobWork, setSelectedJobWork]: any = useState([]);
//     const [yarnRequirementDetails, setYarnRequirementDetails]: any = useState<YarnRequirementDetail[]>([]);
//     const [showLotDialog, setShowLotDialog] = useState(false);
//     const [yarnIssueDetails, setYarnIssueDetails]: any = useState<YarnIssueDetail[]>([]);
//     const [selectedLot, setSelectedLot] = useState<LotDetail[]>([]);
//     const [lotMeta, setLotMeta] = useState<{ [id: string]: { millId?: string; warehouseId?: string } }>({});
//     const millOptions = useMemo(() => (subCategories || []).filter((sc: any) => sc.categoryName === "Mill"), [subCategories]);
//     const millNameById = useMemo(() => {
//         const map = new Map<string, string>();
//         millOptions.forEach((mill: any) => {
//             map.set(String(mill.id), mill.subCategoryName || mill.name || '');
//         });
//         return map;
//     }, [millOptions]);

//     const transportOptions = useMemo(() => {
//         const list = Array.isArray(transportList) ? transportList : [];
//         return list.map((t: any) => ({ 
//             id: t.id, 
//             name: t.transportName || t.name,
//             activeFlag: t.activeFlag ?? true 
//         }));
//     }, [transportList]);

//     const dispatch = useDispatch<AppDispatch>();
//     const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<YarnDispatchDyeingFormData>();


//     // Auto-calculate Gross Weight
//     useEffect(() => {
//         const totalIssueQty = selectedLot.reduce((sum: number, lot: any) => sum + (lot.issueQty ? Number(lot.issueQty) : 0), 0);
//         const detailsCount = selectedLot.length || 1;
//         const calculatedGrossWt = (totalIssueQty / detailsCount).toFixed(3);
//         setValue("grossWt", calculatedGrossWt);
//     }, [selectedLot, setValue]);
//     const [selectedDyeingWorkOrder, setSelectedDyeingWorkOrder] = useState<any>(null);
//     const [dispatchDetails, setDispatchDetails] = useState({
//         // finishedCode: "",
//         // greigeCode: "",
//         finishedFabricCode: "",
//         finishedFabricName: "",
//         greigeFabricCode: "",
//         greigeFabricName: "",
//         orderQuantity: "",
//         dispatchedQuantity: "",
//         receivedQuantity: "",
//         balanceQuantity: ""
//     });
//     const [finishedYarnOptions, setFinishedYarnOptions] = useState<any[]>([]);
//     const [selectedYarnItemId, setSelectedYarnItemId] = useState("");
//     const selectedFinishedYarnMeta = useMemo(() => {
//         const yarnItem = finishedYarnOptions.find((option: any) => getFinishedYarnIdentifier(option) === selectedYarnItemId);
//         const fallbackLabel = yarnItem
//             ? (yarnItem.finishedYarnName || yarnItem.greigeYarnName || yarnItem.yarnName || "")
//             : (dispatchDetails.finishedFabricName || "");
//         return {
//             id: yarnItem ? getFinishedYarnIdentifier(yarnItem) : "",
//             label: fallbackLabel
//         };
//     }, [finishedYarnOptions, selectedYarnItemId, dispatchDetails.finishedFabricName]);
//     const enhanceLotsWithFinishedYarn = (lots: any[]) => lots.map((lot: any) => ({
//         ...lot,
//         finishedYarnName: lot.finishedYarnName || selectedFinishedYarnMeta.label,
//         finishedYarnId: lot.finishedYarnId || selectedFinishedYarnMeta.id
//     }));
//     const [formErrors, setFormErrors] = useState({
//         yarnDispatchDate: false,
//         vendorId: false,
//         dyeingWorkOrderId: false,
//         orderQuantity: false,
//         // Add other fields as needed
//     });
//     const navigate = useNavigate();
//     const location = useLocation();
//     const processingIssueDtl = location.state?.processingIssueDtl;
//     const companyId = resolveCompanyId();
//     console.log("processingIssueDtl from location state:", processingIssueDtl);
//     const { purchaseInwardList } = useSelector((state: RootState) => state.purchaseInward as any);


//     const isSavingRef = useRef(false);
//     const hasGeneratedNumberRef = useRef(false);

//     // Generate document number for new beam inward entries
//     useEffect(() => {
//         const generateDocumentNumber = async () => {
//             if (processingIssueDtl || hasGeneratedNumberRef.current) {
//                 return;
//             }

//             try {
//                 const result = await documentNumberService.generateDocumentNumber({
//                     screenName: 'Processing Issue Management',
//                     tabName: 'processIssueYarn',
//                 });
//                 setValue('fabricDispatchId', result.documentNumber, { shouldValidate: true });

//                 hasGeneratedNumberRef.current = true;
//             } catch (error) {
//                 console.error('Failed to generate process contract number:', error);
//                 toast.error('Failed to generate process contract number');
//             }
//         };

//         generateDocumentNumber();
//         // Cleanup: Clear cache if component unmounts without saving
//         return () => {
//             if (!processingIssueDtl?.id && hasGeneratedNumberRef.current && !isSavingRef.current) {
//                 documentNumberService.clearMemoryCache("Processing Issue Management", "processIssueYarn");
//             }
//         };
//     }, [processingIssueDtl, setValue]);

//     // Cleanup document number cache if not saved
//     useEffect(() => {
//         const handleBeforeUnload = (e: BeforeUnloadEvent) => {
//             if (hasGeneratedNumberRef.current && !isSavingRef.current && !processingIssueDtl) {
//                 documentNumberService.clearMemoryCache('Processing Issue Management', 'processIssueYarn');
//             }
//         };

//         window.addEventListener('beforeunload', handleBeforeUnload);
//         return () => {
//             window.removeEventListener('beforeunload', handleBeforeUnload);
//             if (hasGeneratedNumberRef.current && !isSavingRef.current && !processingIssueDtl) {
//                 documentNumberService.clearMemoryCache('Processing Issue Management', 'processIssueYarn');
//             }
//         };
//     }, [processingIssueDtl]);

//     useEffect(() => {
//         setValue('fabricDispatchId', processingIssueDtl?.fabricDispatchId || '');
//     }, [processingIssueDtl, setValue]);


//     const colours = useMemo(() => {
//         if (Array.isArray(subCategoryByCategoryList) && subCategoryByCategoryList.length > 0) {
//             return subCategoryByCategoryList;
//         }
//         const list = Array.isArray(subCategories)
//             ? subCategories
//             : Array.isArray((subCategories as any)?.data)
//                 ? (subCategories as any).data
//                 : [];
//         return list.filter((sc: any) => (sc?.categoryName || "").toLowerCase() === "colour");
//     }, [subCategoryByCategoryList, subCategories]);

//     const inwardIndex = useMemo(() => {
//         const map = new Map<string, { millId?: number | string; warehouseId?: number | string }>();
//         const list = Array.isArray(purchaseInwardList?.data) ? purchaseInwardList.data : purchaseInwardList;
//         (list || []).forEach((pi: any) => {
//             (pi.purchaseInwardItemsDtl || []).forEach((item: any) => {
//                 const millId = item.millNameId;
//                 (item.lotEntries || []).forEach((le: any) => {
//                     const key = `${le.id}|${le.yarnId}`;
//                     map.set(key, { millId, warehouseId: le.warehouseId });
//                 });
//             });
//         });
//         return map;
//     }, [purchaseInwardList]);

//     useEffect(() => {
//         dispatch(getAllPurchaseInwards({} as any));
//     }, [dispatch]);


//     // Update your validateForm function to return validity state
//     const validateForm = () => {
//         const formValues = {
//             date: watch("fabricDispatchDate"),
//             vendor: watch("vendorId"),
//             workOrder: watch("dyeingWorkOrderId"),
//             lotNumber: watch("lotNumber"),
//             quantity: watch("orderQuantity")
//         };

//         const isValid = Object.values(formValues).every(val => Boolean(val));

//         setIsFormValid(isValid);
//         return isValid;
//     };

//     // Add this useEffect to validate form on changes
//     useEffect(() => {
//         const subscription = watch(() => validateForm());
//         return () => subscription.unsubscribe();
//     }, [watch]);


//     // Set default dispatch date to today for new records
//     useEffect(() => {
//         if (!processingIssueDtl) {
//             const today = new Date().toISOString().split('T')[0];
//             setValue("fabricDispatchDate", today);
//         }
//     }, [setValue]);

//     useEffect(() => {
//         if (processingIssueDtl) {
//             reset({
//                 id: processingIssueDtl.id,
//                 fabricDispatchDate: processingIssueDtl.fabricDispatchDate ? processingIssueDtl.fabricDispatchDate.slice(0, 10) : '',
//                 vendorId: String(processingIssueDtl.vendorId),
//                 dyeingWorkOrderId: String(processingIssueDtl.dyeingWorkOrderId),
//                 lotNumber: String(processingIssueDtl.lotNumber ?? processingIssueDtl.lotNo ?? ''),
//                 orderQuantity: processingIssueDtl.orderQuantity,
//                 dispatchedQuantity: processingIssueDtl.dispatchedQuantity,
//                 receivedQuantity: processingIssueDtl.receivedQuantity,
//                 balanceQuantity: processingIssueDtl.balanceQuantity,
//                 costPerPound: processingIssueDtl.costPerPound,
//                 totalAmount: processingIssueDtl.totalAmount,
//                 colorId: String(processingIssueDtl.colorId),
//                 pantone: processingIssueDtl.pantone,
//                 finishingId: String(processingIssueDtl.finishingId),
//                 salesOrderId: String(processingIssueDtl.salesOrderId),
//                 shipmentModeId: String(processingIssueDtl.shipmentModeId),
//                 lotId: processingIssueDtl.lotId ? String(processingIssueDtl.lotId) : null,
//                 remarks: processingIssueDtl.remarks || processingIssueDtl.remark || '',
//                 transportId: processingIssueDtl.transportId ? String(processingIssueDtl.transportId) : '',
//                 transportName: processingIssueDtl.transportName || '',
//                 vehicleNo: processingIssueDtl.vehicleNo || '',
//                 grossWt: processingIssueDtl.grossWt || '',
//                 activeFlag: processingIssueDtl.activeFlag,
//                 fabricDispatchId: processingIssueDtl.fabricDispatchId
//             });

//             const receivedQtyFromFinish = (finishFabricReceiveList || [])
//                 .filter((receive: any) =>
//                     Number(receive.dyeingWorkOrderId) === Number(processingIssueDtl.dyeingWorkOrderId) &&
//                     receive.processType === "YARN"
//                 )
//                 .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

//             setValue("receivedQuantity" as any, String(receivedQtyFromFinish) as any);

//             let finishedCode = String(processingIssueDtl.finishedFabricCode || "");
//             let finishedName = processingIssueDtl.finishedFabricName || "";
//             let greigeCode = String(processingIssueDtl.greigeFabricCode || "");
//             let greigeName = processingIssueDtl.greigeFabricName || "";

//             const order = Array.isArray(processContractList) ? processContractList.find((o: any) => Number(o.id) === Number(processingIssueDtl.dyeingWorkOrderId)) : null;
//             const yarnItems = Array.isArray(order?.yarnItems) ? order.yarnItems : [];
//             const matchedYarnItem = yarnItems.find((y: any) => {
//                 if (processingIssueDtl.finishedFabricCode) {
//                     return String(y.finishedYarnCodeId ?? "") === String(processingIssueDtl.finishedFabricCode);
//                 }
//                 if (processingIssueDtl.finishedFabricName) {
//                     return String(y.finishedYarnName ?? "") === String(processingIssueDtl.finishedFabricName);
//                 }
//                 return false;
//             }) || (yarnItems.length > 0 ? yarnItems[0] : null);
//             setFinishedYarnOptions(yarnItems);
//              if (order) {

//                 setSelectedDyeingWorkOrder(order);

//                 setYarnRequirementDetails(yarnItems.map((yi: any) => ({

//                     actualYarnId: yi.greigeYarnCodeId || yi.finishedYarnCodeId,

//                     yarnName: yi.greigeYarnName || yi.finishedYarnName,

//                     yarnCount: "",

//                     gramsPerMeter: "",

//                     totalwarpReq: yi.quantity || "0",

//                     totalWarpIssued: "0",

//                     balanceWarpToIssue: yi.quantity || "0",

//                     activeFlag: true

//                 })));

//             }
//             setSelectedYarnItemId("");
//             // setSelectedYarnItemId(matchedYarnItem ? getFinishedYarnIdentifier(matchedYarnItem) : "");
//             // if (matchedYarnItem) {
//             //     finishedCode = String(matchedYarnItem.finishedYarnCodeId ?? finishedCode);
//             //     finishedName = matchedYarnItem.finishedYarnName ?? finishedName;
//             //     greigeCode = String(matchedYarnItem.greigeYarnCodeId ?? greigeCode);
//             //     greigeName = matchedYarnItem.greigeYarnName ?? greigeName;
//             // }
// setDispatchDetails({

//                 finishedFabricCode: "",

//                 finishedFabricName: "",

//                 greigeFabricCode: "",

//                 greigeFabricName: "",

//                 orderQuantity: "",

//                 dispatchedQuantity: "0",

//                 receivedQuantity: "", // Keep empty initially as requested

//                 balanceQuantity: ""

//             });
//             // setDispatchDetails({
//             //     finishedFabricCode: finishedCode,
//             //     finishedFabricName: finishedName,
//             //     greigeFabricCode: greigeCode,
//             //     greigeFabricName: greigeName,
//             //     orderQuantity: String(processingIssueDtl.orderQuantity || ""),
//             //     dispatchedQuantity: String(processingIssueDtl.dispatchedQuantity || "0"),
//             //     receivedQuantity: String(receivedQtyFromFinish),
//             //     balanceQuantity: String(processingIssueDtl.balanceQuantity || "")
//             // });

//             if (processingIssueDtl.yarnIssues && Array.isArray(processingIssueDtl.yarnIssues) && processingIssueDtl.yarnIssues.length > 0) {
//                 const baseSelected = processingIssueDtl.yarnIssues.map((yi: any) => {
//                     const warehouseId = yi.warehouseId ?? null;
//                     const warehouseName = warehouseId ? (warehouseList.find((w: any) => String(w.id) === String(warehouseId))?.warehouseName || '') : '';
//                     const conesPerBag = yi.conesPerBag != null ? Number(yi.conesPerBag) : 0;
//                     const conesWeight = yi.conesWeight != null
//                         ? Number(yi.conesWeight)
//                         : (conesPerBag > 0 && Number(yi.kgsPerBag) > 0 ? Number((Number(yi.kgsPerBag) / conesPerBag).toFixed(3)) : 0);
//                     const millIdValue = yi.millId ?? null;
//                     const millNameValue = millIdValue != null
//                         ? (millNameById.get(String(millIdValue)) || yi.millName || '')
//                         : (yi.millName || '');
//                     return {
//                         id: String(yi.lotId ?? yi.id),
//                         yarnName: yi.yarnName ?? '',
//                         availableBags: yi.availableBags != null ? Number(yi.availableBags) : 0,
//                         kgsPerBag: yi.kgsPerBag != null ? Number(yi.kgsPerBag) : 0,
//                         conesPerBag,
//                         conesWeight,
//                         availableQty: yi.availableReqQty != null ? Number(yi.availableReqQty) : 0,
//                         lotNumber: yi.lotNumber ?? '',
//                         issueQty: yi.issueQty != null ? Number(yi.issueQty) : null,
//                         noOfBags: yi.noOfBags != null ? Number(yi.noOfBags) : 0,
//                         millId: millIdValue,
//                         millName: millNameValue,
//                         warehouseId,
//                         warehouseName,
//                         inwardId: yi.inwardId ?? null,
//                         orderItemId: yi.orderItemId ?? null,
//                         itemId: yi.itemId ?? null,
//                         activeFlag: yi.activeFlag !== false,
//                         finishedYarnId: yi.finishedYarnId || processingIssueDtl.finishedFabricCode || "",
//                         finishedYarnName: yi.finishedYarnName || processingIssueDtl.finishedFabricName || ""
//                     };
//                 });

//                 // If lotNumber is missing or looks like a numeric ID, resolve it by fetching lot entries
//                 const needsResolve = baseSelected.some((l: any) => !l.lotNumber || /^\d+$/.test(String(l.lotNumber)));
//                 if (needsResolve) {
//                     (async () => {
//                         try {
//                             const list = Array.isArray(purchaseInwardList?.data) ? purchaseInwardList.data : purchaseInwardList;
//                             const lots = (list || []).flatMap((pi: any) =>
//                                 (pi.purchaseInwardItemsDtl || []).flatMap((item: any) => item.lotEntries || [])
//                             );
//                             const idToLotNo = new Map(lots.map((lot: any) => [String(lot.id), lot.lotNumber]));
//                             const enriched = baseSelected.map((l: any) => ({
//                                 ...l,
//                                 lotNumber: l.lotNumber || idToLotNo.get(String(l.id)) || ''
//                             }));
//                             setSelectedLot(enhanceLotsWithFinishedYarn(enriched));
//                         } catch (e) {
//                             setSelectedLot(enhanceLotsWithFinishedYarn(baseSelected));
//                         }
//                     })();
//                 } else {
//                     setSelectedLot(enhanceLotsWithFinishedYarn(baseSelected));
//                 }
//             }
//         } else {
//             setFinishedYarnOptions([]);
//             setSelectedYarnItemId("");
//         }
//     }, [processingIssueDtl, reset, finishFabricReceiveList, setValue, processContractList, millNameById, warehouseList]);

//     useEffect(() => {
//         if (showLotDialog && (yarnIssueDetails || []).length > 0) {
//             setLotMeta((prev) => {
//                 const next = { ...prev };
//                 (yarnIssueDetails as any[]).forEach((lot: any) => {
//                     const key = `${lot.baseLotId || lot.id}|${lot.lotYarnId || lot.yarnId || ''}`;
//                     const pref = inwardIndex.get(key);
//                     if (pref && !next[String(lot.id)]) {
//                         next[String(lot.id)] = {
//                             millId: String(pref.millId ?? ''),
//                             warehouseId: String(pref.warehouseId ?? '')

//                         };
//                     }
//                 });
//                 return next;
//             });
//         }
//     }, [showLotDialog, yarnIssueDetails, inwardIndex]);


//     useEffect(() => {
//         dispatch(getAllPurchaseOrders({}));
//         const salesOrderParams = companyId ? { companyId } : {};
//         dispatch(getAllSalesOrders(salesOrderParams));
//         dispatch(getAllPoTypes({ fetchAll: true }));
//         dispatch(getAllVendors({ fetchAll: true }));
//         dispatch(getAllProductCategory({ fetchAll: true }));
//         dispatch(getAllTermsConditions({ fetchAll: true }));
//         dispatch(getAllWeavingContract({ fetchAll: true }));
//         dispatch(getAllDyeingWorkOrdersByType({ type: "YARN", offset: 0, limit: 500 }));
//         dispatch(getAllSubCategories({ fetchAll: true }));
//         dispatch(getAllShipmentModes({ fetchAll: true }));
//         dispatch(getAllFinishFabricReceivesByType("YARN"));
//         dispatch(getAllYarnDispatch({ processType: "YARN" }));
//         dispatch(getAllTransports({ fetchAll: true }));
//         dispatch(getAllWarehouse({ fetchAll: true }));
//         dispatch(getAllYarnMasters({ fetchAll: true }));
//     }, [dispatch, companyId]);

//     // Filter processing contracts to show only YARN type
//     const yarnProcessContracts = useMemo(() => {
//         return (processContractList || []).filter((contract: any) => contract.processType === "YARN");
//     }, [processContractList]);

//     // const validateForm = () => {
//     //     const errors = {
//     //         yarnDispatchDate: !watch("yarnDispatchDate"),
//     //         vendorId: !watch("vendorId"),
//     //         dyeingWorkOrderId: !watch("dyeingWorkOrderId"),
//     //         orderQuantity: !watch("orderQuantity") || isNaN(Number(watch("orderQuantity"))),
//     //         // Add validation for other required fields
//     //     };

//     //     setFormErrors(errors);
//     //     return !Object.values(errors).some(error => error);
//     // };


//     const addItem = () => {
//         if (editingIndex !== null) {
//             const updatedItems = [...weavingContractItemDtl];
//             updatedItems[editingIndex] = newItem;
//             setweavingContractItemDtl(updatedItems);
//             setEditingIndex(null);
//         } else {
//             setweavingContractItemDtl([...weavingContractItemDtl, newItem]);
//         }
//         setNewItem({
//             productCategoryId: '',
//             quantity: '',
//             unit: '',
//             price: '',
//             netAmount: '',
//             deliveryDate: '',
//             remark: '',
//             activeFlag: true,
//         });
//     };

//     const editItem = (index: number) => {
//         setNewItem(weavingContractItemDtl[index]);
//         setEditingIndex(index);
//     };

//     const deleteItem = (index: number) => {
//         setweavingContractItemDtl(weavingContractItemDtl.filter((_: any, i: number) => i !== index));
//     };

//     const onSubmit = async (data: YarnDispatchDyeingFormData) => {
//         const isEditMode = Boolean(processingIssueDtl?.id);
//         let fabricDispatchId = data.fabricDispatchId || processingIssueDtl?.fabricDispatchId || "";
//         if (!processingIssueDtl?.id && !fabricDispatchId) {
//             try {
//                 const docResponse = await documentNumberService.generateDocumentNumber({
//                     screenName: "Processing Issue Management",
//                     tabName: "processIssueYarn",
//                 });
//                 fabricDispatchId = docResponse.documentNumber;
//             } catch (error) {
//                 console.warn("Failed to generate document number:", error);
//             }
//         }
//         isSavingRef.current = true;

//         console.log("Form data:", data);

//         if (!validateForm()) {
//             alert("Please fill all required fields correctly");
//             return;
//         }


//         const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');

//         if (!storedCompanyId) {

//             alert("Company not selected. Please select a company.");

//             return;

//         }

//         // Calculate total issue quantity from selected lots
//         const totalIssueQty = selectedLot.reduce((sum: number, lot: any) => {
//             return sum + (lot.issueQty ? Number(lot.issueQty) : 0);
//         }, 0);

//         const receivedQtyFromFinishForSubmit = (finishFabricReceiveList || [])
//             .filter((receive: any) =>
//                 Number(receive.dyeingWorkOrderId) === Number(data.dyeingWorkOrderId) &&
//                 receive.processType === "YARN"
//             )
//             .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

//         const parsedOrderQty = Number(data.orderQuantity || dispatchDetails.orderQuantity || 0);
//         const normalizedOrderQty = Number.isNaN(parsedOrderQty) || parsedOrderQty === 0 ? null : parsedOrderQty;
//         const balanceQty = normalizedOrderQty != null ? normalizedOrderQty - totalIssueQty : null;

//         const payload = {
//             fabricDispatchDate: data.fabricDispatchDate,
//             vendorId: Number(data.vendorId),
//             dyeingWorkOrderId: Number(data.dyeingWorkOrderId),
//             lotNumber: data.lotNumber?.trim() || '',
//             orderQuantity: normalizedOrderQty,
//             dispatchedQuantity: null,
//             receivedQuantity: null,
//             balanceQuantity: balanceQty,
//             costPerPound: Number(data.costPerPound),
//             totalAmount: Number(data.totalAmount),
//             colorId: data.colorId ? Number(data.colorId) : null,
//             pantone: data.pantone,
//             finishingId: data.finishingId ? Number(data.finishingId) : null,
//             salesOrderId: data.salesOrderId ? Number(data.salesOrderId) : null,
//             shipmentModeId: data.shipmentModeId ? Number(data.shipmentModeId) : null,
//             lotId: data.lotId ? Number(data.lotId) : 0,
//             remarks: data.remarks,
//             transportId: data.transportId ? Number(data.transportId) : null,
//             transportName: data.transportName,
//             vehicleNo: data.vehicleNo,
//             grossWt: Number(data.grossWt),
//             activeFlag: data.activeFlag,
//             processType: "YARN",
//             finishedFabricCode: dispatchDetails.finishedFabricCode || "",
//             finishedFabricName: dispatchDetails.finishedFabricName || "",
//             greigeFabricCode: dispatchDetails.greigeFabricCode || "",
//             greigeFabricName: dispatchDetails.greigeFabricName || "",
//             fabricDispatchId: fabricDispatchId,
//             companyId: parseInt(storedCompanyId),
//             yarnIssues: selectedLot.map((lot: any) => ({
//                 yarnName: lot.yarnName || `Yarn ${lot.id}`,
//                 lotId: lot.id,
//                 lotNumber: lot.lotNumber,
//                 availableReqQty: Number(lot.availableQty),
//                 availableBags: lot.availableBags != null ? Number(lot.availableBags) : null,
//                 noOfBags: Number(lot.noOfBags ?? 0),
//                 kgsPerBag: lot.kgsPerBag != null ? Number(lot.kgsPerBag) : null,
//                 conesPerBag: lot.conesPerBag != null ? Number(lot.conesPerBag) : null,
//                 conesWeight: lot.conesWeight != null ? Number(lot.conesWeight) : null,
//                 issueQty: Number(lot.issueQty) || 0,
//                 millId: lot.millId ? Number(lot.millId) : null,
//                 warehouseId: lot.warehouseId ? Number(lot.warehouseId) : null,
//                 inwardId: lot.inwardId ?? null,
//                 orderItemId: lot.orderItemId ?? null,
//                 itemId: lot.itemId ?? null,
//                 activeFlag: lot.activeFlag !== false,
//                 finishedYarnId: lot.finishedYarnId || null,
//                 finishedYarnName: lot.finishedYarnName || null
//             }))
//         };

//         console.log("Submitting yarn dispatch payload:", payload);

//         try {
//             // alert(JSON.stringify(payload));
//             setIsSubmitting(true);
//             if (processingIssueDtl?.id) {
//                 await dispatch(updateYarnDispatch({ id: processingIssueDtl.id, data: payload, processType: "YARN" })).unwrap();
//             } else {
//                 // await dispatch(createYarnDispatch(payload)).unwrap();
//                 await dispatch(createYarnDispatch(payload)).unwrap();
//                 documentNumberService.clearMemoryCache("Processing Issue Management", "processIssueYarn");
//             }
//             navigate("/transaction/processing-issue-management", { state: { activeTab: "processIssueYarn" } });
//         } catch (err: any) {
//             console.error("Failed to save/update Yarn Dispatch:", err);
//             console.error("Error details:", err.payload || err.message);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const resetForm = () => {
//         reset();
//         setValue("lotNumber", "");
//         setValue("remarks", "");
//         setValue("transportId", "");
//         setValue("transportName", "");
//         setValue("vehicleNo", "");
//         setValue("grossWt", "");
//         setSelectedLot([]);
//         setSelectedDyeingWorkOrder(null);
//         setFinishedYarnOptions([]);
//         setSelectedYarnItemId("");
//         setDispatchDetails({
//             finishedFabricCode: "",
//             finishedFabricName: "",
//             greigeFabricCode: "",
//             greigeFabricName: "",
//             orderQuantity: "",
//             dispatchedQuantity: "",
//             receivedQuantity: "",
//             balanceQuantity: ""
//         });
//     };

//     const handleJobWorkChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//         const id = parseInt(e.target.value);
//         setSelectedJobWork([]);
//         setYarnRequirementDetails([]); // Clear previous details

//         if (id) {
//             try {
//                 const result = await dispatch(getWeavingContractById(id));
//                 console.log(result)
//                 const yarnRequired = result?.payload;

//                 if (yarnRequired?.yarnRequirements) {
//                     // Map the yarn requirements to the format needed for display
//                     const requirements = yarnRequired.yarnRequirements.map((yarn: any) => ({
//                         yarnType: yarn.yarnType,
//                         yarnCount: yarn.yarnCount,
//                         gramsPerMeter: yarn.gramsPerMeter,
//                         totalwarpReq: yarn.totalRequiredQty,
//                         totalWarpIssued: yarn.totalIssuedQty || 0, // Default to 0 if not provided
//                         balanceWarpToIssue: yarn.totalRequiredQty - (yarn.totalIssuedQty || 0)
//                     }));

//                     setYarnRequirementDetails(requirements);
//                     setSelectedJobWork(yarnRequired); // Store the entire job work data if needed
//                 }
//             } catch (error) {
//                 console.error("Error fetching weaving contract by ID:", error);
//             }
//         }
//     };
//     const handleDyeingWorkOrderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//         const id = parseInt(e.target.value);
//         if (id) {
//             try {
//                 const selectedOrder = processContractList.find((order: any) => order.id === id);
//                 setSelectedDyeingWorkOrder(selectedOrder);

//                 console.log("Selected Order:", selectedOrder);
//                 console.log("Process Type:", selectedOrder?.processType);
//                 console.log("Yarn Items:", selectedOrder?.yarnItems);
//                 console.log("Fabric Items:", selectedOrder?.fabricItems);

//                 const yarnItems = Array.isArray(selectedOrder?.yarnItems) ? selectedOrder.yarnItems : [];
//                 setFinishedYarnOptions(yarnItems);

//                 let item = null;
//                 const processType = "YARN";

//                 if (selectedOrder?.processType === "YARN" && yarnItems.length > 0) {
//                     item = yarnItems[0];
//                     setYarnRequirementDetails(yarnItems.map((yi: any) => ({
//                         actualYarnId: yi.greigeYarnCodeId || yi.finishedYarnCodeId,
//                         yarnName: yi.greigeYarnName || yi.finishedYarnName,
//                         yarnCount: "",
//                         gramsPerMeter: "",
//                         totalwarpReq: yi.quantity || "0",
//                         totalWarpIssued: "0",
//                         balanceWarpToIssue: yi.quantity || "0",
//                         activeFlag: true
//                     })));
//                 } else if (selectedOrder?.processType === "FABRIC" && selectedOrder?.fabricItems && selectedOrder.fabricItems.length > 0) {
//                     console.warn("Selected contract is for FABRIC process, but this is YARN dispatch");
//                     setYarnRequirementDetails([]);
//                 } else {
//                     setYarnRequirementDetails([]);
//                 }

//                 setSelectedYarnItemId(item ? getFinishedYarnIdentifier(item) : "");

//                 // if (item) {
//                 //     const receivedQty = (finishFabricReceiveList || [])
//                 //         .filter((receive: any) =>
//                 //             receive.dyeingWorkOrderId === id &&
//                 //             receive.processType === "YARN"
//                 //         )
//                 //         .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

//                 //     setDispatchDetails({
//                 //         finishedFabricCode: item.finishedYarnCodeId || "",
//                 //         finishedFabricName: item.finishedYarnName || "",
//                 //         greigeFabricCode: item.greigeYarnCodeId || "",
//                 //         greigeFabricName: item.greigeYarnName || "",
//                 //         orderQuantity: item.quantity || "",
//                 //         dispatchedQuantity: "0",
//                 //         receivedQuantity: receivedQty.toString(),
//                 //         balanceQuantity: item.quantity || ""
//                 //     });

//                 //     if (selectedOrder?.vendorId != null) setValue("vendorId", String(selectedOrder.vendorId));
//                 //     if (item.quantity != null) setValue("orderQuantity", String(item.quantity));
//                 //     if (item.colorId != null) setValue("colorId", String(item.colorId));
//                 //     if (item.pantone != null) setValue("pantone", String(item.pantone));
//                 //     if (selectedOrder?.remarks != null) setValue("remarks", String(selectedOrder.remarks));
//                 //     else if (selectedOrder?.remark != null) setValue("remarks", String(selectedOrder.remark));

//                 //     setValue("processType", processType);
//                 //     setValue("lotNumber", "");

//                 //     if (selectedOrder?.salesOrderNo != null && Array.isArray(salesOrderList)) {
//                 //         const so = salesOrderList.find((s: any) => String(s.salesOrderNo) === String(selectedOrder.salesOrderNo));
//                 //         if (so?.id != null) setValue("salesOrderId", String(so.id));
//                 //     }

//                 //     const receivedQtyFromFinish = (finishFabricReceiveList || [])
//                 //         .filter((receive: any) =>
//                 //             receive.dyeingWorkOrderId === id &&
//                 //             receive.processType === "YARN"
//                 //         )
//                 //         .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

//                 //     setValue("dispatchedQuantity", "0");
//                 //     setValue("receivedQuantity", receivedQtyFromFinish.toString());
//                 //     if (item.quantity != null) setValue("balanceQuantity", String(item.quantity));
//                 // } 
//                 if (item) {
//                     const finishedCode = getFinishedYarnIdentifier(item);
//                     const receivedQty = (finishFabricReceiveList || [])
//                         .filter((receive: any) =>
//                             Number(receive.dyeingWorkOrderId) === id &&
//                             receive.processType === "YARN" &&
//                             getFinishedYarnIdentifier(receive) === finishedCode
//                         )
//                         .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

//                     let dispatchedQty = 0;
//                     try {
//                         const dispatchResponse = await apiService.get('/fabric-dispatch?offset=0&limit=100');
//                         const allDispatches = Array.isArray(dispatchResponse) ? dispatchResponse : dispatchResponse.data || [];

//                         dispatchedQty = allDispatches
//                             .filter((dispatch: any) =>
//                                 Number(dispatch.dyeingWorkOrderId) === id &&
//                                 dispatch.processType === "YARN" &&
//                                 (!processingIssueDtl?.id || dispatch.id !== processingIssueDtl.id)
//                             )
//                             .reduce((total: number, dispatchItem: any) => {
//                                 const issueQtySum = (dispatchItem.yarnIssues || [])
//                                     .filter((issue: any) => {
//                                         const issueIdentifier = getFinishedYarnIdentifier(issue);
//                                         return issueIdentifier === finishedCode || 
//                                                (!issue.finishedYarnId && !issue.finishedYarnCodeId && !issue.greigeYarnCodeId && !issue.yarnId && String(dispatchItem.finishedFabricCode || "") === finishedCode);
//                                     })
//                                     .reduce((sum: number, issue: any) => sum + (Number(issue.issueQty) || 0), 0);
//                                 return total + issueQtySum;
//                             }, 0);

//                         console.log("All dispatches:", allDispatches);
//                         console.log("Filtered dispatches for id:", id, allDispatches.filter((dispatch: any) => Number(dispatch.dyeingWorkOrderId) === id && dispatch.processType === "YARN"));
//                         console.log("Calculated dispatchedQty:", dispatchedQty);
//                     } catch (error) {
//                         console.error("Failed to fetch dispatch data:", error);
//                         dispatchedQty = 0;
//                     }

//                     setDispatchDetails({
//                         finishedFabricCode: item.finishedCode || "",
//                         finishedFabricName: item.finishedYarnName || "",
//                         greigeFabricCode: item.greigeYarnCodeId || "",
//                         greigeFabricName: item.greigeYarnName || "",
//                         orderQuantity: item.quantity || "",
//                         dispatchedQuantity: dispatchedQty.toString(),
//                         receivedQuantity: receivedQty.toString(),
//                         balanceQuantity: item.quantity || ""
//                     });

//                     if (selectedOrder?.vendorId != null) setValue("vendorId", String(selectedOrder.vendorId));
//                     if (item.quantity != null) setValue("orderQuantity", String(item.quantity));
//                     if (item.colorId != null) setValue("colorId", String(item.colorId));
//                     if (item.pantone != null) setValue("pantone", String(item.pantone));
//                     if (selectedOrder?.remarks != null) setValue("remarks", String(selectedOrder.remarks));

//                     setValue("processType", processType);

//                     if (selectedOrder?.salesOrderNo != null && Array.isArray(salesOrderList)) {
//                         const so = salesOrderList.find((s: any) => String(s.salesOrderNo) === String(selectedOrder.salesOrderNo));
//                         if (so?.id != null) setValue("salesOrderId", String(so.id));
//                     }

//                     const receivedQtyFromFinish = (finishFabricReceiveList || [])
//                         .filter((receive: any) =>
//                             Number(receive.dyeingWorkOrderId) === id &&
//                             receive.processType === "YARN" &&
//                             getFinishedYarnIdentifier(receive) === finishedCode
//                         )
//                         .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

//                     setValue("dispatchedQuantity", dispatchedQty.toString());
//                     setValue("receivedQuantity", receivedQtyFromFinish.toString());
//                     if (item.quantity != null) setValue("balanceQuantity", String(item.quantity));
//                 }
//                 else {
//                     console.warn("No valid yarn items found in selected contract");
//                     setFinishedYarnOptions([]);
//                     setSelectedYarnItemId("");
//                     setDispatchDetails({
//                         finishedFabricCode: "",
//                         finishedFabricName: "",
//                         greigeFabricCode: "",
//                         greigeFabricName: "",
//                         orderQuantity: "",
//                         dispatchedQuantity: "",
//                         receivedQuantity: "",
//                         balanceQuantity: ""
//                     });
//                     setValue("vendorId", "");
//                     setValue("orderQuantity", "");
//                     setValue("colorId", "");
//                     setValue("pantone", "");
//                     setValue("lotNumber", "");
//                     setValue("processType", "YARN");
//                 }
//             } catch (error) {
//                 console.error("Error fetching Processing Contract details:", error);
//                 setFinishedYarnOptions([]);
//                 setSelectedYarnItemId("");
//             }
//         } else {
//             setSelectedDyeingWorkOrder(null);
//             setYarnRequirementDetails([]);
//             setDispatchDetails({
//                 // finishedCode: "",
//                 // greigeCode: "",
//                 finishedFabricCode: "",
//                 finishedFabricName: "",
//                 greigeFabricCode: "",
//                 greigeFabricName: "",
//                 orderQuantity: "",
//                 dispatchedQuantity: "",
//                 receivedQuantity: "",
//                 balanceQuantity: ""
//             });
//             setFinishedYarnOptions([]);
//             setSelectedYarnItemId("");
//             setValue("vendorId", "");
//             setValue("orderQuantity", "");
//             setValue("colorId", "");
//             setValue("pantone", "");
//             setValue("finishingId", "");
//             setValue("salesOrderId", "");
//             setValue("shipmentModeId", "");
//             setValue("remarks", "");
//             setValue("lotNumber", "");
//             setValue("dispatchedQuantity", "");
//             setValue("receivedQuantity", "");
//             setValue("balanceQuantity", "");
//             setValue("processType", "YARN");
//         }
//     };

//     // const applyYarnSelection = (selectedId: string) => {
//     //     setSelectedYarnItemId(selectedId);
//     //     const yarnItem = finishedYarnOptions.find((yi: any) => getFinishedYarnIdentifier(yi) === selectedId);
//     //     if (yarnItem) {
//     //         const orderQty = yarnItem.quantity != null ? String(yarnItem.quantity) : "";
//     //         setDispatchDetails(prev => ({
//     //             ...prev,
//     //             finishedFabricCode: yarnItem.finishedYarnCodeId || "",
//     //             finishedFabricName: yarnItem.finishedYarnName || "",
//     //             greigeFabricCode: yarnItem.greigeYarnCodeId || "",
//     //             greigeFabricName: yarnItem.greigeYarnName || "",
//     //             orderQuantity: orderQty,
//     //             balanceQuantity: orderQty
//     //         }));
//     //         setValue("orderQuantity", orderQty);
//     //         setValue("balanceQuantity", orderQty);
//     //         if (yarnItem.colorId != null) setValue("colorId", String(yarnItem.colorId));
//     //         if (yarnItem.pantone != null) setValue("pantone", String(yarnItem.pantone));
//     //     } else {
//     //         setDispatchDetails(prev => ({
//     //             ...prev,
//     //             finishedFabricCode: "",
//     //             finishedFabricName: "",
//     //             greigeFabricCode: "",
//     //             greigeFabricName: "",
//     //             orderQuantity: "",
//     //             balanceQuantity: ""
//     //         }));
//     //         setValue("orderQuantity", "");
//     //         setValue("balanceQuantity", "");
//     //     }
//     // };
//      const applyYarnSelection = (selectedId: string) => {
//         setSelectedYarnItemId(selectedId);
//         const yarnItem = finishedYarnOptions.find((yi: any) => getFinishedYarnIdentifier(yi) === selectedId);
//         if (yarnItem) {
//             const dyeingWorkOrderId = watch("dyeingWorkOrderId");
//             const finishedCode = selectedId;

//             // Calculate Received Quantity for this specific Finished Yarn item
//             const receivedQtyFromFinish = (finishFabricReceiveList || [])
//                 .filter((receive: any) =>
//                     Number(receive.dyeingWorkOrderId) === Number(dyeingWorkOrderId) &&
//                     receive.processType === "YARN" &&
//                     getFinishedYarnIdentifier(receive) === finishedCode
//                 )
//                 .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

//             // Calculate previously Dispatched Quantity for this specific Finished Yarn item
//             const dispatchedQtyFromPrev = (yarnDispatchDyingList || [])
//                 .filter((dispatch: any) =>
//                     Number(dispatch.dyeingWorkOrderId) === Number(dyeingWorkOrderId) &&
//                     dispatch.processType === "YARN" &&
//                     (!processingIssueDtl?.id || dispatch.id !== processingIssueDtl.id)
//                 )
//                 .reduce((total: number, dispatchItem: any) => {
//                     const issueQtySum = (dispatchItem.yarnIssues || [])
//                         .filter((issue: any) => {
//                             const issueIdentifier = getFinishedYarnIdentifier(issue);
//                             return issueIdentifier === finishedCode || 
//                                    (!issue.finishedYarnId && !issue.finishedYarnCodeId && !issue.greigeYarnCodeId && !issue.yarnId && String(dispatchItem.finishedFabricCode || "") === finishedCode);
//                         })
//                         .reduce((sum: number, issue: any) => sum + (Number(issue.issueQty) || 0), 0);
//                     return total + issueQtySum;
//                 }, 0);

//             const orderQty = yarnItem.quantity != null ? Number(yarnItem.quantity) : 0;
//             const currentFormQty = selectedLot
//                 .filter((lot: any) => getFinishedYarnIdentifier(lot) === finishedCode)
//                 .reduce((sum: number, lot: any) => sum + (Number(lot.issueQty) || 0), 0);

//             const totalCumulativeDispatched = dispatchedQtyFromPrev + currentFormQty;
//             const balanceQty = orderQty - totalCumulativeDispatched;

//             setDispatchDetails(prev => ({
//                 ...prev,
//                 finishedFabricCode: finishedCode,
//                 finishedFabricName: yarnItem.finishedYarnName || "",
//                 greigeFabricCode: yarnItem.greigeYarnCodeId || "",
//                 greigeFabricName: yarnItem.greigeYarnName || "",
//                 orderQuantity: String(orderQty),
//                 dispatchedQuantity: String(totalCumulativeDispatched),
//                 receivedQuantity: String(receivedQtyFromFinish),
//                 balanceQuantity: String(balanceQty)
//             }));

//             setValue("orderQuantity", String(orderQty));
//             setValue("receivedQuantity" as any, String(receivedQtyFromFinish) as any);
//             setValue("dispatchedQuantity" as any, String(totalCumulativeDispatched) as any);
//             setValue("balanceQuantity", String(balanceQty));

//             if (yarnItem.colorId != null) setValue("colorId", String(yarnItem.colorId));
//             if (yarnItem.pantone != null) setValue("pantone", String(yarnItem.pantone));
//         } else {
//             setDispatchDetails(prev => ({
//                 ...prev,
//                 finishedFabricCode: "",
//                 finishedFabricName: "",
//                 greigeFabricCode: "",
//                 greigeFabricName: "",
//                 orderQuantity: "",
//                 dispatchedQuantity: "",
//                 receivedQuantity: "",
//                 balanceQuantity: ""
//             }));
//             setValue("orderQuantity", "");
//             setValue("receivedQuantity" as any, "");
//             setValue("dispatchedQuantity" as any, "");
//             setValue("balanceQuantity", "");
//         }
//     };

//     const handleFinishedYarnSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//         applyYarnSelection(e.target.value);
//     };

//     const handleOrderQuantitySelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//         applyYarnSelection(e.target.value);
//     };

//     const handleLotSelect = (lotDetail: LotDetail) => {
//         const normalizedLot: LotDetail = { ...lotDetail };
//         const normalizedConesPerBag = Number(normalizedLot.conesPerBag ?? 0);
//         const normalizedKgsPerBag = Number(normalizedLot.kgsPerBag ?? 0);
//         const normalizedNoOfBags = normalizedLot.noOfBags != null ? Number(normalizedLot.noOfBags) : 0;
//         if ((normalizedLot.conesWeight == null || Number.isNaN(Number(normalizedLot.conesWeight))) && normalizedConesPerBag > 0 && normalizedKgsPerBag > 0) {
//             normalizedLot.conesWeight = Number((normalizedKgsPerBag / normalizedConesPerBag).toFixed(3));
//         }
//         const derivedIssueQty = normalizedLot.issueQty != null
//             ? Number(normalizedLot.issueQty)
//             : Number((normalizedNoOfBags * normalizedKgsPerBag).toFixed(3));
//         setSelectedLot((prev: LotDetail[]) => {
//             const exists = prev.some(lot => lot.id === normalizedLot.id);
//             if (exists) {
//                 return prev.filter(lot => lot.id !== normalizedLot.id);
//             }
//             return [
//                 ...prev,
//                 {
//                     ...normalizedLot,
//                     conesPerBag: Number.isNaN(normalizedConesPerBag) ? undefined : normalizedConesPerBag,
//                     noOfBags: Number.isNaN(normalizedNoOfBags) ? 0 : normalizedNoOfBags,
//                     issueQty: Number.isNaN(derivedIssueQty) ? 0 : derivedIssueQty
//                 }
//             ];
//         });
//     };

//     const handleNoOfBagsChange = (rowIndex: number, rawValue: string) => {
//         setSelectedLot((prev: LotDetail[]) => {
//             if (rowIndex < 0 || rowIndex >= prev.length) {
//                 return prev;
//             }
//             const next = [...prev];
//             const lot = { ...next[rowIndex] };
//             if (rawValue === '') {
//                 lot.noOfBags = null;
//                 lot.issueQty = null;
//             } else {
//                 const parsed = Number(rawValue);
//                 const safeBags = Number.isNaN(parsed) ? 0 : parsed;
//                 const kgsPerBag = Number(lot.kgsPerBag ?? 0);
//                 lot.noOfBags = safeBags;
//                 lot.issueQty = calculateIssueQty(safeBags, kgsPerBag);
//             }
//             next[rowIndex] = lot;
//             return next;
//         });
//     };


//  const handleYarnIssue = async () => {
//         try {
//             const dyeingWorkOrderId = watch("dyeingWorkOrderId");
//             if (!dyeingWorkOrderId) {
//                 toast.error("Please select a Processing Contract first");
//                 return;
//             }

//             // Determine which item IDs to fetch stock for
//             let itemIds = "";
//             let explicitSelectedYarn: any = null;

//             if (selectedYarnItemId) {
//                 explicitSelectedYarn = finishedYarnOptions.find(opt => getFinishedYarnIdentifier(opt) === selectedYarnItemId);
//                 if (explicitSelectedYarn) {
//                     itemIds = String(explicitSelectedYarn.greigeYarnCodeId || explicitSelectedYarn.finishedYarnCodeId || explicitSelectedYarn.id);
//                 }
//             }

//             if (!itemIds) {
//                 if (yarnRequirementDetails.length > 0) {
//                     itemIds = yarnRequirementDetails
//                         .map((req: any) => req.actualYarnId || req.yarnName)
//                         .filter(Boolean)
//                         .join(',');
//                 } else if (selectedDyeingWorkOrder?.yarnItems?.length > 0) {
//                     itemIds = selectedDyeingWorkOrder.yarnItems
//                         .map((yi: any) => yi.greigeYarnCodeId)
//                         .filter(Boolean)
//                         .join(',');
//                 }
//             }

//             if (!itemIds) {
//                 toast.error("No valid yarn IDs found in requirements");
//                 return;
//             }

//             console.log("Making API call with itemIds:", itemIds);
//             const response = await apiService.get(
//                         buildYarnInwardStockUrl(itemIds)
//                     );

//             // await apiService.get(
//             //     `/sizing-yarn-issues/yarn-inward-stock?itemId=${itemIds}`
//             // );
//             console.log("API Response:", response);

//             const apiData = response || [];
//             if (Array.isArray(apiData) && apiData.length > 0) {
//                 const uniqueLots = new Map();

//                 apiData.forEach((item: any, index: number) => {
//                     const uniqueKey = `${item.orderItemId}_${item.inwardId}_${item.lotNo}_${item.itemId}_${item.warehouseId || 'null'}_${item.millId || 'null'}`;

//                     if (!uniqueLots.has(uniqueKey)) {
//                         const availableQty = Number(item.availableQty) || 0;
//                                 const availableBags = Number(item.availableBags) || 0;
//                                 const kgsPerBag = Number(item.kgsPerBag) || 0;
//                                 const conesPerBag = Number(item.conesPerBag) || 0;
//                                 const conesWeight = item.conesWeight != null ? Number(item.conesWeight) : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);

//                         const warehouseId = item.warehouseId ?? null;
//                         const warehouseName = warehouseId ? warehouseList.find((w: any) => String(w.id) === String(warehouseId))?.warehouseName || '' : '';
//                         const millName = item.millId ? (millOptions.find((m: any) => String(m.id) === String(item.millId))?.subCategoryName || '') : '';

//                         const yarnMaster = yarnList?.find((y: any) => y.id === item.itemId);
//                         const yarnName = yarnMaster?.yarnName || `Yarn-${item.itemId}`;

//                         // Use explicitly selected yarn if it matches the item ID, otherwise find matching yarn
//                         let matchedYarn = null;
//                         if (explicitSelectedYarn && (
//                             String(explicitSelectedYarn.finishedYarnCodeId) === String(item.itemId) ||
//                             String(explicitSelectedYarn.greigeYarnCodeId) === String(item.itemId) ||
//                             String(explicitSelectedYarn.id) === String(item.itemId)
//                         )) {
//                             matchedYarn = explicitSelectedYarn;
//                         } else {
//                             matchedYarn = finishedYarnOptions.find(opt =>
//                                 String(opt.finishedYarnCodeId) === String(item.itemId) ||
//                                 String(opt.greigeYarnCodeId) === String(item.itemId) ||
//                                 String(opt.id) === String(item.itemId)
//                             );
//                         }

//                         uniqueLots.set(uniqueKey, {
//                             id: `${item.orderItemId}_${index}`,
//                             lotId: item.orderItemId,
//                             uniqueKey: uniqueKey,
//                             yarnName: yarnName,
//                             lotNumber: item.lotNo || 'N/A',
//                             availableQty: availableQty,
//                             availableBags,
//                             kgsPerBag,
//                             conesPerBag,
//                             conesWeight,
//                             issueQty: null,
//                              noOfBags: 0,
//                             activeFlag: true,
//                             baseLotId: item.orderItemId,
//                             lotYarnId: item.itemId,
//                             inwardId: item.inwardId,
//                             orderItemId: item.orderItemId,
//                             itemId: item.itemId,
//                             millId: item.millId,
//                             millName: millName,
//                             warehouseId: warehouseId ? String(warehouseId) : '',
//                             warehouseName,
//                             finishedYarnId: matchedYarn ? getFinishedYarnIdentifier(matchedYarn) : "",
//                             finishedYarnName: matchedYarn ? (matchedYarn.finishedYarnName || matchedYarn.greigeYarnName || matchedYarn.yarnName) : ""
//                         });
//                     }
//                 });

//                 const transformedLots = Array.from(uniqueLots.values());
//                 console.log("Transformed lots (deduplicated):", transformedLots);

//                 setYarnIssueDetails(transformedLots);
//                 setShowLotDialog(true);
//             } else {
//                 setYarnIssueDetails([]);
//                 toast.info("No yarn stock available for this processing contract");
//             }
//         } catch (error: any) {
//             console.error("Error fetching yarn inward stock:", error);
//             toast.error(error?.response?.data?.message || "Failed to fetch yarn stock data");
//             setYarnIssueDetails([]);
//         }
//     };


//     return (
//         <div className="p-6 pt-16">
//             <div className="p-6 bg-white shadow-md rounded-lg">
//                 <div className="flex justify-between items-center border-b pb-4">
//                     <div className="flex items-center space-x-4">
//                         <Button
//                             variant="outline"
//                             onClick={() => navigate("/transaction/processing-issue-management", { state: { activeTab: "processIssueYarn" } })}
//                             className="mr-auto"
//                         >
//                             <ArrowLeft size={18} className="mr-2" />
//                             Back
//                         </Button>
//                         <h2 className="text-2xl font-semibold">Yarn Dispatch for Dyeing</h2>
//                     </div>

//                     <Button
//                         disabled={!isFormValid || isSubmitting}
//                         className={`bg-primary hover:bg-primary text-white px-6 flex items-center`}
//                         onClick={handleSubmit(onSubmit)}
//                     >
//                         {isSubmitting ? (
//                             <span className="flex items-center">
//                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                 Processing...
//                             </span>
//                         ) : (
//                             <>
//                                 <Save size={18} className="mr-2" />
//                                 {processingIssueDtl?.id ? "Update Yarn Dispatch" : "Save Yarn Dispatch"}
//                             </>
//                         )}
//                     </Button>
//                 </div>
//                 <div className="space-y-6">
//                     <div className="mb-8">
//                         <div className="border-b border-gray-200">
//                             <nav className="flex -mb-px">
//                                 <button
//                                     onClick={() => setActiveTab('orderDetails')}
//                                     className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'orderDetails'
//                                         ? 'border-red-500 text-red-600'
//                                         : 'border-transparent text-gray-500 hover:text-gray-700 Inward Ordershover:border-gray-300'
//                                         }`}
//                                 >
//                                     <FileText className="w-4 h-4" />
//                                     Details
//                                 </button>
//                             </nav>
//                         </div>
//                     </div>
//                     {/* Order Details Card */}
//                     {activeTab === "orderDetails" && (
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle className="flex items-center gap-2">
//                                 </CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 <div className="grid grid-cols-4 gap-6">
//                                     <div>
//                                         <label className="block text-sm mb-1 font-medium">Yarn Dispatch No</label>
//                                         <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
//                                             {...register('fabricDispatchId')} readOnly />
//                                     </div>
//                                     {/* Date Field */}
//                                     <div>
//                                         <label className="block text-sm font-medium">Dispatch Date <span className="text-red-600">*</span></label>
//                                         <input
//                                             type="date"
//                                             {...register("fabricDispatchDate", { required: "Dispatch date is required" })}
//                                             className={`input mt-1 ${errors.fabricDispatchDate ? 'border-red-500' : ''}`}
//                                             placeholder="Select dispatch date"
//                                         />
//                                         {errors.fabricDispatchDate && (
//                                             <p className="mt-1 text-sm text-red-600">{errors.fabricDispatchDate.message}</p>
//                                         )}
//                                     </div>
//                                     {/* Processing Contract No Field */}
//                                     <div>
//                                         <label className="block text-sm font-medium">Processing Contract No <span className="text-red-600">*</span></label>
//                                         <CommonSearchableSelect
//                                             placeholder="Select Processing Contract No"
//                                             value={watch("dyeingWorkOrderId") || ""}
//                                             options={yarnProcessContracts?.map((dyn: any) => ({
//                                                 value: String(dyn.id),
//                                                 label: dyn.dyeingWorkOrderNo,
//                                                 activeFlag: dyn.activeFlag ?? true,
//                                             }))}
//                                             filterActive
//                                             {...register("dyeingWorkOrderId", { required: "Processing Contract No is required" })}
//                                             onValueChange={(value) => {
//                                                 setValue("dyeingWorkOrderId", value, { shouldValidate: true });
//                                                 // Handle the onChange logic manually since we are using onValueChange
//                                                 const event = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
//                                                 handleDyeingWorkOrderChange(event);
//                                             }}
//                                             error={errors.dyeingWorkOrderId?.message}
//                                         />
//                                     </div>

//                                     {/* Vendor Field */}
//                                     <div>
//                                         <label className="block text-sm font-medium">Vendor <span className="text-red-600">*</span></label>
//                                         <CommonSearchableSelect
//                                             placeholder="Select Vendor"
//                                             value={watch("vendorId") || ""}
//                                             options={processVendors?.map((vendor: any) => ({
//                                                 value: String(vendor.id),
//                                                 label: vendor.vendorName,
//                                                 activeFlag: vendor.activeFlag ?? true,
//                                             }))}
//                                             filterActive
//                                             {...register("vendorId", { required: "Vendor is required" })}
//                                             onValueChange={(value) => setValue("vendorId", value, { shouldValidate: true })}
//                                             error={errors.vendorId?.message}
//                                         />
//                                     </div>



//                                     <div>
//                                         <label className="block text-sm font-medium">
//                                             Select Colour
//                                         </label>
//                                         <CommonSearchableSelect
//                                             placeholder="Select a Colour"
//                                             value={watch("colorId") || ""}
//                                             options={colours?.map((category: any) => ({
//                                                 value: String(category.id),
//                                                 label: category.subCategoryName,
//                                                 activeFlag: category.activeFlag ?? true,
//                                             }))}
//                                             filterActive
//                                             {...register("colorId")}
//                                             onValueChange={(value) => setValue("colorId", value, { shouldValidate: true })}
//                                         />
//                                     </div>
//                                     {/* <div>
//                                         <label className="block text-sm font-medium">Select Color</label>
//                                         <select {...register("colorId")} className="input mt-1">
//                                             <option value="">Select Color</option>
//                                             {colours?.map((sbc: any) => (
//                                                 <option key={sbc.id} value={sbc.id}>{sbc.subCategoryName}</option>
//                                             ))}
//                                         </select>
//                                     </div> */}
//                                     <div>
//                                         <label className="block text-sm font-medium">Pantone</label>
//                                         <input {...register("pantone")} className="input mt-1" />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium">Finishing</label>
//                                         <CommonSearchableSelect
//                                             placeholder="Select a Dyeing Work No"
//                                             value={watch("finishingId") || ""}
//                                             options={processContractList?.map((jwn: any) => ({
//                                                 value: String(jwn.id),
//                                                 label: jwn.dyeingWorkOrderNo,
//                                                 activeFlag: jwn.activeFlag ?? true,
//                                             }))}
//                                             filterActive
//                                             {...register("finishingId")}
//                                             onValueChange={(value) => setValue("finishingId", value, { shouldValidate: true })}
//                                         />
//                                     </div>
//                                     {/* <div>
//                                     <label className="block text-sm font-medium">Sales Order</label>
//                                     <input {...register("salesOrderId", { required: "Sales Order No is required" })} className="input mt-1" />
//                                 </div> */}
//                                     <div>
//                                         <label className="block text-sm font-medium">Sales Order</label>
//                                         <CommonSearchableSelect
//                                             placeholder="Select sales Order"
//                                             value={watch("salesOrderId") || ""}
//                                             options={salesOrderList?.map((sm: any) => ({
//                                                 value: String(sm.id),
//                                                 label: sm.salesOrderNo,
//                                                 activeFlag: sm.activeFlag ?? true,
//                                             }))}
//                                             filterActive
//                                             {...register("salesOrderId")}
//                                             onValueChange={(value) => setValue("salesOrderId", value, { shouldValidate: true })}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium">Ship Via</label>
//                                         <CommonSearchableSelect
//                                             placeholder="Select a Ship Via"
//                                             value={watch("shipmentModeId") || ""}
//                                             options={shipmentModesList.map((sm: any) => ({
//                                                 value: String(sm.id),
//                                                 label: sm.modeName,
//                                                 activeFlag: sm.activeFlag ?? true,
//                                             }))}
//                                             filterActive
//                                             {...register("shipmentModeId")}
//                                             onValueChange={(value) => setValue("shipmentModeId", value, { shouldValidate: true })}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium">Lot Number <span className="text-red-600">*</span></label>
//                                         <input
//                                             type="text"
//                                             {...register("lotNumber", { required: "Lot Number is required" })}
//                                             className={`input mt-1 ${errors.lotNumber ? 'border-red-500' : ''}`}
//                                             placeholder="Enter lot number"
//                                         />
//                                         {errors.lotNumber && (
//                                             <p className="mt-1 text-sm text-red-600">{errors.lotNumber.message}</p>
//                                         )}
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium">Transport Name</label>
//                                         <CommonSearchableSelect
//                                             placeholder="Select Transport"
//                                             value={watch("transportId") || ""}
//                                             options={transportOptions.map((option: any) => ({
//                                                 value: String(option.id),
//                                                 label: option.name,
//                                                 activeFlag: option.activeFlag ?? true,
//                                             }))}
//                                             filterActive
//                                             {...register("transportId")}
//                                             onValueChange={(value) => {
//                                                 setValue("transportId", value, { shouldValidate: true });
//                                                 const transport = transportOptions.find(t => String(t.id) === value);
//                                                 if (transport) {
//                                                     setValue("transportName", transport.name);
//                                                 }
//                                             }}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium">Vehicle No</label>
//                                         <input
//                                             type="text"
//                                             {...register("vehicleNo")}
//                                             className="input mt-1"
//                                             placeholder="Enter vehicle number"
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium">Gross Wt</label>
//                                         <input
//                                             type="number"
//                                             step="0.001"
//                                             {...register("grossWt")}
//                                             className="input mt-1"
//                                             placeholder="Calculated Gross Wt"
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium">Remarks</label>
//                                         <textarea {...register("remarks")} className="input mt-1" placeholder="Enter remarks"></textarea>
//                                     </div>
//                                 </div>
//                                 <input type="hidden" {...register("orderQuantity", {
//                                     min: { value: 0.01, message: "Must be greater than 0" }
//                                 })} />
//                             </CardContent>
//                         </Card>
//                     )}
//                     {/* Order Details Card End */}

//                     {/* {selectedDyeingWorkOrder && ( */}
//                     <>
//                         <Card className="mb-6">
//                             <CardHeader>
//                                 <CardTitle>Dispatch Details</CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 <div className="grid grid-cols-4 gap-6">
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Finished Yarn</label>
//                                         <CommonSearchableSelect
//                                             placeholder="Select Finished Yarn"
//                                             value={selectedYarnItemId}
//                                             options={finishedYarnOptions.map((option: any) => ({
//                                                 value: getFinishedYarnIdentifier(option),
//                                                 label: option.finishedYarnName || option.greigeYarnName || option.yarnName || `Yarn ${option.id}`,
//                                                 activeFlag: option.activeFlag ?? true,
//                                             }))}
//                                             filterActive
//                                             onValueChange={(value) => {
//                                                 const event = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
//                                                 handleFinishedYarnSelectionChange(event);
//                                             }}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Greige Yarn</label>
//                                         <input
//                                             value={dispatchDetails.greigeFabricName}
//                                             className="input mt-1"
//                                             readOnly
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Order Quantity</label>
//                                         <input
//                                             value={dispatchDetails.orderQuantity}
//                                             className="input mt-1"
//                                             readOnly
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Dispatched Quantity</label>
//                                         <input
//                                             value={dispatchDetails.dispatchedQuantity}
//                                             className="input mt-1"
//                                             readOnly
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Received Quantity</label>
//                                         <input
//                                             value={dispatchDetails.receivedQuantity}
//                                             className="input mt-1"
//                                             readOnly
//                                         />
//                                     </div>

//                                     {/* <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Greige Fabric Name</label>
//                                     <input
//                                         value={dispatchDetails.greigeFabricName}
//                                         className="input mt-1"
//                                         readOnly
//                                     />
//                                 </div> */}
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Balance Quantity</label>
//                                         <input
//                                             value={dispatchDetails.balanceQuantity}
//                                             className="input mt-1"
//                                             readOnly
//                                         />
//                                     </div>
//                                 </div>
//                                 <div className="mt-4 text-right">
//                                     <Button
//                                         onClick={handleYarnIssue}
//                                         className="bg-primary hover:bg-primary text-white"
//                                     // disabled={!selectedDyeingWorkOrder}
//                                     >
//                                         <Plus size={18} className="mr-2" />
//                                         Yarn Dispatch
//                                     </Button>
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         <Card>
//                             <CardHeader>
//                                 <CardTitle className="items-center">
//                                     <span>Yarn Issue Details</span>

//                                 </CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 <table className="w-full border-collapse">
//                                     <thead>
//                                         <tr className="bg-gray-100">
//                                             <th className="border p-2">Yarn Name</th>
//                                             <th className="border p-2">Finished Yarn</th>
//                                             <th className="border p-2">Lot No</th>
//                                             <th className="border p-2">Available Bags</th>
//                                             <th className="border p-2">Cones/Bag</th>
//                                             <th className="border p-2">Cones Weight</th>
//                                             <th className="border p-2">Available Qty</th>
//                                             <th className="border p-2">Mill</th>
//                                             <th className="border p-2">Warehouse</th>
//                                             <th className="border p-2">Issuing No of Bags</th>
//                                             <th className="border p-2">Kgs/Bag</th>
//                                             <th className="border p-2">Issue Qty</th>
//                                             <th className="border p-2">Action</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {selectedLot.length > 0 ? (
//                                             selectedLot.map((detail: LotDetail, index: number) => {
//                                                 const millDisplayName = detail.millName || (detail.millId != null ? (millNameById.get(String(detail.millId)) || '') : '') || '-';
//                                                 return (
//                                                     <tr key={`${detail.id}-${detail.inwardId}-${index}`}>
//                                                         <td className="border p-2 text-center">{detail.yarnName}</td>
//                                                         <td className="border p-2">{detail.finishedYarnName || '-'}</td>
//                                                         <td className="border p-2 text-center">{detail.lotNumber}</td>
//                                                         <td className="border p-2 text-center">{detail.availableBags}</td>

//                                                         <td className="border p-2 text-center">{detail.conesPerBag ?? 0}</td>
//                                                         <td className="border p-2 text-center">{Number(detail.conesWeight ?? 0).toFixed(3)}</td>
//                                                         <td className="border p-2 text-center">{detail.availableQty}</td>
//                                                         <td className="border p-2 text-center">{millDisplayName}</td>
//                                                         <td className="border p-2 text-center">{detail.warehouseName || '-'}</td>
//                                                         <td className="border p-2">
//                                                             <Input
//                                                                 type="number"
//                                                                 inputMode="numeric"
//                                                                 value={detail.noOfBags ?? ''}
//                                                                 onChange={(e) => handleNoOfBagsChange(index, e.target.value)}
//                                                                 min={0}
//                                                             />
//                                                         </td>
//                                                         <td className="border p-2 text-center">{Number(detail.kgsPerBag ?? 0).toFixed(3)}</td>

//                                                         <td className="border p-2">
//                                                             <Input
//                                                                 type="number"
//                                                                 value={detail.issueQty ?? ''}
//                                                                 onChange={(e) => {
//                                                                     const value = e.target.value === '' ? null : Number(e.target.value);
//                                                                     const newDetails = [...selectedLot];
//                                                                     newDetails[index] = {
//                                                                         ...newDetails[index],
//                                                                         issueQty: value
//                                                                     };
//                                                                     setSelectedLot(newDetails);
//                                                                 }}
//                                                                 min={0}
//                                                                 max={detail.availableQty}
//                                                             />
//                                                         </td>
//                                                         <td className="border p-2">
//                                                             <div className="flex gap-2">
//                                                                 <Button
//                                                                     variant="outline"
//                                                                     size="sm"
//                                                                     className="text-blue-600 border-blue-600 hover:bg-blue-50"
//                                                                     onClick={() => {
//                                                                         const lot = detail;
//                                                                         // Try to find matching yarn item in options
//                                                                         const matchedYarn = finishedYarnOptions.find(opt =>
//                                                                             String(opt.finishedYarnCodeId) === String(lot.itemId) ||
//                                                                             String(opt.greigeYarnCodeId) === String(lot.itemId) ||
//                                                                             String(opt.id) === String(lot.itemId)
//                                                                         );

//                                                                         if (matchedYarn) {
//                                                                             applyYarnSelection(getFinishedYarnIdentifier(matchedYarn));
//                                                                             toast.info(`Switched to ${matchedYarn.finishedYarnName || matchedYarn.greigeYarnName || 'selected yarn'}`);
//                                                                         } else {
//                                                                             // Fallback: search by name if ID match fails
//                                                                             const matchedByName = finishedYarnOptions.find(opt =>
//                                                                                 opt.finishedYarnName === lot.yarnName ||
//                                                                                 opt.greigeYarnName === lot.yarnName ||
//                                                                                 opt.yarnName === lot.yarnName
//                                                                             );
//                                                                             if (matchedByName) {
//                                                                                 applyYarnSelection(getFinishedYarnIdentifier(matchedByName));
//                                                                                 toast.info(`Switched to ${matchedByName.finishedYarnName || matchedByName.greigeYarnName || 'selected yarn'}`);
//                                                                             } else {
//                                                                                 toast.warn("Could not find matching yarn in contract requirements");
//                                                                             }
//                                                                         }
//                                                                     }}
//                                                                 >
//                                                                     <Edit className="h-4 w-4" />
//                                                                 </Button>
//                                                                 <Button
//                                                                     variant="destructive"
//                                                                     size="sm"
//                                                                     onClick={() => {
//                                                                         setSelectedLot(selectedLot.filter((_, i) => i !== index));
//                                                                     }}
//                                                                 >
//                                                                     <Trash2 className="h-4 w-4" />
//                                                                 </Button>
//                                                             </div>
//                                                         </td>
//                                                         {/* <td className="border p-2">
//                                                             <Button
//                                                                 variant="destructive"
//                                                                 size="sm"
//                                                                 onClick={() => {
//                                                                     setSelectedLot(selectedLot.filter((_, i) => i !== index));
//                                                                 }}
//                                                             >
//                                                                 <Trash2 className="h-4 w-4" />
//                                                             </Button>
//                                                         </td> */}
//                                                     </tr>
//                                                 );
//                                             })
//                                         ) : (
//                                             <tr>
//                                                 <td colSpan={12} className="border p-2 text-center text-gray-500">
//                                                     No lots selected. Click "Add Lot" to select yarn lots.
//                                                 </td>
//                                             </tr>
//                                         )}
//                                     </tbody>
//                                 </table>
//                             </CardContent>
//                             <div className="p-6 flex justify-end">
//                                 {/* <Button
//                                     variant="default"
//                                     className="bg-primary hover:bg-primary text-white"
//                                     onClick={() => {
//                                         // Validate each selected lot: issueQty must be <= availableQty and >= 0
//                                         const invalid = selectedLot.find((l: any) => Number(l.issueQty ?? NaN) > Number(l.availableQty) || Number(l.issueQty ?? -1) < 0);
//                                         if (invalid) {
//                                             toast.error(`Issue Qty cannot exceed Available Qty for Lot ${invalid.lotNumber || invalid.id}.`);
//                                             // alert(`Issue Qty cannot exceed Available Qty for Lot ${invalid.lotNumber || invalid.id}.`);
//                                             return;
//                                         }

//                                         const yarnItem = finishedYarnOptions.find((yi: any) => getFinishedYarnIdentifier(yi) === selectedYarnItemId);
//                                         const finishedCode = yarnItem ? getFinishedYarnIdentifier(yarnItem) : "";
//                                         const currentFormQty = selectedLot
//                                             .filter((lot: any) => getFinishedYarnIdentifier(lot) === finishedCode)
//                                             .reduce((sum: number, lot: any) => sum + (lot.issueQty ? Number(lot.issueQty) : 0), 0);
//                                         const orderQty = Number(dispatchDetails.orderQuantity) || 0;

//                                         const dyeingWorkOrderId = watch("dyeingWorkOrderId");
//                                         const dispatchedQtyFromPrev = (yarnDispatchDyingList || [])
//                                             .filter((dispatch: any) =>
//                                                 Number(dispatch.dyeingWorkOrderId) === Number(dyeingWorkOrderId) &&
//                                                 dispatch.processType === "YARN" &&
//                                                 (!processingIssueDtl?.id || dispatch.id !== processingIssueDtl.id)
//                                             )
//                                             .reduce((total: number, dispatchItem: any) => {
//                                                 const issueQtySum = (dispatchItem.yarnIssues || [])
//                                                     .filter((issue: any) => {
//                                                         const issueIdentifier = getFinishedYarnIdentifier(issue);
//                                                         return issueIdentifier === finishedCode ||
//                                                             (!issue.finishedYarnId && !issue.finishedYarnCodeId && String(dispatchItem.finishedFabricCode || "") === finishedCode);
//                                                     })
//                                                     .reduce((sum: number, issue: any) => sum + (Number(issue.issueQty) || 0), 0);
//                                                 return total + issueQtySum;
//                                             }, 0);

//                                         const totalDispatched = dispatchedQtyFromPrev + currentFormQty;
//                                         const balance = String(orderQty - totalDispatched);

//                                         const totalIssueQty = selectedLot.reduce((sum: number, lot: any) => sum + (lot.issueQty ? Number(lot.issueQty) : 0), 0);
//                                         setValue("dispatchedQuantity" as any, String(totalIssueQty) as any);
//                                         // const balance = String((Number(dispatchDetails.orderQuantity) || 0) - totalIssueQty);
//                                         setValue("balanceQuantity" as any, balance as any);
//                                         setDispatchDetails(prev => ({
//                                             ...prev,
//                                             dispatchedQuantity: String(totalIssueQty),
//                                             balanceQuantity: balance,
//                                         }));
//                                     }}
//                                 >
//                                     Save Lots
//                                 </Button> */}
//                                 <Button
//                                     variant="default"
//                                     className="bg-blue-600 hover:bg-blue-700 text-white"
//                                     onClick={() => {
//                                         const invalid = selectedLot.find((l: any) => Number(l.issueQty ?? 0) > Number(l.availableQty) || Number(l.issueQty ?? 0) < 0);
//                                         if (invalid) {
//                                             toast.error(`Issue Qty cannot exceed Available Qty for Lot ${invalid.lotNumber || invalid.id}.`);
//                                             return;
//                                         }
//                                         const yarnItem = finishedYarnOptions.find((yi: any) => getFinishedYarnIdentifier(yi) === selectedYarnItemId);
//                                         const finishedCode = yarnItem ? getFinishedYarnIdentifier(yarnItem) : "";

//                                         const currentFormQty = selectedLot
//                                             .filter((lot: any) => getFinishedYarnIdentifier(lot) === finishedCode)
//                                             .reduce((sum: number, lot: any) => sum + (lot.issueQty ? Number(lot.issueQty) : 0), 0);

//                                         const orderQty = Number(dispatchDetails.orderQuantity) || 0;

//                                         // Recalculate previous dispatches for this item to get correct balance
//                                         const dyeingWorkOrderId = watch("dyeingWorkOrderId");

//                                         const dispatchedQtyFromPrev = (yarnDispatchDyingList || [])
//                                             .filter((dispatch: any) =>
//                                                 Number(dispatch.dyeingWorkOrderId) === Number(dyeingWorkOrderId) &&
//                                                 dispatch.processType === "YARN" &&
//                                                 (!processingIssueDtl?.id || dispatch.id !== processingIssueDtl.id) // Exclude current record if editing
//                                             )
//                                             .reduce((total: number, dispatchItem: any) => {
//                                                 const issueQtySum = (dispatchItem.yarnIssues || [])
//                                                     .filter((issue: any) => {
//                                                         const issueIdentifier = getFinishedYarnIdentifier(issue);
//                                                         return issueIdentifier === finishedCode || 
//                                                                (!issue.finishedYarnId && !issue.finishedYarnCodeId && !issue.greigeYarnCodeId && !issue.yarnId && String(dispatchItem.finishedFabricCode || "") === finishedCode);
//                                                     })
//                                                     .reduce((sum: number, issue: any) => sum + (Number(issue.issueQty) || 0), 0);
//                                                 return total + issueQtySum;
//                                             }, 0);

//                                         const totalDispatched = dispatchedQtyFromPrev + currentFormQty;
//                                         const balance = String(orderQty - totalDispatched);

//                                         setValue("dispatchedQuantity", String(currentFormQty));
//                                         setValue("balanceQuantity", balance);
//                                         setDispatchDetails(prev => ({
//                                             ...prev,
//                                             dispatchedQuantity: String(totalDispatched),
//                                             balanceQuantity: balance,
//                                         }));
//                                         toast.success("Lots saved successfully");
//                                     }}
//                                 >
//                                     Save Lots
//                                 </Button>
//                             </div>
//                         </Card>

//                         <Dialog open={showLotDialog} onOpenChange={setShowLotDialog}>
//                             <DialogContent className="max-w-4xl">
//                                 <DialogHeader>
//                                     <DialogTitle>Select Lots</DialogTitle>
//                                 </DialogHeader>
//                                 <div className="max-h-[60vh] overflow-y-auto">
//                                     <table className="w-full border-collapse">
//                                         <thead className="sticky top-0 bg-gray-100">
//                                             <tr>
//                                                 <th className="border p-2">Select</th>
//                                                 <th className="border p-2">Yarn Name</th>
//                                                 <th className="border p-2">Finished Yarn</th>
//                                                 <th className="border p-2">Lot Number</th>
//                                                 <th className="border p-2">Available Bags</th>
//                                                 <th className="border p-2">Kgs/Bag</th>
//                                                 <th className="border p-2">Cones/Bag</th>
//                                                 <th className="border p-2">Cones Weight</th>
//                                                 <th className="border p-2">Available Qty</th>
//                                                 <th className="border p-2">Mill</th>
//                                                 <th className="border p-2">Warehouse</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {yarnIssueDetails.map((lot: any, idx: number) => {
//                                                 const isSelected = selectedLot.some((l: LotDetail) => l.id === lot.id);
//                                                 const selectedLotEntry = selectedLot.find((l: any) => String(l.id) === String(lot.id));
//                                                 const mappedMeta = lotMeta[String(lot.id)] || {};
//                                                 const resolvedMillId = mappedMeta.millId ?? selectedLotEntry?.millId ?? lot.millId ?? '';
//                                                 const resolvedMillName = resolvedMillId
//                                                     ? (millNameById.get(String(resolvedMillId)) || lot.millName || '')
//                                                     : (lot.millName || '');
//                                                 const warehouseLabel = lot.warehouseName || '-';
//                                                 return (
//                                                     <tr key={`${lot.id}-${lot.inwardId}-${idx}`} className={isSelected ? "bg-blue-50" : ""}>
//                                                         <td className="border p-2 text-center">
//                                                             <Checkbox
//                                                                 checked={isSelected}
//                                                                 onCheckedChange={() => handleLotSelect({
//                                                                     id: lot.id,
//                                                                     yarnName: lot.yarnName,
//                                                                     availableBags: lot.availableBags,
//                                                                     kgsPerBag: lot.kgsPerBag,
//                                                                     conesPerBag: lot.conesPerBag,
//                                                                     conesWeight: lot.conesWeight,
//                                                                     availableQty: lot.availableQty,
//                                                                     lotNumber: lot.lotNumber,
//                                                                     millId: resolvedMillId,
//                                                                     millName: resolvedMillName,
//                                                                     warehouseId: lot.warehouseId,
//                                                                     warehouseName: warehouseLabel === '-' ? '' : warehouseLabel,
//                                                                     inwardId: lot.inwardId,
//                                                                     orderItemId: lot.orderItemId,
//                                                                     itemId: lot.itemId,
//                                                                     noOfBags: 0,
//                                                                      finishedYarnId: lot.finishedYarnId,
//                                                                     finishedYarnName: lot.finishedYarnName
//                                                                 })}
//                                                             />
//                                                         </td>
//                                                         <td className="border p-2">{lot.yarnName}</td>
//                                                         <td className="border p-2">{lot.finishedYarnName || '-'}</td>
//                                                         <td className="border p-2">{lot.lotNumber}</td>
//                                                         <td className="border p-2">{lot.availableBags}</td>
//                                                         <td className="border p-2">{Number(lot.kgsPerBag ?? 0).toFixed(3)}</td>
//                                                         <td className="border p-2">{lot.conesPerBag ?? 0}</td>
//                                                         <td className="border p-2">{Number(lot.conesWeight ?? 0).toFixed(3)}</td>
//                                                         <td className="border p-2">{lot.availableQty}</td>
//                                                         <td className="border p-2">{resolvedMillName || '-'}</td>
//                                                         <td className="border p-2">{warehouseLabel}</td>
//                                                         {/* <td className="border p-2">
//                                                             <select
//                                                                 className="input mt-1"
//                                                                 value={String(currentMillId)}
//                                                                 onChange={(e) => {
//                                                                     const val = e.target.value;
//                                                                     setLotMeta((prev) => ({ ...prev, [String(lot.id)]: { ...(prev[String(lot.id)] || {}), millId: val } }));

//                                                                     setSelectedLot((prev) => 
//                                                                         prev.map((l) => 
//                                                                             String(l.id) === String(lot.id) 
//                                                                                 ? { ...l, millId: val }
//                                                                                 : l
//                                                                         )
//                                                                     );
//                                                                 }}
//                                                             >
//                                                                 <option value="">Select Mill</option>
//                                                                 {millOptions?.map((m: any) => (
//                                                                     <option key={m.id} value={m.id}>{m.subCategoryName}</option>
//                                                                 ))}
//                                                             </select>
//                                                         </td> */}
//                                                     </tr>
//                                                 );
//                                             })}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                                 <div className="flex justify-end gap-2 mt-4">
//                                     <Button variant="outline" onClick={() => setShowLotDialog(false)}>
//                                         Cancel
//                                     </Button>
//                                     <Button onClick={() => setShowLotDialog(false)}>
//                                         Confirm Selection
//                                     </Button>
//                                 </div>
//                             </DialogContent>
//                         </Dialog>
//                     </>
//                     {/* )} */}
//                 </div>
//             </div>
//         </div>
//     );
// }
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileText, ShoppingCart, ClipboardList, Edit, Trash2, Save, Plus, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { PopupDataTable, PopupColumn } from "@/components/data/PopupDataTable";
import { createPurchaseOrder, getAllPoTypes, getAllPurchaseOrders, updatePurchaseOrder } from "@/state/purchaseOrderSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useDispatch, useSelector } from "react-redux";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllProductCategory } from "@/state/productCategorySlice";
import { DataTable } from "@/components/data/DataTable";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllTermsConditions } from "@/state/termsConditions";
import { getAllWeavingContract, getWeavingContractById } from "@/state/weavingContractSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CodeSandboxLogoIcon } from "@radix-ui/react-icons";
import { createWeavingYarnIssue } from "@/state/weavingYarnIssueSlice";
import { getAllDyeingWorkOrdersByType } from "@/state/processContractSlice";
import { getSubCategoryByCategory, getAllSubCategories } from "@/state/subCategorySlice";
import { getAllShipmentModes } from "@/state/shipmentModeSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { createYarnDispatch, updateYarnDispatch, getAllYarnDispatch } from "@/state/yarn-dispatch-for-dyeing-slice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllFinishFabricReceivesByType } from "@/state/finishFabricReceiveSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllTransports } from "@/state/transportSlice";
import { toast } from "react-toastify";
import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
import apiService from "@/services/ApiService";
import documentNumberService from "@/services/DocumentNumberService";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { VENDOR_TYPE_ALL, filterVendorsByTypeIds } from "@/utils/vendorFilters";
import type { ApiState as SubCategoryState } from "@/state/subCategorySlice";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { CodesAPI } from "@/services/codes_api";
import { CodesUtil } from "@/utils/codesUtil";
import { CodeDetail, CodeHeader } from "@/types/codes";

interface YarnIssueDetail {
    id?: number;
    yarnName: string;
    availableReqQty: number;
    issueQty: number;
    lotId: string;
    activeFlag?: boolean;
    availableBags?: number;
    kgsPerBag?: number;
    conesPerBag?: number;
    conesWeight?: number;
    lotNumber?: string;
    millId?: number | string | null;
    millName?: string;
    warehouseId?: number | string | null;
    warehouseName?: string;
    inwardId?: number | null;
    orderItemId?: number | null;
    itemId?: number | null;
    inwardTypeId?: number | null;
    inwardNo?: string;
}

// For Yarn Requirement Details Table
interface YarnRequirementDetail {
    yarnName: string;
    yarnCount: string;
    gramsPerMeter: string;
    totalwarpReq: string;
    totalWarpIssued: string;
    balanceWarpToIssue: string;
    activeFlag: boolean;
}

// For Yarn Issue Details Table
// In your ProcessingYarnIssue component
interface YarnDispatchDyeingFormData {
    id?: number;
    fabricDispatchDate: string;
    vendorId: string;
    dyeingWorkOrderId: string;
    lotNumber: string;
    orderQuantity: string;
    dispatchedQuantity: string;
    receivedQuantity: string;
    balanceQuantity: string;
    costPerPound: string;
    totalAmount: string;
    colorId: string;
    pantone: string;
    finishingId: string;
    salesOrderId: string;
    shipmentModeId: string;
    lotId: string | null;
    remarks: string;
    transportId?: string;
    transportName: string;
    vehicleNo?: string;
    grossWt: string | number;
    activeFlag: boolean; // Changed from 'true' to 'boolean'
    processType: string;
    fabricDispatchId?: string;
}

interface LotDetail {
    id?: string;
    lotId?: string | number;
    yarnName: string;
    availableQty: number;
    lotNumber?: string;
    issueQty?: number | null;
    activeFlag?: boolean;
    millId?: number | string;
    millName?: string;
    warehouseId?: number | string;
    warehouseName?: string;
    inwardId?: number | null;
    orderItemId?: number | null;
    itemId?: number | null;
    availableBags?: number;
    noOfBags?: number | null;
    kgsPerBag?: number;
    conesPerBag?: number;
    conesWeight?: number;
    finishedYarnId?: string | number; // Added
    finishedYarnName?: string; // Added
    inwardTypeId?: number | null;
    yarnInwardStockDetailsId?: number | null;
    inwardNo?: string;
    poCategoryId?: number | null;
}

const getFinishedYarnIdentifier = (item: any) => String(item?.finishedYarnId ?? item?.finishedYarnCodeId ?? item?.greigeYarnCodeId ?? item?.yarnId ?? item?.itemId ?? item?.finishedFabricCode ?? item?.id ?? "");

// const getFinishedYarnIdentifier = (item: any) => String(item?.id ?? item?.yarnId ?? item?.greigeYarnCodeId ?? item?.finishedYarnCodeId ?? "");

const buildYarnInwardStockUrl = (itemIds: string, companyId?: number | null) => {
    const params: string[] = [];
    if (itemIds) {
        params.push(`itemId=${itemIds}`);
    }
    if (companyId != null) {
        params.push(`companyId=${companyId}`);
    }
    return params.length
        ? `/sizing-yarn-issues/yarn-inward-stock?${params.join("&")}`
        : `/sizing-yarn-issues/yarn-inward-stock`;
};

const calculateIssueQty = (bags?: number | string, kgs?: number | string) => {
    const bagValue = Number(bags || 0);
    const kgValue = Number(kgs || 0);
    return Number((bagValue * kgValue).toFixed(3));
};

const PROCESS_VENDOR_TYPE_IDS = [304, VENDOR_TYPE_ALL];

export function ProcessingYarnIssue() {

    const [isFormValid, setIsFormValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { processContractList } = useSelector((state: RootState) => state.dyeingWorkOrde);
    const { shipmentModesList } = useSelector((state: RootState) => state.shipmentMode);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const processVendors = useMemo(
        () => filterVendorsByTypeIds(vendorList, PROCESS_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null }),
        [vendorList]
    );
    const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
    const { finishFabricReceiveList } = useSelector((state: RootState) => state.finishFabricReceive as any);
    const { transportList } = useSelector((state: RootState) => state.transport);
    const { yarnDispatchDyingList } = useSelector((state: RootState) => state.yarnDispatchForDyeing as any);
    const { subCategoryList: subCategories, subCategoryByCategoryList } = useSelector(
        (state: RootState) => state.subCategory as SubCategoryState
    );
    const { warehouseList } = useSelector((state: RootState) => state.warehouse);
    const { yarnList } = useSelector((state: RootState) => state.yarn);
    const [weavingContractItemDtl, setweavingContractItemDtl]: any = useState([]);
    const [newItem, setNewItem]: any = useState({});
    const [editingIndex, setEditingIndex]: any = useState(null);
    const [activeTab, setActiveTab] = useState("orderDetails");
    const [selectedJobWork, setSelectedJobWork]: any = useState([]);
    const [yarnRequirementDetails, setYarnRequirementDetails]: any = useState<YarnRequirementDetail[]>([]);
    const [showLotDialog, setShowLotDialog] = useState(false);
    const [lotPopupSearch, setLotPopupSearch] = useState("");
    const [yarnIssueDetails, setYarnIssueDetails]: any = useState<YarnIssueDetail[]>([]);
    const [selectedLot, setSelectedLot] = useState<LotDetail[]>([]);
    const [lotMeta, setLotMeta] = useState<{ [id: string]: { millId?: string; warehouseId?: string } }>({});
    const millOptions = useMemo(() => (subCategories || []).filter((sc: any) => sc.categoryName === "Mill"), [subCategories]);
    const normalizeDetailsResponse = (raw: any): CodeDetail[] => {
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


    const millNameById = useMemo(() => {
        const map = new Map<string, string>();
        millOptions.forEach((mill: any) => {
            map.set(String(mill.id), mill.subCategoryName || mill.name || '');
        });
        return map;
    }, [millOptions]);
    const [inwardTypes, setInwardTypes] = useState<CodeDetail[]>([]);


    const [inwardTypeHeader, setInwardTypeHeader] = useState<CodeHeader | null>(null);

    // useEffect(() => {
    //     const fetchInwardTypeCodes = async () => {
    //         try {
    //             await CodesUtil.loadOnce(CodesAPI.getCodesHeader);
    //             const headers = CodesUtil.getHeaders();
    //             const targetHeader = headers.find(h => String(h.id) === "1" || String(h.hdr_id) === "1");
    //             if (targetHeader) {
    //                 setInwardTypeHeader(targetHeader);
    //             }
    //         } catch (error) {
    //             console.error("Error loading inward type codes:", error);
    //         }
    //     };
    //     fetchInwardTypeCodes();
    // }, []);

    useEffect(() => {
        const fetchInwardTypes = async () => {
            try {
                // First try to get headers from storage or load them once
                let headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());

                if (!headers.length) {
                    try {
                        await CodesUtil.loadOnce(async () => normalizeHeadersResponse(await CodesAPI.getCodesHeader()));
                        headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());
                    } catch (error) {
                        console.error("Failed to preload inward type headers", error);
                    }
                }

                // If headers are still empty, fetch them directly
                if (!headers.length) {
                    try {
                        const apiHeaders = await CodesAPI.getCodesHeader();
                        headers = normalizeHeadersResponse(apiHeaders);
                    } catch (error) {
                        console.error("Failed to fetch inward type headers", error);
                    }
                }

                // Find the header for inward types (hdr_id: 1)
                const inwardHeader = headers.find((h: CodeHeader) =>
                    String(h.id) === "1" || String(h.hdr_id) === "1" || String(h.hdrId) === "1"
                );

                if (inwardHeader && Array.isArray(inwardHeader.details)) {
                    setInwardTypes(inwardHeader.details);
                } else if (inwardHeader?.id) {
                    // Fallback if details are not included in headers
                    const response = await CodesAPI.getCodeDetailsByHeader(inwardHeader.code_group || inwardHeader.codeGroup);
                    setInwardTypes(normalizeDetailsResponse(response));
                } else {
                    // Final fallback - try by numeric ID as string if group name is unknown
                    const response = await CodesAPI.getCodeDetailsByHeader("1");
                    setInwardTypes(normalizeDetailsResponse(response));
                }
            } catch (error) {
                console.error("Failed to fetch inward types:", error);
            }
        };
        fetchInwardTypes();
    }, []);

    const [poCategories, setPoCategories] = useState<CodeDetail[]>([]);

    useEffect(() => {
        const fetchPoCategories = async () => {
            try {
                const details = await CodesAPI.getCodeDetailsByHeader("7");
                setPoCategories(details || []);
            } catch (err) {
                console.error("Failed to fetch PO Categories in processing yarn issue:", err);
            }
        };
        fetchPoCategories();
    }, []);

    const poCategoryMap = useMemo(() => {
        return poCategories.reduce((acc: Record<number, string>, category: any) => {
            acc[category.id] = category.value;
            return acc;
        }, {}) || {};
    }, [poCategories]);

    const inwardTypeLabelById = useMemo(() => {
        const map = new Map<number, string>();
        if (inwardTypes && Array.isArray(inwardTypes)) {
            inwardTypes.forEach((detail: any) => {
                map.set(Number(detail.id), detail.code_desc || detail.codeDesc || detail.code || "");
            });
        }
        return map;
    }, [inwardTypes]);

    const lotColumns = useMemo<PopupColumn[]>(() => [
        {
            Header: 'Select',
            id: 'selected',
            disableFilters: true,
            Cell: ({ row }) => {
                const isSelected = selectedLot.some((l: LotDetail) => l.id === row.id);
                const selectedLotEntry = selectedLot.find((l: any) => String(l.id) === String(row.id));
                const mappedMeta = lotMeta[String(row.id)] || {};
                const resolvedMillId = mappedMeta.millId ?? selectedLotEntry?.millId ?? row.millId ?? '';
                const resolvedMillName = resolvedMillId
                    ? (millNameById.get(String(resolvedMillId)) || row.millName || '')
                    : (row.millName || '');
                const warehouseLabel = row.warehouseName || '-';

                return (
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleLotSelect({
                            id: row.id,
                            yarnName: row.yarnName,
                            availableBags: row.availableBags,
                            kgsPerBag: row.kgsPerBag,
                            conesPerBag: row.conesPerBag,
                            conesWeight: row.conesWeight,
                            availableQty: row.availableQty,
                            lotNumber: row.lotNumber,
                            millId: resolvedMillId,
                            millName: resolvedMillName,
                            warehouseId: row.warehouseId,
                            warehouseName: warehouseLabel === '-' ? '' : warehouseLabel,
                            inwardId: row.inwardId,
                            orderItemId: row.orderItemId,
                            itemId: row.itemId,
                            noOfBags: 0,
                            finishedYarnId: row.finishedYarnId,
                            finishedYarnName: row.finishedYarnName,
                            inwardTypeId: row.inwardTypeId
                        })}
                    />
                );
            },
        },
        {
            Header: 'Yarn Name',
            accessor: 'yarnName',
            id: 'yarnName',
        },
        {
            Header: 'Inward No',
            accessor: 'inwardNo',
            id: 'inwardNo',
        },
        {
            Header: 'Inward Type',
            accessor: (row: any) => row.inwardTypeId ? inwardTypeLabelById.get(Number(row.inwardTypeId)) || 'N/A' : 'N/A',
            id: 'inwardType',
        },
        {
            Header: 'PO Category',
            accessor: (row: any) => row.poCategoryId ? poCategoryMap[row.poCategoryId] || `Category ${row.poCategoryId}` : 'N/A',
            id: 'poCategory',
        },
        {
            Header: 'Lot Number',
            accessor: 'lotNumber',
            id: 'lotNumber',
        },
        {
            Header: 'Available Bags',
            accessor: 'availableBags',
            id: 'availableBags',
        },
        {
            Header: 'Kgs/Bag',
            accessor: (row: any) => Number(row.kgsPerBag ?? 0).toFixed(3),
            id: 'kgsPerBag',
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
            accessor: 'availableQty',
            id: 'availableQty',
        },
        {
            Header: 'Mill',
            accessor: (row: any) => {
                const selectedLotEntry = selectedLot.find((l: any) => String(l.id) === String(row.id));
                const mappedMeta = lotMeta[String(row.id)] || {};
                const resolvedMillId = mappedMeta.millId ?? selectedLotEntry?.millId ?? row.millId ?? '';
                return resolvedMillId
                    ? (millNameById.get(String(resolvedMillId)) || row.millName || '')
                    : (row.millName || '') || '-';
            },
            id: 'mill',
        },
        {
            Header: 'Warehouse',
            accessor: (row: any) => row.warehouseName || '-',
            id: 'warehouse',
        },
    ], [selectedLot, lotMeta, millNameById, inwardTypeLabelById, poCategoryMap]);

    const transportOptions = useMemo(() => {
        const list = Array.isArray(transportList) ? transportList : [];
        return list.map((t: any) => ({
            id: t.id,
            name: t.transportName || t.name,
            activeFlag: t.activeFlag ?? true
        }));
    }, [transportList]);

    const dispatch = useDispatch<AppDispatch>();
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<YarnDispatchDyeingFormData>();


    // Auto-calculate Gross Weight
    useEffect(() => {
        const totalIssueQty = selectedLot.reduce((sum: number, lot: any) => sum + (lot.issueQty ? Number(lot.issueQty) : 0), 0);
        const detailsCount = selectedLot.length || 1;
        const calculatedGrossWt = (totalIssueQty / detailsCount).toFixed(3);
        setValue("grossWt", calculatedGrossWt);
    }, [selectedLot, setValue]);
    const [selectedDyeingWorkOrder, setSelectedDyeingWorkOrder] = useState<any>(null);
    const [dispatchDetails, setDispatchDetails] = useState({
        // finishedCode: "",
        // greigeCode: "",
        finishedFabricCode: "",
        finishedFabricName: "",
        greigeFabricCode: "",
        greigeFabricName: "",
        orderQuantity: "",
        dispatchedQuantity: "",
        receivedQuantity: "",
        balanceQuantity: ""
    });
    const [finishedYarnOptions, setFinishedYarnOptions] = useState<any[]>([]);
    const [selectedYarnItemId, setSelectedYarnItemId] = useState("");
    const selectedFinishedYarnMeta = useMemo(() => {
        const yarnItem = finishedYarnOptions.find((option: any) => getFinishedYarnIdentifier(option) === selectedYarnItemId);
        const fallbackLabel = yarnItem
            ? (yarnItem.finishedYarnName || yarnItem.greigeYarnName || yarnItem.yarnName || "")
            : (dispatchDetails.finishedFabricName || "");
        return {
            id: yarnItem ? getFinishedYarnIdentifier(yarnItem) : "",
            label: fallbackLabel
        };
    }, [finishedYarnOptions, selectedYarnItemId, dispatchDetails.finishedFabricName]);
    const enhanceLotsWithFinishedYarn = (lots: any[]) => lots.map((lot: any) => ({
        ...lot,
        finishedYarnName: lot.finishedYarnName || selectedFinishedYarnMeta.label,
        finishedYarnId: lot.finishedYarnId || selectedFinishedYarnMeta.id
    }));
    const [formErrors, setFormErrors] = useState({
        yarnDispatchDate: false,
        vendorId: false,
        dyeingWorkOrderId: false,
        orderQuantity: false,
        // Add other fields as needed
    });
    const navigate = useNavigate();
    const location = useLocation();
    const processingIssueDtl = location.state?.processingIssueDtl;
    const resolvedCompanyId = useResolvedCompanyId();
    console.log("processingIssueDtl from location state:", processingIssueDtl);
    const { purchaseInwardList } = useSelector((state: RootState) => state.purchaseInward as any);


    const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);

    // Generate document number for new beam inward entries
    useEffect(() => {
        const generateDocumentNumber = async () => {
            if (processingIssueDtl || hasGeneratedNumberRef.current) {
                return;
            }

            try {
                const result = await documentNumberService.generateDocumentNumber({
                    screenName: 'Processing Issue Management',
                    tabName: 'processIssueYarn',
                });
                setValue('fabricDispatchId', result.documentNumber, { shouldValidate: true });

                hasGeneratedNumberRef.current = true;
            } catch (error) {
                console.error('Failed to generate process contract number:', error);
                toast.error('Failed to generate process contract number');
            }
        };

        generateDocumentNumber();
        // Cleanup: Clear cache if component unmounts without saving
        return () => {
            if (!processingIssueDtl?.id && hasGeneratedNumberRef.current && !isSavingRef.current) {
                documentNumberService.clearMemoryCache("Processing Issue Management", "processIssueYarn");
            }
        };
    }, [processingIssueDtl, setValue]);

    // Cleanup document number cache if not saved
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !processingIssueDtl) {
                documentNumberService.clearMemoryCache('Processing Issue Management', 'processIssueYarn');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !processingIssueDtl) {
                documentNumberService.clearMemoryCache('Processing Issue Management', 'processIssueYarn');
            }
        };
    }, [processingIssueDtl]);

    useEffect(() => {
        setValue('fabricDispatchId', processingIssueDtl?.fabricDispatchId || '');
    }, [processingIssueDtl, setValue]);


    const colours = useMemo(() => {
        if (Array.isArray(subCategoryByCategoryList) && subCategoryByCategoryList.length > 0) {
            return subCategoryByCategoryList;
        }
        const list = Array.isArray(subCategories)
            ? subCategories
            : Array.isArray((subCategories as any)?.data)
                ? (subCategories as any).data
                : [];
        return list.filter((sc: any) => (sc?.categoryName || "").toLowerCase() === "colour");
    }, [subCategoryByCategoryList, subCategories]);

    const inwardIndex = useMemo(() => {
        const map = new Map<string, { millId?: number | string; warehouseId?: number | string }>();
        const list = Array.isArray(purchaseInwardList?.data) ? purchaseInwardList.data : purchaseInwardList;
        (list || []).forEach((pi: any) => {
            (pi.purchaseInwardItemsDtl || []).forEach((item: any) => {
                const millId = item.millNameId;
                (item.lotEntries || []).forEach((le: any) => {
                    const key = `${le.id}|${le.yarnId}`;
                    map.set(key, { millId, warehouseId: le.warehouseId });
                });
            });
        });
        return map;
    }, [purchaseInwardList]);

    useEffect(() => {
        dispatch(getAllPurchaseInwards({} as any));
    }, [dispatch]);


    // Update your validateForm function to return validity state
    const validateForm = () => {
        const formValues = {
            date: watch("fabricDispatchDate"),
            vendor: watch("vendorId"),
            workOrder: watch("dyeingWorkOrderId"),
            lotNumber: watch("lotNumber"),
            quantity: watch("orderQuantity")
        };

        const isValid = Object.values(formValues).every(val => Boolean(val));

        setIsFormValid(isValid);
        return isValid;
    };

    // Add this useEffect to validate form on changes
    useEffect(() => {
        const subscription = watch(() => validateForm());
        return () => subscription.unsubscribe();
    }, [watch]);


    // Set default dispatch date to today for new records
    useEffect(() => {
        if (!processingIssueDtl) {
            const today = new Date().toISOString().split('T')[0];
            setValue("fabricDispatchDate", today);
        }
    }, [setValue]);

    useEffect(() => {
        if (processingIssueDtl) {
            reset({
                id: processingIssueDtl.id,
                fabricDispatchDate: processingIssueDtl.fabricDispatchDate ? processingIssueDtl.fabricDispatchDate.slice(0, 10) : '',
                vendorId: String(processingIssueDtl.vendorId),
                dyeingWorkOrderId: String(processingIssueDtl.dyeingWorkOrderId),
                lotNumber: String(processingIssueDtl.lotNumber ?? processingIssueDtl.lotNo ?? ''),
                orderQuantity: processingIssueDtl.orderQuantity,
                dispatchedQuantity: processingIssueDtl.dispatchedQuantity,
                receivedQuantity: processingIssueDtl.receivedQuantity,
                balanceQuantity: processingIssueDtl.balanceQuantity,
                costPerPound: processingIssueDtl.costPerPound,
                totalAmount: processingIssueDtl.totalAmount,
                colorId: String(processingIssueDtl.colorId),
                pantone: processingIssueDtl.pantone,
                finishingId: String(processingIssueDtl.finishingId),
                salesOrderId: String(processingIssueDtl.salesOrderId),
                shipmentModeId: String(processingIssueDtl.shipmentModeId),
                lotId: processingIssueDtl.lotId ? String(processingIssueDtl.lotId) : null,
                remarks: processingIssueDtl.remarks || processingIssueDtl.remark || '',
                transportId: processingIssueDtl.transportId ? String(processingIssueDtl.transportId) : '',
                transportName: processingIssueDtl.transportName || '',
                vehicleNo: processingIssueDtl.vehicleNo || '',
                grossWt: processingIssueDtl.grossWt || '',
                activeFlag: processingIssueDtl.activeFlag,
                fabricDispatchId: processingIssueDtl.fabricDispatchId
            });

            const receivedQtyFromFinish = (finishFabricReceiveList || [])
                .filter((receive: any) =>
                    Number(receive.dyeingWorkOrderId) === Number(processingIssueDtl.dyeingWorkOrderId) &&
                    receive.processType === "YARN"
                )
                .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

            setValue("receivedQuantity" as any, String(receivedQtyFromFinish) as any);

            let finishedCode = String(processingIssueDtl.finishedFabricCode || "");
            let finishedName = processingIssueDtl.finishedFabricName || "";
            let greigeCode = String(processingIssueDtl.greigeFabricCode || "");
            let greigeName = processingIssueDtl.greigeFabricName || "";

            const order = Array.isArray(processContractList) ? processContractList.find((o: any) => Number(o.id) === Number(processingIssueDtl.dyeingWorkOrderId)) : null;
            const yarnItems = Array.isArray(order?.yarnItems) ? order.yarnItems : [];
            const matchedYarnItem = yarnItems.find((y: any) => {
                if (processingIssueDtl.finishedFabricCode) {
                    return String(y.finishedYarnCodeId ?? "") === String(processingIssueDtl.finishedFabricCode);
                }
                if (processingIssueDtl.finishedFabricName) {
                    return String(y.finishedYarnName ?? "") === String(processingIssueDtl.finishedFabricName);
                }
                return false;
            }) || (yarnItems.length > 0 ? yarnItems[0] : null);
            setFinishedYarnOptions(yarnItems);
            if (order) {

                setSelectedDyeingWorkOrder(order);

                setYarnRequirementDetails(yarnItems.map((yi: any) => ({

                    actualYarnId: yi.greigeYarnCodeId || yi.finishedYarnCodeId,

                    yarnName: yi.greigeYarnName || yi.finishedYarnName,

                    yarnCount: "",

                    gramsPerMeter: "",

                    totalwarpReq: yi.quantity || "0",

                    totalWarpIssued: "0",

                    balanceWarpToIssue: yi.quantity || "0",

                    activeFlag: true

                })));

            }
            setSelectedYarnItemId("");
            // setSelectedYarnItemId(matchedYarnItem ? getFinishedYarnIdentifier(matchedYarnItem) : "");
            // if (matchedYarnItem) {
            //     finishedCode = String(matchedYarnItem.finishedYarnCodeId ?? finishedCode);
            //     finishedName = matchedYarnItem.finishedYarnName ?? finishedName;
            //     greigeCode = String(matchedYarnItem.greigeYarnCodeId ?? greigeCode);
            //     greigeName = matchedYarnItem.greigeYarnName ?? greigeName;
            // }
            setDispatchDetails({

                finishedFabricCode: "",

                finishedFabricName: "",

                greigeFabricCode: "",

                greigeFabricName: "",

                orderQuantity: "",

                dispatchedQuantity: "0",

                receivedQuantity: "", // Keep empty initially as requested

                balanceQuantity: ""

            });
            // setDispatchDetails({
            //     finishedFabricCode: finishedCode,
            //     finishedFabricName: finishedName,
            //     greigeFabricCode: greigeCode,
            //     greigeFabricName: greigeName,
            //     orderQuantity: String(processingIssueDtl.orderQuantity || ""),
            //     dispatchedQuantity: String(processingIssueDtl.dispatchedQuantity || "0"),
            //     receivedQuantity: String(receivedQtyFromFinish),
            //     balanceQuantity: String(processingIssueDtl.balanceQuantity || "")
            // });

            if (processingIssueDtl.yarnIssues && Array.isArray(processingIssueDtl.yarnIssues) && processingIssueDtl.yarnIssues.length > 0) {
                const baseSelected = processingIssueDtl.yarnIssues.map((yi: any) => {
                    const warehouseId = yi.warehouseId ?? null;
                    const warehouseName = warehouseId ? (warehouseList.find((w: any) => String(w.id) === String(warehouseId))?.warehouseName || '') : '';
                    const conesPerBag = yi.conesPerBag != null ? Number(yi.conesPerBag) : 0;
                    const conesWeight = yi.conesWeight != null
                        ? Number(yi.conesWeight)
                        : (conesPerBag > 0 && Number(yi.kgsPerBag) > 0 ? Number((Number(yi.kgsPerBag) / conesPerBag).toFixed(3)) : 0);
                    const millIdValue = yi.millId ?? null;
                    const millNameValue = millIdValue != null
                        ? (millNameById.get(String(millIdValue)) || yi.millName || '')
                        : (yi.millName || '');
                    return {
                        id: String(yi.lotId ?? yi.id),
                        yarnName: yi.yarnName ?? '',
                        availableBags: yi.availableBags != null ? Number(yi.availableBags) : 0,
                        kgsPerBag: yi.kgsPerBag != null ? Number(yi.kgsPerBag) : 0,
                        conesPerBag,
                        conesWeight,
                        availableQty: yi.availableReqQty != null ? Number(yi.availableReqQty) : 0,
                        lotNumber: yi.lotNumber ?? '',
                        issueQty: yi.issueQty != null ? Number(yi.issueQty) : null,
                        noOfBags: yi.noOfBags != null ? Number(yi.noOfBags) : 0,
                        millId: millIdValue,
                        millName: millNameValue,
                        warehouseId,
                        warehouseName,
                        inwardId: yi.inwardId ?? null,
                        orderItemId: yi.orderItemId ?? null,
                        itemId: yi.itemId ?? null,
                        inwardTypeId: yi.inwardTypeId ?? null,
                        inwardNo: yi.inwardNo || 'N/A',
                        activeFlag: yi.activeFlag !== false,
                        finishedYarnId: yi.finishedYarnId || processingIssueDtl.finishedFabricCode || "",
                        finishedYarnName: yi.finishedYarnName || processingIssueDtl.finishedFabricName || ""
                    };
                });

                // If lotNumber is missing or looks like a numeric ID, resolve it by fetching lot entries
                const needsResolve = baseSelected.some((l: any) => !l.lotNumber || /^\d+$/.test(String(l.lotNumber)));
                if (needsResolve) {
                    (async () => {
                        try {
                            const list = Array.isArray(purchaseInwardList?.data) ? purchaseInwardList.data : purchaseInwardList;
                            const lots = (list || []).flatMap((pi: any) =>
                                (pi.purchaseInwardItemsDtl || []).flatMap((item: any) => item.lotEntries || [])
                            );
                            const idToLotNo = new Map(lots.map((lot: any) => [String(lot.id), lot.lotNumber]));
                            const enriched = baseSelected.map((l: any) => ({
                                ...l,
                                lotNumber: l.lotNumber || idToLotNo.get(String(l.id)) || ''
                            }));
                            setSelectedLot(enhanceLotsWithFinishedYarn(enriched));
                        } catch (e) {
                            setSelectedLot(enhanceLotsWithFinishedYarn(baseSelected));
                        }
                    })();
                } else {
                    setSelectedLot(enhanceLotsWithFinishedYarn(baseSelected));
                }
            }
        } else {
            setFinishedYarnOptions([]);
            setSelectedYarnItemId("");
        }
    }, [processingIssueDtl, reset, finishFabricReceiveList, setValue, processContractList, millNameById, warehouseList]);

    useEffect(() => {
        if (showLotDialog && (yarnIssueDetails || []).length > 0) {
            setLotMeta((prev) => {
                const next = { ...prev };
                (yarnIssueDetails as any[]).forEach((lot: any) => {
                    const key = `${lot.baseLotId || lot.id}|${lot.lotYarnId || lot.yarnId || ''}`;
                    const pref = inwardIndex.get(key);
                    if (pref && !next[String(lot.id)]) {
                        next[String(lot.id)] = {
                            millId: String(pref.millId ?? ''),
                            warehouseId: String(pref.warehouseId ?? '')

                        };
                    }
                });
                return next;
            });
        }
    }, [showLotDialog, yarnIssueDetails, inwardIndex]);


    useEffect(() => {
        dispatch(getAllPurchaseOrders({}));
        const salesOrderParams = resolvedCompanyId ? { companyId: resolvedCompanyId } : {};
        dispatch(getAllSalesOrders(salesOrderParams));
        dispatch(getAllPoTypes({ fetchAll: true }));
        dispatch(getAllVendors({ fetchAll: true }));
        dispatch(getAllProductCategory({ fetchAll: true }));
        dispatch(getAllTermsConditions({ fetchAll: true }));
        dispatch(getAllWeavingContract({ fetchAll: true }));
        dispatch(getAllDyeingWorkOrdersByType({ type: "YARN", offset: 0, limit: 500 }));
        dispatch(getAllSubCategories({ fetchAll: true }));
        dispatch(getAllShipmentModes({ fetchAll: true }));
        dispatch(getAllFinishFabricReceivesByType("YARN"));
        dispatch(getAllYarnDispatch({ processType: "YARN" }));
        dispatch(getAllTransports({ fetchAll: true }));
        dispatch(getAllWarehouse({ fetchAll: true }));
        dispatch(getAllYarnMasters({ fetchAll: true }));
    }, [dispatch, resolvedCompanyId]);

    // Filter processing contracts to show only YARN type
    const yarnProcessContracts = useMemo(() => {
        return (processContractList || []).filter((contract: any) => contract.processType === "YARN");
    }, [processContractList]);

    // const validateForm = () => {
    //     const errors = {
    //         yarnDispatchDate: !watch("yarnDispatchDate"),
    //         vendorId: !watch("vendorId"),
    //         dyeingWorkOrderId: !watch("dyeingWorkOrderId"),
    //         orderQuantity: !watch("orderQuantity") || isNaN(Number(watch("orderQuantity"))),
    //         // Add validation for other required fields
    //     };

    //     setFormErrors(errors);
    //     return !Object.values(errors).some(error => error);
    // };


    const addItem = () => {
        if (editingIndex !== null) {
            const updatedItems = [...weavingContractItemDtl];
            updatedItems[editingIndex] = newItem;
            setweavingContractItemDtl(updatedItems);
            setEditingIndex(null);
        } else {
            setweavingContractItemDtl([...weavingContractItemDtl, newItem]);
        }
        setNewItem({
            productCategoryId: '',
            quantity: '',
            unit: '',
            price: '',
            netAmount: '',
            deliveryDate: '',
            remark: '',
            activeFlag: true,
        });
    };

    const editItem = (index: number) => {
        setNewItem(weavingContractItemDtl[index]);
        setEditingIndex(index);
    };

    const deleteItem = (index: number) => {
        setweavingContractItemDtl(weavingContractItemDtl.filter((_: any, i: number) => i !== index));
    };

    const onSubmit = async (data: YarnDispatchDyeingFormData) => {
        if (selectedLot.length === 0) {
            toast.error("Atleast dispatch one item");
            return;
        }
        const isEditMode = Boolean(processingIssueDtl?.id);
        let fabricDispatchId = data.fabricDispatchId || processingIssueDtl?.fabricDispatchId || "";
        if (!processingIssueDtl?.id && !fabricDispatchId) {
            try {
                const docResponse = await documentNumberService.generateDocumentNumber({
                    screenName: "Processing Issue Management",
                    tabName: "processIssueYarn",
                });
                fabricDispatchId = docResponse.documentNumber;
            } catch (error) {
                console.warn("Failed to generate document number:", error);
            }
        }
        isSavingRef.current = true;

        console.log("Form data:", data);

        if (!validateForm()) {
            alert("Please fill all required fields correctly");
            return;
        }


        if (!resolvedCompanyId) {

            alert("Company not selected. Please select a company.");

            return;

        }

        // Calculate total issue quantity from selected lots
        const totalIssueQty = selectedLot.reduce((sum: number, lot: any) => {
            return sum + (lot.issueQty ? Number(lot.issueQty) : 0);
        }, 0);

        const receivedQtyFromFinishForSubmit = (finishFabricReceiveList || [])
            .filter((receive: any) =>
                Number(receive.dyeingWorkOrderId) === Number(data.dyeingWorkOrderId) &&
                receive.processType === "YARN"
            )
            .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

        const parsedOrderQty = Number(data.orderQuantity || dispatchDetails.orderQuantity || 0);
        const normalizedOrderQty = Number.isNaN(parsedOrderQty) || parsedOrderQty === 0 ? null : parsedOrderQty;
        const balanceQty = normalizedOrderQty != null ? normalizedOrderQty - totalIssueQty : null;

        const payload = {
            fabricDispatchDate: data.fabricDispatchDate,
            vendorId: Number(data.vendorId),
            dyeingWorkOrderId: Number(data.dyeingWorkOrderId),
            lotNumber: data.lotNumber?.trim() || '',
            orderQuantity: normalizedOrderQty,
            dispatchedQuantity: null,
            receivedQuantity: null,
            balanceQuantity: balanceQty,
            costPerPound: Number(data.costPerPound),
            totalAmount: Number(data.totalAmount),
            colorId: data.colorId ? Number(data.colorId) : null,
            pantone: data.pantone,
            finishingId: data.finishingId ? Number(data.finishingId) : null,
            salesOrderId: data.salesOrderId ? Number(data.salesOrderId) : null,
            shipmentModeId: data.shipmentModeId ? Number(data.shipmentModeId) : null,
            lotId: data.lotId ? Number(data.lotId) : 0,
            remarks: data.remarks,
            transportId: data.transportId ? Number(data.transportId) : null,
            transportName: data.transportName,
            vehicleNo: data.vehicleNo,
            grossWt: Number(data.grossWt),
            activeFlag: data.activeFlag,
            processType: "YARN",
            finishedFabricCode: dispatchDetails.finishedFabricCode || "",
            finishedFabricName: dispatchDetails.finishedFabricName || "",
            greigeFabricCode: dispatchDetails.greigeFabricCode || "",
            greigeFabricName: dispatchDetails.greigeFabricName || "",
            fabricDispatchId: fabricDispatchId,
            companyId: resolvedCompanyId,
            yarnIssues: selectedLot.map((lot: any) => ({
                yarnName: lot.yarnName || `Yarn ${lot.id}`,
                lotId: typeof lot.id === 'string' && lot.id.includes('_')
                    ? parseInt(lot.id.split('_')[1]) || 0
                    : lot.id,
                lotNumber: lot.lotNumber,
                availableReqQty: Number(lot.availableQty),
                availableBags: lot.availableBags != null ? Number(lot.availableBags) : null,
                noOfBags: Number(lot.noOfBags ?? 0),
                kgsPerBag: lot.kgsPerBag != null ? Number(lot.kgsPerBag) : null,
                conesPerBag: lot.conesPerBag != null ? Number(lot.conesPerBag) : null,
                conesWeight: lot.conesWeight != null ? Number(lot.conesWeight) : null,
                issueQty: Number(lot.issueQty) || 0,
                millId: lot.millId ? Number(lot.millId) : null,
                warehouseId: lot.warehouseId ? Number(lot.warehouseId) : null,
                inwardId: lot.inwardId ?? null,
                orderItemId: lot.orderItemId ?? null,
                itemId: lot.itemId ?? null,
                activeFlag: lot.activeFlag !== false,
                finishedYarnId: lot.finishedYarnId || null,
                finishedYarnName: lot.finishedYarnName || null,
                greigeYarnId: lot.greigeYarnId || null,
                greigeYarn: lot.yarnName || null,
                inwardTypeId: lot.inwardTypeId ?? null,
                yarnInwardStockDetailsId: lot.yarnInwardStockDetailsId || null
            }))
        };

        console.log("Submitting yarn dispatch payload:", payload);

        try {
            // alert(JSON.stringify(payload));
            setIsSubmitting(true);
            if (processingIssueDtl?.id) {
                await dispatch(updateYarnDispatch({ id: processingIssueDtl.id, data: payload, processType: "YARN" })).unwrap();
            } else {
                // await dispatch(createYarnDispatch(payload)).unwrap();
                await dispatch(createYarnDispatch(payload)).unwrap();
                documentNumberService.clearMemoryCache("Processing Issue Management", "processIssueYarn");
            }
            navigate("/transaction/processing-issue-management", { state: { activeTab: "processIssueYarn" } });
        } catch (err: any) {
            console.error("Failed to save/update Yarn Dispatch:", err);
            console.error("Error details:", err.payload || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        reset();
        setValue("lotNumber", "");
        setValue("remarks", "");
        setValue("transportId", "");
        setValue("transportName", "");
        setValue("vehicleNo", "");
        setValue("grossWt", "");
        setSelectedLot([]);
        setSelectedDyeingWorkOrder(null);
        setFinishedYarnOptions([]);
        setSelectedYarnItemId("");
        setDispatchDetails({
            finishedFabricCode: "",
            finishedFabricName: "",
            greigeFabricCode: "",
            greigeFabricName: "",
            orderQuantity: "",
            dispatchedQuantity: "",
            receivedQuantity: "",
            balanceQuantity: ""
        });
    };

    const handleJobWorkChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
        setSelectedJobWork([]);
        setYarnRequirementDetails([]); // Clear previous details

        if (id) {
            try {
                const result = await dispatch(getWeavingContractById(id));
                console.log(result)
                const yarnRequired = result?.payload;

                if (yarnRequired?.yarnRequirements) {
                    // Map the yarn requirements to the format needed for display
                    const requirements = yarnRequired.yarnRequirements.map((yarn: any) => ({
                        yarnType: yarn.yarnType,
                        yarnCount: yarn.yarnCount,
                        gramsPerMeter: yarn.gramsPerMeter,
                        totalwarpReq: yarn.totalRequiredQty,
                        totalWarpIssued: yarn.totalIssuedQty || 0, // Default to 0 if not provided
                        balanceWarpToIssue: yarn.totalRequiredQty - (yarn.totalIssuedQty || 0)
                    }));

                    setYarnRequirementDetails(requirements);
                    setSelectedJobWork(yarnRequired); // Store the entire job work data if needed
                }
            } catch (error) {
                console.error("Error fetching weaving contract by ID:", error);
            }
        }
    };
    const handleDyeingWorkOrderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
        if (id) {
            try {
                const selectedOrder = processContractList.find((order: any) => order.id === id);
                setSelectedDyeingWorkOrder(selectedOrder);

                console.log("Selected Order:", selectedOrder);
                console.log("Process Type:", selectedOrder?.processType);
                console.log("Yarn Items:", selectedOrder?.yarnItems);
                console.log("Fabric Items:", selectedOrder?.fabricItems);

                const yarnItems = Array.isArray(selectedOrder?.yarnItems) ? selectedOrder.yarnItems : [];
                setFinishedYarnOptions(yarnItems);

                let item = null;
                const processType = "YARN";

                if (selectedOrder?.processType === "YARN" && yarnItems.length > 0) {
                    item = yarnItems[0];
                    setYarnRequirementDetails(yarnItems.map((yi: any) => ({
                        actualYarnId: yi.greigeYarnCodeId || yi.finishedYarnCodeId,
                        yarnName: yi.greigeYarnName || yi.finishedYarnName,
                        yarnCount: "",
                        gramsPerMeter: "",
                        totalwarpReq: yi.quantity || "0",
                        totalWarpIssued: "0",
                        balanceWarpToIssue: yi.quantity || "0",
                        activeFlag: true
                    })));
                } else if (selectedOrder?.processType === "FABRIC" && selectedOrder?.fabricItems && selectedOrder.fabricItems.length > 0) {
                    console.warn("Selected contract is for FABRIC process, but this is YARN dispatch");
                    setYarnRequirementDetails([]);
                } else {
                    setYarnRequirementDetails([]);
                }

                setSelectedYarnItemId(item ? getFinishedYarnIdentifier(item) : "");

                // if (item) {
                //     const receivedQty = (finishFabricReceiveList || [])
                //         .filter((receive: any) =>
                //             receive.dyeingWorkOrderId === id &&
                //             receive.processType === "YARN"
                //         )
                //         .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

                //     setDispatchDetails({
                //         finishedFabricCode: item.finishedYarnCodeId || "",
                //         finishedFabricName: item.finishedYarnName || "",
                //         greigeFabricCode: item.greigeYarnCodeId || "",
                //         greigeFabricName: item.greigeYarnName || "",
                //         orderQuantity: item.quantity || "",
                //         dispatchedQuantity: "0",
                //         receivedQuantity: receivedQty.toString(),
                //         balanceQuantity: item.quantity || ""
                //     });

                //     if (selectedOrder?.vendorId != null) setValue("vendorId", String(selectedOrder.vendorId));
                //     if (item.quantity != null) setValue("orderQuantity", String(item.quantity));
                //     if (item.colorId != null) setValue("colorId", String(item.colorId));
                //     if (item.pantone != null) setValue("pantone", String(item.pantone));
                //     if (selectedOrder?.remarks != null) setValue("remarks", String(selectedOrder.remarks));
                //     else if (selectedOrder?.remark != null) setValue("remarks", String(selectedOrder.remark));

                //     setValue("processType", processType);
                //     setValue("lotNumber", "");

                //     if (selectedOrder?.salesOrderNo != null && Array.isArray(salesOrderList)) {
                //         const so = salesOrderList.find((s: any) => String(s.salesOrderNo) === String(selectedOrder.salesOrderNo));
                //         if (so?.id != null) setValue("salesOrderId", String(so.id));
                //     }

                //     const receivedQtyFromFinish = (finishFabricReceiveList || [])
                //         .filter((receive: any) =>
                //             receive.dyeingWorkOrderId === id &&
                //             receive.processType === "YARN"
                //         )
                //         .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

                //     setValue("dispatchedQuantity", "0");
                //     setValue("receivedQuantity", receivedQtyFromFinish.toString());
                //     if (item.quantity != null) setValue("balanceQuantity", String(item.quantity));
                // } 
                if (item) {
                    const finishedCode = getFinishedYarnIdentifier(item);
                    const receivedQty = (finishFabricReceiveList || [])
                        .filter((receive: any) =>
                            Number(receive.dyeingWorkOrderId) === id &&
                            receive.processType === "YARN" &&
                            getFinishedYarnIdentifier(receive) === finishedCode
                        )
                        .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

                    let dispatchedQty = 0;
                    try {
                        const dispatchResponse = await apiService.get('/fabric-dispatch?offset=0&limit=100');
                        const allDispatches = Array.isArray(dispatchResponse) ? dispatchResponse : dispatchResponse.data || [];

                        dispatchedQty = allDispatches
                            .filter((dispatch: any) =>
                                Number(dispatch.dyeingWorkOrderId) === id &&
                                dispatch.processType === "YARN" &&
                                (!processingIssueDtl?.id || dispatch.id !== processingIssueDtl.id)
                            )
                            .reduce((total: number, dispatchItem: any) => {
                                const issueQtySum = (dispatchItem.yarnIssues || [])
                                    .filter((issue: any) => {
                                        const issueIdentifier = getFinishedYarnIdentifier(issue);
                                        return issueIdentifier === finishedCode ||
                                            (!issue.finishedYarnId && !issue.finishedYarnCodeId && !issue.greigeYarnCodeId && !issue.yarnId && String(dispatchItem.finishedFabricCode || "") === finishedCode);
                                    })
                                    .reduce((sum: number, issue: any) => sum + (Number(issue.issueQty) || 0), 0);
                                return total + issueQtySum;
                            }, 0);

                        console.log("All dispatches:", allDispatches);
                        console.log("Filtered dispatches for id:", id, allDispatches.filter((dispatch: any) => Number(dispatch.dyeingWorkOrderId) === id && dispatch.processType === "YARN"));
                        console.log("Calculated dispatchedQty:", dispatchedQty);
                    } catch (error) {
                        console.error("Failed to fetch dispatch data:", error);
                        dispatchedQty = 0;
                    }

                    setDispatchDetails({
                        finishedFabricCode: item.finishedCode || "",
                        finishedFabricName: item.finishedYarnName || "",
                        greigeFabricCode: item.greigeYarnCodeId || "",
                        greigeFabricName: item.greigeYarnName || "",
                        orderQuantity: item.quantity || "",
                        dispatchedQuantity: dispatchedQty.toString(),
                        receivedQuantity: receivedQty.toString(),
                        balanceQuantity: item.quantity || ""
                    });

                    if (selectedOrder?.vendorId != null) setValue("vendorId", String(selectedOrder.vendorId));
                    if (item.quantity != null) setValue("orderQuantity", String(item.quantity));
                    if (item.colorId != null) setValue("colorId", String(item.colorId));
                    if (item.pantone != null) setValue("pantone", String(item.pantone));
                    if (selectedOrder?.remarks != null) setValue("remarks", String(selectedOrder.remarks));

                    setValue("processType", processType);

                    if (selectedOrder?.salesOrderNo != null && Array.isArray(salesOrderList)) {
                        const so = salesOrderList.find((s: any) => String(s.salesOrderNo) === String(selectedOrder.salesOrderNo));
                        if (so?.id != null) setValue("salesOrderId", String(so.id));
                    }

                    const receivedQtyFromFinish = (finishFabricReceiveList || [])
                        .filter((receive: any) =>
                            Number(receive.dyeingWorkOrderId) === id &&
                            receive.processType === "YARN" &&
                            getFinishedYarnIdentifier(receive) === finishedCode
                        )
                        .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

                    setValue("dispatchedQuantity", dispatchedQty.toString());
                    setValue("receivedQuantity", receivedQtyFromFinish.toString());
                    if (item.quantity != null) setValue("balanceQuantity", String(item.quantity));
                }
                else {
                    console.warn("No valid yarn items found in selected contract");
                    setFinishedYarnOptions([]);
                    setSelectedYarnItemId("");
                    setDispatchDetails({
                        finishedFabricCode: "",
                        finishedFabricName: "",
                        greigeFabricCode: "",
                        greigeFabricName: "",
                        orderQuantity: "",
                        dispatchedQuantity: "",
                        receivedQuantity: "",
                        balanceQuantity: ""
                    });
                    setValue("vendorId", "");
                    setValue("orderQuantity", "");
                    setValue("colorId", "");
                    setValue("pantone", "");
                    setValue("lotNumber", "");
                    setValue("processType", "YARN");
                }
            } catch (error) {
                console.error("Error fetching Processing Contract details:", error);
                setFinishedYarnOptions([]);
                setSelectedYarnItemId("");
            }
        } else {
            setSelectedDyeingWorkOrder(null);
            setYarnRequirementDetails([]);
            setDispatchDetails({
                // finishedCode: "",
                // greigeCode: "",
                finishedFabricCode: "",
                finishedFabricName: "",
                greigeFabricCode: "",
                greigeFabricName: "",
                orderQuantity: "",
                dispatchedQuantity: "",
                receivedQuantity: "",
                balanceQuantity: ""
            });
            setFinishedYarnOptions([]);
            setSelectedYarnItemId("");
            setValue("vendorId", "");
            setValue("orderQuantity", "");
            setValue("colorId", "");
            setValue("pantone", "");
            setValue("finishingId", "");
            setValue("salesOrderId", "");
            setValue("shipmentModeId", "");
            setValue("remarks", "");
            setValue("lotNumber", "");
            setValue("dispatchedQuantity", "");
            setValue("receivedQuantity", "");
            setValue("balanceQuantity", "");
            setValue("processType", "YARN");
        }
    };

    // const applyYarnSelection = (selectedId: string) => {
    //     setSelectedYarnItemId(selectedId);
    //     const yarnItem = finishedYarnOptions.find((yi: any) => getFinishedYarnIdentifier(yi) === selectedId);
    //     if (yarnItem) {
    //         const orderQty = yarnItem.quantity != null ? String(yarnItem.quantity) : "";
    //         setDispatchDetails(prev => ({
    //             ...prev,
    //             finishedFabricCode: yarnItem.finishedYarnCodeId || "",
    //             finishedFabricName: yarnItem.finishedYarnName || "",
    //             greigeFabricCode: yarnItem.greigeYarnCodeId || "",
    //             greigeFabricName: yarnItem.greigeYarnName || "",
    //             orderQuantity: orderQty,
    //             balanceQuantity: orderQty
    //         }));
    //         setValue("orderQuantity", orderQty);
    //         setValue("balanceQuantity", orderQty);
    //         if (yarnItem.colorId != null) setValue("colorId", String(yarnItem.colorId));
    //         if (yarnItem.pantone != null) setValue("pantone", String(yarnItem.pantone));
    //     } else {
    //         setDispatchDetails(prev => ({
    //             ...prev,
    //             finishedFabricCode: "",
    //             finishedFabricName: "",
    //             greigeFabricCode: "",
    //             greigeFabricName: "",
    //             orderQuantity: "",
    //             balanceQuantity: ""
    //         }));
    //         setValue("orderQuantity", "");
    //         setValue("balanceQuantity", "");
    //     }
    // };
    const applyYarnSelection = (selectedId: string) => {
        setSelectedYarnItemId(selectedId);
        const yarnItem = finishedYarnOptions.find((yi: any) => getFinishedYarnIdentifier(yi) === selectedId);
        if (yarnItem) {
            const dyeingWorkOrderId = watch("dyeingWorkOrderId");
            const finishedCode = selectedId;

            // Calculate Received Quantity for this specific Finished Yarn item
            const receivedQtyFromFinish = (finishFabricReceiveList || [])
                .filter((receive: any) =>
                    Number(receive.dyeingWorkOrderId) === Number(dyeingWorkOrderId) &&
                    receive.processType === "YARN" &&
                    getFinishedYarnIdentifier(receive) === finishedCode
                )
                .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

            // Calculate previously Dispatched Quantity for this specific Finished Yarn item
            const dispatchedQtyFromPrev = (yarnDispatchDyingList || [])
                .filter((dispatch: any) =>
                    Number(dispatch.dyeingWorkOrderId) === Number(dyeingWorkOrderId) &&
                    dispatch.processType === "YARN" &&
                    (!processingIssueDtl?.id || dispatch.id !== processingIssueDtl.id)
                )
                .reduce((total: number, dispatchItem: any) => {
                    const issueQtySum = (dispatchItem.yarnIssues || [])
                        .filter((issue: any) => {
                            const issueIdentifier = getFinishedYarnIdentifier(issue);
                            return issueIdentifier === finishedCode ||
                                (!issue.finishedYarnId && !issue.finishedYarnCodeId && !issue.greigeYarnCodeId && !issue.yarnId && String(dispatchItem.finishedFabricCode || "") === finishedCode);
                        })
                        .reduce((sum: number, issue: any) => sum + (Number(issue.issueQty) || 0), 0);
                    return total + issueQtySum;
                }, 0);

            const orderQty = yarnItem.quantity != null ? Number(yarnItem.quantity) : 0;
            const currentFormQty = selectedLot
                .filter((lot: any) => getFinishedYarnIdentifier(lot) === finishedCode)
                .reduce((sum: number, lot: any) => sum + (Number(lot.issueQty) || 0), 0);

            const totalCumulativeDispatched = dispatchedQtyFromPrev + currentFormQty;
            const balanceQty = orderQty - totalCumulativeDispatched;

            setDispatchDetails(prev => ({
                ...prev,
                finishedFabricCode: finishedCode,
                finishedFabricName: yarnItem.finishedYarnName || "",
                greigeFabricCode: yarnItem.greigeYarnCodeId || "",
                greigeFabricName: yarnItem.greigeYarnName || "",
                orderQuantity: String(orderQty),
                dispatchedQuantity: String(totalCumulativeDispatched),
                receivedQuantity: String(receivedQtyFromFinish),
                balanceQuantity: String(balanceQty)
            }));

            setValue("orderQuantity", String(orderQty));
            setValue("receivedQuantity" as any, String(receivedQtyFromFinish) as any);
            setValue("dispatchedQuantity" as any, String(totalCumulativeDispatched) as any);
            setValue("balanceQuantity", String(balanceQty));

            if (yarnItem.colorId != null) setValue("colorId", String(yarnItem.colorId));
            if (yarnItem.pantone != null) setValue("pantone", String(yarnItem.pantone));
        } else {
            setDispatchDetails(prev => ({
                ...prev,
                finishedFabricCode: "",
                finishedFabricName: "",
                greigeFabricCode: "",
                greigeFabricName: "",
                orderQuantity: "",
                dispatchedQuantity: "",
                receivedQuantity: "",
                balanceQuantity: ""
            }));
            setValue("orderQuantity", "");
            setValue("receivedQuantity" as any, "");
            setValue("dispatchedQuantity" as any, "");
            setValue("balanceQuantity", "");
        }
    };

    const handleFinishedYarnSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        applyYarnSelection(e.target.value);
    };

    const handleOrderQuantitySelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        applyYarnSelection(e.target.value);
    };

    const handleLotSelect = (lotDetail: LotDetail) => {
        const normalizedLot: LotDetail = { ...lotDetail };
        const normalizedConesPerBag = Number(normalizedLot.conesPerBag ?? 0);
        const normalizedKgsPerBag = Number(normalizedLot.kgsPerBag ?? 0);
        const normalizedNoOfBags = normalizedLot.noOfBags != null ? Number(normalizedLot.noOfBags) : 0;
        if ((normalizedLot.conesWeight == null || Number.isNaN(Number(normalizedLot.conesWeight))) && normalizedConesPerBag > 0 && normalizedKgsPerBag > 0) {
            normalizedLot.conesWeight = Number((normalizedKgsPerBag / normalizedConesPerBag).toFixed(3));
        }
        const derivedIssueQty = normalizedLot.issueQty != null
            ? Number(normalizedLot.issueQty)
            : Number((normalizedNoOfBags * normalizedKgsPerBag).toFixed(3));
        setSelectedLot((prev: LotDetail[]) => {
            const exists = prev.some(lot => lot.id === normalizedLot.id);
            if (exists) {
                return prev.filter(lot => lot.id !== normalizedLot.id);
            }
            return [
                ...prev,
                {
                    ...normalizedLot,
                    yarnInwardStockDetailsId: normalizedLot.yarnInwardStockDetailsId,
                    conesPerBag: Number.isNaN(normalizedConesPerBag) ? undefined : normalizedConesPerBag,
                    noOfBags: Number.isNaN(normalizedNoOfBags) ? 0 : normalizedNoOfBags,
                    issueQty: Number.isNaN(derivedIssueQty) ? 0 : derivedIssueQty
                }
            ];
        });
    };

    const handleNoOfBagsChange = (rowIndex: number, rawValue: string) => {
        setSelectedLot((prev: LotDetail[]) => {
            if (rowIndex < 0 || rowIndex >= prev.length) {
                return prev;
            }
            const next = [...prev];
            const lot = { ...next[rowIndex] };
            if (rawValue === '') {
                lot.noOfBags = null;
                lot.issueQty = null;
            } else {
                const parsed = Number(rawValue);
                const safeBags = Number.isNaN(parsed) ? 0 : parsed;
                const kgsPerBag = Number(lot.kgsPerBag ?? 0);
                lot.noOfBags = safeBags;
                lot.issueQty = calculateIssueQty(safeBags, kgsPerBag);
            }
            next[rowIndex] = lot;
            return next;
        });
    };


    const handleYarnIssue = async () => {
        try {
            const dyeingWorkOrderId = watch("dyeingWorkOrderId");
            if (!dyeingWorkOrderId) {
                toast.error("Please select a Processing Contract first");
                return;
            }

            // Determine which item IDs to fetch stock for
            let itemIds = "";
            let explicitSelectedYarn: any = null;

            if (selectedYarnItemId) {
                explicitSelectedYarn = finishedYarnOptions.find(opt => getFinishedYarnIdentifier(opt) === selectedYarnItemId);
                if (explicitSelectedYarn) {
                    itemIds = String(explicitSelectedYarn.greigeYarnCodeId || explicitSelectedYarn.finishedYarnCodeId || explicitSelectedYarn.id);
                }
            }

            if (!itemIds) {
                if (yarnRequirementDetails.length > 0) {
                    itemIds = yarnRequirementDetails
                        .map((req: any) => req.actualYarnId || req.yarnName)
                        .filter(Boolean)
                        .join(',');
                } else if (selectedDyeingWorkOrder?.yarnItems?.length > 0) {
                    itemIds = selectedDyeingWorkOrder.yarnItems
                        .map((yi: any) => yi.greigeYarnCodeId)
                        .filter(Boolean)
                        .join(',');
                }
            }

            if (!itemIds) {
                toast.error("No valid yarn IDs found in requirements");
                return;
            }

            console.log("Making API call with itemIds:", itemIds);
            const response = await apiService.get(
                buildYarnInwardStockUrl(itemIds, resolvedCompanyId)
            );

            // await apiService.get(
            //     `/sizing-yarn-issues/yarn-inward-stock?itemId=${itemIds}`
            // );
            console.log("API Response:", response);

            const apiData = response || [];
            if (Array.isArray(apiData) && apiData.length > 0) {
                const uniqueLots = new Map();

                apiData.forEach((item: any, index: number) => {
                    const uniqueKey = `${item.orderItemId}_${item.inwardId}_${item.lotNo}_${item.itemId}_${item.warehouseId || 'null'}_${item.millId || 'null'}`;

                    if (!uniqueLots.has(uniqueKey)) {
                        const availableQty = Number(item.availableQty) || 0;
                        const availableBags = Number(item.availableBags) || 0;
                        const kgsPerBag = Number(item.kgsPerBag) || 0;
                        const conesPerBag = Number(item.conesPerBag) || 0;
                        const conesWeight = item.conesWeight != null ? Number(item.conesWeight) : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);

                        const warehouseId = item.warehouseId ?? null;
                        const warehouseName = warehouseId ? warehouseList.find((w: any) => String(w.id) === String(warehouseId))?.warehouseName || '' : '';
                        const millName = item.millId ? (millOptions.find((m: any) => String(m.id) === String(item.millId))?.subCategoryName || '') : '';

                        const yarnMaster = yarnList?.find((y: any) => y.id === item.itemId);
                        const yarnName = yarnMaster?.yarnName || `Yarn-${item.itemId}`;

                        // Use explicitly selected yarn if it matches the item ID, otherwise find matching yarn
                        let matchedYarn = null;
                        if (explicitSelectedYarn && (
                            String(explicitSelectedYarn.finishedYarnCodeId) === String(item.itemId) ||
                            String(explicitSelectedYarn.greigeYarnCodeId) === String(item.itemId) ||
                            String(explicitSelectedYarn.id) === String(item.itemId)
                        )) {
                            matchedYarn = explicitSelectedYarn;
                        } else {
                            matchedYarn = finishedYarnOptions.find(opt =>
                                String(opt.finishedYarnCodeId) === String(item.itemId) ||
                                String(opt.greigeYarnCodeId) === String(item.itemId) ||
                                String(opt.id) === String(item.itemId)
                            );
                        }

                        uniqueLots.set(uniqueKey, {
                            id: `${item.orderItemId}_${index}`,
                            lotId: item.orderItemId,
                            uniqueKey: uniqueKey,
                            yarnName: yarnName,
                            lotNumber: item.lotNo || 'N/A',
                            availableQty: availableQty,
                            availableBags,
                            kgsPerBag,
                            conesPerBag,
                            conesWeight,
                            issueQty: null,
                            noOfBags: 0,
                            activeFlag: true,
                            baseLotId: item.orderItemId,
                            lotYarnId: item.itemId,
                            inwardId: item.inwardId,
                            orderItemId: item.orderItemId,
                            itemId: item.itemId,
                            millId: item.millId,
                            millName: millName,
                            warehouseId: warehouseId ? String(warehouseId) : '',
                            warehouseName,
                            finishedYarnId: matchedYarn ? getFinishedYarnIdentifier(matchedYarn) : "",
                            finishedYarnName: matchedYarn ? (matchedYarn.finishedYarnName || matchedYarn.greigeYarnName || matchedYarn.yarnName) : "",
                            inwardTypeId: item.inwardTypeId,
                            yarnInwardStockDetailsId: item.id || null,
                            inwardNo: item.inwardNo || 'N/A',
                            poCategoryId: item.poCategoryId,
                        });
                    }
                });

                const transformedLots = Array.from(uniqueLots.values());
                console.log("Transformed lots (deduplicated):", transformedLots);
                const excludedIds = [2, 3];
                const purchaseInwardLots = transformedLots.filter((lot: any) =>
                    !excludedIds.includes(Number(lot.inwardTypeId))
                );

                setYarnIssueDetails(purchaseInwardLots);
                // const purchaseInwardLots = transformedLots.filter((lot: any) =>
                //     Number(lot.inwardTypeId) === 1 ||
                //     String(lot.inwardType || '').toUpperCase() === 'PURCHASE_INWARD'
                // );
                // setYarnIssueDetails(purchaseInwardLots);
                setShowLotDialog(true);
            } else {
                setYarnIssueDetails([]);
                toast.info("No yarn stock available for this processing contract");
            }
        } catch (error: any) {
            console.error("Error fetching yarn inward stock:", error);
            toast.error(error?.response?.data?.message || "Failed to fetch yarn stock data");
            setYarnIssueDetails([]);
        }
    };


    return (
        <div className="p-6 pt-16">
            <div className="p-6 bg-white shadow-md rounded-lg">
                <div className="flex justify-between items-center border-b pb-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/transaction/processing-issue-management", { state: { activeTab: "processIssueYarn" } })}
                            className="mr-auto"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Back
                        </Button>
                        <h2 className="text-2xl font-semibold">Yarn Dispatch for Dyeing</h2>
                    </div>


                </div>
                <div className="space-y-6">
                    <div className="mb-8">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                <button
                                    onClick={() => setActiveTab('orderDetails')}
                                    className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'orderDetails'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 Inward Ordershover:border-gray-300'
                                        }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    Details
                                </button>
                            </nav>
                        </div>
                    </div>
                    {/* Order Details Card */}
                    {activeTab === "orderDetails" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm mb-1 font-medium">Yarn Dispatch No</label>
                                        <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                                            {...register('fabricDispatchId')} readOnly />
                                    </div>
                                    {/* Date Field */}
                                    <div>
                                        <label className="block text-sm font-medium">Dispatch Date <span className="text-red-600">*</span></label>
                                        <input
                                            type="date"
                                            {...register("fabricDispatchDate", { required: "Dispatch date is required" })}
                                            className={`input mt-1 ${errors.fabricDispatchDate ? 'border-red-500' : ''}`}
                                            placeholder="Select dispatch date"
                                        />
                                        {errors.fabricDispatchDate && (
                                            <p className="mt-1 text-sm text-red-600">{errors.fabricDispatchDate.message}</p>
                                        )}
                                    </div>
                                    {/* Processing Contract No Field */}
                                    <div>
                                        <label className="block text-sm font-medium">Processing Contract No <span className="text-red-600">*</span></label>
                                        <CommonSearchableSelect
                                            placeholder="Select Processing Contract No"
                                            value={watch("dyeingWorkOrderId") || ""}
                                            options={yarnProcessContracts?.map((dyn: any) => ({
                                                value: String(dyn.id),
                                                label: dyn.dyeingWorkOrderNo,
                                                activeFlag: dyn.activeFlag ?? true,
                                            }))}
                                            filterActive
                                            {...register("dyeingWorkOrderId", { required: "Processing Contract No is required" })}
                                            onValueChange={(value) => {
                                                setValue("dyeingWorkOrderId", value, { shouldValidate: true });
                                                // Handle the onChange logic manually since we are using onValueChange
                                                const event = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
                                                handleDyeingWorkOrderChange(event);
                                            }}
                                            error={errors.dyeingWorkOrderId?.message}
                                        />
                                    </div>

                                    {/* Vendor Field */}
                                    <div>
                                        <label className="block text-sm font-medium">Vendor <span className="text-red-600">*</span></label>
                                        <CommonSearchableSelect
                                            placeholder="Select Vendor"
                                            value={watch("vendorId") || ""}
                                            options={processVendors?.map((vendor: any) => ({
                                                value: String(vendor.id),
                                                label: vendor.vendorName,
                                                activeFlag: vendor.activeFlag ?? true,
                                            }))}
                                            filterActive
                                            {...register("vendorId", { required: "Vendor is required" })}
                                            onValueChange={(value) => setValue("vendorId", value, { shouldValidate: true })}
                                            error={errors.vendorId?.message}
                                        />
                                    </div>



                                    <div>
                                        <label className="block text-sm font-medium">
                                            Select Colour
                                        </label>
                                        <CommonSearchableSelect
                                            placeholder="Select a Colour"
                                            value={watch("colorId") || ""}
                                            options={colours?.map((category: any) => ({
                                                value: String(category.id),
                                                label: category.subCategoryName,
                                                activeFlag: category.activeFlag ?? true,
                                            }))}
                                            filterActive
                                            {...register("colorId")}
                                            onValueChange={(value) => setValue("colorId", value, { shouldValidate: true })}
                                        />
                                    </div>
                                    {/* <div>
                                        <label className="block text-sm font-medium">Select Color</label>
                                        <select {...register("colorId")} className="input mt-1">
                                            <option value="">Select Color</option>
                                            {colours?.map((sbc: any) => (
                                                <option key={sbc.id} value={sbc.id}>{sbc.subCategoryName}</option>
                                            ))}
                                        </select>
                                    </div> */}
                                    <div>
                                        <label className="block text-sm font-medium">Pantone</label>
                                        <input {...register("pantone")} className="input mt-1" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Finishing</label>
                                        <CommonSearchableSelect
                                            placeholder="Select a Dyeing Work No"
                                            value={watch("finishingId") || ""}
                                            options={processContractList?.map((jwn: any) => ({
                                                value: String(jwn.id),
                                                label: jwn.dyeingWorkOrderNo,
                                                activeFlag: jwn.activeFlag ?? true,
                                            }))}
                                            filterActive
                                            {...register("finishingId")}
                                            onValueChange={(value) => setValue("finishingId", value, { shouldValidate: true })}
                                        />
                                    </div>
                                    {/* <div>
                                    <label className="block text-sm font-medium">Sales Order</label>
                                    <input {...register("salesOrderId", { required: "Sales Order No is required" })} className="input mt-1" />
                                </div> */}
                                    <div>
                                        <label className="block text-sm font-medium">Sales Order</label>
                                        <CommonSearchableSelect
                                            placeholder="Select sales Order"
                                            value={watch("salesOrderId") || ""}
                                            options={salesOrderList?.map((sm: any) => ({
                                                value: String(sm.id),
                                                label: sm.salesOrderNo,
                                                activeFlag: sm.activeFlag ?? true,
                                            }))}
                                            filterActive
                                            {...register("salesOrderId")}
                                            onValueChange={(value) => setValue("salesOrderId", value, { shouldValidate: true })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Ship Via</label>
                                        <CommonSearchableSelect
                                            placeholder="Select a Ship Via"
                                            value={watch("shipmentModeId") || ""}
                                            options={shipmentModesList.map((sm: any) => ({
                                                value: String(sm.id),
                                                label: sm.modeName,
                                                activeFlag: sm.activeFlag ?? true,
                                            }))}
                                            filterActive
                                            {...register("shipmentModeId")}
                                            onValueChange={(value) => setValue("shipmentModeId", value, { shouldValidate: true })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Lot Number <span className="text-red-600">*</span></label>
                                        <input
                                            type="text"
                                            {...register("lotNumber", { required: "Lot Number is required" })}
                                            className={`input mt-1 ${errors.lotNumber ? 'border-red-500' : ''}`}
                                            placeholder="Enter lot number"
                                        />
                                        {errors.lotNumber && (
                                            <p className="mt-1 text-sm text-red-600">{errors.lotNumber.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Transport Name</label>
                                        <CommonSearchableSelect
                                            placeholder="Select Transport"
                                            value={watch("transportId") || ""}
                                            options={transportOptions.map((option: any) => ({
                                                value: String(option.id),
                                                label: option.name,
                                                activeFlag: option.activeFlag ?? true,
                                            }))}
                                            filterActive
                                            {...register("transportId")}
                                            onValueChange={(value) => {
                                                setValue("transportId", value, { shouldValidate: true });
                                                const transport = transportOptions.find(t => String(t.id) === value);
                                                if (transport) {
                                                    setValue("transportName", transport.name);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Vehicle No</label>
                                        <input
                                            type="text"
                                            {...register("vehicleNo")}
                                            className="input mt-1"
                                            placeholder="Enter vehicle number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Gross Wt</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            {...register("grossWt")}
                                            className="input mt-1"
                                            placeholder="Calculated Gross Wt"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Remarks</label>
                                        <textarea {...register("remarks")} className="input mt-1" placeholder="Enter remarks"></textarea>
                                    </div>
                                </div>
                                <input type="hidden" {...register("orderQuantity", {
                                    min: { value: 0.01, message: "Must be greater than 0" }
                                })} />
                            </CardContent>
                        </Card>
                    )}
                    {/* Order Details Card End */}

                    {/* {selectedDyeingWorkOrder && ( */}
                    <>
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Dispatch Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Finished Yarn</label>
                                        <CommonSearchableSelect
                                            placeholder="Select Finished Yarn"
                                            value={selectedYarnItemId}
                                            options={finishedYarnOptions.map((option: any) => ({
                                                value: getFinishedYarnIdentifier(option),
                                                label: option.finishedYarnName || option.greigeYarnName || option.yarnName || `Yarn ${option.id}`,
                                                activeFlag: option.activeFlag ?? true,
                                            }))}
                                            filterActive
                                            onValueChange={(value) => {
                                                const event = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
                                                handleFinishedYarnSelectionChange(event);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Greige Yarn</label>
                                        <input
                                            value={dispatchDetails.greigeFabricName}
                                            className="input mt-1"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Order Quantity</label>
                                        <input
                                            value={dispatchDetails.orderQuantity}
                                            className="input mt-1"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Dispatched Quantity</label>
                                        <input
                                            value={dispatchDetails.dispatchedQuantity}
                                            className="input mt-1"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Received Quantity</label>
                                        <input
                                            value={dispatchDetails.receivedQuantity}
                                            className="input mt-1"
                                            readOnly
                                        />
                                    </div>

                                    {/* <div>
                                    <label className="block text-sm font-medium text-secondary-700">Greige Fabric Name</label>
                                    <input
                                        value={dispatchDetails.greigeFabricName}
                                        className="input mt-1"
                                        readOnly
                                    />
                                </div> */}
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">Balance Quantity</label>
                                        <input
                                            value={dispatchDetails.balanceQuantity}
                                            className="input mt-1"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 text-right">
                                    <Button
                                        onClick={handleYarnIssue}
                                        className="bg-primary hover:bg-primary text-white"
                                    // disabled={!selectedDyeingWorkOrder}
                                    >
                                        <Plus size={18} className="mr-2" />
                                        Yarn Dispatch
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="items-center">
                                    <span>Yarn Issue Details</span>

                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border p-2">Yarn Name</th>
                                            <th className="border p-2">Inward Type</th>
                                            {/* <th className="border p-2">Finished Yarn</th> */}
                                            <th className="border p-2">Lot No</th>
                                            <th className="border p-2">Available Bags</th>
                                            <th className="border p-2">Cones/Bag</th>
                                            <th className="border p-2">Cones Weight</th>
                                            <th className="border p-2">Available Qty</th>
                                            <th className="border p-2">Mill</th>
                                            <th className="border p-2">Warehouse</th>
                                            <th className="border p-2">Issuing No of Bags</th>
                                            <th className="border p-2">Kgs/Bag</th>
                                            <th className="border p-2">Issue Qty</th>
                                            <th className="border p-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedLot.length > 0 ? (
                                            selectedLot.map((detail: LotDetail, index: number) => {
                                                const millDisplayName = detail.millName || (detail.millId != null ? (millNameById.get(String(detail.millId)) || '') : '') || '-';
                                                return (
                                                    <tr key={`${detail.id}-${detail.inwardId}-${index}`}>
                                                        <td className="border p-2 text-center">{detail.yarnName}</td>
                                                        <td className="border p-2 text-center">
                                                            {detail.inwardTypeId ? inwardTypeLabelById.get(Number(detail.inwardTypeId)) || 'N/A' : 'N/A'}
                                                        </td>
                                                        {/* <td className="border p-2">{detail.finishedYarnName || '-'}</td> */}
                                                        <td className="border p-2 text-center">{detail.lotNumber}</td>
                                                        <td className="border p-2 text-center">{detail.availableBags ?? 0}</td>

                                                        <td className="border p-2 text-center">{detail.conesPerBag ?? 0}</td>
                                                        <td className="border p-2 text-center">{Number(detail.conesWeight ?? 0).toFixed(3)}</td>
                                                        <td className="border p-2 text-center">{detail.availableQty ?? 0}</td>
                                                        <td className="border p-2 text-center">{millDisplayName}</td>
                                                        <td className="border p-2 text-center">{detail.warehouseName || '-'}</td>
                                                        <td className="border p-2">
                                                            <Input
                                                                type="number"
                                                                inputMode="numeric"
                                                                value={detail.noOfBags ?? 0}
                                                                onChange={(e) => handleNoOfBagsChange(index, e.target.value)}
                                                                min={0}
                                                            />
                                                        </td>
                                                        <td className="border p-2 text-center">{Number(detail.kgsPerBag ?? 0).toFixed(3)}</td>

                                                        <td className="border p-2">
                                                            <Input
                                                                type="number"
                                                                value={detail.issueQty ?? 0}
                                                                onChange={(e) => {
                                                                    const value = e.target.value === '' ? null : Number(e.target.value);
                                                                    const newDetails = [...selectedLot];
                                                                    newDetails[index] = {
                                                                        ...newDetails[index],
                                                                        issueQty: value
                                                                    };
                                                                    setSelectedLot(newDetails);
                                                                }}
                                                                min={0}
                                                                max={detail.availableQty}
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                                                    onClick={() => {
                                                                        const lot = detail;
                                                                        // Try to find matching yarn item in options
                                                                        const matchedYarn = finishedYarnOptions.find(opt =>
                                                                            String(opt.finishedYarnCodeId) === String(lot.itemId) ||
                                                                            String(opt.greigeYarnCodeId) === String(lot.itemId) ||
                                                                            String(opt.id) === String(lot.itemId)
                                                                        );

                                                                        if (matchedYarn) {
                                                                            applyYarnSelection(getFinishedYarnIdentifier(matchedYarn));
                                                                            toast.info(`Switched to ${matchedYarn.finishedYarnName || matchedYarn.greigeYarnName || 'selected yarn'}`);
                                                                        } else {
                                                                            // Fallback: search by name if ID match fails
                                                                            const matchedByName = finishedYarnOptions.find(opt =>
                                                                                opt.finishedYarnName === lot.yarnName ||
                                                                                opt.greigeYarnName === lot.yarnName ||
                                                                                opt.yarnName === lot.yarnName
                                                                            );
                                                                            if (matchedByName) {
                                                                                applyYarnSelection(getFinishedYarnIdentifier(matchedByName));
                                                                                toast.info(`Switched to ${matchedByName.finishedYarnName || matchedByName.greigeYarnName || 'selected yarn'}`);
                                                                            } else {
                                                                                toast.warn("Could not find matching yarn in contract requirements");
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedLot(selectedLot.filter((_, i) => i !== index));
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                        {/* <td className="border p-2">
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedLot(selectedLot.filter((_, i) => i !== index));
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td> */}
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={12} className="border p-2 text-center text-gray-500">
                                                    No lots selected. Click "Add Lot" to select yarn lots.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                            <div className="p-6 flex justify-end">
                                {/* <Button
                                    variant="default"
                                    className="bg-primary hover:bg-primary text-white"
                                    onClick={() => {
                                        // Validate each selected lot: issueQty must be <= availableQty and >= 0
                                        const invalid = selectedLot.find((l: any) => Number(l.issueQty ?? NaN) > Number(l.availableQty) || Number(l.issueQty ?? -1) < 0);
                                        if (invalid) {
                                            toast.error(`Issue Qty cannot exceed Available Qty for Lot ${invalid.lotNumber || invalid.id}.`);
                                            // alert(`Issue Qty cannot exceed Available Qty for Lot ${invalid.lotNumber || invalid.id}.`);
                                            return;
                                        }

                                        const yarnItem = finishedYarnOptions.find((yi: any) => getFinishedYarnIdentifier(yi) === selectedYarnItemId);
                                        const finishedCode = yarnItem ? getFinishedYarnIdentifier(yarnItem) : "";
                                        const currentFormQty = selectedLot
                                            .filter((lot: any) => getFinishedYarnIdentifier(lot) === finishedCode)
                                            .reduce((sum: number, lot: any) => sum + (lot.issueQty ? Number(lot.issueQty) : 0), 0);
                                        const orderQty = Number(dispatchDetails.orderQuantity) || 0;

                                        const dyeingWorkOrderId = watch("dyeingWorkOrderId");
                                        const dispatchedQtyFromPrev = (yarnDispatchDyingList || [])
                                            .filter((dispatch: any) =>
                                                Number(dispatch.dyeingWorkOrderId) === Number(dyeingWorkOrderId) &&
                                                dispatch.processType === "YARN" &&
                                                (!processingIssueDtl?.id || dispatch.id !== processingIssueDtl.id)
                                            )
                                            .reduce((total: number, dispatchItem: any) => {
                                                const issueQtySum = (dispatchItem.yarnIssues || [])
                                                    .filter((issue: any) => {
                                                        const issueIdentifier = getFinishedYarnIdentifier(issue);
                                                        return issueIdentifier === finishedCode ||
                                                            (!issue.finishedYarnId && !issue.finishedYarnCodeId && String(dispatchItem.finishedFabricCode || "") === finishedCode);
                                                    })
                                                    .reduce((sum: number, issue: any) => sum + (Number(issue.issueQty) || 0), 0);
                                                return total + issueQtySum;
                                            }, 0);

                                        const totalDispatched = dispatchedQtyFromPrev + currentFormQty;
                                        const balance = String(orderQty - totalDispatched);

                                        const totalIssueQty = selectedLot.reduce((sum: number, lot: any) => sum + (lot.issueQty ? Number(lot.issueQty) : 0), 0);
                                        setValue("dispatchedQuantity" as any, String(totalIssueQty) as any);
                                        // const balance = String((Number(dispatchDetails.orderQuantity) || 0) - totalIssueQty);
                                        setValue("balanceQuantity" as any, balance as any);
                                        setDispatchDetails(prev => ({
                                            ...prev,
                                            dispatchedQuantity: String(totalIssueQty),
                                            balanceQuantity: balance,
                                        }));
                                    }}
                                >
                                    Save Lots
                                </Button> */}
                                <Button
                                    variant="default"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => {
                                        const invalid = selectedLot.find((l: any) => Number(l.issueQty ?? 0) > Number(l.availableQty) || Number(l.issueQty ?? 0) < 0);
                                        if (invalid) {
                                            toast.error(`Issue Qty cannot exceed Available Qty for Lot ${invalid.lotNumber || invalid.id}.`);
                                            return;
                                        }
                                        const yarnItem = finishedYarnOptions.find((yi: any) => getFinishedYarnIdentifier(yi) === selectedYarnItemId);
                                        const finishedCode = yarnItem ? getFinishedYarnIdentifier(yarnItem) : "";

                                        const currentFormQty = selectedLot
                                            .filter((lot: any) => getFinishedYarnIdentifier(lot) === finishedCode)
                                            .reduce((sum: number, lot: any) => sum + (lot.issueQty ? Number(lot.issueQty) : 0), 0);

                                        const orderQty = Number(dispatchDetails.orderQuantity) || 0;

                                        // Recalculate previous dispatches for this item to get correct balance
                                        const dyeingWorkOrderId = watch("dyeingWorkOrderId");

                                        const dispatchedQtyFromPrev = (yarnDispatchDyingList || [])
                                            .filter((dispatch: any) =>
                                                Number(dispatch.dyeingWorkOrderId) === Number(dyeingWorkOrderId) &&
                                                dispatch.processType === "YARN" &&
                                                (!processingIssueDtl?.id || dispatch.id !== processingIssueDtl.id) // Exclude current record if editing
                                            )
                                            .reduce((total: number, dispatchItem: any) => {
                                                const issueQtySum = (dispatchItem.yarnIssues || [])
                                                    .filter((issue: any) => {
                                                        const issueIdentifier = getFinishedYarnIdentifier(issue);
                                                        return issueIdentifier === finishedCode ||
                                                            (!issue.finishedYarnId && !issue.finishedYarnCodeId && !issue.greigeYarnCodeId && !issue.yarnId && String(dispatchItem.finishedFabricCode || "") === finishedCode);
                                                    })
                                                    .reduce((sum: number, issue: any) => sum + (Number(issue.issueQty) || 0), 0);
                                                return total + issueQtySum;
                                            }, 0);

                                        const totalDispatched = dispatchedQtyFromPrev + currentFormQty;
                                        const balance = String(orderQty - totalDispatched);

                                        setValue("dispatchedQuantity", String(currentFormQty));
                                        setValue("balanceQuantity", balance);
                                        setDispatchDetails(prev => ({
                                            ...prev,
                                            dispatchedQuantity: String(totalDispatched),
                                            balanceQuantity: balance,
                                        }));
                                        toast.success("Lots saved successfully");
                                    }}
                                >
                                    Save Lots
                                </Button>
                            </div>
                        </Card>
                        <div className="flex justify-end">
                            <Button
                                disabled={!isFormValid || isSubmitting}
                                className={`bg-primary hover:bg-primary text-white px-6 flex items-center`}
                                onClick={handleSubmit(onSubmit)}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    <>
                                        <Save size={18} className="mr-2" />
                                        {processingIssueDtl?.id ? "Update Yarn Dispatch" : "Save Yarn Dispatch"}
                                    </>
                                )}
                            </Button>
                        </div>
                        {/* <Dialog open={showLotDialog} onOpenChange={setShowLotDialog}>
                            <DialogContent className="max-w-[95vw] w-fit max-h-[95vh] overflow-hidden">
                                <DialogHeader>
                                    <DialogTitle>Select Lots</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-[60vh] overflow-y-auto">
                                    <table className="w-full border-collapse">
                                        <thead className="sticky top-0 bg-gray-100">
                                            <tr>
                                                <th className="border p-2">Select</th>
                                                <th className="border p-2">Yarn Name</th>
                                                <th className="border p-2">Inward Type</th>
                                                <th className="border p-2">Finished Yarn</th>
                                                <th className="border p-2">Lot Number</th>
                                                <th className="border p-2">Available Bags</th>
                                                <th className="border p-2">Kgs/Bag</th>
                                                <th className="border p-2">Cones/Bag</th>
                                                <th className="border p-2">Cones Weight</th>
                                                <th className="border p-2">Available Qty</th>
                                                <th className="border p-2">Mill</th>
                                                <th className="border p-2">Warehouse</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {yarnIssueDetails.map((lot: any, idx: number) => {
                                                const isSelected = selectedLot.some((l: LotDetail) => l.id === lot.id);
                                                const selectedLotEntry = selectedLot.find((l: any) => String(l.id) === String(lot.id));
                                                const mappedMeta = lotMeta[String(lot.id)] || {};
                                                const resolvedMillId = mappedMeta.millId ?? selectedLotEntry?.millId ?? lot.millId ?? '';
                                                const resolvedMillName = resolvedMillId
                                                    ? (millNameById.get(String(resolvedMillId)) || lot.millName || '')
                                                    : (lot.millName || '');
                                                const warehouseLabel = lot.warehouseName || '-';
                                                return (
                                                    <tr key={`${lot.id}-${lot.inwardId}-${idx}`} className={isSelected ? "bg-blue-50" : ""}>
                                                        <td className="border p-2 text-center">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => handleLotSelect({
                                                                    id: lot.id,
                                                                    yarnName: lot.yarnName,
                                                                    availableBags: lot.availableBags,
                                                                    kgsPerBag: lot.kgsPerBag,
                                                                    conesPerBag: lot.conesPerBag,
                                                                    conesWeight: lot.conesWeight,
                                                                    availableQty: lot.availableQty,
                                                                    lotNumber: lot.lotNumber,
                                                                    millId: resolvedMillId,
                                                                    millName: resolvedMillName,
                                                                    warehouseId: lot.warehouseId,
                                                                    warehouseName: warehouseLabel === '-' ? '' : warehouseLabel,
                                                                    inwardId: lot.inwardId,
                                                                    orderItemId: lot.orderItemId,
                                                                    itemId: lot.itemId,
                                                                    noOfBags: 0,
                                                                    finishedYarnId: lot.finishedYarnId,
                                                                    finishedYarnName: lot.finishedYarnName,
                                                                    inwardTypeId: lot.inwardTypeId
                                                                })}
                                                            />
                                                        </td>
                                                        <td className="border p-2">{lot.yarnName}</td>
                                                        <td className="border p-2">
                                                            {lot.inwardTypeId ? inwardTypeLabelById.get(Number(lot.inwardTypeId)) || 'N/A' : 'N/A'}
                                                        </td>
                                                        <td className="border p-2">{lot.finishedYarnName || '-'}</td>
                                                        <td className="border p-2">{lot.lotNumber}</td>
                                                        <td className="border p-2">{lot.availableBags}</td>
                                                        <td className="border p-2">{Number(lot.kgsPerBag ?? 0).toFixed(3)}</td>
                                                        <td className="border p-2">{lot.conesPerBag ?? 0}</td>
                                                        <td className="border p-2">{Number(lot.conesWeight ?? 0).toFixed(3)}</td>
                                                        <td className="border p-2">{lot.availableQty}</td>
                                                        <td className="border p-2">{resolvedMillName || '-'}</td>
                                                        <td className="border p-2">{warehouseLabel}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setShowLotDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => setShowLotDialog(false)}>
                                        Confirm Selection
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog> */}
                        <Dialog open={showLotDialog} onOpenChange={setShowLotDialog}>
                            <DialogContent className="max-w-[95vw] w-fit min-w-[70vw] max-h-[90vh] overflow-hidden p-4">
                                <DialogHeader>
                                    <DialogTitle>Select Lots</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-[60vh] overflow-y-auto">
                                    <PopupDataTable
                                        columns={lotColumns}
                                        data={yarnIssueDetails}
                                        emptyMessage={
                                            yarnIssueDetails.length === 0
                                                ? 'No lots available for issue.'
                                                : 'No lots match your search.'
                                        }
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setShowLotDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        className="bg-primary hover:bg-primary text-white"
                                        onClick={() => setShowLotDialog(false)}
                                    >
                                        Confirm Selection
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </>
                    {/* )} */}
                </div>
            </div>
        </div>
    );
}