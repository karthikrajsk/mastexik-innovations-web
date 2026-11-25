import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

export interface PortState {
    loading: boolean;
    error: string | null;
    portList: any[];
    pagination: PaginationState;
}

const initialState: PortState = {
    loading: false,
    error: null,
    portList: [],
    pagination: {
      total: 0,
      limit: 10,
      offset: 0,
      next: false,
      prev: false,
    },
};

export const getAllPorts = createAsyncThunk(
    'port/getAllPorts',
    async (params: any = {}, thunkAPI) => {
        try {
            const { limit = 10, offset = 0, fetchAll = false } = params;
            const queryParams = new URLSearchParams();
            if (!fetchAll) {
                queryParams.append('limit', String(limit));
                queryParams.append('offset', String(offset));
            } else {
                queryParams.append('fetchAll', 'true');
            }
            const response = await apiService.get(`/port?${queryParams}`);
            const data = response?.data?.data;
            const pagination = response?.data?.pagination || {
              total: Array.isArray(data) ? data.length : 0,
              limit,
              offset,
              next: false,
              prev: false,
            };
            return { data: Array.isArray(data) ? data : [], pagination };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const createPort: any = createAsyncThunk(
    'port/createPort',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/port", params);
            if (response?.status === 'success') {
                toast.success(response?.message || "Port created successfully");
                return response.data;
            } else {
                return thunkAPI.rejectWithValue("Something went wrong");
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const updatePort: any = createAsyncThunk(
    'port/updatePort',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.put(`/port/${params.id}`, params);
            if (response?.status === 'success') {
                toast.success(response?.message || "Port updated successfully");
                return response.data;
            } else {
                return thunkAPI.rejectWithValue("Something went wrong");
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const deletePort = createAsyncThunk(
    'port/deletePort',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/port/${id}`);
            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return id;
            }
            const errorMessage = response.data?.message || 'Failed to delete';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            let errorMessage = 'An error occurred while deleting';
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            }
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

const portSlice = createSlice({
    name: "port",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllPorts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllPorts.fulfilled, (state, action) => {
                state.loading = false;
                state.portList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllPorts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createPort.pending, (state) => {
                state.loading = true;
            })
            .addCase(createPort.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createPort.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updatePort.pending, (state) => {
                state.loading = true;
            })
            .addCase(updatePort.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(updatePort.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deletePort.pending, (state) => {
                state.loading = true;
            })
            .addCase(deletePort.fulfilled, (state, action) => {
                state.loading = false;
                state.portList = state.portList.filter(port => port.id !== action.payload);
            })
            .addCase(deletePort.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default portSlice.reducer;
