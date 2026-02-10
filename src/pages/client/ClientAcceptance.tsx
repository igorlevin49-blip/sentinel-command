import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, ArrowRightLeft, Plus } from 'lucide-react';
import { acceptanceRecords, clientObjects } from '@/data/client-mock-data';
import type { AcceptanceRecord } from '@/data/client-mock-data';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function ClientAcceptance() {
  const [records, setRecords] = useState<AcceptanceRecord[]>(acceptanceRecords);
  const [showForm, setShowForm] = useState(false);
  const [formAction, setFormAction] = useState<'accept' | 'handover'>('accept');
  const [formObjectId, setFormObjectId] = useState(clientObjects[0]?.id ?? '');
  const [formComment, setFormComment] = useState('');

  const handleSubmit = () => {
    const obj = clientObjects.find((o) => o.id === formObjectId);
    if (!obj) return;
    const newRecord: AcceptanceRecord = {
      id: `acc-${Date.now()}`,
      objectId: formObjectId,
      objectName: obj.name,
      action: formAction,
      timestamp: new Date().toISOString(),
      performedBy: 'Смирнов И.П.',
      comment: formComment || '—',
    };
    setRecords([newRecord, ...records]);
    setShowForm(false);
    setFormComment('');
  };

  return (
    <AppLayout title="Приёмка / сдача объекта">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => { setFormAction('accept'); setShowForm(true); }}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" /> Принять объект
        </Button>
        <Button
          variant="outline"
          onClick={() => { setFormAction('handover'); setShowForm(true); }}
          className="gap-2"
        >
          <ArrowRightLeft className="h-4 w-4" /> Сдать объект
        </Button>
      </div>

      {/* Quick form */}
      {showForm && (
        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {formAction === 'accept' ? 'Приёмка объекта' : 'Сдача объекта'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Объект</label>
              <select
                value={formObjectId}
                onChange={(e) => setFormObjectId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {clientObjects.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Комментарий</label>
              <input
                type="text"
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Замечания..."
                className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleSubmit}>Подтвердить</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">История приёмок / сдач</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата/время</TableHead>
              <TableHead>Объект</TableHead>
              <TableHead>Действие</TableHead>
              <TableHead>Выполнил</TableHead>
              <TableHead>Комментарий</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{formatDateTime(r.timestamp)}</TableCell>
                <TableCell className="text-sm">{r.objectName}</TableCell>
                <TableCell>
                  <Badge variant={r.action === 'accept' ? 'success' : 'secondary'} className="text-[10px]">
                    {r.action === 'accept' ? 'Приёмка' : 'Сдача'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{r.performedBy}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.comment}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
