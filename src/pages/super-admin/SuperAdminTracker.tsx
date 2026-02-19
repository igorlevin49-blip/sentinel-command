import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, Github, Plus, Search,
  XCircle, Bell, ChevronRight, Pencil, ExternalLink, Shield,
  ListChecks, GitBranch, X, Trash2, Check, Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import {
  useDeliveryItems, useDeliveryAlerts, useDeliveryChecks, useDeliveryGithubLinks,
  ensureAutoAlerts,
  type DeliveryItem, type DeliveryAlert, type ItemArea, type ItemType,
  type ItemStatus, type ItemPriority, type CheckKind,
} from '@/hooks/useDeliveryTracker';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ─── Constants ────────────────────────────────────────────────────────────────

const AREAS: ItemArea[] = ['platform', 'org', 'incidents', 'rbac', 'rls', 'ui', 'db', 'auth'];
const TYPES: ItemType[] = ['epic', 'issue', 'task', 'uat'];
const STATUSES: ItemStatus[] = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const PRIORITIES: ItemPriority[] = ['p0', 'p1', 'p2', 'p3'];

const statusLabel: Record<ItemStatus, string> = {
  todo: 'К работе', in_progress: 'В работе', review: 'Ревью', done: 'Готово', blocked: 'Заблокировано',
};
const statusColor: Record<ItemStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/15 text-primary border-primary/30',
  review: 'bg-accent/15 text-accent border-accent/30',
  done: 'bg-success/15 text-success border-success/30',
  blocked: 'bg-destructive/15 text-destructive border-destructive/30',
};
const priorityColor: Record<ItemPriority, string> = {
  p0: 'bg-destructive/15 text-destructive border-destructive/30',
  p1: 'bg-warning/15 text-warning border-warning/30',
  p2: 'bg-primary/15 text-primary border-primary/30',
  p3: 'bg-muted text-muted-foreground border-border',
};
const alertSeverityColor: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
  warn: 'bg-warning/15 text-warning border-warning/30',
  info: 'bg-primary/15 text-primary border-primary/30',
};
const alertTypeLabel: Record<string, string> = {
  needs_github_action: 'Нужно действие в GitHub',
  blocked: 'Заблокировано',
  p0_open: 'P0 открыт',
  rls_denied: 'RLS отказ',
  test_failed: 'Тест не прошёл',
};

// ─── No access screen ─────────────────────────────────────────────────────────

function NoAccess() {
  return (
    <AppLayout title="Трекинг проекта">
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Shield className="h-14 w-14 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Нет доступа</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Трекинг проекта доступен только сотрудникам платформы.
        </p>
      </div>
    </AppLayout>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${accent ? `border-${accent}/30` : 'border-border'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? `text-${accent}` : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Alerts center ────────────────────────────────────────────────────────────

function AlertsCenter({ alerts, onResolve, itemMap }: {
  alerts: DeliveryAlert[];
  onResolve: (id: string) => void;
  itemMap: Map<string, DeliveryItem>;
}) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <p className="text-sm text-success font-medium">Нет активных алертов — всё под контролем</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-destructive/5 border-b border-destructive/20">
        <Bell className="h-4 w-4 text-destructive animate-pulse" />
        <span className="text-sm font-semibold text-foreground">Активные алерты</span>
        <span className="ml-auto rounded-full bg-destructive/15 text-destructive text-xs font-bold px-2 py-0.5">{alerts.length}</span>
      </div>
      <div className="divide-y divide-border">
        {alerts.map((a) => {
          const item = a.item_id ? itemMap.get(a.item_id) : null;
          return (
            <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${a.severity === 'critical' ? 'bg-destructive/5' : ''}`}>
              <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0 mt-0.5 ${alertSeverityColor[a.severity]}`}>
                {a.severity}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{alertTypeLabel[a.type] ?? a.type}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.message}</p>
                {item && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Задача: <span className="text-primary font-mono">{item.key}</span> — {item.title}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.action_url && (
                  <a href={a.action_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    Перейти
                  </a>
                )}
                <button
                  onClick={() => onResolve(a.id)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  title="Закрыть алерт"
                >
                  <Check className="h-3.5 w-3.5" />
                  Resolve
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Item Details Drawer ──────────────────────────────────────────────────────

function ItemDrawer({
  item,
  onClose,
  onSave,
  onNeedsGithub,
  itemMap,
}: {
  item: DeliveryItem;
  onClose: () => void;
  onSave: (id: string, patch: Partial<DeliveryItem>) => Promise<void>;
  onNeedsGithub: (item: DeliveryItem) => Promise<void>;
  itemMap: Map<string, DeliveryItem>;
}) {
  const [tab, setTab] = useState<'overview' | 'checklists' | 'github'>('overview');
  const [editing, setEditing] = useState(false);
  const [patch, setPatch] = useState<Partial<DeliveryItem>>({});
  const [saving, setSaving] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [newCheckTitle, setNewCheckTitle] = useState('');
  const [newCheckKind, setNewCheckKind] = useState<CheckKind>('dod');
  const [newRepo, setNewRepo] = useState('');
  const [newIssueNum, setNewIssueNum] = useState('');
  const [newPrNum, setNewPrNum] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const { checks, loading: checksLoading, fetchChecks, toggleCheck, addCheck, deleteCheck } = useDeliveryChecks(item.id);
  const { links, loading: linksLoading, fetchLinks, addLink, deleteLink } = useDeliveryGithubLinks(item.id);

  useEffect(() => { fetchChecks(); fetchLinks(); }, [fetchChecks, fetchLinks]);

  async function handleSave() {
    setSaving(true);
    await onSave(item.id, patch);
    setSaving(false);
    setEditing(false);
    setPatch({});
  }

  async function handleAddCheck() {
    if (!newCheckTitle.trim()) return;
    const err = await addCheck(item.id, newCheckKind, newCheckTitle.trim());
    if (err) toast({ title: 'Ошибка', description: err, variant: 'destructive' });
    else { setNewCheckTitle(''); fetchChecks(); }
  }

  async function handleAddLink() {
    if (!newRepo.trim()) return;
    const err = await addLink({
      item_id: item.id,
      repo: newRepo.trim(),
      issue_number: newIssueNum ? parseInt(newIssueNum) : null,
      pr_number: newPrNum ? parseInt(newPrNum) : null,
      url: newUrl.trim() || null,
    });
    if (err) toast({ title: 'Ошибка', description: err, variant: 'destructive' });
    else { setNewRepo(''); setNewIssueNum(''); setNewPrNum(''); setNewUrl(''); fetchLinks(); }
  }

  async function handleNeedsGithub() {
    setGithubLoading(true);
    await onNeedsGithub(item);
    setGithubLoading(false);
  }

  const dod = checks.filter(c => c.kind === 'dod');
  const uat = checks.filter(c => c.kind === 'uat');
  const gh = checks.filter(c => c.kind === 'github');

  const cur = { ...item, ...patch };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full max-w-2xl bg-card border-l border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-primary font-bold">{item.key}</span>
              <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${priorityColor[item.priority]}`}>{item.priority.toUpperCase()}</span>
              <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${statusColor[item.status]}`}>{statusLabel[item.status]}</span>
            </div>
            <h2 className="text-base font-bold text-foreground truncate">{item.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{item.area} · {item.type}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5 gap-4 bg-muted/10">
          {(['overview', 'checklists', 'github'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {t === 'overview' && <Pencil className="h-3 w-3" />}
              {t === 'checklists' && <ListChecks className="h-3 w-3" />}
              {t === 'github' && <GitBranch className="h-3 w-3" />}
              {t === 'overview' ? 'Обзор' : t === 'checklists' ? 'Чеклисты' : 'GitHub'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin">

          {/* ── Overview tab ── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {!editing ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Область</p><p className="font-medium text-foreground capitalize">{item.area}</p></div>
                    <div><p className="text-xs text-muted-foreground">Тип</p><p className="font-medium text-foreground capitalize">{item.type}</p></div>
                    <div><p className="text-xs text-muted-foreground">Статус</p><p className={`font-medium inline-flex rounded border px-1.5 py-0.5 text-xs ${statusColor[item.status]}`}>{statusLabel[item.status]}</p></div>
                    <div><p className="text-xs text-muted-foreground">Приоритет</p><p className={`font-medium inline-flex rounded border px-1.5 py-0.5 text-xs ${priorityColor[item.priority]}`}>{item.priority.toUpperCase()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Владелец</p><p className="font-medium text-foreground">{item.owner ?? '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Родитель</p><p className="font-medium text-foreground font-mono text-xs">{item.parent_id ? (itemMap.get(item.parent_id)?.key ?? item.parent_id.slice(0, 8)) : '—'}</p></div>
                    <div className="col-span-2"><p className="text-xs text-muted-foreground">Обновлено</p><p className="text-xs text-muted-foreground">{new Date(item.updated_at).toLocaleString('ru')}</p></div>
                  </div>
                  {item.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Описание</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{item.description}</p>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                      <Pencil className="h-3 w-3" /> Редактировать
                    </button>
                    <button onClick={handleNeedsGithub} disabled={githubLoading}
                      className="flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/20 transition-colors disabled:opacity-50">
                      <Github className="h-3 w-3" />
                      {githubLoading ? 'Создаём алерт…' : 'Требует действий в GitHub'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Статус</label>
                      <select value={cur.status ?? item.status} onChange={e => setPatch(p => ({ ...p, status: e.target.value as ItemStatus }))}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Приоритет</label>
                      <select value={cur.priority ?? item.priority} onChange={e => setPatch(p => ({ ...p, priority: e.target.value as ItemPriority }))}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Область</label>
                      <select value={cur.area ?? item.area} onChange={e => setPatch(p => ({ ...p, area: e.target.value as ItemArea }))}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Владелец</label>
                      <Input value={cur.owner ?? ''} onChange={e => setPatch(p => ({ ...p, owner: e.target.value }))} className="h-9 text-sm" placeholder="@username" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Заголовок</label>
                    <Input value={cur.title ?? item.title} onChange={e => setPatch(p => ({ ...p, title: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
                    <textarea value={cur.description ?? ''} onChange={e => setPatch(p => ({ ...p, description: e.target.value }))}
                      rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving}
                      className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      {saving ? 'Сохранение…' : 'Сохранить'}
                    </button>
                    <button onClick={() => { setEditing(false); setPatch({}); }}
                      className="rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Checklists tab ── */}
          {tab === 'checklists' && (
            <div className="space-y-5">
              {([['dod', 'Definition of Done', dod], ['uat', 'UAT Критерии', uat], ['github', 'GitHub чеклист', gh]] as [CheckKind, string, typeof dod][]).map(([kind, label, list]) => (
                <div key={kind}>
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{label}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{list.filter(c => c.is_done).length}/{list.length}</span>
                  </div>
                  {checksLoading ? (
                    <div className="h-8 flex items-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
                  ) : list.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Нет пунктов</p>
                  ) : (
                    <div className="space-y-1">
                      {list.map(c => (
                        <div key={c.id} className="flex items-center gap-2 group">
                          <button onClick={async () => { await toggleCheck(c.id, c.is_done); fetchChecks(); }}
                            className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors ${c.is_done ? 'bg-success border-success/50' : 'border-border hover:border-primary'}`}>
                            {c.is_done && <Check className="h-2.5 w-2.5 text-success-foreground" />}
                          </button>
                          <span className={`text-xs flex-1 ${c.is_done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{c.title}</span>
                          <button onClick={async () => { await deleteCheck(c.id); fetchChecks(); }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Add check */}
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Добавить пункт</p>
                <div className="flex gap-2">
                  <select value={newCheckKind} onChange={e => setNewCheckKind(e.target.value as CheckKind)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="dod">DoD</option>
                    <option value="uat">UAT</option>
                    <option value="github">GitHub</option>
                  </select>
                  <Input value={newCheckTitle} onChange={e => setNewCheckTitle(e.target.value)} placeholder="Новый пункт…"
                    className="h-8 text-xs flex-1" onKeyDown={e => e.key === 'Enter' && handleAddCheck()} />
                  <button onClick={handleAddCheck}
                    className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── GitHub tab ── */}
          {tab === 'github' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Привязанные GitHub ресурсы</span>
              </div>

              {linksLoading ? (
                <div className="h-8 flex items-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
              ) : links.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Нет привязанных ресурсов</p>
              ) : (
                <div className="space-y-2">
                  {links.map(l => (
                    <div key={l.id} className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-3 py-2">
                      <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-foreground truncate">{l.repo}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {l.issue_number ? `Issue #${l.issue_number}` : ''}
                          {l.issue_number && l.pr_number ? ' · ' : ''}
                          {l.pr_number ? `PR #${l.pr_number}` : ''}
                        </p>
                      </div>
                      {l.url && (
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button onClick={async () => { await deleteLink(l.id); fetchLinks(); }}
                        className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add link form */}
              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Добавить ресурс</p>
                <Input value={newRepo} onChange={e => setNewRepo(e.target.value)} placeholder="owner/repo" className="h-8 text-xs font-mono" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={newIssueNum} onChange={e => setNewIssueNum(e.target.value)} placeholder="Issue #" className="h-8 text-xs" type="number" />
                  <Input value={newPrNum} onChange={e => setNewPrNum(e.target.value)} placeholder="PR #" className="h-8 text-xs" type="number" />
                </div>
                <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://github.com/…" className="h-8 text-xs" />
                <button onClick={handleAddLink}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Plus className="h-3 w-3" /> Добавить
                </button>
              </div>

              {/* Status note */}
              <div className="rounded-md border border-border bg-muted/20 p-3 flex items-start gap-2">
                <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Автопроверка GitHub: <span className="text-warning font-medium">выключена</span>.
                  Настройте токен в секретах Edge Function для автоматической синхронизации.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Item form (create/edit) ──────────────────────────────────────────────────

interface ItemFormData {
  key: string; title: string; description: string; area: ItemArea;
  type: ItemType; status: ItemStatus; priority: ItemPriority; owner: string;
}

const emptyForm: ItemFormData = {
  key: '', title: '', description: '', area: 'platform',
  type: 'task', status: 'todo', priority: 'p2', owner: '',
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SuperAdminTracker() {
  const { isPlatformStaff, isPlatformDispatcher } = usePlatformAuth();
  const isReadOnly = isPlatformDispatcher;

  const { items, loading, error, fetchItems, createItem, updateItem } = useDeliveryItems();
  const { alerts, loading: alertsLoading, activeCount, fetchAlerts, createAlert, resolveAlert } = useDeliveryAlerts();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ItemStatus | 'all'>('all');
  const [filterArea, setFilterArea] = useState<ItemArea | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<ItemPriority | 'all'>('all');
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');
  const [onlyWithAlerts, setOnlyWithAlerts] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DeliveryItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<ItemFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<'priority' | 'status' | 'updated_at' | 'key'>('priority');

  const refresh = useCallback(async () => {
    await Promise.all([fetchItems(), fetchAlerts()]);
  }, [fetchItems, fetchAlerts]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!isPlatformStaff) return <NoAccess />;

  // Build a map of item_id -> alerts for the items table
  const alertsByItem = new Map<string, DeliveryAlert[]>();
  alerts.forEach(a => {
    if (a.item_id) {
      if (!alertsByItem.has(a.item_id)) alertsByItem.set(a.item_id, []);
      alertsByItem.get(a.item_id)!.push(a);
    }
  });
  const itemMap = new Map(items.map(i => [i.id, i]));

  // KPIs
  const total = items.length;
  const done = items.filter(i => i.status === 'done').length;
  const blocked = items.filter(i => i.status === 'blocked').length;
  const p0Open = items.filter(i => i.priority === 'p0' && i.status !== 'done').length;
  const donePct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Filtering
  const filtered = items
    .filter(i => {
      if (search && !i.key.toLowerCase().includes(search.toLowerCase()) && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== 'all' && i.status !== filterStatus) return false;
      if (filterArea !== 'all' && i.area !== filterArea) return false;
      if (filterPriority !== 'all' && i.priority !== filterPriority) return false;
      if (filterType !== 'all' && i.type !== filterType) return false;
      if (onlyWithAlerts && !alertsByItem.has(i.id)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'priority') return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
      if (sortKey === 'status') return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      if (sortKey === 'updated_at') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      return a.key.localeCompare(b.key);
    });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.key.trim() || !form.title.trim()) { setFormError('Key и Title обязательны'); return; }
    setSaving(true);
    setFormError(null);
    const err = await createItem({ ...form, description: form.description || null, owner: form.owner || null, parent_id: null });
    if (err) {
      setFormError(err);
    } else {
      toast({ title: 'Задача создана', description: form.key });
      setForm(emptyForm);
      setShowCreateForm(false);
      // Check auto-alerts for new item
      const newItem = { ...form, id: '', created_at: '', updated_at: '', description: form.description || null, owner: form.owner || null, parent_id: null } as DeliveryItem;
      await ensureAutoAlerts(newItem);
      refresh();
    }
    setSaving(false);
  }

  async function handleSaveItem(id: string, patch: Partial<DeliveryItem>) {
    const err = await updateItem(id, patch);
    if (err) {
      toast({ title: 'Ошибка сохранения', description: err, variant: 'destructive' });
    } else {
      toast({ title: 'Сохранено' });
      // Check auto-alerts after update
      const updated = { ...itemMap.get(id)!, ...patch };
      await ensureAutoAlerts(updated);
      refresh();
    }
  }

  async function handleNeedsGithub(item: DeliveryItem) {
    // Find linked GitHub URL if any
    const { data: links } = await supabase.from('delivery_github_links').select('url,issue_number,pr_number').eq('item_id', item.id).limit(1);
    const link = links?.[0];
    const actionUrl = link?.url ?? (link?.issue_number ? `https://github.com/issues/${link.issue_number}` : null);
    const err = await createAlert({
      severity: 'warn',
      type: 'needs_github_action',
      item_id: item.id,
      message: `Требуется действие в GitHub для задачи "${item.title}" (${item.key}). Проверьте и создайте Issue/PR.`,
      action_url: actionUrl,
      is_active: true,
    });
    if (err) toast({ title: 'Ошибка', description: err, variant: 'destructive' });
    else { toast({ title: 'Алерт создан', description: 'Задача отмечена как требующая действия в GitHub' }); refresh(); }
  }

  async function handleResolveAlert(id: string) {
    const err = await resolveAlert(id);
    if (err) toast({ title: 'Ошибка', description: err, variant: 'destructive' });
    else { toast({ title: 'Алерт закрыт' }); fetchAlerts(); }
  }

  function SortBtn({ k, label }: { k: typeof sortKey; label: string }) {
    return (
      <button onClick={() => setSortKey(k)}
        className={`text-xs font-semibold text-left uppercase tracking-wider transition-colors ${sortKey === k ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
        {label}{sortKey === k ? ' ↑' : ''}
      </button>
    );
  }

  return (
    <AppLayout title="Трекинг проекта">
      <div className="space-y-6 max-w-7xl">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Трекинг доставки проекта
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Единый реестр задач, чеклистов и алертов. SSOT для статуса доставки S-OMS/QOR Platform.
            </p>
          </div>
          {!isReadOnly && (
            <button onClick={() => setShowCreateForm(v => !v)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
              <Plus className="h-4 w-4" />
              {showCreateForm ? 'Скрыть форму' : 'Создать задачу'}
            </button>
          )}
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <KpiCard label="Всего задач" value={total} />
          <KpiCard label="Готово" value={`${donePct}%`} sub={`${done} из ${total}`} accent="success" />
          <KpiCard label="Заблокировано" value={blocked} accent={blocked > 0 ? 'destructive' : undefined} />
          <KpiCard label="P0 открыто" value={p0Open} accent={p0Open > 0 ? 'destructive' : undefined} />
          <KpiCard label="Активные алерты" value={activeCount} accent={activeCount > 0 ? 'warning' : undefined} />
        </div>

        {/* ── Alerts center ── */}
        {alertsLoading ? (
          <div className="h-12 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Загрузка алертов…
          </div>
        ) : (
          <AlertsCenter alerts={alerts} onResolve={handleResolveAlert} itemMap={itemMap} />
        )}

        {/* ── Create form ── */}
        {showCreateForm && !isReadOnly && (
          <form onSubmit={handleCreate} className="rounded-lg border border-primary/30 bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Новая задача
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Key *</label>
                <Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="PLAT-01" className="h-9 text-sm font-mono" />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Заголовок *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название задачи" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Владелец</label>
                <Input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="@name" className="h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                ['area', 'Область', AREAS],
                ['type', 'Тип', TYPES],
                ['status', 'Статус', STATUSES],
                ['priority', 'Приоритет', PRIORITIES],
              ] as [keyof ItemFormData, string, string[]][]).map(([field, label, opts]) => (
                <div key={field}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <select value={form[field] as string} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {opts.map(o => <option key={o} value={o}>{field === 'status' ? statusLabel[o as ItemStatus] : o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Опциональное описание…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Создание…' : 'Создать'}
              </button>
              <button type="button" onClick={() => { setShowCreateForm(false); setForm(emptyForm); setFormError(null); }}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Отмена
              </button>
            </div>
          </form>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по key, title…" className="pl-8 h-9 text-xs" />
          </div>
          {([
            ['filterStatus', filterStatus, setFilterStatus, [['all', 'Все статусы'], ...STATUSES.map(s => [s, statusLabel[s]])]],
            ['filterPriority', filterPriority, setFilterPriority, [['all', 'Все приоритеты'], ...PRIORITIES.map(p => [p, p.toUpperCase()])]],
            ['filterArea', filterArea, setFilterArea, [['all', 'Все области'], ...AREAS.map(a => [a, a])]],
            ['filterType', filterType, setFilterType, [['all', 'Все типы'], ...TYPES.map(t => [t, t])]],
          ] as [string, string, (v: any) => void, [string, string][]][]).map(([key, val, setter, opts]) => (
            <select key={key} value={val} onChange={e => setter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={onlyWithAlerts} onChange={e => setOnlyWithAlerts(e.target.checked)} className="accent-primary" />
            Только с алертами
          </label>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} / {total}</span>
        </div>

        {/* ── Main table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <XCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Задачи не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">Измените фильтры или создайте первую задачу.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3"><SortBtn k="key" label="Key" /></th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Заголовок</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Тип</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Область</th>
                    <th className="text-left px-4 py-3"><SortBtn k="priority" label="Приор." /></th>
                    <th className="text-left px-4 py-3"><SortBtn k="status" label="Статус" /></th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Владелец</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Алерты</th>
                    <th className="text-left px-4 py-3"><SortBtn k="updated_at" label="Обновлено" /></th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(item => {
                    const itemAlerts = alertsByItem.get(item.id) ?? [];
                    const hasAlerts = itemAlerts.length > 0;
                    const hasCritical = itemAlerts.some(a => a.severity === 'critical');
                    return (
                      <tr key={item.id}
                        className={`transition-colors hover:bg-muted/30 cursor-pointer ${
                          hasCritical ? 'bg-destructive/5 border-l-2 border-l-destructive' :
                          hasAlerts ? 'bg-warning/5 border-l-2 border-l-warning' : ''
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{item.key}</td>
                        <td className="px-4 py-3 text-foreground max-w-[220px]">
                          <span className="truncate block" title={item.title}>{item.title}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{item.type}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{item.area}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${priorityColor[item.priority]}`}>
                            {item.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold ${statusColor[item.status]}`}>
                            {statusLabel[item.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{item.owner ?? '—'}</td>
                        <td className="px-4 py-3">
                          {hasAlerts ? (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${hasCritical ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}`}>
                              <Bell className="h-2.5 w-2.5" />
                              {itemAlerts.length}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.updated_at).toLocaleDateString('ru')}
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Detail drawer ── */}
        {selectedItem && (
          <ItemDrawer
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onSave={handleSaveItem}
            onNeedsGithub={handleNeedsGithub}
            itemMap={itemMap}
          />
        )}
      </div>
    </AppLayout>
  );
}
