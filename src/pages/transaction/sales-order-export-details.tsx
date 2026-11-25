import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { getAllSalesOrders, deleteSalesOrder, updateSalesOrder } from "@/state/salesOrderSlice";
import { getAllInvoices } from "@/state/invoiceSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { OrderStatusModal } from "@/components/ui/OrderStatusModal";
import { TransactionStatusAPI } from "@/services/transaction-status-api";
import { toast } from "react-toastify";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { useAuth } from "@/contexts/AuthContext";

interface categoryFormData {
  id?: number;
  name: string;
  status: string;
}

export function SalesOrderExportDetails() {
  const { user } = useAuth();

  const { salesOrderList,paginationInfo } = useSelector((state: RootState) => state.salesOrder);
  const { invoiceList } = useSelector((state: RootState) => state.invoice);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentSalesOrder, setCurrentSalesOrder] = useState<any>(null);
  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
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
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();


   const {
      currentPage,
      itemsPerPage,
      handlePageChange,
      resetPage,
      getOffset,
      setItemsPerPage
    } = usePagination({ itemsPerPage: 10 });

  // const { register, handleSubmit, reset, formState: { errors } } = useForm<categoryFormData>();

  const handleSubTabChange = (tab: 'open' | 'completed') => {
    if (activeSubTab === tab) return;
    setActiveSubTab(tab);
    resetPage();
  };

  const handleApprovalChange = (status: 'pending' | 'approved') => {
    if (approvalStatus === status) return;
    setApprovalStatus(status);
    resetPage();
  };

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) return;
    const companyId = Number(storedCompanyId);

    const userRoleLower = (user?.role || '').trim().toLowerCase();
    const isDeptSpecificRole = ['weaving', 'brushing', 'garments'].includes(userRoleLower);

    const filters: Record<string, string | number | boolean> = {
      exportType: 'export',
      orderTypeId: 2,
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
  }, [dispatch, activeSubTab, approvalStatus, getOffset, itemsPerPage, location.pathname, user?.role]);

  useEffect(() => {
    dispatch(getAllInvoices({}));
  }, [dispatch]);

  // Aggregate data per sales order (Export only)
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

    const exportOrders = filteredList.filter((o: any) =>
      (o.exportType && String(o.exportType).toLowerCase() === 'export') || o.orderTypeId === 2
    );
    const serialBase = paginationInfo?.offset || 0;
    
    return exportOrders
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
  }, [salesOrderList, invoiceList, activeSubTab, approvalStatus, updatedOrders, paginationInfo?.offset, user?.role]);

  const totalOrders = paginationInfo?.total ?? (Array.isArray(aggregatedData) ? aggregatedData.length : 0);

      const processedCityList = useMemo(() => {
    return salesOrderList.map((city: any, index: number) => ({
      ...city,
      serialNo: index + 1
    }));
  }, [salesOrderList]);
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


 const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    disableFilters: true,
      },
      { Header: 'So Date', accessor: 'orderDate',Cell: ({ value }: { value: string }) => {
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
              } },
      { Header: 'Sales Order No', accessor: 'salesOrderNo' },
      { Header: 'Customer', accessor: 'customer' },
      { Header: 'Customer PoNo', accessor: 'customerPoNo' },
      { Header: 'Sort No', accessor: 'fabricCode' },
      { Header: 'Buyer Product', accessor: 'buyerProduct' },
      { Header: 'Order Quantity', accessor: 'orderQuantity' },
      { Header: 'Dispatched Quantity', accessor: 'dispatchedQuantity' },
      { Header: 'Balance Quantity', accessor: 'balanceQuantity' },
        {
        Header: 'Order Status',
        accessor: 'order_status',
        Cell: (props: any) => {
           const { row } = props;
          const isComplete = row.original.isComplete === 1 || row.original.isComplete === true;
          // const { value, row } = props;
          // const orderStatus = value || 'Pending';
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
  //   navigate("/transaction/sales-order", { state: { tab: 'export' } });
  // };

  // const handleEdit = (aggregatedRowData: any) => {
  //   // Find the original sales order from salesOrderList using the id
  //   const originalSalesOrder = salesOrderList.find((order: any) => order.id === aggregatedRowData.id);
  //   if (originalSalesOrder) {
  //     setModalMode('edit');
  //     setCurrentSalesOrder(originalSalesOrder);
  //     navigate("/transaction/sales-order", { state: { salesOrderdetail: originalSalesOrder, tab: 'export' } });
  //   }
  // };
   const handleAdd = () => {
    setModalMode('add');
    setCurrentSalesOrder(null);
    navigate("/transaction/sales-order", { state: { tab: 2 } });
  };

  const handleEdit = (aggregatedRowData: any) => {
    // Find the original sales order from salesOrderList using the id
    const originalSalesOrder = salesOrderList.find((order: any) => order.id === aggregatedRowData.id);
    if (originalSalesOrder) {
      setModalMode('edit');
      setCurrentSalesOrder(originalSalesOrder);
      navigate("/transaction/sales-order", { state: { salesOrderdetail: originalSalesOrder, tab: 2 } });
    }
  };

  const handleDelete = (category: any) => {
    setCurrentSalesOrder(category);
    setIsDeleteModalOpen(true);
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
      vendorId: transactionDataFromModal?.vendorId || undefined,
      date: completionDate,
      description: description || '',
      status: transactionStatus,
      isActive: true
    };

    try {
      await TransactionStatusAPI.postTransactionStatus(transactionStatusPayload);

      const isReopening = currentSalesOrder.order_status === 'Completed' || currentSalesOrder.isComplete === 1;
      // const newStatus = isReopening ? 'Pending' : 'Completed';
      // const newIsComplete = isReopening ? 0 : 1;

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
        buyerId: transactionDataFromModal?.buyerId || currentSalesOrder.buyerId
      };

      const newUpdatedOrders = new Map(updatedOrders);
      newUpdatedOrders.set(currentSalesOrder.id, updatedOrder);
      setUpdatedOrders(newUpdatedOrders);

      toast.success(`Sales Order ${currentSalesOrder.salesOrderNo} ${isReopening ? 're-opened' : 'marked as completed'}`);
      
      // Refresh list to sync with backend
      dispatch(getAllSalesOrders({ companyId ,fetchAll: true}));
    } catch (error) {
      console.error('Error saving transaction status:', error);
      toast.error('Failed to save transaction status');
    }

    setGenericTransactionData(null);
    setIsOrderStatusModalOpen(false);
  };

  const handleView = (aggregatedRowData: any) => {
    // Find the original sales order from salesOrderList using the id
    const originalSalesOrder = salesOrderList.find((order: any) => order.id === aggregatedRowData.id);
    if (originalSalesOrder) {
      setCurrentSalesOrder(originalSalesOrder);
      setIsViewModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!currentSalesOrder) return;
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) return;
    try {
      await dispatch(deleteSalesOrder({ id: currentSalesOrder.id, companyId: Number(storedCompanyId) })).unwrap();
        const totalAfterDelete = Math.max(0, (paginationInfo?.total || 0) - 1);
      const maxPageIndex = Math.max(0, Math.ceil(totalAfterDelete / itemsPerPage) - 1);
        if (currentPage > maxPageIndex) {
        resetPage();
        await dispatch(getAllSalesOrders({companyId: Number(storedCompanyId),  fetchAll: true }));
      } else {
        await dispatch(getAllSalesOrders({ companyId: Number(storedCompanyId),fetchAll: true }));
      }
      // await dispatch(getAllSalesOrders({ companyId: Number(storedCompanyId) }));
    } catch (error) {
      console.error('Error deleting SalesOrder:', error);
    }
    setIsDeleteModalOpen(false);
  };


  const currentOffset = paginationInfo?.offset || 0;
  return (
    <div>
      {/* <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900">Sales Order Details (Export)</h2>
        
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
        disableFullDataFetch={true}
        //    initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={totalOrders}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
      />

  {/* <Pagination
        currentPage={currentPage}
        totalItems={totalOrders}
        itemsPerPage={itemsPerPage}
        offset={paginationInfo?.offset || 0}
        hasNext={!!paginationInfo?.next}
        hasPrev={!!paginationInfo?.prev}
        onPageChange={handlePageChange}
      /> */}
      {/* Add/Edit Modal */}

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Sales Order Details"
      >
        {currentSalesOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">ID</p>
                <p className="font-medium">{currentSalesOrder.id}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">So Date</p>
                <p className="font-medium">{currentSalesOrder.soDate}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">SO No</p>
                <p className="font-medium">{currentSalesOrder.soNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Customer</p>
                <p className="font-medium">{currentSalesOrder.customer}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Customer Po No</p>
                <p className="font-medium">{currentSalesOrder.customerPoNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Construction</p>
                <p className="font-medium">{currentSalesOrder.fabricQuality}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Quantity</p>
                <p className="font-medium">{currentSalesOrder.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Unit Price</p>
                <p className="font-medium">{currentSalesOrder.unitPrice}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">UOM</p>
                <p className="font-medium">{currentSalesOrder.uom}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Total Amount</p>
                <p className="font-medium">{currentSalesOrder.totalAmount}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Delivery Date</p>
                <p className="font-medium">{currentSalesOrder.deliveryDate}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Dispatched Qty</p>
                <p className="font-medium">{currentSalesOrder.dispatchedQty}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Ready For Dispatch</p>
                <p className="font-medium">{currentSalesOrder.readyForDispatch}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Balance Qty</p>
                <p className="font-medium">{currentSalesOrder.readyForDispatch}</p>
              </div>

              <div>
                <p className="text-sm text-secondary-500">Status</p>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs ${currentSalesOrder.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {currentSalesOrder.status}
                  </span>
                </p>
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
