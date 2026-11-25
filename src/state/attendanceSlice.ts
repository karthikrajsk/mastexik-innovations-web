import attendanceService, { Attendance,  AttendanceParams } from "@/services/attendanceService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export type { Attendance };

interface AttendanceState {
  loading: boolean;
  error: string | null;
  attendanceList: Attendance[];
  projections: any[];
  salaryRecords: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
  };
}

const initialState: AttendanceState = {
  loading: false,
  error: null,
  attendanceList: [],
  projections: [],
  salaryRecords: [],
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    next: false,
    prev: false,
  },
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;
  if (typeof responseData === "string") return responseData;
  if (responseData?.message) return responseData.message;
  return error?.message || fallback;
};

export const getAllAttendances = createAsyncThunk(
  'attendance/getAll',
  async (params: AttendanceParams = {}, thunkAPI) => {
    try {
      const response = await attendanceService.getAll(params);
      
      // Handle paginated response structure - same pattern as Purchase Order
      const paginationData = response?.data;
      
      const rawArray = Array.isArray(paginationData?.data)
        ? paginationData.data
        : Array.isArray(paginationData)
        ? paginationData
        : [];

      return {
        data: (rawArray || []).map((att: any) => ({
          ...att,
          overtimeHours: att.overtimeHours ?? att.overtime_hours ?? att.ot_hours ?? '',
          overtime_hours: att.overtime_hours ?? att.overtimeHours ?? att.ot_hours ?? '',
        })),
        pagination: {
          total: paginationData?.total || rawArray.length || 0,
          limit: paginationData?.limit ?? (params.fetchAll ? 10000 : params.limit ?? 10),
          offset: paginationData?.offset ?? (params.fetchAll ? 0 : params.offset ?? 0),
          next: paginationData?.next ?? false,
          prev: paginationData?.prev ?? false,
        },
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createAttendance = createAsyncThunk(
  'attendance/create',
  async (params: Omit<Attendance, 'id'>, thunkAPI) => {
    try {
      const response = await attendanceService.create(params);
      if (response?.status === 'success' || response?.id) {
        toast.success(response?.message || 'Attendance record created');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to create attendance');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to create attendance");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateAttendance = createAsyncThunk(
  'attendance/update',
  async (params: Attendance, thunkAPI) => {
    try {
      const response = await attendanceService.update(params.id, params);
      if (response?.status === 'success' || response?.id) {
        toast.success(response?.message || 'Attendance record updated');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to update attendance');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to update attendance");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteAttendance = createAsyncThunk(
  'attendance/delete',
  async (id: number, thunkAPI) => {
    try {
      const response = await attendanceService.delete(id);
      if (response?.status === 'success') {
        toast.success(response?.message || 'Attendance record deleted');
        return id;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to delete attendance');
    } catch (error: any) {
      toast.error(error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const getAttendanceSalary = createAsyncThunk(
  'attendance/getSalary',
  async (params: { month: string; year: string }, thunkAPI) => {
    try {
      const response = await attendanceService.getSalary(params.month, params.year);
      return response?.data || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const getAttendanceProjected = createAsyncThunk(
  'attendance/getProjected',
  async (params: { month: string; year: string }, thunkAPI) => {
    try {
      const response = await attendanceService.getProjected(params.month, params.year);
      return response?.data || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createAttendancesBulk = createAsyncThunk(
  'attendance/createBulk',
  async (records: any[], thunkAPI) => {
    try {
      // Direct POST to /attendance/bulk
      const apiService = (await import("@/services/ApiService")).default;
      const response = await apiService.post('/attendance/bulk', records);
      if (response?.status === 'success' || Array.isArray(response) || response?.data) {
        const data = response?.data || (Array.isArray(response) ? response : []);
        toast.success(`${data.length} attendance records imported successfully`);
        return data;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to create attendance records');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to create attendance records");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const attendanceSlice = createSlice({

  name: 'attendance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllAttendances.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllAttendances.fulfilled, (state, action) => {
        state.loading = false;
        state.attendanceList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllAttendances.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAttendanceSalary.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAttendanceSalary.fulfilled, (state, action) => {
        state.loading = false;
        state.salaryRecords = action.payload;
      })
      .addCase(getAttendanceSalary.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAttendanceProjected.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAttendanceProjected.fulfilled, (state, action) => {
        state.loading = false;
        state.projections = action.payload;
      })
      .addCase(getAttendanceProjected.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAttendance.fulfilled, (state, action: PayloadAction<Attendance>) => {
        state.attendanceList.unshift(action.payload);
      })
      .addCase(updateAttendance.fulfilled, (state, action: PayloadAction<Attendance>) => {
        const index = state.attendanceList.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.attendanceList[index] = {
            ...state.attendanceList[index],
            ...action.payload,
            overtimeHours: action.payload.overtimeHours ?? (action.payload as any).overtime_hours ?? state.attendanceList[index].overtimeHours,
          };
        }
      })
      .addCase(deleteAttendance.fulfilled, (state, action: PayloadAction<number>) => {
        state.attendanceList = state.attendanceList.filter(a => a.id !== action.payload);
      })
      .addCase(createAttendancesBulk.fulfilled, (state, action: PayloadAction<Attendance[]>) => {
        state.attendanceList = [...(action.payload || []), ...state.attendanceList];
      });
  },
});

export default attendanceSlice.reducer;
