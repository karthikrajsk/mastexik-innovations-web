// import apiService from "@/services/ApiService";
// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";

// export interface ApiState {
//     loading: boolean;
//     error: string | null;
//     subCategoryList: any;
//     createSubCategoryResult: any;
//     subCategoryByCategoryList: any;
//     subCategoryByColourList: [],
//     subCategoryBySelvedgeList: [],
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
//     subCategoryList: [],
//     subCategoryByCategoryList: [],
//     subCategoryByColourList: [],
//     subCategoryBySelvedgeList: [],
//     createSubCategoryResult: null,
//     checking: false,
//     pagination: {
//         total: 0,
//         limit: 10,
//         offset: 0,
//         next: false,
//         prev: false,
//     }
// };

// // Thunk for getAllSubCategories GET API call
// // In your subCategorySlice.ts, update the getAllSubCategories thunk:
// export const getAllSubCategories = createAsyncThunk(
//     'sub-category/getAllSubCategories',
//     async (params: { limit?: number; offset?: number; fetchAll?: boolean } = {}, thunkAPI) => {
//         try {
//             const queryParams = new URLSearchParams();
            
//             // Always fetch all for dropdown usage
//             if (params.fetchAll || !params.limit) {
//                 queryParams.append('limit', '10000');
//                 queryParams.append('offset', '0');
//             } else {
//                 if (params.limit) queryParams.append('limit', String(params.limit));
//                 if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
//             }
            
//             const queryString = queryParams.toString();
//             const url = queryString ? `/sub-category?${queryString}` : "/sub-category";
            
//             const response = await apiService.get(url);
//             console.log('getAllSubCategories response:', response);
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


//   export const getSubCategoryByColor = createAsyncThunk(
//     "sub-category/getSubCategoryByColor",
//     async (params: { categoryName: string; fetchAll?: boolean } | string, thunkAPI) => {
//       try {
//         let categoryName = '';
//         const queryParams = new URLSearchParams();
        
//         if (typeof params === 'string') {
//           categoryName = params;
//         } else {
//           categoryName = params.categoryName;
//           // Always fetch all for dropdowns
//           if (params.fetchAll) {
//             queryParams.append('limit', '10000');
//             queryParams.append('offset', '0');
//           }
//         }
        
//         queryParams.append('categoryName', categoryName);
        
//         const response = await apiService.get(`/sub-category/by-category?${queryParams.toString()}`);
//         console.log('getSubCategoryByColor response:', response);
//         const data = response?.data?.data || [];
//         return data;
//       } catch (error: any) {
//         return thunkAPI.rejectWithValue(error.message);
//       }
//     }
//   );

//   export const getSubCategoryByCategory = createAsyncThunk(
//     "sub-category/getSubCategoryByCategory",
//     async (params: { categoryName: string; fetchAll?: boolean } | string, thunkAPI) => {
//       try {
//         let categoryName = '';
//         const queryParams = new URLSearchParams();
        
//         if (typeof params === 'string') {
//           categoryName = params;
//         } else {
//           categoryName = params.categoryName;
//           // Always fetch all for dropdowns
//           if (params.fetchAll) {
//             queryParams.append('limit', '10000');
//             queryParams.append('offset', '0');
//           }
//         }
        
//         queryParams.append('categoryName', categoryName);
        
//         const response = await apiService.get(`/sub-category/by-category?${queryParams.toString()}`);
//         console.log('getSubCategoryByCategory response:', response);
//         const data = response?.data?.data || [];
//         return data;
//       } catch (error: any) {
//         return thunkAPI.rejectWithValue(error.message);
//       }
//     }
//   );
  


// const resolveApiErrorMessage = (error: any, fallback: string) => {
//     const responseData = error?.response?.data;
//     const candidates: string[] = [];

//     if (typeof responseData === "string") {
//         candidates.push(responseData);
//     } else if (responseData) {
//         if (typeof responseData.message === "string") {
//             candidates.push(responseData.message);
//         }
//         if (typeof responseData.error === "string") {
//             candidates.push(responseData.error);
//         }
//         if (typeof responseData.data === "string") {
//             candidates.push(responseData.data);
//         }
//         if (responseData.data && typeof responseData.data === "object") {
//             if (typeof responseData.data.message === "string") {
//                 candidates.push(responseData.data.message);
//             }
//             if (typeof responseData.data.error === "string") {
//                 candidates.push(responseData.data.error);
//             }
//             if (Array.isArray(responseData.data.errors)) {
//                 responseData.data.errors.forEach((err: any) => {
//                     if (typeof err === "string") {
//                         candidates.push(err);
//                     } else if (typeof err?.message === "string") {
//                         candidates.push(err.message);
//                     }
//                 });
//             }
//         }
//         if (Array.isArray(responseData.errors)) {
//             responseData.errors.forEach((err: any) => {
//                 if (typeof err === "string") {
//                     candidates.push(err);
//                 } else if (typeof err?.message === "string") {
//                     candidates.push(err.message);
//                 }
//             });
//         }
//     }

//     const candidate = candidates.find((msg) => typeof msg === "string" && msg.trim());
//     return candidate || error?.message || fallback;
// };


// // Thunk for createSubCategory POST API call
// export const createSubCategory: any = createAsyncThunk(
//     'sub-category/createSubCategory',
//     async (params: any, thunkAPI) => {
//         try {
//             const response = await apiService.post("/sub-category", params);
//             console.log(response)
//             if (response?.status === 'success') {
//                 toast.success("Saved Successfully");
//                 return response;
//             } else {
//                 const errorMessage = "Something went wrong";
//                 toast.error(errorMessage);
//                 return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
//              const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
//                                     toast.error(errorMessage);
//             // toast.error(error.message || "Failed to save");
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// // Thunk for updateSubCategory PUT API call
// export const updateSubCategory: any = createAsyncThunk(
//     'sub-category/updateSubCategory',
//     async (params: any, thunkAPI) => {
//         console.log(params);
//         try {
//             const response = await apiService.put(`/sub-category/${params.id}`, params);
//             console.log(response);
//             if (response?.status === 'success') {
//                 toast.success("Updated Successfully");
//                 return response;
//             } else {
//                 const errorMessage = "Something went wrong";
//                 return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// export const deleteSubCategory: any = createAsyncThunk(
//     'sub-category/deleteSubCategory',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/sub-category/${id}`);
//             console.log(response);
//             if (response?.status === 'success') {
//                 toast.success("Successfully deleted");
//                 return response;
//             } else {
//                 const errorMessage = "Something went wrong";
//                 return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );


// // Create SubCategory Slice
// const subCategorySlice = createSlice({
//     name: "state",
//     initialState,
//     reducers: {},
//     extraReducers: (builder) => {
//         builder

//             // Handle getAllSubCategories (GET request)
//             .addCase(getAllSubCategories.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(getAllSubCategories.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 state.subCategoryList = action.payload.data;
//                 state.pagination = action.payload.pagination;
//             })
//             .addCase(getAllSubCategories.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle createSubCategory (POST request)
//             .addCase(createSubCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(createSubCategory.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.createSubCategoryResult = action.payload;
//             })
//             .addCase(createSubCategory.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle getSubCategoryByColor (GET request)
//              .addCase(getSubCategoryByColor.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(getSubCategoryByColor.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 state.subCategoryByColourList = action.payload;
//             })
//             .addCase(getSubCategoryByColor.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle getSubCategoryByCategory (GET request)
//              .addCase(getSubCategoryByCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(getSubCategoryByCategory.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 state.subCategoryByCategoryList = action.payload;
//             })
//             .addCase(getSubCategoryByCategory.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle updateSubCategory (PUT request)
//             .addCase(updateSubCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(updateSubCategory.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 const updatedTable = action.payload;
//                 state.subCategoryList = state.subCategoryList.map((table: any) =>
//                     table.id === updatedTable.id ? updatedTable : table
//                 );
//             })
//             .addCase(updateSubCategory.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle deleteSubCategory (DELETE request)
//             .addCase(deleteSubCategory.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(deleteSubCategory.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 const deletedSubCategory = action.payload;
//                 state.subCategoryList = state.subCategoryList.filter(
//                     (subCategory: any) => subCategory.id !== deletedSubCategory.id
//                 );
//             })
//             .addCase(deleteSubCategory.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//     },
// });

// // Export reducer
// export default subCategorySlice.reducer;

import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    subCategoryList: any;
    createSubCategoryResult: any;
    subCategoryByCategoryList: any;
    subCategoryByColourList: [],
    subCategoryBySelvedgeList: [],
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
    subCategoryList: [],
    subCategoryByCategoryList: [],
    subCategoryByColourList: [],
    subCategoryBySelvedgeList: [],
    createSubCategoryResult: null,
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

// Thunk for getAllSubCategories GET API call
// In your subCategorySlice.ts, update the getAllSubCategories thunk:
export const getAllSubCategories = createAsyncThunk(
    'sub-category/getAllSubCategories',
    async (params: { limit?: number; offset?: number; fetchAll?: boolean; activeOnly?: boolean; includeId?: number } = {}, thunkAPI) => {
        try {
            const queryParams = new URLSearchParams();
            
            // Always fetch all for dropdown usage
            if (params.fetchAll || !params.limit) {
                queryParams.append('limit', '10000');
                queryParams.append('offset', '0');
            } else {
                if (params.limit) queryParams.append('limit', String(params.limit));
                if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
            }
            if (params.activeOnly) queryParams.append('activeOnly', 'true');
            if (params.includeId) queryParams.append('includeId', String(params.includeId));
            
            const queryString = queryParams.toString();
            const url = queryString ? `/sub-category?${queryString}` : "/sub-category";
            
            const response = await apiService.get(url);
            console.log('getAllSubCategories response:', response);
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


  export const getSubCategoryByColor = createAsyncThunk(
    "sub-category/getSubCategoryByColor",
    async (params: { categoryName: string; fetchAll?: boolean; activeOnly?: boolean } | string, thunkAPI) => {
      try {
        let categoryName = '';
        const queryParams = new URLSearchParams();
        
        if (typeof params === 'string') {
          categoryName = params;
        } else {
          categoryName = params.categoryName;
          // Always fetch all for dropdowns
          if (params.fetchAll) {
            queryParams.append('limit', '10000');
            queryParams.append('offset', '0');
          }
          if (params.activeOnly) queryParams.append('activeOnly', 'true');
        }
        
        queryParams.append('categoryName', categoryName);
        
        const response = await apiService.get(`/sub-category/by-category?${queryParams.toString()}`);
        console.log('getSubCategoryByColor response:', response);
        const data = Array.isArray(response) ? response : (response?.data?.data || response?.data || []);
        return data;
      } catch (error: any) {
        return thunkAPI.rejectWithValue(error.message);
      }
    }
  );

  export const getSubCategoryByCategory = createAsyncThunk(
    "sub-category/getSubCategoryByCategory",
    async (params: { categoryName: string; fetchAll?: boolean; activeOnly?: boolean } | string, thunkAPI) => {
      try {
        let categoryName = '';
        const queryParams = new URLSearchParams();
        
        if (typeof params === 'string') {
          categoryName = params;
        } else {
          categoryName = params.categoryName;
          // Always fetch all for dropdowns
          if (params.fetchAll) {
            queryParams.append('limit', '10000');
            queryParams.append('offset', '0');
          }
          if (params.activeOnly) queryParams.append('activeOnly', 'true');
        }
        
        queryParams.append('categoryName', categoryName);
        
        const response = await apiService.get(`/sub-category/by-category?${queryParams.toString()}`);
        console.log('getSubCategoryByCategory response:', response);
        const data = Array.isArray(response) ? response : (response?.data?.data || response?.data || []);
        return data;
      } catch (error: any) {
        return thunkAPI.rejectWithValue(error.message);
      }
    }
  );
  


// Thunk for createSubCategory POST API call
export const createSubCategory: any = createAsyncThunk(
    'sub-category/createSubCategory',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/sub-category", params);
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
            const errorMessage = resolveApiErrorMessage(error, "Failed to create subcategory");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for updateSubCategory PUT API call
export const updateSubCategory: any = createAsyncThunk(
    'sub-category/updateSubCategory',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/sub-category/${params.id}`, params);
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
            const errorMessage = resolveApiErrorMessage(error, "Failed to update subcategory");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteSubCategory: any = createAsyncThunk(
    'sub-category/deleteSubCategory',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/sub-category/${id}`);
            console.log(response);
            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to delete subcategory");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


// Create SubCategory Slice
const subCategorySlice = createSlice({
    name: "state",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder

            // Handle getAllSubCategories (GET request)
            .addCase(getAllSubCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllSubCategories.fulfilled, (state: any, action) => {
                state.loading = false;
                state.subCategoryList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllSubCategories.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createSubCategory (POST request)
            .addCase(createSubCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSubCategory.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createSubCategoryResult = action.payload;
            })
            .addCase(createSubCategory.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getSubCategoryByColor (GET request)
             .addCase(getSubCategoryByColor.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSubCategoryByColor.fulfilled, (state: any, action) => {
                state.loading = false;
                state.subCategoryByColourList = action.payload;
            })
            .addCase(getSubCategoryByColor.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getSubCategoryByCategory (GET request)
             .addCase(getSubCategoryByCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSubCategoryByCategory.fulfilled, (state: any, action) => {
                state.loading = false;
                state.subCategoryByCategoryList = action.payload;
            })
            .addCase(getSubCategoryByCategory.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateSubCategory (PUT request)
            .addCase(updateSubCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateSubCategory.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.subCategoryList = state.subCategoryList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateSubCategory.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteSubCategory (DELETE request)
            .addCase(deleteSubCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteSubCategory.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedSubCategory = action.payload;
                state.subCategoryList = state.subCategoryList.filter(
                    (subCategory: any) => subCategory.id !== deletedSubCategory.id
                );
            })
            .addCase(deleteSubCategory.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default subCategorySlice.reducer;