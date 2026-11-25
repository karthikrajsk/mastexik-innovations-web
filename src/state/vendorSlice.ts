import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface PaginationState {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
}

export interface ApiState {
    loading: boolean;
    error: string | null;
    vendorList: any;
    createVendorResult: any;
    checking: boolean;
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    vendorList: [],
    createVendorResult: null,
    checking: false,
    pagination: {
        total: 0,
        limit: 10,
        offset: 0,
        next: false,
        prev: false,
    },
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


// Thunk for getAllVendors GET API call
// export const getAllVendors = createAsyncThunk(
//     'vendor/getAllVendors',
//     async (params: any = {}, thunkAPI) => {
//         try {
//             const { limit = 10, offset = 0, fetchAll = false, companyId } = params;
//             const queryParams = new URLSearchParams();

//             if (companyId) {
//                 queryParams.append('companyId', String(companyId));
//             }

//             if (fetchAll) {
//                 queryParams.append('limit', '10');
//                 queryParams.append('offset', '0');
//             } else {
//                 queryParams.append('limit', String(limit));
//                 queryParams.append('offset', String(offset));
//             }

//             const queryString = queryParams.toString();
//             const url = queryString ? `/vendor?${queryString}` : '/vendor';
//             const response = await apiService.get(url);
//             console.log(response);

//             const rawData = Array.isArray(response?.data?.data)
//                 ? response?.data?.data
//                 : Array.isArray(response?.data)
//                     ? response?.data
//                     : [];

//             const responseData = response?.data || {};
//             const total = responseData?.total ?? rawData.length;
//             const effectiveOffset = responseData?.offset ?? offset;
//             const effectiveLimit = responseData?.limit ?? limit;
//             const nextOffset = effectiveOffset + effectiveLimit;

//             const pagination = {
//                 total,
//                 limit: effectiveLimit,
//                 offset: effectiveOffset,
//                 next: responseData?.next ?? (nextOffset < total),
//                 prev: responseData?.prev ?? (effectiveOffset > 0),
//             };

//             return { data: rawData, pagination };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );
export const getAllVendors = createAsyncThunk(
  "vendor/getAllVendors",
  async (
    params: {
      limit?: number
      offset?: number
      fetchAll?: boolean
      companyId?: number | string
    } = {},
    thunkAPI
  ) => {
    try {
      const queryParams = new URLSearchParams()

      if (params.companyId !== undefined) {
        queryParams.append("companyId", String(params.companyId))
      }

      if (params.fetchAll) {
        queryParams.append("limit", "10000")
        queryParams.append("offset", "0")
      } else {
        if (params.limit !== undefined) {
          queryParams.append("limit", String(params.limit))
        }
        if (params.offset !== undefined) {
          queryParams.append("offset", String(params.offset))
        }
      }

      const queryString = queryParams.toString()
      const url = queryString ? `/vendor?${queryString}` : `/vendor`

      const response = await apiService.get(url)

      // 🔹 Same structure as getAllCurrencies
      const paginationData = response?.data

      const rawArray = Array.isArray(paginationData?.data)
        ? paginationData.data
        : Array.isArray(paginationData)
        ? paginationData
        : []

      return {
        data: rawArray,
        pagination: {
          total: paginationData?.total || rawArray.length || 0,
          limit:
            paginationData?.limit ??
            (params.fetchAll ? 10000 : params.limit ?? 10),
          offset:
            paginationData?.offset ??
            (params.fetchAll ? 0 : params.offset ?? 0),
          next: paginationData?.next ?? false,
          prev: paginationData?.prev ?? false,
        }
      }

    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
);

// Thunk for createVendor POST API call
export const createVendor: any = createAsyncThunk(
    'vendor/createVendor',
    async (params: any, thunkAPI) => {
        try {
            // Handle vendorTypeIds array - convert to comma-separated string for backend
            const payload = {
                ...params,
                vendorTypeIds: params.vendorTypeIds || [],
                vendorTypeId: params.vendorTypeIds ? params.vendorTypeIds.join(",") : null
            };
            const response = await apiService.post("/vendor", payload);
            console.log(response)
            if (response?.status === 'success') {
                toast.success(response?.message);
                return response?.data;
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
          const errorMessage = resolveApiErrorMessage(error, "Failed to create vendor");
                                  toast.error(errorMessage);
                                  return thunkAPI.rejectWithValue(errorMessage); 
        }
    }
);

// Thunk for updateVendor PUT API call
export const updateVendor: any = createAsyncThunk(
    'vendor/updateVendor',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            // Handle vendorTypeIds array - convert to comma-separated string for backend
            const payload = {
                ...params,
                vendorTypeIds: params.vendorTypeIds || [],
                vendorTypeId: params.vendorTypeIds ? params.vendorTypeIds.join(",") : null
            };
            const response = await apiService.put(`/vendor/${params.id}`, payload);
            console.log(response);
            if (response?.status === 'success') {
                toast.success(response?.message);
                return response?.data;
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
           const errorMessage = resolveApiErrorMessage(error, "Failed to update vendor");
                                   toast.error(errorMessage);
                                   return thunkAPI.rejectWithValue(errorMessage); 
        }
    }
);

// export const deleteVendor: any = createAsyncThunk(
//     'vendor/deleteVendor',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/vendor/${id}`);
//             console.log(response); // Check what the API actually returns
//             if (response?.status === 'success') {
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
export const deleteVendor = createAsyncThunk(
    'vendor/deleteVendor',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/vendor/${id}`);

            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return id; // Return the deleted ID for reducer handling
            }

            // Handle API error response
            const errorMessage = response.data.data?.message || 'Failed to delete';
            toast.error(errorMessage);
            return response;

        } catch (error: any) {
            // Handle network errors or unexpected errors
            let errorMessage = 'An error occurred while deleting';

            if (error.response) {
                // Server responded with a status code outside 2xx range
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'No response from server';
            }

            toast.error(errorMessage);
            return errorMessage;
        }
    }
);


// Thunks for Vendor Sizing Rates and History
export const fetchVendorSizingRates: any = createAsyncThunk(
    'vendor/fetchVendorSizingRates',
    async (vendorId: number, thunkAPI) => {
        try {
            const response = await apiService.get(`/vendor/${vendorId}/sizing-rates`);
            if (response?.status === 'success' || response?.data) {
                const data = response?.data?.data || response?.data || [];
                return data;
            }
            return [];
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to fetch vendor sizing rates");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const fetchVendorSizingRateHistory: any = createAsyncThunk(
    'vendor/fetchVendorSizingRateHistory',
    async (params: { vendorId: number; yarnCount?: string }, thunkAPI) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.yarnCount) {
                queryParams.append('yarnCount', params.yarnCount);
            }
            const queryString = queryParams.toString();
            const url = `/vendor/${params.vendorId}/sizing-rates/history${queryString ? `?${queryString}` : ''}`;
            const response = await apiService.get(url);
            if (response?.status === 'success' || response?.data) {
                const data = response?.data?.data || response?.data || [];
                return data;
            }
            return [];
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to fetch sizing rate history");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const saveVendorSizingRate: any = createAsyncThunk(
    'vendor/saveVendorSizingRate',
    async (params: { vendorId: number; yarnCount: string; sizingRate: number | string; effectiveDate?: string; createdBy?: string }, thunkAPI) => {
        try {
            const response = await apiService.post(`/vendor/${params.vendorId}/sizing-rates`, params);
            if (response?.status === 'success') {
                toast.success(response?.message || "Sizing rate saved/revised successfully");
                return response?.data;
            } else {
                const errorMessage = resolveApiErrorMessage(response, "Failed to save sizing rate");
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to save sizing rate");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteVendorSizingRate: any = createAsyncThunk(
    'vendor/deleteVendorSizingRate',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/vendor/sizing-rates/${id}`);
            if (response?.status === 'success') {
                toast.success("Sizing rate deleted successfully");
                return id;
            }
            const errorMessage = resolveApiErrorMessage(response, "Failed to delete sizing rate");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to delete sizing rate");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


// Create VendorSlice
const vendorSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllVendors (GET request)
            .addCase(getAllVendors.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllVendors.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload || { data: [], pagination: state.pagination };
                const sortedData = Array.isArray(payload.data) 
                    ? [...payload.data].sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
                    : [];
                state.vendorList = sortedData;
                state.pagination = payload.pagination || state.pagination;
            })
            .addCase(getAllVendors.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createVendor (POST request)
            .addCase(createVendor.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createVendor.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createVendorResult = action.payload;
            })
            .addCase(createVendor.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateVendor (PUT request)
            .addCase(updateVendor.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateVendor.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.vendorList = state.vendorList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateVendor.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteVendor (DELETE request)
            .addCase(deleteVendor.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteVendor.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedVendor = action.payload;
                const deletedId = typeof deletedVendor === 'number' ? deletedVendor : deletedVendor?.id;
                if (typeof deletedId === 'number') {
                    state.vendorList = state.vendorList.filter(
                        (vendor: any) => vendor.id !== deletedId
                    );
                    state.pagination.total = Math.max(0, state.pagination.total - 1);
                }
            })
            .addCase(deleteVendor.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default vendorSlice.reducer;
