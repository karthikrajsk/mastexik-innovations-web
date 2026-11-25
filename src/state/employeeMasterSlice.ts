import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface EmployeeMaster {
  id: number;
  // Personal Details
  employeeCode: string;
  employeeName: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  dob: string;
  fatherHusbandName: string;
  mobileNumber: string;
  email: string;
  address: string;
  aadhaarNumber: string;
  panNumber: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed' | '';
  uanNumber: string;
  pfNumber: string;
  pfJoiningDate: string;
  esiNumber: string;
  pfApplicable: boolean;
  esiApplicable: boolean;

  employmentDetails: {
    department: string;
    designation: string;
    joiningDate: string;
    employeeType: 'Permanent' | 'Contract' | '';
    status: 'Active' | 'Relieved' | '';
  };

  salaryDetails: {
    salaryStructure: string;
    salaryType: 'Monthly' | 'Daily' | 'Hourly' | '';
    basicSalary: number;
    hra: number;
    conveyanceAllowance: number;
    medicalAllowance: number;
    specialAllowance: number;
    incentive: number;
  };

  shiftDetails: {
    shiftName: string;
    shiftCode: string;
    shiftStartTime: string;
    shiftEndTime: string;
    breakStartTime: string;
    breakEndTime: string;
    totalWorkingHours: number;
    otHours?: number;
    weeklyOffDay: string;
    overtimeAllowed: boolean;
    lateEntryAllowedMinutes: number;
    shiftEffectiveFrom: string;
  };

  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
  };
}

interface EmployeeMasterState {
  loading: boolean;
  error: string | null;
  employeeMasterList: EmployeeMaster[];
  lastResult: EmployeeMaster | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
  };
}

const initialState: EmployeeMasterState = {
  loading: false,
  error: null,
  employeeMasterList: [],
  lastResult: null,
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

export const getAllEmployeeMasters = createAsyncThunk(
  'employeeMaster/getAll',
  async (params: { limit?: number; offset?: number; fetchAll?: boolean } = {}, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.fetchAll) {
        queryParams.append('limit', '10000');
        queryParams.append('offset', '0');
      } else {
        if (params.limit) queryParams.append('limit', String(params.limit));
        if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
      }
      const response = await apiService.get(`/employee-master?${queryParams.toString()}`);
      return {
        data: response?.data?.data || response?.data || [],
        pagination: {
          total: response?.data?.total || 0,
          limit: response?.data?.limit || params.limit || 10,
          offset: response?.data?.offset || params.offset || 0,
          next: response?.data?.next || false,
          prev: response?.data?.prev || false,
        },
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createEmployeeMaster = createAsyncThunk(
  'employeeMaster/create',
  async (params: Omit<EmployeeMaster, 'id'>, thunkAPI) => {
    try {
      const response = await apiService.post('/employee-master', params);
      if (response?.status === 'success' || response?.id) {
        toast.success(response?.message || 'Employee created successfully');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to create employee');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to create employee");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateEmployeeMaster = createAsyncThunk(
  'employeeMaster/update',
  async (params: EmployeeMaster, thunkAPI) => {
    try {
      const response = await apiService.put(`/employee-master/${params.id}`, params);
      if (response?.status === 'success' || response?.id) {
        toast.success(response?.message || 'Employee updated successfully');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to update employee');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to update employee");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteEmployeeMaster = createAsyncThunk(
  'employeeMaster/delete',
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/employee-master/${id}`);
      if (response?.status === 'success') {
        toast.success(response?.message || 'Employee deleted successfully');
        return id;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to delete employee');
    } catch (error: any) {
      toast.error(error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const employeeMasterSlice = createSlice({
  name: 'employeeMaster',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllEmployeeMasters.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllEmployeeMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.employeeMasterList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllEmployeeMasters.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEmployeeMaster.fulfilled, (state, action: PayloadAction<EmployeeMaster>) => {
        state.employeeMasterList.unshift(action.payload);
      })
      .addCase(updateEmployeeMaster.fulfilled, (state, action: PayloadAction<EmployeeMaster>) => {
        const index = state.employeeMasterList.findIndex(e => e.id === action.payload.id);
        if (index !== -1) state.employeeMasterList[index] = action.payload;
      })
      .addCase(deleteEmployeeMaster.fulfilled, (state, action: PayloadAction<number>) => {
        state.employeeMasterList = state.employeeMasterList.filter(e => e.id !== action.payload);
      });
  },
});

export default employeeMasterSlice.reducer;
