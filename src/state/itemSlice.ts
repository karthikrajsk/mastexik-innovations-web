import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    itemList: any;
    createItemResult: any;
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
    itemList: [],
    createItemResult: null,
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


// Thunk for getAllItemMasters GET API call
export const getAllItemMasters = createAsyncThunk(
    'item/getAllItemMasters',
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
            const url = queryString ? `/item-master?${queryString}` : "/item-master";
            
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

// Thunk for createItemMaster POST API call
export const createItemMaster: any = createAsyncThunk(
    'item/createItemMaster',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/item-master", params);
            if (response?.status === 'success') {
                toast.success(response?.message || "Saved Successfully");
                return response;
            } else {
               const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
        toast.error(errorMessage);
        return thunkAPI.rejectWithValue(errorMessage)
            }
        } catch (error: any) {
           const errorMessage = resolveApiErrorMessage(error, "Failed to create item");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for updateItemMaster PUT API call
export const updateItemMaster: any = createAsyncThunk(
    'item/updateItemMaster',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.put(`/item-master/${params.id}`, params);
            if (response?.status === 'success') {
                toast.success(response?.message || "Updated Successfully");
                return response;
            } else {
               const errorMessage = resolveApiErrorMessage(response, "Something went wrong");
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to update item");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for deleteItemMaster DELETE API call
export const deleteItemMaster = createAsyncThunk(
    'item/deleteItemMaster',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/item-master/${id}`);

            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return id;
            }

            const errorMessage = response.data?.message || 'Failed to delete';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);

        } catch (error: any) {
            let errorMessage = 'An error occurred while deleting';
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            } else if (error.request) {
                errorMessage = 'No response from server';
            }
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Create itemSlice 
const itemSlice = createSlice({
    name: "itemMaster",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Handle getAllItemMasters (GET request)
            .addCase(getAllItemMasters.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllItemMasters.fulfilled, (state: any, action) => {
                state.loading = false;
                state.itemList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllItemMasters.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle createItemMaster (POST request)
            .addCase(createItemMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createItemMaster.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createItemResult = action.payload;
            })
            .addCase(createItemMaster.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateItemMaster (PUT request)
            .addCase(updateItemMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateItemMaster.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedItem = action.payload.data || action.payload;
                state.itemList = state.itemList.map((item: any) =>
                    item.id === updatedItem.id ? updatedItem : item
                );
            })
            .addCase(updateItemMaster.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteItemMaster (DELETE request)
            .addCase(deleteItemMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteItemMaster.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.itemList = state.itemList.filter(
                    (item: any) => item.id !== deletedId
                );
            })
            .addCase(deleteItemMaster.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

    },
});

export default itemSlice.reducer;
