import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface Defect {
    id: number;
    defectCode: string;
    defectName: string;
    defectPoint: number;
    description: string;
    activeFlag: boolean;
}

export interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

export interface ApiState {
    loading: boolean;
    error: string | null;
    defectMasterList: Defect[];
    createDefectMasterResult: Defect | null;
    checking: boolean,
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    defectMasterList: [],
    createDefectMasterResult: null,
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

const extractDefectArray = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
        if (Array.isArray(payload.data?.data)) return payload.data.data;
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.items)) return payload.items;
        if (Array.isArray(payload.results)) return payload.results;
        if (payload.data) return extractDefectArray(payload.data);
    }
    return [];
};

const toNumber = (value: any): number => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const normalizeDefect = (entry: any): Defect => ({
    id: entry?.id ?? 0,
    defectCode: entry?.defectCode ?? "",
    defectName: entry?.defectName ?? "",
    defectPoint: toNumber(entry?.defectPoint),
    description: entry?.description ?? "",
    activeFlag: Boolean(entry?.activeFlag ?? true),
});

const normalizeDefectList = (payload: any): Defect[] => {
    return extractDefectArray(payload).map(normalizeDefect);
};

const normalizeDefectEntity = (payload: any): Defect | null => {
    if (!payload) return null;
    if (Array.isArray(payload)) {
        const first = payload[0];
        return first ? normalizeDefect(first) : null;
    }
    if (payload && typeof payload === "object") {
        if (Array.isArray(payload.data?.data)) {
            const first = payload.data.data[0];
            return first ? normalizeDefect(first) : null;
        }
        if (Array.isArray(payload.data)) {
            const first = payload.data[0];
            return first ? normalizeDefect(first) : null;
        }
        if (payload.data) {
            return normalizeDefectEntity(payload.data);
        }
        if (payload.result) {
            return normalizeDefect(payload.result);
        }
        return normalizeDefect(payload);
    }
    return null;
};

// export const getAllDefectMaster = createAsyncThunk(
//   "defects/getAllDefectMaster",
//   async (
//     params: { limit?: number; offset?: number; fetchAll?: boolean } = {},
//     thunkAPI
//   ) => {
//     try {
//       const queryParams = new URLSearchParams()

//       if (params.fetchAll) {
//         queryParams.append("limit", "10000")
//         queryParams.append("offset", "0")
//       } else {
//         if (params.limit !== undefined) {
//           queryParams.append("limit", String(params.limit))
//         }
//         if (params.offset !== undefined) {
//           queryParams.append("offset", String(params.offset))
//         }
//       }

//       const queryString = queryParams.toString()
//       const url = queryString ? `/defects?${queryString}` : "/defects"

//       const response = await apiService.get(url)

//       // 🔹 Same as getAllCurrencies
//       const paginationData = response?.data

//       // 🔹 Safe extraction for inconsistent APIs
//       const rawArray =
//         Array.isArray(paginationData?.data?.data)
//           ? paginationData.data.data
//           : Array.isArray(paginationData?.data)
//           ? paginationData.data
//           : Array.isArray(paginationData)
//           ? paginationData
//           : []

//       // 🔹 Keep normalization working
//       const data = normalizeDefectList(rawArray)

//       return {
//         data,
//         pagination: {
//           total: paginationData?.total || rawArray.length || 0,
//           limit:
//             paginationData?.limit ??
//             (params.fetchAll ? 10000 : params.limit ?? 10),
//           offset:
//             paginationData?.offset ??
//             (params.fetchAll ? 0 : params.offset ?? 0),
//           next: paginationData?.next ?? false,
//           prev: paginationData?.prev ?? false,
//         }
//       }

//     } catch (error: any) {
//       return thunkAPI.rejectWithValue(error.message)
//     }
//   }
// );

export const getAllDefectMaster = createAsyncThunk(
  "defects/getAllDefectMaster",
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
      const url = queryString ? `/defects?${queryString}` : "/defects"

      const response = await apiService.get(url)

      const paginationData = response?.data

      const rawData = Array.isArray(paginationData?.data)
        ? paginationData.data
        : []

      const data = normalizeDefectList(rawData)

      return {
        data,
        pagination: {
          total: paginationData?.total || 0,
          limit:
            paginationData?.limit ??
            (params.fetchAll ? 10000 : params.limit ?? 10),
          offset:
            paginationData?.offset ??
            (params.fetchAll ? 0 : params.offset ?? 0),
          next: paginationData?.next ?? false,
          prev: paginationData?.prev ?? false,
        }
      }

    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
);

export const createDefectMaster = createAsyncThunk(
    'defects/createDefectMaster',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/defects", params);
            const normalized = normalizeDefectEntity(response);
            if (normalized) {
                toast.success("Saved Successfully");
                return normalized;
            }
            const errorMessage = response?.message || "Something went wrong";
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
           const errorMessage = resolveApiErrorMessage(error, "Failed to create grade master");
                                           toast.error(errorMessage);
                                           return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const updateDefectMaster = createAsyncThunk(
    'defects/updateDefectMaster',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.put(`/defects/${params.id}`, params);
            const normalized = normalizeDefectEntity(response);
            if (normalized) {
                toast.success("Updated Successfully");
                return normalized;
            }
            const errorMessage = response?.message || "Something went wrong";
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to create grade master");
                                            toast.error(errorMessage);
                                            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteDefectMaster = createAsyncThunk(
    'defects/deleteDefectMaster',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/defects/${id}`);

            if (response?.status === 'success') {
                toast.success("Successfully deleted");
                return id;
            }

            const errorMessage = response?.message || response?.data?.data?.message || 'Failed to delete';
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

const defectSlice = createSlice({
    name: "defect",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllDefectMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllDefectMaster.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.defectMasterList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllDefectMaster.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createDefectMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createDefectMaster.fulfilled, (state, action: PayloadAction<Defect | null>) => {
                state.loading = false;
                state.createDefectMasterResult = action.payload;
                if (action.payload) {
                    state.defectMasterList.push(action.payload);
                }
            })
            .addCase(createDefectMaster.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateDefectMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateDefectMaster.fulfilled, (state, action: PayloadAction<Defect | null>) => {
                state.loading = false;
                const updated = action.payload;
                if (!updated) {
                    return;
                }
                state.defectMasterList = state.defectMasterList.map((table) =>
                    table.id === updated.id ? updated : table
                );
            })
            .addCase(updateDefectMaster.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteDefectMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteDefectMaster.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                state.defectMasterList = state.defectMasterList.filter(
                    (terms) => terms.id !== action.payload
                );
            })
            .addCase(deleteDefectMaster.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default defectSlice.reducer;
