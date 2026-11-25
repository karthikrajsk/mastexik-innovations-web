import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

interface WarpingProductionState {
  loading: boolean;
  error: string | null;
  warpingProductionList: any[];
  pagination: PaginationState;
  currentRecord: any;
  lastResult: any;
}

const initialState: WarpingProductionState = {
  loading: false,
  error: null,
  warpingProductionList: [],
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    next: false,
    prev: false,
  },
  currentRecord: null,
  lastResult: null,
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
  fallback: { total: number; limit: number; offset: number; next: boolean; prev: boolean },
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

export const getAllWarpingProductions = createAsyncThunk(
  "warpingProduction/getAll",
  async (
    params: { limit?: number; offset?: number; fetchAll?: boolean; companyId?: number } = {},
    thunkAPI,
  ) => {
    try {
      const { limit = 10, offset = 0, fetchAll = false, companyId } = params;
      const queryParams = new URLSearchParams();
      queryParams.append("limit", fetchAll ? "10000" : String(limit));
      queryParams.append("offset", fetchAll ? "0" : String(offset));
      const queryString = queryParams.toString();
      const resolvedCompanyId = companyId ?? resolveSelectedCompanyId();
      const basePath = resolvedCompanyId ? `/warping-production/company/${resolvedCompanyId}` : "/warping-production";
      const url = queryString ? `${basePath}?${queryString}` : basePath;
      const response = await apiService.get(url);
      const data = extractArray(response);
      const pagination = resolvePagination(response, {
        total: data.length,
        limit: fetchAll ? 10000 : limit,
        offset: fetchAll ? 0 : offset,
        next: false,
        prev: offset > 0,
      });
      return { data, pagination };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch Warping Production records");
    }
  },
);

export const getWarpingProductionById = createAsyncThunk(
  "warpingProduction/getById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`/warping-production/${id}`);
      return response?.data || response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch Warping Production");
    }
  },
);

export const createWarpingProduction = createAsyncThunk(
  "warpingProduction/create",
  async (payload: any, thunkAPI) => {
    try {
      const response = await apiService.post("/warping-production", payload);
      if (response?.status === "success" || response?.message) {
        toast.success(response?.message || "Warping Production saved");
      }
      return response?.data || response;
    } catch (error: any) {
    
    const errorMessage = resolveApiErrorMessage(error, "Failed to create Warping Production");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
      // toast.error(error.message || "Failed to create Warping Production");
      // return thunkAPI.rejectWithValue(error.message || "Failed to create Warping Production");
    }
  },
);

export const updateWarpingProduction = createAsyncThunk(
  "warpingProduction/update",
  async (payload: { id: number; data: any; companyId?: number }, thunkAPI) => {
    try {
      const resolvedCompanyId = payload.companyId ?? resolveSelectedCompanyId();
      const endpoint = resolvedCompanyId ? `/warping-production/company/${resolvedCompanyId}/${payload.id}` : `/warping-production/${payload.id}`;
      const response = await apiService.put(endpoint, payload.data);
      if (response?.status === "success" || response?.message) {
        toast.success(response?.message || "Warping Production updated");
      }
      return response?.data || response;
    } catch (error: any) {
      toast.error(error.message || "Failed to update Warping Production");
      return thunkAPI.rejectWithValue(error.message || "Failed to update Warping Production");
    }
  },
);

export const deleteWarpingProduction = createAsyncThunk(
  "warpingProduction/delete",
  async (payload: { id: number; companyId?: number }, thunkAPI) => {
    try {
      const resolvedCompanyId = payload.companyId ?? resolveSelectedCompanyId();
      const endpoint = resolvedCompanyId ? `/warping-production/company/${resolvedCompanyId}/${payload.id}` : `/warping-production/${payload.id}`;
      const response = await apiService.delete(endpoint);
      if (response?.status === "success" || response?.message) {
        toast.success(response?.message || "Warping Production deleted");
      }
      return payload.id;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete Warping Production");
      return thunkAPI.rejectWithValue(error.message || "Failed to delete Warping Production");
    }
  },
);

const warpingProductionSlice = createSlice({
  name: "warpingProduction",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllWarpingProductions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllWarpingProductions.fulfilled, (state, action: PayloadAction<{ data: any[]; pagination: PaginationState }>) => {
        state.loading = false;
        state.warpingProductionList = action.payload?.data || [];
        state.pagination = action.payload?.pagination || state.pagination;
      })
      .addCase(getAllWarpingProductions.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to load Warping Production";
      })
      .addCase(getWarpingProductionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWarpingProductionById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.currentRecord = action.payload;
      })
      .addCase(getWarpingProductionById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch record";
      })
      .addCase(createWarpingProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWarpingProduction.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.lastResult = action.payload;
      })
      .addCase(createWarpingProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to save Warping Production";
      })
      .addCase(updateWarpingProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWarpingProduction.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updatedRecord = action.payload?.data || action.payload;
        if (updatedRecord?.id) {
          state.warpingProductionList = state.warpingProductionList.map((entry) =>
            String(entry?.id) === String(updatedRecord.id) ? { ...entry, ...updatedRecord } : entry,
          );
          state.currentRecord = { ...(state.currentRecord || {}), ...updatedRecord };
        }
      })
      .addCase(updateWarpingProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update Warping Production";
      })
      .addCase(deleteWarpingProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWarpingProduction.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.warpingProductionList = state.warpingProductionList.filter((entry) => String(entry?.id) !== String(action.payload));
      })
      .addCase(deleteWarpingProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete Warping Production";
      });
  },
});

export default warpingProductionSlice.reducer;
