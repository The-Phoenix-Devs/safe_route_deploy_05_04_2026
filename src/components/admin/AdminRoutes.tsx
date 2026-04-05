
import React, { useState } from 'react';
import RoutesList from './routes/RoutesList';
import RouteSearch from './routes/RouteSearch';
import AddRouteDialog from './routes/AddRouteDialog';
import EditRouteDialog from './routes/EditRouteDialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useRoutes } from './routes/useRoutes';
import { Route } from './routes/types';

const AdminRoutes: React.FC = () => {
  const {
    routes,
    drivers,
    searchTerm,
    setSearchTerm,
    handleAddRoute,
    handleUpdateRoute,
    handleDeleteRoute,
    loading,
  } = useRoutes();
  
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean, route: Route | null}>({open: false, route: null});

  const handleDeleteRouteConfirm = (id: string) => {
    const route = routes.find(r => r.id === id);
    if (route) {
      setDeleteConfirm({open: true, route});
    }
  };

  const confirmDeleteRoute = async () => {
    if (deleteConfirm.route) {
      await handleDeleteRoute(deleteConfirm.route.id);
      setDeleteConfirm({open: false, route: null});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Routes</h2>
        <div className="flex space-x-2">
          <RouteSearch 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />
          
          <AddRouteDialog 
            onAddRoute={handleAddRoute} 
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-muted-foreground">Loading routes...</div>
        </div>
      ) : (
        <RoutesList 
          routes={routes} 
          drivers={drivers} 
          onDelete={handleDeleteRouteConfirm}
          onEdit={setEditingRoute}
        />
      )}
      
      {editingRoute && (
        <EditRouteDialog
          route={editingRoute}
          onUpdate={handleUpdateRoute}
          trigger={null}
        />
      )}

      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({open, route: null})}
        title="Delete Route"
        description={`Are you sure you want to delete the route "${deleteConfirm.route?.name}"? Any drivers assigned to this route will be unassigned. This action cannot be undone.`}
        onConfirm={confirmDeleteRoute}
      />
    </div>
  );
};

export default AdminRoutes;
