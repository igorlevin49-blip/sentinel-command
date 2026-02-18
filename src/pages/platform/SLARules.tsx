import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, Plus, Pencil, X, Check } from 'lucide-react';

interface SLARule {
  id: string;
  org_id: string;
  name: string;
  incident_type: string | null;
  severity: string | null;
  response_time_s: number;
  resolve_time_s: number;
  is_active: boolean;
  created_at: string;
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s}с`;
  if (s < 3600) return `${Math.round(s / 60)}мин`;
  return `${Math.round(s / 3600)}ч`;
}

interface FormState {
  name: string;
  org_id: string;
  incident_type: string;
  severity: string;
  response_time_s: string;
  resolve_time_s: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  name: '',
  org_id: '',
  incident_type: '',
  severity: '',
  response_time_s: '900',
  resolve_time_s: '3600',
  is_active: true,
};

const INCIDENT_TYPES = ['', 'alarm', 'violation', 'event', 'fraud'];
const SEVERITIES = ['', 'low', 'medium', 'high', 'critical'];

export default function SLARules() {
  const [rules, setRules] = useState<SLARule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sla_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.code === '42501' ? 'Нет доступа к SLA правилам' : error.message);
    } else {
      setRules((data as SLARule[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  function startEdit(r: SLARule) {
    setEditId(r.id);
    setForm({
      name: r.name,
      org_id: r.org_id,
      incident_type: r.incident_type ?? '',
      severity: r.severity ?? '',
      response_time_s: String(r.response_time_s),
      resolve_time_s: String(r.resolve_time_s),
      is_active: r.is_active,
    });
    setShowForm(false);
    setSaveError(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    setSaveError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    if (!form.name.trim()) { setSaveError('Название обязательно'); setSaving(false); return; }
    const resp = parseInt(form.response_time_s);
    const resolve = parseInt(form.resolve_time_s);
    if (isNaN(resp) || isNaN(resolve)) { setSaveError('Неверное время (сек)'); setSaving(false); return; }

    const payload = {
      name: form.name.trim(),
      incident_type: form.incident_type || null,
      severity: form.severity || null,
      response_time_s: resp,
      resolve_time_s: resolve,
      is_active: form.is_active,
    };

    let err;
    if (editId) {
      ({ error: err } = await supabase.from('sla_rules').update(payload).eq('id', editId));
    } else {
      if (!form.org_id.trim()) { setSaveError('org_id обязателен'); setSaving(false); return; }
      ({ error: err } = await supabase.from('sla_rules').insert({ ...payload, org_id: form.org_id.trim() }));
    }

    if (err) {
      setSaveError(err.code === '42501' ? 'Нет прав для сохранения' : err.message);
    } else {
      cancelForm();
      fetchRules();
    }
    setSaving(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('sla_rules').update({ is_active: !current }).eq('id', id);
    fetchRules();
  }

  const showingForm = showForm || editId !== null;

  return (
    <AppLayout title="SLA Правила">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Правила уровня сервиса (SLA)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Таймеры реакции и закрытия инцидентов по типу и приоритету.</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); setSaveError(null); }}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить SLA
          </button>
        </div>

        {showingForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{editId ? 'Редактировать SLA правило' : 'Новое SLA правило'}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Название *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Быстрая реакция на тревогу" />
              </div>
              {!editId && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">org_id *</label>
                  <Input value={form.org_id} onChange={(e) => setForm({ ...form, org_id: e.target.value })} placeholder="UUID организации" className="font-mono text-xs" />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Тип инцидента</label>
                <select
                  value={form.incident_type}
                  onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t || 'Все типы'}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Приоритет (severity)</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s || 'Все приоритеты'}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Время реакции (сек) *</label>
                <Input type="number" min="1" value={form.response_time_s} onChange={(e) => setForm({ ...form, response_time_s: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Время закрытия (сек) *</label>
                <Input type="number" min="1" value={form.resolve_time_s} onChange={(e) => setForm({ ...form, resolve_time_s: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sla_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="sla_active" className="text-sm text-foreground">Активно</label>
              </div>
            </div>
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
              <button type="button" onClick={cancelForm} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Отмена
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">SLA правила не настроены</p>
            <p className="text-sm text-muted-foreground mt-1">Добавьте первое правило чтобы настроить SLA.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Тип</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Приоритет</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Реакция</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Закрытие</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{r.incident_type ?? 'Все'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{r.severity ?? 'Все'}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-medium text-warning">{formatSeconds(r.response_time_s)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-medium text-muted-foreground">{formatSeconds(r.resolve_time_s)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={r.is_active ? 'success' : 'secondary'}>
                        {r.is_active ? 'Активно' : 'Откл.'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(r)} className="text-muted-foreground hover:text-foreground transition-colors" title="Редактировать">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => toggleActive(r.id, r.is_active)} className="text-muted-foreground hover:text-foreground transition-colors" title="Переключить">
                          {r.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
