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
    sizingYarnIssuetList: any;
    createSizingYarnIssuetResult: any;
    checking: boolean,
    paginationInfo: PaginationInfo,
}

const initialState: ApiState = {
    loading: false,
    error: null,
    sizingYarnIssuetList: [],
    createSizingYarnIssuetResult: null,
    checking: false,
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
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
const normalizeSizingYarnIssueResponse = (
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

// Thunk for getAllSizingYarnIssue GET API call
export const getAllSizingYarnIssue = createAsyncThunk(
    'sizing-yarn-issues/getAllSizingYarnIssue',
    async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
        try {
            const fetchAll = params.fetchAll ?? false;
            const offset = fetchAll ? 0 : params.offset ?? 0;
            const limit = fetchAll ? 1000 : params.limit ?? 10000;
            const companyId = params.companyId;

            const queryParams = new URLSearchParams();
            queryParams.append('offset', String(offset));
            queryParams.append('limit', String(limit));

            let endpoint = companyId ? `/sizing-yarn-issues/company/${companyId}` : `/sizing-yarn-issues`;
            const queryString = queryParams.toString();
            if (queryString) {
                endpoint = `${endpoint}?${queryString}`;
            }

            const response = await apiService.get(endpoint);
            const normalized = normalizeSizingYarnIssueResponse(response, offset, limit);

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

// Thunk for createSizingYarnIssue POST API call
export const createSizingYarnIssue: any = createAsyncThunk(
    'sizing-yarn-issues/createSizingYarnIssue',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/sizing-yarn-issues", params); // Adjust API endpoint if needed
            console.log(response)
            if (response) {
                toast.success("Sizing Yarn Issue Successfully!");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        }  catch (error: any) {
                            const errorMessage = resolveApiErrorMessage(error, "Failed to create sizing yarn issue");
                            toast.error(errorMessage);
                            return thunkAPI.rejectWithValue(errorMessage);
                        }
    }
);

export const updateSizingYarnIssue: any = createAsyncThunk(
    'sizing-yarn-issues/updateSizingYarnIssue',
    async ({ id, data, companyId }: { id: number, data: any, companyId?: number }, thunkAPI) => {
        try {
            const endpoint = companyId ? `/sizing-yarn-issues/company/${companyId}/${id}` : `/sizing-yarn-issues/${id}`;
            const response = await apiService.put(endpoint, data);

            if (response) {
                toast.success("updated successfully!");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
               const errorMessage = resolveApiErrorMessage(error, "Failed to create sizing yarn issue");
                            toast.error(errorMessage);
                            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteSizingYarnIssue = createAsyncThunk(
    'sizing-yarn-issues/deleteSizingYarnIssue',
    async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
        try {
            const endpoint = companyId ? `/sizing-yarn-issues/company/${companyId}/${id}` : `/sizing-yarn-issues/${id}`;
            const response = await apiService.delete(endpoint);
            console.log(response);
            if (response?.status === 'success' || response?.data?.status === 'success' || response?.isSuccess) {
                toast.success(response?.message || response?.data?.message || "Successfully deleted");
                return id;
            }

            const errorMessage = response?.data?.data?.message || response?.data?.message || 'Failed to delete category';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            let errorMessage = 'An error occurred while deleting the category';

            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            } else if (error.request) {
                errorMessage = 'No response from server';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


// Create sizingYarnIssueSlice
const sizingYarnIssueSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllSizingYarnIssue (GET request)
            .addCase(getAllSizingYarnIssue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllSizingYarnIssue.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload;

                if (payload && Array.isArray(payload.data)) {
                    state.sizingYarnIssuetList = payload.data;
                    state.paginationInfo = {
                        total: payload.total ?? payload.data.length ?? state.paginationInfo.total,
                        next: Boolean(payload.next),
                        prev: Boolean(payload.prev),
                        offset: payload.offset ?? state.paginationInfo.offset,
                        limit: payload.limit ?? state.paginationInfo.limit
                    };
                } else if (Array.isArray(payload)) {
                    state.sizingYarnIssuetList = payload;
                    state.paginationInfo = {
                        total: payload.length,
                        next: false,
                        prev: false,
                        offset: 0,
                        limit: payload.length || state.paginationInfo.limit
                    };
                } else {
                    state.sizingYarnIssuetList = [];
                    state.paginationInfo = {
                        ...state.paginationInfo,
                        total: 0,
                        next: false,
                        prev: false,
                        offset: 0
                    };
                }
            })
            .addCase(getAllSizingYarnIssue.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createSizingYarnIssue (POST request)
            .addCase(createSizingYarnIssue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSizingYarnIssue.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createSizingYarnIssuetResult = action.payload;
            })
            .addCase(createSizingYarnIssue.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteSizingYarnIssue (DELETE request)
            .addCase(deleteSizingYarnIssue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
             .addCase(deleteSizingYarnIssue.fulfilled, (state: any, action) => {
                                state.loading = false;
                                const deletedId = action.payload;
                                if (deletedId !== undefined) {
                                    state.sizingYarnIssuetList = state.sizingYarnIssuetList.filter((item: any) => item.id !== deletedId);
                                    state.paginationInfo = {
                                        ...state.paginationInfo,
                                        total: Math.max(0, state.paginationInfo.total - 1)
                                    };
                                }
                            })
    
            .addCase(deleteSizingYarnIssue.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default sizingYarnIssueSlice.reducer;
