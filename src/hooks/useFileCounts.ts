import { useState, useEffect, useCallback, useRef } from 'react';
import mediaUploadService from '@/services/MediaUploadService';

export function useFileCounts(containerNames: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const prevNamesRef = useRef<string>('');

  const fetchCounts = useCallback(async (names: string[]) => {
    if (!names || names.length === 0) {
      setCounts({});
      return;
    }
    const countsMap = await mediaUploadService.getBatchFileCounts(names);
    setCounts(prev => ({
      ...prev,
      ...countsMap,
    }));
  }, []);

  useEffect(() => {
    const key = containerNames.join(',');
    if (key !== prevNamesRef.current) {
      prevNamesRef.current = key;
      if (containerNames.length > 0) {
        fetchCounts(containerNames);
      }
    }
  }, [containerNames, fetchCounts]);

  const updateCount = useCallback((containerName: string, count: number) => {
    setCounts(prev => ({
      ...prev,
      [containerName]: count,
    }));
  }, []);

  const refreshCounts = useCallback(() => {
    if (containerNames.length > 0) {
      fetchCounts(containerNames);
    }
  }, [containerNames, fetchCounts]);

  return { counts, updateCount, refreshCounts };
}
