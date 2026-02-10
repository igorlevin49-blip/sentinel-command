import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShieldAlert } from 'lucide-react';
import { clientViolations, clientObjects } from '@/data/client-mock-data';

const typeLabels: Record<string, string> = {
  late_shift: 'Опоздание на смену',
  missed_shift: 'Пропуск смены',
  missed_checkpoint: 'Пропуск чекпоинта',
  late_checkpoint: 'Опоздание на чекпоинт',
};

const sevVariant: Record<string, 'default' | 'warning' | 'destructive'> = {
  low: 'default',
  medium: 'warning',
  high: 'destructive',
};

export default function ClientViolations() {
  const [filterObject, setFilterObject] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filtered = clientViolations.filter((v) => {
    if (filterObject !== 'all' && v.objectName !== filterObject) return false;
    if (filterType !== 'all' && v.type !== filterType) return false;
    return true;
  });

  return (
    <AppLayout title="Нарушения">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterObject}
          onChange={(e) => setFilterObject(e.target.value)}
          className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="all">Все объекты</option>
          {clientObjects.map((o) => (
            <option key={o.id} value={o.name}>{o.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="all">Все типы</option>
          <option value="late_shift">Опоздание на смену</option>
          <option value="missed_shift">Пропуск смены</option>
          <option value="missed_checkpoint">Пропуск чекпоинта</option>
          <option value="late_checkpoint">Опоздание на чекпоинт</option>
        </select>
      </div>

      {/* Violations count */}
      <div className="mt-4 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-warning" />
        <span className="text-sm text-muted-foreground">
          Найдено нарушений: <span className="font-mono font-bold text-foreground">{filtered.length}</span>
        </span>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Объект</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Охранник</TableHead>
              <TableHead>Серьёзность</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{v.date}</TableCell>
                <TableCell className="text-sm">{v.objectName}</TableCell>
                <TableCell className="text-xs">{typeLabels[v.type]}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">{v.description}</TableCell>
                <TableCell className="text-sm">{v.guardName}</TableCell>
                <TableCell>
                  <Badge variant={sevVariant[v.severity]} className="text-[10px]">
                    {v.severity === 'low' ? 'Низкая' : v.severity === 'medium' ? 'Средняя' : 'Высокая'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Нарушений не найдено
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
