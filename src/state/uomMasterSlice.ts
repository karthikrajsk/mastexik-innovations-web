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
    uomList: any;
    createUomMasterResult: any;
    checking: boolean,
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    uomList: [],
    createUomMasterResult: null,
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


// Thunk for getAllUomMaster GET API call
export const getAllUomMaster = createAsyncThunk(
    'uom/getAllUomMaster',
    async (params: any = {}, thunkAPI) => {
        try {
            const { limit = 10, offset = 0, fetchAll = false } = params;
            const queryParams = new URLSearchParams();
            if (!fetchAll) {
                queryParams.append('limit', limit);
                queryParams.append('offset', offset);
            } else {
                queryParams.append('limit', '10000');
                queryParams.append('offset', '0');
            }
            const response = await apiService.get(`/uom?${queryParams}`);
            console.log(response)
            const data = response?.data?.data;
            const responseOffset = response?.data?.offset || offset || 0;
            const responseLimit = response?.data?.limit || limit || 10;
            const responseTotal = response?.data?.total || (Array.isArray(data) ? data.length : 0);
            const nextOffset = responseOffset + responseLimit;
            
            const pagination = {
              total: responseTotal,
              limit: responseLimit,
              offset: responseOffset,
              next: response?.data?.next !== undefined ? response?.data?.next : (nextOffset < responseTotal),
              prev: response?.data?.prev !== undefined ? response?.data?.prev : (responseOffset > 0),
            };
            return { data: Array.isArray(data) ? data : [], pagination };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createUom POST API call
export const createUom: any = createAsyncThunk(
    'uom/createUom',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/uom", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === "success") {
                toast.success("Saved Successfully");
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

// Thunk for updateUom PUT API call
export const updateUom: any = createAsyncThunk(
    'uom/updateUom',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/uom/${params.id}`, params); // ✅ Fix: Add ID to the URL
            console.log(response);
            if (response?.status === "success") {
                toast.success("Updated Successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
                const errorMessage = resolveApiErrorMessage(error, "Failed to update uom");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);     
        }
    }
);

// export const deleteUom: any = createAsyncThunk(
//     'uom/deleteUom',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/uom/${id}`);
//             console.log(response); // Check what the API actually returns
//             if (response?.isSuccess) {
//                 // toast.success("Successfully deleted");
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
export const deleteUom = createAsyncThunk(
    'uom/deleteUom',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/uom/${id}`);

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
const uomSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllUomMaster (GET request)
            .addCase(getAllUomMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllUomMaster.fulfilled, (state: any, action) => {
                state.loading = false;
                state.uomList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllUomMaster.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createUom (POST request)
            .addCase(createUom.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createUom.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createUomMasterResult = action.payload;
            })
            .addCase(createUom.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateUom (PUT request)
            .addCase(updateUom.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUom.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.uomList = state.uomList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateUom.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteUom (DELETE request)
            .addCase(deleteUom.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteUom.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.uomList = state.uomList.filter(
                    (terms: any) => terms.id !== deletedId
                );
            })
            .addCase(deleteUom.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default uomSlice.reducer;
