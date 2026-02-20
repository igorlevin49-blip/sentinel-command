import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Bell, Search, User, ChevronDown, LogOut, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { roleLabels, roleDefaultRoute } from '@/config/role-navigation';
import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/types/soms';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const IS_DEV = import.meta.env.DEV;
const devRoles: UserRole[] = ['dispatcher', 'org_admin', 'chief', 'director', 'guard', 'client'];
const demoRoles: UserRole[] = ['super_admin', 'dispatcher', 'org_admin', 'chief', 'director', 'guard', 'client'];

export function AppLayout({ children, title }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { role, actualRole, isDemoView, setViewAsRole, setRole, userName, userTitle } = useRole();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isSuperAdmin = actualRole === 'super_admin';

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleDemoSwitch = (r: UserRole) => {
    if (r === 'super_admin') {
      setViewAsRole(null);
    } else {
      setViewAsRole(r);
    }
    setMenuOpen(false);
    navigate(roleDefaultRoute[r], { replace: true });
  };

  const handleExitDemo = () => {
    setViewAsRole(null);
    setMenuOpen(false);
    navigate(roleDefaultRoute['super_admin'], { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-60'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {title && <h1 className="text-lg font-semibold text-foreground">{title}</h1>}
            {/* Demo badge */}
            {isDemoView && (
              <Badge variant="warning" className="flex items-center gap-1.5">
                <Eye className="h-3 w-3" />
                DEMO: {role ? roleLabels[role] : '—'}
                <button
                  onClick={handleExitDemo}
                  className="ml-1 rounded-full p-0.5 hover:bg-warning-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск..."
                className="h-9 w-64 rounded-md border border-border bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Notifications */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                3
              </span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-muted"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-[11px] text-muted-foreground">{userTitle}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-popover p-1 shadow-xl">
                    {/* SUPER_ADMIN demo role switcher */}
                    {isSuperAdmin && (
                      <>
                        <div className="px-3 py-2 border-b border-border mb-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <Eye className="inline h-3 w-3 mr-1" />
                            Смотреть как роль
                          </p>
                        </div>
                        {demoRoles.map((r) => (
                          <button
                            key={r}
                            onClick={() => handleDemoSwitch(r)}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                              role === r
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-foreground hover:bg-muted'
                            )}
                          >
                            {roleLabels[r]}
                            {role === r && (
                              <span className="ml-auto text-[10px] text-primary">✓</span>
                            )}
                          </button>
                        ))}
                      </>
                    )}

                    {/* DEV-only role switcher (non-super_admin) */}
                    {IS_DEV && !isSuperAdmin && (
                      <>
                        <div className="px-3 py-2 border-b border-border mb-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            DEV: переключение ролей
                          </p>
                        </div>
                        {devRoles.map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              setRole(r);
                              setMenuOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                              role === r
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-foreground hover:bg-muted'
                            )}
                          >
                            {roleLabels[r]}
                            {role === r && (
                              <span className="ml-auto text-[10px] text-primary">✓</span>
                            )}
                          </button>
                        ))}
                      </>
                    )}

                    <div className={cn((isSuperAdmin || IS_DEV) && 'border-t border-border mt-1 pt-1')}>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Выйти
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
