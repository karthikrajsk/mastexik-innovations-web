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
    fabricDispatchDyingList: any;
    paginationInfo: PaginationInfo;
    createResul: any;
    checking: boolean,
}

const initialState: ApiState = {
    loading: false,
    error: null,
    fabricDispatchDyingList: [],
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    },
    createResul: null,
    checking: false,
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

const getSelectedCompanyId = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    const stored = window.localStorage.getItem('selectedCompanyId') ?? window.localStorage.getItem('selectedCompany');
    return stored ? Number(stored) : null;
};

// Thunk for getAllFabricDispatch GET API call
export const getAllFabricDispatch = createAsyncThunk(
    'fabric-dispatch/getAllFabricDispatch',
    async (params: { offset?: number; limit?: number; fetchAll?: boolean; processType?: string } = {}, thunkAPI) => {
        try {
            const companyId = getSelectedCompanyId();
            if (!companyId) {
                throw new Error('Please select a company');
            }
            const offset = params.fetchAll ? 0 : (params.offset ?? 0);
            const limit = params.fetchAll ? 10000 : (params.limit ?? 10000);
            const normalizedType = params.processType ? params.processType.toUpperCase() : undefined;
            const queryParams: Record<string, number> = { offset, limit };

            const endpoint = normalizedType
                ? `/fabric-dispatch/type/${normalizedType}/company/${companyId}`
                : `/fabric-dispatch/company/${companyId}`;

            const response = await apiService.get(endpoint, queryParams);

            if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                const paginationData = response.data;
                const total = paginationData.total || 0;
                const nextOffset = (paginationData.offset || offset) + (paginationData.limit || limit);
                return {
                    data: paginationData.data || [],
                    total,
                    next: paginationData.next !== undefined ? paginationData.next : nextOffset < total,
                    prev: paginationData.prev !== undefined ? paginationData.prev : (paginationData.offset || offset) > 0,
                    offset: paginationData.offset || offset,
                    limit: paginationData.limit || limit
                };
            }

            if (Array.isArray(response?.data)) {
                const total = response.total || 0;
                const nextOffset = (response.offset || offset) + (response.limit || limit);
                return {
                    data: response.data,
                    total,
                    next: response.next !== undefined ? response.next : nextOffset < total,
                    prev: response.prev !== undefined ? response.prev : (response.offset || offset) > 0,
                    offset: response.offset || offset,
                    limit: response.limit || limit
                };
            }

            if (Array.isArray(response)) {
                const total = response.length;
                const nextOffset = offset + limit;
                return {
                    data: response,
                    total,
                    next: nextOffset < total,
                    prev: offset > 0,
                    offset,
                    limit
                };
            }

            const data = response || [];
            const total = Array.isArray(data) ? data.length : 0;
            const nextOffset = offset + limit;
            return {
                data: Array.isArray(data) ? data : [],
                total,
                next: nextOffset < total,
                prev: offset > 0,
                offset,
                limit
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createFabricDispatch POST API call
export const createFabricDispatch: any = createAsyncThunk(
    'fabric-dispatch/createFabricDispatch',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/fabric-dispatch", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === 'success') {
                toast.success(response?.message);
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
                                    const errorMessage = resolveApiErrorMessage(error, "Failed to create Process issue");
                                    toast.error(errorMessage);
                                    return thunkAPI.rejectWithValue(errorMessage);
                                }
    }
);


export const updateFabricDispatch: any = createAsyncThunk(
    'fabric-dispatch/updateFabricDispatch',
    async ({ id, data, processType }: { id: number, data: any, processType?: string }, thunkAPI) => {
        try {
            const companyId = getSelectedCompanyId();
            if (!companyId) {
                throw new Error('Please select a company');
            }
            const normalizedType = processType ? processType.toUpperCase() : '';
            const endpoint = normalizedType
                ? `/fabric-dispatch/type/${normalizedType}/company/${companyId}/${id}`
                : `/fabric-dispatch/company/${companyId}/${id}`;

            const response = await apiService.put(endpoint, data);
            const payload = response?.data ?? response;

            if (!response || response?.status === 'success') {
                if (response?.message) {
                    toast.success(response.message);
                }
                return payload;
            }

            const errorMessage = response?.message || 'Something went wrong';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            const message = error?.message || 'Update failed';
            toast.error(message);
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const deleteFabricDispatch: any = createAsyncThunk(
    'fabric-dispatch/deleteFabricDispatch',
    async ({ id, processType }: { id: number, processType: string }, thunkAPI) => {
        try {
            const companyId = getSelectedCompanyId();
            if (!companyId) {
                throw new Error('Please select a company');
            }
            const normalizedType = processType?.toUpperCase();
            const response = await apiService.delete(`/fabric-dispatch/type/${normalizedType}/company/${companyId}/${id}`);
            if (!response || response?.status === 'success') {
                toast.success(response?.message || 'Deleted successfully');
                return { id };
            }
            const errorMessage = response?.message || 'Something went wrong';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred while deleting';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


// Create fabricDispatchDyeingSlice
const fabricDispatchDyeingSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllFabricDispatch (GET request)
            .addCase(getAllFabricDispatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllFabricDispatch.fulfilled, (state: any, action) => {
                state.loading = false;
                const { data, total, next, prev, offset, limit } = action.payload;
                state.fabricDispatchDyingList = Array.isArray(data) ? data : [];
                state.paginationInfo = { total, next, prev, offset, limit };
            })
            .addCase(getAllFabricDispatch.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createFabricDispatch (POST request)
            .addCase(createFabricDispatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createFabricDispatch.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createResul = action.payload;
            })
            .addCase(createFabricDispatch.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateFabricDispatch (PUT request)
            .addCase(updateFabricDispatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateFabricDispatch.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload?.data ?? action.payload;
                if (!updatedTable?.id) {
                    return;
                }
                state.fabricDispatchDyingList = state.fabricDispatchDyingList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateFabricDispatch.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteFabricDispatch (DELETE request)
            .addCase(deleteFabricDispatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteFabricDispatch.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload?.id ?? action.meta?.arg?.id;
                if (!deletedId) {
                    return;
                }
                state.fabricDispatchDyingList = state.fabricDispatchDyingList.filter(
                    (so: any) => so.id !== deletedId
                );
            })
            .addCase(deleteFabricDispatch.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default fabricDispatchDyeingSlice.reducer;