import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { mockPersonnel } from '@/data/mock-data';
import { Search, Phone, MapPin, Shield } from 'lucide-react';
import type { UserRole } from '@/types/soms';

const roleLabels: Record<UserRole, string> = {
  super_admin: 'QOR Админ',
  org_admin: 'Администратор',
  dispatcher: 'Диспетчер',
  chief: 'Нач. охраны',
  guard: 'Охранник',
  client: 'Заказчик',
};

const roleVariant: Record<UserRole, 'default' | 'secondary' | 'warning' | 'success' | 'destructive'> = {
  super_admin: 'destructive',
  org_admin: 'default',
  dispatcher: 'warning',
  chief: 'default',
  guard: 'secondary',
  client: 'secondary',
};

const statusLabels = {
  on_duty: 'На смене',
  off_duty: 'Вне смены',
  on_leave: 'Отпуск',
} as const;

const statusVariant = {
  on_duty: 'success' as const,
  off_duty: 'secondary' as const,
  on_leave: 'warning' as const,
};

export default function PersonnelPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const filtered = mockPersonnel.filter((p) => {
    const fullName = `${p.lastName} ${p.firstName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      (p.objectName || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleOptions: { value: UserRole | 'all'; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'org_admin', label: 'Админ' },
    { value: 'dispatcher', label: 'Диспетчер' },
    { value: 'chief', label: 'Нач. охраны' },
    { value: 'guard', label: 'Охранник' },
  ];

  return (
    <AppLayout title="Персонал">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск по персоналу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-72 rounded-md border border-border bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {roleOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRoleFilter(opt.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  roleFilter === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            На смене: <span className="font-mono font-semibold text-success">{mockPersonnel.filter(p => p.status === 'on_duty').length}</span>
          </span>
          <span>
            Всего: <span className="font-mono font-semibold text-foreground">{mockPersonnel.length}</span>
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((person, i) => (
          <div
            key={person.id}
            className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                person.status === 'on_duty' ? 'bg-success/10' : 'bg-muted'
              }`}>
                <Shield className={`h-5 w-5 ${
                  person.status === 'on_duty' ? 'text-success' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {person.lastName} {person.firstName}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant={roleVariant[person.role]} className="text-[10px] px-1.5 py-0">
                    {roleLabels[person.role]}
                  </Badge>
                  <Badge variant={statusVariant[person.status]} className="text-[10px] px-1.5 py-0">
                    {statusLabels[person.status]}
                  </Badge>
                </div>
              </div>
            </div>

            {(person.objectName || person.postName) && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {person.postName && `${person.postName} — `}{person.objectName}
                </span>
              </div>
            )}

            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="font-mono">{person.phone}</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}