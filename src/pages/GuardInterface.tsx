import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Square,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { guardShiftData } from '@/data/executive-mock-data';
import { cn } from '@/lib/utils';

type GuardTab = 'shift' | 'patrol' | 'incidents';

export default function GuardInterface() {
  const [activeTab, setActiveTab] = useState<GuardTab>('shift');
  const data = guardShiftData;
  const completedCount = data.currentPatrol.checkpoints.filter((cp) => cp.completed).length;
  const totalCount = data.currentPatrol.checkpoints.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const shiftStart = new Date(data.shiftStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const shiftEnd = new Date(data.shiftEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const now = new Date();
  const start = new Date(data.shiftStart);
  const end = new Date(data.shiftEnd);
  const shiftProgress = Math.min(100, Math.max(0, Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)));

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground">S-OMS</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{data.guardName}</p>
            <p className="text-[11px] text-muted-foreground">{data.postName}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-24">
        {activeTab === 'shift' && (
          <div className="space-y-4 animate-fade-in">
            {/* Shift card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Текущая смена</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{data.objectName}</p>
                </div>
                <Badge variant="success" className="text-xs">На смене</Badge>
              </div>

              <div className="mt-4 flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-foreground">{shiftStart} – {shiftEnd}</span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Прогресс смены</span>
                  <span className="font-mono text-foreground">{shiftProgress}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${shiftProgress}%` }} />
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <span className="text-xs font-medium text-foreground">Создать инцидент</span>
              </button>
              <button className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">Начать обход</span>
              </button>
            </div>

            {/* Recent incidents */}
            {data.recentIncidents.length > 0 && (
              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Недавние инциденты</p>
                </div>
                {data.recentIncidents.map((inc) => (
                  <div key={inc.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-warning" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{inc.title}</p>
                      <p className="text-xs text-muted-foreground">{inc.time}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'patrol' && (
          <div className="space-y-4 animate-fade-in">
            {/* Patrol header */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Текущий обход</p>
                  <p className="mt-1 text-base font-bold text-foreground">{data.currentPatrol.routeName}</p>
                </div>
                <span className="font-mono text-sm font-medium text-foreground">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Checkpoints */}
            <div className="space-y-2">
              {data.currentPatrol.checkpoints.map((cp, i) => (
                <div
                  key={cp.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-4 transition-all',
                    cp.completed
                      ? 'border-success/30 bg-success/5'
                      : 'border-border bg-card'
                  )}
                >
                  {cp.completed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      'text-sm font-medium',
                      cp.completed ? 'text-success' : 'text-foreground'
                    )}>
                      {cp.name}
                    </p>
                    {cp.time && (
                      <p className="text-xs text-muted-foreground">Отмечено: {cp.time}</p>
                    )}
                  </div>
                  {!cp.completed && i === completedCount && (
                    <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                      Отметить
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-4 animate-fade-in">
            {/* Create incident button */}
            <button className="flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4 transition-colors hover:bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Создать инцидент</span>
            </button>

            {/* Recent incidents */}
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Мои инциденты</p>
              </div>
              {data.recentIncidents.map((inc) => (
                <div key={inc.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                  <div className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    (inc.priority as string) === 'critical' ? 'bg-destructive animate-status-pulse' :
                    (inc.priority as string) === 'high' ? 'bg-warning' : 'bg-muted-foreground'
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{inc.title}</p>
                    <p className="text-xs text-muted-foreground">{inc.id} · {inc.time}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
              {data.recentIncidents.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Инцидентов нет
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation - mobile style */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-around py-2">
          {([
            { key: 'shift' as const, label: 'Смена', icon: Shield },
            { key: 'patrol' as const, label: 'Обход', icon: MapPin },
            { key: 'incidents' as const, label: 'Инциденты', icon: AlertTriangle },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-1.5 transition-colors',
                activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
