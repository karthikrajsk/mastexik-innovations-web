

// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useForm } from 'react-hook-form';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { AppDispatch, RootState } from '@/state/store';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { toast } from 'react-toastify';
// import { getAllPoTypes, getAllPurchaseOrders, getPurchaseOrderById } from '@/state/purchaseOrderSlice';
// import { getAllVendors } from '@/state/vendorSlice';
// import { createPurchaseReturn, updatePurchaseReturn, getAllPurchaseReturns } from '@/state/purchaseReturnSlice';
// import { getAllYarnMasters } from '@/state/yarnSlice';
// import { getAllPurchaseInwards } from '@/state/purchaseInwardSlice';
// import { getAllFabricMasters } from '@/state/fabricMasterSlice';
// import { getAllSubCategories } from '@/state/subCategorySlice';
// import { getAllItemMasters } from '@/state/itemSlice';
// import { getAllSizingYarnIssue } from '@/state/sizingYarnIssueSlice';
// import { getAllWeavingYarnIssue } from '@/state/weavingYarnIssueSlice';
// import { VENDOR_TYPE_ALL, filterVendorsByPoType } from '@/utils/vendorFilters';
// import { PopupDataTable, PopupColumn } from '@/components/data/PopupDataTable';
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
// import { ArrowLeft, ClipboardList, Trash2, RefreshCw } from 'lucide-react';
// import { getAllWarehouse } from '@/state/warehouseSlice';
// import { getAllTransports } from '@/state/transportSlice';
// import apiService from '@/services/ApiService';
// import documentNumberService from '@/services/DocumentNumberService';
// import { useResolvedCompanyId } from '@/hooks/useCompanyContext';

// // PO TYPE CONSTANTS
// const PO_TYPE_YARN = 1;
// const PO_TYPE_WOVEN_FABRIC = 2;
// const PO_TYPE_KNITTED_FABRIC = 11;
// const PO_TYPE_ITEM = 3;

// // VENDOR TYPE CONSTANTS
// const VENDOR_TYPE_YARN = 301;
// const VENDOR_TYPE_ITEM = 305;
// const PURCHASE_TYPE_TO_PO_ID: Record<string, number> = {
//   yarn: PO_TYPE_YARN,
//   woven: PO_TYPE_WOVEN_FABRIC,
//   knitted: PO_TYPE_KNITTED_FABRIC,
//   item: PO_TYPE_ITEM,
// };

// // Form types
// interface PurchaseReturnForm {
//   id?: number | null;
//   returnNo: string;
//   returnDate: string;
//   purchaseType: 'yarn' | 'fabric' | 'knitted' | 'item' | '';
//   vendorId: string;
//   purchaseOrderId: string;
//   grossWt?: string;
//   remark?: string;
//   vehicleNo?: string;
//   transportId?: string;

// }

// interface ItemEntryRow {
//   id?: number;
//   itemId?: string;
//   itemName?: string;
//   itemCode?: string;
//   inwardNo?: string;
//   returnQuantity?: string;
//   availableQty?: string;
//   availableBags?: string;
//   kgsPerBag?: string;
//   warehouseId?: string;
//   warehouseName?: string;
//   uomId?: string | number | null;
//   inwardId?: number | null;
//   orderItemId?: number | null;
//   rejectedQty?: string;
// }

// interface YarnEntryRow {
//   id?: number;
//   yarnId?: string;
//   yarnName?: string;
//   returnQuantity?: string;
//   lotNo?: string;
//   warehouseId?: string;
//   millName?: string;
//   millNameId?: string | null;
//   inwardId?: number | null;
//   orderItemId?: number | null;
//   yarnInwardStockDetailsId?: number | null;
//   inwardNo?: string;
//   purchaseInwardId?: number | null;
//   purchaseInwardNo?: string;
//   availableBags?: string;
//   kgsPerBag?: string;
//   conesPerBag?: string;
//   conesWeight?: string;
//   rejectedQty?: string;
//   ratePerUnit?: string;
//   gstPercent?: string;
//   gstAmount?: string;
//   totalAmount?: string;
// }

// interface FabricEntryRow {
//   id?: number;
//   fabricMasterId?: string;
//   fabricCode?: string;
//   quality?: string; // normalized quality field
//   fabricQuality?: string; // legacy alias
//   returnQuantity?: string; // pieces/meters
//   pieceNo?: string;
//   pieceMeter?: string;
//   netWeight?: string;
//   warehouseId?: string;
//   isPacked?: any;
//   inwardId?: number | null;
//   orderItemId?: number | null;
// }

// const buildYarnStockDetailsParams = (purchaseOrderId?: string, poTypeId?: number, companyId?: number | null) => {
//   const params: Record<string, string> = {} as Record<string, string>;
//   if (purchaseOrderId) {
//     params.purchaseOrderId = purchaseOrderId;
//   }
//   if (poTypeId !== undefined && poTypeId !== null) {
//     params.poTypeId = String(poTypeId);
//   }
//   if (companyId !== null && companyId !== undefined) {
//     params.companyId = String(companyId);
//   }
//   return params;
// };

// // Helper function to convert string to number
// const toNumber = (v: string | number | null | undefined): number => {
//   const n = parseFloat(String(v));
//   return isNaN(n) ? 0 : n;
// };

// // Calculation function for yarn entries
// const recalcYarnEntry = (item: any) => {
//   const qty = toNumber(item.returnQuantity);
//   const rate = toNumber(item.ratePerUnit);
//   const gstP = toNumber(item.gstPercent);
  
//   const total = qty * rate;
//   const gstAmt = total * (gstP / 100);
//   const final = total + gstAmt;
  
//   return {
//     ...item,
//     totalAmount: final ? final.toFixed(2) : "",
//     gstAmount: gstAmt ? gstAmt.toFixed(2) : "",
//   };
// };

// export default function PurchaseReturnEntry() {
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const selectedCompanyId = useResolvedCompanyId();

//   const { purchaseOrderList, purchaseOrderTypeList } = useSelector((s: RootState) => s.purchaseOrder);
//   const { vendorList } = useSelector((s: RootState) => s.vendor);
//   const { yarnList } = useSelector((s: RootState) => s.yarn);
//   const { purchaseInwardList } = useSelector((s: RootState) => s.purchaseInward);

//   // Function to get rate/unit from purchase order
//   const getRateFromPurchaseOrder = (purchaseOrderId: string, orderItemId: string | number): { rate: string; gstPercent: string } => {
//     const purchaseOrder = Array.isArray(purchaseOrderList) 
//       ? purchaseOrderList.find((po: any) => String(po.id) === String(purchaseOrderId))
//       : null;
      
//     if (!purchaseOrder?.purchaseOrderItemsDtl) {
//       return { rate: '', gstPercent: '' };
//     }
    
//     const orderItem = purchaseOrder.purchaseOrderItemsDtl.find((item: any) => 
//       String(item.id) === String(orderItemId) || String(item.orderItemId) === String(orderItemId)
//     );
    
//     if (!orderItem) {
//       return { rate: '', gstPercent: '' };
//     }
    
//     // Get GST percentage from Purchase Order item first, fallback to yarn master if not available
//     let gstPercent = '';
    
//     // Try to get GST from Purchase Order item
//     if (orderItem.gstPercent) {
//       gstPercent = String(orderItem.gstPercent);
//     } else if (orderItem.igst && Number(orderItem.igst) > 0) {
//       gstPercent = String(orderItem.igst);
//     } else if (orderItem.cgst && orderItem.sgst) {
//       const cgst = Number(orderItem.cgst || 0);
//       const sgst = Number(orderItem.sgst || 0);
//       gstPercent = String(cgst + sgst);
//     } else {
//       // Fallback to yarn master if Purchase Order doesn't have GST info
//       const yarn = yarnList?.find((y: any) => String(y.id) === String(orderItem.yarnId));
//       if (yarn) {
//         const cgst = Number(yarn.cgst || 0);
//         const sgst = Number(yarn.sgst || 0);
//         const igst = Number(yarn.igst || 0);
        
//         if (igst > 0) {
//           gstPercent = String(igst);
//         } else {
//           gstPercent = String(cgst + sgst);
//         }
//       }
//     }
    
//     return {
//       rate: orderItem.price ? String(orderItem.price) : '',
//       gstPercent: gstPercent
//     };
//   };
//   const { warehouseList } = useSelector((s: RootState) => s.warehouse);
//   const { fabricMasterList } = useSelector((s: RootState) => s.fabricMaster);
//   const { purchaseReturnList } = useSelector((s: RootState) => s.purchaseReturn);
//   const { subCategoryList } = useSelector((s: RootState) => s.subCategory);
//   const { sizingYarnIssuetList } = useSelector((s: RootState) => s.sizingYarnIssue as any);
//   const { weavingYarnIssuetList } = useSelector((s: RootState) => s.weavingYarnIssue as any);
//   const { itemList } = useSelector((s: RootState) => s.itemMaster as any);
//   const itemMasterList = itemList;
//   const { transportList } = useSelector((s: RootState) => s.transport as any);
//   const hasGeneratedNumberRef = useRef(false);
//   const isSavingRef = useRef(false);
//   const hasSetPurchaseOrderId = useRef(false);

//   const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PurchaseReturnForm>({
//     defaultValues: { returnNo: '', returnDate: new Date().toISOString().slice(0, 10), purchaseType: '', vendorId: '', purchaseOrderId: '' }
//   });

//   const purchaseType = watch('purchaseType');
//   const vendorId = watch('vendorId');
//   const purchaseOrderId = watch('purchaseOrderId');

//   const selectedPONumber = useMemo(() => {
//     const rec: any = (location as any)?.state?.record;
//     const currentId = String(purchaseOrderId || rec?.purchaseOrderId || '');
//     if (!currentId || currentId === 'null' || currentId === 'undefined') return '';
    
//     const list = Array.isArray(purchaseOrderList) ? purchaseOrderList : (purchaseOrderList as any)?.data || [];
//     const matched = list.find((po: any) => String(po.id) === currentId);
    
//     if (matched) {
//       return matched.purchaseOrderNo || matched.orderNo || matched.poNo || '';
//     }
    
//     // Fallback to record poNo if available
//     if (rec?.id && String(rec.purchaseOrderId) === currentId) {
//       return rec.purchaseOrderNo || rec.orderNo || rec.poNo || '';
//     }
    
//     return '';
//   }, [purchaseOrderId, purchaseOrderList, location]);

//   useEffect(() => {
//     const generateDocNo = async () => {
//       const rec: any = (location as any)?.state?.record;
//       if (rec?.id || hasGeneratedNumberRef.current) return;

//       try {
//         const res = await documentNumberService.generateDocumentNumber({
//           screenName: "Purchase Return"
//         });
//         setValue('returnNo', res.documentNumber);
//         hasGeneratedNumberRef.current = true;
//       } catch (err) {
//         console.error("Failed to generate return number:", err);
//       }
//     };
//     generateDocNo();
//   }, [location, setValue]);

//   // Cleanup on unmount or beforeunload
//   useEffect(() => {
//     //  alert('Clearing cached document number for Purchase Return');
//     const handleBeforeUnload = () => {
//       const rec: any = (location as any)?.state?.record;
//       if (hasGeneratedNumberRef.current && !isSavingRef.current && !rec?.id) {
//         documentNumberService.clearMemoryCache("Purchase Return");
//       }
//     };
//     window.addEventListener('beforeunload', handleBeforeUnload);
//     return () => {

//       window.removeEventListener('beforeunload', handleBeforeUnload);
//       const rec: any = (location as any)?.state?.record;
//       if (hasGeneratedNumberRef.current && !isSavingRef.current && !rec?.id) {
//         documentNumberService.clearMemoryCache("Purchase Return");
//       }
//     };
//   }, [location]);


//   useEffect(() => {
//     const poParams: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
//     if (selectedCompanyId) {
//       poParams.companyId = selectedCompanyId;
//     }
//     dispatch(getAllPurchaseOrders(poParams));
//   }, [dispatch, selectedCompanyId]);

//   useEffect(() => {
//     if (purchaseType === 'item') {
//       dispatch(getAllItemMasters({ fetchAll: true }));
//     }
//   }, [dispatch, purchaseType]);

//   const [yarnRows, setYarnRows] = useState<YarnEntryRow[]>([]);
//   const [fabricRows, setFabricRows] = useState<FabricEntryRow[]>([]);
//   const [itemRows, setItemRows] = useState<ItemEntryRow[]>([]);

//   // Popups
//   const [isYarnDialogOpen, setIsYarnDialogOpen] = useState(false);
//   const [isFabricDialogOpen, setIsFabricDialogOpen] = useState(false);
//   const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

//   // Popup working lists
//   const [yarnPopupRows, setYarnPopupRows] = useState<any[]>([]);
//   const [fabricPopupRows, setFabricPopupRows] = useState<any[]>([]);
//   const [itemPopupRows, setItemPopupRows] = useState<any[]>([]);
//   const [yarnPopupSearch, setYarnPopupSearch] = useState('');
//   const [fabricPopupSearch, setFabricPopupSearch] = useState('');
//   const [itemPopupSearch, setItemPopupSearch] = useState('');

//   // Yarn stock details from API
//   const [yarnStockDetails, setYarnStockDetails] = useState<any[]>([]);
//   const [itemStockDetails, setItemStockDetails] = useState<any[]>([]);

//   // Enhanced helper function to get mill name from millNameId
//   const getMillNameFromId = useCallback((millNameId: number | string | null | undefined): string => {
//     if (!millNameId || !subCategoryList) {
//       // console.log(`No millNameId (${millNameId}) or subCategoryList available`);
//       return '';
//     }

//     // Handle both array and object formats for subCategoryList
//     const list = Array.isArray(subCategoryList)
//       ? subCategoryList
//       : (subCategoryList?.data || []);

//     // console.log(`Looking for millNameId: ${millNameId} in list of ${list.length} items`);

//     const millSubCategory = list.find((sc: any) => {
//       const matchesId = String(sc.id) === String(millNameId);
//       const matchesSubCategoryId = String(sc.subCategoryId) === String(millNameId);
//       return matchesId || matchesSubCategoryId;
//     });

//     const result = millSubCategory?.subCategoryName || millSubCategory?.name || '';
//     // console.log(`Found mill name for ID ${millNameId}:`, result);

//     return result;
//   }, [subCategoryList]);

//   // Map purchaseInward data (auto-fetch rows for dialogs by PO and type)
//   const poTypeIdForType = useMemo(() => {
//     if (!purchaseType) return undefined as number | undefined;
//     const normalized = purchaseType.toLowerCase();
//     if (PURCHASE_TYPE_TO_PO_ID[normalized]) {
//       return PURCHASE_TYPE_TO_PO_ID[normalized];
//     }
//     const list = Array.isArray((purchaseOrderTypeList as any)?.data)
//       ? (purchaseOrderTypeList as any).data
//       : (purchaseOrderTypeList as any) || [];
//     const key = purchaseType === 'yarn' ? 'yarn' : (purchaseType === 'fabric' ? 'fabric' : (purchaseType === 'knitted' ? 'knit' : 'item'));
//     const entry = (list || []).find((t: any) => {
//       const name = (t?.name || t?.poType || t?.typeName || t?.poTypeName || '').toLowerCase();
//       if (!name) return false;
//       if (normalized === 'item') return name.includes('item');
//       return name.includes(normalized);
//     });
//     return entry?.id != null ? Number(entry.id) : undefined;
//   }, [purchaseType, purchaseOrderTypeList]);

//   const inwardByPOAndType = useMemo(() => {
//     const raw = Array.isArray((purchaseInwardList as any)?.data)
//       ? (purchaseInwardList as any).data
//       : (purchaseInwardList as any) || [];
//     if (!purchaseOrderId || !poTypeIdForType) return [] as any[];
//     return (raw || []).filter((pi: any) =>
//       String(pi?.purchaseOrderId) === String(purchaseOrderId) &&
//       Number(pi?.poTypeId) === Number(poTypeIdForType)
//     );
//   }, [purchaseInwardList, purchaseOrderId, poTypeIdForType]);


//   // Fetch yarn stock details from API
//   const fetchYarnStockDetails = useCallback(async () => {
//     if (!purchaseOrderId || !poTypeIdForType) {
//       setYarnStockDetails([]);
//       return [];
//     }

//     try {
//       const params = buildYarnStockDetailsParams(purchaseOrderId, poTypeIdForType, selectedCompanyId);
//       const query = new URLSearchParams(params).toString();
//       const endpoint = query
//         ? `/yarn-stock-details/filter?${query}`
//         : `/yarn-stock-details/filter`;
//       const response = await apiService.get(endpoint);
//       const normalizedData = Array.isArray(response)
//         ? response
//         : Array.isArray(response?.data)
//           ? response.data
//           : Array.isArray(response?.data?.data)
//             ? response.data.data
//             : [];
//       setYarnStockDetails(normalizedData);
//       console.log('Fetched yarn inward stock details:', normalizedData);

//       return normalizedData;
//     } catch (error) {
//       console.error('Failed to fetch yarn stock details:', error);
//       setYarnStockDetails([]);
//       return [];
//     }
//   }, [purchaseOrderId, poTypeIdForType]);

//   // Create PurchaseInward mapping from existing purchaseInward list based on purchaseOrderId
//   const createPurchaseInwardMapping = useCallback((purchaseOrderId: string) => {
//     const raw = Array.isArray((purchaseInwardList as any)?.data)
//       ? (purchaseInwardList as any).data
//       : (purchaseInwardList as any) || [];
    
//     // Find purchase inwards for the current purchase order
//     const purchaseInwards = raw.filter((pi: any) =>
//       String(pi.purchaseOrderId) === String(purchaseOrderId) && pi.activeFlag === true
//     );

//     // Create mapping from orderItemId to array of purchase inward mappings
//     const mappings: Record<string, Array<{purchaseInwardId: number, purchaseInwardNo: string}>> = {};
    
//     purchaseInwards.forEach((pi: any) => {
//       if (pi.purchaseInwardItemsDtl) {
//         pi.purchaseInwardItemsDtl.forEach((item: any) => {
//           if (item.poItemId && pi.id && pi.purchaseInwardNo) {
//             const key = String(item.poItemId);
//             if (!mappings[key]) {
//               mappings[key] = [];
//             }
//             mappings[key].push({
//               purchaseInwardId: pi.id,
//               purchaseInwardNo: pi.purchaseInwardNo
//             });
//           }
//         });
//       }
//     });

//     console.log('PurchaseInward mappings for PO', purchaseOrderId, ':', mappings);
//     return mappings;
//   }, [purchaseInwardList]);

//   // Fetch item stock details from API
//   const fetchItemStockDetails = useCallback(async () => {
//     if (!vendorId) return [];

//     try {
//       const params: any = {
//         vendorId: Number(vendorId),
//         companyId: selectedCompanyId || localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany')
//       };
//       if (purchaseOrderId) params.purchaseOrderId = Number(purchaseOrderId);

//       const response = await apiService.get('/item-stock-details/filter', params);
//       const data = response?.data || response || [];
//       setItemStockDetails(data);
//       console.log('Fetched item stock details:', data);
//       return data;
//     } catch (error) {
//       console.error('Failed to fetch item stock details:', error);
//       setItemStockDetails([]);
//       return [];
//     }
//   }, [vendorId, purchaseOrderId]);

//   // Refresh quantities function
//   const refreshQuantities = async () => {
//     try {
//       await dispatch(getAllPurchaseInwards({} as any)).unwrap();
//       await dispatch(getAllPurchaseReturns({} as any)).unwrap();

//       // const refreshReturnsParams: { companyId?: number } = {};
//       // if (selectedCompanyId) {
//       //   refreshReturnsParams.companyId = selectedCompanyId;
//       // }
//       // await dispatch(getAllPurchaseReturns(refreshReturnsParams)).unwrap();
//       await fetchYarnStockDetails(); // Also refresh yarn stock details
//       await fetchItemStockDetails(); // Also refresh item stock details
//       toast.success('Quantities refreshed successfully');
//     } catch (error) {
//       toast.error('Failed to refresh quantities');
//     }
//   };

//   // Auto-refresh purchase inward data when dependencies change
//   useEffect(() => {
//     const refetchInwardData = async () => {
//       if (purchaseOrderId && poTypeIdForType) {
//         try {
//           await dispatch(getAllPurchaseInwards({} as any)).unwrap();
//           console.log('Refetched purchase inward data for updated quantities');
//         } catch (error) {
//           console.error('Failed to refetch purchase inward data:', error);
//         }
//       }
//     };

//     refetchInwardData();
//   }, [purchaseOrderId, poTypeIdForType, dispatch, purchaseReturnList]);

//   // Fetch yarn stock details when PO and type change
//   useEffect(() => {
//     if (purchaseOrderId && poTypeIdForType && purchaseType === 'yarn') {
//       fetchYarnStockDetails();
//     } else if (purchaseOrderId && purchaseType === 'item') {
//       fetchItemStockDetails();
//     } else {
//       setYarnStockDetails([]);
//       setItemStockDetails([]);
//     }
//   }, [purchaseOrderId, poTypeIdForType, purchaseType, fetchYarnStockDetails, fetchItemStockDetails]);

//   const openYarnDialog = async () => {
//     if (!purchaseOrderId) { toast.error('Select PO first'); return; }

//     console.log('Opening yarn dialog with purchaseOrderId:', purchaseOrderId);
//     const fetchedYarnStockDetails = await fetchYarnStockDetails();
//     const yarnDataSource = (fetchedYarnStockDetails && fetchedYarnStockDetails.length > 0)
//       ? fetchedYarnStockDetails
//       : (yarnStockDetails || []);
//     console.log('Using yarn stock details source count:', yarnDataSource.length);

//     // Create PurchaseInward mapping from existing purchaseInward list
//     const purchaseInwardMapping = createPurchaseInwardMapping(String(purchaseOrderId));

//     let source = [];
//     let filteredSource = [];

//     // Primary source: yarn stock details (API preferred)
//     if (yarnDataSource && yarnDataSource.length > 0) {

//       // Use yarn stock details directly from API response without creating duplicates
//       source = [];
//       yarnDataSource.forEach((item: any) => {
//         const resolvedYarnId = item.yarnId ?? item.itemId ?? null;
//         const yarnIdStr = resolvedYarnId != null ? String(resolvedYarnId) : '';
//         let yarnName = item.yarnName || '';
//         if (!yarnName && yarnIdStr && Array.isArray(yarnList)) {
//           const ym = (yarnList as any[]).find((y: any) => String(y.id) === yarnIdStr);
//           yarnName = ym?.yarnName || yarnName;
//         }
//         if (!yarnName) {
//           yarnName = yarnIdStr;
//         }

//         const millName = item.millId ? getMillNameFromId(item.millId) : '';
//         const warehouseId = item.warehouseId != null ? String(item.warehouseId) : '';
//         const warehouseName = warehouseId
//           ? (Array.isArray(warehouseList)
//             ? warehouseList.find((wh: any) => String(wh.id) === warehouseId)?.warehouseName || ''
//             : (item.warehouseName || ''))
//           : (item.warehouseName || '');

//         const rejectedQty = item.rejectedQty != null ? Number(item.rejectedQty) : 0;
        
//         // Get purchase inward mapping for this orderItemId
//         const orderItemKey = String(item.orderItemId || '');
//         const purchaseInwardInfo = purchaseInwardMapping[orderItemKey]?.[0]; // Get first purchase inward for this order item
        
//         // Create single entry for each yarn stock detail record
//         source.push({
//           selected: false,
//           yarnId: yarnIdStr,
//           yarnName,
//           availableBags: item.availableBags != null ? Number(item.availableBags) : 0,
//           kgsPerBag: item.kgsPerBag != null ? Number(item.kgsPerBag) : 0,
//           conesPerBag: item.conesPerBag != null ? Number(item.conesPerBag) : 0,
//           conesWeight: item.conesWeight != null ? Number(item.conesWeight) : 0,
//           rejectedQty: String(rejectedQty),
//           lotNo: item.lotNo || '',
//           warehouseId,
//           warehouseName,
//           millName: millName,
//           millNameId: item.millId ?? null,
//           inwardId: item.inwardId ?? null,
//           orderItemId: item.orderItemId ?? null,
//           yarnInwardStockDetailsId: item.yarnInwardStockDetailsId ?? null,
//           inwardQty: item.inwardQty,
//           inwardBags: item.inwardBags,
//           acceptedQty: item.acceptedQty,
//           issuedQty: item.issuedQty,
//           uomId: item.uomId,
//           inwardTypeId: item.inwardTypeId,
//           orderNo: item.orderNo || '',
//           inwardNo: item.inwardNo || '',
//           purchaseInwardId: purchaseInwardInfo?.purchaseInwardId || null,
//           purchaseInwardNo: purchaseInwardInfo?.purchaseInwardNo || '',
//         });
//       });
//       console.log('Using yarnStockDetails as source from API');
//     } else if (yarnLotsByPO && yarnLotsByPO.length > 0) {
//       const seenKeys = new Set<string>();
//       source = (yarnLotsByPO || [])
//         .filter((item: any) => {
//           const key = `${String(item.yarnId || '')}|${String(item.lotNo || '')}|${String(item.warehouseId || '')}`;
//           if (seenKeys.has(key)) {
//             return false;
//           }
//           seenKeys.add(key);
//           return true;
//         })
//         .map((item: any) => ({
//           ...item,
//           inwardNo: item.inwardNo || '',
//           orderNo: item.orderNo || ''
//         }));
//       console.log('Fallback: Using yarnLotsByPO as source');
//     } else {
//       const seenKeys = new Set<string>();
//       source = (yarnItemsByPO || [])
//         .filter((item: any) => {
//           const key = `${String(item.yarnId || '')}|${String(item.lotNo || '')}|${String(item.warehouseId || '')}`;
//           if (seenKeys.has(key)) {
//             return false;
//           }
//           seenKeys.add(key);
//           return true;
//         })
//         .map((it: any) => {
//           const millName = it.millNameId
//             ? getMillNameFromId(it.millNameId)
//             : (it.millName || 'N/A');

//           const rejectedQty = it.rejectedQty != null ? String(it.rejectedQty) : (it.quantity != null ? String(it.quantity) : '');
//           const warehouseId = it.warehouseId != null ? String(it.warehouseId) : '';

//           return {
//             selected: false,
//             yarnId: it.yarnId,
//             yarnName: it.yarnName || it.yarnId,
//             availableBags: it.availableBags,
//             kgsPerBag: it.kgsPerBag,
//             conesPerBag: it.conesPerBag,
//             conesWeight: it.conesWeight,
//             rejectedQty: rejectedQty,
//             lotNo: it.lotNo || '',
//             warehouseId: warehouseId,
//             millName: millName,
//             millNameId: it.millNameId ?? null,
//             orderNo: it.orderNo || '',
//             inwardNo: it.inwardNo || ''
//           };
//         });
//       console.log('Fallback: Using yarnItemsByPO as source');
//     }

//     filteredSource = source;

//     // Filter out items with 0 available bags or 0 rejected quantity
//     filteredSource = filteredSource.filter((item: any) => {
//       const availableBags = item.availableBags != null ? Number(item.availableBags) : 0;
//       const rejectedQty = item.rejectedQty != null ? Number(item.rejectedQty) : 0;
      
//       // Only show items that have both available bags > 0 AND rejected quantity > 0
//       return availableBags > 0 && rejectedQty > 0;
//     });
    
//     console.log(`Filtered out items with 0 stock:`, filteredSource.length, 'items remaining');

//     const ro = (filteredSource || []).map((r: any) => {
//       // Check if this specific combination (yarnId + lotNo + warehouseId + yarnInwardStockDetailsId) is already selected
//       const isSelected = (yarnRows || []).some((y: any) =>
//         String(y.yarnId || '') === String(r.yarnId || '') &&
//         String(y.lotNo || '') === String(r.lotNo || '') &&
//         String(y.warehouseId || '') === String(r.warehouseId || '') &&
//         String(y.yarnInwardStockDetailsId || '') === String(r.yarnInwardStockDetailsId || '')
//       );

//       const resolvedMillName = r.millNameId
//         ? getMillNameFromId(r.millNameId)
//         : (r.millName || 'N/A');

//       return {
//         ...r,
//         selected: r.selected || isSelected,
//         _readonlyAvail: true,
//         millName: resolvedMillName,
//         rejectedQty: r.rejectedQty || '',
//         warehouseId: r.warehouseId || '',
//         millNameId: r.millNameId ?? null,
//         // Add debug info for real-time quantities
//         _debug: {
//           inwardQty: r.originalQty,
//           issuedQty: r.issuedQty,
//           returnedQty: r.returnedQty,
//           rejectedQty: r.rejectedQty
//         }
//       };
//     });

//     console.log('Final popup rows with updated quantities:', ro);
//     setYarnPopupRows(ro);
//     setIsYarnDialogOpen(true);
//   };

//   const confirmYarnDialog = () => {
//     const picks = (yarnPopupRows || []).filter((r: any) => r.selected && r.rejectedQty !== '' && r.rejectedQty !== null);
//     if (picks.length === 0) { toast.error('Select at least one yarn with Rejected Quantity'); return; }

//     console.log('Selected picks with millNameId:', picks.map(p => ({
//       yarnId: p.yarnId,
//       millNameId: p.millNameId,
//       millName: p.millName,

//       rejectedQty: p.rejectedQty
//     })));

//     picks.forEach((p: any) => {
//       const resolvedWarehouseName = p.warehouseId
//         ? (Array.isArray(warehouseList)
//           ? warehouseList.find((wh: any) => String(wh.id) === String(p.warehouseId))?.warehouseName
//           : '')
//         : '';
//       // alert(`Warehouse Info\nID: ${p.warehouseId ?? ''}\nName: ${resolvedWarehouseName || ''}`);
//     });

//     setYarnRows(prev => {
//       const existingKeys = new Set(
//         (prev || []).map(y => `${String(y.yarnId || '')}|${String(y.lotNo || '')}|${String(y.warehouseId || '')}|${String(y.yarnInwardStockDetailsId || '')}`)
//       );
//       const toAdd: YarnEntryRow[] = picks
//         .filter((p: any) => !existingKeys.has(`${String(p.yarnId || '')}|${String(p.lotNo || '')}|${String(p.warehouseId || '')}|${String(p.yarnInwardStockDetailsId || '')}`))
//         .map((p: any) => {
//           const millName = p.millNameId
//             ? getMillNameFromId(p.millNameId)
//             : (p.millName || '');

//           // Fetch rate/unit and GST from purchase order
//           const rateInfo = getRateFromPurchaseOrder(String(purchaseOrderId), p.orderItemId || '');

//           const newRow: YarnEntryRow = {
//             yarnId: String(p.yarnId),
//             yarnName: p.yarnName,
//             availableBags: p.availableBags != null ? String(p.availableBags) : '',
//             kgsPerBag: p.kgsPerBag != null ? String(p.kgsPerBag) : '',
//             conesPerBag: p.conesPerBag != null ? String(p.conesPerBag) : '',
//             conesWeight: p.conesWeight != null ? String(p.conesWeight) : '',
//             rejectedQty: String(p.rejectedQty),
//             returnQuantity: '',
//             lotNo: p.lotNo || '',
//             warehouseId: p.warehouseId != null ? String(p.warehouseId) : '',
//             millName: millName,
//             millNameId: p.millNameId ?? null,
//             inwardId: p.inwardId ?? null,
//             orderItemId: p.orderItemId ?? null,
//             yarnInwardStockDetailsId: p.yarnInwardStockDetailsId ?? null,
//             inwardNo: p.inwardNo || '',
//             purchaseInwardId: p.purchaseInwardId ?? null,
//             purchaseInwardNo: p.purchaseInwardNo || '',
//             ratePerUnit: rateInfo.rate,
//             gstPercent: rateInfo.gstPercent,
//             gstAmount: '',
//             totalAmount: '',
//           };

//           console.log('Adding new row with rejectedQty:', newRow.rejectedQty);
//           return newRow;
//         });

//       console.log('All rows to add:', toAdd);
//       return [...prev, ...toAdd];
//     });
//     setIsYarnDialogOpen(false);
//   };

//   const openFabricDialog = () => {
//     if (!purchaseOrderId) { toast.error('Select PO first'); return; }
//     let source = (fabricPiecesByPO || []);

//     const normalized = (source || []).map((r: any) => {
//       const q = r.quality ?? r.fabricQuality ?? r.qualityName ?? '';
//       const isSelected = (fabricRows || []).some((f: any) => {
//         const fq = (f as any).quality ?? f.fabricQuality ?? '';
//         const byPiece = String(f.pieceNo || '') === String(r.pieceNo || '') && (String(f.fabricMasterId || '') === String(r.fabricMasterId || '') || (String(f.fabricCode || '') === String(r.fabricCode || '') && String(fq || '') === String(q || '')));
//         const byAttrs = (String(f.fabricCode || '') === String(r.fabricCode || '')) && (String(fq || '') === String(q || '')) && (String(f.pieceMeter || '') === String(r.pieceMeter || '')) && (String(f.netWeight || '') === String(r.netWeight || ''));
//         return byPiece || byAttrs;
//       });
//       return { ...r, quality: q, selected: r.selected || isSelected };
//     }).filter((r: any) => r.rejectedQty == null || Number(r.rejectedQty) > 0);
//     setFabricPopupRows(normalized);
//     setIsFabricDialogOpen(true);
//   };

//   const confirmFabricDialog = () => {
//     const picks = (fabricPopupRows || []).filter((r: any) => r.selected);
//     if (picks.length === 0) { toast.error('Select at least one fabric item'); return; }

//     setFabricRows(prev => {
//       const keyOf = (x: any) => {
//         const q = (x as any).quality ?? x.fabricQuality ?? '';
//         if (x.pieceNo) {
//           return `piece|${String(x.fabricMasterId || '')}|${String(x.pieceNo || '')}`;
//         }
//         return `attr|${String(x.fabricCode || '')}|${String(q || '')}|${String(x.pieceMeter || '')}|${String(x.netWeight || '')}`;
//       };
//       const existingKeys = new Set((prev || []).map(keyOf));
//       const toAdd: FabricEntryRow[] = picks
//         .filter((p: any) => !existingKeys.has(keyOf(p)))
//         .map((p: any) => {
//           let q = p.quality;
//           if (!q) {
//             const fm = (fabricMasterList || []).find((fm: any) => String(fm.id) === String(p.fabricMasterId));
//             q = fm?.fabricQuality || '';
//           }
//           return {
//             fabricMasterId: String(p.fabricMasterId),
//             fabricCode: p.fabricCode,
//             quality: q,
//             returnQuantity: '',
//             pieceNo: p.pieceNo,
//             pieceMeter: p.pieceMeter,
//             netWeight: p.netWeight,
//             warehouseId: p.warehouseId,
//             isPacked: p.isPacked,
//             inwardId: p.inwardId ?? null,
//             orderItemId: p.orderItemId ?? null,
//           };
//         });
//       return [...prev, ...toAdd];
//     });

//     setIsFabricDialogOpen(false);
//   };

//   const openItemDialog = async () => {
//     if (!vendorId) { toast.error('Select Vendor first'); return; }

//     const data = await fetchItemStockDetails();

//     const source = (data || []).map((entry: any) => {
//       const item = entry.itemInwardStockDetails;
//       const inv = entry.itemInventory;

//       const isSelected = (itemRows || []).some((r: any) =>
//         String(r.orderItemId) === String(item?.orderItemId || item?.id)
//       );

//       const warehouse = (warehouseList || []).find((wh: any) => String(wh.id) === String(item?.warehouseId));

//       const masterList = Array.isArray(itemList) ? itemList : (itemList?.data || []);
//       const itemFromMaster = masterList.find((im: any) => String(im.id) === String(item?.itemId));

//       return {
//         selected: isSelected,
//         itemId: item?.itemId,
//         itemName: item?.itemName || itemFromMaster?.itemName || itemFromMaster?.name || '',
//         itemCode: item?.itemCode || itemFromMaster?.itemCode || itemFromMaster?.code || '',
//         availableQty: String(item?.availableQty || 0),
//         availableBags: item?.availableBags || 0,
//         kgsPerBag: item?.kgsPerBag || 0,
//         rejectedQty: item?.rejectedQty != null ? String(item.rejectedQty) : '0',
//         purchaseOrderNo: selectedPONumber || item?.purchaseOrderNo || item?.poNo || '',
//         warehouseId: item?.warehouseId,
//         warehouseName: warehouse?.warehouseName || item?.warehouseName || '',
//         uomId: item?.uomId,
//         inwardId: item?.inwardId || inv?.id,
//         orderItemId: item?.orderItemId || item?.id,
//         inwardNo: item?.inwardNo || inv?.inwardNo || '',
//         orderNo: item?.orderNo || entry?.orderNo || ''
//       };
//     });

//     const filtered = source.filter((r: any) => Number(r.rejectedQty || 0) > 0);
//     setItemPopupRows(filtered);
//     setIsItemDialogOpen(true);
//   };

//   const confirmItemDialog = () => {
//     const picks = (itemPopupRows || []).filter((r: any) => r.selected);
//     if (picks.length === 0) { toast.error('Select at least one item'); return; }

//     setItemRows(prev => {
//       const existingIds = new Set((prev || []).map(r => String(r.orderItemId)));
//       const toAdd: ItemEntryRow[] = picks
//         .filter((p: any) => !existingIds.has(String(p.orderItemId)))
//         .map((p: any) => ({
//           itemId: String(p.itemId),
//           itemName: p.itemName,
//           itemCode: p.itemCode,
//           inwardNo: p.inwardNo,
//           availableQty: String(p.availableQty),
//           availableBags: String(p.availableBags),
//           kgsPerBag: String(p.kgsPerBag),
//           rejectedQty: String(p.rejectedQty || '0'),
//           returnQuantity: '',
//           warehouseId: String(p.warehouseId),
//           warehouseName: p.warehouseName,
//           uomId: p.uomId,
//           inwardId: p.inwardId,
//           orderItemId: p.orderItemId
//         }));
//       return [...prev, ...toAdd];
//     });

//     setIsItemDialogOpen(false);
//   };

//   const yarnColumns = useMemo<PopupColumn[]>(() => [
//     {
//       Header: 'Action',
//       id: 'selected',
//       disableFilters: true,
//       Cell: ({ row, index }) => (
//         <input
//           type="checkbox"
//           checked={row.selected || false}
//           onChange={e =>
//             setYarnPopupRows(prev =>
//               prev.map((r, i) =>
//                 i === index ? { ...r, selected: e.target.checked } : r
//               )
//             )
//           }
//         />
//       ),
//     },
//     {
//       Header: 'Inward No',
//       accessor: 'inwardNo',
//       id: 'inwardNo',
//     },
//     {
//       Header: 'Yarn Name',
//       accessor: 'yarnName',
//       id: 'yarnName',
//     },
//     {
//       Header: 'Mill Name',
//       accessor: (row: any) =>
//         row.millNameId
//           ? getMillNameFromId(row.millNameId)
//           : (row.millName || 'N/A'),
//       id: 'millName',
//     },
//     {
//       Header: 'Rejected Quantity',
//       accessor: 'rejectedQty',
//       id: 'rejectedQty',
//       Cell: ({ row }) => (
//         <input
//           type="number"
//           className="border px-2 py-1 rounded w-full text-center font-semibold text-green-700"
//           value={row.rejectedQty || ''}
//           readOnly
//         />
//       ),
//     },
//     {
//       Header: 'Lot No',
//       accessor: 'lotNo',
//       id: 'lotNo',
//       Cell: ({ row, index }) => (
//         <input
//           type="text"
//           className="border px-2 py-1 rounded w-full text-center"
//           value={row.lotNo || ''}
//           readOnly
//           onChange={e =>
//             setYarnPopupRows(prev =>
//               prev.map((r, i) =>
//                 i === index ? { ...r, lotNo: e.target.value } : r
//               )
//             )
//           }
//         />
//       ),
//     },
//     {
//       Header: 'Warehouse',
//       accessor: (row: any) => {
//         const warehouseName = row.warehouseId
//           ? (Array.isArray(warehouseList)
//             ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId))?.warehouseName
//             : '')
//           : '';
//         return warehouseName || row.warehouseId || 'Not set';
//       },
//       id: 'warehouse',
//       Cell: ({ row }) => {
//         const warehouseName = row.warehouseId
//           ? (Array.isArray(warehouseList)
//             ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId))?.warehouseName
//             : '')
//           : '';
//         return (
//           <input
//             type="text"
//             className="border px-2 py-1 rounded w-full text-center"
//             value={warehouseName || row.warehouseId || 'Not set'}
//             readOnly
//           />
//         );
//       },
//     },
//   ], [warehouseList, getMillNameFromId]);

//   const fabricColumns = useMemo<PopupColumn[]>(() => [
//     {
//       Header: 'Action',
//       id: 'selected',
//       disableFilters: true,
//       Cell: ({ row, index }) => (
//         <input
//           type="checkbox"
//           checked={row.selected || false}
//           onChange={e =>
//             setFabricPopupRows(prev =>
//               prev.map((r, i) =>
//                 i === index ? { ...r, selected: e.target.checked } : r
//               )
//             )
//           }
//         />
//       ),
//     },
//     {
//       Header: 'Fabric Code - Quality',
//       accessor: (row: any) => `${row.fabricCode || ''}-${row.quality || ''}`,
//       id: 'fabricCodeQuality',
//     },
//     {
//       Header: 'Piece No',
//       accessor: 'pieceNo',
//       id: 'pieceNo',
//       Cell: ({ row, index }) => (
//         <input
//           type="text"
//           className="border px-2 py-1 rounded w-full"
//           value={row.pieceNo || ''}
//           readOnly
//           onChange={e =>
//             setFabricPopupRows(prev =>
//               prev.map((r, i) =>
//                 i === index ? { ...r, pieceNo: e.target.value } : r
//               )
//             )
//           }
//         />
//       ),
//     },
//     {
//       Header: 'Piece Meter',
//       accessor: 'pieceMeter',
//       id: 'pieceMeter',
//       Cell: ({ row }) => (
//         <input
//           type="text"
//           className="border px-2 py-1 rounded w-full"
//           value={row.pieceMeter || ''}
//           readOnly
//         />
//       ),
//     },
//     {
//       Header: 'Net Weight',
//       accessor: 'netWeight',
//       id: 'netWeight',
//       Cell: ({ row }) => (
//         <input
//           type="text"
//           className="border px-2 py-1 rounded w-full"
//           value={row.netWeight || ''}
//           readOnly
//         />
//       ),
//     },
//     {
//       Header: 'Warehouse',
//       accessor: (row: any) => {
//         const w = Array.isArray(warehouseList) ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId)) : undefined;
//         return w?.warehouseName || row.warehouseId || '';
//       },
//       id: 'warehouse',
//       Cell: ({ row }) => {
//         const w = Array.isArray(warehouseList) ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId)) : undefined;
//         const name = w?.warehouseName || row.warehouseId || '';
//         return <input type="text" className="border px-2 py-1 rounded w-full" value={name} readOnly />;
//       },
//     },
//   ], [warehouseList]);

//   const itemColumns = useMemo<PopupColumn[]>(() => [
//     {
//       Header: 'Action',
//       id: 'selected',
//       disableFilters: true,
//       Cell: ({ row, index }) => (
//         <input
//           type="checkbox"
//           checked={row.selected || false}
//           onChange={e =>
//             setItemPopupRows(prev =>
//               prev.map((r, i) =>
//                 i === index ? { ...r, selected: e.target.checked } : r
//               )
//             )
//           }
//         />
//       ),
//     },
//     {
//       Header: 'Purchase Order No',
//       accessor: (row: any) => row.purchaseOrderNo || row.orderNo || 'N/A',
//       id: 'purchaseOrderNo',
//     },
//     {
//       Header: 'Inward No',
//       accessor: 'inwardNo',
//       id: 'inwardNo',
//     },
//     {
//       Header: 'Item Name',
//       accessor: 'itemName',
//       id: 'itemName',
//     },
//     {
//       Header: 'Item Code',
//       accessor: 'itemCode',
//       id: 'itemCode',
//     },
//     {
//       Header: 'Warehouse',
//       accessor: (row: any) => row.warehouseName || row.warehouseId || '',
//       id: 'warehouse',
//     },
//     {
//       Header: 'Rejected Quantity',
//       accessor: 'rejectedQty',
//       id: 'rejectedQty',
//       Cell: ({ row }) => (
//         <div className="text-center text-green-700 font-semibold">
//           {row.rejectedQty}
//         </div>
//       ),
//     },
//   ], []);

//   useEffect(() => {
//     dispatch(getAllPoTypes({} as any));
//     dispatch(getAllVendors({} as any));
//     const scopedPurchaseOrderParams: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
//     if (selectedCompanyId) {
//       scopedPurchaseOrderParams.companyId = selectedCompanyId;
//     }
//     dispatch(getAllPurchaseOrders(scopedPurchaseOrderParams));
//     dispatch(getAllYarnMasters({} as any));
//     dispatch(getAllPurchaseInwards({} as any));
//     dispatch(getAllFabricMasters({} as any));
//     dispatch(getAllSubCategories({} as any));
//     dispatch(getAllTransports({} as any));
//     const scopedPurchaseReturnParams: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
//     if (selectedCompanyId) {
//       scopedPurchaseReturnParams.companyId = selectedCompanyId;
//     }
//     dispatch(getAllPurchaseReturns(scopedPurchaseReturnParams));

//     // dispatch(getAllSizingYarnIssue({} as any));
//     // dispatch(getAllWeavingYarnIssue({} as any));
//   }, [dispatch, selectedCompanyId]);

//   // Reset dependent fields on type change (guard during edit prefill)
//   const isPrefilling = useRef(false);
//   useEffect(() => {
//     if (isPrefilling.current) return;
//     const rec: any = (location as any)?.state?.record;
//     if (rec?.id) return;

//     setValue('vendorId', '');
//     setValue('purchaseOrderId', '');
//     setYarnRows([]);
//     setFabricRows([]);
//     setItemRows([]);
//   }, [purchaseType, setValue]);


//   // Fetch warehouses once
//   useEffect(() => {
//     dispatch(getAllWarehouse({} as any));
//   }, [dispatch]);

//   // Edit-mode: hydrate form and rows when navigated with a record id
//   useEffect(() => {
//     const rec: any = (location as any)?.state?.record;
//     if (!rec?.id) return;

//     const load = async () => {
//       try {
//         isPrefilling.current = true;
//         console.log(`Prefilling: Fetching purchase return ${rec.id}`);
//         const res: any = await apiService.get(`/purchase-returns/${Number(rec.id)}`);
//         console.log('Prefilling: Received response:', res);
        
//         // Backend returns PurchaseReturnDTO directly
//         let r = res;
        
//         if (!r) {
//           console.error('Prefilling: No data found in response');
//           return;
//         }
        
//         console.log('Prefilling: Using record:', r);

//         // Core form fields
//         setValue('id', r?.id ?? null);
//         setValue('returnNo', r?.returnNo || '');
//         setValue('returnDate', (r?.returnDate || '').slice(0, 10));
//         setValue('purchaseType', r?.purchaseType || '');
//         setValue('vendorId', r?.vendorId != null ? String(r.vendorId) : '');
//         setValue('purchaseOrderId', r?.purchaseOrderId != null ? String(r.purchaseOrderId) : '');
//         setValue('grossWt', r?.grossWt != null ? String(r.grossWt) : '');
//         setValue('remark', r?.remark || '');
//         setValue('vehicleNo', r?.vehicleNo || '');
//         setValue('transportId', r?.transportId != null ? String(r.transportId) : '');

//         console.log('Prefilling: Form fields set', {
//           id: r.id,
//           purchaseType: r.purchaseType,
//           vendorId: r.vendorId,
//           purchaseOrderId: r.purchaseOrderId
//         });

//         // Rows based on type
//         if ((r?.purchaseType || '') === 'yarn') {
//           const yRows = (r?.yarnItems || []).map((y: any) => {
//             // Try to get millNameId or millId from response directly
//             let millNameId = (y?.millNameId ?? y?.millId) != null ? String(y.millNameId ?? y.millId) : null;

//             const resolvedMillName = (y?.millName && y.millName !== '')
//               ? y.millName
//               : (millNameId ? getMillNameFromId(millNameId) : '');

//             return {
//               id: y?.id,
//               yarnId: y?.yarnId != null ? String(y.yarnId) : '',
//               yarnName: y?.yarnName || '',
//               returnQuantity: y?.returnQuantity != null ? String(y.returnQuantity) : '',
//               availableBags: y?.availableBags != null ? String(y.availableBags) : (y?.availableQuantityBags != null ? String(y.availableQuantityBags) : ''),
//               kgsPerBag: y?.kgsPerBag != null ? String(y.kgsPerBag) : '',
//               conesPerBag: y?.conesPerBag != null ? String(y.conesPerBag) : '',
//               conesWeight: y?.conesWeight != null ? String(y.conesWeight) : '',
//               rejectedQty: y?.rejectedQty != null ? String(y.rejectedQty) : (y?.availableQty != null ? String(y.availableQty) : (y?.availableQuantity != null ? String(y.availableQuantity) : '')),
//               lotNo: y?.lotNo || '',
//               warehouseId: y?.warehouseId != null ? String(y.warehouseId) : '',
//               millName: resolvedMillName,
//               millNameId: millNameId,
//               inwardId: y?.inwardId ?? null,
//               orderItemId: y?.orderItemId ?? null,
//               yarnInwardStockDetailsId: y?.yarnInwardStockDetailsId ?? null,
//               inwardNo: y?.inwardNo || '',
//               purchaseInwardId: y?.purchaseInwardId ?? null,
//               purchaseInwardNo: y?.purchaseInwardNo || '',
//               ratePerUnit: y?.ratePerUnit != null ? String(y.ratePerUnit) : '',
//               gstPercent: y?.gstPercent != null ? String(y.gstPercent) : '',
//               gstAmount: y?.gstAmount != null ? String(y.gstAmount) : '',
//               totalAmount: y?.totalAmount != null ? String(y.totalAmount) : '',
//             };
//           });
//           setYarnRows(yRows);
//           setFabricRows([]);
//         } else if ((r?.purchaseType || '') === 'item') {
//           const itemData = r?.items || [];
//           const iRows = itemData.map((i: any) => ({
//             id: i?.id,
//             itemId: i?.itemId != null ? String(i.itemId) : '',
//             itemName: i?.itemName || '',
//             itemCode: i?.itemCode || '',
//             inwardNo: i?.inwardNo || '',
//             returnQuantity: i?.returnQuantity != null ? String(i.returnQuantity) : '',
//             availableQty: i?.availableQuantity != null ? String(i.availableQuantity) : (i?.availableQty != null ? String(i.availableQty) : ''),
//             availableBags: i?.availableBags != null ? String(i.availableBags) : '',
//             kgsPerBag: i?.unitPerBags != null ? String(i.unitPerBags) : (i?.kgsPerBag != null ? String(i.kgsPerBag) : ''),
//             rejectedQty: i?.rejectedQty != null ? String(i.rejectedQty) : '0',
//             warehouseId: i?.warehouseId != null ? String(i.warehouseId) : '',
//             uomId: i?.uomId != null ? String(i.uomId) : '',
//             inwardId: i?.inwardId ?? null,
//             orderItemId: i?.orderItemId ?? null,
//           }));
//           setItemRows(iRows);
//           setYarnRows([]);
//           setFabricRows([]);
//         } else {
//           const fRows = (r?.fabricItems || []).map((f: any) => ({
//             id: f?.id,
//             fabricMasterId: f?.fabricMasterId != null ? String(f.fabricMasterId) : '',
//             fabricCode: f?.fabricCode || '',
//             quality: f?.quality || '',
//             returnQuantity: f?.returnQuantity != null ? String(f.returnQuantity) : '',
//             pieceNo: f?.pieceNo || '',
//             pieceMeter: f?.pieceMeter != null ? String(f.pieceMeter) : '',
//             netWeight: f?.netWeight != null ? String(f.netWeight) : '',
//             warehouseId: f?.warehouseId != null ? String(f.warehouseId) : '',
//             isPacked: f?.isPacked != null ? f.isPacked : 0,
//             inwardId: f?.inwardId ?? null,
//             orderItemId: f?.orderItemId ?? null,
//           }));
//           setFabricRows(fRows);
//           setYarnRows([]);
//           setItemRows([]);
//         }
//       } catch (e) {
//         // noop; UI already has guards
//       } finally {
//         isPrefilling.current = false;
//       }
//     };

//     load();
//   }, [location, setValue]);

//   // Add this debug useEffect to track the yarnRows data
//   useEffect(() => {
//     console.log('=== YARN ROWS DEBUG ===');
//     console.log('yarnRows:', yarnRows);
//     if (yarnRows.length > 0) {
//       yarnRows.forEach((row, index) => {
//         console.log(`Row ${index}:`, {
//           yarnId: row.yarnId,
//           yarnName: row.yarnName,
//           millName: row.millName,
//           millNameId: row.millNameId,
//           rejectedQty: row.rejectedQty,
//           warehouseId: row.warehouseId
//         });
//       });
//     }
//     console.log('=======================');
//   }, [yarnRows]);

//   // Update millName in yarnRows when subCategoryList hydrates (critical for edit mode on refresh)
//   useEffect(() => {
//     if (!subCategoryList || yarnRows.length === 0) return;
    
//     // Check if any row needs mill name hydration
//     const needsHydration = yarnRows.some(row => row.millNameId && (!row.millName || row.millName === ''));
//     if (!needsHydration) return;

//     const list = Array.isArray(subCategoryList) ? subCategoryList : (subCategoryList?.data || []);
//     if (list.length === 0) return;

//     setYarnRows(prev => {
//       let changed = false;
//       const updated = prev.map(row => {
//         if (row.millNameId && (!row.millName || row.millName === '')) {
//           const name = getMillNameFromId(row.millNameId);
//           if (name) {
//             changed = true;
//             return { ...row, millName: name };
//           }
//         }
//         return row;
//       });
//       return changed ? updated : prev;
//     });
//   }, [subCategoryList, yarnRows.length, getMillNameFromId]);



//   // Filter vendors based on selected type (similar to purchase-inward.tsx)
//   const filteredVendors = useMemo(() => {
//     const rec: any = (location as any)?.state?.record;
//     const currentVendorId = String(vendorId || rec?.vendorId || '');

//     let vendors = [];
//     if (purchaseType && Array.isArray(vendorList) && poTypeIdForType) {
//       vendors = filterVendorsByPoType(vendorList, poTypeIdForType, {
//         purchaseOrderTypes: purchaseOrderTypeList,
//         fallbackKeyword: purchaseType,
//         includeVendorTypeIds: [VENDOR_TYPE_ALL],
//       });
//     } else {
//       vendors = Array.isArray(vendorList) ? vendorList : [];
//     }

//     // Ensure the current vendor is always in the options
//     if (currentVendorId && !vendors.some((v: any) => String(v.id) === currentVendorId)) {
//       const globalVendor = Array.isArray(vendorList) ? vendorList.find((v: any) => String(v.id) === currentVendorId) : null;
//       if (globalVendor) {
//         vendors = [globalVendor, ...vendors];
//       } else if (rec?.vendorName) {
//         vendors = [{ id: currentVendorId, vendorName: rec.vendorName }, ...vendors];
//       } else if (rec?.vendor) {
//         vendors = [{ id: currentVendorId, vendorName: rec.vendor.vendorName || rec.vendor.name }, ...vendors];
//       }
//     }
//     return vendors;
//   }, [vendorList, purchaseType, poTypeIdForType, purchaseOrderTypeList, vendorId, location]);

//   // Filter POs based on vendor and PO Type
//   const filteredPOs = useMemo(() => {
//     const rec: any = (location as any)?.state?.record;
//     const currentId = String(purchaseOrderId || rec?.purchaseOrderId || '');

//     const list = Array.isArray(purchaseOrderList?.data) ? purchaseOrderList.data : purchaseOrderList;
//     const allPOs = list || [];

//     return allPOs.filter((po: any) => {
//       const matchesVendor = vendorId ? String(po.vendorId) === String(vendorId) : true;
//       const matchesPoType = poTypeIdForType !== undefined ? Number(po.poTypeId) === Number(poTypeIdForType) : true;
//       const isCurrentPO = rec?.id && String(po.id) === currentId;
//       return (matchesVendor && matchesPoType) || isCurrentPO;
//     });
//   }, [purchaseOrderList, vendorId, poTypeIdForType, purchaseOrderId, location]);

//   // For Fabric (woven/knitted): flatten pieceEntries
//   const fabricPiecesByPO = useMemo(() => {
//     if (poTypeIdForType !== 2 && poTypeIdForType !== 3) return [] as any[];
//     const rows: any[] = [];
//     (inwardByPOAndType || []).forEach((pi: any) => {
//       (pi?.purchaseInwardItemsDtl || []).forEach((dtl: any) => {
//         const baseFabricCode = dtl?.fabricCode || pi?.fabricCode || '';
//         const baseQuality = dtl?.quality ?? dtl?.fabricQuality ?? dtl?.qualityName ?? '';
//         const pieces = Array.isArray(dtl?.pieceEntries) ? dtl.pieceEntries : [];
//         pieces.forEach((pe: any) => {
//           // Treat null/undefined as not packed (0) to preserve old behavior; accept 0/"0"/false as not packed
//           const rawPacked = pe?.isPacked;
//           const isPackedZero = (rawPacked == null) || (String(rawPacked).toLowerCase() === '0') || (String(rawPacked).toLowerCase() === 'false') || (Number(rawPacked) === 0);
//           if (!isPackedZero) return; // only show isPacked == 0 pieces

//           // derive quality if missing on the piece from dtl or fabric master
//           let quality = pe?.quality ?? baseQuality;
//           if (!quality && pe?.fabricMasterId) {
//             const fm = (fabricMasterList || []).find((x: any) => String(x.id) === String(pe.fabricMasterId));
//             quality = fm?.fabricQuality || '';
//           }

//           rows.push({
//             selected: false,
//             fabricMasterId: pe?.fabricMasterId != null ? String(pe.fabricMasterId) : (dtl?.fabricMasterId != null ? String(dtl.fabricMasterId) : ''),
//             fabricCode: baseFabricCode,
//             quality,
//             pieceNo: pe?.pieceNumber || pe?.pieceNo || '',
//             pieceMeter: pe?.quantity != null ? String(pe.quantity) : '',
//             netWeight: pe?.weight != null ? String(pe.weight) : '',
//             warehouseId: pe?.warehouseId != null ? String(pe.warehouseId) : (dtl?.warehouseId != null ? String(dtl.warehouseId) : ''),
//             isPacked: isPackedZero ? 0 : 1,
//             inwardId: pi?.id ?? null,
//             orderItemId: dtl?.id ?? null
//           });
//         });
//       });
//     });
//     return rows;
//   }, [inwardByPOAndType, poTypeIdForType]);

//   // Derive items by PO
//   const yarnItemsByPO = useMemo(() => {
//     if (!purchaseOrderId) return [];

//     let po = (filteredPOs || []).find((p: any) => String(p.id) === String(purchaseOrderId));
//     if (!po) {
//       const fullList = Array.isArray((purchaseOrderList as any)?.data)
//         ? (purchaseOrderList as any).data
//         : (purchaseOrderList || []);
//       po = (fullList || []).find((p: any) => String(p.id) === String(purchaseOrderId));
//     }

//     const items = po?.purchaseOrderItemsDtl || [];
//     return items
//       .filter((i: any) => i?.yarnId || i?.yarnName)
//       .map((i: any) => {
//         let yarnId = i?.yarnId;
//         let yarnName = i?.yarnName;
//         if (!yarnName && yarnList) {
//           const ym = (yarnList || []).find((y: any) => String(y.id) === String(i.yarnId));
//           yarnName = ym?.yarnName || i.yarnName || i.yarnId;
//         }
//         if ((!yarnId || yarnId === '') && yarnList && yarnName) {
//           const ym2 = (yarnList as any[]).find((y: any) => String(y.yarnName).toLowerCase() === String(yarnName).toLowerCase());
//           if (ym2) yarnId = ym2.id;
//         }

//         // Get mill name from millNameId
//         const millName = i?.millName || getMillNameFromId(i?.millNameId);

//         return {
//           ...i,
//           yarnId,
//           yarnName,
//           millName,
//           millNameId: i?.millNameId ?? null
//         };
//       });
//   }, [filteredPOs, purchaseOrderList, purchaseOrderId, yarnList, subCategoryList]);

//   const fabricItemsByPO = useMemo(() => {
//     if (!purchaseOrderId) return [];

//     // Try filtered POs first, then fallback to full PO list (for edit mode compatibility)
//     let po = (filteredPOs || []).find((p: any) => String(p.id) === String(purchaseOrderId));
//     if (!po) {
//       const fullList = Array.isArray((purchaseOrderList as any)?.data)
//         ? (purchaseOrderList as any).data
//         : (purchaseOrderList || []);
//       po = (fullList || []).find((p: any) => String(p.id) === String(purchaseOrderId));
//     }

//     const items = po?.purchaseOrderItemsDtl || [];
//     return items
//       .filter((i: any) => i?.fabricCode || i?.fabricMasterId)
//       .map((i: any) => {
//         let quality = i?.quality ?? i?.fabricQuality ?? i?.qualityName;
//         if (!quality) {
//           const match = (fabricPiecesByPO || []).find((r: any) =>
//             String(r.fabricMasterId) === String(i.fabricMasterId) || ((r.fabricCode || '') === (i.fabricCode || ''))
//           );
//           if (match) quality = match.quality;
//         }
//         return { ...i, quality };
//       });
//   }, [filteredPOs, purchaseOrderList, purchaseOrderId, fabricPiecesByPO]);

//   // Get issued quantities from yarn issue data (by yarnId+lotNo+warehouseId key)
//   const issuedQuantitiesByKey = useMemo(() => {
//     const issuedMap = new Map<string, number>();

//     // Aggregate from sizing yarn issues
//     (sizingYarnIssuetList || []).forEach((issue: any) => {
//       if (issue.sizingYarnIssue && Array.isArray(issue.sizingYarnIssue)) {
//         issue.sizingYarnIssue.forEach((yarnIssue: any) => {
//           const yarnId = yarnIssue.yarnId;
//           const lotNo = yarnIssue.lotNo || '';
//           const warehouseId = yarnIssue.warehouseId || '';
//           const issueQty = Number(yarnIssue.issueQty || 0);

//           if (yarnId && issueQty > 0) {
//             const key = `${yarnId}|${lotNo}|${warehouseId}`;
//             const current = issuedMap.get(key) || 0;
//             issuedMap.set(key, current - issueQty);
//           }
//         });
//       }
//     });

//     // Aggregate from weaving yarn issues
//     (weavingYarnIssuetList || []).forEach((issue: any) => {
//       if (issue.requirements && Array.isArray(issue.requirements)) {
//         issue.requirements.forEach((requirement: any) => {
//           if (requirement.yarnIssues && Array.isArray(requirement.yarnIssues)) {
//             requirement.yarnIssues.forEach((yarnIssue: any) => {
//               const yarnId = yarnIssue.yarnId;
//               const lotNo = yarnIssue.lotNo || yarnIssue.lotId || '';
//               const warehouseId = yarnIssue.warehouseId || '';
//               const issueQty = Number(yarnIssue.issueQty || 0);

//               if (yarnId && issueQty > 0) {
//                 const key = `${yarnId}|${lotNo}|${warehouseId}`;
//                 const current = issuedMap.get(key) || 0;
//                 issuedMap.set(key, current - issueQty);
//               }
//             });
//           }
//         });
//       }
//     });

//     return issuedMap;
//   }, [sizingYarnIssuetList, weavingYarnIssuetList]);



//   // For Yarn: flatten lotEntries with real-time available quantity calculation
//   const yarnLotsByPO = useMemo(() => {
//     if (poTypeIdForType !== 1) return [] as any[];

//     // Get all previous returns for this PO to calculate deducted quantities
//     const previousReturns = (purchaseReturnList || []).filter((pr: any) =>
//       String(pr.purchaseOrderId) === String(purchaseOrderId) &&
//       pr.purchaseType === 'yarn'
//     );

//     // Create a map to track returned quantities by yarnId+lotNo+warehouseId
//     const returnedQtyMap = new Map();

//     previousReturns.forEach((pr: any) => {
//       (pr.yarnItems || []).forEach((yarnItem: any) => {
//         const key = `${yarnItem.yarnId}|${yarnItem.lotNo}|${yarnItem.warehouseId}`;
//         const currentReturned = returnedQtyMap.get(key) || 0;
//         returnedQtyMap.set(key, currentReturned - Number(yarnItem.returnQuantity || 0));
//       });
//     });

//     const lots: any[] = [];
//     (inwardByPOAndType || []).forEach((pi: any) => {
//       (pi?.purchaseInwardItemsDtl || []).forEach((dtl: any) => {
//         (dtl?.lotEntries || []).forEach((le: any) => {
//           const yarnId = le?.yarnId;
//           let yarnName = String(yarnId || '');
//           if (yarnId && Array.isArray(yarnList)) {
//             const ym = (yarnList as any[]).find((y: any) => String(y.id) === String(yarnId));
//             yarnName = ym?.yarnName || yarnName;
//           }

//           // Get mill name from millNameId
//           const millNameId = dtl?.millNameId || le?.millNameId;
//           const millName = millNameId ? getMillNameFromId(millNameId) : (dtl?.millName || le?.millName || '');

//           // Get warehouse
//           const warehouseId = le?.warehouseId != null ? String(le.warehouseId) : (dtl?.warehouseId != null ? String(dtl.warehouseId) : '');

//           // Calculate rejected quantity from inward balance for fallback dataset
//           const originalQty = Number(le?.quantity || 0);
//           const key = `${yarnId}|${le?.lotNumber || ''}|${warehouseId}`;
//           const issuedQty = issuedQuantitiesByKey.get(key) || 0;
//           const returnedQty = returnedQtyMap.get(key) || 0;
//           const rejectedQty = (originalQty || 0) - (issuedQty || 0);

//           lots.push({
//             selected: false,
//             yarnId: yarnId,
//             yarnName,
//             rejectedQty: String(rejectedQty),
//             originalQty: String(originalQty),
//             issuedQty: String(issuedQty),
//             returnedQty: String(returnedQty),
//             lotNo: le?.lotNumber || '',
//             warehouseId: warehouseId,
//             millName: millName,
//             millNameId: millNameId ?? null,
//             inwardId: pi?.id ?? null,
//             orderItemId: dtl?.id ?? null,
//           });
//         });
//       });
//     });
//     return lots;
//   }, [inwardByPOAndType, poTypeIdForType, yarnList, subCategoryList, purchaseOrderId, purchaseReturnList, issuedQuantitiesByKey]);

//   // Summary aggregation for fabric: group by Fabric Code - Quality
//   const fabricSummary = useMemo(() => {
//     const groups = new Map<string, { fabricCode: string; quality: string; totalPieces: number; totalMeters: number; totalNetWeight: number }>();
//     (fabricRows || []).forEach((r) => {
//       const fabricCode = String(r.fabricCode || '');
//       const quality = String((r as any).quality ?? r.fabricQuality ?? '');
//       const key = `${fabricCode}|${quality}`;
//       const pieceMeter = parseFloat(String(r.pieceMeter || '0')) || 0;
//       const netWeight = parseFloat(String(r.netWeight || '0')) || 0;
//       const prev = groups.get(key) || { fabricCode, quality, totalPieces: 0, totalMeters: 0, totalNetWeight: 0 };
//       prev.totalPieces += 1;
//       prev.totalMeters += pieceMeter;
//       prev.totalNetWeight += netWeight;
//       groups.set(key, prev);
//     });
//     return Array.from(groups.values());
//   }, [fabricRows]);

//   const fabricTotalsByKey = useMemo(() => {
//     const m: Record<string, number> = {} as any;
//     fabricSummary.forEach((s) => { m[`${s.fabricCode}|${s.quality}`] = s.totalMeters; });
//     return m;
//   }, [fabricSummary]);

//   // Summary aggregation for yarn: group by yarnId/yarnName
//   const yarnSummary = useMemo(() => {
//     const groups = new Map<string, { yarnId: string; yarnName: string; totalQuantity: number }>();
//     (yarnRows || []).forEach((r) => {
//       const yarnId = String(r.yarnId || '');
//       const yarnName = String(r.yarnName || '');
//       const key = `${yarnId}|${yarnName}`;
//       const qty = parseFloat(String(r.returnQuantity || '0')) || 0;
//       const prev = groups.get(key) || { yarnId, yarnName, totalQuantity: 0 };
//       prev.totalQuantity += qty;
//       groups.set(key, prev);
//     });
//     return Array.from(groups.values());
//   }, [yarnRows]);

//   const addYarnRow = () => setYarnRows(prev => [...prev, { yarnId: '', yarnName: '', uom: '', returnQuantity: '' }]);
//   const removeYarnRow = (idx: number) => setYarnRows(prev => prev.filter((_, i) => i !== idx));

//   const addFabricRow = () => setFabricRows(prev => [...prev, { fabricMasterId: '', fabricCode: '', quality: '', returnQuantity: '' }]);
//   const removeFabricRow = (idx: number) => setFabricRows(prev => prev.filter((_, i) => i !== idx));

//   // Validation: total returned qty cannot exceed ordered qty
//   const validateAgainstPO = (): boolean => {
//     const po = (filteredPOs || []).find((p: any) => String(p.id) === String(purchaseOrderId));
//     if (!po) return true;
//     const items = po?.purchaseOrderItemsDtl || [];
//     const selectKey = (candidates: any[], fallback: string) => {
//       const match = candidates
//         .map(value => (value != null && value !== '' ? String(value) : ''))
//         .find(Boolean);
//       return match || fallback;
//     };

//     if (purchaseType === 'yarn') {
//       const matchYarnItem = (row: YarnEntryRow, item: any) => {
//         const rowId = row?.yarnId != null && row.yarnId !== '' ? String(row.yarnId) : '';
//         if (rowId) {
//           const ids = [item?.yarnId, item?.itemId, item?.productId, item?.id]
//             .map((v: any) => (v != null && v !== '' ? String(v) : ''))
//             .filter(Boolean);
//           if (ids.includes(rowId)) {
//             return true;
//           }
//         }
//         const rowName = (row?.yarnName || '').trim().toLowerCase();
//         if (rowName) {
//           const names = [item?.yarnName, item?.itemName, item?.productName]
//             .map((v: any) => (v || '').trim().toLowerCase())
//             .filter(Boolean);
//           if (names.includes(rowName)) {
//             return true;
//           }
//         }
//         return false;
//       };

//       const totals = new Map<string, { orderedQty: number; returnedQty: number; label: string }>();
//       for (const [index, row] of yarnRows.entries()) {
//         const ordered = items.find((i: any) => matchYarnItem(row, i));
//         if (!ordered) {
//           continue;
//         }
//         const orderedQty = Number(ordered.quantity || 0);
//         const retQty = Number(row.returnQuantity || 0);
//         const key = selectKey(
//           [
//             ordered.id,
//             ordered.itemId,
//             ordered.productId,
//             ordered.yarnId,
//             row.yarnId,
//             (row.yarnName || '').toLowerCase()
//           ],
//           `idx-${index}`
//         );
//         const existing = totals.get(key) || { orderedQty, returnedQty: 0, label: row.yarnName || row.yarnId || key };
//         existing.returnedQty += retQty;
//         totals.set(key, existing);
//         if (existing.returnedQty > existing.orderedQty) {
//           toast.error(`Returned qty for ${existing.label} cannot exceed ordered qty (${existing.orderedQty}).`);
//           return false;
//         }
//       }
//     } else if (purchaseType === 'item') {
//       for (const row of itemRows) {
//         const retQty = Number(row.returnQuantity || 0);
//         const rejQty = Number(row.rejectedQty || 0);
//         if (retQty <= 0) {
//           toast.error(`Return Quantity is required for item "${row.itemName || row.itemId}".`);
//           return false;
//         }
//         if (rejQty > 0 && retQty > rejQty) {
//           toast.error(`Return Qty for "${row.itemName || row.itemId}" cannot exceed Rejected Qty (${rejQty}).`);
//           return false;
//         }
//       }
//     } else {
//       const totals = new Map<string, { orderedQty: number; returnedQty: number; label: string }>();
//       for (const [index, row] of fabricRows.entries()) {
//         const rowQuality = (row as any).quality ?? row.fabricQuality ?? '';
//         const ordered = items.find((i: any) => String(i.fabricMasterId) === String(row.fabricMasterId) || ((i.fabricCode || '') === (row.fabricCode || '') && (i.quality || '') === rowQuality));
//         if (!ordered) {
//           continue;
//         }
//         const orderedQty = Number(ordered.quantity || 0);
//         const retQty = Number(row.returnQuantity || 0);
//         const labelBase = row.fabricCode && rowQuality
//           ? `${row.fabricCode}-${rowQuality}`
//           : row.fabricCode || rowQuality || String(row.fabricMasterId || '');
//         const key = selectKey(
//           [
//             ordered.id,
//             ordered.fabricMasterId,
//             `${ordered.fabricCode || ''}-${ordered.quality || ''}`,
//             row.fabricMasterId,
//             labelBase
//           ],
//           `idx-${index}`
//         );
//         const existing = totals.get(key) || { orderedQty, returnedQty: 0, label: labelBase || key };
//         existing.returnedQty += retQty;
//         totals.set(key, existing);
//         if (existing.returnedQty > existing.orderedQty) {
//           toast.error(`Returned qty for ${existing.label} cannot exceed ordered qty (${existing.orderedQty}).`);
//           return false;
//         }
//       }
//     }
//     return true;
//   };

//   const onSubmit = async (data: PurchaseReturnForm) => {
//     isSavingRef.current = true;
//     if (!purchaseType) { isSavingRef.current = false; toast.error('Select Purchase Type'); return; }
//     if (!vendorId) { isSavingRef.current = false; toast.error('Select Vendor'); return; }
//     if (!purchaseOrderId) { isSavingRef.current = false; toast.error('Select PO'); return; }

//     if (purchaseType === 'yarn' && yarnRows.length === 0) {
//       isSavingRef.current = false; toast.error('Please add at least one yarn item'); return;
//     }
//     if ((purchaseType === 'fabric' || purchaseType === 'knitted') && fabricRows.length === 0) {
//       isSavingRef.current = false; toast.error('Please add at least one fabric item'); return;
//     }
//     if (purchaseType === 'item' && itemRows.length === 0) {
//       isSavingRef.current = false; toast.error('Please add at least one item'); return;
//     }

//     if (purchaseType === 'yarn' && yarnRows.some(r => !r.returnQuantity || Number(r.returnQuantity) <= 0)) {
//       isSavingRef.current = false;
//       toast.error('Return Quantity is required for all yarn rows');
//       return;
//     }

//     if (!validateAgainstPO()) { isSavingRef.current = false; return; }

//     if ((purchaseType === 'fabric' || purchaseType === 'knitted') && fabricRows.some(r => !r.returnQuantity || Number(r.returnQuantity) <= 0)) {
//       isSavingRef.current = false;
//       toast.error('Return Quantity is required for all fabric rows');
//       return;
//     }


//     const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//     if (!storedCompanyId) {
//       isSavingRef.current = false;
//       toast.error("Please select a company before submitting");
//       return;
//     }

//     let returnNo = data.returnNo;
//     // Debug: Check what's in yarnRows before creating payload
//     console.log('=== BEFORE SUBMIT - YARN ROWS ===');
//     yarnRows.forEach((row, index) => {
//       console.log(`Row ${index} millNameId:`, row.millNameId);
//     });

//     const yarnSummary = {
//       yarnId: purchaseType === 'yarn' && yarnRows[0]?.yarnId ? String(yarnRows[0].yarnId) : '',
//       yarnName: purchaseType === 'yarn' && yarnRows[0]?.yarnName ? yarnRows[0].yarnName : '',
//       totalQuantity: purchaseType === 'yarn' ? yarnRows.reduce((sum, row) => sum + Number(row.returnQuantity || 0), 0) : 0
//     };

//     const fabricSummary = {
//       fabricCode: (purchaseType === 'fabric' || purchaseType === 'knitted') && fabricRows[0]?.fabricCode ? fabricRows[0].fabricCode : '',
//       quality: (purchaseType === 'fabric' || purchaseType === 'knitted') ? ((fabricRows[0] as any)?.quality ?? fabricRows[0]?.fabricQuality ?? '') : '',
//       totalPieces: (purchaseType === 'fabric' || purchaseType === 'knitted') ? fabricRows.length : 0,
//       totalMeters: (purchaseType === 'fabric' || purchaseType === 'knitted') ? fabricRows.reduce((sum, row) => sum + Number(row.pieceMeter || 0), 0) : 0,
//       totalNetWeight: (purchaseType === 'fabric' || purchaseType === 'knitted') ? fabricRows.reduce((sum, row) => sum + Number(row.netWeight || 0), 0) : 0
//     };

//     const itemSummary = {
//       itemId: purchaseType === 'item' && itemRows[0]?.itemId ? String(itemRows[0].itemId) : '',
//       itemName: purchaseType === 'item' && itemRows[0]?.itemName ? itemRows[0].itemName : '',
//       totalQuantity: purchaseType === 'item' ? itemRows.reduce((sum, row) => sum + Number(row.returnQuantity || 0), 0) : 0
//     };

//     const payload: any = {
//       id: data.id ? Number(data.id) : 0,
//       returnNo: returnNo, // Use resolved number
//       returnDate: data.returnDate,
//       purchaseType: purchaseType,
//       vendorId: String(vendorId),
//       purchaseOrderId: Number(purchaseOrderId),
//       companyId: parseInt(storedCompanyId),
//       transportId: data.transportId ? String(data.transportId) : '',
//       remark: data.remark || '',
//       vehicleNo: data.vehicleNo || '',
//       grossWt: data.grossWt ? String(data.grossWt) : '',

//       yarnItems: purchaseType === 'yarn'
//         ? yarnRows.map(y => ({
//           id: y.id ? Number(y.id) : 0,
//           yarnId: y.yarnId != null && y.yarnId !== '' ? String(y.yarnId) : '',
//           yarnName: y.yarnName || '',
//           returnQuantity: String(y.returnQuantity || '0'),
//           rejectedQty: (y as any).rejectedQty != null && (y as any).rejectedQty !== ''
//             ? String((y as any).rejectedQty)
//             : ((y as any).availableQty != null && (y as any).availableQty !== '' ? String((y as any).availableQty) : '0'),
//           availableBags: y.availableBags != null && y.availableBags !== '' ? String(y.availableBags) : '',
//           kgsPerBag: y.kgsPerBag != null && y.kgsPerBag !== '' ? String(y.kgsPerBag) : '',
//           conesPerBag: y.conesPerBag != null && y.conesPerBag !== '' ? String(y.conesPerBag) : '',
//           conesWeight: y.conesWeight != null && y.conesWeight !== '' ? String(y.conesWeight) : '',
//           lotNo: y.lotNo || '',
//           millNameId: y.millNameId != null && y.millNameId !== '' ? String(y.millNameId) : '',
//           warehouseId: y.warehouseId != null && y.warehouseId !== '' ? String(y.warehouseId) : '',
//           inwardId: y.inwardId != null ? String(y.inwardId) : '',
//           orderItemId: y.orderItemId != null ? String(y.orderItemId) : '',
//           purchaseInwardId: y.purchaseInwardId != null ? String(y.purchaseInwardId) : '',
//           ratePerUnit: y.ratePerUnit != null && y.ratePerUnit !== '' ? String(y.ratePerUnit) : '',
//           gstPercent: y.gstPercent != null && y.gstPercent !== '' ? String(y.gstPercent) : '',
//           gstAmount: y.gstAmount != null && y.gstAmount !== '' ? String(y.gstAmount) : '',
//           totalAmount: y.totalAmount != null && y.totalAmount !== '' ? String(y.totalAmount) : '',
//         }))
//         : [],
//       fabricItems: (purchaseType === 'fabric' || purchaseType === 'knitted')
//         ? fabricRows.map(f => ({
//           id: f.id ? Number(f.id) : 0,
//           fabricMasterId: f.fabricMasterId != null && f.fabricMasterId !== '' ? String(f.fabricMasterId) : '',
//           fabricCode: f.fabricCode || '',
//           quality: (f as any).quality ?? f.fabricQuality ?? '',
//           returnQuantity: String(f.returnQuantity || '0'),
//           pieceNo: f.pieceNo || '',
//           pieceMeter: f.pieceMeter != null && f.pieceMeter !== '' ? String(f.pieceMeter) : '',
//           netWeight: f.netWeight != null && f.netWeight !== '' ? String(f.netWeight) : '',
//           warehouseId: f.warehouseId != null && f.warehouseId !== '' ? String(f.warehouseId) : '',
//           isPacked: String(f.isPacked ?? '0'),
//         }))
//         : [],
//       items: purchaseType === 'item'
//         ? itemRows.map(i => ({
//           id: i.id ? Number(i.id) : 0,
//           inwardNo: i.inwardNo || '',
//           itemId: i.itemId != null && i.itemId !== '' ? String(i.itemId) : '',
//           itemName: i.itemName || '', 
//           itemCode: i.itemCode || '',
//           warehouseId: i.warehouseId != null && i.warehouseId !== '' ? String(i.warehouseId) : '',
//           availableBags: String(i.availableBags || '0'),
//           unitPerBags: String(i.kgsPerBag || '0'),
//           availableQuantity: i.availableQty != null && i.availableQty !== '' ? String(i.availableQty) : '0',
//            rejectedQty:i.rejectedQty != null && (i as any).rejectedQty !== ''
//             ? String((i as any).rejectedQty)
//             : ((i as any).availableQty != null && (i as any).availableQty !== '' ? String((i as any).availableQty) : '0'),
//           returnQuantity: String(i.returnQuantity || '0'),
//           inwardId: i.inwardId != null ? String(i.inwardId) : '',
//           orderItemId: i.orderItemId != null ? String(i.orderItemId) : '',
//         }))
//         : [],
//       yarnSummary: yarnSummary,
//       fabricSummary: fabricSummary,
//     };


//     try {

//       console.log('=== FINAL PAYLOAD ===');
//       console.log(JSON.stringify(payload, null, 2));
//       if (data.id) {
//         await dispatch(updatePurchaseReturn({ id: Number(data.id), data: payload, companyId: payload.companyId })).unwrap();
//       } else {
//         await dispatch(createPurchaseReturn(payload)).unwrap();
//          documentNumberService.clearMemoryCache("Purchase Return");
//       }
//       navigate('/transaction/purchase-return-details');
//     } catch (error) {
//       isSavingRef.current = false;
//       console.error('Error submitting purchase return:', error);
//     }
//   };

//   const handleBack = () => navigate('/transaction/purchase-return-details');

//   // Ensure selected PO appears immediately in edit-mode even before lists hydrate
//   // Also fetch PO by ID if it's not in lists so we can display correct poNo label
//   const [poById, setPoById] = useState<any | null>(null);

//   // ADD: Map global PO list by id for instant lookups
//   const poMapById = useMemo(() => {
//     const globalList = Array.isArray((purchaseOrderList as any)?.data)
//       ? (purchaseOrderList as any).data
//       : ((purchaseOrderList as any) || []);
//     const map: Record<string, any> = {};
//     (globalList || []).forEach((po: any) => {
//       if (po?.id != null) map[String(po.id)] = po;
//     });
//     return map;
//   }, [purchaseOrderList]);

//   // ADD: Find the edit record from purchaseReturnList (list view often has poNo)
//   const recFromList = useMemo(() => {
//     const rec: any = (location as any)?.state?.record;
//     const editId = rec?.id;
//     if (!editId) return null;

//     const list =
//       Array.isArray((purchaseReturnList as any)?.data)
//         ? (purchaseReturnList as any).data
//         : (Array.isArray(purchaseReturnList) ? purchaseReturnList : []);

//     return (list || []).find((r: any) => String(r.id) === String(editId)) || null;
//   }, [location, purchaseReturnList]);

//   useEffect(() => {
//     const rec: any = (location as any)?.state?.record;
//     const currentId = String(purchaseOrderId || rec?.purchaseOrderId || '');
//     if (!currentId) { 
//       console.log('FetchPOById: No currentId');
//       setPoById(null); 
//       return; 
//     }

//     const filtered = Array.isArray(filteredPOs) ? filteredPOs : [];
//     const globalList = Array.isArray((purchaseOrderList as any)?.data)
//       ? (purchaseOrderList as any).data
//       : ((purchaseOrderList as any) || []);

//     const existsWithLabel = [...filtered, ...globalList].some((po: any) =>
//       String(po.id) === currentId && String(po.poNo || '') !== ''
//     );
//     if (existsWithLabel) { 
//       console.log('FetchPOById: PO already exists in lists with label');
//       setPoById(null); 
//       return; 
//     }

//     (async () => {
//       try {
//         const endpoint = selectedCompanyId
//           ? `/purchase-orders/company/${selectedCompanyId}/${Number(currentId)}`
//           : `/purchase-orders/${Number(currentId)}`;
//         console.log(`FetchPOById: Fetching from ${endpoint}`);
//         const res: any = await apiService.get(endpoint);
//         console.log('FetchPOById: Received response:', res);
//         const po = Array.isArray(res?.data) ? res.data[0] : (res?.data || res);
//         if (po?.id) {
//           console.log('FetchPOById: Setting poById:', po);
//           setPoById(po);
//         }
//       } catch (err) {
//         console.error('FetchPOById: Failed', err);
//       }
//     })();
//   }, [purchaseOrderId, filteredPOs, purchaseOrderList, location, selectedCompanyId]);

//   const poOptions = useMemo(() => {
//     const rec: any = (location as any)?.state?.record;
//     const currentId = String(purchaseOrderId || rec?.purchaseOrderId || '');

//     console.log('poOptions - currentId:', currentId, 'filteredPOs count:', filteredPOs?.length);

//     let options = [...(filteredPOs || [])];

//     // If we're in edit mode and have a current ID, ensure it's in the options
//     if (rec?.id && currentId && currentId !== '') {
//       const isCurrentInOptions = options.some(po => String(po.id) === currentId);

//       if (!isCurrentInOptions) {
//         console.log('Current PO not in filtered list, searching globally...');

//         // Search in global purchase order list
//         const globalList = Array.isArray((purchaseOrderList as any)?.data)
//           ? (purchaseOrderList as any).data
//           : ((purchaseOrderList as any) || []);

//         const missingPO = globalList.find((po: any) => String(po.id) === currentId);

//         if (missingPO) {
//           console.log('Found missing PO in global list:', missingPO);
//           options = [missingPO, ...options];
//         } else {
//           // Last resort: create synthetic option
//           console.log('Creating synthetic PO option for ID:', currentId);
//           const syntheticPO = {
//             id: currentId,
//             poNo: rec?.poNo || `PO-${currentId}`,
//             vendorId: rec?.vendorId
//           };
//           options = [syntheticPO, ...options];
//         }
//       }
//     }

//     console.log('Final poOptions count:', options.length);
//     return options;
//   }, [filteredPOs, purchaseOrderList, purchaseOrderId, location]);

//   return (
//     <div className="p-6 pt-16 space-y-6">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-4">
//           <Button
//             variant="outline"
//             onClick={() => navigate("/transaction/purchase-return-details")}
//             className="mr-auto"
//           >
//             <ArrowLeft size={18} className="mr-2" />
//             Back
//           </Button>
//           <h1 className="text-2xl font-semibold flex items-center gap-2">   Purchase Return</h1>
//         </div>

       
//       </div>

//       <Card className='bg-white'>
//         <CardHeader>
//           <CardTitle>Return Details</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>

//               <label className="block text-sm mb-1">Return No</label>

//               <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"

//                 {...register('returnNo')} readOnly />

//             </div>
//             <div>
//               <label className="block text-sm mb-1">Return Date</label>
//               <input type="date" className="w-full border px-3 py-2 rounded"
//                 {...register('returnDate', { required: true })} />
//             </div>
//             <div>
//               <label className="block text-sm mb-1">Purchase Type</label>
//               <CommonSearchableSelect
//                 {...register('purchaseType', { required: true })}
//                 value={watch('purchaseType')}
//                 onValueChange={(val) => {
//                   setValue('purchaseType', val as any);
//                   setValue('vendorId', '');
//                   setValue('purchaseOrderId', '');
//                   setYarnRows([]);
//                   setFabricRows([]);
//                   setItemRows([]);
//                   setYarnPopupRows([]);
//                   setFabricPopupRows([]);
//                   setItemPopupRows([]);
//                 }}
//               >
//                 <option value="">Select</option>
//                 {(Array.isArray(purchaseOrderTypeList) ? purchaseOrderTypeList : purchaseOrderTypeList?.data || []).map((pt: any) => {
//                   const name = (pt?.poTypeName || pt?.typeName || pt?.name || '').toLowerCase();
//                   let value = '';
//                   if (name.includes('yarn')) value = 'yarn';
//                   else if (name.includes('fabric')) value = 'fabric';
//                   else if (name.includes('knit')) value = 'knitted';
//                   else if (name.includes('item')) value = 'item';
//                   return value ? <option key={pt.id} value={value}>{pt?.poTypeName || pt?.typeName || pt?.name || 'Unknown'}</option> : null;
//                 })}
//               </CommonSearchableSelect>
//             </div>
//             <div>
//               <label className="block text-sm mb-1">Vendor Name</label>
//               <CommonSearchableSelect
//                 {...register('vendorId', { required: true })}
//                 value={watch('vendorId')}
//                 onValueChange={(val) => {
//                   setValue('vendorId', val);
//                   setValue('purchaseOrderId', '');
//                   setYarnRows([]);
//                   setFabricRows([]);
//                   setItemRows([]);
//                   setYarnPopupRows([]);
//                   setFabricPopupRows([]);
//                   setItemPopupRows([]);
//                 }}
//               >
//                 <option value="">Select</option>
//                 {(filteredVendors || []).map((v: any) => (
//                   <option key={v.id} value={v.id}>{v.vendorName}</option>
//                 ))}
//               </CommonSearchableSelect>
//             </div>
//             <div>
//               <label className="block text-sm mb-1">Purchase Order No</label>
//               <CommonSearchableSelect
//                 {...register('purchaseOrderId', { required: true })}
//                 value={watch('purchaseOrderId')}
//                 onValueChange={(val) => {
//                   setValue('purchaseOrderId', val, { shouldValidate: true, shouldDirty: true });
//                   setYarnRows([]);
//                   setFabricRows([]);
//                   setItemRows([]);
//                   setYarnPopupRows([]);
//                   setFabricPopupRows([]);
//                   setItemPopupRows([]);
//                   setIsYarnDialogOpen(false);
//                   setIsFabricDialogOpen(false);
//                   setIsItemDialogOpen(false);
//                 }}
//               >
//                 <option value="">Select Purchase Order No</option>
//                 {(poOptions || []).map((po: any) => (
//                   <option key={po.id} value={po.id}>{po.poNo || `PO-${po.id}`}</option>
//                 ))}
//               </CommonSearchableSelect>
//             </div>
//             <div>
//               <label className="block text-sm mb-1">Gross Wt</label>
//               <input
//                 type="number"
//                 step="0.001"
//                 className="w-full border px-3 py-2 rounded"
//                 {...register('grossWt')}
//               />
//             </div>
//             <div>
//               <label className="block text-sm mb-1">Vehicle No</label>
//               <input
//                 type="text"
//                 className="w-full border px-3 py-2 rounded"
//                 {...register('vehicleNo')}
//               />
//             </div>
//             <div>
//               <label className="block text-sm mb-1">Transport Name</label>
//               <CommonSearchableSelect
//                 {...register('transportId')}
//                 value={watch('transportId')}
//                 onValueChange={(val) => setValue('transportId', val)}
//               >
//                 <option value="">Select Transport</option>
//                 {(transportList || []).map((t: any) => (
//                   <option key={t.id} value={t.id}>{t.transportName}</option>
//                 ))}
//               </CommonSearchableSelect>
//             </div>
//             <div>
//               <label className="block text-sm mb-1">Remark</label>
//               <textarea
//                 className="w-full border px-3 py-2 rounded"
//                 rows={1}
//                 {...register('remark')}
//               />
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Conditional tables */}
//       {purchaseType === 'yarn' && (
//         <>
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex justify-between items-center">
//                 <span className="flex items-center gap-2">
//                   <ClipboardList size={20} /> Item Return - Yarn Entry
//                 </span>
//                 <div className="flex gap-2">
//                   <Button
//                     variant="outline"
//                     onClick={refreshQuantities}
//                     className="flex items-center gap-2"
//                   >
//                     <RefreshCw size={16} />
//                     Refresh Quantities
//                   </Button>
//                   <Button onClick={openYarnDialog}>Select Return Yarn Item</Button>
//                 </div>
//               </CardTitle>
//             </CardHeader>

//             <CardContent>
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse border border-gray-300 text-center">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-2">Sl.No</th>
//                       <th className="border p-2">Yarn Name</th>
//                       <th className="border p-2">Mill Name</th>
//                       {/* <th className="border p-2">Purchase Inward No</th> */}
//                       {/* <th className="border p-2">Available Bags</th>
//                       <th className="border p-2">Kgs/Bag</th> */}
//                       <th className="border p-2">Rejected Quantity</th>
//                       <th className="border p-2">Return Quantity</th>
//                       <th className="border p-2">Rate/Unit</th>
//                       <th className="border p-2">GST Amount</th>
//                       <th className="border p-2">Total Amount</th>
//                       <th className="border p-2">Lot No</th>
//                       <th className="border p-2">Warehouse</th>
//                       <th className="border p-2">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {yarnRows.length > 0 ? (
//                       yarnRows.map((row, idx) => (
//                         <tr key={idx} className="border hover:bg-gray-50">
//                           <td className="border p-2">{idx + 1}</td>
//                           <td className="border p-2 text-center">
//                             {row.yarnName || row.yarnId || '-'}
//                           </td>
//                           <td className="border p-2 text-center">
//                             {row.millName || 'N/A'}
//                           </td>
//                           {/* <td className="border p-2 text-center">
//                             {row.purchaseInwardNo || 'N/A'}
//                           </td> */}
//                           {/* <td className="border p-2 text-center">
//                             <input
//                               type="text"
//                               className="border px-2 py-1 rounded w-full text-center bg-gray-50"
//                               value={row.availableBags ?? ""}
//                               readOnly
//                             />
//                           </td>
//                           <td className="border p-2 text-center">
//                             <input
//                               type="text"
//                               className="border px-2 py-1 rounded w-full text-center bg-gray-50"
//                               value={row.kgsPerBag ?? ""}
//                               readOnly
//                             />
//                           </td> */}
//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               className="border px-2 py-1 rounded w-full text-center font-semibold"
//                               value={row.rejectedQty ?? ""}
//                               readOnly
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               className="border px-2 py-1 rounded w-full text-center"
//                               value={row.returnQuantity ?? ""}
//                               onChange={(e) => {
//                                 const val = e.target.value;
//                                 const rejected = Number(row.rejectedQty || 0);
//                                 if (!isNaN(rejected) && rejected > 0 && Number(val) > rejected) {
//                                   toast.error(`Return Qty cannot exceed Rejected Qty (${rejected}).`);
//                                   setYarnRows((prev) =>
//                                     prev.map((r, i) => (i === idx ? recalcYarnEntry({ ...r, returnQuantity: String(rejected) }) : r))
//                                   );
//                                 } else {
//                                   setYarnRows((prev) =>
//                                     prev.map((r, i) => (i === idx ? recalcYarnEntry({ ...r, returnQuantity: val }) : r))
//                                   );
//                                 }
//                               }}
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               className="border px-2 py-1 rounded w-full text-center bg-gray-50"
//                               value={row.ratePerUnit || ""}
//                               readOnly
//                               placeholder="0.00"
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               className="border px-2 py-1 rounded w-full text-center bg-gray-50"
//                               value={row.gstAmount || ""}
//                               readOnly
//                               placeholder="0.00"
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               className="border px-2 py-1 rounded w-full text-center bg-gray-50"
//                               value={row.totalAmount || ""}
//                               readOnly
//                               placeholder="0.00"
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <input
//                               type="text"
//                               className="border px-2 py-1 rounded w-full text-center"
//                               value={row.lotNo || ""}
//                               onChange={(e) =>
//                                 setYarnRows((prev) =>
//                                   prev.map((r, i) => (i === idx ? { ...r, lotNo: e.target.value } : r))
//                                 )
//                               }
//                               readOnly
//                             />
//                           </td>
//                           <td className="border p-2">
//                             {(() => {
//                               const w = Array.isArray(warehouseList)
//                                 ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId))
//                                 : undefined;
//                               const name = w?.warehouseName || row.warehouseId || '';
//                               return (
//                                 <input
//                                   type="text"
//                                   className="border px-2 py-1 rounded w-full text-center"
//                                   value={name}
//                                   readOnly
//                                 />
//                               );
//                             })()}
//                           </td>
//                           <td className="border p-2">
//                             <Button
//                               size="sm"
//                               variant="destructive"
//                               onClick={() => removeYarnRow(idx)}
//                             >
//                               <Trash2 size={14} />
//                             </Button>
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td colSpan={13} className="p-4 text-gray-500 italic">
//                           No items added yet
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="mt-4">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <ClipboardList size={20} /> Summary (Yarn)
//               </CardTitle>
//             </CardHeader>

//             <CardContent>
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse border border-gray-300 text-center">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-2">Sl.No</th>
//                       <th className="border p-2">Yarn Name</th>
//                       <th className="border p-2">Mill Name</th>
//                       <th className="border p-2">Total Quantity </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {yarnRows.map((r, i) => (
//                       <tr key={i} className="border">
//                         <td className="border p-2">{i + 1}</td>
//                         <td className="border p-2">{r.yarnName || '-'}</td>
//                         <td className="border p-2">{r.millName || 'N/A'}</td>
//                         <td className="border p-2">{Number(r.returnQuantity || 0)}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         </>
//       )}

//       {(purchaseType === 'fabric' || purchaseType === 'knitted') && (
//         <>
//           <Card className='bg-white'>
//             <CardHeader>
//               <CardTitle className="flex justify-between items-center">
//                 <span className="flex items-center gap-2">
//                   <ClipboardList size={20} /> Item Return - Fabric Entry
//                 </span>
//                 <Button onClick={openFabricDialog}>Select Return Fabric Item</Button>
//               </CardTitle>
//             </CardHeader>

//             <CardContent>
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse border border-gray-300 text-center">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-2">Sl.No</th>
//                       <th className="border p-2">Fabric Code - Quality</th>
//                       <th className="border p-2">Piece No</th>
//                       <th className="border p-2">Piece Meter</th>
//                       <th className="border p-2">Net Weight</th>
//                       <th className="border p-2">Warehouse</th>
//                       <th className="border p-2">Return Quantity (pcs/meters)</th>
//                       <th className="border p-2">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {fabricRows.map((row, idx) => (
//                       <tr key={idx} className="border">
//                         <td className="border p-2">{idx + 1}</td>
//                         <td className="border p-2">
//                           <select
//                             className="border px-2 py-1 rounded w-full"
//                             value={row.fabricMasterId || ""}
//                             onChange={(e) => {
//                               const id = e.target.value;
//                               const item = (fabricItemsByPO || []).find(
//                                 (i: any) => String(i.fabricMasterId) === String(id)
//                               );
//                               setFabricRows((prev) =>
//                                 prev.map((r, i) =>
//                                   i === idx
//                                     ? {
//                                       ...r,
//                                       fabricMasterId: id,
//                                       fabricCode: item?.fabricCode,
//                                       quality: item?.quality,
//                                     }
//                                     : r
//                                 )
//                               );
//                             }}
//                           >
//                             <option value="">Select</option>
//                             {(fabricItemsByPO || []).map((it: any, i: number) => (
//                               <option key={i} value={it.fabricMasterId}>
//                                 {it.fabricCode && it.quality
//                                   ? `${it.fabricCode} - ${it.quality}`
//                                   : it.fabricMasterId}
//                               </option>
//                             ))}
//                           </select>
//                         </td>

//                         <td className="border p-2">
//                           <input
//                             type="text"
//                             className="border px-2 py-1 rounded w-full"
//                             value={row.pieceNo || ""}
//                             onChange={(e) =>
//                               setFabricRows((prev) =>
//                                 prev.map((r, i) =>
//                                   i === idx ? { ...r, pieceNo: e.target.value } : r
//                                 )
//                               )
//                             }
//                             readOnly
//                           />
//                         </td>

//                         <td className="border p-2">
//                           <input
//                             type="text"
//                             className="border px-2 py-1 rounded w-full"
//                             value={row.pieceMeter || ""}
//                             readOnly
//                             onChange={(e) =>
//                               setFabricRows((prev) =>
//                                 prev.map((r, i) =>
//                                   i === idx ? { ...r, pieceMeter: e.target.value } : r
//                                 )
//                               )
//                             }
//                           />
//                         </td>

//                         <td className="border p-2">
//                           <input
//                             type="text"
//                             className="border px-2 py-1 rounded w-full"
//                             value={row.netWeight || ""}
//                             onChange={(e) =>
//                               setFabricRows((prev) =>
//                                 prev.map((r, i) =>
//                                   i === idx ? { ...r, netWeight: e.target.value } : r
//                                 )
//                               )
//                             }
//                           />
//                         </td>

//                         <td className="border p-2">
//                           {(() => {
//                             const w = Array.isArray(warehouseList)
//                               ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId))
//                               : undefined;
//                             const name = w?.warehouseName || row.warehouseId || '';
//                             return (
//                               <input
//                                 type="text"
//                                 className="border px-2 py-1 rounded w-full"
//                                 value={name}
//                                 readOnly
//                               />
//                             );
//                           })()}
//                         </td>

//                         <td className="border p-2">
//                           <input
//                             type="number"
//                             className="border px-2 py-1 rounded w-full"
//                             value={row.returnQuantity || ""}
//                             onChange={(e) =>
//                               setFabricRows((prev) =>
//                                 prev.map((r, i) =>
//                                   i === idx ? { ...r, returnQuantity: e.target.value } : r
//                                 )
//                               )
//                             }
//                           />
//                         </td>

//                         <td className="border p-2">
//                           <Button
//                             size="sm"
//                             variant="destructive"
//                             onClick={() => removeFabricRow(idx)}
//                           >
//                             <Trash2 size={14} />
//                           </Button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Summary */}
//           <Card className="mt-4 bg-white">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <ClipboardList size={20} /> Summary (Fabric)
//               </CardTitle>
//             </CardHeader>

//             <CardContent>
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse border border-gray-300 text-center">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-2">Sl.No</th>
//                       <th className="border p-2">Fabric Code - Quality</th>
//                       <th className="border p-2">Total Pieces</th>
//                       <th className="border p-2">Total Meters</th>
//                       <th className="border p-2">Total Net Weight</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {fabricSummary.map((s, i) => (
//                       <tr key={`${s.fabricCode}-${s.quality}-${i}`} className="border">
//                         <td className="border p-2">{i + 1}</td>
//                         <td className="border p-2">
//                           {(s.fabricCode || "-")} - {(s.quality || "-")}
//                         </td>
//                         <td className="border p-2">{s.totalPieces}</td>
//                         <td className="border p-2">{s.totalMeters}</td>
//                         <td className="border p-2">{s.totalNetWeight}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>

//         </>
//       )}

//       {purchaseType === 'item' && (
//         <>
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex justify-between items-center">
//                 <span className="flex items-center gap-2">
//                   <ClipboardList size={20} /> Item Return - Item Entry
//                 </span>
//                 <div className="flex gap-2">
//                   <Button
//                     variant="outline"
//                     onClick={refreshQuantities}
//                     className="flex items-center gap-2"
//                   >
//                     <RefreshCw size={16} />
//                     Refresh Quantities
//                   </Button>
//                   <Button onClick={openItemDialog}>Select Return Item</Button>
//                 </div>
//               </CardTitle>
//             </CardHeader>

//             <CardContent>
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse border border-gray-300 text-center">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-2">Sl.No</th>
//                       <th className="border p-2">Item Name</th>
//                       <th className="border p-2">Rejected Quantity</th>
//                       <th className="border p-2">Return Quantity</th>
//                       <th className="border p-2">Warehouse</th>
//                       <th className="border p-2">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {itemRows.length > 0 ? (
//                       itemRows.map((row, idx) => (
//                         <tr key={idx} className="border hover:bg-gray-50">
//                           <td className="border p-2">{idx + 1}</td>
//                           <td className="border p-2">{row.itemName}</td>
//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               className="border px-2 py-1 rounded w-full text-center font-semibold text-green-700 bg-gray-50"
//                               value={row.rejectedQty ?? ""}
//                               readOnly
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <input
//                               type="number"
//                               className="border px-2 py-1 rounded w-full text-center"
//                               value={row.returnQuantity ?? ""}
//                               onChange={(e) => {
//                                 const val = e.target.value;
//                                 const rejected = Number(row.rejectedQty || 0);
//                                 if (!isNaN(rejected) && rejected > 0 && Number(val) > rejected) {
//                                   toast.error(`Return Qty cannot exceed Rejected Qty (${rejected}).`);
//                                   setItemRows((prev) =>
//                                     prev.map((r, i) => (i === idx ? { ...r, returnQuantity: String(rejected) } : r))
//                                   );
//                                 } else {
//                                   setItemRows((prev) =>
//                                     prev.map((r, i) => (i === idx ? { ...r, returnQuantity: val } : r))
//                                   );
//                                 }
//                               }}
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <input
//                               type="text"
//                               className="border px-2 py-1 rounded w-full text-center"
//                               value={row.warehouseName || (Array.isArray(warehouseList) ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId))?.warehouseName : '') || row.warehouseId || ''}
//                               readOnly
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <Button
//                               size="sm"
//                               variant="destructive"
//                               onClick={() => setItemRows(prev => prev.filter((_, i) => i !== idx))}
//                             >
//                               <Trash2 size={14} />
//                             </Button>
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td colSpan={6} className="p-4 text-gray-500 italic">
//                           No items added yet
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="mt-4">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <ClipboardList size={20} /> Summary (Item)
//               </CardTitle>
//             </CardHeader>

//             <CardContent>
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse border border-gray-300 text-center">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-2">Sl.No</th>
//                       <th className="border p-2">Item Name</th>
//                       <th className="border p-2">Total Quantity</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {(() => {
//                       const summaryMap = new Map();
//                       itemRows.forEach(row => {
//                         const key = row.itemId;
//                         const current = summaryMap.get(key) || { itemName: row.itemName, totalQuantity: 0 };
//                         current.totalQuantity += Number(row.returnQuantity || 0);
//                         summaryMap.set(key, current);
//                       });
//                       return Array.from(summaryMap.values()).map((s, i) => (
//                         <tr key={i} className="border">
//                           <td className="border p-2">{i + 1}</td>
//                           <td className="border p-2">{s.itemName || '-'}</td>
//                           <td className="border p-2">{s.totalQuantity}</td>
//                         </tr>
//                       ));
//                     })()}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>

          
//         </>
//       )}

//  <div className="flex justify-end mt-4">

//           <Button onClick={handleSubmit(onSubmit)}>{watch('id') ? 'Update' : 'Save'}</Button>
//         </div>
//       {/* Yarn Selection Dialog with Real-time Quantities */}
//       <Dialog open={isYarnDialogOpen} onOpenChange={setIsYarnDialogOpen}>
//         <DialogContent className="max-w-[95vw] w-fit">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               Select Return Yarn Item - PO: {selectedPONumber || 'N/A'} (Real-time Quantities)
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={refreshQuantities}
//                 className="flex items-center gap-1"
//               >
//                 <RefreshCw size={14} />
//                 Refresh
//               </Button>
//             </DialogTitle>
//           </DialogHeader>
//           <div className="max-h-[60vh] overflow-y-auto">
//             <PopupDataTable
//               columns={yarnColumns}
//               data={yarnPopupRows}
//               emptyMessage={
//                 yarnPopupRows.length === 0
//                   ? 'No yarn lots available. Select Purchase Order.'
//                   : 'No yarn lots match your search.'
//               }
//             />
//           </div>
//           <DialogFooter>
//             <Button variant="secondary" onClick={() => setIsYarnDialogOpen(false)}>Cancel</Button>
//             <Button onClick={confirmYarnDialog}>Add Selected</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Fabric Selection Dialog */}
//       <Dialog open={isFabricDialogOpen} onOpenChange={setIsFabricDialogOpen}>
//         <DialogContent className="max-w-[95vw] w-fit">
//           <DialogHeader>
//             <DialogTitle>Select Return Fabric Item</DialogTitle>
//           </DialogHeader>
//           <div className="max-h-[60vh] overflow-y-auto">
//             <PopupDataTable
//               columns={fabricColumns}
//               data={fabricPopupRows}
//               emptyMessage={
//                 fabricPopupRows.length === 0
//                   ? 'No fabric pieces available. Select Purchase Order and Item; only un-packed pieces are shown.'
//                   : 'No fabric rows match your search.'
//               }
//             />
//           </div>
//           <DialogFooter>
//             <Button variant="secondary" onClick={() => setIsFabricDialogOpen(false)}>Cancel</Button>
//             <Button onClick={confirmFabricDialog}>Add Selected</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Item Selection Dialog */}
//       <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
//         <DialogContent className="max-w-[95vw] w-fit">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               Select Return Item - PO: {selectedPONumber || 'N/A'}
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={refreshQuantities}
//                 className="flex items-center gap-1"
//               >
//                 <RefreshCw size={14} />
//                 Refresh
//               </Button>
//             </DialogTitle>
//           </DialogHeader>
//           <div className="max-h-[60vh] overflow-y-auto">
//             <PopupDataTable
//               columns={itemColumns}
//               data={itemPopupRows}
//               emptyMessage={
//                 itemPopupRows.length === 0
//                   ? 'No items available. Ensure Vendor and Purchase Order are selected.'
//                   : 'No item rows match your search.'
//               }
//             />
//           </div>
//           <DialogFooter>
//             <Button variant="secondary" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
//             <Button onClick={confirmItemDialog}>Add Selected</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '@/state/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { getAllPoTypes, getAllPurchaseOrders, getPurchaseOrderById } from '@/state/purchaseOrderSlice';
import { getAllVendors } from '@/state/vendorSlice';
import { createPurchaseReturn, updatePurchaseReturn, getAllPurchaseReturns } from '@/state/purchaseReturnSlice';
import { getAllYarnMasters } from '@/state/yarnSlice';
import { getAllPurchaseInwards } from '@/state/purchaseInwardSlice';
import { getAllFabricMasters, getAllFabricMastersForDropdown } from '@/state/fabricMasterSlice';
import { getAllSubCategories } from '@/state/subCategorySlice';
import { getAllItemMasters } from '@/state/itemSlice';
import { getAllSizingYarnIssue } from '@/state/sizingYarnIssueSlice';
import { getAllWeavingYarnIssue } from '@/state/weavingYarnIssueSlice';
import { VENDOR_TYPE_ALL, filterVendorsByPoType } from '@/utils/vendorFilters';
import { PopupDataTable, PopupColumn } from '@/components/data/PopupDataTable';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { ArrowLeft, ClipboardList, Trash2, RefreshCw } from 'lucide-react';
import { getAllWarehouse } from '@/state/warehouseSlice';
import { getAllTransports } from '@/state/transportSlice';
import apiService from '@/services/ApiService';
import documentNumberService from '@/services/DocumentNumberService';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';

// PO TYPE CONSTANTS
const PO_TYPE_YARN = 1;
const PO_TYPE_WOVEN_FABRIC = 2;
const PO_TYPE_KNITTED_FABRIC = 11;
const PO_TYPE_ITEM = 3;

// VENDOR TYPE CONSTANTS
const VENDOR_TYPE_YARN = 301;
const VENDOR_TYPE_ITEM = 305;
const PURCHASE_TYPE_TO_PO_ID: Record<string, number> = {
  yarn: PO_TYPE_YARN,
  woven: PO_TYPE_WOVEN_FABRIC,
  knitted: PO_TYPE_KNITTED_FABRIC,
  item: PO_TYPE_ITEM,
};

// Form types
interface PurchaseReturnForm {
  id?: number | null;
  returnNo: string;
  returnDate: string;
  purchaseType: 'yarn' | 'fabric' | 'knitted' | 'item' | '';
  vendorId: string;
  purchaseOrderId: string;
  grossWt?: string;
  remark?: string;
  vehicleNo?: string;
  transportId?: string;

}

interface ItemEntryRow {
  id?: number;
  itemId?: string;
  itemName?: string;
  itemCode?: string;
  inwardNo?: string;
  returnQuantity?: string;
  availableQty?: string;
  availableBags?: string;
  kgsPerBag?: string;
  warehouseId?: string;
  warehouseName?: string;
  uomId?: string | number | null;
  inwardId?: number | null;
  orderItemId?: number | null;
  rejectedQty?: string;
}

interface YarnEntryRow {
  id?: number;
  yarnId?: string;
  yarnName?: string;
  returnQuantity?: string;
  lotNo?: string;
  warehouseId?: string;
  millName?: string;
  millNameId?: string | null;
  inwardId?: number | null;
  orderItemId?: number | null;
  yarnInwardStockDetailsId?: number | null;
  inwardNo?: string;
  purchaseInwardId?: number | null;
  purchaseInwardNo?: string;
  availableBags?: string;
  kgsPerBag?: string;
  conesPerBag?: string;
  conesWeight?: string;
  rejectedQty?: string;
  ratePerUnit?: string;
  gstPercent?: string;
  gstAmount?: string;
  totalAmount?: string;
}

interface FabricEntryRow {
  id?: number;
  fabricMasterId?: string;
  fabricCode?: string;
  quality?: string; // normalized quality field
  fabricQuality?: string; // legacy alias
  returnQuantity?: string; // pieces/meters
  pieceNo?: string;
  pieceMeter?: string;
  netWeight?: string;
  warehouseId?: string;
  isPacked?: any;
  inwardId?: number | null;
  orderItemId?: number | null;
}

const buildYarnStockDetailsParams = (purchaseOrderId?: string, poTypeId?: number, companyId?: number | null) => {
  const params: Record<string, string> = {} as Record<string, string>;
  if (purchaseOrderId) {
    params.purchaseOrderId = purchaseOrderId;
  }
  if (poTypeId !== undefined && poTypeId !== null) {
    params.poTypeId = String(poTypeId);
  }
  if (companyId !== null && companyId !== undefined) {
    params.companyId = String(companyId);
  }
  return params;
};

// Helper function to convert string to number
const toNumber = (v: string | number | null | undefined): number => {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
};

// Calculation function for yarn entries
const recalcYarnEntry = (item: any) => {
  const qty = toNumber(item.returnQuantity);
  const rate = toNumber(item.ratePerUnit);
  const gstP = toNumber(item.gstPercent);
  
  const total = qty * rate;
  const gstAmt = total * (gstP / 100);
  const final = total + gstAmt;
  
  return {
    ...item,
    totalAmount: final ? final.toFixed(2) : "",
    gstAmount: gstAmt ? gstAmt.toFixed(2) : "",
  };
};

export default function PurchaseReturnEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedCompanyId = useResolvedCompanyId();

  const { purchaseOrderList, purchaseOrderTypeList } = useSelector((s: RootState) => s.purchaseOrder);
  const { vendorList } = useSelector((s: RootState) => s.vendor);
  const { yarnList } = useSelector((s: RootState) => s.yarn);
  const { purchaseInwardList } = useSelector((s: RootState) => s.purchaseInward);

  // Function to get rate/unit from purchase order
  const getRateFromPurchaseOrder = (purchaseOrderId: string, orderItemId: string | number): { rate: string; gstPercent: string } => {
    const purchaseOrder = Array.isArray(purchaseOrderList) 
      ? purchaseOrderList.find((po: any) => String(po.id) === String(purchaseOrderId))
      : null;
      
    if (!purchaseOrder?.purchaseOrderItemsDtl) {
      return { rate: '', gstPercent: '' };
    }
    
    const orderItem = purchaseOrder.purchaseOrderItemsDtl.find((item: any) => 
      String(item.id) === String(orderItemId) || String(item.orderItemId) === String(orderItemId)
    );
    
    if (!orderItem) {
      return { rate: '', gstPercent: '' };
    }
    
    // Get GST percentage from Purchase Order item first, fallback to yarn master if not available
    let gstPercent = '';
    
    // Try to get GST from Purchase Order item
    if (orderItem.gstPercent) {
      gstPercent = String(orderItem.gstPercent);
    } else if (orderItem.igst && Number(orderItem.igst) > 0) {
      gstPercent = String(orderItem.igst);
    } else if (orderItem.cgst && orderItem.sgst) {
      const cgst = Number(orderItem.cgst || 0);
      const sgst = Number(orderItem.sgst || 0);
      gstPercent = String(cgst + sgst);
    } else {
      // Fallback to yarn master if Purchase Order doesn't have GST info
      const yarn = yarnList?.find((y: any) => String(y.id) === String(orderItem.yarnId));
      if (yarn) {
        const cgst = Number(yarn.cgst || 0);
        const sgst = Number(yarn.sgst || 0);
        const igst = Number(yarn.igst || 0);
        
        if (igst > 0) {
          gstPercent = String(igst);
        } else {
          gstPercent = String(cgst + sgst);
        }
      }
    }
    
    return {
      rate: orderItem.price ? String(orderItem.price) : '',
      gstPercent: gstPercent
    };
  };
  const { warehouseList } = useSelector((s: RootState) => s.warehouse);
  const { fabricMasterList, fabricMasterFullList } = useSelector((s: RootState) => s.fabricMaster);
  const { purchaseReturnList } = useSelector((s: RootState) => s.purchaseReturn);

  const normalizeListData = useCallback((value: any) => {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.data?.data)) return value.data.data;
    return [];
  }, []);

  const normalizedFabricMasterList = useMemo(() => {
    const list = normalizeListData(fabricMasterList);
    const fullList = normalizeListData(fabricMasterFullList);
    const combined = [...list, ...fullList];
    const seen = new Set();
    return combined.filter((item: any) => {
      const id = item?.id ?? item?.fabricMasterId ?? item?.fabric_master_id ?? item?.fabricId ?? item?.fabric_id;
      if (id == null || seen.has(String(id))) return false;
      seen.add(String(id));
      return true;
    });
  }, [fabricMasterList, fabricMasterFullList, normalizeListData]);

  const getQualityByFabricCode = useCallback((fabricCodeStr: string, fabricMasterId?: string | number): string => {
    if (!fabricCodeStr && !fabricMasterId) return '';

    // First try lookup by fabricMasterId
    if (fabricMasterId) {
      const matchById = normalizedFabricMasterList.find((fm: any) => {
        const id = fm?.id ?? fm?.fabricMasterId ?? fm?.fabric_master_id ?? fm?.fabricId ?? fm?.fabric_id;
        return id != null && String(id) === String(fabricMasterId);
      });
      if (matchById) {
        const quality = matchById?.fabricQuality ?? matchById?.fabric_quality ?? matchById?.quality ?? matchById?.fabricQualityName ?? matchById?.grade;
        if (quality) return String(quality).trim();
      }
    }

    // Fallback: match by fabricCode string
    if (fabricCodeStr) {
      const matchByCode = normalizedFabricMasterList.find((fm: any) => {
        const code = fm?.fabricCode ?? fm?.fabric_code ?? fm?.code ?? fm?.fabricCodeName ?? fm?.name;
        return code != null && String(code).trim() === String(fabricCodeStr).trim();
      });
      if (matchByCode) {
        const quality = matchByCode?.fabricQuality ?? matchByCode?.fabric_quality ?? matchByCode?.quality ?? matchByCode?.fabricQualityName ?? matchByCode?.grade;
        if (quality) return String(quality).trim();
      }
    }

    return '';
  }, [normalizedFabricMasterList]);
  const { subCategoryList } = useSelector((s: RootState) => s.subCategory);
  const { sizingYarnIssuetList } = useSelector((s: RootState) => s.sizingYarnIssue as any);
  const { weavingYarnIssuetList } = useSelector((s: RootState) => s.weavingYarnIssue as any);
  const { itemList } = useSelector((s: RootState) => s.itemMaster as any);
  const itemMasterList = itemList;

  const returnedYarnItems = useMemo(() => {
    const rec: any = (location as any)?.state?.record;
    const currentReturnId = rec?.id ? Number(rec.id) : null;
    const returned = new Set<string>();
    (purchaseReturnList || []).forEach((pr: any) => {
      if (currentReturnId && Number(pr.id) === currentReturnId) return;
      (pr.yarnItems || []).forEach((yi: any) => {
        if (yi.isReturn === 1) {
          returned.add(`${String(yi.yarnId || '')}|${String(yi.lotNo || '')}|${String(yi.warehouseId || '')}`);
        }
      });
    });
    return returned;
  }, [purchaseReturnList, location]);

  const returnedFabricPieces = useMemo(() => {
    const rec: any = (location as any)?.state?.record;
    const currentReturnId = rec?.id ? Number(rec.id) : null;
    const returned = new Set<string>();
    (purchaseReturnList || []).forEach((pr: any) => {
      if (currentReturnId && Number(pr.id) === currentReturnId) return;
      (pr.fabricItems || []).forEach((fi: any) => {
        if (fi.isReturn === 1) {
          returned.add(`${String(fi.fabricMasterId || '')}|${String(fi.pieceNo || '')}`);
        }
      });
    });
    return returned;
  }, [purchaseReturnList, location]);

  const returnedGeneralItems = useMemo(() => {
    const rec: any = (location as any)?.state?.record;
    const currentReturnId = rec?.id ? Number(rec.id) : null;
    const returned = new Set<string>();
    (purchaseReturnList || []).forEach((pr: any) => {
      if (currentReturnId && Number(pr.id) === currentReturnId) return;
      (pr.items || []).forEach((i: any) => {
        if (i.isReturn === 1) {
          returned.add(`${String(i.itemId || '')}|${String(i.inwardNo || '')}|${String(i.warehouseId || '')}`);
        }
      });
    });
    return returned;
  }, [purchaseReturnList, location]);

  const { transportList } = useSelector((s: RootState) => s.transport as any);
  const hasGeneratedNumberRef = useRef(false);
  const isSavingRef = useRef(false);
  const hasSetPurchaseOrderId = useRef(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PurchaseReturnForm>({
    defaultValues: {
      returnNo: ((location as any)?.state?.record?.returnNo || (location as any)?.state?.record?.purchaseReturnNo) || 'Loading sequence...',
      returnDate: new Date().toISOString().slice(0, 10),
      purchaseType: '',
      vendorId: '',
      purchaseOrderId: ''
    }
  });

  const purchaseType = watch('purchaseType');
  const vendorId = watch('vendorId');
  const purchaseOrderId = watch('purchaseOrderId');

  const selectedPONumber = useMemo(() => {
    const rec: any = (location as any)?.state?.record;
    const currentId = String(purchaseOrderId || rec?.purchaseOrderId || '');
    if (!currentId || currentId === 'null' || currentId === 'undefined') return '';
    
    const list = Array.isArray(purchaseOrderList) ? purchaseOrderList : (purchaseOrderList as any)?.data || [];
    const matched = list.find((po: any) => String(po.id) === currentId);
    
    if (matched) {
      return matched.purchaseOrderNo || matched.orderNo || matched.poNo || '';
    }
    
    // Fallback to record poNo if available
    if (rec?.id && String(rec.purchaseOrderId) === currentId) {
      return rec.purchaseOrderNo || rec.orderNo || rec.poNo || '';
    }
    
    return '';
  }, [purchaseOrderId, purchaseOrderList, location]);

  useEffect(() => {
    const generateDocNo = async () => {
      const rec: any = (location as any)?.state?.record;
      if (rec?.id || hasGeneratedNumberRef.current) {
        if (rec?.returnNo || rec?.purchaseReturnNo) {
          setValue('returnNo', rec.returnNo || rec.purchaseReturnNo);
        }
        return;
      }

      setValue('returnNo', 'Loading sequence...');

      try {
        const res = await documentNumberService.generateDocumentNumber({
          screenName: "Purchase Return / GRN Return"
        });
        setValue('returnNo', res.documentNumber);
        hasGeneratedNumberRef.current = true;
      } catch (err) {
        console.error("Failed to generate return number:", err);
      }
    };
    generateDocNo();
  }, [location, setValue]);

  // Cleanup on unmount or beforeunload
  useEffect(() => {
    //  alert('Clearing cached document number for Purchase Return');
    const handleBeforeUnload = () => {
      const rec: any = (location as any)?.state?.record;
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !rec?.id) {
        documentNumberService.clearMemoryCache("Purchase Return / GRN Return");
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {

      window.removeEventListener('beforeunload', handleBeforeUnload);
      const rec: any = (location as any)?.state?.record;
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !rec?.id) {
        documentNumberService.clearMemoryCache("Purchase Return / GRN Return");
      }
    };
  }, [location]);


  useEffect(() => {
    const poParams: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
    if (selectedCompanyId) {
      poParams.companyId = selectedCompanyId;
    }
    dispatch(getAllPurchaseOrders(poParams));
  }, [dispatch, selectedCompanyId]);

  useEffect(() => {
    if (purchaseType === 'item') {
      dispatch(getAllItemMasters({ fetchAll: true }));
    }
  }, [dispatch, purchaseType]);

  const [yarnRows, setYarnRows] = useState<YarnEntryRow[]>([]);
  const [fabricRows, setFabricRows] = useState<FabricEntryRow[]>([]);
  const [itemRows, setItemRows] = useState<ItemEntryRow[]>([]);

  // Popups
  const [isYarnDialogOpen, setIsYarnDialogOpen] = useState(false);
  const [isFabricDialogOpen, setIsFabricDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  // Popup working lists
  const [yarnPopupRows, setYarnPopupRows] = useState<any[]>([]);
  const [fabricPopupRows, setFabricPopupRows] = useState<any[]>([]);
  const [itemPopupRows, setItemPopupRows] = useState<any[]>([]);
  const [yarnPopupSearch, setYarnPopupSearch] = useState('');
  const [fabricPopupSearch, setFabricPopupSearch] = useState('');
  const [itemPopupSearch, setItemPopupSearch] = useState('');

  // Yarn stock details from API
  const [yarnStockDetails, setYarnStockDetails] = useState<any[]>([]);
  const [itemStockDetails, setItemStockDetails] = useState<any[]>([]);

  // Enhanced helper function to get mill name from millNameId
  const getMillNameFromId = useCallback((millNameId: number | string | null | undefined): string => {
    if (!millNameId || !subCategoryList) {
      // console.log(`No millNameId (${millNameId}) or subCategoryList available`);
      return '';
    }

    // Handle both array and object formats for subCategoryList
    const list = Array.isArray(subCategoryList)
      ? subCategoryList
      : (subCategoryList?.data || []);

    // console.log(`Looking for millNameId: ${millNameId} in list of ${list.length} items`);

    const millSubCategory = list.find((sc: any) => {
      const matchesId = String(sc.id) === String(millNameId);
      const matchesSubCategoryId = String(sc.subCategoryId) === String(millNameId);
      return matchesId || matchesSubCategoryId;
    });

    const result = millSubCategory?.subCategoryName || millSubCategory?.name || '';
    // console.log(`Found mill name for ID ${millNameId}:`, result);

    return result;
  }, [subCategoryList]);

  // Map purchaseInward data (auto-fetch rows for dialogs by PO and type)
  const poTypeIdForType = useMemo(() => {
    if (!purchaseType) return undefined as number | undefined;
    const normalized = purchaseType.toLowerCase();
    if (PURCHASE_TYPE_TO_PO_ID[normalized]) {
      return PURCHASE_TYPE_TO_PO_ID[normalized];
    }
    const list = Array.isArray((purchaseOrderTypeList as any)?.data)
      ? (purchaseOrderTypeList as any).data
      : (purchaseOrderTypeList as any) || [];
    const key = purchaseType === 'yarn' ? 'yarn' : (purchaseType === 'fabric' ? 'fabric' : (purchaseType === 'knitted' ? 'knit' : 'item'));
    const entry = (list || []).find((t: any) => {
      const name = (t?.name || t?.poType || t?.typeName || t?.poTypeName || '').toLowerCase();
      if (!name) return false;
      if (normalized === 'item') return name.includes('item');
      return name.includes(normalized);
    });
    return entry?.id != null ? Number(entry.id) : undefined;
  }, [purchaseType, purchaseOrderTypeList]);

  const inwardByPOAndType = useMemo(() => {
    const raw = Array.isArray((purchaseInwardList as any)?.data)
      ? (purchaseInwardList as any).data
      : (purchaseInwardList as any) || [];
    if (!purchaseOrderId || !poTypeIdForType) return [] as any[];
    return (raw || []).filter((pi: any) =>
      String(pi?.purchaseOrderId) === String(purchaseOrderId) &&
      Number(pi?.poTypeId) === Number(poTypeIdForType)
    );
  }, [purchaseInwardList, purchaseOrderId, poTypeIdForType]);


  // Fetch yarn stock details from API
  const fetchYarnStockDetails = useCallback(async () => {
    if (!purchaseOrderId || !poTypeIdForType) {
      setYarnStockDetails([]);
      return [];
    }

    try {
      const params = buildYarnStockDetailsParams(purchaseOrderId, poTypeIdForType, selectedCompanyId);
      const query = new URLSearchParams(params).toString();
      const endpoint = query
        ? `/yarn-stock-details/filter?${query}`
        : `/yarn-stock-details/filter`;
      const response = await apiService.get(endpoint);
      const normalizedData = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];
      setYarnStockDetails(normalizedData);
      console.log('Fetched yarn inward stock details:', normalizedData);

      return normalizedData;
    } catch (error) {
      console.error('Failed to fetch yarn stock details:', error);
      setYarnStockDetails([]);
      return [];
    }
  }, [purchaseOrderId, poTypeIdForType]);

  // Create PurchaseInward mapping from existing purchaseInward list based on purchaseOrderId
  const createPurchaseInwardMapping = useCallback((purchaseOrderId: string) => {
    const raw = Array.isArray((purchaseInwardList as any)?.data)
      ? (purchaseInwardList as any).data
      : (purchaseInwardList as any) || [];
    
    // Find purchase inwards for the current purchase order
    const purchaseInwards = raw.filter((pi: any) =>
      String(pi.purchaseOrderId) === String(purchaseOrderId) && pi.activeFlag === true
    );

    // Create mapping from orderItemId to array of purchase inward mappings
    const mappings: Record<string, Array<{purchaseInwardId: number, purchaseInwardNo: string}>> = {};
    
    purchaseInwards.forEach((pi: any) => {
      if (pi.purchaseInwardItemsDtl) {
        pi.purchaseInwardItemsDtl.forEach((item: any) => {
          if (item.poItemId && pi.id && pi.purchaseInwardNo) {
            const key = String(item.poItemId);
            if (!mappings[key]) {
              mappings[key] = [];
            }
            mappings[key].push({
              purchaseInwardId: pi.id,
              purchaseInwardNo: pi.purchaseInwardNo
            });
          }
        });
      }
    });

    console.log('PurchaseInward mappings for PO', purchaseOrderId, ':', mappings);
    return mappings;
  }, [purchaseInwardList]);

  // Fetch item stock details from API
  const fetchItemStockDetails = useCallback(async () => {
    if (!vendorId) return [];

    try {
      const params: any = {
        vendorId: Number(vendorId),
        companyId: selectedCompanyId || localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany')
      };
      if (purchaseOrderId) params.purchaseOrderId = Number(purchaseOrderId);

      const response = await apiService.get('/item-stock-details/filter', params);
      const data = response?.data || response || [];
      setItemStockDetails(data);
      console.log('Fetched item stock details:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch item stock details:', error);
      setItemStockDetails([]);
      return [];
    }
  }, [vendorId, purchaseOrderId]);

  // Refresh quantities function
  const refreshQuantities = async () => {
    try {
      await dispatch(getAllPurchaseInwards({} as any)).unwrap();
      await dispatch(getAllPurchaseReturns({} as any)).unwrap();

      // const refreshReturnsParams: { companyId?: number } = {};
      // if (selectedCompanyId) {
      //   refreshReturnsParams.companyId = selectedCompanyId;
      // }
      // await dispatch(getAllPurchaseReturns(refreshReturnsParams)).unwrap();
      await fetchYarnStockDetails(); // Also refresh yarn stock details
      await fetchItemStockDetails(); // Also refresh item stock details
      toast.success('Quantities refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh quantities');
    }
  };

  // Auto-refresh purchase inward data when dependencies change
  useEffect(() => {
    const refetchInwardData = async () => {
      if (purchaseOrderId && poTypeIdForType) {
        try {
          await dispatch(getAllPurchaseInwards({} as any)).unwrap();
          console.log('Refetched purchase inward data for updated quantities');
        } catch (error) {
          console.error('Failed to refetch purchase inward data:', error);
        }
      }
    };

    refetchInwardData();
  }, [purchaseOrderId, poTypeIdForType, dispatch, purchaseReturnList]);

  // Fetch yarn stock details when PO and type change
  useEffect(() => {
    if (purchaseOrderId && poTypeIdForType && purchaseType === 'yarn') {
      fetchYarnStockDetails();
    } else if (purchaseOrderId && purchaseType === 'item') {
      fetchItemStockDetails();
    } else {
      setYarnStockDetails([]);
      setItemStockDetails([]);
    }
  }, [purchaseOrderId, poTypeIdForType, purchaseType, fetchYarnStockDetails, fetchItemStockDetails]);

  const openYarnDialog = async () => {
    if (!purchaseOrderId) { toast.error('Select PO first'); return; }

    console.log('Opening yarn dialog with purchaseOrderId:', purchaseOrderId);
    const fetchedYarnStockDetails = await fetchYarnStockDetails();
    const yarnDataSource = (fetchedYarnStockDetails && fetchedYarnStockDetails.length > 0)
      ? fetchedYarnStockDetails
      : (yarnStockDetails || []);
    console.log('Using yarn stock details source count:', yarnDataSource.length);

    // Create PurchaseInward mapping from existing purchaseInward list
    const purchaseInwardMapping = createPurchaseInwardMapping(String(purchaseOrderId));

    let source = [];
    let filteredSource = [];

    // Primary source: yarn stock details (API preferred)
    if (yarnDataSource && yarnDataSource.length > 0) {

      // Use yarn stock details directly from API response without creating duplicates
      source = [];
      yarnDataSource.forEach((item: any) => {
        const resolvedYarnId = item.yarnId ?? item.itemId ?? null;
        const yarnIdStr = resolvedYarnId != null ? String(resolvedYarnId) : '';
        let yarnName = item.yarnName || '';
        if (!yarnName && yarnIdStr && Array.isArray(yarnList)) {
          const ym = (yarnList as any[]).find((y: any) => String(y.id) === yarnIdStr);
          yarnName = ym?.yarnName || yarnName;
        }
        if (!yarnName) {
          yarnName = yarnIdStr;
        }

        const millName = item.millId ? getMillNameFromId(item.millId) : '';
        const warehouseId = item.warehouseId != null ? String(item.warehouseId) : '';
        const warehouseName = warehouseId
          ? (Array.isArray(warehouseList)
            ? warehouseList.find((wh: any) => String(wh.id) === warehouseId)?.warehouseName || ''
            : (item.warehouseName || ''))
          : (item.warehouseName || '');

        const rejectedQty = item.rejectedQty != null ? Number(item.rejectedQty) : 0;
        
        // Get purchase inward mapping for this orderItemId
        const orderItemKey = String(item.orderItemId || '');
        const purchaseInwardInfo = purchaseInwardMapping[orderItemKey]?.[0]; // Get first purchase inward for this order item
        
        // Create single entry for each yarn stock detail record
        source.push({
          selected: false,
          yarnId: yarnIdStr,
          yarnName,
          availableBags: item.availableBags != null ? Number(item.availableBags) : 0,
          kgsPerBag: item.kgsPerBag != null ? Number(item.kgsPerBag) : 0,
          conesPerBag: item.conesPerBag != null ? Number(item.conesPerBag) : 0,
          conesWeight: item.conesWeight != null ? Number(item.conesWeight) : 0,
          rejectedQty: String(rejectedQty),
          lotNo: item.lotNo || '',
          warehouseId,
          warehouseName,
          millName: millName,
          millNameId: item.millId ?? null,
          inwardId: item.inwardId ?? null,
          orderItemId: item.orderItemId ?? null,
          yarnInwardStockDetailsId: item.yarnInwardStockDetailsId ?? null,
          inwardQty: item.inwardQty,
          inwardBags: item.inwardBags,
          acceptedQty: item.acceptedQty,
          issuedQty: item.issuedQty,
          uomId: item.uomId,
          inwardTypeId: item.inwardTypeId,
          orderNo: item.orderNo || '',
          inwardNo: item.inwardNo || '',
          purchaseInwardId: purchaseInwardInfo?.purchaseInwardId || null,
          purchaseInwardNo: purchaseInwardInfo?.purchaseInwardNo || '',
        });
      });
      console.log('Using yarnStockDetails as source from API');
    } else if (yarnLotsByPO && yarnLotsByPO.length > 0) {
      const seenKeys = new Set<string>();
      source = (yarnLotsByPO || [])
        .filter((item: any) => {
          const key = `${String(item.yarnId || '')}|${String(item.lotNo || '')}|${String(item.warehouseId || '')}`;
          if (seenKeys.has(key)) {
            return false;
          }
          seenKeys.add(key);
          return true;
        })
        .map((item: any) => ({
          ...item,
          inwardNo: item.inwardNo || '',
          orderNo: item.orderNo || ''
        }));
      console.log('Fallback: Using yarnLotsByPO as source');
    } else {
      const seenKeys = new Set<string>();
      source = (yarnItemsByPO || [])
        .filter((item: any) => {
          const key = `${String(item.yarnId || '')}|${String(item.lotNo || '')}|${String(item.warehouseId || '')}`;
          if (seenKeys.has(key)) {
            return false;
          }
          seenKeys.add(key);
          return true;
        })
        .map((it: any) => {
          const millName = it.millNameId
            ? getMillNameFromId(it.millNameId)
            : (it.millName || 'N/A');

          const rejectedQty = it.rejectedQty != null ? String(it.rejectedQty) : (it.quantity != null ? String(it.quantity) : '');
          const warehouseId = it.warehouseId != null ? String(it.warehouseId) : '';

          return {
            selected: false,
            yarnId: it.yarnId,
            yarnName: it.yarnName || it.yarnId,
            availableBags: it.availableBags,
            kgsPerBag: it.kgsPerBag,
            conesPerBag: it.conesPerBag,
            conesWeight: it.conesWeight,
            rejectedQty: rejectedQty,
            lotNo: it.lotNo || '',
            warehouseId: warehouseId,
            millName: millName,
            millNameId: it.millNameId ?? null,
            orderNo: it.orderNo || '',
            inwardNo: it.inwardNo || ''
          };
        });
      console.log('Fallback: Using yarnItemsByPO as source');
    }

    filteredSource = source;

    // Filter out items with 0 available bags or 0 rejected quantity
    filteredSource = filteredSource.filter((item: any) => {
      const availableBags = item.availableBags != null ? Number(item.availableBags) : 0;
      const rejectedQty = item.rejectedQty != null ? Number(item.rejectedQty) : 0;
      
      const isAlreadyReturned = returnedYarnItems.has(`${String(item.yarnId || '')}|${String(item.lotNo || '')}|${String(item.warehouseId || '')}`);
      if (isAlreadyReturned) return false;

      // Only show items that have both available bags > 0 AND rejected quantity > 0
      return availableBags > 0 && rejectedQty > 0;
    });
    
    console.log(`Filtered out items with 0 stock:`, filteredSource.length, 'items remaining');

    const ro = (filteredSource || []).map((r: any) => {
      // Check if this specific combination (yarnId + lotNo + warehouseId + yarnInwardStockDetailsId) is already selected
      const isSelected = (yarnRows || []).some((y: any) =>
        String(y.yarnId || '') === String(r.yarnId || '') &&
        String(y.lotNo || '') === String(r.lotNo || '') &&
        String(y.warehouseId || '') === String(r.warehouseId || '') &&
        String(y.yarnInwardStockDetailsId || '') === String(r.yarnInwardStockDetailsId || '')
      );

      const resolvedMillName = r.millNameId
        ? getMillNameFromId(r.millNameId)
        : (r.millName || 'N/A');

      return {
        ...r,
        selected: r.selected || isSelected,
        _readonlyAvail: true,
        millName: resolvedMillName,
        rejectedQty: r.rejectedQty || '',
        warehouseId: r.warehouseId || '',
        millNameId: r.millNameId ?? null,
        // Add debug info for real-time quantities
        _debug: {
          inwardQty: r.originalQty,
          issuedQty: r.issuedQty,
          returnedQty: r.returnedQty,
          rejectedQty: r.rejectedQty
        }
      };
    });

    console.log('Final popup rows with updated quantities:', ro);
    setYarnPopupRows(ro);
    setIsYarnDialogOpen(true);
  };

  const confirmYarnDialog = () => {
    const picks = (yarnPopupRows || []).filter((r: any) => r.selected && r.rejectedQty !== '' && r.rejectedQty !== null);
    if (picks.length === 0) { toast.error('Select at least one yarn with Rejected Quantity'); return; }

    console.log('Selected picks with millNameId:', picks.map(p => ({
      yarnId: p.yarnId,
      millNameId: p.millNameId,
      millName: p.millName,

      rejectedQty: p.rejectedQty
    })));

    picks.forEach((p: any) => {
      const resolvedWarehouseName = p.warehouseId
        ? (Array.isArray(warehouseList)
          ? warehouseList.find((wh: any) => String(wh.id) === String(p.warehouseId))?.warehouseName
          : '')
        : '';
      // alert(`Warehouse Info\nID: ${p.warehouseId ?? ''}\nName: ${resolvedWarehouseName || ''}`);
    });

    setYarnRows(prev => {
      const existingKeys = new Set(
        (prev || []).map(y => `${String(y.yarnId || '')}|${String(y.lotNo || '')}|${String(y.warehouseId || '')}|${String(y.yarnInwardStockDetailsId || '')}`)
      );
      const toAdd: YarnEntryRow[] = picks
        .filter((p: any) => !existingKeys.has(`${String(p.yarnId || '')}|${String(p.lotNo || '')}|${String(p.warehouseId || '')}|${String(p.yarnInwardStockDetailsId || '')}`))
        .map((p: any) => {
          const millName = p.millNameId
            ? getMillNameFromId(p.millNameId)
            : (p.millName || '');

          // Fetch rate/unit and GST from purchase order
          const rateInfo = getRateFromPurchaseOrder(String(purchaseOrderId), p.orderItemId || '');

          const newRow: YarnEntryRow = {
            yarnId: String(p.yarnId),
            yarnName: p.yarnName,
            availableBags: p.availableBags != null ? String(p.availableBags) : '',
            kgsPerBag: p.kgsPerBag != null ? String(p.kgsPerBag) : '',
            conesPerBag: p.conesPerBag != null ? String(p.conesPerBag) : '',
            conesWeight: p.conesWeight != null ? String(p.conesWeight) : '',
            rejectedQty: String(p.rejectedQty),
            returnQuantity: '',
            lotNo: p.lotNo || '',
            warehouseId: p.warehouseId != null ? String(p.warehouseId) : '',
            millName: millName,
            millNameId: p.millNameId ?? null,
            inwardId: p.inwardId ?? null,
            orderItemId: p.orderItemId ?? null,
            yarnInwardStockDetailsId: p.yarnInwardStockDetailsId ?? null,
            inwardNo: p.inwardNo || '',
            purchaseInwardId: p.purchaseInwardId ?? null,
            purchaseInwardNo: p.purchaseInwardNo || '',
            ratePerUnit: rateInfo.rate,
            gstPercent: rateInfo.gstPercent,
            gstAmount: '',
            totalAmount: '',
          };

          console.log('Adding new row with rejectedQty:', newRow.rejectedQty);
          return newRow;
        });

      console.log('All rows to add:', toAdd);
      return [...prev, ...toAdd];
    });
    setIsYarnDialogOpen(false);
  };

  const openFabricDialog = () => {
    if (!purchaseOrderId) { toast.error('Select PO first'); return; }
    let source = (fabricPiecesByPO || []).filter((r: any) => {
      return !returnedFabricPieces.has(`${String(r.fabricMasterId || '')}|${String(r.pieceNo || '')}`);
    });

    const normalized = (source || []).map((r: any) => {
      const q = r.quality ?? r.fabricQuality ?? r.qualityName ?? '';
      const isSelected = (fabricRows || []).some((f: any) => {
        const fq = (f as any).quality ?? f.fabricQuality ?? '';
        const byPiece = String(f.pieceNo || '') === String(r.pieceNo || '') && (String(f.fabricMasterId || '') === String(r.fabricMasterId || '') || (String(f.fabricCode || '') === String(r.fabricCode || '') && String(fq || '') === String(q || '')));
        const byAttrs = (String(f.fabricCode || '') === String(r.fabricCode || '')) && (String(fq || '') === String(q || '')) && (String(f.pieceMeter || '') === String(r.pieceMeter || '')) && (String(f.netWeight || '') === String(r.netWeight || ''));
        return byPiece || byAttrs;
      });
      return { ...r, quality: q, selected: r.selected || isSelected };
    }).filter((r: any) => r.rejectedQty == null || Number(r.rejectedQty) > 0);
    setFabricPopupRows(normalized);
    setIsFabricDialogOpen(true);
  };

  const confirmFabricDialog = () => {
    const picks = (fabricPopupRows || []).filter((r: any) => r.selected);
    if (picks.length === 0) { toast.error('Select at least one fabric item'); return; }

    setFabricRows(prev => {
      const keyOf = (x: any) => {
        const q = (x as any).quality ?? x.fabricQuality ?? '';
        if (x.pieceNo) {
          return `piece|${String(x.fabricMasterId || '')}|${String(x.pieceNo || '')}`;
        }
        return `attr|${String(x.fabricCode || '')}|${String(q || '')}|${String(x.pieceMeter || '')}|${String(x.netWeight || '')}`;
      };
      const existingKeys = new Set((prev || []).map(keyOf));
      const toAdd: FabricEntryRow[] = picks
        .filter((p: any) => !existingKeys.has(keyOf(p)))
        .map((p: any) => {
          let q = p.quality;
          if (!q || q === '') {
            q = getQualityByFabricCode(p.fabricCode, p.fabricMasterId);
          }
          return {
            fabricMasterId: String(p.fabricMasterId),
            fabricCode: p.fabricCode,
            quality: q,
            returnQuantity: '',
            pieceNo: p.pieceNo,
            pieceMeter: p.pieceMeter,
            netWeight: p.netWeight,
            warehouseId: p.warehouseId,
            isPacked: p.isPacked,
            inwardId: p.inwardId ?? null,
            orderItemId: p.orderItemId ?? null,
          };
        });
      return [...prev, ...toAdd];
    });

    setIsFabricDialogOpen(false);
  };

  const openItemDialog = async () => {
    if (!vendorId) { toast.error('Select Vendor first'); return; }

    const data = await fetchItemStockDetails();

    const source = (data || []).map((entry: any) => {
      const item = entry.itemInwardStockDetails;
      const inv = entry.itemInventory;

      const isSelected = (itemRows || []).some((r: any) =>
        String(r.orderItemId) === String(item?.orderItemId || item?.id)
      );

      const warehouse = (warehouseList || []).find((wh: any) => String(wh.id) === String(item?.warehouseId));

      const masterList = Array.isArray(itemList) ? itemList : (itemList?.data || []);
      const itemFromMaster = masterList.find((im: any) => String(im.id) === String(item?.itemId));

      return {
        selected: isSelected,
        itemId: item?.itemId,
        itemName: item?.itemName || itemFromMaster?.itemName || itemFromMaster?.name || '',
        itemCode: item?.itemCode || itemFromMaster?.itemCode || itemFromMaster?.code || '',
        availableQty: String(item?.availableQty || 0),
        availableBags: item?.availableBags || 0,
        kgsPerBag: item?.kgsPerBag || 0,
        rejectedQty: item?.rejectedQty != null ? String(item.rejectedQty) : '0',
        purchaseOrderNo: selectedPONumber || item?.purchaseOrderNo || item?.poNo || '',
        warehouseId: item?.warehouseId,
        warehouseName: warehouse?.warehouseName || item?.warehouseName || '',
        uomId: item?.uomId,
        inwardId: item?.inwardId || inv?.id,
        orderItemId: item?.orderItemId || item?.id,
        inwardNo: item?.inwardNo || inv?.inwardNo || '',
        orderNo: item?.orderNo || entry?.orderNo || ''
      };
    });

    const filtered = source.filter((r: any) => {
      const isReturned = returnedGeneralItems.has(`${String(r.itemId || '')}|${String(r.inwardNo || '')}|${String(r.warehouseId || '')}`);
      return !isReturned && Number(r.rejectedQty || 0) > 0;
    });
    setItemPopupRows(filtered);
    setIsItemDialogOpen(true);
  };

  const confirmItemDialog = () => {
    const picks = (itemPopupRows || []).filter((r: any) => r.selected);
    if (picks.length === 0) { toast.error('Select at least one item'); return; }

    setItemRows(prev => {
      const existingIds = new Set((prev || []).map(r => String(r.orderItemId)));
      const toAdd: ItemEntryRow[] = picks
        .filter((p: any) => !existingIds.has(String(p.orderItemId)))
        .map((p: any) => ({
          itemId: String(p.itemId),
          itemName: p.itemName,
          itemCode: p.itemCode,
          inwardNo: p.inwardNo,
          availableQty: String(p.availableQty),
          availableBags: String(p.availableBags),
          kgsPerBag: String(p.kgsPerBag),
          rejectedQty: String(p.rejectedQty || '0'),
          returnQuantity: '',
          warehouseId: String(p.warehouseId),
          warehouseName: p.warehouseName,
          uomId: p.uomId,
          inwardId: p.inwardId,
          orderItemId: p.orderItemId
        }));
      return [...prev, ...toAdd];
    });

    setIsItemDialogOpen(false);
  };

  const yarnColumns = useMemo<PopupColumn[]>(() => [
    {
      Header: 'Action',
      id: 'selected',
      disableFilters: true,
      Cell: ({ row, index }) => (
        <input
          type="checkbox"
          checked={row.selected || false}
          onChange={e =>
            setYarnPopupRows(prev =>
              prev.map((r, i) =>
                i === index ? { ...r, selected: e.target.checked } : r
              )
            )
          }
        />
      ),
    },
    {
      Header: 'Inward No',
      accessor: 'inwardNo',
      id: 'inwardNo',
    },
    {
      Header: 'Yarn Name',
      accessor: 'yarnName',
      id: 'yarnName',
    },
    {
      Header: 'Mill Name',
      accessor: (row: any) =>
        row.millNameId
          ? getMillNameFromId(row.millNameId)
          : (row.millName || 'N/A'),
      id: 'millName',
    },
    {
      Header: 'Rejected Quantity',
      accessor: 'rejectedQty',
      id: 'rejectedQty',
      Cell: ({ row }) => (
        <input
          type="number"
          className="border px-2 py-1 rounded w-full text-center font-semibold text-green-700"
          value={row.rejectedQty || ''}
          readOnly
        />
      ),
    },
    {
      Header: 'Lot No',
      accessor: 'lotNo',
      id: 'lotNo',
      Cell: ({ row, index }) => (
        <input
          type="text"
          className="border px-2 py-1 rounded w-full text-center"
          value={row.lotNo || ''}
          readOnly
          onChange={e =>
            setYarnPopupRows(prev =>
              prev.map((r, i) =>
                i === index ? { ...r, lotNo: e.target.value } : r
              )
            )
          }
        />
      ),
    },
    {
      Header: 'Warehouse',
      accessor: (row: any) => {
        const warehouseName = row.warehouseId
          ? (Array.isArray(warehouseList)
            ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId))?.warehouseName
            : '')
          : '';
        return warehouseName || row.warehouseId || 'Not set';
      },
      id: 'warehouse',
      Cell: ({ row }) => {
        const warehouseName = row.warehouseId
          ? (Array.isArray(warehouseList)
            ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId))?.warehouseName
            : '')
          : '';
        return (
          <input
            type="text"
            className="border px-2 py-1 rounded w-full text-center"
            value={warehouseName || row.warehouseId || 'Not set'}
            readOnly
          />
        );
      },
    },
  ], [warehouseList, getMillNameFromId]);

  const fabricColumns = useMemo<PopupColumn[]>(() => [
    {
      Header: 'Action',
      id: 'selected',
      disableFilters: true,
      Cell: ({ row, index }) => (
        <input
          type="checkbox"
          checked={row.selected || false}
          onChange={e =>
            setFabricPopupRows(prev =>
              prev.map((r, i) =>
                i === index ? { ...r, selected: e.target.checked } : r
              )
            )
          }
        />
      ),
    },
    {
      Header: 'Sort No - Construction',
      accessor: (row: any) => `${row.fabricCode || ''}-${row.quality || ''}`,
      id: 'fabricCodeQuality',
    },
    {
      Header: 'Piece No',
      accessor: 'pieceNo',
      id: 'pieceNo',
      Cell: ({ row, index }) => (
        <input
          type="text"
          className="border px-2 py-1 rounded w-full"
          value={row.pieceNo || ''}
          readOnly
          onChange={e =>
            setFabricPopupRows(prev =>
              prev.map((r, i) =>
                i === index ? { ...r, pieceNo: e.target.value } : r
              )
            )
          }
        />
      ),
    },
    {
      Header: 'Piece Meter',
      accessor: 'pieceMeter',
      id: 'pieceMeter',
      Cell: ({ row }) => (
        <input
          type="text"
          className="border px-2 py-1 rounded w-full"
          value={row.pieceMeter || ''}
          readOnly
        />
      ),
    },
    {
      Header: 'Net Weight',
      accessor: 'netWeight',
      id: 'netWeight',
      Cell: ({ row }) => (
        <input
          type="text"
          className="border px-2 py-1 rounded w-full"
          value={row.netWeight || ''}
          readOnly
        />
      ),
    },
    {
      Header: 'Warehouse',
      accessor: (row: any) => {
        const w = Array.isArray(warehouseList) ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId)) : undefined;
        return w?.warehouseName || row.warehouseId || '';
      },
      id: 'warehouse',
      Cell: ({ row }) => {
        const w = Array.isArray(warehouseList) ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId)) : undefined;
        const name = w?.warehouseName || row.warehouseId || '';
        return <input type="text" className="border px-2 py-1 rounded w-full" value={name} readOnly />;
      },
    },
  ], [warehouseList]);

  const itemColumns = useMemo<PopupColumn[]>(() => [
    {
      Header: 'Action',
      id: 'selected',
      disableFilters: true,
      Cell: ({ row, index }) => (
        <input
          type="checkbox"
          checked={row.selected || false}
          onChange={e =>
            setItemPopupRows(prev =>
              prev.map((r, i) =>
                i === index ? { ...r, selected: e.target.checked } : r
              )
            )
          }
        />
      ),
    },
    {
      Header: 'Purchase Order No',
      accessor: (row: any) => row.purchaseOrderNo || row.orderNo || 'N/A',
      id: 'purchaseOrderNo',
    },
    {
      Header: 'Inward No',
      accessor: 'inwardNo',
      id: 'inwardNo',
    },
    {
      Header: 'Item Name',
      accessor: 'itemName',
      id: 'itemName',
    },
    {
      Header: 'Item Code',
      accessor: 'itemCode',
      id: 'itemCode',
    },
    {
      Header: 'Warehouse',
      accessor: (row: any) => row.warehouseName || row.warehouseId || '',
      id: 'warehouse',
    },
    {
      Header: 'Rejected Quantity',
      accessor: 'rejectedQty',
      id: 'rejectedQty',
      Cell: ({ row }) => (
        <div className="text-center text-green-700 font-semibold">
          {row.rejectedQty}
        </div>
      ),
    },
  ], []);

  useEffect(() => {
    dispatch(getAllPoTypes({} as any));
    const scopedVendorParams: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
    if (selectedCompanyId) {
      scopedVendorParams.companyId = selectedCompanyId;
    }
    dispatch(getAllVendors(scopedVendorParams as any));
    const scopedPurchaseOrderParams: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
    if (selectedCompanyId) {
      scopedPurchaseOrderParams.companyId = selectedCompanyId;
    }
    dispatch(getAllPurchaseOrders(scopedPurchaseOrderParams));
    dispatch(getAllYarnMasters({} as any));
    dispatch(getAllPurchaseInwards({} as any));
    dispatch(getAllFabricMasters({} as any));
    dispatch(getAllFabricMastersForDropdown() as any);
    dispatch(getAllSubCategories({} as any));
    dispatch(getAllTransports({} as any));
    const scopedPurchaseReturnParams: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
    if (selectedCompanyId) {
      scopedPurchaseReturnParams.companyId = selectedCompanyId;
    }
    dispatch(getAllPurchaseReturns(scopedPurchaseReturnParams));

    // dispatch(getAllSizingYarnIssue({} as any));
    // dispatch(getAllWeavingYarnIssue({} as any));
  }, [dispatch, selectedCompanyId]);

  // Reset dependent fields on type change (guard during edit prefill)
  const isPrefilling = useRef(false);
  useEffect(() => {
    if (isPrefilling.current) return;
    const rec: any = (location as any)?.state?.record;
    if (rec?.id) return;

    setValue('vendorId', '');
    setValue('purchaseOrderId', '');
    setYarnRows([]);
    setFabricRows([]);
    setItemRows([]);
  }, [purchaseType, setValue]);


  // Fetch warehouses once
  useEffect(() => {
    dispatch(getAllWarehouse({} as any));
  }, [dispatch]);

  // Edit-mode: hydrate form and rows when navigated with a record id
  useEffect(() => {
    const rec: any = (location as any)?.state?.record;
    if (!rec?.id) return;

    const load = async () => {
      try {
        isPrefilling.current = true;
        console.log(`Prefilling: Fetching purchase return ${rec.id}`);
        const res: any = await apiService.get(`/purchase-returns/${Number(rec.id)}`);
        console.log('Prefilling: Received response:', res);
        
        // Backend returns PurchaseReturnDTO directly
        let r = res;
        
        if (!r) {
          console.error('Prefilling: No data found in response');
          return;
        }
        
        console.log('Prefilling: Using record:', r);

        // Core form fields
        setValue('id', r?.id ?? null);
        setValue('returnNo', r?.returnNo || '');
        setValue('returnDate', (r?.returnDate || '').slice(0, 10));
        setValue('purchaseType', r?.purchaseType || '');
        setValue('vendorId', r?.vendorId != null ? String(r.vendorId) : '');
        setValue('purchaseOrderId', r?.purchaseOrderId != null ? String(r.purchaseOrderId) : '');
        setValue('grossWt', r?.grossWt != null ? String(r.grossWt) : '');
        setValue('remark', r?.remark || '');
        setValue('vehicleNo', r?.vehicleNo || '');
        setValue('transportId', r?.transportId != null ? String(r.transportId) : '');

        console.log('Prefilling: Form fields set', {
          id: r.id,
          purchaseType: r.purchaseType,
          vendorId: r.vendorId,
          purchaseOrderId: r.purchaseOrderId
        });

        // Rows based on type
        if ((r?.purchaseType || '') === 'yarn') {
          const yRows = (r?.yarnItems || []).map((y: any) => {
            // Try to get millNameId or millId from response directly
            let millNameId = (y?.millNameId ?? y?.millId) != null ? String(y.millNameId ?? y.millId) : null;

            const resolvedMillName = (y?.millName && y.millName !== '')
              ? y.millName
              : (millNameId ? getMillNameFromId(millNameId) : '');

            return {
              id: y?.id,
              yarnId: y?.yarnId != null ? String(y.yarnId) : '',
              yarnName: y?.yarnName || '',
              returnQuantity: y?.returnQuantity != null ? String(y.returnQuantity) : '',
              availableBags: y?.availableBags != null ? String(y.availableBags) : (y?.availableQuantityBags != null ? String(y.availableQuantityBags) : ''),
              kgsPerBag: y?.kgsPerBag != null ? String(y.kgsPerBag) : '',
              conesPerBag: y?.conesPerBag != null ? String(y.conesPerBag) : '',
              conesWeight: y?.conesWeight != null ? String(y.conesWeight) : '',
              rejectedQty: y?.rejectedQty != null ? String(y.rejectedQty) : (y?.availableQty != null ? String(y.availableQty) : (y?.availableQuantity != null ? String(y.availableQuantity) : '')),
              lotNo: y?.lotNo || '',
              warehouseId: y?.warehouseId != null ? String(y.warehouseId) : '',
              millName: resolvedMillName,
              millNameId: millNameId,
              inwardId: y?.inwardId ?? null,
              orderItemId: y?.orderItemId ?? null,
              yarnInwardStockDetailsId: y?.yarnInwardStockDetailsId ?? null,
              inwardNo: y?.inwardNo || '',
              purchaseInwardId: y?.purchaseInwardId ?? null,
              purchaseInwardNo: y?.purchaseInwardNo || '',
              ratePerUnit: y?.ratePerUnit != null ? String(y.ratePerUnit) : '',
              gstPercent: y?.gstPercent != null ? String(y.gstPercent) : '',
              gstAmount: y?.gstAmount != null ? String(y.gstAmount) : '',
              totalAmount: y?.totalAmount != null ? String(y.totalAmount) : '',
            };
          });
          setYarnRows(yRows);
          setFabricRows([]);
        } else if ((r?.purchaseType || '') === 'item') {
          const itemData = r?.items || [];
          const iRows = itemData.map((i: any) => ({
            id: i?.id,
            itemId: i?.itemId != null ? String(i.itemId) : '',
            itemName: i?.itemName || '',
            itemCode: i?.itemCode || '',
            inwardNo: i?.inwardNo || '',
            returnQuantity: i?.returnQuantity != null ? String(i.returnQuantity) : '',
            availableQty: i?.availableQuantity != null ? String(i.availableQuantity) : (i?.availableQty != null ? String(i.availableQty) : ''),
            availableBags: i?.availableBags != null ? String(i.availableBags) : '',
            kgsPerBag: i?.unitPerBags != null ? String(i.unitPerBags) : (i?.kgsPerBag != null ? String(i.kgsPerBag) : ''),
            rejectedQty: i?.rejectedQty != null ? String(i.rejectedQty) : '0',
            warehouseId: i?.warehouseId != null ? String(i.warehouseId) : '',
            uomId: i?.uomId != null ? String(i.uomId) : '',
            inwardId: i?.inwardId ?? null,
            orderItemId: i?.orderItemId ?? null,
          }));
          setItemRows(iRows);
          setYarnRows([]);
          setFabricRows([]);
        } else {
          const fRows = (r?.fabricItems || []).map((f: any) => ({
            id: f?.id,
            fabricMasterId: f?.fabricMasterId != null ? String(f.fabricMasterId) : '',
            fabricCode: f?.fabricCode || '',
            quality: f?.quality || '',
            returnQuantity: f?.returnQuantity != null ? String(f.returnQuantity) : '',
            pieceNo: f?.pieceNo || '',
            pieceMeter: f?.pieceMeter != null ? String(f.pieceMeter) : '',
            netWeight: f?.netWeight != null ? String(f.netWeight) : '',
            warehouseId: f?.warehouseId != null ? String(f.warehouseId) : '',
            isPacked: f?.isPacked != null ? f.isPacked : 0,
            inwardId: f?.inwardId ?? null,
            orderItemId: f?.orderItemId ?? null,
          }));
          setFabricRows(fRows);
          setYarnRows([]);
          setItemRows([]);
        }
      } catch (e) {
        // noop; UI already has guards
      } finally {
        isPrefilling.current = false;
      }
    };

    load();
  }, [location, setValue]);

  // Add this debug useEffect to track the yarnRows data
  useEffect(() => {
    console.log('=== YARN ROWS DEBUG ===');
    console.log('yarnRows:', yarnRows);
    if (yarnRows.length > 0) {
      yarnRows.forEach((row, index) => {
        console.log(`Row ${index}:`, {
          yarnId: row.yarnId,
          yarnName: row.yarnName,
          millName: row.millName,
          millNameId: row.millNameId,
          rejectedQty: row.rejectedQty,
          warehouseId: row.warehouseId
        });
      });
    }
    console.log('=======================');
  }, [yarnRows]);

  // Update millName in yarnRows when subCategoryList hydrates (critical for edit mode on refresh)
  useEffect(() => {
    if (!subCategoryList || yarnRows.length === 0) return;
    
    // Check if any row needs mill name hydration
    const needsHydration = yarnRows.some(row => row.millNameId && (!row.millName || row.millName === ''));
    if (!needsHydration) return;

    const list = Array.isArray(subCategoryList) ? subCategoryList : (subCategoryList?.data || []);
    if (list.length === 0) return;

    setYarnRows(prev => {
      let changed = false;
      const updated = prev.map(row => {
        if (row.millNameId && (!row.millName || row.millName === '')) {
          const name = getMillNameFromId(row.millNameId);
          if (name) {
            changed = true;
            return { ...row, millName: name };
          }
        }
        return row;
      });
      return changed ? updated : prev;
    });
  }, [subCategoryList, yarnRows.length, getMillNameFromId]);



  // Filter vendors based on selected type
  const filteredVendors = useMemo(() => {
    const rec: any = (location as any)?.state?.record;
    const currentVendorId = String(vendorId || rec?.vendorId || '');
    const rawList = Array.isArray(vendorList) ? vendorList : (vendorList?.data || []);

    if (!purchaseType) {
      return rawList;
    }

    const typeStr = purchaseType.toLowerCase();

    const matchesType = (v: any) => {
      if (!v) return false;

      // Extract all numeric type IDs from vendor object (e.g. vendorTypeId: "305", vendorTypeIds: [305])
      const ids = new Set<number>();
      const addCandidate = (val: any) => {
        if (val == null || val === '') return;
        if (Array.isArray(val)) {
          val.forEach(addCandidate);
        } else if (typeof val === 'string') {
          val.split(',').forEach(s => {
            const num = Number(s.trim());
            if (Number.isFinite(num)) ids.add(num);
          });
        } else if (typeof val === 'number' && Number.isFinite(val)) {
          ids.add(val);
        }
      };

      addCandidate(v.vendorTypeId);
      addCandidate(v.vendor_type_id);
      addCandidate(v.vendorTypeIds);
      addCandidate(v.vendorType?.id);
      addCandidate(v.vendorType?.vendorTypeId);

      // Extract text labels as fallback
      const labels: string[] = [];
      if (typeof v.vendorType === 'string') labels.push(v.vendorType);
      else if (v.vendorType?.vendorTypeName) labels.push(v.vendorType.vendorTypeName);
      else if (v.vendorType?.name) labels.push(v.vendorType.name);

      if (typeof v.vendorTypeName === 'string') labels.push(v.vendorTypeName);

      if (Array.isArray(v.vendorTypes)) {
        v.vendorTypes.forEach((vt: any) => {
          if (typeof vt === 'string') labels.push(vt);
          else if (vt?.name) labels.push(vt.name);
          else if (vt?.vendorTypeName) labels.push(vt.vendorTypeName);
        });
      }

      const combinedText = labels.join(' ').toLowerCase();

      // Always include 'All' type (307)
      if (ids.has(307) || combinedText.includes('all')) {
        return true;
      }

      if (typeStr === 'yarn') {
        // Yarn Supplier: 301
        return ids.has(301) || combinedText.includes('yarn');
      }

      if (typeStr === 'item') {
        // Item Supplier: 305
        return ids.has(305) || combinedText.includes('item');
      }

      if (typeStr === 'fabric' || typeStr === 'knitted' || typeStr === 'woven') {
        // Fabric Supplier: 306
        return ids.has(306) || combinedText.includes('fabric') || combinedText.includes('knitted') || combinedText.includes('woven');
      }

      return false;
    };

    let vendors = rawList.filter((v: any) => v.isActive !== false && v.activeFlag !== false && matchesType(v));

    // Fallback: If no vendors matched via specific type criteria, try filterVendorsByPoType
    if (vendors.length === 0 && poTypeIdForType) {
      vendors = filterVendorsByPoType(rawList, poTypeIdForType, {
        purchaseOrderTypes: purchaseOrderTypeList,
        fallbackKeyword: purchaseType,
        includeVendorTypeIds: [VENDOR_TYPE_ALL],
      });
    }

    // Ensure the current vendor is always included in options (edit mode / existing selection)
    if (currentVendorId && !vendors.some((v: any) => String(v.id) === currentVendorId)) {
      const globalVendor = rawList.find((v: any) => String(v.id) === currentVendorId);
      if (globalVendor) {
        vendors = [globalVendor, ...vendors];
      } else if (rec?.vendorName) {
        vendors = [{ id: currentVendorId, vendorName: rec.vendorName }, ...vendors];
      } else if (rec?.vendor) {
        vendors = [{ id: currentVendorId, vendorName: rec.vendor.vendorName || rec.vendor.name }, ...vendors];
      }
    }
    return vendors;
  }, [vendorList, purchaseType, poTypeIdForType, purchaseOrderTypeList, vendorId, location]);

  // Filter POs based on vendor and PO Type
  const filteredPOs = useMemo(() => {
    const rec: any = (location as any)?.state?.record;
    const currentId = String(purchaseOrderId || rec?.purchaseOrderId || '');

    const list = Array.isArray(purchaseOrderList?.data) ? purchaseOrderList.data : purchaseOrderList;
    const allPOs = list || [];

    return allPOs.filter((po: any) => {
      const matchesVendor = vendorId ? String(po.vendorId) === String(vendorId) : true;
      const matchesPoType = poTypeIdForType !== undefined ? Number(po.poTypeId) === Number(poTypeIdForType) : true;
      const isCurrentPO = rec?.id && String(po.id) === currentId;
      return (matchesVendor && matchesPoType) || isCurrentPO;
    });
  }, [purchaseOrderList, vendorId, poTypeIdForType, purchaseOrderId, location]);

  // For Fabric (woven/knitted): flatten pieceEntries
  const fabricPiecesByPO = useMemo(() => {
    if (poTypeIdForType !== 2 && poTypeIdForType !== 3) return [] as any[];
    const rows: any[] = [];
    (inwardByPOAndType || []).forEach((pi: any) => {
      (pi?.purchaseInwardItemsDtl || []).forEach((dtl: any) => {
        const baseFabricCode = dtl?.fabricCode || pi?.fabricCode || '';
        const baseQuality = dtl?.quality ?? dtl?.fabricQuality ?? dtl?.qualityName ?? '';
        const pieces = Array.isArray(dtl?.pieceEntries) ? dtl.pieceEntries : [];
        pieces.forEach((pe: any) => {
          // Treat null/undefined as not packed (0) to preserve old behavior; accept 0/"0"/false as not packed
          const rawPacked = pe?.isPacked;
          const isPackedZero = (rawPacked == null) || (String(rawPacked).toLowerCase() === '0') || (String(rawPacked).toLowerCase() === 'false') || (Number(rawPacked) === 0);
          if (!isPackedZero) return; // only show isPacked == 0 pieces

          // derive quality if missing on the piece from dtl or fabric master
          let quality = pe?.quality ?? baseQuality;
          if (!quality || quality === '') {
            quality = getQualityByFabricCode(baseFabricCode, pe?.fabricMasterId);
          }

          rows.push({
            selected: false,
            fabricMasterId: pe?.fabricMasterId != null ? String(pe.fabricMasterId) : (dtl?.fabricMasterId != null ? String(dtl.fabricMasterId) : ''),
            fabricCode: baseFabricCode,
            quality,
            pieceNo: pe?.pieceNumber || pe?.pieceNo || '',
            pieceMeter: pe?.quantity != null ? String(pe.quantity) : '',
            netWeight: pe?.weight != null ? String(pe.weight) : '',
            warehouseId: pe?.warehouseId != null ? String(pe.warehouseId) : (dtl?.warehouseId != null ? String(dtl.warehouseId) : ''),
            isPacked: isPackedZero ? 0 : 1,
            inwardId: pi?.id ?? null,
            orderItemId: dtl?.id ?? null
          });
        });
      });
    });
    return rows;
  }, [inwardByPOAndType, poTypeIdForType, getQualityByFabricCode]);

  // Derive items by PO
  const yarnItemsByPO = useMemo(() => {
    if (!purchaseOrderId) return [];

    let po = (filteredPOs || []).find((p: any) => String(p.id) === String(purchaseOrderId));
    if (!po) {
      const fullList = Array.isArray((purchaseOrderList as any)?.data)
        ? (purchaseOrderList as any).data
        : (purchaseOrderList || []);
      po = (fullList || []).find((p: any) => String(p.id) === String(purchaseOrderId));
    }

    const items = po?.purchaseOrderItemsDtl || [];
    return items
      .filter((i: any) => i?.yarnId || i?.yarnName)
      .map((i: any) => {
        let yarnId = i?.yarnId;
        let yarnName = i?.yarnName;
        if (!yarnName && yarnList) {
          const ym = (yarnList || []).find((y: any) => String(y.id) === String(i.yarnId));
          yarnName = ym?.yarnName || i.yarnName || i.yarnId;
        }
        if ((!yarnId || yarnId === '') && yarnList && yarnName) {
          const ym2 = (yarnList as any[]).find((y: any) => String(y.yarnName).toLowerCase() === String(yarnName).toLowerCase());
          if (ym2) yarnId = ym2.id;
        }

        // Get mill name from millNameId
        const millName = i?.millName || getMillNameFromId(i?.millNameId);

        return {
          ...i,
          yarnId,
          yarnName,
          millName,
          millNameId: i?.millNameId ?? null
        };
      });
  }, [filteredPOs, purchaseOrderList, purchaseOrderId, yarnList, subCategoryList]);

  const fabricItemsByPO = useMemo(() => {
    if (!purchaseOrderId) return [];

    // Try filtered POs first, then fallback to full PO list (for edit mode compatibility)
    let po = (filteredPOs || []).find((p: any) => String(p.id) === String(purchaseOrderId));
    if (!po) {
      const fullList = Array.isArray((purchaseOrderList as any)?.data)
        ? (purchaseOrderList as any).data
        : (purchaseOrderList || []);
      po = (fullList || []).find((p: any) => String(p.id) === String(purchaseOrderId));
    }

    const items = po?.purchaseOrderItemsDtl || [];
    return items
      .filter((i: any) => i?.fabricCode || i?.fabricMasterId)
      .map((i: any) => {
        let quality = i?.quality ?? i?.fabricQuality ?? i?.qualityName;
        if (!quality) {
          const match = (fabricPiecesByPO || []).find((r: any) =>
            String(r.fabricMasterId) === String(i.fabricMasterId) || ((r.fabricCode || '') === (i.fabricCode || ''))
          );
          if (match) quality = match.quality;
        }
        if (!quality || quality === '') {
          quality = getQualityByFabricCode(i.fabricCode, i.fabricMasterId);
        }
        return { ...i, quality };
      });
  }, [filteredPOs, purchaseOrderList, purchaseOrderId, fabricPiecesByPO, getQualityByFabricCode]);

  // Get issued quantities from yarn issue data (by yarnId+lotNo+warehouseId key)
  const issuedQuantitiesByKey = useMemo(() => {
    const issuedMap = new Map<string, number>();

    // Aggregate from sizing yarn issues
    (sizingYarnIssuetList || []).forEach((issue: any) => {
      if (issue.sizingYarnIssue && Array.isArray(issue.sizingYarnIssue)) {
        issue.sizingYarnIssue.forEach((yarnIssue: any) => {
          const yarnId = yarnIssue.yarnId;
          const lotNo = yarnIssue.lotNo || '';
          const warehouseId = yarnIssue.warehouseId || '';
          const issueQty = Number(yarnIssue.issueQty || 0);

          if (yarnId && issueQty > 0) {
            const key = `${yarnId}|${lotNo}|${warehouseId}`;
            const current = issuedMap.get(key) || 0;
            issuedMap.set(key, current - issueQty);
          }
        });
      }
    });

    // Aggregate from weaving yarn issues
    (weavingYarnIssuetList || []).forEach((issue: any) => {
      if (issue.requirements && Array.isArray(issue.requirements)) {
        issue.requirements.forEach((requirement: any) => {
          if (requirement.yarnIssues && Array.isArray(requirement.yarnIssues)) {
            requirement.yarnIssues.forEach((yarnIssue: any) => {
              const yarnId = yarnIssue.yarnId;
              const lotNo = yarnIssue.lotNo || yarnIssue.lotId || '';
              const warehouseId = yarnIssue.warehouseId || '';
              const issueQty = Number(yarnIssue.issueQty || 0);

              if (yarnId && issueQty > 0) {
                const key = `${yarnId}|${lotNo}|${warehouseId}`;
                const current = issuedMap.get(key) || 0;
                issuedMap.set(key, current - issueQty);
              }
            });
          }
        });
      }
    });

    return issuedMap;
  }, [sizingYarnIssuetList, weavingYarnIssuetList]);



  // For Yarn: flatten lotEntries with real-time available quantity calculation
  const yarnLotsByPO = useMemo(() => {
    if (poTypeIdForType !== 1) return [] as any[];

    // Get all previous returns for this PO to calculate deducted quantities
    const previousReturns = (purchaseReturnList || []).filter((pr: any) =>
      String(pr.purchaseOrderId) === String(purchaseOrderId) &&
      pr.purchaseType === 'yarn'
    );

    // Create a map to track returned quantities by yarnId+lotNo+warehouseId
    const returnedQtyMap = new Map();

    previousReturns.forEach((pr: any) => {
      (pr.yarnItems || []).forEach((yarnItem: any) => {
        const key = `${yarnItem.yarnId}|${yarnItem.lotNo}|${yarnItem.warehouseId}`;
        const currentReturned = returnedQtyMap.get(key) || 0;
        returnedQtyMap.set(key, currentReturned - Number(yarnItem.returnQuantity || 0));
      });
    });

    const lots: any[] = [];
    (inwardByPOAndType || []).forEach((pi: any) => {
      (pi?.purchaseInwardItemsDtl || []).forEach((dtl: any) => {
        (dtl?.lotEntries || []).forEach((le: any) => {
          const yarnId = le?.yarnId;
          let yarnName = String(yarnId || '');
          if (yarnId && Array.isArray(yarnList)) {
            const ym = (yarnList as any[]).find((y: any) => String(y.id) === String(yarnId));
            yarnName = ym?.yarnName || yarnName;
          }

          // Get mill name from millNameId
          const millNameId = dtl?.millNameId || le?.millNameId;
          const millName = millNameId ? getMillNameFromId(millNameId) : (dtl?.millName || le?.millName || '');

          // Get warehouse
          const warehouseId = le?.warehouseId != null ? String(le.warehouseId) : (dtl?.warehouseId != null ? String(dtl.warehouseId) : '');

          // Calculate rejected quantity from inward balance for fallback dataset
          const originalQty = Number(le?.quantity || 0);
          const key = `${yarnId}|${le?.lotNumber || ''}|${warehouseId}`;
          const issuedQty = issuedQuantitiesByKey.get(key) || 0;
          const returnedQty = returnedQtyMap.get(key) || 0;
          const rejectedQty = (originalQty || 0) - (issuedQty || 0);

          lots.push({
            selected: false,
            yarnId: yarnId,
            yarnName,
            rejectedQty: String(rejectedQty),
            originalQty: String(originalQty),
            issuedQty: String(issuedQty),
            returnedQty: String(returnedQty),
            lotNo: le?.lotNumber || '',
            warehouseId: warehouseId,
            millName: millName,
            millNameId: millNameId ?? null,
            inwardId: pi?.id ?? null,
            orderItemId: dtl?.id ?? null,
          });
        });
      });
    });
    return lots;
  }, [inwardByPOAndType, poTypeIdForType, yarnList, subCategoryList, purchaseOrderId, purchaseReturnList, issuedQuantitiesByKey]);

  // Summary aggregation for fabric: group by Fabric Code - Quality
  const fabricSummary = useMemo(() => {
    const groups = new Map<string, { fabricCode: string; quality: string; totalPieces: number; totalMeters: number; totalNetWeight: number }>();
    (fabricRows || []).forEach((r) => {
      const fabricCode = String(r.fabricCode || '');
      const quality = String((r as any).quality ?? r.fabricQuality ?? '');
      const key = `${fabricCode}|${quality}`;
      const pieceMeter = parseFloat(String(r.pieceMeter || '0')) || 0;
      const netWeight = parseFloat(String(r.netWeight || '0')) || 0;
      const prev = groups.get(key) || { fabricCode, quality, totalPieces: 0, totalMeters: 0, totalNetWeight: 0 };
      prev.totalPieces += 1;
      prev.totalMeters += pieceMeter;
      prev.totalNetWeight += netWeight;
      groups.set(key, prev);
    });
    return Array.from(groups.values());
  }, [fabricRows]);

  const fabricTotalsByKey = useMemo(() => {
    const m: Record<string, number> = {} as any;
    fabricSummary.forEach((s) => { m[`${s.fabricCode}|${s.quality}`] = s.totalMeters; });
    return m;
  }, [fabricSummary]);

  // Summary aggregation for yarn: group by yarnId/yarnName
  const yarnSummary = useMemo(() => {
    const groups = new Map<string, { yarnId: string; yarnName: string; totalQuantity: number }>();
    (yarnRows || []).forEach((r) => {
      const yarnId = String(r.yarnId || '');
      const yarnName = String(r.yarnName || '');
      const key = `${yarnId}|${yarnName}`;
      const qty = parseFloat(String(r.returnQuantity || '0')) || 0;
      const prev = groups.get(key) || { yarnId, yarnName, totalQuantity: 0 };
      prev.totalQuantity += qty;
      groups.set(key, prev);
    });
    return Array.from(groups.values());
  }, [yarnRows]);

  const addYarnRow = () => setYarnRows(prev => [...prev, { yarnId: '', yarnName: '', uom: '', returnQuantity: '' }]);
  const removeYarnRow = (idx: number) => setYarnRows(prev => prev.filter((_, i) => i !== idx));

  const addFabricRow = () => setFabricRows(prev => [...prev, { fabricMasterId: '', fabricCode: '', quality: '', returnQuantity: '' }]);
  const removeFabricRow = (idx: number) => setFabricRows(prev => prev.filter((_, i) => i !== idx));

  // Validation: total returned qty cannot exceed ordered qty
  const validateAgainstPO = (): boolean => {
    const po = (filteredPOs || []).find((p: any) => String(p.id) === String(purchaseOrderId));
    if (!po) return true;
    const items = po?.purchaseOrderItemsDtl || [];
    const selectKey = (candidates: any[], fallback: string) => {
      const match = candidates
        .map(value => (value != null && value !== '' ? String(value) : ''))
        .find(Boolean);
      return match || fallback;
    };

    if (purchaseType === 'yarn') {
      const matchYarnItem = (row: YarnEntryRow, item: any) => {
        const rowId = row?.yarnId != null && row.yarnId !== '' ? String(row.yarnId) : '';
        if (rowId) {
          const ids = [item?.yarnId, item?.itemId, item?.productId, item?.id]
            .map((v: any) => (v != null && v !== '' ? String(v) : ''))
            .filter(Boolean);
          if (ids.includes(rowId)) {
            return true;
          }
        }
        const rowName = (row?.yarnName || '').trim().toLowerCase();
        if (rowName) {
          const names = [item?.yarnName, item?.itemName, item?.productName]
            .map((v: any) => (v || '').trim().toLowerCase())
            .filter(Boolean);
          if (names.includes(rowName)) {
            return true;
          }
        }
        return false;
      };

      const totals = new Map<string, { orderedQty: number; returnedQty: number; label: string }>();
      for (const [index, row] of yarnRows.entries()) {
        const ordered = items.find((i: any) => matchYarnItem(row, i));
        if (!ordered) {
          continue;
        }
        const orderedQty = Number(ordered.quantity || 0);
        const retQty = Number(row.returnQuantity || 0);
        const key = selectKey(
          [
            ordered.id,
            ordered.itemId,
            ordered.productId,
            ordered.yarnId,
            row.yarnId,
            (row.yarnName || '').toLowerCase()
          ],
          `idx-${index}`
        );
        const existing = totals.get(key) || { orderedQty, returnedQty: 0, label: row.yarnName || row.yarnId || key };
        existing.returnedQty += retQty;
        totals.set(key, existing);
        if (existing.returnedQty > existing.orderedQty) {
          toast.error(`Returned qty for ${existing.label} cannot exceed ordered qty (${existing.orderedQty}).`);
          return false;
        }
      }
    } else if (purchaseType === 'item') {
      for (const row of itemRows) {
        const retQty = Number(row.returnQuantity || 0);
        const rejQty = Number(row.rejectedQty || 0);
        if (retQty <= 0) {
          toast.error(`Return Quantity is required for item "${row.itemName || row.itemId}".`);
          return false;
        }
        if (rejQty > 0 && retQty > rejQty) {
          toast.error(`Return Qty for "${row.itemName || row.itemId}" cannot exceed Rejected Qty (${rejQty}).`);
          return false;
        }
      }
    } else {
      const totals = new Map<string, { orderedQty: number; returnedQty: number; label: string }>();
      for (const [index, row] of fabricRows.entries()) {
        const rowQuality = (row as any).quality ?? row.fabricQuality ?? '';
        const ordered = items.find((i: any) => String(i.fabricMasterId) === String(row.fabricMasterId) || ((i.fabricCode || '') === (row.fabricCode || '') && (i.quality || '') === rowQuality));
        if (!ordered) {
          continue;
        }
        const orderedQty = Number(ordered.quantity || 0);
        const retQty = Number(row.returnQuantity || 0);
        const labelBase = row.fabricCode && rowQuality
          ? `${row.fabricCode}-${rowQuality}`
          : row.fabricCode || rowQuality || String(row.fabricMasterId || '');
        const key = selectKey(
          [
            ordered.id,
            ordered.fabricMasterId,
            `${ordered.fabricCode || ''}-${ordered.quality || ''}`,
            row.fabricMasterId,
            labelBase
          ],
          `idx-${index}`
        );
        const existing = totals.get(key) || { orderedQty, returnedQty: 0, label: labelBase || key };
        existing.returnedQty += retQty;
        totals.set(key, existing);
        if (existing.returnedQty > existing.orderedQty) {
          toast.error(`Returned qty for ${existing.label} cannot exceed ordered qty (${existing.orderedQty}).`);
          return false;
        }
      }
    }
    return true;
  };

  const onSubmit = async (data: PurchaseReturnForm) => {
    isSavingRef.current = true;
    if (!purchaseType) { isSavingRef.current = false; toast.error('Select Purchase Type'); return; }
    if (!vendorId) { isSavingRef.current = false; toast.error('Select Vendor'); return; }
    if (!purchaseOrderId) { isSavingRef.current = false; toast.error('Select PO'); return; }

    if (purchaseType === 'yarn' && yarnRows.length === 0) {
      isSavingRef.current = false; toast.error('Please add at least one yarn item'); return;
    }
    if ((purchaseType === 'fabric' || purchaseType === 'knitted') && fabricRows.length === 0) {
      isSavingRef.current = false; toast.error('Please add at least one fabric item'); return;
    }
    if (purchaseType === 'item' && itemRows.length === 0) {
      isSavingRef.current = false; toast.error('Please add at least one item'); return;
    }

    if (purchaseType === 'yarn' && yarnRows.some(r => !r.returnQuantity || Number(r.returnQuantity) <= 0)) {
      isSavingRef.current = false;
      toast.error('Return Quantity is required for all yarn rows');
      return;
    }

    if (!validateAgainstPO()) { isSavingRef.current = false; return; }

    if ((purchaseType === 'fabric' || purchaseType === 'knitted') && fabricRows.some(r => !r.returnQuantity || Number(r.returnQuantity) <= 0)) {
      isSavingRef.current = false;
      toast.error('Return Quantity is required for all fabric rows');
      return;
    }


    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) {
      isSavingRef.current = false;
      toast.error("Please select a company before submitting");
      return;
    }

    let returnNo = data.returnNo;
    // Debug: Check what's in yarnRows before creating payload
    console.log('=== BEFORE SUBMIT - YARN ROWS ===');
    yarnRows.forEach((row, index) => {
      console.log(`Row ${index} millNameId:`, row.millNameId);
    });

    const yarnSummary = {
      yarnId: purchaseType === 'yarn' && yarnRows[0]?.yarnId ? String(yarnRows[0].yarnId) : '',
      yarnName: purchaseType === 'yarn' && yarnRows[0]?.yarnName ? yarnRows[0].yarnName : '',
      totalQuantity: purchaseType === 'yarn' ? yarnRows.reduce((sum, row) => sum + Number(row.returnQuantity || 0), 0) : 0
    };

    const fabricSummary = {
      fabricCode: (purchaseType === 'fabric' || purchaseType === 'knitted') && fabricRows[0]?.fabricCode ? fabricRows[0].fabricCode : '',
      quality: (purchaseType === 'fabric' || purchaseType === 'knitted') ? ((fabricRows[0] as any)?.quality ?? fabricRows[0]?.fabricQuality ?? '') : '',
      totalPieces: (purchaseType === 'fabric' || purchaseType === 'knitted') ? fabricRows.length : 0,
      totalMeters: (purchaseType === 'fabric' || purchaseType === 'knitted') ? fabricRows.reduce((sum, row) => sum + Number(row.pieceMeter || 0), 0) : 0,
      totalNetWeight: (purchaseType === 'fabric' || purchaseType === 'knitted') ? fabricRows.reduce((sum, row) => sum + Number(row.netWeight || 0), 0) : 0
    };

    const itemSummary = {
      itemId: purchaseType === 'item' && itemRows[0]?.itemId ? String(itemRows[0].itemId) : '',
      itemName: purchaseType === 'item' && itemRows[0]?.itemName ? itemRows[0].itemName : '',
      totalQuantity: purchaseType === 'item' ? itemRows.reduce((sum, row) => sum + Number(row.returnQuantity || 0), 0) : 0
    };

    const payload: any = {
      id: data.id ? Number(data.id) : 0,
      returnNo: returnNo, // Use resolved number
      returnDate: data.returnDate,
      purchaseType: purchaseType,
      vendorId: String(vendorId),
      purchaseOrderId: Number(purchaseOrderId),
      companyId: parseInt(storedCompanyId),
      transportId: data.transportId ? String(data.transportId) : '',
      remark: data.remark || '',
      vehicleNo: data.vehicleNo || '',
      grossWt: data.grossWt ? String(data.grossWt) : '',

      yarnItems: purchaseType === 'yarn'
        ? yarnRows.map(y => ({
          id: y.id ? Number(y.id) : 0,
          yarnId: y.yarnId != null && y.yarnId !== '' ? String(y.yarnId) : '',
          yarnName: y.yarnName || '',
          returnQuantity: String(y.returnQuantity || '0'),
          rejectedQty: (y as any).rejectedQty != null && (y as any).rejectedQty !== ''
            ? String((y as any).rejectedQty)
            : ((y as any).availableQty != null && (y as any).availableQty !== '' ? String((y as any).availableQty) : '0'),
          availableBags: y.availableBags != null && y.availableBags !== '' ? String(y.availableBags) : '',
          kgsPerBag: y.kgsPerBag != null && y.kgsPerBag !== '' ? String(y.kgsPerBag) : '',
          conesPerBag: y.conesPerBag != null && y.conesPerBag !== '' ? String(y.conesPerBag) : '',
          conesWeight: y.conesWeight != null && y.conesWeight !== '' ? String(y.conesWeight) : '',
          lotNo: y.lotNo || '',
          millNameId: y.millNameId != null && y.millNameId !== '' ? String(y.millNameId) : '',
          warehouseId: y.warehouseId != null && y.warehouseId !== '' ? String(y.warehouseId) : '',
          inwardId: y.inwardId != null ? String(y.inwardId) : '',
          orderItemId: y.orderItemId != null ? String(y.orderItemId) : '',
          purchaseInwardId: y.purchaseInwardId != null ? String(y.purchaseInwardId) : '',
          ratePerUnit: y.ratePerUnit != null && y.ratePerUnit !== '' ? String(y.ratePerUnit) : '',
          gstPercent: y.gstPercent != null && y.gstPercent !== '' ? String(y.gstPercent) : '',
          gstAmount: y.gstAmount != null && y.gstAmount !== '' ? String(y.gstAmount) : '',
          totalAmount: y.totalAmount != null && y.totalAmount !== '' ? String(y.totalAmount) : '',
        }))
        : [],
      fabricItems: (purchaseType === 'fabric' || purchaseType === 'knitted')
        ? fabricRows.map(f => ({
          id: f.id ? Number(f.id) : 0,
          fabricMasterId: f.fabricMasterId != null && f.fabricMasterId !== '' ? String(f.fabricMasterId) : '',
          fabricCode: f.fabricCode || '',
          quality: (f as any).quality ?? f.fabricQuality ?? '',
          returnQuantity: String(f.returnQuantity || '0'),
          pieceNo: f.pieceNo || '',
          pieceMeter: f.pieceMeter != null && f.pieceMeter !== '' ? String(f.pieceMeter) : '',
          netWeight: f.netWeight != null && f.netWeight !== '' ? String(f.netWeight) : '',
          warehouseId: f.warehouseId != null && f.warehouseId !== '' ? String(f.warehouseId) : '',
          isPacked: String(f.isPacked ?? '0'),
        }))
        : [],
      items: purchaseType === 'item'
        ? itemRows.map(i => ({
          id: i.id ? Number(i.id) : 0,
          inwardNo: i.inwardNo || '',
          itemId: i.itemId != null && i.itemId !== '' ? String(i.itemId) : '',
          itemName: i.itemName || '', 
          itemCode: i.itemCode || '',
          warehouseId: i.warehouseId != null && i.warehouseId !== '' ? String(i.warehouseId) : '',
          availableBags: String(i.availableBags || '0'),
          unitPerBags: String(i.kgsPerBag || '0'),
          availableQuantity: i.availableQty != null && i.availableQty !== '' ? String(i.availableQty) : '0',
           rejectedQty:i.rejectedQty != null && (i as any).rejectedQty !== ''
            ? String((i as any).rejectedQty)
            : ((i as any).availableQty != null && (i as any).availableQty !== '' ? String((i as any).availableQty) : '0'),
          returnQuantity: String(i.returnQuantity || '0'),
          inwardId: i.inwardId != null ? String(i.inwardId) : '',
          orderItemId: i.orderItemId != null ? String(i.orderItemId) : '',
        }))
        : [],
      yarnSummary: yarnSummary,
      fabricSummary: fabricSummary,
    };


    try {

      console.log('=== FINAL PAYLOAD ===');
      console.log(JSON.stringify(payload, null, 2));
      if (data.id) {
        await dispatch(updatePurchaseReturn({ id: Number(data.id), data: payload, companyId: payload.companyId })).unwrap();
      } else {
        await dispatch(createPurchaseReturn(payload)).unwrap();
         documentNumberService.clearMemoryCache("Purchase Return / GRN Return");
      }
      navigate('/transaction/purchase-return-details');
    } catch (error) {
      isSavingRef.current = false;
      console.error('Error submitting purchase return:', error);
    }
  };

  const handleBack = () => navigate('/transaction/purchase-return-details');

  // Ensure selected PO appears immediately in edit-mode even before lists hydrate
  // Also fetch PO by ID if it's not in lists so we can display correct poNo label
  const [poById, setPoById] = useState<any | null>(null);

  // ADD: Map global PO list by id for instant lookups
  const poMapById = useMemo(() => {
    const globalList = Array.isArray((purchaseOrderList as any)?.data)
      ? (purchaseOrderList as any).data
      : ((purchaseOrderList as any) || []);
    const map: Record<string, any> = {};
    (globalList || []).forEach((po: any) => {
      if (po?.id != null) map[String(po.id)] = po;
    });
    return map;
  }, [purchaseOrderList]);

  // ADD: Find the edit record from purchaseReturnList (list view often has poNo)
  const recFromList = useMemo(() => {
    const rec: any = (location as any)?.state?.record;
    const editId = rec?.id;
    if (!editId) return null;

    const list =
      Array.isArray((purchaseReturnList as any)?.data)
        ? (purchaseReturnList as any).data
        : (Array.isArray(purchaseReturnList) ? purchaseReturnList : []);

    return (list || []).find((r: any) => String(r.id) === String(editId)) || null;
  }, [location, purchaseReturnList]);

  useEffect(() => {
    const rec: any = (location as any)?.state?.record;
    const currentId = String(purchaseOrderId || rec?.purchaseOrderId || '');
    if (!currentId) { 
      console.log('FetchPOById: No currentId');
      setPoById(null); 
      return; 
    }

    const filtered = Array.isArray(filteredPOs) ? filteredPOs : [];
    const globalList = Array.isArray((purchaseOrderList as any)?.data)
      ? (purchaseOrderList as any).data
      : ((purchaseOrderList as any) || []);

    const existsWithLabel = [...filtered, ...globalList].some((po: any) =>
      String(po.id) === currentId && String(po.poNo || '') !== ''
    );
    if (existsWithLabel) { 
      console.log('FetchPOById: PO already exists in lists with label');
      setPoById(null); 
      return; 
    }

    (async () => {
      try {
        const endpoint = selectedCompanyId
          ? `/purchase-orders/company/${selectedCompanyId}/${Number(currentId)}`
          : `/purchase-orders/${Number(currentId)}`;
        console.log(`FetchPOById: Fetching from ${endpoint}`);
        const res: any = await apiService.get(endpoint);
        console.log('FetchPOById: Received response:', res);
        const po = Array.isArray(res?.data) ? res.data[0] : (res?.data || res);
        if (po?.id) {
          console.log('FetchPOById: Setting poById:', po);
          setPoById(po);
        }
      } catch (err) {
        console.error('FetchPOById: Failed', err);
      }
    })();
  }, [purchaseOrderId, filteredPOs, purchaseOrderList, location, selectedCompanyId]);

  const poOptions = useMemo(() => {
    const rec: any = (location as any)?.state?.record;
    const currentId = String(purchaseOrderId || rec?.purchaseOrderId || '');

    console.log('poOptions - currentId:', currentId, 'filteredPOs count:', filteredPOs?.length);

    let options = [...(filteredPOs || [])];

    // If we're in edit mode and have a current ID, ensure it's in the options
    if (rec?.id && currentId && currentId !== '') {
      const isCurrentInOptions = options.some(po => String(po.id) === currentId);

      if (!isCurrentInOptions) {
        console.log('Current PO not in filtered list, searching globally...');

        // Search in global purchase order list
        const globalList = Array.isArray((purchaseOrderList as any)?.data)
          ? (purchaseOrderList as any).data
          : ((purchaseOrderList as any) || []);

        const missingPO = globalList.find((po: any) => String(po.id) === currentId);

        if (missingPO) {
          console.log('Found missing PO in global list:', missingPO);
          options = [missingPO, ...options];
        } else {
          // Last resort: create synthetic option
          console.log('Creating synthetic PO option for ID:', currentId);
          const syntheticPO = {
            id: currentId,
            poNo: rec?.poNo || `PO-${currentId}`,
            vendorId: rec?.vendorId
          };
          options = [syntheticPO, ...options];
        }
      }
    }

    console.log('Final poOptions count:', options.length);
    return options;
  }, [filteredPOs, purchaseOrderList, purchaseOrderId, location]);

  return (
    <div className="p-6 pt-16 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/transaction/purchase-return-details")}
            className="mr-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold flex items-center gap-2"> Purchase Return / GRN Return</h1>
        </div>

       
      </div>

      <Card className='bg-white'>
        <CardHeader>
          <CardTitle>Return Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>

              <label className="block text-sm mb-1">Return No</label>

              <input type="text"
                className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                  !watch('returnNo') || watch('returnNo')?.startsWith('Loading')
                    ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                    : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                }`}
                placeholder="Loading sequence..."
                {...register('returnNo')} readOnly />

            </div>
            <div>
              <label className="block text-sm mb-1">Return Date</label>
              <input type="date" className="w-full border px-3 py-2 rounded"
                {...register('returnDate', { required: true })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Purchase Type</label>
              <CommonSearchableSelect
                {...register('purchaseType', { required: true })}
                value={watch('purchaseType')}
                onValueChange={(val) => {
                  setValue('purchaseType', val as any);
                  setValue('vendorId', '');
                  setValue('purchaseOrderId', '');
                  setYarnRows([]);
                  setFabricRows([]);
                  setItemRows([]);
                  setYarnPopupRows([]);
                  setFabricPopupRows([]);
                  setItemPopupRows([]);
                }}
              >
                <option value="">Select</option>
                {(Array.isArray(purchaseOrderTypeList) ? purchaseOrderTypeList : purchaseOrderTypeList?.data || []).map((pt: any) => {
                  const name = (pt?.poTypeName || pt?.typeName || pt?.name || '').toLowerCase();
                  let value = '';
                  if (name.includes('yarn')) value = 'yarn';
                  else if (name.includes('fabric')) value = 'fabric';
                  else if (name.includes('knit')) value = 'knitted';
                  else if (name.includes('item')) value = 'item';
                  return value ? <option key={pt.id} value={value}>{pt?.poTypeName || pt?.typeName || pt?.name || 'Unknown'}</option> : null;
                })}
              </CommonSearchableSelect>
            </div>
            <div>
              <label className="block text-sm mb-1">Vendor Name</label>
              <CommonSearchableSelect
                {...register('vendorId', { required: true })}
                value={watch('vendorId')}
                onValueChange={(val) => {
                  setValue('vendorId', val);
                  setValue('purchaseOrderId', '');
                  setYarnRows([]);
                  setFabricRows([]);
                  setItemRows([]);
                  setYarnPopupRows([]);
                  setFabricPopupRows([]);
                  setItemPopupRows([]);
                }}
              >
                <option value="">Select</option>
                {(filteredVendors || []).map((v: any) => (
                  <option key={v.id} value={v.id}>{v.vendorName}</option>
                ))}
              </CommonSearchableSelect>
            </div>
            <div>
              <label className="block text-sm mb-1">Purchase Order No</label>
              <CommonSearchableSelect
                {...register('purchaseOrderId', { required: true })}
                value={watch('purchaseOrderId')}
                onValueChange={(val) => {
                  setValue('purchaseOrderId', val, { shouldValidate: true, shouldDirty: true });
                  setYarnRows([]);
                  setFabricRows([]);
                  setItemRows([]);
                  setYarnPopupRows([]);
                  setFabricPopupRows([]);
                  setItemPopupRows([]);
                  setIsYarnDialogOpen(false);
                  setIsFabricDialogOpen(false);
                  setIsItemDialogOpen(false);
                }}
              >
                <option value="">Select Purchase Order No</option>
                {(poOptions || []).map((po: any) => (
                  <option key={po.id} value={po.id}>{po.poNo || `PO-${po.id}`}</option>
                ))}
              </CommonSearchableSelect>
            </div>
            <div>
              <label className="block text-sm mb-1">Gross Wt</label>
              <input
                type="number"
                step="0.001"
                className="w-full border px-3 py-2 rounded"
                {...register('grossWt')}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Vehicle No</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                {...register('vehicleNo')}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Transport Name</label>
              <CommonSearchableSelect
                {...register('transportId')}
                value={watch('transportId')}
                onValueChange={(val) => setValue('transportId', val)}
              >
                <option value="">Select Transport</option>
                {(transportList || []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.transportName}</option>
                ))}
              </CommonSearchableSelect>
            </div>
            <div>
              <label className="block text-sm mb-1">Remark</label>
              <textarea
                className="w-full border px-3 py-2 rounded"
                rows={1}
                {...register('remark')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional tables */}
      {purchaseType === 'yarn' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <ClipboardList size={20} /> Item Return - Yarn Entry
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={refreshQuantities}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Refresh Quantities
                  </Button>
                  <Button onClick={openYarnDialog}>Select Return Yarn Item</Button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Sl.No</th>
                      <th className="border p-2">Yarn Name</th>
                      <th className="border p-2">Mill Name</th>
                      {/* <th className="border p-2">Purchase Inward No</th> */}
                      {/* <th className="border p-2">Available Bags</th>
                      <th className="border p-2">Kgs/Bag</th> */}
                      <th className="border p-2">Rejected Quantity</th>
                      <th className="border p-2">Return Quantity</th>
                      <th className="border p-2">Rate/Unit</th>
                      <th className="border p-2">GST Amount</th>
                      <th className="border p-2">Total Amount</th>
                      <th className="border p-2">Lot No</th>
                      <th className="border p-2">Warehouse</th>
                      <th className="border p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yarnRows.length > 0 ? (
                      yarnRows.map((row, idx) => (
                        <tr key={idx} className="border hover:bg-gray-50">
                          <td className="border p-2">{idx + 1}</td>
                          <td className="border p-2 text-center">
                            {row.yarnName || row.yarnId || '-'}
                          </td>
                          <td className="border p-2 text-center">
                            {row.millName || 'N/A'}
                          </td>
                          {/* <td className="border p-2 text-center">
                            {row.purchaseInwardNo || 'N/A'}
                          </td> */}
                          {/* <td className="border p-2 text-center">
                            <input
                              type="text"
                              className="border px-2 py-1 rounded w-full text-center bg-gray-50"
                              value={row.availableBags ?? ""}
                              readOnly
                            />
                          </td>
                          <td className="border p-2 text-center">
                            <input
                              type="text"
                              className="border px-2 py-1 rounded w-full text-center bg-gray-50"
                              value={row.kgsPerBag ?? ""}
                              readOnly
                            />
                          </td> */}
                          <td className="border p-2">
                            <input
                              type="number"
                              className="border px-2 py-1 rounded w-full text-center font-semibold"
                              value={row.rejectedQty ?? ""}
                              readOnly
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              className="border px-2 py-1 rounded w-full text-center"
                              value={row.returnQuantity ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const rejected = Number(row.rejectedQty || 0);
                                if (!isNaN(rejected) && rejected > 0 && Number(val) > rejected) {
                                  toast.error(`Return Qty cannot exceed Rejected Qty (${rejected}).`);
                                  setYarnRows((prev) =>
                                    prev.map((r, i) => (i === idx ? recalcYarnEntry({ ...r, returnQuantity: String(rejected) }) : r))
                                  );
                                } else {
                                  setYarnRows((prev) =>
                                    prev.map((r, i) => (i === idx ? recalcYarnEntry({ ...r, returnQuantity: val }) : r))
                                  );
                                }
                              }}
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              className="border px-2 py-1 rounded w-full text-center bg-gray-50"
                              value={row.ratePerUnit || ""}
                              readOnly
                              placeholder="0.00"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              className="border px-2 py-1 rounded w-full text-center bg-gray-50"
                              value={row.gstAmount || ""}
                              readOnly
                              placeholder="0.00"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              className="border px-2 py-1 rounded w-full text-center bg-gray-50"
                              value={row.totalAmount || ""}
                              readOnly
                              placeholder="0.00"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="text"
                              className="border px-2 py-1 rounded w-full text-center"
                              value={row.lotNo || ""}
                              onChange={(e) =>
                                setYarnRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, lotNo: e.target.value } : r))
                                )
                              }
                              readOnly
                            />
                          </td>
                          <td className="border p-2">
                            {(() => {
                              const w = Array.isArray(warehouseList)
                                ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId))
                                : undefined;
                              const name = w?.warehouseName || row.warehouseId || '';
                              return (
                                <input
                                  type="text"
                                  className="border px-2 py-1 rounded w-full text-center"
                                  value={name}
                                  readOnly
                                />
                              );
                            })()}
                          </td>
                          <td className="border p-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeYarnRow(idx)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={13} className="p-4 text-gray-500 italic">
                          No items added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={20} /> Summary (Yarn)
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Sl.No</th>
                      <th className="border p-2">Yarn Name</th>
                      <th className="border p-2">Mill Name</th>
                      <th className="border p-2">Total Quantity </th>
                    </tr>
                  </thead>
                  <tbody>
                    {yarnRows.map((r, i) => (
                      <tr key={i} className="border">
                        <td className="border p-2">{i + 1}</td>
                        <td className="border p-2">{r.yarnName || '-'}</td>
                        <td className="border p-2">{r.millName || 'N/A'}</td>
                        <td className="border p-2">{Number(r.returnQuantity || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {(purchaseType === 'fabric' || purchaseType === 'knitted') && (
        <>
          <Card className='bg-white'>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <ClipboardList size={20} /> Item Return - Fabric Entry
                </span>
                <Button onClick={openFabricDialog}>Select Return Fabric Item</Button>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Sl.No</th>
                      <th className="border p-2">Sort No - Construction</th>
                      <th className="border p-2">Piece No</th>
                      <th className="border p-2">Piece Meter</th>
                      <th className="border p-2">Net Weight</th>
                      <th className="border p-2">Warehouse</th>
                      <th className="border p-2">Return Quantity (pcs/meters)</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fabricRows.map((row, idx) => (
                      <tr key={idx} className="border">
                        <td className="border p-2">{idx + 1}</td>
                        <td className="border p-2">
                          <select
                            className="border px-2 py-1 rounded w-full"
                            value={row.fabricMasterId || ""}
                            onChange={(e) => {
                              const id = e.target.value;
                              const item = (fabricItemsByPO || []).find(
                                (i: any) => String(i.fabricMasterId) === String(id)
                              );
                              setFabricRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx
                                    ? {
                                      ...r,
                                      fabricMasterId: id,
                                      fabricCode: item?.fabricCode,
                                      quality: item?.quality,
                                    }
                                    : r
                                )
                              );
                            }}
                          >
                            <option value="">Select</option>
                            {(fabricItemsByPO || []).map((it: any, i: number) => (
                              <option key={i} value={it.fabricMasterId}>
                                {it.fabricCode && it.quality
                                  ? `${it.fabricCode} - ${it.quality}`
                                  : it.fabricMasterId}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="border p-2">
                          <input
                            type="text"
                            className="border px-2 py-1 rounded w-full"
                            value={row.pieceNo || ""}
                            onChange={(e) =>
                              setFabricRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, pieceNo: e.target.value } : r
                                )
                              )
                            }
                            readOnly
                          />
                        </td>

                        <td className="border p-2">
                          <input
                            type="text"
                            className="border px-2 py-1 rounded w-full"
                            value={row.pieceMeter || ""}
                            readOnly
                            onChange={(e) =>
                              setFabricRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, pieceMeter: e.target.value } : r
                                )
                              )
                            }
                          />
                        </td>

                        <td className="border p-2">
                          <input
                            type="text"
                            className="border px-2 py-1 rounded w-full"
                            value={row.netWeight || ""}
                            onChange={(e) =>
                              setFabricRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, netWeight: e.target.value } : r
                                )
                              )
                            }
                          />
                        </td>

                        <td className="border p-2">
                          {(() => {
                            const w = Array.isArray(warehouseList)
                              ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId))
                              : undefined;
                            const name = w?.warehouseName || row.warehouseId || '';
                            return (
                              <input
                                type="text"
                                className="border px-2 py-1 rounded w-full"
                                value={name}
                                readOnly
                              />
                            );
                          })()}
                        </td>

                        <td className="border p-2">
                          <input
                            type="number"
                            className="border px-2 py-1 rounded w-full"
                            value={row.returnQuantity || ""}
                            onChange={(e) =>
                              setFabricRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, returnQuantity: e.target.value } : r
                                )
                              )
                            }
                          />
                        </td>

                        <td className="border p-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFabricRow(idx)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="mt-4 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={20} /> Summary (Fabric)
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Sl.No</th>
                      <th className="border p-2">Sort No - Construction</th>
                      <th className="border p-2">Total Pieces</th>
                      <th className="border p-2">Total Meters</th>
                      <th className="border p-2">Total Net Weight</th>
                    </tr>
                  </thead>

                  <tbody>
                    {fabricSummary.map((s, i) => (
                      <tr key={`${s.fabricCode}-${s.quality}-${i}`} className="border">
                        <td className="border p-2">{i + 1}</td>
                        <td className="border p-2">
                          {(s.fabricCode || "-")} - {(s.quality || "-")}
                        </td>
                        <td className="border p-2">{s.totalPieces}</td>
                        <td className="border p-2">{s.totalMeters}</td>
                        <td className="border p-2">{s.totalNetWeight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </>
      )}

      {purchaseType === 'item' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <ClipboardList size={20} /> Item Return - Item Entry
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={refreshQuantities}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Refresh Quantities
                  </Button>
                  <Button onClick={openItemDialog}>Select Return Item</Button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Sl.No</th>
                      <th className="border p-2">Item Name</th>
                      <th className="border p-2">Rejected Quantity</th>
                      <th className="border p-2">Return Quantity</th>
                      <th className="border p-2">Warehouse</th>
                      <th className="border p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemRows.length > 0 ? (
                      itemRows.map((row, idx) => (
                        <tr key={idx} className="border hover:bg-gray-50">
                          <td className="border p-2">{idx + 1}</td>
                          <td className="border p-2">{row.itemName}</td>
                          <td className="border p-2">
                            <input
                              type="number"
                              className="border px-2 py-1 rounded w-full text-center font-semibold text-green-700 bg-gray-50"
                              value={row.rejectedQty ?? ""}
                              readOnly
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              className="border px-2 py-1 rounded w-full text-center"
                              value={row.returnQuantity ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const rejected = Number(row.rejectedQty || 0);
                                if (!isNaN(rejected) && rejected > 0 && Number(val) > rejected) {
                                  toast.error(`Return Qty cannot exceed Rejected Qty (${rejected}).`);
                                  setItemRows((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, returnQuantity: String(rejected) } : r))
                                  );
                                } else {
                                  setItemRows((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, returnQuantity: val } : r))
                                  );
                                }
                              }}
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="text"
                              className="border px-2 py-1 rounded w-full text-center"
                              value={row.warehouseName || (Array.isArray(warehouseList) ? warehouseList.find((wh: any) => String(wh.id) === String(row.warehouseId))?.warehouseName : '') || row.warehouseId || ''}
                              readOnly
                            />
                          </td>
                          <td className="border p-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setItemRows(prev => prev.filter((_, i) => i !== idx))}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-gray-500 italic">
                          No items added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={20} /> Summary (Item)
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Sl.No</th>
                      <th className="border p-2">Item Name</th>
                      <th className="border p-2">Total Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const summaryMap = new Map();
                      itemRows.forEach(row => {
                        const key = row.itemId;
                        const current = summaryMap.get(key) || { itemName: row.itemName, totalQuantity: 0 };
                        current.totalQuantity += Number(row.returnQuantity || 0);
                        summaryMap.set(key, current);
                      });
                      return Array.from(summaryMap.values()).map((s, i) => (
                        <tr key={i} className="border">
                          <td className="border p-2">{i + 1}</td>
                          <td className="border p-2">{s.itemName || '-'}</td>
                          <td className="border p-2">{s.totalQuantity}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          
        </>
      )}

 <div className="flex justify-end mt-4">

          <Button onClick={handleSubmit(onSubmit)}>{watch('id') ? 'Update' : 'Save'}</Button>
        </div>
      {/* Yarn Selection Dialog with Real-time Quantities */}
      <Dialog open={isYarnDialogOpen} onOpenChange={setIsYarnDialogOpen}>
        <DialogContent className="max-w-[95vw] w-fit">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Select Return Yarn Item - PO: {selectedPONumber || 'N/A'} (Real-time Quantities)
              <Button
                variant="outline"
                size="sm"
                onClick={refreshQuantities}
                className="flex items-center gap-1"
              >
                <RefreshCw size={14} />
                Refresh
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <PopupDataTable
              columns={yarnColumns}
              data={yarnPopupRows}
              emptyMessage={
                yarnPopupRows.length === 0
                  ? 'No yarn lots available. Select Purchase Order.'
                  : 'No yarn lots match your search.'
              }
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsYarnDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmYarnDialog}>Add Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fabric Selection Dialog */}
      <Dialog open={isFabricDialogOpen} onOpenChange={setIsFabricDialogOpen}>
        <DialogContent className="max-w-[95vw] w-fit">
          <DialogHeader>
            <DialogTitle>Select Return Fabric Item</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <PopupDataTable
              columns={fabricColumns}
              data={fabricPopupRows}
              emptyMessage={
                fabricPopupRows.length === 0
                  ? 'No fabric pieces available. Select Purchase Order and Item; only un-packed pieces are shown.'
                  : 'No fabric rows match your search.'
              }
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsFabricDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmFabricDialog}>Add Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Selection Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-[95vw] w-fit">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Select Return Item - PO: {selectedPONumber || 'N/A'}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshQuantities}
                className="flex items-center gap-1"
              >
                <RefreshCw size={14} />
                Refresh
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <PopupDataTable
              columns={itemColumns}
              data={itemPopupRows}
              emptyMessage={
                itemPopupRows.length === 0
                  ? 'No items available. Ensure Vendor and Purchase Order are selected.'
                  : 'No item rows match your search.'
              }
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmItemDialog}>Add Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}