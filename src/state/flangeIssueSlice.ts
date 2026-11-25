import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface PaginationState {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
}

export interface ApiState {
    loading: boolean;
    error: string | null;
    flangeIssueList: any;
    createFlangeIssueResult: any;
    checking: boolean;
    issuedFlangesList: any;
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    flangeIssueList: [],
    createFlangeIssueResult: null,
    checking: false,
    issuedFlangesList: [],
    pagination: {
        total: 0,
        limit: 10,
        offset: 0,
        next: false,
        prev: false,
    },
};

// Thunk for getAllFlangeIssue GET API call
export const getAllFlangeIssue = createAsyncThunk(
    'flange_issue/getAllFlangeIssue',
    async (params: { companyId: number; limit?: number; offset?: number; fetchAll?: boolean }, thunkAPI) => {
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
            const url = `/flange_issue/company/${companyId}${queryString ? `?${queryString}` : ''}`;
            const response = await apiService.get(url);

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
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const getIssuedFlangeNos = createAsyncThunk(
    'flange_issue/getIssuedFlangeNos',
    async (params: { issuedCompanyId: number }, thunkAPI) => {
        try {
            const response = await apiService.get('/flange_issue/issued-flanges', { issuedCompanyId: params.issuedCompanyId });
            const data = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response)
                    ? response
                    : [];
            return data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createFlangeIssue POST API call
export const createFlangeIssue: any = createAsyncThunk(
    'flange_issue/createFlangeIssue',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/flange_issue", params);
            if (response) {
                toast.success("Saved Successfully!");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for updateFlangeIssue PUT API call
export const updateFlangeIssue: any = createAsyncThunk(
    'flange_issue/updateFlangeIssue',
    async (params: any, thunkAPI) => {
        try {
            const { id, companyId, ...payload } = params;
            const response = await apiService.put(`/flange_issue/company/${companyId}/${id}`, payload);
            if (response) {
                toast.success("Updated Successfully!");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

const extractErrorMessage = (error: any) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Failed to delete category';

// Thunk for deleteFlangeIssue DELETE API call
export const deleteFlangeIssue: any = createAsyncThunk(
    'flange_issue/deleteFlangeIssue',
    async (params: { id: number; companyId: number }, thunkAPI) => {
        try {
            // Backend returns 204 No Content; no body expected
            await apiService.delete(`/flange_issue/company/${params.companyId}/${params.id}`);
            toast.success("Successfully Deleted!");
            // Return the id so reducer can remove from list
            return { id: params.id };
            
        } catch (error: any) {
                const message = extractErrorMessage(error);
                                                toast.error(message);
                                                return thunkAPI.rejectWithValue(message);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const deleteFlangeAndResetIssued: any = createAsyncThunk(
    'flange_issue/deleteFlangeAndResetIssued',
    async (params: { id: number; companyId: number }, thunkAPI) => {
        try {
            await apiService.delete(`/flange_issue/flange/company/${params.companyId}/${params.id}/release`);
            toast.success("Flange reset and deleted successfully!");
            return { id: params.id };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Create flangeIssueSlice 
const flangeIssueSlice = createSlice({
    name: "state",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Handle getAllFlangeIssue (GET request)
            .addCase(getAllFlangeIssue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllFlangeIssue.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload || { data: [], pagination: state.pagination };
                state.flangeIssueList = payload.data;
                state.pagination = payload.pagination || state.pagination;
            })
            .addCase(getAllFlangeIssue.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload as any;
            })

            .addCase(getIssuedFlangeNos.pending, (state) => {
                state.checking = true;
                state.error = null;
            })
            .addCase(getIssuedFlangeNos.fulfilled, (state, action: PayloadAction<any>) => {
                state.checking = false;
                state.issuedFlangesList = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(getIssuedFlangeNos.rejected, (state, action: PayloadAction<any>) => {
                state.checking = false;
                state.error = action.payload as any;
            })

            // Handle createFlangeIssue (POST request)
            .addCase(createFlangeIssue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createFlangeIssue.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createFlangeIssueResult = action.payload;
            })
            .addCase(createFlangeIssue.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload as any;
            })

            // Handle updateFlangeIssue (PUT request)
            .addCase(updateFlangeIssue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateFlangeIssue.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updated = action.payload;
                state.flangeIssueList = state.flangeIssueList.map((item: any) =>
                    item.id === updated.id ? updated : item
                );
            })
            .addCase(updateFlangeIssue.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload as any;
            })

            // Handle deleteFlangeIssue (DELETE request)
            .addCase(deleteFlangeIssue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteFlangeIssue.fulfilled, (state: any, action) => {
                state.loading = false;
                const { id } = action.payload;
                state.flangeIssueList = state.flangeIssueList.filter((item: any) => item.id !== id);
                state.pagination.total = Math.max(0, state.pagination.total - 1);
            })
            .addCase(deleteFlangeIssue.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload as any;
            })
            .addCase(deleteFlangeAndResetIssued.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteFlangeAndResetIssued.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(deleteFlangeAndResetIssued.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload as any;
            });
    },
});

export default flangeIssueSlice.reducer;