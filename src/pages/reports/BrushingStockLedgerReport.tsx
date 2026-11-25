import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DataTable } from "@/components/data/DataTable";
import apiService from "@/services/ApiService";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface LedgerRow {
  date: string;
  sortNo?: string;
  construction?: string;
  fabricMasterId?: number | null;
  openingStock: number;
  receivedMtr: number;
  returnMtr: number;
  dispatchMtr: number;
  excessMtr: number;
  shortageMtr: number;
  closingStock: number;
}

export default function BrushingStockLedgerReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = useResolvedCompanyId();
  const [ledgerData, setLedgerData] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Retrieve parameters from URL
  const filterMode = (searchParams.get("mode") as "single" | "range") || "single";
  const selectedDate = searchParams.get("date") || "";
  const fromDate = searchParams.get("from") || "";
  const toDate = searchParams.get("to") || "";
  const grouping = (searchParams.get("group") as "daily" | "monthly" | "yearly") || "daily";
  const selectedConstruction = searchParams.get("construction") || "";
  const selectedStatus = searchParams.get("status") || "ALL";

  // Tab view mode: "movement" | "overall"
  const [viewTab, setViewTab] = useState<"movement" | "overall">("movement");

  // Fetch ledger data from backend
  const fetchLedgerData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const url = selectedStatus && selectedStatus !== "ALL"
        ? `/brushing/stock-ledger/company/${companyId}?status=${selectedStatus}`
        : `/brushing/stock-ledger/company/${companyId}`;
      const data = await apiService.get(url);
      if (Array.isArray(data)) {
        setLedgerData(data);
      } else {
        setLedgerData([]);
      }
    } catch (error) {
      console.error("Failed to fetch ledger data", error);
      toast.error("Failed to fetch stock ledger report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, [companyId, selectedStatus]);

  // Date formatter helper (YYYY-MM-DD -> DD/MM/YYYY)
  const formatDateStr = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Process, filter, and group data dynamically in React (identical logic to master page)
  const processedData = useMemo(() => {
    if (!ledgerData.length) return [];

    // Helper to group data monthly/yearly
    const groupData = (listToGroup: any[], activeCount: number) => {
      if (grouping === "monthly") {
        const monthlyGroups: Record<string, any[]> = {};
        listToGroup.forEach((row) => {
          const monthKey = `${row.date.substring(0, 7)}|||${row.sortNo || ""}|||${row.construction || ""}`;
          if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = [];
          monthlyGroups[monthKey].push(row);
        });

        const monthlyResult = Object.entries(monthlyGroups).map(([key, rows]) => {
          rows.sort((a, b) => a.date.localeCompare(b.date));
          
          const valOrZero = (v: any) => v === "--" || v == null ? 0 : Number(v);
          const received = rows.reduce((sum, r) => sum + valOrZero(r.receivedMtr), 0);
          const returned = rows.reduce((sum, r) => sum + valOrZero(r.returnMtr), 0);
          const dispatch = rows.reduce((sum, r) => sum + valOrZero(r.dispatchMtr), 0);
          const excess = rows.reduce((sum, r) => sum + valOrZero(r.excessMtr), 0);
          const shortage = rows.reduce((sum, r) => sum + valOrZero(r.shortageMtr), 0);

          const firstRow = rows[0];
          const lastRow = rows[rows.length - 1];

          const monthStr = firstRow.date.substring(0, 7);
          const dateObj = new Date(monthStr + "-02");
          const formattedMonth = dateObj.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });

          const showMtr = (val: number) => {
            if (viewTab === "movement" && activeCount === 0) return "--";
            return val;
          };

          return {
            date: monthStr + "-01", 
            displayDate: formattedMonth,
            fabricMasterId: firstRow.fabricMasterId,
            sortNo: firstRow.sortNo,
            construction: firstRow.construction,
            openingStock: firstRow.openingStock,
            receivedMtr: showMtr(received),
            returnMtr: showMtr(returned),
            dispatchMtr: showMtr(dispatch),
            excessMtr: showMtr(excess),
            shortageMtr: showMtr(shortage),
            closingStock: lastRow.closingStock,
          };
        });

        monthlyResult.sort((a, b) => {
          const dateCmp = a.date.localeCompare(b.date);
          if (dateCmp !== 0) return dateCmp;
          return (a.sortNo || "").localeCompare(b.sortNo || "");
        });
        return monthlyResult.map((row, idx) => ({ ...row, serialNo: idx + 1 }));
      }

      if (grouping === "yearly") {
        const yearlyGroups: Record<string, any[]> = {};
        listToGroup.forEach((row) => {
          const yearKey = `${row.date.substring(0, 4)}|||${row.sortNo || ""}|||${row.construction || ""}`;
          if (!yearlyGroups[yearKey]) yearlyGroups[yearKey] = [];
          yearlyGroups[yearKey].push(row);
        });

        const yearlyResult = Object.entries(yearlyGroups).map(([key, rows]) => {
          rows.sort((a, b) => a.date.localeCompare(b.date));

          const valOrZero = (v: any) => v === "--" || v == null ? 0 : Number(v);
          const received = rows.reduce((sum, r) => sum + valOrZero(r.receivedMtr), 0);
          const returned = rows.reduce((sum, r) => sum + valOrZero(r.returnMtr), 0);
          const dispatch = rows.reduce((sum, r) => sum + valOrZero(r.dispatchMtr), 0);
          const excess = rows.reduce((sum, r) => sum + valOrZero(r.excessMtr), 0);
          const shortage = rows.reduce((sum, r) => sum + valOrZero(r.shortageMtr), 0);

          const firstRow = rows[0];
          const lastRow = rows[rows.length - 1];

          const yearStr = firstRow.date.substring(0, 4);
          const showMtr = (val: number) => {
            if (viewTab === "movement" && activeCount === 0) return "--";
            return val;
          };

          return {
            date: yearStr + "-01-01",
            displayDate: yearStr,
            fabricMasterId: firstRow.fabricMasterId,
            sortNo: firstRow.sortNo,
            construction: firstRow.construction,
            openingStock: firstRow.openingStock,
            receivedMtr: showMtr(received),
            returnMtr: showMtr(returned),
            dispatchMtr: showMtr(dispatch),
            excessMtr: showMtr(excess),
            shortageMtr: showMtr(shortage),
            closingStock: lastRow.closingStock,
          };
        });

        yearlyResult.sort((a, b) => {
          const dateCmp = a.date.localeCompare(b.date);
          if (dateCmp !== 0) return dateCmp;
          return (a.sortNo || "").localeCompare(b.sortNo || "");
        });
        return yearlyResult.map((row, idx) => ({ ...row, serialNo: idx + 1 }));
      }
      return [];
    };

    // 1. Group ledger data by unique combination of (sortNo, construction)
    const groups: Record<string, typeof ledgerData> = {};
    ledgerData.forEach((row) => {
      const key = `${row.sortNo || "null"}|||${row.construction || "null"}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    // 2. Compute running stock level chronologically for each group
    const allComputedRows: any[] = [];
    Object.keys(groups).forEach((key) => {
      const rows = groups[key];
      rows.sort((a, b) => a.date.localeCompare(b.date));

      let running = 0;
      rows.forEach((row) => {
        const received = Number(row.receivedMtr || 0);
        const returned = Number(row.returnMtr || 0);
        const dispatch = Number(row.dispatchMtr || 0);
        const excess = Number(row.excessMtr || 0);
        const shortage = Number(row.shortageMtr || 0);

        const opening = running;
        let closing = opening + received + excess - returned - dispatch - shortage;
        if (closing < 0) {
          closing = 0;
        }
        running = closing;

        allComputedRows.push({
          ...row,
          openingStock: opening,
          closingStock: closing,
        });
      });
    });

    // 3. Process based on filterMode
    const activeRows: any[] = [];
    const fallbackRows: any[] = [];

    if (filterMode === "single") {
      Object.keys(groups).forEach((key) => {
        if (selectedConstruction) {
          const parts = key.split("|||");
          const constr = parts[parts.length - 1];
          if (constr?.trim() !== selectedConstruction?.trim()) return;
        }
        const rows = allComputedRows.filter(r => `${r.sortNo || "null"}|||${r.construction || "null"}` === key);
        rows.sort((a, b) => a.date.localeCompare(b.date));

        let matchedRowForSelectedDate: any = null;
        let lastPastRow: any = null;

        rows.forEach((row) => {
          if (row.date === selectedDate) {
            matchedRowForSelectedDate = row;
          } else if (row.date < selectedDate) {
            lastPastRow = row;
          }
        });

        if (matchedRowForSelectedDate) {
          const received = Number(matchedRowForSelectedDate.receivedMtr || 0);
          const returned = Number(matchedRowForSelectedDate.returnMtr || 0);
          const dispatch = Number(matchedRowForSelectedDate.dispatchMtr || 0);
          const excess = Number(matchedRowForSelectedDate.excessMtr || 0);
          const shortage = Number(matchedRowForSelectedDate.shortageMtr || 0);

          const hasActiveMovements = received !== 0 || returned !== 0 || dispatch !== 0 || excess !== 0 || shortage !== 0;

          const rowToPush = {
            ...matchedRowForSelectedDate,
            displayDate: formatDateStr(selectedDate),
          };

          if (hasActiveMovements) {
            activeRows.push(rowToPush);
          } else {
            fallbackRows.push({
              ...rowToPush,
              receivedMtr: "--",
              returnMtr: "--",
              dispatchMtr: "--",
              excessMtr: "--",
              shortageMtr: "--",
            });
          }
        } else {
          const balance = lastPastRow ? lastPastRow.closingStock : 0;
          fallbackRows.push({
            date: selectedDate,
            displayDate: formatDateStr(selectedDate),
            fabricMasterId: lastPastRow ? lastPastRow.fabricMasterId : null,
            sortNo: lastPastRow ? lastPastRow.sortNo : key.split("|||")[0],
            construction: lastPastRow ? lastPastRow.construction : key.split("|||")[1],
            openingStock: balance,
            receivedMtr: "--",
            returnMtr: "--",
            dispatchMtr: "--",
            excessMtr: "--",
            shortageMtr: "--",
            closingStock: balance,
          });
        }
      });
    } else {
      // Date Range mode
      Object.keys(groups).forEach((key) => {
        if (selectedConstruction) {
          const parts = key.split("|||");
          const constr = parts[parts.length - 1];
          if (constr?.trim() !== selectedConstruction?.trim()) return;
        }
        const rows = allComputedRows.filter(r => `${r.sortNo || "null"}|||${r.construction || "null"}` === key);
        rows.sort((a, b) => a.date.localeCompare(b.date));

        const rangeRows = rows.filter(r => r.date >= fromDate && r.date <= toDate);

        rangeRows.forEach((r) => {
          const received = Number(r.receivedMtr || 0);
          const returned = Number(r.returnMtr || 0);
          const dispatch = Number(r.dispatchMtr || 0);
          const excess = Number(r.excessMtr || 0);
          const shortage = Number(r.shortageMtr || 0);
          const hasActiveMovements = received !== 0 || returned !== 0 || dispatch !== 0 || excess !== 0 || shortage !== 0;

          const rowToPush = {
            ...r,
            displayDate: formatDateStr(r.date),
          };

          if (hasActiveMovements) {
            activeRows.push(rowToPush);
          } else {
            fallbackRows.push({
              ...rowToPush,
              receivedMtr: "--",
              returnMtr: "--",
              dispatchMtr: "--",
              excessMtr: "--",
              shortageMtr: "--",
            });
          }
        });

        if (rangeRows.length === 0) {
          const pastRows = rows.filter(r => r.date <= toDate);
          const balance = pastRows.length > 0 ? pastRows[pastRows.length - 1].closingStock : 0;
          const lastRow = pastRows.length > 0 ? pastRows[pastRows.length - 1] : null;

          fallbackRows.push({
            date: toDate,
            displayDate: formatDateStr(toDate),
            fabricMasterId: lastRow ? lastRow.fabricMasterId : null,
            sortNo: lastRow ? lastRow.sortNo : key.split("|||")[0],
            construction: lastRow ? lastRow.construction : key.split("|||")[1],
            openingStock: balance,
            receivedMtr: "--",
            returnMtr: "--",
            dispatchMtr: "--",
            excessMtr: "--",
            shortageMtr: "--",
            closingStock: balance,
          });
        }
      });
    }

    // 4. Return based on viewTab
    if (viewTab === "overall") {
      const combined = [...activeRows, ...fallbackRows];

      // Apply sorting
      if (filterMode === "single") {
        combined.sort((a, b) => (a.sortNo || "").localeCompare(b.sortNo || ""));
      } else {
        combined.sort((a, b) => {
          const dateCmp = a.date.localeCompare(b.date);
          if (dateCmp !== 0) return dateCmp;
          return (a.sortNo || "").localeCompare(b.sortNo || "");
        });
      }

      // If Daily, return with serialNo
      if (filterMode === "single" || grouping === "daily") {
        return combined.map((row, idx) => ({
          ...row,
          serialNo: idx + 1,
        }));
      }

      return groupData(combined, activeRows.length);
    } else {
      // viewTab === "movement"
      if (activeRows.length > 0) {
        // Apply sorting
        if (filterMode === "single") {
          activeRows.sort((a, b) => (a.sortNo || "").localeCompare(b.sortNo || ""));
        } else {
          activeRows.sort((a, b) => {
            const dateCmp = a.date.localeCompare(b.date);
            if (dateCmp !== 0) return dateCmp;
            return (a.sortNo || "").localeCompare(b.sortNo || "");
          });
        }

        // If Daily, return with serialNo
        if (filterMode === "single" || grouping === "daily") {
          return activeRows.map((row, idx) => ({
            ...row,
            serialNo: idx + 1,
          }));
        }

        return groupData(activeRows, activeRows.length);
      } else {
        // 4b. No active movements: return a single overall summary row
        const targetDate = filterMode === "single" ? selectedDate : toDate;

        // Calculate sum of opening and closing stocks across all constructions
        let totalOpeningStock = 0;
        let totalClosingStock = 0;

        Object.keys(groups).forEach((key) => {
          if (selectedConstruction) {
            const parts = key.split("_");
            const constr = parts[parts.length - 1];
            if (constr !== selectedConstruction) return;
          }
          const rows = allComputedRows.filter(r => `${r.sortNo || "null"}_${r.construction || "null"}` === key);
          rows.sort((a, b) => a.date.localeCompare(b.date));

          let lastPastRow: any = null;
          rows.forEach((row) => {
            if (row.date <= targetDate) {
              lastPastRow = row;
            }
          });

          const balance = lastPastRow ? lastPastRow.closingStock : 0;
          totalOpeningStock += balance;
          totalClosingStock += balance;
        });

        const singleSummaryRow = {
          serialNo: 1,
          date: targetDate,
          displayDate: formatDateStr(targetDate),
          fabricMasterId: null,
          sortNo: "Overall Summary",
          construction: selectedConstruction ? `No movements for ${selectedConstruction}` : "No movements on this date",
          openingStock: totalOpeningStock,
          receivedMtr: "--",
          returnMtr: "--",
          dispatchMtr: "--",
          excessMtr: "--",
          shortageMtr: "--",
          closingStock: totalClosingStock,
        };

        return [singleSummaryRow];
      }
    }
  }, [ledgerData, selectedDate, fromDate, toDate, grouping, filterMode, viewTab, selectedConstruction]);

  // Compute key KPIs for dashboard card summaries
  const kpiSummary = useMemo(() => {
    if (!ledgerData.length) {
      return { opening: 0, received: 0, returned: 0, dispatched: 0, excess: 0, shortage: 0, netVariation: 0, closing: 0 };
    }

    // 1. Group ledger data by unique combination of (fabricMasterId, sortNo, construction)
    const groups: Record<string, typeof ledgerData> = {};
    ledgerData.forEach((row) => {
      const key = `${row.fabricMasterId || "null"}|||${row.sortNo || "null"}|||${row.construction || "null"}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    // 2. Compute running stock level chronologically for each group
    const groupBalances: Record<string, { date: string; openingStock: number; closingStock: number }[]> = {};
    Object.keys(groups).forEach((key) => {
      const rows = groups[key];
      rows.sort((a, b) => a.date.localeCompare(b.date));

      let running = 0;
      groupBalances[key] = rows.map((row) => {
        const received = Number(row.receivedMtr || 0);
        const returned = Number(row.returnMtr || 0);
        const dispatch = Number(row.dispatchMtr || 0);
        const excess = Number(row.excessMtr || 0);
        const shortage = Number(row.shortageMtr || 0);

        const opening = running;
        let closing = opening + received + excess - returned - dispatch - shortage;
        if (closing < 0) {
          closing = 0;
        }
        running = closing;

        return {
          date: row.date,
          openingStock: opening,
          closingStock: closing,
        };
      });
    });

    let totalOpening = 0;
    let totalClosing = 0;

    if (filterMode === "single") {
      Object.keys(groupBalances).forEach((key) => {
        const parts = key.split("|||");
        const constr = parts[2];
        if (selectedConstruction && constr?.trim() !== selectedConstruction?.trim()) return;

        const balances = groupBalances[key];
        let lastRowBeforeOrOnSelected: any = null;
        balances.forEach((b) => {
          if (b.date <= selectedDate) {
            lastRowBeforeOrOnSelected = b;
          }
        });
        
        const balance = lastRowBeforeOrOnSelected ? lastRowBeforeOrOnSelected.closingStock : 0;
        const exactRow = balances.find(b => b.date === selectedDate);
        if (exactRow) {
          totalOpening += exactRow.openingStock;
          totalClosing += exactRow.closingStock;
        } else {
          totalOpening += balance;
          totalClosing += balance;
        }
      });
    } else {
      Object.keys(groupBalances).forEach((key) => {
        const parts = key.split("|||");
        const constr = parts[2];
        if (selectedConstruction && constr?.trim() !== selectedConstruction?.trim()) return;

        const balances = groupBalances[key];
        
        let lastRowBeforeFrom: any = null;
        balances.forEach((b) => {
          if (b.date < fromDate) {
            lastRowBeforeFrom = b;
          }
        });
        const exactFromRow = balances.find(b => b.date === fromDate);
        const groupOpening = exactFromRow ? exactFromRow.openingStock : (lastRowBeforeFrom ? lastRowBeforeFrom.closingStock : 0);
        totalOpening += groupOpening;

        let lastRowBeforeOrOnTo: any = null;
        balances.forEach((b) => {
          if (b.date <= toDate) {
            lastRowBeforeOrOnTo = b;
          }
        });
        const groupClosing = lastRowBeforeOrOnTo ? lastRowBeforeOrOnTo.closingStock : 0;
        totalClosing += groupClosing;
      });
    }

    const valOrZero = (v: any) => v === "--" || v == null ? 0 : Number(v);

    const received = processedData.reduce((sum, r) => sum + valOrZero(r.receivedMtr), 0);
    const returned = processedData.reduce((sum, r) => sum + valOrZero(r.returnMtr), 0);
    const dispatched = processedData.reduce((sum, r) => sum + valOrZero(r.dispatchMtr), 0);
    const excess = processedData.reduce((sum, r) => sum + valOrZero(r.excessMtr), 0);
    const shortage = processedData.reduce((sum, r) => sum + valOrZero(r.shortageMtr), 0);

    const calculatedClosing = totalOpening + received + excess - returned - dispatched - shortage;
    const finalClosing = calculatedClosing >= 0 ? calculatedClosing : (totalClosing > 0 ? totalClosing : 0);
    const netVariation = excess - shortage;

    return {
      opening: totalOpening,
      received,
      returned,
      dispatched,
      excess,
      shortage,
      netVariation,
      closing: finalClosing,
    };
  }, [ledgerData, processedData, filterMode, selectedDate, fromDate, toDate, selectedConstruction, selectedStatus]);

  // Table Columns config
  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: "serialNo",
        width: 60,
      },
      {
        Header: "Date",
        accessor: "displayDate",
      },
      {
        Header: "Sort No",
        accessor: "sortNo",
        Cell: ({ value }: any) => value || "—",
      },
      {
        Header: "Construction",
        accessor: "construction",
        Cell: ({ value }: any) => value || "—",
      },
      {
        Header: "Opening Stock (Mtrs)",
        accessor: "openingStock",
        Cell: ({ value }: any) => value === "--" || value === undefined || value === null ? "--" : Number(value).toFixed(3),
      },
      {
        Header: "Received (Mtrs)",
        accessor: "receivedMtr",
        Cell: ({ value }: any) => value === "--" || value === undefined || value === null ? "--" : Number(value).toFixed(3),
      },
      {
        Header: "Return (Mtrs)",
        accessor: "returnMtr",
        Cell: ({ value }: any) => value === "--" || value === undefined || value === null ? "--" : Number(value).toFixed(3),
      },
      {
        Header: "Dispatched (Mtrs)",
        accessor: "dispatchMtr",
        Cell: ({ value }: any) => value === "--" || value === undefined || value === null ? "--" : Number(value).toFixed(3),
      },
      {
        Header: "Excess (Mtrs)",
        accessor: "excessMtr",
        Cell: ({ value }: any) => value === "--" || value === undefined || value === null ? "--" : Number(value).toFixed(3),
      },
      {
        Header: "Shortage (Mtrs)",
        accessor: "shortageMtr",
        Cell: ({ value }: any) => value === "--" || value === undefined || value === null ? "--" : Number(value).toFixed(3),
      },
      {
        Header: "Closing Stock (Mtrs)",
        accessor: "closingStock",
        Cell: ({ value }: any) => value === "--" || value === undefined || value === null ? "--" : Number(value).toFixed(3),
      },
    ],
    []
  );

  const handleRowDoubleClick = (row: any) => {
    const original = row.original || row;
    const date = original.date;
    const sortNo = original.sortNo || "null";
    const construction = original.construction || "null";
    navigate(`/transaction/brushing-stock-ledger-view?date=${date}&sortNo=${encodeURIComponent(sortNo)}&construction=${encodeURIComponent(construction)}`);
  };

  const handleBackToFilters = () => {
    navigate(`/transaction/brushing-stock-ledger?mode=${filterMode}&date=${selectedDate}&from=${fromDate}&to=${toDate}&group=${grouping}&construction=${encodeURIComponent(selectedConstruction)}&status=${selectedStatus}`);
  };

  return (
    <div className="p-6 pt-16 space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={handleBackToFilters} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Filters
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Brushing Stock Ledger Report</h1>
            <p className="text-sm text-gray-500">
              {filterMode === "single" 
                ? `Filtered report for ${formatDateStr(selectedDate)}` 
                : `Filtered report from ${formatDateStr(fromDate)} to ${formatDateStr(toDate)}`}
              {selectedConstruction && ` • Construction: ${selectedConstruction}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchLedgerData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200 shadow-none">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-slate-700 font-semibold uppercase tracking-wider">Opening Stock</p>
            <p className="text-base font-bold text-slate-900 mt-1 truncate">{kpiSummary.opening.toFixed(3)}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Meters</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-none">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-blue-700 font-semibold uppercase tracking-wider">Received</p>
            <p className="text-base font-bold text-blue-900 mt-1 truncate">{kpiSummary.received.toFixed(3)}</p>
            <p className="text-[10px] text-blue-600 mt-0.5">Meters</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 shadow-none">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">Return</p>
            <p className="text-base font-bold text-amber-900 mt-1 truncate">{kpiSummary.returned.toFixed(3)}</p>
            <p className="text-[10px] text-amber-600 mt-0.5">Meters</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 shadow-none">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">Dispatched</p>
            <p className="text-base font-bold text-emerald-900 mt-1 truncate">{kpiSummary.dispatched.toFixed(3)}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Meters</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 shadow-none">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-purple-700 font-semibold uppercase tracking-wider">Excess</p>
            <p className="text-base font-bold text-purple-900 mt-1 truncate">{kpiSummary.excess.toFixed(3)}</p>
            <p className="text-[10px] text-purple-600 mt-0.5">Meters (Gain)</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200 shadow-none">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-rose-700 font-semibold uppercase tracking-wider">Shortage</p>
            <p className="text-base font-bold text-rose-900 mt-1 truncate">{kpiSummary.shortage.toFixed(3)}</p>
            <p className="text-[10px] text-rose-600 mt-0.5">Meters (Loss)</p>
          </CardContent>
        </Card>

        <Card className={`border shadow-none ${(kpiSummary.netVariation ?? 0) >= 0 ? "bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200" : "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200"}`}>
          <CardContent className="p-2.5">
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${(kpiSummary.netVariation ?? 0) >= 0 ? "text-teal-700" : "text-red-700"}`}>
              Net Variation
            </p>
            <p className={`text-base font-bold mt-1 truncate ${(kpiSummary.netVariation ?? 0) >= 0 ? "text-teal-900" : "text-red-900"}`}>
              {(kpiSummary.netVariation ?? 0) >= 0 ? `+${(kpiSummary.netVariation ?? 0).toFixed(3)}` : (kpiSummary.netVariation ?? 0).toFixed(3)}
            </p>
            <p className={`text-[10px] mt-0.5 ${(kpiSummary.netVariation ?? 0) >= 0 ? "text-teal-600" : "text-red-600"}`}>
              {(kpiSummary.netVariation ?? 0) >= 0 ? "Meters (Gain)" : "Meters (Loss)"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-100 to-indigo-200/50 border-indigo-300 shadow-none">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-indigo-800 font-semibold uppercase tracking-wider">Closing Stock</p>
            <p className="text-base font-bold text-indigo-955 mt-1 truncate">{kpiSummary.closing.toFixed(3)}</p>
            <p className="text-[10px] text-indigo-700 mt-0.5">Meters</p>
          </CardContent>
        </Card>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setViewTab("movement")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            viewTab === "movement"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Movement History
        </button>
        <button
          onClick={() => setViewTab("overall")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            viewTab === "overall"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Overall Stock Ledger
        </button>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden p-2">
        <DataTable
          columns={columns}
          data={processedData}
          title="Stock Movement Ledger"
          showExport={true}
          showPdfExport={true}
          loading={loading}
          totalColumnKeys={["openingStock", "receivedMtr", "returnMtr", "dispatchMtr", "excessMtr", "shortageMtr", "closingStock"]}
          showGrandTotal={false}
          onRowDoubleClick={handleRowDoubleClick}
          isShowPagination={false}
          virtualScroll={true}
        />
      </div>
    </div>
  );
}
