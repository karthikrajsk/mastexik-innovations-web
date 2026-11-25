import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { getAllAgencyDispatches } from '@/state/agencyDispatchSlice';
import { getAllAgencyPayments } from '@/state/agencyPaymentSlice';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Calendar, MessageSquare, CheckCircle2 } from 'lucide-react';
import { BuyerOutstanding } from '@/types/agency';
import { calculateAgeing } from '@/constants/agencyConstants';
import { toast } from 'react-toastify';

export const AgencyBuyerOutstandingPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { dispatches, loading: loadingDispatches } = useSelector((state: RootState) => state.agencyDispatch);
  const { payments, loading: loadingPayments } = useSelector((state: RootState) => state.agencyPayment);

  const [bucketFilter, setBucketFilter] = useState<'ALL' | '0-30 Days' | '31-60 Days' | '61-90 Days' | '>90 Days'>('ALL');
  const [selectedBuyer, setSelectedBuyer] = useState<'ALL' | string>('ALL');

  // Follow-up modal & local persistence
  const [followUpNotes, setFollowUpNotes] = useState<Record<string, { remarks: string; promiseDate?: string; lastReminderDate?: string }>>(() => {
    try {
      const stored = localStorage.getItem('hfpl_buyer_followup_notes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [selectedRecordForFollowUp, setSelectedRecordForFollowUp] = useState<BuyerOutstanding | null>(null);
  const [followUpRemarks, setFollowUpRemarks] = useState('');
  const [promiseDate, setPromiseDate] = useState('');

  useEffect(() => {
    dispatch(getAllAgencyDispatches({ fetchAll: true }));
    dispatch(getAllAgencyPayments({ fetchAll: true }));
  }, [dispatch]);

  // Dynamically compute Buyer Outstanding from live Dispatches and Payments
  const records: BuyerOutstanding[] = useMemo(() => {
    const dispatchList: any[] = dispatches || [];
    const paymentList: any[] = payments || [];

    const computedList: BuyerOutstanding[] = [];

    dispatchList.forEach((d, idx) => {
      const invNo = String(d.millInvoiceNo || '').trim();
      const matchingPayments = paymentList.filter(
        (p: any) => String(p.millInvoiceNo || '').trim() === invNo
      );

      const totalReceived = matchingPayments.reduce((acc, p) => acc + (Number(p.receivedAmount) || 0), 0);
      const totalTds = matchingPayments.reduce((acc, p) => acc + (Number(p.tdsDeducted) || 0), 0);
      const totalDebit = matchingPayments.reduce((acc, p) => acc + (Number(p.debitNotes) || 0), 0);
      const totalSettled = totalReceived + totalTds + totalDebit;

      const totalInvoiceVal = Number(d.totalValue) || 0;
      const outstanding = Math.round((totalInvoiceVal - totalSettled) * 100) / 100;

      // Only show if there is an active outstanding balance
      if (outstanding > 1) {
        const { noOfDays, ageingBucket } = calculateAgeing(d.invoiceDate);
        const note = followUpNotes[invNo];

        computedList.push({
          id: `out-${d.id || idx}`,
          sNo: computedList.length + 1,
          buyerName: d.buyerName || 'Unknown Buyer',
          seller: d.seller || 'Unknown Seller',
          invoiceNo: invNo,
          invoiceDate: d.invoiceDate,
          construction: d.construction || '-',
          quantityMtrs: Number(d.dispatchedMtrs) || 0,
          taxableValue: Number(d.taxableValue) || 0,
          gstValue: Number(d.gstValue) || 0,
          totalValue: totalInvoiceVal,
          lessTds: totalTds,
          noOfDays,
          ageingBucket,
          outstandingAmount: outstanding,
          lastReminderDate: note?.lastReminderDate,
          followUpRemarks: note?.remarks || d.remarks,
          promiseToPayDate: note?.promiseDate
        });
      }
    });

    return computedList;
  }, [dispatches, payments, followUpNotes]);

  const buyersList = useMemo(() => {
    return Array.from(new Set(records.map(r => r.buyerName)));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchBucket = bucketFilter === 'ALL' || r.ageingBucket === bucketFilter;
      const matchBuyer = selectedBuyer === 'ALL' || r.buyerName === selectedBuyer;
      return matchBucket && matchBuyer;
    });
  }, [records, bucketFilter, selectedBuyer]);

  // KPI calculations
  const summary = useMemo(() => {
    const totalOutstanding = records.reduce((acc, r) => acc + r.outstandingAmount, 0);
    const bucket0to30 = records
      .filter(r => r.ageingBucket === '0-30 Days')
      .reduce((acc, r) => acc + r.outstandingAmount, 0);
    const bucket31to60 = records
      .filter(r => r.ageingBucket === '31-60 Days')
      .reduce((acc, r) => acc + r.outstandingAmount, 0);
    const bucket61plus = records
      .filter(r => r.ageingBucket === '61-90 Days' || r.ageingBucket === '>90 Days')
      .reduce((acc, r) => acc + r.outstandingAmount, 0);

    return {
      totalInvoices: records.length,
      totalOutstanding,
      bucket0to30,
      bucket31to60,
      bucket61plus
    };
  }, [records]);

  const handleOpenFollowUp = (row: BuyerOutstanding) => {
    setSelectedRecordForFollowUp(row);
    setFollowUpRemarks(row.followUpRemarks || '');
    setPromiseDate(row.promiseToPayDate || '');
  };

  const handleSaveFollowUp = () => {
    if (selectedRecordForFollowUp) {
      const today = new Date().toISOString().split('T')[0];
      const updatedNotes = {
        ...followUpNotes,
        [selectedRecordForFollowUp.invoiceNo]: {
          remarks: followUpRemarks,
          promiseDate: promiseDate || undefined,
          lastReminderDate: today
        }
      };
      setFollowUpNotes(updatedNotes);
      try {
        localStorage.setItem('hfpl_buyer_followup_notes', JSON.stringify(updatedNotes));
      } catch (e) {
        // Ignore localStorage error
      }
      toast.success(`Follow-up saved for Invoice #${selectedRecordForFollowUp.invoiceNo}!`);
      setSelectedRecordForFollowUp(null);
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
        Header: 'Buyer Name',
        accessor: 'buyerName',
        Cell: ({ value }: { value: string }) => (
          <span className="font-bold text-gray-900 text-xs">{value}</span>
        )
      },
      {
        Header: 'Mill / Supplier',
        accessor: 'seller',
        Cell: ({ value }: { value: string }) => (
          <span className="text-xs text-indigo-800 font-medium">{value}</span>
        )
      },
      {
        Header: 'Invoice No',
        accessor: 'invoiceNo',
        Cell: ({ value, row }: any) => {
          const item: BuyerOutstanding = row.original;
          return (
            <div>
              <span className="font-bold font-mono text-gray-900 text-xs">
                #{value}
              </span>
              <div className="text-[10px] text-gray-400 font-mono">{item.invoiceDate}</div>
            </div>
          );
        }
      },
      {
        Header: 'Construction',
        accessor: 'construction',
        Cell: ({ value }: { value: string }) => (
          <span className="text-xs text-gray-600 truncate block font-mono max-w-[180px]" title={value}>
            {value}
          </span>
        )
      },
      {
        Header: 'Total Value',
        accessor: 'totalValue',
        Cell: ({ value }: { value: number }) => (
          <span className="text-xs text-gray-700 font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'Days Overdue',
        accessor: 'noOfDays',
        Cell: ({ value }: { value: number }) => {
          let badge = 'bg-blue-50 text-blue-700 border-blue-200';
          if (value > 60) badge = 'bg-red-50 text-red-700 border-red-300 font-bold';
          else if (value > 30) badge = 'bg-amber-50 text-amber-700 border-amber-300 font-semibold';
          return (
            <span className={`px-2 py-0.5 text-xs rounded-full border inline-block font-mono ${badge}`}>
              {value} Days
            </span>
          );
        }
      },
      {
        Header: 'Ageing Bucket',
        accessor: 'ageingBucket',
        Cell: ({ value }: { value: string }) => (
          <span className="text-xs font-semibold text-gray-800">{value}</span>
        )
      },
      {
        Header: 'Outstanding Amount',
        accessor: 'outstandingAmount',
        Cell: ({ value }: { value: number }) => (
          <span className="text-xs font-bold text-red-600 font-mono">
            ₹{value ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}
          </span>
        )
      },
      {
        Header: 'Follow-up / Remarks',
        accessor: 'followUpRemarks',
        Cell: ({ value, row }: any) => {
          const item: BuyerOutstanding = row.original;
          return (
            <div className="max-w-[200px]">
              {value ? (
                <p className="text-[11px] text-gray-800 line-clamp-2" title={value}>
                  {value}
                </p>
              ) : (
                <span className="text-[11px] text-gray-400 italic">No notes</span>
              )}
              {item.promiseToPayDate && (
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" /> PTP: {item.promiseToPayDate}
                </span>
              )}
            </div>
          );
        }
      },
      {
        Header: 'Action',
        accessor: 'id',
        disableFilters: true,
        Cell: ({ row }: any) => {
          const item: BuyerOutstanding = row.original;
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenFollowUp(item)}
              className="flex items-center space-x-1 text-xs py-1 px-2 cursor-pointer border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              <span>Follow-up</span>
            </Button>
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
            <AlertCircle className="w-7 h-7 text-red-600" />
            Buyer Outstanding & Ageing Tracker
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Active overdue monitoring for agency collection follow-up, payment reminder logs & credit terms control.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Outstanding</p>
            <p className="text-xl font-bold text-red-600">
              ₹{(summary.totalOutstanding / 100000).toFixed(2)} <span className="text-xs font-normal text-gray-500">Lakhs</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <span className="font-bold text-xs">0-30 D</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">0 - 30 Days (Regular)</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{(summary.bucket0to30 / 100000).toFixed(2)} <span className="text-xs font-normal text-gray-500">Lakhs</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <span className="font-bold text-xs">31-60 D</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">31 - 60 Days (Follow-up)</p>
            <p className="text-xl font-bold text-amber-600">
              ₹{(summary.bucket31to60 / 100000).toFixed(2)} <span className="text-xs font-normal text-gray-500">Lakhs</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <span className="font-bold text-xs">&gt;60 D</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">&gt;60 Days (Critical)</p>
            <p className="text-xl font-bold text-rose-700">
              ₹{(summary.bucket61plus / 100000).toFixed(2)} <span className="text-xs font-normal text-gray-500">Lakhs</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-gray-100 gap-3">
          {/* Ageing Tabs */}
          <div className="flex space-x-2">
            {(['ALL', '0-30 Days', '31-60 Days', '61-90 Days', '>90 Days'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setBucketFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  bucketFilter === tab
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab === 'ALL' ? 'All Ageing' : tab}
              </button>
            ))}
          </div>

          {/* Buyer Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-500 font-medium">Filter Buyer:</label>
            <select
              value={selectedBuyer}
              onChange={e => setSelectedBuyer(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg p-1.5 bg-white focus:ring-2 focus:ring-red-500"
            >
              <option value="ALL">All Buyers</option>
              {buyersList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4">
          <DataTable
            data={filteredRecords}
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

      {/* Follow-up / PTP Remarks Modal */}
      {selectedRecordForFollowUp && (
        <Modal
          isOpen={Boolean(selectedRecordForFollowUp)}
          onClose={() => setSelectedRecordForFollowUp(null)}
          title={`Follow-up Log: Inv #${selectedRecordForFollowUp.invoiceNo}`}
          size="md"
        >
          <div className="space-y-4 py-2">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">Buyer:</span>
                <p className="font-bold text-gray-900">{selectedRecordForFollowUp.buyerName}</p>
              </div>
              <div>
                <span className="text-gray-500">Mill:</span>
                <p className="font-bold text-gray-900">{selectedRecordForFollowUp.seller}</p>
              </div>
              <div>
                <span className="text-gray-500">Days Overdue:</span>
                <p className="font-bold text-red-600">{selectedRecordForFollowUp.noOfDays} Days</p>
              </div>
              <div>
                <span className="text-gray-500">Outstanding:</span>
                <p className="font-bold text-red-600 font-mono">
                  ₹{selectedRecordForFollowUp.outstandingAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Promise To Pay (PTP) Date
              </label>
              <input
                type="date"
                value={promiseDate}
                onChange={e => setPromiseDate(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Follow-up Notes / Discussion Details
              </label>
              <textarea
                rows={3}
                value={followUpRemarks}
                onChange={e => setFollowUpRemarks(e.target.value)}
                placeholder="e.g. Spoke with Accounts head Mr. Ramesh; payment promised next week."
                className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecordForFollowUp(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveFollowUp}
                className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                <span>Save Follow-up</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AgencyBuyerOutstandingPage;
