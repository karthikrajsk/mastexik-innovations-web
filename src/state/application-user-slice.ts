import apiService from "@/services/ApiService"
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { toast } from "react-toastify"

export interface ApplicationUser {
  id: number
  userName: string
  role: 'Sales' | 'PPC' | 'Inventory' | 'Admin' | 'Technical Team' | 'Merchant' | 'Sizing' | 'Weaving' | 'Brushing'
  roleDisplayName?: string  
  moduleId?: number
  companies: number[]
  activeFlag: boolean
  email?: string
  phoneNumber?: string
  password?: string
  [key: string]: any
}

export interface PaginationState {
  total: number
  limit: number
  offset: number
  next: boolean
  prev: boolean
}

export interface ApplicationUserState {
  loading: boolean
  error: string | null
  applicationUserList: ApplicationUser[]
  applicationUserDetail: ApplicationUser | null
  createApplicationUserResult: ApplicationUser | null
  pagination: PaginationState
}

const initialState: ApplicationUserState = {
  loading: false,
  error: null,
  applicationUserList: [],
  applicationUserDetail: null,
  createApplicationUserResult: null,
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    next: false,
    prev: false,
  },
}

const toNumber = (value: any): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const extractApplicationUserArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data?.data)) return payload.data.data
    if (Array.isArray(payload.data?.items)) return payload.data.items
    if (Array.isArray(payload.data)) return payload.data
    if (Array.isArray(payload.items)) return payload.items
    if (Array.isArray(payload.results)) return payload.results
    if (Array.isArray(payload.records)) return payload.records
    if (payload.data) return extractApplicationUserArray(payload.data)
  }
  return []
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

// const normalizeRole = (value: any): ApplicationUser['role'] => {
//   const text = typeof value === "string" ? value.trim().toLowerCase() : ""
//   if (text === "ppc") return "PPC"
//   if (text === "inventory") return "Inventory"
//   if (text === "admin") return "Admin"
//   return "Sales"
// }

const normalizeRole = (value: any): ApplicationUser['role'] => {
  const text = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (text === "ppc") return "PPC"
  if (text === "technical team") return "Technical Team"
  if (text === "inventory") return "Inventory"
  if (text === "merchant") return "Merchant"
  if (text === "admin") return "Admin"
  if (text === "sizing") return "Sizing"
  if (text === "weaving") return "Weaving"
  if (text === "brushing") return "Brushing"
  return "Sales"
}

const normalizeApplicationUser = (entry: any): ApplicationUser => {
  const moduleValue = entry?.moduleId ?? entry?.moduleID ?? undefined
  const companiesValue = entry?.companies
  const normalizedCompanies = Array.isArray(companiesValue)
    ? companiesValue.map((id: any) => toNumber(id)).filter((id: number) => Number.isFinite(id))
    : []

  const normalized: ApplicationUser = {
    ...entry,
    id: toNumber(entry?.id),
    userName: entry?.userName ?? "",
    role: normalizeRole(entry?.role),
    roleDisplayName: entry?.roleDisplayName,
    moduleId: moduleValue == null ? undefined : toNumber(moduleValue),
    companies: normalizedCompanies,
    activeFlag: Boolean(entry?.activeFlag ?? entry?.isActive ?? true),
  }

  return normalized
}

const normalizeApplicationUserList = (payload: any): ApplicationUser[] => {
  return extractApplicationUserArray(payload).map(normalizeApplicationUser)
}

const normalizeApplicationUserEntity = (payload: any): ApplicationUser | null => {
  if (!payload) return null
  if (Array.isArray(payload)) {
    const first = payload[0]
    return first ? normalizeApplicationUser(first) : null
  }
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data?.data)) {
      const first = payload.data.data[0]
      return first ? normalizeApplicationUser(first) : null
    }
    if (Array.isArray(payload.data)) {
      const first = payload.data[0]
      return first ? normalizeApplicationUser(first) : null
    }
    if (payload.data) return normalizeApplicationUserEntity(payload.data)
    if (payload.result) return normalizeApplicationUser(payload.result)
    if (payload.record) return normalizeApplicationUser(payload.record)
    return normalizeApplicationUser(payload)
  }
  return null
}
export const getAllApplicationUsers = createAsyncThunk(
  "application-user/getAllApplicationUsers",
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
      const url = queryString
        ? `/application-users?${queryString}`
        : "/application-users"

      const response = await apiService.get(url)

      // ✅ SAME AS CURRENCY
      const paginationData = response?.data

      const rawData = Array.isArray(paginationData?.data)
        ? paginationData.data
        : []

      const data = normalizeApplicationUserList(rawData)

      return {
        data,
        pagination: {
          total: paginationData?.total || 0,
          limit: paginationData?.limit || (params.fetchAll ? 10000 : params.limit ?? 10),
          offset: paginationData?.offset || (params.fetchAll ? 0 : params.offset ?? 0),
          next: paginationData?.next || false,
          prev: paginationData?.prev || false,
        }
      }

    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  }
);

// export const getAllApplicationUsers = createAsyncThunk(
//   "application-user/getAllApplicationUsers",
//   async (params: { limit?: number; offset?: number } = {}, thunkAPI) => {
//     try {
//       const queryParams = new URLSearchParams()
//       if (params.limit !== undefined) queryParams.append('limit', String(params.limit))
//       if (params.offset !== undefined) queryParams.append('offset', String(params.offset))
//       const queryString = queryParams.toString()
//       const url = queryString ? `/application-users?${queryString}` : "/application-users"
//       const response = await apiService.get(url)
//       const payload = response?.data?.data
//       const data = normalizeApplicationUserList(payload)
//       const paginationPayload = payload || {}
//       const pagination: PaginationState = {
//         total: paginationPayload?.total ?? data.length,
//         limit: paginationPayload?.limit ?? (params.limit ?? 10),
//         offset: paginationPayload?.offset ?? (params.offset ?? 0),
//         next: paginationPayload?.next ?? false,
//         prev: paginationPayload?.prev ?? false,
//       }
//       return { data, pagination }
//     } catch (error: any) {
//       return thunkAPI.rejectWithValue(error.message)
//     }
//   },
// )

export const getApplicationUserById = createAsyncThunk(
  "application-user/getApplicationUserById",
  async (params: { id: number }, thunkAPI) => {
    try {
      const { id } = params
      const response = await apiService.get(`/application-users/${id}`)
      return normalizeApplicationUserEntity(response)
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

export const searchApplicationUsers = createAsyncThunk(
  "application-user/searchApplicationUsers",
  async (params: { query: string }, thunkAPI) => {
    try {
      const { query } = params
      const response = await apiService.get(`/application-users/search?query=${query}`)
      return normalizeApplicationUserList(response)
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

export const getApplicationUsersByRole = createAsyncThunk(
  "application-user/getApplicationUsersByRole",
  async (params: { role: string }, thunkAPI) => {
    try {
      const { role } = params
      const response = await apiService.get(`/application-users/role/${role}`)
      return normalizeApplicationUserList(response)
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

export const createApplicationUser = createAsyncThunk(
  "application-user/createApplicationUser",
  async (params: any, thunkAPI) => {
    try {
      const transformedParams = {
        ...params,
        userName: params.userName.toUpperCase(),
        companies: (params.companies || []).map((id: any) => Number(id)),
      }

      const response = await apiService.post("/application-users", transformedParams)
      if (response?.status === "success") {
        const normalized = normalizeApplicationUserEntity(response)
        if (normalized) {
          toast.success(response?.message)
          return normalized
        }
      }
      const errorMessage = response?.message || "Something went wrong"
      toast.error(errorMessage)
      return thunkAPI.rejectWithValue(errorMessage)
    } catch (error: any) {
    const errorMessage = resolveApiErrorMessage(error, "Failed to create menu master");
                                                   toast.error(errorMessage);
                                                   return thunkAPI.rejectWithValue(errorMessage);
    }
  },
)

export const updateApplicationUser = createAsyncThunk(
  "application-user/updateApplicationUser",
  async (params: any, thunkAPI) => {
    try {
      const transformedParams = {
        ...params,
        userName: params.userName.toUpperCase(),
        companies: (params.companies || []).map((id: any) => Number(id)),
      }

      const response = await apiService.put(`/application-users/${params.id}`, transformedParams)
      if (response?.status === "success") {
        const normalized = normalizeApplicationUserEntity(response)
        if (normalized) {
          toast.success(response?.message)
          return normalized
        }
      }
      const errorMessage = response?.message || "Something went wrong"
      toast.error(errorMessage)
      return thunkAPI.rejectWithValue(errorMessage)
    } catch (error: any) {
     const errorMessage = resolveApiErrorMessage(error, "Failed to create menu master");
                                                    toast.error(errorMessage);
                                                    return thunkAPI.rejectWithValue(errorMessage);
    }
  },
)

export const deleteApplicationUser = createAsyncThunk(
  "application-user/deleteApplicationUser",
  async (id: number, thunkAPI) => {
    try {
      const response = await apiService.delete(`/application-users/${id}`)
      if (response?.status === "success") {
        toast.success(response?.message)
        return id
      }
      const errorMessage = response?.message || "Something went wrong"
      toast.error(errorMessage)
      return thunkAPI.rejectWithValue(errorMessage)
    } catch (error: any) {
      toast.error(error.message)
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

const applicationUserSlice = createSlice({
  name: "applicationUser",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllApplicationUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllApplicationUsers.fulfilled, (state, action: PayloadAction<{ data: ApplicationUser[]; pagination: PaginationState }>) => {
        state.loading = false
        state.applicationUserList = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(getAllApplicationUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(getApplicationUserById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getApplicationUserById.fulfilled, (state, action: PayloadAction<ApplicationUser | null>) => {
        state.loading = false
        state.applicationUserDetail = action.payload
      })
      .addCase(getApplicationUserById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(searchApplicationUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchApplicationUsers.fulfilled, (state, action: PayloadAction<ApplicationUser[]>) => {
        state.loading = false
        state.applicationUserList = action.payload
      })
      .addCase(searchApplicationUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(getApplicationUsersByRole.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getApplicationUsersByRole.fulfilled, (state, action: PayloadAction<ApplicationUser[]>) => {
        state.loading = false
        state.applicationUserList = action.payload
      })
      .addCase(getApplicationUsersByRole.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(createApplicationUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createApplicationUser.fulfilled, (state, action: PayloadAction<ApplicationUser | null>) => {
        state.loading = false
        state.createApplicationUserResult = action.payload
        if (action.payload) state.applicationUserList.push(action.payload)
      })
      .addCase(createApplicationUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(updateApplicationUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateApplicationUser.fulfilled, (state, action: PayloadAction<ApplicationUser | null>) => {
        state.loading = false
        const updatedUser = action.payload
        if (!updatedUser) return
        state.applicationUserList = state.applicationUserList.map((user) =>
          user.id === updatedUser.id ? updatedUser : user,
        )
      })
      .addCase(updateApplicationUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(deleteApplicationUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteApplicationUser.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false
        state.applicationUserList = state.applicationUserList.filter((user) => user.id !== action.payload)
      })
      .addCase(deleteApplicationUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export default applicationUserSlice.reducer
