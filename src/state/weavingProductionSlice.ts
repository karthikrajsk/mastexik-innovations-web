import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import apiService from "@/services/ApiService";

interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

interface WeavingProductionState {
  loading: boolean;
  error: string | null;
  weavingProductionList: any[];
  pagination: PaginationState;
  currentRecord: any | null;
  lastResult: any | null;
}

const initialPagination: PaginationState = {
  total: 0,
  limit: 10,
  offset: 0,
  next: false,
  prev: false,
};

const initialState: WeavingProductionState = {
  loading: false,
  error: null,
  weavingProductionList: [],
  pagination: { ...initialPagination },
  currentRecord: null,
  lastResult: null,
};

const resolveSelectedCompanyId = (): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const extractArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data?.data)) return payload.data.data;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.results)) return payload.results;
    if (payload.data) return extractArray(payload.data);
  }
  return [];
};

const resolvePagination = (
  payload: any,
  fallback: PaginationState,
): PaginationState => {
  const source = payload?.pagination || payload?.data?.pagination || payload?.data;
  return {
    total: source?.total ?? fallback.total,
    limit: source?.limit ?? fallback.limit,
    offset: source?.offset ?? fallback.offset,
    next: source?.next ?? fallback.next,
    prev: source?.prev ?? fallback.prev,
  };
};

export const getAllWeavingProductions = createAsyncThunk(
  "weavingProduction/getAll",
  async (
    params: { limit?: number; offset?: number; fetchAll?: boolean; companyId?: number } = {},
    thunkAPI,
  ) => {
    try {
      const { limit = 10000, offset = 0, fetchAll = false, companyId } = params;
      const resolvedCompanyId = companyId ?? resolveSelectedCompanyId();
      const effectiveLimit = fetchAll ? 10000 : limit;
      const effectiveOffset = fetchAll ? 0 : offset;
      const queryParams = new URLSearchParams();
      queryParams.append("limit", String(effectiveLimit));
      queryParams.append("offset", String(effectiveOffset));
      const basePath = resolvedCompanyId ? `/weaving-production/company/${resolvedCompanyId}` : "/weaving-production";
      const url = queryParams.toString() ? `${basePath}?${queryParams.toString()}` : basePath;
      const response = await apiService.get(url);
      const data = extractArray(response);
      const pagination = resolvePagination(response, {
        total: data.length,
        limit: effectiveLimit,
        offset: effectiveOffset,
        next: false,
        prev: effectiveOffset > 0,
      });
      return { data, pagination };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch weaving productions");
    }
  },
);

export const getWeavingProductionById = createAsyncThunk(
  "weavingProduction/getById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`/weaving-production/${id}`);
      return response?.data || response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch weaving production");
    }
  },
);

export const createWeavingProduction = createAsyncThunk(
  "weavingProduction/create",
  async (payload: any, thunkAPI) => {
    try {
      const response = await apiService.post("/weaving-production", payload);
      if (response?.status === "success" || response?.message) {
        toast.success(response?.message || "Weaving Production saved");
      }
      return response?.data || response;
    } catch (error: any) {
      toast.error(error.message || "Failed to create weaving production");
      return thunkAPI.rejectWithValue(error.message || "Failed to create weaving production");
    }
  },
);

export const updateWeavingProduction = createAsyncThunk(
  "weavingProduction/update",
  async (payload: { id: number; data: any; companyId?: number }, thunkAPI) => {
    try {
      const resolvedCompanyId = payload.companyId ?? resolveSelectedCompanyId();
      const endpoint = resolvedCompanyId
        ? `/weaving-production/company/${resolvedCompanyId}/${payload.id}`
        : `/weaving-production/${payload.id}`;
      const response = await apiService.put(endpoint, payload.data);
      if (response?.status === "success" || response?.message) {
        toast.success(response?.message || "Weaving Production updated");
      }
      return response?.data || response;
    } catch (error: any) {
      toast.error(error.message || "Failed to update weaving production");
      return thunkAPI.rejectWithValue(error.message || "Failed to update weaving production");
    }
  },
);

export const deleteWeavingProduction = createAsyncThunk(
  "weavingProduction/delete",
  async (payload: { id: number; companyId?: number }, thunkAPI) => {
    try {
      const resolvedCompanyId = payload.companyId ?? resolveSelectedCompanyId();
      const endpoint = resolvedCompanyId
        ? `/weaving-production/company/${resolvedCompanyId}/${payload.id}`
        : `/weaving-production/${payload.id}`;
      const response = await apiService.delete(endpoint);
      if (response?.status === "success" || response?.message) {
        toast.success(response?.message || "Weaving Production deleted");
      }
      return payload.id;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete weaving production");
      return thunkAPI.rejectWithValue(error.message || "Failed to delete weaving production");
    }
  },
);

export const importWeavingProductionTemplate = createAsyncThunk(
  "weavingProduction/import",
  async (payload: { rows: any[]; companyId?: number }, thunkAPI) => {
    try {
      const resolvedCompanyId = payload.companyId ?? resolveSelectedCompanyId();
      const endpoint = resolvedCompanyId
        ? `/weaving-production/company/${resolvedCompanyId}/import`
        : "/weaving-production/import";
      const response = await apiService.post(endpoint, { rows: payload.rows });
      if (response?.status === "success" || response?.message) {
        toast.success(response?.message || "Template imported successfully");
      }
      return response?.data || response;
    } catch (error: any) {
      toast.error(error.message || "Failed to import template");
      return thunkAPI.rejectWithValue(error.message || "Failed to import template");
    }
  },
);

const weavingProductionSlice = createSlice({
  name: "weavingProduction",
  initialState,
  reducers: {
    clearCurrentRecord(state) {
      state.currentRecord = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllWeavingProductions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllWeavingProductions.fulfilled, (state, action: PayloadAction<{ data: any[]; pagination: PaginationState }>) => {
        state.loading = false;
        state.weavingProductionList = action.payload?.data || [];
        state.pagination = action.payload?.pagination || state.pagination;
      })
      .addCase(getAllWeavingProductions.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to load weaving productions";
      })
      .addCase(getWeavingProductionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWeavingProductionById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.currentRecord = action.payload;
      })
      .addCase(getWeavingProductionById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch record";
      })
      .addCase(createWeavingProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWeavingProduction.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.lastResult = action.payload;
      })
      .addCase(createWeavingProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to save weaving production";
      })
      .addCase(updateWeavingProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWeavingProduction.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updatedRecord = action.payload?.data || action.payload;
        if (updatedRecord?.id) {
          state.weavingProductionList = state.weavingProductionList.map((entry) =>
            String(entry?.id) === String(updatedRecord.id) ? { ...entry, ...updatedRecord } : entry,
          );
          state.currentRecord = { ...(state.currentRecord || {}), ...updatedRecord };
        }
      })
      .addCase(updateWeavingProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update weaving production";
      })
      .addCase(deleteWeavingProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWeavingProduction.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.weavingProductionList = state.weavingProductionList.filter(
          (entry) => String(entry?.id) !== String(action.payload),
        );
      })
      .addCase(deleteWeavingProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete weaving production";
      })
      .addCase(importWeavingProductionTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importWeavingProductionTemplate.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.lastResult = action.payload;
      })
      .addCase(importWeavingProductionTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to import template";
      });
  },
});

export const { clearCurrentRecord } = weavingProductionSlice.actions;

export default weavingProductionSlice.reducer;
