import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { AppDispatch, RootState } from "@/state/store";
import { ReportConfig, executeReport, getAllReports } from "@/state/reportConfigSlice";
import { ArrowLeft, RefreshCw, Printer, FileText, FileSpreadsheet, Activity } from "lucide-react";
import { toast } from "react-toastify";
import { exportToExcel } from "@/lib/utils";
import apiService from "@/services/ApiService";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";

// Utility parsers
const parseNumber = (val: any): number => {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).trim().replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const formatReportDate = (val: any): string => {
  if (val == null || val === "") return "";
  if (typeof val === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val.trim())) {
    return val.trim();
  }
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val.trim())) {
    const clean = val.trim().slice(0, 10);
    const [year, month, day] = clean.split("-").map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
    }
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  }
  return String(val);
};

export default function WeavingProductionReportView() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const companyId = useResolvedCompanyId();

  // Navigation state passed from WeavingProductionLiveReport filter screen
  const params = useMemo(() => {
    return (location.state as any) || null;
  }, [location.state]);

  const { reportList, fetched, loading: storeLoading } = useSelector(
    (state: RootState) => state.reportConfig
  );

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load report configurations if not present in Redux store
  useEffect(() => {
    if (!fetched && companyId) {
      dispatch(getAllReports({ companyId }));
    }
  }, [dispatch, fetched, companyId]);

  // Find target Weaving Production Report config
  const reportConfig = useMemo(() => {
    if (params?.reportId) {
      const found = reportList.find((r) => String(r.id) === String(params.reportId));
      if (found) return found;
    }
    return reportList.find((r) => {
      const name = r.reportName.toLowerCase();
      return name.includes("weaving production") || name.includes("production report") || name.includes("live weaving");
    }) || null;
  }, [reportList, params?.reportId]);

  // Selected Columns to render
  const selectedColumns: string[] = useMemo(() => {
    if (params?.selectedColumns && Array.isArray(params.selectedColumns) && params.selectedColumns.length > 0) {
      return params.selectedColumns;
    }
    if (reportConfig?.columns) {
      return reportConfig.columns.map((c) => c.columnName);
    }
    return [
      "MC", "Sort No", "Construction", "TC & Weave", "Warp Supplier", "Warp L.No",
      "Weft Supplier", "Weft L.No", "A %", "P %", "RPM", "KP", "Mtr",
      "WP", "WPT", "WP/M", "WT", "WTT", "WT/M", "OS", "OST", "LS", "LST",
      "R.Time", "T.S.Time", "Running CFM", "Ideal CFM", "INCENTIVE"
    ];
  }, [params?.selectedColumns, reportConfig]);

  // Fetch Report Execution Data from backend or reportConfigSlice
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let resultData: any[] = [];

      // Primary attempt: Execute live weaving query via backend API
      try {
        const res: any = await apiService.get(`/report-configurations/execute-weaving-live?companyId=${companyId || ""}`);
        const rawRows = Array.isArray(res) 
          ? res 
          : (res?.data?.rows || res?.rows || res?.queryData?.data?.rows || res?.data?.queryData?.data?.rows || res?.data || []);
        if (Array.isArray(rawRows) && rawRows.length > 0) {
          resultData = rawRows;
        }
      } catch (err) {
        console.warn("Direct live endpoint call failed, attempting reportConfig thunk fallback:", err);
      }

      // Fallback attempt: execute via reportConfig thunk if reportConfig.id is present
      if (resultData.length === 0 && reportConfig?.id) {
        const result = await dispatch(executeReport({ id: reportConfig.id, filters: params?.customFilterValues || {} })).unwrap();
        const rawRows = Array.isArray(result) 
          ? result 
          : (result?.queryData?.data?.rows || result?.queryData?.rows || result?.rows || result?.data?.rows || result?.data || []);
        resultData = Array.isArray(rawRows) ? rawRows : [];
      }

      setRows(resultData);
    } catch (err: any) {
      console.warn("Report execution failed, returning empty row set:", err);
      setRows([]);
      setError(err?.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }, [dispatch, reportConfig?.id, params?.customFilterValues, companyId]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Helper string normalizer
  const normalizeShed = (val: any) => String(val || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // Client-side Group By Shed and Filter Processing
  const filteredRows = useMemo(() => {
    if (rows.length === 0) return [];
    let result = [...rows];

    const shedFilter = params?.customFilterValues?.Shed;
    const selectedShedVal = Array.isArray(shedFilter) ? shedFilter[0] : shedFilter;

    if (selectedShedVal && String(selectedShedVal).trim() !== "") {
      const targetNorm = normalizeShed(selectedShedVal);
      const hasMatchingShed = result.some(r => {
        const raw = r.Shed || r.shed || r.shedName || r["Shed Name"];
        return raw && normalizeShed(raw) === targetNorm;
      });

      if (hasMatchingShed) {
        result = result.filter(row => {
          const raw = row.Shed || row.shed || row.shedName || row["Shed Name"];
          return raw ? normalizeShed(raw) === targetNorm : true;
        });
      }
    }

    // Filter by Machine Status if specified
    const statusFilter = params?.customFilterValues?.machineStatus;
    if (statusFilter && statusFilter !== "All") {
      result = result.filter(row => {
        const status = String(row.status || row.machineStatus || "").toLowerCase();
        return status.includes(statusFilter.toLowerCase());
      });
    }

    return result;
  }, [rows, params?.customFilterValues]);

  // Group Rows by Shed if Group By = "Shed"
  const groupedData = useMemo(() => {
    const isShedGrouped = params?.groupByColumns?.includes("Shed") || params?.customFilterValues?.Shed;
    if (!isShedGrouped || filteredRows.length === 0) {
      return { "All Sheds": filteredRows };
    }

    const defaultShedName = params?.customFilterValues?.Shed?.[0] || "A-Shed";
    const groups: Record<string, any[]> = {};
    filteredRows.forEach(row => {
      const rawShed = row.Shed || row.shed || row.shedName || row["Shed Name"] || defaultShedName;
      const shedName = String(rawShed).startsWith("Shed") ? String(rawShed) : `Shed: ${rawShed}`;
      if (!groups[shedName]) {
        groups[shedName] = [];
      }
      groups[shedName].push(row);
    });

    return groups;
  }, [filteredRows, params?.groupByColumns, params?.customFilterValues]);

  // Calculate Column Totals for Footer
  const columnTotals = useMemo(() => {
    if (filteredRows.length === 0) return {};
    const totals: Record<string, number> = {};

    const numericFields = ["KP", "Mtr", "Kilo Picks", "Meter", "WP", "WT", "OS", "LS", "INCENTIVE"];
    numericFields.forEach(field => {
      totals[field] = filteredRows.reduce((sum, r) => {
        const val = parseNumber(r[field] || r[field.toLowerCase()] || 0);
        return sum + val;
      }, 0);
    });

    return totals;
  }, [filteredRows]);

  // Export to Excel handler
  const handleExcelExport = useCallback(() => {
    if (filteredRows.length === 0) {
      toast.warn("No data available to export.");
      return;
    }

    const headers = selectedColumns;
    const excelRows = filteredRows.map((row, index) => {
      const mapped: Record<string, any> = {};
      mapped["S.No"] = index + 1;
      selectedColumns.forEach(col => {
        mapped[col] = row[col] ?? row[col.toLowerCase()] ?? "";
      });
      return mapped;
    });

    exportToExcel(excelRows, "Weaving_Production_Live_Report", {
      headers: ["S.No", ...headers],
      includeSerialNo: true,
    });
  }, [filteredRows, selectedColumns]);

  // Auto print / excel action trigger from navigation params
  useEffect(() => {
    if (!loading && rows.length > 0 && params?.actionType) {
      if (params.actionType === "excel") {
        const timer = setTimeout(() => handleExcelExport(), 600);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => window.print(), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, rows, params?.actionType, handleExcelExport]);

  const reportTitle = params?.reportType === "Summary" 
    ? "Shedwise Summary Report For Running Shift" 
    : "Shedwise Detail Report For Running Shift";

  return (
    <div className="p-6 pt-16 space-y-6 weaving-report-view-container max-w-full">
      {/* Print-specific style layout */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 6mm;
          }
          .no-print, header, nav, button, .sidebar {
            display: none !important;
          }
          body {
            background: white !important;
            font-size: 8pt !important;
          }
          .weaving-report-view-container {
            padding: 0 !important;
            margin: 0 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            font-size: 7pt !important;
            padding: 3px 4px !important;
            border: 1px solid #333 !important;
          }
        }
      `}</style>

      {/* Top Header & Actions Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between no-print">
        <Button
          onClick={() => navigate("/reports/weaving-production-report", { state: params })}
          variant="outline"
          size="sm"
          className="border-slate-200 text-slate-700 flex items-center gap-1.5 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Filter Configuration
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={fetchReportData}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-slate-200 text-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="border-slate-200 text-slate-700 flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>

          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="border-indigo-100 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>

          <Button
            onClick={handleExcelExport}
            variant="outline"
            size="sm"
            className="border-emerald-100 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Main Report Header Title Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm text-center flex flex-col items-center justify-center">
        <h2 className="text-xl font-extrabold tracking-wide uppercase flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" />
          {reportTitle}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 mt-1">
          <span>Period: <strong className="text-white">{params?.customFilterValues?.period || "Running Shift"}</strong></span>
          <span>Machine Status: <strong className="text-white">{params?.customFilterValues?.machineStatus || "All"}</strong></span>
          <span>Report Type: <strong className="text-white">{params?.reportType || "Detail"}</strong></span>
        </div>
      </div>

      {/* Data Rows Table Section */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-semibold">Executing Weaving Production Report query...</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-semibold">No weaving production report data found for the selected filter parameters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedData).map(([groupTitle, groupRows]) => (
            <div key={groupTitle} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* Shed Group Title Banner */}
              {groupTitle !== "All Sheds" && (
                <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 font-bold text-indigo-900 text-sm flex items-center justify-between">
                  <span>{groupTitle}</span>
                  <span className="text-xs font-normal text-indigo-700">{groupRows.length} Loom(s)</span>
                </div>
              )}

              {/* Main Weaving Production Detail Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-blue-600 text-white font-bold text-center border-b border-blue-700">
                      <th className="p-2 border-r border-blue-500 w-12">MC</th>
                      <th className="p-2 border-r border-blue-500 w-16">Sort No</th>
                      {selectedColumns.includes("Construction") && <th className="p-2 border-r border-blue-500">Construction</th>}
                      {selectedColumns.includes("TC & Weave") && <th className="p-2 border-r border-blue-500">TC & Weave</th>}
                      {selectedColumns.includes("Warp Supplier") && <th className="p-2 border-r border-blue-500">Warp Supplier</th>}
                      {selectedColumns.includes("Warp L.No") && <th className="p-2 border-r border-blue-500">Warp L.No</th>}
                      {selectedColumns.includes("Weft Supplier") && <th className="p-2 border-r border-blue-500">Weft Supplier</th>}
                      {selectedColumns.includes("Weft L.No") && <th className="p-2 border-r border-blue-500">Weft L.No</th>}
                      {selectedColumns.includes("Actual Efficiency") || selectedColumns.includes("A %") ? <th className="p-2 border-r border-blue-500 w-14">A %</th> : null}
                      {selectedColumns.includes("Production Efficiency") || selectedColumns.includes("P %") ? <th className="p-2 border-r border-blue-500 w-14">P %</th> : null}
                      {selectedColumns.includes("RPM") && <th className="p-2 border-r border-blue-500 w-14">RPM</th>}
                      {selectedColumns.includes("Kilo Picks") || selectedColumns.includes("KP") ? <th className="p-2 border-r border-blue-500 w-16">KP</th> : null}
                      {selectedColumns.includes("Meter") || selectedColumns.includes("Mtr") ? <th className="p-2 border-r border-blue-500 w-16">Mtr</th> : null}
                      {selectedColumns.includes("Warp") || selectedColumns.includes("WP") ? <th className="p-2 border-r border-blue-500 w-12">WP</th> : null}
                      {selectedColumns.includes("Warp Time") || selectedColumns.includes("WPT") ? <th className="p-2 border-r border-blue-500 w-16">WPT</th> : null}
                      {selectedColumns.includes("Minutes/Warp") || selectedColumns.includes("WP/M") ? <th className="p-2 border-r border-blue-500 w-14">WP/M</th> : null}
                      {selectedColumns.includes("Weft") || selectedColumns.includes("WT") ? <th className="p-2 border-r border-blue-500 w-12">WT</th> : null}
                      {selectedColumns.includes("Weft Time") || selectedColumns.includes("WTT") ? <th className="p-2 border-r border-blue-500 w-16">WTT</th> : null}
                      {selectedColumns.includes("Minutes/Weft") || selectedColumns.includes("WT/M") ? <th className="p-2 border-r border-blue-500 w-14">WT/M</th> : null}
                      {selectedColumns.includes("Others") || selectedColumns.includes("OS") ? <th className="p-2 border-r border-blue-500 w-12">OS</th> : null}
                      {selectedColumns.includes("Others Stop Time") || selectedColumns.includes("OST") ? <th className="p-2 border-r border-blue-500 w-16">OST</th> : null}
                      {selectedColumns.includes("Long Stops") || selectedColumns.includes("LS") ? <th className="p-2 border-r border-blue-500 w-12">LS</th> : null}
                      {selectedColumns.includes("Long Stops Time") || selectedColumns.includes("LST") ? <th className="p-2 border-r border-blue-500 w-16">LST</th> : null}
                      {selectedColumns.includes("Run Time") || selectedColumns.includes("R.Time") ? <th className="p-2 border-r border-blue-500 w-16">R.Time</th> : null}
                      {selectedColumns.includes("Total Stop Time") || selectedColumns.includes("T.S.Time") ? <th className="p-2 border-r border-blue-500 w-16">T.S.Time</th> : null}
                      {selectedColumns.includes("Running CFM") || selectedColumns.includes("Running.CFM") ? <th className="p-2 border-r border-blue-500 w-20">Running.CFM</th> : null}
                      {selectedColumns.includes("Ideal CFM") || selectedColumns.includes("Ideal.CFM") ? <th className="p-2 border-r border-blue-500 w-20">Ideal.CFM</th> : null}
                      {selectedColumns.includes("INCENTIVE") && <th className="p-2 w-20">INCENTIVE</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {groupRows.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 font-mono transition-colors text-center">
                        <td className="p-1.5 font-bold border-r border-slate-200 text-slate-900">{row.MC || row.loom_no || row.loomNo || idx + 1}</td>
                        <td className="p-1.5 border-r border-slate-200 font-semibold">{row["Sort No"] || row.sortNo || row.fabricCode || "-"}</td>
                        {selectedColumns.includes("Construction") && <td className="p-1.5 border-r border-slate-200 text-left font-sans text-xs">{row.Construction || row.construction || "-"}</td>}
                        {selectedColumns.includes("TC & Weave") && <td className="p-1.5 border-r border-slate-200 text-left font-sans">{row["TC & Weave"] || row.tcWeave || "-"}</td>}
                        {selectedColumns.includes("Warp Supplier") && <td className="p-1.5 border-r border-slate-200 text-left font-sans">{row["Warp Supplier"] || row.warpSupplier || "-"}</td>}
                        {selectedColumns.includes("Warp L.No") && <td className="p-1.5 border-r border-slate-200 font-bold text-slate-700">{row["Warp L.No"] || row.warpLotNo || "-"}</td>}
                        {selectedColumns.includes("Weft Supplier") && <td className="p-1.5 border-r border-slate-200 text-left font-sans">{row["Weft Supplier"] || row.weftSupplier || "-"}</td>}
                        {selectedColumns.includes("Weft L.No") && <td className="p-1.5 border-r border-slate-200 font-bold text-slate-700">{row["Weft L.No"] || row.weftLotNo || "-"}</td>}
                        {(selectedColumns.includes("Actual Efficiency") || selectedColumns.includes("A %")) && <td className="p-1.5 border-r border-slate-200 font-bold text-indigo-700">{row["A %"] ?? row.actualEfficiency ?? "-"}</td>}
                        {(selectedColumns.includes("Production Efficiency") || selectedColumns.includes("P %")) && <td className="p-1.5 border-r border-slate-200 font-bold text-blue-700">{row["P %"] ?? row.productionEfficiency ?? "-"}</td>}
                        {selectedColumns.includes("RPM") && <td className="p-1.5 border-r border-slate-200">{row.RPM ?? row.rpm ?? "-"}</td>}
                        {(selectedColumns.includes("Kilo Picks") || selectedColumns.includes("KP")) && <td className="p-1.5 border-r border-slate-200 font-bold">{row.KP ?? row.kiloPicks ?? "-"}</td>}
                        {(selectedColumns.includes("Meter") || selectedColumns.includes("Mtr")) && <td className="p-1.5 border-r border-slate-200 font-bold">{row.Mtr ?? row.meter ?? "-"}</td>}
                        {(selectedColumns.includes("Warp") || selectedColumns.includes("WP")) && <td className="p-1.5 border-r border-slate-200">{row.WP ?? "-"}</td>}
                        {(selectedColumns.includes("Warp Time") || selectedColumns.includes("WPT")) && <td className="p-1.5 border-r border-slate-200">{row.WPT ?? "-"}</td>}
                        {(selectedColumns.includes("Minutes/Warp") || selectedColumns.includes("WP/M")) && <td className="p-1.5 border-r border-slate-200">{row["WP/M"] ?? "-"}</td>}
                        {(selectedColumns.includes("Weft") || selectedColumns.includes("WT")) && <td className="p-1.5 border-r border-slate-200">{row.WT ?? "-"}</td>}
                        {(selectedColumns.includes("Weft Time") || selectedColumns.includes("WTT")) && <td className="p-1.5 border-r border-slate-200">{row.WTT ?? "-"}</td>}
                        {(selectedColumns.includes("Minutes/Weft") || selectedColumns.includes("WT/M")) && <td className="p-1.5 border-r border-slate-200">{row["WT/M"] ?? "-"}</td>}
                        {(selectedColumns.includes("Others") || selectedColumns.includes("OS")) && <td className="p-1.5 border-r border-slate-200">{row.OS ?? "-"}</td>}
                        {(selectedColumns.includes("Others Stop Time") || selectedColumns.includes("OST")) && <td className="p-1.5 border-r border-slate-200">{row.OST ?? "-"}</td>}
                        {(selectedColumns.includes("Long Stops") || selectedColumns.includes("LS")) && <td className="p-1.5 border-r border-slate-200">{row.LS ?? "-"}</td>}
                        {(selectedColumns.includes("Long Stops Time") || selectedColumns.includes("LST")) && <td className="p-1.5 border-r border-slate-200">{row.LST ?? "-"}</td>}
                        {(selectedColumns.includes("Run Time") || selectedColumns.includes("R.Time")) && <td className="p-1.5 border-r border-slate-200">{row["R.Time"] ?? row.runTime ?? "-"}</td>}
                        {(selectedColumns.includes("Total Stop Time") || selectedColumns.includes("T.S.Time")) && <td className="p-1.5 border-r border-slate-200">{row["T.S.Time"] ?? row.totalStopTime ?? "-"}</td>}
                        {(selectedColumns.includes("Running CFM") || selectedColumns.includes("Running.CFM")) && <td className="p-1.5 border-r border-slate-200">{row["Running.CFM"] ?? row.runningCfm ?? "-"}</td>}
                        {(selectedColumns.includes("Ideal CFM") || selectedColumns.includes("Ideal.CFM")) && <td className="p-1.5 border-r border-slate-200">{row["Ideal.CFM"] ?? row.idealCfm ?? "-"}</td>}
                        {selectedColumns.includes("INCENTIVE") && <td className="p-1.5 font-bold text-emerald-700">{row.INCENTIVE ?? 0}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
