import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { documentNumberService } from "@/services/DocumentNumberService";

export interface NumberFormatConfiguration {
  id?: number;
  screenName: string;
  tabName?: string;
  prefix: string;
  financialYear: string;
  sequenceNumber: string;
  lastGeneratedSequence?: string;
  separator: string;
  formatPreview: string;
  activeFlag?: boolean;
}

export interface PaginationInfo {
  total: number;
  next: boolean;
  prev: boolean;
  offset: number;
  limit: number;
}

interface NumberFormatConfigurationState {
  loading: boolean;
  error: string | null;
  list: NumberFormatConfiguration[];
  paginationInfo: PaginationInfo;
  currentItem: NumberFormatConfiguration | null;
}

const initialState: NumberFormatConfigurationState = {
  loading: false,
  error: null,
  list: [],
  paginationInfo: {
    total: 0,
    next: false,
    prev: false,
    offset: 0,
    limit: 10
  },
  currentItem: null,
};

const resolveSelectedCompanyId = (): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const direct = window.localStorage.getItem("selectedCompanyId");
    if (direct) {
      const numeric = Number(direct);
      if (!Number.isNaN(numeric)) return numeric;
      const parsed = JSON.parse(direct);
      const parsedId = Number(parsed?.id ?? parsed?.companyId);
      if (!Number.isNaN(parsedId)) return parsedId;
    }
    const fallback = window.localStorage.getItem("selectedCompany");
    if (fallback) {
      const numeric = Number(fallback);
      if (!Number.isNaN(numeric)) return numeric;
      const parsed = JSON.parse(fallback);
      const parsedId = Number(parsed?.id ?? parsed?.companyId);
      if (!Number.isNaN(parsedId)) return parsedId;
    }
  } catch {
    return null;
  }
  return null;
};

const coerceNumber = (value: any, fallback: number) => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
};

const coerceBoolean = (value: any) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
};

const extractMetaPayload = (payload: any) => {
  if (
    payload?.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data) &&
    ("data" in payload.data || "total" in payload.data || "offset" in payload.data || "limit" in payload.data)
  ) {
    return payload.data;
  }
  return payload;
};

const extractConfigArray = (payload: any): NumberFormatConfiguration[] => {
  if (Array.isArray(payload)) return payload as NumberFormatConfiguration[];
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data?.data)) return payload.data.data as NumberFormatConfiguration[];
    if (Array.isArray(payload.data)) return payload.data as NumberFormatConfiguration[];
    if (payload.data) return extractConfigArray(payload.data);
    if (Array.isArray(payload.items)) return payload.items as NumberFormatConfiguration[];
    if (Array.isArray(payload.results)) return payload.results as NumberFormatConfiguration[];
  }
  return [];
};

const normalizeSingleConfig = (payload: any): NumberFormatConfiguration | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) return payload.data[0] || null;
    if (payload.data) return normalizeSingleConfig(payload.data);
    return payload as NumberFormatConfiguration;
  }
  return null;
};

// Get all number format configurations
export const getAllNumberFormatConfigurations = createAsyncThunk(
  "numberFormatConfiguration/getAllNumberFormatConfigurations",
  async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
    try {
      const offset = params.fetchAll ? 0 : (params.offset ?? 0);
      const limit = params.fetchAll ? 10000 : (params.limit ?? 10000);
      const queryParams = new URLSearchParams();
      queryParams.append('offset', String(offset));
      queryParams.append('limit', String(limit));
      const resolvedCompanyId = params.companyId ?? resolveSelectedCompanyId();
      const basePath = resolvedCompanyId
        ? `/number-format-configurations/company/${resolvedCompanyId}`
        : "/number-format-configurations";
      const queryString = queryParams.toString();
      const url = queryString ? `${basePath}?${queryString}` : basePath;
      const response = await apiService.get(url);
      const metaPayload = extractMetaPayload(response);
      const data = extractConfigArray(metaPayload);
      return {
        data,
        total: coerceNumber(metaPayload?.total, data.length),
        next: coerceBoolean(metaPayload?.next),
        prev: coerceBoolean(metaPayload?.prev),
        offset: coerceNumber(metaPayload?.offset, offset),
        limit: coerceNumber(metaPayload?.limit, limit)
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Get number format configuration by ID
export const getNumberFormatConfigurationById = createAsyncThunk(
  "numberFormatConfiguration/getNumberFormatConfigurationById",
  async (payload: number | { id: number; companyId?: number }, thunkAPI) => {
    try {
      const id = typeof payload === "number" ? payload : payload?.id;
      if (id == null) throw new Error("Invalid configuration id");
      const explicitCompanyId = typeof payload === "number" ? undefined : payload?.companyId;
      const resolvedCompanyId = explicitCompanyId ?? resolveSelectedCompanyId();
      const basePath = resolvedCompanyId
        ? `/number-format-configurations/company/${resolvedCompanyId}`
        : "/number-format-configurations";
      const response = await apiService.get(`${basePath}/${id}`);
      return normalizeSingleConfig(response);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Create number format configuration
export const createNumberFormatConfiguration = createAsyncThunk(
  "numberFormatConfiguration/createNumberFormatConfiguration",
  async (data: NumberFormatConfiguration, thunkAPI) => {
    try {
      const response = await apiService.post("/number-format-configurations", data);
      if (response?.status === "success") {
        documentNumberService.clearCache();
        return response?.data;
      }
      const msg = response?.message || "Something went wrong";
      return thunkAPI.rejectWithValue(msg);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to create configuration";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Update number format configuration
export const updateNumberFormatConfiguration = createAsyncThunk(
  "numberFormatConfiguration/updateNumberFormatConfiguration",
  async ({ id, data, companyId }: { id: number; data: NumberFormatConfiguration; companyId?: number }, thunkAPI) => {
    try {
      const resolvedCompanyId = companyId ?? resolveSelectedCompanyId();
      const basePath = resolvedCompanyId
        ? `/number-format-configurations/company/${resolvedCompanyId}`
        : "/number-format-configurations";
      const response = await apiService.put(`${basePath}/${id}`, data);
      if (response?.status === "success") {
        documentNumberService.clearCache();
        return response?.data;
      }
      const msg = response?.message || "Something went wrong";
      return thunkAPI.rejectWithValue(msg);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to update configuration";
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Delete number format configuration
export const deleteNumberFormatConfiguration = createAsyncThunk(
  "numberFormatConfiguration/deleteNumberFormatConfiguration",
  async (payload: number | { id: number; companyId?: number }, thunkAPI) => {
    try {
      const id = typeof payload === "number" ? payload : payload?.id;
      if (id == null) throw new Error("Invalid configuration id");
      const explicitCompanyId = typeof payload === "number" ? undefined : payload?.companyId;
      const resolvedCompanyId = explicitCompanyId ?? resolveSelectedCompanyId();
      const basePath = resolvedCompanyId
        ? `/number-format-configurations/company/${resolvedCompanyId}`
        : "/number-format-configurations";
      const response = await apiService.delete(`${basePath}/${id}`);
      if (response?.status === "success") {
        toast.success(response?.message || "Configuration deleted successfully");
        documentNumberService.clearCache();
        return id;
      }
      const msg = response?.message || "Something went wrong";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    } catch (error: any) {
      toast.error(error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);



const numberFormatConfigurationSlice = createSlice({
  name: "numberFormatConfiguration",
  initialState,
  reducers: {
    clearCurrentItem: (state) => {
      state.currentItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all
      .addCase(getAllNumberFormatConfigurations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllNumberFormatConfigurations.fulfilled, (state: any, action) => {
        state.loading = false;
        const { data, total, next, prev, offset, limit } = action.payload;
        state.list = Array.isArray(data) ? data : [];
        state.paginationInfo = { total, next, prev, offset, limit };
      })
      .addCase(getAllNumberFormatConfigurations.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get by ID
      .addCase(getNumberFormatConfigurationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNumberFormatConfigurationById.fulfilled, (state, action: PayloadAction<NumberFormatConfiguration | null>) => {
        state.loading = false;
        state.currentItem = action.payload || null;
      })
      .addCase(getNumberFormatConfigurationById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create
      .addCase(createNumberFormatConfiguration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNumberFormatConfiguration.fulfilled, (state, action: PayloadAction<NumberFormatConfiguration>) => {
        state.loading = false;
        if (action.payload) {
          state.list = [...state.list, action.payload];
        }
      })
      .addCase(createNumberFormatConfiguration.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update
      .addCase(updateNumberFormatConfiguration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNumberFormatConfiguration.fulfilled, (state, action: PayloadAction<NumberFormatConfiguration>) => {
        state.loading = false;
        const updated = action.payload;
        if (updated?.id) {
          state.list = state.list.map((item) =>
            item.id === updated.id ? { ...item, ...updated } : item
          );
        }
      })
      .addCase(updateNumberFormatConfiguration.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete
      .addCase(deleteNumberFormatConfiguration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNumberFormatConfiguration.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const deletedId = action.payload;
        state.list = state.list.filter((item) => item.id !== deletedId);
      })
      .addCase(deleteNumberFormatConfiguration.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentItem } = numberFormatConfigurationSlice.actions;
export default numberFormatConfigurationSlice.reducer;