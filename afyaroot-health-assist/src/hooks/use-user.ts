import { useState, useEffect } from 'react';

const STORAGE_KEY = 'afyaroot-patient-id';

export function generatePatientId() {
  return `AFR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function useUser() {
  const [patientId, setPatientId] = useState<string>(() => {
    if (typeof window === 'undefined') return generatePatientId();

    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) return existing;
      const newId = generatePatientId();
      localStorage.setItem(STORAGE_KEY, newId);
      return newId;
    } catch {
      return generatePatientId();
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, patientId);
    } catch {
      // ignore storage errors (privacy modes / blocked storage)
    }
  }, [patientId]);

  const resetId = () => {
    const newId = generatePatientId();
    setPatientId(newId);
    try {
      localStorage.setItem(STORAGE_KEY, newId);
    } catch {
      // ignore
    }
  };

  return { patientId, resetId };
}
