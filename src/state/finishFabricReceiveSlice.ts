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
    finishFabricReceiveList: any[];
    paginationInfo: PaginationInfo;
    refTypeList: any[];
    outwardTypeList: any[];
    createFinishFabricReceiveResult: any;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    finishFabricReceiveList: [],
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    },
    refTypeList: [],
    outwardTypeList: [],
    createFinishFabricReceiveResult: null,
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
    if (typeof window === "undefined") {
        return null;
    }
    const stored = window.localStorage.getItem("selectedCompanyId") ?? window.localStorage.getItem("selectedCompany");
    return stored ? Number(stored) : null;
};

const normalizeResponse = (
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
                : Array.isArray(payload.content)
                    ? payload.content
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

const extractList = (response: any) => {
    if (!response) {
        return [];
    }
    if (Array.isArray(response)) {
        return response;
    }
    if (Array.isArray(response?.data)) {
        return response.data;
    }
    if (Array.isArray(response?.content)) {
        return response.content;
    }
    if (Array.isArray(response?.results)) {
        return response.results;
    }
    return [];
};

const extractEntity = (response: any) => response?.data ?? response;

type FinishFabricReceiveQueryParams = {
    offset?: number;
    limit?: number;
    fetchAll?: boolean;
    companyId?: number;
    [key: string]: any;
};

type FinishFabricReceiveTypeParams = FinishFabricReceiveQueryParams & {
    processType?: string;
};

// Get all finish fabric receives
export const getAllFinishFabricReceive = createAsyncThunk(
    'finish-fabric-receives/getAllFinishFabricReceive',
    async (params: number | FinishFabricReceiveQueryParams | undefined, thunkAPI) => {
        try {
            const normalizedParams: FinishFabricReceiveQueryParams =
                typeof params === 'number' ? { companyId: params } : (params ?? {});
            const companyId = normalizedParams.companyId ?? getSelectedCompanyId();
            const offset = normalizedParams.fetchAll ? 0 : normalizedParams.offset ?? 0;
            const limit = normalizedParams.fetchAll ? 10000 : normalizedParams.limit ?? 10;
            const url = companyId ? `/finish-fabric-receives/company/${companyId}` : "/finish-fabric-receives";
            const response = await apiService.get(url, { offset, limit });
            return normalizeResponse(response, offset, limit);
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Get finish fabric receives by type (company-scoped via company endpoint + client filter)
export const getAllFinishFabricReceivesByType = createAsyncThunk(
    'finishFabricReceive/getAllByType',
    async (arg: string | FinishFabricReceiveTypeParams | undefined, thunkAPI) => {
        try {
            const options: FinishFabricReceiveTypeParams = typeof arg === 'string' ? { processType: arg } : (arg ?? {});
            const processType = (options.processType ?? 'FABRIC').toUpperCase();
            const companyId = options.companyId ?? getSelectedCompanyId();
            const offset = options.fetchAll ? 0 : options.offset ?? 0;
            const limit = options.fetchAll ? 10000 : options.limit ?? 10;
            const url = companyId
                ? `/finish-fabric-receives/type/${processType}/company/${companyId}`
                : `/finish-fabric-receives/type/${processType}`;
            const response = await apiService.get(url, { offset, limit });
            return normalizeResponse(response, offset, limit);
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Get outward by ref type
export const getAllOutwardByRefType = createAsyncThunk(
    "finish-fabric-receives/getAllOutwardByRefType",
    async (outwardType: string, thunkAPI) => {
        try {
            const response = await apiService.get(`/outwards/type/${outwardType}`);
            return response || [];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Get outward details by ID
export const getOutwardDetailsById = createAsyncThunk(
    'finish-fabric-receives/getOutwardDetailsById',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.get(`/outwards/${id}`);
            return response || { data: [], message: "", status: "success" };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Create finish fabric receive
export const createFinishFabricReceive = createAsyncThunk(
    'finish-fabric-receives/createFinishFabricReceive',
    async (params: any, thunkAPI) => {
        try {
            const payload = {
                ...params,
                processType: (params?.processType ?? 'FABRIC').toUpperCase()
            };
            const response = await apiService.post("/finish-fabric-receives", payload);
            if (response) {
                toast.success("Saved Successfully!");
                return extractEntity(response);
            } else {
                const errorMessage = "Failed to create finish fabric receive";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        }  catch (error: any) {
                                            const errorMessage = resolveApiErrorMessage(error, "Failed to create finish fabric receive");
                                            toast.error(errorMessage);
                                            return thunkAPI.rejectWithValue(errorMessage);
                                        }
            }
    
);

// Update finish fabric receive
export const updateFinishFabricReceive = createAsyncThunk(
    'finish-fabric-receives/updateFinishFabricReceive',
    async (params: any, thunkAPI) => {
        try {
            const id = params?.id;
            const processType = (params?.processType ?? 'FABRIC').toUpperCase();
            const companyId = params?.companyId ?? getSelectedCompanyId();
            let url = `/finish-fabric-receives/${id}`;
            if (companyId && params?.processType) {
                url = `/finish-fabric-receives/type/${processType}/company/${companyId}/${id}`;
            } else if (companyId) {
                url = `/finish-fabric-receives/${id}/company/${companyId}`;
            }
            const payload = {
                ...params,
                processType
            };
            const response = await apiService.put(url, payload);
            if (response) {
                toast.success("Updated Successfully!");
                return extractEntity(response);
            } else {
                const errorMessage = "Failed to update";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            toast.error(error.message || "Error updating finish fabric receive");
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Delete finish fabric receive
export const deleteFinishFabricReceive = createAsyncThunk(
    'finish-fabric-receives/deleteFinishFabricReceive',
    async (arg: number | { id: number; companyId?: number; processType?: string }, thunkAPI) => {
        try {
            const normalizedArg: { id: number; companyId?: number; processType?: string } = typeof arg === 'number' ? { id: arg } : arg;
            const { id, companyId: providedCompanyId, processType } = normalizedArg;
            const companyId = providedCompanyId ?? getSelectedCompanyId();
            const normalizedType = processType ? processType.toUpperCase() : undefined;
            let url = `/finish-fabric-receives/${id}`;
            if (companyId && normalizedType) {
                url = `/finish-fabric-receives/type/${normalizedType}/company/${companyId}/${id}`;
            } else if (companyId) {
                url = `/finish-fabric-receives/${id}/company/${companyId}`;
            }
            await apiService.delete(url);
            toast.success("Successfully deleted");
            return { id };
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

// Create slice
const finishFabricReceivesSlice = createSlice({
    name: "finishFabricReceives",
    initialState,
    reducers: {
        clearCreateResult: (state) => {
            state.createFinishFabricReceiveResult = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Get all
            .addCase(getAllFinishFabricReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllFinishFabricReceive.fulfilled, (state, action) => {
                state.loading = false;
                const { data, total, next, prev, offset, limit } = action.payload;
                state.finishFabricReceiveList = Array.isArray(data) ? data : [];
                state.paginationInfo = { total, next, prev, offset, limit };
            })
            .addCase(getAllFinishFabricReceive.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Get by type
            .addCase(getAllFinishFabricReceivesByType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllFinishFabricReceivesByType.fulfilled, (state, action) => {
                state.loading = false;
                const { data, total, next, prev, offset, limit } = action.payload;
                state.finishFabricReceiveList = Array.isArray(data) ? data : [];
                state.paginationInfo = { total, next, prev, offset, limit };
            })
            .addCase(getAllFinishFabricReceivesByType.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Get outward by ref type
            .addCase(getAllOutwardByRefType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllOutwardByRefType.fulfilled, (state, action) => {
                state.loading = false;
                state.refTypeList = action.payload;
            })
            .addCase(getAllOutwardByRefType.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Get outward details by ID
            .addCase(getOutwardDetailsById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getOutwardDetailsById.fulfilled, (state, action) => {
                state.loading = false;
                state.outwardTypeList = action.payload;
            })
            .addCase(getOutwardDetailsById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Create
            .addCase(createFinishFabricReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createFinishFabricReceive.fulfilled, (state, action) => {
                state.loading = false;
                const createdItem = action.payload?.data ?? action.payload;
                state.createFinishFabricReceiveResult = createdItem ?? action.payload;
                if (createdItem) {
                    state.finishFabricReceiveList.unshift(createdItem);
                }
            })
            .addCase(createFinishFabricReceive.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Update
            .addCase(updateFinishFabricReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateFinishFabricReceive.fulfilled, (state, action) => {
                state.loading = false;
                const updatedItem = action.payload?.data ?? action.payload;
                const updatedId = updatedItem?.id ?? action.meta?.arg?.id;
                if (!updatedId) {
                    return;
                }
                state.finishFabricReceiveList = state.finishFabricReceiveList.map((item: any) =>
                    item.id === updatedId ? { ...item, ...updatedItem } : item
                );
            })
            .addCase(updateFinishFabricReceive.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Delete
            .addCase(deleteFinishFabricReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteFinishFabricReceive.fulfilled, (state, action) => {
                state.loading = false;
                const deletedId = action.payload?.id ?? action.payload;
                state.finishFabricReceiveList = state.finishFabricReceiveList.filter(
                    (item: any) => item.id !== deletedId
                );
            })
            .addCase(deleteFinishFabricReceive.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCreateResult } = finishFabricReceivesSlice.actions;
export default finishFabricReceivesSlice.reducer;