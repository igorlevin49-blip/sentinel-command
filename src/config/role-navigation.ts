import {
  LayoutDashboard,
  Building2,
  Users,
  AlertTriangle,
  Clock,
  Route,
  BarChart3,
  Gauge,
  FileText,
  Shield,
  MapPin,
  Briefcase,
  ShieldAlert,
  Settings,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types/soms';

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

/** Default landing route per role */
export const roleDefaultRoute: Record<UserRole, string> = {
  super_admin: '/ops',
  dispatcher: '/ops',
  org_admin: '/admin',
  chief: '/chief',
  director: '/exec',
  guard: '/m/guard/home',
  client: '/client',
};

/** Navigation menu per role */
export const roleNavItems: Record<UserRole, NavItem[]> = {
  super_admin: [
    { title: 'Дашборд', path: '/ops', icon: LayoutDashboard },
    { title: 'Объекты', path: '/objects', icon: Building2 },
    { title: 'Персонал', path: '/personnel', icon: Users },
    { title: 'Инциденты', path: '/incidents', icon: AlertTriangle },
    { title: 'Смены', path: '/shifts', icon: Clock },
    { title: 'Обходы', path: '/patrols', icon: Route },
    { title: 'Аналитика', path: '/analytics', icon: BarChart3 },
  ],

  dispatcher: [
    { title: 'Оперативный', path: '/ops', icon: LayoutDashboard },
    { title: 'Инциденты', path: '/incidents', icon: AlertTriangle },
    { title: 'Объекты', path: '/objects', icon: Building2 },
    { title: 'Смены', path: '/shifts', icon: Clock },
    { title: 'Обходы', path: '/patrols', icon: Route },
    { title: 'Персонал', path: '/personnel', icon: Users },
  ],

  // ORG_ADMIN = full system configurator
  org_admin: [
    { title: 'Дашборд', path: '/admin', icon: LayoutDashboard },
    { title: 'Объекты', path: '/objects', icon: Building2 },
    { title: 'Посты', path: '/posts', icon: Settings },
    { title: 'Маршруты', path: '/routes', icon: Route },
    { title: 'Персонал', path: '/personnel', icon: Users },
    { title: 'Смены', path: '/shifts', icon: Clock },
    { title: 'Инциденты', path: '/incidents', icon: AlertTriangle },
    { title: 'Отчёты', path: '/analytics', icon: BarChart3 },
    { title: 'Пользователи', path: '/users', icon: UserCog },
  ],

  // CHIEF = operations quality controller (read-only config, operational control)
  chief: [
    { title: 'Контроль', path: '/chief', icon: Gauge },
    { title: 'Нарушения', path: '/chief/violations', icon: ShieldAlert },
    { title: 'Смены', path: '/shifts', icon: Clock },
    { title: 'Обходы', path: '/patrols', icon: Route },
    { title: 'Инциденты', path: '/incidents', icon: AlertTriangle },
    { title: 'Отчёты', path: '/analytics', icon: BarChart3 },
  ],

  director: [
    { title: 'Стратегический', path: '/exec', icon: Briefcase },
    { title: 'Аналитика', path: '/analytics', icon: BarChart3 },
  ],

  guard: [
    { title: 'Главная', path: '/m/guard/home', icon: Shield },
    { title: 'Смена', path: '/m/guard/shift', icon: Clock },
    { title: 'Обход', path: '/m/guard/patrol', icon: MapPin },
    { title: 'Инциденты', path: '/m/guard/incidents', icon: AlertTriangle },
  ],

  client: [
    { title: 'Мои объекты', path: '/client', icon: Building2 },
    { title: 'Приёмка', path: '/client/acceptance', icon: FileText },
    { title: 'Нарушения', path: '/client/violations', icon: ShieldAlert },
    { title: 'Инциденты', path: '/client/incidents', icon: AlertTriangle },
    { title: 'SLA и отчёты', path: '/client/reports', icon: BarChart3 },
  ],
};

/** Role display labels */
export const roleLabels: Record<UserRole, string> = {
  super_admin: 'QOR Админ',
  org_admin: 'Администратор',
  dispatcher: 'Диспетчер',
  chief: 'Нач. охраны',
  director: 'Директор',
  guard: 'Охранник',
  client: 'Заказчик',
};
