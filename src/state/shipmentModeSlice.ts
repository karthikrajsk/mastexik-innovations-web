import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    shipmentModesList: any;
    createModeResult: any;
    checking: boolean,
    pagination: {
        total: number;
        limit: number;
        offset: number;
        next: boolean;
        prev: boolean;
    }
}

const initialState: ApiState = {
    loading: false,
    error: null,
    shipmentModesList: [],
    createModeResult: null,
    checking: false,
    pagination: {
        total: 0,
        limit: 10,
        offset: 0,
        next: false,
        prev: false,
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

// Thunk for getAllShipmentModes GET API call
export const getAllShipmentModes = createAsyncThunk(
    'shipment-mode/getAllShipmentModes',
    async (params: { limit?: number; offset?: number; fetchAll?: boolean } = {}, thunkAPI) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.fetchAll) {
                queryParams.append('limit', '10000');
                queryParams.append('offset', '0');
            } else {
                if (params.limit) queryParams.append('limit', String(params.limit));
                if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
            }
            const queryString = queryParams.toString();
            const url = queryString ? `/shipment-mode?${queryString}` : "/shipment-mode";
            
            const response = await apiService.get(url);
            console.log(response)
            const paginationData = response?.data;
            const data = paginationData?.data || [];
            return {
                data,
                pagination: {
                    total: paginationData?.total || 0,
                    limit: paginationData?.limit || 10,
                    offset: paginationData?.offset || 0,
                    next: paginationData?.next || false,
                    prev: paginationData?.prev || false,
                }
            };
        } catch (error: any) {
            // Handle errors and reject with error message
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createShipmentMode POST API call
export const createShipmentMode: any = createAsyncThunk(
    'shipment-mode/createShipmentMode',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/shipment-mode", params); // Adjust API endpoint if needed
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
            const errorMessage = resolveApiErrorMessage(error, "Failed to create ShipmentModes ");
                                                       toast.error(errorMessage);
                                                       return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for updateShipmentMode PUT API call
export const updateShipmentMode: any = createAsyncThunk(
    'shipment-mode/updateShipmentMode',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/shipment-mode/${params.id}`, params); // ✅ Fix: Add ID to the URL
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
             const errorMessage = resolveApiErrorMessage(error, "Failed to update ShipmentModes ");
                                                       toast.error(errorMessage);
                                                       return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// export const deleteShipmentMode: any = createAsyncThunk(
//     'shipment-mode/deleteShipmentMode',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/shipment-mode/${id}`);
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

export const deleteShipmentMode = createAsyncThunk(
    'shipment-mode/deleteShipmentMode',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/shipment-mode/${id}`);

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

// Create Category Slice
const shipmentModeSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllShipmentModes (GET request)
            .addCase(getAllShipmentModes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllShipmentModes.fulfilled, (state: any, action) => {
                state.loading = false;
                state.shipmentModesList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllShipmentModes.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createShipmentMode (POST request)
            .addCase(createShipmentMode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createShipmentMode.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createModeResult = action.payload;
            })
            .addCase(createShipmentMode.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateShipmentMode (PUT request)
            .addCase(updateShipmentMode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateShipmentMode.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.shipmentModesList = state.shipmentModesList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateShipmentMode.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteShipmentMode (DELETE request)
            .addCase(deleteShipmentMode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteShipmentMode.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedShipmentMode = action.payload;
                state.shipmentModesList = state.shipmentModesList.filter(
                    (mode: any) => mode.id !== deletedShipmentMode.id
                );
            })
            .addCase(deleteShipmentMode.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default shipmentModeSlice.reducer;
