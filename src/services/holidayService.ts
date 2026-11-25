import apiService from "./ApiService";

export interface Holiday {
  id?: number;
  holidayName: string;
  holidayDate: string;
  isFestivalWageApplicable: boolean;
  description?: string;
  status?: string;
}

const holidayService = {
  getAllHolidays: async (): Promise<Holiday[]> => {
    return await apiService.get<Holiday[]>("/holidays");
  },

  getHolidayById: async (id: number): Promise<Holiday> => {
    return await apiService.get<Holiday>(`/holidays/${id}`);
  },

  createHoliday: async (holiday: Holiday): Promise<Holiday> => {
    return await apiService.post<Holiday>("/holidays", holiday);
  },

  updateHoliday: async (id: number, holiday: Holiday): Promise<Holiday> => {
    return await apiService.put<Holiday>(`/holidays/${id}`, holiday);
  },

  deleteHoliday: async (id: number): Promise<void> => {
    return await apiService.delete<void>(`/holidays/${id}`);
  }
};

export default holidayService;
