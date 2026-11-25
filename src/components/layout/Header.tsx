import { useEffect, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { useThemeStore } from '@store/themeStore';
import { cn } from '@lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
}

// Eagerly resolve image modules inside src/assets/Images/ so Vite bundler packages them in production builds
const logoModules = import.meta.glob<{ default: string }>('@/assets/Images/*.{png,jpg,jpeg,svg,webp}', { eager: true });
const logoAssetUrls = Object.values(logoModules)
  .map((mod) => (typeof mod === 'string' ? mod : mod?.default))
  .filter(Boolean);

const bundledLogo = logoAssetUrls[0] || '';

export function Header({ collapsed = false, mobileOpen = false, onMobileToggle }: HeaderProps) {
  const { theme } = useThemeStore();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const storedPayload = localStorage.getItem('authPayload');
    if (storedPayload) {
      try {
        const parsedPayload = JSON.parse(storedPayload);
        const u = parsedPayload.user;
        if (u && u.role) {
          setUserRole(String(u.role));
        } else if (user?.role) {
          setUserRole(String(user.role));
        }
      } catch {
        // ignore
      }
    } else if (user?.role) {
      setUserRole(String(user.role));
    }
  }, [user]);

  const isBrushingRole = useMemo(() => {
    const roleStr = userRole || user?.role || '';
    const normalized = String(roleStr).trim().toLowerCase();
    return normalized === 'brushing' || normalized.includes('brushing');
  }, [userRole, user]);

  return (
    <>
      <header
        className={cn(
          'bg-white border-b border-secondary-200 fixed top-0 right-0 left-0',
          collapsed ? 'lg:left-16' : 'lg:left-72',
          'min-h-[3.25rem] md:min-h-[4.5rem] py-1 md:py-2 z-30 transition-all duration-300 shadow-sm',
        )}
      >
        <div className="h-full px-2 sm:px-4 md:px-5 flex items-center justify-between gap-2 md:gap-4">

          {/* Left side: Hamburger (mobile/tablet only) - pinned to left so it is always visible */}
          <div className="flex items-center shrink-0">
            <button
              onClick={onMobileToggle}
              className={cn(
                'lg:hidden p-2 rounded-md hover:bg-secondary-100 transition-colors',
                'text-secondary-700 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20',
              )}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Center Column: Minimized on mobile, full factory address on desktop */}
          <div className="min-w-0 flex-1 text-center py-1 px-1">
            {/* Mobile View: Minimized header info to keep menu button and logo visible */}
            <div className="md:hidden flex flex-col items-center justify-center">
              <div className="font-bold text-secondary-900 text-xs sm:text-sm truncate max-w-[190px] xs:max-w-[240px]">
                Hayagreevas Fabrics
              </div>
              <div className="text-[11px] text-secondary-700 font-semibold leading-tight">
                {isBrushingRole ? 'Unit C' : 'Unit A'}
              </div>
              <div className="text-[10px] text-secondary-500 font-medium truncate">
                GST : 33AACCH7673P1Z0
              </div>
            </div>

            {/* Desktop View (md and up): Full Factory Address */}
            <div className="hidden md:block text-center text-xs leading-tight font-sans text-secondary-800">
              <div className="font-bold text-secondary-900 text-xs md:text-sm">
                Hayagreevas Fabrics Private Limited
              </div>
              <div className="font-semibold text-secondary-900 text-xs">
                {isBrushingRole ? 'Unit C' : 'Unit A'}
              </div>
              {isBrushingRole ? (
                <div className="whitespace-nowrap">264/4, Kallangadu thottam, Panikkampatti, Palladam - 641 664.</div>
              ) : (
                <div className="whitespace-nowrap">
                  SF.No : 193, P.Vadugapalayam, Pollachi Road, Palladam - 641 664.
                </div>
              )}
              <div>Tirupur District.</div>
              <div className="font-bold text-secondary-900 mt-0.5">
                GST No : 33AACCH7673P1Z0
              </div>
            </div>
          </div>

          {/* Right side: Asset Image (Company Logo) */}
          <div className="flex items-center justify-end shrink-0">
            {bundledLogo ? (
              <img
                src={bundledLogo}
                alt="Company Logo"
                className="h-8 sm:h-10 md:h-14 w-auto object-contain max-w-[110px] sm:max-w-[160px] md:max-w-[240px]"
              />
            ) : (
              <img
                src="/assets/Images/logo.png"
                alt="Company Logo"
                className="h-8 sm:h-10 md:h-14 w-auto object-contain max-w-[110px] sm:max-w-[160px] md:max-w-[240px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </div>
        </div>

        <div className="h-1 absolute bottom-0 left-0 right-0" style={{ backgroundColor: getThemeColor(theme) }} />
      </header>
    </>
  );
}

function getThemeColor(theme: string): string {
  switch (theme) {
    case 'green': return '#22c55e';
    case 'purple': return '#a855f7';
    case 'orange': return '#f97316';
    default: return '#3b82f6';
  }
}
