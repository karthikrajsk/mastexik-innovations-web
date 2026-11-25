import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiService from "@/services/ApiService";

export interface BeamStockRecord {
  id?: number;
  companyId?: number;
  stockDate?: string;
  beamInwardNo?: string;
  sizedBeamNo: string;
  flangeId?: number;
  flangeNo?: string;
  weavingContractId?: number;
  weavingContractNo?: string;
  weavingVendorId?: number;
  weaverVendorName?: string;
  sizingVendorId?: number;
  sizingVendorName?: string;
  salesOrderId?: number;
  salesOrderNo?: string;
  sizingPlanId?: number;
  sizingPlanNo?: string;
  fabricId?: number;
  fabricCode?: string;
  quality?: string;
  wrapMeters?: number;
  onLoomMtr?: number;
  shrinkage?: number;
  expectedFabricMeter?: number;
  totalEnds?: number;
  fabricPanelWidth?: number;
  warpCount?: string;
  warpYarnMillName?: string;
  warpYarnLotNo?: string;
  sizingSetNo?: string;
  sizingPickupPercent?: number;
  dcNumber?: string;
  dcDate?: string;
  sizingRate?: number;
  isBeamOutwarded?: number;
  isBeamGated?: number;
  isReturn?: number;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidatedBeamStockRow extends BeamStockRecord {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

export interface BeamStockValidationResult {
  records: ValidatedBeamStockRow[];
  total: number;
  validCount: number;
  invalidCount: number;
}

interface BeamStockState {
  stockList: BeamStockRecord[];
  paginationInfo: {
    total: number;
    offset: number;
    limit: number;
  } | null;
  loading: boolean;
  validating: boolean;
  uploading: boolean;
  validatedData: BeamStockValidationResult | null;
  error: string | null;
}

const initialState: BeamStockState = {
  stockList: [],
  paginationInfo: null,
  loading: false,
  validating: false,
  uploading: false,
  validatedData: null,
  error: null,
};

const normalizeBeamStockResponse = (response: any, fallbackOffset: number = 0, fallbackLimit: number = 10) => {
  if (!response) {
    return { data: [], total: 0, offset: fallbackOffset, limit: fallbackLimit };
  }

  let resObj = response;
  if (response.data !== undefined) {
    resObj = response.data;
  }

  if (Array.isArray(resObj)) {
    return {
      data: resObj,
      total: resObj.length,
      offset: fallbackOffset,
      limit: fallbackLimit,
    };
  }

  if (resObj && typeof resObj === 'object') {
    const listData = Array.isArray(resObj.data)
      ? resObj.data
      : Array.isArray(resObj.items)
        ? resObj.items
        : Array.isArray(resObj.rows)
          ? resObj.rows
          : [];

    return {
      data: listData,
      total: resObj.total ?? resObj.count ?? listData.length,
      offset: resObj.offset ?? fallbackOffset,
      limit: resObj.limit ?? fallbackLimit,
    };
  }

  return { data: [], total: 0, offset: fallbackOffset, limit: fallbackLimit };
};

// Fetch Beam Stock List by Company or All
export const getAllBeamStockByCompany = createAsyncThunk(
  "beamStock/getAllByCompany",
  async (
    params: { companyId?: number; offset?: number; limit?: number; fetchAll?: boolean } = {},
    { rejectWithValue }
  ) => {
    try {
      const { companyId, offset, limit, fetchAll } = params;
      let url = "/beam-stock";
      if (companyId) {
        url = `/beam-stock/company/${companyId}`;
      }
      const queryParams: string[] = [];
      if (fetchAll) {
        // No offset/limit for fetchAll
      } else {
        if (offset !== undefined) queryParams.push(`offset=${offset}`);
        if (limit !== undefined) queryParams.push(`limit=${limit}`);
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }
      const response = await apiService.get(url);
      return response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Failed to fetch beam stock records");
    }
  }
);

// Validate Excel Rows against Masters
export const validateBeamStockExcel = createAsyncThunk(
  "beamStock/validateExcel",
  async (
    payload: {
      rows: any[];
      fabricMasters: any[];
      weavingContracts: any[];
      vendors: any[];
      sizingPlans: any[];
      salesOrders: any[];
      flanges: any[];
    },
    { rejectWithValue }
  ) => {
    try {
      const { rows, fabricMasters, weavingContracts, vendors, sizingPlans, salesOrders, flanges } = payload;
      const records: ValidatedBeamStockRow[] = [];
      let validCount = 0;
      let invalidCount = 0;

      rows.forEach((row: any, idx: number) => {
        const errors: string[] = [];

        const getVal = (keys: string[]): string => {
          for (const key of Object.keys(row)) {
            const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
            if (keys.some(k => cleanKey.includes(k))) {
              return String(row[key] ?? "").trim();
            }
          }
          return "";
        };

        const sizedBeamNo = getVal(["sizedbeam", "beamno", "sizedbeamno"]);
        const flangeNo = getVal(["flangeno", "emptybeamno", "flange"]);
        const weavingContractNo = getVal(["weavingcontract", "contractno", "wcno"]);
        const weaverName = getVal(["weaver", "weavingvendor", "vendor"]);
        const sizingVendorName = getVal(["sizingvendor", "supplier"]);
        const salesOrderNo = getVal(["salesorder", "order", "sono"]);
        const sizingPlanNo = getVal(["sizingplan", "planno"]);
        const fabricCodeOrQuality = getVal(["sort", "fabric", "quality"]);
        const wrapMetersVal = getVal(["wrapmeter", "warpmeter", "meter"]);
        const onLoomMtrVal = getVal(["onloommtr", "onloommeter", "onloom", "loommtr"]);
        const shrinkageVal = getVal(["shrinkage"]);
        const expectedFabricMeterVal = getVal(["expectedfabricmeter", "efm"]);
        const totalEndsVal = getVal(["totalends", "ends"]);
        const fabricPanelWidthVal = getVal(["fabricpanelwidth", "width"]);
        const warpCount = getVal(["warpcount", "count"]);
        const warpYarnMillName = getVal(["millname", "warpmill"]);
        const warpYarnLotNo = getVal(["warplot", "lotno"]);
        const sizingSetNo = getVal(["setno", "sizingsetno"]);
        const sizingPickupVal = getVal(["pickup", "sizingpickup"]);
        const dcNumber = getVal(["dcnumber", "dcno"]);
        const dcDate = getVal(["dcdate"]);
        const stockDate = getVal(["stockdate", "inwarddate", "date"]);
        const sizingRateVal = getVal(["sizingrate", "rate"]);
        const remarks = getVal(["remarks", "remark"]);

        if (!sizedBeamNo) {
          errors.push("Sized Beam No is required.");
        }

        let matchedFabric: any = null;
        if (fabricCodeOrQuality) {
          matchedFabric = fabricMasters.find(
            (f: any) =>
              String(f.fabricCode || "").toLowerCase() === fabricCodeOrQuality.toLowerCase() ||
              String(f.quality || f.fabricQuality || "").toLowerCase() === fabricCodeOrQuality.toLowerCase()
          );
        }

        let matchedContract: any = null;
        if (weavingContractNo) {
          matchedContract = weavingContracts.find(
            (c: any) =>
              String(c.weavingContractNo || c.contractNo || c.id || "").toLowerCase() ===
              weavingContractNo.toLowerCase()
          );
        }

        let matchedWeaver: any = null;
        if (weaverName) {
          matchedWeaver = vendors.find(
            (v: any) =>
              String(v.vendorName || v.name || "").toLowerCase().includes(weaverName.toLowerCase())
          );
        }

        let matchedSizingVendor: any = null;
        if (sizingVendorName) {
          matchedSizingVendor = vendors.find(
            (v: any) =>
              String(v.vendorName || v.name || "").toLowerCase().includes(sizingVendorName.toLowerCase())
          );
        }

        let matchedSO: any = null;
        if (salesOrderNo) {
          matchedSO = salesOrders.find(
            (s: any) =>
              String(s.salesOrderNo || s.orderNo || s.id || "").toLowerCase() ===
              salesOrderNo.toLowerCase()
          );
        }

        let matchedSizingPlan: any = null;
        if (sizingPlanNo) {
          matchedSizingPlan = sizingPlans.find(
            (sp: any) =>
              String(sp.sizingPlanNo || sp.planNo || sp.id || "").toLowerCase() ===
              sizingPlanNo.toLowerCase()
          );
        }

        let matchedFlange: any = null;
        if (flangeNo) {
          matchedFlange = flanges.find(
            (fl: any) =>
              String(fl.flangeNo || fl.flangeNumber || fl.id || "").toLowerCase() ===
              flangeNo.toLowerCase()
          );
        }

        const isValid = errors.length === 0;
        if (isValid) validCount++;
        else invalidCount++;

        records.push({
          rowNumber: idx + 1,
          isValid,
          errors,
          sizedBeamNo,
          flangeNo,
          flangeId: matchedFlange ? Number(matchedFlange.id || matchedFlange.flangeId) : undefined,
          weavingContractNo,
          weavingContractId: matchedContract ? Number(matchedContract.id) : undefined,
          weaverVendorName: matchedWeaver ? matchedWeaver.vendorName : weaverName,
          weavingVendorId: matchedWeaver ? Number(matchedWeaver.id) : undefined,
          sizingVendorName: matchedSizingVendor ? matchedSizingVendor.vendorName : sizingVendorName,
          sizingVendorId: matchedSizingVendor ? Number(matchedSizingVendor.id) : undefined,
          salesOrderNo,
          salesOrderId: matchedSO ? Number(matchedSO.id) : undefined,
          sizingPlanNo,
          sizingPlanId: matchedSizingPlan ? Number(matchedSizingPlan.id) : undefined,
          fabricCode: matchedFabric ? matchedFabric.fabricCode : fabricCodeOrQuality,
          quality: matchedFabric ? (matchedFabric.quality || matchedFabric.fabricQuality) : fabricCodeOrQuality,
          fabricId: matchedFabric ? Number(matchedFabric.id) : undefined,
          wrapMeters: wrapMetersVal ? Number(wrapMetersVal) : 0,
          onLoomMtr: onLoomMtrVal ? Number(onLoomMtrVal) : undefined,
          shrinkage: shrinkageVal ? Number(shrinkageVal) : 0,
          expectedFabricMeter: expectedFabricMeterVal ? Number(expectedFabricMeterVal) : 0,
          totalEnds: totalEndsVal ? Number(totalEndsVal) : 0,
          fabricPanelWidth: fabricPanelWidthVal ? Number(fabricPanelWidthVal) : 0,
          warpCount,
          warpYarnMillName,
          warpYarnLotNo,
          sizingSetNo,
          sizingPickupPercent: sizingPickupVal ? Number(sizingPickupVal) : 0,
          dcNumber,
          dcDate,
          stockDate: stockDate || new Date().toISOString().split("T")[0],
          sizingRate: sizingRateVal ? Number(sizingRateVal) : 0,
          remarks,
          isBeamOutwarded: 0,
          isBeamGated: 0,
          isReturn: 0,
        });
      });

      return {
        records,
        total: rows.length,
        validCount,
        invalidCount,
      };
    } catch (err: any) {
      return rejectWithValue(err?.message || "Failed to validate Excel rows");
    }
  }
);

// Upload Valid Bulk Records to Backend
export const uploadBulkBeamStock = createAsyncThunk(
  "beamStock/uploadBulk",
  async (
    payload: { companyId?: number; fileName: string; records: BeamStockRecord[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.post("/beam-stock/bulk-upload", payload);
      return response.data || response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Failed to upload beam stock records");
    }
  }
);

// Bulk Update On-Loom Mtr via Excel
export const updateOnLoomMtrBulk = createAsyncThunk(
  "beamStock/updateOnLoomMtrBulk",
  async (
    payload: { companyId?: number; records: { sizedBeamNo: string; loomNo?: string; onLoomMtr: number }[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.post("/beam-stock/update-on-loom-mtr", payload);
      return response.data || response;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Failed to update On-Loom Mtr records");
    }
  }
);

// Delete Beam Stock Record
export const deleteBeamStock = createAsyncThunk(
  "beamStock/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.delete(`/beam-stock/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Failed to delete beam stock record");
    }
  }
);

const beamStockSlice = createSlice({
  name: "beamStock",
  initialState,
  reducers: {
    clearValidatedBeamStock: (state) => {
      state.validatedData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllBeamStockByCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBeamStockByCompany.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const normalized = normalizeBeamStockResponse(action.payload);
        state.stockList = normalized.data;
        state.paginationInfo = {
          total: normalized.total,
          offset: normalized.offset,
          limit: normalized.limit,
        };
      })
      .addCase(getAllBeamStockByCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(validateBeamStockExcel.pending, (state) => {
        state.validating = true;
      })
      .addCase(validateBeamStockExcel.fulfilled, (state, action) => {
        state.validating = false;
        state.validatedData = action.payload;
      })
      .addCase(validateBeamStockExcel.rejected, (state, action) => {
        state.validating = false;
        state.error = action.payload as string;
      })
      .addCase(uploadBulkBeamStock.pending, (state) => {
        state.uploading = true;
      })
      .addCase(uploadBulkBeamStock.fulfilled, (state) => {
        state.uploading = false;
        state.validatedData = null;
      })
      .addCase(uploadBulkBeamStock.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteBeamStock.fulfilled, (state, action: PayloadAction<number>) => {
        state.stockList = state.stockList.filter((item) => item.id !== action.payload);
      });
  },
});

export const { clearValidatedBeamStock } = beamStockSlice.actions;
export default beamStockSlice.reducer;
