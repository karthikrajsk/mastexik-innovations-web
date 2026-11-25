import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DataTable, DateRangeFilter, MonthRangeFilter } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { AppDispatch, RootState } from "@/state/store";
import { ReportConfig, executeReport, getReportBySlug } from "@/state/reportConfigSlice";
import { toReportSlug } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const slugNameOnly = (slug: string): string =>
  slug.replace(/-\d+$/, '');

const toNameSlug = (name: string): string =>
  (name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const normalizeKey = (value: string | null | undefined) =>
  value ? value.toString().replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";

const formatReportDate = (val: any): string => {
  if (val == null || val === '') return '';
  
  // If it's already in DD/MM/YYYY format, return as is
  if (typeof val === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val.trim())) {
    return val.trim();
  }
  
  // Try parsing YYYY-MM-DD
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val.trim())) {
    const clean = val.trim().slice(0, 10);
    const [year, month, day] = clean.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const dStr = day.toString().padStart(2, '0');
      const mStr = month.toString().padStart(2, '0');
      return `${dStr}/${mStr}/${year}`;
    }
  }

  // Fallback to standard new Date parsing
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  return String(val);
};

const parseNumber = (val: any): number => {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  
  if (str.includes(',')) {
    const parts = str.split(',').map(p => p.trim());
    const isThousandsSeparator = /^\d{1,3}(,\d{3})*(\.\d+)?$/.test(str) || /^\d{1,2}(,\d{2})*(,\d{3})(\.\d+)?$/.test(str);
    if (isThousandsSeparator) {
      const cleaned = str.replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    } else {
      return parts.reduce((acc, part) => {
        const parsed = parseFloat(part);
        return acc + (isNaN(parsed) ? 0 : parsed);
      }, 0);
    }
  }
  
  const cleaned = str.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const findKeyByHeaders = (row: any, possibleHeaders: string[]): string | null => {
  if (!row) return null;
  const keys = Object.keys(row);
  for (const h of possibleHeaders) {
    const normH = h.toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, "") === normH);
    if (found) return found;
  }
  return null;
};

const matchesStatus = (rowValue: any, filterValue: string): boolean => {
  if (!filterValue || filterValue === "All") return true;
  const val = String(rowValue || "").trim().toUpperCase();
  const f = filterValue.trim().toUpperCase();
  if (val === f) return true;
  if (f === "PENDING" && val === "PENDING") return true;
  if (f === "DP" && (val === "DP" || val === "DB" || val === "DISPATCHED" || val.includes("DISPATCH") || val.includes("DB"))) return true;
  if (f === "RD" && (val === "RD" || val === "READY_FOR_DISPATCH" || val.includes("READY"))) return true;
  if (f === "UB" && (val === "UB" || val === "UNDER_BRUSHING" || val.includes("UNDER"))) return true;
  return false;
};

const ReportViewer: React.FC = () => {
  const { reportSlug } = useParams<{ reportSlug: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const reportList = useSelector((state: RootState) => state.reportConfig.reportList);
  const storeLoading = useSelector((state: RootState) => state.reportConfig.loading);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedReport, setFetchedReport] = useState<ReportConfig | null>(null);
  const [reportFetchLoading, setReportFetchLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const reportFromList = useMemo(() => {
    if (!reportSlug) return null;
    const list = Array.isArray(reportList) ? reportList : [];
    const exactMatch = list.find((item: ReportConfig) => {
      const slug = toReportSlug(item?.reportName ?? "", item?.id ?? item?.reportName ?? "");
      return slug === reportSlug;
    });
    if (exactMatch) return exactMatch;
    const nameOnly = slugNameOnly(reportSlug);
    return list.find((item: ReportConfig) =>
      toNameSlug(item?.reportName ?? "") === nameOnly
    ) ?? null;
  }, [reportList, reportSlug]);

  const report = reportFromList ?? fetchedReport;

  useEffect(() => {
    if (reportFromList || !reportSlug || storeLoading) return;
    const nameSlug = slugNameOnly(reportSlug);
    if (!nameSlug) return;
    setReportFetchLoading(true);
    dispatch(getReportBySlug({ slug: nameSlug }))
      .unwrap()
      .then((data: ReportConfig) => {
        setFetchedReport(data);
      })
      .catch(() => {
        setFetchedReport(null);
      })
      .finally(() => {
        setReportFetchLoading(false);
      });
  }, [dispatch, reportFromList, reportSlug, storeLoading]);

  const extractRows = useCallback((payload: any) => {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (!payload || typeof payload !== "object") {
      return [];
    }
    if (Array.isArray((payload as any).rows)) {
      return (payload as any).rows;
    }
    if (Array.isArray((payload as any).data)) {
      return (payload as any).data;
    }
    if (Array.isArray((payload as any).results)) {
      return (payload as any).results;
    }
    const queryData = (payload as any).queryData ?? (payload as any).data;
    if (queryData) {
      if (Array.isArray(queryData)) {
        return queryData;
      }
      if (Array.isArray(queryData.rows)) {
        return queryData.rows;
      }
      if (Array.isArray(queryData.data)) {
        return queryData.data;
      }
      if (Array.isArray(queryData?.data?.rows)) {
        return queryData.data.rows;
      }
    }
    return [];
  }, []);

  const fetchData = useCallback(async () => {
    if (!report?.id) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const reportId = typeof report.id === 'number' ? report.id : Number(report.id);
      if (isNaN(reportId) || reportId <= 0) {
        throw new Error("Invalid report ID");
      }
      const result = await dispatch(executeReport({ id: reportId, filters: {} })).unwrap();
      const mappedRows = extractRows(result);
      setRows(mappedRows);
    } catch (err: any) {
      setRows([]);
      setError(err?.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [dispatch, extractRows, report?.id]);

  useEffect(() => {
    setRows([]);
    setError(null);
    setFetchedReport(null);
    setSelectedStatus("All");
  }, [reportSlug]);

  useEffect(() => {
    if (report?.id) {
      fetchData();
    }
  }, [fetchData, report?.id]);

  const dataSample = rows.length > 0 ? rows[0] : null;

  const columnDefinitions = useMemo(() => {
    if (!Array.isArray(report?.columns) || report.columns.length === 0) {
      return [];
    }
    const sampleKeys = dataSample ? Object.keys(dataSample) : [];
    const sampleKeySet = new Set(sampleKeys);
    const normalizedSampleMap = new Map<string, string>();
    sampleKeys.forEach((key) => {
      const normalized = normalizeKey(key);
      if (normalized && !normalizedSampleMap.has(normalized)) {
        normalizedSampleMap.set(normalized, key);
      }
    });
    const usedAccessors = new Set<string>();
    return report.columns.map((column, index) => {
      const header =
        (column.columnName && column.columnName.trim()) ||
        column.fieldName ||
        `Column ${index + 1}`;
      const columnAny = column as any;
      const databaseColumnName = columnAny?.databaseColumnName as string | undefined;
      const tableName = columnAny?.tableName as string | undefined;
      const baseCandidates = [
        column.columnName,
        column.fieldName,
        databaseColumnName,
        databaseColumnName ? databaseColumnName.replace(/\s+/g, "_") : undefined,
        databaseColumnName ? databaseColumnName.replace(/\s+/g, "") : undefined,
        tableName && databaseColumnName ? `${tableName}.${databaseColumnName}` : undefined,
        header,
        header.replace(/\s+/g, "_"),
        header.replace(/\s+/g, ""),
      ].filter(Boolean) as string[];
      const candidates = Array.from(new Set(baseCandidates));
      let sourceKey: string | null = null;
      for (const candidate of candidates) {
        if (sampleKeySet.has(candidate)) {
          sourceKey = candidate;
          break;
        }
      }
      if (!sourceKey) {
        for (const candidate of candidates) {
          const normalizedCandidate = normalizeKey(candidate);
          if (normalizedCandidate && normalizedSampleMap.has(normalizedCandidate)) {
            sourceKey = normalizedSampleMap.get(normalizedCandidate)!;
            break;
          }
        }
      }
      let accessor = sourceKey ?? header;
      if (typeof accessor !== "string" || accessor.trim() === "") {
        accessor = `column_${index}`;
      }
      while (usedAccessors.has(accessor)) {
        accessor = `${accessor}_${index}`;
      }
      usedAccessors.add(accessor);
      return {
        header,
        accessor,
        sourceKey,
        candidates,
      };
    });
  }, [report?.columns, dataSample]);

  const isDateColumn = useCallback((columnName: string, accessor: string, sampleData: any) => {
    const name = (columnName || "").toLowerCase();
    const acc = (accessor || "").toLowerCase();
    
    // Check by column name or accessor
    if (
      name.includes("date") || 
      name.includes("dt") || 
      name.includes("month") ||
      acc.includes("date") || 
      acc.includes("dt") ||
      acc.includes("month")
    ) {
      return true;
    }
    
    // Check by sample data value
    if (sampleData && sampleData[accessor]) {
      const val = sampleData[accessor];
      if (typeof val === 'string' && val.trim() !== '') {
        // Handle DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return true;
        // Handle YYYY-MM-DD (ISO date)
        if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
           const date = new Date(val);
           return !isNaN(date.getTime());
        }
        // Handle Month Year like "Mar 2026"
        if (/^[A-Za-z]{3}\s\d{4}$/.test(val)) {
           const date = new Date(val);
           return !isNaN(date.getTime());
        }
      }
    }
    return false;
  }, []);

  const tableColumns = useMemo(() => {
    const reportName = report?.reportName || "";
    const isSizingReport = reportName.includes("Sizing Yarn Consumption Details Report");

    if (columnDefinitions.length > 0) {
      return columnDefinitions.map((definition: { header: string; accessor: string; }) => {
        const headerLower = definition.header.toLowerCase().trim();
        const accessorLower = definition.accessor.toLowerCase().trim();
        const isMonth = headerLower.includes("month") || accessorLower.includes("month");
        const isDate = isDateColumn(definition.header, definition.accessor, dataSample);
        const isSizInv = definition.header.toLowerCase().includes("siz inv no");
        const isSNo = ["s.no", "sno", "sl.no", "sl no", "s no", "serialno", "serial no", "sr.no", "sr no"].includes(headerLower) ||
                      accessorLower.includes("serialno") ||
                      accessorLower.includes("sno");
        const isNumericCol = headerLower.includes("quantity") ||headerLower.includes("beam received") || headerLower.includes("meter") || headerLower.includes("mtr") || headerLower.includes("amount") || headerLower.includes("balance") || headerLower.includes("consumed")
                             accessorLower.includes("quantity") || accessorLower.includes("meter") || accessorLower.includes("mtr") || accessorLower.includes("amount") || accessorLower.includes("balance");
        
        return {
          Header: definition.header,
          accessor: definition.accessor,
          disableFilters: isSNo,
          Filter: isMonth ? MonthRangeFilter : (isDate ? DateRangeFilter : undefined),
          isSectionStart: isSizingReport && isSizInv,
          Cell: isNumericCol ? ({ value }: any) => {
            if (value == null || value === '') return value;
            const num = Number(value);
            return isNaN(num) ? value : Math.round(num * 100) / 100;
          } : undefined
        };
      });
    }
    if (dataSample) {
      const usedAccessors = new Set<string>();
      return Object.keys(dataSample).map((key, index) => {
        let accessor = key;
        if (typeof accessor !== "string" || accessor.trim() === "") {
          accessor = `column_${index}`;
        }
        while (usedAccessors.has(accessor)) {
          accessor = `${accessor}_${index}`;
        }
        usedAccessors.add(accessor);
        
        const keyLower = key.toLowerCase().trim();
        const accessorLower = accessor.toLowerCase().trim();
        const isMonth = keyLower.includes("month") || accessorLower.includes("month");
        const isDate = isDateColumn(key, accessor, dataSample);
        const isSizInv = key.toLowerCase().includes("siz inv no");
        const isSNo = ["s.no", "sno", "sl.no", "sl no", "s no", "serialno", "serial no", "sr.no", "sr no"].includes(keyLower) ||
                      accessorLower.includes("serialno") ||
                      accessorLower.includes("sno");
        const isNumericCol = keyLower.includes("quantity") || keyLower.includes("meter") || keyLower.includes("mtr") || keyLower.includes("amount") || keyLower.includes("balance") ||
                             accessorLower.includes("quantity") || accessorLower.includes("meter") || accessorLower.includes("mtr") || accessorLower.includes("amount") || accessorLower.includes("balance");
        
        return {
          Header: key,
          accessor,
          disableFilters: isSNo,
          Filter: isMonth ? MonthRangeFilter : (isDate ? DateRangeFilter : undefined),
          isSectionStart: isSizingReport && isSizInv,
          Cell: isNumericCol ? ({ value }: any) => {
            if (value == null || value === '') return value;
            const num = Number(value);
            return isNaN(num) ? value : Math.round(num * 100) / 100;
          } : undefined
        };
      });
    }
    return [];
  }, [columnDefinitions, dataSample, isDateColumn, report?.reportName]);

  const preparedRows = useMemo(() => {
    if (rows.length === 0) {
      return rows;
    }

    const dateKeys = new Set<string>();
    if (columnDefinitions.length > 0) {
      columnDefinitions.forEach((def) => {
        const headerLower = def.header.toLowerCase();
        const accessorLower = def.accessor.toLowerCase();
        const isMonth = headerLower.includes("month") || accessorLower.includes("month");
        const isDate = isDateColumn(def.header, def.accessor, dataSample);
        if (isDate && !isMonth) {
          dateKeys.add(def.accessor);
        }
      });
    } else if (dataSample) {
      Object.keys(dataSample).forEach((key) => {
        const keyLower = key.toLowerCase();
        const isMonth = keyLower.includes("month");
        const isDate = isDateColumn(key, key, dataSample);
        if (isDate && !isMonth) {
          dateKeys.add(key);
        }
      });
    }

    if (columnDefinitions.length === 0) {
      return rows.map((row) => {
        const next: Record<string, any> = { ...row };
        Object.keys(next).forEach((key) => {
          if (dateKeys.has(key)) {
            next[key] = formatReportDate(next[key]);
          }
        });
        return next;
      });
    }

    return rows.map((row) => {
      const normalizedRowMap = new Map<string, string>();
      Object.keys(row).forEach((key) => {
        const normalized = normalizeKey(key);
        if (normalized && !normalizedRowMap.has(normalized)) {
          normalizedRowMap.set(normalized, key);
        }
      });
      const next: Record<string, any> = { ...row };
      columnDefinitions.forEach((definition) => {
        const { accessor, sourceKey, candidates } = definition;
        let valueKey: string | null = null;
        if (sourceKey && Object.prototype.hasOwnProperty.call(row, sourceKey)) {
          valueKey = sourceKey;
        }
        if (!valueKey) {
          for (const candidate of candidates) {
            if (Object.prototype.hasOwnProperty.call(row, candidate)) {
              valueKey = candidate;
              break;
            }
          }
        }
        if (!valueKey) {
          for (const candidate of candidates) {
            const normalizedCandidate = normalizeKey(candidate);
            if (normalizedCandidate && normalizedRowMap.has(normalizedCandidate)) {
              valueKey = normalizedRowMap.get(normalizedCandidate)!;
              break;
            }
          }
        }
        if (valueKey) {
          let val = row[valueKey];
          if (dateKeys.has(accessor)) {
            val = formatReportDate(val);
          }
          next[accessor] = val;
        } else if (!(accessor in next)) {
          next[accessor] = "";
        }
      });
      return next;
    });
  }, [rows, columnDefinitions, dataSample, isDateColumn]);

  const isBrushingDispatchReport = useMemo(() => {
    const name = (report?.reportName || "").toLowerCase();
    return name.includes("detailed brushing");
  }, [report?.reportName]);

  const filteredRows = useMemo(() => {
    if (!isBrushingDispatchReport || selectedStatus === "All") {
      return preparedRows;
    }
    const statusKey = findKeyByHeaders(preparedRows[0], ["Fabric Status", "Status", "fabric_status", "FabricStatus"]);
    if (!statusKey) return preparedRows;

    return preparedRows.filter(row => {
      const rowVal = row[statusKey];
      return matchesStatus(rowVal, selectedStatus);
    });
  }, [preparedRows, isBrushingDispatchReport, selectedStatus]);

  const { totalReceivedMtrSum, totalPassMtrSum } = useMemo(() => {
    if (!isBrushingDispatchReport) return { totalReceivedMtrSum: 0, totalPassMtrSum: 0 };

    const receivingKey = findKeyByHeaders(filteredRows[0], ["Receiving Mtr", "Receiving Meter", "Receiving Meters", "Reciving Mtr", "Reciving Meter", "Reciving Meters", "greigeMeters", "greige_meters", "ReceivingQty", "Receiving Qty"]);
    const passKey = findKeyByHeaders(filteredRows[0], ["Pass Mtr", "Pass Meter", "Pass Meters", "passMtr", "pass_mtr"]);

    const recvSum = receivingKey ? filteredRows.reduce((sum, r) => sum + parseNumber(r[receivingKey]), 0) : 0;
    const passSum = passKey ? filteredRows.reduce((sum, r) => sum + parseNumber(r[passKey]), 0) : 0;

    return { totalReceivedMtrSum: recvSum, totalPassMtrSum: passSum };
  }, [filteredRows, isBrushingDispatchReport]);


const totalColumnKeys = useMemo(() => {
  if (!preparedRows.length) return [];

  const keys = Object.keys(preparedRows[0]);
  const reportName = report?.reportName?.toLowerCase() || "";

  // 🎯 Fabric Dispatch specific columns
  if (reportName.includes("fabric dispatch")) {
    return keys.filter(k => {
      const key = k.toLowerCase();
      return (
        key.includes("rolls") ||
        key.includes("dispatched") ||
        key.includes("j/w") ||
        key.includes("jw") ||
        key.includes("total") ||
        key.includes("less")
      );
    });
  }

  // 🎯 Sizing Yarn Consumption specific columns
  if (reportName.includes("sizing yarn consumption")) {
    return keys.filter(k => {
      const key = k.toLowerCase();
      return (
        key.includes("total mtrs") ||
        key.includes("consumed") ||
        key.includes("total baby cone") ||
        key.includes("total cost") ||
        key.includes("sizing cost") ||
        key.includes("5% gst") ||
        key.includes("total inv.value")
      );
    });
  }

   if (reportName.includes("detail")) {
    return keys.filter(k => {
      const key = k.toLowerCase();
      return (
        key.includes("quantity") || key.includes("total warp")
      );
    });
  }

  // 🔥 Existing logic (keep as is but return array)
  // if (reportName.includes("inward")) {
  //   const col = keys.find(k => k.toLowerCase().includes("quantity"));
  //   return col ? [col] : [];
  // }

  return keys.filter(key => {
    const k = key.toLowerCase();
    return (
      k.includes("amount") || k.includes("avg") || k.includes("quantity") ||  k.includes("qty") ||  k.includes("mtrs") || k.includes("meter") || k.includes("meters") || k.includes("mtr") || k.includes("rolls") || k.includes("cost") || k.includes("total beam") || k.includes("issued") || k.includes("consumed") || k.includes("no of")
    );
  });

}, [preparedRows, report]);

const grandTotal = useMemo(() => {
  if (!totalColumnKeys || totalColumnKeys.length === 0) return {};

  const totals: Record<string, number> = {};
  totalColumnKeys.forEach(key => {
    const sum = filteredRows.reduce((sum, row) => sum + parseNumber(row[key]), 0);
    if (key.toLowerCase().includes("avg")) {
      totals[key] = filteredRows.length > 0 ? Number((sum / filteredRows.length).toFixed(2)) : 0;
    } else {
      totals[key] = sum;
    }
  });
  return totals;
}, [filteredRows, totalColumnKeys]);


  const hasReport = !!report;
  const hasColumns = tableColumns.length > 0;

  return (
    <div className="p-6 pt-16">
      {!hasReport && (storeLoading || reportFetchLoading) && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          Loading reports...
        </div>
      )}

      {!hasReport && !storeLoading && !reportFetchLoading && (
        <div className="rounded-md border border-dashed border-gray-300 p-6 text-sm text-gray-600">
          Report not found. Please check the navigation menu.
        </div>
      )}

      {hasReport && error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {hasReport && loading && (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          Loading report data...
        </div>
      )}

      {hasReport && !loading && !error && hasColumns && (
        <DataTable
          key={reportSlug}
          columns={tableColumns}
          data={filteredRows}
          title={report?.reportName ?? "Report"}
          showActions={false}
          showAddActions={false}
          showColumnFilters={true}
          showExport={true}
          showPdfExport={true}
          pdfFileName={report?.reportName ?? "Report"}
          filterPlaceholder="Search across report..."
          grandTotal={grandTotal}
          totalColumnKeys={totalColumnKeys}
          initialPageSize={isBrushingDispatchReport ? 100 : 10}
          pageSizeOptions={isBrushingDispatchReport ? [100, 200, 500, 1000] : undefined}
          virtualScroll={true}
          isShowPagination={false}
          headerActions={
            isBrushingDispatchReport ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={fetchData} variant="outline" size="sm" disabled={loading} className="h-7 text-xs font-semibold px-2">
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
                
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">Fabric Status:</span>
                  <select
                     value={selectedStatus}
                     onChange={(e) => setSelectedStatus(e.target.value)}
                     className="rounded-md border border-slate-200 py-0.5 px-2 text-xs font-semibold text-slate-800 bg-white shadow-sm min-w-[80px] h-7 focus:outline-none"
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="DP">DP</option>
                    <option value="RD">RD</option>
                    <option value="UB">UB</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-1.5">
                  <div className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-1 h-7">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Recv:</span>
                    <span className="text-[11px] font-extrabold text-blue-700">{totalReceivedMtrSum.toFixed(2)} m</span>
                  </div>
                  <div className="px-2 py-0.5 bg-green-50 border border-green-100 rounded-md flex items-center gap-1 h-7">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Pass:</span>
                    <span className="text-[11px] font-extrabold text-green-700">{totalPassMtrSum.toFixed(2)} m</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={fetchData} variant="outline" size="sm" disabled={loading} className="h-7 text-xs font-semibold px-2">
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
                {totalColumnKeys && totalColumnKeys.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 border-l border-slate-200 pl-1.5">
                    {totalColumnKeys.map((accessorKey) => {
                      const col = tableColumns.find((c: any) => c.accessor === accessorKey);
                      const headerLabel = col ? col.Header : accessorKey;
                      const value = grandTotal[accessorKey];
                      if (value == null || isNaN(value)) return null;
                      return (
                        <div key={accessorKey} className="px-2 py-0.5 bg-blue-50/60 border border-blue-100 rounded-md flex items-center gap-1 h-7">
                          <span className="text-[9px] uppercase font-bold text-slate-500">{headerLabel}:</span>
                          <span className="text-[11px] font-extrabold text-blue-700">
                            {Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          }
        />
      )}

      {hasReport && !loading && !error && !hasColumns && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          No columns configured for this report. Update the report configuration to add columns.
        </div>
      )}
    </div>
  );
};

export default ReportViewer;
