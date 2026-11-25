// import { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { Eye, Edit2, Trash2, Edit, Trash } from "lucide-react";
// import { DataTable } from "@/components/data/DataTable";
// import { AppDispatch, RootState } from "@/state/store";
// import { deleteBaleRollPacking, getAllBaleRollPackings, getAllBaleRollPackingsByCompanyId, deleteBaleRollPackingByCompanyId } from "@/state/baleRollPackingSlice";
// import { Modal } from "@/components/ui/Modal";
// import { Button } from "@/components/ui/button";
// import { formatDate } from "@/lib/utils";
// import { getAllCustomers } from "@/state/customerSlice";
// import { getAllSalesOrders } from "@/state/salesOrderSlice";
// import { getAllFabricMasters } from "@/state/fabricMasterSlice";
// import { getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
// import { getFactoryPieceEntriesByCompany, getAllFactoryPieceEntries } from "@/state/factoryPieceEntrySlice";
// import { getAllCompanies } from "@/state/company-master-slice";
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

// export default function BaleRollPackingDetails() {
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const { list, loading } = useSelector((s: RootState) => s.baleRollPacking);
//   const { customerList } = useSelector((s: RootState) => s.customer as any);
//   const { salesOrderList } = useSelector((s: RootState) => s.salesOrder as any);
//   const { fabricMasterList } = useSelector((s: RootState) => s.fabricMaster as any);
//   const { weavingJobWorkOrderList } = useSelector((s: RootState) => (s as any).weavingJobWorkOrder as any);
//   const { list: pieceEntryList } = useSelector((s: RootState) => (s as any).factoryPieceEntry as any);
//   const { companyMasterList } = useSelector((s: RootState) => (s as any).companyMaster as any);

//   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
//   const [isViewOpen, setIsViewOpen] = useState(false);
//   const [current, setCurrent] = useState<any>(null);

//   useEffect(() => {

//     dispatch(getAllCustomers({fetchAll: true}));

//     dispatch(getAllFabricMasters({fetchAll: true}));
//     dispatch(getAllCompanies({fetchAll: true} as any));
//     const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//     const companyId = v ? Number(v) : undefined;
//     if (companyId) {
//         dispatch( getAllWeavingJobWorkOrdersByFactoryCompanyId({
//                      factoryCompanyId: companyId,
//                     }) as any);
//       // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(companyId) as any);
//       dispatch(getAllBaleRollPackingsByCompanyId(companyId));
//       dispatch(getFactoryPieceEntriesByCompany(companyId) as any);
//       dispatch(getAllSalesOrders(companyId ? { companyId, fetchAll: true } : {}) as any);
//     } else {
//       dispatch(getAllBaleRollPackings({fetchAll: true}));
//       dispatch(getAllFactoryPieceEntries({fetchAll: true}) as any);
//     }
//   }, [dispatch]);

//   // map rows with S.No and computed summary fields
//   const rows = useMemo(() => {
//     // Normalize reference data
//     const customersRaw = (customerList as any)?.data ?? (customerList as any) ?? [];
//     const customersArr: any[] = Array.isArray(customersRaw) ? customersRaw : [];
//     const customerMap = new Map(customersArr.map((c: any) => [String(c.id), c.customerName || c.name]));

//     const companiesRaw = (companyMasterList as any)?.data ?? (companyMasterList as any) ?? [];
//     const companiesArr: any[] = Array.isArray(companiesRaw) ? companiesRaw : [];
//     const companyMap = new Map(companiesArr.map((c: any) => [String(c.id), c.companyName || c.name]));

//     const wRaw = (weavingJobWorkOrderList as any)?.data ?? (weavingJobWorkOrderList as any) ?? [];
//     const wArr: any[] = Array.isArray(wRaw) ? wRaw : [];
//     const wjoMap = new Map(wArr.map((w: any) => [String(w.id), w.jobWorkOrderNo || w.weavingJobWorkOrderNo || w.weavingWorkOrderNo || String(w.id)]));

//     const salesRaw = (salesOrderList as any)?.data ?? (salesOrderList as any) ?? [];
//     const salesArr: any[] = Array.isArray(salesRaw) ? salesRaw : [];
//     const salesOrderMap = new Map(
//       salesArr.map((s: any) => [
//         String(s.id),
//         s.salesOrderNo || s.orderNo || s.orderNumber || s.salesOrderNumber || s.soNumber || `SO ${s.id}`
//       ])
//     );

//     const fabricsRaw = (fabricMasterList as any)?.data ?? (fabricMasterList as any) ?? [];
//     const fabricsArr: any[] = Array.isArray(fabricsRaw) ? fabricsRaw : [];
//     const fabricQualityMap = new Map(fabricsArr.map((f: any) => [String(f.id), f.fabricQuality || f.quality || ""]));
//     const fabricCodeMap = new Map(fabricsArr.map((f: any) => [String(f.id), f.fabricCode || f.code || ""]));

//     // Normalize piece entry list
//     const pieceEntriesRaw = (pieceEntryList as any)?.data ?? (pieceEntryList as any) ?? [];
//     const pieceEntriesArr: any[] = Array.isArray(pieceEntriesRaw) ? pieceEntriesRaw : [];

//     return (list || []).map((x: any, idx: number) => {
//       const meter = (x.items || []).reduce((a: number, p: any) => a + (Number(p.meters) || 0), 0);
//       const yards = (x.items || []).reduce((a: number, p: any) => a + (Number(p.yards) || 0), 0);
//       const net = (x.items || []).reduce((a: number, p: any) => a + (Number(p.netWeight) || 0), 0);
//       const avg = (x.items || []).length
//         ? (x.items || []).reduce((a: number, p: any) => a + (Number(p.avgWeight) || 0), 0) / (x.items || []).length
//         : 0;
//       const pieceNos = (x.items || []).map((p: any) => p.pieceNo).filter(Boolean).join(', ');

//       // Resolve display fields if backend didn't include names/labels
//       const orderTypeId = Number(x.orderTypeId ?? 0);
//       const buyerName = x.buyerName || customerMap.get(String(x.buyerId)) || "";
//       // (orderTypeId === 1 
//       //   ? companyMap.get(String(x.buyerId)) || ""
//       //   : customerMap.get(String(x.buyerId)) || "");
//       const weavingWorkOrderNo = x.weavingWorkOrderNo || (x.weavingWorkOrderId ? wjoMap.get(String(x.weavingWorkOrderId)) : "") || "";
//       const salesOrderNo = x.salesOrderNo || (x.salesOrderId ? salesOrderMap.get(String(x.salesOrderId)) : "") || "";
//       const isJobwork = Number(x.isJobwork ?? x.isJobWork ?? 0) === 1;
//       const orderNo = isJobwork ? (weavingWorkOrderNo || salesOrderNo) : (salesOrderNo || weavingWorkOrderNo);
//       const fabricQuality = x.fabricQuality || x.fabricQualityId || fabricQualityMap.get(String(x.fabricCodeId)) || "";
//       const fabricCode = x.fabricCode || fabricCodeMap.get(String(x.fabricCodeId)) || "";

//       // Check if all pieces in this packing are dispatched
//       const isDispatchedCalculated = (Number(x.isDispatched ?? 0) === 1) || (x.items || []).some((item: any) => {
//         if (!item.pieceNo) return false;
//         return pieceEntriesArr.some((pe: any) =>
//           (pe.pieceNumber === item.pieceNo || pe.pieceNumberComputed === item.pieceNo) &&
//           (pe.isDispatched === 1 || pe.isDispatched === true)
//         );
//       });

//       return {
//         ...x,
//         serialNo: idx + 1,
//         meter,
//         yards,
//         netWeightTotal: net,
//         avgWeightTotal: avg,
//         pieceNos,
//         buyerName,
//         weavingWorkOrderNo,
//         salesOrderNo,
//         orderNo,
//         fabricQuality,
//         fabricCode,
//         isDispatched: isDispatchedCalculated ? 1 : 0,
//         statusBadge: isDispatchedCalculated ? 'Dispatched' : undefined,
//       };
//     });
//   }, [list, customerList, companyMasterList, fabricMasterList, weavingJobWorkOrderList, salesOrderList, pieceEntryList]);

//   const columns = useMemo(
//     () => [
//       { Header: 'S.No', accessor: 'serialNo', width: 50, disableFilters: true },
//       {
//         Header: 'Date',
//         accessor: 'packingDate',
//         Cell: ({ value }: any) => formatDate(value),
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
//       // { Header: 'Packing No', accessor: 'packingNo' },
//       { Header: 'Bale / Roll No', accessor: 'rollOrBaleNo' },
//       { Header: 'Buyer Name', accessor: 'buyerName' },
//       { Header: 'Order No', accessor: 'orderNo' },
//       { Header: 'Fabric Quality', accessor: 'fabricQuality' },

//       { Header: 'Meter', accessor: 'meter' },
//       { Header: 'Yards', accessor: 'yards' },
//       { Header: 'Net Weight', accessor: 'netWeightTotal' },
//       { Header: 'Avg Wt', accessor: 'avgWeightTotal' },
//       {
//         Header: 'Barcode',
//         accessor: 'barcode',
//         Cell: ({ row }: any) => {
//           const barcodeValue = row.original.rollOrBaleNo || row.original.orderNo || row.original.packingNo || '';

//           const queryParams = new URLSearchParams({
//             barcode: barcodeValue,
//             fabricCode: row.original.fabricCode || '',
//             fabricQuality: row.original.fabricQuality || '',
//             meter: String(row.original.totalMeters || row.original.meter || ''),
//             yards: String(row.original.totalYards || row.original.yards || ''),
//             netWeight: String(row.original.totalNet || row.original.netWeightTotal || ''),
//             avgWeight: String(row.original.totalAvg || row.original.avgWeightTotal || ''),
//             grossWeight: String(row.original.totalGross || row.original.grossWeight || ''),
//             companyId: String(row.original.companyId || '')
//           }).toString();
//           // alert(queryParams);
//           return (
//             <a
//               href={`#/transaction/barcode-sticker?${queryParams}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-blue-600 hover:underline font-medium"
//             >
//               Barcode
//             </a>
//           );
//         }
//       },
//       {
//         Header: "Actions",
//         accessor: "actions",
//         disableFilters: true,
//         Cell: ({ row }: any) => {
//           const isDispatched = Number(row.original.isDispatched ?? 0) === 1;

//           if (isDispatched) {
//             return (
//               <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
//                 Dispatched
//               </span>
//             );
//           }

//           return (
//             <div className="flex gap-2">
//               <button
//                 onClick={() => onView(row.original)}
//                 className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-blue-600 transition hover:border-blue-200"
//                 title="View"
//               >
//                 <Eye className="h-4 w-4" />
//               </button>
//               <button
//                 onClick={() => onEdit(row.original)}
//                 className="rounded-lg border border-amber-100 bg-amber-50/60 p-2 text-amber-600 transition hover:border-amber-200"
//                 title="Edit"
//               >
//                 <Edit className="h-4 w-4" />
//               </button>
//               <button
//                 onClick={() => onDelete(row.original)}
//                 className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
//                 title="Delete"
//               >
//                 <Trash className="h-4 w-4" />
//               </button>
//             </div>
//           );
//         },
//       },
//     ],
//     []
//   );

//   const onAdd = () => navigate('/transaction/bale-roll-packing');
//   const onEdit = (row: any) => navigate('/transaction/bale-roll-packing', { state: { packing: row } });
//   const onDelete = (row: any) => { setCurrent(row); setIsDeleteOpen(true); };
//   const onView = (row: any) => { setCurrent(row); setIsViewOpen(true); };

//   const confirmDelete = async () => {
//     if (!current?.id) return;
//     try {
//       const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//       const companyId = v ? Number(v) : undefined;

//       if (companyId) {
//         await dispatch(deleteBaleRollPackingByCompanyId({ id: current.id, companyId })).unwrap();
//         await dispatch(getAllBaleRollPackingsByCompanyId(companyId));
//       } else {
//         await dispatch(deleteBaleRollPacking(current.id)).unwrap();
//         await dispatch(getAllBaleRollPackings({}));
//       }
//     } catch (e) {
//       // handled by slice toasts
//     }
//     setIsDeleteOpen(false);
//   };

//   const currentIsJobwork = Number(current?.isJobwork ?? current?.isJobWork ?? 0) === 1;
//   const orderLabel = currentIsJobwork ? 'Weaving Order No' : 'Sales Order No';
//   const orderValue = current?.orderNo || (currentIsJobwork ? current?.weavingWorkOrderNo : current?.salesOrderNo) || '--';

//   return (
//     <div className="p-6 pt-16">
//       {/* <h1 className="text-2xl font-semibold mb-4">Bale/RollPacking</h1> */}
//       <DataTable
//         title="Bale/RollPacking"
//         data={rows}
//         columns={columns as any}
//         onAdd={onAdd}
//         onEdit={onEdit}
//         onDelete={onDelete}
//         onView={onView}
//         showActions={false}
//         filterPlaceholder="Search by Buyer/Order/Piece/BaleNo..."
//         showColumnFilters={true}
//       />

//       <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Packing Details" className="w-full max-w-4xl">
//         {current && (
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div><p className="text-sm text-gray-500">Date</p><p className="font-medium">{formatDate(current.packingDate)}</p></div>
//               <div><p className="text-sm text-gray-500">Buyer</p><p className="font-medium">{current.buyerName}</p></div>
//               <div><p className="text-sm text-gray-500">{orderLabel}</p><p className="font-medium">{orderValue}</p></div>
//               <div><p className="text-sm text-gray-500">Fabric Quality</p><p className="font-medium">{current.fabricQuality}</p></div>
//               <div><p className="text-sm text-gray-500">Bale/Roll No</p><p className="font-medium">{current.rollOrBaleNo}</p></div>
//               <div><p className="text-sm text-gray-500">UOM</p><p className="font-medium">{current.uomName}</p></div>
//             </div>

//             {(current.items?.length ?? 0) > 0 && (
//               <div className="mt-4">
//                 <h3 className="font-medium mb-2">Pieces</h3>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full border">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
//                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Piece No</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meters</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Yards</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Wt</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Wt</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gross Wt</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {current.items.map((it: any, i: number) => (
//                         <tr key={i}>
//                           <td className="px-3 py-2">{i + 1}</td>
//                           <td className="px-3 py-2">{it.pieceNo}</td>
//                           <td className="px-3 py-2">{it.meters}</td>
//                           <td className="px-3 py-2">{it.yards}</td>
//                           <td className="px-3 py-2">{it.netWeight}</td>
//                           <td className="px-3 py-2">{it.avgWeight}</td>
//                           <td className="px-3 py-2">{it.grossWeight ?? '-'}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             <div className="flex justify-end pt-4">
//               <button onClick={() => setIsViewOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
//             </div>
//           </div>
//         )}
//       </Modal>

//       <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Delete">
//         <div className="space-y-4">
//           <p>Are you sure you want to delete this packing record?</p>
//           <p className="text-red-600 text-sm">This action cannot be undone.</p>
//           <div className="flex justify-end gap-2">
//             <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setIsDeleteOpen(false)}>Cancel</button>
//             <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={confirmDelete}>Delete</button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Trash } from "lucide-react";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { AppDispatch, RootState } from "@/state/store";
import { deleteBaleRollPacking, getAllBaleRollPackings, getAllBaleRollPackingsByCompanyId, deleteBaleRollPackingByCompanyId } from "@/state/baleRollPackingSlice";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { getFabricBarcodeLink, FabricBarcodePiece } from "@/lib/barcode";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getFactoryPieceEntriesByCompany, getAllFactoryPieceEntries } from "@/state/factoryPieceEntrySlice";
import { getAllCompanies } from "@/state/company-master-slice";


export default function BaleRollPackingDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { list, loading } = useSelector((s: RootState) => s.baleRollPacking);
  const { customerList } = useSelector((s: RootState) => s.customer as any);
  const { salesOrderList } = useSelector((s: RootState) => s.salesOrder as any);
  const { fabricMasterList } = useSelector((s: RootState) => s.fabricMaster as any);
  const { weavingJobWorkOrderList } = useSelector((s: RootState) => (s as any).weavingJobWorkOrder as any);
  const { list: pieceEntryList } = useSelector((s: RootState) => (s as any).factoryPieceEntry as any);
  const { companyMasterList } = useSelector((s: RootState) => (s as any).companyMaster as any);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);

  const selectedCompanyId = useMemo(() => {
    const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return v ? Number(v) : undefined;
  }, []);



  useEffect(() => {
    dispatch(getAllCustomers({fetchAll: true}));
    dispatch(getAllFabricMasters({fetchAll: true}));
    dispatch(getAllCompanies({fetchAll: true} as any));
    
    const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = v ? Number(v) : undefined;
    
    if (companyId) {
      dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
        factoryCompanyId: companyId,
      }) as any);
      dispatch(getAllBaleRollPackingsByCompanyId(companyId));
      dispatch(getFactoryPieceEntriesByCompany(companyId) as any);
      dispatch(getAllSalesOrders(companyId ? { companyId, fetchAll: true } : {}) as any);
    } else {
      dispatch(getAllBaleRollPackings({fetchAll: true}));
      dispatch(getAllFactoryPieceEntries({fetchAll: true}) as any);
    }
  }, [dispatch]);

  // map rows with S.No and computed summary fields
  const rows = useMemo(() => {
    // Normalize reference data
    const customersRaw = (customerList as any)?.data ?? (customerList as any) ?? [];
    const customersArr: any[] = Array.isArray(customersRaw) ? customersRaw : [];
    const customerMap = new Map(customersArr.map((c: any) => [String(c.id), c.customerName || c.name]));

    const companiesRaw = (companyMasterList as any)?.data ?? (companyMasterList as any) ?? [];
    const companiesArr: any[] = Array.isArray(companiesRaw) ? companiesRaw : [];
    const companyMap = new Map(companiesArr.map((c: any) => [String(c.id), c.companyName || c.name]));

    const wRaw = (weavingJobWorkOrderList as any)?.data ?? (weavingJobWorkOrderList as any) ?? [];
    const wArr: any[] = Array.isArray(wRaw) ? wRaw : [];
    const wjoMap = new Map(wArr.map((w: any) => [String(w.id), w.jobWorkOrderNo || w.weavingJobWorkOrderNo || w.weavingWorkOrderNo || String(w.id)]));

    const salesRaw = (salesOrderList as any)?.data ?? (salesOrderList as any) ?? [];
    const salesArr: any[] = Array.isArray(salesRaw) ? salesRaw : [];
    const salesOrderMap = new Map(
      salesArr.map((s: any) => [
        String(s.id),
        s.salesOrderNo || s.orderNo || s.orderNumber || s.salesOrderNumber || s.soNumber || `SO ${s.id}`
      ])
    );

    const fabricsRaw = (fabricMasterList as any)?.data ?? (fabricMasterList as any) ?? [];
    const fabricsArr: any[] = Array.isArray(fabricsRaw) ? fabricsRaw : [];
    const fabricQualityMap = new Map(fabricsArr.map((f: any) => [String(f.id), f.fabricQuality || f.quality || ""]));
    const fabricCodeMap = new Map(fabricsArr.map((f: any) => [String(f.id), f.fabricCode || f.code || ""]));

    // Normalize piece entry list
    const pieceEntriesRaw = (pieceEntryList as any)?.data ?? (pieceEntryList as any) ?? [];
    const pieceEntriesArr: any[] = Array.isArray(pieceEntriesRaw) ? pieceEntriesRaw : [];

    const filteredList = (list || []).filter((x: any) => {
      const items = Array.isArray(x.items)
        ? x.items
        : Array.isArray(x?.items?.data)
          ? x.items.data
          : Array.isArray(x?.baleRollPackingItems)
            ? x.baleRollPackingItems
            : Array.isArray(x?.packingItems)
              ? x.packingItems
              : [];
      return !items.some((item: any) => item.isReturnedPiece === 1 || item.is_returned_piece === 1);
    });

    return filteredList.map((x: any, idx: number) => {
      const meter = (x.items || []).reduce((a: number, p: any) => a + (Number(p.meters) || 0), 0);
      const yards = (x.items || []).reduce((a: number, p: any) => a + (Number(p.yards) || 0), 0);
      const net = (x.items || []).reduce((a: number, p: any) => a + (Number(p.netWeight) || 0), 0);
      const avg = (x.items || []).length
        ? ((x.items || []).reduce((a: number, p: any) => a + (Number(p.avgWeight) || 0), 0) / (x.items || []).length).toFixed(3)
        : "0.000";
      const pieceNos = (x.items || []).map((p: any) => p.pieceNo).filter(Boolean).join(', ');

      // Resolve display fields if backend didn't include names/labels
      const orderTypeId = Number(x.orderTypeId ?? 0);
      const buyerName = x.buyerName || customerMap.get(String(x.buyerId)) || "";
      const weavingWorkOrderNo = x.weavingWorkOrderNo || (x.weavingWorkOrderId ? wjoMap.get(String(x.weavingWorkOrderId)) : "") || "";
      const salesOrderNo = x.salesOrderNo || (x.salesOrderId ? salesOrderMap.get(String(x.salesOrderId)) : "") || "";
      const isJobwork = Number(x.isJobwork ?? x.isJobWork ?? 0) === 1;
      const orderNo = isJobwork ? (weavingWorkOrderNo || salesOrderNo) : (salesOrderNo || weavingWorkOrderNo);
      const fabricQuality = x.fabricQuality || x.fabricQualityId || fabricQualityMap.get(String(x.fabricCodeId)) || "";
      const fabricCode = x.fabricCode || fabricCodeMap.get(String(x.fabricCodeId)) || "";

      // Check if all pieces in this packing are dispatched
      const isDispatchedCalculated = (Number(x.isDispatched ?? 0) === 1) || (x.items || []).some((item: any) => {
        if (!item.pieceNo) return false;
        return pieceEntriesArr.some((pe: any) =>
          (pe.pieceNumber === item.pieceNo || pe.pieceNumberComputed === item.pieceNo) &&
          (pe.isDispatched === 1 || pe.isDispatched === true)
        );
      });

      return {
        ...x,
        serialNo: idx + 1,
        meter,
        yards,
        netWeightTotal: net,
        avgWeightTotal: avg,
        pieceNos,
        buyerName,
        weavingWorkOrderNo,
        salesOrderNo,
        orderNo,
        fabricQuality,
        fabricCode,
        isDispatched: isDispatchedCalculated ? 1 : 0,
        statusBadge: isDispatchedCalculated ? 'Dispatched' : undefined,
      };
    });
  }, [list, customerList, companyMasterList, fabricMasterList, weavingJobWorkOrderList, salesOrderList, pieceEntryList]);



  const columns = useMemo(
    () => [
      { Header: 'S.No', accessor: 'serialNo', width: 50, disableFilters: true },
      {
        Header: 'Date',
        accessor: 'packingDate',
        Cell: ({ value }: any) => formatDate(value),
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
      { Header: 'Bale / Roll No', accessor: 'rollOrBaleNo' },
      { Header: 'Buyer Name', accessor: 'buyerName' },
      { Header: 'Order No', accessor: 'orderNo' },
      { Header: 'Construction', accessor: 'fabricQuality' },
      { Header: 'Meter', accessor: 'meter' },
      { Header: 'Yards', accessor: 'yards' },
      { Header: 'Net Weight', accessor: 'netWeightTotal' },
      { Header: 'Avg Wt', accessor: 'avgWeightTotal' },
      {
        Header: 'Barcode',
        accessor: 'barcode',
        Cell: ({ row }: any) => {
          const barcodeValue = row.original.rollOrBaleNo || row.original.orderNo || row.original.packingNo || '';

          const queryParams = new URLSearchParams({
            barcode: barcodeValue,
            fabricCode: row.original.fabricCode || '',
            fabricQuality: row.original.fabricQuality || '',
            meter: String(row.original.totalMeters || row.original.meter || ''),
            yards: String(row.original.totalYards || row.original.yards || ''),
            netWeight: String(row.original.totalNet || row.original.netWeightTotal || ''),
            avgWeight: String(row.original.totalAvg || row.original.avgWeightTotal || ''),
            grossWeight: String(row.original.totalGross || row.original.grossWeight || ''),
            companyId: String(row.original.companyId || '')
          }).toString();
          
          return (
            <a
              href={`#/transaction/barcode-sticker?${queryParams}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              Barcode
            </a>
          );
        }
      },
      {
        Header: "Actions",
        accessor: "actions",
        disableFilters: true,
        width: 150,
        Cell: ({ row }: any) => {
          const isDispatched = Number(row.original.isDispatched ?? 0) === 1;

          if (isDispatched) {
            return (
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                Dispatched
              </span>
            );
          }

          return (
            <div className="flex gap-2">
              <button
                onClick={() => onView(row.original)}
                className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-blue-600 transition hover:border-blue-200"
                title="View"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(row.original)}
                className="rounded-lg border border-amber-100 bg-amber-50/60 p-2 text-amber-600 transition hover:border-amber-200"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(row.original)}
                className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
                title="Delete"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const extractPieceEntriesForRow = useCallback((row: any): FabricBarcodePiece[] => {
    const barcodeValue = row.rollOrBaleNo || row.orderNo || row.packingNo || '';
    if (!barcodeValue) return [];
    return [{
      barcode: barcodeValue,
      fabricCode: row.fabricCode || '',
      fabricQuality: row.fabricQuality || '',
      meter: row.meter,
      yards: row.yards,
      netWeight: row.netWeightTotal ?? undefined,
      avgWeight: row.avgWeightTotal ?? undefined,
      grossWeight: row.grossWeight ?? undefined,
      companyId: row.companyId ?? selectedCompanyId,
    }];
  }, [selectedCompanyId]);

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
      const row = rows.find((r: any) => r.id === id);
      if (row) allEntries.push(...extractPieceEntriesForRow(row));
    }
    if (!allEntries.length) return;
    const link = getFabricBarcodeLink({ barcode: allEntries[0].barcode, pieceEntries: allEntries, companyId: selectedCompanyId });
    if (link) window.open(link, '_blank');
    setIsBulkPrintModalOpen(false);
  }, [selectedIds, rows, extractPieceEntriesForRow, selectedCompanyId]);

  const totalBarcodeCount = useMemo(() => {
    let count = 0;
    for (const id of selectedIds) {
      const row = rows.find((r: any) => r.id === id);
      if (row) count += extractPieceEntriesForRow(row).length;
    }
    return count;
  }, [selectedIds, rows, extractPieceEntriesForRow]);

  const checkboxColumn = useMemo(() => ({
    id: 'bulkSelect',
    Header: (
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={rows.length > 0 && selectedIds.size === rows.length}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked, rows)}
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
  }), [rows, selectedIds, handleSelectAll, handleToggleRow]);

  const activeColumns = useMemo(() => {
    if (!selectMode) return columns;
    const filtered = columns.filter((c: any) => c.accessor !== 'barcode');
    const actionsIdx = filtered.findIndex((c: any) => c.accessor === 'actions' || c.id === 'actions');
    if (actionsIdx >= 0) return [...filtered.slice(0, actionsIdx), checkboxColumn, ...filtered.slice(actionsIdx)];
    return [...filtered, checkboxColumn];
  }, [selectMode, columns, checkboxColumn]);

  const bulkBarcodeEntries = useMemo(() => {
    const result: { id: any; rollOrBaleNo: string; link: string }[] = [];
    for (const id of selectedIds) {
      const row = rows.find((r: any) => r.id === id);
      if (!row) continue;
      const pieces = extractPieceEntriesForRow(row);
      if (!pieces.length) continue;
      const link = getFabricBarcodeLink({ barcode: pieces[0].barcode, pieceEntries: pieces, companyId: selectedCompanyId });
      if (link) result.push({ id: row.id, rollOrBaleNo: row.rollOrBaleNo || row.orderNo || '', link });
    }
    return result;
  }, [selectedIds, rows, extractPieceEntriesForRow, selectedCompanyId]);

  const onAdd = () => navigate('/transaction/bale-roll-packing');
  const onEdit = (row: any) => navigate('/transaction/bale-roll-packing', { state: { packing: row } });
  const onDelete = (row: any) => { setCurrent(row); setIsDeleteOpen(true); };
  const onView = (row: any) => { setCurrent(row); setIsViewOpen(true); };

  const confirmDelete = async () => {
    if (!current?.id) return;
    try {
      const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      const companyId = v ? Number(v) : undefined;

      if (companyId) {
        await dispatch(deleteBaleRollPackingByCompanyId({ id: current.id, companyId })).unwrap();
        await dispatch(getAllBaleRollPackingsByCompanyId(companyId));
      } else {
        await dispatch(deleteBaleRollPacking(current.id)).unwrap();
        await dispatch(getAllBaleRollPackings({}));
      }
    } catch (e) {
      // handled by slice toasts
    }
    setIsDeleteOpen(false);
  };

  const currentIsJobwork = Number(current?.isJobwork ?? current?.isJobWork ?? 0) === 1;
  const orderLabel = currentIsJobwork ? 'Weaving Order No' : 'Sales Order No';
  const orderValue = current?.orderNo || (currentIsJobwork ? current?.weavingWorkOrderNo : current?.salesOrderNo) || '--';

  return (
    <div className="p-6 pt-16">
      <div className="py-3">
      {selectMode && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-0 bg-blue-200 border border-primary rounded-t-md">
          <div className="flex items-center gap-3 text-sm text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m14.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707" /><rect x="3" y="7" width="18" height="13" rx="2" strokeWidth={2} /></svg>
            <span className="font-semibold">{selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'} selected</span>
            <span className="text-primary text-xs">{totalBarcodeCount} {totalBarcodeCount === 1 ? 'barcode' : 'barcodes'} will be printed</span>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button onClick={handleClearSelection} className="text-xs text-primary hover:text-primary font-medium underline-offset-2 hover:underline">
                Clear
              </button>
            )}
            <button
              disabled={selectedIds.size === 0}
              onClick={() => setIsBulkPrintModalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedIds.size === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary shadow'}`}
            >
              Print Bundle of Barcodes
            </button>
          </div>
        </div>
      )}
      </div>
      <DataTable
        title="Bale/RollPacking"
        data={rows}
        columns={activeColumns as any}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        showActions={false}
        filterPlaceholder="Search by Buyer/Order/Piece/BaleNo..."
        showColumnFilters={true}
        onRowClick={selectMode ? (row: any) => handleToggleRow(row.id) : undefined}
        getRowClassName={selectMode ? (row: any) => selectedIds.has(row.id) ? 'bg-purple-50 cursor-pointer' : 'cursor-pointer' : undefined}
            headerActions={
          <button
            onClick={() => selectMode ? handleCancelSelectMode() : setSelectMode(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${selectMode ? 'border-blue-600 bg-blue-600 text-white shadow' : 'border-blue-600 bg-white text-blue-700 hover:bg-blue-50'}`}
          >
            {selectMode ? 'Cancel Selection' : 'Print Multiple Barcode'}
          </button>
        }
      />

      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Packing Details" className="w-full max-w-4xl">
        {current && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Date</p><p className="font-medium">{formatDate(current.packingDate)}</p></div>
              <div><p className="text-sm text-gray-500">Buyer</p><p className="font-medium">{current.buyerName}</p></div>
              <div><p className="text-sm text-gray-500">{orderLabel}</p><p className="font-medium">{orderValue}</p></div>
              <div><p className="text-sm text-gray-500">Construction</p><p className="font-medium">{current.fabricQuality}</p></div>
              <div><p className="text-sm text-gray-500">Bale/Roll No</p><p className="font-medium">{current.rollOrBaleNo}</p></div>
              <div><p className="text-sm text-gray-500">UOM</p><p className="font-medium">{current.uomName}</p></div>
            </div>

            {(current.items?.length ?? 0) > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Pieces</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Piece No</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meters</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Yards</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Wt</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Wt</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gross Wt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {current.items.map((it: any, i: number) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{i + 1}</td>
                          <td className="px-3 py-2">{it.pieceNo}</td>
                          <td className="px-3 py-2">{it.meters}</td>
                          <td className="px-3 py-2">{it.yards}</td>
                          <td className="px-3 py-2">{it.netWeight}</td>
                          <td className="px-3 py-2">{Number(it.avgWeight || 0).toFixed(3)}</td>
                          <td className="px-3 py-2">{it.grossWeight ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button onClick={() => setIsViewOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete this packing record?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setIsDeleteOpen(false)}>Cancel</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={confirmDelete}>Delete</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBulkPrintModalOpen}
        onClose={() => setIsBulkPrintModalOpen(false)}
        title={`Print Barcodes (${selectedIds.size} record(s) — ${totalBarcodeCount} barcode(s))`}
        className="w-full max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            The following Bale/Roll records are selected. Click <strong>Print All Barcodes</strong> to open each barcode sticker in a new tab.
          </p>
          <div className="max-h-64 overflow-y-auto border rounded divide-y text-sm">
            {bulkBarcodeEntries.map((entry: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                <span className="font-medium">{entry.rollOrBaleNo || `Record ${entry.id}`}</span>
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs"
                >
                  Open Barcode
                </a>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setIsBulkPrintModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-light"
              onClick={() => {
                bulkBarcodeEntries.forEach((entry: any) => {
                  window.open(entry.link, '_blank', 'noopener,noreferrer');
                });
                setIsBulkPrintModalOpen(false);
              }}
            >
              Print All Barcodes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}