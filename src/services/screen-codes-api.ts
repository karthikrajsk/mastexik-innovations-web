import apiService from './ApiService';

export interface ScreenCodeDTO {
  id: number;
  code: string;
  value: string;
  sortOrder?: number;
  isActive: boolean;
}

export interface ScreenCode {
  id: number;
  code: string;
  value: string;
  label?: string;
}

const screenCodesAPI = {
  getAll: async (): Promise<ScreenCodeDTO[]> => {
    return apiService.get('/screen-codes');
  },

  getByCode: async (code: string): Promise<string> => {
    return apiService.get(`/screen-codes/by-code/${code}`);
  },

  getByValue: async (value: string): Promise<string> => {
    return apiService.get(`/screen-codes/by-value/${value}`);
  }
};

export default screenCodesAPI;
