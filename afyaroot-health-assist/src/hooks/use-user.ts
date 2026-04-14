import { useState, useEffect } from 'react';

const STORAGE_KEY = 'afyaroot-patient-id';

export function generatePatientId() {
  return `AFR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function useUser() {
  const [patientId, setPatientId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });

  useEffect(() => {
    if (!patientId) {
      const newId = generatePatientId();
      setPatientId(newId);
      localStorage.setItem(STORAGE_KEY, newId);
    }
  }, [patientId]);

  const resetId = () => {
    const newId = generatePatientId();
    setPatientId(newId);
    localStorage.setItem(STORAGE_KEY, newId);
  };

  return { patientId, resetId };
}
