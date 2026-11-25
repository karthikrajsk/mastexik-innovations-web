import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { createAgencyContract, updateAgencyContract } from '@/state/agencyContractSlice';
import { getAllVendors } from '@/state/vendorSlice';
import { getAllCustomers } from '@/state/customerSlice';
import { getAllPaymentTerms } from '@/state/paymentTermsSlice';
import { ArrowLeft, FileText, BadgePercent, Truck, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { toast } from 'react-toastify';
import { AgencyContract, LcStatus } from '@/types/agency';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';

export const AgencyContractEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { contracts } = useSelector((state: RootState) => state.agencyContract);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
  const companyId = useResolvedCompanyId();

  const editContract = (location.state as any)?.contract as AgencyContract | undefined;
  const isEditMode = Boolean(editContract);

  const today = new Date().toISOString().split('T')[0];

  // Auto-generate Contract Number if creating new
  const defaultContractNo = useMemo(() => {
    if (editContract) return editContract.contractNo;
    const list = contracts || [];
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    const dateStr = `${day}.${month}.${year}`;
    const seq = list.length + 1;
    return `HFPL ${String(seq).padStart(3, '0')}/${dateStr}`;
  }, [editContract, contracts]);

  // Form States
  const [contractNo, setContractNo] = useState(editContract?.contractNo || defaultContractNo);
  const [contractNoManuallyEdited, setContractNoManuallyEdited] = useState(false);
  const [contractDate, setContractDate] = useState(editContract?.contractDate || today);
  const [seller, setSeller] = useState(editContract?.seller || '');
  const [buyerName, setBuyerName] = useState(editContract?.buyerName || '');
  const [construction, setConstruction] = useState(editContract?.construction || '');
  const [orderedQty, setOrderedQty] = useState<number | ''>(editContract?.orderedQty || '');
  const [pieceLength, setPieceLength] = useState<number | ''>(editContract?.pieceLength ?? '');
  const [packing, setPacking] = useState(editContract?.packing || '');
  const [paymentTerms, setPaymentTerms] = useState(editContract?.paymentTerms || '');
  const [ratePerMtr, setRatePerMtr] = useState<number | ''>(editContract?.numericRate || '');
  const [cdRate, setCdRate] = useState(editContract?.cdRate || '');
  const [poNo, setPoNo] = useState(editContract?.poNo || '');
  const [icilConfirm, setIcilConfirm] = useState(editContract?.icilConfirm || 'Confirmed');
  const [lcOpen, setLcOpen] = useState<LcStatus>(editContract?.lcOpen || 'OPENED');
  const [commissionRate, setCommissionRate] = useState<number>(editContract?.commissionRate || 0.01);
  const [despatchSchedule, setDespatchSchedule] = useState(editContract?.despatchSchedule || '');
  const [deliveryLocation, setDeliveryLocation] = useState(editContract?.deliveryLocation || '');
  const [remarks, setRemarks] = useState(editContract?.remarks || '');

  useEffect(() => {
    dispatch(getAllVendors({ fetchAll: true, companyId }));
    dispatch(getAllCustomers({ fetchAll: true }));
    dispatch(getAllPaymentTerms({ fetchAll: true }));
  }, [dispatch, companyId]);

  const sellerOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();
    const vendors = Array.isArray(vendorList) ? vendorList : (vendorList as any)?.data || [];
    vendors
      .filter((vendor: any) => vendor.activeFlag !== false)
      .forEach((vendor: any) => {
        const name = String(vendor.vendorName || vendor.name || vendor.companyName || '').trim();
        if (name && !options.has(name)) options.set(name, { value: name, label: name });
      });
    if (editContract?.seller && !options.has(editContract.seller)) {
      options.set(editContract.seller, { value: editContract.seller, label: editContract.seller });
    }
    return Array.from(options.values());
  }, [vendorList, editContract?.seller]);

  const buyerOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();
    const customers = Array.isArray(customerList) ? customerList : (customerList as any)?.data || [];
    customers
      .filter((customer: any) => customer.activeFlag !== false)
      .forEach((customer: any) => {
        const name = String(customer.customerName || customer.companyName || customer.name || '').trim();
        if (name && !options.has(name)) options.set(name, { value: name, label: name });
      });
    if (editContract?.buyerName && !options.has(editContract.buyerName)) {
      options.set(editContract.buyerName, { value: editContract.buyerName, label: editContract.buyerName });
    }
    return Array.from(options.values());
  }, [customerList, editContract?.buyerName]);

  const paymentTermOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();
    const terms = Array.isArray(paymentTermsList) ? paymentTermsList : (paymentTermsList as any)?.data || [];
    terms
      .filter((term: any) => term.activeFlag !== false)
      .forEach((term: any) => {
        const name = String(term.termName || '').trim();
        if (name && !options.has(name)) options.set(name, { value: name, label: name });
      });
    if (editContract?.paymentTerms && !options.has(editContract.paymentTerms)) {
      options.set(editContract.paymentTerms, {
        value: editContract.paymentTerms,
        label: editContract.paymentTerms
      });
    }
    return Array.from(options.values());
  }, [paymentTermsList, editContract?.paymentTerms]);

  // Computed Values
  const numericQty = Number(orderedQty) || 0;
  const numericPrice = Number(ratePerMtr) || 0;
  const computedTotalValue = numericQty * numericPrice;
  const computedCommission = computedTotalValue * commissionRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractNo || !seller || !buyerName || !numericQty || !numericPrice) {
      toast.error('Please fill in all mandatory fields: Contract No, Seller, Buyer, Quantity, Rate.');
      return;
    }

    if (companyId == null) {
      toast.error('Select a company before saving an agency contract.');
      return;
    }

    try {
      if (isEditMode && editContract) {
        await dispatch(updateAgencyContract({
          id: Number(editContract.id),
          data: {
            contractNo,
            contractDate,
            companyId,
            seller,
            buyerName,
            construction,
            orderedQty: numericQty,
            pieceLength: pieceLength === '' ? null : Number(pieceLength),
            packing: packing || null,
            balanceQty: numericQty - (editContract.suppliedQty || 0),
            despatchSchedule: despatchSchedule || 'Immediate',
            paymentTerms,
            ratePerMtr: `${numericPrice.toFixed(2)}+GST`,
            numericRate: numericPrice,
            cdRate: cdRate || 'Ex-mill',
            poNo: poNo || 'Pending',
            icilConfirm,
            lcOpen,
            commissionRate,
            deliveryLocation: deliveryLocation || 'Mill Ex-Factory',
            remarks
          }
        })).unwrap();
      } else {
        await dispatch(createAgencyContract({
          contractNo: contractNoManuallyEdited ? contractNo : '',
          contractDate,
          companyId,
          seller,
          buyerName,
          construction,
          orderedQty: numericQty,
          pieceLength: pieceLength === '' ? null : Number(pieceLength),
          packing: packing || null,
          suppliedQty: 0,
          balanceQty: numericQty,
          despatchSchedule: despatchSchedule || 'Immediate',
          paymentTerms,
          ratePerMtr: `${numericPrice.toFixed(2)}+GST`,
          numericRate: numericPrice,
          cdRate: cdRate || 'Ex-mill',
          poNo: poNo || 'Pending',
          icilConfirm,
          lcOpen,
          commissionRate,
          status: 'ACTIVE',
          deliveryLocation: deliveryLocation || 'Mill Ex-Factory',
          remarks
        })).unwrap();
      }

      navigate('/agency/order-status');
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
              onClick={() => navigate('/agency/order-status')}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">
              {isEditMode ? 'Edit Agency Sales Contract' : 'Agency Sales Contract Entry'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Card 1: Order & Contract Identification */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Contract & Parties Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    HFPL Contract No <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contractNo}
                    onChange={(e) => {
                      setContractNo(e.target.value);
                      setContractNoManuallyEdited(true);
                    }}
                    placeholder="e.g. HFPL 131/14.11.26"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contract Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Seller (Mill / Supplier) <span className="text-red-600">*</span>
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select Seller / Mill"
                    value={seller}
                    options={sellerOptions}
                    onValueChange={(val) => setSeller(val)}
                    onChange={(val: any) => setSeller(typeof val === 'string' ? val : val?.target?.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Buyer Name <span className="text-red-600">*</span>
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select Buyer"
                    value={buyerName}
                    options={buyerOptions}
                    onValueChange={(val) => setBuyerName(val)}
                    onChange={(val: any) => setBuyerName(typeof val === 'string' ? val : val?.target?.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Buyer PO Number</label>
                  <input
                    type="text"
                    value={poNo}
                    onChange={(e) => setPoNo(e.target.value)}
                    placeholder="e.g. 4200062140 / 04.07.2026"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">ICIL / Buyer Confirmation</label>
                  <CommonSearchableSelect
                    placeholder="Select Confirmation"
                    value={icilConfirm}
                    options={[
                      { value: "Confirmed", label: "Confirmed" },
                      { value: "Pending", label: "Pending" },
                      { value: "Under Review", label: "Under Review" },
                    ]}
                    onValueChange={(val) => setIcilConfirm(val)}
                    onChange={(val: any) => setIcilConfirm(typeof val === 'string' ? val : val?.target?.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">LC Opening Status</label>
                  <CommonSearchableSelect
                    placeholder="Select LC Status"
                    value={lcOpen}
                    options={[
                      { value: "OPENED", label: "OPENED (LC Confirmed)" },
                      { value: "PENDING", label: "PENDING (Awaiting LC Copy)" },
                      { value: "NA", label: "NA (Direct Credit / CAD / Advance)" },
                    ]}
                    onValueChange={(val) => setLcOpen(val as LcStatus)}
                    onChange={(val: any) => setLcOpen((typeof val === 'string' ? val : val?.target?.value) as LcStatus)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Payment Terms</label>
                  <CommonSearchableSelect
                    placeholder="Select Payment Terms"
                    value={paymentTerms}
                    options={paymentTermOptions}
                    onValueChange={(val) => setPaymentTerms(val)}
                    onChange={(val: any) => setPaymentTerms(typeof val === 'string' ? val : val?.target?.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Quality, Pricing & Commission */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgePercent size={20} />
                Quality & Commercials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Construction / Quality Specification
                  </label>
                  <input
                    type="text"
                    value={construction}
                    onChange={(e) => setConstruction(e.target.value)}
                    placeholder='e.g. 100x120/225x94/6-123" 8End Satin'
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Piece Length</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={pieceLength}
                    onChange={(e) => setPieceLength(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Packing</label>
                  <CommonSearchableSelect
                    placeholder="Select Packing"
                    value={packing}
                    options={[
                      { value: 'Roll', label: 'Roll' },
                      { value: 'Bale', label: 'Bale' }
                    ]}
                    onValueChange={(val) => setPacking(val)}
                    onChange={(val: any) => setPacking(typeof val === 'string' ? val : val?.target?.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ordered Quantity (Mtrs / Kgs) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={orderedQty}
                    onChange={(e) => setOrderedQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 150000"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contract Rate / Mtr (₹) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0.01}
                    value={ratePerMtr}
                    onChange={(e) => setRatePerMtr(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 518.00"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cash Discount (C.D.) Rate (₹)</label>
                  <input
                    type="text"
                    value={cdRate}
                    onChange={(e) => setCdRate(e.target.value)}
                    placeholder="e.g. 502.46 or Ex-mill"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Commission Rate</label>
                  <CommonSearchableSelect
                    placeholder="Select Commission Rate"
                    value={String(commissionRate)}
                    options={[
                      { value: "0.01", label: "1.00% (Standard Brokerage)" },
                      { value: "0.005", label: "0.50% (Yarn Special)" },
                      { value: "0.015", label: "1.50% (Fine Counts)" },
                      { value: "0.02", label: "2.00% (Special Sort)" },
                    ]}
                    onValueChange={(val) => setCommissionRate(Number(val))}
                    onChange={(val: any) => setCommissionRate(Number(typeof val === 'string' ? val : val?.target?.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Est. Basic Contract Value (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${computedTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono font-bold text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Est. Brokerage Receivable (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${computedCommission.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Logistics & Remarks */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck size={20} />
                Delivery Schedule & Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Dispatch Schedule</label>
                  <input
                    type="text"
                    value={despatchSchedule}
                    onChange={(e) => setDespatchSchedule(e.target.value)}
                    placeholder="e.g. Sep-5k, oct-60k, Nov-60k, 15th Dec-25k"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Delivery Destination / Mill Gate</label>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g. Kolhapur Plant / Erode Godown"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Remarks / Special Clauses</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Rate inclusive of packaging; freight extra"
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
              onClick={() => navigate('/agency/order-status')}
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

export default AgencyContractEntryPage;
