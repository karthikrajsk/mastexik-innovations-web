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
//     beamInwardList: any;
//     createBeamInwardResult: any;
//     checking: boolean;
//     paginationInfo: PaginationInfo;
// }

// const initialState: ApiState = {
//     loading: false,
//     error: null,
//     beamInwardList: [],
//     createBeamInwardResult: null,
//     checking: false,
//     paginationInfo: {
//         total: 0,
//         next: false,
//         prev: false,
//         offset: 0,
//         limit: 10
//     }
// };

// const normalizeBeamInwardResponse = (
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
//             limit: payload.limit ?? payload.pagination?.limit ?? fallbackLimit
//         };
//     }

//     if (Array.isArray(response?.data)) {
//         return {
//             data: response.data,
//             total: response.total ?? response.count ?? response.data.length,
//             next: response.next ?? false,
//             prev: response.prev ?? false,
//             offset: response.offset ?? fallbackOffset,
//             limit: response.limit ?? fallbackLimit
//         };
//     }

//     if (Array.isArray(response)) {
//         return {
//             data: response,
//             total: response.length,
//             next: false,
//             prev: fallbackOffset > 0,
//             offset: fallbackOffset,
//             limit: fallbackLimit
//         };
//     }

//     return {
//         data: [],
//         total: 0,
//         next: false,
//         prev: false,
//         offset: fallbackOffset,
//         limit: fallbackLimit
//     };
// };


// const resolveApiErrorMessage = (error: any, fallback: string) => {
//     const responseData = error?.response?.data;
//     const candidates: string[] = [];

//     if (typeof responseData === "string") {
//         candidates.push(responseData);
//     } else if (responseData) {
//         if (typeof responseData.message === "string") {
//             candidates.push(responseData.message);
//         }
//         if (typeof responseData.error === "string") {
//             candidates.push(responseData.error);
//         }
//         if (typeof responseData.data === "string") {
//             candidates.push(responseData.data);
//         }
//         if (responseData.data && typeof responseData.data === "object") {
//             if (typeof responseData.data.message === "string") {
//                 candidates.push(responseData.data.message);
//             }
//             if (typeof responseData.data.error === "string") {
//                 candidates.push(responseData.data.error);
//             }
//             if (Array.isArray(responseData.data.errors)) {
//                 responseData.data.errors.forEach((err: any) => {
//                     if (typeof err === "string") {
//                         candidates.push(err);
//                     } else if (typeof err?.message === "string") {
//                         candidates.push(err.message);
//                     }
//                 });
//             }
//         }
//         if (Array.isArray(responseData.errors)) {
//             responseData.errors.forEach((err: any) => {
//                 if (typeof err === "string") {
//                     candidates.push(err);
//                 } else if (typeof err?.message === "string") {
//                     candidates.push(err.message);
//                 }
//             });
//         }
//     }

//     const candidate = candidates.find((msg) => typeof msg === "string" && msg.trim());
//     return candidate || error?.message || fallback;
// };


// // Thunk for getAllBeamInward GET API call
// export const getAllBeamInward = createAsyncThunk(
//     'beam-inward/getAllBeamInward',
//     async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
//         try {
//             const fetchAll = params.fetchAll ?? false;
//             const offset = fetchAll ? 0 : params.offset ?? 0;
//             const limit = fetchAll ? 10000 : params.limit ?? 10000;
//             const companyId = params.companyId;

//             const queryParams = new URLSearchParams();
//             queryParams.append('offset', String(offset));
//             queryParams.append('limit', String(limit));

//             let endpoint = companyId ? `/beam-inward/company/${companyId}` : `/beam-inward`;
//             const queryString = queryParams.toString();
//             if (queryString) {
//                 endpoint = `${endpoint}?${queryString}`;
//             }

//             const response = await apiService.get(endpoint);
//             const normalized = normalizeBeamInwardResponse(response, offset, limit);

//             return {
//                 data: normalized.data,
//                 total: normalized.total,
//                 next: normalized.next,
//                 prev: normalized.prev,
//                 offset: normalized.offset,
//                 limit: normalized.limit
//             };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// // Thunk for getAllBeamInwardById
// export const getAllBeamInwardById = createAsyncThunk(
//     'beam-inward/getAllBeamInwardById',
//     async (params: number | { id: number; companyId?: number }, thunkAPI) => {
//         try {
//             const id = typeof params === 'number' ? params : params.id;
//             const companyId = typeof params === 'number' ? undefined : params.companyId;
//             const endpoint = companyId ? `/beam-inward/company/${companyId}/${id}` : `/beam-inward/${id}`;

//             const response = await apiService.get(endpoint);
//             console.log("API Response:", response);
//             return response || { data: [], message: "", status: "success" };
//         } catch (error: any) {
//             console.error("API Error:", error);
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// // Thunk for createBeamInward POST API call
// export const createBeamInward: any = createAsyncThunk(
//     'beam-inward/createBeamInward',
//     async (params: any, thunkAPI) => {
//         try {
//             const response = await apiService.post("/beam-inward", params); // Adjust API endpoint if needed
//             console.log(response)
//             if (response) {
//                 toast.success("Saved Successfully!");
//                 return response;
//             } else {
//                 const errorMessage = "Something went wrong";
//                 // toast.error(errorMessage);
//                 return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
            
//     const errorMessage = resolveApiErrorMessage(error, "Failed to create beam inward");
//                         toast.error(errorMessage);
//                         return thunkAPI.rejectWithValue(errorMessage);
//             // return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// export const updateBeamInward: any = createAsyncThunk(
//     'beam-inward/updateBeamInward',
//     async ({ id, data, companyId }: { id: number; data: any; companyId?: number }, thunkAPI) => {
//         try {
//             const endpoint = companyId ? `/beam-inward/company/${companyId}/${id}` : `/beam-inward/${id}`;
//             const response = await apiService.put(endpoint, data);

//             if (response?.status === 'success' || response?.data?.status === 'success' || response) {
//                 toast.success(response?.message || response?.data?.message || "Updated successfully!");
//                 return response?.data?.data || response?.data || response;
//             } else {
//                 const errorMessage = response?.data?.message || "Something went wrong";
//                 toast.error(errorMessage);
//                 return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
//             toast.error(error.message || "Update failed");
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// const extractErrorMessage = (error: any) =>
//     error?.response?.data?.message ||
//     error?.response?.data?.error ||
//     error?.message ||
//     'Failed to delete category';

// export const deleteBeamInward = createAsyncThunk(
//     'beam-inward/deleteBeamInward',
//     async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
//         try {
//             const endpoint = companyId ? `/beam-inward/company/${companyId}/${id}` : `/beam-inward/${id}`;
//             const response = await apiService.delete(endpoint);

//             if (response?.status === 'success' || response?.data?.status === 'success') {
//                 toast.success(response?.message || response?.data?.message || "Successfully deleted");
//                 return id;
//             }

//             const errorMessage = response?.data?.data?.message || response?.data?.message || 'Failed to delete category';
//             toast.error(errorMessage);
//             return thunkAPI.rejectWithValue(errorMessage);

//         } catch (error: any) {
//               const message = extractErrorMessage(error);
//                                                                   toast.error(message);
//                                                                   return thunkAPI.rejectWithValue(message);
//             // let errorMessage = 'An error occurred while deleting the category';

//             // if (error.response) {
//             //     errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
//             // } else if (error.request) {
//             //     errorMessage = 'No response from server';
//             // } else if (error.message) {
//             //     errorMessage = error.message;
//             // }

//             // toast.error(errorMessage);
//             // return thunkAPI.rejectWithValue(errorMessage);
//         }
//     }
// );


// // Create beamInwardSlice
// const beamInwardSlice = createSlice({
//     name: "state",
//     initialState,
//     reducers: {}, // No normal reducers for now
//     extraReducers: (builder) => {
//         builder

//             // Handle getAllBeamInward (GET request)
//             .addCase(getAllBeamInward.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(getAllBeamInward.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 const payload = action.payload;

//                 const filterReturnedBeams = (record: any) => {
//                     if (!Array.isArray(record?.beamInwardBeamDetails)) return record;
//                     return {
//                         ...record,
//                         beamInwardBeamDetails: record.beamInwardBeamDetails.filter(
//                             (beam: any) => !String(beam?.sizedBeamNo || "").endsWith("-R")
//                         )
//                     };
//                 };

//                 if (payload && Array.isArray(payload.data)) {
//                     state.beamInwardList = payload.data.map(filterReturnedBeams);
//                     state.paginationInfo = {
//                         total: payload.total ?? payload.data.length ?? state.paginationInfo.total,
//                         next: Boolean(payload.next),
//                         prev: Boolean(payload.prev),
//                         offset: payload.offset ?? state.paginationInfo.offset,
//                         limit: payload.limit ?? state.paginationInfo.limit
//                     };
//                 } else if (Array.isArray(payload)) {
//                     state.beamInwardList = payload.map(filterReturnedBeams);
//                     state.paginationInfo = {
//                         total: payload.length,
//                         next: false,
//                         prev: false,
//                         offset: 0,
//                         limit: payload.length || state.paginationInfo.limit
//                     };
//                 } else {
//                     state.beamInwardList = [];
//                     state.paginationInfo = {
//                         ...state.paginationInfo,
//                         total: 0,
//                         next: false,
//                         prev: false,
//                         offset: 0
//                     };
//                 }
//             })
//             .addCase(getAllBeamInward.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle createBeamInward (POST request)
//             .addCase(createBeamInward.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(createBeamInward.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.createBeamInwardResult = action.payload;
//             })
//             .addCase(createBeamInward.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle updateBeamInward (PUT request)
//             .addCase(updateBeamInward.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(updateBeamInward.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 const updatedTable = action.payload;
//                 state.beamInwardList = state.beamInwardList.map((table: any) =>
//                     table.id === updatedTable.id ? updatedTable : table
//                 );
//             })
//             .addCase(updateBeamInward.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle deleteBeamInward (DELETE request)
//             .addCase(deleteBeamInward.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(deleteBeamInward.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 const deletedId = action.payload;
//                 if (deletedId !== undefined) {
//                     state.beamInwardList = state.beamInwardList.filter((item: any) => item.id !== deletedId);
//                     state.paginationInfo = {
//                         ...state.paginationInfo,
//                         total: Math.max(0, state.paginationInfo.total - 1)
//                     };
//                 }
//             })
//             // .addCase(deleteBeamInward.fulfilled, (state: any, action) => {
//             //     state.loading = false;
//             //     const deletedSalesOrder = action.payload;
//             //     state.beamInwardList = state.beamInwardList.filter(
//             //         (so: any) => so.id !== deletedSalesOrder.id
//             //     );
//             // })
//             .addCase(deleteBeamInward.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//     },
// });

// // Export reducer
// export default beamInwardSlice.reducer;
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
    beamInwardList: any;
    createBeamInwardResult: any;
    checking: boolean;
    paginationInfo: PaginationInfo;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    beamInwardList: [],
    createBeamInwardResult: null,
    checking: false,
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    }
};

const normalizeBeamInwardResponse = (
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


// Thunk for getAllBeamInward GET API call
export const getAllBeamInward = createAsyncThunk(
    'beam-inward/getAllBeamInward',
    async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
        try {
            const fetchAll = params.fetchAll ?? false;
            const offset = fetchAll ? 0 : params.offset ?? 0;
            const limit = fetchAll ? 10000 : params.limit ?? 10000;
            const companyId = params.companyId;

            const queryParams = new URLSearchParams();
            queryParams.append('offset', String(offset));
            queryParams.append('limit', String(limit));

            let endpoint = companyId ? `/beam-inward/company/${companyId}` : `/beam-inward`;
            const queryString = queryParams.toString();
            if (queryString) {
                endpoint = `${endpoint}?${queryString}`;
            }

            const response = await apiService.get(endpoint);
            const normalized = normalizeBeamInwardResponse(response, offset, limit);

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


export const getAllReturnedBeamInward = createAsyncThunk(
    'beam-inward/getAllReturnedBeamInward',
    async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
        try {
            const fetchAll = params.fetchAll ?? false;
            const offset = fetchAll ? 0 : params.offset ?? 0;
            const limit = fetchAll ? 10000 : params.limit ?? 10000;
            const companyId = params.companyId;

            const queryParams = new URLSearchParams();
            queryParams.append('offset', String(offset));
            queryParams.append('limit', String(limit));

            let endpoint = companyId ? `/beam-inward/company/${companyId}` : `/beam-inward`;
            const queryString = queryParams.toString();
            if (queryString) {
                endpoint = `${endpoint}?${queryString}`;
            }

            const response = await apiService.get(endpoint);
            const normalized = normalizeBeamInwardResponse(response, offset, limit);

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

// Thunk for getAllBeamInwardById
export const getAllBeamInwardById = createAsyncThunk(
    'beam-inward/getAllBeamInwardById',
    async (params: number | { id: number; companyId?: number }, thunkAPI) => {
        try {
            const id = typeof params === 'number' ? params : params.id;
            const companyId = typeof params === 'number' ? undefined : params.companyId;
            const endpoint = companyId ? `/beam-inward/company/${companyId}/${id}` : `/beam-inward/${id}`;

            const response = await apiService.get(endpoint);
            console.log("API Response:", response);
            return response || { data: [], message: "", status: "success" };
        } catch (error: any) {
            console.error("API Error:", error);
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createBeamInward POST API call
export const createBeamInward: any = createAsyncThunk(
    'beam-inward/createBeamInward',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/beam-inward", params); // Adjust API endpoint if needed
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
            
    const errorMessage = resolveApiErrorMessage(error, "Failed to create beam inward");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const updateBeamInward: any = createAsyncThunk(
    'beam-inward/updateBeamInward',
    async ({ id, data, companyId }: { id: number; data: any; companyId?: number }, thunkAPI) => {
        try {
            const endpoint = companyId ? `/beam-inward/company/${companyId}/${id}` : `/beam-inward/${id}`;
            const response = await apiService.put(endpoint, data);

            if (response?.status === 'success' || response?.data?.status === 'success' || response) {
                toast.success(response?.message || response?.data?.message || "Updated successfully!");
                return response?.data?.data || response?.data || response;
            } else {
                const errorMessage = response?.data?.message || "Something went wrong";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            toast.error(error.message || "Update failed");
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

const extractErrorMessage = (error: any) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Failed to delete category';

export const deleteBeamInward = createAsyncThunk(
    'beam-inward/deleteBeamInward',
    async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
        try {
            const endpoint = companyId ? `/beam-inward/company/${companyId}/${id}` : `/beam-inward/${id}`;
            const response = await apiService.delete(endpoint);

            if (response?.status === 'success' || response?.data?.status === 'success') {
                toast.success(response?.message || response?.data?.message || "Successfully deleted");
                return id;
            }

            const errorMessage = response?.data?.data?.message || response?.data?.message || 'Failed to delete category';
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


// Create beamInwardSlice
const beamInwardSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllBeamInward (GET request)
            .addCase(getAllBeamInward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            
            .addCase(getAllBeamInward.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload;

                const filterReturnedBeams = (record: any) => {
                    if (!Array.isArray(record?.beamInwardBeamDetails)) return record;
                    return {
                        ...record,
                        beamInwardBeamDetails: record.beamInwardBeamDetails.filter(
                            (beam: any) => String(beam?.isReturn) !== "2"
                        )
                    };
                };

                if (payload && Array.isArray(payload.data)) {
                    state.beamInwardList = payload.data.map(filterReturnedBeams);
                    state.paginationInfo = {
                        total: payload.total ?? payload.data.length ?? state.paginationInfo.total,
                        next: Boolean(payload.next),
                        prev: Boolean(payload.prev),
                        offset: payload.offset ?? state.paginationInfo.offset,
                        limit: payload.limit ?? state.paginationInfo.limit
                    };
                } else if (Array.isArray(payload)) {
                    state.beamInwardList = payload.map(filterReturnedBeams);
                    state.paginationInfo = {
                        total: payload.length,
                        next: false,
                        prev: false,
                        offset: 0,
                        limit: payload.length || state.paginationInfo.limit
                    };
                } else {
                    state.beamInwardList = [];
                    state.paginationInfo = {
                        ...state.paginationInfo,
                        total: 0,
                        next: false,
                        prev: false,
                        offset: 0
                    };
                }
            })
            .addCase(getAllBeamInward.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })
 // Handle getAllBeamInward (GET request)
            .addCase(getAllReturnedBeamInward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            
            .addCase(getAllReturnedBeamInward.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload;

                // const filterReturnedBeams = (record: any) => {
                //     if (!Array.isArray(record?.beamInwardBeamDetails)) return record;
                //     return {
                //         ...record,
                //         beamInwardBeamDetails: record.beamInwardBeamDetails.filter(
                //             (beam: any) => !String(beam?.sizedBeamNo || "").endsWith("-R")
                //         )
                //     };
                // };

                if (payload && Array.isArray(payload.data)) {
                    state.beamInwardList = payload.data;
                    state.paginationInfo = {
                        total: payload.total ?? payload.data.length ?? state.paginationInfo.total,
                        next: Boolean(payload.next),
                        prev: Boolean(payload.prev),
                        offset: payload.offset ?? state.paginationInfo.offset,
                        limit: payload.limit ?? state.paginationInfo.limit
                    };
                } else if (Array.isArray(payload)) {
                    state.beamInwardList = payload.data;
                    state.paginationInfo = {
                        total: payload.length,
                        next: false,
                        prev: false,
                        offset: 0,
                        limit: payload.length || state.paginationInfo.limit
                    };
                } else {
                    state.beamInwardList = [];
                    state.paginationInfo = {
                        ...state.paginationInfo,
                        total: 0,
                        next: false,
                        prev: false,
                        offset: 0
                    };
                }
            })
            .addCase(getAllReturnedBeamInward.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createBeamInward (POST request)
            .addCase(createBeamInward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBeamInward.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createBeamInwardResult = action.payload;
            })
            .addCase(createBeamInward.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateBeamInward (PUT request)
            .addCase(updateBeamInward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBeamInward.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.beamInwardList = state.beamInwardList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateBeamInward.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteBeamInward (DELETE request)
            .addCase(deleteBeamInward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBeamInward.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                if (deletedId !== undefined) {
                    state.beamInwardList = state.beamInwardList.filter((item: any) => item.id !== deletedId);
                    state.paginationInfo = {
                        ...state.paginationInfo,
                        total: Math.max(0, state.paginationInfo.total - 1)
                    };
                }
            })
            // .addCase(deleteBeamInward.fulfilled, (state: any, action) => {
            //     state.loading = false;
            //     const deletedSalesOrder = action.payload;
            //     state.beamInwardList = state.beamInwardList.filter(
            //         (so: any) => so.id !== deletedSalesOrder.id
            //     );
            // })
            .addCase(deleteBeamInward.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default beamInwardSlice.reducer;