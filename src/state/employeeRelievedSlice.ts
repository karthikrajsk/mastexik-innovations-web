import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface EmployeeRelieved {
  id: number;
  employeeId: number;
  relievingDate: string;
  reason: string;
  remarks: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  isRelieved: number;
  activeFlag?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface EmployeeRelievedState {
  loading: boolean;
  error: string | null;
  relievedList: EmployeeRelieved[];
  lastResult: EmployeeRelieved | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
  };
}

const initialState: EmployeeRelievedState = {
  loading: false,
  error: null,
  relievedList: [],
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

export const getAllEmployeeRelieved = createAsyncThunk(
  'employeeRelieved/getAll',
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
      const url = queryString ? `/employee-relieved?${queryString}` : '/employee-relieved';
      
      const response = await apiService.get(url);
      
      // Handle paginated response structure - same pattern as Purchase Order
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

export const createEmployeeRelieved = createAsyncThunk(
  'employeeRelieved/create',
  async (params: Omit<EmployeeRelieved, 'id'>, thunkAPI) => {
    try {
      const response = await apiService.post('/employee-relieved', params);
      if (response?.status === 'success' || response?.id) {
        toast.success(response?.message || 'Employee relieved record created successfully');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to create employee relieved record');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to create employee relieved record");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateEmployeeRelieved = createAsyncThunk(
  'employeeRelieved/update',
  async (params: EmployeeRelieved, thunkAPI) => {
    try {
      const response = await apiService.put(`/employee-relieved/${params.id}`, params);
      if (response?.status === 'success' || response?.id) {
        toast.success(response?.message || 'Employee relieved record updated successfully');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to update employee relieved record');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to update employee relieved record");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteEmployeeRelieved = createAsyncThunk(
  'employeeRelieved/delete',
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/employee-relieved/${id}`);
      if (response?.status === 'success') {
        toast.success(response?.message || 'Employee relieved record deleted successfully');
        return id;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to delete employee relieved record');
    } catch (error: any) {
      toast.error(error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const employeeRelievedSlice = createSlice({
  name: 'employeeRelieved',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllEmployeeRelieved.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllEmployeeRelieved.fulfilled, (state, action) => {
        state.loading = false;
        state.relievedList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllEmployeeRelieved.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEmployeeRelieved.fulfilled, (state, action: PayloadAction<EmployeeRelieved>) => {
        state.relievedList.unshift(action.payload);
      })
      .addCase(updateEmployeeRelieved.fulfilled, (state, action: PayloadAction<EmployeeRelieved>) => {
        const index = state.relievedList.findIndex(e => e.id === action.payload.id);
        if (index !== -1) state.relievedList[index] = action.payload;
      })
      .addCase(deleteEmployeeRelieved.fulfilled, (state, action: PayloadAction<number>) => {
        state.relievedList = state.relievedList.filter(e => e.id !== action.payload);
      });
  },
});

export default employeeRelievedSlice.reducer;
