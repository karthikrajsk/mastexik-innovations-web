import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName?: string;
  employeeCode?: string;
  leaveType: 'Sick' | 'Casual' | 'Annual' | 'Maternity' | 'Paternity' | 'Unpaid' | 'Long Leave' | string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approvedBy?: number;
  approvedByName?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LeaveRequestState {
  loading: boolean;
  error: string | null;
  leaveRequestList: LeaveRequest[];
  lastResult: LeaveRequest | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
  };
}

const initialState: LeaveRequestState = {
  loading: false,
  error: null,
  leaveRequestList: [],
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

export const getAllLeaveRequests = createAsyncThunk(
  'leaveRequest/getAll',
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
      const response = await apiService.get(`/leave-request?${queryParams.toString()}`);
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

export const createLeaveRequest = createAsyncThunk(
  'leaveRequest/create',
  async (params: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>, thunkAPI) => {
    try {
      const response = await apiService.post('/leave-request', params);
      if (response?.status === 'success' || response?.id) {
        toast.success(response?.message || 'Leave request created successfully');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to create leave request');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to create leave request");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateLeaveRequest = createAsyncThunk(
  'leaveRequest/update',
  async (params: LeaveRequest, thunkAPI) => {
    try {
      const response = await apiService.put(`/leave-request/${params.id}`, params);
      if (response?.status === 'success' || response?.id) {
        toast.success(response?.message || 'Leave request updated successfully');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to update leave request');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to update leave request");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const approveLeaveRequest = createAsyncThunk(
  'leaveRequest/approve',
  async (params: { id: number; approvedBy: number }, thunkAPI) => {
    try {
      const response = await apiService.put(`/leave-request/${params.id}/approve`, { approvedBy: params.approvedBy });
      if (response?.status === 'success') {
        toast.success(response?.message || 'Leave request approved successfully');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to approve leave request');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to approve leave request");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const rejectLeaveRequest = createAsyncThunk(
  'leaveRequest/reject',
  async (params: { id: number; rejectionReason: string; rejectedBy: number }, thunkAPI) => {
    try {
      const response = await apiService.put(`/leave-request/${params.id}/reject`, { 
        rejectionReason: params.rejectionReason, 
        rejectedBy: params.rejectedBy 
      });
      if (response?.status === 'success') {
        toast.success(response?.message || 'Leave request rejected successfully');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to reject leave request');
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Failed to reject leave request");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteLeaveRequest = createAsyncThunk(
  'leaveRequest/delete',
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/leave-request/${id}`);
      if (response?.status === 'success') {
        toast.success(response?.message || 'Leave request deleted successfully');
        return id;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to delete leave request');
    } catch (error: any) {
      toast.error(error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const leaveRequestSlice = createSlice({
  name: 'leaveRequest',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllLeaveRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllLeaveRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.leaveRequestList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllLeaveRequests.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createLeaveRequest.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
        state.leaveRequestList.unshift(action.payload);
      })
      .addCase(updateLeaveRequest.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
        const index = state.leaveRequestList.findIndex(e => e.id === action.payload.id);
        if (index !== -1) state.leaveRequestList[index] = action.payload;
      })
      .addCase(approveLeaveRequest.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
        const index = state.leaveRequestList.findIndex(e => e.id === action.payload.id);
        if (index !== -1) state.leaveRequestList[index] = action.payload;
      })
      .addCase(rejectLeaveRequest.fulfilled, (state, action: PayloadAction<LeaveRequest>) => {
        const index = state.leaveRequestList.findIndex(e => e.id === action.payload.id);
        if (index !== -1) state.leaveRequestList[index] = action.payload;
      })
      .addCase(deleteLeaveRequest.fulfilled, (state, action: PayloadAction<number>) => {
        state.leaveRequestList = state.leaveRequestList.filter(e => e.id !== action.payload);
      });
  },
});

export default leaveRequestSlice.reducer;
