import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { AppDispatch, RootState } from "@/state/store";
import { getAllReports } from "@/state/reportConfigSlice";
import { getSubCategoryByCategory } from "@/state/subCategorySlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllFabricMastersForDropdown, getAllFabricMasters } from "@/state/fabricMasterSlice";
import {
  validateWeavingLiveExcel,
  uploadWeavingLiveExcel,
  clearValidatedLiveExcelData,
  WeavingProductionLiveRowRecord,
} from "@/state/weavingProductionLiveSlice";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import {
  Layers,
  Sliders,
  Printer,
  FileText,
  X,
  RotateCcw,
  Filter,
  Activity,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Search,
  Check,
} from "lucide-react";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import apiService from "@/services/ApiService";
import * as XLSX from "xlsx";

// Default Weaving Production Report Fields matching UI design
const DEFAULT_WEAVING_FIELDS = [
  "Actual Efficiency",
  "Weft L.No",
  "Warp L.No",
  "Weft Supplier",
  "Warp Supplier",
  "Production Efficiency",
  "Kilo Picks",
  "Meter",
  "Warp",
  "Warp Time",
  "Minutes/Warp",
  "Weft",
  "Weft Time",
  "Minutes/Weft",
  "Others",
  "Others Stop Time",
  "Long Stops",
  "Long Stops Time",
  "Run Time",
  "RPM",
  "Total Stop Time",
  "Running CFM",
  "Ideal CFM"
];

export default function WeavingProductionLiveReport() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const companyId = useResolvedCompanyId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redux selectors
  const { reportList, fetched, lastFetchedCompanyId } = useSelector(
    (state: RootState) => state.reportConfig
  );
  const { subCategoryByCategoryList } = useSelector(
    (state: RootState) => state.subCategory
  );
  const { loomList } = useSelector((state: RootState) => state.loomMaster);
  const { fabricMasterFullList, fabricMasterList } = useSelector(
    (state: RootState) => state.fabricMaster
  );
  const { validating, uploading, validatedData } = useSelector(
    (state: RootState) => state.weavingProductionLive
  );

  // Form Filter States
  const [groupBy, setGroupBy] = useState<string>("-- Select --");
  const [selectedShed, setSelectedShed] = useState<string>("");
  const [period, setPeriod] = useState<string>("Running Shift");
  const [machineStatus, setMachineStatus] = useState<string>("All");
  const [reportType, setReportType] = useState<"Detailed" | "Summary">("Detailed");
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_WEAVING_FIELDS);
  const [shedOptionsList, setShedOptionsList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Bulk Excel Upload Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [rawExcelRows, setRawExcelRows] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "VALID" | "INVALID">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Effective Fabric Master List for validation
  const effectiveFabricMasters = useMemo(() => {
    if (Array.isArray(fabricMasterFullList) && fabricMasterFullList.length > 0) {
      return fabricMasterFullList;
    }
    if (Array.isArray(fabricMasterList) && fabricMasterList.length > 0) {
      return fabricMasterList;
    }
    return [];
  }, [fabricMasterFullList, fabricMasterList]);

  // Load Report Configurations & Master Data on Mount
  useEffect(() => {
    const shouldFetch = !fetched || (companyId !== null && companyId !== lastFetchedCompanyId);
    if (companyId && shouldFetch) {
      dispatch(getAllReports({ companyId }));
    }
    dispatch(getAllLooms({ limit: 10000, offset: 0, fetchAll: true }));
    dispatch(getAllFabricMastersForDropdown());
    dispatch(getAllFabricMasters({ fetchAll: true }));
  }, [dispatch, companyId, fetched, lastFetchedCompanyId]);

  // Load SubCategories for "Shed" category
  useEffect(() => {
    const fetchShedData = async () => {
      try {
        await dispatch(getSubCategoryByCategory({ categoryName: "Shed", fetchAll: true })).unwrap();
      } catch (e) {
        console.warn("Failed to fetch Shed subcategories via Redux, attempting direct API fallback...");
        try {
          const res: any = await apiService.get("/sub-category/by-category?categoryName=Shed");
          const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
          if (Array.isArray(list)) {
            const sheds = list.map((item: any) => item.subcategoryName || item.subCategoryName || item.name).filter(Boolean);
            setShedOptionsList(sheds);
          }
        } catch (err) {
          console.error("Failed to load Shed subcategories:", err);
        }
      }
    };
    fetchShedData();
  }, [dispatch]);

  // Sync Redux subCategoryByCategoryList to shedOptionsList
  useEffect(() => {
    if (Array.isArray(subCategoryByCategoryList) && subCategoryByCategoryList.length > 0) {
      const sheds = subCategoryByCategoryList
        .map((item: any) => item.subcategoryName || item.subCategoryName || item.name)
        .filter(Boolean);
      setShedOptionsList(sheds);
    }
  }, [subCategoryByCategoryList]);

  // Auto-find Weaving Production Report from reportList
  const weavingReport = useMemo(() => {
    if (!reportList || reportList.length === 0) return null;
    const match = reportList.find((r) => {
      const name = r.reportName.toLowerCase();
      return name.includes("weaving production") || name.includes("production report") || name.includes("live weaving");
    });
    return match || reportList[0] || null;
  }, [reportList]);

  useEffect(() => {
    if (weavingReport?.id && !selectedReportId) {
      setSelectedReportId(String(weavingReport.id));
    }
  }, [weavingReport, selectedReportId]);

  // Available Fields matching Weaving Production Report standard fields
  const availableReportFields = useMemo(() => {
    return DEFAULT_WEAVING_FIELDS;
  }, []);

  const handleToggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields((prev) => prev.filter((f) => f !== field));
    } else {
      setSelectedFields((prev) => [...prev, field]);
    }
  };

  const handleResetFields = () => {
    setSelectedFields(availableReportFields);
  };

  // Excel Upload Parsing & Validation Logic
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
        const workbook = XLSX.read(bstr, { type: "binary", cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!jsonRows || jsonRows.length === 0) {
          toast.error("The selected Excel file contains no data.");
          return;
        }

        setRawExcelRows(jsonRows);
        toast.info(`Loaded ${jsonRows.length} rows from Excel. Validating against Master Data...`);

        dispatch(
          validateWeavingLiveExcel({
            rows: jsonRows,
            looms: loomList || [],
            fabricMasters: effectiveFabricMasters,
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
      validateWeavingLiveExcel({
        rows: rawExcelRows,
        looms: loomList || [],
        fabricMasters: effectiveFabricMasters,
      })
    );
  };

  const handleUploadSubmit = async () => {
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
        uploadWeavingLiveExcel({
          fileName,
          records: validRows,
          companyId: companyId || undefined,
        })
      ).unwrap();

      if (result) {
        toast.success(`Successfully saved ${validRows.length} live production records to database!`);
        dispatch(clearValidatedLiveExcelData());
        setRawExcelRows([]);
        setFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsUploadModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err || "Failed to upload live production data");
    }
  };

  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        "Machine": "Loom No - 25",
        "Sort No": "H-1050",
        "Construction": "100s CC EGY x 120s CC EGY / 225 x (68 x 4) / 125\" Plain Satin",
        "TC & Weave": "500TC EGY- SATIN",
        "Efficiency": 87.4,
        "Production PPI/RPM": 615,
        "Kilo Picks": 389.5,
        "Mtr": 112.4,
        "WP": 31,
        "WP/Cmpx": 9.7,
        "WT": 33,
        "WT/Cmpx": 10.2,
        "Other Stops": "0:23:25",
        "Short Stops": "1:33:40",
        "Long Stops": "0:00:00",
        "Running Hours Time": "10:20:57",
        "Stop Hours Time": "1:30:40",
        "Running CFM": 42.1,
        "Ideal CFM": 3.4,
        "Incentive": 5,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weaving Production Live");
    XLSX.writeFile(workbook, "Weaving_Production_Live_Template.xlsx");
  };

  const records = validatedData?.records || [];
  const filteredRecords = records.filter((r) => {
    if (filterType === "VALID" && !r.isValid) return false;
    if (filterType === "INVALID" && r.isValid) return false;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      return (
        (r.machine || "").toLowerCase().includes(query) ||
        (r.sortNo || "").toLowerCase().includes(query) ||
        (r.construction || "").toLowerCase().includes(query) ||
        (r.warpSupplier || "").toLowerCase().includes(query) ||
        (r.weftSupplier || "").toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Submit and Navigate to CommonReportView / Execution
  const handleNavigateView = (actionType?: "pdf" | "print" | "excel") => {
    const reportToUse = weavingReport || (selectedReportId ? reportList.find(r => String(r.id) === selectedReportId) : null);

    if (!reportToUse) {
      toast.warn("Weaving Production Report configuration is loading or not found.");
      return;
    }

    if (selectedFields.length === 0) {
      toast.warn("Please select at least one Report Field.");
      return;
    }

    const customFilterValues: Record<string, any> = {
      machineStatus,
      period,
    };

    if (groupBy === "Shed" && selectedShed) {
      customFilterValues["Shed"] = [selectedShed];
    }

    navigate("/reports/weaving-production-report-view", {
      state: {
        reportId: reportToUse.id,
        originalReportId: selectedReportId || reportToUse.id,
        selectedColumns: selectedFields,
        reportType: reportType === "Summary" ? "Summary" : "Detailed",
        groupByColumns: groupBy !== "-- Select --" ? [groupBy] : [],
        filterByColumns: groupBy === "Shed" && selectedShed ? ["Shed"] : [],
        dateMode: "single",
        customFilterValues,
        actionType,
      },
    });
  };

  return (
    <div className="p-6 pt-16 mt-5 max-w-5xl mx-auto space-y-6">
      {/* Title Header with Bulk Upload Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-600 animate-pulse" />
            Reports - Production Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and view live weaving production metrics, shed performance, and loom efficiency.
          </p>
        </div>
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 shadow-sm shrink-0"
        >
          <Upload className="h-4 w-4" />
          Bulk Excel Upload
        </Button>
      </div>

      {/* Main Filter Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Group By Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Group By
            </label>
            <CommonSearchableSelect
              value={groupBy}
              onValueChange={(val) => {
                setGroupBy(val);
                if (val !== "Shed") setSelectedShed("");
              }}
              placeholder="-- Select --"
              options={[
                { value: "-- Select --", label: "-- Select --" },
                { value: "Shed", label: "Shed" },
                { value: "Machine Type", label: "Machine Type" },
                { value: "Machine", label: "Machine" },
                { value: "Design", label: "Design" },
                { value: "Beam", label: "Beam" },
              ]}
            />
          </div>

          {/* Conditional Shed Dropdown (Visible when Group By = "Shed") */}
          {groupBy === "Shed" && (
            <div className="flex flex-col animate-in fade-in duration-150">
              <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                Shed Filter <span className="text-red-500">*</span>
              </label>
              <CommonSearchableSelect
                value={selectedShed}
                onValueChange={setSelectedShed}
                placeholder="-- Select Shed --"
                options={[
                  { value: "", label: "-- All Sheds --" },
                  ...shedOptionsList.map((shed) => ({
                    value: shed,
                    label: shed,
                  })),
                ]}
              />
            </div>
          )}

          {/* Period Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Period
            </label>
            <CommonSearchableSelect
              value={period}
              onValueChange={setPeriod}
              placeholder="Running Shift"
              options={[
                { value: "Running Shift", label: "Running Shift" },
                { value: "Today", label: "Today" },
                { value: "Yesterday", label: "Yesterday" },
                { value: "This Week", label: "This Week" },
                { value: "This Month", label: "This Month" },
              ]}
            />
          </div>

          {/* Machine Status Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Machine Status
            </label>
            <CommonSearchableSelect
              value={machineStatus}
              onValueChange={setMachineStatus}
              placeholder="All"
              options={[
                { value: "All", label: "All" },
                { value: "Running", label: "Running" },
                { value: "Stopped", label: "Stopped" },
              ]}
            />
          </div>

          {/* Report Type Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Report Type
            </label>
            <CommonSearchableSelect
              value={reportType}
              onValueChange={(val) => setReportType(val as any)}
              placeholder="Detail"
              options={[
                { value: "Detailed", label: "Detail" },
                { value: "Summary", label: "Summary" },
              ]}
            />
          </div>
        </div>

        {/* Report Fields Multi-Select Section */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-indigo-500" />
              Report Fields ({selectedFields.length} Selected)
            </span>
            <button
              onClick={handleResetFields}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="h-3 w-3" />
              Select All Fields
            </button>
          </div>

          <div className="border border-slate-200 p-4 rounded-xl flex flex-wrap gap-2 bg-slate-50/50 min-h-24">
            {availableReportFields.map((field) => {
              const isSelected = selectedFields.includes(field);
              return (
                <div
                  key={field}
                  onClick={() => handleToggleField(field)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer select-none transition-all shadow-sm ${
                    isSelected
                      ? "bg-white border-slate-300 text-slate-700 hover:border-indigo-400"
                      : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-white"
                  }`}
                >
                  {isSelected && <span className="text-emerald-500 text-xs font-bold">✓</span>}
                  <span>{field}</span>
                  {isSelected && (
                    <X
                      className="h-3 w-3 text-slate-400 ml-1 hover:text-slate-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleField(field);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions Button Panel */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            onClick={() => handleNavigateView("print")}
            variant="outline"
            className="border-slate-200 text-slate-700 flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={() => handleNavigateView("pdf")}
            variant="outline"
            className="border-indigo-100 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            onClick={() => handleNavigateView("excel")}
            variant="outline"
            className="border-emerald-100 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            Export Excel
          </Button>
          <Button
            onClick={() => handleNavigateView()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center shadow-sm px-8 h-9"
          >
            View Report
          </Button>
        </div>
      </div>

      {/* Bulk Excel Upload Dialog Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Bulk Excel Upload - Live Weaving Production
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upload live production spreadsheet with Loom & Fabric Master validation and database mapping.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* File Drop & Control Zone */}
              <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-xl p-6 text-center space-y-3 transition-colors">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    {fileName ? `Selected File: ${fileName}` : "Select or Drop Weaving Live Excel File"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports .xlsx, .xls containing columns Machine (Loom No), Sort No, Construction, Actual Efficiency, RPM, Kilo Picks, Meter, Warp/Weft details, etc.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    id="live-excel-input"
                  />
                  <label htmlFor="live-excel-input">
                    <Button
                      asChild
                      className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer px-6 h-9 text-xs"
                    >
                      <span>Browse Excel File</span>
                    </Button>
                  </label>

                  <Button
                    variant="outline"
                    onClick={handleDownloadSampleTemplate}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 h-9 text-xs flex items-center gap-1.5"
                  >
                    <Download size={14} /> Download Sample Template
                  </Button>

                  {rawExcelRows.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleRevalidate}
                      disabled={validating}
                      className="border-emerald-400 text-emerald-700 hover:bg-emerald-50 h-9 text-xs flex items-center gap-1.5"
                    >
                      <RefreshCw size={14} className={validating ? "animate-spin" : ""} />
                      Re-Validate Master Data
                    </Button>
                  )}
                </div>
              </div>

              {/* Validation Summary Cards */}
              {validatedData && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase">Total Rows</p>
                      <p className="text-xl font-extrabold text-slate-800">{validatedData.total}</p>
                    </div>
                    <Layers className="w-6 h-6 text-blue-500 opacity-80" />
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase">Valid Rows (Ready)</p>
                      <p className="text-xl font-extrabold text-emerald-600">{validatedData.validCount}</p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-80" />
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-red-500 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase">Invalid Rows (Errors)</p>
                      <p className="text-xl font-extrabold text-red-600">{validatedData.invalidCount}</p>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-red-500 opacity-80" />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-center">
                    <Button
                      onClick={handleUploadSubmit}
                      disabled={uploading || validatedData.validCount === 0}
                      className="w-full h-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm text-xs py-2"
                    >
                      <Check size={16} />
                      {uploading
                        ? "Saving to Backend..."
                        : `Upload ${validatedData.validCount} Valid Records`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Filter and Search Bar */}
              {validatedData && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Filter size={13} /> Filter:
                    </span>
                    <button
                      onClick={() => setFilterType("ALL")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        filterType === "ALL"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      All ({validatedData.total})
                    </button>
                    <button
                      onClick={() => setFilterType("VALID")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        filterType === "VALID"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Valid ({validatedData.validCount})
                    </button>
                    <button
                      onClick={() => setFilterType("INVALID")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        filterType === "INVALID"
                          ? "bg-red-600 text-white shadow-sm"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Invalid ({validatedData.invalidCount})
                    </button>
                  </div>

                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Search Machine, Sort, Construction..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Data Validation Preview Table */}
              {validatedData && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700 flex justify-between items-center">
                    <span>Validation & Data Mapping Details</span>
                    <span className="text-slate-400 font-normal">
                      Showing {filteredRecords.length} of {records.length} records
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                    <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 border-r border-slate-200 text-center">Row</th>
                          <th className="p-2.5 border-r border-slate-200">Validation Status</th>
                          <th className="p-2.5 border-r border-slate-200 font-bold text-indigo-900 bg-indigo-50/50">
                            Machine (Loom No)
                          </th>
                          <th className="p-2.5 border-r border-slate-200 font-bold text-indigo-900 bg-indigo-50/50">
                            Mapped Loom ID
                          </th>
                          <th className="p-2.5 border-r border-slate-200 font-bold text-indigo-900 bg-indigo-50/50">
                            Sort No
                          </th>
                          <th className="p-2.5 border-r border-slate-200 font-bold text-indigo-900 bg-indigo-50/50">
                            Construction
                          </th>
                          <th className="p-2.5 border-r border-slate-200 font-bold text-indigo-900 bg-indigo-50/50">
                            Mapped Fabric ID
                          </th>
                          <th className="p-2.5 border-r border-slate-200 font-bold text-indigo-900 bg-indigo-50/50">
                            TC & Weave
                          </th>
                          <th className="p-2.5 border-r border-slate-200 text-right">Actual Eff. %</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">Prod. Eff. %</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">Kilo Picks</th>
                          <th className="p-2.5 border-r border-slate-200 text-right font-bold text-emerald-800 bg-emerald-50/50">
                            Meter (Calc)
                          </th>
                          <th className="p-2.5 border-r border-slate-200 text-right font-medium text-slate-700">
                            PPI
                          </th>
                          <th className="p-2.5 border-r border-slate-200 text-right">RPM</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">WP</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">WP/Cmpx</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">WT</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">WT/Cmpx</th>
                          <th className="p-2.5 border-r border-slate-200">Other Stops</th>
                          <th className="p-2.5 border-r border-slate-200">Short Stops</th>
                          <th className="p-2.5 border-r border-slate-200">Running Hours Time</th>
                          <th className="p-2.5 border-r border-slate-200">Stop Hours Time</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">Running CFM</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">Ideal CFM</th>
                          <th className="p-2.5 text-right">Incentive</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={25} className="p-8 text-center text-slate-400">
                              No records match the filter query.
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((r, idx) => (
                            <tr
                              key={idx}
                              className={`hover:bg-slate-50 transition-colors ${
                                !r.isValid ? "bg-red-50/30" : "bg-white"
                              }`}
                            >
                              <td className="p-2 border-r border-slate-100 text-center font-mono text-slate-500">
                                {r.rowNumber}
                              </td>
                              <td className="p-2 border-r border-slate-100">
                                {r.isValid ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    <CheckCircle2 size={11} /> Valid Record
                                  </span>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                      <AlertTriangle size={11} /> Invalid
                                    </span>
                                    <div className="text-[10px] text-red-600 font-normal whitespace-normal max-w-[200px]">
                                      {r.errors.join("; ")}
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="p-2 border-r border-slate-100 font-bold text-slate-900 bg-indigo-50/20">
                                {r.machine || "-"}
                              </td>
                              <td className="p-2 border-r border-slate-100 font-mono text-center font-bold text-indigo-700 bg-indigo-50/20">
                                {r.loomId ? (
                                  <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                                    #{r.loomId}
                                  </span>
                                ) : (
                                  <span className="text-red-500 font-normal italic">Unmatched</span>
                                )}
                              </td>
                              <td className="p-2 border-r border-slate-100 font-semibold text-slate-800 bg-indigo-50/20">
                                {r.sortNo || "-"}
                              </td>
                              <td className="p-2 border-r border-slate-100 font-medium text-slate-700 bg-indigo-50/20">
                                {r.construction || "-"}
                              </td>
                              <td className="p-2 border-r border-slate-100 font-mono text-center font-bold text-indigo-700 bg-indigo-50/20">
                                {r.fabricMasterId ? (
                                  <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                                    #{r.fabricMasterId}
                                  </span>
                                ) : (
                                  <span className="text-red-500 font-normal italic">Unmatched</span>
                                )}
                              </td>
                              <td className="p-2 border-r border-slate-100 font-medium text-slate-800">
                                {r.tcAndWeave || "-"}
                              </td>
                              <td className="p-2 border-r border-slate-100 text-right font-semibold">
                                {r.actualEfficiency ?? 0}%
                              </td>
                              <td className="p-2 border-r border-slate-100 text-right">
                                {r.productionEfficiency ?? 0}%
                              </td>
                              <td className="p-2 border-r border-slate-100 text-right">{r.kiloPicks ?? 0}</td>
                              <td className="p-2 border-r border-slate-100 text-right font-bold text-emerald-700 bg-emerald-50/30">
                                {r.meter ?? 0}
                              </td>
                              <td className="p-2 border-r border-slate-100 text-right font-medium text-slate-600">
                                {r.ppi ?? "-"}
                              </td>
                              <td className="p-2 border-r border-slate-100 text-right">{r.rpm ?? 0}</td>
                              <td className="p-2 border-r border-slate-100 text-right font-semibold">{r.warp ?? 0}</td>
                              <td className="p-2 border-r border-slate-100 text-right">{r.wpCmpx ?? 0}</td>
                              <td className="p-2 border-r border-slate-100 text-right font-semibold">{r.weft ?? 0}</td>
                              <td className="p-2 border-r border-slate-100 text-right">{r.wtCmpx ?? 0}</td>
                              <td className="p-2 border-r border-slate-100">{r.otherStops || "-"}</td>
                              <td className="p-2 border-r border-slate-100">{r.shortStops || "-"}</td>
                              <td className="p-2 border-r border-slate-100">{r.runningHoursTime || "-"}</td>
                              <td className="p-2 border-r border-slate-100">{r.stopHoursTime || "-"}</td>
                              <td className="p-2 border-r border-slate-100 text-right">{r.runningCfm ?? 0}</td>
                              <td className="p-2 border-r border-slate-100 text-right">{r.idealCfm ?? 0}</td>
                              <td className="p-2 text-right font-semibold text-emerald-700">{r.incentive ?? 0}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsUploadModalOpen(false)}
                className="border-slate-300 text-slate-700 text-xs h-9 px-5"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
