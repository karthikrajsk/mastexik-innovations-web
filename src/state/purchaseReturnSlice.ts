import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface PurchaseReturnItem {
  id?: number;
  // Common
  productType: 'yarn' | 'woven' | 'knitted';
  // Yarn specific
  yarnId?: string | null;
  yarnName?: string;
  uom?: string;
  millNameId?: string | null; // ADD THIS
  // Fabric specific
  fabricMasterId?: string | null;
  fabricCode?: string;
  quality?: string;
  // Quantities
  returnQuantity?: number; // pieces/meters for fabric, kgs for yarn
  weightKgs?: number | null;
}

export interface PurchaseReturnPayload {
  id?: number;
  returnDate: string;
  purchaseType: 'yarn' | 'woven' | 'knitted';
  vendorId: number | string;
  purchaseOrderId: number | string;
  itemId?: number | string | null; // optional single item selection
  items: PurchaseReturnItem[];
  activeFlag?: boolean;
}

export interface PaginationInfo {
  total: number;
  next: boolean;
  prev: boolean;
  offset: number;
  limit: number;
}

export interface PurchaseReturnState {
  loading: boolean;
  error: string | null;
  purchaseReturnList: any[];
  paginationInfo: PaginationInfo;
  createResult: any;
}

const initialState: PurchaseReturnState = {
  loading: false,
  error: null,
  purchaseReturnList: [],
  paginationInfo: {
    total: 0,
    next: false,
    prev: false,
    offset: 0,
    limit: 10
  },
  createResult: null,
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

export const getAllPurchaseReturns = createAsyncThunk(
  'purchase-returns/getAll',
  async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number | string } = {}, thunkAPI) => {
    try {
      const offset = params.fetchAll ? 0 : (params.offset ?? 0);
      const limit = params.fetchAll ? 10000 : (params.limit ?? 10000);
      const queryParams = new URLSearchParams();
      queryParams.append('offset', String(offset));
      queryParams.append('limit', String(limit));
      const resolvedCompanyId = resolveCompanyId(params.companyId ?? null);
      const basePath = resolvedCompanyId ? `/purchase-returns/company/${resolvedCompanyId}` : `/purchase-returns`;
      const response: any = await apiService.get(`${basePath}?${queryParams.toString()}`);
      const payload: any = extractPaginationPayload(response) ?? {};
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.result)
        ? payload.result
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      return {
        data: list,
        total: coerceNumber(payload?.total, list.length),
        next: coerceBoolean(payload?.next),
        prev: coerceBoolean(payload?.prev),
        offset: coerceNumber(payload?.offset, offset),
        limit: coerceNumber(payload?.limit, limit)
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);


export const createPurchaseReturn = createAsyncThunk(
  'purchase-returns/create',
  async (payload: any, thunkAPI) => {
    try {
      console.log('=== REDUX SLICE - CREATE PAYLOAD ===');
      console.log(JSON.stringify(payload, null, 2));

      const response = await apiService.post("/purchase-returns", payload);
      toast.success("Purchase Return saved successfully!");
      return response?.data || response;
    } catch (error: any) {
      toast.error(error.message || "Failed to create");
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updatePurchaseReturn = createAsyncThunk(
  'purchase-returns/update',
  async ({ id, data, companyId }: { id: number, data: any, companyId?: number }, thunkAPI) => {
    try {
      console.log('=== REDUX SLICE - UPDATE PAYLOAD ===');
      console.log(JSON.stringify(data, null, 2));

      const resolvedCompanyId = resolveCompanyId(companyId ?? (data as any)?.companyId ?? null);
      const endpoint = resolvedCompanyId ? `/purchase-returns/company/${resolvedCompanyId}/${id}` : `/purchase-returns/${id}`;
      const response = await apiService.put(endpoint, data);
      toast.success("Purchase Return updated successfully!");
      return response?.data || response;
    } catch (error: any) {
      toast.error(error.message || "Update failed");
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const deletePurchaseReturn = createAsyncThunk(
  'purchase-returns/delete',
  async (params: number | { id: number; companyId?: number | string }, thunkAPI) => {
    try {
      const targetId = typeof params === 'number' ? params : params.id;
      const providedCompanyId = typeof params === 'number' ? undefined : params.companyId;
      const resolvedCompanyId = resolveCompanyId(providedCompanyId ?? null);
      const endpoint = resolvedCompanyId ? `/purchase-returns/company/${resolvedCompanyId}/${targetId}` : `/purchase-returns/${targetId}`;
      await apiService.delete(endpoint);
      toast.success("Successfully deleted");
      return targetId;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "Delete failed";
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

const purchaseReturnSlice = createSlice({
  name: 'purchaseReturn',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllPurchaseReturns.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(getAllPurchaseReturns.fulfilled, (state: any, action: PayloadAction<any>) => {
        state.loading = false;
        const { data, total, next, prev, offset, limit } = action.payload;
        state.purchaseReturnList = Array.isArray(data) ? data : [];
        state.paginationInfo = { total, next, prev, offset, limit };
      })
      .addCase(getAllPurchaseReturns.rejected, (state, action: any) => {
        state.loading = false; state.error = action.payload;
      })

      .addCase(createPurchaseReturn.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(createPurchaseReturn.fulfilled, (state, action: any) => {
        state.loading = false; state.createResult = action.payload;
      })
      .addCase(createPurchaseReturn.rejected, (state, action: any) => {
        state.loading = false; state.error = action.payload;
      })

      .addCase(updatePurchaseReturn.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(updatePurchaseReturn.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePurchaseReturn.rejected, (state, action: any) => {
        state.loading = false; state.error = action.payload;
      })

      .addCase(deletePurchaseReturn.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(deletePurchaseReturn.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.purchaseReturnList = state.purchaseReturnList.filter((r: any) => r.id !== action.payload);
      })
      .addCase(deletePurchaseReturn.rejected, (state, action: any) => {
        state.loading = false; state.error = action.payload;
      })
  }
});

export default purchaseReturnSlice.reducer;