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
    { title: 'Дашборд', path: '/', icon: LayoutDashboard },
    { title: 'Объекты', path: '/objects', icon: Building2 },
    { title: 'Персонал', path: '/personnel', icon: Users },
    { title: 'Инциденты', path: '/incidents', icon: AlertTriangle },
    { title: 'Смены', path: '/shifts', icon: Clock },
    { title: 'Обходы', path: '/patrols', icon: Route },
    { title: 'Аналитика', path: '/analytics', icon: BarChart3 },
  ],

  dispatcher: [
    { title: 'Оперативный', path: '/', icon: LayoutDashboard },
    { title: 'Инциденты', path: '/incidents', icon: AlertTriangle },
    { title: 'Объекты', path: '/objects', icon: Building2 },
    { title: 'Смены', path: '/shifts', icon: Clock },
    { title: 'Обходы', path: '/patrols', icon: Route },
    { title: 'Персонал', path: '/personnel', icon: Users },
  ],

  org_admin: [
    { title: 'Контроль', path: '/control', icon: Gauge },
    { title: 'Объекты', path: '/objects', icon: Building2 },
    { title: 'Персонал', path: '/personnel', icon: Users },
    { title: 'Смены', path: '/shifts', icon: Clock },
    { title: 'Обходы', path: '/patrols', icon: Route },
    { title: 'Отчёты', path: '/analytics', icon: BarChart3 },
  ],

  chief: [
    { title: 'Контроль', path: '/control', icon: Gauge },
    { title: 'Объекты', path: '/objects', icon: Building2 },
    { title: 'Персонал', path: '/personnel', icon: Users },
    { title: 'Смены', path: '/shifts', icon: Clock },
    { title: 'Обходы', path: '/patrols', icon: Route },
    { title: 'Отчёты', path: '/analytics', icon: BarChart3 },
  ],

  director: [
    { title: 'Стратегический', path: '/executive', icon: Briefcase },
    { title: 'Аналитика', path: '/analytics', icon: BarChart3 },
  ],

  guard: [
    { title: 'Главная', path: '/m/guard/home', icon: Shield },
    { title: 'Смена', path: '/m/guard/shift', icon: Clock },
    { title: 'Обход', path: '/m/guard/patrol', icon: MapPin },
    { title: 'Инциденты', path: '/m/guard/incidents', icon: AlertTriangle },
  ],

  client: [
    { title: 'Обзор', path: '/client', icon: LayoutDashboard },
    { title: 'Инциденты', path: '/client/incidents', icon: AlertTriangle },
    { title: 'SLA отчёты', path: '/client/reports', icon: FileText },
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
