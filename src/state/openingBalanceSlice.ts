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

export interface OpeningBalanceState {
    loading: boolean;
    error: string | null;
    openingBalanceList: any[];
    paginationInfo: PaginationInfo;
    createOpeningBalanceResult: any;
}

const initialState: OpeningBalanceState = {
    loading: false,
    error: null,
    openingBalanceList: [],
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    },
    createOpeningBalanceResult: null,
};

const resolveCompanyId = (explicitCompanyId?: number | null) => {
    if (explicitCompanyId != null && !Number.isNaN(Number(explicitCompanyId))) {
        return Number(explicitCompanyId);
    }
    const storedCompany = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompany) {
        return null;
    }
    const parsed = Number(storedCompany);
    return Number.isNaN(parsed) ? null : parsed;
};

// Thunk for getAllOpeningBalance GET API call
export const getAllOpeningBalance = createAsyncThunk(
    'opening-balance/getAllOpeningBalance',
    async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number | null } = {}, thunkAPI) => {
        try {
            const offset = params.fetchAll ? 0 : (params.offset ?? 0);
            const limit = params.fetchAll ? 10000 : (params.limit ?? 10000);
            
            const queryParams = new URLSearchParams();
            queryParams.append('offset', String(offset));
            queryParams.append('limit', String(limit));
            
            const companyId = resolveCompanyId(params.companyId);
            const basePath = companyId ? `/opening-balance/company/${companyId}` : '/opening-balance';
            const url = `${basePath}?${queryParams.toString()}`;
            const response = await apiService.get(url);
            
            if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                const paginationData = response.data;
                return {
                    data: paginationData.data || [],
                    total: paginationData.total || 0,
                    next: paginationData.next || false,
                    prev: paginationData.prev || false,
                    offset: paginationData.offset || offset,
                    limit: paginationData.limit || limit
                };
            }
            
            if (Array.isArray(response?.data)) {
                return {
                    data: response.data,
                    total: response.total || 0,
                    next: response.next || false,
                    prev: response.prev || false,
                    offset: response.offset || offset,
                    limit: response.limit || limit
                };
            }
            
            if (Array.isArray(response)) {
                return {
                    data: response,
                    total: response.length,
                    next: false,
                    prev: false,
                    offset,
                    limit
                };
            }
            
            const list = response?.data?.data ?? [];
            return {
                data: Array.isArray(list) ? list : [],
                total: list.length,
                next: false,
                prev: false,
                offset,
                limit
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createOpeningBalance POST API call
export const createOpeningBalance = createAsyncThunk(
    'opening-balance/createOpeningBalance',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/opening-balance", params);
            if (response) {
                toast.success("Opening Balance Saved Successfully!");
                return response.data;
            } else {
                const errorMessage = "Failed to create opening balance";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for updateOpeningBalance PUT API call
// Thunk for updateOpeningBalance PUT API call
// Thunk for updateOpeningBalance PUT API call
// Updated updateOpeningBalance thunk with better response handling
export const updateOpeningBalance = createAsyncThunk(
    'opening-balance/updateOpeningBalance',
    async (params: any, thunkAPI) => {
        try {
            const id = params?.id;
            if (!id) {
                const errorMessage = "Opening Balance ID is required for update";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }

            const companyId = resolveCompanyId(params?.companyId);
            const endpoint = companyId
                ? `/opening-balance/company/${companyId}/${id}`
                : `/opening-balance/${id}`;

            const response = await apiService.put(endpoint, params);

            // Handle raw object OR axios formatted response
            const data = response?.data ?? response;

            if (!data) {
                const errorMessage = "Failed to update opening balance - no data received";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }

            toast.success("Opening Balance updated successfully!");
            return data;

        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || "Update failed";
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


// Thunk for deleteOpeningBalance DELETE API call
export const deleteOpeningBalance = createAsyncThunk(
    'opening-balance/deleteOpeningBalance',
    async (payload: number | { id: number; companyId?: number | null }, thunkAPI) => {
        try {
            const { id, companyId: explicitCompanyId } = typeof payload === 'number'
                ? { id: payload, companyId: undefined }
                : payload;
            const companyId = resolveCompanyId(explicitCompanyId);
            const endpoint = companyId
                ? `/opening-balance/company/${companyId}/${id}`
                : `/opening-balance/${id}`;

            await apiService.delete(endpoint);
            toast.success("Successfully deleted");
            return id;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred while deleting';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Create openingBalanceSlice
const openingBalanceSlice = createSlice({
    name: "openingBalance",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Handle getAllOpeningBalance
            .addCase(getAllOpeningBalance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllOpeningBalance.fulfilled, (state: any, action) => {
                state.loading = false;
                const { data, total, next, prev, offset, limit } = action.payload;
                state.openingBalanceList = Array.isArray(data) ? data : [];
                state.paginationInfo = { total, next, prev, offset, limit };
            })
            .addCase(getAllOpeningBalance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle createOpeningBalance
            .addCase(createOpeningBalance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOpeningBalance.fulfilled, (state, action) => {
                state.loading = false;
                state.createOpeningBalanceResult = action.payload;
            })
            .addCase(createOpeningBalance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle updateOpeningBalance
            .addCase(updateOpeningBalance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            // In your extraReducers for updateOpeningBalance
            .addCase(updateOpeningBalance.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = null;
                const updatedOpeningBalance = action.payload;
                console.log('Update fulfilled with data:', updatedOpeningBalance);

                // Update the list
                if (updatedOpeningBalance && updatedOpeningBalance.id) {
                    state.openingBalanceList = state.openingBalanceList.map((ob: any) =>
                        ob.id === updatedOpeningBalance.id ? updatedOpeningBalance : ob
                    );
                }
            })
            .addCase(updateOpeningBalance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                console.log('Update rejected with error:', action.payload);
                console.log('Action error:', action.error);
            })

            // Handle deleteOpeningBalance
            .addCase(deleteOpeningBalance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteOpeningBalance.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.openingBalanceList = state.openingBalanceList.filter(
                    (ob: any) => ob.id !== deletedId
                );
            })
            .addCase(deleteOpeningBalance.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })
    },
});

// Export reducer
export default openingBalanceSlice.reducer;