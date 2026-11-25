import screenCodesAPI, { ScreenCodeDTO } from '@/services/screen-codes-api';
import { useState, useEffect, useCallback } from 'react';

const SCREEN_CODES_CACHE_KEY = 'app_screen_codes';
const SCREEN_CODES_CACHE_EXPIRY_KEY = 'app_screen_codes_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface ScreenCodeMap {
  [code: string]: string;
}

export const useScreenCodes = () => {
  const [screenCodes, setScreenCodes] = useState<ScreenCodeDTO[]>([]);
  const [codeMap, setCodeMap] = useState<ScreenCodeMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCachedScreenCodes = useCallback((): ScreenCodeDTO[] | null => {
    try {
      const cached = localStorage.getItem(SCREEN_CODES_CACHE_KEY);
      const expiry = localStorage.getItem(SCREEN_CODES_CACHE_EXPIRY_KEY);

      if (cached && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
          return JSON.parse(cached);
        } else {
          localStorage.removeItem(SCREEN_CODES_CACHE_KEY);
          localStorage.removeItem(SCREEN_CODES_CACHE_EXPIRY_KEY);
        }
      }
    } catch (err) {
      console.error('Error reading screen codes from cache:', err);
    }
    return null;
  }, []);

  const setCacheScreenCodes = useCallback((codes: ScreenCodeDTO[]) => {
    try {
      localStorage.setItem(SCREEN_CODES_CACHE_KEY, JSON.stringify(codes));
      localStorage.setItem(
        SCREEN_CODES_CACHE_EXPIRY_KEY,
        (Date.now() + CACHE_DURATION).toString()
      );
    } catch (err) {
      console.error('Error saving screen codes to cache:', err);
    }
  }, []);

  const fetchScreenCodes = useCallback(async () => {
    const cached = getCachedScreenCodes();
    if (cached && cached.length > 0) {
      setScreenCodes(cached);
      buildCodeMap(cached);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const codes = await screenCodesAPI.getAll();
      setScreenCodes(codes);
      buildCodeMap(codes);
      setCacheScreenCodes(codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch screen codes');
      console.error('Error fetching screen codes:', err);
    } finally {
      setLoading(false);
    }
  }, [getCachedScreenCodes, setCacheScreenCodes]);

  const buildCodeMap = (codes: ScreenCodeDTO[]) => {
    const map: ScreenCodeMap = {};
    codes.forEach(code => {
      map[code.code] = code.value;
    });
    setCodeMap(map);
  };

  const getScreenValue = useCallback(
    (code: string): string => {
      return codeMap[code] || code;
    },
    [codeMap]
  );

  const getScreenCode = useCallback(
    (value: string): string => {
      const entry = screenCodes.find(sc => sc.value === value);
      return entry ? entry.code : value;
    },
    [screenCodes]
  );

  useEffect(() => {
    if (screenCodes.length === 0 && !loading) {
      fetchScreenCodes();
    }
  }, []);

  return {
    screenCodes,
    codeMap,
    loading,
    error,
    getScreenValue,
    getScreenCode,
    refetch: fetchScreenCodes
  };
};

export default useScreenCodes;
