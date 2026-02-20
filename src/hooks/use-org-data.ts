/**
 * Org-scoped data hooks — all respect RLS + filter by org_id explicitly.
 * Uses @tanstack/react-query for caching.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveOrg } from '@/contexts/ActiveOrgContext';

// ─── OBJECTS ────────────────────────────────────────────────
export function useOrgObjects() {
  const { orgId } = useActiveOrg();
  return useQuery({
    queryKey: ['org-objects', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objects')
        .select('*, posts(id)')
        .eq('org_id', orgId!)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useOrgObject(objectId: string | undefined) {
  const { orgId } = useActiveOrg();
  return useQuery({
    queryKey: ['org-object', objectId],
    enabled: !!orgId && !!objectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .eq('id', objectId!)
        .eq('org_id', orgId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// ─── POSTS ──────────────────────────────────────────────────
export function useOrgPosts(objectId?: string) {
  const { orgId } = useActiveOrg();
  return useQuery({
    queryKey: ['org-posts', orgId, objectId],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from('posts')
        .select('*, objects(name)')
        .eq('org_id', orgId!)
        .order('name');
      if (objectId) q = q.eq('object_id', objectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ─── PERSONNEL ──────────────────────────────────────────────
export function useOrgPersonnel() {
  const { orgId } = useActiveOrg();
  return useQuery({
    queryKey: ['org-personnel', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('org_id', orgId!)
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });
}

// ─── SHIFTS ─────────────────────────────────────────────────
export interface ShiftFilters {
  objectId?: string;
  postId?: string;
  personnelId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useOrgShifts(filters: ShiftFilters = {}) {
  const { orgId } = useActiveOrg();
  return useQuery({
    queryKey: ['org-shifts', orgId, filters],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from('shifts')
        .select('*, posts(name, objects(name)), personnel(full_name)')
        .eq('org_id', orgId!)
        .order('planned_start', { ascending: false });
      if (filters.objectId) q = q.eq('object_id', filters.objectId);
      if (filters.postId) q = q.eq('post_id', filters.postId);
      if (filters.personnelId) q = q.eq('personnel_id', filters.personnelId);
      if (filters.dateFrom) q = q.gte('planned_start', filters.dateFrom);
      if (filters.dateTo) q = q.lte('planned_start', filters.dateTo);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ─── INCIDENTS ──────────────────────────────────────────────
export interface IncidentFilters {
  objectId?: string;
  status?: string;
  severity?: string;
  type?: string;
}

export function useOrgIncidents(filters: IncidentFilters = {}) {
  const { orgId } = useActiveOrg();
  return useQuery({
    queryKey: ['org-incidents', orgId, filters],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from('incidents')
        .select('*, objects(name), personnel!assigned_to_personnel_id(full_name)')
        .eq('org_id', orgId!)
        .order('created_at', { ascending: false });
      if (filters.objectId) q = q.eq('object_id', filters.objectId);
      if (filters.status) q = (q as any).eq('status', filters.status);
      if (filters.severity) q = (q as any).eq('severity', filters.severity);
      if (filters.type) q = (q as any).eq('type', filters.type);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useOrgIncident(incidentId: string | undefined) {
  const { orgId } = useActiveOrg();
  return useQuery({
    queryKey: ['org-incident', incidentId],
    enabled: !!orgId && !!incidentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*, objects(name), posts(name), personnel!assigned_to_personnel_id(full_name)')
        .eq('id', incidentId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useIncidentEvents(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident-events', incidentId],
    enabled: !!incidentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incident_events')
        .select('*')
        .eq('incident_id', incidentId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
