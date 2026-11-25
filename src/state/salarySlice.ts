// salary silce 

import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface SalaryFixing {
  id: number;
  employeeId: string | number;
  basicSalary: number;
  hra: number;
  allowance: number;
  incentive: number;
  pfDeduction: number;
  esiDeduction: number;
  professionalTax: number;
  effectiveDate: string;
}

export interface SalaryProjected {
  id: number;
  month: string;
  employeeId: string | number;
  estimatedWorkingDays: number;
  estimatedSalary: number;
}

export interface SalaryCalculation {
  id: number;
  month: string;
  employeeId: string | number;
  basic: number;
  hra: number;
  allowances: number;
  grossSalary: number;
  pf: number;
  esi: number;
  loanDeduction: number;
  advanceDeduction: number;
  netSalary: number;
}

export interface SalaryPayment {
  id: number;
  employeeId: string | number;
  month: string;
  netSalary: number;
  paymentDate: string;
  paymentMode: 'Bank' | 'Cash' | 'UPI';
  transactionId: string;
}

export interface BonusCalculation {
  id: number;
  employeeId: string | number;
  financialYear: string;
  basicSalary: number;
  bonusPercentage: number;
  bonusAmount: number;
  paymentDate: string;
}

export interface SalaryReport {
  id?: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  department?: string;
  designation: string;
  month: string;
  salaryType?: string;
  
  // Working days and hours
  daysToBePresent: number;
  workingHoursPerDay: number;
  actualPresentDays: number;
  additionalWeekOffDays: number;
  otHoursWorked: number;
  festivalHoursWorked?: number;
  
  // Earnings
  grossSalary: number;
  perDaySalary: number;
  basicSalary: number;
  otSalary: number;
  festivalWageSalary?: number;
  attendanceIncentive: number;
  productionIncentive: number;
  foodAllowance: number;
  attIncentive: number;
  prodIncentive: number;
  foodAllowanceAmount: number;
  totalEarnings: number;
  total: number; // TOTAL Earnings (Intermediate)
  
  // Allowances and HRA components
  basicDA: number;
  hra: number;
  ta: number;
  medical: number;
  houseRent?: number;
  totalEarningForPF: number;
  
  // Deductions
  salaryAdvanceDeduction: number;
  loanDeduction: number;
  pfDeduction: number;
  esiDeduction: number;
  canteenDeduction: number;
  tds: number;
  totalDeduction: number;
  
  // Final calculations
  netSalary: number;
  category: string;
  remarks: string;

  // Legacy fields for backward compatibility
  totalWorkingHours?: number;
  otHours?: number;
  regularSalary?: number;
  perHourSalary?: number;
  otRatePerHour?: number;
}

interface SalaryState {
  loading: boolean;
  salaryFixingList: SalaryFixing[];
  projectedList: SalaryProjected[];
  calculationsList: SalaryCalculation[];
  paymentsList: SalaryPayment[];
  bonusList: BonusCalculation[];
  salaryReportList: SalaryReport[];
  pagination: any;
}

const initialState: SalaryState = {
  loading: false,
  salaryFixingList: [],
  projectedList: [],
  calculationsList: [],
  paymentsList: [],
  bonusList: [],
  salaryReportList: [],
  pagination: { total: 0, limit: 10, offset: 0 },
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

// Async Thunks
export const getAllSalaryFixing = createAsyncThunk('salary/getAllFixing', async (params: any = {}, thunkAPI) => {
  try {
    const response = await apiService.get('/salary/fixing');
    return response?.data || response || [];
  } catch (error: any) { return thunkAPI.rejectWithValue(error.message); }
});

export const createSalaryFixing = createAsyncThunk('salary/createFixing', async (data: any, thunkAPI) => {
  try {
    const res = await apiService.post('/salary/fixing', data);
    toast.success("Salary structure fixed");
    return res.data || res;
  } catch (e: any) { toast.error(resolveApiErrorMessage(e, "Error")); return thunkAPI.rejectWithValue(e.message); }
});

export const getAllSalaryCalculations = createAsyncThunk('salary/getAllCalculations', async (params: any = {}, thunkAPI) => {
  try {
    const response = await apiService.get('/salary/calculations');
    return response?.data || response || [];
  } catch (error: any) { return thunkAPI.rejectWithValue(error.message); }
});

export const getAllSalaryProjected = createAsyncThunk('salary/getAllProjected', async (params: any = {}, thunkAPI) => {
  try {
    const response = await apiService.get('/salary/projected');
    return response?.data || response || [];
  } catch (error: any) { return thunkAPI.rejectWithValue(error.message); }
});

export const getAllSalaryPayments = createAsyncThunk('salary/getAllPayments', async (params: any = {}, thunkAPI) => {
  try {
    const response = await apiService.get('/salary/payments');
    return response?.data || response || [];
  } catch (error: any) { return thunkAPI.rejectWithValue(error.message); }
});

export const createSalaryPayment = createAsyncThunk('salary/createPayment', async (data: any, thunkAPI) => {
  try {
    const res = await apiService.post('/salary/payments', data);
    toast.success("Payment recorded");
    return res.data || res;
  } catch (e: any) { toast.error(resolveApiErrorMessage(e, "Error")); return thunkAPI.rejectWithValue(e.message); }
});

export const getAllBonusCalculations = createAsyncThunk('salary/getAllBonus', async (params: any = {}, thunkAPI) => {
  try {
    const response = await apiService.get('/salary/bonus');
    return response?.data || response || [];
  } catch (error: any) { return thunkAPI.rejectWithValue(error.message); }
});

export const createBonusCalculation = createAsyncThunk('salary/createBonus', async (data: any, thunkAPI) => {
  try {
    const res = await apiService.post('/salary/bonus', data);
    toast.success("Bonus calculated");
    return res.data || res;
  } catch (e: any) { toast.error(resolveApiErrorMessage(e, "Error")); return thunkAPI.rejectWithValue(e.message); }
});

export const getSalaryReport = createAsyncThunk('salary/getReport', async (params: { month?: string, fromDate?: string, toDate?: string } | string, thunkAPI) => {
  try {
    let url = '/salary-report';
    if (typeof params === 'string') {
      url += `?month=${params}`;
    } else {
      const queryParams = new URLSearchParams();
      if (params.month) queryParams.append('month', params.month);
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      url += `?${queryParams.toString()}`;
    }
    const response = await apiService.get(url);
    let rawData = response?.data !== undefined ? response.data : response;
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      if (Array.isArray(rawData.data)) {
        rawData = rawData.data;
      } else if (Array.isArray(rawData.content)) {
        rawData = rawData.content;
      }
    }
    return Array.isArray(rawData) ? rawData : [];
  } catch (error: any) { return thunkAPI.rejectWithValue(error.message); }
});

export const updateSalaryReport = createAsyncThunk('salary/updateReport', async (data: any, thunkAPI) => {
  try {
    const response = await apiService.patch('/salary-report', data);
    toast.success("Salary report updated");
    return response?.data || response;
  } catch (error: any) { 
    toast.error(resolveApiErrorMessage(error, "Update failed"));
    return thunkAPI.rejectWithValue(error.message); 
  }
});

export const createSalaryReport = createAsyncThunk('salary/createReport', async (data: any, thunkAPI) => {
  try {
    const response = await apiService.post('/salary-report', data);
    toast.success("Salary report created");
    return response?.data || response;
  } catch (error: any) { 
    toast.error(resolveApiErrorMessage(error, "Create failed"));
    return thunkAPI.rejectWithValue(error.message); 
  }
});

export const bulkCreateSalaryReport = createAsyncThunk('salary/bulkCreateReport', async (data: any[], thunkAPI) => {
  try {
    const response = await apiService.post('/salary-report/bulk', data);
    toast.success(`${data.length} salary reports created`);
    return response?.data || response;
  } catch (error: any) { 
    toast.error(resolveApiErrorMessage(error, "Bulk create failed"));
    return thunkAPI.rejectWithValue(error.message); 
  }
});

export const updateSalaryReportRecord = createAsyncThunk('salary/updateRecord', async (data: any, thunkAPI) => {
  try {
    const response = await apiService.put('/salary-report', data);
    toast.success("Salary report updated");
    return response?.data || response;
  } catch (error: any) { 
    toast.error(resolveApiErrorMessage(error, "Update failed"));
    return thunkAPI.rejectWithValue(error.message); 
  }
});

export const bulkUpdateSalaryReport = createAsyncThunk('salary/bulkUpdateReport', async (data: any[], thunkAPI) => {
  try {
    const response = await apiService.put('/salary-report/bulk', data);
    toast.success(`${data.length} salary reports updated`);
    return response?.data || response;
  } catch (error: any) { 
    toast.error(resolveApiErrorMessage(error, "Bulk update failed"));
    return thunkAPI.rejectWithValue(error.message); 
  }
});

export const bulkUpsertSalaryReport = createAsyncThunk('salary/bulkUpsertReport', async (data: any[], thunkAPI) => {
  try {
    const response = await apiService.post('/salary-report/bulk-upsert', data);
    toast.success(`${data.length} salary reports processed`);
    return response?.data || response;
  } catch (error: any) { 
    toast.error(resolveApiErrorMessage(error, "Bulk upsert failed"));
    return thunkAPI.rejectWithValue(error.message); 
  }
});

export const checkSalaryReportExists = createAsyncThunk('salary/checkExists', async ({ employeeId, month, year }: { employeeId: number, month: number, year: number }, thunkAPI) => {
  try {
    const response = await apiService.get(`/salary-report/exists?employeeId=${employeeId}&month=${month}&year=${year}`);
    return response?.data || response;
  } catch (error: any) { 
    return thunkAPI.rejectWithValue(error.message); 
  }
});

const salarySlice = createSlice({
  name: 'salary',
  initialState,
  reducers: {
    updateReportItem: (state, action: PayloadAction<{ employeeId: number, field: string, value: any }>) => {
      const { employeeId, field, value } = action.payload;
      const index = state.salaryReportList.findIndex(item => item.employeeId === employeeId);
      if (index !== -1) {
        state.salaryReportList[index] = { ...state.salaryReportList[index], [field]: value };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllSalaryFixing.fulfilled, (state, action) => { state.salaryFixingList = action.payload; })
      .addCase(getAllSalaryCalculations.fulfilled, (state, action) => { state.calculationsList = action.payload; })
      .addCase(getAllSalaryProjected.fulfilled, (state, action) => { state.projectedList = action.payload; })
      .addCase(getAllSalaryPayments.fulfilled, (state, action) => { state.paymentsList = action.payload; })
      .addCase(getAllBonusCalculations.fulfilled, (state, action) => { state.bonusList = action.payload; })
      .addCase(getSalaryReport.fulfilled, (state, action) => { 
        state.salaryReportList = action.payload; 
        state.loading = false;
      })
      .addCase(getSalaryReport.pending, (state) => { 
        state.loading = true; 
        state.salaryReportList = [];
      })
      .addCase(getSalaryReport.rejected, (state) => { state.loading = false; });
  },
});

export const { updateReportItem } = salarySlice.actions;

export default salarySlice.reducer;
