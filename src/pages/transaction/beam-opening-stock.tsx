import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllFlanges } from "@/state/flangeSlice";
import {
  validateBeamStockExcel,
  uploadBulkBeamStock,
  updateOnLoomMtrBulk,
  getAllBeamStockByCompany,
  deleteBeamStock,
  clearValidatedBeamStock,
  BeamStockRecord,
} from "@/state/beamStockSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Search,
  Filter,
  Check,
  Layers,
  Ruler,
  TrendingUp,
  Trash2,
  Box,
} from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { DataTable } from "@/components/data/DataTable";

export const BeamOpeningStockUpload: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedCompanyId = useResolvedCompanyId();

  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);
  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts as any);
  const { vendorList } = useSelector((state: RootState) => state.vendor as any);
  const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder as any);
  const { flangeList } = useSelector((state: RootState) => state.flange as any);

  const { stockList, validating, uploading, loading, validatedData } = useSelector(
    (state: RootState) => state.beamStock
  );

  const [fileName, setFileName] = useState<string>("");
  const [rawExcelRows, setRawExcelRows] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "VALID" | "INVALID">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // On-Loom Mtr Upload state
  const [isOnLoomModalOpen, setIsOnLoomModalOpen] = useState<boolean>(false);
  const [onLoomFileName, setOnLoomFileName] = useState<string>("");
  const [onLoomRows, setOnLoomRows] = useState<{ loomNo?: string; sizedBeamNo: string; onLoomMtr: number }[]>([]);
  const [isUpdatingOnLoom, setIsUpdatingOnLoom] = useState<boolean>(false);
  const onLoomFileInputRef = useRef<HTMLInputElement>(null);

  const fetchSavedBeamStock = () => {
    const cid = selectedCompanyId ? Number(selectedCompanyId) : undefined;
    dispatch(
      getAllBeamStockByCompany({
        companyId: cid,
        fetchAll: true,
      })
    );
  };

  useEffect(() => {
    dispatch(getAllFabricMasters({ fetchAll: true }));
    dispatch(getAllWeavingContract({ fetchAll: true }));
    dispatch(getAllVendors({ fetchAll: true }));
    dispatch(getAllSizingPlan({ fetchAll: true }));
    dispatch(getAllSalesOrders({ fetchAll: true }));
    if (selectedCompanyId) {
      dispatch(getAllFlanges({ companyId: selectedCompanyId, fetchAll: true }));
    }
    fetchSavedBeamStock();
  }, [dispatch, selectedCompanyId]);

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

        const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false });

        if (!rawGrid || rawGrid.length === 0) {
          toast.error("The selected Excel file contains no data.");
          return;
        }

        const knownKeywords = [
          "sized", "beam", "flange", "empty", "contract", "weaver", "vendor",
          "sizing", "order", "plan", "sort", "quality", "wrap", "warp", "meter",
          "shrinkage", "ends", "width", "count", "lot", "dc", "rate", "remarks"
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
          jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
        }

        if (!jsonRows || jsonRows.length === 0) {
          toast.error("The selected Excel file contains no valid data rows.");
          return;
        }

        setRawExcelRows(jsonRows);
        toast.info(`Loaded ${jsonRows.length} data rows from Excel. Validating against Master Data...`);

        runValidation(jsonRows);
      } catch (err: any) {
        console.error("Excel parse error:", err);
        toast.error("Failed to parse Excel file: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const runValidation = (rows: any[]) => {
    dispatch(
      validateBeamStockExcel({
        rows,
        fabricMasters: Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray(fabricMasterList?.data) ? fabricMasterList.data : [],
        weavingContracts: Array.isArray(weavingContractList) ? weavingContractList : Array.isArray(weavingContractList?.data) ? weavingContractList.data : [],
        vendors: Array.isArray(vendorList) ? vendorList : Array.isArray(vendorList?.data) ? vendorList.data : [],
        sizingPlans: Array.isArray(sizingPlanList) ? sizingPlanList : Array.isArray(sizingPlanList?.data) ? sizingPlanList.data : [],
        salesOrders: Array.isArray(salesOrderList) ? salesOrderList : Array.isArray(salesOrderList?.data) ? salesOrderList.data : [],
        flanges: Array.isArray(flangeList) ? flangeList : Array.isArray(flangeList?.data) ? flangeList.data : [],
      })
    );
  };

  const handleRevalidate = () => {
    if (rawExcelRows.length === 0) {
      toast.warning("Please select an Excel file first.");
      return;
    }
    runValidation(rawExcelRows);
  };

  const handleUploadStock = async () => {
    if (!validatedData || !validatedData.records || validatedData.records.length === 0) {
      toast.warning("No validated data available for upload.");
      return;
    }

    const validRows = validatedData.records.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("Cannot upload. All rows contain validation errors. Please correct the Excel file.");
      return;
    }

    try {
      const result = await dispatch(
        uploadBulkBeamStock({
          companyId: selectedCompanyId ? Number(selectedCompanyId) : undefined,
          fileName,
          records: validRows,
        })
      ).unwrap();

      if (result) {
        toast.success(`Successfully uploaded ${result.successRows || validRows.length} Beam Opening Stock records!`);
        dispatch(clearValidatedBeamStock());
        setRawExcelRows([]);
        setFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Refetch saved stock list via GET API
        fetchSavedBeamStock();
      }
    } catch (err: any) {
      toast.error(err || "Failed to upload beam opening stock");
    }
  };

  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        "S.NO": 1,
        "STOCK DATE": new Date().toISOString().split("T")[0],
        "SIZED BEAM NO": "SB-1001",
        "FLANGE NO / EMPTY BEAM NO": "FL-501",
        "WEAVING CONTRACT NO": "WC-2026-01",
        "WEAVER VENDOR": "Shree Weaving Mills",
        "SIZING VENDOR": "Precision Sizing Pvt Ltd",
        "SALES ORDER NO": "SO-2026-99",
        "SIZING PLAN NO": "SP-2026-12",
        "FABRIC CODE / QUALITY": "H-1100",
        "WARP METERS": 1200,
        "SHRINKAGE (%)": 5,
        "EXPECTED FABRIC METER": 1140,
        "TOTAL ENDS": 4800,
        "FABRIC PANEL WIDTH": 63,
        "WARP COUNT": "40s Combed",
        "WARP YARN MILL NAME": "Vardhman Textiles",
        "WARP YARN LOT NO": "LOT-4410",
        "SIZING SET NO": "SET-88",
        "SIZING PICKUP (%)": 8.5,
        "DC NUMBER": "DC-8841",
        "DC DATE": new Date().toISOString().split("T")[0],
        "SIZING RATE": 4.5,
        "REMARKS": "Beam Opening Stock Inward",
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Beam Opening Stock Template");
    XLSX.writeFile(workbook, "Beam_Opening_Stock_Template.xlsx");
  };

  const handleDownloadOnLoomTemplate = () => {
    const sampleData = [
      {
        "LOOM NO": "L-101",
        "SIZED BEAM NO": "SB-1001",
        "ON-LOOM MTR": 1050,
      },
      {
        "LOOM NO": "L-102",
        "SIZED BEAM NO": "SB-1002",
        "ON-LOOM MTR": 1120,
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "On Loom Mtr Update");
    XLSX.writeFile(workbook, "On_Loom_Mtr_Update_Template.xlsx");
  };

  const handleOnLoomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOnLoomFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary", cellDates: false, raw: false });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
        if (!jsonRows || jsonRows.length === 0) {
          toast.error("The selected Excel file contains no valid rows.");
          return;
        }

        const getVal = (row: any, keys: string[]): string => {
          for (const key of Object.keys(row)) {
            const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
            if (keys.some((k) => cleanKey.includes(k))) {
              return String(row[key] ?? "").trim();
            }
          }
          return "";
        };

        const parsed: { loomNo?: string; sizedBeamNo: string; onLoomMtr: number }[] = [];
        jsonRows.forEach((row) => {
          const sizedBeamNo = getVal(row, ["sizedbeam", "beamno", "sizedbeamno"]);
          const loomNo = getVal(row, ["loomno", "loom"]);
          const onLoomMtrStr = getVal(row, ["onloommtr", "onloommeter", "onloom", "loommtr", "mtr"]);
          const onLoomMtrVal = Number(onLoomMtrStr);

          if (sizedBeamNo && !isNaN(onLoomMtrVal)) {
            parsed.push({
              sizedBeamNo,
              loomNo,
              onLoomMtr: onLoomMtrVal,
            });
          }
        });

        if (parsed.length === 0) {
          toast.error("Could not find any rows with valid Sized Beam No and numeric On-Loom Mtr.");
          return;
        }

        setOnLoomRows(parsed);
        toast.info(`Loaded ${parsed.length} rows with On-Loom Mtr data.`);
      } catch (err: any) {
        console.error("Excel parse error:", err);
        toast.error("Failed to parse On-Loom Mtr Excel file: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUploadOnLoomMtr = async () => {
    if (onLoomRows.length === 0) {
      toast.warning("No On-Loom Mtr data rows to update.");
      return;
    }

    setIsUpdatingOnLoom(true);
    try {
      const result = await dispatch(
        updateOnLoomMtrBulk({
          companyId: selectedCompanyId ? Number(selectedCompanyId) : undefined,
          records: onLoomRows,
        })
      ).unwrap();

      toast.success(result?.message || `Successfully updated On-Loom Mtr for ${onLoomRows.length} beams!`);
      setOnLoomRows([]);
      setOnLoomFileName("");
      if (onLoomFileInputRef.current) onLoomFileInputRef.current.value = "";
      setIsOnLoomModalOpen(false);
      fetchSavedBeamStock();
    } catch (err: any) {
      toast.error(err || "Failed to update On-Loom Mtr records.");
    } finally {
      setIsUpdatingOnLoom(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this Beam Opening Stock record?")) return;
    try {
      await dispatch(deleteBeamStock(id)).unwrap();
      toast.success("Beam Stock record deleted successfully.");
      fetchSavedBeamStock();
    } catch (err: any) {
      toast.error(err || "Failed to delete record.");
    }
  };

  const records = validatedData?.records || [];
  const filteredRecords = records.filter((r) => {
    if (filterType === "VALID" && !r.isValid) return false;
    if (filterType === "INVALID" && r.isValid) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        (r.sizedBeamNo || "").toLowerCase().includes(q) ||
        (r.flangeNo || "").toLowerCase().includes(q) ||
        (r.weavingContractNo || "").toLowerCase().includes(q) ||
        (r.weaverVendorName || "").toLowerCase().includes(q) ||
        (r.fabricCode || "").toLowerCase().includes(q) ||
        (r.quality || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const computeTotals = (list: BeamStockRecord[]) => {
    return list.reduce(
      (acc, r) => {
        acc.totalMeters += Number(r.wrapMeters || 0);
        acc.expectedMeters += Number(r.expectedFabricMeter || 0);
        acc.totalEnds += Number(r.totalEnds || 0);
        return acc;
      },
      { totalMeters: 0, expectedMeters: 0, totalEnds: 0 }
    );
  };

  const previewTotals = computeTotals(filteredRecords);

  const savedStockColumns = useMemo(
    () => [
      {
        Header: "#",
        id: "serialNo",
        accessor: "id",
        width: 50,
        disableFilters: true,
        Cell: ({ row }: any) => <span className="font-mono text-gray-500 text-xs">{row.index + 1}</span>,
      },
      {
        Header: "SIZED BEAM NO",
        accessor: "sizedBeamNo",
        id: "sizedBeamNo",
        minWidth: 140,
        Cell: ({ value }: any) => <span className="font-bold text-blue-900">{value || "-"}</span>,
      },
      {
        Header: "FLANGE NO",
        accessor: "flangeNo",
        id: "flangeNo",
        minWidth: 120,
        Cell: ({ value }: any) => <span className="font-medium text-gray-800">{value || "-"}</span>,
      },
      {
        Header: "WEAVING CONTRACT",
        accessor: "weavingContractNo",
        id: "weavingContractNo",
        minWidth: 160,
        Cell: ({ row }: any) => <span>{row.original.weavingContractNo || row.original.weavingContractId || "-"}</span>,
      },
      {
        Header: "WEAVER VENDOR",
        accessor: "weaverVendorName",
        id: "weaverVendorName",
        minWidth: 170,
        Cell: ({ value }: any) => <span>{value || "-"}</span>,
      },
      {
        Header: "SIZING VENDOR",
        accessor: "sizingVendorName",
        id: "sizingVendorName",
        minWidth: 170,
        Cell: ({ value }: any) => <span>{value || "-"}</span>,
      },
      {
        Header: "SALES ORDER",
        accessor: "salesOrderNo",
        id: "salesOrderNo",
        minWidth: 140,
        Cell: ({ row }: any) => <span>{row.original.salesOrderNo || row.original.salesOrderId || "-"}</span>,
      },
      {
        Header: "FABRIC / QUALITY",
        accessor: "fabricCode",
        id: "fabricCode",
        minWidth: 150,
        Cell: ({ row }: any) => (
          <span className="font-semibold text-gray-900">
            {row.original.fabricCode || row.original.quality || "-"}
          </span>
        ),
      },
      {
        Header: "WRAP METERS",
        accessor: "wrapMeters",
        id: "wrapMeters",
        minWidth: 130,
        Cell: ({ value }: any) => (
          <div className="text-right font-bold text-blue-800 bg-blue-50/50 py-0.5 px-1.5 rounded">
            {Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        Header: "ON-LOOM MTR",
        accessor: "onLoomMtr",
        id: "onLoomMtr",
        minWidth: 130,
        Cell: ({ value }: any) => (
          <div className="text-right font-bold text-amber-800 bg-amber-50/50 py-0.5 px-1.5 rounded">
            {value != null && value !== "" ? Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-"}
          </div>
        ),
      },
      {
        Header: "SHRINKAGE %",
        accessor: "shrinkage",
        id: "shrinkage",
        minWidth: 110,
        Cell: ({ value }: any) => <div className="text-right">{Number(value || 0)}</div>,
      },
      {
        Header: "EXPECTED FABRIC MTR",
        accessor: "expectedFabricMeter",
        id: "expectedFabricMeter",
        minWidth: 160,
        Cell: ({ value }: any) => (
          <div className="text-right font-bold text-purple-800">
            {Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        Header: "TOTAL ENDS",
        accessor: "totalEnds",
        id: "totalEnds",
        minWidth: 120,
        Cell: ({ value }: any) => <div className="text-right">{Number(value || 0).toLocaleString("en-IN")}</div>,
      },
      {
        Header: "DC NO",
        accessor: "dcNumber",
        id: "dcNumber",
        minWidth: 130,
        Cell: ({ value }: any) => <span>{value || "-"}</span>,
      },
      {
        Header: "DC DATE",
        accessor: "dcDate",
        id: "dcDate",
        minWidth: 120,
        Cell: ({ value }: any) => <span>{value || "-"}</span>,
      },
      {
        Header: "OUTWARDED",
        accessor: "isBeamOutwarded",
        id: "isBeamOutwarded",
        minWidth: 120,
        Cell: ({ value }: any) =>
          value === 1 ? (
            <span className="bg-orange-100 text-orange-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Outwarded
            </span>
          ) : (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              In Stock
            </span>
          ),
      },
      {
        Header: "ACTION",
        id: "action",
        minWidth: 80,
        disableFilters: true,
        Cell: ({ row }: any) =>
          row.original?.id ? (
            <button
              onClick={() => handleDeleteRecord(row.original.id)}
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
              title="Delete Record"
            >
              <Trash2 size={15} />
            </button>
          ) : null,
      },
    ],
    []
  );

  const savedTotals = useMemo(() => computeTotals(stockList), [stockList]);

  return (
    <div className="p-6 max-w-[98%] mx-auto space-y-6">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600 w-7 h-7" />
            Beam Opening Stock Bulk Upload
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload Beam Receiving & Inward data in bulk via Excel sheet to populate <span className="font-semibold text-blue-700">Beam Stock</span> database.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={fetchSavedBeamStock}
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Data
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadSampleTemplate}
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} /> Download Excel Template
          </Button>
          <Button
            onClick={() => setIsOnLoomModalOpen(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Upload size={16} /> Upload On-Loom Mtr Excel
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
              {fileName ? `Selected File: ${fileName}` : "Select or Drop Beam Opening Stock Excel Sheet"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Supports .xlsx, .xls containing Sized Beam No, Flange No, Weaving Contract, Weaver, Sizing Vendor, Fabric Quality, Warp Meters, Shrinkage, Ends, DC details, etc.
            </p>
          </div>
          <div className="flex justify-center items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
              id="beam-excel-file-input"
            />
            <label htmlFor="beam-excel-file-input">
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
                  : `Upload ${validatedData.validCount} Records to Beam Stock`}
              </Button>
            </Card>
          </div>

          {/* Validation Meter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-l-4 border-l-blue-600 shadow-sm">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase">Preview Wrap Meters</p>
                  <p className="text-xl font-bold text-blue-700 mt-0.5">
                    {previewTotals.totalMeters.toLocaleString("en-IN", { maximumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-500">Mtrs</span>
                  </p>
                </div>
                <Ruler className="w-6 h-6 text-blue-600 opacity-80" />
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-purple-600 shadow-sm">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase">Preview Expected Fabric Meters</p>
                  <p className="text-xl font-bold text-purple-700 mt-0.5">
                    {previewTotals.expectedMeters.toLocaleString("en-IN", { maximumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-500">Mtrs</span>
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-purple-600 opacity-80" />
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-emerald-600 shadow-sm">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase">Preview Total Ends</p>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5">
                    {previewTotals.totalEnds.toLocaleString("en-IN")} <span className="text-xs font-normal text-gray-500">Ends</span>
                  </p>
                </div>
                <Box className="w-6 h-6 text-emerald-600 opacity-80" />
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
              placeholder="Search Sized Beam, Flange, Contract, Weaver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Main Excel Preview Data Table */}
      {validatedData && (
        <Card className="bg-white shadow-sm overflow-hidden border">
          <CardHeader className="border-b bg-gray-50/50 py-3 px-4">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center justify-between">
              <span>Excel Preview & Validation Details</span>
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
                  <th className="p-2.5 border-r min-w-[150px]">Status</th>
                  <th className="p-2.5 border-r font-bold text-blue-800">SIZED BEAM NO</th>
                  <th className="p-2.5 border-r font-bold text-blue-800">FLANGE NO</th>
                  <th className="p-2.5 border-r">WEAVING CONTRACT</th>
                  <th className="p-2.5 border-r">WEAVER VENDOR</th>
                  <th className="p-2.5 border-r">SIZING VENDOR</th>
                  <th className="p-2.5 border-r">SALES ORDER</th>
                  <th className="p-2.5 border-r">SIZING PLAN</th>
                  <th className="p-2.5 border-r">FABRIC / QUALITY</th>
                  <th className="p-2.5 border-r text-right font-bold text-blue-700 bg-blue-50">WRAP METERS</th>
                  <th className="p-2.5 border-r text-right font-bold text-amber-700 bg-amber-50">ON-LOOM MTR</th>
                  <th className="p-2.5 border-r text-right">SHRINKAGE %</th>
                  <th className="p-2.5 border-r text-right font-bold text-purple-700">EXPECTED FABRIC MTR</th>
                  <th className="p-2.5 border-r text-right">TOTAL ENDS</th>
                  <th className="p-2.5 border-r text-right">PANEL WIDTH</th>
                  <th className="p-2.5 border-r">WARP COUNT</th>
                  <th className="p-2.5 border-r">YARN MILL</th>
                  <th className="p-2.5 border-r">YARN LOT NO</th>
                  <th className="p-2.5 border-r">DC NUMBER</th>
                  <th className="p-2.5 border-r">DC DATE</th>
                  <th className="p-2.5 border-r text-right">SIZING RATE</th>
                  <th className="p-2.5">REMARKS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={23} className="p-8 text-center text-gray-500">
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
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} /> Valid Record
                          </span>
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
                      <td className="p-2 border-r font-bold text-blue-900">{r.sizedBeamNo || "-"}</td>
                      <td className="p-2 border-r font-medium text-gray-800">{r.flangeNo || "-"}</td>
                      <td className="p-2 border-r">{r.weavingContractNo || "-"}</td>
                      <td className="p-2 border-r">{r.weaverVendorName || "-"}</td>
                      <td className="p-2 border-r">{r.sizingVendorName || "-"}</td>
                      <td className="p-2 border-r">{r.salesOrderNo || "-"}</td>
                      <td className="p-2 border-r">{r.sizingPlanNo || "-"}</td>
                      <td className="p-2 border-r font-semibold text-gray-900">{r.fabricCode || r.quality || "-"}</td>
                      <td className="p-2 border-r text-right font-bold text-blue-800 bg-blue-50/50">{r.wrapMeters || 0}</td>
                      <td className="p-2 border-r text-right font-bold text-amber-800 bg-amber-50/50">{r.onLoomMtr != null ? r.onLoomMtr : "-"}</td>
                      <td className="p-2 border-r text-right">{r.shrinkage || 0}</td>
                      <td className="p-2 border-r text-right font-bold text-purple-800">{r.expectedFabricMeter || 0}</td>
                      <td className="p-2 border-r text-right">{r.totalEnds || 0}</td>
                      <td className="p-2 border-r text-right">{r.fabricPanelWidth || 0}</td>
                      <td className="p-2 border-r">{r.warpCount || "-"}</td>
                      <td className="p-2 border-r">{r.warpYarnMillName || "-"}</td>
                      <td className="p-2 border-r">{r.warpYarnLotNo || "-"}</td>
                      <td className="p-2 border-r">{r.dcNumber || "-"}</td>
                      <td className="p-2 border-r">{r.dcDate || "-"}</td>
                      <td className="p-2 border-r text-right">{r.sizingRate || 0}</td>
                      <td className="p-2 text-gray-600">{r.remarks || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Saved Beam Opening Stock Records List */}
      <Card className="bg-white shadow-sm border space-y-4 p-4">
        {/* Saved List Summary Cards */}
        {stockList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-l-4 border-l-blue-600 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total Wrap Meters
                  </p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {savedTotals.totalMeters.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
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
                    Total Expected Fabric Meters
                  </p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {savedTotals.expectedMeters.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
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
                    Total Ends
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {savedTotals.totalEnds.toLocaleString("en-IN")}{" "}
                    <span className="text-xs text-gray-500 font-normal">Ends</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                  <Box size={20} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Standard DataTable with Virtual Scroll */}
        <DataTable
          columns={savedStockColumns}
          data={stockList}
          title="Beam Opening Stock Database Records"
          loading={loading}
          showActions={false}
          showAddActions={false}
          showExport={true}
          virtualScroll={true}
          virtualScrollHeight="600px"
          isShowPagination={false}
          initialPageSize={1000}
          headerActions={
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">
              {stockList.length} Beams Saved
            </span>
          }
        />
      </Card>

      {/* Modal / Dialog for On-Loom Mtr Excel Update */}
      {isOnLoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-amber-200">
            <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" /> Update On-Loom Mtr via Excel
                </h2>
                <p className="text-xs text-amber-100 mt-0.5">
                  Upload Excel to update On-Loom Mtr against Sized Beam No without affecting existing saved entries.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsOnLoomModalOpen(false);
                  setOnLoomRows([]);
                  setOnLoomFileName("");
                }}
                className="text-white hover:bg-amber-700 p-1 rounded-full text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Required Excel Format:</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Columns: <span className="font-mono font-bold">LOOM NO</span>, <span className="font-mono font-bold">SIZED BEAM NO</span>, <span className="font-mono font-bold">ON-LOOM MTR</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadOnLoomTemplate}
                  className="flex items-center gap-1.5 border-amber-400 text-amber-800 hover:bg-amber-100"
                >
                  <Download size={14} /> Download Template
                </Button>
              </div>

              {/* File Select */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase">
                  Select On-Loom Mtr Excel Sheet
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={onLoomFileInputRef}
                    onChange={handleOnLoomFileChange}
                    accept=".xlsx, .xls"
                    className="hidden"
                    id="on-loom-excel-file-input"
                  />
                  <label htmlFor="on-loom-excel-file-input">
                    <Button
                      asChild
                      variant="outline"
                      className="cursor-pointer border-amber-500 text-amber-800 hover:bg-amber-50"
                    >
                      <span>{onLoomFileName ? "Change File" : "Browse File"}</span>
                    </Button>
                  </label>
                  <span className="text-xs font-medium text-gray-600 truncate max-w-xs">
                    {onLoomFileName || "No file selected"}
                  </span>
                </div>
              </div>

              {/* Preview Table of Parsed Rows */}
              {onLoomRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                    <span>Parsed Rows Preview ({onLoomRows.length} Beams Found)</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 text-gray-700 sticky top-0 border-b">
                        <tr>
                          <th className="p-2 border-r text-center w-12">#</th>
                          <th className="p-2 border-r font-bold">LOOM NO</th>
                          <th className="p-2 border-r font-bold text-blue-800">SIZED BEAM NO</th>
                          <th className="p-2 text-right font-bold text-amber-800 bg-amber-50">ON-LOOM MTR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {onLoomRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-2 border-r text-center font-mono text-gray-500">{idx + 1}</td>
                            <td className="p-2 border-r font-medium text-gray-800">{r.loomNo || "-"}</td>
                            <td className="p-2 border-r font-bold text-blue-900">{r.sizedBeamNo}</td>
                            <td className="p-2 text-right font-bold text-amber-800 bg-amber-50/50">
                              {Number(r.onLoomMtr || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOnLoomModalOpen(false);
                  setOnLoomRows([]);
                  setOnLoomFileName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadOnLoomMtr}
                disabled={isUpdatingOnLoom || onLoomRows.length === 0}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-2"
              >
                <Check size={16} />
                {isUpdatingOnLoom ? "Updating Database..." : `Update ${onLoomRows.length} On-Loom Mtr Records`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeamOpeningStockUpload;
