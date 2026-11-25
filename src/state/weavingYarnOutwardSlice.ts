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

interface WeavingYarnOutwardState {
  loading: boolean;
  error: string | null;
  list: any[];
  pagination: PaginationState;
  currentRecord: any | null;
  lastResult: any | null;
}

const initialState: WeavingYarnOutwardState = {
  loading: false,
  error: null,
  list: [],
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

const BASE_PATH = "/weaving-yarn-outward";


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
    const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    if (!stored) return null;
    const numeric = Number(stored);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    const parsed = JSON.parse(stored);
    const parsedId = parsed?.id ?? parsed?.companyId;
    if (parsedId == null) return null;
    const parsedNumber = Number(parsedId);
    return Number.isFinite(parsedNumber) ? parsedNumber : null;
  } catch {
    return null;
  }
};

const extractArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.data) return extractArray(payload.data);
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

interface ListParams {
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  companyId?: number;
}

export const getAllWeavingYarnOutward = createAsyncThunk(
  "weavingYarnOutward/getAll",
  async (params: ListParams = {}, thunkAPI) => {
    try {
      const { limit = 10, offset = 0, fetchAll = false, companyId } = params;
      const queryParams = new URLSearchParams();
      queryParams.append("limit", fetchAll ? "10000" : String(limit));
      queryParams.append("offset", fetchAll ? "0" : String(offset));
      const queryString = queryParams.toString();
      const resolvedCompanyId = companyId ?? resolveSelectedCompanyId();
      const baseUrl = resolvedCompanyId ? `${BASE_PATH}/factory/${resolvedCompanyId}` : BASE_PATH;
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
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
      return thunkAPI.rejectWithValue(error.message || "Failed to load weaving yarn outward records");
    }
  },
);

export const getWeavingYarnOutwardById = createAsyncThunk(
  "weavingYarnOutward/getById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`${BASE_PATH}/${id}`);
      return response?.data || response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch record");
    }
  },
);

export const createWeavingYarnOutward = createAsyncThunk(
  "weavingYarnOutward/create",
  async (payload: any, thunkAPI) => {
    try {
      const response = await apiService.post(BASE_PATH, payload);
      if (response?.message || response?.status === "success") {
        toast.success(response?.message || "Weaving Yarn Outward saved");
      }
      return response;
    } catch (error: any) {
      const errorMessage = resolveApiErrorMessage(error, "Failed to create Weaving Yarn Outward");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
      // toast.error(error.message || "Failed to save Weaving Yarn Outward");
      // return thunkAPI.rejectWithValue(error.message || "Failed to save Weaving Yarn Outward");
    }
  },
);

export const updateWeavingYarnOutward = createAsyncThunk(
  "weavingYarnOutward/update",
  async ({ id, data, companyId }: { id: number; data: any; companyId?: number }, thunkAPI) => {
    try {
      const resolvedCompanyId = companyId ?? resolveSelectedCompanyId();
      const endpoint = resolvedCompanyId
        ? `${BASE_PATH}/factory/${resolvedCompanyId}/${id}`
        : `${BASE_PATH}/${id}`;
      const response = await apiService.put(endpoint, data);
      if (response?.message || response?.status === "success") {
        toast.success(response?.message || "Weaving Yarn Outward updated");
      }
      return response;
    } catch (error: any) {
      toast.error(error.message || "Failed to update Weaving Yarn Outward");
      return thunkAPI.rejectWithValue(error.message || "Failed to update Weaving Yarn Outward");
    }
  },
);

export const deleteWeavingYarnOutward = createAsyncThunk(
  "weavingYarnOutward/delete",
  async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
    try {
      const resolvedCompanyId = companyId ?? resolveSelectedCompanyId();
      const endpoint = resolvedCompanyId
        ? `${BASE_PATH}/factory/${resolvedCompanyId}/${id}`
        : `${BASE_PATH}/${id}`;
      const response = await apiService.delete(endpoint);
      if (response?.message || response?.status === "success") {
        toast.success(response?.message || "Weaving Yarn Outward deleted");
      }
      return id;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete Weaving Yarn Outward");
      return thunkAPI.rejectWithValue(error.message || "Failed to delete Weaving Yarn Outward");
    }
  },
);

const weavingYarnOutwardSlice = createSlice({
  name: "weavingYarnOutward",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllWeavingYarnOutward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllWeavingYarnOutward.fulfilled,
        (state, action: PayloadAction<{ data: any[]; pagination: PaginationState }>) => {
          state.loading = false;
          state.list = action.payload?.data || [];
          state.pagination = action.payload?.pagination || state.pagination;
        },
      )
      .addCase(getAllWeavingYarnOutward.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to load Weaving Yarn Outward";
      })
      .addCase(getWeavingYarnOutwardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWeavingYarnOutwardById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.currentRecord = action.payload;
      })
      .addCase(getWeavingYarnOutwardById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch record";
      })
      .addCase(createWeavingYarnOutward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWeavingYarnOutward.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.lastResult = action.payload;
      })
      .addCase(createWeavingYarnOutward.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to save Weaving Yarn Outward";
      })
      .addCase(updateWeavingYarnOutward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWeavingYarnOutward.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload?.data || action.payload;
        if (updated?.id != null) {
          state.list = state.list.map((entry) =>
            String(entry?.id) === String(updated.id) ? { ...entry, ...updated } : entry,
          );
          state.currentRecord = { ...(state.currentRecord || {}), ...updated };
        }
      })
      .addCase(updateWeavingYarnOutward.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update Weaving Yarn Outward";
      })
      .addCase(deleteWeavingYarnOutward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWeavingYarnOutward.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.list = state.list.filter((entry) => String(entry?.id) !== String(action.payload));
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteWeavingYarnOutward.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete Weaving Yarn Outward";
      });
  },
});

export default weavingYarnOutwardSlice.reducer;
