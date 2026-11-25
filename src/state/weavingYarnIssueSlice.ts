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
    weavingYarnIssuetList: any;
    createWeavingYarnIssuetResult: any;
    yarnInwardStockList: any;
    checking: boolean;
    paginationInfo: PaginationInfo;   // ⬅ added
}

const initialState: ApiState = {
    loading: false,
    error: null,
    weavingYarnIssuetList: [],
    createWeavingYarnIssuetResult: null,
    yarnInwardStockList: [],
    checking: false,
    paginationInfo: {       // ⬅ added default pagination
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10,
    }
};


// export interface ApiState {
//     loading: boolean;
//     error: string | null;
//     weavingYarnIssuetList: any;
//     createWeavingYarnIssuetResult: any;
//     yarnInwardStockList: any;
//     checking: boolean,
// }

// const initialState: ApiState = {
//     loading: false,
//     error: null,
//     weavingYarnIssuetList: [],
//     createWeavingYarnIssuetResult: null,
//     yarnInwardStockList: [],
//     checking: false,
// };

export const getAllWeavingYarnIssue = createAsyncThunk(
    'weaving-yarn-issues/getAllWeavingYarnIssue',
    async (
        params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {},
        thunkAPI
    ) => {
        try {
            const fetchAll = params.fetchAll ?? true;
            const offset = fetchAll ? 0 : params.offset ?? 0;
            const limit = fetchAll ? 10000 : params.limit ?? 10000;
            const companyId = params.companyId;

            const queryParams = new URLSearchParams();
            queryParams.append("offset", String(offset));
            queryParams.append("limit", String(limit));

            let endpoint = companyId
                ? `/weaving-yarn-issues/company/${companyId}`
                : `/weaving-yarn-issues`;

            const qs = queryParams.toString();
            if (qs) endpoint += `?${qs}`;

            const response = await apiService.get(endpoint);

            const normalized = normalizePaginationResponse(response, offset, limit);

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


// Thunk for createWeavingYarnIssue POST API call
export const createWeavingYarnIssue: any = createAsyncThunk(
    'weaving-yarn-issues/createWeavingYarnIssue',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/weaving-yarn-issues", params); // Adjust API endpoint if needed
            console.log(response)
            if (response) {
                toast.success("Saved Successfully!");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
                const errorMessage = resolveApiErrorMessage(error, "Failed to create weaving yarn issue");
                                    toast.error(errorMessage);
                                    return thunkAPI.rejectWithValue(errorMessage);
            // const errorMessage = error?.message || "Failed to save";
            // toast.error(errorMessage);
            // return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const updateWeavingYarnIssue: any = createAsyncThunk(
    'weaving-contracts/updateWeavingYarnIssue',
    async ({ id, data, companyId }: { id: number, data: any, companyId?: number }, thunkAPI) => {
        try {
            console.log("Update Weaving Contract Data:", data);
            let endpoint = `/weaving-yarn-issues/${id}`;
            if (companyId) {
                endpoint = `/weaving-yarn-issues/company/${companyId}/${id}`;
            }
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
             const errorMessage = resolveApiErrorMessage(error, "Failed to create weaving yarn issue");
                                    toast.error(errorMessage);
                                    return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// const extractErrorMessage = (error: any) =>
//     error?.response?.data?.message ||
//     error?.response?.data?.error ||
//     error?.message ||
//     'Failed to delete category';


// export const deleteWeavingYarnIssue: any = createAsyncThunk(
//     'weaving-yarn-issues/deleteWeavingYarnIssue',
//     async ({ id, companyId }: { id: number, companyId?: number }, thunkAPI) => {
//         try {
//             let endpoint = `/weaving-yarn-issues/${id}`;
//             if (companyId) {
//                 endpoint = `/weaving-yarn-issues/company/${companyId}/${id}`;
//             }
//             const response = await apiService.delete(endpoint);
//              if (response?.status === 'success') {
//                 toast.success("Successfully deleted");
//                 return { id };
//             }

//             const errorMessage = response?.data?.data?.message || 'Failed to delete category';
//             toast.error(errorMessage);
//             return thunkAPI.rejectWithValue(errorMessage);
//         } catch (error: any) {
//             const message = error?.message || 'Failed to delete category';
//             toast.error(message);
//             return thunkAPI.rejectWithValue(message);
//         }
//     }
// );
const extractErrorMessage = (error: any) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Failed to delete category';

export const deleteWeavingYarnIssue = createAsyncThunk(
    'weaving-yarn-issues/deleteWeavingYarnIssue',
    async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
        try {
            const endpoint = companyId
                ? `/weaving-yarn-issues/company/${companyId}/${id}`
                : `/weaving-yarn-issues/${id}`;
            const response = await apiService.delete(endpoint);
            if (response?.status === 'success') {
                toast.success('Successfully deleted');
                return { id };
            }
            const errorMessage = extractErrorMessage(response);
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            const message = extractErrorMessage(error);
            toast.error(message);
            return thunkAPI.rejectWithValue(message);
        }
    }
);


const normalizePaginationResponse = (
    response: any,
    fallbackOffset: number,
    fallbackLimit: number
) => {
    if (response?.data && typeof response.data === "object" && !Array.isArray(response.data)) {
        const p = response.data;

        const list = Array.isArray(p.data)
            ? p.data
            : Array.isArray(p.items)
                ? p.items
                : [];

        return {
            data: list,
            total: p.total ?? p.count ?? p.pagination?.total ?? list.length,
            next: p.next ?? p.pagination?.next ?? false,
            prev: p.prev ?? p.pagination?.prev ?? fallbackOffset > 0,
            offset: p.offset ?? p.pagination?.offset ?? fallbackOffset,
            limit: p.limit ?? p.pagination?.limit ?? fallbackLimit
        };
    }

    if (Array.isArray(response?.data)) {
        return {
            data: response.data,
            total: response.total ?? response.data.length,
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


// Create weavingYarnIssueSlice
const weavingYarnIssueSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllWeavingYarnIssue (GET request)
            .addCase(getAllWeavingYarnIssue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllWeavingYarnIssue.fulfilled, (state: any, action) => {
                state.loading = false;

                const payload = action.payload;

                if (payload && Array.isArray(payload.data)) {
                    state.weavingYarnIssuetList = payload.data;
                    state.paginationInfo = {
                        total: payload.total,
                        next: payload.next,
                        prev: payload.prev,
                        offset: payload.offset,
                        limit: payload.limit
                    };
                } else {
                    state.weavingYarnIssuetList = [];
                    state.paginationInfo = {
                        ...state.paginationInfo,
                        total: 0,
                        next: false,
                        prev: false,
                        offset: 0
                    };
                }
            })
            .addCase(getAllWeavingYarnIssue.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createWeavingYarnIssue (POST request)
            .addCase(createWeavingYarnIssue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createWeavingYarnIssue.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createWeavingYarnIssuetResult = action.payload;
            })
            .addCase(createWeavingYarnIssue.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteWeavingYarnIssue (DELETE request)
            .addCase(deleteWeavingYarnIssue.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteWeavingYarnIssue.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.weavingYarnIssuetList = state.weavingYarnIssuetList.filter(
                    (item: any) => item.id !== deletedId
                );
                state.paginationInfo.total = Math.max(0, state.paginationInfo.total - 1);
            })
            .addCase(deleteWeavingYarnIssue.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default weavingYarnIssueSlice.reducer;
