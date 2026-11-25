import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

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
    salesOrderList: any;
    purchaseOrderTypeList: any;
    salesOrderByCustomerIdList: any;
    createSalesOrderResult: any;
    checking: boolean,
    paginationInfo: PaginationInfo;
    salesOrderConsigneeAddress: any;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    salesOrderList: [],
    purchaseOrderTypeList: [],
    salesOrderByCustomerIdList: [],
    createSalesOrderResult: null,
    checking: false,
    salesOrderConsigneeAddress: null,
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    }
};

const normalizeSalesOrderResponse = (
    response: any,
    fallbackOffset: number,
    fallbackLimit: number
) => {
    if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        const payload = response.data;
        const normalizedData = Array.isArray(payload.data)
            ? payload.data
            : Array.isArray(payload.items)
                ? payload.items
                : [];

        return {
            data: normalizedData,
            total: payload.total ?? payload.count ?? payload.pagination?.total ?? normalizedData.length,
            next: payload.next ?? payload.pagination?.next ?? false,
            prev: payload.prev ?? payload.pagination?.prev ?? fallbackOffset > 0,
            offset: payload.offset ?? payload.pagination?.offset ?? fallbackOffset,
            limit: payload.limit ?? payload.pagination?.limit ?? fallbackLimit
        };
    }

    if (Array.isArray(response?.data)) {
        return {
            data: response.data,
            total: response.total ?? response.count ?? response.data.length,
            next: response.next ?? false,
            prev: response.prev ?? false,
            offset: response.offset ?? fallbackOffset,
            limit: response.limit ?? fallbackLimit
        };
    }

    if (Array.isArray(response)) {
        return {
            data: response,
            total: response.length,
            next: false,
            prev: fallbackOffset > 0,
            offset: fallbackOffset,
            limit: fallbackLimit
        };
    }

    return {
        data: [],
        total: 0,
        next: false,
        prev: false,
        offset: fallbackOffset,
        limit: fallbackLimit
    };
};

// Thunk for getAllSalesOrders GET API call
export const getAllSalesOrders = createAsyncThunk(
    'sales-orders/getAllSalesOrders',
    async (params: { offset?: number; limit?: number; fetchAll?: boolean; companyId?: number; fabricCode?: string; filters?: Record<string, string | number | boolean> } = {}, thunkAPI) => {
        try {
            const fetchAll = params.fetchAll ?? true;
            const offset = fetchAll ? 0 : params.offset ?? 0;
            const limit = fetchAll ? 1000 : params.limit ?? 10000;
            const companyId = params.companyId;
            const fabricCode = params.fabricCode;
            const { filters } = params;

            const queryParams = new URLSearchParams();
            queryParams.append('offset', String(offset));
            queryParams.append('limit', String(limit));
            
            if (fabricCode) {
                queryParams.append('fabricCode', String(fabricCode));
            }

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        queryParams.append(key, String(value));
                    }
                });
            }

            let endpoint = companyId ? `/sales-orders/company/${companyId}` : `/sales-orders`;
            const queryString = queryParams.toString();
            if (queryString) {
                endpoint = `${endpoint}?${queryString}`;
            }

            const response = await apiService.get(endpoint);
            const normalized = normalizeSalesOrderResponse(response, offset, limit);

            return {
                data: normalized.data,
                total: normalized.total,
                next: normalized.next,
                prev: normalized.prev,
                offset: normalized.offset,
                limit: normalized.limit,
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for getAllPoTypes GET API call
export const getAllPoTypes = createAsyncThunk(
    'sales-orders/getAllPoTypes',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.get("/po-type-master"); // Adjust API endpoint if needed
            console.log(response)
            const data = response?.data;
            return data || [];
        } catch (error: any) {
            // Handle errors and reject with error message
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for getSalesOrderByCustomerId (renamed for clarity)
export const getSalesOrderByCustomerId = createAsyncThunk(
    'purchaseOrders/getSalesOrderByCustomerId',
    async (customerId: number, thunkAPI) => {  // Directly accept customerId as number
        try {
            const response = await apiService.get(`/sales-orders/customer/${customerId}`);
            console.log("API Response:", response);
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Thunk for createSalesOrder POST API call
export const createSalesOrder: any = createAsyncThunk(
    'sales-orders/createSalesOrder',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/sales-orders", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === 'success') {
                // toast.success("Saved Successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const updateSalesOrder: any = createAsyncThunk(
    'sales-orders/updateSalesOrder',
    async ({ id, data, companyId }: { id: number, data: any, companyId: number }, thunkAPI) => {
        try {
            const response = await apiService.put(`/sales-orders/company/${companyId}/${id}`, data);

            if (response?.status === 'success') {
                return response;
            } else {
                const errorMessage = "Something went wrong";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            toast.error(error.message || "Update failed");
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const getSalesOrderConsigneeAddress = createAsyncThunk(
    'sales-orders/getSalesOrderConsigneeAddress',
    async (salesOrderId: number, thunkAPI) => {
        try {
            const response = await apiService.get(`/sales-orders/${salesOrderId}/consignee-address`);
            const data = response?.data?.data ?? response?.data ?? response;
            return data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

const extractErrorMessage = (error: any) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Failed to delete category';

export const deleteSalesOrder = createAsyncThunk(
    'sales-orders/deleteSalesOrder',
    async ({ id, companyId }: { id: number, companyId: number }, thunkAPI) => {
        try {
            const response = await apiService.delete(`/sales-orders/company/${companyId}/${id}`);

            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return id;
            }
            // const errorMessage = response.data?.data?.message || 'Failed to delete';
            // toast.error(errorMessage);
            // return thunkAPI.rejectWithValue(errorMessage);
 const errorMessage = extractErrorMessage(response);
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
             const message = extractErrorMessage(error);
                       toast.error(message);
                       return thunkAPI.rejectWithValue(message);
        }
    }
);


// Create sliceOrderSlice
const sliceOrderSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllSalesOrders (GET request)
            .addCase(getAllSalesOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllSalesOrders.fulfilled, (state: any, action) => {
                state.loading = false;
                const payload = action.payload;

                if (payload && Array.isArray(payload.data)) {
                    state.salesOrderList = payload.data;
                    state.paginationInfo = {
                        total: payload.total ?? payload.data.length ?? state.paginationInfo.total,
                        next: Boolean(payload.next),
                        prev: Boolean(payload.prev),
                        offset: payload.offset ?? state.paginationInfo.offset,
                        limit: payload.limit ?? state.paginationInfo.limit
                    };
                } else if (Array.isArray(payload)) {
                    state.salesOrderList = payload;
                    state.paginationInfo = {
                        total: payload.length,
                        next: false,
                        prev: false,
                        offset: 0,
                        limit: payload.length || state.paginationInfo.limit
                    };
                } else {
                    state.salesOrderList = [];
                    state.paginationInfo = {
                        ...state.paginationInfo,
                        total: 0,
                        next: false,
                        prev: false,
                        offset: 0
                    };
                }
            })
            .addCase(getAllSalesOrders.rejected, (state: any, action) => {
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

            // Handle getSalesOrderByCustomerId (GET request)
            .addCase(getSalesOrderByCustomerId.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSalesOrderByCustomerId.fulfilled, (state: any, action) => {
                state.loading = false;
                state.salesOrderByCustomerIdList = action.payload;
            })
            .addCase(getSalesOrderByCustomerId.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createSalesOrder (POST request)
            .addCase(createSalesOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSalesOrder.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createSalesOrderResult = action.payload;
            })
            .addCase(createSalesOrder.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateSalesOrder (PUT request)
            .addCase(updateSalesOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateSalesOrder.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.salesOrderList = state.salesOrderList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateSalesOrder.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteSalesOrder (DELETE request)
            .addCase(deleteSalesOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteSalesOrder.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.salesOrderList = state.salesOrderList.filter(
                    (so: any) => so.id !== deletedId
                );
                state.paginationInfo = {
                    ...state.paginationInfo,
                    total: Math.max(0, state.paginationInfo.total - 1)
                };
            })
            .addCase(deleteSalesOrder.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(getSalesOrderConsigneeAddress.pending, (state) => {
                state.error = null;
            })
            .addCase(getSalesOrderConsigneeAddress.fulfilled, (state, action: PayloadAction<any>) => {
                state.salesOrderConsigneeAddress = action.payload;
            })
            .addCase(getSalesOrderConsigneeAddress.rejected, (state: any, action) => {
                state.error = action.payload;
            })

    },
});

// Export reducer
export default sliceOrderSlice.reducer;
