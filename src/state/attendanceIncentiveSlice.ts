import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface AttendanceIncentiveItem {
  id?: number;
  employeeId?: number;
  employee?: { id: number; employeeCode?: string };
  employeeCode: string;
  employeeName: string;
  month: string; // "YYYY-MM"
  incentiveDate?: string;
  incentiveType: 'Monthly' | 'Daily' | 'Fixed';
  amount: number;
  dailyRate?: number;
  remarks?: string;
}

interface AttendanceIncentiveState {
  loading: boolean;
  incentiveList: AttendanceIncentiveItem[];
  allIncentiveList: AttendanceIncentiveItem[];
}

const initialState: AttendanceIncentiveState = {
  loading: false,
  incentiveList: [],
  allIncentiveList: [],
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const fetchIncentivesByMonth = createAsyncThunk(
  'attendanceIncentive/fetchByMonth',
  async (month: string, thunkAPI) => {
    try {
      const response = await apiService.get(`/attendance-incentive?month=${month}`);
      return response?.data || response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(resolveApiErrorMessage(error, "Failed to fetch attendance incentives"));
    }
  }
);

export const createAttendanceIncentive = createAsyncThunk(
  'attendanceIncentive/create',
  async (data: AttendanceIncentiveItem, thunkAPI) => {
    try {
      const response = await apiService.post('/attendance-incentive', data);
      toast.success("Attendance incentive saved successfully");
      return response?.data || response;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to save attendance incentive"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const bulkCreateAttendanceIncentive = createAsyncThunk(
  'attendanceIncentive/bulkCreate',
  async (dataList: AttendanceIncentiveItem[], thunkAPI) => {
    try {
      const response = await apiService.post('/attendance-incentive/bulk', dataList);
      toast.success(`${dataList.length} Attendance incentive(s) saved successfully`);
      return response?.data || response;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to save bulk attendance incentives"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteAttendanceIncentive = createAsyncThunk(
  'attendanceIncentive/delete',
  async (id: number, thunkAPI) => {
    try {
      await apiService.delete(`/attendance-incentive/${id}`);
      toast.success("Attendance incentive deleted");
      return id;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to delete attendance incentive"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const attendanceIncentiveSlice = createSlice({
  name: 'attendanceIncentive',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncentivesByMonth.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIncentivesByMonth.fulfilled, (state, action) => {
        state.loading = false;
        state.incentiveList = action.payload;
      })
      .addCase(fetchIncentivesByMonth.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createAttendanceIncentive.fulfilled, (state, action) => {
        state.incentiveList.unshift(action.payload);
      })
      .addCase(bulkCreateAttendanceIncentive.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.incentiveList = [...action.payload, ...state.incentiveList];
        }
      })
      .addCase(deleteAttendanceIncentive.fulfilled, (state, action) => {
        state.incentiveList = state.incentiveList.filter(item => item.id !== action.payload);
      });
  },
});

export default attendanceIncentiveSlice.reducer;
