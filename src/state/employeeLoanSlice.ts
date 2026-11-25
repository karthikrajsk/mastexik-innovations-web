import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface EmployeeLoan {
  id?: number;
  employeeId: number;
  loanAmount: number;
  tenureMonths: number;
  installmentAmount: number;
  fromMonth: string; // YYYY-MM
  toMonth: string; // YYYY-MM
  disbursementDate: string; // YYYY-MM-DD
  purpose: string;
  status: 'Active' | 'Closed' | 'Paused';
  skippedMonths?: string;
  employeeCode?: string;
  employeeName?: string;
  voucherNo?: string;
  voucherDate?: string;
  paymentDate?: string;
}

interface EmployeeLoanState {
  loading: boolean;
  employeeLoanList: EmployeeLoan[];
  allEmployeeLoanList: EmployeeLoan[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
  };
}

const initialState: EmployeeLoanState = {
  loading: false,
  employeeLoanList: [],
  allEmployeeLoanList: [],
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const getEmployeeLoans = createAsyncThunk(
  'employeeLoan/get',
  async (params: { employeeId: number }, thunkAPI) => {
    try {
      const response = await apiService.get(`/employee-loan?employeeId=${params.employeeId}`);
      return response?.data || response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const getAllEmployeeLoans = createAsyncThunk(
  'employeeLoan/getAll',
  async (params: { offset?: number, limit?: number } | undefined, thunkAPI) => {
    try {
      const offset = params?.offset ?? 0;
      const limit = params?.limit ?? 1000;
      const response = await apiService.get(`/employee-loan?offset=${offset}&limit=${limit}`);
      return response?.data || response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const saveEmployeeLoans = createAsyncThunk(
  'employeeLoan/save',
  async (params: { employeeId: number, data: EmployeeLoan[] }, thunkAPI) => {
    try {
      const res = await apiService.post(`/employee-loan?employeeId=${params.employeeId}`, params.data);
      toast.success("Employee Loan(s) saved successfully");
      return res.data || res;
    } catch (e: any) {
      const msg = resolveApiErrorMessage(e, "Error saving loans");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateEmployeeLoans = createAsyncThunk(
  'employeeLoan/update',
  async (params: { employeeId: number, data: EmployeeLoan[] }, thunkAPI) => {
    try {
      const res = await apiService.put(`/employee-loan?employeeId=${params.employeeId}`, params.data);
      toast.success("Employee Loan(s) updated successfully");
      return res.data || res;
    } catch (e: any) {
      const msg = resolveApiErrorMessage(e, "Error updating loans");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteEmployeeLoan = createAsyncThunk(
  'employeeLoan/delete',
  async (id: number, thunkAPI) => {
    try {
      await apiService.delete(`/employee-loan/${id}`);
      toast.success("Loan deleted successfully");
      return id;
    } catch (e: any) {
      const msg = resolveApiErrorMessage(e, "Error deleting loan");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const employeeLoanSlice = createSlice({
  name: 'employeeLoan',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getEmployeeLoans.pending, (state) => {
        state.loading = true;
      })
      .addCase(getEmployeeLoans.fulfilled, (state, action) => {
        state.employeeLoanList = action.payload;
        state.loading = false;
      })
      .addCase(getEmployeeLoans.rejected, (state) => {
        state.loading = false;
      })
      .addCase(getAllEmployeeLoans.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllEmployeeLoans.fulfilled, (state, action) => {
        if (action.payload && action.payload.data) {
          state.allEmployeeLoanList = action.payload.data;
          state.pagination = {
            total: action.payload.total,
            limit: action.payload.limit,
            offset: action.payload.offset,
            next: action.payload.next,
            prev: action.payload.prev,
          };
        } else {
          state.allEmployeeLoanList = action.payload || [];
        }
        state.loading = false;
      })
      .addCase(getAllEmployeeLoans.rejected, (state) => {
        state.loading = false;
      })
      .addCase(deleteEmployeeLoan.fulfilled, (state, action) => {
        state.employeeLoanList = state.employeeLoanList.filter(item => item.id !== action.payload);
        state.allEmployeeLoanList = state.allEmployeeLoanList.filter(item => item.id !== action.payload);
      });
  },
});

export default employeeLoanSlice.reducer;
