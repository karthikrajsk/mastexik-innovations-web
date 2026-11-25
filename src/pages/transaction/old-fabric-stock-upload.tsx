import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllFabricMastersForDropdown } from "@/state/fabricMasterSlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import {
  validateOldStockExcel,
  uploadOldFabricStock,
  fetchOldStockUploadHistory,
  clearValidatedData,
  OldStockRowRecord,
} from "@/state/oldFabricStockSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  History,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Layers,
  Ruler,
  TrendingUp,
  Truck,
  CheckCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

export const OldFabricStockUpload: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { fabricMasterFullList } = useSelector((state: RootState) => state.fabricMaster);
  const { loomList } = useSelector((state: RootState) => state.loomMaster);
  const { validating, uploading, validatedData, history } = useSelector(
    (state: RootState) => state.oldFabricStock
  );

  const [fileName, setFileName] = useState<string>("");
  const [rawExcelRows, setRawExcelRows] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "VALID" | "INVALID">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // State for saved piece entries list and search filter
  const [savedEntriesList, setSavedEntriesList] = useState<any[]>([]);
  const [savedSearchTerm, setSavedSearchTerm] = useState<string>("");

  const loadSavedEntries = () => {
    try {
      const stored = localStorage.getItem("old_stock_piece_entries");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedEntriesList(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error("Failed to load saved piece entries from storage:", e);
    }
  };

  useEffect(() => {
    dispatch(getAllFabricMastersForDropdown());
    dispatch(getAllLooms({ limit: 10000, offset: 0, fetchAll: true }));
    dispatch(fetchOldStockUploadHistory());
    loadSavedEntries();
  }, [dispatch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    parseExcelFile(file);
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary", cellDates: false, raw: false });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 1. Convert worksheet to 2D array of raw cells
        const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false });

        if (!rawGrid || rawGrid.length === 0) {
          toast.error("The selected Excel file contains no data.");
          return;
        }

        // 2. Scan first 25 rows to identify the actual table header row
        const knownKeywords = [
          "sort", "construction", "piece", "loom", "beam", "weave",
          "metre", "meters", "mtr", "pass", "date", "s.no", "sl.no",
          "quality", "hfpl", "doff", "inspection", "roll", "glm", "status",
          "remark", "invoice", "lot"
        ];

        let headerRowIdx = -1;
        let maxMatches = 0;

        const scanLimit = Math.min(25, rawGrid.length);
        for (let r = 0; r < scanLimit; r++) {
          const rowArr = rawGrid[r];
          if (!Array.isArray(rowArr)) continue;

          let matchCount = 0;
          for (const cell of rowArr) {
            const cellStr = String(cell || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            if (cellStr && knownKeywords.some((kw) => cellStr.includes(kw))) {
              matchCount++;
            }
          }

          if (matchCount > maxMatches && matchCount >= 2) {
            maxMatches = matchCount;
            headerRowIdx = r;
          }
        }

        let jsonRows: any[] = [];

        if (headerRowIdx !== -1) {
          const headerRow = rawGrid[headerRowIdx];
          const headers = headerRow.map((h: any, colIdx: number) => {
            const str = String(h || "").trim();
            return str || `__EMPTY_${colIdx}`;
          });

          const dataRows = rawGrid.slice(headerRowIdx + 1);
          jsonRows = dataRows
            .map((rowArr) => {
              const rowObj: Record<string, any> = {};
              let hasContent = false;
              headers.forEach((hKey: string, colIdx: number) => {
                const val = rowArr[colIdx] !== undefined ? rowArr[colIdx] : "";
                rowObj[hKey] = val;
                if (val !== "" && val !== null && val !== undefined) {
                  hasContent = true;
                }
              });
              return hasContent ? rowObj : null;
            })
            .filter(Boolean);
        } else {
          // Fallback to standard sheet_to_json if no header row detected
          jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
        }

        if (!jsonRows || jsonRows.length === 0) {
          toast.error("The selected Excel file contains no valid data rows.");
          return;
        }

        setRawExcelRows(jsonRows);
        toast.info(`Loaded ${jsonRows.length} data rows from Excel. Validating against Master Data...`);

        dispatch(
          validateOldStockExcel({
            rows: jsonRows,
            fabricMasters: fabricMasterFullList || [],
            looms: loomList || [],
          })
        );
      } catch (err: any) {
        console.error("Excel parse error:", err);
        toast.error("Failed to parse Excel file: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleRevalidate = () => {
    if (rawExcelRows.length === 0) {
      toast.warning("Please select an Excel file first.");
      return;
    }

    dispatch(
      validateOldStockExcel({
        rows: rawExcelRows,
        fabricMasters: fabricMasterFullList || [],
        looms: loomList || [],
      })
    );
  };

  const handleUploadStock = async () => {
    if (!validatedData || !validatedData.records || validatedData.records.length === 0) {
      toast.warning("No validated data available for upload.");
      return;
    }

    const validRows = validatedData.records.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("Cannot upload. All rows contain validation errors. Please correct the Excel file and try again.");
      return;
    }

    try {
      const result = await dispatch(
        uploadOldFabricStock({
          fileName,
          records: validatedData.records,
        })
      ).unwrap();

      if (result) {
        toast.success(`Successfully mapped & saved ${result.successRows} piece entries to system database!`);
        dispatch(fetchOldStockUploadHistory());
        dispatch(clearValidatedData());
        setRawExcelRows([]);
        setFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadSavedEntries();
      }
    } catch (err: any) {
      toast.error(err || "Failed to upload stock");
    }
  };

  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        "S.NO": 1,
        "DATE": "2026-09-17",
        "SORT": "H-1100",
        "CONSTRUCTION": "100% EGYPTIAN COTTON",
        "WEAVE": "Plain Satin",
        "LOOM NO": "19",
        "PIECE NO.": "14135",
        "BEAM SET NO.": "3599",
        "BEAM NO.": "37180/158",
        "WARP LOT NO.": "598",
        "WEFT LOT NO.": "1126",
        "Doff MTR": 380,
        "INSPECTION DATE": "2026-09-18",
        "METRE": 380,
        "ROLLING DATE": "2026-09-17",
        "PASS MTRS": 372.25,
        "Roll Wt.,(N.Wt.,)": 42.5,
        "GLM IN GRAMS": 115,
        "HFPL ROLL NO.": "HFPL-ROLL-1001",
        "DISPATCH MTRS": 370,
        "DISPATCH DATE": "2026-09-20",
        "HFPL INVOICE NO": "INV-2026-0901",
        "HFPL DC NO": "DC-2026-440",
        "PO NO.": "PO-2026-884",
        "REMARKS 1": "Old Greige Stock Inward",
        "REMARKS 2": "Inspected & Passed",
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Old Fabric Stock Template");
    XLSX.writeFile(workbook, "Old_Fabric_Stock_Template.xlsx");
  };

  // Helper to compute meter totals for any array of records
  const computeMeterTotals = (recordList: any[]) => {
    return recordList.reduce(
      (acc, r) => {
        const doff = Number(r.doffMtr ?? r.pieceMeter ?? 0) || 0;
        const inspected = Number(r.metre ?? r.inspectedMtr ?? 0) || 0;
        const pass = Number(r.passMtrs ?? r.passMtr ?? 0) || 0;
        const dispatch = Number(r.dispatchMtrs ?? r.dispatchMtr ?? 0) || 0;

        acc.doffMtr += doff;
        acc.inspectedMtr += inspected;
        acc.passMtr += pass;
        acc.dispatchMtr += dispatch;
        return acc;
      },
      { doffMtr: 0, inspectedMtr: 0, passMtr: 0, dispatchMtr: 0 }
    );
  };

  const records = validatedData?.records || [];
  const filteredRecords = records.filter((r) => {
    if (filterType === "VALID" && !r.isValid) return false;
    if (filterType === "INVALID" && r.isValid) return false;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      return (
        r.sortCode.toLowerCase().includes(query) ||
        r.construction.toLowerCase().includes(query) ||
        r.loomNo.toLowerCase().includes(query) ||
        r.beamNo.toLowerCase().includes(query) ||
        r.pieceNo.toLowerCase().includes(query) ||
        r.hfplRollNo.toLowerCase().includes(query) ||
        r.poNo.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const previewMeterTotals = computeMeterTotals(filteredRecords);

  const filteredSavedEntries = savedEntriesList.filter((item: any) => {
    if (!savedSearchTerm.trim()) return true;
    const q = savedSearchTerm.toLowerCase();
    const pieceNo = String(item.pieceNo || item.pieceNumber || "").toLowerCase();
    const sortCode = String(item.sortCode || "").toLowerCase();
    const construction = String(item.construction || "").toLowerCase();
    const loomNo = String(item.loomNo || "").toLowerCase();
    const beamNo = String(item.beamNo || "").toLowerCase();
    const hfplRollNo = String(item.hfplRollNo || "").toLowerCase();
    const poNo = String(item.poNo || item.orderNo || "").toLowerCase();
    const hfplDcNo = String(item.hfplDcNo || item.dcNumber || "").toLowerCase();
    const hfplInvoiceNo = String(item.hfplInvoiceNo || "").toLowerCase();

    return (
      pieceNo.includes(q) ||
      sortCode.includes(q) ||
      construction.includes(q) ||
      loomNo.includes(q) ||
      beamNo.includes(q) ||
      hfplRollNo.includes(q) ||
      poNo.includes(q) ||
      hfplDcNo.includes(q) ||
      hfplInvoiceNo.includes(q)
    );
  });

  const savedMeterTotals = computeMeterTotals(filteredSavedEntries);

  return (
    <div className="p-6 max-w-[98%] mx-auto space-y-6">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600 w-7 h-7" />
            Upload Old Fabric Stock via Excel Sheet
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload old stock ledger data to automatically populate <span className="font-semibold text-blue-700">Piece Entry</span> table with full 26-column mapping and master validations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleDownloadSampleTemplate}
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} /> Sample Template
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <History size={16} /> Upload History ({history.length})
          </Button>
        </div>
      </div>

      {/* File Upload Zone */}
      <Card className="border-dashed border-2 border-blue-300 bg-blue-50/30 hover:bg-blue-50/60 transition-colors">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {fileName ? `Selected File: ${fileName}` : "Select or Drop Old Fabric Stock Excel Sheet"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Supports .xlsx, .xls containing S.NO, DATE, SORT, CONSTRUCTION, WEAVE, LOOM NO, PIECE NO, BEAM SET NO, BEAM NO, WARP/WEFT LOT, Doff MTR, METRE, PASS MTRS, Roll Wt., GLM, HFPL ROLL NO, DISPATCH, etc.
            </p>
          </div>
          <div className="flex justify-center items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
              id="excel-file-input"
            />
            <label htmlFor="excel-file-input">
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-6"
              >
                <span>Browse Excel File</span>
              </Button>
            </label>
            {rawExcelRows.length > 0 && (
              <Button
                variant="outline"
                onClick={handleRevalidate}
                disabled={validating}
                className="flex items-center gap-2 border-blue-400 text-blue-700"
              >
                <RefreshCw size={16} className={validating ? "animate-spin" : ""} />
                Re-Validate Master Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary Cards */}
      {validatedData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Total Excel Rows</p>
                  <p className="text-2xl font-bold text-gray-800">{validatedData.total}</p>
                </div>
                <Layers className="w-8 h-8 text-blue-500 opacity-80" />
              </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Valid Rows (Ready)</p>
                  <p className="text-2xl font-bold text-green-600">{validatedData.validCount}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500 opacity-80" />
              </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-red-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Invalid Rows (Errors)</p>
                  <p className="text-2xl font-bold text-red-600">{validatedData.invalidCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500 opacity-80" />
              </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-indigo-500 shadow-sm flex items-center justify-center p-4">
              <Button
                onClick={handleUploadStock}
                disabled={uploading || validatedData.validCount === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2 py-3 shadow-md"
              >
                <Check size={18} />
                {uploading
                  ? "Saving to Database..."
                  : `Upload ${validatedData.validCount} Valid Records to Piece Entry`}
              </Button>
            </Card>
          </div>

          {/* Validation Meter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-white border-l-4 border-l-blue-600 shadow-sm">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase">Preview Doff Mtr</p>
                  <p className="text-xl font-bold text-blue-700 mt-0.5">
                    {previewMeterTotals.doffMtr.toLocaleString("en-IN", { maximumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-500">Mtrs</span>
                  </p>
                </div>
                <Ruler className="w-6 h-6 text-blue-600 opacity-80" />
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-purple-600 shadow-sm">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase">Preview Inspected Mtr</p>
                  <p className="text-xl font-bold text-purple-700 mt-0.5">
                    {previewMeterTotals.inspectedMtr.toLocaleString("en-IN", { maximumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-500">Mtrs</span>
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-purple-600 opacity-80" />
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-emerald-600 shadow-sm">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase">Preview Pass Mtr</p>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5">
                    {previewMeterTotals.passMtr.toLocaleString("en-IN", { maximumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-500">Mtrs</span>
                  </p>
                </div>
                <CheckCheck className="w-6 h-6 text-emerald-600 opacity-80" />
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-amber-600 shadow-sm">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase">Preview Dispatch Mtr</p>
                  <p className="text-xl font-bold text-amber-700 mt-0.5">
                    {previewMeterTotals.dispatchMtr.toLocaleString("en-IN", { maximumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-500">Mtrs</span>
                  </p>
                </div>
                <Truck className="w-6 h-6 text-amber-600 opacity-80" />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Filter and Search Bar for Excel Preview */}
      {validatedData && (
        <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
              <Filter size={14} /> Filter:
            </span>
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterType === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({validatedData.total})
            </button>
            <button
              onClick={() => setFilterType("VALID")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterType === "VALID"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Valid ({validatedData.validCount})
            </button>
            <button
              onClick={() => setFilterType("INVALID")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterType === "INVALID"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Invalid ({validatedData.invalidCount})
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Sort, Loom, Beam, Piece..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Main Excel Preview Data Table displaying all 26 columns */}
      {validatedData && (
        <Card className="bg-white shadow-sm overflow-hidden border">
          <CardHeader className="border-b bg-gray-50/50 py-3 px-4">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center justify-between">
              <span>Excel Preview & Validation Details (26 Columns)</span>
              <span className="text-xs text-gray-500 font-normal">
                Showing {filteredRecords.length} of {records.length} records
              </span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 z-10 border-b">
                <tr>
                  <th className="p-2.5 border-r text-center">Row</th>
                  <th className="p-2.5 border-r min-w-[160px]">Status</th>
                  <th className="p-2.5 border-r">S.NO</th>
                  <th className="p-2.5 border-r">DATE</th>
                  <th className="p-2.5 border-r font-bold text-blue-800">SORT</th>
                  <th className="p-2.5 border-r font-bold text-blue-800">CONSTRUCTION</th>
                  <th className="p-2.5 border-r">WEAVE</th>
                  <th className="p-2.5 border-r font-bold text-purple-800">LOOM NO</th>
                  <th className="p-2.5 border-r">PIECE NO.</th>
                  <th className="p-2.5 border-r">BEAM SET NO.</th>
                  <th className="p-2.5 border-r font-bold text-blue-600 bg-blue-50">BEAM NO.</th>
                  <th className="p-2.5 border-r">WARP LOT NO.</th>
                  <th className="p-2.5 border-r">WEFT LOT NO.</th>
                  <th className="p-2.5 border-r text-right font-bold text-blue-700 bg-blue-50">Doff MTR</th>
                  <th className="p-2.5 border-r">INSPECTION DATE</th>
                  <th className="p-2.5 border-r text-right font-bold">METRE</th>
                  <th className="p-2.5 border-r">ROLLING DATE</th>
                  <th className="p-2.5 border-r text-right">PASS MTRS</th>
                  <th className="p-2.5 border-r text-right">Roll Wt.,(N.Wt.,)</th>
                  <th className="p-2.5 border-r text-right">GLM IN GRAMS</th>
                  <th className="p-2.5 border-r font-mono">HFPL ROLL NO.</th>
                  <th className="p-2.5 border-r text-right">DISPATCH MTRS</th>
                  <th className="p-2.5 border-r">DISPATCH DATE</th>
                  <th className="p-2.5 border-r">HFPL INVOICE NO</th>
                  <th className="p-2.5 border-r">HFPL DC NO</th>
                  <th className="p-2.5 border-r">PO NO.</th>
                  <th className="p-2.5 border-r font-bold text-emerald-800">FABRIC STATUS</th>
                  <th className="p-2.5 border-r">REMARKS 1</th>
                  <th className="p-2.5">REMARKS 2</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={29} className="p-8 text-center text-gray-500">
                      No records match the current filter/search.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        !r.isValid ? "bg-red-50/40" : "bg-white"
                      }`}
                    >
                      <td className="p-2 border-r text-center font-mono text-gray-500">
                        {r.rowNumber}
                      </td>
                      <td className="p-2 border-r">
                        {r.isValid ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={11} /> Valid Record
                            </span>
                            {r.warnings && r.warnings.length > 0 && (
                              <div className="text-[9px] text-amber-700 font-normal whitespace-normal max-w-[200px]">
                                {r.warnings.join("; ")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              <AlertTriangle size={11} /> Invalid
                            </span>
                            <div className="text-[10px] text-red-600 font-normal whitespace-normal max-w-[180px]">
                              {r.errors.join("; ")}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-r">{r.sNo || "-"}</td>
                      <td className="p-2 border-r">{r.date || "-"}</td>
                      <td className="p-2 border-r font-semibold text-gray-900">{r.sortCode || "-"}</td>
                      <td className="p-2 border-r font-medium text-gray-800">{r.construction || "-"}</td>
                      <td className="p-2 border-r text-gray-600">{r.weave || "-"}</td>
                      <td className="p-2 border-r font-bold text-purple-900">{r.loomNo || "-"}</td>
                      <td className="p-2 border-r font-mono">{r.pieceNo || "-"}</td>
                      <td className="p-2 border-r">{r.beamSetNo || "-"}</td>
                      <td className="p-2 border-r font-mono font-bold text-blue-700 bg-blue-50/50">
                        {r.beamNo || <span className="text-red-500 font-normal italic">Empty</span>}
                      </td>
                      <td className="p-2 border-r">{r.warpLotNo || "-"}</td>
                      <td className="p-2 border-r">{r.weftLotNo || "-"}</td>
                      <td className="p-2 border-r text-right font-bold text-blue-800 bg-blue-50/50">{r.doffMtr || 0}</td>
                      <td className="p-2 border-r">{r.inspectionDate || "-"}</td>
                      <td className="p-2 border-r text-right font-bold text-gray-900">{r.metre || 0}</td>
                      <td className="p-2 border-r">{r.rollingDate || "-"}</td>
                      <td className="p-2 border-r text-right">{r.passMtrs || 0}</td>
                      <td className="p-2 border-r text-right">{r.rollWeight || 0}</td>
                      <td className="p-2 border-r text-right">{r.glmGrams || 0}</td>
                      <td className="p-2 border-r font-mono">{r.hfplRollNo || "-"}</td>
                      <td className="p-2 border-r text-right">{r.dispatchMtrs || 0}</td>
                      <td className="p-2 border-r">{r.dispatchDate || "-"}</td>
                      <td className="p-2 border-r">{r.hfplInvoiceNo || "-"}</td>
                      <td className="p-2 border-r">{r.hfplDcNo || "-"}</td>
                      <td className="p-2 border-r font-medium">{r.poNo || "-"}</td>
                      <td className="p-2 border-r font-medium">
                        {r.fabricStatus ? (
                          <span className="inline-flex flex-col">
                            <span className="font-bold text-emerald-700">{r.fabricStatus}</span>
                            <span className="text-[9px] text-gray-500">
                              Insp:{r.isInspected} Pk:{r.isPacked} Disp:{r.isDispatched} Inv:{r.isInvoice} Rej:{r.isRejected}
                            </span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 border-r text-gray-600">{r.remarks1 || "-"}</td>
                      <td className="p-2 text-gray-600">{r.remarks2 || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Saved Fabric Stock Piece Entries List Section */}
      <Card className="bg-white shadow-sm border space-y-4 p-4">
        {/* Saved Entries Meter Summary Cards */}
        {savedEntriesList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-l-4 border-l-blue-600 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total Doff Mtr
                  </p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {savedMeterTotals.doffMtr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
                    <span className="text-xs text-gray-500 font-normal">Mtrs</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  <Ruler size={20} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-purple-600 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total Inspected Mtr
                  </p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {savedMeterTotals.inspectedMtr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
                    <span className="text-xs text-gray-500 font-normal">Mtrs</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                  <TrendingUp size={20} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-emerald-600 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total Pass Mtr
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {savedMeterTotals.passMtr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
                    <span className="text-xs text-gray-500 font-normal">Mtrs</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                  <CheckCheck size={20} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-amber-600 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total Dispatch Mtr
                  </p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">
                    {savedMeterTotals.dispatchMtr.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
                    <span className="text-xs text-gray-500 font-normal">Mtrs</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                  <Truck size={20} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Saved Table Header & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-600" />
            <span>Saved Fabric Stock Piece Entries List</span>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full ml-2">
              {savedEntriesList.length} Entries Saved
            </span>
          </CardTitle>

          {/* Search Filter input right above Saved Entries Table */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Saved Piece, Sort, Loom, Beam, HFPL Roll, PO..."
              value={savedSearchTerm}
              onChange={(e) => setSavedSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-md border">
          <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 z-10 border-b">
              <tr>
                <th className="p-2.5 border-r text-center">#</th>
                <th className="p-2.5 border-r">Status</th>
                <th className="p-2.5 border-r">S.NO</th>
                <th className="p-2.5 border-r">DATE (Doff Date)</th>
                <th className="p-2.5 border-r font-bold text-blue-800">SORT</th>
                <th className="p-2.5 border-r font-bold text-blue-800">CONSTRUCTION</th>
                <th className="p-2.5 border-r">WEAVE</th>
                <th className="p-2.5 border-r font-bold text-purple-800">LOOM NO</th>
                <th className="p-2.5 border-r font-bold text-blue-900 font-mono">PIECE NO.</th>
                <th className="p-2.5 border-r font-bold text-blue-600 bg-blue-50">BEAM NO.</th>
                <th className="p-2.5 border-r">WARP LOT NO.</th>
                <th className="p-2.5 border-r">WEFT LOT NO.</th>
                <th className="p-2.5 border-r text-right font-bold text-blue-700 bg-blue-50">DOFF MTR (Piece Mtr)</th>
                <th className="p-2.5 border-r text-right font-bold">METRE</th>
                <th className="p-2.5 border-r text-right">PASS MTRS</th>
                <th className="p-2.5 border-r">INSPECTION DATE</th>
                <th className="p-2.5 border-r">ROLLING DATE</th>
                <th className="p-2.5 border-r text-right">ROLL WT</th>
                <th className="p-2.5 border-r text-right">GLM</th>
                <th className="p-2.5 border-r font-mono">HFPL ROLL NO.</th>
                <th className="p-2.5 border-r text-right">DISPATCH MTRS</th>
                <th className="p-2.5 border-r">DISPATCH DATE</th>
                <th className="p-2.5 border-r">HFPL INVOICE NO</th>
                <th className="p-2.5 border-r">HFPL DC NO</th>
                <th className="p-2.5 border-r">PO NO.</th>
                <th className="p-2.5 border-r font-bold text-emerald-800">FABRIC STATUS</th>
                <th className="p-2.5">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSavedEntries.length === 0 ? (
                <tr>
                  <td colSpan={27} className="p-8 text-center text-gray-500">
                    {savedEntriesList.length === 0
                      ? "No saved fabric stock entries found. Upload an Excel sheet above to save entries."
                      : "No saved entries match the search filter."}
                  </td>
                </tr>
              ) : (
                filteredSavedEntries.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50/80 transition-colors bg-white">
                    <td className="p-2 border-r text-center font-mono text-gray-500">{idx + 1}</td>
                    <td className="p-2 border-r">
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Saved
                      </span>
                    </td>
                    <td className="p-2 border-r">{item.sNo || "-"}</td>
                    <td className="p-2 border-r">{item.date || item.doffingDate || "-"}</td>
                    <td className="p-2 border-r font-semibold text-gray-900">{item.sortCode || "-"}</td>
                    <td className="p-2 border-r font-medium text-gray-800">{item.construction || "-"}</td>
                    <td className="p-2 border-r text-gray-600">{item.weave || "-"}</td>
                    <td className="p-2 border-r font-bold text-purple-900">{item.loomNo || "-"}</td>
                    <td className="p-2 border-r font-mono font-bold text-blue-900">{item.pieceNumber || item.pieceNo || "-"}</td>
                    <td className="p-2 border-r font-mono font-bold text-blue-700 bg-blue-50/50">{item.beamNo || "-"}</td>
                    <td className="p-2 border-r">{item.warpLotNo || "-"}</td>
                    <td className="p-2 border-r">{item.weftLotNo || "-"}</td>
                    <td className="p-2 border-r text-right font-bold text-blue-800 bg-blue-50/50">{item.pieceMeter ?? item.doffMtr ?? 0}</td>
                    <td className="p-2 border-r text-right font-bold text-gray-900">{item.metre || 0}</td>
                    <td className="p-2 border-r text-right">{item.passMtr ?? item.passMtrs ?? 0}</td>
                    <td className="p-2 border-r">{item.inspectionDate || "-"}</td>
                    <td className="p-2 border-r">{item.rollingDate || "-"}</td>
                    <td className="p-2 border-r text-right">{item.rollWeight || 0}</td>
                    <td className="p-2 border-r text-right">{item.glm ?? item.glmGrams ?? 0}</td>
                    <td className="p-2 border-r font-mono">{item.hfplRollNo || "-"}</td>
                    <td className="p-2 border-r text-right">{item.dispatchMtr ?? item.dispatchMtrs ?? 0}</td>
                    <td className="p-2 border-r">{item.dispatchDate || "-"}</td>
                    <td className="p-2 border-r">{item.hfplInvoiceNo || "-"}</td>
                    <td className="p-2 border-r">{item.dcNumber || item.hfplDcNo || "-"}</td>
                    <td className="p-2 border-r font-medium">{item.orderNo || item.poNo || "-"}</td>
                    <td className="p-2 border-r font-medium text-emerald-700">{item.fabricStatus || "-"}</td>
                    <td className="p-2 text-gray-600">{item.remarks || [item.remarks1, item.remarks2].filter(Boolean).join(" | ") || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload History Section */}
      {showHistory && (
        <Card className="bg-white border shadow-sm">
          <CardHeader className="border-b bg-gray-50/50 py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <History size={18} className="text-blue-600" />
              Old Fabric Stock Upload Logs History
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
              <X size={16} />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">Upload Batch ID</th>
                    <th className="p-3">File Name</th>
                    <th className="p-3">Uploaded At</th>
                    <th className="p-3 text-center">Total Rows</th>
                    <th className="p-3 text-center">Piece Entries Created</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        No previous upload history records found.
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono font-medium text-blue-600">{h.id}</td>
                        <td className="p-3 font-medium">{h.fileName}</td>
                        <td className="p-3 text-gray-500 whitespace-nowrap">
                          {new Date(h.uploadedAt).toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-bold">{h.totalRows}</td>
                        <td className="p-3 text-center font-bold text-green-600">
                          {h.pieceEntriesCreated}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              h.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OldFabricStockUpload;
