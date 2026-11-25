// company-master-slice.ts
import apiService from "@/services/ApiService"
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { toast } from "react-toastify"

// Add this interface for address type
interface AddressType {
  line1: string;
  stateId: string;
  stateCode: string;
  pinCode: string;
  addressType: 'Domestic' | 'Export' | 'Both';
  isDefault: boolean;
}

export interface CompanyMasterState {
  loading: boolean
  error: string | null
  companyMasterList: any
  companyMasterDetailList: any
  createCompanyMasterResult: any
  checking: boolean
  pagination: {
    total: number
    limit: number
    offset: number
    next: boolean
    prev: boolean
  }
}

const initialState: CompanyMasterState = {
  loading: false,
  error: null,
  companyMasterList: [],
  companyMasterDetailList: [],
  createCompanyMasterResult: null,
  checking: false,
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    next: false,
    prev: false,
  },
}

const resolveApiErrorMessage = (error: any): string => {
  if (!error) return 'Something went wrong';
  if (typeof error === 'string') return error;
  if (error.response?.data) {
    const { message } = error.response.data;
    if (typeof message === 'string' && message.trim()) return message;
    if (typeof error.response.data === 'string' && error.response.data.trim()) return error.response.data;
  }
  if (error.data?.message) return error.data.message;
  if (error?.message) return error.message;
  return 'Something went wrong';
};

// Thunk for getAllCompanies GET API call
export const getAllCompanies = createAsyncThunk(
  "company-master/getAllCompanies",
  async (params: { limit?: number; offset?: number; fetchAll?: boolean } = {}, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams()
      if (params.fetchAll) {
        queryParams.append('limit', '10000')
        queryParams.append('offset', '0')
      } else {
        if (params.limit) queryParams.append('limit', String(params.limit))
        if (params.offset !== undefined) queryParams.append('offset', String(params.offset))
      }
      const queryString = queryParams.toString()
      const url = queryString ? `/companies?${queryString}` : "/companies"
      const response = await apiService.get(url)
      const paginationData = response?.data
      const data = Array.isArray(paginationData?.data) ? paginationData.data : []
      return {
        data,
        pagination: {
          total: paginationData?.total || 0,
          limit: paginationData?.limit || params.limit || 10,
          offset: paginationData?.offset || params.offset || 0,
          next: paginationData?.next || false,
          prev: paginationData?.prev || false,
        },
      }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

// Thunk for getCompanyById GET API call
export const getCompanyById = createAsyncThunk(
  "company-master/getCompanyById",
  async (params: { id: number }, thunkAPI) => {
    try {
      const { id } = params
      const response = await apiService.get(`/companies/${id}`)
      const data = response?.data
      console.log('[Company Thunk] Response:', response)
      console.log('[Company Thunk] Returning data:', data)
      return data
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

// Thunk for createCompany POST API call - FIXED with TypeScript
export const createCompany: any = createAsyncThunk(
  "company-master/createCompany",
  async (params: any, thunkAPI) => {
    console.log("Company form data submitted:", params)
    try {
      // Data transformation for backend compatibility
      const transformedParams = {
        ...params,
        address: params.address.map((addr: AddressType) => ({
          ...addr,
          stateId: Number(addr.stateId),
          isDefault: Boolean(addr.isDefault)
        }))
      };
      
      const response = await apiService.post("/companies", transformedParams)
      console.log(response)
      if (response?.status === "success") {
        toast.success(response?.message)
        return response?.data
      } else {
        const errorMessage = "Something went wrong"
        return thunkAPI.rejectWithValue(errorMessage)
      }
    } catch (error: any) {
      const errorMessage = resolveApiErrorMessage(error)
      return thunkAPI.rejectWithValue(errorMessage)
    }
  },
)

// Thunk for updateCompany PUT API call - FIXED with TypeScript
export const updateCompany: any = createAsyncThunk(
  "company-master/updateCompany",
  async (params: any, thunkAPI) => {
    console.log(params)
    try {
      // Data transformation for backend compatibility
      const transformedParams = {
        ...params,
        address: params.address.map((addr: AddressType) => ({
          ...addr,
          stateId: Number(addr.stateId),
          isDefault: Boolean(addr.isDefault)
        }))
      };
      
      const response = await apiService.put(`/companies/${params.id}`, transformedParams)
      console.log(response)
      if (response?.status === "success") {
        toast.success(response?.message)
        return response?.data
      } else {
        const errorMessage = "Something went wrong"
        toast.error(errorMessage)
        return thunkAPI.rejectWithValue(errorMessage)
      }
    } catch (error: any) {
      const errorMessage = resolveApiErrorMessage(error)
      return thunkAPI.rejectWithValue(errorMessage)
    }
  },
)

// Thunk for deleteCompany DELETE API call
export const deleteCompany: any = createAsyncThunk(
  "company-master/deleteCompany",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/companies/${id}`)
      console.log(response)
      if (response?.status === "success") {
        toast.success(response?.message)
        return id
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

// Rest of your slice remains the same...
const companyMasterSlice = createSlice({
  name: "companyMaster",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllCompanies.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllCompanies.fulfilled, (state: any, action) => {
        state.loading = false
        const sortedData = Array.isArray(action.payload.data)
          ? [...action.payload.data].sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
          : []
        state.companyMasterList = sortedData
        state.pagination = action.payload.pagination
      })
      .addCase(getAllCompanies.rejected, (state: any, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getCompanyById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCompanyById.fulfilled, (state: any, action) => {
        state.loading = false
        state.companyMasterDetailList = action.payload
      })
      .addCase(getCompanyById.rejected, (state: any, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createCompany.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCompany.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        state.createCompanyMasterResult = action.payload
      })
      .addCase(createCompany.rejected, (state, action: PayloadAction<string>) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(updateCompany.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCompany.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        const updatedCompany = action.payload
        if (updatedCompany?.id) {
          state.companyMasterList = state.companyMasterList.map((company: any) =>
            company.id === updatedCompany.id ? updatedCompany : company,
          )
        }
      })
      .addCase(updateCompany.rejected, (state, action: PayloadAction<string>) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(deleteCompany.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteCompany.fulfilled, (state: any, action) => {
        state.loading = false
        const deletedCompanyId = action.payload
        state.companyMasterList = state.companyMasterList.filter(
          (company: any) => company.id !== deletedCompanyId,
        )
      })
      .addCase(deleteCompany.rejected, (state: any, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default companyMasterSlice.reducer