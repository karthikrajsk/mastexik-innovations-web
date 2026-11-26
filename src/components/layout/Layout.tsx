import { Outlet } from 'react-router-dom';
import { Sidebar } from '@components/layout/Sidebar';
import { Header } from '@components/layout/Header';
import { useThemeStore } from '@store/themeStore';
import React, { useEffect, useState } from 'react';
import { RouteHeroProvider, useRouteHero } from '@/contexts/RouteHeroContext';
import { cn } from '@lib/utils';

export function Layout() {
  const { theme, getThemeColors } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <div className={`app-container min-h-screen bg-[#F4F7FA] theme-${theme}`}>
      <RouteHeroProvider>
        <LayoutBody
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      </RouteHeroProvider>
    </div>
  );
}

function LayoutBody({
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
      <Header
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen((prev) => !prev)}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <main
        className={cn(
          'min-h-screen px-3 pb-6 transition-[padding] duration-200 lg:ml-[240px]',
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
