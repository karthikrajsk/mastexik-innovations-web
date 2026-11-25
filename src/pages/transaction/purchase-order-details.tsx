import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { deletePurchaseOrder, getAllPurchaseOrders, getAllPoTypes, updatePurchaseOrder } from "@/state/purchaseOrderSlice";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useDeletionStatus } from "@/hooks/useDeletionStatus";
import { useHighlightRow } from "@/hooks/useHighlightRow";
import { OrderStatusModal } from "@/components/ui/OrderStatusModal";
import { ApprovalModal } from "@/components/modals/ApprovalModal";
import { TransactionStatusAPI } from "@/services/transaction-status-api";
import { CodesAPI } from "@/services/codes_api";
import { CodesUtil } from "@/utils/codesUtil";
import { CodeDetail, CodeHeader } from "@/types/codes";
import { DocumentAttachmentModal } from "@/components/modals/DocumentAttachmentModal";
import { useFileCounts } from "@/hooks/useFileCounts";
import { Printer, X } from "lucide-react";


interface PurchaseOrderItem {
  id: number;
  productCategoryId: number;
  quantity: number;
  unit: string;
  price: number;
  discountType?: string | null;
  discountValue?: number | null;
  discountAmount?: number | null;
  netPricePerUnit?: number | null;
  netAmount: number;
  deliveryDate: string;
  remarks: string;
  activeFlag: boolean | null;
  itemName?: string | null;
  yarnName?: string | null;
  fabricCode?: string | null;
  quality?: string | null;
  performaNo?: string | null;
  proformaNo?: string | null;
  note?: string | null;
}

interface PurchaseOrder {
  id: number;
  poNo: string;
  poTypeId: number;
  poDate: string;
  vendorId: number;
  taxId: number;
  activeFlag: boolean;
  purchaseOrderItemsDtl: PurchaseOrderItem[];
  companyId?: number;
  order_status?: string;
  isComplete?: number | boolean;
  completionDate?: string | null;
  description?: string;
  isApproved?: number | boolean;
  approveDate?: string;
  comments?: string;
  note?: string | null;
  userId?: number;
  buyerId?: number;
}

export function PurchaseOrderDetails() {
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

  const { purchaseOrderList, purchaseOrderTypeList, paginationInfo, loading } = useSelector((state: RootState) => state.purchaseOrder);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
  const { uomList } = useSelector((state: RootState) => state.uom);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPurchaseOrder, setCurrentPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [genericTransactionData, setGenericTransactionData] = useState<{
    transactionTypeId?: number;
    vendorId?: number;
    buyerId?: number;
    [key: string]: any;
  } | null>(null);
  const [updatedOrders, setUpdatedOrders] = useState<Map<number, PurchaseOrder>>(new Map());
  const [tableColumnFilters, setTableColumnFilters] = useState<Record<string, any>>({});
  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'open' | 'completed'>('open');
  const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);
  const [attachmentModalTitle, setAttachmentModalTitle] = useState<string>('');
  const [selectedPrintPO, setSelectedPrintPO] = useState<PurchaseOrder | null>(null);
  const [selectedPrintWO, setSelectedPrintWO] = useState<PurchaseOrder | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const highlightRowId = useHighlightRow();
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>(
    location.state?.highlightId != null ? 'approved' : 'pending'
  );
  const dispatch = useDispatch<AppDispatch>();

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
  const selectedCompanyId = useMemo(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return storedCompanyId ? Number(storedCompanyId) : undefined;
  }, []);

  const [poCategories, setPoCategories] = useState<CodeDetail[]>([]);

  useEffect(() => {
    const fetchPoCategories = async () => {
      try {
        const details = await CodesAPI.getCodeDetailsByHeader("7");
        setPoCategories(details || []);
      } catch (err) {
        console.error("Failed to fetch PO Categories:", err);
      }
    };
    fetchPoCategories();
  }, []);

  const poCategoryMap = useMemo(() => {
    return poCategories.reduce((acc: Record<number, string>, category: any) => {
      acc[category.id] = category.value;
      return acc;
    }, {}) || {};
  }, [poCategories]);

  // const { deletionStatus: poCanDeleteStatus, deletionErrors: poDeleteErrors, loading: deletionStatusLoading } = useDeletionStatus({
  //   endpoint: '/purchase-orders/',
  //   items: purchaseOrderList,
  //   enabled: purchaseOrderList.length > 0
  // });


  useEffect(() => {
    const listParams: { companyId?: number; fetchAll?: boolean;} = {
      // offset: getOffset(),
      // limit: itemsPerPage
            fetchAll: true,

    };
    if (selectedCompanyId) {
      listParams.companyId = selectedCompanyId;
    }
    dispatch(getAllPurchaseOrders(listParams));
    dispatch(getAllVendors({ fetchAll: true }));
    dispatch(getAllPoTypes({ fetchAll: true }));
    dispatch(getAllPaymentTerms({ fetchAll: true }));
    dispatch(getAllUomMaster({ fetchAll: true }));
  }, [dispatch, location.pathname, currentPage, getOffset, itemsPerPage, selectedCompanyId]);

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

  const getUomName = useCallback((unitValue: any, fallback: string = '') => {
    if (!unitValue) return fallback;
    const uList = Array.isArray(uomList) ? uomList : (uomList as any)?.data || [];
    const foundUom = uList.find((u: any) => String(u.id) === String(unitValue));
    if (foundUom) return foundUom.uomName;
    if (isNaN(Number(unitValue))) return String(unitValue);
    return fallback;
  }, [uomList]);

  const aggregatedData = useMemo(() => {
    return purchaseOrderList.map((order: PurchaseOrder, index: number) => {
      const poTypeNameRaw = poTypeMap[order.poTypeId] || "";
      const isYarnType = poTypeNameRaw.toLowerCase().includes('yarn');
      const isItemType = poTypeNameRaw.toLowerCase().includes('item');
      const vendorName = vendorMap[order.vendorId] || `Vendor ${order.vendorId}`;
      const poTypeName = poTypeNameRaw || `Type ${order.poTypeId}`;

      const updatedInfo = updatedOrders.get(order.id);
      const orderStatus = updatedInfo?.order_status || order.order_status || 'Pending';

      const quantities = order.purchaseOrderItemsDtl
        ?.map((item: any) => item.quantity)
        .filter((q: any) => q != null && q !== '') || [];

      const quantity = quantities.length === 1
        ? quantities[0]
        : quantities.join(', ');

      return {
        ...order,
        order_status: orderStatus,
        serialNo: (paginationInfo?.offset || 0) + index + 1,
        productName: order.purchaseOrderItemsDtl?.map((item: any) => {
          if (isYarnType) return item.yarnName;
          if (isItemType) return item.itemName;
          return (item.fabricCode && item.quality ? `${item.fabricCode}-${item.quality}` : '');
        }).filter(Boolean).join(', ') || '',
        vendorName: vendorName,
        poTypeName: poTypeName,
        poCategoryName: (() => {
          const catId = Number((order as any).poCategoryId);
          if (catId === 399) return 'Work Order';
          if (catId === 398) return 'Purchase Order';
          if (catId === 400) return 'Order Based';
          if (catId === 401) return 'Bulk Order';
          return catId ? (poCategoryMap[catId] || `Category ${catId}`) : '-';
        })(),
        status: order.activeFlag ? "Active" : "Inactive",
        quantity: quantity,
        // Keep original fields for backward compatibility
        vendorId: order.vendorId,
        poTypeId: order.poTypeId
      };
    }).filter((order: any) => {
      const isComplete = (order as any).isComplete === 1 || (order as any).isComplete === true || order.order_status === 'Completed';
      const isApproved = (order as any).isApproved === 1 || (order as any).isApproved === true;

      const matchesSubTab = activeSubTab === 'open' ? !isComplete : isComplete;
      const matchesApproval = approvalStatus === 'pending' ? !isApproved : isApproved;

      return matchesSubTab && matchesApproval;
    });
  }, [purchaseOrderList, poTypeMap, vendorMap, poCategoryMap, paginationInfo?.offset, updatedOrders, activeSubTab, approvalStatus]);

  const containerNames = useMemo(() => {
    return (aggregatedData || []).map((order: any) => `purchase_order_${order.id}`);
  }, [aggregatedData]);

  const { counts: fileCounts, updateCount: updateFileCount } = useFileCounts(containerNames);

  const handleOpenAttachmentModal = useCallback((order: PurchaseOrder) => {
    setSelectedAttachmentContainer(`purchase_order_${order.id}`);
    setAttachmentModalTitle(`Purchase Order #${order.poNo || order.id} Files`);
  }, []);

  const handlePrintPO = useCallback((order: PurchaseOrder) => {
    setSelectedPrintPO(order);
  }, []);

  const handlePrintWO = useCallback((order: PurchaseOrder) => {
    setSelectedPrintWO(order);
  }, []);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatVendorAddress = (vendor: any) => {
    if (!vendor) return '';
    const addr = vendor.address || vendor.vendorAddress || vendor.addressLine1;
    if (!addr) return '';

    if (typeof addr === 'string') {
      return addr;
    }

    if (Array.isArray(addr)) {
      return addr
        .map((a: any) => {
          if (typeof a === 'string') return a;
          if (typeof a === 'object' && a !== null) {
            return [a.line1, a.line2, a.city, a.state, a.pinCode || a.pincode].filter(Boolean).join(', ');
          }
          return '';
        })
        .filter(Boolean)
        .join(', ');
    }

    if (typeof addr === 'object' && addr !== null) {
      const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.pinCode || addr.pincode]
        .filter((p: any) => typeof p === 'string' && p.trim() !== '');
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }

    return '';
  };



  const handleCompleteOrder = useCallback((order: PurchaseOrder) => {
    if (!order) return;
    setCurrentPurchaseOrder(order);
    const { vendorId, ...orderRest } = order;
    setGenericTransactionData({
      transactionTypeId: order.poTypeId || 0,
      vendorId: vendorId || undefined,
      buyerId: undefined,
      ...orderRest
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
        disableGlobalFilter: true // Add this if your DataTable supports it
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
      {
        Header: 'PO No',
        accessor: 'poNo',
        // Make sure this is searchable by default
      },
      {
        Header: 'PO Category',
        accessor: 'poCategoryName',
      },
      {
        Header: 'Supplier/Vendor',
        accessor: 'vendorName', // Change accessor to use the computed vendor name
        Cell: ({ value }: { value: string }) => <span>{value}</span>,
        Filter: ({ column: { filterValue, setFilter } }: any) => (
          <select
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
            className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All</option>
            {vendorList?.map((vendor: any) => (
              <option key={vendor.id} value={vendor.vendorName}>{vendor.vendorName}</option>
            ))}
          </select>
        ),
      },
      {
        Header: 'Purchase Type',
        accessor: 'poTypeName', // Change accessor to use the computed type name
        Cell: ({ value }: { value: string }) => <span>{value}</span>,
        Filter: ({ column: { filterValue, setFilter } }: any) => (
          <select
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
            className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All</option>
            {purchaseOrderTypeList?.map((type: any) => (
              <option key={type.id} value={type.poTypeName}>{type.poTypeName}</option>
            ))}
          </select>
        ),
      },
      {
        Header: 'Product Name',
        accessor: 'productName',
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
      },
      {
        Header: 'Files',
        accessor: 'id',
        disableFilters: true,
        Cell: (props: any) => {
          const { row } = props;
          const containerName = `purchase_order_${row.original.id}`;
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCompleteOrder(row.original);
              }}
              className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
              type="button"
            >
              Re-open
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCompleteOrder(row.original);
              }}
              className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
              type="button"
            >
              Complete
            </button>
          );
        },
      },
      {
        Header: 'Print',
        accessor: 'id_print',
        disableFilters: true,
        Cell: (props: any) => {
          const { row } = props;
          const poTypeName = (row.original.poTypeName || '').toLowerCase();
          const isItemType = poTypeName.includes('item');

          if (!isItemType) {
            return <span className="text-gray-400 font-medium text-xs px-2">-</span>;
          }

          const catId = Number(row.original.poCategoryId);
          const catName = (row.original.poCategoryName || '').toLowerCase();
          const isWorkOrder = catId === 399 || catName.includes('work order') || catName.includes('workorder') || catName.includes('wo');

          if (isWorkOrder) {
            return (
              <button
                type="button"
                onClick={() => handlePrintWO(row.original)}
                className="text-purple-600 hover:text-purple-800 underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> WO Print
              </button>
            );
          }

          return (
            <button
              type="button"
              onClick={() => handlePrintPO(row.original)}
              className="text-blue-600 hover:text-blue-800 underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> PO Print
            </button>
          );
        },
      },

    ],
    [vendorList, purchaseOrderTypeList, poCategoryMap]
  );



  const handleAdd = () => {
    // Check if coming from Order Entry Management with default values
    const state = location.state as any;
    if (state?.fromOrderEntry && state?.salesOrderData) {
      // Navigate with sales order data as state
      navigate("/transaction/purchase-order?purchaseOrderId=0&purchaseOrderItemId=0", {
        state: {
          fromOrderEntry: true,
          salesOrderId: state.salesOrderId,
          salesOrderNo: state.salesOrderNo,
          activeTab: state.activeTab,
          expandedRowId: state.expandedRowId,
          salesOrderData: state.salesOrderData
        }
      });
    } else {
      navigate("/transaction/purchase-order?purchaseOrderId=0&purchaseOrderItemId=0");
    }
  };

  const handleEdit = (order: PurchaseOrder) => {
    console.log("Edit clicked:", order);
    const parentId = order.id;
    const childIds: number[] = [];
    if (order.purchaseOrderItemsDtl) {
      childIds.push(...(order.purchaseOrderItemsDtl as any[]).map(item => item.id).filter(Boolean));
    }

    const queryParams = new URLSearchParams();
    queryParams.set('parentId', String(parentId));
    if (childIds.length > 0) {
      childIds.forEach(childId => queryParams.append('childId', String(childId)));
    }

    navigate(
      `/transaction/purchase-order?${queryParams.toString()}`,
      { state: { order } }
    );
  };

  const handleDelete = (order: PurchaseOrder) => {
    // if (!poCanDeleteStatus[order.id]) {
    //   toast.error('The data is already in use');
    //   return;
    // }

    setCurrentPurchaseOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleView = (order: PurchaseOrder) => {
    setCurrentPurchaseOrder(order);
    setIsViewModalOpen(true);
  };

  const handleSaveOrderStatus = async (
    completionDate: string,
    description: string,
    transactionDataFromModal?: any
  ) => {
    if (!currentPurchaseOrder) return;

    const isReopening = currentPurchaseOrder.order_status === 'Completed' || currentPurchaseOrder.isComplete === 1;
    const transactionStatus = isReopening ? 'Open' : 'Completed';

    const transactionStatusPayload = {
      id: currentPurchaseOrder.id,
      transactionTypeId: 101,
      transactionTypeName: 'purchase-orders',
      primaryTypeId: currentPurchaseOrder.id,
      buyerId: transactionDataFromModal?.buyerId || undefined,
      vendorId: transactionDataFromModal?.vendorId || currentPurchaseOrder.vendorId,
      date: completionDate,
      description: description || '',
      status: transactionStatus,
      isActive: true
    };

    try {
      await TransactionStatusAPI.postTransactionStatus(transactionStatusPayload);

      const isReopening = currentPurchaseOrder.order_status === 'Completed' || currentPurchaseOrder.isComplete === 1;
      // const newStatus = isReopening ? 'Pending' : 'Completed';
      // const newIsComplete = isReopening ? 0 : 1;
      const newStatus = transactionStatus;
      const newIsComplete = isReopening ? 0 : 1;
      // Update the purchase order via API to persist isComplete change
      const companyId = Number(localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'));
      const updatePayload = {
        ...currentPurchaseOrder,
        order_status: newStatus,
        isComplete: newIsComplete,
        completionDate: newIsComplete === 1 ? completionDate : null,
      };

      await dispatch(updatePurchaseOrder({ id: currentPurchaseOrder.id, data: updatePayload, companyId })).unwrap();

      const updatedOrder: PurchaseOrder = {
        ...currentPurchaseOrder,
        order_status: newStatus,
        isComplete: newIsComplete,
        completionDate: completionDate as any,
        description: description as any,
        vendorId: transactionDataFromModal?.vendorId || currentPurchaseOrder.vendorId,
        buyerId: transactionDataFromModal?.buyerId
      } as PurchaseOrder;

      const newUpdatedOrders = new Map(updatedOrders);
      newUpdatedOrders.set(currentPurchaseOrder.id, updatedOrder);
      setUpdatedOrders(newUpdatedOrders);

      toast.success(`Order ${currentPurchaseOrder.poNo} ${isReopening ? 're-opened' : 'marked as completed'}`);

      // Refresh list
      dispatch(getAllPurchaseOrders({
        companyId,
        offset: getOffset(),
        limit: itemsPerPage
      }));
    } catch (error) {
      console.error('Error saving transaction status:', error);
      toast.error('Failed to save transaction status');
    }

    setGenericTransactionData(null);
    setIsOrderStatusModalOpen(false);
  };
  const confirmDelete = async () => {
    if (!currentPurchaseOrder) return;
    try {
      const deleteCompanyId = currentPurchaseOrder.companyId ?? selectedCompanyId;
      await dispatch(deletePurchaseOrder({ id: currentPurchaseOrder.id, companyId: deleteCompanyId })).unwrap();
      resetPage();
      const refreshParams: { offset: number; limit: number; companyId?: number } = { offset: 0, limit: itemsPerPage };
      if (selectedCompanyId) {
        refreshParams.companyId = selectedCompanyId;
      }
      await dispatch(getAllPurchaseOrders(refreshParams));
    } catch (error: any) {
      const backendMessage =
        error?.message ||
        error?.payload?.message ||
        error?.response?.data?.message;
      toast.error(backendMessage || `Unable to delete ${currentPurchaseOrder.poNo}`);
    }
    setIsDeleteModalOpen(false);
  };

  const totalOrders = paginationInfo?.total ?? (Array.isArray(aggregatedData) ? aggregatedData.length : 0);
  const currentOffset = paginationInfo?.offset || 0;
  const displayStart = totalOrders === 0 ? 0 : currentOffset + 1;
  const displayEnd = Math.min(currentOffset + aggregatedData.length, totalOrders);

  return (
    <div>

      <div className="flex gap-4 border-b mb-4">
        <button
          className={`pb-2 px-4 ${activeSubTab === "open" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
          onClick={() => handleSubTabChange("open")}
        >
          Open
        </button>
        <button
          className={`pb-2 px-4 ${activeSubTab === "completed" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
          onClick={() => handleSubTabChange("completed")}
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
        showColumnFilters={true}
        columnFilters={tableColumnFilters}
        onColumnFiltersChange={setTableColumnFilters}
        filterPlaceholder="Search PO No, Vendor, Type, Product..."
        highlightRowId={highlightRowId}
        disableFullDataFetch={true}
        virtualScroll={true}
        virtualScrollHeight="65vh"
        isShowPagination={false}
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

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Purchase Order: ${currentPurchaseOrder?.poNo || ''}`}
        className="max-w-4xl"
      >
        {currentPurchaseOrder && (
          <div className="space-y-6">
            {/* Order Header Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">PO No</p>
                <p className="font-medium">{currentPurchaseOrder.poNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PO Date</p>
                <p className="font-medium">{formatDate(currentPurchaseOrder.poDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Supplier/Vendor</p>
                <p className="font-medium">{vendorMap[currentPurchaseOrder.vendorId] || currentPurchaseOrder.vendorId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PO Type</p>
                <p className="font-medium">{poTypeMap[currentPurchaseOrder.poTypeId] || currentPurchaseOrder.poTypeId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PO Category</p>
                <p className="font-medium">
                  {(currentPurchaseOrder as any).poCategoryId
                    ? (poCategoryMap[(currentPurchaseOrder as any).poCategoryId] || `Category ${(currentPurchaseOrder as any).poCategoryId}`)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tax ID</p>
                <p className="font-medium">{currentPurchaseOrder.taxId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs ${currentPurchaseOrder.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {currentPurchaseOrder.activeFlag ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-3">Order Items</h3>
              {currentPurchaseOrder.purchaseOrderItemsDtl?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentPurchaseOrder.purchaseOrderItemsDtl.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.productCategoryId}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{getUomName(item.unit)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.price}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.netAmount}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {formatDate(item.deliveryDate)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.remarks || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No items found for this purchase order</p>
              )}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete purchase order {currentPurchaseOrder?.poNo}?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </button>
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

      {/* Print styles */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-po-area, #printable-po-area *, #printable-wo-area, #printable-wo-area * {
            visibility: visible !important;
          }
          #printable-po-area, #printable-wo-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 285mm !important;
            height: 285mm !important;
            box-sizing: border-box !important;
            border: none !important;
            padding: 8mm 12mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          table {
            width: 100% !important;
            table-layout: auto !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      {/* Dynamic Purchase Order (PO) Print Modal */}
      {selectedPrintPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Purchase Order Print - {selectedPrintPO.poNo}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-md transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPrintPO(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable PO Template matching real physical copy */}
            <div id="printable-po-area" className="p-6 bg-white border border-gray-300 rounded-lg text-black font-sans text-xs flex flex-col min-h-[280mm] justify-between space-y-4">
              <div className="space-y-4">
                {/* Top Title & Logo */}
                <div className="flex justify-between items-start">
                  <div className="w-1/3"></div>
                  <div className="w-1/3 text-center">
                    <h1 className="text-lg font-bold tracking-wider text-black border-b-2 border-black inline-block pb-0.5 uppercase">PURCHASE ORDER</h1>
                  </div>
                  <div className="w-1/3 text-right">
                    <div className="inline-flex items-center gap-1 text-emerald-800 font-serif font-extrabold text-lg">
                      <span>HAYAGREEVAS</span>
                    </div>
                  </div>
                </div>

                {/* Vendor & PO Meta Info */}
                <div className="flex justify-between items-start pt-1">
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-sm">P.O.No. :{selectedPrintPO.poNo}</p>
                    <p className="pt-1.5 font-bold">To</p>
                    {(() => {
                      const vendor = vendorList?.find((v: any) => Number(v.id) === Number(selectedPrintPO.vendorId));
                      const formattedAddr = formatVendorAddress(vendor);
                      const vendorCityStr = typeof vendor?.city === 'string' ? vendor.city : '';
                      return (
                        <div className="font-semibold text-gray-900 leading-tight">
                          <p className="font-bold text-sm">{vendor?.vendorName || vendorMap[selectedPrintPO.vendorId] || `Vendor #${selectedPrintPO.vendorId}`}</p>
                          {formattedAddr && <p>{formattedAddr}</p>}
                          {vendorCityStr && <p>{vendorCityStr} {typeof vendor?.pincode === 'string' ? vendor.pincode : ''}</p>}
                          <p className="pt-1.5 text-[11px] font-bold">
                            K.Attn: {vendor?.contactPerson || 'Mr.Sakthivel'} / Mobile No. {vendor?.mobile || vendor?.phone || '98429 98989'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs">Date: {formatDateDisplay(selectedPrintPO.poDate)}</p>
                  </div>
                </div>

                <p className="italic text-xs font-medium pt-0.5">Please arrange for the below items at the earliest.</p>

                {/* Items Table */}
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-black">
                      <th className="border border-black px-2 py-1.5 w-10 text-center font-bold">S.No.</th>
                      <th className="border border-black px-3 py-1.5 text-left font-bold">Description</th>
                      <th className="border border-black px-2 py-1.5 w-20 text-center font-bold">Quantity</th>
                      <th className="border border-black px-2 py-1.5 w-24 text-right font-bold">Rate/Unit</th>
                      <th className="border border-black px-2 py-1.5 w-20 text-center font-bold">Discount %</th>
                      <th className="border border-black px-2 py-1.5 w-28 text-right font-bold">Rate/Unit after Discount</th>
                      <th className="border border-black px-3 py-1.5 w-32 text-right font-bold">Total Exmill Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrintPO.purchaseOrderItemsDtl && selectedPrintPO.purchaseOrderItemsDtl.length > 0 ? (
                      selectedPrintPO.purchaseOrderItemsDtl.map((item: any, idx: number) => {
                        const qty = Number(item.quantity || 1);
                        const price = Number(item.price || 0);
                        const discVal = Number(item.discountValue || item.discountPercent || 0);
                        const discType = item.discountType || 'Percentage';
                        let discAmt = Number(item.discountAmount || 0);

                        if (!discAmt && price > 0 && discVal > 0) {
                          if (discType === 'Amount' || discType === '₹') {
                            discAmt = discVal;
                          } else {
                            discAmt = (price * discVal) / 100;
                          }
                        }

                        let discDisplayPercent = 0;
                        if ((discType === 'Amount' || discType === '₹') && price > 0) {
                          discDisplayPercent = Number(((discAmt / price) * 100).toFixed(2));
                        } else {
                          discDisplayPercent = discVal;
                        }

                        const discountedPrice = item.netPricePerUnit !== undefined && item.netPricePerUnit !== null
                          ? Number(item.netPricePerUnit)
                          : Math.max(0, price - discAmt);

                        const lineTotal = item.netAmount !== undefined && item.netAmount !== null
                          ? Number(item.netAmount)
                          : (qty * discountedPrice);

                        const desc = item.itemName || item.yarnName || (item.fabricCode && item.quality ? `${item.fabricCode}-${item.quality}` : '') || item.remarks || `Item ${idx + 1}`;

                        return (
                          <tr key={idx} className="border-b border-black">
                            <td className="border border-black px-2 py-2 text-center font-medium">{idx + 1}</td>
                            <td className="border border-black px-3 py-2 font-medium">{desc}</td>
                            <td className="border border-black px-2 py-2 text-center font-medium">{qty} {getUomName(item.unit, 'No.')}</td>
                            <td className="border border-black px-2 py-2 text-right">Rs. {price.toFixed(2)}</td>
                            <td className="border border-black px-2 py-2 text-center">{discDisplayPercent}%</td>
                            <td className="border border-black px-2 py-2 text-right">Rs. {discountedPrice.toFixed(2)}</td>
                            <td className="border border-black px-3 py-2 text-right font-bold">Rs. {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="border border-black px-4 py-4 text-center text-gray-500 italic">No items listed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* 2-Column Section matching real physical copy media_1790585968701.jpg */}
                {/* Left side: Invoice & Delivery Address + Note */}
                {/* Right side: Subtotals Box + Signature */}
                <div className="grid grid-cols-12 gap-4 pt-1 items-start">
                  <div className="col-span-7 space-y-3">
                    <div>
                      <p className="font-bold text-xs underline">Invoice & Delivery Address :</p>
                      <p className="font-semibold pt-0.5">HAYAGREEVAS FABRICS PVT. LTD.,</p>
                      <p>S.F. No.: 193, P. Vadugapalayam,</p>
                      <p>Pollachi Road, Palladam 641664.</p>
                      <p className="text-[11px] font-bold text-gray-800 pt-0.5">(Palladam Factory Contact: Mr.A. Deepak Kumar +91 98430 72464)</p>
                    </div>
                    {(() => {
                      const poNote = selectedPrintPO.note || selectedPrintPO.purchaseOrderItemsDtl?.find((item: any) => item.note && String(item.note).trim() !== '')?.note;
                      if (poNote && String(poNote).trim() !== '') {
                        const noteLines = String(poNote).split('\n');
                        return (
                          <div className="space-y-0.5 text-[11px]">
                            <p className="font-bold text-xs underline">Note:</p>
                            {noteLines.map((line: string, lIdx: number) => (
                              <p key={lIdx}>{line}</p>
                            ))}
                          </div>
                        );
                      }

                      const vendor = vendorList?.find((v: any) => Number(v.id) === Number(selectedPrintPO.vendorId));
                      const paymentTermObj = paymentTermsList?.find((pt: any) => Number(pt.id) === Number(vendor?.paymentTermsId));
                      const rawTermName = paymentTermObj?.termName || paymentTermObj?.description || '';

                      let paymentText = 'Payment term -- 30 days.';
                      if (rawTermName) {
                        const lower = rawTermName.toLowerCase();
                        if (lower.startsWith('payment')) {
                          paymentText = rawTermName;
                        } else if (lower.startsWith('within')) {
                          paymentText = `Payment ${rawTermName}`;
                        } else {
                          paymentText = `Payment term -- ${rawTermName}`;
                        }
                        if (!paymentText.endsWith('.')) {
                          paymentText += '.';
                        }
                      }

                      const performaNos: string[] = [];
                      if (selectedPrintPO.purchaseOrderItemsDtl) {
                        selectedPrintPO.purchaseOrderItemsDtl.forEach((item: any) => {
                          const p = (item.performaNo || item.proformaNo || '').trim();
                          if (p && !performaNos.includes(p)) {
                            performaNos.push(p);
                          }
                        });
                      }
                      const performaNoStr = performaNos.length > 0 ? performaNos.join(' & ') : 'G143';

                      return (
                        <div className="space-y-0.5 text-[11px]">
                          <p className="font-bold text-xs underline">Note:</p>
                          <p>1 As per your P.I. No. {performaNoStr}, dated {formatDateDisplay(selectedPrintPO.poDate)}.</p>
                          <p>2 Delivery -- Ready delivery.</p>
                          <p>3 {paymentText}</p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="col-span-5 flex flex-col items-end space-y-6">
                    {/* Subtotals Box */}
                    {(() => {
                      const items = selectedPrintPO.purchaseOrderItemsDtl || [];
                      const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.netAmount || ((item.quantity || 1) * (item.price || 0))), 0);
                      const totalPF = items.reduce((sum: number, item: any) => sum + Number(item.packingAndForwarding || 0), 0);
                      const totalOthers = items.reduce((sum: number, item: any) => sum + Number(item.others || 0), 0);
                      const gstAmount = items.reduce((sum: number, item: any) => sum + Number(item.gstAmount || 0), 0) || Math.round(subtotal * 0.18);
                      const totalWithGst = items.reduce((sum: number, item: any) => sum + Number(item.finalAmount || 0), 0) || (subtotal + gstAmount);

                      return (
                        <table className="w-full border-collapse border border-black text-xs font-semibold">
                          <tbody>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 text-left border-r border-black font-semibold">Subtotal</td>
                              <td className="px-2 py-1 text-right font-bold">Rs. {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 text-left border-r border-black font-semibold">Forwarding charges</td>
                              <td className="px-2 py-1 text-right font-bold">Rs. {totalPF.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 text-left border-r border-black font-bold">ADD: GST @ 18%</td>
                              <td className="px-2 py-1 text-right font-bold">Rs. {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 text-left border-r border-black font-semibold">Others</td>
                              <td className="px-2 py-1 text-right font-bold">Rs. {totalOthers.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="px-2 py-1 text-left border-r border-black font-extrabold text-xs">Total Value</td>
                              <td className="px-2 py-1 text-right font-extrabold text-xs">Rs. {totalWithGst.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                            </tr>
                          </tbody>
                        </table>
                      );
                    })()}

                    {/* Signature Section */}
                    <div className="text-right space-y-10 pt-8 w-full">
                      <p className="font-bold text-xs">for HAYAGREEVAS FABRICS PRIVATE LIMITED,</p>
                      <div className="pt-6">
                        <p className="font-bold text-sm inline-block pt-1 px-4">Managing Director</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Company Footer Block Pinned to Page Bottom */}
              <div className="mt-auto pt-4 space-y-2">
                <div className="pt-2 text-[10px] space-y-1">
                  <h4 className="text-xl font-extrabold tracking-wider text-black uppercase  border-b-2 border-black">HAYAGREEVAS FABRICS PRIVATE LIMITED</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold">Factory :</p>
                      <p>S.F. No. 193, P.Vadugapalayam, Pollachi Road, Palladam - 641 664, Tirupur District.</p>
                      <p>Phone : 04255 - 251903 E-mail : works@hayagreevas.com</p>
                      <p>GSTIN : 33AACCH7673P1Z0 &nbsp; PAN : AACCH7673P &nbsp; CIN : U51310TZ2011PTC017510</p>
                    </div>
                    <div>
                      <p className="font-bold">Head Office :</p>
                      <p>Amarjothi Apartments, No. 106 – A1 (Old No.93), Bhashyakaralu Road West, R.S.Puram, Coimbatore 641002. INDIA</p>
                      <p>Tel : +91 422 2541336, E-mail : info@hayagreevas.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Work Order (WO) Print Modal */}
      {selectedPrintWO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-600" />
                Work Order Print - {selectedPrintWO.poNo}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-md transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPrintWO(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable WO Template matching real copy */}
            <div id="printable-wo-area" className="p-6 bg-white border border-gray-300 rounded-lg text-black font-sans text-xs flex flex-col min-h-[280mm] justify-between space-y-4">
              <div className="space-y-4">
                {/* Top Title & Logo */}
                <div className="flex justify-between items-start">
                  <div className="w-1/3"></div>
                  <div className="w-1/3 text-center">
                    <h1 className="text-lg font-bold tracking-wider text-black border-b-2 border-black inline-block pb-0.5 uppercase">WORK ORDER</h1>
                  </div>
                  <div className="w-1/3 text-right">
                    <div className="inline-flex items-center gap-1 text-emerald-800 font-serif font-extrabold text-lg">
                      <span>HAYAGREEVAS</span>
                    </div>
                  </div>
                </div>

                {/* Vendor & WO Meta Info */}
                <div className="flex justify-between items-start pt-1">
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-sm">W.O.No.: {selectedPrintWO.poNo}</p>
                    <p className="pt-1.5 font-bold">To</p>
                    {(() => {
                      const vendor = vendorList?.find((v: any) => Number(v.id) === Number(selectedPrintWO.vendorId));
                      const formattedAddr = formatVendorAddress(vendor);
                      const vendorCityStr = typeof vendor?.city === 'string' ? vendor.city : '';
                      return (
                        <div className="font-semibold text-gray-900 leading-tight">
                          <p className="font-bold text-sm">{vendor?.vendorName || vendorMap[selectedPrintWO.vendorId] || `Vendor #${selectedPrintWO.vendorId}`}</p>
                          {formattedAddr && <p>{formattedAddr}</p>}
                          {vendorCityStr && <p>{vendorCityStr} {typeof vendor?.pincode === 'string' ? vendor.pincode : ''}</p>}
                          <p className="pt-1.5 text-[11px] font-bold">
                            K.Attn: {vendor?.contactPerson || 'Mr.Manavalan & Mr.Shibi Chakaravarthy'} / Mobile No. {vendor?.mobile || vendor?.phone || '9842229671 / 9994985381'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs">Date: {formatDateDisplay(selectedPrintWO.poDate)}</p>
                  </div>
                </div>

                <p className="italic text-xs font-medium pt-0.5">Please arrange for the below items at the earliest.</p>

                {/* Items Table */}
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-black">
                      <th className="border border-black px-2 py-1.5 w-10 text-center font-bold">S.No.</th>
                      <th className="border border-black px-3 py-1.5 text-left font-bold">Description</th>
                      <th className="border border-black px-2 py-1.5 w-20 text-center font-bold">Quantity</th>
                      <th className="border border-black px-2 py-1.5 w-24 text-right font-bold">Rate/Unit</th>
                      <th className="border border-black px-2 py-1.5 w-20 text-center font-bold">Discount %</th>
                      <th className="border border-black px-2 py-1.5 w-28 text-right font-bold">Rate/Unit after Discount</th>
                      <th className="border border-black px-3 py-1.5 w-32 text-right font-bold">Total Exmill Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrintWO.purchaseOrderItemsDtl && selectedPrintWO.purchaseOrderItemsDtl.length > 0 ? (
                      selectedPrintWO.purchaseOrderItemsDtl.map((item: any, idx: number) => {
                        const qty = Number(item.quantity || 1);
                        const price = Number(item.price || 0);
                        const discVal = Number(item.discountValue || item.discountPercent || 0);
                        const discType = item.discountType || 'Percentage';
                        let discAmt = Number(item.discountAmount || 0);

                        if (!discAmt && price > 0 && discVal > 0) {
                          if (discType === 'Amount' || discType === '₹') {
                            discAmt = discVal;
                          } else {
                            discAmt = (price * discVal) / 100;
                          }
                        }

                        let discDisplayPercent = 0;
                        if ((discType === 'Amount' || discType === '₹') && price > 0) {
                          discDisplayPercent = Number(((discAmt / price) * 100).toFixed(2));
                        } else {
                          discDisplayPercent = discVal;
                        }

                        const discountedPrice = item.netPricePerUnit !== undefined && item.netPricePerUnit !== null
                          ? Number(item.netPricePerUnit)
                          : Math.max(0, price - discAmt);

                        const lineTotal = item.netAmount !== undefined && item.netAmount !== null
                          ? Number(item.netAmount)
                          : (qty * discountedPrice);

                        const desc = item.itemName || item.yarnName || (item.fabricCode && item.quality ? `${item.fabricCode}-${item.quality}` : '') || item.remarks || `Service item ${idx + 1}`;

                        return (
                          <tr key={idx} className="border-b border-black">
                            <td className="border border-black px-2 py-2 text-center font-medium">{idx + 1}</td>
                            <td className="border border-black px-3 py-2 font-medium">{desc}</td>
                            <td className="border border-black px-2 py-2 text-center font-medium">{qty} {getUomName(item.unit, 'LS')}</td>
                            <td className="border border-black px-2 py-2 text-right">Rs. {price.toFixed(2)}</td>
                            <td className="border border-black px-2 py-2 text-center">{discDisplayPercent}%</td>
                            <td className="border border-black px-2 py-2 text-right">Rs. {discountedPrice.toFixed(2)}</td>
                            <td className="border border-black px-3 py-2 text-right font-bold">Rs. {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="border border-black px-4 py-4 text-center text-gray-500 italic">No work items listed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* 2-Column Section matching real physical copy media_1790585968701.jpg */}
                <div className="grid grid-cols-12 gap-4 pt-1 items-start">
                  <div className="col-span-7 space-y-3">
                    <div>
                      <p className="font-bold text-xs underline">Invoice & Delivery Address :</p>
                      <p className="font-semibold pt-0.5">HAYAGREEVAS FABRICS PVT. LTD.,</p>
                      <p>S.F. No.: 193, P. Vadugapalayam,</p>
                      <p>Pollachi Road, Palladam 641664.</p>
                      <p className="text-[11px] font-bold text-gray-800 pt-0.5">(Palladam Factory Contact: Mr. A. Deepak Kumar +91 98430 72464)</p>
                    </div>
                    <div className="space-y-0.5 text-[11px]">
                      <p className="font-bold text-xs underline">Terms:</p>
                      <p>1 As per your service offer dated {formatDateDisplay(selectedPrintWO.poDate)}.</p>
                    </div>
                  </div>

                  <div className="col-span-5 flex flex-col items-end space-y-6">
                    {/* Subtotals Box */}
                    {(() => {
                      const items = selectedPrintWO.purchaseOrderItemsDtl || [];
                      const subtotal = items.reduce((sum: number, item: any) => sum + (item.netAmount || ((item.quantity || 1) * (item.price || 0))), 0);
                      const gstRate = 18;
                      const gstAmount = Math.round(subtotal * (gstRate / 100));
                      const totalWithGst = subtotal + gstAmount;

                      return (
                        <table className="w-full border-collapse border border-black text-xs font-semibold">
                          <tbody>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 text-left border-r border-black font-semibold">Subtotal</td>
                              <td className="px-2 py-1 text-right font-bold">Rs. {subtotal.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 text-left border-r border-black font-semibold">Forwarding charges</td>
                              <td className="px-2 py-1 text-right font-bold">Rs. 0</td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 text-left border-r border-black font-bold">ADD: GST @ {gstRate}%</td>
                              <td className="px-2 py-1 text-right font-bold">Rs. {gstAmount.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 text-left border-r border-black font-semibold">Others</td>
                              <td className="px-2 py-1 text-right font-bold">Rs. 0</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="px-2 py-1 text-left border-r border-black font-extrabold text-xs">Total Value</td>
                              <td className="px-2 py-1 text-right font-extrabold text-xs">Rs. {totalWithGst.toLocaleString('en-IN')}</td>
                            </tr>
                          </tbody>
                        </table>
                      );
                    })()}

                    {/* Signature Section */}
                    <div className="text-right space-y-8 pt-2 w-full">
                      <p className="font-bold text-xs">for HAYAGREEVAS FABRICS PRIVATE LIMITED,</p>
                      <div className="pt-6">
                        <p className="font-extrabold text-sm border-t border-black inline-block pt-1 px-4">Managing Director</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Company Footer Block Pinned to Page Bottom */}
              <div className="mt-auto pt-4 space-y-2">
                <div className="pt-2 border-t-2 border-black text-[10px] space-y-1">
                  <h4 className="font-extrabold text-xs tracking-wider text-black">HAYAGREEVAS FABRICS PRIVATE LIMITED</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold">Factory :</p>
                      <p>S.F. No. 193, P.Vadugapalayam, Pollachi Road, Palladam - 641 664, Tirupur District.</p>
                      <p>Phone : 04255 - 251903 E-mail : works@hayagreevas.com</p>
                      <p>GSTIN : 33AACCH7673P1Z0 &nbsp; PAN : AACCH7673P &nbsp; CIN : U51310TZ2011PTC017510</p>
                    </div>
                    <div>
                      <p className="font-bold">Head Office :</p>
                      <p>Amarjothi Apartments, No. 106 – A1 (Old No.93), Bhashyakaralu Road West, R.S.Puram, Coimbatore 641002. INDIA</p>
                      <p>Tel : +91 422 2541336, E-mail : info@hayagreevas.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}