// AuthService.ts - Fix the API endpoints
import apiService from "@/services/ApiService";

import { UserMenuData } from "@/types/menu";

export interface LoginCredentials {
  userName: string;
  password: string;
  companyId?: number;
  deviceId?: string;
}

export interface AuthResponse {
  success: boolean;
  sessionId: string;
  user: {
    id: number;
    userName: string;
    role: string;
    companies: number[];
  };
  menuData?: UserMenuData;
}

export interface ValidationResponse {
  userName: string;
  companies: number[];
}

export interface SessionValidationResponse {
  valid: boolean;
  remainingTime: number;
}

class AuthService {
  private deviceId: string;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const requestData = {
      ...credentials,
      deviceId: this.deviceId
    };
    
    // ✅ FIX: Use "/auth/login" instead of "/api/auth/login" since baseURL already has /api
    const response = await apiService.post("/auth/login", requestData);
    return response.data;
  }

  async validateUser(userName: string, password: string): Promise<ValidationResponse> {
    // ✅ FIX: Use "/auth/validate" instead of "/api/auth/validate"
    const response = await apiService.post("/auth/validate", { 
      userName, 
      password,
      deviceId: this.deviceId 
    });
    return response.data;
  }

// In AuthService.ts - Fix the validateSession method
async validateSession(userId: number, sessionId: string): Promise<SessionValidationResponse> {
  try {
    console.log('🔍 Validating session:', { userId, sessionId });
    
    const response = await apiService.post('/auth/validate-session', {
      userId,
      sessionId
    });
    
    console.log('✅ Session validation response:', response);
    
    // ✅ FIX: Handle different response structures
    if (response && typeof response === 'object') {
      // If response has data property
      if (response.data && typeof response.data === 'object') {
        return {
          valid: response.data.valid === true,
          remainingTime: response.data.remainingTime || 0
        };
      }
      // If response is directly the session data
      else if (typeof response.valid !== 'undefined') {
        return {
          valid: response.valid === true,
          remainingTime: response.remainingTime || 0
        };
      }
    }
    
    console.error('❌ Invalid session validation response structure:', response);
    return { valid: false, remainingTime: 0 };
  } catch (error) {
    console.error('❌ Session validation API error:', error);
    return { valid: false, remainingTime: 0 };
  }
}

  async logout(userId: number, sessionId: string): Promise<void> {
    // ✅ FIX: Use "/auth/logout" instead of "/api/auth/logout"
    await apiService.post('/auth/logout', {
      userId,
      sessionId
    });
  }

  async logoutFromAllDevices(userId: number): Promise<void> {
    // ✅ FIX: Use "/auth/logout-all" instead of "/api/auth/logout-all"
    await apiService.post('/auth/logout-all', {
      userId
    });
  }

  async forceLogoutUser(userName: string): Promise<void> {
    // ✅ FIX: Use "/auth/force-logout" instead of "/api/auth/force-logout"
    await apiService.post('/auth/force-logout', {
      userName
    });
  }

  async refreshUserMenu(userId: number): Promise<UserMenuData | null> {
    try {
      const response = await apiService.get(`/auth/user-menu/${userId}`);
      const data = response?.data?.data ?? response?.data;
      return data as UserMenuData;
    } catch (error) {
      console.error('Failed to refresh user menu:', error);
      return null;
    }
  }

  getCurrentDeviceId(): string {
    return this.deviceId;
  }
}

export const authService = new AuthService();