import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { getAllInvoices, deletePaymentTerms, getAllInvoicesByCompanyId, deleteInvoiceByCompanyId } from "@/state/invoiceSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllGeneratePacking } from "@/state/generatePackingSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllYarnSalesOrders } from "@/state/yarnSalesSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { DocumentAttachmentModal } from "@/components/modals/DocumentAttachmentModal";
import { useFileCounts } from "@/hooks/useFileCounts";
import React from "react";


interface Invoice {
  id: number;
  manufactureId: number;
  invoiceDate: string;
  invoiceNo: string | null;
  salesOrderId: number;
  companyBankId: number;
  termsConditionsId: number;
  paymentTermsId: number;
  shipToId: number;
  shipmentMode: number;
  customerId: number;
  consgineeId: number;
  taxAmount: number;
  totalAmount: number;
  comments: string;
  activeFlag: boolean;
}

export function InvoiceDetails() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { generatePackingList } = useSelector((state: RootState) => state.generatePacking);
  const { consigneeList } = useSelector((state: RootState) => state.consignee);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { yarnSalesOrderList } = useSelector((state: RootState) => (state as any).yarnSales as any);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const { invoiceList } = useSelector((state: RootState) => state.invoice);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);
  const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);
  const [attachmentModalTitle, setAttachmentModalTitle] = useState<string>('');



  useEffect(() => {
    const companyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (companyId) {
      dispatch(getAllInvoicesByCompanyId(Number(companyId)));
      dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
        factoryCompanyId: Number(companyId),
      }) as any);
      dispatch(getAllYarnSalesOrders({ companyId: Number(companyId), fetchAll: true }) as any);
    } else {
      dispatch(getAllInvoices({ fetchAll: true }));
      dispatch(getAllWeavingJobWorkOrders({ fetchAll: true }));
      dispatch(getAllYarnSalesOrders({ fetchAll: true }) as any);
    }
    dispatch(getAllCustomers({ fetchAll: true }));
    dispatch(getAllSalesOrders({ fetchAll: true }));
    dispatch(getAllGeneratePacking({ fetchAll: true }));
    dispatch(getAllConsignee({ fetchAll: true }));
    dispatch(getAllFabricMasters({ fetchAll: true }) as any);
  }, [dispatch]);

  const customerMap = useMemo(() => {
    const arr = (customerList as any)?.data ?? (customerList as any) ?? [];
    return Array.isArray(arr)
      ? arr.reduce((acc: Record<number, string>, c: any) => {
        acc[Number(c.id)] = c.customerName ?? c.name ?? String(c.id);
        return acc;
      }, {})
      : {};
  }, [customerList]);

  const soArr: any[] = useMemo(() => {
    const raw = (salesOrderList as any)?.data ?? (salesOrderList as any) ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [salesOrderList]);

  const woArr: any[] = useMemo(() => {
    const raw = (weavingJobWorkOrderList as any)?.data ?? (weavingJobWorkOrderList as any) ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [weavingJobWorkOrderList]);

  const soMap = useMemo(() => {
    return soArr.reduce((m: Record<number, string>, so: any) => {
      m[Number(so.id)] = so.salesOrderNo || so.orderNo || String(so.id);
      return m;
    }, {} as Record<number, string>);
  }, [soArr]);

  const woMap = useMemo(() => {
    return woArr.reduce((m: Record<number, string>, wo: any) => {
      m[Number(wo.id)] = wo.weavingWorkOrderNo || wo.jobWorkOrderNo || wo.orderNo || String(wo.id);
      return m;
    }, {} as Record<number, string>);
  }, [woArr]);

  const yarnSalesMap = useMemo(() => {
    const raw: any = yarnSalesOrderList as any;
    const arr: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
          ? raw.data.data
          : [];
    return arr.reduce((m: Record<number, string>, order: any) => {
      const id = Number(order?.id);
      if (!Number.isNaN(id)) {
        const orderNo = order?.yarnSalesNo || order?.orderNo || order?.salesOrderNo || `YS-${id}`;
        m[id] = String(orderNo);
      }
      return m;
    }, {} as Record<number, string>);
  }, [yarnSalesOrderList]);

  const packingArr: any[] = useMemo(() => {
    const raw = (generatePackingList as any)?.data ?? (generatePackingList as any) ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [generatePackingList]);

  const packingBySalesOrder = useMemo(() => {
    // Map salesOrderId -> first packingSlipNo (or join if multiple)
    const map = new Map<number, string>();
    for (const p of packingArr) {
      const soId = Number(p.salesOrderId);
      if (!soId) continue;
      const slip = p.packingListNo || p.packingNo || p.packingSlipNo || '';
      if (!slip) continue;
      if (!map.has(soId)) map.set(soId, String(slip));
    }
    return map;
  }, [packingArr]);

  const packingByWeavingOrder = useMemo(() => {
    // Map salesOrderId -> first packingSlipNo (or join if multiple)
    const map = new Map<number, string>();
    for (const p of packingArr) {
      const woId = Number(p.weavingWorkOrderId);
      if (!woId) continue;
      const slip = p.packingListNo || p.packingNo || p.packingSlipNo || '';
      if (!slip) continue;
      if (!map.has(woId)) map.set(woId, String(slip));
    }
    return map;
  }, [packingArr]);

  const consigneeMap = useMemo(() => {
    const arr = (consigneeList as any)?.data ?? (consigneeList as any) ?? [];
    return Array.isArray(arr)
      ? arr.reduce((acc: Record<number, string>, c: any) => {
        acc[Number(c.id)] = c.consigneeName ?? String(c.id);
        return acc;
      }, {})
      : {};
  }, [consigneeList]);

  const fabricMasterMap = useMemo(() => {
    const arr = Array.isArray(fabricMasterList) ? fabricMasterList : [];
    return arr.reduce((acc: Record<number, any>, fm: any) => {
      acc[Number(fm.id)] = fm;
      return acc;
    }, {});
  }, [fabricMasterList]);

  const processedCityList = useMemo(() => {
    return (invoiceList as any[])
      .filter((inv: any) => inv.activeFlag === true)
      .map((inv: any, index: number) => {
        const items = Array.isArray(inv.items) ? inv.items : [];
        const quantity = Array.from(
          new Set(
            items
              .map((item: any) => item.quantity)
              .filter((name: any) => Boolean(name))
          )
        );
        const productNames = Array.from(
          new Set(
            items
              .map((item: any) => item.productName)
              .filter((name: any) => Boolean(name))
          )
        );
        const packingReferences = Array.from(
          new Set(
            items
              .map((item: any) => item.packingListNo || item.yarnChallanNo)
              .filter((ref: any) => Boolean(ref))
          )
        );

        const fabricQuality = (() => {
          if (items.length === 0) return '-';
          const firstItem = items[0];
          const fabricMasterId = firstItem?.fabricMasterId;
          if (!fabricMasterId) return '-';
          const fabricMaster = fabricMasterMap[Number(fabricMasterId)];
          return fabricMaster?.quality || fabricMaster?.fabricQuality || fabricMaster?.buyerProduct || '-';
        })();

        const numericSalesOrderId = Number(inv.salesOrderId ?? 0);
        const numericYarnSalesOrderId = Number(inv.yarnSalesOrderId ?? 0);
        const numericWeavingOrderId = Number(inv.weavingWorkOrderId ?? 0);
        const resolvedOrderNo = (() => {
          if (numericSalesOrderId > 0) {
            return soMap[numericSalesOrderId] ?? inv.soNo ?? '-';
          }
          if (numericYarnSalesOrderId > 0) {
            return yarnSalesMap[numericYarnSalesOrderId] ?? inv.yarnSalesNo ?? '-';
          }
          if (numericWeavingOrderId > 0) {
            return woMap[numericWeavingOrderId] ?? inv.woNo ?? '-';
          }
          return inv.soNo || inv.woNo || '-';
        })();

        return {
          ...inv,
          serialNo: index + 1,
          soNo: resolvedOrderNo,
          salesOrderNo: resolvedOrderNo,
          buyerName: customerMap[Number(inv.customerId)] ?? inv.customerId,
          quantity: quantity.length > 0 ? quantity.join(', ') : '-',
          productName: productNames.length > 0 ? productNames.join(', ') : '-',
          packingListNo: packingReferences.length > 0 ? packingReferences.join(', ') : '-',
          deliveryAt: consigneeMap[Number(inv.consgineeId)] ?? inv.consgineeId ?? '-',
          fabricQuality,
        };
      });
  }, [invoiceList, soMap, woMap, yarnSalesMap, customerMap, consigneeMap, fabricMasterMap]);

  const containerNames = useMemo(() => {
    return (processedCityList || []).map((inv: any) => `invoice_${inv.id}`);
  }, [processedCityList]);

  const { counts: fileCounts, updateCount: updateFileCount } = useFileCounts(containerNames);

  const handleOpenAttachmentModal = React.useCallback((invoice: any) => {
    setSelectedAttachmentContainer(`invoice_${invoice.id}`);
    setAttachmentModalTitle(`Invoice #${invoice.invoiceNo || invoice.id} Files`);
  }, []);



  const handleDownload = (invoice: Invoice) => {
    navigate("/transaction/invoice", { state: { invoice, autoDownload: true } });
  };

  const handleAdd = () => {
    navigate("/transaction/invoice");
  };

  const handleEdit = (invoice: Invoice) => {
    const parentId = invoice.id;
    const childIds: number[] = [];

    const queryParams = new URLSearchParams();
    queryParams.set('parentId', String(parentId));
    if (childIds.length > 0) {
      childIds.forEach(childId => queryParams.append('childId', String(childId)));
    }

    navigate(`/transaction/invoice?${queryParams.toString()}`, { state: { invoice } });
  };

  const handleDelete = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setIsDeleteModalOpen(true);
  };

  const handleView = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo', // ✅ Use pre-calculated serial number
        width: 50,
        disableFilters: true,
      },
     
      {
        Header: 'Invoice Date',
        accessor: 'invoiceDate',
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
        Header: 'Invoice No',
        accessor: 'invoiceNo',
        Cell: ({ value }: { value: string | null }) => value || 'N/A'
      },
       {
        Header: 'Invoice Type',
        accessor: 'invoiceType',
      },
      {
        Header: 'Order No',
        accessor: 'soNo',
      },
      {
        Header: 'Buyer Name',
        accessor: 'buyerName',
      },
      {
        Header: 'Delivery At',
        accessor: 'deliveryAt',
      },
      {
        Header: 'Product Description',
        accessor: 'productName',
      },
      {
        Header: 'Packing List No',
        accessor: 'packingListNo',
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
      },
      {
        Header: 'Total Amount',
        accessor: 'totalAmount',
        Cell: ({ value }: { value: number }) => `${value.toFixed(2)}`
      },
      {
        Header: 'Print',
        accessor: 'id',
        Cell: ({ row }: any) => (
          <Link
            to={`/transaction/invoice-print?id=${row.original.id}`}
            state={{ invoice: row.original }}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Print
          </Link>
        ),
        disableFilters: true,
      },
      {
        Header: 'Files',
        accessor: 'id',
        disableFilters: true,
        Cell: (props: any) => {
          const { row } = props;
          const containerName = `invoice_${row.original.id}`;
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
    ],
    [handleEdit, handleView, handleDelete, navigate, fileCounts, handleOpenAttachmentModal]
  );

  const confirmDelete = async () => {
    if (!currentInvoice) return;
    try {
      const companyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      if (companyId) {
        await dispatch(deleteInvoiceByCompanyId({ id: currentInvoice.id, companyId: Number(companyId) })).unwrap();
        await dispatch(getAllInvoicesByCompanyId(Number(companyId)));
      } else {
        await dispatch(deletePaymentTerms(currentInvoice.id)).unwrap();
        await dispatch(getAllInvoices({}));
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };

  return (
    <div>

      <DataTable
        columns={columns}
        data={processedCityList}
        title="Invoice Details"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search invoices..."
        showColumnFilters={true}
        disableFullDataFetch={true}
      
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this invoice?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Invoice Details"
        className="w-full max-w-4xl"
      >
        {currentInvoice && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Invoice No</p>
                <p className="font-medium">{currentInvoice.invoiceNo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice Date</p>
                <p className="font-medium">
                  {new Date(currentInvoice.invoiceDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sales Order</p>
                <p className="font-medium">{currentInvoice.salesOrderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{currentInvoice.customerId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium">${currentInvoice.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tax Amount</p>
                <p className="font-medium">${currentInvoice.taxAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${currentInvoice.activeFlag
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}
                >
                  {currentInvoice.activeFlag ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Comments</p>
                <p className="font-medium">{currentInvoice.comments || 'N/A'}</p>
              </div>
            </div>

            {/* Additional sections can be added here for line items, etc. */}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
      {selectedAttachmentContainer && (
        <DocumentAttachmentModal
          isOpen={Boolean(selectedAttachmentContainer)}
          onClose={() => setSelectedAttachmentContainer(null)}
          containerName={selectedAttachmentContainer}
          title={attachmentModalTitle}
          onFilesUpdated={(newCount) => updateFileCount(selectedAttachmentContainer, newCount)}
        />
      )}
    </div>
  );
}