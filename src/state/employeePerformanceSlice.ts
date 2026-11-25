import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import employeePerformanceService from "@/services/employeePerformanceService";

export interface PromotionIncrement {
  id: number;
  employeeId: string | number;
  currentDesignation: string;
  newDesignation: string;
  currentSalary: string | number;
  incrementAmount: string | number;
  newSalary: string | number;
  effectiveDate: string;
  remarks: string;
}

export interface EmployeePerformance {
  id: number;
  employeeId: string | number;
  reviewPeriod: string;
  rating: number;
  performanceComments: string;
  reviewerName: string;
  reviewDate: string;
}

export interface EmployeeInsurance {
  id: number;
  employeeId: string | number;
  insuranceProvider: string;
  policyNumber: string;
  coverageAmount: string | number;
  startDate: string;
  endDate: string;
  nominee: string;
}

interface EmployeePerformanceState {
  loading: boolean;
  promotionList: PromotionIncrement[];
  performanceList: EmployeePerformance[];
  insuranceList: EmployeeInsurance[];
}

const initialState: EmployeePerformanceState = {
  loading: false,
  promotionList: [],
  performanceList: [],
  insuranceList: [],
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

// Promotions
export const getAllPromotions = createAsyncThunk("employeePerformance/getPromotions", async (_, thunkAPI) => {
  try {
    return await employeePerformanceService.getAllPromotions();
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createPromotion = createAsyncThunk("employeePerformance/createPromotion", async (data: any, thunkAPI) => {
  try {
    const res = await employeePerformanceService.createPromotion(data);
    toast.success("Promotion created successfully");
    return res;
  } catch (error: any) {
    toast.error(resolveApiErrorMessage(error, "Error creating promotion"));
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updatePromotion = createAsyncThunk("employeePerformance/updatePromotion", async ({ id, data }: { id: number; data: any }, thunkAPI) => {
  try {
    const res = await employeePerformanceService.updatePromotion(id, data);
    toast.success("Promotion updated successfully");
    return res;
  } catch (error: any) {
    toast.error(resolveApiErrorMessage(error, "Error updating promotion"));
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deletePromotion = createAsyncThunk("employeePerformance/deletePromotion", async (id: number, thunkAPI) => {
  try {
    await employeePerformanceService.deletePromotion(id);
    toast.success("Promotion deleted successfully");
    return id;
  } catch (error: any) {
    toast.error(resolveApiErrorMessage(error, "Error deleting promotion"));
    return thunkAPI.rejectWithValue(error.message);
  }
});

// Performance
export const getAllPerformance = createAsyncThunk("employeePerformance/getPerformance", async (_, thunkAPI) => {
  try {
    return await employeePerformanceService.getAllPerformance();
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createPerformance = createAsyncThunk("employeePerformance/createPerformance", async (data: any, thunkAPI) => {
  try {
    const res = await employeePerformanceService.createPerformance(data);
    toast.success("Performance review created successfully");
    return res;
  } catch (error: any) {
    toast.error(resolveApiErrorMessage(error, "Error creating performance review"));
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updatePerformance = createAsyncThunk("employeePerformance/updatePerformance", async ({ id, data }: { id: number; data: any }, thunkAPI) => {
  try {
    const res = await employeePerformanceService.updatePerformance(id, data);
    toast.success("Performance review updated successfully");
    return res;
  } catch (error: any) {
    toast.error(resolveApiErrorMessage(error, "Error updating performance review"));
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deletePerformance = createAsyncThunk("employeePerformance/deletePerformance", async (id: number, thunkAPI) => {
  try {
    await employeePerformanceService.deletePerformance(id);
    toast.success("Performance review deleted successfully");
    return id;
  } catch (error: any) {
    toast.error(resolveApiErrorMessage(error, "Error deleting performance review"));
    return thunkAPI.rejectWithValue(error.message);
  }
});

// Insurance
export const getAllInsurance = createAsyncThunk("employeePerformance/getInsurance", async (_, thunkAPI) => {
  try {
    return await employeePerformanceService.getAllInsurance();
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createInsurance = createAsyncThunk("employeePerformance/createInsurance", async (data: any, thunkAPI) => {
  try {
    const res = await employeePerformanceService.createInsurance(data);
    toast.success("Insurance policy created successfully");
    return res;
  } catch (error: any) {
    toast.error(resolveApiErrorMessage(error, "Error creating insurance policy"));
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updateInsurance = createAsyncThunk("employeePerformance/updateInsurance", async ({ id, data }: { id: number; data: any }, thunkAPI) => {
  try {
    const res = await employeePerformanceService.updateInsurance(id, data);
    toast.success("Insurance policy updated successfully");
    return res;
  } catch (error: any) {
    toast.error(resolveApiErrorMessage(error, "Error updating insurance policy"));
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deleteInsurance = createAsyncThunk("employeePerformance/deleteInsurance", async (id: number, thunkAPI) => {
  try {
    await employeePerformanceService.deleteInsurance(id);
    toast.success("Insurance policy deleted successfully");
    return id;
  } catch (error: any) {
    toast.error(resolveApiErrorMessage(error, "Error deleting insurance policy"));
    return thunkAPI.rejectWithValue(error.message);
  }
});

const employeePerformanceSlice = createSlice({
  name: "employeePerformance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Promotions
      .addCase(getAllPromotions.pending, (state) => { state.loading = true; })
      .addCase(getAllPromotions.fulfilled, (state, action) => { state.loading = false; state.promotionList = action.payload.data || []; })
      .addCase(getAllPromotions.rejected, (state) => { state.loading = false; })
      .addCase(createPromotion.fulfilled, (state, action) => { state.promotionList.unshift(action.payload.data); })
      .addCase(updatePromotion.fulfilled, (state, action) => {
        const index = state.promotionList.findIndex((p) => p.id === action.payload.data.id);
        if (index !== -1) state.promotionList[index] = action.payload.data;
      })
      .addCase(deletePromotion.fulfilled, (state, action) => {
        state.promotionList = state.promotionList.filter((p) => p.id !== action.payload);
      })
      // Performance
      .addCase(getAllPerformance.pending, (state) => { state.loading = true; })
      .addCase(getAllPerformance.fulfilled, (state, action) => { state.loading = false; state.performanceList = action.payload.data || []; })
      .addCase(getAllPerformance.rejected, (state) => { state.loading = false; })
      .addCase(createPerformance.fulfilled, (state, action) => { state.performanceList.unshift(action.payload.data); })
      .addCase(updatePerformance.fulfilled, (state, action) => {
        const index = state.performanceList.findIndex((p) => p.id === action.payload.data.id);
        if (index !== -1) state.performanceList[index] = action.payload.data;
      })
      .addCase(deletePerformance.fulfilled, (state, action) => {
        state.performanceList = state.performanceList.filter((p) => p.id !== action.payload);
      })
      // Insurance
      .addCase(getAllInsurance.pending, (state) => { state.loading = true; })
      .addCase(getAllInsurance.fulfilled, (state, action) => { state.loading = false; state.insuranceList = action.payload.data || []; })
      .addCase(getAllInsurance.rejected, (state) => { state.loading = false; })
      .addCase(createInsurance.fulfilled, (state, action) => { state.insuranceList.unshift(action.payload.data); })
      .addCase(updateInsurance.fulfilled, (state, action) => {
        const index = state.insuranceList.findIndex((p) => p.id === action.payload.data.id);
        if (index !== -1) state.insuranceList[index] = action.payload.data;
      })
      .addCase(deleteInsurance.fulfilled, (state, action) => {
        state.insuranceList = state.insuranceList.filter((p) => p.id !== action.payload);
      });
  },
});

export default employeePerformanceSlice.reducer;
