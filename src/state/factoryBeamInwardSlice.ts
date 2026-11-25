import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

// Types can be refined to match your DTO
export interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

export interface FactoryBeamInwardState {
  loading: boolean;
  error: string | null;
  list: any[];
  current?: any | null;
  createResult?: any | null;
  pagination: PaginationState;
}

const initialState: FactoryBeamInwardState = {
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

// Base endpoint for this resource (controller @RequestMapping("/api/factory-beam-inward"))
const BASE = "/factory-beam-inward";

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


// GET /factory-beam-inward
export const getAllFactoryBeamInwards = createAsyncThunk(
  "factoryBeamInward/getAllFactoryBeamInwards",
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

// GET /factory-beam-inward/factory/{companyId}
export const getFactoryBeamInwardsByFactoryCompanyId = createAsyncThunk(
  "factoryBeamInward/getByFactoryCompanyId",
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

      const response = await apiService.get(
        `${BASE}/factory/${companyId}${queryString ? `?${queryString}` : ""}`
      );
      return mapApiResponse(response, effectiveLimit, effectiveOffset);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load");
    }
  }
);

// GET /factory-beam-inward/{id}
export const getFactoryBeamInwardById = createAsyncThunk(
  "factoryBeamInward/getFactoryBeamInwardById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`${BASE}/${id}`);
      return response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load record");
    }
  }
);

// POST /factory-beam-inward
export const createFactoryBeamInward = createAsyncThunk(
  "factoryBeamInward/createFactoryBeamInward",
  async (data: any, thunkAPI) => {
    try {
      const response = await apiService.post(`${BASE}`, data);
      toast.success("Saved Successfully!");
      return response;
    } catch (error: any) {
      const errorMessage = resolveApiErrorMessage(error, "Failed to create Factory Beam Inward");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
      // const msg = error.message || "Create failed";
      // toast.error(msg);
      // return thunkAPI.rejectWithValue(msg);
    }
  }
);

// PUT /factory-beam-inward/{id}
export const updateFactoryBeamInward = createAsyncThunk(
  "factoryBeamInward/updateFactoryBeamInward",
  async ({ id, data, factoryCompanyId }: { id: number; data: any; factoryCompanyId?: number }, thunkAPI) => {
    try {
      const url = factoryCompanyId ? `${BASE}/factory/${factoryCompanyId}/${id}` : `${BASE}/${id}`;
      const response = await apiService.put(url, data);
      toast.success("Updated successfully!");
      return response;
    } catch (error: any) {
      const msg = error.message || "Update failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// DELETE /factory-beam-inward/{id}
export const deleteFactoryBeamInward = createAsyncThunk(
  "factoryBeamInward/deleteFactoryBeamInward",
  async (payload: number | { id: number; factoryCompanyId?: number }, thunkAPI) => {
    try {
      const { id, factoryCompanyId } = typeof payload === 'number' ? { id: payload, factoryCompanyId: undefined } : payload;
      const url = factoryCompanyId ? `${BASE}/factory/${factoryCompanyId}/${id}` : `${BASE}/${id}`;
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

const factoryBeamInwardSlice = createSlice({
  name: "factoryBeamInward",
  initialState,
  reducers: {
    clearFactoryBeamInwardCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getAll
      .addCase(getAllFactoryBeamInwards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllFactoryBeamInwards.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.list = payload.data || [];
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getAllFactoryBeamInwards.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getFactoryBeamInwardsByFactoryCompanyId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFactoryBeamInwardsByFactoryCompanyId.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.list = payload.data || [];
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getFactoryBeamInwardsByFactoryCompanyId.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // getById
      .addCase(getFactoryBeamInwardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFactoryBeamInwardById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getFactoryBeamInwardById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // create
      .addCase(createFactoryBeamInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFactoryBeamInward.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.createResult = action.payload;
        state.pagination.total = (state.pagination.total || 0) + 1;
        // Optionally push to list if API returns the created entity with id
        if (action.payload && action.payload.id) {
          state.list = [action.payload, ...state.list];
        }
      })
      .addCase(createFactoryBeamInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // update
      .addCase(updateFactoryBeamInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFactoryBeamInward.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload?.data || action.payload;
        state.list = state.list.map((x: any) => (x.id === updated?.id ? updated : x));
      })
      .addCase(updateFactoryBeamInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // delete
      .addCase(deleteFactoryBeamInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFactoryBeamInward.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const deletedId = action.payload;
        state.list = state.list.filter((item: any) => item.id !== deletedId);
        state.pagination.total = Math.max(0, (state.pagination.total || 0) - 1);
      })
      .addCase(deleteFactoryBeamInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearFactoryBeamInwardCurrent } = factoryBeamInwardSlice.actions;
export default factoryBeamInwardSlice.reducer;