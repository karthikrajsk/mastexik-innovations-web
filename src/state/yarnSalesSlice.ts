import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    yarnSalesOrderList: any;
    createYarnSalesOrderResult: any;
    checking: boolean;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    yarnSalesOrderList: [],
    createYarnSalesOrderResult: null,
    checking: false,
};

export const getAllYarnSalesOrders = createAsyncThunk(
    'yarn-sales/getAllYarnSalesOrders',
    async (params: any, thunkAPI) => {
        try {
            const companyId = params?.companyId;
            const endpoint = companyId ? `/yarn-sales-orders/company/${companyId}` : `/yarn-sales-orders`;
            const response = await apiService.get(endpoint);
            const data = response;
            return data || [];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const createYarnSalesOrder: any = createAsyncThunk(
    'yarn-sales/createYarnSalesOrder',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/yarn-sales-orders", params);
            if (response) {
                toast.success("Yarn Sales Order created successfully");
                return response;
            } 
            else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const updateYarnSalesOrder: any = createAsyncThunk(
    'yarn-sales/updateYarnSalesOrder',
    async ({ id, data, companyId }: { id: number, data: any, companyId: number }, thunkAPI) => {
        try {
            const response = await apiService.put(`/yarn-sales-orders/company/${companyId}/${id}`, data);

            if (response) {
                toast.success("Yarn Sales Order updated successfully");
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

export const deleteYarnSalesOrder = createAsyncThunk(
    'yarn-sales/deleteYarnSalesOrder',
    async ({ id, companyId }: { id: number, companyId: number }, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const yarnSalesOrderList = state.yarnSales?.yarnSalesOrderList || [];
            const yarnChallanList = state.yarnChallan?.yarnChallanList || [];

            const orderToDelete = yarnSalesOrderList.find((order: any) => order.id === id);
            if (orderToDelete) {
                const orderNo = orderToDelete.yarnSalesNo || `YS-${orderToDelete.id}`;
                const isMapped = yarnChallanList.some((challan: any) => challan.orderNo === orderNo);

                if (isMapped) {
                    const errorMessage = "Yarn Sales entry is mapped in Yarn Challan and must be deleted/unmapped first.";
                    toast.error(errorMessage);
                    return thunkAPI.rejectWithValue(errorMessage);
                }
            }

            const response = await apiService.delete(`/yarn-sales-orders/company/${companyId}/${id}`);

            // If the request is successful (doesn't throw), it's a success
            // Backend might return 204 (empty), 200 with success status, etc.
            toast.success("Successfully deleted");
            return id;

        } catch (error: any) {
            let errorMessage = 'An error occurred while deleting';

            if (error.response) {
                // Try to extract the message from backend error response
                errorMessage = error.response.data?.message || 
                               error.response.data || 
                               error.response.statusText || 
                               errorMessage;
                
                // If it's an object, try to get message from it
                if (typeof errorMessage === 'object' && errorMessage !== null) {
                    errorMessage = (errorMessage as any).message || JSON.stringify(errorMessage);
                }
            } else if (error.request) {
                errorMessage = 'No response from server';
            } else {
                errorMessage = error.message || errorMessage;
            }

            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

const yarnSalesSlice = createSlice({
    name: "yarnSales",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllYarnSalesOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllYarnSalesOrders.fulfilled, (state: any, action) => {
                state.loading = false;
                state.yarnSalesOrderList = action.payload;
            })
            .addCase(getAllYarnSalesOrders.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(createYarnSalesOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createYarnSalesOrder.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createYarnSalesOrderResult = action.payload;
            })
            .addCase(createYarnSalesOrder.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(updateYarnSalesOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateYarnSalesOrder.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.yarnSalesOrderList = state.yarnSalesOrderList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateYarnSalesOrder.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(deleteYarnSalesOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteYarnSalesOrder.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.yarnSalesOrderList = state.yarnSalesOrderList.filter(
                    (so: any) => so.id !== deletedId
                );
            })
            .addCase(deleteYarnSalesOrder.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })
    },
});

export default yarnSalesSlice.reducer;
