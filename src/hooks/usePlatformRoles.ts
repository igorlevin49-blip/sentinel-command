import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PlatformRoleEnum } from '@/contexts/PlatformAuthContext';

export interface PlatformRoleRow {
  id: string;
  user_id: string;
  role: PlatformRoleEnum;
  is_active: boolean;
  granted_by: string | null;
  created_at: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUuid(value: string): string | null {
  if (!value.trim()) return 'User ID обязателен';
  if (!UUID_RE.test(value.trim())) return 'Неверный формат UUID';
  return null;
}

export function usePlatformRoles() {
  const [rows, setRows] = useState<PlatformRoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('platform_roles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      setFetchError(
        error.code === '42501' ? 'Нет доступа к данным ролей' : error.message
      );
    } else {
      setRows((data as PlatformRoleRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  /** Upsert by (user_id, role) — uses update-or-insert pattern since DB has unique on (user_id, role) */
  const upsert = useCallback(
    async (userId: string, role: PlatformRoleEnum, isActive: boolean): Promise<string | null> => {
      const { error } = await supabase
        .from('platform_roles')
        .upsert(
          { user_id: userId.trim(), role, is_active: isActive },
          { onConflict: 'user_id,role' }
        );
      if (error) {
        return error.code === '42501' ? 'Нет прав для выполнения операции' : error.message;
      }
      return null;
    },
    []
  );

  const toggleActive = useCallback(async (id: string, current: boolean): Promise<string | null> => {
    const { error } = await supabase
      .from('platform_roles')
      .update({ is_active: !current })
      .eq('id', id);
    if (error) {
      return error.code === '42501' ? 'Нет прав для изменения' : error.message;
    }
    return null;
  }, []);

  return { rows, loading, fetchError, fetch, upsert, toggleActive };
}
