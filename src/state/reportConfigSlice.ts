import apiService from "@/services/ApiService";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export interface ReportColumn {
  id?: string;
  columnName: string;
  screenName: string;
  sectionName: string;
  fieldName: string;
  tableName?: string;
  databaseColumnName?: string;
  dataType?: string;
  isFormulaApplied: boolean;
  formulaType?: string;
  formulaBar?: string;
  isFilterRequired: boolean;
  filterType?: string;
}

export interface ReportConfig {
  id?: number;
  companyId?: number;
  reportName: string;
  columns: ReportColumn[];
  templateContent?: string;
  queryContent?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateField {
  id: string;
  columnId: string;
  columnName: string;
  screenName: string;
  sectionName: string;
  fieldName: string;
  fieldLabel?: string;
  fieldType?: string;
  dataValue?: any;
  isFormula: boolean;
  formulaBar?: string;
  formulaType?: string;
  isEditable: boolean;
  order: number;
}

export interface ReportTemplate {
  id?: string;
  reportConfigId?: number;
  companyId?: number;
  reportName: string;
  templateFields: TemplateField[];
  createdAt?: string;
  updatedAt?: string;
  data?: Record<string, any>;
  templateContent?: string;
  queryContent?: string;
  queryData?: any;
}

export interface ApiState {
  loading: boolean;
  fetched: boolean;
  lastFetchedCompanyId: number | null;
  error: string | null;
  reportList: ReportConfig[];
  createResult: any;
  currentTemplate: ReportTemplate | null;
  templateLoading: boolean;
}

export interface ColumnFormData extends ReportColumn {
  id?: string;
}

const initialState: ApiState = {
  loading: false,
  fetched: false,
  lastFetchedCompanyId: null,
  error: null,
  reportList: [],
  createResult: null,
  currentTemplate: null,
  templateLoading: false,
};

const getSelectedCompanyId = () => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("selectedCompanyId") ?? window.localStorage.getItem("selectedCompany");
  return stored ? Number(stored) : null;
};

export const getAllReports = createAsyncThunk(
  'reportConfig/getAllReports',
  async (params: { companyId?: number } | any, thunkAPI) => {
    try {
      const companyId = params?.companyId || getSelectedCompanyId();
      const endpoint = companyId 
        ? `/report-configurations/company/${companyId}` 
        : "/report-configurations";
      const data = await apiService.get(endpoint);
      // Normalize to an array regardless of backend envelope
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray((data as any)?.results)
        ? (data as any).results
        : [];
      return { list, companyId };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);


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


export const createReport: any = createAsyncThunk(
  'reportConfig/createReport',
  async (params: ReportConfig, thunkAPI) => {
    try {
      const payload = { ...params };
      if (!payload.companyId) {
        const storedCompany = localStorage.getItem('selectedCompany');
        if (storedCompany) payload.companyId = Number(storedCompany);
      }
      const response = await apiService.post("/report-configurations", payload);
      if (response?.status === 'success') {
        toast.success(response?.message || "Report created successfully");
        return response;
      } else {
        const errorMessage = "Something went wrong";
        toast.error(errorMessage);
        return thunkAPI.rejectWithValue(errorMessage);
      }
    } catch (error: any) {

 const errorMessage = resolveApiErrorMessage(error, "Failed to create country");
                                            toast.error(errorMessage);
                                            return thunkAPI.rejectWithValue(errorMessage);
      // toast.error(error.message);
      // return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateReport: any = createAsyncThunk(
  'reportConfig/updateReport',
  async (params: ReportConfig, thunkAPI) => {
    try {
      const companyId = params.companyId || Number(localStorage.getItem('selectedCompany'));
      const endpoint = companyId && params.id
        ? `/report-configurations/company/${companyId}/${params.id}`
        : `/report-configurations/${params.id}`;
      const response = await apiService.put(endpoint, params);
      if (response?.status === 'success') {
        toast.success(response?.message || "Report updated successfully");
        return response;
      } else {
        const errorMessage = "Something went wrong";
        toast.error(errorMessage);
        return thunkAPI.rejectWithValue(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = resolveApiErrorMessage(error, "Failed to create country");
                                                 toast.error(errorMessage);
                                                 return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const deleteReport = createAsyncThunk(
  'reportConfig/deleteReport',
  async (params: number | { id: number; companyId?: number }, thunkAPI) => {
    try {
      let id: number;
      let companyId: number | undefined;

      if (typeof params === 'number') {
        id = params;
        const storedCompany = localStorage.getItem('selectedCompany');
        if (storedCompany) companyId = Number(storedCompany);
      } else {
        id = params.id;
        companyId = params.companyId || Number(localStorage.getItem('selectedCompany'));
      }

      const endpoint = companyId 
        ? `/report-configurations/company/${companyId}/${id}`
        : `/report-configurations/${id}`;
      const response = await apiService.delete(endpoint);
      if (response?.status === 'success') {
        toast.success("Report deleted successfully");
        return id;
      }
      const errorMessage = response.data?.message || 'Failed to delete';
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

export const saveTemplate: any = createAsyncThunk(
  'reportConfig/saveTemplate',
  async (template: ReportTemplate, thunkAPI) => {
    try {
      if (!template.reportConfigId) {
        throw new Error("Report configuration ID is required");
      }

      // Serialize templateFields to templateContent (JSON for backend)
      const templateContent = JSON.stringify({
        fields: template.templateFields.map(f => ({
          ...f,
          dataValue: f.dataValue
        })),
        data: template.data || {}
      });

      const queryContent = template.queryContent && template.queryContent.trim()
        ? template.queryContent
        : generateBasicQuery(template);

      const payload = {
        templateContent,
        queryContent,
        query_data: template.queryData ?? null,
      };

      const companyId = template.companyId || Number(localStorage.getItem('selectedCompany'));
      const queryParams = companyId ? `?companyId=${companyId}` : '';
      const response = await apiService.post(
        `/report-configurations/${template.reportConfigId}/template${queryParams}`,
        payload
      );

      if (response?.status === 'success') {
        toast.success("Template saved successfully");
        return { ...response, templateContent, queryContent };
      } else {
        const errorMessage = "Failed to save template";
        toast.error(errorMessage);
        return thunkAPI.rejectWithValue(errorMessage);
      }
    } catch (error: any) {
      toast.error(error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Basic query generator stub (expand based on fields/tables from TransactionModuleService)
const generateBasicQuery = (template: ReportTemplate): string => {
  if (template.templateFields.length === 0) return '';
  const primaryScreen = template.templateFields[0].screenName;
  // TODO: Fetch primaryTable from TransactionModuleService.getModule(primaryScreen)
  const primaryTable = 'your_primary_table';  // Placeholder
  const selectFields = template.templateFields.map(f => f.fieldName || f.columnName).join(', ');
  return `SELECT ${selectFields} FROM ${primaryTable} WHERE 1=1`;  // Basic; add JOINs/filters later
};

export const getReportById = createAsyncThunk(
  'reportConfig/getReportById',
  async (params: { id: number; companyId?: number }, thunkAPI) => {
    try {
      const companyId = params.companyId || Number(localStorage.getItem('selectedCompany'));
      const endpoint = companyId
        ? `/report-configurations/company/${companyId}/${params.id}`
        : `/report-configurations/${params.id}`;
      const data = await apiService.get(endpoint);
      const report = (data as any)?.data ?? data;
      return report as ReportConfig;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const getReportBySlug = createAsyncThunk(
  'reportConfig/getReportBySlug',
  async (params: { slug: string; companyId?: number }, thunkAPI) => {
    try {
      const companyId = params.companyId || Number(localStorage.getItem('selectedCompany'));
      if (!companyId) return thunkAPI.rejectWithValue('No company selected');
      const data = await apiService.get(
        `/report-configurations/company/${companyId}/by-slug?slug=${encodeURIComponent(params.slug)}`
      );
      const report = (data as any)?.data ?? data;
      return report as ReportConfig;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const executeReport: any = createAsyncThunk(
  'reportConfig/executeReport',
  async (params: { id: number; filters: any; companyId?: number }, thunkAPI) => {
    try {
      const companyId = params.companyId || Number(localStorage.getItem('selectedCompany'));
      const queryParams = companyId ? `?companyId=${companyId}` : '';
      const response = await apiService.post(
        `/report-configurations/${params.id}/execute${queryParams}`,
        params.filters
      );

      if (response?.status === 'success') {
        return response.data;
      } else {
        const errorMessage = "Failed to execute report";
        toast.error(errorMessage);
        return thunkAPI.rejectWithValue(errorMessage);
      }
    } catch (error: any) {
      toast.error(error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const reportConfigSlice = createSlice({
  name: "reportConfig",
  initialState,
  reducers: {
    setCurrentTemplate: (state, action: PayloadAction<ReportTemplate>) => {
      state.currentTemplate = action.payload;
    },
    updateCurrentTemplate: (state, action: PayloadAction<ReportTemplate>) => {
      if (state.currentTemplate) {
        state.currentTemplate = {
          ...state.currentTemplate,
          ...action.payload,
          // Preserve templateFields if updating partially
          templateFields: action.payload.templateFields || state.currentTemplate.templateFields,
        };
      }
    },
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all reports
      .addCase(getAllReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllReports.fulfilled, (state: any, action) => {
        state.loading = false;
        state.fetched = true;
        state.reportList = action.payload.list;
        state.lastFetchedCompanyId = action.payload.companyId;
      })
      .addCase(getAllReports.rejected, (state: any, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create report
      .addCase(createReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.createResult = action.payload;
      })
      .addCase(createReport.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update report
      .addCase(updateReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReport.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const updatedReport = action.payload;
        state.reportList = state.reportList.map((report: any) =>
          report.id === updatedReport.id ? updatedReport : report
        );
      })
      .addCase(updateReport.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete report
      .addCase(deleteReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state: any, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.reportList = state.reportList.filter(
          (report: any) => report.id !== deletedId
        );
      })
      .addCase(deleteReport.rejected, (state: any, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Save template
      .addCase(saveTemplate.pending, (state) => {
        state.templateLoading = true;
        state.error = null;
      })
      .addCase(saveTemplate.fulfilled, (state, action: PayloadAction<any>) => {
        state.templateLoading = false;
        // Update the report in the list with the new template
        if (action.payload?.data) {
          const updatedReport = action.payload.data;
          state.reportList = state.reportList.map((report: any) =>
            report.id === updatedReport.id ? { ...report, ...updatedReport } : report
          );
        }
      })
      .addCase(saveTemplate.rejected, (state, action: PayloadAction<any>) => {
        state.templateLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentTemplate, updateCurrentTemplate, clearCurrentTemplate } = reportConfigSlice.actions;

export default reportConfigSlice.reducer;