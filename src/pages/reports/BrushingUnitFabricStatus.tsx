import React, { useState, useEffect, useMemo, useRef } from "react";
import { DataTable } from "@/components/data/DataTable";
import apiService from "@/services/ApiService";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { RefreshCw, Filter, FileSpreadsheet, Printer, Layers } from "lucide-react";
import { exportToExcel } from "@/lib/utils";
import CompanyHeader from "@/components/common/CompanyHeader";

interface FabricStatusRow {
  sNo?: number;
  construction: string;
  fabricMasterId?: number | null;
  brushedFabricStock: number;
  waitingForBrushing: number;
  rejectedFabric: number;
}

export default function BrushingUnitFabricStatus() {
  const companyId = useResolvedCompanyId();

  // Today's date YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedConstruction, setSelectedConstruction] = useState<string>("ALL");
  const [allConstructions, setAllConstructions] = useState<string[]>([]);

  const [reportData, setReportData] = useState<FabricStatusRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Formatted date string DD-MM-YY for report header
  const formattedDisplayDate = useMemo(() => {
    if (!selectedDate) return "";
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      const yy = parts[0].slice(-2);
      return `${parts[2]}-${parts[1]}-${yy}`;
    }
    return selectedDate;
  }, [selectedDate]);

  // Fetch unique constructions for dropdown filter
  const fetchConstructions = async () => {
    if (!companyId) return;
    try {
      const data: any[] = await apiService.get(`/brushing/unit-fabric-status/company/${companyId}`);
      if (Array.isArray(data)) {
        const uniqueSet = new Set<string>();
        data.forEach((item) => {
          if (item.construction && item.construction.trim()) {
            uniqueSet.add(item.construction.trim());
          }
        });
        setAllConstructions(Array.from(uniqueSet).sort());
      }
    } catch (err) {
      console.error("Error fetching constructions:", err);
    }
  };

  // Fetch report data
  const fetchReportData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      let queryUrl = `/brushing/unit-fabric-status/company/${companyId}?date=${selectedDate}`;
      if (selectedConstruction && selectedConstruction !== "ALL") {
        queryUrl += `&construction=${encodeURIComponent(selectedConstruction)}`;
      }
      const data = await apiService.get(queryUrl);
      if (Array.isArray(data)) {
        setReportData(
          data.map((item: any, idx: number) => ({
            sNo: idx + 1,
            construction: item.construction || "",
            fabricMasterId: item.fabricMasterId || null,
            brushedFabricStock: Number(item.brushedFabricStock || 0),
            waitingForBrushing: Number(item.waitingForBrushing || 0),
            rejectedFabric: Number(item.rejectedFabric || item.rejectedFabricStock || item.rejected || 0),
          }))
        );
      } else {
        setReportData([]);
      }
    } catch (error) {
      console.error("Failed to fetch Brushing Unit Fabric Status report", error);
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchConstructions();
      fetchReportData();
    }
  }, [companyId, selectedDate, selectedConstruction]);

  // Calculate totals for grand total row
  const totalBrushedStock = useMemo(() => {
    return reportData.reduce((sum, row) => sum + (row.brushedFabricStock || 0), 0);
  }, [reportData]);

  const totalWaitingForBrushing = useMemo(() => {
    return reportData.reduce((sum, row) => sum + (row.waitingForBrushing || 0), 0);
  }, [reportData]);

  const totalRejectedFabric = useMemo(() => {
    return reportData.reduce((sum, row) => sum + (row.rejectedFabric || 0), 0);
  }, [reportData]);

  const grandTotalMap = useMemo(() => {
    return {
      brushedFabricStock: totalBrushedStock,
      waitingForBrushing: totalWaitingForBrushing,
      rejectedFabric: totalRejectedFabric,
      "Brushed Fabric Stock": totalBrushedStock,
      "Waiting for Brushing": totalWaitingForBrushing,
      "Rejected Mtr": totalRejectedFabric,
    };
  }, [totalBrushedStock, totalWaitingForBrushing, totalRejectedFabric]);

  // Column configuration matching application's standard DataTable format
  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        id: "sNo",
        accessor: "sNo",
        width: 65,
        disableFilters: true,
        Cell: ({ row }: any) => <span className="text-slate-600 font-normal text-[14px]">{row.index + 1}</span>,
      },
      {
        Header: "CONSTRUCTION",
        accessor: "construction",
        id: "construction",
        width: 320,
        Cell: ({ value }: any) => <span className="font-normal text-[14px] text-slate-900">{value}</span>,
      },
      {
        Header: "Brushed Fabric Stock",
        accessor: "brushedFabricStock",
        id: "brushedFabricStock",
        width: 180,
        Cell: ({ value }: any) => (
          <div className="text-right font-normal text-[14px] text-slate-900">
            {Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 })}
          </div>
        ),
      },
      {
        Header: "Waiting for Brushing",
        accessor: "waitingForBrushing",
        id: "waitingForBrushing",
        width: 180,
        Cell: ({ value }: any) => (
          <div className="text-right font-normal text-[14px] text-slate-900">
            {Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 })}
          </div>
        ),
      },
      {
        Header: "Rejected Mtr",
        accessor: "rejectedFabric",
        id: "rejectedFabric",
        width: 180,
        Cell: ({ value }: any) => (
          <div className="text-right font-normal text-[14px] text-slate-900">
            {Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 })}
          </div>
        ),
      },
    ],
    []
  );

  // Handle Export Excel using app utility
  const handleExportExcel = () => {
    if (!reportData.length) {
      toast.info("No data available to export");
      return;
    }
    const exportRows = reportData.map((row) => ({
      "CONSTRUCTION": row.construction,
      "Brushed Fabric Stock": row.brushedFabricStock,
      "Waiting for Brushing": row.waitingForBrushing,
      "Rejected Mtr": row.rejectedFabric,
    }));

    exportToExcel(exportRows, `Brushing_Unit_Fabric_Status_${selectedDate}`, {
      includeSerialNo: true,
      headers: ["CONSTRUCTION", "Brushed Fabric Stock", "Waiting for Brushing", "Rejected Mtr"],
      grandTotal: grandTotalMap,
      totalColumnKeys: ["Brushed Fabric Stock", "Waiting for Brushing", "Rejected Mtr"],
    });
  };

  // Handle Print (only covers DataTable layout area)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 pt-16 space-y-6 bg-slate-50/50 min-h-screen">
        {/* Scoped CSS to ensure print ONLY covers the DataTable layout area */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-report-area,
            #printable-report-area * {
              visibility: visible !important;
            }
            #printable-report-area .no-print,
            #printable-report-area .no-print *,
            .no-print,
            .no-print * {
              visibility: hidden !important;
              display: none !important;
            }
            #printable-report-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}</style>

        {/* Screen Page Header (Hidden during print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Layers className="h-6 w-6 text-emerald-600" />
              Brushing Unit Fabric Status
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time fabric stock summary grouped by Construction.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />
              Export Excel
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white hover:bg-slate-100"
            >
              <Printer className="h-4 w-4 mr-1.5 text-slate-600" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Filter Controls Card (Hidden during print) */}
        <Card className="no-print border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-wrap items-end gap-4">
              {/* Date Filter */}
              <div className="w-full sm:w-48">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Date Filter
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-9 px-3 py-1 bg-white text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                />
              </div>

              {/* Construction Filter Dropdown */}
              <div className="w-full sm:w-64">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Construction Filter
                </label>
                <select
                  value={selectedConstruction}
                  onChange={(e) => setSelectedConstruction(e.target.value)}
                  className="w-full h-9 px-3 py-1 bg-white text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                >
                  <option value="ALL">All Constructions</option>
                  {allConstructions.map((c, idx) => (
                    <option key={idx} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={fetchReportData}
                  disabled={loading}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  View Report
                </Button>
                <Button
                  onClick={() => {
                    fetchConstructions();
                    fetchReportData();
                  }}
                  variant="outline"
                  disabled={loading}
                  className="h-9 px-3 border-slate-300 bg-white hover:bg-slate-100 text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Printable Report Section containing standard application DataTable */}
        <div className="flex justify-center w-full">
          <div id="printable-report-area" className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 w-full max-w-5xl mx-auto">
            {/* Company Header Branding */}
            <CompanyHeader className="mb-4" />

            {/* Printable Header Info */}
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Brushing Unit Fabric Status</h2>
                <p className="text-xs text-slate-500">Fabric Stock & Pending Brushing Status</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded border border-slate-200">
                  Date: {formattedDisplayDate || "—"}
                </span>
              </div>
            </div>

            {/* System Standard DataTable with disabled column expansion */}
            <DataTable
              columns={columns}
              data={reportData}
              title=""
              loading={loading}
              showActions={false}
              showAddActions={false}
              showExport={false}
              onlyGrandTotal={true}
              showGrandTotal={true}
              grandTotalLabel="TOTAL"
              grandTotal={grandTotalMap}
              totalColumnKeys={["brushedFabricStock", "waitingForBrushing", "rejectedFabric", "Brushed Fabric Stock", "Waiting for Brushing", "Rejected Mtr"]}
              isShowPagination={false}
              initialPageSize={1000}
              disableColumnExpand={true}
              bodyCellClassName="text-[12px] font-normal text-slate-900"
            />
          </div>
        </div>
      </div>
  );
}
