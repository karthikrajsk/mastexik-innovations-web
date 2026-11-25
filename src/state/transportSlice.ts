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

export interface TransportState {
    loading: boolean;
    error: string | null;
    transportList: any[];
    pagination: PaginationState;
}

const initialState: TransportState = {
    loading: false,
    error: null,
    transportList: [],
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
    const candidates: string[] = [];

    if (typeof responseData === "string") {
        candidates.push(responseData);
    } else if (responseData) {
        if (typeof responseData.message === "string") {
            candidates.push(responseData.message);
        }
        if (typeof responseData.error === "string") {
            candidates.push(responseData.error);
        }
        if (typeof responseData.data === "string") {
            candidates.push(responseData.data);
        }
        if (responseData.data && typeof responseData.data === "object") {
            if (typeof responseData.data.message === "string") {
                candidates.push(responseData.data.message);
            }
            if (typeof responseData.data.error === "string") {
                candidates.push(responseData.data.error);
            }
            if (Array.isArray(responseData.data.errors)) {
                responseData.data.errors.forEach((err: any) => {
                    if (typeof err === "string") {
                        candidates.push(err);
                    } else if (typeof err?.message === "string") {
                        candidates.push(err.message);
                    }
                });
            }
        }
        if (Array.isArray(responseData.errors)) {
            responseData.errors.forEach((err: any) => {
                if (typeof err === "string") {
                    candidates.push(err);
                } else if (typeof err?.message === "string") {
                    candidates.push(err.message);
                }
            });
        }
    }

    const candidate = candidates.find((msg) => typeof msg === "string" && msg.trim());
    return candidate || error?.message || fallback;
};


export const getAllTransports = createAsyncThunk(
  'transport/getAllTransports',
  async (
    params: { limit?: number; offset?: number; fetchAll?: boolean } = {},
    thunkAPI
  ) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.fetchAll) {
        queryParams.append('limit', '10000');
        queryParams.append('offset', '0');
      } else {
        if (params.limit !== undefined)
          queryParams.append('limit', String(params.limit));
        if (params.offset !== undefined)
          queryParams.append('offset', String(params.offset));
      }

      const queryString = queryParams.toString();
      const url = queryString ? `/transport?${queryString}` : `/transport`;

      const response = await apiService.get(url);

      const paginationData = response?.data;

      // Keep existing flexible data handling
      const data = Array.isArray(paginationData)
        ? paginationData
        : Array.isArray(paginationData?.data)
        ? paginationData.data
        : [];

      return {
        data,
        pagination: {
          total:
            paginationData?.total ??
            paginationData?.pagination?.total ??
            data.length,
          limit:
            paginationData?.limit ??
            paginationData?.pagination?.limit ??
            params.limit ??
            10,
          offset:
            paginationData?.offset ??
            paginationData?.pagination?.offset ??
            params.offset ??
            0,
          next:
            paginationData?.next ??
            paginationData?.pagination?.next ??
            false,
          prev:
            paginationData?.prev ??
            paginationData?.pagination?.prev ??
            false,
        },
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);


export const createTransport: any = createAsyncThunk(
    'transport/createTransport',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/transport", params);
            if (response?.status === 'success') {
                toast.success(response?.message || "Transport created successfully");
                return response.data;
            } else {
                     const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                       toast.error(errorMessage);
                       return thunkAPI.rejectWithValue(errorMessage)
            }
        } catch (error: any) {
           const errorMessage = resolveApiErrorMessage(error, "Failed to create category");
                       toast.error(errorMessage);
                       return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const updateTransport: any = createAsyncThunk(
    'transport/updateTransport',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.put(`/transport/${params.id}`, params);
            if (response?.status === 'success') {
                toast.success(response?.message || "Transport updated successfully");
                return response.data;
            } else {
                return thunkAPI.rejectWithValue("Something went wrong");
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to create category");
                       toast.error(errorMessage);
                       return thunkAPI.rejectWithValue(errorMessage);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const deleteTransport = createAsyncThunk(
    'transport/deleteTransport',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/transport/${id}`);
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

const transportSlice = createSlice({
    name: "transport",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllTransports.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllTransports.fulfilled, (state, action) => {
                state.loading = false;
                state.transportList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllTransports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createTransport.pending, (state) => {
                state.loading = true;
            })
            .addCase(createTransport.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createTransport.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateTransport.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateTransport.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(updateTransport.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteTransport.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteTransport.fulfilled, (state, action) => {
                state.loading = false;
                state.transportList = state.transportList.filter(t => t.id !== action.payload);
            })
            .addCase(deleteTransport.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default transportSlice.reducer;
