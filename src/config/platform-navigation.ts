import {
  Shield,
  FileText,
  Clock,
  Route,
  Bell,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

/**
 * Navigation items shown to platform staff (any active platform_role).
 * Displayed independently of org_members role.
 */
export const platformNavItems: NavItem[] = [
  // NOTE: "Роли платформы" is intentionally NOT listed here for super_admin;
  // it lives at /super-admin/roles and is rendered via roleNavItems[super_admin].
  { title: 'Контракты', path: '/platform/contracts', icon: FileText },
  { title: 'SLA правила', path: '/platform/sla', icon: Clock },
  { title: 'Маршрутизация', path: '/platform/dispatch', icon: Route },
  { title: 'Эскалации', path: '/platform/escalations', icon: Bell },
  { title: 'Очередь ЦОУ', path: '/platform/incidents', icon: AlertTriangle },
];
