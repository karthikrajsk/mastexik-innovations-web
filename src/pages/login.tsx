import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, User, Lock, Loader2, Scissors, Layers, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getAllCompanies } from '@/state/company-master-slice';
import { AuthResponse, authService, ValidationResponse } from '@/contexts/AuthService';

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { companyMasterList: companies, loading: companyLoading } = useSelector((state: RootState) => state.companyMaster);

  const [credentials, setCredentials] = useState({
    userName: '',
    password: '',
  });
  const [error, setError] = useState<React.ReactNode>(''); // Change to ReactNode
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [userValidation, setUserValidation] = useState<ValidationResponse | null>(null);
  const [showForceLogoutOption, setShowForceLogoutOption] = useState(false); // Add this state

  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    dispatch(getAllCompanies({ fetchAll: true }));
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      const wasLoggedOut = sessionStorage.getItem('intentionalLogout') === 'true';
      if (wasLoggedOut) sessionStorage.removeItem('intentionalLogout');
      const from = wasLoggedOut ? '/' : ((location.state as any)?.from?.pathname || '/');
      navigate(from, { replace: true });
    }

    // Check if another company is already active in THIS browser when the login page loads
    const checkExistingSession = () => {
      const activeSessionsRaw = localStorage.getItem('active_sessions');
      const authPayloadRaw = localStorage.getItem('authPayload');
      
      let existingCompanyName = '';
      let hasActiveSession = false;

      if (activeSessionsRaw) {
        try {
          const sessions = JSON.parse(activeSessionsRaw);
          const now = Date.now();
          // Heartbeat check: consider session active if it updated in the last 60s
          const active = Object.values(sessions).find((s: any) => (now - s.timestamp < 60000)) as any;
          if (active) {
            existingCompanyName = active.companyName;
            hasActiveSession = true;
          }
        } catch (e) {
          console.error('Error parsing active_sessions', e);
        }
      }

      // If heartbeat exists, prioritize it. If no heartbeat but authPayload exists, 
      // check if it's potentially stale (active_sessions usually has the heartbeat)
      if (!hasActiveSession && authPayloadRaw) {
        try {
          const payload = JSON.parse(authPayloadRaw);
          // If we have an authPayload but NO heartbeat in active_sessions for a while,
          // it might be a stale session from a crash/timeout.
          // However, for safety, if authPayload exists, we still warn unless we're sure.
          existingCompanyName = payload.user?.selectedCompany?.name || 'another company';
          hasActiveSession = true;
        } catch (e) {
          console.error('Error parsing authPayload', e);
        }
      }

      // if (hasActiveSession) {
      //   setError(
      //     <div className="space-y-2">
      //       <p>Warning: You are already logged in to "{existingCompanyName}" in another tab.</p>
      //       <p className="text-xs">Only one company login is allowed at a time across all tabs. Please close other tabs or logout from "{existingCompanyName}" first.</p>
      //     </div>
      //   );
      // } else {
      //   // Clear error if no active session conflict found (crucial for dynamic updates)
      //   setError((prev: any) => {
      //     if (prev && typeof prev === 'object' && prev.props?.className === 'space-y-2') {
      //       return '';
      //     }
      //     return prev;
      //   });
      // }
    };

    checkExistingSession();

    // Listen for tab focus/visibility to re-check session status dynamically
    window.addEventListener('focus', checkExistingSession);
    window.addEventListener('visibilitychange', checkExistingSession);

    return () => {
      window.removeEventListener('focus', checkExistingSession);
      window.removeEventListener('visibilitychange', checkExistingSession);
    };
  }, [isAuthenticated, navigate, location]);

  // Get user companies from validation response
  const userCompanies = useMemo(() => {
    if (!userValidation?.companies) return [];

    const userCompanyIds = userValidation.companies.map(id => Number(id));
    return (companies || [])
      .filter((company: any) => userCompanyIds.includes(Number(company.id ?? company.companyId)))
      .map((company: any) => ({
        id: Number(company.id ?? company.companyId),
        name: String(company.companyName ?? company.name ?? company.company_name ?? 'Unknown Company')
      }));
  }, [companies, userValidation]);

  // Auto-select company if only one available
  useEffect(() => {
    if (userValidation && userCompanies.length === 1) {
      setSelectedCompanyId(String(userCompanies[0].id));
    } else {
      setSelectedCompanyId('');
    }
  }, [userValidation, userCompanies]);

  const handleValidate = async () => {
    if (credentials.userName && credentials.password) {
      setValidating(true);
      setError('');

      try {
        // Fetch all companies to ensure we have the latest list before validation
        await dispatch(getAllCompanies({ fetchAll: true })).unwrap();
        
        const validation = await authService.validateUser(credentials.userName, credentials.password);
        setUserValidation(validation);

        if (!validation.companies || validation.companies.length === 0) {
          setError('No companies assigned to this user. Contact administrator.');
        }
      } catch (err: any) {
        setUserValidation(null);
        setError(err.response?.data?.message || 'Invalid username or password');
      } finally {
        setValidating(false);
      }
    } else {
      setUserValidation(null);
      setError('');
    }
  };
  // In Login.tsx - Update the handleSubmit function
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setShowForceLogoutOption(false);

  // Parse as Number early for consistent comparison
  const currentCompanyId = selectedCompanyId ? Number(selectedCompanyId) : undefined;

  if (!userValidation) {
    setError('Please enter valid credentials');
    setLoading(false);
    return;
  }

  if (userCompanies.length > 0 && !selectedCompanyId) {
    setError('Please select a company');
    setLoading(false);
    return;
  }

  // Cross-tab check: See if another company is already logged in
  try {
    const getConflictCompanyName = () => {
      // 1. Check traditional authPayload
      const existingAuthPayload = localStorage.getItem('authPayload');
      if (existingAuthPayload) {
        const parsed = JSON.parse(existingAuthPayload);
        const existingUser = parsed.user;
        const existingCompanyId = existingUser?.selectedCompany?.id || existingUser?.companyId;
        
        if (existingCompanyId && Number(existingCompanyId) !== currentCompanyId) {
          return existingUser?.selectedCompany?.name || 'another company';
        }
      }

      // 2. Check active_sessions heartbeat
      const activeSessionsRaw = localStorage.getItem('active_sessions');
      if (activeSessionsRaw) {
        const activeSessions = JSON.parse(activeSessionsRaw);
        const now = Date.now();
        const otherActiveSession = Object.values(activeSessions).find((s: any) => 
          Number(s.companyId) !== currentCompanyId && (now - s.timestamp < 60000)
        ) as any;

        if (otherActiveSession) {
          return otherActiveSession.companyName;
        }
      }
      return null;
    };

    const conflictName = getConflictCompanyName();
    if (conflictName) {
      setError(`Access Denied: You are already logged in to "${conflictName}" in another tab. Only one company login is allowed at a time across all tabs. Please close other tabs or logout from "${conflictName}" first.`);
      setLoading(false);
      return;
    }
  } catch (err) {
    console.error('Error checking existing session:', err);
  }

  try {
    console.log('🔐 Attempting login', { userName: credentials.userName, companyId: currentCompanyId });

    const authResponse = await authService.login({
      ...credentials,
      companyId: currentCompanyId
    });

    console.log('✅ Login response:', authResponse);

    if (authResponse.success) {
      const selectedCompanyObj = userCompanies.find((c: any) => String(c.id) === selectedCompanyId) || null;

      const userData = {
        id: authResponse.user.id,
        userName: authResponse.user.userName,
        role: authResponse.user.role,
        companies: userCompanies,
        selectedCompany: selectedCompanyObj,
        companyId: selectedCompanyObj?.id || undefined,
        sessionId: authResponse.sessionId
      };

      const authPayload = {
        token: `user-${authResponse.user.id}-${Date.now()}`,
        user: userData
      };

      console.log('💾 Saving auth data to localStorage');
      localStorage.setItem('authPayload', JSON.stringify(authPayload));
      localStorage.setItem('selectedCompanyId', selectedCompanyId || '');
      localStorage.setItem('sessionId', authResponse.sessionId || '');

      console.log('🚀 Calling AuthContext login');
      login(authPayload.token, userData, authResponse.menuData);

      console.log('📍 Navigating to dashboard');
      const wasLoggedOut = sessionStorage.getItem('intentionalLogout') === 'true';
      if (wasLoggedOut) sessionStorage.removeItem('intentionalLogout');
      const from = wasLoggedOut ? '/' : ((location.state as any)?.from?.pathname || '/');
      navigate(from, { replace: true });
    } else {
      setError('Authentication failed');
    }
  } catch (err: any) {
    console.error('❌ Login error:', err);
    
    // Check if it's a "already logged in" error
    const errorMessage = err.response?.data?.message || '';
    if (errorMessage.includes('already logged in from another device')) {
      console.log('🔄 User logged in from another device, showing force logout option');
      setError('Your account is already logged in from another device. Do you want to logout from all other devices and login here?');
      setShowForceLogoutOption(true);
    } else {
      setError(errorMessage || 'Unable to login at the moment. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

// Add the force logout function
const handleForceLogoutAndLogin = async () => {
  console.log('🔄 Force logout and login initiated');
  setLoading(true);
  setError('');
  setShowForceLogoutOption(false);

  // Parse as Number early for consistent comparison
  const currentCompanyId = selectedCompanyId ? Number(selectedCompanyId) : undefined;

  try {
    // Cross-tab check: See if another company is already logged in
    try {
      const getConflictCompanyName = () => {
        const existingAuthPayload = localStorage.getItem('authPayload');
        if (existingAuthPayload) {
          const parsed = JSON.parse(existingAuthPayload);
          const existingUser = parsed.user;
          const existingCompanyId = existingUser?.selectedCompany?.id || existingUser?.companyId;
          if (existingCompanyId && Number(existingCompanyId) !== currentCompanyId) {
            return existingUser?.selectedCompany?.name || 'another company';
          }
        }

        const activeSessionsRaw = localStorage.getItem('active_sessions');
        if (activeSessionsRaw) {
          const activeSessions = JSON.parse(activeSessionsRaw);
          const now = Date.now();
          const otherActiveSession = Object.values(activeSessions).find((s: any) => 
            Number(s.companyId) !== currentCompanyId && (now - s.timestamp < 60000)
          ) as any;
          if (otherActiveSession) {
            return otherActiveSession.companyName;
          }
        }
        return null;
      };

      const conflictName = getConflictCompanyName();
      if (conflictName) {
        setError(`Access Denied: You are already logged in to "${conflictName}" in another tab. Only one company login is allowed at a time across all tabs. Please close other tabs or logout from "${conflictName}" first.`);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error checking existing session:', err);
    }

    // First, force logout from all devices
    console.log('📡 Calling force logout for user:', credentials.userName);
    await authService.forceLogoutUser(credentials.userName);
    console.log('✅ Force logout successful');
    
    // Wait a moment for backend to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Then proceed with normal login
    console.log('🔐 Attempting login after force logout');
    const authResponse = await authService.login({
      ...credentials,
      companyId: currentCompanyId
    });

    if (authResponse.success) {
      const selectedCompanyObj = userCompanies.find((c: any) => String(c.id) === selectedCompanyId) || null;

      const userData = {
        id: authResponse.user.id,
        userName: authResponse.user.userName,
        role: authResponse.user.role,
        companies: userCompanies,
        selectedCompany: selectedCompanyObj,
        companyId: selectedCompanyObj?.id || undefined,
        sessionId: authResponse.sessionId
      };

      const authPayload = {
        token: `user-${authResponse.user.id}-${Date.now()}`,
        user: userData
      };

      localStorage.setItem('authPayload', JSON.stringify(authPayload));
      localStorage.setItem('selectedCompanyId', selectedCompanyId || '');
      localStorage.setItem('sessionId', authResponse.sessionId || '');

      login(authPayload.token, userData, authResponse.menuData);

      const wasLoggedOut = sessionStorage.getItem('intentionalLogout') === 'true';
      if (wasLoggedOut) sessionStorage.removeItem('intentionalLogout');
      const from = wasLoggedOut ? '/' : ((location.state as any)?.from?.pathname || '/');
      navigate(from, { replace: true });
    }
  } catch (err: any) {
    console.error('❌ Force logout and login error:', err);
    setError(err.response?.data?.message || 'Unable to login after force logout. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'userName' || name === 'password') {
      setError('');
      setUserValidation(null);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isSubmitDisabled = useMemo(() => {
    if (loading || validating || companyLoading) return true;
    if (!credentials.userName || !credentials.password) return true;
    if (!userValidation) return true;
    if (userCompanies.length > 0 && !selectedCompanyId) return true;
    return false;
  }, [loading, validating, companyLoading, credentials.userName, credentials.password, userValidation, userCompanies, selectedCompanyId]);

  const getButtonText = () => {
    if (validating) return 'Validating...';
    if (loading) return 'Signing in...';
    return 'Sign In to Dashboard';
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.4'%3E%3Cpath d='M0 30h30v30H0V30zm30 0h30v30H30V30z'/%3E%3Cpath d='M0 0h30v30H0V0zm30 0h30v30H30V0z' fill-opacity='0.2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-16 text-indigo-200/30 transform rotate-12">
        <Scissors className="w-16 h-16" />
      </div>
      <div className="absolute bottom-32 right-20 text-purple-200/30 transform -rotate-12">
        <Layers className="w-20 h-20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo and Branding */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">TEXTiPRO</h1>
            <p className="text-gray-600 text-base font-medium mb-4">Enterprise Resource Planning</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-0.5 w-6 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
              <div className="h-0.5 w-8 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"></div>
              <div className="h-0.5 w-6 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-indigo-100 text-sm">Please sign in to your account</p>
              </div>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-medium">Login Error</p>
                        <p className="mt-1">{error}</p>
                        {showForceLogoutOption && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-red-600">Do you want to logout from all devices and login here?</p>
                            <button
                              onClick={handleForceLogoutAndLogin}
                              disabled={loading}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
                            >
                              {loading ? 'Processing...' : 'Yes, logout everywhere and login here'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="userName"
                      value={credentials.userName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200"
                      placeholder="Enter your username"
                      required
                      disabled={validating}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200"
                      placeholder="Enter your password"
                      required
                      disabled={validating}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none"
                      disabled={validating}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Validate Button */}
                {credentials.userName && credentials.password && !userValidation && !validating && (
                  <button
                    onClick={handleValidate}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-xl"
                  >
                    Validate Credentials
                  </button>
                )}

                {/* Company Selector - Show only after successful validation */}
                {userValidation && userCompanies.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Company {validating && '(Loading...)'}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        className="appearance-none w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200"
                        disabled={validating}
                      >
                        <option value="">Select Company</option>
                        {userCompanies.map((company: any) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute inset-y-0 right-3 my-auto h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Login Button */}
                <button
                  onClick={handleSubmit}
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:hover:scale-100"
                >
                  {validating || loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      {getButtonText()}
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      Sign In to Dashboard
                      <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
              <span>Powered by</span>
              <div className="flex items-center space-x-1">
                <Scissors className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-gray-700">TEXTiPRO</span>
              </div>
              <span>© 2024</span>
            </div>
            <p className="text-gray-400 text-xs mt-1">Streamlining textile operations worldwide</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;