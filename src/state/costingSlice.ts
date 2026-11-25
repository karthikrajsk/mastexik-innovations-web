import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import apiService from "@/services/ApiService";

export interface YarnDetail {
  id: number;
  warpWeft: "Warp" | "Weft";
  yarnCount: number;
  ratePerUnit: number;
  yarnProcessingCost?: number;
  content?: string;
  yarnType?: string;
  epi: number;
  ppi: number;
}

export interface FabricDetail {
  greyWidth: number;
  epiDifference: number;
  epiOnTable: number;
  reedSpace: number;
  totalEnds: number;
  warpCrimp: number;
}

export interface YarnCostDetail {
  warpWeftType: string;
  weight: number;
  cost: number;
  wastage: number;
}

export interface FabricCostDetail {
  rate: number;
  ratePerMeterOrYard: number;
  gsm?: number;
  glm?: number;
}

export interface FabricCostData {
  sizingCostPerKg: number;
  weavingChargesPerPick: number;
  fabricProcessingCostPerKg: number;
  freightCost: number;
  valueLossInterest: number;
  wastage: number;
  commissionCD: number;
  others: number;
  totalCostWithoutOverheads?: number;
  totalOverheads?: number;
  subtotal?: number;
  commissionAmount?: number;
  total?: number;
  ratePerUnit?: number;
}

export interface FinalCostingData {
  marginPercent: number;
  orderQty: number;
  targetPrice?: number;
  weavingChargesAsPerTP?: number;
  warpRequirements?: any[];
  weftRequirements?: any[];
  coverFactor?: number;
}

export interface YarnCostSummary {
  totalYarnWeight: number;
  totalYarnCost: number;
  totalWastage: number;
  glm: number;
}

export interface Costing {
  id: number;
  costingNo: string;
  date: string;
  customerName: string;
  agent: string;
  fabricCodeQuality: string;
  styleName?: string;
  uom?: number;
  uomFlag?: string;
  buyerId?: number;
  agentId?: number;
  fabricTypeId?: number;
  totalYarnWeight?: number;
  totalFabricWeight?: number;
  totalYarnCost?: number;
  totalFabricCost?: number;
  totalCost?: number;
  createdDate?: string;
  modifiedDate?: string;
  activeFlag?: boolean;
  yarnDetails: YarnDetail[];
  fabricDetails: FabricDetail;
  fabricCostData: FabricCostData;
  finalCostingData: FinalCostingData;
  yarnCostSummary?: YarnCostSummary;
  createdBy: string;
  targetPrice?: number; // Add targetPrice as optional property
}

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
  costingList: Costing[];
  paginationInfo: PaginationInfo;
  currentCosting: Costing | null;
  createCostingResult: any;
  updateCostingResult: any;
}

const initialState: ApiState = {
  loading: false,
  error: null,
  costingList: [],
  paginationInfo: {
    total: 0,
    next: false,
    prev: false,
    offset: 0,
    limit: 10
  },
  currentCosting: null,
  createCostingResult: null,
  updateCostingResult: null,
};

const MOCK_COSTINGS: Costing[] = [
  
];

type GetCostingByIdArg = number | { id: number; companyId?: number };
type DeleteCostingArg = number | { id: number; companyId?: number };

export const getAllCostings = createAsyncThunk(
  'costing/getAllCostings',
  async (params: { companyId: number; offset?: number; limit?: number; fetchAll?: boolean }, thunkAPI) => {
    try {
      const { companyId } = params;
      const baseLimit = params.limit ?? 10000;
      const baseOffset = params.offset ?? 0;
      const shouldFetchAll = params.fetchAll ?? (params.limit === undefined && params.offset === undefined);
      const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
      const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

      const queryParams = new URLSearchParams();
      queryParams.append('limit', String(effectiveLimit));
      queryParams.append('offset', String(effectiveOffset));

      const queryString = queryParams.toString();
      const url = `/costing-transaction/company/${companyId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiService.get(url);
      console.log('Costing API Response:', response);

      const rawData = Array.isArray(response?.data?.data)
        ? response?.data?.data
        : Array.isArray(response?.data)
          ? response?.data
          : [];

      const responsePagination = response?.data?.pagination;
      const total = responsePagination?.total ?? rawData.length;
      const resolvedOffset = responsePagination?.offset ?? effectiveOffset;
      const resolvedLimit = responsePagination?.limit ?? effectiveLimit;
      const nextOffset = resolvedOffset + resolvedLimit;

      const pagination = {
        total,
        limit: resolvedLimit,
        offset: resolvedOffset,
        next: nextOffset < total,
        prev: resolvedOffset > 0,
      };

      return { data: rawData, pagination };
    } catch (error: any) {
      console.error('API Error:', error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const getCostingById = createAsyncThunk<Costing | undefined, GetCostingByIdArg>(
  'costing/getCostingById',
  async (payload, thunkAPI) => {
    try {
      const { id, companyId } = typeof payload === 'number'
        ? { id: payload, companyId: undefined }
        : payload;
      
      if (!companyId) {
        return thunkAPI.rejectWithValue('Company ID is required');
      }

      const response = await apiService.get(`/costing-transaction/company/${companyId}/${id}`);
      console.log('Get by ID Response:', response);

      let data: Costing;
      if (Array.isArray(response)) {
        data = response[0] || ({} as Costing);
      } else if (response && Array.isArray(response.data)) {
        data = response.data[0] || ({} as Costing);
      } else if (response && typeof response === 'object' && response.data) {
        data = response.data;
      } else if (response && typeof response === 'object') {
        data = response;
      } else {
        throw new Error('Invalid response structure');
      }

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('No valid costing data found');
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createCosting = createAsyncThunk(
  'costing/createCosting',
  async (params: any, thunkAPI) => {
    try {
      const response = await apiService.post("/costing-transaction", params);
      console.log(response);
      toast.success("Costing created successfully");
      return response;
    } catch (error: any) {
      let errorMessage = 'Failed to create costing';
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data || error.response.statusText || errorMessage;
        if (typeof errorMessage === 'object' && errorMessage !== null) {
          errorMessage = (errorMessage as any).message || JSON.stringify(errorMessage);
        }
      } else if (error.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const updateCosting = createAsyncThunk(
  'costing/updateCosting',
  async ({ id, data, companyId }: { id: number, data: any, companyId?: number }, thunkAPI) => {
    try {
      if (!companyId) {
        return thunkAPI.rejectWithValue('Company ID is required for update operation');
      }
      
      const response = await apiService.put(`/costing-transaction/company/${companyId}/${id}`, data);

      toast.success("Costing updated successfully");
      return response;
    } catch (error: any) {
      let errorMessage = 'Failed to update costing';
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data || error.response.statusText || errorMessage;
        if (typeof errorMessage === 'object' && errorMessage !== null) {
          errorMessage = (errorMessage as any).message || JSON.stringify(errorMessage);
        }
      } else if (error.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const deleteCosting = createAsyncThunk<number, DeleteCostingArg>(
  'costing/deleteCosting',
  async (payload, thunkAPI) => {
    try {
      const { id, companyId } = typeof payload === 'number'
        ? { id: payload, companyId: undefined }
        : payload;
      
      if (!companyId) {
        return thunkAPI.rejectWithValue('Company ID is required for delete operation');
      }
      
      const response = await apiService.delete(`/costing-transaction/company/${companyId}/${id}`);
      
      // If the request is successful (doesn't throw), it's a success
      toast.success("Costing deleted successfully");
      return id;
    } catch (error: any) {
      let errorMessage = 'Failed to delete costing';
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data || error.response.statusText || errorMessage;
        if (typeof errorMessage === 'object' && errorMessage !== null) {
          errorMessage = (errorMessage as any).message || JSON.stringify(errorMessage);
        }
      } else if (error.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const copyCosting = createAsyncThunk(
  'costing/copyCosting',
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.post(`/costing-transaction/${id}/copy`, {});
      toast.success("Costing copied successfully");
      return response;
    } catch (error: any) {
      let errorMessage = 'Failed to copy costing';
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data || error.response.statusText || errorMessage;
        if (typeof errorMessage === 'object' && errorMessage !== null) {
          errorMessage = (errorMessage as any).message || JSON.stringify(errorMessage);
        }
      } else if (error.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

const costingSlice = createSlice({
  name: 'costing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllCostings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCostings.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const { data, pagination } = action.payload;
        state.costingList = Array.isArray(data) ? data : [];
        state.paginationInfo = pagination || { total: 0, next: false, prev: false, offset: 0, limit: 10 };
      })
      .addCase(getAllCostings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getCostingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCostingById.fulfilled, (state, action: PayloadAction<Costing | undefined>) => {
        state.loading = false;
        state.currentCosting = action.payload ?? null;
      })
      .addCase(getCostingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentCosting = null;
      })
      .addCase(createCosting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCosting.fulfilled, (state, action) => {
        state.loading = false;
        state.createCostingResult = action.payload;
      })
      .addCase(createCosting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateCosting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCosting.fulfilled, (state, action) => {
        state.loading = false;
        state.updateCostingResult = action.payload;
      })
      .addCase(updateCosting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteCosting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCosting.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.costingList = state.costingList.filter(costing => costing.id !== action.payload);
      })
      .addCase(deleteCosting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(copyCosting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(copyCosting.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(copyCosting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default costingSlice.reducer;
