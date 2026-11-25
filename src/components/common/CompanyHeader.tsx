import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CompanyHeaderProps {
  className?: string;
  showLogo?: boolean;
}

// Eagerly resolve image modules inside src/assets/Images/ so Vite bundler packages them in production builds
const logoModules = import.meta.glob<{ default: string }>('@/assets/Images/*.{png,jpg,jpeg,svg,webp}', { eager: true });
const logoAssetUrls = Object.values(logoModules)
  .map((mod) => (typeof mod === 'string' ? mod : mod?.default))
  .filter(Boolean);

const bundledLogo = logoAssetUrls[0] || '';

export function CompanyHeader({ className = '', showLogo = true }: CompanyHeaderProps) {
  const { user } = useAuth();

  const userRole = React.useMemo(() => {
    if (user?.role) return String(user.role);
    try {
      const storedPayload = localStorage.getItem('authPayload');
      if (storedPayload) {
        const parsed = JSON.parse(storedPayload);
        if (parsed?.user?.role) return String(parsed.user.role);
      }
    } catch {
      // fallback
    }
    return '';
  }, [user]);

  const isBrushing = React.useMemo(() => {
    const roleLower = userRole.trim().toLowerCase();
    return roleLower === 'brushing' || roleLower.includes('brushing');
  }, [userRole]);

  return (
    <div className={`relative flex items-center  w-full py-2 px-2 border-b border-slate-200 ${className}`}>
      {/* Centered Factory Address Header */}
      <div className="text-center w-full text-xs text-secondary-800 leading-snug font-sans px-10">
       
       
        <p className="font-bold text-secondary-900 text-md md:text-sm">
          Hayagreevas Fabrics Private Limited
        </p>
         <p className="font-semibold text-secondary-900 text-xs">
          {isBrushing ? 'Unit C' : 'Unit A'}
        </p>
        {isBrushing ? (
          <p>264/4, Kallangadu thottam, Panikkampatti, Palladam - 641 664. Tirupur District.</p>
        ) : (
          <p>SF.No : 193, P.Vadugapalayam, Pollachi Road, Palladam - 641 664. Tirupur District.</p>
        )}
        <p className="font-bold text-secondary-900 mt-0.5">GST No : 33AACCH7673P1Z0</p>
      </div>

      {/* Top Right Logo */}
      {showLogo && (
        <div className="absolute right-2 top-2 flex items-center justify-end">
          {bundledLogo ? (
            <img
              src={bundledLogo}
              alt="Company Logo"
              className="h-10 md:h-12 w-auto object-contain max-w-[180px]"
            />
          ) : (
            <img
              src="/assets/Images/logo.png"
              alt="Company Logo"
              className="h-10 md:h-12 w-auto object-contain max-w-[180px]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default CompanyHeader;
