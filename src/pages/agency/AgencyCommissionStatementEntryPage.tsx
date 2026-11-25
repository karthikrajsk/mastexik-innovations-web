import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { createCommissionStatement, getAllCommissionStatements } from '@/state/agencyCommissionSlice';
import { getAllAgencyDispatches } from '@/state/agencyDispatchSlice';
import { getAllVendors } from '@/state/vendorSlice';
import { ArrowLeft, FileText, BadgePercent, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { toast } from 'react-toastify';
import { CommissionInvoiceItem } from '@/types/agency';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';

export const AgencyCommissionStatementEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const companyId = useResolvedCompanyId();

  const { dispatches } = useSelector((state: RootState) => state.agencyDispatch);
  const { statements } = useSelector((state: RootState) => state.agencyCommission);
  const { vendorList } = useSelector((state: RootState) => state.vendor);

  useEffect(() => {
    if (!dispatches || dispatches.length === 0) {
      dispatch(getAllAgencyDispatches({ fetchAll: true }));
    }
    if (!statements || statements.length === 0) {
      dispatch(getAllCommissionStatements({ fetchAll: true }));
    }
  }, [dispatch, dispatches, statements]);

  useEffect(() => {
    dispatch(getAllVendors({ fetchAll: true, companyId }));
  }, [dispatch, companyId]);

  const today = new Date().toISOString().split('T')[0];

  const defaultBillNo = useMemo(() => {
    const list = statements || [];
    const nextSeq = String(list.length + 1).padStart(3, '0');
    return `HFPL/COMM/2026-27/${nextSeq}`;
  }, [statements]);

  // Form states
  const [statementNo, setStatementNo] = useState(defaultBillNo);
  const [statementDate, setStatementDate] = useState(today);
  const [selectedSeller, setSelectedSeller] = useState('');
  const [period, setPeriod] = useState('Current Month Billing');
  const [commissionRate, setCommissionRate] = useState<number>(0.01); // 1%
  const [selectedDispatchIds, setSelectedDispatchIds] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('');

  const sellerOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();
    const vendors = Array.isArray(vendorList) ? vendorList : (vendorList as any)?.data || [];
    vendors
      .filter((vendor: any) => vendor.activeFlag !== false)
      .forEach((vendor: any) => {
        const name = String(vendor.vendorName || vendor.name || vendor.companyName || '').trim();
        if (name && !options.has(name)) {
          options.set(name, { value: name, label: name });
        }
      });
    return Array.from(options.values());
  }, [vendorList]);

  useEffect(() => {
    if (sellerOptions.length === 0) return;
    setSelectedSeller((currentSeller) => {
      if (sellerOptions.some((option) => option.value === currentSeller)) return currentSeller;
      return sellerOptions.find((option) => option.value === 'Kalaimagal Textiles')?.value
        || sellerOptions[0].value;
    });
  }, [sellerOptions]);

  // Available dispatches for this seller
  const sellerDispatches = useMemo(() => {
    return (dispatches || []).filter((d: any) => d.seller === selectedSeller);
  }, [dispatches, selectedSeller]);

  // Handle select all / toggle
  const toggleDispatch = (id: string | number) => {
    const strId = String(id);
    setSelectedDispatchIds(prev =>
      prev.includes(strId) ? prev.filter(x => x !== strId) : [...prev, strId]
    );
  };

  const selectAll = () => {
    if (sellerDispatches.length > 0 && selectedDispatchIds.length === sellerDispatches.length) {
      setSelectedDispatchIds([]);
    } else {
      setSelectedDispatchIds(sellerDispatches.map((d: any) => String(d.id)));
    }
  };

  // Selected Items & Calculations
  const selectedItems: CommissionInvoiceItem[] = useMemo(() => {
    return sellerDispatches
      .filter((d: any) => selectedDispatchIds.includes(String(d.id)))
      .map((d: any) => ({
        id: `c-item-${d.id}`,
        millInvoiceNo: d.millInvoiceNo,
        invoiceDate: d.invoiceDate,
        buyerName: d.buyerName,
        construction: d.construction,
        mtrs: Number(d.dispatchedMtrs) || 0,
        taxableValue: Number(d.taxableValue) || 0,
        commissionRate,
        commissionAmount: Math.round((Number(d.taxableValue) || 0) * commissionRate * 100) / 100
      }));
  }, [sellerDispatches, selectedDispatchIds, commissionRate]);

  const totalTurnoverEligible = useMemo(() => {
    return selectedItems.reduce((acc, i) => acc + (Number(i.taxableValue) || 0), 0);
  }, [selectedItems]);

  const grossCommission = useMemo(() => {
    return Math.round(totalTurnoverEligible * commissionRate * 100) / 100;
  }, [totalTurnoverEligible, commissionRate]);

  const cgstAmount = useMemo(() => Math.round(grossCommission * 0.09 * 100) / 100, [grossCommission]);
  const sgstAmount = useMemo(() => Math.round(grossCommission * 0.09 * 100) / 100, [grossCommission]);
  const totalBillAmount = useMemo(() => Math.round((grossCommission + cgstAmount + sgstAmount) * 100) / 100, [grossCommission, cgstAmount, sgstAmount]);
  const tds194HAmount = useMemo(() => Math.round(grossCommission * 0.05 * 100) / 100, [grossCommission]);
  const netReceivable = useMemo(() => Math.round((totalBillAmount - tds194HAmount) * 100) / 100, [totalBillAmount, tds194HAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDispatchIds.length) {
      toast.error('Please select at least one dispatched invoice to generate commission statement.');
      return;
    }
    if (!selectedSeller) {
      toast.error('Please select a Mill to bill.');
      return;
    }

    try {
      await dispatch(createCommissionStatement({
        statementNo,
        statementDate,
        seller: selectedSeller,
        sellerAddress: selectedSeller === 'Kalaimagal Textiles' ? 'SF No. 341/2, Palladam Road, Tirupur - 641604' : 'Kollampalayam, Theni District - 625531',
        sellerGst: selectedSeller === 'Kalaimagal Textiles' ? '33AABCK1029P1Z8' : '33AAACL2901Q1Z4',
        period,
        sacCode: '996111',
        totalTurnoverEligible,
        commissionRate,
        grossCommission,
        gstRate: 0.18,
        cgstAmount,
        sgstAmount,
        igstAmount: 0,
        totalBillAmount,
        tds194HRate: 0.05,
        tds194HAmount,
        netReceivable,
        status: 'Billed',
        items: selectedItems.map(item => ({
          millInvoiceNo: item.millInvoiceNo,
          dispatchInvoiceNo: item.millInvoiceNo,
          invoiceDate: item.invoiceDate,
          buyerName: item.buyerName,
          construction: item.construction,
          mtrs: item.mtrs,
          taxableValue: item.taxableValue,
          commissionRate: item.commissionRate,
          commissionAmount: item.commissionAmount
        })),
        remarks
      })).unwrap();

      navigate('/agency/commission-statement');
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
              onClick={() => navigate('/agency/commission-statement')}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">
              Generate Commission Statement
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Card 1: Bill Header & Mill Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Statement Information & Mill Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Statement No <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={statementNo}
                    onChange={e => setStatementNo(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bill Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={statementDate}
                    onChange={e => setStatementDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Billed To (Mill) <span className="text-red-600">*</span>
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select Mill / Supplier"
                    value={selectedSeller}
                    options={sellerOptions}
                    onValueChange={(val) => {
                      setSelectedSeller(val);
                      setSelectedDispatchIds([]);
                    }}
                    onChange={(val: any) => {
                      const s = typeof val === 'string' ? val : val?.target?.value;
                      setSelectedSeller(s);
                      setSelectedDispatchIds([]);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Billing Period</label>
                  <input
                    type="text"
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    placeholder="e.g. October 2026"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Select Dispatches to Include */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BadgePercent size={20} />
                Select Invoices for Commission Calculation ({selectedDispatchIds.length} Selected)
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
              >
                {selectedDispatchIds.length === sellerDispatches.length ? 'Deselect All' : 'Select All'}
              </Button>
            </CardHeader>
            <CardContent>
              {sellerDispatches.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No dispatches found for {selectedSeller}.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="border border-gray-300 p-2 text-center w-12">Select</th>
                        <th className="border border-gray-300 p-2 text-left">Mill Invoice No</th>
                        <th className="border border-gray-300 p-2 text-center">Invoice Date</th>
                        <th className="border border-gray-300 p-2 text-left">Buyer Name</th>
                        <th className="border border-gray-300 p-2 text-left">Construction</th>
                        <th className="border border-gray-300 p-2 text-right">Meters</th>
                        <th className="border border-gray-300 p-2 text-right">Rate / Mtr</th>
                        <th className="border border-gray-300 p-2 text-right">Taxable Turnover (₹)</th>
                        <th className="border border-gray-300 p-2 text-right">Est. Comm (1%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerDispatches.map(d => {
                        const isChecked = selectedDispatchIds.includes(String(d.id));
                        const comm = Math.round(d.taxableValue * commissionRate);
                        const meters = Number(d.dispatchedMtrs) || 0;
                        const ratePerMtr = meters > 0 ? (Number(d.taxableValue) || 0) / meters : 0;
                        return (
                          <tr
                            key={d.id}
                            onClick={() => toggleDispatch(d.id)}
                            className={`cursor-pointer transition-colors ${
                              isChecked ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="border border-gray-300 p-2 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDispatch(d.id)}
                                onClick={(event) => event.stopPropagation()}
                                className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                              />
                            </td>
                            <td className="border border-gray-300 p-2 font-mono font-bold text-gray-900">
                              #{d.millInvoiceNo}
                            </td>
                            <td className="border border-gray-300 p-2 text-center font-mono text-gray-600">
                              {d.invoiceDate}
                            </td>
                            <td className="border border-gray-300 p-2 font-medium text-gray-800">
                              {d.buyerName}
                            </td>
                            <td className="border border-gray-300 p-2 font-mono text-xs text-gray-600">
                              {d.construction}
                            </td>
                            <td className="border border-gray-300 p-2 text-right font-mono">
                              {meters.toLocaleString()}
                            </td>
                            <td className="border border-gray-300 p-2 text-right font-mono">
                              ₹{ratePerMtr.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                            <td className="border border-gray-300 p-2 text-right font-mono font-semibold text-gray-900">
                              ₹{d.taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="border border-gray-300 p-2 text-right font-mono font-bold text-emerald-700">
                              ₹{comm.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Computation & Tax Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator size={20} />
                Commission Bill Computation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <label className="block text-sm font-medium mb-1">Total Eligible Turnover (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${totalTurnoverEligible.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono font-bold text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gross Commission (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${grossCommission.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">GST 18% (9% CGST + 9% SGST)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${(cgstAmount + sgstAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Total Bill Amount (incl. GST)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${totalBillAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono font-bold text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Less: TDS 194H (5% on Comm)</label>
                  <input
                    type="text"
                    readOnly
                    value={`- ₹${tds194HAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono font-bold text-purple-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Net Amount Receivable (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${netReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono font-bold text-emerald-800"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="e.g. Brokerage bill for October yarn/fabric dispatches"
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
              onClick={() => navigate('/agency/commission-statement')}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white px-6 font-semibold"
            >
              Save & Issue Bill
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgencyCommissionStatementEntryPage;
