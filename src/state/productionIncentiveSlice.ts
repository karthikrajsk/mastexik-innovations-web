import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ProductionIncentiveItem {
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

interface ProductionIncentiveState {
  loading: boolean;
  incentiveList: ProductionIncentiveItem[];
}

const initialState: ProductionIncentiveState = {
  loading: false,
  incentiveList: [],
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const fetchProductionIncentivesByMonth = createAsyncThunk(
  'productionIncentive/fetchByMonth',
  async (month: string, thunkAPI) => {
    try {
      const response = await apiService.get(`/production-incentive?month=${month}`);
      return response?.data || response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(resolveApiErrorMessage(error, "Failed to fetch production incentives"));
    }
  }
);

export const createProductionIncentive = createAsyncThunk(
  'productionIncentive/create',
  async (data: ProductionIncentiveItem, thunkAPI) => {
    try {
      const response = await apiService.post('/production-incentive', data);
      toast.success("Production incentive saved successfully");
      return response?.data || response;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to save production incentive"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const bulkCreateProductionIncentive = createAsyncThunk(
  'productionIncentive/bulkCreate',
  async (dataList: ProductionIncentiveItem[], thunkAPI) => {
    try {
      const response = await apiService.post('/production-incentive/bulk', dataList);
      toast.success(`${dataList.length} Production incentive(s) saved successfully`);
      return response?.data || response;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to save bulk production incentives"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deleteProductionIncentive = createAsyncThunk(
  'productionIncentive/delete',
  async (id: number, thunkAPI) => {
    try {
      await apiService.delete(`/production-incentive/${id}`);
      toast.success("Production incentive deleted");
      return id;
    } catch (error: any) {
      toast.error(resolveApiErrorMessage(error, "Failed to delete production incentive"));
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const productionIncentiveSlice = createSlice({
  name: 'productionIncentive',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductionIncentivesByMonth.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductionIncentivesByMonth.fulfilled, (state, action) => {
        state.loading = false;
        state.incentiveList = action.payload;
      })
      .addCase(fetchProductionIncentivesByMonth.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createProductionIncentive.fulfilled, (state, action) => {
        state.incentiveList.unshift(action.payload);
      })
      .addCase(bulkCreateProductionIncentive.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.incentiveList = [...action.payload, ...state.incentiveList];
        }
      })
      .addCase(deleteProductionIncentive.fulfilled, (state, action) => {
        state.incentiveList = state.incentiveList.filter(item => item.id !== action.payload);
      });
  },
});

export default productionIncentiveSlice.reducer;
