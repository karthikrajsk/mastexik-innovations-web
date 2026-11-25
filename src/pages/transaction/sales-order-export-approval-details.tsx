import { DataTable } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { getAllSalesOrders, getAllPoTypes, updateSalesOrder } from "@/state/salesOrderSlice";
import { getAllInvoices } from "@/state/invoiceSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { ApprovalModal } from "@/components/modals/ApprovalModal";
import { toast } from "react-toastify";

export function SalesOrderExportApprovalDetails() {
  const { salesOrderList, paginationInfo, purchaseOrderTypeList } = useSelector((state: RootState) => state.salesOrder);
  const { invoiceList } = useSelector((state: RootState) => state.invoice);
  
  const location = useLocation();
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset } = usePagination({ itemsPerPage: 10 });
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(getAllSalesOrders({fetchAll:true }));
    dispatch(getAllInvoices({}));
    dispatch(getAllPoTypes({}));
  }, [dispatch, currentPage, getOffset, itemsPerPage]);

  const aggregatedData = useMemo(() => {
    if (!salesOrderList || !invoiceList) return [];

    // Get logged in company ID
    const loggedInCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');

    return salesOrderList
      .filter((order: any) => {
        // Filter by companyId matching logged in company
        if (loggedInCompanyId && String(order.companyId) !== String(loggedInCompanyId)) return false;

        // Filter by export type
        const isExport = (order.exportType && (String(order.exportType) === '2' || order.exportType === 2)) || order.orderTypeId === 2;
        
        if (!isExport || order.activeFlag !== true) return false;

        // Show both pending and approved orders in approval page

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
          orderDate: formatDate(order.orderDate.split('T')[0]),
          salesOrderNo: order.salesOrderNo,
          customer: order.buyerCustomerName,
          customerPoNo: order.buyerPoNo,
          fabricCode: fabricCodes,
          buyerProduct: buyerProducts,
          orderQuantity,
          dispatchedQuantity,
          balanceQuantity,
          isApproved: order.isApproved,
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
        comments: approvalData.comments
      };

      await dispatch(updateSalesOrder({ id: selectedOrder.id, data: payload, companyId })).unwrap();
      toast.success("Order approved successfully");
      setIsApprovalModalOpen(false);
      setSelectedOrder(null);
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
        disableFilters: true,
      },
      { Header: 'So Date', accessor: 'orderDate' },
      { Header: 'Sales Order No', accessor: 'salesOrderNo' },
      { Header: 'Customer', accessor: 'customer' },
      { Header: 'Customer PoNo', accessor: 'customerPoNo' },
      { Header: 'Sort No', accessor: 'fabricCode' },
      { Header: 'Buyer Product', accessor: 'buyerProduct' },
      { Header: 'Order Quantity', accessor: 'orderQuantity' },
    
      
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
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Approved
              </span>
            );
          } else if (needsReapproval) {
            return (
              <button
                onClick={() => handleApproval(props.row.original)}
                className="text-orange-600 underline hover:text-orange-800 font-medium"
              >
                Re-Approval
              </button>
            );
          } else {
            return (
              <button
                onClick={() => handleApproval(props.row.original)}
                className="text-primary-600 underline hover:text-primary-800 font-medium"
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
        title="Sales Order Export Approval"
        columns={columns}
        data={aggregatedData}
        loading={!salesOrderList}
        disableFullDataFetch={true}
      />

      {/* <div className="mt-4 flex justify-end">
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
