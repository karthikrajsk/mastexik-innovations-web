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
    poTypeList: any;
    createPoTypeResult: any;
    checking: boolean,
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    poTypeList: [],
    createPoTypeResult: null,
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

export const getAllPoTypes = createAsyncThunk(
    "poType/getAllPoTypes",
    async (
        params: { limit?: number; offset?: number; fetchAll?: boolean } = {},
        thunkAPI
    ) => {
        try {
            const queryParams = new URLSearchParams()

            if (params.fetchAll) {
                queryParams.append("limit", "10000")
                queryParams.append("offset", "0")
            } else {
                if (params.limit !== undefined) {
                    queryParams.append("limit", String(params.limit))
                }
                if (params.offset !== undefined) {
                    queryParams.append("offset", String(params.offset))
                }
            }

            const queryString = queryParams.toString()
            const url = queryString
                ? `/po-type-master?${queryString}`
                : `/po-type-master`

            const response = await apiService.get(url)

            const paginationData = response?.data

            const rawArray = Array.isArray(paginationData?.data)
                ? paginationData.data
                : []

            return {
                data: rawArray,
                pagination: {
                    total: paginationData?.total || rawArray.length || 0,
                    limit:
                        paginationData?.limit ??
                        (params.fetchAll ? 10000 : params.limit ?? 10),
                    offset:
                        paginationData?.offset ??
                        (params.fetchAll ? 0 : params.offset ?? 0),
                    next: paginationData?.next ?? false,
                    prev: paginationData?.prev ?? false,
                }
            }

        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message)
        }
    }
);

// Thunk for createPoType POST API call
export const createPoType: any = createAsyncThunk(
    'poType/createPoType',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/po-type-master", params);
            console.log(response)
            if (response?.status === 'success') {
                toast.success("Saved Successfully");
                return response;
            } else {
                const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage)
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for updatePoType PUT API call
export const updatePoType: any = createAsyncThunk(
    'poType/updatePoType',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/po-type-master/${params.id}`, params);
            console.log(response);
            if (response?.status === 'success') {
                toast.success("Updated Successfully");
                return response;
            } else {
                const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage)
            }
        } catch (error: any) {

            const errorMessage = resolveApiErrorMessage(error, "Failed to create city");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for deletePoType DELETE API call
export const deletePoType = createAsyncThunk(
    'poType/deletePoType',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/po-type-master/${id}`);

            if (response?.status === 'success') {
                toast.success('PO Type deleted successfully');
                return id;
            }

            const errorMessage = response.data.data?.message || 'Failed to delete PO Type';
            toast.error(errorMessage);
            return response;

        } catch (error: any) {
            let errorMessage = 'An error occurred while deleting the PO Type';

            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            } else if (error.request) {
                errorMessage = 'No response from server';
            }

            toast.error(errorMessage);
            return errorMessage;
        }
    }
);

// Create PO Type Slice
const poTypeSlice = createSlice({
    name: "poType",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder

            // Handle getAllPoTypes (GET request)
            .addCase(getAllPoTypes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllPoTypes.fulfilled, (state: any, action) => {
                state.loading = false;
                state.poTypeList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllPoTypes.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createPoType (POST request)
            .addCase(createPoType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPoType.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createPoTypeResult = action.payload;
            })
            .addCase(createPoType.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updatePoType (PUT request)
            .addCase(updatePoType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePoType.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.poTypeList = state.poTypeList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updatePoType.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deletePoType (DELETE request)
            .addCase(deletePoType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePoType.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.poTypeList = state.poTypeList.filter(
                    (poType: any) => poType.id !== deletedId
                );
            })
            .addCase(deletePoType.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default poTypeSlice.reducer;