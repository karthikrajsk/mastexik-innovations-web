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
    stateList: any;
    createStateResult: any;
    checking: boolean,
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    stateList: [],
    createStateResult: null,
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

// // Thunk for getAllStates GET API call
// export const getAllStates = createAsyncThunk(
//     'state/getAllStates',
//     async (params: { limit?: number; offset?: number; fetchAll?: boolean } = {}, thunkAPI) => {
//         try {
//             const queryParams = new URLSearchParams();
//             if (params.fetchAll) {
//                 queryParams.append('limit', '10000');
//                 queryParams.append('offset', '0');
//             } else {
//                 if (params.limit) queryParams.append('limit', String(params.limit));
//                 if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
//             }
//             const queryString = queryParams.toString();
//             const url = queryString ? `/state?${queryString}` : "/state";
            
//             const response = await apiService.get(url);
//             console.log(response)
//             const data = response?.data?.data;
//             const pagination = response?.data?.pagination || {
//                 total: data?.length || 0,
//                 limit: params.limit || 10,
//                 offset: params.offset || 0,
//                 next: false,
//                 prev: false,
//             };
//             return { data: data || [], pagination };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// Thunk for getAllStates GET API call
export const getAllStates = createAsyncThunk(
  "state/getAllStates",
  async (
    params: { limit?: number; offset?: number; fetchAll?: boolean } = {},
    thunkAPI
  ) => {
    try {
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
      const url = queryString ? `/state?${queryString}` : "/state"

      const response = await apiService.get(url)
      console.log(response)

      // ✅ Same structure as getAllCurrencies
      const paginationData = response?.data

      const data = Array.isArray(paginationData?.data)
        ? paginationData.data
        : []

      return {
        data,
        pagination: {
          total: paginationData?.total || 0,
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


// Thunk for createState POST API call
export const createState: any = createAsyncThunk(
    'state/createState',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/state", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === 'success') {
                toast.success("Saved Successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            
 const errorMessage = resolveApiErrorMessage(error, "Failed to create state");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for updateState PUT API call
export const updateState: any = createAsyncThunk(
    'state/updateState',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/state/${params.id}`, params); // ✅ Fix: Add ID to the URL
            console.log(response);
            if (response?.status === 'success') {
                toast.success("Updated Successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            // return thunkAPI.rejectWithValue(error.message);
 const errorMessage = resolveApiErrorMessage(error, "Failed to update state");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// export const deleteState: any = createAsyncThunk(
//     'state/deleteState',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/state/${id}`);
//             console.log(response); // Check what the API actually returns
//             if (response?.status === 'success') {
//                 toast.success("Successfully deleted");
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
export const deleteState = createAsyncThunk(
    'state/deleteState',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/state/${id}`);

            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return id; // Return the deleted ID for reducer handling
            }

            // Handle API error response
            const errorMessage = response.data.data?.message || 'Failed to delete category';
            toast.error(errorMessage);
            return response;

        } catch (error: any) {
            // Handle network errors or unexpected errors
            let errorMessage = 'An error occurred while deleting the category';

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


// Create State Slice
const stateSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllStates (GET request)
            .addCase(getAllStates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllStates.fulfilled, (state: any, action) => {
                state.loading = false;
                state.stateList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllStates.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createState (POST request)
            .addCase(createState.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createState.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createStateResult = action.payload;
            })
            .addCase(createState.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateState (PUT request)
            .addCase(updateState.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateState.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.stateList = state.stateList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateState.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteState (DELETE request)
            .addCase(deleteState.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteState.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedState = action.payload;
                state.stateList = state.stateList.filter(
                    (state: any) => state.id !== deletedState.id
                );
            })
            .addCase(deleteState.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default stateSlice.reducer;
