import { AppLayout } from '@/components/layout/AppLayout';
import { BarChart3 } from 'lucide-react';

export default function SuperAdminAnalytics() {
  return (
    <AppLayout title="Аналитика">
      <div className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Кросс-организационная аналитика</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Агрегированные отчёты и метрики по всем организациям платформы.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-foreground">Раздел в разработке</p>
          <p className="text-sm text-muted-foreground mt-1">
            Здесь будут отображаться графики и отчёты по инцидентам, SLA и объектам.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
