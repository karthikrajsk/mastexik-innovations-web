// yarn-dispatch-for-dyeing-slice.ts
import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface YarnDispatchState {
  loading: boolean;
  error: string | null;
  list: any[];
  createResult: any;
}

const initialState: YarnDispatchState = {
  loading: false,
  error: null,
  list: [],
  createResult: null,
};

const getSelectedCompanyId = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem("selectedCompanyId") ?? window.localStorage.getItem("selectedCompany");
  return stored ? Number(stored) : null;
};

// Use fabric-dispatch endpoint for all operations
export const getAllYarnDispatch = createAsyncThunk(
  "yarn-dispatch/getAll",
  async (
    params: { offset?: number; limit?: number; fetchAll?: boolean; processType?: string } = {},
    thunkAPI
  ) => {
    try {
      const companyId = getSelectedCompanyId();
      if (!companyId) {
        throw new Error("Please select a company");
      }
      const offset = params.fetchAll ? 0 : params.offset ?? 0;
      const limit = params.fetchAll ? 10000 : params.limit ?? 10000;
      const normalizedType = (params.processType ?? "YARN").toUpperCase();
      const queryParams: Record<string, number> = { offset, limit };
      const response = await apiService.get(
        `/fabric-dispatch/type/${normalizedType}/company/${companyId}`,
        queryParams
      );
      const payload = response?.data?.data ?? response?.data ?? (Array.isArray(response) ? response : []);
      return Array.isArray(payload) ? payload : [];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const getYarnDispatchById = createAsyncThunk(
  "yarn-dispatch/getById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`/fabric-dispatch/${id}`);
      return response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createYarnDispatch = createAsyncThunk(
  "yarn-dispatch/create",
  async (data: any, thunkAPI) => {
    try {
      // Ensure processType is set to YARN when creating through fabric-dispatch endpoint
      const payload = {
        ...data,
        processType: "YARN" // This is crucial - tells backend it's a yarn dispatch
      };
      
      console.log("Creating yarn dispatch with payload:", payload);
      
      const response = await apiService.post("/fabric-dispatch", payload);
      if (response?.status === "success") {
        toast.success(response?.message || "Yarn Dispatch created successfully");
        return response;
      } else {
        const errorMessage = response?.message || "Something went wrong";
        return thunkAPI.rejectWithValue(errorMessage);
      }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateYarnDispatch = createAsyncThunk(
  "yarn-dispatch/update",
  async (
    { id, data, processType }: { id: number; data: any; processType?: string },
    thunkAPI
  ) => {
    try {
      const companyId = getSelectedCompanyId();
      if (!companyId) {
        throw new Error("Please select a company");
      }
      const normalizedType = (processType ?? data?.processType ?? "YARN").toUpperCase();
      const payload = {
        ...data,
        processType: normalizedType,
      };

      console.log("Updating yarn dispatch with payload:", payload);

      const response = await apiService.put(
        `/fabric-dispatch/type/${normalizedType}/company/${companyId}/${id}`,
        payload
      );
      const resultPayload = response?.data ?? response;
      if (!response || response?.status === "success") {
        toast.success(response?.message || "Yarn Dispatch updated successfully");
        return resultPayload;
      }
      const errorMessage = response?.message || "Something went wrong";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    } catch (error: any) {
      const message = error?.message || "Update failed";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteYarnDispatch = createAsyncThunk(
  "yarn-dispatch/delete",
  async (
    { id, processType }: { id: number; processType?: string },
    thunkAPI
  ) => {
    try {
      const companyId = getSelectedCompanyId();
      if (!companyId) {
        throw new Error("Please select a company");
      }
      const normalizedType = (processType ?? "YARN").toUpperCase();
      const response = await apiService.delete(
        `/fabric-dispatch/type/${normalizedType}/company/${companyId}/${id}`
      );
      if (!response || response?.status === "success") {
        toast.success(response?.message || "Yarn Dispatch deleted successfully");
        return { id };
      }
      const errorMessage = response?.message || "Something went wrong";
      return thunkAPI.rejectWithValue(errorMessage);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const yarnDispatchForDyeingSlice = createSlice({
  name: "yarnDispatchForDyeing",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllYarnDispatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllYarnDispatch.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(getAllYarnDispatch.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createYarnDispatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createYarnDispatch.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.createResult = action.payload;
      })
      .addCase(createYarnDispatch.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateYarnDispatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateYarnDispatch.fulfilled, (state, action: any) => {
        state.loading = false;
        const updated = action.payload?.data ?? action.payload;
        const updatedId = updated?.id ?? action.meta?.arg?.id;
        if (!updatedId) {
          return;
        }
        state.list = state.list.map((it: any) => (it.id === updatedId ? { ...it, ...updated } : it));
      })
      .addCase(updateYarnDispatch.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteYarnDispatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteYarnDispatch.fulfilled, (state, action: any) => {
        state.loading = false;
        const deletedId = action.payload?.id ?? action.meta?.arg?.id;
        if (!deletedId) {
          return;
        }
        state.list = state.list.filter((it: any) => it.id !== deletedId);
      })
      .addCase(deleteYarnDispatch.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default yarnDispatchForDyeingSlice.reducer;