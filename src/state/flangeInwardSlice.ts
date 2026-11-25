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

export interface FlangeInwardState {
  loading: boolean;
  error: string | null;
  list: any[];
  current?: any | null;
  createResult?: any | null;
  pagination: PaginationState;
}

const initialState: FlangeInwardState = {
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

// Base endpoint for this resource (controller @RequestMapping("/api/flange-inward"))
const BASE = "/flange-inward";

const mapApiResponse = (response: any, limit: number, offset: number) => {
  const payload = response?.data ?? response ?? {};
  const rawData = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.rows)
      ? payload.rows
      : Array.isArray(payload)
        ? payload
        : [];

  const paginationSource = (() => {
    if (payload?.pagination && typeof payload.pagination === "object") return payload.pagination;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) return payload;
    return {};
  })();

  const resolvedTotal = typeof paginationSource.total === "number" ? paginationSource.total : rawData.length;
  const resolvedLimit = typeof paginationSource.limit === "number" ? paginationSource.limit : limit;
  const resolvedOffset = typeof paginationSource.offset === "number" ? paginationSource.offset : offset;
  const resolvedNext = typeof paginationSource.next === "boolean"
    ? paginationSource.next
    : resolvedOffset + resolvedLimit < resolvedTotal;
  const resolvedPrev = typeof paginationSource.prev === "boolean"
    ? paginationSource.prev
    : resolvedOffset > 0;

  return {
    data: rawData,
    pagination: {
      total: resolvedTotal,
      limit: resolvedLimit,
      offset: resolvedOffset,
      next: resolvedNext,
      prev: resolvedPrev,
    },
  };
};

// GET /factory-beam-inward
export const getAllFlangeInwards = createAsyncThunk(
  "flangeInward/getAllFlangeInwards",
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
export const getFlangeInwardsByFactoryCompanyId = createAsyncThunk(
  "flangeInward/getByFactoryCompanyId",
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
export const getFlangeInwardById = createAsyncThunk(
  "flangeInward/getFlangeInwardById",
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
export const createFlangeInward = createAsyncThunk(
  "flangeInward/createFlangeInward",
  async (data: any, thunkAPI) => {
    try {
      const response = await apiService.post(`${BASE}`, data);
      toast.success("Saved Successfully!");
      return response;
    } catch (error: any) {
      const msg = error.message || "Create failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// PUT /factory-beam-inward/{id}
export const updateFlangeInward = createAsyncThunk(
  "flangeInward/updateFlangeInward",
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


const extractErrorMessage = (error: any) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Failed to delete category';

// DELETE /factory-beam-inward/{id}
export const deleteFlangeInward = createAsyncThunk(
  "flangeInward/deleteFlangeInward",
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
       const message = extractErrorMessage(error);
                                                      toast.error(message);
                                                      return thunkAPI.rejectWithValue(message);
      // const msg = error?.response?.data?.message || error.message || "Delete failed";
      // toast.error(msg);
      // return thunkAPI.rejectWithValue(msg);
    }
  }
);

const flangeInwardSlice = createSlice({
  name: "flangeInward",
  initialState,
  reducers: {
    clearFlangeInwardCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getAll
      .addCase(getAllFlangeInwards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllFlangeInwards.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.list = payload.data || [];
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getAllFlangeInwards.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getFlangeInwardsByFactoryCompanyId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFlangeInwardsByFactoryCompanyId.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.list = payload.data || [];
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getFlangeInwardsByFactoryCompanyId.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // getById
      .addCase(getFlangeInwardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFlangeInwardById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getFlangeInwardById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // create
      .addCase(createFlangeInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFlangeInward.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.createResult = action.payload;
        state.pagination.total = (state.pagination.total || 0) + 1;
        // Optionally push to list if API returns the created entity with id
        if (action.payload && action.payload.id) {
          state.list = [action.payload, ...state.list];
        }
      })
      .addCase(createFlangeInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // update
      .addCase(updateFlangeInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFlangeInward.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload?.data || action.payload;
        state.list = state.list.map((x: any) => (x.id === updated?.id ? updated : x));
      })
      .addCase(updateFlangeInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // delete
      .addCase(deleteFlangeInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFlangeInward.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const deletedId = action.payload;
        state.list = state.list.filter((item: any) => item.id !== deletedId);
        state.pagination.total = Math.max(0, (state.pagination.total || 0) - 1);
      })
      .addCase(deleteFlangeInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearFlangeInwardCurrent } = flangeInwardSlice.actions;
export default flangeInwardSlice.reducer;