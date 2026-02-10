import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { clientIncidents } from '@/data/client-mock-data';
import type { ClientIncident } from '@/data/client-mock-data';

const statusLabels: Record<string, string> = {
  created: 'Создан', accepted: 'Принят', in_progress: 'В работе', resolved: 'Решён', closed: 'Закрыт',
};
const statusVariant: Record<string, 'default' | 'warning' | 'destructive' | 'success' | 'secondary'> = {
  created: 'default', accepted: 'warning', in_progress: 'destructive', resolved: 'success', closed: 'secondary',
};
const priorityLabels: Record<string, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический',
};

export default function ClientIncidents() {
  const [incidents, setIncidents] = useState(clientIncidents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const selected = incidents.find((i) => i.id === selectedId);

  const handleAcknowledge = (id: string) => {
    setIncidents((prev) =>
      prev.map((i) => i.id === id ? { ...i, acknowledged: true } : i)
    );
  };

  const handleAddComment = (id: string) => {
    if (!comment.trim()) return;
    setIncidents((prev) =>
      prev.map((i) => i.id === id ? { ...i, clientComment: comment } : i)
    );
    setComment('');
  };

  return (
    <AppLayout title="Инциденты">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-1 space-y-2">
          {incidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => setSelectedId(inc.id)}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                selectedId === inc.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{inc.id}</span>
                <Badge variant={statusVariant[inc.status]} className="text-[10px]">
                  {statusLabels[inc.status]}
                </Badge>
              </div>
              <p className="mt-1 text-sm font-medium text-foreground truncate">{inc.title}</p>
              <p className="text-xs text-muted-foreground">{inc.objectName}</p>
              <div className="mt-2 flex items-center gap-2">
                {inc.acknowledged && (
                  <Badge variant="success" className="text-[9px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Подтверждён
                  </Badge>
                )}
                {inc.responseTimeMin !== undefined && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {inc.responseTimeMin} мин
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">{selected.id}</span>
                    <Badge variant={statusVariant[selected.status]}>{statusLabels[selected.status]}</Badge>
                    <Badge variant={selected.priority === 'critical' ? 'destructive' : selected.priority === 'high' ? 'warning' : 'secondary'} className="text-[10px]">
                      {priorityLabels[selected.priority]}
                    </Badge>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">{selected.title}</h2>
                  <p className="text-sm text-muted-foreground">{selected.objectName}</p>
                </div>
                {!selected.acknowledged && (
                  <Button size="sm" onClick={() => handleAcknowledge(selected.id)} className="gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Подтвердить
                  </Button>
                )}
              </div>

              <p className="mt-4 text-sm text-foreground">{selected.description}</p>

              {/* Response time */}
              {selected.responseTimeMin !== undefined && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Время реагирования:</span>
                  <span className="font-mono text-sm font-bold text-foreground">{selected.responseTimeMin} мин</span>
                </div>
              )}

              {/* Timeline */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Хронология</h3>
                <div className="space-y-3">
                  {selected.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">{step.time}</span>
                        <p className="text-sm text-foreground">{step.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client comment */}
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" /> Комментарий заказчика
                </h3>
                {selected.clientComment ? (
                  <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground">{selected.clientComment}</p>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Добавить комментарий..."
                      className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                    <Button size="sm" onClick={() => handleAddComment(selected.id)}>Отправить</Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-card">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Выберите инцидент для просмотра</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
