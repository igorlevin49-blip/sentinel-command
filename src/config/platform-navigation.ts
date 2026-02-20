import {
  FileText,
  Clock,
  Route,
  Bell,
  AlertTriangle,
  Shield,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import type { PlatformRoleEnum } from '@/contexts/PlatformAuthContext';

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  /** If set, item is only visible for these platform roles */
  visibleTo?: PlatformRoleEnum[];
}

/**
 * Navigation items shown to platform staff (any active platform_role).
 * Displayed independently of org_members role.
 * Items with `visibleTo` are filtered in the sidebar.
 */
export const platformNavItems: NavItem[] = [
  { title: 'Контракты', path: '/platform/contracts', icon: FileText },
  { title: 'SLA правила', path: '/platform/sla', icon: Clock },
  { title: 'Маршрутизация', path: '/platform/dispatch', icon: Route },
  { title: 'Эскалации', path: '/platform/escalations', icon: Bell },
  { title: 'Очередь ЦОУ', path: '/platform/incidents', icon: AlertTriangle },
  { title: 'Роли платформы', path: '/platform/roles', icon: Shield, visibleTo: ['platform_super_admin', 'platform_admin'] },
  { title: 'UAT Проверка', path: '/platform/uat', icon: ClipboardCheck, visibleTo: ['platform_super_admin'] },
];
