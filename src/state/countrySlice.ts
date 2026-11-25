import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface PaginationState {
    total: number;
    limit: number;
    offset: number;
    next: number | null;
    prev: number | null;
}

export interface ApiState {
    loading: boolean;
    error: string | null;
    countryList: any;
    createCountryResult: any;
    checking: boolean,
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    countryList: [],
    createCountryResult: null,
    checking: false,
    pagination: {
        total: 0,
        limit: 10,
        offset: 0,
        next: null,
        prev: null,
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


// // Thunk for search_area POST API call
// export const getAllCountries = createAsyncThunk(
//     'country/getAllCountries',
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
//             const url = queryString ? `/country?${queryString}` : "/country";
            
//             const response = await apiService.get(url);
//             console.log(response)
//             const data = response?.data?.data;
//             const pagination = response?.data?.pagination || {
//                 total: data?.length || 0,
//                 limit: params.limit || 10000,
//                 offset: params.offset || 0,
//                 next: null,
//                 prev: null,
//             };
//             return { data: data || [], pagination };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

export const getAllCountries = createAsyncThunk(
  "country/getAllCountries",
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
      const url = queryString ? `/country?${queryString}` : "/country"

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


// Thunk for create_area POST API call
export const createCountry: any = createAsyncThunk(
    'country/createCountry',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/country", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === 'success') {
                toast.success("Saved Successfully");
                return response;
            } else {
                 const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                       toast.error(errorMessage);
                       return thunkAPI.rejectWithValue(errorMessage)
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to create country");
                                    toast.error(errorMessage);
                                    return thunkAPI.rejectWithValue(errorMessage);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for updateCountry PUT API call
export const updateCountry: any = createAsyncThunk(
    'country/updateCountry',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/country/${params.id}`, params); // ✅ Fix: Add ID to the URL
            console.log(response);
            if (response?.status === 'success') {
                toast.success("Updated Successfully");
                return response;
            } else {
               const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
                     toast.error(errorMessage);
                     return thunkAPI.rejectWithValue(errorMessage)
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to update country");
                                    toast.error(errorMessage);
                                    return thunkAPI.rejectWithValue(errorMessage);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// export const deleteCountry: any = createAsyncThunk(
//     'country/deleteCountry',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/country/${id}`);
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

export const deleteCountry = createAsyncThunk(
    'country/deleteCountry',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/country/${id}`);

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


// Create Country Slice
const countrySlice = createSlice({
    name: "country",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllCountries (GET request)
            .addCase(getAllCountries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllCountries.fulfilled, (state: any, action) => {
                state.loading = false;
                state.countryList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllCountries.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createCountry (POST request)
            .addCase(createCountry.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCountry.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createCountryResult = action.payload;
            })
            .addCase(createCountry.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle editArea (PUT request)
            .addCase(updateCountry.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCountry.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.countryList = state.countryList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateCountry.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteCountry (DELETE request)
            .addCase(deleteCountry.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCountry.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedCountry = action.payload;
                state.countryList = state.countryList.filter(
                    (country: any) => country.id !== deletedCountry.id
                );
            })
            .addCase(deleteCountry.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default countrySlice.reducer;
