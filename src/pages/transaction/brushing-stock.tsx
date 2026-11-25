import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getBrushingStock } from "@/state/brushingSlice";
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { formatDate } from "@/lib/utils";
import apiService from "@/services/ApiService";
import { toast } from "react-toastify";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

export default function BrushingStock() {
  const dispatch = useDispatch<AppDispatch>();
  const { brushingStockList, loading } = useSelector((state: RootState) => state.brushing);

  const [companyId, setCompanyId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedHoInvoice, setSelectedHoInvoice] = useState<string>("ALL");
  const [selectedHfplInvoice, setSelectedHfplInvoice] = useState<string>("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedCompanyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    if (storedCompanyId) {
      setCompanyId(Number(storedCompanyId));
    }
  }, []);

  const fetchBrushingStock = () => {
    if (companyId) {
      dispatch(
        getBrushingStock({
          companyId,
          status: selectedStatus,
        })
      );
    }
  };

  useEffect(() => {
    fetchBrushingStock();
  }, [dispatch, companyId, selectedStatus]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const hoInvoiceOptions = useMemo(() => {
    const uniques = new Set<string>();
    brushingStockList.forEach((item: any) => {
      if (item.hoInvoiceNo) uniques.add(item.hoInvoiceNo.trim());
    });
    return Array.from(uniques).sort();
  }, [brushingStockList]);

  const hfplInvoiceOptions = useMemo(() => {
    const uniques = new Set<string>();
    brushingStockList.forEach((item: any) => {
      if (item.hfplInvoiceNo) uniques.add(item.hfplInvoiceNo.trim());
    });
    return Array.from(uniques).sort();
  }, [brushingStockList]);

  const processedList = useMemo(() => {
    let list = brushingStockList.map((item: any, index: number) => ({
      ...item,
      serialNo: index + 1,
    }));

    if (selectedHoInvoice !== "ALL") {
      list = list.filter((item: any) => item.hoInvoiceNo?.trim() === selectedHoInvoice);
    }
    if (selectedHfplInvoice !== "ALL") {
      list = list.filter((item: any) => item.hfplInvoiceNo?.trim() === selectedHfplInvoice);
    }

    return list.map((item: any, index: number) => ({
      ...item,
      serialNo: index + 1,
    }));
  }, [brushingStockList, selectedHoInvoice, selectedHfplInvoice]);

  const totals = useMemo(() => {
    return processedList.reduce(
      (acc, item: any) => {
        acc.receiving += Number(item.receivingMtr || 0);
        acc.pass += Number(item.passMtr || 0);
        return acc;
      },
      { receiving: 0, pass: 0 }
    );
  }, [processedList]);

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: "serialNo",
        width: 60,
        disableFilters: true,
      },
      {
        Header: "Date",
        accessor: "date",
         Cell: ({ value }: { value: string }) => {
                  const date = new Date(value);
                  const day = date.getDate().toString().padStart(2, '0');
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                },  
                Filter: DateRangeFilter,
                filter: (rows: any[], columnIds: string[], filterValue: any) => {
                  if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
                  return rows.filter(row => {
                    const dateStr = row.values[columnIds[0]];
                    const date = new Date(dateStr);
                    if (filterValue.from) {
                      const fromDate = new Date(filterValue.from);
                      if (date < fromDate) return false;
                    }
                    if (filterValue.to) {
                      const toDate = new Date(filterValue.to);
                      if (date > toDate) return false;
                    }
                    return true;
                  });
                }
      },
      {
        Header: "Party Name",
        accessor: "partyName",
      },
      {
        Header: "H.O Invoice No",
        accessor: "hoInvoiceNo",
      },
      {
        Header: "TC",
        accessor: "tc",
      },
      {
        Header: "Construction",
        accessor: "construction",
      },
      {
        Header: "Weave",
        accessor: "weave",
      },
      {
        Header: "Roll No",
        accessor: "rollNo",
      },
      {
        Header: "Receiving Mtr",
        accessor: "receivingMtr",
        Cell: ({ value }: { value: number }) => (value ? value.toFixed(3) : "0.000"),
      },
      {
        Header: "Gross Wt",
        accessor: "grossWt",
        Cell: ({ value }: { value: number }) => (value ? value.toFixed(3) : "0.000"),
      },
      {
        Header: "Net Wt",
        accessor: "netWt",
        Cell: ({ value }: { value: number }) => (value ? value.toFixed(3) : "0.000"),
      },
      {
        Header: "Pass Mtr",
        accessor: "passMtr",
        Cell: ({ value }: { value: number }) => (value ? value.toFixed(3) : "0.000"),
      },
      {
        Header: "GLM",
        accessor: "glm",
        Cell: ({ value }: { value: number }) => (value ? value.toFixed(3) : "0.000"),
      },
      {
        Header: "Rolling Date",
        accessor: "rollingDate",
        Cell: ({ value }: { value: string }) => formatDate(value),
        Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
          return rows.filter(row => {
            const dateStr = row.values[columnIds[0]];
            const date = new Date(dateStr);
            if (filterValue.from) {
              const fromDate = new Date(filterValue.from);
              if (date < fromDate) return false;
            }
            if (filterValue.to) {
              const toDate = new Date(filterValue.to);
              if (date > toDate) return false;
            }
            return true;
          });
        }
      },
      {
        Header: "HFPL Roll No",
        accessor: "hfplRollNo",
      },
      {
        Header: "Variation",
        accessor: "variation",
        Cell: ({ value }: { value: number }) => (value ? value.toFixed(3) : "0.000"),
      },
      {
        Header: "Variation %",
        accessor: "variationPercentage",
        Cell: ({ value }: { value: number }) => (value ? `${value.toFixed(2)}%` : "0.00%"),
      },
      {
        Header: "Dispatch Date",
        accessor: "dispatchDate",
        Cell: ({ value }: { value: string }) => formatDate(value),
        Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
          return rows.filter(row => {
            const dateStr = row.values[columnIds[0]];
            const date = new Date(dateStr);
            if (filterValue.from) {
              const fromDate = new Date(filterValue.from);
              if (date < fromDate) return false;
            }
            if (filterValue.to) {
              const toDate = new Date(filterValue.to);
              if (date > toDate) return false;
            }
            return true;
          });
        }
      },
      {
        Header: "HFPL Invoice No",
        accessor: "hfplInvoiceNo",
      },
      {
        Header: "HFPL DC No",
        accessor: "hfplDcNo",
      },
      {
        Header: "PO No",
        accessor: "poNo",
      },
      {
        Header: "Remarks",
        accessor: "remarks",
      },
      {
        Header: "Fabric Status",
        accessor: "fabricStatus",
        Filter: ({ column: { filterValue, setFilter } }: any) => (
          <select
            value={selectedStatus}
            onChange={(e) => {
              const val = e.target.value;
              handleStatusChange(val);
            }}
            className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium bg-white"
          >
            <option value="ALL">All</option>
            <option value="DP">DP</option>
            <option value="UB">UB</option>
            <option value="RD">RD</option>
          </select>
        ),
        Cell: ({ value }: { value: string }) => {
          let badgeColor = "bg-slate-100  dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800";
          if (value === "DP") {
            badgeColor = "text-slate-800";
          } else if (value === "UB") {
            badgeColor = "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900";
          } else if (value === "RD") {
            badgeColor = "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-900";
          }
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${badgeColor}`}>
              {value || "-"}
            </span>
          );
        },
      },
    ],
    [selectedStatus]
  );

  const parseExcelDate = (val: any): string | null => {
    if (!val) return null;
    if (val instanceof Date) {
      return val.toISOString().split("T")[0];
    }
    if (typeof val === "number") {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toISOString().split("T")[0];
    }
    const str = String(val).trim();
    if (!str) return null;

    const parts = str.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return str;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }

    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch (e) {}

    return null;
  };

  const parseExcelNumber = (val: any): number => {
    if (val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const findHeaderIndex = (headers: string[], possibleNames: string[]) => {
    return headers.findIndex((h) => possibleNames.includes(h.toUpperCase().replace(/\./g, "").replace(/\s+/g, "")));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!companyId) {
      toast.error("No company selected. Please select a company first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];

        if (rawData.length < 2) {
          toast.error("Excel sheet is empty or contains no data rows.");
          return;
        }

        const headers = (rawData[0] as string[]).map((h) => String(h || "").trim().toUpperCase());

        const dateIdx = findHeaderIndex(headers, ["DATE"]);
        const partyIdx = findHeaderIndex(headers, ["PARTYNAME", "PARTY"]);
        const hoInvoiceIdx = findHeaderIndex(headers, ["HOINVOICEN", "HOINVOICENO", "HOINVOICE"]);
        const tcIdx = findHeaderIndex(headers, ["TC"]);
        const constIdx = findHeaderIndex(headers, ["CONSTRUCTION"]);
        const weaveIdx = findHeaderIndex(headers, ["WEAV", "WEAVE"]);
        const rollIdx = findHeaderIndex(headers, ["ROLLNO", "ROLL"]);
        const recMtrIdx = findHeaderIndex(headers, ["RECIVINGMTR", "RECEIVINGMTR", "RECMTR"]);
        const grossWtIdx = findHeaderIndex(headers, ["GROSSWT", "GROSSWEIGHT"]);
        const netWtIdx = findHeaderIndex(headers, ["NETWT", "NETWEIGHT"]);
        const passMtrIdx = findHeaderIndex(headers, ["PASSMTR", "PASSMETER"]);
        const glmIdx = findHeaderIndex(headers, ["GLM"]);
        const rollDateIdx = findHeaderIndex(headers, ["ROLLINGDATE"]);
        const hfplRollIdx = findHeaderIndex(headers, ["HFPLROLLNO", "HFPLROLL"]);
        const dispDateIdx = findHeaderIndex(headers, ["DISPATCHDATE"]);
        const hfplInvIdx = findHeaderIndex(headers, ["HFPLINVOICENO", "HFPLINVOICE"]);
        const hfplDcIdx = findHeaderIndex(headers, ["HFPLDCNO", "HFPLDC"]);
        const poIdx = findHeaderIndex(headers, ["PONO", "PO"]);
        const remarksIdx = findHeaderIndex(headers, ["REMARKS"]);
        const statusIdx = findHeaderIndex(headers, ["FABRICSTATUS", "STATUS"]);

        if (partyIdx < 0 || rollIdx < 0) {
          toast.error("Required columns (Party Name, Roll No) not found in the uploaded file.");
          return;
        }

        const rowsToSave: any[] = [];
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const isEmpty = row.every((cell: any) => cell === null || cell === undefined || String(cell).trim() === "");
          if (isEmpty) continue;

          const date = dateIdx >= 0 ? parseExcelDate(row[dateIdx]) : null;
          const partyName = partyIdx >= 0 ? String(row[partyIdx] || "").trim() : "";
          const hoInvoiceNo = hoInvoiceIdx >= 0 ? String(row[hoInvoiceIdx] || "").trim() : "";
          const tc = tcIdx >= 0 ? String(row[tcIdx] || "").trim() : "";
          const construction = constIdx >= 0 ? String(row[constIdx] || "").trim() : "";
          const weave = weaveIdx >= 0 ? String(row[weaveIdx] || "").trim() : "";
          const rollNo = rollIdx >= 0 ? String(row[rollIdx] || "").trim() : "";
          const receivingMtr = recMtrIdx >= 0 ? parseExcelNumber(row[recMtrIdx]) : 0;
          const grossWt = grossWtIdx >= 0 ? parseExcelNumber(row[grossWtIdx]) : 0;
          const netWt = netWtIdx >= 0 ? parseExcelNumber(row[netWtIdx]) : 0;
          const passMtr = passMtrIdx >= 0 ? parseExcelNumber(row[passMtrIdx]) : 0;
          const glm = glmIdx >= 0 ? parseExcelNumber(row[glmIdx]) : 0;
          const rollingDate = rollDateIdx >= 0 ? parseExcelDate(row[rollDateIdx]) : null;
          const hfplRollNo = hfplRollIdx >= 0 ? String(row[hfplRollIdx] || "").trim() : "";
          const dispatchDate = dispDateIdx >= 0 ? parseExcelDate(row[dispDateIdx]) : null;
          const hfplInvoiceNo = hfplInvIdx >= 0 ? String(row[hfplInvIdx] || "").trim() : "";
          const hfplDcNo = hfplDcIdx >= 0 ? String(row[hfplDcIdx] || "").trim() : "";
          const poNo = poIdx >= 0 ? String(row[poIdx] || "").trim() : "";
          const remarks = remarksIdx >= 0 ? String(row[remarksIdx] || "").trim() : "";
          const fabricStatus = statusIdx >= 0 ? String(row[statusIdx] || "").trim() : "";

          const variation = passMtr - receivingMtr;
          const variationPercentage = passMtr > 0 ? (variation / passMtr) * 100 : 0;

          rowsToSave.push({
            date,
            partyName,
            hoInvoiceNo,
            tc,
            construction,
            weave,
            rollNo,
            receivingMtr,
            grossWt,
            netWt,
            passMtr,
            glm,
            rollingDate,
            hfplRollNo,
            variation,
            variationPercentage,
            dispatchDate,
            hfplInvoiceNo,
            hfplDcNo,
            poNo,
            remarks,
            fabricStatus,
            companyId,
          });
        }

        if (rowsToSave.length === 0) {
          toast.warning("No valid rows found to save.");
          return;
        }

        const saveResponse = await apiService.post("/brushing-stock/bulk", rowsToSave);
        if (saveResponse && saveResponse.status === "success") {
          toast.success(`Successfully uploaded ${rowsToSave.length} stock entries!`);
          fetchBrushingStock();
        } else {
          toast.error(saveResponse?.message || "Failed to save stock entries");
        }
      } catch (error) {
        console.error("Excel processing error:", error);
        toast.error("Error processing Excel file. Please check column format.");
      } finally {
        if (e.target) e.target.value = ""; // clear file input
      }
    };
    reader.readAsBinaryString(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const headerActionsJSX = (
    <div className="flex flex-wrap items-center gap-4 text-black">
      {/* Totals Section */}
      <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-200 shadow-sm">
        <div className="px-3 py-1 rounded bg-white shadow-sm border border-slate-100">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Rec. Mtr</span>
          <span className="text-sm font-bold text-blue-600">{totals.receiving.toFixed(3)}</span>
        </div>
        <div className="px-3 py-1 rounded bg-white shadow-sm border border-slate-100">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Pass Mtr</span>
          <span className="text-sm font-bold text-emerald-600">{totals.pass.toFixed(3)}</span>
        </div>
      </div>

      {/* H.O Invoice Dropdown */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-700">H.O Invoice:</span>
        <CommonSearchableSelect
          value={selectedHoInvoice}
          onValueChange={setSelectedHoInvoice}
          className="w-48 text-black font-medium"
        >
          <option value="ALL">All H.O Invoices</option>
          {hoInvoiceOptions.map((inv) => (
            <option key={inv} value={inv}>{inv}</option>
          ))}
        </CommonSearchableSelect>
      </div>

      {/* HFPL Invoice Dropdown */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-700">HFPL Invoice:</span>
        <CommonSearchableSelect
          value={selectedHfplInvoice}
          onValueChange={setSelectedHfplInvoice}
          className="w-48 text-black font-medium"
        >
          <option value="ALL">All HFPL Invoices</option>
          {hfplInvoiceOptions.map((inv) => (
            <option key={inv} value={inv}>{inv}</option>
          ))}
        </CommonSearchableSelect>
      </div>

      {/* File Upload Action */}
      <div className="flex items-center gap-2">
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
        <button
          onClick={triggerFileSelect}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={loading}
        >
          <Upload size={14} />
          <span>Upload Stock Excel</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={processedList}
        title="Opening Dispatched Rolls Entries"
        headerActions={headerActionsJSX}
        showActions={false}
        showColumnFilters={true}
        filterPlaceholder="Search Opening Dispatched Rolls..."
        loading={loading}
        initialPageSize={100}
        pageSizeOptions={[10, 20, 50, 100, 500, 1000]}
      />
    </div>
  );
}
