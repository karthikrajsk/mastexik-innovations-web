import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify"
export interface PaginationInfo {
    total: number;
    next: boolean;
    prev: boolean;
    offset: number;
    limit: number;
}

export interface ApiState {
    loading: boolean;
    error: string | null;
    purchaseOrderList: any;
    paginationInfo: PaginationInfo;
    purchaseOrderTypeList: any;
    purchaseOrderListByVendorId: any
    vendorByPoTypeList: any;
    gstMasterList: any[]; 
    purchaseOrderListById: any
    createPurchaseOrderResult: any;
    checking: boolean,
}

const initialState: ApiState = {
    loading: false,
    error: null,
    purchaseOrderList: [],
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    },
    purchaseOrderTypeList: [],
    purchaseOrderListById: [],
    vendorByPoTypeList: [],
    gstMasterList: [],
    purchaseOrderListByVendorId: null,
    createPurchaseOrderResult: null,
    checking: false,
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

// Thunk for getAllPurchaseOrders GET API call with pagination support
// export const getAllPurchaseOrders = createAsyncThunk(
//     'purchase-orders/getAllPurchaseOrders',
//     async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {}, thunkAPI) => {
//         try {
//             const offset = params.fetchAll ? 0 : (params.offset ?? 0);
//             const limit = params.fetchAll ? 10000 : (params.limit ?? 10000);
            
//             const queryParams = new URLSearchParams();
//             queryParams.append('offset', String(offset));
//             queryParams.append('limit', String(limit));
            
//             const basePath = params.companyId ? `/purchase-orders/company/${params.companyId}` : `/purchase-orders`;
//             const response = await apiService.get(`${basePath}?${queryParams.toString()}`);
//             console.log('Purchase Orders Response:', response);
            
//             if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
//                 const paginationData = response.data;
//                 return {
//                     data: paginationData.data || [],
//                     total: paginationData.total || 0,
//                     next: paginationData.next || false,
//                     prev: paginationData.prev || false,
//                     offset: paginationData.offset || offset,
//                     limit: paginationData.limit || limit
//                 };
//             }
            
//             if (Array.isArray(response?.data)) {
//                 return {
//                     data: response.data,
//                     total: response.total || 0,
//                     next: response.next || false,
//                     prev: response.prev || false,
//                     offset: response.offset || offset,
//                     limit: response.limit || limit
//                 };
//             }
            
//             if (Array.isArray(response)) {
//                 return {
//                     data: response,
//                     total: response.length,
//                     next: false,
//                     prev: false,
//                     offset,
//                     limit
//                 };
//             }
            
//             return {
//                 data: [],
//                 total: 0,
//                 next: false,
//                 prev: false,
//                 offset,
//                 limit
//             };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

export const getAllPurchaseOrders = createAsyncThunk(
  "purchase-orders/getAllPurchaseOrders",
  async (
    params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number } = {},
    thunkAPI
  ) => {
    try {
      const queryParams = new URLSearchParams()

      if (params.companyId) {
        queryParams.append("companyId", String(params.companyId))
      }

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

      const basePath = params.companyId
        ? `/purchase-orders/company/${params.companyId}`
        : `/purchase-orders`

      const url = queryString ? `${basePath}?${queryString}` : basePath

      const response = await apiService.get(url)

      // ✅ Same structure as getAllCurrencies
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
        },
      }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
)

// Thunk for getAllPoTypes GET API call
// export const getAllPoTypes = createAsyncThunk(
//     'purchase-orders/getAllPoTypes',
//     async (params: any, thunkAPI) => {
//         try {
//             const response = await apiService.get("/po-type-master"); // Adjust API endpoint if needed
//             console.log(response)
//             const data = response?.data?.data;
//             return data || [];
//         } catch (error: any) {
//             // Handle errors and reject with error message
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

export const getAllPoTypes = createAsyncThunk(
    'purchase-orders/getAllPoTypes',
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
            const url = queryString
                ? `/po-type-master?${queryString}`
                : `/po-type-master`

            const response = await apiService.get(url)
            const data = response?.data?.data || []
            return data
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const getAllGstRates = createAsyncThunk(
    'purchase-orders/getAllGstRates',
    async (_, thunkAPI) => {
        try {
            const response = await apiService.get("/api/gst");
            return response?.data || [];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const getPurchaseOrdersByVendorId = createAsyncThunk(
    'purchase-orders/getByVendorId',
    async (params: number | { vendorId: number; companyId?: number }, thunkAPI) => {
        try {
            const vendorId = typeof params === 'number' ? params : params.vendorId;
            const companyId = typeof params === 'number' ? undefined : params.companyId;
            const endpoint = companyId
                ? `/purchase-orders/company/${companyId}/vendor/${vendorId}`
                : `/purchase-orders/vendor/${vendorId}`;

            const response = await apiService.get(endpoint);
            console.log("Purchase Orders API Response:", response);
            
            if (response?.status === 'error' || !response?.data) {
                return { data: [], message: response?.message || "No purchase orders found", status: "success" };
            }
            
            return response;
        } catch (error: any) {
            console.error("API Error:", error);
            return thunkAPI.fulfillWithValue({ data: [], message: "No purchase orders found", status: "success" });
        }
    }
);

// Thunk for getPurchaseOrderById
// export const getPurchaseOrderById = createAsyncThunk(
//     'purchase-orders/getPurchaseOrderById',
//     async (params: number | { id: number; companyId?: number , excludeInwardId?: number  }, thunkAPI) => {
//         try {
            
//             const id = typeof params === 'number' ? params : params.id;
//             const companyId = typeof params === 'number' ? undefined : params.companyId;
//             const endpoint = companyId ? `/purchase-orders/company/${companyId}/${id}` : `/purchase-orders/${id}`;
//             const response = await apiService.get(endpoint);
//             console.log("API Response:", response);
//             return response.data;
//         } catch (error: any) {
//             console.error("API Error:", error);
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

export const getPurchaseOrderById = createAsyncThunk(
    'purchase-orders/getPurchaseOrderById',
    async (
        params: number | { id: number; companyId?: number; excludeInwardId?: number },
        thunkAPI
    ) => {
        try {
            const id = typeof params === 'number' ? params : params.id;
            const companyId = typeof params === 'number' ? undefined : params.companyId;
            const excludeInwardId = typeof params === 'number' ? undefined : params.excludeInwardId;

            let endpoint = companyId
                ? `/purchase-orders/company/${companyId}/${id}`
                : `/purchase-orders/${id}`;

            if (excludeInwardId) {
                endpoint = `${endpoint}?excludeInwardId=${excludeInwardId}`;
            }

            const response = await apiService.get(endpoint);
            console.log("API Response:", response);
            return response.data;
        } catch (error: any) {
            console.error("API Error:", error);
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const getVendorByPoId = createAsyncThunk(
    'purchaseOrders/getVendorByPoId',
    async (poTypeId: number, thunkAPI) => {
        try {
            const response = await apiService.get(`/vendor/by-po-type/${poTypeId}`);
            console.log("Vendors API Response:", response);
            return response; // This should return the full response object
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);



// Thunk for createPurchaseOrder POST API call
export const createPurchaseOrder: any = createAsyncThunk(
    'purchase-orders/createPurchaseOrder',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/purchase-orders", params); // Adjust API endpoint if needed
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
             const errorMessage = resolveApiErrorMessage(error, "Failed to create purchase order");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const getPendingPurchaseOrdersByVendorId = createAsyncThunk(
    'purchase-orders/getPendingByVendorId',
    async (params: number | { vendorId: number; companyId?: number; excludeInwardId?: number }, thunkAPI) => {
        try {
            const vendorId = typeof params === 'number' ? params : params.vendorId;
            const companyId = typeof params === 'number' ? undefined : params.companyId;
            const excludeInwardId = typeof params === 'number' ? undefined : params.excludeInwardId;

            let url = companyId
                ? `/purchase-orders/company/${companyId}/vendor/${vendorId}/pending`
                : `/purchase-orders/vendor/${vendorId}/pending`;

            if (excludeInwardId) {
                url = `${url}?excludeInwardId=${excludeInwardId}`;
            }
            const response = await apiService.get(url);
            console.log("Pending Purchase Orders API Response:", response);
            
            if (response?.status === 'error' || !response?.data) {
                return { data: [], message: response?.message || "No pending purchase orders found", status: "success" };
            }
            
            return response;
        } catch (error: any) {
            console.error("API Error:", error);
            return thunkAPI.fulfillWithValue({ data: [], message: "No pending purchase orders found", status: "success" });
        }
    }
);



// Thunk for updatePurchaseOrder PUT API call
// export const updatePurchaseOrder: any = createAsyncThunk(
//     'purchase-orders/updatePurchaseOrder',
//     async (params: any, thunkAPI) => {
//         console.log(params);
//         try {
//             const response = await apiService.put(`/purchase-orders/${params.id}`, params); // ✅ Fix: Add ID to the URL
//             console.log(response);
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
export const updatePurchaseOrder: any = createAsyncThunk(
    'purchase-orders/updatePurchaseOrder',
    async ({ id, data, companyId }: { id: number; data: any; companyId?: number }, thunkAPI) => {
        try {
            const endpoint = companyId ? `/purchase-orders/company/${companyId}/${id}` : `/purchase-orders/${id}`;
            const response = await apiService.put(endpoint, data);

            if (response) {
                // toast.success("Purchase Order updated successfully!");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = error.message || "Update failed";
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const permanentDeletePurchaseOrder = createAsyncThunk(
    'purchase-orders/permanentDeletePurchaseOrder',
   async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
        try {
            // API call to the hard delete endpoint
            const response = await apiService.delete(`/purchase-orders/${companyId}/${id}/hard`);

            if (response?.status === 'success') {
                toast.success("Purchase Order permanently deleted");
                return id;
            }
            return thunkAPI.rejectWithValue(response?.message || 'Failed to delete');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


export const deletePurchaseOrder = createAsyncThunk(
    'purchase-orders/deletePurchaseOrder',
    async ({ id, companyId }: { id: number; companyId?: number }, thunkAPI) => {
        try {
            const endpoint = companyId ? `/purchase-orders/company/${companyId}/${id}` : `/purchase-orders/${id}`;
            const response = await apiService.delete(endpoint);

            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return { id };
            }

            const errorMessage = response?.data?.data?.message || response?.message || 'Failed to delete';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);

        } catch (error: any) {
            let errorMessage = 'An error occurred while deleting';

            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            } else if (error.request) {
                errorMessage = 'No response from server';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


export const getPurchaseOrderItemsDeletionStatus = createAsyncThunk(
  'purchaseOrder/getItemsDeletionStatus',
  async (purchaseOrderId: number) => {
    const response = await fetch(`/api/purchase-orders/${purchaseOrderId}/items-deletion-status`);
    const data = await response.json();
    return { purchaseOrderId, itemsDeletionStatus: data.data };
  }
);



// Create purchaseOrderSlice
const purchaseOrderSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllPurchaseOrders (GET request)
            .addCase(getAllPurchaseOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllPurchaseOrders.fulfilled, (state, action: any) => {
  state.loading = false
  state.purchaseOrderList = action.payload.data
  state.paginationInfo = action.payload.pagination
})
            // .addCase(getAllPurchaseOrders.fulfilled, (state: any, action) => {
            //     state.loading = false;
            //     const { data, total, next, prev, offset, limit } = action.payload;
            //     state.purchaseOrderList = Array.isArray(data) ? data : [];
            //     state.paginationInfo = { total, next, prev, offset, limit };

            // })
            .addCase(getAllPurchaseOrders.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getAllPoTypes (GET request)
            .addCase(getAllPoTypes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllPoTypes.fulfilled, (state: any, action) => {
                state.loading = false;
                state.purchaseOrderTypeList = action.payload;
            })
            .addCase(getAllPoTypes.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getVendorByPoId (GET request)
            .addCase(getVendorByPoId.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getVendorByPoId.fulfilled, (state: any, action) => {
                state.loading = false;
                state.vendorByPoTypeList = action.payload;
            })
            .addCase(getVendorByPoId.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getPurchaseOrderById (GET request)
            .addCase(getPurchaseOrderById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPurchaseOrderById.fulfilled, (state: any, action) => {
                state.loading = false;
                state.purchaseOrderListById = action.payload;
            })
            .addCase(getPurchaseOrderById.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Add this to your extraReducers
.addCase(getAllGstRates.pending, (state) => {
    state.loading = true;
    state.error = null;
})
.addCase(getAllGstRates.fulfilled, (state: any, action) => {
    state.loading = false;
    state.gstMasterList = action.payload;
})
.addCase(getAllGstRates.rejected, (state: any, action) => {
    state.loading = false;
    state.error = action.payload;
})

            // Handle getPurchaseOrdersByVendorId (GET request)
            .addCase(getPurchaseOrdersByVendorId.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPurchaseOrdersByVendorId.fulfilled, (state: any, action) => {
                state.loading = false;
                state.purchaseOrderListByVendorId = action.payload;
            })
            .addCase(getPurchaseOrdersByVendorId.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createPurchaseOrder (POST request)
            .addCase(createPurchaseOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPurchaseOrder.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createPurchaseOrderResult = action.payload;
            })
            .addCase(createPurchaseOrder.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updatePurchaseOrder (PUT request)
            .addCase(updatePurchaseOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePurchaseOrder.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.purchaseOrderList = state.purchaseOrderList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updatePurchaseOrder.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deletePurchaseOrder (DELETE request)
            .addCase(deletePurchaseOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePurchaseOrder.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload?.id;
                if (deletedId == null) {
                    return;
                }
                state.purchaseOrderList = state.purchaseOrderList.filter(
                    (po: any) => po.id !== deletedId
                );
            })
            .addCase(deletePurchaseOrder.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

              // Handle getPendingPurchaseOrdersByVendorId (GET request)
            .addCase(getPendingPurchaseOrdersByVendorId.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPendingPurchaseOrdersByVendorId.fulfilled, (state: any, action) => {
                state.loading = false;
                state.purchaseOrderListByVendorId = action.payload;
            })
            .addCase(getPendingPurchaseOrdersByVendorId.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })


    },
});

// Export reducer
export default purchaseOrderSlice.reducer;
