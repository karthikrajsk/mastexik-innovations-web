import React from 'react';
import { X, Printer, Building2 } from 'lucide-react';
import { AgencyContract } from '@/types/agency';

interface IndentPrintModalProps {
  contract: AgencyContract | null;
  onClose: () => void;
}

export const IndentPrintModal: React.FC<IndentPrintModalProps> = ({ contract, onClose }) => {
  if (!contract) return null;

  const totalValue = contract.orderedQty * contract.numericRate;
  const commissionAmt = totalValue * contract.commissionRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in duration-150">
        
        {/* Top bar (Hidden in print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">3-Way Agency Indent Confirmation Sheet</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-8 print:p-0 text-slate-800 text-xs">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 text-center">
            <h2 className="text-xl font-extrabold tracking-wide text-slate-950">HAYAGREEVAS FABRICS PRIVATE LIMITED</h2>
            <p className="text-2xs text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
              Textile Indenting & Agency Division &bull; Intermediary Sales Contract
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-amber-100 border border-amber-300 rounded font-mono font-bold text-slate-900 text-2xs">
              OFFICIAL 3-WAY INDENT CONFIRMATION &bull; CONTRACT #{contract.contractNo}
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-2 gap-4 mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="border-r border-slate-200 pr-3">
              <span className="text-3xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Seller / Manufacturer</span>
              <div className="text-sm font-extrabold text-blue-900">{contract.seller}</div>
              <div className="text-2xs text-slate-600 mt-1">Delivery: Direct Ex-Mill to Buyer</div>
            </div>
            <div className="pl-2">
              <span className="text-3xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Buyer / Consignee</span>
              <div className="text-sm font-extrabold text-emerald-900">{contract.buyerName}</div>
              <div className="text-2xs text-slate-600 mt-1">PO Ref: <span className="font-mono font-semibold">{contract.poNo || "Pending"}</span></div>
            </div>
          </div>

          {/* Contract Terms Summary Grid */}
          <div className="grid grid-cols-4 gap-2 mb-5 text-2xs">
            <div className="p-2.5 bg-slate-100 rounded border border-slate-200">
              <span className="text-slate-500 block text-3xs font-bold uppercase">Contract Date</span>
              <span className="font-bold text-slate-900 font-mono">{contract.contractDate}</span>
            </div>
            <div className="p-2.5 bg-slate-100 rounded border border-slate-200">
              <span className="text-slate-500 block text-3xs font-bold uppercase">Payment Terms</span>
              <span className="font-bold text-slate-900">{contract.paymentTerms}</span>
            </div>
            <div className="p-2.5 bg-slate-100 rounded border border-slate-200">
              <span className="text-slate-500 block text-3xs font-bold uppercase">LC Open Status</span>
              <span className="font-bold text-blue-800">{contract.lcOpen}</span>
            </div>
            <div className="p-2.5 bg-slate-100 rounded border border-slate-200">
              <span className="text-slate-500 block text-3xs font-bold uppercase">Agreed Commission</span>
              <span className="font-bold text-amber-700">{(contract.commissionRate * 100).toFixed(2)}% on Basic</span>
            </div>
          </div>

          {/* Main Item Table */}
          <table className="w-full border-collapse border border-slate-300 mb-5 text-2xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="border border-slate-700 p-2 text-left">Quality / Construction</th>
                <th className="border border-slate-700 p-2 text-right">Ordered Qty</th>
                <th className="border border-slate-700 p-2 text-right">Rate / Mtr</th>
                <th className="border border-slate-700 p-2 text-right">C.D Rate</th>
                <th className="border border-slate-700 p-2 text-right">Taxable Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2.5 font-semibold text-slate-900">
                  {contract.construction}
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono font-bold">
                  {contract.orderedQty.toLocaleString()} Mtrs
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono font-bold text-blue-900">
                  ₹{contract.ratePerMtr}
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono text-slate-700">
                  {contract.cdRate ? `₹${contract.cdRate}` : "-"}
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono font-bold text-slate-950">
                  ₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold">
                <td className="border border-slate-300 p-2 text-left" colSpan={4}>
                  Estimated Brokerage / Commission Earned ({(contract.commissionRate * 100).toFixed(2)}%)
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono text-emerald-800">
                  ₹{commissionAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Delivery Schedule & Notes */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-6">
            <span className="font-bold text-slate-700 text-3xs uppercase tracking-wider block mb-1">Dispatch Schedule & Milestone Delivery:</span>
            <p className="text-slate-800 font-medium">{contract.despatchSchedule}</p>
          </div>

          {/* 3-Way Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center">
            <div className="border border-slate-200 rounded p-4 bg-slate-50/50">
              <span className="text-3xs uppercase font-bold text-slate-500 block mb-10">Seller Confirmation</span>
              <div className="border-t border-slate-400 pt-1 font-bold text-2xs text-slate-800">
                For {contract.seller}
              </div>
            </div>
            <div className="border border-slate-200 rounded p-4 bg-slate-50/50">
              <span className="text-3xs uppercase font-bold text-slate-500 block mb-10">Agency Brokerage</span>
              <div className="border-t border-slate-400 pt-1 font-bold text-2xs text-amber-800">
                For Hayagreevas Fabrics Pvt Ltd
              </div>
            </div>
            <div className="border border-slate-200 rounded p-4 bg-slate-50/50">
              <span className="text-3xs uppercase font-bold text-slate-500 block mb-10">Buyer Acceptance</span>
              <div className="border-t border-slate-400 pt-1 font-bold text-2xs text-slate-800">
                For {contract.buyerName}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
