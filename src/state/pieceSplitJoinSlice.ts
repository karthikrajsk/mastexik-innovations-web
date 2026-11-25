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

export interface PieceSplitJoinState {
  loading: boolean;
  error: string | null;
  splitList: any[];
  joinList: any[];
  lastSaved?: any | null;
  splitPagination: PaginationState;
  joinPagination: PaginationState;
}

const initialState: PieceSplitJoinState = {
  loading: false,
  error: null,
  splitList: [],
  joinList: [],
  lastSaved: null,
  splitPagination: {
    total: 0,
    limit: 10,
    offset: 0,
    next: false,
    prev: false,
  },
  joinPagination: {
    total: 0,
    limit: 10,
    offset: 0,
    next: false,
    prev: false,
  },
};

const SPLIT_BASE = "/piece-split";
const JOIN_BASE = "/piece-join";

type PieceQueryParams = { companyId: number | string; limit?: number; offset?: number; fetchAll?: boolean };

const normalizePieceQuery = (payload: PieceQueryParams | number | string): PieceQueryParams => {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && "companyId" in payload) {
    return payload as PieceQueryParams;
  }
  return { companyId: payload as number | string };
};

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

export const createPieceOperation = createAsyncThunk(
  "pieceSplitJoin/create",
  async (data: any, thunkAPI) => {
    try {
      const base = Number(data?.operationId) === 1 ? SPLIT_BASE : JOIN_BASE;
      const res = await apiService.post(`${base}`, data);
      toast.success("Saved successfully");
      return { res, op: Number(data?.operationId) };
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Create failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updatePieceOperation = createAsyncThunk(
  "pieceSplitJoin/update",
  async (payload: { id: number | string; companyId?: number | string; data: any }, thunkAPI) => {
    try {
      const { id, companyId, data } = payload;
      const op = Number(data?.operationId);
      const base = op === 1 ? SPLIT_BASE : JOIN_BASE;
      const url = companyId ? `${base}/company/${companyId}/${id}` : `${base}/${id}`;
      const res = await apiService.put(url, data);
      toast.success("Updated successfully");
      return { res, op };
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Update failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deletePieceOperation = createAsyncThunk(
  "pieceSplitJoin/delete",
  async (payload: { id: number | string; companyId?: number | string; operationId: number }, thunkAPI) => {
    try {
      const { id, companyId, operationId } = payload;
      const base = Number(operationId) === 1 ? SPLIT_BASE : JOIN_BASE;
      const url = companyId ? `${base}/company/${companyId}/${id}` : `${base}/${id}`;
      const res = await apiService.delete(url);
      toast.success("Deleted successfully");
      return { res, op: Number(operationId), id };
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Delete failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const getPieceSplitsByCompany = createAsyncThunk(
  "pieceSplitJoin/getSplitsByCompany",
  async (
    payload: number | string | { companyId: number | string; limit?: number; offset?: number; fetchAll?: boolean },
    thunkAPI
  ) => {
    try {
      const params = normalizePieceQuery(payload);
      const companyId = params.companyId;
      const baseLimit = params.limit ?? 10000;
      const baseOffset = params.offset ?? 0;
      const shouldFetchAll = params.fetchAll ?? (params.limit === undefined && params.offset === undefined);
      const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
      const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

      const queryParams = new URLSearchParams();
      queryParams.append("limit", String(effectiveLimit));
      queryParams.append("offset", String(effectiveOffset));
      const queryString = queryParams.toString();

      const res = await apiService.get(`${SPLIT_BASE}/company/${companyId}${queryString ? `?${queryString}` : ""}`);
      return mapApiResponse(res, effectiveLimit, effectiveOffset);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load");
    }
  }
);

export const getPieceJoinsByCompany = createAsyncThunk(
  "pieceSplitJoin/getJoinsByCompany",
  async (
    payload: number | string | { companyId: number | string; limit?: number; offset?: number; fetchAll?: boolean },
    thunkAPI
  ) => {
    try {
      const params = normalizePieceQuery(payload);
      const companyId = params.companyId;
      const baseLimit = params.limit ?? 10000;
      const baseOffset = params.offset ?? 0;
      const shouldFetchAll = params.fetchAll ?? (params.limit === undefined && params.offset === undefined);
      const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
      const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

      const queryParams = new URLSearchParams();
      queryParams.append("limit", String(effectiveLimit));
      queryParams.append("offset", String(effectiveOffset));
      const queryString = queryParams.toString();

      const res = await apiService.get(`${JOIN_BASE}/company/${companyId}${queryString ? `?${queryString}` : ""}`);
      return mapApiResponse(res, effectiveLimit, effectiveOffset);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load");
    }
  }
);

const pieceSplitJoinSlice = createSlice({
  name: "pieceSplitJoin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createPieceOperation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPieceOperation.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload: any = action.payload?.res?.data || action.payload?.res || action.payload;
        const item = payload?.data || payload;
        state.lastSaved = item || null;
        if (item && item.id) {
          if (Number(action.payload?.op) === 1) {
            state.splitList = [item, ...(state.splitList || [])];
            state.splitPagination.total = (state.splitPagination.total || 0) + 1;
          } else {
            state.joinList = [item, ...(state.joinList || [])];
            state.joinPagination.total = (state.joinPagination.total || 0) + 1;
          }
        }
      })
      .addCase(createPieceOperation.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updatePieceOperation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePieceOperation.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload: any = action.payload?.res?.data || action.payload?.res || action.payload;
        const item = payload?.data || payload;
        state.lastSaved = item || null;
        if (item && item.id) {
          if (Number(action.payload?.op) === 1) {
            state.splitList = (state.splitList || []).map((x: any) => (x.id === item.id ? item : x));
          } else {
            state.joinList = (state.joinList || []).map((x: any) => (x.id === item.id ? item : x));
          }
        }
      })
      .addCase(updatePieceOperation.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deletePieceOperation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePieceOperation.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const id = action.payload?.id;
        if (Number(action.payload?.op) === 1) {
          state.splitList = (state.splitList || []).filter((x: any) => x.id !== id);
          state.splitPagination.total = Math.max(0, (state.splitPagination.total || 0) - 1);
        } else {
          state.joinList = (state.joinList || []).filter((x: any) => x.id !== id);
          state.joinPagination.total = Math.max(0, (state.joinPagination.total || 0) - 1);
        }
      })
      .addCase(deletePieceOperation.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getPieceSplitsByCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPieceSplitsByCompany.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.splitPagination };
        state.splitList = payload.data || [];
        state.splitPagination = payload.pagination || state.splitPagination;
      })
      .addCase(getPieceSplitsByCompany.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getPieceJoinsByCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPieceJoinsByCompany.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.joinPagination };
        state.joinList = payload.data || [];
        state.joinPagination = payload.pagination || state.joinPagination;
      })
      .addCase(getPieceJoinsByCompany.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default pieceSplitJoinSlice.reducer;
