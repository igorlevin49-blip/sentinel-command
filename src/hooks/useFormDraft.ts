import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';

const DRAFT_PREFIX = 'soms_draft_';

/**
 * Persists form data to sessionStorage under a stable key.
 * Shows "Черновик восстановлен" toast when draft is restored on mount.
 *
 * Usage:
 *   const [form, setForm, clearDraft] = useFormDraft('contracts-new', emptyForm);
 */
export function useFormDraft<T extends object>(
  draftKey: string,
  defaultValue: T,
): [T, (updater: T | ((prev: T) => T)) => void, () => void] {
  const storageKey = DRAFT_PREFIX + draftKey;
  const restoredRef = useRef(false);

  const [value, setValueRaw] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        // Schedule toast after mount
        restoredRef.current = true;
        return parsed;
      }
    } catch { /* ignore */ }
    return defaultValue;
  });

  // Show toast once after mount if draft was restored
  useEffect(() => {
    if (restoredRef.current) {
      restoredRef.current = false;
      toast({ title: 'Черновик восстановлен', description: 'Продолжайте редактирование.' });
    }
  }, []);

  // Persist to sessionStorage on every change (debounced isn't needed for sessionStorage)
  useEffect(() => {
    // Only persist if value differs from default
    const isDefault = JSON.stringify(value) === JSON.stringify(defaultValue);
    if (isDefault) {
      sessionStorage.removeItem(storageKey);
    } else {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    }
  }, [value, storageKey, defaultValue]);

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValueRaw(updater);
    },
    [],
  );

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setValueRaw(defaultValue);
  }, [storageKey, defaultValue]);

  return [value, setValue, clearDraft];
}

/**
 * Hook that warns before navigating away with unsaved changes.
 * Uses the beforeunload event for browser refresh/close.
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
