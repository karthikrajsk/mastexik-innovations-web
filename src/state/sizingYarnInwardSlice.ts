// import apiService from "@/services/ApiService";
// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { toast } from "react-toastify";

// export interface PaginationState {
//   total: number;
//   limit: number;
//   offset: number;
//   next: boolean;
//   prev: boolean;
// }

// interface SizingYarnInwardState {
//   loading: boolean;
//   error: string | null;
//   list: any[];
//   current?: any | null;
//   createResult?: any | null;
//   pagination: PaginationState;
// }

// const initialState: SizingYarnInwardState = {
//   loading: false,
//   error: null,
//   list: [],
//   current: null,
//   createResult: null,
//   pagination: {
//     total: 0,
//     limit: 10,
//     offset: 0,
//     next: false,
//     prev: false,
//   },
// };

// const BASE = "/sizing-yarn-inward";

// const resolveApiErrorMessage = (error: any, fallback: string) => {
//     const responseData = error?.response?.data;
//     const candidates: string[] = [];

//     if (typeof responseData === "string") {
//         candidates.push(responseData);
//     } else if (responseData) {
//         if (typeof responseData.message === "string") {
//             candidates.push(responseData.message);
//         }
//         if (typeof responseData.error === "string") {
//             candidates.push(responseData.error);
//         }
//         if (typeof responseData.data === "string") {
//             candidates.push(responseData.data);
//         }
//         if (responseData.data && typeof responseData.data === "object") {
//             if (typeof responseData.data.message === "string") {
//                 candidates.push(responseData.data.message);
//             }
//             if (typeof responseData.data.error === "string") {
//                 candidates.push(responseData.data.error);
//             }
//             if (Array.isArray(responseData.data.errors)) {
//                 responseData.data.errors.forEach((err: any) => {
//                     if (typeof err === "string") {
//                         candidates.push(err);
//                     } else if (typeof err?.message === "string") {
//                         candidates.push(err.message);
//                     }
//                 });
//             }
//         }
//         if (Array.isArray(responseData.errors)) {
//             responseData.errors.forEach((err: any) => {
//                 if (typeof err === "string") {
//                     candidates.push(err);
//                 } else if (typeof err?.message === "string") {
//                     candidates.push(err.message);
//                 }
//             });
//         }
//     }

//     const candidate = candidates.find((msg) => typeof msg === "string" && msg.trim());
//     return candidate || error?.message || fallback;
// };

// const mapApiResponse = (response: any, limit: number, offset: number) => {
//   const rawData = Array.isArray(response?.data?.data)
//     ? response.data.data
//     : Array.isArray(response?.data?.rows)
//       ? response.data.rows
//       : Array.isArray(response?.data)
//         ? response.data
//         : Array.isArray(response)
//           ? response
//           : [];

//   const paginationSource = response?.data?.pagination;
//   const total = paginationSource?.total ?? rawData.length;
//   const resolvedOffset = paginationSource?.offset ?? offset;
//   const resolvedLimit = paginationSource?.limit ?? limit;
//   const nextOffset = resolvedOffset + resolvedLimit;

//   return {
//     data: rawData,
//     pagination: {
//       total,
//       limit: resolvedLimit,
//       offset: resolvedOffset,
//       next: nextOffset < total,
//       prev: resolvedOffset > 0,
//     },
//   };
// };

// export const getSizingYarnInwardsByFactoryCompanyId = createAsyncThunk(
//   "sizingYarnInward/getByFactoryCompanyId",
//   async (
//     payload: number | { companyId: number; limit?: number; offset?: number; fetchAll?: boolean },
//     thunkAPI
//   ) => {
//     try {
//       const params = typeof payload === "number" ? { companyId: payload } : payload;
//       const companyId = params?.companyId;
//       if (!companyId && companyId !== 0) {
//         throw new Error("companyId is required");
//       }

//       const baseLimit = params?.limit ?? 10000;
//       const baseOffset = params?.offset ?? 0;
//       const shouldFetchAll = params?.fetchAll ?? (params?.limit === undefined && params?.offset === undefined);
//       const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
//       const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

//       const queryParams = new URLSearchParams();
//       queryParams.append("limit", String(effectiveLimit));
//       queryParams.append("offset", String(effectiveOffset));
//       const queryString = queryParams.toString();

//       const response = await apiService.get(`${BASE}/factory/${companyId}${queryString ? `?${queryString}` : ""}`);
//       return mapApiResponse(response, effectiveLimit, effectiveOffset);
//     } catch (error: any) {
//       return thunkAPI.rejectWithValue(error.message || "Failed to load");
//     }
//   }
// );

// export const getAllSizingYarnInwards = createAsyncThunk(
//   "sizingYarnInward/getAllSizingYarnInwards",
//   async (params: { limit?: number; offset?: number; fetchAll?: boolean } | undefined, thunkAPI) => {
//     try {
//       const baseLimit = params?.limit ?? 10000;
//       const baseOffset = params?.offset ?? 0;
//       const shouldFetchAll = params?.fetchAll ?? (params?.limit === undefined && params?.offset === undefined);
//       const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
//       const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

//       const queryParams = new URLSearchParams();
//       queryParams.append("limit", String(effectiveLimit));
//       queryParams.append("offset", String(effectiveOffset));
//       const queryString = queryParams.toString();

//       const response = await apiService.get(`${BASE}${queryString ? `?${queryString}` : ""}`);
//       return mapApiResponse(response, effectiveLimit, effectiveOffset);
//     } catch (error: any) {
//       return thunkAPI.rejectWithValue(error.message || "Failed to load");
//     }
//   }
// );

// export const getSizingYarnInwardById = createAsyncThunk(
//   "sizingYarnInward/getSizingYarnInwardById",
//   async (id: number, thunkAPI) => {
//     try {
//       const response = await apiService.get(`${BASE}/${id}`);
//       return response?.data ?? response;
//     } catch (error: any) {
//       return thunkAPI.rejectWithValue(error.message || "Failed to load record");
//     }
//   }
// );

// export const createSizingYarnInward = createAsyncThunk(
//   "sizingYarnInward/createSizingYarnInward",
//   async (data: any, thunkAPI) => {
//     try {
//       const response = await apiService.post(`${BASE}`, data);
//       toast.success("Saved Successfully!");
//       return response?.data ?? response;
//     } catch (error: any) {
//        const errorMessage = resolveApiErrorMessage(error, "Failed to create Sizing yarn inward");
//                         toast.error(errorMessage);
//                         return thunkAPI.rejectWithValue(errorMessage);
//       // const msg = error.message || "Create failed";
//       // toast.error(msg);
//       // return thunkAPI.rejectWithValue(msg);
//     }
//   }
// );

// export const updateSizingYarnInward = createAsyncThunk(
//   "sizingYarnInward/updateSizingYarnInward",
//   async ({ id, data, factoryCompanyId }: { id: number; data: any; factoryCompanyId?: number }, thunkAPI) => {
//     try {
//       const url = factoryCompanyId ? `${BASE}/${id}?factoryCompanyId=${factoryCompanyId}` : `${BASE}/${id}`;
//       const response = await apiService.put(url, data);
//       toast.success("Updated successfully!");
//       return response?.data ?? response;
//     } catch (error: any) {
//       const msg = error.message || "Update failed";
//       toast.error(msg);
//       return thunkAPI.rejectWithValue(msg);
//     }
//   }
// );

// export const deleteSizingYarnInward = createAsyncThunk(
//   "sizingYarnInward/deleteSizingYarnInward",
//   async (payload: number | { id: number; factoryCompanyId?: number }, thunkAPI) => {
//     try {
//       const { id, factoryCompanyId } = typeof payload === "number" ? { id: payload, factoryCompanyId: undefined } : payload;
//       const url = factoryCompanyId ? `${BASE}/${id}?factoryCompanyId=${factoryCompanyId}` : `${BASE}/${id}`;
//       const response = await apiService.delete(url);
//       if (response?.status === "success") {
//         toast.success("Successfully deleted");
//         return id;
//       }
//       toast.success("Successfully deleted");
//       return id;
//     } catch (error: any) {
//       const msg = error?.response?.data?.message || error.message || "Delete failed";
//       toast.error(msg);
//       return thunkAPI.rejectWithValue(msg);
//     }
//   }
// );

// const sizingYarnInwardSlice = createSlice({
//   name: "sizingYarnInward",
//   initialState,
//   reducers: {
//     clearSizingYarnInwardCurrent(state) {
//       state.current = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(getAllSizingYarnInwards.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(getAllSizingYarnInwards.fulfilled, (state, action: PayloadAction<any>) => {
//         state.loading = false;
//         const payload = action.payload || { data: [], pagination: state.pagination };
//         state.list = payload.data || [];
//         state.pagination = payload.pagination || state.pagination;
//       })
//       .addCase(getAllSizingYarnInwards.rejected, (state, action: any) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       })
//       .addCase(getSizingYarnInwardsByFactoryCompanyId.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(getSizingYarnInwardsByFactoryCompanyId.fulfilled, (state, action: PayloadAction<any>) => {
//         state.loading = false;
//         const payload = action.payload || { data: [], pagination: state.pagination };
//         state.list = payload.data || [];
//         state.pagination = payload.pagination || state.pagination;
//       })
//       .addCase(getSizingYarnInwardsByFactoryCompanyId.rejected, (state, action: any) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       })
//       .addCase(getSizingYarnInwardById.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(getSizingYarnInwardById.fulfilled, (state, action: PayloadAction<any>) => {
//         state.loading = false;
//         state.current = action.payload;
//       })
//       .addCase(getSizingYarnInwardById.rejected, (state, action: any) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       })
//       .addCase(createSizingYarnInward.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(createSizingYarnInward.fulfilled, (state, action: PayloadAction<any>) => {
//         state.loading = false;
//         state.createResult = action.payload;
//         state.pagination.total = (state.pagination.total || 0) + 1;
//         if (action.payload && action.payload.id) {
//           state.list = [action.payload, ...state.list];
//         }
//       })
//       .addCase(createSizingYarnInward.rejected, (state, action: any) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       })
//       .addCase(updateSizingYarnInward.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(updateSizingYarnInward.fulfilled, (state, action: PayloadAction<any>) => {
//         state.loading = false;
//         const updated = action.payload;
//         state.list = state.list.map((x: any) => (x.id === updated?.id ? updated : x));
//       })
//       .addCase(updateSizingYarnInward.rejected, (state, action: any) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       })
//       .addCase(deleteSizingYarnInward.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(deleteSizingYarnInward.fulfilled, (state, action: PayloadAction<number>) => {
//         state.loading = false;
//         const deletedId = action.payload;
//         state.list = state.list.filter((item: any) => item.id !== deletedId);
//         state.pagination.total = Math.max(0, (state.pagination.total || 0) - 1);
//       })
//       .addCase(deleteSizingYarnInward.rejected, (state, action: any) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       });
//   },
// });

// export const { clearSizingYarnInwardCurrent } = sizingYarnInwardSlice.actions;
// export default sizingYarnInwardSlice.reducer;

import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  next: boolean;
  prev: boolean;
}

interface SizingYarnInwardState {
  loading: boolean;
  error: string | null;
  list: any[];
  current?: any | null;
  createResult?: any | null;
  pagination: PaginationState;
}

const initialState: SizingYarnInwardState = {
  loading: false,
  error: null,
  list: [],
  current: null,
  createResult: null,
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    next: false,
    prev: false,
  },
};

const BASE = "/sizing-yarn-inward";

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

const mapApiResponse = (response: any, limit: number, offset: number) => {
  const rawData = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data?.rows)
      ? response.data.rows
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

  const paginationSource = response?.data?.pagination;
  const total = paginationSource?.total ?? rawData.length;
  const resolvedOffset = paginationSource?.offset ?? offset;
  const resolvedLimit = paginationSource?.limit ?? limit;
  const nextOffset = resolvedOffset + resolvedLimit;

  return {
    data: rawData,
    pagination: {
      total,
      limit: resolvedLimit,
      offset: resolvedOffset,
      next: nextOffset < total,
      prev: resolvedOffset > 0,
    },
  };
};

export const getSizingYarnInwardsByFactoryCompanyId = createAsyncThunk(
  "sizingYarnInward/getByFactoryCompanyId",
  async (
    payload: number | { companyId?: number; factoryCompanyId?: number; limit?: number; offset?: number; fetchAll?: boolean },
    thunkAPI
  ) => {
    try {
      const params = typeof payload === "number" ? { companyId: payload } : payload;
      const companyId = params?.companyId ?? params?.factoryCompanyId;
      if (!companyId && companyId !== 0) {
        throw new Error("companyId is required");
      }

      const baseLimit = params?.limit ?? 10;
      const baseOffset = params?.offset ?? 0;
      const shouldFetchAll = params?.fetchAll ?? false;
      const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
      const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

      const queryParams = new URLSearchParams();
      queryParams.append("limit", String(effectiveLimit));
      queryParams.append("offset", String(effectiveOffset));
      const queryString = queryParams.toString();

      const response = await apiService.get(`${BASE}/factory/${companyId}/paginated${queryString ? `?${queryString}` : ""}`);
      const rawData = Array.isArray(response?.data) ? response.data : [];
      const total = response?.total ?? rawData.length;
      const resolvedOffset = response?.offset ?? effectiveOffset;
      const resolvedLimit = response?.limit ?? effectiveLimit;
      const nextOffset = resolvedOffset + resolvedLimit;
      return {
        data: rawData,
        pagination: {
          total,
          limit: resolvedLimit,
          offset: resolvedOffset,
          next: response?.next ?? nextOffset < total,
          prev: response?.prev ?? resolvedOffset > 0,
        },
      };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load");
    }
  }
);

export const getAllSizingYarnInwards = createAsyncThunk(
  "sizingYarnInward/getAllSizingYarnInwards",
  async (params: { limit?: number; offset?: number; fetchAll?: boolean } | undefined, thunkAPI) => {
    try {
      const baseLimit = params?.limit ?? 10000;
      const baseOffset = params?.offset ?? 0;
      const shouldFetchAll = params?.fetchAll ?? (params?.limit === undefined && params?.offset === undefined);
      const effectiveLimit = shouldFetchAll ? 10000 : baseLimit;
      const effectiveOffset = shouldFetchAll ? 0 : baseOffset;

      const queryParams = new URLSearchParams();
      queryParams.append("limit", String(effectiveLimit));
      queryParams.append("offset", String(effectiveOffset));
      const queryString = queryParams.toString();

      const response = await apiService.get(`${BASE}${queryString ? `?${queryString}` : ""}`);
      return mapApiResponse(response, effectiveLimit, effectiveOffset);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load");
    }
  }
);

export const getSizingYarnInwardById = createAsyncThunk(
  "sizingYarnInward/getSizingYarnInwardById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`${BASE}/${id}`);
      return response?.data ?? response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load record");
    }
  }
);

export const createSizingYarnInward = createAsyncThunk(
  "sizingYarnInward/createSizingYarnInward",
  async (data: any, thunkAPI) => {
    try {
      const response = await apiService.post(`${BASE}`, data);
      toast.success("Saved Successfully!");
      return response?.data ?? response;
    } catch (error: any) {
       const errorMessage = resolveApiErrorMessage(error, "Failed to create Sizing yarn inward");
                        toast.error(errorMessage);
                        return thunkAPI.rejectWithValue(errorMessage);
      // const msg = error.message || "Create failed";
      // toast.error(msg);
      // return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateSizingYarnInward = createAsyncThunk(
  "sizingYarnInward/updateSizingYarnInward",
  async ({ id, data, factoryCompanyId }: { id: number; data: any; factoryCompanyId?: number }, thunkAPI) => {
    try {
      const url = factoryCompanyId ? `${BASE}/${id}?factoryCompanyId=${factoryCompanyId}` : `${BASE}/${id}`;
      const response = await apiService.put(url, data);
      toast.success("Updated successfully!");
      return response?.data ?? response;
    } catch (error: any) {
      const msg = error.message || "Update failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteSizingYarnInward = createAsyncThunk(
  "sizingYarnInward/deleteSizingYarnInward",
  async (payload: number | { id: number; factoryCompanyId?: number }, thunkAPI) => {
    try {
      const { id, factoryCompanyId } = typeof payload === "number" ? { id: payload, factoryCompanyId: undefined } : payload;
      const url = factoryCompanyId ? `${BASE}/${id}?factoryCompanyId=${factoryCompanyId}` : `${BASE}/${id}`;
      const response = await apiService.delete(url);
      if (response?.status === "success") {
        toast.success("Successfully deleted");
        return id;
      }
      toast.success("Successfully deleted");
      return id;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Delete failed";
      toast.error(msg);
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const sizingYarnInwardSlice = createSlice({
  name: "sizingYarnInward",
  initialState,
  reducers: {
    clearSizingYarnInwardCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllSizingYarnInwards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSizingYarnInwards.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.list = payload.data || [];
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getAllSizingYarnInwards.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getSizingYarnInwardsByFactoryCompanyId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSizingYarnInwardsByFactoryCompanyId.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || { data: [], pagination: state.pagination };
        state.list = payload.data || [];
        state.pagination = payload.pagination || state.pagination;
      })
      .addCase(getSizingYarnInwardsByFactoryCompanyId.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getSizingYarnInwardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSizingYarnInwardById.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getSizingYarnInwardById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSizingYarnInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSizingYarnInward.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.createResult = action.payload;
        state.pagination.total = (state.pagination.total || 0) + 1;
        if (action.payload && action.payload.id) {
          state.list = [action.payload, ...state.list];
        }
      })
      .addCase(createSizingYarnInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSizingYarnInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSizingYarnInward.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updated = action.payload;
        state.list = state.list.map((x: any) => (x.id === updated?.id ? updated : x));
      })
      .addCase(updateSizingYarnInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteSizingYarnInward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSizingYarnInward.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const deletedId = action.payload;
        state.list = state.list.filter((item: any) => item.id !== deletedId);
        state.pagination.total = Math.max(0, (state.pagination.total || 0) - 1);
      })
      .addCase(deleteSizingYarnInward.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSizingYarnInwardCurrent } = sizingYarnInwardSlice.actions;
export default sizingYarnInwardSlice.reducer;
