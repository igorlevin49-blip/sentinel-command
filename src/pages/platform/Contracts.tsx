import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Pencil, X, Check } from 'lucide-react';
import { useDrawerState, useFormVisibility } from '@/hooks/useDrawerState';
import { useFormDraft, useUnsavedChangesWarning } from '@/hooks/useFormDraft';

type ContractStatus = 'draft' | 'active' | 'suspended' | 'terminated';

interface Contract {
  id: string;
  org_id: string;
  customer_org_id: string | null;
  title: string;
  number: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ContractStatus;
  created_at: string;
}

const statusLabels: Record<ContractStatus, string> = {
  draft: 'Черновик', active: 'Активен', suspended: 'Приостановлен', terminated: 'Расторгнут',
};
const statusVariants: Record<ContractStatus, 'outline' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  draft: 'secondary', active: 'success', suspended: 'warning', terminated: 'destructive',
};
const STATUS_OPTIONS: ContractStatus[] = ['draft', 'active', 'suspended', 'terminated'];

interface FormState {
  title: string; number: string; org_id: string; customer_org_id: string;
  start_date: string; end_date: string; status: ContractStatus;
}

const emptyForm: FormState = {
  title: '', number: '', org_id: '', customer_org_id: '', start_date: '', end_date: '', status: 'draft',
};

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // URL-synced form/edit state
  const { isVisible: showForm, show: showNewForm, hide: hideNewForm } = useFormVisibility('newContract');
  const { isOpen: isEditing, openId: editId, open: startEditById, close: cancelEditUrl } = useDrawerState('editContract');

  // Draft-backed form
  const [form, setForm, clearDraft] = useFormDraft<FormState>('contracts-form', emptyForm);
  const formIsDirty = JSON.stringify(form) !== JSON.stringify(emptyForm);
  useUnsavedChangesWarning(formIsDirty);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
    if (error) setError(error.code === '42501' ? 'Нет доступа к контрактам' : error.message);
    else setContracts((data as Contract[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  function startEdit(c: Contract) {
    startEditById(c.id);
    setForm({
      title: c.title, number: c.number ?? '', org_id: c.org_id,
      customer_org_id: c.customer_org_id ?? '', start_date: c.start_date ?? '',
      end_date: c.end_date ?? '', status: c.status,
    });
    hideNewForm();
    setSaveError(null);
  }

  function cancelForm() {
    hideNewForm();
    cancelEditUrl();
    clearDraft();
    setSaveError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    if (!form.title.trim()) { setSaveError('Название обязательно'); setSaving(false); return; }
    if (!editId && !form.org_id.trim()) { setSaveError('org_id обязателен'); setSaving(false); return; }
    const payload = {
      title: form.title.trim(), number: form.number.trim() || null, status: form.status,
      start_date: form.start_date || null, end_date: form.end_date || null,
      customer_org_id: form.customer_org_id.trim() || null,
    };
    let err;
    if (editId) {
      ({ error: err } = await supabase.from('contracts').update(payload).eq('id', editId));
    } else {
      ({ error: err } = await supabase.from('contracts').insert({ ...payload, org_id: form.org_id.trim() }));
    }
    if (err) setSaveError(err.code === '42501' ? 'Нет прав для сохранения' : err.message);
    else { cancelForm(); fetchContracts(); }
    setSaving(false);
  }

  async function toggleStatus(c: Contract) {
    const next: ContractStatus = c.status === 'active' ? 'suspended' : 'active';
    await supabase.from('contracts').update({ status: next }).eq('id', c.id);
    fetchContracts();
  }

  const showingForm = showForm || isEditing;

  return (
    <AppLayout title="Контракты">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Контракты с заказчиками</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Договоры между организациями и заказчиками.</p>
          </div>
          <button
            onClick={() => { showingForm ? cancelForm() : showNewForm(); }}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Новый контракт
          </button>
        </div>

        {showingForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{editId ? 'Редактировать контракт' : 'Новый контракт'}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Название *</label>
                <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название контракта" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Номер</label>
                <Input value={form.number} onChange={(e) => setForm(f => ({ ...f, number: e.target.value }))} placeholder="№ К-001-2025" />
              </div>
              {!editId && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">org_id (исполнитель) *</label>
                  <Input value={form.org_id} onChange={(e) => setForm(f => ({ ...f, org_id: e.target.value }))} placeholder="UUID организации" className="font-mono text-xs" />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">customer_org_id (заказчик)</label>
                <Input value={form.customer_org_id} onChange={(e) => setForm(f => ({ ...f, customer_org_id: e.target.value }))} placeholder="UUID заказчика" className="font-mono text-xs" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Дата начала</label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Дата окончания</label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Статус</label>
                <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as ContractStatus }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
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
        ) : contracts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Контракты не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">Нажмите «Новый контракт» чтобы добавить первый.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Номер</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Начало</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Окончание</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.number ?? '—'}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{c.title}</td>
                    <td className="px-5 py-3"><Badge variant={statusVariants[c.status]}>{statusLabels[c.status]}</Badge></td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{c.start_date ? new Date(c.start_date).toLocaleDateString('ru') : '—'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{c.end_date ? new Date(c.end_date).toLocaleDateString('ru') : '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(c)} className="text-muted-foreground hover:text-foreground transition-colors" title="Редактировать"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => toggleStatus(c)} className="text-muted-foreground hover:text-foreground transition-colors" title={c.status === 'active' ? 'Приостановить' : 'Активировать'}>
                          {c.status === 'active' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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
