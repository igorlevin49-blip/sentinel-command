import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null | { code?: string; message?: string } | unknown;
  className?: string;
}

export function ErrorDisplay({ error, className }: ErrorDisplayProps) {
  if (!error) return null;

  let message = 'Произошла ошибка';
  if (typeof error === 'string') {
    message = error.includes('42501') || error.includes('permission') || error.includes('denied')
      ? 'Нет доступа'
      : error;
  } else if (error && typeof error === 'object') {
    const e = error as { code?: string; message?: string };
    if (e.code === '42501' || e.code === 'PGRST301') {
      message = 'Нет доступа';
    } else {
      message = e.message ?? 'Произошла ошибка';
    }
  }

  return (
    <div className={`rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3 ${className ?? ''}`}>
      <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

export function formatSupabaseError(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') {
    return error.includes('42501') ? 'Нет доступа' : error;
  }
  const e = error as { code?: string; message?: string };
  if (e.code === '42501' || e.code === 'PGRST301') return 'Нет доступа';
  return e.message ?? 'Произошла ошибка';
}
