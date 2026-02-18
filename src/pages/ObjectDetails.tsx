import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useOrgObject, useOrgPosts, useOrgShifts, useOrgIncidents } from '@/hooks/use-org-data';
import { useActiveOrg } from '@/contexts/ActiveOrgContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2, MapPin, ChevronLeft, Loader2,
  Shield, Clock, AlertTriangle, Plus, Pencil, X, Check, Trash2
} from 'lucide-react';

type Tab = 'overview' | 'posts' | 'shifts' | 'incidents';

// ──────────────────────────────────────────────
// Posts Tab
// ──────────────────────────────────────────────
function PostsTab({ objectId }: { objectId: string }) {
  const qc = useQueryClient();
  const { orgId, canManage } = useActiveOrg();
  const { data: posts, isLoading, error } = useOrgPosts(objectId);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', type: 'static', is_active: true });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setEditId(null);
    setForm({ name: '', description: '', type: 'static', is_active: true });
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(p: any) {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description ?? '', type: p.type ?? 'static', is_active: p.is_active });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !orgId) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: form.type as any,
      is_active: form.is_active,
      object_id: objectId,
      org_id: orgId,
    };
    let err;
    if (editId) {
      ({ error: err } = await supabase.from('posts').update(payload).eq('id', editId));
    } else {
      ({ error: err } = await supabase.from('posts').insert(payload));
    }
    setSaving(false);
    if (err) setFormError(err.code === '42501' ? 'Нет доступа' : err.message);
    else {
      qc.invalidateQueries({ queryKey: ['org-posts', orgId, objectId] });
      setShowForm(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить пост?')) return;
    const { error: err } = await supabase.from('posts').delete().eq('id', id);
    if (err) alert(err.code === '42501' ? 'Нет доступа' : err.message);
    else qc.invalidateQueries({ queryKey: ['org-posts', orgId, objectId] });
  }

  const typeLabels: Record<string, string> = {
    static: 'Стационарный', checkpoint: 'КПП', mobile: 'Мобильный', kpp: 'КПП',
  };

  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (error) return <ErrorDisplay error={error} className="mt-4" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Посты ({posts?.length ?? 0})</h3>
        {canManage && <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Добавить пост</Button>}
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{editId ? 'Редактировать пост' : 'Новый пост'}</span>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <input
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            placeholder="Название поста *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            placeholder="Описание (необязательно)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex gap-3">
            <select
              className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4" />
              Активен
            </label>
          </div>
          {formError && <ErrorDisplay error={formError} />}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {editId ? 'Сохранить' : 'Создать'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </div>
      )}

      {(posts ?? []).length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Постов нет</div>
      ) : (
        <div className="space-y-2">
          {(posts ?? []).map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <Shield className={`h-4 w-4 ${p.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{typeLabels[p.type] ?? p.type}</Badge>
                <Badge variant={p.is_active ? 'success' : 'secondary'} className="text-[10px]">{p.is_active ? 'Активен' : 'Неактивен'}</Badge>
                {canManage && (
                  <>
                    <button onClick={() => openEdit(p)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Shifts Tab
// ──────────────────────────────────────────────
function ShiftsTab({ objectId }: { objectId: string }) {
  const { data: shifts, isLoading, error } = useOrgShifts({ objectId });

  const statusLabels: Record<string, string> = {
    scheduled: 'Запланирована', active: 'Активна', completed: 'Завершена', missed: 'Пропущена',
  };
  const statusVariant: Record<string, any> = {
    scheduled: 'default', active: 'success', completed: 'secondary', missed: 'destructive',
  };

  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (error) return <ErrorDisplay error={error} className="mt-4" />;

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Смены ({shifts?.length ?? 0})</h3>
      {(shifts ?? []).length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Смен нет</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Охранник</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Пост</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Начало</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Конец</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(shifts ?? []).map(s => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{(s.personnel as any)?.full_name ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{(s.posts as any)?.name ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{new Date(s.planned_start).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-3 py-2 font-mono text-xs">{new Date(s.planned_end).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-3 py-2">
                    <Badge variant={statusVariant[s.status] ?? 'default'} className="text-[10px]">
                      {statusLabels[s.status] ?? s.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Incidents Tab
// ──────────────────────────────────────────────
function IncidentsTab({ objectId }: { objectId: string }) {
  const { data: incidents, isLoading, error } = useOrgIncidents({ objectId });

  const sevVariant: Record<string, any> = {
    low: 'success', medium: 'warning', high: 'destructive', critical: 'destructive',
  };
  const sevLabels: Record<string, string> = {
    low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический',
  };

  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (error) return <ErrorDisplay error={error} className="mt-4" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Инциденты ({incidents?.length ?? 0})</h3>
        <Link to={`/incidents?objectId=${objectId}`} className="text-xs text-primary hover:underline">Все инциденты →</Link>
      </div>
      {(incidents ?? []).length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Инцидентов нет</div>
      ) : (
        <div className="space-y-2">
          {(incidents ?? []).slice(0, 10).map(inc => (
            <Link
              key={inc.id}
              to={`/incidents/${inc.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-4 w-4 ${inc.severity === 'high' || inc.severity === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                <div>
                  <p className="text-sm font-medium">{inc.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(inc.created_at).toLocaleString('ru-RU')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={sevVariant[inc.severity]} className="text-[10px]">{sevLabels[inc.severity]}</Badge>
                <Badge variant="outline" className="text-[10px]">{inc.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main ObjectDetails page
// ──────────────────────────────────────────────
export default function ObjectDetails() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('overview');
  const { data: obj, isLoading, error } = useOrgObject(id);

  const riskLabels: Record<string, string> = {
    low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический',
  };
  const riskVariant: Record<string, any> = {
    low: 'success', medium: 'warning', high: 'destructive', critical: 'destructive',
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Обзор', icon: Building2 },
    { key: 'posts', label: 'Посты', icon: Shield },
    { key: 'shifts', label: 'Смены', icon: Clock },
    { key: 'incidents', label: 'Инциденты', icon: AlertTriangle },
  ];

  return (
    <AppLayout title={obj?.name ?? 'Объект'}>
      <div className="mb-4">
        <Link to="/objects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Все объекты
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <ErrorDisplay error={error} />
      ) : !obj ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Объект не найден</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${obj.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Building2 className={`h-6 w-6 ${obj.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{obj.name}</h1>
                  {obj.address && (
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {obj.address}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={riskVariant[obj.risk_level]} className="text-xs">
                  {riskLabels[obj.risk_level]}
                </Badge>
                <Badge variant={obj.is_active ? 'success' : 'secondary'} className="text-xs">
                  {obj.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex border-b border-border">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    tab === t.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-6">
              {tab === 'overview' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Название</p>
                      <p className="text-sm font-medium">{obj.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Адрес</p>
                      <p className="text-sm font-medium">{obj.address ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Уровень риска</p>
                      <Badge variant={riskVariant[obj.risk_level]}>{riskLabels[obj.risk_level]}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Статус</p>
                      <Badge variant={obj.is_active ? 'success' : 'secondary'}>
                        {obj.is_active ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Создан</p>
                      <p className="text-sm font-mono">{new Date(obj.created_at).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                </div>
              )}
              {tab === 'posts' && id && <PostsTab objectId={id} />}
              {tab === 'shifts' && id && <ShiftsTab objectId={id} />}
              {tab === 'incidents' && id && <IncidentsTab objectId={id} />}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
