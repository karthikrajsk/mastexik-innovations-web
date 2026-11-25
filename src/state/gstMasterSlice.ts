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
    gstList: any;
    createGstMasterResult: any;
    checking: boolean,
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    gstList: [],
    createGstMasterResult: null,
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

// Thunk for getAllGstMaster GET API call
export const getAllGstMaster = createAsyncThunk(
  'gst/getAllGstMaster',
  async (
    params: { limit?: number; offset?: number; fetchAll?: boolean } = {},
    thunkAPI
  ) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.fetchAll) {
        queryParams.append('limit', '10000');
        queryParams.append('offset', '0');
      } else {
        if (params.limit !== undefined)
          queryParams.append('limit', String(params.limit));
        if (params.offset !== undefined)
          queryParams.append('offset', String(params.offset));
      }

      const queryString = queryParams.toString();
      const url = queryString ? `/gst?${queryString}` : `/gst`;

      const response = await apiService.get(url);
      console.log(response);

      const responseData = response?.data;
      const data = responseData?.data || [];

      // Support both root-level and nested pagination
      const paginationSource =
        responseData?.pagination || responseData;

      return {
        data: Array.isArray(data) ? data : [],
        pagination: {
          total: paginationSource?.total || 0,
          limit: paginationSource?.limit || 10,
          offset: paginationSource?.offset || 0,
          next: paginationSource?.next || false,
          prev: paginationSource?.prev || false,
        },
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Thunk for createGst POST API call
export const createGst: any = createAsyncThunk(
    'gst/createGst',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/gst", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === 'success') {
                toast.success(response?.message);
                return response;
            } else {
                const errorMessage = "Something went wrong";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
           const errorMessage = resolveApiErrorMessage(error, "Failed to create GST");
                                   toast.error(errorMessage);
                                   return thunkAPI.rejectWithValue(errorMessage);   
        }
    }
);

// Thunk for updateGst PUT API call
export const updateGst: any = createAsyncThunk(
    'gst/updateGst',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/gst/${params.id}`, params); // ✅ Fix: Add ID to the URL
            console.log(response);
            if (response?.status === 'success') {
                toast.success(response?.message);
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to update GST");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// export const deleteGst: any = createAsyncThunk(
//     'gst/deleteGst',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/gst/${id}`);
//             console.log(response); // Check what the API actually returns
//             if (response?.status === 'success') {
//                 toast.success(response?.message);
//                 return response;
//             } else {
//                 const errorMessage = "Something went wrong";
//                 toast.error(errorMessage);
//                 return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );
export const deleteGst = createAsyncThunk(
    'gst/deleteGst',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/gst/${id}`);

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


// Create uom Slice 
const gstSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllGstMaster (GET request)
            .addCase(getAllGstMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllGstMaster.fulfilled, (state: any, action) => {
                state.loading = false;
                state.gstList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllGstMaster.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createGst (POST request)
            .addCase(createGst.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGst.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createGstMasterResult = action.payload;
            })
            .addCase(createGst.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateGst (PUT request)
            .addCase(updateGst.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateGst.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.gstList = state.gstList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateGst.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteGst (DELETE request)
            .addCase(deleteGst.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteGst.fulfilled, (state: any, action) => {
                state.loading = false;
                const deleteduom = action.payload;
                state.gstList = state.gstList.filter(
                    (terms: any) => terms.id !== deleteduom.id
                );
            })
            .addCase(deleteGst.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default gstSlice.reducer;
