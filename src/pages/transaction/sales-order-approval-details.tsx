import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { getAllSalesOrders, getAllPoTypes, updateSalesOrder } from "@/state/salesOrderSlice";
import { getAllInvoices } from "@/state/invoiceSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useEffect, useMemo, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { ApprovalModal } from "@/components/modals/ApprovalModal";
import { toast } from "react-toastify";


export function SalesOrderApprovalDetails() {
  const { salesOrderList, paginationInfo, purchaseOrderTypeList } = useSelector((state: RootState) => state.salesOrder);
  const { invoiceList } = useSelector((state: RootState) => state.invoice);
  
  const location = useLocation();
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(getAllSalesOrders({ 
      // offset: getOffset(), 
      // limit: itemsPerPage 
      fetchAll: true
    }));
    dispatch(getAllInvoices({}));
    dispatch(getAllPoTypes({}));
  }, [dispatch, location.pathname, currentPage, getOffset, itemsPerPage]);

  const aggregatedData = useMemo(() => {
    if (!salesOrderList || !invoiceList) return [];

    // Get logged in company ID
    const loggedInCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');

    return salesOrderList
      .filter((order: any) => {
        // Filter by companyId matching logged in company
        if (loggedInCompanyId && String(order.companyId) !== String(loggedInCompanyId)) return false;

        // Filter by domestic type
        const isDomestic = (order.exportType && (String(order.exportType) === '1' || order.exportType === 1)) || order.orderTypeId === 1;
        
        if (!isDomestic || order.activeFlag !== true) return false;

        return true;
      })
      .map((order: any, index: number) => {
        const orderQuantity = order.items?.reduce((sum: number, item: any) => sum + (item.orderQty || 0), 0) || 0;
        const fabricCodes = order.items?.map((item: any) => item.fabricCode).filter(Boolean).join(', ') || '';
        const buyerProducts = order.items?.map((item: any) => item.buyerProduct).filter(Boolean).join(', ') || '';

        const dispatchedQuantity = invoiceList
          .filter((invoice: any) => invoice.salesOrderId === order.id)
          .reduce((sum: number, invoice: any) =>
            sum + (invoice.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0), 0);

        const balanceQuantity = orderQuantity - dispatchedQuantity;

        return {
          id: order.id,
          serialNo: (paginationInfo?.offset || 0) + index + 1,
          orderDate: order.orderDate.split('T')[0],
          salesOrderNo: order.salesOrderNo,
          customer: order.buyerCustomerName,
          customerPoNo: order.buyerPoNo,
          fabricCode: fabricCodes,
          buyerProduct: buyerProducts,
          orderQuantity,
          dispatchedQuantity,
          balanceQuantity,
          isApproved: order.isApproved === 1 || order.isApproved === true,
          originalOrder: order
        };
      });
  }, [salesOrderList, invoiceList, paginationInfo?.offset, purchaseOrderTypeList]);

  const handleApproval = useCallback((aggregatedRowData: any) => {
    setSelectedOrder(aggregatedRowData.originalOrder);
    setIsApprovalModalOpen(true);
  }, []);

  const handleSaveApproval = async (approvalData: any) => {
    if (!selectedOrder) return;

    try {
      const companyId = Number(localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'));
      const payload = {
        ...selectedOrder,
        isApproved: 1,
        internalRefNo: approvalData.internalRefNo,
        approveDate: approvalData.approveDate,
        readyDate: approvalData.readyDate,
        comments: approvalData.comments,
        userId: approvalData.userId
      };

      await dispatch(updateSalesOrder({ id: selectedOrder.id, data: payload, companyId })).unwrap();
      toast.success("Order approved successfully");
      setIsApprovalModalOpen(false);
      setSelectedOrder(null);
      
      dispatch(getAllSalesOrders({ 
        // offset: getOffset(), 
        // limit: itemsPerPage 
        fetchAll: true
      }));
    } catch (error: any) {
      console.error("Failed to approve order:", error);
      toast.error(error || "Failed to approve order");
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo',
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
     
      {
        Header: 'Approve Date',
        accessor: 'id',
        Cell: ({ row }: any) => row.original.originalOrder?.approveDate ? new Date(row.original.originalOrder.approveDate).toLocaleDateString('en-GB') : '-'
      },
      {
        Header: 'Approval',
        accessor: 'id',
        disableFilters: true,
        Cell: (props: any) => {
          const isApproved = props.row.original.isApproved === 1 || props.row.original.isApproved === true;
          const hasPreviousApproval = props.row.original.originalOrder?.approveDate;
          const needsReapproval = !isApproved && hasPreviousApproval;
          
          if (isApproved) {
            return (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                Approved
              </span>
            );
          } else if (needsReapproval) {
            return (
              <button
                onClick={() => handleApproval(props.row.original)}
                className="text-orange-600 underline hover:text-orange-800 font-medium text-sm"
                type="button"
              >
                Re-Approval
              </button>
            );
          } else {
            return (
              <button
                onClick={() => handleApproval(props.row.original)}
                className="text-sm font-medium text-primary-600 underline hover:text-primary-800"
                type="button"
              >
                Approval
              </button>
            );
          }
        },
      }
    ],
    [handleApproval]
  );

  return (
    <div className="space-y-4">
      <DataTable
        title="Sales Order Approval"
        columns={columns}
        data={aggregatedData}
        loading={!salesOrderList}
        disableFullDataFetch={true}
      />
      {/* <div className="flex justify-end mt-4">
        <Pagination
          currentPage={currentPage}
          totalItems={paginationInfo?.total || 0}
          itemsPerPage={itemsPerPage}
          offset={getOffset()}
          hasNext={paginationInfo?.next || false}
          hasPrev={paginationInfo?.prev || false}
          onPageChange={handlePageChange}
        />
      </div> */}

      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onSave={handleSaveApproval}
        initialData={selectedOrder}
      />
    </div>
  );
}
