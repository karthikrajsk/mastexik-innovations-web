import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface AttendanceIncentiveSlabItem {
  id?: number;
  workingHours: number;
  monthType: 'FEB' | 'DAYS_30' | 'DAYS_31';
  month?: string | null;
  minDays: number;
  maxDays?: number | null;
  revisedDailySalary?: number;
  incentiveAmount: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MonthlyGroupedSlabItem {
  id: number;
  month: string;
  data: AttendanceIncentiveSlabItem[];
}

export interface SlabPreviewItem {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  month: string;
  monthType: string;
  workingHours: number;
  workedDays: number;
  matchedSlabId?: number | null;
  matchedSlabLabel: string;
  calculatedIncentiveAmount: number;
  revisedDailySalary: number;
}

interface AttendanceIncentiveSlabState {
  loading: boolean;
  slabList: AttendanceIncentiveSlabItem[];
  groupedSlabList: MonthlyGroupedSlabItem[];
  previewList: SlabPreviewItem[];
}

const initialState: AttendanceIncentiveSlabState = {
  loading: false,
  slabList: [],
  groupedSlabList: [],
  previewList: [],
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const fetchAllSlabs = createAsyncThunk(
  'attendanceIncentiveSlab/fetchAll',
  async (activeOnly: boolean = true, thunkAPI) => {
    try {
      const response = await apiService.get(`/attendance-incentive-slabs?activeOnly=${activeOnly}`);
      return response?.data || response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(resolveApiErrorMessage(error, "Failed to fetch attendance incentive slabs"));
    }
  }
);

export const fetchGroupedSlabs = createAsyncThunk(
  'attendanceIncentiveSlab/fetchGrouped',
  async (activeOnly: boolean = true, thunkAPI) => {
    try {
      const response = await apiService.get(`/attendance-incentive-slabs/grouped?activeOnly=${activeOnly}`);
      return response?.data || response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(resolveApiErrorMessage(error, "Failed to fetch grouped attendance incentive slabs"));
    }
  }
);

export const copyMonthSlabs = createAsyncThunk(
  'attendanceIncentiveSlab/copyMonth',
  async ({ sourceMonth, targetMonth, userName }: { sourceMonth: string; targetMonth: string; userName?: string }, thunkAPI) => {
    try {
      const response = await apiService.post(`/attendance-incentive-slabs/copy-month?sourceMonth=${encodeURIComponent(sourceMonth)}&targetMonth=${encodeURIComponent(targetMonth)}&userName=${encodeURIComponent(userName || 'ADMIN')}`, {});
      toast.success(`Copied slab rules from ${sourceMonth} to ${targetMonth}`);
      thunkAPI.dispatch(fetchGroupedSlabs(true));
      return response?.data || response;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to copy month slabs"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createSlab = createAsyncThunk(
  'attendanceIncentiveSlab/create',
  async (data: AttendanceIncentiveSlabItem, thunkAPI) => {
    try {
      const response = await apiService.post('/attendance-incentive-slabs', data);
      toast.success("Slab master entry created successfully");
      thunkAPI.dispatch(fetchGroupedSlabs(true));
      return response?.data || response;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to create slab master entry"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateSlab = createAsyncThunk(
  'attendanceIncentiveSlab/update',
  async ({ id, data }: { id: number; data: AttendanceIncentiveSlabItem }, thunkAPI) => {
    try {
      const response = await apiService.put(`/attendance-incentive-slabs/${id}`, data);
      toast.success("Slab master entry updated successfully");
      thunkAPI.dispatch(fetchGroupedSlabs(true));
      return response?.data || response;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to update slab master entry"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteSlab = createAsyncThunk(
  'attendanceIncentiveSlab/delete',
  async (id: number, thunkAPI) => {
    try {
      await apiService.delete(`/attendance-incentive-slabs/${id}`);
      toast.success("Slab master entry deleted");
      thunkAPI.dispatch(fetchGroupedSlabs(true));
      return id;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to delete slab master entry"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchSlabPreview = createAsyncThunk(
  'attendanceIncentiveSlab/fetchPreview',
  async ({ month, designation }: { month: string; designation?: string }, thunkAPI) => {
    try {
      const params = new URLSearchParams({ month });
      if (designation && designation !== 'ALL') {
        params.append('designation', designation);
      }
      const response = await apiService.get(`/attendance-incentive/preview?${params.toString()}`);
      return response?.data || response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(resolveApiErrorMessage(error, "Failed to fetch slab calculation preview"));
    }
  }
);

const attendanceIncentiveSlabSlice = createSlice({
  name: 'attendanceIncentiveSlab',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSlabs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllSlabs.fulfilled, (state, action) => {
        state.loading = false;
        state.slabList = action.payload;
      })
      .addCase(fetchAllSlabs.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchGroupedSlabs.fulfilled, (state, action) => {
        state.groupedSlabList = action.payload;
      })
      .addCase(createSlab.fulfilled, (state, action) => {
        state.slabList.unshift(action.payload);
      })
      .addCase(updateSlab.fulfilled, (state, action) => {
        const index = state.slabList.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.slabList[index] = action.payload;
        }
      })
      .addCase(deleteSlab.fulfilled, (state, action) => {
        state.slabList = state.slabList.filter(s => s.id !== action.payload);
      })
      .addCase(fetchSlabPreview.fulfilled, (state, action) => {
        state.previewList = action.payload;
      });
  },
});

export default attendanceIncentiveSlabSlice.reducer;

