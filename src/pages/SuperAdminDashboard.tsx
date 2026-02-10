import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  AlertTriangle,
  BarChart3,
  Shield,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { useObjects, useIncidents } from '@/hooks/use-supabase-data';

const quickLinks = [
  { title: 'Организации', desc: 'Все организации платформы', icon: Building2, path: '/super-admin/orgs' },
  { title: 'Пользователи и роли', desc: 'Управление доступом', icon: Users, path: '/users' },
  { title: 'Инциденты', desc: 'Все инциденты платформы', icon: AlertTriangle, path: '/incidents' },
  { title: 'Аналитика', desc: 'Кросс-орг отчёты', icon: BarChart3, path: '/analytics' },
  { title: 'Аудит / Логи', desc: 'Журнал действий', icon: FileText, path: '/super-admin/audit' },
  { title: 'Объекты', desc: 'Все объекты', icon: Shield, path: '/objects' },
];

export default function SuperAdminDashboard() {
  const { data: objects } = useObjects();
  const { data: incidents } = useIncidents();

  const openIncidents = incidents?.filter(
    (i) => i.status !== 'closed' && i.status !== 'resolved'
  ) ?? [];

  return (
    <AppLayout title="Платформа S-OMS">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Объекты</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <span className="mt-3 block font-mono text-3xl font-bold text-foreground">{objects?.length ?? 0}</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Открытые инциденты</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <span className="mt-3 block font-mono text-3xl font-bold text-foreground">{openIncidents.length}</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Всего инцидентов</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <span className="mt-3 block font-mono text-3xl font-bold text-foreground">{incidents?.length ?? 0}</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Роль</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <span className="mt-3 block font-mono text-lg font-bold text-foreground">SUPER ADMIN</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Управление платформой</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-muted/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <link.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{link.title}</p>
                <p className="text-xs text-muted-foreground">{link.desc}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
        </div>
      </div>

      {/* Recent incidents */}
      {incidents && incidents.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold text-foreground">Последние инциденты (все орг.)</h2>
            </div>
            <Badge variant="outline" className="font-mono text-xs">{openIncidents.length} открытых</Badge>
          </div>
          <div className="divide-y divide-border">
            {incidents.slice(0, 8).map((incident) => (
              <div key={incident.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30">
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  incident.severity === 'critical' ? 'bg-destructive' :
                  incident.severity === 'high' ? 'bg-warning' : 'bg-muted-foreground'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{incident.title}</p>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{incident.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
