import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Route {
  id: string;
  name: string;
  description: string;
  start_point: string;
  end_point: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRouteData {
  name: string;
  description: string;
  start_point: string;
  end_point: string;
}

export const useSupabaseRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch routes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addRoute = async (routeData: CreateRouteData) => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .insert([routeData])
        .select()
        .single();

      if (error) throw error;

      setRoutes(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Route added successfully',
      });

      return data;
    } catch (error) {
      console.error('Error adding route:', error);
      toast({
        title: 'Error',
        description: 'Failed to add route',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteRoute = async (id: string) => {
    try {
      // First check if any drivers are assigned to this route
      const { data: assignedDrivers, error: driversError } = await supabase
        .from('drivers')
        .select('id, name')
        .eq('route_id', id);

      if (driversError) throw driversError;

      if (assignedDrivers && assignedDrivers.length > 0) {
        // Unassign drivers from this route before deleting
        const { error: updateError } = await supabase
          .from('drivers')
          .update({ route_id: null })
          .eq('route_id', id);

        if (updateError) throw updateError;
      }

      // Now delete the route
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRoutes(prev => prev.filter(route => route.id !== id));
      toast({
        title: 'Success',
        description: `Route deleted successfully${assignedDrivers && assignedDrivers.length > 0 ? ` and ${assignedDrivers.length} driver(s) unassigned` : ''}`,
      });
    } catch (error) {
      console.error('Error deleting route:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete route',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const updateRoute = async (id: string, routeData: Partial<CreateRouteData>) => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .update(routeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRoutes(prev => prev.map(route => 
        route.id === id ? { ...route, ...data } : route
      ));
      
      toast({
        title: 'Success',
        description: 'Route updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating route:', error);
      toast({
        title: 'Error',
        description: 'Failed to update route',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    routes,
    loading,
    addRoute,
    updateRoute,
    deleteRoute,
    refetch: fetchRoutes,
  };
};