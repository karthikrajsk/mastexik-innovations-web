import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface PaginationInfo {
    total: number;
    next: boolean;
    prev: boolean;
    offset: number;
    limit: number;
}

export interface ApiState {
    loading: boolean;
    error: string | null;
    purchaseInwardList: any[];
    paginationInfo: PaginationInfo;
    createPurchaseInwardResult: any;
    canDeleteStatus: Record<string, boolean>;
    itemsDeletionStatus: Record<number, Record<number, boolean>>;
}

const initialState: ApiState = {
    loading: false,
    error: null,
    purchaseInwardList: [],
    paginationInfo: {
        total: 0,
        next: false,
        prev: false,
        offset: 0,
        limit: 10
    },
    createPurchaseInwardResult: null,
    canDeleteStatus: {},
    itemsDeletionStatus: {}
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

export const getAllPurchaseInwards = createAsyncThunk(
    'purchase-inward/getAllPurchaseInwards',
    async (params: { 
        offset?: number; 
        limit?: number; 
        fetchAll?: boolean;
        companyId?: number;  // From old code
        fabricTypeId?: number; // Filter example
        poTypeId?: number; // Filter by PO type
        vendorId?: number; // Filter by vendor
        startDate?: string; // Date range filter
        endDate?: string; // Date range filter
        searchTerm?: string; // General search
    } = {}, thunkAPI) => {
        try {
            const offset = params.fetchAll ? 0 : (params.offset ?? 0);
            const limit = params.fetchAll ? 10000 : (params.limit ?? 10000);
            
            // Build query parameters
            const queryParams = new URLSearchParams();
            queryParams.append('offset', String(offset));
            queryParams.append('limit', String(limit));
            
            // Add companyId to query params if provided
            if (params.companyId) {
                queryParams.append('companyId', String(params.companyId));
            }
            
            // Add other filters if provided
            if (params.fabricTypeId !== undefined) {
                // Note: fabricTypeId might need to be handled differently
                // Since purchase inward doesn't have fabricTypeId directly
                // This might be for filtering purchase inward items
                // We'll include it if needed by backend
                queryParams.append('fabricTypeId', String(params.fabricTypeId));
            }
            
            if (params.poTypeId !== undefined) {
                queryParams.append('poTypeId', String(params.poTypeId));
            }
            
            if (params.vendorId !== undefined) {
                queryParams.append('vendorId', String(params.vendorId));
            }
            
            if (params.startDate) {
                queryParams.append('startDate', params.startDate);
            }
            
            if (params.endDate) {
                queryParams.append('endDate', params.endDate);
            }
            
            if (params.searchTerm) {
                queryParams.append('search', params.searchTerm);
            }
            
            // Determine URL based on whether we're using company-scoped endpoint
            // For backward compatibility, we'll use the query parameter approach
            const url = `/purchase-inward?${queryParams.toString()}`;
            console.log("Fetching purchase inwards from:", url);
            
            const response = await apiService.get(url);
            const responseData = response?.data ?? {};
            console.log("Purchase inward response:", responseData);
            
            // Handle different response formats
            let list = [];
            if (Array.isArray(responseData?.data)) {
                // New paginated response format
                list = responseData.data;
            } else if (Array.isArray(responseData)) {
                // Old non-paginated response format
                list = responseData;
            } else if (responseData.data && Array.isArray(responseData.data.data)) {
                // Nested data structure
                list = responseData.data.data;
            }
            
            // Determine pagination info
            const hasPagination = responseData.total !== undefined;
            
            return {
                data: list,
                total: hasPagination ? (typeof responseData.total === "number" ? responseData.total : list.length) : list.length,
                next: hasPagination ? !!responseData.next : false,
                prev: hasPagination ? !!responseData.prev : false,
                offset: hasPagination ? (typeof responseData.offset === "number" ? responseData.offset : offset) : 0,
                limit: hasPagination ? (typeof responseData.limit === "number" ? responseData.limit : limit) : list.length,
                companyId: params.companyId,
                filters: {
                    fabricTypeId: params.fabricTypeId,
                    poTypeId: params.poTypeId,
                    vendorId: params.vendorId
                }
            };
        } catch (error: any) {
            console.error("Error fetching purchase inwards:", error);
            const errorMessage = resolveApiErrorMessage(error, "Failed to fetch purchase inwards");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const createPurchaseInward: any = createAsyncThunk(
    'purchase-inward/createPurchaseInward',
    async (params: any, thunkAPI) => {
        try {
            const response = await apiService.post("/purchase-inward", params);
            console.log(response)
            if (response) {
                return response;
            } else {
                const errorMessage = "Something went wrong";
                 toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to create purchase inward");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);


// export const createPurchaseInward: any = createAsyncThunk(
//     'purchase-inward/createPurchaseInward',
//     async (params: any, thunkAPI) => {
//         try {
//             const response = await apiService.post("/purchase-inward", params); // Adjust API endpoint if needed
//             console.log(response)
//             if (response) {
//                 toast.success("Saved Successfully!");
//                 return response;
//             } else {
//                 const errorMessage = "Something went wrong";
//                 toast.error(errorMessage);
//                 return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
//             const errorMessage = resolveApiErrorMessage(error, "Failed to create purchase inward");
//             toast.error(errorMessage);
//             return thunkAPI.rejectWithValue(errorMessage);
//         }


//     }
// );

// Thunk for updatePurchaseInward PUT API call (with company support)
// export const updatePurchaseInward: any = createAsyncThunk(
//     'purchase_inward/updatePurchaseInward',
//     async (params: any, thunkAPI) => {
//         console.log("Update params:", params);
//         try {
//             let url = `/purchase-inward/${params.id}`;
            
//             // Use company-scoped endpoint if companyId is provided
//             if (params.companyId) {
//                 url = `/purchase-inward/company/${params.companyId}/${params.id}`;
//             }
            
//             const response = await apiService.put(url, params);
//             console.log("Update response:", response);
            
//             if (response?.status === 'success' || response?.data?.status === 'success') {
//                 const successMessage = response?.message || response?.data?.message || "Purchase Inward updated successfully";
//                 toast.success(successMessage);
//                 return response.data?.data || response.data || response;
//             } else {
//                 const errorMessage = response?.data?.message || "Something went wrong";
//                 toast.error(errorMessage);
//                 return thunkAPI.rejectWithValue(errorMessage);
//             }
//         } catch (error: any) {
//             console.error("Error updating purchase inward:", error);
//             const errorMessage = resolveApiErrorMessage(error, "Failed to update purchase inward");
//             toast.error(errorMessage);
//             return thunkAPI.rejectWithValue(errorMessage);
//         }
//     }
// );

export const updatePurchaseInward: any = createAsyncThunk(
    'purchase_inward/updatePurchaseInward',
    async (params: any, thunkAPI) => {
        console.log("Update params:", params);
        try {
            let url = `/purchase-inward/${params.id}`;
            if (params.companyId) {
                url = `/purchase-inward/company/${params.companyId}/${params.id}`;
            }
            const response = await apiService.put(url, params);
            console.log("Update response:", response);
            if (response?.status === 'success' || response?.data?.status === 'success') {
                return response.data?.data || response.data || response;
            } else {
                const errorMessage = response?.data?.message || "Something went wrong";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            console.error("Error updating purchase inward:", error);
            const errorMessage = resolveApiErrorMessage(error, "Failed to update purchase inward");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const updatePurchaseInwardAccounting: any = createAsyncThunk(
    'purchase_inward/updatePurchaseInwardAccounting',
    async (params: any, thunkAPI) => {
        try {
            const { id, companyId } = params;
            const targetAccountedStatus = params.isAccounted !== undefined ? Boolean(params.isAccounted) : true;
            const payload = {
                ...params,
                isAccounted: targetAccountedStatus
            };
            
            let primaryUrl = companyId 
                ? `/purchase-inward/company/${companyId}/${id}/accounting`
                : `/purchase-inward/${id}/accounting`;
                
            let fallbackUrl = companyId 
                ? `/purchase-inward/company/${companyId}/${id}`
                : `/purchase-inward/${id}`;

            let response;
            try {
                response = await apiService.put(primaryUrl, payload);
            } catch (err: any) {
                // If specific /accounting route isn't active on running server yet, use standard update route
                console.warn("Primary accounting endpoint failed, trying standard update endpoint:", fallbackUrl);
                response = await apiService.put(fallbackUrl, payload);
            }

            if (response?.status === 'success' || response?.data?.status === 'success' || response?.data?.id || response?.id) {
                if (targetAccountedStatus) {
                    toast.success("Accounting completed successfully.");
                } else {
                    toast.info("GRN unmarked as accounted.");
                }
                const responseData = response.data?.data || response.data || response;
                return {
                    ...responseData,
                    isAccounted: targetAccountedStatus
                };
            } else {
                const errorMessage = response?.data?.message || "Failed to update accounting details";
                toast.error(errorMessage);
                return thunkAPI.rejectWithValue(errorMessage);
            }
        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "Failed to update accounting details");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for deletePurchaseInward DELETE API call (with company support)
// export const deletePurchaseInward = createAsyncThunk(
//     'purchase_inward/deletePurchaseInward',
//     async (params: { id: number; companyId?: number }, thunkAPI) => {
//         try {
//             let url = `/purchase-inward/${params.id}`;
            
//             // Use company-scoped endpoint if companyId is provided
//             if (params.companyId) {
//                 url = `/purchase-inward/company/${params.companyId}/${params.id}`;
//             }
            
//             const response = await apiService.delete(url);
//             console.log("Delete response:", response);

//             if (response?.status === 'success' || response?.data?.status === 'success') {
//                 toast.success(response?.message || "Successfully deleted");
//                 return params.id; // Return the deleted ID for reducer handling
//             }

//             // If API returns an error response with message
//             const errorMessage = response?.data?.message || response?.data?.data?.message || 'Failed to delete';
//             throw new Error(errorMessage);

//         } catch (error: any) {
//             console.error("Error deleting purchase inward:", error);
//             let errorMessage = 'An error occurred while deleting';

//             if (error.response) {
//                 // Server responded with status code outside 2xx range
//                 const serverMessage = error.response.data?.message || 
//                                      error.response.data?.data?.message || 
//                                      error.response.statusText;
                
//                 if (serverMessage) {
//                     errorMessage = serverMessage;
//                 }
//             } else if (error.message) {
//                 // This catches the Error we threw above
//                 errorMessage = error.message;
//             } else if (error.request) {
//                 errorMessage = 'No response from server';
//             }

//             toast.error(errorMessage);
//             return thunkAPI.rejectWithValue(errorMessage);
//         }
//     }
// );

export const hardDeletePurchaseInward = createAsyncThunk(
    'purchase_inward/hardDeletePurchaseInward',
       async (params: { id: number; companyId?: number }, thunkAPI) => {
        try {
             let url = `/purchase-inward/${params.id}`;
            
            // Use company-scoped endpoint if companyId is provided
            if (params.companyId) {
                url = `/purchase-inward/company/${params.companyId}/${params.id}/hard`;
            }
            const response = await apiService.delete(url);
            console.log("Delete response:", response);

            if (response?.status === 'success' || response?.data?.status === 'success') {
                toast.success(response?.message || "Successfully deleted");
                return params.id; // Return the deleted ID for reducer handling
            }

            // const response = await apiService.delete(`/purchase-inward/${id}/hard`);

            // if (response?.status === 'success') {
            //     toast.success("Successfully permanently deleted");
            //     return id;
            // }

            if (response?.data?.message) {
                throw new Error(response.data.message);
            }
            
            const errorMessage = response.data.data?.message || 'Failed to permanently delete';
            throw new Error(errorMessage);

        } catch (error: any) {
            const errorMessage = resolveApiErrorMessage(error, "An error occurred while permanently deleting");
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

// Thunk for checking if purchase inward can be deleted
export const checkPurchaseInwardDeletionStatus = createAsyncThunk(
  'purchaseInward/checkDeletionStatus',
  async (params: { purchaseInwardId: number; companyId?: number }, thunkAPI) => {
    try {
        const url = `/purchase-inward/${params.purchaseInwardId}/can-delete`;
        const response = await apiService.get(url);
        
        if (response?.data?.status === 'success') {
            return { 
                purchaseInwardId: params.purchaseInwardId, 
                canDelete: response.data.data?.canDelete || false 
            };
        } else {
            const errorMessage = response?.data?.message || "Failed to check deletion status";
            return thunkAPI.rejectWithValue(errorMessage);
        }
    } catch (error: any) {
        console.error("Error checking deletion status:", error);
        const errorMessage = resolveApiErrorMessage(error, "Failed to check deletion status");
        return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Thunk for getting purchase inward items deletion status
export const getPurchaseInwardItemsDeletionStatus = createAsyncThunk(
  'purchaseInward/getItemsDeletionStatus',
  async (params: { purchaseInwardId: number; companyId?: number }, thunkAPI) => {
    try {
        const url = `/purchase-inward/${params.purchaseInwardId}/items-deletion-status`;
        const response = await apiService.get(url);
        
        if (response?.data?.status === 'success') {
            return { 
                purchaseInwardId: params.purchaseInwardId, 
                itemsDeletionStatus: response.data.data || {} 
            };
        } else {
            const errorMessage = response?.data?.message || "Failed to get items deletion status";
            return thunkAPI.rejectWithValue(errorMessage);
        }
    } catch (error: any) {
        console.error("Error getting items deletion status:", error);
        const errorMessage = resolveApiErrorMessage(error, "Failed to get items deletion status");
        return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Thunk for checking if purchase inward can be edited
export const checkPurchaseInwardEditStatus = createAsyncThunk(
  'purchaseInward/checkEditStatus',
  async (params: { purchaseInwardId: number; companyId?: number }, thunkAPI) => {
    try {
        const url = `/purchase-inward/${params.purchaseInwardId}/can-edit`;
        const response = await apiService.get(url);
        
        if (response?.data?.status === 'success') {
            return { 
                purchaseInwardId: params.purchaseInwardId, 
                canEdit: response.data.data?.canEdit || false 
            };
        } else {
            const errorMessage = response?.data?.message || "Failed to check edit status";
            return thunkAPI.rejectWithValue(errorMessage);
        }
    } catch (error: any) {
        console.error("Error checking edit status:", error);
        const errorMessage = resolveApiErrorMessage(error, "Failed to check edit status");
        return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// ============ REDUX SLICE ============

const purchaseInwardSlice = createSlice({
    name: "purchaseInward",
    initialState,
    reducers: {
        // Reset state
        resetPurchaseInwardState: (state) => {
            state.loading = false;
            state.error = null;
            state.createPurchaseInwardResult = null;
        },
        
        // Clear error
        clearError: (state) => {
            state.error = null;
        },
        
        // Set loading manually
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        
        // Update pagination info manually
        setPaginationInfo: (state, action: PayloadAction<Partial<PaginationInfo>>) => {
            state.paginationInfo = { ...state.paginationInfo, ...action.payload };
        },
        
        // Clear purchase inward list
        clearPurchaseInwardList: (state) => {
            state.purchaseInwardList = [];
            state.paginationInfo = initialState.paginationInfo;
        }
    },
    extraReducers: (builder) => {
        builder
            // Handle getAllPurchaseInwards
            .addCase(getAllPurchaseInwards.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllPurchaseInwards.fulfilled, (state: any, action) => {
                state.loading = false;
                const { data, total, next, prev, offset, limit, companyId } = action.payload;
                state.purchaseInwardList = Array.isArray(data) ? data : [];
                
                // Only set pagination info if we got paginated data
                if (action.payload.total !== undefined) {
                    state.paginationInfo = { total, next, prev, offset, limit };
                } else {
                    // For non-paginated responses from old code
                    state.paginationInfo = {
                        total: data.length,
                        next: false,
                        prev: false,
                        offset: 0,
                        limit: data.length
                    };
                }
            })
            .addCase(getAllPurchaseInwards.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle createPurchaseInward
            .addCase(createPurchaseInward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPurchaseInward.fulfilled, (state, action) => {
                state.loading = false;
                state.createPurchaseInwardResult = action.payload;
                
                // Add the newly created item to the list (if we have the data)
                if (action.payload?.data) {
                    state.purchaseInwardList.unshift(action.payload.data);
                    state.paginationInfo.total += 1;
                }
            })
            .addCase(createPurchaseInward.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle updatePurchaseInward
            .addCase(updatePurchaseInward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePurchaseInward.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedItem = action.payload;
                
                // Update the item in the list
                state.purchaseInwardList = state.purchaseInwardList.map((item: any) =>
                    item.id === updatedItem.id ? { ...item, ...updatedItem } : item
                );
            })
            .addCase(updatePurchaseInward.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Handle updatePurchaseInwardAccounting
            .addCase(updatePurchaseInwardAccounting.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePurchaseInwardAccounting.fulfilled, (state: any, action: PayloadAction<any>) => {
                state.loading = false;
                const updatedItem = action.payload;
                state.purchaseInwardList = state.purchaseInwardList.map((item: any) =>
                    item.id === updatedItem.id ? { ...item, ...updatedItem } : item
                );
            })
            .addCase(updatePurchaseInwardAccounting.rejected, (state: any, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })


            // Handle checkPurchaseInwardDeletionStatus
            .addCase(checkPurchaseInwardDeletionStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkPurchaseInwardDeletionStatus.fulfilled, (state, action) => {
                state.loading = false;
                const { purchaseInwardId, canDelete } = action.payload;
                state.canDeleteStatus[purchaseInwardId] = canDelete;
            })
            .addCase(checkPurchaseInwardDeletionStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle getPurchaseInwardItemsDeletionStatus
            .addCase(getPurchaseInwardItemsDeletionStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPurchaseInwardItemsDeletionStatus.fulfilled, (state, action) => {
                state.loading = false;
                const { purchaseInwardId, itemsDeletionStatus } = action.payload;
                state.itemsDeletionStatus[purchaseInwardId] = itemsDeletionStatus;
            })
            .addCase(getPurchaseInwardItemsDeletionStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Handle checkPurchaseInwardEditStatus
            .addCase(checkPurchaseInwardEditStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkPurchaseInwardEditStatus.fulfilled, (state, action) => {
                state.loading = false;
                const { purchaseInwardId, canEdit } = action.payload;
                // Store edit status in canDeleteStatus object for consistency
                state.canDeleteStatus[`edit_${purchaseInwardId}`] = canEdit;
            })
            .addCase(checkPurchaseInwardEditStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            
            // Handle deletePurchaseInward
            // .addCase(deletePurchaseInward.pending, (state) => {
            //     state.loading = true;
            //     state.error = null;
            // })
            // .addCase(deletePurchaseInward.fulfilled, (state: any, action) => {
            //     state.loading = false;
            //     const deletedId = action.payload;
            //     state.purchaseInwardList = state.purchaseInwardList.filter(
            //         (pi: any) => pi.id !== deletedId
            //     );
            //     state.paginationInfo.total -= 1;
                
            //     // Clear deletion status for deleted item
            //     delete state.canDeleteStatus[deletedId];
            //     delete state.itemsDeletionStatus[deletedId];
            // })
            // .addCase(deletePurchaseInward.rejected, (state: any, action) => {
            //     state.loading = false;
            //     state.error = action.payload;
            // })
               // Handle hardDeletePurchaseInward (DELETE request)
            .addCase(hardDeletePurchaseInward.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(hardDeletePurchaseInward.fulfilled, (state: any, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.purchaseInwardList = state.purchaseInwardList.filter(
                    (pi: any) => pi.id !== deletedId
                );
                state.paginationInfo.total -= 1;
                delete state.canDeleteStatus[deletedId];
                delete state.itemsDeletionStatus[deletedId];
            })
            .addCase(hardDeletePurchaseInward.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

// Export actions and reducer
export const { 
    resetPurchaseInwardState, 
    clearError, 
    setLoading, 
    setPaginationInfo,
    clearPurchaseInwardList 
} = purchaseInwardSlice.actions;

export default purchaseInwardSlice.reducer;

// ============ SELECTOR FUNCTIONS ============

// Selector for purchase inward list
export const selectPurchaseInwardList = (state: any) => state.purchaseInward.purchaseInwardList;

// Selector for loading state
export const selectPurchaseInwardLoading = (state: any) => state.purchaseInward.loading;

// Selector for error state
export const selectPurchaseInwardError = (state: any) => state.purchaseInward.error;

// Selector for pagination info
export const selectPaginationInfo = (state: any) => state.purchaseInward.paginationInfo;

// Selector for can delete status
export const selectCanDeleteStatus = (state: any, purchaseInwardId: number) => 
    state.purchaseInward.canDeleteStatus[purchaseInwardId] || false;

// Selector for items deletion status
export const selectItemsDeletionStatus = (state: any, purchaseInwardId: number) => 
    state.purchaseInward.itemsDeletionStatus[purchaseInwardId] || {};

// Selector for can edit status
export const selectCanEditStatus = (state: any, purchaseInwardId: number) => 
    state.purchaseInward.canDeleteStatus[`edit_${purchaseInwardId}`] || false;

// Selector for filtered list by company
export const selectPurchaseInwardByCompany = (state: any, companyId: number) => 
    state.purchaseInward.purchaseInwardList.filter((item: any) => item.companyId === companyId);

// ============ UTILITY FUNCTIONS ============

/**
 * Helper function to prepare purchase inward data for API
 */
export const preparePurchaseInwardData = (formData: any, companyId?: number) => {
    const data = {
        ...formData,
        companyId: companyId || formData.companyId,
        // Ensure inwardDate is in proper format
        inwardDate: formData.inwardDate ? 
            (formData.inwardDate instanceof Date ? 
                formData.inwardDate.toISOString().split('T')[0] : 
                formData.inwardDate) : 
            new Date().toISOString().split('T')[0],
        // Ensure dcDate is in proper format
        dcDate: formData.dcDate ? 
            (formData.dcDate instanceof Date ? 
                formData.dcDate.toISOString().split('T')[0] : 
                formData.dcDate) : 
            new Date().toISOString().split('T')[0],
        // Map purchase inward items
        purchaseInwardItemsDtl: formData.purchaseInwardItemsDtl?.map((item: any) => ({
            ...item,
            // Convert piece entries if present
            pieceEntries: item.pieceEntries?.map((piece: any) => ({
                ...piece,
                // Ensure warehouseId is properly formatted
                warehouseId: piece.warehouseId ? Number(piece.warehouseId) : null
            })),
            // Convert lot entries if present
            lotEntries: item.lotEntries?.map((lot: any) => ({
                ...lot,
                // Ensure warehouseId is properly formatted
                warehouseId: lot.warehouseId ? Number(lot.warehouseId) : null
            }))
        })) || []
    };
    
    return data;
};