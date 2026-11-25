import React from 'react';
import { CommissionStatement } from '@/types/agency';
import { Printer, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommissionBillPrintModalProps {
  statement: CommissionStatement;
  onClose: () => void;
}

export const CommissionBillPrintModal: React.FC<CommissionBillPrintModalProps> = ({
  statement,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-900">
              Commission Bill Preview — {statement.statementNo}
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
              {statement.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1" />
              <span>Print Bill</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div className="p-8 overflow-y-auto print:p-0 text-gray-900 text-xs">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-900 pb-4 mb-4">
            <h1 className="text-xl font-bold tracking-wider uppercase text-gray-950 font-serif">
              HAYAGREEVAS FABRICS PRIVATE LIMITED
            </h1>
            <p className="text-xs text-gray-600 font-sans mt-0.5">
              TEXTILE COMMISSION AGENTS & INDENTORS
            </p>
            <p className="text-[11px] text-gray-500 font-sans">
              SF No. 128, College Road, Tirupur - 641602, Tamil Nadu, India | GSTIN: 33AAACH1290P1Z2 | PAN: AAACH1290P
            </p>
            <div className="inline-block mt-2 px-4 py-1 border border-gray-900 font-bold uppercase tracking-widest text-xs bg-gray-50">
              COMMISSION STATEMENT / BROKERAGE BILL
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-4 border border-gray-300 p-3 mb-4 rounded-sm bg-gray-50/50">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Billed To (Mill / Supplier):</p>
              <p className="font-bold text-sm text-gray-950">{statement.seller}</p>
              <p className="text-gray-600 text-xs">{statement.sellerAddress || 'Palladam / Theni Unit'}</p>
              <p className="text-gray-600 text-xs mt-1">
                <span className="font-semibold">GSTIN:</span> {statement.sellerGst || '33AABCK1029P1Z8'}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div>
                <span className="text-gray-500 text-[11px]">Bill No: </span>
                <span className="font-bold text-xs font-mono">{statement.statementNo}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Date: </span>
                <span className="font-semibold text-xs font-mono">{statement.statementDate}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Billing Period: </span>
                <span className="font-semibold text-xs text-indigo-900">{statement.period}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Service SAC Code: </span>
                <span className="font-mono text-xs font-semibold">{statement.sacCode}</span>
              </div>
            </div>
          </div>

          {/* Annexure Table of Invoices */}
          <div className="mb-4">
            <h3 className="font-bold text-xs uppercase tracking-wide text-gray-800 mb-1 border-b pb-1">
              Annexure: Dispatched Invoices Summary
            </h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100 font-semibold text-gray-700">
                  <th className="border border-gray-300 p-1.5 text-center w-10">S.No</th>
                  <th className="border border-gray-300 p-1.5 text-left">Mill Inv No</th>
                  <th className="border border-gray-300 p-1.5 text-center">Inv Date</th>
                  <th className="border border-gray-300 p-1.5 text-left">Buyer Name</th>
                  <th className="border border-gray-300 p-1.5 text-left">Construction</th>
                  <th className="border border-gray-300 p-1.5 text-right">Mtrs</th>
                  <th className="border border-gray-300 p-1.5 text-right">Taxable Turnover (₹)</th>
                  <th className="border border-gray-300 p-1.5 text-right">Comm (1%)</th>
                </tr>
              </thead>
              <tbody>
                {statement.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{index + 1}</td>
                    <td className="border border-gray-300 p-1.5 font-mono font-bold">#{item.millInvoiceNo}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{item.invoiceDate}</td>
                    <td className="border border-gray-300 p-1.5 font-medium">{item.buyerName}</td>
                    <td className="border border-gray-300 p-1.5 font-mono text-[11px]">{item.construction}</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono">{item.mtrs.toLocaleString()}</td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono font-medium">
                      ₹{item.taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-right font-mono font-bold text-emerald-700">
                      ₹{item.commissionAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={5} className="border border-gray-300 p-1.5 text-right">Total:</td>
                  <td className="border border-gray-300 p-1.5 text-right font-mono">
                    {statement.items.reduce((acc, i) => acc + i.mtrs, 0).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-right font-mono">
                    ₹{statement.totalTurnoverEligible.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-right font-mono text-emerald-800">
                    ₹{statement.grossCommission.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tax Calculation Box */}
          <div className="flex justify-end mb-6">
            <div className="w-80 border border-gray-300 rounded p-3 space-y-1.5 bg-gray-50 text-xs">
              <div className="flex justify-between font-medium">
                <span>Gross Commission @ {(statement.commissionRate * 100).toFixed(2)}%:</span>
                <span className="font-mono font-bold">
                  ₹{statement.grossCommission.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST @ 9%:</span>
                <span className="font-mono">
                  ₹{statement.cgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST @ 9%:</span>
                <span className="font-mono">
                  ₹{statement.sgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1 border-gray-300 text-sm">
                <span>Total Bill Amount (incl. GST):</span>
                <span className="font-mono text-indigo-900">
                  ₹{statement.totalBillAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-purple-800 pt-1 border-t border-dashed">
                <span>Less: TDS u/s 194H (5% on Comm):</span>
                <span className="font-mono font-bold">
                  - ₹{statement.tds194HAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800 border-t-2 border-gray-900 pt-1 text-sm bg-emerald-50/50 p-1 rounded">
                <span>Net Amount Receivable:</span>
                <span className="font-mono">
                  ₹{statement.netReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Details & Signature */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-300 text-xs">
            <div>
              <p className="font-bold text-gray-900 mb-1">Bank Payment Details:</p>
              <p><span className="font-semibold text-gray-600">Account Name:</span> HAYAGREEVAS FABRICS PVT LTD</p>
              <p><span className="font-semibold text-gray-600">Bank:</span> Canara Bank, Tirupur Main Branch</p>
              <p><span className="font-semibold text-gray-600">A/C No:</span> 120003491820</p>
              <p><span className="font-semibold text-gray-600">IFSC Code:</span> CNRB0001200</p>
            </div>
            <div className="text-right flex flex-col justify-between">
              <div>
                <p className="font-bold text-gray-900">For HAYAGREEVAS FABRICS PRIVATE LIMITED</p>
                <p className="text-[11px] text-gray-500">Authorized Signatory</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-8">(This is a computer-generated tax invoice)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionBillPrintModal;
