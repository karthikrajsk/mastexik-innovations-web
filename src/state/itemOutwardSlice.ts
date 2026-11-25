import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ItemOutwardItem {
  id?: number;
  itemId: number;
  itemName: string;
  itemCode: string;
  availableBags: number;
  availableQuantity: number;
  unitPerBags: number;
  issuingBags: number;
  issuingQuantity: number;
  inwardNo?: string;
  warehouseId?: number;
  warehouseName?: string;
  itemStockDetailId?: number;
  machineId?: number | null;
  machineName?: string | null;
}

export interface ItemOutwardPayload {
  id?: number;
  outwardDate: string;
  outwardNo?: string;
  vendorId: number;
  department: string;
  machineName?: string | null;
  machineId?: number | null;
  warehouseId: number;
  companyId: number;
  items: ItemOutwardItem[];
  activeFlag?: boolean;
}

export interface PaginationInfo {
  total: number;
  next: boolean;
  prev: boolean;
  offset: number;
  limit: number;
}

export interface ItemOutwardState {
  loading: boolean;
  error: string | null;
  itemOutwardList: any[];
  paginationInfo: PaginationInfo;
  createResult: any;
  machineNameSuggestions: string[];
}

const initialState: ItemOutwardState = {
  loading: false,
  error: null,
  itemOutwardList: [],
  paginationInfo: {
    total: 0,
    next: false,
    prev: false,
    offset: 0,
    limit: 10
  },
  createResult: null,
  machineNameSuggestions: [],
};

const coerceNumber = (value: any, fallback: number) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
};

const coerceBoolean = (value: any) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return false;
};

const getStoredCompanyId = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
};

const resolveCompanyId = (input?: number | string | null) => {
  const value = input ?? getStoredCompanyId();
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length ? str : null;
};

const extractPaginationPayload = (payload: any) => {
  if (
    payload?.data &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data) &&
    ('data' in payload.data || 'total' in payload.data || 'offset' in payload.data || 'limit' in payload.data)
  ) {
    return payload.data;
  }
  return payload;
};

// Get all Item Outwards with pagination
export const getAllItemOutwards = createAsyncThunk(
  'item-outward/getAll',
  async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number | string } = {}, thunkAPI) => {
    try {
      const offset = params.fetchAll ? 0 : (params.offset ?? 0);
      const limit = params.fetchAll ? 10000 : (params.limit ?? 10000);
      const queryParams = new URLSearchParams();
      queryParams.append('offset', String(offset));
      queryParams.append('limit', String(limit));
      
      const resolvedCompanyId = resolveCompanyId(params.companyId ?? null);
      let basePath: string;
      
      if (params.fetchAll) {
        basePath = '/item-outward/all';
      } else if (resolvedCompanyId) {
        basePath = `/item-outward/company/${resolvedCompanyId}`;
      } else {
        basePath = '/item-outward';
      }
      
      const url = params.fetchAll ? basePath : `${basePath}?${queryParams.toString()}`;
      const response: any = await apiService.get(url);
      const payload: any = extractPaginationPayload(response) ?? {};
      
      let list: any[] = [];
      if (params.fetchAll) {
        // For /all endpoint, response is directly an array
        list = Array.isArray(response?.data) 
          ? response.data 
          : Array.isArray(response) 
          ? response 
          : [];
      } else {
        list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.result)
          ? payload.result
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];
      }

      return {
        data: list,
        total: params.fetchAll ? list.length : coerceNumber(payload?.total, list.length),
        next: params.fetchAll ? false : coerceBoolean(payload?.next),
        prev: params.fetchAll ? false : coerceBoolean(payload?.prev),
        offset: params.fetchAll ? 0 : coerceNumber(payload?.offset, offset),
        limit: params.fetchAll ? list.length : coerceNumber(payload?.limit, limit)
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Get Material Issue by ID
export const getItemOutwardById = createAsyncThunk(
  'item-outward/getById',
  async (params: { id: number; companyId?: number | string }, thunkAPI) => {
    try {
      const resolvedCompanyId = resolveCompanyId(params.companyId ?? null);
      const endpoint = resolvedCompanyId 
        ? `/item-outward/company/${resolvedCompanyId}/${params.id}`
        : `/item-outward/${params.id}`;
      
      const response: any = await apiService.get(endpoint);
      return response?.data || response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Create Material Issue
export const createItemOutward = createAsyncThunk(
  'item-outward/create',
  async (params: ItemOutwardPayload, thunkAPI) => {
    try {
      const backendPayload = {
        outwardDate: params.outwardDate,
        outwardNo: params.outwardNo,
        vendorId: params.vendorId,
        department: params.department,
        machineName: params.machineName || null,
        machineId: params.machineId || null,
        warehouseId: params.warehouseId,
        companyId: params.companyId,
        items: (params.items || []).map(item => ({
          id: item.id && typeof item.id === 'number' ? item.id : undefined,
          itemId: Number(item.itemId),
          itemName: item.itemName || '',
          itemCode: item.itemCode || '',
          availableBags: Number(item.availableBags || 0),
          availableQuantity: Number(item.availableQuantity || 0),
          unitPerBags: Number(item.unitPerBags || 0),
          issuingBags: Number(item.issuingBags || 0),
          issuingQuantity: Number(item.issuingQuantity || 0),
          inwardNo: item.inwardNo || '',
          warehouseId: item.warehouseId ? Number(item.warehouseId) : null,
          itemStockDetailId: item.itemStockDetailId ? Number(item.itemStockDetailId) : null,
          machineId: item.machineId ? Number(item.machineId) : null,
          machineName: item.machineName || null,
        })),
        activeFlag: params.activeFlag !== undefined ? params.activeFlag : true,
      };

      const response = await apiService.post("/item-outward", backendPayload);
      toast.success("Material Issue created successfully!");
      return response?.data || response;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "Failed to create Material Issue";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Update Material Issue
export const updateItemOutward = createAsyncThunk(
  'item-outward/update',
  async ({ id, data, companyId }: { id: number, data: ItemOutwardPayload, companyId?: number | string }, thunkAPI) => {
    try {
      const backendPayload = {
        outwardDate: data.outwardDate,
        outwardNo: data.outwardNo,
        vendorId: data.vendorId,
        department: data.department,
        machineName: data.machineName || null,
        machineId: data.machineId || null,
        warehouseId: data.warehouseId,
        companyId: data.companyId,
        items: (data.items || []).map(item => ({
          id: item.id && typeof item.id === 'number' ? item.id : undefined,
          itemId: Number(item.itemId),
          itemName: item.itemName || '',
          itemCode: item.itemCode || '',
          availableBags: Number(item.availableBags || 0),
          availableQuantity: Number(item.availableQuantity || 0),
          unitPerBags: Number(item.unitPerBags || 0),
          issuingBags: Number(item.issuingBags || 0),
          issuingQuantity: Number(item.issuingQuantity || 0),
          inwardNo: item.inwardNo || '',
          warehouseId: item.warehouseId ? Number(item.warehouseId) : null,
          itemStockDetailId: item.itemStockDetailId ? Number(item.itemStockDetailId) : null,
          machineId: item.machineId ? Number(item.machineId) : null,
          machineName: item.machineName || null,
        })),
        activeFlag: data.activeFlag !== undefined ? data.activeFlag : true,
      };

      const resolvedCompanyId = resolveCompanyId(companyId ?? data.companyId ?? null);
      const endpoint = resolvedCompanyId 
        ? `/item-outward/company/${resolvedCompanyId}/${id}` 
        : `/item-outward/${id}`;
      
      const response = await apiService.put(endpoint, backendPayload);
      toast.success("Material Issue updated successfully!");
      return response?.data || response;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "Failed to update Material Issue";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Delete Material Issue
export const deleteItemOutward = createAsyncThunk(
  'item-outward/delete',
  async (params: number | { id: number; companyId?: number | string }, thunkAPI) => {
    try {
      const targetId = typeof params === 'number' ? params : params.id;
      const providedCompanyId = typeof params === 'number' ? undefined : params.companyId;
      const resolvedCompanyId = resolveCompanyId(providedCompanyId ?? null);
      
      const endpoint = resolvedCompanyId 
        ? `/item-outward/company/${resolvedCompanyId}/${targetId}` 
        : `/item-outward/${targetId}`;
      
      await apiService.delete(endpoint);
      toast.success("Material Issue deleted successfully");
      return targetId;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "Failed to delete Material Issue";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// // Get Machine Name Suggestions
// export const getMachineNameSuggestions = createAsyncThunk(
//   'item-outward/getMachineNameSuggestions',
//   async (_, thunkAPI) => {
//     try {
//       const response: any = await apiService.get("/item-outward/suggestions/machine-no-names");
//       const suggestions = Array.isArray(response?.data) 
//         ? response.data 
//         : Array.isArray(response) 
//         ? response 
//         : [];
//       return suggestions;
//     } catch (error: any) {
//       return thunkAPI.rejectWithValue(error.message);
//     }
//   }
// );

const itemOutwardSlice = createSlice({
  name: 'itemOutward',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get All
      .addCase(getAllItemOutwards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllItemOutwards.fulfilled, (state: any, action: PayloadAction<any>) => {
        state.loading = false;
        const { data, total, next, prev, offset, limit } = action.payload;
        state.itemOutwardList = Array.isArray(data) ? data : [];
        state.paginationInfo = { total, next, prev, offset, limit };
      })
      .addCase(getAllItemOutwards.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get By ID
      .addCase(getItemOutwardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getItemOutwardById.fulfilled, (state, action: any) => {
        state.loading = false;
        // Optionally store the fetched item
      })
      .addCase(getItemOutwardById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createItemOutward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createItemOutward.fulfilled, (state, action: any) => {
        state.loading = false;
        state.createResult = action.payload;
      })
      .addCase(createItemOutward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateItemOutward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItemOutward.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateItemOutward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteItemOutward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItemOutward.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.itemOutwardList = state.itemOutwardList.filter((r: any) => r.id !== action.payload);
      })
      .addCase(deleteItemOutward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      // // Get Machine Name Suggestions
      // .addCase(getMachineNameSuggestions.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      // .addCase(getMachineNameSuggestions.fulfilled, (state, action: PayloadAction<string[]>) => {
      //   state.loading = false;
      //   state.machineNameSuggestions = action.payload;
      // })
      // .addCase(getMachineNameSuggestions.rejected, (state, action: any) => {
      //   state.loading = false;
      //   state.error = action.payload;
      // });
  }
});

export default itemOutwardSlice.reducer;

