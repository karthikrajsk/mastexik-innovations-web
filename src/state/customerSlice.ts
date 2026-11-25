// import apiService from "@/services/ApiService";
// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";

// export interface PaginationState {
//     total: number;
//     limit: number;
//     offset: number;
//     next: boolean;
//     prev: boolean;
// }

// export interface ApiState {
//     loading: boolean;
//     error: string | null;
//     customerList: any;
//     domesticCustomerList: any;
//     internationalCustomerList: any;
//     createCustomerResult: any;
//     createInternationalCustomerResult: any;
//     checking: boolean,
//     domesticPagination: PaginationState;
//     internationalPagination: PaginationState;
// }

// const initialState: ApiState = {
//     loading: false,
//     error: null,
//     customerList: [],
//     domesticCustomerList: [],
//     internationalCustomerList: [],
//     createCustomerResult: null,
//     createInternationalCustomerResult: null,
//     checking: false,
//     domesticPagination: {
//         total: 0,
//         limit: 10,
//         offset: 0,
//         next: false,
//         prev: false,
//     },
//     internationalPagination: {
//         total: 0,
//         limit: 10,
//         offset: 0,
//         next: false,
//         prev: false,
//     },
// };


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


// // Thunk for getAllCustomers GET API call
// export const getAllCustomers = createAsyncThunk(
//     'customer/getAllCustomers',
//     async (params: { limit?: number; offset?: number; fetchAll?: boolean, tradeTypeId?: number } = {}, thunkAPI) => {
//         try {
//             // const { limit = 10, offset = 0, fetchAll = false, tradeTypeId } = params;
//             // const queryParams = new URLSearchParams();
//             // if (!fetchAll) {
//             //     queryParams.append('limit', limit);
//             //     queryParams.append('offset', offset);
//             // } else {
//             //     queryParams.append('limit', '10000');
//             //     queryParams.append('offset', '0');
//             // }
//             const queryParams = new URLSearchParams();
//             if (params.fetchAll) {
//                 queryParams.append('limit', '10000');
//                 queryParams.append('offset', '0');
//             } else {
//                 if (params.limit) queryParams.append('limit', String(params.limit));
//                 if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
//             }
//             if (params.tradeTypeId) {
//                 queryParams.append('tradeTypeId', String(params.tradeTypeId));
//             }

//             const queryString = queryParams.toString();
//             const url = queryString ? `/customer?${queryString}` : "/customer";

//             const response = await apiService.get(url);
//             console.log(response)
//             console.log(response)
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
//             // const data = response?.data?.data;
//             // const responseOffset = response?.data?.pagination?.offset || params.offset || 0;
//             // const responseLimit = response?.data?.pagination?.limit || params.limit || 10000;
//             // const responseTotal = response?.data?.pagination?.total || (Array.isArray(data) ? data.length : 0);
//             // const nextOffset = responseOffset + responseLimit;

//             // const pagination = response?.data?.pagination ? {
//             //   total: responseTotal,
//             //   limit: responseLimit,
//             //   offset: responseOffset,
//             //   next: response?.data?.pagination?.next !== undefined ? response?.data?.pagination?.next : (nextOffset < responseTotal),
//             //   prev: response?.data?.pagination?.prev !== undefined ? response?.data?.pagination?.prev : (responseOffset > 0),
//             // } : {
//             //   total: responseTotal,
//             //   limit: responseLimit,
//             //   offset: responseOffset,
//             //   next: nextOffset < responseTotal,
//             //   prev: responseOffset > 0,
//             // };
//             // return { data: Array.isArray(data) ? data : [], pagination };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// // Thunk for getInternationalCustomers GET API call
// export const getInternationalCustomers = createAsyncThunk(
//     'customer/getInternationalCustomers',
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
//             const url = queryString ? `/customer_international?${queryString}` : "/customer_international";

//             const response = await apiService.get(url);
//             console.log(response)
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

// // Thunk for createCustomerInternational POST API call
// export const createCustomerInternational: any = createAsyncThunk(
//     'customer/createCustomerInternational',
//     async (params: any, thunkAPI) => {
//         try {
//             const response = await apiService.post("/customer_international", params); // Adjust API endpoint if needed
//             console.log(response)
//             if (response?.status === 'success') {
//                 toast.success(response?.message);
//                 return response;
//             } else {
//                  const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
//                         toast.error(errorMessage);
//                         return thunkAPI.rejectWithValue(errorMessage);
                
//             }
//         } catch (error: any) {
//           const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
//                                           toast.error(errorMessage);
//                   return thunkAPI.rejectWithValue(errorMessage)
//         }
//     }
// );

// // Thunk for updateCustomerInternational PUT API call
// export const updateCustomerInternational: any = createAsyncThunk(
//     'customer/updateCustomerInternational',
//     async (params: any, thunkAPI) => {
//         console.log(params);
//         try {
//             const response = await apiService.put(`/customer_international/${params.id}`, params); // ✅ Fix: Add ID to the URL
//             console.log(response);
//             if (response?.status === 'success') {
//                 toast.success(response?.message);
//                 return response;
//             } else {
//                  const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
//                         toast.error(errorMessage);
//                         return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
//            const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
//                                            toast.error(errorMessage);
//                    return thunkAPI.rejectWithValue(errorMessage)
//         }
//     }
// );

// export const deleteCustomerInternational = createAsyncThunk(
//     'customer/deleteCustomerInternational',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/customer_international/${id}`);

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


// // Thunk for createCustomer POST API call
// export const createCustomer: any = createAsyncThunk(
//     'customer/createCustomer',
//     async (params: any, thunkAPI) => {
//         try {
//             const response = await apiService.post("/customer", params); // Adjust API endpoint if needed
//             console.log(response)
//             if (response?.status === 'success') {
//                 toast.success(response?.message);
//                 return response;
//             } else {
//                  const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
//                         toast.error(errorMessage);
//                         return thunkAPI.rejectWithValue(errorMessage);
               
//             }
//         } catch (error: any) {
//           const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
//                                           toast.error(errorMessage);
//                   return thunkAPI.rejectWithValue(errorMessage)
//         }
//     }
// );

// // Thunk for updateCustomer PUT API call
// export const updateCustomer: any = createAsyncThunk(
//     'customer/updateCustomer',
//     async (params: any, thunkAPI) => {
//         console.log(params);
//         try {
//             const response = await apiService.put(`/customer/${params.id}`, params); // ✅ Fix: Add ID to the URL
//             console.log(response);
//             if (response?.status === 'success') {
//                 toast.success(response?.message);
//                 return response;
//             } else {
//                const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
//                         toast.error(errorMessage);
//                         return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
//            const errorMessage = resolveApiErrorMessage(error, "Failed to create weft inward");
//                                            toast.error(errorMessage);
//                    return thunkAPI.rejectWithValue(errorMessage)
//         }
//     }
// );

// // export const deleteCustomer: any = createAsyncThunk(
// //     'customer/deleteCustomer',
// //     async (id: number, thunkAPI) => {
// //         try {
// //             const response = await apiService.delete(`/customer/${id}`);
// //             console.log(response); // Check what the API actually returns
// //             if (response?.status === 'success') {
// //                 toast.success(response?.message);
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
// export const deleteCustomer = createAsyncThunk(
//     'customer/deleteCustomer',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/customer/${id}`);

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


// // Create Customer Slice
// const customerSlice = createSlice({
//     name: "customer",
//     initialState,
//     reducers: {}, // No normal reducers for now
//     extraReducers: (builder) => {
//         builder

//             // Handle getAllCustomers (GET request)
//             .addCase(getAllCustomers.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(getAllCustomers.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 state.customerList = action.payload.data;

//                 const tradeTypeId = action.meta.arg.tradeTypeId;
//                 if (tradeTypeId === 201) {
//                     state.domesticCustomerList = action.payload.data;
//                     state.domesticPagination = action.payload.pagination;
//                 } else if (tradeTypeId === 202) {
//                     state.internationalCustomerList = action.payload.data;
//                     state.internationalPagination = action.payload.pagination;
//                 }
//             })
//             .addCase(getAllCustomers.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle getInternationalCustomers (GET request)
//             .addCase(getInternationalCustomers.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(getInternationalCustomers.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 state.internationalCustomerList = action.payload.data;
//                 state.internationalPagination = action.payload.pagination;
//             })
//             .addCase(getInternationalCustomers.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle createCustomer (POST request)
//             .addCase(createCustomer.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(createCustomer.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.createCustomerResult = action.payload;
//             })
//             .addCase(createCustomer.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle updateCustomer (PUT request)
//             .addCase(updateCustomer.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(updateCustomer.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 const updatedTable = action.payload;
//                 state.customerList = state.customerList.map((table: any) =>
//                     table.id === updatedTable.id ? updatedTable : table
//                 );
//             })
//             .addCase(updateCustomer.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Handle deleteCustomer (DELETE request)
//             .addCase(deleteCustomer.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(deleteCustomer.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 const deletedId = action.payload;
//                 state.customerList = state.customerList.filter(
//                     (customer: any) => customer.id !== deletedId
//                 );
//             })
//             .addCase(deleteCustomer.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//             .addCase(createCustomerInternational.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(createCustomerInternational.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.createInternationalCustomerResult = action.payload;
//             })
//             .addCase(createCustomerInternational.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//             .addCase(updateCustomerInternational.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(updateCustomerInternational.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 const updatedTable = action.payload;
//                 state.internationalCustomerList = state.internationalCustomerList.map((table: any) =>
//                     table.id === updatedTable.id ? updatedTable : table
//                 );
//             })
//             .addCase(updateCustomerInternational.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//             .addCase(deleteCustomerInternational.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(deleteCustomerInternational.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 const deletedCustomerId = action.payload;
//                 state.internationalCustomerList = state.internationalCustomerList.filter(
//                     (customer: any) => customer.id !== deletedCustomerId
//                 );
//             })
//             .addCase(deleteCustomerInternational.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//     },
// });

// // Export reducer
// export default customerSlice.reducer;
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
    customerList: any;
    domesticCustomerList: any;
    internationalCustomerList: any;
    createCustomerResult: any;
    checking: boolean;
    pagination: PaginationState;
    domesticPagination: PaginationState;
    internationalPagination: PaginationState;
}

const initialPagination: PaginationState = {
  total: 0,
  limit: 10,
  offset: 0,
  next: false,
  prev: false,
};

const initialState: ApiState = {
    loading: false,
    error: null,
    customerList: [],
    domesticCustomerList: [],
    internationalCustomerList: [],
    createCustomerResult: null,
    checking: false,
    pagination: { ...initialPagination },
    domesticPagination: { ...initialPagination },
    internationalPagination: { ...initialPagination },
};

// Thunk for getAllCustomers GET API call
// export const getAllCustomers = createAsyncThunk(
//     'customer/getAllCustomers',
//     async (params: any = {}, thunkAPI) => {
//         try {
//             const { limit = 10, offset = 0, fetchAll = false, tradeTypeId } = params;
//             const queryParams = new URLSearchParams();
//             if (!fetchAll) {
//                 queryParams.append('limit', limit);
//                 queryParams.append('offset', offset);
//             } else {
//                 queryParams.append('limit', '10000');
//                 queryParams.append('offset', '0');
//             }
//             if (tradeTypeId) {
//                 queryParams.append('tradeTypeId', String(tradeTypeId));
//             }
//             const response = await apiService.get(`/customer?${queryParams}`);
//             console.log(response)
//             const data = response?.data?.data;
//             const responseOffset = response?.data?.pagination?.offset || offset || 0;
//             const responseLimit = response?.data?.pagination?.limit || limit || 10;
//             const responseTotal = response?.data?.pagination?.total || (Array.isArray(data) ? data.length : 0);
//             const nextOffset = responseOffset + responseLimit;
            
//             const pagination = response?.data?.pagination ? {
//               total: responseTotal,
//               limit: responseLimit,
//               offset: responseOffset,
//               next: response?.data?.pagination?.next !== undefined ? response?.data?.pagination?.next : (nextOffset < responseTotal),
//               prev: response?.data?.pagination?.prev !== undefined ? response?.data?.pagination?.prev : (responseOffset > 0),
//             } : {
//               total: responseTotal,
//               limit: responseLimit,
//               offset: responseOffset,
//               next: nextOffset < responseTotal,
//               prev: responseOffset > 0,
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

// Thunk for getAllCustomers GET API call
export const getAllCustomers = createAsyncThunk(
    'customer/getAllCustomers',
    async (params: any = {}, thunkAPI) => {
        try {
            const { limit = 10, offset = 0, fetchAll = false, tradeTypeId, scope } = params;
            const queryParams = new URLSearchParams();
            
            if (!fetchAll) {
                queryParams.append('limit', limit.toString());
                queryParams.append('offset', offset.toString());
            } else {
                queryParams.append('limit', '10000');
                queryParams.append('offset', '0');
            }
            
            if (tradeTypeId) {
                queryParams.append('tradeTypeId', String(tradeTypeId));
            }
            
            const response: any = await apiService.get(`/customer?${queryParams}`);
            console.log('API Response:', response);
            
            let data: any[] = [];
            let total = 0;
            let responseLimit = limit;
            let responseOffset = offset;
            let next = false;
            let prev = false;

            const resObj = response?.data ?? response;

            if (Array.isArray(resObj)) {
                data = resObj;
            } else if (Array.isArray(resObj?.data)) {
                data = resObj.data;
                total = resObj.total || data.length;
                responseLimit = resObj.limit || limit;
                responseOffset = resObj.offset || offset;
                next = resObj.next || false;
                prev = resObj.prev || false;
            } else if (Array.isArray(resObj?.items)) {
                data = resObj.items;
                total = resObj.total || data.length;
            } else if (Array.isArray(resObj?.content)) {
                data = resObj.content;
                total = resObj.total || data.length;
            }

            const pagination = {
                total: total || data.length,
                limit: responseLimit,
                offset: responseOffset,
                next,
                prev,
            };
            
            return { 
                data, 
                pagination,
                scope 
            };
            
        } catch (error: any) {
            console.error('Error fetching customers:', error);
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for getInternationalCustomers GET API call
export const getInternationalCustomers = createAsyncThunk(
    'customer/getInternationalCustomers',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.get("/customer_international");
            console.log(response)
            const data = response?.data?.data;
            return Array.isArray(data) ? data : [];
        } catch (error: any) {
            // Handle errors and reject with error message
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createCustomer POST API call
export const createCustomer: any = createAsyncThunk(
    'customer/createCustomer',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/customer", params); // Adjust API endpoint if needed
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

// Thunk for updateCustomer PUT API call
export const updateCustomer: any = createAsyncThunk(
    'customer/updateCustomer',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/customer/${params.id}`, params); // ✅ Fix: Add ID to the URL
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

// export const deleteCustomer: any = createAsyncThunk(
//     'customer/deleteCustomer',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/customer/${id}`);
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
export const deleteCustomer = createAsyncThunk(
    'customer/deleteCustomer',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/customer/${id}`);

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


// Create Customer Slice
const customerSlice = createSlice({
    name: "customer",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllCustomers (GET request)
            .addCase(getAllCustomers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllCustomers.fulfilled, (state: any, action) => {
                state.loading = false;
                const scope = action.meta.arg?.scope;
                if (scope === "domestic") {
                    state.domesticCustomerList = action.payload.data;
                    state.domesticPagination = action.payload.pagination;
                    return;
                }
                if (scope === "international") {
                    state.internationalCustomerList = action.payload.data;
                    state.internationalPagination = action.payload.pagination;
                    return;
                }
                state.customerList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllCustomers.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getInternationalCustomers (GET request)
            .addCase(getInternationalCustomers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getInternationalCustomers.fulfilled, (state: any, action) => {
                state.loading = false;
                state.internationalCustomerList = action.payload;
            })
            .addCase(getInternationalCustomers.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createCustomer (POST request)
            .addCase(createCustomer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCustomer.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createCustomerResult = action.payload;
            })
            .addCase(createCustomer.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateCustomer (PUT request)
            .addCase(updateCustomer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCustomer.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.customerList = state.customerList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateCustomer.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteCustomer (DELETE request)
            .addCase(deleteCustomer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCustomer.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.customerList = state.customerList.filter(
                    (customer: any) => customer.id !== deletedId
                );
            })
            .addCase(deleteCustomer.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default customerSlice.reducer;