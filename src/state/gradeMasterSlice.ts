import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface Grade {
    id: number;
    gradeName: string;
    gradeCode: string;
    minPoint: number;
    maxPoint: number;
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
    gradeList: Grade[];
    createGrandMasterResult: Grade | null;
    checking: boolean,
    pagination: PaginationState;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    gradeList: [],
    createGrandMasterResult: null,
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

const extractGradeArray = (payload: any): Grade[] => {
    if (Array.isArray(payload)) return payload as Grade[];
    if (payload && typeof payload === "object") {
        if (Array.isArray(payload.data?.data)) return payload.data.data as Grade[];
        if (Array.isArray(payload.data)) return payload.data as Grade[];
        if (payload.data) return extractGradeArray(payload.data);
        if (Array.isArray(payload.items)) return payload.items as Grade[];
        if (Array.isArray(payload.results)) return payload.results as Grade[];
    }
    return [];
};

const toNumber = (value: any): number => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const normalizeGrade = (entry: any): Grade => ({
    id: entry?.id ?? entry?.gradeId ?? 0,
    gradeName: entry?.gradeName ?? entry?.grade_name ?? "",
    gradeCode: entry?.gradeCode ?? entry?.grade_code ?? "",
    minPoint: toNumber(entry?.minPoint ?? entry?.min_point),
    maxPoint: toNumber(entry?.maxPoint ?? entry?.max_point),
    description: entry?.description ?? entry?.desc ?? "",
    activeFlag: Boolean(entry?.activeFlag ?? entry?.active_flag ?? true),
});

const normalizeGradeList = (payload: any): Grade[] => {
    return extractGradeArray(payload).map(normalizeGrade);
};

const normalizeGradeEntity = (payload: any): Grade | null => {
    if (!payload) return null;
    if (Array.isArray(payload)) {
        const first = payload[0];
        return first ? normalizeGrade(first) : null;
    }
    if (payload && typeof payload === "object") {
        if (Array.isArray(payload.data?.data)) {
            const first = payload.data.data[0];
            return first ? normalizeGrade(first) : null;
        }
        if (Array.isArray(payload.data)) {
            const first = payload.data[0];
            return first ? normalizeGrade(first) : null;
        }
        if (payload.data) {
            return normalizeGradeEntity(payload.data);
        }
        if (payload.result) {
            return normalizeGrade(payload.result);
        }
        return normalizeGrade(payload);
    }
    return null;
};

// // Thunk for getAllGrandMaster GET API call
// export const getAllGrandMaster = createAsyncThunk(
//     'grade/getAllGrandMaster',
//     async (params: any = {}, thunkAPI) => {
//         try {
//             const { limit = 10, offset = 0, fetchAll = false } = params;
//             const queryParams = new URLSearchParams();
//             if (!fetchAll) {
//                 queryParams.append('limit', limit);
//                 queryParams.append('offset', offset);
//             } else {
//                 queryParams.append('limit', '10000');
//                 queryParams.append('offset', '0');
//             }
//             const response = await apiService.get(`/grade?${queryParams}`);
//             const data = normalizeGradeList(response);
//             const responseTotal = response?.data?.pagination?.total || data.length;
//             const responseOffset = response?.data?.pagination?.offset ?? offset;
//             const responseLimit = response?.data?.pagination?.limit ?? limit;
//             const nextOffset = responseOffset + responseLimit;
            
//             const pagination = {
//               total: responseTotal,
//               limit: responseLimit,
//               offset: responseOffset,
//               next: nextOffset < responseTotal,
//               prev: responseOffset > 0,
//             };
//             return { data, pagination };
//         } catch (error: any) {
//             return thunkAPI.rejectWithValue(error.message);
//         }
//     }
// );

export const getAllGrandMaster = createAsyncThunk(
  "grade/getAllGrandMaster",
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
      const url = queryString ? `/grade?${queryString}` : "/grade"

      const response = await apiService.get(url)
      console.log(response)

      const paginationData = response?.data

      const data = Array.isArray(paginationData?.data)
        ? paginationData.data
        : []

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

// Thunk for createGrandMaster POST API call
export const createGrandMaster = createAsyncThunk(
    'grade/createGrandMaster',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/grade", params);
            const normalized = normalizeGradeEntity(response);
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

// Thunk for updateGrandMaster PUT API call
export const updateGrandMaster = createAsyncThunk(
    'grade/updateGrandMaster',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.put(`/grade/${params.id}`, params);
            const normalized = normalizeGradeEntity(response);
            if (normalized) {
                toast.success("Updated Successfully");
                return normalized;
            }
            const errorMessage = response?.message || "Something went wrong";
            return thunkAPI.rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to update grade master");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteGrandMaster = createAsyncThunk(
    'grade/deleteGrandMaster',
    async (id: number, thunkAPI) => {
        try {
            const response = await apiService.delete(`/grade/${id}`);

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

// Create uom Slice 
const gradeMasterSlice = createSlice({
    name: "gradeMaster",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllGrandMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllGrandMaster.fulfilled,  (state: any, action) => {
                state.loading = false;
                state.gradeList = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllGrandMaster.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createGrandMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGrandMaster.fulfilled, (state, action: PayloadAction<Grade | null>) => {
                state.loading = false;
                state.createGrandMasterResult = action.payload;
                if (action.payload) {
                    state.gradeList.push(action.payload);
                }
            })
            .addCase(createGrandMaster.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateGrandMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateGrandMaster.fulfilled, (state, action: PayloadAction<Grade | null>) => {
                state.loading = false;
                const updated = action.payload;
                if (!updated) {
                    return;
                }
                state.gradeList = state.gradeList.map((table) =>
                    table.id === updated.id ? updated : table
                );
            })
            .addCase(updateGrandMaster.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteGrandMaster.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteGrandMaster.fulfilled, (state, action: PayloadAction<number>) => {
                state.loading = false;
                state.gradeList = state.gradeList.filter((terms) => terms.id !== action.payload);
            })
            .addCase(deleteGrandMaster.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

    },
});

// Export reducer
export default gradeMasterSlice.reducer;
