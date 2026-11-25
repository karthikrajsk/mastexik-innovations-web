import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useHighlightRow(timeoutMs = 10000): number | null {
  const location = useLocation();
  const [highlightId, setHighlightId] = useState<number | null>(
    location.state?.highlightId ?? null
  );

  useEffect(() => {
    const id = location.state?.highlightId ?? null;
    if (id == null) return;
    setHighlightId(id);
    const timer = setTimeout(() => setHighlightId(null), timeoutMs);
    return () => clearTimeout(timer);
  }, [location.state?.highlightId, timeoutMs]);

  return highlightId;
}
