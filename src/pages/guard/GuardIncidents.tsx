import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ChevronRight, AlertTriangle, X, Send, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import GuardMobileLayout from '@/components/guard/GuardMobileLayout';
import { guardIncidents, guardShift, type GuardIncident } from '@/data/guard-mock-data';
import { cn } from '@/lib/utils';

const typeLabels: Record<string, string> = { alarm: 'Тревога', violation: 'Нарушение', event: 'Событие' };
const severityLabels: Record<string, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический' };
const statusLabels: Record<string, string> = { created: 'Создан', accepted: 'Принят', in_progress: 'В работе', resolved: 'Решён', closed: 'Закрыт' };

const severityColors: Record<string, string> = {
  low: 'bg-muted-foreground',
  medium: 'bg-primary',
  high: 'bg-warning',
  critical: 'bg-destructive animate-status-pulse',
};

export default function GuardIncidents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<GuardIncident[]>(guardIncidents);
  const [showCreate, setShowCreate] = useState(searchParams.get('create') === 'true');
  const [selectedIncident, setSelectedIncident] = useState<GuardIncident | null>(null);

  // Create form state
  const [newType, setNewType] = useState<'alarm' | 'violation' | 'event'>('violation');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const inc: GuardIncident = {
      id: `INC-2026-${String(incidents.length + 50).padStart(4, '0')}`,
      type: newType,
      title: newTitle,
      description: newDesc,
      objectName: guardShift.objectName,
      severity: newSeverity,
      status: 'created',
      createdAt: new Date().toISOString(),
      assignedResponder: null,
      notes: [],
      hasPhoto: false,
      location: { lat: 55.749, lng: 37.537 },
    };
    setIncidents((prev) => [inc, ...prev]);
    setShowCreate(false);
    setNewTitle('');
    setNewDesc('');
    setNewType('violation');
    setNewSeverity('medium');
    searchParams.delete('create');
    setSearchParams(searchParams);
  };

  // Create form overlay
  if (showCreate) {
    return (
      <GuardMobileLayout title="Новый инцидент">
        <div className="space-y-4 animate-fade-in">
          <button onClick={() => { setShowCreate(false); searchParams.delete('create'); setSearchParams(searchParams); }} className="flex items-center gap-1 text-xs text-muted-foreground">
            <X className="h-3.5 w-3.5" /> Отмена
          </button>

          {/* Type */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Тип инцидента</p>
            <div className="flex gap-2">
              {(['alarm', 'violation', 'event'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={cn(
                    'flex-1 rounded-lg border py-2.5 text-xs font-medium transition-colors',
                    newType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
                  )}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Серьёзность</p>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setNewSeverity(s)}
                  className={cn(
                    'rounded-lg border py-2 text-[10px] font-medium transition-colors',
                    newSeverity === s ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
                  )}
                >
                  {severityLabels[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Краткое описание</p>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Что произошло?"
              className="bg-card"
            />
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Подробности</p>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Опишите ситуацию..."
              rows={3}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Object (auto) */}
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Объект</p>
            <p className="text-sm text-foreground">{guardShift.objectName}</p>
          </div>

          {/* Photo placeholder */}
          <button className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-card p-3 text-muted-foreground transition-colors hover:border-primary/30">
            <Camera className="h-5 w-5" />
            <span className="text-xs">Добавить фото (опционально)</span>
          </button>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            Отправить
          </button>
        </div>
      </GuardMobileLayout>
    );
  }

  // Incident detail
  if (selectedIncident) {
    return (
      <GuardMobileLayout title={selectedIncident.id}>
        <div className="space-y-4 animate-fade-in">
          <button onClick={() => setSelectedIncident(null)} className="flex items-center gap-1 text-xs text-muted-foreground">
            <X className="h-3.5 w-3.5" /> Назад
          </button>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant={selectedIncident.severity === 'critical' ? 'destructive' : selectedIncident.severity === 'high' ? 'warning' : 'secondary'}>
                {severityLabels[selectedIncident.severity]}
              </Badge>
              <Badge variant="secondary">{statusLabels[selectedIncident.status]}</Badge>
            </div>
            <h2 className="text-base font-bold text-foreground">{selectedIncident.title}</h2>
            <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{typeLabels[selectedIncident.type]}</span>
              <span>·</span>
              <span>{new Date(selectedIncident.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {selectedIncident.assignedResponder && (
              <p className="text-xs text-muted-foreground">Ответственный: <span className="text-foreground">{selectedIncident.assignedResponder}</span></p>
            )}
          </div>

          {selectedIncident.notes.length > 0 && (
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Заметки</p>
              </div>
              {selectedIncident.notes.map((note, i) => (
                <div key={i} className="px-4 py-2.5 border-b border-border last:border-0">
                  <p className="text-sm text-foreground">{note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </GuardMobileLayout>
    );
  }

  // List view
  return (
    <GuardMobileLayout title="Инциденты">
      <div className="space-y-4 animate-fade-in">
        {/* Create button */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <Plus className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Создать инцидент</span>
        </button>

        {/* Incident list */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Мои инциденты</p>
          </div>
          {incidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3 last:border-0 text-left transition-colors hover:bg-secondary/30"
            >
              <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', severityColors[inc.severity])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{inc.title}</p>
                <p className="text-xs text-muted-foreground">{inc.id} · {statusLabels[inc.status]} · {new Date(inc.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
          {incidents.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Инцидентов нет</div>
          )}
        </div>
      </div>
    </GuardMobileLayout>
  );
}
