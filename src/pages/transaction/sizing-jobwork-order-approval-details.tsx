import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { getAllSizingJobWorkOrders, updateSizingJobWorkOrder, getAllSizingJobWorkOrdersByFactoryCompanyId } from "@/state/sizingJobWorkOrderSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useEffect, useMemo, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { ApprovalModal } from "@/components/modals/ApprovalModal";
import { toast } from "react-toastify";


export function SizingJobWorkOrderApprovalDetails() {
  const { sizingJobWorkOrderList, paginationInfo, loading } = useSelector((state: RootState) => state.sizingJobWorkOrder);
  const { customerList, domesticCustomerList, internationalCustomerList } = useSelector((state: RootState) => state.customer);
  
  const location = useLocation();
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
    
    const params = { 
      // offset: getOffset(), 
      // limit: itemsPerPage 
      fetchAll: true
    };

    if (companyId) {
        dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: companyId, ...params }));
    } else {
        dispatch(getAllSizingJobWorkOrders(params));
    }
    dispatch(getAllCustomers({ fetchAll: true }));
  }, [dispatch, location.pathname, currentPage, getOffset, itemsPerPage]);

  const customerMap = useMemo(() => {
    const rawList: any[] = [];
    
    const addItems = (list: any) => {
      if (Array.isArray(list)) {
        rawList.push(...list);
      } else if (list && Array.isArray(list.data)) {
        rawList.push(...list.data);
      }
    };

    addItems(customerList);
    addItems(domesticCustomerList);
    addItems(internationalCustomerList);

    const map: Record<string | number, string> = {};
    rawList.forEach((customer: any) => {
      if (!customer) return;
      const id = customer.id ?? customer.customerId ?? customer.customer_id;
      const name = customer.customerName ?? customer.name ?? customer.companyName ?? customer.tradeName ?? customer.customer_name;
      if (id !== undefined && id !== null && name) {
        map[id] = name;
        map[String(id)] = name;
      }
    });
    return map;
  }, [customerList, domesticCustomerList, internationalCustomerList]);

  const aggregatedData = useMemo(() => {
    if (!sizingJobWorkOrderList) return [];

    const serialBase = paginationInfo?.offset || 0;

    return sizingJobWorkOrderList
      .map((order: any, index: number) => {
        const buyerId = order.buyerId ?? order.buyer ?? order.customerId ?? order.partyId;
        let buyerName = order.buyerName || order.customerName || order.partyName;

        if (!buyerName && typeof order.buyer === 'object' && order.buyer !== null) {
          buyerName = order.buyer.customerName || order.buyer.name || order.buyer.companyName;
        }

        if (!buyerName && buyerId != null) {
          buyerName = customerMap[buyerId] || customerMap[String(buyerId)];
        }

        if (!buyerName) {
          buyerName = buyerId != null ? `Buyer ${buyerId}` : '-';
        }
        const items = Array.isArray(order.items) ? order.items : [];
        const totalQuantity = items?.reduce((sum: number, item: any) => sum + (item.warpMeters || 0), 0) || 0;

        const yarnNames = items
          .map((item: any) => item.yarnName || item.yarn?.yarnName || item.yarn?.name || `Yarn ${item.yarnId}`)
          .filter(Boolean);
        const uniqueYarnNames = Array.from(new Set(yarnNames)).join(', ');
        const totalEnds = items.reduce((sum: number, item: any) => sum + (Number(item.totalEnds) || Number(item.actualWarpEnds) || 0), 0);

        return {
          id: order.id,
          serialNo: serialBase + index + 1,
          orderDate: order.orderDate && order.orderDate.includes('T') ? order.orderDate.split('T')[0] : order.orderDate,
          orderNo: order.sizingWorkOrderNo || order.sizingJobWorkOrderNo || '-',
          buyer: buyerName,
          yarnNames: uniqueYarnNames || '-',
          totalEnds: totalEnds || '-',
          quantity: totalQuantity,
          isApproved: order.isApproved === 1 || order.isApproved === true,
          approveDate: order.approveDate,
          comments: order.comments,
          originalOrder: order
        };
      });
  }, [sizingJobWorkOrderList, paginationInfo?.offset, customerMap]);

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

      await dispatch(updateSizingJobWorkOrder({ id: selectedOrder.id, data: payload, factoryCompanyId: companyId })).unwrap();
      toast.success("Sizing Job Work Order approved successfully");
      setIsApprovalModalOpen(false);
      setSelectedOrder(null);
      
      const params = { 
        // offset: getOffset(), 
        // limit: itemsPerPage 
        fetchAll: true
      };
      if (companyId) {
        dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: companyId, ...params }));
      } else {
        dispatch(getAllSizingJobWorkOrders(params));
      }
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
        Header: 'Order Date',
        accessor: 'orderDate',
        Cell: ({ value }: { value: string }) => {
          if (!value) return '-';
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
            if (!dateStr) return false;
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
      { Header: 'Order No', accessor: 'orderNo' },
      { Header: 'Buyer', accessor: 'buyer' },
      { Header: 'Yarn Name', accessor: 'yarnNames' },
      { Header: 'Total Ends', accessor: 'totalEnds' },
      { Header: 'Quantity (Mtrs)', accessor: 'quantity' },
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Approved
              </span>
            );
          } else if (needsReapproval) {
            return (
              <button
                onClick={() => handleApproval(props.row.original)}
                className="text-orange-600 underline hover:text-orange-800 font-medium text-sm cursor-pointer"
                type="button"
              >
                Re-Approval
              </button>
            );
          } else {
            return (
              <button
                onClick={() => handleApproval(props.row.original)}
                className="text-sm font-medium text-primary-600 underline hover:text-primary-800 cursor-pointer"
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
        title="Sizing Job Work Order Approval"
        columns={columns}
        data={aggregatedData}
        loading={loading}
        showColumnFilters={true}
        filterPlaceholder="Search Order No, Buyer, Yarn..."
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
