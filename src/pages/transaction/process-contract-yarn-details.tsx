import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { deleteDyeingWorkOrder, getAllDyeingWorkOrdersByType, updateDyeingWorkOrder } from "@/state/processContractSlice";
import { getAllPoTypes, getAllPurchaseOrders } from "@/state/purchaseOrderSlice";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { OrderStatusModal } from "@/components/ui/OrderStatusModal";
import { TransactionStatusAPI } from "@/services/transaction-status-api";
import { toast } from "react-toastify";

interface DyeingWorkOrderItem {
  id: number;
  dyeingWorkOrderId: number | null;
  finishedFabricCodeId?: number;
  finishedFabricName?: string;
  greigeFabricCodeId?: number;
  greigeFabricName?: string;
  finishedYarnCodeId?: number;
  finishedYarnName?: string;
  greigeYarnCodeId?: number;
  greigeYarnName?: string;
  quantity: number;
  costPerPound: number;
  totalAmount: number;
  colorId: number;
  pantone: string;
  finishedWeight: number;
  greigeWidth?: number;
  reqFinishedWidth?: number;
  uomId: number;
  remarks: string;
  activeFlag: boolean;
}

interface DyeingWorkOrder {
  isComplete: number;
  order_status: string;
  id: number;
  dyeingWorkOrderNo: string;
  processContactDate: string;
  deliveryDate: string;
  vendorId: number;
  salesOrderNo: number;
  consigneeId: number;
  lapDipStatusId: number;
  firstYardageId: number;
  processTypeId: number | null;
  processType: string | null;
  remarks: string;
  activeFlag: boolean;
  fabricItems: DyeingWorkOrderItem[];
  yarnItems: DyeingWorkOrderItem[];
  items?: DyeingWorkOrderItem[];
  totalAmount?: number;
  completionDate?: string | null;
  description?: string;
}

export function ProcessContractYarnDetails() {

  const { processContractList, paginationInfo } = useSelector((state: RootState) => state.dyeingWorkOrde);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<DyeingWorkOrder | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [updatedOrders, setUpdatedOrders] = useState<Map<number, any>>(new Map());
  const [activeSubTab, setActiveSubTab] = useState<'open' | 'completed'>('open');
  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);

  const [genericTransactionData, setGenericTransactionData] = useState<{
    transactionTypeId?: number;
    vendorId?: number;
    buyerId?: number;
    [key: string]: any;
  } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });

  // For demonstration, you should replace this with your API data
  const [dyeingWorkOrders, setDyeingWorkOrders] = useState<DyeingWorkOrder[]>([]);

  useEffect(() => {
    dispatch(getAllDyeingWorkOrdersByType({
      type: "YARN",
      // offset: getOffset(), limit: itemsPerPage,
      fetchAll: true
    })); // Only fetch yarn contracts
    dispatch(getAllVendors({}));
  }, [dispatch, currentPage, getOffset, itemsPerPage]);

  const yarnOrders = useMemo(() => {
    return processContractList.filter((order: any) => order.activeFlag === true);
  }, [processContractList]);

  const vendorMap = useMemo(() => {
    return vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
      acc[vendor.id] = vendor.vendorName;
      return acc;
    }, {}) || {};
  }, [vendorList]);

  const processedCityList = useMemo(() => {
    return yarnOrders.map((row: any, index: number) => {
      // Use yarnItems for calculations
      const items = Array.isArray(row?.yarnItems) ? row.yarnItems : [];
      const unique = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));
      const greigeYarnSummary = unique(items.map((it: any) => it.greigeYarnName || it.greigeYarn || it.greige)).join(', ');
      const finishedYarnSummary = unique(items.map((it: any) => it.finishedYarnName || it.finishedYarn || it.finished)).join(', ');
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);
      const vendorName = row.vendorId ? vendorMap[Number(row.vendorId)] || '-' : '--';

      const updatedInfo = updatedOrders.get(row.id);
      const isCompleteVal = updatedInfo
        ? (updatedInfo.isComplete === 1 || updatedInfo.isComplete === true)
        : (row.isComplete === 1 || row.isComplete === true || row.order_status === 'Completed');
      const orderStatus = updatedInfo?.order_status || row.order_status || (isCompleteVal ? 'Completed' : 'Pending');

      const quantities = row.yarnItems
        ?.map((item: any) => item.quantity)
        .filter((q: any) => q != null && q !== '') || [];

      const calculatedQuantity = quantities.join(', ');

      return {
        ...row,
        serialNo: (paginationInfo?.offset || 0) + index + 1,
        totalAmount: totalAmount,
        greigeYarnSummary,
        finishedYarnSummary,
        vendorName,
        quantity: calculatedQuantity,
        items: items, // Make sure items is set for view modal
        order_status: orderStatus,
        isComplete: isCompleteVal ? 1 : 0
      };
    }).filter((order: any) => {
      const matchesSubTab = activeSubTab === 'open' ? !order.isComplete : order.isComplete;
      return matchesSubTab;
    });
  }, [yarnOrders, vendorMap, paginationInfo, updatedOrders, activeSubTab]);
  const handleCompleteOrder = useCallback((order: DyeingWorkOrder) => {
    if (!order) return;
    setCurrentOrder(order);
    const { vendorId, ...orderRest } = order;
    setGenericTransactionData({
      transactionTypeId: order.processTypeId || 0,
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

      },
      {
        Header: 'Process Contract Date',
        accessor: 'processContactDate',
        Cell: ({ value }: { value: string }) => formatDate(value),
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
      { Header: 'Work Order No', accessor: 'dyeingWorkOrderNo' },

      {
        Header: 'Delivery Date',
        accessor: 'deliveryDate',
        Cell: ({ value }: { value: string }) => formatDate(value),
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
        Header: 'Vendor',
        accessor: 'vendorName',
        Cell: ({ value }: { value: string }) => value || '-',
      },
      { Header: 'Finished Yarn Name', accessor: 'finishedYarnSummary' },
      { Header: 'Greige Yarn Name', accessor: 'greigeYarnSummary' },
      { Header: 'Quantity', accessor: 'quantity' },
      {
        Header: 'Order Status',
        accessor: 'order_status',
        Cell: (props: any) => {
          const { row } = props;
          const isComplete = row.original.isComplete;
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
    [handleCompleteOrder]

  );

  const handleAdd = () => {
    setModalMode('add');
    setCurrentOrder(null);
    reset();
    navigate("/transaction/process-contract-yarn-entry");
  };

  const handleEdit = (order: DyeingWorkOrder) => {
    setModalMode('edit');
    setCurrentOrder(order);
    reset(order);
    setIsModalOpen(true);
    navigate("/transaction/process-contract-yarn-entry", { state: { order } });
  };

  const handleDelete = (order: DyeingWorkOrder) => {
    setCurrentOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleView = (order: DyeingWorkOrder) => {
    setCurrentOrder({
      ...order,
      items: order.yarnItems || [] // Show yarn items in view modal
    });
    setIsViewModalOpen(true);
  };

  // const confirmDelete = () => {
  //   setDyeingWorkOrders(dyeingWorkOrders.filter((o) => o.id !== currentOrder?.id));
  //   setIsDeleteModalOpen(false);
  // };
  const confirmDelete = async () => {
    if (!currentOrder) return;

    try {
      await dispatch(deleteDyeingWorkOrder({ id: currentOrder.id, processType: "YARN" })).unwrap();
      resetPage();
      await dispatch(getAllDyeingWorkOrdersByType({
        type: "YARN",
        //  offset: 0, limit: itemsPerPage }
        fetchAll: true
      }
      ));
    } catch (error) {
      console.error("Error deleting DyeingWorkOrders:", error);
    }

    setIsDeleteModalOpen(false);
  };
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
      transactionTypeId: 105,
      transactionTypeName: 'dyeing-work-order',
      primaryTypeId: currentOrder.id,
      buyerId: transactionDataFromModal?.buyerId || undefined,
      vendorId: transactionDataFromModal?.vendorId || currentOrder.vendorId,
      date: completionDate,
      description: description || '',
      status: transactionStatus,
      isActive: true
    };

    try {
      await TransactionStatusAPI.postTransactionStatus(transactionStatusPayload);

      const newStatus = transactionStatus;
      const newIsComplete = isReopening ? 0 : 1;

      const updatePayload = {
        ...currentOrder,
        order_status: newStatus,
        isComplete: newIsComplete,
        completionDate: newIsComplete === 1 ? completionDate : null,
      };

      await dispatch(updateDyeingWorkOrder({ id: currentOrder.id, data: updatePayload, processType: "YARN" })).unwrap();

      const updatedOrder: DyeingWorkOrder = {
        ...currentOrder,
        order_status: newStatus,
        isComplete: newIsComplete,
        completionDate: completionDate as any,
        description: description as any,
        vendorId: transactionDataFromModal?.vendorId || currentOrder.vendorId,
      } as DyeingWorkOrder;

      const newUpdatedOrders = new Map(updatedOrders);
      newUpdatedOrders.set(currentOrder.id, updatedOrder);
      setUpdatedOrders(newUpdatedOrders);

      toast.success(`Process Contract ${currentOrder.dyeingWorkOrderNo} ${isReopening ? 're-opened' : 'marked as completed'}`);

      dispatch(getAllDyeingWorkOrdersByType({
        type: "YARN",
        // offset: getOffset(),
        // limit: itemsPerPage
        fetchAll: true
      }));
    } catch (error) {
      console.error('Error saving transaction status:', error);
      toast.error('Failed to save transaction status');
    }

    setGenericTransactionData(null);
    setIsOrderStatusModalOpen(false);
  };

  return (
    <div>
      {/* <h1 className="text-2xl font-bold mb-6">Dyeing Work Order Management</h1> */}

      <div className="flex gap-4 border-b mb-4">
        <button
          onClick={() => setActiveSubTab('open')}
          className={`pb-2 px-4 transition-colors duration-200 ${activeSubTab === 'open'
              ? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
              : 'text-gray-600 hover:text-blue-500'
            }`}
        >
          Open
        </button>
        <button
          onClick={() => setActiveSubTab('completed')}
          className={`pb-2 px-4 transition-colors duration-200 ${activeSubTab === 'completed'
              ? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
              : 'text-gray-600 hover:text-blue-500'
            }`}
        >
          Completed
        </button>
      </div>

      <DataTable
        columns={columns}
        data={processedCityList}
        title="Process Contract Details (YARN)"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search Dyeing Work Order..."
        showColumnFilters={true}
        //  initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={paginationInfo?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
        disableFullDataFetch={true}
      />

      {/* <div className="mt-4 flex justify-between items-center px-4">
        <div className="text-sm text-gray-600">
          Showing {processedCityList.length > 0 ? (paginationInfo?.offset || 0) + 1 : 0} - {(paginationInfo?.offset || 0) + processedCityList.length} of {paginationInfo?.total || 0}
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

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Process Contract Details (YARN)"
        className="max-w-4xl"
      >
        {currentOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Work Order No</p>
                <p className="font-medium">{currentOrder.dyeingWorkOrderNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Process Contact Date</p>
                <p className="font-medium">{currentOrder.processContactDate}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Delivery Date</p>
                <p className="font-medium">{currentOrder.deliveryDate}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Vendor ID</p>
                <p className="font-medium">{currentOrder.vendorId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sales Order No</p>
                <p className="font-medium">{currentOrder.salesOrderNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Consignee Id</p>
                <p className="font-medium">{currentOrder.consigneeId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Lap Dip Status Id</p>
                <p className="font-medium">{currentOrder.lapDipStatusId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">First Yardage Id</p>
                <p className="font-medium">{currentOrder.firstYardageId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Total Amount</p>
                <p className="font-medium">{currentOrder.totalAmount}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Remarks</p>
                <p className="font-medium">{currentOrder.remarks}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs ${currentOrder.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {currentOrder.activeFlag ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            {/* Show Items Table */}
            <div>
              <h2 className="font-semibold text-lg mt-2 mb-1">Work Order Items</h2>
              <table className="w-full border-collapse border border-gray-300 text-center">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">#</th>
                    <th className="border p-2">Finished Fabric</th>
                    <th className="border p-2">Greige Fabric</th>
                    <th className="border p-2">Quantity</th>
                    <th className="border p-2">Cost Per Pound</th>
                    <th className="border p-2">Total Amount</th>
                    <th className="border p-2">Pantone</th>
                    <th className="border p-2">Finished Weight</th>
                    <th className="border p-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentOrder.items || []).map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border p-2">{idx + 1}</td>
                      <td className="border p-2">{item.finishedFabricName}</td>
                      <td className="border p-2">{item.greigeFabricName}</td>
                      <td className="border p-2">{item.quantity}</td>
                      <td className="border p-2">{item.costPerPound}</td>
                      <td className="border p-2">{item.totalAmount}</td>
                      <td className="border p-2">{item.pantone}</td>
                      <td className="border p-2">{item.finishedWeight}</td>
                      <td className="border p-2">{item.remarks}</td>
                    </tr>
                  ))}
                  {(!currentOrder.items || currentOrder.items.length === 0) && (
                    <tr>
                      <td colSpan={9} className="border p-2 text-center text-gray-500">
                        No items found for this work order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this DyeingWork Orders?</p>
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
    </div>
  );
}