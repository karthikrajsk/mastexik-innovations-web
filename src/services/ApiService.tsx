import axios from "axios";

const API_PORTS: Record<string, string> = {
  "localhost": "8011", // Development
  "staging.example.com": "8000", // Staging
  "production.example.com": "8080", // Production
};

// Get the current host (e.g., localhost, staging.example.com)
const currentHost = window.location.hostname;
// const currentHost = '165.232.177.255';   
console.log('currentHost', currentHost)

// Set the base URL dynamically
const BASE_URL = `http://${currentHost}:${API_PORTS[currentHost] || "8011"}/api`;
const API_ORIGIN = BASE_URL.replace(/\/?api$/, "");

export const API_BASE_URL = BASE_URL;
export { API_ORIGIN };

console.log("API Base URL:", BASE_URL); // Debugging - remove in production

// Create Axios instancez
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include companyId and userId in headers
apiClient.interceptors.request.use(
  (config) => {
    const selectedCompanyId = localStorage.getItem('selectedCompanyId');
    if (selectedCompanyId) {
      config.headers['X-Company-Id'] = selectedCompanyId;
    }
    
    // Also try to get userId if it exists
    const authPayload = localStorage.getItem('authPayload');
    if (authPayload) {
      try {
        const parsed = JSON.parse(authPayload);
        const userId = parsed?.user?.id;
        if (userId) {
          config.headers['X-User-Id'] = userId.toString();
        }
      } catch (e) {
        // Ignore
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const IS_LIVE = import.meta.env.VITE_IS_LIVE === 'false';

// Common API Service
const apiService = {
  get: async <T = any>(endpoint: string, params = {}): Promise<T> => {
    try {
      const response = await apiClient.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`GET ${endpoint} failed`, error);
      throw error;
    }
  },

  post: async <T = any>(endpoint: string, data: any = {}, config = {}): Promise<T> => {
    try {
      const response = await apiClient.post<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      console.error(`POST ${endpoint} failed`, error);
      throw error;
    }
  },

  put: async <T = any>(endpoint: string, data: any, config = {}): Promise<T> => {
    try {
      const response = await apiClient.put<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      console.error(`PUT ${endpoint} failed`, error);
      throw error;
    }
  },

  patch: async <T = any>(endpoint: string, data: any, config = {}): Promise<T> => {
    try {
      const response = await apiClient.patch<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      console.error(`PATCH ${endpoint} failed`, error);
      throw error;
    }
  },

  delete: async <T = any>(endpoint: string, config = {}): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(endpoint, config);
      return response.data;  // ✅ Ensure the function returns data
    } catch (error) {
      console.error(`DELETE ${endpoint} failed`, error);
      throw error;
    }
  },
};

export default apiService;
