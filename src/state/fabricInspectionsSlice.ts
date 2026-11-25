import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    fabricInspectionList: any;
    createFabricInspectionResult: any;
    getFabricInspectionByIdList: any;
    lotEntriesList: any;
    checking: boolean,
}

const initialState: ApiState = {
    loading: false,
    error: null,
    fabricInspectionList: [],
    getFabricInspectionByIdList: [],
    lotEntriesList: [],
    createFabricInspectionResult: null,
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

// Thunk for getAllFabricInspection GET API call
// export const getAllFabricInspection = createAsyncThunk(
//     'fabric-inspections/getAllFabricInspection',
//     async (params: any, thunkAPI) => {
//         try {
//             const response = await apiService.get("/fabric-inspections"); // Adjust API endpoint if needed
//             console.log(response)
//             const data = response.data;
//             return data || [];
//         } catch (error: any) {
//             // Handle errors and reject with error message
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );
// UPDATE getAllFabricInspection to use companyId

export const getAllFabricInspection = createAsyncThunk(
    'fabric-inspections/getAllFabricInspection',
    async (args: { companyId?: number } | undefined, thunkAPI) => {
        try {
            const companyId = args?.companyId;
            const url = companyId != null ? `/fabric-inspections/company/${companyId}` : `/fabric-inspections`;
            const response = await apiService.get(url);
            const data = (response as any)?.data?.data ?? (response as any)?.data ?? response;
            return data || [];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);


// Thunk for getFabricInspectionById
export const getFabricInspectionById = createAsyncThunk(
    'fabric-inspections/getFabricInspectionById',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.get(`/fabric-inspections/${id}`);
            console.log("API Response:", response);
            return response || { data: [], message: "", status: "success" };
        } catch (error: any) {
            console.error("API Error:", error);
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createFabricInspection POST API call
export const createFabricInspection: any = createAsyncThunk(
    'fabric-inspections/createFabricInspection',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("fabric-inspections", params); // Adjust API endpoint if needed
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
              const errorMessage = resolveApiErrorMessage(error, "Failed to create fabric inspection");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const updateFabricInspection: any = createAsyncThunk(
    'fabric-inspections/updateFabricInspection',
    async ({ id, data, companyId }: { id: number, data: any, companyId?: number }, thunkAPI) => {
        try {
            const url = companyId != null ? `/fabric-inspections/company/${companyId}/${id}` : `/fabric-inspections/${id}`;
            const response = await apiService.put(url, data);
            if (response) {
                toast.success("Fabric Inspection updated successfully!");
                return (response as any)?.data?.data ?? (response as any)?.data ?? response;
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

// UPDATE deleteContract to accept companyId and use company URL when provided
export const deleteContract: any = createAsyncThunk(
    'fabric-inspections/deleteContract',
    async (args: { id: number; companyId?: number }, thunkAPI) => {
        try {
            const { id, companyId } = args;
            const url = companyId != null ? `/fabric-inspections/company/${companyId}/${id}` : `/fabric-inspections/${id}`;
            const response = await apiService.delete(url);
            if ((response as any)?.status === 'success') {
                toast.success((response as any)?.message);
                return { id };
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);


// export const deleteContract: any = createAsyncThunk(
//     'fabric-inspections/deleteContract',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/fabric-inspections/${id}`);
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


// Create fabricInspectionsSlice
const fabricInspectionsSlice = createSlice({
    name: "state",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllFabricInspection (GET request)
            .addCase(getAllFabricInspection.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllFabricInspection.fulfilled, (state: any, action) => {
                state.loading = false;
                state.fabricInspectionList = action.payload;
            })
            .addCase(getAllFabricInspection.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle getFabricInspectionById (GET request)
            .addCase(getFabricInspectionById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getFabricInspectionById.fulfilled, (state: any, action) => {
                state.loading = false;
                state.getFabricInspectionByIdList = action.payload;
            })
            .addCase(getFabricInspectionById.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createFabricInspection (POST request)
            .addCase(createFabricInspection.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createFabricInspection.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createFabricInspectionResult = action.payload;
            })
            .addCase(createFabricInspection.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteContract (DELETE request)
            .addCase(deleteContract.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteContract.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedWeavingContract = action.payload;
                state.fabricInspectionList = state.fabricInspectionList.filter(
                    (wc: any) => wc.id !== deletedWeavingContract.id
                );
            })
            .addCase(deleteContract.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

// Export reducer
export default fabricInspectionsSlice.reducer;
