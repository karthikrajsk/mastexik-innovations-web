import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    finishFabricList: any;
    createFinishFabricResult: any;
    checking: boolean,
    pagination: {
        total: number;
        limit: number;
        offset: number;
        next: boolean;
        prev: boolean;
    }
}

const initialState: ApiState = {
    loading: false,
    error: null,
    finishFabricList: [],
    createFinishFabricResult: null,
    checking: false,
    pagination: {
        total: 0,
        limit: 10,
        offset: 0,
        next: false,
        prev: false,
    }
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
// Thunk for getAllFinishFabric GET API call
export const getAllFinishFabric = createAsyncThunk(
    'finish-master/getAllFinishFabric',
    async (params: { limit?: number; offset?: number; fetchAll?: boolean } = {}, thunkAPI) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.fetchAll) {
                queryParams.append('limit', '10000');
                queryParams.append('offset', '0');
            } else {
                if (params.limit) queryParams.append('limit', String(params.limit));
                if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
            }
            const queryString = queryParams.toString();
            const url = queryString ? `/finish-master?${queryString}` : "/finish-master";
            
            const response = await apiService.get(url);
            const paginationData = response?.data;
            const data = paginationData?.data || [];
            return {
                data,
                pagination: {
                    total: paginationData?.total || 0,
                    limit: paginationData?.limit || 10,
                    offset: paginationData?.offset || 0,
                    next: paginationData?.next || false,
                    prev: paginationData?.prev || false,
                }
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createFinishFabric POST API call
export const createFinishFabric: any = createAsyncThunk(
    'finish-master/createFinishFabric',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/finish-master", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === 'success') {
                toast.success("Saved Successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
                        }
    }
);

// Thunk for updateFinishFabric PUT API call
export const updateFinishFabric: any = createAsyncThunk(
    'finish-master/updateFinishFabric',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/finish-master/${params.id}`, params); // ✅ Fix: Add ID to the URL
            console.log(response);
            if (response?.status === 'success') {
                toast.success("Updated Successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const deleteFinishFabric: any = createAsyncThunk(
    'finish-master/deleteFinishFabric',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/finish-master/${id}`);
            console.log(response); // Check what the API actually returns
            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);


// Create finishFabricSlice 
const finishFabricSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllFinishFabric (GET request)
            .addCase(getAllFinishFabric.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllFinishFabric.fulfilled, (state: any, action) => {
                state.loading = false;
                state.finishFabricList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllFinishFabric.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createFinishFabric (POST request)
            .addCase(createFinishFabric.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createFinishFabric.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createFinishFabricResult = action.payload;
            })
            .addCase(createFinishFabric.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateFinishFabric (PUT request)
            .addCase(updateFinishFabric.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateFinishFabric.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.finishFabricList = state.finishFabricList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateFinishFabric.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteFinishFabric (DELETE request)
            .addCase(deleteFinishFabric.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteFinishFabric.fulfilled, (state: any, action) => {
                state.loading = false;
                const deleteduom = action.payload;
                state.finishFabricList = state.finishFabricList.filter(
                    (terms: any) => terms.id !== deleteduom.id
                );
            })
            .addCase(deleteFinishFabric.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default finishFabricSlice.reducer;
