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

export interface AgencyContractState {
    loading: boolean;
    error: string | null;
    contracts: any[];
    currentContract: any | null;
    pagination: PaginationState;
}

const initialState: AgencyContractState = {
    loading: false,
    error: null,
    contracts: [],
    currentContract: null,
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

export const getAllAgencyContracts = createAsyncThunk(
    "agencyContract/getAllAgencyContracts",
    async (
        params: { limit?: number; offset?: number; fetchAll?: boolean; status?: string; companyId?: number } = {},
        thunkAPI
    ) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.fetchAll) {
                // If fetchAll, don't paginate or use large limit
            } else {
                if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
                if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
            }
            if (params.status) {
                queryParams.append("status", params.status);
            }
            if (params.companyId !== undefined) {
                queryParams.append("companyId", String(params.companyId));
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/agency-contract?${queryString}` : `/agency-contract`;
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
            const msg = resolveApiErrorMessage(error, "Failed to fetch Agency Contracts");
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const getAgencyContractById = createAsyncThunk(
    "agencyContract/getAgencyContractById",
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.get(`/agency-contract/${id}`);
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to fetch Agency Contract");
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const createAgencyContract = createAsyncThunk(
    "agencyContract/createAgencyContract",
    async (data: any, thunkAPI) => {
        try {
            const response = await apiService.post("/agency-contract", data);
            toast.success("Agency Contract created successfully!");
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to create Agency Contract");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const updateAgencyContract = createAsyncThunk(
    "agencyContract/updateAgencyContract",
    async ({ id, data }: { id: number; data: any }, thunkAPI) => {
        try {
            const response = await apiService.put(`/agency-contract/${id}`, data);
            toast.success("Agency Contract updated successfully!");
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to update Agency Contract");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const updateAgencyContractStatus = createAsyncThunk(
    "agencyContract/updateAgencyContractStatus",
    async ({ id, status }: { id: number; status: string }, thunkAPI) => {
        try {
            const response = await apiService.patch(`/agency-contract/${id}/status?status=${encodeURIComponent(status)}`, {});
            toast.success(`Contract status updated to ${status}!`);
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to update contract status");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const deleteAgencyContract = createAsyncThunk(
    "agencyContract/deleteAgencyContract",
    async (id: number, thunkAPI) => {
        try {
            await apiService.delete(`/agency-contract/${id}`);
            toast.success("Agency Contract deleted successfully!");
            return id;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to delete Agency Contract");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

const agencyContractSlice = createSlice({
    name: "agencyContract",
    initialState,
    reducers: {
        clearCurrentContract: (state) => {
            state.currentContract = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // getAllAgencyContracts
            .addCase(getAllAgencyContracts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllAgencyContracts.fulfilled, (state, action) => {
                state.loading = false;
                state.contracts = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllAgencyContracts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // getAgencyContractById
            .addCase(getAgencyContractById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAgencyContractById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentContract = action.payload;
            })
            .addCase(getAgencyContractById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // createAgencyContract
            .addCase(createAgencyContract.fulfilled, (state, action) => {
                state.contracts.unshift(action.payload);
            })

            // updateAgencyContract
            .addCase(updateAgencyContract.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.contracts.findIndex((c) => c.id === updated.id);
                if (idx !== -1) {
                    state.contracts[idx] = updated;
                }
                if (state.currentContract?.id === updated.id) {
                    state.currentContract = updated;
                }
            })

            // updateAgencyContractStatus
            .addCase(updateAgencyContractStatus.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.contracts.findIndex((c) => c.id === updated.id);
                if (idx !== -1) {
                    state.contracts[idx] = updated;
                }
            })

            // deleteAgencyContract
            .addCase(deleteAgencyContract.fulfilled, (state, action) => {
                state.contracts = state.contracts.filter((c) => c.id !== action.payload);
            });
    },
});

export const { clearCurrentContract } = agencyContractSlice.actions;
export default agencyContractSlice.reducer;
