import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    brushingReceivesList: any[];
    availablePieces: any[];
    availableInspectionPieces: any[];
    currentReceive: any | null;
    brushingStockList: any[];
    totalStockCount: number;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    brushingReceivesList: [],
    availablePieces: [],
    availableInspectionPieces: [],
    currentReceive: null,
    brushingStockList: [],
    totalStockCount: 0,
};

const resolveApiErrorMessage = (error: any, fallback: string) => {
    const responseData = error?.response?.data;
    const candidates: string[] = [];

    if (typeof responseData === "string") {
        candidates.push(responseData);
    } else if (responseData) {
        if (typeof responseData.message === "string") {
            candidates.push(responseData.message);
        }
        if (typeof responseData.error === "string") {
            candidates.push(responseData.error);
        }
        if (typeof responseData.data === "string") {
            candidates.push(responseData.data);
        }
    }

    const candidate = candidates.find((msg) => typeof msg === "string" && msg.trim());
    return candidate || error?.message || fallback;
};

// Async Thunks
export const createBrushingReceive = createAsyncThunk(
    "brushing/createReceive",
    async (dto: any, { rejectWithValue }) => {
        try {
            const response = await apiService.post("/brushing/receive", dto);
            toast.success("Brushing Receive Challan saved successfully!");
            return response;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to save Brushing Receive");
            toast.error(msg);
            return rejectWithValue(msg);
        }
    }
);

export const getAllBrushingReceivesByCompany = createAsyncThunk(
    "brushing/getReceivesByCompany",
    async (companyId: number, { rejectWithValue }) => {
        try {
            const response = await apiService.get(`/brushing/receive/company/${companyId}`);
            return response;
        } catch (error: any) {
            return rejectWithValue(resolveApiErrorMessage(error, "Failed to fetch Brushing Receives"));
        }
    }
);

export const getBrushingReceiveById = createAsyncThunk(
    "brushing/getReceiveById",
    async (id: number, { rejectWithValue }) => {
        try {
            const response = await apiService.get(`/brushing/receive/${id}`);
            return response;
        } catch (error: any) {
            return rejectWithValue(resolveApiErrorMessage(error, "Failed to fetch Brushing Receive Details"));
    }
}
);

export const updateBrushingReceive = createAsyncThunk(
    "brushing/updateReceive",
    async ({ id, dto }: { id: number; dto: any }, { rejectWithValue }) => {
        try {
            const response = await apiService.put(`/brushing/receive/${id}`, dto);
            toast.success("Brushing Receive updated successfully!");
            return response;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to update Brushing Receive");
            toast.error(msg);
            return rejectWithValue(msg);
        }
    }
);

export const deleteBrushingReceive = createAsyncThunk(
    "brushing/deleteReceive",
    async (id: number, { rejectWithValue }) => {
        try {
            await apiService.delete(`/brushing/receive/${id}`);
            toast.success("Brushing Receive deleted successfully!");
            return id;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to delete Brushing Receive");
            toast.error(msg);
            return rejectWithValue(msg);
        }
    }
);

export const updateBrushingReceiveStatus = createAsyncThunk(
    "brushing/updateReceiveStatus",
    async ({ id, status, brushingCompletedDate, details }: { id: number; status: string; brushingCompletedDate?: string | null; details: any[] }, { rejectWithValue, dispatch }) => {
        try {
            const response = await apiService.put(`/brushing/receive/${id}/status`, { status, brushingCompletedDate, details });
            toast.success(`Brushing Receive status updated to ${status}!`);
            const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            if (storedCompanyId) {
                dispatch(getAllBrushingReceivesByCompany(Number(storedCompanyId)));
            }
            return response;
        } catch (error: any) {
            const msg = resolveApiErrorMessage(error, "Failed to update Brushing Receive status");
            toast.error(msg);
            return rejectWithValue(msg);
        }
    }
);

export const getPiecesAvailableForBrushingInspection = createAsyncThunk(
    "brushing/getAvailableInspectionPieces",
    async (companyId: number, { rejectWithValue }) => {
        try {
            const response = await apiService.get(`/brushing/available-inspection-pieces/company/${companyId}`);
            return response;
        } catch (error: any) {
            return rejectWithValue(resolveApiErrorMessage(error, "Failed to fetch pieces available for inspection"));
        }
    }
);

export const getBrushingStock = createAsyncThunk(
    "brushing/getStock",
    async ({ companyId, offset, limit, status }: { companyId: number; offset?: number; limit?: number; status?: string }, { rejectWithValue }) => {
        try {
            let url = `/brushing-stock/company/${companyId}`;
            const params = [];
            if (offset !== undefined && limit !== undefined) {
                params.push(`offset=${offset}`);
                params.push(`limit=${limit}`);
            }
            if (status && status !== "ALL") {
                params.push(`status=${status}`);
            }
            if (params.length > 0) {
                url += `?${params.join("&")}`;
            }
            const response = await apiService.get(url);
            return response;
        } catch (error: any) {
            return rejectWithValue(resolveApiErrorMessage(error, "Failed to fetch Opening Dispatched Rolls"));
        }
    }
);

// Slice Definition
const brushingSlice = createSlice({
    name: "brushing",
    initialState,
    reducers: {
        clearBrushingErrors: (state) => {
            state.error = null;
        },
        resetCurrentReceive: (state) => {
            state.currentReceive = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Receive
            .addCase(createBrushingReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBrushingReceive.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.currentReceive = action.payload;
            })
            .addCase(createBrushingReceive.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getAllBrushingReceivesByCompany.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllBrushingReceivesByCompany.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.brushingReceivesList = action.payload;
            })
            .addCase(getAllBrushingReceivesByCompany.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getBrushingReceiveById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getBrushingReceiveById.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.currentReceive = action.payload;
            })
            .addCase(getBrushingReceiveById.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            // updateBrushingReceive
            .addCase(updateBrushingReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBrushingReceive.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.currentReceive = action.payload;
                if (Array.isArray(state.brushingReceivesList)) {
                    const index = state.brushingReceivesList.findIndex(item => item.id === action.payload.id);
                    if (index !== -1) {
                        state.brushingReceivesList[index] = action.payload;
                    }
                }
            })
            .addCase(updateBrushingReceive.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            // deleteBrushingReceive
            .addCase(deleteBrushingReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBrushingReceive.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                state.brushingReceivesList = state.brushingReceivesList.filter(item => item.id !== action.payload);
            })
            .addCase(deleteBrushingReceive.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // updateBrushingReceiveStatus
            .addCase(updateBrushingReceiveStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBrushingReceiveStatus.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const index = state.brushingReceivesList.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.brushingReceivesList[index] = action.payload;
                }
            })
            .addCase(updateBrushingReceiveStatus.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Available Pieces
            .addCase(getPiecesAvailableForBrushingInspection.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPiecesAvailableForBrushingInspection.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.availableInspectionPieces = action.payload;
            })
            .addCase(getPiecesAvailableForBrushingInspection.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getBrushingStock.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getBrushingStock.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                if (action.payload && action.payload.status === "success" && action.payload.data) {
                    state.brushingStockList = action.payload.data.data || [];
                    state.totalStockCount = action.payload.data.total || 0;
                } else {
                    state.brushingStockList = [];
                    state.totalStockCount = 0;
                }
            })
            .addCase(getBrushingStock.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearBrushingErrors, resetCurrentReceive } = brushingSlice.actions;
export default brushingSlice.reducer;
