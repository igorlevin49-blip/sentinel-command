import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, UserPlus, X, Pencil, Check } from 'lucide-react';
import { usePlatformAuth, type PlatformRoleEnum } from '@/contexts/PlatformAuthContext';

interface PlatformRole {
  id: string;
  user_id: string;
  role: PlatformRoleEnum;
  is_active: boolean;
  granted_by: string | null;
  created_at: string;
}

const ROLE_OPTIONS: PlatformRoleEnum[] = [
  'platform_super_admin',
  'platform_admin',
  'platform_dispatcher',
  'platform_director',
];

const roleLabels: Record<PlatformRoleEnum, string> = {
  platform_super_admin: 'Платформ. Суперадмин',
  platform_admin: 'Платформ. Администратор',
  platform_dispatcher: 'Диспетчер ЦОУ',
  platform_director: 'Директор платформы',
};

const roleBadgeVariants: Record<PlatformRoleEnum, string> = {
  platform_super_admin: 'bg-destructive/15 text-destructive border-destructive/30',
  platform_admin: 'bg-primary/15 text-primary border-primary/30',
  platform_dispatcher: 'bg-warning/15 text-warning border-warning/30',
  platform_director: 'bg-accent/15 text-accent border-accent/30',
};

interface FormState {
  userId: string;
  role: PlatformRoleEnum;
}

const emptyForm: FormState = { userId: '', role: 'platform_dispatcher' };

export default function PlatformRoles() {
  const { isPlatformSA } = usePlatformAuth();
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<PlatformRoleEnum>('platform_dispatcher');

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.code === '42501' ? 'Нет доступа к платформенным ролям' : error.message);
    } else {
      setRoles((data as PlatformRole[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('platform_roles').update({ is_active: !current }).eq('id', id);
    fetchRoles();
  }

  async function deleteRole(id: string) {
    if (!window.confirm('Удалить платформенную роль?')) return;
    await supabase.from('platform_roles').delete().eq('id', id);
    fetchRoles();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const uid = form.userId.trim();
    if (!uid) { setSaveError('Введите user_id'); setSaving(false); return; }

    const { error } = await supabase.from('platform_roles').insert({
      user_id: uid,
      role: form.role,
      is_active: true,
    });

    if (error) {
      setSaveError(error.code === '42501' ? 'Нет прав для добавления' : error.message);
    } else {
      setForm(emptyForm);
      setShowForm(false);
      fetchRoles();
    }
    setSaving(false);
  }

  async function saveEditRole(id: string) {
    await supabase.from('platform_roles').update({ role: editRole }).eq('id', id);
    setEditId(null);
    fetchRoles();
  }

  return (
    <AppLayout title="Платформенные роли">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Роли платформы QOR</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Управление доступом к функциям платформы (отдельно от org_members).
            </p>
          </div>
          {isPlatformSA && (
            <button
              onClick={() => { setShowForm(!showForm); setSaveError(null); }}
              className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Добавить
            </button>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleSave} className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Назначить платформенную роль</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">User ID (UUID)</label>
                <Input
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Роль</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as PlatformRoleEnum })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{roleLabels[r]}</option>
                  ))}
                </select>
              </div>
            </div>
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Сохранение…' : 'Назначить'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setSaveError(null); setForm(emptyForm); }}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        {/* RBAC info table */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Матрица прав платформенных ролей
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-muted-foreground">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 pr-4 font-medium text-foreground">Ресурс</th>
                  <th className="py-1.5 px-3 text-center">Суперадмин</th>
                  <th className="py-1.5 px-3 text-center">Администратор</th>
                  <th className="py-1.5 px-3 text-center">Диспетчер ЦОУ</th>
                  <th className="py-1.5 px-3 text-center">Директор</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['Организации', 'CRUD', 'R', '—', 'R'],
                  ['Платф. роли', 'CRUD', 'R', '—', '—'],
                  ['Все инциденты', 'CRUD', 'RU', 'RU', 'R'],
                  ['Контракты', 'CRUD', 'CRUD', '—', 'R'],
                  ['SLA правила', 'CRUD', 'CRUD', 'R', 'R'],
                  ['Аудит лог', 'R', 'R', '—', 'R'],
                  ['Аналитика', 'R', 'R', 'R', 'R'],
                ].map(([res, sa, ad, d, dir]) => (
                  <tr key={res}>
                    <td className="py-1.5 pr-4 font-medium text-foreground">{res}</td>
                    <td className="py-1.5 px-3 text-center">{sa}</td>
                    <td className="py-1.5 px-3 text-center">{ad}</td>
                    <td className="py-1.5 px-3 text-center">{d}</td>
                    <td className="py-1.5 px-3 text-center">{dir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roles list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Платформенные роли не назначены</p>
            <p className="text-sm text-muted-foreground mt-1">Нажмите «Добавить» чтобы выдать пользователю роль платформы.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Пользователь</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Роль</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Дата</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roles.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground" title={r.user_id}>{r.user_id.slice(0, 8)}…</td>
                    <td className="px-5 py-3">
                      {editId === r.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as PlatformRoleEnum)}
                            className="rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{roleLabels[opt]}</option>
                            ))}
                          </select>
                          <button onClick={() => saveEditRole(r.id)} className="text-primary hover:text-primary/80">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditId(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${roleBadgeVariants[r.role]}`}>
                          {roleLabels[r.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={r.is_active ? 'success' : 'secondary'}>
                        {r.is_active ? 'Активна' : 'Отключена'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('ru')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isPlatformSA && editId !== r.id && (
                          <button
                            onClick={() => { setEditId(r.id); setEditRole(r.role); }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            title="Изменить роль"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(r.id, r.is_active)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          title={r.is_active ? 'Деактивировать' : 'Активировать'}
                        >
                          {r.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                        {isPlatformSA && (
                          <button
                            onClick={() => deleteRole(r.id)}
                            className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                            title="Удалить"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </button>
                        )}
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
