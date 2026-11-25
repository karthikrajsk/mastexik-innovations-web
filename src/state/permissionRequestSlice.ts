import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '@/services/ApiService';
import { toast } from 'react-toastify';

declare const encodeURIComponent: (str: string) => string;

// Types
export interface PermissionRequest {
  id?: number;
  employeeId: number;
  employeeName?: string;
  employeeCode?: string;
  date: string;
  fromTime: string;
  toTime: string;
  reason: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: string;
  updatedAt?: string;
}

interface PermissionRequestState {
  permissionList: PermissionRequest[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
}

const initialState: PermissionRequestState = {
  permissionList: [],
  loading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const getAllPermissionRequests = createAsyncThunk(
  'permissionRequest/getAll',
  async (params: { page?: number; limit?: number }, thunkAPI) => {
    try {
      const { page = 0, limit = 10 } = params;
      const response = await apiService.get(`/permission-request?page=${page}&size=${limit}`);
      return response.data;  // Return only the data part
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to fetch permission requests";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const getPermissionRequestById = createAsyncThunk(
  'permissionRequest/getById',
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`/permission-request/${id}`);
      return response.data;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to fetch permission request";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const createPermissionRequest = createAsyncThunk(
  'permissionRequest/create',
  async (params: Omit<PermissionRequest, 'id'>, thunkAPI) => {
    try {
      const response = await apiService.post('/permission-request', params);
      if (response?.status === 'success' || response?.id) {
         toast.success(response?.message || 'Permission created successfully');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to create permission request');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to create permission request";
       toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updatePermissionRequest = createAsyncThunk(
  'permissionRequest/update',
  async (params: PermissionRequest, thunkAPI) => {
    try {
      const response = await apiService.put(`/permission-request/${params.id}`, params);
      if (response?.status === 'success' || response?.id) {
          toast.success(response?.message || 'Permission updated successfully');
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to update permission request');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to update permission request";
        toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const approvePermissionRequest = createAsyncThunk(
  'permissionRequest/approve',
  async (params: { id: number; approvedBy: string }, thunkAPI) => {
    try {
      const response = await apiService.put(`/permission-request/${params.id}/approve`, { approvedBy: params.approvedBy });
      if (response?.status === 'success' || response?.id) {
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to approve permission request');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to approve permission request";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const rejectPermissionRequest = createAsyncThunk(
  'permissionRequest/reject',
  async (params: { id: number; rejectionReason: string; rejectedBy: string }, thunkAPI) => {
    try {
      const response = await apiService.put(`/permission-request/${params.id}/reject`, { 
        rejectionReason: params.rejectionReason, 
        rejectedBy: params.rejectedBy 
      });
      if (response?.status === 'success' || response?.id) {
        return response.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to reject permission request');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to reject permission request";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deletePermissionRequest = createAsyncThunk(
  'permissionRequest/delete',
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/permission-request/${id}`);
      if (response?.status === 'success') {
        return id;
      }
      return thunkAPI.rejectWithValue(response?.message || 'Failed to delete permission request');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to delete permission request";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Slice
const permissionRequestSlice = createSlice({
  name: 'permissionRequest',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get all permission requests
      .addCase(getAllPermissionRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllPermissionRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.permissionList = action.payload.data || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(getAllPermissionRequests.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create permission request
      .addCase(createPermissionRequest.fulfilled, (state, action: PayloadAction<PermissionRequest>) => {
        state.permissionList.unshift(action.payload);
      })
      // Update permission request
      .addCase(updatePermissionRequest.fulfilled, (state, action: PayloadAction<PermissionRequest>) => {
        const index = state.permissionList.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.permissionList[index] = action.payload;
      })
      // Approve permission request
      .addCase(approvePermissionRequest.fulfilled, (state, action: PayloadAction<PermissionRequest>) => {
        const index = state.permissionList.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.permissionList[index] = action.payload;
      })
      // Reject permission request
      .addCase(rejectPermissionRequest.fulfilled, (state, action: PayloadAction<PermissionRequest>) => {
        const index = state.permissionList.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.permissionList[index] = action.payload;
      })
      // Delete permission request
      .addCase(deletePermissionRequest.fulfilled, (state, action: PayloadAction<number>) => {
        state.permissionList = state.permissionList.filter(p => p.id !== action.payload);
      });
  },
});

export default permissionRequestSlice.reducer;
