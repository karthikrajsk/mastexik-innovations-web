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
    processContractList: any;
    paginationInfo: PaginationInfo;
    createDyeingWorkOrderResult: any;
    checking: boolean,
}

const initialState: ApiState = {
    loading: false,
    error: null,
    processContractList: [],
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    },
    createDyeingWorkOrderResult: null,
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

// Thunk for getAllDyeingWorkOrders GET API call
export const getAllDyeingWorkOrders = createAsyncThunk(
    'dyeing-work-orders/getAllDyeingWorkOrders',
    async (params: { offset?: number; limit?: number; fetchAll?: boolean } = {}, thunkAPI) => {
        try {
            const companyId = getSelectedCompanyId();
            if (!companyId) {
                throw new Error('Please select a company');
            }
            const offset = params.fetchAll ? 0 : (params.offset ?? 0);
            const limit = params.fetchAll ? 10000 : (params.limit ?? 10000);

            const response = await apiService.get(`/dyeing-work-orders/company/${companyId}`, { offset, limit });

            if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                const paginationData = response.data;
                return {
                    data: paginationData.data || [],
                    total: paginationData.total || 0,
                    next: paginationData.next || false,
                    prev: paginationData.prev || false,
                    offset: paginationData.offset || offset,
                    limit: paginationData.limit || limit
                };
            }

            if (Array.isArray(response?.data)) {
                return {
                    data: response.data,
                    total: response.total || 0,
                    next: response.next || false,
                    prev: response.prev || false,
                    offset: response.offset || offset,
                    limit: response.limit || limit
                };
            }

            if (Array.isArray(response)) {
                return {
                    data: response,
                    total: response.length,
                    next: false,
                    prev: false,
                    offset,
                    limit
                };
            }

            const list = response?.data?.data ?? [];
            return {
                data: Array.isArray(list) ? list : [],
                total: list.length,
                next: false,
                prev: false,
                offset,
                limit
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);


// Add this thunk to your existing processContractSlice
export const getAllDyeingWorkOrdersByType = createAsyncThunk(
    'processContract/getAllByType',
    async (params: { type: string; offset?: number; limit?: number ;fetchAll?:boolean }, thunkAPI) => {
        try {
            let processType: string;
            let offset: number | undefined;
            let limit: number | undefined;

            if (typeof params === 'string') {
                processType = params;
            } else {
                processType = params.type;
                offset = params.offset;
                limit = params.limit;
            }

            const companyId = getSelectedCompanyId();
            if (!companyId) {
                throw new Error('Please select a company');
            }

            const normalizedType = processType?.toUpperCase();
            const queryParams: Record<string, number> = {};
            if (offset !== undefined) queryParams.offset = offset;
            if (limit !== undefined) queryParams.limit = limit;
            const response = await apiService.get(`/dyeing-work-orders/type/${normalizedType}/company/${companyId}`, queryParams);

            if (response?.data) {
                const list = response.data?.data ?? response.data ?? [];
                return {
                    data: Array.isArray(list) ? list : [],
                    total: response.total || list.length,
                    limit: response.limit || limit || 10,
                    offset: response.offset || offset || 0,
                    next: response.next,
                    prev: response.prev,
                };
            } else {
                const list = Array.isArray(response) ? response : [];
                return {
                    data: list,
                    total: list.length,
                    limit: limit || 10,
                    offset: offset || 0,
                };
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createDyeingWorkOrder POST API call
export const createDyeingWorkOrder: any = createAsyncThunk(
    'dyeing-work-orders/createDyeingWorkOrder',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/dyeing-work-orders", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === 'success') {
                toast.success(response?.message);
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        }catch (error: any) {
                            const errorMessage = resolveApiErrorMessage(error, "Failed to create Dyeing work order");
                            toast.error(errorMessage);
                            return thunkAPI.rejectWithValue(errorMessage);
                        }
    }
);


export const updateDyeingWorkOrder: any = createAsyncThunk(
    'dyeing-work-orders/updateDyeingWorkOrder',
    async ({ id, data, processType }: { id: number, data: any, processType?: string }, thunkAPI) => {
        try {
            const companyId = getSelectedCompanyId();
            if (!companyId) {
                throw new Error('Please select a company');
            }
            const normalizedType = processType ? processType.toUpperCase() : '';
            const endpoint = normalizedType
                ? `/dyeing-work-orders/type/${normalizedType}/company/${companyId}/${id}`
                : `/dyeing-work-orders/company/${companyId}/${id}`;

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

export const deleteDyeingWorkOrder: any = createAsyncThunk(
    'dyeing-work-orders/deleteDyeingWorkOrder',
    async ({ id, processType }: { id: number, processType: string }, thunkAPI) => {
        try {
            const companyId = getSelectedCompanyId();
            if (!companyId) {
                throw new Error('Please select a company');
            }
            const normalizedType = processType?.toUpperCase();
            const response = await apiService.delete(`/dyeing-work-orders/type/${normalizedType}/company/${companyId}/${id}`);
            if (!response || response?.status === 'success') {
                toast.success(response?.message || 'Dyeing Work Order deleted successfully.');
                return { id };
            }
            const errorMessage = response?.message || 'Something went wrong';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            // const errorMessage = error.response?.data?.message || error.message || 'An error occurred while deleting';
             const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred while deleting';

            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


// Create dyeingWorkOrdeSlice
const dyeingWorkOrdeSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllDyeingWorkOrders (GET request)
            .addCase(getAllDyeingWorkOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllDyeingWorkOrders.fulfilled, (state: any, action) => {
                state.loading = false;
                const { data, total, next, prev, offset, limit } = action.payload;
                state.processContractList = Array.isArray(data) ? data : [];
                state.paginationInfo = { total, next, prev, offset, limit };
            })
            .addCase(getAllDyeingWorkOrders.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(getAllDyeingWorkOrdersByType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllDyeingWorkOrdersByType.fulfilled, (state: any, action) => {
                state.loading = false;
                const { data, total, next, prev, offset, limit } = action.payload;
                state.processContractList = Array.isArray(data) ? data : [];
                state.paginationInfo = {
                    total: total ?? state.paginationInfo.total,
                    next: next ?? false,
                    prev: prev ?? false,
                    offset: offset ?? 0,
                    limit: limit ?? state.paginationInfo.limit,
                };
            })
            .addCase(getAllDyeingWorkOrdersByType.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createDyeingWorkOrder (POST request)
            .addCase(createDyeingWorkOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createDyeingWorkOrder.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createDyeingWorkOrderResult = action.payload;
            })
            .addCase(createDyeingWorkOrder.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateDyeingWorkOrder (PUT request)
            .addCase(updateDyeingWorkOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateDyeingWorkOrder.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload?.data ?? action.payload;
                if (!updatedTable?.id) {
                    return;
                }
                state.processContractList = state.processContractList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateDyeingWorkOrder.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteDyeingWorkOrder (DELETE request)
            .addCase(deleteDyeingWorkOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteDyeingWorkOrder.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload?.id ?? action.meta?.arg?.id;
                if (!deletedId) {
                    return;
                }
                state.processContractList = state.processContractList.filter(
                    (so: any) => so.id !== deletedId
                );
            })
            .addCase(deleteDyeingWorkOrder.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default dyeingWorkOrdeSlice.reducer;