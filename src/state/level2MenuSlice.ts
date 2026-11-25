import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface Level2Item {
  id?: number;
  level1Id: number | string;
  menuMasterId: number | string;
  url: string;
  sequence: number | string;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canExport: boolean;
  canPrint: boolean;
  canApprove: boolean;
}

export interface Level2Aggregate {
  id?: number;
  userId: number | string;
  items: Level2Item[];
}

export interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

interface Level2MenuState {
  loading: boolean;
  error: string | null;
  list: Level2Aggregate[];
  allList: Level2Aggregate[];
  pagination: PaginationState;
}

const initialState: Level2MenuState = {
  loading: false,
  error: null,
  list: [],
  allList: [],
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


export const getAllLevel2Menus = createAsyncThunk(
  "level2Menu/getAllLevel2Menus",
  async (
    params: { limit?: number; offset?: number; fetchAll?: boolean } = {},
    thunkAPI
  ) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.fetchAll) {
        queryParams.append("limit", "10000");
        queryParams.append("offset", "0");
      } else {
        if (params.limit !== undefined) {
          queryParams.append("limit", String(params.limit));
        }
        if (params.offset !== undefined) {
          queryParams.append("offset", String(params.offset));
        }
      }

      const queryString = queryParams.toString();
      const url = queryString ? `/level2-menus?${queryString}` : "/level2-menus";
      const response = await apiService.get(url);
      const paginationData = response?.data;
      const data = Array.isArray(paginationData?.data) ? paginationData.data : [];

      return {
        data,
        pagination: {
          total: paginationData?.total || 0,
          limit:
            paginationData?.limit ?? (params.fetchAll ? 10000 : params.limit ?? 10),
          offset:
            paginationData?.offset ?? (params.fetchAll ? 0 : params.offset ?? 0),
          next: paginationData?.next ?? false,
          prev: paginationData?.prev ?? false,
        },
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const addLevel2: any = createAsyncThunk(
  "level2Menu/addLevel2",
  async (payload: Level2Aggregate, thunkAPI) => {
    try {
      const response = await apiService.post("/level2-menus", payload);
      if (response?.status === "success") {
        toast.success(response?.message || "Saved successfully");
        return response?.data;
      }
      const msg = response?.message || "Something went wrong";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    } catch (error: any) {
         const errorMessage = resolveApiErrorMessage(error, "Failed to create menu master");
                                                     toast.error(errorMessage);
                                                     return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const updateLevel2: any = createAsyncThunk(
  "level2Menu/updateLevel2",
  async (payload: Level2Aggregate, thunkAPI) => {
    try {
      const response = await apiService.put(`/level2-menus/${payload.id}`, payload);
      if (response?.status === "success") {
        toast.success(response?.message || "Updated successfully");
        return response?.data;
      }
      const msg = response?.message || "Something went wrong";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    } catch (error: any) {
        const errorMessage = resolveApiErrorMessage(error, "Failed to create menu master");
                                                    toast.error(errorMessage);
                                                    return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const deleteLevel2: any = createAsyncThunk(
  "level2Menu/deleteLevel2",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/level2-menus/${id}`);
      if (response?.status === "success") {
        toast.success(response?.message || "Deleted successfully");
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

const level2MenuSlice = createSlice({
  name: "level2Menu",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllLevel2Menus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllLevel2Menus.fulfilled,
        (state, action: PayloadAction<{ data: Level2Aggregate[]; pagination: PaginationState }>) => {
          state.loading = false;
          state.list = action.payload.data || [];
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(getAllLevel2Menus.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addLevel2.fulfilled, (state, action: PayloadAction<Level2Aggregate>) => {
        if (action.payload) state.list = [...state.list, action.payload];
      })
      .addCase(updateLevel2.fulfilled, (state, action: PayloadAction<Level2Aggregate>) => {
        const updated = action.payload;
        if (!updated?.id) return;
        state.list = state.list.map((x) => (x.id === updated.id ? { ...x, ...updated } : x));
      })
      .addCase(deleteLevel2.fulfilled, (state, action: PayloadAction<number>) => {
        const deletedId = action.payload;
        state.list = state.list.filter((x) => x.id !== deletedId);
      });
  },
});

export default level2MenuSlice.reducer;
