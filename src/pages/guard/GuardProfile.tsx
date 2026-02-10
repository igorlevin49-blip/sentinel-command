import { Shield, MapPin, Phone, LogOut, CheckCircle2, XCircle, Building2, Headphones } from 'lucide-react';
import GuardMobileLayout from '@/components/guard/GuardMobileLayout';
import { guardProfile, guardAuditLog } from '@/data/guard-mock-data';
import { cn } from '@/lib/utils';

export default function GuardProfile() {
  const profile = guardProfile;

  return (
    <GuardMobileLayout title="Профиль">
      <div className="space-y-4 animate-fade-in">
        {/* Identity card */}
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-3 text-base font-bold text-foreground">{profile.fullName}</h2>
          <p className="text-xs text-muted-foreground">{profile.role}</p>
          <p className="mt-1 text-xs text-muted-foreground">{profile.phone}</p>
        </div>

        {/* Assignment */}
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Организация</p>
              <p className="text-sm text-foreground">{profile.organization}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Объект / Пост</p>
              <p className="text-sm text-foreground">{profile.objectAssignment} · {profile.postAssignment}</p>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Разрешения устройства</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">GPS-геолокация</span>
            {profile.gpsEnabled ? (
              <div className="flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /><span className="text-xs">Вкл</span></div>
            ) : (
              <div className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" /><span className="text-xs">Выкл</span></div>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">Уведомления</span>
            {profile.notificationsEnabled ? (
              <div className="flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /><span className="text-xs">Вкл</span></div>
            ) : (
              <div className="flex items-center gap-1 text-destructive"><XCircle className="h-4 w-4" /><span className="text-xs">Выкл</span></div>
            )}
          </div>
        </div>

        {/* Quick support */}
        <a
          href={`tel:${profile.dispatcherPhone}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
        >
          <Headphones className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Связь с диспетчером</p>
            <p className="text-xs text-muted-foreground">{profile.dispatcherPhone}</p>
          </div>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </a>

        {/* Audit log */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Журнал действий</p>
          </div>
          {guardAuditLog.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
              <div className={cn('h-2 w-2 rounded-full shrink-0', entry.synced ? 'bg-success' : 'bg-warning animate-status-pulse')} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{entry.details}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {!entry.synced && <span className="ml-1 text-warning">· Ожидание</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-3.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
          <LogOut className="h-4 w-4" />
          Выйти из системы
        </button>
      </div>
    </GuardMobileLayout>
  );
}
