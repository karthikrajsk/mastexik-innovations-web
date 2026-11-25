import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

// Item shape differs from Level2 (only name and sequence)
export interface Level1Item {
  id?: number;
  name: string;
  sequence: number | string;
}

export interface Level1Aggregate {
  id?: number;
  userId: number | string;
  items: Level1Item[];
}

export interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

interface Level1MenuState {
  loading: boolean;
  error: string | null;
  // Keep list as aggregates, same as Level2
  list: Level1Aggregate[];
  allList: Level1Aggregate[];
  pagination: PaginationState;
}

const initialState: Level1MenuState = {
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



export const getAllLevel1Menus = createAsyncThunk(
  "level1Menu/getAllLevel1Menus",
  async (
    params: { limit?: number; offset?: number; fetchAll?: boolean } = {},
    thunkAPI
  ) => {
    try {
      const queryParams = new URLSearchParams()

      if (params.fetchAll) {
        queryParams.append("limit", "10000")
        queryParams.append("offset", "0")
      } else {
        if (params.limit !== undefined) {
          queryParams.append("limit", String(params.limit))
        }
        if (params.offset !== undefined) {
          queryParams.append("offset", String(params.offset))
        }
      }

      const queryString = queryParams.toString()
      const url = queryString ? `/level1-menus?${queryString}` : `/level1-menus`

      const response = await apiService.get(url)

      // 🔹 Same response handling as getAllCurrencies
      const paginationData = response?.data

      const rawArray = Array.isArray(paginationData?.data)
        ? paginationData.data
        : Array.isArray(paginationData)
        ? paginationData
        : []

      return {
        data: rawArray,
        pagination: {
          total: paginationData?.total || rawArray.length || 0,
          limit:
            paginationData?.limit ??
            (params.fetchAll ? 10000 : params.limit ?? 10),
          offset:
            paginationData?.offset ??
            (params.fetchAll ? 0 : params.offset ?? 0),
          next: paginationData?.next ?? false,
          prev: paginationData?.prev ?? false,
        }
      }

    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
);

export const addLevel1: any = createAsyncThunk(
  "level1Menu/addLevel1",
  async (payload: Level1Aggregate, thunkAPI) => {
    try {
      const response = await apiService.post("/level1-menus", payload);
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

export const updateLevel1: any = createAsyncThunk(
  "level1Menu/updateLevel1",
  async (payload: Level1Aggregate, thunkAPI) => {
    try {
      const response = await apiService.put(`/level1-menus/${payload.id}`, payload);
      if (response?.status === "success") {
        toast.success(response?.message || "Updated successfully");
        return response?.data as Level1Aggregate;
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

export const deleteLevel1: any = createAsyncThunk(
  "level1Menu/deleteLevel1",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/level1-menus/${id}`);
      if (response?.status === "success") {
        toast.success(response?.message || "Deleted successfully");
        return id;
      }
      const msg = response?.message || "Something went wrong";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Request failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// === By-user endpoints (kept for compatibility with UI) ===
export const getLevel1ByUser = createAsyncThunk(
  "level1Menu/getLevel1ByUser",
  async (userId: number | string, thunkAPI) => {
    try {
      const response = await apiService.get(`/level1-menus/by-user/${userId}`);
      // response is { status, message, data }
      return response?.data as Level1Aggregate | null;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const saveLevel1ByUser: any = createAsyncThunk(
  "level1Menu/saveLevel1ByUser",
  async (payload: Level1Aggregate, thunkAPI) => {
    try {
      const response = await apiService.post("/level1-menus/by-user", payload);
      if (response?.status === "success") {
        toast.success(response?.message || "Saved successfully");
        return response?.data as Level1Aggregate;
      }
      const msg = response?.message || "Something went wrong";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Request failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const level1MenuSlice = createSlice({
  name: "level1Menu",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // === getAll ===
      .addCase(getAllLevel1Menus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
          .addCase(
              getAllLevel1Menus.fulfilled,
              (state, action) => {
                state.loading = false;
                const payloadData = action.payload.data || [];
                state.list = payloadData;
                state.pagination = action.payload.pagination;
                const fetchedAll = action.meta.arg?.fetchAll;
                if (fetchedAll) {
                  state.allList = payloadData;
                } else if (state.allList.length === 0) {
                  state.allList = payloadData;
                }
              }
            )
      // .addCase(
    
      //   getAllLevel1Menus.fulfilled,
      //   (state, action: PayloadAction<{ data: Level1Aggregate[]; pagination: PaginationState }>) => {
      //     state.loading = false;
      //     const target = (action.meta.arg?.target as 'page' | 'all') ?? 'page';
      //     if (target === 'all') {
      //       state.allList = action.payload.data || [];
      //       return;
      //     }
      //     state.list = action.payload.data || [];
      //     state.pagination = action.payload.pagination;
      //   }
      // )
      .addCase(getAllLevel1Menus.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // === add ===
      .addCase(addLevel1.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addLevel1.fulfilled, (state, action: PayloadAction<Level1Aggregate>) => {
        state.loading = false;
        const created = action.payload;
        if (created) state.list = [...state.list, created];
      })
      .addCase(addLevel1.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // === update ===
      .addCase(updateLevel1.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLevel1.fulfilled, (state, action: PayloadAction<Level1Aggregate>) => {
        state.loading = false;
        const updated = action.payload;
        if (!updated?.id) return;
        state.list = state.list.map((x) => (x.id === updated.id ? { ...x, ...updated } : x));
      })
      .addCase(updateLevel1.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // === delete ===
      .addCase(deleteLevel1.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLevel1.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const deletedId = action.payload;
        state.list = state.list.filter((x) => x.id !== deletedId);
      })
      .addCase(deleteLevel1.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // === by-user get ===
      .addCase(getLevel1ByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLevel1ByUser.fulfilled, (state, action: PayloadAction<Level1Aggregate | null>) => {
        state.loading = false;
        const dto = action.payload;
        // Normalize to array for UI
        state.list = dto ? [dto] : [];
      })
      .addCase(getLevel1ByUser.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // === by-user save ===
      .addCase(saveLevel1ByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveLevel1ByUser.fulfilled, (state, action: PayloadAction<Level1Aggregate>) => {
        state.loading = false;
        const saved = action.payload;
        if (!saved) return;
        // Update or insert the aggregate for this user
        const idx = state.list.findIndex((x) => x.id === saved.id || x.userId === saved.userId);
        if (idx >= 0) state.list[idx] = saved;
        else state.list = [saved];
      })
      .addCase(saveLevel1ByUser.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default level1MenuSlice.reducer;
