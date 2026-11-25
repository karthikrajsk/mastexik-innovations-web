import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { getAllWeavingJobWorkOrders, updateWeavingJobWorkOrder, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useEffect, useMemo, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { ApprovalModal } from "@/components/modals/ApprovalModal";
import { toast } from "react-toastify";

export function WeavingJobWorkOrderApprovalDetails() {
  const { weavingJobWorkOrderList, loading } = useSelector((state: RootState) => state.weavingJobWorkOrder);
  const { customerList, domesticCustomerList, internationalCustomerList } = useSelector((state: RootState) => state.customer);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  
  const location = useLocation();
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
    
    if (companyId) {
        dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: companyId ,fetchAll:true}) as any);
    } else {
        dispatch(getAllWeavingJobWorkOrders({fetchAll:true}) as any);
    }
    dispatch(getAllCustomers({ fetchAll: true }) as any);
    dispatch(getAllFabricMasters({}) as any);
  }, [dispatch, location.pathname]);

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
    const source = Array.isArray(weavingJobWorkOrderList) ? weavingJobWorkOrderList : (weavingJobWorkOrderList as any)?.data || [];
    const serialBase = 0;

    return source
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
        const firstItem = items[0] || {};
        const fabricById = fabricMasterList?.find((f: any) => String(f.id) === String(firstItem.fabricCodeId));
        const code = fabricById?.fabricCode ?? firstItem.fabricCode ?? firstItem.fabricCodeName;
        const quality = fabricById?.fabricQuality ?? firstItem.fabricQuality ?? firstItem.fabricQualityName;
        const fabricSummary = [code, quality].filter(Boolean).join(' / ') || '-';
        
        const totalQuantity = items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;

        return {
          id: order.id,
          serialNo: serialBase + index + 1,
          orderDate: order.orderDate && order.orderDate.includes('T') ? order.orderDate.split('T')[0] : order.orderDate,
          orderNo: order.jobWorkOrderNo || order.weavingWorkOrderNo || '-',
          buyer: buyerName,
          fabricSummary,
          quantity: totalQuantity,
          isApproved: order.isApproved === 1 || order.isApproved === true,
          approveDate: order.approveDate,
          comments: order.comments,
          originalOrder: order
        };
      });
  }, [weavingJobWorkOrderList, customerMap, fabricMasterList]);

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

      await dispatch(updateWeavingJobWorkOrder({ id: selectedOrder.id, data: payload, factoryCompanyId: companyId } as any)).unwrap();
      toast.success("Weaving Job Work Order approved successfully");
      setIsApprovalModalOpen(false);
      setSelectedOrder(null);
      
      if (companyId) {
        dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: companyId ,fetchAll:true}) as any);
      } else {
        dispatch(getAllWeavingJobWorkOrders({fetchAll:true}) as any);
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
      { Header: 'Quantity', accessor: 'quantity' },
      {
        Header: 'Approve Date',
        accessor: 'approveDate',
        Cell: ({ value }: { value: string }) => value ? new Date(value).toLocaleDateString('en-GB') : '-'
      },
      { Header: 'Sort No / Construction', accessor: 'fabricSummary' },
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
              <span className="inline-flex items-center rounded-full bg-green-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
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
        title="Weaving Job Work Order Approval"
        columns={columns}
        data={aggregatedData}
        loading={loading}
        showColumnFilters={true}
        filterPlaceholder="Search Order No, Buyer..."
        disableFullDataFetch={true}
      />

      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onSave={handleSaveApproval}
        initialData={selectedOrder}
      />
    </div>
  );
}
