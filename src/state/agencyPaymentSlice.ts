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

export interface AgencyPaymentState {
    loading: boolean;
    error: string | null;
    payments: any[];
    currentPayment: any | null;
    pagination: PaginationState;
}

const initialState: AgencyPaymentState = {
    loading: false,
    error: null,
    payments: [],
    currentPayment: null,
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

export const getAllAgencyPayments = createAsyncThunk(
    "agencyPayment/getAllAgencyPayments",
    async (
        params: { limit?: number; offset?: number; fetchAll?: boolean } = {},
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

            const queryString = queryParams.toString();
            const url = queryString ? `/agency-payment?${queryString}` : `/agency-payment`;
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
            const msg = resolveApiErrorMessage(error, "Failed to fetch Agency Payments");
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const getAgencyPaymentById = createAsyncThunk(
    "agencyPayment/getAgencyPaymentById",
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.get(`/agency-payment/${id}`);
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to fetch Agency Payment");
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const createAgencyPayment = createAsyncThunk(
    "agencyPayment/createAgencyPayment",
    async (data: any, thunkAPI) => {
        try {
            const response = await apiService.post("/agency-payment", data);
            toast.success("Agency Payment Realization recorded successfully!");
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to record Agency Payment");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const updateAgencyPayment = createAsyncThunk(
    "agencyPayment/updateAgencyPayment",
    async ({ id, data }: { id: number; data: any }, thunkAPI) => {
        try {
            const response = await apiService.put(`/agency-payment/${id}`, data);
            toast.success("Agency Payment Realization updated successfully!");
            return response?.data;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to update Agency Payment");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

export const deleteAgencyPayment = createAsyncThunk(
    "agencyPayment/deleteAgencyPayment",
    async (id: number, thunkAPI) => {
        try {
            await apiService.delete(`/agency-payment/${id}`);
            toast.success("Agency Payment Realization deleted successfully!");
            return id;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to delete Agency Payment");
            toast.error(msg);
            return thunkAPI.rejectWithValue(msg);
        }
    }
);

const agencyPaymentSlice = createSlice({
    name: "agencyPayment",
    initialState,
    reducers: {
        clearCurrentPayment: (state) => {
            state.currentPayment = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // getAllAgencyPayments
            .addCase(getAllAgencyPayments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllAgencyPayments.fulfilled, (state, action) => {
                state.loading = false;
                state.payments = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllAgencyPayments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // getAgencyPaymentById
            .addCase(getAgencyPaymentById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAgencyPaymentById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPayment = action.payload;
            })
            .addCase(getAgencyPaymentById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // createAgencyPayment
            .addCase(createAgencyPayment.fulfilled, (state, action) => {
                state.payments.unshift(action.payload);
            })

            // updateAgencyPayment
            .addCase(updateAgencyPayment.fulfilled, (state, action) => {
                const updated = action.payload;
                const idx = state.payments.findIndex((p) => p.id === updated.id);
                if (idx !== -1) {
                    state.payments[idx] = updated;
                }
                if (state.currentPayment?.id === updated.id) {
                    state.currentPayment = updated;
                }
            })

            // deleteAgencyPayment
            .addCase(deleteAgencyPayment.fulfilled, (state, action) => {
                state.payments = state.payments.filter((p) => p.id !== action.payload);
            });
    },
});

export const { clearCurrentPayment } = agencyPaymentSlice.actions;
export default agencyPaymentSlice.reducer;
