import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface AllowanceAdvance {
  employeeName: string;
  employeeCode: string;
  id?: number;
  employeeId: number;
  type: 'Allowance' | 'Salary Advance';
  amount: number;
  date: string;
  month: string;
  voucherNo?: string;
  voucherDate?: string;
  paymentDate?: string;
  eligibleForAdvance?: boolean;
  reason?: string;
}

interface AllowanceAdvanceState {
  loading: boolean;
  allowanceAdvanceList: AllowanceAdvance[];
  allAllowanceAdvanceList: AllowanceAdvance[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
  };
}

const initialState: AllowanceAdvanceState = {
  loading: false,
  allowanceAdvanceList: [],
  allAllowanceAdvanceList: [],
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const saveAllowanceAdvance = createAsyncThunk('allowanceAdvance/save', async (params: { employeeId: number, month: string, data: AllowanceAdvance[] }, thunkAPI) => {
  try {
    const res = await apiService.post(`/allowance-advance?employeeId=${params.employeeId}&month=${params.month}`, params.data);
    toast.success("Allowance / Advance recorded");
    return res.data || res;
  } catch (e: any) { toast.error(resolveApiErrorMessage(e, "Error")); return thunkAPI.rejectWithValue(e.message); }
});

export const updateAllowanceAdvance = createAsyncThunk('allowanceAdvance/update', async (params: { employeeId: number, month: string, data: AllowanceAdvance[] }, thunkAPI) => {
  try {
    const res = await apiService.put(`/allowance-advance?employeeId=${params.employeeId}&month=${params.month}`, params.data);
    toast.success("Allowance / Advance updated");
    return res.data || res;
  } catch (e: any) { toast.error(resolveApiErrorMessage(e, "Error")); return thunkAPI.rejectWithValue(e.message); }
});

export const getAllowanceAdvance = createAsyncThunk('allowanceAdvance/get', async (params: { employeeId: number, month: string }, thunkAPI) => {
  try {
    const response = await apiService.get(`/allowance-advance?employeeId=${params.employeeId}&month=${params.month}`);
    return response?.data || response || [];
  } catch (error: any) { return thunkAPI.rejectWithValue(error.message); }
});

export const getAllAllowanceAdvance = createAsyncThunk('allowanceAdvance/getAll', async (params: { limit?: number; offset?: number; fetchAll?: boolean } = {}, thunkAPI) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.fetchAll) {
      queryParams.append('limit', '10000');
      queryParams.append('offset', '0');
    } else {
      if (params.limit !== undefined) {
        queryParams.append('limit', String(params.limit));
      }
      if (params.offset !== undefined) {
        queryParams.append('offset', String(params.offset));
      }
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/allowance-advance?${queryString}` : '/allowance-advance';
    
    const response = await apiService.get(url);
    
    // Handle both old array response and new paginated response structure
    const paginationData = response?.data;
    
    // Check if response has paginated structure
    if (paginationData && typeof paginationData === 'object' && 'data' in paginationData) {
      // New paginated response structure
      const rawArray = Array.isArray(paginationData?.data)
        ? paginationData.data
        : [];

      return {
        data: rawArray,
        pagination: {
          total: paginationData?.total || rawArray.length || 0,
          limit: paginationData?.limit ?? params.limit ?? 10,
          offset: paginationData?.offset ?? params.offset ?? 0,
          next: paginationData?.next ?? false,
          prev: paginationData?.prev ?? false,
        },
      };
    } else {
      // Old array response structure (backward compatibility)
      const rawArray = Array.isArray(paginationData) ? paginationData : [];
      return {
        data: rawArray,
        pagination: {
          total: rawArray.length,
          limit: params.limit ?? 10,
          offset: params.offset ?? 0,
          next: false,
          prev: false,
        },
      };
    }
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deleteAllowanceAdvance = createAsyncThunk('allowanceAdvance/delete', async (id: number, thunkAPI) => {
  try {
    await apiService.delete(`/allowance-advance/${id}`);
    toast.success("Allowance / Advance deleted successfully");
    return id;
  } catch (e: any) { toast.error(resolveApiErrorMessage(e, "Error deleting")); return thunkAPI.rejectWithValue(e.message); }
});

const allowanceAdvanceSlice = createSlice({
  name: 'allowanceAdvance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllowanceAdvance.fulfilled, (state, action) => { state.allowanceAdvanceList = action.payload; })
      .addCase(getAllAllowanceAdvance.fulfilled, (state, action) => { 
        state.allAllowanceAdvanceList = action.payload.data; 
        state.pagination = action.payload.pagination;
        state.loading = false; 
      })
      .addCase(getAllAllowanceAdvance.pending, (state) => { state.loading = true; })
      .addCase(getAllAllowanceAdvance.rejected, (state) => { state.loading = false; })
      .addCase(deleteAllowanceAdvance.fulfilled, (state, action) => { 
        state.allAllowanceAdvanceList = state.allAllowanceAdvanceList.filter(item => item.id !== action.payload); 
      });
  },
});

export default allowanceAdvanceSlice.reducer;
