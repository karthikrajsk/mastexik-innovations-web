import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface RouteHeroCard {
  label: string;
  value: string;
  description: string;
  tone: 'navy' | 'teal' | 'gold';
}

export interface RouteHeroSummary {
  cards: RouteHeroCard[];
}

interface RouteHeroContextValue {
  activeId: string | null;
  actionTarget: HTMLDivElement | null;
  isCompact: boolean;
  summary: RouteHeroSummary | null;
  register: (id: string, summary: RouteHeroSummary) => void;
  unregister: (id: string) => void;
  setActionTarget: (target: HTMLDivElement | null) => void;
}

const RouteHeroContext = createContext<RouteHeroContextValue | null>(null);

function getIsCompact(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

export function RouteHeroProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Map<string, RouteHeroSummary>>(() => new Map());
  const [actionTarget, setActionTargetState] = useState<HTMLDivElement | null>(null);
  const [isCompact, setIsCompact] = useState(getIsCompact);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateCompactMode = (event: MediaQueryListEvent) => setIsCompact(event.matches);

    setIsCompact(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateCompactMode);
    return () => mediaQuery.removeEventListener('change', updateCompactMode);
  }, []);

  const register = useCallback((id: string, summary: RouteHeroSummary) => {
    setEntries((previous) => {
      if (previous.get(id) === summary) return previous;
      const next = new Map(previous);
      next.set(id, summary);
      return next;
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setEntries((previous) => {
      if (!previous.has(id)) return previous;
      const next = new Map(previous);
      next.delete(id);
      return next;
    });
  }, []);

  const setActionTarget = useCallback((target: HTMLDivElement | null) => {
    setActionTargetState((previous) => previous === target ? previous : target);
  }, []);

  const activeId = entries.keys().next().value ?? null;
  const summary = activeId ? entries.get(activeId) ?? null : null;
  const value = useMemo(() => ({
    activeId,
    actionTarget,
    isCompact,
    summary,
    register,
    unregister,
    setActionTarget,
  }), [activeId, actionTarget, isCompact, summary, register, unregister, setActionTarget]);

  return <RouteHeroContext.Provider value={value}>{children}</RouteHeroContext.Provider>;
}

export function useRouteHero() {
  return useContext(RouteHeroContext);
}
