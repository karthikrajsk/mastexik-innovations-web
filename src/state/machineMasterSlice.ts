// import apiService from "@/services/ApiService";
// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";

// interface PaginationState {
//   total: number;
//   limit: number;
//   offset: number;
//   next: boolean;
//   prev: boolean;
// }

// interface MachineState {
//   loading: boolean;
//   error: string | null;
//   machineList: any[];
//   createMachineResult: any;
//   pagination: PaginationState;
// }

// const initialState: MachineState = {
//   loading: false,
//   error: null,
//   machineList: [],
//   createMachineResult: null,
//   pagination: {
//     total: 0,
//     limit: 10,
//     offset: 0,
//     next: false,
//     prev: false,
//   },
// };

// export const getAllMachines = createAsyncThunk(
//   "machine-master/getAllMachines",
//   async (
//     params: { limit?: number; offset?: number; fetchAll?: boolean } = {},
//     thunkAPI
//   ) => {
//     try {
//       const queryParams = new URLSearchParams();

//       if (params.fetchAll) {
//         queryParams.append("limit", "10000");
//         queryParams.append("offset", "0");
//       } else {
//         if (params.limit !== undefined)
//           queryParams.append("limit", String(params.limit));
//         if (params.offset !== undefined)
//           queryParams.append("offset", String(params.offset));
//       }

//       const queryString = queryParams.toString();
//       const url = queryString
//         ? `/machine-master?${queryString}`
//         : "/machine-master";

//       const response = await apiService.get(url);

//       const paginationData = response?.data;

//       const data =
//         Array.isArray(paginationData?.data)
//           ? paginationData.data
//           : Array.isArray(paginationData)
//           ? paginationData
//           : [];

//       return {
//         data,
//         pagination: {
//           total: paginationData?.total || data.length,
//           limit: paginationData?.limit || params.limit || 10,
//           offset: paginationData?.offset || params.offset || 0,
//           next: paginationData?.next || false,
//           prev: paginationData?.prev || false,
//         },
//       };
//     } catch (error: any) {
//       return thunkAPI.rejectWithValue(
//         error.message || "Failed to fetch machines"
//       );
//     }
//   }
// );


// export const createMachine = createAsyncThunk(
//   "machine-master/createMachine",
//   async (payload: any, thunkAPI) => {
//     try {
//       const response = await apiService.post("/machine-master", payload);
//       if (response?.status === "success") {
//         toast.success(response?.message || "Saved Successfully");
//         return response?.data || response;
//       }
//       return thunkAPI.rejectWithValue(response?.message || "Failed to save machine");
//     } catch (error: any) {
//       return thunkAPI.rejectWithValue(error.message || "Failed to save machine");
//     }
//   },
// );

// export const updateMachine = createAsyncThunk(
//   "machine-master/updateMachine",
//   async (payload: any, thunkAPI) => {
//     try {
//       const { id, ...data } = payload || {};
//       const response = await apiService.put(`/machine-master/${id}`, data);
//       if (response?.status === "success") {
//         toast.success(response?.message || "Updated Successfully");
//         return response?.data || response;
//       }
//       return thunkAPI.rejectWithValue(response?.message || "Failed to update machine");
//     } catch (error: any) {
//       return thunkAPI.rejectWithValue(error.message || "Failed to update machine");
//     }
//   },
// );

// const machineMasterSlice = createSlice({
//   name: "machineMaster",
//   initialState,
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(getAllMachines.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(getAllMachines.fulfilled, (state, action: PayloadAction<any>) => {
//         state.loading = false;
//         state.machineList = action.payload?.data || [];
//         state.pagination = action.payload?.pagination || state.pagination;
//       })
//       .addCase(getAllMachines.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       })
//       .addCase(createMachine.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(createMachine.fulfilled, (state, action: PayloadAction<any>) => {
//         state.loading = false;
//         state.createMachineResult = action.payload;
//       })
//       .addCase(createMachine.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       })
//       .addCase(updateMachine.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(updateMachine.fulfilled, (state, action: PayloadAction<any>) => {
//         state.loading = false;
//         const updatedMachine = action.payload?.data || action.payload;
//         if (updatedMachine?.id) {
//           state.machineList = state.machineList.map((item) =>
//             item.id === updatedMachine.id ? { ...item, ...updatedMachine } : item,
//           );
//         }
//       })
//       .addCase(updateMachine.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       });
//   },
// });

// export default machineMasterSlice.reducer;
import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

interface MachineState {
  loading: boolean;
  error: string | null;
  machineList: any[];
  createMachineResult: any;
  pagination: PaginationState;
}

const initialState: MachineState = {
  loading: false,
  error: null,
  machineList: [],
  createMachineResult: null,
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


export const getAllMachines = createAsyncThunk(
  "machine-master/getAllMachines",
  async (
    params: { limit?: number; offset?: number; fetchAll?: boolean } = {},
    thunkAPI
  ) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.fetchAll) {
        queryParams.append("limit", "10000");
        queryParams.append("offset", "0");
      } else {
        if (params.limit !== undefined)
          queryParams.append("limit", String(params.limit));
        if (params.offset !== undefined)
          queryParams.append("offset", String(params.offset));
      }

      const queryString = queryParams.toString();
      const url = queryString
        ? `/machine-master?${queryString}`
        : "/machine-master";

      const response = await apiService.get(url);

      const paginationData = response?.data;

      const data =
        Array.isArray(paginationData?.data)
          ? paginationData.data
          : Array.isArray(paginationData)
          ? paginationData
          : [];

      return {
        data,
        pagination: {
          total: paginationData?.total || data.length,
          limit: paginationData?.limit || params.limit || 10,
          offset: paginationData?.offset || params.offset || 0,
          next: paginationData?.next || false,
          prev: paginationData?.prev || false,
        },
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to fetch machines"
      );
    }
  }
);


export const createMachine = createAsyncThunk(
  "machine-master/createMachine",
  async (payload: any, thunkAPI) => {
    try {
      const response = await apiService.post("/machine-master", payload);
      if (response?.status === "success") {
        toast.success(response?.message || "Saved Successfully");
        return response?.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || "Failed to save machine");
    } catch (error: any) 
    {
               const errorMessage = resolveApiErrorMessage(error, "Failed to create Machine Master");
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
  },
);

export const updateMachine = createAsyncThunk(
  "machine-master/updateMachine",
  async (payload: any, thunkAPI) => {
    try {
      const { id, ...data } = payload || {};
      const response = await apiService.put(`/machine-master/${id}`, data);
      if (response?.status === "success") {
        toast.success(response?.message || "Updated Successfully");
        return response?.data || response;
      }
      return thunkAPI.rejectWithValue(response?.message || "Failed to update machine");
    } catch (error: any) 
     {
               const errorMessage = resolveApiErrorMessage(error, "Failed to Update Machine Master");
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
  },
);

const machineMasterSlice = createSlice({
  name: "machineMaster",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllMachines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllMachines.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.machineList = action.payload?.data || [];
        state.pagination = action.payload?.pagination || state.pagination;
      })
      .addCase(getAllMachines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createMachine.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMachine.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.createMachineResult = action.payload;
      })
      .addCase(createMachine.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateMachine.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMachine.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updatedMachine = action.payload?.data || action.payload;
        if (updatedMachine?.id) {
          state.machineList = state.machineList.map((item) =>
            item.id === updatedMachine.id ? { ...item, ...updatedMachine } : item,
          );
        }
      })
      .addCase(updateMachine.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default machineMasterSlice.reducer;