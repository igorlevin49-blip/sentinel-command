import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Route, Plus, Pencil, X, Check } from 'lucide-react';
import { useDrawerState, useFormVisibility } from '@/hooks/useDrawerState';
import { useFormDraft, useUnsavedChangesWarning } from '@/hooks/useFormDraft';

interface DispatchRule {
  id: string; org_id: string; name: string; priority: number;
  condition_json: Record<string, unknown> | null; action_json: Record<string, unknown> | null;
  is_active: boolean; created_at: string;
}

interface FormState {
  name: string; org_id: string; priority: string; condition_json: string; action_json: string; is_active: boolean;
}

const emptyForm: FormState = { name: '', org_id: '', priority: '0', condition_json: '{}', action_json: '{}', is_active: true };

function isValidJSON(s: string): boolean {
  try { JSON.parse(s); return true; } catch { return false; }
}

export default function DispatchRules() {
  const [rules, setRules] = useState<DispatchRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { isVisible: showForm, show: showNewForm, hide: hideNewForm } = useFormVisibility('newDispatch');
  const { isOpen: isEditing, openId: editId, open: startEditById, close: cancelEditUrl } = useDrawerState('editDispatch');
  const [form, setForm, clearDraft] = useFormDraft<FormState>('dispatch-form', emptyForm);
  const formIsDirty = JSON.stringify(form) !== JSON.stringify(emptyForm);
  useUnsavedChangesWarning(formIsDirty);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('dispatch_rules').select('*').order('priority', { ascending: false });
    if (error) setError(error.code === '42501' ? 'Нет доступа к правилам маршрутизации' : error.message);
    else setRules((data as DispatchRule[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  function startEdit(r: DispatchRule) {
    startEditById(r.id);
    setForm({
      name: r.name, org_id: r.org_id, priority: String(r.priority),
      condition_json: r.condition_json ? JSON.stringify(r.condition_json, null, 2) : '{}',
      action_json: r.action_json ? JSON.stringify(r.action_json, null, 2) : '{}',
      is_active: r.is_active,
    });
    hideNewForm(); setSaveError(null);
  }

  function cancelForm() { hideNewForm(); cancelEditUrl(); clearDraft(); setSaveError(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaveError(null);
    if (!form.name.trim()) { setSaveError('Название обязательно'); setSaving(false); return; }
    if (!isValidJSON(form.condition_json)) { setSaveError('Условие: невалидный JSON'); setSaving(false); return; }
    if (!isValidJSON(form.action_json)) { setSaveError('Действие: невалидный JSON'); setSaving(false); return; }
    const payload = {
      name: form.name.trim(), priority: parseInt(form.priority) || 0,
      condition_json: JSON.parse(form.condition_json), action_json: JSON.parse(form.action_json), is_active: form.is_active,
    };
    let err;
    if (editId) { ({ error: err } = await supabase.from('dispatch_rules').update(payload).eq('id', editId)); }
    else {
      if (!form.org_id.trim()) { setSaveError('org_id обязателен'); setSaving(false); return; }
      ({ error: err } = await supabase.from('dispatch_rules').insert({ ...payload, org_id: form.org_id.trim() }));
    }
    if (err) setSaveError(err.code === '42501' ? 'Нет прав для сохранения' : err.message);
    else { cancelForm(); fetchRules(); }
    setSaving(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('dispatch_rules').update({ is_active: !current }).eq('id', id); fetchRules();
  }

  const conditionJsonError = form.condition_json && !isValidJSON(form.condition_json) ? 'Невалидный JSON' : null;
  const actionJsonError = form.action_json && !isValidJSON(form.action_json) ? 'Невалидный JSON' : null;
  const showingForm = showForm || isEditing;

  return (
    <AppLayout title="Правила маршрутизации">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Правила диспетчеризации</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Автоматическая маршрутизация инцидентов по условиям (зона, тип, приоритет).</p>
          </div>
          <button onClick={() => { showingForm ? cancelForm() : showNewForm(); }}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Добавить правило
          </button>
        </div>

        {showingForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{editId ? 'Редактировать правило' : 'Новое правило маршрутизации'}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Название *</label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Маршрутизация по зоне А" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Приоритет (выше = сначала)</label>
                <Input type="number" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))} />
              </div>
              {!editId && (
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">org_id *</label>
                  <Input value={form.org_id} onChange={(e) => setForm(f => ({ ...f, org_id: e.target.value }))} placeholder="UUID организации" className="font-mono text-xs" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Условие (JSON) {conditionJsonError && <span className="ml-2 text-destructive">{conditionJsonError}</span>}
                </label>
                <Textarea rows={4} value={form.condition_json} onChange={(e) => setForm(f => ({ ...f, condition_json: e.target.value }))}
                  placeholder='{"severity": "critical", "zone": "A"}' className={`font-mono text-xs ${conditionJsonError ? 'border-destructive' : ''}`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Действие (JSON) {actionJsonError && <span className="ml-2 text-destructive">{actionJsonError}</span>}
                </label>
                <Textarea rows={4} value={form.action_json} onChange={(e) => setForm(f => ({ ...f, action_json: e.target.value }))}
                  placeholder='{"assign_to_org": "uuid", "notify_roles": ["dispatcher"]}' className={`font-mono text-xs ${actionJsonError ? 'border-destructive' : ''}`} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="dispatch_active" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded border-input" />
                <label htmlFor="dispatch_active" className="text-sm text-foreground">Активно</label>
              </div>
            </div>
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving || !!conditionJsonError || !!actionJsonError} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
              <button type="button" onClick={cancelForm} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Отмена
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center"><p className="text-muted-foreground">{error}</p></div>
        ) : rules.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Route className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Правила маршрутизации не настроены</p>
            <p className="text-sm text-muted-foreground mt-1">Добавьте первое правило чтобы автоматизировать диспетчеризацию.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">P{r.priority}</span>
                    <h3 className="font-medium text-foreground text-sm">{r.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Активно' : 'Откл.'}</Badge>
                    <button onClick={() => startEdit(r)} className="text-muted-foreground hover:text-foreground transition-colors" title="Редактировать"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => toggleActive(r.id, r.is_active)} className="text-muted-foreground hover:text-foreground transition-colors" title="Переключить">
                      {r.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {r.condition_json && Object.keys(r.condition_json).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Условие:</span>{' '}
                    <code className="bg-muted rounded px-1 py-0.5 break-all">{JSON.stringify(r.condition_json)}</code>
                  </div>
                )}
                {r.action_json && Object.keys(r.action_json).length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium text-foreground">Действие:</span>{' '}
                    <code className="bg-muted rounded px-1 py-0.5 break-all">{JSON.stringify(r.action_json)}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
