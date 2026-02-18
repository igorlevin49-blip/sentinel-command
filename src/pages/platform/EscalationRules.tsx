import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bell, Plus, Pencil, X, Check } from 'lucide-react';

type EscalationAction = 'notify' | 'reassign' | 'page' | 'close';

interface EscalationRule {
  id: string;
  org_id: string;
  name: string;
  trigger_after_s: number;
  action: EscalationAction;
  target_role: string | null;
  is_active: boolean;
  created_at: string;
}

const actionLabels: Record<EscalationAction, string> = {
  notify: 'Уведомить',
  reassign: 'Переназначить',
  page: 'Экстренный вызов',
  close: 'Закрыть',
};

const actionVariants: Record<EscalationAction, 'outline' | 'warning' | 'destructive' | 'secondary'> = {
  notify: 'outline',
  reassign: 'warning',
  page: 'destructive',
  close: 'secondary',
};

const ACTION_OPTIONS: EscalationAction[] = ['notify', 'reassign', 'page', 'close'];

function formatSeconds(s: number): string {
  if (s < 60) return `${s}с`;
  if (s < 3600) return `${Math.round(s / 60)}мин`;
  return `${Math.round(s / 3600)}ч`;
}

interface FormState {
  name: string;
  org_id: string;
  trigger_after_s: string;
  action: EscalationAction;
  target_role: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  name: '',
  org_id: '',
  trigger_after_s: '600',
  action: 'notify',
  target_role: '',
  is_active: true,
};

export default function EscalationRules() {
  const [rules, setRules] = useState<EscalationRule[]>([]);
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
      .from('escalation_rules')
      .select('*')
      .order('trigger_after_s', { ascending: true });

    if (error) {
      setError(error.code === '42501' ? 'Нет доступа к правилам эскалации' : error.message);
    } else {
      setRules((data as EscalationRule[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  function startEdit(r: EscalationRule) {
    setEditId(r.id);
    setForm({
      name: r.name,
      org_id: r.org_id,
      trigger_after_s: String(r.trigger_after_s),
      action: r.action,
      target_role: r.target_role ?? '',
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
    const triggerSec = parseInt(form.trigger_after_s);
    if (isNaN(triggerSec) || triggerSec < 1) { setSaveError('Введите корректное время (сек)'); setSaving(false); return; }

    const payload = {
      name: form.name.trim(),
      trigger_after_s: triggerSec,
      action: form.action,
      target_role: form.target_role.trim() || null,
      is_active: form.is_active,
    };

    let err;
    if (editId) {
      ({ error: err } = await supabase.from('escalation_rules').update(payload).eq('id', editId));
    } else {
      if (!form.org_id.trim()) { setSaveError('org_id обязателен'); setSaving(false); return; }
      ({ error: err } = await supabase.from('escalation_rules').insert({ ...payload, org_id: form.org_id.trim() }));
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
    await supabase.from('escalation_rules').update({ is_active: !current }).eq('id', id);
    fetchRules();
  }

  const showingForm = showForm || editId !== null;

  return (
    <AppLayout title="Эскалации">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Правила эскалации инцидентов</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Автоматические действия при превышении SLA таймеров.</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); setSaveError(null); }}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить эскалацию
          </button>
        </div>

        {showingForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{editId ? 'Редактировать правило эскалации' : 'Новое правило эскалации'}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Название *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Эскалация при просрочке реакции" />
              </div>
              {!editId && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">org_id *</label>
                  <Input value={form.org_id} onChange={(e) => setForm({ ...form, org_id: e.target.value })} placeholder="UUID организации" className="font-mono text-xs" />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Триггер (сек после создания) *</label>
                <Input type="number" min="1" value={form.trigger_after_s} onChange={(e) => setForm({ ...form, trigger_after_s: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">{parseInt(form.trigger_after_s) > 0 ? formatSeconds(parseInt(form.trigger_after_s)) : '—'}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Действие *</label>
                <select
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value as EscalationAction })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ACTION_OPTIONS.map((a) => (
                    <option key={a} value={a}>{actionLabels[a]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Целевая роль (target_role)</label>
                <Input value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })} placeholder="dispatcher, chief, platform_admin…" />
              </div>
              <div className="flex items-center gap-2 self-end">
                <input
                  type="checkbox"
                  id="esc_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="esc_active" className="text-sm text-foreground">Активно</label>
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
            <Bell className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Правила эскалации не настроены</p>
            <p className="text-sm text-muted-foreground mt-1">Добавьте правило для автоматической эскалации при нарушении SLA.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Триггер</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Действие</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Цель</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-warning">{formatSeconds(r.trigger_after_s)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={actionVariants[r.action]}>{actionLabels[r.action]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{r.target_role ?? '—'}</td>
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
