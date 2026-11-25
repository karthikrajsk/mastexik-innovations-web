import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { getAllAgencyPayments, deleteAgencyPayment } from '@/state/agencyPaymentSlice';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { IndianRupee, CheckCircle2, Clock, AlertTriangle, FileText, Calendar } from 'lucide-react';
import { AgencyPayment } from '@/types/agency';
import { toast } from 'react-toastify';

const formatSummaryAmount = (amount: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(amount);

export const AgencyPaymentRealizationPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { payments, loading } = useSelector((state: RootState) => state.agencyPayment);
  const [activeTab, setActiveTab] = useState<'ALL' | 'Fully Settled' | 'Pending Settlement'>('ALL');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<AgencyPayment | null>(null);

  const loadData = () => {
    dispatch(getAllAgencyPayments({ fetchAll: true }));
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const filteredPayments = useMemo(() => {
    const list: any[] = payments || [];
    if (activeTab === 'ALL') return list;
    return list.filter((p: any) => p.status === activeTab);
  }, [payments, activeTab]);

  // KPI Calculations
  const summary = useMemo(() => {
    const list: any[] = payments || [];
    const totalInvoiced = list.reduce((acc, p) => acc + (Number(p.totalInvoiceValue) || 0), 0);
    const totalReceived = list.reduce((acc, p) => acc + (Number(p.receivedAmount) || 0), 0);
    const totalTds = list.reduce((acc, p) => acc + (Number(p.tdsDeducted) || 0), 0);
    const totalBalance = list.reduce((acc, p) => acc + Math.max(0, Number(p.balanceAmount) || 0), 0);
    return {
      totalCount: list.length,
      totalInvoiced,
      totalReceived,
      totalTds,
      totalBalance
    };
  }, [payments]);

  const handleAdd = () => {
    navigate('/agency/payment-realization-entry');
  };

  const handleEdit = (row: AgencyPayment) => {
    navigate('/agency/payment-realization-entry', { state: { payment: row, isEdit: true } });
  };

  const handleDelete = (row: AgencyPayment) => {
    setPaymentToDelete(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (paymentToDelete) {
      await dispatch(deleteAgencyPayment(Number(paymentToDelete.id)));
      loadData();
    }
    setIsDeleteModalOpen(false);
    setPaymentToDelete(null);
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
          const item: AgencyPayment = row.original;
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
        Header: 'Total Value',
        accessor: 'totalInvoiceValue',
        Cell: ({ value }: { value: number }) => (
          <span className="text-xs font-semibold text-gray-900 font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'TDS 0.1% (194Q)',
        accessor: 'tdsDeducted',
        Cell: ({ value }: { value: number }) => (
          <span className="text-xs text-purple-700 font-medium font-mono">
            {value > 0 ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '-'}
          </span>
        )
      },
      {
        Header: 'Received Amount',
        accessor: 'receivedAmount',
        Cell: ({ value }: { value: number }) => (
          <span className="text-xs font-bold text-emerald-700 font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'Balance Pending',
        accessor: 'balanceAmount',
        Cell: ({ value }: { value: number }) => (
          <span
            className={`text-xs font-bold font-mono ${
              value > 5 ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            {value > 5 ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '₹0.00'}
          </span>
        )
      },
      {
        Header: 'Payment Mode / Ref',
        accessor: 'referenceNo',
        Cell: ({ value, row }: any) => {
          const item: AgencyPayment = row.original;
          return (
            <div className="text-xs">
              <span className="font-semibold text-gray-800">{item.paymentMode}</span>
              <div className="text-[10px] text-gray-500 font-mono">{value}</div>
            </div>
          );
        }
      },
      {
        Header: 'Cheque/Pay Date',
        accessor: 'paymentDate',
        Cell: ({ value }: { value: string }) => (
          <span className="text-xs text-gray-600 font-mono">{value || '-'}</span>
        )
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }: { value: string }) => {
          const colorMap: Record<string, string> = {
            'Fully Settled': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Partially Settled': 'bg-amber-50 text-amber-700 border-amber-200',
            'Pending Settlement': 'bg-red-50 text-red-700 border-red-200'
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IndianRupee className="w-7 h-7 text-emerald-600" />
            Payment Realization & TDS Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit buyer payments to mills, TDS u/s 194Q deductions, credit adjustments & pending settlement balance.
          </p>
        </div>

        <Button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-primary hover:bg-primary text-white font-medium px-4 py-2 rounded-lg shadow-sm cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Record Payment</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <span className="font-bold text-lg font-mono">₹</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Invoiced</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{formatSummaryAmount(summary.totalInvoiced)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Realized in Bank</p>
            <p className="text-xl font-bold text-emerald-700">
              ₹{formatSummaryAmount(summary.totalReceived)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <span className="font-bold text-sm">194Q</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">TDS 0.1% Deducted</p>
            <p className="text-xl font-bold text-purple-800">
              ₹{summary.totalTds.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Pending Realization</p>
            <p className="text-xl font-bold text-red-600">
              ₹{formatSummaryAmount(summary.totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-gray-100 gap-3">
          <div className="flex space-x-2">
            {(['ALL', 'Fully Settled', 'Pending Settlement'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab === 'ALL' ? 'All Invoices' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <DataTable
            data={filteredPayments}
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
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && paymentToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Payment Realization"
          size="sm"
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">
                Are you sure you want to delete payment record for Invoice #{paymentToDelete.millInvoiceNo}?
              </p>
            </div>
            <p className="text-xs text-gray-600">
              Buyer: <span className="font-semibold">{paymentToDelete.buyerName}</span> | Received: <span className="font-semibold text-emerald-700">₹{paymentToDelete.receivedAmount.toLocaleString('en-IN')}</span>
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

export default AgencyPaymentRealizationPage;
