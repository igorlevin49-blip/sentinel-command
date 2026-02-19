import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import { Shield, Pencil, Check, X, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePlatformAuth, type PlatformRoleEnum } from '@/contexts/PlatformAuthContext';
import { usePlatformRoles, validateUuid, type PlatformRoleRow } from '@/hooks/usePlatformRoles';
import { toast } from '@/hooks/use-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: PlatformRoleEnum[] = [
  'platform_super_admin',
  'platform_admin',
  'platform_dispatcher',
  'platform_director',
];

const roleLabels: Record<PlatformRoleEnum, string> = {
  platform_super_admin: 'Суперадмин платформы',
  platform_admin: 'Администратор платформы',
  platform_dispatcher: 'Диспетчер ЦОУ',
  platform_director: 'Директор платформы',
};

const roleBadgeClass: Record<PlatformRoleEnum, string> = {
  platform_super_admin: 'bg-destructive/15 text-destructive border-destructive/30',
  platform_admin: 'bg-primary/15 text-primary border-primary/30',
  platform_dispatcher: 'bg-warning/15 text-warning border-warning/30',
  platform_director: 'bg-accent/15 text-accent border-accent/30',
};

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  userId: string;
  role: PlatformRoleEnum;
  isActive: boolean;
}

const emptyForm: FormState = { userId: '', role: 'platform_dispatcher', isActive: true };

// ─── Access-denied screen ─────────────────────────────────────────────────────

function NoAccess() {
  return (
    <AppLayout title="Роли платформы">
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Shield className="h-14 w-14 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Нет доступа</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Управление платформенными ролями доступно только суперадминистратору платформы.
        </p>
      </div>
    </AppLayout>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SuperAdminRoles() {
  const { isPlatformSA } = usePlatformAuth();
  const { rows, loading, fetchError, fetch, upsert, toggleActive } = usePlatformRoles();

  // Form
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit inline
  const [editRow, setEditRow] = useState<PlatformRoleRow | null>(null);

  // Filters
  const [searchUid, setSearchUid] = useState('');
  const [filterRole, setFilterRole] = useState<PlatformRoleEnum | 'all'>('all');
  const [onlyActive, setOnlyActive] = useState(false);

  useEffect(() => { fetch(); }, [fetch]);

  if (!isPlatformSA) return <NoAccess />;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function loadRowIntoForm(row: PlatformRoleRow) {
    setForm({ userId: row.user_id, role: row.role, isActive: row.is_active });
    setEditRow(row);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleUpsert(e: React.FormEvent) {
    e.preventDefault();
    const uuidErr = validateUuid(form.userId);
    if (uuidErr) { setFormError(uuidErr); return; }

    setSaving(true);
    setFormError(null);
    const err = await upsert(form.userId, form.role, form.isActive);
    setSaving(false);

    if (err) {
      setFormError(err);
    } else {
      toast({ title: 'Роль сохранена', description: `${roleLabels[form.role]} → ${form.userId.slice(0, 8)}…` });
      setForm(emptyForm);
      setEditRow(null);
      fetch();
    }
  }

  async function handleToggle(row: PlatformRoleRow) {
    const err = await toggleActive(row.id, row.is_active);
    if (err) {
      toast({ title: 'Ошибка', description: err, variant: 'destructive' });
    } else {
      fetch();
    }
  }

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = rows.filter((r) => {
    if (searchUid && !r.user_id.toLowerCase().includes(searchUid.toLowerCase())) return false;
    if (filterRole !== 'all' && r.role !== filterRole) return false;
    if (onlyActive && !r.is_active) return false;
    return true;
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Роли платформы">
      <div className="space-y-6 max-w-5xl">

        {/* ── Page header ── */}
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Управление ролями платформы
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Назначение и управление доступом пользователей к функциям платформы QOR.
            Изменения действуют немедленно.
          </p>
        </div>

        {/* ── Upsert form ── */}
        <form
          onSubmit={handleUpsert}
          className="rounded-lg border border-border bg-card p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-foreground">
            {editRow ? 'Редактировать назначение' : 'Назначить / Обновить роль'}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* User ID */}
            <div className="sm:col-span-1">
              <label className="text-xs text-muted-foreground mb-1 block">User ID (UUID) *</label>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="font-mono text-xs"
              />
            </div>

            {/* Role */}
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

            {/* Active toggle */}
            <div className="flex flex-col justify-end">
              <label className="text-xs text-muted-foreground mb-1 block">Активна</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`flex items-center gap-2 h-10 px-3 rounded-md border text-sm font-medium transition-colors ${
                  form.isActive
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {form.isActive
                  ? <ToggleRight className="h-4 w-4" />
                  : <ToggleLeft className="h-4 w-4" />}
                {form.isActive ? 'Активна' : 'Отключена'}
              </button>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-destructive">{formError}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Сохранение…' : 'Назначить / Обновить'}
            </button>
            {editRow && (
              <button
                type="button"
                onClick={() => { setForm(emptyForm); setEditRow(null); setFormError(null); }}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Отмена
              </button>
            )}
          </div>
        </form>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по User ID…"
              value={searchUid}
              onChange={(e) => setSearchUid(e.target.value)}
              className="pl-8 h-9 text-xs font-mono"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as PlatformRoleEnum | 'all')}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Все роли</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{roleLabels[r]}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="accent-primary"
            />
            Только активные
          </label>
          <span className="text-xs text-muted-foreground ml-auto">
            Показано: {filtered.length} / {rows.length}
          </span>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : fetchError ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{fetchError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Записей не найдено</p>
            <p className="text-sm text-muted-foreground mt-1">
              {rows.length === 0
                ? 'Платформенные роли ещё не назначены. Используйте форму выше.'
                : 'Измените фильтры для просмотра других записей.'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`transition-colors hover:bg-muted/30 ${
                      editRow?.id === r.id ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''
                    }`}
                  >
                    {/* User ID */}
                    <td className="px-5 py-3">
                      <span
                        className="font-mono text-xs text-muted-foreground cursor-help"
                        title={r.user_id}
                      >
                        {r.user_id.slice(0, 8)}…{r.user_id.slice(-4)}
                      </span>
                    </td>

                    {/* Role badge */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                          roleBadgeClass[r.role] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {roleLabels[r.role] ?? r.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <Badge variant={r.is_active ? 'success' : 'secondary'}>
                        {r.is_active ? 'Активна' : 'Отключена'}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('ru')}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3">
                        {/* Edit — load into form */}
                        <button
                          onClick={() => loadRowIntoForm(r)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggle(r)}
                          className={`transition-colors ${
                            r.is_active
                              ? 'text-primary hover:text-primary/70'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title={r.is_active ? 'Деактивировать' : 'Активировать'}
                        >
                          {r.is_active
                            ? <ToggleRight className="h-5 w-5" />
                            : <ToggleLeft className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── RBAC matrix (reference) ── */}
        <details className="rounded-lg border border-border bg-muted/20">
          <summary className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-foreground cursor-pointer select-none">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Матрица прав платформенных ролей
          </summary>
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-xs text-muted-foreground mt-2">
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
                {([
                  ['Организации',   'CRUD', 'R',    '—',  'R'],
                  ['Платф. роли',   'CRUD', 'R',    '—',  '—'],
                  ['Все инциденты', 'CRUD', 'RU',   'RU', 'R'],
                  ['Контракты',     'CRUD', 'CRUD', '—',  'R'],
                  ['SLA правила',   'CRUD', 'CRUD', 'R',  'R'],
                  ['Аудит лог',     'R',    'R',    '—',  'R'],
                  ['Аналитика',     'R',    'R',    'R',  'R'],
                ] as const).map(([res, sa, ad, d, dir]) => (
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
        </details>

      </div>
    </AppLayout>
  );
}
