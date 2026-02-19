import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PlatformRoleEnum =
  | 'platform_super_admin'
  | 'platform_admin'
  | 'platform_dispatcher'
  | 'platform_director';

// Priority order: lower number = higher priority
const ROLE_PRIORITY: Record<PlatformRoleEnum, number> = {
  platform_super_admin: 0,
  platform_admin: 1,
  platform_dispatcher: 2,
  platform_director: 3,
};

function isRlsDenied(err: { code?: string; message?: string }): boolean {
  return (
    err.code === '42501' ||
    err.message?.includes('42501') ||
    err.message?.toLowerCase().includes('permission denied') ||
    false
  );
}

interface PlatformAuthContextValue {
  platformRole: PlatformRoleEnum | null;
  isPlatformStaff: boolean;
  isPlatformSA: boolean;
  isPlatformAdmin: boolean;
  isPlatformDispatcher: boolean;
  /** true when RLS explicitly denied access (42501) — distinct from "no role" */
  noAccess: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

const PLATFORM_AUTH_FALLBACK: PlatformAuthContextValue = {
  platformRole: null,
  isPlatformStaff: false,
  isPlatformSA: false,
  isPlatformAdmin: false,
  isPlatformDispatcher: false,
  noAccess: false,
  loading: false,
  error: null,
  refresh: () => {},
};

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [platformRole, setPlatformRole] = useState<PlatformRoleEnum | null>(null);
  const [noAccess, setNoAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!user) {
      setPlatformRole(null);
      setNoAccess(false);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNoAccess(false);

    async function fetchPlatformRole() {
      const { data, error: err } = await supabase
        .from('platform_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('is_active', true);

      if (cancelled) return;

      if (err) {
        if (isRlsDenied(err)) {
          // (b) RLS explicitly denied — no role, noAccess=true, no error shown to user
          setPlatformRole(null);
          setNoAccess(true);
          setError(null);
        } else {
          // (c) Any other error — surface it
          setPlatformRole(null);
          setNoAccess(false);
          setError('Не удалось загрузить платформенную роль. Попробуйте позже.');
        }
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        // (a) Successful query, no rows — simply no platform role assigned
        setPlatformRole(null);
        setNoAccess(false);
        setError(null);
        setLoading(false);
        return;
      }

      // Pick highest-priority role (lowest number wins)
      const best = data.reduce<PlatformRoleEnum | null>((acc, row) => {
        const r = row.role as PlatformRoleEnum;
        if (acc === null) return r;
        return ROLE_PRIORITY[r] < ROLE_PRIORITY[acc] ? r : acc;
      }, null);

      setPlatformRole(best);
      setNoAccess(false);
      setError(null);
      setLoading(false);
    }

    fetchPlatformRole();
    return () => { cancelled = true; };
  }, [user, tick]);

  const isPlatformStaff = platformRole !== null;
  const isPlatformSA = platformRole === 'platform_super_admin';
  const isPlatformAdmin = platformRole === 'platform_admin';
  const isPlatformDispatcher = platformRole === 'platform_dispatcher';

  return (
    <PlatformAuthContext.Provider
      value={{
        platformRole,
        isPlatformStaff,
        isPlatformSA,
        isPlatformAdmin,
        isPlatformDispatcher,
        noAccess,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth(): PlatformAuthContextValue {
  const ctx = useContext(PlatformAuthContext);
  // Safe fallback when used outside the provider (e.g. shared layout components)
  return ctx ?? PLATFORM_AUTH_FALLBACK;
}
