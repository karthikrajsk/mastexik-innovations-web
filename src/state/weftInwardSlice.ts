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

interface WeftInwardState {
  loading: boolean;
  error: string | null;
  list: any[];
  current?: any | null;
  createResult?: any | null;
  pagination: PaginationState;
}

const initialState: WeftInwardState = {
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

const BASE = "/weft-inward";

const extractDataArray = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.data && payload.data !== payload) {
    return extractDataArray(payload.data);
  }
  return [];
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

const resolvePaginationMeta = (payload: any): any => {
  if (!payload || typeof payload !== "object") return null;
  if (payload?.pagination) return resolvePaginationMeta(payload.pagination);
  const hasTotals =
    Object.prototype.hasOwnProperty.call(payload, "total") ||
    Object.prototype.hasOwnProperty.call(payload, "limit") ||
    Object.prototype.hasOwnProperty.call(payload, "offset");
  if (hasTotals) return payload;
  if (payload?.data && payload.data !== payload) {
    return resolvePaginationMeta(payload.data);
  }
  return null;
};

const toNumberOrFallback = (value: any, fallback: number) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const mapApiResponse = (response: any, limit: number, offset: number) => {
  const source = response?.data ?? response;
  const rawData = extractDataArray(source);
  const paginationSource = resolvePaginationMeta(source);
  const resolvedLimit = toNumberOrFallback(paginationSource?.limit, limit);
  const resolvedOffset = toNumberOrFallback(paginationSource?.offset, offset);
  const total = toNumberOrFallback(paginationSource?.total, rawData.length);
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

export const getWeftInwardsByFactoryCompanyId = createAsyncThunk(
  "weftInward/getByFactoryCompanyId",
  async (
    payload: number | { companyId: number; limit?: number; offset?: number; fetchAll?: boolean },
    thunkAPI
  ) => {
    try {
      const params = typeof payload === "number" ? { companyId: payload } : payload;
      const companyId = params?.companyId;
      if (!companyId && companyId !== 0) {
        throw new Error("companyId is required");
      }
      const baseLimit = params?.limit ?? 10000;
      const baseOffset = params?.offset ?? 0;
      const shouldFetchAll = params?.fetchAll ?? (params?.limit === undefined && params?.offset === undefined);
      const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
      const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

      const queryParams = new URLSearchParams();
      queryParams.append("limit", String(effectiveLimit));
      queryParams.append("offset", String(effectiveOffset));
      const queryString = queryParams.toString();

      const response = await apiService.get(`${BASE}/factory/${companyId}${queryString ? `?${queryString}` : ""}`);
      return mapApiResponse(response, effectiveLimit, effectiveOffset);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load");
    }
  }
);

export const getAllWeftInwards = createAsyncThunk(
  "weftInward/getAllWeftInwards",
  async (params: { limit?: number; offset?: number; fetchAll?: boolean } | undefined, thunkAPI) => {
    try {
      const baseLimit = params?.limit ?? 10000;
      const baseOffset = params?.offset ?? 0;
      const shouldFetchAll = params?.fetchAll ?? (params?.limit === undefined && params?.offset === undefined);
      const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
      const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

      const queryParams = new URLSearchParams();
      queryParams.append("limit", String(effectiveLimit));
      queryParams.append("offset", String(effectiveOffset));
      const queryString = queryParams.toString();

      const response = await apiService.get(`${BASE}${queryString ? `?${queryString}` : ""}`);
      return mapApiResponse(response, effectiveLimit, effectiveOffset);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load");
    }
  }
);

export const getWeftInwardById = createAsyncThunk(
  "weftInward/getWeftInwardById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`${BASE}/${id}`);
      return response?.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load record");
    }
  }
);

export const createWeftInward = createAsyncThunk(
  "weftInward/createWeftInward",
  async (data: any, thunkAPI) => {
    try {
      const response = await apiService.post(`${BASE}`, data);
      toast.success("Saved Successfully!");
      return response?.data;
    } catch (error: any) {
      

    const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
      // const msg = error.message || "Create failed";
      // toast.error(msg);
      // return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateWeftInward = createAsyncThunk(
  "weftInward/updateWeftInward",
  async ({ id, data, factoryCompanyId }: { id: number; data: any; factoryCompanyId?: number }, thunkAPI) => {
    try {
      const url = factoryCompanyId ? `${BASE}/${id}?factoryCompanyId=${factoryCompanyId}` : `${BASE}/${id}`;
      const response = await apiService.put(url, data);
      toast.success("Updated successfully!");
      return response?.data;
    } catch (error: any) {
      const msg = error.message || "Update failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteWeftInward = createAsyncThunk(
  "weftInward/deleteWeftInward",
  async (payload: number | { id: number; factoryCompanyId?: number }, thunkAPI) => {
    try {
      const { id, factoryCompanyId } = typeof payload === 'number' ? { id: payload, factoryCompanyId: undefined } : payload;
      const url = factoryCompanyId ? `${BASE}/${id}?factoryCompanyId=${factoryCompanyId}` : `${BASE}/${id}`;
      const response = await apiService.delete(url);
      if (response?.status === "success") {
        toast.success("Successfully deleted");
        return id;
      }
      toast.success("Successfully deleted");
      return id;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Delete failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const weftInwardSlice = createSlice({
  name: "weftInward",
  initialState,
  reducers: {
    clearWeftInwardCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllWeftInwards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllWeftInwards.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.list = payload.data || [];
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getAllWeftInwards.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getWeftInwardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWeftInwardById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getWeftInwardById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createWeftInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWeftInward.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.createResult = action.payload;
        state.pagination.total = (state.pagination.total || 0) + 1;
        if (action.payload && action.payload.id) {
          state.list = [action.payload, ...state.list];
        }
      })
      .addCase(createWeftInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateWeftInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWeftInward.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload;
        state.list = state.list.map((x: any) => (x.id === updated.id ? updated : x));
      })
      .addCase(updateWeftInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteWeftInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWeftInward.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const deletedId = action.payload;
        state.list = state.list.filter((item: any) => item.id !== deletedId);
        state.pagination.total = Math.max(0, (state.pagination.total || 0) - 1);
      })
      .addCase(deleteWeftInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getWeftInwardsByFactoryCompanyId.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(getWeftInwardsByFactoryCompanyId.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.list = payload.data || [];
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getWeftInwardsByFactoryCompanyId.rejected, (state, action: any) => {
        state.loading = false; state.error = action.payload as string;
      });
  },
});

export const { clearWeftInwardCurrent } = weftInwardSlice.actions;
export default weftInwardSlice.reducer;
