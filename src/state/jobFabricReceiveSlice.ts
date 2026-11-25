import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

type PaginationState = {
    total: number;
    limit: number;
    offset: number;
    next: boolean;
    prev: boolean;
};

type GetJobworkFabricReceiveParams = {
    limit?: number;
    offset?: number;
    fetchAll?: boolean;
    companyId?: number;
    [key: string]: any;
};

const DEFAULT_PAGE_LIMIT = 10;
const FETCH_ALL_PAGE_LIMIT = 10000;

export interface ApiState {
    loading: boolean;
    error: string | null;
    jobworkFabricReceiveList: any;
    createJobworkFabricReceiveResult: any;
    checking: boolean;
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    jobworkFabricReceiveList: [],
    createJobworkFabricReceiveResult: null,
    checking: false,
    pagination: {
        total: 0,
        limit: DEFAULT_PAGE_LIMIT,
        offset: 0,
        next: false,
        prev: false,
    },
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


// Thunk for getAllJobworkFabricReceive GET API call
export const getAllJobworkFabricReceive = createAsyncThunk(
    'jobwork_fabric_receive/getAllJobworkFabricReceive',
    async (params: GetJobworkFabricReceiveParams = {}, thunkAPI) => {
        try {
            const { limit, offset, fetchAll, companyId: paramsCompanyId, ...filterParams } = params;
            const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = paramsCompanyId ?? (storedCompanyId ? Number(storedCompanyId) : undefined);
            const queryParams = new URLSearchParams();

            if (fetchAll) {
                queryParams.append('limit', String(FETCH_ALL_PAGE_LIMIT));
                queryParams.append('offset', '0');
            } else {
                if (limit !== undefined) {
                    queryParams.append('limit', String(limit));
                }
                if (offset !== undefined) {
                    queryParams.append('offset', String(offset));
                }
            }

            Object.entries(filterParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });

            const baseUrl = companyId ? `/jobwork-fabric-receive/company/${companyId}` : "/jobwork-fabric-receive";
            const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
            const response = await apiService.get(url);
            const responseData = response ?? {};
            const candidateArray = Array.isArray(responseData?.data)
                ? responseData.data
                : Array.isArray(responseData)
                    ? responseData
                    : Array.isArray(responseData?.data?.data)
                        ? responseData.data.data
                        : [];
            const defaultLimit = fetchAll ? FETCH_ALL_PAGE_LIMIT : (limit ?? FETCH_ALL_PAGE_LIMIT);
            const resolvedPagination = {
                total: responseData?.pagination?.total
                    ?? responseData?.total
                    ?? responseData?.data?.total
                    ?? responseData?.data?.data?.total
                    ?? candidateArray.length,
                limit: responseData?.pagination?.limit
                    ?? responseData?.limit
                    ?? responseData?.data?.limit
                    ?? responseData?.data?.data?.limit
                    ?? defaultLimit,
                offset: responseData?.pagination?.offset
                    ?? responseData?.offset
                    ?? responseData?.data?.offset
                    ?? responseData?.data?.data?.offset
                    ?? (offset ?? 0),
                next: responseData?.pagination?.next
                    ?? responseData?.next
                    ?? responseData?.data?.next
                    ?? responseData?.data?.data?.next
                    ?? false,
                prev: responseData?.pagination?.prev
                    ?? responseData?.prev
                    ?? responseData?.data?.prev
                    ?? responseData?.data?.data?.prev
                    ?? false,
            };
            return {
                data: candidateArray,
                pagination: resolvedPagination,
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for getJobworkFabricReceiveById
export const getJobworkFabricReceiveById = createAsyncThunk(
    'jobwork_fabric_receive/getJobworkFabricReceiveById',
    async (params: { id: number; companyId: number }, thunkAPI) => {
        try {
            const response = await apiService.get(`/jobwork-fabric-receive/${params.id}/company/${params.companyId}`);
            console.log("API Response:", response);
            return response || { data: [], message: "", status: "success" };
        } catch (error: any) {
            console.error("API Error:", error);
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

// Thunk for createJobworkFabricReceive POST API call
export const createJobworkFabricReceive: any = createAsyncThunk(
    'jobwork_fabric_receive/createJobworkFabricReceive',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/jobwork-fabric-receive", params); // Adjust API endpoint if needed
            console.log(response)
            if (response) {
                toast.success("Job Fabric Receive Created Successfully!");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                // toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
    const errorMessage = resolveApiErrorMessage(error, "Failed to create Job Fabric Receive");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
            // return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const updateJobworkFabricReceive: any = createAsyncThunk(
    'jobwork_fabric_receive/updateJobworkFabricReceive',
    async (params: any, thunkAPI) => {
        console.log("Update params:", params);
        try {
            // Extract id and companyId from params
            const { id, companyId, ...data } = params;
            
            // Send only the data object, not the wrapper
            const response = await apiService.put(
                `/jobwork-fabric-receive/${id}/company/${companyId}`, 
                data  // Send only the data object
            );
            
            console.log("Update response:", response);
            if (response?.status === 'success') {
                toast.success(response?.message || "Updated successfully!");
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


export const hardDeleteJobworkFabricReceive = createAsyncThunk(
    'jobwork_fabric_receive/hardDeleteJobworkFabricReceive',
       async (params: { id: number; companyId?: number }, thunkAPI) => {
        try {
             let url = `/jobwork-fabric-receive/${params.id}`;
            
            // Use company-scoped endpoint if companyId is provided
            if (params.companyId) {
                url = `/jobwork-fabric-receive/company/${params.companyId}/${params.id}/hard`;
            }
            const response = await apiService.delete(url);
            console.log("Delete response:", response);

            if (response?.status === 'success' || response?.data?.status === 'success') {
                toast.success(response?.message || "Successfully deleted");
                return params.id; // Return the deleted ID for reducer handling
            }
            if (response?.data?.message) {
                throw new Error(response.data.message);
            }
            
            const errorMessage = response.data.data?.message || 'Failed to permanently delete';
            throw new Error(errorMessage);

        } catch (error: any) {
            let errorMessage = 'An error occurred while permanently deleting';

            if (error.response) {
                const serverMessage = error.response.data?.message || 
                                     error.response.data?.data?.message || 
                                     error.response.statusText;
                
                if (serverMessage) {
                    errorMessage = serverMessage;
                }
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.request) {
                errorMessage = 'No response from server';
            }

            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Create JobworkFabricReceiveSlice
const JobworkFabricReceiveSlice = createSlice({
    name: "JobworkFabricReceive",
    initialState,
    reducers: {}, // No normal reducers for now
    extraReducers: (builder) => {
        builder

            // Handle getAllJobworkFabricReceive (GET request)
            .addCase(getAllJobworkFabricReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllJobworkFabricReceive.fulfilled, (state: any, action) => {
                state.loading = false;
                state.jobworkFabricReceiveList = (action.payload.data || []).map((record: any) => ({
                    ...record,
                    items: record.items ?? record.jobworkFabricReceiveItemsDtl ?? [],
                }));
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllJobworkFabricReceive.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle createJobworkFabricReceive (POST request)
            .addCase(createJobworkFabricReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createJobworkFabricReceive.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createJobworkFabricReceiveResult = action.payload;
            })
            .addCase(createJobworkFabricReceive.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updateJobworkFabricReceive (PUT request)
            .addCase(updateJobworkFabricReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateJobworkFabricReceive.fulfilled, (state: any, action) => {
                state.loading = false;
                const updatedRecord = action.payload.data;
                if (updatedRecord && Array.isArray(state.jobworkFabricReceiveList)) {
                    state.jobworkFabricReceiveList = state.jobworkFabricReceiveList.map((item: any) =>
                        item.id === updatedRecord.id ? updatedRecord : item
                    );
                }
            })
            .addCase(updateJobworkFabricReceive.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle deleteJobworkFabricReceive (DELETE request)
            // .addCase(deleteJobworkFabricReceive.pending, (state) => {
            //     state.loading = true;
            //     state.error = null;
            // })
            //  .addCase(deleteJobworkFabricReceive.fulfilled, (state: any, action) => {
            //     state.loading = false;
            //     const deletedId = action.payload; // payload is the deleted ID
            //     state.jobworkFabricReceiveList = state.jobworkFabricReceiveList.filter(
            //         (jwfr: any) => jwfr.id !== deletedId
            //     );
            //     state.pagination.total = Math.max(0, state.pagination.total - 1);
            // })
            // .addCase(deleteJobworkFabricReceive.rejected, (state: any, action) => {
            //     state.loading = false;
            //     state.error = action.payload;
            // })
            .addCase(hardDeleteJobworkFabricReceive.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(hardDeleteJobworkFabricReceive.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.jobworkFabricReceiveList = state.jobworkFabricReceiveList.filter(
                    (pi: any) => pi.id !== deletedId
                );
                state.pagination.total = Math.max(0, state.pagination.total - 1);
            })
            .addCase(hardDeleteJobworkFabricReceive.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            });

    },
});

// Export reducer
export default JobworkFabricReceiveSlice.reducer;
