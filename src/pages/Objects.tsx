import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { mockObjects } from '@/data/mock-data';
import { Building2, Search, Filter, MapPin, Users, ShieldAlert } from 'lucide-react';
import type { ObjectRiskLevel } from '@/types/soms';

const riskLabels: Record<ObjectRiskLevel, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

const riskVariant: Record<ObjectRiskLevel, 'success' | 'warning' | 'destructive' | 'default'> = {
  low: 'success',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
};

export default function Objects() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<ObjectRiskLevel | 'all'>('all');

  const filtered = mockObjects.filter((obj) => {
    const matchesSearch =
      obj.name.toLowerCase().includes(search.toLowerCase()) ||
      obj.address.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === 'all' || obj.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const riskOptions: { value: ObjectRiskLevel | 'all'; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'low', label: 'Низкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'high', label: 'Высокий' },
    { value: 'critical', label: 'Критический' },
  ];

  return (
    <AppLayout title="Объекты охраны">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск по объектам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-72 rounded-md border border-border bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {riskOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRiskFilter(opt.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  riskFilter === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{filtered.length}</span> объектов
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((obj, i) => (
          <div
            key={obj.id}
            className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30 animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  obj.status === 'active' ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <Building2 className={`h-5 w-5 ${obj.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{obj.name}</h3>
                  <p className="text-xs text-muted-foreground">{obj.type}</p>
                </div>
              </div>
              <Badge
                variant={obj.status === 'active' ? 'success' : 'secondary'}
                className="text-[10px] px-1.5 py-0"
              >
                {obj.status === 'active' ? 'Активен' : 'Неактивен'}
              </Badge>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{obj.address}</span>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                <Badge variant={riskVariant[obj.riskLevel]} className="text-[10px] px-1.5 py-0">
                  {riskLabels[obj.riskLevel]}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="font-mono">{obj.personnelCount}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-mono">{obj.postsCount}</span> постов
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Режим: {obj.workingMode}</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}