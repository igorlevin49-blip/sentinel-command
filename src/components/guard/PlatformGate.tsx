import { ShieldOff } from 'lucide-react';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';

interface PlatformGateProps {
  children: React.ReactNode;
}

/**
 * Route guard for /platform/* routes.
 * Only platform staff (any active platform_role) passes through.
 */
export function PlatformGate({ children }: PlatformGateProps) {
  const { isPlatformStaff, loading } = usePlatformAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isPlatformStaff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center shadow-sm max-w-md w-full">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldOff className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Нет доступа к платформенному кабинету</h2>
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

  return <>{children}</>;
}
