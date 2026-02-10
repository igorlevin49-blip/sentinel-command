import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { useShifts } from '@/hooks/use-supabase-data';
import { Clock, Shield, AlertTriangle, Loader2 } from 'lucide-react';

type ShiftStatusType = 'scheduled' | 'active' | 'completed' | 'missed';

const statusLabels: Record<ShiftStatusType, string> = {
  scheduled: 'Запланирована', active: 'Активна', completed: 'Завершена', missed: 'Пропущена',
};
const statusVariant: Record<ShiftStatusType, 'default' | 'success' | 'secondary' | 'destructive'> = {
  scheduled: 'default', active: 'success', completed: 'secondary', missed: 'destructive',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function Shifts() {
  const { data: shifts, isLoading } = useShifts();

  return (
    <AppLayout title="Смены и графики">
      {isLoading ? (
        <div className="mt-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Охранник</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Пост</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Объект</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Время</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Статус</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Нарушения</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(shifts ?? []).map((shift, i) => {
                  const guardName = (shift.personnel as any)?.full_name ?? '—';
                  const postName = (shift.posts as any)?.name ?? '—';
                  const objectName = (shift.posts as any)?.objects?.name ?? '—';
                  const status = shift.status as ShiftStatusType;

                  return (
                    <tr
                      key={shift.id}
                      className="transition-colors hover:bg-muted/30 animate-fade-in"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            status === 'active' ? 'bg-success/10' : 'bg-muted'
                          }`}>
                            <Shield className={`h-3.5 w-3.5 ${status === 'active' ? 'text-success' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="text-sm font-medium text-foreground">{guardName}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{postName}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">{objectName}</td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-foreground">
                            {formatTime(shift.planned_start)} – {formatTime(shift.planned_end)}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <Badge variant={statusVariant[status]} className="text-[10px] px-1.5 py-0">
                          {statusLabels[status]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {shift.violations > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                            <span className="font-mono text-sm font-medium text-warning">{shift.violations}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(shifts ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Смен не найдено</td>
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
