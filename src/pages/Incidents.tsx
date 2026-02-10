import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { useIncidents } from '@/hooks/use-supabase-data';
import { AlertTriangle, Search, Clock, User, Loader2 } from 'lucide-react';

type IncidentStatusType = 'created' | 'accepted' | 'in_progress' | 'resolved' | 'closed';
type IncidentTypeType = 'alarm' | 'violation' | 'event' | 'fraud';

const statusLabels: Record<IncidentStatusType, string> = {
  created: 'Создан', accepted: 'Принят', in_progress: 'В работе', resolved: 'Решён', closed: 'Закрыт',
};
const statusVariant: Record<IncidentStatusType, 'default' | 'warning' | 'destructive' | 'success' | 'secondary'> = {
  created: 'default', accepted: 'warning', in_progress: 'destructive', resolved: 'success', closed: 'secondary',
};
const typeLabels: Record<IncidentTypeType, string> = {
  alarm: 'Тревога', violation: 'Нарушение', event: 'Событие', fraud: 'Мошенничество',
};
const typeIcons: Record<IncidentTypeType, string> = {
  alarm: '🔴', violation: '🟡', event: '🔵', fraud: '🟠',
};
const priorityLabels: Record<string, string> = {
  critical: 'Критический', high: 'Высокий', medium: 'Средний', low: 'Низкий',
};
const priorityVariant: Record<string, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  critical: 'destructive', high: 'warning', medium: 'default', low: 'secondary',
};

export default function Incidents() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatusType | 'all'>('all');
  const { data: incidents, isLoading } = useIncidents();

  const filtered = (incidents ?? []).filter((inc) => {
    const objectName = (inc.objects as any)?.name ?? '';
    const matchesSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.id.toLowerCase().includes(search.toLowerCase()) ||
      objectName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions: { value: IncidentStatusType | 'all'; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'created', label: 'Созданные' },
    { value: 'accepted', label: 'Принятые' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'resolved', label: 'Решённые' },
    { value: 'closed', label: 'Закрытые' },
  ];

  return (
    <AppLayout title="Инциденты">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск по инцидентам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-72 rounded-md border border-border bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Тип</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Описание</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Объект</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Приоритет</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Статус</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Время</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Назначен</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((incident, i) => {
                  const objectName = (incident.objects as any)?.name ?? '—';
                  return (
                    <tr
                      key={incident.id}
                      className="transition-colors hover:bg-muted/30 animate-fade-in"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className="font-mono text-xs font-medium text-foreground">{incident.id.slice(0, 8)}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className="text-sm">
                          {typeIcons[incident.type as IncidentTypeType]} {typeLabels[incident.type as IncidentTypeType]}
                        </span>
                      </td>
                      <td className="max-w-xs px-5 py-3.5">
                        <p className="text-sm font-medium text-foreground truncate">{incident.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{incident.description}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">
                        {objectName}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <Badge variant={priorityVariant[incident.severity] ?? 'secondary'} className="text-[10px] px-1.5 py-0">
                          {priorityLabels[incident.severity] ?? incident.severity}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <Badge variant={statusVariant[incident.status as IncidentStatusType]} className="text-[10px] px-1.5 py-0">
                          {statusLabels[incident.status as IncidentStatusType]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="font-mono">
                            {new Date(incident.created_at).toLocaleString('ru-RU', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {incident.assigned_to ? (
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {incident.assigned_to}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Инцидентов не найдено</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
