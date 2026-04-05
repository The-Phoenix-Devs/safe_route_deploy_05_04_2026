
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import AddRouteForm from './AddRouteForm';
import { Route } from './types';

interface AddRouteDialogProps {
  onAddRoute: (route: Omit<Route, 'id'>) => void;
}

const AddRouteDialog: React.FC<AddRouteDialogProps> = ({ onAddRoute }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddRoute = (route: Omit<Route, 'id'>) => {
    onAddRoute(route);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Route
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Transport Route</DialogTitle>
        </DialogHeader>
        <AddRouteForm onAddRoute={handleAddRoute} />
      </DialogContent>
    </Dialog>
  );
};

export default AddRouteDialog;
