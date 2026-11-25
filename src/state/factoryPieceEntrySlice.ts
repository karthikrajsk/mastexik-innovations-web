import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface FactoryPieceEntryState {
  loading: boolean;
  error: string | null;
  list: any[];
  pagination: { total: number; offset: number; limit: number; next: boolean; prev: boolean } | null;
  pageRequestId?: string;
  current?: any | null;
  createResult?: any | null;
}

const initialState: FactoryPieceEntryState = {
  loading: false,
  error: null,
  list: [],
  pagination: null,
  current: null,
  createResult: null,
};

const BASE = "/piece-entries";

export const getDoffingEntriesPage = createAsyncThunk(
  "factoryPieceEntry/getDoffingPage",
  async (
    payload: { companyId?: number; offset: number; limit: number; search?: string },
    thunkAPI
  ) => {
    try {
      const response = await apiService.get(`${BASE}/doffing`, payload);
      return response || { data: [], total: 0, offset: payload.offset, limit: payload.limit };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load doffing entries");
    }
  }
);

export const getAllFactoryPieceEntries = createAsyncThunk(
  "factoryPieceEntry/getAllFactoryPieceEntries",
  async (_: any, thunkAPI) => {
    try {
      const response = await apiService.get(`${BASE}`);
      return response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load");
    }
  }
);

export const getFactoryPieceEntriesByCompany = createAsyncThunk(
  "factoryPieceEntry/getByCompany",
  async (
    payload: number | { companyId: number; isFactoryFabric?: number | null },
    thunkAPI
  ) => {
    try {
      const { companyId, isFactoryFabric } =
        typeof payload === "number"
          ? { companyId: payload, isFactoryFabric: undefined }
          : { companyId: payload.companyId, isFactoryFabric: payload.isFactoryFabric };
      const query = isFactoryFabric != null ? `?isFactoryFabric=${isFactoryFabric}` : "";
      const response = await apiService.get(`${BASE}/company/${companyId}${query}`);
      return response || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load");
    }
  }
);

export const getFactoryPieceEntryById = createAsyncThunk(
  "factoryPieceEntry/getById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`${BASE}/${id}`);
      return response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load record");
    }
  }
);

export const getFactoryPieceEntryByIdAndCompany = createAsyncThunk(
  "factoryPieceEntry/getByIdAndCompany",
  async ({ id, companyId }: { id: number; companyId: number }, thunkAPI) => {
    try {
      const response = await apiService.get(`${BASE}/company/${companyId}/${id}`);
      return response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load record");
    }
  }
);

export const createFactoryPieceEntry = createAsyncThunk(
  "factoryPieceEntry/create",
  async (data: any, thunkAPI) => {
    try {
      const response = await apiService.post(`${BASE}`, data);
      toast.success("Saved Successfully!");
      return response;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Create failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateFactoryPieceEntry = createAsyncThunk(
  "factoryPieceEntry/update",
  async (
    { id, data, companyId }: { id: number; data: any; companyId?: number },
    thunkAPI
  ) => {
    try {
      const url = companyId ? `${BASE}/company/${companyId}/${id}` : `${BASE}/${id}`;
      const response = await apiService.put(url, data);
      toast.success("Updated successfully!");
      return response;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Update failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteFactoryPieceEntry = createAsyncThunk(
  "factoryPieceEntry/delete",
  async (payload: number | { id: number; companyId?: number }, thunkAPI) => {
    try {
      const { id, companyId } =
        typeof payload === "number" ? { id: payload, companyId: undefined } : payload;
      const url = companyId ? `${BASE}/company/${companyId}/${id}` : `${BASE}/${id}`;
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

const factoryPieceEntrySlice = createSlice({
  name: "factoryPieceEntry",
  initialState,
  reducers: {
    clearFactoryPieceEntryCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllFactoryPieceEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllFactoryPieceEntries.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.pagination = null;
        const p: any = action.payload;
        const data = Array.isArray(p)
          ? p
          : Array.isArray(p?.data)
          ? p.data
          : Array.isArray(p?.data?.data)
          ? p.data.data
          : Array.isArray(p?.rows)
          ? p.rows
          : [];
        
        let localPieces = [];
        try {
          const str = localStorage.getItem("old_stock_piece_entries");
          if (str) localPieces = JSON.parse(str);
        } catch (e) {
          localPieces = [];
        }

        const map = new Map();
        [...(data || []), ...localPieces].forEach((item) => {
          if (item && (item.id || item.pieceNo)) {
            map.set(item.id || item.pieceNo, item);
          }
        });

        state.list = Array.from(map.values());
      })
      .addCase(getAllFactoryPieceEntries.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getFactoryPieceEntriesByCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFactoryPieceEntriesByCompany.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.pagination = null;
        const p: any = action.payload;
        const data = Array.isArray(p)
          ? p
          : Array.isArray(p?.data)
          ? p.data
          : Array.isArray(p?.data?.data)
          ? p.data.data
          : Array.isArray(p?.rows)
          ? p.rows
          : [];
        
        let localPieces = [];
        try {
          const str = localStorage.getItem("old_stock_piece_entries");
          if (str) localPieces = JSON.parse(str);
        } catch (e) {
          localPieces = [];
        }

        const map = new Map();
        [...(data || []), ...localPieces].forEach((item) => {
          if (item && (item.id || item.pieceNo)) {
            map.set(item.id || item.pieceNo, item);
          }
        });

        state.list = Array.from(map.values());
      })
      .addCase(getFactoryPieceEntriesByCompany.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getDoffingEntriesPage.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.pageRequestId = action.meta.requestId;
      })
      .addCase(getDoffingEntriesPage.fulfilled, (state, action) => {
        if (state.pageRequestId !== action.meta.requestId) return;
        state.loading = false;
        const response = action.payload || {};
        const data = Array.isArray(response.data) ? response.data : [];
        state.pagination = {
          total: Number(response.total) || 0,
          offset: Number(response.offset) || 0,
          limit: Number(response.limit) || 50,
          next: Boolean(response.next),
          prev: Boolean(response.prev),
        };
        state.list = data;
      })
      .addCase(getDoffingEntriesPage.rejected, (state, action: any) => {
        if (state.pageRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getFactoryPieceEntryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFactoryPieceEntryById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getFactoryPieceEntryById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getFactoryPieceEntryByIdAndCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getFactoryPieceEntryByIdAndCompany.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.current = action.payload;
        }
      )
      .addCase(getFactoryPieceEntryByIdAndCompany.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createFactoryPieceEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFactoryPieceEntry.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const created = action.payload?.data || action.payload;
        state.createResult = created;
        if (created && created.id) {
          state.list = [created, ...state.list];
        }
      })
      .addCase(createFactoryPieceEntry.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateFactoryPieceEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFactoryPieceEntry.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload?.data || action.payload;
        state.list = state.list.map((x: any) => (x.id === updated?.id ? updated : x));
      })
      .addCase(updateFactoryPieceEntry.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteFactoryPieceEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFactoryPieceEntry.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const deletedId = action.payload;
        state.list = state.list.filter((item: any) => item.id !== deletedId);
      })
      .addCase(deleteFactoryPieceEntry.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearFactoryPieceEntryCurrent } = factoryPieceEntrySlice.actions;
export default factoryPieceEntrySlice.reducer;
