// //beam outward slice


// import apiService from "@/services/ApiService";
// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";

// export interface PaginationInfo {
//     total: number;
//     next: boolean;
//     prev: boolean;
//     offset: number;
//     limit: number;
// }

// export interface ApiState {
//     loading: boolean;
//     error: string | null;
//     beamOutwardList: any;
//     createBeamOutwardResult: any;
//     checking: boolean;
//     paginationInfo: PaginationInfo;
// }

// const initialState: ApiState = {
//     loading: false,
//     error: null,
//     beamOutwardList: [],
//     createBeamOutwardResult: null,
//     checking: false,
//     paginationInfo: {
//         total: 0,
//         next: false,
//         prev: false,
//         offset: 0,
//         limit: 10,
//     },
// };

// const normalizeBeamOutwardResponse = (
//     response: any,
//     fallbackOffset: number,
//     fallbackLimit: number
// ) => {
//     if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
//         const payload = response.data;
//         const normalizedData = Array.isArray(payload.data)
//             ? payload.data
//             : Array.isArray(payload.items)
//                 ? payload.items
//                 : [];
//         return {
//             data: normalizedData,
//             total: payload.total ?? payload.count ?? payload.pagination?.total ?? normalizedData.length,
//             next: payload.next ?? payload.pagination?.next ?? false,
//             prev: payload.prev ?? payload.pagination?.prev ?? fallbackOffset > 0,
//             offset: payload.offset ?? payload.pagination?.offset ?? fallbackOffset,
//             limit: payload.limit ?? payload.pagination?.limit ?? fallbackLimit,
//         };
//     }
//     if (Array.isArray(response?.data)) {
//         return {
//             data: response.data,
//             total: response.total ?? response.count ?? response.data.length,
//             next: response.next ?? false,
//             prev: response.prev ?? false,
//             offset: response.offset ?? fallbackOffset,
//             limit: response.limit ?? fallbackLimit,
//         };
//     }
//     if (Array.isArray(response)) {
//         return {
//             data: response,
//             total: response.length,
//             next: false,
//             prev: fallbackOffset > 0,
//             offset: fallbackOffset,
//             limit: fallbackLimit,
//         };
//     }
//     return {
//         data: [],
//         total: 0,
//         next: false,
//         prev: false,
//         offset: fallbackOffset,
//         limit: fallbackLimit,
//     };
// };

// export const getAllBeamOutward = createAsyncThunk(
//     'beam-outward/getAllBeamOutward',
//     async (params: { companyId?: number; offset?: number; limit?: number; fetchAll?: boolean } | undefined, thunkAPI) => {
//         try {
//             const companyId = params?.companyId;
//             const fetchAll = params?.fetchAll ?? false;
//             const offset = fetchAll ? 0 : (params?.offset ?? 0);
//             const limit = fetchAll ? 10000 : (params?.limit ?? 10);

//             const queryParams = new URLSearchParams();
//             queryParams.append('offset', String(offset));
//             queryParams.append('limit', String(limit));

//             let endpoint = companyId != null ? `/beam-outward/company/${companyId}` : '/beam-outward';
//             endpoint = `${endpoint}?${queryParams.toString()}`;

//             const response = await apiService.get(endpoint);
//             const normalized = normalizeBeamOutwardResponse(response, offset, limit);
//             return {
//                 data: normalized.data,
//                 total: normalized.total,
//                 next: normalized.next,
//                 prev: normalized.prev,
//                 offset: normalized.offset,
//                 limit: normalized.limit,
//             };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// export const getBeamOutwardByBeamInwardId = createAsyncThunk(
//     'beam-outward/getBeamOutwardByBeamInwardId',
//     async (
//         params: number | { beamInwardId: number; companyId?: number },
//         thunkAPI
//     ) => {
//         try {
//             const beamInwardId = typeof params === "number" ? params : params.beamInwardId;
//             const companyId = typeof params === "number" ? undefined : params.companyId;
//             const endpoint = `/beam-outward/beam-inward/${beamInwardId}${companyId != null ? `?companyId=${companyId}` : ""}`;
//             const response = await apiService.get(endpoint);
//             return response || [];
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// export const createBeamOutward: any = createAsyncThunk(
//     'beam-outward/createBeamOutward',
//     async (params: any | any[], thunkAPI) => {
//         try {
//             if (Array.isArray(params)) {
//                 const results = await Promise.all(params.map((p) => apiService.post("/beam-outward", p)));
//                 toast.success("Saved Successfully!");
//                 return results;
//             } else {
//                 const response = await apiService.post("/beam-outward", params);
//                 if (response) {
//                     toast.success("Saved Successfully!");
//                     return response;
//                 } else {
//                     const errorMessage = "Something went wrong";
//                     return thunkAPI.rejectWithValue(errorMessage);
//                 }
//             }
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// export const updateBeamOutward: any = createAsyncThunk(
//     'beam-outward/updateBeamOutward',
//     async (
//         { id, data, companyId }: { id: number; data: any; companyId?: number },
//         thunkAPI
//     ) => {
//         try {
//             const endpoint = companyId != null ? `/beam-outward/company/${companyId}/${id}` : `/beam-outward/${id}`;
//             const response = await apiService.put(endpoint, data);
//             toast.success(response?.message || response?.data?.message || "Updated Successfully!");
//             return response?.data ?? response;
//         } catch (error: any) {
//             toast.error(error?.message || "Update Failed");
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// export const deleteBeamOutward = createAsyncThunk(
//     'beam-outward/deleteBeamOutward',
//     async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
//         try {
//             const endpoint = companyId != null ? `/beam-outward/company/${companyId}/${id}` : `/beam-outward/${id}`;
//             const response = await apiService.delete(endpoint);
//             toast.success(response?.message || response?.data?.message || "Deleted Successfully!");
//             return id;
//         } catch (error: any) {
//             toast.error(error?.message || "Delete Failed");
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// const beamOutwardSlice = createSlice({
//     name: "beamOutward",
//     initialState,
//     reducers: {},
//     extraReducers: (builder) => {
//         builder
//             .addCase(getAllBeamOutward.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(getAllBeamOutward.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 const payload = action.payload;
//                 if (payload && Array.isArray(payload.data)) {
//                     state.beamOutwardList = payload.data;
//                     state.paginationInfo = {
//                         total: payload.total ?? payload.data.length,
//                         next: Boolean(payload.next),
//                         prev: Boolean(payload.prev),
//                         offset: payload.offset ?? state.paginationInfo.offset,
//                         limit: payload.limit ?? state.paginationInfo.limit,
//                     };
//                 } else if (Array.isArray(payload)) {
//                     state.beamOutwardList = payload;
//                     state.paginationInfo = {
//                         total: payload.length,
//                         next: false,
//                         prev: false,
//                         offset: 0,
//                         limit: payload.length || state.paginationInfo.limit,
//                     };
//                 } else {
//                     state.beamOutwardList = [];
//                     state.paginationInfo = {
//                         ...state.paginationInfo,
//                         total: 0,
//                         next: false,
//                         prev: false,
//                         offset: 0,
//                     };
//                 }
//             })
//             .addCase(getAllBeamOutward.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload as any;
//             })

//             .addCase(createBeamOutward.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(createBeamOutward.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.createBeamOutwardResult = action.payload;
//             })
//             .addCase(createBeamOutward.rejected, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.error = action.payload as any;
//             })
//             .addCase(updateBeamOutward.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(updateBeamOutward.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.createBeamOutwardResult = action.payload;
//             })
//             .addCase(updateBeamOutward.rejected, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.error = action.payload as any;
//             })
//             .addCase(deleteBeamOutward.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(deleteBeamOutward.fulfilled, (state, action: PayloadAction<number>) => {
//                 state.loading = false;
//                 if (Array.isArray(state.beamOutwardList)) {
//                     state.beamOutwardList = state.beamOutwardList.filter((item: any) => item?.id !== action.payload);
//                 }
//             })
//             .addCase(deleteBeamOutward.rejected, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.error = action.payload as any;
//             });
//     },
// });

// export default beamOutwardSlice.reducer;
//beam outward slice


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
    beamOutwardList: any;
    createBeamOutwardResult: any;
    checking: boolean;
    paginationInfo: PaginationInfo;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    beamOutwardList: [],
    createBeamOutwardResult: null,
    checking: false,
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10,
    },
};

const normalizeBeamOutwardResponse = (
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
            limit: payload.limit ?? payload.pagination?.limit ?? fallbackLimit,
        };
    }
    if (Array.isArray(response?.data)) {
        return {
            data: response.data,
            total: response.total ?? response.count ?? response.data.length,
            next: response.next ?? false,
            prev: response.prev ?? false,
            offset: response.offset ?? fallbackOffset,
            limit: response.limit ?? fallbackLimit,
        };
    }
    if (Array.isArray(response)) {
        return {
            data: response,
            total: response.length,
            next: false,
            prev: fallbackOffset > 0,
            offset: fallbackOffset,
            limit: fallbackLimit,
        };
    }
    return {
        data: [],
        total: 0,
        next: false,
        prev: false,
        offset: fallbackOffset,
        limit: fallbackLimit,
    };
};

export const getAllBeamOutward = createAsyncThunk(
    'beam-outward/getAllBeamOutward',
    async (params: { companyId?: number; offset?: number; limit?: number; fetchAll?: boolean } | undefined, thunkAPI) => {
        try {
            const companyId = params?.companyId;
            const fetchAll = params?.fetchAll ?? false;
            const offset = fetchAll ? 0 : (params?.offset ?? 0);
            const limit = fetchAll ? 10000 : (params?.limit ?? 10);

            const queryParams = new URLSearchParams();
            queryParams.append('offset', String(offset));
            queryParams.append('limit', String(limit));

            let endpoint = companyId != null ? `/beam-outward/company/${companyId}` : '/beam-outward';
            endpoint = `${endpoint}?${queryParams.toString()}`;

            const response = await apiService.get(endpoint);
            const normalized = normalizeBeamOutwardResponse(response, offset, limit);
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

export const getBeamOutwardByBeamInwardId = createAsyncThunk(
    'beam-outward/getBeamOutwardByBeamInwardId',
    async (
        params: number | { beamInwardId: number; companyId?: number },
        thunkAPI
    ) => {
        try {
            const beamInwardId = typeof params === "number" ? params : params.beamInwardId;
            const companyId = typeof params === "number" ? undefined : params.companyId;
            const endpoint = `/beam-outward/beam-inward/${beamInwardId}${companyId != null ? `?companyId=${companyId}` : ""}`;
            const response = await apiService.get(endpoint);
            return response || [];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const createBeamOutward: any = createAsyncThunk(
    'beam-outward/createBeamOutward',
    async (params: any | any[], thunkAPI) => {
        try {
            if (Array.isArray(params)) {
                const results = await Promise.all(params.map((p) => apiService.post("/beam-outward", p)));
                toast.success("Saved Successfully!");
                return results;
            } else {
                const response = await apiService.post("/beam-outward", params);
                if (response) {
                    toast.success("Saved Successfully!");
                    return response;
                } else {
                    const errorMessage = "Something went wrong";
                    return thunkAPI.rejectWithValue(errorMessage);
                }
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const updateBeamOutward: any = createAsyncThunk(
    'beam-outward/updateBeamOutward',
    async (
        { id, data, companyId }: { id: number; data: any; companyId?: number },
        thunkAPI
    ) => {
        try {
            const endpoint = companyId != null ? `/beam-outward/company/${companyId}/${id}` : `/beam-outward/${id}`;
            const response = await apiService.put(endpoint, data);
            toast.success(response?.message || response?.data?.message || "Updated Successfully!");
            return response?.data ?? response;
        } catch (error: any) {
            toast.error(error?.message || "Update Failed");
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const deleteBeamOutward = createAsyncThunk(
    'beam-outward/deleteBeamOutward',
    async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
        try {
            const endpoint = companyId != null ? `/beam-outward/company/${companyId}/${id}` : `/beam-outward/${id}`;
            const response = await apiService.delete(endpoint);
            toast.success(response?.message || response?.data?.message || "Deleted Successfully!");
            return id;
        } catch (error: any) {
            toast.error(error?.message || "Delete Failed");
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const checkBeamReturnStatus = createAsyncThunk(
    'beam-outward/checkBeamReturnStatus',
    async ({ beamOutwardId, sizedBeamNo }: { beamOutwardId: number; sizedBeamNo: string }, thunkAPI) => {
        try {
            const endpoint = `/beam-outward/check-return?beamOutwardId=${beamOutwardId}&sizedBeamNo=${encodeURIComponent(sizedBeamNo)}`;
            const response = await apiService.get(endpoint);
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

const beamOutwardSlice = createSlice({
    name: "beamOutward",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllBeamOutward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllBeamOutward.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload;
                if (payload && Array.isArray(payload.data)) {
                    state.beamOutwardList = payload.data;
                    state.paginationInfo = {
                        total: payload.total ?? payload.data.length,
                        next: Boolean(payload.next),
                        prev: Boolean(payload.prev),
                        offset: payload.offset ?? state.paginationInfo.offset,
                        limit: payload.limit ?? state.paginationInfo.limit,
                    };
                } else if (Array.isArray(payload)) {
                    state.beamOutwardList = payload;
                    state.paginationInfo = {
                        total: payload.length,
                        next: false,
                        prev: false,
                        offset: 0,
                        limit: payload.length || state.paginationInfo.limit,
                    };
                } else {
                    state.beamOutwardList = [];
                    state.paginationInfo = {
                        ...state.paginationInfo,
                        total: 0,
                        next: false,
                        prev: false,
                        offset: 0,
                    };
                }
            })
            .addCase(getAllBeamOutward.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload as any;
            })

            .addCase(createBeamOutward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBeamOutward.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createBeamOutwardResult = action.payload;
            })
            .addCase(createBeamOutward.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload as any;
            })
            .addCase(updateBeamOutward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBeamOutward.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createBeamOutwardResult = action.payload;
            })
            .addCase(updateBeamOutward.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload as any;
            })
            .addCase(deleteBeamOutward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBeamOutward.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                if (Array.isArray(state.beamOutwardList)) {
                    state.beamOutwardList = state.beamOutwardList.filter((item: any) => item?.id !== action.payload);
                }
            })
            .addCase(deleteBeamOutward.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload as any;
            });
    },
});

export default beamOutwardSlice.reducer;
