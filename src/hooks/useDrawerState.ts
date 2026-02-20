import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Syncs drawer/modal open state with URL search params.
 * E.g. ?drawer=task&id=PLAT-002
 *
 * Usage:
 *   const { isOpen, openId, open, close } = useDrawerState('drawer');
 *   // open('PLAT-002') → sets ?drawer=PLAT-002
 *   // close() → removes ?drawer
 *   // isOpen → true if param exists
 *   // openId → 'PLAT-002'
 */
export function useDrawerState(paramName: string = 'drawer') {
  const [searchParams, setSearchParams] = useSearchParams();

  const openId = searchParams.get(paramName) ?? null;
  const isOpen = openId !== null;

  const open = useCallback(
    (id: string = '1') => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(paramName, id);
        return next;
      }, { replace: true });
    },
    [paramName, setSearchParams],
  );

  const close = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(paramName);
      return next;
    }, { replace: true });
  }, [paramName, setSearchParams]);

  return { isOpen, openId, open, close };
}

/**
 * Boolean variant for simple show/hide forms (no ID).
 * ?form=1
 */
export function useFormVisibility(paramName: string = 'form') {
  const { isOpen, open, close } = useDrawerState(paramName);
  const show = useCallback(() => open('1'), [open]);
  return { isVisible: isOpen, show, hide: close };
}
