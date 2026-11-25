import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/services/ApiService';

const BASE_URL = API_BASE_URL;

interface UseMappingStatusOptions {
  endpoint: string;
  id: number | string | null | undefined;
  enabled?: boolean;
}

export function useMappingStatus({ endpoint, id, enabled = true }: UseMappingStatusOptions) {
  const [isMapped, setIsMapped] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !id) {
      setIsMapped(false);
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      try {
        const url = `${BASE_URL}${endpoint}${id}/mapping-status`;
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) {
          setIsMapped(false);
          return;
        }
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          setIsMapped(false);
          return;
        }
        const data = await response.json();
        setIsMapped(data?.data?.isMapped === true);
      } catch {
        setIsMapped(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [endpoint, id, enabled]);

  return { isMapped, loading };
}
