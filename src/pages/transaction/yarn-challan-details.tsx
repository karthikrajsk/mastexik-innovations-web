import React, { useEffect, useState, useMemo, useCallback } from "react";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { Modal } from "@/components/ui/Modal";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getAllYarnChallan,
  deleteYarnChallan
} from "@/state/yarnChallanSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllYarnSalesOrders } from "@/state/yarnSalesSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllTransports } from "@/state/transportSlice";
import { Eye, Edit, Trash } from "lucide-react";

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export function YarnChallanDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { yarnChallanList } = useSelector((state: RootState) => (state as any).yarnChallan);
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { yarnSalesOrderList } = useSelector((state: RootState) => (state as any).yarnSales);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { yarnList } = useSelector((state: RootState) => (state as any).yarn);
  const { transportList } = useSelector((state: RootState) => (state as any).transport);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPacking, setCurrentPacking] = useState<any>(null);
  const { currentPage, itemsPerPage, handlePageChange } = usePagination({ itemsPerPage: 10 });

  useEffect(() => {
    const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = v ? Number(v) : null;
    dispatch(getAllYarnChallan(companyId ? { companyId } : { fetchAll: true }) as any);
    dispatch(getAllCustomers({ fetchAll: true } as any));
    dispatch(getAllYarnSalesOrders(companyId ? { companyId } : { fetchAll: true }) as any);
    dispatch(getAllWarehouse({ fetchAll: true } as any));
    dispatch(getAllYarnMasters({ fetchAll: true } as any));
    dispatch(getAllTransports({ fetchAll: true } as any));
  }, [dispatch]);

  // Process yarn challan with calculated values
  const processedChallanList = useMemo(() => {
    const challanArr = Array.isArray(yarnChallanList) ? yarnChallanList : [];
    const yarnSalesOrderArr = Array.isArray(yarnSalesOrderList) ? yarnSalesOrderList : (yarnSalesOrderList?.data || []);
    const yarnArr = Array.isArray(yarnList) ? yarnList : [];

    return challanArr.map((challan: any, index: number) => {
      const buyer = customerList.find((c: any) => c.id === challan.buyerId);

      const yarnSalesOrder = yarnSalesOrderArr.find((yso: any) => yso.id === challan.yarnSalesOrderId);
      const orderNo = yarnSalesOrder?.yarnSalesNo || yarnSalesOrder?.id?.toString() || "-";

      const warehouseData = warehouseList.find((w: any) => w.id === challan.warehouseId);
      const transport = transportList.find((t: any) => t.id === challan.transportId);

      // Calculate totals from items (yarn items, not bales)
      const totalIssueQty = challan.items?.reduce((sum: number, item: any) => sum + (item.issueQty || 0), 0) || 0;
      const totalTaxableValue = challan.items?.reduce((sum: number, item: any) => sum + (item.taxableValue || 0), 0) || 0;
      const totalGstAmount = challan.items?.reduce((sum: number, item: any) => sum + (item.gstAmount || 0), 0) || 0;
      const totalAmount = challan.items?.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0) || 0;

      // Get yarn names and issue qty per item for comma separated display
      const yarnNameList = challan.items?.map((item: any) => {
        const yarn = yarnArr.find((y: any) => y.id === item.yarnId);
        return yarn?.yarnName || '-';
      }) || [];
      const yarnNames = yarnNameList.length > 0 ? yarnNameList.join(', ') : '-';
      const issueQtyList = challan.items?.map((item: any) => Number(item.issueQty || 0).toFixed(2)) || [];
      const issueQtyDisplay = issueQtyList.length > 0 ? issueQtyList.join(', ') : '-';

      return {
        ...challan,
        serialNo: index + 1,
        buyerName: buyer?.customerName || buyer?.name || "-",
        deliveryAt: challan.deliveryAt || "-",
        orderNo: orderNo,
        yarnNames: yarnNames,
        transportName: transport?.transportName || transport?.name || "-",
        issueQtyDisplay,
        totalIssueQty: totalIssueQty.toFixed(2),
        // totalTaxableValue: totalTaxableValue.toFixed(2),
        // totalGstAmount: totalGstAmount.toFixed(2),
        // totalAmount: totalAmount.toFixed(2),
      };
    });
  }, [yarnChallanList, customerList, yarnSalesOrderList, warehouseList, yarnList, transportList]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(processedChallanList.length / itemsPerPage));
    const lastPage = Math.max(0, totalPages - 1);
    if (currentPage > lastPage) {
      handlePageChange(lastPage);
    }
  }, [processedChallanList.length, itemsPerPage, currentPage, handlePageChange]);

  const paginatedChallanList = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return processedChallanList.slice(start, start + itemsPerPage).map((challan, index) => ({
      ...challan,
      serialNo: start + index + 1,
    }));
  }, [processedChallanList, currentPage, itemsPerPage]);

  const totalItems = processedChallanList.length;
  const offset = currentPage * itemsPerPage;
  const hasNext = offset + itemsPerPage < totalItems;
  const hasPrev = currentPage > 0;

  const handleAdd = useCallback(() => {
    navigate("/transaction/yarn-challan");
  }, [navigate]);

  const handleEdit = useCallback((challan: any) => {
    navigate("/transaction/yarn-challan", { state: { challan } });
  }, [navigate]);

  const handleDelete = useCallback((challan: any) => {
    setCurrentPacking(challan);
    setIsDeleteModalOpen(true);
  }, []);

  const handleView = useCallback((challan: any) => {
    setCurrentPacking(challan);
    setIsViewModalOpen(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },

      {
        Header: 'Challan Date',
        accessor: 'challanDate',
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
        Header: 'Yarn Challan No',
        accessor: 'challanNo',
      },
      {
        Header: 'Buyer Name',
        accessor: 'buyerName',
      },
      {
        Header: 'Transport',
        accessor: 'transportName',
      },
      {
        Header: 'Vehicle No',
        accessor: 'vehicleNo',
      },
      {
        Header: 'Delivery At',
        accessor: 'deliveryAt',
      },
      {
        Header: 'Yarn Sales Order No',
        accessor: 'orderNo',
      },
      {
        Header: 'Yarn Name(s)',
        accessor: 'yarnNames',
      },

      {
        Header: 'Total Issue Qty',
        accessor: 'issueQtyDisplay',
      },
      {
        Header: 'Invoice Print',
        accessor: 'invoicePrint',
        disableFilters: true,
        Cell: ({ row }: { row: any }) => {
          const challan = row.original;
          return (
            <div className="flex justify-center">
              <a
                href={`#/transaction/yarn-delivery-challan-print?id=${challan.id}&type=yarn-challan`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                title="Print Invoice"
              >
                Print
              </a>
            </div>
          );
        }
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        disableFilters: true,
        Cell: ({ row }: { row: any }) => {
          const challan = row.original;
          const isInvoiceDone = Number(challan?.isInvoice ?? 0) === 1;
          if (isInvoiceDone) {
            return (
              <div className="flex justify-end">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  Invoice Done
                </span>
              </div>
            );
          }
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => handleView(challan)}
                className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-blue-600 transition hover:border-blue-200"
                title="View"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleEdit(challan)}
                className="rounded-lg border border-amber-100 bg-amber-50/60 p-2 text-amber-600 transition hover:border-amber-200"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(challan)}
                className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
                title="Delete"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          );
        }
      },
      // {
      //   Header: 'Total Taxable Value',
      //   accessor: 'totalTaxableValue',
      // },
      // {
      //   Header: 'Total GST Amount',
      //   accessor: 'totalGstAmount',
      // },
      // {
      //   Header: 'Total Amount',
      //   accessor: 'totalAmount',
      // },
    ],
    [handleView, handleEdit, handleDelete]
  );


  const confirmDelete = async () => {
    if (!currentPacking) return;

    try {
      await dispatch(deleteYarnChallan(currentPacking.id)).unwrap();
      const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      const companyId = v ? Number(v) : null;
      await dispatch(getAllYarnChallan(companyId ? { companyId } : { fetchAll: true }));
      toast.success("Yarn challan deleted successfully");
    } catch (error) {
      console.error("Error deleting yarn challan:", error);
      toast.error("Failed to delete yarn challan");
    }

    setIsDeleteModalOpen(false);
    setCurrentPacking(null);
  };

  return (
    <div className="p-6 pt-16">

      <DataTable
        columns={columns}
        data={paginatedChallanList}
        title="Yarn Challan"
        onAdd={handleAdd}
        showActions={false}
        filterPlaceholder="Search yarn challan..."
        showColumnFilters={true}
        disableFullDataFetch={true}
      // totalCount={processedChallanList.length}
      // currentPage={currentPage}
      // onPageChange={handlePageChange}
      />

      {/* <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        offset={offset}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onPageChange={handlePageChange}
      /> */}

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Yarn Challan Details"
        className="w-full max-w-6xl"
      >
        {currentPacking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Yarn Challan No</p>
                <p className="font-medium">{currentPacking.challanNo || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Challan Date</p>
                <p className="font-medium">{formatDate(currentPacking.challanDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Buyer Name</p>
                <p className="font-medium">{currentPacking.buyerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery At</p>
                <p className="font-medium">{currentPacking.deliveryAt}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Yarn Sales Order No</p>
                <p className="font-medium">{currentPacking.orderNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Warehouse</p>
                <p className="font-medium">
                  {warehouseList.find((w: any) => w.id === currentPacking.warehouseId)?.warehouseName || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transport</p>
                <p className="font-medium">{currentPacking.transportName || "-"}</p>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600">No. of Items</p>
                  <p className="text-lg font-bold">{currentPacking.items?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Issue Qty</p>
                  <p className="text-lg font-bold">{currentPacking.totalIssueQty}</p>
                </div>
                {/* <div>
                  <p className="text-xs text-gray-600">Total Taxable Value</p>
                  <p className="text-lg font-bold">{currentPacking.totalTaxableValue}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total GST Amount</p>
                  <p className="text-lg font-bold">{currentPacking.totalGstAmount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="text-lg font-bold">{currentPacking.totalAmount}</p>
                </div> */}
              </div>
            </div>

            {/* Items Table */}
            {currentPacking.items && currentPacking.items.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Item Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Yarn Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mill Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate/Unit</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST %</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GST Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentPacking.items.map((item: any, index: number) => {
                        const yarn = Array.isArray(yarnList) ? yarnList.find((y: any) => y.id === item.yarnId) : null;
                        return (
                          <tr key={index}>
                            <td className="px-4 py-2">{index + 1}</td>
                            <td className="px-4 py-2">{yarn?.yarnName || item.yarnName || "-"}</td>
                            <td className="px-4 py-2">{item.millName || "-"}</td>
                            <td className="px-4 py-2 text-right">{parseFloat(item.orderQuantity || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{parseFloat(item.issueQty || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{parseFloat(item.ratePerUnit || 0).toFixed(2)}</td>
                            <td className="px-4 py-2">{item.uomName || "-"}</td>
                            <td className="px-4 py-2 text-right">{parseFloat(item.taxableValue || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{parseFloat(item.gstPercent || 0).toFixed(2)}%</td>
                            <td className="px-4 py-2 text-right">{parseFloat(item.gstAmount || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{parseFloat(item.totalAmount || 0).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentPacking.remarks && (
              <div>
                <p className="text-sm text-gray-500">Remarks</p>
                <p className="font-medium">{currentPacking.remarks}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
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
          <p>Are you sure you want to delete this yarn challan?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}