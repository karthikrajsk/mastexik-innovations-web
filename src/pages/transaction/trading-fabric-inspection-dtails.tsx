// import { DataTable } from "@/components/data/DataTable";
// import { Modal } from "@/components/ui/Modal";
// import { getAllFabricInspection } from "@/state/fabricInspectionsSlice";
// import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
// import { getAllOpeningBalance } from "@/state/openingBalanceSlice";
// import { getAllJobworkFabricReceive } from "@/state/jobFabricReceiveSlice";
// import { getAllPurchaseOrders } from "@/state/purchaseOrderSlice";
// import { AppDispatch, RootState } from "@/state/store";
// import { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { getAllVendors } from "@/state/vendorSlice";
// import { getAllDefectMaster } from "@/state/defectMasterSlice";
// import { getAllGrandMaster } from "@/state/gradeMasterSlice";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Eye, ClipboardCheck, Edit } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { formatDate } from "@/lib/utils";
// import { getFabricBarcodeLink } from "@/lib/barcode";
// import { useCompanyContext } from "@/hooks/useCompanyContext";

// type TradingFabricInspectionDetailsProps = {
//   hideHeader?: boolean;
// };

// // Date Range Filter Component
// function DateRangeFilter({ column: { filterValue = {}, setFilter } }: any) {
//   return (
//     <div className="flex space-x-2">
//       <p className="text-sm font-normal">From</p>
//       <input
//         type="date"
//         value={filterValue.from || ''}
//         onChange={e => setFilter({ ...filterValue, from: e.target.value })}
//         placeholder="From"
//         className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
//       />
//       <p className="text-sm font-normal">To</p>
//       <input
//         type="date"
//         value={filterValue.to || ''}
//         onChange={e => setFilter({ ...filterValue, to: e.target.value })}
//         placeholder="To"
//         className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
//       />
//     </div>
//   );
// }

// export function TradingFabricInspectionDetails({ hideHeader = false }: TradingFabricInspectionDetailsProps) {
//   const { fabricInspectionList } = useSelector((state: RootState) => state.fabricInspections);
//   const { purchaseInwardList } = useSelector((state: RootState) => state.purchaseInward);
//   const { jobworkFabricReceiveList } = useSelector((state: RootState) => state.JobworkFabricReceive);
//   const { openingBalanceList, paginationInfo: openingBalancePaginationInfo } = useSelector((state: RootState) => state.openingBalance);
//   const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
//   const { gradeList } = useSelector((state: RootState) => state.grade);

//   const normalizeList = (raw: any) => {
//     if (Array.isArray(raw)) return raw;
//     if (Array.isArray(raw?.data)) return raw.data;
//     if (Array.isArray(raw?.data?.data)) return raw.data.data;
//     if (Array.isArray(raw?.rows)) return raw.rows;
//     return [] as any[];
//   };

//   const normalizedPurchaseInwards = useMemo(() => normalizeList(purchaseInwardList), [purchaseInwardList]);
//   const normalizedJobworkReceives = useMemo(() => normalizeList(jobworkFabricReceiveList), [jobworkFabricReceiveList]);
//   const normalizedFabricInspections = useMemo(() => normalizeList(fabricInspectionList), [fabricInspectionList]);
//   const normalizedOpeningBalances = useMemo(() => normalizeList(openingBalanceList), [openingBalanceList]);
//   const { vendorList } = useSelector((state: RootState) => state.vendor);
//   const { purchaseOrderList } = useSelector((state: RootState) => state.purchaseOrder);
//   const { defectMasterList } = useSelector((state: RootState) => state.defect);
//   const { companyName } = useCompanyContext();
  
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [currentInspection, setCurrentInspection] = useState<any>(null);
//   const locationState = useLocation();
//   const initialTab = (locationState.state as any)?.activeTab || 'pending';
//   const [inspectionStatus, setInspectionStatus] = useState<'pending' | 'completed'>(initialTab as 'pending' | 'completed');
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const selectedCompanyId = useMemo(() => {
//     const stored = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//     return stored ? Number(stored) : undefined;
//   }, []);

//   useEffect(() => {
//     const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//     const companyId = v ? Number(v) : undefined;

//     dispatch(getAllFabricInspection({ companyId }));
//     dispatch(getAllVendors({}));
//     dispatch(getAllPurchaseInwards(companyId ? { companyId } : {}));
//     dispatch(getAllJobworkFabricReceive(companyId ? { companyId } : {}));
//     dispatch(getAllOpeningBalance(companyId ? { companyId } : {}));
//     dispatch(getAllPurchaseOrders({}));
//     dispatch(getAllDefectMaster({}));
//     dispatch(getAllGrandMaster({}));
//   }, [dispatch]);

//   const vendorMap = useMemo(() => {
//     return vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
//       acc[vendor.id] = vendor.vendorName;
//       return acc;
//     }, {}) || {};
//   }, [vendorList]);

//   // Create a map of PO item IDs to their details (fabricCode, fabricQuality)
//   const poItemMap = useMemo(() => {
//     const map: Record<number, { fabricCode: string; fabricQuality: string }> = {};
    
//     if (Array.isArray(purchaseOrderList)) {
//       purchaseOrderList.forEach((po: any) => {
//         const items = po.items || po.purchaseOrderItemsDtl || [];
//         if (Array.isArray(items)) {
//           items.forEach((item: any) => {
//             if (item.id) {
//               map[item.id] = {
//                 fabricCode: item.fabricCode || '-',
//                 fabricQuality: item.fabricQuality || '-'
//               };
//             }
//           });
//         }
//       });
//     }
    
//     return map;
//   }, [purchaseOrderList]);

//     const fabricCodeMap = useMemo(() => {
//     if (!Array.isArray(fabricMasterList)) return {};
//     return fabricMasterList.reduce((acc: Record<number, string>, fabric: any) => {
//       if (fabric?.id) {
//         acc[Number(fabric.id)] = fabric.fabricCode || fabric.code || '-';
//       }
//       return acc;
//     }, {} as Record<number, string>);
//   }, [fabricMasterList]);

//   const gradeArray = useMemo(() => {
//     if (Array.isArray(gradeList)) return gradeList;
//     if (Array.isArray((gradeList as any)?.data)) return (gradeList as any).data;
//     return [];
//   }, [gradeList]);

//   const gradeMap = useMemo(() => {
//     const map = new Map<string, string>();
//     gradeArray.forEach((grade: any) => {
//       const id = grade?.id ?? grade?.gradeId ?? grade?.grade_id;
//       const name = (grade?.gradeName ?? grade?.grade_name ?? grade?.gradeCode ?? grade?.grade_code ?? '')
//         .toString()
//         .trim();
//       if (id != null && name) {
//         map.set(String(id), name);
//       }
//     });
//     return map;
//   }, [gradeArray]);

//   const openingBalanceInspectionLookup = useMemo(() => {
//     const map = new Map<string, any>();
//     normalizedFabricInspections.forEach((inspection: any) => {
//       const openingBalanceId = inspection.openingBalanceId ?? inspection.opening_balance_id;
//       if (!openingBalanceId) return;
//       const normalizedBalanceId = String(openingBalanceId);
//       const pieceNo = String(
//         inspection.pieceNo ?? inspection.piece_no ?? inspection.pieceNumber ?? inspection.piece_number ?? ""
//       )
//         .trim()
//         .toLowerCase();
//       const pieceEntryId = inspection.pieceEntryId ?? inspection.piece_entry_id;
//       if (pieceNo) {
//         map.set(`BAL:${normalizedBalanceId}:${pieceNo}`, inspection);
//       }
//       if (pieceEntryId !== undefined && pieceEntryId !== null) {
//         map.set(`ENTRY:${normalizedBalanceId}:${pieceEntryId}`, inspection);
//       }
//     });
//     return map;
//   }, [normalizedFabricInspections]);

//   // Filter data based on toggle status
//   const filteredData = useMemo(() => {
//     let data: any[] = [];

//      const getVendorDisplay = (sourceType: string, vendorId: any, vendorMap: Record<number, string>, companyName?: string) => {
//     if (sourceType === 'Opening Balance') {
//       return companyName; // or '--' based on your preference
//     }
//     return vendorId ? vendorMap[vendorId] || companyName || '--' : companyName || '--';
//   };

//     const isPieceInspected = (value: any) => {
//       // Check for explicit true/1/yes values
//       if (typeof value === 'string') {
//         const normalized = value.trim().toLowerCase();
//         return normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === 'completed';
//       }
//       if (typeof value === 'number') {
//         return value === 1; // Only 1 means inspected, 0 means not inspected
//       }
//       if (typeof value === 'boolean') {
//         return value;
//       }
//       return false;
//     };

//     const inspectedPieceNumbers = new Set(
//       normalizedFabricInspections
//         .filter((x: any) => Number(x?.isInspected ?? x?.is_inspected ?? 0) === 1)
//         .map((x: any) => String(x?.pieceNo || '').trim().toLowerCase())
//     );

//     const findOpeningBalanceInspection = (balanceId: any, pieceNumber: string, pieceEntryId?: any) => {
//       if (!balanceId) return null;
//       const normalizedBalanceId = String(balanceId);
//       const lookupKeys: string[] = [];
//       if (pieceEntryId !== undefined && pieceEntryId !== null && pieceEntryId !== '') {
//         lookupKeys.push(`ENTRY:${normalizedBalanceId}:${pieceEntryId}`);
//       }
//       if (pieceNumber) {
//         lookupKeys.push(`BAL:${normalizedBalanceId}:${pieceNumber}`);
//       }
//       for (const key of lookupKeys) {
//         const match = openingBalanceInspectionLookup.get(key);
//         if (match) {
//           return match;
//         }
//       }
//       return null;
//     };

//     const openingBalanceDataAll = (normalizedOpeningBalances || [])
//       .filter((balance: any) => (balance.goodsType || '').toString().toLowerCase() === 'fabric')
//       .reduce((acc: any[], balance: any) => {
//         const itemsArray = Array.isArray(balance.fabricItems)
//           ? balance.fabricItems
//           : Array.isArray(balance.items)
//             ? balance.items
//             : [];
//         if (!itemsArray.length) return acc;

//         itemsArray.forEach((item: any, itemIndex: number) => {
//           const pieceNumber = String(item.pieceNo || item.pieceNumber || '').trim().toLowerCase();
//           const inspected = isPieceInspected(item.isInspected) || inspectedPieceNumbers.has(pieceNumber);

//           if (inspectionStatus === 'pending' && !inspected) {
//             const fabricCodeIdValue = item?.fabricCodeId ?? item?.fabricMasterId ?? balance.fabricCodeId;
//             const normalizedFabricCodeId = fabricCodeIdValue ? Number(fabricCodeIdValue) : undefined;
//             const fabricCodeFromMaster = normalizedFabricCodeId ? fabricCodeMap[normalizedFabricCodeId] : undefined;
//             const fabricCode = fabricCodeFromMaster || item?.fabricCode || balance.fabricCode || '-';
//             const fabricQuality = item?.quality || '-';
//             const inwardDate = balance.date || balance.createdDate || balance.createdAt || balance.updatedAt || '';
//             // const resolvedVendorName = balance.vendorId
//             //   ? vendorMap[balance.vendorId] || companyName || '--'
//             //   : companyName || '--';
//  const resolvedVendorName = getVendorDisplay('Opening Balance', balance.vendorId, vendorMap, companyName);
//             acc.push({
//               id: `OB-${balance.id}-${item.id || itemIndex + 1}`,
//               sourceType: 'Opening Balance',
//               sourceId: balance.id,
//               inwardDate,
//               orderNo: '--',
//               pieceNo: item.pieceNo || item.pieceNumber || `Piece ${itemIndex + 1}`,
//               fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
//               fabricCode,
//               fabricQuality,
//               vendorId: balance.vendorId,
//               vendorName: resolvedVendorName,
//               isPacked: item.isPacked ?? 0,
//               rawData: {
//                 ...balance,
//                 selectedPieces: [{
//                   pieceNumber: item.pieceNo || item.pieceNumber,
//                   quantity: Number(item.pieceMeter) || 0,
//                   weight: Number(item.netWeight) || 0,
//                   cost: Number(item.cost) || 0,
//                   isPacked: item.isPacked ?? 0,
//                   openingBalanceItemId: item.id,
//                   openingBalanceItem: item
//                 }],
//                 selectedItem: item,
//                 items: itemsArray,
//                 fabricCode,
//                 fabricCodeId: normalizedFabricCodeId,
//                 quality: fabricQuality,
//                 openingBalanceId: balance.id
//               }
//             });
//           } else if (inspectionStatus === 'completed' && inspected) {
//             const pieceEntryId = item.id ?? item.pieceEntryId;
//             const matchingInspection = findOpeningBalanceInspection(balance.id, pieceNumber, pieceEntryId);
//             const fabricCodeIdValue =
//               matchingInspection?.fabricCodeId ??
//               matchingInspection?.fabric_code_id ??
//               item?.fabricCodeId ??
//               item?.fabricMasterId ??
//               balance.fabricCodeId;
//             const normalizedFabricCodeId = fabricCodeIdValue ? Number(fabricCodeIdValue) : undefined;
//             const fabricCodeFromMaster = normalizedFabricCodeId ? fabricCodeMap[normalizedFabricCodeId] : undefined;
//             const fabricCode = matchingInspection?.fabricCode || fabricCodeFromMaster || item?.fabricCode || balance.fabricCode || '-';
//             const fabricQuality = matchingInspection?.fabricQuality || item?.quality || '-';
//             const inspectionDate =
//               matchingInspection?.inspectionDate ||
//               matchingInspection?.createdDate ||
//               matchingInspection?.createdAt ||
//               balance.date ||
//               balance.createdDate ||
//               '';
//             const pieceMeters =
//               matchingInspection?.pieceMeters ??
//               matchingInspection?.pieceMeter ??
//               item?.pieceMeter ??
//               0;
//             const netWeight =
//               matchingInspection?.actualNetWeight ??
//               matchingInspection?.netWeight ??
//               item?.netWeight ??
//               0;
//             const savedInspectionDetails =
//               matchingInspection?.inspectionDetails ??
//               matchingInspection?.fabricInspectionDetails ??
//               [];
//             const savedInspectionEntries =
//               matchingInspection?.inspectionEntries ??
//               matchingInspection?.inspection_entries ??
//               [];
//             const inspectionId =
//               matchingInspection?.fabricInspectionId ??
//               matchingInspection?.fabric_inspection_id ??
//               matchingInspection?.inspectionId ??
//               matchingInspection?.inspection_id ??
//               matchingInspection?.id;
//             const inspectionIdString = inspectionId ? String(inspectionId) : '';
//             const fallbackGrade =
//               matchingInspection?.fabricGrade ||
//               matchingInspection?.grade ||
//               item?.grade ||
//               '';
//             const pieceMetersString = String(pieceMeters || 0);
//             const netWeightString = String(netWeight || 0);
//             const avgWeightValue = pieceMeters > 0 ? (netWeight / pieceMeters).toFixed(3) : '0';
//             const fallbackTotalDefectPoints = String(
//               matchingInspection?.totalDefectPoints ??
//               matchingInspection?.total_defect_points ??
//               0
//             );
//             const fallbackDefectCounts = String(
//               matchingInspection?.defectCounts ??
//               matchingInspection?.defect_counts ??
//               0
//             );
//             const fallbackDetails = [
//               {
//                 fabricInspectionId: inspectionIdString,
//                 pieceNo: item.pieceNo || item.pieceNumber || '',
//                 pieceEntryId,
//                 pieceMeters: pieceMetersString,
//                 inspectedMeters: pieceMetersString,
//                 actualNetWeight: netWeightString,
//                 avgWeight: avgWeightValue,
//                 totalDefectPoints: fallbackTotalDefectPoints,
//                 defectCounts: fallbackDefectCounts,
//                 grade: fallbackGrade,
//                 activeFlag: true
//               }
//             ];
//             const finalInspectionDetails = savedInspectionDetails.length > 0 ? savedInspectionDetails : fallbackDetails;
//             const finalInspectionEntries = savedInspectionEntries.length > 0 ? savedInspectionEntries : [];
//             const vendorIdValue = matchingInspection?.vendorId ?? matchingInspection?.vendor_id ?? balance.vendorId;
//             const resolvedVendorId = vendorIdValue ? Number(vendorIdValue) : balance.vendorId;
  
//             const resolvedVendorName = getVendorDisplay('Opening Balance', resolvedVendorId, vendorMap, companyName);
              
//             const computedId = inspectionId ? inspectionId : `OB-COMP-${balance.id}-${item.id || itemIndex + 1}`;
//             const fallbackPieceNumber = item.pieceNo || item.pieceNumber || '';
//             const fallbackPieceQuantity = Number(item.pieceMeter ?? item.quantity ?? item.quantityReceived ?? 0);
//             const fallbackPieceWeight = Number(item.netWeight ?? item.weight ?? 0);
//             const fallbackSelectedPiece = {
//               pieceNumber: fallbackPieceNumber,
//               pieceEntryId: pieceEntryId ?? item.id,
//               quantity: isNaN(fallbackPieceQuantity) ? 0 : fallbackPieceQuantity,
//               weight: isNaN(fallbackPieceWeight) ? 0 : fallbackPieceWeight,
//               cost: Number(item.cost ?? 0),
//               isPacked: item.isPacked ?? 0,
//               openingBalanceItemId: item.id,
//               openingBalanceItem: item
//             };
//             const rawData = {
//               ...balance,
//               ...matchingInspection,
//               id: inspectionId ?? computedId,
//               inspectionId: inspectionId ?? computedId,
//               fabricInspectionId: inspectionId,
//               sourceType: 'Opening Balance',
//               openingBalanceId: balance.id,
//               vendorId: resolvedVendorId,
//               vendorName: resolvedVendorName,
//               fabricCode,
//               quality: fabricQuality,
//               pieceMeters,
//               netWeight,
//               pieceNo: fallbackPieceNumber,
//               selectedPieces: [fallbackSelectedPiece],
//               selectedItem: item,
//               items: itemsArray,
//               inspectionDetails: finalInspectionDetails,
//               inspectionEntries: finalInspectionEntries
//             };

//             acc.push({
//               id: computedId,
//               sourceType: 'Opening Balance',
//               inspectionDate,
//               pieceNo: matchingInspection?.pieceNo || fallbackPieceNumber || '-',
//               fabricCode,
//               fabricQuality,
//               vendorId: resolvedVendorId,
//               vendorName: resolvedVendorName,
//               pieceMeters,
//               netWeight,
//               inspectionDetails: finalInspectionDetails,
//               inspectionEntries: finalInspectionEntries,
//               rawData
//             });
//           }
//         });

//         return acc;
//       }, [] as any[]);

//     if (inspectionStatus === 'pending') {
//       const purchaseInwardData = normalizedPurchaseInwards
//         .filter((inward: any) => inward.poTypeId === 2)
//         .flatMap((inward: any) => {
//           const itemsArray = inward.items || inward.purchaseInwardItemsDtl || [];
//           if (!Array.isArray(itemsArray)) return [];
//           const rows: any[] = [];
//           itemsArray.forEach((item: any) => {
//             const pieceArray = item.pieceEntries || item.pieces || [];
//             if (Array.isArray(pieceArray)) {
//               pieceArray.forEach((piece: any) => {
//                 const isInspected = piece.isInspected ?? 0;
//                 const isFactoryFabric = Number(piece.isFactoryFabric ?? piece.isFactoryFabricFlag ?? 0);
//                 const fabricTypeId = Number(piece.fabricTypeId ?? piece.fabric_type_id ?? 1);
//                 const pieceNumber = String(piece.pieceNumber || '').trim().toLowerCase();
//                 if (isInspected === 0 && isFactoryFabric === 0 && fabricTypeId === 1 && !inspectedPieceNumbers.has(pieceNumber)) {
//                   const fabricCode = inward.fabricCode || item?.fabricCode || '-';
//                   const fabricQuality = item?.quantityReceived?.toString() || '-';
//                   rows.push({
//                     id: `PI-${inward.id}-${piece.pieceNumber}`,
//                     sourceType: 'Purchase Inward',
//                     sourceId: inward.id,
//                     inwardDate: inward.inwardDate,
//                     orderNo: inward.purchaseOrderNo || `PO #${inward.purchaseOrderId}`,
//                     pieceNo: piece.pieceNumber,
//                     fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
//                     fabricCode,
//                     fabricQuality,
//                     vendorId: inward.vendorId,
//                     vendorName: inward.vendorId ? vendorMap[inward.vendorId] || '-' : '--',
//                     isPacked: piece.isPacked ?? 0,
//                     rawData: {
//                       ...inward,
//                       selectedPieces: [{ ...piece }],
//                       selectedItem: item,
//                       items: itemsArray,
//                       fabricCode
//                     }
//                   });
//                 }
//               });
//             }
//           });
//           return rows;
//         });

//       const jobworkData = normalizedJobworkReceives
//         .flatMap((receive: any) => {
//           const itemsArray = receive.items || receive.jobworkFabricReceiveItemsDtl || [];
//           if (!Array.isArray(itemsArray)) return [];
//           const rows: any[] = [];
//           itemsArray.forEach((item: any) => {
//             const pieceArray = item.pieceEntries || item.pieces || [];
//             if (Array.isArray(pieceArray)) {
//               pieceArray.forEach((piece: any) => {
//                 const isInspected = piece.isInspected ?? 0;
//                 const isFactoryFabric = Number(piece.isFactoryFabric ?? piece.isFactoryFabricFlag ?? 0);
//                 const fabricTypeId = Number(piece.fabricTypeId ?? piece.fabric_type_id ?? 1);
//                 const pieceNumber = String(piece.pieceNumber || '').trim().toLowerCase();
//                 if (isInspected === 0 && isFactoryFabric === 0 && fabricTypeId === 1 && !inspectedPieceNumbers.has(pieceNumber)) {
//                   const fabricCode = receive.fabricCode || item?.fabricCode || '-';
//                   const fabricQuality = receive.quality || item?.quality || '-';
//                   rows.push({
//                     id: `JW-${receive.id}-${piece.pieceNumber}`,
//                     sourceType: 'Jobwork Fabric',
//                     sourceId: receive.id,
//                     inwardDate: receive.jobFabricReceiveDate,
//                     orderNo: receive.weavingContractNo || '-',
//                     pieceNo: piece.pieceNumber,
//                     fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
//                     fabricCode,
//                     fabricQuality,
//                     vendorId: receive.vendorId,
//                     vendorName: receive.vendorId ? vendorMap[receive.vendorId] || '-' : '--',
//                     isPacked: piece.isPacked ?? 0,
//                     rawData: {
//                       ...receive,
//                       selectedPieces: [{ ...piece }],
//                       selectedItem: item,
//                       items: itemsArray,
//                       fabricCode,
//                       quality: fabricQuality
//                     }
//                   });
//                 }
//               });
//             }
//           });
//           return rows;
//         });

//       data = [...purchaseInwardData, ...jobworkData, ...openingBalanceDataAll];
//     } else {
//       const raw = normalizedFabricInspections;
//       const inspectionData = (raw || [])
//         .filter((inspection: any) => {
//           const isFactoryFabric = Number(inspection.isFactoryFabric ?? inspection.is_factory_fabric ?? 0);
//           const fabricTypeId = Number(inspection.fabricTypeId ?? inspection.fabric_type_id ?? 1);
//           const hasDetails = inspection.inspectionDetails && inspection.inspectionDetails.length > 0;
//           return hasDetails && isFactoryFabric === 0 && fabricTypeId === 1;
//         })
//         .map((inspection: any, index: number) => {
//           const fabricInspectionId = inspection.fabricInspectionId || inspection.fabric_inspection_id || inspection.inspectionId || inspection.inspection_id || inspection.id;
//           const pieceEntryId = inspection.pieceEntryId || inspection.piece_entry_id || (inspection.pieceEntries && inspection.pieceEntries[0]?.id);

//           const updatedDetails = (inspection.inspectionDetails || []).map((d: any) => ({
//             ...d,
//             pieceEntryId: pieceEntryId || d.pieceEntryId || d.piece_entry_id
//           }));
//                     const normalizedInspectionSource = String(inspection.sourceType ?? inspection.source_type ?? '').trim().toLowerCase().replace(/[_\s]+/g, ' ');
//                     const isOpeningBalanceInspection = normalizedInspectionSource === 'opening balance';

//   const resolvedVendorName = isOpeningBalanceInspection
//             ? getVendorDisplay('Opening Balance', inspection.vendorId, vendorMap, companyName)
//             : inspection.vendorId
//               ? vendorMap[inspection.vendorId] || companyName || '--'
//               : companyName || '--';
//           return {
//             ...inspection,
//             id: fabricInspectionId,
//             pieceEntryId: pieceEntryId,
//             vendorName: resolvedVendorName,
//             siNo: index + 1,
//             inspectionDetails: updatedDetails
//           };
//         });

//       data = [...inspectionData, ...openingBalanceDataAll];
//     }

//     const getTimestampValue = (item: any) => {
//       const candidates = [
//         item.inspectionDate,
//         item.inwardDate,
//         item.jobFabricReceiveDate,
//         item.date,
//         item.createdDate,
//         item.createdAt,
//         item.updatedAt,
//         item.rawData?.inspectionDate,
//         item.rawData?.inwardDate,
//         item.rawData?.jobFabricReceiveDate,
//         item.rawData?.date,
//         item.rawData?.createdDate,
//         item.rawData?.createdAt,
//         item.rawData?.updatedAt
//       ];

//       for (const candidate of candidates) {
//         if (candidate) {
//           const timestamp = new Date(candidate).getTime();
//           if (!Number.isNaN(timestamp)) {
//             return timestamp;
//           }
//         }
//       }

//       return 0;
//     };

//     const sortedData = [...data].sort((a: any, b: any) => {
//       const dateDiff = getTimestampValue(b) - getTimestampValue(a);
//       if (dateDiff !== 0) return dateDiff;
//       const aId = typeof a.id === 'string' ? parseInt(a.id.split('-')[1]) : a.id;
//       const bId = typeof b.id === 'string' ? parseInt(b.id.split('-')[1]) : b.id;
//       return (bId || 0) - (aId || 0);
//     });

//     return sortedData.map((item: any, index: number) => ({
//       ...item,
//       siNo: item.siNo || (index + 1)
//     }));
//   }, [normalizedFabricInspections, normalizedPurchaseInwards, normalizedJobworkReceives, normalizedOpeningBalances, inspectionStatus, vendorMap, fabricCodeMap, openingBalanceInspectionLookup]);

//   const getPrimaryInspectionDetail = (record: any) => {
//     const details = record.inspectionDetails ?? record.inspection_details;
//     if (Array.isArray(details) && details.length > 0) {
//       return details[0];
//     }
//     if (details && typeof details === "object") {
//       return details;
//     }
//     return undefined;
//   };

//   const formatAvgWeightValue = (value: any) => {
//     if (value == null || value === "") {
//       return undefined;
//     }
//     const numeric = Number(value);
//     if (!Number.isFinite(numeric)) {
//       return undefined;
//     }
//     return numeric.toFixed(3);
//   };

//   const resolveInspectionGrade = (record: any) => {
//     const detail = getPrimaryInspectionDetail(record);
//     const gradeIdValue =
//       record.gradeId ??
//       record.grade_id ??
//       detail?.gradeId ??
//       detail?.grade_id ??
//       record.rawData?.gradeId ??
//       record.rawData?.grade_id;
//     if (gradeIdValue != null) {
//       const mapped = gradeMap.get(String(gradeIdValue));
//       if (mapped) return mapped;
//     }
//     const fallbackGrade = [
//       record.grade,
//       record.fabricGrade,
//       record.fabric_grade,
//       record.rawData?.grade,
//       record.rawData?.fabricGrade,
//       detail?.grade,
//       detail?.fabricGrade,
//       detail?.gradeName,
//       detail?.grade_name,
//     ].find((value) => value != null && value !== "");
//     if (fallbackGrade) {
//       return String(fallbackGrade);
//     }
//     return "";
//   };

//   const resolveInspectionAvgWeight = (record: any) => {
//     const detail = getPrimaryInspectionDetail(record);
//     const candidates = [
//       record.avgWeight ?? record.avg_weight,
//       record.rawData?.avgWeight ?? record.rawData?.avg_weight,
//       detail?.avgWeight ?? detail?.avg_weight,
//     ];
//     for (const candidate of candidates) {
//       const formatted = formatAvgWeightValue(candidate);
//       if (formatted != null) return formatted;
//     }
//     const netWeightValue =
//       record.netWeight ??
//       record.net_weight ??
//       detail?.actualNetWeight ??
//       detail?.actual_net_weight;
//     const meterValue =
//       record.pieceMeters ??
//       record.piece_meters ??
//       detail?.inspectedMeters ??
//       detail?.inspected_meters;
//     const numericNet = Number(netWeightValue);
//     const numericMeter = Number(meterValue);
//     if (Number.isFinite(numericNet) && Number.isFinite(numericMeter) && numericMeter !== 0) {
//       return (numericNet / numericMeter).toFixed(3);
//     }
//     return undefined;
//   };

//   // Columns for pending tab (combined purchase inwards and jobwork receives)
//   const pendingColumns = useMemo(
//     () => [
//       {
//         Header: 'SI NO',
//         accessor: 'siNo',
//         width: 50,
//         disableFilters: true,
//       },
//       {
//         Header: "Source Type",
//         accessor: "sourceType",
//         Cell: ({ value }: { value: string }) => (
//           <span className={`px-2 py-1 rounded-full text-xs ${
//             value === 'Purchase Inward' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
//           }`}>
//             {value}
//           </span>
//         )
//       },
//       {
//         Header: "Inward Date",
//         accessor: "inwardDate",
//         Cell: ({ value }: { value: string }) => formatDate(value),
//         Filter: DateRangeFilter,
//         filter: (rows: any[], columnIds: string[], filterValue: any) => {
//           if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
//           return rows.filter(row => {
//             const dateStr = row.values[columnIds[0]];
//             const date = new Date(dateStr);
//             if (filterValue.from) {
//               const fromDate = new Date(filterValue.from);
//               if (date < fromDate) return false;
//             }
//             if (filterValue.to) {
//               const toDate = new Date(filterValue.to);
//               if (date > toDate) return false;
//             }
//             return true;
//           });
//         }
//       },
//       {
//         Header: "Purchase/Weaving Order No",
//         accessor: "orderNo",
//         width: 150
//       },
//       {
//         Header: "Piece No",
//         accessor: "pieceNo"
//       },
//       {
//         Header: "Fabric Code - Quality",
//         accessor: "fabricCodeQuality"
//       },
//       {
//         Header: 'Vendor',
//         accessor: 'vendorName'
//       },
//       {
//         Header: "Actions",
//         accessor: "actions",
//         Cell: ({ row }: any) => {
//           const data = row.original || row;
//           const hasPackedPiece = (value: any) => Number(value ?? 0) === 1;
//           const checkPiecesForPacking = (pieces: any[]) =>
//             Array.isArray(pieces) && pieces.some(piece => hasPackedPiece(piece?.isPacked ?? piece?.is_packed ?? piece?.packed ?? piece?.isPackedFlag ?? piece?.is_packed_flag));

//           const isPacked = hasPackedPiece(data?.isPacked ?? data?.is_packed ?? data?.packed) ||
//             checkPiecesForPacking(data?.selectedPieces) ||
//             checkPiecesForPacking(data?.pieceEntries) ||
//             checkPiecesForPacking(data?.rawData?.selectedPieces) ||
//             checkPiecesForPacking(data?.rawData?.pieceEntries);
          
//           if (isPacked) {
//             return (
//               <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
//                 Packed
//               </span>
//             );
//           }
          
//           return (
//             <div className="flex gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => handleView(row)}
//                 title="View Details"
//               >
//                 <Eye className="h-4 w-4" />
//               </Button>
//               <Button
//                 variant="default"
//                 size="sm"
//                 onClick={() => handleInspect(row)}
//                 title="Edit"
//               >
//                 <Edit className="h-4 w-4" />
//               </Button>
//             </div>
//           );
//         },
//       },
//     ],
//     []
//   );

//   const completedColumns = useMemo(
//     () => [
//       {
//         Header: 'SI NO',
//         accessor: 'siNo',
//         width: 50,
//         disableFilters: true,
//       },
//       {
//         Header: "Inspection Date",
//         accessor: "inspectionDate",
//         Cell: ({ value }: { value: string }) => formatDate(value),
//         Filter: DateRangeFilter,
//         filter: (rows: any[], columnIds: string[], filterValue: any) => {
//           if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
//           return rows.filter(row => {
//             const dateStr = row.values[columnIds[0]];
//             const date = new Date(dateStr);
//             if (filterValue.from) {
//               const fromDate = new Date(filterValue.from);
//               if (date < fromDate) return false;
//             }
//             if (filterValue.to) {
//               const toDate = new Date(filterValue.to);
//               if (date > toDate) return false;
//             }
//             return true;
//           });
//         }
//       },
//       {
//         Header: "Piece No",
//         accessor: "pieceNo"
//       },
//       {
//         Header: "Fabric Code",
//         accessor: "fabricCode"
//       },
//       {
//         Header: "Fabric Quality",
//         accessor: "fabricQuality"
//       },
//       {
//         Header: "Vendor",
//         accessor: "vendorName"
//       },
//       {
//         Header: "Piece Meters",
//         accessor: "pieceMeters"
//       },
//       {
//         Header: "Net Weight",
//         accessor: "netWeight"
//       },
//       {
//         Header: "Barcode",
//         accessor: "barcodeLink",
//         disableFilters: true,
//         Cell: ({ row }: { row: any }) => {
//           const record = row.original || row;
//           const barcodeValue = record.pieceNo || record.piece_no;
//           if (!barcodeValue) {
//             return <span className="text-xs text-secondary-500">-</span>;
//           }

//           const meter = record.pieceMeters ?? record.piece_meters;
//           const netWeight =
//             record.netWeight ??
//             record.net_weight ??
//             record.rawData?.netWeight ??
//             record.rawData?.net_weight;
//           const netWeightDisplay = netWeight != null ? netWeight : '--';
//           const grade = resolveInspectionGrade(record);
//           const avgWeight = resolveInspectionAvgWeight(record);
//           const companyId =
//             record.companyId ??
//             record.rawData?.companyId ??
//             record.rawData?.company_id ??
//             selectedCompanyId;
//           const link = getFabricBarcodeLink({
//             barcode: barcodeValue,
//             fabricCode: record.fabricCode || record.fabric_code || '',
//             fabricQuality: record.fabricQuality || record.fabric_quality || '',
//             grade: grade || undefined,
//             meter,
//             netWeight,
//             avgWeight,
//             companyId,
//           });

//           if (!link) {
//             return <span className="text-xs text-secondary-500">-</span>;
//           }

//           return (
//             <div className="flex flex-col">
//               <a
//                 href={link}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-600 hover:underline font-medium text-sm"
//               >
//                 Barcode
//               </a>
//             </div>
//           );
//         }
//       }

//     ],
//     [selectedCompanyId, resolveInspectionGrade, resolveInspectionAvgWeight]
//   );

//   const handleView = (row: any) => {
//     // Handle both React Table row object and raw data object
//     const inspectionData = row.original || row;
//     setCurrentInspection(inspectionData);
//     setIsViewModalOpen(true);
//   };

//   // const handleInspect = (row: any) => {
//   //   // Handle both React Table row object and raw data object
//   //   const sourceData = row.original || row;
    
//   //   // Safety check to ensure rawData exists
//   //   if (!sourceData || !sourceData.rawData) {
//   //     console.error('Missing rawData in row:', sourceData);
//   //     alert('Error: Unable to load data for inspection. Please try again.');
//   //     return;
//   //   }
    
//   //   console.log('Inspecting row:', {
//   //     sourceType: sourceData.sourceType,
//   //     hasRawData: !!sourceData.rawData,
//   //     rawDataKeys: Object.keys(sourceData.rawData || {})
//   //   });
    
//   //   navigate("/transaction/trading-fabric-inspection", {
//   //     state: {
//   //       sourceData: sourceData.rawData,
//   //       sourceType: sourceData.sourceType,
//   //       mode: 'add'
//   //     }
//   //   });
//   // };

//   const handleInspect = (row: any) => {
//     const sourceData = row.original || row;
//     navigate("/transaction/trading-fabric-inspection", {
//       state: { 
//         sourceData: sourceData.rawData,
//         sourceType: sourceData.sourceType,
//         mode: 'add',
//         returnTab: 'trading',
//         returnStatus: 'pending'
//       }
//     });
//   };

//   const handleEdit = (row: any) => {
//     if (!row) {
//       console.error('Missing inspection data:', row);
//       alert('Error: Unable to load inspection data. Please try again.');
//       return;
//     }

//     const inspectionData = row.original || row;
//     const inspectionPayload = inspectionData.rawData
//       ? { ...inspectionData.rawData, ...inspectionData }
//       : inspectionData;
//     const inspectionId = inspectionPayload.id || inspectionPayload.inspectionId;
    
//     if (!inspectionId) {
//       console.error('Missing inspection ID:', inspectionPayload);
//       alert('Error: Inspection ID not found. Please try again.');
//       return;
//     }

//     console.log('Editing inspection:', {
//       id: inspectionId,
//       hasDetails: !!inspectionPayload.inspectionDetails,
//       hasEntries: !!inspectionPayload.inspectionEntries
//     });

//     const rawSourceType = inspectionData.sourceType ?? inspectionPayload.sourceType;
//     const normalizedSourceType = typeof rawSourceType === 'string' && /opening\s*balance/i.test(rawSourceType)
//       ? 'Opening Balance'
//       : rawSourceType;

//     navigate("/transaction/trading-fabric-inspection", {
//       state: {
//         fabricInspDtl: inspectionPayload,
//         mode: 'edit',
//         returnTab: 'trading',
//         returnStatus: 'completed',
//         sourceType: normalizedSourceType
//       }
//     });
//   };

//   // Actions column for completed inspections (defined after handlers to avoid temporal dead zone)
//   const completedActionsColumn = useMemo(
//     () => {
//       const hasPackedPiece = (value: any) => Number(value ?? 0) === 1;

//       const checkPiecesForPacking = (pieces: any[]) =>
//         Array.isArray(pieces) && pieces.some(piece => hasPackedPiece(piece?.isPacked ?? piece?.is_packed ?? piece?.packed ?? piece?.isPackedFlag ?? piece?.is_packed_flag));

//       const evaluatePackedStatus = (data: any) => {
//         if (hasPackedPiece(data?.isPacked ?? data?.is_packed ?? data?.packed)) return true;
//         if (hasPackedPiece(data?.rawData?.isPacked ?? data?.rawData?.is_packed ?? data?.rawData?.packed)) return true;
//         const possibleCollections = [
//           data?.selectedPieces,
//           data?.pieceEntries,
//           data?.rawData?.selectedPieces,
//           data?.rawData?.pieces,
//           data?.rawData?.pieceEntries,
//           data?.inspectionEntries
//         ];
//         return possibleCollections.some(collection => checkPiecesForPacking(collection));
//       };

//       return {
//         Header: "Actions",
//         accessor: "actions",
//         Cell: ({ row }: any) => {
//           const data = row.original || row;
//           if (evaluatePackedStatus(data)) {
//             return (
//               <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
//                 Packed
//               </span>
//             );
//           }

//           return (
//             <div className="flex gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => handleView(row)}
//                 title="View Details"
//               >
//                 <Eye className="h-4 w-4" />
//               </Button>
//               <Button
//                 variant="default"
//                 size="sm"
//                 onClick={() => handleEdit(row)}
//                 title="Edit"
//               >
//                 <Edit className="h-4 w-4" />
//               </Button>
//             </div>
//           );
//         }
//       };
//     },
//     [handleView, handleEdit]
//   );

//   return (
//     <div className="">
//       <div className={`flex items-center mb-6 ${hideHeader ? 'justify-end' : 'justify-between'}`}>
//         {!hideHeader && (
//           <h1 className="text-xl font-bold">Greige Fabric Inspection</h1>
//         )}
//         <div className="flex items-center gap-2 bg-blue-50 p-1 rounded-md">
//           <button
//             className={`px-4 py-1 text-sm rounded-md transition-colors ${inspectionStatus === 'pending'
//               ? 'bg-primary text-white shadow-sm'
//               : 'text-blue-600 hover:bg-blue-100'
//             }`}
//             onClick={() => setInspectionStatus('pending')}
//           >
//             Pending
//           </button>
//           <button
//             className={`px-4 py-1 text-sm rounded-md transition-colors ${inspectionStatus === 'completed'
//               ? 'bg-primary text-white shadow-sm'
//               : 'text-blue-600 hover:bg-blue-100'
//             }`}
//             onClick={() => setInspectionStatus('completed')}
//           >
//             Completed
//           </button>
//         </div>
//       </div>

//       <DataTable
//         columns={inspectionStatus === 'pending' ? pendingColumns : [...completedColumns, completedActionsColumn]}
//         data={filteredData}
//         title={inspectionStatus === 'pending' ? "Pending Inspections" : "Completed Inspections"}
//         onView={handleView}
//           onEdit={handleEdit}
//         showActions={false}
//         showAddActions={false}
//         filterPlaceholder="Search..."
//         showColumnFilters={true}
//       />

//       {/* View Modal */}
//       <Modal
//         isOpen={isViewModalOpen}
//         onClose={() => setIsViewModalOpen(false)}
//         title={inspectionStatus === 'pending' ? "Source Details" : "Fabric Inspection Details"}
//         className="w-full max-w-4xl"
//       >
//         {currentInspection && (
//           <div className="space-y-4">
//             {inspectionStatus === 'pending' ? (
//               <>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-sm text-gray-500">Source Type</p>
//                     <p className="font-medium">{currentInspection.sourceType}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Inward Date</p>
//                     <p className="font-medium">{formatDate(currentInspection.inwardDate)}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Order No</p>
//                     <p className="font-medium">{currentInspection.orderNo}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Piece No</p>
//                     <p className="font-medium">{currentInspection.pieceNo}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Fabric Code - Quality</p>
//                     <p className="font-medium">{currentInspection.fabricCodeQuality}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Vendor</p>
//                     <p className="font-medium">{currentInspection.vendorName || vendorMap[currentInspection.vendorId] || '-'}</p>
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-sm text-gray-500">Inspection Date</p>
//                     <p className="font-medium">{formatDate(currentInspection.inspectionDate)}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Piece No</p>
//                     <p className="font-medium">{currentInspection.pieceNo}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Fabric Code</p>
//                     <p className="font-medium">{currentInspection.fabricCode}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Fabric Quality</p>
//                     <p className="font-medium">{currentInspection.fabricQuality}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Vendor</p>
//                     <p className="font-medium">{vendorMap[currentInspection.vendorId] || '-'}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Piece Meters</p>
//                     <p className="font-medium">{currentInspection.pieceMeters}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Net Weight</p>
//                     <p className="font-medium">{currentInspection.netWeight}</p>
//                   </div>
//                 </div>

//                 {/* Inspection Summary */}
//                 <div>
//                   <h2 className="text-lg font-semibold mt-4 mb-2">Inspection Summary</h2>
//                   {currentInspection.inspectionDetails?.length > 0 ? (
//                     <div className="overflow-x-auto">
//                       <table className="w-full border">
//                         <thead>
//                           <tr className="bg-gray-100">
//                             <th className="border p-2">S.No</th>
//                             <th className="border p-2">Piece No</th>
//                             <th className="border p-2">Inspected Meter</th>
//                             <th className="border p-2">Actual Net Weight</th>
//                             <th className="border p-2">Avg Weight</th>
//                             <th className="border p-2">Grade</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {currentInspection.inspectionDetails.map((detail: any, index: number) => (
//                             <tr key={detail.id}>
//                               <td className="border p-2 text-center">{index + 1}</td>
//                               <td className="border p-2 text-center">{detail.pieceNo || "-"}</td>
//                               <td className="border p-2 text-center">{detail.inspectedMeters || "-"}</td>
//                               <td className="border p-2 text-center">{detail.actualNetWeight || "-"}</td>
//                               <td className="border p-2 text-center">{detail.avgWeight != null && detail.avgWeight !== "" ? (Number.isNaN(Number(detail.avgWeight)) ? detail.avgWeight : Number(detail.avgWeight).toFixed(3)) : "-"}</td>
//                               <td className="border p-2 text-center">{detail.grade || "-"}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   ) : (
//                     <p className="text-gray-500">No inspection details available.</p>
//                   )}
//                 </div>

//                 {/* Inspection Entries */}
//                 <div>
//                   <h2 className="text-lg font-semibold mt-4 mb-2">Inspection Entries</h2>
//                   {currentInspection.inspectionEntries?.length > 0 ? (
//                     <div className="overflow-x-auto">
//                       <table className="w-full border">
//                         <thead>
//                           <tr className="bg-gray-100">
//                             <th className="border p-2">Defected Meters</th>
//                             <th className="border p-2">From Meters</th>
//                             <th className="border p-2">To Meters</th>
//                             <th className="border p-2">Defect Type</th>
//                             <th className="border p-2">Defect Points</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {currentInspection.inspectionEntries.map((entry: any) => {
//                             const defectType = defectMasterList?.find((defect: any) => defect.id === entry.defectTypeId);
//                             return (
//                               <tr key={entry.id}>
//                                 <td className="border p-2 text-center">{entry.defectedMeters || "-"}</td>
//                                 <td className="border p-2 text-center">{entry.fromMeters || "-"}</td>
//                                 <td className="border p-2 text-center">{entry.toMeters || "-"}</td>
//                                 <td className="border p-2 text-center">{defectType?.defectName || entry.defectTypeId || "-"}</td>
//                                 <td className="border p-2 text-center">{entry.defectPoints || "-"}</td>
//                               </tr>
//                             );
//                           })}
//                         </tbody>
//                       </table>
//                     </div>
//                   ) : (
//                     <p className="text-gray-500">No inspection entries available.</p>
//                   )}
//                 </div>
//               </>
//             )}
//             <div className="flex justify-end pt-4">
//               <button
//                 onClick={() => setIsViewModalOpen(false)}
//                 className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// }

import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { getAllFabricInspection } from "@/state/fabricInspectionsSlice";
import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
import { getAllOpeningBalance } from "@/state/openingBalanceSlice";
import { getAllJobworkFabricReceive } from "@/state/jobFabricReceiveSlice";
import { getAllPurchaseOrders } from "@/state/purchaseOrderSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllDefectMaster } from "@/state/defectMasterSlice";
import { getAllGrandMaster } from "@/state/gradeMasterSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, ClipboardCheck, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getFabricBarcodeLink, FabricBarcodePiece } from "@/lib/barcode";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getFactoryPieceEntriesByCompany, getAllFactoryPieceEntries } from "@/state/factoryPieceEntrySlice";
import { getPieceSplitsByCompany, getPieceJoinsByCompany } from "@/state/pieceSplitJoinSlice";

type TradingFabricInspectionDetailsProps = {
  hideHeader?: boolean;
};

// // Date Range Filter Component
// function DateRangeFilter({ column: { filterValue = {}, setFilter } }: any) {
//   return (
//     <div className="flex space-x-2">
//       <p className="text-sm font-normal">From</p>
//       <input
//         type="date"
//         value={filterValue.from || ''}
//         onChange={e => setFilter({ ...filterValue, from: e.target.value })}
//         placeholder="From"
//         className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
//       />
//       <p className="text-sm font-normal">To</p>
//       <input
//         type="date"
//         value={filterValue.to || ''}
//         onChange={e => setFilter({ ...filterValue, to: e.target.value })}
//         placeholder="To"
//         className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
//       />
//     </div>
//   );
// }

export function TradingFabricInspectionDetails({ hideHeader = false }: TradingFabricInspectionDetailsProps) {
  const { fabricInspectionList } = useSelector((state: RootState) => state.fabricInspections);
  const { purchaseInwardList } = useSelector((state: RootState) => state.purchaseInward);
  const { jobworkFabricReceiveList } = useSelector((state: RootState) => state.JobworkFabricReceive);
  const { openingBalanceList, paginationInfo: openingBalancePaginationInfo } = useSelector((state: RootState) => state.openingBalance);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { gradeList } = useSelector((state: RootState) => state.grade);
  const { list: pieceEntryList } = useSelector((state: RootState) => (state as any).factoryPieceEntry as any);
  const { splitList, joinList } = useSelector((state: RootState) => (state as any).pieceSplitJoin as any);

  const normalizeList = (raw: any) => {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.data?.data)) return raw.data.data;
    if (Array.isArray(raw?.rows)) return raw.rows;
    return [] as any[];
  };

  const normalizedPurchaseInwards = useMemo(() => normalizeList(purchaseInwardList), [purchaseInwardList]);
  const normalizedJobworkReceives = useMemo(() => normalizeList(jobworkFabricReceiveList), [jobworkFabricReceiveList]);
  const normalizedFabricInspections = useMemo(() => normalizeList(fabricInspectionList), [fabricInspectionList]);
  const normalizedOpeningBalances = useMemo(() => normalizeList(openingBalanceList), [openingBalanceList]);
  const normalizedPieceEntries = useMemo(() => normalizeList(pieceEntryList), [pieceEntryList]);
  const normalizedSplitList = useMemo(() => normalizeList(splitList), [splitList]);
  const normalizedJoinList = useMemo(() => normalizeList(joinList), [joinList]);
  const pieceEntryByNumberMap = useMemo(() => {
    const m = new Map<string, any>();
    normalizedPieceEntries.forEach((pe: any) => {
      const key = String(pe.pieceNumber || pe.pieceNo || '').trim().toLowerCase();
      if (key) m.set(key, pe);
    });
    return m;
  }, [normalizedPieceEntries]);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { purchaseOrderList } = useSelector((state: RootState) => state.purchaseOrder);
  const { defectMasterList } = useSelector((state: RootState) => state.defect);
  const { companyMasterList } = useSelector((state: RootState) => (state as any).companyMaster);
  const loggedInCompanyId = useResolvedCompanyId();
  const companyName = useMemo(() => {
    const list = Array.isArray(companyMasterList) ? companyMasterList : (companyMasterList?.data || []);
    const found = list.find((c: any) => Number(c.id) === loggedInCompanyId);
    return found?.companyName || found?.name || '';
  }, [companyMasterList, loggedInCompanyId]);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentInspection, setCurrentInspection] = useState<any>(null);

  const locationState = useLocation();
  const initialTab = (locationState.state as any)?.activeTab || 'pending';
  const [inspectionStatus, setInspectionStatus] = useState<'pending' | 'completed'>(initialTab as 'pending' | 'completed');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const selectedCompanyId = useMemo(() => {
    const stored = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return stored ? Number(stored) : undefined;
  }, []);

  useEffect(() => {
    const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = v ? Number(v) : undefined;

    dispatch(getAllFabricInspection({ companyId }));
    dispatch(getAllVendors({}));
    dispatch(getAllPurchaseInwards(companyId ? { companyId } : {}));
    dispatch(getAllJobworkFabricReceive(companyId ? { companyId } : {}));
    dispatch(getAllOpeningBalance(companyId ? { companyId } : {}));
    dispatch(getAllPurchaseOrders({fetchAll: true}));
    dispatch(getAllDefectMaster({}));
    dispatch(getAllGrandMaster({}));
    dispatch(getAllCompanies({ fetchAll: true }));
    dispatch(getAllFabricMasters({ fetchAll: true } as any));
    if (companyId) {
      dispatch(getFactoryPieceEntriesByCompany({ companyId }) as any);
      dispatch(getPieceSplitsByCompany(companyId) as any);
      dispatch(getPieceJoinsByCompany(companyId) as any);
    } else {
      dispatch(getAllFactoryPieceEntries({} as any) as any);
    }
  }, [dispatch]);

  const vendorMap = useMemo(() => {
    return vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
      acc[vendor.id] = vendor.vendorName;
      return acc;
    }, {}) || {};
  }, [vendorList]);

  // Create a map of PO item IDs to their details (fabricCode, fabricQuality)
  const poItemMap = useMemo(() => {
    const map: Record<number, { fabricCode: string; fabricQuality: string }> = {};
    
    if (Array.isArray(purchaseOrderList)) {
      purchaseOrderList.forEach((po: any) => {
        const items = po.items || po.purchaseOrderItemsDtl || [];
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            if (item.id) {
              map[item.id] = {
                fabricCode: item.fabricCode || '-',
                fabricQuality: item.fabricQuality || '-'
              };
            }
          });
        }
      });
    }
    
    return map;
  }, [purchaseOrderList]);

    const fabricCodeMap = useMemo(() => {
    if (!Array.isArray(fabricMasterList)) return {};
    return fabricMasterList.reduce((acc: Record<number, string>, fabric: any) => {
      if (fabric?.id) {
        acc[Number(fabric.id)] = fabric.fabricCode || fabric.code || '-';
      }
      return acc;
    }, {} as Record<number, string>);
  }, [fabricMasterList]);

  const fabricQualityMap = useMemo(() => {
    if (!Array.isArray(fabricMasterList)) return {};
    return fabricMasterList.reduce((acc: Record<number, string>, fabric: any) => {
      if (fabric?.id) {
        acc[Number(fabric.id)] = fabric.fabricQuality || fabric.quality || '-';
      }
      return acc;
    }, {} as Record<number, string>);
  }, [fabricMasterList]);

  const gradeArray = useMemo(() => {
    if (Array.isArray(gradeList)) return gradeList;
    if (Array.isArray((gradeList as any)?.data)) return (gradeList as any).data;
    return [];
  }, [gradeList]);

  const gradeMap = useMemo(() => {
    const map = new Map<string, string>();
    gradeArray.forEach((grade: any) => {
      const id = grade?.id ?? grade?.gradeId ?? grade?.grade_id;
      const name = (grade?.gradeName ?? grade?.grade_name ?? grade?.gradeCode ?? grade?.grade_code ?? '')
        .toString()
        .trim();
      if (id != null && name) {
        map.set(String(id), name);
      }
    });
    return map;
  }, [gradeArray]);

  const openingBalanceInspectionLookup = useMemo(() => {
    const map = new Map<string, any>();
    normalizedFabricInspections.forEach((inspection: any) => {
      const pieceNo = String(
        inspection.pieceNo ?? inspection.piece_no ?? inspection.pieceNumber ?? inspection.piece_number ?? ""
      )
        .trim()
        .toLowerCase();
      const pieceEntryId = inspection.pieceEntryId ?? inspection.piece_entry_id;
      const sourceType = String(inspection.sourceType ?? inspection.source_type ?? '');

      const openingBalanceId = inspection.openingBalanceId ?? inspection.opening_balance_id;
      if (openingBalanceId) {
        const normalizedBalanceId = String(openingBalanceId);
        if (pieceNo) {
          map.set(`BAL:${normalizedBalanceId}:${pieceNo}`, inspection);
        }
        if (pieceEntryId !== undefined && pieceEntryId !== null) {
          map.set(`ENTRY:${normalizedBalanceId}:${pieceEntryId}`, inspection);
        }
      }

      if (/opening.?balance/i.test(sourceType)) {
        if (pieceNo) {
          map.set(`OB_PIECE:${pieceNo}`, inspection);
          if (pieceEntryId !== undefined && pieceEntryId !== null) {
            map.set(`OB_ENTRY:${pieceEntryId}:${pieceNo}`, inspection);
          }
        }
        if (pieceEntryId !== undefined && pieceEntryId !== null) {
          map.set(`OB_ENTRY:${pieceEntryId}`, inspection);
        }
      }
    });
    return map;
  }, [normalizedFabricInspections]);

  const purchaseInwardInspectionLookup = useMemo(() => {
    const map = new Map<string, any>();
    normalizedFabricInspections.forEach((inspection: any) => {
      const piId = inspection.purchaseInwardId ?? inspection.purchase_inward_id;
      const pieceNo = String(inspection.pieceNo ?? inspection.piece_no ?? '').trim().toLowerCase();
      if (piId && pieceNo) {
        map.set(`${piId}:${pieceNo}`, inspection);
      }
    });
    return map;
  }, [normalizedFabricInspections]);

  const jobworkInspectionLookup = useMemo(() => {
    const map = new Map<string, any>();
    normalizedFabricInspections.forEach((inspection: any) => {
      const jwId = inspection.jobworkFabricReceiveId ?? inspection.jobwork_fabric_receive_id;
      const pieceNo = String(inspection.pieceNo ?? inspection.piece_no ?? '').trim().toLowerCase();
      if (jwId && pieceNo) {
        map.set(`${jwId}:${pieceNo}`, inspection);
      }
    });
    return map;
  }, [normalizedFabricInspections]);

  // Filter data based on toggle status
  const filteredData = useMemo(() => {
    let data: any[] = [];

     const getVendorDisplay = (sourceType: string, vendorId: any, vendorMap: Record<number, string>, companyName?: string) => {
    if (sourceType === 'Opening Balance') {
      return companyName; // or '--' based on your preference
    }
    return vendorId ? vendorMap[vendorId] || companyName || '--' : companyName || '--';
  };

    const isPieceInspected = (value: any) => {
      // Check for explicit true/1/yes values
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === 'completed';
      }
      if (typeof value === 'number') {
        return value === 1; // Only 1 means inspected, 0 means not inspected
      }
      if (typeof value === 'boolean') {
        return value;
      }
      return false;
    };

    const inspectedPieceNumbers = new Set(
      normalizedFabricInspections
        .filter((x: any) => Number(x?.isInspected ?? x?.is_inspected ?? 0) === 1)
        .map((x: any) => String(x?.pieceNo || '').trim().toLowerCase())
    );

    const findOpeningBalanceInspection = (balanceId: any, pieceNumber: string, pieceEntryId?: any) => {
      const normalizedBalanceId = balanceId ? String(balanceId) : null;
      const verifyMatch = (candidate: any) => {
        if (!candidate) return null;
        if (!pieceNumber) return candidate;
        const candPieceNo = String(
          candidate.pieceNo ?? candidate.piece_no ?? candidate.pieceNumber ?? candidate.piece_number ?? ""
        ).trim().toLowerCase();
        if (candPieceNo && candPieceNo !== pieceNumber) {
          return null;
        }
        return candidate;
      };

      if (normalizedBalanceId) {
        if (pieceEntryId !== undefined && pieceEntryId !== null && pieceEntryId !== '') {
          const match = verifyMatch(openingBalanceInspectionLookup.get(`ENTRY:${normalizedBalanceId}:${pieceEntryId}`));
          if (match) return match;
        }
        if (pieceNumber) {
          const match = verifyMatch(openingBalanceInspectionLookup.get(`BAL:${normalizedBalanceId}:${pieceNumber}`));
          if (match) return match;
        }
      }
      if (pieceNumber) {
        const match = verifyMatch(openingBalanceInspectionLookup.get(`OB_PIECE:${pieceNumber}`));
        if (match) return match;
      }
      if (pieceEntryId !== undefined && pieceEntryId !== null && pieceEntryId !== '') {
        if (pieceNumber) {
          const matchWithPiece = verifyMatch(openingBalanceInspectionLookup.get(`OB_ENTRY:${pieceEntryId}:${pieceNumber}`));
          if (matchWithPiece) return matchWithPiece;
        }
        const match = verifyMatch(openingBalanceInspectionLookup.get(`OB_ENTRY:${pieceEntryId}`));
        if (match) return match;
      }
      return null;
    };

    const openingBalanceDataAll = (normalizedOpeningBalances || [])
      .filter((balance: any) => (balance.goodsType || '').toString().toLowerCase() === 'fabric')
      .reduce((acc: any[], balance: any) => {
        const itemsArray = Array.isArray(balance.fabricItems)
          ? balance.fabricItems
          : Array.isArray(balance.items)
            ? balance.items
            : [];
        if (!itemsArray.length) return acc;

        itemsArray.forEach((item: any, itemIndex: number) => {
          const pieceNumber = String(item.pieceNo || item.pieceNumber || '').trim().toLowerCase();
          const inspected = isPieceInspected(item.isInspected) || inspectedPieceNumbers.has(pieceNumber);

          if (inspectionStatus === 'pending' && !inspected) {
            const pieceEntryId = item.id ?? item.pieceEntryId;
            const matchingInspection = findOpeningBalanceInspection(balance.id, pieceNumber, pieceEntryId);

            const fabricCodeIdValue = item?.fabricCodeId ?? item?.fabricMasterId ?? balance.fabricCodeId;
            const normalizedFabricCodeId = fabricCodeIdValue ? Number(fabricCodeIdValue) : undefined;
            const fabricCodeFromMaster = normalizedFabricCodeId ? fabricCodeMap[normalizedFabricCodeId] : undefined;
            const fabricCode = fabricCodeFromMaster || item?.fabricCode || balance.fabricCode || '-';
            const fabricQuality = item?.quality || '-';
            const inwardDate = balance.date || balance.createdDate || balance.createdAt || balance.updatedAt || '';
            const resolvedVendorName = getVendorDisplay('Opening Balance', balance.vendorId, vendorMap, companyName);

            const inspectionId = matchingInspection?.fabricInspectionId ?? matchingInspection?.id;

            
            acc.push({
              id: `OB-${balance.id}-${item.id || itemIndex + 1}`,
              sourceType: 'Opening Balance',
              sourceId: balance.id,
              inwardDate,
              orderNo: '--',
              pieceNo: item.pieceNo || item.pieceNumber || `Piece ${itemIndex + 1}`,
              fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
              fabricCode,
              fabricQuality,
              vendorId: balance.vendorId,
              vendorName: resolvedVendorName,
              isPacked: item.isPacked ?? 0,
              rawData: {
                ...balance,
                ...matchingInspection,
                id: inspectionId,
                fabricInspectionId: inspectionId,
                selectedPieces: [{
                  pieceNumber: item.pieceNo || item.pieceNumber,
                  quantity: Number(item.pieceMeter) || 0,
                  weight: Number(item.netWeight) || 0,
                  cost: Number(item.cost) || 0,
                  isPacked: item.isPacked ?? 0,
                  openingBalanceItemId: item.id,
                  openingBalanceItem: item
                }],
                selectedItem: item,
                items: itemsArray,
                fabricCode,
                fabricCodeId: normalizedFabricCodeId,
                quality: fabricQuality,
                openingBalanceId: balance.id
              }
            });
          } else if (inspectionStatus === 'completed' && inspected) {
            const pieceEntryId = item.id ?? item.pieceEntryId;
            const matchingInspection = findOpeningBalanceInspection(balance.id, pieceNumber, pieceEntryId);
            const fabricCodeIdValue =
              matchingInspection?.fabricCodeId ??
              matchingInspection?.fabric_code_id ??
              item?.fabricCodeId ??
              item?.fabricMasterId ??
              balance.fabricCodeId;
            const normalizedFabricCodeId = fabricCodeIdValue ? Number(fabricCodeIdValue) : undefined;
            const fabricCodeFromMaster = normalizedFabricCodeId ? fabricCodeMap[normalizedFabricCodeId] : undefined;
            const fabricCode = matchingInspection?.fabricCode || fabricCodeFromMaster || item?.fabricCode || balance.fabricCode || '-';
            const fabricQuality = matchingInspection?.fabricQuality || item?.quality || '-';
            const inspectionDate =
              matchingInspection?.inspectionDate ||
              matchingInspection?.createdDate ||
              matchingInspection?.createdAt ||
              balance.date ||
              balance.createdDate ||
              '';
            const pieceMeters =
              matchingInspection?.pieceMeters ??
              matchingInspection?.pieceMeter ??
              item?.pieceMeter ??
              0;
            const netWeight =
              matchingInspection?.actualNetWeight ??
              matchingInspection?.netWeight ??
              item?.netWeight ??
              0;
            const savedInspectionDetails =
              matchingInspection?.inspectionDetails ??
              matchingInspection?.fabricInspectionDetails ??
              [];
            const savedInspectionEntries =
              matchingInspection?.inspectionEntries ??
              matchingInspection?.inspection_entries ??
              [];
            const inspectionId =
              matchingInspection?.fabricInspectionId ??
              matchingInspection?.fabric_inspection_id ??
              matchingInspection?.inspectionId ??
              matchingInspection?.inspection_id ??
              matchingInspection?.id;
            const inspectionIdString = inspectionId ? String(inspectionId) : '';
            const fallbackGrade =
              matchingInspection?.fabricGrade ||
              matchingInspection?.grade ||
              item?.grade ||
              '';
            const pieceMetersString = String(pieceMeters || 0);
            const netWeightString = String(netWeight || 0);
            const avgWeightValue = pieceMeters > 0 ? (netWeight / pieceMeters).toFixed(3) : '0';
            const fallbackTotalDefectPoints = String(
              matchingInspection?.totalDefectPoints ??
              matchingInspection?.total_defect_points ??
              0
            );
            const fallbackDefectCounts = String(
              matchingInspection?.defectCounts ??
              matchingInspection?.defect_counts ??
              0
            );
            const fallbackDetails = [
              {
                fabricInspectionId: inspectionIdString,
                pieceNo: item.pieceNo || item.pieceNumber || '',
                pieceEntryId,
                pieceMeters: pieceMetersString,
                inspectedMeters: pieceMetersString,
                actualNetWeight: netWeightString,
                avgWeight: avgWeightValue,
                totalDefectPoints: fallbackTotalDefectPoints,
                defectCounts: fallbackDefectCounts,
                grade: fallbackGrade,
                activeFlag: true
              }
            ];
            const finalInspectionDetails = savedInspectionDetails.length > 0 ? savedInspectionDetails : fallbackDetails;
            const finalInspectionEntries = savedInspectionEntries.length > 0 ? savedInspectionEntries : [];
            const vendorIdValue = matchingInspection?.vendorId ?? matchingInspection?.vendor_id ?? balance.vendorId;
            const resolvedVendorId = vendorIdValue ? Number(vendorIdValue) : balance.vendorId;
  
            const resolvedVendorName = getVendorDisplay('Opening Balance', resolvedVendorId, vendorMap, companyName);
            
            const computedId = inspectionId ? inspectionId : `OB-COMP-${balance.id}-${item.id || itemIndex + 1}`;
            const fallbackPieceNumber = item.pieceNo || item.pieceNumber || '';
            const fallbackPieceQuantity = Number(item.pieceMeter ?? item.quantity ?? item.quantityReceived ?? 0);
            const fallbackPieceWeight = Number(item.netWeight ?? item.weight ?? 0);
            const fallbackSelectedPiece = {
              pieceNumber: fallbackPieceNumber,
              pieceEntryId: pieceEntryId ?? item.id,
              quantity: isNaN(fallbackPieceQuantity) ? 0 : fallbackPieceQuantity,
              weight: isNaN(fallbackPieceWeight) ? 0 : fallbackPieceWeight,
              cost: Number(item.cost ?? 0),
              isPacked: item.isPacked ?? 0,
              openingBalanceItemId: item.id,
              openingBalanceItem: item
            };
            const rawData = {
              ...balance,
              ...matchingInspection,
              id: inspectionId ?? computedId,
              inspectionId: inspectionId ?? computedId,
              fabricInspectionId: inspectionId,
              sourceType: 'Opening Balance',
              openingBalanceId: balance.id,
              vendorId: resolvedVendorId,
              vendorName: resolvedVendorName,
              fabricCode,
              quality: fabricQuality,
              pieceMeters,
              netWeight,
              pieceNo: fallbackPieceNumber,
              selectedPieces: [fallbackSelectedPiece],
              selectedItem: item,
              items: itemsArray,
              inspectionDetails: finalInspectionDetails,
              inspectionEntries: finalInspectionEntries
            };

              const actualId = inspectionId; // This should be the numeric ID from the database
const displayId = actualId ? String(actualId) : `OB-COMP-${balance.id}-${item.id || itemIndex + 1}`;

            acc.push({
              // id: computedId,
               id: actualId, // Use numeric ID for backend
  displayId: displayId,
              sourceType: 'Opening Balance',
              inspectionDate,
              pieceNo: matchingInspection?.pieceNo || fallbackPieceNumber || '-',
              fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
              fabricCode,
              fabricQuality,
              vendorId: resolvedVendorId,
              vendorName: resolvedVendorName,
              pieceMeters,
              netWeight,
              inspectionDetails: finalInspectionDetails,
              inspectionEntries: finalInspectionEntries,
              rawData
            });
          }
        });

        return acc;
      }, [] as any[]);

    if (inspectionStatus === 'pending') {
      const purchaseInwardData = normalizedPurchaseInwards
        .filter((inward: any) => inward.poTypeId === 2)
        .flatMap((inward: any) => {
          const itemsArray = inward.items || inward.purchaseInwardItemsDtl || [];
          if (!Array.isArray(itemsArray)) return [];
          const rows: any[] = [];
          itemsArray.forEach((item: any) => {
            const pieceArray = item.pieceEntries || item.pieces || [];
            if (Array.isArray(pieceArray)) {
              pieceArray.forEach((piece: any) => {
                const isInspected = piece.isInspected ?? 0;
                const isFactoryFabric = Number(piece.isFactoryFabric ?? piece.isFactoryFabricFlag ?? 0);
                const fabricTypeId = Number(piece.fabricTypeId ?? piece.fabric_type_id ?? 1);
                const pieceNumber = String(piece.pieceNumber || '').trim().toLowerCase();
                if (isInspected === 0 && isFactoryFabric === 0 && fabricTypeId === 1 && !inspectedPieceNumbers.has(pieceNumber)) {
                  const pieceFabricMasterId = piece.fabricMasterId ?? piece.fabric_master_id ?? item?.fabricMasterId ?? item?.fabricCodeId ?? null;
                  const fabricCodeFromMaster = pieceFabricMasterId ? fabricCodeMap[Number(pieceFabricMasterId)] : undefined;
                  const fabricQualityFromMaster = pieceFabricMasterId ? fabricQualityMap[Number(pieceFabricMasterId)] : undefined;
                  const fabricCode = fabricCodeFromMaster || inward.fabricCode || item?.fabricCode || '-';
                  const fabricQuality = fabricQualityFromMaster || inward.quality || item?.quality || '-';
                  const existingPIInspection = purchaseInwardInspectionLookup.get(`${inward.id}:${pieceNumber}`);
                  const existingInspectionId = existingPIInspection?.id;
                  rows.push({
                    id: `PI-${inward.id}-${piece.pieceNumber}`,
                    sourceType: 'Purchase Inward',
                    sourceId: inward.id,
                    inwardDate: inward.inwardDate,
                    orderNo: inward.purchaseOrderNo || `PO #${inward.purchaseOrderId}`,
                    pieceNo: piece.pieceNumber,
                    fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
                    fabricCode,
                    fabricQuality,
                    vendorId: inward.vendorId,
                    vendorName: inward.vendorId ? vendorMap[inward.vendorId] || '-' : '--',
                    isPacked: piece.isPacked ?? 0,
                    rawData: {
                      ...inward,
                      ...(existingPIInspection ?? {}),
                      vendorId: inward.vendorId,
                      fabricInspectionId: existingInspectionId,
                      id: existingInspectionId,
                      purchaseInwardId: inward.id,
                      selectedPieces: [{ ...piece }],
                      selectedItem: item,
                      items: itemsArray,
                      fabricCode,
                      quality: fabricQuality,
                    }
                  });
                }
              });
            }
          });
          return rows;
        });

      const jobworkData = normalizedJobworkReceives
        .flatMap((receive: any) => {
          const itemsArray = receive.items || receive.jobworkFabricReceiveItemsDtl || [];
          if (!Array.isArray(itemsArray)) return [];
          const rows: any[] = [];
          itemsArray.forEach((item: any) => {
            const pieceArray = item.pieceEntries || item.pieces || [];
            if (Array.isArray(pieceArray)) {
              pieceArray.forEach((piece: any) => {
                const isInspected = piece.isInspected ?? 0;
                const isFactoryFabric = Number(piece.isFactoryFabric ?? piece.isFactoryFabricFlag ?? 0);
                const fabricTypeId = Number(piece.fabricTypeId ?? piece.fabric_type_id ?? 1);
                const pieceNumber = String(piece.pieceNumber || '').trim().toLowerCase();
                if (isInspected === 0 && isFactoryFabric === 0 && fabricTypeId === 1 && !inspectedPieceNumbers.has(pieceNumber)) {
                  const pieceFabricMasterId = piece.fabricMasterId ?? piece.fabric_master_id ?? item?.fabricMasterId ?? item?.fabricCodeId ?? null;
                  const fabricCodeFromMaster = pieceFabricMasterId ? fabricCodeMap[Number(pieceFabricMasterId)] : undefined;
                  const fabricQualityFromMaster = pieceFabricMasterId ? fabricQualityMap[Number(pieceFabricMasterId)] : undefined;
                  const fabricCode = fabricCodeFromMaster || receive.fabricCode || item?.fabricCode || '-';
                  const fabricQuality = fabricQualityFromMaster || receive.quality || item?.quality || '-';
                  const existingJWInspection = jobworkInspectionLookup.get(`${receive.id}:${pieceNumber}`);
                  const existingJWInspectionId = existingJWInspection?.id;
                  rows.push({
                    id: `JW-${receive.id}-${piece.pieceNumber}`,
                    sourceType: 'Jobwork Fabric',
                    sourceId: receive.id,
                    inwardDate: receive.jobFabricReceiveDate,
                    orderNo: receive.weavingContractNo || '-',
                    pieceNo: piece.pieceNumber,
                    fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
                    fabricCode,
                    fabricQuality,
                    vendorId: receive.vendorId,
                    vendorName: receive.vendorId ? vendorMap[receive.vendorId] || '-' : '--',
                    isPacked: piece.isPacked ?? 0,
                    rawData: {
                      ...receive,
                      ...(existingJWInspection ?? {}),
                      vendorId: receive.vendorId,
                      fabricInspectionId: existingJWInspectionId,
                      id: existingJWInspectionId,
                      jobworkFabricReceiveId: receive.id,
                      selectedPieces: [{ ...piece }],
                      selectedItem: item,
                      items: itemsArray,
                      fabricCode,
                      fabricMasterId: pieceFabricMasterId ?? existingJWInspection?.fabricMasterId ?? null,
                      quality: fabricQuality
                    }
                  });
                }
              });
            }
          });
          return rows;
        });

      const pieceSplitData = normalizedSplitList.flatMap((split: any) => {
          const details: any[] = split.splitPiecesDetails || [];
          const inwardDate = split.operationDate || split.createdAt || '';
          return details
            .filter((detail: any) => {
              const pieceNo = String(detail.pieceNo || '').trim().toLowerCase();
              if (!pieceNo) return false;
              if (inspectedPieceNumbers.has(pieceNo)) return false;
              const pieceEntry = pieceEntryByNumberMap.get(pieceNo);
              if (pieceEntry && Number(pieceEntry.isInspected ?? 0) === 1) return false;
              return true;
            })
            .map((detail: any) => {
              const fabricMasterId = detail.fabricMasterId ?? split.fabricMasterId ?? null;
              const fabricCode = fabricMasterId ? (fabricCodeMap[Number(fabricMasterId)] || '-') : '-';
              const fabricQuality = fabricMasterId ? (fabricQualityMap[Number(fabricMasterId)] || '-') : '-';
              const pieceEntry = pieceEntryByNumberMap.get(String(detail.pieceNo || '').trim().toLowerCase());
              const pieceEntryId = pieceEntry?.id ?? undefined;
              return {
                id: `SPLIT-${split.id}-${detail.id}`,
                sourceType: 'Piece Split',
                sourceId: split.id,
                inwardDate,
                orderNo: split.pieceSplitNo || '--',
                pieceNo: detail.pieceNo,
                fabricCodeQuality: [fabricCode, fabricQuality].filter(v => v && v !== '-').join(' - ') || '-',
                fabricCode,
                fabricQuality,
                vendorId: null,
                vendorName: companyName || '--',
                isPacked: pieceEntry?.isPacked ?? 0,
                rawData: {
                  ...split,
                  fabricMasterId,
                  fabricCode,
                  quality: fabricQuality,
                  selectedPieces: [{
                    pieceNumber: detail.pieceNo,
                    pieceEntryId,
                    quantity: Number(detail.pieceMeter || 0),
                    weight: Number(detail.netWeight || 0),
                    cost: 0,
                    isPacked: pieceEntry?.isPacked ?? 0,
                  }],
                  sourceType: 'Piece Split',
                }
              };
            });
        });

      const pieceJoinData = normalizedJoinList
        .filter((join: any) => {
          const pieceNo = String(join.joinedPieceNo || '').trim().toLowerCase();
          if (!pieceNo) return false;
          if (inspectedPieceNumbers.has(pieceNo)) return false;
          const pieceEntry = pieceEntryByNumberMap.get(pieceNo);
          if (pieceEntry && Number(pieceEntry.isInspected ?? 0) === 1) return false;
          return true;
        })
        .map((join: any) => {
          const detailWithFabric = (join.joinPiecesDetails || []).find((d: any) => d.fabricMasterId != null);
          const fabricMasterId = join.fabricMasterId ?? detailWithFabric?.fabricMasterId ?? null;
          const fabricCode = fabricMasterId ? (fabricCodeMap[Number(fabricMasterId)] || '-') : '-';
          const fabricQuality = fabricMasterId ? (fabricQualityMap[Number(fabricMasterId)] || '-') : '-';
          const inwardDate = join.operationDate || join.createdAt || '';
          const pieceEntry = pieceEntryByNumberMap.get(String(join.joinedPieceNo || '').trim().toLowerCase());
          const pieceEntryId = pieceEntry?.id ?? undefined;
          const totalWeight = (join.joinPiecesDetails || []).reduce((sum: number, d: any) => sum + Number(d.netWeight || 0), 0);
          return {
            id: `JOIN-${join.id}`,
            sourceType: 'Piece Join',
            sourceId: join.id,
            inwardDate,
            orderNo: join.pieceJoinNo || '--',
            pieceNo: join.joinedPieceNo,
            fabricCodeQuality: [fabricCode, fabricQuality].filter(v => v && v !== '-').join(' - ') || '-',
            fabricCode,
            fabricQuality,
            vendorId: null,
            vendorName: companyName || '--',
            isPacked: pieceEntry?.isPacked ?? 0,
            rawData: {
              ...join,
              fabricMasterId,
              fabricCode,
              quality: fabricQuality,
              selectedPieces: [{
                pieceNumber: join.joinedPieceNo,
                pieceEntryId,
                quantity: Number(join.joinedPieceMeter || 0),
                weight: totalWeight,
                cost: 0,
                isPacked: pieceEntry?.isPacked ?? 0,
              }],
              sourceType: 'Piece Join',
            }
          };
        });

      const pieceSplitJoinData = [...pieceSplitData, ...pieceJoinData];

      data = [...purchaseInwardData, ...jobworkData, ...openingBalanceDataAll, ...pieceSplitJoinData];
    } else {
      const raw = normalizedFabricInspections;
      const inspectionData = (raw || [])
        .filter((inspection: any) => {
          const isFactoryFabric = Number(inspection.isFactoryFabric ?? inspection.is_factory_fabric ?? 0);
          const fabricTypeId = Number(inspection.fabricTypeId ?? inspection.fabric_type_id ?? 1);
          const hasDetails = inspection.inspectionDetails && inspection.inspectionDetails.length > 0;
          const normalizedSourceType = String(inspection.sourceType ?? inspection.source_type ?? '').trim().toLowerCase().replace(/[_\s]+/g, ' ');
          const isOpeningBalance = normalizedSourceType === 'opening balance';
          return hasDetails && isFactoryFabric === 0 && fabricTypeId === 1 && !isOpeningBalance;
        })
        .map((inspection: any, index: number) => {
          const fabricInspectionId = inspection.fabricInspectionId || inspection.fabric_inspection_id || inspection.inspectionId || inspection.inspection_id || inspection.id;
          const pieceEntryId = inspection.pieceEntryId || inspection.piece_entry_id || (inspection.pieceEntries && inspection.pieceEntries[0]?.id);

          const updatedDetails = (inspection.inspectionDetails || []).map((d: any) => ({
            ...d,
            pieceEntryId: pieceEntryId || d.pieceEntryId || d.piece_entry_id
          }));
                    const normalizedInspectionSource = String(inspection.sourceType ?? inspection.source_type ?? '').trim().toLowerCase().replace(/[_\s]+/g, ' ');
                    const isOpeningBalanceInspection = normalizedInspectionSource === 'opening balance';

  const resolvedVendorName = isOpeningBalanceInspection
            ? getVendorDisplay('Opening Balance', inspection.vendorId, vendorMap, companyName)
            : inspection.vendorId
              ? vendorMap[inspection.vendorId] || companyName || '--'
              : companyName || '--';
          return {
            ...inspection,
            id: fabricInspectionId,
            pieceEntryId: pieceEntryId,
            vendorName: resolvedVendorName,
            siNo: index + 1,
            inspectionDetails: updatedDetails
          };
        });

      data = [...inspectionData, ...openingBalanceDataAll];
    }

    const getTimestampValue = (item: any) => {
      const candidates = [
        item.inspectionDate,
        item.inwardDate,
        item.jobFabricReceiveDate,
        item.date,
        item.createdDate,
        item.createdAt,
        item.updatedAt,
        item.rawData?.inspectionDate,
        item.rawData?.inwardDate,
        item.rawData?.jobFabricReceiveDate,
        item.rawData?.date,
        item.rawData?.createdDate,
        item.rawData?.createdAt,
        item.rawData?.updatedAt
      ];

      for (const candidate of candidates) {
        if (candidate) {
          const timestamp = new Date(candidate).getTime();
          if (!Number.isNaN(timestamp)) {
            return timestamp;
          }
        }
      }

      return 0;
    };

    const sortedData = [...data].sort((a: any, b: any) => {
      const dateDiff = getTimestampValue(b) - getTimestampValue(a);
      if (dateDiff !== 0) return dateDiff;
      const aId = typeof a.id === 'string' ? parseInt(a.id.split('-')[1]) : a.id;
      const bId = typeof b.id === 'string' ? parseInt(b.id.split('-')[1]) : b.id;
      return (bId || 0) - (aId || 0);
    });

    return sortedData.map((item: any, index: number) => ({
      ...item,
      siNo: index + 1
    }));
  }, [normalizedFabricInspections, normalizedPurchaseInwards, normalizedJobworkReceives, normalizedOpeningBalances, normalizedSplitList, normalizedJoinList, pieceEntryByNumberMap, inspectionStatus, vendorMap, fabricCodeMap, fabricQualityMap, openingBalanceInspectionLookup, purchaseInwardInspectionLookup, jobworkInspectionLookup, companyName]);

  const getPrimaryInspectionDetail = (record: any) => {
    const details = record.inspectionDetails ?? record.inspection_details;
    if (Array.isArray(details) && details.length > 0) {
      return details[0];
    }
    if (details && typeof details === "object") {
      return details;
    }
    return undefined;
  };

  const formatAvgWeightValue = (value: any) => {
    if (value == null || value === "") {
      return undefined;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return undefined;
    }
    return numeric.toFixed(3);
  };

  const resolveInspectionGrade = (record: any) => {
    const detail = getPrimaryInspectionDetail(record);
    const gradeIdValue =
      record.gradeId ??
      record.grade_id ??
      detail?.gradeId ??
      detail?.grade_id ??
      record.rawData?.gradeId ??
      record.rawData?.grade_id;
    if (gradeIdValue != null) {
      const mapped = gradeMap.get(String(gradeIdValue));
      if (mapped) return mapped;
    }
    const fallbackGrade = [
      record.grade,
      record.fabricGrade,
      record.fabric_grade,
      record.rawData?.grade,
      record.rawData?.fabricGrade,
      detail?.grade,
      detail?.fabricGrade,
      detail?.gradeName,
      detail?.grade_name,
    ].find((value) => value != null && value !== "");
    if (fallbackGrade) {
      return String(fallbackGrade);
    }
    return "";
  };

  const resolveInspectionAvgWeight = (record: any) => {
    const detail = getPrimaryInspectionDetail(record);
    const candidates = [
      record.avgWeight ?? record.avg_weight,
      record.rawData?.avgWeight ?? record.rawData?.avg_weight,
      detail?.avgWeight ?? detail?.avg_weight,
    ];
    for (const candidate of candidates) {
      const formatted = formatAvgWeightValue(candidate);
      if (formatted != null) return formatted;
    }
    const netWeightValue =
      record.netWeight ??
      record.net_weight ??
      detail?.actualNetWeight ??
      detail?.actual_net_weight;
    const meterValue =
      record.pieceMeters ??
      record.piece_meters ??
      detail?.inspectedMeters ??
      detail?.inspected_meters;
    const numericNet = Number(netWeightValue);
    const numericMeter = Number(meterValue);
    if (Number.isFinite(numericNet) && Number.isFinite(numericMeter) && numericMeter !== 0) {
      return (numericNet / numericMeter).toFixed(3);
    }
    return undefined;
  };

  const extractPieceEntriesForRow = useCallback((record: any): FabricBarcodePiece[] => {
    const barcodeValue = record.pieceNo || record.piece_no;
    if (!barcodeValue) return [];
    const grade = resolveInspectionGrade(record);
    const avgWeight = resolveInspectionAvgWeight(record);
    return [{
      barcode: barcodeValue,
      fabricCode: record.fabricCode || record.fabric_code || '',
      fabricQuality: record.fabricQuality || record.fabric_quality || '',
      grade: grade || undefined,
      meter: record.pieceMeters ?? record.piece_meters,
      netWeight: record.netWeight ?? record.net_weight ?? undefined,
      avgWeight: avgWeight ?? undefined,
    }];
  }, [resolveInspectionGrade, resolveInspectionAvgWeight]);

  const handleToggleRow = useCallback((id: any) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean, data: any[]) => {
    setSelectedIds(checked ? new Set(data.map((r: any) => r.id)) : new Set());
  }, []);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleCancelSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleOpenBarcodeStickerPage = useCallback(() => {
    const allEntries: FabricBarcodePiece[] = [];
    for (const id of selectedIds) {
      const row = filteredData.find((r: any) => r.id === id);
      if (row) allEntries.push(...extractPieceEntriesForRow(row));
    }
    if (!allEntries.length) return;
    const link = getFabricBarcodeLink({ barcode: allEntries[0].barcode, pieceEntries: allEntries, companyId: selectedCompanyId });
    if (link) window.open(link, '_blank');
    setIsBulkPrintModalOpen(false);
  }, [selectedIds, filteredData, extractPieceEntriesForRow, selectedCompanyId]);

  const totalBarcodeCount = useMemo(() => {
    let count = 0;
    for (const id of selectedIds) {
      const row = filteredData.find((r: any) => r.id === id);
      if (row) count += extractPieceEntriesForRow(row).length;
    }
    return count;
  }, [selectedIds, filteredData, extractPieceEntriesForRow]);

  const checkboxColumn = useMemo(() => ({
    id: 'bulkSelect',
    Header: (
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked, filteredData)}
          className="w-3.5 h-3.5 cursor-pointer accent-black"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
        <span className="text-xs font-semibold">All</span>
      </div>
    ),
    accessor: 'id',
    disableFilters: true,
    width: 60,
    Cell: ({ row }: { row: any }) => {
      const id = row.original.id;
      return (
        <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <input type="checkbox" checked={selectedIds.has(id)} onChange={() => handleToggleRow(id)} className="w-3.5 h-3.5 cursor-pointer accent-black" />
        </div>
      );
    }
  }), [filteredData, selectedIds, handleSelectAll, handleToggleRow]);

  const handleView = useCallback((row: any) => {
    // Handle both React Table row object and raw data object
    const inspectionData = row.original || row;
    setCurrentInspection(inspectionData);
    setIsViewModalOpen(true);
  }, []);

  const handleInspect = useCallback((row: any) => {
    const sourceData = row.original || row;
    const existingInspectionId = sourceData.rawData?.fabricInspectionId;

    const sourcePayload = sourceData.rawData ? { ...sourceData.rawData } : { ...sourceData };
    if (!sourcePayload.pieceNo && sourceData.pieceNo) {
      sourcePayload.pieceNo = sourceData.pieceNo;
    }

    navigate("/transaction/trading-fabric-inspection", {
      state: { 
        sourceData: sourcePayload,
        fabricInspDtl: existingInspectionId ? sourcePayload : undefined,
        sourceType: sourceData.sourceType,
        mode: existingInspectionId ? 'edit' : 'add',
        returnTab: 'trading',
        returnStatus: 'pending'
      }
    });
  }, [navigate]);

  const handleEdit = useCallback((row: any) => {
    if (!row) {
      console.error('Missing inspection data:', row);
      alert('Error: Unable to load inspection data. Please try again.');
      return;
    }

    const inspectionData = row.original || row;
    const rawData = inspectionData.rawData;
    
    // ALWAYS prefer the numeric ID from rawData for opening balance entries
    let inspectionId = null;
    
    if (rawData) {
      inspectionId = rawData.fabricInspectionId || 
                     rawData.fabric_inspection_id || 
                     rawData.inspectionId || 
                     rawData.inspection_id ||
                     (typeof rawData.id === 'number' ? rawData.id : null);
    }
    
    // Fallback to direct numeric ID check
    if (!inspectionId && typeof inspectionData.id === 'number') {
      inspectionId = inspectionData.id;
    }
    
    // For synthetic string IDs (like OB-COMP-*), try to get from rawData again
    if (!inspectionId && typeof inspectionData.id === 'string' && inspectionData.id.startsWith('OB-COMP-')) {
      console.warn('Synthetic ID detected, checking rawData for numeric ID');
      if (rawData?.fabricInspectionId && typeof rawData.fabricInspectionId === 'number') {
        inspectionId = rawData.fabricInspectionId;
      }
    }
    
    if (!inspectionId) {
      console.error('Missing numeric inspection ID:', { inspectionData, rawData });
      alert('Error: Unable to find valid inspection ID. Please try again.');
      return;
    }

    const inspectionPayload = rawData
      ? { ...rawData, ...inspectionData, id: inspectionId, fabricInspectionId: inspectionId }
      : { ...inspectionData, id: inspectionId, fabricInspectionId: inspectionId };

    console.log('Editing inspection:', {
      id: inspectionId,
      hasDetails: !!inspectionPayload.inspectionDetails,
      hasEntries: !!inspectionPayload.inspectionEntries
    });

    const rawSourceType = inspectionData.sourceType ?? inspectionPayload.sourceType;
    const normalizedSourceType = typeof rawSourceType === 'string' && /opening\s*balance/i.test(rawSourceType)
      ? 'Opening Balance'
      : rawSourceType;

    navigate("/transaction/trading-fabric-inspection", {
      state: {
        fabricInspDtl: inspectionPayload,
        mode: 'edit',
        returnTab: 'trading',
        returnStatus: 'completed',
        sourceType: normalizedSourceType
      }
    });
  }, [navigate]);

  // Columns for pending tab (combined purchase inwards and jobwork receives)
  const pendingColumns = useMemo(
    () => [
      {
        Header: 'SI NO',
        accessor: 'siNo',
        width: 50,
        disableFilters: true,
      },
      {
        Header: "Source Type",
        accessor: "sourceType",
        Cell: ({ value }: { value: string }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${
            value === 'Purchase Inward' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
            {value}
          </span>
        )
      },
      {
        Header: "Inward Date",
        accessor: "inwardDate",
        Cell: ({ value }: { value: string }) => formatDate(value),
        Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
          return rows.filter(row => {
            const dateStr = row.values[columnIds[0]];
            const date = new Date(dateStr);
            if (filterValue.from) {
              const fromDate = new Date(filterValue.from);
              if (date < fromDate) return false;
            }
            if (filterValue.to) {
              const toDate = new Date(filterValue.to);
              if (date > toDate) return false;
            }
            return true;
          });
        }
      },
      {
        Header: "Purchase/Weaving Order No",
        accessor: "orderNo",
        width: 150
      },
      {
        Header: "Piece No",
        accessor: "pieceNo"
      },
      {
        Header: "Sort No/Construction",
        accessor: "fabricCodeQuality"
      },
      {
        Header: 'Vendor',
        accessor: 'vendorName'
      },
      {
        Header: "Actions",
        accessor: "actions",
        disableFilters: true,
        width: 'auto',
        Cell: ({ row }: any) => {
          const data = row.original || row;
          const hasPackedPiece = (value: any) => Number(value ?? 0) === 1;
          const checkPiecesForPacking = (pieces: any[]) =>
            Array.isArray(pieces) && pieces.some(piece => hasPackedPiece(piece?.isPacked ?? piece?.is_packed ?? piece?.packed ?? piece?.isPackedFlag ?? piece?.is_packed_flag));

          const isPacked = hasPackedPiece(data?.isPacked ?? data?.is_packed ?? data?.packed) ||
            checkPiecesForPacking(data?.selectedPieces) ||
            checkPiecesForPacking(data?.pieceEntries) ||
            checkPiecesForPacking(data?.rawData?.selectedPieces) ||
            checkPiecesForPacking(data?.rawData?.pieceEntries);
          
          if (isPacked) {
            return (
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Packed
              </span>
            );
          }
          
          return (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(row)}
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleInspect(row)}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleView, handleInspect]
  );

  const completedColumns = useMemo(
    () => [
      {
        Header: 'SI NO',
        accessor: 'siNo',
        width: 50,
        disableFilters: true,
      },
      {
        Header: "Inspection Date",
        accessor: "inspectionDate",
        Cell: ({ value }: { value: string }) => formatDate(value),
        Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
          return rows.filter(row => {
            const dateStr = row.values[columnIds[0]];
            const date = new Date(dateStr);
            if (filterValue.from) {
              const fromDate = new Date(filterValue.from);
              if (date < fromDate) return false;
            }
            if (filterValue.to) {
              const toDate = new Date(filterValue.to);
              if (date > toDate) return false;
            }
            return true;
          });
        }
      },
      {
        Header: "Piece No",
        accessor: "pieceNo"
      },
      {
        Header: "Sort No",
        accessor: "fabricCode"
      },
      {
        Header: "Construction",
        accessor: "fabricQuality"
      },
      {
        Header: "Vendor",
        accessor: "vendorName"
      },
      {
        Header: "Piece Meters",
        accessor: "pieceMeters"
      },
      {
        Header: "Net Weight",
        accessor: "netWeight"
      },
      {
        Header: "Barcode",
        accessor: "barcodeLink",
        disableFilters: true,
        Cell: ({ row }: { row: any }) => {
          const record = row.original || row;
          const barcodeValue = record.pieceNo || record.piece_no;
          if (!barcodeValue) {
            return <span className="text-xs text-secondary-500">-</span>;
          }

          const meter = record.pieceMeters ?? record.piece_meters;
          const netWeight =
            record.netWeight ??
            record.net_weight ??
            record.rawData?.netWeight ??
            record.rawData?.net_weight;
          const netWeightDisplay = netWeight != null ? netWeight : '--';
          const grade = resolveInspectionGrade(record);
          const avgWeight = resolveInspectionAvgWeight(record);
          const companyId =
            record.companyId ??
            record.rawData?.companyId ??
            record.rawData?.company_id ??
            selectedCompanyId;
          const link = getFabricBarcodeLink({
            barcode: barcodeValue,
            fabricCode: record.fabricCode || record.fabric_code || '',
            fabricQuality: record.fabricQuality || record.fabric_quality || '',
            grade: grade || undefined,
            meter,
            netWeight,
            avgWeight,
            companyId,
          });

          if (!link) {
            return <span className="text-xs text-secondary-500">-</span>;
          }

          return (
            <div className="flex flex-col">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                Barcode
              </a>
            </div>
          );
        }
      },
      

    ],
    [selectedCompanyId, resolveInspectionGrade, resolveInspectionAvgWeight]
  );

  const activeCompletedColumns = useMemo(() => {
    if (!selectMode) return completedColumns;
    const filtered = completedColumns.filter((c: any) => c.accessor !== 'barcodeLink');
    const actionsIdx = filtered.findIndex((c: any) => c.accessor === 'actions' || c.id === 'actions');
    if (actionsIdx >= 0) return [...filtered.slice(0, actionsIdx), checkboxColumn, ...filtered.slice(actionsIdx)];
    return [...filtered, checkboxColumn];
  }, [selectMode, completedColumns, checkboxColumn]);

  // Actions column for completed inspections (defined after handlers to avoid temporal dead zone)
  const completedActionsColumn = useMemo(
    () => {
      const hasPackedPiece = (value: any) => Number(value ?? 0) === 1;
      const hasRejectedPiece = (value: any) => Number(value ?? 0) === 1;

      const checkPiecesForPacking = (pieces: any[]) =>
        Array.isArray(pieces) && pieces.some(piece => hasPackedPiece(piece?.isPacked ?? piece?.is_packed ?? piece?.packed ?? piece?.isPackedFlag ?? piece?.is_packed_flag));

      const checkPiecesForRejection = (pieces: any[]) =>
        Array.isArray(pieces) && pieces.some(piece => hasRejectedPiece(piece?.isRejected ?? piece?.is_rejected ?? piece?.rejected ?? piece?.isRejectedFlag ?? piece?.is_rejected_flag));

      const evaluatePackedStatus = (data: any) => {
        if (hasPackedPiece(data?.isPacked ?? data?.is_packed ?? data?.packed)) return true;
        if (hasPackedPiece(data?.rawData?.isPacked ?? data?.rawData?.is_packed ?? data?.rawData?.packed)) return true;
        const possibleCollections = [
          data?.selectedPieces,
          data?.pieceEntries,
          data?.rawData?.selectedPieces,
          data?.rawData?.pieces,
          data?.rawData?.pieceEntries,
          data?.inspectionEntries
        ];
        return possibleCollections.some(collection => checkPiecesForPacking(collection));
      };

      const evaluateRejectedStatus = (data: any) => {
        if (hasRejectedPiece(data?.isRejected ?? data?.is_rejected ?? data?.rejected)) return true;
        if (hasRejectedPiece(data?.rawData?.isRejected ?? data?.rawData?.is_rejected ?? data?.rawData?.rejected)) return true;
        const possibleCollections = [
          data?.selectedPieces,
          data?.pieceEntries,
          data?.rawData?.selectedPieces,
          data?.rawData?.pieces,
          data?.rawData?.pieceEntries,
          data?.inspectionEntries
        ];
        return possibleCollections.some(collection => checkPiecesForRejection(collection));
      };

      return {
        Header: "Actions",
        accessor: "actions",
        disableFilters: true,
        width: 'auto',
        Cell: ({ row }: any) => {
          const data = row.original || row;
          if (evaluateRejectedStatus(data)) {
            return (
              <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                Rejected
              </span>
            );
          }

          if (evaluatePackedStatus(data)) {
            return (
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Packed
              </span>
            );
          }

          return (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(row)}
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleEdit(row)}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          );
        }
      };
    },
    [handleView, handleEdit]
  );

  return (
    <div className="">
      {/* <div className={`flex items-center mb-6 ${hideHeader ? 'justify-end' : 'justify-between'}`}>
        {!hideHeader && (
           <h1 className="text-[20px] font-semibold text-slate-800 tracking-tight pb-3">
              Greige Fabric Inspection
            </h1>
        )}
      
      </div> */}
<div className="h-5"></div>
      {inspectionStatus === 'completed' && selectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 mb-2 bg-blue-200 border border-purple-200 rounded-md">
          <span className="text-sm text-primary font-medium">{selectedIds.size} row(s) selected &mdash; {totalBarcodeCount} barcode(s)</span>
          <button onClick={handleClearSelection} className="text-xs text-primary underline hover:text-primary">Clear</button>
          <button
            onClick={() => setIsBulkPrintModalOpen(true)}
            className="ml-auto px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary"
          >
            Print Bundle of Barcodes
          </button>
        </div>
      )}
      <DataTable
        columns={inspectionStatus === 'pending' ? pendingColumns : [...activeCompletedColumns, completedActionsColumn]}
        data={filteredData}
        title={inspectionStatus === 'pending' ? "Pending Inspections" : "Completed Inspections"}
        onView={handleView}
        onEdit={handleEdit}
        showActions={false}
        showAddActions={false}
        filterPlaceholder="Search..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        onRowClick={inspectionStatus === 'completed' && selectMode ? (row: any) => handleToggleRow(row.id) : undefined}
        getRowClassName={inspectionStatus === 'completed' && selectMode ? (row: any) => selectedIds.has(row.id) ? 'bg-purple-50 cursor-pointer' : 'cursor-pointer' : undefined}
        headerActions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-blue-50 p-1 rounded-md">
              <button
                className={`px-4 py-1 text-sm rounded-md transition-colors ${inspectionStatus === 'pending'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-blue-600 hover:bg-blue-100'
                }`}
                onClick={() => { setInspectionStatus('pending'); handleCancelSelectMode(); }}
              >
                Waiting For Inspection
              </button>
              <button
                className={`px-4 py-1 text-sm rounded-md transition-colors ${inspectionStatus === 'completed'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-blue-600 hover:bg-blue-100'
                }`}
                onClick={() => setInspectionStatus('completed')}
              >
                Completed
              </button>
            </div>
            {inspectionStatus === 'completed' && (
              // <button
              //   onClick={() => { if (selectMode) handleCancelSelectMode(); else setSelectMode(true); }}
              //   className={`px-3 py-1 text-sm rounded-md border transition-colors ${selectMode ? 'bg-purple-600 text-white border-purple-600' : 'text-purple-600 border-purple-400 hover:bg-purple-50'}`}
              // >
              //   {selectMode ? 'Cancel Selection' : 'Select for Barcode'}
              // </button>
               <button
            onClick={() => selectMode ? handleCancelSelectMode() : setSelectMode(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${selectMode ? 'border-blue-600 bg-blue-600 text-white shadow' : 'border-blue-600 bg-white text-blue-700 hover:bg-blue-50'}`}
          >
            {selectMode ? 'Cancel Selection' : 'Print Multiple Barcode'}
          </button>
            )}
          </div>
        }
        isShowPagination={true}
      />

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={inspectionStatus === 'pending' ? "Source Details" : "Fabric Inspection Details"}
        className="w-full max-w-4xl"
      >
        {currentInspection && (
          <div className="space-y-4">
            {inspectionStatus === 'pending' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Source Type</p>
                    <p className="font-medium">{currentInspection.sourceType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inward Date</p>
                    <p className="font-medium">{formatDate(currentInspection.inwardDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order No</p>
                    <p className="font-medium">{currentInspection.orderNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Piece No</p>
                    <p className="font-medium">{currentInspection.pieceNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sort No - Construction</p>
                    <p className="font-medium">{currentInspection.fabricCodeQuality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vendor</p>
                    <p className="font-medium">{currentInspection.vendorName || vendorMap[currentInspection.vendorId] || '-'}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Inspection Date</p>
                    <p className="font-medium">{formatDate(currentInspection.inspectionDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Piece No</p>
                    <p className="font-medium">{currentInspection.pieceNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sort No</p>
                    <p className="font-medium">{currentInspection.fabricCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Construction</p>
                    <p className="font-medium">{currentInspection.fabricQuality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vendor</p>
                    <p className="font-medium">{vendorMap[currentInspection.vendorId] || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Piece Meters</p>
                    <p className="font-medium">{currentInspection.pieceMeters}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Net Weight</p>
                    <p className="font-medium">{currentInspection.netWeight}</p>
                  </div>
                </div>

                {/* Inspection Summary */}
                <div>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Inspection Summary</h2>
                  {currentInspection.inspectionDetails?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2">S.No</th>
                            <th className="border p-2">Piece No</th>
                            <th className="border p-2">Inspected Meter</th>
                            <th className="border p-2">Actual Net Weight</th>
                            <th className="border p-2">Avg Weight</th>
                            <th className="border p-2">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentInspection.inspectionDetails.map((detail: any, index: number) => (
                            <tr key={detail.id}>
                              <td className="border p-2 text-center">{index + 1}</td>
                              <td className="border p-2 text-center">{detail.pieceNo || "-"}</td>
                              <td className="border p-2 text-center">{detail.inspectedMeters || "-"}</td>
                              <td className="border p-2 text-center">{detail.actualNetWeight || "-"}</td>
                              <td className="border p-2 text-center">{detail.avgWeight != null && detail.avgWeight !== "" ? (Number.isNaN(Number(detail.avgWeight)) ? detail.avgWeight : Number(detail.avgWeight).toFixed(3)) : "-"}</td>
                              <td className="border p-2 text-center">{detail.grade || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No inspection details available.</p>
                  )}
                </div>

                {/* Inspection Entries */}
                <div>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Inspection Entries</h2>
                  {currentInspection.inspectionEntries?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2">Defected Meters</th>
                            <th className="border p-2">From Meters</th>
                            <th className="border p-2">To Meters</th>
                            <th className="border p-2">Defect Type</th>
                            <th className="border p-2">Defect Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentInspection.inspectionEntries.map((entry: any) => {
                            const defectType = defectMasterList?.find((defect: any) => defect.id === entry.defectTypeId);
                            return (
                              <tr key={entry.id}>
                                <td className="border p-2 text-center">{entry.defectedMeters || "-"}</td>
                                <td className="border p-2 text-center">{entry.fromMeters || "-"}</td>
                                <td className="border p-2 text-center">{entry.toMeters || "-"}</td>
                                <td className="border p-2 text-center">{defectType?.defectName || entry.defectTypeId || "-"}</td>
                                <td className="border p-2 text-center">{entry.defectPoints || "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No inspection entries available.</p>
                  )}
                </div>
              </>
            )}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {isBulkPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Print Bundle of Barcodes</h2>
            <p className="text-sm text-gray-600 mb-3">{selectedIds.size} piece(s) selected &mdash; {totalBarcodeCount} barcode(s) total</p>
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {Array.from(selectedIds).map(id => {
                const row = filteredData.find((r: any) => r.id === id);
                if (!row) return null;
                const entries = extractPieceEntriesForRow(row);
                return (
                  <div key={String(id)} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                    <span className="font-medium">{row.pieceNo}</span>
                    <span className="text-xs text-gray-500">{row.inspectionDate}</span>
                    <span className="ml-2 px-2 py-0.5 bg-primary-light text-primary rounded-full text-xs">{entries.length} barcode(s)</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsBulkPrintModalOpen(false)} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md">Cancel</button>
              <button onClick={handleOpenBarcodeStickerPage} className="px-4 py-2 text-sm bg-primary text-white hover:bg-primary-light rounded-md">Open Barcode Sticker Page</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}