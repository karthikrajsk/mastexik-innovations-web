// import apiService from "@/services/ApiService";
// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";

// export interface ApiState {
//     loading: boolean;
//     error: string | null;
//     agentMasterList: any;
//     createAgentMasterResult: any;
//     checking: boolean;
//     pagination: {
//         total: number;
//         limit: number;
//         offset: number;
//         next: boolean;
//         prev: boolean;
//     };
// }

// const initialState: ApiState = {
//     loading: false,
//     error: null,
//     agentMasterList: [],
//     createAgentMasterResult: null,
//     checking: false,
//     pagination: {
//         total: 0,
//         limit: 10,
//         offset: 0,
//         next: false,
//         prev: false,
//     },
// };

// export const getAllAgentMasters = createAsyncThunk(
//     'agentMaster/getAllAgentMasters',
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
//             const url = queryString ? `/agent-master?${queryString}` : "/agent-master";
//             const response = await apiService.get(url);
//             const paginationData = response?.data;
//             const data = Array.isArray(paginationData?.data) ? paginationData.data : [];
//             return {
//                 data,
//                 pagination: {
//                     total: paginationData?.total, // Use total from API if available
//                     limit: paginationData?.limit || params.limit || 10,
//                     offset: paginationData?.offset || params.offset || 0,
//                     next: paginationData?.next || false,
//                     prev: paginationData?.prev || false,
//                     fetchAll: !!params.fetchAll
//                 },
//             };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

// export const createAgentMaster: any = createAsyncThunk(
//     'agentMaster/createAgentMaster',
//     async (params: any, thunkAPI) => {
//         try {
//             const response = await apiService.post("/agent-master", params);
//             console.log(response)
//             if (response?.status === 'success') {
//                 toast.success("Agent saved successfully");
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

// export const updateAgentMaster: any = createAsyncThunk(
//     'agentMaster/updateAgentMaster',
//     async (params: any, thunkAPI) => {
//         console.log(params);
//         try {
//             const response = await apiService.put(`/agent-master/${params.id}`, params);
//             console.log(response);
//             if (response?.status === 'success') {
//                 toast.success("Agent updated successfully");
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

// export const deleteAgentMaster = createAsyncThunk(
//     'agentMaster/deleteAgentMaster',
//     async (id: number, thunkAPI) => {
//         try {
//             const response = await apiService.delete(`/agent-master/${id}`);

//             if (response?.status === 'success') {
//                 toast.success('Agent deleted successfully');
//                 return id;
//             }

//             const errorMessage = response.data.data?.message || 'Failed to delete agent';
//             toast.error(errorMessage);
//             return response;

//         } catch (error: any) {
//             let errorMessage = 'An error occurred while deleting the agent';

//             if (error.response) {
//                 errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
//             } else if (error.request) {
//                 errorMessage = 'No response from server';
//             }

//             toast.error(errorMessage);
//             return errorMessage;
//         }
//     }
// );

// const agentMasterSlice = createSlice({
//     name: "agentMaster",
//     initialState,
//     reducers: {},
//     extraReducers: (builder) => {
//         builder
//             .addCase(getAllAgentMasters.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(getAllAgentMasters.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 state.agentMasterList = action.payload.data;
//                 state.pagination = action.payload.pagination;
//             })
//             .addCase(getAllAgentMasters.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             .addCase(createAgentMaster.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(createAgentMaster.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 state.createAgentMasterResult = action.payload;
//                 state.agentMasterList = [...state.agentMasterList, action.payload.data];
//             })
//             .addCase(createAgentMaster.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             .addCase(updateAgentMaster.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(updateAgentMaster.fulfilled, (state, action: PayloadAction<any>) => {
//                 state.loading = false;
//                 const updatedAgent = action.payload.data;
//                 state.agentMasterList = state.agentMasterList.map((agent: any) =>
//                     agent.id === updatedAgent.id ? updatedAgent : agent
//                 );
//             })
//             .addCase(updateAgentMaster.rejected, (state, action: PayloadAction<string>) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             .addCase(deleteAgentMaster.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(deleteAgentMaster.fulfilled, (state: any, action) => {
//                 state.loading = false;
//                 const deletedId = action.payload;
//                 state.agentMasterList = state.agentMasterList.filter(
//                     (agent: any) => agent.id !== deletedId
//                 );
//             })
//             .addCase(deleteAgentMaster.rejected, (state: any, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//     },
// });

// export default agentMasterSlice.reducer;
import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ApiState {
    loading: boolean;
    error: string | null;
    agentMasterList: any;
    createAgentMasterResult: any;
    checking: boolean;
    pagination: {
        total: number;
        limit: number;
        offset: number;
        next: boolean;
        prev: boolean;
    };
}

const initialState: ApiState = {
    loading: false,
    error: null,
    agentMasterList: [],
    createAgentMasterResult: null,
    checking: false,
    pagination: {
        total: 0,
        limit: 10,
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

export const getAllAgentMasters = createAsyncThunk(
    'agentMaster/getAllAgentMasters',
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
            const url = queryString ? `/agent-master?${queryString}` : "/agent-master";
            const response = await apiService.get(url);
            const paginationData = response?.data;
            const data = Array.isArray(paginationData?.data) ? paginationData.data : [];
            return {
                data,
                pagination: {
                    total: paginationData?.total, // Use total from API if available
                    limit: paginationData?.limit || params.limit || 10,
                    offset: paginationData?.offset || params.offset || 0,
                    next: paginationData?.next || false,
                    prev: paginationData?.prev || false,
                    fetchAll: !!params.fetchAll
                },
            };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const createAgentMaster: any = createAsyncThunk(
    'agentMaster/createAgentMaster',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/agent-master", params);
            console.log(response)
            if (response?.status === 'success') {
                toast.success("Agent saved successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to Create agent Master ");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const updateAgentMaster: any = createAsyncThunk(
    'agentMaster/updateAgentMaster',
    async (params: any, thunkAPI) => {
        console.log(params);
        try {
            const response = await apiService.put(`/agent-master/${params.id}`, params);
            console.log(response);
            if (response?.status === 'success') {
                toast.success("Agent updated successfully");
                return response;
            } else {
                const errorMessage = "Something went wrong";
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to Update agent Master ");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteAgentMaster = createAsyncThunk(
    'agentMaster/deleteAgentMaster',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/agent-master/${id}`);

            if (response?.status === 'success') {
                toast.success('Agent deleted successfully');
                return id;
            }

            const errorMessage = response.data.data?.message || 'Failed to delete agent';
            toast.error(errorMessage);
            return response;

        } catch (error: any) {
            let errorMessage = 'An error occurred while deleting the agent';

            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            } else if (error.request) {
                errorMessage = 'No response from server';
            }

            toast.error(errorMessage);
            return errorMessage;
        }
    }
);

const agentMasterSlice = createSlice({
    name: "agentMaster",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllAgentMasters.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllAgentMasters.fulfilled, (state: any, action) => {
                state.loading = false;
                state.agentMasterList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllAgentMasters.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(createAgentMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createAgentMaster.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.createAgentMasterResult = action.payload;
                state.agentMasterList = [...state.agentMasterList, action.payload.data];
            })
            .addCase(createAgentMaster.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(updateAgentMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateAgentMaster.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedAgent = action.payload.data;
                state.agentMasterList = state.agentMasterList.map((agent: any) =>
                    agent.id === updatedAgent.id ? updatedAgent : agent
                );
            })
            .addCase(updateAgentMaster.rejected, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(deleteAgentMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteAgentMaster.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.agentMasterList = state.agentMasterList.filter(
                    (agent: any) => agent.id !== deletedId
                );
            })
            .addCase(deleteAgentMaster.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            })
    },
});

export default agentMasterSlice.reducer;