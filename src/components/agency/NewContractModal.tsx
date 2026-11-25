import React, { useState } from 'react';
import { X, CheckCircle, FileText } from 'lucide-react';
import { AgencyContract, LcStatus } from '@/types/agency';
import { SELLERS_LIST, BUYERS_LIST } from '@/mock/agencyMockData';

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newContract: Omit<AgencyContract, 'id' | 'sNo'>) => void;
  nextContractNumber: string;
}

export const NewContractModal: React.FC<NewContractModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  nextContractNumber
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [contractNo, setContractNo] = useState(nextContractNumber);
  const [contractDate, setContractDate] = useState(today);
  const [seller, setSeller] = useState(SELLERS_LIST[0]);
  const [buyerName, setBuyerName] = useState(BUYERS_LIST[0]);
  const [construction, setConstruction] = useState('');
  const [orderedQty, setOrderedQty] = useState<number | ''>('');
  const [paymentTerms, setPaymentTerms] = useState('LC-90 days');
  const [ratePerMtr, setRatePerMtr] = useState<number | ''>('');
  const [cdRate, setCdRate] = useState('');
  const [poNo, setPoNo] = useState('');
  const [icilConfirm, setIcilConfirm] = useState('Confirmed');
  const [lcOpen, setLcOpen] = useState<LcStatus>('OPENED');
  const [commissionRate, setCommissionRate] = useState<number>(0.01);
  const [despatchSchedule, setDespatchSchedule] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNo || !seller || !buyerName || !construction || !orderedQty || !ratePerMtr) {
      alert("Please fill in all mandatory fields (Contract No, Seller, Buyer, Construction, Quantity, Rate).");
      return;
    }

    const numRate = Number(ratePerMtr);
    const numQty = Number(orderedQty);

    onSubmit({
      contractNo,
      contractDate,
      seller,
      buyerName,
      construction,
      orderedQty: numQty,
      suppliedQty: 0,
      balanceQty: numQty,
      despatchSchedule: despatchSchedule || "Immediate",
      paymentTerms,
      ratePerMtr: `${numRate.toFixed(2)}+GST`,
      numericRate: numRate,
      cdRate: cdRate || "Ex-mill",
      poNo: poNo || "Pending",
      icilConfirm,
      lcOpen,
      commissionRate,
      status: 'ACTIVE',
      deliveryLocation: deliveryLocation || "Mill Ex-Factory"
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-amber-500 p-1.5 rounded text-slate-950">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Create Agency Contract / Indent</h3>
              <p className="text-xs text-slate-400">Hayagreevas Fabrics Agency Brokerage Order Booking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Section 1: Parties & Contract Header */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-700 text-2xs uppercase tracking-wider">1. Contract & Parties Identification</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">HFPL Contract No *</label>
                <input
                  type="text"
                  required
                  value={contractNo}
                  onChange={(e) => setContractNo(e.target.value)}
                  placeholder="e.g. HFPL 131/14.11.26"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Contract Date *</label>
                <input
                  type="date"
                  required
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Seller (Mill / Manufacturer) *</label>
                <select
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-blue-900"
                >
                  {SELLERS_LIST.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="New Mill">-- Add Other Mill --</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Buyer / Consignee Name *</label>
                <select
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-emerald-900"
                >
                  {BUYERS_LIST.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="New Buyer">-- Add Other Buyer --</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Buyer PO No & Date</label>
                <input
                  type="text"
                  value={poNo}
                  onChange={(e) => setPoNo(e.target.value)}
                  placeholder="e.g. 4200062140 / 04.07.2026"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Construction & Quantity */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-700 text-2xs uppercase tracking-wider">2. Fabric Quality & Quantity</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Construction / Quality Description *</label>
                <input
                  type="text"
                  required
                  value={construction}
                  onChange={(e) => setConstruction(e.target.value)}
                  placeholder="e.g. 100x120/225x94/6-123 8End Satin"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Ordered Quantity (Mtrs / Kgs) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={orderedQty}
                  onChange={(e) => setOrderedQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 100000"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pricing, Commission & Terms */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-700 text-2xs uppercase tracking-wider">3. Pricing, Commercial Terms & Commission</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Rate / Mtr (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={ratePerMtr}
                  onChange={(e) => setRatePerMtr(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 518.00"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 font-mono font-bold text-blue-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">C.D Rate (Cash Discount)</label>
                <input
                  type="text"
                  value={cdRate}
                  onChange={(e) => setCdRate(e.target.value)}
                  placeholder="e.g. 502.46 or Ex-mill"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Commission Rate</label>
                <select
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value={0.01}>1.00% (Standard)</option>
                  <option value={0.005}>0.50% (Yarn/Low Margin)</option>
                  <option value={0.015}>1.50% (Special Sort)</option>
                  <option value={0.02}>2.00% (High Value)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="LC-90 days">LC-90 days</option>
                  <option value="LC-60 days">LC-60 days</option>
                  <option value="30 days">30 days</option>
                  <option value="45 days">45 days</option>
                  <option value="10 days">10 days</option>
                  <option value="21 days">21 days</option>
                  <option value="Immediate">Immediate / Advance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">LC Open Status</label>
                <select
                  value={lcOpen}
                  onChange={(e) => setLcOpen(e.target.value as LcStatus)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="OPENED">Opened (Active LC)</option>
                  <option value="PENDING">Pending Opening</option>
                  <option value="NA">Not Applicable (Credit/Direct)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Buyer Confirmation</label>
                <select
                  value={icilConfirm}
                  onChange={(e) => setIcilConfirm(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending Confirmation</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Dispatch Schedule / Delivery Milestones</label>
                <input
                  type="text"
                  value={despatchSchedule}
                  onChange={(e) => setDespatchSchedule(e.target.value)}
                  placeholder="e.g. Sep-5k, Oct-60k, Nov-60k, 15th Dec-25k"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save & Issue Contract</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
