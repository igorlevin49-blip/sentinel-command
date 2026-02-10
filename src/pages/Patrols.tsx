import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { usePatrolRuns } from '@/hooks/use-supabase-data';
import { Route, User, Clock, MapPin, Loader2 } from 'lucide-react';

type PatrolStatusType = 'pending' | 'in_progress' | 'completed' | 'overdue';

const statusLabels: Record<PatrolStatusType, string> = {
  pending: 'Ожидание', in_progress: 'В процессе', completed: 'Завершён', overdue: 'Просрочен',
};
const statusVariant: Record<PatrolStatusType, 'secondary' | 'default' | 'success' | 'destructive'> = {
  pending: 'secondary', in_progress: 'default', completed: 'success', overdue: 'destructive',
};

export default function Patrols() {
  const { data: runs, isLoading } = usePatrolRuns();

  return (
    <AppLayout title="Обходы">
      {isLoading ? (
        <div className="mt-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(runs ?? []).map((run, i) => {
            const route = run.patrol_routes as any;
            const routeName = route?.name ?? '—';
            const objectName = route?.objects?.name ?? '—';
            const totalCheckpoints = (route?.patrol_checkpoints as any[])?.length ?? 0;
            const completedCheckpoints = (run.patrol_events as any[])?.length ?? 0;
            const guardName = (run.shifts as any)?.personnel?.full_name ?? '—';
            const status = run.status as PatrolStatusType;
            const progress = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;

            return (
              <div
                key={run.id}
                className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      status === 'completed' ? 'bg-success/10' :
                      status === 'in_progress' ? 'bg-primary/10' :
                      status === 'overdue' ? 'bg-destructive/10' : 'bg-muted'
                    }`}>
                      <Route className={`h-5 w-5 ${
                        status === 'completed' ? 'text-success' :
                        status === 'in_progress' ? 'text-primary' :
                        status === 'overdue' ? 'text-destructive' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{routeName}</h3>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {objectName}
                      </div>
                    </div>
                  </div>
                  <Badge variant={statusVariant[status]} className="text-[10px] px-1.5 py-0">
                    {statusLabels[status]}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-3 w-3" />
                      {guardName}
                    </div>
                    <span className="font-mono font-medium text-foreground">
                      {completedCheckpoints}/{totalCheckpoints} точек
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress === 100 ? 'bg-success' :
                        status === 'overdue' ? 'bg-destructive' : 'bg-primary'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {run.started_at && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Начат: {new Date(run.started_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {(runs ?? []).length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
              Обходов не найдено
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
