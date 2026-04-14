import { useCallback, useEffect, useMemo, useState } from 'react';

const ADMIN_SESSION_KEY = 'afyaroot-admin-session-v2';
const DEFAULT_ADMIN_CODE = 'AFYAROOT-ADMIN';
const DEFAULT_FACILITY_CODES: Record<string, string> = {
  kapsabet: '1111',
  'nandi-hills': '2222',
  chepterit: '3333',
  kabiyet: '4444',
  mosoriot: '5555',
};

interface AdminSession {
  facilityId: string;
  facilityName: string;
  loginTime: number;
}

function normalizeCode(code: string) {
  return code.replace(/\s+/g, '').trim().toUpperCase();
}

function readAdminSession(): AdminSession | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const data = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!data) return null;
    const session = JSON.parse(data) as AdminSession;
    // Session valid for 8 hours
    if (Date.now() - session.loginTime > 8 * 60 * 60 * 1000) {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return session;
  } catch (error: unknown) {
    console.error('Failed to read admin session:', error);
    return null;
  }
}

function persistAdminSession(session: AdminSession | null) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (session) {
      window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch (error: unknown) {
    console.error('Failed to persist admin session:', error);
  }
}

// Get facility PIN from environment (can be per-facility or shared)
function getFacilityPins(): Record<string, string> {
  const pins: Record<string, string> = Object.fromEntries(
    Object.entries(DEFAULT_FACILITY_CODES).map(([facilityId, code]) => [facilityId, normalizeCode(code)])
  );

  const pinsEnv = import.meta.env.VITE_ADMIN_FACILITY_PINS || '';
  if (!pinsEnv) return pins;

  // Format: "kapsabet:1234,nandi-hills:5678"
  pinsEnv.split(',').forEach((pair) => {
    const [facilityId, pin] = pair.trim().split(':');
    if (facilityId && pin) {
      pins[facilityId.toLowerCase()] = normalizeCode(pin);
    }
  });
  return pins;
}

function getSharedAdminCode() {
  return normalizeCode(import.meta.env.VITE_ADMIN_ACCESS_CODE || DEFAULT_ADMIN_CODE);
}

export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(() => readAdminSession());
  const facilityPins = useMemo(() => getFacilityPins(), []);
  const sharedAdminCode = useMemo(() => getSharedAdminCode(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== ADMIN_SESSION_KEY) return;
      if (!event.newValue) {
        setSession(null);
        return;
      }

      try {
        const nextSession = JSON.parse(event.newValue) as AdminSession;
        setSession(nextSession);
      } catch {
        setSession(null);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(
    (facilityId: string, facilityName: string, code: string): boolean => {
      const facilityKey = facilityId.toLowerCase();
      const expectedCode = facilityPins[facilityKey] || sharedAdminCode;
      const providedCode = normalizeCode(code);

      if (!expectedCode || providedCode !== expectedCode) {
        return false;
      }

      const newSession: AdminSession = {
        facilityId,
        facilityName,
        loginTime: Date.now(),
      };

      persistAdminSession(newSession);
      setSession(newSession);
      return true;
    },
    [facilityPins, sharedAdminCode]
  );

  const logout = useCallback(() => {
    persistAdminSession(null);
    setSession(null);
  }, []);

  const isAuthenticated = session !== null;
  const currentFacilityId = session?.facilityId || null;
  const currentFacilityName = session?.facilityName || null;

  return {
    isAuthenticated,
    currentFacilityId,
    currentFacilityName,
    login,
    logout,
    session,
  };
}
