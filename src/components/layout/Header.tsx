import { useContext } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@lib/utils';
import { TitleContext, useRouteTitle } from '@/routes/TitleContext';
import { useRouteHero } from '@/contexts/RouteHeroContext';

interface HeaderProps {
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
}

function getSectionLabel(pathname: string): string {
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  const sections: Record<string, string> = {
    masters: 'Masters',
    'location-masters': 'Masters',
    transaction: 'Transactions',
    reports: 'Reports',
    agency: 'Agency',
    settings: 'Settings',
  };

  return sections[firstSegment || ''] || (firstSegment ? 'Workspace' : 'Overview');
}

export function Header({ mobileOpen = false, onMobileToggle }: HeaderProps) {
  const location = useLocation();
  const { titleMap } = useContext(TitleContext);
  const { title, hideTitle } = useRouteTitle(location.pathname, titleMap);
  const routeHero = useRouteHero();
  const pageTitle = title && !hideTitle ? title : 'Textile Operations';
  const section = getSectionLabel(location.pathname);

  if (location.pathname === '/' || location.pathname.toLowerCase() === '/dashboard' || hideTitle) {
    return null;
  }

  return (
    <header className="fixed top-3 right-3 left-3 lg:left-[240px] z-30 h-[112px] sm:h-[120px] lg:h-[124px] overflow-visible text-white">
      <div className="relative h-full overflow-hidden rounded-2xl bg-[#082A59] shadow-[0_10px_26px_rgba(6,30,65,0.16)]">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
        <div className="absolute right-10 -top-10 h-48 w-48 rounded-full border border-white/[0.07]" aria-hidden="true" />
        <div className="relative flex h-full items-start pt-3 sm:pt-3.5 lg:pt-4 gap-3 px-4 sm:px-6 lg:px-7">
          <button
            onClick={onMobileToggle}
            className={cn(
              'lg:hidden mt-0.5 shrink-0 rounded-lg p-2 text-white/85 transition-colors hover:bg-white/10 hover:text-white',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D0A45D]',
            )}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#D0A45D] sm:text-[10px]">
              {section}
            </p>
            <h1
              className="max-w-3xl min-w-0 break-words font-serif text-[19px] leading-tight tracking-[-0.025em] text-[#FFFDF8] sm:text-[22px] lg:text-[24px]"
              style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}
            >
              {pageTitle}
            </h1>
            <p className="mt-0.5 text-[10px] text-[#DCE7F3]/85 sm:text-xs">
              Production, inventory and order management
            </p>
          </div>

          {routeHero && !routeHero.isCompact && (
            <div
              ref={routeHero.setActionTarget}
              className="hidden min-w-0 max-w-[52%] flex-1 items-center justify-end md:flex"
              aria-label="Page actions"
            />
          )}
        </div>
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-[#D0A45D]/75 via-[#008F8C]/45 to-transparent" aria-hidden="true" />
      </div>

      {routeHero?.summary && (
        <section
          className="absolute left-2 right-2 top-full z-20 -translate-y-3 sm:-translate-y-3.5 sm:left-4 sm:right-4 lg:left-5 lg:right-5"
          aria-label="Record summary"
        >
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {routeHero.summary.cards.map((card) => {
              const accent = card.tone === 'teal'
                ? 'bg-[#008F8C]'
                : card.tone === 'gold'
                  ? 'bg-[#C99A4A]'
                  : 'bg-[#0B376E]';
              const valueColor = card.tone === 'teal'
                ? 'text-[#008F8C]'
                : card.tone === 'gold'
                  ? 'text-[#9B702F]'
                  : 'text-[#082A59]';

              return (
                <article
                  key={card.label}
                  className="relative min-h-[72px] overflow-hidden rounded-xl border border-[#D8E1EA] bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,48,78,0.09)] sm:min-h-[76px] sm:px-4 sm:py-2.5"
                >
                  <span className={cn('absolute left-0 top-0 h-full w-[3.5px]', accent)} aria-hidden="true" />
                  <p className="truncate text-[16px] font-semibold text-[#082A59] sm:text-[18px]">
                    {card.label}
                  </p>
                  <p className={cn('mt-0.5 font-serif text-[18px] font-bold leading-none sm:text-[22px]', valueColor)}>
                    {card.value}
                  </p>
                  <p className="mt-1 truncate text-[11px] leading-tight text-[#6E8499] sm:text-[12px]">
                    {card.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </header>
  );
}
