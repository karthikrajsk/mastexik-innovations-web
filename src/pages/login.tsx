import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, User, Lock, Loader2, Layers, ChevronDown, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getAllCompanies } from '@/state/company-master-slice';
import { authService, ValidationResponse } from '@/contexts/AuthService';
import { toast } from 'react-toastify';
import mastexikLogo from '@/assets/Images/mastexik-logo.png';

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { companyMasterList: companies, loading: companyLoading } = useSelector(
    (state: RootState) => state.companyMaster
  );

  const [credentials, setCredentials] = useState({
    userName: localStorage.getItem('savedUserName') || '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem('rememberMe') !== 'false';
  });
  const [error, setError] = useState<React.ReactNode>('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [userValidation, setUserValidation] = useState<ValidationResponse | null>(null);
  const [showForceLogoutOption, setShowForceLogoutOption] = useState(false);

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

    const checkExistingSession = () => {
      // Reserved for session verification if needed
    };

    checkExistingSession();
    window.addEventListener('focus', checkExistingSession);
    window.addEventListener('visibilitychange', checkExistingSession);

    return () => {
      window.removeEventListener('focus', checkExistingSession);
      window.removeEventListener('visibilitychange', checkExistingSession);
    };
  }, [isAuthenticated, navigate, location]);

  // Map user company IDs to full company info
  const userCompanies = useMemo(() => {
    if (!userValidation?.companies) return [];

    const userCompanyIds = userValidation.companies.map((id) => Number(id));
    return (companies || [])
      .filter((company: any) => userCompanyIds.includes(Number(company.id ?? company.companyId)))
      .map((company: any) => ({
        id: Number(company.id ?? company.companyId),
        name: String(company.companyName ?? company.name ?? company.company_name ?? 'Unknown Company'),
      }));
  }, [companies, userValidation]);

  // Auto-select company if only one is available
  useEffect(() => {
    if (userValidation && userCompanies.length === 1) {
      setSelectedCompanyId(String(userCompanies[0].id));
    } else if (!userValidation) {
      setSelectedCompanyId('');
    }
  }, [userValidation, userCompanies]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'userName' || name === 'password') {
      setError('');
      setUserValidation(null);
      setSelectedCompanyId('');
      setShowForceLogoutOption(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleForgotPassword = () => {
    toast.info('Please contact your system administrator to reset your credentials.');
  };

  const executeLogin = async (companyIdToUse?: number) => {
    setLoading(true);
    setError('');
    setShowForceLogoutOption(false);

    // Cross-tab check: See if another company is already logged in
    try {
      const getConflictCompanyName = () => {
        const existingAuthPayload = localStorage.getItem('authPayload');
        if (existingAuthPayload) {
          const parsed = JSON.parse(existingAuthPayload);
          const existingUser = parsed.user;
          const existingCompanyId = existingUser?.selectedCompany?.id || existingUser?.companyId;

          if (existingCompanyId && Number(existingCompanyId) !== companyIdToUse) {
            return existingUser?.selectedCompany?.name || 'another company';
          }
        }

        const activeSessionsRaw = localStorage.getItem('active_sessions');
        if (activeSessionsRaw) {
          const activeSessions = JSON.parse(activeSessionsRaw);
          const now = Date.now();
          const otherActiveSession = Object.values(activeSessions).find(
            (s: any) => Number(s.companyId) !== companyIdToUse && now - s.timestamp < 60000
          ) as any;

          if (otherActiveSession) {
            return otherActiveSession.companyName;
          }
        }
        return null;
      };

      const conflictName = getConflictCompanyName();
      if (conflictName) {
        setError(
          `Access Denied: You are already logged in to "${conflictName}" in another tab. Only one company login is allowed at a time across all tabs. Please close other tabs or logout from "${conflictName}" first.`
        );
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error checking existing session:', err);
    }

    try {
      console.log('🔐 Attempting login', { userName: credentials.userName, companyId: companyIdToUse });

      const authResponse = await authService.login({
        ...credentials,
        companyId: companyIdToUse,
      });

      console.log('✅ Login response:', authResponse);

      if (authResponse.success) {
        const selectedCompanyObj =
          userCompanies.find((c: any) => String(c.id) === String(companyIdToUse)) || null;

        const userData = {
          id: authResponse.user.id,
          userName: authResponse.user.userName,
          role: authResponse.user.role,
          companies: userCompanies,
          selectedCompany: selectedCompanyObj,
          companyId: selectedCompanyObj?.id || undefined,
          sessionId: authResponse.sessionId,
        };

        const authPayload = {
          token: `user-${authResponse.user.id}-${Date.now()}`,
          user: userData,
        };

        console.log('💾 Saving auth data to localStorage');
        localStorage.setItem('authPayload', JSON.stringify(authPayload));
        localStorage.setItem('selectedCompanyId', companyIdToUse ? String(companyIdToUse) : '');
        localStorage.setItem('sessionId', authResponse.sessionId || '');

        if (rememberMe) {
          localStorage.setItem('savedUserName', credentials.userName);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('savedUserName');
          localStorage.setItem('rememberMe', 'false');
        }

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

  const handleForceLogoutAndLogin = async () => {
    console.log('🔄 Force logout and login initiated');
    setLoading(true);
    setError('');
    setShowForceLogoutOption(false);

    const currentCompanyId = selectedCompanyId ? Number(selectedCompanyId) : undefined;

    try {
      console.log('📡 Calling force logout for user:', credentials.userName);
      await authService.forceLogoutUser(credentials.userName);
      console.log('✅ Force logout successful');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await executeLogin(currentCompanyId);
    } catch (err: any) {
      console.error('❌ Force logout and login error:', err);
      setError(err.response?.data?.message || 'Unable to login after force logout. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowForceLogoutOption(false);

    if (!credentials.userName.trim() || !credentials.password) {
      setError('Please enter both username and password.');
      return;
    }

    // Step 1: Validate credentials if not already validated
    let currentValidation = userValidation;
    if (!currentValidation) {
      setValidating(true);
      try {
        await dispatch(getAllCompanies({ fetchAll: true })).unwrap();
        const validation = await authService.validateUser(credentials.userName, credentials.password);
        setUserValidation(validation);
        currentValidation = validation;

        if (!validation.companies || validation.companies.length === 0) {
          setError('No companies assigned to this user. Contact administrator.');
          setValidating(false);
          return;
        }

        // If only 1 company, auto-select and proceed directly
        if (validation.companies.length === 1) {
          const singleCompanyId = Number(validation.companies[0]);
          setSelectedCompanyId(String(singleCompanyId));
          setValidating(false);
          await executeLogin(singleCompanyId);
          return;
        } else {
          // Multiple companies: user needs to select
          setValidating(false);
          return;
        }
      } catch (err: any) {
        setUserValidation(null);
        setError(err.response?.data?.message || 'Invalid username or password');
        setValidating(false);
        return;
      }
    }

    // Step 2: Ensure company is selected if user has multiple companies
    const currentCompanyId = selectedCompanyId ? Number(selectedCompanyId) : undefined;
    if (userCompanies.length > 0 && !selectedCompanyId) {
      setError('Please select a company to continue');
      return;
    }

    await executeLogin(currentCompanyId);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#e8f0f8] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans text-[#0b2a5c]">
      {/* Background Radial Glow Circles */}
      <div
        className="absolute -left-[120px] -top-[120px] w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(79, 160, 255, 0.3), transparent 70%)',
        }}
      />
      <div
        className="absolute -right-[100px] -bottom-[140px] w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(241, 217, 160, 0.6), transparent 70%)',
        }}
      />

      {/* Main Bento Grid Container */}
      <div className="relative flex flex-col lg:flex-row gap-4 w-full max-w-[1240px] lg:h-[760px] z-10">
        {/* Left Column: Login Card */}
        <div className="w-full lg:w-[440px] lg:flex-none bg-white rounded-[30px] p-8 sm:p-10 flex flex-col justify-between shadow-[0_24px_60px_rgba(11,42,92,0.12)] relative overflow-hidden">
          <div>
            {/* Logo */}
            <div className="mb-3 -ml-2">
              <img
                src={mastexikLogo}
                alt="Mastexik Innovations logo"
                className="w-[190px] h-auto object-contain"
              />
            </div>

            {/* Header */}
            <h1
              className="text-[32px] leading-[1.1] font-bold text-[#0b2a5c] mb-1.5 flex items-center gap-1.5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <span>Welcome back</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#d9b36a] mt-1" />
            </h1>
            <p className="text-[#5a6f8c] text-[14px] mb-6">
              Sign in to manage your textile operations.
            </p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50/90 border border-red-200 text-red-700 px-4 py-3 rounded-[14px] text-xs mb-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{error}</div>
                    {showForceLogoutOption && (
                      <div className="mt-2.5 pt-2 border-t border-red-200/60">
                        <button
                          type="button"
                          onClick={handleForceLogoutAndLogin}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-colors shadow-sm"
                        >
                          {loading ? 'Processing...' : 'Yes, logout everywhere and login here'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block text-[12px] font-semibold text-[#34496a] mb-[7px]">
                  Username
                </label>
                <div className="flex items-center gap-3 h-[50px] px-4 border-[1.5px] border-[#e1e9f2] rounded-[14px] bg-[#f6f9fc] text-[#6b7f9a] focus-within:border-[#0e9a96] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0e9a96]/15 transition-all">
                  <User className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                  <input
                    id="userName"
                    type="text"
                    name="userName"
                    value={credentials.userName}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    className="w-full bg-transparent border-0 outline-none text-[#0b2a5c] placeholder-[#8497b0] text-[15px]"
                    required
                    disabled={loading || validating}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-[12px] font-semibold text-[#34496a] mb-[7px]">
                  Password
                </label>
                <div className="flex items-center gap-3 h-[50px] px-4 border-[1.5px] border-[#e1e9f2] rounded-[14px] bg-[#f6f9fc] text-[#6b7f9a] focus-within:border-[#0e9a96] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0e9a96]/15 transition-all">
                  <Lock className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full bg-transparent border-0 outline-none text-[#0b2a5c] placeholder-[#8497b0] text-[15px]"
                    required
                    disabled={loading || validating}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="text-[#8497b0] hover:text-[#0b2a5c] transition-colors focus:outline-none shrink-0"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </div>

              {/* Company Selector (shown when user is assigned multiple companies) */}
              {userValidation && userCompanies.length > 1 && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#34496a] mb-[7px]">
                    Company {validating && '(Loading...)'}
                  </label>
                  <div className="flex items-center gap-3 h-[50px] px-4 border-[1.5px] border-[#e1e9f2] rounded-[14px] bg-[#f6f9fc] text-[#6b7f9a] focus-within:border-[#0e9a96] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0e9a96]/15 transition-all relative">
                    <Layers className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-[#0b2a5c] text-[15px] cursor-pointer appearance-none pr-6"
                      disabled={validating || loading}
                    >
                      <option value="">Select Company</option>
                      {userCompanies.map((company: any) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#8497b0] pointer-events-none absolute right-4" />
                  </div>
                </div>
              )}

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between pt-1 pb-1 text-[13px]">
                <label className="flex items-center gap-2 text-[#34496a] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-[#0b2f78] cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[#0b6f78] font-semibold hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || validating || companyLoading}
                className="w-full h-[54px] rounded-[14px] cursor-pointer bg-gradient-to-r from-[#0b2f78] to-[#0e8f95] text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 shadow-[0_14px_28px_rgba(11,47,120,0.28)] hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading || validating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{validating ? 'Validating...' : 'Signing in...'}</span>
                  </div>
                ) : (
                  <>
                    <span>Sign in to Dashboard</span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Powered by Footer */}
          <div className="mt-6 pt-3 text-[12px] text-[#5a6f8c] text-center border-t border-gray-100/80">
            Powered by <b className="text-[#0b2f78]">Mastexik Innovations</b> · © 2026
          </div>
        </div>

        {/* Right Column: Bento Grid */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Top Large Hero Tile */}
          <div
            className="rounded-[30px] relative overflow-hidden text-white p-8 sm:p-10 flex flex-col justify-end"
            style={{
              flex: '1.15',
              background: 'linear-gradient(135deg, #061a47, #0b3a8c 60%, #0b8a92)',
              minHeight: '280px',
            }}
          >
            {/* Background SVG wave lines and accent nodes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 800 340"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <path d="M-20 170 C140 40 260 300 430 150 S650 20 820 110" stroke="#9fe6ff" strokeOpacity="0.10" strokeWidth="1.2" fill="none" />
              <path d="M-20 176 C140 44 260 303 430 155 S650 26 820 114" stroke="#9fe6ff" strokeOpacity="0.15" strokeWidth="1.2" fill="none" />
              <path d="M-20 182 C140 48 260 306 430 160 S650 32 820 118" stroke="#9fe6ff" strokeOpacity="0.20" strokeWidth="1.2" fill="none" />
              <path d="M-20 188 C140 52 260 309 430 165 S650 38 820 122" stroke="#9fe6ff" strokeOpacity="0.25" strokeWidth="1.2" fill="none" />
              <path d="M-20 194 C140 56 260 312 430 170 S650 44 820 126" stroke="#9fe6ff" strokeOpacity="0.30" strokeWidth="1.2" fill="none" />
              <path d="M-20 200 C140 60 260 315 430 175 S650 50 820 130" stroke="#9fe6ff" strokeOpacity="0.10" strokeWidth="1.2" fill="none" />
              <path d="M-20 206 C140 64 260 318 430 180 S650 56 820 134" stroke="#9fe6ff" strokeOpacity="0.15" strokeWidth="1.2" fill="none" />
              <path d="M-20 212 C140 68 260 321 430 185 S650 62 820 138" stroke="#9fe6ff" strokeOpacity="0.20" strokeWidth="1.2" fill="none" />
              <path d="M-20 218 C140 72 260 324 430 190 S650 68 820 142" stroke="#9fe6ff" strokeOpacity="0.25" strokeWidth="1.2" fill="none" />
              <path d="M-20 224 C140 76 260 327 430 195 S650 74 820 146" stroke="#9fe6ff" strokeOpacity="0.30" strokeWidth="1.2" fill="none" />
              <path d="M-20 230 C140 80 260 330 430 200 S650 80 820 150" stroke="#9fe6ff" strokeOpacity="0.10" strokeWidth="1.2" fill="none" />
              <path d="M-20 236 C140 84 260 333 430 205 S650 86 820 154" stroke="#9fe6ff" strokeOpacity="0.15" strokeWidth="1.2" fill="none" />
              <path d="M-20 242 C140 88 260 336 430 210 S650 92 820 158" stroke="#9fe6ff" strokeOpacity="0.20" strokeWidth="1.2" fill="none" />
              <path d="M-20 248 C140 92 260 339 430 215 S650 98 820 162" stroke="#9fe6ff" strokeOpacity="0.25" strokeWidth="1.2" fill="none" />
              <path d="M-20 254 C140 96 260 342 430 220 S650 104 820 166" stroke="#9fe6ff" strokeOpacity="0.30" strokeWidth="1.2" fill="none" />
              <path d="M-20 260 C140 100 260 345 430 225 S650 110 820 170" stroke="#9fe6ff" strokeOpacity="0.10" strokeWidth="1.2" fill="none" />
              <path d="M-20 266 C140 104 260 348 430 230 S650 116 820 174" stroke="#9fe6ff" strokeOpacity="0.15" strokeWidth="1.2" fill="none" />
              <path d="M-20 272 C140 108 260 351 430 235 S650 122 820 178" stroke="#9fe6ff" strokeOpacity="0.20" strokeWidth="1.2" fill="none" />
              <path d="M-20 278 C140 112 260 354 430 240 S650 128 820 182" stroke="#9fe6ff" strokeOpacity="0.25" strokeWidth="1.2" fill="none" />
              <path d="M-20 284 C140 116 260 357 430 245 S650 134 820 186" stroke="#9fe6ff" strokeOpacity="0.30" strokeWidth="1.2" fill="none" />
              <path d="M-20 290 C140 120 260 360 430 250 S650 140 820 190" stroke="#9fe6ff" strokeOpacity="0.10" strokeWidth="1.2" fill="none" />
              <path d="M-20 296 C140 124 260 363 430 255 S650 146 820 194" stroke="#9fe6ff" strokeOpacity="0.15" strokeWidth="1.2" fill="none" />
              <path d="M-20 302 C140 128 260 366 430 260 S650 152 820 198" stroke="#9fe6ff" strokeOpacity="0.20" strokeWidth="1.2" fill="none" />
              <path d="M-20 308 C140 132 260 369 430 265 S650 158 820 202" stroke="#9fe6ff" strokeOpacity="0.25" strokeWidth="1.2" fill="none" />
              <path d="M-20 314 C140 136 260 372 430 270 S650 164 820 206" stroke="#9fe6ff" strokeOpacity="0.30" strokeWidth="1.2" fill="none" />
              <path d="M-20 320 C140 140 260 375 430 275 S650 170 820 210" stroke="#9fe6ff" strokeOpacity="0.10" strokeWidth="1.2" fill="none" />
              <path d="M-20 250 C150 90 280 360 450 210 S680 70 820 150" stroke="#e2c27d" strokeWidth="2.5" fill="none" />
              <g stroke="#fff" strokeOpacity=".25" strokeWidth="1.5" fill="none">
                <path d="M650 60 L700 10" />
                <path d="M685 100 L735 50" />
                <path d="M720 140 L770 90" />
              </g>
              <circle cx="700" cy="10" r="6" fill="#e2c27d" />
              <circle cx="735" cy="50" r="6" fill="#19c4b4" />
              <circle cx="770" cy="90" r="6" fill="#4a86e8" />
            </svg>

            {/* Hero Tile Text */}
            <div className="relative z-10">
              <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#f1d9a0] mb-2.5">
                Textile ERP
              </div>
              <div
                className="font-bold text-[30px] sm:text-[34px] leading-[1.15] max-w-[480px]"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Your entire mill, <span className="text-[#f1d9a0]">at a glance.</span>
              </div>
              <div className="mt-2.5 text-[14px] text-[#cfe0f3] max-w-[440px]">
                Orders, fabric stock and shipments, all in one beautiful dashboard.
              </div>
            </div>
          </div>

          {/* Bottom 3 Stat Tiles */}
          <div className="flex-1 flex flex-col sm:flex-row gap-4 min-h-0">
            {/* Tile 1: Orders Today */}
            <div className="flex-1 bg-white rounded-[30px] p-5 sm:p-6 flex flex-col justify-between shadow-[0_18px_40px_rgba(11,42,92,0.08)] relative overflow-hidden min-h-[160px]">
              <div>
                <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#5a6f8c]">
                  Orders today
                </div>
                <div
                  className="font-extrabold text-[36px] sm:text-[40px] leading-none mt-3 text-[#0b2a5c]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  128
                </div>
                <div className="text-[13px] text-[#0b7f86] font-semibold mt-1.5">
                  +12% vs yesterday
                </div>
              </div>
              <svg className="w-full h-[55px] mt-2" viewBox="0 0 200 60" aria-hidden="true">
                <path
                  d="M0 48 L25 40 L50 44 L75 28 L100 34 L125 18 L150 24 L175 8 L200 12"
                  fill="none"
                  stroke="#0e9a96"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Tile 2: Fabric Stock */}
            <div
              className="flex-1 rounded-[30px] p-5 sm:p-6 flex flex-col justify-between text-white relative overflow-hidden min-h-[160px]"
              style={{ background: 'linear-gradient(160deg, #0e9a96, #0b6f86)' }}
            >
              <div>
                <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#d6f5f1]">
                  Fabric stock
                </div>
                <div
                  className="font-extrabold text-[36px] sm:text-[40px] leading-none mt-3"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  24.6k<span className="text-[16px] font-semibold"> m</span>
                </div>
                <div className="text-[13px] text-[#d6f5f1] mt-1.5">
                  Across 12 categories
                </div>
              </div>
              <div className="flex items-end gap-[7px] h-[55px] mt-2">
                <div className="flex-1 h-[40%] rounded-[6px] bg-white/35" />
                <div className="flex-1 h-[62%] rounded-[6px] bg-white/45" />
                <div className="flex-1 h-[48%] rounded-[6px] bg-white/40" />
                <div className="flex-1 h-[80%] rounded-[6px] bg-white/60" />
                <div className="flex-1 h-[66%] rounded-[6px] bg-white/50" />
                <div className="flex-1 h-[94%] rounded-[6px] bg-white/90" />
              </div>
            </div>

            {/* Tile 3: On-time Shipments */}
            <div
              className="flex-1 rounded-[30px] p-5 sm:p-6 flex flex-col justify-between items-start relative overflow-hidden min-h-[160px]"
              style={{ background: 'linear-gradient(160deg, #fff7e2, #f3dfa8)' }}
            >
              <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#6b5a2e]">
                On-time shipments
              </div>
              <div className="my-auto py-1 flex items-center gap-4">
                <svg width="80" height="80" viewBox="0 0 100 100" aria-hidden="true">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(11,42,92,0.12)"
                    strokeWidth="11"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#0b2f78"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray="246 252"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div
                  className="font-extrabold text-[36px] sm:text-[40px] leading-none text-[#0b2f78]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  98%
                </div>
              </div>
              <div className="text-[13px] text-[#6b5a2e] font-semibold">
                Sample figures shown
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
