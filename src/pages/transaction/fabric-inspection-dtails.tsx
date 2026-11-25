// import { DataTable } from "@/components/data/DataTable";
// import { Modal } from "@/components/ui/Modal";
// import { getAllFabricInspection } from "@/state/fabricInspectionsSlice";

// import { AppDispatch, RootState } from "@/state/store";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { getAllVendors } from "@/state/vendorSlice";
// import { getAllDefectMaster } from "@/state/defectMasterSlice";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Eye, ClipboardCheck, Edit } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { formatDate } from "@/lib/utils";
// import { getFabricBarcodeLink } from "@/lib/barcode";
// import { getAllLooms } from "@/state/loomMasterSlice";
// import { getAllFlanges } from "@/state/flangeSlice";
// import { getAllFactoryPieceEntries, getFactoryPieceEntriesByCompany } from "@/state/factoryPieceEntrySlice";
// import { getFactoryBeamInwardsByFactoryCompanyId } from "@/state/factoryBeamInwardSlice";
// import { getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
// import { getAllCompanies } from "@/state/company-master-slice";
// import { getAllFabricMasters } from "@/state/fabricMasterSlice";
// import { getAllGrandMaster } from "@/state/gradeMasterSlice";
// import { getAllCustomers } from "@/state/customerSlice";

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

// export function FactoryFabricInspectionDetails() {
//   const { fabricInspectionList } = useSelector((state: RootState) => state.fabricInspections);
//   const { vendorList } = useSelector((state: RootState) => state.vendor);
//   const { defectMasterList } = useSelector((state: RootState) => state.defect);
//   const { loomList } = useSelector((state: RootState) => (state as any).loomMaster as any);
//   const { flangeList } = useSelector((state: RootState) => (state as any).flange as any);
//   const { list: pieceEntryList } = useSelector((state: RootState) => (state as any).factoryPieceEntry as any);
//   const { list: factoryBeamInwardList } = useSelector((state: RootState) => (state as any).factoryBeamInward as any);
//   const { weavingJobWorkOrderList } = useSelector((state: RootState) => (state as any).weavingJobWorkOrder as any);
//   const { companyMasterList } = useSelector((state: RootState) => (state as any).companyMaster as any);
//   const { fabricMasterList } = useSelector((state: RootState) => (state as any).fabricMaster as any);
//   const { customerList } = useSelector((state: RootState) => (state as any).customer as any);
//   const { gradeList } = useSelector((state: RootState) => state.grade);
  
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [currentInspection, setCurrentInspection] = useState<any>(null);
//   const locationState = useLocation();
//   const initialTab = (locationState.state as any)?.activeTab || 'pending';
//   const [inspectionStatus, setInspectionStatus] = useState<'pending' | 'completed'>(initialTab as 'pending' | 'completed');
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const selectedCompanyId = useMemo(() => {
//     const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//     return storedCompanyId ? Number(storedCompanyId) : undefined;
//   }, []);

//   // useEffect(() => {
//   //   dispatch(getAllFabricInspection({}));
//   //   dispatch(getAllVendors({}));
//   //   dispatch(getAllPurchaseInwards({}));
//   //   dispatch(getAllJobworkFabricReceive({}));
//   //   dispatch(getAllPurchaseOrders({}));
//   //   dispatch(getAllDefectMaster({}));
//   // }, [dispatch]);
//   // fabric-inspection-dtails.tsx:57-64 replace useEffect to fetch by companyId
// useEffect(() => {
//   const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//   const companyId = v ? Number(v) : undefined;

//   dispatch(getAllFabricInspection({ companyId }));
//   dispatch(getAllVendors({fetchAll: true} as any));
//   dispatch(getAllDefectMaster({fetchAll: true}));
//   dispatch(getAllLooms(companyId ? ({ companyId } as any) : ({} as any)) as any);
//    dispatch(getAllFlanges({fetchAll: true}as any));
//   // dispatch(getAllFlanges(companyId ? ({ companyId } as any) : ({} as any)) as any);
//   dispatch(getAllCompanies({fetchAll: true} as any) as any);
//   dispatch(getAllFabricMasters({fetchAll: true} as any) as any);
//   dispatch(getAllGrandMaster({fetchAll: true} as any));
//   dispatch(getAllCustomers({fetchAll: true} as any));
//   if (companyId) {
//     dispatch(getFactoryBeamInwardsByFactoryCompanyId(companyId) as any);
//             dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
//                   factoryCompanyId: companyId,
//                 }) as any);
//           // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(cid) as any);
//     // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(companyId) as any);
//     dispatch(getFactoryPieceEntriesByCompany(companyId) as any);
//   } else {
//     dispatch(getAllFactoryPieceEntries({} as any) as any);
//   }
// }, [dispatch]);


//   const vendorMap = useMemo(() => {
//     return vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
//       acc[vendor.id] = vendor.vendorName;
//       return acc;
//     }, {}) || {};
//   }, [vendorList]);

//   const loomMap = useMemo(() => {
//     const raw: any = loomList as any;
//     const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
//     const m = new Map<string, string>();
//     arr.forEach((l: any) => m.set(String(l.id), String(l.loomNo || l.loomName || l.name || l.id)));
//     return m;
//   }, [loomList]);

//   const flangeMap = useMemo(() => {
//     const raw: any = flangeList as any;
//     const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
//     const m = new Map<string, string>();
//     arr.forEach((f: any) => m.set(String(f.id), String(f.flangeNo || f.flange_no || f.no || '')));
//     return m;
//   }, [flangeList]);

//   const pieceMap = useMemo(() => {
//     const raw: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
//     const m = new Map<string, any>();
//     raw.forEach((p: any) => {
//       const key = String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase();
//       if (key) m.set(key, p);
//     });
//     return m;
//   }, [pieceEntryList]);

//   const beamToWJOMap = useMemo(() => {
//     const raw: any = factoryBeamInwardList as any;
//     const parents: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
//     const m = new Map<string, { wId?: any }>();
//     parents.forEach((parent: any) => {
//       const wId = parent?.weavingWorkOrderId;
//       const dets: any[] = Array.isArray(parent?.beamInwardBeamDetails) ? parent.beamInwardBeamDetails : [];
//       dets.forEach((d: any) => m.set(String(d?.id), { wId }));
//     });
//     return m;
//   }, [factoryBeamInwardList]);

//   const beamDetailMap = useMemo(() => {
//     const raw: any = factoryBeamInwardList as any;
//     const parents: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
//     const map = new Map<string, any>();
//     parents.forEach((parent: any) => {
//       const dets: any[] = Array.isArray(parent?.beamInwardBeamDetails) ? parent.beamInwardBeamDetails : [];
//       dets.forEach((detail: any) => {
//         if (detail?.id != null) {
//           map.set(String(detail.id), detail);
//         }
//       });
//     });
//     return map;
//   }, [factoryBeamInwardList]);

//   const wjoMap = useMemo(() => {
//     const raw: any = weavingJobWorkOrderList as any;
//     const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
//     const m = new Map<string, any>();
//     arr.forEach((w: any) => m.set(String(w.id), w));
//     return m;
//   }, [weavingJobWorkOrderList]);

//   const companyMap = useMemo(() => {
//     const raw: any = companyMasterList as any;
//     const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
//     const m = new Map<string, string>();
//     arr.forEach((c: any) => m.set(String(c.id), String(c.companyName || c.name || '')));
//     return m;
//   }, [companyMasterList]);

//   const customerMap = useMemo(() => {
//     const raw: any = customerList as any;
//     const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.data?.data) ? raw.data.data : [];
//     const m = new Map<string, string>();
//     arr.forEach((c: any) => {
//       const id = c?.id ?? c?.customerId;
//       if (id == null) return;
//       const name = c?.customerName || c?.name || c?.companyName || c?.buyerName || '';
//       if (!name) return;
//       m.set(String(id), String(name));
//     });
//     return m;
//   }, [customerList]);

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

//   const toFiniteNumber = (value: any) => {
//     if (value == null) return null;
//     const numeric = Number(value);
//     return Number.isFinite(numeric) ? numeric : null;
//   };

//   const resolveOrderTypeId = (order?: any) => {
//     const candidate = order?.orderTypeId ?? order?.orderType;
//     return toFiniteNumber(candidate);
//   };

//   const lookupFromMap = (map: Map<string, string>, ...values: any[]) => {
//     for (const value of values) {
//       if (value == null) continue;
//       const key = String(value);
//       if (!key) continue;
//       const mapped = map.get(key);
//       if (mapped) return mapped;
//     }
//     return undefined;
//   };

//   const resolveBuyerName = useCallback((order?: any) => {
//     if (!order) return '';
//     const direct = [
//       order.buyerName,
//       order.buyerCustomerName,
//       order.buyer?.customerName,
//       order.buyer?.buyerName,
//       order.buyer?.name,
//     ].find(Boolean);
//     if (direct) return String(direct);
//     const orderTypeId = resolveOrderTypeId(order);
//     if (orderTypeId === 1) {
//       const internalName =
//         lookupFromMap(
//           companyMap,
//           order?.tradingCompanyId,
//           order?.factoryCompanyId,
//           order?.companyId,
//           order?.buyerId,
//           order?.buyer?.id,
//         ) ??
//         order?.tradingCompanyName ??
//         order?.factoryCompanyName ??
//         order?.companyName ??
//         order?.buyerName;
//       if (internalName) return String(internalName);
//     } else if (orderTypeId === 2) {
//       const externalName =
//         lookupFromMap(
//           customerMap,
//           order?.buyerId,
//           order?.customerId,
//           order?.consigneeId,
//           order?.buyer?.id,
//           order?.buyer?.customerId,
//         ) ??
//         order?.buyerName ??
//         order?.customerName ??
//         order?.consigneeName;
//       if (externalName) return String(externalName);
//     }
//     const candidates = [
//       order.buyerCustomerId,
//       order.buyerId,
//       order.customerId,
//       order.buyer?.id,
//       order.buyer?.customerId,
//     ];
//     for (const candidate of candidates) {
//       if (candidate == null) continue;
//       const key = String(candidate);
//       const fromCustomer = customerMap.get(key);
//       if (fromCustomer) return fromCustomer;
//       const fromCompany = companyMap.get(key);
//       if (fromCompany) return fromCompany;
//     }
//     return '';
//   }, [customerMap, companyMap]);

//   const factoryOp0Pieces = useMemo(() => {
//     const raw: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
//     return raw.filter((p: any) => {
//       const isFactory = Number(p.isFactoryFabric ?? p.isFactoryFabricFlag ?? 0) === 1;
//       const isOpZero = Number(p.operationId ?? p.operation_id ?? -1) === 0;
//       return isFactory && isOpZero;
//     });
//   }, [pieceEntryList]);

//   const pendingData = useMemo(() => {
//     const fmArr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
//     const uninspectedPieces = factoryOp0Pieces.filter((piece: any) => Number(piece.isInspected ?? piece.is_inspected ?? 0) === 0);
//     const mapped = uninspectedPieces.map((piece: any, index: number) => {
//       const loomNo = loomMap.get(String(piece.loomId)) || piece.loomNo || '';
//       const beamNo = piece?.beamNo || '';
//       const detailId = piece?.beamId ?? piece?.beam_id;
//       const detail = detailId != null ? beamDetailMap.get(String(detailId)) : undefined;
//       const detailFlangeNo = detail?.flangeNo ?? detail?.flange_no ?? detail?.flange?.flangeNo ?? detail?.flange?.flange_no ?? '';
//       const detailFlangeId = detail?.flangeId ?? detail?.flange_id ?? detail?.flange?.id ?? null;
//       const resolvedFlangeId = piece?.flangeId ?? piece?.flange_id ?? detailFlangeId;
//       const flangeNo = detailFlangeNo || (resolvedFlangeId != null ? (flangeMap.get(String(resolvedFlangeId)) || '') : '');
//       const resolvedBeamId = piece?.beamId ?? detailId;
//       const b2w = resolvedBeamId != null ? beamToWJOMap.get(String(resolvedBeamId)) : undefined;
//       const pieceWjoId = piece?.weavingWorkOrderId ?? piece?.weavingJobWorkOrderId ?? piece?.weavingWorkOrder?.id;
//       const resolvedWjoId = pieceWjoId != null ? pieceWjoId : b2w?.wId;
//       const w = resolvedWjoId != null ? wjoMap.get(String(resolvedWjoId)) : undefined;
// const jobWorkOrderNo = [
//       piece.orderNo, 
//       piece.contractNo
//     ].filter(Boolean).join(' / ') || 
//     [w?.orderNo, w?.contractNo].filter(Boolean).join(' / ') || 
//     w?.jobWorkOrderNo || 
//     w?.weavingJobWorkOrderNo || 
//     w?.weavingWorkOrderNo || 
//     '';
//       const buyerName = resolveBuyerName(w);
//       const fm = piece?.fabricMasterId != null ? fmArr.find((f: any) => Number(f.id) === Number(piece.fabricMasterId)) : undefined;
//       const fabricCode = String(fm?.fabricCode || fm?.fabric_code || fm?.code || '').trim();
//       const fabricQuality = String(fm?.fabricQuality || fm?.quality || fm?.fabric_quality || '').trim();
//       const fabricCodeQuality = [fabricCode, fabricQuality].filter(Boolean).join(' - ');
//       const rawD = piece?.doffingDate || piece?.doffDate || piece?.doffing_date || piece?.doff_date || piece?.createdDate || piece?.created_at;
//       const inspDate = rawD ? (String(rawD).includes('T') ? String(rawD).split('T')[0] : String(rawD)) : '';
//       const pieceMeters = piece?.inspectedMtr ?? piece?.inspected_mtr ?? piece?.pieceMeter ?? piece?.piece_meter ?? piece?.quantity ?? '';
//       const netWeight = piece?.actualNetWeight ?? piece?.netWeight ?? piece?.weight ?? '';
//       return {
//         id: piece.id,
//         pieceNo: String(piece.pieceNumber || piece.pieceNo || '').trim(),
//         loomNo,
//         loomId: piece?.loomId,
//         beamNo,
//         beamId: piece?.beamId,
//         flangeNo,
//         flangeId: resolvedFlangeId ?? undefined,
//         jobWorkOrderNo,
//         buyerName,
//         fabricCodeQuality,
//         fabricCode,
//         fabricQuality,
//         fabricMasterId: piece?.fabricMasterId,
//         inspectionDate: inspDate,
//         pieceMeters,
//         netWeight,
//         isPacked: piece.isPacked ?? 0,
//         orderTypeId: piece.orderTypeId ?? piece.order_type_id ?? 0,
//         siNo: index + 1,
//       };
//     });
    
//     const sorted = [...mapped].sort((a: any, b: any) => {
//       const aId = Number(a.id) || 0;
//       const bId = Number(b.id) || 0;
//       return (bId || 0) - (aId || 0);
//     });
//     return sorted.map((item: any, index: number) => ({ ...item, siNo: index + 1 }));
//   }, [factoryOp0Pieces, loomMap, flangeMap, beamToWJOMap, wjoMap, fabricMasterList, resolveBuyerName, beamDetailMap]);

// const completedData = useMemo(() => {
//     const raw = Array.isArray(fabricInspectionList)
//       ? fabricInspectionList
//       : (fabricInspectionList && Array.isArray((fabricInspectionList as any).data)
//           ? (fabricInspectionList as any).data
//           : []);
//     const base: any[] = Array.isArray(raw) ? raw : [];
//     const flag = 1;
//     const op0Set = new Set(factoryOp0Pieces.map((p: any) => String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase()));
//     const filtered = base.filter((x: any) => Number(x?.isInspected ?? x?.is_inspected ?? 0) === flag && op0Set.has(String(x?.pieceNo || '').trim().toLowerCase()));
//     const fmArr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
//     const mapped = filtered.map((inspection: any, index: number) => {
//       const piece = pieceMap.get(String(inspection.pieceNo || '').trim().toLowerCase());
//       const loomNo = piece ? (loomMap.get(String(piece.loomId)) || piece.loomNo || '') : '';
//       const beamNo = inspection.beamNo || piece?.beamNo || '';
//       const detailId = inspection?.beamId ?? inspection?.beam_id ?? piece?.beamId ?? piece?.beam_id;
//       const detail = detailId != null ? beamDetailMap.get(String(detailId)) : undefined;
//       const detailFlangeNo = detail?.flangeNo ?? detail?.flange_no ?? detail?.flange?.flangeNo ?? detail?.flange?.flange_no ?? '';
//       const detailFlangeId = detail?.flangeId ?? detail?.flange_id ?? detail?.flange?.id ?? null;
//       const resolvedFlangeId = inspection?.flangeId ?? inspection?.flange_id ?? piece?.flangeId ?? piece?.flange_id ?? detailFlangeId;
//       const flangeNo = detailFlangeNo || (resolvedFlangeId != null ? (flangeMap.get(String(resolvedFlangeId)) || '') : '');
//       const b2w = piece?.beamId != null ? beamToWJOMap.get(String(piece.beamId)) : undefined;
//       const w = b2w?.wId != null ? wjoMap.get(String(b2w.wId)) : undefined;
//       // const jobWorkOrderNo = [inspection.orderNo, inspection.contractNo].filter(Boolean).join(' / ') || w?.jobWorkOrderNo || w?.weavingJobWorkOrderNo || w?.weavingWorkOrderNo || '';
// const jobWorkOrderNo = [
//       piece.orderNo, 
//       piece.contractNo
//     ].filter(Boolean).join(' / ') || 
//     [w?.orderNo, w?.contractNo].filter(Boolean).join(' / ') || 
//     w?.jobWorkOrderNo || 
//     w?.weavingJobWorkOrderNo || 
//     w?.weavingWorkOrderNo || 
//     '';
//       const buyerName = resolveBuyerName(w);
//       const fm = (inspection.fabricMasterId != null ? fmArr.find((f: any) => Number(f.id) === Number(inspection.fabricMasterId)) : undefined) || (piece?.fabricMasterId != null ? fmArr.find((f: any) => Number(f.id) === Number(piece.fabricMasterId)) : undefined);
//       const fabricCode = String(fm?.fabricCode || fm?.fabric_code || fm?.code || inspection.fabricCode || '').trim();
//       const fabricQuality = String(fm?.fabricQuality || fm?.quality || fm?.fabric_quality || inspection.fabricQuality || '').trim();
//       const fabricCodeQuality = [fabricCode, fabricQuality].filter(Boolean).join(' - ');
//       const rawD = inspection.inspectionDate || piece?.doffingDate || piece?.doffDate || piece?.doffing_date || piece?.doff_date;
//       const inspDate = rawD ? (String(rawD).includes('T') ? String(rawD).split('T')[0] : String(rawD)) : '';
//       const fabricInspectionId = inspection.fabricInspectionId || inspection.fabric_inspection_id || inspection.inspectionId || inspection.inspection_id || inspection.id;
//       const pieceEntryId = inspection.pieceEntryId || inspection.piece_entry_id || piece?.id || (inspection.pieceEntries && inspection.pieceEntries[0]?.id);
      
//       const updatedDetails = (inspection.inspectionDetails || []).map((d: any) => ({
//         ...d,
//         pieceEntryId: pieceEntryId || d.pieceEntryId || d.piece_entry_id
//       }));
      
//       return {
//         ...inspection,
//         id: fabricInspectionId,
//         pieceEntryId: pieceEntryId,
//         vendorName: inspection.vendorId ? (vendorMap[inspection.vendorId] || '-') : '--',
//         siNo: index + 1,
//         loomNo,
//         loomId: inspection.loomId ?? piece?.loomId,
//         beamNo,
//         beamId: inspection.beamId ?? piece?.beamId,
//         flangeNo,
//         flangeId: resolvedFlangeId ?? undefined,
//         jobWorkOrderNo,
//         buyerName,
//         fabricCodeQuality,
//         fabricCode,
//         fabricQuality,
//         fabricMasterId: inspection.fabricMasterId ?? piece?.fabricMasterId,
//         inspectionDate: inspDate || inspection.inspectionDate,
//         isPacked: inspection.isPacked ?? piece?.isPacked ?? 0,
//         orderTypeId: inspection.orderTypeId ?? piece?.orderTypeId ?? piece?.order_type_id ?? 0,
//         pieceMeters: inspection.pieceMeters || piece?.inspectedMtr || piece?.inspected_mtr || piece?.pieceMeter || piece?.piece_meter || piece?.quantity || '',
//         netWeight: inspection.netWeight || piece?.actualNetWeight || piece?.netWeight || piece?.weight || '',
//         inspectionDetails: updatedDetails
//       };
//     });
//     const sorted = [...mapped].sort((a: any, b: any) => {
//       const aId = Number(a.id) || 0;
//       const bId = Number(b.id) || 0;
//       return (bId || 0) - (aId || 0);
//     });
//     return sorted.map((item: any, index: number) => ({ ...item, siNo: index + 1 }));
//   }, [fabricInspectionList, vendorMap, pieceMap, loomMap, flangeMap, beamToWJOMap, wjoMap, fabricMasterList, factoryOp0Pieces, resolveBuyerName, beamDetailMap]);
//   // const filteredData = useMemo(() => {
//   //   const raw = Array.isArray(fabricInspectionList)
//   //     ? fabricInspectionList
//   //     : (fabricInspectionList && Array.isArray((fabricInspectionList as any).data)
//   //         ? (fabricInspectionList as any).data
//   //         : []);
//   //   const base: any[] = Array.isArray(raw) ? raw : [];
//   //   const flag = inspectionStatus === 'pending' ? 0 : 1;
//   //   const op0Set = new Set(factoryOp0Pieces.map((p: any) => String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase()));
//   //   const filtered = base.filter((x: any) => Number(x?.isInspected ?? 0) === flag && op0Set.has(String(x?.pieceNo || '').trim().toLowerCase()));
//   //   const fmArr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
//   //   const mapped = filtered.map((inspection: any, index: number) => {
//   //     const piece = pieceMap.get(String(inspection.pieceNo || '').trim().toLowerCase());
//   //     const loomNo = piece ? (loomMap.get(String(piece.loomId)) || piece.loomNo || '') : '';
//   //     const beamNo = inspection.beamNo || piece?.beamNo || '';
//   //     const flangeNo = inspection.flangeId != null ? (flangeMap.get(String(inspection.flangeId)) || '') : (piece?.flangeId != null ? (flangeMap.get(String(piece.flangeId)) || '') : '');
//   //     const b2w = piece?.beamId != null ? beamToWJOMap.get(String(piece.beamId)) : undefined;
//   //     const w = b2w?.wId != null ? wjoMap.get(String(b2w.wId)) : undefined;
//   //     const jobWorkOrderNo = [inspection.orderNo, inspection.contractNo].filter(Boolean).join(' / ') || [piece?.orderNo, piece?.contractNo].filter(Boolean).join(' / ') || w?.jobWorkOrderNo || w?.weavingJobWorkOrderNo || w?.weavingWorkOrderNo || '';

//   //     const buyerName = w?.buyerName || w?.buyerCustomerName || w?.buyer?.customerName || w?.buyer?.buyerName || (w?.buyerId != null ? (companyMap.get(String(w.buyerId)) || '') : '') || '';
//   //     const fm = (inspection.fabricMasterId != null ? fmArr.find((f: any) => Number(f.id) === Number(inspection.fabricMasterId)) : undefined) || (piece?.fabricMasterId != null ? fmArr.find((f: any) => Number(f.id) === Number(piece.fabricMasterId)) : undefined);
//   //     const fabricCode = String(fm?.fabricCode || fm?.fabric_code || fm?.code || inspection.fabricCode || '').trim();
//   //     const fabricQuality = String(fm?.fabricQuality || fm?.quality || fm?.fabric_quality || inspection.fabricQuality || '').trim();
//   //     const fabricCodeQuality = [fabricCode, fabricQuality].filter(Boolean).join(' - ');
//   //     const rawD = inspection.inspectionDate || piece?.doffingDate || piece?.doffDate || piece?.doffing_date || piece?.doff_date;
//   //     const inspDate = rawD ? (String(rawD).includes('T') ? String(rawD).split('T')[0] : String(rawD)) : '';
//   //     return {
//   //       ...inspection,
//   //       id: inspection.id || inspection.inspectionId,
//   //       vendorName: inspection.vendorId ? (vendorMap[inspection.vendorId] || '-') : '--',
//   //       siNo: index + 1,
//   //       loomNo,
//   //       loomId: inspection.loomId ?? piece?.loomId,
//   //       beamNo,
//   //       beamId: inspection.beamId ?? piece?.beamId,
//   //       flangeNo,
//   //       flangeId: inspection.flangeId ?? piece?.flangeId,
//   //       jobWorkOrderNo,
//   //       buyerName,
//   //       fabricCodeQuality,
//   //       fabricCode,
//   //       fabricQuality,
//   //       fabricMasterId: inspection.fabricMasterId ?? piece?.fabricMasterId,
//   //       inspectionDate: inspDate || inspection.inspectionDate,
//   //       isPacked: inspection.isPacked ?? piece?.isPacked ?? 0,
//   //       orderTypeId: inspection.orderTypeId ?? piece?.orderTypeId ?? piece?.order_type_id ?? 0,
//   //     };
//   //   });
//   //   const sorted = [...mapped].sort((a: any, b: any) => {
//   //     const aId = Number(a.id) || 0;
//   //     const bId = Number(b.id) || 0;
//   //     return (bId || 0) - (aId || 0);
//   //   });
//   //   return sorted.map((item: any, index: number) => ({ ...item, siNo: index + 1 }));
//   // }, [inspectionStatus, fabricInspectionList, vendorMap, pieceMap, loomMap, flangeMap, beamToWJOMap, wjoMap, companyMap, fabricMasterList, factoryOp0Pieces]);

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

//   // Columns for pending tab (from fabricInspectionList)
//   const pendingColumns = useMemo(
//     () => [
//       { Header: 'SI NO', accessor: 'siNo', width: 50, disableFilters: true },
//       {
//         Header: "Doffing Date",
//         accessor: "inspectionDate",
//         Cell: ({ value }: { value: string }) => formatDate(value),
//         Filter: DateRangeFilter,
//         filter: (rows: any[], columnIds: string[], filterValue: any) => {
//           if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
//           return rows.filter(row => {
//             const dateStr = row.values[columnIds[0]];
//             const date = new Date(dateStr);
//             if (filterValue.from) { const fromDate = new Date(filterValue.from); if (date < fromDate) return false; }
//             if (filterValue.to) { const toDate = new Date(filterValue.to); if (date > toDate) return false; }
//             return true;
//           });
//         }
//       },
//       { Header: "Piece No", accessor: "pieceNo" },
//       { Header: "Loom No", accessor: "loomNo" },
//       { Header: "Beam No", accessor: "beamNo" },
//       { Header: "Empty Beam No", accessor: "flangeNo" },
//       { Header: "JobWork Order No / Weaving Contract No", accessor: "jobWorkOrderNo" },
//       { Header: "Buyer Name", accessor: "buyerName" },
//       { Header: "Order Type", accessor: "orderTypeId", Cell: ({ value }: { value: any }) => (Number(value) === 1 ? 'Inhouse' : Number(value) === 2 ? 'Outsource' : '') },
//       { Header: "Fabric Code - Quality", accessor: "fabricCodeQuality" },
//       // { Header: 'Vendor', accessor: 'vendorName' },
//       { Header: "Piece Meters", accessor: "pieceMeters" },
//       // { Header: "Net Weight", accessor: "netWeight" },
//       {
//         Header: "Actions",
//         accessor: "actions",
//         Cell: ({ row }: any) => {
//           const data = row.original || row;
//           const isPacked = Number(data.isPacked ?? 0) === 1;
          
//           if (isPacked) {
//             return (
//               <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
//                 Packed
//               </span>
//             );
//           }
          
//           return (
//             <div className="flex gap-2">
//               <Button variant="outline" size="sm" onClick={() => handleView(row)} title="View Details">
//                 <Eye className="h-4 w-4" />
//               </Button>
//               <Button variant="default" size="sm" onClick={() => handleInspect(row)} title="Inspect">
//                 <ClipboardCheck className="h-4 w-4" />
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
//       { Header: "Piece No", accessor: "pieceNo" },
//       { Header: "Loom No", accessor: "loomNo" },
//       { Header: "Beam No", accessor: "beamNo" },
//       { Header: "Empty Beam No", accessor: "flangeNo" },
//       { Header: "JobWork Order No / Weaving Contract No", accessor: "jobWorkOrderNo" },
//       { Header: "Buyer Name", accessor: "buyerName" },
//       { Header: "Order Type", accessor: "orderTypeId", Cell: ({ value }: { value: any }) => (Number(value) === 1 ? 'Inhouse' : Number(value) === 2 ? 'Outsource' : '') },
//       { Header: "Fabric Code - Quality", accessor: "fabricCodeQuality" },
//       { Header: "Piece Meters", accessor: "pieceMeters" },
//       {
//         Header: "Barcode",
//         accessor: "barcodeLink",
//         disableFilters: true,
//         Cell: ({ row }: { row: any }) => {
//           const record = row.original || row;
//           const barcodeValue = record.pieceNo || record.piece_number;
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
//           const companyId = record.companyId ?? record.rawData?.companyId ?? record.rawData?.company_id ?? selectedCompanyId;
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
//             <div className="flex flex-col gap-1 text-xs">
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
//         },
//       },
//     ],
//     [selectedCompanyId, resolveInspectionGrade, resolveInspectionAvgWeight]
//   );

//   const handleView = (row: any) => {
//     // Handle both React Table row object and raw data object
//     const inspectionData = row.original || row;
//     setCurrentInspection(inspectionData);
//     setIsViewModalOpen(true);
//   };

//   const handleInspect = (row: any) => {
//     const record = row.original || row;
//     navigate("/transaction/fabric-inspection", {
//       state: { 
//         fabricInspDtl: record, 
//         mode: 'add',
//         returnTab: 'factory',
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
//     const inspectionId = inspectionData.id || inspectionData.inspectionId;
    
//     if (!inspectionId) {
//       console.error('Missing inspection ID:', inspectionData);
//       alert('Error: Inspection ID not found. Please try again.');
//       return;
//     }

//     console.log('Editing inspection:', {
//       id: inspectionId,
//       hasDetails: !!inspectionData.inspectionDetails,
//       hasEntries: !!inspectionData.inspectionEntries
//     });

//     navigate("/transaction/fabric-inspection", {
//       state: {
//         fabricInspDtl: inspectionData,
//         mode: 'edit',
//         returnTab: 'factory',
//         returnStatus: 'completed'
//       }
//     });
//   };

//   // Actions column for completed inspections (defined after handlers to avoid temporal dead zone)
//   const completedActionsColumn = useMemo(
//     () => ({
//       Header: "Actions",
//       accessor: "actions",
//       Cell: ({ row }: any) => {
//         const data = row.original || row;
//         const isPacked = Number(data.isPacked ?? 0) === 1;
        
//         if (isPacked) {
//           return (
//             <span className="px-4 py-2 rounded-full text-md bg-green-100 text-green-800">
//               Packed
//             </span>
//           );
//         }
        
//         return (
//           <div className="flex gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => handleView(row)}
//               title="View Details"
//             >
//               <Eye className="h-4 w-4" />
//             </Button>
//             <Button
//               variant="default"
//               size="sm"
//               onClick={() => handleEdit(row)}
//               title="Edit"
//             >
//               <Edit className="h-4 w-4" />
//             </Button>
//           </div>
//         );
//       },
//     }),
//     [handleView, handleEdit]
//   );

//   return (
//     <div className="">
//       <div className={`flex items-center mb-6 justify-end`}>
       
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
//         data={inspectionStatus === 'pending' ? pendingData : completedData}
//         title={inspectionStatus === 'pending' ? "Pending Inspections" : "Completed Inspections"}
//         onView={handleView}
//         onEdit={handleEdit}
//         showActions={false}
//         showAddActions={false}
//         filterPlaceholder="Search..."
//         showColumnFilters={true}
//       />

//       {/* View Modal */}
//       <Modal
//         isOpen={isViewModalOpen}
//         onClose={() => setIsViewModalOpen(false)}
//         title={"Fabric Inspection Details"}
//         className="w-full max-w-4xl"
//       >
//         {currentInspection && (
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-gray-500">Inspection Date</p>
//                 <p className="font-medium">{formatDate(currentInspection.inspectionDate)}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Piece No</p>
//                 <p className="font-medium">{currentInspection.pieceNo}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Loom No</p>
//                 <p className="font-medium">{currentInspection.loomNo || '-'}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Beam No</p>
//                 <p className="font-medium">{currentInspection.beamNo || '-'}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Empty Beam No</p>
//                 <p className="font-medium">{currentInspection.flangeNo || '-'}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">JobWork Order No</p>
//                 <p className="font-medium">{currentInspection.jobWorkOrderNo || '-'}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Buyer Name</p>
//                 <p className="font-medium">{currentInspection.buyerName || '-'}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Fabric Code</p>
//                 <p className="font-medium">{currentInspection.fabricCode}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Fabric Quality</p>
//                 <p className="font-medium">{currentInspection.fabricQuality}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Vendor</p>
//                 <p className="font-medium">{vendorMap[currentInspection.vendorId] || '-'}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Piece Meters</p>
//                 <p className="font-medium">{currentInspection.pieceMeters}</p>
//               </div>
//               {/* <div>
//                 <p className="text-sm text-gray-500">Net Weight</p>
//                 <p className="font-medium">{currentInspection.netWeight}</p>
//               </div> */}
//             </div>

//             {/* Inspection Summary */}
//             <div>
//               <h2 className="text-lg font-semibold mt-4 mb-2">Inspection Summary</h2>
//               {currentInspection.inspectionDetails?.length > 0 ? (
//                 <div className="overflow-x-auto">
//                   <table className="w-full border">
//                     <thead>
//                       <tr className="bg-gray-100">
//                         <th className="border p-2">S.No</th>
//                         <th className="border p-2">Piece No</th>
//                         <th className="border p-2">Inspected Meter</th>
//                         <th className="border p-2">Actual Net Weight</th>
//                         <th className="border p-2">Avg Weight</th>
//                         <th className="border p-2">Grade</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {currentInspection.inspectionDetails.map((detail: any, index: number) => (
//                         <tr key={detail.id}>
//                           <td className="border p-2 text-center">{index + 1}</td>
//                           <td className="border p-2 text-center">{detail.pieceNo || "-"}</td>
//                           <td className="border p-2 text-center">{detail.inspectedMeters || "-"}</td>
//                           <td className="border p-2 text-center">{detail.actualNetWeight || "-"}</td>
//                           <td className="border p-2 text-center">{detail.avgWeight?.toFixed(3) || "-"}</td>
//                           <td className="border p-2 text-center">{detail.grade || "-"}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <p className="text-gray-500">No inspection details available.</p>
//               )}
//             </div>

//             {/* Inspection Entries */}
//             <div>
//               <h2 className="text-lg font-semibold mt-4 mb-2">Inspection Entries</h2>
//               {currentInspection.inspectionEntries?.length > 0 ? (
//                 <div className="overflow-x-auto">
//                   <table className="w-full border">
//                     <thead>
//                       <tr className="bg-gray-100">
//                         <th className="border p-2">Defected Meters</th>
//                         <th className="border p-2">From Meters</th>
//                         <th className="border p-2">To Meters</th>
//                         <th className="border p-2">Defect Type</th>
//                         <th className="border p-2">Defect Points</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {currentInspection.inspectionEntries.map((entry: any) => {
//                         const defectType = defectMasterList?.find((defect: any) => defect.id === entry.defectTypeId);
//                         return (
//                           <tr key={entry.id}>
//                             <td className="border p-2 text-center">{entry.defectedMeters || "-"}</td>
//                             <td className="border p-2 text-center">{entry.fromMeters || "-"}</td>
//                             <td className="border p-2 text-center">{entry.toMeters || "-"}</td>
//                             <td className="border p-2 text-center">{defectType?.defectName || entry.defectTypeId || "-"}</td>
//                             <td className="border p-2 text-center">{entry.defectPoints || "-"}</td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <p className="text-gray-500">No inspection entries available.</p>
//               )}
//             </div>

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

import { AppDispatch, RootState } from "@/state/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllDefectMaster } from "@/state/defectMasterSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, ClipboardCheck, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getFabricBarcodeLink, FabricBarcodePiece } from "@/lib/barcode";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllFlanges } from "@/state/flangeSlice";
import { getAllFactoryPieceEntries, getFactoryPieceEntriesByCompany } from "@/state/factoryPieceEntrySlice";
import { getFactoryBeamInwardsByFactoryCompanyId } from "@/state/factoryBeamInwardSlice";
import { getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllGrandMaster } from "@/state/gradeMasterSlice";
import { getAllCustomers } from "@/state/customerSlice";


export function FactoryFabricInspectionDetails() {
  const { fabricInspectionList } = useSelector((state: RootState) => state.fabricInspections);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { defectMasterList } = useSelector((state: RootState) => state.defect);
  const { loomList } = useSelector((state: RootState) => (state as any).loomMaster as any);
  const { flangeList } = useSelector((state: RootState) => (state as any).flange as any);
  const { list: pieceEntryList } = useSelector((state: RootState) => (state as any).factoryPieceEntry as any);
  const { list: factoryBeamInwardList } = useSelector((state: RootState) => (state as any).factoryBeamInward as any);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => (state as any).weavingJobWorkOrder as any);
  const { companyMasterList } = useSelector((state: RootState) => (state as any).companyMaster as any);
  const { fabricMasterList } = useSelector((state: RootState) => (state as any).fabricMaster as any);
  const { customerList } = useSelector((state: RootState) => (state as any).customer as any);
  const { gradeList } = useSelector((state: RootState) => state.grade);
  
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
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return storedCompanyId ? Number(storedCompanyId) : undefined;
  }, []);



  useEffect(() => {
    const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = v ? Number(v) : undefined;

    dispatch(getAllFabricInspection({ companyId }));
    dispatch(getAllVendors({fetchAll: true} as any));
    dispatch(getAllDefectMaster({fetchAll: true}));
    dispatch(getAllLooms(companyId ? ({ companyId } as any) : ({} as any)) as any);
    dispatch(getAllFlanges({fetchAll: true}as any));
    dispatch(getAllCompanies({fetchAll: true} as any) as any);
    dispatch(getAllFabricMasters({fetchAll: true} as any) as any);
    dispatch(getAllGrandMaster({fetchAll: true} as any));
    dispatch(getAllCustomers({fetchAll: true} as any));
    if (companyId) {
      dispatch(getFactoryBeamInwardsByFactoryCompanyId(companyId) as any);
      dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
        factoryCompanyId: companyId,
      }) as any);
      dispatch(getFactoryPieceEntriesByCompany(companyId) as any);
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

  const customerMap = useMemo(() => {
    const raw: any = customerList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, string>();
    arr.forEach((c: any) => {
      const id = c?.id ?? c?.customerId;
      const name = c?.customerName || c?.name || c?.companyName;
      if (id && name) m.set(String(id), String(name));
    });
    return m;
  }, [customerList]);

  const loomMap = useMemo(() => {
    const raw: any = loomList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, string>();
    arr.forEach((l: any) => m.set(String(l.id), String(l.loomNo || l.loomName || l.name || l.id)));
    return m;
  }, [loomList]);

  const flangeMap = useMemo(() => {
    const raw: any = flangeList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, string>();
    arr.forEach((f: any) => m.set(String(f.id), String(f.flangeNo || f.flange_no || f.no || '')));
    return m;
  }, [flangeList]);

  const pieceMap = useMemo(() => {
    const raw: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
    const m = new Map<string, any>();
    raw.forEach((p: any) => {
      const key = String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase();
      if (key) m.set(key, p);
    });
    return m;
  }, [pieceEntryList]);

  const beamToWJOMap = useMemo(() => {
    const raw: any = factoryBeamInwardList as any;
    const parents: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, { wId?: any }>();
    parents.forEach((parent: any) => {
      const wId = parent?.weavingWorkOrderId;
      const dets: any[] = Array.isArray(parent?.beamInwardBeamDetails) ? parent.beamInwardBeamDetails : [];
      dets.forEach((d: any) => m.set(String(d?.id), { wId }));
    });
    return m;
  }, [factoryBeamInwardList]);

  const beamDetailMap = useMemo(() => {
    const raw: any = factoryBeamInwardList as any;
    const parents: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, any>();
    parents.forEach((parent: any) => {
      const dets: any[] = Array.isArray(parent?.beamInwardBeamDetails) ? parent.beamInwardBeamDetails : [];
      dets.forEach((detail: any) => {
        if (detail?.id != null) {
          map.set(String(detail.id), detail);
        }
      });
    });
    return map;
  }, [factoryBeamInwardList]);

  const wjoMap = useMemo(() => {
    const raw: any = weavingJobWorkOrderList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, any>();
    arr.forEach((w: any) => m.set(String(w.id), w));
    return m;
  }, [weavingJobWorkOrderList]);

  const wjoByNoMap = useMemo(() => {
    const raw: any = weavingJobWorkOrderList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, any>();
    arr.forEach((w: any) => {
      const no = w?.weavingWorkOrderNo || w?.jobWorkOrderNo || w?.weavingJobWorkOrderNo || '';
      const cleanNo = String(no).trim().toLowerCase();
      if (cleanNo) {
        m.set(cleanNo, w);
      }
    });
    return m;
  }, [weavingJobWorkOrderList]);

  const companyMap = useMemo(() => {
    const raw: any = companyMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, string>();
    arr.forEach((c: any) => m.set(String(c.id), String(c.companyName || c.name || '')));
    return m;
  }, [companyMasterList]);



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

  const toFiniteNumber = (value: any) => {
    if (value == null) return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const resolveOrderTypeId = (order?: any) => {
    const candidate = order?.orderTypeId ?? order?.orderType;
    return toFiniteNumber(candidate);
  };

  const lookupFromMap = (map: Map<string, string>, ...values: any[]) => {
    for (const value of values) {
      if (value == null) continue;
      const key = String(value);
      if (!key) continue;
      const mapped = map.get(key);
      if (mapped) return mapped;
    }
    return undefined;
  };

  const resolveBuyerName = useCallback((order?: any) => {
    if (!order) return '';
    const direct = [
      order.buyerName,
      order.buyerCustomerName,
      order.buyer?.customerName,
      order.buyer?.buyerName,
      order.buyer?.name,
    ].find(Boolean);
    if (direct) return String(direct);
    const orderTypeId = resolveOrderTypeId(order);
    if (orderTypeId === 1) {
      const internalName =
        lookupFromMap(
          companyMap,
          order?.tradingCompanyId,
          order?.factoryCompanyId,
          order?.companyId,
          order?.buyerId,
          order?.buyer?.id,
        ) ??
        order?.tradingCompanyName ??
        order?.factoryCompanyName ??
        order?.companyName ??
        order?.buyerName;
      if (internalName) return String(internalName);
    } else if (orderTypeId === 2) {
      const externalName =
        lookupFromMap(
          customerMap,
          order?.buyerId,
          order?.customerId,
          order?.consigneeId,
          order?.buyer?.id,
          order?.buyer?.customerId,
        ) ??
        order?.buyerName ??
        order?.customerName ??
        order?.consigneeName;
      if (externalName) return String(externalName);
    }
    const candidates = [
      order.buyerCustomerId,
      order.buyerId,
      order.customerId,
      order.buyer?.id,
      order.buyer?.customerId,
    ];
    for (const candidate of candidates) {
      if (candidate == null) continue;
      const key = String(candidate);
      const fromCustomer = customerMap.get(key);
      if (fromCustomer) return fromCustomer;
      const fromCompany = companyMap.get(key);
      if (fromCompany) return fromCompany;
    }
    return '';
  }, [customerMap, companyMap]);

  const factoryOp0Pieces = useMemo(() => {
    const raw: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
    return raw.filter((p: any) => {
      const isFactory = Number(p.isFactoryFabric ?? p.isFactoryFabricFlag ?? 0) === 1;
      const isOpZero = Number(p.operationId ?? p.operation_id ?? -1) === 0;
      return isFactory && isOpZero;
    });
  }, [pieceEntryList]);

  const factoryInspectionLookup = useMemo(() => {
    const raw = Array.isArray(fabricInspectionList)
      ? fabricInspectionList
      : Array.isArray((fabricInspectionList as any)?.data)
        ? (fabricInspectionList as any).data
        : [];
    const map = new Map<string, any>();
    raw.forEach((inspection: any) => {
      const pieceEntryId = inspection.pieceEntryId ?? inspection.piece_entry_id;
      const pieceNo = String(inspection.pieceNo ?? inspection.piece_no ?? '').trim().toLowerCase();
      if (pieceNo) {
        map.set(`PIECE:${pieceNo}`, inspection);
      }
      if (pieceEntryId != null) {
        if (pieceNo) {
          map.set(`ENTRY:${pieceEntryId}:${pieceNo}`, inspection);
        }
        map.set(`ENTRY:${pieceEntryId}`, inspection);
      }
    });
    return map;
  }, [fabricInspectionList]);

  const pendingData = useMemo(() => {
    const fmArr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
    const uninspectedPieces = factoryOp0Pieces.filter((piece: any) => Number(piece.isInspected ?? piece.is_inspected ?? 0) === 0);
    const mapped = uninspectedPieces.map((piece: any, index: number) => {
      const pieceNumber = String(piece.pieceNumber || piece.pieceNo || '').trim().toLowerCase();
      let existingInspection: any = null;
      if (pieceNumber) {
        existingInspection = factoryInspectionLookup.get(`PIECE:${pieceNumber}`);
      }
      if (!existingInspection && piece.id != null && pieceNumber) {
        existingInspection = factoryInspectionLookup.get(`ENTRY:${piece.id}:${pieceNumber}`);
      }
      if (!existingInspection && piece.id != null) {
        const candidate = factoryInspectionLookup.get(`ENTRY:${piece.id}`);
        if (candidate) {
          const candPieceNo = String(candidate.pieceNo ?? candidate.piece_no ?? '').trim().toLowerCase();
          if (!candPieceNo || !pieceNumber || candPieceNo === pieceNumber) {
            existingInspection = candidate;
          }
        }
      }
      if (existingInspection) {
        const inspPieceNo = String(existingInspection.pieceNo ?? existingInspection.piece_no ?? '').trim().toLowerCase();
        if (inspPieceNo && pieceNumber && inspPieceNo !== pieceNumber) {
          existingInspection = null;
        }
      }
      const existingInspectionId = existingInspection?.id ?? null;
      const loomNo = loomMap.get(String(piece.loomId)) || piece.loomNo || '';
      const beamNo = piece?.beamNo || '';
      const detailId = piece?.beamId ?? piece?.beam_id;
      const detail = detailId != null ? beamDetailMap.get(String(detailId)) : undefined;
      const detailFlangeNo = detail?.flangeNo ?? detail?.flange_no ?? detail?.flange?.flangeNo ?? detail?.flange?.flange_no ?? '';
      const detailFlangeId = detail?.flangeId ?? detail?.flange_id ?? detail?.flange?.id ?? null;
      const resolvedFlangeId = piece?.flangeId ?? piece?.flange_id ?? detailFlangeId;
      const flangeNo = detailFlangeNo || (resolvedFlangeId != null ? (flangeMap.get(String(resolvedFlangeId)) || '') : '');
      const resolvedBeamId = piece?.beamId ?? detailId;
      const b2w = resolvedBeamId != null ? beamToWJOMap.get(String(resolvedBeamId)) : undefined;
      const pieceWjoId = piece?.orderId ?? piece?.weavingWorkOrderId ?? piece?.weavingJobWorkOrderId ?? piece?.weavingWorkOrder?.id;
      const resolvedWjoId = pieceWjoId != null ? pieceWjoId : b2w?.wId;
      let w = resolvedWjoId != null ? wjoMap.get(String(resolvedWjoId)) : undefined;
      if (!w && piece?.orderNo) {
        w = wjoByNoMap.get(String(piece.orderNo).trim().toLowerCase());
      }
      const jobWorkOrderNo = [
        piece.orderNo, 
        piece.contractNo
      ].filter(Boolean).join(' / ') || 
      [w?.orderNo, w?.contractNo].filter(Boolean).join(' / ') || 
      w?.jobWorkOrderNo || 
      w?.weavingJobWorkOrderNo || 
      w?.weavingWorkOrderNo || 
      '';
      const buyerName = resolveBuyerName(w);
      const fm = piece?.fabricMasterId != null ? fmArr.find((f: any) => Number(f.id) === Number(piece.fabricMasterId)) : undefined;
      const fabricCode = String(fm?.fabricCode || fm?.fabric_code || fm?.code || '').trim();
      const fabricQuality = String(fm?.fabricQuality || fm?.quality || fm?.fabric_quality || '').trim();
      const fabricCodeQuality = [fabricCode, fabricQuality].filter(Boolean).join(' - ');
      const rawD = piece?.doffingDate || piece?.doffDate || piece?.doffing_date || piece?.doff_date || piece?.createdDate || piece?.created_at;
      const inspDate = rawD ? (String(rawD).includes('T') ? String(rawD).split('T')[0] : String(rawD)) : '';
      const pieceMeters = piece?.inspectedMtr ?? piece?.inspected_mtr ?? piece?.pieceMeter ?? piece?.piece_meter ?? piece?.quantity ?? '';
      const netWeight = piece?.actualNetWeight ?? piece?.netWeight ?? piece?.weight ?? '';
      return {
        id: piece.id,
        pieceNo: String(piece.pieceNumber || piece.pieceNo || '').trim(),
        loomNo,
        loomId: piece?.loomId,
        beamNo,
        beamId: piece?.beamId,
        flangeNo,
        flangeId: resolvedFlangeId ?? undefined,
        jobWorkOrderNo,
        buyerName,
        fabricCodeQuality,
        fabricCode,
        fabricQuality,
        fabricMasterId: piece?.fabricMasterId,
        inspectionDate: inspDate,
        pieceMeters,
        netWeight,
        isPacked: piece.isPacked ?? 0,
        orderTypeId: piece.orderTypeId ?? piece.order_type_id ?? 0,
        existingInspectionId,
        existingInspection: existingInspection ?? null,
        siNo: index + 1,
      };
    });
    
    const sorted = [...mapped].sort((a: any, b: any) => {
      const aId = Number(a.id) || 0;
      const bId = Number(b.id) || 0;
      return (bId || 0) - (aId || 0);
    });
    return sorted.map((item: any, index: number) => ({ ...item, siNo: index + 1 }));
  }, [factoryOp0Pieces, loomMap, flangeMap, beamToWJOMap, wjoMap, fabricMasterList, resolveBuyerName, beamDetailMap, factoryInspectionLookup]);

  const completedData = useMemo(() => {
    const raw = Array.isArray(fabricInspectionList)
      ? fabricInspectionList
      : (fabricInspectionList && Array.isArray((fabricInspectionList as any).data)
          ? (fabricInspectionList as any).data
          : []);
    const base: any[] = Array.isArray(raw) ? raw : [];
    const flag = 1;
    const op0Set = new Set(factoryOp0Pieces.map((p: any) => String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase()));
    const filtered = base.filter((x: any) => Number(x?.isInspected ?? x?.is_inspected ?? 0) === flag && op0Set.has(String(x?.pieceNo || '').trim().toLowerCase()));
    const fmArr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
    const mapped = filtered.map((inspection: any, index: number) => {
      const piece = pieceMap.get(String(inspection.pieceNo || '').trim().toLowerCase());
      const loomNo = piece ? (loomMap.get(String(piece.loomId)) || piece.loomNo || '') : '';
      const beamNo = inspection.beamNo || piece?.beamNo || '';
      const detailId = inspection?.beamId ?? inspection?.beam_id ?? piece?.beamId ?? piece?.beam_id;
      const detail = detailId != null ? beamDetailMap.get(String(detailId)) : undefined;
      const detailFlangeNo = detail?.flangeNo ?? detail?.flange_no ?? detail?.flange?.flangeNo ?? detail?.flange?.flange_no ?? '';
      const detailFlangeId = detail?.flangeId ?? detail?.flange_id ?? detail?.flange?.id ?? null;
      const resolvedFlangeId = inspection?.flangeId ?? inspection?.flange_id ?? piece?.flangeId ?? piece?.flange_id ?? detailFlangeId;
      const flangeNo = detailFlangeNo || (resolvedFlangeId != null ? (flangeMap.get(String(resolvedFlangeId)) || '') : '');
      const b2w = piece?.beamId != null ? beamToWJOMap.get(String(piece.beamId)) : undefined;
      const pieceWjoId = piece?.orderId ?? piece?.weavingWorkOrderId ?? piece?.weavingJobWorkOrderId ?? piece?.weavingWorkOrder?.id;
      const resolvedWjoId = pieceWjoId != null ? pieceWjoId : b2w?.wId;
      let w = resolvedWjoId != null ? wjoMap.get(String(resolvedWjoId)) : undefined;
      if (!w && piece?.orderNo) {
        w = wjoByNoMap.get(String(piece.orderNo).trim().toLowerCase());
      }
      const jobWorkOrderNo = [
        piece.orderNo, 
        piece.contractNo
      ].filter(Boolean).join(' / ') || 
      [w?.orderNo, w?.contractNo].filter(Boolean).join(' / ') || 
      w?.jobWorkOrderNo || 
      w?.weavingJobWorkOrderNo || 
      w?.weavingWorkOrderNo || 
      '';
      const buyerName = resolveBuyerName(w);
      const fm = (inspection.fabricMasterId != null ? fmArr.find((f: any) => Number(f.id) === Number(inspection.fabricMasterId)) : undefined) || (piece?.fabricMasterId != null ? fmArr.find((f: any) => Number(f.id) === Number(piece.fabricMasterId)) : undefined);
      const fabricCode = String(fm?.fabricCode || fm?.fabric_code || fm?.code || inspection.fabricCode || '').trim();
      const fabricQuality = String(fm?.fabricQuality || fm?.quality || fm?.fabric_quality || inspection.fabricQuality || '').trim();
      const fabricCodeQuality = [fabricCode, fabricQuality].filter(Boolean).join(' - ');
      const rawD = inspection.inspectionDate || piece?.doffingDate || piece?.doffDate || piece?.doffing_date || piece?.doff_date;
      const inspDate = rawD ? (String(rawD).includes('T') ? String(rawD).split('T')[0] : String(rawD)) : '';
      const fabricInspectionId = inspection.fabricInspectionId || inspection.fabric_inspection_id || inspection.inspectionId || inspection.inspection_id || inspection.id;
      const pieceEntryId = inspection.pieceEntryId || inspection.piece_entry_id || piece?.id || (inspection.pieceEntries && inspection.pieceEntries[0]?.id);
      
      const updatedDetails = (inspection.inspectionDetails || []).map((d: any) => ({
        ...d,
        pieceEntryId: pieceEntryId || d.pieceEntryId || d.piece_entry_id,
        rollDoffMeters: d?.rollDoffMeters ?? d?.roll_doff_meters ?? d?.pieceMeters ?? d?.piece_meters ?? piece?.quantity ?? '',
      }));
      
      return {
        ...inspection,
        id: fabricInspectionId,
        pieceEntryId: pieceEntryId,
        vendorName: inspection.vendorId ? (vendorMap[inspection.vendorId] || '-') : '--',
        siNo: index + 1,
        loomNo,
        loomId: inspection.loomId ?? piece?.loomId,
        beamNo,
        beamId: inspection.beamId ?? piece?.beamId,
        flangeNo,
        flangeId: resolvedFlangeId ?? undefined,
        jobWorkOrderNo,
        buyerName,
        fabricCodeQuality,
        fabricCode,
        fabricQuality,
        fabricMasterId: inspection.fabricMasterId ?? piece?.fabricMasterId,
        epi: inspection.epi || fm?.epi || fm?.onTableEpi || fm?.onLoomEpi || '',
        ppi: inspection.ppi || fm?.ppi || '',
        width: inspection.width || fm?.fabricWidth || fm?.width || fm?.cutWidth || '',
        buyerInspectorId: inspection.buyerInspectorId ?? inspection.buyer_inspector_id,
        buyerInspector: inspection.buyerInspector || inspection.buyer_inspector || (inspection.buyerInspectorId ? customerMap.get(String(inspection.buyerInspectorId)) : '') || '',
        inspectionDate: inspDate || inspection.inspectionDate,
        isPacked: inspection.isPacked ?? piece?.isPacked ?? 0,
        isRejected: inspection.isRejected ?? piece?.isRejected ?? 0,
        orderTypeId: inspection.orderTypeId ?? piece?.orderTypeId ?? piece?.order_type_id ?? 0,
        pieceMeters: inspection.pieceMeters || piece?.inspectedMtr || piece?.inspected_mtr || piece?.pieceMeter || piece?.piece_meter || piece?.quantity || '',
        netWeight: inspection.netWeight || piece?.actualNetWeight || piece?.netWeight || piece?.weight || '',
        inspectionDetails: updatedDetails
      };
    });
    const sorted = [...mapped].sort((a: any, b: any) => {
      const aId = Number(a.id) || 0;
      const bId = Number(b.id) || 0;
      return (bId || 0) - (aId || 0);
    });
    return sorted.map((item: any, index: number) => ({ ...item, siNo: index + 1 }));
  }, [fabricInspectionList, vendorMap, pieceMap, loomMap, flangeMap, beamToWJOMap, wjoMap, fabricMasterList, factoryOp0Pieces, resolveBuyerName, beamDetailMap, customerMap]);

  const currentData = inspectionStatus === 'pending' ? pendingData : completedData;

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
    const barcodeValue = record.pieceNo || record.piece_number;
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
      const row = completedData.find((r: any) => r.id === id);
      if (row) allEntries.push(...extractPieceEntriesForRow(row));
    }
    if (!allEntries.length) return;
    const link = getFabricBarcodeLink({ barcode: allEntries[0].barcode, pieceEntries: allEntries, companyId: selectedCompanyId });
    if (link) window.open(link, '_blank');
    setIsBulkPrintModalOpen(false);
  }, [selectedIds, completedData, extractPieceEntriesForRow, selectedCompanyId]);

  const totalBarcodeCount = useMemo(() => {
    let count = 0;
    for (const id of selectedIds) {
      const row = completedData.find((r: any) => r.id === id);
      if (row) count += extractPieceEntriesForRow(row).length;
    }
    return count;
  }, [selectedIds, completedData, extractPieceEntriesForRow]);

  const checkboxColumn = useMemo(() => ({
    id: 'bulkSelect',
    Header: (
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={completedData.length > 0 && selectedIds.size === completedData.length}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked, completedData)}
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
  }), [completedData, selectedIds, handleSelectAll, handleToggleRow]);

  const handleView = useCallback((row: any) => {
    // Handle both React Table row object and raw data object
    const inspectionData = row.original || row;
    setCurrentInspection(inspectionData);
    setIsViewModalOpen(true);
  }, []);

  const handleInspect = useCallback((row: any) => {
    const record = row.original || row;
    const existingInspectionId = record.existingInspectionId ?? null;
    const existingInspection = record.existingInspection ?? null;
    // Always keep the selected piece's actual details primary
    const fabricInspDtl = existingInspectionId && existingInspection
      ? { ...existingInspection, ...record, fabricInspectionId: existingInspectionId, id: existingInspectionId }
      : record;
    navigate("/transaction/fabric-inspection", {
      state: { 
        fabricInspDtl,
        mode: existingInspectionId ? 'edit' : 'add',
        returnTab: 'factory',
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
    const inspectionId = inspectionData.id || inspectionData.inspectionId;
    
    if (!inspectionId) {
      console.error('Missing inspection ID:', inspectionData);
      alert('Error: Inspection ID not found. Please try again.');
      return;
    }

    console.log('Editing inspection:', {
      id: inspectionId,
      hasDetails: !!inspectionData.inspectionDetails,
      hasEntries: !!inspectionData.inspectionEntries
    });

    navigate("/transaction/fabric-inspection", {
      state: {
        fabricInspDtl: inspectionData,
        mode: 'edit',
        returnTab: 'factory',
        returnStatus: 'completed'
      }
    });
  }, [navigate]);

  // Columns for pending tab (from fabricInspectionList)
  const pendingColumns = useMemo(
    () => [
      { Header: 'SI NO', accessor: 'siNo', width: 50, disableFilters: true },
      {
        Header: "Doffing Date",
        accessor: "inspectionDate",
        Cell: ({ value }: { value: string }) => formatDate(value),
        Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
          return rows.filter(row => {
            const dateStr = row.values[columnIds[0]];
            const date = new Date(dateStr);
            if (filterValue.from) { const fromDate = new Date(filterValue.from); if (date < fromDate) return false; }
            if (filterValue.to) { const toDate = new Date(filterValue.to); if (date > toDate) return false; }
            return true;
          });
        }
      },
      { Header: "Piece No", accessor: "pieceNo" },
      { Header: "Loom No", accessor: "loomNo" },
      { Header: "Beam No", accessor: "beamNo" },
      { Header: "Empty Beam No", accessor: "flangeNo" },
      { Header: "JobWork Order No / Weaving Contract No", accessor: "jobWorkOrderNo" },
      { Header: "Buyer Name", accessor: "buyerName" },
      { Header: "Order Type", accessor: "orderTypeId", Cell: ({ value }: { value: any }) => (Number(value) === 1 ? 'Inhouse' : Number(value) === 2 ? 'Outsource' : '') },
      { Header: "Sort No - Construction", accessor: "fabricCodeQuality" },
      { Header: "Piece Meters", accessor: "pieceMeters" },
      {
        Header: "Actions",
        accessor: "actions",
        disableFilters: true,
        width: 'auto',
        Cell: ({ row }: any) => {
          const data = row.original || row;
          const isPacked = Number(data.isPacked ?? 0) === 1;
          
          if (isPacked) {
            return (
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Packed
              </span>
            );
          }
          
          return (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleView(row)} title="View Details">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="default" size="sm" onClick={() => handleInspect(row)} title="Inspect">
                <ClipboardCheck className="h-4 w-4" />
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
      { Header: "Piece No", accessor: "pieceNo" },
      { Header: "Loom No", accessor: "loomNo" },
      { Header: "Beam No", accessor: "beamNo" },
      { Header: "Empty Beam No", accessor: "flangeNo" },
      { Header: "JobWork Order No / Weaving Contract No", accessor: "jobWorkOrderNo" },
      { Header: "Buyer Name", accessor: "buyerName" },
      { Header: "Order Type", accessor: "orderTypeId", Cell: ({ value }: { value: any }) => (Number(value) === 1 ? 'Inhouse' : Number(value) === 2 ? 'Outsource' : '') },
      { Header: "Sort No - Construction", accessor: "fabricCodeQuality" },
      { Header: "Piece Meters", accessor: "pieceMeters" },
      {
        Header: "Barcode",
        accessor: "barcodeLink",
        disableFilters: true,
        Cell: ({ row }: { row: any }) => {
          const record = row.original || row;
          const barcodeValue = record.pieceNo || record.piece_number;
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
          const companyId = record.companyId ?? record.rawData?.companyId ?? record.rawData?.company_id ?? selectedCompanyId;
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
            <div className="flex flex-col gap-1 text-xs">
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
        },
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
    () => ({
      Header: "Actions",
      accessor: "actions",
      disableFilters: true,
      width: 'auto',
      Cell: ({ row }: any) => {
        const data = row.original || row;
        const isPacked = Number(data.isPacked ?? 0) === 1;
        const isRejected = Number(data.isRejected ?? 0) === 1;
        
        if (isRejected) {
          return (
            <span className="px-4 py-2 rounded-full text-md bg-red-100 text-red-800">
              Rejected
            </span>
          );
        }
        
        if (isPacked) {
          return (
            <span className="px-4 py-2 rounded-full text-md bg-green-100 text-green-800">
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
      },
    }),
    [handleView, handleEdit]
  );

  return (
    <div className="">
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
        data={currentData}
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
                  ? 'bg-primary text-white shadow-sm '
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
        title={"Fabric Inspection Details"}
        className="w-full max-w-4xl"
      >
        {currentInspection && (
          <div className="space-y-4">
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
                <p className="text-sm text-gray-500">Loom No</p>
                <p className="font-medium">{currentInspection.loomNo || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Beam No</p>
                <p className="font-medium">{currentInspection.beamNo || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Empty Beam No</p>
                <p className="font-medium">{currentInspection.flangeNo || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">JobWork Order No</p>
                <p className="font-medium">{currentInspection.jobWorkOrderNo || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Buyer Name</p>
                <p className="font-medium">{currentInspection.buyerName || '-'}</p>
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
                <p className="text-sm text-gray-500">EPI</p>
                <p className="font-medium">{currentInspection.epi || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PPI</p>
                <p className="font-medium">{currentInspection.ppi || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Width</p>
                <p className="font-medium">{currentInspection.width || '-'}</p>
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
                <p className="text-sm text-gray-500">Buyer Inspector</p>
                <p className="font-medium">{currentInspection.buyerInspector || (currentInspection.buyerInspectorId ? customerMap.get(String(currentInspection.buyerInspectorId)) : '-') || '-'}</p>
              </div>
              {currentInspection.packingOption && (
                <div>
                  <p className="text-sm text-gray-500">Post-Inspection Action</p>
                  <p className="font-medium">
                    {currentInspection.packingOption === 'PACK_LATER' ? 'Pack Later' : currentInspection.packingOption === 'PACK_IMMEDIATELY' ? 'Pack Immediately' : currentInspection.packingOption === 'REJECT' ? 'Reject' : currentInspection.packingOption}
                  </p>
                </div>
              )}
              {currentInspection.packLaterReason && (
                <div>
                  <p className="text-sm text-gray-500">Reason for Packing Later</p>
                  <p className="font-medium text-amber-700">{currentInspection.packLaterReason}</p>
                </div>
              )}
              {currentInspection.rejectedReason && (
                <div>
                  <p className="text-sm text-gray-500">Rejected Reason</p>
                  <p className="font-medium text-red-600">{currentInspection.rejectedReason}</p>
                </div>
              )}
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
                        <th className="border p-2">Roll Doff Meter</th>
                        <th className="border p-2">Inspected Meter</th>
                        <th className="border p-2">Actual Net Weight</th>
                        <th className="border p-2">Avg Weight</th>
                        <th className="border p-2">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInspection.inspectionDetails.map((detail: any, index: number) => (
                        <tr key={detail.id || index}>
                          <td className="border p-2 text-center">{index + 1}</td>
                          <td className="border p-2 text-center">{detail.pieceNo || "-"}</td>
                          <td className="border p-2 text-center">{detail.rollDoffMeters ?? detail.roll_doff_meters ?? detail.pieceMeters ?? "-"}</td>
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
                const row = completedData.find((r: any) => r.id === id);
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