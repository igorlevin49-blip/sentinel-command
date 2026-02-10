import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole } from '@/types/soms';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RoleContextValue {
  /** Effective role (viewAs if set, otherwise actual) */
  role: UserRole;
  /** Real role from DB — never changes */
  actualRole: UserRole;
  /** True when super_admin is viewing as another role */
  isDemoView: boolean;
  /** Set viewAs role (super_admin only). Pass null to exit demo. */
  setViewAsRole: (role: UserRole | null) => void;
  /** Dev-only override */
  setRole: (role: UserRole) => void;
  userName: string;
  userTitle: string;
  roleLoading: boolean;
  roleError: string | null;
}

const roleProfiles: Record<UserRole, { name: string; title: string }> = {
  super_admin: { name: 'Системный Администратор', title: 'QOR Super Admin' },
  org_admin: { name: 'Администратор', title: 'Администратор' },
  dispatcher: { name: 'Диспетчер', title: 'Диспетчер' },
  chief: { name: 'Нач. охраны', title: 'Нач. охраны' },
  guard: { name: 'Охранник', title: 'Охранник' },
  client: { name: 'Заказчик', title: 'Заказчик' },
  director: { name: 'Директор', title: 'Директор' },
};

const RoleContext = createContext<RoleContextValue | null>(null);

const IS_DEV = import.meta.env.DEV;

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dbRole, setDbRole] = useState<UserRole>('dispatcher');
  const [viewAsRole, setViewAsRoleState] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!user) {
      setRoleLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchRole() {
      setRoleLoading(true);
      setRoleError(null);

      const { data, error } = await supabase
        .from('org_members')
        .select('role')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Failed to fetch role:', error);
        setRoleError('Не удалось получить роль');
        setRoleLoading(false);
        return;
      }

      if (!data) {
        setRoleError('no_role');
        setRoleLoading(false);
        return;
      }

      setDbRole(data.role as UserRole);
      setUserName(user!.email ?? '');
      setRoleLoading(false);
    }

    fetchRole();
    return () => { cancelled = true; };
  }, [user]);

  const actualRole = dbRole;
  const isSuperAdmin = actualRole === 'super_admin';
  const isDemoView = isSuperAdmin && viewAsRole !== null && viewAsRole !== 'super_admin';
  const effectiveRole = isDemoView ? viewAsRole! : actualRole;

  const setViewAsRole = (r: UserRole | null) => {
    if (!isSuperAdmin) return;
    setViewAsRoleState(r);
  };

  // Dev-only override (legacy)
  const setRole = (r: UserRole) => {
    if (IS_DEV) {
      setDbRole(r);
      setViewAsRoleState(null);
    }
  };

  const profile = roleProfiles[effectiveRole];

  return (
    <RoleContext.Provider
      value={{
        role: effectiveRole,
        actualRole,
        isDemoView,
        setViewAsRole,
        setRole,
        userName: userName || profile.name,
        userTitle: isDemoView ? `DEMO: ${profile.title}` : profile.title,
        roleLoading,
        roleError,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

export { roleProfiles };
