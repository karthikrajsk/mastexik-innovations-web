import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

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
    sizingJobWorkOrderList: any[];
    paginationInfo: PaginationInfo;
    createSizingJobWorkOrderResult: any;
    getSizingJobWorkOrderByIdList: any;
    lotEntriesList: any;
    checking: boolean;
    submissionSuccess: boolean;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    sizingJobWorkOrderList: [],
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    },
    getSizingJobWorkOrderByIdList: [],
    lotEntriesList: [],
    createSizingJobWorkOrderResult: null,
    checking: false,
    submissionSuccess: false,
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


const extractJobWorkOrders = (payload: any, params: { offset: number; limit: number }): any => {
    let data = [];
    let total = 0;
    let next = false;
    let prev = false;
    let offset = params.offset;
    let limit = params.limit;

    if (Array.isArray(payload)) {
        data = payload;
        total = payload.length;
    } else if (payload && typeof payload === 'object') {
        const rawData = payload.data?.data || payload.data || payload.items || payload.results || [];
        data = Array.isArray(rawData) ? rawData : [];
        total = payload.total || payload.count || data.length;
        next = !!payload.next;
        prev = !!payload.prev;
        offset = payload.offset ?? offset;
        limit = payload.limit ?? limit;
    }

    return { data, total, next, prev, offset, limit };
};

export const getAllSizingJobWorkOrders = createAsyncThunk(
    'sizingJobWorkOrder/getAll',
    async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
        try {
            const offset = params.offset ?? 0;
            const limit = params.limit ?? 10000;
            const fetchAll = params.fetchAll ?? false;
            const queryOffset = fetchAll ? 0 : offset;
            const queryLimit = fetchAll ? 10000 : limit;
            const url = params.companyId 
                ? `/sizing-jobwork-orders/factory/${params.companyId}?offset=${queryOffset}&limit=${queryLimit}`
                : `/sizing-jobwork-orders?offset=${queryOffset}&limit=${queryLimit}`;
            const response = await apiService.get(url);
            return extractJobWorkOrders(response, { offset: queryOffset, limit: queryLimit });
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

export const getAllSizingJobWorkOrdersByFactoryCompanyId = createAsyncThunk(
    'sizingJobWorkOrder/getAllByFactoryCompanyId',
    async (params: { factoryCompanyId: number; offset?: number; limit?: number,fetchAll?: boolean; }, thunkAPI) => {
        try {
            const offset = params.offset ?? 0;
            const limit = params.limit ?? 10000;
            const fetchAll = params.fetchAll ?? false;
            const queryOffset = fetchAll ? 0 : offset;
            const queryLimit = fetchAll ? 10000 : limit;
            const response = await apiService.get(`/sizing-jobwork-orders/factory/${params.factoryCompanyId}?offset=${queryOffset}&limit=${queryLimit}`);
            return extractJobWorkOrders(response, { offset: queryOffset, limit: queryLimit });
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);


export const getSizingJobWorkOrderById = createAsyncThunk(
  'sizingJobWorkOrder/getById',
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`/sizing-jobwork-orders/${id}`);
      return response ?? null;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const createSizingJobWorkOrder = createAsyncThunk(
  'sizingJobWorkOrder/create',
  async (params: any, thunkAPI) => {
    try {
      const response = await apiService.post('/sizing-jobwork-orders', params);
      toast.success('Created successfully');
      return response;
    } catch (err: any) {
       const errorMessage = resolveApiErrorMessage(err, "Failed to create Sizing Jobwork");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
      // toast.error(err.message || 'Create failed');
      // return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const updateSizingJobWorkOrder = createAsyncThunk(
  'sizingJobWorkOrder/update',
  async ({ id, data, factoryCompanyId }: { id: number; data: any; factoryCompanyId?: number }, thunkAPI) => {
    try {
      const url = factoryCompanyId ? `/sizing-jobwork-orders/${id}?factoryCompanyId=${factoryCompanyId}` : `/sizing-jobwork-orders/${id}`;
      const response = await apiService.put(url, data);
      toast.success('Updated successfully');
      return response;
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const deleteSizingJobWorkOrder = createAsyncThunk(
  'sizingJobWorkOrder/delete',
  async (payload: number | { id: number; factoryCompanyId?: number }, thunkAPI) => {
    try {
      const { id, factoryCompanyId } = typeof payload === 'number' ? { id: payload, factoryCompanyId: undefined } : payload;
      const url = factoryCompanyId ? `/sizing-jobwork-orders/${id}?factoryCompanyId=${factoryCompanyId}` : `/sizing-jobwork-orders/${id}`;
      const response = await apiService.delete(url);
      if ((response as any)?.status === 'success' || (response as any)?.data?.status === 'success') {
        toast.success('Deleted successfully');
        return id;
      }
      const msg = (response as any)?.data?.message || 'Delete failed';
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
   } catch (err: any) {
  const msg = err.response?.data?.message || err.message || 'Delete failed';
  toast.error(msg);
  return thunkAPI.rejectWithValue(msg);
}

  }
);

const sizingJobWorkOrderSlice = createSlice({
  name: 'sizingJobWorkOrder',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllSizingJobWorkOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSizingJobWorkOrders.fulfilled, (state, action) => {
        state.loading = false;
        const { data, total, next, prev, offset, limit } = action.payload;
        state.sizingJobWorkOrderList = data;
        state.paginationInfo = { total, next, prev, offset, limit };
      })
      .addCase(getAllSizingJobWorkOrders.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAllSizingJobWorkOrdersByFactoryCompanyId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSizingJobWorkOrdersByFactoryCompanyId.fulfilled, (state, action) => {
        state.loading = false;
        const { data, total, next, prev, offset, limit } = action.payload;
        state.sizingJobWorkOrderList = data;
        state.paginationInfo = { total, next, prev, offset, limit };
      })
      .addCase(getAllSizingJobWorkOrdersByFactoryCompanyId.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getSizingJobWorkOrderById.fulfilled, (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.getSizingJobWorkOrderByIdList = action.payload;
      })
      .addCase(createSizingJobWorkOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateSizingJobWorkOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteSizingJobWorkOrder.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.sizingJobWorkOrderList = state.sizingJobWorkOrderList.filter((x: any) => x.id !== action.payload);
      });
  },
});

export default sizingJobWorkOrderSlice.reducer;
