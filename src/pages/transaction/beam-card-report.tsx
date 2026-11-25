import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { getAllVendors } from '@/state/vendorSlice';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';
import { fetchBeamsList } from '@/services/beamCardService';
import {
  fetchBeamInwardReport,
  BeamCardReportData,
  SizingInvoiceReportDetail
} from '@/services/beamCardReportService';
import { BeamSummary } from '@/types/beamCard';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Printer,
  RotateCw,
  FileText,
  ExternalLink,
  Eye,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  Loader2,
  Receipt,
  FileCheck,
  Scale,
  Gauge,
  X,
  FileDown
} from 'lucide-react';

export const BeamCardReportPage: React.FC = () => {
  const params = useParams<{ beamNo?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const companyId = useResolvedCompanyId();

  const { vendorList } = useSelector((state: RootState) => (state as any).vendor || { vendorList: [] });

  const [beamsList, setBeamsList] = useState<BeamSummary[]>([]);
  const [selectedBeamNo, setSelectedBeamNo] = useState<string>(params.beamNo || '');
  const [reportData, setReportData] = useState<BeamCardReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  // Load Vendor list for resolving vendor/mill names
  useEffect(() => {
    dispatch(getAllVendors({ fetchAll: true }));
  }, [dispatch]);

  // Load active beams list for dropdown selection
  const loadBeams = useCallback(async () => {
    try {
      const beams = await fetchBeamsList();
      setBeamsList(beams);
      if (!selectedBeamNo && beams.length > 0) {
        const initial = params.beamNo || beams[0].beamNo;
        setSelectedBeamNo(initial);
      }
    } catch (err) {
      console.error("Failed to load active beams list:", err);
    }
  }, [selectedBeamNo, params.beamNo]);

  useEffect(() => {
    loadBeams();
  }, [loadBeams]);

  // Update selected beam if URL parameter changes
  useEffect(() => {
    if (params.beamNo && params.beamNo !== selectedBeamNo) {
      setSelectedBeamNo(params.beamNo);
    }
  }, [params.beamNo]);

  // Load report data against the selected beam number
  const loadReport = useCallback(async (beamNo: string) => {
    if (!beamNo) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBeamInwardReport(beamNo, companyId);
      setReportData(data);
    } catch (err: any) {
      console.error("Error loading beam card report:", err);
      setError(err.message || "Failed to load report for the selected beam.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (selectedBeamNo) {
      loadReport(selectedBeamNo);
    }
  }, [selectedBeamNo, loadReport]);

  const handleSelectBeam = (beamNo: string) => {
    setSelectedBeamNo(beamNo);
    navigate(`/transaction/beam-card-report/${encodeURIComponent(beamNo)}`, { replace: true });
  };

  const handleRefresh = () => {
    loadBeams();
    if (selectedBeamNo) {
      loadReport(selectedBeamNo);
    }
    dispatch(getAllVendors({ fetchAll: true }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBackToBeamCard = () => {
    if (selectedBeamNo) {
      navigate(`/transaction/beam-card/${encodeURIComponent(selectedBeamNo)}`);
    } else {
      navigate('/transaction/beam-card');
    }
  };

  // Resolved vendor name from vendorList
  const resolvedVendorName = useMemo(() => {
    if (!reportData) return '-';
    if (reportData.sizingVendorId && Array.isArray(vendorList) && vendorList.length > 0) {
      const found = vendorList.find((v: any) =>
        Number(v.id || v.vendorId) === Number(reportData.sizingVendorId)
      );
      if (found) {
        return found.vendorName || found.name || reportData.sizingVendorName || '-';
      }
    }
    return reportData.sizingVendorName || '-';
  }, [reportData, vendorList]);

  // Dropdown options
  const beamOptions = useMemo(() => {
    const opts = beamsList.map(b => ({
      value: b.beamNo,
      label: `Beam ${b.beamNo} (Loom ${b.loomNo || '-'}, Sort ${b.sortCode || '-'})`
    }));

    if (selectedBeamNo && !opts.some(o => o.value === selectedBeamNo)) {
      opts.unshift({
        value: selectedBeamNo,
        label: `Beam ${selectedBeamNo}`
      });
    }

    return opts;
  }, [beamsList, selectedBeamNo]);

  // Total invoice amounts summary
  const invoiceTotals = useMemo(() => {
    if (!reportData?.invoiceDetails || reportData.invoiceDetails.length === 0) {
      return { cost: 0, gst: 0, net: 0 };
    }
    const cost = reportData.invoiceDetails.reduce((sum, inv) => sum + (Number(inv.sizingCost) || 0), 0);
    const gst = reportData.invoiceDetails.reduce((sum, inv) => sum + (Number(inv.gstAmount) || 0), 0);
    const net = reportData.invoiceDetails.reduce((sum, inv) => sum + (Number(inv.netTotal) || 0), 0);
    return {
      cost: Number(cost.toFixed(2)),
      gst: Number(gst.toFixed(2)),
      net: Number(net.toFixed(2))
    };
  }, [reportData?.invoiceDetails]);

  // Format currency
  const formatCurrency = (val?: number) => {
    if (val == null || isNaN(val)) return '₹0.00';
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-4 p-2 sm:p-4 font-sans max-w-7xl mx-auto">
      {/* Top Toolbar (Hidden on Print) */}
      <Card className="print:hidden border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleBackToBeamCard}
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 font-medium text-slate-700 hover:text-slate-900"
                title="Return to Beam Card"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Beam Card</span>
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-600" />
                  <span>Beam Card Inward & Sizing Invoice Report</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  View sizing invoice details, inward specifications & production metrics against Beam #{selectedBeamNo || '---'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                title="Reload report data"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </Button>

              <Button
                onClick={handlePrint}
                disabled={loading || !reportData}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 font-semibold"
                title="Print Report"
              >
                <Printer className="w-4 h-4" />
                <span>Print Report</span>
              </Button>
            </div>
          </div>

          {/* Beam Selector Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
            <div className="flex-1 max-w-md">
              <label className="block text-2xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                Select or Search Beam Number
              </label>
              <CommonSearchableSelect
                options={beamOptions}
                value={selectedBeamNo}
                onChange={(val) => handleSelectBeam(val)}
                placeholder="Search or Select Beam No..."
              />
            </div>

            {reportData && (
              <div className="flex items-center gap-2 sm:self-end pb-0.5">
                <span className="text-xs text-muted-foreground font-medium">Inward Status:</span>
                {reportData.inwardFound ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Inward Recorded ({reportData.beamInwardNo})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-2xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Inward Linked via Beam Gaiting</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-background rounded-lg border border-border shadow-2xs">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
          <p className="font-mono text-sm text-foreground font-semibold">Loading Beam Inward & Invoice Report...</p>
          <p className="text-xs text-muted-foreground mt-1">Fetching sizing invoice upload data, delivery challan details & production metrics</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="max-w-2xl mx-auto my-10 bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-md shadow-2xs flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm">Unable to load report</h3>
            <p className="text-xs mt-1">{error}</p>
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="destructive"
              className="mt-3 text-xs h-7"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Report Main Content Area */}
      {!loading && !error && reportData && (
        <div className="space-y-4 print:space-y-3">
          {/* Printable Official Header */}
          <div className="border border-slate-300 rounded-lg p-4 bg-white shadow-xs">
            <div className="text-center border-b border-slate-200 pb-3">
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-900">
                HAYAGREEVAS FABRICS PRIVATE LIMITED
              </h2>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mt-0.5">
                BEAM INWARD & SIZING INVOICE REPORT
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-2 text-2xs text-slate-600">
                <span><strong>Report Date:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                <span><strong>Target Beam:</strong> #{reportData.beamNo}</span>
                {reportData.matchedBeamDetail?.flangeNo && (
                  <span><strong>Flange No:</strong> #{reportData.matchedBeamDetail.flangeNo}</span>
                )}
                <span><strong>Loom:</strong> {reportData.beamCardData?.beamDetails.loomNo || '-'}</span>
              </div>
            </div>

            {/* Summary Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3">
              <div className="p-2.5 rounded-md bg-purple-50/60 border border-purple-100">
                <span className="block text-2xs font-semibold text-purple-700 uppercase">Sized Beam No</span>
                <span className="block text-sm sm:text-base font-bold text-purple-950 font-mono mt-0.5">
                  {reportData.beamNo}
                </span>
                <span className="text-2xs text-purple-600">
                  Flange: {reportData.matchedBeamDetail?.flangeNo || 'Standard'}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-blue-50/60 border border-blue-100">
                <span className="block text-2xs font-semibold text-blue-700 uppercase">Sizing Mill / Vendor</span>
                <span className="block text-xs sm:text-sm font-bold text-blue-950 truncate mt-0.5" title={resolvedVendorName}>
                  {resolvedVendorName}
                </span>
                <span className="text-2xs text-blue-600">
                  Rate: {reportData.sizingRate ? `₹${reportData.sizingRate}` : '-'}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-emerald-50/60 border border-emerald-100">
                <span className="block text-2xs font-semibold text-emerald-700 uppercase">Sizing Invoice No</span>
                <span className="block text-xs sm:text-sm font-bold text-emerald-950 font-mono mt-0.5">
                  {reportData.invoiceDetails[0]?.invNo || reportData.dcNumber || '-'}
                </span>
                <span className="text-2xs text-emerald-600">
                  Date: {reportData.invoiceDetails[0]?.invDate || reportData.dcDate || '-'}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-amber-50/60 border border-amber-100">
                <span className="block text-2xs font-semibold text-amber-700 uppercase">Total Sizing Cost (Net)</span>
                <span className="block text-sm sm:text-base font-bold text-amber-950 mt-0.5">
                  {formatCurrency(invoiceTotals.net || invoiceTotals.cost)}
                </span>
                <span className="text-2xs text-amber-700">
                  GST: {formatCurrency(invoiceTotals.gst)}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-indigo-50/60 border border-indigo-100 col-span-2 sm:col-span-1">
                <span className="block text-2xs font-semibold text-indigo-700 uppercase">Warp Length Received</span>
                <span className="block text-sm sm:text-base font-bold text-indigo-950 font-mono mt-0.5">
                  {(reportData.matchedBeamDetail?.wrapMeters || reportData.beamCardData?.beamDetails.warpLength || 0).toLocaleString()} Mtrs
                </span>
                <span className="text-2xs text-indigo-600">
                  Shrinkage: {reportData.matchedBeamDetail?.shrinkage != null ? `${reportData.matchedBeamDetail.shrinkage}%` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Core Section: Sizing Invoice Details (Stored During Invoice Upload in Beam Inward Entry) */}
          <Card className="border-border shadow-xs">
            <CardHeader className="bg-slate-50/80 border-b border-border py-3 px-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <span>Sizing Invoice Upload Details (Stored in Beam Inward Entry)</span>
                </CardTitle>
                <div className="text-2xs text-muted-foreground">
                  Extracted & stored via Sizing Invoice OCR upload in Beam Inward
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {reportData.invoiceDetails && reportData.invoiceDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100/90 text-slate-700 uppercase font-semibold text-2xs border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Invoice No</th>
                        <th className="py-2.5 px-3">Invoice Date</th>
                        <th className="py-2.5 px-3 text-right">Sizing Cost (₹)</th>
                        <th className="py-2.5 px-3 text-right">GST Amount (₹)</th>
                        <th className="py-2.5 px-3 text-right">Net Total (₹)</th>
                        <th className="py-2.5 px-3 text-center print:hidden">Invoice Document</th>
                        <th className="py-2.5 px-3 text-center">Media Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData.invoiceDetails.map((inv, idx) => (
                        <tr key={inv.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold font-mono text-purple-900">
                            {inv.invNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{inv.invDate}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                            {formatCurrency(inv.sizingCost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                            {formatCurrency(inv.gstAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                            {formatCurrency(inv.netTotal)}
                          </td>
                          <td className="py-2.5 px-3 text-center print:hidden">
                            {inv.invoiceUpload ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-2xs gap-1 text-purple-700 border-purple-200 hover:bg-purple-50"
                                  onClick={() => setPreviewMediaUrl(inv.invoiceUpload || null)}
                                  title="Quick Preview Invoice Document"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Preview</span>
                                </Button>
                                <a
                                  href={inv.invoiceUpload}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-2xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                                  title="Open Document in New Tab"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>View File</span>
                                </a>
                              </div>
                            ) : (
                              <span className="text-2xs text-slate-400 italic">No File Uploaded</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-2xs text-slate-500">
                            {inv.mediaDetailSno ? `Media #${inv.mediaDetailSno}` : (inv.mediaSno ? `SNO #${inv.mediaSno}` : '---')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-slate-900 text-right uppercase text-2xs">
                          Grand Total:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                          {formatCurrency(invoiceTotals.cost)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                          {formatCurrency(invoiceTotals.gst)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-900 bg-emerald-100/60">
                          {formatCurrency(invoiceTotals.net)}
                        </td>
                        <td colSpan={2} className="py-2.5 px-3 text-center text-2xs text-slate-500">
                          {reportData.invoiceDetails.length} Invoice Record(s) Stored
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No sizing invoice uploaded for this Beam Inward yet</p>
                  <p className="text-2xs text-slate-500 mt-1 max-w-md mx-auto">
                    Inward record: <strong>{reportData.beamInwardNo || 'N/A'}</strong>. You can upload sizing invoices via the Beam Inward Entry screen (`beam-inward-entry.tsx`).
                  </p>
                  {reportData.beamInwardId && (
                    <Button
                      onClick={() => navigate(`/transaction/beam-inward-entry/${reportData.beamInwardId}`)}
                      size="sm"
                      variant="outline"
                      className="mt-3 text-xs h-7 gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Beam Inward Entry #{reportData.beamInwardNo}</span>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two-Column Grid: Beam Inward Specifications & Sized Beam Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Beam Inward & Delivery Challan Details */}
            <Card className="border-border shadow-xs">
              <CardHeader className="bg-slate-50/80 border-b border-border py-2.5 px-4">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Beam Inward & Delivery Challan (DC) Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Beam Inward No</dt>
                    <dd className="font-semibold text-foreground font-mono mt-0.5">{reportData.beamInwardNo || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Beam Inward Date</dt>
                    <dd className="font-medium text-foreground mt-0.5">{reportData.beamInwardDate || '-'}</dd>
                  </div>

                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Delivery Challan (DC) No</dt>
                    <dd className="font-semibold text-blue-700 font-mono mt-0.5">{reportData.dcNumber || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">DC Date</dt>
                    <dd className="font-medium text-foreground mt-0.5">{reportData.dcDate || '-'}</dd>
                  </div>

                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Sizing Vendor / Mill</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{resolvedVendorName}</dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Sizing Rate (₹)</dt>
                    <dd className="font-semibold text-foreground font-mono mt-0.5">
                      {reportData.sizingRate ? `₹${reportData.sizingRate}` : '-'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Sizing Set No</dt>
                    <dd className="font-medium text-foreground font-mono mt-0.5">{reportData.sizingSetNo || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Total Beams in Set</dt>
                    <dd className="font-medium text-foreground mt-0.5">{reportData.totalBeams ?? '-'}</dd>
                  </div>

                  {reportData.remarks && (
                    <div className="col-span-2 pt-1 border-t border-dashed border-border">
                      <dt className="text-2xs font-bold text-muted-foreground uppercase">Remarks</dt>
                      <dd className="text-xs text-slate-700 mt-0.5 italic">{reportData.remarks}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Sized Beam Specifications */}
            <Card className="border-border shadow-xs">
              <CardHeader className="bg-slate-50/80 border-b border-border py-2.5 px-4">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Sized Beam Received Specifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Sized Beam No</dt>
                    <dd className="font-bold text-foreground font-mono mt-0.5">
                      {reportData.matchedBeamDetail?.sizedBeamNo || reportData.beamNo}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Flange No</dt>
                    <dd className="font-medium text-foreground font-mono mt-0.5">
                      {reportData.matchedBeamDetail?.flangeNo || '---'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Inward Warp Meters</dt>
                    <dd className="font-bold text-indigo-700 font-mono mt-0.5">
                      {(reportData.matchedBeamDetail?.wrapMeters || reportData.beamCardData?.beamDetails.warpLength || 0).toLocaleString()} Mtrs
                    </dd>
                  </div>

                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Shrinkage %</dt>
                    <dd className="font-medium text-foreground mt-0.5">
                      {reportData.matchedBeamDetail?.shrinkage != null ? `${reportData.matchedBeamDetail.shrinkage}%` : '0.00%'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Expected Fabric Mtrs</dt>
                    <dd className="font-semibold text-foreground font-mono mt-0.5">
                      {reportData.matchedBeamDetail?.expectedFabricMeter ? `${reportData.matchedBeamDetail.expectedFabricMeter} Mtrs` : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Total Ends</dt>
                    <dd className="font-medium text-foreground font-mono mt-0.5">
                      {reportData.matchedBeamDetail?.totalEnds?.toLocaleString() || reportData.beamCardData?.beamDetails.endsPerBeam || '-'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Warp Count</dt>
                    <dd className="font-medium text-foreground mt-0.5">
                      {reportData.matchedBeamDetail?.warpCount || reportData.beamCardData?.beamDetails.warpCount || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Warp Yarn Mill</dt>
                    <dd className="font-medium text-foreground mt-0.5">
                      {reportData.matchedBeamDetail?.warpYarnMillName || reportData.beamCardData?.beamDetails.warpMillName || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs font-bold text-muted-foreground uppercase">Warp Yarn Lot No</dt>
                    <dd className="font-medium text-foreground font-mono mt-0.5">
                      {reportData.matchedBeamDetail?.warpYarnLotNo || reportData.beamCardData?.beamDetails.warpLotNo || '-'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Quality & Technical Specifications */}
          <Card className="border-border shadow-xs">
            <CardHeader className="bg-slate-50/80 border-b border-border py-2.5 px-4">
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Quality & Sizing Technical Specifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Quality Details Table */}
              {reportData.qualityDetails && reportData.qualityDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-2xs border-b border-border">
                      <tr>
                        <th className="py-2 px-3">Quality / Sort</th>
                        <th className="py-2 px-3">Yarn Name</th>
                        <th className="py-2 px-3">Actual Yarn</th>
                        <th className="py-2 px-3 text-right">SORD Ends</th>
                        <th className="py-2 px-3 text-right">Actual Ends</th>
                        <th className="py-2 px-3 text-right">Parts</th>
                        <th className="py-2 px-3 text-right">Ends / Part</th>
                        <th className="py-2 px-3 text-right">Warp Meters</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData.qualityDetails.map((q, idx) => (
                        <tr key={q.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{q.quality || '-'}</td>
                          <td className="py-2 px-3 text-slate-700">{q.fabricCode || '-'}</td>
                          <td className="py-2 px-3 text-slate-700">{q.actualYarn || '-'}</td>
                          <td className="py-2 px-3 text-right font-mono">{q.sordEnds?.toLocaleString() || '-'}</td>
                          <td className="py-2 px-3 text-right font-mono font-medium">{q.actualEnds?.toLocaleString() || '-'}</td>
                          <td className="py-2 px-3 text-right font-mono">{q.parts ?? '-'}</td>
                          <td className="py-2 px-3 text-right font-mono">{q.endsPerPart ?? '-'}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">{q.wrapMeters?.toLocaleString() || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  Quality specifications recorded from Beam Inward: Sort {reportData.beamCardData?.beamDetails.sortCode || 'H-1100'} ({reportData.beamCardData?.beamDetails.materialDescription || '100% Cotton'})
                </div>
              )}

              {/* Technical Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-border text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="block text-2xs font-semibold text-slate-500 uppercase">Actual Weight</span>
                  <span className="block font-bold text-slate-900 font-mono mt-0.5">
                    {reportData.actualWeight != null ? `${reportData.actualWeight} Kgs` : '-'}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="block text-2xs font-semibold text-slate-500 uppercase">Warping Weight</span>
                  <span className="block font-bold text-slate-900 font-mono mt-0.5">
                    {reportData.warpingWeight != null ? `${reportData.warpingWeight} Kgs` : '-'}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="block text-2xs font-semibold text-slate-500 uppercase">Excess / Shortage</span>
                  <span className="block font-bold text-slate-900 font-mono mt-0.5">
                    {reportData.excessShortage != null ? `${reportData.excessShortage} Kgs` : '-'}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="block text-2xs font-semibold text-slate-500 uppercase">Sizing Pickup %</span>
                  <span className="block font-bold text-emerald-800 font-mono mt-0.5">
                    {reportData.sizingPickup != null ? `${reportData.sizingPickup}%` : (reportData.beamCardData?.beamDetails.pickUp || '-')}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="block text-2xs font-semibold text-slate-500 uppercase">Elongation %</span>
                  <span className="block font-bold text-slate-900 font-mono mt-0.5">
                    {reportData.elongation != null ? `${reportData.elongation}%` : '-'}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="block text-2xs font-semibold text-slate-500 uppercase">Breaks / Million</span>
                  <span className="block font-bold text-slate-900 font-mono mt-0.5">
                    {reportData.breaksMillion ?? '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cross-Referenced Beam Card Production Performance */}
          {reportData.beamCardData && (
            <Card className="border-border shadow-xs">
              <CardHeader className="bg-slate-50/80 border-b border-border py-2.5 px-4">
                <CardTitle className="text-xs font-bold text-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-blue-600" />
                    <span>Cross-Referenced Beam Card Production Progress</span>
                  </div>
                  <span className="text-2xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Loom {reportData.beamCardData.beamDetails.loomNo} &bull; {reportData.beamCardData.beamDetails.status || 'RUNNING'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-slate-50 border border-border">
                    <span className="block text-2xs text-muted-foreground uppercase font-bold">Total Doffed Pieces</span>
                    <span className="block text-lg font-bold text-foreground font-mono mt-0.5">
                      {reportData.beamCardData.fabricSummary?.totalPieces || reportData.beamCardData.productionDetails?.length || 0}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 border border-border">
                    <span className="block text-2xs text-muted-foreground uppercase font-bold">Total Doff Length</span>
                    <span className="block text-lg font-bold text-foreground font-mono mt-0.5">
                      {(reportData.beamCardData.fabricSummary?.totalDoffMtrs || 0).toLocaleString()} Mtrs
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 border border-border">
                    <span className="block text-2xs text-muted-foreground uppercase font-bold">Total Roll Length</span>
                    <span className="block text-lg font-bold text-indigo-700 font-mono mt-0.5">
                      {(reportData.beamCardData.fabricSummary?.totalRollMtrs || 0).toLocaleString()} Mtrs
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 border border-border">
                    <span className="block text-2xs text-muted-foreground uppercase font-bold">Dynamic Crimp %</span>
                    <span className="block text-lg font-bold text-emerald-700 font-mono mt-0.5">
                      {reportData.beamCardData.fabricSummary?.crimpPercentage || '0.00%'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={handleBackToBeamCard}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Interactive Beam Card</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Printable Signatures Area */}
          <div className="hidden print:grid grid-cols-4 gap-4 pt-12 text-center text-xs text-slate-800">
            <div className="border-t border-slate-400 pt-1">
              <span className="font-semibold block">Prepared By</span>
              <span className="text-2xs text-slate-500">Inward Clerk</span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-semibold block">Sizing In-charge</span>
              <span className="text-2xs text-slate-500">Verification</span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-semibold block">Weaving Master</span>
              <span className="text-2xs text-slate-500">Loom Allocation</span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-semibold block">Authorized Signatory</span>
              <span className="text-2xs text-slate-500">Accounts Approval</span>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewMediaUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border">
            <div className="flex items-center justify-between p-3 border-b border-border bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-foreground">Sizing Invoice Document Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewMediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Size</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewMediaUrl(null)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100">
              {previewMediaUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewMediaUrl}
                  title="Invoice PDF"
                  className="w-full h-[70vh] rounded border border-border"
                />
              ) : (
                <img
                  src={previewMediaUrl}
                  alt="Sizing Invoice Document"
                  className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeamCardReportPage;
