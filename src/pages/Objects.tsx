import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useOrgObjects } from '@/hooks/use-org-data';
import { useActiveOrg } from '@/contexts/ActiveOrgContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2, Search, Plus, Loader2, MapPin, ChevronRight,
  Pencil, Trash2, ToggleLeft, ToggleRight, X, Check
} from 'lucide-react';

interface ObjectForm {
  name: string;
  address: string;
  is_active: boolean;
  risk_level: string;
}

const defaultForm: ObjectForm = { name: '', address: '', is_active: true, risk_level: 'low' };

const riskLabels: Record<string, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический',
};
const riskVariant: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  low: 'success', medium: 'warning', high: 'destructive', critical: 'destructive',
};

export default function ObjectsPage() {
  const qc = useQueryClient();
  const { orgId, canManage } = useActiveOrg();
  const { data: objects, isLoading, error } = useOrgObjects();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ObjectForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = (objects ?? []).filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.address ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditId(null);
    setForm(defaultForm);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(obj: typeof objects extends (infer T)[] | undefined ? T : never) {
    setEditId((obj as any).id);
    setForm({
      name: (obj as any).name,
      address: (obj as any).address ?? '',
      is_active: (obj as any).is_active,
      risk_level: (obj as any).risk_level ?? 'low',
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !orgId) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      is_active: form.is_active,
      risk_level: form.risk_level as any,
      org_id: orgId,
    };
    let err;
    if (editId) {
      ({ error: err } = await supabase.from('objects').update(payload).eq('id', editId));
    } else {
      ({ error: err } = await supabase.from('objects').insert(payload));
    }
    setSaving(false);
    if (err) {
      setFormError(err.code === '42501' ? 'Нет доступа' : err.message);
    } else {
      qc.invalidateQueries({ queryKey: ['org-objects', orgId] });
      setShowForm(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    const { error: err } = await supabase.from('objects').update({ is_active: !current }).eq('id', id);
    if (!err) qc.invalidateQueries({ queryKey: ['org-objects', orgId] });
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить объект? Все связанные посты/смены могут быть затронуты.')) return;
    const { error: err } = await supabase.from('objects').delete().eq('id', id);
    if (err) alert(err.code === '42501' ? 'Нет доступа' : err.message);
    else qc.invalidateQueries({ queryKey: ['org-objects', orgId] });
  }

  return (
    <AppLayout title="Объекты охраны">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по объектам..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-72 rounded-md border border-border bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{filtered.length}</span> объектов
          </span>
          {canManage && (
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Создать
            </Button>
          )}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editId ? 'Редактировать объект' : 'Новый объект'}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Торговый центр Север"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Адрес</label>
                <input
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="ул. Ленина, 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Уровень риска</label>
                <select
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  value={form.risk_level}
                  onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))}
                >
                  {Object.entries(riskLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4"
                />
                <label htmlFor="is_active" className="text-sm">Активен</label>
              </div>
              {formError && <ErrorDisplay error={formError} />}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleSave} disabled={saving || !form.name.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editId ? 'Сохранить' : 'Создать'}
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
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{search ? 'Ничего не найдено' : 'Объекты не созданы'}</p>
          {canManage && !search && (
            <Button size="sm" className="mt-4 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Создать первый объект
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((obj, i) => (
            <div
              key={obj.id}
              className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${obj.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Building2 className={`h-4 w-4 ${obj.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{obj.name}</h3>
                    <Badge variant={riskVariant[obj.risk_level]} className="text-[10px] px-1.5 py-0 mt-0.5">
                      {riskLabels[obj.risk_level]}
                    </Badge>
                  </div>
                </div>
                <Badge variant={obj.is_active ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0 shrink-0">
                  {obj.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
              </div>

              {obj.address && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{obj.address}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  <span className="font-mono font-semibold text-foreground">{(obj.posts as any[])?.length ?? 0}</span> постов
                </span>
                <div className="flex items-center gap-1">
                  {canManage && (
                    <>
                      <button
                        onClick={() => handleToggle(obj.id, obj.is_active)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title={obj.is_active ? 'Деактивировать' : 'Активировать'}
                      >
                        {obj.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(obj)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(obj.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <Link
                    to={`/objects/${obj.id}`}
                    className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Открыть карточку"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
