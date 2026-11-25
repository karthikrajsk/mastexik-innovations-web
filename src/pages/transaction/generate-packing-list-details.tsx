// import React, { useEffect, useState, useMemo } from "react";
// import { DataTable } from "@/components/data/DataTable";
// import { Modal } from "@/components/ui/Modal";
// import { Eye, Edit2, Trash2, Trash, Edit } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/state/store";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { 
//   getAllGeneratePacking, 
//   deleteGeneratePacking 
// } from "@/state/generatePackingSlice";
// import { getAllInvoicesByCompanyId } from "@/state/invoiceSlice";
// import { getAllCustomers } from "@/state/customerSlice";
// import { getAllSalesOrders } from "@/state/salesOrderSlice";
// import { getAllWarehouse } from "@/state/warehouseSlice";
// import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
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

// // Helper function to format date
// const formatDate = (dateString: string) => {
//   const date = new Date(dateString);
//   return date.toLocaleDateString();
// };

// export function PackingListDetails() {
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
  
//   const { generatePackingList } = useSelector((state: RootState) => state.generatePacking);
//   const { invoiceList } = useSelector((state: RootState) => state.invoice);
//   const { customerList } = useSelector((state: RootState) => state.customer);
//   const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
//   const { warehouseList } = useSelector((state: RootState) => state.warehouse);
//   const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
//   const { list: pieceEntryList } = useSelector((state: RootState) => (state as any).factoryPieceEntry as any);
//   const { companyMasterList } = useSelector((state: RootState) => (state as any).companyMaster as any);
  
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [currentPacking, setCurrentPacking] = useState<any>(null);

//   useEffect(() => {
//     const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//     const companyId = v ? Number(v) : null;
//     dispatch(getAllGeneratePacking(companyId ? { companyId, fetchAll: true } : {}));
//     dispatch(getAllCustomers({fetchAll: true}));
//     dispatch(getAllSalesOrders(companyId ? { companyId, fetchAll: true } : {}));
//     dispatch(getAllWarehouse({fetchAll: true}));
//     dispatch(getAllCompanies({fetchAll: true}) as any);
    
//     if (companyId) {
//       dispatch(getAllInvoicesByCompanyId(companyId));
//            dispatch( getAllWeavingJobWorkOrdersByFactoryCompanyId({
//                 factoryCompanyId: companyId,
//               }) as any);
//       // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(companyId) as any);
//       dispatch(getFactoryPieceEntriesByCompany(companyId) as any);
//     } else {
//       dispatch(getAllWeavingJobWorkOrders({fetchAll: true}) as any);
//       dispatch(getAllFactoryPieceEntries({fetchAll: true}) as any);
//     }
//   }, [dispatch]);

//   // Process packing list with calculated values
//   const processedPackingList = useMemo(() => {
//     // Normalize piece entry list
//     const pieceEntriesRaw = (pieceEntryList as any)?.data ?? (pieceEntryList as any) ?? [];
//     const pieceEntriesArr: any[] = Array.isArray(pieceEntriesRaw) ? pieceEntriesRaw : [];

//     // Create customer and company maps for buyer name resolution
//     const customersRaw = (customerList as any)?.data ?? (customerList as any) ?? [];
//     const customersArr: any[] = Array.isArray(customersRaw) ? customersRaw : [];
//     const customerMap = new Map(customersArr.map((c: any) => [String(c.id), c.customerName || c.name]));

//     const companiesRaw = (companyMasterList as any)?.data ?? (companyMasterList as any) ?? [];
//     const companiesArr: any[] = Array.isArray(companiesRaw) ? companiesRaw : [];
//     const companyMap = new Map(companiesArr.map((c: any) => [String(c.id), c.companyName || c.name]));

//     const invoicesRaw = (invoiceList as any)?.data ?? invoiceList ?? [];
//     const invoicesArr: any[] = Array.isArray(invoicesRaw) ? invoicesRaw : [];

//     return generatePackingList.map((packing: any, index: number) => {
//       // Resolve buyer name based on ID lookup in both lists
//       let buyerName = packing.buyerName || "";
      
//       if (!buyerName || buyerName === "-") {
//         const buyerIdStr = String(packing.buyerId);
//         // Try customer list first
//         buyerName = customerMap.get(buyerIdStr) || "";
//         // If not found, try company list
//         if (!buyerName) {
//           buyerName = companyMap.get(buyerIdStr) || "";
//         }
//       }
      
//       if (!buyerName) buyerName = "-";
      
//       let orderNo = "-";
//       if (packing.isJobwork === 1 || packing.isJobwork === true) {
//         const weavingOrder = Array.isArray(weavingJobWorkOrderList) 
//           ? weavingJobWorkOrderList.find((wo: any) => wo.id === packing.weavingWorkOrderId)
//           : null;
//         orderNo = weavingOrder?.weavingWorkOrderNo || weavingOrder?.jobWorkOrderNo || weavingOrder?.id?.toString() || "-";
//       } else {
//         const salesOrder = salesOrderList.find((so: any) => so.id === packing.salesOrderId);
//         orderNo = salesOrder?.salesOrderNo || salesOrder?.orderNo || salesOrder?.soNo || "-";
//       }
      
//       // Calculate totals from items
//       const totalMeters = packing.items?.reduce((sum: number, item: any) => sum + (item.length || 0), 0) || 0;
//       const totalYards = packing.items?.reduce((sum: number, item: any) => sum + (item.yards || 0), 0) || 0;
//       const totalNetWeight = packing.items?.reduce((sum: number, item: any) => sum + (item.pounds || 0), 0) || 0;
//       const avgWeight = packing.items?.length > 0 
//         ? packing.items.reduce((sum: number, item: any) => sum + (item.avgWt || 0), 0) / packing.items.length 
//         : 0;
//       const totalGrossWeight = packing.items?.reduce((sum: number, item: any) => sum + (item.grossWt || 0), 0) || 0;
      
//       // Check if any pieces in this packing are invoiced
//       const isInvoiced = (packing.items || []).some((item: any) => {
//         if (!item.pieceNo) return false;
//         return pieceEntriesArr.some((pe: any) => 
//           (pe.pieceNumber === item.pieceNo || pe.pieceNumberComputed === item.pieceNo) && 
//           (pe.isInvoice === 1 || pe.isInvoice === true)
//         );
//       });

//       // Find if any item has an invoice link
//       const itemWithInvoice = (packing.items || []).find((item: any) => 
//         (Number(item.isInvoice ?? 0) === 1 || item.isInvoice === true) && 
//         (item.invoiceId != null && item.invoiceId !== 0)
//       );
      
//       const itemHasInvoice = !!itemWithInvoice;
//       const itemInvoiceId = itemWithInvoice?.invoiceId;

//       const finalInvoiceId = packing.invoiceId || itemInvoiceId;
//       const finalIsInvoice = (itemHasInvoice || isInvoiced || (Number(packing.isInvoice ?? 0) === 1 && !!finalInvoiceId)) ? 1 : 0;
      
//       return {
//         ...packing,
//         serialNo: index + 1,
//         buyerName: buyerName,
//         deliveryAt: packing.deliveryAt || "-",
//         orderNo: orderNo,
//         fabricQuality: packing.fabricQuality || "-",
//         meter: totalMeters.toFixed(2),
//         yards: totalYards.toFixed(2),
//         netWeight: totalNetWeight.toFixed(2),
//         avgWt: avgWeight.toFixed(2),
//         grossWt: totalGrossWeight.toFixed(2),
//         isInvoice: finalIsInvoice,
//         statusBadge: finalIsInvoice ? 'Invoice Done' : undefined,
//         invoiceId: finalInvoiceId,
//       };
//     });
//   }, [generatePackingList, customerList, companyMasterList, salesOrderList, weavingJobWorkOrderList, warehouseList, pieceEntryList, invoiceList]);

//   const columns = useMemo(
//     () => [
//       {
//         Header: 'S.No',
//         accessor: 'serialNo',
//         width: 50,
//         disableFilters: true,
//       },
//          {
//         Header: 'Packing List No',
//         accessor: 'packingSlipNo',
//       },
//       {
//         Header: 'Packing Date',
//         accessor: 'packingDate',
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
//         Header: 'Buyer Name',
//         accessor: 'buyerName',
//       },
//       {
//         Header: 'Delivery At',
//         accessor: 'deliveryAt',
//       },
//       {
//         Header: 'Order No',
//         accessor: 'orderNo',
//       },
//       {
//         Header: 'Fabric Quality',
//         accessor: 'fabricQuality',
//       },
   
//       {
//         Header: 'Meter',
//         accessor: 'meter',
//       },
//       {
//         Header: 'Yards',
//         accessor: 'yards',
//       },
//       {
//         Header: 'Net Weight',
//         accessor: 'netWeight',
//       },
//       {
//         Header: 'Avg Wt',
//         accessor: 'avgWt',
//       },
//       {
//         Header: 'Gross Wt',
//         accessor: 'grossWt',
//       },
//       {
//         Header: 'Print',
//         id: 'print',
//         Cell: ({ row }: any) => (
//           <div className="flex flex-col gap-1">
//             <a
//               href={`#/transaction/packing-list-print?id=${row.original.id}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-blue-600 hover:underline font-medium text-xs whitespace-nowrap"
//             >
//               Print PL
//             </a>
//             {row.original.invoiceId && (
//               <a
//                 href={`#/transaction/invoice-print?id=${row.original.invoiceId}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-green-600 hover:underline font-medium text-xs whitespace-nowrap"
//               >
//                 Print Invoice
//               </a>
//             )}
//           </div>
//         ),
//         disableFilters: true,
//       },
//       {
//         Header: "Actions",
//         accessor: "actions",
//         disableFilters: true,
//         Cell: ({ row }: any) => {
//           const isInvoiced = Number(row.original.isInvoice ?? 0) === 1 && !!row.original.invoiceId;

//           return (
//             <div className="flex items-center gap-2">
//                <button
//                 onClick={() => handleView(row.original)}
//                 className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-blue-600 transition hover:border-blue-200"
//                 title="View"
//               >
//                 <Eye className="h-4 w-4" />
//               </button>
//               {isInvoiced ? (
//                 <span className="px-2 py-1 rounded-full text-[10px] bg-green-100 text-green-800 font-bold uppercase tracking-wider border border-green-200 shadow-sm">
//                   Invoiced
//                 </span>
//               ) : (
//                 <>
//                   <button
//                     onClick={() => handleEdit(row.original)}
//                     className="rounded-lg border border-amber-100 bg-amber-50/60 p-2 text-amber-600 transition hover:border-amber-200"
//                     title="Edit"
//                   >
//                     <Edit className="h-4 w-4" />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(row.original)}
//                     className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
//                     title="Delete"
//                   >
//                     <Trash className="h-4 w-4" />
//                   </button>
//                 </>
//               )}
//             </div>
//           );
//         },
//       },
//     ],
//     []
//   );

//   const handleAdd = () => {
//     navigate("/transaction/generate-packing-list");
//   };

//   const handleEdit = (packing: any) => {
//     console.log("Editing packing:", packing);
//     navigate("/transaction/generate-packing-list", { state: { packing } });
//   };

//   const handleDelete = (packing: any) => {
//     setCurrentPacking(packing);
//     setIsDeleteModalOpen(true);
//   };

//   const handleView = (packing: any) => {
//     setCurrentPacking(packing);
//     setIsViewModalOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!currentPacking) return;

//     try {
//       await dispatch(deleteGeneratePacking(currentPacking.id)).unwrap();
//       const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//       const companyId = v ? Number(v) : null;
//       await dispatch(getAllGeneratePacking(companyId ? { companyId } : {}));
//       toast.success("Packing list deleted successfully");
//     } catch (error) {
//       console.error("Error deleting packing list:", error);
//       toast.error("Failed to delete packing list");
//     }

//     setIsDeleteModalOpen(false);
//     setCurrentPacking(null);
//   };

//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-6"></h1>

//       <DataTable
//         columns={columns}
//         data={processedPackingList}
//         title="Packing List"
//         onAdd={handleAdd}
//         onEdit={handleEdit}
//         onDelete={handleDelete}
//         onView={handleView}
//         showActions={false}
//         filterPlaceholder="SearchPacking List..."
//         showColumnFilters={true}
//       />

//       {/* View Modal */}
//       <Modal
//         isOpen={isViewModalOpen}
//         onClose={() => setIsViewModalOpen(false)}
//         title="Packing List Details"
//         className="w-full max-w-6xl"
//       >
//         {currentPacking && (
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               <div>
//                 <p className="text-sm text-gray-500">Packing List No</p>
//                 <p className="font-medium">{currentPacking.packingSlipNo}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Packing Date</p>
//                 <p className="font-medium">{formatDate(currentPacking.packingDate)}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Buyer Name</p>
//                 <p className="font-medium">{currentPacking.buyerName}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Delivery At</p>
//                 <p className="font-medium">{currentPacking.deliveryAt}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Order No</p>
//                 <p className="font-medium">{currentPacking.orderNo}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Fabric Code</p>
//                 <p className="font-medium">{currentPacking.fabricCode || "-"}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Fabric Quality</p>
//                 <p className="font-medium">{currentPacking.fabricQuality}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Warehouse</p>
//                 <p className="font-medium">
//                   {warehouseList.find((w: any) => w.id === currentPacking.warehouseId)?.warehouseName || "-"}
//                 </p>
//               </div>
//             </div>

//             {/* Summary Section */}
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h3 className="font-medium mb-3">Piece Details Summary</h3>
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 <div>
//                   <p className="text-xs text-gray-600">No. of Bales/Rolls</p>
//                   <p className="text-lg font-bold">{currentPacking.items?.length || 0}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-600">Total Pieces</p>
//                   <p className="text-lg font-bold">{currentPacking.items?.length || 0}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-600">Total Meters</p>
//                   <p className="text-lg font-bold">{currentPacking.meter}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-600">Total Yards</p>
//                   <p className="text-lg font-bold">{currentPacking.yards}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-600">Total Net Weight</p>
//                   <p className="text-lg font-bold">{currentPacking.netWeight}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-600">Avg Weight</p>
//                   <p className="text-lg font-bold">{currentPacking.avgWt}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-600">Total Gross Weight</p>
//                   <p className="text-lg font-bold">{currentPacking.grossWt}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Items Table */}
//             {currentPacking.items && currentPacking.items.length > 0 && (
//               <div className="mt-6">
//                 <h3 className="font-medium mb-2">Piece Details</h3>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full border">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Piece No</th>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meters</th>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Yards</th>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Weight</th>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Wt</th>
//                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gross Wt</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {currentPacking.items.map((item: any, index: number) => (
//                         <tr key={index}>
//                           <td className="px-4 py-2">{index + 1}</td>
//                           <td className="px-4 py-2">{item.rollNo}</td>
//                           <td className="px-4 py-2">{item.pieceNo || "-"}</td>
//                           <td className="px-4 py-2">{item.length?.toFixed(2) || "0.00"}</td>
//                           <td className="px-4 py-2">{item.yards?.toFixed(2) || "0.00"}</td>
//                           <td className="px-4 py-2">{item.pounds?.toFixed(2) || "0.00"}</td>
//                           <td className="px-4 py-2">{item.avgWt?.toFixed(3) || "0.000"}</td>
//                           <td className="px-4 py-2">{item.grossWt?.toFixed(2) || "-"}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {currentPacking.remarks && (
//               <div>
//                 <p className="text-sm text-gray-500">Remarks</p>
//                 <p className="font-medium">{currentPacking.remarks}</p>
//               </div>
//             )}

//             <div className="flex justify-end pt-4">
//               <button
//                 onClick={() => setIsViewModalOpen(false)}
//                 className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal
//         isOpen={isDeleteModalOpen}
//         onClose={() => setIsDeleteModalOpen(false)}
//         title="Confirm Delete"
//       >
//         <div className="space-y-4">
//           <p>Are you sure you want to delete this packing list?</p>
//           <p className="text-red-600 text-sm">This action cannot be undone.</p>

//           <div className="flex justify-end space-x-3 pt-4">
//             <button
//               onClick={() => setIsDeleteModalOpen(false)}
//               className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={confirmDelete}
//               className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
//             >
//               Delete
//             </button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }
import React, { useEffect, useState, useMemo } from "react";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Eye, Edit2, Trash2, Trash, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  getAllGeneratePacking, 
  deleteGeneratePacking 
} from "@/state/generatePackingSlice";
import { getAllInvoicesByCompanyId } from "@/state/invoiceSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getFactoryPieceEntriesByCompany, getAllFactoryPieceEntries } from "@/state/factoryPieceEntrySlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { DocumentAttachmentModal } from "@/components/modals/DocumentAttachmentModal";
import { useFileCounts } from "@/hooks/useFileCounts";


// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export function PackingListDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { generatePackingList } = useSelector((state: RootState) => state.generatePacking);
  const { invoiceList } = useSelector((state: RootState) => state.invoice);
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { list: pieceEntryList } = useSelector((state: RootState) => (state as any).factoryPieceEntry as any);
  const { companyMasterList } = useSelector((state: RootState) => (state as any).companyMaster as any);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPacking, setCurrentPacking] = useState<any>(null);
  const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);
  const [attachmentModalTitle, setAttachmentModalTitle] = useState<string>('');



  useEffect(() => {
    const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = v ? Number(v) : null;
    dispatch(getAllGeneratePacking(companyId ? { companyId, fetchAll: true } : {}));
    dispatch(getAllCustomers({fetchAll: true}));
    dispatch(getAllSalesOrders(companyId ? { companyId, fetchAll: true } : {}));
    dispatch(getAllWarehouse({fetchAll: true}));
    dispatch(getAllCompanies({fetchAll: true}) as any);
    
    if (companyId) {
      dispatch(getAllInvoicesByCompanyId(companyId));
      dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
        factoryCompanyId: companyId,
      }) as any);
      dispatch(getFactoryPieceEntriesByCompany(companyId) as any);
    } else {
      dispatch(getAllWeavingJobWorkOrders({fetchAll: true}) as any);
      dispatch(getAllFactoryPieceEntries({fetchAll: true}) as any);
    }
  }, [dispatch]);

  // Process packing list with calculated values
  const processedPackingList = useMemo(() => {
    // Normalize piece entry list
    const pieceEntriesRaw = (pieceEntryList as any)?.data ?? (pieceEntryList as any) ?? [];
    const pieceEntriesArr: any[] = Array.isArray(pieceEntriesRaw) ? pieceEntriesRaw : [];

    // Create customer and company maps for buyer name resolution
    const customersRaw = (customerList as any)?.data ?? (customerList as any) ?? [];
    const customersArr: any[] = Array.isArray(customersRaw) ? customersRaw : [];
    const customerMap = new Map(customersArr.map((c: any) => [String(c.id), c.customerName || c.name]));

    const companiesRaw = (companyMasterList as any)?.data ?? (companyMasterList as any) ?? [];
    const companiesArr: any[] = Array.isArray(companiesRaw) ? companiesRaw : [];
    const companyMap = new Map(companiesArr.map((c: any) => [String(c.id), c.companyName || c.name]));

    const invoicesRaw = (invoiceList as any)?.data ?? invoiceList ?? [];
    const invoicesArr: any[] = Array.isArray(invoicesRaw) ? invoicesRaw : [];

    return generatePackingList.map((packing: any, index: number) => {
      // Resolve buyer name based on ID lookup in both lists
      let buyerName = packing.buyerName || "";
      
      if (!buyerName || buyerName === "-") {
        const buyerIdStr = String(packing.buyerId);
        // Try customer list first
        buyerName = customerMap.get(buyerIdStr) || "";
        // If not found, try company list
        if (!buyerName) {
          buyerName = companyMap.get(buyerIdStr) || "";
        }
      }
      
      if (!buyerName) buyerName = "-";
      
      let orderNo = "-";
      if (packing.isJobwork === 1 || packing.isJobwork === true) {
        const weavingOrder = Array.isArray(weavingJobWorkOrderList) 
          ? weavingJobWorkOrderList.find((wo: any) => wo.id === packing.weavingWorkOrderId)
          : null;
        orderNo = weavingOrder?.weavingWorkOrderNo || weavingOrder?.jobWorkOrderNo || weavingOrder?.id?.toString() || "-";
      } else {
        const salesOrder = salesOrderList.find((so: any) => so.id === packing.salesOrderId);
        orderNo = salesOrder?.salesOrderNo || salesOrder?.orderNo || salesOrder?.soNo || "-";
      }
      
      // Calculate totals from items
      const totalMeters = packing.items?.reduce((sum: number, item: any) => sum + (item.length || 0), 0) || 0;
      const totalYards = packing.items?.reduce((sum: number, item: any) => sum + (item.yards || 0), 0) || 0;
      const totalNetWeight = packing.items?.reduce((sum: number, item: any) => sum + (item.pounds || 0), 0) || 0;
      const totalPieces = packing.items?.reduce((sum: number, item: any) => {
        const pieceNos = item.pieceNo ? item.pieceNo.split(',').map((p: any) => p.trim()).filter(Boolean) : [];
        return sum + Math.max(pieceNos.length, 1);
      }, 0) || 0;
      const avgWeight = packing.items?.length > 0 
        ? packing.items.reduce((sum: number, item: any) => sum + (item.avgWt || 0), 0) / packing.items.length 
        : 0;
      const totalGrossWeight = packing.items?.reduce((sum: number, item: any) => sum + (item.grossWt || 0), 0) || 0;
      
      // Check if any pieces in this packing are invoiced
      const isInvoiced = (packing.items || []).some((item: any) => {
        if (!item.pieceNo) return false;
        const pieceNos = item.pieceNo.split(',').map((p: any) => p.trim()).filter(Boolean);
        return pieceNos.some((pieceNo: string) => 
          pieceEntriesArr.some((pe: any) => 
            (pe.pieceNumber === pieceNo || pe.pieceNumberComputed === pieceNo) && 
            (pe.isInvoice === 1 || pe.isInvoice === true)
          )
        );
      });

      // Find if any item has an invoice link
      const itemWithInvoice = (packing.items || []).find((item: any) => 
        (Number(item.isInvoice ?? 0) === 1 || item.isInvoice === true) && 
        (item.invoiceId != null && item.invoiceId !== 0)
      );
      
      const itemHasInvoice = !!itemWithInvoice;
      const itemInvoiceId = itemWithInvoice?.invoiceId;

      const finalInvoiceId = packing.invoiceId || itemInvoiceId;
      const finalIsInvoice = (itemHasInvoice || isInvoiced || (Number(packing.isInvoice ?? 0) === 1 && !!finalInvoiceId)) ? 1 : 0;
      
      return {
        ...packing,
        serialNo: index + 1,
        buyerName: buyerName,
        deliveryAt: packing.deliveryAt || "-",
        orderNo: orderNo,
        fabricQuality: packing.fabricQuality || "-",
        meter: totalMeters.toFixed(2),
        yards: totalYards.toFixed(2),
        netWeight: totalNetWeight.toFixed(2),
        avgWt: avgWeight.toFixed(2),
        grossWt: totalGrossWeight.toFixed(2),
        totalPieces: totalPieces,
        isInvoice: finalIsInvoice,
        statusBadge: finalIsInvoice ? 'Invoice Done' : undefined,
        invoiceId: finalInvoiceId,
      };
    });
  }, [generatePackingList, customerList, companyMasterList, salesOrderList, weavingJobWorkOrderList, warehouseList, pieceEntryList, invoiceList]);

  const containerNames = useMemo(() => {
    return (processedPackingList || []).map((item: any) => `packing_list_${item.id}`);
  }, [processedPackingList]);

  const { counts: fileCounts, updateCount: updateFileCount } = useFileCounts(containerNames);

  const handleOpenAttachmentModal = React.useCallback((packing: any) => {
    setSelectedAttachmentContainer(`packing_list_${packing.id}`);
    setAttachmentModalTitle(`Packing List #${packing.packingSlipNo || packing.id} Files`);
  }, []);



  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
     
      {
        Header: 'Packing Date',
        accessor: 'packingDate',
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
        Header: 'Packing List No',
        accessor: 'packingSlipNo',
      },
      {
        Header: 'Buyer Name',
        accessor: 'buyerName',
      },
      {
        Header: 'Delivery At',
        accessor: 'deliveryAt',
      },
      {
        Header: 'Order No',
        accessor: 'orderNo',
      },
      {
        Header: 'Construction',
        accessor: 'fabricQuality',
      },
      {
        Header: 'Total Pieces',
        accessor: 'totalPieces',
      },
      {
        Header: 'Meter',
        accessor: 'meter',
      },
      {
        Header: 'Yards',
        accessor: 'yards',
      },
      {
        Header: 'Net Weight',
        accessor: 'netWeight',
      },
      {
        Header: 'Avg Wt',
        accessor: 'avgWt',
      },
      {
        Header: 'Gross Wt',
        accessor: 'grossWt',
      },
      {
        Header: 'Print',
        id: 'print',
        Cell: ({ row }: any) => (
          <div className="flex flex-col gap-1">
            <a
              href={`#/transaction/packing-list-print?id=${row.original.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium text-xs whitespace-nowrap"
            >
              Print PL
            </a>
            {row.original.invoiceId && (
              <a
                href={`#/transaction/invoice-print?id=${row.original.invoiceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline font-medium text-xs whitespace-nowrap"
              >
                Print Invoice
              </a>
            )}
          </div>
        ),
        disableFilters: true,
      },
      {
        Header: 'Files',
        accessor: 'id',
        disableFilters: true,
        Cell: (props: any) => {
          const { row } = props;
          const containerName = `packing_list_${row.original.id}`;
          const count = fileCounts[containerName] || 0;
          return count > 0 ? (
            <button
              onClick={() => handleOpenAttachmentModal(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              View Files ({count})
            </button>
          ) : (
            <button
              onClick={() => handleOpenAttachmentModal(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              Upload
            </button>
          );
        },
      },
      {
        Header: "Actions",
        accessor: "actions",
        disableFilters: true,
        width: 180,
        Cell: ({ row }: any) => {
          const isInvoiced = Number(row.original.isInvoice ?? 0) === 1 && !!row.original.invoiceId;

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleView(row.original)}
                className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-blue-600 transition hover:border-blue-200"
                title="View"
              >
                <Eye className="h-4 w-4" />
              </button>
              {isInvoiced ? (
                <span className="px-2 py-1 rounded-full text-[10px] bg-green-100 text-green-800 font-bold uppercase tracking-wider border border-green-200 shadow-sm">
                  Invoiced
                </span>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(row.original)}
                    className="rounded-lg border border-amber-100 bg-amber-50/60 p-2 text-amber-600 transition hover:border-amber-200"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(row.original)}
                    className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
                    title="Delete"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [fileCounts, handleOpenAttachmentModal]
  );

  const handleAdd = () => {
    navigate("/transaction/generate-packing-list");
  };

  const handleEdit = (packing: any) => {
    console.log("Editing packing:", packing);
    navigate("/transaction/generate-packing-list", { state: { packing } });
  };

  const handleDelete = (packing: any) => {
    setCurrentPacking(packing);
    setIsDeleteModalOpen(true);
  };

  const handleView = (packing: any) => {
    setCurrentPacking(packing);
    setIsViewModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentPacking) return;

    try {
      await dispatch(deleteGeneratePacking(currentPacking.id)).unwrap();
      const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      const companyId = v ? Number(v) : null;
      await dispatch(getAllGeneratePacking(companyId ? { companyId } : {}));
      toast.success("Packing list deleted successfully");
    } catch (error) {
      console.error("Error deleting packing list:", error);
      toast.error("Failed to delete packing list");
    }

    setIsDeleteModalOpen(false);
    setCurrentPacking(null);
  };

  return (
    <div>
 
      <DataTable
        columns={columns}
        data={processedPackingList}
        title="Packing List"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={false}
        filterPlaceholder="Search Packing List..."
        showColumnFilters={true}
      />

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Packing List Details"
        className="w-full max-w-6xl"
      >
        {currentPacking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Packing List No</p>
                <p className="font-medium">{currentPacking.packingSlipNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Packing Date</p>
                <p className="font-medium">{formatDate(currentPacking.packingDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Buyer Name</p>
                <p className="font-medium">{currentPacking.buyerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery At</p>
                <p className="font-medium">{currentPacking.deliveryAt}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order No</p>
                <p className="font-medium">{currentPacking.orderNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sort No</p>
                <p className="font-medium">{currentPacking.fabricCode || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Construction</p>
                <p className="font-medium">{currentPacking.fabricQuality}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Warehouse</p>
                <p className="font-medium">
                  {warehouseList.find((w: any) => w.id === currentPacking.warehouseId)?.warehouseName || "-"}
                </p>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Piece Details Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600">No. of Bales/Rolls</p>
                  <p className="text-lg font-bold">{currentPacking.items?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Pieces</p>
                  <p className="text-lg font-bold">{currentPacking.totalPieces || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Meters</p>
                  <p className="text-lg font-bold">{currentPacking.meter}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Yards</p>
                  <p className="text-lg font-bold">{currentPacking.yards}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Net Weight</p>
                  <p className="text-lg font-bold">{currentPacking.netWeight}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Avg Weight</p>
                  <p className="text-lg font-bold">{currentPacking.avgWt}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Gross Weight</p>
                  <p className="text-lg font-bold">{currentPacking.grossWt}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            {currentPacking.items && currentPacking.items.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Piece Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Piece No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">No of Pieces</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meters</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Yards</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Weight</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Wt</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gross Wt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentPacking.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2">{item.rollNo}</td>
                          <td className="px-4 py-2">{item.pieceNo || "-"}</td>
                          <td className="px-4 py-2">{item.pieceNo ? item.pieceNo.split(',').map((p: any) => p.trim()).filter(Boolean).length || 1 : 1}</td>
                          <td className="px-4 py-2">{item.length?.toFixed(2) || "0.00"}</td>
                          <td className="px-4 py-2">{item.yards?.toFixed(2) || "0.00"}</td>
                          <td className="px-4 py-2">{item.pounds?.toFixed(2) || "0.00"}</td>
                          <td className="px-4 py-2">{item.avgWt?.toFixed(3) || "0.000"}</td>
                          <td className="px-4 py-2">{item.grossWt?.toFixed(2) || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPacking.remarks && (
              <div>
                <p className="text-sm text-gray-500">Remarks</p>
                <p className="font-medium">{currentPacking.remarks}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this packing list?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
      {selectedAttachmentContainer && (
        <DocumentAttachmentModal
          isOpen={Boolean(selectedAttachmentContainer)}
          onClose={() => setSelectedAttachmentContainer(null)}
          containerName={selectedAttachmentContainer}
          title={attachmentModalTitle}
          onFilesUpdated={(newCount) => updateFileCount(selectedAttachmentContainer, newCount)}
        />
      )}
    </div>
  );
}