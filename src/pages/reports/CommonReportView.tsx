import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DataTable, DateRangeFilter, MonthRangeFilter } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { AppDispatch, RootState } from "@/state/store";
import { ReportConfig, executeReport, getReportById } from "@/state/reportConfigSlice";
import { ArrowLeft, RefreshCw, Printer, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "react-toastify";
import { exportToExcel } from "@/lib/utils";
import apiService from "@/services/ApiService";
import { CompanyHeader } from "@/components/common/CompanyHeader";

// Helper parsers and utilities
const normalizeKey = (value: string | null | undefined) =>
  value ? value.toString().replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";

const formatReportDate = (val: any): string => {
  if (val == null || val === '') return '';
  if (typeof val === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val.trim())) {
    return val.trim();
  }
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val.trim())) {
    const clean = val.trim().slice(0, 10);
    const [year, month, day] = clean.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }
  return String(val);
};

const parseRowDate = (val: any): Date | null => {
  if (val == null || val === "") return null;
  const str = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const parseNumber = (val: any): number => {
  if (val == null || val === "") return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).trim().replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const getYarnTypeLabel = (val: any): string => {
  if (val == null) return "";
  const num = Number(val);
  if (num === 1) return "warp";
  if (num === 2) return "weft";
  if (num === 3) return "both";
  return String(val).trim().toLowerCase();
};

export default function CommonReportView() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Extract navigation state
  const params = useMemo(() => {
    return (location.state as any) || null;
  }, [location.state]);

  const reportList = useSelector((state: RootState) => state.reportConfig.reportList);
  const storeLoading = useSelector((state: RootState) => state.reportConfig.loading);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedReport, setFetchedReport] = useState<ReportConfig | null>(null);

  // Redirect if state parameters are missing
  useEffect(() => {
    if (!params || !params.reportId) {
      toast.error("Please configure report filters first.");
      navigate("/reports/generate-report");
    }
  }, [params, navigate]);

  // Lookup report configuration
  const report = useMemo(() => {
    if (!params?.reportId) return null;
    const fromList = reportList.find((r) => r.id === params.reportId);
    return fromList ?? fetchedReport;
  }, [reportList, fetchedReport, params?.reportId]);

  // Dynamically enrich columns if report is Brushing Receive Report and Detailed view is chosen
  const reportColumns = useMemo(() => {
    if (!report) return [];
    const isBrushingReceive = report.reportName.toLowerCase().includes("brushing receive");
    
    if (isBrushingReceive && params?.reportType === "Detailed") {
      const columns = [...report.columns];
      const detailColsToAdd = [
        { columnName: "Piece Number", fieldName: "pieceNumber", screenName: "", sectionName: "", isFormulaApplied: false, isFilterRequired: false },
        { columnName: "Greige Mtrs", fieldName: "greigeMeters", screenName: "", sectionName: "", isFormulaApplied: false, isFilterRequired: false },
        { columnName: "Greige Wt", fieldName: "greigeWeight", screenName: "", sectionName: "", isFormulaApplied: false, isFilterRequired: false },
        { columnName: "Brushed Mtrs", fieldName: "brushedMeters", screenName: "", sectionName: "", isFormulaApplied: false, isFilterRequired: false },
        { columnName: "Brushed Wt", fieldName: "brushedWeight", screenName: "", sectionName: "", isFormulaApplied: false, isFilterRequired: false },
        { columnName: "GLM", fieldName: "glm", screenName: "", sectionName: "", isFormulaApplied: false, isFilterRequired: false }
      ];
      
      detailColsToAdd.forEach(dCol => {
        if (!columns.some(c => c.columnName.toLowerCase().replace(/[^a-z0-9]/g, "") === dCol.columnName.toLowerCase().replace(/[^a-z0-9]/g, ""))) {
          columns.push(dCol);
        }
      });
      return columns;
    }
    return report.columns;
  }, [report, params?.reportType]);

  // Fetch report configuration if not cached
  useEffect(() => {
    if (!params?.reportId || report) return;
    setLoading(true);
    dispatch(getReportById({ id: params.reportId }))
      .unwrap()
      .then((data: ReportConfig) => {
        setFetchedReport(data);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load report configuration");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch, params?.reportId, report]);

  // Extract data rows helper
  const extractRows = useCallback((payload: any) => {
    let rawRows: any[] = [];
    if (Array.isArray(payload)) rawRows = payload;
    else if (!payload || typeof payload !== "object") rawRows = [];
    else if (Array.isArray(payload.rows)) rawRows = payload.rows;
    else if (Array.isArray(payload.data)) rawRows = payload.data;
    else if (Array.isArray(payload.results)) rawRows = payload.results;
    else {
      const queryData = payload.queryData ?? payload.data;
      if (queryData) {
        if (Array.isArray(queryData)) rawRows = queryData;
        else if (Array.isArray(queryData.rows)) rawRows = queryData.rows;
        else if (Array.isArray(queryData.data)) rawRows = queryData.data;
        else if (Array.isArray(queryData?.data?.rows)) rawRows = queryData.data.rows;
      }
    }

    if (params?.reportType === "Detailed" || (location.state as any)?.reportType === "Detailed") {
      const flattened: any[] = [];
      rawRows.forEach((row: any) => {
        if (row && Array.isArray(row.details) && row.details.length > 0) {
          row.details.forEach((dtl: any) => {
            flattened.push({
              ...row,
              ...dtl,
              id: dtl.id || `${row.id}-${dtl.pieceNumber || dtl.id}`
            });
          });
        } else {
          flattened.push(row);
        }
      });
      return flattened;
    }
    return rawRows;
  }, [params?.reportType, location.state]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!report?.id) return;
    setLoading(true);
    setError(null);
    try {
      let mappedRows: any[] = [];
      const reportNameLower = report.reportName.toLowerCase();
      const reportType = params?.reportType || (location.state as any)?.reportType;
      
      if (reportNameLower.includes("brushing receive") && reportType === "Detailed") {
        const storedId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        const companyId = storedId ? Number(storedId) : null;
        if (companyId) {
          const res = await apiService.get(`/brushing/receive/company/${companyId}`);
          const rawList = Array.isArray(res) ? res : (res?.data || []);
          mappedRows = extractRows(rawList);
        } else {
          const result = await dispatch(executeReport({ id: report.id, filters: {} })).unwrap();
          mappedRows = extractRows(result);
        }
      } else {
        const result = await dispatch(executeReport({ id: report.id, filters: {} })).unwrap();
        mappedRows = extractRows(result);
      }
      setRows(mappedRows);
    } catch (err: any) {
      setRows([]);
      setError(err?.message || "Failed to execute report query");
    } finally {
      setLoading(false);
    }
  }, [dispatch, extractRows, report?.id, report?.reportName, params?.reportType, location.state]);

  useEffect(() => {
    if (report?.id) {
      fetchData();
    }
  }, [fetchData, report?.id]);

  const dataSample = rows.length > 0 ? rows[0] : null;

  const isDateColumn = useCallback((columnName: string, accessor: string, sampleData: any) => {
    const name = (columnName || "").toLowerCase();
    const acc = (accessor || "").toLowerCase();
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
    if (sampleData && sampleData[accessor]) {
      const val = sampleData[accessor];
      if (typeof val === "string" && val.trim() !== "") {
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return true;
        if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
          const date = new Date(val);
          return !isNaN(date.getTime());
        }
      }
    }
    return false;
  }, []);

  // Compute table column structure mapping
  const columnDefinitions = useMemo(() => {
    if (!Array.isArray(reportColumns) || reportColumns.length === 0) return [];
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

    return reportColumns.map((column, index) => {
      const header = column.columnName?.trim() || column.fieldName || `Column ${index + 1}`;
      const databaseColumnName = (column as any).databaseColumnName as string | undefined;
      const tableName = (column as any).tableName as string | undefined;
      
      const backendSanitizedName = header.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      const colBackendSanitizedName = column.columnName ? column.columnName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase() : "";

      const baseCandidates = [
        column.columnName,
        column.fieldName,
        databaseColumnName,
        databaseColumnName ? databaseColumnName.replace(/\s+/g, "_") : undefined,
        databaseColumnName ? databaseColumnName.replace(/\s+/g, "") : undefined,
        tableName && databaseColumnName ? `${tableName}.${databaseColumnName}` : undefined,
        header,
        backendSanitizedName,
        colBackendSanitizedName,
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

  // Generate DataTable compatible columns
  const tableColumns = useMemo(() => {
    if (columnDefinitions.length > 0) {
      const allCols = columnDefinitions.map((definition) => {
        const headerLower = definition.header.toLowerCase().trim();
        const accessorLower = definition.accessor.toLowerCase().trim();
        const isMonth = headerLower.includes("month") || accessorLower.includes("month");
        const isDate = isDateColumn(definition.header, definition.accessor, dataSample);
        const isSNo = ["s.no", "sno", "sl.no", "sl no", "s no", "serialno", "serial no", "sr.no", "sr no"].includes(headerLower) ||
                      accessorLower.includes("serialno") ||
                      accessorLower.includes("sno");
        const isNumericCol = headerLower.includes("quantity") || headerLower.includes("beam received") || headerLower.includes("meter") || headerLower.includes("mtr") || headerLower.includes("amount") || headerLower.includes("balance") || headerLower.includes("consumed") ||
                             accessorLower.includes("quantity") || accessorLower.includes("meter") || accessorLower.includes("mtr") || accessorLower.includes("amount") || accessorLower.includes("balance");

        return {
          Header: definition.header,
          accessor: definition.accessor,
          disableFilters: true,
          Filter: isMonth ? MonthRangeFilter : (isDate ? DateRangeFilter : undefined),
          Cell: isNumericCol ? ({ value }: any) => {
            if (value == null || value === "") return value;
            const num = Number(value);
            return isNaN(num) ? value : Math.round(num * 100) / 100;
          } : undefined
        };
      });

      // Filter by selection
      if (params?.selectedColumns) {
        return allCols.filter(col => params.selectedColumns.includes(col.Header));
      }
      return allCols;
    }
    return [];
  }, [columnDefinitions, dataSample, isDateColumn, params?.selectedColumns]);

  // Case-insensitive, robust value retriever from row object
  const getRowVal = useCallback((row: any, targetKey: string) => {
    if (row[targetKey] !== undefined) return row[targetKey];
    const keys = Object.keys(row);
    const normalizedTarget = normalizeKey(targetKey);
    const foundKey = keys.find(k => normalizeKey(k) === normalizedTarget);
    return foundKey ? row[foundKey] : undefined;
  }, []);

  // Format dates and extract values in rows case-insensitively
  const preparedRows = useMemo(() => {
    if (rows.length === 0) return rows;

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
    }

    return rows.map((row) => {
      const next: Record<string, any> = { ...row };
      
      columnDefinitions.forEach((definition) => {
        const { accessor, candidates } = definition;
        
        let val: any = undefined;
        let found = false;
        
        // Scan row keys case-insensitively to match any candidate key
        for (const candidate of candidates) {
          const lowerCandidate = candidate.toLowerCase();
          const matchKey = Object.keys(row).find(k => k.toLowerCase() === lowerCandidate);
          if (matchKey !== undefined) {
            val = row[matchKey];
            found = true;
            break;
          }
        }
        
        // Try normalized key lookup next
        if (!found) {
          const normalizedSampleMap = new Map<string, string>();
          Object.keys(row).forEach((k) => {
            normalizedSampleMap.set(normalizeKey(k), k);
          });
          for (const candidate of candidates) {
            const normCandidate = normalizeKey(candidate);
            if (normalizedSampleMap.has(normCandidate)) {
              val = row[normalizedSampleMap.get(normCandidate)!];
              found = true;
              break;
            }
          }
        }

        if (found) {
          if (dateKeys.has(accessor)) {
            val = formatReportDate(val);
          }
          next[accessor] = val;
        } else {
          next[accessor] = "";
        }
      });
      
      return next;
    });
  }, [rows, columnDefinitions, dataSample, isDateColumn]);

  // Client-side date and custom filtering
  const filteredRows = useMemo(() => {
    if (!params || preparedRows.length === 0) return preparedRows;

    let result = [...preparedRows];

    // 1. Date Filtering
    const dateAccessors = columnDefinitions
      .filter((def) => isDateColumn(def.header, def.accessor, dataSample))
      .map((def) => def.accessor);

    if (dateAccessors.length > 0) {
      if (params.dateMode === "single" && params.selectedDate) {
        const targetDate = new Date(params.selectedDate);
        targetDate.setHours(0, 0, 0, 0);

        result = result.filter((row) => {
          return dateAccessors.some((acc) => {
            const rowD = parseRowDate(getRowVal(row, acc));
            if (!rowD) return false;
            rowD.setHours(0, 0, 0, 0);
            return rowD.getTime() === targetDate.getTime();
          });
        });
      } else if (params.dateMode === "range" && params.fromDate && params.toDate) {
        const fromD = new Date(params.fromDate);
        fromD.setHours(0, 0, 0, 0);
        const toD = new Date(params.toDate);
        toD.setHours(23, 59, 59, 999);

        result = result.filter((row) => {
          return dateAccessors.some((acc) => {
            const rowD = parseRowDate(getRowVal(row, acc));
            if (!rowD) return false;
            return rowD.getTime() >= fromD.getTime() && rowD.getTime() <= toD.getTime();
          });
        });
      }
    }

    // 2. Custom Filter Parameters
    if (params.customFilterValues) {
      Object.entries(params.customFilterValues).forEach(([colName, filterVal]) => {
        if (filterVal === undefined || filterVal === null || filterVal === "" || (Array.isArray(filterVal) && filterVal.length === 0)) return;

        const def = columnDefinitions.find(
          (d) => d.header.toLowerCase().trim() === colName.toLowerCase().trim()
        );
        const acc = def ? def.accessor : colName;

        if (filterVal && typeof filterVal === "object" && !Array.isArray(filterVal)) {
          const fVal = filterVal as any;
          if (fVal.from !== undefined || fVal.to !== undefined) {
            const fromVal = parseFloat(fVal.from);
            const toVal = parseFloat(fVal.to);

            result = result.filter((row) => {
              const val = parseNumber(getRowVal(row, acc));
              const meetsFrom = isNaN(fromVal) ? true : val >= fromVal;
              const meetsTo = isNaN(toVal) ? true : val <= toVal;
              return meetsFrom && meetsTo;
            });
          }
        } else if (Array.isArray(filterVal)) {
          if (filterVal.length > 0) {
            const targetSet = new Set<string>();
            filterVal.forEach(v => {
              const s = String(v).trim().toLowerCase();
              targetSet.add(s);
              if (s.includes(" - ")) {
                targetSet.add(s.split(" - ")[0].trim());
              }
            });
            const isYarnTypeCol = acc.toLowerCase().includes("yarntype") || acc.toLowerCase().includes("yarn_type");
            result = result.filter((row) => {
              const rawVal = getRowVal(row, acc);
              const rowVal = isYarnTypeCol ? getYarnTypeLabel(rawVal) : String(rawVal ?? "").trim().toLowerCase();
              return targetSet.has(rowVal) || (rowVal.includes(" - ") && targetSet.has(rowVal.split(" - ")[0].trim()));
            });
          }
        } else {
          const text = String(filterVal).trim().toLowerCase();
          const isYarnTypeCol = acc.toLowerCase().includes("yarntype") || acc.toLowerCase().includes("yarn_type");
          result = result.filter((row) => {
            const rawVal = getRowVal(row, acc);
            const rowVal = isYarnTypeCol ? getYarnTypeLabel(rawVal) : String(rawVal ?? "").trim().toLowerCase();
            return rowVal.includes(text);
          });
        }
      });
    }

    return result;
  }, [preparedRows, params, columnDefinitions, isDateColumn, dataSample, getRowVal]);

  // Compute Grand Totals numeric keys
  const totalColumnKeys = useMemo(() => {
    if (filteredRows.length === 0) return [];
    const keys = Object.keys(filteredRows[0]);

    const blacklistRegex = /^(id|_id|sno|s\.no|slno|sl\.no|serialno|serial_no|dcno|dc_no|dc_number|code|phone|mobile|date|dt|month|year|status|type|name|supplier|customer|party|yarn|count|shade|color|lot|piece_no|piece_number|piecenumber|beam_no|sizedbeamno|sized_beam_no|loom|machine|setno|set_no|unit|uom|pono|po_no|sono|so_no|hsn|gstin|created_by|updated_by)$/i;

    const whitelistKeywordRegex = /(amount|avg|qty|quantity|mtr|meter|meters|mtrs|weight|wt|kg|kgs|gross|net|glm|pass|roll|rolls|cost|total|balance|stock|issued|consumed|received|recv|rejected|return|returned|rate|value|doff|cut|bag|bags|piece|pieces|doz|dozens|tare|incentive|allowance|deduction|salary|wages|payable|advance|bonus|ot|hours)/i;

    return keys.filter((key) => {
      const k = key.toLowerCase();
      
      // If it explicitly matches a numeric metric keyword, include it
      if (whitelistKeywordRegex.test(k)) {
        return true;
      }

      // If it matches a clear blacklist identifier/metadata name, exclude it
      if (blacklistRegex.test(k) || k.endsWith("id") || k.endsWith("_id") || k.endsWith("date") || k.endsWith("_dt")) {
        return false;
      }

      // Auto-detection: check if sample non-null values in filteredRows are numeric
      let numericCount = 0;
      let nonNullCount = 0;
      const sampleLimit = Math.min(filteredRows.length, 20);

      for (let i = 0; i < sampleLimit; i++) {
        const val = filteredRows[i][key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          nonNullCount++;
          const clean = String(val).replace(/,/g, "").trim();
          if (!isNaN(Number(clean)) && isFinite(Number(clean))) {
            // Ensure it's not a date string like 2026-10-01 or 01/10/2026
            if (!/^\d{4}-\d{2}-\d{2}/.test(clean) && !/^\d{1,2}\/\d{1,2}\/\d{4}/.test(clean)) {
              numericCount++;
            }
          }
        }
      }

      return nonNullCount > 0 && numericCount / nonNullCount >= 0.5;
    });
  }, [filteredRows]);

  // Resolve accessors for Group By Columns (Multi-select)
  const groupByAccessors = useMemo(() => {
    if (!params?.groupByColumns || !Array.isArray(params.groupByColumns)) return [];
    return params.groupByColumns.map((colName: string) => {
      const def = columnDefinitions.find(
        (d) => d.header.toLowerCase().trim() === colName.toLowerCase().trim()
      );
      return def ? def.accessor : colName;
    }).filter(Boolean);
  }, [params?.groupByColumns, columnDefinitions]);

  // Client-side Summary aggregation engine
  const finalDisplayRows = useMemo(() => {
    if (params?.reportType !== "Summary" || groupByAccessors.length === 0 || filteredRows.length === 0) {
      return filteredRows;
    }

    // 1. Group rows by the combined hash values of all groupByAccessors
    const groups: Record<string, { groupValues: Record<string, any>; rows: any[] }> = {};
    
    filteredRows.forEach((row) => {
      const groupValObj: Record<string, any> = {};
      groupByAccessors.forEach((acc: string) => {
        groupValObj[acc] = row[acc] != null ? String(row[acc]).trim() : "";
      });
      const hash = JSON.stringify(groupValObj);
      if (!groups[hash]) {
        groups[hash] = {
          groupValues: groupValObj,
          rows: [],
        };
      }
      groups[hash].rows.push(row);
    });

    // 2. Compute aggregated rows (sums and blank text cells)
    return Object.values(groups).map((group, index) => {
      const aggregatedRow: Record<string, any> = {
        ...group.groupValues,
        serialNo: index + 1,
        sNo: index + 1,
        "s.no": index + 1,
      };

      // Populate other descriptive fields from the first row of the group instead of blanking out
      const firstRow = group.rows[0] || {};
      tableColumns.forEach((col) => {
        if (!groupByAccessors.includes(col.accessor) && col.accessor !== "serialNo") {
          aggregatedRow[col.accessor] = firstRow[col.accessor] ?? "";
        }
      });

      // Sum all selected numeric fields
      totalColumnKeys.forEach((numKey) => {
        const sum = group.rows.reduce((acc, row) => acc + parseNumber(getRowVal(row, numKey)), 0);
        if (numKey.toLowerCase().includes("avg")) {
          aggregatedRow[numKey] = Number((sum / group.rows.length).toFixed(2));
        } else {
          aggregatedRow[numKey] = Number(sum.toFixed(2));
        }
      });

      return aggregatedRow;
    });
  }, [filteredRows, params?.reportType, groupByAccessors, tableColumns, totalColumnKeys, columnDefinitions, isDateColumn, dataSample, getRowVal]);

  // Compute Grand Totals
  const grandTotal = useMemo(() => {
    if (totalColumnKeys.length === 0) return {};
    const totals: Record<string, number> = {};
    totalColumnKeys.forEach((key) => {
      const sum = finalDisplayRows.reduce((sum, row) => sum + parseNumber(getRowVal(row, key)), 0);
      if (key.toLowerCase().includes("avg")) {
        totals[key] = finalDisplayRows.length > 0 ? Number((sum / finalDisplayRows.length).toFixed(2)) : 0;
      } else {
        totals[key] = sum;
      }
    });
    return totals;
  }, [finalDisplayRows, totalColumnKeys, getRowVal]);

  // Formatted date string for header
  const formattedHeaderDate = useMemo(() => {
    if (params?.dateMode === "single") {
      return formatReportDate(params.selectedDate);
    }
    return `${formatReportDate(params?.fromDate)} to ${formatReportDate(params?.toDate)}`;
  }, [params]);

  // Compile active filter parameters summary list for reference in header (bold layout)
  const filterNodes = useMemo(() => {
    if (!params?.customFilterValues) return null;
    const nodes: React.ReactNode[] = [];

    Object.entries(params.customFilterValues).forEach(([colName, val]) => {
      if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) return;
      
      let valDisplay: React.ReactNode;
      if (Array.isArray(val)) {
        valDisplay = <span className="font-bold text-slate-800">{val.join(", ")}</span>;
      } else if (typeof val === "object") {
        const fVal = val as any;
        if (fVal.from || fVal.to) {
          valDisplay = (
            <span className="font-bold text-slate-800">
              {fVal.from || ""} - {fVal.to || ""}
            </span>
          );
        } else {
          return;
        }
      } else {
        valDisplay = <span className="font-bold text-slate-800">{String(val)}</span>;
      }

      nodes.push(
        <span key={colName} className="text-xs font-semibold text-slate-500">
          {colName}: {valDisplay}
        </span>
      );
    });

    if (params.reportType === "Summary" && params.groupByColumns && Array.isArray(params.groupByColumns)) {
      nodes.push(
        <span key="groupBy" className="text-xs font-semibold text-slate-500">
          Group By: <span className="font-bold text-slate-800">{params.groupByColumns.join(", ")}</span>
        </span>
      );
    }

    return nodes;
  }, [params]);

  const handleExcelExport = useCallback(() => {
    if (!report) return;

    const headers = tableColumns.map(col => String(col.Header ?? ''));
    const excelData = finalDisplayRows.map((row, index) => {
      const mappedRow: Record<string, any> = {};
      tableColumns.forEach(col => {
        let val = row[col.accessor];
        const colHeaderStr = String(col.Header ?? '');
        if (colHeaderStr === 'S.No' || col.accessor === 'serialNo' || col.accessor === 'sNo' || col.accessor === 's.no') {
          val = index + 1;
        }
        mappedRow[colHeaderStr] = val;
      });
      return mappedRow;
    });

    const grandTotalForExcel: Record<string, number> = {};
    const effectiveTotalKeys = (totalColumnKeys && totalColumnKeys.length > 0)
      ? totalColumnKeys
      : (grandTotal ? Object.keys(grandTotal) : []);

    if (grandTotal && effectiveTotalKeys.length > 0) {
      effectiveTotalKeys.forEach(accessorKey => {
        const col = tableColumns.find(c => c.accessor === accessorKey);
        const headerName = col ? String(col.Header ?? accessorKey) : accessorKey;
        if (grandTotal[accessorKey] !== undefined) {
          grandTotalForExcel[headerName] = grandTotal[accessorKey];
        }
      });
    }

    const excelOptions: any = {
      headers,
      includeSerialNo: true,
    };

    if (grandTotal && Object.keys(grandTotalForExcel).length > 0) {
      excelOptions.grandTotal = grandTotalForExcel;
      excelOptions.totalColumnKeys = headers.filter(header =>
        Object.keys(grandTotalForExcel).some(gtKey =>
          String(gtKey ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
        )
      );
    }

    exportToExcel(excelData, report.reportName, excelOptions);
  }, [report, tableColumns, finalDisplayRows, grandTotal, totalColumnKeys]);

  // Auto trigger pdf / print / excel action
  useEffect(() => {
    if (!loading && rows.length > 0 && params?.actionType) {
      if (params.actionType === "excel") {
        const timer = setTimeout(() => {
          handleExcelExport();
        }, 800);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          window.print();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, rows, params?.actionType, handleExcelExport]);

  const dynamicTitle = useMemo(() => {
    if (!report) return "Report Viewer";
    return `${report.reportName} - ${formattedHeaderDate}`;
  }, [report, formattedHeaderDate]);

  const hasReport = !!report;
  const hasColumns = tableColumns.length > 0;

  return (
    <div className="p-6 pt-16 space-y-6 common-report-view-container">
      {/* Styles to remove table search and enforce landscape scale fitting for prints */}
      <style>{`
        .common-report-view-container .relative.min-w-\\[200px\\] {
          display: none !important;
        }
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          .no-print, .sidebar, header, nav, button, .buttons-wrapper {
            display: none !important;
          }
          .p-6 {
            padding: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 8pt !important;
          }
          .common-report-view-container {
            margin-top: 0 !important;
            padding-top: 0 !important;
            width: 100% !important;
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            font-size: 7.5pt !important;
            padding: 4px 6px !important;
            white-space: nowrap !important;
          }
          th {
            white-space: normal !important;
          }
        }
      `}</style>

      {/* Navigation and print action header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between no-print">
        <Button onClick={() => navigate("/reports/generate-report", { state: params })} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Generator
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-755 text-white flex items-center gap-1.5 shadow-sm"
            size="sm"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>

          <Button
            onClick={handleExcelExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
            size="sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>

          {hasReport && (
            <Button onClick={fetchData} variant="outline" disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {!hasReport && (storeLoading || loading) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-655 animate-pulse">
          Loading report configuration...
        </div>
      )}

      {hasReport && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-655 shadow-sm">
          {error}
        </div>
      )}

      {hasReport && loading && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-655 animate-pulse">
          Executing custom report data query...
        </div>
      )}

      {hasReport && !loading && !error && hasColumns && (
        <div className="space-y-6">
          {/* Company Header - Hidden on screen, visible ONLY during Print/PDF */}
          <div className="hidden print:block">
            <CompanyHeader showLogo={true} className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4" />
          </div>

          {/* Header block with: Report Name - Selected Date */}
          <div className="border-b border-slate-200 pb-4 mb-4 text-center">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {report.reportName}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
              {params?.reportType && (
                <span className="text-sm font-semibold text-slate-700 bg-slate-100 py-1 px-3 rounded-full inline-block">
                  Report Type : {params.reportType}
                </span>
              )}
              <span className="text-sm font-semibold text-indigo-650 bg-indigo-50/50 py-1 px-3 rounded-full inline-block">
                Date: {formattedHeaderDate}
              </span>
            </div>
            {filterNodes && filterNodes.length > 0 && (
              <div className="mt-2 text-center">
                <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-slate-100/60 py-1.5 px-4 rounded-xl border border-slate-200/50 max-w-3xl">
                  {filterNodes.map((node, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-slate-355 select-none">|</span>}
                      {node}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-2">
            <DataTable
              columns={tableColumns}
              data={finalDisplayRows}
              title=""
              showActions={false}
              showAddActions={false}
              showColumnFilters={false}
              showExport={false}
              showPdfExport={false}
              pdfFileName={dynamicTitle}
              grandTotal={grandTotal}
              totalColumnKeys={totalColumnKeys}
              virtualScroll={true}
              isShowPagination={false}
              showGrandTotal={false}
              headerActions={
                totalColumnKeys && totalColumnKeys.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
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
                )
              }
            />
          </div>
        </div>
      )}

      {hasReport && !loading && !error && !hasColumns && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-655 text-center">
          No columns selected to display. Please return to the Generator and select fields.
        </div>
      )}
    </div>
  );
}
