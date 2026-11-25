// // StockTransferDetails.tsx
// import React, { useEffect, useState, useMemo, useRef } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { ArrowLeft, Save, X, Edit, Trash2 } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Modal } from '@/components/ui/Modal';
// import { AppDispatch, RootState } from '@/state/store';
// import {
//     createStockTransfer,
//     updateStockTransfer,
//     addFabricItemManual,
//     addYarnItemManual,
//     clearSelectedItems,
//     removeFromSelectedItems,
//     StockTransfer
// } from '@/state/stockTransferSlice';
// import { getAllStockTransfers } from '@/state/stockTransferSlice';
// import { getAllWarehouse } from '@/state/warehouseSlice';
// import { getAllFabricMasters } from '@/state/fabricMasterSlice';
// import { getAllYarnMasters } from '@/state/yarnSlice';
// import { getFactoryPieceEntriesByCompany } from '@/state/factoryPieceEntrySlice';
// import { getAllSubCategories } from '@/state/subCategorySlice';
// import apiService from '@/services/ApiService';
// import { useResolvedCompanyId } from '@/hooks/useCompanyContext';
// import { useForm } from 'react-hook-form';
// import documentNumberService from '@/services/DocumentNumberService';
// import { toast } from 'react-toastify';

// const buildYarnInwardStockUrl = (itemId: string | number) => {
//     const params: string[] = [];
//     const normalized = itemId != null ? String(itemId).trim() : "";
//     if (normalized) {
//         params.push(`itemId=${normalized}`);
//     }
//     const companyId = resolveCompanyId();
//     if (companyId !== null) {
//         params.push(`companyId=${companyId}`);
//     }
//     return params.length
//         ? `/sizing-yarn-issues/yarn-inward-stock?${params.join("&")}`
//         : `/sizing-yarn-issues/yarn-inward-stock`;
// };

// export default function StockTransferDetails() {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const dispatch = useDispatch<AppDispatch>();

//     // Get data from Redux store
//     const warehouseList = useSelector((state: RootState) => state.warehouse.warehouseList || []);
//     const fabricMasterList = useSelector((state: RootState) => state.fabricMaster.fabricMasterList || []);
//     const yarnMasterList = useSelector((state: RootState) => (state.yarn.yarnList || []));
//     const { selectedItems, saving } = useSelector((state: RootState) => state.StockTransfer);
//     const factoryPieceEntries = useSelector((state: RootState) => (state as any).factoryPieceEntry?.list || []);

//     const subCategoryList = useSelector((state: RootState) => (state as any).subCategory?.subCategoryList || []);

//     const existingTransfer: any = location.state?.stockTransfer as StockTransfer | undefined;

//     // Form state
//     const [formData, setFormData] = useState({
//         transferDate: new Date().toISOString().split('T')[0],
//         fromGodown: '',
//         toGodown: '',
//         goodsType: 'Fabric' as 'Fabric' | 'Yarn',
//         itemName: '',
//         // editNote: '',
//     });

//     const pieceEntryList = useMemo(() => {
//         const entries = Array.isArray(factoryPieceEntries) ? factoryPieceEntries : [];
//         return entries.filter((entry: any) => {
//             if (Number(entry?.isInspected) !== 1) {
//                 return false;
//             }
//             if (Number(entry?.isDispatched) !== 0) {
//                 return false;
//             }
//             if (Number(entry?.isParentPiece) !== 0) {
//                 return false;
//             }
//             const stockTransferFlag = entry?.isStockTransfer;
//             if (stockTransferFlag !== undefined && stockTransferFlag !== null) {
//                 const normalized = typeof stockTransferFlag === 'string'
//                     ? stockTransferFlag.trim().toLowerCase()
//                     : stockTransferFlag;
//                 if (
//                     normalized === true ||
//                     normalized === 1 ||
//                     normalized === '1' ||
//                     normalized === 'true'
//                 ) {
//                     return false;
//                 }
//             }
//             if (formData.fromGodown && entry?.warehouseId != null) {
//                 if (String(entry.warehouseId) !== String(formData.fromGodown)) {
//                     return false;
//                 }
//             }
//             return true;
//         });
//     }, [factoryPieceEntries, formData.fromGodown]);

//     const { register, handleSubmit, setValue, formState: { errors } } = useForm({
//         defaultValues: {
//             stockTransferNo: '',
//             editNote: existingTransfer?.editNote || '',
//         }
//     });

//     const isSavingRef = useRef(false);
//     const hasGeneratedNumberRef = useRef(false);

//     useEffect(() => {
//         const generateDocumentNumber = async () => {
//             if (existingTransfer || hasGeneratedNumberRef.current) {
//                 return;
//             }

//             try {
//                 const result = await documentNumberService.generateDocumentNumber({
//                     screenName: 'Stock Transfer'
//                 });
//                 setValue('stockTransferNo', result.documentNumber, { shouldValidate: true });
//                 hasGeneratedNumberRef.current = true;
//             } catch (error) {
//                 console.error('Failed to generate Stock Transfer number:', error);
//                 toast.error('Failed to generate Stock Transfer number');
//             }
//         };

//         generateDocumentNumber();
//     }, [existingTransfer, setValue]);

//     // Cleanup document number cache if not saved
//     useEffect(() => {

//         const handleBeforeUnload = (e: BeforeUnloadEvent) => {
//             if (hasGeneratedNumberRef.current && !isSavingRef.current && !existingTransfer) {
//                 documentNumberService.clearMemoryCache('Stock Transfer');
//             }
//         };

//         window.addEventListener('beforeunload', handleBeforeUnload);

//         return () => {
//             window.removeEventListener('beforeunload', handleBeforeUnload);
//             if (hasGeneratedNumberRef.current && !isSavingRef.current && !existingTransfer) {
//                 documentNumberService.clearMemoryCache('Stock Transfer');
//             }
//         };
//     }, [existingTransfer]);

//     useEffect(() => {
//         setValue('stockTransferNo', existingTransfer?.stockTransferNo || '');
//     }, [existingTransfer, setValue]);

//     // Modal state for items
//     const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
//     const [modalSelectedRows, setModalSelectedRows] = useState<number[]>([]);
//     const [formErrors, setFormErrors] = useState<Record<string, string>>({});

//     // Validation detail modal state
//     const [isValidationDetailOpen, setIsValidationDetailOpen] = useState(false);
//     const [selectedValidationItem, setSelectedValidationItem] = useState<any>(null);

//     // Yarn inward stock state
//     const [yarnInwardStockData, setYarnInwardStockData] = useState<any[]>([]);
//     const [loadingYarnStock, setLoadingYarnStock] = useState(false);
//     const [inwardNumberMap, setInwardNumberMap] = useState<Record<number, string>>({}); // Map of inwardId to inwardNo

//     // Issued Qty state for yarn items
//     const [issuedQtyMap, setIssuedQtyMap] = useState<Record<string | number, number>>({});
//     const [editingIdx, setEditingIdx] = useState<number | null>(null);
//     const [isGlobalEditing, setIsGlobalEditing] = useState(false);

//     // For dynamic item name dropdown
//     const itemNameOptions: { value: string | number, label: string }[] =
//         formData.goodsType === 'Fabric'
//             ? (Array.isArray(fabricMasterList) ? fabricMasterList : []).map((f: any) => ({
//                 value: f.id,
//                 label: [f.fabricCode, f.fabricQuality, f.quality, f.name].filter(Boolean).join(' - ')
//             }))
//             : (Array.isArray(yarnMasterList) ? yarnMasterList : []).map((y: any) => ({
//                 value: y.id,
//                 label: [y.yarnName, y.millName, y.name].filter(Boolean).join(' - ')
//             }));

//     // Get all roll/bale packings from Redux
//     const baleRollPackingList = useSelector((state: RootState) => state.baleRollPacking?.list || []);

//     // Create a validation map from piece entries with dispatch/pack status for quick lookup
//     const pieceEntryMap = useMemo(() => {
//         const map = new Map<string, { isDispatched: number; isPacked: number }>();
//         if (Array.isArray(pieceEntryList)) {
//             pieceEntryList.forEach((entry: any) => {
//                 if (entry.pieceNumber) {
//                     map.set(entry.pieceNumber, {
//                         isDispatched: entry.isDispatched || 0,
//                         isPacked: entry.isPacked || 0
//                     });
//                 }
//             });
//         }
//         return map;
//     }, [pieceEntryList]);

//     const packedPieceRollMap = useMemo(() => {
//         const map = new Map<string, string>();
//         const packings = Array.isArray(baleRollPackingList) ? baleRollPackingList : [];
//         packings.forEach((packing: any) => {
//             const rollNumber = packing?.rollOrBaleNo || "Not BaleRolled";
//             (packing?.items || []).forEach((item: any) => {
//                 if (item?.pieceId != null) {
//                     map.set(`ID:${item.pieceId}`, rollNumber);
//                 }
//                 if (item?.pieceNo) {
//                     map.set(`PN:${item.pieceNo}`, rollNumber);
//                 }
//             });
//         });
//         return map;
//     }, [baleRollPackingList]);

//     const displayedSelectedItems = useMemo(() => {
//         if (formData.goodsType !== 'Yarn') {
//             return selectedItems;
//         }
//         return selectedItems.map((item: any) => {
//             const kgsPerBag = Number(item.kgsPerBag ?? item.kgPerBag ?? 0);
//             const conesPerBag = Number(item.conesPerBag ?? item.noOfConesPerBag ?? 0);
//             const conesWeight = item.conesWeight != null
//                 ? Number(item.conesWeight)
//                 : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);
//             const totalQuantity = item.totalQuantity != null
//                 ? Number(item.totalQuantity)
//                 : Number(((item.noOfBags || 0) * kgsPerBag).toFixed(3));
//             return {
//                 ...item,
//                 kgPerBag: kgsPerBag,
//                 kgsPerBag,
//                 conesPerBag,
//                 conesWeight,
//                 totalQuantity
//             };
//         });
//     }, [selectedItems, formData.goodsType]);

//     const handleDeleteItem = (slNo: number, idx: number) => {
//         dispatch(removeFromSelectedItems(slNo));
//         // Update issuedQtyMap to account for shifted indices
//         const newMap: Record<number, number> = {};
//         Object.keys(issuedQtyMap).forEach(key => {
//             const k = parseInt(key);
//             if (k < idx) {
//                 newMap[k] = issuedQtyMap[k];
//             } else if (k > idx) {
//                 newMap[k - 1] = issuedQtyMap[k];
//             }
//         });
//         setIssuedQtyMap(newMap);
//         if (editingIdx === idx) {
//             setEditingIdx(null);
//         } else if (editingIdx !== null && editingIdx > idx) {
//             setEditingIdx(editingIdx - 1);
//         }
//     };

//     // Filtered warehouse list for To Godown dropdown
//     const filteredToGodownOptions = useMemo(() => {
//         return warehouseList.filter((warehouse: any) => {
//             // If fromGodown is selected, exclude it from toGodown options
//             if (formData.fromGodown && String(warehouse.id) === String(formData.fromGodown)) {
//                 return false;
//             }
//             return true;
//         });
//     }, [warehouseList, formData.fromGodown]);

//     // Table data for modal
//     // const modalTableData = useMemo(() => {
//     //     if (formData.goodsType === 'Fabric' && formData.itemName) {
//     //         const relevantPackings = baleRollPackingList.filter((packing: any) =>
//     //             String(packing.fabricCodeId) === String(formData.itemName)
//     //         );

//     //         if (relevantPackings.length > 0) {
//     //             // Use data from bale-roll-packing API with roll numbers
//     //             return relevantPackings.flatMap((packing: any) =>
//     //                 (packing.items || []).map((item: any) => {
//     //                     return {
//     //                         id: item.id,
//     //                         rollNo: packing.rollOrBaleNo,
//     //                         packingType: packing.packingType,
//     //                         pieceNo: item.pieceNo,
//     //                         meter: item.meters,
//     //                         netWeight: item.netWeight,
//     //                         avgWeight: item.avgWeight,
//     //                         grossWeight: item.grossWeight,
//     //                         fabricCodeId: packing.fabricCodeId,
//     //                         packingId: packing.id,
//     //                         isDisabled: false,
//     //                         dataSource: 'packing'
//     //                     };
//     //                 })
//     //             );
//     //         } else {
//     //             // Fallback to piece entry data when no packing data exists
//     //             const filteredPieces = pieceEntryList.filter((entry: any) =>
//     //                 String(entry.fabricMasterId) === String(formData.itemName) &&
//     //                 !(entry.isDispatched === 1 && entry.isPacked === 1)
//     //             );

//     //             return filteredPieces.map((entry: any) => ({
//     //                 id: entry.id,
//     //                 rollNo: '',
//     //                 packingType: '',
//     //                 pieceNo: entry.pieceNumber,
//     //                 meter: entry.quantity || entry.inspectedMtr || 0,
//     //                 netWeight: entry.weight || entry.inspectedNtWt || 0,
//     //                 avgWeight: entry.inspectedAvgWt || 0,
//     //                 grossWeight: 0,
//     //                 fabricCodeId: entry.fabricMasterId,
//     //                 packingId: entry.packingId || null,
//     //                 isDispatched: entry.isDispatched,
//     //                 isPacked: entry.isPacked,
//     //                 isDisabled: false,
//     //                 dataSource: 'piece'
//     //             }));
//     //         }
//     //     } else if (formData.goodsType === 'Yarn' && formData.itemName) {
//     //         // Use yarn inward stock data if available
//     //         if (yarnInwardStockData && yarnInwardStockData.length > 0) {
//     //             return yarnInwardStockData.map((stock: any) => {
//     //                 const millName = subCategoryList.find((sc: any) => String(sc.id) === String(stock.millId))?.subCategoryName || stock.millId || '';
//     //                 return {
//     //                     id: stock.orderItemId || stock.id,
//     //                     inwardId: Number(stock.inwardId),
//     //                     inwardNo: stock.inwardNo || stock.inwardId,
//     //                     millName: millName,
//     //                     lotNo: stock.lotNo || 'N/A',
//     //                     noOfBags: stock.availableBags || 0,
//     //                     kgPerBag: stock.kgsPerBag || 0,
//     //                     totalQuantity: stock.availableQty || 0,
//     //                     availableQty: stock.availableQty || 0,
//     //                     acceptedQty: stock.acceptedQty || 0,
//     //                     warehouseId: stock.warehouseId,
//     //                     orderItemId: stock.orderItemId,
//     //                     validationStatus: 'Valid',
//     //                     isValidPiece: true,
//     //                     dataSource: 'yarnStock'
//     //                 };
//     //             });
//     //         }
//     //         return [];
//     //     }
//     //     return [];
//     // }, [formData.goodsType, formData.itemName, yarnInwardStockData, subCategoryList, baleRollPackingList, pieceEntryMap, pieceEntryList, inwardNumberMap]);
//     const modalTableData = useMemo(() => {
//         if (formData.goodsType === 'Fabric' && formData.itemName) {
//             const relevantPackings = baleRollPackingList.filter((packing: any) => {
//                 const isFabricMatch = String(packing.fabricCodeId) === String(formData.itemName);
//                 const isWarehouseMatch = formData.fromGodown
//                     ? String(packing.warehouseId || packing.godownId) === String(formData.fromGodown)
//                     : true;
//                 return isFabricMatch && isWarehouseMatch;
//             });

//             if (relevantPackings.length > 0) {
//                 // Use data from bale-roll-packing API with roll numbers
//                 return relevantPackings.flatMap((packing: any) =>
//                     (packing.items || []).map((item: any) => {
//                         return {
//                             id: item.id,
//                             rollNo: packing.rollOrBaleNo,
//                             packingType: packing.packingType,
//                             pieceNo: item.pieceNo,
//                             meter: item.meters,
//                             netWeight: item.netWeight,
//                             avgWeight: item.avgWeight,
//                             grossWeight: item.grossWeight,
//                             fabricCodeId: packing.fabricCodeId,
//                             packingId: packing.id,
//                             isDisabled: false,
//                             dataSource: 'packing'
//                         };
//                     })
//                 );
//             } else {
//                 // Fallback to piece entry data with the specified conditions
//                 const filteredPieces = pieceEntryList.filter((entry: any) => {
//                     // Condition 1: fabricMasterId matches selected item
//                     if (String(entry.fabricMasterId) !== String(formData.itemName)) {
//                         return false;
//                     }

//                     // Condition 2: isInspected must be 1
//                     if (Number(entry.isInspected) !== 1) {
//                         return false;
//                     }

//                     // Condition 3: isDispatched must be 0
//                     if (Number(entry.isDispatched) !== 0) {
//                         return false;
//                     }

//                     // Condition 4: isParentPiece must be 0
//                     if (Number(entry.isParentPiece) !== 0) {
//                         return false;
//                     }

//                     // Condition 5: isStockTransfer must be false/0 when provided
//                     if (entry.isStockTransfer !== undefined && entry.isStockTransfer !== null) {
//                         const normalizedStockTransfer = typeof entry.isStockTransfer === 'string'
//                             ? entry.isStockTransfer.trim().toLowerCase()
//                             : entry.isStockTransfer;
//                         if (
//                             normalizedStockTransfer === true ||
//                             normalizedStockTransfer === 1 ||
//                             normalizedStockTransfer === '1' ||
//                             normalizedStockTransfer === 'true'
//                         ) {
//                             return false;
//                         }
//                     }

//                     // Condition 6: warehouseId should match fromGodown if both exist
//                     if (formData.fromGodown && entry.warehouseId) {
//                         if (String(entry.warehouseId) !== String(formData.fromGodown)) {
//                             return false;
//                         }
//                     }

//                     // Condition 7: Additional fabric code match if available
//                     if (entry.fabricCode && formData.itemName) {
//                         // You might need to compare with fabricCode if that's what you mean
//                         // This depends on your data structure
//                     }

//                     // Condition 7: Should not be both dispatched AND packed
//                     // This is already covered by isDispatched = 0 condition

//                     return true;
//                 });

//                 return filteredPieces.map((entry: any) => {
//                     const isPackedPiece = Number(entry.isPacked) === 1;
//                     const rollLookupKeys = [
//                         entry.id != null ? `ID:${entry.id}` : null,
//                         entry.pieceId != null ? `ID:${entry.pieceId}` : null,
//                         entry.pieceNumber ? `PN:${entry.pieceNumber}` : null
//                     ].filter((key): key is string => Boolean(key));
//                     let packedRollNumber: string | undefined;
//                     for (const key of rollLookupKeys) {
//                         const found = packedPieceRollMap.get(key);
//                         if (found) {
//                             packedRollNumber = found;
//                             break;
//                         }
//                     }
//                     const rollNoValue = isPackedPiece
//                         ? packedRollNumber || "Not BaleRolled"
//                         : entry.rollNo || '';

//                     return {
//                         id: entry.id,
//                         rollNo: rollNoValue,
//                         packingType: entry.packingType || '',
//                         pieceNo: entry.pieceNumber,
//                         meter: entry.quantity || entry.inspectedMtr || 0,
//                         netWeight: entry.weight || entry.inspectedNtWt || 0,
//                         avgWeight: entry.inspectedAvgWt || 0,
//                         grossWeight: 0,
//                         fabricCodeId: entry.fabricMasterId,
//                         packingId: entry.packingId || null,
//                         isDispatched: entry.isDispatched,
//                         isPacked: entry.isPacked,
//                         isParentPiece: entry.isParentPiece,
//                         isInspected: entry.isInspected,
//                         warehouseId: entry.warehouseId,
//                         isDisabled: false,
//                         dataSource: 'piece',
//                         _debug: {
//                             matchesFabric: String(entry.fabricMasterId) === String(formData.itemName),
//                             isInspected: Number(entry.isInspected) === 1,
//                             isDispatched: Number(entry.isDispatched) === 0,
//                             isParentPiece: Number(entry.isParentPiece) === 0,
//                             warehouseMatch: !formData.fromGodown || !entry.warehouseId ||
//                                 String(entry.warehouseId) === String(formData.fromGodown)
//                         }
//                     };
//                 });
//             }
//         } else if (formData.goodsType === 'Yarn' && formData.itemName) {
//             // Use yarn inward stock data if available
//             if (yarnInwardStockData && yarnInwardStockData.length > 0) {
//                 return yarnInwardStockData.filter((stock: any) => {
//                     // Filter by warehouse if fromGodown is selected
//                     if (formData.fromGodown && stock.warehouseId) {
//                         if (String(stock.warehouseId) !== String(formData.fromGodown)) {
//                             return false;
//                         }
//                     }
//                     return true;
//                 }).map((stock: any) => {
//                     const millName = subCategoryList.find((sc: any) => String(sc.id) === String(stock.millId))?.subCategoryName || stock.millId || '';
//                     const kgsPerBag = Number(stock.kgsPerBag ?? stock.kgPerBag ?? 0);
//                     const conesPerBag = Number(stock.conesPerBag ?? stock.noOfConesPerBag ?? 0);
//                     const conesWeight = stock.conesWeight != null
//                         ? Number(stock.conesWeight)
//                         : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);
//                     return {
//                         id: stock.orderItemId || stock.id,
//                         inwardId: Number(stock.inwardId),
//                         inwardNo: stock.inwardNo || stock.inwardId,
//                         millName: millName,
//                         lotNo: stock.lotNo || 'N/A',
//                         noOfBags: stock.availableBags || 0,
//                         kgPerBag: kgsPerBag,
//                         kgsPerBag,
//                         conesPerBag,
//                         conesWeight,
//                         issuedQty: 0,
//                         totalQuantity: stock.availableQty || 0,
//                         availableQty: stock.availableQty || 0,
//                         acceptedQty: stock.acceptedQty || 0,
//                         warehouseId: stock.warehouseId,
//                         orderItemId: stock.orderItemId,
//                         validationStatus: 'Valid',
//                         isValidPiece: true,
//                         dataSource: 'yarnStock',
//                         yarnInwardStockId: stock.id
//                     };
//                 });
//             }
//             return [];
//         }
//         return [];
//     }, [formData.goodsType, formData.itemName, formData.fromGodown, yarnInwardStockData, subCategoryList, baleRollPackingList, pieceEntryList, packedPieceRollMap]);
//     // Fetch master data on component mount
//     useEffect(() => {
//         dispatch(getAllWarehouse({}));
//         dispatch(getAllFabricMasters({}));
//         dispatch(getAllYarnMasters({}));
//         const storedCompany = typeof window !== 'undefined'
//             ? (localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
//             : null;
//         const companyId = storedCompany ? Number(storedCompany) : undefined;
//         if (companyId) {
//             dispatch(getFactoryPieceEntriesByCompany(companyId) as any);
//         }
//         dispatch(getAllSubCategories({} as any));
//         dispatch(clearSelectedItems());

//         // If editing, populate form data and selected items
//         if (existingTransfer) {
//             let itemNameValue = String(existingTransfer.itemId || existingTransfer.itemName || '');

//             console.log('Editing existing transfer:', existingTransfer);
//             setFormData({
//                 transferDate: existingTransfer.transferDate ? existingTransfer.transferDate.split('T')[0] : new Date().toISOString().split('T')[0],
//                 fromGodown: String(existingTransfer.fromGodownId || existingTransfer.fromGodown),
//                 toGodown: String(existingTransfer.toGodownId || existingTransfer.toGodown),
//                 goodsType: existingTransfer.goodsType || 'Fabric',
//                 itemName: itemNameValue,
//                 // editNote: existingTransfer.editNote || '',
//             });

//             // Populate selected items based on goods type
//             if (existingTransfer.goodsType === 'Fabric' && existingTransfer.fabricItems && Array.isArray(existingTransfer.fabricItems)) {
//                 existingTransfer.fabricItems.forEach((item: any) => {
//                     dispatch(addFabricItemManual({
//                         id: item.id,
//                         rollNo: item.rollNo || '',
//                         pieceNo: item.pieceNo || '',
//                         meter: item.meter || 0,
//                         netWeight: item.netWeight || 0,
//                         avgWeight: item.avgWeight || 0
//                     }));
//                 });
//             } else if (existingTransfer.goodsType === 'Yarn' && existingTransfer.yarnItems && Array.isArray(existingTransfer.yarnItems)) {
//                 const newIssuedQtyMap: Record<number, number> = {};
//                 // Fetch yarn stock to get correct inwardNo mapping
//                 // const itemId = String(existingTransfer.itemId || existingTransfer.itemName || '');
//                 // if (itemId) {
//                 //     apiService.get(`/sizing-yarn-issues/yarn-inward-stock?itemId=${itemId}`)
//                 //         .then((stockResponse: any) => {
//                 //             let stockData = Array.isArray(stockResponse) ? stockResponse : (stockResponse?.data || []);
//                 //             const inwardNoMap: Record<number, string> = {};
//                 //             stockData.forEach((stock: any) => {
//                 //                 inwardNoMap[Number(stock.inwardId)] = stock.inwardNo;
//                 //             });

//                 //             existingTransfer.yarnItems.forEach((item: any) => {
//                 //                 const inwardId = Number(item.inwardId);
//                 //                 const inwardNo = inwardNoMap[inwardId] || item.inwardNo || inwardId;
//                 //                 dispatch(addYarnItemManual({
//                 //                     inwardId: inwardId,
//                 //                     inwardNo: String(inwardNo),
//                 //                     millName: item.millName || '',
//                 //                     lotNo: item.lotNo || '',
//                 //                     noOfBags: item.noOfBags || 0,
//                 //                     kgPerBag: item.kgsPerBag || item.kgPerBag || 0,
//                 //                     totalQuantity: item.totalQuantity || 0
//                 //                 }));
//                 //             });
//                 //         })
//                 //         .catch(() => {
//                 //             // Fallback if API fails
//                 //             existingTransfer.yarnItems.forEach((item: any) => {
//                 //                 dispatch(addYarnItemManual({
//                 //                     inwardId: Number(item.inwardId),
//                 //                     inwardNo: String(item.inwardNo),
//                 //                     millName: item.millName || '',
//                 //                     lotNo: item.lotNo || '',
//                 //                     noOfBags: item.noOfBags || 0,
//                 //                     kgPerBag: item.kgsPerBag || item.kgPerBag || 0,
//                 //                     totalQuantity: item.totalQuantity || 0
//                 //                 }));
//                 //             });
//                 //         });
//                 // } else {
//                 existingTransfer.yarnItems.forEach((item: any) => {
//                     const kgsPerBag = Number(item.kgsPerBag ?? item.kgPerBag ?? 0);
//                     const conesPerBag = Number(item.conesPerBag ?? item.noOfConesPerBag ?? 0);
//                     const conesWeight = item.conesWeight != null
//                         ? Number(item.conesWeight)
//                         : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);

//                     // Fallback for inwardId if it's missing but inwardNo contains the ID
//                     const inwardIdValue = item.inwardId ? Number(item.inwardId) : (item.inwardNo && !isNaN(Number(item.inwardNo)) ? Number(item.inwardNo) : 0);

//                     dispatch(addYarnItemManual({
//                         id: item.id,
//                         inwardId: inwardIdValue,
//                         inwardNo: String(item.inwardNo),
//                         millName: item.millName || '',
//                         lotNo: item.lotNo || '',
//                         noOfBags: item.noOfBags || 0,
//                         kgPerBag: kgsPerBag,
//                         kgsPerBag,
//                         conesPerBag,
//                         conesWeight,
//                         totalQuantity: item.totalQuantity || 0,
//                         issuedQty: item.issuedQty || 0
//                     }));
//                 });
//                 // }
//             }
//         }
//     }, [dispatch, existingTransfer]);

//     // Fetch yarn inward stock when yarn type is selected
//     // useEffect(() => {
//     //     if (formData.goodsType === 'Yarn' && formData.itemName) {
//     //         setLoadingYarnStock(true);
//     //         apiService.get(`/sizing-yarn-issues/yarn-inward-stock?itemId=${formData.itemName}`)
//     //             .then((response: any) => {
//     //                 let stockData = [];
//     //                 if (response && Array.isArray(response)) {
//     //                     stockData = response;
//     //                 } else if (response && response.data && Array.isArray(response.data)) {
//     //                     stockData = response.data;
//     //                 }

//     //                 if (stockData.length > 0) {
//     //                     setYarnInwardStockData(stockData);

//     //                     // Build inward number map from response data
//     //                     const map: Record<number, string> = {};
//     //                     stockData.forEach((item: any) => {
//     //                         if (item.inwardId) {
//     //                             map[item.inwardId] = `Inward-${item.inwardId}`;
//     //                         }
//     //                     });
//     //                     setInwardNumberMap(map);
//     //                 } else {
//     //                     setYarnInwardStockData([]);
//     //                 }
//     //             })
//     //             .catch((error: any) => {
//     //                 console.error('Error fetching yarn inward stock:', error);
//     //                 setYarnInwardStockData([]);
//     //             })
//     //             .finally(() => {
//     //                 setLoadingYarnStock(false);
//     //             });
//     //     } else {
//     //         setYarnInwardStockData([]);
//     //         setInwardNumberMap({});
//     //     }
//     // }, [formData.goodsType, formData.itemName]);

//     // Initialize issuedQtyMap when selectedItems are added
//     useEffect(() => {
//         const newMap = { ...issuedQtyMap };
//         let changed = false;
//         selectedItems.forEach((item: any, idx: number) => {
//             // Only add if not already in the map, to preserve user edits
//             if (newMap[idx] === undefined) {
//                 if (formData.goodsType === 'Yarn') {
//                     newMap[idx] = item.issuedQty !== undefined ? item.issuedQty : (item.totalQuantity || 0);
//                     changed = true;
//                 } else if (formData.goodsType === 'Fabric') {
//                     newMap[idx] = item.issuedQty !== undefined ? item.issuedQty : (item.meter || 0);
//                     changed = true;
//                 }
//             }
//         });
//         // Only update if there are changes
//         if (changed) {
//             setIssuedQtyMap(newMap);
//         }
//     }, [selectedItems, formData.goodsType]);

//     useEffect(() => {
//         if (formData.goodsType === 'Yarn' && formData.itemName) {
//             setLoadingYarnStock(true);
//             apiService.get(buildYarnInwardStockUrl(formData.itemName, resolvedCompanyId))
//                 .then((response: any) => {
//                     let stockData = [];
//                     if (response && Array.isArray(response)) {
//                         stockData = response;
//                     } else if (response && response.data && Array.isArray(response.data)) {
//                         stockData = response.data;
//                     }

//                     if (stockData.length > 0) {
//                         setYarnInwardStockData(stockData);

//                         // If editing and selectedItems don't have proper inwardNo, enrich them
//                         if (existingTransfer && selectedItems.length > 0) {
//                             const inwardNoMap: Record<number, string> = {};
//                             stockData.forEach((stock: any) => {
//                                 inwardNoMap[Number(stock.inwardId)] = stock.inwardNo;
//                             });

//                             // Check if any selectedItem has numeric inwardNo that should be updated
//                             selectedItems.forEach((item: any) => {
//                                 if (inwardNoMap[item.inwardId] && item.inwardNo !== inwardNoMap[item.inwardId]) {
//                                     item.inwardNo = inwardNoMap[item.inwardId];
//                                 }
//                             });
//                         }
//                     } else {
//                         setYarnInwardStockData([]);
//                     }
//                 })
//                 .catch((error: any) => {
//                     console.error('Error fetching yarn inward stock:', error);
//                     setYarnInwardStockData([]);
//                 })
//                 .finally(() => {
//                     setLoadingYarnStock(false);
//                 });
//         } else {
//             setYarnInwardStockData([]);
//         }
//     }, [formData.goodsType, formData.itemName, existingTransfer, selectedItems]);

//     const clearFieldError = (field: string) => {
//         setFormErrors(prev => {
//             if (!prev[field]) {
//                 return prev;
//             }
//             const next = { ...prev };
//             delete next[field];
//             return next;
//         });
//     };

//     const handleInputChange = (field: string, value: string) => {
//         setFormData(prev => {
//             const next = {
//                 ...prev,
//                 [field]: value
//             };
//             // Reset itemName and issuedQtyMap if goodsType changes
//             if (field === 'goodsType') {
//                 setFormData(prev => ({ ...prev, itemName: '' }));
//                 setIssuedQtyMap({});
//             }
//             if (field === 'fromGodown' && value === prev.toGodown) {
//                 next.toGodown = '';
//             }
//             return next;
//         });
//         clearFieldError(field);

//         if (field === 'goodsType') {
//             clearFieldError('itemName');
//         }

//         if (field === 'fromGodown' || field === 'toGodown') {
//             clearFieldError('toGodown');
//         }
//     };

//     // Get the selected item name from dropdown
//     useEffect(() => {
//         if (selectedItems.length > 0) {
//             setFormErrors(prev => {
//                 if (!prev.selectedItems) {
//                     return prev;
//                 }
//                 const next = { ...prev };
//                 delete next.selectedItems;
//                 return next;
//             });
//         }
//     }, [selectedItems]);

//     const selectedItemName = useMemo(() => {
//         const selectedOption = itemNameOptions.find(opt => String(opt.value) === String(formData.itemName));
//         return selectedOption?.label || 'Unknown';
//     }, [formData.itemName, itemNameOptions]);

//     // Calculate summary data for the summary table
//     const summaryData = useMemo(() => {
//         return displayedSelectedItems.map((item: any, idx: number) => {
//             if (formData.goodsType === 'Fabric') {
//                 return {
//                     serialNo: idx + 1,
//                     itemName: selectedItemName,
//                     noOfPiecesOrBags: item.pieceNo ? 1 : 0,
//                     quantity: issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.meter || 0),
//                 };
//             } else {
//                 return {
//                     serialNo: idx + 1,
//                     itemName: selectedItemName,
//                     noOfPiecesOrBags: item.noOfBags || 0,
//                     quantity: issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.totalQuantity || 0),
//                 };
//             }
//         });
//     }, [displayedSelectedItems, formData.goodsType, selectedItemName, issuedQtyMap]);

//     // Calculate totals for summary
//     const totalSummary = useMemo(() => {
//         return summaryData.reduce((acc: any, item: any) => ({
//             totalPieces: acc.totalPieces + (item.noOfPiecesOrBags || 0),
//             totalQuantity: acc.totalQuantity + (item.quantity || 0)
//         }), { totalPieces: 0, totalQuantity: 0 });
//     }, [summaryData]);

//     const isFormReady = useMemo(() => {
//         if (!formData.transferDate || !formData.fromGodown || !formData.toGodown || !formData.goodsType || !formData.itemName) {
//             return false;
//         }
//         if (formData.fromGodown === formData.toGodown) {
//             return false;
//         }
//         if (selectedItems.length === 0) {
//             return false;
//         }
//         return true;
//     }, [formData.transferDate, formData.fromGodown, formData.toGodown, formData.goodsType, formData.itemName, selectedItems]);

//     const validateForm = () => {
//         const errors: Record<string, string> = {};
//         if (!formData.transferDate) {
//             errors.transferDate = 'Required';
//         }
//         if (!formData.fromGodown) {
//             errors.fromGodown = 'Required';
//         }
//         if (!formData.toGodown) {
//             errors.toGodown = 'Required';
//         } else if (formData.fromGodown && formData.fromGodown === formData.toGodown) {
//             errors.toGodown = 'From and To must differ';
//         }
//         if (!formData.goodsType) {
//             errors.goodsType = 'Required';
//         }
//         if (!formData.itemName) {
//             errors.itemName = 'Required';
//         }
//         if (selectedItems.length === 0) {
//             errors.selectedItems = 'Select at least one item';
//         }
//         return errors;
//     };

//     // Complete handleSubmit function
//     const onSubmit = async (data: any) => {
//         // event.preventDefault();
//         const errors = validateForm();
//         if (Object.keys(errors).length > 0) {
//             setFormErrors(errors);
//             alert(errors.selectedItems || 'Please fill all required fields');
//             return;
//         }
//         setFormErrors({});

//         // Get godown names
//         const fromGodownName = warehouseList.find((w: any) => String(w.id) === String(formData.fromGodown))?.name || warehouseList.find((w: any) => String(w.id) === String(formData.fromGodown))?.warehouseName || '';
//         const toGodownName = warehouseList.find((w: any) => String(w.id) === String(formData.toGodown))?.name || warehouseList.find((w: any) => String(w.id) === String(formData.toGodown))?.warehouseName || '';

//         // Calculate total quantity based on items
//         let totalQuantity = 0;
//         if (formData.goodsType === 'Fabric' && selectedItems.length > 0) {
//             totalQuantity = selectedItems.reduce((sum: number, item: any, idx: number) => 
//                 sum + (issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.meter || 0)), 0);
//         } else if (formData.goodsType === 'Yarn' && selectedItems.length > 0) {
//             totalQuantity = selectedItems.reduce((sum: number, item: any, idx: number) => 
//                 sum + (issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : ((item.noOfBags || 0) * (item.kgPerBag || 0))), 0);
//         }

//         // Get item name based on goods type
//         let itemName = formData.itemName;
//         if (formData.goodsType === 'Yarn') {
//             const selectedYarn = yarnMasterList.find((y: any) => String(y.id) === String(formData.itemName));
//             itemName = selectedYarn?.yarnName || formData.itemName;
//         } else if (formData.goodsType === 'Fabric') {
//             const selectedFabric = fabricMasterList.find((f: any) => String(f.id) === String(formData.itemName));
//             itemName = selectedFabric?.fabricCode || formData.itemName;
//         }

//         // Auto-fetch companyId from localStorage
//         const storedCompanyId = typeof window !== 'undefined'
//             ? (localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
//             : null;
//         const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;

//         let stockTransferNo = data.stockTransferNo || existingTransfer?.stockTransferNo || "";
//         if (!existingTransfer && !stockTransferNo) {
//             try {
//                 const docResponse = await documentNumberService.generateDocumentNumber({
//                     screenName: "Stock Transfer",
//                 });
//                 stockTransferNo = docResponse.documentNumber;
//             } catch (error) {
//                 console.warn("Failed to generate document number:", error);
//             }
//         }
//         isSavingRef.current = true;

//         // Prepare the payload
//         const payload: any = {
//             date: formData.transferDate,
//             stockTransferNo: stockTransferNo,
//             fromGodownId: parseInt(formData.fromGodown),
//             fromGodownName: fromGodownName,
//             toGodownId: parseInt(formData.toGodown),
//             toGodownName: toGodownName,
//             goodsType: formData.goodsType,
//             itemId: parseInt(formData.itemName),
//             itemName: itemName,
//             quantity: totalQuantity,
//             companyId: companyId,

//             // Array of items based on goods type
//             ...(formData.goodsType === 'Fabric' && {
//                 fabricItems: selectedItems.map((item: any, idx: number) => ({
//                     id: item.id,
//                     rollNo: item.rollNo || '',
//                     pieceNo: item.pieceNo || '',
//                     meter: item.meter || 0,
//                     netWeight: item.netWeight || 0,
//                     avgWeight: item.avgWeight || 0,
//                     issuedQty: issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.issuedQty || item.meter || 0)
//                 }))
//             }),

//             ...(formData.goodsType === 'Yarn' && {
//                 yarnItems: displayedSelectedItems.map((item: any, idx: number) => ({
//                     id: item.id,
//                     inwardId: item.inwardId ? Number(item.inwardId) : (item.inwardNo && !isNaN(Number(item.inwardNo)) ? Number(item.inwardNo) : null),
//                     inwardNo: item.inwardNo || '',
//                     millName: item.millName || '',
//                     lotNo: item.lotNo || '',
//                     noOfBags: item.noOfBags || 0,
//                     kgsPerBag: item.kgsPerBag || item.kgPerBag || 0,
//                     totalQuantity: item.totalQuantity || ((item.noOfBags || 0) * (item.kgsPerBag || item.kgPerBag || 0)),
//                     issuedQty: issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.issuedQty || 0),
//                     conesPerBag: item.conesPerBag || 0,
//                     conesWeight: item.conesWeight || 0
//                 }))
//             }),

//             ...(existingTransfer && { id: existingTransfer.id })
//         };

//         console.log('Submitting Stock Transfer Payload:', payload);

//         try {
//             if (existingTransfer) {
//                 await dispatch(updateStockTransfer({ ...payload, companyId })).unwrap();

//             } 
//             else {
//                 await dispatch(createStockTransfer(payload)).unwrap();
//                 documentNumberService.clearMemoryCache("Stock Transfer");
//             }
//             navigate('/transaction/stock-transfers');
//         } catch (error: any) {
//             console.error('Error saving stock transfer:', error);
//             alert('Failed to save stock transfer: ' + (error.message || 'Unknown error'));
//         }
//     };

//     return (
//         <div className="space-y-6 mt-8 p-4">
//             {/* Header */}
//             <div className="flex justify-between items-center">


//                 <div className="flex items-center space-x-4">
//                     <Button
//                         variant="outline"
//                         onClick={() => navigate("/transaction/stock-transfers")}
//                         className="mr-auto"
//                     >
//                         <ArrowLeft size={18} className="mr-2" />
//                         Back
//                     </Button>
//                     <h1 className="text-3xl font-bold">
//                         {existingTransfer ? 'Edit Stock Transfer' : 'Add Stock Transfer'}
//                     </h1>
//                 </div>

//                 <div className="flex gap-2">
//                     {/* <Button
//                         variant="outline"
//                         onClick={() => navigate('/transaction/stock-transfer')}
//                     >
//                         <X className="h-4 w-4 mr-2" />
//                         Cancel
//                     </Button> */}
//                     <Button
//                         type="submit"
//                         disabled={saving || !isFormReady}
//                         onClick={(e) => {
//                             e.preventDefault();
//                             const form = document.querySelector('form');
//                             if (form) {
//                                 form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
//                             }
//                         }}
//                     >
//                         <Save className="h-4 w-4 mr-2" />
//                         {saving ? (existingTransfer ? 'Updating...' : 'Saving...') : (existingTransfer ? 'Update' : 'Save')}
//                     </Button>
//                 </div>
//             </div>

//             <form onSubmit={handleSubmit(onSubmit)}>
//                 <div className="grid grid-cols-1 gap-6">
//                     {/* Basic Information Card */}
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Basic Information</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                                 <div>
//                                     <label className="block text-sm font-medium  mb-1">Stock Transfer No</label>
//                                     <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
//                                         {...register('stockTransferNo')} readOnly />

//                                 </div>
//                                 {/* Date */}
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">Date</label>
//                                     <input
//                                         type="date"
//                                         className="w-full border rounded px-2 py-2"
//                                         value={formData.transferDate}
//                                         onChange={e => handleInputChange('transferDate', e.target.value)}
//                                     />
//                                     {formErrors.transferDate && (
//                                         <p className="text-red-500 text-sm mt-1">{formErrors.transferDate}</p>
//                                     )}
//                                 </div>
//                                 {/* From Godown */}
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">From Godown</label>
//                                     <select
//                                         className="w-full border rounded px-2 py-2"
//                                         value={formData.fromGodown}
//                                         onChange={e => handleInputChange('fromGodown', e.target.value)}
//                                     >
//                                         <option value="">Select</option>
//                                         {warehouseList.map((w: any) => (
//                                             <option key={w.id} value={w.id}>{w.name || w.warehouseName}</option>
//                                         ))}
//                                     </select>
//                                     {formErrors.fromGodown && (
//                                         <p className="text-red-500 text-sm mt-1">{formErrors.fromGodown}</p>
//                                     )}
//                                 </div>

//                                 {/* To Godown */}
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">To Godown</label>
//                                     <select
//                                         className="w-full border rounded px-2 py-2"
//                                         value={formData.toGodown}
//                                         onChange={e => handleInputChange('toGodown', e.target.value)}
//                                         disabled={!formData.fromGodown}
//                                     >
//                                         <option value="">Select</option>
//                                         {filteredToGodownOptions.length === 0 ? (
//                                             <option value="" disabled>
//                                                 {formData.fromGodown ? 'No other warehouses available' : 'Select From Godown first'}
//                                             </option>
//                                         ) : (
//                                             filteredToGodownOptions.map((w: any) => (
//                                                 <option key={w.id} value={w.id}>{w.name || w.warehouseName}</option>
//                                             ))
//                                         )}
//                                     </select>
//                                     {formErrors.toGodown && (
//                                         <p className="text-red-500 text-sm mt-1">{formErrors.toGodown}</p>
//                                     )}
//                                 </div>
//                                 {/* Goods Type */}
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">Goods Type</label>
//                                     <select
//                                         className="w-full border rounded px-2 py-2"
//                                         value={formData.goodsType}
//                                         onChange={e => handleInputChange('goodsType', e.target.value)}
//                                     >
//                                         <option value="Fabric">Fabric</option>
//                                         <option value="Yarn">Yarn</option>
//                                     </select>
//                                     {formErrors.goodsType && (
//                                         <p className="text-red-500 text-sm mt-1">{formErrors.goodsType}</p>
//                                     )}
//                                 </div>
//                                 {/* Item Name */}
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">Item Name</label>
//                                     <select
//                                         className="w-full border rounded px-2 py-2"
//                                         value={formData.itemName}
//                                         onChange={e => handleInputChange('itemName', e.target.value)}
//                                     >
//                                         <option value="">Select</option>
//                                         {itemNameOptions.length === 0 && (
//                                             <option value="" disabled>No items found</option>
//                                         )}
//                                         {itemNameOptions.map(opt => (
//                                             <option key={opt.value} value={opt.value}>{opt.label}</option>
//                                         ))}
//                                     </select>
//                                     {formErrors.itemName && (
//                                         <p className="text-red-500 text-sm mt-1">{formErrors.itemName}</p>
//                                     )}
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Selected Items Table with Select Items Button */}
//                     <Card>
//                         <CardHeader className="flex flex-row items-center justify-between">
//                             <CardTitle>Selected Items</CardTitle>
//                             <Button
//                                 type="button"
//                                 variant="default"
//                                 onClick={() => setIsItemsModalOpen(true)}
//                                 disabled={!formData.itemName}
//                             >
//                                 Select Items
//                             </Button>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="overflow-x-auto">
//                                 <table className="min-w-full border">
//                                     <thead className="bg-gray-50">
//                                         <tr>
//                                             <th className="px-3 py-2 text-left">S.No</th>
//                                             {formData.goodsType === 'Fabric' ? (
//                                                 <>
//                                                     <th className="px-3 py-2 text-left">Roll No</th>
//                                                     <th className="px-3 py-2 text-left">Piece No</th>
//                                                     <th className="px-3 py-2 text-right">Meter</th>
//                                                     <th className="px-3 py-2 text-right">Net Weight</th>
//                                                     <th className="px-3 py-2 text-right">Avg Weight</th>
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <th className="px-3 py-2 text-left">Inward No</th>
//                                                     <th className="px-3 py-2 text-left">Mill Name</th>
//                                                     <th className="px-3 py-2 text-left">Lot No</th>
//                                                     <th className="px-3 py-2 text-right">No of Bags</th>
//                                                     <th className="px-3 py-2 text-right">Kg/Bag</th>
//                                                     <th className="px-3 py-2 text-right">Cones per Bags</th>
//                                                     <th className="px-3 py-2 text-right">Cones weight</th>
//                                                     <th className="px-3 py-2 text-right">Total Quantity</th>
//                                                 </>
//                                             )}
//                                             <th className="px-3 py-2 text-right">Issued Qty</th>
//                                             <th className="px-3 py-2 text-center">Action</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody className="divide-y divide-gray-200">
//                                         {displayedSelectedItems.map((item: any, idx: number) => (
//                                             <tr key={idx}>
//                                                 <td className="px-3 py-2 text-left">{idx + 1}</td>
//                                                 {formData.goodsType === 'Fabric' ? (
//                                                     <>
//                                                         <td className="px-3 py-2 text-left">{item.rollNo}</td>
//                                                         <td className="px-3 py-2 text-left">{item.pieceNo}</td>
//                                                         <td className="px-3 py-2 text-right">{item.meter}</td>
//                                                         <td className="px-3 py-2 text-right">{item.netWeight}</td>
//                                                         <td className="px-3 py-2 text-right">{item.avgWeight}</td>
//                                                     </>
//                                                 ) : (
//                                                     <>
//                                                         <td className="px-3 py-2 text-left">{item.inwardNo}</td>
//                                                         <td className="px-3 py-2 text-left">{item.millName}</td>
//                                                         <td className="px-3 py-2 text-left">{item.lotNo}</td>
//                                                         <td className="px-3 py-2 text-right">{item.noOfBags}</td>
//                                                         <td className="px-3 py-2 text-right">{Number(item.kgsPerBag ?? item.kgPerBag ?? 0).toFixed(3)}</td>
//                                                         <td className="px-3 py-2 text-right">{Number(item.conesPerBag ?? 0)}</td>
//                                                         <td className="px-3 py-2 text-right">{Number(item.conesWeight ?? 0).toFixed(3)}</td>
//                                                         <td className="px-3 py-2 text-right">{Number(item.totalQuantity ?? ((item.noOfBags || 0) * (item.kgsPerBag || item.kgPerBag || 0))).toFixed(3)}</td>
//                                                     </>
//                                                 )}
//                                                 <td className="px-3 py-2 text-center">
//                                                     <input
//                                                         type="number"
//                                                         min="0"
//                                                         className={`w-20 border rounded px-2 py-1 text-right ${ (isGlobalEditing || editingIdx === idx) ? 'bg-white' : 'bg-gray-100 cursor-not-allowed'}`}
//                                                         value={issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.issuedQty || 0)}
//                                                         onChange={(e) => {
//                                                             const newValue = parseFloat(e.target.value) || 0;
//                                                             setIssuedQtyMap(prev => ({ ...prev, [idx]: newValue }));
//                                                         }}
//                                                         readOnly={!isGlobalEditing && editingIdx !== idx}
//                                                     />
//                                                 </td>
//                                                 <td className="px-3 py-2 text-center">
//                                                     <div className="flex justify-center gap-2">
//                                                         <Button
//                                                             type="button"
//                                                             // variant="ghost"
//                                                             size="sm"
//                                                             className="h-8 w-8 p-0"
//                                                             onClick={() => {
//                                                                 if (isGlobalEditing) {
//                                                                     setIsGlobalEditing(false);
//                                                                     setEditingIdx(idx);
//                                                                 } else {
//                                                                     setEditingIdx(editingIdx === idx ? null : idx);
//                                                                 }
//                                                             }}
//                                                         >
//                                                             <Edit className="h-4 w-4" />
//                                                         </Button>
//                                                         <Button
//                                                             type="button"
//                                                             // variant="ghost"
//                                                             size="sm"
//                                                             className="h-8 w-8 p-0"
//                                                             onClick={() => handleDeleteItem(item.slNo, idx)}
//                                                         >
//                                                             <Trash2 className="h-4 w-4 " />
//                                                         </Button>
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                             {(isGlobalEditing || editingIdx !== null) && (
//                                 <div className="mt-4 flex justify-end">
//                                     <Button
//                                         type="button"
//                                         variant="secondary"
//                                         onClick={() => {
//                                             setIsGlobalEditing(false);
//                                             setEditingIdx(null);
//                                         }}
//                                     >
//                                         Save Item
//                                     </Button>
//                                 </div>
//                             )}
//                             {formErrors.selectedItems && (
//                                 <p className="text-red-500 text-sm mt-3">{formErrors.selectedItems}</p>
//                             )}
//                         </CardContent>
//                     </Card>

//                     {/* Summary Table Card */}
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Summary</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="overflow-x-auto">
//                                 <table className="min-w-full border">
//                                     <thead className="bg-gray-50">
//                                         <tr>
//                                             <th className="px-3 py-2 text-left">S.No</th>
//                                             <th className="px-3 py-2 text-left">Item Name</th>
//                                             <th className="px-3 py-2 text-right">No of Pieces/Bags</th>
//                                             <th className="px-3 py-2 text-right">Quantity</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody className="divide-y divide-gray-200">
//                                         {summaryData.map((row: any) => (
//                                             <tr key={row.serialNo}>
//                                                 <td className="px-3 py-2 text-left">{row.serialNo}</td>
//                                                 <td className="px-3 py-2 text-left">{row.itemName}</td>
//                                                 <td className="px-3 py-2 text-right">{row.noOfPiecesOrBags}</td>
//                                                 <td className="px-3 py-2 text-right">{row.quantity}</td>
//                                             </tr>
//                                         ))}
//                                         {/* Total Row */}
//                                         <tr className="bg-gray-50 font-semibold">
//                                             <td className="px-3 py-2 text-left" colSpan={2}>Total</td>
//                                             <td className="px-3 py-2 text-right">{totalSummary.totalPieces}</td>
//                                             <td className="px-3 py-2 text-right">{totalSummary.totalQuantity}</td>
//                                         </tr>
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>
//             </form>

//             {/* Select Items Modal */}
//             <Modal
//                 isOpen={isItemsModalOpen}
//                 onClose={() => setIsItemsModalOpen(false)}
//                 title={`Select ${formData.goodsType} Items`}
//                 className="max-w-4xl"
//             >
//                 <div className="space-y-6">
//                     <div className="overflow-x-auto">
//                         <table className="min-w-full border">
//                             <thead className="bg-gray-50">
//                                 <tr>
//                                     <th className="px-3 py-2 text-center">Select</th>
//                                     {formData.goodsType === 'Fabric' ? (
//                                         <>
//                                             {modalTableData.some((row: any) => row.rollNo && row.packingType === 'Roll') && (
//                                                 <th className="px-3 py-2 text-left">Roll No</th>
//                                             )}
//                                             {modalTableData.some((row: any) => !row.rollNo || row.dataSource === 'piece') && (
//                                                 <th className="px-3 py-2 text-left">Piece No</th>
//                                             )}
//                                             <th className="px-3 py-2 text-right">Meter</th>
//                                             <th className="px-3 py-2 text-right">Net Weight</th>
//                                             <th className="px-3 py-2 text-right">Avg Weight</th>
//                                         </>
//                                     ) : (
//                                         <>
//                                             <th className="px-3 py-2 text-left">Inward No</th>
//                                             <th className="px-3 py-2 text-left">Mill Name</th>
//                                             <th className="px-3 py-2 text-left">Lot No</th>
//                                             <th className="px-3 py-2 text-right">No of Bags</th>
//                                             <th className="px-3 py-2 text-right">Kg/Bag</th>
//                                             <th className="px-3 py-2 text-right">Cones per Bags</th>
//                                             <th className="px-3 py-2 text-right">Cones weight</th>
//                                             <th className="px-3 py-2 text-right">Total Quantity</th>

//                                         </>
//                                     )}
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-gray-200">
//                                 {modalTableData.map((row: any, idx: number) => (
//                                     <tr key={row.id} className={row.isDisabled ? 'bg-gray-100 opacity-60' : ''} title={row.isDisabled ? `Disabled: is_packed=${row.isPacked}, is_dispatched=${row.isDispatched}` : ''}>
//                                         <td className="px-3 py-2 text-center">
//                                             <input
//                                                 type="checkbox"
//                                                 checked={modalSelectedRows.includes(idx)}
//                                                 disabled={row.isDisabled}
//                                                 onChange={e => {
//                                                     if (e.target.checked && !row.isDisabled) {
//                                                         setModalSelectedRows(prev => [...prev, idx]);
//                                                     } else {
//                                                         setModalSelectedRows(prev => prev.filter(i => i !== idx));
//                                                     }
//                                                 }}
//                                             />
//                                         </td>
//                                         {formData.goodsType === 'Fabric' ? (
//                                             <>
//                                                 {row.rollNo && row.packingType === 'Roll' && (
//                                                     <td className="px-3 py-2 text-left">{row.rollNo}</td>
//                                                 )}
//                                                 {(!row.rollNo || row.dataSource === 'piece') && (
//                                                     <td className="px-3 py-2 text-left">{row.pieceNo}</td>
//                                                 )}
//                                                 <td className="px-3 py-2 text-right">{row.meter}</td>
//                                                 <td className="px-3 py-2 text-right">{row.netWeight}</td>
//                                                 <td className="px-3 py-2 text-right">{row.avgWeight}</td>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <td className="px-3 py-2 text-left">{row.inwardNo}</td>
//                                                 <td className="px-3 py-2 text-left">{row.millName}</td>
//                                                 <td className="px-3 py-2 text-left">{row.lotNo}</td>
//                                                 <td className="px-3 py-2 text-right">{row.noOfBags}</td>
//                                                 <td className="px-3 py-2 text-right">{row.kgPerBag}</td>
//                                                 <td className="px-3 py-2 text-right">{row.conesPerBag}</td>
//                                                 <td className="px-3 py-2 text-right">{row.conesWeight}</td>
//                                                 <td className="px-3 py-2 text-right">{row.totalQuantity}</td>

//                                             </>
//                                         )}
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                     <div className="flex justify-end gap-2 pt-4 border-t">
//                         <Button
//                             variant="outline"
//                             onClick={() => setIsItemsModalOpen(false)}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             onClick={() => {
//                                 // Add selected items to Redux
//                                 modalSelectedRows.forEach(idx => {
//                                     const row = modalTableData[idx];
//                                     if (formData.goodsType === 'Fabric') {
//                                         dispatch({
//                                             type: 'stockTransfer/addFabricItemManual',
//                                             payload: {
//                                                 rollNo: row.rollNo,
//                                                 pieceNo: row.pieceNo,
//                                                 meter: row.meter,
//                                                 netWeight: row.netWeight,
//                                                 avgWeight: row.avgWeight,
//                                             }
//                                         });
//                                     } else {
//                                         dispatch({
//                                             type: 'stockTransfer/addYarnItemManual',
//                                             payload: {
//                                                 inwardId: Number(row.inwardId),
//                                                 inwardNo: row.inwardNo,
//                                                 millName: row.millName,
//                                                 lotNo: row.lotNo,
//                                                 noOfBags: row.noOfBags,
//                                                 kgPerBag: row.kgsPerBag ?? row.kgPerBag,
//                                                 kgsPerBag: row.kgsPerBag ?? row.kgPerBag,
//                                                 conesPerBag: row.conesPerBag,
//                                                 conesWeight: row.conesWeight,
//                                                 totalQuantity: row.totalQuantity ?? ((row.noOfBags || 0) * (row.kgsPerBag ?? row.kgPerBag ?? 0)),
//                                             }
//                                         });
//                                     }
//                                 });
//                                 setModalSelectedRows([]);
//                                 setIsItemsModalOpen(false);
//                                 setIsGlobalEditing(true);
//                             }}
//                         >
//                             Add Selected Items
//                         </Button>
//                     </div>
//                 </div>
//             </Modal>

//             {/* Validation Detail Modal */}
//             <Modal
//                 isOpen={isValidationDetailOpen}
//                 onClose={() => {
//                     setIsValidationDetailOpen(false);
//                     setSelectedValidationItem(null);
//                 }}
//                 title="Piece Validation Details"
//                 className="max-w-md"
//             >
//                 {selectedValidationItem && (
//                     <div className="space-y-4">
//                         <div className="bg-gray-50 p-4 rounded border">
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                     <p className="text-sm text-gray-600">Piece Number</p>
//                                     <p className="font-semibold text-lg">{selectedValidationItem.pieceNo}</p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-gray-600">Roll Number</p>
//                                     <p className="font-semibold">{selectedValidationItem.rollNo}</p>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="bg-blue-50 p-4 rounded border border-blue-200">
//                             <p className="text-sm font-semibold text-blue-900 mb-3">Validation Status</p>
//                             <div className="space-y-2">
//                                 <div className="flex items-center justify-between">
//                                     <span className="text-sm text-gray-700">Piece Entry Found:</span>
//                                     <span className={`text-sm font-semibold px-2 py-1 rounded ${selectedValidationItem.isValidPiece
//                                             ? 'bg-green-100 text-green-800'
//                                             : 'bg-red-100 text-red-800'
//                                         }`}>
//                                         {selectedValidationItem.isValidPiece ? 'Yes' : 'No'}
//                                     </span>
//                                 </div>
//                                 {selectedValidationItem.isValidPiece && (
//                                     <>
//                                         <div className="flex items-center justify-between">
//                                             <span className="text-sm text-gray-700">Is Packed (is_packed):</span>
//                                             <span className={`text-sm font-semibold px-2 py-1 rounded ${selectedValidationItem.isPacked === 1
//                                                     ? 'bg-green-100 text-green-800'
//                                                     : 'bg-yellow-100 text-yellow-800'
//                                                 }`}>
//                                                 {selectedValidationItem.isPacked === 1 ? 'Yes (1)' : `No (${selectedValidationItem.isPacked})`}
//                                             </span>
//                                         </div>
//                                         <div className="flex items-center justify-between">
//                                             <span className="text-sm text-gray-700">Is Dispatched (is_dispatched):</span>
//                                             <span className={`text-sm font-semibold px-2 py-1 rounded ${selectedValidationItem.isDispatched === 1
//                                                     ? 'bg-green-100 text-green-800'
//                                                     : 'bg-yellow-100 text-yellow-800'
//                                                 }`}>
//                                                 {selectedValidationItem.isDispatched === 1 ? 'Yes (1)' : `No (${selectedValidationItem.isDispatched})`}
//                                             </span>
//                                         </div>
//                                     </>
//                                 )}
//                             </div>
//                         </div>

//                         <div className={`p-4 rounded border ${selectedValidationItem.isDisabled
//                                 ? 'bg-yellow-50 border-yellow-200'
//                                 : 'bg-green-50 border-green-200'
//                             }`}>
//                             <p className="text-sm font-semibold mb-2">Selection Status</p>
//                             {selectedValidationItem.isDisabled ? (
//                                 <p className="text-sm text-yellow-800">
//                                     ⚠️ This item is <strong>disabled</strong> because:
//                                     <br />
//                                     {selectedValidationItem.isPacked !== 1 && (
//                                         <span>• Not packed (is_packed ≠ 1)<br /></span>
//                                     )}
//                                     {selectedValidationItem.isDispatched === 0 && (
//                                         <span>• Not dispatched (is_dispatched = 0)<br /></span>
//                                     )}
//                                 </p>
//                             ) : (
//                                 <p className="text-sm text-green-800">
//                                     ✓ This item is <strong>enabled</strong> for selection.
//                                 </p>
//                             )}
//                         </div>

//                         <div className="flex justify-end pt-4 border-t">
//                             <Button
//                                 variant="outline"
//                                 onClick={() => {
//                                     setIsValidationDetailOpen(false);
//                                     setSelectedValidationItem(null);
//                                 }}
//                             >
//                                 Close
//                             </Button>
//                         </div>
//                     </div>
//                 )}
//             </Modal>
//         </div>
//     );
// }

// StockTransferDetails.tsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Save, X, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/Modal';
import { AppDispatch, RootState } from '@/state/store';
import {
    createStockTransfer,
    updateStockTransfer,
    addFabricItemManual,
    addYarnItemManual,
    clearSelectedItems,
    removeFromSelectedItems,
    StockTransfer
} from '@/state/stockTransferSlice';
import { getAllStockTransfers } from '@/state/stockTransferSlice';
import { getAllWarehouse } from '@/state/warehouseSlice';
import { getAllFabricMasters } from '@/state/fabricMasterSlice';
import { getAllYarnMasters } from '@/state/yarnSlice';
import { getFactoryPieceEntriesByCompany } from '@/state/factoryPieceEntrySlice';
import { getAllSubCategories } from '@/state/subCategorySlice';
import apiService from '@/services/ApiService';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';
import { useForm } from 'react-hook-form';
import documentNumberService from '@/services/DocumentNumberService';
import { toast } from 'react-toastify';
import { useFilteredWarehouseOptions } from '@/hooks/useFilteredWarehouseOptions';
import { getAllItemMasters } from '@/state/itemSlice';
import { Input } from '@/components/ui/input';

const buildYarnInwardStockUrl = (itemId: string | number, companyId?: number | null) => {
    const params: string[] = [];
    const normalized = itemId != null ? String(itemId).trim() : "";
    if (normalized) {
        params.push(`itemId=${normalized}`);
    }
    if (companyId != null) {
        params.push(`companyId=${companyId}`);
    }
    return params.length
        ? `/sizing-yarn-issues/yarn-inward-stock?${params.join("&")}`
        : `/sizing-yarn-issues/yarn-inward-stock`;
};


interface ItemGoodsItem {
    id: string;
    itemId: number | '';
    itemName: string;
    noOfBags: number;
    kgsPerBag: number;
    acceptedQty: number;
    lotNo: string;
    issuingBags: number | null;  // Add issuingBags field
    inwardNo?: string;      // Add this - optional since it might not exist for manually added items
    availableQty?: number;  // Add this - optional for validation
}

interface ItemStockDetail {
    itemInwardStockDetails: {
        id: number;
        inwardId: number;
        orderItemId: number;
        itemId: number;
        itemName: string | null;
        uomId: number;
        millId: number | null;
        warehouseId: number;
        lotNo: string;
        inwardQty: number;
        inwardBags: number;
        kgsPerBag: number;
        conesPerBag: number;
        conesWeight: number;
        acceptedQty: number;
        rejectedQty: number;
        availableQty: number;
        availableBags: number;
        inwardNo: string;
        remark: string;
    };
    itemInventory: {
        vendorId: number;
        orderNo: string;
        dcDate: string;
        orderId: number;
        orderItemId: number;
        inwardDate: string;
        inwardNo: string;
    };
}

export default function StockTransferDetails() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();

    // Get data from Redux store
    const warehouseList = useSelector((state: RootState) => state.warehouse.warehouseList || []);
    const fabricMasterList = useSelector((state: RootState) => state.fabricMaster.fabricMasterList || []);
    const yarnMasterList = useSelector((state: RootState) => (state.yarn.yarnList || []));
    const { selectedItems, saving } = useSelector((state: RootState) => state.StockTransfer);
    const factoryPieceEntries = useSelector((state: RootState) => (state as any).factoryPieceEntry?.list || []);

    const subCategoryList = useSelector((state: RootState) => (state as any).subCategory?.subCategoryList || []);
    const itemList = useSelector((state: RootState) => (state as any).itemMaster?.itemList || []);
    const resolvedCompanyId = useResolvedCompanyId();

    const existingTransfer: any = location.state?.stockTransfer as StockTransfer | undefined;

    // Form state
    const [formData, setFormData] = useState({
        transferDate: new Date().toISOString().split('T')[0],
        fromGodown: '',
        toGodown: '',
        goodsType: 'Fabric' as 'Fabric' | 'Yarn' | 'Item',
        itemName: '',
        // editNote: '',
    });


    const [itemGoodsItems, setItemGoodsItems] = useState<ItemGoodsItem[]>([]);
    const [itemGoodsDraft, setItemGoodsDraft] = useState<Partial<ItemGoodsItem>>({});
    const [itemStockData, setItemStockData] = useState<ItemStockDetail[]>([]);
    const [loadingItemStock, setLoadingItemStock] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<ItemGoodsItem>>({});

    const pieceEntryList = useMemo(() => {
        const entries = Array.isArray(factoryPieceEntries) ? factoryPieceEntries : [];
        return entries.filter((entry: any) => {
            if (Number(entry?.isInspected) !== 1) {
                return false;
            }
            if (Number(entry?.isDispatched) !== 0) {
                return false;
            }
            if (Number(entry?.isParentPiece) !== 0) {
                return false;
            }
            const stockTransferFlag = entry?.isStockTransfer;
            if (stockTransferFlag !== undefined && stockTransferFlag !== null) {
                const normalized = typeof stockTransferFlag === 'string'
                    ? stockTransferFlag.trim().toLowerCase()
                    : stockTransferFlag;
                if (
                    normalized === true ||
                    normalized === 1 ||
                    normalized === '1' ||
                    normalized === 'true'
                ) {
                    return false;
                }
            }
            if (formData.fromGodown && entry?.warehouseId != null) {
                if (String(entry.warehouseId) !== String(formData.fromGodown)) {
                    return false;
                }
            }
            return true;
        });
    }, [factoryPieceEntries, formData.fromGodown]);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            stockTransferNo: existingTransfer?.stockTransferNo || 'Loading sequence...',
            editNote: existingTransfer?.editNote || '',
        }
    });

    const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);

    useEffect(() => {
        const generateDocumentNumber = async () => {
            if (existingTransfer || hasGeneratedNumberRef.current) {
                return;
            }

            setValue('stockTransferNo', 'Loading sequence...');

            try {
                const result = await documentNumberService.generateDocumentNumber({
                    screenName: 'Stock Transfer'
                });
                setValue('stockTransferNo', result.documentNumber, { shouldValidate: true });
                hasGeneratedNumberRef.current = true;
            } catch (error) {
                console.error('Failed to generate Stock Transfer number:', error);
                toast.error('Failed to generate Stock Transfer number');
            }
        };

        generateDocumentNumber();
    }, [existingTransfer, setValue]);

    // Cleanup document number cache if not saved
    useEffect(() => {

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !existingTransfer) {
                documentNumberService.clearMemoryCache('Stock Transfer');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !existingTransfer) {
                documentNumberService.clearMemoryCache('Stock Transfer');
            }
        };
    }, [existingTransfer]);

    useEffect(() => {
        if (existingTransfer?.stockTransferNo) {
            setValue('stockTransferNo', existingTransfer.stockTransferNo);
        }
    }, [existingTransfer, setValue]);

    // Modal state for items
    const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
    const [modalSelectedRows, setModalSelectedRows] = useState<number[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Validation detail modal state
    const [isValidationDetailOpen, setIsValidationDetailOpen] = useState(false);
    const [selectedValidationItem, setSelectedValidationItem] = useState<any>(null);

    // Yarn inward stock state
    const [yarnInwardStockData, setYarnInwardStockData] = useState<any[]>([]);
    const [loadingYarnStock, setLoadingYarnStock] = useState(false);
    const [inwardNumberMap, setInwardNumberMap] = useState<Record<number, string>>({}); // Map of inwardId to inwardNo

    // Issued Qty state for yarn items
    const [issuedQtyMap, setIssuedQtyMap] = useState<Record<string | number, number>>({});
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [isGlobalEditing, setIsGlobalEditing] = useState(false);

    // For dynamic item name dropdown
    const itemNameOptions: { value: string | number, label: string, activeFlag?: boolean }[] =
        formData.goodsType === 'Fabric'
            ? (Array.isArray(fabricMasterList) ? fabricMasterList : []).map((f: any) => ({
                value: f.id,
                label: [f.fabricCode, f.fabricQuality, f.quality, f.name].filter(Boolean).join(' - '),
                activeFlag: f.activeFlag ?? true
            }))
            : formData.goodsType === 'Yarn'
                ? (Array.isArray(yarnMasterList) ? yarnMasterList : []).map((y: any) => ({
                    value: y.id,
                    label: [y.yarnName, y.millName, y.name].filter(Boolean).join(' - '),
                    activeFlag: y.activeFlag ?? true
                }))
                : (Array.isArray(itemList) ? itemList : []).map((item: any) => ({
                    value: item.id,
                    label: item.itemName || item.name || String(item.id),
                    activeFlag: item.activeFlag ?? true
                }));

    const normalizedItemList = useMemo(() => Array.isArray(itemList) ? itemList : [], [itemList]);

    // Filtered warehouse options by goods type
    const { filteredWarehouseOptions: fromGodownOptions, defaultWarehouseId: defaultFromGodownId } =
        useFilteredWarehouseOptions(warehouseList, formData.goodsType);

    const filteredToGodownOptions = useMemo(() => {
        return fromGodownOptions.filter((w) => String(w.id) !== String(formData.fromGodown));
    }, [fromGodownOptions, formData.fromGodown]);

    // Auto-set fromGodown default when goodsType changes (new entries only)
    useEffect(() => {
        if (!existingTransfer) {
            setFormData(prev => ({
                ...prev,
                fromGodown: defaultFromGodownId || '',
                toGodown: '',
            }));
        }
    }, [defaultFromGodownId, existingTransfer]);

    useEffect(() => {
        if (formData.goodsType === 'Item' && formData.fromGodown) {
            setLoadingItemStock(true);
            const storedCompanyId = typeof window !== 'undefined'
                ? (localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
                : null;

            // Build URL manually to avoid params[] wrapper
            const warehouseId = Number(formData.fromGodown);
            const companyId = storedCompanyId ? Number(storedCompanyId) : resolvedCompanyId;
            const url = `/item-stock-details/filter?warehouseId=${warehouseId}&companyId=${companyId}`;

            console.log('Fetching from URL:', url); // Debug log

            apiService.get(url)
                .then((response: any) => {
                    console.log('Full API Response:', response);

                    let stockData = [];

                    // Your API returns { data: [...], message: "", status: "" }
                    if (response && response.data && Array.isArray(response.data)) {
                        stockData = response.data;
                    } else if (response && Array.isArray(response)) {
                        stockData = response;
                    }

                    console.log('Stock data length:', stockData.length);

                    if (stockData.length > 0) {
                        setItemStockData(stockData);
                        // toast.success(`Found ${stockData.length} item(s) in stock`);
                    } else {
                        setItemStockData([]);
                        toast.info('No stock available for selected godown');
                    }
                })
                .catch((error: any) => {
                    console.error('Error fetching item stock details:', error);
                    console.error('Error config:', error.config);
                    console.error('Error response:', error.response);
                    setItemStockData([]);
                    toast.error(error?.response?.data?.message || 'Failed to fetch item stock details');
                })
                .finally(() => {
                    setLoadingItemStock(false);
                });
        } else {
            setItemStockData([]);
        }
    }, [formData.goodsType, formData.fromGodown, resolvedCompanyId]);

    //  const itemModalTableData = useMemo(() => {
    //     if (formData.goodsType === 'Item' && itemStockData.length > 0) {
    //         return itemStockData.map((stockItem: ItemStockDetail) => {
    //             const details = stockItem.itemInwardStockDetails;
    //             // Filter out items that are already added
    //             const isAlreadyAdded = itemGoodsItems.some(
    //                 item => item.itemId === details.itemId && item.lotNo === details.lotNo
    //             );
    //             return {
    //                 id: details.id,
    //                 inwardId: details.inwardId,
    //                 inwardNo: details.inwardNo,
    //                 itemId: details.itemId,
    //                 itemName: details.itemName || (itemList.find((i: any) => i.id === details.itemId)?.itemName || 'Unknown'),
    //                 lotNo: details.lotNo,
    //                 noOfBags: details.availableBags || 0,
    //                 kgsPerBag: details.kgsPerBag || 0,
    //                 availableQty: details.availableQty || 0,
    //                 acceptedQty: details.acceptedQty || 0,
    //                 warehouseId: details.warehouseId,
    //                 orderItemId: details.orderItemId,
    //                 isAlreadyAdded: isAlreadyAdded,
    //                 dataSource: 'itemStock'
    //             };
    //         });
    //     }
    //     return [];
    // }, [formData.goodsType, itemStockData, itemList, itemGoodsItems]);

    // Get all roll/bale packings from Redux

    const itemModalTableData = useMemo(() => {
        if (formData.goodsType === 'Item' && itemStockData.length > 0) {
            return itemStockData.map((stockItem: any) => {
                // Extract the correct data structure
                const details = stockItem.itemInwardStockDetails;

                if (!details) {
                    console.warn('Missing itemInwardStockDetails:', stockItem);
                    return null;
                }

                // Check if item already added
                const isAlreadyAdded = itemGoodsItems.some(
                    item => item.itemId === details.itemId && item.lotNo === details.lotNo
                );

                // Get item name from itemList if details.itemName is null
                let itemName = details.itemName;
                if (!itemName && details.itemId) {
                    const foundItem = itemList.find((i: any) => i.id === details.itemId);
                    itemName = foundItem?.itemName || foundItem?.name || `Item ID: ${details.itemId}`;
                }

                return {
                    id: details.id,
                    inwardId: details.inwardId,
                    inwardNo: details.inwardNo || `INWARD-${details.inwardId}`,
                    itemId: details.itemId,
                    itemName: itemName || 'Unknown Item',
                    lotNo: details.lotNo || 'N/A',
                    noOfBags: details.availableBags || 0,
                    kgsPerBag: details.kgsPerBag || 0,
                    availableQty: details.availableQty || 0,
                    acceptedQty: details.acceptedQty || 0,
                    warehouseId: details.warehouseId,
                    orderItemId: details.orderItemId,
                    isAlreadyAdded: isAlreadyAdded,
                    dataSource: 'itemStock'
                };
            }).filter(Boolean); // Remove any null entries
        }
        return [];
    }, [formData.goodsType, itemStockData, itemList, itemGoodsItems]);

    const baleRollPackingList = useSelector((state: RootState) => state.baleRollPacking?.list || []);

    // Create a validation map from piece entries with dispatch/pack status for quick lookup
    const pieceEntryMap = useMemo(() => {
        const map = new Map<string, { isDispatched: number; isPacked: number }>();
        if (Array.isArray(pieceEntryList)) {
            pieceEntryList.forEach((entry: any) => {
                if (entry.pieceNumber) {
                    map.set(entry.pieceNumber, {
                        isDispatched: entry.isDispatched || 0,
                        isPacked: entry.isPacked || 0
                    });
                }
            });
        }
        return map;
    }, [pieceEntryList]);

    const packedPieceRollMap = useMemo(() => {
        const map = new Map<string, string>();
        const packings = Array.isArray(baleRollPackingList) ? baleRollPackingList : [];
        packings.forEach((packing: any) => {
            const rollNumber = packing?.rollOrBaleNo || "Not BaleRolled";
            (packing?.items || []).forEach((item: any) => {
                if (item?.pieceId != null) {
                    map.set(`ID:${item.pieceId}`, rollNumber);
                }
                if (item?.pieceNo) {
                    map.set(`PN:${item.pieceNo}`, rollNumber);
                }
            });
        });
        return map;
    }, [baleRollPackingList]);

    const displayedSelectedItems = useMemo(() => {
        if (formData.goodsType !== 'Yarn') {
            return selectedItems;
        }
        return selectedItems.map((item: any) => {
            const kgsPerBag = Number(item.kgsPerBag ?? item.kgPerBag ?? 0);
            const conesPerBag = Number(item.conesPerBag ?? item.noOfConesPerBag ?? 0);
            const conesWeight = item.conesWeight != null
                ? Number(item.conesWeight)
                : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);
            const totalQuantity = item.totalQuantity != null
                ? Number(item.totalQuantity)
                : Number(((item.noOfBags || 0) * kgsPerBag).toFixed(3));
            return {
                ...item,
                inwardNo: inwardNumberMap[item.inwardId] || item.inwardNo,
                kgPerBag: kgsPerBag,
                kgsPerBag,
                conesPerBag,
                conesWeight,
                totalQuantity
            };
        });
    }, [selectedItems, formData.goodsType, inwardNumberMap]);

    const handleDeleteItem = (slNo: number, idx: number) => {
        dispatch(removeFromSelectedItems(slNo));
        // Update issuedQtyMap to account for shifted indices
        const newMap: Record<number, number> = {};
        Object.keys(issuedQtyMap).forEach(key => {
            const k = parseInt(key);
            if (k < idx) {
                newMap[k] = issuedQtyMap[k];
            } else if (k > idx) {
                newMap[k - 1] = issuedQtyMap[k];
            }
        });
        setIssuedQtyMap(newMap);
        if (editingIdx === idx) {
            setEditingIdx(null);
        } else if (editingIdx !== null && editingIdx > idx) {
            setEditingIdx(editingIdx - 1);
        }
    };

    const handleAddItemGoodsItem = () => {
        if (!itemGoodsDraft.acceptedQty) {
            toast.error('Please fill required fields (Accepted Qty)');
            return;
        }
        const selected = normalizedItemList.find((i: any) => String(i?.id) === String(itemGoodsDraft.itemId));
        const newItem: ItemGoodsItem = {
            id: Date.now().toString(),
            itemId: itemGoodsDraft.itemId || '',
            itemName: selected?.itemName || selected?.name || '',
            noOfBags: itemGoodsDraft.noOfBags || 0,
            kgsPerBag: itemGoodsDraft.kgsPerBag || 0,
            acceptedQty: itemGoodsDraft.acceptedQty || 0,
            lotNo: itemGoodsDraft.lotNo || '',
            issuingBags: itemGoodsDraft.issuingBags || null,
        };
        setItemGoodsItems(prev => [...prev, newItem]);
        setItemGoodsDraft({});
        toast.success('Item added');
    };

    const handleDeleteItemGoodsItem = (id: string) =>
        setItemGoodsItems(prev => prev.filter(i => i.id !== id));

    const handleEditItemGoodsItem = (item: ItemGoodsItem) => {
        setItemGoodsDraft({ ...item });
        handleDeleteItemGoodsItem(item.id);
    };

    // filteredToGodownOptions is now computed above using useFilteredWarehouseOptions

    // Table data for modal
    // const modalTableData = useMemo(() => {
    //     if (formData.goodsType === 'Fabric' && formData.itemName) {
    //         const relevantPackings = baleRollPackingList.filter((packing: any) =>
    //             String(packing.fabricCodeId) === String(formData.itemName)
    //         );

    //         if (relevantPackings.length > 0) {
    //             // Use data from bale-roll-packing API with roll numbers
    //             return relevantPackings.flatMap((packing: any) =>
    //                 (packing.items || []).map((item: any) => {
    //                     return {
    //                         id: item.id,
    //                         rollNo: packing.rollOrBaleNo,
    //                         packingType: packing.packingType,
    //                         pieceNo: item.pieceNo,
    //                         meter: item.meters,
    //                         netWeight: item.netWeight,
    //                         avgWeight: item.avgWeight,
    //                         grossWeight: item.grossWeight,
    //                         fabricCodeId: packing.fabricCodeId,
    //                         packingId: packing.id,
    //                         isDisabled: false,
    //                         dataSource: 'packing'
    //                     };
    //                 })
    //             );
    //         } else {
    //             // Fallback to piece entry data when no packing data exists
    //             const filteredPieces = pieceEntryList.filter((entry: any) =>
    //                 String(entry.fabricMasterId) === String(formData.itemName) &&
    //                 !(entry.isDispatched === 1 && entry.isPacked === 1)
    //             );

    //             return filteredPieces.map((entry: any) => ({
    //                 id: entry.id,
    //                 rollNo: '',
    //                 packingType: '',
    //                 pieceNo: entry.pieceNumber,
    //                 meter: entry.quantity || entry.inspectedMtr || 0,
    //                 netWeight: entry.weight || entry.inspectedNtWt || 0,
    //                 avgWeight: entry.inspectedAvgWt || 0,
    //                 grossWeight: 0,
    //                 fabricCodeId: entry.fabricMasterId,
    //                 packingId: entry.packingId || null,
    //                 isDispatched: entry.isDispatched,
    //                 isPacked: entry.isPacked,
    //                 isDisabled: false,
    //                 dataSource: 'piece'
    //             }));
    //         }
    //     } else if (formData.goodsType === 'Yarn' && formData.itemName) {
    //         // Use yarn inward stock data if available
    //         if (yarnInwardStockData && yarnInwardStockData.length > 0) {
    //             return yarnInwardStockData.map((stock: any) => {
    //                 const millName = subCategoryList.find((sc: any) => String(sc.id) === String(stock.millId))?.subCategoryName || stock.millId || '';
    //                 return {
    //                     id: stock.orderItemId || stock.id,
    //                     inwardId: Number(stock.inwardId),
    //                     inwardNo: stock.inwardNo || stock.inwardId,
    //                     millName: millName,
    //                     lotNo: stock.lotNo || 'N/A',
    //                     noOfBags: stock.availableBags || 0,
    //                     kgPerBag: stock.kgsPerBag || 0,
    //                     totalQuantity: stock.availableQty || 0,
    //                     availableQty: stock.availableQty || 0,
    //                     acceptedQty: stock.acceptedQty || 0,
    //                     warehouseId: stock.warehouseId,
    //                     orderItemId: stock.orderItemId,
    //                     validationStatus: 'Valid',
    //                     isValidPiece: true,
    //                     dataSource: 'yarnStock'
    //                 };
    //             });
    //         }
    //         return [];
    //     }
    //     return [];
    // }, [formData.goodsType, formData.itemName, yarnInwardStockData, subCategoryList, baleRollPackingList, pieceEntryMap, pieceEntryList, inwardNumberMap]);
    const modalTableData = useMemo(() => {
        if (formData.goodsType === 'Fabric' && formData.itemName) {
            const relevantPackings = baleRollPackingList.filter((packing: any) => {
                const isFabricMatch = String(packing.fabricCodeId) === String(formData.itemName);
                const isWarehouseMatch = formData.fromGodown
                    ? String(packing.warehouseId || packing.godownId) === String(formData.fromGodown)
                    : true;
                return isFabricMatch && isWarehouseMatch;
            });

            if (relevantPackings.length > 0) {
                // Use data from bale-roll-packing API with roll numbers
                return relevantPackings.flatMap((packing: any) =>
                    (packing.items || []).map((item: any) => {
                        return {
                            id: item.id,
                            rollNo: packing.rollOrBaleNo,
                            packingType: packing.packingType,
                            pieceNo: item.pieceNo,
                            meter: item.meters,
                            netWeight: item.netWeight,
                            avgWeight: item.avgWeight,
                            grossWeight: item.grossWeight,
                            fabricCodeId: packing.fabricCodeId,
                            packingId: packing.id,
                            isDisabled: false,
                            dataSource: 'packing'
                        };
                    })
                );
            } else {
                // Fallback to piece entry data with the specified conditions
                const filteredPieces = pieceEntryList.filter((entry: any) => {
                    // Condition 1: fabricMasterId matches selected item
                    if (String(entry.fabricMasterId) !== String(formData.itemName)) {
                        return false;
                    }

                    // Condition 2: isInspected must be 1
                    if (Number(entry.isInspected) !== 1) {
                        return false;
                    }

                    // Condition 3: isDispatched must be 0
                    if (Number(entry.isDispatched) !== 0) {
                        return false;
                    }

                    // Condition 4: isParentPiece must be 0
                    if (Number(entry.isParentPiece) !== 0) {
                        return false;
                    }

                    // Condition 5: isStockTransfer must be false/0 when provided
                    if (entry.isStockTransfer !== undefined && entry.isStockTransfer !== null) {
                        const normalizedStockTransfer = typeof entry.isStockTransfer === 'string'
                            ? entry.isStockTransfer.trim().toLowerCase()
                            : entry.isStockTransfer;
                        if (
                            normalizedStockTransfer === true ||
                            normalizedStockTransfer === 1 ||
                            normalizedStockTransfer === '1' ||
                            normalizedStockTransfer === 'true'
                        ) {
                            return false;
                        }
                    }

                    // Condition 6: warehouseId should match fromGodown if both exist
                    if (formData.fromGodown && entry.warehouseId) {
                        if (String(entry.warehouseId) !== String(formData.fromGodown)) {
                            return false;
                        }
                    }

                    // Condition 7: Additional fabric code match if available
                    if (entry.fabricCode && formData.itemName) {
                        // You might need to compare with fabricCode if that's what you mean
                        // This depends on your data structure
                    }

                    // Condition 7: Should not be both dispatched AND packed
                    // This is already covered by isDispatched = 0 condition

                    return true;
                });

                return filteredPieces.map((entry: any) => {
                    const isPackedPiece = Number(entry.isPacked) === 1;
                    const rollLookupKeys = [
                        entry.id != null ? `ID:${entry.id}` : null,
                        entry.pieceId != null ? `ID:${entry.pieceId}` : null,
                        entry.pieceNumber ? `PN:${entry.pieceNumber}` : null
                    ].filter((key): key is string => Boolean(key));
                    let packedRollNumber: string | undefined;
                    for (const key of rollLookupKeys) {
                        const found = packedPieceRollMap.get(key);
                        if (found) {
                            packedRollNumber = found;
                            break;
                        }
                    }
                    const rollNoValue = isPackedPiece
                        ? packedRollNumber || "Not BaleRolled"
                        : entry.rollNo || '';

                    return {
                        id: entry.id,
                        rollNo: rollNoValue,
                        packingType: entry.packingType || '',
                        pieceNo: entry.pieceNumber,
                        meter: entry.quantity || entry.inspectedMtr || 0,
                        netWeight: entry.weight || entry.inspectedNtWt || 0,
                        avgWeight: entry.inspectedAvgWt || 0,
                        grossWeight: 0,
                        fabricCodeId: entry.fabricMasterId,
                        packingId: entry.packingId || null,
                        isDispatched: entry.isDispatched,
                        isPacked: entry.isPacked,
                        isParentPiece: entry.isParentPiece,
                        isInspected: entry.isInspected,
                        warehouseId: entry.warehouseId,
                        isDisabled: false,
                        dataSource: 'piece',
                        _debug: {
                            matchesFabric: String(entry.fabricMasterId) === String(formData.itemName),
                            isInspected: Number(entry.isInspected) === 1,
                            isDispatched: Number(entry.isDispatched) === 0,
                            isParentPiece: Number(entry.isParentPiece) === 0,
                            warehouseMatch: !formData.fromGodown || !entry.warehouseId ||
                                String(entry.warehouseId) === String(formData.fromGodown)
                        }
                    };
                });
            }
        } else if (formData.goodsType === 'Yarn' && formData.itemName) {
            // Use yarn inward stock data if available
            if (yarnInwardStockData && yarnInwardStockData.length > 0) {
                return yarnInwardStockData.filter((stock: any) => {
                    // Filter by warehouse if fromGodown is selected
                    if (formData.fromGodown && stock.warehouseId) {
                        if (String(stock.warehouseId) !== String(formData.fromGodown)) {
                            return false;
                        }
                    }
                    return true;
                }).map((stock: any) => {
                    const millName = subCategoryList.find((sc: any) => String(sc.id) === String(stock.millId))?.subCategoryName || stock.millId || '';
                    const kgsPerBag = Number(stock.kgsPerBag ?? stock.kgPerBag ?? 0);
                    const conesPerBag = Number(stock.conesPerBag ?? stock.noOfConesPerBag ?? 0);
                    const conesWeight = stock.conesWeight != null
                        ? Number(stock.conesWeight)
                        : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);
                    return {
                        id: stock.orderItemId || stock.id,
                        inwardId: Number(stock.inwardId),
                        inwardNo: stock.inwardNo || stock.inwardId,
                        millName: millName,
                        lotNo: stock.lotNo || 'N/A',
                        noOfBags: stock.availableBags || 0,
                        kgPerBag: kgsPerBag,
                        kgsPerBag,
                        conesPerBag,
                        conesWeight,
                        issuedQty: 0,
                        totalQuantity: stock.availableQty || 0,
                        availableQty: stock.availableQty || 0,
                        acceptedQty: stock.acceptedQty || 0,
                        warehouseId: stock.warehouseId,
                        orderItemId: stock.orderItemId,
                        validationStatus: 'Valid',
                        isValidPiece: true,
                        dataSource: 'yarnStock',
                        yarnInwardStockId: stock.id
                    };
                });
            }
            return [];
        }
        return [];
    }, [formData.goodsType, formData.itemName, formData.fromGodown, yarnInwardStockData, subCategoryList, baleRollPackingList, pieceEntryList, packedPieceRollMap]);
    // Fetch master data on component mount
    useEffect(() => {
        dispatch(getAllWarehouse({ fetchAll: true }));
        dispatch(getAllFabricMasters({ fetchAll: true }));
        dispatch(getAllYarnMasters({ fetchAll: true }));
        dispatch(getAllItemMasters({ fetchAll: true }));
        const storedCompany = typeof window !== 'undefined'
            ? (localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
            : null;
        const companyId = storedCompany ? Number(storedCompany) : undefined;
        if (companyId) {
            dispatch(getFactoryPieceEntriesByCompany(companyId) as any);
        }
        dispatch(getAllSubCategories({} as any));
        dispatch(clearSelectedItems());

        // If editing, populate form data and selected items
        if (existingTransfer) {
            let itemNameValue = String(existingTransfer.itemId || existingTransfer.itemName || '');

            console.log('Editing existing transfer:', existingTransfer);
            setFormData({
                transferDate: existingTransfer.transferDate ? existingTransfer.transferDate.split('T')[0] : new Date().toISOString().split('T')[0],
                fromGodown: String(existingTransfer.fromGodownId || existingTransfer.fromGodown),
                toGodown: String(existingTransfer.toGodownId || existingTransfer.toGodown),
                goodsType: existingTransfer.goodsType || 'Fabric',
                itemName: itemNameValue,
                // editNote: existingTransfer.editNote || '',
            });
            // Populate item goods items for editing
            if (existingTransfer.goodsType === 'Item' && existingTransfer.itemGoods && Array.isArray(existingTransfer.itemGoods)) {
                const items = existingTransfer.itemGoods.map((item: any, index: number) => ({
                    id: item.id || Date.now().toString() + index,
                    itemId: item.itemId || '',
                    itemName: item.itemName || '',
                    noOfBags: item.noOfBags || 0,
                    kgsPerBag: item.kgsPerBag || 0,
                    acceptedQty: item.acceptedQty || 0,
                    lotNo: item.lotNo || '',
                    issuingBags: item.issuingBags || null,
                    inwardNo: item.inwardNo || '',
                }));
                
                // Fetch available quantity and inward no data for each item
                const fromGodownId = existingTransfer.fromGodownId;
                const companyId = existingTransfer.companyId;
                
                if (fromGodownId && companyId) {
                    apiService.get(`/item-stock-details/filter?warehouseId=${fromGodownId}&companyId=${companyId}`)
                        .then((stockResponse: any) => {
                            const stockData = stockResponse.data || [];
                            
                            // Update items with stock data
                            const updatedItems = items.map((item: any) => {
                                const stockInfo = stockData.find((stock: any) => 
                                    stock.itemInwardStockDetails?.itemId === item.itemId
                                );
                                
                                if (stockInfo) {
                                    return {
                                        ...item,
                                        availableQty: stockInfo.itemInwardStockDetails?.acceptedQty || 0,
                                        inwardNo: stockInfo.itemInventory?.inwardNo || item.inwardNo
                                    };
                                }
                                return item;
                            });
                            
                            setItemGoodsItems(updatedItems);
                        })
                        .catch(error => {
                            console.error('Error fetching item stock details:', error);
                            // Still set items even if stock fetch fails
                            setItemGoodsItems(items);
                        });
                } else {
                    setItemGoodsItems(items);
                }
            }

            // Populate selected items based on goods type
            if (existingTransfer.goodsType === 'Fabric' && existingTransfer.fabricItems && Array.isArray(existingTransfer.fabricItems)) {
                existingTransfer.fabricItems.forEach((item: any) => {
                    dispatch(addFabricItemManual({
                        id: item.id,
                        rollNo: item.rollNo || '',
                        pieceNo: item.pieceNo || '',
                        meter: item.meter || 0,
                        netWeight: item.netWeight || 0,
                        avgWeight: item.avgWeight || 0
                    }));
                });
            } else if (existingTransfer.goodsType === 'Yarn' && existingTransfer.yarnItems && Array.isArray(existingTransfer.yarnItems)) {
                const newIssuedQtyMap: Record<number, number> = {};
                // Fetch yarn stock to get correct inwardNo mapping
                // const itemId = String(existingTransfer.itemId || existingTransfer.itemName || '');
                // if (itemId) {
                //     apiService.get(`/sizing-yarn-issues/yarn-inward-stock?itemId=${itemId}`)
                //         .then((stockResponse: any) => {
                //             let stockData = Array.isArray(stockResponse) ? stockResponse : (stockResponse?.data || []);
                //             const inwardNoMap: Record<number, string> = {};
                //             stockData.forEach((stock: any) => {
                //                 inwardNoMap[Number(stock.inwardId)] = stock.inwardNo;
                //             });

                //             existingTransfer.yarnItems.forEach((item: any) => {
                //                 const inwardId = Number(item.inwardId);
                //                 const inwardNo = inwardNoMap[inwardId] || item.inwardNo || inwardId;
                //                 dispatch(addYarnItemManual({
                //                     inwardId: inwardId,
                //                     inwardNo: String(inwardNo),
                //                     millName: item.millName || '',
                //                     lotNo: item.lotNo || '',
                //                     noOfBags: item.noOfBags || 0,
                //                     kgPerBag: item.kgsPerBag || item.kgPerBag || 0,
                //                     totalQuantity: item.totalQuantity || 0
                //                 }));
                //             });
                //         })
                //         .catch(() => {
                //             // Fallback if API fails
                //             existingTransfer.yarnItems.forEach((item: any) => {
                //                 dispatch(addYarnItemManual({
                //                     inwardId: Number(item.inwardId),
                //                     inwardNo: String(item.inwardNo),
                //                     millName: item.millName || '',
                //                     lotNo: item.lotNo || '',
                //                     noOfBags: item.noOfBags || 0,
                //                     kgPerBag: item.kgsPerBag || item.kgPerBag || 0,
                //                     totalQuantity: item.totalQuantity || 0
                //                 }));
                //             });
                //         });
                // } else {
                existingTransfer.yarnItems.forEach((item: any) => {
                    const kgsPerBag = Number(item.kgsPerBag ?? item.kgPerBag ?? 0);
                    const conesPerBag = Number(item.conesPerBag ?? item.noOfConesPerBag ?? 0);
                    const conesWeight = item.conesWeight != null
                        ? Number(item.conesWeight)
                        : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);

                    // Fallback for inwardId if it's missing but inwardNo contains the ID
                    const inwardIdValue = item.inwardId ? Number(item.inwardId) : (item.inwardNo && !isNaN(Number(item.inwardNo)) ? Number(item.inwardNo) : 0);

                    dispatch(addYarnItemManual({
                        id: item.id,
                        inwardId: inwardIdValue,
                        inwardNo: String(item.inwardNo),
                        millName: item.millName || '',
                        lotNo: item.lotNo || '',
                        noOfBags: item.noOfBags || 0,
                        kgPerBag: kgsPerBag,
                        kgsPerBag,
                        conesPerBag,
                        conesWeight,
                        totalQuantity: item.totalQuantity || 0,
                        issuedQty: item.issuedQty || 0
                    }));
                });
                // }
            }
        }
    }, [dispatch, existingTransfer]);
    const handleAddItemsFromModal = () => {
        const newItems: ItemGoodsItem[] = [];

        modalSelectedRows.forEach(idx => {
            const row = itemModalTableData[idx];
            if (row && !row.isAlreadyAdded) {
                newItems.push({
                    id: Date.now().toString() + Math.random() + idx,
                    itemId: row.itemId,
                    itemName: row.itemName,
                    noOfBags: row.noOfBags,
                    kgsPerBag: row.kgsPerBag,
                    acceptedQty: 0, // Set initial accepted qty to available qty
                    lotNo: row.lotNo,
                    issuingBags: null, // Initialize as null
                    inwardNo: row.inwardNo,        // Add this
                    availableQty: row.availableQty
                });
            }
        });

        if (newItems.length > 0) {
            setItemGoodsItems(prev => [...prev, ...newItems]);
            toast.success(`${newItems.length} item(s) added successfully`);
        } else {
            toast.warning('No new items selected or items already added');
        }

        setModalSelectedRows([]);
        setIsItemsModalOpen(false);
    };

    const handleEditItemClick = (item: ItemGoodsItem) => {
        setEditingItemId(item.id);
        setEditFormData({ ...item });
    };

    const handleSaveEdit = () => {
        if (editingItemId && editFormData) {
            setItemGoodsItems(prev => prev.map(item =>
                item.id === editingItemId
                    ? { ...item, ...editFormData }
                    : item
            ));
            setEditingItemId(null);
            setEditFormData({});
            toast.success('Item updated successfully');
        }
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
        setEditFormData({});
    };

    const handleDeleteItemGoods = (id: string) => {
        setItemGoodsItems(prev => prev.filter(item => item.id !== id));
        toast.success('Item removed successfully');
    };

    // Initialize issuedQtyMap when selectedItems are added
    useEffect(() => {
        const newMap = { ...issuedQtyMap };
        let changed = false;
        selectedItems.forEach((item: any, idx: number) => {
            // Only add if not already in the map, to preserve user edits
            if (newMap[idx] === undefined) {
                if (formData.goodsType === 'Yarn') {
                    newMap[idx] = item.issuedQty !== undefined ? item.issuedQty : (item.totalQuantity || 0);
                    changed = true;
                } else if (formData.goodsType === 'Fabric') {
                    newMap[idx] = item.issuedQty !== undefined ? item.issuedQty : (item.meter || 0);
                    changed = true;
                }
            }
        });
        // Only update if there are changes
        if (changed) {
            setIssuedQtyMap(newMap);
        }
    }, [selectedItems, formData.goodsType]);

    useEffect(() => {
        if (formData.goodsType === 'Yarn' && formData.itemName) {
            setLoadingYarnStock(true);
            apiService.get(buildYarnInwardStockUrl(formData.itemName, resolvedCompanyId))
                .then((response: any) => {
                    let stockData = [];
                    if (response && Array.isArray(response)) {
                        stockData = response;
                    } else if (response && response.data && Array.isArray(response.data)) {
                        stockData = response.data;
                    }

                    if (stockData.length > 0) {
                        setYarnInwardStockData(stockData);

                        // If editing and selectedItems don't have proper inwardNo, enrich them
                        const map: Record<number, string> = {};
                        stockData.forEach((stock: any) => {
                            if (stock.inwardId) {
                                map[Number(stock.inwardId)] = stock.inwardNo;
                            }
                        });
                        setInwardNumberMap(map);

                        if (existingTransfer && selectedItems.length > 0) {
                            // Check if any selectedItem has numeric inwardNo that should be updated
                            selectedItems.forEach((item: any) => {
                                if (map[item.inwardId] && item.inwardNo !== map[item.inwardId]) {
                                    item.inwardNo = map[item.inwardId];
                                }
                            });
                        }
                    } else {
                        setYarnInwardStockData([]);
                    }
                })
                .catch((error: any) => {
                    console.error('Error fetching yarn inward stock:', error);
                    setYarnInwardStockData([]);
                })
                .finally(() => {
                    setLoadingYarnStock(false);
                });
        } else {
            setYarnInwardStockData([]);
        }
    }, [formData.goodsType, formData.itemName, existingTransfer, selectedItems]);

    const clearFieldError = (field: string) => {
        setFormErrors(prev => {
            if (!prev[field]) {
                return prev;
            }
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => {
            const next = {
                ...prev,
                [field]: value
            };
            // Reset itemName, issuedQtyMap and itemGoodsItems if goodsType changes
            if (field === 'goodsType') {
                setFormData(prev => ({ ...prev, itemName: '' }));
                setIssuedQtyMap({});
                setItemGoodsItems([]);
                setItemGoodsDraft({});
            }
            if (field === 'fromGodown' && value === prev.toGodown) {
                next.toGodown = '';
            }
            return next;
        });
        clearFieldError(field);

        if (field === 'goodsType') {
            clearFieldError('itemName');
        }

        if (field === 'fromGodown' || field === 'toGodown') {
            clearFieldError('toGodown');
        }
    };

    // Get the selected item name from dropdown
    useEffect(() => {
        if (selectedItems.length > 0) {
            setFormErrors(prev => {
                if (!prev.selectedItems) {
                    return prev;
                }
                const next = { ...prev };
                delete next.selectedItems;
                return next;
            });
        }
    }, [selectedItems]);

    const selectedItemName = useMemo(() => {
        const selectedOption = itemNameOptions.find(opt => String(opt.value) === String(formData.itemName));
        return selectedOption?.label || 'Unknown';
    }, [formData.itemName, itemNameOptions]);

    // Calculate summary data for the summary table
    const summaryData = useMemo(() => {
        if (formData.goodsType === 'Item') {
            return itemGoodsItems.map((item, idx) => ({
                serialNo: idx + 1,
                itemName: item.itemName,
                noOfPiecesOrBags: item.noOfBags || 0,
                quantity: item.acceptedQty || 0,
            }));
        }
        return displayedSelectedItems.map((item: any, idx: number) => {
            if (formData.goodsType === 'Fabric') {
                return {
                    serialNo: idx + 1,
                    itemName: selectedItemName,
                    noOfPiecesOrBags: item.pieceNo ? 1 : 0,
                    quantity: issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.meter || 0),
                };
            } else {
                return {
                    serialNo: idx + 1,
                    itemName: selectedItemName,
                    noOfPiecesOrBags: item.noOfBags || 0,
                    quantity: issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.totalQuantity || 0),
                };
            }
        });
    }, [displayedSelectedItems, formData.goodsType, selectedItemName, issuedQtyMap, itemGoodsItems]);

    // Calculate totals for summary
    const totalSummary = useMemo(() => {
        return summaryData.reduce((acc: any, item: any) => ({
            totalPieces: acc.totalPieces + (item.noOfPiecesOrBags || 0),
            totalQuantity: acc.totalQuantity + (item.quantity || 0)
        }), { totalPieces: 0, totalQuantity: 0 });
    }, [summaryData]);

    const isFormReady = useMemo(() => {
        if (!formData.transferDate || !formData.fromGodown || !formData.toGodown || !formData.goodsType) {
            return false;
        }
        if (formData.fromGodown === formData.toGodown) {
            return false;
        }
        if (formData.goodsType === 'Item') {
            return itemGoodsItems.length > 0;
        }
        if (!formData.itemName) return false;
        if (selectedItems.length === 0) {
            return false;
        }
        return true;
    }, [formData.transferDate, formData.fromGodown, formData.toGodown, formData.goodsType, formData.itemName, selectedItems, itemGoodsItems]);

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.transferDate) {
            errors.transferDate = 'Required';
        }
        if (!formData.fromGodown) {
            errors.fromGodown = 'Required';
        }
        if (!formData.toGodown) {
            errors.toGodown = 'Required';
        } else if (formData.fromGodown && formData.fromGodown === formData.toGodown) {
            errors.toGodown = 'From and To must differ';
        }
        if (!formData.goodsType) {
            errors.goodsType = 'Required';
        }
        if (formData.goodsType === 'Item') {
            if (itemGoodsItems.length === 0) {
                errors.selectedItems = 'Add at least one item';
            }
        } else {
            if (!formData.itemName) {
                errors.itemName = 'Required';
            }
            if (selectedItems.length === 0) {
                errors.selectedItems = 'Select at least one item';
            }
        }
        return errors;
    };

    // Complete handleSubmit function
    const onSubmit = async (data: any) => {
        // event.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            alert(errors.selectedItems || 'Please fill all required fields');
            return;
        }
        setFormErrors({});

        // Get godown names
        const fromGodownName = warehouseList.find((w: any) => String(w.id) === String(formData.fromGodown))?.name || warehouseList.find((w: any) => String(w.id) === String(formData.fromGodown))?.warehouseName || '';
        const toGodownName = warehouseList.find((w: any) => String(w.id) === String(formData.toGodown))?.name || warehouseList.find((w: any) => String(w.id) === String(formData.toGodown))?.warehouseName || '';

        // Calculate total quantity based on items
        let totalQuantity = 0;
        if (formData.goodsType === 'Fabric' && selectedItems.length > 0) {
            totalQuantity = selectedItems.reduce((sum: number, item: any, idx: number) =>
                sum + (issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.meter || 0)), 0);
        } else if (formData.goodsType === 'Yarn' && selectedItems.length > 0) {
            totalQuantity = selectedItems.reduce((sum: number, item: any, idx: number) =>
                sum + (issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : ((item.noOfBags || 0) * (item.kgPerBag || 0))), 0);
        } else if (formData.goodsType === 'Item') {
            totalQuantity = itemGoodsItems.reduce((sum, item) => sum + Number(item.acceptedQty || 0), 0);
        }

        // Get item name based on goods type
        let itemName = formData.itemName;
        if (formData.goodsType === 'Yarn') {
            const selectedYarn = yarnMasterList.find((y: any) => String(y.id) === String(formData.itemName));
            itemName = selectedYarn?.yarnName || formData.itemName;
        } else if (formData.goodsType === 'Fabric') {
            const selectedFabric = fabricMasterList.find((f: any) => String(f.id) === String(formData.itemName));
            itemName = selectedFabric?.fabricCode || formData.itemName;
        }

        // Auto-fetch companyId from localStorage
        const storedCompanyId = typeof window !== 'undefined'
            ? (localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
            : null;
        const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;

        let stockTransferNo = data.stockTransferNo || existingTransfer?.stockTransferNo || "";
        if (!existingTransfer && !stockTransferNo) {
            try {
                const docResponse = await documentNumberService.generateDocumentNumber({
                    screenName: "Stock Transfer",
                });
                stockTransferNo = docResponse.documentNumber;
            } catch (error) {
                console.warn("Failed to generate document number:", error);
            }
        }
        isSavingRef.current = true;

        // Prepare the payload
        const payload: any = {
            date: formData.transferDate,
            stockTransferNo: stockTransferNo,
            fromGodownId: parseInt(formData.fromGodown),
            fromGodownName: fromGodownName,
            toGodownId: parseInt(formData.toGodown),
            toGodownName: toGodownName,
            goodsType: formData.goodsType,
            itemId: parseInt(formData.itemName),
            itemName: itemName,
            quantity: totalQuantity,
            companyId: companyId,

            // Array of items based on goods type
            ...(formData.goodsType === 'Fabric' && {
                fabricItems: selectedItems.map((item: any, idx: number) => ({
                    id: item.id,
                    rollNo: item.rollNo || '',
                    pieceNo: item.pieceNo || '',
                    meter: item.meter || 0,
                    netWeight: item.netWeight || 0,
                    avgWeight: item.avgWeight || 0,
                    issuedQty: issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.issuedQty || item.meter || 0)
                }))
            }),

            ...(formData.goodsType === 'Yarn' && {
                yarnItems: displayedSelectedItems.map((item: any, idx: number) => ({
                    id: item.id,
                    inwardId: item.inwardId ? Number(item.inwardId) : (item.inwardNo && !isNaN(Number(item.inwardNo)) ? Number(item.inwardNo) : null),
                    inwardNo: item.inwardNo || '',
                    millName: item.millName || '',
                    lotNo: item.lotNo || '',
                    noOfBags: item.noOfBags || 0,
                    kgsPerBag: item.kgsPerBag || item.kgPerBag || 0,
                    totalQuantity: item.totalQuantity || ((item.noOfBags || 0) * (item.kgsPerBag || item.kgPerBag || 0)),
                    issuedQty: issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.issuedQty || 0),
                    conesPerBag: item.conesPerBag || 0,
                    conesWeight: item.conesWeight || 0
                }))
            }),

            ...(formData.goodsType === 'Item' && {
                itemGoods: itemGoodsItems.map((item, index) => ({
                    sNo: index + 1,
                    itemId: item.itemId ? Number(item.itemId) : null,
                    itemName: item.itemName || '',
                    noOfBags: Number(item.noOfBags),
                    kgsPerBag: Number(item.kgsPerBag),
                    acceptedQty: Number(item.acceptedQty),
                    lotNo: item.lotNo || '',
                    issuingBags: item.issuingBags  // Include issuingBags in payload
                }))
            }),

            ...(existingTransfer && { id: existingTransfer.id })
        };

        console.log('Submitting Stock Transfer Payload:', payload);

        try {
            if (existingTransfer) {
                await dispatch(updateStockTransfer({ ...payload, companyId })).unwrap();

            }
            else {
                await dispatch(createStockTransfer(payload)).unwrap();
                documentNumberService.clearMemoryCache("Stock Transfer");
            }
            navigate('/transaction/stock-transfers');
        } catch (error: any) {
            console.error('Error saving stock transfer:', error);
            // alert('Failed to save stock transfer: ' + (error.message || 'Unknown error'));
        }
    };

    return (
        <div className="space-y-6 mt-8 p-4">
            {/* Header */}
            <div className="flex justify-between items-center">


                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/transaction/stock-transfers")}
                        className="mr-auto"
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">
                        {existingTransfer ? 'Edit Stock Transfer' : 'Add Stock Transfer'}
                    </h1>
                </div>

                <div className="flex gap-2">
                    {/* <Button
                        variant="outline"
                        onClick={() => navigate('/transaction/stock-transfer')}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button> */}
                   
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-6">
                    {/* Basic Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium  mb-1">Stock Transfer No</label>
                                    <input type="text"
                                        className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                                            !watch('stockTransferNo') || watch('stockTransferNo')?.startsWith('Loading')
                                                ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                                                : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                                        }`}
                                        placeholder="Loading sequence..."
                                        {...register('stockTransferNo')} readOnly />

                                </div>
                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded px-2 py-2"
                                        value={formData.transferDate}
                                        onChange={e => handleInputChange('transferDate', e.target.value)}
                                    />
                                    {formErrors.transferDate && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.transferDate}</p>
                                    )}
                                </div>
                                {/* Goods Type */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Goods Type</label>
                                    <CommonSearchableSelect
                                        value={formData.goodsType}
                                        onValueChange={(value) => handleInputChange('goodsType', value)}
                                        options={[
                                            { value: "Fabric", label: "Fabric" },
                                            { value: "Yarn", label: "Yarn" },
                                            { value: "Item", label: "Item" }
                                        ]}
                                        filterActive
                                        error={formErrors.goodsType}
                                    />
                                </div>
                                {/* Item Name — only for Fabric/Yarn */}
                                {formData.goodsType !== 'Item' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Item Name</label>
                                        <CommonSearchableSelect
                                            placeholder="Select Item"
                                            value={formData.itemName}
                                            onValueChange={(value) => handleInputChange('itemName', value)}
                                            options={itemNameOptions.map((opt: any) => ({
                                                value: String(opt.value),
                                                label: opt.label,
                                                activeFlag: opt.activeFlag ?? true,
                                            }))}
                                            filterActive
                                            error={formErrors.itemName}
                                        />
                                    </div>
                                )}
                                {/* From Godown */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">From Godown</label>
                                    <CommonSearchableSelect
                                        placeholder="Select From Godown"
                                        value={formData.fromGodown}
                                        onValueChange={(value) => handleInputChange('fromGodown', value)}
                                        options={fromGodownOptions}
                                        filterActive
                                        error={formErrors.fromGodown}
                                    />
                                </div>

                                {/* To Godown */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">To Godown</label>
                                    <CommonSearchableSelect
                                        placeholder={formData.fromGodown ? (filteredToGodownOptions.length === 0 ? 'No other warehouses available' : 'Select To Godown') : 'Select From Godown first'}
                                        value={formData.toGodown}
                                        onValueChange={(value) => handleInputChange('toGodown', value)}
                                        options={filteredToGodownOptions}
                                        disabled={!formData.fromGodown}
                                        filterActive
                                        error={formErrors.toGodown}
                                    />
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    {/* Item Goods Card — only for Item type */}
                    {/* Item Goods Card — only for Item type */}
                    {formData.goodsType === 'Item' && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Item Goods</CardTitle>
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={() => setIsItemsModalOpen(true)}
                                    disabled={!formData.fromGodown}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Items from Stock
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {itemGoodsItems.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                        <p>No items added yet</p>
                                        <p className="text-sm mt-2">Click "Add Items from Stock" to select items from available stock</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border border-gray-300 px-3 py-2 text-left">S.No</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-left">Item Name</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-left">Inward No</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-left">Lot No</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-right">No of Bags</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-right">Kgs/Bag</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-right">Available Qty</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-right">Issuing Bags</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-right">Issued Qty *</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {itemGoodsItems.map((item, index) => (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        {editingItemId === item.id ? (
                                                            // Edit Mode
                                                            <>
                                                                <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                                                                <td className="border border-gray-300 px-3 py-2">{item.itemName}</td>
                                                                <td className="border border-gray-300 px-3 py-2">{item.inwardNo || '-'}</td>
                                                                <td className="border border-gray-300 px-3 py-2">
                                                                    <Input
                                                                        value={editFormData.lotNo || ''}
                                                                        onChange={(e) => setEditFormData({ ...editFormData, lotNo: e.target.value })}
                                                                        className="w-full"
                                                                    />
                                                                </td>
                                                                <td className="border border-gray-300 px-3 py-2">
                                                                    <Input
                                                                        type="number"
                                                                        value={editFormData.noOfBags || 0}
                                                                        onChange={(e) => setEditFormData({ ...editFormData, noOfBags: parseFloat(e.target.value) || 0 })}
                                                                        className="w-full"
                                                                    />
                                                                </td>
                                                                <td className="border border-gray-300 px-3 py-2">
                                                                    <Input
                                                                        type="number"
                                                                        value={editFormData.kgsPerBag || 0}
                                                                        onChange={(e) => setEditFormData({ ...editFormData, kgsPerBag: parseFloat(e.target.value) || 0 })}
                                                                        className="w-full"
                                                                    />
                                                                </td>
                                                                <td className="border border-gray-300 px-3 py-2 text-right">
                                                                    {item.availableQty || 0}
                                                                </td>
                                                                <td className="border border-gray-300 px-3 py-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Enter issuing bags"
                                                                        value={editFormData.issuingBags === null ? '' : editFormData.issuingBags}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value === '' ? null : parseFloat(e.target.value);
                                                                            setEditFormData({ ...editFormData, issuingBags: value });
                                                                        }}
                                                                        className="w-full"
                                                                    />
                                                                </td>
                                                                <td className="border border-gray-300 px-3 py-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Enter issued qty"
                                                                        value={editFormData.acceptedQty === 0 ? '' : editFormData.acceptedQty}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                                            setEditFormData({ ...editFormData, acceptedQty: value || 0 });
                                                                        }}
                                                                        className={`w-full ${(editFormData.acceptedQty || 0) > (item.availableQty || 0) ? 'border-red-500' : ''}`}
                                                                    />
                                                                    {(editFormData.acceptedQty || 0) > (item.availableQty || 0) && (
                                                                        <p className="text-red-500 text-xs mt-1">Exceeds available stock!</p>
                                                                    )}
                                                                </td>
                                                                <td className="border border-gray-300 px-3 py-2 text-center">
                                                                    <div className="flex justify-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            onClick={handleSaveEdit}
                                                                            disabled={(editFormData.acceptedQty || 0) > (item.availableQty || 0)}
                                                                        >
                                                                            Save
                                                                        </Button>
                                                                        <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit}>
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            // View Mode
                                                            <>
                                                                <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                                                                <td className="border border-gray-300 px-3 py-2">{item.itemName}</td>
                                                                <td className="border border-gray-300 px-3 py-2">{item.inwardNo || '-'}</td>
                                                                <td className="border border-gray-300 px-3 py-2">{item.lotNo || '-'}</td>
                                                                <td className="border border-gray-300 px-3 py-2 text-right">{item.noOfBags}</td>
                                                                <td className="border border-gray-300 px-3 py-2 text-right">{item.kgsPerBag}</td>
                                                                <td className="border border-gray-300 px-3 py-2 text-right">{item.availableQty || 0}</td>
                                                                <td className="border border-gray-300 px-3 py-2 text-right">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Issuing Bags"
                                                                        value={item.issuingBags === null ? '' : item.issuingBags}
                                                                        onChange={(e) => {
                                                                            const newValue = e.target.value === '' ? null : parseFloat(e.target.value);
                                                                            const updated = [...itemGoodsItems];
                                                                            updated[index] = { ...updated[index], issuingBags: newValue };
                                                                            setItemGoodsItems(updated);
                                                                        }}
                                                                        className="w-full"
                                                                    />
                                                                </td>
                                                                <td className="border border-gray-300 px-3 py-2 text-right">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Issued Qty"
                                                                        value={item.acceptedQty || 0}
                                                                        onChange={(e) => {
                                                                            const newValue = parseFloat(e.target.value) || 0;
                                                                            const updated = [...itemGoodsItems];
                                                                            updated[index] = { ...updated[index], acceptedQty: newValue };
                                                                            setItemGoodsItems(updated);
                                                                        }}
                                                                        className={`w-full ${item.acceptedQty > (item.availableQty || 0) ? 'border-red-500' : ''}`}
                                                                    />
                                                                    {item.acceptedQty > (item.availableQty || 0) && (
                                                                        <p className="text-red-500 text-xs mt-1">Exceeds available stock!</p>
                                                                    )}
                                                                </td>
                                                                <td className="border border-gray-300 px-3 py-2 text-center">
                                                                    <div className="flex justify-center gap-2">
                                                                        <Button type="button" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditItemClick(item)}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button type="button" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteItemGoods(item.id)}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {formErrors.selectedItems && (
                                    <p className="text-red-500 text-sm mt-3">{formErrors.selectedItems}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}


                    {/* Selected Items Table with Select Items Button */}
                    {formData.goodsType !== 'Item' && (<>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Selected Items</CardTitle>
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={() => setIsItemsModalOpen(true)}
                                    disabled={!formData.itemName}
                                >
                                    Select Items
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left">S.No</th>
                                                {formData.goodsType === 'Fabric' ? (
                                                    <>
                                                        <th className="px-3 py-2 text-left">Roll No</th>
                                                        <th className="px-3 py-2 text-left">Piece No</th>
                                                        <th className="px-3 py-2 text-right">Meter</th>
                                                        <th className="px-3 py-2 text-right">Net Weight</th>
                                                        <th className="px-3 py-2 text-right">Avg Weight</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="px-3 py-2 text-left">Inward No</th>
                                                        <th className="px-3 py-2 text-left">Mill Name</th>
                                                        <th className="px-3 py-2 text-left">Lot No</th>
                                                        <th className="px-3 py-2 text-right">No of Bags</th>
                                                        <th className="px-3 py-2 text-right">Kg/Bag</th>
                                                        <th className="px-3 py-2 text-right">Cones per Bags</th>
                                                        <th className="px-3 py-2 text-right">Cones weight</th>
                                                        <th className="px-3 py-2 text-right">Total Quantity</th>
                                                        <th className="px-3 py-2 text-right">Issued Qty</th>

                                                    </>
                                                )}
                                                <th className="px-3 py-2 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {displayedSelectedItems.map((item: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="px-3 py-2 text-left">{idx + 1}</td>
                                                    {formData.goodsType === 'Fabric' ? (
                                                        <>
                                                            <td className="px-3 py-2 text-left">{item.rollNo}</td>
                                                            <td className="px-3 py-2 text-left">{item.pieceNo}</td>
                                                            <td className="px-3 py-2 text-right">{item.meter}</td>
                                                            <td className="px-3 py-2 text-right">{item.netWeight}</td>
                                                            <td className="px-3 py-2 text-right">{item.avgWeight}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-3 py-2 text-left">{item.inwardNo}</td>
                                                            <td className="px-3 py-2 text-left">{item.millName}</td>
                                                            <td className="px-3 py-2 text-left">{item.lotNo}</td>
                                                            <td className="px-3 py-2 text-right">{item.noOfBags}</td>
                                                            <td className="px-3 py-2 text-right">{Number(item.kgsPerBag ?? item.kgPerBag ?? 0).toFixed(3)}</td>
                                                            <td className="px-3 py-2 text-right">{Number(item.conesPerBag ?? 0)}</td>
                                                            <td className="px-3 py-2 text-right">{Number(item.conesWeight ?? 0).toFixed(3)}</td>
                                                            <td className="px-3 py-2 text-right">{Number(item.totalQuantity ?? ((item.noOfBags || 0) * (item.kgsPerBag || item.kgPerBag || 0))).toFixed(3)}</td>
                                                            <td className="px-3 py-2 text-center">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className={`w-20 border rounded px-2 py-1 text-right ${(isGlobalEditing || editingIdx === idx) ? 'bg-white' : 'bg-gray-100 cursor-not-allowed'}`}
                                                                    value={issuedQtyMap[idx] !== undefined ? issuedQtyMap[idx] : (item.issuedQty || 0)}
                                                                    onChange={(e) => {
                                                                        const newValue = parseFloat(e.target.value) || 0;
                                                                        setIssuedQtyMap(prev => ({ ...prev, [idx]: newValue }));
                                                                    }}
                                                                    readOnly={!isGlobalEditing && editingIdx !== idx}
                                                                />
                                                            </td>
                                                        </>
                                                    )}

                                                    <td className="px-3 py-2 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <Button
                                                                type="button"
                                                                // variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => {
                                                                    if (isGlobalEditing) {
                                                                        setIsGlobalEditing(false);
                                                                        setEditingIdx(idx);
                                                                    } else {
                                                                        setEditingIdx(editingIdx === idx ? null : idx);
                                                                    }
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                // variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => handleDeleteItem(item.slNo, idx)}
                                                            >
                                                                <Trash2 className="h-4 w-4 " />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {(isGlobalEditing || editingIdx !== null) && (
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                setIsGlobalEditing(false);
                                                setEditingIdx(null);
                                            }}
                                        >
                                            Save Item
                                        </Button>
                                    </div>
                                )}
                                {formErrors.selectedItems && (
                                    <p className="text-red-500 text-sm mt-3">{formErrors.selectedItems}</p>
                                )}
                            </CardContent>
                        </Card>

                    </>)}

                    {/* Summary Table Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="min-w-full border">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">S.No</th>
                                            <th className="px-3 py-2 text-left">Item Name</th>
                                            <th className="px-3 py-2 text-right">No of Pieces/Bags</th>
                                            <th className="px-3 py-2 text-right">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {summaryData.map((row: any) => (
                                            <tr key={row.serialNo}>
                                                <td className="px-3 py-2 text-left">{row.serialNo}</td>
                                                <td className="px-3 py-2 text-left">{row.itemName}</td>
                                                <td className="px-3 py-2 text-right">{row.noOfPiecesOrBags}</td>
                                                <td className="px-3 py-2 text-right">{row.quantity}</td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}
                                        <tr className="bg-gray-50 font-semibold">
                                            <td className="px-3 py-2 text-left" colSpan={2}>Total</td>
                                            <td className="px-3 py-2 text-right">{totalSummary.totalPieces}</td>
                                            <td className="px-3 py-2 text-right">{totalSummary.totalQuantity}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 <div className='flex justify-end mt-4'>
                    <Button
                        type="submit"
                        disabled={saving || !isFormReady}
                        onClick={(e) => {
                            e.preventDefault();
                            const form = document.querySelector('form');
                            if (form) {
                                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                            }
                        }}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? (existingTransfer ? 'Updating...' : 'Saving...') : (existingTransfer ? 'Update' : 'Save')}
                    </Button>
                    </div>
            </form>

            
            <Modal
                isOpen={isItemsModalOpen}
                onClose={() => {
                    setIsItemsModalOpen(false);
                    setModalSelectedRows([]);
                }}
                title={`Select ${formData.goodsType} Items`}
                className="max-w-5xl"
            >
                <div className="space-y-6">
                    <div className="overflow-x-auto">
                        {/* Item Goods Type Table */}
                        {formData.goodsType === 'Item' && (
                            <table className="min-w-full border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-center">Select</th>
                                        <th className="px-3 py-2 text-left">Inward No</th>
                                        <th className="px-3 py-2 text-left">Item Name</th>
                                        <th className="px-3 py-2 text-left">Lot No</th>
                                        <th className="px-3 py-2 text-right">No of Bags</th>
                                        <th className="px-3 py-2 text-right">Kg/Bag</th>
                                        <th className="px-3 py-2 text-right">Available Qty</th>
                                        <th className="px-3 py-2 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loadingItemStock ? (
                                        <tr>
                                            <td colSpan={8} className="px-3 py-2 text-center text-gray-500">
                                                Loading items...
                                            </td>
                                        </tr>
                                    ) : itemModalTableData.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-3 py-2 text-center text-gray-500">
                                                No items available in stock for the selected godown
                                            </td>
                                        </tr>
                                    ) : (
                                        itemModalTableData.map((row: any, idx: number) => (
                                            <tr key={row.id} className={row.isAlreadyAdded ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50'}>
                                                <td className="px-3 py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={modalSelectedRows.includes(idx)}
                                                        disabled={row.isAlreadyAdded}
                                                        onChange={e => {
                                                            if (e.target.checked && !row.isAlreadyAdded) {
                                                                setModalSelectedRows(prev => [...prev, idx]);
                                                            } else {
                                                                setModalSelectedRows(prev => prev.filter(i => i !== idx));
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-left">{row.inwardNo}</td>
                                                <td className="px-3 py-2 text-left">{row.itemName}</td>
                                                <td className="px-3 py-2 text-left">{row.lotNo || 'N/A'}</td>
                                                <td className="px-3 py-2 text-right">{row.noOfBags}</td>
                                                <td className="px-3 py-2 text-right">{row.kgsPerBag}</td>
                                                <td className="px-3 py-2 text-right">{row.availableQty}</td>
                                                <td className="px-3 py-2 text-center">
                                                    {row.isAlreadyAdded ? (
                                                        <span className="text-yellow-600 text-sm font-medium">Already Added</span>
                                                    ) : (
                                                        <span className="text-green-600 text-sm font-medium">Available</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* Fabric Goods Type Table */}
                        {formData.goodsType === 'Fabric' && (
                            <table className="min-w-full border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-center">Select</th>
                                        {modalTableData.some((row: any) => row.rollNo && row.packingType === 'Roll') && (
                                            <th className="px-3 py-2 text-left">Roll No</th>
                                        )}
                                        {modalTableData.some((row: any) => !row.rollNo || row.dataSource === 'piece') && (
                                            <th className="px-3 py-2 text-left">Piece No</th>
                                        )}
                                        <th className="px-3 py-2 text-right">Meter</th>
                                        <th className="px-3 py-2 text-right">Net Weight</th>
                                        <th className="px-3 py-2 text-right">Avg Weight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {modalTableData.map((row: any, idx: number) => (
                                        <tr key={row.id} className={row.isDisabled ? 'bg-gray-100 opacity-60' : ''}>
                                            <td className="px-3 py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={modalSelectedRows.includes(idx)}
                                                    disabled={row.isDisabled}
                                                    onChange={e => {
                                                        if (e.target.checked && !row.isDisabled) {
                                                            setModalSelectedRows(prev => [...prev, idx]);
                                                        } else {
                                                            setModalSelectedRows(prev => prev.filter(i => i !== idx));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            {row.rollNo && row.packingType === 'Roll' && (
                                                <td className="px-3 py-2 text-left">{row.rollNo}</td>
                                            )}
                                            {(!row.rollNo || row.dataSource === 'piece') && (
                                                <td className="px-3 py-2 text-left">{row.pieceNo}</td>
                                            )}
                                            <td className="px-3 py-2 text-right">{row.meter}</td>
                                            <td className="px-3 py-2 text-right">{row.netWeight}</td>
                                            <td className="px-3 py-2 text-right">{row.avgWeight}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Yarn Goods Type Table */}
                        {formData.goodsType === 'Yarn' && (
                            <table className="min-w-full border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-center">Select</th>
                                        <th className="px-3 py-2 text-left">Inward No</th>
                                        <th className="px-3 py-2 text-left">Mill Name</th>
                                        <th className="px-3 py-2 text-left">Lot No</th>
                                        <th className="px-3 py-2 text-right">No of Bags</th>
                                        <th className="px-3 py-2 text-right">Kg/Bag</th>
                                        <th className="px-3 py-2 text-right">Cones per Bags</th>
                                        <th className="px-3 py-2 text-right">Cones weight</th>
                                        <th className="px-3 py-2 text-right">Total Quantity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {modalTableData.map((row: any, idx: number) => (
                                        <tr key={row.id}>
                                            <td className="px-3 py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={modalSelectedRows.includes(idx)}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            setModalSelectedRows(prev => [...prev, idx]);
                                                        } else {
                                                            setModalSelectedRows(prev => prev.filter(i => i !== idx));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-left">{row.inwardNo}</td>
                                            <td className="px-3 py-2 text-left">{row.millName}</td>
                                            <td className="px-3 py-2 text-left">{row.lotNo}</td>
                                            <td className="px-3 py-2 text-right">{row.noOfBags}</td>
                                            <td className="px-3 py-2 text-right">{row.kgPerBag}</td>
                                            <td className="px-3 py-2 text-right">{row.conesPerBag}</td>
                                            <td className="px-3 py-2 text-right">{row.conesWeight}</td>
                                            <td className="px-3 py-2 text-right">{row.totalQuantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>


                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsItemsModalOpen(false);
                                setModalSelectedRows([]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (formData.goodsType === 'Item') {
                                    handleAddItemsFromModal();
                                } else if (formData.goodsType === 'Fabric') {
                                    // Add selected items to Redux for Fabric
                                    modalSelectedRows.forEach(idx => {
                                        const row = modalTableData[idx];
                                        dispatch({
                                            type: 'stockTransfer/addFabricItemManual',
                                            payload: {
                                                rollNo: row.rollNo,
                                                pieceNo: row.pieceNo,
                                                meter: row.meter,
                                                netWeight: row.netWeight,
                                                avgWeight: row.avgWeight,
                                            }
                                        });
                                    });
                                    setModalSelectedRows([]);
                                    setIsItemsModalOpen(false);
                                    setIsGlobalEditing(true);
                                } else if (formData.goodsType === 'Yarn') {
                                    // Add selected items to Redux for Yarn
                                    modalSelectedRows.forEach(idx => {
                                        const row = modalTableData[idx];
                                        dispatch({
                                            type: 'stockTransfer/addYarnItemManual',
                                            payload: {
                                                inwardId: Number(row.inwardId),
                                                inwardNo: row.inwardNo,
                                                millName: row.millName,
                                                lotNo: row.lotNo,
                                                noOfBags: row.noOfBags,
                                                kgPerBag: row.kgsPerBag ?? row.kgPerBag,
                                                kgsPerBag: row.kgsPerBag ?? row.kgPerBag,
                                                conesPerBag: row.conesPerBag,
                                                conesWeight: row.conesWeight,
                                                totalQuantity: row.totalQuantity ?? ((row.noOfBags || 0) * (row.kgsPerBag ?? row.kgPerBag ?? 0)),
                                            }
                                        });
                                    });
                                    setModalSelectedRows([]);
                                    setIsItemsModalOpen(false);
                                    setIsGlobalEditing(true);
                                }
                            }}
                            disabled={(formData.goodsType === 'Item' && modalSelectedRows.length === 0) ||
                                (formData.goodsType === 'Fabric' && modalSelectedRows.length === 0) ||
                                (formData.goodsType === 'Yarn' && modalSelectedRows.length === 0)}
                        >
                            Add Selected Items ({modalSelectedRows.length})
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* Validation Detail Modal */}
            <Modal
                isOpen={isValidationDetailOpen}
                onClose={() => {
                    setIsValidationDetailOpen(false);
                    setSelectedValidationItem(null);
                }}
                title="Piece Validation Details"
                className="max-w-md"
            >
                {selectedValidationItem && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded border">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Piece Number</p>
                                    <p className="font-semibold text-lg">{selectedValidationItem.pieceNo}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Roll Number</p>
                                    <p className="font-semibold">{selectedValidationItem.rollNo}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-3">Validation Status</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Piece Entry Found:</span>
                                    <span className={`text-sm font-semibold px-2 py-1 rounded ${selectedValidationItem.isValidPiece
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {selectedValidationItem.isValidPiece ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                {selectedValidationItem.isValidPiece && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Is Packed (is_packed):</span>
                                            <span className={`text-sm font-semibold px-2 py-1 rounded ${selectedValidationItem.isPacked === 1
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {selectedValidationItem.isPacked === 1 ? 'Yes (1)' : `No (${selectedValidationItem.isPacked})`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Is Dispatched (is_dispatched):</span>
                                            <span className={`text-sm font-semibold px-2 py-1 rounded ${selectedValidationItem.isDispatched === 1
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {selectedValidationItem.isDispatched === 1 ? 'Yes (1)' : `No (${selectedValidationItem.isDispatched})`}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={`p-4 rounded border ${selectedValidationItem.isDisabled
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-green-50 border-green-200'
                            }`}>
                            <p className="text-sm font-semibold mb-2">Selection Status</p>
                            {selectedValidationItem.isDisabled ? (
                                <p className="text-sm text-yellow-800">
                                    ⚠️ This item is <strong>disabled</strong> because:
                                    <br />
                                    {selectedValidationItem.isPacked !== 1 && (
                                        <span>• Not packed (is_packed ≠ 1)<br /></span>
                                    )}
                                    {selectedValidationItem.isDispatched === 0 && (
                                        <span>• Not dispatched (is_dispatched = 0)<br /></span>
                                    )}
                                </p>
                            ) : (
                                <p className="text-sm text-green-800">
                                    ✓ This item is <strong>enabled</strong> for selection.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsValidationDetailOpen(false);
                                    setSelectedValidationItem(null);
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}