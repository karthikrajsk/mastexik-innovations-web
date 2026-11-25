import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { AppDispatch, RootState } from "@/state/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteSizingJobWorkOrder, getAllSizingJobWorkOrders, getAllSizingJobWorkOrdersByFactoryCompanyId, getSizingJobWorkOrderById, updateSizingJobWorkOrder } from "@/state/sizingJobWorkOrderSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { API_ORIGIN } from "@/services/ApiService";
import { Edit, Eye, Loader2, PencilLine, Printer, Trash2 } from "lucide-react";
import { OrderStatusModal } from "@/components/ui/OrderStatusModal";
import { TransactionStatusAPI } from "@/services/transaction-status-api";
import { toast } from "react-toastify";

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const hasValue = (value: unknown) => value !== undefined && value !== null && `${value}`.trim() !== "";

export function SizingJobWorkOrderDetails() {
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

  const { sizingJobWorkOrderList: list, paginationInfo, loading } = useSelector((s: RootState) => s.sizingJobWorkOrder);
  const customerList = useSelector((s: RootState) => s.customer.customerList);
  const consigneeList = useSelector((s: RootState) => s.consignee.consigneeList);
  const fabricMasterList = useSelector((s: RootState) => s.fabricMaster.fabricMasterList);
  const weavingContractList = useSelector((s: RootState) => s.weavingContracts.weavingContractList);
  const companyMasterList = useSelector((s: RootState) => (s as any).companyMaster.companyMasterList);
  const sizingPlanList = useSelector((s: RootState) => (s as any).sizingPlan?.sizingPlanList);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const reportBaseUrl = useMemo(() => {
    if (API_ORIGIN) return API_ORIGIN.replace(/\/$/, "");
    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return "";
  }, []);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [loggedUserName, setLoggedUserName] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<{ id: number; action: "view" | "edit" } | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'open' | 'completed'>('open');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('pending');
  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [genericTransactionData, setGenericTransactionData] = useState<any>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const selectedCompanyId = useMemo(() => {
    const storedCompanyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    return storedCompanyId ? Number(storedCompanyId) : null;
  }, []);

  const closeViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setViewRecord(null);
  }, []);

  useEffect(() => {
    const params = {
      offset: getOffset(),
      limit: itemsPerPage
    };
    if (selectedCompanyId) {
      dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: selectedCompanyId, fetchAll: true }) as any);
    } else {
      dispatch(getAllSizingJobWorkOrders({ fetchAll: true }) as any);
    }
  }, [dispatch, selectedCompanyId, currentPage, getOffset, itemsPerPage]);

  useEffect(() => {
    try {
      const payload = localStorage.getItem("authPayload");
      if (payload) {
        const parsed = JSON.parse(payload);
        const name = parsed?.user?.userName || parsed?.user?.name || "";
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
    if (!weavingContractList?.length) {
      dispatch(getAllWeavingContract({ fetchAll: true } as any));
    }
    if (!(companyMasterList as any)?.length) {
      dispatch(getAllCompanies({} as any));
    }
    if (!sizingPlanList?.length) {
      dispatch(getAllSizingPlan({ fetchAll: true } as any));
    }
  }, [
    dispatch,
    customerList?.length,
    consigneeList?.length,
    fabricMasterList?.length,
    weavingContractList?.length,
    (companyMasterList as any)?.length,
    sizingPlanList?.length,
  ]);

  const orders = useMemo(() => toArray(list), [list]);
  const customers = useMemo(() => toArray(customerList), [customerList]);
  const consignees = useMemo(() => toArray(consigneeList), [consigneeList]);
  const companies = useMemo(() => toArray(companyMasterList), [companyMasterList]);
  const plans = useMemo(() => toArray(sizingPlanList), [sizingPlanList]);
  const viewItems = useMemo(() => toArray(viewRecord?.items), [viewRecord]);

  const customerMap = useMemo(
    () =>
      new Map(
        customers.map((customer: any) => [String(customer.id), customer.customerName || customer.name || customer.companyName || "-"])
      ),
    [customers]
  );

  const consigneeMap = useMemo(
    () =>
      new Map(
        consignees.map((consignee: any) => [String(consignee.id), consignee.consigneeName || consignee.name || "-"])
      ),
    [consignees]
  );

  const companyMap = useMemo(() => {
    const arr = Array.isArray(companies) ? companies : [];
    return new Map(arr.map((c: any) => [String(c.id), c.companyName || c.name || "-"]));
  }, [companies]);

  const planMap = useMemo(
    () =>
      new Map(
        plans.map((plan: any) => [String(plan.id), plan.sizingPlanNo || plan.planNo || plan.sizingPlanNumber || `Plan ${plan.id}`])
      ),
    [plans]
  );

  const viewBuyerDisplay = useMemo(() => {
    if (!viewRecord) return "-";
    if (Number(viewRecord.orderTypeId) === 1) {
      return companyMap.get(String(viewRecord.tradingCompanyId)) || viewRecord.buyerName || "-";
    }
    return viewRecord.buyerName || customerMap.get(String(viewRecord.buyerId)) || "-";
  }, [viewRecord, companyMap, customerMap]);

  const viewConsigneeDisplay = useMemo(() => {
    if (!viewRecord) return "-";
    return viewRecord.consigneeName || consigneeMap.get(String(viewRecord.consigneeId)) || "-";
  }, [viewRecord, consigneeMap]);

  const viewPlanDisplay = useMemo(() => {
    if (!viewRecord) return "-";
    return viewRecord.sizingPlanNo || planMap.get(String(viewRecord.sizingPlanId)) || "-";
  }, [viewRecord, planMap]);

  const viewOrderTypeLabel = useMemo(() => {
    if (!viewRecord) return "-";
    return Number(viewRecord.orderTypeId) === 1 ? "Internal" : "External";
  }, [viewRecord]);

  const viewOrderDate = useMemo(() => {
    if (!viewRecord?.orderDate) return "-";
    return String(viewRecord.orderDate).slice(0, 10);
  }, [viewRecord]);

  const processed = useMemo(() => {
    return orders
      .filter((row: any) => {
        const isComplete = row.isComplete === 1 || row.isComplete === true || row.order_status === "Completed";
        const isApproved = row.isApproved === 1 || row.isApproved === true;

        const matchesSubTab = activeSubTab === "open" ? !isComplete : isComplete;
        const matchesApproval = approvalStatus === "pending" ? !isApproved : isApproved;

        return matchesSubTab && matchesApproval;
      })
      .map((row: any, idx: number) => {
        const items = toArray(row.items);
        const yarnNames = items
          .map((item: any) => item.yarnName || item.yarn?.yarnName || item.yarn?.name || `Yarn ${item.yarnId}`)
          .filter(Boolean);
        const uniqueYarnNames = Array.from(new Set(yarnNames));
        const totalEnds = items.reduce((sum: number, item: any) => sum + toNumber(item.totalEnds ?? item.actualWarpEnds ?? 0), 0);
        const quantityFromItems = items.reduce(
          (sum: number, item: any) => sum + toNumber(item.warpMeters ?? item.quantity ?? item.plannedQuantity ?? 0),
          0
        );
        const fallbackQuantity = toNumber(row.totalQuantity ?? row.orderQuantity ?? row.quantity ?? row.plannedQuantity);
        const planNo = row.sizingPlanNo || row.planNo || planMap.get(String(row.sizingPlanId)) || "-";
        let buyerName = row.buyerName || customerMap.get(String(row.buyerId)) || consigneeMap.get(String(row.consigneeId)) || "-";
        if (Number(row.orderTypeId) === 1) {
          buyerName = companyMap.get(String(row.tradingCompanyId)) || buyerName;
        }
        return {
          ...row,
          serialNo: (paginationInfo?.offset || 0) + idx + 1,
          orderDateDisplay: row.orderDate ? String(row.orderDate).slice(0, 10) : "-",
          orderTypeLabel: Number(row.orderTypeId) === 1 ? "Internal" : "External",
          buyerDisplay: buyerName || "-",
          sizingOrderNo:
            row.sizingWorkOrderNo ||
            "-",
          sizingPlanNoDisplay: planNo,
          yarnNames: uniqueYarnNames,
          totalEndsDisplay: totalEnds,
          quantityDisplay: quantityFromItems || fallbackQuantity,
        };
      });
  }, [orders, customerMap, consigneeMap, companyMap, planMap, activeSubTab, approvalStatus]);

  const handleAdd = useCallback(() => navigate("/transaction/sizing-jobwork-order"), [navigate]);
  const handleView = useCallback(async (row: any) => {
    if (!row) return;
    const openModalWith = (record: any) => {
      setViewRecord(record);
      setIsViewModalOpen(true);
    };
    const recordId = row.id;
    if (!recordId) {
      openModalWith(row);
      return;
    }
    try {
      setActionLoading({ id: recordId, action: "view" });
      const response: any = await dispatch(getSizingJobWorkOrderById(recordId) as any);
      const record = response?.payload?.data || response?.payload || row;
      openModalWith(record);
    } catch {
      openModalWith(row);
    } finally {
      setActionLoading(null);
    }
  }, [dispatch]);
  const handleEdit = useCallback(async (row: any) => {
    if (!row) return;
    const recordId = row.id;
    if (!recordId) {
      navigate("/transaction/sizing-jobwork-order", { state: { jobWorkOrder: row } });
      return;
    }
    try {
      setActionLoading({ id: recordId, action: "edit" });
      const response: any = await dispatch(getSizingJobWorkOrderById(recordId) as any);
      const record = response?.payload?.data || response?.payload || row;
      navigate("/transaction/sizing-jobwork-order", { state: { jobWorkOrder: record } });
    } catch {
      navigate("/transaction/sizing-jobwork-order", { state: { jobWorkOrder: row } });
    } finally {
      setActionLoading(null);
    }
  }, [dispatch, navigate]);
  const handleDelete = useCallback((row: any) => {
    setCurrentId(row.id ?? null);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCompleteOrder = useCallback((order: any) => {
    if (!order) return;
    setCurrentOrder(order);
    setGenericTransactionData({
      transactionTypeId: 132, // Example ID for Sizing Job Work Order
      vendorId: undefined,
      buyerId: order.buyerId || order.tradingCompanyId,
      ...order
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
      transactionTypeName: 'sizing-jobwork-orders',
      primaryTypeId: currentOrder.id,
      buyerId: transactionDataFromModal?.buyerId || currentOrder.buyerId || currentOrder.tradingCompanyId,
      vendorId: transactionDataFromModal?.vendorId || undefined,
      date: completionDate,
      description: description || '',
      status: transactionStatus,
      isActive: true
    };

    try {
      await TransactionStatusAPI.postTransactionStatus(transactionStatusPayload);

      const isReopening = currentOrder.order_status === 'Completed' || currentOrder.isComplete === 1;
      // const newStatus = isReopening ? 'Pending' : 'Completed';
      // const newIsComplete = isReopening ? 0 : 1;
      const newStatus = transactionStatus;
      const newIsComplete = isReopening ? 0 : 1;
      const storedCompanyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
      const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : undefined;

      await dispatch(updateSizingJobWorkOrder({
        id: currentOrder.id,
        data: { ...currentOrder, order_status: newStatus, isComplete: newIsComplete },
        factoryCompanyId
      }) as any);

      toast.success(`Order ${isReopening ? 're-opened' : 'completed'} successfully`);
      setIsOrderStatusModalOpen(false);

      // Refresh list
      const params = {
        offset: getOffset(),
        limit: itemsPerPage
      };
      if (factoryCompanyId) {
        dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId, ...params }) as any);
      } else {
        dispatch(getAllSizingJobWorkOrders(params) as any);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update order status");
    }
  };

  const handleQuantityClick = useCallback((row: any) => handleEdit(row), [handleEdit]);

  const handlePrint = useCallback(
    (row: any) => {
      if (row?.printUrl) {
        window.open(row.printUrl, "_blank", "noopener");
        return;
      }
      if (row?.id) {
        const base = reportBaseUrl || "";
        const target = `${base}/reports/sizing-jobwork-orders/${row.id}`;
        window.open(target, "_blank", "noopener");
        return;
      }
      window.print();
    },
    [reportBaseUrl]
  );

  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: "serialNo", width: 50, disableFilters: true },
      {
        Header: "Order Date", accessor: "orderDateDisplay", Cell: ({ value }: { value: string }) => {
          if (!value) return 'N/A';
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
        Filter: DateRangeFilter,
      },
      { Header: "Sizing Order No", accessor: "sizingOrderNo" },

      { Header: "Order Type", accessor: "orderTypeLabel" },
      { Header: "Buyer", accessor: "buyerDisplay" },
      { Header: "Sizing Plan No", accessor: "sizingPlanNoDisplay" },

      {
        Header: "Yarn Name",
        accessor: "yarnNames",
        Cell: ({ row }: any) => {
          const record = row?.original ?? row ?? {};
          const rawNames = record.yarnNames;
          const namesArray = Array.isArray(rawNames) ? rawNames : rawNames ? [rawNames] : [];
          if (namesArray.length) {
            return <span className="text-sm text-slate-700">{namesArray.join(", ")}</span>;
          }
          const fallbackItems = toArray(record.items);
          const fallbackNames = fallbackItems
            .map((item: any) => item.yarnName || item.yarn?.yarnName || item.yarn?.name || (item.yarnId ? `Yarn ${item.yarnId}` : ""))
            .filter(Boolean);
          if (!fallbackNames.length) return "-";
          const uniqueFallback = Array.from(new Set(fallbackNames));
          return <span className="text-sm text-slate-700">{uniqueFallback.join(", ")}</span>;
        },
      },
      {
        Header: "Total Ends",
        accessor: "totalEndsDisplay",
        Cell: ({ value }: { value: number }) => (Number(value || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
      },
      {
        Header: "Quantity",
        accessor: "quantityDisplay",
        // Cell: ({ value, row }: any) => (
        //   <button
        //     type="button"
        //     className="inline-flex items-center gap-2 font-semibold text-blue-600 underline"
        //     onClick={() => handleQuantityClick(row.original)}
        //   >
        //     {Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        //     <Edit3 className="h-4 w-4" />
        //   </button>
        // ),
      },
      // {
      {
        Header: "Order Status",
        accessor: "order_status",
        Cell: ({ row }: any) => {
          const record = row?.original ?? row;
          const isComplete = record.isComplete === 1 || record.isComplete === true || record.order_status === "Completed";
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCompleteOrder(record);
              }}
              className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
              type="button"
            >
              {isComplete ? "Re-open" : "Complete"}
            </button>
          );
        },
      },
      {
        Header: "Action",
        accessor: "action",
        Cell: ({ row }: any) => {
          const record = row?.original ?? row;
          const recordId = record?.id ?? null;
          const viewBusy = recordId != null && actionLoading?.id === recordId && actionLoading?.action === "view";
          const editBusy = recordId != null && actionLoading?.id === recordId && actionLoading?.action === "edit";

          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-blue-600 transition hover:border-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => handleView(record)}
                title="View"
                disabled={viewBusy}
              >
                {viewBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="rounded-lg border border-amber-100 bg-amber-50/60 p-2 text-amber-600 transition hover:border-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => handleEdit(record)}
                title="Edit"
                disabled={editBusy}
              >
                {editBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary transition hover:border-primary/50"
                onClick={() => handlePrint(record)}
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
                onClick={() => handleDelete(record)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
        disableFilters: true,
      },
    ],
    [actionLoading, handleView, handleEdit, handlePrint, handleDelete, handleQuantityClick, handleCompleteOrder]
  );

  const confirmDelete = useCallback(async () => {
    if (currentId == null) return;
    const params = {
      offset: getOffset(),
      limit: itemsPerPage
    };
    if (selectedCompanyId) {
      await dispatch(
        deleteSizingJobWorkOrder({ id: currentId, factoryCompanyId: selectedCompanyId } as any)
      );
      dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: selectedCompanyId, fetchAll: true }) as any);
    } else {
      await dispatch(deleteSizingJobWorkOrder(currentId as any));
      dispatch(getAllSizingJobWorkOrders({ fetchAll: true }) as any);
    }
    setIsDeleteModalOpen(false);
  }, [currentId, dispatch, selectedCompanyId, getOffset, itemsPerPage]);

  const totalOrders = paginationInfo?.total || 0;
  const currentOffset = paginationInfo?.offset || 0;
  const displayStart = totalOrders === 0 ? 0 : currentOffset + 1;
  const displayEnd = Math.min(currentOffset + list.length, totalOrders);

  return (
    <div className="p-6 pt-16">
      {/* <h1 className="text-[20px] font-semibold text-slate-800 tracking-tight pb-3">
              Sizing Job Work Orders
            </h1>

      <div className="mb-4 flex items-center justify-between">
        
      </div> */}

      <div className="flex gap-4 border-b mb-4">
        <button
          className={`pb-2 px-4 ${activeSubTab === "open" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
          onClick={() => setActiveSubTab("open")}
        >
          Open
        </button>
        <button
          className={`pb-2 px-4 ${activeSubTab === "completed" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
          onClick={() => setActiveSubTab("completed")}
        >
          Completed
        </button>
      </div>
      <DataTable
        columns={columns}
        data={processed}
        title="Sizing Job Work Orders Details"
        onAdd={handleAdd}
        onPending={() => setApprovalStatus("pending")}
        onApproved={() => setApprovalStatus("approved")}
        activeTab={approvalStatus}
        showActions={false}
        showColumnFilters={true}
        filterPlaceholder="Search orders..."
        disableFullDataFetch={true}
      //   initialPageSize={itemsPerPage}
      // onPageSizeChange={setItemsPerPage}
      //    totalCount={paginationInfo?.total || 0}
      // currentPage={currentPage}
      // onPageChange={handlePageChange}
      />

      {/* <Pagination
        currentPage={currentPage}
        totalItems={paginationInfo?.total || 0}
        itemsPerPage={itemsPerPage}
        offset={paginationInfo?.offset || 0}
        hasNext={!!paginationInfo?.next}
        hasPrev={!!paginationInfo?.prev}
        onPageChange={handlePageChange}
      /> */}

      <OrderStatusModal
        isOpen={isOrderStatusModalOpen}
        onClose={() => setIsOrderStatusModalOpen(false)}
        transactionData={genericTransactionData}
        onSave={handleSaveOrderStatus}
      />

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete this Job Work Order?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        title="Sizing Job Work Order"
        className="w-full max-w-5xl"
      >
        {viewRecord ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order No</p>
                <p className="text-sm font-semibold text-slate-900">
                  {viewRecord.sizingWorkOrderNo || viewRecord.sizingJobWorkOrderNo || viewRecord.weavingWorkOrderNo || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order Date</p>
                <p className="text-sm font-semibold text-slate-900">{viewOrderDate}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order Type</p>
                <p className="text-sm font-semibold text-slate-900">{viewOrderTypeLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Buyer</p>
                <p className="text-sm font-semibold text-slate-900">{viewBuyerDisplay}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sizing Plan</p>
                <p className="text-sm font-semibold text-slate-900">{viewPlanDisplay}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">GST Type</p>
                <p className="text-sm font-semibold text-slate-900">{Number(viewRecord.gstTypeId) === 1 ? "Intra State" : Number(viewRecord.gstTypeId) === 2 ? "Inter State" : "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sizing Rate / Kg</p>
                <p className="text-sm font-semibold text-slate-900">
                  {hasValue(viewRecord.sizingRatePerKg) ? Number(viewRecord.sizingRatePerKg).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                Item Details
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Yarn</th>
                      <th className="px-4 py-3 text-right">Total Ends</th>
                      <th className="px-4 py-3 text-right">Parts</th>
                      <th className="px-4 py-3 text-right">Ends / Part</th>
                      <th className="px-4 py-3 text-right">Warp Meters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewItems.length ? (
                      viewItems.map((item: any, idx: number) => {
                        const yarnLabel = item.yarnName || item.yarn?.yarnName || item.yarn?.name || (item.yarnId ? `Yarn ${item.yarnId}` : "-");
                        return (
                          <tr key={item.id || item.planDetailId || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                            <td className="px-4 py-3 text-left font-medium text-slate-800">{yarnLabel}</td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {hasValue(item.totalEnds) ? Number(item.totalEnds).toLocaleString("en-IN") : "-"}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {hasValue(item.numberOfParts) ? Number(item.numberOfParts).toLocaleString("en-IN") : "-"}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {hasValue(item.endsPerPart) ? Number(item.endsPerPart).toLocaleString("en-IN") : "-"}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {hasValue(item.warpMeters) ? Number(item.warpMeters).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                          No line items available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a record to view details.</p>
        )}
      </Modal>
    </div>
  );
}

export default SizingJobWorkOrderDetails;
