import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { getAllCommissionStatements, recordCommissionPaymentReceipt } from '@/state/agencyCommissionSlice';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { BadgePercent, Printer, PlusCircle, CheckCircle2, CheckCircle } from 'lucide-react';
import { CommissionStatement } from '@/types/agency';
import { CommissionBillPrintModal } from '@/components/agency/CommissionBillPrintModal';
import { toast } from 'react-toastify';

const formatSummaryAmount = (amount: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(amount);

export const AgencyCommissionStatementPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { statements, loading } = useSelector((state: RootState) => state.agencyCommission);
  const [activeTab, setActiveTab] = useState<'ALL' | 'Billed' | 'Paid'>('ALL');
  const [selectedStatementForPrint, setSelectedStatementForPrint] = useState<CommissionStatement | null>(null);

  // Payment Receipt Modal states
  const [selectedStatementForPayment, setSelectedStatementForPayment] = useState<CommissionStatement | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'RTGS / NEFT' | 'Cheque' | 'Demand Draft'>('RTGS / NEFT');
  const [utrRefNo, setUtrRefNo] = useState('');
  const [bankAccount, setBankAccount] = useState('Canara Bank - CA 0921029100');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  const loadData = () => {
    dispatch(getAllCommissionStatements({ fetchAll: true }));
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const filteredStatements = useMemo(() => {
    const list: any[] = statements || [];
    if (activeTab === 'ALL') return list;
    return list.filter((s: any) => s.status === activeTab);
  }, [statements, activeTab]);

  // Summary Metrics
  const summary = useMemo(() => {
    const list: any[] = statements || [];
    const totalTurnover = list.reduce((acc, s) => acc + (Number(s.totalTurnoverEligible) || 0), 0);
    const grossCommission = list.reduce((acc, s) => acc + (Number(s.grossCommission) || 0), 0);
    const totalGst = list.reduce((acc, s) => acc + (Number(s.cgstAmount) || 0) + (Number(s.sgstAmount) || 0) + (Number(s.igstAmount) || 0), 0);
    const totalReceivable = list.reduce((acc, s) => acc + (Number(s.netReceivable) || 0), 0);

    return {
      totalBills: list.length,
      totalTurnover,
      grossCommission,
      totalGst,
      totalReceivable
    };
  }, [statements]);

  const handleAdd = () => {
    navigate('/agency/commission-statement-entry');
  };

  const handlePrint = (row: CommissionStatement) => {
    setSelectedStatementForPrint(row);
  };

  const handleOpenPayment = (statement: CommissionStatement) => {
    setSelectedStatementForPayment(statement);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('RTGS / NEFT');
    setUtrRefNo('');
    setBankAccount('Canara Bank - CA 0921029100');
    setPaymentRemarks(`Brokerage payment received from ${statement.seller}`);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatementForPayment) return;
    if (!utrRefNo.trim()) {
      toast.error('Please enter UTR / Cheque / Bank Reference Number');
      return;
    }

    try {
      await dispatch(recordCommissionPaymentReceipt({
        id: Number(selectedStatementForPayment.id),
        data: {
          paymentReceivedDate: paymentDate,
          paymentMode,
          referenceNo: utrRefNo,
          bankAccount,
          remarks: paymentRemarks || `Brokerage received on ${paymentDate} via ${paymentMode} (Ref: ${utrRefNo})`
        }
      })).unwrap();

      loadData();
      setSelectedStatementForPayment(null);
    } catch (err) {
      console.error(err);
    }
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
        Header: 'Bill Statement No',
        accessor: 'statementNo',
        Cell: ({ value, row }: any) => {
          const item: CommissionStatement = row.original;
          return (
            <div>
              <span className="font-bold text-gray-900 font-mono text-xs">
                {value}
              </span>
              <div className="text-[10px] text-gray-400 font-mono">{item.statementDate}</div>
            </div>
          );
        }
      },
      {
        Header: 'Billed To Mill',
        accessor: 'seller',
        Cell: ({ value }: { value: string }) => (
          <span className="font-bold text-gray-900 text-xs">{value}</span>
        )
      },
      {
        Header: 'Period',
        accessor: 'period',
        Cell: ({ value }: { value: string }) => (
          <span className="text-xs text-indigo-900 font-medium">{value}</span>
        )
      },
      {
        Header: 'Eligible Turnover',
        accessor: 'totalTurnoverEligible',
        Cell: ({ value }: { value: number }) => (
          <span className="text-xs text-gray-800 font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'Gross Comm (1%)',
        accessor: 'grossCommission',
        Cell: ({ value }: { value: number }) => (
          <span className="text-xs font-semibold text-emerald-800 font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'GST (18%)',
        accessor: 'totalBillAmount',
        Cell: ({ row }: any) => {
          const item: CommissionStatement = row.original;
          const gst = item.cgstAmount + item.sgstAmount + item.igstAmount;
          return (
            <span className="text-xs text-gray-600 font-mono">
              ₹{gst ? gst.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
            </span>
          );
        }
      },
      {
        Header: 'TDS 194H (5%)',
        accessor: 'tds194HAmount',
        Cell: ({ value }: { value: number }) => (
          <span className="text-xs text-purple-700 font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'Net Receivable',
        accessor: 'netReceivable',
        Cell: ({ value }: { value: number }) => (
          <span className="text-xs font-bold text-indigo-900 font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }: { value: string }) => {
          const colorMap: Record<string, string> = {
            'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Billed': 'bg-blue-50 text-blue-700 border-blue-200',
            'Draft': 'bg-gray-50 text-gray-700 border-gray-200'
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
      },
      {
        Header: 'Action',
        accessor: 'id',
        disableFilters: true,
        Cell: ({ row }: any) => {
          const item: CommissionStatement = row.original;
          const isPaid = item.status === 'Paid';

          return (
            <div className="flex items-center space-x-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePrint(item)}
                className="flex items-center space-x-1 text-xs py-1 px-2 cursor-pointer border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                title="Print Formal Bill"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                <span>Print</span>
              </Button>

              {!isPaid ? (
                <Button
                  size="sm"
                  onClick={() => handleOpenPayment(item)}
                  className="flex items-center space-x-1 text-xs py-1 px-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                  title="Mark Payment as Received from Mill"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Mark Paid</span>
                </Button>
              ) : (
                <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                  Paid {item.paymentReceivedDate ? `(${item.paymentReceivedDate})` : ''}
                </span>
              )}
            </div>
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
            <BadgePercent className="w-7 h-7 text-indigo-600" />
            Commission Statement & Tax Invoicing
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Formal brokerage bills generated to textile mills with 18% GST calculation, TDS 194H deduction & printable tax invoice.
          </p>
        </div>

        <Button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate Commission Bill</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <span className="font-bold text-lg font-mono">₹</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Eligible Turnover</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{formatSummaryAmount(summary.totalTurnover)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <BadgePercent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Gross Commission</p>
            <p className="text-xl font-bold text-emerald-700">
              ₹{summary.grossCommission.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <span className="font-bold text-sm">18%</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">GST (SAC 996111)</p>
            <p className="text-xl font-bold text-indigo-900">
              ₹{summary.totalGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Net Receivable</p>
            <p className="text-xl font-bold text-purple-900">
              ₹{summary.totalReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-gray-100 gap-3">
          <div className="flex space-x-2">
            {(['ALL', 'Billed', 'Paid'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab === 'ALL' ? 'All Statements' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <DataTable
            data={filteredStatements}
            columns={columns}
            showSearch={true}
            showColumnFilters={true}
            showExport={true}
            isShowPagination={true}
            initialPageSize={10}
            showActions={false}
          />
        </div>
      </div>

      {/* Print Modal */}
      {selectedStatementForPrint && (
        <CommissionBillPrintModal
          statement={selectedStatementForPrint}
          onClose={() => setSelectedStatementForPrint(null)}
        />
      )}

      {/* Record Payment Receipt Modal */}
      {selectedStatementForPayment && (
        <Modal
          isOpen={Boolean(selectedStatementForPayment)}
          onClose={() => setSelectedStatementForPayment(null)}
          title="Record Brokerage Payment Receipt from Mill"
          size="lg"
        >
          <form onSubmit={handleConfirmPayment} className="space-y-4 pt-2">
            <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Bill Statement No</p>
                <p className="text-sm font-bold font-mono text-indigo-900">{selectedStatementForPayment.statementNo}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Billed to: <span className="font-semibold text-gray-800">{selectedStatementForPayment.seller}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">Net Brokerage Receivable</p>
                <p className="text-xl font-bold font-mono text-emerald-700">
                  ₹{selectedStatementForPayment.netReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-purple-700 font-medium">After 5% TDS 194H deduction</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Received Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  <option value="RTGS / NEFT">RTGS / NEFT</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Demand Draft">Demand Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bank UTR / Cheque Ref No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AXIS/UTR/2026/88412"
                  value={utrRefNo}
                  onChange={(e) => setUtrRefNo(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deposited Bank Account
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Receipt Notes / Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Full brokerage settlement credited into Canara Bank A/c"
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedStatementForPayment(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Confirm Payment & Mark Paid
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AgencyCommissionStatementPage;
