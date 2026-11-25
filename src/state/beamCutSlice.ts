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

interface BeamCutState {
  loading: boolean;
  error: string | null;
  list: any[];
  current?: any | null;
  createResult?: any | null;
  pagination: PaginationState;
}

const initialState: BeamCutState = {
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

const BASE = "/beam-cut";

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

export const getAllBeamCuts = createAsyncThunk(
  "beamCut/getAllBeamCuts",
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

export const getBeamCutById = createAsyncThunk(
  "beamCut/getBeamCutById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`${BASE}/${id}`);
      return response?.data?.data ?? response?.data ?? response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load record");
    }
  }
);

export const createBeamCut = createAsyncThunk(
  "beamCut/createBeamCut",
  async (data: any, thunkAPI) => {
    try {
      const response = await apiService.post(`${BASE}`, data);
      toast.success("Saved Successfully!");
      return response?.data?.data ?? response?.data ?? response;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Create failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateBeamCut = createAsyncThunk(
  "beamCut/updateBeamCut",
  async ({ id, data, companyId }: { id: number; data: any; companyId?: number }, thunkAPI) => {
    try {
      const url = companyId != null ? `${BASE}/company/${companyId}/${id}` : `${BASE}/${id}`;
      const response = await apiService.put(url, data);
      toast.success("Updated successfully!");
      return response?.data?.data ?? response?.data ?? response;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Update failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteBeamCut = createAsyncThunk(
  "beamCut/deleteBeamCut",
  async (args: { id: number; companyId?: number }, thunkAPI) => {
    try {
      const { id, companyId } = args;
      const url = companyId != null ? `${BASE}/company/${companyId}/${id}` : `${BASE}/${id}`;
      const response = await apiService.delete(url);
      if ((response as any)?.status === "success") toast.success("Successfully deleted");
      else toast.success("Successfully deleted");
      return id;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Delete failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const beamCutSlice = createSlice({
  name: "beamCut",
  initialState,
  reducers: {
    clearBeamCutCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllBeamCuts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBeamCuts.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.list = payload.data || [];
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getAllBeamCuts.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getBeamCutById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBeamCutById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getBeamCutById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createBeamCut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBeamCut.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const created = (action.payload as any);
        state.createResult = created;
        state.pagination.total = (state.pagination.total || 0) + 1;
        if ((created as any)?.id) state.list = [created, ...state.list];
      })
      .addCase(createBeamCut.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateBeamCut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBeamCut.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload as any;
        state.list = state.list.map((x: any) => (x.id === updated?.id ? updated : x));
      })
      .addCase(updateBeamCut.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteBeamCut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBeamCut.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const deletedId = action.payload;
        state.list = state.list.filter((item: any) => item.id !== deletedId);
        state.pagination.total = Math.max(0, (state.pagination.total || 0) - 1);
      })
      .addCase(deleteBeamCut.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearBeamCutCurrent } = beamCutSlice.actions;
export default beamCutSlice.reducer;
