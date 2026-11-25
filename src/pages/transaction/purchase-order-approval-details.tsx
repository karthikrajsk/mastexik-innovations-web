import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { getAllPurchaseOrders, getAllPoTypes, updatePurchaseOrder } from "@/state/purchaseOrderSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useEffect, useMemo, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { ApprovalModal } from "@/components/modals/ApprovalModal";
import { toast } from "react-toastify";


export function PurchaseOrderApprovalDetails() {
  const { purchaseOrderList, paginationInfo, purchaseOrderTypeList } = useSelector((state: RootState) => state.purchaseOrder);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  
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
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
    dispatch(getAllPurchaseOrders({ 
      // offset: getOffset(), 
      // limit: itemsPerPage,
      fetchAll: true,
      companyId
    }));
    dispatch(getAllVendors({fetchAll: true}));
    dispatch(getAllPoTypes({}));
  }, [dispatch, location.pathname, currentPage, getOffset, itemsPerPage]);

  const vendorMap = useMemo(() => {
    return vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
      acc[vendor.id] = vendor.vendorName;
      return acc;
    }, {}) || {};
  }, [vendorList]);

  const poTypeMap = useMemo(() => {
    return purchaseOrderTypeList?.reduce((acc: Record<number, string>, type: { id: number; poTypeName: string }) => {
      acc[type.id] = type.poTypeName;
      return acc;
    }, {}) || {};
  }, [purchaseOrderTypeList]);

  const aggregatedData = useMemo(() => {
    if (!purchaseOrderList || purchaseOrderList.length === 0) return [];

    const loggedInCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const serialBase = paginationInfo?.offset || 0;

    return purchaseOrderList
      .filter((order: any) => {
        if (loggedInCompanyId && order.companyId && String(order.companyId) !== String(loggedInCompanyId)) {
          return false;
        }
        return true;
      })
      .map((order: any, index: number) => {
        const vendorName = vendorMap[order.vendorId] || `Vendor ${order.vendorId}`;
        const poTypeNameRaw = poTypeMap[order.poTypeId] || "";
        const poTypeName = poTypeNameRaw || `Type ${order.poTypeId}`;
        const isYarnType = poTypeNameRaw.toLowerCase().includes('yarn');
        const isItemType = poTypeNameRaw.toLowerCase().includes('item');

        const quantities = order.purchaseOrderItemsDtl
          ?.map((item: any) => item.quantity)
          .filter((q: any) => q != null && q !== '') || [];
        const quantity = quantities.length === 1 
          ? quantities[0] 
          : quantities.join(', ');

        const productName = order.purchaseOrderItemsDtl?.map((item: any) => {
          if (isYarnType) return item.yarnName;
          if (isItemType) return item.itemName;
          return (item.fabricCode && item.quality ? `${item.fabricCode}-${item.quality}` : '');
        }).filter(Boolean).join(', ') || '';

        return {
          id: order.id,
          serialNo: serialBase + index + 1,
          poDate: order.poDate && order.poDate.includes('T') ? order.poDate.split('T')[0] : order.poDate,
          poNo: order.poNo,
          vendor: vendorName,
          poType: poTypeName,
          productName,
          quantity,
          isApproved: order.isApproved === 1 || order.isApproved === true,
          approveDate: order.approveDate,
          comments: order.comments,
          originalOrder: order
        };
      });
  }, [purchaseOrderList, paginationInfo?.offset, vendorMap, poTypeMap]);

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
        approveDate: approvalData.approveDate,
        comments: approvalData.comments,
        userId: approvalData.userId
      };

      await dispatch(updatePurchaseOrder({ id: selectedOrder.id, data: payload, companyId })).unwrap();
      toast.success("Purchase Order approved successfully");
      setIsApprovalModalOpen(false);
      setSelectedOrder(null);
      
      dispatch(getAllPurchaseOrders({ 
        // offset: getOffset(), 
        // limit: itemsPerPage,
        fetchAll: true,
        companyId
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
        Header: 'PO Date',
        accessor: 'poDate',
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
      { Header: 'PO No', accessor: 'poNo' },
      { Header: 'Vendor', accessor: 'vendor' },
      { Header: 'PO Type', accessor: 'poType' },
      { Header: 'Product Name', accessor: 'productName' },
      { Header: 'Quantity', accessor: 'quantity' },
      {
        Header: 'Approve Date',
        accessor: 'approveDate',
        Cell: ({ value }: { value: string }) => value ? new Date(value).toLocaleDateString('en-GB') : '-'
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
                Approve
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
        title="Purchase Order Approval"
        columns={columns}
        data={aggregatedData}
        loading={!purchaseOrderList}
        showColumnFilters={true}
        filterPlaceholder="Search PO No, Vendor, Product..."
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
