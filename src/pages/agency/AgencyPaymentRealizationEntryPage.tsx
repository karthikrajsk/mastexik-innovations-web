import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { createAgencyPayment, updateAgencyPayment } from '@/state/agencyPaymentSlice';
import { getAllAgencyDispatches } from '@/state/agencyDispatchSlice';
import { ArrowLeft, FileText, CreditCard, BadgePercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { toast } from 'react-toastify';
import { AgencyPayment, PaymentStatus } from '@/types/agency';
import { SELLERS_LIST, BUYERS_LIST } from '@/constants/agencyConstants';

export const AgencyPaymentRealizationEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const editPayment = (location.state as any)?.payment as AgencyPayment | undefined;
  const isEditMode = Boolean(editPayment);

  const { dispatches } = useSelector((state: RootState) => state.agencyDispatch);

  useEffect(() => {
    if (!dispatches || dispatches.length === 0) {
      dispatch(getAllAgencyDispatches({ fetchAll: true }));
    }
  }, [dispatch, dispatches]);

  const today = new Date().toISOString().split('T')[0];

  const dispatchOptions = useMemo(() => [
    { value: '', label: '-- Select Mill Invoice --' },
    ...(dispatches || []).map((d: any) => ({
      value: d.millInvoiceNo,
      label: `#${d.millInvoiceNo} - ${d.seller} → ${d.buyerName} (₹${(Number(d.totalValue) || 0).toLocaleString('en-IN')})`
    }))
  ], [dispatches]);

  // States
  const [millInvoiceNo, setMillInvoiceNo] = useState(editPayment?.millInvoiceNo || (dispatches?.[0]?.millInvoiceNo || ''));
  const [invoiceDate, setInvoiceDate] = useState(editPayment?.invoiceDate || today);
  const [seller, setSeller] = useState(editPayment?.seller || SELLERS_LIST[0]);
  const [buyerName, setBuyerName] = useState(editPayment?.buyerName || BUYERS_LIST[0]);
  const [construction, setConstruction] = useState(editPayment?.construction || '');
  const [totalInvoiceValue, setTotalInvoiceValue] = useState<number | ''>(editPayment?.totalInvoiceValue || '');
  const [tdsDeducted, setTdsDeducted] = useState<number | ''>(editPayment?.tdsDeducted || '');
  const [receivedAmount, setReceivedAmount] = useState<number | ''>(editPayment?.receivedAmount || '');
  const [debitNotes, setDebitNotes] = useState<number | ''>(editPayment?.debitNotes || 0);
  const [paymentDate, setPaymentDate] = useState(editPayment?.paymentDate || today);
  const [paymentMode, setPaymentMode] = useState<AgencyPayment['paymentMode']>(editPayment?.paymentMode || 'RTGS / NEFT');
  const [referenceNo, setReferenceNo] = useState(editPayment?.referenceNo || '');
  const [status, setStatus] = useState<PaymentStatus>(editPayment?.status || 'Fully Settled');
  const [remarks, setRemarks] = useState(editPayment?.remarks || '');

  // Select dispatch to auto-populate invoice value, mill, buyer, construction, TDS 0.1%
  const handleSelectDispatch = (invNo: string) => {
    setMillInvoiceNo(invNo);
    const matched = (dispatches || []).find((d: any) => d.millInvoiceNo === invNo);
    if (matched) {
      setInvoiceDate(matched.invoiceDate);
      setSeller(matched.seller);
      setBuyerName(matched.buyerName);
      setConstruction(matched.construction);
      setTotalInvoiceValue(matched.totalValue);
      // Auto-calc TDS 0.1% on taxable
      const tds = Math.round((Number(matched.taxableValue) || 0) * 0.001 * 100) / 100;
      setTdsDeducted(tds);
      const expectedRec = Math.round(((Number(matched.totalValue) || 0) - tds) * 100) / 100;
      setReceivedAmount(expectedRec);
    }
  };

  const calculatedBalance = useMemo(() => {
    const tot = Number(totalInvoiceValue) || 0;
    const tds = Number(tdsDeducted) || 0;
    const rec = Number(receivedAmount) || 0;
    const deb = Number(debitNotes) || 0;
    return Math.round((tot - tds - rec - deb) * 100) / 100;
  }, [totalInvoiceValue, tdsDeducted, receivedAmount, debitNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!millInvoiceNo.trim()) {
      toast.error('Please enter the Mill Invoice Number.');
      return;
    }
    if (!totalInvoiceValue || Number(totalInvoiceValue) <= 0) {
      toast.error('Please enter the Total Invoice Value.');
      return;
    }

    const computedStatus: PaymentStatus =
      calculatedBalance <= 5 ? 'Fully Settled' : (Number(receivedAmount) > 0 ? 'Partially Settled' : 'Pending Settlement');

    try {
      if (isEditMode && editPayment) {
        await dispatch(updateAgencyPayment({
          id: Number(editPayment.id),
          data: {
            millInvoiceNo,
            invoiceDate,
            seller,
            buyerName,
            construction,
            totalInvoiceValue: Number(totalInvoiceValue),
            tdsRate: 0.001,
            tdsDeducted: Number(tdsDeducted) || 0,
            receivedAmount: Number(receivedAmount) || 0,
            balanceAmount: calculatedBalance,
            debitNotes: Number(debitNotes) || 0,
            paymentDate,
            paymentMode,
            referenceNo,
            status: status || computedStatus,
            remarks
          }
        })).unwrap();
      } else {
        await dispatch(createAgencyPayment({
          millInvoiceNo,
          invoiceDate,
          seller,
          buyerName,
          construction,
          totalInvoiceValue: Number(totalInvoiceValue),
          tdsRate: 0.001,
          tdsDeducted: Number(tdsDeducted) || 0,
          receivedAmount: Number(receivedAmount) || 0,
          balanceAmount: calculatedBalance,
          debitNotes: Number(debitNotes) || 0,
          paymentDate,
          paymentMode,
          referenceNo,
          status: status || computedStatus,
          remarks
        })).unwrap();
      }

      navigate('/agency/payment-realization');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/agency/payment-realization')}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">
              {isEditMode ? 'Edit Payment Realization' : 'Payment Realization Entry'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Card 1: Invoice & Parties Linkage */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Invoice Reference & Parties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select Mill Invoice <span className="text-red-600">*</span>
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select Mill Invoice"
                    value={millInvoiceNo}
                    options={dispatchOptions}
                    onValueChange={(val) => handleSelectDispatch(val)}
                    onChange={(val: any) => handleSelectDispatch(typeof val === 'string' ? val : val?.target?.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Seller (Mill)</label>
                  <input
                    type="text"
                    value={seller}
                    onChange={e => setSeller(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Buyer Name</label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Construction / Item</label>
                  <input
                    type="text"
                    value={construction}
                    onChange={e => setConstruction(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Financial Realization Breakdown */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgePercent size={20} />
                Financial Realization & TDS 194Q
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Total Invoice Value (₹) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={totalInvoiceValue}
                    onChange={e => setTotalInvoiceValue(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Less: TDS 0.1% (194Q) (₹)
                  </label>
                  <input
                    type="number"
                    value={tdsDeducted}
                    onChange={e => setTdsDeducted(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 2053.84"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-semibold text-purple-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Received in Bank (₹) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={e => setReceivedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 2154481"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold text-emerald-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Debit Notes / Deduction (₹)</label>
                  <input
                    type="number"
                    value={debitNotes}
                    onChange={e => setDebitNotes(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Remaining Balance (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${calculatedBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className={`w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono font-bold ${
                      calculatedBalance > 5 ? 'text-red-600' : 'text-gray-700'
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Bank Instrument & Settlement */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} />
                Bank Instrument & Settlement Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Mode <span className="text-red-600">*</span>
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select Payment Mode"
                    value={paymentMode}
                    options={[
                      { value: "RTGS / NEFT", label: "RTGS / NEFT" },
                      { value: "LC Realization", label: "LC Realization" },
                      { value: "Cheque", label: "Cheque" },
                      { value: "Draft", label: "Demand Draft" },
                    ]}
                    onValueChange={(val) => setPaymentMode(val as any)}
                    onChange={(val: any) => setPaymentMode((typeof val === 'string' ? val : val?.target?.value) as any)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cheque / UTR / LC Ref <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={e => setReferenceNo(e.target.value)}
                    placeholder="e.g. SBI/LC/2026/0991"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Settlement Status</label>
                  <CommonSearchableSelect
                    placeholder="Select Status"
                    value={status}
                    options={[
                      { value: "Fully Settled", label: "Fully Settled" },
                      { value: "Partially Settled", label: "Partially Settled" },
                      { value: "Pending Settlement", label: "Pending Settlement" },
                    ]}
                    onValueChange={(val) => setStatus(val as PaymentStatus)}
                    onChange={(val: any) => setStatus((typeof val === 'string' ? val : val?.target?.value) as PaymentStatus)}
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="e.g. Received via State Bank of India into Mill account"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/agency/payment-realization')}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white px-6 font-semibold"
            >
              {isEditMode ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgencyPaymentRealizationEntryPage;
