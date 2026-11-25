import apiService from './ApiService';

export interface ApprovalDTO {
  id?: number;
  entryNo: string;
  screenName: string;
  screenId?: number;
  dataId?: number;
  entryDate: string;
  salesOrderNo?: string;
  comments?: string;
  isApproved?: number;
  approvedDate?: string;
  approvedComments?: string;
  approvedBy?: number;
  companyId?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
  actionComments?: string;
}

export interface ApprovalRequestDTO {
  approvedComments: string;
  approvedDate?: string;
}

export interface PaginatedApprovalResponse {
  data: ApprovalDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApprovalSummaryDTO {
  salesOrderNo: string;
  totalApprovals: number;
  pending: number;
  approved: number;
}

export interface PaginatedApprovalSummaryResponse {
  data: ApprovalSummaryDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const approvalAPI = {
  createOrUpdate: async (approval: ApprovalDTO, companyId?: number, userId?: number) => {
    const headers: Record<string, string> = {};
    if (companyId) headers['X-Company-Id'] = companyId.toString();
    if (userId) headers['X-User-Id'] = userId.toString();
    
    return apiService.post('/approval', approval);
  },

  getById: async (id: number) => {
    return apiService.get(`/approval/${id}`);
  },

  getByEntryNo: async (entryNo: string) => {
    return apiService.get(`/approval/entry/${entryNo}`);
  },

  getByEntryNoAndScreen: async (entryNo: string, screenName: string) => {
    return apiService.get(`/approval/entry/${entryNo}/screen/${screenName}`);
  },

  getByCompanyId: async (companyId: number, page: number = 0, size: number = 10) => {
    return apiService.get(`/approval/company/${companyId}`, { page, size });
  },

  getByCompanyIdAndDateRange: async (
    companyId: number,
    startDate: string,
    endDate: string,
    page: number = 0,
    size: number = 10
  ) => {
    return apiService.get(`/approval/company/${companyId}/date-range`, {
      startDate,
      endDate,
      page,
      size
    });
  },

  getByCompanyIdAndStatus: async (
    companyId: number,
    isApproved: number,
    page: number = 0,
    size: number = 10
  ) => {
    return apiService.get(`/approval/company/${companyId}/status/${isApproved}`, {
      page,
      size
    });
  },

  getByCompanyIdAndScreenName: async (
    companyId: number,
    screenName: string,
    page: number = 0,
    size: number = 10
  ) => {
    return apiService.get(`/approval/company/${companyId}/screen/${encodeURIComponent(screenName)}`, {
      page,
      size
    });
  },

  getByCompanyIdWithFilters: async (
    companyId: number,
    filters: {
      startDate?: string;
      endDate?: string;
      isApproved?: number;
      salesOrderNo?: string;
      page?: number;
      size?: number;
    }
  ) => {
    const params: Record<string, any> = {
      page: filters.page || 0,
      size: filters.size || 10
    };
    
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.isApproved !== undefined) params.isApproved = filters.isApproved;
    if (filters.salesOrderNo) params.salesOrderNo = filters.salesOrderNo;
    
    return apiService.get(`/approval/company/${companyId}/filter`, params);
  },

  approveEntry: async (id: number, approvalRequest: ApprovalRequestDTO, userId?: number) => {
    const headers: Record<string, string> = {};
    if (userId) headers['X-User-Id'] = userId.toString();
    
    return apiService.put(`/approval/${id}/approve`, approvalRequest);
  },

  delete: async (id: number) => {
    return apiService.delete(`/approval/${id}`);
  },

  getSummaryByCompanyId: async (companyId: number, page: number = 0, size: number = 10) => {
    return apiService.get(`/approval/company/${companyId}/summary`, { page, size });
  }
};

export default approvalAPI;
