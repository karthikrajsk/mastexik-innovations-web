import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

export type ShiftType = 'Fixed' | 'Rotation';

export interface ShiftTimingDetail {
  id?: number | string;
  shiftMasterId?: number | string;
  slotNumber: number;
  inTime: string; // HH:mm
  outTime: string; // HH:mm
  isNextDay: boolean;
  breakDuration: number; // minutes
  breakStartTime?: string;
  breakEndTime?: string;
  totalBreakHours?: number;
  workingHours: number; // decimal hours e.g. 7.50
}

export interface ShiftMaster {
  id: number | string;
  shiftCode?: string | null;
  shiftName: string;
  shiftType: ShiftType;
  description?: string;
  activeFlag: boolean;
  timingDetails: ShiftTimingDetail[];
  totalWorkingHours: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShiftState {
  loading: boolean;
  error: string | null;
  shiftList: ShiftMaster[];
  currentShift: ShiftMaster | null;
  checking: boolean;
  pagination: PaginationState;
}

const initialState: ShiftState = {
  loading: false,
  error: null,
  shiftList: [],
  currentShift: null,
  checking: false,
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    next: false,
    prev: false
  }
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;
  if (typeof responseData === "string") return responseData;
  if (responseData?.message) return responseData.message;
  if (responseData?.error) return responseData.error;
  return error?.message || fallback;
};

/**
 * Tries primary endpoint (/shift) and falls back to plural (/shifts) if not found
 */
async function callApiEndpoint<T = any>(
  method: 'get' | 'post' | 'put' | 'delete',
  primaryPath: string,
  fallbackPath: string,
  data?: any,
  params?: any
): Promise<T> {
  try {
    if (method === 'get') {
      return await apiService.get(primaryPath, params);
    } else if (method === 'post') {
      return await apiService.post(primaryPath, data);
    } else if (method === 'put') {
      return await apiService.put(primaryPath, data);
    } else {
      return await apiService.delete(primaryPath);
    }
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = String(err?.message || '');
    if (status === 404 || status === 500 || msg.includes('NoHandlerFoundException')) {
      if (method === 'get') {
        return await apiService.get(fallbackPath, params);
      } else if (method === 'post') {
        return await apiService.post(fallbackPath, data);
      } else if (method === 'put') {
        return await apiService.put(fallbackPath, data);
      } else {
        return await apiService.delete(fallbackPath);
      }
    }
    throw err;
  }
}

// ==========================================
// ASYNC THUNKS (DYNAMIC REAL DATABASE API)
// ==========================================

export const getAllShifts = createAsyncThunk(
  'shift/getAllShifts',
  async (
    params: {
      limit?: number;
      offset?: number;
      fetchAll?: boolean;
      search?: string;
      shiftType?: string;
      activeFlag?: boolean;
    } = {},
    thunkAPI
  ) => {
    try {
      const { limit = 10, offset = 0, fetchAll = true } = params;
      const queryParams = new URLSearchParams();

      if (fetchAll) {
        queryParams.append('limit', '10000');
        queryParams.append('offset', '0');
      } else {
        if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
        if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
      }

      if (params.search) queryParams.append('search', params.search);
      if (params.shiftType) queryParams.append('shiftType', params.shiftType);
      if (params.activeFlag !== undefined) queryParams.append('activeFlag', String(params.activeFlag));

      const queryString = queryParams.toString();
      const primaryUrl = queryString ? `/shift?${queryString}` : `/shift`;
      const fallbackUrl = queryString ? `/shifts?${queryString}` : `/shifts`;

      const response = await callApiEndpoint('get', primaryUrl, fallbackUrl);

      const responseData = response?.data;
      let rawData: ShiftMaster[] = [];

      if (Array.isArray(responseData?.data)) {
        rawData = responseData.data;
      } else if (Array.isArray(responseData)) {
        rawData = responseData;
      } else if (Array.isArray(response)) {
        rawData = response;
      } else if (Array.isArray(responseData?.rows)) {
        rawData = responseData.rows;
      }

      const total =
        responseData?.total ??
        responseData?.data?.total ??
        rawData.length;

      const resolvedLimit =
        responseData?.limit ??
        responseData?.data?.limit ??
        (fetchAll ? 10000 : limit);

      const resolvedOffset =
        responseData?.offset ??
        responseData?.data?.offset ??
        (fetchAll ? 0 : offset);

      const pagination: PaginationState = {
        total,
        limit: resolvedLimit,
        offset: resolvedOffset,
        next: resolvedOffset + resolvedLimit < total,
        prev: resolvedOffset > 0
      };

      return { data: rawData, pagination };
    } catch (err: any) {
      const message = resolveApiErrorMessage(err, 'Failed to fetch shifts from database');
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createShift = createAsyncThunk(
  'shift/createShift',
  async (payload: Omit<ShiftMaster, 'id'>, thunkAPI) => {
    try {
      const response = await callApiEndpoint('post', '/shift', '/shifts', payload);
      const data = response?.data?.data || response?.data || response;
      toast.success('Shift created successfully!');
      return data;
    } catch (err: any) {
      const message = resolveApiErrorMessage(err, 'Failed to create shift');
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateShift = createAsyncThunk(
  'shift/updateShift',
  async ({ id, data }: { id: number | string; data: Partial<ShiftMaster> }, thunkAPI) => {
    try {
      const response = await callApiEndpoint('put', `/shift/${id}`, `/shifts/${id}`, data);
      const updated = response?.data?.data || response?.data || response;
      toast.success('Shift updated successfully!');
      return updated;
    } catch (err: any) {
      const message = resolveApiErrorMessage(err, 'Failed to update shift');
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteShift = createAsyncThunk(
  'shift/deleteShift',
  async (id: number | string, thunkAPI) => {
    try {
      await callApiEndpoint('delete', `/shift/${id}`, `/shifts/${id}`);
      toast.success('Shift deleted successfully!');
      return id;
    } catch (err: any) {
      const message = resolveApiErrorMessage(err, 'Failed to delete shift');
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const toggleShiftStatus = createAsyncThunk(
  'shift/toggleShiftStatus',
  async ({ id, activeFlag }: { id: number | string; activeFlag: boolean }, thunkAPI) => {
    try {
      await callApiEndpoint('put', `/shift/${id}/status`, `/shifts/${id}/status`, { activeFlag });
      toast.success(`Shift status changed to ${activeFlag ? 'Active' : 'Inactive'}`);
      return { id, activeFlag };
    } catch (err: any) {
      const message = resolveApiErrorMessage(err, 'Failed to update status');
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ==========================================
// REDUX SLICE
// ==========================================

export const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    setCurrentShift: (state, action: PayloadAction<ShiftMaster | null>) => {
      state.currentShift = action.payload;
    },
    clearShiftError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // GET ALL SHIFTS
    builder
      .addCase(getAllShifts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllShifts.fulfilled, (state, action) => {
        state.loading = false;
        state.shiftList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllShifts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch shifts';
      });

    // CREATE SHIFT
    builder
      .addCase(createShift.pending, (state) => {
        state.loading = true;
      })
      .addCase(createShift.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.id) {
          state.shiftList.unshift(action.payload as ShiftMaster);
        }
      })
      .addCase(createShift.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to create shift';
      });

    // UPDATE SHIFT
    builder
      .addCase(updateShift.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateShift.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload as ShiftMaster;
        const idx = state.shiftList.findIndex(s => String(s.id) === String(updated?.id));
        if (idx !== -1) {
          state.shiftList[idx] = updated;
        }
      })
      .addCase(updateShift.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to update shift';
      });

    // DELETE SHIFT
    builder
      .addCase(deleteShift.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteShift.fulfilled, (state, action) => {
        state.loading = false;
        state.shiftList = state.shiftList.filter(s => String(s.id) !== String(action.payload));
      })
      .addCase(deleteShift.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to delete shift';
      });

    // TOGGLE STATUS
    builder
      .addCase(toggleShiftStatus.fulfilled, (state, action) => {
        const item = state.shiftList.find(s => String(s.id) === String(action.payload.id));
        if (item) {
          item.activeFlag = action.payload.activeFlag;
        }
      });
  }
});

export const { setCurrentShift, clearShiftError } = shiftSlice.actions;
export default shiftSlice.reducer;
