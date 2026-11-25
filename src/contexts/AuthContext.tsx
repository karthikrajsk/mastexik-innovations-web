// import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
// import { authService } from './AuthService';
// import { useDispatch } from 'react-redux';
// import { UserMenuData } from '@/types/menu';
// import { clearUserMenu, setUserMenu } from '@/state/permissionSlice';

// interface AuthUser {
//   id: number;
//   userName: string;
//   role: string;
//   companies: any[];
//   selectedCompany?: any;
//   companyId?: number;
//   sessionId?: string;
// }

// interface AuthContextType {
//   isAuthenticated: boolean;
//   isInitializing: boolean;
//   token: string | null;
//   user: AuthUser | null;
//   login: (token: string, user: AuthUser, menuData?: UserMenuData) => void;
//   logout: () => void;
//   logoutFromAllDevices: () => Promise<void>;
//   selectedCompany: number | null;
//   remainingSessionTime: number;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const SESSION_TIMEOUT_MINUTES = 15;
// const SESSION_CHECK_INTERVAL = 30000;

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const dispatch = useDispatch();
//   const [token, setToken] = useState<string | null>(null);
//   const [user, setUser] = useState<AuthUser | null>(null);
//   const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
//   const [isInitializing, setIsInitializing] = useState<boolean>(true);
//   const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
//   const [remainingSessionTime, setRemainingSessionTime] = useState<number>(SESSION_TIMEOUT_MINUTES);
//   const [lastActivity, setLastActivity] = useState<Date>(new Date());

//   // Clear auth data helper
//   const clearAuthData = useCallback(() => {
//     try {
//       localStorage.removeItem('authToken');
//       localStorage.removeItem('authUser');
//       localStorage.removeItem('selectedCompany');
//       localStorage.removeItem('isAuthenticated');
//       localStorage.removeItem('sessionId');
//       localStorage.removeItem('lastActivity');
//       localStorage.removeItem('authPayload');
//       localStorage.removeItem('userMenu');
//       sessionStorage.removeItem('sessionActive');
//     } catch (error) {
//       console.error('Error clearing auth data:', error);
//     }
    
//     dispatch(clearUserMenu());
//     setToken(null);
//     setUser(null);
//     setSelectedCompany(null);
//     setIsAuthenticated(false);
//     setRemainingSessionTime(SESSION_TIMEOUT_MINUTES);
//   }, []);

//   const handleLogout = useCallback(async () => {
//     console.log('🔄 handleLogout called', { user: user?.id, sessionId: user?.sessionId });
    
//     if (user && user.id && user.sessionId) {
//       try {
//         console.log('📡 Calling backend logout API');
//         await authService.logout(user.id, user.sessionId);
//         console.log('✅ Backend logout successful');
//       } catch (error) {
//         console.error('❌ Backend logout call failed:', error);
//       }
//     } else {
//       console.log('ℹ️ No user session data available for backend logout');
//     }
    
//     clearAuthData();
//     console.log('🧹 Frontend auth data cleared');
//   }, [user, clearAuthData]);

//   const logoutFromAllDevices = useCallback(async (): Promise<void> => {
//     if (user && user.id) {
//       try {
//         await authService.logoutFromAllDevices(user.id);
//       } catch (error) {
//         console.error('Logout from all devices failed:', error);
//       }
//     }
//     clearAuthData();
//   }, [user, clearAuthData]);

//   // ✅ SMART SESSION MANAGEMENT
//   // Uses localStorage for persistent authentication across tabs
//   // - Refresh: localStorage persists → stay logged in
//   // - New tab (Ctrl+Click): localStorage allows seamless navigation
//   // - Close browser: localStorage persists → can stay logged in on reopen
//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         console.log('🔄 Initializing auth state');

//         // Check if session is active in THIS browser tab (cleared on browser close)
//         const isSessionActive = sessionStorage.getItem('sessionActive') === 'true';

//         console.log('📋 Session active check:', { isSessionActive });

//         // Check for stored auth data in localStorage
//         const storedToken = localStorage.getItem('authToken') || localStorage.getItem('authPayload');
//         const storedUser = localStorage.getItem('authUser');
//         const storedMenu = localStorage.getItem('userMenu');
//         const storedCompany = localStorage.getItem('selectedCompany');
//         const storedSessionId = localStorage.getItem('sessionId');
//         const storedLastActivity = localStorage.getItem('lastActivity');

//         console.log('📦 Stored auth data check:', {
//           hasToken: !!storedToken,
//           hasUser: !!storedUser,
//           hasMenu: !!storedMenu
//         });

//         // Allow authentication if valid auth data exists in localStorage
//         // This covers both existing sessions and new tabs via Ctrl+Click
//         if (storedToken && storedUser) {
//             let userData: AuthUser;
//             let actualToken = storedToken;

//             if (storedToken.startsWith('{')) {
//               try {
//                 const authPayload = JSON.parse(storedToken);
//                 userData = authPayload.user;
//                 actualToken = authPayload.token;
//               } catch (e) {
//                 console.error('Error parsing authPayload:', e);
//                 clearAuthData();
//                 return;
//               }
//             } else {
//               try {
//                 userData = JSON.parse(storedUser);
//               } catch (e) {
//                 console.error('Error parsing authUser:', e);
//                 clearAuthData();
//                 return;
//               }
//             }

//             if (storedMenu) {
//               try {
//                 const menuData = JSON.parse(storedMenu);
//                 dispatch(setUserMenu(menuData));
//               } catch (e) {
//                 console.error('Error parsing stored menu:', e);
//               }
//             }

//             if (storedSessionId) {
//               userData.sessionId = storedSessionId;
//             }

//             // ✅ Restore session - refresh keeps you logged in or new tab opens correctly
//             setToken(actualToken);
//             setUser(userData);
//             setIsAuthenticated(true);

//             // Set session as active for this tab (important for new tabs)
//             sessionStorage.setItem('sessionActive', 'true');
            
//             if (storedCompany) {
//               setSelectedCompany(Number(storedCompany));
//             }
            
//             if (storedLastActivity) {
//               setLastActivity(new Date(storedLastActivity));
//             }
            
//             setRemainingSessionTime(SESSION_TIMEOUT_MINUTES);
//             console.log('✅ Session restored successfully');
//           } else {
//             console.log('❌ No valid auth data found - user needs to login');
//             clearAuthData();
//           }
//       } catch (error) {
//         console.error('❌ Auth initialization failed:', error);
//         clearAuthData();
//       } finally {
//         setIsInitializing(false);
//       }
//     };

//     initializeAuth();
//   }, [clearAuthData]);

//   const login = useCallback((newToken: string, userData: AuthUser, menuData?: UserMenuData) => {
//     console.log('🔐 AuthContext.login called');
    
//     try {
//       // Store in localStorage (persists across refreshes)
//       localStorage.setItem('authToken', newToken);
//       localStorage.setItem('authUser', JSON.stringify(userData));
//       if (menuData) {
//         localStorage.setItem('userMenu', JSON.stringify(menuData));
//         dispatch(setUserMenu(menuData));
//       }
//       const companyIdToStore = userData.selectedCompany?.id || userData.companyId || '';
//       localStorage.setItem('selectedCompany', companyIdToStore.toString());
//       localStorage.setItem('isAuthenticated', 'true');
//       localStorage.setItem('sessionId', userData.sessionId || '');
//       localStorage.setItem('lastActivity', new Date().toISOString());
      
//       const authPayload = {
//         token: newToken,
//         user: userData
//       };
//       localStorage.setItem('authPayload', JSON.stringify(authPayload));
      
//       // ✅ Mark session as active (cleared when browser closes)
//       sessionStorage.setItem('sessionActive', 'true');
      
//       console.log('💾 Auth data saved to localStorage & sessionStorage');
//     } catch (error) {
//       console.error('❌ Error saving auth data:', error);
//     }
    
//     setToken(newToken);
//     setUser(userData);
//     setSelectedCompany(userData.selectedCompany?.id || userData.companyId || null);
//     setIsAuthenticated(true);
//     setLastActivity(new Date());
//     setRemainingSessionTime(SESSION_TIMEOUT_MINUTES);
    
//     console.log('✅ AuthContext state updated');
//   }, []);

//   const logout = useCallback(() => {
//     handleLogout();
//   }, [handleLogout]);

//   // Activity tracking and session timeout
//   useEffect(() => {
//     if (!isAuthenticated || !user) return;

//     const updateActivity = () => {
//       const newActivity = new Date();
//       setLastActivity(newActivity);
//       localStorage.setItem('lastActivity', newActivity.toISOString());
//     };

//     const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
//     const handleActivity = () => {
//       updateActivity();
//     };

//     events.forEach(event => {
//       document.addEventListener(event, handleActivity, { passive: true });
//     });

//     const checkSession = async () => {
//       try {
//         const now = new Date();
//         const timeSinceLastActivity = (now.getTime() - lastActivity.getTime()) / 60000;
        
//         console.log('⏰ Session check', { 
//           timeSinceLastActivity, 
//           timeout: SESSION_TIMEOUT_MINUTES
//         });
        
//         if (timeSinceLastActivity >= SESSION_TIMEOUT_MINUTES) {
//           console.log('🚨 Auto logout due to inactivity');
//           await handleLogout();
//           return;
//         }

//         const remainingTime = Math.max(0, SESSION_TIMEOUT_MINUTES - timeSinceLastActivity);
//         setRemainingSessionTime(remainingTime);
        
//       } catch (error) {
//         console.error('❌ Session check failed:', error);
//       }
//     };

//     checkSession();
//     const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

//     return () => {
//       events.forEach(event => {
//         document.removeEventListener(event, handleActivity);
//       });
//       clearInterval(interval);
//     };
//   }, [isAuthenticated, user, lastActivity, handleLogout]);

//   const value = useMemo(
//     () => ({ 
//       isAuthenticated, 
//       isInitializing, 
//       token, 
//       user,
//       login, 
//       logout,
//       logoutFromAllDevices,
//       selectedCompany,
//       remainingSessionTime
//     }),
//     [isAuthenticated, isInitializing, token, user, selectedCompany, remainingSessionTime, login, logout, logoutFromAllDevices]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { authService } from './AuthService';
import { useDispatch } from 'react-redux';
import { setUserMenu, clearUserMenu } from '@/state/permissionSlice';
import { UserMenuData } from '@/types/menu';

interface AuthUser {
  id: number;
  userName: string;
  role: string;
  companies: any[];
  selectedCompany?: any;
  companyId?: number;
  sessionId?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isInitializing: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser, menuData?: UserMenuData) => void;
  logout: () => void;
  logoutFromAllDevices: () => Promise<void>;
  selectedCompany: number | null;
  remainingSessionTime: number;
  refreshUserMenu: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT_MINUTES = 15;
const SESSION_CHECK_INTERVAL = 30000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [remainingSessionTime, setRemainingSessionTime] = useState<number>(SESSION_TIMEOUT_MINUTES);
  const lastActivityRef = useRef<Date>(new Date());
  const lastStorageUpdateRef = useRef<number>(0);

  // Clear auth data helper
  const clearAuthData = useCallback(() => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('selectedCompany');
      localStorage.removeItem('selectedCompanyId'); // Add this for consistency
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('authPayload');
      localStorage.removeItem('userMenu');
      localStorage.removeItem('active_sessions'); // Clear heartbeat
      sessionStorage.removeItem('sessionActive');
      sessionStorage.setItem('intentionalLogout', 'true');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
    
    dispatch(clearUserMenu());
    setToken(null);
    setUser(null);
    setSelectedCompany(null);
    setIsAuthenticated(false);
    setRemainingSessionTime(SESSION_TIMEOUT_MINUTES);
    lastActivityRef.current = new Date();
    lastStorageUpdateRef.current = 0;
  }, [dispatch]);

  const handleLogout = useCallback(async () => {
    const currentUserId = user?.id;
    const currentSessionId = user?.sessionId;

    console.log('🔄 handleLogout initiated', { userId: currentUserId, sessionId: currentSessionId });
    
    // 1. Clear state IMMEDIATELY to trigger UI redirect
    clearAuthData();
    console.log('🧹 Frontend auth data cleared');

    // 2. Perform backend logout in the background
    if (currentUserId && currentSessionId) {
      try {
        console.log('📡 Calling backend logout API');
        await authService.logout(currentUserId, currentSessionId);
        console.log('✅ Backend logout successful');
      } catch (error) {
        console.error('❌ Backend logout call failed:', error);
      }
    }
  }, [user, clearAuthData]);

  const logoutFromAllDevices = useCallback(async (): Promise<void> => {
    if (user && user.id) {
      try {
        await authService.logoutFromAllDevices(user.id);
      } catch (error) {
        console.error('Logout from all devices failed:', error);
      }
    }
    clearAuthData();
  }, [user, clearAuthData]);

  // ✅ SMART SESSION MANAGEMENT
  // Uses localStorage for persistent authentication across tabs
  // - Refresh: localStorage persists → stay logged in
  // - New tab (Ctrl+Click): localStorage allows seamless navigation
  // - Close browser: localStorage persists → can stay logged in on reopen
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth state');

        // Check if session is active in THIS browser tab (cleared on browser close)
        const isSessionActive = sessionStorage.getItem('sessionActive') === 'true';

        console.log('📋 Session active check:', { isSessionActive });

        // Check for stored auth data in localStorage
        const storedToken = localStorage.getItem('authToken') || localStorage.getItem('authPayload');
        const storedUser = localStorage.getItem('authUser');
        const storedMenu = localStorage.getItem('userMenu');
        const storedCompany = localStorage.getItem('selectedCompany');
        const storedSessionId = localStorage.getItem('sessionId');
        const storedLastActivity = localStorage.getItem('lastActivity');

        console.log('📦 Stored auth data check:', {
          hasToken: !!storedToken,
          hasUser: !!storedUser,
          hasMenu: !!storedMenu
        });

        // Allow authentication if valid auth data exists in localStorage
        // This covers both existing sessions and new tabs via Ctrl+Click
        if (storedToken && storedUser) {
            let userData: AuthUser;
            let actualToken = storedToken;

            if (storedToken.startsWith('{')) {
              try {
                const authPayload = JSON.parse(storedToken);
                userData = authPayload.user;
                actualToken = authPayload.token;
              } catch (e) {
                console.error('Error parsing authPayload:', e);
                clearAuthData();
                return;
              }
            } else {
              try {
                userData = JSON.parse(storedUser);
              } catch (e) {
                console.error('Error parsing authUser:', e);
                clearAuthData();
                return;
              }
            }

            if (storedMenu) {
              try {
                const menuData = JSON.parse(storedMenu);
                dispatch(setUserMenu(menuData));
              } catch (e) {
                console.error('Error parsing stored menu:', e);
              }
            }

            if (storedSessionId) {
              userData.sessionId = storedSessionId;
            }

            // ✅ Restore session - refresh keeps you logged in or new tab opens correctly
            setToken(actualToken);
            setUser(userData);
            setIsAuthenticated(true);

            // Set session as active for this tab (important for new tabs)
            sessionStorage.setItem('sessionActive', 'true');
            
            if (storedCompany) {
              setSelectedCompany(Number(storedCompany));
            }
            
            if (storedLastActivity) {
              lastActivityRef.current = new Date(storedLastActivity);
            }
            
            setRemainingSessionTime(SESSION_TIMEOUT_MINUTES);
            console.log('✅ Session restored successfully');
          } else {
            console.log('❌ No valid auth data found - user needs to login');
            clearAuthData();
          }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        clearAuthData();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [clearAuthData]);

  const login = useCallback((newToken: string, userData: AuthUser, menuData?: UserMenuData) => {
    console.log('🔐 AuthContext.login called');
    
    try {
      // Store in localStorage (persists across refreshes)
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('authUser', JSON.stringify(userData));
      if (menuData) {
        localStorage.setItem('userMenu', JSON.stringify(menuData));
        dispatch(setUserMenu(menuData));
      }
      const companyIdToStore = userData.selectedCompany?.id || userData.companyId || '';
      localStorage.setItem('selectedCompany', companyIdToStore.toString());
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('sessionId', userData.sessionId || '');
      localStorage.setItem('lastActivity', new Date().toISOString());
      
      const authPayload = {
        token: newToken,
        user: userData
      };
      localStorage.setItem('authPayload', JSON.stringify(authPayload));
      
      // ✅ Mark session as active (cleared when browser closes)
      sessionStorage.setItem('sessionActive', 'true');
      
      console.log('💾 Auth data saved to localStorage & sessionStorage');
    } catch (error) {
      console.error('❌ Error saving auth data:', error);
    }
    
    setToken(newToken);
    setUser(userData);
    setSelectedCompany(userData.selectedCompany?.id || userData.companyId || null);
    setIsAuthenticated(true);
    lastActivityRef.current = new Date();
    setRemainingSessionTime(SESSION_TIMEOUT_MINUTES);
    
    console.log('✅ AuthContext state updated');
  }, []);

  const logout = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  // ✅ CROSS-TAB SESSION HEARTBEAT
  // Maintains active_sessions in localStorage for login page validation
  useEffect(() => {
    if (!isAuthenticated || !user || !selectedCompany) return;

    // Tab ID for cross-tab tracking
    let tabId = sessionStorage.getItem('tabId');
    if (!tabId) {
      tabId = Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('tabId', tabId);
    }

    const updateHeartbeat = () => {
      try {
        const sessionsRaw = localStorage.getItem('active_sessions');
        const sessions = sessionsRaw ? JSON.parse(sessionsRaw) : {};
        const now = Date.now();
        
        // Clean up old sessions (older than 60 seconds)
        const cleanSessions: any = {};
        Object.keys(sessions).forEach(id => {
          if (sessions[id].timestamp > now - 60000) {
            cleanSessions[id] = sessions[id];
          }
        });
        
        // Add/Update current session
        cleanSessions[tabId] = {
          companyId: Number(selectedCompany),
          companyName: user.selectedCompany?.name || user.userName || 'Current Company',
          timestamp: now
        };
        
        localStorage.setItem('active_sessions', JSON.stringify(cleanSessions));
      } catch (e) {
        console.error('Error updating heartbeat:', e);
      }
    };

    // Immediate update and then every 20 seconds
    updateHeartbeat();
    const heartbeatInterval = setInterval(updateHeartbeat, 20000);

    const cleanupSession = () => {
      try {
        const sessionsRaw = localStorage.getItem('active_sessions');
        if (sessionsRaw) {
          const sessions = JSON.parse(sessionsRaw);
          delete sessions[tabId];
          localStorage.setItem('active_sessions', JSON.stringify(sessions));
        }
      } catch (e) { /* ignore */ }
    };

    window.addEventListener('beforeunload', cleanupSession);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', cleanupSession);
      cleanupSession();
    };
  }, [isAuthenticated, user, selectedCompany]);

  // Activity tracking and session timeout
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const updateActivity = () => {
      const now = new Date();
      lastActivityRef.current = now;
      
      // Reset remaining time state to 15 when user is active
      setRemainingSessionTime(SESSION_TIMEOUT_MINUTES);
      
      // Throttle localStorage updates to once every 30 seconds
      if (now.getTime() - lastStorageUpdateRef.current > 30000) {
        localStorage.setItem('lastActivity', now.toISOString());
        lastStorageUpdateRef.current = now.getTime();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    // Listen for activity or logout from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastActivity' && e.newValue) {
        const remoteActivity = new Date(e.newValue);
        if (remoteActivity > lastActivityRef.current) {
          lastActivityRef.current = remoteActivity;
          setRemainingSessionTime(SESSION_TIMEOUT_MINUTES);
        }
      }
      
      // Cross-tab logout: if auth data is removed in another tab
      if ((e.key === 'authPayload' || e.key === 'authToken') && !e.newValue && isAuthenticated) {
        console.log('🚪 Logout detected in another tab, clearing local session');
        clearAuthData();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    window.addEventListener('storage', handleStorageChange);

    const checkSession = async () => {
      try {
        const now = new Date();
        
        // Always check latest from localStorage in case storage event was missed
        const storedLastActivity = localStorage.getItem('lastActivity');
        if (storedLastActivity) {
          const storedDate = new Date(storedLastActivity);
          if (storedDate > lastActivityRef.current) {
            lastActivityRef.current = storedDate;
          }
        }

        const timeSinceLastActivity = (now.getTime() - lastActivityRef.current.getTime()) / 60000;
        
        if (timeSinceLastActivity >= SESSION_TIMEOUT_MINUTES) {
          console.log('🚨 Auto logout due to inactivity');
          await handleLogout();
          return;
        }

        const remainingTime = Math.max(0, SESSION_TIMEOUT_MINUTES - timeSinceLastActivity);
        setRemainingSessionTime(remainingTime);
        
      } catch (error) {
        console.error('❌ Session check failed:', error);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    // Also check immediately when the window is focused (returns to tab)
    const handleFocus = () => {
      console.log('Tab focused, checking session status');
      checkSession();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [isAuthenticated, user, handleLogout]);

  const refreshUserMenu = useCallback(async () => {
    if (!user?.id) return;
    try {
      const menuData = await authService.refreshUserMenu(Number(user.id));
      if (menuData) {
        localStorage.setItem('userMenu', JSON.stringify(menuData));
        dispatch(setUserMenu(menuData));
      }
    } catch (error) {
      console.error('Failed to refresh user menu:', error);
    }
  }, [user, dispatch]);

  const value = useMemo(
    () => ({ 
      isAuthenticated, 
      isInitializing, 
      token, 
      user,
      login, 
      logout,
      logoutFromAllDevices,
      selectedCompany,
      remainingSessionTime,
      refreshUserMenu,
    }),
    [isAuthenticated, isInitializing, token, user, selectedCompany, remainingSessionTime, login, logout, logoutFromAllDevices, refreshUserMenu]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};