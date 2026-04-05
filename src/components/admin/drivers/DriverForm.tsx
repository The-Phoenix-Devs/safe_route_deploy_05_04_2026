
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { DriverFormData } from './types';
import { useToast } from '@/components/ui/use-toast';

interface DriverFormProps {
  onAddDriver: (driverData: DriverFormData) => Promise<any>;
}

const DriverForm: React.FC<DriverFormProps> = ({ onAddDriver }) => {
  const [newDriver, setNewDriver] = useState<DriverFormData>({
    name: '',
    phone: '',
    license: '',
    busNumber: '',
    status: 'active',
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddDriver = async () => {
    // Validation
    if (!newDriver.name || !newDriver.phone || !newDriver.license || !newDriver.busNumber) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onAddDriver(newDriver);
      // Reset form
      setNewDriver({
        name: '',
        phone: '',
        license: '',
        busNumber: '',
        status: 'active',
      });
      setIsOpen(false);
      
      toast({
        title: "Success",
        description: "Driver added successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add driver"
      });
      console.error("Error adding driver:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={newDriver.name}
              onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              value={newDriver.phone}
              onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license">License</Label>
            <Input 
              id="license" 
              value={newDriver.license}
              onChange={(e) => setNewDriver({...newDriver, license: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="busNumber">Bus Number</Label>
            <Input 
              id="busNumber" 
              value={newDriver.busNumber}
              onChange={(e) => setNewDriver({...newDriver, busNumber: e.target.value})}
            />
          </div>
          <Button 
            onClick={handleAddDriver} 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Driver"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DriverForm;
