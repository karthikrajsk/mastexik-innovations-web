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

export interface AgencyCommissionState {
    loading: boolean;
    error: string | null;
    statements: any[];
    currentStatement: any | null;
    pagination: PaginationState;
}

const initialState: AgencyCommissionState = {
    loading: false,
    error: null,
    statements: [],
    currentStatement: null,
    pagination: {
        total: 0,
        limit: 10,
        offset: 0,
        next: false,
        prev: false,
    },
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
    const responseData = error?.response?.data;
    if (typeof responseData === "string") return responseData;
    if (responseData?.message) return responseData.message;
    if (responseData?.error) return responseData.error;
    return error?.message || fallback;
};

export const getAllCommissionStatements = createAsyncThunk(
    "agencyCommission/getAllCommissionStatements",
    async (
        params: { limit?: number; offset?: number; fetchAll?: boolean; status?: string } = {},
        thunkAPI
    ) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.fetchAll) {
                // Unpaginated / all
            } else {
                if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
                if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
            }
            if (params.status) {
                queryParams.append("status", params.status);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/agency-commission-statement?${queryString}` : `/agency-commission-statement`;
            const response = await apiService.get(url);
            const payload = response?.data;

            let dataList: any[] = [];
            let total = 0;
            let limit = params.limit || 10;
            let offset = params.offset || 0;
            let next = false;
            let prev = false;

            if (Array.isArray(payload)) {
                dataList = payload;
                total = payload.length;
            } else if (payload && Array.isArray(payload.data)) {
                dataList = payload.data;
                total = payload.total ?? payload.data.length;
                limit = payload.limit ?? limit;
                offset = payload.offset ?? offset;
                next = payload.hasNext ?? false;
                prev = payload.hasPrev ?? false;
            }

            return {
                data: dataList,
                pagination: { total, limit, offset, next, prev },
            };
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to fetch Commission Statements");
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const getCommissionStatementById = createAsyncThunk(
    "agencyCommission/getCommissionStatementById",
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.get(`/agency-commission-statement/${id}`);
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to fetch Commission Statement");
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const createCommissionStatement = createAsyncThunk(
    "agencyCommission/createCommissionStatement",
    async (data: any, thunkAPI) => {
        try {
            const response = await apiService.post("/agency-commission-statement", data);
            toast.success("Commission Statement generated successfully!");
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to generate Commission Statement");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const updateCommissionStatement = createAsyncThunk(
    "agencyCommission/updateCommissionStatement",
    async ({ id, data }: { id: number; data: any }, thunkAPI) => {
        try {
            const response = await apiService.put(`/agency-commission-statement/${id}`, data);
            toast.success("Commission Statement updated successfully!");
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to update Commission Statement");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const recordCommissionPaymentReceipt = createAsyncThunk(
    "agencyCommission/recordCommissionPaymentReceipt",
    async ({ id, data }: { id: number; data: any }, thunkAPI) => {
        try {
            const response = await apiService.patch(`/agency-commission-statement/${id}/payment-receipt`, data);
            toast.success("Commission payment receipt marked as Paid!");
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to record payment receipt");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const deleteCommissionStatement = createAsyncThunk(
    "agencyCommission/deleteCommissionStatement",
    async (id: number, thunkAPI) => {
        try {
            await apiService.delete(`/agency-commission-statement/${id}`);
            toast.success("Commission Statement deleted successfully!");
            return id;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to delete Commission Statement");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

const agencyCommissionSlice = createSlice({
    name: "agencyCommission",
    initialState,
    reducers: {
        clearCurrentStatement: (state) => {
            state.currentStatement = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // getAllCommissionStatements
            .addCase(getAllCommissionStatements.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllCommissionStatements.fulfilled, (state, action) => {
                state.loading = false;
                state.statements = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllCommissionStatements.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // getCommissionStatementById
            .addCase(getCommissionStatementById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getCommissionStatementById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentStatement = action.payload;
            })
            .addCase(getCommissionStatementById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // createCommissionStatement
            .addCase(createCommissionStatement.fulfilled, (state, action) => {
                state.statements.unshift(action.payload);
            })

            // updateCommissionStatement
            .addCase(updateCommissionStatement.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.statements.findIndex((s) => s.id === updated.id);
                if (idx !== -1) {
                    state.statements[idx] = updated;
                }
                if (state.currentStatement?.id === updated.id) {
                    state.currentStatement = updated;
                }
            })

            // recordCommissionPaymentReceipt
            .addCase(recordCommissionPaymentReceipt.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.statements.findIndex((s) => s.id === updated.id);
                if (idx !== -1) {
                    state.statements[idx] = updated;
                }
                if (state.currentStatement?.id === updated.id) {
                    state.currentStatement = updated;
                }
            })

            // deleteCommissionStatement
            .addCase(deleteCommissionStatement.fulfilled, (state, action) => {
                state.statements = state.statements.filter((s) => s.id !== action.payload);
            });
    },
});

export const { clearCurrentStatement } = agencyCommissionSlice.actions;
export default agencyCommissionSlice.reducer;
