import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { getAllAgencyDispatches, deleteAgencyDispatch } from '@/state/agencyDispatchSlice';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Truck, FileText, CheckCircle2, AlertTriangle, Layers, Calendar } from 'lucide-react';
import { AgencyDispatch } from '@/types/agency';
import { toast } from 'react-toastify';

const formatSummaryAmount = (amount: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(amount);

export const AgencyMillDispatchPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { dispatches, loading } = useSelector((state: RootState) => state.agencyDispatch);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dispatchToDelete, setDispatchToDelete] = useState<AgencyDispatch | null>(null);

  const loadData = () => {
    dispatch(getAllAgencyDispatches({ fetchAll: true }));
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  // Summary Metrics
  const summary = useMemo(() => {
    const list: any[] = dispatches || [];
    const totalMtrs = list.reduce((acc, d) => acc + (Number(d.dispatchedMtrs) || 0), 0);
    const totalTaxable = list.reduce((acc, d) => acc + (Number(d.taxableValue) || 0), 0);
    const totalGst = list.reduce((acc, d) => acc + (Number(d.gstValue) || 0), 0);
    const grandTotal = list.reduce((acc, d) => acc + (Number(d.totalValue) || 0), 0);
    return {
      totalCount: list.length,
      totalMtrs,
      totalTaxable,
      totalGst,
      grandTotal
    };
  }, [dispatches]);

  const handleAdd = () => {
    navigate('/agency/mill-dispatch-entry');
  };

  const handleEdit = (row: AgencyDispatch) => {
    navigate('/agency/mill-dispatch-entry', { state: { dispatch: row, isEdit: true } });
  };

  const handleDelete = (row: AgencyDispatch) => {
    setDispatchToDelete(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (dispatchToDelete) {
      await dispatch(deleteAgencyDispatch(Number(dispatchToDelete.id)));
      loadData();
    }
    setIsDeleteModalOpen(false);
    setDispatchToDelete(null);
  };

  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'sNo',
        width: 50,
        disableFilters: true,
        Cell: ({ row }: any) => (
          <span className="font-mono text-xs text-gray-500 font-medium">
            {row.index + 1}
          </span>
        )
      },
      {
        Header: 'Mill Invoice',
        accessor: 'millInvoiceNo',
        Cell: ({ value, row }: any) => {
          const item: AgencyDispatch = row.original;
          return (
            <div>
              <span className="font-bold text-gray-900 font-mono text-sm">
                #{value}
              </span>
              <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-gray-400" />
                {item.invoiceDate}
              </div>
            </div>
          );
        }
      },
      {
        Header: 'Contract Ref',
        accessor: 'contractNo',
        Cell: ({ value }: { value: string }) => (
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {value || 'Direct Order'}
          </span>
        )
      },
      {
        Header: 'Mill / Seller',
        accessor: 'seller',
        Cell: ({ value }: { value: string }) => (
          <span className="text-xs font-bold text-gray-900">{value}</span>
        )
      },
      {
        Header: 'Buyer Name',
        accessor: 'buyerName',
        Cell: ({ value }: { value: string }) => (
          <span className="text-xs text-indigo-900 font-medium">{value}</span>
        )
      },
      {
        Header: 'Construction',
        accessor: 'construction',
        Cell: ({ value }: { value: string }) => (
          <span className="text-xs text-gray-700 truncate block font-mono max-w-[200px]" title={value}>
            {value}
          </span>
        )
      },
      {
        Header: 'Meters',
        accessor: 'dispatchedMtrs',
        Cell: ({ value }: { value: number }) => (
          <span className="font-semibold text-gray-900 text-xs font-mono">
            {value ? `${value.toLocaleString()} m` : '-'}
          </span>
        )
      },
      {
        Header: 'Taxable Value',
        accessor: 'taxableValue',
        Cell: ({ value }: { value: number }) => (
          <span className="font-medium text-gray-800 text-xs font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'GST (5%)',
        accessor: 'gstValue',
        Cell: ({ value }: { value: number }) => (
          <span className="text-xs text-gray-600 font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'Total Value',
        accessor: 'totalValue',
        Cell: ({ value }: { value: number }) => (
          <span className="font-bold text-emerald-700 text-xs font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'LR / Vehicle',
        accessor: 'lrNo',
        Cell: ({ value, row }: any) => {
          const item: AgencyDispatch = row.original;
          return (
            <div className="text-[11px] text-gray-600">
              <span className="font-mono font-medium text-gray-800">{value || '-'}</span>
              {item.vehicleNo && (
                <div className="text-[10px] text-gray-400">{item.vehicleNo}</div>
              )}
            </div>
          );
        }
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }: { value: string }) => {
          const colorMap: Record<string, string> = {
            'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'In-Transit': 'bg-amber-50 text-amber-700 border-amber-200',
            'Cancelled': 'bg-red-50 text-red-700 border-red-200'
          };
          return (
            <span
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                colorMap[value] || 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {value}
            </span>
          );
        }
      }
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      {/* Page Title & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-indigo-600" />
            Mill Dispatch Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time tracking of mill dispatches, invoice quantities, taxable values & transport details.
          </p>
        </div>

        <Button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary hover:bg-primary text-white font-medium px-4 py-2 rounded-lg shadow-sm cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>New Dispatch Entry</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Dispatches</p>
            <p className="text-xl font-bold text-gray-900">{summary.totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Dispatched Quantity</p>
            <p className="text-xl font-bold text-gray-900">
              {summary.totalMtrs.toLocaleString()}
              {summary.totalMtrs > 0 && <span className="text-xs font-normal text-gray-500"> Mtrs</span>}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <span className="font-bold text-lg font-mono">₹</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Taxable Turnover</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{formatSummaryAmount(summary.totalTaxable)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Grand Total (incl. GST)</p>
            <p className="text-xl font-bold text-emerald-700">
              ₹{formatSummaryAmount(summary.grandTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Data Table (Filter tabs removed as requested - DataTable has its own search & filters) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <DataTable
          data={dispatches}
          columns={columns}
          // onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showSearch={true}
          showColumnFilters={true}
          showExport={true}
          isShowPagination={true}
          initialPageSize={10}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && dispatchToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Mill Dispatch Entry"
          size="sm"
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">
                Are you sure you want to delete Invoice #{dispatchToDelete.millInvoiceNo}?
              </p>
            </div>
            <p className="text-xs text-gray-600">
              Mill: <span className="font-semibold">{dispatchToDelete.seller}</span> | Mtrs: <span className="font-semibold">{dispatchToDelete.dispatchedMtrs.toLocaleString()}</span>
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={confirmDelete}
                className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AgencyMillDispatchPage;
