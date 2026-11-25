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

interface BeamGaitingState {
  loading: boolean;
  error: string | null;
  list: any[];
  current?: any | null;
  createResult?: any | null;
  pagination: PaginationState;
}

const initialState: BeamGaitingState = {
  loading: false,
  error: null,
  list: [],
  current: null,
  createResult: null,
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    next: false,
    prev: false,
  },
};

const BASE = "/beam-gating";

const mapApiResponse = (response: any, limit: number, offset: number) => {
  const rawData = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data?.rows)
      ? response.data.rows
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

  const paginationSource = response?.data?.pagination;
  const total = paginationSource?.total ?? rawData.length;
  const resolvedOffset = paginationSource?.offset ?? offset;
  const resolvedLimit = paginationSource?.limit ?? limit;
  const nextOffset = resolvedOffset + resolvedLimit;

  return {
    data: rawData,
    pagination: {
      total,
      limit: resolvedLimit,
      offset: resolvedOffset,
      next: nextOffset < total,
      prev: resolvedOffset > 0,
    },
  };
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


export const getAllBeamGaitings = createAsyncThunk(
  "beamGaiting/getAllBeamGaitings",
  async (args: { companyId?: number; limit?: number; offset?: number; fetchAll?: boolean } | undefined, thunkAPI) => {
    try {
      const companyId = args?.companyId;
      const baseLimit = args?.limit ?? 10000;
      const baseOffset = args?.offset ?? 0;
      const shouldFetchAll = args?.fetchAll ?? (args?.limit === undefined && args?.offset === undefined);
      const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
      const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

      const queryParams = new URLSearchParams();
      queryParams.append("limit", String(effectiveLimit));
      queryParams.append("offset", String(effectiveOffset));
      const queryString = queryParams.toString();

      const baseUrl = companyId != null ? `${BASE}/company/${companyId}` : `${BASE}`;
      const response = await apiService.get(`${baseUrl}${queryString ? `?${queryString}` : ""}`);
      return mapApiResponse(response, effectiveLimit, effectiveOffset);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load");
    }
  }
);

export const getBeamGaitingById = createAsyncThunk(
  "beamGaiting/getBeamGaitingById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`${BASE}/${id}`);
      return response?.data?.data ?? response?.data ?? response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load record");
    }
  }
);

export const createBeamGaiting = createAsyncThunk(
  "beamGaiting/createBeamGaiting",
  async (data: any, thunkAPI) => {
    try {
      const response = await apiService.post(`${BASE}`, data);
      toast.success("Saved Successfully!");
      return response?.data?.data ?? response?.data ?? response;
    } catch (error: any) {
      const errorMessage = resolveApiErrorMessage(error, "Failed to create Beam Gaiting");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
      // const msg = error.message || "Create failed";
      // toast.error(msg);
      // return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateBeamGaiting = createAsyncThunk(
  "beamGaiting/updateBeamGaiting",
  async ({ id, data, companyId }: { id: number; data: any; companyId?: number }, thunkAPI) => {
    try {
      const url = companyId != null ? `${BASE}/company/${companyId}/${id}` : `${BASE}/${id}`;
      const response = await apiService.put(url, data);
      toast.success("Updated successfully!");
      return response?.data?.data ?? response?.data ?? response;
    } catch (error: any) {
      const msg = error.message || "Update failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteBeamGaiting = createAsyncThunk(
  "beamGaiting/deleteBeamGaiting",
  async (args: { id: number; companyId?: number }, thunkAPI) => {
    try {
      const { id, companyId } = args;
      const url = companyId != null ? `${BASE}/company/${companyId}/${id}` : `${BASE}/${id}`;
      const response = await apiService.delete(url);
      toast.success("Successfully deleted");
      return id;
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, "Delete failed");
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const beamGaitingSlice = createSlice({
  name: "beamGaiting",
  initialState,
  reducers: {
    clearBeamGaitingCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllBeamGaitings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBeamGaitings.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.list = payload.data || [];
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getAllBeamGaitings.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getBeamGaitingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBeamGaitingById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getBeamGaitingById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createBeamGaiting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBeamGaiting.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.createResult = action.payload;
        state.pagination.total = (state.pagination.total || 0) + 1;
        if ((action.payload as any)?.id) {
          state.list = [action.payload, ...state.list];
        }
      })
      .addCase(createBeamGaiting.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateBeamGaiting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBeamGaiting.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload;
        state.list = state.list.map((x: any) => (x.id === updated.id ? updated : x));
      })
      .addCase(updateBeamGaiting.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteBeamGaiting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBeamGaiting.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const deletedId = action.payload;
        state.list = state.list.filter((item: any) => item.id !== deletedId);
        state.pagination.total = Math.max(0, (state.pagination.total || 0) - 1);
      })
      .addCase(deleteBeamGaiting.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearBeamGaitingCurrent } = beamGaitingSlice.actions;
export default beamGaitingSlice.reducer;
