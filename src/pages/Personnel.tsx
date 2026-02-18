import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useOrgPersonnel } from '@/hooks/use-org-data';
import { useActiveOrg } from '@/contexts/ActiveOrgContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, Plus, Loader2, Shield, Phone,
  Pencil, Trash2, ToggleLeft, ToggleRight, X, Check
} from 'lucide-react';

interface PersonnelForm {
  full_name: string;
  phone: string;
  position: string;
  user_id: string;
  is_active: boolean;
}

const defaultForm: PersonnelForm = { full_name: '', phone: '', position: '', user_id: '', is_active: true };

export default function PersonnelPage() {
  const qc = useQueryClient();
  const { orgId, canManage } = useActiveOrg();
  const { data: personnel, isLoading, error } = useOrgPersonnel();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonnelForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = (personnel ?? []).filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.position ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.phone ?? '').includes(search)
  );

  function openCreate() {
    setEditId(null);
    setForm(defaultForm);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(p: any) {
    setEditId(p.id);
    setForm({
      full_name: p.full_name,
      phone: p.phone ?? '',
      position: p.position ?? '',
      user_id: p.user_id ?? '',
      is_active: p.is_active,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.full_name.trim() || !orgId) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      position: form.position.trim() || null,
      user_id: form.user_id.trim() || null,
      is_active: form.is_active,
      org_id: orgId,
    };
    let err;
    if (editId) {
      ({ error: err } = await supabase.from('personnel').update(payload).eq('id', editId));
    } else {
      ({ error: err } = await supabase.from('personnel').insert(payload));
    }
    setSaving(false);
    if (err) setFormError(err.code === '42501' ? 'Нет доступа' : err.message);
    else {
      qc.invalidateQueries({ queryKey: ['org-personnel', orgId] });
      setShowForm(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    const { error: err } = await supabase.from('personnel').update({ is_active: !current }).eq('id', id);
    if (!err) qc.invalidateQueries({ queryKey: ['org-personnel', orgId] });
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить сотрудника?')) return;
    const { error: err } = await supabase.from('personnel').delete().eq('id', id);
    if (err) alert(err.code === '42501' ? 'Нет доступа' : err.message);
    else qc.invalidateQueries({ queryKey: ['org-personnel', orgId] });
  }

  const onDuty = (personnel ?? []).filter(p => p.is_active).length;

  return (
    <AppLayout title="Персонал">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по персоналу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-72 rounded-md border border-border bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Активных: <span className="font-mono font-semibold text-success">{onDuty}</span> /
            Всего: <span className="font-mono font-semibold text-foreground">{(personnel ?? []).length}</span>
          </span>
          {canManage && (
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Добавить
            </Button>
          )}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Редактировать сотрудника' : 'Новый сотрудник'}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ФИО *</label>
                <input
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <input
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+7 900 000-00-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Должность</label>
                <input
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  placeholder="Охранник 6 разряда"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  User ID (UUID)
                  <span className="ml-1 text-xs text-muted-foreground font-normal">— привязка к аккаунту охранника</span>
                </label>
                <input
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none"
                  value={form.user_id}
                  onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pa_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4" />
                <label htmlFor="pa_active" className="text-sm">Активен</label>
              </div>
              {formError && <ErrorDisplay error={formError} />}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleSave} disabled={saving || !form.full_name.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editId ? 'Сохранить' : 'Добавить'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <ErrorDisplay error={error} />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{search ? 'Ничего не найдено' : 'Персонал не добавлен'}</p>
          {canManage && !search && (
            <Button size="sm" className="mt-4 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Добавить сотрудника
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${p.is_active ? 'bg-success/10' : 'bg-muted'}`}>
                  <Shield className={`h-5 w-5 ${p.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.full_name}</p>
                  {p.position && <p className="text-xs text-muted-foreground truncate">{p.position}</p>}
                  <Badge variant={p.is_active ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0 mt-1">
                    {p.is_active ? 'Активен' : 'Неактивен'}
                  </Badge>
                </div>
              </div>
              {p.phone && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="font-mono">{p.phone}</span>
                </div>
              )}
              {p.user_id && (
                <p className="mt-1 text-[10px] text-muted-foreground font-mono truncate" title={p.user_id}>
                  uid: {p.user_id.substring(0, 8)}...
                </p>
              )}
              {canManage && (
                <div className="mt-3 flex items-center justify-end gap-1">
                  <button onClick={() => handleToggle(p.id, p.is_active)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={p.is_active ? 'Деактивировать' : 'Активировать'}>
                    {p.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
