import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { deleteSalesOrder, getAllSalesOrders, updateSalesOrder } from "@/state/salesOrderSlice";
import { getAllInvoices } from "@/state/invoiceSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { TransactionStatusAPI } from "@/services/transaction-status-api";
import { toast } from "react-toastify";
import { OrderStatusModal } from "@/components/ui/OrderStatusModal";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentAttachmentModal } from "@/components/modals/DocumentAttachmentModal";
import { useFileCounts } from "@/hooks/useFileCounts";

// Date Range Filter Component

interface categoryFormData {
  id?: number;
  name: string;
  status: string;
}

export function SalesOrderDetails() {
  const { user } = useAuth();

  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

  const { salesOrderList, paginationInfo } = useSelector((state: RootState) => state.salesOrder);
  const { invoiceList } = useSelector((state: RootState) => state.invoice);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentSalesOrder, setCurrentSalesOrder] = useState<any>(null);
  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);
  const [attachmentModalTitle, setAttachmentModalTitle] = useState<string>('');

  const companyId = useResolvedCompanyId();
  const searchApiEndpoint = companyId != null
    ? `/sales-orders/company/${companyId}`
    : `/sales-orders`;

  const [genericTransactionData, setGenericTransactionData] = useState<{
    transactionTypeId?: number;
    vendorId?: number;
    buyerId?: number;
    [key: string]: any;
  } | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activeSubTab, setActiveSubTab] = useState<'open' | 'completed'>('open');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('pending');
  const [updatedOrders, setUpdatedOrders] = useState<Map<number, any>>(new Map());
  const [tableColumnFilters, setTableColumnFilters] = useState<Record<string, any>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();


  // const { register, handleSubmit, reset, formState: { errors } } = useForm<categoryFormData>();

  const handleSubTabChange = (tab: 'open' | 'completed') => {
    if (activeSubTab === tab) return;
    setTableColumnFilters({});
    setActiveSubTab(tab);
    resetPage();
  };

  const handleApprovalChange = (status: 'pending' | 'approved') => {
    if (approvalStatus === status) return;
    setTableColumnFilters({});
    setApprovalStatus(status);
    resetPage();
  };

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
    
    const userRoleLower = (user?.role || '').trim().toLowerCase();
    const isDeptSpecificRole = ['weaving', 'brushing', 'garments'].includes(userRoleLower);

    const filters: Record<string, string | number | boolean> = {
      exportType: 'domestic',
      orderTypeId: 1,
      isComplete: activeSubTab === 'completed' ? 1 : 0,
      isApproved: approvalStatus === 'approved' ? 1 : 0
    };
    if (isDeptSpecificRole && userRoleLower) {
      filters.department = userRoleLower;
    }

    dispatch(getAllSalesOrders({
      companyId,
      // offset: getOffset(),
      // limit: itemsPerPage,
      fetchAll: true,
      filters
    }));
  }, [dispatch, location.pathname, getOffset, itemsPerPage, activeSubTab, approvalStatus, user?.role]);

  useEffect(() => {
    dispatch(getAllInvoices({}));
  }, [dispatch, location.pathname]);

  // Aggregate data per sales order (Domestic only)
  const aggregatedData = useMemo(() => {
    if (!salesOrderList || !invoiceList) return [];

    const userRoleLower = (user?.role || '').trim().toLowerCase();
    const isDeptSpecificRole = ['weaving', 'brushing', 'garments'].includes(userRoleLower);

    let filteredList = salesOrderList;
    if (isDeptSpecificRole) {
      filteredList = salesOrderList.filter((o: any) =>
        String(o.department || '').trim().toLowerCase() === userRoleLower
      );
    }

    const domesticOrders = filteredList.filter((o: any) =>
      (o.exportType && String(o.exportType).toLowerCase() === 'domestic') || o.orderTypeId === 1
    );
    const serialBase = paginationInfo?.offset || 0;
    
    return domesticOrders
      .map((order: any) => {
        const updatedInfo = updatedOrders.get(order.id);
        const orderStatus = updatedInfo?.order_status || order.order_status || 'Pending';

        const orderQuantity = order.items?.reduce((sum: number, item: any) => sum + (item.orderQty || 0), 0) || 0;
        const fabricCodes = order.items?.map((item: any) => item.fabricCode).filter(Boolean).join(', ') || '';
        const buyerProducts = order.items?.map((item: any) => item.buyerProduct).filter(Boolean).join(', ') || '';
        const dispatchedQuantity = invoiceList
          .filter((invoice: any) => invoice.salesOrderId === order.id)
          .reduce((sum: number, invoice: any) =>
            sum + (invoice.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0), 0);
        const balanceQuantity = orderQuantity - dispatchedQuantity;

        return {
          ...order,
          order_status: orderStatus,
          orderDate: order.orderDate.split('T')[0],
          customer: order.buyerCustomerName,
          customerPoNo: order.buyerPoNo,
          fabricCode: fabricCodes,
          buyerProduct: buyerProducts,
          orderQuantity,
          dispatchedQuantity,
          balanceQuantity,
          status: order.activeFlag ? 'Active' : 'Inactive'
        };
      })
      .filter((order: any) => {
        const isComplete = order.isComplete === 1 || order.isComplete === true || order.order_status === 'Completed';
        const isApproved = order.isApproved === 1 || order.isApproved === true;

        const matchesSubTab = activeSubTab === 'open' ? !isComplete : isComplete;
        const matchesApproval = approvalStatus === 'pending' ? !isApproved : isApproved;

        return matchesSubTab && matchesApproval;
      })
      .map((order :any, index:any) => ({
        ...order,
        serialNo: serialBase + index + 1
      }));
  }, [salesOrderList, invoiceList, paginationInfo?.offset, activeSubTab, approvalStatus, updatedOrders, user?.role]);

  const totalOrders = paginationInfo?.total ?? (Array.isArray(aggregatedData) ? aggregatedData.length : 0);
  const currentOffset = paginationInfo?.offset || 0;
  const displayStart = totalOrders === 0 ? 0 : currentOffset + 1;
  const displayEnd = Math.min(currentOffset + aggregatedData.length, totalOrders);

  const handleCompleteOrder = useCallback((order: any) => {
    if (!order) return;
    setCurrentSalesOrder(order);
    setGenericTransactionData({
      transactionTypeId: order.transactionTypeId || 0,
      vendorId: order.vendorId || undefined,
      buyerId: order.buyerId || undefined,
      ...order
    });
    setIsOrderStatusModalOpen(true);
  }, []);

  const containerNames = useMemo(() => {
    return (aggregatedData || []).map((order: any) => `sales_order_${order.id}`);
  }, [aggregatedData]);

  const { counts: fileCounts, updateCount: updateFileCount } = useFileCounts(containerNames);

  const handleOpenAttachmentModal = useCallback((order: any) => {
    setSelectedAttachmentContainer(`sales_order_${order.id}`);
    setAttachmentModalTitle(`Sales Order #${order.salesOrderNo || order.id} Files`);
  }, []);


  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    
        disableFilters: true
      },
      {
        Header: 'So Date',
        accessor: 'orderDate',
        Cell: ({ value }: { value: string }) => {
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
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
      { Header: 'Sales Order No', accessor: 'salesOrderNo' },
      { Header: 'Customer Name', accessor: 'customer' },
      { Header: 'Customer PoNo', accessor: 'customerPoNo' },
      { Header: 'Sort No', accessor: 'fabricCode' },
      { Header: 'Buyer Product', accessor: 'buyerProduct' },
      { Header: 'Order Quantity', accessor: 'orderQuantity' },
      { Header: 'Dispatched Quantity', accessor: 'dispatchedQuantity' },
      { Header: 'Balance Quantity', accessor: 'balanceQuantity' },
      {
        Header: 'Files',
        accessor: 'id',
        disableFilters: true,
        Cell: (props: any) => {
          const { row } = props;
          const containerName = `sales_order_${row.original.id}`;
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
        Header: 'Order Status',
        accessor: 'order_status',
        Cell: (props: any) => {
          const { row } = props;
          const isComplete = row.original.isComplete === 1 || row.original.isComplete === true;
          return isComplete ? (
            <button
              onClick={() => handleCompleteOrder(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
            >
              Re-open
            </button>
          ) : (
            <button
              onClick={() => handleCompleteOrder(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
            >
              Complete
            </button>
          );
        },
      }
    ],
    []
  );


  // const handleAdd = () => {
  //   setModalMode('add');
  //   setCurrentSalesOrder(null);
  //   navigate("/transaction/sales-order", { state: { tab: 'domestic' } });

  // };
    const handleAdd = () => {
    setModalMode('add');
    setCurrentSalesOrder(null);
    navigate("/transaction/sales-order?salesOrderId=0&salesOrderItemId=0", {
      state: { tab: 1 }
    });
  };

  // const handleEdit = (aggregatedRowData: any) => {
  //   // Find the original sales order from salesOrderList using the id
  //   const originalSalesOrder = salesOrderList.find((order: any) => order.id === aggregatedRowData.id);
  //   if (originalSalesOrder) {
  //     setModalMode('edit');
  //     setCurrentSalesOrder(originalSalesOrder);
  //     navigate("/transaction/sales-order", { state: { salesOrderdetail: originalSalesOrder, tab: 'domestic' } });
  //   }
  // };
  
  const handleEdit = (aggregatedRowData: any) => {
    const originalSalesOrder = salesOrderList.find(
      (order: any) => order.id === aggregatedRowData.id
    );

    if (originalSalesOrder) {
      setModalMode('edit');
      setCurrentSalesOrder(originalSalesOrder);

      const parentId = originalSalesOrder.id;
      const childIds: number[] = [];
      if (originalSalesOrder.items) {
        childIds.push(...(originalSalesOrder.items as any[]).map(item => item.id).filter(Boolean));
      }

      const queryParams = new URLSearchParams();
      queryParams.set('parentId', String(parentId));
      if (childIds.length > 0) {
        childIds.forEach(childId => queryParams.append('childId', String(childId)));
      }

      navigate(
        `/transaction/sales-order?${queryParams.toString()}`,
        {
          state: { salesOrderdetail: originalSalesOrder, tab: 1 }
        }
      );
    }
  };

  const handleDelete = (category: any) => {
    setCurrentSalesOrder(category);
    setIsDeleteModalOpen(true);
  };

  const handleView = (aggregatedRowData: any) => {
    // Find the original sales order from salesOrderList using the id
    const originalSalesOrder = salesOrderList.find((order: any) => order.id === aggregatedRowData.id);
    if (originalSalesOrder) {
      setCurrentSalesOrder(originalSalesOrder);
      setIsViewModalOpen(true);
    }
  };
 const handleSaveOrderStatus = async (
    completionDate: string,
    description: string,
    transactionDataFromModal?: any
  ) => {
    if (!currentSalesOrder) return;

    const isReopening = currentSalesOrder.order_status === 'Completed' || currentSalesOrder.isComplete === 1;
    const transactionStatus = isReopening ? 'Open' : 'Completed';

    const transactionStatusPayload = {
      id: currentSalesOrder.id,
      transactionTypeId: 102,
      transactionTypeName: 'sales-orders',
      primaryTypeId: currentSalesOrder.id,
      buyerId: transactionDataFromModal?.buyerId || currentSalesOrder.buyerId,
      vendorId: transactionDataFromModal?.vendorId || currentSalesOrder.vendorId,
      date: completionDate,
      description: description || '',
      status: transactionStatus,
      isActive: true
    };

    try {
      await TransactionStatusAPI.postTransactionStatus(transactionStatusPayload);
      
      const newStatus = transactionStatus;
      const newIsComplete = isReopening ? 0 : 1;

      // Update the sales order via API to persist isComplete change
      const companyId = Number(localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'));
      const updatePayload = {
        ...currentSalesOrder,
        order_status: newStatus,
        isComplete: newIsComplete,
        completionDate: newIsComplete === 1 ? completionDate : null,
      };
      
      await dispatch(updateSalesOrder({ id: currentSalesOrder.id, data: updatePayload, companyId })).unwrap();

      const updatedOrder = {
        ...currentSalesOrder,
        order_status: newStatus,
        isComplete: newIsComplete,
        completionDate: completionDate,
        description: description,
        vendorId: transactionDataFromModal?.vendorId || currentSalesOrder.vendorId,
        buyerId: transactionDataFromModal?.buyerId || currentSalesOrder.buyerId,
        transactionTypeId: 105
      };

      const newUpdatedOrders = new Map(updatedOrders);
      newUpdatedOrders.set(currentSalesOrder.id, updatedOrder);
      setUpdatedOrders(newUpdatedOrders);

      toast.success(`Sales Order ${currentSalesOrder.salesOrderNo} ${isReopening ? 're-opened' : 'marked as completed'}`);
      
      // Refresh list to sync with backend
      dispatch(getAllSalesOrders({
        companyId,
        // offset: getOffset(),
        // limit: itemsPerPage,
        fetchAll: true
      }));
    } catch (error) {
      console.error('Error saving transaction status:', error);
      toast.error('Failed to save transaction status');
    }

    setGenericTransactionData(null);
    setIsOrderStatusModalOpen(false);
  };
  // const confirmDelete = () => {
  //   setSalesOrder(salesOrder.filter((c: { id: any; }) => c.id !== currentSalesOrder.id));
  //   setIsDeleteModalOpen(false);
  // };
  const confirmDelete = async () => {
    if (!currentSalesOrder) return;

    try {
      const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      if (!storedCompanyId) return;
      const companyId = Number(storedCompanyId);
      await dispatch(deleteSalesOrder({ id: currentSalesOrder.id, companyId })).unwrap();

      const totalAfterDelete = Math.max(0, (paginationInfo?.total || 0) - 1);
      const maxPageIndex = Math.max(0, Math.ceil(totalAfterDelete / itemsPerPage) - 1);

      if (currentPage > maxPageIndex) {
        resetPage();
        await dispatch(getAllSalesOrders({ companyId,  fetchAll: true }));
      } else {
        await dispatch(getAllSalesOrders({ companyId,fetchAll: true }));
      }
    } catch (error) {
      console.error("Error deleting SalesOrder:", error);
    }

    setIsDeleteModalOpen(false);
  };

  return (
    <div>
      {/* <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900">Sales Order Details (Domestic)</h2>
        
      </div> */}

      <div className="flex gap-4 border-b mb-4">
        <button
          className={`pb-2 px-4 ${activeSubTab === "open" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
          onClick={() => handleSubTabChange('open')}
        >
          Open
        </button>
        <button
          className={`pb-2 px-4 ${activeSubTab === "completed" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
          onClick={() => handleSubTabChange('completed')}
        >
          Completed
        </button>
      </div>

      <DataTable
        title=""
        columns={columns}
        data={aggregatedData}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onPending={() => handleApprovalChange('pending')}
        onApproved={() => handleApprovalChange('approved')}
        activeTab={approvalStatus}
        showActions={true}
        filterPlaceholder="Search Sales Order..."
        showColumnFilters={true}
        columnFilters={tableColumnFilters}
        onColumnFiltersChange={setTableColumnFilters}
        disableFullDataFetch={true}
        virtualScroll={true}
        virtualScrollHeight="65vh"
        isShowPagination={false}
        searchApiEndpoint={searchApiEndpoint}
      />

      {/* <Pagination
        currentPage={currentPage}
        totalItems={totalOrders}
        itemsPerPage={itemsPerPage}
        offset={currentOffset}
        hasNext={!!paginationInfo?.next}
        hasPrev={!!paginationInfo?.prev}
        onPageChange={handlePageChange}
      /> */}

      {/* Add/Edit Modal */}

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Sales Order: ${currentSalesOrder?.salesOrderNo || ''}`}
        className="max-w-4xl"
      >
        {currentSalesOrder && (
          <div className="space-y-6">
            {/* Order Header Information */}
            <div className="grid grid-cols-2 gap-4">
              
              <div>
                <p className="text-sm text-gray-500">Sales Order No</p>
                <p className="font-medium">{currentSalesOrder.salesOrderNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium">
                  {new Date(currentSalesOrder.orderDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{currentSalesOrder.buyerCustomerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer PO No</p>
                <p className="font-medium">{currentSalesOrder.buyerPoNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs ${currentSalesOrder.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {currentSalesOrder.activeFlag ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-3">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Construction</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Buyer Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentSalesOrder.items?.map((item: any, index: any) => {
                      const discountDisplay = item.discountValue && parseFloat(item.discountValue) > 0
                        ? (item.discountType === 'Amount' ? `₹${item.discountValue}` : `${item.discountValue}%`)
                        : '-';
                      const netPriceDisplay = item.netPricePerUnit || item.pricePerUnit || '-';

                      return (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.quality}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.buyerProduct}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.orderQty}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.pricePerUnit}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{discountDisplay}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{netPriceDisplay}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.totalAmount}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete SalesOrder?</p>
          {/* <p className="text-red-600 text-sm">This action cannot be undone.</p> */}
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





// import { DataTable } from "@/components/data/DataTable";
// import { Modal } from "@/components/ui/Modal";
// import { getAllSalesOrders } from "@/state/salesOrderSlice";
// import { AppDispatch, RootState } from "@/state/store";
// import { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";

// interface SalesOrderItem {
//   fabricTypeId: number;
//   quality: string;
//   buyerProduct: string;
//   orderQty: number;
//   pricePerUnit: number;
//   uomId: number;
//   totalAmount: number;
//   gstPercent: number;
//   gstAmount: number;
//   finalAmount: number;
//   deliveryDate: string;
//   remarks: string;
//   activeFlag: boolean;
// }

// interface SalesOrder {
//   id: number;
//   salesOrderNo: string;
//   orderDate: string;
//   buyerCustomerId: number;
//   buyerPoNo: string;
//   deliverToId: number;
//   currencyId: number;
//   exchangeRate: number;
//   modeOfShipmentId: number;
//   shipmentTermsId: number;
//   paymentTermsId: number | null;
//   termsConditionsId: number;
//   activeFlag: boolean;
//   buyerCustomerName: string;
//   internalOrderNo: string | null;
//   items: SalesOrderItem[];
// }

// export function SalesOrderDetails() {
//   const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [currentSalesOrder, setCurrentSalesOrder] = useState<SalesOrder | null>(null);
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();

//   useEffect(() => {
//     dispatch(getAllSalesOrders({}));
//   }, [dispatch]);

//   // Flatten the data for the table
//   const flattenedData = useMemo(() => {
//     return salesOrderList.flatMap((order: SalesOrder) =>
//       order.items.map((item: SalesOrderItem) => ({
//         id: order.id,
//         orderDate: order.orderDate.split('T')[0],
//         salesOrderNo: order.salesOrderNo,
//         internalOrderNo: order.internalOrderNo || 'N/A',
//         customer: order.buyerCustomerName,
//         customerPoNo: order.buyerPoNo,
//         fabricQuality: item.quality,
//         quantity: item.orderQty,
//         unitPrice: item.pricePerUnit,
//         totalAmount: item.totalAmount,
//         status: order.activeFlag ? 'Active' : 'Inactive',
//         // Include the full item for modal view
//         _originalItem: item,
//         _originalOrder: order
//       }))
//     );
//   }, [salesOrderList]);

//   const columns = useMemo(
//     () => [
//       {
//         Header: 'S.No',
//         accessor: 'serialNo', // ✅ Use pre-calculated serial number
    
//         width: 50
//       },
//       { Header: 'SO Date', accessor: 'orderDate' },
//       { Header: 'Sales Order No', accessor: 'salesOrderNo' },
//       { Header: 'Internal Order No', accessor: 'internalOrderNo' },
//       { Header: 'Customer', accessor: 'customer' },
//       { Header: 'Customer PoNo', accessor: 'customerPoNo' },
//       { Header: 'Fabric Quality', accessor: 'fabricQuality' },
//       { Header: 'Quantity', accessor: 'quantity' },
//       { Header: 'Unit Price', accessor: 'unitPrice' },
//       { Header: 'Total Amount', accessor: 'totalAmount' },
//       {
//         Header: 'Status',
//         accessor: 'status',
//         Cell: ({ value }: { value: string }) => (
//           <span className={`px-2 py-1 rounded-full text-xs ${value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//             }`}>
//             {value}
//           </span>
//         ),
//       }
//     ],
//     []
//   );

//   const handleAdd = () => {
//     navigate("/transaction/sales-order");
//   };

//   // const handleEdit = (rowData: any) => {
//   //   navigate("/transaction/sales-order", {
//   //     state: {
//   //       salesOrder: rowData._originalOrder,
//   //       item: rowData._originalItem
//   //     }
//   //   });
//   // };

//   const handleEdit = (salesOrderdetail: any) => {
//     console.log("Current Sales Order Detail:", salesOrderdetail);
//     // setModalMode('edit');
//     setCurrentSalesOrder(salesOrderdetail);
//     // setIsModalOpen(true);
//     navigate("/transaction/sales-order", { state: { salesOrderdetail } });
//   };

//   const handleDelete = (rowData: any) => {
//     setCurrentSalesOrder(rowData._originalOrder);
//     setIsDeleteModalOpen(true);
//   };

//   const handleView = (rowData: any) => {
//     setCurrentSalesOrder(rowData._originalOrder);
//     setIsViewModalOpen(true);
//   };

//   const confirmDelete = () => {
//     // TODO: Implement actual delete functionality
//     setIsDeleteModalOpen(false);
//   };

//   return (
//     <div className="p-4">
//       <DataTable
//         columns={columns}
//         data={flattenedData}
//         title="Sales Order Details (Domestic)"
//         onAdd={handleAdd}
//         onEdit={handleEdit}
//         onDelete={handleDelete}
//         onView={handleView}
//         filterPlaceholder="Search Sales Order..."
//       />

//       {/* View Modal */}
// <Modal
//   isOpen={isViewModalOpen}
//   onClose={() => setIsViewModalOpen(false)}
//   title={`Sales Order: ${currentSalesOrder?.salesOrderNo || ''}`}
//   className="max-w-4xl"
// >
//   {currentSalesOrder && (
//     <div className="space-y-6">
//       {/* Order Header Information */}
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <p className="text-sm text-gray-500">Sales Order No</p>
//           <p className="font-medium">{currentSalesOrder.salesOrderNo}</p>
//         </div>
//         <div>
//           <p className="text-sm text-gray-500">Order Date</p>
//           <p className="font-medium">
//             {new Date(currentSalesOrder.orderDate).toLocaleDateString()}
//           </p>
//         </div>
//         <div>
//           <p className="text-sm text-gray-500">Customer</p>
//           <p className="font-medium">{currentSalesOrder.buyerCustomerName}</p>
//         </div>
//         <div>
//           <p className="text-sm text-gray-500">Customer PO No</p>
//           <p className="font-medium">{currentSalesOrder.buyerPoNo}</p>
//         </div>
//         <div>
//           <p className="text-sm text-gray-500">Status</p>
//           <span className={`px-2 py-1 rounded-full text-xs ${currentSalesOrder.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//             }`}>
//             {currentSalesOrder.activeFlag ? "Active" : "Inactive"}
//           </span>
//         </div>
//       </div>

//       {/* Items Table */}
//       <div className="mt-6">
//         <h3 className="font-semibold text-lg mb-3">Order Items</h3>
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fabric Quality</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Buyer Product</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {currentSalesOrder.items?.map((item, index) => (
//                 <tr key={index}>
//                   <td className="px-4 py-2 whitespace-nowrap text-sm">{item.quality}</td>
//                   <td className="px-4 py-2 whitespace-nowrap text-sm">{item.buyerProduct}</td>
//                   <td className="px-4 py-2 whitespace-nowrap text-sm">{item.orderQty}</td>
//                   <td className="px-4 py-2 whitespace-nowrap text-sm">{item.pricePerUnit}</td>
//                   <td className="px-4 py-2 whitespace-nowrap text-sm">{item.totalAmount}</td>
//                   <td className="px-4 py-2 whitespace-nowrap text-sm">
//                     {new Date(item.deliveryDate).toLocaleDateString()}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <div className="flex justify-end pt-4">
//         <button
//           onClick={() => setIsViewModalOpen(false)}
//           className="btn btn-secondary"
//         >
//           Close
//         </button>
//       </div>
//     </div>
//   )}
// </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal
//         isOpen={isDeleteModalOpen}
//         onClose={() => setIsDeleteModalOpen(false)}
//         title="Confirm Delete"
//       >
//         <div className="space-y-4">
//           <p>Are you sure you want to delete sales order {currentSalesOrder?.salesOrderNo}?</p>
//           <p className="text-red-600 text-sm">This action cannot be undone.</p>
//           <div className="flex justify-end space-x-3 pt-4">
//             <button
//               onClick={() => setIsDeleteModalOpen(false)}
//               className="btn btn-secondary"
//             >
//               Cancel
//             </button>
//             <button onClick={confirmDelete} className="btn btn-danger">
//               Delete
//             </button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }