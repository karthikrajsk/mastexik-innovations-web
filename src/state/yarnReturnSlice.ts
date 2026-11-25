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

export interface YarnReturnState {
    loading: boolean;
    error: string | null;
    yarnReturnList: any[];
    paginationInfo: PaginationInfo;
    createYarnReturnResult: any;
}

const initialState: YarnReturnState = {
    loading: false,
    error: null,
    yarnReturnList: [],
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    },
    createYarnReturnResult: null,
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

const normalizePaginatedResponse = (response: any, offset: number, limit: number) => {
    const baseMeta = {
        total: 0,
        next: false,
        prev: false,
        offset,
        limit
    };
    if (!response) {
        return { data: [], ...baseMeta };
    }
    const container = typeof response?.data === "object" && !Array.isArray(response?.data) && response?.data !== null
        ? response.data
        : response;
    const list = Array.isArray(container?.data)
        ? container.data
        : Array.isArray(container?.content)
            ? container.content
            : Array.isArray(container?.results)
                ? container.results
                : Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(container)
                        ? container
                        : [];
    const metaSource = typeof container === "object" && !Array.isArray(container) && container !== null ? container : {};
    return {
        data: list,
        total: metaSource.total ?? list.length ?? 0,
        next: metaSource.next ?? false,
        prev: metaSource.prev ?? false,
        offset: metaSource.offset ?? offset,
        limit: metaSource.limit ?? limit
    };
};

const extractEntity = (response: any) => response?.data ?? response;

// Thunk for getAllYarnReturns GET API call
export const getAllYarnReturns = createAsyncThunk(
    'yarn-return/getAllYarnReturns',
    async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
        try {
            const fetchAll = params.fetchAll ?? false;
            const offset = fetchAll ? 0 : (params.offset ?? 0);
            const limit = fetchAll ? 10000 : (params.limit ?? 10000);
            const companyId = params.companyId ?? getSelectedCompanyId();
            const endpoint = companyId ? `/yarn-return/company/${companyId}` : "/yarn-return";
            const response = await apiService.get(endpoint, { offset, limit });
            return normalizePaginatedResponse(response, offset, limit);
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createYarnReturn POST API call
export const createYarnReturn = createAsyncThunk(
    'yarn-return/createYarnReturn',
    async (params: any, thunkAPI) => {
        try {
            const companyId = params?.companyId ?? getSelectedCompanyId();
            const payload = {
                ...params,
                companyId
            };
            const response = await apiService.post("/yarn-return", payload);
            const entity = extractEntity(response);
            if (entity) {
                toast.success("Yarn Return Saved Successfully!");
                return entity;
            }
            const errorMessage = "Failed to create yarn return";
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
                                                    const errorMessage = resolveApiErrorMessage(error, "Failed to create purchase inward");
                                                    toast.error(errorMessage);
                                                    return thunkAPI.rejectWithValue(errorMessage);
                                                }
    }
);

// Thunk for updateYarnReturn PUT API call
export const updateYarnReturn = createAsyncThunk(
    'yarn-return/updateYarnReturn',
    async (params: any, thunkAPI) => {
        try {
            const id = params?.id;
            if (!id) {
                const errorMessage = "Missing yarn return id";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
            const companyId = params?.companyId ?? getSelectedCompanyId();
            const endpoint = companyId ? `/yarn-return/company/${companyId}/${id}` : `/yarn-return/${id}`;
            const payload = {
                ...params,
                companyId
            };
            const response = await apiService.put(endpoint, payload);
            if (response?.status === 'success') {
                toast.success(response?.message || "Yarn Return updated successfully");
                return extractEntity(response);
            }
            const entity = extractEntity(response);
            if (entity) {
                toast.success("Yarn Return updated successfully");
                return entity;
            }
            const errorMessage = response?.message || "Something went wrong";
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            toast.error(error.message || "Error updating yarn return");
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for deleteYarnReturn DELETE API call
export const deleteYarnReturn = createAsyncThunk(
    'yarn-return/deleteYarnReturn',
    async (arg: number | { id: number; companyId?: number }, thunkAPI) => {
        try {
            const normalized = typeof arg === 'number' ? { id: arg } : arg;
            const companyId = normalized.companyId ?? getSelectedCompanyId();
            const endpoint = companyId ? `/yarn-return/company/${companyId}/${normalized.id}` : `/yarn-return/${normalized.id}`;
            const response = await apiService.delete(endpoint);
            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return { id: normalized.id };
            }
            const errorMessage = response?.message || 'Failed to delete';
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

// Create yarnReturnSlice
const yarnReturnSlice = createSlice({
    name: "yarnReturn",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Handle getAllYarnReturns
            .addCase(getAllYarnReturns.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllYarnReturns.fulfilled, (state: any, action) => {
                state.loading = false;
                const { data, total, next, prev, offset, limit } = action.payload;
                state.yarnReturnList = Array.isArray(data) ? data : [];
                state.paginationInfo = { total, next, prev, offset, limit };
            })
            .addCase(getAllYarnReturns.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle createYarnReturn
            .addCase(createYarnReturn.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createYarnReturn.fulfilled, (state, action) => {
                state.loading = false;
                const created = action.payload;
                state.createYarnReturnResult = created;
                if (created) {
                    state.yarnReturnList = [created, ...state.yarnReturnList];
                }
            })
            .addCase(createYarnReturn.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle updateYarnReturn
            .addCase(updateYarnReturn.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateYarnReturn.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedYarnReturn = action.payload;
                state.yarnReturnList = state.yarnReturnList.map((yr: any) =>
                    yr.id === updatedYarnReturn.id ? updatedYarnReturn : yr
                );
            })
            .addCase(updateYarnReturn.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) ?? action.error?.message ?? null;
            })

            // Handle deleteYarnReturn
            .addCase(deleteYarnReturn.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteYarnReturn.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload?.id ?? action.payload;
                state.yarnReturnList = state.yarnReturnList.filter(
                    (yr: any) => yr.id !== deletedId
                );
            })
            .addCase(deleteYarnReturn.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })
    },
});

// Export reducer
export default yarnReturnSlice.reducer;