import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    termsContitionsList: any;
    createTermsContitionsResult: any;
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
    termsContitionsList: [],
    createTermsContitionsResult: null,
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


// Thunk for getAllTermsConditions GET API call
export const getAllTermsConditions = createAsyncThunk(
    'terms-conditions/getAllTermsConditions',
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
            const url = queryString ? `/terms-conditions?${queryString}` : "/terms-conditions";
            
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

// Thunk for createTermsCondition POST API call
export const createTermsCondition: any = createAsyncThunk(
    'terms-conditions/createTermsCondition',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/terms-conditions", params); // Adjust API endpoint if needed
            console.log(response)
            const isSuccessful = response?.isSuccess === true || response?.status === 'success' || response?.isSuccess === 'success';

            if (isSuccessful) {
                toast.success("Saved Successfully");
                return response;
            } else {
                 const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                       toast.error(errorMessage);
                       return thunkAPI.rejectWithValue(errorMessage)
            }
        } catch (error: any) {
                  const errorMessage = resolveApiErrorMessage(error, "Failed to create terms condition");
                                          toast.error(errorMessage);
                  return thunkAPI.rejectWithValue(errorMessage)
        }
    }
);

// Thunk for updateTermsCondition PUT API call
export const updateTermsCondition: any = createAsyncThunk(
    'terms-conditions/updateTermsCondition',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/terms-conditions/${params.id}`, params); // ✅ Fix: Add ID to the URL
            console.log(response);
            const isSuccessful = response?.isSuccess === true || response?.status === 'success' || response?.isSuccess === 'success';

            if (isSuccessful) {
                toast.success("Updated Successfully");
                return response;
            } else {
                 const errorMessage = resolveApiErrorMessage(response, "Something went wrong");
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to update terms condition");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteTermsCondition: any = createAsyncThunk(
    'terms-conditions/deleteTermsCondition',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/terms-conditions/${id}`);
            const isSuccessful = response?.status === 'success' || response?.isSuccess === true;

            if (isSuccessful) {
                toast.success(response?.message || "Deleted successfully");
                return id;
            }

            const errorMessage = response?.message || response?.data?.message || "Something went wrong";
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error.message || "Failed to delete";
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


// Create termsConditionsSlice
const termsConditionsSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllTermsConditions (GET request)
            .addCase(getAllTermsConditions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllTermsConditions.fulfilled, (state: any, action) => {
                state.loading = false;
                state.termsContitionsList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllTermsConditions.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createTermsCondition (POST request)
            .addCase(createTermsCondition.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTermsCondition.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createTermsContitionsResult = action.payload;
            })
            .addCase(createTermsCondition.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateTermsCondition (PUT request)
            .addCase(updateTermsCondition.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTermsCondition.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.termsContitionsList = state.termsContitionsList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateTermsCondition.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteTermsCondition (DELETE request)
            .addCase(deleteTermsCondition.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteTermsCondition.fulfilled, (state: any, action) => {
                state.loading = false;
                const deleted = action.payload;
                const deletedId = typeof deleted === 'number' ? deleted : deleted?.id;
                if (typeof deletedId === 'number') {
                    state.termsContitionsList = state.termsContitionsList.filter(
                        (terms: any) => terms.id !== deletedId
                    );
                    state.pagination.total = Math.max(0, state.pagination.total - 1);
                }
            })
            .addCase(deleteTermsCondition.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default termsConditionsSlice.reducer;
