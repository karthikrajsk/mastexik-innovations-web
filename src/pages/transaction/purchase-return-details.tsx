// import React, { useEffect, useMemo, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { AppDispatch, RootState } from '@/state/store';
// import { getAllPurchaseReturns, deletePurchaseReturn } from '@/state/purchaseReturnSlice';
// import { getAllPoTypes, getAllPurchaseOrders } from '@/state/purchaseOrderSlice';
// import { getAllVendors } from '@/state/vendorSlice';
// import { DataTable, DateRangeFilter } from '@/components/data/DataTable';
// import { Pagination, usePagination } from '@/components/common/Pagination';
// import { formatDate } from '@/lib/utils';
// import { useCompanyContext } from '@/hooks/useCompanyContext';

// interface PurchaseReturnListItem {
//   id: number;
//   returnDate: string;
//   returnNo: string;
//   purchaseType: string; // Yarn / Woven Fabric / Knitted Fabric
//   vendorName: string;
//   poNo: string; // comma separated
//   itemName: string;
//   quantity: number | string;
//   activeFlag?: boolean;
// }

// export default function PurchaseReturnDetails() {
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { companyId } = useCompanyContext();
//   const [currentReturn, setcurrentReturn] = useState<any>(null);
//   const [isExporting, setIsExporting] = useState(false);
//   const resolvedCompanyId = useMemo(() => {
//     if (companyId != null) return companyId;
//     if (typeof window === 'undefined' || !window.localStorage) {
//       return undefined;
//     }
//     const storedCompanyId = window.localStorage.getItem('selectedCompanyId');
//     if (storedCompanyId) {
//       const parsed = Number(storedCompanyId);
//       if (!Number.isNaN(parsed)) {
//         return parsed;
//       }
//     }
//     const storedCompany = window.localStorage.getItem('selectedCompany');
//     if (storedCompany) {
//       try {
//         const parsedObj = JSON.parse(storedCompany);
//         const parsedId = Number(parsedObj?.id ?? parsedObj?.companyId);
//         if (!Number.isNaN(parsedId)) {
//           return parsedId;
//         }
//       } catch {
//         const fallback = Number(storedCompany);
//         if (!Number.isNaN(fallback)) {
//           return fallback;
//         }
//       }
//     }
//     return undefined;
//   }, [companyId]);

//   const { purchaseReturnList, paginationInfo } = useSelector((s: RootState) => s.purchaseReturn);
//   const { purchaseOrderList } = useSelector((s: RootState) => s.purchaseOrder);
//   const { vendorList } = useSelector((s: RootState) => s.vendor);
//   const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });

//    useEffect(() => {
//       const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//       const rawCompanyId = storedCompanyId ? Number(storedCompanyId) : undefined;
//       const companyId = rawCompanyId && !isNaN(rawCompanyId) ? rawCompanyId : undefined;
//       dispatch(getAllPurchaseReturns({
//         companyId,
//         // offset: getOffset(),
//         // limit: itemsPerPage,
//         fetchAll: true
//       }));
//       dispatch(getAllPurchaseOrders({ fetchAll: true }));
//     }, [dispatch, location.pathname, getOffset, itemsPerPage]);

//   useEffect(() => {
//     dispatch(getAllPoTypes({} as any));
//     dispatch(getAllVendors({} as any));
//   }, [dispatch, location.pathname]);

//   const vendorMap = useMemo(() => (
//     (vendorList || []).reduce((acc: any, v: any) => { acc[String(v.id)] = v.vendorName; return acc; }, {})
//   ), [vendorList]);

//   // Normalize purchase orders and build a map: id -> PO
//   const poListNorm = useMemo(() => (
//     Array.isArray((purchaseOrderList as any)?.data) ? (purchaseOrderList as any).data : (purchaseOrderList || [])
//   ), [purchaseOrderList]);

//   const poMapById = useMemo(() => {
//     const m: Record<string, any> = {};
//     (poListNorm || []).forEach((po: any) => { m[String(po.id)] = po; });
//     return m;
//   }, [poListNorm]);

//   const rows: PurchaseReturnListItem[] = useMemo(() => {
//     const poArr = Array.isArray((purchaseOrderList as any)?.data)
//       ? (purchaseOrderList as any).data
//       : Array.isArray(purchaseOrderList) ? purchaseOrderList : [];
//     const localPoMap: Record<string, any> = {};
//     poArr.forEach((po: any) => { localPoMap[String(po.id)] = po; });

//     return (purchaseReturnList || []).map((r: any) => {
//       const po = localPoMap[String(r?.purchaseOrderId)];
//       const poNos = po?.purchaseOrderNo || po?.orderNo || po?.poNo
//         || (Array.isArray(r?.purchaseOrders) ? r.purchaseOrders.map((p: any) => p.purchaseOrderNo || p.orderNo || p.poNo).join(', ') : (r.poNo || ''));

//       // Normalize items: support either unified r.items or split r.yarnItems/r.fabricItems from backend
//       const unifiedItems = Array.isArray(r?.items) && r.items.length > 0
//         ? r.items
//         : [
//             ...((r?.yarnItems || []).map((i: any) => ({
//               yarnId: i.yarnId,
//               yarnName: i.yarnName,
//               returnQuantity: i.returnQuantity,
//             })) || []),
//             ...((r?.fabricItems || []).map((i: any) => ({
//               fabricMasterId: i.fabricMasterId,
//               fabricCode: i.fabricCode,
//               quality: i.quality,
//               returnQuantity: i.returnQuantity,
//             })) || []),
//           ];

//       // Item name: prefer summarized names from unified items; if none, fallback via PO items by itemId
//       let itemName = (unifiedItems || [])
//         .map((i: any) => i.itemName || i.yarnName || (i.fabricCode && (i.quality ?? '') !== undefined ? `${i.fabricCode}${i.quality ? '-' + i.quality : ''}` : ''))
//         .filter(Boolean)
//         .join(', ') || '';

//       if (!itemName && po) {
//         const poItems = po?.purchaseOrderItemsDtl || [];
//         if (r?.purchaseType === 'yarn') {
//           const found = poItems.find((i: any) => String(i.yarnId) === String(r?.itemId));
//           itemName = found?.yarnName || '';
//         } else if (r?.purchaseType === 'item') {
//           const found = poItems.find((i: any) => String(i.itemId) === String(r?.itemId));
//           itemName = found?.itemName || '';
//         } else {
//           const found = poItems.find((i: any) => String(i.fabricMasterId) === String(r?.itemId));
//           if (found) itemName = found.fabricCode && found.quality ? `${found.fabricCode}${found.quality ? '-' + found.quality : ''}` : (found.fabricCode || '');
//         }
//       }

//       const qty = (unifiedItems || []).reduce((sum: number, i: any) => sum + Number(i.returnQuantity || 0), 0) || 0;

//       const typeLabel = r?.purchaseType === 'yarn' ? 'Yarn' : r?.purchaseType === 'woven' ? 'Woven Fabric' : r?.purchaseType === 'knitted' ? 'Knitted Fabric' : r?.purchaseType === 'item' ? 'Item' : r?.purchaseType;
//       return {
//         id: r.id,
//         returnDate: r.returnDate,
//         returnNo: r.returnNo || `PR-${String(r.id).padStart(5, '0')}`,
//         purchaseType: typeLabel,
//         vendorName: vendorMap[r.vendorId] || r.vendorName || '',
//         poNo: poNos,
//         itemName: itemName,
//         quantity: qty,
//         activeFlag: r.activeFlag,
//       };
//     });
//   }, [purchaseReturnList, vendorMap, purchaseOrderList]);

//   const columns = useMemo(() => ([
//     { Header: 'S.No', accessor: 'serialNo', width: 60, disableFilters: true, disableGlobalFilter: true },
//     { Header: 'Return Date', accessor: 'returnDate',  Cell: ({ value }: { value: string }) => {
//               // Format date as DD/MM/YYYY
//               const date = new Date(value);
//               const day = String(date.getDate()).padStart(2, '0');
//               const month = String(date.getMonth() + 1).padStart(2, '0');
//               const year = date.getFullYear();
//               return `${day}/${month}/${year}`;
//             },
//             Filter: DateRangeFilter },
//     { Header: 'Return No', accessor: 'returnNo' },
//     { Header: 'Purchase Type', accessor: 'purchaseType' },
//     { Header: 'Vendor Name', accessor: 'vendorName' },
//     { Header: 'PO No', accessor: 'poNo' },
//     { Header: 'Item Name', accessor: 'itemName' },
//     { Header: 'Quantity', accessor: 'quantity' },
//     {
//       Header: 'Print',
//       id: 'print',
//       Cell: ({ row }: any) => {
//         const handlePrint = () => {
//           setIsExporting(true);
//           const parentRecord = purchaseReturnList?.find((r: any) => r.id === row.original.id);
//           const printData = { ...parentRecord, type: 'purchase-return' };
//           localStorage.setItem('yarnReturnPrintData', JSON.stringify(printData));
//           window.open(`/#/transaction/yarn-delivery-challan-print?id=${row.original.id}`, '_blank');
//           setIsExporting(false);
//         };

//         return (
//           <button
//             onClick={handlePrint}
//             disabled={isExporting}
//             className="text-blue-600 hover:text-blue-800 underline font-medium disabled:opacity-50"
//           >
//             Print
//           </button>
//         );
//       },
//       disableFilters: true,
//       disableGlobalFilter: true
//     },
//   ]), [purchaseReturnList, isExporting]);

//   const aggregatedData = useMemo(() => (
//     (rows || []).filter((r: any) => r.activeFlag !== false).map((r, i) => ({ ...r, serialNo: (paginationInfo?.offset || 0) + i + 1 }))
//   ), [rows, paginationInfo]);

//   const handleAdd = () => navigate('/transaction/purchase-return');
//   const handleEdit = (row: any) => {
//     const parentId = row.id;
//     const parentRecord = purchaseReturnList?.find((r: any) => r.id === parentId);
    
//     const childIds: number[] = [];
//     if (parentRecord?.yarnItems) {
//       childIds.push(...(parentRecord.yarnItems as any[]).map(item => item.id).filter(Boolean));
//     }
//     if (parentRecord?.fabricItems) {
//       childIds.push(...(parentRecord.fabricItems as any[]).map(item => item.id).filter(Boolean));
//     }
    
//     const queryParams = new URLSearchParams();
//     queryParams.set('parentId', String(parentId));
//     if (childIds.length > 0) {
//       childIds.forEach(childId => queryParams.append('childId', String(childId)));
//     }
    
//     navigate(`/transaction/purchase-return?${queryParams.toString()}`, { state: { record: row } });
//   };

//     const handleDelete = async (row: any) => {
//     try {
//            const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//         if (!storedCompanyId) return;
//         const companyId = Number(storedCompanyId);
//       await dispatch(deletePurchaseReturn({ id: Number(row.id), companyId })).unwrap();
//       resetPage();
//       await dispatch(getAllPurchaseReturns({ offset: 0, limit: itemsPerPage } as any));
//     } catch {}
//   };

//   // const handleDelete = async () => {
//   //     if (!currentReturn) return;
  
//   //     try {
//   //   alert("Delete functionality is currently disabled.");

//   //       const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//   //       if (!storedCompanyId) return;
//   //       const companyId = Number(storedCompanyId);
//   //       await dispatch(deletePurchaseReturn({ id: currentReturn.id, companyId })).unwrap();
  
//   //       const totalAfterDelete = Math.max(0, (paginationInfo?.total || 0) - 1);
//   //       const maxPageIndex = Math.max(0, Math.ceil(totalAfterDelete / itemsPerPage) - 1);
  
//   //       if (currentPage > maxPageIndex) {
//   //         resetPage();
//   //         await dispatch(getAllPurchaseReturns({ companyId, offset: 0, limit: itemsPerPage, fetchAll: false }));
//   //       } else {
//   //         await dispatch(getAllPurchaseReturns({ companyId, offset: getOffset(), limit: itemsPerPage, fetchAll: false }));
//   //       }
//   //     } catch (error) {
//   //       console.error("Error deleting SalesOrder:", error);
//   //     }
  
//   //     // setIsDeleteModalOpen(false);
//   //   };
  

//   // const handleDelete = async (row: any) => {
//   //   try {
//   //     const deletePayload = {
//   //       id: Number(row.id),
//   //       companyId: row.companyId ?? resolvedCompanyId
//   //     };
//   //     await dispatch(deletePurchaseReturn(deletePayload)).unwrap();
//   //     resetPage();
//   //     const refreshParams: { offset: number; limit: number; companyId?: number } = {
//   //       offset: 0,
//   //       limit: itemsPerPage
//   //     };
//   //     if (resolvedCompanyId) {
//   //       refreshParams.companyId = resolvedCompanyId;
//   //     }
//   //     await dispatch(getAllPurchaseReturns(refreshParams));
//   //   } catch {}
//   // };

//   return (
//     <div className="p-6 pt-16">
//       {/* <h1 className="text-2xl font-semibold mb-6">Purchase Return Management</h1> */}
//       <DataTable
//         columns={columns as any}
//         data={aggregatedData as any}
//         title="Purchase Return Details"
//         onAdd={handleAdd}
//         onEdit={handleEdit}
//         onDelete={handleDelete}
//         onView={undefined}
//         showActions={true}
//         showColumnFilters={true}
//         filterPlaceholder="Search Return No, Vendor, Type, Item..."
//         //    initialPageSize={itemsPerPage}
//         // onPageSizeChange={setItemsPerPage}
//         isShowPagination={false} // Hide default pagination
//         disableFullDataFetch={true}
//       />
//       <div className="mt-4 flex justify-between items-center px-4">
//         <div className="text-sm text-gray-600">
//           Showing {aggregatedData.length > 0 ? (paginationInfo?.offset || 0) + 1 : 0} - {(paginationInfo?.offset || 0) + aggregatedData.length} of {paginationInfo?.total || 0}
//         </div>
//         {/* <Pagination
//           currentPage={currentPage}
//           totalItems={paginationInfo?.total || 0}
//           itemsPerPage={itemsPerPage}
//           offset={paginationInfo?.offset || 0}
//           hasNext={!!paginationInfo?.next}
//           hasPrev={!!paginationInfo?.prev}
//           onPageChange={handlePageChange}
//         /> */}
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppDispatch, RootState } from '@/state/store';
import { getAllPurchaseReturns, deletePurchaseReturn } from '@/state/purchaseReturnSlice';
import { getAllPoTypes, getAllPurchaseOrders } from '@/state/purchaseOrderSlice';
import { getAllVendors } from '@/state/vendorSlice';
import { DataTable, DateRangeFilter } from '@/components/data/DataTable';
import { Pagination, usePagination } from '@/components/common/Pagination';
import { formatDate } from '@/lib/utils';
import { useCompanyContext } from '@/hooks/useCompanyContext';

interface PurchaseReturnListItem {
  id: number;
  returnDate: string;
  returnNo: string;
  purchaseType: string; // Yarn / Woven Fabric / Knitted Fabric
  vendorName: string;
  poNo: string; // comma separated
  itemName: string;
  quantity: number | string;
  activeFlag?: boolean;
}

export default function PurchaseReturnDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId } = useCompanyContext();
  const [currentReturn, setcurrentReturn] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const resolvedCompanyId = useMemo(() => {
    if (companyId != null) return companyId;
    if (typeof window === 'undefined' || !window.localStorage) {
      return undefined;
    }
    const storedCompanyId = window.localStorage.getItem('selectedCompanyId');
    if (storedCompanyId) {
      const parsed = Number(storedCompanyId);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    const storedCompany = window.localStorage.getItem('selectedCompany');
    if (storedCompany) {
      try {
        const parsedObj = JSON.parse(storedCompany);
        const parsedId = Number(parsedObj?.id ?? parsedObj?.companyId);
        if (!Number.isNaN(parsedId)) {
          return parsedId;
        }
      } catch {
        const fallback = Number(storedCompany);
        if (!Number.isNaN(fallback)) {
          return fallback;
        }
      }
    }
    return undefined;
  }, [companyId]);

  const { purchaseReturnList, paginationInfo } = useSelector((s: RootState) => s.purchaseReturn);
  const { purchaseOrderList } = useSelector((s: RootState) => s.purchaseOrder);
  const { vendorList } = useSelector((s: RootState) => s.vendor);
  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });

   useEffect(() => {
      const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      const rawCompanyId = storedCompanyId ? Number(storedCompanyId) : undefined;
      const companyId = rawCompanyId && !isNaN(rawCompanyId) ? rawCompanyId : undefined;
      dispatch(getAllPurchaseReturns({
        companyId,
        // offset: getOffset(),
        // limit: itemsPerPage,
        fetchAll: true
      }));
      dispatch(getAllPurchaseOrders({ fetchAll: true }));
    }, [dispatch, location.pathname]);

  useEffect(() => {
    dispatch(getAllPoTypes({} as any));
    dispatch(getAllVendors({} as any));
  }, [dispatch, location.pathname]);

  const vendorMap = useMemo(() => (
    (vendorList || []).reduce((acc: any, v: any) => { acc[String(v.id)] = v.vendorName; return acc; }, {})
  ), [vendorList]);

  // Normalize purchase orders and build a map: id -> PO
  const poListNorm = useMemo(() => (
    Array.isArray((purchaseOrderList as any)?.data) ? (purchaseOrderList as any).data : (purchaseOrderList || [])
  ), [purchaseOrderList]);

  const poMapById = useMemo(() => {
    const m: Record<string, any> = {};
    (poListNorm || []).forEach((po: any) => { m[String(po.id)] = po; });
    return m;
  }, [poListNorm]);

  const rows: PurchaseReturnListItem[] = useMemo(() => {
    const poArr = Array.isArray((purchaseOrderList as any)?.data)
      ? (purchaseOrderList as any).data
      : Array.isArray(purchaseOrderList) ? purchaseOrderList : [];
    const localPoMap: Record<string, any> = {};
    poArr.forEach((po: any) => { localPoMap[String(po.id)] = po; });

    return (purchaseReturnList || []).map((r: any) => {
      const po = localPoMap[String(r?.purchaseOrderId)];
      const poNos = po?.purchaseOrderNo || po?.orderNo || po?.poNo
        || (Array.isArray(r?.purchaseOrders) ? r.purchaseOrders.map((p: any) => p.purchaseOrderNo || p.orderNo || p.poNo).join(', ') : (r.poNo || ''));

      // Normalize items: support either unified r.items or split r.yarnItems/r.fabricItems from backend
      const unifiedItems = Array.isArray(r?.items) && r.items.length > 0
        ? r.items
        : [
            ...((r?.yarnItems || []).map((i: any) => ({
              yarnId: i.yarnId,
              yarnName: i.yarnName,
              returnQuantity: i.returnQuantity,
            })) || []),
            ...((r?.fabricItems || []).map((i: any) => ({
              fabricMasterId: i.fabricMasterId,
              fabricCode: i.fabricCode,
              quality: i.quality,
              returnQuantity: i.returnQuantity,
            })) || []),
          ];

      // Item name: prefer summarized names from unified items; if none, fallback via PO items by itemId
      let itemName = (unifiedItems || [])
        .map((i: any) => i.itemName || i.yarnName || (i.fabricCode && (i.quality ?? '') !== undefined ? `${i.fabricCode}${i.quality ? '-' + i.quality : ''}` : ''))
        .filter(Boolean)
        .join(', ') || '';

      if (!itemName && po) {
        const poItems = po?.purchaseOrderItemsDtl || [];
        if (r?.purchaseType === 'yarn') {
          const found = poItems.find((i: any) => String(i.yarnId) === String(r?.itemId));
          itemName = found?.yarnName || '';
        } else if (r?.purchaseType === 'item') {
          const found = poItems.find((i: any) => String(i.itemId) === String(r?.itemId));
          itemName = found?.itemName || '';
        } else {
          const found = poItems.find((i: any) => String(i.fabricMasterId) === String(r?.itemId));
          if (found) itemName = found.fabricCode && found.quality ? `${found.fabricCode}${found.quality ? '-' + found.quality : ''}` : (found.fabricCode || '');
        }
      }

      const qty = (unifiedItems || []).reduce((sum: number, i: any) => sum + Number(i.returnQuantity || 0), 0) || 0;

      const typeLabel = r?.purchaseType === 'yarn' ? 'Yarn' : r?.purchaseType === 'woven' ? 'Woven Fabric' : r?.purchaseType === 'knitted' ? 'Knitted Fabric' : r?.purchaseType === 'item' ? 'Item' : r?.purchaseType;
      return {
        id: r.id,
        returnDate: r.returnDate,
        returnNo: r.returnNo || `PR-${String(r.id).padStart(5, '0')}`,
        purchaseType: typeLabel,
        vendorName: vendorMap[r.vendorId] || r.vendorName || '',
        poNo: poNos,
        itemName: itemName,
        quantity: qty,
        activeFlag: r.activeFlag,
      };
    });
  }, [purchaseReturnList, vendorMap, purchaseOrderList]);

  const columns = useMemo(() => ([
    { Header: 'S.No', accessor: 'serialNo', width: 60, disableFilters: true, disableGlobalFilter: true },
    { Header: 'Return Date', accessor: 'returnDate',  Cell: ({ value }: { value: string }) => {
              // Format date as DD/MM/YYYY
              const date = new Date(value);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            },
            Filter: DateRangeFilter },
    { Header: 'Return No', accessor: 'returnNo' },
    { Header: 'Purchase Type', accessor: 'purchaseType' },
    { Header: 'Vendor Name', accessor: 'vendorName' },
    { Header: 'PO No', accessor: 'poNo' },
    { Header: 'Item Name', accessor: 'itemName' },
    { Header: 'Quantity', accessor: 'quantity' },
    {
      Header: 'Print',
      id: 'print',
      Cell: ({ row }: any) => {
        const handlePrint = () => {
          setIsExporting(true);
          const parentRecord = purchaseReturnList?.find((r: any) => r.id === row.original.id);
          const printData = { ...parentRecord, type: 'purchase-return' };
          localStorage.setItem('yarnReturnPrintData', JSON.stringify(printData));
          window.open(`/#/transaction/yarn-delivery-challan-print?id=${row.original.id}`, '_blank');
          setIsExporting(false);
        };

        return (
          <button
            onClick={handlePrint}
            disabled={isExporting}
            className="text-blue-600 hover:text-blue-800 underline font-medium disabled:opacity-50"
          >
            Print
          </button>
        );
      },
      disableFilters: true,
      disableGlobalFilter: true
    },
  ]), [purchaseReturnList, isExporting]);

  const aggregatedData = useMemo(() => (
    (rows || []).filter((r: any) => r.activeFlag !== false).map((r, i) => ({ ...r, serialNo: (paginationInfo?.offset || 0) + i + 1 }))
  ), [rows, paginationInfo]);

  const handleAdd = () => navigate('/transaction/purchase-return');
  const handleEdit = (row: any) => {
    const parentId = row.id;
    const parentRecord = purchaseReturnList?.find((r: any) => r.id === parentId);
    
    const childIds: number[] = [];
    if (parentRecord?.yarnItems) {
      childIds.push(...(parentRecord.yarnItems as any[]).map(item => item.id).filter(Boolean));
    }
    if (parentRecord?.fabricItems) {
      childIds.push(...(parentRecord.fabricItems as any[]).map(item => item.id).filter(Boolean));
    }
    
    const queryParams = new URLSearchParams();
    queryParams.set('parentId', String(parentId));
    if (childIds.length > 0) {
      childIds.forEach(childId => queryParams.append('childId', String(childId)));
    }
    
    navigate(`/transaction/purchase-return?${queryParams.toString()}`, { state: { record: row } });
  };

    const handleDelete = async (row: any) => {
    try {
           const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        if (!storedCompanyId) return;
        const companyId = Number(storedCompanyId);
      await dispatch(deletePurchaseReturn({ id: Number(row.id), companyId })).unwrap();
      resetPage();
      await dispatch(getAllPurchaseReturns({ fetchAll: true } as any));
    } catch {}
  };

  // const handleDelete = async () => {
  //     if (!currentReturn) return;
  
  //     try {
  //   alert("Delete functionality is currently disabled.");

  //       const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
  //       if (!storedCompanyId) return;
  //       const companyId = Number(storedCompanyId);
  //       await dispatch(deletePurchaseReturn({ id: currentReturn.id, companyId })).unwrap();
  
  //       const totalAfterDelete = Math.max(0, (paginationInfo?.total || 0) - 1);
  //       const maxPageIndex = Math.max(0, Math.ceil(totalAfterDelete / itemsPerPage) - 1);
  
  //       if (currentPage > maxPageIndex) {
  //         resetPage();
  //         await dispatch(getAllPurchaseReturns({ companyId, offset: 0, limit: itemsPerPage, fetchAll: false }));
  //       } else {
  //         await dispatch(getAllPurchaseReturns({ companyId, offset: getOffset(), limit: itemsPerPage, fetchAll: false }));
  //       }
  //     } catch (error) {
  //       console.error("Error deleting SalesOrder:", error);
  //     }
  
  //     // setIsDeleteModalOpen(false);
  //   };
  

  // const handleDelete = async (row: any) => {
  //   try {
  //     const deletePayload = {
  //       id: Number(row.id),
  //       companyId: row.companyId ?? resolvedCompanyId
  //     };
  //     await dispatch(deletePurchaseReturn(deletePayload)).unwrap();
  //     resetPage();
  //     const refreshParams: { offset: number; limit: number; companyId?: number } = {
  //       offset: 0,
  //       limit: itemsPerPage
  //     };
  //     if (resolvedCompanyId) {
  //       refreshParams.companyId = resolvedCompanyId;
  //     }
  //     await dispatch(getAllPurchaseReturns(refreshParams));
  //   } catch {}
  // };

  return (
    <div className="p-6 pt-16">
      {/* <h1 className="text-2xl font-semibold mb-6">Purchase Return Management</h1> */}
      <DataTable
        columns={columns as any}
        data={aggregatedData as any}
        title="Purchase Return / GRN Return Details"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={undefined}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Return No, Vendor, Type, Item..."
        //    initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        isShowPagination={true} // Hide default pagination
        // disableFullDataFetch={true}
      />
      {/* <div className="mt-4 flex justify-between items-center px-4">
        <div className="text-sm text-gray-600">
          Showing {aggregatedData.length > 0 ? (paginationInfo?.offset || 0) + 1 : 0} - {(paginationInfo?.offset || 0) + aggregatedData.length} of {paginationInfo?.total || 0}
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={paginationInfo?.total || 0}
          itemsPerPage={itemsPerPage}
          offset={paginationInfo?.offset || 0}
          hasNext={!!paginationInfo?.next}
          hasPrev={!!paginationInfo?.prev}
          onPageChange={handlePageChange}
        />
      </div> */}
    </div>
  );
}