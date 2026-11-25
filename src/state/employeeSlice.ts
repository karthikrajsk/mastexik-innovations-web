import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface PfWageCeilingHistoryItem {
  id?: number;
  employeeId?: number;
  pfWageCeiling: number;
  effectiveDate: string;
  remarks?: string;
  createdAt?: string;
}

export interface SalaryHistoryItem {
  id?: number;
  employeeId?: number;
  department?: string;
  designation?: string;
  salaryType: 'Monthly' | 'Daily' | 'Hourly' | '28 days' | string;
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number; // DA
  medicalAllowance: number;
  specialAllowance: number; // TA
  otSalary: number;
  isCanteen: boolean | number;
  pfWageCeiling?: number;
  effectiveDate: string;
  remarks?: string;
  createdAt?: string;
}

export interface Employee {
  id: number;
  // Personal Details
  employeeCode: string;
  code?: string;
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
  bloodGroup: string;
  emergencyContactNumber: string;
  category: string;
  employeePhoto: string;
  aadhaarCard: string;
  photoMediaDetailSno?: number;
  photoMediaSno?: number;
  uanNumber: string;
  pfNumber: string;
  pfJoiningDate: string;
  esiNumber: string;
  pfApplicable: boolean;
  esiApplicable: boolean;
  pfPercent: number;
  pfWageCeilingHistory?: PfWageCeilingHistoryItem[];
  pfWageCeiling?: number;
  esiPercent: number;
  basicDaPercent: number;
  hraPercent: number;
  taPercent: number;
  medicalPercent: number;
  isRelieved: boolean | number;
  isEligibleFor28Days: boolean;
  isAllowance: boolean | number;
  isAdvance: boolean | number;
  productionIncentiveApplicable: boolean | number;
  attendanceIncentiveApplicable: boolean | number;
  foodAllowanceApplicable: boolean | number;
  festivalWagesApplicable: boolean | number;
  holidayDeductionApplicable?: boolean | number;
  attendanceIncentive: number;
  productionIncentive: number;

  employmentDetails: {
    department: string;
    designation: string;
    qualification?: string;
    joiningDate: string;
    employeeType: 'Permanent' | 'Contract' | '';
    status: 'Active' | 'Relieved' | '';
    hostelFamilyQuarters?: string;
    hostelFamilyQuartersRoomNo?: string;
    houseRent?: number;
    isFestivalWageApplicable?: boolean | number;
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
    otSalary: number;
    perHourSalary: number;
    otRatePerHour: number;
    productionIncentive: number;
    isCanteen: boolean | number;

  effectiveDate: string;
  };

  salaryHistory?: SalaryHistoryItem[];

  shiftDetails: {
    shiftName: string;
    shiftCode: string;
    shiftStartTime: string;
    shiftEndTime: string;
    breakStartTime: string;
    breakEndTime: string;
    lunchBreak?: string;
    totalWorkingHours: number;
    otHours?: number;
    weeklyOffDay: string;
    overtimeAllowed: boolean;
    lateEntryAllowedMinutes: number;
    shiftEffectiveFrom: string;
    noOfLeave: number;
  };

  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
    bankDocumentsUrl?: string;
    bankDocumentsMediaDetailSno?: number;
    bankDocumentsMediaSno?: number;
  };
}

interface EmployeeState {
  loading: boolean;
  error: string | null;
  employeeList: Employee[];
  lastResult: Employee | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
  };
}

const initialState: EmployeeState = {
  loading: false,
  error: null,
  employeeList: [],
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

export const getAllEmployees = createAsyncThunk(
  'employee/getAll',
  async (params: { limit?: number; offset?: number; fetchAll?: boolean } = {}, thunkAPI) => {
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
      const url = queryString ? `/employee?${queryString}` : '/employee';
      
      const response = await apiService.get(url);
      
      // Handle paginated response structure
      const paginationData = response?.data;
      
      const rawArray = Array.isArray(paginationData?.data)
        ? paginationData.data
        : Array.isArray(paginationData)
        ? paginationData
        : [];

      return {
        data: rawArray,
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

const cleanDate = (d: any) => (d === "" || d === undefined || d === null) ? null : d;

const cleanEmployeeData = (params: any) => {
  return {
    ...params,
    dob: cleanDate(params.dob),
    pfJoiningDate: cleanDate(params.pfJoiningDate),
    isRelieved: params.isRelieved ? 1 : 0,
    isAllowance: params.isAllowance ? 1 : 0,
    isAdvance: params.isAdvance ? 1 : 0,
    productionIncentiveApplicable: params.productionIncentiveApplicable ? 1 : 0,
    attendanceIncentiveApplicable: params.attendanceIncentiveApplicable ? 1 : 0,
    foodAllowanceApplicable: params.foodAllowanceApplicable ? 1 : 0,
    employmentDetails: params.employmentDetails ? {
      ...params.employmentDetails,
      joiningDate: cleanDate(params.employmentDetails.joiningDate)
    } : undefined,
    salaryDetails: params.salaryDetails ? {
      ...params.salaryDetails,
      isCanteen: params.salaryDetails.isCanteen ? 1 : 0,
      effectiveDate: cleanDate(params.salaryDetails.effectiveDate)
    } : undefined,
    shiftDetails: params.shiftDetails ? {
      ...params.shiftDetails,
      shiftStartTime: cleanDate(params.shiftDetails.shiftStartTime),
      shiftEndTime: cleanDate(params.shiftDetails.shiftEndTime),
      breakStartTime: cleanDate(params.shiftDetails.breakStartTime),
      breakEndTime: cleanDate(params.shiftDetails.breakEndTime),
      shiftEffectiveFrom: cleanDate(params.shiftDetails.shiftEffectiveFrom),
      weeklyOffDay: cleanDate(params.shiftDetails.weeklyOffDay),
      noOfLeave: cleanDate(params.shiftDetails.noOfLeave)
    } : undefined
  };
};

export const createEmployee = createAsyncThunk(
  'employee/create',
  async (params: Omit<Employee, 'id'>, thunkAPI) => {
    try {
      const transformedParams = cleanEmployeeData(params);
      const response = await apiService.post('/employee', transformedParams);
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

export const updateEmployee = createAsyncThunk(
  'employee/update',
  async (params: Employee, thunkAPI) => {
    try {
      const transformedParams = cleanEmployeeData(params);
      const response = await apiService.put(`/employee/${params.id}`, transformedParams);
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

export const deleteEmployee = createAsyncThunk(
  'employee/delete',
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/employee/${id}`);
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

export const createEmployeesBulk = createAsyncThunk(
  'employee/createBulk',
  async (employees: Omit<Employee, 'id'>[], thunkAPI) => {
    try {
      const transformed = employees.map(emp => cleanEmployeeData(emp));
      const response = await apiService.post('/employee/bulk', transformed);
      if (response?.status === 'success' || Array.isArray(response) || response?.data) {
        const data = response?.data || (Array.isArray(response) ? response : []);
        toast.success(`${data.length} employees imported successfully`);
        return data;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to create employees');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to create employees");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const employeeSlice = createSlice({

  name: 'employee',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllEmployees.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllEmployees.fulfilled, (state, action) => {
        state.loading = false;
        // Transform integer fields to boolean for frontend compatibility
        state.employeeList = action.payload.data.map((emp: any) => ({
          ...emp,
          isRelieved: emp.isRelieved === 1,
          isAllowance: emp.isAllowance === 1,
          isAdvance: emp.isAdvance === 1,
          productionIncentiveApplicable: emp.productionIncentiveApplicable === 1,
          attendanceIncentiveApplicable: emp.attendanceIncentiveApplicable === 1,
          foodAllowanceApplicable: emp.foodAllowanceApplicable === 1,
          salaryDetails: emp.salaryDetails ? {
            ...emp.salaryDetails,
            isCanteen: emp.salaryDetails.isCanteen === 1
          } : emp.salaryDetails
        }));
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllEmployees.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEmployee.fulfilled, (state, action: PayloadAction<Employee>) => {
        // Transform integer fields to boolean for frontend compatibility
        const transformedEmployee = {
          ...action.payload,
          isRelieved: (action.payload as any).isRelieved === 1,
          isAllowance: (action.payload as any).isAllowance === 1,
          isAdvance: (action.payload as any).isAdvance === 1,
          productionIncentiveApplicable: (action.payload as any).productionIncentiveApplicable === 1,
          attendanceIncentiveApplicable: (action.payload as any).attendanceIncentiveApplicable === 1,
          foodAllowanceApplicable: (action.payload as any).foodAllowanceApplicable === 1,
          salaryDetails: action.payload.salaryDetails ? {
            ...action.payload.salaryDetails,
            isCanteen: (action.payload.salaryDetails as any).isCanteen === 1
          } : action.payload.salaryDetails
        };
        state.employeeList.unshift(transformedEmployee);
      })
      .addCase(updateEmployee.fulfilled, (state, action: PayloadAction<Employee>) => {
        // Transform integer fields to boolean for frontend compatibility
        const transformedEmployee = {
          ...action.payload,
          isRelieved: (action.payload as any).isRelieved === 1,
          isAllowance: (action.payload as any).isAllowance === 1,
          isAdvance: (action.payload as any).isAdvance === 1,
          productionIncentiveApplicable: (action.payload as any).productionIncentiveApplicable === 1,
          attendanceIncentiveApplicable: (action.payload as any).attendanceIncentiveApplicable === 1,
          foodAllowanceApplicable: (action.payload as any).foodAllowanceApplicable === 1,
          salaryDetails: action.payload.salaryDetails ? {
            ...action.payload.salaryDetails,
            isCanteen: (action.payload.salaryDetails as any).isCanteen === 1
          } : action.payload.salaryDetails
        };
        const index = state.employeeList.findIndex(e => e.id === action.payload.id);
        if (index !== -1) state.employeeList[index] = transformedEmployee;
      })
      .addCase(deleteEmployee.fulfilled, (state, action: PayloadAction<number>) => {
        state.employeeList = state.employeeList.filter(e => e.id !== action.payload);
      })
      .addCase(createEmployeesBulk.fulfilled, (state, action: PayloadAction<Employee[]>) => {
        const transformedEmployees = (action.payload || []).map((emp: any) => ({
          ...emp,
          isRelieved: emp.isRelieved === 1,
          isAllowance: emp.isAllowance === 1,
          isAdvance: emp.isAdvance === 1,
          productionIncentiveApplicable: emp.productionIncentiveApplicable === 1,
          attendanceIncentiveApplicable: emp.attendanceIncentiveApplicable === 1,
          foodAllowanceApplicable: emp.foodAllowanceApplicable === 1,
          salaryDetails: emp.salaryDetails ? {
            ...emp.salaryDetails,
            isCanteen: emp.salaryDetails.isCanteen === 1
          } : emp.salaryDetails
        }));
        state.employeeList = [...transformedEmployees, ...state.employeeList];
      });
  },
});


export default employeeSlice.reducer;
