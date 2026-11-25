import { Outlet } from 'react-router-dom';
import { Sidebar } from '@components/layout/Sidebar';
import { Header } from '@components/layout/Header';
import { useThemeStore } from '@store/themeStore';
import { useState, useEffect } from 'react';

export function Layout() {
  const { theme, getThemeColors } = useThemeStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Close sidebar on route change for mobile
  const handleMobileClose = () => setMobileOpen(false);

  return (
    <div className={`app-container theme-${theme}`}>
      <Header
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen((prev) => !prev)}
      />
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={(collapsed) => setSidebarCollapsed(collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />
      <main
        className={`
          transition-all duration-300
          min-h-screen
          pt-14 sm:pt-16 md:pt-28 lg:pt-32
          ml-0
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}
          px-2 sm:px-4 md:px-6 lg:px-8
          pb-6
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}