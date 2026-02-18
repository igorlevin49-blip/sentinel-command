import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useOrgShifts, useOrgPosts, useOrgPersonnel, useOrgObjects } from '@/hooks/use-org-data';
import { useActiveOrg } from '@/contexts/ActiveOrgContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Loader2, Shield, AlertTriangle, X, Check } from 'lucide-react';

const statusLabels: Record<string, string> = {
  scheduled: 'Запланирована', active: 'Активна', completed: 'Завершена', missed: 'Пропущена',
};
const statusVariant: Record<string, any> = {
  scheduled: 'default', active: 'success', completed: 'secondary', missed: 'destructive',
};

interface ShiftForm {
  object_id: string;
  post_id: string;
  personnel_id: string;
  planned_start: string;
  planned_end: string;
  status: string;
}

const defaultForm: ShiftForm = {
  object_id: '', post_id: '', personnel_id: '',
  planned_start: '', planned_end: '', status: 'scheduled',
};

function formatDT(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ShiftsPage() {
  const qc = useQueryClient();
  const { orgId, canManage, canDispatch } = useActiveOrg();
  const [filters, setFilters] = useState<{ objectId?: string; personnelId?: string }>({});
  const { data: shifts, isLoading, error } = useOrgShifts({ objectId: filters.objectId, personnelId: filters.personnelId });
  const { data: objects } = useOrgObjects();
  const { data: allPersonnel } = useOrgPersonnel();
  const [selectedObject, setSelectedObject] = useState('');
  const { data: postsForObject } = useOrgPosts(selectedObject || undefined);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ShiftForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setForm({ ...defaultForm, object_id: selectedObject });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.post_id || !form.personnel_id || !form.planned_start || !form.planned_end || !orgId) return;
    setSaving(true);
    setFormError(null);
    const objectIdForShift = form.object_id ||
      (postsForObject?.find(p => p.id === form.post_id) as any)?.object_id || null;
    const { error: err } = await supabase.from('shifts').insert({
      org_id: orgId,
      post_id: form.post_id,
      object_id: objectIdForShift,
      personnel_id: form.personnel_id,
      planned_start: new Date(form.planned_start).toISOString(),
      planned_end: new Date(form.planned_end).toISOString(),
      status: form.status as any,
    });
    setSaving(false);
    if (err) setFormError(err.code === '42501' ? 'Нет доступа' : err.message);
    else {
      qc.invalidateQueries({ queryKey: ['org-shifts'] });
      setShowForm(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const { error: err } = await supabase.from('shifts').update({ status: status as any }).eq('id', id);
    if (err) alert(err.code === '42501' ? 'Нет доступа' : err.message);
    else qc.invalidateQueries({ queryKey: ['org-shifts'] });
  }

  return (
    <AppLayout title="Смены и графики">
      {/* Filters + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="h-9 rounded-md border border-border bg-muted px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            value={filters.objectId ?? ''}
            onChange={e => setFilters(f => ({ ...f, objectId: e.target.value || undefined }))}
          >
            <option value="">Все объекты</option>
            {(objects ?? []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select
            className="h-9 rounded-md border border-border bg-muted px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            value={filters.personnelId ?? ''}
            onChange={e => setFilters(f => ({ ...f, personnelId: e.target.value || undefined }))}
          >
            <option value="">Все охранники</option>
            {(allPersonnel ?? []).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>
        {(canManage || canDispatch) && (
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Создать смену
          </Button>
        )}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Новая смена</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Объект</label>
                <select
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.object_id}
                  onChange={e => {
                    setSelectedObject(e.target.value);
                    setForm(f => ({ ...f, object_id: e.target.value, post_id: '' }));
                  }}
                >
                  <option value="">— выберите объект —</option>
                  {(objects ?? []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Пост *</label>
                <select
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.post_id}
                  onChange={e => setForm(f => ({ ...f, post_id: e.target.value }))}
                  disabled={!form.object_id}
                >
                  <option value="">— выберите пост —</option>
                  {(postsForObject ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Охранник *</label>
                <select
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.personnel_id}
                  onChange={e => setForm(f => ({ ...f, personnel_id: e.target.value }))}
                >
                  <option value="">— выберите охранника —</option>
                  {(allPersonnel ?? []).filter(p => p.is_active).map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Начало *</label>
                  <input
                    type="datetime-local"
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                    value={form.planned_start}
                    onChange={e => setForm(f => ({ ...f, planned_start: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Конец *</label>
                  <input
                    type="datetime-local"
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                    value={form.planned_end}
                    onChange={e => setForm(f => ({ ...f, planned_end: e.target.value }))}
                  />
                </div>
              </div>
              {formError && <ErrorDisplay error={formError} />}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleSave} disabled={saving || !form.post_id || !form.personnel_id || !form.planned_start || !form.planned_end}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Создать
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : error ? (
        <ErrorDisplay error={error} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Охранник', 'Пост', 'Объект', 'Начало', 'Конец', 'Статус', 'Действия'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(shifts ?? []).map((shift, i) => {
                  const guardName = (shift.personnel as any)?.full_name ?? '—';
                  const postName = (shift.posts as any)?.name ?? '—';
                  const objectName = (shift.posts as any)?.objects?.name ?? '—';
                  const status = shift.status as string;
                  return (
                    <tr key={shift.id} className="hover:bg-muted/30 animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${status === 'active' ? 'bg-success/10' : 'bg-muted'}`}>
                            <Shield className={`h-3.5 w-3.5 ${status === 'active' ? 'text-success' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="text-sm font-medium">{guardName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{postName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{objectName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs">{formatDT(shift.planned_start)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{formatDT(shift.planned_end)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[status]} className="text-[10px]">
                          {statusLabels[status] ?? status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {(canManage || canDispatch) && status !== 'completed' && status !== 'missed' && (
                          <div className="flex items-center gap-1">
                            {status === 'scheduled' && (
                              <button onClick={() => updateStatus(shift.id, 'active')} className="text-xs text-primary hover:underline">Начать</button>
                            )}
                            {status === 'active' && (
                              <button onClick={() => updateStatus(shift.id, 'completed')} className="text-xs text-success hover:underline">Завершить</button>
                            )}
                            {status !== 'missed' && (
                              <button onClick={() => updateStatus(shift.id, 'missed')} className="text-xs text-destructive hover:underline ml-2">
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(shifts ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Смен не найдено</td>
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
