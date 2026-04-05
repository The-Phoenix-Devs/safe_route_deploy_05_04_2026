
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Route } from './types';

interface AddRouteFormProps {
  onAddRoute: (route: Omit<Route, 'id'>) => void;
}

const AddRouteForm: React.FC<AddRouteFormProps> = ({ onAddRoute }) => {
  const [newRoute, setNewRoute] = useState<Omit<Route, 'id'>>({
    name: '',
    description: '',
    start_point: '',
    end_point: ''
  });

  const handleSubmit = () => {
    onAddRoute(newRoute);
    
    // Reset the form
    setNewRoute({
      name: '',
      description: '',
      start_point: '',
      end_point: ''
    });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Route Name</Label>
        <Input 
          id="name" 
          value={newRoute.name}
          onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description"
          value={newRoute.description}
          onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
          rows={2}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startPoint">Start Point</Label>
          <Input 
            id="startPoint" 
            value={newRoute.start_point}
            onChange={(e) => setNewRoute({...newRoute, start_point: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endPoint">End Point</Label>
          <Input 
            id="endPoint" 
            value={newRoute.end_point}
            onChange={(e) => setNewRoute({...newRoute, end_point: e.target.value})}
          />
        </div>
      </div>
      
      <Button onClick={handleSubmit} className="w-full">
        Add Route
      </Button>
    </div>
  );
};

export default AddRouteForm;
