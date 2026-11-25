import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface MenuMasterItem {
  id?: number;
  screenName: string;
  menuUrl: string;
}

interface MenuMasterState {
  loading: boolean;
  error: string | null;
  list: MenuMasterItem[];
}

const initialState: MenuMasterState = {
  loading: false,
  error: null,
  list: [],
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


export const getAllMenuMasters = createAsyncThunk(
  "menuMaster/getAllMenuMasters",
  async (_: void, thunkAPI) => {
    try {
      const response = await apiService.get("/menu-masters");
      return response?.data || [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const addMenuMaster: any = createAsyncThunk(
  "menuMaster/addMenuMaster",
  async (payload: MenuMasterItem, thunkAPI) => {
    try {
      const response = await apiService.post("/menu-masters", payload);
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

export const updateMenuMaster: any = createAsyncThunk(
  "menuMaster/updateMenuMaster",
  async (payload: MenuMasterItem, thunkAPI) => {
    try {
      const response = await apiService.put(`/menu-masters/${payload.id}`, payload);
      if (response?.status === "success") {
        toast.success(response?.message || "Updated successfully");
        return response?.data;
      }
      const msg = response?.message || "Something went wrong";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    } catch (error: any) {
    const errorMessage = resolveApiErrorMessage(error, "Failed to update menu master");
                                                toast.error(errorMessage);
                                                return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const deleteMenuMaster: any = createAsyncThunk(
  "menuMaster/deleteMenuMaster",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/menu-masters/${id}`);
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

const menuMasterSlice = createSlice({
  name: "menuMaster",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllMenuMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllMenuMasters.fulfilled, (state, action: PayloadAction<MenuMasterItem[]>) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(getAllMenuMasters.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addMenuMaster.fulfilled, (state, action: PayloadAction<MenuMasterItem>) => {
        // optimistic append
        if (action.payload) state.list = [...state.list, action.payload];
      })
      .addCase(updateMenuMaster.fulfilled, (state, action: PayloadAction<MenuMasterItem>) => {
        const updated = action.payload;
        if (!updated?.id) return;
        state.list = state.list.map((x) => (x.id === updated.id ? { ...x, ...updated } : x));
      })
      .addCase(deleteMenuMaster.fulfilled, (state, action: PayloadAction<number>) => {
        const deletedId = action.payload;
        state.list = state.list.filter((x) => x.id !== deletedId);
      });
  },
});

export default menuMasterSlice.reducer;
