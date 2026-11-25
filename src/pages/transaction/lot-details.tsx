// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { FileText, ClipboardList, Edit, Trash2, Save, Plus, AlertCircle, ArrowLeft, X, FileDown, Upload, Eye } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/state/store";
// import { createPurchaseInward, updatePurchaseInward } from "@/state/purchaseInwardSlice";
// import { getAllPoTypes } from '@/state/purchaseOrderSlice';
// import { getAllWarehouse } from '@/state/warehouseSlice';
// import { getAllFabricMasters } from "@/state/fabricMasterSlice";
// import { getAllKnittedFabricMasters } from "@/state/knittedMasterSlice";
// import documentNumberService from '@/services/DocumentNumberService';
// import { useAutoDocumentNumber } from '@/components/common/useAutoDocumentNumber';
// import { toast } from 'react-toastify';
// import { generateExcelTemplate, readExcelFile } from '@/lib/utils';
// import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';

// // PO TYPE CONSTANTS
// const PO_TYPE_YARN = 1;
// const PO_TYPE_WOVEN_FABRIC = 2;
// const PO_TYPE_KNITTED_FABRIC = 11;
// const PO_TYPE_ITEM = 3;

// const FABRIC_TEMPLATE_HEADERS = [
//   'Warehouse Name',
//   'Fabric Code',
//   'Piece No',
//   'Piece Meter',
//   'Net Weight',
//   'Remarks'
// ];

// const YARN_TEMPLATE_HEADERS = [
//   'Warehouse Name',
//   'Lot No',
//   'No Of Bags',
//   'Kgs/Bag',
//   'Accepted Qty',
//   'Rejected Qty',
//   'Cones Per Bag',
//   'Remark'
// ];

// const ITEM_TEMPLATE_HEADERS = [
//   'Warehouse Name',
//   'Lot No',
//   'No Of Bags',
//   'Kgs/Bag',
//   'Accepted Qty',
//   'Rejected Qty',
//   'Remark'
// ];

// const EXCEL_ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

// interface YarnStockDetail {
//   id: number;
//   inwardId?: number;  // ADD THIS - for tracking which PurchaseInward this belongs to
//   lotNo?: string;
//   inwardQty: number;
//   acceptedQty: number;
//   rejectedQty: number;
//   inwardBags: number;
//   kgsPerBag: number;
//   conesPerBag?: number;
//   conesWeight?: number;
//   remark: string;
//   warehouseId: string;
//   itemId?: number | null;
//   uomId?: number | null;
//   yarnId?: number | null;
//   fabricId?: number | null;
//   orderItemId?: number | null;
//   isInspected?: number | boolean;
//   yarnTypeId?: string | number | null;
// }


// // interface YarnStockDetail {
// //   id: number;
// //   lotNo?: string;
// //   inwardQty: number;
// //   acceptedQty: number;
// //   rejectedQty: number;
// //   inwardBags: number;  // This is noOfBags
// //   kgsPerBag: number;
// //   conesPerBag?: number;
// //   conesWeight?: number;
// //   remark: string;
// //   warehouseId: string;
// //   itemId?: number | null;
// //   uomId?: number | null;
// //   yarnId?: number | null;
// //   fabricId?: number | null;
// //   orderItemId?: number | null;
// //   isInspected?: number | boolean;
// // }

// interface ItemStockDetail {
//   id: number;
//   lotNo?: string;
//   inwardQty: number;
//   acceptedQty: number;
//   rejectedQty: number;
//   inwardBags: number;
//   kgsPerBag: number;
//   conesPerBag?: number;
//   conesWeight?: number;
//   remark: string;
//   warehouseId: string;
//   itemId?: number | null;
//   uomId?: number | null;
//   itemInwardItemId?: number | null;
//   isInspected?: number | boolean;
// }

// interface PieceEntry {
//   id: number;
//   pieceNumber?: string;
//   fabricCode?: string;
//   fabricDetails?: string;
//   fabricQuality?: string;
//   gstPercent?: number;
//   gsm?: number;
//   ppi?: number;
//   pieceMeter: number;
//   netWeight: number;
//   avgWeight?: number;
//   remarks: string;
//   warehouseId: string;
//   fabricId?: number;
//   fabricMasterId?: number;
//   isInspected?: number | boolean;
// }

// interface ItemWithEntries {
//   item: any;
//   yarnStockDetails: YarnStockDetail[];
//   pieceEntries: PieceEntry[];
//   itemStockDetails: ItemStockDetail[];
//   entriesDraft: Partial<YarnStockDetail | PieceEntry | ItemStockDetail>[];
//   numberOfEntries: string;
//   editingIndex: number | null;
// }

// const LotDetails = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const dispatch = useDispatch<AppDispatch>();

//   const selectedItems: any = location.state?.selectedItems || [];
//   const entryType = location.state?.entryType || 'lot'; // 'lot' or 'piece'
//   const isEditMode = location.state?.isEditMode || false;
//   const formData = location.state?.formData || {};

//   const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
//   const [itemsWithEntries, setItemsWithEntries] = useState<ItemWithEntries[]>([]);
//   const itemsWithEntriesRef = useRef<ItemWithEntries[]>([]);
//   const [validationError, setValidationError] = useState<string>('');
//   const [quantityWarning, setQuantityWarning] = useState<string>('');
//   const [isImporting, setIsImporting] = useState(false);
//   const pieceNumberCounterRef = useRef<number>(1);
//   const previousSelectedItemsRef = useRef<any>(null);
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [purchaseInwardNumber, setPurchaseInwardNumber] = useState<string>(formData.purchaseInwardNo || '');
//   const isSavingRef = useRef(false);

//   useAutoDocumentNumber({
//     screenName: 'Purchase Inward',
//     detail: isEditMode ? { id: formData.id } : undefined,
//     existingValue: purchaseInwardNumber,
//     onValueChange: setPurchaseInwardNumber,
//     isSavingRef,
//   });

//   useEffect(() => {
//     if (isEditMode && formData.purchaseInwardNo) {
//       setPurchaseInwardNumber(formData.purchaseInwardNo);
//     }
//   }, [isEditMode, formData.purchaseInwardNo]);

//   useEffect(() => {
//     itemsWithEntriesRef.current = itemsWithEntries;
//   }, [itemsWithEntries]);

//   const { warehouseList } = useSelector((state: RootState) => state.warehouse);
//   const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
//   const { knittedknittedFabricMasterList } = useSelector((state: RootState) => state.knittedMasters);

//   const activeWarehouseList = useMemo(() => {
//     let list = [];
//     if (Array.isArray(warehouseList)) list = warehouseList;
//     else if (Array.isArray(warehouseList?.data)) list = warehouseList.data;
//     return list.filter((x: any) => x.isActive !== false && x.activeFlag !== false);
//   }, [warehouseList]);

//   const activeFabricMasterList = useMemo(() => {
//     let list = [];
//     if (Array.isArray(fabricMasterList)) list = fabricMasterList;
//     else if (Array.isArray(fabricMasterList?.data)) list = fabricMasterList.data;
//     return list.filter((x: any) => x.isActive !== false && x.activeFlag !== false);
//   }, [fabricMasterList]);

//   const activeKnittedFabricMasterList = useMemo(() => {
//     let list = [];
//     if (Array.isArray(knittedknittedFabricMasterList)) list = knittedknittedFabricMasterList;
//     else if (Array.isArray(knittedknittedFabricMasterList?.data)) list = knittedknittedFabricMasterList.data;
//     return list.filter((x: any) => x.isActive !== false && x.activeFlag !== false);
//   }, [knittedknittedFabricMasterList]);

//   // Get warehouse data array
//   const warehouseData = useMemo(() => {
//     let data: any[] = [];
//     if (Array.isArray(warehouseList)) {
//       data = warehouseList;
//     } else {
//       data = warehouseList?.data || [];
//     }
//     return data;
//   }, [warehouseList]);

//   const warehouseNameLookup = useMemo(() => {
//     const map = new Map<string, any>();
//     warehouseData.forEach((warehouse: any) => {
//       const key = (warehouse?.warehouseName || warehouse?.name || '')
//         .toString()
//         .trim()
//         .toLowerCase();
//       if (key) {
//         map.set(key, warehouse);
//       }
//     });
//     return map;
//   }, [warehouseData]);

//   const isYarnType = entryType === 'lot';
//   const isFabricType = entryType === 'piece';
//   const isItemType = entryType === 'item';


//   const fabricMastersArray = useMemo(() => {
//     if (!isFabricType || !selectedItems || selectedItems.length === 0) {
//       return [];
//     }

//     const poTypeId = selectedItems[0]?.poTypeId;
//     const poTypeName = selectedItems[0]?.poTypeName || '';

//     let masters;
//     if (poTypeName.toLowerCase().includes('woven')) {
//       masters = activeFabricMasterList;
//     } else if (poTypeName.toLowerCase().includes('knit')) {
//       masters = activeKnittedFabricMasterList;
//     } else {
//       masters = poTypeId === PO_TYPE_WOVEN_FABRIC ? activeFabricMasterList : activeKnittedFabricMasterList;
//     }

//     if (!masters) return [];

//     const data = (masters?.data ?? masters) || [];
//     return data;
//   }, [activeFabricMasterList, activeKnittedFabricMasterList, isFabricType, selectedItems]);

//   const fabricMasterByCode = useMemo(() => {
//     const map = new Map<string, any>();
//     fabricMastersArray.forEach((fabric: any) => {
//       const code = (fabric?.fabricCode || fabric?.fabric_code || '')
//         .toString()
//         .trim()
//         .toLowerCase();
//       if (code) {
//         map.set(code, fabric);
//       }
//     });
//     return map;
//   }, [fabricMastersArray]);

//   // Generate piece number with company code
//   const generatePieceNumber = () => {
//     const companyCode = localStorage.getItem('companyCode') || 'XX';
//     const number = pieceNumberCounterRef.current.toString().padStart(5, '0');
//     pieceNumberCounterRef.current += 1;
//     return `${companyCode}-GFP-${number}`;
//   };

//   // Calculate average weight for pieces
//   const calculateAvgWeight = (netWeight: number, pieceMeter: number): number => {
//     if (pieceMeter === 0) return 0;
//     return netWeight / pieceMeter;
//   };

//   const normalizeCellValue = (value: any) => {
//     if (value === null || value === undefined) return '';
//     return value.toString().trim();
//   };

//   const parseNumericCell = (value: any) => {
//     if (typeof value === 'number') {
//       return Number.isFinite(value) ? value : null;
//     }
//     if (typeof value === 'string') {
//       const trimmed = value.trim();
//       if (!trimmed) return null;
//       const parsed = parseFloat(trimmed);
//       return Number.isFinite(parsed) ? parsed : null;
//     }
//     return null;
//   };

//   const normalizeRowKeys = (row: Record<string, any>) => {
//     return Object.entries(row || {}).reduce<Record<string, any>>((acc, [key, value]) => {
//       acc[key?.toString().trim().toLowerCase()] = value;
//       return acc;
//     }, {});
//   };

//   const findDuplicateText = <T,>(
//     entries: T[],
//     getValue: (entry: T) => string | null | undefined
//   ): string | null => {
//     const seen = new Set<string>();
//     for (const entry of entries) {
//       const value = getValue(entry)?.toString().trim();
//       if (!value) continue;
//       const normalized = value.toLowerCase();
//       if (seen.has(normalized)) {
//         return value;
//       }
//       seen.add(normalized);
//     }
//     return null;
//   };

//   // Helper function to populate fabric details from selected fabric
//   const populateFabricDetailsFromMaster = (fabricId: number): Partial<PieceEntry> => {
//     const selectedFabric = fabricMastersArray.find((f: any) => f.id === fabricId);
//     if (!selectedFabric) return {};

//     const poTypeId = selectedItems?.[0]?.poTypeId;
//     const updates: Partial<PieceEntry> = {
//       fabricCode: selectedFabric.fabricCode,
//       fabricDetails: selectedFabric.fabricName
//         ? `${selectedFabric.fabricCode} - ${selectedFabric.fabricName}`
//         : selectedFabric.fabricCode,
//       fabricQuality: selectedFabric.fabricQuality || '',
//       gstPercent: selectedFabric.gstPercent || (selectedFabric.cgst || 0) + (selectedFabric.sgst || 0) || selectedFabric.igst || 0,
//       gsm: selectedFabric.gsm || undefined,
//       ppi: selectedFabric.ppi || undefined
//     };

//     if (poTypeId === PO_TYPE_WOVEN_FABRIC) {
//       updates.fabricMasterId = fabricId;
//       updates.fabricId = 0;
//     } else if (poTypeId === PO_TYPE_KNITTED_FABRIC) {
//       updates.fabricId = fabricId;
//       updates.fabricMasterId = 0;
//     }

//     return updates;
//   };

  

//   useEffect(() => {
//     if (!selectedItems || selectedItems.length === 0) {
//       navigate('/transaction/purchase-inward');
//     } else {
//       setItemsWithEntries(selectedItems.map((item: any) => {
//         // Always load existing entries if they exist, not just in edit mode

//         const existingYarnStockDetails = isYarnType && item.yarnStockDetails && 
//   Array.isArray(item.yarnStockDetails) && item.yarnStockDetails.length > 0
//   ? Array.from(new Map(item.yarnStockDetails.map((lot: any) => 
//       [lot.id && Number(lot.id) > 0 ? `id-${lot.id}` : `no-${lot.lotNo || lot.lotNumber}`, lot]
//     )).values()).map((lot: any, idx: number) => {
//       const lotId = Number(lot.id);
//         const inwardQty = Number(lot.inwardQty ?? lot.quantity ?? 0);
//         const rejectedQty = Number(lot.rejectedQty ?? lot.rejectedQuantity ?? 0);
//         const acceptedQty = Number(lot.acceptedQty ?? (inwardQty - rejectedQty));

//         return {
//           id: lotId > 0 ? lotId : `${Date.now()}-${idx}`,
//           inwardId: lot.inwardId ?? formData.id ?? null,  // ADD THIS LINE - from backend response
//           lotNo: lot.lotNo || lot.lotNumber || '',
//           inwardQty: inwardQty,
//           acceptedQty: acceptedQty,
//           rejectedQty: rejectedQty,
//         inwardBags: Number(lot.inwardBags ?? lot.bags ?? 0),
//         kgsPerBag: Number(lot.kgsPerBag ?? lot.kgPerBag ?? 0),
//         conesPerBag: Number(lot.conesPerBag ?? lot.cones_per_bag ?? 0),
//         conesWeight: Number(lot.conesWeight ?? lot.cones_weight ?? 0),
//         remark: lot.remark ?? lot.remarks ?? item.remark ?? '',
//         warehouseId: String(lot.warehouseId || ''),
//         itemId: lot.itemId ?? item.yarnId ?? null,
//         uomId: lot.uomId ?? item.uomId ?? null,
//         yarnId: lot.yarnId ?? item.yarnId ?? null,
//         fabricId: lot.fabricId ?? item.fabricId ?? null,
//         orderItemId: lot.orderItemId ?? item.id ?? null,
//         isInspected: lot.isInspected ?? 0,
//         yarnTypeId: lot.yarnTypeId ?? item.yarnTypeId ?? null,
//       };
//     })
//   : [];


//         const existingPieceEntries = isFabricType && item.pieceEntries && Array.isArray(item.pieceEntries) && item.pieceEntries.length > 0
//           ? Array.from(new Map(item.pieceEntries.map((piece: any) => [piece.id && Number(piece.id) > 0 ? `id-${piece.id}` : `no-${piece.pieceNumber}`, piece])).values()).map((piece: any, idx: number) => {
//             const fabricId = Number(piece.fabricId) || item.fabricId || 0;
//             const fabricMasterId = Number(piece.fabricMasterId) || item.fabricMasterId || 0;
//             const fabricIdToUse = fabricMasterId || fabricId;
//             // Ensure we have numeric IDs for existing entries (> 0 = from database)
//             const pieceId = Number(piece.id);

//             let enrichedPiece: any = {
//               id: pieceId > 0 ? pieceId : `${Date.now()}-${idx}`,
//               pieceNumber: piece.pieceNumber || '',
//               fabricCode: piece.fabricCode || item.productName || '',
//               fabricDetails: piece.fabricDetails || '',
//               fabricQuality: piece.fabricQuality || '',
//               gstPercent: piece.gstPercent || 0,
//               gsm: piece.gsm || undefined,
//               ppi: piece.ppi || undefined,
//               pieceMeter: Number(piece.quantity || piece.pieceMeter) || 0,
//               netWeight: Number(piece.weight || piece.netWeight) || 0,
//               avgWeight: (piece.weight || piece.netWeight) && (piece.quantity || piece.pieceMeter) ? Number(piece.weight || piece.netWeight) / Number(piece.quantity || piece.pieceMeter) : (piece.avgWeight || 0),
//               remarks: piece.remarks || piece.remarks || '',
//               warehouseId: String(piece.warehouseId) || '',
//               fabricId: fabricId,
//               fabricMasterId: fabricMasterId,
//               isInspected: piece.isInspected ?? 0
//             };

//             if (fabricIdToUse && !enrichedPiece.fabricDetails) {
//               const fabricDetails = populateFabricDetailsFromMaster(fabricIdToUse);
//               enrichedPiece = { ...enrichedPiece, ...fabricDetails };
//             }

//             return enrichedPiece;
//           })
//           : [];

//         const itemStockRaw = (Array.isArray(item.itemStockDetails) && item.itemStockDetails.length > 0)
//           ? item.itemStockDetails
//           : (Array.isArray(item.item_stock_details) && item.item_stock_details.length > 0)
//             ? item.item_stock_details
//             : (Array.isArray(item.lotEntries) && item.lotEntries.length > 0)
//               ? item.lotEntries
//               : null;

//         const existingItemStockDetails = isItemType && itemStockRaw
//           ? Array.from(new Map(itemStockRaw.map((stock: any) => [stock.id && Number(stock.id) > 0 ? `id-${stock.id}` : `no-${stock.lotNo || stock.lotNumber}`, stock])).values()).map((stock: any, idx: number) => {
//             const stockId = Number(stock.id);
//             const inwardQty = Number(stock.inwardQty ?? stock.quantity ?? 0);
//             const rejectedQty = Number(stock.rejectedQty ?? stock.rejectedQuantity ?? 0);
//             const acceptedQty = Number(stock.acceptedQty ?? (inwardQty - rejectedQty));

//             return {
//               id: stockId > 0 ? stockId : `${Date.now()}-${idx}`,
//               lotNo: stock.lotNo || stock.lotNumber || '',
//               inwardQty: inwardQty,
//               acceptedQty: acceptedQty,
//               rejectedQty: rejectedQty,
//               inwardBags: Number(stock.inwardBags ?? stock.bags ?? 0),
//               kgsPerBag: Number(stock.kgsPerBag ?? stock.kgPerBag ?? 0),
//               conesPerBag: Number(stock.conesPerBag ?? stock.cones_per_bag ?? 0),
//               conesWeight: Number(stock.conesWeight ?? stock.cones_weight ?? 0),
//               remark: stock.remark || stock.remarks || '',
//               warehouseId: String(stock.warehouseId || ''),
//               itemId: stock.itemId ?? item.itemId ?? null,
//               uomId: stock.uomId ?? item.uomId ?? null,
//               itemInwardItemId: stock.itemInwardItemId ?? item.id ?? null,
//               isInspected: stock.isInspected ?? 0,
//             };
//           })
//           : [];

//         const existingEntriesCount = isYarnType 
//           ? existingYarnStockDetails.length 
//           : isItemType 
//             ? existingItemStockDetails.length 
//             : existingPieceEntries.length;

//         return {
//           item,
//           yarnStockDetails: existingYarnStockDetails,
//           pieceEntries: existingPieceEntries,
//           itemStockDetails: existingItemStockDetails,
//           entriesDraft: [],
//           numberOfEntries: '0',
//           editingIndex: null
//         };
//       }));
//     }
//   }, [selectedItems, navigate, isEditMode, entryType, isYarnType, isFabricType, isItemType]);

//   // Helper function to process backend response after update
// const processUpdateResponse = (response: any, isEditMode: boolean) => {
//   // Handle wrapper format (ResponseUtil.success)
//   let purchaseInwardData = response?.data || response;
  
//   // Ensure we're working with the actual inward data
//   if (purchaseInwardData?.purchaseInwardItemsDtl) {
//     return {
//       ...purchaseInwardData,
//       // Ensure each item's yarn stock details have inwardId
//       purchaseInwardItemsDtl: purchaseInwardData.purchaseInwardItemsDtl.map((item: any) => ({
//         ...item,
//         yarnStockDetails: (item.yarnStockDetails || []).map((detail: any) => ({
//           ...detail,
//           inwardId: purchaseInwardData.id ?? detail.inwardId,  // Ensure inwardId is set
//         })),
//         itemStockDetails: (item.itemStockDetails || []).map((detail: any) => ({
//           ...detail,
//           inwardId: purchaseInwardData.id ?? detail.inwardId,
//         })),
//       })),
//     };
//   }
//   return purchaseInwardData;
// };

// // Helper function to reload data after update
// const reloadDataAfterUpdate = (response: any) => {
//   const processedData = processUpdateResponse(response, isEditMode);
  
//   if (!processedData?.purchaseInwardItemsDtl) {
//     console.warn('No items found in update response');
//     return;
//   }

//   // Reconstruct itemsWithEntries with updated data
//   const updatedItemsWithEntries = processedData.purchaseInwardItemsDtl.map((item: any, idx: number) => {
//     const yarnDetails = isYarnType && item.yarnStockDetails && Array.isArray(item.yarnStockDetails)
//       ? item.yarnStockDetails.map((lot: any, lotIdx: number) => ({
//           id: Number(lot.id) > 0 ? Number(lot.id) : `${Date.now()}-${lotIdx}`,
//           inwardId: lot.inwardId ?? processedData.id,  // CRITICAL: Use inwardId from response
//           lotNo: lot.lotNo || '',
//           inwardQty: Number(lot.inwardQty ?? 0),
//           acceptedQty: Number(lot.acceptedQty ?? 0),
//           rejectedQty: Number(lot.rejectedQty ?? 0),
//           inwardBags: Number(lot.inwardBags ?? 0),
//           kgsPerBag: Number(lot.kgsPerBag ?? 0),
//           conesPerBag: Number(lot.conesPerBag ?? 0),
//           conesWeight: Number(lot.conesWeight ?? 0),
//           remark: lot.remark ?? '',
//           warehouseId: String(lot.warehouseId || ''),
//           itemId: lot.itemId,
//           uomId: lot.uomId,
//           yarnId: lot.yarnId,
//           orderItemId: lot.orderItemId,
//           isInspected: lot.isInspected ?? 0,
//           yarnTypeId: lot.yarnTypeId ?? item.yarnTypeId ?? null,
//         }))
//       : [];

//     const pieceDetails = isFabricType && item.pieceEntries && Array.isArray(item.pieceEntries)
//       ? item.pieceEntries.map((piece: any, pieceIdx: number) => ({
//           id: Number(piece.id) > 0 ? Number(piece.id) : `${Date.now()}-${pieceIdx}`,
//           pieceNumber: piece.pieceNumber || '',
//           fabricCode: piece.fabricCode || '',
//           fabricDetails: piece.fabricDetails || '',
//           fabricQuality: piece.fabricQuality || '',
//           gstPercent: piece.gstPercent || 0,
//           gsm: piece.gsm,
//           ppi: piece.ppi,
//           pieceMeter: Number(piece.pieceMeter ?? 0),
//           netWeight: Number(piece.netWeight ?? 0),
//           avgWeight: Number(piece.avgWeight ?? 0),
//           remarks: piece.remarks || '',
//           warehouseId: String(piece.warehouseId || ''),
//           fabricId: piece.fabricId || 0,
//           fabricMasterId: piece.fabricMasterId || 0,
//           isInspected: piece.isInspected ?? 0,
//         }))
//       : [];

//     const itemDetails = isItemType && item.itemStockDetails && Array.isArray(item.itemStockDetails)
//       ? item.itemStockDetails.map((detail: any, detailIdx: number) => ({
//           id: Number(detail.id) > 0 ? Number(detail.id) : `${Date.now()}-${detailIdx}`,
//           inwardId: detail.inwardId ?? processedData.id,
//           lotNo: detail.lotNo || '',
//           inwardQty: Number(detail.inwardQty ?? 0),
//           acceptedQty: Number(detail.acceptedQty ?? 0),
//           rejectedQty: Number(detail.rejectedQty ?? 0),
//           inwardBags: Number(detail.inwardBags ?? 0),
//           kgsPerBag: Number(detail.kgsPerBag ?? 0),
//           remark: detail.remark ?? '',
//           warehouseId: String(detail.warehouseId || ''),
//           itemId: detail.itemId,
//           uomId: detail.uomId,
//         }))
//       : [];

//     return {
//       item,
//       yarnStockDetails: yarnDetails,
//       pieceEntries: pieceDetails,
//       itemStockDetails: itemDetails,
//       entriesDraft: [],
//       numberOfEntries: (yarnDetails.length + pieceDetails.length + itemDetails.length).toString(),
//       editingIndex: null,
//     };
//   });

//   setItemsWithEntries(updatedItemsWithEntries);
//   return updatedItemsWithEntries;
// };


//   useEffect(() => {
//     dispatch(getAllPoTypes({fetchAll: true}));
//     dispatch(getAllWarehouse({fetchAll: true}));

//     if (isFabricType && selectedItems.length > 0) {
//       const poTypeId = selectedItems[0].poTypeId;
//       const poTypeName = selectedItems[0].poTypeName || '';

//       if (poTypeName.toLowerCase().includes('woven')) {
//         dispatch(getAllFabricMasters({fetchAll: true}));
//       } else if (poTypeName.toLowerCase().includes('knit')) {
//         dispatch(getAllKnittedFabricMasters({}));
//       } else {
//         if (poTypeId === PO_TYPE_WOVEN_FABRIC) {
//           dispatch(getAllFabricMasters({}));
//         } else if (poTypeId === PO_TYPE_KNITTED_FABRIC) {
//           dispatch(getAllKnittedFabricMasters({}));
//         }
//       }
//     }
//   }, [dispatch, isFabricType, selectedItems]);


//   // Re-enrich piece entries after fabric masters are loaded
//   useEffect(() => {
//     if (isEditMode && isFabricType && fabricMastersArray.length > 0 && itemsWithEntries.length > 0) {
//       setItemsWithEntries(prev => prev.map(itemData => {
//         const enrichedPieceEntries = itemData.pieceEntries.map((piece: PieceEntry) => {
//           if (piece.fabricDetails) {
//             return piece;
//           }

//           const fabricIdToUse = piece.fabricMasterId || piece.fabricId;
//           if (fabricIdToUse) {
//             const fabricDetails = populateFabricDetailsFromMaster(fabricIdToUse);
//             return { ...piece, ...fabricDetails };
//           }
//           return piece;
//         });

//         return {
//           ...itemData,
//           pieceEntries: enrichedPieceEntries
//         };
//       }));
//     }
//   }, [fabricMastersArray, isEditMode, isFabricType]);

//   const canUseTemplateActions = useMemo(() => {
//     if (!warehouseData.length || !itemsWithEntries.length) {
//       return false;
//     }
//     if (isYarnType || isItemType) {
//       return true;
//     }
//     if (isFabricType) {
//       return fabricMastersArray.length > 0;
//     }
//     return false;
//   }, [warehouseData.length, itemsWithEntries.length, isYarnType, isFabricType, isItemType, fabricMastersArray.length]);

//   // Sync quantity and price changes from selectedItems to lot entries (real-time)
//   useEffect(() => {
//     if (selectedItems.length === 0 || itemsWithEntries.length === 0) {
//       previousSelectedItemsRef.current = selectedItems;
//       return;
//     }

//     const hasQtyOrPriceChanged = selectedItems.some((item: any, index: number) => {
//       const prevItem = previousSelectedItemsRef.current?.[index];
//       if (!prevItem) return true;

//       const qtyChanged = Number(item.quantityReceived) !== Number(prevItem.quantityReceived);
//       const priceChanged = Number(item.price) !== Number(prevItem.price);

//       return qtyChanged || priceChanged;
//     });

//     if (!hasQtyOrPriceChanged) {
//       return;
//     }

//     console.log('Detected quantity/price changes, syncing lot entries...');

//     setItemsWithEntries(prev => prev.map((itemData, index) => {
//       const selectedItem = selectedItems[index];
//       if (!selectedItem) return itemData;

//       const currentQty = Number(itemData.item.quantityReceived) || 0;
//       const newQty = Number(selectedItem.quantityReceived) || 0;
//       const currentPrice = Number(itemData.item.price) || 0;
//       const newPrice = Number(selectedItem.price) || 0;

//       const quantityChanged = currentQty !== newQty && newQty > 0;
//       const priceChanged = currentPrice !== newPrice && newPrice > 0;

//       if (!quantityChanged && !priceChanged) {
//         return itemData;
//       }

//       const updatedData = { ...itemData };

//       if (quantityChanged) {
//         console.log(`Syncing quantity for item ${index}: ${currentQty} -> ${newQty}`);

//         if (isYarnType) {
//           updatedData.yarnStockDetails = itemData.yarnStockDetails.map((lot: YarnStockDetail) => {
//             const oldAcceptedQty = Number(lot.acceptedQty) || 0;
//             const oldRejectedQty = Number(lot.rejectedQty) || 0;
//             const oldTotal = oldAcceptedQty + oldRejectedQty;

//             if (oldTotal === 0) {
//               return { ...lot, inwardQty: newQty, acceptedQty: newQty };
//             }

//             const ratio = newQty / oldTotal;
//             const newAccepted = Math.round(oldAcceptedQty * ratio * 100) / 100;
//             const newRejected = newQty - newAccepted;

//             return {
//               ...lot,
//               inwardQty: newQty,
//               acceptedQty: newAccepted,
//               rejectedQty: newRejected
//             };
//           });
//         } else if (isItemType) {
//           updatedData.itemStockDetails = itemData.itemStockDetails.map((stock: ItemStockDetail) => {
//             const oldAcceptedQty = Number(stock.acceptedQty) || 0;
//             const oldRejectedQty = Number(stock.rejectedQty) || 0;
//             const oldTotal = oldAcceptedQty + oldRejectedQty;

//             if (oldTotal === 0) {
//               return { ...stock, inwardQty: newQty, acceptedQty: newQty };
//             }

//             const ratio = newQty / oldTotal;
//             const newAccepted = Math.round(oldAcceptedQty * ratio * 100) / 100;
//             const newRejected = newQty - newAccepted;

//             return {
//               ...stock,
//               inwardQty: newQty,
//               acceptedQty: newAccepted,
//               rejectedQty: newRejected
//             };
//           });
//         } else {
//           updatedData.pieceEntries = itemData.pieceEntries.map((piece: PieceEntry) => ({
//             ...piece,
//             pieceMeter: newQty,
//             avgWeight: piece.netWeight && newQty ? piece.netWeight / newQty : (piece.avgWeight || 0)
//           }));
//         }
//       }

//       if (priceChanged && !isYarnType) {
//         console.log(`Syncing price for item ${index}: ${currentPrice} -> ${newPrice}`);
//         updatedData.pieceEntries = (updatedData.pieceEntries || itemData.pieceEntries).map((piece: PieceEntry) => ({
//           ...piece,
//           cost: newPrice * (piece.pieceMeter || 0)
//         }));
//       }

//       updatedData.item = { ...itemData.item, ...selectedItem };
//       return updatedData;
//     }));

//     previousSelectedItemsRef.current = selectedItems;
//   }, [selectedItems, itemsWithEntries.length, isYarnType, isItemType]);

//   // Update piece number counter when switching items or entries change
//   useEffect(() => {
//     if (isFabricType) {
//       const currentItemData = itemsWithEntries[currentItemIndex];
//       if (currentItemData?.pieceEntries) {
//         const numbers = currentItemData.pieceEntries.map((entry: PieceEntry) => {
//           const match = entry.pieceNumber?.match(/[A-Z]{2}-GFP-(\d{5})/);
//           return match ? parseInt(match[1]) : 0;
//         });
//         const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
//         pieceNumberCounterRef.current = maxNum + 1;
//       }
//     } else {
//       pieceNumberCounterRef.current = 1;
//     }
//   }, [currentItemIndex, itemsWithEntries, isFabricType]);

//   // Calculate total quantity (sum of accepted + rejected for yarn type)
//   const calculateTotalQuantity = (entries: (YarnStockDetail | ItemStockDetail | PieceEntry)[]) => {
//     if (isYarnType) {
//       return (entries as YarnStockDetail[]).reduce((sum, entry) =>
//         sum + (Number(entry.acceptedQty) || 0) + (Number(entry.rejectedQty) || 0), 0);
//     } else if (isItemType) {
//       return (entries as ItemStockDetail[]).reduce((sum, entry) =>
//         sum + (Number(entry.acceptedQty) || 0) + (Number(entry.rejectedQty) || 0), 0);
//     } else {
//       return (entries as PieceEntry[]).reduce((sum, entry) => sum + (Number(entry.pieceMeter) || 0), 0);
//     }
//   };

//   // Calculate total draft quantity
//   const calculateTotalDraftQuantity = (drafts: Partial<YarnStockDetail | ItemStockDetail | PieceEntry>[]) => {
//     if (isYarnType) {
//       return drafts.reduce((sum, draft) =>
//         sum + (Number((draft as YarnStockDetail).acceptedQty) || 0) + (Number((draft as YarnStockDetail).rejectedQty) || 0), 0);
//     } else if (isItemType) {
//       return drafts.reduce((sum, draft) =>
//         sum + (Number((draft as ItemStockDetail).acceptedQty) || 0) + (Number((draft as ItemStockDetail).rejectedQty) || 0), 0);
//     } else {
//       return drafts.reduce((sum, draft) => sum + (Number((draft as PieceEntry).pieceMeter) || 0), 0);
//     }
//   };

//   const exceedsReceivedQuantity = (
//     entries: (YarnStockDetail | ItemStockDetail | PieceEntry)[],
//     receivedQuantity: number,
//     drafts: Partial<YarnStockDetail | ItemStockDetail | PieceEntry>[] = []
//   ) => {
//     const totalQuantity = calculateTotalQuantity(entries);
//     const totalDraftQuantity = calculateTotalDraftQuantity(drafts);
//     return totalQuantity + totalDraftQuantity > receivedQuantity + 0.0001;
//   };

//   const handleDownloadTemplate = () => {
//     if (!canUseTemplateActions) {
//       toast.error('Template actions are unavailable. Please ensure prerequisites are loaded.');
//       return;
//     }

//     if (isYarnType) {
//       generateExcelTemplate({
//         headers: YARN_TEMPLATE_HEADERS,
//         fileName: 'purchase-inward-yarn-lot-template'
//       });
//       return;
//     }

//     if (isItemType) {
//       generateExcelTemplate({
//         headers: ITEM_TEMPLATE_HEADERS,
//         fileName: 'purchase-inward-item-stock-template'
//       });
//       return;
//     }

//     if (isFabricType) {
//       if (!fabricMastersArray.length) {
//         toast.error('Fabric master data not loaded.');
//         return;
//       }
//       generateExcelTemplate({
//         headers: FABRIC_TEMPLATE_HEADERS,
//         fileName: 'purchase-inward-fabric-piece-template'
//       });
//     }
//   };

//   const handleUploadButtonClick = () => {
//     if (!canUseTemplateActions) {
//       toast.error('Please ensure warehouses and masters are loaded before uploading.');
//       return;
//     }
//     const currentItemData = itemsWithEntries[currentItemIndex];
//     if (!currentItemData) {
//       toast.error('No item selected to import entries.');
//       return;
//     }
//     fileInputRef.current?.click();
//   };

//   const validateUniformFabricCodes = (entries: PieceEntry[]) => {
//     const normalizedCodes = entries
//       .map(entry => entry.fabricCode?.toString().trim().toLowerCase())
//       .filter(Boolean);
//     if (normalizedCodes.length <= 1) {
//       return true;
//     }
//     return new Set(normalizedCodes).size === 1;
//   };

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) {
//       return;
//     }
//     const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
//     if (!EXCEL_ALLOWED_EXTENSIONS.includes(extension)) {
//       toast.error('Only Excel files (.xls, .xlsx) are supported');
//       event.target.value = '';
//       return;
//     }
//     const currentItemData = itemsWithEntries[currentItemIndex];
//     if (!currentItemData) {
//       toast.error('No item selected to import entries.');
//       event.target.value = '';
//       return;
//     }

//     try {
//       setIsImporting(true);
//       const rows = await readExcelFile<Record<string, any>>(file);
//       if (!Array.isArray(rows) || rows.length === 0) {
//         toast.error('No data found in the uploaded file');
//         return;
//       }

//       if (isYarnType) {
//         importYarnLotsFromRows(rows, currentItemData);
//       } else if (isItemType) {
//         importItemStockDetailsFromRows(rows, currentItemData);
//       } else if (isFabricType) {
//         importFabricPiecesFromRows(rows, currentItemData);
//       } else {
//         toast.error('Unsupported import type for this entry.');
//       }
//     } catch (error) {
//       toast.error('Failed to process the uploaded file');
//     } finally {
//       setIsImporting(false);
//       event.target.value = '';
//     }
//   };

//   const importYarnLotsFromRows = (rows: Record<string, any>[], currentItemData: ItemWithEntries) => {
//     const validationErrors: string[] = [];
//     const parsedEntries: YarnStockDetail[] = [];
//     const baseItem = currentItemData.item;

//     rows.forEach((row, index) => {
//       const normalized = normalizeRowKeys(row || {});
//       const values = Object.values(normalized);
//       if (!values.some(value => value !== undefined && value !== null && value !== '')) {
//         return;
//       }

//       const warehouseName = normalizeCellValue(normalized['warehouse name'] ?? normalized['warehouse']);
//       if (!warehouseName) {
//         validationErrors.push(`Row ${index + 2}: Warehouse Name should not be empty`);
//         return;
//       }
//       const warehouseRecord = warehouseNameLookup.get(warehouseName.toLowerCase());
//       if (!warehouseRecord) {
//         validationErrors.push(`Row ${index + 2}: Warehouse "${warehouseName}" not found`);
//         return;
//       }

//       const lotNo = normalizeCellValue(normalized['lot no'] ?? normalized['lot number'] ?? normalized['lot']);
//       if (!lotNo) {
//         validationErrors.push(`Row ${index + 2}: Lot No should not be empty`);
//         return;
//       }

//       const noOfBags = parseNumericCell(normalized['no of bags']);
//       if (noOfBags === null) {
//         validationErrors.push(`Row ${index + 2}: No Of Bags should not be empty`);
//         return;
//       }

//       const kgsPerBag = parseNumericCell(normalized['kgs/bag'])
//         ?? parseNumericCell(normalized['kgs per bag'])
//         ?? parseNumericCell(normalized['kgs perbag']);
//       if (kgsPerBag === null) {
//         validationErrors.push(`Row ${index + 2}: Kgs/Bag should not be empty`);
//         return;
//       }

//       const acceptedQty = parseNumericCell(normalized['accepted qty']);
//       if (acceptedQty === null) {
//         validationErrors.push(`Row ${index + 2}: Accepted Qty should not be empty`);
//         return;
//       }

//       const rejectedQty = parseNumericCell(normalized['rejected qty']);
//       if (rejectedQty === null) {
//         validationErrors.push(`Row ${index + 2}: Rejected Qty should not be empty`);
//         return;
//       }

//       if ((acceptedQty ?? 0) <= 0 && (rejectedQty ?? 0) <= 0) {
//         validationErrors.push(`Row ${index + 2}: Accepted Qty or Rejected Qty must be greater than zero`);
//         return;
//       }

//       const conesPerBag = parseNumericCell(normalized['cones per bag']);
//       if (conesPerBag === null) {
//         validationErrors.push(`Row ${index + 2}: Cones Per Bag should not be empty`);
//         return;
//       }

//       const remark = normalizeCellValue(normalized['remark']);
//       if (!remark) {
//         validationErrors.push(`Row ${index + 2}: Remark should not be empty`);
//         return;
//       }

//       const accepted = Math.max(0, acceptedQty ?? 0);
//       const rejected = Math.max(0, rejectedQty ?? 0);
//       const entryId = Date.now() + index + parsedEntries.length;

//       parsedEntries.push({
//         id: entryId,
//         lotNo: lotNo || `Lot ${currentItemData.yarnStockDetails.length + parsedEntries.length + 1}`,
//         inwardQty: accepted + rejected,
//         acceptedQty: accepted,
//         rejectedQty: rejected,
//         inwardBags: noOfBags || 0,
//         kgsPerBag: kgsPerBag || 0,
//         conesPerBag: conesPerBag || 0,
//         conesWeight: conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0,
//         remark,
//         warehouseId: String(warehouseRecord.id),
//         itemId: baseItem.yarnId ?? baseItem.itemId ?? baseItem.id ?? null,
//         uomId: baseItem.uomId ?? null,
//         yarnId: baseItem.yarnId ?? baseItem.itemId ?? null,
//         fabricId: baseItem.fabricId ?? null,
//         orderItemId: baseItem.orderItemId ?? baseItem.id ?? null,
//         yarnTypeId: baseItem.yarnTypeId ?? null,
//       });
//     });

//     if (validationErrors.length) {
//       toast.error(validationErrors.join('\n'));
//       return;
//     }

//     if (!parsedEntries.length) {
//       toast.error('No valid rows found in the uploaded file');
//       return;
//     }

//     const combinedEntries = [...currentItemData.yarnStockDetails, ...parsedEntries];
//     const receivedQuantity = Number(currentItemData.item.quantityReceived) || 0;
//     const totalQuantity = calculateTotalQuantity(combinedEntries);

//     if (totalQuantity > receivedQuantity + 0.0001) {
//       toast.error('Imported quantities exceed the inward quantity.');
//       return;
//     }

//     updateCurrentItemData({ yarnStockDetails: combinedEntries });
//     if (!isEditMode) {
//       validateQuantityTotals(combinedEntries, currentItemData.entriesDraft);
//     }
//     toast.success(`Imported ${parsedEntries.length} ${parsedEntries.length === 1 ? 'lot' : 'lots'}`);
//   };

//   const importItemStockDetailsFromRows = (rows: Record<string, any>[], currentItemData: ItemWithEntries) => {
//     const validationErrors: string[] = [];
//     const parsedEntries: ItemStockDetail[] = [];
//     const baseItem = currentItemData.item;

//     rows.forEach((row, index) => {
//       const normalized = normalizeRowKeys(row || {});
//       const values = Object.values(normalized);
//       if (!values.some(value => value !== undefined && value !== null && value !== '')) {
//         return;
//       }

//       const warehouseName = normalizeCellValue(normalized['warehouse name'] ?? normalized['warehouse']);
//       if (!warehouseName) {
//         validationErrors.push(`Row ${index + 2}: Warehouse Name should not be empty`);
//         return;
//       }
//       const warehouseRecord = warehouseNameLookup.get(warehouseName.toLowerCase());
//       if (!warehouseRecord) {
//         validationErrors.push(`Row ${index + 2}: Warehouse "${warehouseName}" not found`);
//         return;
//       }

//       const lotNo = normalizeCellValue(normalized['lot no'] ?? normalized['lot number'] ?? normalized['lot']);
//       if (!lotNo) {
//         validationErrors.push(`Row ${index + 2}: Lot No should not be empty`);
//         return;
//       }

//       const noOfBags = parseNumericCell(normalized['no of bags']);
//       if (noOfBags === null) {
//         validationErrors.push(`Row ${index + 2}: No Of Bags should not be empty`);
//         return;
//       }

//       const kgsPerBag = parseNumericCell(normalized['kgs/bag'])
//         ?? parseNumericCell(normalized['kgs per bag'])
//         ?? parseNumericCell(normalized['kgs perbag']);
//       if (kgsPerBag === null) {
//         validationErrors.push(`Row ${index + 2}: Kgs/Bag should not be empty`);
//         return;
//       }

//       const acceptedQty = parseNumericCell(normalized['accepted qty']);
//       if (acceptedQty === null) {
//         validationErrors.push(`Row ${index + 2}: Accepted Qty should not be empty`);
//         return;
//       }

//       const rejectedQty = parseNumericCell(normalized['rejected qty']);
//       if (rejectedQty === null) {
//         validationErrors.push(`Row ${index + 2}: Rejected Qty should not be empty`);
//         return;
//       }

//       if ((acceptedQty ?? 0) <= 0 && (rejectedQty ?? 0) <= 0) {
//         validationErrors.push(`Row ${index + 2}: Accepted Qty or Rejected Qty must be greater than zero`);
//         return;
//       }

//       const conesPerBag = parseNumericCell(normalized['cones per bag']) ?? 0;
//       const remark = normalizeCellValue(normalized['remark']);
//       if (!remark) {
//         validationErrors.push(`Row ${index + 2}: Remark should not be empty`);
//         return;
//       }

//       const accepted = Math.max(0, acceptedQty ?? 0);
//       const rejected = Math.max(0, rejectedQty ?? 0);
//       const entryId = Date.now() + index + parsedEntries.length;

//       parsedEntries.push({
//         id: entryId,
//         lotNo: lotNo || `Stock ${currentItemData.itemStockDetails.length + parsedEntries.length + 1}`,
//         inwardQty: accepted + rejected,
//         acceptedQty: accepted,
//         rejectedQty: rejected,
//         inwardBags: noOfBags || 0,
//         kgsPerBag: kgsPerBag || 0,
//         conesPerBag: conesPerBag || 0,
//         conesWeight: conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0,
//         remark,
//         warehouseId: String(warehouseRecord.id),
//         itemId: baseItem.itemId ?? baseItem.id ?? null,
//         uomId: baseItem.uomId ?? null,
//         itemInwardItemId: baseItem.itemInwardItemId ?? baseItem.id ?? null
//       });
//     });

//     if (validationErrors.length) {
//       toast.error(validationErrors.join('\n'));
//       return;
//     }

//     if (!parsedEntries.length) {
//       toast.error('No valid rows found in the uploaded file');
//       return;
//     }

//     const combinedEntries = [...currentItemData.itemStockDetails, ...parsedEntries];
//     const receivedQuantity = Number(currentItemData.item.quantityReceived) || 0;
//     const totalQuantity = combinedEntries.reduce((sum, stock) => sum + (Number(stock.acceptedQty) || 0), 0);

//     if (totalQuantity > receivedQuantity + 0.0001) {
//       toast.error('Imported quantities exceed the inward quantity.');
//       return;
//     }

//     updateCurrentItemData({ itemStockDetails: combinedEntries });
//     if (!isEditMode) {
//       validateQuantityTotals(combinedEntries, currentItemData.entriesDraft);
//     }
//     toast.success(`Imported ${parsedEntries.length} ${parsedEntries.length === 1 ? 'stock record' : 'stock records'}`);
//   };

//   const importFabricPiecesFromRows = (rows: Record<string, any>[], currentItemData: ItemWithEntries) => {
//     const validationErrors: string[] = [];
//     const parsedEntries: PieceEntry[] = [];
//     const poTypeId = currentItemData.item.poTypeId;
//     const existingPieceNumbers = new Set(
//       currentItemData.pieceEntries
//         .map(entry => entry.pieceNumber?.toString().trim().toLowerCase())
//         .filter(Boolean)
//     );

//     rows.forEach((row, index) => {
//       const normalized = normalizeRowKeys(row || {});
//       const values = Object.values(normalized);
//       if (!values.some(value => value !== undefined && value !== null && value !== '')) {
//         return;
//       }

//       const warehouseName = normalizeCellValue(normalized['warehouse name'] ?? normalized['warehouse']);
//       if (!warehouseName) {
//         validationErrors.push(`Row ${index + 2}: Warehouse Name should not be empty`);
//         return;
//       }
//       const warehouseRecord = warehouseNameLookup.get(warehouseName.toLowerCase());
//       if (!warehouseRecord) {
//         validationErrors.push(`Row ${index + 2}: Warehouse "${warehouseName}" not found`);
//         return;
//       }

//       const fabricCode = normalizeCellValue(normalized['fabric code']);
//       if (!fabricCode) {
//         validationErrors.push(`Row ${index + 2}: Fabric Code should not be empty`);
//         return;
//       }
//       const fabricRecord = fabricMasterByCode.get(fabricCode.toLowerCase());
//       if (!fabricRecord) {
//         validationErrors.push(`Row ${index + 2}: Fabric Code "${fabricCode}" not found in master data`);
//         return;
//       }

//       const pieceNo = normalizeCellValue(normalized['piece no'] ?? normalized['piece number']);
//       if (!pieceNo) {
//         validationErrors.push(`Row ${index + 2}: Piece No should not be empty`);
//         return;
//       }
//       const normalizedPieceNo = pieceNo.toLowerCase();
//       if (existingPieceNumbers.has(normalizedPieceNo) || parsedEntries.some(entry => entry.pieceNumber?.toLowerCase() === normalizedPieceNo)) {
//         validationErrors.push(`Row ${index + 2}: Duplicate piece number "${pieceNo}"`);
//         return;
//       }

//       const pieceMeter = parseNumericCell(normalized['piece meter']);
//       if (pieceMeter === null) {
//         validationErrors.push(`Row ${index + 2}: Piece Meter should not be empty`);
//         return;
//       }

//       const netWeight = parseNumericCell(normalized['net weight'] ?? normalized['net wt']);
//       if (netWeight === null) {
//         validationErrors.push(`Row ${index + 2}: Net Weight should not be empty`);
//         return;
//       }

//       if (pieceMeter <= 0 || netWeight <= 0) {
//         validationErrors.push(`Row ${index + 2}: Piece Meter and Net Weight must be greater than zero`);
//         return;
//       }
//       const remarks = normalizeCellValue(normalized['remarks']);
//       if (!remarks) {
//         validationErrors.push(`Row ${index + 2}: Remarks should not be empty`);
//         return;
//       }

//       const fabricCodeValue = fabricRecord.fabricCode || fabricRecord.fabric_code || fabricCode;
//       const fabricDetails = fabricRecord.fabricName
//         ? `${fabricRecord.fabricCode || fabricRecord.fabric_code} - ${fabricRecord.fabricName}`
//         : fabricCodeValue;

//       const baseEntry: PieceEntry = {
//         id: Date.now() + index + parsedEntries.length,
//         pieceNumber: pieceNo,
//         fabricCode: fabricCodeValue,
//         fabricDetails: fabricDetails,
//         fabricQuality: fabricRecord.fabricQuality || fabricRecord.quality || '',
//         gstPercent: fabricRecord.gstPercent || fabricRecord.cgst || 0,
//         gsm: fabricRecord.gsm || undefined,
//         ppi: fabricRecord.ppi || undefined,
//         pieceMeter: Number(pieceMeter),
//         netWeight: Number(netWeight),
//         avgWeight: calculateAvgWeight(Number(netWeight), Number(pieceMeter)),
//         remarks,
//         warehouseId: String(warehouseRecord.id),
//         fabricId: poTypeId === PO_TYPE_KNITTED_FABRIC ? fabricRecord.id : 0,
//         fabricMasterId: poTypeId === PO_TYPE_WOVEN_FABRIC ? fabricRecord.id : 0
//       };

//       parsedEntries.push(baseEntry);
//     });

//     if (validationErrors.length) {
//       toast.error(validationErrors.join('\n'));
//       return;
//     }

//     if (!parsedEntries.length) {
//       toast.error('No valid rows found in the uploaded file');
//       return;
//     }

//     const combinedEntries = [...currentItemData.pieceEntries, ...parsedEntries];
//     if (!validateUniformFabricCodes(combinedEntries)) {
//       toast.error('All fabric codes must be same');
//       return;
//     }

//     const receivedQuantity = Number(currentItemData.item.quantityReceived) || 0;
//     const totalQuantity = calculateTotalQuantity(combinedEntries);
//     if (totalQuantity > receivedQuantity + 0.0001) {
//       toast.error('Imported piece meters exceed the inward quantity.');
//       return;
//     }

//     updateCurrentItemData({ pieceEntries: combinedEntries });
//     if (!isEditMode) {
//       validateQuantityTotals(combinedEntries, currentItemData.entriesDraft);
//     }
//     toast.success(`Imported ${parsedEntries.length} ${parsedEntries.length === 1 ? 'piece' : 'pieces'}`);
//   };

//   // Update current item data
//   const updateCurrentItemData = (updates: Partial<ItemWithEntries>) => {
//     // Validate yarn stock details if being updated
//     if (isYarnType && updates.yarnStockDetails) {
//       const entriesWithMismatch = updates.yarnStockDetails.filter((entry: YarnStockDetail) => {
//         const acceptedQty = Number(entry.acceptedQty) || 0;
//         const rejectedQty = Number(entry.rejectedQty) || 0;
//         const inwardQty = Number(entry.inwardQty) || 0;
//         return (acceptedQty + rejectedQty) !== inwardQty;
//       });

//       if (entriesWithMismatch.length > 0) {
//         const firstMismatch = entriesWithMismatch[0];
//         const accepted = Number(firstMismatch.acceptedQty || 0);
//         const rejected = Number(firstMismatch.rejectedQty || 0);
//         const total = accepted + rejected;
//         const inward = Number(firstMismatch.inwardQty || 0);
//         toast.warning(`Total quantity ${total.toFixed(2)} cannot exceed Inward Quantity ${inward.toFixed(2)}`);
//         return;
//       }
//     }

//     // Validate item stock details if being updated
//     if (isItemType && updates.itemStockDetails) {
//       const entriesWithMismatch = updates.itemStockDetails.filter((entry: ItemStockDetail) => {
//         const acceptedQty = Number(entry.acceptedQty) || 0;
//         const rejectedQty = Number(entry.rejectedQty) || 0;
//         const inwardQty = Number(entry.inwardQty) || 0;
//         return (acceptedQty + rejectedQty) !== inwardQty;
//       });

//       if (entriesWithMismatch.length > 0) {
//         const firstMismatch = entriesWithMismatch[0];
//         const accepted = Number(firstMismatch.acceptedQty || 0);
//         const rejected = Number(firstMismatch.rejectedQty || 0);
//         const total = accepted + rejected;
//         const inward = Number(firstMismatch.inwardQty || 0);
//         toast.warning(`Total quantity ${total.toFixed(2)} cannot exceed Inward Quantity ${inward.toFixed(2)}`);
//         return;
//       }
//     }

//     const currentItems = itemsWithEntriesRef.current.length ? itemsWithEntriesRef.current : itemsWithEntries;
//     const newItems = [...currentItems];
//     if (!newItems[currentItemIndex]) {
//       return;
//     }
//     newItems[currentItemIndex] = { ...newItems[currentItemIndex], ...updates };
//     itemsWithEntriesRef.current = newItems;
//     setItemsWithEntries(newItems);
//   };

//   // Validate quantity totals
//   const validateQuantityTotals = (entries: any[], drafts: any[]) => {
//     const currentItemData = itemsWithEntries[currentItemIndex];
//     if (!currentItemData) return;

//     const isCurrentlyEditing = currentItemData.editingIndex !== null;
//     const receivedQuantity = Number(currentItemData.item.quantityReceived) || 0;

//     // Filter out entries that are already in drafts (based on ID) to avoid double counting
//     const draftIds = new Set(drafts.map(d => (d as any).id).filter(id => id !== undefined && id !== null));
//     const filteredEntries = entries.filter(e => !draftIds.has((e as any).id));

//     const totalQuantity = calculateTotalQuantity(filteredEntries);
//     const totalDraftQuantity = calculateTotalDraftQuantity(drafts);
//     const combinedTotal = totalQuantity + totalDraftQuantity;

//     if (combinedTotal > receivedQuantity + 0.0001) {
//       setQuantityWarning(`Warning: Total quantity (${combinedTotal.toFixed(2)}) exceeds Inward Quantity (${receivedQuantity.toFixed(2)})`);
//       return;
//     }

//     if (isCurrentlyEditing || isEditMode) {
//       setQuantityWarning('');
//       return;
//     }

//     if (combinedTotal < receivedQuantity) {
//       const remaining = receivedQuantity - combinedTotal;
//       setQuantityWarning(`Remaining quantity to distribute: ${remaining.toFixed(2)}`);
//     }
//     else {
//       setQuantityWarning('');
//     }
//   };

//   const handleAddEntries = () => {
//     const currentItemData = itemsWithEntries[currentItemIndex];
//     if (!currentItemData) return;

//     const validEntries = currentItemData.entriesDraft.filter(entry => {
//       if (isYarnType || isItemType) {
//         const lotEntry = entry as YarnStockDetail | ItemStockDetail;
//         const acceptedQty = Number(lotEntry.acceptedQty) || 0;
//         const rejectedQty = Number(lotEntry.rejectedQty) || 0;

//         return (acceptedQty > 0 || rejectedQty > 0);
//       } else {
//         const pieceEntry = entry as PieceEntry;
//         return pieceEntry.pieceMeter && Number(pieceEntry.pieceMeter) > 0 &&
//           pieceEntry.fabricCode && pieceEntry.fabricDetails;
//       }
//     });

//     if (!validEntries.length) {
//       if (isYarnType || isItemType) {
//         setValidationError('Please enter quantity (accepted or rejected) for at least one entry');
//       } else {
//         setValidationError('Please enter piece meter, fabric code, and fabric details for at least one entry');
//       }
//       return;
//     }

//     // Validate warehouse selection
//     const entriesWithoutWarehouse = validEntries.filter(entry => !entry.warehouseId);
//     if (entriesWithoutWarehouse.length > 0) {
//       setValidationError(`Please select warehouse for all ${isYarnType || isItemType ? 'lots' : 'pieces'}`);
//       return;
//     }

//     // Validate warehouse exists
//     const invalidWarehouseEntries = validEntries.filter(entry => {
//       const warehouseExists = warehouseData.some((w: any) => w.id === Number(entry.warehouseId));
//       return !warehouseExists;
//     });

//     if (invalidWarehouseEntries.length > 0) {
//       setValidationError(`Please select valid warehouse for all ${isYarnType || isItemType ? 'lots' : 'pieces'}`);
//       return;
//     }

//     // For fabric pieces, validate fabric code is same for all pieces in the same item
//     if (isFabricType) {
//       const fabricCodes = validEntries.map(e => (e as PieceEntry).fabricCode?.trim()).filter(Boolean);
//       const firstFabricCode = (validEntries[0] as PieceEntry).fabricCode?.trim();

//       if (fabricCodes.some(code => code !== firstFabricCode)) {
//         setValidationError('All fabric codes must be same');
//         return;
//       }
//     }

//     let entriesToAdd: any[];

//     if (isYarnType) {
//       entriesToAdd = validEntries.map((entry, index) => {
//         const yarnEntry = entry as YarnStockDetail;
//         const acceptedQty = Number(yarnEntry.acceptedQty) || 0;
//         const rejectedQty = Number(yarnEntry.rejectedQty) || 0;
//         const inwardQty = acceptedQty + rejectedQty;

//         const resolvedItemId = yarnEntry.itemId
//           || currentItemData.item.yarnId
//           || null;
//         const resolvedYarnInwardItemId = yarnEntry.orderItemId
//           || currentItemData.item.orderItemId
//           || currentItemData.item.id
//           || null;
//         const resolvedYarnId = yarnEntry.yarnId || resolvedItemId || null;

//         return {
//           id: currentItemData.editingIndex !== null ? currentItemData.editingIndex : Date.now() + index,
//           lotNo: yarnEntry.lotNo?.trim() || `Lot ${currentItemData.yarnStockDetails.length + index + 1}`,
//           inwardQty: inwardQty,
//           acceptedQty: acceptedQty,
//           rejectedQty: rejectedQty,
//           inwardBags: Number(yarnEntry.inwardBags) || 0,
//           kgsPerBag: Number(yarnEntry.kgsPerBag) || 0,
//           remark: yarnEntry.remark || '',
//           warehouseId: yarnEntry.warehouseId || '',
//           conesPerBag: Number(yarnEntry.conesPerBag) || 0,
//           conesWeight: Number(yarnEntry.conesWeight) || 0,
//           itemId: resolvedItemId || null,
//           uomId: yarnEntry.uomId ?? currentItemData.item.uomId ?? null,
//           yarnId: resolvedYarnId,
//           fabricId: yarnEntry.fabricId ?? currentItemData.item.fabricId ?? null,
//           orderItemId: resolvedYarnInwardItemId,
//           yarnTypeId: yarnEntry.yarnTypeId ?? currentItemData.item.yarnTypeId ?? null,
//         };
//       });
//     } else if (isItemType) {
//       entriesToAdd = validEntries.map((entry, index) => {
//         const itemEntry = entry as ItemStockDetail;
//         const acceptedQty = Number(itemEntry.acceptedQty) || 0;
//         const rejectedQty = Number(itemEntry.rejectedQty) || 0;
//         const inwardQty = acceptedQty + rejectedQty;

//         const resolvedItemId = itemEntry.itemId || currentItemData.item.itemId || null;
//         const resolvedItemInwardItemId = itemEntry.itemInwardItemId
//           || currentItemData.item.itemInwardItemId
//           || currentItemData.item.id
//           || null;

//         return {
//           id: currentItemData.editingIndex !== null ? currentItemData.editingIndex : Date.now() + index,
//           lotNo: itemEntry.lotNo?.trim() || `Lot ${currentItemData.itemStockDetails.length + index + 1}`,
//           inwardQty: inwardQty,
//           acceptedQty: acceptedQty,
//           rejectedQty: rejectedQty,
//           inwardBags: Number(itemEntry.inwardBags) || 0,
//           kgsPerBag: Number(itemEntry.kgsPerBag) || 0,
//           remark: itemEntry.remark || '',
//           warehouseId: itemEntry.warehouseId || '',
//           itemId: resolvedItemId || null,
//           uomId: itemEntry.uomId ?? currentItemData.item.uomId ?? null,
//           itemInwardItemId: resolvedItemInwardItemId
//         };
//       });
//     } else {
//       entriesToAdd = validEntries.map((entry, index) => {
//         const pieceEntry = entry as PieceEntry;
//         const netWeight = Number(pieceEntry.netWeight) || 0;
//         const pieceMeter = Number(pieceEntry.pieceMeter) || 0;
//         let pieceNumber = pieceEntry.pieceNumber?.trim();
//         if (!pieceNumber) {
//           pieceNumber = generatePieceNumber();
//         }

//         return {
//           id: currentItemData.editingIndex !== null ? currentItemData.editingIndex : Date.now() + index,
//           pieceNumber,
//           fabricCode: pieceEntry.fabricCode,
//           fabricDetails: pieceEntry.fabricDetails,
//           fabricQuality: pieceEntry.fabricQuality,
//           gstPercent: pieceEntry.gstPercent,
//           gsm: pieceEntry.gsm,
//           ppi: pieceEntry.ppi,
//           pieceMeter: pieceMeter,
//           netWeight: netWeight,
//           avgWeight: calculateAvgWeight(netWeight, pieceMeter),
//           remarks: pieceEntry.remarks || '',
//           warehouseId: pieceEntry.warehouseId || '',
//           fabricId: pieceEntry.fabricId,
//           fabricMasterId: pieceEntry.fabricMasterId
//         };
//       });
//     }

//     const updatedEntries = currentItemData.editingIndex !== null
//       ? (isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries).map(existing =>
//         existing.id === currentItemData.editingIndex ? entriesToAdd[0] : existing
//       )
//       : [...(isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries), ...entriesToAdd];

//     if (isFabricType && !validateUniformFabricCodes(updatedEntries as PieceEntry[])) {
//       setValidationError('All fabric codes must be same');
//       return;
//     }

//     // For fabric, check duplicate piece numbers
//     if (isFabricType) {
//       const pieceNumbers = updatedEntries.map((e: PieceEntry) => e.pieceNumber).filter(Boolean);
//       if (new Set(pieceNumbers).size !== pieceNumbers.length) {
//         setValidationError('Duplicate piece numbers are not allowed');
//         return;
//       }
//     }

//     // Final validation - allow edit mode updates, but never allow totals to exceed inward quantity
//     const receivedQuantity = Number(currentItemData.item.quantityReceived) || 0;
//     const totalQuantity = calculateTotalQuantity(updatedEntries);

//     if (exceedsReceivedQuantity(updatedEntries, receivedQuantity)) {
//       setValidationError(`Total ${isYarnType || isItemType ? 'quantity' : 'meter'} (${totalQuantity.toFixed(2)}) cannot exceed Inward Quantity (${receivedQuantity.toFixed(2)})`);
//       return;
//     }

//     setValidationError('');

//     if (isYarnType) {
//       updateCurrentItemData({
//         yarnStockDetails: updatedEntries as YarnStockDetail[],
//         entriesDraft: [],
//         numberOfEntries: '0',
//         editingIndex: null
//       });
//     } else if (isItemType) {
//       updateCurrentItemData({
//         itemStockDetails: updatedEntries as ItemStockDetail[],
//         entriesDraft: [],
//         numberOfEntries: '0',
//         editingIndex: null
//       });
//     } else {
//       updateCurrentItemData({
//         pieceEntries: updatedEntries as PieceEntry[],
//         entriesDraft: [],
//         numberOfEntries: '0',
//         editingIndex: null
//       });
//     }

//     if (!isEditMode || isFabricType) {
//       validateQuantityTotals(updatedEntries, []);
//     }
//   };

//   const handleDeleteEntry = (id: number) => {
//     const currentItemData = itemsWithEntries[currentItemIndex];

//     if (isYarnType) {
//       const updatedLotEntries = currentItemData.yarnStockDetails.filter(entry => entry.id !== id);
//       updateCurrentItemData({ yarnStockDetails: updatedLotEntries });
//       setValidationError('');
//       if (!isEditMode) {
//         validateQuantityTotals(updatedLotEntries, currentItemData.entriesDraft);
//       }
//     } else if (isItemType) {
//       const updatedItemEntries = currentItemData.itemStockDetails.filter(entry => entry.id !== id);
//       updateCurrentItemData({ itemStockDetails: updatedItemEntries });
//       setValidationError('');
//       if (!isEditMode) {
//         validateQuantityTotals(updatedItemEntries, currentItemData.entriesDraft);
//       }
//     } else {
//       const updatedPieceEntries = currentItemData.pieceEntries.filter(entry => entry.id !== id);
//       updateCurrentItemData({ pieceEntries: updatedPieceEntries });
//       setValidationError('');
//       validateQuantityTotals(updatedPieceEntries, currentItemData.entriesDraft);
//     }
//   };

//   const handleEditEntry = (entry: any) => {
//     const currentItemData = itemsWithEntries[currentItemIndex];

//     if (isYarnType) {
//       const lotEntry = entry as YarnStockDetail;
//       updateCurrentItemData({
//         editingIndex: lotEntry.id,
//         entriesDraft: [{
//           ...lotEntry,
//           warehouseId: lotEntry.warehouseId || ''
//         }]
//       });
//       const remainingLotEntries = currentItemData.yarnStockDetails.filter(e => e.id !== lotEntry.id);
//       if (!isEditMode) {
//         validateQuantityTotals(remainingLotEntries, [{ ...lotEntry }]);
//       }
//     } else if (isItemType) {
//       const itemEntry = entry as ItemStockDetail;
//       updateCurrentItemData({
//         editingIndex: itemEntry.id,
//         entriesDraft: [{
//           ...itemEntry,
//           warehouseId: itemEntry.warehouseId || ''
//         }]
//       });
//       const remainingItemEntries = currentItemData.itemStockDetails.filter(e => e.id !== itemEntry.id);
//       if (!isEditMode) {
//         validateQuantityTotals(remainingItemEntries, [{ ...itemEntry }]);
//       }
//     } else {
//       const pieceEntry = entry as PieceEntry;
//       updateCurrentItemData({
//         editingIndex: pieceEntry.id,
//         entriesDraft: [{
//           ...pieceEntry,
//           warehouseId: pieceEntry.warehouseId || ''
//         }]
//       });
//       const remainingPieceEntries = currentItemData.pieceEntries.filter(e => e.id !== pieceEntry.id);
//       validateQuantityTotals(remainingPieceEntries, [{ ...pieceEntry }]);
//     }
//     setValidationError('');
//   };

//   const handleAddEntriesForm = () => {
//     const currentItemData = itemsWithEntries[currentItemIndex];
//     if (!currentItemData) return;

//     const count = parseInt(currentItemData.numberOfEntries || '0', 10);
//     if (isNaN(count) || count <= 0) {
//       setValidationError(`Please enter a valid number of ${isYarnType || isItemType ? 'lots' : 'pieces'}`);
//       return;
//     }

//     const poTypeId = currentItemData.item.poTypeId;
//     const firstDraft = currentItemData.entriesDraft[0] as PieceEntry | undefined;
//     const firstPiece = currentItemData.pieceEntries[0];

//     // Get default fabric ID (can be either fabricId or fabricMasterId depending on PO type)
//     let defaultFabricId = 0;
//     if (poTypeId === PO_TYPE_KNITTED_FABRIC) {
//       defaultFabricId = firstPiece?.fabricId || firstDraft?.fabricId || currentItemData.item.fabricId || 0;
//     } else if (poTypeId === PO_TYPE_WOVEN_FABRIC) {
//       defaultFabricId = firstPiece?.fabricMasterId || firstDraft?.fabricMasterId || currentItemData.item.fabricMasterId || 0;
//     }

//     const newDrafts = Array.from({ length: count }, (_, index) => {
//       if (isYarnType) {
//         return {
//           id: currentItemData.entriesDraft.length + index + 1,
//           lotNo: '',
//           inwardQty: 0,
//           acceptedQty: 0,
//           rejectedQty: 0,
//           inwardBags: 0,
//           kgsPerBag: 0,
//           conesPerBag: 0,
//           conesWeight: 0,
//           remark: '',
//           warehouseId: '',
//           yarnTypeId: currentItemData.item.yarnTypeId || null
//         };
//       } else if (isItemType) {
//         return {
//           id: currentItemData.entriesDraft.length + index + 1,
//           lotNo: '',
//           inwardQty: 0,
//           acceptedQty: 0,
//           rejectedQty: 0,
//           inwardBags: 0,
//           kgsPerBag: 0,
//           conesPerBag: 0,
//           conesWeight: 0,
//           remark: '',
//           warehouseId: ''
//         };
//       } else {
//         // For fabric pieces, get default values and auto-populate fabric details
//         const basePieceEntry: Partial<PieceEntry> = {
//           id: currentItemData.entriesDraft.length + index + 1,
//           pieceNumber: '',
//           pieceMeter: 0,
//           netWeight: 0,
//           avgWeight: 0,
//           remarks: '',
//           warehouseId: ''
//         };

//         // If there's a default fabric ID, populate all fabric details automatically
//         if (defaultFabricId > 0) {
//           const fabricDetails = populateFabricDetailsFromMaster(defaultFabricId);
//           return { ...basePieceEntry, ...fabricDetails };
//         }

//         // Otherwise use defaults from previous entries
//         const defaultFabricCode = firstPiece?.fabricCode || firstDraft?.fabricCode || currentItemData.item.productName || '';
//         const defaultFabricDetails = firstPiece?.fabricDetails || firstDraft?.fabricDetails || '';

//         return {
//           ...basePieceEntry,
//           fabricCode: defaultFabricCode,
//           fabricDetails: defaultFabricDetails,
//           fabricQuality: firstPiece?.fabricQuality || firstDraft?.fabricQuality || '',
//           gstPercent: firstPiece?.gstPercent || firstDraft?.gstPercent,
//           gsm: firstPiece?.gsm || firstDraft?.gsm,
//           ppi: firstPiece?.ppi || firstDraft?.ppi,
//           fabricId: (poTypeId === PO_TYPE_KNITTED_FABRIC) ? (firstPiece?.fabricId || firstDraft?.fabricId || currentItemData.item.fabricId || 0) : 0,
//           fabricMasterId: (poTypeId === PO_TYPE_WOVEN_FABRIC) ? (firstPiece?.fabricMasterId || firstDraft?.fabricMasterId || currentItemData.item.fabricMasterId || 0) : 0
//         };
//       }
//     });

//     const updatedDrafts = [...currentItemData.entriesDraft, ...newDrafts];
//     updateCurrentItemData({ entriesDraft: updatedDrafts });
//     if (!isEditMode || isFabricType) {
//       validateQuantityTotals(
//         isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries,
//         updatedDrafts
//       );
//     }
//   };
//   const updateDraftEntry = (index: number, key: string, value: any) => {
//     const currentItemData = itemsWithEntries[currentItemIndex];
//     const updatedDrafts = [...currentItemData.entriesDraft];

//     if (isFabricType && (key === 'netWeight' || key === 'pieceMeter')) {
//       const draft = { ...updatedDrafts[index] } as Partial<PieceEntry>;
//       if (key === 'netWeight') {
//         draft.netWeight = value;
//       } else if (key === 'pieceMeter') {
//         draft.pieceMeter = value;
//       }

//       const netWeight = Number(draft.netWeight) || 0;
//       const pieceMeter = Number(draft.pieceMeter) || 0;
//       draft.avgWeight = calculateAvgWeight(netWeight, pieceMeter);
//       updatedDrafts[index] = draft;
//     } else if (isFabricType && key === 'pieceNumber' && value) {
//       const trimmed = value.trim();
//       if (trimmed) {
//         const editingId = currentItemData.editingIndex;
//         const currentPieceNumbers = new Set([
//           ...(isYarnType ? currentItemData.yarnStockDetails : currentItemData.pieceEntries).map((e: any) => e.pieceNumber).filter(Boolean),
//           ...updatedDrafts.filter((_, i) => i !== index).map((d: any) => (d as PieceEntry).pieceNumber).filter(Boolean)
//         ]);
//         if (currentPieceNumbers.has(trimmed)) {
//           setValidationError(`Piece number ${trimmed} already exists`);
//           return;
//         } else {
//           setValidationError('');
//         }
//       }
//       const draft = { ...updatedDrafts[index] } as any;
//       draft[key] = value;
//       updatedDrafts[index] = draft;
//     } else if (isYarnType && (key === 'inwardBags' || key === 'kgsPerBag' || key === 'conesPerBag')) {
//       const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
//       if (key === 'inwardBags') draft.inwardBags = Number(value) || 0;
//       if (key === 'kgsPerBag') draft.kgsPerBag = Number(value) || 0;
//       if (key === 'conesPerBag') draft.conesPerBag = Number(value) || 0;

//       const bags = Number(draft.inwardBags || 0);
//       const kpb = Number(draft.kgsPerBag || 0);
//       const cones = Number(draft.conesPerBag || 0);
//       const calculatedQty = bags * kpb;

//       if ((key === 'inwardBags' || key === 'kgsPerBag') && calculatedQty > 0) {
//         draft.acceptedQty = calculatedQty;
//         draft.inwardQty = calculatedQty + (Number(draft.rejectedQty) || 0);
//       }

//       draft.conesWeight = cones > 0 && kpb > 0 ? Number((kpb / cones).toFixed(3)) : 0;

//       updatedDrafts[index] = draft as any;
//     } else if (isItemType && (key === 'inwardBags' || key === 'kgsPerBag' || key === 'conesPerBag')) {
//       const draft = { ...updatedDrafts[index] } as Partial<ItemStockDetail>;
//       if (key === 'inwardBags') draft.inwardBags = Number(value) || 0;
//       if (key === 'kgsPerBag') draft.kgsPerBag = Number(value) || 0;
//       if (key === 'conesPerBag') draft.conesPerBag = Number(value) || 0;

//       const bags = Number(draft.inwardBags || 0);
//       const kpb = Number(draft.kgsPerBag || 0);
//       const cones = Number(draft.conesPerBag || 0);
//       const calculatedQty = bags * kpb;

//       if ((key === 'inwardBags' || key === 'kgsPerBag') && calculatedQty > 0) {
//         draft.acceptedQty = calculatedQty;
//         draft.inwardQty = calculatedQty + (Number(draft.rejectedQty) || 0);
//       }

//       draft.conesWeight = cones > 0 && kpb > 0 ? Number((kpb / cones).toFixed(3)) : 0;

//       updatedDrafts[index] = draft as any;
//     } else if (isYarnType && (key === 'acceptedQty' || key === 'rejectedQty')) {
//       const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
//       draft[key as keyof YarnStockDetail] = value;

//       const acceptedQty = Number(draft.acceptedQty) || 0;
//       const rejectedQty = Number(draft.rejectedQty) || 0;
//       draft.inwardQty = acceptedQty + rejectedQty;

//       updatedDrafts[index] = draft;
//     } else if (isYarnType && key === 'inwardQty') {
//       const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
//       draft.inwardQty = Number(value) || 0;

//       const inwardQty = Number(draft.inwardQty) || 0;
//       const rejectedQty = Number(draft.rejectedQty) || 0;
//       draft.acceptedQty = Math.max(0, inwardQty - rejectedQty);

//       updatedDrafts[index] = draft;
//     } else {
//       const draft = { ...updatedDrafts[index] } as any;
//       draft[key] = value;
//       updatedDrafts[index] = draft;
//     }

//     updateCurrentItemData({ entriesDraft: updatedDrafts });
//     if (!isEditMode || isFabricType) {
//       validateQuantityTotals(
//         isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries,
//         updatedDrafts
//       );
//     }
//   };

//   const handleRemoveDraftEntry = (index: number) => {
//     const currentItemData = itemsWithEntries[currentItemIndex];
//     if (!currentItemData) return;

//     const updatedDrafts = currentItemData.entriesDraft.filter((_, i) => i !== index);
//     const updates: Partial<ItemWithEntries> = { entriesDraft: updatedDrafts };

//     if (updatedDrafts.length === 0) {
//       updates.numberOfEntries = '0';
//       updates.editingIndex = null;
//     }

//     updateCurrentItemData(updates);
//     setValidationError('');
//     if (!isEditMode || isFabricType) {
//       const existingEntries = isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries;
//       validateQuantityTotals(existingEntries, updatedDrafts);
//     } else {
//       setQuantityWarning('');
//     }
//   };

//   const handleCancelDrafts = () => {
//     const currentItemData = itemsWithEntries[currentItemIndex];
//     if (!currentItemData || currentItemData.entriesDraft.length === 0) return;

//     updateCurrentItemData({
//       entriesDraft: [],
//       numberOfEntries: '0',
//       editingIndex: null
//     });
//     setValidationError('');
//     setQuantityWarning('');
//     if (!isEditMode) {
//       const existingEntries = isYarnType ? currentItemData.yarnStockDetails : currentItemData.pieceEntries;
//       validateQuantityTotals(existingEntries, []);
//     }
//   };

//   // const updateDraftEntry = (index: number, key: string, value: any) => {
//   //   const currentItemData = itemsWithEntries[currentItemIndex];
//   //   const updatedDrafts = [...currentItemData.entriesDraft];

//   //   if (isFabricType && (key === 'netWeight' || key === 'pieceMeter')) {
//   //     const draft = { ...updatedDrafts[index] } as Partial<PieceEntry>;
//   //     if (key === 'netWeight') {
//   //       draft.netWeight = value;
//   //     } else if (key === 'pieceMeter') {
//   //       draft.pieceMeter = value;
//   //     }

//   //     // Auto-calculate average weight
//   //     const netWeight = Number(draft.netWeight) || 0;
//   //     const pieceMeter = Number(draft.pieceMeter) || 0;
//   //     draft.avgWeight = calculateAvgWeight(netWeight, pieceMeter);
//   //     updatedDrafts[index] = draft;
//   //   } else if (isFabricType && key === 'pieceNumber' && value) {
//   //     const trimmed = value.trim();
//   //     if (trimmed) {
//   //       // Check for duplicates
//   //       const editingId = currentItemData.editingIndex;
//   //       const currentPieceNumbers = new Set([
//   //         ...(isYarnType ? currentItemData.yarnStockDetails : currentItemData.pieceEntries).map((e: any) => e.pieceNumber).filter(Boolean),
//   //         ...updatedDrafts.filter((_, i) => i !== index).map((d: any) => (d as PieceEntry).pieceNumber).filter(Boolean)
//   //       ]);
//   //       if (currentPieceNumbers.has(trimmed)) {
//   //         setValidationError(`Piece number ${trimmed} already exists`);
//   //         return;
//   //       } else {
//   //         setValidationError('');
//   //       }
//   //     }
//   //     const draft = { ...updatedDrafts[index] } as any;
//   //     draft[key] = value;
//   //     updatedDrafts[index] = draft;
//   //   } else if (isYarnType && (key === 'acceptedQty' || key === 'rejectedQty')) {
//   //     const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
//   //     draft[key as keyof YarnStockDetail] = value;

//   //     // Calculate inward quantity as sum of accepted + rejected
//   //     const acceptedQty = Number(draft.acceptedQty) || 0;
//   //     const rejectedQty = Number(draft.rejectedQty) || 0;
//   //     draft.inwardQty = acceptedQty + rejectedQty;

//   //     updatedDrafts[index] = draft;
//   //   } else if (isYarnType && key === 'inwardQty') {
//   //     const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
//   //     draft.inwardQty = Number(value) || 0;

//   //     // When inwardQty is changed, keep rejectedQty as is and adjust acceptedQty
//   //     const inwardQty = Number(draft.inwardQty) || 0;
//   //     const rejectedQty = Number(draft.rejectedQty) || 0;
//   //     draft.acceptedQty = Math.max(0, inwardQty - rejectedQty);

//   //     updatedDrafts[index] = draft;
//   //   } else if (isYarnType && ['csp', 'strength', 'count', 'cvCountPercent', 'cvStrengthPercent'].includes(key)) {
//   //     const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
//   //     const numValue = value === '' ? undefined : Number(value);
//   //     (draft as any)[key] = numValue;
//   //     updatedDrafts[index] = draft;
//   //   } else if (isYarnType && key === 'yarnCsp') {
//   //     const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
//   //     draft.yarnCsp = value || undefined;
//   //     updatedDrafts[index] = draft;
//   //   } else {
//   //     const draft = { ...updatedDrafts[index] } as any;
//   //     draft[key] = value;
//   //     updatedDrafts[index] = draft;
//   //   }

//   //   updateCurrentItemData({ entriesDraft: updatedDrafts });
//   //   if (!isEditMode) {
//   //     validateQuantityTotals(
//   //       isYarnType ? currentItemData.yarnStockDetails : currentItemData.pieceEntries,
//   //       updatedDrafts
//   //     );
//   //   }
//   // };

//   // In your save/update handler - add this after successful update
// // const handleUpdateSuccess = async (response: any) => {
// //   try {
// //     // Process and reload the updated data
// //     const updatedItems = reloadDataAfterUpdate(response);
    
// //     if (!updatedItems || updatedItems.length === 0) {
// //       toast.warning('Update successful but data could not be refreshed. Please reload the page.');
// //       return;
// //     }

// //     // Update formData with new inward ID if needed
// //     if (response?.id && !formData.id) {
// //       // For new creates, set the ID
// //       formData.id = response.id;
// //     }

// //     toast.success('Purchase Inward updated successfully!');
    
// //     // Optional: Navigate back or refresh
// //     // navigate(-1);
// //   } catch (error) {
// //     console.error('Error processing update response:', error);
// //     toast.error('Update successful but data refresh failed. Please reload the page.');
// //   }
// // };

// // Validate that inwardId is present in all records
// // const validateInwardDataIntegrity = (itemsWithEntries: ItemWithEntries[]) => {
// //   const issues: string[] = [];

// //   itemsWithEntries.forEach((itemEntry, idx) => {
// //     itemEntry.yarnStockDetails.forEach((lot, lotIdx) => {
// //       if (!lot.inwardId) {
// //         issues.push(`Item ${idx + 1}, Yarn Lot ${lotIdx + 1}: Missing inwardId`);
// //       }
// //       if (!lot.id) {
// //         issues.push(`Item ${idx + 1}, Yarn Lot ${lotIdx + 1}: Missing lot ID`);
// //       }
// //     });

// //     itemEntry.itemStockDetails.forEach((detail, detailIdx) => {
// //       if (!detail.inwardId) {
// //         issues.push(`Item ${idx + 1}, Stock Detail ${detailIdx + 1}: Missing inwardId`);
// //       }
// //     });
// //   });

// //   if (issues.length > 0) {
// //     console.warn('Data Integrity Issues:', issues);
// //     toast.warning(`Data integrity warning: ${issues.length} issue(s) found`);
// //     return false;
// //   }
// //   return true;
// // };


//   const handleSave = async () => {
//     const latestItemsWithEntries = itemsWithEntriesRef.current.length ? itemsWithEntriesRef.current : itemsWithEntries;

//     // Validate all items
//     for (let i = 0; i < latestItemsWithEntries.length; i++) {
//       const itemData = latestItemsWithEntries[i];
//       const entries = isYarnType ? itemData.yarnStockDetails : isItemType ? itemData.itemStockDetails : itemData.pieceEntries;
//       const totalQuantity = calculateTotalQuantity(entries);
//       const receivedQuantity = Number(itemData.item.quantityReceived) || 0;

//       if (exceedsReceivedQuantity(entries, receivedQuantity)) {
//         setValidationError(
//           `Item "${itemData.item.productName}": Total ${isYarnType || isItemType ? 'quantity' : 'meter'} (${totalQuantity.toFixed(2)}) cannot exceed Inward Quantity (${receivedQuantity.toFixed(2)})`
//         );
//         setCurrentItemIndex(i);
//         return;
//       }

//       if (!isEditMode && totalQuantity !== receivedQuantity) {
//         setValidationError(
//           `Item "${itemData.item.productName}": Total quantity (${totalQuantity.toFixed(2)}) must equal Inward Quantity (${receivedQuantity.toFixed(2)})`
//         );
//         setCurrentItemIndex(i);
//         return;
//       }

//       if (entries.length === 0) {
//         setValidationError(`Item "${itemData.item.productName}": Please add at least one ${isYarnType || isItemType ? 'lot' : 'piece'} entry`);
//         setCurrentItemIndex(i);
//         return;
//       }

//       if (isYarnType || isItemType) {
//         const mismatchEntry = (entries as (YarnStockDetail | ItemStockDetail)[]).find(entry =>
//           (Number(entry.acceptedQty || 0) + Number(entry.rejectedQty || 0)) !== Number(entry.inwardQty || 0)
//         );
//         if (mismatchEntry) {
//           const accepted = Number(mismatchEntry.acceptedQty || 0);
//           const rejected = Number(mismatchEntry.rejectedQty || 0);
//           const total = accepted + rejected;
//           const inward = Number(mismatchEntry.inwardQty || 0);
//           setValidationError(`Item "${itemData.item.productName}": Total quantity ${total.toFixed(2)} cannot exceed Inward Quantity ${inward.toFixed(2)}`);
//           setCurrentItemIndex(i);
//           return;
//         }
//       }

//       if (isYarnType) {
//         const duplicateLotNo = findDuplicateText(entries as YarnStockDetail[], (entry) => entry.lotNo || null);
//         if (duplicateLotNo) {
//           setValidationError(`Item "${itemData.item.productName}": This Lot No already exists (${duplicateLotNo})`);
//           setCurrentItemIndex(i);
//           return;
//         }
//       }

//       if (isFabricType && !validateUniformFabricCodes(entries as PieceEntry[])) {
//         setValidationError('All fabric codes must be same');
//         setCurrentItemIndex(i);
//         return;
//       }

//       if (isFabricType) {
//         const duplicatePieceNo = findDuplicateText(entries as PieceEntry[], (entry) => entry.pieceNumber || null);
//         if (duplicatePieceNo) {
//           setValidationError(`Item "${itemData.item.productName}": This Piece No already exists (${duplicatePieceNo})`);
//           setCurrentItemIndex(i);
//           return;
//         }
//       }

//       if (isItemType) {
//         const duplicateItemLotNo = findDuplicateText(entries as ItemStockDetail[], (entry) => entry.lotNo || null);
//         if (duplicateItemLotNo) {
//           setValidationError(`Item "${itemData.item.productName}": This Lot No already exists (${duplicateItemLotNo})`);
//           setCurrentItemIndex(i);
//           return;
//         }

//         const duplicateItemName = findDuplicateText(entries as any[], (entry) => entry.itemName || null);
//         if (duplicateItemName) {
//           setValidationError(`Item "${itemData.item.productName}": This Item Name already exists (${duplicateItemName})`);
//           setCurrentItemIndex(i);
//           return;
//         }
//       }

//       // Validate warehouses
//       const entriesWithoutWarehouse = entries.filter(entry => !entry.warehouseId);
//       if (entriesWithoutWarehouse.length > 0) {
//         setValidationError(`Item "${itemData.item.productName}": Please select warehouse for all ${isYarnType || isItemType ? 'lots' : 'pieces'}`);
//         setCurrentItemIndex(i);
//         return;
//       }

//       // For fabric, validate fabric details
//       if (isFabricType) {
//         const entriesWithoutFabricDetails = (entries as PieceEntry[]).filter((entry) => !entry.fabricDetails);
//         if (entriesWithoutFabricDetails.length > 0) {
//           setValidationError(`Item "${itemData.item.productName}": Please provide fabric details for all pieces`);
//           setCurrentItemIndex(i);
//           return;
//         }
//       }
//     }

//      isSavingRef.current = true;
//       let purchaseInwardNoToUse = isEditMode
//             ? (formData.purchaseInwardNo || purchaseInwardNumber)
//             : purchaseInwardNumber;

//           if (!purchaseInwardNoToUse) {
//             try {
//               const docResponse = await documentNumberService.generateDocumentNumber({
//                 screenName: 'Purchase Inward'
//               });
//               purchaseInwardNoToUse = docResponse.documentNumber;
//               setPurchaseInwardNumber(purchaseInwardNoToUse);
//             } catch (error) {
//               console.warn('Failed to generate purchase inward number:', error);
//             }
//           }

//           // if (purchaseInwardNoToUse) {
//           //   alert('Purchase Inward Number: ' + purchaseInwardNoToUse);
//           // }
//     //     let purchaseInwardNo = '';
//     // try {
//     //   const docResponse = await documentNumberService.generateDocumentNumber({
//     //     screenName: 'Purchase Inward'
//     //   });
//     //   purchaseInwardNo = docResponse.documentNumber;
//     //   alert('Generated Purchase Inward Number: ' + purchaseInwardNo);
//     // } catch (error) {
//     //   console.warn('Failed to generate purchase inward number:', error);
//     // }

//     const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');

//     // Build payload (include DC number & date if provided)
//     const payload = {
//       id: isEditMode ? formData.id : 0,
//       poTypeId: latestItemsWithEntries[0].item.poTypeId,
//       vendorId: latestItemsWithEntries[0].item.vendorId,
//       fabricTypeId: latestItemsWithEntries[0].item.fabricTypeId || 0,
//       inwardDate: formData.inwardDate || new Date().toISOString().split('T')[0],
//       remarks: formData.remark || formData.remarks || '',
//       activeFlag: true,
//       purchaseOrderId: latestItemsWithEntries[0].item.poId,
//       purchaseInwardNo: isEditMode ? (formData.purchaseInwardNo || purchaseInwardNoToUse) : purchaseInwardNoToUse,
//       companyId: storedCompanyId ? parseInt(storedCompanyId) : null,
//       // Include DC fields coming from the parent form (if available)
//       dcNumber: formData.dcNumber || null,
//       dcDate: formData.dcDate || null,
//       millInvNo: formData.millInvNo || null,
//       millDate: formData.millDate || null,
//       icilInvNo: formData.icilInvNo || null,
//       icilInvDate: formData.icilInvDate || null,
      
//       purchaseInwardItemsDtl: latestItemsWithEntries.map((itemData, index) => {
//         // Get the original item ID from formData if in edit mode
//         const originalItem = formData.purchaseInwardItemsDtl?.[index];
//         const itemId = isEditMode ? (originalItem?.id || 0) : 0;

//         if (isYarnType) {
//           return {
//             id: itemId,
//             inwardId: isEditMode ? (originalItem?.inwardId || 0) : 0,
//             poItemId: itemData.item.id,
//             quantityReceived: itemData.item.quantityReceived,
//             price: itemData.item.price,
//             millNameId: Number(itemData.item.millNameId) || null,
//             activeFlag: true,
//             yarnTypeId: itemData.item.yarnTypeId ? Number(itemData.item.yarnTypeId) : null,
//             noOfLots: itemData.yarnStockDetails.length,
//             yarnStockDetails: itemData.yarnStockDetails.map(entry => {
//               const resolvedItemId = entry.itemId
//                 || itemData.item.yarnId
//                 || null;
//               const resolvedYarnInwardItemId = entry.orderItemId
//                 || itemData.item.orderItemId
//                 || itemData.item.id
//                 || null;
//               const resolvedYarnId = entry.yarnId || resolvedItemId || null;

//               const acceptedQty = Number(entry.acceptedQty) || 0;
//               const rejectedQty = Number(entry.rejectedQty) || 0;
//               const inwardQty = acceptedQty + rejectedQty;

//               return {
//                 id: typeof entry.id === 'number' && entry.id > 0 && entry.id < 1000000000000 ? entry.id : 0,
//                 itemId: resolvedItemId || null,
//                 orderItemId: resolvedYarnInwardItemId,
//                 yarnId: resolvedYarnId,
//                 uomId: entry.uomId ?? itemData.item.uomId ?? null,
//                 lotNo: entry.lotNo || '',
//                 inwardQty: inwardQty,
//                 inwardBags: Number(entry.inwardBags) || 0,
//                 kgsPerBag: Number(entry.kgsPerBag) || 0,
//                 conesPerBag: Number(entry.conesPerBag) || 0,
//                 conesWeight: Number(entry.conesWeight) || 0,
//                 acceptedQty: acceptedQty,
//                 rejectedQty: rejectedQty,
//                 warehouseId: Number(entry.warehouseId) || 0,
//                 remark: entry.remark || '',
//                 yarnTypeId: entry.yarnTypeId ? Number(entry.yarnTypeId) : (itemData.item.yarnTypeId ? Number(itemData.item.yarnTypeId) : null)
//               };
//             })
//           };
//         } else if (isItemType) {
//           return {
//             id: itemId,
//             inwardId: isEditMode ? (originalItem?.inwardId || 0) : 0,
//             poItemId: itemData.item.id,
//             quantityReceived: itemData.item.quantityReceived,
//             price: itemData.item.price,
//             millNameId: Number(itemData.item.millNameId) || null,
//             activeFlag: true,
//             noOfLots: itemData.itemStockDetails.length,
//             itemStockDetails: itemData.itemStockDetails.map(entry => {
//               const resolvedItemId = entry.itemId || itemData.item.itemId || null;
//               const resolvedItemInwardItemId = entry.itemInwardItemId
//                 || itemData.item.itemInwardItemId
//                 || itemData.item.id
//                 || null;

//               const acceptedQty = Number(entry.acceptedQty) || 0;
//               const rejectedQty = Number(entry.rejectedQty) || 0;
//               const inwardQty = acceptedQty + rejectedQty;

//               return {
//                 id: typeof entry.id === 'number' && entry.id > 0 && entry.id < 1000000000000 ? entry.id : 0,
//                 itemId: resolvedItemId || null,
//                 itemInwardItemId: resolvedItemInwardItemId,
//                 uomId: entry.uomId ?? itemData.item.uomId ?? null,
//                 lotNo: entry.lotNo || '',
//                 inwardQty: inwardQty,
//                 inwardBags: Number(entry.inwardBags) || 0,
//                 kgsPerBag: Number(entry.kgsPerBag) || 0,
//                 conesPerBag: Number(entry.conesPerBag) || 0,
//                 conesWeight: Number(entry.conesWeight) || 0,
//                 acceptedQty: acceptedQty,
//                 rejectedQty: rejectedQty,
//                 warehouseId: Number(entry.warehouseId) || 0,
//                 remark: entry.remark || ''
//               };
//             })
//           };
       
//         } else {
//           return {
//             id: itemId,
//             inwardId: isEditMode ? (originalItem?.inwardId || 0) : 0,
//             poItemId: itemData.item.id,
//             quantityReceived: itemData.item.quantityReceived,
//             price: itemData.item.price,
//             millNameId: Number(itemData.item.millNameId) || null,
//             activeFlag: true,
//             noOfPiece: itemData.pieceEntries.length,
//             pieceEntries: itemData.pieceEntries.map(entry => ({
//               id: typeof entry.id === 'number' && entry.id > 0 && entry.id < 1000000000000 ? entry.id : 0,
//               pieceNumber: entry.pieceNumber,
//               fabricCode: entry.fabricCode,
//               fabricDetails: entry.fabricDetails,
//               fabricQuality: entry.fabricQuality,
//               gstPercent: entry.gstPercent,
//               gsm: entry.gsm,
//               ppi: entry.ppi,
//               quantity: entry.pieceMeter,
//               weight: entry.netWeight,
//               cost: itemData.item.price * entry.pieceMeter,
//               remarks: entry.remarks,
//               warehouseId: Number(entry.warehouseId),
//               fabricId: entry.fabricId,
//               fabricMasterId: entry.fabricMasterId,
//               activeFlag: true
//             }))
//           };
//         }
//       })
//     };

//     console.log('Saving payload:', payload);
//     console.log('DEBUG fabricTypeId:', {
//       fromItem: latestItemsWithEntries[0].item.fabricTypeId,
//       selectedItems: selectedItems[0]?.fabricTypeId,
//       payload: payload.fabricTypeId
//     });

//     try {
//        let result;
//         // alert(JSON.stringify(payload));
//            console.log(payload);
//       if (isEditMode) {
       
//      result = await dispatch(updatePurchaseInward(payload));
//       } else {
//        result = await dispatch(createPurchaseInward(payload));
//             const sequencePart = purchaseInwardNoToUse.split('/').pop() || purchaseInwardNoToUse;
//                 documentNumberService.updateMemoryCache('Purchase Inward', sequencePart);
//       }
//         if (result) {
//       toast.success(`Purchase Inward ${isEditMode ? 'updated' : 'created'} successfully!`);
//       setValidationError('');
//       navigate('/transaction/purchase-inward-details');
//     }
//     } 
// catch (error: any) {
//     console.error('Failed to save purchase inward:', error);
//     let errorMessage = 'Failed to save purchase inward. Please try again.';
    
//     if (typeof error === 'string') {
//       errorMessage = error;
//     } else if (error?.message) {
//       errorMessage = error.message;
//     } else if (error?.response?.data?.message) {
//       errorMessage = error.response.data.message;
//     }
    
//     if (errorMessage.includes('Duplicate Lot Number') || errorMessage.includes('duplicate')) {
//       setValidationError(errorMessage);
//       toast.error(errorMessage);
//       return;
//     }
    
//     setValidationError(errorMessage);
//     toast.error(errorMessage);
//   }
//   };

//   if (!selectedItems || selectedItems.length === 0) {
//     return null;
//   }

//   const currentItemData = itemsWithEntries[currentItemIndex];
//   if (!currentItemData) {
//     return null;
//   }

//   const selectedItem = currentItemData.item;
//   const entries = isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries;
//   const entriesDraft = currentItemData.entriesDraft;
//   const numberOfEntries = currentItemData.numberOfEntries;
//   const editingIndex = currentItemData.editingIndex;

//   // Filter out the entry currently being edited from existing entries to avoid double counting
//   const nonEditingEntries = entries.filter(e => e.id !== editingIndex);
//   const totalQuantity = calculateTotalQuantity(nonEditingEntries);
//   const totalDraftQuantity = calculateTotalDraftQuantity(entriesDraft);
  
//   const inwardQuantity = Number(selectedItem.quantityReceived) || 0;
//   const distributedQty = Number(selectedItem.distributedQty) || 0;
  
//   // For fabric: distributedQty from backend + currently added pieces in this screen
//   // For others: total from already added lots (excluding the one being edited) + current drafts
//   const totalDistributed = isFabricType 
//     ? (distributedQty + totalQuantity + totalDraftQuantity)
//     : (totalQuantity + totalDraftQuantity);

//   const remainingQuantity = inwardQuantity - totalDistributed;

//   const poTypeId = selectedItem.poTypeId;

//   return (
//     <div className="mt-10 p-6 bg-white shadow-md rounded-lg">
//       <input
//         type="file"
//         ref={fileInputRef}
//         className="hidden"
//         accept=".xls,.xlsx"
//         onChange={handleFileUpload}
//       />
//       <div className="flex justify-between items-center border-b pb-4">
//         <div className="flex items-center space-x-4">
//           <Button
//             variant="outline"
//             onClick={() => {
//               const updatedItems = itemsWithEntries.map(itemData => ({
//                 ...itemData.item,
//                 yarnStockDetails: itemData.yarnStockDetails,
//                 pieceEntries: itemData.pieceEntries,
//                 itemStockDetails: itemData.itemStockDetails
//               }));
//               navigate('/transaction/purchase-inward', {
//                 state: {
//                   updatedSelectedItems: updatedItems,
//                   updatedFromLotDetails: true,
//                   formData: {
//                     ...formData,
//                     // Ensure these are explicitly present in case they're needed
//                     poTypeId: selectedItems[0]?.poTypeId,
//                     vendorId: selectedItems[0]?.vendorId,
//                   },
//                   entryType: entryType,
//                   purchaseInwardDtl: location.state?.purchaseInwardDtl
//                 }
//               });
//             }}
//             className="mr-auto"
//           >
//             <ArrowLeft size={18} className="mr-2" />
//             Back
//           </Button>
//           <h2 className="text-2xl font-semibold">
//             {isYarnType ? 'Lot Details' : isItemType ? 'Lot Details' : 'Piece Entry - Fabric'} ({currentItemIndex + 1} of {itemsWithEntries.length})
//           </h2>
//         </div>
//         <div className="flex gap-2">
//           {itemsWithEntries.length > 1 && (
//             <>
//               <Button
//                 onClick={() => {
//                   setCurrentItemIndex(prev => Math.max(0, prev - 1));
//                   setValidationError('');
//                   setQuantityWarning('');
//                 }}
//                 disabled={currentItemIndex === 0}
//                 className="bg-gray-600 hover:bg-gray-700 text-white px-4"
//               >
//                 Previous Item
//               </Button>
//               <Button
//                 onClick={() => {
//                   setCurrentItemIndex(prev => Math.min(itemsWithEntries.length - 1, prev + 1));
//                   setValidationError('');
//                   setQuantityWarning('');
//                 }}
//                 disabled={currentItemIndex === itemsWithEntries.length - 1}
//                 className="bg-gray-600 hover:bg-gray-700 text-white px-4"
//               >
//                 Next Item
//               </Button>
//             </>
//           )}
//           <Button
//             variant="outline"
//             onClick={handleDownloadTemplate}
//             disabled={!canUseTemplateActions}
//             className="flex items-center"
//           >
//             <FileDown size={16} className="mr-2" />
//             Download Template
//           </Button>
//           <Button
//             variant="outline"
//             onClick={handleUploadButtonClick}
//             disabled={!canUseTemplateActions || isImporting}
//             className="flex items-center"
//           >
//             <Upload size={16} className="mr-2" />
//             {isImporting ? 'Importing...' : 'Upload Excel'}
//           </Button>
//           <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-6 flex items-center">
//             <Save size={18} className="mr-2" /> {isEditMode ? 'Update Purchase Inward' : 'Save Purchase Inward'}
//           </Button>
//         </div>
//       </div>

//       {validationError && (
//         <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
//           {validationError}
//         </div>
//       )}

//       {quantityWarning && (
//         <div className={`mt-4 p-4 border rounded flex items-center ${totalDistributed > inwardQuantity
//           ? 'bg-red-100 border-red-400 text-red-700'
//           : 'bg-yellow-100 border-yellow-400 text-yellow-700'
//           }`}>
//           <AlertCircle size={18} className="mr-2" />
//           {quantityWarning}
//         </div>
//       )}

//       <div className="space-y-6 mt-6">
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <FileText size={20} /> Purchase Order Details
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="grid grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm font-medium">Product Type Name</label>
//               <input value={selectedItem.poTypeName || 'N/A'} disabled className="input mt-1 bg-gray-100" />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Product Name</label>
//               <input value={selectedItem.productName || 'N/A'} disabled className="input mt-1 bg-gray-100" />
//             </div>
//             {/* {isYarnType && (
//               <div>
//                 <label className="block text-sm font-medium">Yarn Type</label>
//                 <input
//                   value={String(selectedItem.yarnTypeId) === "1" ? "Warp" : String(selectedItem.yarnTypeId) === "2" ? "Weft" : "-"}
//                   disabled
//                   className="input mt-1 bg-gray-100"
//                 />
//               </div>
//             )} */}
//             <div>
//               <label className="block text-sm font-medium">Inward Quantity (Required)</label>
//               <input
//                 value={inwardQuantity.toFixed(2)}
//                 disabled
//                 className="input mt-1 bg-blue-100 font-semibold"
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700">
//                 No of {isYarnType || isItemType ? 'Lots' : 'Pieces'}
//               </label>
//               <input
//                 type="number"
//                 min="1"
//                 value={numberOfEntries}
//                 onChange={(e) => updateCurrentItemData({ numberOfEntries: e.target.value })}
//                 className="input mt-1"
//                 placeholder={`Enter number of ${isYarnType || isItemType ? 'lots' : 'pieces'}`}
//               />
//               <div className="flex justify-end">
//                 <button
//                   onClick={handleAddEntriesForm}
//                   className="bg-primary text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
//                 >
//                   {entries.length > 0 ? 'Add More' : `Add ${isYarnType || isItemType ? 'Lots' : 'Pieces'}`}
//                 </button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <ClipboardList size={20} /> {isYarnType ? 'Lot Entry' : isItemType ? 'Stock Entry' : 'Piece Entry'}
//             </CardTitle>
//             <div className="text-sm text-gray-600 mt-2">
//               <div className="grid grid-cols-3 gap-4">
//                 <div>Inward Quantity: <span className="font-semibold">{inwardQuantity.toFixed(2)}</span></div>
//                 <div>Distributed: <span className="font-semibold">{totalDistributed.toFixed(2)}</span></div>
//                 <div>Remaining: <span className={`font-semibold ${remainingQuantity < 0 ? 'text-red-600' : 'text-green-600'
//                   }`}>{remainingQuantity.toFixed(2)}</span></div>
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent>
//             {/* Draft Entries Form */}
//             {entriesDraft.map((entry, index) => {
//               const warehouse = warehouseData.find((w: any) => w.id === Number(entry.warehouseId));

//               if (isYarnType) {
//                 const lotEntry = entry as YarnStockDetail;
//                 return (
//                   <div key={`draft-${index}`} className="relative grid grid-cols-9 gap-4 mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
//                     <div className="absolute top-2 right-2">
//                       <Button
//                         className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full"
//                         onClick={() => handleRemoveDraftEntry(index)}
//                         title="Delete Draft"
//                       >
//                         <Trash2 size={14} />
//                       </Button>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Warehouse *</label>
//                       <CommonSearchableSelect
//                         value={lotEntry.warehouseId || ''}
//                         onValueChange={(value) => updateDraftEntry(index, 'warehouseId', value)}
//                         options={activeWarehouseList.map((warehouse: any) => ({
//                           value: String(warehouse.id),
//                           label: warehouse.warehouseName,
//                           activeFlag: warehouse.activeFlag ?? true,
//                         }))}
//                         filterActive
//                         placeholder="Select Warehouse"
//                         className="mt-1 w-full bg-white"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">No of Bags</label>
//                       <input
//                         type="number"
//                         min="0"
//                         step="1"
//                         value={lotEntry.inwardBags ?? ''}
//                         onChange={(e) => updateDraftEntry(index, 'inwardBags', e.target.value)}
//                         className="input mt-1"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Kgs/Bag</label>
//                       <input
//                         type="number"
//                         min="0"
//                         step="0.001"
//                         value={lotEntry.kgsPerBag ?? ''}
//                         onChange={(e) => updateDraftEntry(index, 'kgsPerBag', e.target.value)}
//                         className="input mt-1"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Cones per Bag</label>
//                       <input
//                         type="number"
//                         min="0"
//                         step="1"
//                         value={lotEntry.conesPerBag ?? ''}
//                         onChange={(e) => updateDraftEntry(index, 'conesPerBag', e.target.value)}
//                         className="input mt-1"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Cones Weight (Auto)</label>
//                       <input
//                         type="number"
//                         readOnly
//                         value={lotEntry.conesWeight ?? ''}
//                         className="input mt-1 bg-gray-100"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Accepted Qty *</label>
//                       <input
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         value={lotEntry.acceptedQty || ''}
//                         onChange={(e) => updateDraftEntry(index, 'acceptedQty', e.target.value)}
//                         className="input mt-1"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Rejected Qty</label>
//                       <input
//                         type="number"
//                         min="0"
//                         value={lotEntry.rejectedQty || ''}
//                         onChange={(e) => updateDraftEntry(index, 'rejectedQty', e.target.value)}
//                         className="input mt-1"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Lot No</label>
//                       <input
//                         value={lotEntry.lotNo || ''}
//                         onChange={(e) => updateDraftEntry(index, 'lotNo', e.target.value)}
//                         className="input mt-1"
//                         placeholder="Auto-generated if empty"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Yarn Type</label>
//                       <input
//                         value={String(lotEntry.yarnTypeId) === "1" ? "Warp" : String(lotEntry.yarnTypeId) === "2" ? "Weft" : "-"}
//                         readOnly
//                         className="input mt-1 bg-gray-100"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Remark</label>
//                       <input
//                         value={lotEntry.remark || ''}
//                         onChange={(e) => updateDraftEntry(index, 'remark', e.target.value)}
//                         className="input mt-1"
//                       />
//                     </div>
//                   </div>
//                 );
//               } else if (isItemType) {
//                 const itemEntry = entry as ItemStockDetail;
//                 return (
//                   <div key={`draft-${index}`} className="relative grid grid-cols-9 gap-4 mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
//                     <div className="absolute top-2 right-2">
//                       <Button
//                         className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full"
//                         onClick={() => handleRemoveDraftEntry(index)}
//                         title="Delete Draft"
//                       >
//                         <Trash2 size={14} />
//                       </Button>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Warehouse *</label>
//                       <CommonSearchableSelect
//                         value={itemEntry.warehouseId || ''}
//                         onValueChange={(value) => updateDraftEntry(index, 'warehouseId', value)}
//                         options={activeWarehouseList.map((warehouse: any) => ({
//                           value: String(warehouse.id),
//                           label: warehouse.warehouseName,
//                           activeFlag: warehouse.activeFlag ?? true,
//                         }))}
//                         filterActive
//                         placeholder="Select Warehouse bg-white"
//                         className="mt-1 w-full bg-white"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">No of Bags</label>
//                       <input
//                         type="number"
//                         min="0"
//                         step="1"
//                         value={itemEntry.inwardBags ?? ''}
//                         onChange={(e) => updateDraftEntry(index, 'inwardBags', e.target.value)}
//                         className="input mt-1"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Kgs/Bag</label>
//                       <input
//                         type="number"
//                         min="0"
//                         step="0.001"
//                         value={itemEntry.kgsPerBag ?? ''}
//                         onChange={(e) => updateDraftEntry(index, 'kgsPerBag', e.target.value)}
//                         className="input mt-1"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Accepted Qty *</label>
//                       <input
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         value={itemEntry.acceptedQty || ''}
//                         onChange={(e) => updateDraftEntry(index, 'acceptedQty', e.target.value)}
//                         className="input mt-1"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Rejected Qty</label>
//                       <input
//                         type="number"
//                         min="0"
//                         value={itemEntry.rejectedQty || ''}
//                         onChange={(e) => updateDraftEntry(index, 'rejectedQty', e.target.value)}
//                         className="input mt-1"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Lot No</label>
//                       <input
//                         value={itemEntry.lotNo || ''}
//                         onChange={(e) => updateDraftEntry(index, 'lotNo', e.target.value)}
//                         className="input mt-1"
//                         placeholder="Auto-generated if empty"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Remark</label>
//                       <input
//                         value={itemEntry.remark || ''}
//                         onChange={(e) => updateDraftEntry(index, 'remark', e.target.value)}
//                         className="input mt-1"
//                       />
//                     </div>
//                   </div>
//                 );
//               } else {
//                 const pieceEntry = entry as PieceEntry;
//                 const currentFabricId = poTypeId === PO_TYPE_WOVEN_FABRIC ? pieceEntry.fabricMasterId : pieceEntry.fabricId;
//                 return (
//                   <div key={`draft-${index}`} className="relative grid grid-cols-4 gap-4 mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
//                     <div className="absolute top-2 right-2">
//                       <Button
//                         className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full"
//                         onClick={() => handleRemoveDraftEntry(index)}
//                         title="Delete Draft"
//                       >
//                         <Trash2 size={14} />
//                       </Button>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium">Fabric Code * (Mandatory)</label>
//                       <CommonSearchableSelect
//                         value={currentFabricId || ''}
//                         onValueChange={(value) => {
//                           const id = Number(value);
//                           const currentItemData = itemsWithEntries[currentItemIndex];
//                           const updatedDrafts = [...currentItemData.entriesDraft];

//                           if (id && fabricMastersArray.length > 0) {
//                             const fabricDetails = populateFabricDetailsFromMaster(id);
//                             const updatedDraft = {
//                               ...updatedDrafts[index],
//                               ...fabricDetails
//                             } as Partial<PieceEntry>;

//                             updatedDrafts[index] = updatedDraft;
//                             updateCurrentItemData({ entriesDraft: updatedDrafts });
//                             validateQuantityTotals(currentItemData.pieceEntries, updatedDrafts);
//                           } else if (!id) {
//                             const updatedDraft = {
//                               ...updatedDrafts[index],
//                               fabricCode: '',
//                               fabricDetails: '',
//                               fabricQuality: '',
//                               gstPercent: 0,
//                               gsm: undefined,
//                               ppi: undefined,
//                               fabricId: 0,
//                               fabricMasterId: 0
//                             } as Partial<PieceEntry>;
//                             updatedDrafts[index] = updatedDraft;
//                             updateCurrentItemData({ entriesDraft: updatedDrafts });
//                           }
//                         }}
//                         options={fabricMastersArray.map((fabric: any) => ({
//                           value: String(fabric.id),
//                           label: fabric.fabricCode,
//                           activeFlag: fabric.activeFlag ?? true,
//                         }))}
//                         filterActive
//                         placeholder="Select Fabric Code"
//                         className="mt-1 w-full bg-white"
//                         required
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium">Fabric Details * (Auto-filled)</label>
//                       <input
//                         value={pieceEntry.fabricDetails || ''}
//                         readOnly
//                         className="input mt-1 bg-gray-100 cursor-not-allowed font-medium text-gray-700"
//                         placeholder="Select Fabric Code first"
//                         required
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium">Piece No * (Auto-generated if empty)</label>
//                       <input
//                         value={pieceEntry.pieceNumber || ''}
//                         onChange={(e) => updateDraftEntry(index, 'pieceNumber', e.target.value)}
//                         className="input mt-1"
//                         placeholder="e.g., GFP-00001"
//                         required
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium">Warehouse *</label>
//                       <CommonSearchableSelect
//                         value={pieceEntry.warehouseId || ''}
//                         onValueChange={(value) => updateDraftEntry(index, 'warehouseId', value)}
//                         options={activeWarehouseList.map((warehouse: any) => ({
//                           value: String(warehouse.id),
//                           label: warehouse.warehouseName,
//                           activeFlag: warehouse.activeFlag ?? true,
//                         }))}
//                         filterActive
//                         placeholder="Select Warehouse"
//                         className="mt-1 w-full bg-white"
//                         required
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium">Piece Meter * (Max 2 decimals)</label>
//                       <input
//                         type="number"
//                         min="0"
//                         max={remainingQuantity + (Number(pieceEntry.pieceMeter) || 0)}
//                         step="0.01"
//                         value={pieceEntry.pieceMeter || ''}
//                         onChange={(e) => updateDraftEntry(index, 'pieceMeter', e.target.value)}
//                         className="input mt-1"
//                         required
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium">Net Weight * (Max 3 decimals)</label>
//                       <input
//                         type="number"
//                         min="0"
//                         step="0.001"
//                         value={pieceEntry.netWeight || ''}
//                         onChange={(e) => updateDraftEntry(index, 'netWeight', e.target.value)}
//                         className="input mt-1"
//                         required
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium">Avg Weight (Auto-calculated)</label>
//                       <input
//                         type="number"
//                         value={pieceEntry.avgWeight?.toFixed(3) || '0.000'}
//                         disabled
//                         className="input mt-1 bg-gray-100 font-semibold"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium">remark</label>
//                       <input
//                         value={pieceEntry.remarks || ''}
//                         onChange={(e) => updateDraftEntry(index, 'remarks', e.target.value)}
//                         className="input mt-1"
//                       />
//                     </div>
//                   </div>
//                 );
//               }
//             })}

//             {entriesDraft.length > 0 && (
//               <div className="flex flex-col gap-3 mb-4">
//                 <div className="flex justify-between items-center">
//                   <div className="text-sm text-gray-600">
//                     Adding {entriesDraft.length} {isYarnType || isItemType ? 'lot' : 'piece'}{entriesDraft.length > 1 ? 's' : ''} (draft)
//                   </div>
                  
//                 </div>
//                 <div className="flex justify-end gap-3">
//                   <div className="flex">
//                     <Button
//                       variant="outline"
//                       onClick={handleCancelDrafts}
//                       className="flex items-center text-gray-700"
//                     >
//                       <X size={16} className="mr-2" /> Clear all
//                     </Button>
//                   </div>
//                   <Button onClick={handleAddEntries} className="bg-green-600 hover:bg-green-700 text-white px-6 flex items-center">
//                     <Plus size={18} className="mr-2" /> {editingIndex !== null ? `Update ${isYarnType || isItemType ? 'Lot' : 'Piece'}` : `Add ${isYarnType || isItemType ? 'Lots' : 'Pieces'}`}
//                   </Button>
//                 </div>
//               </div>
//             )}

//             {/* Display Added Entries */}
//             {entries.length > 0 && entriesDraft.length === 0 && (
//               <div className="flex justify-end mb-4">
//                 <Button
//                   onClick={() => {
//                     updateCurrentItemData({ numberOfEntries: '1' });
//                     setTimeout(() => handleAddEntriesForm(), 0);
//                   }}
//                   className="bg-primary hover:bg-blue-600 text-white px-6 flex items-center"
//                 >
//                   <Plus size={18} className="mr-2" /> Add More {isYarnType || isItemType ? 'Lots' : 'Pieces'}
//                 </Button>
//               </div>
//             )}
//             {entries.length > 0 && (
//               <>
//                 <h3 className="text-lg font-semibold mb-4">Added {isYarnType || isItemType ? 'Lots' : 'Pieces'}</h3>
//                 <div className="overflow-x-auto">
//                   <table className="w-full border-collapse border border-gray-300">
//                     <thead className="bg-gray-100">
//                       <tr>
//                         <th className="border p-2">Sl.No</th>
//                         {isYarnType ? (
//                           <>
//                             <th className="border p-2">Warehouse</th>
//                             <th className="border p-2">Lot No</th>
//                             <th className="border p-2">Yarn Type</th>
//                               <th className="border p-2">No of Bags</th>
//                                 <th className="border p-2">Kgs/Bag</th>
//                             <th className="border p-2">Cones/Bag</th>
//                             <th className="border p-2">Cones Weight</th>
//                             <th className="border p-2">Accepted Qty</th>
//                             <th className="border p-2">Rejected Qty</th>
//                             <th className="border p-2">Total Qty</th>
//                             <th className="border p-2">remark</th>
//                           </>
//                         ) : isItemType ? (
//                           <>
//                             <th className="border p-2">Warehouse</th>
//                             <th className="border p-2">Lot No</th>
//                             <th className="border p-2">No of Bags</th>
//                             <th className="border p-2">Kgs/Bag</th>
//                             <th className="border p-2">Accepted Qty</th>
//                             <th className="border p-2">Rejected Qty</th>
//                             <th className="border p-2">Total Qty</th>
//                             <th className="border p-2">Remark</th>
//                           </>
//                         ) : (
//                           <>
//                             <th className="border p-2">Fabric Code</th>
//                             <th className="border p-2">Fabric Details</th>
//                             <th className="border p-2">Piece No</th>
//                             <th className="border p-2">Piece Meter</th>
//                             <th className="border p-2">Net Weight</th>
//                             <th className="border p-2">Avg Weight</th>
//                             <th className="border p-2">Warehouse</th>
//                             <th className="border p-2">remark</th>
//                           </>
//                         )}
//                         <th className="border p-2">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {entries.map((entry, index) => {
//                         const warehouse = warehouseData.find((w: any) => w.id === Number(entry.warehouseId));

//                         if (isYarnType) {
//                           const lotEntry = entry as YarnStockDetail;
//                           const totalQty = (lotEntry.acceptedQty || 0) + (lotEntry.rejectedQty || 0);

//                           return (
//                             <tr key={`lot-${lotEntry.id}-${index}`}>
//                               <td className="border p-2 text-center">{index + 1}</td>
//                               <td className="border p-2">
//                                 {warehouse ? (
//                                   <span className="font-medium">{warehouse.warehouseName}</span>
//                                 ) : (
//                                   <div>
//                                     <span className="text-red-500">N/A</span>
//                                     <div className="text-red-500 text-xs">(ID: {lotEntry.warehouseId || 'empty'})</div>
//                                   </div>
//                                 )}
//                               </td>
//                               <td className="border p-2">{lotEntry.lotNo || '-'}</td>
//                               <td className="border p-2">{String(lotEntry.yarnTypeId) === "1" ? "Warp" : String(lotEntry.yarnTypeId) === "2" ? "Weft" : "-"}</td>
//                                <td className="border p-2">{lotEntry.inwardBags || '-'}</td>
//                               <td className="border p-2">{lotEntry.kgsPerBag || '-'}</td>
// <td className="border p-2 text-center">{lotEntry.conesPerBag ?? '-'}</td>
//                               <td className="border p-2 text-center">{lotEntry.conesWeight != null ? lotEntry.conesWeight.toFixed(3) : '-'}</td>
//                               <td className="border p-2 text-center font-semibold text-green-600">{lotEntry.acceptedQty.toFixed(2)}</td>
//                               <td className="border p-2 text-center font-semibold text-red-600">{lotEntry.rejectedQty.toFixed(2)}</td>
//                               <td className="border p-2 text-center font-semibold bg-blue-50">{totalQty.toFixed(2)}</td>

//                               <td className="border p-2">{lotEntry.remark}</td>
//                               <td className="border p-2">
//                                 <div className="flex justify-center gap-2">
//                                   <Button
//                                     onClick={() => handleEditEntry(lotEntry)}
//                                     className="p-1 h-8 w-8 text-blue-600 border-blue-100 hover:bg-blue-50"
//                                     variant="outline"
//                                     title="View"
//                                   >
//                                     <Eye size={16} />
//                                   </Button>
//                                   {Number(lotEntry.isInspected) === 1 ? (
//                                     <span className="px-2 py-1 rounded-full text-[10px] bg-yellow-100 text-yellow-800 font-bold uppercase tracking-wider border border-yellow-200 shadow-sm">
//                                       Inspected
//                                     </span>
//                                   ) : (
//                                     <>
//                                       <Button
//                                         onClick={() => handleEditEntry(lotEntry)}
//                                         className="p-1 h-8 w-8"
//                                         variant="outline"
//                                         title="Edit"
//                                       >
//                                         <Edit size={16} />
//                                       </Button>
//                                       <Button
//                                         onClick={() => handleDeleteEntry(lotEntry.id)}
//                                         className="p-1 h-8 w-8 bg-red-600 hover:bg-red-700"
//                                         title="Delete"
//                                       >
//                                         <Trash2 size={16} />
//                                       </Button>
//                                     </>
//                                   )}
//                                 </div>
//                               </td>
//                             </tr>
//                           );
//                         } else if (isItemType) {
//                           const itemEntry = entry as ItemStockDetail;
//                           const totalQty = (itemEntry.acceptedQty || 0) + (itemEntry.rejectedQty || 0);

//                           return (
//                             <tr key={`item-${itemEntry.id}-${index}`}>
//                               <td className="border p-2 text-center">{index + 1}</td>
//                               <td className="border p-2">
//                                 {warehouse ? (
//                                   <span className="font-medium">{warehouse.warehouseName}</span>
//                                 ) : (
//                                   <div>
//                                     <span className="text-red-500">N/A</span>
//                                     <div className="text-red-500 text-xs">(ID: {itemEntry.warehouseId || 'empty'})</div>
//                                   </div>
//                                 )}
//                               </td>
//                               <td className="border p-2">{itemEntry.lotNo || '-'}</td>
//                               <td className="border p-2">{itemEntry.inwardBags || '-'}</td>
//                               <td className="border p-2">{itemEntry.kgsPerBag || '-'}</td>
//                               <td className="border p-2 text-center font-semibold text-green-600">{itemEntry.acceptedQty.toFixed(2)}</td>
//                               <td className="border p-2 text-center font-semibold text-red-600">{itemEntry.rejectedQty.toFixed(2)}</td>
//                               <td className="border p-2 text-center font-semibold bg-blue-50">{totalQty.toFixed(2)}</td>
//                               <td className="border p-2">{itemEntry.remark}</td>
//                               <td className="border p-2">
//                                 <div className="flex justify-center gap-2">
//                                   <Button
//                                     onClick={() => handleEditEntry(itemEntry)}
//                                     className="p-1 h-8 w-8 text-blue-600 border-blue-100 hover:bg-blue-50"
//                                     variant="outline"
//                                     title="View"
//                                   >
//                                     <Eye size={16} />
//                                   </Button>
//                                   {Number(itemEntry.isInspected) === 1 ? (
//                                     <span className="px-2 py-1 rounded-full text-[10px] bg-yellow-100 text-yellow-800 font-bold uppercase tracking-wider border border-yellow-200 shadow-sm">
//                                       Inspected
//                                     </span>
//                                   ) : (
//                                     <>
//                                       <Button
//                                         onClick={() => handleEditEntry(itemEntry)}
//                                         className="p-1 h-8 w-8"
//                                         variant="outline"
//                                         title="Edit"
//                                       >
//                                         <Edit size={16} />
//                                       </Button>
//                                       <Button
//                                         onClick={() => handleDeleteEntry(itemEntry.id)}
//                                         className="p-1 h-8 w-8 bg-red-600 hover:bg-red-700"
//                                         title="Delete"
//                                       >
//                                         <Trash2 size={16} />
//                                       </Button>
//                                     </>
//                                   )}
//                                 </div>
//                               </td>
//                             </tr>
//                           );
//                         } else {
//                           const pieceEntry = entry as PieceEntry;
//                           return (
//                             <tr key={`piece-${pieceEntry.id}-${index}`}>
//                               <td className="border p-2 text-center">{index + 1}</td>
//                               <td className="border p-2 font-medium">{pieceEntry.fabricCode || '-'}</td>
//                               <td className="border p-2">{pieceEntry.fabricDetails || '-'}</td>
//                               <td className="border p-2 text-center font-semibold text-blue-600">{pieceEntry.pieceNumber || '-'}</td>
//                               <td className="border p-2 text-center font-semibold">{pieceEntry.pieceMeter.toFixed(2)}</td>
//                               <td className="border p-2 text-center">{pieceEntry.netWeight.toFixed(3)}</td>
//                               <td className="border p-2 text-center bg-blue-50 font-semibold">{(pieceEntry.avgWeight || 0).toFixed(3)}</td>
//                               <td className="border p-2">
//                                 {warehouse ? (
//                                   <span className="font-medium">{warehouse.warehouseName}</span>
//                                 ) : (
//                                   <div>
//                                     <span className="text-red-500">N/A</span>
//                                     <div className="text-red-500 text-xs">(ID: {pieceEntry.warehouseId || 'empty'})</div>
//                                   </div>
//                                 )}
//                               </td>
//                               <td className="border p-2">{pieceEntry.remarks}</td>
//                               <td className="border p-2">
//                                 <div className="flex justify-center gap-2">
//                                   <Button
//                                     onClick={() => handleEditEntry(pieceEntry)}
//                                     className="p-1 h-8 w-8 text-blue-600 border-blue-100 hover:bg-blue-50"
//                                     variant="outline"
//                                     title="View"
//                                   >
//                                     <Eye size={16} />
//                                   </Button>
//                                   {Number(pieceEntry.isInspected) === 1 ? (
//                                     <span className="px-2 py-1 rounded-full text-[10px] bg-yellow-100 text-yellow-800 font-bold uppercase tracking-wider border border-yellow-200 shadow-sm">
//                                       Inspected
//                                     </span>
//                                   ) : (
//                                     <>
//                                       <Button
//                                         onClick={() => handleEditEntry(pieceEntry)}
//                                         className="p-1 h-8 w-8"
//                                         variant="outline"
//                                         title="Edit"
//                                       >
//                                         <Edit size={16} />
//                                       </Button>
//                                       <Button
//                                         onClick={() => handleDeleteEntry(pieceEntry.id)}
//                                         className="p-1 h-8 w-8 bg-red-600 hover:bg-red-700"
//                                         title="Delete"
//                                       >
//                                         <Trash2 size={16} />
//                                       </Button>
//                                     </>
//                                   )}
//                                 </div>
//                               </td>
//                             </tr>
//                           );
//                         }
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               </>
//             )}
//           </CardContent>
//         </Card>

//         {/* All Items Summary - Only show if multiple items */}
//         {itemsWithEntries.length > 1 && (
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <ClipboardList size={20} /> All Items Summary
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <table className="w-full border-collapse border border-gray-300">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="border p-2">Item #</th>
//                     <th className="border p-2">Product Name</th>
//                     <th className="border p-2">Inward Qty</th>
//                     <th className="border p-2">No of {isYarnType || isItemType ? 'Lots' : 'Pieces'}</th>
//                     <th className="border p-2">Total {isYarnType ? 'Lot' : 'Piece'} Qty</th>
//                     <th className="border p-2">Status</th>
//                     <th className="border p-2">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {itemsWithEntries.map((itemData, index) => {
//                     const itemEntries = isYarnType ? itemData.yarnStockDetails : isItemType ? itemData.itemStockDetails : itemData.pieceEntries;
//                     const itemTotalQty = calculateTotalQuantity(itemEntries);
//                     const itemReceivedQty = Number(itemData.item.quantityReceived) || 0;
//                     const isComplete = itemTotalQty === itemReceivedQty;
//                     const isOverflow = itemTotalQty > itemReceivedQty;

//                     return (
//                       <tr key={index} className={index === currentItemIndex ? 'bg-blue-50' : ''}>
//                         <td className="border p-2 text-center">{index + 1}</td>
//                         <td className="border p-2">{itemData.item.productName}</td>
//                         <td className="border p-2 text-center">{itemReceivedQty.toFixed(2)}</td>
//                         <td className="border p-2 text-center">{itemEntries.length}</td>
//                         <td className="border p-2 text-center font-semibold">{itemTotalQty.toFixed(2)}</td>
//                         <td className="border p-2 text-center">
//                           {isComplete ? (
//                             <span className="text-green-600 font-semibold">✓ Complete</span>
//                           ) : isOverflow ? (
//                             <span className="text-red-600 font-semibold">⚠ Overflow</span>
//                           ) : (
//                             <span className="text-orange-600 font-semibold">⋯ Pending</span>
//                           )}
//                         </td>
//                         <td className="border p-2 text-center">
//                           <Button
//                             onClick={() => {
//                               setCurrentItemIndex(index);
//                               setValidationError('');
//                             }}
//                             className="bg-primary hover:bg-blue-600 text-white px-3 py-1 text-sm"
//                             disabled={index === currentItemIndex}
//                           >
//                             {index === currentItemIndex ? 'Current' : 'Go to Item'}
//                           </Button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// };

// export default LotDetails;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ClipboardList, Edit, Trash2, Save, Plus, AlertCircle, ArrowLeft, X, FileDown, Upload, Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { createPurchaseInward, updatePurchaseInward } from "@/state/purchaseInwardSlice";
import { getAllPoTypes } from '@/state/purchaseOrderSlice';
import { getAllWarehouse } from '@/state/warehouseSlice';
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllKnittedFabricMasters } from "@/state/knittedMasterSlice";
import { getSubCategoryByCategory } from '@/state/subCategorySlice';
import { getAllUomMaster } from '@/state/uomMasterSlice';
import documentNumberService from '@/services/DocumentNumberService';
import { useAutoDocumentNumber } from '@/components/common/useAutoDocumentNumber';
import { toast } from 'react-toastify';
import { generateExcelTemplate, readExcelFile } from '@/lib/utils';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';

// PO TYPE CONSTANTS
const PO_TYPE_YARN = 1;
const PO_TYPE_WOVEN_FABRIC = 2;
const PO_TYPE_KNITTED_FABRIC = 11;
const PO_TYPE_ITEM = 3;

const FABRIC_TEMPLATE_HEADERS = [
  'Warehouse Name',
  'Sort No',
  'Piece No',
  'Piece Meter',
  'Net Weight',
  'Remarks'
];

const YARN_TEMPLATE_HEADERS = [
  'Warehouse Name',
  'Lot No',
  'No Of Carton/Pallet',
  'Kgs/Bag',
  'Accepted Qty',
  'Rejected Qty',
  'Cones Per Bag',
  'Remark'
];

const ITEM_TEMPLATE_HEADERS = [
  'Warehouse Name',
  'Lot No',
  'No Of Carton/Pallet',
  'Qty/Unit',
  'Accepted Qty',
  'Rejected Qty',
  'Remark'
];

const EXCEL_ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

interface YarnStockDetail {
  id: number | string;
  inwardId?: number;  // ADD THIS - for tracking which PurchaseInward this belongs to
  lotNo?: string;
  inwardQty: number;
  acceptedQty: number;
  rejectedQty: number;
  inwardBags?: number;
  kgsPerBag?: number;
  conesPerBag?: number;
  conesWeight?: number;
  remark: string;
  warehouseId: string;
  itemId?: number | null;
  uomId?: number | null;
  yarnId?: number | null;
  fabricId?: number | null;
  orderItemId?: number | null;
  isInspected?: number | boolean;
  yarnTypeId?: string | number | null;
  millId?: string | number | null;
}


// interface YarnStockDetail {
//   id: number | string;
//   lotNo?: string;
//   inwardQty: number;
//   acceptedQty: number;
//   rejectedQty: number;
//   inwardBags: number;  // This is noOfBags
//   kgsPerBag: number;
//   conesPerBag?: number;
//   conesWeight?: number;
//   remark: string;
//   warehouseId: string;
//   itemId?: number | null;
//   uomId?: number | null;
//   yarnId?: number | null;
//   fabricId?: number | null;
//   orderItemId?: number | null;
//   isInspected?: number | boolean;
// }

interface ItemStockDetail {
  id: number | string;
  lotNo?: string;
  rackNo?: string;
  inwardQty: number;
  acceptedQty: number;
  rejectedQty: number;
  inwardBags?: number;
  kgsPerBag?: number | string;
  conesPerBag?: number;
  conesWeight?: number;
  remark: string;
  warehouseId: string;
  itemId?: number | null;
  uomId?: number | null;
  itemInwardItemId?: number | null;
  isInspected?: number | boolean;
  millId?: string | number | null;
}

interface PieceEntry {
  id: number | string;
  pieceNumber?: string;
  fabricCode?: string;
  fabricDetails?: string;
  fabricQuality?: string;
  gstPercent?: number;
  gsm?: number;
  ppi?: number;
  pieceMeter: number;
  netWeight: number;
  avgWeight?: number;
  grossWt?: number;
  remarks: string;
  warehouseId: string;
  fabricId?: number;
  fabricMasterId?: number;
  isInspected?: number | boolean;
}

interface ItemWithEntries {
  item: any;
  yarnStockDetails: YarnStockDetail[];
  pieceEntries: PieceEntry[];
  itemStockDetails: ItemStockDetail[];
  entriesDraft: Partial<YarnStockDetail | PieceEntry | ItemStockDetail>[];
  numberOfEntries: string;
  editingIndex: number | string | null;
}

export interface LotDetailsProps {
  embedded?: boolean;
  selectedItems?: any[];
  entryType?: string;
  isEditMode?: boolean;
  formData?: any;
  fromOrderEntry?: boolean;
  expandedRowId?: any;
  activeTab?: any;
}

export const LotDetails: React.FC<LotDetailsProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const selectedItems: any = props?.embedded ? (props.selectedItems || []) : (location.state?.selectedItems || []);
  const entryType = props?.embedded ? (props.entryType || 'lot') : (location.state?.entryType || 'lot'); // 'lot' or 'piece'
  const isEditMode = props?.embedded ? (props.isEditMode ?? false) : (location.state?.isEditMode || false);
  const formData = props?.embedded ? (props.formData || {}) : (location.state?.formData || {});
  const fromOrderEntry = props?.embedded ? (props.fromOrderEntry ?? false) : (location.state?.fromOrderEntry || false);
  const expandedRowId = props?.embedded ? props.expandedRowId : (location.state?.expandedRowId || null);
  const activeTab = props?.embedded ? props.activeTab : (location.state?.activeTab || null);

  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [itemsWithEntries, setItemsWithEntries] = useState<ItemWithEntries[]>([]);
  const itemsWithEntriesRef = useRef<ItemWithEntries[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const [quantityWarning, setQuantityWarning] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const pieceNumberCounterRef = useRef<number>(1);
  const previousSelectedItemsRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftFormRef = useRef<HTMLDivElement | null>(null);
  const [purchaseInwardNumber, setPurchaseInwardNumber] = useState<string>(formData.purchaseInwardNo || '');
  const isSavingRef = useRef(false);

  useAutoDocumentNumber({
    screenName: 'Purchase Inward',
    detail: isEditMode ? { id: formData.id } : undefined,
    existingValue: purchaseInwardNumber,
    onValueChange: setPurchaseInwardNumber,
    isSavingRef,
  });

  useEffect(() => {
    if (isEditMode && formData.purchaseInwardNo) {
      setPurchaseInwardNumber(formData.purchaseInwardNo);
    }
  }, [isEditMode, formData.purchaseInwardNo]);

  useEffect(() => {
    itemsWithEntriesRef.current = itemsWithEntries;
  }, [itemsWithEntries]);

  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { knittedknittedFabricMasterList } = useSelector((state: RootState) => state.knittedMasters);
  const { subCategoryByCategoryList = [] } = useSelector((state: RootState) => state.subCategory as any);
  const { uomList = [] } = useSelector((state: RootState) => (state as any).uom || {});
//addeed
  const { loading, error } = useSelector((state: RootState) => state.purchaseInward);

  const activeWarehouseList = useMemo(() => {
    let list = [];
    if (Array.isArray(warehouseList)) list = warehouseList;
    else if (Array.isArray(warehouseList?.data)) list = warehouseList.data;
    return list.filter((x: any) => x.isActive !== false && x.activeFlag !== false);
  }, [warehouseList]);

  const activeUomList = useMemo(() => {
    let list = [];
    if (Array.isArray(uomList)) list = uomList;
    else if (Array.isArray(uomList?.data)) list = uomList.data;
    return list.filter((x: any) => x.isActive !== false && x.activeFlag !== false && x.status !== 'Inactive');
  }, [uomList]);

  const activeFabricMasterList = useMemo(() => {
    let list = [];
    if (Array.isArray(fabricMasterList)) list = fabricMasterList;
    else if (Array.isArray(fabricMasterList?.data)) list = fabricMasterList.data;
    return list.filter((x: any) => x.isActive !== false && x.activeFlag !== false);
  }, [fabricMasterList]);

  const activeKnittedFabricMasterList = useMemo(() => {
    let list = [];
    if (Array.isArray(knittedknittedFabricMasterList)) list = knittedknittedFabricMasterList;
    else if (Array.isArray(knittedknittedFabricMasterList?.data)) list = knittedknittedFabricMasterList.data;
    return list.filter((x: any) => x.isActive !== false && x.activeFlag !== false);
  }, [knittedknittedFabricMasterList]);

  // Get warehouse data array
  const warehouseData = useMemo(() => {
    let data: any[] = [];
    if (Array.isArray(warehouseList)) {
      data = warehouseList;
    } else {
      data = warehouseList?.data || [];
    }
    return data;
  }, [warehouseList]);

  const warehouseNameLookup = useMemo(() => {
    const map = new Map<string, any>();
    warehouseData.forEach((warehouse: any) => {
      const key = (warehouse?.warehouseName || warehouse?.name || '')
        .toString()
        .trim()
        .toLowerCase();
      if (key) {
        map.set(key, warehouse);
      }
    });
    return map;
  }, [warehouseData]);

  const isYarnType = entryType === 'lot';
  const isFabricType = entryType === 'piece';
  const isItemType = entryType === 'item';

  const filteredWarehouseList = useMemo(() => {
    const warehouseTypeMap: Record<string, string> = {
      lot: 'Yarn',
      piece: 'Fabric',
      item: 'Item',
    };
    const expectedType = warehouseTypeMap[entryType];
    const storedId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = storedId ? Number(storedId) : null;
    return activeWarehouseList.filter((w: any) => {
      if (expectedType && w.warehouseType !== expectedType && w.warehouseType !== 'All') return false;
      if (companyId && w.ownerType === 'Company' && Number(w.ownerId) !== companyId) return false;
      return true;
    });
  }, [activeWarehouseList, entryType]);

  const defaultWarehouseId = useMemo(() => {
    const storedId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = storedId ? Number(storedId) : null;

    const warehouseTypeMap: Record<string, string> = {
      lot: 'Yarn',
      piece: 'Fabric',
      item: 'Item',
    };
    const expectedType = warehouseTypeMap[entryType] || '';

    const typeMatched = activeWarehouseList.filter(
      (w: any) => w.warehouseType === expectedType || w.warehouseType === 'All'
    );

    const companyMatches = companyId
      ? typeMatched.filter(
          (w: any) => w.ownerType === 'Company' && Number(w.ownerId) === companyId
        )
      : [];

    if (companyMatches.length > 0) {
      const defaultCompanyMatch = companyMatches.find((w: any) => w.isDefault === true);
      return String((defaultCompanyMatch || companyMatches[0]).id);
    }

    const vendorMatches = typeMatched.filter((w: any) => w.ownerType === 'Vendor');
    if (vendorMatches.length > 0) {
      const defaultVendorMatch = vendorMatches.find((w: any) => w.isDefault === true);
      return String((defaultVendorMatch || vendorMatches[0]).id);
    }

    return '';
  }, [activeWarehouseList, entryType]);

  const fabricMastersArray = useMemo(() => {
    if (!isFabricType || !selectedItems || selectedItems.length === 0) {
      return [];
    }

    const poTypeId = selectedItems[0]?.poTypeId;
    const poTypeName = selectedItems[0]?.poTypeName || '';

    let masters;
    if (poTypeName.toLowerCase().includes('woven')) {
      masters = activeFabricMasterList;
    } else if (poTypeName.toLowerCase().includes('knit')) {
      masters = activeKnittedFabricMasterList;
    } else {
      masters = poTypeId === PO_TYPE_WOVEN_FABRIC ? activeFabricMasterList : activeKnittedFabricMasterList;
    }

    if (!masters) return [];

    const data = (masters?.data ?? masters) || [];
    return data;
  }, [activeFabricMasterList, activeKnittedFabricMasterList, isFabricType, selectedItems]);

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

  const poFabricOptions = useMemo(() => {
    if (!isFabricType || !selectedItems || selectedItems.length === 0) return [];
    const poTypeId = selectedItems[0]?.poTypeId;
    const fabricIds = new Set<number>();
    selectedItems.forEach((item: any) => {
      const id = poTypeId === PO_TYPE_WOVEN_FABRIC
        ? Number(item.fabricMasterId)
        : Number(item.fabricId);
      if (id) fabricIds.add(id);
    });
    return fabricMastersArray
      .filter((fabric: any) => fabricIds.has(Number(fabric.id)))
      .map((fabric: any) => ({
        value: String(fabric.id),
        label: fabric.fabricCode,
        activeFlag: fabric.activeFlag ?? true,
      }));
  }, [isFabricType, selectedItems, fabricMastersArray]);

  // // Generate piece number with company code
  // const generatePieceNumber = () => {
  //   const companyCode = localStorage.getItem('companyCode') || 'XX';
  //   const number = pieceNumberCounterRef.current.toString().padStart(5, '0');
  //   pieceNumberCounterRef.current += 1;
  //   return `${companyCode}-GFP-${number}`;
  // };

  // Calculate average weight for pieces
  const calculateAvgWeight = (netWeight: number, pieceMeter: number): number => {
    if (pieceMeter === 0) return 0;
    return netWeight / pieceMeter;
  };

  const parseQtyAndUnit = (kgsPerBagStr: string | number | undefined | null) => {
    if (kgsPerBagStr === undefined || kgsPerBagStr === null) {
      return { numericVal: '', unitVal: '' };
    }
    const str = String(kgsPerBagStr).trim();
    if (!str) return { numericVal: '', unitVal: '' };

    const match = str.match(/^([0-9.]+)\s*(.*)$/);
    if (match) {
      return { numericVal: match[1], unitVal: match[2].trim() };
    }
    return { numericVal: str, unitVal: '' };
  };

  const formatQtyAndUnit = (numericVal: string | number, unitVal: string) => {
    const numStr = numericVal !== undefined && numericVal !== null ? String(numericVal).trim() : '';
    const unitStr = unitVal ? String(unitVal).trim() : '';
    if (!numStr) return '';
    return unitStr ? `${numStr} ${unitStr}` : numStr;
  };

  const renderQtyWithUomCode = (kgsPerBag: number | string | undefined | null, uomId?: number | string | undefined | null) => {
    if (kgsPerBag === undefined || kgsPerBag === null || kgsPerBag === '') return '-';
    const { numericVal, unitVal } = parseQtyAndUnit(kgsPerBag);
    const displayNum = numericVal || String(kgsPerBag);

    let codeToUse = '';
    if (uomId) {
      const matchedUom = activeUomList.find((u: any) => Number(u.id) === Number(uomId));
      if (matchedUom) {
        codeToUse = matchedUom.uomCode || matchedUom.uomName || '';
      }
    }
    if (!codeToUse && unitVal) {
      const matchedUom = activeUomList.find(
        (u: any) =>
          (u.uomCode && u.uomCode.toLowerCase() === unitVal.toLowerCase()) ||
          (u.uomName && u.uomName.toLowerCase() === unitVal.toLowerCase())
      );
      codeToUse = matchedUom ? (matchedUom.uomCode || matchedUom.uomName) : unitVal;
    }
    return codeToUse ? `${displayNum} ${codeToUse}` : displayNum;
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

  const findDuplicateText = <T,>(
    entries: T[],
    getValue: (entry: T) => string | null | undefined
  ): string | null => {
    const seen = new Set<string>();
    for (const entry of entries) {
      const value = getValue(entry)?.toString().trim();
      if (!value) continue;
      const normalized = value.toLowerCase();
      if (seen.has(normalized)) {
        return value;
      }
      seen.add(normalized);
    }
    return null;
  };

  // Helper function to populate fabric details from selected fabric
  const populateFabricDetailsFromMaster = (fabricId: number): Partial<PieceEntry> => {
    const selectedFabric = fabricMastersArray.find((f: any) => f.id === fabricId);
    if (!selectedFabric) return {};

    const poTypeId = selectedItems?.[0]?.poTypeId;
    const updates: Partial<PieceEntry> = {
      fabricCode: selectedFabric.fabricCode,
      fabricDetails: poTypeId === PO_TYPE_WOVEN_FABRIC 
        ? (selectedFabric.fabricQuality || selectedFabric.fabricName
          ? `${selectedFabric.fabricCode} - ${selectedFabric.fabricQuality || selectedFabric.fabricName}`
          : selectedFabric.fabricCode)
        : (selectedFabric.fabricName
          ? `${selectedFabric.fabricCode} - ${selectedFabric.fabricName}`
          : selectedFabric.fabricCode),
      fabricQuality: selectedFabric.fabricQuality || '',
      gstPercent: selectedFabric.gstPercent || (selectedFabric.cgst || 0) + (selectedFabric.sgst || 0) || selectedFabric.igst || 0,
      gsm: selectedFabric.gsm || undefined,
      ppi: selectedFabric.ppi || undefined
    };

    if (poTypeId === PO_TYPE_WOVEN_FABRIC) {
      updates.fabricMasterId = fabricId;
      updates.fabricId = 0;
    } else if (poTypeId === PO_TYPE_KNITTED_FABRIC) {
      updates.fabricId = fabricId;
      updates.fabricMasterId = 0;
    }

    return updates;
  };

  

  useEffect(() => {
    if (!selectedItems || selectedItems.length === 0) {
      if (!props?.embedded) {
        navigate('/transaction/purchase-inward');
      } else {
        setItemsWithEntries([]);
      }
    } else {
      setItemsWithEntries(prev => {
        const uniqueSelectedItemsMap = new Map();
        selectedItems.forEach((item: any) => {
          const key = item.poItemId || item.purchaseOrderItemId || item.orderItemId || 
            (item.poId && item.yarnId ? `yarn-${item.poId}-${item.yarnId}` : 
             item.poId && item.fabricId ? `fabric-${item.poId}-${item.fabricId}` : 
             item.poId && item.fabricMasterId ? `fabricM-${item.poId}-${item.fabricMasterId}` : 
             item.poId && item.itemId ? `item-${item.poId}-${item.itemId}` : 
             (item.productName ? `name-${item.productName}` : item.id));
          if (key && !uniqueSelectedItemsMap.has(String(key))) {
            uniqueSelectedItemsMap.set(String(key), item);
          } else if (!key) {
            uniqueSelectedItemsMap.set(JSON.stringify(item), item);
          }
        });
        const uniqueSelectedItems = Array.from(uniqueSelectedItemsMap.values());

        const matchedPrevIndices = new Set<number>();

        return uniqueSelectedItems.map((item: any, idx: number) => {
          let prevItemDataIndex = prev.findIndex((p: any, pIdx: number) => 
            !matchedPrevIndices.has(pIdx) && (
              (p.item?.id && item.id && String(p.item.id) === String(item.id)) || 
              (p.item?.poItemId && item.poItemId && String(p.item.poItemId) === String(item.poItemId)) ||
              (p.item?.purchaseOrderItemId && item.purchaseOrderItemId && String(p.item.purchaseOrderItemId) === String(item.purchaseOrderItemId)) ||
              (p.item?.orderItemId && item.orderItemId && String(p.item.orderItemId) === String(item.orderItemId)) ||
              (p.item?.yarnId && item.yarnId && String(p.item.yarnId) === String(item.yarnId)) ||
              (p.item?.fabricId && item.fabricId && String(p.item.fabricId) === String(item.fabricId)) ||
              (p.item?.itemId && item.itemId && String(p.item.itemId) === String(item.itemId)) ||
              (p.item?.productName && item.productName && p.item.productName === item.productName)
            )
          );

          if (prevItemDataIndex < 0 && prev[idx] && !matchedPrevIndices.has(idx)) {
            prevItemDataIndex = idx;
          }

          if (prevItemDataIndex >= 0) {
            matchedPrevIndices.add(prevItemDataIndex);
          }

          const prevItemData = prevItemDataIndex >= 0 ? prev[prevItemDataIndex] : undefined;

          const existingYarnStockDetails = isYarnType && item.yarnStockDetails && 
            Array.isArray(item.yarnStockDetails) && item.yarnStockDetails.length > 0
            ? Array.from(new Map(item.yarnStockDetails.map((lot: any, idx: number) => 
                [lot.id && Number(lot.id) > 0 ? `id-${lot.id}` : `idx-${idx}`, lot]
              )).values()).map((lot: any, idx: number) => {
                const lotId = Number(lot.id);
                const inwardQty = Number(lot.inwardQty ?? lot.quantity ?? 0);
                const rejectedQty = Number(lot.rejectedQty ?? lot.rejectedQuantity ?? 0);
                const acceptedQty = Number(lot.acceptedQty ?? (inwardQty - rejectedQty));

                return {
                  id: lotId > 0 ? lotId : `${Date.now()}-${idx}`,
                  inwardId: lot.inwardId ?? formData.id ?? null,
                  lotNo: lot.lotNo || lot.lotNumber || '',
                  inwardQty: inwardQty,
                  acceptedQty: acceptedQty,
                  rejectedQty: rejectedQty,
                  inwardBags: Number(lot.inwardBags ?? lot.bags ?? 0),
                  kgsPerBag: Number(lot.kgsPerBag ?? lot.kgPerBag ?? 0),
                  conesPerBag: Number(lot.conesPerBag ?? lot.cones_per_bag ?? 0),
                  conesWeight: Number(lot.conesWeight ?? lot.cones_weight ?? 0),
                  remark: lot.remark ?? lot.remarks ?? item.remark ?? '',
                  warehouseId: String(lot.warehouseId || ''),
                  itemId: lot.itemId ?? item.yarnId ?? null,
                  uomId: lot.uomId ?? item.uomId ?? null,
                  yarnId: lot.yarnId ?? item.yarnId ?? null,
                  fabricId: lot.fabricId ?? item.fabricId ?? null,
                  orderItemId: lot.orderItemId ?? item.id ?? null,
                  isInspected: lot.isInspected ?? 0,
                  yarnTypeId: lot.yarnTypeId ?? item.yarnTypeId ?? null,
                  millId: lot.millId ?? lot.millNameId ?? item.millNameId ?? formData.yarnMillId ?? null,
                };
              })
            : (prevItemData?.yarnStockDetails || []);

          const existingPieceEntries = isFabricType && item.pieceEntries && Array.isArray(item.pieceEntries) && item.pieceEntries.length > 0
            ? Array.from(new Map(item.pieceEntries.map((piece: any, idx: number) => [piece.id && Number(piece.id) > 0 ? `id-${piece.id}` : `no-${piece.pieceNumber}`, piece])).values()).map((piece: any, idx: number) => {
              const fabricId = Number(piece.fabricId) || item.fabricId || 0;
              const fabricMasterId = Number(piece.fabricMasterId) || item.fabricMasterId || 0;
              const fabricIdToUse = fabricMasterId || fabricId;
              const pieceId = Number(piece.id);

              let enrichedPiece: any = {
                id: pieceId > 0 ? pieceId : `${Date.now()}-${idx}`,
                pieceNumber: piece.pieceNumber || '',
                fabricCode: piece.fabricCode || item.productName || '',
                fabricDetails: piece.fabricDetails || '',
                fabricQuality: piece.fabricQuality || '',
                gstPercent: piece.gstPercent || 0,
                gsm: piece.gsm || undefined,
                ppi: piece.ppi || undefined,
                pieceMeter: Number(piece.quantity || piece.pieceMeter) || 0,
                netWeight: Number(piece.weight || piece.netWeight) || 0,
                avgWeight: (piece.weight || piece.netWeight) && (piece.quantity || piece.pieceMeter) ? Number(piece.weight || piece.netWeight) / Number(piece.quantity || piece.pieceMeter) : (piece.avgWeight || 0),
                grossWt: piece.grossWt != null ? Number(piece.grossWt) : undefined,
                remarks: piece.remarks || '',
                warehouseId: String(piece.warehouseId) || '',
                fabricId: fabricId,
                fabricMasterId: fabricMasterId,
                isInspected: piece.isInspected ?? 0
              };

              if (fabricIdToUse && !enrichedPiece.fabricDetails) {
                const fabricDetails = populateFabricDetailsFromMaster(fabricIdToUse);
                enrichedPiece = { ...enrichedPiece, ...fabricDetails };
              }

              return enrichedPiece;
            })
            : (prevItemData?.pieceEntries || []);

          const itemStockRaw = (Array.isArray(item.itemStockDetails) && item.itemStockDetails.length > 0)
            ? item.itemStockDetails
            : (Array.isArray(item.item_stock_details) && item.item_stock_details.length > 0)
              ? item.item_stock_details
              : (Array.isArray(item.lotEntries) && item.lotEntries.length > 0)
                ? item.lotEntries
                : null;

          const existingItemStockDetails = isItemType && itemStockRaw
            ? Array.from(new Map(itemStockRaw.map((stock: any, idx: number) => [stock.id && Number(stock.id) > 0 ? `id-${stock.id}` : `idx-${idx}`, stock])).values()).map((stock: any, idx: number) => {
              const stockId = Number(stock.id);
              const inwardQty = Number(stock.inwardQty ?? stock.quantity ?? 0);
              const rejectedQty = Number(stock.rejectedQty ?? stock.rejectedQuantity ?? 0);
              const acceptedQty = Number(stock.acceptedQty ?? (inwardQty - rejectedQty));

              return {
                id: stockId > 0 ? stockId : `${Date.now()}-${idx}`,
                lotNo: stock.lotNo || stock.lotNumber || '',
                rackNo: stock.rackNo || stock.rack_no || '',
                inwardQty: inwardQty,
                acceptedQty: acceptedQty,
                rejectedQty: rejectedQty,
                inwardBags: Number(stock.inwardBags ?? stock.bags ?? 0),
                kgsPerBag: Number(stock.kgsPerBag ?? stock.kgPerBag ?? 0),
                conesPerBag: Number(stock.conesPerBag ?? stock.cones_per_bag ?? 0),
                conesWeight: Number(stock.conesWeight ?? stock.cones_weight ?? 0),
                remark: stock.remark || stock.remarks || '',
                warehouseId: String(stock.warehouseId || ''),
                itemId: stock.itemId ?? item.itemId ?? null,
                uomId: stock.uomId ?? item.uomId ?? null,
                itemInwardItemId: stock.itemInwardItemId ?? item.id ?? null,
                isInspected: stock.isInspected ?? 0,
                millId: stock.millId ?? stock.millNameId ?? item.millNameId ?? formData.yarnMillId ?? null,
              };
            })
            : (prevItemData?.itemStockDetails || []);

          return {
            item,
            yarnStockDetails: (prevItemData?.yarnStockDetails && prevItemData.yarnStockDetails.length > 0) ? prevItemData.yarnStockDetails : existingYarnStockDetails,
            pieceEntries: (prevItemData?.pieceEntries && prevItemData.pieceEntries.length > 0) ? prevItemData.pieceEntries : existingPieceEntries,
            itemStockDetails: (prevItemData?.itemStockDetails && prevItemData.itemStockDetails.length > 0) ? prevItemData.itemStockDetails : existingItemStockDetails,
            entriesDraft: prevItemData?.entriesDraft ?? [],
            numberOfEntries: prevItemData?.numberOfEntries ?? '1',
            editingIndex: prevItemData?.editingIndex ?? null
          };
        });
      });
    }
  }, [selectedItems, navigate, isEditMode, entryType, isYarnType, isFabricType, isItemType]);

  // Helper function to process backend response after update
const processUpdateResponse = (response: any, isEditMode: boolean) => {
  // Handle wrapper format (ResponseUtil.success)
  let purchaseInwardData = response?.data || response;
  
  // Ensure we're working with the actual inward data
  if (purchaseInwardData?.purchaseInwardItemsDtl) {
    return {
      ...purchaseInwardData,
      // Ensure each item's yarn stock details have inwardId
      purchaseInwardItemsDtl: purchaseInwardData.purchaseInwardItemsDtl.map((item: any) => ({
        ...item,
        yarnStockDetails: (item.yarnStockDetails || []).map((detail: any) => ({
          ...detail,
          inwardId: purchaseInwardData.id ?? detail.inwardId,  // Ensure inwardId is set
        })),
        itemStockDetails: (item.itemStockDetails || []).map((detail: any) => ({
          ...detail,
          inwardId: purchaseInwardData.id ?? detail.inwardId,
        })),
      })),
    };
  }
  return purchaseInwardData;
};

// Helper function to reload data after update
const reloadDataAfterUpdate = (response: any) => {
  const processedData = processUpdateResponse(response, isEditMode);
  
  const rawItems = processedData?.purchaseInwardItemsDtl || processedData?.items;
  if (!rawItems || !Array.isArray(rawItems)) {
    console.warn('No items found in update response');
    return;
  }

  const uniqueRawItemsMap = new Map();
  rawItems.forEach((item: any) => {
    const key = item.purchaseOrderItemId || item.poItemId || item.orderItemId || item.id;
    if (key && !uniqueRawItemsMap.has(String(key))) {
      uniqueRawItemsMap.set(String(key), item);
    }
  });
  const uniqueRawItems = Array.from(uniqueRawItemsMap.values());

  // Reconstruct itemsWithEntries with updated data
  const updatedItemsWithEntries = uniqueRawItems.map((item: any, idx: number) => {
    const yarnDetails = isYarnType && item.yarnStockDetails && Array.isArray(item.yarnStockDetails)
      ? item.yarnStockDetails.map((lot: any, lotIdx: number) => ({
          id: Number(lot.id) > 0 ? Number(lot.id) : `${Date.now()}-${lotIdx}`,
          inwardId: lot.inwardId ?? processedData.id,  // CRITICAL: Use inwardId from response
          lotNo: lot.lotNo || '',
          inwardQty: Number(lot.inwardQty ?? 0),
          acceptedQty: Number(lot.acceptedQty ?? 0),
          rejectedQty: Number(lot.rejectedQty ?? 0),
          inwardBags: Number(lot.inwardBags ?? 0),
          kgsPerBag: Number(lot.kgsPerBag ?? 0),
          conesPerBag: Number(lot.conesPerBag ?? 0),
          conesWeight: Number(lot.conesWeight ?? 0),
          remark: lot.remark ?? '',
          warehouseId: String(lot.warehouseId || ''),
          itemId: lot.itemId,
          uomId: lot.uomId,
          yarnId: lot.yarnId,
          orderItemId: lot.orderItemId,
          isInspected: lot.isInspected ?? 0,
          yarnTypeId: lot.yarnTypeId ?? item.yarnTypeId ?? null,
          millId: lot.millId ?? lot.millNameId ?? item.millNameId ?? formData.yarnMillId ?? null,
        }))
      : [];

    const pieceDetails = isFabricType && item.pieceEntries && Array.isArray(item.pieceEntries)
      ? item.pieceEntries.map((piece: any, pieceIdx: number) => ({
          id: Number(piece.id) > 0 ? Number(piece.id) : `${Date.now()}-${pieceIdx}`,
          pieceNumber: piece.pieceNumber || '',
          fabricCode: piece.fabricCode || '',
          fabricDetails: piece.fabricDetails || '',
          fabricQuality: piece.fabricQuality || '',
          gstPercent: piece.gstPercent || 0,
          gsm: piece.gsm,
          ppi: piece.ppi,
          pieceMeter: Number(piece.pieceMeter ?? 0),
          netWeight: Number(piece.netWeight ?? 0),
          avgWeight: Number(piece.avgWeight ?? 0),
          remarks: piece.remarks || '',
          warehouseId: String(piece.warehouseId || ''),
          fabricId: piece.fabricId || 0,
          fabricMasterId: piece.fabricMasterId || 0,
          isInspected: piece.isInspected ?? 0,
        }))
      : [];

    const itemDetails = isItemType && item.itemStockDetails && Array.isArray(item.itemStockDetails)
      ? item.itemStockDetails.map((detail: any, detailIdx: number) => ({
          id: Number(detail.id) > 0 ? Number(detail.id) : `${Date.now()}-${detailIdx}`,
          inwardId: detail.inwardId ?? processedData.id,
          lotNo: detail.lotNo || '',
          rackNo: detail.rackNo || detail.rack_no || '',
          inwardQty: Number(detail.inwardQty ?? 0),
          acceptedQty: Number(detail.acceptedQty ?? 0),
          rejectedQty: Number(detail.rejectedQty ?? 0),
          inwardBags: Number(detail.inwardBags ?? 0),
          kgsPerBag: Number(detail.kgsPerBag ?? 0),
          remark: detail.remark ?? '',
          warehouseId: String(detail.warehouseId || ''),
          itemId: detail.itemId,
          uomId: detail.uomId,
          millId: detail.millId ?? detail.millNameId ?? item.millNameId ?? formData.yarnMillId ?? null,
        }))
      : [];

    return {
      item,
      yarnStockDetails: yarnDetails,
      pieceEntries: pieceDetails,
      itemStockDetails: itemDetails,
      entriesDraft: [],
      numberOfEntries: (yarnDetails.length + pieceDetails.length + itemDetails.length).toString(),
      editingIndex: null,
    };
  });

  setItemsWithEntries(updatedItemsWithEntries);
  return updatedItemsWithEntries;
};


  useEffect(() => {
    dispatch(getAllPoTypes({fetchAll: true}));
    dispatch(getAllWarehouse({fetchAll: true}));
    dispatch(getAllUomMaster({fetchAll: true}));
    dispatch(getSubCategoryByCategory({ categoryName: 'Mill', fetchAll: true }));

    if (isFabricType && selectedItems.length > 0) {
      const poTypeId = selectedItems[0].poTypeId;
      const poTypeName = selectedItems[0].poTypeName || '';

      if (poTypeName.toLowerCase().includes('fabric')) {
        dispatch(getAllFabricMasters({fetchAll: true}));
      } else if (poTypeName.toLowerCase().includes('knit')) {
        dispatch(getAllKnittedFabricMasters({}));
      } else {
        if (poTypeId === PO_TYPE_WOVEN_FABRIC) {
          dispatch(getAllFabricMasters({}));
        } else if (poTypeId === PO_TYPE_KNITTED_FABRIC) {
          dispatch(getAllKnittedFabricMasters({}));
        }
      }
    }
  }, [dispatch, isFabricType, selectedItems]);


  // Re-enrich piece entries after fabric masters are loaded
  useEffect(() => {
    if (isEditMode && isFabricType && fabricMastersArray.length > 0 && itemsWithEntries.length > 0) {
      setItemsWithEntries(prev => prev.map(itemData => {
        const enrichedPieceEntries = itemData.pieceEntries.map((piece: PieceEntry) => {
          if (piece.fabricDetails) {
            return piece;
          }

          const fabricIdToUse = piece.fabricMasterId || piece.fabricId;
          if (fabricIdToUse) {
            const fabricDetails = populateFabricDetailsFromMaster(fabricIdToUse);
            return { ...piece, ...fabricDetails };
          }
          return piece;
        });

        return {
          ...itemData,
          pieceEntries: enrichedPieceEntries
        };
      }));
    }
  }, [fabricMastersArray, isEditMode, isFabricType]);

  const canUseTemplateActions = useMemo(() => {
    if (!warehouseData.length || !itemsWithEntries.length) {
      return false;
    }
    if (isYarnType || isItemType) {
      return true;
    }
    if (isFabricType) {
      return fabricMastersArray.length > 0;
    }
    return false;
  }, [warehouseData.length, itemsWithEntries.length, isYarnType, isFabricType, isItemType, fabricMastersArray.length]);

  // Sync quantity and price changes from selectedItems to lot entries (real-time)
  useEffect(() => {
    if (selectedItems.length === 0 || itemsWithEntries.length === 0) {
      previousSelectedItemsRef.current = selectedItems;
      return;
    }

    const hasQtyOrPriceChanged = selectedItems.some((item: any, index: number) => {
      const prevItem = previousSelectedItemsRef.current?.[index];
      if (!prevItem) return true;

      const qtyChanged = Number(item.quantityReceived) !== Number(prevItem.quantityReceived);
      const priceChanged = Number(item.price) !== Number(prevItem.price);

      return qtyChanged || priceChanged;
    });

    if (!hasQtyOrPriceChanged) {
      return;
    }

    console.log('Detected quantity/price changes, syncing lot entries...');

    setItemsWithEntries(prev => prev.map((itemData, index) => {
      const selectedItem = selectedItems[index];
      if (!selectedItem) return itemData;

      const currentQty = Number(itemData.item.quantityReceived) || 0;
      const newQty = Number(selectedItem.quantityReceived) || 0;
      const currentPrice = Number(itemData.item.price) || 0;
      const newPrice = Number(selectedItem.price) || 0;

      const quantityChanged = currentQty !== newQty && newQty > 0;
      const priceChanged = currentPrice !== newPrice && newPrice > 0;

      if (!quantityChanged && !priceChanged) {
        return itemData;
      }

      const updatedData = { ...itemData };

      if (quantityChanged) {
        console.log(`Syncing quantity for item ${index}: ${currentQty} -> ${newQty}`);

        if (isYarnType) {
          updatedData.yarnStockDetails = itemData.yarnStockDetails.map((lot: YarnStockDetail) => {
            const oldAcceptedQty = Number(lot.acceptedQty) || 0;
            const oldRejectedQty = Number(lot.rejectedQty) || 0;
            const oldTotal = oldAcceptedQty + oldRejectedQty;

            if (oldTotal === 0) {
              return { ...lot, inwardQty: newQty, acceptedQty: newQty };
            }

            const ratio = newQty / oldTotal;
            const newAccepted = Math.round(oldAcceptedQty * ratio * 100) / 100;
            const newRejected = newQty - newAccepted;

            return {
              ...lot,
              inwardQty: newQty,
              acceptedQty: newAccepted,
              rejectedQty: newRejected
            };
          });
        } else if (isItemType) {
          updatedData.itemStockDetails = itemData.itemStockDetails.map((stock: ItemStockDetail) => {
            const oldAcceptedQty = Number(stock.acceptedQty) || 0;
            const oldRejectedQty = Number(stock.rejectedQty) || 0;
            const oldTotal = oldAcceptedQty + oldRejectedQty;

            if (oldTotal === 0) {
              return { ...stock, inwardQty: newQty, acceptedQty: newQty };
            }

            const ratio = newQty / oldTotal;
            const newAccepted = Math.round(oldAcceptedQty * ratio * 100) / 100;
            const newRejected = newQty - newAccepted;

            return {
              ...stock,
              inwardQty: newQty,
              acceptedQty: newAccepted,
              rejectedQty: newRejected
            };
          });
        } else {
          updatedData.pieceEntries = itemData.pieceEntries.map((piece: PieceEntry) => ({
            ...piece,
            pieceMeter: newQty,
            avgWeight: piece.netWeight && newQty ? piece.netWeight / newQty : (piece.avgWeight || 0)
          }));
        }
      }

      if (priceChanged && !isYarnType) {
        console.log(`Syncing price for item ${index}: ${currentPrice} -> ${newPrice}`);
        updatedData.pieceEntries = (updatedData.pieceEntries || itemData.pieceEntries).map((piece: PieceEntry) => ({
          ...piece,
          cost: newPrice * (piece.pieceMeter || 0)
        }));
      }

      updatedData.item = { ...itemData.item, ...selectedItem };
      return updatedData;
    }));

    previousSelectedItemsRef.current = selectedItems;
  }, [selectedItems, itemsWithEntries.length, isYarnType, isItemType]);

  // Update piece number counter when switching items or entries change
  useEffect(() => {
    if (isFabricType) {
      const currentItemData = itemsWithEntries[currentItemIndex];
      if (currentItemData?.pieceEntries) {
        const numbers = currentItemData.pieceEntries.map((entry: PieceEntry) => {
          const match = entry.pieceNumber?.match(/[A-Z]{2}-GFP-(\d{5})/);
          return match ? parseInt(match[1]) : 0;
        });
        const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
        pieceNumberCounterRef.current = maxNum + 1;
      }
    } else {
      pieceNumberCounterRef.current = 1;
    }
  }, [currentItemIndex, itemsWithEntries, isFabricType]);

  // Calculate total quantity (sum of accepted + rejected for yarn type)
  const calculateTotalQuantity = (entries: (YarnStockDetail | ItemStockDetail | PieceEntry)[]) => {
    if (isYarnType) {
      return (entries as YarnStockDetail[]).reduce((sum, entry) =>
        sum + (Number(entry.acceptedQty) || 0) + (Number(entry.rejectedQty) || 0), 0);
    } else if (isItemType) {
      return (entries as ItemStockDetail[]).reduce((sum, entry) =>
        sum + (Number(entry.acceptedQty) || 0) + (Number(entry.rejectedQty) || 0), 0);
    } else {
      return (entries as PieceEntry[]).reduce((sum, entry) => sum + (Number(entry.pieceMeter) || 0), 0);
    }
  };

  // Calculate total draft quantity
  const calculateTotalDraftQuantity = (drafts: Partial<YarnStockDetail | ItemStockDetail | PieceEntry>[]) => {
    if (isYarnType) {
      return drafts.reduce((sum, draft) =>
        sum + (Number((draft as YarnStockDetail).acceptedQty) || 0) + (Number((draft as YarnStockDetail).rejectedQty) || 0), 0);
    } else if (isItemType) {
      return drafts.reduce((sum, draft) =>
        sum + (Number((draft as ItemStockDetail).acceptedQty) || 0) + (Number((draft as ItemStockDetail).rejectedQty) || 0), 0);
    } else {
      return drafts.reduce((sum, draft) => sum + (Number((draft as PieceEntry).pieceMeter) || 0), 0);
    }
  };

  const exceedsReceivedQuantity = (
    entries: (YarnStockDetail | ItemStockDetail | PieceEntry)[],
    receivedQuantity: number,
    drafts: Partial<YarnStockDetail | ItemStockDetail | PieceEntry>[] = []
  ) => {
    const totalQuantity = calculateTotalQuantity(entries);
    const totalDraftQuantity = calculateTotalDraftQuantity(drafts);
    return totalQuantity + totalDraftQuantity > receivedQuantity + 0.0001;
  };

  const handleDownloadTemplate = () => {
    if (!canUseTemplateActions) {
      toast.error('Template actions are unavailable. Please ensure prerequisites are loaded.');
      return;
    }

    if (isYarnType) {
      generateExcelTemplate({
        headers: YARN_TEMPLATE_HEADERS,
        fileName: 'purchase-inward-yarn-lot-template'
      });
      return;
    }

    if (isItemType) {
      generateExcelTemplate({
        headers: ITEM_TEMPLATE_HEADERS,
        fileName: 'purchase-inward-item-stock-template'
      });
      return;
    }

    if (isFabricType) {
      if (!fabricMastersArray.length) {
        toast.error('Fabric master data not loaded.');
        return;
      }
      generateExcelTemplate({
        headers: FABRIC_TEMPLATE_HEADERS,
        fileName: 'purchase-inward-fabric-piece-template'
      });
    }
  };

  const handleUploadButtonClick = () => {
    if (!canUseTemplateActions) {
      toast.error('Please ensure warehouses and masters are loaded before uploading.');
      return;
    }
    const currentItemData = itemsWithEntries[currentItemIndex];
    if (!currentItemData) {
      toast.error('No item selected to import entries.');
      return;
    }
    fileInputRef.current?.click();
  };

  const validateUniformFabricCodes = (entries: PieceEntry[]) => {
    const normalizedCodes = entries
      .map(entry => entry.fabricCode?.toString().trim().toLowerCase())
      .filter(Boolean);
    if (normalizedCodes.length <= 1) {
      return true;
    }
    return new Set(normalizedCodes).size === 1;
  };

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
    const currentItemData = itemsWithEntries[currentItemIndex];
    if (!currentItemData) {
      toast.error('No item selected to import entries.');
      event.target.value = '';
      return;
    }

    try {
      setIsImporting(true);
      const rows = await readExcelFile<Record<string, any>>(file);
      if (!Array.isArray(rows) || rows.length === 0) {
        toast.error('No data found in the uploaded file');
        return;
      }

      if (isYarnType) {
        importYarnLotsFromRows(rows, currentItemData);
      } else if (isItemType) {
        importItemStockDetailsFromRows(rows, currentItemData);
      } else if (isFabricType) {
        importFabricPiecesFromRows(rows, currentItemData);
      } else {
        toast.error('Unsupported import type for this entry.');
      }
    } catch (error) {
      toast.error('Failed to process the uploaded file');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const importYarnLotsFromRows = (rows: Record<string, any>[], currentItemData: ItemWithEntries) => {
    const validationErrors: string[] = [];
    const parsedEntries: YarnStockDetail[] = [];
    const baseItem = currentItemData.item;

    rows.forEach((row, index) => {
      const normalized = normalizeRowKeys(row || {});
      const values = Object.values(normalized);
      if (!values.some(value => value !== undefined && value !== null && value !== '')) {
        return;
      }

      const warehouseName = normalizeCellValue(normalized['warehouse name'] ?? normalized['warehouse']);
      if (!warehouseName) {
        validationErrors.push(`Row ${index + 2}: Warehouse Name should not be empty`);
        return;
      }
      const warehouseRecord = warehouseNameLookup.get(warehouseName.toLowerCase());
      if (!warehouseRecord) {
        validationErrors.push(`Row ${index + 2}: Warehouse "${warehouseName}" not found`);
        return;
      }

      const lotNo = normalizeCellValue(normalized['lot no'] ?? normalized['lot number'] ?? normalized['lot']);
      if (!lotNo) {
        validationErrors.push(`Row ${index + 2}: Lot No should not be empty`);
        return;
      }

      const noOfBags = parseNumericCell(normalized['no of carton/pallet']);
      if (noOfBags === null) {
        validationErrors.push(`Row ${index + 2}: No Of Carton/Pallet should not be empty`);
        return;
      }

      const kgsPerBag = parseNumericCell(normalized['kgs/bag'])
        ?? parseNumericCell(normalized['kgs per bag'])
        ?? parseNumericCell(normalized['kgs perbag']);
      if (kgsPerBag === null) {
        validationErrors.push(`Row ${index + 2}: Kgs/Bag should not be empty`);
        return;
      }

      const acceptedQty = parseNumericCell(normalized['accepted qty']);
      if (acceptedQty === null) {
        validationErrors.push(`Row ${index + 2}: Accepted Qty should not be empty`);
        return;
      }

      const rejectedQty = parseNumericCell(normalized['rejected qty']);
      if (rejectedQty === null) {
        validationErrors.push(`Row ${index + 2}: Rejected Qty should not be empty`);
        return;
      }

      if ((acceptedQty ?? 0) <= 0 && (rejectedQty ?? 0) <= 0) {
        validationErrors.push(`Row ${index + 2}: Accepted Qty or Rejected Qty must be greater than zero`);
        return;
      }

      const conesPerBag = parseNumericCell(normalized['cones per bag']);
      if (conesPerBag === null) {
        validationErrors.push(`Row ${index + 2}: Cones Per Bag should not be empty`);
        return;
      }

      const remark = normalizeCellValue(normalized['remark']);
      if (!remark) {
        validationErrors.push(`Row ${index + 2}: Remark should not be empty`);
        return;
      }

      const accepted = Math.max(0, acceptedQty ?? 0);
      const rejected = Math.max(0, rejectedQty ?? 0);
      const entryId = Date.now() + index + parsedEntries.length;

      parsedEntries.push({
        id: entryId,
        lotNo: lotNo || `Lot ${currentItemData.yarnStockDetails.length + parsedEntries.length + 1}`,
        inwardQty: accepted + rejected,
        acceptedQty: accepted,
        rejectedQty: rejected,
        inwardBags: noOfBags || 0,
        kgsPerBag: kgsPerBag || 0,
        conesPerBag: conesPerBag || 0,
        conesWeight: conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0,
        remark,
        warehouseId: String(warehouseRecord.id),
        itemId: baseItem.yarnId ?? baseItem.itemId ?? baseItem.id ?? null,
        uomId: baseItem.uomId ?? null,
        yarnId: baseItem.yarnId ?? baseItem.itemId ?? null,
        fabricId: baseItem.fabricId ?? null,
        orderItemId: baseItem.orderItemId ?? baseItem.id ?? null,
        yarnTypeId: baseItem.yarnTypeId ?? null,
      });
    });

    if (validationErrors.length) {
      toast.error(validationErrors.join('\n'));
      return;
    }

    if (!parsedEntries.length) {
      toast.error('No valid rows found in the uploaded file');
      return;
    }

    const combinedEntries = [...currentItemData.yarnStockDetails, ...parsedEntries];
    const receivedQuantity = Number(currentItemData.item.quantityReceived) || 0;
    const totalQuantity = calculateTotalQuantity(combinedEntries);

    if (totalQuantity > receivedQuantity + 0.0001) {
      toast.error('Imported quantities exceed the inward quantity.');
      return;
    }

    updateCurrentItemData({ yarnStockDetails: combinedEntries });
    if (!isEditMode) {
      validateQuantityTotals(combinedEntries, currentItemData.entriesDraft);
    }
    toast.success(`Imported ${parsedEntries.length} ${parsedEntries.length === 1 ? 'lot' : 'lots'}`);
  };

  const importItemStockDetailsFromRows = (rows: Record<string, any>[], currentItemData: ItemWithEntries) => {
    const validationErrors: string[] = [];
    const parsedEntries: ItemStockDetail[] = [];
    const baseItem = currentItemData.item;

    rows.forEach((row, index) => {
      const normalized = normalizeRowKeys(row || {});
      const values = Object.values(normalized);
      if (!values.some(value => value !== undefined && value !== null && value !== '')) {
        return;
      }

      const warehouseName = normalizeCellValue(normalized['warehouse name'] ?? normalized['warehouse']);
      if (!warehouseName) {
        validationErrors.push(`Row ${index + 2}: Warehouse Name should not be empty`);
        return;
      }
      const warehouseRecord = warehouseNameLookup.get(warehouseName.toLowerCase());
      if (!warehouseRecord) {
        validationErrors.push(`Row ${index + 2}: Warehouse "${warehouseName}" not found`);
        return;
      }

      const lotNo = normalizeCellValue(normalized['lot no'] ?? normalized['lot number'] ?? normalized['lot']);
      if (!lotNo) {
        validationErrors.push(`Row ${index + 2}: Lot No should not be empty`);
        return;
      }

      const noOfBags = parseNumericCell(normalized['no of carton/pallet']);
      if (noOfBags === null) {
        validationErrors.push(`Row ${index + 2}: No Of Carton/Pallet should not be empty`);
        return;
      }

      const kgsPerBagRaw = normalized['qty/unit']
        ?? normalized['qty / unit']
        ?? normalized['kgs/bag']
        ?? normalized['kgs per bag']
        ?? normalized['kgs perbag'];
      const kgsPerBag = kgsPerBagRaw != null ? String(kgsPerBagRaw).trim() : '';
      if (!kgsPerBag) {
        validationErrors.push(`Row ${index + 2}: Qty/Unit should not be empty`);
        return;
      }

      const acceptedQty = parseNumericCell(normalized['accepted qty']);
      if (acceptedQty === null) {
        validationErrors.push(`Row ${index + 2}: Accepted Qty should not be empty`);
        return;
      }

      const rejectedQty = parseNumericCell(normalized['rejected qty']);
      if (rejectedQty === null) {
        validationErrors.push(`Row ${index + 2}: Rejected Qty should not be empty`);
        return;
      }

      if ((acceptedQty ?? 0) <= 0 && (rejectedQty ?? 0) <= 0) {
        validationErrors.push(`Row ${index + 2}: Accepted Qty or Rejected Qty must be greater than zero`);
        return;
      }

      const conesPerBag = parseNumericCell(normalized['cones per bag']) ?? 0;
      const remark = normalizeCellValue(normalized['remark']);
      if (!remark) {
        validationErrors.push(`Row ${index + 2}: Remark should not be empty`);
        return;
      }

      const accepted = Math.max(0, acceptedQty ?? 0);
      const rejected = Math.max(0, rejectedQty ?? 0);
      const entryId = Date.now() + index + parsedEntries.length;
      const numKpb = parseFloat(kgsPerBag) || 0;

      parsedEntries.push({
        id: entryId,
        lotNo: lotNo || `Stock ${currentItemData.itemStockDetails.length + parsedEntries.length + 1}`,
        inwardQty: accepted + rejected,
        acceptedQty: accepted,
        rejectedQty: rejected,
        inwardBags: noOfBags || 0,
        kgsPerBag: kgsPerBag,
        conesPerBag: conesPerBag || 0,
        conesWeight: conesPerBag > 0 && numKpb > 0 ? Number((numKpb / conesPerBag).toFixed(3)) : 0,
        remark,
        warehouseId: String(warehouseRecord.id),
        itemId: baseItem.itemId ?? baseItem.id ?? null,
        uomId: baseItem.uomId ?? null,
        itemInwardItemId: baseItem.itemInwardItemId ?? baseItem.id ?? null
      });
    });

    if (validationErrors.length) {
      toast.error(validationErrors.join('\n'));
      return;
    }

    if (!parsedEntries.length) {
      toast.error('No valid rows found in the uploaded file');
      return;
    }

    const combinedEntries = [...currentItemData.itemStockDetails, ...parsedEntries];
    const receivedQuantity = Number(currentItemData.item.quantityReceived) || 0;
    const totalQuantity = combinedEntries.reduce((sum, stock) => sum + (Number(stock.acceptedQty) || 0), 0);

    if (totalQuantity > receivedQuantity + 0.0001) {
      toast.error('Imported quantities exceed the inward quantity.');
      return;
    }

    updateCurrentItemData({ itemStockDetails: combinedEntries });
    if (!isEditMode) {
      validateQuantityTotals(combinedEntries, currentItemData.entriesDraft);
    }
    toast.success(`Imported ${parsedEntries.length} ${parsedEntries.length === 1 ? 'stock record' : 'stock records'}`);
  };

  const importFabricPiecesFromRows = (rows: Record<string, any>[], currentItemData: ItemWithEntries) => {
    const validationErrors: string[] = [];
    const parsedEntries: PieceEntry[] = [];
    const poTypeId = currentItemData.item.poTypeId;
    const existingPieceNumbers = new Set(
      currentItemData.pieceEntries
        .map(entry => entry.pieceNumber?.toString().trim().toLowerCase())
        .filter(Boolean)
    );

    rows.forEach((row, index) => {
      const normalized = normalizeRowKeys(row || {});
      const values = Object.values(normalized);
      if (!values.some(value => value !== undefined && value !== null && value !== '')) {
        return;
      }

      const warehouseName = normalizeCellValue(normalized['warehouse name'] ?? normalized['warehouse']);
      if (!warehouseName) {
        validationErrors.push(`Row ${index + 2}: Warehouse Name should not be empty`);
        return;
      }
      const warehouseRecord = warehouseNameLookup.get(warehouseName.toLowerCase());
      if (!warehouseRecord) {
        validationErrors.push(`Row ${index + 2}: Warehouse "${warehouseName}" not found`);
        return;
      }

      const fabricCode = normalizeCellValue(normalized['fabric code']);
      if (!fabricCode) {
        validationErrors.push(`Row ${index + 2}: Sort No should not be empty`);
        return;
      }
      const fabricRecord = fabricMasterByCode.get(fabricCode.toLowerCase());
      if (!fabricRecord) {
        validationErrors.push(`Row ${index + 2}: Sort No "${fabricCode}" not found in master data`);
        return;
      }

      const pieceNo = normalizeCellValue(normalized['piece no'] ?? normalized['piece number']);
      if (!pieceNo) {
        validationErrors.push(`Row ${index + 2}: Piece No should not be empty`);
        return;
      }
      const normalizedPieceNo = pieceNo.toLowerCase();
      if (existingPieceNumbers.has(normalizedPieceNo) || parsedEntries.some(entry => entry.pieceNumber?.toLowerCase() === normalizedPieceNo)) {
        validationErrors.push(`Row ${index + 2}: Duplicate piece number "${pieceNo}"`);
        return;
      }

      const pieceMeter = parseNumericCell(normalized['piece meter']);
      if (pieceMeter === null) {
        validationErrors.push(`Row ${index + 2}: Piece Meter should not be empty`);
        return;
      }

      const netWeight = parseNumericCell(normalized['net weight'] ?? normalized['net wt']);
      if (netWeight === null) {
        validationErrors.push(`Row ${index + 2}: Net Weight should not be empty`);
        return;
      }

      if (pieceMeter <= 0 || netWeight <= 0) {
        validationErrors.push(`Row ${index + 2}: Piece Meter and Net Weight must be greater than zero`);
        return;
      }
      const remarks = normalizeCellValue(normalized['remarks']);
      if (!remarks) {
        validationErrors.push(`Row ${index + 2}: Remarks should not be empty`);
        return;
      }

      const fabricCodeValue = fabricRecord.fabricCode || fabricRecord.fabric_code || fabricCode;
      const fabricDetails = fabricRecord.fabricName
        ? `${fabricRecord.fabricCode || fabricRecord.fabric_code} - ${fabricRecord.fabricName}`
        : fabricCodeValue;

      const baseEntry: PieceEntry = {
        id: Date.now() + index + parsedEntries.length,
        pieceNumber: pieceNo,
        fabricCode: fabricCodeValue,
        fabricDetails: fabricDetails,
        fabricQuality: fabricRecord.fabricQuality || fabricRecord.quality || '',
        gstPercent: fabricRecord.gstPercent || fabricRecord.cgst || 0,
        gsm: fabricRecord.gsm || undefined,
        ppi: fabricRecord.ppi || undefined,
        pieceMeter: Number(pieceMeter),
        netWeight: Number(netWeight),
        avgWeight: calculateAvgWeight(Number(netWeight), Number(pieceMeter)),
        remarks,
        warehouseId: String(warehouseRecord.id),
        fabricId: poTypeId === PO_TYPE_KNITTED_FABRIC ? fabricRecord.id : 0,
        fabricMasterId: poTypeId === PO_TYPE_WOVEN_FABRIC ? fabricRecord.id : 0
      };

      parsedEntries.push(baseEntry);
    });

    if (validationErrors.length) {
      toast.error(validationErrors.join('\n'));
      return;
    }

    if (!parsedEntries.length) {
      toast.error('No valid rows found in the uploaded file');
      return;
    }

    const combinedEntries = [...currentItemData.pieceEntries, ...parsedEntries];
    if (!validateUniformFabricCodes(combinedEntries)) {
      toast.error('All fabric codes must be same');
      return;
    }

    const receivedQuantity = Number(currentItemData.item.quantityReceived) || 0;
    const totalQuantity = calculateTotalQuantity(combinedEntries);
    if (totalQuantity > receivedQuantity + 0.0001) {
      toast.error('Imported piece meters exceed the inward quantity.');
      return;
    }

    updateCurrentItemData({ pieceEntries: combinedEntries });
    if (!isEditMode) {
      validateQuantityTotals(combinedEntries, currentItemData.entriesDraft);
    }
    toast.success(`Imported ${parsedEntries.length} ${parsedEntries.length === 1 ? 'piece' : 'pieces'}`);
  };

  // Update current item data
  const updateCurrentItemData = (updates: Partial<ItemWithEntries>) => {
    // Validate yarn stock details if being updated
    if (isYarnType && updates.yarnStockDetails) {
      const entriesWithMismatch = updates.yarnStockDetails.filter((entry: YarnStockDetail) => {
        const acceptedQty = Number(entry.acceptedQty) || 0;
        const rejectedQty = Number(entry.rejectedQty) || 0;
        const inwardQty = Number(entry.inwardQty) || 0;
        return (acceptedQty + rejectedQty) !== inwardQty;
      });

      if (entriesWithMismatch.length > 0) {
        const firstMismatch = entriesWithMismatch[0];
        const accepted = Number(firstMismatch.acceptedQty || 0);
        const rejected = Number(firstMismatch.rejectedQty || 0);
        const total = accepted + rejected;
        const inward = Number(firstMismatch.inwardQty || 0);
        toast.warning(`Total quantity ${total.toFixed(2)} cannot exceed Inward Quantity ${inward.toFixed(2)}`);
        return;
      }
    }

    // Validate item stock details if being updated
    if (isItemType && updates.itemStockDetails) {
      const entriesWithMismatch = updates.itemStockDetails.filter((entry: ItemStockDetail) => {
        const acceptedQty = Number(entry.acceptedQty) || 0;
        const rejectedQty = Number(entry.rejectedQty) || 0;
        const inwardQty = Number(entry.inwardQty) || 0;
        return (acceptedQty + rejectedQty) !== inwardQty;
      });

      if (entriesWithMismatch.length > 0) {
        const firstMismatch = entriesWithMismatch[0];
        const accepted = Number(firstMismatch.acceptedQty || 0);
        const rejected = Number(firstMismatch.rejectedQty || 0);
        const total = accepted + rejected;
        const inward = Number(firstMismatch.inwardQty || 0);
        toast.warning(`Total quantity ${total.toFixed(2)} cannot exceed Inward Quantity ${inward.toFixed(2)}`);
        return;
      }
    }

    const currentItems = itemsWithEntriesRef.current.length ? itemsWithEntriesRef.current : itemsWithEntries;
    const newItems = [...currentItems];
    if (!newItems[currentItemIndex]) {
      return;
    }
    newItems[currentItemIndex] = { ...newItems[currentItemIndex], ...updates };
    itemsWithEntriesRef.current = newItems;
    setItemsWithEntries(newItems);
  };

  // Validate quantity totals
  const validateQuantityTotals = (entries: any[], drafts: any[]) => {
    const currentItemData = itemsWithEntries[currentItemIndex];
    if (!currentItemData) return;

    const isCurrentlyEditing = currentItemData.editingIndex !== null;
    const receivedQuantity = Number(currentItemData.item.quantityReceived) || 0;

    // Filter out entries that are already in drafts (based on ID) to avoid double counting
    const draftIds = new Set(drafts.map(d => String((d as any).id)).filter(id => id !== undefined && id !== null && id !== 'null' && id !== 'undefined'));
    const filteredEntries = entries.filter(e => !draftIds.has(String((e as any).id)));

    const totalQuantity = calculateTotalQuantity(filteredEntries);
    const totalDraftQuantity = calculateTotalDraftQuantity(drafts);
    const combinedTotal = totalQuantity + totalDraftQuantity;

    if (combinedTotal > receivedQuantity + 0.0001) {
      setQuantityWarning(`Warning: Total quantity (${combinedTotal.toFixed(2)}) exceeds Inward Quantity (${receivedQuantity.toFixed(2)})`);
      return;
    }

    if (isCurrentlyEditing || isEditMode) {
      setQuantityWarning('');
      return;
    }

    if (combinedTotal < receivedQuantity) {
      const remaining = receivedQuantity - combinedTotal;
      setQuantityWarning(`Remaining quantity to distribute: ${remaining.toFixed(2)}`);
    }
    else {
      setQuantityWarning('');
    }
  };

  const handleAddEntries = () => {
    const currentItemData = itemsWithEntries[currentItemIndex];
    if (!currentItemData) return;

    const validEntries = currentItemData.entriesDraft.filter(entry => {
      if (isYarnType || isItemType) {
        const lotEntry = entry as YarnStockDetail | ItemStockDetail;
        const acceptedQty = Number(lotEntry.acceptedQty) || 0;
        const rejectedQty = Number(lotEntry.rejectedQty) || 0;

        return (acceptedQty > 0 || rejectedQty > 0);
      } else {
        const pieceEntry = entry as PieceEntry;
        return pieceEntry.pieceMeter && Number(pieceEntry.pieceMeter) > 0 &&
          pieceEntry.fabricCode && pieceEntry.fabricDetails;
      }
    });

    if (!validEntries.length) {
      if (isYarnType || isItemType) {
        setValidationError('Please enter quantity (accepted or rejected) for at least one entry');
      } else {
        setValidationError('Please enter piece meter, fabric code, and fabric details for at least one entry');
      }
      return;
    }

    // Validate warehouse selection
    const entriesWithoutWarehouse = validEntries.filter(entry => !entry.warehouseId);
    if (entriesWithoutWarehouse.length > 0) {
      setValidationError(`Please select warehouse for all ${isYarnType || isItemType ? 'lots' : 'pieces'}`);
      return;
    }

    // Validate warehouse exists
    const invalidWarehouseEntries = validEntries.filter(entry => {
      const warehouseExists = warehouseData.some((w: any) => w.id === Number(entry.warehouseId));
      return !warehouseExists;
    });

    if (invalidWarehouseEntries.length > 0) {
      setValidationError(`Please select valid warehouse for all ${isYarnType || isItemType ? 'lots' : 'pieces'}`);
      return;
    }

    // For fabric pieces, validate fabric code is same for all pieces in the same item
    if (isFabricType) {
      const fabricCodes = validEntries.map(e => (e as PieceEntry).fabricCode?.trim()).filter(Boolean);
      const firstFabricCode = (validEntries[0] as PieceEntry).fabricCode?.trim();

      if (fabricCodes.some(code => code !== firstFabricCode)) {
        setValidationError('All fabric codes must be same');
        return;
      }
    }

    let entriesToAdd: any[];

    if (isYarnType) {
      entriesToAdd = validEntries.map((entry, index) => {
        const yarnEntry = entry as YarnStockDetail;
        const acceptedQty = Number(yarnEntry.acceptedQty) || 0;
        const rejectedQty = Number(yarnEntry.rejectedQty) || 0;
        const inwardQty = acceptedQty + rejectedQty;

        const resolvedItemId = yarnEntry.itemId
          || currentItemData.item.yarnId
          || null;
        const resolvedYarnInwardItemId = yarnEntry.orderItemId
          || currentItemData.item.orderItemId
          || currentItemData.item.id
          || null;
        const resolvedYarnId = yarnEntry.yarnId || resolvedItemId || null;

        return {
          id: currentItemData.editingIndex !== null ? currentItemData.editingIndex : Date.now() + index,
          lotNo: yarnEntry.lotNo?.trim() || '',
          inwardQty: inwardQty,
          acceptedQty: acceptedQty,
          rejectedQty: rejectedQty,
          inwardBags: Number(yarnEntry.inwardBags) || 0,
          kgsPerBag: Number(yarnEntry.kgsPerBag) || 0,
          remark: yarnEntry.remark || '',
          warehouseId: yarnEntry.warehouseId || '',
          conesPerBag: Number(yarnEntry.conesPerBag) || 0,
          conesWeight: Number(yarnEntry.conesWeight) || 0,
          itemId: resolvedItemId || null,
          uomId: yarnEntry.uomId ?? currentItemData.item.uomId ?? null,
          yarnId: resolvedYarnId,
          fabricId: yarnEntry.fabricId ?? currentItemData.item.fabricId ?? null,
          orderItemId: resolvedYarnInwardItemId,
          yarnTypeId: yarnEntry.yarnTypeId ?? currentItemData.item.yarnTypeId ?? null,
          millId: yarnEntry.millId ? Number(yarnEntry.millId) : (formData.yarnMillId ? Number(formData.yarnMillId) : (currentItemData.item.millNameId ? Number(currentItemData.item.millNameId) : null)),
        };
      });
    } else if (isItemType) {
      entriesToAdd = validEntries.map((entry, index) => {
        const itemEntry = entry as ItemStockDetail;
        const acceptedQty = Number(itemEntry.acceptedQty) || 0;
        const rejectedQty = Number(itemEntry.rejectedQty) || 0;
        const inwardQty = acceptedQty + rejectedQty;

        const resolvedItemId = itemEntry.itemId || currentItemData.item.itemId || null;
        const resolvedItemInwardItemId = itemEntry.itemInwardItemId
          || currentItemData.item.itemInwardItemId
          || currentItemData.item.id
          || null;

        return {
          id: currentItemData.editingIndex !== null ? currentItemData.editingIndex : Date.now() + index,
          lotNo: itemEntry.lotNo?.trim() || '',
          rackNo: itemEntry.rackNo?.trim() || '',
          inwardQty: inwardQty,
          acceptedQty: acceptedQty,
          rejectedQty: rejectedQty,
          inwardBags: Number(itemEntry.inwardBags) || 0,
          kgsPerBag: Number(itemEntry.kgsPerBag) || 0,
          remark: itemEntry.remark || '',
          warehouseId: itemEntry.warehouseId || '',
          itemId: resolvedItemId || null,
          uomId: itemEntry.uomId ?? currentItemData.item.uomId ?? null,
          itemInwardItemId: resolvedItemInwardItemId,
          millId: itemEntry.millId ? Number(itemEntry.millId) : (formData.yarnMillId ? Number(formData.yarnMillId) : (currentItemData.item.millNameId ? Number(currentItemData.item.millNameId) : null)),
        };
      });
    } else {
      entriesToAdd = validEntries.map((entry, index) => {
        const pieceEntry = entry as PieceEntry;
        const netWeight = Number(pieceEntry.netWeight) || 0;
        const pieceMeter = Number(pieceEntry.pieceMeter) || 0;
        let pieceNumber = pieceEntry.pieceNumber?.trim();
        // if (!pieceNumber) {
        //   pieceNumber = generatePieceNumber();
        // }

        return {
          id: currentItemData.editingIndex !== null ? currentItemData.editingIndex : Date.now() + index,
          pieceNumber,
          fabricCode: pieceEntry.fabricCode,
          fabricDetails: pieceEntry.fabricDetails,
          fabricQuality: pieceEntry.fabricQuality,
          gstPercent: pieceEntry.gstPercent,
          gsm: pieceEntry.gsm,
          ppi: pieceEntry.ppi,
          pieceMeter: pieceMeter,
          netWeight: netWeight,
          avgWeight: calculateAvgWeight(netWeight, pieceMeter),
          grossWt: pieceEntry.grossWt != null ? pieceEntry.grossWt : undefined,
          remarks: pieceEntry.remarks || '',
          warehouseId: pieceEntry.warehouseId || '',
          fabricId: pieceEntry.fabricId,
          fabricMasterId: pieceEntry.fabricMasterId
        };
      });
    }

    const updatedEntries = currentItemData.editingIndex !== null
      ? (isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries).map(existing =>
        String(existing.id) === String(currentItemData.editingIndex) ? { ...entriesToAdd[0], id: existing.id } : existing
      )
      : [...(isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries), ...entriesToAdd];

    if (isFabricType && !validateUniformFabricCodes(updatedEntries as PieceEntry[])) {
      setValidationError('All fabric codes must be same');
      return;
    }

    // For fabric, check duplicate piece numbers
    if (isFabricType) {
      const pieceNumbers = updatedEntries.map((e: PieceEntry) => e.pieceNumber).filter(Boolean);
      if (new Set(pieceNumbers).size !== pieceNumbers.length) {
        setValidationError('Duplicate piece numbers are not allowed');
        return;
      }
    }

    // Final validation - allow edit mode updates, but never allow totals to exceed inward quantity
    const receivedQuantity = Number(currentItemData.item.quantityReceived) || 0;
    const totalQuantity = calculateTotalQuantity(updatedEntries);

    if (exceedsReceivedQuantity(updatedEntries, receivedQuantity)) {
      setValidationError(`Total ${isYarnType || isItemType ? 'quantity' : 'meter'} (${totalQuantity.toFixed(2)}) cannot exceed Inward Quantity (${receivedQuantity.toFixed(2)})`);
      return;
    }

    setValidationError('');

    if (isYarnType) {
      updateCurrentItemData({
        yarnStockDetails: updatedEntries as YarnStockDetail[],
        entriesDraft: [],
        numberOfEntries: '1',
        editingIndex: null
      });
    } else if (isItemType) {
      updateCurrentItemData({
        itemStockDetails: updatedEntries as ItemStockDetail[],
        entriesDraft: [],
        numberOfEntries: '1',
        editingIndex: null
      });
    } else {
      updateCurrentItemData({
        pieceEntries: updatedEntries as PieceEntry[],
        entriesDraft: [],
        numberOfEntries: '1',
        editingIndex: null
      });
    }

    if (!isEditMode || isFabricType) {
      validateQuantityTotals(updatedEntries, []);
    }
  };

  const handleDeleteEntry = (id: number | string) => {
    const currentItemData = itemsWithEntries[currentItemIndex];

    if (isYarnType) {
      const updatedLotEntries = currentItemData.yarnStockDetails.filter(entry => String(entry.id) !== String(id));
      updateCurrentItemData({ yarnStockDetails: updatedLotEntries });
      setValidationError('');
      if (!isEditMode) {
        validateQuantityTotals(updatedLotEntries, currentItemData.entriesDraft);
      }
    } else if (isItemType) {
      const updatedItemEntries = currentItemData.itemStockDetails.filter(entry => String(entry.id) !== String(id));
      updateCurrentItemData({ itemStockDetails: updatedItemEntries });
      setValidationError('');
      if (!isEditMode) {
        validateQuantityTotals(updatedItemEntries, currentItemData.entriesDraft);
      }
    } else {
      const updatedPieceEntries = currentItemData.pieceEntries.filter(entry => String(entry.id) !== String(id));
      updateCurrentItemData({ pieceEntries: updatedPieceEntries });
      setValidationError('');
      validateQuantityTotals(updatedPieceEntries, currentItemData.entriesDraft);
    }
  };

  const handleEditEntry = (entry: any) => {
    const currentItemData = itemsWithEntries[currentItemIndex];

    if (isYarnType) {
      const lotEntry = entry as YarnStockDetail;
      updateCurrentItemData({
        editingIndex: lotEntry.id,
        entriesDraft: [{
          ...lotEntry,
          warehouseId: lotEntry.warehouseId ? String(lotEntry.warehouseId) : '',
          millId: lotEntry.millId ? String(lotEntry.millId) : (formData.yarnMillId ? String(formData.yarnMillId) : (currentItemData.item.millNameId ? String(currentItemData.item.millNameId) : '')),
          yarnTypeId: lotEntry.yarnTypeId ? String(lotEntry.yarnTypeId) : '',
        }]
      });
      const remainingLotEntries = currentItemData.yarnStockDetails.filter(e => String(e.id) !== String(lotEntry.id));
      if (!isEditMode) {
        validateQuantityTotals(remainingLotEntries, [{ ...lotEntry }]);
      }
    } else if (isItemType) {
      const itemEntry = entry as ItemStockDetail;
      updateCurrentItemData({
        editingIndex: itemEntry.id,
        entriesDraft: [{
          ...itemEntry,
          warehouseId: itemEntry.warehouseId ? String(itemEntry.warehouseId) : '',
          millId: itemEntry.millId ? String(itemEntry.millId) : (formData.yarnMillId ? String(formData.yarnMillId) : (currentItemData.item.millNameId ? String(currentItemData.item.millNameId) : '')),
        }]
      });
      const remainingItemEntries = currentItemData.itemStockDetails.filter(e => String(e.id) !== String(itemEntry.id));
      if (!isEditMode) {
        validateQuantityTotals(remainingItemEntries, [{ ...itemEntry }]);
      }
    } else {
      const pieceEntry = entry as PieceEntry;
      updateCurrentItemData({
        editingIndex: pieceEntry.id,
        entriesDraft: [{
          ...pieceEntry,
          warehouseId: pieceEntry.warehouseId ? String(pieceEntry.warehouseId) : '',
          fabricMasterId: pieceEntry.fabricMasterId || 0,
          fabricId: pieceEntry.fabricId || 0,
        }]
      });
      const remainingPieceEntries = currentItemData.pieceEntries.filter(e => String(e.id) !== String(pieceEntry.id));
      validateQuantityTotals(remainingPieceEntries, [{ ...pieceEntry }]);
    }
    setValidationError('');
    setTimeout(() => {
      draftFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleAddEntriesForm = () => {
    const currentItemData = itemsWithEntries[currentItemIndex];
    if (!currentItemData) return;

    let countVal = currentItemData.numberOfEntries;
    if (!countVal || countVal === '0') {
      countVal = '1';
    }
    const count = parseInt(countVal, 10);
    if (isNaN(count) || count <= 0) {
      setValidationError(`Please enter a valid number of ${isYarnType || isItemType ? 'lots' : 'pieces'}`);
      return;
    }

    const poTypeId = currentItemData.item.poTypeId;
    const firstDraft = currentItemData.entriesDraft[0] as PieceEntry | undefined;
    const firstPiece = currentItemData.pieceEntries[0];

    // Get default fabric ID (can be either fabricId or fabricMasterId depending on PO type)
    let defaultFabricId = 0;
    if (poTypeId === PO_TYPE_KNITTED_FABRIC) {
      defaultFabricId = firstPiece?.fabricId || firstDraft?.fabricId || currentItemData.item.fabricId || 0;
    } else if (poTypeId === PO_TYPE_WOVEN_FABRIC) {
      defaultFabricId = firstPiece?.fabricMasterId || firstDraft?.fabricMasterId || currentItemData.item.fabricMasterId || 0;
    }

    const newDrafts = Array.from({ length: count }, (_, index) => {
      if (isYarnType) {
        return {
          id: currentItemData.entriesDraft.length + index + 1,
          lotNo: '',
          inwardQty: 0,
          acceptedQty: 0,
          rejectedQty: 0,
          inwardBags: undefined,
          kgsPerBag: undefined,
          conesPerBag: undefined,
          conesWeight: undefined,
          remark: '',
          warehouseId: defaultWarehouseId,
          yarnTypeId: currentItemData.item.yarnTypeId || null,
          millId: formData.yarnMillId ? String(formData.yarnMillId) : (currentItemData.item.millNameId ? String(currentItemData.item.millNameId) : null)
        };
      } else if (isItemType) {
        return {
          id: currentItemData.entriesDraft.length + index + 1,
          lotNo: '',
          rackNo: '',
          inwardQty: 0,
          acceptedQty: 0,
          rejectedQty: 0,
          inwardBags: undefined,
          kgsPerBag: undefined,
          conesPerBag: undefined,
          conesWeight: undefined,
          remark: '',
          warehouseId: defaultWarehouseId,
          millId: formData.yarnMillId ? String(formData.yarnMillId) : (currentItemData.item.millNameId ? String(currentItemData.item.millNameId) : null)
        };
      } else {
        // For fabric pieces, get default values and auto-populate fabric details
        const basePieceEntry: Partial<PieceEntry> = {
          id: currentItemData.entriesDraft.length + index + 1,
          pieceNumber: '',
          pieceMeter: 0,
          netWeight: 0,
          avgWeight: 0,
          remarks: '',
          warehouseId: defaultWarehouseId
        };

        // If there's a default fabric ID, populate all fabric details automatically
        if (defaultFabricId > 0) {
          const fabricDetails = populateFabricDetailsFromMaster(defaultFabricId);
          return { ...basePieceEntry, ...fabricDetails };
        }

        // Otherwise use defaults from previous entries
        const defaultFabricCode = firstPiece?.fabricCode || firstDraft?.fabricCode || currentItemData.item.productName || '';
        const defaultFabricDetails = firstPiece?.fabricDetails || firstDraft?.fabricDetails || '';

        return {
          ...basePieceEntry,
          fabricCode: defaultFabricCode,
          fabricDetails: defaultFabricDetails,
          fabricQuality: firstPiece?.fabricQuality || firstDraft?.fabricQuality || '',
          gstPercent: firstPiece?.gstPercent || firstDraft?.gstPercent,
          gsm: firstPiece?.gsm || firstDraft?.gsm,
          ppi: firstPiece?.ppi || firstDraft?.ppi,
          fabricId: (poTypeId === PO_TYPE_KNITTED_FABRIC) ? (firstPiece?.fabricId || firstDraft?.fabricId || currentItemData.item.fabricId || 0) : 0,
          fabricMasterId: (poTypeId === PO_TYPE_WOVEN_FABRIC) ? (firstPiece?.fabricMasterId || firstDraft?.fabricMasterId || currentItemData.item.fabricMasterId || 0) : 0
        };
      }
    });

    const updatedDrafts = [...currentItemData.entriesDraft, ...newDrafts];
    updateCurrentItemData({ entriesDraft: updatedDrafts });
    if (!isEditMode || isFabricType) {
      validateQuantityTotals(
        isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries,
        updatedDrafts
      );
    }
  };
  const updateDraftEntry = (index: number, key: string, value: any) => {
    const currentItemData = itemsWithEntries[currentItemIndex];
    const updatedDrafts = [...currentItemData.entriesDraft];

    if (isFabricType && (key === 'netWeight' || key === 'pieceMeter')) {
      const draft = { ...updatedDrafts[index] } as Partial<PieceEntry>;
      if (key === 'netWeight') {
        draft.netWeight = value;
      } else if (key === 'pieceMeter') {
        draft.pieceMeter = value;
      }

      const netWeight = Number(draft.netWeight) || 0;
      const pieceMeter = Number(draft.pieceMeter) || 0;
      draft.avgWeight = calculateAvgWeight(netWeight, pieceMeter);
      updatedDrafts[index] = draft;
    } else if (isFabricType && key === 'pieceNumber' && value) {
      const trimmed = value.trim();
      if (trimmed) {
        const editingId = currentItemData.editingIndex;
        const currentPieceNumbers = new Set([
          ...(isYarnType ? currentItemData.yarnStockDetails : currentItemData.pieceEntries).map((e: any) => e.pieceNumber).filter(Boolean),
          ...updatedDrafts.filter((_, i) => i !== index).map((d: any) => (d as PieceEntry).pieceNumber).filter(Boolean)
        ]);
        if (currentPieceNumbers.has(trimmed)) {
          setValidationError(`Piece number ${trimmed} already exists`);
          return;
        } else {
          setValidationError('');
        }
      }
      const draft = { ...updatedDrafts[index] } as any;
      draft[key] = value;
      updatedDrafts[index] = draft;
    } else if (isYarnType && (key === 'inwardBags' || key === 'kgsPerBag' || key === 'conesPerBag')) {
      const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
      if (key === 'inwardBags') draft.inwardBags = value === '' ? undefined : Number(value);
      if (key === 'kgsPerBag') draft.kgsPerBag = value === '' ? undefined : Number(value);
      if (key === 'conesPerBag') draft.conesPerBag = value === '' ? undefined : Number(value);

      const bags = Number(draft.inwardBags ?? 0);
      const kpb = Number(draft.kgsPerBag ?? 0);
      const cones = Number(draft.conesPerBag ?? 0);
      const calculatedQty = bags * kpb;

      if ((key === 'inwardBags' || key === 'kgsPerBag') && calculatedQty > 0) {
        draft.acceptedQty = calculatedQty;
        draft.inwardQty = calculatedQty + (Number(draft.rejectedQty) || 0);
      }

      draft.conesWeight = cones > 0 && kpb > 0 ? Number((kpb / cones).toFixed(3)) : 0;

      updatedDrafts[index] = draft as any;
    } else if (isItemType && (key === 'inwardBags' || key === 'kgsPerBag' || key === 'uomId' || key === 'conesPerBag')) {
      const draft = { ...updatedDrafts[index] } as Partial<ItemStockDetail>;
      if (key === 'inwardBags') draft.inwardBags = value === '' ? undefined : Number(value);
      if (key === 'kgsPerBag') draft.kgsPerBag = value === '' ? undefined : Number(value);
      if (key === 'uomId') draft.uomId = value ? Number(value) : null;
      if (key === 'conesPerBag') draft.conesPerBag = value === '' ? undefined : Number(value);

      const bags = Number(draft.inwardBags ?? 0);
      const kpb = Number(draft.kgsPerBag ?? 0);
      const cones = Number(draft.conesPerBag ?? 0);
      const calculatedQty = bags * kpb;

      if ((key === 'inwardBags' || key === 'kgsPerBag') && calculatedQty > 0) {
        draft.acceptedQty = calculatedQty;
        draft.inwardQty = calculatedQty + (Number(draft.rejectedQty) || 0);
      }

      draft.conesWeight = cones > 0 && kpb > 0 ? Number((kpb / cones).toFixed(3)) : 0;

      updatedDrafts[index] = draft as any;
    } else if (isYarnType && (key === 'acceptedQty' || key === 'rejectedQty')) {
      const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
      draft[key as keyof YarnStockDetail] = value;

      const acceptedQty = Number(draft.acceptedQty) || 0;
      const rejectedQty = Number(draft.rejectedQty) || 0;
      draft.inwardQty = acceptedQty + rejectedQty;

      updatedDrafts[index] = draft;
    } else if (isYarnType && key === 'inwardQty') {
      const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
      draft.inwardQty = Number(value) || 0;

      const inwardQty = Number(draft.inwardQty) || 0;
      const rejectedQty = Number(draft.rejectedQty) || 0;
      draft.acceptedQty = Math.max(0, inwardQty - rejectedQty);

      updatedDrafts[index] = draft;
    } else {
      const draft = { ...updatedDrafts[index] } as any;
      draft[key] = value;
      updatedDrafts[index] = draft;
    }

    updateCurrentItemData({ entriesDraft: updatedDrafts });
    if (!isEditMode || isFabricType) {
      validateQuantityTotals(
        isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries,
        updatedDrafts
      );
    }
  };

  const handleRemoveDraftEntry = (index: number) => {
    const currentItemData = itemsWithEntries[currentItemIndex];
    if (!currentItemData) return;

    const updatedDrafts = currentItemData.entriesDraft.filter((_, i) => i !== index);
    const updates: Partial<ItemWithEntries> = { entriesDraft: updatedDrafts };

    if (updatedDrafts.length === 0) {
      updates.numberOfEntries = '0';
      updates.editingIndex = null;
    }

    updateCurrentItemData(updates);
    setValidationError('');
    if (!isEditMode || isFabricType) {
      const existingEntries = isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries;
      validateQuantityTotals(existingEntries, updatedDrafts);
    } else {
      setQuantityWarning('');
    }
  };

  const handleCancelDrafts = () => {
    const currentItemData = itemsWithEntries[currentItemIndex];
    if (!currentItemData || currentItemData.entriesDraft.length === 0) return;

    updateCurrentItemData({
      entriesDraft: [],
      numberOfEntries: '0',
      editingIndex: null
    });
    setValidationError('');
    setQuantityWarning('');
    if (!isEditMode) {
      const existingEntries = isYarnType ? currentItemData.yarnStockDetails : currentItemData.pieceEntries;
      validateQuantityTotals(existingEntries, []);
    }
  };

  // const updateDraftEntry = (index: number, key: string, value: any) => {
  //   const currentItemData = itemsWithEntries[currentItemIndex];
  //   const updatedDrafts = [...currentItemData.entriesDraft];

  //   if (isFabricType && (key === 'netWeight' || key === 'pieceMeter')) {
  //     const draft = { ...updatedDrafts[index] } as Partial<PieceEntry>;
  //     if (key === 'netWeight') {
  //       draft.netWeight = value;
  //     } else if (key === 'pieceMeter') {
  //       draft.pieceMeter = value;
  //     }

  //     // Auto-calculate average weight
  //     const netWeight = Number(draft.netWeight) || 0;
  //     const pieceMeter = Number(draft.pieceMeter) || 0;
  //     draft.avgWeight = calculateAvgWeight(netWeight, pieceMeter);
  //     updatedDrafts[index] = draft;
  //   } else if (isFabricType && key === 'pieceNumber' && value) {
  //     const trimmed = value.trim();
  //     if (trimmed) {
  //       // Check for duplicates
  //       const editingId = currentItemData.editingIndex;
  //       const currentPieceNumbers = new Set([
  //         ...(isYarnType ? currentItemData.yarnStockDetails : currentItemData.pieceEntries).map((e: any) => e.pieceNumber).filter(Boolean),
  //         ...updatedDrafts.filter((_, i) => i !== index).map((d: any) => (d as PieceEntry).pieceNumber).filter(Boolean)
  //       ]);
  //       if (currentPieceNumbers.has(trimmed)) {
  //         setValidationError(`Piece number ${trimmed} already exists`);
  //         return;
  //       } else {
  //         setValidationError('');
  //       }
  //     }
  //     const draft = { ...updatedDrafts[index] } as any;
  //     draft[key] = value;
  //     updatedDrafts[index] = draft;
  //   } else if (isYarnType && (key === 'acceptedQty' || key === 'rejectedQty')) {
  //     const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
  //     draft[key as keyof YarnStockDetail] = value;

  //     // Calculate inward quantity as sum of accepted + rejected
  //     const acceptedQty = Number(draft.acceptedQty) || 0;
  //     const rejectedQty = Number(draft.rejectedQty) || 0;
  //     draft.inwardQty = acceptedQty + rejectedQty;

  //     updatedDrafts[index] = draft;
  //   } else if (isYarnType && key === 'inwardQty') {
  //     const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
  //     draft.inwardQty = Number(value) || 0;

  //     // When inwardQty is changed, keep rejectedQty as is and adjust acceptedQty
  //     const inwardQty = Number(draft.inwardQty) || 0;
  //     const rejectedQty = Number(draft.rejectedQty) || 0;
  //     draft.acceptedQty = Math.max(0, inwardQty - rejectedQty);

  //     updatedDrafts[index] = draft;
  //   } else if (isYarnType && ['csp', 'strength', 'count', 'cvCountPercent', 'cvStrengthPercent'].includes(key)) {
  //     const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
  //     const numValue = value === '' ? undefined : Number(value);
  //     (draft as any)[key] = numValue;
  //     updatedDrafts[index] = draft;
  //   } else if (isYarnType && key === 'yarnCsp') {
  //     const draft = { ...updatedDrafts[index] } as Partial<YarnStockDetail>;
  //     draft.yarnCsp = value || undefined;
  //     updatedDrafts[index] = draft;
  //   } else {
  //     const draft = { ...updatedDrafts[index] } as any;
  //     draft[key] = value;
  //     updatedDrafts[index] = draft;
  //   }

  //   updateCurrentItemData({ entriesDraft: updatedDrafts });
  //   if (!isEditMode) {
  //     validateQuantityTotals(
  //       isYarnType ? currentItemData.yarnStockDetails : currentItemData.pieceEntries,
  //       updatedDrafts
  //     );
  //   }
  // };

  // In your save/update handler - add this after successful update
// const handleUpdateSuccess = async (response: any) => {
//   try {
//     // Process and reload the updated data
//     const updatedItems = reloadDataAfterUpdate(response);
    
//     if (!updatedItems || updatedItems.length === 0) {
//       toast.warning('Update successful but data could not be refreshed. Please reload the page.');
//       return;
//     }

//     // Update formData with new inward ID if needed
//     if (response?.id && !formData.id) {
//       // For new creates, set the ID
//       formData.id = response.id;
//     }

//     toast.success('Purchase Inward updated successfully!');
    
//     // Optional: Navigate back or refresh
//     // navigate(-1);
//   } catch (error) {
//     console.error('Error processing update response:', error);
//     toast.error('Update successful but data refresh failed. Please reload the page.');
//   }
// };

// Validate that inwardId is present in all records
// const validateInwardDataIntegrity = (itemsWithEntries: ItemWithEntries[]) => {
//   const issues: string[] = [];

//   itemsWithEntries.forEach((itemEntry, idx) => {
//     itemEntry.yarnStockDetails.forEach((lot, lotIdx) => {
//       if (!lot.inwardId) {
//         issues.push(`Item ${idx + 1}, Yarn Lot ${lotIdx + 1}: Missing inwardId`);
//       }
//       if (!lot.id) {
//         issues.push(`Item ${idx + 1}, Yarn Lot ${lotIdx + 1}: Missing lot ID`);
//       }
//     });

//     itemEntry.itemStockDetails.forEach((detail, detailIdx) => {
//       if (!detail.inwardId) {
//         issues.push(`Item ${idx + 1}, Stock Detail ${detailIdx + 1}: Missing inwardId`);
//       }
//     });
//   });

//   if (issues.length > 0) {
//     console.warn('Data Integrity Issues:', issues);
//     toast.warning(`Data integrity warning: ${issues.length} issue(s) found`);
//     return false;
//   }
//   return true;
// };


  const handleSave = async () => {
    const latestItemsWithEntries = itemsWithEntriesRef.current.length ? itemsWithEntriesRef.current : itemsWithEntries;

    // Helper functions for amount calculations
    const getGSTPercent = (item: any) => {
      return item.gstPercent ? parseFloat(item.gstPercent) : 0;
    };

    const calculateTotalAmount = (quantityReceived: number, pricePerUnit: number) => {
      return (quantityReceived || 0) * (pricePerUnit || 0);
    };

    const calculateGSTAmount = (totalAmount: number, gstPercent: number) => {
      return (totalAmount * gstPercent) / 100;
    };

    const calculateFinalAmount = (totalAmount: number, gstAmount: number) => {
      return totalAmount + gstAmount;
    };

    // Validate all items
    for (let i = 0; i < latestItemsWithEntries.length; i++) {
      const itemData = latestItemsWithEntries[i];
      const entries = isYarnType ? itemData.yarnStockDetails : isItemType ? itemData.itemStockDetails : itemData.pieceEntries;
      const totalQuantity = calculateTotalQuantity(entries);
      const receivedQuantity = Number(itemData.item.quantityReceived) || 0;

      if (exceedsReceivedQuantity(entries, receivedQuantity)) {
        setValidationError(
          `Item "${itemData.item.productName}": Total ${isYarnType || isItemType ? 'quantity' : 'meter'} (${totalQuantity.toFixed(2)}) cannot exceed Inward Quantity (${receivedQuantity.toFixed(2)})`
        );
        setCurrentItemIndex(i);
        return;
      }

      if (totalQuantity < receivedQuantity - 0.0001) {
        const remaining = receivedQuantity - totalQuantity;
        setValidationError(
          `Item "${itemData.item.productName}": You have remaining quantity ${remaining.toFixed(2)}. Cant save until you add entries for the full received quantity (${receivedQuantity.toFixed(2)})`
        );
        setCurrentItemIndex(i);
        return;
      }

      if (!isEditMode && totalQuantity !== receivedQuantity) {
        setValidationError(
          `Item "${itemData.item.productName}": Total quantity (${totalQuantity.toFixed(2)}) must equal Inward Quantity (${receivedQuantity.toFixed(2)})`
        );
        setCurrentItemIndex(i);
        return;
      }

      if (entries.length === 0) {
        setValidationError(`Item "${itemData.item.productName}": Please add at least one ${isYarnType || isItemType ? 'lot' : 'piece'} entry`);
        setCurrentItemIndex(i);
        return;
      }

      if (isYarnType || isItemType) {
        const mismatchEntry = (entries as (YarnStockDetail | ItemStockDetail)[]).find(entry =>
          (Number(entry.acceptedQty || 0) + Number(entry.rejectedQty || 0)) !== Number(entry.inwardQty || 0)
        );
        if (mismatchEntry) {
          const accepted = Number(mismatchEntry.acceptedQty || 0);
          const rejected = Number(mismatchEntry.rejectedQty || 0);
          const total = accepted + rejected;
          const inward = Number(mismatchEntry.inwardQty || 0);
          const message = `Item "${itemData.item.productName}": Lot No "${mismatchEntry.lotNo}" - Total quantity (${total.toFixed(2)}) must match Inward Quantity (${inward.toFixed(2)})`;
          setValidationError(message);
          toast.error(message);
          setCurrentItemIndex(i);
          return;
        }
      }

      if (isFabricType && !validateUniformFabricCodes(entries as PieceEntry[])) {
        setValidationError('All fabric codes must be same');
        setCurrentItemIndex(i);
        return;
      }

      if (isFabricType) {
        const duplicatePieceNo = findDuplicateText(entries as PieceEntry[], (entry) => entry.pieceNumber || null);
        if (duplicatePieceNo) {
          setValidationError(`Item "${itemData.item.productName}": This Piece No already exists (${duplicatePieceNo})`);
          setCurrentItemIndex(i);
          return;
        }
      }

      if (isItemType) {
        const duplicateItemName = findDuplicateText(entries as any[], (entry) => entry.itemName || null);
        if (duplicateItemName) {
          setValidationError(`Item "${itemData.item.productName}": This Item Name already exists (${duplicateItemName})`);
          setCurrentItemIndex(i);
          return;
        }
      }

      // Validate warehouses
      const entriesWithoutWarehouse = entries.filter(entry => !entry.warehouseId);
      if (entriesWithoutWarehouse.length > 0) {
        setValidationError(`Item "${itemData.item.productName}": Please select warehouse for all ${isYarnType || isItemType ? 'lots' : 'pieces'}`);
        setCurrentItemIndex(i);
        return;
      }

      // For fabric, validate fabric details
      if (isFabricType) {
        const entriesWithoutFabricDetails = (entries as PieceEntry[]).filter((entry) => !entry.fabricDetails);
        if (entriesWithoutFabricDetails.length > 0) {
          setValidationError(`Item "${itemData.item.productName}": Please provide fabric details for all pieces`);
          setCurrentItemIndex(i);
          return;
        }
      }
    }

     isSavingRef.current = true;
      let purchaseInwardNoToUse = isEditMode
            ? (formData.purchaseInwardNo || purchaseInwardNumber)
            : purchaseInwardNumber;

          if (!purchaseInwardNoToUse) {
            try {
              const docResponse = await documentNumberService.generateDocumentNumber({
                screenName: 'Purchase Inward'
              });
              purchaseInwardNoToUse = docResponse.documentNumber;
              setPurchaseInwardNumber(purchaseInwardNoToUse);
            } catch (error) {
              console.warn('Failed to generate purchase inward number:', error);
            }
          }

          // if (purchaseInwardNoToUse) {
          //   alert('Purchase Inward Number: ' + purchaseInwardNoToUse);
          // }
    //     let purchaseInwardNo = '';
    // try {
    //   const docResponse = await documentNumberService.generateDocumentNumber({
    //     screenName: 'Purchase Inward'
    //   });
    //   purchaseInwardNo = docResponse.documentNumber;
    //   alert('Generated Purchase Inward Number: ' + purchaseInwardNo);
    // } catch (error) {
    //   console.warn('Failed to generate purchase inward number:', error);
    // }

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');

    // Build payload (include DC number & date if provided)
    const payload = {
      id: isEditMode ? formData.id : 0,
      poTypeId: latestItemsWithEntries[0].item.poTypeId,
      vendorId: latestItemsWithEntries[0].item.vendorId,
      fabricTypeId: latestItemsWithEntries[0].item.fabricTypeId || 0,
      inwardDate: formData.inwardDate || new Date().toISOString().split('T')[0],
      remarks: formData.remark || formData.remarks || '',
      activeFlag: true,
      purchaseOrderId: latestItemsWithEntries[0].item.poId,
      purchaseInwardNo: isEditMode ? (formData.purchaseInwardNo || purchaseInwardNoToUse) : purchaseInwardNoToUse,
      companyId: storedCompanyId ? parseInt(storedCompanyId) : null,
      yarnMillId: formData.yarnMillId ? parseInt(formData.yarnMillId) : null,
      // Include DC fields coming from the parent form (if available)
      dcNumber: formData.dcNumber || null,
      dcDate: formData.dcDate || null,
      millInvNo: formData.millInvNo || null,
      millDate: formData.millDate || null,
      icilInvNo: formData.icilInvNo || null,
      icilInvDate: formData.icilInvDate || null,
      
      purchaseInwardItemsDtl: latestItemsWithEntries.map((itemData, index) => {
        // Get the original item ID from formData if in edit mode
        const originalItemsList = formData.purchaseInwardItemsDtl || [];
        const originalItem = originalItemsList.find(
          (orig: any) => 
            (orig.poItemId && itemData.item.id && String(orig.poItemId) === String(itemData.item.id)) ||
            (orig.purchaseOrderItemId && itemData.item.id && String(orig.purchaseOrderItemId) === String(itemData.item.id)) ||
            (orig.id && itemData.item.inwardItemId && String(orig.id) === String(itemData.item.inwardItemId))
        ) || originalItemsList[index];

        const itemId = isEditMode ? (itemData.item.inwardItemId || itemData.item.purchaseInwardItemId || originalItem?.id || 0) : 0;

        if (isYarnType) {
          return {
            id: itemId,
            inwardId: isEditMode ? (originalItem?.inwardId || 0) : 0,
            poItemId: itemData.item.id,
            quantityReceived: itemData.item.quantityReceived,
            price: itemData.item.price,
            millNameId: Number(itemData.item.millNameId) || (formData.yarnMillId ? Number(formData.yarnMillId) : null),
            activeFlag: true,
            yarnTypeId: itemData.item.yarnTypeId ? Number(itemData.item.yarnTypeId) : null,
            remarks: itemData.item.remarks || '',
            // Calculate amounts dynamically
            totalAmount: calculateTotalAmount(
              parseFloat(itemData.item.quantityReceived || 0),
              parseFloat(itemData.item.price || 0)
            ),
            gstAmount: calculateGSTAmount(
              calculateTotalAmount(
                parseFloat(itemData.item.quantityReceived || 0),
                parseFloat(itemData.item.price || 0)
              ),
              getGSTPercent(itemData.item)
            ),
            finalAmount: calculateFinalAmount(
              calculateTotalAmount(
                parseFloat(itemData.item.quantityReceived || 0),
                parseFloat(itemData.item.price || 0)
              ),
              calculateGSTAmount(
                calculateTotalAmount(
                  parseFloat(itemData.item.quantityReceived || 0),
                  parseFloat(itemData.item.price || 0)
                ),
                getGSTPercent(itemData.item)
              )
            ),
            balanceQty: itemData.item.balanceQty ?? null,
            noOfLots: itemData.yarnStockDetails.length,
            yarnStockDetails: itemData.yarnStockDetails.map(entry => {
              const resolvedItemId = entry.itemId
                || itemData.item.yarnId
                || null;
              const resolvedYarnInwardItemId = entry.orderItemId
                || itemData.item.orderItemId
                || itemData.item.id
                || null;
              const resolvedYarnId = entry.yarnId || resolvedItemId || null;

              const acceptedQty = Number(entry.acceptedQty) || 0;
              const rejectedQty = Number(entry.rejectedQty) || 0;
              const inwardQty = acceptedQty + rejectedQty;

              return {
                id: typeof entry.id === 'number' && entry.id > 0 && entry.id < 1000000000000 ? entry.id : 0,
                itemId: resolvedItemId || null,
                orderItemId: resolvedYarnInwardItemId,
                yarnId: resolvedYarnId,
                uomId: entry.uomId ?? itemData.item.uomId ?? null,
                lotNo: entry.lotNo || '',
                inwardQty: inwardQty,
                inwardBags: Number(entry.inwardBags) || 0,
                kgsPerBag: Number(entry.kgsPerBag) || 0,
                conesPerBag: Number(entry.conesPerBag) || 0,
                conesWeight: Number(entry.conesWeight) || 0,
                acceptedQty: acceptedQty,
                rejectedQty: rejectedQty,
                warehouseId: Number(entry.warehouseId) || 0,
                remark: entry.remark || '',
                yarnTypeId: entry.yarnTypeId ? Number(entry.yarnTypeId) : (itemData.item.yarnTypeId ? Number(itemData.item.yarnTypeId) : null),
                millId: entry.millId ? Number(entry.millId) : (formData.yarnMillId ? Number(formData.yarnMillId) : (itemData.item.millNameId ? Number(itemData.item.millNameId) : null))
              };
            })
          };
        } else if (isItemType) {
          return {
            id: itemId,
            inwardId: isEditMode ? (originalItem?.inwardId || 0) : 0,
            poItemId: itemData.item.id,
            quantityReceived: itemData.item.quantityReceived,
            price: itemData.item.price,
            millNameId: Number(itemData.item.millNameId) || null,
            activeFlag: true,
            remarks: itemData.item.remarks || '',
            // Calculate amounts dynamically
            totalAmount: calculateTotalAmount(
              parseFloat(itemData.item.quantityReceived || 0),
              parseFloat(itemData.item.price || 0)
            ),
            gstAmount: calculateGSTAmount(
              calculateTotalAmount(
                parseFloat(itemData.item.quantityReceived || 0),
                parseFloat(itemData.item.price || 0)
              ),
              getGSTPercent(itemData.item)
            ),
            finalAmount: calculateFinalAmount(
              calculateTotalAmount(
                parseFloat(itemData.item.quantityReceived || 0),
                parseFloat(itemData.item.price || 0)
              ),
              calculateGSTAmount(
                calculateTotalAmount(
                  parseFloat(itemData.item.quantityReceived || 0),
                  parseFloat(itemData.item.price || 0)
                ),
                getGSTPercent(itemData.item)
              )
            ),
            balanceQty: itemData.item.balanceQty ?? null,
            noOfLots: itemData.itemStockDetails.length,
            itemStockDetails: itemData.itemStockDetails.map(entry => {
              const resolvedItemId = entry.itemId || itemData.item.itemId || null;
              const resolvedItemInwardItemId = entry.itemInwardItemId
                || itemData.item.itemInwardItemId
                || itemData.item.id
                || null;

              const acceptedQty = Number(entry.acceptedQty) || 0;
              const rejectedQty = Number(entry.rejectedQty) || 0;
              const inwardQty = acceptedQty + rejectedQty;

              return {
                id: typeof entry.id === 'number' && entry.id > 0 && entry.id < 1000000000000 ? entry.id : 0,
                itemId: resolvedItemId || null,
                itemInwardItemId: resolvedItemInwardItemId,
                uomId: entry.uomId ?? itemData.item.uomId ?? null,
                lotNo: entry.lotNo || '',
                rackNo: entry.rackNo || '',
                inwardQty: inwardQty,
                inwardBags: Number(entry.inwardBags) || 0,
                kgsPerBag: Number(entry.kgsPerBag) || 0,
                conesPerBag: Number(entry.conesPerBag) || 0,
                conesWeight: Number(entry.conesWeight) || 0,
                acceptedQty: acceptedQty,
                rejectedQty: rejectedQty,
                warehouseId: Number(entry.warehouseId) || 0,
                remark: entry.remark || '',
                millId: entry.millId ? Number(entry.millId) : (formData.yarnMillId ? Number(formData.yarnMillId) : (itemData.item.millNameId ? Number(itemData.item.millNameId) : null))
              };
            })
          };
       
        } else {
          return {
            id: itemId,
            inwardId: isEditMode ? (originalItem?.inwardId || 0) : 0,
            poItemId: itemData.item.id,
            quantityReceived: itemData.item.quantityReceived,
            price: itemData.item.price,
            millNameId: Number(itemData.item.millNameId) || null,
            activeFlag: true,
            remarks: itemData.item.remarks || '',
            // Calculate amounts dynamically
            totalAmount: calculateTotalAmount(
              parseFloat(itemData.item.quantityReceived || 0),
              parseFloat(itemData.item.price || 0)
            ),
            gstAmount: calculateGSTAmount(
              calculateTotalAmount(
                parseFloat(itemData.item.quantityReceived || 0),
                parseFloat(itemData.item.price || 0)
              ),
              getGSTPercent(itemData.item)
            ),
            finalAmount: calculateFinalAmount(
              calculateTotalAmount(
                parseFloat(itemData.item.quantityReceived || 0),
                parseFloat(itemData.item.price || 0)
              ),
              calculateGSTAmount(
                calculateTotalAmount(
                  parseFloat(itemData.item.quantityReceived || 0),
                  parseFloat(itemData.item.price || 0)
                ),
                getGSTPercent(itemData.item)
              )
            ),
            balanceQty: itemData.item.balanceQty ?? null,
            noOfPiece: itemData.pieceEntries.length,
            pieceEntries: itemData.pieceEntries.map(entry => ({
              id: typeof entry.id === 'number' && entry.id > 0 && entry.id < 1000000000000 ? entry.id : 0,
              pieceNumber: entry.pieceNumber,
              fabricCode: entry.fabricCode,
              fabricDetails: entry.fabricDetails,
              fabricQuality: entry.fabricQuality,
              gstPercent: entry.gstPercent,
              gsm: entry.gsm,
              ppi: entry.ppi,
              quantity: entry.pieceMeter,
              weight: entry.netWeight,
              cost: itemData.item.price * entry.pieceMeter,
              remarks: entry.remarks,
              grossWt: entry.grossWt ?? null,
              warehouseId: Number(entry.warehouseId),
              fabricId: entry.fabricId,
              fabricMasterId: entry.fabricMasterId,
              activeFlag: true
            }))
          };
        }
      })
    };

    console.log('Saving payload:', payload);
    console.log('DEBUG fabricTypeId:', {
      fromItem: latestItemsWithEntries[0].item.fabricTypeId,
      selectedItems: selectedItems[0]?.fabricTypeId,
      payload: payload.fabricTypeId
    });

    try {
       let result;
        // alert(JSON.stringify(payload));
           console.log(payload);
      if (isEditMode) {
        await dispatch(updatePurchaseInward(payload)).unwrap();
      } else {
        await dispatch(createPurchaseInward(payload)).unwrap();
            const sequencePart = purchaseInwardNoToUse.split('/').pop() || purchaseInwardNoToUse;
                documentNumberService.updateMemoryCache('Purchase Inward', sequencePart);
      }
      
      toast.success(`Purchase Inward / GRN ${isEditMode ? 'updated' : 'created'} successfully!`);

      const hasBalanceZero = latestItemsWithEntries.some(
        (itemData) => itemData.item.balanceQty != null && Number(itemData.item.balanceQty) <= 0
      );
      if (hasBalanceZero) {
        const poNo = formData.poNumber || formData.poNo || '';
        toast.info(`You have received all quantities for this purchase order${poNo ? ' ' + poNo : ''}.`);
      }

      setValidationError('');
      
      // Check if user came from Order Entry Management and redirect accordingly
      if (fromOrderEntry) {
        navigate('/transaction/order-entry-management', {
          state: {
            source: 'order-entry-management',
            refreshData: true,
            expandedRowId,
            activeTab,
            salesOrderId: location.state?.salesOrderId,
            flowType: location.state?.flowType,
            selectedHyperlink: location.state?.selectedHyperlink
          }
        });
      } else {
        navigate('/transaction/purchase-inward-details');
      }
    } 
catch (error: any) {
    console.error('Failed to save purchase inward:', error);
    let errorMessage = 'Failed to save purchase inward. Please try again.';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    if (errorMessage.includes('Duplicate Lot Number') || errorMessage.includes('duplicate')) {
      setValidationError(errorMessage);
      toast.error(errorMessage);
      return;
    }

   
    
    setValidationError(errorMessage);
    // toast.error(errorMessage);
  }
  };

  if (!selectedItems || selectedItems.length === 0) {
    return null;
  }

  const currentItemData = itemsWithEntries[currentItemIndex];
  if (!currentItemData) {
    return null;
  }

  const selectedItem = currentItemData.item;
  const entries = isYarnType ? currentItemData.yarnStockDetails : isItemType ? currentItemData.itemStockDetails : currentItemData.pieceEntries;
  const entriesDraft = currentItemData.entriesDraft;
  const numberOfEntries = currentItemData.numberOfEntries;
  const editingIndex = currentItemData.editingIndex;

  // Filter out the entry currently being edited from existing entries to avoid double counting
  const nonEditingEntries = entries.filter(e => e.id !== editingIndex);
  const totalQuantity = calculateTotalQuantity(nonEditingEntries);
  const totalDraftQuantity = calculateTotalDraftQuantity(entriesDraft);
  
  const inwardQuantity = isItemType
    ? (Number(selectedItem.quantityReceived) || Number(selectedItem.quantity) || Number(selectedItem.quantityOrdered) || 0)
    : (Number(selectedItem.quantityReceived) || 0);
  const distributedQty = Number(selectedItem.distributedQty) || 0;
  
  // For fabric: distributedQty from backend + currently added pieces in this screen
  // For others: total from already added lots (excluding the one being edited) + current drafts
  const totalDistributed = isFabricType 
    ? (distributedQty + totalQuantity + totalDraftQuantity)
    : (totalQuantity + totalDraftQuantity);

  const remainingQuantity = inwardQuantity - totalDistributed;

  const poTypeId = selectedItem.poTypeId;

  const hasNoEntries = itemsWithEntries.some(itemData => {
    const itemEntries = isYarnType 
      ? itemData.yarnStockDetails 
      : isItemType 
        ? itemData.itemStockDetails 
        : itemData.pieceEntries;
    return !itemEntries || itemEntries.length === 0;
  });

  return (
    <div className={props?.embedded ? 'mt-6' : 'p-6 bg-white shadow-md rounded-lg'}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xls,.xlsx"
        onChange={handleFileUpload}
      />
      <div className="flex justify-between items-center border-b pb-4 mt-2">
        <div className="flex items-center space-x-4">
          {!props?.embedded && (
            <Button
              variant="outline"
              onClick={() => {
                const updatedItems = itemsWithEntries.map(itemData => ({
                  ...itemData.item,
                  yarnStockDetails: itemData.yarnStockDetails,
                  pieceEntries: itemData.pieceEntries,
                  itemStockDetails: itemData.itemStockDetails
                }));
                navigate('/transaction/purchase-inward', {
                  state: {
                    updatedSelectedItems: updatedItems,
                    updatedFromLotDetails: true,
                    originalFilteredItems: location.state?.originalFilteredItems || [],
                    formData: {
                      ...formData,
                      poTypeId: selectedItems[0]?.poTypeId,
                      vendorId: selectedItems[0]?.vendorId,
                    },
                    entryType: entryType,
                    purchaseInwardDtl: location.state?.purchaseInwardDtl
                  }
                });
              }}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
          )}
          <h2 className="text-2xl font-semibold">
            {isYarnType ? 'Lot Details' : isItemType ? 'Stock Entry' : 'Piece Entry - Fabric'} ({currentItemIndex + 1} of {itemsWithEntries.length})
          </h2>
        </div>
        <div className="flex gap-2">
          {itemsWithEntries.length > 1 && (
            <>
              <Button
                onClick={() => {
                  setCurrentItemIndex(prev => Math.max(0, prev - 1));
                  setValidationError('');
                  setQuantityWarning('');
                }}
                disabled={currentItemIndex === 0}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4"
              >
                Previous Item
              </Button>
              <Button
                onClick={() => {
                  setCurrentItemIndex(prev => Math.min(itemsWithEntries.length - 1, prev + 1));
                  setValidationError('');
                  setQuantityWarning('');
                }}
                disabled={currentItemIndex === itemsWithEntries.length - 1}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4"
              >
                Next Item
              </Button>
            </>
          )}
          {poTypeId === PO_TYPE_WOVEN_FABRIC && (
            <>
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
            </>
          )}

          {/* <Button
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
          </Button> */}
         
        </div>
      </div>

      {validationError && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {validationError}
        </div>
      )}

      {quantityWarning && (
        <div className={`mt-4 p-4 border rounded flex items-center ${totalDistributed > inwardQuantity
          ? 'bg-red-100 border-red-400 text-red-700'
          : 'bg-yellow-100 border-yellow-400 text-yellow-700'
          }`}>
          <AlertCircle size={18} className="mr-2" />
          {quantityWarning}
        </div>
      )}

      <div className="space-y-6 mt-6">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} /> Purchase Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium">Product Type Name</label>
              <input value={selectedItem.poTypeName || 'N/A'} disabled className="input mt-1 bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium">Product Name</label>
              <input value={selectedItem.productName || 'N/A'} disabled className="input mt-1 bg-gray-100" />
            </div>
            {/* {isYarnType && (
              <div>
                <label className="block text-sm font-medium">Yarn Type</label>
                <input
                  value={String(selectedItem.yarnTypeId) === "1" ? "Warp" : String(selectedItem.yarnTypeId) === "2" ? "Weft" : "-"}
                  disabled
                  className="input mt-1 bg-gray-100"
                />
              </div>
            )} */}
            <div>
              <label className="block text-sm font-medium">Inward Quantity (Required)</label>
              <input
                value={inwardQuantity.toFixed(2)}
                disabled
                className="input mt-1 bg-blue-100 font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Remarks</label>
              <input
                value={(selectedItem as any).remarks || ''}
                onChange={(e) => {
                  const updatedItem = { ...selectedItem, remarks: e.target.value };
                  const updatedItems = [...itemsWithEntries];
                  updatedItems[currentItemIndex] = { ...updatedItems[currentItemIndex], item: updatedItem };
                  setItemsWithEntries(updatedItems);
                  itemsWithEntriesRef.current = updatedItems;
                }}
                className="input mt-1"
                placeholder="Enter remarks"
              />
            </div>
          </CardContent>
        </Card>
 {/* {isFabricType && (
              <div>
                <label className="block text-sm font-medium">Remarks</label>
                <input
                  value={(selectedItem as any).remarks || ''}
                  onChange={(e) => {
                    const updatedItem = { ...selectedItem, remarks: e.target.value };
                    const updatedItems = [...itemsWithEntries];
                    updatedItems[currentItemIndex] = { ...updatedItems[currentItemIndex], item: updatedItem };
                    setItemsWithEntries(updatedItems);
                    itemsWithEntriesRef.current = updatedItems;
                  }}
                  className="input mt-1"
                  placeholder="Enter remarks"
                />
              </div>
            )} */}
        <Card ref={draftFormRef}>
          <CardHeader>
            <div className="flex justify-between items-start w-full">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList size={20} /> {isYarnType ? 'Lot Entry' : isItemType ? 'Stock Entry' : 'Piece Entry'}
                </CardTitle>
                <div className="text-sm text-gray-600 mt-2">
                  <div className="grid grid-cols-3 gap-4 max-w-2xl">
                    <div>Inward Quantity: <span className="font-semibold">{inwardQuantity.toFixed(2)}</span></div>
                    <div>Distributed: <span className="font-semibold">{totalDistributed.toFixed(2)}</span></div>
                    <div>Remaining: <span className={`font-semibold ${remainingQuantity < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>{remainingQuantity.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 mt-1">
                <div className="flex items-center border border-gray-300 rounded focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden bg-white">
                  <span className="px-2 py-1.5 bg-gray-50 text-gray-500 text-xs border-r border-gray-300 whitespace-nowrap select-none">
                    No of {isYarnType || isItemType ? 'Lots' : 'Pieces'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={numberOfEntries}
                    onChange={(e) => updateCurrentItemData({ numberOfEntries: e.target.value })}
                    className="w-16 px-2 py-1 text-sm focus:outline-none bg-white font-medium"
                    placeholder="1"
                  />
                </div>
                <Button
                  onClick={handleAddEntriesForm}
                  className="bg-primary hover:bg-blue-600 text-white px-4 py-2 flex items-center text-sm font-semibold"
                >
                  <Plus size={16} className="mr-1" /> Add {isYarnType || isItemType ? 'Lot' : 'Piece'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Draft Entries Form */}
            {entriesDraft.map((entry, index) => {
              const warehouse = warehouseData.find((w: any) => w.id === Number(entry.warehouseId));

              if (isYarnType) {
                const lotEntry = entry as YarnStockDetail;
                return (
                  <div key={`draft-${index}`} className="relative grid grid-cols-10 gap-4 mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                    <div className="absolute top-2 right-2">
                      <Button
                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full"
                        onClick={() => handleRemoveDraftEntry(index)}
                        title="Delete Draft"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Warehouse *</label>
                      <CommonSearchableSelect
                        value={lotEntry.warehouseId || ''}
                        onValueChange={(value) => updateDraftEntry(index, 'warehouseId', value)}
                        options={filteredWarehouseList.map((warehouse: any) => ({
                          value: String(warehouse.id),
                          label: warehouse.warehouseName,
                          activeFlag: warehouse.activeFlag ?? true,
                        }))}
                        filterActive
                        placeholder="Select Warehouse"
                        className="mt-1 w-full bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Yarn Mill Name</label>
                      <CommonSearchableSelect
                        value={lotEntry.millId ? String(lotEntry.millId) : (formData.yarnMillId ? String(formData.yarnMillId) : '')}
                        onValueChange={(value) => updateDraftEntry(index, 'millId', value)}
                        options={subCategoryByCategoryList.map((mill: any) => ({
                          value: String(mill.id),
                          label: mill.subCategoryName,
                          activeFlag: mill.activeFlag ?? true,
                        }))}
                        filterActive
                        placeholder="Select Mill"
                        className="mt-1 w-full bg-white"
                      />
                    </div>
                   
                    <div>
                      <label className="block text-sm font-medium">No of Carton/Pallet</label>
                      <input
                        type="number"
                        min="0"
                  step="0.001"
                        value={lotEntry.inwardBags ?? ''}
                        onChange={(e) => updateDraftEntry(index, 'inwardBags', e.target.value)}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Kgs/Bag</label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={lotEntry.kgsPerBag ?? ''}
                        onChange={(e) => updateDraftEntry(index, 'kgsPerBag', e.target.value)}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Cones per Bag</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={lotEntry.conesPerBag ?? ''}
                        onChange={(e) => updateDraftEntry(index, 'conesPerBag', e.target.value)}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Cones Weight (Auto)</label>
                      <input
                        type="number"
                        readOnly
                        
                        value={lotEntry.conesWeight || ''}
                        className="input mt-1 bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Accepted Qty *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={lotEntry.acceptedQty || ''}
                        onChange={(e) => updateDraftEntry(index, 'acceptedQty', e.target.value)}
                        className="input mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Rejected Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={lotEntry.rejectedQty || ''}
                        onChange={(e) => updateDraftEntry(index, 'rejectedQty', e.target.value)}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Lot No</label>
                      <input
                        value={lotEntry.lotNo || ''}
                        onChange={(e) => updateDraftEntry(index, 'lotNo', e.target.value)}
                        className="input mt-1"
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Yarn Type</label>
                      <input
                        value={String(lotEntry.yarnTypeId) === "1" ? "Warp" : String(lotEntry.yarnTypeId) === "2" ? "Weft" : String(lotEntry.yarnTypeId) === "3" ? "Both":"-"}
                        readOnly
                        className="input mt-1 bg-gray-100"
                      />
                    </div>
                    {/* <div>
                      <label className="block text-sm font-medium">Remark</label>
                      <input
                        value={lotEntry.remark || ''}
                        onChange={(e) => updateDraftEntry(index, 'remark', e.target.value)}
                        className="input mt-1"
                      />
                    </div> */}
                  </div>
                );
              } else if (isItemType) {
                const itemEntry = entry as ItemStockDetail;
                return (
                  <div key={`draft-${index}`} className="relative grid grid-cols-9 gap-4 mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                    <div className="absolute top-2 right-2">
                      <Button
                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full"
                        onClick={() => handleRemoveDraftEntry(index)}
                        title="Delete Draft"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Warehouse *</label>
                      <CommonSearchableSelect
                        value={itemEntry.warehouseId || ''}
                        onValueChange={(value) => updateDraftEntry(index, 'warehouseId', value)}
                        options={filteredWarehouseList.map((warehouse: any) => ({
                          value: String(warehouse.id),
                          label: warehouse.warehouseName,
                          activeFlag: warehouse.activeFlag ?? true,
                        }))}
                        filterActive
                        placeholder="Select Warehouse bg-white"
                        className="mt-1 w-full bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">No of Carton/Pallet</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={itemEntry.inwardBags ?? ''}
                        onChange={(e) => updateDraftEntry(index, 'inwardBags', e.target.value)}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Qty/Unit</label>
                      <div className="flex mt-1">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={typeof itemEntry.kgsPerBag === 'number' ? itemEntry.kgsPerBag : (parseQtyAndUnit(itemEntry.kgsPerBag).numericVal || '')}
                          onChange={(e) => updateDraftEntry(index, 'kgsPerBag', e.target.value)}
                          className="input rounded-r-none border-r-0 w-full"
                          placeholder="0"
                        />
                        <select
                          value={itemEntry.uomId ? String(itemEntry.uomId) : (currentItemData.item.uomId ? String(currentItemData.item.uomId) : '')}
                          onChange={(e) => updateDraftEntry(index, 'uomId', e.target.value)}
                          className="input rounded-l-none bg-gray-50 text-sm border-l-0 w-28 shrink-0"
                        >
                          <option value="">Unit</option>
                          {activeUomList.map((uom: any) => {
                            const code = uom.uomCode || uom.uomName;
                            return (
                              <option key={uom.id} value={String(uom.id)}>
                                {code}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Accepted Qty *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemEntry.acceptedQty || ''}
                        onChange={(e) => updateDraftEntry(index, 'acceptedQty', e.target.value)}
                        className="input mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Rejected Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={itemEntry.rejectedQty || ''}
                        onChange={(e) => updateDraftEntry(index, 'rejectedQty', e.target.value)}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Rack No</label>
                      <input
                        value={itemEntry.rackNo || ''}
                        onChange={(e) => updateDraftEntry(index, 'rackNo', e.target.value)}
                        className="input mt-1"
                        placeholder="Enter Rack No"
                      />
                    </div>
                    {/* <div>
                      <label className="block text-sm font-medium">Remark</label>
                      <input
                        value={itemEntry.remark || ''}
                        onChange={(e) => updateDraftEntry(index, 'remark', e.target.value)}
                        className="input mt-1"
                      />
                    </div> */}
                  </div>
                );
              } else {
                const pieceEntry = entry as PieceEntry;
                const currentFabricId = poTypeId === PO_TYPE_WOVEN_FABRIC ? pieceEntry.fabricMasterId : pieceEntry.fabricId;
                return (
                  <div key={`draft-${index}`} className="relative grid grid-cols-4 gap-4 mb-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                    <div className="absolute top-2 right-2">
                      <Button
                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full"
                        onClick={() => handleRemoveDraftEntry(index)}
                        title="Delete Draft"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Sort No * (Mandatory)</label>
                      <CommonSearchableSelect
                        value={currentFabricId || ''}
                        onValueChange={(value) => {
                          const id = Number(value);
                          const currentItemData = itemsWithEntries[currentItemIndex];
                          const updatedDrafts = [...currentItemData.entriesDraft];

                          if (id && fabricMastersArray.length > 0) {
                            const fabricDetails = populateFabricDetailsFromMaster(id);
                            const updatedDraft = {
                              ...updatedDrafts[index],
                              ...fabricDetails
                            } as Partial<PieceEntry>;

                            updatedDrafts[index] = updatedDraft;
                            updateCurrentItemData({ entriesDraft: updatedDrafts });
                            validateQuantityTotals(currentItemData.pieceEntries, updatedDrafts);
                          } else if (!id) {
                            const updatedDraft = {
                              ...updatedDrafts[index],
                              fabricCode: '',
                              fabricDetails: '',
                              fabricQuality: '',
                              gstPercent: 0,
                              gsm: undefined,
                              ppi: undefined,
                              fabricId: 0,
                              fabricMasterId: 0
                            } as Partial<PieceEntry>;
                            updatedDrafts[index] = updatedDraft;
                            updateCurrentItemData({ entriesDraft: updatedDrafts });
                          }
                        }}
                        options={poFabricOptions.length > 0 ? poFabricOptions : fabricMastersArray.map((fabric: any) => ({
                          value: String(fabric.id),
                          label: fabric.fabricCode,
                          activeFlag: fabric.activeFlag ?? true,
                        }))}
                        filterActive
                        placeholder="Select Sort No"
                        className="mt-1 w-full bg-white"
                        disabled={poFabricOptions.length === 1}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Construction * (Auto-filled)</label>
                      <input
                        value={pieceEntry.fabricDetails || ''}
                        readOnly
                        className="input mt-1 bg-gray-100 cursor-not-allowed font-medium text-gray-700"
                        placeholder="Select Sort No first"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Piece No * (Auto-generated if empty)</label>
                      <input
                        value={pieceEntry.pieceNumber || ''}
                        onChange={(e) => updateDraftEntry(index, 'pieceNumber', e.target.value)}
                        className="input mt-1"
                        placeholder="e.g., GFP-00001"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Warehouse *</label>
                      <CommonSearchableSelect
                        value={pieceEntry.warehouseId || ''}
                        onValueChange={(value) => updateDraftEntry(index, 'warehouseId', value)}
                        options={filteredWarehouseList.map((warehouse: any) => ({
                          value: String(warehouse.id),
                          label: warehouse.warehouseName,
                          activeFlag: warehouse.activeFlag ?? true,
                        }))}
                        filterActive
                        placeholder="Select Warehouse"
                        className="mt-1 w-full bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Piece Meter * (Max 2 decimals)</label>
                      <input
                        type="number"
                        min="0"
                        max={remainingQuantity + (Number(pieceEntry.pieceMeter) || 0)}
                        step="0.01"
                        value={pieceEntry.pieceMeter || ''}
                        onChange={(e) => updateDraftEntry(index, 'pieceMeter', e.target.value)}
                        className="input mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Net Weightx (Max 3 decimals)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={pieceEntry.netWeight || ''}
                        onChange={(e) => updateDraftEntry(index, 'netWeight', e.target.value)}
                        className="input mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Avg Weight (Auto-calculated)</label>
                      <input
                        type="number"
                        value={pieceEntry.avgWeight?.toFixed(3) || '0.000'}
                        disabled
                        className="input mt-1 bg-gray-100 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Gross Weight</label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={pieceEntry.grossWt ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            updateDraftEntry(index, 'grossWt', val === '' ? undefined : Number(val));
                          }
                        }}
                        className="input mt-1"
                        placeholder="Enter gross weight"
                      />
                    </div>
                     
                  </div>
                );
              }
            })}

            {entriesDraft.length > 0 && (
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Adding {entriesDraft.length} {isYarnType || isItemType ? 'lot' : 'piece'}{entriesDraft.length > 1 ? 's' : ''} (draft)
                  </div>
                  
                </div>
                <div className="flex justify-end gap-3">
                  <div className="flex">
                    <Button
                      variant="outline"
                      onClick={handleCancelDrafts}
                      className="flex items-center text-gray-700"
                    >
                      <X size={16} className="mr-2" /> Clear all
                    </Button>
                  </div>
                  <Button onClick={handleAddEntries} className="bg-green-600 hover:bg-green-700 text-white px-6 flex items-center">
                    <Plus size={18} className="mr-2" /> {editingIndex !== null ? `Update ${isYarnType || isItemType ? 'Lot' : 'Piece'}` : `Add ${isYarnType || isItemType ? 'Lots' : 'Pieces'}`}
                  </Button>
                </div>
              </div>
            )}

            {/* {entries.length > 0 && entriesDraft.length === 0 && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => {
                    updateCurrentItemData({ numberOfEntries: '1' });
                    setTimeout(() => handleAddEntriesForm(), 0);
                  }}
                  className="bg-primary hover:bg-blue-600 text-white px-6 flex items-center"
                >
                  <Plus size={18} className="mr-2" /> Add More {isYarnType || isItemType ? 'Lotss' : 'Pieces'}
                </Button>
              </div>
            )} */}
            {entries.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Added {isYarnType || isItemType ? 'Lots' : 'Pieces'}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">Sl.No</th>
                        {isYarnType ? (
                          <>
                            <th className="border p-2">Warehouse</th>
                            <th className="border p-2">Yarn Mill Name</th>
                            <th className="border p-2">Lot No</th>
                            <th className="border p-2">Yarn Type</th>
                              <th className="border p-2">No of Carton/Pallet</th>
                                <th className="border p-2">Kgs/Bag</th>
                            <th className="border p-2">Cones/Bag</th>
                            <th className="border p-2">Cones Weight</th>
                            <th className="border p-2">Accepted Qty</th>
                            <th className="border p-2">Rejected Qty</th>
                            <th className="border p-2">Total Qty</th>
                            {/* <th className="border p-2">remark</th> */}
                          </>
                        ) : isItemType ? (
                          <>
                            <th className="border p-2">Warehouse</th>
                            <th className="border p-2">Rack No</th>
                            <th className="border p-2">No of Carton/Pallet</th>
                            <th className="border p-2">Qty/Unit</th>
                            <th className="border p-2">Accepted Qty</th>
                            <th className="border p-2">Rejected Qty</th>
                            <th className="border p-2">Total Qty</th>
                            {/* <th className="border p-2">Remark</th> */}
                          </>
                        ) : (
                          <>
                            <th className="border p-2">Sort No</th>
                            <th className="border p-2">Construction</th>
                            <th className="border p-2">Piece No</th>
                            <th className="border p-2">Piece Meter</th>
                            <th className="border p-2">Net Weight</th>
                            <th className="border p-2">Avg Weight</th>
                            <th className="border p-2">Gross Weight</th>
                            <th className="border p-2">Warehouse</th>

                          </>
                        )}
                        <th className="border p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, index) => {
                        const warehouse = warehouseData.find((w: any) => w.id === Number(entry.warehouseId));

                        if (isYarnType) {
                          const lotEntry = entry as YarnStockDetail;
                          const totalQty = (lotEntry.acceptedQty || 0) + (lotEntry.rejectedQty || 0);

                          return (
                            <tr key={`lot-${lotEntry.id}-${index}`}>
                              <td className="border p-2 text-center">{index + 1}</td>
                              <td className="border p-2">
                                {warehouse ? (
                                  <span className="font-medium">{warehouse.warehouseName}</span>
                                ) : (
                                  <div>
                                    <span className="text-red-500">N/A</span>
                                    <div className="text-red-500 text-xs">(ID: {lotEntry.warehouseId || 'empty'})</div>
                                  </div>
                                )}
                              </td>
                              <td className="border p-2">
                                {(() => {
                                  const millIdToUse = lotEntry.millId ?? formData.yarnMillId ?? selectedItem.millNameId;
                                  const mill = subCategoryByCategoryList.find((m: any) => m.id === Number(millIdToUse));
                                  return mill ? mill.subCategoryName : '-';
                                })()}
                              </td>
                              <td className="border p-2">{lotEntry.lotNo || '-'}</td>
                              <td className="border p-2">{String(lotEntry.yarnTypeId) === "1" ? "Warp" : String(lotEntry.yarnTypeId) === "2" ? "Weft" : String(lotEntry.yarnTypeId) === "3" ? "Both":"-"}</td>
                               <td className="border p-2">{lotEntry.inwardBags || '-'}</td>
                              <td className="border p-2">{lotEntry.kgsPerBag || '-'}</td>
<td className="border p-2 text-center">{lotEntry.conesPerBag ?? '-'}</td>
                              <td className="border p-2 text-center">{lotEntry.conesWeight != null ? lotEntry.conesWeight.toFixed(3) : '-'}</td>
                              <td className="border p-2 text-center font-semibold text-green-600">{lotEntry.acceptedQty.toFixed(2)}</td>
                              <td className="border p-2 text-center font-semibold text-red-600">{lotEntry.rejectedQty.toFixed(2)}</td>
                              <td className="border p-2 text-center font-semibold bg-blue-50">{totalQty.toFixed(2)}</td>

                              {/* <td className="border p-2">{lotEntry.remark}</td> */}
                              <td className="border p-2">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    onClick={() => handleEditEntry(lotEntry)}
                                    className="p-1 h-8 w-8 text-blue-600 border-blue-100 hover:bg-blue-50"
                                    variant="outline"
                                    title="View"
                                  >
                                    <Eye size={16} />
                                  </Button>
                                  {Number(lotEntry.isInspected) === 1 ? (
                                    <span className="px-2 py-1 rounded-full text-[10px] bg-yellow-100 text-yellow-800 font-bold uppercase tracking-wider border border-yellow-200 shadow-sm">
                                      Inspected
                                    </span>
                                  ) : (
                                    <>
                                      <Button
                                        onClick={() => handleEditEntry(lotEntry)}
                                        className="p-1 h-8 w-8"
                                        variant="outline"
                                        title="Edit"
                                      >
                                        <Edit size={16} />
                                      </Button>
                                      <Button
                                        onClick={() => handleDeleteEntry(lotEntry.id)}
                                        className="p-1 h-8 w-8 bg-red-600 hover:bg-red-700"
                                        title="Delete"
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        } else if (isItemType) {
                          const itemEntry = entry as ItemStockDetail;
                          const totalQty = (itemEntry.acceptedQty || 0) + (itemEntry.rejectedQty || 0);

                          return (
                            <tr key={`item-${itemEntry.id}-${index}`}>
                              <td className="border p-2 text-center">{index + 1}</td>
                              <td className="border p-2">
                                {warehouse ? (
                                  <span className="font-medium">{warehouse.warehouseName}</span>
                                ) : (
                                  <div>
                                    <span className="text-red-500">N/A</span>
                                    <div className="text-red-500 text-xs">(ID: {itemEntry.warehouseId || 'empty'})</div>
                                  </div>
                                )}
                              </td>
                              <td className="border p-2">{itemEntry.rackNo || '-'}</td>
                              <td className="border p-2">{itemEntry.inwardBags || '-'}</td>
                              <td className="border p-2">{renderQtyWithUomCode(itemEntry.kgsPerBag, itemEntry.uomId || currentItemData.item.uomId)}</td>
                              <td className="border p-2 text-center font-semibold text-green-600">{itemEntry.acceptedQty.toFixed(2)}</td>
                              <td className="border p-2 text-center font-semibold text-red-600">{itemEntry.rejectedQty.toFixed(2)}</td>
                              <td className="border p-2 text-center font-semibold bg-blue-50">{totalQty.toFixed(2)}</td>
                              {/* <td className="border p-2">{itemEntry.remark}</td> */}
                              <td className="border p-2">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    onClick={() => handleEditEntry(itemEntry)}
                                    className="p-1 h-8 w-8 text-blue-600 border-blue-100 hover:bg-blue-50"
                                    variant="outline"
                                    title="View"
                                  >
                                    <Eye size={16} />
                                  </Button>
                                  {Number(itemEntry.isInspected) === 1 ? (
                                    <span className="px-2 py-1 rounded-full text-[10px] bg-yellow-100 text-yellow-800 font-bold uppercase tracking-wider border border-yellow-200 shadow-sm">
                                      Inspected
                                    </span>
                                  ) : (
                                    <>
                                      <Button
                                        onClick={() => handleEditEntry(itemEntry)}
                                        className="p-1 h-8 w-8"
                                        variant="outline"
                                        title="Edit"
                                      >
                                        <Edit size={16} />
                                      </Button>
                                      <Button
                                        onClick={() => handleDeleteEntry(itemEntry.id)}
                                        className="p-1 h-8 w-8 bg-red-600 hover:bg-red-700"
                                        title="Delete"
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        } else {
                          const pieceEntry = entry as PieceEntry;
                          return (
                            <tr key={`piece-${pieceEntry.id}-${index}`}>
                              <td className="border p-2 text-center">{index + 1}</td>
                              <td className="border p-2 font-medium">{pieceEntry.fabricCode || '-'}</td>
                              <td className="border p-2">{pieceEntry.fabricDetails || '-'}</td>
                              <td className="border p-2 text-center font-semibold text-blue-600">{pieceEntry.pieceNumber || '-'}</td>
                              <td className="border p-2 text-center font-semibold">{pieceEntry.pieceMeter.toFixed(2)}</td>
                              <td className="border p-2 text-center">{pieceEntry.netWeight.toFixed(3)}</td>
                              <td className="border p-2 text-center bg-blue-50 font-semibold">{(pieceEntry.avgWeight || 0).toFixed(3)}</td>
                              <td className="border p-2 text-center">{pieceEntry.grossWt != null ? pieceEntry.grossWt : '-'}</td>
                              <td className="border p-2">
                                {warehouse ? (
                                  <span className="font-medium">{warehouse.warehouseName}</span>
                                ) : (
                                  <div>
                                    <span className="text-red-500">N/A</span>
                                    <div className="text-red-500 text-xs">(ID: {pieceEntry.warehouseId || 'empty'})</div>
                                  </div>
                                )}
                              </td>
                              <td className="border p-2">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    onClick={() => handleEditEntry(pieceEntry)}
                                    className="p-1 h-8 w-8 text-blue-600 border-blue-100 hover:bg-blue-50"
                                    variant="outline"
                                    title="View"
                                  >
                                    <Eye size={16} />
                                  </Button>
                                  {Number(pieceEntry.isInspected) === 1 ? (
                                    <span className="px-2 py-1 rounded-full text-[10px] bg-yellow-100 text-yellow-800 font-bold uppercase tracking-wider border border-yellow-200 shadow-sm">
                                      Inspected
                                    </span>
                                  ) : (
                                    <>
                                      <Button
                                        onClick={() => handleEditEntry(pieceEntry)}
                                        className="p-1 h-8 w-8"
                                        variant="outline"
                                        title="Edit"
                                      >
                                        <Edit size={16} />
                                      </Button>
                                      <Button
                                        onClick={() => handleDeleteEntry(pieceEntry.id)}
                                        className="p-1 h-8 w-8 bg-red-600 hover:bg-red-700"
                                        title="Delete"
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* All Items Summary - Only show if multiple items */}
        {itemsWithEntries.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={20} /> All Items Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">Item #</th>
                    <th className="border p-2">Product Name</th>
                    <th className="border p-2">Inward Qty</th>
                    <th className="border p-2">No of {isYarnType || isItemType ? 'Lots' : 'Pieces'}</th>
                    <th className="border p-2">Total {isYarnType ? 'Lot' : 'Piece'} Qty</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsWithEntries.map((itemData, index) => {
                    const itemEntries = isYarnType ? itemData.yarnStockDetails : isItemType ? itemData.itemStockDetails : itemData.pieceEntries;
                    const itemTotalQty = calculateTotalQuantity(itemEntries);
                    const itemReceivedQty = Number(itemData.item.quantityReceived) || 0;
                    const isComplete = itemTotalQty === itemReceivedQty;
                    const isOverflow = itemTotalQty > itemReceivedQty;

                    return (
                      <tr key={index} className={index === currentItemIndex ? 'bg-blue-50' : ''}>
                        <td className="border p-2 text-center">{index + 1}</td>
                        <td className="border p-2">{itemData.item.productName}</td>
                        <td className="border p-2 text-center">{itemReceivedQty.toFixed(2)}</td>
                        <td className="border p-2 text-center">{itemEntries.length}</td>
                        <td className="border p-2 text-center font-semibold">{itemTotalQty.toFixed(2)}</td>
                        <td className="border p-2 text-center">
                          {isComplete ? (
                            <span className="text-green-600 font-semibold">✓ Complete</span>
                          ) : isOverflow ? (
                            <span className="text-red-600 font-semibold">⚠ Overflow</span>
                          ) : (
                            <span className="text-orange-600 font-semibold">⋯ Pending</span>
                          )}
                        </td>
                        <td className="border p-2 text-center">
                          <Button
                            onClick={() => {
                              setCurrentItemIndex(index);
                              setValidationError('');
                            }}
                            className="bg-primary hover:bg-blue-600 text-white px-3 py-1 text-sm"
                            disabled={index === currentItemIndex}
                          >
                            {index === currentItemIndex ? 'Current' : 'Go to Item'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}  
        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleSave} 
            disabled={hasNoEntries} 
            className={`${hasNoEntries ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-6 flex items-center`}
          >
            <Save size={18} className="mr-2" /> {isEditMode ? 'Update Purchase Inward' : 'Save Purchase Inward'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LotDetails;