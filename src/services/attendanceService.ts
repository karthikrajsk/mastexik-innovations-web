import apiService from "./ApiService";

export interface Attendance {
  id: number;
  date: string;
  employeeId: number | string;
  employee_id?: number; // Backend property name
  employee_code?: string; // Backend property name
  employee_name?: string; // Backend property name
  checkIn: string;
  checkOut: string;
  checkInIST?: string;
  checkOutIST?: string;
  otCheckIn?: string;
  otCheckOut?: string;
  workingHours: string;
  status: 'Present' | 'Absent' | 'Leave' | '';
  overtimeHours?: string;
  overtime_hours?: string;
  ot_hours?: string;
  workingDays?: number;
  difference?: number;
  isLate?: boolean;
  leaveType?: string;
}

export interface AttendanceParams {
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  employeeId?: string | number;
  month?: string;
  year?: string;
}

const attendanceService = {
  getAll: async (params: AttendanceParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.fetchAll) {
      queryParams.append('limit', '10000');
      queryParams.append('offset', '0');
    } else {
      if (params.limit) queryParams.append('limit', String(params.limit));
      if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
    }
    
    if (params.employeeId) queryParams.append('employeeId', String(params.employeeId));
    if (params.month) queryParams.append('month', params.month);
    if (params.year) queryParams.append('year', params.year);

    const response = await apiService.get(`/attendance?${queryParams.toString()}`);
    return response;
  },

  create: async (data: any) => {
    // The user requested specific fields: employee_id, employee_name, type (check_in/check_out), time
    const response = await apiService.post('/attendance', data);
    return response;
  },

  update: async (id: number, data: Partial<Attendance>) => {
    const response = await apiService.put(`/attendance/${id}`, data);
    return response;
  },

  delete: async (id: number) => {
    const response = await apiService.delete(`/attendance/${id}`);
    return response;
  },

  getSalary: async (month: string, year: string) => {
    const response = await apiService.get(`/attendance/salary?month=${month}&year=${year}`);
    return response;
  },

  getProjected: async (month: string, year: string) => {
    const response = await apiService.get(`/attendance/projected?month=${month}&year=${year}`);
    return response;
  }
};

export default attendanceService;
