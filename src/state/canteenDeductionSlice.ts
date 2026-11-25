import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface CanteenDeductionItem {
  id?: number;
  employeeId?: number;
  employee?: { id: number; employeeCode?: string };
  employeeCode: string;
  employeeName: string;
  month: string; // "YYYY-MM"
  effectiveDate?: string;
  canteenAmount: number; // e.g. 5000
  dailyDeductionRate: number; // e.g. 166.67
  remarks?: string;
}

interface CanteenDeductionState {
  loading: boolean;
  canteenList: CanteenDeductionItem[];
}

const initialState: CanteenDeductionState = {
  loading: false,
  canteenList: [],
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const fetchCanteenDeductionsByMonth = createAsyncThunk(
  'canteenDeduction/fetchByMonth',
  async (month: string, thunkAPI) => {
    try {
      const response = await apiService.get(`/canteen-deduction?month=${month}`);
      return response?.data || response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(resolveApiErrorMessage(error, "Failed to fetch canteen deductions"));
    }
  }
);

export const createCanteenDeduction = createAsyncThunk(
  'canteenDeduction/create',
  async (data: CanteenDeductionItem, thunkAPI) => {
    try {
      const response = await apiService.post('/canteen-deduction', data);
      toast.success("Canteen deduction saved successfully");
      return response?.data || response;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to save canteen deduction"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const bulkCreateCanteenDeduction = createAsyncThunk(
  'canteenDeduction/bulkCreate',
  async (dataList: CanteenDeductionItem[], thunkAPI) => {
    try {
      const response = await apiService.post('/canteen-deduction/bulk', dataList);
      toast.success(`${dataList.length} Canteen deduction(s) saved successfully`);
      return response?.data || response;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to save bulk canteen deductions"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteCanteenDeduction = createAsyncThunk(
  'canteenDeduction/delete',
  async (id: number, thunkAPI) => {
    try {
      await apiService.delete(`/canteen-deduction/${id}`);
      toast.success("Canteen deduction deleted");
      return id;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to delete canteen deduction"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const canteenDeductionSlice = createSlice({
  name: 'canteenDeduction',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCanteenDeductionsByMonth.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCanteenDeductionsByMonth.fulfilled, (state, action) => {
        state.loading = false;
        state.canteenList = action.payload;
      })
      .addCase(fetchCanteenDeductionsByMonth.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createCanteenDeduction.fulfilled, (state, action) => {
        state.canteenList.unshift(action.payload);
      })
      .addCase(bulkCreateCanteenDeduction.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.canteenList = [...action.payload, ...state.canteenList];
        }
      })
      .addCase(deleteCanteenDeduction.fulfilled, (state, action) => {
        state.canteenList = state.canteenList.filter(item => item.id !== action.payload);
      });
  },
});

export default canteenDeductionSlice.reducer;
