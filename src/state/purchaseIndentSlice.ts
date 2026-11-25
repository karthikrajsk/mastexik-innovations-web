import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiService from "@/services/ApiService";

export interface PurchaseIndentItem {
  id?: number;
  itemId: number;
  itemName: string;
  specification: string;
  quantity: number;
  uomId: number;
  uomName: string;
  requiredDate: string;
}

export interface PurchaseIndent {
  id: number;
  indentNo: string;
  indentDate: string;
  department: string;
  requestedBy: string;
  requiredDate: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  remarks: string;
  status: "Draft" | "Pending approval" | "Approved" | "Rejected" | string;
  companyId: number;
  items: PurchaseIndentItem[];
  approveDate?: string;
  approvedBy?: number;
  approvalComments?: string;
  isApproved?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const isPurchaseIndentEditable = (
  indent: Pick<PurchaseIndent, "status">
) => {
  const status = String(indent.status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  return status === "draft" || status === "pending" || status === "pending approval";
};

export interface PurchaseHistoryRecord {
  poId: number;
  poItemId: number;
  poNo: string;
  poDate: string;
  vendorId: number;
  vendorName: string;
  itemId: number;
  itemName: string;
  itemCode?: string;
  specification?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  gstAmount?: number;
  netAmount?: number;
  finalAmount?: number;
  gstPercent?: string;
  fabricMasterId?: number;
  fabricCode?: string;
  quality?: string;
  millName?: string;
  status?: string;
  isApproved?: number;
  discountAmount?: number;
}

export interface LatestPurchaseSummary {
  lastPurchaseDate?: string;
  lastPoNumber?: string;
  lastPoId?: number;
  lastVendorId?: number;
  lastVendorName?: string;
  lastPurchaseQuantity?: number;
  lastUom?: string;
  lastPurchaseUnitPrice?: number;
  lastGstAmount?: number;
  lastNetAmount?: number;
  lastFinalAmount?: number;
}

export interface PurchaseHistoryResponse {
  itemId: number;
  itemName: string;
  itemCode?: string;
  uom?: string;
  latestPurchase?: LatestPurchaseSummary | null;
  records: PurchaseHistoryRecord[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

interface ListParams {
  offset: number;
  limit: number;
  companyId: number;
  status?: string;
}

interface SavePayload {
  id?: number;
  companyId: number;
  indentDate: string;
  department: string;
  requestedBy: string;
  requiredDate: string;
  priority: PurchaseIndent["priority"];
  remarks: string;
  status: "Draft" | "Pending approval";
  items: PurchaseIndentItem[];
}

type ApiRecord = Record<string, unknown>;

const asRecord = (value: unknown): ApiRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as ApiRecord
    : null;

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = asRecord(error);
  const response = asRecord(apiError?.response);
  const data = asRecord(response?.data);
  const nestedData = asRecord(data?.data);
  const message = data?.message || data?.error || nestedData?.message || nestedData?.error;
  if (typeof message === "string" && message.trim()) return message;
  const errors = data?.errors;
  if (Array.isArray(errors) && errors.length) {
    const firstError = errors[0];
    if (typeof firstError === "string") return firstError;
    const firstErrorRecord = asRecord(firstError);
    if (typeof firstErrorRecord?.message === "string") return firstErrorRecord.message;
  }
  return (typeof apiError?.message === "string" && apiError.message) || fallback;
};

const unwrapData = (response: unknown): unknown => {
  const root = asRecord(response);
  return root?.data ?? response;
};

export const getPurchaseIndents = createAsyncThunk(
  "purchaseIndent/getAll",
  async (params: ListParams, thunkAPI) => {
    try {
      const response = await apiService.get<unknown>("/purchase-indents", params);
      const result = unwrapData(response);
      const resultRecord = asRecord(result);
      const rows = resultRecord?.data;
      const data = Array.isArray(rows)
        ? rows as PurchaseIndent[]
        : Array.isArray(result) ? result as PurchaseIndent[] : [];
      return {
        data,
        pagination: {
          total: Number(resultRecord?.total ?? data.length),
          offset: Number(resultRecord?.offset ?? params.offset),
          limit: Number(resultRecord?.limit ?? params.limit),
          next: Boolean(resultRecord?.next),
          prev: Boolean(resultRecord?.prev),
        },
      };
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Unable to load purchase indents."));
    }
  }
);

export const getPurchaseIndentById = createAsyncThunk(
  "purchaseIndent/getById",
  async ({ id, companyId }: { id: number; companyId: number }, thunkAPI) => {
    try {
      const response = await apiService.get<unknown>(`/purchase-indents/${id}`, { companyId });
      return unwrapData(response) as PurchaseIndent;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Unable to load this purchase indent."));
    }
  }
);

export const createPurchaseIndent = createAsyncThunk(
  "purchaseIndent/create",
  async (payload: SavePayload, thunkAPI) => {
    try {
      const response = await apiService.post<unknown>("/purchase-indents", payload);
      return unwrapData(response) as PurchaseIndent;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Unable to save the purchase indent."));
    }
  }
);

export const updatePurchaseIndent = createAsyncThunk(
  "purchaseIndent/update",
  async (payload: SavePayload & { id: number }, thunkAPI) => {
    try {
      const { id, ...body } = payload;
      const response = await apiService.put<unknown>(`/purchase-indents/${id}`, body);
      return unwrapData(response) as PurchaseIndent;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Unable to update the purchase indent."));
    }
  }
);

export const deletePurchaseIndent = createAsyncThunk(
  "purchaseIndent/delete",
  async ({ id, companyId }: { id: number; companyId: number }, thunkAPI) => {
    try {
      await apiService.delete<unknown>(`/purchase-indents/${id}`, {
        params: { companyId },
      });
      return id;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Unable to delete the purchase indent."));
    }
  }
);

export const approvePurchaseIndent = createAsyncThunk(
  "purchaseIndent/approve",
  async (
    payload: {
      id: number;
      companyId?: number;
      approveDate?: string;
      comments?: string;
      userId?: number;
    },
    thunkAPI
  ) => {
    try {
      const { id, companyId, ...rest } = payload;
      const body = {
        ...(companyId ? { companyId } : {}),
        ...rest,
      };
      const response = await apiService.put<unknown>(`/purchase-indents/${id}/approve`, body, {
        params: {
          ...(companyId ? { companyId } : {}),
          ...(payload.userId ? { userId: payload.userId } : {}),
        },
      });
      return unwrapData(response) as PurchaseIndent;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Unable to approve the purchase indent."));
    }
  }
);

export const getPurchaseHistory = createAsyncThunk(
  "purchaseIndent/getPurchaseHistory",
  async (
    params: { itemId: number; companyId?: number; offset?: number; limit?: number },
    thunkAPI
  ) => {
    try {
      const response = await apiService.get<unknown>("/purchase-history", params);
      return unwrapData(response) as PurchaseHistoryResponse;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, "Unable to load previous purchase history."));
    }
  }
);

interface PurchaseIndentState {
  purchaseIndentList: PurchaseIndent[];
  currentIndent: PurchaseIndent | null;
  pagination: { total: number; offset: number; limit: number; next: boolean; prev: boolean };
  loading: boolean;
  saving: boolean;
  error: string | null;
  purchaseHistory: PurchaseHistoryResponse | null;
  historyLoading: boolean;
  historyError: string | null;
  historyItemId: number | null;
}

const initialState: PurchaseIndentState = {
  purchaseIndentList: [],
  currentIndent: null,
  pagination: { total: 0, offset: 0, limit: 10, next: false, prev: false },
  loading: false,
  saving: false,
  error: null,
  purchaseHistory: null,
  historyLoading: false,
  historyError: null,
  historyItemId: null,
};

const purchaseIndentSlice = createSlice({
  name: "purchaseIndent",
  initialState,
  reducers: {
    clearCurrentIndent(state) {
      state.currentIndent = null;
      state.error = null;
    },
    clearPurchaseHistory(state) {
      state.purchaseHistory = null;
      state.historyLoading = false;
      state.historyError = null;
      state.historyItemId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPurchaseIndents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPurchaseIndents.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseIndentList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getPurchaseIndents.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload || action.error.message || "Unable to load purchase indents.");
      })
      .addCase(getPurchaseIndentById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentIndent = null;
      })
      .addCase(getPurchaseIndentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentIndent = action.payload;
      })
      .addCase(getPurchaseIndentById.rejected, (state, action) => {
        state.loading = false;
        state.error = String(action.payload || action.error.message || "Unable to load this purchase indent.");
      })
      .addCase(createPurchaseIndent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createPurchaseIndent.fulfilled, (state, action) => {
        state.saving = false;
        state.currentIndent = action.payload;
      })
      .addCase(createPurchaseIndent.rejected, (state, action) => {
        state.saving = false;
        state.error = String(action.payload || action.error.message || "Unable to save the purchase indent.");
      })
      .addCase(updatePurchaseIndent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updatePurchaseIndent.fulfilled, (state, action) => {
        state.saving = false;
        state.currentIndent = action.payload;
      })
      .addCase(updatePurchaseIndent.rejected, (state, action) => {
        state.saving = false;
        state.error = String(action.payload || action.error.message || "Unable to save the purchase indent.");
      })
      .addCase(deletePurchaseIndent.fulfilled, (state, action) => {
        state.purchaseIndentList = state.purchaseIndentList.filter((indent) => indent.id !== action.payload);
        if (state.currentIndent?.id === action.payload) {
          state.currentIndent = null;
        }
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(approvePurchaseIndent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(approvePurchaseIndent.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        if (state.currentIndent?.id === updated.id) {
          state.currentIndent = updated;
        }
        state.purchaseIndentList = state.purchaseIndentList.map((indent) =>
          indent.id === updated.id ? updated : indent
        );
      })
      .addCase(approvePurchaseIndent.rejected, (state, action) => {
        state.saving = false;
        state.error = String(action.payload || action.error.message || "Unable to approve the purchase indent.");
      })
      .addCase(getPurchaseHistory.pending, (state, action) => {
        state.historyLoading = true;
        state.historyError = null;
        state.historyItemId = action.meta.arg.itemId;
        if (state.purchaseHistory && state.purchaseHistory.itemId !== action.meta.arg.itemId) {
          state.purchaseHistory = null;
        }
      })
      .addCase(getPurchaseHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.historyError = null;
        state.purchaseHistory = action.payload;
        state.historyItemId = action.payload?.itemId ?? null;
      })
      .addCase(getPurchaseHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = String(action.payload || action.error.message || "Unable to load purchase history.");
      });
  },
});

export const { clearCurrentIndent, clearPurchaseHistory } = purchaseIndentSlice.actions;
export default purchaseIndentSlice.reducer;
