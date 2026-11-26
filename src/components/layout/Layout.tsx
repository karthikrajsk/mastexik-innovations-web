import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@components/layout/Sidebar';
import { Header } from '@components/layout/Header';
import { useThemeStore } from '@store/themeStore';
import React, { useContext, useEffect, useState } from 'react';
import { RouteHeroProvider, useRouteHero } from '@/contexts/RouteHeroContext';
import { cn } from '@lib/utils';
import { TitleContext, useRouteTitle } from '@/routes/TitleContext';
import { Menu } from 'lucide-react';

export function Layout() {
  const { theme, getThemeColors } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isDashboard =
    location.pathname === '/' ||
    location.pathname.toLowerCase() === '/dashboard';

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
    <div
      className={cn(
        'app-container min-h-screen bg-[#fbf8f2]',
        `theme-${theme}`,
      )}
    >
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
  const location = useLocation();
  const { titleMap } = useContext(TitleContext);
  const { hideTitle } = useRouteTitle(location.pathname, titleMap);
  const routeHero = useRouteHero();
  const hasSummary = Boolean(routeHero?.summary);

  const isDashboard =
    location.pathname === '/' ||
    location.pathname.toLowerCase() === '/dashboard' ||
    Boolean(hideTitle);

  return (
    <>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      {!isDashboard && (
        <Header
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((prev) => !prev)}
        />
      )}
      {isDashboard && (
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-30 rounded-lg p-2.5 bg-[#082A59] text-white shadow-md hover:bg-[#0a356f] transition-colors focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <main
        className={cn(
          'transition-[padding] duration-200 lg:ml-[240px]',
          isDashboard
            ? 'p-0 min-h-screen'
            : cn(
                'min-h-screen px-3 pb-6',
                hasSummary
                  ? 'pt-[220px] sm:pt-[230px] lg:pt-[240px]'
                  : 'pt-[132px] sm:pt-[140px] lg:pt-[146px]',
              ),
        )}
      >
        <Outlet />
      </main>
    </>
  );
}
