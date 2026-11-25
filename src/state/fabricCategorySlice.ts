// import apiService from "@/services/ApiService";
// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";

// export interface ApiState {
//     loading: boolean;
//     error: string | null;
//     fabricCategoryList: any;
//     fabricCategoryFullList: any;

//     creatFabricCategoryResult: any;
//     checking: boolean,
//     pagination: {
//         total: number;
//         limit: number;
//         offset: number;
//         next: boolean;
//         prev: boolean;
//     }
// }

// const initialState: ApiState = {
//     loading: false,
//     error: null,
//     fabricCategoryList: [],
//     fabricCategoryFullList: [],

//     creatFabricCategoryResult: null,
//     checking: false,
//     pagination: {
//         total: 0,
//         limit: 10,
//         offset: 0,
//         next: false,
//         prev: false,
//     }
// };

// // Thunk for getAllFabricCategory GET API call
// export const getAllFabricCategory = createAsyncThunk(
//     'fabric-category/getAllFabricCategory',
//     async (params: { limit?: number; offset?: number; fetchAll?: boolean; activeOnly?: boolean; includeId?: number } = {}, thunkAPI) => {
//         try {
//             const queryParams = new URLSearchParams();
//             if (params.fetchAll) {
//                 queryParams.append('limit', '10000');
//                 queryParams.append('offset', '0');
//             } else {
//                 if (params.limit) queryParams.append('limit', String(params.limit));
//                 if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
//             }
//             if (params.activeOnly !== undefined) queryParams.append('activeOnly', String(params.activeOnly));
//             if (params.includeId !== undefined) queryParams.append('includeId', String(params.includeId));
//             const queryString = queryParams.toString();
//             const url = queryString ? `/fabric-category?${queryString}` : "/fabric-category";

//             const response = await apiService.get(url);
//             const paginationData = response?.data;
//             const data = paginationData?.data || [];
//             return {
//                 data,
//                 pagination: {
//                     total: paginationData?.total || 0,
//                     limit: paginationData?.limit || 10,
//                     offset: paginationData?.offset || 0,
//                     next: paginationData?.next || false,
//                     prev: paginationData?.prev || false,
//                 }
//             };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// // Thunk for createFabricCategory POST API call
// export const createFabricCategory: any = createAsyncThunk(
//     'fabric-category/createFabricCategory',
//     async (params: any, thunkAPI) => {
//         try {
//             const response = await apiService.post("/fabric-category", params); // Adjust API endpoint if needed
//             console.log(response)
//             if (response?.status === 'success') {
//                 toast.success("Saved Successfully");
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

// // Thunk for updateFabricCategory PUT API call
// export const updateFabricCategory: any = createAsyncThunk(
//     'fabric-category/updateFabricCategory',
//     async (params: any, thunkAPI) => {
//         console.log(params);
//         try {
//             const response = await apiService.put(`/fabric-category/${params.id}`, params); // ✅ Fix: Add ID to the URL
//             console.log(response);
//             if (response?.status === 'success') {
//                 toast.success("Updated Successfully");
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

// // export const deleteFabricCategory: any = createAsyncThunk(
// //     'fabric-category/deleteFabricCategory',
// //     async (id: number, thunkAPI) => {
// //         try {
// //             const response = await apiService.delete(`/fabric-category/${id}`);
// //             console.log(response); // Check what the API actually returns
// //             if (response?.status === 'success') {
// //                 toast.success("Successfully deleted");
// //                 return response;
// //             } else {
// //                 const errorMessage = "Something went wrong";
// //                 // toast.error(errorMessage);
// //                 return thunkAPI.rejectWithValue(errorMessage);
// //             }
// //         } catch (error: any) {
// //             return thunkAPI.rejectWithValue(error.message);
// //         }
// //     }
// // );
// export const deleteFabricCategory = createAsyncThunk(
//     'fabric-category/deleteFabricCategory',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/fabric-category/${id}`);

//             if (response?.status === 'success') {
//                 toast.success("Successfully deleted");
//                 return id; // Return the deleted ID for reducer handling
//             }

//             // Handle API error response
//             const errorMessage = response.data.data?.message || 'Failed to delete';
//             toast.error(errorMessage);
//             return response;

//         } catch (error: any) {
//             // Handle network errors or unexpected errors
//             let errorMessage = 'An error occurred while deleting';

//             if (error.response) {
//                 // Server responded with a status code outside 2xx range
//                 errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
//             } else if (error.request) {
//                 // Request was made but no response received
//                 errorMessage = 'No response from server';
//             }

//             toast.error(errorMessage);
//             return errorMessage;
//         }
//     }
// );

// // Create FabricCategory Slice
// const fabricCategorySlice = createSlice({
//     name: "state",
//     initialState,
//     reducers: {}, // No normal reducers for now
//     extraReducers: (builder) => {
//         builder

//             // Handle getAllFabricCategory (GET request)
//             .addCase(getAllFabricCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             // .addCase(getAllFabricCategory.fulfilled, (state: any, action) => {
//             //     state.loading = false;
//             //     state.fabricCategoryList = action.payload.data;
//             //     state.pagination = action.payload.pagination;
//             // })
//             .addCase(getAllFabricCategory.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 if (action.meta.arg?.fetchAll || action.meta.arg?.activeOnly) {
//                     state.fabricCategoryFullList = action.payload.data;
//                 } else {
//                     state.fabricCategoryList = action.payload.data;
//                     state.pagination = action.payload.pagination;
//                 }
//             })
//             .addCase(getAllFabricCategory.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle createFabricCategory (POST request)
//             .addCase(createFabricCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(createFabricCategory.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.creatFabricCategoryResult = action.payload;
//             })
//             .addCase(createFabricCategory.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle updateFabricCategory (PUT request)
//             .addCase(updateFabricCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(updateFabricCategory.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 const updatedTable = action.payload;
//                 state.fabricCategoryList = state.fabricCategoryList.map((table: any) =>
//                     table.id === updatedTable.id ? updatedTable : table
//                 );
//             })
//             .addCase(updateFabricCategory.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle deleteFabricCategory (DELETE request)
//             .addCase(deleteFabricCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(deleteFabricCategory.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 const deletedFabricType = action.payload;
//                 state.fabricCategoryList = state.fabricCategoryList.filter(
//                     (ftype: any) => ftype.id !== deletedFabricType.id
//                 );
//             })
//             .addCase(deleteFabricCategory.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//     },
// });

// // Export reducer
// export default fabricCategorySlice.reducer;
import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    fabricCategoryList: any;
    fabricCategoryFullList: any;
    creatFabricCategoryResult: any;
    checking: boolean,
    pagination: {
        total: number;
        limit: number;
        offset: number;
        next: any;
        prev: any;
    }
}

const initialState: ApiState = {
    loading: false,
    error: null,
    fabricCategoryList: [],
    fabricCategoryFullList: [],
    creatFabricCategoryResult: null,
    checking: false,
    pagination: {
        total: 0,
        limit: 10,
        offset: 0,
        next: null,
        prev: null,
    }
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
// Thunk for getAllFabricCategory GET API call
export const getAllFabricCategory = createAsyncThunk(
    'fabric-category/getAllFabricCategory',
    async (params: { limit?: number; offset?: number; fetchAll?: boolean; activeOnly?: boolean; includeId?: number } = {}, thunkAPI) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.fetchAll) {
                queryParams.append('limit', '10000');
                queryParams.append('offset', '0');
            } else {
                if (params.limit) queryParams.append('limit', String(params.limit));
                if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
            }
            if (params.activeOnly !== undefined) queryParams.append('activeOnly', String(params.activeOnly));
            if (params.includeId !== undefined) queryParams.append('includeId', String(params.includeId));
            const queryString = queryParams.toString();
            const url = queryString ? `/fabric-category?${queryString}` : "/fabric-category";
            
            const response = await apiService.get(url);
            console.log('[getAllFabricCategory] Full response:', response)
            
            let data = []
            if (response?.data?.data && Array.isArray(response.data.data)) {
                data = response.data.data
            } else if (response?.data && Array.isArray(response.data)) {
                data = response.data
            } else if (Array.isArray(response)) {
                data = response
            } else if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
                data = response.data.data.data
            }

            return {
                data: Array.isArray(data) ? data : [],
                pagination: {
                    total: response?.total || response?.data?.total || response?.data?.data?.total || data?.length || 0,
                    limit: response?.limit || response?.data?.limit || response?.data?.data?.limit || params.limit || 10,
                    offset: response?.offset || response?.data?.offset || response?.data?.data?.offset || params.offset || 0,
                    next: response?.next ?? response?.data?.next ?? response?.data?.data?.next ?? null,
                    prev: response?.prev ?? response?.data?.prev ?? response?.data?.data?.prev ?? null,
                }
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createFabricCategory POST API call
export const createFabricCategory: any = createAsyncThunk(
    'fabric-category/createFabricCategory',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/fabric-category", params); // Adjust API endpoint if needed
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
            const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
                                    toast.error(errorMessage);
                                    return thunkAPI.rejectWithValue(errorMessage);  
        }
    }
);

// Thunk for updateFabricCategory PUT API call
export const updateFabricCategory: any = createAsyncThunk(
    'fabric-category/updateFabricCategory',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/fabric-category/${params.id}`, params); // ✅ Fix: Add ID to the URL
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
            const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
                                    toast.error(errorMessage);
                                    return thunkAPI.rejectWithValue(errorMessage);  
        }
    }
);

// export const deleteFabricCategory: any = createAsyncThunk(
//     'fabric-category/deleteFabricCategory',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/fabric-category/${id}`);
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
export const deleteFabricCategory = createAsyncThunk(
    'fabric-category/deleteFabricCategory',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/fabric-category/${id}`);

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

// Create FabricCategory Slice
const fabricCategorySlice = createSlice({
    name: "fabricCategory",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllFabricCategory (GET request)
            .addCase(getAllFabricCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllFabricCategory.fulfilled, (state: any, action) => {
                state.loading = false;
                if (action.meta.arg?.fetchAll || action.meta.arg?.activeOnly) {
                    state.fabricCategoryFullList = action.payload.data;
                } else {
                    state.fabricCategoryList = action.payload.data;
                    state.pagination = action.payload.pagination;
                }
            })
            .addCase(getAllFabricCategory.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createFabricCategory (POST request)
            .addCase(createFabricCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createFabricCategory.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.creatFabricCategoryResult = action.payload;
            })
            .addCase(createFabricCategory.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateFabricCategory (PUT request)
            .addCase(updateFabricCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateFabricCategory.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.fabricCategoryList = state.fabricCategoryList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateFabricCategory.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteFabricCategory (DELETE request)
            .addCase(deleteFabricCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteFabricCategory.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedFabricType = action.payload;
                state.fabricCategoryList = state.fabricCategoryList.filter(
                    (ftype: any) => ftype.id !== deletedFabricType.id
                );
            })
            .addCase(deleteFabricCategory.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default fabricCategorySlice.reducer;