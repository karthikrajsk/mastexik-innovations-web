import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    yarnChallanList: any;
    createYarnChallanResult: any;
    checking: boolean,
}

const initialState: ApiState = {
    loading: false,
    error: null,
    yarnChallanList: [],
    createYarnChallanResult: null,
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
}
export const getAllYarnChallan = createAsyncThunk(
    'yarn-challan/getAllYarnChallan',
    async (params: any, thunkAPI) => {
        try {
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = params?.companyId ?? (v ? Number(v) : undefined);
            const endpoint = companyId ? `/yarn-challan/company/${companyId}` : `/yarn-challan`;
            const response = await apiService.get(endpoint);
            console.log(response)
            const data = response;
            return data || [];
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const createYarnChallan: any = createAsyncThunk(
    'yarn-challan/createYarnChallan',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/yarn-challan", params);
            console.log(response)
            if (response?.status === 'success') {
                toast.success("Save Successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        }  catch (error: any) {
                                                            const errorMessage = resolveApiErrorMessage(error, "Failed to create purchase inward");
                                                            toast.error(errorMessage);
                                                            return thunkAPI.rejectWithValue(errorMessage);
                                                        }
    }
);

export const updateYarnChallan: any = createAsyncThunk(
    'yarn-challan/updateYarnChallan',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = params?.companyId ?? (v ? Number(v) : undefined);
            const endpoint = companyId
                ? `/yarn-challan/company/${companyId}/${params.id}`
                : `/yarn-challan/${params.id}`;
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

export const deleteYarnChallan = createAsyncThunk(
    'yarn-challan/deleteYarnChallan',
    async (id: number, thunkAPI) => {
        try {
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = v ? Number(v) : undefined;
            const endpoint = companyId
                ? `/yarn-challan/company/${companyId}/${id}`
                : `/yarn-challan/${id}`;
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


const yarnChallanSlice = createSlice({
    name: "yarnChallan",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder

            .addCase(getAllYarnChallan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllYarnChallan.fulfilled, (state: any, action) => {
                state.loading = false;
                state.yarnChallanList = action.payload;
            })
            .addCase(getAllYarnChallan.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(createYarnChallan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createYarnChallan.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createYarnChallanResult = action.payload;
            })
            .addCase(createYarnChallan.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(updateYarnChallan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateYarnChallan.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedTable = action.payload;
                state.yarnChallanList = state.yarnChallanList.map((table: any) =>
                    table.id === updatedTable.id ? updatedTable : table
                );
            })
            .addCase(updateYarnChallan.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(deleteYarnChallan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteYarnChallan.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.yarnChallanList = state.yarnChallanList.filter(
                    (yc: any) => yc.id !== deletedId
                );
            })
            .addCase(deleteYarnChallan.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

export default yarnChallanSlice.reducer;