import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface EmployeeLoanSkipRequest {
  id?: number;
  loanId: number;
  skipMonth: string; // YYYY-MM
  reason: string;
  status: 'Pending' | 'Approved' | 'Declined';
  requestedDate?: string;
  actionedDate?: string;
}

interface EmployeeLoanSkipRequestState {
  loading: boolean;
  skipRequestList: EmployeeLoanSkipRequest[];
}

const initialState: EmployeeLoanSkipRequestState = {
  loading: false,
  skipRequestList: [],
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const getSkipRequests = createAsyncThunk(
  'employeeLoanSkipRequest/get',
  async (params: { loanId: number }, thunkAPI) => {
    try {
      const response = await apiService.get(`/employee-loan/skip-request?loanId=${params.loanId}`);
      return response?.data || response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createSkipRequest = createAsyncThunk(
  'employeeLoanSkipRequest/create',
  async (data: EmployeeLoanSkipRequest, thunkAPI) => {
    try {
      const res = await apiService.post(`/employee-loan/skip-request`, data);
      toast.success("Skip request submitted successfully");
      return res.data || res;
    } catch (e: any) {
      const msg = resolveApiErrorMessage(e, "Error submitting skip request");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateSkipRequestStatus = createAsyncThunk(
  'employeeLoanSkipRequest/updateStatus',
  async (params: { id: number, status: 'Approved' | 'Declined' }, thunkAPI) => {
    try {
      const res = await apiService.put(`/employee-loan/skip-request/${params.id}/status?status=${params.status}`, {});
      toast.success(`Request status updated to ${params.status}`);
      return res.data || res;
    } catch (e: any) {
      const msg = resolveApiErrorMessage(e, "Error updating status");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteSkipRequest = createAsyncThunk(
  'employeeLoanSkipRequest/delete',
  async (id: number, thunkAPI) => {
    try {
      await apiService.delete(`/employee-loan/skip-request/${id}`);
      toast.success("Request deleted successfully");
      return id;
    } catch (e: any) {
      const msg = resolveApiErrorMessage(e, "Error deleting request");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const employeeLoanSkipRequestSlice = createSlice({
  name: 'employeeLoanSkipRequest',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSkipRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSkipRequests.fulfilled, (state, action) => {
        state.skipRequestList = action.payload;
        state.loading = false;
      })
      .addCase(getSkipRequests.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createSkipRequest.fulfilled, (state, action) => {
        state.skipRequestList.push(action.payload);
      })
      .addCase(updateSkipRequestStatus.fulfilled, (state, action) => {
        const index = state.skipRequestList.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.skipRequestList[index] = action.payload;
        }
      })
      .addCase(deleteSkipRequest.fulfilled, (state, action) => {
        state.skipRequestList = state.skipRequestList.filter(item => item.id !== action.payload);
      });
  },
});

export default employeeLoanSkipRequestSlice.reducer;
