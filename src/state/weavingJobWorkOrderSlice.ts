import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";


export interface ApiState {
  loading: boolean;
  error: string | null;
  weavingJobWorkOrderList: any;
  createWeavingContractResult: any;
  getWeavingJobWorkOrderByIdList: any;
  lotEntriesList: any;
  checking: boolean;
  submissionSuccess: boolean;

    pagination: {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
  }
}

const initialState: ApiState = {
  loading: false,
  error: null,
  weavingJobWorkOrderList: [],
  getWeavingJobWorkOrderByIdList: [],
  lotEntriesList: [],
  createWeavingContractResult: null,
  checking: false,
  submissionSuccess: false,
  pagination: {
  total: 0,
  limit: 10,
  offset: 0,
  next: false,
  prev: false,
}
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

const extractJobWorkOrders = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data?.data)) return payload.data.data;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.results)) return payload.results;
    if (payload.data) return extractJobWorkOrders(payload.data);
  }
  return [];
};

export const getAllWeavingJobWorkOrders = createAsyncThunk(
  'weavingJobWorkOrder/getAll',
  async (_: any, thunkAPI) => {
    try {
      const response = await apiService.get('/weaving-work-orders');
      return extractJobWorkOrders(response);
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);


export const getAllWeavingJobWorkOrdersByFactoryCompanyId = createAsyncThunk(
  "weavingJobWorkOrder/getAllByFactoryCompanyId",
  async (
    params: { factoryCompanyId: number; limit?: number; offset?: number; fetchAll?: boolean; filters?: Record<string, any> },
    thunkAPI
  ) => {
    try {
      const { factoryCompanyId, limit = 10, offset = 0, fetchAll = false, filters } = params

      const queryParams = new URLSearchParams()

      if (fetchAll) {
        queryParams.append("limit", "10000")
        queryParams.append("offset", "0")
      } else {
        queryParams.append("limit", String(limit))
        queryParams.append("offset", String(offset))
      }

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value))
          }
        })
      }

      const url = `/weaving-work-orders/factory/${factoryCompanyId}?${queryParams.toString()}`
      const response = await apiService.get(url)

      const paginationData = response?.data

      const rawArray =
        Array.isArray(paginationData?.data)
          ? paginationData.data
          : Array.isArray(paginationData)
          ? paginationData
          : []

      return {
        data: rawArray,
        pagination: {
          total: paginationData?.total || rawArray.length || 0,
          limit: paginationData?.limit ?? (fetchAll ? 10000 : limit),
          offset: paginationData?.offset ?? (fetchAll ? 0 : offset),
          next: paginationData?.next ?? false,
          prev: paginationData?.prev ?? false,
        }
      }

    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message)
    }
  }
)

// export const getAllWeavingJobWorkOrdersByFactoryCompanyId = createAsyncThunk(
//   'weavingJobWorkOrder/getAllByFactoryCompanyId',
//   async (payload: any, thunkAPI) => {
//     try {
//       const factoryCompanyId = typeof payload === 'object' ? payload.factoryCompanyId : payload;
//       const response = await apiService.get(`/weaving-work-orders/factory/${factoryCompanyId}`);
//       return extractJobWorkOrders(response);
//     } catch (err: any) {
//       return thunkAPI.rejectWithValue(err.message);
//     }
//   }
// );


export const getWeavingJobWorkOrderById = createAsyncThunk(
  'weavingJobWorkOrder/getById',
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`/weaving-work-orders/${id}`);
      return response ?? null;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const createWeavingJobWorkOrder = createAsyncThunk(
  'weavingJobWorkOrder/create',
  async (payload: any | { data: any; factoryCompanyId?: number }, thunkAPI) => {
    try {
      // Support both old way (just payload) and new way ({data, factoryCompanyId})
      const isNewFormat = payload.data && !payload.items; // items is a field in the actual order data
      const data = isNewFormat ? payload.data : payload;
      const factoryCompanyId = isNewFormat ? payload.factoryCompanyId : (payload.factoryCompanyId || undefined);

      const url = factoryCompanyId ? `/weaving-work-orders?factoryCompanyId=${factoryCompanyId}` : '/weaving-work-orders';
      const response = await apiService.post(url, data);
      toast.success('Created successfully');
      return response;
    } catch (err: any) {
         const errorMessage = resolveApiErrorMessage(err, "Failed to create weaving job work order");
                                                  toast.error(errorMessage);
                                                  return thunkAPI.rejectWithValue(errorMessage);
      // toast.error(err.message || 'Create failed');
      // return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const updateWeavingJobWorkOrder = createAsyncThunk(
  'weavingJobWorkOrder/update',
  async ({ id, data, factoryCompanyId }: { id: number; data: any; factoryCompanyId?: number }, thunkAPI) => {
    try {
      const url = factoryCompanyId ? `/weaving-work-orders/${id}?factoryCompanyId=${factoryCompanyId}` : `/weaving-work-orders/${id}`;
      const response = await apiService.put(url, data);
      toast.success('Updated successfully');
      return response;
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const deleteWeavingJobWorkOrder = createAsyncThunk(
  'weavingJobWorkOrder/delete',
  async (payload: number | { id: number; factoryCompanyId?: number }, thunkAPI) => {
    try {
      const { id, factoryCompanyId } = typeof payload === 'number' ? { id: payload, factoryCompanyId: undefined } : payload;
      const url = factoryCompanyId ? `/weaving-work-orders/${id}?factoryCompanyId=${factoryCompanyId}` : `/weaving-work-orders/${id}`;
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
      // toast.error(err.message || 'Delete failed');
      // return thunkAPI.rejectWithValue(err.message);
    }
  }
);

const weavingJobWorkOrderSlice = createSlice({
  name: 'weavingJobWorkOrder',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllWeavingJobWorkOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllWeavingJobWorkOrders.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.weavingJobWorkOrderList = action.payload;
      })
      .addCase(getAllWeavingJobWorkOrders.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAllWeavingJobWorkOrdersByFactoryCompanyId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllWeavingJobWorkOrdersByFactoryCompanyId.fulfilled, (state, action: PayloadAction<any>) => {
  state.loading = false
  state.weavingJobWorkOrderList = action.payload.data
  state.pagination = action.payload.pagination
})
      // .addCase(getAllWeavingJobWorkOrdersByFactoryCompanyId.fulfilled, (state, action: PayloadAction<any[]>) => {
      //   state.loading = false;
      //   state.weavingJobWorkOrderList = action.payload;
      // })
      .addCase(getAllWeavingJobWorkOrdersByFactoryCompanyId.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getWeavingJobWorkOrderById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.getWeavingJobWorkOrderByIdList = action.payload;
      })
      .addCase(createWeavingJobWorkOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateWeavingJobWorkOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteWeavingJobWorkOrder.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.weavingJobWorkOrderList = state.weavingJobWorkOrderList.filter((x: any) => x.id !== action.payload);
      });
  },
});

export default weavingJobWorkOrderSlice.reducer;