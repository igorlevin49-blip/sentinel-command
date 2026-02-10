import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useObjects() {
  return useQuery({
    queryKey: ['objects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objects')
        .select('*, posts(id)')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*, objects(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useShifts() {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*, posts(name, objects(name)), personnel(full_name)')
        .order('planned_start', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePatrolRoutes() {
  return useQuery({
    queryKey: ['patrol_routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patrol_routes')
        .select('*, objects(name), patrol_checkpoints(id)')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function usePatrolRuns() {
  return useQuery({
    queryKey: ['patrol_runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patrol_runs')
        .select('*, patrol_routes(name, objects(name), patrol_checkpoints(id)), shifts(personnel(full_name)), patrol_events(id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
