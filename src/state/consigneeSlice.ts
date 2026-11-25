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
    consigneeList: any;
    createConsigneeresult: any;
    checking: boolean,
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    consigneeList: [],
    createConsigneeresult: null,
    checking: false,
    pagination: {
      total: 0,
      limit: 10,
      offset: 0,
      next: false,
      prev: false,
    },
};

// // Thunk for getAllConsignee GET API call
// export const getAllConsignee = createAsyncThunk(
//     'consignee/getAllConsignee',
//     async (params: any = {}, thunkAPI) => {
//         try {
//             const { limit = 10, offset = 0, fetchAll = false } = params;
//             const queryParams = new URLSearchParams();
//             if (!fetchAll) {
//                 queryParams.append('limit', limit);
//                 queryParams.append('offset', offset);
//             } else {
//                 queryParams.append('limit', '10000');
//                 queryParams.append('offset', '0');
//             }
//             const response = await apiService.get(`/consignee?${queryParams}`);
//             console.log("Consignee API Response:", response);
            
//             // Extract data array from various possible structures
//             let data = [];
//             if (response?.data && Array.isArray(response.data.data)) {
//                 data = response.data.data;
//             } else if (Array.isArray(response?.data)) {
//                 data = response.data;
//             } else if (response?.data?.data && !Array.isArray(response.data.data)) {
//                 // Handle case where it's double nested but we need to go deeper? 
//                 // Unlikely but based on user JSON: response.data.data is an object containing a data array
//                 if (Array.isArray(response.data.data.data)) {
//                     data = response.data.data.data;
//                 }
//             } else if (Array.isArray(response)) {
//                 data = response;
//             }

//             const pagination = response?.pagination || response?.data?.pagination || {
//               total: Array.isArray(data) ? data.length : 0,
//               limit,
//               offset,
//               next: false,
//               prev: false,
//             };
//             return { data: Array.isArray(data) ? data : [], pagination };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );


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

export const getAllConsignee = createAsyncThunk(
  "consignee/getAllConsignee",
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
      const url = queryString ? `/consignee?${queryString}` : "/consignee"

      const response = await apiService.get(url)
      console.log("Consignee API Response:", response)

      const paginationData = response?.data

      let data: any[] = []

      // Same defensive extraction, but cleaner order
      if (Array.isArray(paginationData?.data)) {
        data = paginationData.data
      } else if (Array.isArray(paginationData)) {
        data = paginationData
      } else if (Array.isArray(paginationData?.data?.data)) {
        data = paginationData.data.data
      }

      return {
        data,
        pagination: {
          total: paginationData?.total || data.length || 0,
          limit: paginationData?.limit || (params.limit ?? 10),
          offset: paginationData?.offset || (params.offset ?? 0),
          next: paginationData?.next || false,
          prev: paginationData?.prev || false,
        }
      }

    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
);


// Thunk for createConsignee POST API call
export const createConsignee: any = createAsyncThunk(
    'consignee/createConsignee',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/consignee", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === 'success') {
                toast.success(response?.message);
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
                                    toast.error(errorMessage);
                                    return thunkAPI.rejectWithValue(errorMessage); 
        }
    }
);

// Thunk for updateConsignee PUT API call
export const updateConsignee: any = createAsyncThunk(
    'consignee/updateConsignee',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/consignee/${params.id}`, params); // ✅ Fix: Add ID to the URL
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
           const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
                                   toast.error(errorMessage);
                                   return thunkAPI.rejectWithValue(errorMessage); 
        }
    }
);

// export const deleteConsignee: any = createAsyncThunk(
//     'consignee/deleteConsignee',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/consignee/${id}`);
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
export const deleteConsignee = createAsyncThunk(
    'consignee/deleteConsignee',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/consignee/${id}`);

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



// Create consignee Slice
const consigneeSlice = createSlice({
    name: "consignee",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllConsignee (GET request)
            .addCase(getAllConsignee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllConsignee.fulfilled, (state: any, action) => {
                state.loading = false;
                state.consigneeList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllConsignee.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createConsignee (POST request)
            .addCase(createConsignee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createConsignee.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createConsigneeresult = action.payload;
            })
            .addCase(createConsignee.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateConsignee (PUT request)
            .addCase(updateConsignee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateConsignee.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.consigneeList = state.consigneeList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateConsignee.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteConsignee (DELETE request)
            .addCase(deleteConsignee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteConsignee.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.consigneeList = state.consigneeList.filter(
                    (consignee: any) => consignee.id !== deletedId
                );
            })
            .addCase(deleteConsignee.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default consigneeSlice.reducer;
