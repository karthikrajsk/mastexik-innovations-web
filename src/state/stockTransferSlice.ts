// stockTransferSlice.ts
import apiService from "@/services/ApiService";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface FabricTransferItem {
  id?: number;
  slNo: number;
  rollNo: string;
  pieceNo: string;
  meter: number;
  netWeight: number;
  avgWeight: number;
   
  isSelected?: boolean;
}

export interface YarnTransferItem {
  id?: number;
  slNo: number;
  inwardId?: number;
  inwardNo: string | number;
  millName: string;
  lotNo: string;
  noOfBags: number;
  kgPerBag: number;
  kgsPerBag?: number;
  conesPerBag?: number;
  conesWeight?: number;
  totalQuantity: number;
  issuedQty?: number;
  isSelected?: boolean;
}

export interface StockTransfer {
  id?: number;
  stockTransferNo?: string;
  transferDate: string;
  fromGodown?: string;
  toGodown?: string;
  fromGodownId?: number;
  toGodownId?: number;
  fromGodownName?: string;
  toGodownName?: string;
  goodsType: 'Fabric' | 'Yarn';
  itemName: string;
  itemId?: number;
  quantity: number;
  fabricItems?: FabricTransferItem[];
  yarnItems?: YarnTransferItem[];
  referenceNo?: string;
  remarks?: string;
  status?: 'Draft' | 'Completed' | 'Cancelled';
  date?: string;
  companyId?: number;
}

export interface PaginationInfo {
  total: number;
  next: boolean;
  prev: boolean;
  offset: number;
  limit: number;
}

interface StockTransferState {
  loading: boolean;
  error: string | null;
  list: StockTransfer[];
  saving: boolean;
  selectedItems: (FabricTransferItem | YarnTransferItem)[];
  paginationInfo: PaginationInfo;
}

const initialState: StockTransferState = {
  loading: false,
  error: null,
  list: [],
  saving: false,
  selectedItems: [],
  paginationInfo: {
    total: 0,
    next: false,
    prev: false,
    offset: 0,
    limit: 10
  }
};

// Normalize API success responses
const isOk = (res: any) =>
  res?.status === 'success' ||
  res?.status === 'Success' ||
  res?.status === true ||
  res?.ok === true ||
  res?.code === 200 ||
  res?.statusCode === 200 ||
  (res && typeof res === 'object' && (res.id != null || typeof res.transferNo === 'string'));

// Extract StockTransfer array from various response formats
const extractStockTransferArray = (payload: any): StockTransfer[] => {
  if (Array.isArray(payload)) return payload as StockTransfer[];
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data?.data)) return payload.data.data as StockTransfer[];
    if (Array.isArray(payload.data)) return payload.data as StockTransfer[];
    if (payload.data) return extractStockTransferArray(payload.data);
    if (Array.isArray(payload.items)) return payload.items as StockTransfer[];
    if (Array.isArray(payload.results)) return payload.results as StockTransfer[];
  }
  return [];
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
// Normalize response with pagination
const normalizeStockTransferResponse = (
  response: any,
  fallbackOffset: number,
  fallbackLimit: number
) => {
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    const payload = response.data;
    const normalizedData = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.items)
      ? payload.items
      : [];

    return {
      data: normalizedData,
      total: payload.total ?? payload.count ?? payload.pagination?.total ?? normalizedData.length,
      next: payload.next ?? payload.pagination?.next ?? false,
      prev: payload.prev ?? payload.pagination?.prev ?? fallbackOffset > 0,
      offset: payload.offset ?? payload.pagination?.offset ?? fallbackOffset,
      limit: payload.limit ?? payload.pagination?.limit ?? fallbackLimit
    };
  }

  if (Array.isArray(response?.data)) {
    return {
      data: response.data,
      total: response.total ?? response.count ?? response.data.length,
      next: response.next ?? false,
      prev: response.prev ?? false,
      offset: response.offset ?? fallbackOffset,
      limit: response.limit ?? fallbackLimit
    };
  }

  if (Array.isArray(response)) {
    return {
      data: response,
      total: response.length,
      next: false,
      prev: fallbackOffset > 0,
      offset: fallbackOffset,
      limit: fallbackLimit
    };
  }

  return {
    data: [],
    total: 0,
    next: false,
    prev: false,
    offset: fallbackOffset,
    limit: fallbackLimit
  };
};

// API endpoints

export const createStockTransfer = createAsyncThunk(
  'stock-transfers/create',
  async (payload: StockTransfer, thunkAPI) => {
    try {
      // Auto-fetch companyId from localStorage if not provided
      const companyId = payload.companyId || (typeof window !== 'undefined'
        ? Number(localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
        : undefined);
      
      // Calculate total quantity based on items
      if (payload.goodsType === 'Fabric' && payload.fabricItems) {
        payload.quantity = payload.fabricItems.reduce((sum, item) => sum + item.meter, 0);
      } else if (payload.goodsType === 'Yarn' && payload.yarnItems) {
        payload.quantity = payload.yarnItems.reduce((sum, item) => sum + item.totalQuantity, 0);
      }

      // Add companyId to payload
      const payloadWithCompany = { ...payload, companyId };
      
      const res = await apiService.post('/stock-transfers', payloadWithCompany);
      if (isOk(res)) {
        toast.success('Stock transfer created successfully');
        return res?.data || res;
      }
      return thunkAPI.rejectWithValue(res?.message || 'Create failed');
    }  catch (error: any) {
                                const errorMessage = resolveApiErrorMessage(error, "Failed to create Stock Transfer");
                                toast.error(errorMessage);
                                return thunkAPI.rejectWithValue(errorMessage);
                            }
  }
);
export const getAllStockTransfers = createAsyncThunk(
  'stock-transfers/getAll',
  async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
    try {
      // Auto-fetch companyId from localStorage if not provided
      const companyId = params.companyId || (typeof window !== 'undefined'
        ? Number(localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
        : undefined);
      
      const fetchAll = params.fetchAll ?? false;
      const offset = fetchAll ? 0 : (params.offset ?? 0);
      const limit = fetchAll ? 10000 : (params.limit ?? 10000);

      const queryParams = new URLSearchParams();
      queryParams.append('offset', String(offset));
      queryParams.append('limit', String(limit));

      let endpoint = companyId ? `/stock-transfers/company/${companyId}` : `/stock-transfers`;
      const queryString = queryParams.toString();
      if (queryString) {
        endpoint = `${endpoint}?${queryString}`;
      }

      const response = await apiService.get(endpoint);
      const normalized = normalizeStockTransferResponse(response, offset, limit);

      return {
        data: normalized.data,
        total: normalized.total,
        next: normalized.next,
        prev: normalized.prev,
        offset: normalized.offset,
        limit: normalized.limit
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to fetch stock transfers');
    }
  }
);
export const getStockTransferById = createAsyncThunk(
  'stock-transfers/getById',
  async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
    try {
      const url = companyId ? `/stock-transfers/company/${companyId}/${id}` : `/stock-transfers/${id}`;
      const res = await apiService.get(url);
      return res?.data || res;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to fetch stock transfer');
    }
  }
);

export const updateStockTransfer = createAsyncThunk(
  'stock-transfers/update',
  async (payload: StockTransfer & { id: number; companyId?: number }, thunkAPI) => {
    try {
      // Auto-fetch companyId from localStorage if not provided
      const companyId = payload.companyId || (typeof window !== 'undefined'
        ? Number(localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
        : undefined);
      
      // Calculate total quantity based on items
      if (payload.goodsType === 'Fabric' && payload.fabricItems) {
        payload.quantity = payload.fabricItems.reduce((sum, item) => sum + item.meter, 0);
      } else if (payload.goodsType === 'Yarn' && payload.yarnItems) {
        payload.quantity = payload.yarnItems.reduce((sum, item) => sum + item.totalQuantity, 0);
      }

      // Add companyId to payload
      const payloadWithCompany = { ...payload, companyId };
      
      const url = companyId ? `/stock-transfers/company/${companyId}/${payload.id}` : `/stock-transfers/${payload.id}`;
      const res = await apiService.put(url, payloadWithCompany);
      if (isOk(res)) {
        toast.success('Stock transfer updated successfully');
        return res?.data || res;
      }
      return thunkAPI.rejectWithValue(res?.message || 'Update failed');
    } catch (error: any) {
                   const errorMessage = resolveApiErrorMessage(error, "Failed to create Stock Transfer");
                                toast.error(errorMessage);
                                return thunkAPI.rejectWithValue(errorMessage);
            }
  }
);


export const deleteStockTransfer = createAsyncThunk(
  'stock-transfers/delete',
  async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
    try {
      // Auto-fetch companyId from localStorage if not provided
      const resolvedCompanyId = companyId || (typeof window !== 'undefined'
        ? Number(localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
        : undefined);
      
      const url = resolvedCompanyId ? `/stock-transfers/company/${resolvedCompanyId}/${id}` : `/stock-transfers/${id}`;
      const res = await apiService.delete(url);
      if (res?.status === 'success') {
        toast.success('Stock transfer deleted successfully');
        return id;
      }
      return thunkAPI.rejectWithValue(res?.message || 'Delete failed');
    } catch (err: any) {
        const errorMessage = resolveApiErrorMessage(err, "Failed to delete Stock Transfer");
         toast.error(errorMessage);
      return thunkAPI.rejectWithValue(err.message || 'Delete failed');
    }
  }
);

// Types for the item creation without slNo
interface FabricItemInput {
  id?: number;
  rollNo: string;
  pieceNo: string;
  meter: number;
  netWeight: number;
  avgWeight: number;
  isSelected?: boolean;
}

interface YarnItemInput {
  id?: number;
  inwardId?: number;
  inwardNo: string | number;
  millName: string;
  lotNo: string;
  noOfBags: number;
  kgPerBag: number;
  kgsPerBag?: number;
  conesPerBag?: number;
  conesWeight?: number;
  totalQuantity?: number;
  issuedQty?: number;
  isSelected?: boolean;
}

// Additional actions for item selection - FIXED VERSION
export const addFabricItem = createAsyncThunk(
  'stock-transfers/addFabricItem',
  async (itemInput: FabricItemInput, thunkAPI) => {
    try {
      // This would typically call an API to validate/add the fabric item
      // Create the complete fabric item with slNo (will be set in reducer)
      const fabricItem: FabricTransferItem = {
        ...itemInput,
        slNo: 0 // temporary, will be set properly in reducer
      };
      return fabricItem;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to add fabric item');
    }
  }
);

export const addYarnItem = createAsyncThunk(
  'stock-transfers/addYarnItem',
  async (itemInput: YarnItemInput, thunkAPI) => {
    try {
      const kgsPerBag = Number(itemInput.kgsPerBag ?? itemInput.kgPerBag ?? 0);
      const conesPerBag = Number(itemInput.conesPerBag ?? 0);
      const conesWeight = itemInput.conesWeight != null
        ? Number(itemInput.conesWeight)
        : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);

      const yarnItem: YarnTransferItem = {
        ...itemInput,
        kgPerBag: kgsPerBag,
        kgsPerBag,
        conesPerBag,
        conesWeight,
        totalQuantity: itemInput.noOfBags * kgsPerBag,
        slNo: 0
      };
      return yarnItem;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message || 'Failed to add yarn item');
    }
  }
);

const stockTransferSlice = createSlice({
  name: 'stockTransfer',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedItems: (state) => {
      state.selectedItems = [];
    },
    addToSelectedItems: (state, action: PayloadAction<FabricTransferItem | YarnTransferItem>) => {
      const newItem = {
        ...action.payload,
        slNo: state.selectedItems.length + 1
      };
      state.selectedItems.push(newItem);
    },
    removeFromSelectedItems: (state, action: PayloadAction<number>) => {
      state.selectedItems = state.selectedItems.filter(item => item.slNo !== action.payload);
      // Recalculate slNo for remaining items
      state.selectedItems = state.selectedItems.map((item, index) => ({
        ...item,
        slNo: index + 1
      }));
    },
    updateFabricItem: (state, action: PayloadAction<FabricTransferItem>) => {
      const transfer = state.list.find(t => t.goodsType === 'Fabric');
      if (transfer?.fabricItems) {
        const index = transfer.fabricItems.findIndex(item => item.slNo === action.payload.slNo);
        if (index !== -1) {
          transfer.fabricItems[index] = action.payload;
        }
      }
    },
    updateYarnItem: (state, action: PayloadAction<YarnTransferItem>) => {
      const transfer = state.list.find(t => t.goodsType === 'Yarn');
      if (transfer?.yarnItems) {
        const index = transfer.yarnItems.findIndex(item => item.slNo === action.payload.slNo);
        if (index !== -1) {
          transfer.yarnItems[index] = action.payload;
        }
      }
    },
    // New reducer to manually add items without async thunk
    addFabricItemManual: (state, action: PayloadAction<FabricItemInput>) => {
      const newItem: FabricTransferItem = {
        ...action.payload,
        slNo: state.selectedItems.length + 1
      };
      state.selectedItems.push(newItem);
    },
    addYarnItemManual: (state, action: PayloadAction<YarnItemInput>) => {
      const kgsPerBag = Number(action.payload.kgsPerBag ?? action.payload.kgPerBag ?? 0);
      const conesPerBag = Number(action.payload.conesPerBag ?? 0);
      const conesWeight = action.payload.conesWeight != null
        ? Number(action.payload.conesWeight)
        : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);
      const totalQuantity = action.payload.totalQuantity !== undefined
        ? action.payload.totalQuantity
        : (action.payload.noOfBags * kgsPerBag);

      const newItem: YarnTransferItem = {
        ...action.payload,
        kgPerBag: kgsPerBag,
        kgsPerBag,
        conesPerBag,
        conesWeight,
        totalQuantity,
        issuedQty: action.payload.issuedQty || 0,
        slNo: state.selectedItems.length + 1
      };
      state.selectedItems.push(newItem);
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Stock Transfers
      .addCase(getAllStockTransfers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllStockTransfers.fulfilled, (state: any, action) => {
        state.loading = false;
        const { data, total, next, prev, offset, limit } = action.payload;
        state.list = Array.isArray(data) ? data : [];
        state.paginationInfo = { total, next, prev, offset, limit };
      })
      .addCase(getAllStockTransfers.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Stock Transfer By ID
      .addCase(getStockTransferById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStockTransferById.fulfilled, (state, action: PayloadAction<StockTransfer>) => {
        state.loading = false;
        const index = state.list.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        } else {
          state.list.push(action.payload);
        }
      })
      .addCase(getStockTransferById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Stock Transfer
      .addCase(createStockTransfer.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createStockTransfer.fulfilled, (state, action: PayloadAction<StockTransfer>) => {
        state.saving = false;
        state.list.push(action.payload);
        state.selectedItems = [];
      })
      .addCase(createStockTransfer.rejected, (state, action: any) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Update Stock Transfer
      .addCase(updateStockTransfer.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateStockTransfer.fulfilled, (state, action: PayloadAction<StockTransfer>) => {
        state.saving = false;
        const index = state.list.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.selectedItems = [];
      })
      .addCase(updateStockTransfer.rejected, (state, action: any) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Delete Stock Transfer
      .addCase(deleteStockTransfer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStockTransfer.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.list = state.list.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteStockTransfer.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Fabric Item - FIXED
      .addCase(addFabricItem.fulfilled, (state, action: PayloadAction<FabricTransferItem>) => {
        const newItem = {
          ...action.payload,
          slNo: state.selectedItems.length + 1
        };
        state.selectedItems.push(newItem);
      })

      // Add Yarn Item - FIXED
      .addCase(addYarnItem.fulfilled, (state, action: PayloadAction<YarnTransferItem>) => {
        const newItem = {
          ...action.payload,
          slNo: state.selectedItems.length + 1
        };
        state.selectedItems.push(newItem);
      });
  }
});

export const {
  clearError,
  clearSelectedItems,
  addToSelectedItems,
  removeFromSelectedItems,
  updateFabricItem,
  updateYarnItem,
  addFabricItemManual,
  addYarnItemManual,
} = stockTransferSlice.actions;

export default stockTransferSlice.reducer;