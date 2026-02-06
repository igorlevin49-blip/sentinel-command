import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { mockShifts } from '@/data/mock-data';
import { Clock, Shield, AlertTriangle } from 'lucide-react';
import type { ShiftStatus } from '@/types/soms';

const statusLabels: Record<ShiftStatus, string> = {
  scheduled: 'Запланирована',
  active: 'Активна',
  completed: 'Завершена',
  missed: 'Пропущена',
};

const statusVariant: Record<ShiftStatus, 'default' | 'success' | 'secondary' | 'destructive'> = {
  scheduled: 'default',
  active: 'success',
  completed: 'secondary',
  missed: 'destructive',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function Shifts() {
  return (
    <AppLayout title="Смены и графики">
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
              {mockShifts.map((shift, i) => (
                <tr
                  key={shift.id}
                  className="transition-colors hover:bg-muted/30 animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        shift.status === 'active' ? 'bg-success/10' : 'bg-muted'
                      }`}>
                        <Shield className={`h-3.5 w-3.5 ${shift.status === 'active' ? 'text-success' : 'text-muted-foreground'}`} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{shift.guardName}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">
                    {shift.postName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm text-muted-foreground">
                    {shift.objectName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-foreground">
                        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <Badge variant={statusVariant[shift.status]} className="text-[10px] px-1.5 py-0">
                      {statusLabels[shift.status]}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}