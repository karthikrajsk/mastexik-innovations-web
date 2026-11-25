// import apiService from "@/services/ApiService";
// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";

// export interface ApiState {
//     loading: boolean;
//     error: string | null;
//     categoryList: any;
//     createCategoryResult: any;
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
//     categoryList: [],
//     createCategoryResult: null,
//     checking: false,
//     pagination: {
//         total: 0,
//         limit: 10,
//         offset: 0,
//         next: false,
//         prev: false,
//     }
// };

// // Thunk for getAllCategories GET API call
// export const getAllCategories = createAsyncThunk(
//     'category/getAllCategories',
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
//             const url = queryString ? `/category?${queryString}` : "/category";
            
//             const response = await apiService.get(url);
//             const paginationData = response?.data;
//             const data = paginationData?.data || [];
//             return {
//                 data,
//                 pagination: {
//                     total: paginationData?.total || 0,
//                     limit: paginationData?.limit || 10000,
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

// // Thunk for createCategory POST API call
// export const createCategory: any = createAsyncThunk(
//     'category/createCategory',
//     async (params: any, thunkAPI) => {
//         try {
//             const response = await apiService.post("/category", params); // Adjust API endpoint if needed
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

// // Thunk for updateCategory PUT API call
// export const updateCategory: any = createAsyncThunk(
//     'category/updateCategory',
//     async (params: any, thunkAPI) => {
//         console.log(params);
//         try {
//             const response = await apiService.put(`/category/${params.id}`, params); // ✅ Fix: Add ID to the URL
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

// // export const deleteCategory: any = createAsyncThunk(
// //     'category/deleteCategory',
// //     async (id: number, thunkAPI) => {
// //         try {
// //             const response = await apiService.delete(`/category/${id}`);
// //             console.log(response); // Check what the API actually returns
// //             if (response?.status === 'success') {
// //                 toast.success("Successfully deleted");
// //                 return response;
// //             } if (response?.status === 'error') {
// //                 toast.error(response?.data?.message);
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
// export const deleteCategory = createAsyncThunk(
//     'category/deleteCategory',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/category/${id}`);

//             if (response?.status === 'success') {
//                 toast.success('Category deleted successfully');
//                 return id; // Return the deleted ID for reducer handling
//             }

//             // Handle API error response
//             const errorMessage = response.data.data?.message || 'Failed to delete category';
//             toast.error(errorMessage);
//             return response;

//         } catch (error: any) {
//             // Handle network errors or unexpected errors
//             let errorMessage = 'An error occurred while deleting the category';

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


// // Create Category Slice
// const categorySlice = createSlice({
//     name: "state",
//     initialState,
//     reducers: {}, // No normal reducers for now
//     extraReducers: (builder) => {
//         builder

//             // Handle getAllCategories (GET request)
//             .addCase(getAllCategories.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(getAllCategories.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 state.categoryList = action.payload.data;
//                 state.pagination = action.payload.pagination;
//             })
//             .addCase(getAllCategories.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle createCategory (POST request)
//             .addCase(createCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(createCategory.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.createCategoryResult = action.payload;
//             })
//             .addCase(createCategory.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle updateCategory (PUT request)
//             .addCase(updateCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(updateCategory.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 const updatedTable = action.payload;
//                 state.categoryList = state.categoryList.map((table: any) =>
//                     table.id === updatedTable.id ? updatedTable : table
//                 );
//             })
//             .addCase(updateCategory.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle deleteCategory (DELETE request)
//             .addCase(deleteCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(deleteCategory.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 const deleted = action.payload;
//                 const deletedId = typeof deleted === 'number' ? deleted : deleted?.id;
//                 if (typeof deletedId === 'number') {
//                     state.categoryList = state.categoryList.filter(
//                         (category: any) => category.id !== deletedId
//                     );
//                     state.pagination.total = Math.max(0, state.pagination.total - 1);
//                 }
//             })
//             .addCase(deleteCategory.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//     },
// });

// // Export reducer
// export default categorySlice.reducer;
import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    categoryList: any;
    createCategoryResult: any;
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
    categoryList: [],
    createCategoryResult: null,
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

// Thunk for getAllCategories GET API call
export const getAllCategories = createAsyncThunk(
    'category/getAllCategories',
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
            if (params.activeOnly) queryParams.append('activeOnly', 'true');
            if (params.includeId) queryParams.append('includeId', String(params.includeId));
            const queryString = queryParams.toString();
            const url = queryString ? `/category?${queryString}` : "/category";
            
            const response = await apiService.get(url);
            const paginationData = response?.data;
            const data = paginationData?.data || (Array.isArray(response?.data) ? response.data : []);
            return {
                data,
                pagination: {
                    total: paginationData?.total || response?.total || data?.length || 0,
                    limit: paginationData?.limit || response?.limit || params.limit || 10,
                    offset: paginationData?.offset || response?.offset || params.offset || 0,
                    next: paginationData?.next ?? response?.next ?? null,
                    prev: paginationData?.prev ?? response?.prev ?? null,
                }
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createCategory POST API call
export const createCategory: any = createAsyncThunk(
    'category/createCategory',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/category", params); // Adjust API endpoint if needed
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
             const errorMessage = resolveApiErrorMessage(error, "Failed to create category");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for updateCategory PUT API call
export const updateCategory: any = createAsyncThunk(
    'category/updateCategory',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/category/${params.id}`, params); // ✅ Fix: Add ID to the URL
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
             const errorMessage = resolveApiErrorMessage(error, "Failed to update category");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// export const deleteCategory: any = createAsyncThunk(
//     'category/deleteCategory',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/category/${id}`);
//             console.log(response); // Check what the API actually returns
//             if (response?.status === 'success') {
//                 toast.success("Successfully deleted");
//                 return response;
//             } if (response?.status === 'error') {
//                 toast.error(response?.data?.message);
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
export const deleteCategory = createAsyncThunk(
    'category/deleteCategory',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/category/${id}`);

            if (response?.status === 'success') {
                toast.success('Category deleted successfully');
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


// Create Category Slice
const categorySlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllCategories (GET request)
            .addCase(getAllCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllCategories.fulfilled, (state: any, action) => {
                state.loading = false;
                state.categoryList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllCategories.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createCategory (POST request)
            .addCase(createCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCategory.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createCategoryResult = action.payload;
            })
            .addCase(createCategory.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateCategory (PUT request)
            .addCase(updateCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCategory.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.categoryList = state.categoryList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateCategory.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteCategory (DELETE request)
            .addCase(deleteCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCategory.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedCategory = action.payload;
                state.categoryList = state.categoryList.filter(
                    (category: any) => category.id !== deletedCategory.id
                );
            })
            .addCase(deleteCategory.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default categorySlice.reducer;