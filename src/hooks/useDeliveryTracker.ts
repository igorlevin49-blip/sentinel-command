import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ItemArea = 'platform' | 'org' | 'incidents' | 'rbac' | 'rls' | 'ui' | 'db' | 'auth';
export type ItemType = 'epic' | 'issue' | 'task' | 'uat';
export type ItemStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type ItemPriority = 'p0' | 'p1' | 'p2' | 'p3';
export type CheckKind = 'dod' | 'uat' | 'github';
export type AlertSeverity = 'info' | 'warn' | 'critical';
export type AlertType = 'needs_github_action' | 'blocked' | 'p0_open' | 'rls_denied' | 'test_failed';

export interface DeliveryItem {
  id: string;
  created_at: string;
  updated_at: string;
  key: string;
  title: string;
  description: string | null;
  area: ItemArea;
  type: ItemType;
  status: ItemStatus;
  priority: ItemPriority;
  owner: string | null;
  parent_id: string | null;
  alert_count?: number;
}

export interface DeliveryCheck {
  id: string;
  item_id: string;
  kind: CheckKind;
  title: string;
  is_done: boolean;
  evidence_text: string | null;
  evidence_url: string | null;
  last_verified_at: string | null;
}

export interface DeliveryGithubLink {
  id: string;
  item_id: string;
  repo: string;
  issue_number: number | null;
  pr_number: number | null;
  url: string | null;
}

export interface DeliveryAlert {
  id: string;
  created_at: string;
  resolved_at: string | null;
  severity: AlertSeverity;
  type: AlertType;
  item_id: string | null;
  message: string;
  action_url: string | null;
  is_active: boolean;
}

function mapError(err: { code?: string; message?: string }): string {
  if (err.code === '42501' || err.message?.includes('42501')) return 'Нет доступа';
  return err.message ?? 'Неизвестная ошибка';
}

// ─── Items ────────────────────────────────────────────────────────────────────

export function useDeliveryItems() {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('delivery_items')
      .select('*')
      .order('priority', { ascending: true })
      .order('updated_at', { ascending: false })
      .limit(500);
    if (err) {
      setError(mapError(err));
    } else {
      setItems((data as DeliveryItem[]) ?? []);
    }
    setLoading(false);
  }, []);

  const createItem = useCallback(async (item: Omit<DeliveryItem, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
    const { error: err } = await supabase.from('delivery_items').insert(item);
    return err ? mapError(err) : null;
  }, []);

  const updateItem = useCallback(async (id: string, patch: Partial<DeliveryItem>): Promise<string | null> => {
    const { error: err } = await supabase.from('delivery_items').update(patch).eq('id', id);
    return err ? mapError(err) : null;
  }, []);

  return { items, loading, error, fetchItems, createItem, updateItem };
}

// ─── Checks ───────────────────────────────────────────────────────────────────

export function useDeliveryChecks(itemId: string | null) {
  const [checks, setChecks] = useState<DeliveryCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChecks = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    const { data } = await supabase
      .from('delivery_checks')
      .select('*')
      .eq('item_id', itemId)
      .order('kind')
      .order('title');
    setChecks((data as DeliveryCheck[]) ?? []);
    setLoading(false);
  }, [itemId]);

  const upsertCheck = useCallback(async (check: Partial<DeliveryCheck> & { item_id: string; kind: CheckKind; title: string }): Promise<string | null> => {
    const { error: err } = await supabase.from('delivery_checks').upsert(check);
    return err ? mapError(err) : null;
  }, []);

  const toggleCheck = useCallback(async (id: string, current: boolean): Promise<string | null> => {
    const { error: err } = await supabase
      .from('delivery_checks')
      .update({ is_done: !current, last_verified_at: !current ? new Date().toISOString() : null })
      .eq('id', id);
    return err ? mapError(err) : null;
  }, []);

  const addCheck = useCallback(async (item_id: string, kind: CheckKind, title: string): Promise<string | null> => {
    const { error: err } = await supabase.from('delivery_checks').insert({ item_id, kind, title, is_done: false });
    return err ? mapError(err) : null;
  }, []);

  const deleteCheck = useCallback(async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('delivery_checks').delete().eq('id', id);
    return err ? mapError(err) : null;
  }, []);

  return { checks, loading, fetchChecks, upsertCheck, toggleCheck, addCheck, deleteCheck };
}

// ─── GitHub links ─────────────────────────────────────────────────────────────

export function useDeliveryGithubLinks(itemId: string | null) {
  const [links, setLinks] = useState<DeliveryGithubLink[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLinks = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    const { data } = await supabase
      .from('delivery_github_links')
      .select('*')
      .eq('item_id', itemId);
    setLinks((data as DeliveryGithubLink[]) ?? []);
    setLoading(false);
  }, [itemId]);

  const addLink = useCallback(async (link: Omit<DeliveryGithubLink, 'id'>): Promise<string | null> => {
    const { error: err } = await supabase.from('delivery_github_links').insert(link);
    return err ? mapError(err) : null;
  }, []);

  const deleteLink = useCallback(async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('delivery_github_links').delete().eq('id', id);
    return err ? mapError(err) : null;
  }, []);

  return { links, loading, fetchLinks, addLink, deleteLink };
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export function useDeliveryAlerts() {
  const [alerts, setAlerts] = useState<DeliveryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('delivery_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) {
      setError(mapError(err));
    } else {
      setAlerts((data as DeliveryAlert[]) ?? []);
    }
    setLoading(false);
  }, []);

  const createAlert = useCallback(async (alert: Omit<DeliveryAlert, 'id' | 'created_at' | 'resolved_at'>): Promise<string | null> => {
    const { error: err } = await supabase.from('delivery_alerts').insert(alert);
    return err ? mapError(err) : null;
  }, []);

  const resolveAlert = useCallback(async (id: string): Promise<string | null> => {
    const { error: err } = await supabase
      .from('delivery_alerts')
      .update({ is_active: false, resolved_at: new Date().toISOString() })
      .eq('id', id);
    return err ? mapError(err) : null;
  }, []);

  const activeCount = alerts.length;

  return { alerts, loading, error, activeCount, fetchAlerts, createAlert, resolveAlert };
}

// ─── Auto-alert logic ─────────────────────────────────────────────────────────

export async function ensureAutoAlerts(item: DeliveryItem): Promise<void> {
  // P0 open alert
  if (item.priority === 'p0' && item.status !== 'done') {
    await supabase.from('delivery_alerts').upsert(
      {
        severity: 'critical',
        type: 'p0_open',
        item_id: item.id,
        message: `P0: "${item.title}" (${item.key}) — статус: ${item.status}. Требует немедленного внимания.`,
        is_active: true,
      },
      // No conflict target on delivery_alerts, so just insert if not exists
    );
  }
  // Blocked alert
  if (item.status === 'blocked') {
    await supabase.from('delivery_alerts').insert({
      severity: 'warn',
      type: 'blocked',
      item_id: item.id,
      message: `Задача заблокирована: "${item.title}" (${item.key})`,
      is_active: true,
    });
  }
}
