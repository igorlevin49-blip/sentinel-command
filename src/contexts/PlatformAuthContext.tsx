import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PlatformRoleEnum =
  | 'platform_super_admin'
  | 'platform_admin'
  | 'platform_dispatcher'
  | 'platform_director';

// Priority order: higher index = lower priority (SA wins)
const ROLE_PRIORITY: Record<PlatformRoleEnum, number> = {
  platform_super_admin: 0,
  platform_admin: 1,
  platform_dispatcher: 2,
  platform_director: 3,
};

interface PlatformAuthContextValue {
  platformRole: PlatformRoleEnum | null;
  isPlatformStaff: boolean;
  isPlatformSA: boolean;
  isPlatformAdmin: boolean;
  isPlatformDispatcher: boolean;
  loading: boolean;
  error: string | null;
  /** Re-fetch platform role from DB */
  refresh: () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [platformRole, setPlatformRole] = useState<PlatformRoleEnum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!user) {
      setPlatformRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchPlatformRole() {
      const { data, error: err } = await supabase
        .from('platform_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('is_active', true);

      if (cancelled) return;

      if (err) {
        // 42501 = RLS / no access — treat as "no platform role", don't crash
        if (err.code === '42501' || err.message?.includes('42501')) {
          setPlatformRole(null);
        } else {
          setError(err.message);
        }
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setPlatformRole(null);
        setLoading(false);
        return;
      }

      // Pick the highest-priority role (lowest number wins)
      const best = data.reduce<PlatformRoleEnum | null>((acc, row) => {
        const r = row.role as PlatformRoleEnum;
        if (acc === null) return r;
        return ROLE_PRIORITY[r] < ROLE_PRIORITY[acc] ? r : acc;
      }, null);

      setPlatformRole(best);
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
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
}

const PLATFORM_AUTH_FALLBACK: PlatformAuthContextValue = {
  platformRole: null,
  isPlatformStaff: false,
  isPlatformSA: false,
  isPlatformAdmin: false,
  isPlatformDispatcher: false,
  loading: false,
  error: null,
  refresh: () => {},
};

export function usePlatformAuth(): PlatformAuthContextValue {
  const ctx = useContext(PlatformAuthContext);
  // Return safe defaults when used outside provider (e.g. in shared layout components)
  return ctx ?? PLATFORM_AUTH_FALLBACK;
}
