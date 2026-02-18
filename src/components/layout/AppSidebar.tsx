import { NavLink, useLocation } from 'react-router-dom';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { roleNavItems, roleLabels } from '@/config/role-navigation';
import { platformNavItems } from '@/config/platform-navigation';
import type { UserRole } from '@/types/soms';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const roleBadgeColors: Record<UserRole, string> = {
  super_admin: 'bg-destructive/20 text-destructive',
  org_admin: 'bg-primary/20 text-primary',
  dispatcher: 'bg-warning/20 text-warning',
  chief: 'bg-primary/20 text-primary',
  director: 'bg-accent/20 text-accent',
  guard: 'bg-success/20 text-success',
  client: 'bg-muted text-muted-foreground',
};

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { role } = useRole();
  const { isPlatformStaff, platformRole } = usePlatformAuth();
  const navItems = roleNavItems[role];

  // Determine if we're on a /platform/ route
  const isOnPlatform = location.pathname.startsWith('/platform');

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Shield className="h-7 w-7 shrink-0 text-primary" />
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <span className="text-lg font-bold tracking-tight text-foreground">S-OMS</span>
            <span className="ml-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">v1.0</span>
          </div>
        )}
      </div>

      {/* Role indicator */}
      {!collapsed && (
        <div className="border-b border-sidebar-border px-4 py-2.5 space-y-1">
          <span className={cn(
            'inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            roleBadgeColors[role]
          )}>
            {roleLabels[role]}
          </span>
          {/* Platform role badge */}
          {isPlatformStaff && platformRole && (
            <div>
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                <Globe className="h-2.5 w-2.5" />
                {platformRole.replace('platform_', '')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {/* Platform section — only shown to platform staff */}
        {isPlatformStaff && (
          <>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Платформа QOR
              </p>
            )}
            {platformNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
                    )}
                  />
                  {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
                  {isActive && (
                    <div className="absolute left-0 h-8 w-[3px] rounded-r-full bg-primary" />
                  )}
                </NavLink>
              );
            })}

            {/* Separator between platform and org nav */}
            {!isOnPlatform && !collapsed && (
              <div className="my-2 border-t border-sidebar-border" />
            )}
            {!isOnPlatform && !collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Организация
              </p>
            )}
          </>
        )}

        {/* Org / role nav — hide when on /platform and user only has platform access */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
                )}
              />
              {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
              {isActive && (
                <div className="absolute left-0 h-8 w-[3px] rounded-r-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
