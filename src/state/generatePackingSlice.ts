import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    generatePackingList: any;
    createGeneratePackingResult: any;
    currentPacking: any;
    checking: boolean,
}

const initialState: ApiState = {
    loading: false,
    error: null,
    generatePackingList: [],
    createGeneratePackingResult: null,
    currentPacking: null,
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


// Thunk for getAllGeneratePacking POST API call
export const getAllGeneratePacking = createAsyncThunk(
    'generate-packing/getAllGeneratePacking',
    async (params: any, thunkAPI) => {
        try {
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = params?.companyId ?? (v ? Number(v) : undefined);
            let endpoint = companyId ? `/generate-packing/company/${companyId}` : `/generate-packing`;

            const queryParams = new URLSearchParams();
            if (params?.salesOrderId) queryParams.append('salesOrderId', params.salesOrderId);
            if (params?.weavingWorkOrderId) queryParams.append('weavingWorkOrderId', params.weavingWorkOrderId);
            if (params?.yarnSalesOrderId) queryParams.append('yarnSalesOrderId', params.yarnSalesOrderId);
            if (params?.warehouseId) queryParams.append('warehouseId', params.warehouseId);
            if (params?.invoiceId) queryParams.append('invoiceId', params.invoiceId);
            if (params?.invoiceNo) queryParams.append('invoiceNo', params.invoiceNo);

            const queryString = queryParams.toString();
            if (queryString) {
                endpoint += `?${queryString}`;
            }

            const response = await apiService.get(endpoint);
            console.log(response)
            const data = response;
            return data || [];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for getGeneratePackingById GET API call
export const getGeneratePackingById = createAsyncThunk(
    'generate-packing/getGeneratePackingById',
    async (id: number, thunkAPI) => {
        try {
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = v ? Number(v) : undefined;
            const endpoint = companyId
                ? `/generate-packing/company/${companyId}/${id}`
                : `/generate-packing/${id}`;
            const response = await apiService.get(endpoint);
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for create_area POST API call
export const createGeneratePacking: any = createAsyncThunk(
    'generate-packing/createGeneratePacking',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/generate-packing", params); // Adjust API endpoint if needed
            console.log(response)
            if (response?.status === 'success') {
                toast.success("Save Successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
    const errorMessage = resolveApiErrorMessage(error, "Failed to create packing");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for updateGeneratePacking PUT API call
export const updateGeneratePacking: any = createAsyncThunk(
    'generate-packing/updateGeneratePacking',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = params?.companyId ?? (v ? Number(v) : undefined);
            const endpoint = companyId
                ? `/generate-packing/company/${companyId}/${params.id}`
                : `/generate-packing/${params.id}`;
            const response = await apiService.put(endpoint, params);
            console.log(response);
            if (response?.status === 'success') {
                toast.success("Updated Successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// export const deleteGeneratePacking: any = createAsyncThunk(
//     'generate-packing/deleteGeneratePacking',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/generate-packing/${id}`);
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
export const deleteGeneratePacking = createAsyncThunk(
    'generate-packing/deleteGeneratePacking',
    async (id: number, thunkAPI) => {
        try {
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = v ? Number(v) : undefined;
            const endpoint = companyId
                ? `/generate-packing/company/${companyId}/${id}`
                : `/generate-packing/${id}`;
            const response = await apiService.delete(endpoint);

            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return id;
            }

            const errorMessage = response?.data?.data?.message || 'Failed to delete';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);

        } catch (error: any) {
            let errorMessage = 'An error occurred while deleting';

            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            } else if (error.request) {
                errorMessage = 'No response from server';
            }

            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


// Create generatePackingSlice
const generatePackingSlice = createSlice({
    name: "flange",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllGeneratePacking (GET request)
            .addCase(getAllGeneratePacking.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllGeneratePacking.fulfilled, (state: any, action) => {
                state.loading = false;
                state.generatePackingList = action.payload;
            })
            .addCase(getAllGeneratePacking.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getGeneratePackingById (GET request)
            .addCase(getGeneratePackingById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getGeneratePackingById.fulfilled, (state: any, action) => {
                state.loading = false;
                state.currentPacking = action.payload;
            })
            .addCase(getGeneratePackingById.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createGeneratePacking (POST request)
            .addCase(createGeneratePacking.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGeneratePacking.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createGeneratePackingResult = action.payload;
            })
            .addCase(createGeneratePacking.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle editArea (PUT request)
            .addCase(updateGeneratePacking.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateGeneratePacking.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.generatePackingList = state.generatePackingList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateGeneratePacking.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteGeneratePacking (DELETE request)
            .addCase(deleteGeneratePacking.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteGeneratePacking.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.generatePackingList = state.generatePackingList.filter(
                    (gp: any) => gp.id !== deletedId
                );
            })
            .addCase(deleteGeneratePacking.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default generatePackingSlice.reducer;
