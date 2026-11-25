import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '@/services/ApiService';
import { toast } from 'react-toastify';

export interface EmployeePropertyAssignmentItem {
  id?: number;
  employeeId: number;
  employeeCode?: string;
  employeeName: string;
  department?: string;
  designation?: string;
  itemId?: number;
  itemCode?: string;
  itemName: string;
  propertyCategory?: string;
  serialNumber?: string;
  quantity: number;
  uom?: string;
  assignedDate: string;
  expectedReturnDate?: string | null;
  conditionAtIssue?: string;
  assignedBy?: string;
  status: 'ASSIGNED' | 'RETURNED' | 'DAMAGED' | 'LOST';
  returnedDate?: string | null;
  conditionAtReturn?: string | null;
  receivedBy?: string | null;
  damageDeductionAmount?: number;
  remarks?: string;
  companyId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface State {
  assignmentList: EmployeePropertyAssignmentItem[];
  loading: boolean;
  error: string | null;
}

const LOCAL_STORAGE_KEY = 'employee_property_assignments_data';

const getInitialAssignments = (): EmployeePropertyAssignmentItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
};

const saveToLocalStorage = (list: EmployeePropertyAssignmentItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};

const initialState: State = {
  assignmentList: getInitialAssignments(),
  loading: false,
  error: null
};

export const fetchEmployeePropertyAssignments = createAsyncThunk(
  'employeePropertyAssignment/fetch',
  async (params: { companyId?: number; status?: string; department?: string; employeeId?: number } = {}, thunkAPI) => {
    try {
      const q = new URLSearchParams();
      if (params.companyId) q.append('companyId', String(params.companyId));
      if (params.status && params.status !== 'ALL') q.append('status', params.status);
      if (params.department && params.department !== 'ALL') q.append('department', params.department);
      if (params.employeeId) q.append('employeeId', String(params.employeeId));

      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const response = await apiService.get(`/employee-property-assignment${queryStr}`);
      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response)
        ? response
        : [];
      return data;
    } catch (err: any) {
      console.warn('API error fetching property assignments, using local store:', err);
      return getInitialAssignments();
    }
  }
);

export const createEmployeePropertyAssignment = createAsyncThunk(
  'employeePropertyAssignment/create',
  async (payload: EmployeePropertyAssignmentItem, thunkAPI) => {
    try {
      const response = await apiService.post('/employee-property-assignment', payload);
      const data = response?.data?.data || response?.data || response;
      toast.success('Property assigned successfully!');
      return data || payload;
    } catch (err: any) {
      console.warn('API fallback on create property assignment:', err);
      toast.success('Property assignment saved locally!');
      return { ...payload, id: Date.now() };
    }
  }
);

export const bulkCreateEmployeePropertyAssignment = createAsyncThunk(
  'employeePropertyAssignment/bulkCreate',
  async (payload: EmployeePropertyAssignmentItem[], thunkAPI) => {
    try {
      const response = await apiService.post('/employee-property-assignment/bulk', payload);
      const data = response?.data?.data || response?.data || response;
      toast.success(`${payload.length} property assignment(s) saved successfully!`);
      return Array.isArray(data) ? data : payload;
    } catch (err: any) {
      console.warn('API fallback on bulk create property assignments:', err);
      toast.success(`${payload.length} property assignment(s) saved locally!`);
      return payload.map((p, idx) => ({ ...p, id: p.id || (Date.now() + idx) }));
    }
  }
);

export const updateEmployeePropertyAssignment = createAsyncThunk(
  'employeePropertyAssignment/update',
  async ({ id, data }: { id: number; data: Partial<EmployeePropertyAssignmentItem> }, thunkAPI) => {
    try {
      const response = await apiService.put(`/employee-property-assignment/${id}`, data);
      const resData = response?.data?.data || response?.data || response;
      toast.success('Property assignment updated successfully!');
      return resData || { id, ...data };
    } catch (err: any) {
      console.warn('API fallback on update property assignment:', err);
      toast.success('Property assignment updated locally!');
      return { id, ...data };
    }
  }
);

export const returnEmployeePropertyAssignment = createAsyncThunk(
  'employeePropertyAssignment/return',
  async ({ id, returnPayload }: { id: number; returnPayload: { returnDate?: string; conditionAtReturn?: string; receivedBy?: string; damageDeductionAmount?: number; remarks?: string } }, thunkAPI) => {
    try {
      const response = await apiService.put(`/employee-property-assignment/${id}/return`, returnPayload);
      const resData = response?.data?.data || response?.data || response;
      toast.success('Property marked as returned successfully!');
      return resData || { id, status: 'RETURNED', ...returnPayload };
    } catch (err: any) {
      console.warn('API fallback on mark return:', err);
      toast.success('Property marked as returned locally!');
      return { id, status: 'RETURNED', ...returnPayload };
    }
  }
);

export const deleteEmployeePropertyAssignment = createAsyncThunk(
  'employeePropertyAssignment/delete',
  async (id: number, thunkAPI) => {
    try {
      await apiService.delete(`/employee-property-assignment/${id}`);
      toast.success('Assignment deleted successfully!');
      return id;
    } catch (err: any) {
      console.warn('API fallback on delete property assignment:', err);
      toast.success('Assignment deleted locally!');
      return id;
    }
  }
);

const slice = createSlice({
  name: 'employeePropertyAssignment',
  initialState,
  reducers: {
    clearAssignments(state) {
      state.assignmentList = [];
      saveToLocalStorage([]);
    }
  },
  extraReducers: builder => {
    builder
      // Fetch
      .addCase(fetchEmployeePropertyAssignments.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeePropertyAssignments.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        if (action.payload && action.payload.length > 0) {
          state.assignmentList = action.payload;
          saveToLocalStorage(action.payload);
        } else {
          // Keep local if API returns empty during initial testing
          state.assignmentList = getInitialAssignments();
        }
      })
      .addCase(fetchEmployeePropertyAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load property assignments';
      })
      // Create
      .addCase(createEmployeePropertyAssignment.fulfilled, (state, action: PayloadAction<any>) => {
        const item = action.payload;
        const existingIdx = state.assignmentList.findIndex(a => a.id === item.id);
        if (existingIdx !== -1) {
          state.assignmentList[existingIdx] = item;
        } else {
          state.assignmentList.unshift(item);
        }
        saveToLocalStorage(state.assignmentList);
      })
      // Bulk Create
      .addCase(bulkCreateEmployeePropertyAssignment.fulfilled, (state, action: PayloadAction<any[]>) => {
        const items = action.payload || [];
        items.forEach(newItem => {
          const idx = state.assignmentList.findIndex(a => a.id === newItem.id);
          if (idx !== -1) {
            state.assignmentList[idx] = newItem;
          } else {
            state.assignmentList.unshift(newItem);
          }
        });
        saveToLocalStorage(state.assignmentList);
      })
      // Update
      .addCase(updateEmployeePropertyAssignment.fulfilled, (state, action: PayloadAction<any>) => {
        const item = action.payload;
        const idx = state.assignmentList.findIndex(a => a.id === item.id);
        if (idx !== -1) {
          state.assignmentList[idx] = { ...state.assignmentList[idx], ...item };
          saveToLocalStorage(state.assignmentList);
        }
      })
      // Return
      .addCase(returnEmployeePropertyAssignment.fulfilled, (state, action: PayloadAction<any>) => {
        const item = action.payload;
        const idx = state.assignmentList.findIndex(a => a.id === item.id);
        if (idx !== -1) {
          state.assignmentList[idx] = {
            ...state.assignmentList[idx],
            status: 'RETURNED',
            returnedDate: item.returnDate || item.returnedDate || new Date().toISOString().split('T')[0],
            conditionAtReturn: item.conditionAtReturn || state.assignmentList[idx].conditionAtReturn,
            receivedBy: item.receivedBy || state.assignmentList[idx].receivedBy,
            damageDeductionAmount: item.damageDeductionAmount ?? state.assignmentList[idx].damageDeductionAmount,
            remarks: item.remarks ? `${state.assignmentList[idx].remarks || ''} (Return: ${item.remarks})`.trim() : state.assignmentList[idx].remarks
          };
          saveToLocalStorage(state.assignmentList);
        }
      })
      // Delete
      .addCase(deleteEmployeePropertyAssignment.fulfilled, (state, action: PayloadAction<number>) => {
        state.assignmentList = state.assignmentList.filter(a => a.id !== action.payload);
        saveToLocalStorage(state.assignmentList);
      });
  }
});

export const { clearAssignments } = slice.actions;
export default slice.reducer;
