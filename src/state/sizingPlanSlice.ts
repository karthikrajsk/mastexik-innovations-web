import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface PaginationInfo {
    total: number;
    next: boolean;
    prev: boolean;
    offset: number;
    limit: number;
}

export interface ApiState {
    loading: boolean;
    error: string | null;
    sizingPlanList: any;
    sizingPlanByIdList: any;
    createSizingPlanResult: any;
    checking: boolean,
    paginationInfo: PaginationInfo,
}

const initialState: ApiState = {
    loading: false,
    error: null,
    sizingPlanList: [],
    sizingPlanByIdList: [],
    createSizingPlanResult: null,
    checking: false,
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    }
};

const normalizeSizingPlanResponse = (
    response: any,
    fallbackOffset: number,
    fallbackLimit: number
) => {
    if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        const payload = response.data;
        const normalizedData = Array.isArray(payload.data)
            ? payload.data
            : Array.isArray(payload.items)
                ? payload.items
                : [];

        return {
            data: normalizedData,
            total: payload.total ?? payload.count ?? payload.pagination?.total ?? normalizedData.length,
            next: payload.next ?? payload.pagination?.next ?? false,
            prev: payload.prev ?? payload.pagination?.prev ?? fallbackOffset > 0,
            offset: payload.offset ?? payload.pagination?.offset ?? fallbackOffset,
            limit: payload.limit ?? payload.pagination?.limit ?? fallbackLimit
        };
    }

    if (Array.isArray(response?.data)) {
        return {
            data: response.data,
            total: response.total ?? response.count ?? response.data.length,
            next: response.next ?? false,
            prev: response.prev ?? false,
            offset: response.offset ?? fallbackOffset,
            limit: response.limit ?? fallbackLimit
        };
    }

    if (Array.isArray(response)) {
        return {
            data: response,
            total: response.length,
            next: false,
            prev: fallbackOffset > 0,
            offset: fallbackOffset,
            limit: fallbackLimit
        };
    }

    return {
        data: [],
        total: 0,
        next: false,
        prev: false,
        offset: fallbackOffset,
        limit: fallbackLimit
    };
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

// Thunk for getAllSizingPlan GET API call
export const getAllSizingPlan = createAsyncThunk(
    'sizing-plan/getAllSizingPlan',
    async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
        try {
            const fetchAll = params.fetchAll ?? false;
            const offset = fetchAll ? 0 : params.offset ?? 0;
            const limit = fetchAll ? 1000 : params.limit ?? 10000;
            const companyId = params.companyId;

            const queryParams = new URLSearchParams();
            queryParams.append('offset', String(offset));
            queryParams.append('limit', String(limit));

            let endpoint = companyId ? `/sizing-plan/company/${companyId}` : `/sizing-plan`;
            const queryString = queryParams.toString();
            if (queryString) {
                endpoint = `${endpoint}?${queryString}`;
            }

            const response = await apiService.get(endpoint);
            const normalized = normalizeSizingPlanResponse(response, offset, limit);

            return {
                data: normalized.data,
                total: normalized.total,
                next: normalized.next,
                prev: normalized.prev,
                offset: normalized.offset,
                limit: normalized.limit
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for getSizingPlanById
export const getSizingPlanById = createAsyncThunk(
    'sizing-plan/getSizingPlanById',
    async (params: number | { id: number; companyId?: number }, thunkAPI) => {
        try {
            const id = typeof params === 'number' ? params : params.id;
            const companyId = typeof params === 'number' ? undefined : params.companyId;
            const endpoint = companyId ? `/sizing-plan/company/${companyId}/${id}` : `/sizing-plan/${id}`;
            const response = await apiService.get(endpoint);
            console.log("API Response:", response);
            return response || { data: [], message: "", status: "success" };
        } catch (error: any) {
            console.error("API Error:", error);
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createSizingPlan POST API call
export const createSizingPlan: any = createAsyncThunk(
    'sizing-plan/createSizingPlan',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/sizing-plan", params); // Adjust API endpoint if needed
            console.log(response)
            if (response) {
                toast.success("Saved Successfully!");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
                    const errorMessage = resolveApiErrorMessage(error, "Failed to create sizing plan");
                    toast.error(errorMessage);
                    return thunkAPI.rejectWithValue(errorMessage);
                }
    }
);

export const updateSizingPlan: any = createAsyncThunk(
    'sizing-plan/updateSizingPlan',
    async ({ id, data, companyId }: { id: number, data: any, companyId?: number }, thunkAPI) => {
        try {
            const endpoint = companyId ? `/sizing-plan/company/${companyId}/${id}` : `/sizing-plan/${id}`;
            const response = await apiService.put(endpoint, data);

            if (response) {
                toast.success("Updated successfully!");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            toast.error(error.message || "Update failed");
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// export const deleteSizingPlan: any = createAsyncThunk(
//     'sizing-plan/deleteSizingPlan',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/sizing-plan/${id}`);
//             console.log(response); // Check what the API actually returns
//             if (response) {
//                 toast.success(response?.message);
//                 return response;
//             } else {
//                 const errorMessage = "Something went wrong";
//                 // toast.error(errorMessage);
//                 return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

const extractErrorMessage = (error: any) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Failed to delete category';

export const deleteSizingPlan = createAsyncThunk(
    'sizing-plan/deleteSizingPlan',
    async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
        try {
            const endpoint = companyId ? `/sizing-plan/company/${companyId}/${id}` : `/sizing-plan/${id}`;
            const response = await apiService.delete(endpoint);

            if (response?.status === 'success' || response?.data?.status === 'success') {
                toast.success(response?.message || response?.data?.message || "Successfully deleted");
                return id;
            }

            // const errorMessage = response?.data?.data?.message || response?.data?.message || 'Failed to delete category';
            // toast.error(errorMessage);
            // return thunkAPI.rejectWithValue(errorMessage);
            const errorMessage = extractErrorMessage(response);
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);

        } catch (error: any) {
             const message = extractErrorMessage(error);
                                   toast.error(message);
                                   return thunkAPI.rejectWithValue(message);
            // let errorMessage = 'An error occurred while deleting the category';

            // if (error.response) {
            //     errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            // } else if (error.request) {
            //     errorMessage = 'No response from server';
            // } else if (error.message) {
            //     errorMessage = error.message;
            // }

            // toast.error(errorMessage);
            // return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


// Create sizingPlanSlice
const sizingPlanSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllSizingPlan (GET request)
            .addCase(getAllSizingPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllSizingPlan.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload;

                if (payload && Array.isArray(payload.data)) {
                    state.sizingPlanList = payload.data;
                    state.paginationInfo = {
                        total: payload.total ?? payload.data.length ?? state.paginationInfo.total,
                        next: Boolean(payload.next),
                        prev: Boolean(payload.prev),
                        offset: payload.offset ?? state.paginationInfo.offset,
                        limit: payload.limit ?? state.paginationInfo.limit
                    };
                } else if (Array.isArray(payload)) {
                    state.sizingPlanList = payload;
                    state.paginationInfo = {
                        total: payload.length,
                        next: false,
                        prev: false,
                        offset: 0,
                        limit: payload.length || state.paginationInfo.limit
                    };
                } else {
                    state.sizingPlanList = [];
                    state.paginationInfo = {
                        ...state.paginationInfo,
                        total: 0,
                        next: false,
                        prev: false,
                        offset: 0
                    };
                }
            })
            .addCase(getAllSizingPlan.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getSizingPlanById (GET request)
            .addCase(getSizingPlanById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSizingPlanById.fulfilled, (state: any, action) => {
                state.loading = false;
                state.sizingPlanByIdList = action.payload;
            })
            .addCase(getSizingPlanById.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createSizingPlan (POST request)
            .addCase(createSizingPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSizingPlan.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createSizingPlanResult = action.payload;
            })
            .addCase(createSizingPlan.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateSizingPlan (PUT request)
            .addCase(updateSizingPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateSizingPlan.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.sizingPlanList = state.sizingPlanList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateSizingPlan.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteSizingPlan (DELETE request)
            .addCase(deleteSizingPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteSizingPlan.fulfilled, (state: any, action: PayloadAction<number>) => {
                state.loading = false;
                const deletedId = action.payload;
                if (deletedId !== undefined) {
                    state.sizingPlanList = state.sizingPlanList.filter(
                        (so: any) => so.id !== deletedId
                    );
                    state.paginationInfo = {
                        ...state.paginationInfo,
                        total: Math.max(0, state.paginationInfo.total - 1)
                    };
                }
            })
            .addCase(deleteSizingPlan.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default sizingPlanSlice.reducer;
