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
    flangeList: any;
    createFlangeResult: any;
    checking: boolean;
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    flangeList: [],
    createFlangeResult: null,
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

// Thunk for getAllFlanges GET API call
// export const getAllFlanges = createAsyncThunk(
//     'flange/getAllFlanges',
//     async (params: { companyId: number; limit?: number; offset?: number; fetchAll?: boolean }, thunkAPI) => {
//         try {
//             const { companyId } = params;
//             const baseLimit = params.limit ?? 10000;
//             const baseOffset = params.offset ?? 0;
//             const shouldFetchAll = params.fetchAll ?? (params.limit === undefined && params.offset === undefined);
//             const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
//             const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

//             const queryParams = new URLSearchParams();
//             queryParams.append('limit', String(effectiveLimit));
//             queryParams.append('offset', String(effectiveOffset));

//             const queryString = queryParams.toString();
//             const url = `/flange/company/${companyId}${queryString ? `?${queryString}` : ''}`;
//             const response = await apiService.get(url);
//             console.log(response);

//             const rawData = Array.isArray(response?.data?.data)
//                 ? response?.data?.data
//                 : Array.isArray(response?.data)
//                     ? response?.data
//                     : [];

//             const responsePagination = response?.data?.pagination;
//             const total = responsePagination?.total ?? rawData.length;
//             const resolvedOffset = responsePagination?.offset ?? effectiveOffset;
//             const resolvedLimit = responsePagination?.limit ?? effectiveLimit;
//             const nextOffset = resolvedOffset + resolvedLimit;

//             const pagination = {
//                 total: responsePagination?.total, // Use total from API if available
//                 limit: resolvedLimit,
//                 offset: resolvedOffset,
//                 next: nextOffset < total,
//                 prev: resolvedOffset > 0,
//                 fetchAll: shouldFetchAll
//             };

//             return { data: rawData, pagination };
//         } catch (error: any) {
//             // Handle errors and reject with error message
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

export const getAllFlanges = createAsyncThunk(
  "flange/getAllFlanges",
  async (
    params: { companyId: number; limit?: number; offset?: number; fetchAll?: boolean },
    thunkAPI
  ) => {
    try {
      const { companyId } = params

      const queryParams = new URLSearchParams()

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
      const baseUrl = companyId ? `/flange/company/${companyId}` : `/flange`;
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

      const response = await apiService.get(url)
      console.log(response)

      const paginationData = response?.data

      let rawData = []
      // Most robust array extraction
      if (Array.isArray(paginationData?.data)) {
        rawData = paginationData.data
      } else if (Array.isArray(paginationData?.data?.data)) {
        rawData = paginationData.data.data
      } else if (Array.isArray(paginationData?.data?.rows)) {
        rawData = paginationData.data.rows
      } else if (Array.isArray(paginationData?.rows)) {
        rawData = paginationData.rows
      } else if (Array.isArray(paginationData)) {
        rawData = paginationData
      }

      const resolvedLimit =
        paginationData?.limit ??
        paginationData?.data?.limit ??
        (params.fetchAll ? 10000 : params.limit ?? 10)

      const resolvedOffset =
        paginationData?.offset ??
        paginationData?.data?.offset ??
        (params.fetchAll ? 0 : params.offset ?? 0)

      const total =
        paginationData?.total ??
        paginationData?.data?.total ??
        rawData.length

      return {
        data: rawData,
        pagination: {
          total,
          limit: resolvedLimit,
          offset: resolvedOffset,
          next: paginationData?.next ?? paginationData?.data?.next ?? resolvedOffset + resolvedLimit < total,
          prev: paginationData?.prev ?? paginationData?.data?.prev ?? resolvedOffset > 0,
        }
      }

    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

export const getFlangeById = createAsyncThunk(
    'flange/getFlangeById',
    async (params: { id: number }, thunkAPI) => {
        try {
            const response = await apiService.get(`/flange/${params.id}`);
            return response?.data ?? response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for create_area POST API call
export const createFlange: any = createAsyncThunk(
    'flange/createFlange',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/flange", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === 'success') {
                toast.success(response?.message);
                return response;
            } else {
                 const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                      toast.error(errorMessage);
                      return thunkAPI.rejectWithValue(errorMessage)
            }
        } catch (error: any) {
              const errorMessage = resolveApiErrorMessage(error, "Failed to create flange");
                       toast.error(errorMessage);
                       return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for updateFlange PUT API call
export const updateFlange: any = createAsyncThunk(
    'flange/updateFlange',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const { id, companyId, ...rest } = params;
            const payload = {
                ...rest,
                companyId,
            };
            const response = await apiService.put(`/flange/company/${companyId}/${id}`, payload);
            console.log(response);
            if (response?.status === 'success') {
                toast.success(response?.message);
                return response;
            } else {
                 const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to update flange");
                      toast.error(errorMessage);
                      return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteFlange = createAsyncThunk(
    'flange/deleteFlange',
    async (params: { id: number; companyId: number }, thunkAPI) => {
        try {
            const response = await apiService.delete(`/flange/company/${params.companyId}/${params.id}`);

            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return params.id; // Return the deleted ID for reducer handling
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


// Create flangeSlice
const flangeSlice = createSlice({
    name: "flange",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllFlanges (GET request)
            .addCase(getAllFlanges.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllFlanges.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload || { data: [], pagination: state.pagination };
                state.flangeList = payload.data;
                state.pagination = payload.pagination || state.pagination;
            })
            .addCase(getAllFlanges.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getFlangeById.fulfilled, (state: any, action) => {
                const payload = action.payload;
                const candidate = Array.isArray(payload) ? payload[0] : payload;
                const resolvedCandidate = candidate?.data && typeof candidate.data === "object"
                    ? (Array.isArray(candidate.data) ? candidate.data[0] : candidate.data)
                    : candidate;
                const resolved = resolvedCandidate?.data && typeof resolvedCandidate.data === "object"
                    ? (Array.isArray(resolvedCandidate.data) ? resolvedCandidate.data[0] : resolvedCandidate.data)
                    : resolvedCandidate;
                if (!resolved?.id) return;
                const currentList = Array.isArray(state.flangeList)
                    ? state.flangeList
                    : Array.isArray(state.flangeList?.data)
                        ? state.flangeList.data
                        : [];
                const existingIndex = currentList.findIndex((entry: any) => entry?.id === resolved.id);
                const updatedList = [...currentList];
                if (existingIndex >= 0) {
                    updatedList[existingIndex] = resolved;
                } else {
                    updatedList.push(resolved);
                }
                state.flangeList = updatedList;
            })

            // Handle createFlange (POST request)
            .addCase(createFlange.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createFlange.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createFlangeResult = action.payload;
            })
            .addCase(createFlange.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle editArea (PUT request)
            .addCase(updateFlange.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateFlange.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload?.data || action.payload;
                if (updatedTable?.id) {
                    state.flangeList = state.flangeList.map((table: any) =>
                        table.id === updatedTable.id ? updatedTable : table
                    );
                }
            })
            .addCase(updateFlange.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteFlange (DELETE request)
            .addCase(deleteFlange.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteFlange.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedFlange = action.payload;
                const deletedId = typeof deletedFlange === 'number' ? deletedFlange : deletedFlange?.id;
                if (typeof deletedId === 'number') {
                    state.flangeList = state.flangeList.filter(
                        (flange: any) => flange.id !== deletedId
                    );
                    state.pagination.total = Math.max(0, state.pagination.total - 1);
                }
            })
            .addCase(deleteFlange.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default flangeSlice.reducer;
