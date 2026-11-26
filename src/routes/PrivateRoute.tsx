import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeStore } from '@/store/themeStore';
import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { RouteHeroProvider, useRouteHero } from '@/contexts/RouteHeroContext';
import { cn } from '@/lib/utils';

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, getThemeColors } = useThemeStore();

  useEffect(() => {
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

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7FA]">
        <div className="flex items-center gap-2 text-[#536A81]">
          <svg className="h-5 w-5 animate-spin text-[#082A59]" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className={`app-container min-h-screen bg-[#F4F7FA] theme-${theme}`}>
      <RouteHeroProvider>
        <PrivateRouteBody
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      </RouteHeroProvider>
    </div>
  );
};

function PrivateRouteBody({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const routeHero = useRouteHero();
  const hasSummary = Boolean(routeHero?.summary);

  return (
    <>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Header
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen((prev) => !prev)}
      />
      <main
        className={cn(
          'min-h-screen pb-6 transition-[padding] duration-200 lg:ml-[240px] ',
          hasSummary
            ? 'pt-[220px] sm:pt-[230px] lg:pt-[240px]'
            : 'pt-[132px] sm:pt-[140px] lg:pt-[146px]',
        )}
      >
        <Outlet />
      </main>
    </>
  );
}

export default PrivateRoute;
