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
    warehouseList: any;
    createWarehouseResult: any;
    checking: boolean,
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    warehouseList: [],
    createWarehouseResult: null,
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

// export const getAllWarehouse = createAsyncThunk(
//     'warehouse/getAllWarehouse',
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
//             const response = await apiService.get(`/warehouse?${queryParams}`);
//             console.log(response)
//             const data = response?.data?.data;
//             const apiPagination = response?.data?.pagination;
//             const pagination = {
//               total: apiPagination?.total, // Use total from API if available
//               limit,
//               offset,
//               next: apiPagination?.next || false,
//               prev: apiPagination?.prev || false,
//               fetchAll
//             };
//             return { data: Array.isArray(data) ? data : [], pagination };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );
export const getAllWarehouse = createAsyncThunk(
  "warehouse/getAllWarehouse",
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
      const url = queryString ? `/warehouse?${queryString}` : `/warehouse`

      const response = await apiService.get(url)

      // 🔹 Same handling pattern as getAllCurrencies
      const paginationData = response?.data

      const rawArray =
        Array.isArray(paginationData?.data)
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
)

// Thunk for create_area POST API call
export const createWarehouse: any = createAsyncThunk(
    'warehouse/createWarehouse',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/warehouse", params); // Adjust API endpoint if needed
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
          const errorMessage = resolveApiErrorMessage(error, "Failed to create warehouse");
                      toast.error(errorMessage);
                      return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for updateWarehouse PUT API call
export const updateWarehouse: any = createAsyncThunk(
    'warehouse/updateWarehouse',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/warehouse/${params.id}`, params); // ✅ Fix: Add ID to the URL
            console.log(response);
            if (response?.status === 'success') {
                toast.success(response?.message);
                return response;
            } else {
                  const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage)
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to update warehouse");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// export const deleteWarehouse: any = createAsyncThunk(
//     'warehouse/deleteWarehouse',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/warehouse/${id}`);
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
export const deleteWarehouse = createAsyncThunk(
    'warehouse/deleteWarehouse',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/warehouse/${id}`);

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


// Create warehouseSlice
const warehouseSlice = createSlice({
    name: "warehouse",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllWarehouse (GET request)
            .addCase(getAllWarehouse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllWarehouse.fulfilled, (state: any, action) => {
                state.loading = false;
                state.warehouseList = action.payload.data;
                state.pagination = action.payload.pagination;

                // const { pagination, data } = action.payload;
                // state.pagination = {
                //     ...state.pagination,
                //     ...pagination,
                //     total: pagination.total !== undefined 
                //            ? pagination.total 
                //            : (pagination.fetchAll ? data.length : state.pagination.total)
                // };
            })
            .addCase(getAllWarehouse.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createWarehouse (POST request)
            .addCase(createWarehouse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createWarehouse.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createWarehouseResult = action.payload;
            })
            .addCase(createWarehouse.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle editArea (PUT request)
            .addCase(updateWarehouse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateWarehouse.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.warehouseList = state.warehouseList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateWarehouse.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteWarehouse (DELETE request)
            .addCase(deleteWarehouse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteWarehouse.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.warehouseList = state.warehouseList.filter(
                    (warehouse: any) => warehouse.id !== deletedId
                );
            })
            .addCase(deleteWarehouse.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default warehouseSlice.reducer;
