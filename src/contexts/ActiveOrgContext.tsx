import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/soms';

interface ActiveOrgContextValue {
  orgId: string | null;
  orgRole: UserRole | null;
  loading: boolean;
  error: string | null;
  /** true if current role can manage (create/edit/delete) */
  canManage: boolean;
  canDispatch: boolean;
}

const ActiveOrgContext = createContext<ActiveOrgContextValue | null>(null);

const MANAGE_ROLES: UserRole[] = ['org_admin', 'super_admin'];
const DISPATCH_ROLES: UserRole[] = ['org_admin', 'super_admin', 'dispatcher', 'chief'];

export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgRole, setOrgRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrgId(null);
      setOrgRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
        } else if (data) {
          setOrgId(data.org_id);
          setOrgRole(data.role as UserRole);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  const canManage = orgRole !== null && MANAGE_ROLES.includes(orgRole);
  const canDispatch = orgRole !== null && DISPATCH_ROLES.includes(orgRole);

  return (
    <ActiveOrgContext.Provider value={{ orgId, orgRole, loading, error, canManage, canDispatch }}>
      {children}
    </ActiveOrgContext.Provider>
  );
}

export function useActiveOrg(): ActiveOrgContextValue {
  const ctx = useContext(ActiveOrgContext);
  if (!ctx) throw new Error('useActiveOrg must be used within ActiveOrgProvider');
  return ctx;
}
