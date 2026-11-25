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
    millList: any[];
    createMillResult: any;
    checking: boolean;
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    millList: [],
    createMillResult: null,
    checking: false,
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
        if (responseData.data && typeof responseData.data === "object") {
            if (typeof responseData.data.message === "string") {
                candidates.push(responseData.data.message);
            }
            if (typeof responseData.data.error === "string") {
                candidates.push(responseData.data.error);
            }
            if (Array.isArray(responseData.data.errors)) {
                responseData.data.errors.forEach((err: any) => {
                    if (typeof err === "string") {
                        candidates.push(err);
                    } else if (typeof err?.message === "string") {
                        candidates.push(err.message);
                    }
                });
            }
        }
        if (Array.isArray(responseData.errors)) {
            responseData.errors.forEach((err: any) => {
                if (typeof err === "string") {
                    candidates.push(err);
                } else if (typeof err?.message === "string") {
                    candidates.push(err.message);
                }
            });
        }
    }

    const candidate = candidates.find((msg) => typeof msg === "string" && msg.trim());
    return candidate || error?.message || fallback;
};

// Thunk for getAllMills GET API call
export const getAllMills = createAsyncThunk(
    "mill/getAllMills",
    async (
        params: {
            limit?: number;
            offset?: number;
            fetchAll?: boolean;
        } = {},
        thunkAPI
    ) => {
        try {
            const queryParams = new URLSearchParams();

            if (params.fetchAll) {
                queryParams.append("limit", "10000");
                queryParams.append("offset", "0");
            } else {
                if (params.limit !== undefined) {
                    queryParams.append("limit", String(params.limit));
                }
                if (params.offset !== undefined) {
                    queryParams.append("offset", String(params.offset));
                }
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/mill?${queryString}` : `/mill`;

            const response = await apiService.get(url);

            const paginationData = response?.data;
            const rawArray = Array.isArray(paginationData?.data)
                ? paginationData.data
                : Array.isArray(paginationData)
                ? paginationData
                : [];

            return {
                data: rawArray,
                pagination: {
                    total: paginationData?.total || rawArray.length || 0,
                    limit: paginationData?.limit ?? (params.fetchAll ? 10000 : params.limit ?? 10),
                    offset: paginationData?.offset ?? (params.fetchAll ? 0 : params.offset ?? 0),
                    next: paginationData?.next ?? false,
                    prev: paginationData?.prev ?? false,
                },
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createMill POST API call
export const createMill: any = createAsyncThunk(
    "mill/createMill",
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/mill", params);
            if (response?.status === "success") {
                toast.success(response?.message || "Mill created successfully");
                return response?.data;
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to create mill");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for updateMill PUT API call
export const updateMill: any = createAsyncThunk(
    "mill/updateMill",
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.put(`/mill/${params.id}`, params);
            if (response?.status === "success") {
                toast.success(response?.message || "Mill updated successfully");
                return response?.data;
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to update mill");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for deleteMill DELETE API call
export const deleteMill = createAsyncThunk(
    "mill/deleteMill",
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/mill/${id}`);
            if (response?.status === "success") {
                toast.success("Successfully deleted");
                return id;
            }
            const errorMessage = response.data?.message || "Failed to delete";
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            let errorMessage = "An error occurred while deleting";
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            } else if (error.request) {
                errorMessage = "No response from server";
            }
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Create MillSlice
const millSlice = createSlice({
    name: "mill",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Handle getAllMills
            .addCase(getAllMills.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllMills.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload || { data: [], pagination: state.pagination };
                const sortedData = Array.isArray(payload.data)
                    ? [...payload.data].sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
                    : [];
                state.millList = sortedData;
                state.pagination = payload.pagination || state.pagination;
            })
            .addCase(getAllMills.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createMill
            .addCase(createMill.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createMill.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createMillResult = action.payload;
            })
            .addCase(createMill.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateMill
            .addCase(updateMill.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateMill.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedMill = action.payload;
                state.millList = state.millList.map((mill: any) =>
                    mill.id === updatedMill.id ? updatedMill : mill
                );
            })
            .addCase(updateMill.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteMill
            .addCase(deleteMill.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteMill.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                if (typeof deletedId === "number") {
                    state.millList = state.millList.filter((mill: any) => mill.id !== deletedId);
                    state.pagination.total = Math.max(0, state.pagination.total - 1);
                }
            })
            .addCase(deleteMill.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default millSlice.reducer;
