import apiService from "./ApiService";

const employeePerformanceService = {
  // Promotions / Increments
  getAllPromotions: async () => {
    const response = await apiService.get('/employee/promotions');
    return response;
  },
  createPromotion: async (data: any) => {
    const response = await apiService.post('/employee/promotions', data);
    return response;
  },
  updatePromotion: async (id: number, data: any) => {
    const response = await apiService.put(`/employee/promotions/${id}`, data);
    return response;
  },
  deletePromotion: async (id: number) => {
    const response = await apiService.delete(`/employee/promotions/${id}`);
    return response;
  },

  // Performance Reviews
  getAllPerformance: async () => {
    const response = await apiService.get('/employee/performance');
    return response;
  },
  createPerformance: async (data: any) => {
    const response = await apiService.post('/employee/performance', data);
    return response;
  },
  updatePerformance: async (id: number, data: any) => {
    const response = await apiService.put(`/employee/performance/${id}`, data);
    return response;
  },
  deletePerformance: async (id: number) => {
    const response = await apiService.delete(`/employee/performance/${id}`);
    return response;
  },

  // Insurance Policies
  getAllInsurance: async () => {
    const response = await apiService.get('/employee/insurance');
    return response;
  },
  createInsurance: async (data: any) => {
    const response = await apiService.post('/employee/insurance', data);
    return response;
  },
  updateInsurance: async (id: number, data: any) => {
    const response = await apiService.put(`/employee/insurance/${id}`, data);
    return response;
  },
  deleteInsurance: async (id: number) => {
    const response = await apiService.delete(`/employee/insurance/${id}`);
    return response;
  }
};

export default employeePerformanceService;
