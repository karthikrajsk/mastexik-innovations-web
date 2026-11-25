import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '@/services/ApiService';
import { toast } from 'react-toastify';

// ────────────────────────────────────────────────
// Shared / Reusable types & helpers (like weft slice)
// ────────────────────────────────────────────────

export interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

const extractDataArray = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.data && payload.data !== payload) {
    return extractDataArray(payload.data);
  }
  return [];
};

const resolvePaginationMeta = (payload: any): any => {
  if (!payload || typeof payload !== 'object') return null;
  if (payload?.pagination) return resolvePaginationMeta(payload.pagination);
  const hasTotals =
    Object.prototype.hasOwnProperty.call(payload, 'total') ||
    Object.prototype.hasOwnProperty.call(payload, 'limit') ||
    Object.prototype.hasOwnProperty.call(payload, 'offset');
  if (hasTotals) return payload;
  if (payload?.data && payload.data !== payload) {
    return resolvePaginationMeta(payload.data);
  }
  return null;
};

const toNumberOrFallback = (value: any, fallback: number) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const mapApiResponse = (response: any, limit: number, offset: number) => {
  const source = response?.data ?? response;
  const rawData = extractDataArray(source);
  const paginationSource = resolvePaginationMeta(source);
  const resolvedLimit = toNumberOrFallback(paginationSource?.limit, limit);
  const resolvedOffset = toNumberOrFallback(paginationSource?.offset, offset);
  const total = toNumberOrFallback(paginationSource?.total, rawData.length);
  const nextOffset = resolvedOffset + resolvedLimit;

  return {
    data: rawData,
    pagination: {
      total,
      limit: resolvedLimit,
      offset: resolvedOffset,
      next: nextOffset < total,
      prev: resolvedOffset > 0,
    },
  };
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;
  const candidates: string[] = [];

  if (typeof responseData === 'string') candidates.push(responseData);
  else if (responseData) {
    if (typeof responseData.message === 'string') candidates.push(responseData.message);
    if (typeof responseData.error === 'string') candidates.push(responseData.error);
    if (typeof responseData.data === 'string') candidates.push(responseData.data);

    if (responseData.data && typeof responseData.data === 'object') {
      if (typeof responseData.data.message === 'string') candidates.push(responseData.data.message);
      if (typeof responseData.data.error === 'string') candidates.push(responseData.data.error);
      if (Array.isArray(responseData.data.errors)) {
        responseData.data.errors.forEach((err: any) => {
          if (typeof err === 'string') candidates.push(err);
          else if (typeof err?.message === 'string') candidates.push(err.message);
        });
      }
    }

    if (Array.isArray(responseData.errors)) {
      responseData.errors.forEach((err: any) => {
        if (typeof err === 'string') candidates.push(err);
        else if (typeof err?.message === 'string') candidates.push(err.message);
      });
    }
  }

  const candidate = candidates.find((msg) => typeof msg === 'string' && msg.trim());
  return candidate || error?.message || fallback;
};

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

export interface ScannedRollsItems {
  packingListNo: string;
  rollNo: string;
  isLoadedPacking: 0 | 1;
  meters?: number;
  netWeight?: number;
  grossWeight?: number;
}

export interface SummaryRollItems {
  packingListNo: string;
  noOfRolls: number;
  totalMeters: number;
  netWeight: number;
  grossWeight: number;
}

export interface FormDatas {
  buyerId: number | null;
  buyerName?: string;
  orderId?: number;
  orderNo?: string;
  invoiceId?: number;
  invoiceNo?: string;
  fabricMasterId?: number;
  fabricCodeQuality?: string;
  rolls: ScannedRollsItems[];
  summary: SummaryRollItems[];
}

export interface DispatchRegisterRecord {
  id: number;
  buyerId: number;
  buyerName: string;
  salesOrderNo: string;
  invoiceNo: string;
  packingListNos: string[];
  fabricDetails: string;
  invoiceId: number;
  // you can add more fields returned by backend (lastScannedAt, etc.)
}

interface ScanDispatchState {
  formData: FormDatas;
  completedInvoices: number[];
  registerRecords: DispatchRegisterRecord[];
  registerLoading: boolean;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
}

const initialState: ScanDispatchState = {
  formData: {
    buyerId: null,
    buyerName: '',
    orderId: undefined,
    orderNo: '',
    invoiceId: undefined,
    invoiceNo: '',
    fabricMasterId: undefined,
    fabricCodeQuality: '',
    rolls: [],
    summary: [],
  },
  completedInvoices: [],
  registerRecords: [],
  registerLoading: false,
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    next: false,
    prev: false,
  },
  loading: false,
  error: null,
  saving: false,
  saveError: null,
};

// ────────────────────────────────────────────────
// Thunks
// ────────────────────────────────────────────────

const BASE = '/scan-dispatch';

export const fetchDispatchRegister = createAsyncThunk(
  'scanDispatch/fetchDispatchRegister',
  async (
    params:
      | { limit?: number; offset?: number; search?: string; buyerId?: number; invoiceNo?: string }
      | undefined,
    thunkAPI
  ) => {
    try {
      const effectiveLimit = params?.limit ?? 10;
      const effectiveOffset = params?.offset ?? 0;

      const query = new URLSearchParams();
      query.append('limit', String(effectiveLimit));
      query.append('offset', String(effectiveOffset));
      if (params?.search) query.append('search', params.search.trim());
      if (params?.buyerId) query.append('buyerId', String(params.buyerId));
      if (params?.invoiceNo) query.append('invoiceNo', params.invoiceNo.trim());

      const response = await apiService.get(`${BASE}/register?${query.toString()}`);
      return mapApiResponse(response, effectiveLimit, effectiveOffset);
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, 'Failed to load dispatch register');
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Optional – if you want company-specific filtering later
export const fetchDispatchRegisterByCompany = createAsyncThunk(
  'scanDispatch/fetchByCompany',
  async (
    payload: { companyId: number; limit?: number; offset?: number; search?: string },
    thunkAPI
  ) => {
    try {
      const { companyId, ...rest } = payload;
      const query = new URLSearchParams();
      query.append('limit', String(rest.limit ?? 10));
      query.append('offset', String(rest.offset ?? 0));
      if (rest.search) query.append('search', rest.search.trim());

      const response = await apiService.get(
        `${BASE}/register/factory/${companyId}?${query.toString()}`
      );
      return mapApiResponse(response, rest.limit ?? 10, rest.offset ?? 0);
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, 'Failed to load company dispatch register');
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const fetchScanDispatchesByCompany = createAsyncThunk(
  'scanDispatch/fetchScanDispatchesByCompany',
  async (
    payload: { companyId: number; limit?: number; offset?: number; search?: string },
    thunkAPI
  ) => {
    try {
      const { companyId, limit = 10, offset = 0, search } = payload;
      const query = new URLSearchParams();
      if (search) {
        query.append('search', search.trim());
      }
      const queryString = query.toString();
      const endpoint = `${BASE}/company/${companyId}${queryString ? `?${queryString}` : ''}`;
      const response = await apiService.get(endpoint);
      return mapApiResponse(response, limit, offset);
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, 'Failed to load company scan dispatches');
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const markInvoiceLoadedBackend = createAsyncThunk<number, number>(
  'scanDispatch/markInvoiceLoadedBackend',
  async (invoiceId, thunkAPI) => {
    try {
      const response = await apiService.post(`${BASE}/mark-loaded`, { invoiceId });
      toast.success('Invoice marked as dispatched');
      return invoiceId;
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, 'Failed to mark invoice as loaded');
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const createScanDispatch = createAsyncThunk(
  'scanDispatch/createScanDispatch',
  async (
    payload: { formData: FormDatas; companyId?: number },
    thunkAPI
  ) => {
    try {
      const body = {
        ...payload.formData,
        companyId: payload.companyId,
      };
      const response = await apiService.post(BASE, body);
      toast.success('Dispatch saved successfully');
      return response?.data ?? response;
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, 'Failed to save scan dispatch');
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateScanDispatch = createAsyncThunk(
  'scanDispatch/updateScanDispatch',
  async (
    payload: { id: number; formData: FormDatas; companyId?: number },
    thunkAPI
  ) => {
    try {
      const body = {
        ...payload.formData,
        companyId: payload.companyId,
      };
      const endpoint = payload.companyId
        ? `${BASE}/company/${payload.companyId}/${payload.id}`
        : `${BASE}/${payload.id}`;
      const response = await apiService.put(endpoint, body);
      toast.success('Dispatch updated successfully');
      return response?.data ?? response;
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, 'Failed to update scan dispatch');
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteScanDispatchByCompany = createAsyncThunk(
  'scanDispatch/deleteScanDispatchByCompany',
  async (
    payload: { id: number; companyId: number },
    thunkAPI
  ) => {
    try {
      await apiService.delete(`${BASE}/company/${payload.companyId}/${payload.id}`);
      toast.success('Scan dispatch deleted');
      return payload.id;
    } catch (error: any) {
      const msg = resolveApiErrorMessage(error, 'Failed to delete scan dispatch');
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// ────────────────────────────────────────────────
// Slice
// ────────────────────────────────────────────────

const scanDispatchSlice = createSlice({
  name: 'scanDispatch',
  initialState,
  reducers: {
    setFormData(state, action: PayloadAction<Partial<FormDatas>>) {
      state.formData = { ...state.formData, ...action.payload };
    },
    setBuyerSelection(
      state,
      action: PayloadAction<{ buyerId: number | null; buyerName?: string }>
    ) {
      const { buyerId, buyerName } = action.payload;
      state.formData.buyerId = buyerId;
      state.formData.buyerName = buyerName ?? '';
    },
    setInvoiceSelection(
      state,
      action: PayloadAction<{ invoiceId?: number; invoiceNo?: string; orderId?: number; orderNo?: string }>
    ) {
      state.formData.invoiceId = action.payload.invoiceId;
      state.formData.invoiceNo = action.payload.invoiceNo ?? '';
      state.formData.orderId = action.payload.orderId;
      state.formData.orderNo = action.payload.orderNo ?? '';
      state.formData.rolls = [];
      state.formData.summary = [];
    },
    setFabricSelection(
      state,
      action: PayloadAction<{ fabricMasterId?: number; fabricCodeQuality?: string }>
    ) {
      state.formData.fabricMasterId = action.payload.fabricMasterId;
      state.formData.fabricCodeQuality = action.payload.fabricCodeQuality ?? '';
    },
    setScannedRolls(state, action: PayloadAction<ScannedRollsItems[]>) {
      state.formData.rolls = action.payload;
    },
    addScannedRoll(state, action: PayloadAction<ScannedRollsItems>) {
      state.formData.rolls.push(action.payload);
    },
    setSummary(state, action: PayloadAction<SummaryRollItems[]>) {
      state.formData.summary = action.payload;
    },
    markInvoiceLoaded(state, action: PayloadAction<number>) {
      if (!state.completedInvoices.includes(action.payload)) {
        state.completedInvoices.push(action.payload);
      }
      // Reset form if currently editing that invoice
      if (state.formData.invoiceId === action.payload) {
        state.formData.invoiceId = undefined;
        state.formData.invoiceNo = '';
        state.formData.orderId = undefined;
        state.formData.orderNo = '';
        state.formData.rolls = [];
        state.formData.summary = [];
      }
    },
    resetScanData(state) {
      state.formData = {
        buyerId: null,
        buyerName: '',
        orderId: undefined,
        orderNo: '',
        invoiceId: undefined,
        invoiceNo: '',
        fabricMasterId: undefined,
        fabricCodeQuality: '',
        rolls: [],
        summary: [],
      };
      state.error = null;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchDispatchRegister ─────────────────────────────────────
    builder
      .addCase(fetchDispatchRegister.pending, (state) => {
        state.registerLoading = true;
        state.error = null;
      })
      .addCase(fetchDispatchRegister.fulfilled, (state, action: PayloadAction<any>) => {
        state.registerLoading = false;
        state.registerRecords = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchDispatchRegister.rejected, (state, action: any) => {
        state.registerLoading = false;
        state.error = action.payload as string;
      })

      // ── fetchDispatchRegisterByCompany (optional) ─────────────────
      .addCase(fetchDispatchRegisterByCompany.pending, (state) => {
        state.registerLoading = true;
        state.error = null;
      })
      .addCase(fetchDispatchRegisterByCompany.fulfilled, (state, action: PayloadAction<any>) => {
        state.registerLoading = false;
        state.registerRecords = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchDispatchRegisterByCompany.rejected, (state, action: any) => {
        state.registerLoading = false;
        state.error = action.payload as string;
      })

      // ── fetchScanDispatchesByCompany ─────────────────────────────
      .addCase(fetchScanDispatchesByCompany.pending, (state) => {
        state.registerLoading = true;
        state.error = null;
      })
      .addCase(fetchScanDispatchesByCompany.fulfilled, (state, action: PayloadAction<any>) => {
        state.registerLoading = false;
        state.registerRecords = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchScanDispatchesByCompany.rejected, (state, action: any) => {
        state.registerLoading = false;
        state.error = action.payload as string;
      })

      // ── markInvoiceLoadedBackend ──────────────────────────────────
      .addCase(markInvoiceLoadedBackend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markInvoiceLoadedBackend.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const id = action.payload;
        state.completedInvoices = [...new Set([...state.completedInvoices, id])];
        state.registerRecords = state.registerRecords.filter((r) => r.invoiceId !== id);

        if (state.formData.invoiceId === id) {
          state.formData.invoiceId = undefined;
          state.formData.invoiceNo = '';
          state.formData.rolls = [];
          state.formData.summary = [];
        }
        // Optional: decrease total count
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(markInvoiceLoadedBackend.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createScanDispatch.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(createScanDispatch.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createScanDispatch.rejected, (state, action: any) => {
        state.saving = false;
        state.saveError = action.payload as string;
      })
      .addCase(updateScanDispatch.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(updateScanDispatch.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateScanDispatch.rejected, (state, action: any) => {
        state.saving = false;
        state.saveError = action.payload as string;
      })
      .addCase(deleteScanDispatchByCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteScanDispatchByCompany.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const deletedId = action.payload;
        state.registerRecords = state.registerRecords.filter((r) => r.id !== deletedId);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteScanDispatchByCompany.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setFormData,
  setBuyerSelection,
  setInvoiceSelection,
  setFabricSelection,
  setScannedRolls,
  addScannedRoll,
  setSummary,
  markInvoiceLoaded,
  resetScanData,
  setError,
  clearError,
} = scanDispatchSlice.actions;

// export { createScanDispatch, updateScanDispatch };

export default scanDispatchSlice.reducer;