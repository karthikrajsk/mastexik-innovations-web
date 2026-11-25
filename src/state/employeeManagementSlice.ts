import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface EmployeeRelieved {
  id: number;
  employeeId: string | number;
  relievingDate: string;
  reason: string;
  finalSettlementStatus: string;
  remarks: string;
}

export interface LeaveParticulars {
  id: number;
  employeeId: string | number;
  leaveType: 'Casual' | 'Sick' | 'Earned';
  leaveBalance: number;
  fromDate: string;
  toDate: string;
  reason: string;
  approvalStatus: string;
}

export interface EmployeePermission {
  id: number;
  employeeId: string | number;
  date: string;
  fromTime: string;
  toTime: string;
  reason: string;
  approvedBy: string;
}

interface EmployeeManagementState {
  loading: boolean;
  relievedList: EmployeeRelieved[];
  leaveList: LeaveParticulars[];
  permissionList: EmployeePermission[];
  pagination: any;
}

const initialState: EmployeeManagementState = {
  loading: false,
  relievedList: [],
  leaveList: [],
  permissionList: [],
  pagination: { total: 0, limit: 10, offset: 0 },
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

// Generic thunk factory
const createGenericThunk = (name: string, endpoint: string) => {
  return createAsyncThunk(`employeeManagement/${name}`, async (params: any = {}, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => queryParams.append(key, String(params[key])));
      const response = await apiService.get(`${endpoint}?${queryParams.toString()}`);
      return response?.data || response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  });
};

export const getAllRelieved = createGenericThunk('getRelieved', '/employee/relieved');
export const getAllLeaves = createGenericThunk('getLeaves', '/employee/leaves');
export const getAllPermissions = createGenericThunk('getPermissions', '/employee/permissions');

export const createRelieved = createAsyncThunk('employeeManagement/createRelieved', async (data: any, thunkAPI) => {
    try {
        const res = await apiService.post('/employee/relieved', data);
        toast.success("Record saved");
        return res.data || res;
    } catch (e: any) { toast.error(resolveApiErrorMessage(e, "Error")); return thunkAPI.rejectWithValue(e.message); }
});

const employeeManagementSlice = createSlice({
  name: 'employeeManagement',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllRelieved.fulfilled, (state, action) => { state.relievedList = action.payload; })
      .addCase(getAllLeaves.fulfilled, (state, action) => { state.leaveList = action.payload; })
      .addCase(getAllPermissions.fulfilled, (state, action) => { state.permissionList = action.payload; });
  },
});

export default employeeManagementSlice.reducer;
