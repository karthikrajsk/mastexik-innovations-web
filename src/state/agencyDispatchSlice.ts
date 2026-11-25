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

export interface AgencyDispatchState {
    loading: boolean;
    error: string | null;
    dispatches: any[];
    currentDispatch: any | null;
    pagination: PaginationState;
}

const initialState: AgencyDispatchState = {
    loading: false,
    error: null,
    dispatches: [],
    currentDispatch: null,
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

export const getAllAgencyDispatches = createAsyncThunk(
    "agencyDispatch/getAllAgencyDispatches",
    async (
        params: { limit?: number; offset?: number; fetchAll?: boolean; paymentStatus?: string } = {},
        thunkAPI
    ) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.fetchAll) {
                // If fetchAll, don't paginate
            } else {
                if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
                if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
            }
            if (params.paymentStatus) {
                queryParams.append("paymentStatus", params.paymentStatus);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/agency-dispatch?${queryString}` : `/agency-dispatch`;
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
            const msg = resolveApiErrorMessage(error, "Failed to fetch Agency Dispatches");
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const getAgencyDispatchById = createAsyncThunk(
    "agencyDispatch/getAgencyDispatchById",
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.get(`/agency-dispatch/${id}`);
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to fetch Agency Dispatch");
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const createAgencyDispatch = createAsyncThunk(
    "agencyDispatch/createAgencyDispatch",
    async (data: any, thunkAPI) => {
        try {
            const response = await apiService.post("/agency-dispatch", data);
            toast.success("Agency Mill Dispatch recorded successfully!");
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to create Agency Dispatch");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const updateAgencyDispatch = createAsyncThunk(
    "agencyDispatch/updateAgencyDispatch",
    async ({ id, data }: { id: number; data: any }, thunkAPI) => {
        try {
            const response = await apiService.put(`/agency-dispatch/${id}`, data);
            toast.success("Agency Mill Dispatch updated successfully!");
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to update Agency Dispatch");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const deleteAgencyDispatch = createAsyncThunk(
    "agencyDispatch/deleteAgencyDispatch",
    async (id: number, thunkAPI) => {
        try {
            await apiService.delete(`/agency-dispatch/${id}`);
            toast.success("Agency Mill Dispatch deleted successfully!");
            return id;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to delete Agency Dispatch");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

const agencyDispatchSlice = createSlice({
    name: "agencyDispatch",
    initialState,
    reducers: {
        clearCurrentDispatch: (state) => {
            state.currentDispatch = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // getAllAgencyDispatches
            .addCase(getAllAgencyDispatches.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllAgencyDispatches.fulfilled, (state, action) => {
                state.loading = false;
                state.dispatches = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllAgencyDispatches.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // getAgencyDispatchById
            .addCase(getAgencyDispatchById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAgencyDispatchById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentDispatch = action.payload;
            })
            .addCase(getAgencyDispatchById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // createAgencyDispatch
            .addCase(createAgencyDispatch.fulfilled, (state, action) => {
                state.dispatches.unshift(action.payload);
            })

            // updateAgencyDispatch
            .addCase(updateAgencyDispatch.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.dispatches.findIndex((d) => d.id === updated.id);
                if (idx !== -1) {
                    state.dispatches[idx] = updated;
                }
                if (state.currentDispatch?.id === updated.id) {
                    state.currentDispatch = updated;
                }
            })

            // deleteAgencyDispatch
            .addCase(deleteAgencyDispatch.fulfilled, (state, action) => {
                state.dispatches = state.dispatches.filter((d) => d.id !== action.payload);
            });
    },
});

export const { clearCurrentDispatch } = agencyDispatchSlice.actions;
export default agencyDispatchSlice.reducer;
