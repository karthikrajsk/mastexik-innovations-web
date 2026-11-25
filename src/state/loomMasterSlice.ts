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

export interface LoomState {
  loading: boolean;
  error: string | null;
  loomList: any;
  createLoomResult: any;
  checking: boolean;
  pagination: PaginationState;
}

const initialState: LoomState = {
  loading: false,
  error: null,
  loomList: [],
  createLoomResult: null,
  checking: false,
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

export const getAllLooms = createAsyncThunk(
  "loom-master/getAllLooms",
  async (params: { companyId?: number; limit?: number; offset?: number; fetchAll?: boolean } = {}, thunkAPI) => {
    try {
      const baseLimit = params.limit ?? 10000;
      const baseOffset = params.offset ?? 0;
      const shouldFetchAll = params.fetchAll ?? (params.limit === undefined && params.offset === undefined);
      const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
      const effectiveOffset = shouldFetchAll ? 0 : baseOffset;
      const { companyId } = params;
      const queryParams = new URLSearchParams();
      queryParams.append('limit', String(effectiveLimit));
      queryParams.append('offset', String(effectiveOffset));
      const baseUrl = companyId ? `/loom-master/company/${companyId}` : "/loom-master";
      const queryString = queryParams.toString();
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      const response = await apiService.get(url);

      const paginationData = response?.data;
      
      let rawData = [];
      // Most robust array extraction
      if (Array.isArray(paginationData?.data)) {
        rawData = paginationData.data;
      } else if (Array.isArray(paginationData?.data?.data)) {
        rawData = paginationData.data.data;
      } else if (Array.isArray(paginationData?.data?.rows)) {
        rawData = paginationData.data.rows;
      } else if (Array.isArray(paginationData?.rows)) {
        rawData = paginationData.rows;
      } else if (Array.isArray(paginationData)) {
        rawData = paginationData;
      }

      const total =
        paginationData?.total ??
        paginationData?.data?.total ??
        rawData.length;

      const resolvedLimit =
        paginationData?.limit ??
        paginationData?.data?.limit ??
        effectiveLimit;

      const resolvedOffset =
        paginationData?.offset ??
        paginationData?.data?.offset ??
        effectiveOffset;

      const nextOffset = resolvedOffset + resolvedLimit;

      const pagination = {
        total,
        limit: resolvedLimit,
        offset: resolvedOffset,
        next: paginationData?.next ?? paginationData?.data?.next ?? (nextOffset < total),
        prev: paginationData?.prev ?? paginationData?.data?.prev ?? (resolvedOffset > 0),
      };

      return { data: rawData, pagination };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createLoom: any = createAsyncThunk(
  "loom-master/createLoom",
  async (params: any, thunkAPI) => {
    try {
      const response = await apiService.post("/loom-master", params);
      if (response?.status === "success") {
        toast.success(response?.message || "Saved Successfully");
        return response;
      } else {
         const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage)
      }
    } catch (error: any) {
        const errorMessage = resolveApiErrorMessage(error, "Failed to create loom");
                  toast.error(errorMessage);
                  return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const updateLoom: any = createAsyncThunk(
  "loom-master/updateLoom",
  async (params: any, thunkAPI) => {
    try {
      const { id, companyId, ...data } = params || {};
      const url = companyId ? `/loom-master/company/${companyId}/${id}` : `/loom-master/${id}`;
      const response = await apiService.put(url, data);
      if (response?.status === "success") {
        toast.success(response?.message || "Updated Successfully");
        return response;
      } else {
         const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage)
      }
    } catch (error: any) {
      const errorMessage = resolveApiErrorMessage(error, "Failed to update loom");
                  toast.error(errorMessage);
                  return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const deleteLoom: any = createAsyncThunk(
  "loom-master/deleteLoom",
  async (payload: number | { id: number; companyId?: number }, thunkAPI) => {
    try {
      const { id, companyId } = typeof payload === 'number' ? { id: payload, companyId: undefined } : payload;
      const url = companyId ? `/loom-master/company/${companyId}/${id}` : `/loom-master/${id}`;
      const response = await apiService.delete(url);
      if (response?.status === "success") {
        toast.success(response?.message || "Successfully deleted");
        return id;
      } else {
        const errorMessage = "Something went wrong";
        return thunkAPI.rejectWithValue(errorMessage);
      }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const loomMasterSlice = createSlice({
  name: "loomMaster",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllLooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllLooms.fulfilled, (state: any, action) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.loomList = payload.data;
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getAllLooms.rejected, (state: any, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createLoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLoom.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.createLoomResult = action.payload;
      })
      .addCase(createLoom.rejected, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateLoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLoom.fulfilled, (state: any, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload?.data || action.payload;
        state.loomList = state.loomList.map((x: any) =>
          x.id === updated?.id ? updated : x
        );
      })
      .addCase(updateLoom.rejected, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteLoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLoom.fulfilled, (state: any, action) => {
        state.loading = false;
        const deleted = action.payload as any;
        const deletedId = typeof deleted === 'number' ? deleted : deleted?.id;
        if (typeof deletedId === 'number') {
          state.loomList = state.loomList.filter((x: any) => x.id !== deletedId);
          state.pagination.total = Math.max(0, state.pagination.total - 1);
        }
      })
      .addCase(deleteLoom.rejected, (state: any, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default loomMasterSlice.reducer;
