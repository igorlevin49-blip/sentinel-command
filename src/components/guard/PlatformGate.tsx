import { useState } from 'react';
import { ShieldOff, AlertTriangle } from 'lucide-react';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PlatformGateProps {
  children: React.ReactNode;
}

/**
 * Route guard for /platform/* routes.
 * Source of truth: public.platform_roles only — never org_members.
 *
 * State order: loading → error → no-access (RLS deny OR no role) → children
 */
export function PlatformGate({ children }: PlatformGateProps) {
  const { isPlatformStaff, noAccess, loading, error, refresh } = usePlatformAuth();
  const { user } = useAuth();
  const [bootstrapping, setBootstrapping] = useState(false);

  const BOOTSTRAP_EMAIL = 'egor.smart@inbox.ru';
  const isBootstrapUser = user?.email === BOOTSTRAP_EMAIL;

  // TODO: REMOVE AFTER BOOTSTRAP
  async function handleBootstrapGrant() {
    if (!user || !isBootstrapUser) return;
    setBootstrapping(true);
    await supabase
      .from('platform_roles')
      .upsert(
        { user_id: user.id, role: 'platform_super_admin', is_active: true },
        { onConflict: 'user_id,role' }
      );
    setBootstrapping(false);
    refresh();
  }

  // 1) Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // 2) Non-RLS error (network, unexpected DB error, etc.)
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm max-w-md w-full">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Ошибка загрузки</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // 3) No access — covers both:
  //    (a) noAccess=true  → RLS explicitly denied (42501)
  //    (b) isPlatformStaff=false → no platform_roles record
  if (noAccess || !isPlatformStaff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm max-w-md w-full">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldOff className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Нет доступа к платформенному кабинету
          </h2>
          <p className="text-sm text-muted-foreground">
            Этот раздел доступен только пользователям с активной платформенной ролью
            (platform_super_admin, platform_admin, platform_dispatcher или platform_director).
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Если вам нужен доступ, обратитесь к администратору платформы QOR.
          </p>
        </div>
      </div>
    );
  }

  // 4) Authorised
  return <>{children}</>;
}
