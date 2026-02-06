import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { mockPatrols } from '@/data/mock-data';
import { Route, User, Clock, MapPin } from 'lucide-react';
import type { PatrolStatus } from '@/types/soms';

const statusLabels: Record<PatrolStatus, string> = {
  pending: 'Ожидание',
  in_progress: 'В процессе',
  completed: 'Завершён',
  overdue: 'Просрочен',
};

const statusVariant: Record<PatrolStatus, 'secondary' | 'default' | 'success' | 'destructive'> = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'success',
  overdue: 'destructive',
};

export default function Patrols() {
  return (
    <AppLayout title="Обходы">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockPatrols.map((patrol, i) => {
          const progress = Math.round((patrol.completedCheckpoints / patrol.checkpoints) * 100);

          return (
            <div
              key={patrol.id}
              className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    patrol.status === 'completed' ? 'bg-success/10' :
                    patrol.status === 'in_progress' ? 'bg-primary/10' :
                    patrol.status === 'overdue' ? 'bg-destructive/10' : 'bg-muted'
                  }`}>
                    <Route className={`h-5 w-5 ${
                      patrol.status === 'completed' ? 'text-success' :
                      patrol.status === 'in_progress' ? 'text-primary' :
                      patrol.status === 'overdue' ? 'text-destructive' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{patrol.routeName}</h3>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {patrol.objectName}
                    </div>
                  </div>
                </div>
                <Badge variant={statusVariant[patrol.status]} className="text-[10px] px-1.5 py-0">
                  {statusLabels[patrol.status]}
                </Badge>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3 w-3" />
                    {patrol.guardName}
                  </div>
                  <span className="font-mono font-medium text-foreground">
                    {patrol.completedCheckpoints}/{patrol.checkpoints} точек
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress === 100 ? 'bg-success' :
                      patrol.status === 'overdue' ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Плановое время: {patrol.plannedTime}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}