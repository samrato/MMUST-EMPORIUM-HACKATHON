import { useCallback, useEffect, useMemo, useState } from 'react';

const ADMIN_SESSION_STORAGE_KEY = 'afyaroot-admin-session';
const DEFAULT_ADMIN_ACCESS_CODE = 'AFYAROOT-ADMIN';

function normalizeAccessCode(code: string) {
  return code.replace(/\s+/g, '').trim().toUpperCase();
}

function getExpectedAdminCode() {
  const configuredCode = normalizeAccessCode(import.meta.env.VITE_ADMIN_ACCESS_CODE || '');
  if (configuredCode.length > 0) return configuredCode;
  return normalizeAccessCode(DEFAULT_ADMIN_ACCESS_CODE);
}

function readAdminSession() {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    return window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === 'true';
  } catch (error: unknown) {
    console.error('Unable to read admin session state:', error);
    return false;
  }
}

function persistAdminSession(enabled: boolean) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (enabled) {
      window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    }
  } catch (error: unknown) {
    console.error('Unable to persist admin session state:', error);
  }
}

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => readAdminSession());
  const expectedCode = useMemo(() => getExpectedAdminCode(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== ADMIN_SESSION_STORAGE_KEY) return;
      setIsAdmin(event.newValue === 'true');
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const unlockAdmin = useCallback((accessCode: string) => {
    const matches = normalizeAccessCode(accessCode) === expectedCode;
    if (!matches) return false;

    persistAdminSession(true);
    setIsAdmin(true);
    return true;
  }, [expectedCode]);

  const lockAdmin = useCallback(() => {
    persistAdminSession(false);
    setIsAdmin(false);
  }, []);

  return { isAdmin, unlockAdmin, lockAdmin };
}

