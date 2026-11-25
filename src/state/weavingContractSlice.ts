import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { json } from "stream/consumers";
import { resolveCompanyId } from "@/hooks/useCompanyContext";

export interface YarnRequirement {
    id?: number;
    yarnId?: number;
    yarnType: string;
    yarnCount: string;
    gramsPerMeter: number;
    totalWeavingOrderQty: number;
    totalRequiredQty: number;
    totalAvailableQty: number;
    activeFlag: boolean;
}


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
    weavingContractList: any;
    createWeavingContractResult: any;
    getWeavingContractByIdList: any;
    lotEntriesList: any;
    checking: boolean;
    submissionSuccess: boolean;
    paginationInfo: PaginationInfo;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    weavingContractList: [],
    getWeavingContractByIdList: [],
    lotEntriesList: [],
    createWeavingContractResult: null,
    checking: false,
    submissionSuccess: false,
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    }
};

const normalizeWeavingContractResponse = (
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

const buildYarnAvailabilityUrl = (yarnId: number) => {
    const companyId = resolveCompanyId();
    if (companyId === null) {
        return `/yarn-inward-stock/available-qty/${yarnId}`;
    }
    return `/yarn-inward-stock/available-qty/${yarnId}/${companyId}`;
};

// Thunk for getAllWeavingContract GET API call with pagination support
export const getAllWeavingContract = createAsyncThunk(
    'weaving-contracts/getAllWeavingContract',
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
            queryParams.append('offset', String(offset));
            queryParams.append('limit', String(limit));

            const basePath = companyId != null
                ? `/weaving-contracts/company/${companyId}`
                : `/weaving-contracts`;

            const response = await apiService.get(`${basePath}?${queryParams.toString()}`);
            const normalized = normalizeWeavingContractResponse(response, offset, limit);

            return {
                data: normalized.data,
                total: normalized.total,
                next: normalized.next,
                prev: normalized.prev,
                offset: normalized.offset,
                limit: normalized.limit,
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for getAllLotEntries GET API call
export const getAllLotEntries = createAsyncThunk(
    'lot_entry/getAllLotEntries',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.get("/lot-entries"); // Adjust API endpoint if needed
            console.log(response)
            const data = response;
            return data || [];
        } catch (error: any) {
            // Handle errors and reject with error message
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for getWeavingContractById
export const getWeavingContractById = createAsyncThunk(
    'weaving-contracts/getWeavingContractById',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.get(`/weaving-contracts/${id}`);
            console.log("API Response:", response);
            return response || { data: [], message: "", status: "success" };
        } catch (error: any) {
            console.error("API Error:", error);
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);


export const createWeavingContract:any = createAsyncThunk(
  "weaving-contracts/createWeavingContract",
  async (params:any, thunkAPI) => {
    try {
      const response = await apiService.post("/weaving-contracts", params);
      toast.success("Weaving Contract Saved Successfully!");
      return response;
    } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to create weaving contract");
                                toast.error(errorMessage);
                                return thunkAPI.rejectWithValue(errorMessage);
    
    }
  }
);


export const updateWeavingContract: any = createAsyncThunk(
    'weaving-contracts/updateWeavingContract',
    async ({ id, data, companyId }: { id: number, data: any, companyId?: number }, thunkAPI) => {
        try {
            console.log("Update Weaving Contract Data:", data);
            const url = companyId != null
                ? `/weaving-contracts/company/${companyId}/${id}`
                : `/weaving-contracts/${id}`;
            const response = await apiService.put(url, data);

            if (response) {
                toast.success("Weaving Contract updated successfully!");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to create weaving contract");
                                toast.error(errorMessage);
                                return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


export const deleteContract = createAsyncThunk(
    'weaving-contracts/deleteContract',
    async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
        try {
            const url = companyId != null
                ? `/weaving-contracts/company/${companyId}/${id}`
                : `/weaving-contracts/${id}`;
            const response = await apiService.delete(url);

            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return { id };
            }

            const errorMessage = response?.data?.data?.message || 'Failed to delete category';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);

        } catch (error: any) {
            let errorMessage = 'An error occurred while deleting the category';

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

export const getYarnRequirementsWithAvailability = createAsyncThunk<
    YarnRequirement[],
    { fabricId: number; totalWeavingQty: number; warpDetails: any[]; weftDetails: any[] }
>(
    'weaving-contracts/getYarnRequirementsWithAvailability',
    async (params: { fabricId: number; totalWeavingQty: number; warpDetails: any[]; weftDetails: any[] }, thunkAPI) => {
        try {
            const { totalWeavingQty, warpDetails, weftDetails } = params;
            const yarns: YarnRequirement[] = [];

            if (warpDetails?.length) {
                for (const warp of warpDetails) {
                    try {
                        const [availQtyResponse, yarnResponse] = await Promise.all([
                            apiService.get(buildYarnAvailabilityUrl(warp.yarnId)),
                            apiService.get(`/yarn/${warp.yarnId}`)
                        ]);
                        const availQty = Number(availQtyResponse?.data ?? availQtyResponse ?? 0);
                        const yarnData = yarnResponse.data || yarnResponse || {};
                        const yarnCount = yarnData.yarnName || `Yarn ${warp.yarnId}`;
                        
                        yarns.push({
                            yarnId: warp.yarnId,
                            yarnType: 'Warp',
                            yarnCount,
                            gramsPerMeter: Number(warp.gramsPerMeter || 0),
                            totalWeavingOrderQty: totalWeavingQty,
                            totalRequiredQty: totalWeavingQty * Number(warp.gramsPerMeter || 0),
                            totalAvailableQty: availQty,
                            activeFlag: true
                        });
                    } catch (error) {
                        console.error(`Error fetching yarn data for warp yarn ${warp.yarnId}:`, error);
                        yarns.push({
                            yarnId: warp.yarnId,
                            yarnType: 'Warp',
                            yarnCount: `Yarn ${warp.yarnId}`,
                            gramsPerMeter: Number(warp.gramsPerMeter || 0),
                            totalWeavingOrderQty: totalWeavingQty,
                            totalRequiredQty: totalWeavingQty * Number(warp.gramsPerMeter || 0),
                            totalAvailableQty: 0,
                            activeFlag: true
                        });
                    }
                }
            }

            if (weftDetails?.length) {
                for (const weft of weftDetails) {
                    try {
                        const [availQtyResponse, yarnResponse] = await Promise.all([
                            apiService.get(buildYarnAvailabilityUrl(weft.yarnId)),
                            apiService.get(`/yarn/${weft.yarnId}`)
                        ]);
                        const availQty = Number(availQtyResponse?.data ?? availQtyResponse ?? 0);
                        const yarnData = yarnResponse.data || yarnResponse || {};
                        const yarnCount = yarnData.yarnName || `Yarn ${weft.yarnId}`;
                        
                        yarns.push({
                            yarnId: weft.yarnId,
                            yarnType: 'Weft',
                            yarnCount,
                            gramsPerMeter: Number(weft.gramsPerMeter || 0),
                            totalWeavingOrderQty: totalWeavingQty,
                            totalRequiredQty: totalWeavingQty * Number(weft.gramsPerMeter || 0),
                            totalAvailableQty: availQty,
                            activeFlag: true
                        });
                    } catch (error) {
                        console.error(`Error fetching yarn data for weft yarn ${weft.yarnId}:`, error);
                        yarns.push({
                            yarnId: weft.yarnId,
                            yarnType: 'Weft',
                            yarnCount: `Yarn ${weft.yarnId}`,
                            gramsPerMeter: Number(weft.gramsPerMeter || 0),
                            totalWeavingOrderQty: totalWeavingQty,
                            totalRequiredQty: totalWeavingQty * Number(weft.gramsPerMeter || 0),
                            totalAvailableQty: 0,
                            activeFlag: true
                        });
                    }
                }
            }

            return yarns;
        } catch (error: any) {
            console.error("Error fetching yarn requirements:", error);
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Create weavingContractsSlice
const weavingContractsSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllWeavingContract (GET request)
            .addCase(getAllWeavingContract.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllWeavingContract.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload || {};
                state.weavingContractList = Array.isArray(payload.data) ? payload.data : [];
                state.paginationInfo = {
                    total: payload.total ?? state.paginationInfo.total,
                    next: Boolean(payload.next),
                    prev: Boolean(payload.prev),
                    offset: payload.offset ?? state.paginationInfo.offset,
                    limit: payload.limit ?? state.paginationInfo.limit
                };
                state.submissionSuccess = false;
            })
            .addCase(getAllWeavingContract.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getAllLotEntries (GET request)
            .addCase(getAllLotEntries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllLotEntries.fulfilled, (state: any, action) => {
                state.loading = false;
                state.lotEntriesList = action.payload;
            })
            .addCase(getAllLotEntries.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getWeavingContractById (GET request)
            .addCase(getWeavingContractById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getWeavingContractById.fulfilled, (state: any, action) => {
                state.loading = false;
                state.getWeavingContractByIdList = action.payload;
            })
            .addCase(getWeavingContractById.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createWeavingContract (POST request)
            .addCase(createWeavingContract.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createWeavingContract.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createWeavingContractResult = action.payload;
                state.submissionSuccess = true;
            })
            .addCase(createWeavingContract.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteContract (DELETE request)
            .addCase(deleteContract.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteContract.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload?.id;
                if (deletedId !== undefined) {
                    state.weavingContractList = state.weavingContractList.filter(
                        (wc: any) => wc.id !== deletedId
                    );
                    state.paginationInfo = {
                        ...state.paginationInfo,
                        total: Math.max(0, state.paginationInfo.total - 1)
                    };
                }
            })
            .addCase(deleteContract.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default weavingContractsSlice.reducer;