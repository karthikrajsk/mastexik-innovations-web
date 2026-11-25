// src/components/PrivateRoute.tsx
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import React, { useEffect, useState, useContext } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { TitleContext, useRouteTitle } from './TitleContext';

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleMobileClose = () => setMobileOpen(false);
  const { theme, getThemeColors } = useThemeStore();
  const { titleMap } = useContext(TitleContext);
  const { title, hideTitle } = useRouteTitle(location.pathname, titleMap);

  const handleToggleSidebar = (val: boolean) => {
    setCollapsed(val);
    localStorage.setItem('sidebar_collapsed', String(val));
  };

  // All hooks must be called before any conditional returns
  useEffect(() => {
    console.log('isAuthenticated in PrivateRoute:', isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    // Apply theme colors to CSS variables
    const themeColors = getThemeColors();
    const root = document.documentElement;
    Object.entries(themeColors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--${key}-${subKey}`, subValue);
        });
      } else {
        root.style.setProperty(`--${key}`, value);
      }
    });
  }, [theme, getThemeColors]);

  // Show loading while initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to /login if not authenticated (after all hooks)
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('Rendering protected layout');

  // Render the layout with SidebarMenu, ElegantHeader, and Outlet for authenticated users
  return (
    <div className={`flex h-screen app-container theme-${theme}`}>
      <Sidebar
        collapsed={collapsed}
        onCollapse={handleToggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((prev) => !prev)}
        />
        <div className="flex-1 overflow-auto">
           
          <main
            className={`
              transition-all duration-300
              min-h-screen
              pt-16
              ml-0
              mt-[70px]
              ${collapsed ? 'lg:ml-16' : 'lg:ml-72'}
            `}
          >
            {!hideTitle && title && (
              <h1 className={`text-[20px] font-semibold text-slate-800 tracking-tight mt-5 mb-0 ml-5 pb-0`}>
                {title}
              </h1>
            )}
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
};

export default PrivateRoute;