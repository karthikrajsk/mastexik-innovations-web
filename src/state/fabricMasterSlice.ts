import apiService from "@/services/ApiService"
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { toast } from "react-toastify"

export interface ApiState {
  loading: boolean
  error: string | null
  fabricMasterList: any
  fabricMasterFullList: any
  fabricMasterDetailList: any
  creatFabricMasterResult: any
  checking: boolean
  pagination: {  // Add this
    total: number
    offset: number
    limit: number
    next: boolean
    prev: boolean
  }
}

const initialState: ApiState = {
  loading: false,
  error: null,
  fabricMasterList: [],
  fabricMasterFullList: [],
  fabricMasterDetailList: [],
  creatFabricMasterResult: null,
  checking: false,
  pagination: {  // Add this
    total: 0,
    offset: 0,
    limit: 10,
    next: false,
    prev: false
  }
}

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

export const getAllFabricMastersForDropdown = createAsyncThunk(
  "fabric-master/getAllFabricMastersForDropdown",
  async (_, thunkAPI) => {
    try {
      const pageSize = 10000;
      const fabricData: any[] = [];
      let total: number | null = null;
      let offset = 0;

      do {
        const response = await apiService.get(`/fabric-master?limit=${pageSize}&offset=${offset}`);
        const page = Array.isArray(response?.data)
          ? response
          : Array.isArray(response?.data?.data)
            ? response.data
            : Array.isArray(response?.data?.data?.data)
              ? response.data.data
              : null;

        if (!page) {
          throw new Error("Fabric Master API returned an invalid paginated response");
        }

        const pageData = Array.isArray(page.data) ? page.data : page.data.data;
        if (!Array.isArray(pageData)) {
          throw new Error("Fabric Master API response did not contain a data array");
        }

        fabricData.push(...pageData);
        const pageTotal = Number(page.total ?? page.data?.total);
        if (Number.isFinite(pageTotal)) {
          total = pageTotal;
        }

        if (pageData.length === 0 || pageData.length < pageSize) {
          break;
        }

        offset += pageData.length;
      } while (total === null || fabricData.length < total);

      return fabricData
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to load Fabric Master data")
    }
  },
)

// Thunk for getAllFabricMasters GET API call
export const getAllFabricMasters = createAsyncThunk(
  "fabric-master/getAllFabricMasters",
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
      const url = queryString ? `/fabric-master?${queryString}` : "/fabric-master";

      const response = await apiService.get(url);
      console.log('[getAllFabricMasters] Full response.data:', response?.data)
      console.log('[getAllFabricMasters] response.data.data type:', typeof response?.data?.data, 'isArray:', Array.isArray(response?.data?.data))

      let fabricData = []
      let paginationMeta = {}

      // Check if response.data.data is the array directly
      if (Array.isArray(response?.data?.data)) {
        console.log('[getAllFabricMasters] Case 1: response.data.data IS the array')
        fabricData = response.data.data
        // Extract pagination from response.data root level
        paginationMeta = {
          total: response?.data?.total || 0,
          offset: response?.data?.offset || 0,
          limit: response?.data?.limit || 10,
          next: response?.data?.next || false,
          prev: response?.data?.prev || false
        }
      } else if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
        console.log('[getAllFabricMasters] Case 2: response.data.data.data IS the array')
        fabricData = response.data.data.data
        paginationMeta = {
          total: response?.data?.data?.total || 0,
          offset: response?.data?.data?.offset || 0,
          limit: response?.data?.data?.limit || 10,
          next: response?.data?.data?.next || false,
          prev: response?.data?.data?.prev || false
        }
      }

      console.log('[getAllFabricMasters] Final fabricData:', fabricData)
      console.log('[getAllFabricMasters] Final paginationMeta:', paginationMeta)

      const returnValue = {
        data: fabricData,
        pagination: paginationMeta
      }
      console.log('[getAllFabricMasters] Returning:', returnValue)
      return returnValue
    } catch (error: any) {
      console.error('[getAllFabricMasters] Error:', error)
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

export const getAllFabricMasterDetails = createAsyncThunk(
  "fabric-master/getAllFabricMasterDetails",
  async (params: { id: number }, thunkAPI) => {
    try {
      const { id } = params
      const response = await apiService.get(`fabric-master/basic/${id}`)
      const data = response?.data || []
      console.log(response)
      return data || []
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

export const getFabricMasterById = createAsyncThunk(
  "fabric-master/getFabricMasterById",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.get(`/fabric-master/${id}`)
      return response?.data ?? response
    } catch (error: any) {
      const errorMessage = resolveApiErrorMessage(error, "Failed to load fabric master details")
      return thunkAPI.rejectWithValue(errorMessage)
    }
  },
)

// Thunk for createFabricMaster POST API call
export const createFabricMaster: any = createAsyncThunk(
  "fabric-master/createFabricMaster",
  async (params: any, thunkAPI) => {
    console.log("Form data submitted:", params)
    try {
      const response = await apiService.post("/fabric-master", params) // Adjust API endpoint if needed
      console.log(response)
      if (response?.status === "success") {
        toast.success(response?.message)
        return response
      } else {
        const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
        toast.error(errorMessage);
        return thunkAPI.rejectWithValue(errorMessage)
      }
    } catch (error: any) {
        const errorMessage = resolveApiErrorMessage(error, "Failed to create fabric master");
                                toast.error(errorMessage);
        return thunkAPI.rejectWithValue(errorMessage)
    }
  },
)

// Thunk for updateFabricMaster PUT API call
export const updateFabricMaster: any = createAsyncThunk(
  "fabric-master/updateFabricMaster",
  async (params: any, thunkAPI) => {
    console.log(params)
    try {
      const response = await apiService.put(`/fabric-master/${params.id}`, params) // ✅ Fix: Add ID to the URL
      console.log(response)
      if (response?.status === "success") {
        toast.success(response?.message)
        return response
      } else {
          const errorMessage = resolveApiErrorMessage(response, "Something went wrong")
        toast.error(errorMessage);
        return thunkAPI.rejectWithValue(errorMessage)
      }
    } catch (error: any) {
      const errorMessage = resolveApiErrorMessage(error, "Failed to update fabric master");
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage)
    }
  },
)

export const deleteFabricMaster: any = createAsyncThunk(
  "fabric-master/deleteFabricMaster",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/fabric-master/${id}`)
      console.log(response) // Check what the API actually returns
      if (response?.status === "success") {
        toast.success(response?.message)
        return response
      } else {
        const errorMessage = "Something went wrong"
        toast.error(errorMessage)
        return thunkAPI.rejectWithValue(errorMessage)
      }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

// Create fabricMasterSlice
const fabricMasterSlice = createSlice({
  name: "state",
  initialState,
  reducers: {}, // No normal reducers for now
  extraReducers: (builder) => {
    builder

      // Handle getAllFabricMasters (GET request)
      .addCase(getAllFabricMasters.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllFabricMasters.fulfilled, (state: any, action) => {
        console.log('[fabricMasterSlice] getAllFabricMasters fulfilled with payload:', action.payload)
        state.loading = false
        state.fabricMasterList = action.payload.data // Store fabric data
        state.pagination = action.payload.pagination // Store pagination data
        console.log('[fabricMasterSlice] Updated state.fabricMasterList:', state.fabricMasterList)
        console.log('[fabricMasterSlice] Updated state.pagination:', state.pagination)
      })
      .addCase(getAllFabricMasters.rejected, (state: any, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(getAllFabricMastersForDropdown.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllFabricMastersForDropdown.fulfilled, (state: any, action) => {
        state.loading = false
        state.fabricMasterFullList = action.payload  // Store in separate field
      })
      .addCase(getAllFabricMastersForDropdown.rejected, (state: any, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Handle getAllFabricMasterDetails (GET request)
      .addCase(getAllFabricMasterDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllFabricMasterDetails.fulfilled, (state: any, action) => {
        state.loading = false
        state.fabricMasterDetailList = action.payload
      })
      .addCase(getAllFabricMasterDetails.rejected, (state: any, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Handle createFabricMaster (POST request)
      .addCase(createFabricMaster.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createFabricMaster.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        state.creatFabricMasterResult = action.payload
      })
      .addCase(createFabricMaster.rejected, (state, action: PayloadAction<string>) => {
        state.loading = false
        state.error = action.payload
      })

      // Handle updateFabricMaster (PUT request)
      .addCase(updateFabricMaster.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateFabricMaster.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        const updatedTable = action.payload
        state.fabricMasterList = state.fabricMasterList.map((table: any) =>
          table.id === updatedTable.id ? updatedTable : table,
        )
      })
      .addCase(updateFabricMaster.rejected, (state, action: PayloadAction<string>) => {
        state.loading = false
        state.error = action.payload
      })

      // Handle deleteFabricMaster (DELETE request)
      .addCase(deleteFabricMaster.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteFabricMaster.fulfilled, (state: any, action) => {
        state.loading = false
        const deletedFabricMaster = action.payload
        state.fabricMasterList = state.fabricMasterList.filter((fmaster: any) => fmaster.id !== deletedFabricMaster.id)
      })
      .addCase(deleteFabricMaster.rejected, (state: any, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

// Export reducer
export default fabricMasterSlice.reducer
