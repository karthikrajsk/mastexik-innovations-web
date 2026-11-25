// import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
// import { Modal } from "@/components/ui/Modal";
// import { AppDispatch, RootState } from "@/state/store";
// import { useDispatch, useSelector } from "react-redux";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { deleteWeavingJobWorkOrder, getAllWeavingJobWorkOrders, updateWeavingJobWorkOrder, getWeavingJobWorkOrderById, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
// import { getAllCustomers } from "@/state/customerSlice";
// import { getAllConsignee } from "@/state/consigneeSlice";
// import { getAllFabricMasters } from "@/state/fabricMasterSlice";
// import { getAllWeavingContract } from "@/state/weavingContractSlice";
// import { getAllCompanies } from "@/state/company-master-slice";
// import { OrderStatusModal } from "@/components/ui/OrderStatusModal";
// import { TransactionStatusAPI } from "@/services/transaction-status-api";


// const toNumber = (value: unknown) => {
//   const num = Number(value);
//   return Number.isFinite(num) ? num : 0;
// };

// const normalizeListData = (value: any) => {
//   if (Array.isArray(value)) return value;
//   if (value == null) return [];
//   if (Array.isArray(value.data)) return value.data;
//   if (Array.isArray(value.data?.data)) return value.data.data;
//   return [];
// };

// export function WeavingJobWorkOrderDetails() {
//   const list = useSelector((s: RootState) => s.weavingJobWorkOrder.weavingJobWorkOrderList);
//   const pagination = useSelector((s: RootState) => s.weavingJobWorkOrder.pagination);
//   const customerList = useSelector((s: RootState) => s.customer.customerList);
//   const consigneeList = useSelector((s: RootState) => s.consignee.consigneeList);
//   const fabricMasterList = useSelector((s: RootState) => s.fabricMaster.fabricMasterList);
//   const weavingContractList = useSelector((s: RootState) => s.weavingContracts.weavingContractList);
//   const companyMasterList = useSelector((s: RootState) => (s as any).companyMaster.companyMasterList);
//   const normalizedCustomerList = useMemo(() => normalizeListData(customerList), [customerList]);
//   const normalizedConsigneeList = useMemo(() => normalizeListData(consigneeList), [consigneeList]);
//   const normalizedFabricMasterList = useMemo(() => normalizeListData(fabricMasterList), [fabricMasterList]);
//   const fabricMasterLookupById = useMemo(() => {
//     const map = new Map<string, { code: string; quality: string }>();
//     normalizedFabricMasterList.forEach((fabric: any) => {
//       const id = fabric?.id ?? fabric?.fabricMasterId ?? fabric?.fabric_master_id ?? fabric?.fabricId ?? fabric?.fabric_id;
//       if (id == null) return;
//       const code = String(fabric?.fabricCode ?? fabric?.fabric_code ?? fabric?.code ?? fabric?.fabricCodeName ?? fabric?.name ?? "").trim();
//       const quality = String(fabric?.fabricQuality ?? fabric?.fabric_quality ?? fabric?.quality ?? fabric?.fabricQualityName ?? fabric?.grade ?? "").trim();
//       if (!code && !quality) return;
//       map.set(String(id), { code, quality });
//     });
//     return map;
//   }, [normalizedFabricMasterList]);
//   const normalizedCompanyList = useMemo(() => normalizeListData(companyMasterList), [companyMasterList]);
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [currentId, setCurrentId] = useState<number | null>(null);
//   const [loggedUserName, setLoggedUserName] = useState<string>("");
//   const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
//   const [currentOrder, setCurrentOrder] = useState<any | null>(null);
//   const [genericTransactionData, setGenericTransactionData] = useState<any | null>(null);
//   const [activeTab, setActiveTab] = useState<'open' | 'complete'>('open');
//   const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('pending');
//     const filters = useMemo(() => ({
//     isCompleted: activeTab === 'complete' ? 1 : 0,
//     isApproved: approvalStatus === 'approved' ? 1 : 0
//   }), [activeTab, approvalStatus]);

//   // useEffect(() => {
//   //   const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//   //   const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
//   //   if (factoryCompanyId) {

//   //     dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(factoryCompanyId) as any);
//   //   } else {
//   //     dispatch(getAllWeavingJobWorkOrders({ offset: getOffset(), limit: itemsPerPage } as any));
//   //   }
//   // }, [dispatch,currentPage, getOffset, itemsPerPage]);

//   useEffect(() => {
//     const storedCompanyId =
//       localStorage.getItem("selectedCompanyId") ||
//       localStorage.getItem("selectedCompany")

//     const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null

//     if (factoryCompanyId) {
//       dispatch(
//         getAllWeavingJobWorkOrdersByFactoryCompanyId({
//           factoryCompanyId,
//           fetchAll: true,
//           filters
//         }) as any
//       )
//     } else {
//       dispatch(
//         getAllWeavingJobWorkOrders({ fetchAll: true }) as any
//       )
//     }
//   }, [dispatch, filters])

//   useEffect(() => {
//     try {
//       const payload = localStorage.getItem('authPayload');
//       if (payload) {
//         const parsed = JSON.parse(payload);
//         const name = parsed?.user?.userName || parsed?.user?.name || '';
//         setLoggedUserName(String(name));
//       }
//     } catch { }
//   }, []);

//   useEffect(() => {
//     if (!customerList?.length) {
//       dispatch(getAllCustomers({ fetchAll: true } as any));
//     }
//     if (!consigneeList?.length) {
//       dispatch(getAllConsignee({ fetchAll: true } as any));
//     }
//     if (!fabricMasterList?.length) {
//       dispatch(getAllFabricMasters({ fetchAll: true } as any));
//     }
//     if (!weavingContractList?.length) {
//       dispatch(getAllWeavingContract({ fetchAll: true } as any));
//     }
//     if (!(companyMasterList as any)?.length) {
//       dispatch(getAllCompanies({}) as any);
//     }
//   }, [dispatch, customerList?.length, consigneeList?.length, fabricMasterList?.length, weavingContractList?.length, (companyMasterList as any)?.length]);



//   const handleTabChange = (tab: 'open' | 'complete') => {
//     if (activeTab === tab) return;
//     setActiveTab(tab);
//   };

//   const handleApprovalChange = (status: 'pending' | 'approved') => {
//     if (approvalStatus === status) return;
//     setApprovalStatus(status);
//   };

//   const companyDisplayName = useMemo(() => {
//     try {
//       const payload = localStorage.getItem('authPayload');
//       if (payload) {
//         const parsed: any = JSON.parse(payload);
//         const name = parsed?.selectedCompany?.name ||
//           parsed?.user?.selectedCompany?.name ||
//           (Array.isArray(parsed?.user?.companies) ? parsed.user.companies[0]?.name : undefined);
//         if (name) return String(name);
//       }
//     } catch { }
//     return '';
//   }, []);

//   const customerMap = useMemo(() => {
//     return new Map(
//       normalizedCustomerList.map((customer: any) => [String(customer.id), customer.customerName || customer.name || customer.companyName || '-'])
//     );
//   }, [normalizedCustomerList]);

//   const consigneeMap = useMemo(() => {
//     return new Map(
//       normalizedConsigneeList.map((consignee: any) => [String(consignee.id), consignee.consigneeName || consignee.name || '-'])
//     );
//   }, [normalizedConsigneeList]);

//   const companyMap = useMemo(() => {
//     return new Map(normalizedCompanyList.map((c: any) => [String(c.id), c.companyName || c.name || '-']));
//   }, [normalizedCompanyList]);

//   const processed = useMemo(() => {
//     const source = normalizeListData(list);
//     const serialBase = 0;
//     return source.map((row: any, idx: number) => {
//       const items = Array.isArray(row.items) ? row.items : [];
//       const orderDetails = Array.isArray(row.orderDetails) ? row.orderDetails : [];
//       const firstItem = items[0] || {};
//       const fabricMaster = fabricMasterLookupById.get(String(firstItem.fabricCodeId));
//       const code = fabricMaster?.code || firstItem.fabricCode || firstItem.fabricCodeName || '';
//       const quality = fabricMaster?.quality || firstItem.fabricQuality || firstItem.fabricQualityName || '';
//       const fabricSummary = [code, quality].filter(Boolean).join(' / ');
//       const itemQuantity = items.reduce((sum: number, item: any) => sum + toNumber(item.quantity ?? item.orderQty ?? item.plannedQuantity), 0);
//       const orderDetailQuantity = orderDetails.reduce((sum: number, detail: any) => sum + toNumber(detail.totalQuantity ?? detail.orderQuantity ?? detail.plannedQuantity), 0);
//       const totalQuantity = itemQuantity || orderDetailQuantity || toNumber(row.orderQuantity);
//       let buyerName = row.buyerName || customerMap.get(String(row.buyerId)) || '-';
//       let consigneeName = row.consigneeName || consigneeMap.get(String(row.consigneeId)) || '-';
//       if (Number(row.orderTypeId) === 1) {
//         const n = companyMap.get(String(row.tradingCompanyId));
//         if (n) buyerName = n;
//         if (loggedUserName) consigneeName = loggedUserName;
//       }
//       const dispatchedQuantity = toNumber(row.dispatchedQty ?? row.dispatchedQuantity);
//       const weavingContract = (weavingContractList || []).find((wc: any) => String(wc.id) === String(row.weavingContractId));
//       const weavingContractNo = weavingContract?.weavingContractNo ?? weavingContract?.contractNo ?? row.weavingContractNo ?? '-';

//       const isComplete = row.isCompleted === 1 || row.isCompleted === true || row.isComplete === 1 || row.isComplete === true;
//       const isApproved = row.isApproved === 1 || row.isApproved === true;

//       return {
//         ...row,
//         serialNo: serialBase + idx + 1,
//         orderTypeLabel: Number(row.orderTypeId) === 1 ? 'Internal' : 'External',
//         orderDate: row.orderDate,
//         jobWorkOrderNo: row.weavingWorkOrderNo || '-',
//         weavingContractNo,
//         buyerName,
//         consigneeName,
//         fabricSummary: fabricSummary || '-',
//         orderQty: totalQuantity,
//         dispatchedQty: dispatchedQuantity,
//         statusLabel: row.activeFlag ? 'Active' : 'Inactive',
//         isCompleted: isComplete,
//         isApproved: isApproved,
//       };
//     });
//   }, [list, customerMap, consigneeMap, fabricMasterLookupById, weavingContractList, loggedUserName, companyMap]);

//   const onToggleCompleted = async (row: any, value: boolean) => {
//     try {
//       const res: any = await dispatch(getWeavingJobWorkOrderById(row.id) as any);
//       const rec = (res as any)?.payload?.data || (res as any)?.payload || row;
//       const { serialNo, orderTypeLabel, jobWorkOrderNo, buyerName, consigneeName, fabricSummary, statusLabel, weavingContractNo, ...rest } = rec || {};
//       const payload = { ...rest, isCompleted: value };
//       const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//       const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
//       await dispatch(updateWeavingJobWorkOrder(factoryCompanyId ? { id: row.id, data: payload, factoryCompanyId } as any : { id: row.id, data: payload } as any));
//       if (factoryCompanyId) {
//         dispatch(
//           getAllWeavingJobWorkOrdersByFactoryCompanyId({
//             factoryCompanyId,
//             filters
//           }) as any
//         )
//       } else {
//         dispatch(getAllWeavingJobWorkOrders({fetchAll: true} as any));
//       }
//       // dispatch(getAllWeavingJobWorkOrders({} as any));
//       if (value) setActiveTab('complete');
//     } catch { }
//   };

//   const handleCompleteOrder = useCallback((row: any) => {
//     if (!row) return;
//     setCurrentOrder(row);
//     setGenericTransactionData({
//       ...row,
//       transactionTypeId: 132,
//       buyerId: row.buyerId || undefined,
//     });
//     setIsOrderStatusModalOpen(true);
//   }, []);

//   const handleSaveOrderStatus = async (
//     completionDate: string,
//     description: string,
//     transactionDataFromModal?: any
//   ) => {
//     if (!currentOrder) return;

//     const isReopening = currentOrder.order_status === 'Completed' || currentOrder.isComplete === 1;
//     const transactionStatus = isReopening ? 'Open' : 'Completed';

//     const transactionStatusPayload = {
//       id: currentOrder.id,
//       transactionTypeId: 132,
//       transactionTypeName: 'weaving-jobwork-orders',
//       primaryTypeId: currentOrder.id,
//       buyerId: transactionDataFromModal?.buyerId || currentOrder.buyerId,
//       vendorId: transactionDataFromModal?.vendorId || undefined,
//       date: completionDate,
//       description: description || '',
//       status: transactionStatus,
//       isActive: true
//     };

//     try {
//       await TransactionStatusAPI.postTransactionStatus(transactionStatusPayload as any);
//       const isReopening = !!currentOrder.isCompleted;
//       await onToggleCompleted(currentOrder, !isReopening);
//       setIsOrderStatusModalOpen(false);
//     } catch { }
//   };

//   const columns = useMemo(() => [
//     { Header: 'S.No', accessor: 'serialNo',  width: 50,
//           disableFilters: true, },
//     { Header: 'Order Date', accessor: 'orderDate', Cell: ({ value }: { value: string }) => {
//                                               if (!value) return 'N/A';
//                                               const date = new Date(value);
//                                               const day = date.getDate().toString().padStart(2, '0');
//                                               const month = (date.getMonth() + 1).toString().padStart(2, '0');
//                                               const year = date.getFullYear();
//                                               return `${day}/${month}/${year}`;
//                                             },
//                                             Filter: DateRangeFilter, },
//     {
//       Header: 'Job Work Order No',

//       accessor: 'jobWorkOrderNo'
//     },
//         { Header: 'Order Type', accessor: 'orderTypeLabel' },

//     { Header: 'Weaving Contract No', accessor: 'weavingContractNo' },
//     { Header: 'Buyer Name', accessor: 'buyerName' },
//     // { Header: 'Consignee Name', accessor: 'consigneeName' },
//     { Header: 'Fabric Code / Quality', accessor: 'fabricSummary' },
//     { Header: 'Order Quantity', accessor: 'orderQty' },
//     { Header: 'Dispatched Quantity', accessor: 'dispatchedQty' },
//     // { Header: 'Status', accessor: 'statusLabel' },
//     {
//       Header: 'Complete',
//       accessor: 'isCompleted',
//       Cell: ({ value, row }: any) => {
//         const isComplete = !!value;
//         return (
//           <button
//             onClick={(e) => {
//               e.preventDefault();
//               e.stopPropagation();
//               handleCompleteOrder(row.original);
//             }}
//             className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
//             type="button"
//           >
//             {isComplete ? 'Re-open' : 'Complete'}
//           </button>
//         );
//       },
//     },

//   ], [handleCompleteOrder]);

//   const onAdd = () => navigate('/transaction/weaving-jobwork-order');
//   const onEdit = (row: any) => navigate('/transaction/weaving-jobwork-order', { state: { jobWorkOrder: row } });
//   const onDelete = (row: any) => { setCurrentId(row.id); setIsDeleteModalOpen(true); };
//   const onView = (_row: any) => { };

//   const confirmDelete = async () => {
//     if (currentId == null) return;
//     const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//     const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
//     await dispatch(deleteWeavingJobWorkOrder(factoryCompanyId ? { id: currentId, factoryCompanyId } as any : currentId as any));
//     if (factoryCompanyId) {
//       dispatch(
//         getAllWeavingJobWorkOrdersByFactoryCompanyId({
//           factoryCompanyId,
//           fetchAll: true,
//           filters
//         }) as any
//       )
//     } else {
//       dispatch(getAllWeavingJobWorkOrders({ fetchAll: true }) as any);
//     }
//     setIsDeleteModalOpen(false);
//   };

//   const filteredData = useMemo(() => {
//     return processed.filter((r: any) => {
//       const matchesTab = activeTab === 'complete' ? !!r.isCompleted : !r.isCompleted;
//       const matchesApproval = approvalStatus === 'pending' ? !r.isApproved : !!r.isApproved;
//       return matchesTab && matchesApproval;
//     });
//   }, [processed, activeTab, approvalStatus]);

//   return (
//     <div className="p-6 pt-16">
        
//       <DataTable
//         columns={columns}
//         data={filteredData}
//         title="Weaving Job Work Orders Details"
//         headerContent={(
//           <div className="flex items-center gap-4 pt-10">
//             <div className="flex border-b border-gray-200">
//               <button
//                 onClick={() => handleTabChange('open')}
//                 className={`py-2 px-4 border-b-2 text-sm font-medium ${activeTab === 'open' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
//               >
//                 Open
//               </button>
//               <button
//                 onClick={() => handleTabChange('complete')}
//                 className={`py-2 px-4 border-b-2 text-sm font-medium ${activeTab === 'complete' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
//               >
//                 Completed
//               </button>
//             </div>
//           </div>
//         )}
//         onAdd={onAdd}
//         onPending={() => handleApprovalChange('pending')}
//         onApproved={() => handleApprovalChange('approved')}
//         activeTab={approvalStatus}
//         onEdit={onEdit}
//         onDelete={onDelete}
//         showActions
//         showColumnFilters={true}
//         filterPlaceholder="Search..."
//         disableFullDataFetch={true}
//       />
      
//       <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
//         <div className="space-y-4">
//           <p>Are you sure you want to delete this Job Work Order?</p>
//           <div className="flex justify-end space-x-3 pt-4">
//             <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
//             <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
//           </div>
//         </div>
//       </Modal>

//       <OrderStatusModal
//         isOpen={isOrderStatusModalOpen}
//         onClose={() => setIsOrderStatusModalOpen(false)}
//         onSave={handleSaveOrderStatus}
//         transactionData={genericTransactionData}
//       />
//     </div>
//   );
// }

// export default WeavingJobWorkOrderDetails;
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { AppDispatch, RootState } from "@/state/store";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteWeavingJobWorkOrder, getAllWeavingJobWorkOrders, updateWeavingJobWorkOrder, getWeavingJobWorkOrderById, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { getAllFabricMasters, getAllFabricMastersForDropdown } from "@/state/fabricMasterSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { OrderStatusModal } from "@/components/ui/OrderStatusModal";
import { TransactionStatusAPI } from "@/services/transaction-status-api";


const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeListData = (value: any) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.data?.data)) return value.data.data;
  return [];
};

export function WeavingJobWorkOrderDetails() {
  const list = useSelector((s: RootState) => s.weavingJobWorkOrder.weavingJobWorkOrderList);
  const pagination = useSelector((s: RootState) => s.weavingJobWorkOrder.pagination);
  const customerList = useSelector((s: RootState) => s.customer.customerList);
  const consigneeList = useSelector((s: RootState) => s.consignee.consigneeList);
  const fabricMasterList = useSelector((s: RootState) => s.fabricMaster.fabricMasterList);
  const fabricMasterFullList = useSelector((s: RootState) => s.fabricMaster.fabricMasterFullList);
  const weavingContractList = useSelector((s: RootState) => s.weavingContracts.weavingContractList);
  const companyMasterList = useSelector((s: RootState) => (s as any).companyMaster.companyMasterList);
  const normalizedCustomerList = useMemo(() => normalizeListData(customerList), [customerList]);
  const normalizedConsigneeList = useMemo(() => normalizeListData(consigneeList), [consigneeList]);
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
  }, [fabricMasterList, fabricMasterFullList]);
  const fabricMasterLookupById = useMemo(() => {
    const map = new Map<string, { code: string; quality: string }>();
    normalizedFabricMasterList.forEach((fabric: any) => {
      const id = fabric?.id ?? fabric?.fabricMasterId ?? fabric?.fabric_master_id ?? fabric?.fabricId ?? fabric?.fabric_id;
      if (id == null) return;
      const code = String(fabric?.fabricCode ?? fabric?.fabric_code ?? fabric?.code ?? fabric?.fabricCodeName ?? fabric?.name ?? "").trim();
      const quality = String(fabric?.fabricQuality ?? fabric?.fabric_quality ?? fabric?.quality ?? fabric?.fabricQualityName ?? fabric?.grade ?? "").trim();
      if (!code && !quality) return;
      map.set(String(id), { code, quality });
    });
    return map;
  }, [normalizedFabricMasterList]);
  const normalizedCompanyList = useMemo(() => normalizeListData(companyMasterList), [companyMasterList]);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [loggedUserName, setLoggedUserName] = useState<string>("");
  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any | null>(null);
  const [genericTransactionData, setGenericTransactionData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'complete'>('open');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('pending');
    const filters = useMemo(() => ({
    isCompleted: activeTab === 'complete' ? 1 : 0,
    isApproved: approvalStatus === 'approved' ? 1 : 0
  }), [activeTab, approvalStatus]);

  // useEffect(() => {
  //   const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
  //   const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
  //   if (factoryCompanyId) {

  //     dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(factoryCompanyId) as any);
  //   } else {
  //     dispatch(getAllWeavingJobWorkOrders({ offset: getOffset(), limit: itemsPerPage } as any));
  //   }
  // }, [dispatch,currentPage, getOffset, itemsPerPage]);

  useEffect(() => {
    const storedCompanyId =
      localStorage.getItem("selectedCompanyId") ||
      localStorage.getItem("selectedCompany")

    const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null

    if (factoryCompanyId) {
      dispatch(
        getAllWeavingJobWorkOrdersByFactoryCompanyId({
          factoryCompanyId,
          fetchAll: true,
          filters
        }) as any
      )
    } else {
      dispatch(
        getAllWeavingJobWorkOrders({ fetchAll: true }) as any
      )
    }
  }, [dispatch, filters])

  useEffect(() => {
    try {
      const payload = localStorage.getItem('authPayload');
      if (payload) {
        const parsed = JSON.parse(payload);
        const name = parsed?.user?.userName || parsed?.user?.name || '';
        setLoggedUserName(String(name));
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (!customerList?.length) {
      dispatch(getAllCustomers({ fetchAll: true } as any));
    }
    if (!consigneeList?.length) {
      dispatch(getAllConsignee({ fetchAll: true } as any));
    }
    if (!fabricMasterList?.length) {
      dispatch(getAllFabricMasters({ fetchAll: true } as any));
    }
    if (!fabricMasterFullList?.length) {
      dispatch(getAllFabricMastersForDropdown() as any);
    }
    if (!weavingContractList?.length) {
      dispatch(getAllWeavingContract({ fetchAll: true } as any));
    }
    if (!(companyMasterList as any)?.length) {
      dispatch(getAllCompanies({}) as any);
    }
  }, [dispatch, customerList?.length, consigneeList?.length, fabricMasterList?.length, fabricMasterFullList?.length, weavingContractList?.length, (companyMasterList as any)?.length]);



  const handleTabChange = (tab: 'open' | 'complete') => {
    if (activeTab === tab) return;
    setActiveTab(tab);
  };

  const handleApprovalChange = (status: 'pending' | 'approved') => {
    if (approvalStatus === status) return;
    setApprovalStatus(status);
  };

  const companyDisplayName = useMemo(() => {
    try {
      const payload = localStorage.getItem('authPayload');
      if (payload) {
        const parsed: any = JSON.parse(payload);
        const name = parsed?.selectedCompany?.name ||
          parsed?.user?.selectedCompany?.name ||
          (Array.isArray(parsed?.user?.companies) ? parsed.user.companies[0]?.name : undefined);
        if (name) return String(name);
      }
    } catch { }
    return '';
  }, []);

  const customerMap = useMemo(() => {
    return new Map(
      normalizedCustomerList.map((customer: any) => [String(customer.id), customer.customerName || customer.name || customer.companyName || '-'])
    );
  }, [normalizedCustomerList]);

  const consigneeMap = useMemo(() => {
    return new Map(
      normalizedConsigneeList.map((consignee: any) => [String(consignee.id), consignee.consigneeName || consignee.name || '-'])
    );
  }, [normalizedConsigneeList]);

  const companyMap = useMemo(() => {
    return new Map(normalizedCompanyList.map((c: any) => [String(c.id), c.companyName || c.name || '-']));
  }, [normalizedCompanyList]);

  const processed = useMemo(() => {
    const source = normalizeListData(list);
    const serialBase = 0;
    return source.map((row: any, idx: number) => {
      const items = Array.isArray(row.items) ? row.items : [];
      const orderDetails = Array.isArray(row.orderDetails) ? row.orderDetails : [];
      const firstItem = items[0] || {};
      const fabricMaster = fabricMasterLookupById.get(String(firstItem.fabricCodeId));
      const code = fabricMaster?.code || firstItem.fabricCode || firstItem.fabricCodeName || '';
      const quality = fabricMaster?.quality || firstItem.fabricQuality || firstItem.fabricQualityName || '';
      const fabricSummary = [code, quality].filter(Boolean).join(' / ');
      const itemQuantity = items.reduce((sum: number, item: any) => sum + toNumber(item.quantity ?? item.orderQty ?? item.plannedQuantity), 0);
      const orderDetailQuantity = orderDetails.reduce((sum: number, detail: any) => sum + toNumber(detail.totalQuantity ?? detail.orderQuantity ?? detail.plannedQuantity), 0);
      const totalQuantity = itemQuantity || orderDetailQuantity || toNumber(row.orderQuantity);
      let buyerName = row.buyerName || customerMap.get(String(row.buyerId)) || '-';
      let consigneeName = row.consigneeName || consigneeMap.get(String(row.consigneeId)) || '-';
      if (Number(row.orderTypeId) === 1) {
        const n = companyMap.get(String(row.tradingCompanyId));
        if (n) buyerName = n;
        if (loggedUserName) consigneeName = loggedUserName;
      }
      const dispatchedQuantity = toNumber(row.dispatchedQty ?? row.dispatchedQuantity);
      const weavingContract = (weavingContractList || []).find((wc: any) => String(wc.id) === String(row.weavingContractId));
      const weavingContractNo = weavingContract?.weavingContractNo ?? weavingContract?.contractNo ?? row.weavingContractNo ?? '-';

      const isComplete = row.isCompleted === 1 || row.isCompleted === true || row.isComplete === 1 || row.isComplete === true;
      const isApproved = row.isApproved === 1 || row.isApproved === true;

      return {
        ...row,
        serialNo: serialBase + idx + 1,
        orderTypeLabel: Number(row.orderTypeId) === 1 ? 'Internal' : 'External',
        orderDate: row.orderDate,
        jobWorkOrderNo: row.weavingWorkOrderNo || '-',
        weavingContractNo,
        buyerName,
        consigneeName,
        fabricSummary: fabricSummary || '-',
        orderQty: totalQuantity,
        dispatchedQty: dispatchedQuantity,
        statusLabel: row.activeFlag ? 'Active' : 'Inactive',
        isCompleted: isComplete,
        isApproved: isApproved,
      };
    });
  }, [list, customerMap, consigneeMap, fabricMasterLookupById, weavingContractList, loggedUserName, companyMap]);

  const onToggleCompleted = async (row: any, value: boolean) => {
    try {
      const res: any = await dispatch(getWeavingJobWorkOrderById(row.id) as any);
      const rec = (res as any)?.payload?.data || (res as any)?.payload || row;
      const { serialNo, orderTypeLabel, jobWorkOrderNo, buyerName, consigneeName, fabricSummary, statusLabel, weavingContractNo, ...rest } = rec || {};
      const payload = { ...rest, isCompleted: value };
      const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
      await dispatch(updateWeavingJobWorkOrder(factoryCompanyId ? { id: row.id, data: payload, factoryCompanyId } as any : { id: row.id, data: payload } as any));
      if (factoryCompanyId) {
        dispatch(
          getAllWeavingJobWorkOrdersByFactoryCompanyId({
            factoryCompanyId,
            filters
          }) as any
        )
      } else {
        dispatch(getAllWeavingJobWorkOrders({fetchAll: true} as any));
      }
      // dispatch(getAllWeavingJobWorkOrders({} as any));
      if (value) setActiveTab('complete');
    } catch { }
  };

  const handleCompleteOrder = useCallback((row: any) => {
    if (!row) return;
    setCurrentOrder(row);
    setGenericTransactionData({
      ...row,
      transactionTypeId: 132,
      buyerId: row.buyerId || undefined,
    });
    setIsOrderStatusModalOpen(true);
  }, []);

  const handleSaveOrderStatus = async (
    completionDate: string,
    description: string,
    transactionDataFromModal?: any
  ) => {
    if (!currentOrder) return;

    const isReopening = currentOrder.order_status === 'Completed' || currentOrder.isComplete === 1;
    const transactionStatus = isReopening ? 'Open' : 'Completed';

    const transactionStatusPayload = {
      id: currentOrder.id,
      transactionTypeId: 132,
      transactionTypeName: 'weaving-jobwork-orders',
      primaryTypeId: currentOrder.id,
      buyerId: transactionDataFromModal?.buyerId || currentOrder.buyerId,
      vendorId: transactionDataFromModal?.vendorId || undefined,
      date: completionDate,
      description: description || '',
      status: transactionStatus,
      isActive: true
    };

    try {
      await TransactionStatusAPI.postTransactionStatus(transactionStatusPayload as any);
      const isReopening = !!currentOrder.isCompleted;
      await onToggleCompleted(currentOrder, !isReopening);
      setIsOrderStatusModalOpen(false);
    } catch { }
  };

  const columns = useMemo(() => [
    { Header: 'S.No', accessor: 'serialNo',  width: 50,
          disableFilters: true, },
    { Header: 'Order Date', accessor: 'orderDate', Cell: ({ value }: { value: string }) => {
                                              if (!value) return 'N/A';
                                              const date = new Date(value);
                                              const day = date.getDate().toString().padStart(2, '0');
                                              const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                              const year = date.getFullYear();
                                              return `${day}/${month}/${year}`;
                                            },
                                            Filter: DateRangeFilter, },
    {
      Header: 'Job Work Order No',

      accessor: 'jobWorkOrderNo'
    },
        { Header: 'Order Type', accessor: 'orderTypeLabel' },

    { Header: 'Weaving Contract No', accessor: 'weavingContractNo' },
    { Header: 'Buyer Name', accessor: 'buyerName' },
    // { Header: 'Consignee Name', accessor: 'consigneeName' },
    { Header: 'Sort No / Construction', accessor: 'fabricSummary' },
    { Header: 'Order Quantity', accessor: 'orderQty' },
    { Header: 'Dispatched Quantity', accessor: 'dispatchedQty' },
    // { Header: 'Status', accessor: 'statusLabel' },
    {
      Header: 'Complete',
      accessor: 'isCompleted',
      Cell: ({ value, row }: any) => {
        const isComplete = !!value;
        return (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCompleteOrder(row.original);
            }}
            className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
            type="button"
          >
            {isComplete ? 'Re-open' : 'Complete'}
          </button>
        );
      },
    },

  ], [handleCompleteOrder]);

  const onAdd = () => navigate('/transaction/weaving-jobwork-order');
  const onEdit = (row: any) => navigate('/transaction/weaving-jobwork-order', { state: { jobWorkOrder: row } });
  const onDelete = (row: any) => { setCurrentId(row.id); setIsDeleteModalOpen(true); };
  const onView = (_row: any) => { };

  const confirmDelete = async () => {
    if (currentId == null) return;
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
    await dispatch(deleteWeavingJobWorkOrder(factoryCompanyId ? { id: currentId, factoryCompanyId } as any : currentId as any));
    if (factoryCompanyId) {
      dispatch(
        getAllWeavingJobWorkOrdersByFactoryCompanyId({
          factoryCompanyId,
          fetchAll: true,
          filters
        }) as any
      )
    } else {
      dispatch(getAllWeavingJobWorkOrders({ fetchAll: true }) as any);
    }
    setIsDeleteModalOpen(false);
  };

  const filteredData = useMemo(() => {
    return processed.filter((r: any) => {
      const matchesTab = activeTab === 'complete' ? !!r.isCompleted : !r.isCompleted;
      const matchesApproval = approvalStatus === 'pending' ? !r.isApproved : !!r.isApproved;
      return matchesTab && matchesApproval;
    });
  }, [processed, activeTab, approvalStatus]);

  return (
    <div className="p-6 pt-16">
        
      <DataTable
        columns={columns}
        data={filteredData}
        title="Weaving Job Work Orders Details"
        headerContent={(
          <div className="flex items-center gap-4 pt-10">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => handleTabChange('open')}
                className={`py-2 px-4 border-b-2 text-sm font-medium ${activeTab === 'open' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Open
              </button>
              <button
                onClick={() => handleTabChange('complete')}
                className={`py-2 px-4 border-b-2 text-sm font-medium ${activeTab === 'complete' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Completed
              </button>
            </div>
          </div>
        )}
        onAdd={onAdd}
        onPending={() => handleApprovalChange('pending')}
        onApproved={() => handleApprovalChange('approved')}
        activeTab={approvalStatus}
        onEdit={onEdit}
        onDelete={onDelete}
        showActions
        showColumnFilters={true}
        filterPlaceholder="Search..."
        disableFullDataFetch={true}
        isShowPagination={false}
        virtualScroll={true}
        virtualScrollHeight="65vh"
      />
      
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete this Job Work Order?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <OrderStatusModal
        isOpen={isOrderStatusModalOpen}
        onClose={() => setIsOrderStatusModalOpen(false)}
        onSave={handleSaveOrderStatus}
        transactionData={genericTransactionData}
      />
    </div>
  );
}

export default WeavingJobWorkOrderDetails;