import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface SalesReturnItem {
  id?: number;
  rollNo: string;
  pieceNo: string;
  meter: number;
  netWeight: number;
}

export interface SalesReturn {
  id?: number;
  salesReturnNo?: string;
  date: string;
  invoiceNo: string;
  invoiceId?: number;
  orderNo: string;
  orderId?: number;
  buyerName: string;
  customerId?: number;
  fabricCode: string;
  fabricCodeId?: number;
  fabricQuality: string;
  items: SalesReturnItem[];
  remarks?: string;
  warehouseId?: number | null;
  warehouseName?: string;
  companyId?: number;
  activeFlag?: boolean;
}

export interface PaginationInfo {
  total: number;
  next: boolean;
  prev: boolean;
  offset: number;
  limit: number;
}

export interface ApiState {
  loading: boolean;
  error: string | null;
  salesReturnList: SalesReturn[];
  paginationInfo: PaginationInfo;
  createSalesReturnResult: any;
  checking: boolean;
}

const initialState: ApiState = {
  loading: false,
  error: null,
  salesReturnList: [],
  paginationInfo: {
    total: 0,
    next: false,
    prev: false,
    offset: 0,
    limit: 10
  },
  createSalesReturnResult: null,
  checking: false,
};

const extractSalesReturnArray = (payload: any): SalesReturn[] => {
  if (Array.isArray(payload)) return payload as SalesReturn[];
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data?.data)) return payload.data.data as SalesReturn[];
    if (Array.isArray(payload.data)) return payload.data as SalesReturn[];
    if (payload.data) return extractSalesReturnArray(payload.data);
    if (Array.isArray(payload.items)) return payload.items as SalesReturn[];
    if (Array.isArray(payload.results)) return payload.results as SalesReturn[];
  }
  return [];
};

const normalizeSalesReturnResponse = (
  response: any,
  fallbackOffset: number,
  fallbackLimit: number
) => {
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    const payload = response.data;
    const normalizedData = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.items)
      ? payload.items
      : [];

    return {
      data: normalizedData,
      total: payload.total ?? payload.count ?? payload.pagination?.total ?? normalizedData.length,
      next: payload.next ?? payload.pagination?.next ?? false,
      prev: payload.prev ?? payload.pagination?.prev ?? fallbackOffset > 0,
      offset: payload.offset ?? payload.pagination?.offset ?? fallbackOffset,
      limit: payload.limit ?? payload.pagination?.limit ?? fallbackLimit
    };
  }

  if (Array.isArray(response?.data)) {
    return {
      data: response.data,
      total: response.total ?? response.count ?? response.data.length,
      next: response.next ?? false,
      prev: response.prev ?? false,
      offset: response.offset ?? fallbackOffset,
      limit: response.limit ?? fallbackLimit
    };
  }

  if (Array.isArray(response)) {
    return {
      data: response,
      total: response.length,
      next: false,
      prev: fallbackOffset > 0,
      offset: fallbackOffset,
      limit: fallbackLimit
    };
  }

  return {
    data: [],
    total: 0,
    next: false,
    prev: false,
    offset: fallbackOffset,
    limit: fallbackLimit
  };
};

const normalizeSalesReturn = (entry: any): SalesReturn => {
  const base = entry || {};
  return {
    ...base,
    items: Array.isArray(base.items) ? base.items : [],
    buyerName: base.buyerName || base.customerName || "",
    fabricQuality: base.fabricQuality || base.fabricQualityName || "",
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
}
const normalizeSalesReturnList = (payload: any): SalesReturn[] => {
  return extractSalesReturnArray(payload).map(normalizeSalesReturn);
};

const normalizeSalesReturnEntity = (payload: any): SalesReturn | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) {
    const first = payload[0];
    return first ? normalizeSalesReturn(first) : null;
  }
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data?.data)) {
      const first = payload.data.data[0];
      return first ? normalizeSalesReturn(first) : null;
    }
    if (Array.isArray(payload.data)) {
      const first = payload.data[0];
      return first ? normalizeSalesReturn(first) : null;
    }
    if (payload.data) {
      return normalizeSalesReturnEntity(payload.data);
    }
    return normalizeSalesReturn(payload);
  }
  return null;
};

export const getAllSalesReturn = createAsyncThunk(
  "salesReturn/getAllSalesReturn",
  async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
    try {
      const fetchAll = params.fetchAll ?? false;
      const offset = fetchAll ? 0 : (params.offset ?? 0);
      const limit = fetchAll ? 10000 : (params.limit ?? 10000);
      const companyId = params.companyId;

      const queryParams = new URLSearchParams();
      queryParams.append('offset', String(offset));
      queryParams.append('limit', String(limit));

      let endpoint = companyId ? `/sales-returns/company/${companyId}` : `/sales-returns`;
      const queryString = queryParams.toString();
      if (queryString) {
        endpoint = `${endpoint}?${queryString}`;
      }

      const response = await apiService.get(endpoint);
      const normalized = normalizeSalesReturnResponse(response, offset, limit);

      return {
        data: normalized.data,
        total: normalized.total,
        next: normalized.next,
        prev: normalized.prev,
        offset: normalized.offset,
        limit: normalized.limit
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createSalesReturn = createAsyncThunk(
  "salesReturn/createSalesReturn",
  async (params: any, thunkAPI) => {
    try {
      const response = await apiService.post("/sales-returns", params);
      const normalized = normalizeSalesReturnEntity(response);
      if (normalized) {
        toast.success("Sales return created successfully");
        return normalized;
      }
      const errorMessage = response?.message || "Failed to create sales return";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }  catch (error: any) {
                                                                const errorMessage = resolveApiErrorMessage(error, "Failed to create purchase inward");
                                                                toast.error(errorMessage);
                                                                return thunkAPI.rejectWithValue(errorMessage);
                                                            }
  }
);

export const updateSalesReturn = createAsyncThunk(
  "salesReturn/updateSalesReturn",
  async ({ id, data, companyId }: { id: number; data: any; companyId?: number }, thunkAPI) => {
    try {
      const url = companyId ? `/sales-returns/company/${companyId}/${id}` : `/sales-returns/${id}`;
      const response = await apiService.put(url, data);
      const normalized = normalizeSalesReturnEntity(response);
      if (normalized) {
        toast.success("Sales return updated successfully");
        return normalized;
      }
      const errorMessage = response?.message || "Failed to update sales return";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    } catch (error: any) {
     const errorMessage = resolveApiErrorMessage(error, "Failed to create Sa");
                                                                toast.error(errorMessage);
                                                                return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const deleteSalesReturn = createAsyncThunk(
  "salesReturn/deleteSalesReturn",
  async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
    try {
      const url = companyId ? `/sales-returns/company/${companyId}/${id}` : `/sales-returns/${id}`;
      await apiService.delete(url);
      toast.success("Sales return deleted successfully");
      return id;
    } catch (error: any) {
     const errorMessage = resolveApiErrorMessage(error, "Failed to create purchase inward");
                                                                toast.error(errorMessage);
                                                                return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

const salesReturnSlice = createSlice({
  name: "salesReturn",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllSalesReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSalesReturn.fulfilled, (state: any, action) => {
        state.loading = false;
        const { data, total, next, prev, offset, limit } = action.payload;
        state.salesReturnList = Array.isArray(data) ? data : [];
        state.paginationInfo = { total, next, prev, offset, limit };
      })
      .addCase(getAllSalesReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSalesReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSalesReturn.fulfilled, (state, action) => {
        state.loading = false;
        state.createSalesReturnResult = action.payload;
        if (action.payload) {
          state.salesReturnList.push(action.payload);
        }
      })
      .addCase(createSalesReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSalesReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSalesReturn.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        if (!updated?.id) {
          return;
        }
        const index = state.salesReturnList.findIndex((item) => item.id === updated.id);
        if (index !== -1) {
          state.salesReturnList[index] = updated;
        }
      })
      .addCase(updateSalesReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteSalesReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSalesReturn.fulfilled, (state, action) => {
        state.loading = false;
        state.salesReturnList = state.salesReturnList.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deleteSalesReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = salesReturnSlice.actions;
export default salesReturnSlice.reducer;
