import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Route } from './types';

interface EditRouteDialogProps {
  route: Route;
  onUpdate: (id: string, data: Partial<Route>) => Promise<void>;
  trigger?: React.ReactNode;
}

const EditRouteDialog: React.FC<EditRouteDialogProps> = ({
  route,
  onUpdate,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: route.name,
    description: route.description || '',
    start_point: route.start_point,
    end_point: route.end_point,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onUpdate(route.id, formData);
      setOpen(false);
    } catch (error) {
      console.error('Error updating route:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Edit Route</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Route</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Route Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter route name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter route description"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="start_point">Start Point</Label>
            <Input
              id="start_point"
              value={formData.start_point}
              onChange={(e) => setFormData({ ...formData, start_point: e.target.value })}
              placeholder="Enter start point"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end_point">End Point</Label>
            <Input
              id="end_point"
              value={formData.end_point}
              onChange={(e) => setFormData({ ...formData, end_point: e.target.value })}
              placeholder="Enter end point"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Route'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRouteDialog;