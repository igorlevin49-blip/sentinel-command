import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useOrgIncidents, useOrgObjects, useOrgPersonnel } from '@/hooks/use-org-data';
import { useActiveOrg } from '@/contexts/ActiveOrgContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertTriangle, Plus, Loader2, Search, Filter, X, Check, ChevronRight
} from 'lucide-react';

const sevLabels: Record<string, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический',
};
const sevVariant: Record<string, any> = {
  low: 'success', medium: 'warning', high: 'destructive', critical: 'destructive',
};
const statusLabels: Record<string, string> = {
  created: 'Создан', accepted: 'Принят', in_progress: 'В работе', resolved: 'Решён', closed: 'Закрыт',
};
const typeLabels: Record<string, string> = {
  alarm: 'Тревога', violation: 'Нарушение', event: 'Событие', fraud: 'Мошенничество',
};

interface IncidentForm {
  object_id: string;
  title: string;
  description: string;
  severity: string;
  type: string;
}

const defaultForm: IncidentForm = {
  object_id: '', title: '', description: '', severity: 'medium', type: 'alarm',
};

export default function IncidentsListPage() {
  const qc = useQueryClient();
  const { orgId, canDispatch } = useActiveOrg();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    objectId: searchParams.get('objectId') ?? '',
    status: '',
    severity: '',
    type: '',
  });
  const [search, setSearch] = useState('');
  const { data: incidents, isLoading, error } = useOrgIncidents({
    objectId: filters.objectId || undefined,
    status: filters.status || undefined,
    severity: filters.severity || undefined,
    type: filters.type || undefined,
  });
  const { data: objects } = useOrgObjects();
  const [selectedObj, setSelectedObj] = useState('');
  const { data: posts } = useOrgPosts(selectedObj || undefined);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<IncidentForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = (incidents ?? []).filter(inc =>
    inc.title.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!form.object_id || !form.title.trim() || !orgId || !user) return;
    setSaving(true);
    setFormError(null);
    const { data: inc, error: err } = await supabase.from('incidents').insert({
      org_id: orgId,
      object_id: form.object_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      severity: form.severity as any,
      type: form.type as any,
      status: 'created' as any,
      created_by_user: user.id,
    }).select('id').single();
    if (err) {
      setSaving(false);
      setFormError(err.code === '42501' ? 'Нет доступа' : err.message);
      return;
    }
    // Log creation event
    if (inc) {
      await supabase.from('incident_events').insert({
        incident_id: inc.id,
        org_id: orgId,
        actor_user_id: user.id,
        event_type: 'created',
        payload_json: { title: form.title, severity: form.severity, type: form.type },
      });
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ['org-incidents'] });
    setShowForm(false);
    setForm(defaultForm);
  }

  return (
    <AppLayout title="Инциденты">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-52 rounded-md border border-border bg-muted pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="h-9 rounded-md border border-border bg-muted px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              value={filters.objectId}
              onChange={e => setFilters(f => ({ ...f, objectId: e.target.value }))}
            >
              <option value="">Все объекты</option>
              {(objects ?? []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select
              className="h-9 rounded-md border border-border bg-muted px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">Все статусы</option>
              {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select
              className="h-9 rounded-md border border-border bg-muted px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              value={filters.severity}
              onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
            >
              <option value="">Все приоритеты</option>
              {Object.entries(sevLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {canDispatch && (
            <Button size="sm" onClick={() => { setForm(defaultForm); setShowForm(true); }} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Создать инцидент
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Найдено: <span className="font-mono font-semibold text-foreground">{filtered.length}</span>
        </div>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Новый инцидент</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Объект *</label>
                <select
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.object_id}
                  onChange={e => { setSelectedObj(e.target.value); setForm(f => ({ ...f, object_id: e.target.value, post_id: '' })); }}
                >
                  <option value="">— выберите объект —</option>
                  {(objects ?? []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              {/* Post selector removed — incidents table has no post_id FK */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Тип</label>
                  <select
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Приоритет</label>
                  <select
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  >
                    {Object.entries(sevLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Заголовок *</label>
                <input
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Кратко опишите инцидент"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Подробности..."
                />
              </div>
              {formError && <ErrorDisplay error={formError} />}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleCreate} disabled={saving || !form.object_id || !form.title.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Создать
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : error ? (
        <ErrorDisplay error={error} />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Инцидентов не найдено</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Инцидент', 'Объект', 'Приоритет', 'Тип', 'Статус', 'Назначен', 'Создан', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((inc, i) => (
                  <tr key={inc.id} className="hover:bg-muted/30 animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 shrink-0 ${inc.severity === 'high' || inc.severity === 'critical' ? 'text-destructive' : inc.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium text-foreground max-w-[180px] truncate">{inc.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{(inc.objects as any)?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={sevVariant[inc.severity]} className="text-[10px]">{sevLabels[inc.severity]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{typeLabels[inc.type] ?? inc.type}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">{statusLabels[inc.status] ?? inc.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {(inc as any).personnel?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {new Date(inc.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors inline-flex"
                        title="Открыть"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
