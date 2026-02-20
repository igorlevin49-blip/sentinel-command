import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Play } from 'lucide-react';

/* ── Types ── */
interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'running' | 'pending';
  detail: string;
  ts?: string;
}

interface RequestLog {
  action: string;
  status: number | string;
  authenticated: boolean;
  error?: string;
  ts: string;
}

const STATUS_ICON = {
  pass: <CheckCircle2 className="h-4 w-4 text-success" />,
  fail: <XCircle className="h-4 w-4 text-destructive" />,
  running: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  pending: <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />,
};

export default function PlatformUAT() {
  const { user, session } = useAuth();
  const { platformRole, isPlatformStaff, isPlatformSA, isPlatformDispatcher, isPlatformAdmin, loading: rolesLoading, error: rolesError } = usePlatformAuth();

  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = useCallback((log: Omit<RequestLog, 'ts'>) => {
    setLogs((prev) => [{ ...log, ts: new Date().toISOString() }, ...prev].slice(0, 20));
  }, []);

  const updateCheck = useCallback((name: string, update: Partial<CheckResult>) => {
    setChecks((prev) => prev.map((c) => (c.name === name ? { ...c, ...update } : c)));
  }, []);

  async function runAllChecks() {
    setRunning(true);
    const initial: CheckResult[] = [
      { name: 'Session', status: 'pending', detail: '' },
      { name: 'Platform roles', status: 'pending', detail: '' },
      { name: 'Incidents SELECT', status: 'pending', detail: '' },
      { name: 'Incident UPDATE (lifecycle)', status: 'pending', detail: '' },
    ];
    setChecks(initial);

    // 1) Session
    const sessionOk = !!session && !!user;
    updateCheck('Session', {
      status: sessionOk ? 'pass' : 'fail',
      detail: sessionOk ? `user_id: ${user!.id.slice(0, 12)}… | token: present` : 'No active session',
      ts: new Date().toISOString(),
    });

    // 2) Platform roles
    updateCheck('Platform roles', { status: 'running', detail: 'Loading…' });
    if (rolesError) {
      updateCheck('Platform roles', { status: 'fail', detail: rolesError, ts: new Date().toISOString() });
    } else if (rolesLoading) {
      updateCheck('Platform roles', { status: 'running', detail: 'Still loading…' });
    } else {
      updateCheck('Platform roles', {
        status: isPlatformStaff ? 'pass' : 'fail',
        detail: isPlatformStaff
          ? `Active role: ${platformRole} | SA:${isPlatformSA} Admin:${isPlatformAdmin} Disp:${isPlatformDispatcher}`
          : 'No platform role found',
        ts: new Date().toISOString(),
      });
    }

    // 3) Incidents SELECT
    updateCheck('Incidents SELECT', { status: 'running', detail: 'Fetching…' });
    const { data: incData, error: incErr, count } = await supabase
      .from('incidents')
      .select('id,status', { count: 'exact' })
      .limit(5);
    addLog({
      action: 'incidents.select',
      status: incErr ? (incErr.code ?? 'error') : 200,
      authenticated: !!session,
      error: incErr?.message,
    });
    if (incErr) {
      updateCheck('Incidents SELECT', { status: 'fail', detail: `${incErr.code}: ${incErr.message}`, ts: new Date().toISOString() });
    } else {
      updateCheck('Incidents SELECT', { status: 'pass', detail: `OK — ${count ?? incData?.length ?? 0} incidents visible`, ts: new Date().toISOString() });
    }

    // 4) Incident UPDATE test (pick first 'created' or any incident)
    updateCheck('Incident UPDATE (lifecycle)', { status: 'running', detail: 'Finding test incident…' });
    const canAct = isPlatformDispatcher || isPlatformAdmin || isPlatformSA;

    if (!incData || incData.length === 0) {
      updateCheck('Incident UPDATE (lifecycle)', { status: 'fail', detail: 'No incidents to test', ts: new Date().toISOString() });
    } else {
      // Try a no-op update (set updated_at to now) to test RLS
      const testInc = incData[0];
      const { error: updErr } = await supabase
        .from('incidents')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testInc.id);
      addLog({
        action: `incidents.update(${testInc.id.slice(0, 8)})`,
        status: updErr ? (updErr.code ?? 'error') : 204,
        authenticated: !!session,
        error: updErr?.message,
      });

      const isRlsDenied = updErr?.code === '42501' || updErr?.message?.includes('permission denied');
      if (updErr && !isRlsDenied) {
        updateCheck('Incident UPDATE (lifecycle)', { status: 'fail', detail: `Unexpected: ${updErr.message}`, ts: new Date().toISOString() });
      } else if (isRlsDenied && canAct) {
        updateCheck('Incident UPDATE (lifecycle)', { status: 'fail', detail: 'RLS 42501 — should have access but denied', ts: new Date().toISOString() });
      } else if (isRlsDenied && !canAct) {
        updateCheck('Incident UPDATE (lifecycle)', { status: 'pass', detail: 'Correctly denied (read-only role)', ts: new Date().toISOString() });
      } else if (!updErr && canAct) {
        updateCheck('Incident UPDATE (lifecycle)', { status: 'pass', detail: 'Update succeeded (role has write access)', ts: new Date().toISOString() });
      } else {
        updateCheck('Incident UPDATE (lifecycle)', { status: 'fail', detail: 'Update succeeded but role should be read-only!', ts: new Date().toISOString() });
      }
    }

    setRunning(false);
  }

  return (
    <AppLayout title="UAT — Проверка платформы">
      <div className="space-y-6 max-w-3xl">
        {/* Debug Panel: Session & Roles */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">🔍 Debug: Session & Roles</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-muted-foreground">Session:</span>
            <span className="text-foreground">{session ? '✅ Present' : '❌ Absent'}</span>

            <span className="text-muted-foreground">User ID:</span>
            <span className="font-mono text-foreground">{user?.id?.slice(0, 16) ?? '—'}…</span>

            <span className="text-muted-foreground">Email:</span>
            <span className="text-foreground">{user?.email ?? '—'}</span>

            <span className="text-muted-foreground">Access Token:</span>
            <span className="text-foreground">{session?.access_token ? '✅ Present (not shown)' : '❌ Missing'}</span>

            <span className="text-muted-foreground">Platform Role (primary):</span>
            <span className="text-foreground">{platformRole ?? 'none'}</span>

            <span className="text-muted-foreground">isPlatformStaff:</span>
            <Badge variant={isPlatformStaff ? 'success' : 'secondary'}>{String(isPlatformStaff)}</Badge>

            <span className="text-muted-foreground">isPlatformSA:</span>
            <span className="text-foreground">{String(isPlatformSA)}</span>

            <span className="text-muted-foreground">isPlatformAdmin:</span>
            <span className="text-foreground">{String(isPlatformAdmin)}</span>

            <span className="text-muted-foreground">isPlatformDispatcher:</span>
            <span className="text-foreground">{String(isPlatformDispatcher)}</span>

            <span className="text-muted-foreground">Roles loading:</span>
            <span className="text-foreground">{String(rolesLoading)}</span>

            <span className="text-muted-foreground">Roles error:</span>
            <span className="text-foreground">{rolesError ?? 'none'}</span>
          </div>
        </div>

        {/* Run UAT */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">🧪 UAT Checklist</h3>
            <button
              onClick={runAllChecks}
              disabled={running}
              className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Play className="h-4 w-4" />
              {running ? 'Выполняется…' : 'Запустить проверки'}
            </button>
          </div>

          {checks.length > 0 && (
            <div className="space-y-2">
              {checks.map((c) => (
                <div key={c.name} className="flex items-start gap-3 rounded-md border border-border p-3">
                  <div className="mt-0.5">{STATUS_ICON[c.status]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground break-all">{c.detail}</p>
                    {c.ts && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{c.ts}</p>}
                  </div>
                  <Badge variant={c.status === 'pass' ? 'success' : c.status === 'fail' ? 'destructive' : 'secondary'} className="shrink-0">
                    {c.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request Log */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">📡 Request Log (last 20)</h3>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">Запустите проверки, чтобы увидеть логи запросов.</p>
          ) : (
            <div className="space-y-1.5">
              {logs.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-mono rounded bg-muted/50 px-3 py-1.5">
                  <Badge variant={String(l.status).startsWith('2') ? 'success' : 'destructive'} className="text-[10px]">
                    {l.status}
                  </Badge>
                  <span className="text-foreground flex-1 truncate">{l.action}</span>
                  <span className="text-muted-foreground">{l.authenticated ? 'auth' : 'anon'}</span>
                  <span className="text-muted-foreground/60">{new Date(l.ts).toLocaleTimeString('ru')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
