import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { AppDispatch, RootState } from "@/state/store";
import { getAllReports, executeReport } from "@/state/reportConfigSlice";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Calendar, Layers, Sliders, Printer, FileText, X, RotateCcw } from "lucide-react";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import apiService from "@/services/ApiService";

// Helper parsers and utilities for local data filtering validation
const normalizeKey = (value: string | null | undefined) =>
  value ? value.toString().replace(/[^a-zA-Z0-9]/g, "").toLowerCase() : "";

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

const getRowVal = (row: any, targetKey: string) => {
  if (!row) return undefined;
  if (row[targetKey] !== undefined && row[targetKey] !== null) return row[targetKey];

  const keys = Object.keys(row);
  const normalizedTarget = normalizeKey(targetKey);
  const foundKey = keys.find(k => normalizeKey(k) === normalizedTarget);
  if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) return row[foundKey];

  if (normalizedTarget.includes("invoice") && !normalizedTarget.includes("ref")) {
    const altKeys = ["hfplInvoiceNo", "hfpl_invoice_no", "invoiceNo", "invoice_no", "hfplInvNo", "hfpl_inv_no"];
    for (const alt of altKeys) {
      if (row[alt] !== undefined && row[alt] !== null) return row[alt];
    }
  } else if (normalizedTarget.includes("ref")) {
    const altKeys = ["refInvoiceNo", "ref_invoice_no", "refInvNo", "ref_inv_no", "millInvNo"];
    for (const alt of altKeys) {
      if (row[alt] !== undefined && row[alt] !== null) return row[alt];
    }
  }

  const detailsArr = row.details || row.brushingReceiveDetails || row.receiveDetails || row.brushingDetails || row.detailsList;
  if (Array.isArray(detailsArr) && detailsArr.length > 0) {
    for (const dtl of detailsArr) {
      if (!dtl) continue;
      if (dtl[targetKey] !== undefined && dtl[targetKey] !== null) return dtl[targetKey];
      const dtlKeys = Object.keys(dtl);
      const dtlFoundKey = dtlKeys.find(k => normalizeKey(k) === normalizedTarget);
      if (dtlFoundKey && dtl[dtlFoundKey] !== undefined && dtl[dtlFoundKey] !== null) return dtl[dtlFoundKey];
      
      if (normalizedTarget.includes("invoice") && !normalizedTarget.includes("ref")) {
        const altKeys = ["hfplInvoiceNo", "hfpl_invoice_no", "invoiceNo", "invoice_no", "hfplInvNo", "hfpl_inv_no"];
        for (const alt of altKeys) {
          if (dtl[alt] !== undefined && dtl[alt] !== null) return dtl[alt];
        }
      } else if (normalizedTarget.includes("ref")) {
        const altKeys = ["refInvoiceNo", "ref_invoice_no", "refInvNo", "ref_inv_no", "millInvNo"];
        for (const alt of altKeys) {
          if (dtl[alt] !== undefined && dtl[alt] !== null) return dtl[alt];
        }
      }
    }
  }

  return undefined;
};

const getYarnTypeLabel = (val: any): string => {
  if (val == null) return "";
  const num = Number(val);
  if (num === 1) return "warp";
  if (num === 2) return "weft";
  if (num === 3) return "both";
  return String(val).trim().toLowerCase();
};

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

// Custom Multi-Select Searchable Dropdown Component
interface MultiSearchableSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder: string;
}

function MultiSearchableSelect({ value, onChange, options, placeholder }: MultiSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = useMemo(() => {
    return options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const handleToggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <div className="relative w-full select-none" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-h-9"
      >
        <span className="text-left text-slate-700 truncate pr-4">
          {value.length === 0 ? placeholder : `${value.length} Selected`}
        </span>
        <span className="text-slate-400 text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col animate-in fade-in duration-100">
          <input
            type="text"
            placeholder="Search options..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border-b border-slate-100 text-sm focus:outline-none bg-slate-50"
          />
          <div className="overflow-y-auto flex-1 p-1 max-h-48">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No matches found</p>
            ) : (
              filtered.map(opt => {
                const isSelected = value.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => handleToggle(opt)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-slate-50 transition-all ${
                      isSelected ? "bg-indigo-50/50 text-indigo-750 font-semibold" : "text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>{opt}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      
      {/* Selected Items Badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map(val => (
            <span key={val} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-[11px] font-semibold text-slate-600">
              {val}
              <X 
                className="h-3 w-3 cursor-pointer text-slate-455 hover:text-slate-700 ml-0.5" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(val);
                }} 
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GenerateReport() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const companyId = useResolvedCompanyId();
  
  // Parse state passed when returning from CommonReportView
  const prevParams = useMemo(() => {
    return (location.state as any) || null;
  }, [location.state]);

  const { reportList, fetched, lastFetchedCompanyId } = useSelector(
    (state: RootState) => state.reportConfig
  );

  const [selectedReportId, setSelectedReportId] = useState<string>(() => {
    return prevParams?.originalReportId ? String(prevParams.originalReportId) : (prevParams?.reportId ? String(prevParams.reportId) : "");
  });
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    return prevParams?.selectedColumns || [];
  });
  const [reportType, setReportType] = useState<"Detailed" | "Summary">(() => {
    return prevParams?.reportType || "Detailed";
  });
  const [groupByColumns, setGroupByColumns] = useState<string[]>(() => {
    return prevParams?.groupByColumns || [];
  });
  const [filterByColumns, setFilterByColumns] = useState<string[]>(() => {
    return prevParams?.filterByColumns || [];
  });

  // Date modes
  const [dateMode, setDateMode] = useState<"single" | "range">(() => {
    return prevParams?.dateMode || "single";
  });
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return prevParams?.selectedDate || todayStr;
  });
  const [fromDate, setFromDate] = useState<string>(() => {
    if (prevParams?.fromDate) return prevParams.fromDate;
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    return `${y}-${m}-01`;
  });
  const [toDate, setToDate] = useState<string>(() => {
    return prevParams?.toDate || todayStr;
  });

  // Dynamic filter values fetched from background query
  const [bgRows, setBgRows] = useState<any[]>([]);
  const [bgLoading, setBgLoading] = useState(false);
  const [customFilterValues, setCustomFilterValues] = useState<Record<string, any>>(() => {
    return prevParams?.customFilterValues || {};
  });

  // Master lists loaded in background for fallback matching
  const [fabricMasters, setFabricMasters] = useState<any[]>([]);
  const [brushingReceives, setBrushingReceives] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [yarnTypesList, setYarnTypesList] = useState<any[]>([]);
  const [yarnMasters, setYarnMasters] = useState<any[]>([]);
  const [purchaseInwards, setPurchaseInwards] = useState<any[]>([]);

  const isInitialMount = useRef(true);

  // Fetch reports list
  useEffect(() => {
    const shouldFetch = !fetched || (companyId !== null && companyId !== lastFetchedCompanyId);
    if (companyId && shouldFetch) {
      dispatch(getAllReports({ companyId }));
    }
  }, [dispatch, companyId, fetched, lastFetchedCompanyId]);

  // Load masters for dropdown populate fallbacks
  useEffect(() => {
    if (!companyId) return;

    const loadMasters = async () => {
      try {
        apiService.get("/fabric-master?limit=10000&offset=0").then((res: any) => {
          const list = res?.data?.data || res?.data?.data?.data || res?.data || res || [];
          if (Array.isArray(list)) setFabricMasters(list);
        }).catch(err => console.warn("Fabric masters fetch failed:", err));

        apiService.get(`/brushing/receive/company/${companyId}`).then((res: any) => {
          const list = res?.data || res || [];
          if (Array.isArray(list)) setBrushingReceives(list);
        }).catch(err => console.warn("Brushing receives fetch failed:", err));

        apiService.get("/customer?limit=10000&offset=0").then((res: any) => {
          const list = res?.data?.data || res?.data || res || [];
          if (Array.isArray(list)) setCustomers(list);
        }).catch(err => console.warn("Customers fetch failed:", err));

        apiService.get("/vendor?limit=10000&offset=0").then((res: any) => {
          const list = res?.data?.data || res?.data || res || [];
          if (Array.isArray(list)) setVendors(list);
        }).catch(err => console.warn("Vendors fetch failed:", err));

        apiService.get("/sub-category/by-category?categoryName=Yarn Type").then((res: any) => {
          const list = res?.data?.data || res?.data || res || [];
          if (Array.isArray(list)) setYarnTypesList(list);
        }).catch(err => console.warn("Yarn types fetch failed:", err));

        apiService.get("/yarn?limit=10000&offset=0").then((res: any) => {
          const list = res?.data?.data || res?.data || res || [];
          if (Array.isArray(list)) setYarnMasters(list);
        }).catch(err => console.warn("Yarn masters fetch failed:", err));

        apiService.get(`/purchase-inward/company/${companyId}`).then((res: any) => {
          const list = res?.data || res?.data?.data || res || [];
          if (Array.isArray(list)) setPurchaseInwards(list);
        }).catch(err => console.warn("Purchase inwards fetch failed:", err));
      } catch (e) {
        console.warn("Failed to load master lists:", e);
      }
    };

    loadMasters();
  }, [companyId]);

  // Selected report object lookup
  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    const baseReport = reportList.find((r) => String(r.id) === selectedReportId) ?? null;
    if (baseReport && baseReport.reportName.toLowerCase().includes("detail yarn inward") && reportType === "Summary") {
      // Find Yarn Po Status Report
      const summaryReport = reportList.find((r) => r.reportName.toLowerCase().includes("yarn po status")) ?? null;
      if (summaryReport) return summaryReport;
    }
    return baseReport;
  }, [reportList, selectedReportId, reportType]);

  // Dynamically enrich columns if report is Brushing Receive Report and Detailed view is chosen
  const reportColumns = useMemo(() => {
    if (!selectedReport) return [];
    const isBrushingReceive = selectedReport.reportName.toLowerCase().includes("brushing receive");
    
    if (isBrushingReceive && reportType === "Detailed") {
      const columns = [...selectedReport.columns];
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
    return selectedReport.columns;
  }, [selectedReport, reportType]);

  // Reset columns and filter values ONLY when reportId changes interactively
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (prevParams) {
        return;
      }
    }

    if (selectedReport) {
      setSelectedColumns(reportColumns.map((c) => c.columnName));
      setCustomFilterValues({});
      setGroupByColumns([]);
      setFilterByColumns([]);
    } else {
      setSelectedColumns([]);
      setCustomFilterValues({});
      setGroupByColumns([]);
      setFilterByColumns([]);
    }
    setBgRows([]);
  }, [selectedReportId, reportType, reportColumns]);

  // Load sample background rows for selected report
  useEffect(() => {
    if (selectedReport?.id) {
      const loadBgData = async () => {
        setBgLoading(true);
        try {
          let rows: any[] = [];
          const reportNameLower = selectedReport.reportName.toLowerCase();
          if (reportNameLower.includes("brushing receive") && reportType === "Detailed") {
            const storedId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = storedId ? Number(storedId) : null;
            if (companyId) {
              const res = await apiService.get(`/brushing/receive/company/${companyId}`);
              rows = Array.isArray(res) ? res : (res?.data || []);
            } else {
              const result = await dispatch(executeReport({ id: selectedReport.id, filters: {} })).unwrap();
              rows = result?.rows || result?.data?.rows || result?.data || result || [];
            }
          } else {
            const result = await dispatch(executeReport({ id: selectedReport.id, filters: {} })).unwrap();
            rows = result?.rows || result?.data?.rows || result?.data || result || [];
          }
          if (Array.isArray(rows)) {
            if (reportType === "Detailed") {
              const flattened: any[] = [];
              rows.forEach((row: any) => {
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
              setBgRows(flattened);
            } else {
              setBgRows(rows);
            }
          }
        } catch (e) {
          console.warn("Background fetch failed to load dynamic filter values:", e);
        } finally {
          setBgLoading(false);
        }
      };
      loadBgData();
    }
  }, [selectedReport?.id, dispatch, reportType, selectedReport?.reportName]);

  // Dynamic values extract helper from report execution + master list mappings
  const getColumnUniqueValues = (colName: string) => {
    const values = new Set<string>();
    const colLower = colName.toLowerCase().trim();

    // Find the column config from reportColumns
    const colObj = reportColumns.find(c => c.columnName.toLowerCase().trim() === colLower);
    
    // Build candidates for finding the key in row object
    let candidates: string[] = [colName];
    if (colObj) {
      const dbCol = (colObj as any).databaseColumnName;
      const tbl = (colObj as any).tableName;
      candidates = [
        colObj.columnName,
        colObj.fieldName,
        dbCol,
        dbCol ? dbCol.replace(/\s+/g, "_") : undefined,
        dbCol ? dbCol.replace(/\s+/g, "") : undefined,
        tbl && dbCol ? `${tbl}.${dbCol}` : undefined,
        colName,
        colName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase(),
        colName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "_"),
        colName.replace(/\s+/g, "_"),
        colName.replace(/\s+/g, ""),
      ].filter(Boolean) as string[];
    }
    
    // Statically handle Yarn Type as requested
    if (colLower.includes("yarn type") || colLower.includes("yarntype")) {
      return ["Warp", "Weft", "Both"];
    }

    const isRefInvoice = colLower.includes("ref");
    if (colLower.includes("invoice")) {
      if (isRefInvoice) {
        candidates.unshift("ref_invoice_no", "refInvoiceNo", "ref_inv_no", "refInvNo");
      } else {
        candidates.unshift("hfpl_invoice_no", "hfplInvoiceNo", "hfpl_inv_no", "hfplInvNo", "invoice_no", "invoiceNo");
      }
    }

    // 1. Dynamic masters mappings for specific key words
    if (colLower.includes("construction") || colLower.includes("sort")) {
      fabricMasters.forEach(f => {
        const code = f.fabricCode || f.sortNo || f.sortNumber || f.construction;
        const quality = f.fabricQuality || "";
        if (code != null && String(code).trim() !== "") {
          const displayVal = quality ? `${String(code).trim()} - ${String(quality).trim()}` : String(code).trim();
          values.add(displayVal);
        }
      });
    }

    if (colLower.includes("invoice") || colLower.includes("ref")) {
      if (isRefInvoice) {
        brushingReceives.forEach(b => {
          const val = b.refInvoiceNo || b.ref_invoice_no;
          if (val != null && String(val).trim() !== "") values.add(String(val).trim());
        });
        brushingReceives.forEach(b => {
          if (Array.isArray(b.details)) {
            b.details.forEach((d: any) => {
              const val = d.refInvoiceNo || d.ref_invoice_no;
              if (val != null && String(val).trim() !== "") values.add(String(val).trim());
            });
          }
        });
        purchaseInwards.forEach(p => {
          const val = p.millInvNo || p.refInvoiceNo || p.ref_invoice_no;
          if (val != null && String(val).trim() !== "") values.add(String(val).trim());
        });
      } else {
        brushingReceives.forEach(b => {
          const val = b.hfplInvoiceNo || b.hfpl_invoice_no;
          if (val != null && String(val).trim() !== "") values.add(String(val).trim());
        });
        brushingReceives.forEach(b => {
          if (Array.isArray(b.details)) {
            b.details.forEach((d: any) => {
              const val = d.hfplInvoiceNo || d.hfpl_invoice_no;
              if (val != null && String(val).trim() !== "") values.add(String(val).trim());
            });
          }
        });
      }
    }

    if (colLower.includes("inward") || colLower.includes("grn")) {
  
      purchaseInwards.forEach(p => {
        const val = p.purchaseInwardNo;
        if (val != null && String(val).trim() !== "") values.add(String(val).trim());
      });
    }

        if (colLower.includes("challan")) {
  brushingReceives.forEach(b => {
        const val = b.challanNo || b.receiveChallanNo;
        if (val != null && String(val).trim() !== "") values.add(String(val).trim());
      });
        }

    if (colLower.includes("roll") || colLower.includes("piece") || colLower.includes("lot")) {
      brushingReceives.forEach(b => {
        if (Array.isArray(b.details)) {
          b.details.forEach((d: any) => {
            const val = d.rollNo || d.pieceNo || d.rollNumber;
            if (val != null && String(val).trim() !== "") values.add(String(val).trim());
          });
        }
      });
      purchaseInwards.forEach(p => {
        if (Array.isArray(p.purchaseInwardItemsDtl)) {
          p.purchaseInwardItemsDtl.forEach((item: any) => {
            if (Array.isArray(item.yarnStockDetails)) {
              item.yarnStockDetails.forEach((stock: any) => {
                const val = stock.lotNo;
                if (val != null && String(val).trim() !== "") values.add(String(val).trim());
              });
            }
          });
        }
      });
    }

    if (colLower.includes("buyer") || colLower.includes("customer")) {
      customers.forEach(c => {
        const val = c.buyerName || c.customerName || c.name || c.buyer;
        if (val != null && String(val).trim() !== "") values.add(String(val).trim());
      });
      brushingReceives.forEach(b => {
        const val = b.buyerName || b.customerName || b.buyer;
        if (val != null && String(val).trim() !== "") values.add(String(val).trim());
      });
    }

    if (colLower.includes("supplier") || colLower.includes("vendor")) {
      vendors.forEach(v => {
        const val = v.supplierName || v.vendorName || v.name;
        if (val != null && String(val).trim() !== "") values.add(String(val).trim());
      });
    }

    if (colLower.includes("yarn")) {
      yarnTypesList.forEach(y => {
        const val = y.subcategoryName || y.subCategoryName || y.name;
        if (val != null && String(val).trim() !== "") values.add(String(val).trim());
      });
      yarnMasters.forEach(y => {
        const val = y.yarnTypeName || y.yarnType || y.yarnTypeNameLabel || y.yarnCount || y.yarnCountLabel;
        if (val != null && String(val).trim() !== "") values.add(String(val).trim());
      });
    }

    if (colLower.includes("fabric status") || (colLower.includes("status") && selectedReport?.reportName.toLowerCase().includes("brushing"))) {
      return ["Pending", "UB", "Rolling", "DP"].sort();
    }

    // 2. Generic fallback to query execution rows matching any of the candidates
    if (bgRows && bgRows.length > 0) {
      // Find matching key in the row map using candidates
      const rowKeys = Object.keys(bgRows[0]);
      let matchedKey: string | null = null;
      
      for (const candidate of candidates) {
        const key = rowKeys.find(k => {
          const kLower = k.toLowerCase();
          const candLower = candidate.toLowerCase();
          if (!isRefInvoice && colLower.includes("invoice") && kLower.includes("ref")) {
            return false;
          }
          return kLower === candLower;
        });
        if (key) {
          matchedKey = key;
          break;
        }
      }
      
      if (!matchedKey) {
        // Normalized matching fallback
        const normCandidates = candidates.map(c => normalizeKey(c));
        for (const candidate of normCandidates) {
          const key = rowKeys.find(k => {
            const kNorm = normalizeKey(k);
            if (!isRefInvoice && colLower.includes("invoice") && kNorm.includes("ref")) {
              return false;
            }
            return kNorm === candidate;
          });
          if (key) {
            matchedKey = key;
            break;
          }
        }
      }
      
      if (matchedKey) {
        bgRows.forEach((row) => {
          let val = row[matchedKey!];
          // If the column is Yarn Type, convert the ID to label dynamically
          const isYarnTypeCol = matchedKey!.toLowerCase().includes("yarntype") || matchedKey!.toLowerCase().includes("yarn_type");
          if (isYarnTypeCol) {
            val = getYarnTypeLabel(val);
          }
          if (val !== undefined && val !== null && String(val).trim() !== "") {
            values.add(String(val).trim());
          }
        });
      }
    }

    return Array.from(values).sort();
  };

  const handleRemoveColumn = (colName: string) => {
    setSelectedColumns((prev) => prev.filter((c) => c !== colName));
    setGroupByColumns((prev) => prev.filter((c) => c !== colName));
    setFilterByColumns((prev) => prev.filter((c) => c !== colName));
  };

  const handleResetColumns = () => {
    if (selectedReport) {
      setSelectedColumns(reportColumns.map((c) => c.columnName));
    }
  };

  // Local filter verification engine inside the generator page
  const checkFilterMatches = (): boolean => {
    // If background data returned 0 rows, bypass check (allow them to load empty report view)
    if (bgRows.length === 0) return true;

    let result = [...bgRows];

    // 1. Date filter mapping
    const colDefs = reportColumns;
    const dateAccessors = colDefs
      .filter((col) => {
        const name = (col.columnName || "").toLowerCase();
        const acc = (col.fieldName || "").toLowerCase();
        return name.includes("date") || name.includes("dt") || name.includes("month") || acc.includes("date") || acc.includes("dt") || acc.includes("month");
      })
      .map((col) => col.fieldName || col.columnName);

    if (dateAccessors.length > 0) {
      if (dateMode === "single" && selectedDate) {
        const targetDate = new Date(selectedDate);
        targetDate.setHours(0, 0, 0, 0);
        result = result.filter((row) => {
          return dateAccessors.some((acc) => {
            const rowD = parseRowDate(getRowVal(row, acc));
            if (!rowD) return false;
            rowD.setHours(0, 0, 0, 0);
            return rowD.getTime() === targetDate.getTime();
          });
        });
      } else if (dateMode === "range" && fromDate && toDate) {
        const fromD = new Date(fromDate);
        fromD.setHours(0, 0, 0, 0);
        const toD = new Date(toDate);
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

    // 2. Custom filter parameter mapping
    let filterApplied = false;
    Object.entries(customFilterValues).forEach(([colName, filterVal]) => {
      if (filterVal === undefined || filterVal === null || filterVal === "" || (Array.isArray(filterVal) && filterVal.length === 0)) return;
      filterApplied = true;

      const colObj = colDefs.find(c => c.columnName === colName);
      const acc = colObj ? (colObj.fieldName || colObj.columnName) : colName;

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
          const targetSet = new Set(filterVal.map(v => String(v).trim().toLowerCase()));
          const isYarnTypeCol = acc.toLowerCase().includes("yarntype") || acc.toLowerCase().includes("yarn_type");
          result = result.filter((row) => {
            const rawVal = getRowVal(row, acc);
            const rowVal = isYarnTypeCol ? getYarnTypeLabel(rawVal) : String(rawVal ?? "").trim().toLowerCase();
            let match = targetSet.has(rowVal);
            if (!match && rowVal.includes(" - ")) {
              match = targetSet.has(rowVal.split(" - ")[0].trim());
            }
            return match;
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

    // If filters were applied and no rows matched, return false (throw validation error)
    if (filterApplied && result.length === 0) {
      return false;
    }
    return true;
  };

  const handleNavigateView = (actionType?: "pdf" | "print" | "excel") => {
    if (!selectedReport) {
      toast.warn("Please select a report first.");
      return;
    }

    if (selectedColumns.length === 0) {
      toast.warn("Please keep at least one column selected.");
      return;
    }

    if (reportType === "Summary" && groupByColumns.length === 0) {
      toast.warn("Please choose at least one column to Group By for the Summary report.");
      return;
    }

    // Run filter matching validation check
    if (!checkFilterMatches()) {
      toast.error("there is no report data found which you grouped");
      return;
    }

    navigate("/reports/common-report-view", {
      state: {
        reportId: selectedReport.id,
        originalReportId: selectedReportId,
        selectedColumns,
        reportType,
        groupByColumns,
        filterByColumns,
        dateMode,
        selectedDate,
        fromDate,
        toDate,
        customFilterValues,
        actionType
      }
    });
  };

  // Compile active list of custom filters to render (Filter By Columns + all Summary Group By Columns)
  const activeFilterColumns = useMemo(() => {
    if (!selectedReport) return [];
    
    const activeNames = new Set(filterByColumns);
    
    // Automatically include all Summary group by columns in the filter panel
    if (reportType === "Summary" && groupByColumns.length > 0) {
      groupByColumns.forEach(col => activeNames.add(col));
    }
    
    return reportColumns.filter(c => activeNames.has(c.columnName)).map(c => ({
      ...c,
      isFilterRequired: true,
      filterType: "Dropdown"
    }));
  }, [selectedReport, reportColumns, filterByColumns, reportType, groupByColumns]);

  return (
    <div className="p-6 pt-16 mt-5 max-w-5xl mx-auto space-y-6">
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6 text-indigo-655 animate-pulse" />
          Dynamic Report Generator
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a report configuration, choose columns, specify types, and filter data dynamically.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Step 1: Selection Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Report Name
            </label>
            <CommonSearchableSelect
              value={selectedReportId}
              onValueChange={setSelectedReportId}
              placeholder="Select a Report Configuration"
              options={reportList
                .filter((rep) => {
                  const name = rep.reportName.toLowerCase();
                  return name.includes("brushing") || name.includes("yarn inward") || name.includes("yarn po status") || name.includes("weaving production");
                })
                .map((rep) => ({
                  id: rep.id,
                  value: String(rep.id),
                  label: rep.reportName,
                }))}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Report Type
            </label>
            <CommonSearchableSelect
              value={reportType}
              onValueChange={(val) => setReportType(val as any)}
              placeholder="Select Report Type"
              options={[
                { value: "Detailed", label: "Detailed View" },
                { value: "Summary", label: "Summary View (Totals Only)" },
              ]}
            />
          </div>
        </div>

        {/* Step 1.5: Dynamic Group By Selector (Multi-Select, only shown in Summary mode) */}
        {reportType === "Summary" && selectedReport && (
          <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
            <label className="text-xs font-bold text-indigo-855 uppercase tracking-wider">
              Group By Column <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-1">
              Select which field(s) you want to group the summarized data by.
            </p>
            <MultiSearchableSelect
              value={groupByColumns}
              onChange={setGroupByColumns}
              placeholder="Select Grouping Categories"
              options={selectedColumns}
            />
          </div>
        )}

        {/* Step 1.6: Dynamic Filter By Column Selector (Only shown in Detailed mode) */}
        {selectedReport && reportType === "Detailed" && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filter By Column
            </label>
            <p className="text-xs text-slate-500 mb-1">
              Select which columns you want to apply custom filters for.
            </p>
            <MultiSearchableSelect
              value={filterByColumns}
              onChange={setFilterByColumns}
              placeholder="Select Columns to Filter"
              options={selectedColumns}
            />
          </div>
        )}

        {/* Step 2: Date Filters configuration */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Date Filters
            </span>
            
            {/* Toggle Mode */}
            <div className="flex items-center bg-slate-200 p-0.5 rounded-lg border border-slate-300">
              <button
                onClick={() => setDateMode("single")}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                  dateMode === "single" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-650"
                }`}
              >
                Single Date
              </button>
              <button
                onClick={() => setDateMode("range")}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                  dateMode === "range" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-655"
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dateMode === "single" ? (
              <div className="flex flex-col">
                <label className="text-xs text-slate-500 mb-1">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  max={todayStr}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-500 mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-500 mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    max={todayStr}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Step 3: Required Fields Selection */}
        {selectedReport && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-500" />
                Required Fields ({selectedColumns.length} Selected)
              </span>
              <button
                onClick={handleResetColumns}
                className="text-xs text-indigo-660 hover:text-indigo-700 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Columns
              </button>
            </div>

            <div className="border border-slate-200 p-4 rounded-xl flex flex-wrap gap-2 bg-slate-50/50">
              {reportColumns.map((col) => {
                const isSelected = selectedColumns.includes(col.columnName);
                return (
                  <div
                    key={col.columnName}
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveColumn(col.columnName);
                      } else {
                        setSelectedColumns((prev) => [...prev, col.columnName]);
                      }
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer select-none transition-all shadow-sm ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span>{col.columnName}</span>
                    {isSelected && (
                      <X
                        className="h-3 w-3 text-indigo-500 ml-0.5 hover:text-indigo-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveColumn(col.columnName);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Custom Filters Configuration */}
        {selectedReport && activeFilterColumns.length > 0 && (
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-4">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-indigo-500" />
              Custom Report Filters
            </span>

            {bgLoading ? (
              <p className="text-xs text-slate-500 animate-pulse">Loading dynamic filter parameters...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeFilterColumns.map((col) => {
                  const uniqueVals = getColumnUniqueValues(col.columnName);
                  
                  return (
                    <div key={col.columnName} className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-655 flex items-center gap-1">
                        Filter by {col.columnName}
                        {groupByColumns.includes(col.columnName) && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold ml-1">
                            Group Category
                          </span>
                        )}
                      </label>
                      
                      {col.filterType === "Dropdown" || col.filterType === "Checkbox" ? (
                        <MultiSearchableSelect
                          value={customFilterValues[col.columnName] || []}
                          onChange={(vals) =>
                            setCustomFilterValues((prev) => ({
                              ...prev,
                              [col.columnName]: vals,
                            }))
                          }
                          placeholder={`All ${col.columnName}s (Select multiple)`}
                          options={uniqueVals}
                        />
                      ) : col.filterType === "Radio" ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {uniqueVals.map((val) => {
                            const isChecked = customFilterValues[col.columnName] === val;
                            return (
                              <button
                                key={val}
                                onClick={() =>
                                  setCustomFilterValues((prev) => ({
                                    ...prev,
                                    [col.columnName]: isChecked ? "" : val
                                  }))
                                }
                                className={`px-3 py-1 border rounded-lg text-xs font-medium transition-all ${
                                  isChecked
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      ) : col.filterType === "From & To" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="From"
                            value={customFilterValues[col.columnName]?.from || ""}
                            onChange={(e) =>
                              setCustomFilterValues((prev) => ({
                                ...prev,
                                [col.columnName]: {
                                  ...prev[col.columnName],
                                  from: e.target.value
                                }
                              }))
                            }
                            className="w-1/2 rounded-xl border border-slate-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-slate-400 text-xs">-</span>
                          <input
                            type="text"
                            placeholder="To"
                            value={customFilterValues[col.columnName]?.to || ""}
                            onChange={(e) =>
                              setCustomFilterValues((prev) => ({
                                ...prev,
                                [col.columnName]: {
                                  ...prev[col.columnName],
                                  to: e.target.value
                                }
                              }))
                            }
                            className="w-1/2 rounded-xl border border-slate-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ) : (
                        // Field Name filter - text input
                        <input
                          type="text"
                          placeholder={`Enter ${col.columnName}...`}
                          value={customFilterValues[col.columnName] || ""}
                          onChange={(e) =>
                            setCustomFilterValues((prev) => ({
                              ...prev,
                              [col.columnName]: e.target.value
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action Panel */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            onClick={() => handleNavigateView("print")}
            variant="outline"
            disabled={!selectedReport}
            className="border-slate-200 text-slate-700 flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={() => handleNavigateView("pdf")}
            variant="outline"
            disabled={!selectedReport}
            className="border-indigo-100 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            onClick={() => handleNavigateView("excel")}
            variant="outline"
            disabled={!selectedReport}
            className="border-emerald-100 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            Export Excel
          </Button>
          <Button
            onClick={() => handleNavigateView()}
            disabled={!selectedReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center shadow-sm px-6 h-9"
          >
            View
          </Button>
        </div>
      </div>
    </div>
  );
}
