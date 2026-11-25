import React from 'react';
import { Truck, CreditCard, AlertCircle, Receipt, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaceholderProps {
  screenId: string;
}

export const AgencyScreenPlaceholder: React.FC<PlaceholderProps> = ({ screenId }) => {
  const navigate = useNavigate();

  const metaMap: Record<
    string,
    { title: string; subtitle: string; icon: React.ElementType; excelSheet: string; nextStep: string; columns: string[] }
  > = {
    'agency-dispatches': {
      title: 'Screen 2: Mill Dispatch & Invoice Tracking',
      subtitle: 'Record direct mill shipments to buyers with LR No, Meters & Non-inventory tracking',
      icon: Truck,
      excelSheet: 'LS Transaction details & Kalaimagal details (Columns A - I)',
      nextStep: 'Screen 2 (Next in Queue)',
      columns: ['Mill Invoice No', 'Invoice Date', 'Construction', 'Dispatched Mtrs', 'Taxable Value', 'GST Value', 'Total Value', 'Page No (Pg)']
    },
    'agency-payments': {
      title: 'Screen 3: Buyer Payment Realization Ledger',
      subtitle: 'Track buyer payments to mills, Section 194Q TDS deductions and balance reconciliation',
      icon: CreditCard,
      excelSheet: 'LS Transaction details & Kalaimagal details (Columns J - N)',
      nextStep: 'Screen 3',
      columns: ['Received Amount', 'Less TDS 0.1% (194Q)', 'Balance to be received', 'Debit Note Adjustments', 'Cheque No / UTR', 'Payment Date']
    },
    'agency-outstanding': {
      title: 'Screen 4: Buyer Outstanding & Ageing Follow-Up',
      subtitle: 'Real-time overdue calculation and payment follow-up ledger by buyer',
      icon: AlertCircle,
      excelSheet: 'Buyer Outstanding Sheet',
      nextStep: 'Screen 4 / Report',
      columns: ['Buyer Name', 'Invoice No', 'Invoice Date', 'Mtrs', 'Total Value', 'No of Days (Overdue count)', 'Outstanding Amount']
    },
    'agency-commission': {
      title: 'Screen 5: Commission Statement & Billing',
      subtitle: 'Automated commission bill generation, TDS Section 194H, and printable annexure statement',
      icon: Receipt,
      excelSheet: 'Commission Statement Sheet (Sheet 5)',
      nextStep: 'Screen 5',
      columns: ['Bill To Mill', 'Statement No', 'Date', 'Eligible Invoices List', 'Commission % (1% / 0.5%)', 'Gross Commission', 'TDS u/s 194H']
    },
    'agency-masters': {
      title: 'Master Screen: Agency & Commission Masters',
      subtitle: 'Register internal/external agents, PAN (for TDS), GSTIN, and default commission matrix',
      icon: Users,
      excelSheet: 'Masters Setup',
      nextStep: 'Master Screen',
      columns: ['Agent Code', 'Name', 'PAN (194H)', 'GSTIN', 'Default Rate %', 'Default Credit Days', 'Bank Account Details']
    }
  };

  const meta = metaMap[screenId] || metaMap['agency-dispatches'];
  const Icon = meta.icon;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
        
        {/* Icon & Badge */}
        <div className="inline-flex items-center justify-center p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-600">
          <Icon className="w-10 h-10" />
        </div>

        <div>
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-2xs font-bold uppercase tracking-wider mb-2">
            {meta.nextStep}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">{meta.title}</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">{meta.subtitle}</p>
        </div>

        {/* Excel Mapping Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left max-w-xl mx-auto space-y-2">
          <div className="flex items-center justify-between text-2xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Excel Source Sheet:</span>
            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {meta.excelSheet}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-600 text-2xs block mb-1.5">Mapped Data Columns:</span>
            <div className="flex flex-wrap gap-1.5">
              {meta.columns.map((col, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-white border border-slate-300 rounded text-3xs font-mono text-slate-700 font-medium"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => navigate('/agency/order-status')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            <span>Back to Screen 1: Order Status & Contracts</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
