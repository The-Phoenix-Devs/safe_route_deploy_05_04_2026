
import { useState, useEffect } from 'react';
import { useSupabaseRoutes } from '@/hooks/useSupabaseRoutes';
import { useSupabaseDrivers } from '@/hooks/useSupabaseDrivers';

export const useRoutes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { routes: allRoutes, loading, addRoute, updateRoute, deleteRoute } = useSupabaseRoutes();
  const { drivers } = useSupabaseDrivers();

  const filteredRoutes = allRoutes.filter(route => 
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    route.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRoute = async (newRouteData: {
    name: string;
    description: string;
    start_point: string;
    end_point: string;
  }) => {
    await addRoute(newRouteData);
  };

  const handleDeleteRoute = async (id: string) => {
    await deleteRoute(id);
  };

  const handleUpdateRoute = async (id: string, data: any) => {
    await updateRoute(id, data);
  };

  return {
    routes: filteredRoutes,
    drivers,
    searchTerm,
    setSearchTerm,
    handleAddRoute,
    handleUpdateRoute,
    handleDeleteRoute,
    loading,
  };
};
