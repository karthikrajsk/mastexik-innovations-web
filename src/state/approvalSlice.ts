import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import approvalAPI, { ApprovalDTO, ApprovalRequestDTO, PaginatedApprovalResponse, ApprovalSummaryDTO, PaginatedApprovalSummaryResponse } from "@/services/approval-api";

export interface ApprovalState {
  loading: boolean;
  error: string | null;
  approvalList: ApprovalDTO[];
  currentApproval: ApprovalDTO | null;
  summaryList: ApprovalSummaryDTO[];
  paginationInfo: {
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  summaryPaginationInfo: {
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  createResult: any;
  approveResult: any;
}

const initialState: ApprovalState = {
  loading: false,
  error: null,
  approvalList: [],
  currentApproval: null,
  summaryList: [],
  paginationInfo: {
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  },
  summaryPaginationInfo: {
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  },
  createResult: null,
  approveResult: null
};

export const createOrUpdateApproval = createAsyncThunk(
  "approval/createOrUpdate",
  async (
    {
      approval,
      companyId,
      userId
    }: { approval: ApprovalDTO; companyId?: number; userId?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await approvalAPI.createOrUpdate(approval, companyId, userId);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create/update approval";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getApprovalById = createAsyncThunk(
  "approval/getById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await approvalAPI.getById(id);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch approval";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getApprovalByEntryNo = createAsyncThunk(
  "approval/getByEntryNo",
  async (entryNo: string, { rejectWithValue }) => {
    try {
      const response = await approvalAPI.getByEntryNo(entryNo);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch approval";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getApprovalByEntryNoAndScreen = createAsyncThunk(
  "approval/getByEntryNoAndScreen",
  async (
    { entryNo, screenName }: { entryNo: string; screenName: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await approvalAPI.getByEntryNoAndScreen(entryNo, screenName);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch approval";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getApprovalsByCompanyId = createAsyncThunk(
  "approval/getByCompanyId",
  async (
    { companyId, page, size }: { companyId: number; page?: number; size?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await approvalAPI.getByCompanyId(companyId, page, size);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch approvals";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getApprovalsByCompanyIdAndDateRange = createAsyncThunk(
  "approval/getByCompanyIdAndDateRange",
  async (
    {
      companyId,
      startDate,
      endDate,
      page,
      size
    }: {
      companyId: number;
      startDate: string;
      endDate: string;
      page?: number;
      size?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await approvalAPI.getByCompanyIdAndDateRange(companyId, startDate, endDate, page, size);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch approvals";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getApprovalsByCompanyIdAndStatus = createAsyncThunk(
  "approval/getByCompanyIdAndStatus",
  async (
    {
      companyId,
      isApproved,
      page,
      size
    }: {
      companyId: number;
      isApproved: number;
      page?: number;
      size?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await approvalAPI.getByCompanyIdAndStatus(companyId, isApproved, page, size);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch approvals";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getApprovalsByCompanyIdAndScreenName = createAsyncThunk(
  "approval/getByCompanyIdAndScreenName",
  async (
    {
      companyId,
      screenName,
      page,
      size
    }: {
      companyId: number;
      screenName: string;
      page?: number;
      size?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await approvalAPI.getByCompanyIdAndScreenName(companyId, screenName, page, size);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch approvals";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getApprovalsByCompanyIdWithFilters = createAsyncThunk(
  "approval/getByCompanyIdWithFilters",
  async (
    {
      companyId,
      filters
    }: {
      companyId: number;
      filters: {
        startDate?: string;
        endDate?: string;
        isApproved?: number;
        page?: number;
        size?: number;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await approvalAPI.getByCompanyIdWithFilters(companyId, filters);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch approvals";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const approveEntry = createAsyncThunk(
  "approval/approve",
  async (
    {
      id,
      approvalRequest,
      userId
    }: {
      id: number;
      approvalRequest: ApprovalRequestDTO;
      userId?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await approvalAPI.approveEntry(id, approvalRequest, userId);
      toast.success("Entry approved successfully");
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to approve entry";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteApproval = createAsyncThunk(
  "approval/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await approvalAPI.delete(id);
      toast.success("Approval deleted successfully");
      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete approval";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getApprovalsSummaryByCompanyId = createAsyncThunk(
  "approval/getSummaryByCompanyId",
  async (
    { companyId, page, size }: { companyId: number; page?: number; size?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await approvalAPI.getSummaryByCompanyId(companyId, page, size);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch approval summary";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const approvalSlice = createSlice({
  name: "approval",
  initialState,
  reducers: {
    clearCurrentApproval: (state) => {
      state.currentApproval = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrUpdateApproval.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrUpdateApproval.fulfilled, (state, action) => {
        state.loading = false;
        state.createResult = action.payload;
      })
      .addCase(createOrUpdateApproval.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getApprovalById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApprovalById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentApproval = action.payload.data;
      })
      .addCase(getApprovalById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getApprovalByEntryNo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApprovalByEntryNo.fulfilled, (state, action) => {
        state.loading = false;
        state.currentApproval = action.payload.data;
      })
      .addCase(getApprovalByEntryNo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getApprovalByEntryNoAndScreen.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApprovalByEntryNoAndScreen.fulfilled, (state, action) => {
        state.loading = false;
        state.currentApproval = action.payload.data;
      })
      .addCase(getApprovalByEntryNoAndScreen.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getApprovalsByCompanyId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApprovalsByCompanyId.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload.data;
        state.approvalList = response.data;
        state.paginationInfo = {
          totalElements: response.total,
          totalPages: Math.ceil(response.total / response.limit),
          currentPage: Math.floor(response.offset / response.limit),
          pageSize: response.limit,
          hasNext: response.next,
          hasPrevious: response.prev
        };
      })
      .addCase(getApprovalsByCompanyId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getApprovalsByCompanyIdAndDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApprovalsByCompanyIdAndDateRange.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload.data;
        state.approvalList = response.data;
        state.paginationInfo = {
          totalElements: response.total,
          totalPages: Math.ceil(response.total / response.limit),
          currentPage: Math.floor(response.offset / response.limit),
          pageSize: response.limit,
          hasNext: response.next,
          hasPrevious: response.prev
        };
      })
      .addCase(getApprovalsByCompanyIdAndDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getApprovalsByCompanyIdAndStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApprovalsByCompanyIdAndStatus.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload.data;
        state.approvalList = response.data;
        state.paginationInfo = {
          totalElements: response.total,
          totalPages: Math.ceil(response.total / response.limit),
          currentPage: Math.floor(response.offset / response.limit),
          pageSize: response.limit,
          hasNext: response.next,
          hasPrevious: response.prev
        };
      })
      .addCase(getApprovalsByCompanyIdAndStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getApprovalsByCompanyIdAndScreenName.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApprovalsByCompanyIdAndScreenName.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload.data;
        state.approvalList = response.data;
        state.paginationInfo = {
          totalElements: response.total,
          totalPages: Math.ceil(response.total / response.limit),
          currentPage: Math.floor(response.offset / response.limit),
          pageSize: response.limit,
          hasNext: response.next,
          hasPrevious: response.prev
        };
      })
      .addCase(getApprovalsByCompanyIdAndScreenName.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getApprovalsByCompanyIdWithFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApprovalsByCompanyIdWithFilters.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload.data;
        state.approvalList = response.data;
        state.paginationInfo = {
          totalElements: response.total || response.totalElements || 0,
          totalPages: Math.ceil((response.total || response.totalElements || 0) / (response.limit || response.pageSize || 10)),
          currentPage: Math.floor((response.offset || 0) / (response.limit || response.pageSize || 10)),
          pageSize: response.limit || response.pageSize || 10,
          hasNext: response.next !== undefined ? response.next : response.hasNext || false,
          hasPrevious: response.prev !== undefined ? response.prev : response.hasPrevious || false
        };
      })
      .addCase(getApprovalsByCompanyIdWithFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(approveEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.approveResult = action.payload;
        state.currentApproval = action.payload.data;
      })
      .addCase(approveEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteApproval.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteApproval.fulfilled, (state, action) => {
        state.loading = false;
        state.approvalList = state.approvalList.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteApproval.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getApprovalsSummaryByCompanyId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApprovalsSummaryByCompanyId.fulfilled, (state, action) => {
        state.loading = false;
        const response = action.payload.data;
        state.summaryList = response.data;
        state.summaryPaginationInfo = {
          totalElements: response.total || response.totalElements || 0,
          totalPages: Math.ceil((response.total || response.totalElements || 0) / (response.limit || response.pageSize || 10)),
          currentPage: Math.floor((response.offset || 0) / (response.limit || response.pageSize || 10)),
          pageSize: response.limit || response.pageSize || 10,
          hasNext: response.next !== undefined ? response.next : response.hasNext || false,
          hasPrevious: response.prev !== undefined ? response.prev : response.hasPrevious || false
        };
      })
      .addCase(getApprovalsSummaryByCompanyId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentApproval, clearError } = approvalSlice.actions;
export default approvalSlice.reducer;
