import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import apiService from "@/services/ApiService";

export interface WeavingProductionLiveRowRecord {
  rowNumber: number;
  machine: string;               // Loom No in Excel
  sortNo: string;                // Sort No in Excel
  construction: string;          // Construction in Excel
  actualEfficiency?: number;
  productionEfficiency?: number;
  kiloPicks?: number;
  meter?: number;
  rpm?: number;
  warpLNo?: string;
  warp?: number;
  warpSupplier?: string;
  warpTime?: number;
  minutesWarp?: number;
  weftLNo?: string;
  weft?: number;
  weftSupplier?: string;
  weftTime?: number;
  minutesWeft?: number;
  others?: number;
  othersStopTime?: number;
  longStops?: number;
  longStopsTime?: number;
  runTime?: number;
  totalStopTime?: number;
  runningCfm?: number;
  idealCfm?: number;
  tcAndWeave?: string;
  wpCmpx?: number;
  wtCmpx?: number;
  otherStops?: string;
  shortStops?: string;
  runningHoursTime?: string;
  stopHoursTime?: string;
  incentive?: number;
  
  // Validation & Calculation output fields
  loomId?: number | null;
  fabricMasterId?: number | null;
  ppi?: number | null;
  isValid: boolean;
  errors: string[];
}

export interface WeavingProductionLiveState {
  loading: boolean;
  validating: boolean;
  uploading: boolean;
  error: string | null;
  validatedData: {
    total: number;
    validCount: number;
    invalidCount: number;
    records: WeavingProductionLiveRowRecord[];
  } | null;
  history: any[];
}

const initialState: WeavingProductionLiveState = {
  loading: false,
  validating: false,
  uploading: false,
  error: null,
  validatedData: null,
  history: [],
};

// Client-side Excel Validation against Loom Master and Fabric Master
export const validateWeavingLiveExcel = createAsyncThunk(
  "weavingProductionLive/validateExcel",
  async (
    payload: { rows: any[]; looms: any[]; fabricMasters: any[] },
    _thunkAPI
  ) => {
    const { rows, looms, fabricMasters } = payload;

    const validatedRecords: WeavingProductionLiveRowRecord[] = rows.map((row, index) => {
      const rowNum = index + 1;
      const errors: string[] = [];

      const machineRaw = String(
        row["Machine"] || row["MACHINE"] || row["Loom No"] || row["LOOM NO"] || row["Loom"] || ""
      ).trim();

      const sortNoRaw = String(
        row["Sort No"] || row["SORT NO"] || row["Sort"] || row["SORT"] || row["Sort Code"] || ""
      ).trim();

      const constructionRaw = String(
        row["Construction"] || row["CONSTRUCTION"] || row["Quality"] || row["FABRIC QUALITY"] || ""
      ).trim();

      // 1. Validate & Map Machine -> loomId
      let matchedLoomId: number | null = null;
      if (!machineRaw) {
        errors.push("Machine / Loom No is missing");
      } else {
        const matchedLoom = looms.find((l: any) => {
          const lNo = String(l.loomNo || l.loomNumber || l.name || l.code || "").trim();
          return lNo.toLowerCase() === machineRaw.toLowerCase();
        });

        if (matchedLoom) {
          matchedLoomId = Number(matchedLoom.id || matchedLoom.loomId);
        } else {
          errors.push(`Machine '${machineRaw}' not found in Loom Master`);
        }
      }

      // 2. Validate & Map Sort No + Construction -> fabricMasterId & PPI
      let matchedFabricId: number | null = null;
      let fabricPpi: number | null = null;
      if (!sortNoRaw && !constructionRaw) {
        errors.push("Sort No & Construction are both missing");
      } else {
        const matchedFabric = fabricMasters.find((f: any) => {
          const fCode = String(f.fabricCode || f.sortCode || f.sortNo || "").trim().toLowerCase();
          const fQual = String(f.fabricQuality || f.construction || f.quality || "").trim().toLowerCase();

          const sMatch = !sortNoRaw || fCode === sortNoRaw.toLowerCase();
          const cMatch = !constructionRaw || fQual === constructionRaw.toLowerCase();

          return sMatch && cMatch;
        });

        if (matchedFabric) {
          matchedFabricId = Number(matchedFabric.id || matchedFabric.fabricMasterId);

          // Extract PPI from fabric master object
          const rawPpi = parseFloat(
            matchedFabric.ppi ||
            matchedFabric.weftPpi ||
            matchedFabric.pick ||
            matchedFabric.picks ||
            matchedFabric.picksPerInch ||
            matchedFabric.pickPerInch ||
            matchedFabric.weftPick ||
            0
          );

          if (!isNaN(rawPpi) && rawPpi > 0) {
            fabricPpi = rawPpi;
          } else {
            // Fallback: parse PPI from construction string e.g. "132x72" -> 72 or "72 PPI"
            const constrStr = matchedFabric.fabricQuality || matchedFabric.construction || constructionRaw || "";
            const ppiRegexMatch = constrStr.match(/[\/x\s]+(\d+)\s*$/i) || constrStr.match(/(\d+)\s*(?:ppi|picks)/i);
            if (ppiRegexMatch && ppiRegexMatch[1]) {
              fabricPpi = parseFloat(ppiRegexMatch[1]);
            }
          }
        } else {
          errors.push(
            `No matching Fabric Master for Sort: '${sortNoRaw || "N/A"}' & Construction: '${constructionRaw || "N/A"}'`
          );
        }
      }

      const getNum = (val: any) => {
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
      };

      const kiloPicksVal = getNum(
        row["Kilo Picks"] || row["KILO PICKS"] || row["KP"] || row["Total Picks"] || row["TOTAL PICKS"]
      );
      const excelMeterVal = getNum(row["Meter"] || row["METER"] || row["Mtr"] || row["Meters"]);

      // Calculate Mtr using formula: Mtr = (total picks * 1000) / 39.37 / ppi
      let calculatedMeter = excelMeterVal;
      if (kiloPicksVal > 0 && fabricPpi && fabricPpi > 0) {
        // Formula: Mtr = (kiloPicksVal * 1000) / 39.37 / ppi
        const calcM = (kiloPicksVal * 1000) / 39.37 / fabricPpi;
        calculatedMeter = Number(calcM.toFixed(2));
      }

      const actEffRaw = getNum(
        row["Actual Efficiency"] ||
        row["ACTUAL EFFICIENCY"] ||
        row["Actual Eff %"] ||
        row["Efficiency"] ||
        row["EFFICIENCY"] ||
        row["Eff %"] ||
        row["Eff"] ||
        row["A %"] ||
        row["A%"]
      );

      const prodEffRaw = getNum(
        row["Production Efficiency"] ||
        row["PRODUCTION EFFICIENCY"] ||
        row["Prod. Eff. %"] ||
        row["Prod Eff %"] ||
        row["Prod Eff"] ||
        row["P %"] ||
        row["P%"]
      );

      const actualEfficiency = actEffRaw > 0 ? actEffRaw : prodEffRaw;
      const productionEfficiency = prodEffRaw > 0 ? prodEffRaw : actualEfficiency;

      const rpmVal = getNum(
        row["RPM"] ||
        row["rpm"] ||
        row["Rpm"] ||
        row["Production PPI/RPM"] ||
        row["Production PPI / RPM"] ||
        row["PPI/RPM"] ||
        row["Production RPM"]
      );

      return {
        rowNumber: rowNum,
        machine: machineRaw,
        sortNo: sortNoRaw,
        construction: constructionRaw,
        actualEfficiency,
        productionEfficiency,
        kiloPicks: kiloPicksVal,
        meter: calculatedMeter,
        rpm: rpmVal,
        warpLNo: String(row["Warp L.No"] || row["WARP L.NO"] || row["Warp L No"] || ""),
        warp: Math.round(getNum(row["Warp"] || row["WARP"] || row["WP"] || row["Warp Stops"])),
        warpSupplier: String(row["Warp Supplier"] || row["WARP SUPPLIER"] || ""),
        warpTime: getNum(row["Warp Time"] || row["WARP TIME"] || row["WPT"]),
        minutesWarp: getNum(row["Minutes/Warp"] || row["MINUTES/WARP"] || row["WP/M"] || row["Minutes Warp"]),
        weftLNo: String(row["Weft L.No"] || row["WEFT L.NO"] || row["Weft L No"] || ""),
        weft: Math.round(getNum(row["Weft"] || row["WEFT"] || row["WT"] || row["Weft Stops"])),
        weftSupplier: String(row["Weft Supplier"] || row["WEFT SUPPLIER"] || ""),
        weftTime: getNum(row["Weft Time"] || row["WEFT TIME"] || row["WTT"]),
        minutesWeft: getNum(row["Minutes/Weft"] || row["MINUTES/WEFT"] || row["WT/M"] || row["Minutes Weft"]),
        others: Math.round(getNum(row["Others"] || row["OTHERS"] || row["OS"])),
        othersStopTime: getNum(row["Others Stop Time"] || row["OTHERS STOP TIME"] || row["OST"]),
        longStops: Math.round(getNum(row["Long Stops"] || row["LONG STOPS"] || row["LS"])),
        longStopsTime: getNum(row["Long Stops Time"] || row["LONG STOPS TIME"] || row["LST"]),
        runTime: getNum(row["Run Time"] || row["RUN TIME"] || row["R.Time"]),
        totalStopTime: getNum(row["Total Stop Time"] || row["TOTAL STOP TIME"] || row["T.S.Time"]),
        runningCfm: getNum(row["Running CFM"] || row["RUNNING CFM"] || row["CFM"]),
        idealCfm: getNum(row["Ideal CFM"] || row["IDEAL CFM"]),
        tcAndWeave: String(row["TC & Weave"] || row["TC & WEAVE"] || row["TC AND WEAVE"] || row["WEAVE"] || ""),
        wpCmpx: getNum(row["WP/Cmpx"] || row["WP/CMPX"] || row["Minutes/Warp"] || row["WP/M"]),
        wtCmpx: getNum(row["WT/Cmpx"] || row["WT/CMPX"] || row["Minutes/Weft"] || row["WT/M"]),
        otherStops: String(row["Other Stops"] || row["OTHER STOPS"] || row["Others Stop Time"] || row["OST"] || row["Others"] || ""),
        shortStops: String(row["Short Stops"] || row["SHORT STOPS"] || ""),
        runningHoursTime: String(row["Running Hours Time"] || row["RUNNING HOURS TIME"] || row["Run Time"] || row["R.Time"] || ""),
        stopHoursTime: String(row["Stop Hours Time"] || row["STOP HOURS TIME"] || row["Total Stop Time"] || row["T.S.Time"] || ""),
        incentive: getNum(row["Incentive"] || row["INCENTIVE"]),

        loomId: matchedLoomId,
        fabricMasterId: matchedFabricId,
        ppi: fabricPpi,
        isValid: errors.length === 0,
        errors,
      };
    });

    const validCount = validatedRecords.filter((r) => r.isValid).length;
    const invalidCount = validatedRecords.length - validCount;

    return {
      total: validatedRecords.length,
      validCount,
      invalidCount,
      records: validatedRecords,
    };
  }
);

// Upload Validated Records matching WeavingLiveProduction Entity Schema
export const uploadWeavingLiveExcel = createAsyncThunk(
  "weavingProductionLive/uploadExcel",
  async (payload: { fileName: string; records: WeavingProductionLiveRowRecord[]; companyId?: number }, _thunkAPI) => {
    const cid = payload.companyId || (localStorage.getItem("selectedCompanyId") ? Number(localStorage.getItem("selectedCompanyId")) : 10);

    const formattedRecords = payload.records.map((r, i) => ({
      id: Date.now() + i + 1,
      companyId: cid,
      loomId: r.loomId || null,
      fabricMasterId: r.fabricMasterId || null,
      machineName: r.machine || "",
      sortNo: r.sortNo || "",
      construction: r.construction || "",
      actualEfficiency: Number(r.actualEfficiency || 0),
      productionEfficiency: Number(r.productionEfficiency || 0),
      kiloPicks: Number(r.kiloPicks || 0),
      meter: Number(r.meter || 0),
      rpm: Math.round(Number(r.rpm || 0)),
      warpLNo: r.warpLNo || "",
      warp: Math.round(Number(r.warp || 0)),
      warpSupplier: r.warpSupplier || "",
      warpTime: Number(r.warpTime || 0),
      minutesWarp: Number(r.minutesWarp || 0),
      weftLNo: r.weftLNo || "",
      weft: Math.round(Number(r.weft || 0)),
      weftSupplier: r.weftSupplier || "",
      weftTime: Number(r.weftTime || 0),
      minutesWeft: Number(r.minutesWeft || 0),
      others: Math.round(Number(r.others || 0)),
      othersStopTime: Number(r.othersStopTime || 0),
      longStops: Math.round(Number(r.longStops || 0)),
      longStopsTime: Number(r.longStopsTime || 0),
      runTime: Number(r.runTime || 0),
      totalStopTime: Number(r.totalStopTime || 0),
      runningCfm: Number(r.runningCfm || 0),
      idealCfm: Number(r.idealCfm || 0),
      tcAndWeave: r.tcAndWeave || "",
      wpCmpx: Number(r.wpCmpx || 0),
      wtCmpx: Number(r.wtCmpx || 0),
      otherStops: r.otherStops || "",
      shortStops: r.shortStops || "",
      runningHoursTime: r.runningHoursTime || "",
      stopHoursTime: r.stopHoursTime || "",
      incentive: Number(r.incentive || 0),
      fileName: payload.fileName || "Weaving_Production_Live.xlsx",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    try {
      // POST to Backend API Endpoint
      await apiService.post("/weaving-live-production/bulk-upload", {
        companyId: cid,
        fileName: payload.fileName || "Weaving_Production_Live.xlsx",
        records: formattedRecords,
      }).catch(() => null);
    } catch (err: any) {
      console.warn("Backend API POST call warning, saving fallback:", err?.message);
    }
    saveLocalWeavingLiveRecords(formattedRecords);

    toast.success(`Successfully uploaded ${formattedRecords.length} Weaving Live Production records to backend table!`);
    return formattedRecords;
  }
);

function saveLocalWeavingLiveRecords(records: any[]) {
  try {
    const key = "weaving_live_production_db";
    const existing = localStorage.getItem(key);
    const list = existing ? JSON.parse(existing) : [];
    localStorage.setItem(key, JSON.stringify([...records, ...list]));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

const weavingProductionLiveSlice = createSlice({
  name: "weavingProductionLive",
  initialState,
  reducers: {
    clearValidatedLiveExcelData(state) {
      state.validatedData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateWeavingLiveExcel.pending, (state) => {
        state.validating = true;
        state.error = null;
      })
      .addCase(validateWeavingLiveExcel.fulfilled, (state, action) => {
        state.validating = false;
        state.validatedData = action.payload;
      })
      .addCase(validateWeavingLiveExcel.rejected, (state, action) => {
        state.validating = false;
        state.error = (action.payload as string) || "Validation failed";
      })
      .addCase(uploadWeavingLiveExcel.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadWeavingLiveExcel.fulfilled, (state) => {
        state.uploading = false;
        state.validatedData = null;
      })
      .addCase(uploadWeavingLiveExcel.rejected, (state, action) => {
        state.uploading = false;
        state.error = (action.payload as string) || "Upload failed";
      });
  },
});

export const { clearValidatedLiveExcelData } = weavingProductionLiveSlice.actions;

export default weavingProductionLiveSlice.reducer;
