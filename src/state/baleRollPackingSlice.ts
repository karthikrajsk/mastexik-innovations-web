import apiService from "@/services/ApiService";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface BaleRollPiece {
  id?: number;
  pieceNo: string;
  meters: number;
  yards: number; // derived client-side as meters * 1.094 if needed
  netWeight: number;
  avgWeight: number; // read-only from piece master, or computed if not provided
  grossWeight?: number; // editable, 3 decimals
}

export interface BaleRollPacking {
  id?: number;
  packingDate: string; // ISO date
  packingType: 'Roll' | 'Bale';
  orderType: 'Domestic' | 'Export';
  buyerId: number;
  buyerName?: string; // optional for UI display
  salesOrderId: number;
  salesOrderNo?: string; // optional for UI display
  fabricCodeId: number;
  fabricQuality?: string; // optional for UI display
  uomId: number; // Meters / Yards
  uomName?: string;
  warehouseId: number;
  warehouseName?: string;
  rollOrBaleNo?: string;
  items: BaleRollPiece[];
}

interface BaleRollPackingState {
  loading: boolean;
  error: string | null;
  list: BaleRollPacking[];
  saving: boolean;
}

const initialState: BaleRollPackingState = {
  loading: false,
  error: null,
  list: [],
  saving: false,
};

// Normalize API success responses across variants
// Treat payloads that contain an id or packingNo as success (matches backend's response shape)
const isOk = (res: any) =>
  res?.status === 'success' ||
  res?.status === 'Success' ||
  res?.status === true ||
  res?.ok === true ||
  res?.code === 200 ||
  res?.statusCode === 200 ||
  (res && typeof res === 'object' && (res.id != null || typeof res.packingNo === 'string' || typeof res.rollOrBaleNo === 'string'));

  
const resolveApiErrorMessage = (error: any, fallback: string) => {
    const responseData = error?.response?.data;
    const candidates: string[] = [];

    if (typeof responseData === "string") {
        candidates.push(responseData);
    } else if (responseData) {
        if (typeof responseData.message === "string") {
            candidates.push(responseData.message);
        }
        if (typeof responseData.error === "string") {
            candidates.push(responseData.error);
        }
        if (typeof responseData.data === "string") {
            candidates.push(responseData.data);
        }
        if (responseData.data && typeof responseData.data === "object") {
            if (typeof responseData.data.message === "string") {
                candidates.push(responseData.data.message);
            }
            if (typeof responseData.data.error === "string") {
                candidates.push(responseData.data.error);
            }
            if (Array.isArray(responseData.data.errors)) {
                responseData.data.errors.forEach((err: any) => {
                    if (typeof err === "string") {
                        candidates.push(err);
                    } else if (typeof err?.message === "string") {
                        candidates.push(err.message);
                    }
                });
            }
        }
        if (Array.isArray(responseData.errors)) {
            responseData.errors.forEach((err: any) => {
                if (typeof err === "string") {
                    candidates.push(err);
                } else if (typeof err?.message === "string") {
                    candidates.push(err.message);
                }
            });
        }
    }

    const candidate = candidates.find((msg) => typeof msg === "string" && msg.trim());
    return candidate || error?.message || fallback;
};


export const getAllBaleRollPackings = createAsyncThunk(
  'bale-roll-packing/getAll',
  async (_: any, thunkAPI) => {
    try {
      const res = await apiService.get('/bale-roll-packing');
      return res || [];
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to fetch');
    }
  }
);

export const getAllBaleRollPackingsByCompanyId = createAsyncThunk(
  'bale-roll-packing/getAllByCompanyId',
  async (companyId: number, thunkAPI) => {
    try {
      const res = await apiService.get(`/bale-roll-packing/company/${companyId}`);
      return res || [];
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to fetch');
    }
  }
);

export const createBaleRollPacking = createAsyncThunk(
  'bale-roll-packing/create',
  async (payload: BaleRollPacking, thunkAPI) => {
    try {
      const res = await apiService.post('/bale-roll-packing', payload);
      if (isOk(res)) {
        toast.success('Saved successfully');
        return res;
      }
      return thunkAPI.rejectWithValue(res?.message || 'Save failed');
    } catch (err: any) {
      
    const errorMessage = resolveApiErrorMessage(err, "Failed to create Bale Roll");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
      // return thunkAPI.rejectWithValue(err.message || 'Save failed');
    }
  }
);

export const updateBaleRollPacking = createAsyncThunk(
  'bale-roll-packing/update',
  async (payload: BaleRollPacking & { id: number }, thunkAPI) => {
    try {
      const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      const companyId = v ? Number(v) : undefined;
      const endpoint = companyId
        ? `/bale-roll-packing/company/${companyId}/${payload.id}`
        : `/bale-roll-packing/${payload.id}`;
      const res = await apiService.put(endpoint, payload);
      if (isOk(res)) {
        toast.success('Updated successfully');
        return res;
      }
      return thunkAPI.rejectWithValue(res?.message || 'Update failed');
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message || 'Update failed');
    }
  }
);

export const deleteBaleRollPacking = createAsyncThunk(
  'bale-roll-packing/delete',
  async (id: number, thunkAPI) => {
    try {
      const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      const companyId = v ? Number(v) : undefined;
      const endpoint = companyId
        ? `/bale-roll-packing/company/${companyId}/${id}`
        : `/bale-roll-packing/${id}`;
      await apiService.delete(endpoint);
      toast.success('Deleted successfully');
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message || 'Delete failed');
    }
  }
);

export const deleteBaleRollPackingByCompanyId = createAsyncThunk(
  'bale-roll-packing/deleteByCompanyId',
  async (params: { id: number; companyId: number }, thunkAPI) => {
    try {
      await apiService.delete(`/bale-roll-packing/company/${params.companyId}/${params.id}`);
      toast.success('Deleted successfully');
      return params.id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message || 'Delete failed');
    }
  }
);

const baleRollPackingSlice = createSlice({
  name: 'baleRollPacking',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllBaleRollPackings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBaleRollPackings.fulfilled, (state, action: PayloadAction<BaleRollPacking[]>) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(getAllBaleRollPackings.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createBaleRollPacking.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createBaleRollPacking.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createBaleRollPacking.rejected, (state, action: any) => {
        state.saving = false;
        state.error = action.payload;
      })

      .addCase(updateBaleRollPacking.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateBaleRollPacking.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateBaleRollPacking.rejected, (state, action: any) => {
        state.saving = false;
        state.error = action.payload;
      })

      .addCase(deleteBaleRollPacking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBaleRollPacking.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.list = state.list.filter((x) => x.id !== action.payload);
      })
      .addCase(deleteBaleRollPacking.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getAllBaleRollPackingsByCompanyId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBaleRollPackingsByCompanyId.fulfilled, (state, action: PayloadAction<BaleRollPacking[]>) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(getAllBaleRollPackingsByCompanyId.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteBaleRollPackingByCompanyId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBaleRollPackingByCompanyId.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.list = state.list.filter((x) => x.id !== action.payload);
      })
      .addCase(deleteBaleRollPackingByCompanyId.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default baleRollPackingSlice.reducer;